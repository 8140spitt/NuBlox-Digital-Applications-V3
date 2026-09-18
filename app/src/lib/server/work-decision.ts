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
import {
  hasPublishedApprovalAuthorityPolicy,
  resolveApprovalAuthorityRequirement
} from '$lib/server/authority-configuration';

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
  approvalPolicyRuleId: string | null;
  approvalPolicyVersionId: string | null;
  approvalPolicyRuleKey: string | null;
  approvalPolicyVersionNo: number | null;
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
  'SELECT wd.id, wd.decision_type AS decisionType, wd.request_type AS requestType, wd.request_id AS requestId, wd.subject_type AS subjectType, wd.subject_id AS subjectId, wd.subject_version AS subjectVersion, wd.outcome, wd.reason, wd.decider_party_id AS deciderPartyId, wd.authority_type AS authorityType, wd.authority_grant_id AS authorityGrantId, wd.authority_scope_type AS authorityScopeType, wd.authority_scope_id AS authorityScopeId, wd.authority_currency_code AS authorityCurrencyCode, wd.authority_value AS authorityValue, wd.authority_basis AS authorityBasis, wd.approval_policy_rule_id AS approvalPolicyRuleId, wd.approval_policy_version_id AS approvalPolicyVersionId, apr.rule_key AS approvalPolicyRuleKey, apv.version_no AS approvalPolicyVersionNo, wd.supersedes_decision_id AS supersedesDecisionId, wd.decided_at AS decidedAt FROM work_decisions wd LEFT JOIN approval_authority_rules apr ON apr.id = wd.approval_policy_rule_id AND apr.tenant_id = wd.tenant_id LEFT JOIN approval_authority_rule_versions apv ON apv.id = wd.approval_policy_version_id AND apv.approval_authority_rule_id = apr.id AND apv.tenant_id = wd.tenant_id';

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
    decisionSelect + ' WHERE wd.id = ? AND wd.tenant_id = ?',
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


export async function assertWorkDecisionReference(
  context: CommandContext,
  input: {
    decisionId: string;
    decisionType: string;
    subjectType: string;
    subjectId: string;
    subjectVersion?: string;
    outcome: string;
  },
  executor: DbExecutor
) {
  const decision = await getDecision(context, required(input.decisionId, 'Decision ID'), executor);
  const expectedDecisionType = code(input.decisionType, 'Decision type');
  const expectedOutcome = code(input.outcome, 'Decision outcome');
  const expectedSubjectVersion = input.subjectVersion?.trim() || null;

  if (decision.decisionType !== expectedDecisionType) {
    throw new Error('Decision type does not match the requested domain transition.');
  }
  if (
    decision.subjectType !== required(input.subjectType, 'Decision subject type') ||
    decision.subjectId !== required(input.subjectId, 'Decision subject ID') ||
    decision.subjectVersion !== expectedSubjectVersion
  ) {
    throw new Error('Decision does not reference the exact domain subject/version.');
  }
  if (decision.outcome !== expectedOutcome) {
    throw new Error('Decision outcome does not authorise the requested domain transition.');
  }
  return decision;
}

export async function listWorkDecisions(
  context: CommandContext,
  subject?: { type: string; id: string }
): Promise<WorkDecision[]> {
  assertPermission(context, 'work.decision.read');
  if (!subject) {
    return queryRows<RowDataPacket & WorkDecision>(
      decisionSelect + ' WHERE wd.tenant_id = ? ORDER BY wd.decided_at DESC, wd.id DESC',
      [context.tenantId]
    );
  }
  return queryRows<RowDataPacket & WorkDecision>(
    decisionSelect +
      ' WHERE wd.tenant_id = ? AND wd.subject_type = ? AND wd.subject_id = ? ORDER BY wd.decided_at DESC, wd.id DESC',
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

    let approvalPolicyRuleId: string | null = null;
    let approvalPolicyVersionId: string | null = null;

    const hasApprovalPolicy = await hasPublishedApprovalAuthorityPolicy(
      context,
      decisionType,
      subjectType,
      connection
    );
    if (hasApprovalPolicy && !input.authority) {
      throw new Error(
        'Published Approval Authority policy requires explicit authority context for this Decision.'
      );
    }
    if (hasApprovalPolicy && input.authority) {
      const requirement = await resolveApprovalAuthorityRequirement(
        context,
        {
          actionKey: decisionType,
          objectType: subjectType,
          scopeType: input.authority.scopeType,
          scopeId: input.authority.scopeId,
          currencyCode: input.authority.currencyCode,
          value: input.authority.value
        },
        connection
      );
      if (!requirement) {
        throw new Error('Published Approval Authority policy does not permit this Decision context.');
      }
      approvalPolicyRuleId = requirement.ruleId;
      approvalPolicyVersionId = requirement.id;
      if (requirement.requiredAuthorityType !== code(input.authority.type, 'Authority type', 191)) {
        throw new Error(
          'Published Approval Authority policy requires authority type ' +
            requirement.requiredAuthorityType +
            '.'
        );
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
         authority_basis, approval_policy_rule_id, approval_policy_version_id,
         supersedes_decision_id, decided_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        approvalPolicyRuleId,
        approvalPolicyVersionId,
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
          approvalPolicyRuleId,
          approvalPolicyVersionId,
          supersedesDecisionId: superseded?.id ?? null
        }
      },
      connection
    );

    return id;
  });
}
