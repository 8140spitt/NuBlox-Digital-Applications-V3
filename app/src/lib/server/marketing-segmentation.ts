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
import { code, domainEvidence, finiteNumber, json, now, required, timestamp } from '$lib/server/marketing-runtime';

export type MarketSegment = {
  id: string;
  segmentRef: string;
  name: string;
  description: string;
  status: string;
  aggregateVersion: number;
  currentVersionNo: number;
  updatedAt: string;
};

export type MarketSegmentVersion = {
  id: string;
  segmentId: string;
  versionNo: number;
  lifecycleStatus: string;
  criteria: unknown;
  geography: unknown;
  sector: unknown;
  profile: unknown;
  valueAssessment: unknown;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  activatedAt: string | null;
};

const segmentSelect =
  'SELECT id,segment_ref AS segmentRef,name,description,status,aggregate_version AS aggregateVersion,current_version_no AS currentVersionNo,updated_at AS updatedAt FROM market_segments';

export async function getMarketSegment(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  assertPermission(context, 'marketing.read');
  const row = await queryOne<RowDataPacket & MarketSegment>(
    segmentSelect + ' WHERE id=? AND tenant_id=?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Market Segment not found.');
  return row;
}

export async function getMarketSegmentVersion(
  context: CommandContext,
  segmentId: string,
  versionNo: number,
  executor?: DbExecutor,
  forUpdate = false
) {
  assertPermission(context, 'marketing.read');
  const row = await queryOne<RowDataPacket & MarketSegmentVersion>(
    `SELECT id,segment_id AS segmentId,version_no AS versionNo,lifecycle_status AS lifecycleStatus,
            criteria_json AS criteria,geography_json AS geography,sector_json AS sector,
            profile_json AS profile,value_assessment_json AS valueAssessment,
            effective_from AS effectiveFrom,effective_to AS effectiveTo,created_at AS createdAt,
            activated_at AS activatedAt
       FROM market_segment_versions
      WHERE tenant_id=? AND segment_id=? AND version_no=?` +
      (forUpdate ? ' FOR UPDATE' : ''),
    [context.tenantId, segmentId, versionNo],
    executor
  );
  if (!row) throw new Error('Market Segment version not found.');
  return row;
}

export async function listMarketSegments(context: CommandContext) {
  assertPermission(context, 'marketing.read');
  return queryRows<RowDataPacket & MarketSegment>(
    segmentSelect + ' WHERE tenant_id=? ORDER BY updated_at DESC,segment_ref',
    [context.tenantId]
  );
}

export async function listMarketSegmentVersions(context: CommandContext, segmentId: string) {
  assertPermission(context, 'marketing.read');
  await getMarketSegment(context, segmentId);
  return queryRows<RowDataPacket & MarketSegmentVersion>(
    `SELECT id,segment_id AS segmentId,version_no AS versionNo,lifecycle_status AS lifecycleStatus,
            criteria_json AS criteria,geography_json AS geography,sector_json AS sector,
            profile_json AS profile,value_assessment_json AS valueAssessment,
            effective_from AS effectiveFrom,effective_to AS effectiveTo,created_at AS createdAt,
            activated_at AS activatedAt
       FROM market_segment_versions
      WHERE tenant_id=? AND segment_id=?
      ORDER BY version_no DESC`,
    [context.tenantId, segmentId]
  );
}

export async function listMarketSegmentMemberships(
  context: CommandContext,
  segmentVersionId: string
) {
  assertPermission(context, 'marketing.read');
  return queryRows<
    RowDataPacket & {
      id: string;
      subjectType: string;
      subjectId: string;
      membershipStatus: string;
      score: string | null;
      basis: unknown;
      evaluatedAt: string;
    }
  >(
    `SELECT id,subject_type AS subjectType,subject_id AS subjectId,
            membership_status AS membershipStatus,score,basis_json AS basis,
            evaluated_at AS evaluatedAt
       FROM market_segment_memberships
      WHERE tenant_id=? AND segment_version_id=?
      ORDER BY membership_status,score DESC,evaluated_at DESC`,
    [context.tenantId, segmentVersionId]
  );
}

export async function createMarketSegment(
  context: CommandContext,
  input: {
    segmentRef: string;
    name: string;
    description: string;
    criteria?: unknown;
    geography?: unknown;
    sector?: unknown;
    profile?: unknown;
    valueAssessment?: unknown;
    effectiveFrom?: string;
  }
) {
  assertPermission(context, 'marketing.segment.manage');
  const id = randomUUID();
  const versionId = randomUUID();
  const createdAt = now();
  const effectiveFrom = timestamp(input.effectiveFrom, 'Segment effective from') ?? createdAt;
  return dbTransaction(async (connection) => {
    await executeMutation(
      `INSERT INTO market_segments
        (id,tenant_id,segment_ref,name,description,status,aggregate_version,current_version_no,
         created_by_party_id,created_at,updated_at)
       VALUES (?,?,?,?,?,'DRAFT',1,1,?,?,?)`,
      [
        id,
        context.tenantId,
        code(input.segmentRef, 'Segment reference', 191),
        required(input.name, 'Segment name', 500),
        required(input.description, 'Segment description'),
        context.actorPartyId,
        createdAt,
        createdAt
      ],
      connection
    );
    await executeMutation(
      `INSERT INTO market_segment_versions
        (id,tenant_id,segment_id,version_no,lifecycle_status,criteria_json,geography_json,sector_json,
         profile_json,value_assessment_json,effective_from,effective_to,created_by_party_id,created_at,activated_at)
       VALUES (?,?,?,1,'DRAFT',?,?,?,?,?,?,NULL,?,?,NULL)`,
      [
        versionId,
        context.tenantId,
        id,
        json(input.criteria),
        json(input.geography),
        json(input.sector),
        json(input.profile),
        json(input.valueAssessment),
        effectiveFrom,
        context.actorPartyId,
        createdAt
      ],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-03-MARKET-INSIGHT',
        aggregateType: 'MarketSegment',
        objectType: 'market_segment',
        objectId: id,
        aggregateVersion: 1,
        eventType: 'MARKET_SEGMENT_CREATED',
        topic: 'nublox.market.segment',
        toState: 'DRAFT',
        payload: { versionNo: 1 }
      },
      connection
    );
    return id;
  });
}

export async function reviseMarketSegment(
  context: CommandContext,
  segmentId: string,
  expectedVersion: number,
  input: {
    description?: string;
    criteria?: unknown;
    geography?: unknown;
    sector?: unknown;
    profile?: unknown;
    valueAssessment?: unknown;
    effectiveFrom?: string;
  }
) {
  assertPermission(context, 'marketing.segment.manage');
  return dbTransaction(async (connection) => {
    const segment = await getMarketSegment(context, segmentId, connection, true);
    if (segment.aggregateVersion !== expectedVersion) throw new Error('Market Segment changed.');
    if (segment.status === 'RETIRED') throw new Error('Retired Market Segments cannot be revised.');
    const nextVersionNo = segment.currentVersionNo + 1;
    const current = await getMarketSegmentVersion(
      context,
      segment.id,
      segment.currentVersionNo,
      connection,
      true
    );
    const createdAt = now();
    await executeMutation(
      `INSERT INTO market_segment_versions
        (id,tenant_id,segment_id,version_no,lifecycle_status,criteria_json,geography_json,sector_json,
         profile_json,value_assessment_json,effective_from,effective_to,created_by_party_id,created_at,activated_at)
       VALUES (?,?,?,?,'DRAFT',?,?,?,?,?,?,NULL,?,?,NULL)`,
      [
        randomUUID(),
        context.tenantId,
        segment.id,
        nextVersionNo,
        json(input.criteria ?? current.criteria),
        json(input.geography ?? current.geography),
        json(input.sector ?? current.sector),
        json(input.profile ?? current.profile),
        json(input.valueAssessment ?? current.valueAssessment),
        timestamp(input.effectiveFrom, 'Segment effective from') ?? createdAt,
        context.actorPartyId,
        createdAt
      ],
      connection
    );
    await executeMutation(
      `UPDATE market_segments
          SET description=COALESCE(?,description),aggregate_version=aggregate_version+1,
              current_version_no=?,updated_at=?
        WHERE id=? AND tenant_id=? AND aggregate_version=?`,
      [
        input.description?.trim() || null,
        nextVersionNo,
        createdAt,
        segment.id,
        context.tenantId,
        expectedVersion
      ],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-03-MARKET-INSIGHT',
        aggregateType: 'MarketSegment',
        objectType: 'market_segment',
        objectId: segment.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'MARKET_SEGMENT_REVISED',
        topic: 'nublox.market.segment',
        fromState: segment.status,
        toState: segment.status,
        payload: { versionNo: nextVersionNo }
      },
      connection
    );
    return nextVersionNo;
  });
}

export async function activateMarketSegment(
  context: CommandContext,
  segmentId: string,
  expectedVersion: number
) {
  assertPermission(context, 'marketing.segment.manage');
  return dbTransaction(async (connection) => {
    const segment = await getMarketSegment(context, segmentId, connection, true);
    if (segment.aggregateVersion !== expectedVersion) throw new Error('Market Segment changed.');
    const current = await getMarketSegmentVersion(
      context,
      segment.id,
      segment.currentVersionNo,
      connection,
      true
    );
    if (current.lifecycleStatus !== 'DRAFT') {
      throw new Error('Only a draft Market Segment version can be activated.');
    }
    const activatedAt = now();
    await executeMutation(
      `UPDATE market_segment_versions
          SET lifecycle_status='SUPERSEDED',effective_to=?
        WHERE tenant_id=? AND segment_id=? AND lifecycle_status='ACTIVE'`,
      [activatedAt, context.tenantId, segment.id],
      connection
    );
    await executeMutation(
      `UPDATE market_segment_versions
          SET lifecycle_status='ACTIVE',activated_at=?
        WHERE id=? AND tenant_id=?`,
      [activatedAt, current.id, context.tenantId],
      connection
    );
    await executeMutation(
      `UPDATE market_segments
          SET status='ACTIVE',aggregate_version=aggregate_version+1,updated_at=?
        WHERE id=? AND tenant_id=? AND aggregate_version=?`,
      [activatedAt, segment.id, context.tenantId, expectedVersion],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-03-MARKET-INSIGHT',
        aggregateType: 'MarketSegment',
        objectType: 'market_segment',
        objectId: segment.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'MARKET_SEGMENT_ACTIVATED',
        topic: 'nublox.market.segment',
        fromState: segment.status,
        toState: 'ACTIVE',
        payload: { versionNo: current.versionNo }
      },
      connection
    );
  });
}

async function assertSegmentSubject(
  context: CommandContext,
  subjectType: string,
  subjectId: string,
  executor: DbExecutor
) {
  const type = code(subjectType, 'Segment subject type');
  if (type === 'PARTY') {
    const row = await queryOne<RowDataPacket & { id: string }>(
      'SELECT id FROM parties WHERE tenant_id=? AND id=?',
      [context.tenantId, subjectId],
      executor
    );
    if (!row) throw new Error('Segment Party subject not found.');
    return type;
  }
  if (type === 'PARTY_RELATIONSHIP') {
    const row = await queryOne<RowDataPacket & { id: string }>(
      'SELECT id FROM party_relationships WHERE tenant_id=? AND id=?',
      [context.tenantId, subjectId],
      executor
    );
    if (!row) throw new Error('Segment Party Relationship subject not found.');
    return type;
  }
  if (type === 'LEAD') {
    const row = await queryOne<RowDataPacket & { id: string }>(
      'SELECT id FROM leads WHERE tenant_id=? AND id=?',
      [context.tenantId, subjectId],
      executor
    );
    if (!row) throw new Error('Segment Lead subject not found.');
    return type;
  }
  throw new Error('Segment subject type must be PARTY, PARTY_RELATIONSHIP or LEAD.');
}

export async function evaluateSegmentMembership(
  context: CommandContext,
  segmentId: string,
  versionNo: number,
  input: {
    subjectType: string;
    subjectId: string;
    membershipStatus?: string;
    score?: number;
    basis?: unknown;
  }
) {
  assertPermission(context, 'marketing.segment.manage');
  return dbTransaction(async (connection) => {
    const version = await getMarketSegmentVersion(context, segmentId, versionNo, connection);
    const subjectType = await assertSegmentSubject(
      context,
      input.subjectType,
      required(input.subjectId, 'Segment subject ID', 191),
      connection
    );
    const membershipStatus = code(input.membershipStatus || 'INCLUDED', 'Membership status');
    if (!['INCLUDED', 'EXCLUDED'].includes(membershipStatus)) {
      throw new Error('Membership status must be INCLUDED or EXCLUDED.');
    }
    const score = finiteNumber(input.score, 'Membership score');
    if (score != null && (score < 0 || score > 100)) {
      throw new Error('Membership score must be between 0 and 100.');
    }
    const evaluatedAt = now();
    const existing = await queryOne<RowDataPacket & { id: string }>(
      `SELECT id FROM market_segment_memberships
        WHERE segment_version_id=? AND subject_type=? AND subject_id=? FOR UPDATE`,
      [version.id, subjectType, input.subjectId],
      connection
    );
    if (existing) {
      await executeMutation(
        `UPDATE market_segment_memberships
            SET membership_status=?,score=?,basis_json=?,evaluated_at=?
          WHERE id=? AND tenant_id=?`,
        [
          membershipStatus,
          score,
          json(input.basis),
          evaluatedAt,
          existing.id,
          context.tenantId
        ],
        connection
      );
    } else {
      await executeMutation(
        `INSERT INTO market_segment_memberships
          (id,tenant_id,segment_version_id,subject_type,subject_id,membership_status,score,basis_json,evaluated_at,created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          randomUUID(),
          context.tenantId,
          version.id,
          subjectType,
          input.subjectId,
          membershipStatus,
          score,
          json(input.basis),
          evaluatedAt,
          evaluatedAt
        ],
        connection
      );
    }
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-03-MARKET-INSIGHT',
        aggregateType: 'MarketSegment',
        objectType: 'market_segment',
        objectId: segmentId,
        aggregateVersion: version.versionNo,
        eventType: 'MARKET_SEGMENT_MEMBERSHIP_EVALUATED',
        topic: 'nublox.market.segment',
        payload: {
          segmentVersionNo: version.versionNo,
          subjectType,
          subjectId: input.subjectId,
          membershipStatus,
          score
        }
      },
      connection
    );
  });
}

export async function retireMarketSegment(
  context: CommandContext,
  segmentId: string,
  expectedVersion: number
) {
  assertPermission(context, 'marketing.segment.manage');
  return dbTransaction(async (connection) => {
    const segment = await getMarketSegment(context, segmentId, connection, true);
    if (segment.aggregateVersion !== expectedVersion) throw new Error('Market Segment changed.');
    if (segment.status === 'RETIRED') return;
    const retiredAt = now();
    await executeMutation(
      `UPDATE market_segment_versions
          SET lifecycle_status=CASE WHEN lifecycle_status='ACTIVE' THEN 'RETIRED' ELSE lifecycle_status END,
              effective_to=CASE WHEN lifecycle_status='ACTIVE' THEN ? ELSE effective_to END
        WHERE tenant_id=? AND segment_id=?`,
      [retiredAt, context.tenantId, segment.id],
      connection
    );
    await executeMutation(
      `UPDATE market_segments
          SET status='RETIRED',aggregate_version=aggregate_version+1,updated_at=?
        WHERE id=? AND tenant_id=? AND aggregate_version=?`,
      [retiredAt, segment.id, context.tenantId, expectedVersion],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-03-MARKET-INSIGHT',
        aggregateType: 'MarketSegment',
        objectType: 'market_segment',
        objectId: segment.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'MARKET_SEGMENT_RETIRED',
        topic: 'nublox.market.segment',
        fromState: segment.status,
        toState: 'RETIRED'
      },
      connection
    );
  });
}
