import type {
  CanonicalObjectId,
  ControlCharacteristicId,
  DecisionId,
  ManufacturingOperationId,
  ManufacturingProcessPlanId,
  ManufacturingResourceAllocationId,
  ManufacturingResourceId,
  ManufacturingSequenceLinkId,
  PersonId,
  TenantId
} from './ids.js';

export type ManufacturingProcessPlanStatus='DRAFT'|'FROZEN'|'RELEASED'|'SUPERSEDED'|'RETIRED';

export interface ManufacturingProcessPlan {
  id:ManufacturingProcessPlanId;
  tenantId:TenantId;
  scopeObjectId:CanonicalObjectId;
  code:string;
  name:string;
  version:number;
  status:ManufacturingProcessPlanStatus;
  description?:string;
  plantReference?:string;
  checksum?:string;
  createdByPersonId:PersonId;
  createdAt:string;
  frozenByPersonId?:PersonId;
  frozenAt?:string;
  releaseDecisionId?:DecisionId;
  releasedAt?:string;
}

export type ManufacturingOperationType='PROCESS'|'INSPECTION'|'MOVE'|'WAIT'|'PACK'|'OTHER';

export interface ManufacturingOperation {
  id:ManufacturingOperationId;
  tenantId:TenantId;
  processPlanId:ManufacturingProcessPlanId;
  operationNumber:string;
  name:string;
  operationType:ManufacturingOperationType;
  description?:string;
  setupMinutes:number;
  runMinutes:number;
  yieldPercent:number;
  workInstructions?:Readonly<Record<string,unknown>>;
}

export type ManufacturingSequenceType='FINISH_START'|'START_START'|'FINISH_FINISH'|'START_FINISH';

export interface ManufacturingSequenceLink {
  id:ManufacturingSequenceLinkId;
  tenantId:TenantId;
  processPlanId:ManufacturingProcessPlanId;
  predecessorOperationId:ManufacturingOperationId;
  successorOperationId:ManufacturingOperationId;
  sequenceType:ManufacturingSequenceType;
  lagMinutes:number;
}

export type ManufacturingResourceType='WORK_CENTER'|'LABOUR'|'SKILL'|'TOOLING'|'EQUIPMENT'|'PROCESSING_MATERIAL';

export interface ManufacturingResource {
  id:ManufacturingResourceId;
  tenantId:TenantId;
  code:string;
  name:string;
  resourceType:ManufacturingResourceType;
  description?:string;
  capacityUnit?:string;
  capacityPerDay?:number;
  effectiveFrom?:string;
  effectiveTo?:string;
  status:'ACTIVE'|'INACTIVE';
}

export interface ManufacturingResourceAllocation {
  id:ManufacturingResourceAllocationId;
  tenantId:TenantId;
  operationId:ManufacturingOperationId;
  resourceId:ManufacturingResourceId;
  quantity:number;
  usageUnit:string;
  required:boolean;
}

export type ControlCharacteristicType='DIMENSION'|'ATTRIBUTE'|'MATERIAL'|'PROCESS_PARAMETER'|'VISUAL'|'FUNCTIONAL'|'OTHER';
export type ControlCharacteristicSeverity='CRITICAL'|'MAJOR'|'MINOR'|'INFORMATIONAL';

export interface ControlCharacteristic {
  id:ControlCharacteristicId;
  tenantId:TenantId;
  scopeObjectId:CanonicalObjectId;
  operationId?:ManufacturingOperationId;
  code:string;
  name:string;
  characteristicType:ControlCharacteristicType;
  severity:ControlCharacteristicSeverity;
  unit?:string;
  nominalValue?:number;
  lowerLimit?:number;
  upperLimit?:number;
  specification?:string;
  samplingPlan?:Readonly<Record<string,unknown>>;
  effectiveFrom?:string;
  effectiveTo?:string;
  status:'ACTIVE'|'INACTIVE';
}
