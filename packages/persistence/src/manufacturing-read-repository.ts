import { PLATFORM_PERMISSION_KEYS,type TenantId } from '@nublox/kernel';
import type { Pool,RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlManufacturingRepository } from './manufacturing-repository.js';

interface ObjectRow extends RowDataPacket{id:string;object_type:string;stable_key:string;}
interface DecisionRow extends RowDataPacket{id:string;decision_type:string;subject_object_id:string;subject_version:string|null;outcome:string;reason:string;decided_at:Date;}

export class ManufacturingReadError extends Error{constructor(message:string,readonly code:'PERMISSION_DENIED'){super(message);this.name='ManufacturingReadError';}}
export class MySqlManufacturingReadRepository{
 private readonly access:MySqlAccessRepository;private readonly repo:MySqlManufacturingRepository;
 constructor(private readonly pool:Pool){this.access=new MySqlAccessRepository(pool);this.repo=new MySqlManufacturingRepository(pool);}
 async getProjection(t:TenantId,actor:string){
  const e=await this.access.evaluatePermission(t,actor,PLATFORM_PERMISSION_KEYS.MANUFACTURING_READ,{scopeType:'TENANT'});if(!e.allowed)throw new ManufacturingReadError(e.reason,'PERMISSION_DENIED');
  const [plans,operations,sequences,resources,allocations,characteristics,objects,decisions]=await Promise.all([
   this.repo.listPlans(t),this.repo.listOperations(t),this.repo.listSequences(t),this.repo.listResources(t),this.repo.listAllocations(t),this.repo.listCharacteristics(t),
   this.pool.execute<ObjectRow[]>('SELECT id,object_type,stable_key FROM canonical_objects WHERE tenant_id=? ORDER BY object_type,stable_key,id',[t]),
   this.pool.execute<DecisionRow[]>("SELECT id,decision_type,subject_object_id,subject_version,outcome,reason,decided_at FROM decisions WHERE tenant_id=? AND outcome='APPROVED' ORDER BY decided_at DESC,id",[t])
  ]);
  const opById=new Map(operations.map(o=>[o.id,o]));
  return{
   plans:plans.map(p=>({...p,operations:operations.filter(o=>o.processPlanId===p.id).map(o=>({...o,allocations:allocations.filter(a=>a.operationId===o.id),characteristics:characteristics.filter(c=>c.operationId===o.id)})),sequences:sequences.filter(s=>s.processPlanId===p.id)})),
   resources:resources.map(r=>({...r,allocations:allocations.filter(a=>a.resourceId===r.id).map(a=>({...a,operationNumber:opById.get(a.operationId)?.operationNumber??a.operationId}))})),
   characteristics,
   scopeObjects:objects[0].map(r=>({id:r.id,objectType:r.object_type,stableKey:r.stable_key})),
   decisions:decisions[0].map(r=>({id:r.id,decisionType:r.decision_type,subjectObjectId:r.subject_object_id,...(r.subject_version?{subjectVersion:r.subject_version}:{}),outcome:r.outcome,reason:r.reason,decidedAt:r.decided_at.toISOString()})),
   totals:{plans:plans.length,releasedPlans:plans.filter(p=>p.status==='RELEASED').length,draftPlans:plans.filter(p=>p.status==='DRAFT').length,operations:operations.length,resources:resources.filter(r=>r.status==='ACTIVE').length,controlCharacteristics:characteristics.filter(c=>c.status==='ACTIVE').length}
  };
 }
}
