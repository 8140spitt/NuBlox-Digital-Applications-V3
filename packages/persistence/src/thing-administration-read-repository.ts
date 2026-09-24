import {
  PLATFORM_PERMISSION_KEYS,
  type MetadataDataType,
  type TenantId
} from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';

interface ThingRow extends RowDataPacket {
  id:string; object_type:string; type_definition_id:string|null; type_code:string|null; type_name:string|null;
  object_family:string|null; stable_key:string; display_name:string|null; status:'ACTIVE'|'INACTIVE'; created_at:Date;
  lifecycle_definition_id:string|null; lifecycle_definition_name:string|null;
  lifecycle_state_id:string|null; lifecycle_state_code:string|null; lifecycle_state_name:string|null;
  lifecycle_state_category:string|null; lifecycle_sequence:number|null;
}
interface FieldRow extends RowDataPacket {
  id:string; canonical_object_id:string; type_attribute_assignment_id:string; sequence_no:number;
  attribute_code:string; attribute_name:string; local_label:string|null; data_type:MetadataDataType;
  string_value:string|null; integer_value:number|null; decimal_value:string|null; boolean_value:number|null;
  date_value:Date|string|null; datetime_value:Date|null; enumeration_value_id:string|null; enumeration_label:string|null;
  reference_object_id:string|null; reference_label:string|null; json_value:unknown;
}
interface RelationshipRow extends RowDataPacket {
  id:string; relationship_type:string; relationship_type_definition_id:string|null;
  relationship_name:string|null; inverse_name:string|null; from_object_id:string; to_object_id:string;
  from_label:string|null; to_label:string|null; effective_from:Date; effective_to:Date|null; status:'ACTIVE'|'INACTIVE';
}
interface RelationshipFieldRow extends RowDataPacket {
  id:string; canonical_relationship_id:string; relationship_attribute_assignment_id:string; sequence_no:number;
  attribute_code:string; attribute_name:string; local_label:string|null; data_type:MetadataDataType;
  string_value:string|null; integer_value:number|null; decimal_value:string|null; boolean_value:number|null;
  date_value:Date|string|null; datetime_value:Date|null; enumeration_value_id:string|null; enumeration_label:string|null;
  reference_object_id:string|null; reference_label:string|null; json_value:unknown;
}

export interface ThingFieldView {
  id:string; assignmentId:string; code:string; name:string; sequence:number; dataType:MetadataDataType; value:unknown;
}
export interface ThingRelationshipFieldView extends ThingFieldView {}
export interface ThingRelationshipView {
  id:string; code:string; name:string; direction:'OUTGOING'|'INCOMING';
  fromThingId:string;toThingId:string;otherThingId:string;otherThingLabel:string;
  effectiveFrom:string;effectiveTo?:string;status:'ACTIVE'|'INACTIVE';fields:ThingRelationshipFieldView[];
}
export interface ThingView {
  id:string;typeDefinitionId?:string;typeCode:string;typeName?:string;objectFamily?:string;stableKey:string;displayName:string;
  status:'ACTIVE'|'INACTIVE';createdAt:string;
  lifecycle?:{
    definitionId:string;definitionName:string;stateId:string;stateCode:string;stateName:string;
    category:string;sequence:number;
  };
  fields:ThingFieldView[];relationships:ThingRelationshipView[];
}

interface RelationshipTypeDefinitionRow extends RowDataPacket {
  id:string;code:string;name:string;description:string|null;
  from_type_definition_id:string;from_type_code:string;from_type_name:string;
  to_type_definition_id:string;to_type_code:string;to_type_name:string;
  from_cardinality:'ONE'|'MANY';to_cardinality:'ONE'|'MANY';inverse_name:string|null;
  version:number;effective_from:Date|null;effective_to:Date|null;status:'ACTIVE'|'INACTIVE';
}
interface RelationshipTypeFieldRow extends RowDataPacket {
  relationship_type_definition_id:string;assignment_id:string;attribute_definition_id:string;
  attribute_code:string;attribute_name:string;data_type:MetadataDataType;sequence_no:number;
  required:number;cardinality:'SINGLE'|'MULTIPLE';local_label:string|null;
  enumeration_definition_id:string|null;reference_object_family:string|null;status:'ACTIVE'|'INACTIVE';
}
export interface RelationshipTypeFieldView {
  assignmentId:string;attributeDefinitionId:string;code:string;name:string;dataType:MetadataDataType;
  sequence:number;required:boolean;cardinality:'SINGLE'|'MULTIPLE';
  enumerationDefinitionId?:string;referenceObjectFamily?:string;status:'ACTIVE'|'INACTIVE';
}
export interface RelationshipTypeView {
  id:string;code:string;name:string;description?:string;
  fromTypeDefinitionId:string;fromTypeCode:string;fromTypeName:string;
  toTypeDefinitionId:string;toTypeCode:string;toTypeName:string;
  fromCardinality:'ONE'|'MANY';toCardinality:'ONE'|'MANY';inverseName?:string;
  version:number;effectiveFrom?:string;effectiveTo?:string;status:'ACTIVE'|'INACTIVE';
  fields:RelationshipTypeFieldView[];
}

function json(value:unknown):unknown{
  return typeof value==='string'?JSON.parse(value):value;
}
function decode(row:{
  data_type:MetadataDataType;string_value:string|null;integer_value:number|null;decimal_value:string|null;
  boolean_value:number|null;date_value:Date|string|null;datetime_value:Date|null;enumeration_value_id:string|null;
  enumeration_label:string|null;reference_object_id:string|null;reference_label:string|null;json_value:unknown;
}):unknown{
  switch(row.data_type){
    case 'STRING': return row.string_value;
    case 'INTEGER': return row.integer_value;
    case 'DECIMAL': return row.decimal_value;
    case 'BOOLEAN': return row.boolean_value===null?null:Boolean(row.boolean_value);
    case 'DATE':
      return row.date_value instanceof Date?row.date_value.toISOString().slice(0,10):row.date_value;
    case 'DATETIME': return row.datetime_value?.toISOString()??null;
    case 'ENUMERATION': return row.enumeration_value_id?{id:row.enumeration_value_id,label:row.enumeration_label}:null;
    case 'REFERENCE': return row.reference_object_id?{id:row.reference_object_id,label:row.reference_label}:null;
    case 'JSON': return row.json_value===null?null:json(row.json_value);
  }
}
export class ThingAdministrationReadError extends Error {
  constructor(message:string,readonly code:'PERMISSION_DENIED'){super(message);this.name='ThingAdministrationReadError';}
}

export class MySqlThingAdministrationReadRepository {
  private readonly access:MySqlAccessRepository;
  constructor(private readonly pool:Pool){this.access=new MySqlAccessRepository(pool);}

  async listThings(tenantId:TenantId,actorPersonId:string):Promise<ThingView[]>{
    await this.requireRead(tenantId,actorPersonId);
    const [rows]=await this.pool.execute<ThingRow[]>(
      `SELECT co.id,co.object_type,
              COALESCE(co.type_definition_id,ntb.type_definition_id) AS type_definition_id,
              mt.code AS type_code,mt.name AS type_name,
              mt.object_family,co.stable_key,co.display_name,co.status,co.created_at,
              ols.lifecycle_definition_id,ld.name AS lifecycle_definition_name,
              ols.lifecycle_state_id,ls.code AS lifecycle_state_code,ls.name AS lifecycle_state_name,
              ls.category AS lifecycle_state_category,ols.sequence AS lifecycle_sequence
         FROM canonical_objects co
         LEFT JOIN metadata_native_type_bindings ntb
           ON ntb.tenant_id=co.tenant_id
          AND ntb.native_object_type=co.object_type
          AND ntb.status='ACTIVE'
         LEFT JOIN metadata_type_definitions mt
           ON mt.tenant_id=co.tenant_id
          AND mt.id=COALESCE(co.type_definition_id,ntb.type_definition_id)
         LEFT JOIN object_lifecycle_states ols
           ON ols.tenant_id=co.tenant_id AND ols.canonical_object_id=co.id
         LEFT JOIN lifecycle_definitions ld
           ON ld.tenant_id=ols.tenant_id AND ld.id=ols.lifecycle_definition_id
         LEFT JOIN lifecycle_state_definitions ls
           ON ls.tenant_id=ols.tenant_id
          AND ls.lifecycle_definition_id=ols.lifecycle_definition_id
          AND ls.id=ols.lifecycle_state_id
        WHERE co.tenant_id=? AND COALESCE(co.type_definition_id,ntb.type_definition_id) IS NOT NULL
        ORDER BY mt.code,co.stable_key`,[tenantId]
    );
    const result:ThingView[]=[];
    for(const row of rows) result.push(await this.getThingInternal(tenantId,row));
    return result;
  }

  async listRelationshipTypes(
    tenantId:TenantId,
    actorPersonId:string
  ):Promise<RelationshipTypeView[]>{
    await this.requireRead(tenantId,actorPersonId);
    const [types,fields]=await Promise.all([
      this.pool.execute<RelationshipTypeDefinitionRow[]>(
        `SELECT rt.id,rt.code,rt.name,rt.description,
                rt.from_type_definition_id,ft.code AS from_type_code,ft.name AS from_type_name,
                rt.to_type_definition_id,tt.code AS to_type_code,tt.name AS to_type_name,
                rt.from_cardinality,rt.to_cardinality,rt.inverse_name,rt.version,
                rt.effective_from,rt.effective_to,rt.status
           FROM metadata_relationship_type_definitions rt
           JOIN metadata_type_definitions ft
             ON ft.tenant_id=rt.tenant_id AND ft.id=rt.from_type_definition_id
           JOIN metadata_type_definitions tt
             ON tt.tenant_id=rt.tenant_id AND tt.id=rt.to_type_definition_id
          WHERE rt.tenant_id=?
          ORDER BY rt.code,rt.version DESC`,[tenantId]
      ),
      this.pool.execute<RelationshipTypeFieldRow[]>(
        `SELECT ra.relationship_type_definition_id,ra.id AS assignment_id,
                ra.attribute_definition_id,ad.code AS attribute_code,ad.name AS attribute_name,
                ad.data_type,ra.sequence_no,ra.required,ra.cardinality,ra.local_label,
                ad.enumeration_definition_id,ad.reference_object_family,ra.status
           FROM metadata_relationship_attribute_assignments ra
           JOIN metadata_attribute_definitions ad
             ON ad.tenant_id=ra.tenant_id AND ad.id=ra.attribute_definition_id
          WHERE ra.tenant_id=?
          ORDER BY ra.relationship_type_definition_id,ra.sequence_no,ad.code`,[tenantId]
      )
    ]);
    const fieldsByType=new Map<string,RelationshipTypeFieldView[]>();
    for(const row of fields[0]){
      const list=fieldsByType.get(row.relationship_type_definition_id)??[];
      list.push({
        assignmentId:row.assignment_id,
        attributeDefinitionId:row.attribute_definition_id,
        code:row.attribute_code,
        name:row.local_label??row.attribute_name,
        dataType:row.data_type,
        sequence:Number(row.sequence_no),
        required:Boolean(row.required),
        cardinality:row.cardinality,
        ...(row.enumeration_definition_id?{enumerationDefinitionId:row.enumeration_definition_id}:{}),
        ...(row.reference_object_family?{referenceObjectFamily:row.reference_object_family}:{}),
        status:row.status
      });
      fieldsByType.set(row.relationship_type_definition_id,list);
    }
    return types[0].map(row=>({
      id:row.id,code:row.code,name:row.name,
      ...(row.description?{description:row.description}:{}),
      fromTypeDefinitionId:row.from_type_definition_id,fromTypeCode:row.from_type_code,fromTypeName:row.from_type_name,
      toTypeDefinitionId:row.to_type_definition_id,toTypeCode:row.to_type_code,toTypeName:row.to_type_name,
      fromCardinality:row.from_cardinality,toCardinality:row.to_cardinality,
      ...(row.inverse_name?{inverseName:row.inverse_name}:{}),
      version:Number(row.version),
      ...(row.effective_from?{effectiveFrom:row.effective_from.toISOString()}:{}),
      ...(row.effective_to?{effectiveTo:row.effective_to.toISOString()}:{}),
      status:row.status,
      fields:fieldsByType.get(row.id)??[]
    }));
  }

  async getThing(tenantId:TenantId,actorPersonId:string,thingId:string):Promise<ThingView|null>{
    await this.requireRead(tenantId,actorPersonId);
    const [rows]=await this.pool.execute<ThingRow[]>(
      `SELECT co.id,co.object_type,
              COALESCE(co.type_definition_id,ntb.type_definition_id) AS type_definition_id,
              mt.code AS type_code,mt.name AS type_name,
              mt.object_family,co.stable_key,co.display_name,co.status,co.created_at,
              ols.lifecycle_definition_id,ld.name AS lifecycle_definition_name,
              ols.lifecycle_state_id,ls.code AS lifecycle_state_code,ls.name AS lifecycle_state_name,
              ls.category AS lifecycle_state_category,ols.sequence AS lifecycle_sequence
         FROM canonical_objects co
         LEFT JOIN metadata_native_type_bindings ntb
           ON ntb.tenant_id=co.tenant_id
          AND ntb.native_object_type=co.object_type
          AND ntb.status='ACTIVE'
         LEFT JOIN metadata_type_definitions mt
           ON mt.tenant_id=co.tenant_id
          AND mt.id=COALESCE(co.type_definition_id,ntb.type_definition_id)
         LEFT JOIN object_lifecycle_states ols
           ON ols.tenant_id=co.tenant_id AND ols.canonical_object_id=co.id
         LEFT JOIN lifecycle_definitions ld
           ON ld.tenant_id=ols.tenant_id AND ld.id=ols.lifecycle_definition_id
         LEFT JOIN lifecycle_state_definitions ls
           ON ls.tenant_id=ols.tenant_id
          AND ls.lifecycle_definition_id=ols.lifecycle_definition_id
          AND ls.id=ols.lifecycle_state_id
        WHERE co.tenant_id=? AND co.id=?`,[tenantId,thingId]
    );
    return rows[0]?this.getThingInternal(tenantId,rows[0]):null;
  }

  private async getThingInternal(tenantId:TenantId,row:ThingRow):Promise<ThingView>{
    const [fieldResult,relationshipResult]=await Promise.all([
      this.pool.execute<FieldRow[]>(
        `SELECT v.id,v.canonical_object_id,v.type_attribute_assignment_id,v.sequence_no,
                ad.code AS attribute_code,ad.name AS attribute_name,ta.local_label,ad.data_type,
                v.string_value,v.integer_value,v.decimal_value,v.boolean_value,v.date_value,v.datetime_value,
                v.enumeration_value_id,ev.label AS enumeration_label,
                v.reference_object_id,COALESCE(ro.display_name,ro.stable_key) AS reference_label,v.json_value
           FROM metadata_object_attribute_values v
           JOIN metadata_type_attribute_assignments ta
             ON ta.tenant_id=v.tenant_id AND ta.id=v.type_attribute_assignment_id
           JOIN metadata_attribute_definitions ad
             ON ad.tenant_id=ta.tenant_id AND ad.id=ta.attribute_definition_id
           LEFT JOIN metadata_enumeration_values ev
             ON ev.tenant_id=v.tenant_id AND ev.id=v.enumeration_value_id
           LEFT JOIN canonical_objects ro
             ON ro.tenant_id=v.tenant_id AND ro.id=v.reference_object_id
          WHERE v.tenant_id=? AND v.canonical_object_id=?
          ORDER BY ta.sequence_no,v.sequence_no`,[tenantId,row.id]
      ),
      this.pool.execute<RelationshipRow[]>(
        `SELECT cr.id,cr.relationship_type,
                COALESCE(cr.relationship_type_definition_id,nrb.relationship_type_definition_id)
                  AS relationship_type_definition_id,
                rt.name AS relationship_name,rt.inverse_name,
                cr.from_object_id,cr.to_object_id,
                COALESCE(fr.display_name,fr.stable_key) AS from_label,
                COALESCE(tr.display_name,tr.stable_key) AS to_label,
                cr.effective_from,cr.effective_to,cr.status
           FROM canonical_relationships cr
           LEFT JOIN metadata_native_relationship_bindings nrb
             ON nrb.tenant_id=cr.tenant_id
            AND nrb.native_relationship_type=cr.relationship_type
            AND nrb.status='ACTIVE'
           LEFT JOIN metadata_relationship_type_definitions rt
             ON rt.tenant_id=cr.tenant_id
            AND rt.id=COALESCE(cr.relationship_type_definition_id,nrb.relationship_type_definition_id)
           JOIN canonical_objects fr ON fr.tenant_id=cr.tenant_id AND fr.id=cr.from_object_id
           JOIN canonical_objects tr ON tr.tenant_id=cr.tenant_id AND tr.id=cr.to_object_id
          WHERE cr.tenant_id=? AND (cr.from_object_id=? OR cr.to_object_id=?)
          ORDER BY cr.relationship_type,cr.effective_from DESC`,[tenantId,row.id,row.id]
      )
    ]);
    const relationships:ThingRelationshipView[]=[];
    for(const rel of relationshipResult[0]){
      const [values]=await this.pool.execute<RelationshipFieldRow[]>(
        `SELECT v.id,v.canonical_relationship_id,v.relationship_attribute_assignment_id,v.sequence_no,
                ad.code AS attribute_code,ad.name AS attribute_name,ra.local_label,ad.data_type,
                v.string_value,v.integer_value,v.decimal_value,v.boolean_value,v.date_value,v.datetime_value,
                v.enumeration_value_id,ev.label AS enumeration_label,
                v.reference_object_id,COALESCE(ro.display_name,ro.stable_key) AS reference_label,v.json_value
           FROM metadata_relationship_attribute_values v
           JOIN metadata_relationship_attribute_assignments ra
             ON ra.tenant_id=v.tenant_id AND ra.id=v.relationship_attribute_assignment_id
           JOIN metadata_attribute_definitions ad
             ON ad.tenant_id=ra.tenant_id AND ad.id=ra.attribute_definition_id
           LEFT JOIN metadata_enumeration_values ev
             ON ev.tenant_id=v.tenant_id AND ev.id=v.enumeration_value_id
           LEFT JOIN canonical_objects ro
             ON ro.tenant_id=v.tenant_id AND ro.id=v.reference_object_id
          WHERE v.tenant_id=? AND v.canonical_relationship_id=?
          ORDER BY ra.sequence_no,v.sequence_no`,[tenantId,rel.id]
      );
      const outgoing=rel.from_object_id===row.id;
      relationships.push({
        id:rel.id,code:rel.relationship_type,
        name:(outgoing?rel.relationship_name:rel.inverse_name)??rel.relationship_type,
        direction:outgoing?'OUTGOING':'INCOMING',
        fromThingId:rel.from_object_id,toThingId:rel.to_object_id,
        otherThingId:outgoing?rel.to_object_id:rel.from_object_id,
        otherThingLabel:(outgoing?rel.to_label:rel.from_label)??'Thing',
        effectiveFrom:rel.effective_from.toISOString(),
        ...(rel.effective_to?{effectiveTo:rel.effective_to.toISOString()}:{}),status:rel.status,
        fields:values.map(value=>({
          id:value.id,assignmentId:value.relationship_attribute_assignment_id,
          code:value.attribute_code,name:value.local_label??value.attribute_name,
          sequence:value.sequence_no,dataType:value.data_type,value:decode(value)
        }))
      });
    }
    return {
      id:row.id,...(row.type_definition_id?{typeDefinitionId:row.type_definition_id}:{}),
      typeCode:row.type_code??row.object_type,...(row.type_name?{typeName:row.type_name}:{}),
      ...(row.object_family?{objectFamily:row.object_family}:{}),stableKey:row.stable_key,displayName:row.display_name??row.stable_key,status:row.status,
      createdAt:row.created_at.toISOString(),
      ...(row.lifecycle_definition_id&&row.lifecycle_definition_name&&row.lifecycle_state_id&&
          row.lifecycle_state_code&&row.lifecycle_state_name&&row.lifecycle_state_category&&row.lifecycle_sequence!==null
        ?{lifecycle:{
            definitionId:row.lifecycle_definition_id,definitionName:row.lifecycle_definition_name,
            stateId:row.lifecycle_state_id,stateCode:row.lifecycle_state_code,stateName:row.lifecycle_state_name,
            category:row.lifecycle_state_category,sequence:Number(row.lifecycle_sequence)
          }}
        :{}),
      fields:fieldResult[0].map(value=>({
        id:value.id,assignmentId:value.type_attribute_assignment_id,code:value.attribute_code,
        name:value.local_label??value.attribute_name,sequence:value.sequence_no,dataType:value.data_type,value:decode(value)
      })),
      relationships
    };
  }

  private async requireRead(tenantId:TenantId,actorPersonId:string){
    const evaluation=await this.access.evaluatePermission(
      tenantId,actorPersonId,PLATFORM_PERMISSION_KEYS.METADATA_READ,{scopeType:'TENANT'}
    );
    if(!evaluation.allowed) throw new ThingAdministrationReadError(evaluation.reason,'PERMISSION_DENIED');
  }
}
