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
import { assertWorkDecisionReference } from '$lib/server/work-decision';

export type AuthorityFrameworkRuleInput = {
  ruleKey: string;
  ruleType: 'AUTHORITY_CLASS' | 'DECISION_RIGHT' | 'RESERVED_MATTER' | 'SOD';
  actionType?: string;
  authorityClass?: string;
  scopeType?: string;
  scopeId?: string;
  currencyCode?: string;
  minimumValue?: number | null;
  maximumValue?: number | null;
  reservedMatter?: boolean;
  allowDelegation?: boolean;
  allowSubdelegation?: boolean;
  incompatibleRoleKey?: string;
  description: string;
  sortOrder?: number;
};

export type AuthorityFramework = {
  id: string;
  frameworkRef: string;
  name: string;
  scopeType: string | null;
  scopeId: string | null;
  status: string;
  aggregateVersion: number;
  currentVersionNo: number;
  activeVersionNo: number | null;
  updatedAt: string;
};
export type AuthorityFrameworkVersion = {
  id: string;
  frameworkId: string;
  versionNo: number;
  purpose: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  lifecycleStatus: string;
  approvalDecisionId: string | null;
  createdByPartyId: string;
  createdAt: string;
};
export type AuthorityFrameworkRule = {
  id: string;
  frameworkId: string;
  frameworkVersionNo: number;
  ruleKey: string;
  ruleType: string;
  actionType: string | null;
  authorityClass: string | null;
  scopeType: string | null;
  scopeId: string | null;
  currencyCode: string | null;
  minimumValue: string | null;
  maximumValue: string | null;
  reservedMatter: number;
  allowDelegation: number;
  allowSubdelegation: number;
  incompatibleRoleKey: string | null;
  description: string;
  sortOrder: number;
};

const now = () => new Date().toISOString();
function required(v: string, l: string) {
  const c = v.trim();
  if (!c) throw new Error(l + ' is required.');
  return c;
}
function code(v: string, l: string, max = 191) {
  const c = required(v, l).toUpperCase();
  if (c.length > max || !/^[A-Z0-9][A-Z0-9._:-]*$/.test(c))
    throw new Error(l + ' contains unsupported characters.');
  return c;
}
function scope(t?: string, i?: string) {
  const type = t?.trim() ? code(t, 'Framework scope type', 64) : null;
  const id = i?.trim() || null;
  if (Boolean(type) !== Boolean(id))
    throw new Error('Framework scope type and scope ID must be supplied together.');
  return { scopeType: type, scopeId: id };
}
function effectivity(f?: string, t?: string) {
  const p = (v: string | undefined, l: string) => {
    if (!v?.trim()) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) throw new Error(l + ' is invalid.');
    return d.toISOString();
  };
  const effectiveFrom = p(f, 'Authority Framework effective-from');
  const effectiveTo = p(t, 'Authority Framework effective-to');
  if (effectiveFrom && effectiveTo && effectiveTo <= effectiveFrom)
    throw new Error('Authority Framework effective-to must be later than effective-from.');
  return { effectiveFrom, effectiveTo };
}

function normalizeRule(input: AuthorityFrameworkRuleInput) {
  const ruleKey = code(input.ruleKey, 'Authority Framework rule key');
  const ruleType = code(input.ruleType, 'Authority Framework rule type', 64);
  if (!['AUTHORITY_CLASS', 'DECISION_RIGHT', 'RESERVED_MATTER', 'SOD'].includes(ruleType))
    throw new Error('Unsupported Authority Framework rule type.');
  const scoped = scope(input.scopeType, input.scopeId);
  const min = input.minimumValue ?? null,
    max = input.maximumValue ?? null;
  if (min != null && (!Number.isFinite(min) || min < 0))
    throw new Error('Minimum value must be non-negative.');
  if (max != null && (!Number.isFinite(max) || max < 0))
    throw new Error('Maximum value must be non-negative.');
  if (min != null && max != null && max < min)
    throw new Error('Maximum value must be greater than or equal to minimum value.');
  let currencyCode: string | null = null;
  if (min != null || max != null) {
    currencyCode = required(input.currencyCode ?? '', 'Currency code').toUpperCase();
    if (!/^[A-Z]{3}$/.test(currencyCode))
      throw new Error('Currency code must contain three letters.');
  }
  const incompatibleRoleKey = input.incompatibleRoleKey?.trim()
    ? code(input.incompatibleRoleKey, 'Incompatible role key')
    : null;
  if (ruleType === 'SOD' && !incompatibleRoleKey)
    throw new Error('SoD rules require an incompatible role key.');
  if (ruleType !== 'SOD' && incompatibleRoleKey)
    throw new Error('Only SoD rules may define an incompatible role key.');
  return {
    ruleKey,
    ruleType,
    actionType: input.actionType?.trim() ? code(input.actionType, 'Action type') : null,
    authorityClass: input.authorityClass?.trim()
      ? code(input.authorityClass, 'Authority class')
      : null,
    ...scoped,
    currencyCode,
    minimumValue: min,
    maximumValue: max,
    reservedMatter: Boolean(input.reservedMatter) || ruleType === 'RESERVED_MATTER',
    allowDelegation: Boolean(input.allowDelegation),
    allowSubdelegation: Boolean(input.allowSubdelegation),
    incompatibleRoleKey,
    description: required(input.description, 'Authority Framework rule description'),
    sortOrder: Number.isInteger(input.sortOrder) ? input.sortOrder! : 0
  };
}
async function getFramework(c: CommandContext, id: string, e?: DbExecutor, lock = false) {
  const r = await queryOne<RowDataPacket & AuthorityFramework>(
    'SELECT id, framework_ref AS frameworkRef, name, scope_type AS scopeType, scope_id AS scopeId, status, aggregate_version AS aggregateVersion, current_version_no AS currentVersionNo, active_version_no AS activeVersionNo, updated_at AS updatedAt FROM authority_frameworks WHERE id = ? AND tenant_id = ?' +
      (lock ? ' FOR UPDATE' : ''),
    [id, c.tenantId],
    e
  );
  if (!r) throw new Error('Authority Framework not found.');
  return r;
}
async function getVersion(c: CommandContext, id: string, v: number, e?: DbExecutor, lock = false) {
  const r = await queryOne<RowDataPacket & AuthorityFrameworkVersion>(
    'SELECT id, framework_id AS frameworkId, version_no AS versionNo, purpose, effective_from AS effectiveFrom, effective_to AS effectiveTo, lifecycle_status AS lifecycleStatus, approval_decision_id AS approvalDecisionId, created_by_party_id AS createdByPartyId, created_at AS createdAt FROM authority_framework_versions WHERE tenant_id = ? AND framework_id = ? AND version_no = ?' +
      (lock ? ' FOR UPDATE' : ''),
    [c.tenantId, id, v],
    e
  );
  if (!r) throw new Error('Authority Framework Version not found.');
  return r;
}
async function ev(
  c: CommandContext,
  f: AuthorityFramework,
  type: string,
  from: string | null,
  to: string,
  p: Record<string, unknown>,
  e: DbExecutor
) {
  await recordPlatformAudit(
    c,
    {
      aggregateId: 'AGG-02-AUTHORITY-FRAMEWORK',
      objectType: 'authority_framework',
      objectId: f.id,
      action: type,
      fromState: from ?? undefined,
      toState: to
    },
    e
  );
  await emitBusinessEvent(
    c,
    {
      aggregateId: 'AGG-02-AUTHORITY-FRAMEWORK',
      aggregateType: 'AuthorityFramework',
      aggregateObjectId: f.id,
      aggregateVersion: f.aggregateVersion,
      eventType: type,
      topic: 'nublox.governance.authority-framework',
      payload: p
    },
    e
  );
}
async function insertRules(
  c: CommandContext,
  id: string,
  v: number,
  rules: AuthorityFrameworkRuleInput[],
  e: DbExecutor
) {
  const seen = new Set<string>();
  for (const x of rules) {
    const r = normalizeRule(x);
    if (seen.has(r.ruleKey))
      throw new Error('Authority Framework rule keys must be unique within a version.');
    seen.add(r.ruleKey);
    await executeMutation(
      'INSERT INTO authority_framework_rules (id, tenant_id, framework_id, framework_version_no, rule_key, rule_type, action_type, authority_class, scope_type, scope_id, currency_code, minimum_value, maximum_value, reserved_matter, allow_delegation, allow_subdelegation, incompatible_role_key, description, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        randomUUID(),
        c.tenantId,
        id,
        v,
        r.ruleKey,
        r.ruleType,
        r.actionType,
        r.authorityClass,
        r.scopeType,
        r.scopeId,
        r.currencyCode,
        r.minimumValue,
        r.maximumValue,
        r.reservedMatter ? 1 : 0,
        r.allowDelegation ? 1 : 0,
        r.allowSubdelegation ? 1 : 0,
        r.incompatibleRoleKey,
        r.description,
        r.sortOrder,
        now()
      ],
      e
    );
  }
}

export async function listAuthorityFrameworks(c: CommandContext) {
  assertPermission(c, 'governance.framework.read');
  return queryRows<RowDataPacket & AuthorityFramework>(
    'SELECT id, framework_ref AS frameworkRef, name, scope_type AS scopeType, scope_id AS scopeId, status, aggregate_version AS aggregateVersion, current_version_no AS currentVersionNo, active_version_no AS activeVersionNo, updated_at AS updatedAt FROM authority_frameworks WHERE tenant_id = ? ORDER BY updated_at DESC, framework_ref',
    [c.tenantId]
  );
}
export async function listAuthorityFrameworkVersions(c: CommandContext, id: string) {
  assertPermission(c, 'governance.framework.read');
  await getFramework(c, id);
  return queryRows<RowDataPacket & AuthorityFrameworkVersion>(
    'SELECT id, framework_id AS frameworkId, version_no AS versionNo, purpose, effective_from AS effectiveFrom, effective_to AS effectiveTo, lifecycle_status AS lifecycleStatus, approval_decision_id AS approvalDecisionId, created_by_party_id AS createdByPartyId, created_at AS createdAt FROM authority_framework_versions WHERE tenant_id = ? AND framework_id = ? ORDER BY version_no DESC',
    [c.tenantId, id]
  );
}
export async function listAuthorityFrameworkRules(c: CommandContext, id: string, v: number) {
  assertPermission(c, 'governance.framework.read');
  await getVersion(c, id, v);
  return queryRows<RowDataPacket & AuthorityFrameworkRule>(
    'SELECT id, framework_id AS frameworkId, framework_version_no AS frameworkVersionNo, rule_key AS ruleKey, rule_type AS ruleType, action_type AS actionType, authority_class AS authorityClass, scope_type AS scopeType, scope_id AS scopeId, currency_code AS currencyCode, minimum_value AS minimumValue, maximum_value AS maximumValue, reserved_matter AS reservedMatter, allow_delegation AS allowDelegation, allow_subdelegation AS allowSubdelegation, incompatible_role_key AS incompatibleRoleKey, description, sort_order AS sortOrder FROM authority_framework_rules WHERE tenant_id = ? AND framework_id = ? AND framework_version_no = ? ORDER BY sort_order, rule_key',
    [c.tenantId, id, v]
  );
}

export async function createAuthorityFramework(
  c: CommandContext,
  input: {
    frameworkRef: string;
    name: string;
    scopeType?: string;
    scopeId?: string;
    purpose: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    rules: AuthorityFrameworkRuleInput[];
  }
) {
  assertPermission(c, 'governance.framework.manage');
  const ref = code(input.frameworkRef, 'Authority Framework reference'),
    sc = scope(input.scopeType, input.scopeId),
    ef = effectivity(input.effectiveFrom, input.effectiveTo);
  if (!input.rules.length) throw new Error('Authority Framework requires at least one rule.');
  return dbTransaction(async (e) => {
    const id = randomUUID(),
      ts = now();
    await executeMutation(
      "INSERT INTO authority_frameworks (id, tenant_id, framework_ref, name, scope_type, scope_id, status, aggregate_version, current_version_no, active_version_no, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', 1, 1, NULL, ?, ?)",
      [
        id,
        c.tenantId,
        ref,
        required(input.name, 'Authority Framework name'),
        sc.scopeType,
        sc.scopeId,
        ts,
        ts
      ],
      e
    );
    await executeMutation(
      "INSERT INTO authority_framework_versions (id, tenant_id, framework_id, version_no, purpose, effective_from, effective_to, lifecycle_status, approval_decision_id, created_by_party_id, created_at) VALUES (?, ?, ?, 1, ?, ?, ?, 'DRAFT', NULL, ?, ?)",
      [
        randomUUID(),
        c.tenantId,
        id,
        required(input.purpose, 'Authority Framework purpose'),
        ef.effectiveFrom,
        ef.effectiveTo,
        c.actorPartyId,
        ts
      ],
      e
    );
    await insertRules(c, id, 1, input.rules, e);
    const created = await getFramework(c, id, e);
    await ev(
      c,
      created,
      'AUTHORITY_FRAMEWORK_CREATED',
      null,
      'DRAFT',
      { frameworkRef: ref, versionNo: 1, ruleCount: input.rules.length },
      e
    );
    return id;
  });
}

export async function reviseAuthorityFramework(
  c: CommandContext,
  id: string,
  expected: number,
  input: {
    name: string;
    purpose: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    rules: AuthorityFrameworkRuleInput[];
  }
) {
  assertPermission(c, 'governance.framework.manage');
  const ef = effectivity(input.effectiveFrom, input.effectiveTo);
  if (!input.rules.length) throw new Error('Authority Framework requires at least one rule.');
  return dbTransaction(async (e) => {
    const cur = await getFramework(c, id, e, true);
    if (cur.aggregateVersion !== expected)
      throw new Error('This Authority Framework changed after you opened it.');
    if (!['DRAFT', 'APPROVED', 'ACTIVE'].includes(cur.status))
      throw new Error('Authority Framework cannot be revised in its current state.');
    const next = cur.currentVersionNo + 1,
      ts = now();
    await executeMutation(
      "INSERT INTO authority_framework_versions (id, tenant_id, framework_id, version_no, purpose, effective_from, effective_to, lifecycle_status, approval_decision_id, created_by_party_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'DRAFT', NULL, ?, ?)",
      [
        randomUUID(),
        c.tenantId,
        cur.id,
        next,
        required(input.purpose, 'Authority Framework purpose'),
        ef.effectiveFrom,
        ef.effectiveTo,
        c.actorPartyId,
        ts
      ],
      e
    );
    await insertRules(c, cur.id, next, input.rules, e);
    const r = await executeMutation(
      "UPDATE authority_frameworks SET name = ?, status = 'DRAFT', aggregate_version = aggregate_version + 1, current_version_no = ?, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?",
      [required(input.name, 'Authority Framework name'), next, ts, cur.id, c.tenantId, expected],
      e
    );
    if (r.affectedRows !== 1) throw new Error('Concurrent Authority Framework change detected.');
    const u = await getFramework(c, cur.id, e);
    await ev(
      c,
      u,
      'AUTHORITY_FRAMEWORK_REVISED',
      cur.status,
      'DRAFT',
      { versionNo: next, ruleCount: input.rules.length },
      e
    );
    return next;
  });
}
export async function submitAuthorityFramework(c: CommandContext, id: string, expected: number) {
  assertPermission(c, 'governance.framework.manage');
  return dbTransaction(async (e) => {
    const cur = await getFramework(c, id, e, true);
    if (cur.aggregateVersion !== expected)
      throw new Error('This Authority Framework changed after you opened it.');
    if (cur.status !== 'DRAFT')
      throw new Error('Only a draft Authority Framework can be submitted.');
    await executeMutation(
      "UPDATE authority_framework_versions SET lifecycle_status = 'IN_REVIEW' WHERE framework_id = ? AND version_no = ? AND lifecycle_status = 'DRAFT'",
      [cur.id, cur.currentVersionNo],
      e
    );
    await executeMutation(
      "UPDATE authority_frameworks SET status = 'IN_REVIEW', aggregate_version = aggregate_version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?",
      [now(), cur.id, c.tenantId, expected],
      e
    );
    const u = await getFramework(c, cur.id, e);
    await ev(
      c,
      u,
      'AUTHORITY_FRAMEWORK_SUBMITTED',
      'DRAFT',
      'IN_REVIEW',
      { versionNo: cur.currentVersionNo },
      e
    );
  });
}
export async function approveAuthorityFramework(
  c: CommandContext,
  id: string,
  expected: number,
  decisionId: string
) {
  assertPermission(c, 'governance.framework.approve');
  return dbTransaction(async (e) => {
    const cur = await getFramework(c, id, e, true);
    if (cur.aggregateVersion !== expected)
      throw new Error('This Authority Framework changed after you opened it.');
    if (cur.status !== 'IN_REVIEW')
      throw new Error('Only an in-review Authority Framework can be approved.');
    const d = await assertWorkDecisionReference(
      c,
      {
        decisionId,
        decisionType: 'AUTHORITY_FRAMEWORK_REVIEW',
        subjectType: 'AUTHORITY_FRAMEWORK',
        subjectId: cur.id,
        subjectVersion: String(cur.currentVersionNo),
        outcome: 'APPROVED'
      },
      e
    );
    await executeMutation(
      "UPDATE authority_framework_versions SET lifecycle_status = 'APPROVED', approval_decision_id = ? WHERE framework_id = ? AND version_no = ? AND lifecycle_status = 'IN_REVIEW'",
      [d.id, cur.id, cur.currentVersionNo],
      e
    );
    await executeMutation(
      "UPDATE authority_frameworks SET status = 'APPROVED', aggregate_version = aggregate_version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?",
      [now(), cur.id, c.tenantId, expected],
      e
    );
    const u = await getFramework(c, cur.id, e);
    await ev(
      c,
      u,
      'AUTHORITY_FRAMEWORK_APPROVED',
      'IN_REVIEW',
      'APPROVED',
      { versionNo: cur.currentVersionNo, decisionId: d.id },
      e
    );
  });
}
export async function activateAuthorityFramework(c: CommandContext, id: string, expected: number) {
  assertPermission(c, 'governance.framework.approve');
  return dbTransaction(async (e) => {
    const cur = await getFramework(c, id, e, true);
    if (cur.aggregateVersion !== expected)
      throw new Error('This Authority Framework changed after you opened it.');
    if (cur.status !== 'APPROVED')
      throw new Error('Only an approved Authority Framework can be activated.');
    const v = await getVersion(c, cur.id, cur.currentVersionNo, e, true);
    if (cur.activeVersionNo && cur.activeVersionNo !== cur.currentVersionNo)
      await executeMutation(
        "UPDATE authority_framework_versions SET lifecycle_status = 'SUPERSEDED' WHERE framework_id = ? AND version_no = ? AND lifecycle_status = 'ACTIVE'",
        [cur.id, cur.activeVersionNo],
        e
      );
    await executeMutation(
      "UPDATE authority_framework_versions SET lifecycle_status = 'ACTIVE' WHERE framework_id = ? AND version_no = ? AND lifecycle_status = 'APPROVED'",
      [cur.id, v.versionNo],
      e
    );
    await executeMutation(
      "UPDATE authority_frameworks SET status = 'ACTIVE', active_version_no = ?, aggregate_version = aggregate_version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?",
      [v.versionNo, now(), cur.id, c.tenantId, expected],
      e
    );
    const u = await getFramework(c, cur.id, e);
    await ev(
      c,
      u,
      'AUTHORITY_FRAMEWORK_ACTIVATED',
      'APPROVED',
      'ACTIVE',
      { versionNo: v.versionNo },
      e
    );
  });
}
