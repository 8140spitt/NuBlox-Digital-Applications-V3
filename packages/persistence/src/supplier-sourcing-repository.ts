import {
  cancelSupplierRelationship,
  createSourceApproval,
  createSourcingContext,
  createSourcingRule,
  createSupplierRelationship,
  releaseSupplierRelationship,
  type CanonicalObjectIdentity,
  type Decision,
  type Organisation,
  type Person,
  type SourceApproval,
  type SourcingContext,
  type SourcingRule,
  type SupplierRelationship,
  type TenantId
} from '@nublox/kernel';
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';
import type { AuditContext } from './repository.js';

interface SupplierRelationshipRow extends RowDataPacket {
  id:string;tenant_id:string;supplier_organisation_id:string;relationship_type:SupplierRelationship['relationshipType'];
  code:string;name:string;status:SupplierRelationship['status'];created_by_person_id:string;
  relationship_created_at:Date;released_decision_id:string|null;released_at:Date|null;
  cancelled_decision_id:string|null;cancelled_at:Date|null;row_version:number;
}
interface SourcingContextRow extends RowDataPacket {
  id:string;tenant_id:string;code:string;name:string;description:string|null;scope_type:string;
  scope_object_id:string|null;criteria:string|Record<string,unknown>;status:SourcingContext['status'];
  created_by_person_id:string;context_created_at:Date;row_version:number;
}
interface SourceApprovalRow extends RowDataPacket {
  id:string;tenant_id:string;sourcing_context_id:string;supplier_relationship_id:string;
  internal_item_object_id:string;supplier_item_object_id:string;source_status:SourceApproval['sourceStatus'];
  rationale:string;effective_from:Date;effective_to:Date|null;approval_decision_id:string;
  approved_by_person_id:string;approved_at:Date;superseded_by_source_approval_id:string|null;
}
interface SourcingRuleRow extends RowDataPacket {
  id:string;tenant_id:string;code:string;name:string;sourcing_context_id:string|null;
  supplier_relationship_id:string|null;item_object_type:string|null;criteria:string|Record<string,unknown>;
  assigned_status:SourcingRule['assignedStatus'];priority:number;status:SourcingRule['status'];
  created_by_person_id:string;rule_created_at:Date;row_version:number;
}
interface PersonRow extends RowDataPacket {
  id:string;tenant_id:string;party_id:string;legal_name:string;preferred_name:string|null;status:Person['status'];
}
interface OrganisationRow extends RowDataPacket {
  id:string;tenant_id:string;party_id:string;legal_name:string;trading_name:string|null;status:Organisation['status'];
}
interface DecisionRow extends RowDataPacket {
  id:string;tenant_id:string;decision_type:string;subject_object_id:string;subject_version:string|null;
  outcome:string;reason:string;decider_person_id:string;authority_grant_id:string|null;decided_at:Date;
}
interface ObjectRow extends RowDataPacket {
  id:string;tenant_id:string;object_type:string;stable_key:string;created_at:Date;
}

function objectJson(value:unknown):Readonly<Record<string,unknown>>{
  const parsed=typeof value==='string'?JSON.parse(value):value;
  return typeof parsed==='object'&&parsed!==null&&!Array.isArray(parsed)
    ? parsed as Readonly<Record<string,unknown>>
    : {};
}

const mapSupplier=(r:SupplierRelationshipRow):SupplierRelationship=>({
  id:r.id as SupplierRelationship['id'],tenantId:r.tenant_id as TenantId,
  supplierOrganisationId:r.supplier_organisation_id as SupplierRelationship['supplierOrganisationId'],
  relationshipType:r.relationship_type,code:r.code,name:r.name,status:r.status,
  createdByPersonId:r.created_by_person_id as SupplierRelationship['createdByPersonId'],
  createdAt:r.relationship_created_at.toISOString(),
  ...(r.released_decision_id?{releasedDecisionId:r.released_decision_id as NonNullable<SupplierRelationship['releasedDecisionId']>}:{}),
  ...(r.released_at?{releasedAt:r.released_at.toISOString()}:{}),
  ...(r.cancelled_decision_id?{cancelledDecisionId:r.cancelled_decision_id as NonNullable<SupplierRelationship['cancelledDecisionId']>}:{}),
  ...(r.cancelled_at?{cancelledAt:r.cancelled_at.toISOString()}:{})
});
const mapContext=(r:SourcingContextRow):SourcingContext=>({
  id:r.id as SourcingContext['id'],tenantId:r.tenant_id as TenantId,
  code:r.code,name:r.name,...(r.description?{description:r.description}:{}),
  scopeType:r.scope_type,
  ...(r.scope_object_id?{scopeObjectId:r.scope_object_id as NonNullable<SourcingContext['scopeObjectId']>}:{}),
  criteria:objectJson(r.criteria),status:r.status,
  createdByPersonId:r.created_by_person_id as SourcingContext['createdByPersonId'],
  createdAt:r.context_created_at.toISOString()
});
const mapApproval=(r:SourceApprovalRow):SourceApproval=>({
  id:r.id as SourceApproval['id'],tenantId:r.tenant_id as TenantId,
  sourcingContextId:r.sourcing_context_id as SourceApproval['sourcingContextId'],
  supplierRelationshipId:r.supplier_relationship_id as SourceApproval['supplierRelationshipId'],
  internalItemObjectId:r.internal_item_object_id as SourceApproval['internalItemObjectId'],
  supplierItemObjectId:r.supplier_item_object_id as SourceApproval['supplierItemObjectId'],
  sourceStatus:r.source_status,rationale:r.rationale,effectiveFrom:r.effective_from.toISOString(),
  ...(r.effective_to?{effectiveTo:r.effective_to.toISOString()}:{}),
  approvalDecisionId:r.approval_decision_id as SourceApproval['approvalDecisionId'],
  approvedByPersonId:r.approved_by_person_id as SourceApproval['approvedByPersonId'],
  approvedAt:r.approved_at.toISOString(),
  ...(r.superseded_by_source_approval_id?{
    supersededBySourceApprovalId:r.superseded_by_source_approval_id as NonNullable<SourceApproval['supersededBySourceApprovalId']>
  }:{})
});
const mapRule=(r:SourcingRuleRow):SourcingRule=>({
  id:r.id as SourcingRule['id'],tenantId:r.tenant_id as TenantId,code:r.code,name:r.name,
  ...(r.sourcing_context_id?{sourcingContextId:r.sourcing_context_id as NonNullable<SourcingRule['sourcingContextId']>}:{}),
  ...(r.supplier_relationship_id?{
    supplierRelationshipId:r.supplier_relationship_id as NonNullable<SourcingRule['supplierRelationshipId']>
  }:{}),
  ...(r.item_object_type?{itemObjectType:r.item_object_type}:{}),
  criteria:objectJson(r.criteria),assignedStatus:r.assigned_status,priority:Number(r.priority),
  status:r.status,createdByPersonId:r.created_by_person_id as SourcingRule['createdByPersonId'],
  createdAt:r.rule_created_at.toISOString()
});
const mapPerson=(r:PersonRow):Person=>({
  id:r.id as Person['id'],tenantId:r.tenant_id as TenantId,partyId:r.party_id as Person['partyId'],
  legalName:r.legal_name,...(r.preferred_name?{preferredName:r.preferred_name}:{}),status:r.status
});
const mapOrganisation=(r:OrganisationRow):Organisation=>({
  id:r.id as Organisation['id'],tenantId:r.tenant_id as TenantId,partyId:r.party_id as Organisation['partyId'],
  legalName:r.legal_name,...(r.trading_name?{tradingName:r.trading_name}:{}),status:r.status
});
const mapDecision=(r:DecisionRow):Decision=>({
  id:r.id as Decision['id'],tenantId:r.tenant_id as TenantId,decisionType:r.decision_type,
  subjectObjectId:r.subject_object_id as Decision['subjectObjectId'],
  ...(r.subject_version?{subjectVersion:r.subject_version}:{}),outcome:r.outcome,reason:r.reason,
  deciderPersonId:r.decider_person_id as Decision['deciderPersonId'],
  ...(r.authority_grant_id?{authorityGrantId:r.authority_grant_id as NonNullable<Decision['authorityGrantId']>}:{}),
  decidedAt:r.decided_at.toISOString()
});
const mapObject=(r:ObjectRow):CanonicalObjectIdentity=>({
  id:r.id as CanonicalObjectIdentity['id'],tenantId:r.tenant_id as TenantId,
  objectType:r.object_type,stableKey:r.stable_key,createdAt:r.created_at.toISOString()
});

async function evidence(
  c:PoolConnection,t:TenantId,type:string,id:string,action:string,audit:AuditContext,payload:unknown
){
  await c.execute(
    'INSERT INTO kernel_audit_entries (tenant_id,entity_type,entity_id,action,actor_person_id,correlation_id,payload) VALUES (?,?,?,?,?,?,?)',
    [t,type,id,action,audit.actorPersonId??null,audit.correlationId??null,JSON.stringify(payload)]
  );
  await writeOutboxEvent(c,{tenantId:t,aggregateType:type,aggregateId:id,eventType:type+'.'+action,payload});
}

export class MySqlSupplierSourcingRepository {
  constructor(private readonly pool:Pool){}

  async createSupplierRelationship(input:SupplierRelationship,audit:AuditContext={}):Promise<void>{
    const [organisation,creator]=await Promise.all([
      this.requireOrganisation(input.tenantId,input.supplierOrganisationId),
      this.requirePerson(input.tenantId,input.createdByPersonId)
    ]);
    createSupplierRelationship(input,organisation,creator);
    await withTransaction(this.pool,async c=>{
      await c.execute(
        'INSERT INTO supplier_relationships (id,tenant_id,supplier_organisation_id,relationship_type,code,name,status,created_by_person_id,relationship_created_at,released_decision_id,released_at,cancelled_decision_id,cancelled_at,updated_by_person_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [input.id,input.tenantId,input.supplierOrganisationId,input.relationshipType,input.code,input.name,input.status,input.createdByPersonId,new Date(input.createdAt),null,null,null,null,audit.actorPersonId??null]
      );
      await evidence(c,input.tenantId,'SUPPLIER_RELATIONSHIP',input.id,'CREATED',audit,input);
    });
  }

  async releaseSupplierRelationship(
    t:TenantId,id:SupplierRelationship['id'],decisionId:Decision['id'],releasedAt:string,audit:AuditContext={}
  ):Promise<SupplierRelationship>{
    return withTransaction(this.pool,async c=>{
      const [rows]=await c.execute<SupplierRelationshipRow[]>(
        'SELECT * FROM supplier_relationships WHERE tenant_id=? AND id=? FOR UPDATE',[t,id]
      );
      if(!rows[0])throw new Error('Supplier Relationship not found in tenant.');
      const decision=await this.requireDecision(t,decisionId,c);
      const next=releaseSupplierRelationship(mapSupplier(rows[0]),decision,releasedAt);
      const [u]=await c.execute<ResultSetHeader>(
        'UPDATE supplier_relationships SET status=?,released_decision_id=?,released_at=?,updated_by_person_id=?,row_version=row_version+1 WHERE tenant_id=? AND id=? AND row_version=?',
        [next.status,next.releasedDecisionId!,new Date(releasedAt),audit.actorPersonId??null,t,id,rows[0].row_version]
      );
      if(u.affectedRows!==1)throw new Error('Concurrent Supplier Relationship release detected.');
      await evidence(c,t,'SUPPLIER_RELATIONSHIP',id,'RELEASED',audit,next);
      return next;
    });
  }

  async cancelSupplierRelationship(
    t:TenantId,id:SupplierRelationship['id'],decisionId:Decision['id'],cancelledAt:string,audit:AuditContext={}
  ):Promise<SupplierRelationship>{
    return withTransaction(this.pool,async c=>{
      const [rows]=await c.execute<SupplierRelationshipRow[]>(
        'SELECT * FROM supplier_relationships WHERE tenant_id=? AND id=? FOR UPDATE',[t,id]
      );
      if(!rows[0])throw new Error('Supplier Relationship not found in tenant.');
      const decision=await this.requireDecision(t,decisionId,c);
      const next=cancelSupplierRelationship(mapSupplier(rows[0]),decision,cancelledAt);
      const [u]=await c.execute<ResultSetHeader>(
        'UPDATE supplier_relationships SET status=?,cancelled_decision_id=?,cancelled_at=?,updated_by_person_id=?,row_version=row_version+1 WHERE tenant_id=? AND id=? AND row_version=?',
        [next.status,next.cancelledDecisionId!,new Date(cancelledAt),audit.actorPersonId??null,t,id,rows[0].row_version]
      );
      if(u.affectedRows!==1)throw new Error('Concurrent Supplier Relationship cancellation detected.');
      await evidence(c,t,'SUPPLIER_RELATIONSHIP',id,'CANCELLED',audit,next);
      return next;
    });
  }

  async createSourcingContext(input:SourcingContext,audit:AuditContext={}):Promise<void>{
    const [creator,scope]=await Promise.all([
      this.requirePerson(input.tenantId,input.createdByPersonId),
      input.scopeObjectId?this.requireObject(input.tenantId,input.scopeObjectId):Promise.resolve(undefined)
    ]);
    createSourcingContext(input,creator,scope);
    await withTransaction(this.pool,async c=>{
      await c.execute(
        'INSERT INTO sourcing_contexts (id,tenant_id,code,name,description,scope_type,scope_object_id,criteria,status,created_by_person_id,context_created_at,updated_by_person_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [input.id,input.tenantId,input.code,input.name,input.description??null,input.scopeType,input.scopeObjectId??null,JSON.stringify(input.criteria),input.status,input.createdByPersonId,new Date(input.createdAt),audit.actorPersonId??null]
      );
      await evidence(c,input.tenantId,'SOURCING_CONTEXT',input.id,'CREATED',audit,input);
    });
  }

  async createSourceApproval(input:SourceApproval,audit:AuditContext={}):Promise<void>{
    await withTransaction(this.pool,async c=>{
      const [context,supplier,internalItem,supplierItem,decision,approver]=await Promise.all([
        this.requireContext(input.tenantId,input.sourcingContextId,c),
        this.requireSupplier(input.tenantId,input.supplierRelationshipId,c),
        this.requireObject(input.tenantId,input.internalItemObjectId,c),
        this.requireObject(input.tenantId,input.supplierItemObjectId,c),
        this.requireDecision(input.tenantId,input.approvalDecisionId,c),
        this.requirePerson(input.tenantId,input.approvedByPersonId,c)
      ]);
      createSourceApproval(input,context,supplier,internalItem,supplierItem,decision,approver);

      const [currentRows]=await c.execute<SourceApprovalRow[]>(
        'SELECT * FROM source_approvals WHERE tenant_id=? AND sourcing_context_id=? AND supplier_relationship_id=? AND internal_item_object_id=? AND supplier_item_object_id=? AND current_guard=1 FOR UPDATE',
        [input.tenantId,input.sourcingContextId,input.supplierRelationshipId,input.internalItemObjectId,input.supplierItemObjectId]
      );
      const current=currentRows[0]?mapApproval(currentRows[0]):undefined;
      if(current&&Date.parse(input.effectiveFrom)<Date.parse(current.effectiveFrom)){
        throw new Error('Replacement Source Approval cannot become effective before the current approval.');
      }

      await c.execute(
        'INSERT INTO source_approvals (id,tenant_id,sourcing_context_id,supplier_relationship_id,internal_item_object_id,supplier_item_object_id,source_status,rationale,effective_from,effective_to,approval_decision_id,approved_by_person_id,approved_at,superseded_by_source_approval_id,current_guard) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [input.id,input.tenantId,input.sourcingContextId,input.supplierRelationshipId,input.internalItemObjectId,input.supplierItemObjectId,input.sourceStatus,input.rationale,new Date(input.effectiveFrom),input.effectiveTo?new Date(input.effectiveTo):null,input.approvalDecisionId,input.approvedByPersonId,new Date(input.approvedAt),null,1]
      );

      if(current){
        await c.execute(
          'UPDATE source_approvals SET superseded_by_source_approval_id=?,current_guard=NULL WHERE tenant_id=? AND id=? AND current_guard=1',
          [input.id,input.tenantId,current.id]
        );
      }
      await evidence(c,input.tenantId,'SOURCE_APPROVAL',input.id,'APPROVED',audit,input);
      if(current)await evidence(c,input.tenantId,'SOURCE_APPROVAL',current.id,'SUPERSEDED',audit,{supersededBySourceApprovalId:input.id});
    });
  }

  async createSourcingRule(input:SourcingRule,audit:AuditContext={}):Promise<void>{
    const [creator,context,supplier]=await Promise.all([
      this.requirePerson(input.tenantId,input.createdByPersonId),
      input.sourcingContextId?this.requireContext(input.tenantId,input.sourcingContextId):Promise.resolve(undefined),
      input.supplierRelationshipId?this.requireSupplier(input.tenantId,input.supplierRelationshipId):Promise.resolve(undefined)
    ]);
    createSourcingRule(input,creator,context,supplier);
    await withTransaction(this.pool,async c=>{
      await c.execute(
        'INSERT INTO sourcing_rules (id,tenant_id,code,name,sourcing_context_id,supplier_relationship_id,item_object_type,criteria,assigned_status,priority,status,created_by_person_id,rule_created_at,updated_by_person_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [input.id,input.tenantId,input.code,input.name,input.sourcingContextId??null,input.supplierRelationshipId??null,input.itemObjectType??null,JSON.stringify(input.criteria),input.assignedStatus,input.priority,input.status,input.createdByPersonId,new Date(input.createdAt),audit.actorPersonId??null]
      );
      await evidence(c,input.tenantId,'SOURCING_RULE',input.id,'CREATED',audit,input);
    });
  }

  async setSourcingRuleStatus(
    t:TenantId,id:SourcingRule['id'],status:SourcingRule['status'],audit:AuditContext={}
  ):Promise<SourcingRule>{
    return withTransaction(this.pool,async c=>{
      const [rows]=await c.execute<SourcingRuleRow[]>(
        'SELECT * FROM sourcing_rules WHERE tenant_id=? AND id=? FOR UPDATE',[t,id]
      );
      if(!rows[0])throw new Error('Sourcing Rule not found in tenant.');
      const current=mapRule(rows[0]);
      const next={...current,status};
      const [u]=await c.execute<ResultSetHeader>(
        'UPDATE sourcing_rules SET status=?,updated_by_person_id=?,row_version=row_version+1 WHERE tenant_id=? AND id=? AND row_version=?',
        [status,audit.actorPersonId??null,t,id,rows[0].row_version]
      );
      if(u.affectedRows!==1)throw new Error('Concurrent Sourcing Rule update detected.');
      await evidence(c,t,'SOURCING_RULE',id,status,audit,next);
      return next;
    });
  }

  async listSupplierRelationships(t:TenantId){const [r]=await this.pool.execute<SupplierRelationshipRow[]>('SELECT * FROM supplier_relationships WHERE tenant_id=? ORDER BY code,id',[t]);return r.map(mapSupplier);}
  async listSourcingContexts(t:TenantId){const [r]=await this.pool.execute<SourcingContextRow[]>('SELECT * FROM sourcing_contexts WHERE tenant_id=? ORDER BY code,id',[t]);return r.map(mapContext);}
  async listSourceApprovals(t:TenantId){const [r]=await this.pool.execute<SourceApprovalRow[]>('SELECT * FROM source_approvals WHERE tenant_id=? ORDER BY approved_at DESC,id',[t]);return r.map(mapApproval);}
  async listSourcingRules(t:TenantId){const [r]=await this.pool.execute<SourcingRuleRow[]>('SELECT * FROM sourcing_rules WHERE tenant_id=? ORDER BY priority,code,id',[t]);return r.map(mapRule);}

  private async requireSupplier(t:TenantId,id:SupplierRelationship['id'],c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<SupplierRelationshipRow[]>('SELECT * FROM supplier_relationships WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Supplier Relationship not found in tenant.');return mapSupplier(r[0]);}
  private async requireContext(t:TenantId,id:SourcingContext['id'],c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<SourcingContextRow[]>('SELECT * FROM sourcing_contexts WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Sourcing Context not found in tenant.');return mapContext(r[0]);}
  private async requirePerson(t:TenantId,id:Person['id'],c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<PersonRow[]>('SELECT id,tenant_id,party_id,legal_name,preferred_name,status FROM persons WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Person not found in tenant.');return mapPerson(r[0]);}
  private async requireOrganisation(t:TenantId,id:Organisation['id'],c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<OrganisationRow[]>('SELECT id,tenant_id,party_id,legal_name,trading_name,status FROM organisations WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Organisation not found in tenant.');return mapOrganisation(r[0]);}
  private async requireDecision(t:TenantId,id:Decision['id'],c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<DecisionRow[]>('SELECT * FROM decisions WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Decision not found in tenant.');return mapDecision(r[0]);}
  private async requireObject(t:TenantId,id:string,c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<ObjectRow[]>('SELECT id,tenant_id,object_type,stable_key,created_at FROM canonical_objects WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Canonical Object not found in tenant.');return mapObject(r[0]);}
}
