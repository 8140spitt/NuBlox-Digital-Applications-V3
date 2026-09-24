import {
  PLATFORM_PERMISSION_KEYS,
  type MetadataDataType,
  type TenantId
} from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';

interface ThingRow extends RowDataPacket {
  id:string; object_type:string; type_definition_id:string|null; type_code:string|null; type_name:string|null;
  stable_key:string; display_name:string|null; status:'ACTIVE'|'INACTIVE'; created_at:Date;
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
  id:string;typeDefinitionId?:string;typeCode:string;typeName?:string;stableKey:string;displayName:string;
  status:'ACTIVE'|'INACTIVE';createdAt:string;fields:ThingFieldView[];relationships:ThingRelationshipView[];
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
      `SELECT co.id,co.object_type,co.type_definition_id,mt.code AS type_code,mt.name AS type_name,
              co.stable_key,co.display_name,co.status,co.created_at
         FROM canonical_objects co
         LEFT JOIN metadata_type_definitions mt
           ON mt.tenant_id=co.tenant_id AND mt.id=co.type_definition_id
        WHERE co.tenant_id=? AND co.type_definition_id IS NOT NULL
        ORDER BY mt.code,co.stable_key`,[tenantId]
    );
    const result:ThingView[]=[];
    for(const row of rows) result.push(await this.getThingInternal(tenantId,row));
    return result;
  }

  async getThing(tenantId:TenantId,actorPersonId:string,thingId:string):Promise<ThingView|null>{
    await this.requireRead(tenantId,actorPersonId);
    const [rows]=await this.pool.execute<ThingRow[]>(
      `SELECT co.id,co.object_type,co.type_definition_id,mt.code AS type_code,mt.name AS type_name,
              co.stable_key,co.display_name,co.status,co.created_at
         FROM canonical_objects co
         LEFT JOIN metadata_type_definitions mt
           ON mt.tenant_id=co.tenant_id AND mt.id=co.type_definition_id
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
        `SELECT cr.id,cr.relationship_type,cr.relationship_type_definition_id,
                rt.name AS relationship_name,rt.inverse_name,
                cr.from_object_id,cr.to_object_id,
                COALESCE(fr.display_name,fr.stable_key) AS from_label,
                COALESCE(tr.display_name,tr.stable_key) AS to_label,
                cr.effective_from,cr.effective_to,cr.status
           FROM canonical_relationships cr
           LEFT JOIN metadata_relationship_type_definitions rt
             ON rt.tenant_id=cr.tenant_id AND rt.id=cr.relationship_type_definition_id
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
      stableKey:row.stable_key,displayName:row.display_name??row.stable_key,status:row.status,
      createdAt:row.created_at.toISOString(),
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
