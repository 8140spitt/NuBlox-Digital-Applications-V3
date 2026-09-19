import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { dbTransaction, executeMutation, queryRows, queryOne, type DbExecutor } from '$lib/server/db';
import { assertPermission, type CommandContext } from '$lib/server/platform-context';
import { code, domainEvidence, now, required, timestamp } from '$lib/server/marketing-runtime';

export type PrivacySubject = {
  subjectType: 'PARTY' | 'LEAD';
  subjectId: string;
};

export type ConsentEvent = {
  id: string;
  subjectType: string;
  partyId: string | null;
  leadId: string | null;
  purposeKey: string;
  controllerPartyId: string | null;
  wordingReference: string;
  wordingVersion: string;
  action: string;
  channel: string;
  proofReference: string;
  occurredAt: string;
};

export type PreferenceEvent = {
  id: string;
  subjectType: string;
  partyId: string | null;
  leadId: string | null;
  preferenceType: string;
  preferenceValue: string;
  scopeKey: string;
  channel: string;
  sourceReference: string;
  occurredAt: string;
};

async function assertSubject(context: CommandContext, subject: PrivacySubject, executor?: DbExecutor) {
  if (subject.subjectType === 'PARTY') {
    const row = await queryOne<RowDataPacket & { id: string }>(
      'SELECT id FROM parties WHERE id=? AND tenant_id=?',
      [subject.subjectId, context.tenantId],
      executor
    );
    if (!row) throw new Error('Privacy Party subject not found.');
    return;
  }
  const row = await queryOne<RowDataPacket & { id: string }>(
    'SELECT id FROM leads WHERE id=? AND tenant_id=?',
    [subject.subjectId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Privacy Lead subject not found.');
}

function subjectColumns(subject: PrivacySubject) {
  return subject.subjectType === 'PARTY'
    ? { partyId: subject.subjectId, leadId: null }
    : { partyId: null, leadId: subject.subjectId };
}

export async function recordConsentEvidence(
  context: CommandContext,
  subject: PrivacySubject,
  input: {
    purposeKey: string;
    controllerPartyId?: string;
    wordingReference: string;
    wordingVersion: string;
    action: string;
    channel: string;
    proofReference: string;
    occurredAt?: string;
  }
) {
  assertPermission(context, 'privacy.consent.record');
  const id = randomUUID();
  const occurredAt = timestamp(input.occurredAt, 'Consent occurrence time') ?? now();
  const action = code(input.action, 'Consent action');
  if (!['GRANT', 'REFUSE', 'WITHDRAW', 'INVALIDATE'].includes(action)) {
    throw new Error('Consent action must be GRANT, REFUSE, WITHDRAW or INVALIDATE.');
  }
  return dbTransaction(async (connection) => {
    await assertSubject(context, subject, connection);
    if (input.controllerPartyId?.trim()) {
      const controller = await queryOne<RowDataPacket & { id: string }>(
        'SELECT id FROM parties WHERE id=? AND tenant_id=?',
        [input.controllerPartyId.trim(), context.tenantId],
        connection
      );
      if (!controller) throw new Error('Consent controller Party not found.');
    }
    const cols = subjectColumns(subject);
    await executeMutation(
      `INSERT INTO privacy_consent_events
        (id,tenant_id,subject_type,party_id,lead_id,purpose_key,controller_party_id,wording_reference,
         wording_version,action,channel,proof_reference,occurred_at,recorded_by_party_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        context.tenantId,
        subject.subjectType,
        cols.partyId,
        cols.leadId,
        code(input.purposeKey, 'Consent purpose', 191),
        input.controllerPartyId?.trim() || null,
        required(input.wordingReference, 'Consent wording reference', 500),
        required(input.wordingVersion, 'Consent wording version', 64),
        action,
        code(input.channel, 'Consent channel'),
        required(input.proofReference, 'Consent proof reference', 500),
        occurredAt,
        context.actorPartyId
      ],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-22-PRIVACY',
        aggregateType: 'ConsentEvidence',
        objectType: 'privacy_consent_event',
        objectId: id,
        aggregateVersion: 1,
        eventType: 'PRIVACY_CONSENT_RECORDED',
        topic: 'nublox.privacy.consent',
        toState: action,
        payload: {
          subjectType: subject.subjectType,
          subjectId: subject.subjectId,
          purposeKey: code(input.purposeKey, 'Consent purpose', 191),
          action
        }
      },
      connection
    );
    return id;
  });
}

export async function recordPreferenceEvidence(
  context: CommandContext,
  subject: PrivacySubject,
  input: {
    preferenceType: string;
    preferenceValue: string;
    scopeKey: string;
    channel: string;
    sourceReference: string;
    occurredAt?: string;
  }
) {
  assertPermission(context, 'privacy.preference.record');
  const id = randomUUID();
  const occurredAt = timestamp(input.occurredAt, 'Preference occurrence time') ?? now();
  return dbTransaction(async (connection) => {
    await assertSubject(context, subject, connection);
    const cols = subjectColumns(subject);
    await executeMutation(
      `INSERT INTO privacy_preference_events
        (id,tenant_id,subject_type,party_id,lead_id,preference_type,preference_value,scope_key,channel,
         source_reference,occurred_at,recorded_by_party_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        context.tenantId,
        subject.subjectType,
        cols.partyId,
        cols.leadId,
        code(input.preferenceType, 'Preference type'),
        code(input.preferenceValue, 'Preference value', 191),
        code(input.scopeKey, 'Preference scope', 191),
        code(input.channel, 'Preference channel'),
        required(input.sourceReference, 'Preference source reference', 500),
        occurredAt,
        context.actorPartyId
      ],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-22-PRIVACY',
        aggregateType: 'PreferenceEvidence',
        objectType: 'privacy_preference_event',
        objectId: id,
        aggregateVersion: 1,
        eventType: 'PRIVACY_PREFERENCE_RECORDED',
        topic: 'nublox.privacy.preference',
        toState: code(input.preferenceValue, 'Preference value', 191),
        payload: {
          subjectType: subject.subjectType,
          subjectId: subject.subjectId,
          preferenceType: code(input.preferenceType, 'Preference type'),
          scopeKey: code(input.scopeKey, 'Preference scope', 191)
        }
      },
      connection
    );
    return id;
  });
}

export async function listConsentEvidence(context: CommandContext, subject: PrivacySubject) {
  assertPermission(context, 'privacy.evidence.read');
  await assertSubject(context, subject);
  const where = subject.subjectType === 'PARTY' ? 'party_id=?' : 'lead_id=?';
  return queryRows<RowDataPacket & ConsentEvent>(
    `SELECT id,subject_type AS subjectType,party_id AS partyId,lead_id AS leadId,purpose_key AS purposeKey,
            controller_party_id AS controllerPartyId,wording_reference AS wordingReference,
            wording_version AS wordingVersion,action,channel,proof_reference AS proofReference,
            occurred_at AS occurredAt
       FROM privacy_consent_events
      WHERE tenant_id=? AND ${where}
      ORDER BY occurred_at DESC,id DESC`,
    [context.tenantId, subject.subjectId]
  );
}

export async function listPreferenceEvidence(context: CommandContext, subject: PrivacySubject) {
  assertPermission(context, 'privacy.evidence.read');
  await assertSubject(context, subject);
  const where = subject.subjectType === 'PARTY' ? 'party_id=?' : 'lead_id=?';
  return queryRows<RowDataPacket & PreferenceEvent>(
    `SELECT id,subject_type AS subjectType,party_id AS partyId,lead_id AS leadId,
            preference_type AS preferenceType,preference_value AS preferenceValue,
            scope_key AS scopeKey,channel,source_reference AS sourceReference,occurred_at AS occurredAt
       FROM privacy_preference_events
      WHERE tenant_id=? AND ${where}
      ORDER BY occurred_at DESC,id DESC`,
    [context.tenantId, subject.subjectId]
  );
}

export async function evaluateMarketingEligibility(
  context: CommandContext,
  subject: PrivacySubject,
  input: {
    purposeKey: string;
    channel: string;
    lawfulBasis: 'CONSENT' | 'LEGITIMATE_INTEREST';
  },
  executor?: DbExecutor
) {
  await assertSubject(context, subject, executor);
  const purposeKey = code(input.purposeKey, 'Marketing purpose', 191);
  const channel = code(input.channel, 'Marketing channel');
  const subjectColumn = subject.subjectType === 'PARTY' ? 'party_id' : 'lead_id';

  const preference = await queryOne<
    RowDataPacket & { preferenceValue: string; channel: string; scopeKey: string }
  >(
    `SELECT preference_value AS preferenceValue,channel,scope_key AS scopeKey
       FROM privacy_preference_events
      WHERE tenant_id=? AND ${subjectColumn}=?
        AND preference_type='MARKETING'
        AND scope_key IN (?, 'GLOBAL')
        AND channel IN (?, 'ALL')
      ORDER BY occurred_at DESC,id DESC LIMIT 1`,
    [context.tenantId, subject.subjectId, purposeKey, channel],
    executor
  );

  if (preference && ['OPT_OUT', 'BLOCK', 'NO'].includes(preference.preferenceValue)) {
    return { eligible: false, reason: 'MARKETING_PREFERENCE_OPT_OUT' as const };
  }

  if (input.lawfulBasis === 'LEGITIMATE_INTEREST') {
    return { eligible: true, reason: 'LEGITIMATE_INTEREST_NO_OPT_OUT' as const };
  }

  const consent = await queryOne<RowDataPacket & { action: string }>(
    `SELECT action
       FROM privacy_consent_events
      WHERE tenant_id=? AND ${subjectColumn}=? AND purpose_key=?
      ORDER BY occurred_at DESC,id DESC LIMIT 1`,
    [context.tenantId, subject.subjectId, purposeKey],
    executor
  );
  if (!consent || consent.action !== 'GRANT') {
    return { eligible: false, reason: consent ? 'CONSENT_NOT_GRANTED' as const : 'CONSENT_MISSING' as const };
  }
  return { eligible: true, reason: 'CONSENT_GRANTED' as const };
}
