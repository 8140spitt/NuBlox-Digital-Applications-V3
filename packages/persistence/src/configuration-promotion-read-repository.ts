import { PLATFORM_PERMISSION_KEYS, type TenantId } from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlConfigurationPromotionRepository } from './configuration-promotion-repository.js';

interface ScopeRow extends RowDataPacket {
  id:string; object_type:string; stable_key:string;
}
interface DecisionRow extends RowDataPacket {
  id:string; decision_type:string; subject_object_id:string; subject_version:string|null;
  outcome:string; reason:string; decided_at:Date;
}

export class ConfigurationPromotionReadError extends Error {
  constructor(message:string,readonly code:'PERMISSION_DENIED'){super(message);this.name='ConfigurationPromotionReadError';}
}

export class MySqlConfigurationPromotionReadRepository {
  private readonly access:MySqlAccessRepository;
  private readonly repo:MySqlConfigurationPromotionRepository;
  constructor(private readonly pool:Pool){
    this.access=new MySqlAccessRepository(pool);
    this.repo=new MySqlConfigurationPromotionRepository(pool);
  }

  async getProjection(t:TenantId,actor:string){
    const e=await this.access.evaluatePermission(
      t,actor,PLATFORM_PERMISSION_KEYS.CONFIGURATION_PROMOTION_READ,{scopeType:'TENANT'}
    );
    if(!e.allowed)throw new ConfigurationPromotionReadError(e.reason,'PERMISSION_DENIED');

    const [environments,baselines,baselineItems,changeSets,changeItems,runs,results,conflicts,scopeResult,decisionResult]=await Promise.all([
      this.repo.listEnvironments(t),
      this.repo.listBaselines(t),
      this.repo.listBaselineItems(t),
      this.repo.listChangeSets(t),
      this.repo.listChangeItems(t),
      this.repo.listRuns(t),
      this.repo.listResults(t),
      this.repo.listConflicts(t),
      this.pool.execute<ScopeRow[]>(
        'SELECT id,object_type,stable_key FROM canonical_objects WHERE tenant_id=? ORDER BY object_type,stable_key,id',
        [t]
      ),
      this.pool.execute<DecisionRow[]>(
        'SELECT id,decision_type,subject_object_id,subject_version,outcome,reason,decided_at FROM decisions WHERE tenant_id=? AND outcome=\'APPROVED\' ORDER BY decided_at DESC,id',
        [t]
      )
    ]);

    const environmentById=new Map(environments.map(x=>[x.id,x]));
    const baselineById=new Map(baselines.map(x=>[x.id,x]));
    const changeSetById=new Map(changeSets.map(x=>[x.id,x]));

    return {
      environments:environments.map(environment=>({
        ...environment,
        baselines:baselines
          .filter(b=>b.environmentId===environment.id)
          .map(b=>({...b,items:baselineItems.filter(i=>i.baselineId===b.id)}))
      })),
      changeSets:changeSets.map(set=>({
        ...set,
        sourceEnvironmentName:environmentById.get(set.sourceEnvironmentId)?.name ?? set.sourceEnvironmentId,
        baseBaselineReference:baselineById.get(set.baseBaselineId)?.baselineReference ?? set.baseBaselineId,
        items:changeItems.filter(i=>i.changeSetId===set.id)
      })),
      runs:runs.map(run=>({
        ...run,
        changeSetCode:changeSetById.get(run.changeSetId)?.code ?? run.changeSetId,
        sourceEnvironmentName:environmentById.get(run.sourceEnvironmentId)?.name ?? run.sourceEnvironmentId,
        targetEnvironmentName:environmentById.get(run.targetEnvironmentId)?.name ?? run.targetEnvironmentId,
        sourceBaselineReference:baselineById.get(run.sourceBaselineId)?.baselineReference ?? run.sourceBaselineId,
        expectedTargetBaselineReference:baselineById.get(run.expectedTargetBaselineId)?.baselineReference ?? run.expectedTargetBaselineId,
        resultingTargetBaselineReference:run.resultingTargetBaselineId
          ? baselineById.get(run.resultingTargetBaselineId)?.baselineReference ?? run.resultingTargetBaselineId
          : undefined,
        results:results.filter(r=>r.promotionRunId===run.id),
        conflicts:conflicts.filter(c=>c.promotionRunId===run.id)
      })),
      scopeObjects:scopeResult[0].map(row=>({
        id:row.id,objectType:row.object_type,stableKey:row.stable_key
      })),
      decisions:decisionResult[0].map(row=>({
        id:row.id,decisionType:row.decision_type,subjectObjectId:row.subject_object_id,
        ...(row.subject_version?{subjectVersion:row.subject_version}:{}),
        outcome:row.outcome,reason:row.reason,decidedAt:row.decided_at.toISOString()
      })),
      totals:{
        environments:environments.length,
        frozenBaselines:baselines.filter(b=>b.status==='FROZEN').length,
        approvedChangeSets:changeSets.filter(s=>s.status==='APPROVED').length,
        activePromotions:runs.filter(r=>r.status==='QUEUED'||r.status==='RUNNING').length,
        blockedPromotions:runs.filter(r=>r.status==='BLOCKED').length,
        succeededPromotions:runs.filter(r=>r.status==='SUCCEEDED').length
      }
    };
  }
}
