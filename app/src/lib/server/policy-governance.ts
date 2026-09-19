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
  addInformationRepresentation,
  approveInformationRevision,
  createInformationContainerInTransaction,
  createSuccessorInformationRevisionInTransaction,
  issueInformationRevision,
  listInformationRepresentations,
  submitInformationRevision,
  type InformationRepresentation
} from '$lib/server/information-container';

export type Policy = {
  id: string;
  policyRef: string;
  title: string;
  policyType: string;
  originatorPartyId: string;
  originatorDisplayName: string;
  status: string;
  aggregateVersion: number;
  currentRevisionNo: number;
  currentRevisionId: string;
  currentRevisionCode: string;
  currentLifecycleStatus: string;
  ownerPartyId: string;
  ownerDisplayName: string;
  governanceBodyId: string | null;
  governanceBodyName: string | null;
  applicabilitySummary: string;
  scopeType: string | null;
  scopeId: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  reviewDueAt: string | null;
  attestationRequired: number;
  updatedAt: string;
};

export type PolicyRevision = {
  informationRevisionId: string;
  containerId: string;
  revisionNo: number;
  revisionCode: string;
  title: string;
  purposeOfIssue: string | null;
  suitabilityCode: string | null;
  lifecycleStatus: string;
  approvalDecisionId: string | null;
  approvedAt: string | null;
  issuedAt: string | null;
  supersedesRevisionId: string | null;
  ownerPartyId: string;
  ownerDisplayName: string;
  governanceBodyId: string | null;
  governanceBodyName: string | null;
  applicabilitySummary: string;
  scopeType: string | null;
  scopeId: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  reviewDueAt: string | null;
  attestationRequired: number;
  createdAt: string;
};

export type PolicyRevisionProfileInput = {
  ownerPartyId?: string;
  governanceBodyId?: string;
  applicabilitySummary: string;
  scopeType?: string;
  scopeId?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  reviewDueAt?: string;
  attestationRequired?: boolean;
};

export type CreatePolicyInput = PolicyRevisionProfileInput & {
  policyRef: string;
  policyType: string;
  title: string;
  classificationCode?: string;
  securityClassification?: string;
  revisionCode?: string;
  purposeOfIssue?: string;
  suitabilityCode?: string;
};

export type CreateSuccessorPolicyRevisionInput = Partial<PolicyRevisionProfileInput> & {
  revisionCode: string;
  title?: string;
  purposeOfIssue?: string;
  suitabilityCode?: string;
};

const policySelect = `
  SELECT c.id,
         c.container_ref AS policyRef,
         c.title,
         pp.policy_type AS policyType,
         c.originator_party_id AS originatorPartyId,
         originator.display_name AS originatorDisplayName,
         c.status,
         c.aggregate_version AS aggregateVersion,
         c.current_revision_no AS currentRevisionNo,
         r.id AS currentRevisionId,
         r.revision_code AS currentRevisionCode,
         r.lifecycle_status AS currentLifecycleStatus,
         pr.owner_party_id AS ownerPartyId,
         owner.display_name AS ownerDisplayName,
         pr.governance_body_id AS governanceBodyId,
         gb.name AS governanceBodyName,
         pr.applicability_summary AS applicabilitySummary,
         pr.scope_type AS scopeType,
         pr.scope_id AS scopeId,
         pr.effective_from AS effectiveFrom,
         pr.effective_to AS effectiveTo,
         pr.review_due_at AS reviewDueAt,
         pr.attestation_required AS attestationRequired,
         c.updated_at AS updatedAt
    FROM information_containers c
    JOIN policy_profiles pp
      ON pp.information_container_id = c.id
     AND pp.tenant_id = c.tenant_id
    JOIN information_revisions r
      ON r.container_id = c.id
     AND r.revision_no = c.current_revision_no
     AND r.tenant_id = c.tenant_id
    JOIN policy_revision_profiles pr
      ON pr.information_revision_id = r.id
     AND pr.information_container_id = c.id
     AND pr.tenant_id = c.tenant_id
    JOIN parties originator ON originator.id = c.originator_party_id
    JOIN parties owner ON owner.id = pr.owner_party_id
    LEFT JOIN governance_bodies gb ON gb.id = pr.governance_body_id
`;

const revisionSelect = `
  SELECT r.id AS informationRevisionId,
         r.container_id AS containerId,
         r.revision_no AS revisionNo,
         r.revision_code AS revisionCode,
         r.title,
         r.purpose_of_issue AS purposeOfIssue,
         r.suitability_code AS suitabilityCode,
         r.lifecycle_status AS lifecycleStatus,
         r.approval_decision_id AS approvalDecisionId,
         r.approved_at AS approvedAt,
         r.issued_at AS issuedAt,
         r.supersedes_revision_id AS supersedesRevisionId,
         pr.owner_party_id AS ownerPartyId,
         owner.display_name AS ownerDisplayName,
         pr.governance_body_id AS governanceBodyId,
         gb.name AS governanceBodyName,
         pr.applicability_summary AS applicabilitySummary,
         pr.scope_type AS scopeType,
         pr.scope_id AS scopeId,
         pr.effective_from AS effectiveFrom,
         pr.effective_to AS effectiveTo,
         pr.review_due_at AS reviewDueAt,
         pr.attestation_required AS attestationRequired,
         r.created_at AS createdAt
    FROM information_revisions r
    JOIN policy_revision_profiles pr
      ON pr.information_revision_id = r.id
     AND pr.information_container_id = r.container_id
     AND pr.tenant_id = r.tenant_id
    JOIN parties owner ON owner.id = pr.owner_party_id
    LEFT JOIN governance_bodies gb ON gb.id = pr.governance_body_id
`;

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

function optionalCode(value: string | undefined, label: string, max = 191) {
  return value?.trim() ? code(value, label, max) : null;
}

function scope(type?: string, id?: string) {
  const scopeType = type?.trim() ? code(type, 'Policy applicability scope type', 64) : null;
  const scopeId = id?.trim() || null;
  if (Boolean(scopeType) !== Boolean(scopeId)) {
    throw new Error('Policy applicability scope type and scope ID must be supplied together.');
  }
  return { scopeType, scopeId };
}

function optionalDate(value: string | undefined, label: string) {
  if (!value?.trim()) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(label + ' is invalid.');
  return parsed.toISOString();
}

function dates(input: {
  effectiveFrom?: string;
  effectiveTo?: string;
  reviewDueAt?: string;
}) {
  const effectiveFrom = optionalDate(input.effectiveFrom, 'Policy effective-from');
  const effectiveTo = optionalDate(input.effectiveTo, 'Policy effective-to');
  const reviewDueAt = optionalDate(input.reviewDueAt, 'Policy review due date');
  if (effectiveFrom && effectiveTo && effectiveTo <= effectiveFrom) {
    throw new Error('Policy effective-to must be later than effective-from.');
  }
  if (effectiveFrom && reviewDueAt && reviewDueAt < effectiveFrom) {
    throw new Error('Policy review due date cannot be earlier than effective-from.');
  }
  return { effectiveFrom, effectiveTo, reviewDueAt };
}

async function activeParty(context: CommandContext, partyId: string, executor: DbExecutor) {
  const party = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM parties WHERE id = ? AND tenant_id = ? AND status = 'ACTIVE'",
    [partyId, context.tenantId],
    executor
  );
  if (!party) throw new Error('Active Policy owner Party not found.');
}

async function activeGovernanceBody(
  context: CommandContext,
  bodyId: string | null,
  executor: DbExecutor
) {
  if (!bodyId) return;
  const body = await queryOne<RowDataPacket & { id: string; status: string }>(
    'SELECT id, status FROM governance_bodies WHERE id = ? AND tenant_id = ?',
    [bodyId, context.tenantId],
    executor
  );
  if (!body || !['CONSTITUTED', 'ACTIVE'].includes(body.status)) {
    throw new Error('Policy governance body must be constituted or active.');
  }
}

async function currentRevision(
  context: CommandContext,
  containerId: string,
  revisionNo: number,
  executor: DbExecutor
) {
  const revision = await queryOne<RowDataPacket & { id: string; lifecycleStatus: string }>(
    'SELECT id, lifecycle_status AS lifecycleStatus FROM information_revisions WHERE tenant_id = ? AND container_id = ? AND revision_no = ?',
    [context.tenantId, containerId, revisionNo],
    executor
  );
  if (!revision) throw new Error('Policy Information Revision not found.');
  return revision;
}

async function profileEvidence(
  context: CommandContext,
  policy: Policy,
  eventType: string,
  payload: Record<string, unknown>,
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-02-POLICY',
      objectType: 'policy_profile',
      objectId: policy.id,
      action: eventType,
      toState: policy.currentLifecycleStatus
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: 'AGG-02-POLICY',
      aggregateType: 'Policy',
      aggregateObjectId: policy.id,
      aggregateVersion: policy.aggregateVersion,
      eventType,
      topic: 'nublox.governance.policy',
      payload
    },
    executor
  );
}

async function getPolicy(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  lock = false
) {
  const row = await queryOne<RowDataPacket & Policy>(
    policySelect + ' WHERE c.id = ? AND c.tenant_id = ? AND c.container_type = \'POLICY\'' + (lock ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Policy not found.');
  return row;
}

async function insertRevisionProfile(
  context: CommandContext,
  containerId: string,
  revisionNo: number,
  input: PolicyRevisionProfileInput,
  executor: DbExecutor
) {
  const ownerPartyId = input.ownerPartyId?.trim() || context.actorPartyId;
  const governanceBodyId = input.governanceBodyId?.trim() || null;
  const scoped = scope(input.scopeType, input.scopeId);
  const effectivity = dates(input);
  await activeParty(context, ownerPartyId, executor);
  await activeGovernanceBody(context, governanceBodyId, executor);
  const revision = await currentRevision(context, containerId, revisionNo, executor);
  await executeMutation(
    `INSERT INTO policy_revision_profiles
      (information_revision_id, tenant_id, information_container_id, revision_no,
       owner_party_id, governance_body_id, applicability_summary, scope_type, scope_id,
       effective_from, effective_to, review_due_at, attestation_required, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      revision.id,
      context.tenantId,
      containerId,
      revisionNo,
      ownerPartyId,
      governanceBodyId,
      required(input.applicabilitySummary, 'Policy applicability summary'),
      scoped.scopeType,
      scoped.scopeId,
      effectivity.effectiveFrom,
      effectivity.effectiveTo,
      effectivity.reviewDueAt,
      input.attestationRequired ? 1 : 0,
      now()
    ],
    executor
  );
}

export async function listPolicies(context: CommandContext): Promise<Policy[]> {
  assertPermission(context, 'information.container.read');
  return queryRows<RowDataPacket & Policy>(
    policySelect +
      " WHERE c.tenant_id = ? AND c.container_type = 'POLICY' ORDER BY c.updated_at DESC, c.container_ref",
    [context.tenantId]
  );
}

export async function listPolicyRevisions(
  context: CommandContext,
  policyId: string
): Promise<PolicyRevision[]> {
  assertPermission(context, 'information.container.read');
  await getPolicy(context, policyId);
  return queryRows<RowDataPacket & PolicyRevision>(
    revisionSelect +
      ' WHERE r.tenant_id = ? AND r.container_id = ? ORDER BY r.revision_no DESC',
    [context.tenantId, policyId]
  );
}

export async function listPolicyRepresentations(
  context: CommandContext,
  informationRevisionId: string
): Promise<InformationRepresentation[]> {
  return listInformationRepresentations(context, informationRevisionId);
}

export async function createPolicy(context: CommandContext, input: CreatePolicyInput) {
  assertPermission(context, 'information.container.manage');
  const policyType = code(input.policyType, 'Policy type', 64);
  const scoped = scope(input.scopeType, input.scopeId);
  const effectiveScope = scoped.scopeType
    ? scoped
    : { scopeType: 'TENANT', scopeId: context.tenantId };

  return dbTransaction(async (executor) => {
    const id = await createInformationContainerInTransaction(
      context,
      {
        containerRef: input.policyRef,
        containerType: 'POLICY',
        title: input.title,
        originatorPartyId: input.ownerPartyId?.trim() || context.actorPartyId,
        subjectType: effectiveScope.scopeType,
        subjectId: effectiveScope.scopeId,
        classificationCode: input.classificationCode,
        securityClassification: input.securityClassification || 'INTERNAL',
        revisionCode: input.revisionCode || 'P01',
        purposeOfIssue: input.purposeOfIssue || 'Policy review',
        suitabilityCode: input.suitabilityCode
      },
      executor
    );
    const timestamp = now();
    await executeMutation(
      'INSERT INTO policy_profiles (information_container_id, tenant_id, policy_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, context.tenantId, policyType, timestamp, timestamp],
      executor
    );
    await insertRevisionProfile(
      context,
      id,
      1,
      {
        ...input,
        scopeType: effectiveScope.scopeType,
        scopeId: effectiveScope.scopeId
      },
      executor
    );
    const created = await getPolicy(context, id, executor);
    await profileEvidence(
      context,
      created,
      'POLICY_PROFILE_CREATED',
      {
        policyRef: created.policyRef,
        policyType,
        informationContainerId: id,
        revisionNo: 1
      },
      executor
    );
    return id;
  });
}

export async function createSuccessorPolicyRevision(
  context: CommandContext,
  policyId: string,
  expectedAggregateVersion: number,
  input: CreateSuccessorPolicyRevisionInput
) {
  assertPermission(context, 'information.container.manage');

  return dbTransaction(async (executor) => {
    const before = await getPolicy(context, policyId, executor, true);
    if (before.aggregateVersion !== expectedAggregateVersion) {
      throw new Error('This Policy changed after you opened it.');
    }
    const previous = await queryOne<RowDataPacket & PolicyRevision>(
      revisionSelect +
        ' WHERE r.tenant_id = ? AND r.container_id = ? AND r.revision_no = ?',
      [context.tenantId, policyId, before.currentRevisionNo],
      executor
    );
    if (!previous) throw new Error('Current Policy revision profile not found.');

    const next = await createSuccessorInformationRevisionInTransaction(
      context,
      policyId,
      expectedAggregateVersion,
      {
        revisionCode: input.revisionCode,
        title: input.title,
        purposeOfIssue: input.purposeOfIssue || 'Policy review',
        suitabilityCode: input.suitabilityCode
      },
      executor
    );

    const effectiveInput: PolicyRevisionProfileInput = {
      ownerPartyId: input.ownerPartyId?.trim() || previous.ownerPartyId,
      governanceBodyId: input.governanceBodyId?.trim() || previous.governanceBodyId || undefined,
      applicabilitySummary: input.applicabilitySummary?.trim() || previous.applicabilitySummary,
      scopeType: input.scopeType?.trim() || previous.scopeType || undefined,
      scopeId: input.scopeId?.trim() || previous.scopeId || undefined,
      effectiveFrom: input.effectiveFrom,
      effectiveTo: input.effectiveTo,
      reviewDueAt: input.reviewDueAt,
      attestationRequired:
        input.attestationRequired === undefined
          ? Boolean(previous.attestationRequired)
          : input.attestationRequired
    };
    await insertRevisionProfile(context, policyId, next, effectiveInput, executor);
    await executeMutation(
      'UPDATE policy_profiles SET updated_at = ? WHERE information_container_id = ? AND tenant_id = ?',
      [now(), policyId, context.tenantId],
      executor
    );
    const updated = await getPolicy(context, policyId, executor);
    await profileEvidence(
      context,
      updated,
      'POLICY_REVISION_PROFILE_CREATED',
      {
        revisionNo: next,
        revisionCode: input.revisionCode,
        informationContainerId: policyId,
        supersedesRevisionNo: previous.revisionNo
      },
      executor
    );
    return next;
  });
}

export async function addPolicyRepresentation(
  context: CommandContext,
  policyId: string,
  expectedAggregateVersion: number,
  input: {
    representationType: string;
    contentReference: string;
    contentMediaType?: string;
    sourceFilename?: string;
    hashAlgorithm: string;
    contentHash: string;
  }
) {
  await getPolicy(context, policyId);
  return addInformationRepresentation(context, policyId, expectedAggregateVersion, input);
}

export async function submitPolicyRevision(
  context: CommandContext,
  policyId: string,
  expectedAggregateVersion: number
) {
  const policy = await getPolicy(context, policyId);
  if (!policy.applicabilitySummary.trim()) {
    throw new Error('Policy applicability must be defined before review.');
  }
  return submitInformationRevision(context, policyId, expectedAggregateVersion);
}

export async function approvePolicyRevision(
  context: CommandContext,
  policyId: string,
  expectedAggregateVersion: number,
  decisionId: string
) {
  await getPolicy(context, policyId);
  return approveInformationRevision(context, policyId, expectedAggregateVersion, decisionId);
}

export async function publishPolicyRevision(
  context: CommandContext,
  policyId: string,
  expectedAggregateVersion: number
) {
  const policy = await getPolicy(context, policyId);
  if (!policy.effectiveFrom) {
    throw new Error('Policy effective-from must be defined before publication.');
  }
  return issueInformationRevision(context, policyId, expectedAggregateVersion);
}
