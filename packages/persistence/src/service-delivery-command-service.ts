import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type ServiceExecutionRecordType,
  type ServiceOrderType,
  type ServicePriority,
  type TenantId
} from '@nublox/kernel';
import type { Pool } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlServiceDeliveryRepository } from './service-delivery-repository.js';

export class ServiceDeliveryCommandError extends Error {
  constructor(
    message:string,
    readonly code:'PERMISSION_DENIED'|'INVALID_INPUT'|'NOT_FOUND'|'CONFLICT'
  ) {
    super(message);
    this.name='ServiceDeliveryCommandError';
  }
}

function required(value:string|undefined,label:string) {
  const trimmed=value?.trim()??'';
  if(!trimmed) throw new ServiceDeliveryCommandError(label+' is required.','INVALID_INPUT');
  return trimmed;
}
function optional(value:string|undefined) {
  const trimmed=value?.trim()??'';
  return trimmed||undefined;
}
function at(value?:string) {
  const date=new Date(value??new Date().toISOString());
  if(Number.isNaN(date.getTime())) throw new ServiceDeliveryCommandError('Date/time is invalid.','INVALID_INPUT');
  return date.toISOString();
}
function numberValue(value:number|undefined,label:string) {
  if(value===undefined) return undefined;
  if(!Number.isFinite(value)||value<0) throw new ServiceDeliveryCommandError(label+' is invalid.','INVALID_INPUT');
  return value;
}
function mapError(error:unknown):never {
  if(error instanceof ServiceDeliveryCommandError) throw error;
  if(typeof error==='object'&&error!==null&&'code' in error&&(error as {code?:string}).code==='ER_DUP_ENTRY') {
    throw new ServiceDeliveryCommandError('Equivalent service delivery record already exists.','CONFLICT');
  }
  if(error instanceof Error) {
    if(/not found/i.test(error.message)) throw new ServiceDeliveryCommandError(error.message,'NOT_FOUND');
    if(/must|required|invalid|only|cannot|requires|reference|match|dispatch|completed|execution|scheduled/i.test(error.message)) {
      throw new ServiceDeliveryCommandError(error.message,'INVALID_INPUT');
    }
  }
  throw error;
}

export class MySqlServiceDeliveryCommandService {
  private readonly access:MySqlAccessRepository;
  private readonly repo:MySqlServiceDeliveryRepository;

  constructor(pool:Pool) {
    this.access=new MySqlAccessRepository(pool);
    this.repo=new MySqlServiceDeliveryRepository(pool);
  }

  async createOrder(
    tenantId:TenantId,
    actor:string,
    input:{
      scopeObjectId:string;
      orderNumber:string;
      title:string;
      serviceType:ServiceOrderType;
      priority:ServicePriority;
      description?:string;
      serviceLocation?:string;
      requestedStart?:string;
      requestedEnd?:string;
      slaDueAt?:string;
      createdAt?:string;
    }
  ) {
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.SERVICE_DELIVERY_MANAGE);
    const description=optional(input.description);
    const serviceLocation=optional(input.serviceLocation);
    const requestedStart=optional(input.requestedStart);
    const requestedEnd=optional(input.requestedEnd);
    const slaDueAt=optional(input.slaDueAt);
    const order={
      id:asId<'ServiceOrderId'>('SVC-ORDER-'+randomUUID(),'Service Order'),
      tenantId,
      scopeObjectId:asId<'CanonicalObjectId'>(required(input.scopeObjectId,'Scope object'),'Scope object'),
      orderNumber:required(input.orderNumber,'Order number').toUpperCase(),
      title:required(input.title,'Title'),
      serviceType:input.serviceType,
      priority:input.priority,
      status:'DRAFT' as const,
      ...(description?{description}:{}),
      ...(serviceLocation?{serviceLocation}:{}),
      ...(requestedStart?{requestedStart:at(requestedStart)}:{}),
      ...(requestedEnd?{requestedEnd:at(requestedEnd)}:{}),
      ...(slaDueAt?{slaDueAt:at(slaDueAt)}:{}),
      createdByPersonId:asId<'PersonId'>(actor,'Creator'),
      createdAt:at(input.createdAt)
    };
    try {
      return await this.repo.createOrder(order);
    } catch(error) {
      return mapError(error);
    }
  }

  async createAssignment(
    tenantId:TenantId,
    actor:string,
    input:{
      serviceOrderId:string;
      assigneePersonId:string;
      scheduledStart:string;
      scheduledEnd:string;
      dispatchNotes?:string;
    }
  ) {
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.SERVICE_DELIVERY_DISPATCH);
    const dispatchNotes=optional(input.dispatchNotes);
    const assignment={
      id:asId<'ServiceAssignmentId'>('SVC-ASG-'+randomUUID(),'Service Assignment'),
      tenantId,
      serviceOrderId:asId<'ServiceOrderId'>(required(input.serviceOrderId,'Service Order'),'Service Order'),
      assigneePersonId:asId<'PersonId'>(required(input.assigneePersonId,'Assignee'),'Assignee'),
      scheduledStart:at(required(input.scheduledStart,'Scheduled start')),
      scheduledEnd:at(required(input.scheduledEnd,'Scheduled end')),
      status:'PLANNED' as const,
      ...(dispatchNotes?{dispatchNotes}:{})
    };
    try {
      return await this.repo.createAssignment(assignment);
    } catch(error) {
      return mapError(error);
    }
  }

  async dispatchAssignment(tenantId:TenantId,actor:string,assignmentId:string) {
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.SERVICE_DELIVERY_DISPATCH);
    try {
      return await this.repo.dispatchAssignment(
        tenantId,
        asId<'ServiceAssignmentId'>(required(assignmentId,'Service Assignment'),'Service Assignment'),
        at()
      );
    } catch(error) {
      return mapError(error);
    }
  }

  async startAssignment(tenantId:TenantId,actor:string,assignmentId:string) {
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.SERVICE_DELIVERY_EXECUTE);
    try {
      return await this.repo.startAssignment(
        tenantId,
        asId<'ServiceAssignmentId'>(required(assignmentId,'Service Assignment'),'Service Assignment'),
        at()
      );
    } catch(error) {
      return mapError(error);
    }
  }

  async recordExecution(
    tenantId:TenantId,
    actor:string,
    input:{
      serviceOrderId:string;
      assignmentId?:string;
      recordType:ServiceExecutionRecordType;
      occurredAt?:string;
      durationMinutes?:number;
      notes?:string;
      evidence?:Readonly<Record<string,unknown>>;
    }
  ) {
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.SERVICE_DELIVERY_EXECUTE);
    const assignmentId=optional(input.assignmentId);
    const notes=optional(input.notes);
    const record={
      id:asId<'ServiceExecutionRecordId'>('SVC-EXEC-'+randomUUID(),'Service Execution Record'),
      tenantId,
      serviceOrderId:asId<'ServiceOrderId'>(required(input.serviceOrderId,'Service Order'),'Service Order'),
      ...(assignmentId?{assignmentId:asId<'ServiceAssignmentId'>(assignmentId,'Service Assignment')}:{}),
      recordedByPersonId:asId<'PersonId'>(actor,'Recorder'),
      recordType:input.recordType,
      occurredAt:at(input.occurredAt),
      ...(numberValue(input.durationMinutes,'Duration minutes')!==undefined?{durationMinutes:numberValue(input.durationMinutes,'Duration minutes')!}:{}),
      ...(notes?{notes}:{}),
      ...(input.evidence?{evidence:input.evidence}:{})
    };
    try {
      return await this.repo.recordExecution(record);
    } catch(error) {
      return mapError(error);
    }
  }

  async completeOrder(tenantId:TenantId,actor:string,orderId:string) {
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.SERVICE_DELIVERY_EXECUTE);
    try {
      return await this.repo.completeOrder(
        tenantId,
        asId<'ServiceOrderId'>(required(orderId,'Service Order'),'Service Order'),
        actor,
        at()
      );
    } catch(error) {
      return mapError(error);
    }
  }

  async acceptOrder(
    tenantId:TenantId,
    actor:string,
    input:{serviceOrderId:string;acceptanceNote?:string}
  ) {
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.SERVICE_DELIVERY_ACCEPT);
    try {
      return await this.repo.acceptOrder(
        tenantId,
        asId<'ServiceOrderId'>(required(input.serviceOrderId,'Service Order'),'Service Order'),
        actor,
        at(),
        optional(input.acceptanceNote)
      );
    } catch(error) {
      return mapError(error);
    }
  }

  private async require(tenantId:TenantId,actor:string,permissionKey:string) {
    const evaluation=await this.access.evaluatePermission(
      tenantId,
      actor,
      permissionKey,
      {scopeType:'TENANT'}
    );
    if(!evaluation.allowed) throw new ServiceDeliveryCommandError(evaluation.reason,'PERMISSION_DENIED');
  }
}
