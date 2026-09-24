import { PLATFORM_PERMISSION_KEYS, type TenantId } from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlServiceDeliveryRepository } from './service-delivery-repository.js';

interface ObjectRow extends RowDataPacket { id:string; object_type:string; stable_key:string; }
interface PersonRow extends RowDataPacket { id:string; legal_name:string; preferred_name:string|null; }

export class ServiceDeliveryReadError extends Error {
  constructor(message:string,readonly code:'PERMISSION_DENIED') {
    super(message);
    this.name='ServiceDeliveryReadError';
  }
}

export class MySqlServiceDeliveryReadRepository {
  private readonly access:MySqlAccessRepository;
  private readonly repo:MySqlServiceDeliveryRepository;

  constructor(private readonly pool:Pool) {
    this.access=new MySqlAccessRepository(pool);
    this.repo=new MySqlServiceDeliveryRepository(pool);
  }

  async getProjection(tenantId:TenantId,actor:string) {
    const evaluation=await this.access.evaluatePermission(
      tenantId,
      actor,
      PLATFORM_PERMISSION_KEYS.SERVICE_DELIVERY_READ,
      {scopeType:'TENANT'}
    );
    if(!evaluation.allowed) throw new ServiceDeliveryReadError(evaluation.reason,'PERMISSION_DENIED');

    const [orders,assignments,execution,objects,people]=await Promise.all([
      this.repo.listOrders(tenantId),
      this.repo.listAssignments(tenantId),
      this.repo.listExecutionRecords(tenantId),
      this.pool.execute<ObjectRow[]>(
        'SELECT id,object_type,stable_key FROM canonical_objects WHERE tenant_id=? ORDER BY object_type,stable_key,id',
        [tenantId]
      ),
      this.pool.execute<PersonRow[]>(
        "SELECT id,legal_name,preferred_name FROM persons WHERE tenant_id=? AND status='ACTIVE' ORDER BY legal_name,id",
        [tenantId]
      )
    ]);

    const peopleById=new Map(people[0].map((person)=>[
      person.id,
      person.preferred_name??person.legal_name
    ]));

    return {
      orders:orders.map((order)=>({
        ...order,
        assignments:assignments
          .filter((assignment)=>assignment.serviceOrderId===order.id)
          .map((assignment)=>({
            ...assignment,
            assigneeName:peopleById.get(assignment.assigneePersonId)??assignment.assigneePersonId
          })),
        execution:execution.filter((record)=>record.serviceOrderId===order.id)
      })),
      scopeObjects:objects[0].map((row)=>({
        id:row.id,
        objectType:row.object_type,
        stableKey:row.stable_key
      })),
      people:people[0].map((person)=>({
        id:person.id,
        name:person.preferred_name??person.legal_name
      })),
      totals:{
        orders:orders.length,
        scheduled:orders.filter((order)=>order.status==='SCHEDULED'||order.status==='DISPATCHED').length,
        inProgress:orders.filter((order)=>order.status==='IN_PROGRESS').length,
        completed:orders.filter((order)=>order.status==='COMPLETED'||order.status==='ACCEPTED').length,
        accepted:orders.filter((order)=>order.status==='ACCEPTED').length,
        executionRecords:execution.length
      }
    };
  }
}
