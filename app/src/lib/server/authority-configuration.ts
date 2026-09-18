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

export type ApprovalAuthorityRule = {
  id: string;
  ruleKey: string;
  actionKey: string;
  objectType: string;
  status: string;
  version: number;
};

export type ApprovalAuthorityRuleVersion = {
  id: string;
  approvalAuthorityRuleId: string;
  versionNo: number;
  status: string;
  scopeType: string | null;
  scopeId: string | null;
  currencyCode: string | null;
  minimumValue: string | null;
  maximumValue: string | null;
  requiredAuthorityType: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  publishedAt: string | null;
};

export type DelegatedAuthorityRule = {
  id: string;
  ruleKey: string;
  authorityType: string;
  status: string;
  version: number;
};

export type DelegatedAuthorityRuleVersion = {
  id: string;
  delegatedAuthorityRuleId: string;
  versionNo: number;
  status: string;
  allowedScopeType: string;
  allowedScopeId: string | null;
  currencyCode: string | null;
  maximumValue: string | null;
  maximumDurationDays: number | null;
  allowSubdelegation: number;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  publishedAt: string | null;
};

export type ApprovalAuthorityConfigurationInput = {
  scopeType?: string;
  scopeId?: string;
  currencyCode?: string;
  minimumValue?: number | null;
  maximumValue?: number | null;
  requiredAuthorityType: string;
  effectiveFrom?: string;
  effectiveTo?: string;
};

export type DelegatedAuthorityConfigurationInput = {
  allowedScopeType: string;
  allowedScopeId?: string;
  currencyCode?: string;
  maximumValue?: number | null;
  maximumDurationDays?: number | null;
  allowSubdelegation?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
};

const approvalRuleSelect =
  'SELECT id, rule_key AS ruleKey, action_key AS actionKey, object_type AS objectType, status, version FROM approval_authority_rules';
const approvalVersionSelect =
  'SELECT id, approval_authority_rule_id AS approvalAuthorityRuleId, version_no AS versionNo, status, scope_type AS scopeType, scope_id AS scopeId, currency_code AS currencyCode, minimum_value AS minimumValue, maximum_value AS maximumValue, required_authority_type AS requiredAuthorityType, effective_from AS effectiveFrom, effective_to AS effectiveTo, published_at AS publishedAt FROM approval_authority_rule_versions';
const delegatedRuleSelect =
  'SELECT id, rule_key AS ruleKey, authority_type AS authorityType, status, version FROM delegated_authority_rules';
const delegatedVersionSelect =
  'SELECT id, delegated_authority_rule_id AS delegatedAuthorityRuleId, version_no AS versionNo, status, allowed_scope_type AS allowedScopeType, allowed_scope_id AS allowedScopeId, currency_code AS currencyCode, maximum_value AS maximumValue, maximum_duration_days AS maximumDurationDays, allow_subdelegation AS allowSubdelegation, effective_from AS effectiveFrom, effective_to AS effectiveTo, published_at AS publishedAt FROM delegated_authority_rule_versions';

function now() {
  return new Date().toISOString();
}

function required(value: string, label: string) {
  const clean = value.trim();
  if (!clean) throw new Error(label + ' is required.');
  return clean;
}

function key(value: string, label: string, max = 191) {
  const clean = required(value, label).toUpperCase();
  if (clean.length > max || !/^[A-Z0-9][A-Z0-9._:-]*$/.test(clean)) {
    throw new Error(label + ' contains unsupported characters.');
  }
  return clean;
}

function optionalTimestamp(value: string | undefined, label: string) {
  const clean = value?.trim();
  if (!clean) return null;
  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) throw new Error(label + ' is invalid.');
  return parsed.toISOString();
}

function money(
  currencyCode: string | undefined,
  minimumValue: number | null | undefined,
  maximumValue: number | null | undefined
) {
  for (const [label, value] of [
    ['Minimum value', minimumValue],
    ['Maximum value', maximumValue]
  ] as const) {
    if (value != null && (!Number.isFinite(value) || value < 0)) {
      throw new Error(label + ' must be a non-negative number.');
    }
  }
  if (minimumValue != null && maximumValue != null && maximumValue < minimumValue) {
    throw new Error('Maximum value must be greater than or equal to minimum value.');
  }
  if (minimumValue == null && maximumValue == null) {
    return { currencyCode: null, minimumValue: null, maximumValue: null };
  }
  const currency = required(currencyCode ?? '', 'Currency code').toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error('Currency code must be a three-letter ISO-style code.');
  }
  return { currencyCode: currency, minimumValue: minimumValue ?? null, maximumValue: maximumValue ?? null };
}

function effectiveRange(from: string | undefined, to: string | undefined) {
  const effectiveFrom = optionalTimestamp(from, 'Effective-from');
  const effectiveTo = optionalTimestamp(to, 'Effective-to');
  if (effectiveFrom && effectiveTo && effectiveTo <= effectiveFrom) {
    throw new Error('Effective-to must be later than effective-from.');
  }
  return { effectiveFrom, effectiveTo };
}

async function getApprovalRule(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & ApprovalAuthorityRule>(
    approvalRuleSelect + ' WHERE id = ? AND tenant_id = ?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Approval Authority Rule not found.');
  return row;
}

async function getDelegatedRule(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & DelegatedAuthorityRule>(
    delegatedRuleSelect + ' WHERE id = ? AND tenant_id = ?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Delegated Authority Rule not found.');
  return row;
}

async function bumpApprovalRule(
  context: CommandContext,
  rule: ApprovalAuthorityRule,
  executor: DbExecutor
) {
  const result = await executeMutation(
    'UPDATE approval_authority_rules SET version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?',
    [now(), rule.id, context.tenantId, rule.version],
    executor
  );
  if (result.affectedRows !== 1) throw new Error('Concurrent Approval Authority Rule change detected.');
  return getApprovalRule(context, rule.id, executor);
}

async function bumpDelegatedRule(
  context: CommandContext,
  rule: DelegatedAuthorityRule,
  executor: DbExecutor
) {
  const result = await executeMutation(
    'UPDATE delegated_authority_rules SET version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?',
    [now(), rule.id, context.tenantId, rule.version],
    executor
  );
  if (result.affectedRows !== 1) throw new Error('Concurrent Delegated Authority Rule change detected.');
  return getDelegatedRule(context, rule.id, executor);
}

async function evidence(
  context: CommandContext,
  aggregateObjectId: string,
  aggregateVersion: number,
  objectType: string,
  objectId: string,
  action: string,
  status: string,
  payload: Record<string, unknown>,
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-29-AUTHORITY-CONFIG',
      objectType,
      objectId,
      action,
      toState: status
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: 'AGG-29-AUTHORITY-CONFIG',
      aggregateType: 'AuthorityConfigurationRule',
      aggregateObjectId,
      aggregateVersion,
      eventType: action,
      topic: 'nublox.reference.authority',
      payload
    },
    executor
  );
}

export async function listApprovalAuthorityRules(context: CommandContext) {
  assertPermission(context, 'reference.authority.read');
  return queryRows<RowDataPacket & ApprovalAuthorityRule>(
    approvalRuleSelect + ' WHERE tenant_id = ? ORDER BY action_key, object_type, rule_key',
    [context.tenantId]
  );
}

export async function listApprovalAuthorityRuleVersions(context: CommandContext, ruleId: string) {
  assertPermission(context, 'reference.authority.read');
  await getApprovalRule(context, ruleId);
  return queryRows<RowDataPacket & ApprovalAuthorityRuleVersion>(
    approvalVersionSelect +
      ' WHERE tenant_id = ? AND approval_authority_rule_id = ? ORDER BY version_no DESC',
    [context.tenantId, ruleId]
  );
}

export async function listDelegatedAuthorityRules(context: CommandContext) {
  assertPermission(context, 'reference.authority.read');
  return queryRows<RowDataPacket & DelegatedAuthorityRule>(
    delegatedRuleSelect + ' WHERE tenant_id = ? ORDER BY authority_type, rule_key',
    [context.tenantId]
  );
}

export async function listDelegatedAuthorityRuleVersions(context: CommandContext, ruleId: string) {
  assertPermission(context, 'reference.authority.read');
  await getDelegatedRule(context, ruleId);
  return queryRows<RowDataPacket & DelegatedAuthorityRuleVersion>(
    delegatedVersionSelect +
      ' WHERE tenant_id = ? AND delegated_authority_rule_id = ? ORDER BY version_no DESC',
    [context.tenantId, ruleId]
  );
}

export async function createApprovalAuthorityRule(
  context: CommandContext,
  input: {
    ruleKey: string;
    actionKey: string;
    objectType: string;
    configuration: ApprovalAuthorityConfigurationInput;
  }
) {
  assertPermission(context, 'reference.authority.manage');
  const ruleKey = key(input.ruleKey, 'Approval authority rule key');
  const actionKey = key(input.actionKey, 'Approval action key');
  const objectType = key(input.objectType, 'Approval object type', 128);
  const requiredAuthorityType = key(
    input.configuration.requiredAuthorityType,
    'Required authority type'
  );
  const scopeType = input.configuration.scopeType?.trim()
    ? key(input.configuration.scopeType, 'Approval scope type', 64)
    : null;
  const scopeId = input.configuration.scopeId?.trim() || null;
  if (Boolean(scopeType) !== Boolean(scopeId)) {
    throw new Error('Approval scope type and scope ID must be supplied together.');
  }
  const band = money(
    input.configuration.currencyCode,
    input.configuration.minimumValue,
    input.configuration.maximumValue
  );
  const effective = effectiveRange(
    input.configuration.effectiveFrom,
    input.configuration.effectiveTo
  );

  return dbTransaction(async (connection) => {
    const id = randomUUID();
    const versionId = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO approval_authority_rules (id, tenant_id, rule_key, action_key, object_type, status, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'ACTIVE', 1, ?, ?)",
      [id, context.tenantId, ruleKey, actionKey, objectType, timestamp, timestamp],
      connection
    );
    await executeMutation(
      "INSERT INTO approval_authority_rule_versions (id, tenant_id, approval_authority_rule_id, version_no, status, scope_type, scope_id, currency_code, minimum_value, maximum_value, required_authority_type, effective_from, effective_to, published_at, created_by_party_id, created_at, updated_at) VALUES (?, ?, ?, 1, 'DRAFT', ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)",
      [
        versionId,
        context.tenantId,
        id,
        scopeType,
        scopeId,
        band.currencyCode,
        band.minimumValue,
        band.maximumValue,
        requiredAuthorityType,
        effective.effectiveFrom,
        effective.effectiveTo,
        context.actorPartyId,
        timestamp,
        timestamp
      ],
      connection
    );
    await evidence(
      context,
      id,
      1,
      'approval_authority_rule',
      id,
      'APPROVAL_AUTHORITY_RULE_CREATED',
      'ACTIVE',
      { ruleKey, actionKey, objectType, versionId, versionNo: 1, versionStatus: 'DRAFT' },
      connection
    );
    return { ruleId: id, versionId };
  });
}

export async function createDelegatedAuthorityRule(
  context: CommandContext,
  input: {
    ruleKey: string;
    authorityType: string;
    configuration: DelegatedAuthorityConfigurationInput;
  }
) {
  assertPermission(context, 'reference.authority.manage');
  const ruleKey = key(input.ruleKey, 'Delegated authority rule key');
  const authorityType = key(input.authorityType, 'Delegated authority type');
  const allowedScopeType = key(input.configuration.allowedScopeType, 'Allowed scope type', 64);
  const allowedScopeId = input.configuration.allowedScopeId?.trim() || null;
  const band = money(input.configuration.currencyCode, null, input.configuration.maximumValue);
  const maximumDurationDays = input.configuration.maximumDurationDays ?? null;
  if (
    maximumDurationDays != null &&
    (!Number.isInteger(maximumDurationDays) || maximumDurationDays < 1)
  ) {
    throw new Error('Maximum delegation duration must be a positive whole number of days.');
  }
  const effective = effectiveRange(
    input.configuration.effectiveFrom,
    input.configuration.effectiveTo
  );

  return dbTransaction(async (connection) => {
    const id = randomUUID();
    const versionId = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO delegated_authority_rules (id, tenant_id, rule_key, authority_type, status, version, created_at, updated_at) VALUES (?, ?, ?, ?, 'ACTIVE', 1, ?, ?)",
      [id, context.tenantId, ruleKey, authorityType, timestamp, timestamp],
      connection
    );
    await executeMutation(
      "INSERT INTO delegated_authority_rule_versions (id, tenant_id, delegated_authority_rule_id, version_no, status, allowed_scope_type, allowed_scope_id, currency_code, maximum_value, maximum_duration_days, allow_subdelegation, effective_from, effective_to, published_at, created_by_party_id, created_at, updated_at) VALUES (?, ?, ?, 1, 'DRAFT', ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)",
      [
        versionId,
        context.tenantId,
        id,
        allowedScopeType,
        allowedScopeId,
        band.currencyCode,
        band.maximumValue,
        maximumDurationDays,
        input.configuration.allowSubdelegation ? 1 : 0,
        effective.effectiveFrom,
        effective.effectiveTo,
        context.actorPartyId,
        timestamp,
        timestamp
      ],
      connection
    );
    await evidence(
      context,
      id,
      1,
      'delegated_authority_rule',
      id,
      'DELEGATED_AUTHORITY_RULE_CREATED',
      'ACTIVE',
      { ruleKey, authorityType, versionId, versionNo: 1, versionStatus: 'DRAFT' },
      connection
    );
    return { ruleId: id, versionId };
  });
}


export async function createApprovalAuthorityRuleVersion(
  context: CommandContext,
  ruleId: string,
  expectedRuleVersion: number,
  configuration: ApprovalAuthorityConfigurationInput
) {
  assertPermission(context, 'reference.authority.manage');
  const requiredAuthorityType = key(configuration.requiredAuthorityType, 'Required authority type');
  const scopeType = configuration.scopeType?.trim()
    ? key(configuration.scopeType, 'Approval scope type', 64)
    : null;
  const scopeId = configuration.scopeId?.trim() || null;
  if (Boolean(scopeType) !== Boolean(scopeId)) {
    throw new Error('Approval scope type and scope ID must be supplied together.');
  }
  const band = money(configuration.currencyCode, configuration.minimumValue, configuration.maximumValue);
  const effective = effectiveRange(configuration.effectiveFrom, configuration.effectiveTo);

  return dbTransaction(async (connection) => {
    const rule = await getApprovalRule(context, ruleId, connection, true);
    if (rule.version !== expectedRuleVersion) {
      throw new Error('This Approval Authority Rule changed after you opened it.');
    }
    const draft = await queryOne<RowDataPacket & { id: string }>(
      "SELECT id FROM approval_authority_rule_versions WHERE tenant_id = ? AND approval_authority_rule_id = ? AND status = 'DRAFT' LIMIT 1 FOR UPDATE",
      [context.tenantId, rule.id],
      connection
    );
    if (draft) throw new Error('Approval Authority Rule already has a draft version.');

    const maximum = await queryOne<RowDataPacket & { versionNo: number | null }>(
      'SELECT MAX(version_no) AS versionNo FROM approval_authority_rule_versions WHERE tenant_id = ? AND approval_authority_rule_id = ?',
      [context.tenantId, rule.id],
      connection
    );
    const versionNo = Number(maximum?.versionNo ?? 0) + 1;
    const versionId = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO approval_authority_rule_versions (id, tenant_id, approval_authority_rule_id, version_no, status, scope_type, scope_id, currency_code, minimum_value, maximum_value, required_authority_type, effective_from, effective_to, published_at, created_by_party_id, created_at, updated_at) VALUES (?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)",
      [
        versionId,
        context.tenantId,
        rule.id,
        versionNo,
        scopeType,
        scopeId,
        band.currencyCode,
        band.minimumValue,
        band.maximumValue,
        requiredAuthorityType,
        effective.effectiveFrom,
        effective.effectiveTo,
        context.actorPartyId,
        timestamp,
        timestamp
      ],
      connection
    );
    const updated = await bumpApprovalRule(context, rule, connection);
    await evidence(
      context,
      updated.id,
      updated.version,
      'approval_authority_rule_version',
      versionId,
      'APPROVAL_AUTHORITY_RULE_VERSION_CREATED',
      'DRAFT',
      { ruleId: rule.id, versionId, versionNo },
      connection
    );
    return versionId;
  });
}

export async function createDelegatedAuthorityRuleVersion(
  context: CommandContext,
  ruleId: string,
  expectedRuleVersion: number,
  configuration: DelegatedAuthorityConfigurationInput
) {
  assertPermission(context, 'reference.authority.manage');
  const allowedScopeType = key(configuration.allowedScopeType, 'Allowed scope type', 64);
  const allowedScopeId = configuration.allowedScopeId?.trim() || null;
  const band = money(configuration.currencyCode, null, configuration.maximumValue);
  const maximumDurationDays = configuration.maximumDurationDays ?? null;
  if (
    maximumDurationDays != null &&
    (!Number.isInteger(maximumDurationDays) || maximumDurationDays < 1)
  ) {
    throw new Error('Maximum delegation duration must be a positive whole number of days.');
  }
  const effective = effectiveRange(configuration.effectiveFrom, configuration.effectiveTo);

  return dbTransaction(async (connection) => {
    const rule = await getDelegatedRule(context, ruleId, connection, true);
    if (rule.version !== expectedRuleVersion) {
      throw new Error('This Delegated Authority Rule changed after you opened it.');
    }
    const draft = await queryOne<RowDataPacket & { id: string }>(
      "SELECT id FROM delegated_authority_rule_versions WHERE tenant_id = ? AND delegated_authority_rule_id = ? AND status = 'DRAFT' LIMIT 1 FOR UPDATE",
      [context.tenantId, rule.id],
      connection
    );
    if (draft) throw new Error('Delegated Authority Rule already has a draft version.');

    const maximum = await queryOne<RowDataPacket & { versionNo: number | null }>(
      'SELECT MAX(version_no) AS versionNo FROM delegated_authority_rule_versions WHERE tenant_id = ? AND delegated_authority_rule_id = ?',
      [context.tenantId, rule.id],
      connection
    );
    const versionNo = Number(maximum?.versionNo ?? 0) + 1;
    const versionId = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO delegated_authority_rule_versions (id, tenant_id, delegated_authority_rule_id, version_no, status, allowed_scope_type, allowed_scope_id, currency_code, maximum_value, maximum_duration_days, allow_subdelegation, effective_from, effective_to, published_at, created_by_party_id, created_at, updated_at) VALUES (?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)",
      [
        versionId,
        context.tenantId,
        rule.id,
        versionNo,
        allowedScopeType,
        allowedScopeId,
        band.currencyCode,
        band.maximumValue,
        maximumDurationDays,
        configuration.allowSubdelegation ? 1 : 0,
        effective.effectiveFrom,
        effective.effectiveTo,
        context.actorPartyId,
        timestamp,
        timestamp
      ],
      connection
    );
    const updated = await bumpDelegatedRule(context, rule, connection);
    await evidence(
      context,
      updated.id,
      updated.version,
      'delegated_authority_rule_version',
      versionId,
      'DELEGATED_AUTHORITY_RULE_VERSION_CREATED',
      'DRAFT',
      { ruleId: rule.id, versionId, versionNo },
      connection
    );
    return versionId;
  });
}

async function publishVersion(
  context: CommandContext,
  kind: 'APPROVAL' | 'DELEGATED',
  ruleId: string,
  versionId: string,
  expectedRuleVersion: number
) {
  assertPermission(context, 'reference.authority.publish');
  return dbTransaction(async (connection) => {
    const timestamp = now();

    if (kind === 'APPROVAL') {
      const rule = await getApprovalRule(context, ruleId, connection, true);
      if (rule.version !== expectedRuleVersion) {
        throw new Error('This Approval Authority Rule changed after you opened it.');
      }
      const version = await queryOne<RowDataPacket & ApprovalAuthorityRuleVersion>(
        approvalVersionSelect +
          ' WHERE id = ? AND approval_authority_rule_id = ? AND tenant_id = ? FOR UPDATE',
        [versionId, rule.id, context.tenantId],
        connection
      );
      if (!version) throw new Error('Approval Authority Rule Version not found.');
      if (version.status !== 'DRAFT') {
        throw new Error('Only a draft Approval Authority Rule version can be published.');
      }
      await executeMutation(
        "UPDATE approval_authority_rule_versions SET status = 'PUBLISHED', published_at = ?, updated_at = ? WHERE id = ? AND tenant_id = ? AND status = 'DRAFT'",
        [timestamp, timestamp, version.id, context.tenantId],
        connection
      );
      const updated = await bumpApprovalRule(context, rule, connection);
      await evidence(
        context,
        updated.id,
        updated.version,
        'approval_authority_rule_version',
        version.id,
        'APPROVAL_AUTHORITY_RULE_PUBLISHED',
        'PUBLISHED',
        { ruleId: rule.id, versionId: version.id, versionNo: version.versionNo },
        connection
      );
      return;
    }

    const rule = await getDelegatedRule(context, ruleId, connection, true);
    if (rule.version !== expectedRuleVersion) {
      throw new Error('This Delegated Authority Rule changed after you opened it.');
    }
    const version = await queryOne<RowDataPacket & DelegatedAuthorityRuleVersion>(
      delegatedVersionSelect +
        ' WHERE id = ? AND delegated_authority_rule_id = ? AND tenant_id = ? FOR UPDATE',
      [versionId, rule.id, context.tenantId],
      connection
    );
    if (!version) throw new Error('Delegated Authority Rule Version not found.');
    if (version.status !== 'DRAFT') {
      throw new Error('Only a draft Delegated Authority Rule version can be published.');
    }
    await executeMutation(
      "UPDATE delegated_authority_rule_versions SET status = 'PUBLISHED', published_at = ?, updated_at = ? WHERE id = ? AND tenant_id = ? AND status = 'DRAFT'",
      [timestamp, timestamp, version.id, context.tenantId],
      connection
    );
    const updated = await bumpDelegatedRule(context, rule, connection);
    await evidence(
      context,
      updated.id,
      updated.version,
      'delegated_authority_rule_version',
      version.id,
      'DELEGATED_AUTHORITY_RULE_PUBLISHED',
      'PUBLISHED',
      { ruleId: rule.id, versionId: version.id, versionNo: version.versionNo },
      connection
    );
  });
}

export async function publishApprovalAuthorityRuleVersion(
  context: CommandContext,
  ruleId: string,
  versionId: string,
  expectedRuleVersion: number
) {
  return publishVersion(context, 'APPROVAL', ruleId, versionId, expectedRuleVersion);
}

export async function publishDelegatedAuthorityRuleVersion(
  context: CommandContext,
  ruleId: string,
  versionId: string,
  expectedRuleVersion: number
) {
  return publishVersion(context, 'DELEGATED', ruleId, versionId, expectedRuleVersion);
}

export async function hasPublishedApprovalAuthorityPolicy(
  context: CommandContext,
  actionKeyValue: string,
  objectTypeValue: string,
  executor?: DbExecutor
) {
  const actionKey = key(actionKeyValue, 'Approval action key');
  const objectType = key(objectTypeValue, 'Approval object type', 128);
  const row = await queryOne<RowDataPacket & { id: string }>(
    `SELECT r.id
       FROM approval_authority_rules r
       JOIN approval_authority_rule_versions v
         ON v.approval_authority_rule_id = r.id
        AND v.tenant_id = r.tenant_id
      WHERE r.tenant_id = ?
        AND r.action_key = ?
        AND r.object_type = ?
        AND r.status = 'ACTIVE'
        AND v.status = 'PUBLISHED'
      LIMIT 1`,
    [context.tenantId, actionKey, objectType],
    executor
  );
  return Boolean(row);
}

export async function resolveApprovalAuthorityRequirement(
  context: CommandContext,
  input: {
    actionKey: string;
    objectType: string;
    scopeType?: string;
    scopeId?: string;
    currencyCode?: string;
    value?: number;
    at?: string;
  },
  executor?: DbExecutor
) {
  const actionKey = key(input.actionKey, 'Approval action key');
  const objectType = key(input.objectType, 'Approval object type', 128);
  const at = optionalTimestamp(input.at, 'Authority evaluation time') ?? now();
  const rows = await queryRows<
    RowDataPacket &
      ApprovalAuthorityRuleVersion & {
        ruleId: string;
        ruleKey: string;
        actionKey: string;
        objectType: string;
      }
  >(
    `SELECT r.id AS ruleId,
            r.rule_key AS ruleKey,
            r.action_key AS actionKey,
            r.object_type AS objectType,
            v.id,
            v.approval_authority_rule_id AS approvalAuthorityRuleId,
            v.version_no AS versionNo,
            v.status,
            v.scope_type AS scopeType,
            v.scope_id AS scopeId,
            v.currency_code AS currencyCode,
            v.minimum_value AS minimumValue,
            v.maximum_value AS maximumValue,
            v.required_authority_type AS requiredAuthorityType,
            v.effective_from AS effectiveFrom,
            v.effective_to AS effectiveTo,
            v.published_at AS publishedAt
       FROM approval_authority_rules r
       JOIN approval_authority_rule_versions v
         ON v.approval_authority_rule_id = r.id
        AND v.tenant_id = r.tenant_id
      WHERE r.tenant_id = ?
        AND r.action_key = ?
        AND r.object_type = ?
        AND r.status = 'ACTIVE'
        AND v.status = 'PUBLISHED'
        AND (v.effective_from IS NULL OR v.effective_from <= ?)
        AND (v.effective_to IS NULL OR v.effective_to > ?)
      ORDER BY (v.scope_type IS NOT NULL) DESC,
               (v.minimum_value IS NOT NULL OR v.maximum_value IS NOT NULL) DESC,
               v.version_no DESC`,
    [context.tenantId, actionKey, objectType, at, at],
    executor
  );

  const scopeType = input.scopeType?.trim().toUpperCase() || null;
  const scopeId = input.scopeId?.trim() || null;
  const currency = input.currencyCode?.trim().toUpperCase() || null;
  return (
    rows.find((row) => {
      if (row.scopeType && (row.scopeType !== scopeType || row.scopeId !== scopeId)) return false;
      const min = row.minimumValue == null ? null : Number(row.minimumValue);
      const max = row.maximumValue == null ? null : Number(row.maximumValue);
      if (min != null || max != null) {
        if (input.value == null || !currency || row.currencyCode !== currency) return false;
        if (min != null && input.value < min) return false;
        if (max != null && input.value > max) return false;
      }
      return true;
    }) ?? null
  );
}

export async function hasPublishedDelegatedAuthorityPolicy(
  context: CommandContext,
  authorityTypeValue: string,
  executor?: DbExecutor
) {
  const authorityType = key(authorityTypeValue, 'Delegated authority type');
  const row = await queryOne<RowDataPacket & { id: string }>(
    `SELECT r.id
       FROM delegated_authority_rules r
       JOIN delegated_authority_rule_versions v
         ON v.delegated_authority_rule_id = r.id
        AND v.tenant_id = r.tenant_id
      WHERE r.tenant_id = ?
        AND r.authority_type = ?
        AND r.status = 'ACTIVE'
        AND v.status = 'PUBLISHED'
      LIMIT 1`,
    [context.tenantId, authorityType],
    executor
  );
  return Boolean(row);
}

export async function resolveDelegatedAuthorityPolicy(
  context: CommandContext,
  input: {
    authorityType: string;
    scopeType: string;
    scopeId: string;
    currencyCode?: string;
    value?: number;
    durationDays?: number;
    allowSubdelegation?: boolean;
    at?: string;
  },
  executor?: DbExecutor
) {
  const authorityType = key(input.authorityType, 'Delegated authority type');
  const scopeType = key(input.scopeType, 'Delegated authority scope type', 64);
  const scopeId = required(input.scopeId, 'Delegated authority scope ID');
  const at = optionalTimestamp(input.at, 'Authority evaluation time') ?? now();
  const rows = await queryRows<
    RowDataPacket &
      DelegatedAuthorityRuleVersion & {
        ruleId: string;
        ruleKey: string;
        authorityType: string;
      }
  >(
    `SELECT r.id AS ruleId,
            r.rule_key AS ruleKey,
            r.authority_type AS authorityType,
            v.id,
            v.delegated_authority_rule_id AS delegatedAuthorityRuleId,
            v.version_no AS versionNo,
            v.status,
            v.allowed_scope_type AS allowedScopeType,
            v.allowed_scope_id AS allowedScopeId,
            v.currency_code AS currencyCode,
            v.maximum_value AS maximumValue,
            v.maximum_duration_days AS maximumDurationDays,
            v.allow_subdelegation AS allowSubdelegation,
            v.effective_from AS effectiveFrom,
            v.effective_to AS effectiveTo,
            v.published_at AS publishedAt
       FROM delegated_authority_rules r
       JOIN delegated_authority_rule_versions v
         ON v.delegated_authority_rule_id = r.id
        AND v.tenant_id = r.tenant_id
      WHERE r.tenant_id = ?
        AND r.authority_type = ?
        AND r.status = 'ACTIVE'
        AND v.status = 'PUBLISHED'
        AND v.allowed_scope_type = ?
        AND (v.allowed_scope_id IS NULL OR v.allowed_scope_id = ?)
        AND (v.effective_from IS NULL OR v.effective_from <= ?)
        AND (v.effective_to IS NULL OR v.effective_to > ?)
      ORDER BY (v.allowed_scope_id IS NOT NULL) DESC, v.version_no DESC`,
    [context.tenantId, authorityType, scopeType, scopeId, at, at],
    executor
  );

  const currency = input.currencyCode?.trim().toUpperCase() || null;
  return (
    rows.find((row) => {
      const max = row.maximumValue == null ? null : Number(row.maximumValue);
      if (max != null) {
        if (input.value == null || !currency || row.currencyCode !== currency) return false;
        if (input.value > max) return false;
      }
      if (row.maximumDurationDays != null) {
        if (input.durationDays == null) return false;
        if (input.durationDays > Number(row.maximumDurationDays)) return false;
      }
      if (input.allowSubdelegation && !row.allowSubdelegation) return false;
      return true;
    }) ?? null
  );
}
