import { randomUUID } from 'node:crypto';
import {
  ENTERPRISE_RELATIONSHIP_VOCABULARY,
  ENTERPRISE_THING_VOCABULARY,
  PLATFORM_PERMISSION_KEYS,
  type TenantId
} from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlMetadataAdministrationCommandService } from './metadata-administration-command-service.js';
import { MySqlThingAdministrationCommandService } from './thing-administration-command-service.js';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';

interface TypeRow extends RowDataPacket {
  id:string;
  code:string;
  object_family:string;
  extension_package:string|null;
  status:'ACTIVE'|'INACTIVE';
}
interface RelationshipTypeRow extends RowDataPacket {
  id:string;
  code:string;
  from_type_definition_id:string;
  to_type_definition_id:string;
  from_cardinality:'ONE'|'MANY';
  to_cardinality:'ONE'|'MANY';
  status:'ACTIVE'|'INACTIVE';
}
interface CountRow extends RowDataPacket { count:number|string; }

export interface EnterpriseVocabularyProvisioningResult {
  typeDefinitions:number;
  relationshipTypeDefinitions:number;
  nativeTypeBindings:number;
  nativeRelationshipBindings:number;
  canonicalObjectsBound:number;
  canonicalRelationshipsBound:number;
}

export class EnterpriseVocabularyProvisioningError extends Error {
  constructor(
    message:string,
    readonly code:'PERMISSION_DENIED'|'CONFLICT'|'INVALID_INPUT'
  ){
    super(message);
    this.name='EnterpriseVocabularyProvisioningError';
  }
}

export class MySqlEnterpriseVocabularyProvisioningService {
  private readonly access:MySqlAccessRepository;
  private readonly metadata:MySqlMetadataAdministrationCommandService;
  private readonly things:MySqlThingAdministrationCommandService;

  constructor(private readonly pool:Pool){
    this.access=new MySqlAccessRepository(pool);
    this.metadata=new MySqlMetadataAdministrationCommandService(pool);
    this.things=new MySqlThingAdministrationCommandService(pool);
  }

  async provision(
    tenantId:TenantId,
    actorPersonId:string
  ):Promise<EnterpriseVocabularyProvisioningResult>{
    await this.requireManage(tenantId,actorPersonId);

    const typeIds=new Map<string,string>();
    let createdTypes=0;
    for(const entry of ENTERPRISE_THING_VOCABULARY){
      const existing=await this.findType(tenantId,entry.code);
      if(existing){
        if(existing.object_family!==entry.objectFamily){
          throw new EnterpriseVocabularyProvisioningError(
            `Existing Type ${entry.code} uses object family ${existing.object_family}; expected ${entry.objectFamily}.`,
            'CONFLICT'
          );
        }
        if(existing.extension_package&&existing.extension_package!=='NUBLOX_ENTERPRISE_CORE'){
          throw new EnterpriseVocabularyProvisioningError(
            `Existing Type ${entry.code} is owned by extension package ${existing.extension_package}.`,
            'CONFLICT'
          );
        }
        typeIds.set(entry.code,existing.id);
      }else{
        const created=await this.metadata.createTypeDefinition(tenantId,actorPersonId,{
          code:entry.code,
          name:entry.name,
          description:entry.description,
          objectFamily:entry.objectFamily,
          version:1,
          creationPolicyReference:'NATIVE_AUTHORITY',
          extensionPackage:'NUBLOX_ENTERPRISE_CORE'
        });
        typeIds.set(entry.code,created.id);
        createdTypes+=1;
      }
    }

    const relationshipIds=new Map<string,string>();
    let createdRelationships=0;
    for(const entry of ENTERPRISE_RELATIONSHIP_VOCABULARY){
      const fromTypeId=typeIds.get(entry.fromTypeCode);
      const toTypeId=typeIds.get(entry.toTypeCode);
      if(!fromTypeId||!toTypeId){
        throw new EnterpriseVocabularyProvisioningError(
          `Enterprise relationship ${entry.code} references an unprovisioned Type.`,
          'INVALID_INPUT'
        );
      }
      const existing=await this.findRelationshipType(tenantId,entry.code);
      if(existing){
        if(
          existing.from_type_definition_id!==fromTypeId||
          existing.to_type_definition_id!==toTypeId||
          existing.from_cardinality!==entry.fromCardinality||
          existing.to_cardinality!==entry.toCardinality
        ){
          throw new EnterpriseVocabularyProvisioningError(
            `Existing Relationship Type ${entry.code} conflicts with the enterprise vocabulary contract.`,
            'CONFLICT'
          );
        }
        relationshipIds.set(entry.code,existing.id);
      }else{
        const created=await this.things.createRelationshipTypeDefinition(tenantId,actorPersonId,{
          code:entry.code,
          name:entry.name,
          inverseName:entry.inverseName,
          fromTypeDefinitionId:fromTypeId,
          toTypeDefinitionId:toTypeId,
          fromCardinality:entry.fromCardinality,
          toCardinality:entry.toCardinality,
          version:1
        });
        relationshipIds.set(entry.code,created.id);
        createdRelationships+=1;
      }
    }

    return withTransaction(this.pool,async connection=>{
      let nativeTypeBindings=0;
      let nativeRelationshipBindings=0;
      let canonicalObjectsBound=0;
      let canonicalRelationshipsBound=0;

      for(const entry of ENTERPRISE_THING_VOCABULARY){
        const typeDefinitionId=typeIds.get(entry.code);
        if(!typeDefinitionId) continue;
        const id=`NTB-${randomUUID()}`;
        const [before]=await connection.execute<CountRow[]>(
          `SELECT COUNT(*) AS count FROM metadata_native_type_bindings
            WHERE tenant_id=? AND native_object_type=?`,
          [tenantId,entry.nativeObjectType]
        );
        await connection.execute(
          `INSERT INTO metadata_native_type_bindings
            (id,tenant_id,native_object_type,type_definition_id,source_authority,status,
             created_by_person_id,updated_by_person_id)
           VALUES (?,?,?,?,?,'ACTIVE',?,?)
           ON DUPLICATE KEY UPDATE
             type_definition_id=VALUES(type_definition_id),
             source_authority=VALUES(source_authority),
             status='ACTIVE',
             updated_by_person_id=VALUES(updated_by_person_id),
             row_version=row_version+1`,
          [id,tenantId,entry.nativeObjectType,typeDefinitionId,entry.sourceAuthority,actorPersonId,actorPersonId]
        );
        if(Number(before[0]?.count??0)===0) nativeTypeBindings+=1;
        const [updateResult]=await connection.execute<import('mysql2/promise').ResultSetHeader>(
          `UPDATE canonical_objects
              SET type_definition_id=?
            WHERE tenant_id=? AND object_type=? AND type_definition_id IS NULL`,
          [typeDefinitionId,tenantId,entry.nativeObjectType]
        );
        canonicalObjectsBound+=updateResult.affectedRows;
      }

      for(const entry of ENTERPRISE_RELATIONSHIP_VOCABULARY){
        const relationshipTypeDefinitionId=relationshipIds.get(entry.code);
        if(!relationshipTypeDefinitionId) continue;
        for(const nativeRelationshipType of entry.nativeRelationshipTypes){
          const [before]=await connection.execute<CountRow[]>(
            `SELECT COUNT(*) AS count FROM metadata_native_relationship_bindings
              WHERE tenant_id=? AND native_relationship_type=?`,
            [tenantId,nativeRelationshipType]
          );
          await connection.execute(
            `INSERT INTO metadata_native_relationship_bindings
              (id,tenant_id,native_relationship_type,relationship_type_definition_id,
               source_authority,status,created_by_person_id,updated_by_person_id)
             VALUES (?,?,?,?,?,'ACTIVE',?,?)
             ON DUPLICATE KEY UPDATE
               relationship_type_definition_id=VALUES(relationship_type_definition_id),
               source_authority=VALUES(source_authority),
               status='ACTIVE',
               updated_by_person_id=VALUES(updated_by_person_id),
               row_version=row_version+1`,
            [`NRB-${randomUUID()}`,tenantId,nativeRelationshipType,relationshipTypeDefinitionId,
             entry.sourceAuthority,actorPersonId,actorPersonId]
          );
          if(Number(before[0]?.count??0)===0) nativeRelationshipBindings+=1;
          const [updateResult]=await connection.execute<import('mysql2/promise').ResultSetHeader>(
            `UPDATE canonical_relationships
                SET relationship_type_definition_id=?
              WHERE tenant_id=? AND relationship_type=?
                AND relationship_type_definition_id IS NULL`,
            [relationshipTypeDefinitionId,tenantId,nativeRelationshipType]
          );
          canonicalRelationshipsBound+=updateResult.affectedRows;
        }
      }

      const result:EnterpriseVocabularyProvisioningResult={
        typeDefinitions:ENTERPRISE_THING_VOCABULARY.length,
        relationshipTypeDefinitions:ENTERPRISE_RELATIONSHIP_VOCABULARY.length,
        nativeTypeBindings,
        nativeRelationshipBindings,
        canonicalObjectsBound,
        canonicalRelationshipsBound
      };

      await connection.execute(
        `INSERT INTO kernel_audit_entries
          (tenant_id,entity_type,entity_id,action,actor_person_id,correlation_id,payload)
         VALUES (?,?,?,?,?,?,?)`,
        [tenantId,'ENTERPRISE_VOCABULARY','NUBLOX_ENTERPRISE_CORE','PROVISIONED',
         actorPersonId,'ENTERPRISE-VOCABULARY',JSON.stringify({
           ...result,createdTypes,createdRelationships
         })]
      );
      await writeOutboxEvent(connection,{
        tenantId,
        aggregateType:'ENTERPRISE_VOCABULARY',
        aggregateId:'NUBLOX_ENTERPRISE_CORE',
        eventType:'ENTERPRISE_VOCABULARY.PROVISIONED',
        payload:{...result,createdTypes,createdRelationships}
      });
      return result;
    });
  }

  private async findType(tenantId:TenantId,code:string):Promise<TypeRow|undefined>{
    const [rows]=await this.pool.execute<TypeRow[]>(
      `SELECT id,code,object_family,extension_package,status
         FROM metadata_type_definitions
        WHERE tenant_id=? AND code=? AND status='ACTIVE'
        ORDER BY version DESC LIMIT 1`,
      [tenantId,code]
    );
    return rows[0];
  }

  private async findRelationshipType(
    tenantId:TenantId,
    code:string
  ):Promise<RelationshipTypeRow|undefined>{
    const [rows]=await this.pool.execute<RelationshipTypeRow[]>(
      `SELECT id,code,from_type_definition_id,to_type_definition_id,
              from_cardinality,to_cardinality,status
         FROM metadata_relationship_type_definitions
        WHERE tenant_id=? AND code=? AND status='ACTIVE'
        ORDER BY version DESC LIMIT 1`,
      [tenantId,code]
    );
    return rows[0];
  }

  private async requireManage(tenantId:TenantId,actorPersonId:string):Promise<void>{
    const evaluation=await this.access.evaluatePermission(
      tenantId,actorPersonId,PLATFORM_PERMISSION_KEYS.METADATA_MANAGE,{scopeType:'TENANT'}
    );
    if(!evaluation.allowed){
      throw new EnterpriseVocabularyProvisioningError(evaluation.reason,'PERMISSION_DENIED');
    }
  }
}
