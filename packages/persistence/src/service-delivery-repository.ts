import {
  acceptServiceOrder,
  completeServiceOrder,
  createServiceAssignment,
  createServiceExecutionRecord,
  createServiceOrder,
  dispatchServiceAssignment,
  startServiceAssignment,
  type CanonicalObjectIdentity,
  type Person,
  type ServiceAssignment,
  type ServiceExecutionRecord,
  type ServiceOrder,
  type TenantId
} from '@nublox/kernel';
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';

interface OrderRow extends RowDataPacket {
  id:string; tenant_id:string; scope_object_id:string; order_number:string; title:string;
  service_type:ServiceOrder['serviceType']; priority:ServiceOrder['priority']; status:ServiceOrder['status'];
  description:string|null; service_location:string|null; requested_start:Date|null; requested_end:Date|null;
  sla_due_at:Date|null; created_by_person_id:string; order_created_at:Date;
  completed_by_person_id:string|null; completed_at:Date|null; accepted_by_person_id:string|null;
  accepted_at:Date|null; acceptance_note:string|null;
}
interface AssignmentRow extends RowDataPacket {
  id:string; tenant_id:string; service_order_id:string; assignee_person_id:string;
  scheduled_start:Date; scheduled_end:Date; status:ServiceAssignment['status']; dispatch_notes:string|null;
  dispatched_at:Date|null; acknowledged_at:Date|null; en_route_at:Date|null; on_site_at:Date|null; completed_at:Date|null;
}
interface ExecutionRow extends RowDataPacket {
  id:string; tenant_id:string; service_order_id:string; assignment_id:string|null; recorded_by_person_id:string;
  record_type:ServiceExecutionRecord['recordType']; occurred_at:Date; duration_minutes:string|number|null;
  notes:string|null; evidence:string|Record<string,unknown>|null;
}
interface PersonRow extends RowDataPacket {
  id:string; tenant_id:string; party_id:string; legal_name:string; preferred_name:string|null; status:Person['status'];
}
interface ObjectRow extends RowDataPacket {
  id:string; tenant_id:string; object_type:string; stable_key:string; created_at:Date;
}

function objectJson(value:unknown) {
  if (value === null) return undefined;
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    ? parsed as Readonly<Record<string, unknown>>
    : undefined;
}

const mapPerson=(r:PersonRow):Person=>({
  id:r.id as Person['id'], tenantId:r.tenant_id as TenantId, partyId:r.party_id as Person['partyId'],
  legalName:r.legal_name, ...(r.preferred_name?{preferredName:r.preferred_name}:{}), status:r.status
});

const mapObject=(r:ObjectRow):CanonicalObjectIdentity=>({
  id:r.id as CanonicalObjectIdentity['id'], tenantId:r.tenant_id as TenantId,
  objectType:r.object_type, stableKey:r.stable_key, createdAt:r.created_at.toISOString()
});

const mapOrder=(r:OrderRow):ServiceOrder=>({
  id:r.id as ServiceOrder['id'], tenantId:r.tenant_id as TenantId,
  scopeObjectId:r.scope_object_id as ServiceOrder['scopeObjectId'], orderNumber:r.order_number,
  title:r.title, serviceType:r.service_type, priority:r.priority, status:r.status,
  ...(r.description?{description:r.description}:{}),
  ...(r.service_location?{serviceLocation:r.service_location}:{}),
  ...(r.requested_start?{requestedStart:r.requested_start.toISOString()}:{}),
  ...(r.requested_end?{requestedEnd:r.requested_end.toISOString()}:{}),
  ...(r.sla_due_at?{slaDueAt:r.sla_due_at.toISOString()}:{}),
  createdByPersonId:r.created_by_person_id as ServiceOrder['createdByPersonId'],
  createdAt:r.order_created_at.toISOString(),
  ...(r.completed_by_person_id?{completedByPersonId:r.completed_by_person_id as NonNullable<ServiceOrder['completedByPersonId']>}:{}),
  ...(r.completed_at?{completedAt:r.completed_at.toISOString()}:{}),
  ...(r.accepted_by_person_id?{acceptedByPersonId:r.accepted_by_person_id as NonNullable<ServiceOrder['acceptedByPersonId']>}:{}),
  ...(r.accepted_at?{acceptedAt:r.accepted_at.toISOString()}:{}),
  ...(r.acceptance_note?{acceptanceNote:r.acceptance_note}:{})
});

const mapAssignment=(r:AssignmentRow):ServiceAssignment=>({
  id:r.id as ServiceAssignment['id'], tenantId:r.tenant_id as TenantId,
  serviceOrderId:r.service_order_id as ServiceAssignment['serviceOrderId'],
  assigneePersonId:r.assignee_person_id as ServiceAssignment['assigneePersonId'],
  scheduledStart:r.scheduled_start.toISOString(), scheduledEnd:r.scheduled_end.toISOString(),
  status:r.status, ...(r.dispatch_notes?{dispatchNotes:r.dispatch_notes}:{}),
  ...(r.dispatched_at?{dispatchedAt:r.dispatched_at.toISOString()}:{}),
  ...(r.acknowledged_at?{acknowledgedAt:r.acknowledged_at.toISOString()}:{}),
  ...(r.en_route_at?{enRouteAt:r.en_route_at.toISOString()}:{}),
  ...(r.on_site_at?{onSiteAt:r.on_site_at.toISOString()}:{}),
  ...(r.completed_at?{completedAt:r.completed_at.toISOString()}:{})
});

const mapExecution=(r:ExecutionRow):ServiceExecutionRecord=>({
  id:r.id as ServiceExecutionRecord['id'], tenantId:r.tenant_id as TenantId,
  serviceOrderId:r.service_order_id as ServiceExecutionRecord['serviceOrderId'],
  ...(r.assignment_id?{assignmentId:r.assignment_id as NonNullable<ServiceExecutionRecord['assignmentId']>}:{}),
  recordedByPersonId:r.recorded_by_person_id as ServiceExecutionRecord['recordedByPersonId'],
  recordType:r.record_type, occurredAt:r.occurred_at.toISOString(),
  ...(r.duration_minutes!==null?{durationMinutes:Number(r.duration_minutes)}:{}),
  ...(r.notes?{notes:r.notes}:{}),
  ...(objectJson(r.evidence)?{evidence:objectJson(r.evidence)!}:{})
});

export class MySqlServiceDeliveryRepository {
  constructor(private readonly pool:Pool) {}

  async createOrder(order:ServiceOrder) {
    return withTransaction(this.pool, async (c) => {
      const [scope, creator] = await Promise.all([
        this.requireObject(order.tenantId, order.scopeObjectId, c),
        this.requirePerson(order.tenantId, order.createdByPersonId, c)
      ]);
      const validated = createServiceOrder(order, scope, creator);
      await c.execute(
        `INSERT INTO service_orders
          (id,tenant_id,scope_object_id,order_number,title,service_type,priority,status,description,service_location,
           requested_start,requested_end,sla_due_at,created_by_person_id,order_created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [validated.id,validated.tenantId,validated.scopeObjectId,validated.orderNumber,validated.title,
         validated.serviceType,validated.priority,validated.status,validated.description??null,validated.serviceLocation??null,
         validated.requestedStart?new Date(validated.requestedStart):null,validated.requestedEnd?new Date(validated.requestedEnd):null,
         validated.slaDueAt?new Date(validated.slaDueAt):null,validated.createdByPersonId,new Date(validated.createdAt)]
      );
      await writeOutboxEvent(c,{tenantId:validated.tenantId,aggregateType:'SERVICE_ORDER',aggregateId:validated.id,eventType:'service.order.created',payload:validated});
      return validated;
    });
  }

  async createAssignment(assignment:ServiceAssignment) {
    return withTransaction(this.pool, async (c) => {
      const [order, assignee] = await Promise.all([
        this.requireOrder(assignment.tenantId, assignment.serviceOrderId, c),
        this.requirePerson(assignment.tenantId, assignment.assigneePersonId, c)
      ]);
      const validated = createServiceAssignment(assignment, order, assignee);
      await c.execute(
        `INSERT INTO service_assignments
          (id,tenant_id,service_order_id,assignee_person_id,scheduled_start,scheduled_end,status,dispatch_notes)
         VALUES (?,?,?,?,?,?,?,?)`,
        [validated.id,validated.tenantId,validated.serviceOrderId,validated.assigneePersonId,
         new Date(validated.scheduledStart),new Date(validated.scheduledEnd),validated.status,validated.dispatchNotes??null]
      );
      if (order.status === 'DRAFT') {
        await c.execute<ResultSetHeader>(
          "UPDATE service_orders SET status='SCHEDULED' WHERE tenant_id=? AND id=? AND status='DRAFT'",
          [assignment.tenantId, assignment.serviceOrderId]
        );
      }
      await writeOutboxEvent(c,{tenantId:validated.tenantId,aggregateType:'SERVICE_ORDER',aggregateId:validated.serviceOrderId,eventType:'service.assignment.created',payload:validated});
      return validated;
    });
  }

  async dispatchAssignment(tenantId:TenantId, assignmentId:ServiceAssignment['id'], dispatchedAt:string) {
    return withTransaction(this.pool, async (c) => {
      const current = await this.requireAssignment(tenantId, assignmentId, c, true);
      const next = dispatchServiceAssignment(current, dispatchedAt);
      const [result] = await c.execute<ResultSetHeader>(
        "UPDATE service_assignments SET status=?,dispatched_at=? WHERE tenant_id=? AND id=? AND status='PLANNED'",
        [next.status,new Date(dispatchedAt),tenantId,assignmentId]
      );
      if (result.affectedRows !== 1) throw new Error('Concurrent Service Assignment dispatch detected.');
      await c.execute(
        "UPDATE service_orders SET status='DISPATCHED' WHERE tenant_id=? AND id=? AND status IN ('DRAFT','SCHEDULED')",
        [tenantId,current.serviceOrderId]
      );
      await writeOutboxEvent(c,{tenantId,aggregateType:'SERVICE_ORDER',aggregateId:current.serviceOrderId,eventType:'service.assignment.dispatched',payload:next});
      return next;
    });
  }

  async startAssignment(tenantId:TenantId, assignmentId:ServiceAssignment['id'], onSiteAt:string) {
    return withTransaction(this.pool, async (c) => {
      const current = await this.requireAssignment(tenantId, assignmentId, c, true);
      const next = startServiceAssignment(current, onSiteAt);
      const [result] = await c.execute<ResultSetHeader>(
        "UPDATE service_assignments SET status=?,on_site_at=? WHERE tenant_id=? AND id=? AND status IN ('DISPATCHED','ACKNOWLEDGED','EN_ROUTE')",
        [next.status,new Date(onSiteAt),tenantId,assignmentId]
      );
      if (result.affectedRows !== 1) throw new Error('Concurrent Service Assignment start detected.');
      await c.execute(
        "UPDATE service_orders SET status='IN_PROGRESS' WHERE tenant_id=? AND id=? AND status IN ('DISPATCHED','SCHEDULED')",
        [tenantId,current.serviceOrderId]
      );
      await writeOutboxEvent(c,{tenantId,aggregateType:'SERVICE_ORDER',aggregateId:current.serviceOrderId,eventType:'service.assignment.started',payload:next});
      return next;
    });
  }

  async recordExecution(record:ServiceExecutionRecord) {
    return withTransaction(this.pool, async (c) => {
      const [order, recorder] = await Promise.all([
        this.requireOrder(record.tenantId, record.serviceOrderId, c),
        this.requirePerson(record.tenantId, record.recordedByPersonId, c)
      ]);
      const assignment = record.assignmentId
        ? await this.requireAssignment(record.tenantId, record.assignmentId, c)
        : undefined;
      const validated = createServiceExecutionRecord(record, order, recorder, assignment);
      await c.execute(
        `INSERT INTO service_execution_records
          (id,tenant_id,service_order_id,assignment_id,recorded_by_person_id,record_type,occurred_at,duration_minutes,notes,evidence)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [validated.id,validated.tenantId,validated.serviceOrderId,validated.assignmentId??null,validated.recordedByPersonId,
         validated.recordType,new Date(validated.occurredAt),validated.durationMinutes??null,validated.notes??null,
         validated.evidence?JSON.stringify(validated.evidence):null]
      );
      if (order.status === 'DISPATCHED') {
        await c.execute(
          "UPDATE service_orders SET status='IN_PROGRESS' WHERE tenant_id=? AND id=? AND status='DISPATCHED'",
          [record.tenantId, record.serviceOrderId]
        );
      }
      await writeOutboxEvent(c,{tenantId:validated.tenantId,aggregateType:'SERVICE_ORDER',aggregateId:validated.serviceOrderId,eventType:'service.execution.recorded',payload:validated});
      return validated;
    });
  }

  async completeOrder(tenantId:TenantId, orderId:ServiceOrder['id'], personId:string, completedAt:string) {
    return withTransaction(this.pool, async (c) => {
      const [current, person, records] = await Promise.all([
        this.requireOrder(tenantId, orderId, c, true),
        this.requirePerson(tenantId, personId, c),
        this.listExecutionRecords(tenantId, orderId, c)
      ]);
      const next = completeServiceOrder(current, person, completedAt, records);
      const [result] = await c.execute<ResultSetHeader>(
        "UPDATE service_orders SET status='COMPLETED',completed_by_person_id=?,completed_at=? WHERE tenant_id=? AND id=? AND status IN ('DISPATCHED','IN_PROGRESS')",
        [personId,new Date(completedAt),tenantId,orderId]
      );
      if (result.affectedRows !== 1) throw new Error('Concurrent Service Order completion detected.');
      await c.execute(
        "UPDATE service_assignments SET status='COMPLETED',completed_at=? WHERE tenant_id=? AND service_order_id=? AND status NOT IN ('COMPLETED','CANCELLED')",
        [new Date(completedAt),tenantId,orderId]
      );
      await writeOutboxEvent(c,{tenantId,aggregateType:'SERVICE_ORDER',aggregateId:orderId,eventType:'service.order.completed',payload:next});
      return next;
    });
  }

  async acceptOrder(tenantId:TenantId, orderId:ServiceOrder['id'], personId:string, acceptedAt:string, acceptanceNote?:string) {
    return withTransaction(this.pool, async (c) => {
      const [current, person] = await Promise.all([
        this.requireOrder(tenantId, orderId, c, true),
        this.requirePerson(tenantId, personId, c)
      ]);
      const next = acceptServiceOrder(current, person, acceptedAt, acceptanceNote);
      const [result] = await c.execute<ResultSetHeader>(
        "UPDATE service_orders SET status='ACCEPTED',accepted_by_person_id=?,accepted_at=?,acceptance_note=? WHERE tenant_id=? AND id=? AND status='COMPLETED'",
        [personId,new Date(acceptedAt),next.acceptanceNote??null,tenantId,orderId]
      );
      if (result.affectedRows !== 1) throw new Error('Concurrent Service Order acceptance detected.');
      await writeOutboxEvent(c,{tenantId,aggregateType:'SERVICE_ORDER',aggregateId:orderId,eventType:'service.order.accepted',payload:next});
      return next;
    });
  }

  async listOrders(tenantId:TenantId) {
    const [rows]=await this.pool.execute<OrderRow[]>(
      'SELECT * FROM service_orders WHERE tenant_id=? ORDER BY order_created_at DESC,id',
      [tenantId]
    );
    return rows.map(mapOrder);
  }

  async listAssignments(tenantId:TenantId) {
    const [rows]=await this.pool.execute<AssignmentRow[]>(
      'SELECT * FROM service_assignments WHERE tenant_id=? ORDER BY scheduled_start,id',
      [tenantId]
    );
    return rows.map(mapAssignment);
  }

  async listExecutionRecords(tenantId:TenantId, orderId?:ServiceOrder['id'], connection?:PoolConnection) {
    const q=connection??this.pool;
    const [rows]=orderId
      ? await q.execute<ExecutionRow[]>(
          'SELECT * FROM service_execution_records WHERE tenant_id=? AND service_order_id=? ORDER BY occurred_at,id',
          [tenantId,orderId]
        )
      : await q.execute<ExecutionRow[]>(
          'SELECT * FROM service_execution_records WHERE tenant_id=? ORDER BY occurred_at DESC,id',
          [tenantId]
        );
    return rows.map(mapExecution);
  }

  private async requirePerson(tenantId:TenantId,id:string,connection?:PoolConnection) {
    const q=connection??this.pool;
    const [rows]=await q.execute<PersonRow[]>(
      'SELECT id,tenant_id,party_id,legal_name,preferred_name,status FROM persons WHERE tenant_id=? AND id=?',
      [tenantId,id]
    );
    if(!rows[0]) throw new Error('Person not found in tenant.');
    return mapPerson(rows[0]);
  }

  private async requireObject(tenantId:TenantId,id:string,connection?:PoolConnection) {
    const q=connection??this.pool;
    const [rows]=await q.execute<ObjectRow[]>(
      'SELECT id,tenant_id,object_type,stable_key,created_at FROM canonical_objects WHERE tenant_id=? AND id=?',
      [tenantId,id]
    );
    if(!rows[0]) throw new Error('Canonical Object not found in tenant.');
    return mapObject(rows[0]);
  }

  private async requireOrder(tenantId:TenantId,id:string,connection?:PoolConnection,lock=false) {
    const q=connection??this.pool;
    const [rows]=await q.execute<OrderRow[]>(
      'SELECT * FROM service_orders WHERE tenant_id=? AND id=?'+(lock?' FOR UPDATE':''),
      [tenantId,id]
    );
    if(!rows[0]) throw new Error('Service Order not found in tenant.');
    return mapOrder(rows[0]);
  }

  private async requireAssignment(tenantId:TenantId,id:string,connection?:PoolConnection,lock=false) {
    const q=connection??this.pool;
    const [rows]=await q.execute<AssignmentRow[]>(
      'SELECT * FROM service_assignments WHERE tenant_id=? AND id=?'+(lock?' FOR UPDATE':''),
      [tenantId,id]
    );
    if(!rows[0]) throw new Error('Service Assignment not found in tenant.');
    return mapAssignment(rows[0]);
  }
}
