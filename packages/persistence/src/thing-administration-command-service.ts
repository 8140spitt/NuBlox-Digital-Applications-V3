import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  evaluateMetadataConstraint,
  initialiseObjectLifecycle,
  type CanonicalObjectId,
  type CanonicalObjectIdentity,
  type CanonicalRelationshipId,
  type LifecycleDefinition,
  type LifecycleStateDefinition,
  type MetadataCardinality,
  type MetadataConstraintType,
  type MetadataDataType,
  type MetadataRelationshipCardinality,
  type ObjectLifecycleState,
  type RelationshipAttributeAssignment,
  type RelationshipAttributeConstraintAssignment,
  type RelationshipTypeDefinition,
  type TenantId,
  type Thing,
  type ThingRelationship
} from '@nublox/kernel';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';

interface TypeRow extends RowDataPacket {
  id:string; tenant_id:string; code:string; name:string; object_family:string;
  parent_type_definition_id:string|null; lifecycle_definition_id:string|null; creation_policy_reference:string|null;
  status:'ACTIVE'|'INACTIVE'; effective_from:Date|null; effective_to:Date|null;
}
interface AssignmentRow extends RowDataPacket {
  id:string; type_definition_id:string; attribute_definition_id:string; required:number;
  cardinality:MetadataCardinality; data_type:MetadataDataType;
  enumeration_definition_id:string|null; reference_object_family:string|null; default_value:unknown; status:'ACTIVE'|'INACTIVE';
}
interface RelationshipTypeRow extends RowDataPacket {
  id:string; tenant_id:string; code:string; name:string; description:string|null;
  from_type_definition_id:string; to_type_definition_id:string;
  from_cardinality:MetadataRelationshipCardinality; to_cardinality:MetadataRelationshipCardinality;
  inverse_name:string|null; version:number; effective_from:Date|null; effective_to:Date|null;
  status:'ACTIVE'|'INACTIVE';
}
interface RelationshipAssignmentRow extends RowDataPacket {
  id:string; relationship_type_definition_id:string; attribute_definition_id:string;
  required:number; cardinality:MetadataCardinality; data_type:MetadataDataType;
  enumeration_definition_id:string|null; reference_object_family:string|null; default_value:unknown; status:'ACTIVE'|'INACTIVE';
}
interface ThingRow extends RowDataPacket {
  id:string; tenant_id:string; object_type:string; type_definition_id:string|null; stable_key:string;
  display_name:string|null; status:'ACTIVE'|'INACTIVE'; created_at:Date;
}
interface CountRow extends RowDataPacket { count:number|string; }
interface EnumRow extends RowDataPacket { id:string; enumeration_definition_id:string; status:'ACTIVE'|'INACTIVE'; }
interface ReferenceRow extends RowDataPacket {
  id:string; type_definition_id:string|null; object_family:string|null; status:'ACTIVE'|'INACTIVE';
}
interface ConstraintRuntimeRow extends RowDataPacket {
  code:string; constraint_type:MetadataConstraintType; configuration:unknown; mandatory:number;
}
interface LifecycleDefinitionRow extends RowDataPacket {
  id:string;tenant_id:string;code:string;name:string;object_type:string;status:'ACTIVE'|'INACTIVE';
}
interface LifecycleStateRow extends RowDataPacket {
  id:string;tenant_id:string;lifecycle_definition_id:string;code:string;name:string;
  category:LifecycleStateDefinition['category'];is_initial:number;is_terminal:number;status:'ACTIVE'|'INACTIVE';
}

export class ThingAdministrationCommandError extends Error {
  constructor(
    message:string,
    readonly code:'PERMISSION_DENIED'|'INVALID_INPUT'|'NOT_FOUND'|'CONFLICT'
  ){
    super(message);
    this.name='ThingAdministrationCommandError';
  }
}

function required(value:string|undefined,label:string):string{
  const result=value?.trim()??'';
  if(!result) throw new ThingAdministrationCommandError(`${label} is required.`,'INVALID_INPUT');
  return result;
}
function optional(value:string|undefined):string|undefined{
  const result=value?.trim()??'';
  return result||undefined;
}
function integer(value:number|undefined,label:string,minimum=0):number{
  if(!Number.isInteger(value)||Number(value)<minimum){
    throw new ThingAdministrationCommandError(`${label} must be an integer >= ${minimum}.`,'INVALID_INPUT');
  }
  return Number(value);
}
function isoDate(value:string|undefined,label:string,defaultNow=false):string{
  const raw=optional(value);
  const parsed=raw?new Date(raw):(defaultNow?new Date():undefined);
  if(!parsed||Number.isNaN(parsed.getTime())){
    throw new ThingAdministrationCommandError(`${label} must be a valid date/time.`,'INVALID_INPUT');
  }
  return parsed.toISOString();
}
function duplicate(error:unknown):boolean{
  return typeof error==='object'&&error!==null&&'code' in error&&(error as {code?:string}).code==='ER_DUP_ENTRY';
}
function mapError(error:unknown):never{
  if(error instanceof ThingAdministrationCommandError) throw error;
  if(duplicate(error)){
    throw new ThingAdministrationCommandError('An equivalent Thing or relationship already exists.','CONFLICT');
  }
  if(error instanceof Error&&/not found/i.test(error.message)){
    throw new ThingAdministrationCommandError(error.message,'NOT_FOUND');
  }
  if(error instanceof Error&&/must|required|invalid|active|cardinality|type|reference|inherit/i.test(error.message)){
    throw new ThingAdministrationCommandError(error.message,'INVALID_INPUT');
  }
  throw error;
}

type TypedColumns={
  stringValue:string|null;
  integerValue:number|null;
  decimalValue:string|null;
  booleanValue:boolean|null;
  dateValue:string|null;
  datetimeValue:Date|null;
  enumerationValueId:string|null;
  referenceObjectId:string|null;
  jsonValue:string|null;
};

const emptyTyped=():TypedColumns=>({
  stringValue:null,integerValue:null,decimalValue:null,booleanValue:null,dateValue:null,
  datetimeValue:null,enumerationValueId:null,referenceObjectId:null,jsonValue:null
});

function parsedJson(value:unknown):unknown{
  if(typeof value!=='string') return value;
  try{return JSON.parse(value);}catch{return value;}
}

export class MySqlThingAdministrationCommandService {
  private readonly access:MySqlAccessRepository;
  constructor(private readonly pool:Pool){
    this.access=new MySqlAccessRepository(pool);
  }

  async createRelationshipTypeDefinition(
    tenantId:TenantId,
    actorPersonId:string,
    input:{
      code:string; name:string; description?:string;
      fromTypeDefinitionId:string; toTypeDefinitionId:string;
      fromCardinality?:MetadataRelationshipCardinality;
      toCardinality?:MetadataRelationshipCardinality;
      inverseName?:string; version?:number; effectiveFrom?:string; effectiveTo?:string;
    }
  ):Promise<RelationshipTypeDefinition>{
    await this.requireManage(tenantId,actorPersonId);
    const fromCardinality=input.fromCardinality??'MANY';
    const toCardinality=input.toCardinality??'MANY';
    if(!['ONE','MANY'].includes(fromCardinality)||!['ONE','MANY'].includes(toCardinality)){
      throw new ThingAdministrationCommandError('Relationship cardinality must be ONE or MANY.','INVALID_INPUT');
    }
    const effectiveFrom=optional(input.effectiveFrom);
    const effectiveTo=optional(input.effectiveTo);
    if(effectiveFrom) isoDate(effectiveFrom,'Effective from');
    if(effectiveTo) isoDate(effectiveTo,'Effective to');
    if(effectiveFrom&&effectiveTo&&Date.parse(effectiveTo)<Date.parse(effectiveFrom)){
      throw new ThingAdministrationCommandError('Relationship type effective period is invalid.','INVALID_INPUT');
    }

    try{
      return await withTransaction(this.pool,async connection=>{
        const [fromType,toType]=await Promise.all([
          this.requireType(connection,tenantId,required(input.fromTypeDefinitionId,'From Type')),
          this.requireType(connection,tenantId,required(input.toTypeDefinitionId,'To Type'))
        ]);
        const description=optional(input.description);
        const inverseName=optional(input.inverseName);
        const item:RelationshipTypeDefinition={
          id:asId<'RelationshipTypeDefinitionId'>(`RELTYPE-${randomUUID()}`,'Relationship Type Definition'),
          tenantId,
          code:required(input.code,'Relationship type code').toUpperCase(),
          name:required(input.name,'Relationship type name'),
          ...(description?{description}:{}),
          fromTypeDefinitionId:fromType.id as RelationshipTypeDefinition['fromTypeDefinitionId'],
          toTypeDefinitionId:toType.id as RelationshipTypeDefinition['toTypeDefinitionId'],
          fromCardinality,toCardinality,
          ...(inverseName?{inverseName}:{}),
          version:integer(input.version??1,'Version',1),
          ...(effectiveFrom?{effectiveFrom}:{}),
          ...(effectiveTo?{effectiveTo}:{}),
          status:'ACTIVE'
        };
        await connection.execute(
          `INSERT INTO metadata_relationship_type_definitions
            (id,tenant_id,code,name,description,from_type_definition_id,to_type_definition_id,
             from_cardinality,to_cardinality,inverse_name,version,effective_from,effective_to,status,
             created_by_person_id,updated_by_person_id)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [item.id,tenantId,item.code,item.name,item.description??null,item.fromTypeDefinitionId,
           item.toTypeDefinitionId,item.fromCardinality,item.toCardinality,item.inverseName??null,item.version,
           item.effectiveFrom?new Date(item.effectiveFrom):null,item.effectiveTo?new Date(item.effectiveTo):null,
           item.status,actorPersonId,actorPersonId]
        );
        await this.audit(connection,tenantId,'RELATIONSHIP_TYPE_DEFINITION',item.id,'CREATED',actorPersonId,item);
        return item;
      });
    }catch(error){return mapError(error);}
  }

  async assignAttributeToRelationshipType(
    tenantId:TenantId,
    actorPersonId:string,
    input:{
      relationshipTypeDefinitionId:string; attributeDefinitionId:string; sequence?:number;
      required?:boolean; cardinality?:MetadataCardinality; localLabel?:string; defaultValue?:unknown;
    }
  ):Promise<RelationshipAttributeAssignment>{
    await this.requireManage(tenantId,actorPersonId);
    const cardinality=input.cardinality??'SINGLE';
    if(!['SINGLE','MULTIPLE'].includes(cardinality)){
      throw new ThingAdministrationCommandError('Relationship attribute cardinality is invalid.','INVALID_INPUT');
    }
    try{
      return await withTransaction(this.pool,async connection=>{
        await this.requireRelationshipType(connection,tenantId,required(input.relationshipTypeDefinitionId,'Relationship Type'));
        const [attrs]=await connection.execute<(RowDataPacket&{id:string})[]>(
          `SELECT id FROM metadata_attribute_definitions
            WHERE tenant_id=? AND id=? AND status='ACTIVE'`,
          [tenantId,required(input.attributeDefinitionId,'Attribute Definition')]
        );
        if(!attrs[0]) throw new ThingAdministrationCommandError('Attribute Definition was not found or inactive.','NOT_FOUND');
        const localLabel=optional(input.localLabel);
        const item:RelationshipAttributeAssignment={
          id:asId<'RelationshipAttributeAssignmentId'>(`RELATTR-${randomUUID()}`,'Relationship Attribute Assignment'),
          tenantId,
          relationshipTypeDefinitionId:asId<'RelationshipTypeDefinitionId'>(input.relationshipTypeDefinitionId,'Relationship Type'),
          attributeDefinitionId:asId<'AttributeDefinitionId'>(input.attributeDefinitionId,'Attribute Definition'),
          sequence:integer(input.sequence??0,'Sequence'),
          required:input.required??false,
          cardinality,
          ...(localLabel?{localLabel}:{}),
          ...(input.defaultValue!==undefined?{defaultValue:input.defaultValue}:{}),
          status:'ACTIVE'
        };
        await connection.execute(
          `INSERT INTO metadata_relationship_attribute_assignments
            (id,tenant_id,relationship_type_definition_id,attribute_definition_id,sequence_no,
             required,cardinality,local_label,default_value,status,created_by_person_id,updated_by_person_id)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
          [item.id,tenantId,item.relationshipTypeDefinitionId,item.attributeDefinitionId,item.sequence,
           item.required,item.cardinality,item.localLabel??null,
           item.defaultValue===undefined?null:JSON.stringify(item.defaultValue),item.status,actorPersonId,actorPersonId]
        );
        await this.audit(connection,tenantId,'RELATIONSHIP_ATTRIBUTE_ASSIGNMENT',item.id,'CREATED',actorPersonId,item);
        return item;
      });
    }catch(error){return mapError(error);}
  }

  async assignConstraintToRelationshipAttribute(
    tenantId:TenantId,
    actorPersonId:string,
    input:{
      relationshipAttributeAssignmentId:string;
      constraintDefinitionId:string;
      sequence?:number;
      mandatory?:boolean;
    }
  ):Promise<RelationshipAttributeConstraintAssignment>{
    await this.requireManage(tenantId,actorPersonId);
    try{
      return await withTransaction(this.pool,async connection=>{
        const relationshipAttributeAssignmentId=required(
          input.relationshipAttributeAssignmentId,'Relationship Attribute Assignment'
        );
        const constraintDefinitionId=required(input.constraintDefinitionId,'Constraint Definition');
        const [assignmentRows,constraintRows]=await Promise.all([
          connection.execute<(RowDataPacket&{id:string})[]>(
            `SELECT id FROM metadata_relationship_attribute_assignments
              WHERE tenant_id=? AND id=? AND status='ACTIVE'`,
            [tenantId,relationshipAttributeAssignmentId]
          ),
          connection.execute<(RowDataPacket&{id:string})[]>(
            `SELECT id FROM metadata_constraint_definitions
              WHERE tenant_id=? AND id=? AND status='ACTIVE'
                AND (effective_from IS NULL OR effective_from<=CURRENT_TIMESTAMP(6))
                AND (effective_to IS NULL OR effective_to>=CURRENT_TIMESTAMP(6))`,
            [tenantId,constraintDefinitionId]
          )
        ]);
        if(!assignmentRows[0][0]){
          throw new ThingAdministrationCommandError(
            'Relationship Attribute Assignment was not found or inactive.','NOT_FOUND'
          );
        }
        if(!constraintRows[0][0]){
          throw new ThingAdministrationCommandError(
            'Constraint Definition was not found, inactive or ineffective.','NOT_FOUND'
          );
        }
        const item:RelationshipAttributeConstraintAssignment={
          id:asId<'RelationshipAttributeConstraintAssignmentId'>(
            `RELATTRCON-${randomUUID()}`,'Relationship Attribute Constraint Assignment'
          ),
          tenantId,
          relationshipAttributeAssignmentId:asId<'RelationshipAttributeAssignmentId'>(
            relationshipAttributeAssignmentId,'Relationship Attribute Assignment'
          ),
          constraintDefinitionId:asId<'ConstraintDefinitionId'>(
            constraintDefinitionId,'Constraint Definition'
          ),
          sequence:integer(input.sequence??0,'Sequence'),
          mandatory:input.mandatory??true,
          status:'ACTIVE'
        };
        await connection.execute(
          `INSERT INTO metadata_relationship_attribute_constraint_assignments
            (id,tenant_id,relationship_attribute_assignment_id,constraint_definition_id,
             sequence_no,mandatory,status,created_by_person_id,updated_by_person_id)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          [item.id,tenantId,item.relationshipAttributeAssignmentId,item.constraintDefinitionId,
           item.sequence,item.mandatory,item.status,actorPersonId,actorPersonId]
        );
        await this.audit(
          connection,tenantId,'RELATIONSHIP_ATTRIBUTE_CONSTRAINT_ASSIGNMENT',
          item.id,'ASSIGNED',actorPersonId,item
        );
        return item;
      });
    }catch(error){return mapError(error);}
  }

  async createThing(
    tenantId:TenantId,
    actorPersonId:string,
    input:{
      typeDefinitionId:string; stableKey:string; displayName?:string;
      fieldValues?:Array<{typeAttributeAssignmentId:string;sequence?:number;value:unknown}>;
    }
  ):Promise<Thing>{
    await this.requireManage(tenantId,actorPersonId);
    try{
      return await withTransaction(this.pool,async connection=>{
        const type=await this.requireType(connection,tenantId,required(input.typeDefinitionId,'Type Definition'));
        const assignments=await this.effectiveTypeAssignments(connection,tenantId,type.id);
        const supplied=[...(input.fieldValues??[])];
        const assignmentById=new Map(assignments.map(item=>[item.id,item]));
        for(const value of supplied){
          if(!assignmentById.has(value.typeAttributeAssignmentId)){
            throw new ThingAdministrationCommandError(
              'A supplied field assignment is not valid for this Thing type.','INVALID_INPUT'
            );
          }
        }
        for(const assignment of assignments){
          const existing=supplied.filter(item=>item.typeAttributeAssignmentId===assignment.id);
          if(existing.length===0&&assignment.default_value!==null&&assignment.default_value!==undefined){
            const defaultValue=parsedJson(assignment.default_value);
            if(assignment.cardinality==='MULTIPLE'&&Array.isArray(defaultValue)){
              defaultValue.forEach((value,sequence)=>supplied.push({
                typeAttributeAssignmentId:assignment.id,sequence,value
              }));
            }else{
              supplied.push({typeAttributeAssignmentId:assignment.id,sequence:0,value:defaultValue});
            }
          }
          const resolved=supplied.filter(item=>item.typeAttributeAssignmentId===assignment.id);
          const requiredByConstraint=await this.hasMandatoryRequiredConstraint(
            connection,tenantId,assignment.id,'THING'
          );
          if((Boolean(assignment.required)||requiredByConstraint)&&resolved.length===0){
            throw new ThingAdministrationCommandError(
              `Required field assignment ${assignment.id} must be supplied or have a default when creating ${type.code}.`,
              'INVALID_INPUT'
            );
          }
        }
        const now=new Date();
        const displayName=optional(input.displayName);
        const thing:Thing={
          id:asId<'CanonicalObjectId'>(`THING-${randomUUID()}`,'Thing'),
          tenantId,
          typeDefinitionId:asId<'TypeDefinitionId'>(type.id,'Type Definition'),
          typeCode:type.code,
          stableKey:required(input.stableKey,'Stable key'),
          ...(displayName?{displayName}:{}),
          status:'ACTIVE',
          createdAt:now.toISOString()
        };
        await connection.execute(
          `INSERT INTO canonical_objects
            (id,tenant_id,object_type,type_definition_id,stable_key,display_name,status,created_at)
           VALUES (?,?,?,?,?,?,?,?)`,
          [thing.id,tenantId,thing.typeCode,thing.typeDefinitionId,thing.stableKey,thing.displayName??null,thing.status,now]
        );
        for(const value of supplied){
          await this.writeThingFieldValue(
            connection,tenantId,actorPersonId,thing.id,type.id,
            required(value.typeAttributeAssignmentId,'Type Attribute Assignment'),
            value.sequence??0,value.value
          );
        }
        if(type.lifecycle_definition_id){
          await this.initialiseThingLifecycle(
            connection,tenantId,actorPersonId,thing,type.lifecycle_definition_id
          );
        }
        await this.audit(connection,tenantId,'THING',thing.id,'CREATED',actorPersonId,thing);
        return thing;
      });
    }catch(error){return mapError(error);}
  }

  async replaceThingFieldValues(
    tenantId:TenantId,
    actorPersonId:string,
    input:{
      thingId:string;
      typeAttributeAssignmentId:string;
      values:Array<{sequence?:number;value:unknown}>;
    }
  ):Promise<void>{
    await this.requireManage(tenantId,actorPersonId);
    try{
      await withTransaction(this.pool,async connection=>{
        const thing=await this.requireThing(connection,tenantId,required(input.thingId,'Thing'));
        if(!thing.type_definition_id){
          throw new ThingAdministrationCommandError('Canonical object has no governed Type binding.','INVALID_INPUT');
        }
        const assignment=await this.requireTypeAssignment(
          connection,tenantId,thing.type_definition_id,
          required(input.typeAttributeAssignmentId,'Type Attribute Assignment')
        );
        if(assignment.cardinality==='SINGLE'&&input.values.length>1){
          throw new ThingAdministrationCommandError('SINGLE field accepts at most one value.','INVALID_INPUT');
        }
        const requiredByConstraint=await this.hasMandatoryRequiredConstraint(
          connection,tenantId,assignment.id,'THING'
        );
        if((Boolean(assignment.required)||requiredByConstraint)&&input.values.length===0){
          throw new ThingAdministrationCommandError('Required field cannot be cleared.','INVALID_INPUT');
        }
        const seen=new Set<number>();
        for(const item of input.values){
          const sequence=integer(item.sequence??0,'Field value sequence');
          if(seen.has(sequence)){
            throw new ThingAdministrationCommandError('Field value sequence must be unique.','INVALID_INPUT');
          }
          seen.add(sequence);
          await this.validateAssignedConstraints(
            connection,tenantId,assignment.id,assignment.data_type,item.value,'THING'
          );
          await this.typedColumns(connection,tenantId,assignment,item.value);
        }
        await connection.execute(
          `DELETE FROM metadata_object_attribute_values
            WHERE tenant_id=? AND canonical_object_id=? AND type_attribute_assignment_id=?`,
          [tenantId,thing.id,assignment.id]
        );
        for(const item of input.values){
          await this.writeThingFieldValue(
            connection,tenantId,actorPersonId,thing.id,thing.type_definition_id,
            assignment.id,item.sequence??0,item.value
          );
        }
        await this.audit(connection,tenantId,'THING_FIELD_VALUE',thing.id,'REPLACED',actorPersonId,{
          thingId:thing.id,assignmentId:assignment.id,count:input.values.length
        });
      });
    }catch(error){mapError(error);}
  }

  async setThingFieldValue(
    tenantId:TenantId,
    actorPersonId:string,
    input:{thingId:string;typeAttributeAssignmentId:string;sequence?:number;value:unknown}
  ):Promise<void>{
    await this.requireManage(tenantId,actorPersonId);
    try{
      await withTransaction(this.pool,async connection=>{
        const thing=await this.requireThing(connection,tenantId,required(input.thingId,'Thing'));
        if(!thing.type_definition_id){
          throw new ThingAdministrationCommandError('Canonical object has no governed Type binding.','INVALID_INPUT');
        }
        await this.writeThingFieldValue(
          connection,tenantId,actorPersonId,thing.id,thing.type_definition_id,
          required(input.typeAttributeAssignmentId,'Type Attribute Assignment'),input.sequence??0,input.value
        );
      });
    }catch(error){mapError(error);}
  }

  async relateThings(
    tenantId:TenantId,
    actorPersonId:string,
    input:{
      relationshipTypeDefinitionId:string; fromThingId:string; toThingId:string;
      effectiveFrom?:string; effectiveTo?:string;
      fieldValues?:Array<{relationshipAttributeAssignmentId:string;sequence?:number;value:unknown}>;
    }
  ):Promise<ThingRelationship>{
    await this.requireManage(tenantId,actorPersonId);
    const effectiveFrom=isoDate(input.effectiveFrom,'Relationship effective from',true);
    const effectiveTo=optional(input.effectiveTo);
    if(effectiveTo){
      isoDate(effectiveTo,'Relationship effective to');
      if(Date.parse(effectiveTo)<Date.parse(effectiveFrom)){
        throw new ThingAdministrationCommandError('Relationship effectiveTo must not precede effectiveFrom.','INVALID_INPUT');
      }
    }
    try{
      return await withTransaction(this.pool,async connection=>{
        const [definition,from,to]=await Promise.all([
          this.requireRelationshipType(connection,tenantId,required(input.relationshipTypeDefinitionId,'Relationship Type')),
          this.requireThing(connection,tenantId,required(input.fromThingId,'From Thing')),
          this.requireThing(connection,tenantId,required(input.toThingId,'To Thing'))
        ]);
        if(!from.type_definition_id||!to.type_definition_id){
          throw new ThingAdministrationCommandError('Typed relationships require metadata-typed Things.','INVALID_INPUT');
        }
        if(!await this.typeMatches(connection,tenantId,from.type_definition_id,definition.from_type_definition_id)){
          throw new ThingAdministrationCommandError('From Thing type is not valid for this Relationship Type.','INVALID_INPUT');
        }
        if(!await this.typeMatches(connection,tenantId,to.type_definition_id,definition.to_type_definition_id)){
          throw new ThingAdministrationCommandError('To Thing type is not valid for this Relationship Type.','INVALID_INPUT');
        }
        if(definition.to_cardinality==='ONE'){
          const [rows]=await connection.execute<CountRow[]>(
            `SELECT COUNT(*) AS count FROM canonical_relationships
              WHERE tenant_id=? AND relationship_type_definition_id=? AND from_object_id=?
                AND status='ACTIVE' AND effective_from<=?
                AND (effective_to IS NULL OR effective_to>=?)`,
            [tenantId,definition.id,from.id,effectiveTo?new Date(effectiveTo):new Date('9999-12-31T23:59:59Z'),new Date(effectiveFrom)]
          );
          if(Number(rows[0]?.count??0)>0){
            throw new ThingAdministrationCommandError('Relationship to-cardinality ONE would be exceeded.','CONFLICT');
          }
        }
        if(definition.from_cardinality==='ONE'){
          const [rows]=await connection.execute<CountRow[]>(
            `SELECT COUNT(*) AS count FROM canonical_relationships
              WHERE tenant_id=? AND relationship_type_definition_id=? AND to_object_id=?
                AND status='ACTIVE' AND effective_from<=?
                AND (effective_to IS NULL OR effective_to>=?)`,
            [tenantId,definition.id,to.id,effectiveTo?new Date(effectiveTo):new Date('9999-12-31T23:59:59Z'),new Date(effectiveFrom)]
          );
          if(Number(rows[0]?.count??0)>0){
            throw new ThingAdministrationCommandError('Relationship from-cardinality ONE would be exceeded.','CONFLICT');
          }
        }
        const assignmentRows=await this.relationshipAssignments(connection,tenantId,definition.id);
        const supplied=[...(input.fieldValues??[])];
        const assignmentById=new Map(assignmentRows.map(item=>[item.id,item]));
        for(const value of supplied){
          if(!assignmentById.has(value.relationshipAttributeAssignmentId)){
            throw new ThingAdministrationCommandError(
              'A supplied relationship field assignment is not valid for this Relationship Type.','INVALID_INPUT'
            );
          }
        }
        for(const assignment of assignmentRows){
          const existing=supplied.filter(item=>item.relationshipAttributeAssignmentId===assignment.id);
          if(existing.length===0&&assignment.default_value!==null&&assignment.default_value!==undefined){
            const defaultValue=parsedJson(assignment.default_value);
            if(assignment.cardinality==='MULTIPLE'&&Array.isArray(defaultValue)){
              defaultValue.forEach((value,sequence)=>supplied.push({
                relationshipAttributeAssignmentId:assignment.id,sequence,value
              }));
            }else{
              supplied.push({relationshipAttributeAssignmentId:assignment.id,sequence:0,value:defaultValue});
            }
          }
          const resolved=supplied.filter(item=>item.relationshipAttributeAssignmentId===assignment.id);
          const requiredByConstraint=await this.hasMandatoryRequiredConstraint(
            connection,tenantId,assignment.id,'RELATIONSHIP'
          );
          if((Boolean(assignment.required)||requiredByConstraint)&&resolved.length===0){
            throw new ThingAdministrationCommandError(
              `Required relationship field assignment ${assignment.id} must be supplied or have a default.`,
              'INVALID_INPUT'
            );
          }
        }
        const relationship:ThingRelationship={
          id:asId<'CanonicalRelationshipId'>(`REL-${randomUUID()}`,'Thing Relationship'),
          tenantId,
          relationshipTypeDefinitionId:asId<'RelationshipTypeDefinitionId'>(definition.id,'Relationship Type'),
          relationshipCode:definition.code,
          fromThingId:from.id as CanonicalObjectId,
          toThingId:to.id as CanonicalObjectId,
          effectiveFrom,
          ...(effectiveTo?{effectiveTo}:{}),
          status:'ACTIVE'
        };
        await connection.execute(
          `INSERT INTO canonical_relationships
            (id,tenant_id,relationship_type,relationship_type_definition_id,from_object_id,to_object_id,
             effective_from,effective_to,status,metadata,created_by_person_id)
           VALUES (?,?,?,?,?,?,?,?,?,'{}',?)`,
          [relationship.id,tenantId,definition.code,definition.id,from.id,to.id,new Date(effectiveFrom),
           effectiveTo?new Date(effectiveTo):null,'ACTIVE',actorPersonId]
        );
        for(const value of supplied){
          await this.writeRelationshipFieldValue(
            connection,tenantId,actorPersonId,relationship.id,definition.id,
            required(value.relationshipAttributeAssignmentId,'Relationship Attribute Assignment'),
            value.sequence??0,value.value
          );
        }
        await this.audit(connection,tenantId,'THING_RELATIONSHIP',relationship.id,'CREATED',actorPersonId,relationship);
        return relationship;
      });
    }catch(error){return mapError(error);}
  }

  async setRelationshipFieldValue(
    tenantId:TenantId,
    actorPersonId:string,
    input:{relationshipId:string;relationshipAttributeAssignmentId:string;sequence?:number;value:unknown}
  ):Promise<void>{
    await this.requireManage(tenantId,actorPersonId);
    try{
      await withTransaction(this.pool,async connection=>{
        const [rows]=await connection.execute<(RowDataPacket&{id:string;relationship_type_definition_id:string|null})[]>(
          `SELECT cr.id,
                  COALESCE(cr.relationship_type_definition_id,nrb.relationship_type_definition_id)
                    AS relationship_type_definition_id
             FROM canonical_relationships cr
             LEFT JOIN metadata_native_relationship_bindings nrb
               ON nrb.tenant_id=cr.tenant_id
              AND nrb.native_relationship_type=cr.relationship_type
              AND nrb.status='ACTIVE'
            WHERE cr.tenant_id=? AND cr.id=? AND cr.status='ACTIVE'`,
          [tenantId,required(input.relationshipId,'Relationship')]
        );
        const relationship=rows[0];
        if(!relationship) throw new ThingAdministrationCommandError('Relationship was not found.','NOT_FOUND');
        if(!relationship.relationship_type_definition_id){
          throw new ThingAdministrationCommandError('Canonical relationship has no governed Relationship Type binding.','INVALID_INPUT');
        }
        await this.writeRelationshipFieldValue(
          connection,tenantId,actorPersonId,relationship.id,relationship.relationship_type_definition_id,
          required(input.relationshipAttributeAssignmentId,'Relationship Attribute Assignment'),
          input.sequence??0,input.value
        );
      });
    }catch(error){mapError(error);}
  }

  private async writeThingFieldValue(
    connection:PoolConnection,tenantId:TenantId,actorPersonId:string,
    thingId:string,typeDefinitionId:string,assignmentId:string,sequence:number,value:unknown
  ){
    const slot=integer(sequence,'Field value sequence');
    const assignment=await this.requireTypeAssignment(connection,tenantId,typeDefinitionId,assignmentId);
    if(assignment.cardinality==='SINGLE'&&slot!==0){
      throw new ThingAdministrationCommandError('SINGLE field values must use sequence 0.','INVALID_INPUT');
    }
    await this.validateAssignedConstraints(
      connection,tenantId,assignment.id,assignment.data_type,value,'THING'
    );
    const typed=await this.typedColumns(connection,tenantId,assignment,value);
    const id=`THINGVAL-${randomUUID()}`;
    await connection.execute(
      `INSERT INTO metadata_object_attribute_values
        (id,tenant_id,canonical_object_id,type_attribute_assignment_id,sequence_no,
         string_value,integer_value,decimal_value,boolean_value,date_value,datetime_value,
         enumeration_value_id,reference_object_id,json_value,created_by_person_id,updated_by_person_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         string_value=VALUES(string_value),integer_value=VALUES(integer_value),
         decimal_value=VALUES(decimal_value),boolean_value=VALUES(boolean_value),
         date_value=VALUES(date_value),datetime_value=VALUES(datetime_value),
         enumeration_value_id=VALUES(enumeration_value_id),reference_object_id=VALUES(reference_object_id),
         json_value=VALUES(json_value),updated_by_person_id=VALUES(updated_by_person_id),
         row_version=row_version+1`,
      [id,tenantId,thingId,assignmentId,slot,typed.stringValue,typed.integerValue,typed.decimalValue,
       typed.booleanValue,typed.dateValue,typed.datetimeValue,typed.enumerationValueId,
       typed.referenceObjectId,typed.jsonValue,actorPersonId,actorPersonId]
    );
    await this.audit(connection,tenantId,'THING_FIELD_VALUE',thingId,'SET',actorPersonId,{
      thingId,assignmentId,sequence:slot,dataType:assignment.data_type
    });
  }

  private async writeRelationshipFieldValue(
    connection:PoolConnection,tenantId:TenantId,actorPersonId:string,
    relationshipId:string,relationshipTypeDefinitionId:string,assignmentId:string,sequence:number,value:unknown
  ){
    const slot=integer(sequence,'Relationship field value sequence');
    const assignment=await this.requireRelationshipAssignment(
      connection,tenantId,relationshipTypeDefinitionId,assignmentId
    );
    if(assignment.cardinality==='SINGLE'&&slot!==0){
      throw new ThingAdministrationCommandError('SINGLE relationship field values must use sequence 0.','INVALID_INPUT');
    }
    await this.validateAssignedConstraints(
      connection,tenantId,assignment.id,assignment.data_type,value,'RELATIONSHIP'
    );
    const typed=await this.typedColumns(connection,tenantId,assignment,value);
    const id=`RELVAL-${randomUUID()}`;
    await connection.execute(
      `INSERT INTO metadata_relationship_attribute_values
        (id,tenant_id,canonical_relationship_id,relationship_attribute_assignment_id,sequence_no,
         string_value,integer_value,decimal_value,boolean_value,date_value,datetime_value,
         enumeration_value_id,reference_object_id,json_value,created_by_person_id,updated_by_person_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         string_value=VALUES(string_value),integer_value=VALUES(integer_value),
         decimal_value=VALUES(decimal_value),boolean_value=VALUES(boolean_value),
         date_value=VALUES(date_value),datetime_value=VALUES(datetime_value),
         enumeration_value_id=VALUES(enumeration_value_id),reference_object_id=VALUES(reference_object_id),
         json_value=VALUES(json_value),updated_by_person_id=VALUES(updated_by_person_id),
         row_version=row_version+1`,
      [id,tenantId,relationshipId,assignmentId,slot,typed.stringValue,typed.integerValue,typed.decimalValue,
       typed.booleanValue,typed.dateValue,typed.datetimeValue,typed.enumerationValueId,
       typed.referenceObjectId,typed.jsonValue,actorPersonId,actorPersonId]
    );
    await this.audit(connection,tenantId,'RELATIONSHIP_FIELD_VALUE',relationshipId,'SET',actorPersonId,{
      relationshipId,assignmentId,sequence:slot,dataType:assignment.data_type
    });
  }

  private async typedColumns(
    connection:PoolConnection,tenantId:TenantId,
    assignment:{data_type:MetadataDataType;enumeration_definition_id:string|null;reference_object_family:string|null},
    value:unknown
  ):Promise<TypedColumns>{
    if(value===null||value===undefined){
      throw new ThingAdministrationCommandError('Field value must not be null.','INVALID_INPUT');
    }
    const typed=emptyTyped();
    switch(assignment.data_type){
      case 'STRING':
        typed.stringValue=String(value);
        break;
      case 'INTEGER': {
        const number=typeof value==='number'?value:Number(value);
        if(!Number.isSafeInteger(number)) throw new ThingAdministrationCommandError('INTEGER value must be a safe integer.','INVALID_INPUT');
        typed.integerValue=number;
        break;
      }
      case 'DECIMAL': {
        const number=typeof value==='number'?value:Number(value);
        if(!Number.isFinite(number)) throw new ThingAdministrationCommandError('DECIMAL value must be finite.','INVALID_INPUT');
        typed.decimalValue=String(value);
        break;
      }
      case 'BOOLEAN':
        if(typeof value!=='boolean') throw new ThingAdministrationCommandError('BOOLEAN value must be true or false.','INVALID_INPUT');
        typed.booleanValue=value;
        break;
      case 'DATE': {
        const date=new Date(String(value));
        if(Number.isNaN(date.getTime())) throw new ThingAdministrationCommandError('DATE value is invalid.','INVALID_INPUT');
        typed.dateValue=date.toISOString().slice(0,10);
        break;
      }
      case 'DATETIME': {
        const date=new Date(String(value));
        if(Number.isNaN(date.getTime())) throw new ThingAdministrationCommandError('DATETIME value is invalid.','INVALID_INPUT');
        typed.datetimeValue=date;
        break;
      }
      case 'ENUMERATION': {
        const id=required(String(value),'Enumeration Value');
        const [rows]=await connection.execute<EnumRow[]>(
          `SELECT id,enumeration_definition_id,status FROM metadata_enumeration_values
            WHERE tenant_id=? AND id=? AND status='ACTIVE'`,[tenantId,id]
        );
        const enumeration=rows[0];
        if(!enumeration||enumeration.enumeration_definition_id!==assignment.enumeration_definition_id){
          throw new ThingAdministrationCommandError('Enumeration value is not valid for this field.','INVALID_INPUT');
        }
        typed.enumerationValueId=id;
        break;
      }
      case 'REFERENCE': {
        const id=required(String(value),'Reference Thing');
        const [rows]=await connection.execute<ReferenceRow[]>(
          `SELECT co.id,
                  COALESCE(co.type_definition_id,ntb.type_definition_id) AS type_definition_id,
                  mt.object_family,co.status
             FROM canonical_objects co
             LEFT JOIN metadata_native_type_bindings ntb
               ON ntb.tenant_id=co.tenant_id
              AND ntb.native_object_type=co.object_type
              AND ntb.status='ACTIVE'
             LEFT JOIN metadata_type_definitions mt
               ON mt.tenant_id=co.tenant_id
              AND mt.id=COALESCE(co.type_definition_id,ntb.type_definition_id)
            WHERE co.tenant_id=? AND co.id=?`,[tenantId,id]
        );
        const reference=rows[0];
        if(!reference||reference.status!=='ACTIVE'){
          throw new ThingAdministrationCommandError('Reference Thing was not found or inactive.','INVALID_INPUT');
        }
        if(assignment.reference_object_family&&reference.object_family!==assignment.reference_object_family){
          throw new ThingAdministrationCommandError('Reference Thing object family is not valid for this field.','INVALID_INPUT');
        }
        typed.referenceObjectId=id;
        break;
      }
      case 'JSON':
        typed.jsonValue=JSON.stringify(value);
        break;
    }
    return typed;
  }

  private async requireType(
    connection:PoolConnection,tenantId:TenantId,id:string
  ):Promise<TypeRow>{
    const [rows]=await connection.execute<TypeRow[]>(
      `SELECT id,tenant_id,code,name,object_family,parent_type_definition_id,lifecycle_definition_id,creation_policy_reference,status,effective_from,effective_to
         FROM metadata_type_definitions
        WHERE tenant_id=? AND id=? AND status='ACTIVE'
          AND (effective_from IS NULL OR effective_from<=CURRENT_TIMESTAMP(6))
          AND (effective_to IS NULL OR effective_to>=CURRENT_TIMESTAMP(6))`,
      [tenantId,id]
    );
    if(!rows[0]) throw new ThingAdministrationCommandError('Type Definition was not found or not effective.','NOT_FOUND');
    return rows[0];
  }

  private async requireThing(
    connection:PoolConnection,tenantId:TenantId,id:string
  ):Promise<ThingRow>{
    const [rows]=await connection.execute<ThingRow[]>(
      `SELECT co.id,co.tenant_id,co.object_type,
              COALESCE(co.type_definition_id,ntb.type_definition_id) AS type_definition_id,
              co.stable_key,co.display_name,co.status,co.created_at
         FROM canonical_objects co
         LEFT JOIN metadata_native_type_bindings ntb
           ON ntb.tenant_id=co.tenant_id
          AND ntb.native_object_type=co.object_type
          AND ntb.status='ACTIVE'
        WHERE co.tenant_id=? AND co.id=?`,[tenantId,id]
    );
    if(!rows[0]) throw new ThingAdministrationCommandError('Thing was not found.','NOT_FOUND');
    return rows[0];
  }

  private async effectiveTypeAssignments(
    connection:PoolConnection,tenantId:TenantId,typeDefinitionId:string
  ):Promise<AssignmentRow[]>{
    const [rows]=await connection.query<AssignmentRow[]>(
      `WITH RECURSIVE lineage(id,parent_type_definition_id) AS (
         SELECT id,parent_type_definition_id
           FROM metadata_type_definitions WHERE tenant_id=? AND id=? AND status='ACTIVE'
         UNION ALL
         SELECT p.id,p.parent_type_definition_id
           FROM metadata_type_definitions p
           JOIN lineage l ON l.parent_type_definition_id=p.id
          WHERE p.tenant_id=? AND p.status='ACTIVE'
       )
       SELECT ta.id,ta.type_definition_id,ta.attribute_definition_id,ta.required,ta.cardinality,
              ad.data_type,ad.enumeration_definition_id,ad.reference_object_family,ta.default_value,ta.status
         FROM metadata_type_attribute_assignments ta
         JOIN metadata_attribute_definitions ad
           ON ad.tenant_id=ta.tenant_id AND ad.id=ta.attribute_definition_id
        WHERE ta.tenant_id=? AND ta.type_definition_id IN (SELECT id FROM lineage)
          AND ta.status='ACTIVE' AND ad.status='ACTIVE'
        ORDER BY ta.sequence_no,ta.id`,
      [tenantId,typeDefinitionId,tenantId,tenantId]
    );
    return rows;
  }

  private async requireTypeAssignment(
    connection:PoolConnection,tenantId:TenantId,typeDefinitionId:string,assignmentId:string
  ):Promise<AssignmentRow>{
    const rows=await this.effectiveTypeAssignments(connection,tenantId,typeDefinitionId);
    const assignment=rows.find(item=>item.id===assignmentId);
    if(!assignment) throw new ThingAdministrationCommandError('Field assignment is not valid for this Thing type.','INVALID_INPUT');
    return assignment;
  }

  private async requireRelationshipType(
    connection:PoolConnection,tenantId:TenantId,id:string
  ):Promise<RelationshipTypeRow>{
    const [rows]=await connection.execute<RelationshipTypeRow[]>(
      `SELECT id,tenant_id,code,name,description,from_type_definition_id,to_type_definition_id,
              from_cardinality,to_cardinality,inverse_name,version,effective_from,effective_to,status
         FROM metadata_relationship_type_definitions
        WHERE tenant_id=? AND id=? AND status='ACTIVE'
          AND (effective_from IS NULL OR effective_from<=CURRENT_TIMESTAMP(6))
          AND (effective_to IS NULL OR effective_to>=CURRENT_TIMESTAMP(6))`,
      [tenantId,id]
    );
    if(!rows[0]) throw new ThingAdministrationCommandError('Relationship Type was not found or not effective.','NOT_FOUND');
    return rows[0];
  }

  private async relationshipAssignments(
    connection:PoolConnection,tenantId:TenantId,relationshipTypeDefinitionId:string
  ):Promise<RelationshipAssignmentRow[]>{
    const [rows]=await connection.execute<RelationshipAssignmentRow[]>(
      `SELECT ra.id,ra.relationship_type_definition_id,ra.attribute_definition_id,
              ra.required,ra.cardinality,ad.data_type,ad.enumeration_definition_id,
              ad.reference_object_family,ra.default_value,ra.status
         FROM metadata_relationship_attribute_assignments ra
         JOIN metadata_attribute_definitions ad
           ON ad.tenant_id=ra.tenant_id AND ad.id=ra.attribute_definition_id
        WHERE ra.tenant_id=? AND ra.relationship_type_definition_id=?
          AND ra.status='ACTIVE' AND ad.status='ACTIVE'
        ORDER BY ra.sequence_no,ra.id`,
      [tenantId,relationshipTypeDefinitionId]
    );
    return rows;
  }

  private async requireRelationshipAssignment(
    connection:PoolConnection,tenantId:TenantId,relationshipTypeDefinitionId:string,assignmentId:string
  ):Promise<RelationshipAssignmentRow>{
    const rows=await this.relationshipAssignments(connection,tenantId,relationshipTypeDefinitionId);
    const assignment=rows.find(item=>item.id===assignmentId);
    if(!assignment) throw new ThingAdministrationCommandError('Field assignment is not valid for this Relationship Type.','INVALID_INPUT');
    return assignment;
  }

  private async hasMandatoryRequiredConstraint(
    connection:PoolConnection,
    tenantId:TenantId,
    assignmentId:string,
    target:'THING'|'RELATIONSHIP'
  ):Promise<boolean>{
    const table=target==='THING'
      ?'metadata_attribute_constraint_assignments'
      :'metadata_relationship_attribute_constraint_assignments';
    const assignmentColumn=target==='THING'
      ?'type_attribute_assignment_id'
      :'relationship_attribute_assignment_id';
    const [rows]=await connection.query<CountRow[]>(
      `SELECT COUNT(*) AS count
         FROM ${table} ca
         JOIN metadata_constraint_definitions c
           ON c.tenant_id=ca.tenant_id AND c.id=ca.constraint_definition_id
        WHERE ca.tenant_id=? AND ca.${assignmentColumn}=?
          AND ca.status='ACTIVE' AND ca.mandatory=TRUE
          AND c.status='ACTIVE' AND c.constraint_type='REQUIRED'
          AND (c.effective_from IS NULL OR c.effective_from<=CURRENT_TIMESTAMP(6))
          AND (c.effective_to IS NULL OR c.effective_to>=CURRENT_TIMESTAMP(6))`,
      [tenantId,assignmentId]
    );
    return Number(rows[0]?.count??0)>0;
  }

  private async validateAssignedConstraints(
    connection:PoolConnection,
    tenantId:TenantId,
    assignmentId:string,
    dataType:MetadataDataType,
    value:unknown,
    target:'THING'|'RELATIONSHIP'
  ):Promise<void>{
    const table=target==='THING'
      ?'metadata_attribute_constraint_assignments'
      :'metadata_relationship_attribute_constraint_assignments';
    const assignmentColumn=target==='THING'
      ?'type_attribute_assignment_id'
      :'relationship_attribute_assignment_id';
    const [rows]=await connection.query<ConstraintRuntimeRow[]>(
      `SELECT c.code,c.constraint_type,c.configuration,ca.mandatory
         FROM ${table} ca
         JOIN metadata_constraint_definitions c
           ON c.tenant_id=ca.tenant_id AND c.id=ca.constraint_definition_id
        WHERE ca.tenant_id=? AND ca.${assignmentColumn}=?
          AND ca.status='ACTIVE' AND c.status='ACTIVE'
          AND (c.effective_from IS NULL OR c.effective_from<=CURRENT_TIMESTAMP(6))
          AND (c.effective_to IS NULL OR c.effective_to>=CURRENT_TIMESTAMP(6))
        ORDER BY ca.sequence_no,c.code`,
      [tenantId,assignmentId]
    );
    let referenceObjectFamily:string|undefined;
    let referenceTypeDefinitionId:string|undefined;
    if(dataType==='REFERENCE'){
      const id=required(String(value),'Reference Thing');
      const [references]=await connection.execute<ReferenceRow[]>(
        `SELECT co.id,co.type_definition_id,mt.object_family,co.status
           FROM canonical_objects co
           LEFT JOIN metadata_type_definitions mt
             ON mt.tenant_id=co.tenant_id AND mt.id=co.type_definition_id
          WHERE co.tenant_id=? AND co.id=?`,[tenantId,id]
      );
      const reference=references[0];
      if(reference){
        referenceObjectFamily=reference.object_family??undefined;
        referenceTypeDefinitionId=reference.type_definition_id??undefined;
      }
    }
    for(const row of rows){
      const result=evaluateMetadataConstraint({
        code:row.code,
        constraintType:row.constraint_type,
        configuration:(parsedJson(row.configuration)??{}) as Readonly<Record<string,unknown>>,
        dataType,
        value,
        ...(referenceObjectFamily?{referenceObjectFamily}:{}),
        ...(referenceTypeDefinitionId?{referenceTypeDefinitionId}:{})
      });
      if(Boolean(row.mandatory)&&(!result.supported||!result.passed)){
        throw new ThingAdministrationCommandError(
          result.message??`${row.code}: mandatory metadata constraint failed.`,'INVALID_INPUT'
        );
      }
    }
  }

  private async initialiseThingLifecycle(
    connection:PoolConnection,
    tenantId:TenantId,
    actorPersonId:string,
    thing:Thing,
    lifecycleDefinitionId:string
  ):Promise<void>{
    const [definitionRows,stateRows]=await Promise.all([
      connection.execute<LifecycleDefinitionRow[]>(
        `SELECT id,tenant_id,code,name,object_type,status
           FROM lifecycle_definitions
          WHERE tenant_id=? AND id=? AND status='ACTIVE'`,
        [tenantId,lifecycleDefinitionId]
      ),
      connection.execute<LifecycleStateRow[]>(
        `SELECT id,tenant_id,lifecycle_definition_id,code,name,category,
                is_initial,is_terminal,status
           FROM lifecycle_state_definitions
          WHERE tenant_id=? AND lifecycle_definition_id=?
            AND is_initial=TRUE AND status='ACTIVE'
          ORDER BY id`,
        [tenantId,lifecycleDefinitionId]
      )
    ]);
    const definitionRow=definitionRows[0][0];
    const states=stateRows[0];
    if(!definitionRow){
      throw new ThingAdministrationCommandError(
        'Thing Type lifecycle definition was not found or inactive.','INVALID_INPUT'
      );
    }
    if(states.length!==1){
      throw new ThingAdministrationCommandError(
        'Thing Type lifecycle must have exactly one active initial state.','INVALID_INPUT'
      );
    }
    const stateRow=states[0]!;
    const definition:LifecycleDefinition={
      id:asId<'LifecycleDefinitionId'>(definitionRow.id,'Lifecycle Definition'),
      tenantId,
      code:definitionRow.code,
      name:definitionRow.name,
      objectType:definitionRow.object_type,
      status:definitionRow.status
    };
    const state:LifecycleStateDefinition={
      id:asId<'LifecycleStateDefinitionId'>(stateRow.id,'Lifecycle State Definition'),
      tenantId,
      lifecycleDefinitionId:definition.id,
      code:stateRow.code,
      name:stateRow.name,
      category:stateRow.category,
      initial:Boolean(stateRow.is_initial),
      terminal:Boolean(stateRow.is_terminal),
      status:stateRow.status
    };
    const object:CanonicalObjectIdentity={
      id:thing.id,
      tenantId,
      objectType:thing.typeCode,
      stableKey:thing.stableKey,
      createdAt:thing.createdAt
    };
    const lifecycle:ObjectLifecycleState={
      id:asId<'ObjectLifecycleStateId'>(`OLS-${randomUUID()}`,'Object Lifecycle State'),
      tenantId,
      canonicalObjectId:thing.id,
      lifecycleDefinitionId:definition.id,
      lifecycleStateId:state.id,
      sequence:1,
      effectiveAt:thing.createdAt
    };
    initialiseObjectLifecycle(lifecycle,object,definition,state);
    await connection.execute(
      `INSERT INTO object_lifecycle_states
        (id,tenant_id,canonical_object_id,lifecycle_definition_id,lifecycle_state_id,
         subject_version,sequence,effective_at,transition_id,decision_id)
       VALUES (?,?,?,?,?,NULL,?,?,NULL,NULL)`,
      [lifecycle.id,tenantId,thing.id,definition.id,state.id,lifecycle.sequence,new Date(lifecycle.effectiveAt)]
    );
    await connection.execute(
      `INSERT INTO object_lifecycle_history
        (tenant_id,object_lifecycle_state_id,canonical_object_id,lifecycle_definition_id,
         lifecycle_state_id,subject_version,sequence,transition_id,decision_id,effective_at)
       VALUES (?,?,?,?,?,NULL,?,NULL,NULL,?)`,
      [tenantId,lifecycle.id,thing.id,definition.id,state.id,lifecycle.sequence,new Date(lifecycle.effectiveAt)]
    );
    await this.audit(
      connection,tenantId,'OBJECT_LIFECYCLE_STATE',lifecycle.id,'INITIALISED',actorPersonId,lifecycle
    );
  }

  private async typeMatches(
    connection:PoolConnection,tenantId:TenantId,actualTypeId:string,allowedTypeId:string
  ):Promise<boolean>{
    const [rows]=await connection.query<CountRow[]>(
      `WITH RECURSIVE lineage(id,parent_type_definition_id) AS (
         SELECT id,parent_type_definition_id
           FROM metadata_type_definitions WHERE tenant_id=? AND id=?
         UNION ALL
         SELECT p.id,p.parent_type_definition_id
           FROM metadata_type_definitions p
           JOIN lineage l ON l.parent_type_definition_id=p.id
          WHERE p.tenant_id=?
       )
       SELECT COUNT(*) AS count FROM lineage WHERE id=?`,
      [tenantId,actualTypeId,tenantId,allowedTypeId]
    );
    return Number(rows[0]?.count??0)>0;
  }

  private async audit(
    connection:PoolConnection,tenantId:string,entityType:string,entityId:string,
    action:string,actorPersonId:string,payload:unknown
  ){
    await connection.execute(
      `INSERT INTO kernel_audit_entries
        (tenant_id,entity_type,entity_id,action,actor_person_id,correlation_id,payload)
       VALUES (?,?,?,?,?,?,?)`,
      [tenantId,entityType,entityId,action,actorPersonId,'THING-RUNTIME',JSON.stringify(payload)]
    );
    await writeOutboxEvent(connection,{
      tenantId,aggregateType:entityType,aggregateId:entityId,eventType:`${entityType}.${action}`,payload
    });
  }

  private async requireManage(tenantId:TenantId,actorPersonId:string){
    const evaluation=await this.access.evaluatePermission(
      tenantId,actorPersonId,PLATFORM_PERMISSION_KEYS.METADATA_MANAGE,{scopeType:'TENANT'}
    );
    if(!evaluation.allowed){
      throw new ThingAdministrationCommandError(evaluation.reason,'PERMISSION_DENIED');
    }
  }
}
