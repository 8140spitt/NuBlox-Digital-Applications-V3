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
import { recordWorkDecision } from '$lib/server/work-decision';
import { createWorkflowInstance, createWorkItem } from '$lib/server/shared-work';

export type IntegrityCase = {
  id: string;
  caseRef: string;
  caseType: string;
  title: string;
  issueSummary: string;
  sourceType: string;
  sourceReference: string | null;
  reportedByPartyId: string | null;
  receivedAt: string;
  severity: string;
  status: string;
  aggregateVersion: number;
  investigationOwnerPartyId: string | null;
  impactSummary: string | null;
  outcomeSummary: string | null;
  closedAt: string | null;
  accessRole: string;
  updatedAt: string;
};

export type IntegrityCaseSubject = {
  partyId: string;
  subjectRole: string;
  addedAt: string;
};

export type IntegrityCaseAccess = {
  partyId: string;
  accessRole: string;
  status: string;
  grantedByPartyId: string;
  grantedAt: string;
  revokedByPartyId: string | null;
  revokedAt: string | null;
};

export type IntegrityCaseEntry = {
  id: string;
  entryType: string;
  entrySummary: string;
  createdByPartyId: string;
  createdAt: string;
};

export type IntegrityCaseEvidence = {
  evidenceItemId: string;
  evidenceType: string;
  contentReference: string;
  classification: string | null;
  status: string;
  capturedAt: string;
  linkType: string;
  linkedAt: string;
};

const caseSelect = `
  SELECT c.id, c.case_ref AS caseRef, c.case_type AS caseType, c.title,
         c.issue_summary AS issueSummary, c.source_type AS sourceType,
         c.source_reference AS sourceReference, c.reported_by_party_id AS reportedByPartyId,
         c.received_at AS receivedAt, c.severity, c.status,
         c.aggregate_version AS aggregateVersion,
         c.investigation_owner_party_id AS investigationOwnerPartyId,
         c.impact_summary AS impactSummary, c.outcome_summary AS outcomeSummary,
         c.closed_at AS closedAt, a.access_role AS accessRole, c.updated_at AS updatedAt
    FROM integrity_cases c
    JOIN integrity_case_access a
      ON a.case_id = c.id
     AND a.party_id = ?
     AND a.status = 'ACTIVE'`;

const managerRoles = new Set(['CASE_MANAGER']);
const investigatorRoles = new Set(['CASE_MANAGER', 'INVESTIGATOR']);
const decisionRoles = new Set(['CASE_MANAGER', 'DECISION_AUTHORITY']);

function now() {
  return new Date().toISOString();
}
function required(value: string, label: string) {
  const clean = value.trim();
  if (!clean) throw new Error(label + ' is required.');
  return clean;
}
function code(value: string, label: string, max = 128) {
  const clean = required(value, label).toUpperCase();
  if (clean.length > max || !/^[A-Z0-9][A-Z0-9._:-]*$/.test(clean))
    throw new Error(label + ' contains unsupported characters.');
  return clean;
}
function timestamp(value: string | undefined, label: string, fallback = now()) {
  const clean = value?.trim();
  if (!clean) return fallback;
  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) throw new Error(label + ' is invalid.');
  return parsed.toISOString();
}

async function assertActiveParty(context: CommandContext, partyId: string, executor: DbExecutor) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM parties WHERE id=? AND tenant_id=? AND status='ACTIVE'",
    [partyId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Active tenant Party not found.');
}

async function getCase(
  context: CommandContext,
  caseId: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & IntegrityCase>(
    caseSelect + ' WHERE c.id=? AND c.tenant_id=?' + (forUpdate ? ' FOR UPDATE' : ''),
    [context.actorPartyId, caseId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Integrity Case not found or access is not granted.');
  return row;
}

function assertAccessRole(caseRecord: IntegrityCase, allowed: Set<string>) {
  if (!allowed.has(caseRecord.accessRole))
    throw new Error('The current Party does not hold sufficient case access.');
}

async function caseEvidence(
  context: CommandContext,
  caseRecord: IntegrityCase,
  eventType: string,
  fromState: string | null,
  toState: string,
  payload: Record<string, unknown>,
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-21-CASE',
      objectType: 'integrity_case',
      objectId: caseRecord.id,
      action: eventType,
      fromState: fromState ?? undefined,
      toState
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: 'AGG-21-CASE',
      aggregateType: 'IntegrityCase',
      aggregateObjectId: caseRecord.id,
      aggregateVersion: caseRecord.aggregateVersion,
      eventType,
      topic: 'nublox.governance.integrity-case',
      payload
    },
    executor
  );
}

export async function listIntegrityCases(context: CommandContext) {
  assertPermission(context, 'governance.ethics.read');
  return queryRows<RowDataPacket & IntegrityCase>(
    caseSelect + ' WHERE c.tenant_id=? ORDER BY c.received_at DESC,c.id DESC',
    [context.actorPartyId, context.tenantId]
  );
}

export async function listIntegrityCaseSubjects(context: CommandContext, caseId: string) {
  assertPermission(context, 'governance.ethics.read');
  await getCase(context, caseId);
  return queryRows<RowDataPacket & IntegrityCaseSubject>(
    'SELECT party_id AS partyId,subject_role AS subjectRole,added_at AS addedAt FROM integrity_case_subjects WHERE case_id=? ORDER BY added_at,party_id',
    [caseId]
  );
}

export async function listIntegrityCaseAccess(context: CommandContext, caseId: string) {
  assertPermission(context, 'governance.ethics.read');
  const caseRecord = await getCase(context, caseId);
  assertAccessRole(caseRecord, managerRoles);
  return queryRows<RowDataPacket & IntegrityCaseAccess>(
    'SELECT party_id AS partyId,access_role AS accessRole,status,granted_by_party_id AS grantedByPartyId,granted_at AS grantedAt,revoked_by_party_id AS revokedByPartyId,revoked_at AS revokedAt FROM integrity_case_access WHERE case_id=? ORDER BY status,access_role,party_id',
    [caseId]
  );
}

export async function listIntegrityCaseEntries(context: CommandContext, caseId: string) {
  assertPermission(context, 'governance.ethics.read');
  await getCase(context, caseId);
  return queryRows<RowDataPacket & IntegrityCaseEntry>(
    'SELECT id,entry_type AS entryType,entry_summary AS entrySummary,created_by_party_id AS createdByPartyId,created_at AS createdAt FROM integrity_case_entries WHERE case_id=? ORDER BY created_at DESC,id DESC',
    [caseId]
  );
}

export async function listIntegrityCaseEvidence(context: CommandContext, caseId: string) {
  assertPermission(context, 'governance.ethics.read');
  await getCase(context, caseId);
  return queryRows<RowDataPacket & IntegrityCaseEvidence>(
    `SELECT l.evidence_item_id AS evidenceItemId,e.evidence_type AS evidenceType,
            e.content_reference AS contentReference,e.classification,e.status,
            e.captured_at AS capturedAt,l.link_type AS linkType,l.linked_at AS linkedAt
       FROM integrity_case_evidence l
       JOIN evidence_items e ON e.id=l.evidence_item_id
      WHERE l.case_id=? AND e.tenant_id=?
      ORDER BY l.linked_at DESC,l.evidence_item_id`,
    [caseId, context.tenantId]
  );
}

export async function listIntegrityCaseDecisionIds(context: CommandContext, caseId: string) {
  assertPermission(context, 'governance.ethics.read');
  await getCase(context, caseId);
  return queryRows<RowDataPacket & { decisionId: string }>(
    'SELECT decision_id AS decisionId FROM integrity_case_decisions WHERE case_id=? ORDER BY decision_id',
    [caseId]
  );
}

export async function listIntegrityCaseActionIds(context: CommandContext, caseId: string) {
  assertPermission(context, 'governance.ethics.read');
  await getCase(context, caseId);
  return queryRows<RowDataPacket & { workItemId: string }>(
    'SELECT work_item_id AS workItemId FROM integrity_case_actions WHERE case_id=? ORDER BY work_item_id',
    [caseId]
  );
}

export async function createIntegrityCase(
  context: CommandContext,
  input: {
    caseRef: string;
    caseType: string;
    title: string;
    issueSummary: string;
    sourceType: string;
    sourceReference?: string;
    reportedByPartyId?: string;
    receivedAt?: string;
    severity: string;
    subjects?: Array<{ partyId: string; subjectRole: string }>;
  }
) {
  assertPermission(context, 'governance.ethics.manage');
  return dbTransaction(async (connection) => {
    if (input.reportedByPartyId?.trim())
      await assertActiveParty(context, input.reportedByPartyId.trim(), connection);
    for (const subject of input.subjects ?? [])
      await assertActiveParty(context, subject.partyId, connection);
    const id = randomUUID(),
      createdAt = now();
    await executeMutation(
      `INSERT INTO integrity_cases
        (id,tenant_id,case_ref,case_type,title,issue_summary,source_type,source_reference,
         reported_by_party_id,received_at,severity,status,aggregate_version,
         investigation_owner_party_id,impact_summary,outcome_summary,closed_at,
         created_by_party_id,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,'REPORTED',1,NULL,NULL,NULL,NULL,?,?,?)`,
      [
        id,
        context.tenantId,
        code(input.caseRef, 'Case reference', 191),
        code(input.caseType, 'Case type', 64),
        required(input.title, 'Case title'),
        required(input.issueSummary, 'Issue summary'),
        code(input.sourceType, 'Source type', 64),
        input.sourceReference?.trim() || null,
        input.reportedByPartyId?.trim() || null,
        timestamp(input.receivedAt, 'Received at'),
        code(input.severity, 'Severity', 32),
        context.actorPartyId,
        createdAt,
        createdAt
      ],
      connection
    );
    await executeMutation(
      "INSERT INTO integrity_case_access (case_id,party_id,access_role,status,granted_by_party_id,granted_at,revoked_by_party_id,revoked_at) VALUES (?,?,'CASE_MANAGER','ACTIVE',?,?,NULL,NULL)",
      [id, context.actorPartyId, context.actorPartyId, createdAt],
      connection
    );
    for (const subject of input.subjects ?? []) {
      await executeMutation(
        'INSERT INTO integrity_case_subjects (case_id,party_id,subject_role,added_by_party_id,added_at) VALUES (?,?,?,?,?)',
        [
          id,
          subject.partyId,
          code(subject.subjectRole, 'Subject role', 64),
          context.actorPartyId,
          createdAt
        ],
        connection
      );
    }
    const caseRecord = await getCase(context, id, connection);
    await caseEvidence(
      context,
      caseRecord,
      'INTEGRITY_CASE_REPORTED',
      null,
      'REPORTED',
      {
        caseType: caseRecord.caseType,
        severity: caseRecord.severity,
        subjectCount: input.subjects?.length ?? 0
      },
      connection
    );
    return id;
  });
}

export async function addIntegrityCaseSubject(
  context: CommandContext,
  caseId: string,
  partyId: string,
  subjectRole: string
) {
  assertPermission(context, 'governance.ethics.manage');
  return dbTransaction(async (connection) => {
    const caseRecord = await getCase(context, caseId, connection, true);
    assertAccessRole(caseRecord, managerRoles);
    await assertActiveParty(context, partyId, connection);
    await executeMutation(
      'INSERT INTO integrity_case_subjects (case_id,party_id,subject_role,added_by_party_id,added_at) VALUES (?,?,?,?,?)',
      [caseId, partyId, code(subjectRole, 'Subject role', 64), context.actorPartyId, now()],
      connection
    );
  });
}

export async function grantIntegrityCaseAccess(
  context: CommandContext,
  caseId: string,
  partyId: string,
  accessRole: string
) {
  assertPermission(context, 'governance.ethics.access.manage');
  return dbTransaction(async (connection) => {
    const caseRecord = await getCase(context, caseId, connection, true);
    assertAccessRole(caseRecord, managerRoles);
    await assertActiveParty(context, partyId, connection);
    const role = code(accessRole, 'Case access role', 32);
    if (!['CASE_MANAGER', 'INVESTIGATOR', 'DECISION_AUTHORITY', 'OBSERVER'].includes(role))
      throw new Error('Unsupported case access role.');
    const timestampValue = now();
    await executeMutation(
      `INSERT INTO integrity_case_access
        (case_id,party_id,access_role,status,granted_by_party_id,granted_at,revoked_by_party_id,revoked_at)
       VALUES (?,?,?,'ACTIVE',?,?,NULL,NULL)
       ON DUPLICATE KEY UPDATE access_role=VALUES(access_role),status='ACTIVE',
         granted_by_party_id=VALUES(granted_by_party_id),granted_at=VALUES(granted_at),
         revoked_by_party_id=NULL,revoked_at=NULL`,
      [caseId, partyId, role, context.actorPartyId, timestampValue],
      connection
    );
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-21-CASE',
        objectType: 'integrity_case',
        objectId: caseId,
        action: 'INTEGRITY_CASE_ACCESS_GRANTED'
      },
      connection
    );
  });
}

export async function revokeIntegrityCaseAccess(
  context: CommandContext,
  caseId: string,
  partyId: string
) {
  assertPermission(context, 'governance.ethics.access.manage');
  return dbTransaction(async (connection) => {
    const caseRecord = await getCase(context, caseId, connection, true);
    assertAccessRole(caseRecord, managerRoles);
    if (partyId === context.actorPartyId)
      throw new Error('A Case Manager cannot revoke their own access.');
    const timestampValue = now();
    const result = await executeMutation(
      "UPDATE integrity_case_access SET status='REVOKED',revoked_by_party_id=?,revoked_at=? WHERE case_id=? AND party_id=? AND status='ACTIVE'",
      [context.actorPartyId, timestampValue, caseId, partyId],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Active case access was not found.');
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-21-CASE',
        objectType: 'integrity_case',
        objectId: caseId,
        action: 'INTEGRITY_CASE_ACCESS_REVOKED'
      },
      connection
    );
  });
}

export async function assignIntegrityCaseOwner(
  context: CommandContext,
  caseId: string,
  partyId: string,
  expectedAggregateVersion: number
) {
  assertPermission(context, 'governance.ethics.manage');
  return dbTransaction(async (connection) => {
    const caseRecord = await getCase(context, caseId, connection, true);
    assertAccessRole(caseRecord, managerRoles);
    if (caseRecord.aggregateVersion !== expectedAggregateVersion)
      throw new Error('This Integrity Case changed after you opened it.');
    await assertActiveParty(context, partyId, connection);
    const access = await queryOne<RowDataPacket & { role: string }>(
      "SELECT access_role AS role FROM integrity_case_access WHERE case_id=? AND party_id=? AND status='ACTIVE'",
      [caseId, partyId],
      connection
    );
    if (!access || !investigatorRoles.has(access.role))
      throw new Error('Investigation owner requires active Investigator or Case Manager access.');
    const timestampValue = now();
    const result = await executeMutation(
      'UPDATE integrity_cases SET investigation_owner_party_id=?,aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?',
      [partyId, timestampValue, caseId, context.tenantId, expectedAggregateVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Integrity Case change detected.');
    const updated = await getCase(context, caseId, connection);
    await caseEvidence(
      context,
      updated,
      'INTEGRITY_CASE_OWNER_ASSIGNED',
      caseRecord.status,
      caseRecord.status,
      { ownerPartyId: partyId },
      connection
    );
  });
}

export async function recordIntegrityCaseEntry(
  context: CommandContext,
  caseId: string,
  input: { entryType: string; summary: string }
) {
  assertPermission(context, 'governance.ethics.investigate');
  return dbTransaction(async (connection) => {
    const caseRecord = await getCase(context, caseId, connection, true);
    assertAccessRole(caseRecord, investigatorRoles);
    if (['CLOSED', 'UNSUBSTANTIATED'].includes(caseRecord.status))
      throw new Error('Closed Integrity Cases do not accept investigation entries.');
    const id = randomUUID(),
      createdAt = now();
    await executeMutation(
      'INSERT INTO integrity_case_entries (id,case_id,entry_type,entry_summary,created_by_party_id,created_at) VALUES (?,?,?,?,?,?)',
      [
        id,
        caseId,
        code(input.entryType, 'Entry type', 64),
        required(input.summary, 'Entry summary'),
        context.actorPartyId,
        createdAt
      ],
      connection
    );
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-21-CASE',
        objectType: 'integrity_case',
        objectId: caseId,
        action: 'INTEGRITY_CASE_ENTRY_RECORDED'
      },
      connection
    );
    return id;
  });
}

export async function linkIntegrityCaseEvidence(
  context: CommandContext,
  caseId: string,
  evidenceItemId: string,
  linkType: string
) {
  assertPermission(context, 'governance.ethics.investigate');
  return dbTransaction(async (connection) => {
    const caseRecord = await getCase(context, caseId, connection, true);
    assertAccessRole(caseRecord, investigatorRoles);
    const evidence = await queryOne<RowDataPacket & { id: string }>(
      'SELECT id FROM evidence_items WHERE id=? AND tenant_id=?',
      [evidenceItemId, context.tenantId],
      connection
    );
    if (!evidence) throw new Error('Evidence Item not found.');
    await executeMutation(
      'INSERT INTO integrity_case_evidence (case_id,evidence_item_id,link_type,linked_by_party_id,linked_at) VALUES (?,?,?,?,?)',
      [
        caseId,
        evidenceItemId,
        code(linkType, 'Evidence link type', 64),
        context.actorPartyId,
        now()
      ],
      connection
    );
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-21-CASE',
        objectType: 'integrity_case',
        objectId: caseId,
        action: 'INTEGRITY_CASE_EVIDENCE_LINKED'
      },
      connection
    );
  });
}

const allowedTransitions: Record<string, string[]> = {
  REPORTED: ['TRIAGE'],
  TRIAGE: ['OPEN', 'UNSUBSTANTIATED'],
  OPEN: ['INVESTIGATING', 'CLOSED'],
  INVESTIGATING: ['DECISION_ACTION', 'OPEN'],
  DECISION_ACTION: ['APPEAL_REVIEW', 'CLOSED', 'INVESTIGATING'],
  APPEAL_REVIEW: ['INVESTIGATING', 'DECISION_ACTION', 'CLOSED']
};

export async function transitionIntegrityCase(
  context: CommandContext,
  caseId: string,
  expectedAggregateVersion: number,
  input: { toStatus: string; summary: string; impactSummary?: string; outcomeSummary?: string }
) {
  const target = code(input.toStatus, 'Case status', 32);
  const managementTargets = new Set(['TRIAGE', 'OPEN', 'UNSUBSTANTIATED']);
  if (managementTargets.has(target)) assertPermission(context, 'governance.ethics.manage');
  else if (target === 'INVESTIGATING') assertPermission(context, 'governance.ethics.investigate');
  else assertPermission(context, 'governance.ethics.decide');

  return dbTransaction(async (connection) => {
    const caseRecord = await getCase(context, caseId, connection, true);
    if (managementTargets.has(target)) assertAccessRole(caseRecord, managerRoles);
    else if (target === 'INVESTIGATING') assertAccessRole(caseRecord, investigatorRoles);
    else assertAccessRole(caseRecord, decisionRoles);
    if (caseRecord.aggregateVersion !== expectedAggregateVersion)
      throw new Error('This Integrity Case changed after you opened it.');
    if (!(allowedTransitions[caseRecord.status] ?? []).includes(target))
      throw new Error('The requested Integrity Case transition is not allowed.');
    if (target === 'INVESTIGATING' && !caseRecord.investigationOwnerPartyId)
      throw new Error('Assign an investigation owner before starting investigation.');
    const timestampValue = now(),
      closedAt = ['CLOSED', 'UNSUBSTANTIATED'].includes(target) ? timestampValue : null;
    const result = await executeMutation(
      `UPDATE integrity_cases
          SET status=?,aggregate_version=aggregate_version+1,
              impact_summary=COALESCE(?,impact_summary),
              outcome_summary=COALESCE(?,outcome_summary),
              closed_at=?,updated_at=?
        WHERE id=? AND tenant_id=? AND aggregate_version=?`,
      [
        target,
        input.impactSummary?.trim() || null,
        input.outcomeSummary?.trim() || null,
        closedAt,
        timestampValue,
        caseId,
        context.tenantId,
        expectedAggregateVersion
      ],
      connection
    );
    if (result.affectedRows !== 1)
      throw new Error('Concurrent Integrity Case transition detected.');
    await executeMutation(
      'INSERT INTO integrity_case_entries (id,case_id,entry_type,entry_summary,created_by_party_id,created_at) VALUES (?,?,?,?,?,?)',
      [
        randomUUID(),
        caseId,
        'STATUS_TRANSITION',
        required(input.summary, 'Transition summary'),
        context.actorPartyId,
        timestampValue
      ],
      connection
    );
    const updated = await getCase(context, caseId, connection);
    await caseEvidence(
      context,
      updated,
      'INTEGRITY_CASE_STATUS_CHANGED',
      caseRecord.status,
      target,
      {
        caseType: updated.caseType,
        severity: updated.severity,
        status: target
      },
      connection
    );
  });
}

export async function recordIntegrityCaseDecision(
  context: CommandContext,
  caseId: string,
  input: { outcome: string; reason: string }
) {
  assertPermission(context, 'governance.ethics.decide');
  const caseRecord = await getCase(context, caseId);
  assertAccessRole(caseRecord, decisionRoles);
  if (!['INVESTIGATING', 'DECISION_ACTION', 'APPEAL_REVIEW'].includes(caseRecord.status))
    throw new Error('Case decisions require an active investigation or decision/review state.');
  const decisionId = await recordWorkDecision(context, {
    decisionType: 'INTEGRITY_CASE_OUTCOME',
    subjectType: 'INTEGRITY_CASE',
    subjectId: caseRecord.id,
    subjectVersion: String(caseRecord.aggregateVersion),
    outcome: input.outcome,
    reason: input.reason
  });
  await dbTransaction(async (connection) => {
    const locked = await getCase(context, caseId, connection, true);
    assertAccessRole(locked, decisionRoles);
    await executeMutation(
      'INSERT INTO integrity_case_decisions (case_id,decision_id) VALUES (?,?)',
      [caseId, decisionId],
      connection
    );
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-21-CASE',
        objectType: 'integrity_case',
        objectId: caseId,
        action: 'INTEGRITY_CASE_DECISION_LINKED'
      },
      connection
    );
  });
  return decisionId;
}

export async function createIntegrityCaseAction(
  context: CommandContext,
  caseId: string,
  input: { title: string; instructions: string; priority?: string; dueAt?: string }
) {
  assertPermission(context, 'governance.ethics.decide');
  const caseRecord = await getCase(context, caseId);
  assertAccessRole(caseRecord, decisionRoles);
  if (!['DECISION_ACTION', 'APPEAL_REVIEW'].includes(caseRecord.status))
    throw new Error('Follow-up actions require Decision/Action or Appeal/Review state.');
  const workflowId = await createWorkflowInstance(context, {
    definitionKey: 'INTEGRITY_CASE_ACTION',
    definitionVersion: '1',
    subjectType: 'INTEGRITY_CASE',
    subjectId: caseRecord.id,
    subjectVersion: String(caseRecord.aggregateVersion),
    currentState: 'ACTION_REQUIRED'
  });
  const workItemId = await createWorkItem(context, workflowId, {
    workType: 'INTEGRITY_CASE_ACTION',
    title: input.title,
    instructions: input.instructions,
    subjectType: 'INTEGRITY_CASE',
    subjectId: caseRecord.id,
    subjectVersion: String(caseRecord.aggregateVersion),
    priority: input.priority,
    dueAt: input.dueAt
  });
  await dbTransaction(async (connection) => {
    const locked = await getCase(context, caseId, connection, true);
    assertAccessRole(locked, decisionRoles);
    await executeMutation(
      'INSERT INTO integrity_case_actions (case_id,work_item_id) VALUES (?,?)',
      [caseId, workItemId],
      connection
    );
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-21-CASE',
        objectType: 'integrity_case',
        objectId: caseId,
        action: 'INTEGRITY_CASE_ACTION_LINKED'
      },
      connection
    );
  });
  return { workflowId, workItemId };
}
