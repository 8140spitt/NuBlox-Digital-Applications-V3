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

export type InformationContainer = {
  id: string;
  containerRef: string;
  containerType: string;
  title: string;
  originatorPartyId: string;
  originatorDisplayName: string;
  subjectType: string | null;
  subjectId: string | null;
  classificationCode: string | null;
  securityClassification: string | null;
  status: string;
  aggregateVersion: number;
  currentRevisionNo: number;
  updatedAt: string;
};

export type InformationRevision = {
  id: string;
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
  createdByPartyId: string;
  createdAt: string;
};

export type InformationRepresentation = {
  id: string;
  containerId: string;
  revisionId: string;
  representationType: string;
  contentReference: string;
  contentMediaType: string | null;
  sourceFilename: string | null;
  hashAlgorithm: string;
  contentHash: string;
  createdByPartyId: string;
  createdAt: string;
};

const containerSelect =
  'SELECT c.id, c.container_ref AS containerRef, c.container_type AS containerType, c.title, c.originator_party_id AS originatorPartyId, p.display_name AS originatorDisplayName, c.subject_type AS subjectType, c.subject_id AS subjectId, c.classification_code AS classificationCode, c.security_classification AS securityClassification, c.status, c.aggregate_version AS aggregateVersion, c.current_revision_no AS currentRevisionNo, c.updated_at AS updatedAt FROM information_containers c JOIN parties p ON p.id = c.originator_party_id';
const revisionSelect =
  'SELECT id, container_id AS containerId, revision_no AS revisionNo, revision_code AS revisionCode, title, purpose_of_issue AS purposeOfIssue, suitability_code AS suitabilityCode, lifecycle_status AS lifecycleStatus, approval_decision_id AS approvalDecisionId, approved_at AS approvedAt, issued_at AS issuedAt, supersedes_revision_id AS supersedesRevisionId, created_by_party_id AS createdByPartyId, created_at AS createdAt FROM information_revisions';
const representationSelect =
  'SELECT id, container_id AS containerId, revision_id AS revisionId, representation_type AS representationType, content_reference AS contentReference, content_media_type AS contentMediaType, source_filename AS sourceFilename, hash_algorithm AS hashAlgorithm, content_hash AS contentHash, created_by_party_id AS createdByPartyId, created_at AS createdAt FROM information_representations';

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
function optionalCode(v: string | undefined, l: string, max = 191) {
  return v?.trim() ? code(v, l, max) : null;
}
function subject(type?: string, id?: string) {
  const t = type?.trim() ? code(type, 'Information subject type', 64) : null;
  const i = id?.trim() || null;
  if (Boolean(t) !== Boolean(i))
    throw new Error('Information subject type and subject ID must be supplied together.');
  return { subjectType: t, subjectId: i };
}
function hash(algorithm: string, value: string) {
  const a = code(algorithm, 'Hash algorithm', 32),
    h = required(value, 'Content hash').toLowerCase();
  if (a === 'SHA256' && !/^[a-f0-9]{64}$/.test(h))
    throw new Error('SHA256 content hash must contain 64 hexadecimal characters.');
  if (a === 'SHA512' && !/^[a-f0-9]{128}$/.test(h))
    throw new Error('SHA512 content hash must contain 128 hexadecimal characters.');
  return { algorithm: a, value: h };
}
async function activeParty(c: CommandContext, id: string, e: DbExecutor) {
  const r = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM parties WHERE id = ? AND tenant_id = ? AND status = 'ACTIVE'",
    [id, c.tenantId],
    e
  );
  if (!r) throw new Error('Active Party not found.');
}
async function getContainer(c: CommandContext, id: string, e?: DbExecutor, lock = false) {
  const r = await queryOne<RowDataPacket & InformationContainer>(
    containerSelect + ' WHERE c.id = ? AND c.tenant_id = ?' + (lock ? ' FOR UPDATE' : ''),
    [id, c.tenantId],
    e
  );
  if (!r) throw new Error('Information Container not found.');
  return r;
}
async function getRevision(
  c: CommandContext,
  containerId: string,
  revisionNo: number,
  e?: DbExecutor,
  lock = false
) {
  const r = await queryOne<RowDataPacket & InformationRevision>(
    revisionSelect +
      ' WHERE tenant_id = ? AND container_id = ? AND revision_no = ?' +
      (lock ? ' FOR UPDATE' : ''),
    [c.tenantId, containerId, revisionNo],
    e
  );
  if (!r) throw new Error('Information Revision not found.');
  return r;
}
async function evidence(
  c: CommandContext,
  x: InformationContainer,
  type: string,
  from: string | null,
  to: string,
  p: Record<string, unknown>,
  e: DbExecutor
) {
  await recordPlatformAudit(
    c,
    {
      aggregateId: 'AGG-07-INFORMATION',
      objectType: 'information_container',
      objectId: x.id,
      action: type,
      fromState: from ?? undefined,
      toState: to
    },
    e
  );
  await emitBusinessEvent(
    c,
    {
      aggregateId: 'AGG-07-INFORMATION',
      aggregateType: 'InformationContainer',
      aggregateObjectId: x.id,
      aggregateVersion: x.aggregateVersion,
      eventType: type,
      topic: 'nublox.information.container',
      payload: p
    },
    e
  );
}

export async function listInformationContainers(
  c: CommandContext,
  input: { containerType?: string; subjectType?: string; subjectId?: string; status?: string } = {}
) {
  assertPermission(c, 'information.container.read');
  const clauses = ['c.tenant_id = ?'];
  const params: unknown[] = [c.tenantId];
  if (input.containerType) {
    clauses.push('c.container_type = ?');
    params.push(code(input.containerType, 'Container type', 64));
  }
  if (input.subjectType) {
    clauses.push('c.subject_type = ?');
    params.push(code(input.subjectType, 'Subject type', 64));
  }
  if (input.subjectId) {
    clauses.push('c.subject_id = ?');
    params.push(input.subjectId);
  }
  if (input.status) {
    clauses.push('c.status = ?');
    params.push(code(input.status, 'Container status', 32));
  }
  return queryRows<RowDataPacket & InformationContainer>(
    containerSelect +
      ' WHERE ' +
      clauses.join(' AND ') +
      ' ORDER BY c.updated_at DESC, c.container_ref',
    params
  );
}

export async function getInformationContainer(context: CommandContext, id: string) {
  assertPermission(context, 'information.container.read');
  return getContainer(context, id);
}

export async function searchInformationContainers(
  context: CommandContext,
  query: string,
  requestedLimit = 25
) {
  assertPermission(context, 'information.container.read');
  const needle = query.trim().slice(0, 191);
  if (!needle) return [] as InformationContainer[];
  const pattern = '%' + needle + '%';
  const limit = Math.max(1, Math.min(50, Math.floor(requestedLimit)));
  return queryRows<RowDataPacket & InformationContainer>(
    containerSelect +
      ' WHERE c.tenant_id = ? AND (c.container_ref LIKE ? OR c.title LIKE ? OR c.container_type LIKE ? OR c.subject_type LIKE ? OR c.subject_id LIKE ? OR c.classification_code LIKE ?) ORDER BY c.updated_at DESC, c.container_ref LIMIT ' +
      limit,
    [context.tenantId, pattern, pattern, pattern, pattern, pattern, pattern]
  );
}
export async function listInformationRevisions(c: CommandContext, id: string) {
  assertPermission(c, 'information.container.read');
  await getContainer(c, id);
  return queryRows<RowDataPacket & InformationRevision>(
    revisionSelect + ' WHERE tenant_id = ? AND container_id = ? ORDER BY revision_no DESC',
    [c.tenantId, id]
  );
}
export async function listInformationRepresentations(c: CommandContext, revisionId: string) {
  assertPermission(c, 'information.container.read');
  return queryRows<RowDataPacket & InformationRepresentation>(
    representationSelect + ' WHERE tenant_id = ? AND revision_id = ? ORDER BY created_at, id',
    [c.tenantId, revisionId]
  );
}

export type CreateInformationContainerInput = {
  containerRef: string;
  containerType: string;
  title: string;
  originatorPartyId?: string;
  subjectType?: string;
  subjectId?: string;
  classificationCode?: string;
  securityClassification?: string;
  revisionCode?: string;
  purposeOfIssue?: string;
  suitabilityCode?: string;
};

export async function createInformationContainerInTransaction(
  c: CommandContext,
  input: CreateInformationContainerInput,
  e: DbExecutor
) {
  assertPermission(c, 'information.container.manage');
  const ref = code(input.containerRef, 'Information Container reference');
  const type = code(input.containerType, 'Information Container type', 64);
  const originator = input.originatorPartyId?.trim() || c.actorPartyId;
  const s = subject(input.subjectType, input.subjectId);
  const rev = code(input.revisionCode?.trim() || 'P01', 'Revision code', 64);
  await activeParty(c, originator, e);
  const id = randomUUID();
  const ts = now();
  await executeMutation(
    "INSERT INTO information_containers (id, tenant_id, container_ref, container_type, title, originator_party_id, subject_type, subject_id, classification_code, security_classification, status, aggregate_version, current_revision_no, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'WORK_IN_PROGRESS', 1, 1, ?, ?)",
    [
      id,
      c.tenantId,
      ref,
      type,
      required(input.title, 'Information title'),
      originator,
      s.subjectType,
      s.subjectId,
      input.classificationCode?.trim() || null,
      optionalCode(input.securityClassification, 'Security classification', 64),
      ts,
      ts
    ],
    e
  );
  await executeMutation(
    "INSERT INTO information_revisions (id, tenant_id, container_id, revision_no, revision_code, title, purpose_of_issue, suitability_code, lifecycle_status, approval_decision_id, approved_at, issued_at, supersedes_revision_id, created_by_party_id, created_at) VALUES (?, ?, ?, 1, ?, ?, ?, ?, 'WORKING', NULL, NULL, NULL, NULL, ?, ?)",
    [
      randomUUID(),
      c.tenantId,
      id,
      rev,
      required(input.title, 'Information title'),
      input.purposeOfIssue?.trim() || null,
      optionalCode(input.suitabilityCode, 'Suitability code', 64),
      c.actorPartyId,
      ts
    ],
    e
  );
  const created = await getContainer(c, id, e);
  await evidence(
    c,
    created,
    'INFORMATION_CONTAINER_CREATED',
    null,
    'WORK_IN_PROGRESS',
    {
      containerRef: ref,
      containerType: type,
      revisionNo: 1,
      revisionCode: rev
    },
    e
  );
  return id;
}

export async function createInformationContainer(
  c: CommandContext,
  input: CreateInformationContainerInput
) {
  return dbTransaction((e) => createInformationContainerInTransaction(c, input, e));
}

export async function addInformationRepresentation(
  c: CommandContext,
  containerId: string,
  expected: number,
  input: {
    representationType: string;
    contentReference: string;
    contentMediaType?: string;
    sourceFilename?: string;
    hashAlgorithm: string;
    contentHash: string;
  }
) {
  assertPermission(c, 'information.container.manage');
  const h = hash(input.hashAlgorithm, input.contentHash);
  return dbTransaction(async (e) => {
    const current = await getContainer(c, containerId, e, true);
    if (current.aggregateVersion !== expected)
      throw new Error('This Information Container changed after you opened it.');
    const rev = await getRevision(c, current.id, current.currentRevisionNo, e, true);
    if (rev.lifecycleStatus !== 'WORKING')
      throw new Error('Representations cannot be changed after revision submission.');
    await executeMutation(
      'INSERT INTO information_representations (id, tenant_id, container_id, revision_id, representation_type, content_reference, content_media_type, source_filename, hash_algorithm, content_hash, created_by_party_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        randomUUID(),
        c.tenantId,
        current.id,
        rev.id,
        code(input.representationType, 'Representation type', 64),
        required(input.contentReference, 'Content reference'),
        input.contentMediaType?.trim() || null,
        input.sourceFilename?.trim() || null,
        h.algorithm,
        h.value,
        c.actorPartyId,
        now()
      ],
      e
    );
    await executeMutation(
      'UPDATE information_containers SET aggregate_version = aggregate_version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?',
      [now(), current.id, c.tenantId, expected],
      e
    );
    const updated = await getContainer(c, current.id, e);
    await evidence(
      c,
      updated,
      'INFORMATION_REPRESENTATION_ADDED',
      current.status,
      current.status,
      { revisionNo: current.currentRevisionNo, representationType: input.representationType },
      e
    );
  });
}

export async function submitInformationRevision(
  c: CommandContext,
  containerId: string,
  expected: number
) {
  assertPermission(c, 'information.container.manage');
  return dbTransaction(async (e) => {
    const current = await getContainer(c, containerId, e, true);
    if (current.aggregateVersion !== expected)
      throw new Error('This Information Container changed after you opened it.');
    const rev = await getRevision(c, current.id, current.currentRevisionNo, e, true);
    if (rev.lifecycleStatus !== 'WORKING')
      throw new Error('Only a working revision can be submitted.');
    await executeMutation(
      "UPDATE information_revisions SET lifecycle_status = 'REVIEW' WHERE id = ? AND lifecycle_status = 'WORKING'",
      [rev.id],
      e
    );
    await executeMutation(
      "UPDATE information_containers SET status = 'IN_REVIEW', aggregate_version = aggregate_version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?",
      [now(), current.id, c.tenantId, expected],
      e
    );
    const updated = await getContainer(c, current.id, e);
    await evidence(
      c,
      updated,
      'INFORMATION_REVISION_SUBMITTED',
      current.status,
      'IN_REVIEW',
      { revisionNo: rev.revisionNo, revisionCode: rev.revisionCode },
      e
    );
  });
}

export async function approveInformationRevision(
  c: CommandContext,
  containerId: string,
  expected: number,
  decisionId: string
) {
  assertPermission(c, 'information.container.approve');
  return dbTransaction(async (e) => {
    const current = await getContainer(c, containerId, e, true);
    if (current.aggregateVersion !== expected)
      throw new Error('This Information Container changed after you opened it.');
    const rev = await getRevision(c, current.id, current.currentRevisionNo, e, true);
    if (rev.lifecycleStatus !== 'REVIEW')
      throw new Error('Only an in-review revision can be approved.');
    const decision = await assertWorkDecisionReference(
      c,
      {
        decisionId,
        decisionType: 'INFORMATION_REVISION_REVIEW',
        subjectType: 'INFORMATION_CONTAINER',
        subjectId: current.id,
        subjectVersion: String(rev.revisionNo),
        outcome: 'APPROVED'
      },
      e
    );
    const ts = now();
    await executeMutation(
      "UPDATE information_revisions SET lifecycle_status = 'APPROVED', approval_decision_id = ?, approved_at = ? WHERE id = ? AND lifecycle_status = 'REVIEW'",
      [decision.id, ts, rev.id],
      e
    );
    await executeMutation(
      "UPDATE information_containers SET status = 'APPROVED', aggregate_version = aggregate_version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?",
      [ts, current.id, c.tenantId, expected],
      e
    );
    const updated = await getContainer(c, current.id, e);
    await evidence(
      c,
      updated,
      'INFORMATION_REVISION_APPROVED',
      'IN_REVIEW',
      'APPROVED',
      { revisionNo: rev.revisionNo, decisionId: decision.id },
      e
    );
  });
}

export async function issueInformationRevision(
  c: CommandContext,
  containerId: string,
  expected: number
) {
  assertPermission(c, 'information.container.approve');
  return dbTransaction(async (e) => {
    const current = await getContainer(c, containerId, e, true);
    if (current.aggregateVersion !== expected)
      throw new Error('This Information Container changed after you opened it.');
    const rev = await getRevision(c, current.id, current.currentRevisionNo, e, true);
    if (rev.lifecycleStatus !== 'APPROVED')
      throw new Error('Only an approved revision can be issued.');
    const count = await queryOne<RowDataPacket & { count: number }>(
      'SELECT COUNT(*) AS count FROM information_representations WHERE tenant_id = ? AND revision_id = ?',
      [c.tenantId, rev.id],
      e
    );
    if (Number(count?.count ?? 0) < 1)
      throw new Error('An Information Revision requires at least one Representation before issue.');
    const ts = now();
    await executeMutation(
      "UPDATE information_revisions SET lifecycle_status = 'ISSUED', issued_at = ? WHERE id = ? AND lifecycle_status = 'APPROVED'",
      [ts, rev.id],
      e
    );
    if (rev.supersedesRevisionId) {
      await executeMutation(
        "UPDATE information_revisions SET lifecycle_status = 'SUPERSEDED' WHERE id = ? AND container_id = ? AND lifecycle_status = 'ISSUED'",
        [rev.supersedesRevisionId, current.id],
        e
      );
    }
    await executeMutation(
      "UPDATE information_containers SET status = 'PUBLISHED', aggregate_version = aggregate_version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?",
      [ts, current.id, c.tenantId, expected],
      e
    );
    const updated = await getContainer(c, current.id, e);
    await evidence(
      c,
      updated,
      'INFORMATION_REVISION_ISSUED',
      'APPROVED',
      'PUBLISHED',
      { revisionNo: rev.revisionNo, revisionCode: rev.revisionCode },
      e
    );
  });
}

export type CreateSuccessorInformationRevisionInput = {
  revisionCode: string;
  title?: string;
  purposeOfIssue?: string;
  suitabilityCode?: string;
};

export async function createSuccessorInformationRevisionInTransaction(
  c: CommandContext,
  containerId: string,
  expected: number,
  input: CreateSuccessorInformationRevisionInput,
  e: DbExecutor
) {
  assertPermission(c, 'information.container.manage');
  const current = await getContainer(c, containerId, e, true);
  if (current.aggregateVersion !== expected) {
    throw new Error('This Information Container changed after you opened it.');
  }
  const previous = await getRevision(c, current.id, current.currentRevisionNo, e, true);
  if (previous.lifecycleStatus !== 'ISSUED') {
    throw new Error('A successor revision can only follow an issued revision.');
  }
  const next = current.currentRevisionNo + 1;
  const ts = now();
  await executeMutation(
    "INSERT INTO information_revisions (id, tenant_id, container_id, revision_no, revision_code, title, purpose_of_issue, suitability_code, lifecycle_status, approval_decision_id, approved_at, issued_at, supersedes_revision_id, created_by_party_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'WORKING', NULL, NULL, NULL, ?, ?, ?)",
    [
      randomUUID(),
      c.tenantId,
      current.id,
      next,
      code(input.revisionCode, 'Revision code', 64),
      input.title?.trim() || current.title,
      input.purposeOfIssue?.trim() || null,
      optionalCode(input.suitabilityCode, 'Suitability code', 64),
      previous.id,
      c.actorPartyId,
      ts
    ],
    e
  );
  await executeMutation(
    "UPDATE information_containers SET title = ?, status = 'WORK_IN_PROGRESS', current_revision_no = ?, aggregate_version = aggregate_version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?",
    [input.title?.trim() || current.title, next, ts, current.id, c.tenantId, expected],
    e
  );
  const updated = await getContainer(c, current.id, e);
  await evidence(
    c,
    updated,
    'INFORMATION_REVISION_CREATED',
    'PUBLISHED',
    'WORK_IN_PROGRESS',
    {
      revisionNo: next,
      revisionCode: input.revisionCode,
      supersedesRevisionId: previous.id
    },
    e
  );
  return next;
}

export async function createSuccessorInformationRevision(
  c: CommandContext,
  containerId: string,
  expected: number,
  input: CreateSuccessorInformationRevisionInput
) {
  return dbTransaction((e) =>
    createSuccessorInformationRevisionInTransaction(c, containerId, expected, input, e)
  );
}
