import { PLATFORM_PERMISSION_KEYS, type TenantId } from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlRecordsRetentionRepository } from './records-retention-repository.js';

interface ScopeRow extends RowDataPacket {
  id:string;
  object_type:string;
  stable_key:string;
}
interface DecisionRow extends RowDataPacket {
  id:string;
  decision_type:string;
  subject_object_id:string;
  subject_version:string|null;
  outcome:string;
  reason:string;
  decided_at:Date;
}

export class RecordsRetentionReadError extends Error {
  constructor(message:string,readonly code:'PERMISSION_DENIED'){
    super(message);
    this.name='RecordsRetentionReadError';
  }
}

export class MySqlRecordsRetentionReadRepository {
  private readonly access:MySqlAccessRepository;
  private readonly repo:MySqlRecordsRetentionRepository;

  constructor(private readonly pool:Pool){
    this.access=new MySqlAccessRepository(pool);
    this.repo=new MySqlRecordsRetentionRepository(pool);
  }

  async getProjection(tenantId:TenantId,actor:string){
    const evaluation=await this.access.evaluatePermission(
      tenantId,
      actor,
      PLATFORM_PERMISSION_KEYS.RECORDS_RETENTION_READ,
      {scopeType:'TENANT'}
    );
    if(!evaluation.allowed){
      throw new RecordsRetentionReadError(evaluation.reason,'PERMISSION_DENIED');
    }

    const [
      policies,rules,holds,schedules,runs,archives,restores,destructionEvidence,results,
      scopeResult,decisionResult
    ]=await Promise.all([
      this.repo.listPolicies(tenantId),
      this.repo.listRules(tenantId),
      this.repo.listHolds(tenantId),
      this.repo.listSchedules(tenantId),
      this.repo.listRuns(tenantId),
      this.repo.listArchives(tenantId),
      this.repo.listRestores(tenantId),
      this.repo.listDestructionEvidence(tenantId),
      this.repo.listResults(tenantId),
      this.pool.execute<ScopeRow[]>(
        'SELECT id,object_type,stable_key FROM canonical_objects WHERE tenant_id=? ORDER BY object_type,stable_key,id',
        [tenantId]
      ),
      this.pool.execute<DecisionRow[]>(
        'SELECT id,decision_type,subject_object_id,subject_version,outcome,reason,decided_at FROM decisions WHERE tenant_id=? AND outcome=\'APPROVED\' ORDER BY decided_at DESC,id',
        [tenantId]
      )
    ]);

    const policyById=new Map(policies.map(policy=>[policy.id,policy]));
    const ruleById=new Map(rules.map(rule=>[rule.id,rule]));
    const archiveById=new Map(archives.map(archive=>[archive.id,archive]));

    return{
      policies:policies.map(policy=>({
        ...policy,
        rules:rules
          .filter(rule=>rule.retentionPolicyId===policy.id)
          .map(rule=>({
            ...rule,
            schedules:schedules.filter(schedule=>schedule.retentionRuleId===rule.id)
          }))
      })),
      holds,
      runs:runs.map(run=>{
        const rule=ruleById.get(run.retentionRuleId);
        const policy=rule?policyById.get(rule.retentionPolicyId):undefined;
        return{
          ...run,
          ruleCode:rule?.code??run.retentionRuleId,
          ruleAction:rule?.dispositionAction,
          policyCode:policy?.code,
          results:results.filter(result=>result.dispositionRunId===run.id),
          archives:archives.filter(archive=>archive.dispositionRunId===run.id),
          destructionEvidence:destructionEvidence.filter(evidence=>evidence.dispositionRunId===run.id)
        };
      }),
      archives:archives.map(archive=>({
        ...archive,
        restores:restores.filter(restore=>restore.archiveRecordId===archive.id)
      })),
      restores:restores.map(restore=>({
        ...restore,
        archiveReference:archiveById.get(restore.archiveRecordId)?.archiveReference??restore.archiveRecordId
      })),
      destructionEvidence,
      scopeObjects:scopeResult[0].map(row=>({
        id:row.id,
        objectType:row.object_type,
        stableKey:row.stable_key
      })),
      decisions:decisionResult[0].map(row=>({
        id:row.id,
        decisionType:row.decision_type,
        subjectObjectId:row.subject_object_id,
        ...(row.subject_version?{subjectVersion:row.subject_version}:{}),
        outcome:row.outcome,
        reason:row.reason,
        decidedAt:row.decided_at.toISOString()
      })),
      totals:{
        policies:policies.length,
        activePolicies:policies.filter(policy=>policy.status==='ACTIVE').length,
        activeHolds:holds.filter(hold=>hold.status==='ACTIVE').length,
        activeRuns:runs.filter(run=>run.status==='QUEUED'||run.status==='RUNNING').length,
        archived:archives.filter(archive=>archive.status==='AVAILABLE').length,
        restored:restores.filter(restore=>restore.status==='SUCCEEDED').length,
        destroyed:destructionEvidence.length,
        exceptionRuns:runs.filter(run=>run.status==='COMPLETED_WITH_EXCEPTIONS'||run.status==='FAILED').length
      }
    };
  }
}
