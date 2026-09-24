import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type ControlCharacteristicSeverity,
  type ControlCharacteristicType,
  type ManufacturingOperationType,
  type ManufacturingResourceType,
  type ManufacturingSequenceType,
  type TenantId
} from '@nublox/kernel';
import type { Pool } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlManufacturingRepository } from './manufacturing-repository.js';

export class ManufacturingCommandError extends Error{
  constructor(message:string,readonly code:'PERMISSION_DENIED'|'INVALID_INPUT'|'NOT_FOUND'|'CONFLICT'){
    super(message);this.name='ManufacturingCommandError';
  }
}
function required(v:string|undefined,label:string){const x=v?.trim()??'';if(!x)throw new ManufacturingCommandError(label+' is required.','INVALID_INPUT');return x;}
function optional(v:string|undefined){const x=v?.trim()??'';return x||undefined;}
function num(v:number,label:string,min=0){if(!Number.isFinite(v)||v<min)throw new ManufacturingCommandError(label+' is invalid.','INVALID_INPUT');return v;}
function integer(v:number,label:string){if(!Number.isInteger(v)||v<1)throw new ManufacturingCommandError(label+' must be a positive integer.','INVALID_INPUT');return v;}
function at(v?:string){const d=new Date(v??new Date().toISOString());if(Number.isNaN(d.getTime()))throw new ManufacturingCommandError('Date/time is invalid.','INVALID_INPUT');return d.toISOString();}
function mapError(e:unknown):never{
 if(e instanceof ManufacturingCommandError)throw e;
 if(typeof e==='object'&&e!==null&&'code' in e&&(e as {code?:string}).code==='ER_DUP_ENTRY')throw new ManufacturingCommandError('Equivalent manufacturing record already exists.','CONFLICT');
 if(e instanceof Error){
   if(/not found/i.test(e.message))throw new ManufacturingCommandError(e.message,'NOT_FOUND');
   if(/must|required|invalid|only|cannot|requires|belong|reference|match|active|draft|frozen|released/i.test(e.message))throw new ManufacturingCommandError(e.message,'INVALID_INPUT');
 }
 throw e;
}

export class MySqlManufacturingCommandService{
 private readonly access:MySqlAccessRepository;
 private readonly repo:MySqlManufacturingRepository;
 constructor(pool:Pool){this.access=new MySqlAccessRepository(pool);this.repo=new MySqlManufacturingRepository(pool);}

 async createProcessPlan(tenantId:TenantId,actor:string,input:{scopeObjectId:string;code:string;name:string;version:number;description?:string;plantReference?:string;createdAt?:string}){
  await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.MANUFACTURING_MANAGE);
  const description=optional(input.description),plantReference=optional(input.plantReference);
  const plan={id:asId<'ManufacturingProcessPlanId'>('MFG-PLAN-'+randomUUID(),'Manufacturing Process Plan'),tenantId,scopeObjectId:asId<'CanonicalObjectId'>(required(input.scopeObjectId,'Scope object'),'Scope object'),code:required(input.code,'Code').toUpperCase(),name:required(input.name,'Name'),version:integer(input.version,'Version'),status:'DRAFT' as const,...(description?{description}:{}),...(plantReference?{plantReference}:{}),createdByPersonId:asId<'PersonId'>(actor,'Creator'),createdAt:at(input.createdAt)};
  try{await this.repo.createProcessPlan(plan,this.audit(actor));return plan;}catch(e){return mapError(e);}
 }
 async addOperation(tenantId:TenantId,actor:string,input:{processPlanId:string;operationNumber:string;name:string;operationType:ManufacturingOperationType;description?:string;setupMinutes:number;runMinutes:number;yieldPercent:number;workInstructions?:Readonly<Record<string,unknown>>}){
  await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.MANUFACTURING_MANAGE);
  const description=optional(input.description);
  const op={id:asId<'ManufacturingOperationId'>('MFG-OP-'+randomUUID(),'Manufacturing Operation'),tenantId,processPlanId:asId<'ManufacturingProcessPlanId'>(required(input.processPlanId,'Process Plan'),'Process Plan'),operationNumber:required(input.operationNumber,'Operation number'),name:required(input.name,'Name'),operationType:input.operationType,...(description?{description}:{}),setupMinutes:num(input.setupMinutes,'Setup minutes'),runMinutes:num(input.runMinutes,'Run minutes'),yieldPercent:num(input.yieldPercent,'Yield percent',0.000001),...(input.workInstructions?{workInstructions:input.workInstructions}:{})};
  try{await this.repo.addOperation(op,this.audit(actor));return op;}catch(e){return mapError(e);}
 }
 async addSequence(tenantId:TenantId,actor:string,input:{processPlanId:string;predecessorOperationId:string;successorOperationId:string;sequenceType:ManufacturingSequenceType;lagMinutes:number}){
  await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.MANUFACTURING_MANAGE);
  const link={id:asId<'ManufacturingSequenceLinkId'>('MFG-SEQ-'+randomUUID(),'Manufacturing Sequence Link'),tenantId,processPlanId:asId<'ManufacturingProcessPlanId'>(required(input.processPlanId,'Process Plan'),'Process Plan'),predecessorOperationId:asId<'ManufacturingOperationId'>(required(input.predecessorOperationId,'Predecessor'),'Predecessor'),successorOperationId:asId<'ManufacturingOperationId'>(required(input.successorOperationId,'Successor'),'Successor'),sequenceType:input.sequenceType,lagMinutes:input.lagMinutes};
  try{await this.repo.addSequence(link,this.audit(actor));return link;}catch(e){return mapError(e);}
 }
 async createResource(tenantId:TenantId,actor:string,input:{code:string;name:string;resourceType:ManufacturingResourceType;description?:string;capacityUnit?:string;capacityPerDay?:number;effectiveFrom?:string;effectiveTo?:string;status:'ACTIVE'|'INACTIVE'}){
  await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.MANUFACTURING_RESOURCE_MANAGE);
  const description=optional(input.description),capacityUnit=optional(input.capacityUnit),effectiveFrom=optional(input.effectiveFrom),effectiveTo=optional(input.effectiveTo);
  const resource={id:asId<'ManufacturingResourceId'>('MFG-RES-'+randomUUID(),'Manufacturing Resource'),tenantId,code:required(input.code,'Code').toUpperCase(),name:required(input.name,'Name'),resourceType:input.resourceType,...(description?{description}:{}),...(capacityUnit?{capacityUnit}:{}),...(input.capacityPerDay!==undefined?{capacityPerDay:num(input.capacityPerDay,'Capacity per day')}:{}),...(effectiveFrom?{effectiveFrom:at(effectiveFrom)}:{}),...(effectiveTo?{effectiveTo:at(effectiveTo)}:{}),status:input.status};
  try{await this.repo.createResource(resource,this.audit(actor));return resource;}catch(e){return mapError(e);}
 }
 async allocateResource(tenantId:TenantId,actor:string,input:{operationId:string;resourceId:string;quantity:number;usageUnit:string;required:boolean}){
  await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.MANUFACTURING_RESOURCE_MANAGE);
  const allocation={id:asId<'ManufacturingResourceAllocationId'>('MFG-ALLOC-'+randomUUID(),'Manufacturing Resource Allocation'),tenantId,operationId:asId<'ManufacturingOperationId'>(required(input.operationId,'Operation'),'Operation'),resourceId:asId<'ManufacturingResourceId'>(required(input.resourceId,'Resource'),'Resource'),quantity:num(input.quantity,'Quantity',0.000001),usageUnit:required(input.usageUnit,'Usage unit'),required:input.required};
  try{await this.repo.allocateResource(allocation,this.audit(actor));return allocation;}catch(e){return mapError(e);}
 }
 async createControlCharacteristic(tenantId:TenantId,actor:string,input:{scopeObjectId:string;operationId?:string;code:string;name:string;characteristicType:ControlCharacteristicType;severity:ControlCharacteristicSeverity;unit?:string;nominalValue?:number;lowerLimit?:number;upperLimit?:number;specification?:string;samplingPlan?:Readonly<Record<string,unknown>>;effectiveFrom?:string;effectiveTo?:string;status:'ACTIVE'|'INACTIVE'}){
  await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.MANUFACTURING_CONTROL_CHARACTERISTIC_MANAGE);
  const operationId=optional(input.operationId),unit=optional(input.unit),specification=optional(input.specification),effectiveFrom=optional(input.effectiveFrom),effectiveTo=optional(input.effectiveTo);
  const cc={id:asId<'ControlCharacteristicId'>('MFG-CC-'+randomUUID(),'Control Characteristic'),tenantId,scopeObjectId:asId<'CanonicalObjectId'>(required(input.scopeObjectId,'Scope object'),'Scope object'),...(operationId?{operationId:asId<'ManufacturingOperationId'>(operationId,'Operation')}:{}),code:required(input.code,'Code').toUpperCase(),name:required(input.name,'Name'),characteristicType:input.characteristicType,severity:input.severity,...(unit?{unit}:{}),...(input.nominalValue!==undefined?{nominalValue:input.nominalValue}:{}),...(input.lowerLimit!==undefined?{lowerLimit:input.lowerLimit}:{}),...(input.upperLimit!==undefined?{upperLimit:input.upperLimit}:{}),...(specification?{specification}:{}),...(input.samplingPlan?{samplingPlan:input.samplingPlan}:{}),...(effectiveFrom?{effectiveFrom:at(effectiveFrom)}:{}),...(effectiveTo?{effectiveTo:at(effectiveTo)}:{}),status:input.status};
  try{await this.repo.createCharacteristic(cc,this.audit(actor));return cc;}catch(e){return mapError(e);}
 }
 async freezePlan(tenantId:TenantId,actor:string,planId:string,frozenAt?:string){
  await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.MANUFACTURING_RELEASE);
  try{return await this.repo.freezePlan(tenantId,asId<'ManufacturingProcessPlanId'>(required(planId,'Process Plan'),'Process Plan'),asId<'PersonId'>(actor,'Freezer'),at(frozenAt),this.audit(actor));}catch(e){return mapError(e);}
 }
 async releasePlan(tenantId:TenantId,actor:string,input:{planId:string;decisionId:string;releasedAt?:string}){
  await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.MANUFACTURING_RELEASE);
  try{return await this.repo.releasePlan(tenantId,asId<'ManufacturingProcessPlanId'>(required(input.planId,'Process Plan'),'Process Plan'),asId<'DecisionId'>(required(input.decisionId,'Decision'),'Decision'),at(input.releasedAt),this.audit(actor));}catch(e){return mapError(e);}
 }
 private audit(actor:string){return{actorPersonId:actor,correlationId:'MANUFACTURING'};}
 private async require(t:TenantId,actor:string,key:string){const e=await this.access.evaluatePermission(t,actor,key,{scopeType:'TENANT'});if(!e.allowed)throw new ManufacturingCommandError(e.reason,'PERMISSION_DENIED');}
}
