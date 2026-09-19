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

export type DueDiligenceMatter = {
  id: string;
  matterRef: string;
  matterType: string;
  title: string;
  subjectType: string;
  subjectId: string;
  subjectVersion: string | null;
  scopeSummary: string;
  ownerPartyId: string;
  counselPartyId: string | null;
  jurisdictionId: string | null;
  privilegeClassification: string;
  confidentialityClassification: string;
  status: string;
  aggregateVersion: number;
  openedAt: string;
  closedAt: string | null;
  accessRole: string;
  updatedAt: string;
};

export type LegalMatterAccess = {
  partyId: string;
  accessRole: string;
  status: string;
  grantedByPartyId: string;
  grantedAt: string;
  revokedByPartyId: string | null;
  revokedAt: string | null;
};

export type DueDiligenceWorkstream = {
  id: string;
  workstreamType: string;
  status: string;
  riskRating: string | null;
  findingsSummary: string | null;
  conclusion: string | null;
  evidenceReference: string | null;
  ownerPartyId: string;
  aggregateVersion: number;
  updatedAt: string;
};

const matterSelect = `
SELECT m.id,m.matter_ref AS matterRef,m.matter_type AS matterType,m.title,
       m.subject_type AS subjectType,m.subject_id AS subjectId,m.subject_version AS subjectVersion,
       m.scope_summary AS scopeSummary,m.owner_party_id AS ownerPartyId,m.counsel_party_id AS counselPartyId,
       m.jurisdiction_id AS jurisdictionId,m.privilege_classification AS privilegeClassification,
       m.confidentiality_classification AS confidentialityClassification,m.status,
       m.aggregate_version AS aggregateVersion,m.opened_at AS openedAt,m.closed_at AS closedAt,
       a.access_role AS accessRole,m.updated_at AS updatedAt
  FROM legal_matters m
  JOIN legal_matter_access a
    ON a.matter_id=m.id
   AND a.party_id=?
   AND a.status='ACTIVE'`;

const managers = new Set(['MATTER_MANAGER']);
const contributors = new Set(['MATTER_MANAGER', 'COUNSEL', 'REVIEWER']);

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
  if (clean.length > max || !/^[A-Z0-9][A-Z0-9._:-]*$/.test(clean)) {
    throw new Error(label + ' contains unsupported characters.');
  }
  return clean;
}

async function assertActiveParty(context: CommandContext, partyId: string, executor: DbExecutor) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM parties WHERE id=? AND tenant_id=? AND status='ACTIVE'",
    [partyId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Active tenant Party not found.');
}

async function getMatter(
  context: CommandContext,
  matterId: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & DueDiligenceMatter>(
    matterSelect +
      " WHERE m.id=? AND m.tenant_id=? AND m.matter_type='DUE_DILIGENCE'" +
      (forUpdate ? ' FOR UPDATE' : ''),
    [context.actorPartyId, matterId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Due Diligence Matter not found or access is not granted.');
  return row;
}

function assertAccessRole(matter: DueDiligenceMatter, allowed: Set<string>) {
  if (!allowed.has(matter.accessRole)) {
    throw new Error('The current Party does not hold sufficient Legal Matter access.');
  }
}

async function matterEvidence(
  context: CommandContext,
  matter: Pick<DueDiligenceMatter, 'id' | 'aggregateVersion'>,
  eventType: string,
  fromState: string | null,
  toState: string,
  payload: Record<string, unknown>,
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-22-LEGAL',
      objectType: 'LegalMatter',
      objectId: matter.id,
      action: eventType,
      fromState: fromState ?? undefined,
      toState
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: 'AGG-22-LEGAL',
      aggregateType: 'LegalMatter',
      aggregateObjectId: matter.id,
      aggregateVersion: matter.aggregateVersion,
      eventType,
      topic: 'nublox.legal.matter',
      payload
    },
    executor
  );
}

export async function listDueDiligenceMatters(context: CommandContext) {
  assertPermission(context, 'corporate.development.due_diligence.read');
  return queryRows<RowDataPacket & DueDiligenceMatter>(
    matterSelect +
      " WHERE m.tenant_id=? AND m.matter_type='DUE_DILIGENCE' ORDER BY m.opened_at DESC,m.matter_ref",
    [context.actorPartyId, context.tenantId]
  );
}

export async function listDueDiligenceWorkstreams(context: CommandContext, matterId: string) {
  assertPermission(context, 'corporate.development.due_diligence.read');
  await getMatter(context, matterId);
  return queryRows<RowDataPacket & DueDiligenceWorkstream>(
    'SELECT id,workstream_type AS workstreamType,status,risk_rating AS riskRating,findings_summary AS findingsSummary,conclusion,evidence_reference AS evidenceReference,owner_party_id AS ownerPartyId,aggregate_version AS aggregateVersion,updated_at AS updatedAt FROM legal_matter_workstreams WHERE matter_id=? ORDER BY workstream_type',
    [matterId]
  );
}

export async function listDueDiligenceAccess(context: CommandContext, matterId: string) {
  assertPermission(context, 'corporate.development.due_diligence.read');
  const matter = await getMatter(context, matterId);
  assertAccessRole(matter, managers);
  return queryRows<RowDataPacket & LegalMatterAccess>(
    'SELECT party_id AS partyId,access_role AS accessRole,status,granted_by_party_id AS grantedByPartyId,granted_at AS grantedAt,revoked_by_party_id AS revokedByPartyId,revoked_at AS revokedAt FROM legal_matter_access WHERE matter_id=? ORDER BY status,access_role,party_id',
    [matterId]
  );
}

export async function createDueDiligenceMatter(
  context: CommandContext,
  input: {
    matterRef: string;
    title: string;
    opportunityId: string;
    opportunityVersion?: number;
    scopeSummary: string;
    ownerPartyId?: string;
    counselPartyId?: string;
    jurisdictionId?: string;
    privilegeClassification?: string;
    confidentialityClassification?: string;
  }
) {
  assertPermission(context, 'corporate.development.due_diligence.manage');
  const id = randomUUID();
  const createdAt = now();
  const ownerPartyId = input.ownerPartyId?.trim() || context.actorPartyId;
  const counselPartyId = input.counselPartyId?.trim() || null;

  await dbTransaction(async (connection) => {
    const opportunity = await queryOne<RowDataPacket & { id: string; aggregateVersion: number }>(
      'SELECT id,aggregate_version AS aggregateVersion FROM development_opportunities WHERE id=? AND tenant_id=?',
      [input.opportunityId, context.tenantId],
      connection
    );
    if (!opportunity) throw new Error('Development Opportunity not found.');
    if (
      input.opportunityVersion != null &&
      opportunity.aggregateVersion !== input.opportunityVersion
    ) {
      throw new Error('Due Diligence subject version does not match the Development Opportunity.');
    }

    await assertActiveParty(context, ownerPartyId, connection);
    if (counselPartyId) await assertActiveParty(context, counselPartyId, connection);
    const jurisdictionId = input.jurisdictionId?.trim() || null;
    if (jurisdictionId) {
      const jurisdiction = await queryOne<RowDataPacket & { id: string }>(
        "SELECT id FROM reference_jurisdictions WHERE id=? AND tenant_id=? AND status='ACTIVE'",
        [jurisdictionId, context.tenantId],
        connection
      );
      if (!jurisdiction) throw new Error('Active governed Jurisdiction not found.');
    }

    await executeMutation(
      "INSERT INTO legal_matters (id,tenant_id,matter_ref,matter_type,title,subject_type,subject_id,subject_version,scope_summary,owner_party_id,counsel_party_id,jurisdiction_id,privilege_classification,confidentiality_classification,status,aggregate_version,opened_at,closed_at,created_by_party_id,created_at,updated_at) VALUES (?,?,?,'DUE_DILIGENCE',?,'DEVELOPMENT_OPPORTUNITY',?,?,?,?,?,?,?,?,?,'OPENED',1,?,NULL,?,?,?)",
      [
        id,
        context.tenantId,
        code(input.matterRef, 'Legal Matter reference', 191),
        required(input.title, 'Legal Matter title'),
        input.opportunityId,
        String(input.opportunityVersion ?? opportunity.aggregateVersion),
        required(input.scopeSummary, 'Due Diligence scope'),
        ownerPartyId,
        counselPartyId,
        jurisdictionId,
        code(input.privilegeClassification ?? 'PRIVILEGED', 'Privilege classification', 64),
        code(
          input.confidentialityClassification ?? 'STRICTLY_CONFIDENTIAL',
          'Confidentiality classification',
          64
        ),
        createdAt,
        context.actorPartyId,
        createdAt,
        createdAt
      ],
      connection
    );

    const access = new Map<string, string>();
    access.set(context.actorPartyId, 'MATTER_MANAGER');
    access.set(ownerPartyId, 'MATTER_MANAGER');
    if (counselPartyId && !access.has(counselPartyId)) access.set(counselPartyId, 'COUNSEL');
    for (const [partyId, accessRole] of access) {
      await executeMutation(
        "INSERT INTO legal_matter_access (matter_id,party_id,access_role,status,granted_by_party_id,granted_at,revoked_by_party_id,revoked_at) VALUES (?,?,?,'ACTIVE',?,?,NULL,NULL)",
        [id, partyId, accessRole, context.actorPartyId, createdAt],
        connection
      );
    }

    for (const workstreamType of [
      'FINANCE',
      'OPERATIONS',
      'TECHNOLOGY',
      'PEOPLE',
      'LEGAL',
      'TAX',
      'COMMERCIAL_RISK'
    ]) {
      await executeMutation(
        "INSERT INTO legal_matter_workstreams (id,matter_id,workstream_type,status,risk_rating,findings_summary,conclusion,evidence_reference,owner_party_id,aggregate_version,created_at,updated_at) VALUES (?,?,?,'NOT_STARTED',NULL,NULL,NULL,NULL,?,1,?,?)",
        [randomUUID(), id, workstreamType, ownerPartyId, createdAt, createdAt],
        connection
      );
    }

    await matterEvidence(
      context,
      { id, aggregateVersion: 1 },
      'DUE_DILIGENCE_MATTER_OPENED',
      null,
      'OPENED',
      {
        matterRef: code(input.matterRef, 'Legal Matter reference', 191),
        subjectType: 'DEVELOPMENT_OPPORTUNITY',
        subjectId: input.opportunityId,
        workstreamCount: 7
      },
      connection
    );
  });
  return id;
}

export async function updateDueDiligenceWorkstream(
  context: CommandContext,
  matterId: string,
  workstreamType: string,
  expectedWorkstreamVersion: number,
  input: {
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETE' | string;
    riskRating?: string;
    findingsSummary?: string;
    conclusion?: string;
    evidenceReference?: string;
    ownerPartyId?: string;
  }
) {
  assertPermission(context, 'corporate.development.due_diligence.manage');
  return dbTransaction(async (connection) => {
    const matter = await getMatter(context, matterId, connection, true);
    assertAccessRole(matter, contributors);
    if (['RESOLVED', 'CLOSED'].includes(matter.status)) {
      throw new Error('Resolved or closed Due Diligence Matters cannot be changed.');
    }

    const type = code(workstreamType, 'Due Diligence workstream type', 64);
    const workstream = await queryOne<
      RowDataPacket & { id: string; status: string; aggregateVersion: number }
    >(
      'SELECT id,status,aggregate_version AS aggregateVersion FROM legal_matter_workstreams WHERE matter_id=? AND workstream_type=? FOR UPDATE',
      [matterId, type],
      connection
    );
    if (!workstream) throw new Error('Due Diligence workstream not found.');
    if (workstream.aggregateVersion !== expectedWorkstreamVersion) {
      throw new Error('Due Diligence workstream changed before the update was applied.');
    }

    const ownerPartyId = input.ownerPartyId?.trim() || null;
    if (ownerPartyId) await assertActiveParty(context, ownerPartyId, connection);
    const nextStatus = code(input.status, 'Due Diligence workstream status', 32);
    const nextWorkstreamVersion = expectedWorkstreamVersion + 1;
    const nextMatterVersion = matter.aggregateVersion + 1;
    const updatedAt = now();

    const result = await executeMutation(
      'UPDATE legal_matter_workstreams SET status=?,risk_rating=?,findings_summary=?,conclusion=?,evidence_reference=?,owner_party_id=COALESCE(?,owner_party_id),aggregate_version=?,updated_at=? WHERE id=? AND matter_id=? AND aggregate_version=?',
      [
        nextStatus,
        input.riskRating?.trim() ? code(input.riskRating, 'Due Diligence risk rating', 32) : null,
        input.findingsSummary?.trim() || null,
        input.conclusion?.trim() || null,
        input.evidenceReference?.trim() || null,
        ownerPartyId,
        nextWorkstreamVersion,
        updatedAt,
        workstream.id,
        matterId,
        expectedWorkstreamVersion
      ],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Due Diligence workstream version conflict.');

    const matterStatus = matter.status === 'OPENED' ? 'ACTIVE' : matter.status;
    const matterResult = await executeMutation(
      'UPDATE legal_matters SET status=?,aggregate_version=?,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?',
      [
        matterStatus,
        nextMatterVersion,
        updatedAt,
        matterId,
        context.tenantId,
        matter.aggregateVersion
      ],
      connection
    );
    if (matterResult.affectedRows !== 1) throw new Error('Legal Matter version conflict.');

    await matterEvidence(
      context,
      { id: matterId, aggregateVersion: nextMatterVersion },
      'DUE_DILIGENCE_WORKSTREAM_UPDATED',
      matter.status,
      matterStatus,
      {
        workstreamType: type,
        workstreamStatus: nextStatus,
        riskRating: input.riskRating?.trim()
          ? code(input.riskRating, 'Due Diligence risk rating', 32)
          : null
      },
      connection
    );
    return { matterVersion: nextMatterVersion, workstreamVersion: nextWorkstreamVersion };
  });
}

export async function completeDueDiligenceMatter(
  context: CommandContext,
  matterId: string,
  expectedVersion: number
) {
  assertPermission(context, 'corporate.development.due_diligence.manage');
  return dbTransaction(async (connection) => {
    const matter = await getMatter(context, matterId, connection, true);
    assertAccessRole(matter, managers);
    if (matter.aggregateVersion !== expectedVersion) {
      throw new Error('Due Diligence Matter changed before completion.');
    }
    if (!['OPENED', 'ASSESSMENT', 'ACTIVE'].includes(matter.status)) {
      throw new Error('Due Diligence Matter is not active.');
    }

    const incomplete = await queryOne<RowDataPacket & { count: number }>(
      "SELECT COUNT(*) AS count FROM legal_matter_workstreams WHERE matter_id=? AND status<>'COMPLETE'",
      [matterId],
      connection
    );
    if (Number(incomplete?.count ?? 0) !== 0) {
      throw new Error(
        'Every Due Diligence workstream must be complete before the matter resolves.'
      );
    }

    const nextVersion = expectedVersion + 1;
    const updatedAt = now();
    const result = await executeMutation(
      "UPDATE legal_matters SET status='RESOLVED',aggregate_version=?,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [nextVersion, updatedAt, matterId, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Legal Matter version conflict.');
    await matterEvidence(
      context,
      { id: matterId, aggregateVersion: nextVersion },
      'DUE_DILIGENCE_MATTER_RESOLVED',
      matter.status,
      'RESOLVED',
      { workstreamsComplete: 7 },
      connection
    );
    return nextVersion;
  });
}

export async function closeDueDiligenceMatter(
  context: CommandContext,
  matterId: string,
  expectedVersion: number
) {
  assertPermission(context, 'corporate.development.due_diligence.manage');
  return dbTransaction(async (connection) => {
    const matter = await getMatter(context, matterId, connection, true);
    assertAccessRole(matter, managers);
    if (matter.aggregateVersion !== expectedVersion || matter.status !== 'RESOLVED') {
      throw new Error('Only the current resolved Due Diligence Matter may be closed.');
    }
    const nextVersion = expectedVersion + 1;
    const closedAt = now();
    const result = await executeMutation(
      "UPDATE legal_matters SET status='CLOSED',aggregate_version=?,closed_at=?,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=? AND status='RESOLVED'",
      [nextVersion, closedAt, closedAt, matterId, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Legal Matter version conflict.');
    await matterEvidence(
      context,
      { id: matterId, aggregateVersion: nextVersion },
      'DUE_DILIGENCE_MATTER_CLOSED',
      'RESOLVED',
      'CLOSED',
      {},
      connection
    );
    return nextVersion;
  });
}

export async function grantDueDiligenceAccess(
  context: CommandContext,
  matterId: string,
  partyId: string,
  accessRole: 'MATTER_MANAGER' | 'COUNSEL' | 'REVIEWER' | string
) {
  assertPermission(context, 'corporate.development.due_diligence.access.manage');
  return dbTransaction(async (connection) => {
    const matter = await getMatter(context, matterId, connection);
    assertAccessRole(matter, managers);
    await assertActiveParty(context, partyId, connection);
    const grantedAt = now();
    const role = code(accessRole, 'Legal Matter access role', 32);
    await executeMutation(
      "INSERT INTO legal_matter_access (matter_id,party_id,access_role,status,granted_by_party_id,granted_at,revoked_by_party_id,revoked_at) VALUES (?,?,?,'ACTIVE',?,?,NULL,NULL) ON DUPLICATE KEY UPDATE access_role=VALUES(access_role),status='ACTIVE',granted_by_party_id=VALUES(granted_by_party_id),granted_at=VALUES(granted_at),revoked_by_party_id=NULL,revoked_at=NULL",
      [matterId, partyId, role, context.actorPartyId, grantedAt],
      connection
    );
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-22-LEGAL',
        objectType: 'LegalMatter',
        objectId: matterId,
        action: 'LEGAL_MATTER_ACCESS_GRANTED',
        fromState: matter.status,
        toState: matter.status
      },
      connection
    );
  });
}

export async function revokeDueDiligenceAccess(
  context: CommandContext,
  matterId: string,
  partyId: string
) {
  assertPermission(context, 'corporate.development.due_diligence.access.manage');
  return dbTransaction(async (connection) => {
    const matter = await getMatter(context, matterId, connection);
    assertAccessRole(matter, managers);
    if (partyId === matter.ownerPartyId) {
      throw new Error('The Legal Matter owner must retain active access.');
    }
    if (partyId === context.actorPartyId) {
      throw new Error('A Matter Manager cannot revoke their own access through this command.');
    }
    const revokedAt = now();
    const result = await executeMutation(
      "UPDATE legal_matter_access SET status='REVOKED',revoked_by_party_id=?,revoked_at=? WHERE matter_id=? AND party_id=? AND status='ACTIVE'",
      [context.actorPartyId, revokedAt, matterId, partyId],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Active Legal Matter access grant not found.');
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-22-LEGAL',
        objectType: 'LegalMatter',
        objectId: matterId,
        action: 'LEGAL_MATTER_ACCESS_REVOKED',
        fromState: matter.status,
        toState: matter.status
      },
      connection
    );
  });
}
