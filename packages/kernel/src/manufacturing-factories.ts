import { invariant } from './errors.js';
import type { CanonicalObjectIdentity,Person } from './model.js';
import type { Decision } from './control.js';
import type {
  ControlCharacteristic,
  ManufacturingOperation,
  ManufacturingProcessPlan,
  ManufacturingResource,
  ManufacturingResourceAllocation,
  ManufacturingSequenceLink
} from './manufacturing.js';

function required(value:string,label:string){invariant(Boolean(value.trim()),label+' must not be empty.');}
function sameTenant(a:{tenantId:string},b:{tenantId:string},label:string){invariant(a.tenantId===b.tenantId,label+' must remain within one tenant.');}
function validDate(value:string,label:string){invariant(Number.isFinite(Date.parse(value)),label+' must be a valid date/time.');}

export function createManufacturingProcessPlan(input:ManufacturingProcessPlan,scope:CanonicalObjectIdentity,creator:Person):ManufacturingProcessPlan{
  sameTenant(input,scope,'Process Plan scope');sameTenant(input,creator,'Process Plan creator');
  invariant(input.scopeObjectId===scope.id,'Process Plan scope reference does not match.');
  invariant(input.createdByPersonId===creator.id,'Process Plan creator reference does not match.');
  required(input.code,'Process Plan code');required(input.name,'Process Plan name');
  invariant(Number.isInteger(input.version)&&input.version>0,'Process Plan version must be positive.');
  validDate(input.createdAt,'Process Plan createdAt');
  invariant(input.status==='DRAFT'&&!input.checksum&&!input.frozenAt&&!input.releaseDecisionId&&!input.releasedAt,'New Process Plan must start DRAFT.');
  return Object.freeze({...input});
}

export function createManufacturingOperation(input:ManufacturingOperation,plan:ManufacturingProcessPlan):ManufacturingOperation{
  sameTenant(input,plan,'Operation Process Plan');
  invariant(input.processPlanId===plan.id,'Operation must reference supplied Process Plan.');
  invariant(plan.status==='DRAFT','Operations can only be changed on a DRAFT Process Plan.');
  required(input.operationNumber,'Operation number');required(input.name,'Operation name');
  invariant(Number.isFinite(input.setupMinutes)&&input.setupMinutes>=0,'Operation setup minutes must be zero or greater.');
  invariant(Number.isFinite(input.runMinutes)&&input.runMinutes>=0,'Operation run minutes must be zero or greater.');
  invariant(Number.isFinite(input.yieldPercent)&&input.yieldPercent>0&&input.yieldPercent<=100,'Operation yield percent must be greater than zero and at most 100.');
  return Object.freeze({...input,...(input.workInstructions?{workInstructions:Object.freeze({...input.workInstructions})}:{})});
}

export function createManufacturingSequenceLink(
  input:ManufacturingSequenceLink,
  plan:ManufacturingProcessPlan,
  predecessor:ManufacturingOperation,
  successor:ManufacturingOperation
):ManufacturingSequenceLink{
  sameTenant(input,plan,'Sequence Process Plan');
  sameTenant(input,predecessor,'Sequence predecessor');
  sameTenant(input,successor,'Sequence successor');
  invariant(plan.status==='DRAFT','Sequence links can only be changed on a DRAFT Process Plan.');
  invariant(input.processPlanId===plan.id&&predecessor.processPlanId===plan.id&&successor.processPlanId===plan.id,'Sequence operations must belong to supplied Process Plan.');
  invariant(input.predecessorOperationId===predecessor.id&&input.successorOperationId===successor.id,'Sequence operation references do not match.');
  invariant(predecessor.id!==successor.id,'Operation cannot sequence to itself.');
  invariant(Number.isFinite(input.lagMinutes),'Sequence lag minutes must be finite.');
  return Object.freeze({...input});
}

export function createManufacturingResource(input:ManufacturingResource):ManufacturingResource{
  required(input.code,'Manufacturing Resource code');required(input.name,'Manufacturing Resource name');
  if(input.capacityUnit)required(input.capacityUnit,'Capacity unit');
  if(input.capacityPerDay!==undefined)invariant(Number.isFinite(input.capacityPerDay)&&input.capacityPerDay>=0,'Resource capacity per day must be zero or greater.');
  if(input.effectiveFrom)validDate(input.effectiveFrom,'Resource effectiveFrom');
  if(input.effectiveTo){validDate(input.effectiveTo,'Resource effectiveTo');invariant(!input.effectiveFrom||Date.parse(input.effectiveTo)>=Date.parse(input.effectiveFrom),'Resource effectiveTo cannot precede effectiveFrom.');}
  return Object.freeze({...input});
}

export function createManufacturingResourceAllocation(
  input:ManufacturingResourceAllocation,
  operation:ManufacturingOperation,
  resource:ManufacturingResource
):ManufacturingResourceAllocation{
  sameTenant(input,operation,'Resource Allocation Operation');sameTenant(input,resource,'Resource Allocation Resource');
  invariant(input.operationId===operation.id&&input.resourceId===resource.id,'Resource Allocation references do not match.');
  invariant(resource.status==='ACTIVE','Resource Allocation requires an ACTIVE Resource.');
  invariant(Number.isFinite(input.quantity)&&input.quantity>0,'Resource Allocation quantity must be greater than zero.');
  required(input.usageUnit,'Resource Allocation usage unit');
  return Object.freeze({...input});
}

export function createControlCharacteristic(
  input:ControlCharacteristic,
  scope:CanonicalObjectIdentity,
  operation?:ManufacturingOperation
):ControlCharacteristic{
  sameTenant(input,scope,'Control Characteristic scope');
  invariant(input.scopeObjectId===scope.id,'Control Characteristic scope reference does not match.');
  required(input.code,'Control Characteristic code');required(input.name,'Control Characteristic name');
  if(operation){
    sameTenant(input,operation,'Control Characteristic Operation');
    invariant(input.operationId===operation.id,'Control Characteristic Operation reference does not match.');
  }else invariant(!input.operationId,'Control Characteristic cannot reference an unsupplied Operation.');
  if(input.unit)required(input.unit,'Control Characteristic unit');
  if(input.lowerLimit!==undefined&&input.upperLimit!==undefined)invariant(input.lowerLimit<=input.upperLimit,'Control Characteristic lower limit cannot exceed upper limit.');
  if(input.nominalValue!==undefined&&input.lowerLimit!==undefined)invariant(input.nominalValue>=input.lowerLimit,'Nominal value cannot be below lower limit.');
  if(input.nominalValue!==undefined&&input.upperLimit!==undefined)invariant(input.nominalValue<=input.upperLimit,'Nominal value cannot exceed upper limit.');
  if(input.effectiveFrom)validDate(input.effectiveFrom,'Control Characteristic effectiveFrom');
  if(input.effectiveTo){validDate(input.effectiveTo,'Control Characteristic effectiveTo');invariant(!input.effectiveFrom||Date.parse(input.effectiveTo)>=Date.parse(input.effectiveFrom),'Control Characteristic effectiveTo cannot precede effectiveFrom.');}
  return Object.freeze({...input,...(input.samplingPlan?{samplingPlan:Object.freeze({...input.samplingPlan})}:{})});
}

export function freezeManufacturingProcessPlan(
  current:ManufacturingProcessPlan,
  operations:readonly ManufacturingOperation[],
  sequences:readonly ManufacturingSequenceLink[],
  allocations:readonly ManufacturingResourceAllocation[],
  characteristics:readonly ControlCharacteristic[],
  checksum:string,
  freezer:Person,
  frozenAt:string
):ManufacturingProcessPlan{
  sameTenant(current,freezer,'Process Plan freezer');
  invariant(current.status==='DRAFT','Only a DRAFT Process Plan can be frozen.');
  invariant(operations.length>0,'Process Plan requires at least one Operation.');
  invariant(operations.every(op=>op.processPlanId===current.id),'All Operations must belong to Process Plan.');
  invariant(sequences.every(link=>link.processPlanId===current.id),'All Sequence Links must belong to Process Plan.');
  const opIds=new Set(operations.map(op=>op.id));
  invariant(sequences.every(link=>opIds.has(link.predecessorOperationId)&&opIds.has(link.successorOperationId)),'Sequence Links must reference Process Plan Operations.');
  invariant(allocations.every(a=>opIds.has(a.operationId)),'Resource Allocations must reference Process Plan Operations.');
  invariant(characteristics.every(c=>!c.operationId||opIds.has(c.operationId)),'Operation Control Characteristics must reference Process Plan Operations.');
  required(checksum,'Process Plan checksum');validDate(frozenAt,'Process Plan frozenAt');
  invariant(Date.parse(frozenAt)>=Date.parse(current.createdAt),'Process Plan cannot freeze before creation.');
  return Object.freeze({...current,status:'FROZEN',checksum,frozenByPersonId:freezer.id,frozenAt});
}

export function releaseManufacturingProcessPlan(current:ManufacturingProcessPlan,decision:Decision,releasedAt:string):ManufacturingProcessPlan{
  sameTenant(current,decision,'Process Plan release Decision');
  invariant(current.status==='FROZEN','Only a FROZEN Process Plan can be released.');
  invariant(decision.subjectObjectId===current.scopeObjectId,'Process Plan Decision must govern the Process Plan scope object.');
  invariant(decision.subjectVersion===current.checksum,'Process Plan Decision must cite exact frozen checksum.');
  invariant(decision.outcome==='APPROVED','Process Plan release requires an APPROVED Decision.');
  invariant(Boolean(current.frozenAt),'Frozen Process Plan requires frozenAt evidence.');
  invariant(Date.parse(decision.decidedAt)>=Date.parse(current.frozenAt!),'Process Plan release Decision cannot predate freeze.');
  validDate(releasedAt,'Process Plan releasedAt');
  invariant(Date.parse(releasedAt)>=Date.parse(decision.decidedAt),'Process Plan release cannot predate approval Decision.');
  return Object.freeze({...current,status:'RELEASED',releaseDecisionId:decision.id,releasedAt});
}
