import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import {
  dbTransaction,
  queryOne,
  queryRows,
  executeMutation,
  type DbExecutor
} from '$lib/server/db';
import { assertPermission, type CommandContext } from '$lib/server/platform-context';
import { emitBusinessEvent, recordPlatformAudit } from '$lib/server/platform-evidence';

export type WorkDecision = {
  id: string;
  decisionType: string;
  requestType: string | null;
  requestId: string | null;
  subjectType: string;
  subjectId: string;
  subjectVersion: string | null;
  outcome: string;
  reason: string;
  deciderPartyId: string;
  authorityType: string | null;
  authorityGrantId: string | null;
  authorityScopeType: string | null;
  authorityScopeId: string | null;
  authorityCurrencyCode: string | null;
  authorityValue: string | null;
  authorityBasis: string;
  supersedesDecisionId: string | null;
  decidedAt: string;
};

export type RecordDecisionInput = {
  decisionType: string;
  requestType?: string;
  requestId?: string;
  subjectType: string;
  subjectId: string;
  subjectVersion?: string;
  outcome: string;
  reason: string;
  authority?: {
    type: string;
    scopeType: string;
    scopeId: string;
    currencyCode?: string;
    value?: number;
  };
  supersedesDecisionId?: string;
};

const decisionSelect =
  'SELECT id, decision_type AS decisionType, request_type AS requestType, request_id AS requestId, subject_type AS subjectType, subject_id AS subjectId, subject_version AS subjectVersion, outcome, reason, decider_party_id AS deciderPartyId, authority_type AS authorityType, authority_grant_id AS authorityGrantId, authority_scope_type AS authorityScopeType, authority_scope_id AS authorityScopeId, authority_currency_code AS authorityCurrencyCode, authority_value AS authorityValue, authority_basis AS authorityBasis, supersedes_decision_id AS supersedesDecisionId, decided_at AS decidedAt FROM work_decisions';

function now() {
  return new Date().toISOString();
}

function required(value: string, label: string) {
  const clean = value.trim();
  if (!clean) throw new Error(label + ' is required.');
  return clean;
}

function code(value: string, label: string, max = 64) {
  const clean = required(value, label).toUpperCase();
  if (clean.length > max || !/^[A-Z0-9][A-Z0-9._:-]*$/.test(clean)) {
    throw new Error(label + ' contains unsupported characters.');
  }
  return clean;
}

async function getDecision(context: CommandContext, decisionId: string, executor?: DbExecutor) {
  const row = await queryOne<RowDataPacket & WorkDecision>(
    decisionSelect + ' WHERE id = ? AND tenant_id = ?',
    [decisionId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Decision not found.');
  return row;
}

async function resolveAuthority(
  context: CommandContext,
  authority: NonNullable<RecordDecisionInput['authority']>,
  executor: DbExecutor
) {
  const authorityType = code(authority.type, 'Authority type', 191);
  const scopeType = code(authority.scopeType, 'Authority scope type');
  const scopeId = required(authority.scopeId, 'Authority scope ID');
  const timestamp = now();

  let currencyCode: string | null = null;
  let value: number | null = null;
  if (authority.value != null) {
    if (!Number.isFinite(authority.value) || authority.value < 0) {
      throw new Error('Decision authority value must be a non-negative number.');
    }
    value = authority.value;
    currencyCode = required(authority.currencyCode ?? '', 'Authority currency code').toUpperCase();
    if (!/^[A-Z]{3}$/.test(currencyCode)) {
      throw new Error('Authority currency code must be a three-letter ISO-style code.');
    }
  }

  const params: unknown[] = [
    context.tenantId,
    context.actorPartyId,
    authorityType,
    scopeType,
    scopeId,
    timestamp,
    timestamp
  ];
  let valueClause = '';
  if (value != null) {
    valueClause =
      ' AND da.currency_code = ? AND da.value_limit IS NOT NULL AND da.value_limit >= ?';
    params.push(currencyCode, value);
  }

  const grant = await queryOne<
    RowDataPacket & {
      id: string;
      basis: string;
      currencyCode: string | null;
      valueLimit: string | null;
    }
  >(
    `SELECT da.id,
            da.basis,
            da.currency_code AS currencyCode,
            da.value_limit AS valueLimit
       FROM delegated_authorities da
      WHERE da.tenant_id = ?
        AND da.delegate_party_id = ?
        AND da.authority_type = ?
        AND da.scope_type = ?
        AND da.scope_id = ?
        AND da.status = 'ACTIVE'
        AND da.valid_from <= ?
        AND (da.valid_to IS NULL OR da.valid_to > ?)
        ${valueClause}
      ORDER BY da.value_limit IS NULL DESC, da.value_limit DESC, da.valid_from DESC
      LIMIT 1`,
    params,
    executor
  );
  if (!grant) {
    throw new Error(
      'The current actor does not hold effective Delegated Authority for this decision.'
    );
  }

  return {
    authorityType,
    authorityGrantId: grant.id,
    authorityScopeType: scopeType,
    authorityScopeId: scopeId,
    authorityCurrencyCode: currencyCode,
    authorityValue: value,
    authorityBasis: grant.basis
  };
}

export async function listWorkDecisions(
  context: CommandContext,
  subject?: { type: string; id: string }
): Promise<WorkDecision[]> {
  assertPermission(context, 'work.decision.read');
  if (!subject) {
    return queryRows<RowDataPacket & WorkDecision>(
      decisionSelect + ' WHERE tenant_id = ? ORDER BY decided_at DESC, id DESC',
      [context.tenantId]
    );
  }
  return queryRows<RowDataPacket & WorkDecision>(
    decisionSelect +
      ' WHERE tenant_id = ? AND subject_type = ? AND subject_id = ? ORDER BY decided_at DESC, id DESC',
    [context.tenantId, required(subject.type, 'Subject type'), required(subject.id, 'Subject ID')]
  );
}

export async function recordWorkDecision(context: CommandContext, input: RecordDecisionInput) {
  assertPermission(context, 'work.decision.record');

  const decisionType = code(input.decisionType, 'Decision type');
  const subjectType = required(input.subjectType, 'Decision subject type');
  const subjectId = required(input.subjectId, 'Decision subject ID');
  const subjectVersion = input.subjectVersion?.trim() || null;
  const outcome = code(input.outcome, 'Decision outcome');
  const reason = required(input.reason, 'Decision reason');

  const requestType = input.requestType?.trim() ? code(input.requestType, 'Request type') : null;
  const requestId = input.requestId?.trim() || null;
  if (Boolean(requestType) !== Boolean(requestId)) {
    throw new Error('Decision request type and request ID must be supplied together.');
  }

  return dbTransaction(async (connection) => {
    let superseded: WorkDecision | null = null;
    if (input.supersedesDecisionId?.trim()) {
      superseded = await getDecision(context, input.supersedesDecisionId.trim(), connection);
      if (
        superseded.subjectType !== subjectType ||
        superseded.subjectId !== subjectId ||
        superseded.subjectVersion !== subjectVersion
      ) {
        throw new Error('A corrective Decision must reference the same exact subject/version.');
      }
    }

    const authority = input.authority
      ? await resolveAuthority(context, input.authority, connection)
      : {
          authorityType: null,
          authorityGrantId: null,
          authorityScopeType: null,
          authorityScopeId: null,
          authorityCurrencyCode: null,
          authorityValue: null,
          authorityBasis:
            'Permission work.decision.record via role(s): ' +
            (context.roleKeys.length ? context.roleKeys.join(', ') : 'direct permission context')
        };

    const id = randomUUID();
    const timestamp = now();
    await executeMutation(
      `INSERT INTO work_decisions
        (id, tenant_id, decision_type, request_type, request_id, subject_type, subject_id,
         subject_version, outcome, reason, decider_party_id, authority_type, authority_grant_id,
         authority_scope_type, authority_scope_id, authority_currency_code, authority_value,
         authority_basis, supersedes_decision_id, decided_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        context.tenantId,
        decisionType,
        requestType,
        requestId,
        subjectType,
        subjectId,
        subjectVersion,
        outcome,
        reason,
        context.actorPartyId,
        authority.authorityType,
        authority.authorityGrantId,
        authority.authorityScopeType,
        authority.authorityScopeId,
        authority.authorityCurrencyCode,
        authority.authorityValue,
        authority.authorityBasis,
        superseded?.id ?? null,
        timestamp,
        timestamp
      ],
      connection
    );

    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-27-DECISION',
        objectType: 'work_decision',
        objectId: id,
        action: superseded ? 'WORK_DECISION_CORRECTED' : 'WORK_DECISION_RECORDED',
        toState: 'RECORDED',
        note: decisionType + ' · ' + outcome
      },
      connection
    );
    await emitBusinessEvent(
      context,
      {
        aggregateId: 'AGG-27-DECISION',
        aggregateType: 'Decision',
        aggregateObjectId: id,
        aggregateVersion: 1,
        eventType: superseded ? 'WORK_DECISION_CORRECTED' : 'WORK_DECISION_RECORDED',
        topic: 'nublox.work.decision',
        payload: {
          decisionType,
          requestType,
          requestId,
          subjectType,
          subjectId,
          subjectVersion,
          outcome,
          deciderPartyId: context.actorPartyId,
          authorityType: authority.authorityType,
          authorityGrantId: authority.authorityGrantId,
          authorityScopeType: authority.authorityScopeType,
          authorityScopeId: authority.authorityScopeId,
          authorityCurrencyCode: authority.authorityCurrencyCode,
          authorityValue: authority.authorityValue,
          authorityBasis: authority.authorityBasis,
          supersedesDecisionId: superseded?.id ?? null
        }
      },
      connection
    );

    return id;
  });
}
