import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type CanonicalObjectId,
  type CanonicalRelationshipId,
  type MetadataCardinality,
  type MetadataDataType,
  type MetadataRelationshipCardinality,
  type RelationshipAttributeAssignment,
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
  parent_type_definition_id:string|null; status:'ACTIVE'|'INACTIVE';
  effective_from:Date|null; effective_to:Date|null;
}
interface AssignmentRow extends RowDataPacket {
  id:string; type_definition_id:string; attribute_definition_id:string; required:number;
  cardinality:MetadataCardinality; data_type:MetadataDataType;
  enumeration_definition_id:string|null; reference_object_family:string|null; status:'ACTIVE'|'INACTIVE';
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
  enumeration_definition_id:string|null; reference_object_family:string|null; status:'ACTIVE'|'INACTIVE';
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
        const supplied=input.fieldValues??[];
        const suppliedIds=new Set(supplied.map(item=>item.typeAttributeAssignmentId));
        for(const assignment of assignments){
          if(Boolean(assignment.required)&&!suppliedIds.has(assignment.id)){
            throw new ThingAdministrationCommandError(
              `Required field assignment ${assignment.id} must be supplied when creating ${type.code}.`,
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
        await this.audit(connection,tenantId,'THING',thing.id,'CREATED',actorPersonId,thing);
        return thing;
      });
    }catch(error){return mapError(error);}
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
          throw new ThingAdministrationCommandError('Legacy canonical object has no metadata Type Definition.','INVALID_INPUT');
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
        const supplied=input.fieldValues??[];
        const suppliedIds=new Set(supplied.map(item=>item.relationshipAttributeAssignmentId));
        for(const assignment of assignmentRows){
          if(Boolean(assignment.required)&&!suppliedIds.has(assignment.id)){
            throw new ThingAdministrationCommandError(
              `Required relationship field assignment ${assignment.id} must be supplied.`,'INVALID_INPUT'
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
          `SELECT id,relationship_type_definition_id FROM canonical_relationships
            WHERE tenant_id=? AND id=? AND status='ACTIVE'`,
          [tenantId,required(input.relationshipId,'Relationship')]
        );
        const relationship=rows[0];
        if(!relationship) throw new ThingAdministrationCommandError('Relationship was not found.','NOT_FOUND');
        if(!relationship.relationship_type_definition_id){
          throw new ThingAdministrationCommandError('Legacy relationship has no metadata Relationship Type.','INVALID_INPUT');
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
          `SELECT co.id,co.type_definition_id,mt.object_family,co.status
             FROM canonical_objects co
             LEFT JOIN metadata_type_definitions mt
               ON mt.tenant_id=co.tenant_id AND mt.id=co.type_definition_id
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
      `SELECT id,tenant_id,code,name,object_family,parent_type_definition_id,status,effective_from,effective_to
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
      `SELECT id,tenant_id,object_type,type_definition_id,stable_key,display_name,status,created_at
         FROM canonical_objects WHERE tenant_id=? AND id=?`,[tenantId,id]
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
              ad.data_type,ad.enumeration_definition_id,ad.reference_object_family,ta.status
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
              ad.reference_object_family,ra.status
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
