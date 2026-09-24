import { PLATFORM_PERMISSION_KEYS, type TenantId } from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlSupplierSourcingRepository } from './supplier-sourcing-repository.js';

interface OrganisationRow extends RowDataPacket {
  id:string;legal_name:string;trading_name:string|null;status:string;
}
interface ObjectRow extends RowDataPacket {
  id:string;object_type:string;stable_key:string;
}
interface DecisionRow extends RowDataPacket {
  id:string;decision_type:string;subject_object_id:string;subject_version:string|null;
  outcome:string;reason:string;decided_at:Date;
}

export class SupplierSourcingReadError extends Error {
  constructor(message:string,readonly code:'PERMISSION_DENIED'){
    super(message);
    this.name='SupplierSourcingReadError';
  }
}

export class MySqlSupplierSourcingReadRepository {
  private readonly access:MySqlAccessRepository;
  private readonly repo:MySqlSupplierSourcingRepository;

  constructor(private readonly pool:Pool){
    this.access=new MySqlAccessRepository(pool);
    this.repo=new MySqlSupplierSourcingRepository(pool);
  }

  async getProjection(tenantId:TenantId,actor:string){
    const evaluation=await this.access.evaluatePermission(
      tenantId,actor,PLATFORM_PERMISSION_KEYS.SUPPLIER_SOURCING_READ,{scopeType:'TENANT'}
    );
    if(!evaluation.allowed)throw new SupplierSourcingReadError(evaluation.reason,'PERMISSION_DENIED');

    const [suppliers,contexts,approvals,rules,orgRows,objectRows,decisionRows]=await Promise.all([
      this.repo.listSupplierRelationships(tenantId),
      this.repo.listSourcingContexts(tenantId),
      this.repo.listSourceApprovals(tenantId),
      this.repo.listSourcingRules(tenantId),
      this.pool.execute<OrganisationRow[]>(
        'SELECT id,legal_name,trading_name,status FROM organisations WHERE tenant_id=? ORDER BY legal_name,id',
        [tenantId]
      ),
      this.pool.execute<ObjectRow[]>(
        'SELECT id,object_type,stable_key FROM canonical_objects WHERE tenant_id=? ORDER BY object_type,stable_key,id',
        [tenantId]
      ),
      this.pool.execute<DecisionRow[]>(
        'SELECT id,decision_type,subject_object_id,subject_version,outcome,reason,decided_at FROM decisions WHERE tenant_id=? AND outcome=\'APPROVED\' ORDER BY decided_at DESC,id',
        [tenantId]
      )
    ]);

    const organisationById=new Map(orgRows[0].map(row=>[row.id,row]));
    const contextById=new Map(contexts.map(context=>[context.id,context]));
    const supplierById=new Map(suppliers.map(supplier=>[supplier.id,supplier]));
    const objectById=new Map(objectRows[0].map(row=>[row.id,row]));

    return{
      supplierRelationships:suppliers.map(supplier=>({
        ...supplier,
        organisationName:
          organisationById.get(supplier.supplierOrganisationId)?.trading_name
          ??organisationById.get(supplier.supplierOrganisationId)?.legal_name
          ??supplier.supplierOrganisationId,
        currentApprovals:approvals.filter(
          approval=>approval.supplierRelationshipId===supplier.id&&!approval.supersededBySourceApprovalId
        )
      })),
      sourcingContexts:contexts.map(context=>({
        ...context,
        currentApprovals:approvals.filter(
          approval=>approval.sourcingContextId===context.id&&!approval.supersededBySourceApprovalId
        )
      })),
      sourceApprovals:approvals.map(approval=>({
        ...approval,
        contextCode:contextById.get(approval.sourcingContextId)?.code??approval.sourcingContextId,
        supplierCode:supplierById.get(approval.supplierRelationshipId)?.code??approval.supplierRelationshipId,
        internalItemKey:objectById.get(approval.internalItemObjectId)?.stable_key??approval.internalItemObjectId,
        supplierItemKey:objectById.get(approval.supplierItemObjectId)?.stable_key??approval.supplierItemObjectId,
        current:!approval.supersededBySourceApprovalId
      })),
      sourcingRules:rules.map(rule=>({
        ...rule,
        contextCode:rule.sourcingContextId
          ? contextById.get(rule.sourcingContextId)?.code??rule.sourcingContextId
          :'ALL_CONTEXTS',
        supplierCode:rule.supplierRelationshipId
          ? supplierById.get(rule.supplierRelationshipId)?.code??rule.supplierRelationshipId
          :'ALL_SUPPLIERS'
      })),
      organisations:orgRows[0].map(row=>({
        id:row.id,
        name:row.trading_name??row.legal_name,
        legalName:row.legal_name,
        status:row.status
      })),
      canonicalObjects:objectRows[0].map(row=>({
        id:row.id,objectType:row.object_type,stableKey:row.stable_key
      })),
      decisions:decisionRows[0].map(row=>({
        id:row.id,decisionType:row.decision_type,subjectObjectId:row.subject_object_id,
        ...(row.subject_version?{subjectVersion:row.subject_version}:{}),
        outcome:row.outcome,reason:row.reason,decidedAt:row.decided_at.toISOString()
      })),
      totals:{
        supplierRelationships:suppliers.length,
        releasedSuppliers:suppliers.filter(supplier=>supplier.status==='RELEASED').length,
        sourcingContexts:contexts.filter(context=>context.status==='ACTIVE').length,
        currentApprovals:approvals.filter(approval=>!approval.supersededBySourceApprovalId).length,
        preferredSources:approvals.filter(approval=>!approval.supersededBySourceApprovalId&&approval.sourceStatus==='PREFERRED').length,
        restrictedSources:approvals.filter(approval=>!approval.supersededBySourceApprovalId&&approval.sourceStatus==='DO_NOT_USE').length,
        activeRules:rules.filter(rule=>rule.status==='ACTIVE').length
      }
    };
  }
}
