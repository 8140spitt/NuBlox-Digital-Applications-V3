import { randomUUID } from 'node:crypto';
import { db } from '$lib/server/db';
import {
  assertPermission,
  authoritySnapshot,
  type CommandContext
} from '$lib/server/platform-context';

export type PlatformAuditEvent = {
  id: string;
  aggregateId: string;
  objectType: string;
  objectId: string;
  action: string;
  fromState: string | null;
  toState: string | null;
  actorDisplayName: string;
  note: string | null;
  occurredAt: string;
};

type AuditInput = {
  aggregateId: string;
  objectType: string;
  objectId: string;
  action: string;
  fromState?: string | null;
  toState?: string | null;
  note?: string;
};

type BusinessEventInput = {
  aggregateId: string;
  aggregateType: string;
  aggregateObjectId: string;
  aggregateVersion: number;
  eventType: string;
  payload: Record<string, unknown>;
  topic?: string;
};

function now() {
  return new Date().toISOString();
}

export function recordPlatformAudit(context: CommandContext, input: AuditInput) {
  db.prepare(`
    INSERT INTO platform_audit_events
      (id, tenant_id, tenant_slug, aggregate_id, object_type, object_id, action,
       from_state, to_state, actor_identity_id, actor_party_id, actor_display_name,
       correlation_id, authority_snapshot_json, note, occurred_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    context.tenantId,
    context.tenantSlug,
    input.aggregateId,
    input.objectType,
    input.objectId,
    input.action,
    input.fromState ?? null,
    input.toState ?? null,
    context.userIdentityId,
    context.actorPartyId,
    context.actorDisplayName,
    context.correlationId,
    JSON.stringify(authoritySnapshot(context)),
    input.note?.trim() || null,
    now()
  );
}

export function emitBusinessEvent(context: CommandContext, input: BusinessEventInput) {
  const eventId = randomUUID();
  const timestamp = now();
  const payload = JSON.stringify({
    eventId,
    tenantId: context.tenantId,
    correlationId: context.correlationId,
    aggregateId: input.aggregateId,
    aggregateType: input.aggregateType,
    aggregateObjectId: input.aggregateObjectId,
    aggregateVersion: input.aggregateVersion,
    eventType: input.eventType,
    actorIdentityId: context.userIdentityId,
    occurredAt: timestamp,
    data: input.payload
  });

  db.prepare(`
    INSERT INTO business_events
      (id, tenant_id, aggregate_id, aggregate_type, aggregate_object_id, event_type,
       aggregate_version, actor_identity_id, correlation_id, payload_json, occurred_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    eventId,
    context.tenantId,
    input.aggregateId,
    input.aggregateType,
    input.aggregateObjectId,
    input.eventType,
    input.aggregateVersion,
    context.userIdentityId,
    context.correlationId,
    payload,
    timestamp
  );

  db.prepare(`
    INSERT INTO outbox_messages
      (id, tenant_id, business_event_id, topic, payload_json, status, attempts, available_at, created_at)
    VALUES (?, ?, ?, ?, ?, 'PENDING', 0, ?, ?)
  `).run(
    randomUUID(),
    context.tenantId,
    eventId,
    input.topic ?? `nublox.${input.aggregateType.toLowerCase()}`,
    payload,
    timestamp,
    timestamp
  );

  return eventId;
}

export function listPlatformAudit(
  context: CommandContext,
  objectType: string,
  objectId: string
): PlatformAuditEvent[] {
  assertPermission(context, 'platform.audit.read');
  return db.prepare(`
    SELECT id,
      aggregate_id AS aggregateId,
      object_type AS objectType,
      object_id AS objectId,
      action,
      from_state AS fromState,
      to_state AS toState,
      actor_display_name AS actorDisplayName,
      note,
      occurred_at AS occurredAt
    FROM platform_audit_events
    WHERE tenant_id = ? AND object_type = ? AND object_id = ?
    ORDER BY occurred_at DESC, id DESC
  `).all(context.tenantId, objectType, objectId) as unknown as PlatformAuditEvent[];
}
