import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import {
  dbTransaction,
  executeMutation,
  queryOne,
  queryRows,
  type DbExecutor
} from '$lib/server/db';
import { assertPermission, type CommandContext } from '$lib/server/platform-context';
import { emitBusinessEvent, recordPlatformAudit } from '$lib/server/platform-evidence';
import {
  hasPublishedDelegatedAuthorityPolicy,
  resolveDelegatedAuthorityPolicy
} from '$lib/server/authority-configuration';

export type DelegatedAuthority = {
  id: string;
  grantorPartyId: string;
  grantorDisplayName: string;
  delegatePartyId: string;
  delegateDisplayName: string;
  authorityType: string;
  basis: string;
  scopeType: string;
  scopeId: string;
  currencyCode: string | null;
  valueLimit: string | null;
  allowSubdelegation: number;
  status: string;
  version: number;
  validFrom: string;
  validTo: string | null;
  approvedAt: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  policyRuleId: string | null;
  policyVersionId: string | null;
};

export type DelegatedAuthorityInput = {
  delegatePartyId: string;
  grantorPartyId?: string;
  authorityType: string;
  basis: string;
  scopeType: string;
  scopeId: string;
  currencyCode?: string;
  valueLimit?: number | null;
  allowSubdelegation?: boolean;
  validFrom?: string;
  validTo?: string;
};

const selectAuthority =
  'SELECT da.id, da.grantor_party_id AS grantorPartyId, gp.display_name AS grantorDisplayName, da.delegate_party_id AS delegatePartyId, dp.display_name AS delegateDisplayName, da.authority_type AS authorityType, da.basis, da.scope_type AS scopeType, da.scope_id AS scopeId, da.currency_code AS currencyCode, da.value_limit AS valueLimit, da.allow_subdelegation AS allowSubdelegation, da.status, da.version, da.valid_from AS validFrom, da.valid_to AS validTo, da.approved_at AS approvedAt, da.revoked_at AS revokedAt, da.revocation_reason AS revocationReason, da.policy_rule_id AS policyRuleId, da.policy_version_id AS policyVersionId FROM delegated_authorities da JOIN parties gp ON gp.id = da.grantor_party_id JOIN parties dp ON dp.id = da.delegate_party_id';

function now() {
  return new Date().toISOString();
}
function required(value: string, label: string) {
  const clean = value.trim();
  if (!clean) throw new Error(label + ' is required.');
  return clean;
}
function date(value: string | undefined, fallback: string | null, label: string) {
  const clean = value?.trim();
  if (!clean) return fallback;
  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) throw new Error(label + ' is invalid.');
  return parsed.toISOString();
}
async function assertActiveParty(context: CommandContext, partyId: string, executor: DbExecutor) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM parties WHERE id = ? AND tenant_id = ? AND status = 'ACTIVE'",
    [partyId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Active Party not found in this tenant.');
}
async function getRow(context: CommandContext, id: string, executor?: DbExecutor) {
  const row = await queryOne<RowDataPacket & DelegatedAuthority>(
    selectAuthority + ' WHERE da.id = ? AND da.tenant_id = ?',
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Delegated Authority not found.');
  return row;
}
async function evidence(
  context: CommandContext,
  row: DelegatedAuthority,
  action: string,
  executor: DbExecutor,
  fromState?: string
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-01-AUTHORITY',
      objectType: 'delegated_authority',
      objectId: row.id,
      action,
      fromState,
      toState: row.status,
      note: row.authorityType + ' · ' + row.scopeType
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: 'AGG-01-AUTHORITY',
      aggregateType: 'DelegatedAuthority',
      aggregateObjectId: row.id,
      aggregateVersion: row.version,
      eventType: action,
      topic: 'nublox.authority.delegation',
      payload: {
        grantorPartyId: row.grantorPartyId,
        delegatePartyId: row.delegatePartyId,
        authorityType: row.authorityType,
        scopeType: row.scopeType,
        scopeId: row.scopeId,
        currencyCode: row.currencyCode,
        valueLimit: row.valueLimit,
        allowSubdelegation: Boolean(row.allowSubdelegation),
        validFrom: row.validFrom,
        validTo: row.validTo,
        status: row.status,
        policyRuleId: row.policyRuleId,
        policyVersionId: row.policyVersionId
      }
    },
    executor
  );
}

export async function listDelegatedAuthorities(context: CommandContext) {
  assertPermission(context, 'authority.delegation.read');
  return queryRows<RowDataPacket & DelegatedAuthority>(
    selectAuthority +
      ' WHERE da.tenant_id = ? ORDER BY dp.display_name, da.authority_type, da.valid_from DESC',
    [context.tenantId]
  );
}

export async function createDelegatedAuthority(
  context: CommandContext,
  input: DelegatedAuthorityInput
) {
  assertPermission(context, 'authority.delegation.manage');
  const grantorPartyId = input.grantorPartyId?.trim() || context.actorPartyId;
  const validFrom = date(input.validFrom, now(), 'Valid-from') as string;
  const validTo = date(input.validTo, null, 'Valid-to');
  if (validTo && validTo <= validFrom) throw new Error('Valid-to must be later than valid-from.');
  if (input.valueLimit != null && (!Number.isFinite(input.valueLimit) || input.valueLimit < 0))
    throw new Error('Value limit must be a non-negative number.');
  const currencyCode = input.currencyCode?.trim().toUpperCase() || null;
  if (currencyCode && !/^[A-Z]{3}$/.test(currencyCode))
    throw new Error('Currency code must be a three-letter ISO-style code.');
  if (input.valueLimit != null && !currencyCode)
    throw new Error('A monetary value limit requires a currency code.');

  return dbTransaction(async (connection) => {
    await assertActiveParty(context, grantorPartyId, connection);
    await assertActiveParty(context, input.delegatePartyId, connection);
    const id = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO delegated_authorities (id, tenant_id, grantor_party_id, delegate_party_id, authority_type, basis, scope_type, scope_id, currency_code, value_limit, allow_subdelegation, status, version, valid_from, valid_to, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', 1, ?, ?, ?, ?)",
      [
        id,
        context.tenantId,
        grantorPartyId,
        input.delegatePartyId,
        required(input.authorityType, 'Authority type').toUpperCase(),
        required(input.basis, 'Authority basis'),
        required(input.scopeType, 'Scope type').toUpperCase(),
        required(input.scopeId, 'Scope ID'),
        currencyCode,
        input.valueLimit ?? null,
        input.allowSubdelegation ? 1 : 0,
        validFrom,
        validTo,
        timestamp,
        timestamp
      ],
      connection
    );
    await evidence(
      context,
      await getRow(context, id, connection),
      'DELEGATED_AUTHORITY_CREATED',
      connection
    );
    return id;
  });
}

async function transition(
  context: CommandContext,
  id: string,
  expectedVersion: number,
  permission: string,
  allowedFrom: string[],
  toState: string,
  action: string,
  reason?: string
) {
  assertPermission(context, permission);
  return dbTransaction(async (connection) => {
    const current = await getRow(context, id, connection);
    if (current.version !== expectedVersion)
      throw new Error('This Delegated Authority changed after you opened it.');
    if (!allowedFrom.includes(current.status))
      throw new Error(`Delegated Authority cannot move from ${current.status} to ${toState}.`);
    if (toState === 'APPROVED' && current.delegatePartyId === context.actorPartyId) {
      throw new Error('A delegate cannot approve their own Delegated Authority.');
    }
    let policyRuleId = current.policyRuleId;
    let policyVersionId = current.policyVersionId;

    if (
      toState === 'APPROVED' &&
      (await hasPublishedDelegatedAuthorityPolicy(context, current.authorityType, connection))
    ) {
      const durationDays = current.validTo
        ? Math.ceil(
            (new Date(current.validTo).getTime() - new Date(current.validFrom).getTime()) /
              86_400_000
          )
        : undefined;
      const policy = await resolveDelegatedAuthorityPolicy(
        context,
        {
          authorityType: current.authorityType,
          scopeType: current.scopeType,
          scopeId: current.scopeId,
          currencyCode: current.currencyCode ?? undefined,
          value: current.valueLimit == null ? undefined : Number(current.valueLimit),
          durationDays,
          allowSubdelegation: Boolean(current.allowSubdelegation)
        },
        connection
      );
      if (!policy) {
        throw new Error(
          'Published Delegated Authority policy does not permit this grant configuration.'
        );
      }
      policyRuleId = policy.ruleId;
      policyVersionId = policy.id;
    }
    const timestamp = now();
    const revocationReason =
      toState === 'REVOKED'
        ? required(reason ?? '', 'Revocation reason')
        : current.revocationReason;
    const result = await executeMutation(
      "UPDATE delegated_authorities SET status = ?, version = version + 1, approved_at = CASE WHEN ? = 'APPROVED' THEN ? ELSE approved_at END, revoked_at = CASE WHEN ? = 'REVOKED' THEN ? ELSE revoked_at END, revocation_reason = ?, policy_rule_id = CASE WHEN ? = 'APPROVED' THEN ? ELSE policy_rule_id END, policy_version_id = CASE WHEN ? = 'APPROVED' THEN ? ELSE policy_version_id END, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?",
      [
        toState,
        toState,
        timestamp,
        toState,
        timestamp,
        revocationReason,
        toState,
        policyRuleId,
        toState,
        policyVersionId,
        timestamp,
        id,
        context.tenantId,
        expectedVersion
      ],
      connection
    );
    if (result.affectedRows !== 1)
      throw new Error('Concurrent Delegated Authority change detected.');
    await evidence(
      context,
      await getRow(context, id, connection),
      action,
      connection,
      current.status
    );
  });
}

export const approveDelegatedAuthority = (context: CommandContext, id: string, version: number) =>
  transition(
    context,
    id,
    version,
    'authority.delegation.approve',
    ['DRAFT'],
    'APPROVED',
    'DELEGATED_AUTHORITY_APPROVED'
  );
export const activateDelegatedAuthority = (context: CommandContext, id: string, version: number) =>
  transition(
    context,
    id,
    version,
    'authority.delegation.manage',
    ['APPROVED', 'SUSPENDED'],
    'ACTIVE',
    'DELEGATED_AUTHORITY_ACTIVATED'
  );
export const suspendDelegatedAuthority = (context: CommandContext, id: string, version: number) =>
  transition(
    context,
    id,
    version,
    'authority.delegation.manage',
    ['ACTIVE'],
    'SUSPENDED',
    'DELEGATED_AUTHORITY_SUSPENDED'
  );
export const revokeDelegatedAuthority = (
  context: CommandContext,
  id: string,
  version: number,
  reason: string
) =>
  transition(
    context,
    id,
    version,
    'authority.delegation.manage',
    ['DRAFT', 'APPROVED', 'ACTIVE', 'SUSPENDED'],
    'REVOKED',
    'DELEGATED_AUTHORITY_REVOKED',
    reason
  );

export async function findEffectiveDelegatedAuthority(
  context: CommandContext,
  input: {
    delegatePartyId?: string;
    authorityType: string;
    scopeType: string;
    scopeId: string;
    value?: number;
    currencyCode?: string;
  }
) {
  assertPermission(context, 'authority.delegation.read');
  const timestamp = now();
  const rows = await queryRows<RowDataPacket & DelegatedAuthority>(
    selectAuthority +
      " WHERE da.tenant_id = ? AND da.delegate_party_id = ? AND da.authority_type = ? AND da.scope_type = ? AND da.scope_id = ? AND da.status = 'ACTIVE' AND da.valid_from <= ? AND (da.valid_to IS NULL OR da.valid_to > ?) ORDER BY da.value_limit DESC",
    [
      context.tenantId,
      input.delegatePartyId ?? context.actorPartyId,
      required(input.authorityType, 'Authority type').toUpperCase(),
      required(input.scopeType, 'Scope type').toUpperCase(),
      required(input.scopeId, 'Scope ID'),
      timestamp,
      timestamp
    ]
  );

  if (input.value == null) return rows[0] ?? null;
  if (!Number.isFinite(input.value) || input.value < 0)
    throw new Error('Authority evaluation value must be a non-negative number.');
  const currency = required(input.currencyCode ?? '', 'Currency code').toUpperCase();
  return (
    rows.find(
      (row) =>
        row.currencyCode === currency &&
        row.valueLimit != null &&
        Number(row.valueLimit) >= input.value!
    ) ?? null
  );
}
