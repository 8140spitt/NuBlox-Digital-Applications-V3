import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { dbTransaction, executeMutation, queryOne, queryRows, type DbExecutor } from '$lib/server/db';
import { assertPermission, type CommandContext } from '$lib/server/platform-context';
import { emitBusinessEvent, recordPlatformAudit } from '$lib/server/platform-evidence';

export type GovernanceBody = {
  id: string;
  bodyRef: string;
  name: string;
  bodyType: string;
  status: string;
  aggregateVersion: number;
  currentVersionNo: number;
  mandate: string;
  termsOfReference: string;
  scopeType: string;
  scopeId: string;
  membershipRules: string;
  quorumRequired: number;
  chairPartyId: string;
  secretariatPartyId: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  updatedAt: string;
};

export type GovernanceBodyVersion = {
  id: string;
  bodyId: string;
  versionNo: number;
  lifecycleStatus: string;
  mandate: string;
  termsOfReference: string;
  scopeType: string;
  scopeId: string;
  membershipRules: string;
  quorumRequired: number;
  chairPartyId: string;
  secretariatPartyId: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  createdAt: string;
};

export type GovernanceBodyMembership = {
  id: string;
  bodyId: string;
  partyId: string;
  roleKey: string;
  status: string;
  validFrom: string;
  validTo: string | null;
  version: number;
};

export type GovernanceBodyInput = {
  bodyRef: string;
  name: string;
  bodyType: 'BOARD' | 'COMMITTEE' | 'STEERING_BODY' | string;
  mandate: string;
  termsOfReference: string;
  scopeType: string;
  scopeId: string;
  membershipRules: string;
  quorumRequired: number;
  chairPartyId: string;
  secretariatPartyId: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  members: Array<{ partyId: string; roleKey: string }>;
};

const currentSelect = `
SELECT b.id,
       b.body_ref AS bodyRef,
       b.name,
       b.body_type AS bodyType,
       b.status,
       b.aggregate_version AS aggregateVersion,
       b.current_version_no AS currentVersionNo,
       v.mandate,
       v.terms_of_reference AS termsOfReference,
       v.scope_type AS scopeType,
       v.scope_id AS scopeId,
       v.membership_rules AS membershipRules,
       v.quorum_required AS quorumRequired,
       v.chair_party_id AS chairPartyId,
       v.secretariat_party_id AS secretariatPartyId,
       v.effective_from AS effectiveFrom,
       v.effective_to AS effectiveTo,
       b.updated_at AS updatedAt
  FROM governance_bodies b
  JOIN governance_body_versions v
    ON v.body_id = b.id
   AND v.version_no = b.current_version_no
   AND v.tenant_id = b.tenant_id`;

function now() {
  return new Date().toISOString();
}

function required(value: string, label: string) {
  const clean = value.trim();
  if (!clean) throw new Error(label + ' is required.');
  return clean;
}

function code(value: string, label: string, max = 191) {
  const clean = required(value, label).toUpperCase();
  if (clean.length > max || !/^[A-Z0-9][A-Z0-9._:-]*$/.test(clean)) {
    throw new Error(label + ' contains unsupported characters.');
  }
  return clean;
}

function optionalRange(from?: string, to?: string) {
  const parse = (value: string | undefined, label: string) => {
    if (!value?.trim()) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new Error(label + ' is invalid.');
    return parsed.toISOString();
  };
  const effectiveFrom = parse(from, 'Governance Body effective-from');
  const effectiveTo = parse(to, 'Governance Body effective-to');
  if (effectiveFrom && effectiveTo && effectiveTo <= effectiveFrom) {
    throw new Error('Governance Body effective-to must be later than effective-from.');
  }
  return { effectiveFrom, effectiveTo };
}

async function assertParty(context: CommandContext, partyId: string, executor: DbExecutor) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM parties WHERE id = ? AND tenant_id = ? AND status = 'ACTIVE'",
    [partyId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Active Governance Body member Party not found.');
}

async function getBody(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & GovernanceBody>(
    currentSelect + ' WHERE b.id = ? AND b.tenant_id = ?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Governance Body not found.');
  return row;
}

async function evidence(
  context: CommandContext,
  body: GovernanceBody,
  eventType: string,
  fromState: string | null,
  toState: string,
  payload: Record<string, unknown>,
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-02-GOVERNANCE',
      objectType: 'governance_body',
      objectId: body.id,
      action: eventType,
      fromState: fromState ?? undefined,
      toState
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: 'AGG-02-GOVERNANCE',
      aggregateType: 'GovernanceBody',
      aggregateObjectId: body.id,
      aggregateVersion: body.aggregateVersion,
      eventType,
      topic: 'nublox.governance.body',
      payload
    },
    executor
  );
}

function validateMembers(input: GovernanceBodyInput) {
  if (!Number.isInteger(input.quorumRequired) || input.quorumRequired < 1) {
    throw new Error('Governance Body quorum must be a positive whole number.');
  }
  const unique = new Map<string, { partyId: string; roleKey: string }>();
  for (const member of input.members) {
    const partyId = required(member.partyId, 'Governance Body member Party ID');
    if (unique.has(partyId)) throw new Error('A Party may only appear once in a Governance Body membership set.');
    unique.set(partyId, { partyId, roleKey: code(member.roleKey, 'Governance Body membership role', 64) });
  }
  if (!unique.has(input.chairPartyId)) throw new Error('Governance Body chair must be included in membership.');
  if (!unique.has(input.secretariatPartyId)) throw new Error('Governance Body secretariat must be included in membership.');
  if (unique.size < input.quorumRequired) throw new Error('Governance Body quorum cannot exceed active membership.');
  return [...unique.values()];
}

async function insertVersion(
  context: CommandContext,
  bodyId: string,
  versionNo: number,
  lifecycleStatus: string,
  input: GovernanceBodyInput,
  executor: DbExecutor
) {
  const members = validateMembers(input);
  const effectivity = optionalRange(input.effectiveFrom, input.effectiveTo);
  await assertParty(context, input.chairPartyId, executor);
  await assertParty(context, input.secretariatPartyId, executor);
  for (const member of members) await assertParty(context, member.partyId, executor);

  const versionId = randomUUID();
  await executeMutation(
    'INSERT INTO governance_body_versions (id, tenant_id, body_id, version_no, lifecycle_status, mandate, terms_of_reference, scope_type, scope_id, membership_rules, quorum_required, chair_party_id, secretariat_party_id, effective_from, effective_to, created_by_party_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      versionId, context.tenantId, bodyId, versionNo, lifecycleStatus,
      required(input.mandate, 'Governance Body mandate'),
      required(input.termsOfReference, 'Governance Body terms of reference'),
      code(input.scopeType, 'Governance Body scope type', 64),
      required(input.scopeId, 'Governance Body scope ID'),
      required(input.membershipRules, 'Governance Body membership rules'),
      input.quorumRequired, input.chairPartyId, input.secretariatPartyId,
      effectivity.effectiveFrom, effectivity.effectiveTo, context.actorPartyId, now()
    ],
    executor
  );
  return { versionId, members, effectivity };
}

export async function listGovernanceBodies(context: CommandContext) {
  assertPermission(context, 'governance.body.read');
  return queryRows<RowDataPacket & GovernanceBody>(
    currentSelect + ' WHERE b.tenant_id = ? ORDER BY b.body_type, b.name',
    [context.tenantId]
  );
}

export async function listGovernanceBodyVersions(context: CommandContext, bodyId: string) {
  assertPermission(context, 'governance.body.read');
  await getBody(context, bodyId);
  return queryRows<RowDataPacket & GovernanceBodyVersion>(
    'SELECT id, body_id AS bodyId, version_no AS versionNo, lifecycle_status AS lifecycleStatus, mandate, terms_of_reference AS termsOfReference, scope_type AS scopeType, scope_id AS scopeId, membership_rules AS membershipRules, quorum_required AS quorumRequired, chair_party_id AS chairPartyId, secretariat_party_id AS secretariatPartyId, effective_from AS effectiveFrom, effective_to AS effectiveTo, created_at AS createdAt FROM governance_body_versions WHERE tenant_id = ? AND body_id = ? ORDER BY version_no DESC',
    [context.tenantId, bodyId]
  );
}

export async function listGovernanceBodyMemberships(context: CommandContext, bodyId: string) {
  assertPermission(context, 'governance.body.read');
  await getBody(context, bodyId);
  return queryRows<RowDataPacket & GovernanceBodyMembership>(
    'SELECT id, body_id AS bodyId, party_id AS partyId, role_key AS roleKey, status, valid_from AS validFrom, valid_to AS validTo, version FROM governance_body_memberships WHERE tenant_id = ? AND body_id = ? ORDER BY status, role_key, valid_from',
    [context.tenantId, bodyId]
  );
}

export async function createGovernanceBody(context: CommandContext, input: GovernanceBodyInput) {
  assertPermission(context, 'governance.body.manage');
  const bodyRef = code(input.bodyRef, 'Governance Body reference');
  const bodyType = code(input.bodyType, 'Governance Body type', 64);
  if (!['BOARD', 'COMMITTEE', 'STEERING_BODY'].includes(bodyType)) {
    throw new Error('Governance Body type must be BOARD, COMMITTEE or STEERING_BODY.');
  }

  return dbTransaction(async (connection) => {
    const id = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO governance_bodies (id, tenant_id, body_ref, name, body_type, status, aggregate_version, current_version_no, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'PROPOSED', 1, 1, ?, ?)",
      [id, context.tenantId, bodyRef, required(input.name, 'Governance Body name'), bodyType, timestamp, timestamp],
      connection
    );
    const configured = await insertVersion(context, id, 1, 'PROPOSED', input, connection);
    const validFrom = configured.effectivity.effectiveFrom ?? timestamp;
    for (const member of configured.members) {
      await executeMutation(
        "INSERT INTO governance_body_memberships (id, tenant_id, body_id, party_id, role_key, status, valid_from, valid_to, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, NULL, 1, ?, ?)",
        [randomUUID(), context.tenantId, id, member.partyId, member.roleKey, validFrom, timestamp, timestamp],
        connection
      );
    }
    const created = await getBody(context, id, connection);
    await evidence(context, created, 'GOVERNANCE_BODY_PROPOSED', null, 'PROPOSED', {
      bodyRef, bodyType, versionId: configured.versionId, memberCount: configured.members.length
    }, connection);
    return id;
  });
}

export async function reviseGovernanceBody(
  context: CommandContext,
  id: string,
  expectedAggregateVersion: number,
  input: GovernanceBodyInput
) {
  assertPermission(context, 'governance.body.manage');
  return dbTransaction(async (connection) => {
    const current = await getBody(context, id, connection, true);
    if (current.aggregateVersion !== expectedAggregateVersion) throw new Error('This Governance Body changed after you opened it.');
    if (!['PROPOSED', 'SUSPENDED'].includes(current.status)) throw new Error('Only proposed or suspended Governance Bodies can be reconfigured.');
    const nextVersionNo = current.currentVersionNo + 1;
    const configured = await insertVersion(context, current.id, nextVersionNo, current.status, input, connection);
    const timestamp = now();
    const result = await executeMutation(
      'UPDATE governance_bodies SET name = ?, body_type = ?, aggregate_version = aggregate_version + 1, current_version_no = ?, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?',
      [required(input.name, 'Governance Body name'), code(input.bodyType, 'Governance Body type', 64), nextVersionNo, timestamp, current.id, context.tenantId, expectedAggregateVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Governance Body revision detected.');
    const updated = await getBody(context, current.id, connection);
    await evidence(context, updated, 'GOVERNANCE_BODY_REVISED', current.status, current.status, {
      versionId: configured.versionId, versionNo: nextVersionNo
    }, connection);
  });
}

export async function addGovernanceBodyMember(
  context: CommandContext,
  bodyId: string,
  expectedAggregateVersion: number,
  input: { partyId: string; roleKey: string; validFrom?: string }
) {
  assertPermission(context, 'governance.body.manage');
  return dbTransaction(async (connection) => {
    const body = await getBody(context, bodyId, connection, true);
    if (body.aggregateVersion !== expectedAggregateVersion) throw new Error('This Governance Body changed after you opened it.');
    if (body.status === 'DISSOLVED') throw new Error('Dissolved Governance Bodies cannot receive members.');
    await assertParty(context, input.partyId, connection);
    const existing = await queryOne<RowDataPacket & { id: string }>(
      "SELECT id FROM governance_body_memberships WHERE tenant_id = ? AND body_id = ? AND party_id = ? AND status = 'ACTIVE' LIMIT 1 FOR UPDATE",
      [context.tenantId, body.id, input.partyId], connection
    );
    if (existing) throw new Error('Party is already an active Governance Body member.');
    const validFrom = input.validFrom?.trim() ? new Date(input.validFrom) : new Date();
    if (Number.isNaN(validFrom.getTime())) throw new Error('Membership valid-from is invalid.');
    const timestamp = now();
    await executeMutation(
      "INSERT INTO governance_body_memberships (id, tenant_id, body_id, party_id, role_key, status, valid_from, valid_to, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, NULL, 1, ?, ?)",
      [randomUUID(), context.tenantId, body.id, input.partyId, code(input.roleKey, 'Membership role', 64), validFrom.toISOString(), timestamp, timestamp],
      connection
    );
    const result = await executeMutation(
      'UPDATE governance_bodies SET aggregate_version = aggregate_version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?',
      [timestamp, body.id, context.tenantId, expectedAggregateVersion], connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Governance Body membership change detected.');
    const updated = await getBody(context, body.id, connection);
    await evidence(context, updated, 'GOVERNANCE_BODY_MEMBER_ADDED', body.status, body.status, {
      partyId: input.partyId, roleKey: code(input.roleKey, 'Membership role', 64)
    }, connection);
  });
}

export async function endGovernanceBodyMembership(
  context: CommandContext,
  bodyId: string,
  membershipId: string,
  expectedAggregateVersion: number
) {
  assertPermission(context, 'governance.body.manage');
  return dbTransaction(async (connection) => {
    const body = await getBody(context, bodyId, connection, true);
    if (body.aggregateVersion !== expectedAggregateVersion) throw new Error('This Governance Body changed after you opened it.');
    const membership = await queryOne<RowDataPacket & GovernanceBodyMembership>(
      'SELECT id, body_id AS bodyId, party_id AS partyId, role_key AS roleKey, status, valid_from AS validFrom, valid_to AS validTo, version FROM governance_body_memberships WHERE id = ? AND tenant_id = ? AND body_id = ? FOR UPDATE',
      [membershipId, context.tenantId, body.id], connection
    );
    if (!membership || membership.status !== 'ACTIVE') throw new Error('Active Governance Body membership not found.');
    if (membership.partyId === body.chairPartyId || membership.partyId === body.secretariatPartyId) {
      throw new Error('Chair or secretariat membership cannot end until Governance Body configuration is revised.');
    }
    const active = await queryOne<RowDataPacket & { count: number }>(
      "SELECT COUNT(*) AS count FROM governance_body_memberships WHERE tenant_id = ? AND body_id = ? AND status = 'ACTIVE'",
      [context.tenantId, body.id], connection
    );
    if (Number(active?.count ?? 0) - 1 < body.quorumRequired) throw new Error('Membership cannot end because active membership would fall below quorum.');
    const timestamp = now();
    await executeMutation(
      "UPDATE governance_body_memberships SET status = 'ENDED', valid_to = ?, version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND status = 'ACTIVE'",
      [timestamp, timestamp, membership.id, context.tenantId], connection
    );
    const result = await executeMutation(
      'UPDATE governance_bodies SET aggregate_version = aggregate_version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?',
      [timestamp, body.id, context.tenantId, expectedAggregateVersion], connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Governance Body membership change detected.');
    const updated = await getBody(context, body.id, connection);
    await evidence(context, updated, 'GOVERNANCE_BODY_MEMBERSHIP_ENDED', body.status, body.status, {
      partyId: membership.partyId, membershipId: membership.id
    }, connection);
  });
}

export async function transitionGovernanceBody(
  context: CommandContext,
  id: string,
  expectedAggregateVersion: number,
  action: 'CONSTITUTE' | 'ACTIVATE' | 'SUSPEND' | 'DISSOLVE'
) {
  assertPermission(context, 'governance.body.approve');
  const transitions: Record<string, { from: string[]; to: string; event: string }> = {
    CONSTITUTE: { from: ['PROPOSED'], to: 'CONSTITUTED', event: 'GOVERNANCE_BODY_CONSTITUTED' },
    ACTIVATE: { from: ['CONSTITUTED', 'SUSPENDED'], to: 'ACTIVE', event: 'GOVERNANCE_BODY_ACTIVATED' },
    SUSPEND: { from: ['ACTIVE'], to: 'SUSPENDED', event: 'GOVERNANCE_BODY_SUSPENDED' },
    DISSOLVE: { from: ['CONSTITUTED', 'ACTIVE', 'SUSPENDED'], to: 'DISSOLVED', event: 'GOVERNANCE_BODY_DISSOLVED' }
  };
  const transition = transitions[action];
  if (!transition) throw new Error('Unsupported Governance Body transition.');

  return dbTransaction(async (connection) => {
    const body = await getBody(context, id, connection, true);
    if (body.aggregateVersion !== expectedAggregateVersion) throw new Error('This Governance Body changed after you opened it.');
    if (!transition.from.includes(body.status)) throw new Error('Governance Body cannot transition from ' + body.status + ' using ' + action + '.');
    if (action === 'CONSTITUTE' || action === 'ACTIVATE') {
      const active = await queryOne<RowDataPacket & { count: number }>(
        "SELECT COUNT(*) AS count FROM governance_body_memberships WHERE tenant_id = ? AND body_id = ? AND status = 'ACTIVE'",
        [context.tenantId, body.id], connection
      );
      if (Number(active?.count ?? 0) < body.quorumRequired) throw new Error('Governance Body cannot activate without membership meeting quorum.');
    }
    const timestamp = now();
    const result = await executeMutation(
      'UPDATE governance_bodies SET status = ?, aggregate_version = aggregate_version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?',
      [transition.to, timestamp, body.id, context.tenantId, expectedAggregateVersion], connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Governance Body transition detected.');
    await executeMutation(
      'UPDATE governance_body_versions SET lifecycle_status = ? WHERE body_id = ? AND version_no = ?',
      [transition.to, body.id, body.currentVersionNo], connection
    );
    if (action === 'DISSOLVE') {
      await executeMutation(
        "UPDATE governance_body_memberships SET status = 'ENDED', valid_to = ?, version = version + 1, updated_at = ? WHERE tenant_id = ? AND body_id = ? AND status = 'ACTIVE'",
        [timestamp, timestamp, context.tenantId, body.id], connection
      );
    }
    const updated = await getBody(context, body.id, connection);
    await evidence(context, updated, transition.event, body.status, transition.to, { versionNo: body.currentVersionNo }, connection);
  });
}
