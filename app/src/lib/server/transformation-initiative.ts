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

export type TransformationInitiative = {
  id: string;
  initiativeRef: string;
  initiativeType: string;
  title: string;
  purposeOutcomes: string;
  sponsorPartyId: string;
  ownerPartyId: string;
  affectedScope: string;
  benefitsSummary: string;
  impactsSummary: string;
  readinessCriteria: string;
  adoptionCriteria: string;
  sourceSubjectType: string | null;
  sourceSubjectId: string | null;
  status: string;
  aggregateVersion: number;
  updatedAt: string;
};

export type TransformationInitiativeWorkstream = {
  id: string;
  workstreamType: string;
  title: string;
  ownerPartyId: string;
  scopeSummary: string;
  successCriteria: string;
  status: string;
  progressPercent: string;
  aggregateVersion: number;
  updatedAt: string;
};

const initiativeSelect =
  'SELECT id,initiative_ref AS initiativeRef,initiative_type AS initiativeType,title,purpose_outcomes AS purposeOutcomes,sponsor_party_id AS sponsorPartyId,owner_party_id AS ownerPartyId,affected_scope AS affectedScope,benefits_summary AS benefitsSummary,impacts_summary AS impactsSummary,readiness_criteria AS readinessCriteria,adoption_criteria AS adoptionCriteria,source_subject_type AS sourceSubjectType,source_subject_id AS sourceSubjectId,status,aggregate_version AS aggregateVersion,updated_at AS updatedAt FROM transformation_initiatives';

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

async function getInitiative(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & TransformationInitiative>(
    initiativeSelect + ' WHERE id=? AND tenant_id=?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Transformation Initiative not found.');
  return row;
}

async function evidence(
  context: CommandContext,
  initiativeId: string,
  aggregateVersion: number,
  eventType: string,
  fromState: string | null,
  toState: string,
  payload: Record<string, unknown>,
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-26-TRANSFORMATION',
      objectType: 'TransformationInitiative',
      objectId: initiativeId,
      action: eventType,
      fromState: fromState ?? undefined,
      toState
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: 'AGG-26-TRANSFORMATION',
      aggregateType: 'TransformationInitiative',
      aggregateObjectId: initiativeId,
      aggregateVersion,
      eventType,
      topic: 'nublox.transformation.initiative',
      payload
    },
    executor
  );
}

export async function listIntegrationInitiatives(context: CommandContext) {
  assertPermission(context, 'corporate.development.read');
  return queryRows<RowDataPacket & TransformationInitiative>(
    initiativeSelect +
      " WHERE tenant_id=? AND initiative_type='M_AND_A_INTEGRATION' ORDER BY updated_at DESC,initiative_ref",
    [context.tenantId]
  );
}

export async function listIntegrationWorkstreams(
  context: CommandContext,
  initiativeId: string
) {
  assertPermission(context, 'corporate.development.read');
  const initiative = await getInitiative(context, initiativeId);
  if (initiative.initiativeType !== 'M_AND_A_INTEGRATION') {
    throw new Error('Transformation Initiative is not an M&A Integration initiative.');
  }
  return queryRows<RowDataPacket & TransformationInitiativeWorkstream>(
    'SELECT id,workstream_type AS workstreamType,title,owner_party_id AS ownerPartyId,scope_summary AS scopeSummary,success_criteria AS successCriteria,status,progress_percent AS progressPercent,aggregate_version AS aggregateVersion,updated_at AS updatedAt FROM transformation_initiative_workstreams WHERE initiative_id=? ORDER BY workstream_type',
    [initiativeId]
  );
}

export async function createIntegrationInitiative(
  context: CommandContext,
  input: {
    initiativeRef: string;
    title: string;
    businessCaseId: string;
    purposeOutcomes: string;
    sponsorPartyId?: string;
    ownerPartyId?: string;
    affectedScope: string;
    benefitsSummary: string;
    impactsSummary: string;
    readinessCriteria: string;
    adoptionCriteria: string;
    workstreams?: Array<{
      workstreamType: string;
      title: string;
      ownerPartyId?: string;
      scopeSummary: string;
      successCriteria: string;
    }>;
  }
) {
  assertPermission(context, 'corporate.development.integration.manage');
  const id = randomUUID();
  const createdAt = now();
  const sponsorPartyId = input.sponsorPartyId?.trim() || context.actorPartyId;
  const ownerPartyId = input.ownerPartyId?.trim() || context.actorPartyId;

  await dbTransaction(async (connection) => {
    const businessCase = await queryOne<RowDataPacket & { id: string; status: string }>(
      'SELECT id,status FROM business_cases WHERE id=? AND tenant_id=?',
      [input.businessCaseId, context.tenantId],
      connection
    );
    if (!businessCase) throw new Error('Source Business Case not found.');
    if (!['APPROVED', 'CLOSED'].includes(businessCase.status)) {
      throw new Error('Integration may only mobilise from an approved Corporate Development Business Case.');
    }

    await assertActiveParty(context, sponsorPartyId, connection);
    await assertActiveParty(context, ownerPartyId, connection);

    await executeMutation(
      "INSERT INTO transformation_initiatives (id,tenant_id,initiative_ref,initiative_type,title,purpose_outcomes,sponsor_party_id,owner_party_id,affected_scope,benefits_summary,impacts_summary,readiness_criteria,adoption_criteria,source_subject_type,source_subject_id,status,aggregate_version,created_by_party_id,created_at,updated_at) VALUES (?,?,?,'M_AND_A_INTEGRATION',?,?,?,?,?,?,?,?,?,'BUSINESS_CASE',?,'PROPOSED',1,?,?,?)",
      [
        id,
        context.tenantId,
        code(input.initiativeRef, 'Transformation Initiative reference', 191),
        required(input.title, 'Transformation Initiative title'),
        required(input.purposeOutcomes, 'Transformation purpose/outcomes'),
        sponsorPartyId,
        ownerPartyId,
        required(input.affectedScope, 'Transformation affected scope'),
        required(input.benefitsSummary, 'Transformation benefits'),
        required(input.impactsSummary, 'Transformation impacts'),
        required(input.readinessCriteria, 'Transformation readiness criteria'),
        required(input.adoptionCriteria, 'Transformation adoption criteria'),
        input.businessCaseId,
        context.actorPartyId,
        createdAt,
        createdAt
      ],
      connection
    );

    const workstreams =
      input.workstreams?.length
        ? input.workstreams
        : [
            {
              workstreamType: 'ORGANISATION',
              title: 'Organisation integration',
              scopeSummary: 'Integrate organisation structure, accountabilities and operating interfaces.',
              successCriteria: 'Target organisation arrangements are effective and governed.'
            },
            {
              workstreamType: 'SYSTEMS',
              title: 'Systems consolidation',
              scopeSummary: 'Consolidate technology and application landscape against approved target state.',
              successCriteria: 'Target systems are transitioned with controlled continuity and data integrity.'
            },
            {
              workstreamType: 'POLICY',
              title: 'Policy harmonisation',
              scopeSummary: 'Harmonise enterprise policy and governance requirements.',
              successCriteria: 'Required policies are governed, issued and effective for the combined organisation.'
            }
          ];

    const seen = new Set<string>();
    for (const workstream of workstreams) {
      const type = code(workstream.workstreamType, 'Integration workstream type', 64);
      if (seen.has(type)) throw new Error('Integration workstream types must be unique.');
      seen.add(type);
      const workstreamOwner = workstream.ownerPartyId?.trim() || ownerPartyId;
      await assertActiveParty(context, workstreamOwner, connection);
      await executeMutation(
        "INSERT INTO transformation_initiative_workstreams (id,initiative_id,workstream_type,title,owner_party_id,scope_summary,success_criteria,status,progress_percent,aggregate_version,created_at,updated_at) VALUES (?,?,?,?,?,?,?,'PLANNED',0,1,?,?)",
        [
          randomUUID(),
          id,
          type,
          required(workstream.title, 'Integration workstream title'),
          workstreamOwner,
          required(workstream.scopeSummary, 'Integration workstream scope'),
          required(workstream.successCriteria, 'Integration workstream success criteria'),
          createdAt,
          createdAt
        ],
        connection
      );
    }

    await evidence(
      context,
      id,
      1,
      'INTEGRATION_INITIATIVE_CREATED',
      null,
      'PROPOSED',
      { sourceBusinessCaseId: input.businessCaseId, workstreamCount: workstreams.length },
      connection
    );
  });
  return id;
}

export async function transitionIntegrationInitiative(
  context: CommandContext,
  initiativeId: string,
  expectedVersion: number,
  action: 'ASSESS' | 'PRIORITISE' | 'APPROVE' | 'MOBILISE' | 'ACTIVATE' | 'TRANSITION' | 'COMPLETE' | 'STOP'
) {
  assertPermission(context, 'corporate.development.integration.manage');
  const transitions: Record<string, { from: string[]; to: string }> = {
    ASSESS: { from: ['PROPOSED'], to: 'ASSESSMENT' },
    PRIORITISE: { from: ['ASSESSMENT'], to: 'PRIORITISED' },
    APPROVE: { from: ['PRIORITISED'], to: 'APPROVED' },
    MOBILISE: { from: ['APPROVED'], to: 'MOBILISING' },
    ACTIVATE: { from: ['MOBILISING'], to: 'ACTIVE' },
    TRANSITION: { from: ['ACTIVE'], to: 'TRANSITIONING' },
    COMPLETE: { from: ['TRANSITIONING', 'ACTIVE'], to: 'COMPLETED' },
    STOP: {
      from: ['PROPOSED', 'ASSESSMENT', 'PRIORITISED', 'APPROVED', 'MOBILISING', 'ACTIVE', 'TRANSITIONING'],
      to: 'STOPPED'
    }
  };
  const transition = transitions[action];
  if (!transition) throw new Error('Unsupported Integration Initiative transition.');

  return dbTransaction(async (connection) => {
    const initiative = await getInitiative(context, initiativeId, connection, true);
    if (initiative.initiativeType !== 'M_AND_A_INTEGRATION') {
      throw new Error('Transformation Initiative is not an M&A Integration initiative.');
    }
    if (initiative.aggregateVersion !== expectedVersion) {
      throw new Error('Integration Initiative changed before the transition was applied.');
    }
    if (!transition.from.includes(initiative.status)) {
      throw new Error('Integration Initiative cannot perform ' + action + ' from ' + initiative.status + '.');
    }

    if (action === 'COMPLETE') {
      const incomplete = await queryOne<RowDataPacket & { count: number }>(
        "SELECT COUNT(*) AS count FROM transformation_initiative_workstreams WHERE initiative_id=? AND status<>'COMPLETED'",
        [initiativeId],
        connection
      );
      if (Number(incomplete?.count ?? 0) !== 0) {
        throw new Error('Every Integration workstream must be complete before the initiative completes.');
      }
    }

    const nextVersion = expectedVersion + 1;
    const updatedAt = now();
    const result = await executeMutation(
      'UPDATE transformation_initiatives SET status=?,aggregate_version=?,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?',
      [transition.to, nextVersion, updatedAt, initiativeId, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Integration Initiative version conflict.');
    await evidence(
      context,
      initiativeId,
      nextVersion,
      'INTEGRATION_INITIATIVE_' + action,
      initiative.status,
      transition.to,
      {},
      connection
    );
    return nextVersion;
  });
}

export async function updateIntegrationWorkstream(
  context: CommandContext,
  initiativeId: string,
  workstreamType: string,
  expectedWorkstreamVersion: number,
  input: {
    status: 'PLANNED' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | string;
    progressPercent: number;
    ownerPartyId?: string;
    scopeSummary?: string;
    successCriteria?: string;
  }
) {
  assertPermission(context, 'corporate.development.integration.manage');
  if (!Number.isFinite(input.progressPercent) || input.progressPercent < 0 || input.progressPercent > 100) {
    throw new Error('Integration workstream progress must be between 0 and 100.');
  }

  return dbTransaction(async (connection) => {
    const initiative = await getInitiative(context, initiativeId, connection, true);
    if (initiative.initiativeType !== 'M_AND_A_INTEGRATION') {
      throw new Error('Transformation Initiative is not an M&A Integration initiative.');
    }
    if (['COMPLETED', 'STOPPED', 'CLOSED'].includes(initiative.status)) {
      throw new Error('Completed or stopped Integration Initiatives cannot be changed.');
    }

    const type = code(workstreamType, 'Integration workstream type', 64);
    const workstream = await queryOne<
      RowDataPacket & {
        id: string;
        status: string;
        ownerPartyId: string;
        scopeSummary: string;
        successCriteria: string;
        aggregateVersion: number;
      }
    >(
      'SELECT id,status,owner_party_id AS ownerPartyId,scope_summary AS scopeSummary,success_criteria AS successCriteria,aggregate_version AS aggregateVersion FROM transformation_initiative_workstreams WHERE initiative_id=? AND workstream_type=? FOR UPDATE',
      [initiativeId, type],
      connection
    );
    if (!workstream) throw new Error('Integration workstream not found.');
    if (workstream.aggregateVersion !== expectedWorkstreamVersion) {
      throw new Error('Integration workstream changed before the update was applied.');
    }

    const ownerPartyId = input.ownerPartyId?.trim() || workstream.ownerPartyId;
    await assertActiveParty(context, ownerPartyId, connection);
    const nextStatus = code(input.status, 'Integration workstream status', 32);
    const nextProgress = nextStatus === 'COMPLETED' ? 100 : input.progressPercent;
    const nextWorkstreamVersion = expectedWorkstreamVersion + 1;
    const nextInitiativeVersion = initiative.aggregateVersion + 1;
    const updatedAt = now();

    const result = await executeMutation(
      'UPDATE transformation_initiative_workstreams SET status=?,progress_percent=?,owner_party_id=?,scope_summary=?,success_criteria=?,aggregate_version=?,updated_at=? WHERE id=? AND initiative_id=? AND aggregate_version=?',
      [
        nextStatus,
        nextProgress,
        ownerPartyId,
        input.scopeSummary?.trim() || workstream.scopeSummary,
        input.successCriteria?.trim() || workstream.successCriteria,
        nextWorkstreamVersion,
        updatedAt,
        workstream.id,
        initiativeId,
        expectedWorkstreamVersion
      ],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Integration workstream version conflict.');

    const initiativeResult = await executeMutation(
      'UPDATE transformation_initiatives SET aggregate_version=?,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?',
      [
        nextInitiativeVersion,
        updatedAt,
        initiativeId,
        context.tenantId,
        initiative.aggregateVersion
      ],
      connection
    );
    if (initiativeResult.affectedRows !== 1) throw new Error('Integration Initiative version conflict.');

    await evidence(
      context,
      initiativeId,
      nextInitiativeVersion,
      'INTEGRATION_WORKSTREAM_UPDATED',
      initiative.status,
      initiative.status,
      { workstreamType: type, status: nextStatus, progressPercent: nextProgress },
      connection
    );
    return { initiativeVersion: nextInitiativeVersion, workstreamVersion: nextWorkstreamVersion };
  });
}
