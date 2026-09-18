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

export type EvidenceItem = {
  id: string;
  evidenceType: string;
  subjectType: string;
  subjectId: string;
  subjectVersion: string | null;
  capturedByPartyId: string;
  capturedAt: string;
  contentReference: string;
  contentMediaType: string | null;
  hashAlgorithm: string;
  contentHash: string;
  classification: string | null;
  status: string;
  version: number;
  verifiedByPartyId: string | null;
  verifiedAt: string | null;
  archivedAt: string | null;
};

export type EvidenceSourceReference = {
  id: string;
  evidenceItemId: string;
  sourceSystem: string;
  sourceIdentifier: string;
  sourceVersion: string | null;
  sourceAsOf: string | null;
  referenceUri: string | null;
};

export type EvidenceProvenanceReference = {
  id: string;
  evidenceItemId: string;
  sourceObjectType: string;
  sourceObjectId: string;
  sourceObjectVersion: string | null;
  provenanceType: string;
  transformation: string | null;
  capturedAt: string;
};

export type CaptureEvidenceInput = {
  evidenceType: string;
  subjectType: string;
  subjectId: string;
  subjectVersion?: string;
  capturedAt?: string;
  contentReference: string;
  contentMediaType?: string;
  hashAlgorithm: 'SHA256' | 'SHA512' | string;
  contentHash: string;
  classification?: string;
  sources?: Array<{
    sourceSystem: string;
    sourceIdentifier: string;
    sourceVersion?: string;
    sourceAsOf?: string;
    referenceUri?: string;
  }>;
  provenance?: Array<{
    sourceObjectType: string;
    sourceObjectId: string;
    sourceObjectVersion?: string;
    provenanceType: string;
    transformation?: string;
    capturedAt?: string;
  }>;
};

const evidenceSelect =
  'SELECT id, evidence_type AS evidenceType, subject_type AS subjectType, subject_id AS subjectId, subject_version AS subjectVersion, captured_by_party_id AS capturedByPartyId, captured_at AS capturedAt, content_reference AS contentReference, content_media_type AS contentMediaType, hash_algorithm AS hashAlgorithm, content_hash AS contentHash, classification, status, version, verified_by_party_id AS verifiedByPartyId, verified_at AS verifiedAt, archived_at AS archivedAt FROM evidence_items';

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

function timestamp(value: string | undefined, label: string, fallback = now()) {
  const clean = value?.trim();
  if (!clean) return fallback;
  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) throw new Error(label + ' is invalid.');
  return parsed.toISOString();
}

function integrity(algorithmValue: string, hashValue: string) {
  const algorithm = code(algorithmValue, 'Evidence hash algorithm', 32);
  const hash = required(hashValue, 'Evidence content hash').toLowerCase();
  const lengths: Record<string, number> = { SHA256: 64, SHA512: 128 };
  const expectedLength = lengths[algorithm];
  if (!expectedLength) throw new Error('Evidence hash algorithm must be SHA256 or SHA512.');
  if (hash.length !== expectedLength || !/^[a-f0-9]+$/.test(hash)) {
    throw new Error(`Evidence ${algorithm} hash must be ${expectedLength} hexadecimal characters.`);
  }
  return { algorithm, hash };
}

async function getEvidence(
  context: CommandContext,
  evidenceId: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & EvidenceItem>(
    evidenceSelect + ' WHERE id = ? AND tenant_id = ?' + (forUpdate ? ' FOR UPDATE' : ''),
    [evidenceId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Evidence Item not found.');
  return row;
}

export async function listEvidenceItems(
  context: CommandContext,
  subject?: { type: string; id: string }
): Promise<EvidenceItem[]> {
  assertPermission(context, 'evidence.item.read');
  if (!subject) {
    return queryRows<RowDataPacket & EvidenceItem>(
      evidenceSelect + ' WHERE tenant_id = ? ORDER BY captured_at DESC, id DESC',
      [context.tenantId]
    );
  }
  return queryRows<RowDataPacket & EvidenceItem>(
    evidenceSelect +
      ' WHERE tenant_id = ? AND subject_type = ? AND subject_id = ? ORDER BY captured_at DESC, id DESC',
    [context.tenantId, required(subject.type, 'Subject type'), required(subject.id, 'Subject ID')]
  );
}

export async function listEvidenceSourceReferences(
  context: CommandContext,
  evidenceId: string
): Promise<EvidenceSourceReference[]> {
  assertPermission(context, 'evidence.item.read');
  await getEvidence(context, evidenceId);
  return queryRows<RowDataPacket & EvidenceSourceReference>(
    'SELECT id, evidence_item_id AS evidenceItemId, source_system AS sourceSystem, source_identifier AS sourceIdentifier, source_version AS sourceVersion, source_as_of AS sourceAsOf, reference_uri AS referenceUri FROM evidence_source_references WHERE tenant_id = ? AND evidence_item_id = ? ORDER BY created_at, id',
    [context.tenantId, evidenceId]
  );
}

export async function listEvidenceProvenance(
  context: CommandContext,
  evidenceId: string
): Promise<EvidenceProvenanceReference[]> {
  assertPermission(context, 'evidence.item.read');
  await getEvidence(context, evidenceId);
  return queryRows<RowDataPacket & EvidenceProvenanceReference>(
    'SELECT id, evidence_item_id AS evidenceItemId, source_object_type AS sourceObjectType, source_object_id AS sourceObjectId, source_object_version AS sourceObjectVersion, provenance_type AS provenanceType, transformation, captured_at AS capturedAt FROM evidence_provenance_references WHERE tenant_id = ? AND evidence_item_id = ? ORDER BY captured_at, id',
    [context.tenantId, evidenceId]
  );
}

export async function captureEvidenceItem(context: CommandContext, input: CaptureEvidenceInput) {
  assertPermission(context, 'evidence.item.capture');
  const evidenceType = code(input.evidenceType, 'Evidence type');
  const subjectType = required(input.subjectType, 'Evidence subject type');
  const subjectId = required(input.subjectId, 'Evidence subject ID');
  const subjectVersion = input.subjectVersion?.trim() || null;
  const capturedAt = timestamp(input.capturedAt, 'Evidence captured-at');
  const contentReference = required(input.contentReference, 'Evidence content reference');
  if (contentReference.length > 2048) throw new Error('Evidence content reference is too long.');
  const contentMediaType = input.contentMediaType?.trim() || null;
  if (contentMediaType && contentMediaType.length > 191) {
    throw new Error('Evidence content media type is too long.');
  }
  if (subjectType.length > 128) throw new Error('Evidence subject type is too long.');
  if (subjectId.length > 191) throw new Error('Evidence subject ID is too long.');
  if (subjectVersion && subjectVersion.length > 64)
    throw new Error('Evidence subject version is too long.');
  const { algorithm, hash } = integrity(input.hashAlgorithm, input.contentHash);
  const classification = input.classification?.trim() || null;
  if (classification && classification.length > 128) {
    throw new Error('Evidence classification is too long.');
  }

  return dbTransaction(async (connection) => {
    const id = randomUUID();
    const createdAt = now();
    await executeMutation(
      `INSERT INTO evidence_items
        (id, tenant_id, evidence_type, subject_type, subject_id, subject_version,
         captured_by_party_id, captured_at, content_reference, content_media_type,
         hash_algorithm, content_hash, classification, status, version,
         verified_by_party_id, verified_at, archived_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CAPTURED', 1, NULL, NULL, NULL, ?, ?)`,
      [
        id,
        context.tenantId,
        evidenceType,
        subjectType,
        subjectId,
        subjectVersion,
        context.actorPartyId,
        capturedAt,
        contentReference,
        contentMediaType,
        algorithm,
        hash,
        classification,
        createdAt,
        createdAt
      ],
      connection
    );

    for (const source of input.sources ?? []) {
      const sourceSystem = required(source.sourceSystem, 'Evidence source system');
      const sourceIdentifier = required(source.sourceIdentifier, 'Evidence source identifier');
      const sourceVersion = source.sourceVersion?.trim() || null;
      if (sourceSystem.length > 191) throw new Error('Evidence source system is too long.');
      if (sourceIdentifier.length > 255) throw new Error('Evidence source identifier is too long.');
      if (sourceVersion && sourceVersion.length > 128)
        throw new Error('Evidence source version is too long.');
      const sourceAsOf = source.sourceAsOf?.trim()
        ? timestamp(source.sourceAsOf, 'Evidence source as-of')
        : null;
      const referenceUri = source.referenceUri?.trim() || null;
      if (referenceUri && referenceUri.length > 2048) {
        throw new Error('Evidence source reference URI is too long.');
      }
      await executeMutation(
        `INSERT INTO evidence_source_references
          (id, tenant_id, evidence_item_id, source_system, source_identifier,
           source_version, source_as_of, reference_uri, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          randomUUID(),
          context.tenantId,
          id,
          sourceSystem,
          sourceIdentifier,
          sourceVersion,
          sourceAsOf,
          referenceUri,
          createdAt
        ],
        connection
      );
    }

    for (const provenance of input.provenance ?? []) {
      const sourceObjectType = required(
        provenance.sourceObjectType,
        'Provenance source object type'
      );
      const sourceObjectId = required(provenance.sourceObjectId, 'Provenance source object ID');
      const sourceObjectVersion = provenance.sourceObjectVersion?.trim() || null;
      const transformation = provenance.transformation?.trim() || null;
      if (sourceObjectType.length > 128)
        throw new Error('Provenance source object type is too long.');
      if (sourceObjectId.length > 191) throw new Error('Provenance source object ID is too long.');
      if (sourceObjectVersion && sourceObjectVersion.length > 64)
        throw new Error('Provenance source object version is too long.');
      if (transformation && transformation.length > 500)
        throw new Error('Provenance transformation is too long.');
      await executeMutation(
        `INSERT INTO evidence_provenance_references
          (id, tenant_id, evidence_item_id, source_object_type, source_object_id,
           source_object_version, provenance_type, transformation, captured_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          randomUUID(),
          context.tenantId,
          id,
          sourceObjectType,
          sourceObjectId,
          sourceObjectVersion,
          code(provenance.provenanceType, 'Provenance type', 64),
          transformation,
          timestamp(provenance.capturedAt, 'Provenance captured-at', capturedAt),
          createdAt
        ],
        connection
      );
    }

    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-28-EVIDENCE',
        objectType: 'evidence_item',
        objectId: id,
        action: 'EVIDENCE_ITEM_CAPTURED',
        toState: 'CAPTURED',
        note: evidenceType + ' · ' + subjectType
      },
      connection
    );
    await emitBusinessEvent(
      context,
      {
        aggregateId: 'AGG-28-EVIDENCE',
        aggregateType: 'EvidenceItem',
        aggregateObjectId: id,
        aggregateVersion: 1,
        eventType: 'EVIDENCE_ITEM_CAPTURED',
        topic: 'nublox.evidence.item',
        payload: {
          evidenceType,
          subjectType,
          subjectId,
          subjectVersion,
          capturedByPartyId: context.actorPartyId,
          capturedAt,
          contentReference,
          contentMediaType,
          hashAlgorithm: algorithm,
          contentHash: hash,
          classification,
          sourceReferenceCount: input.sources?.length ?? 0,
          provenanceReferenceCount: input.provenance?.length ?? 0
        }
      },
      connection
    );
    return id;
  });
}

export async function verifyEvidenceItem(
  context: CommandContext,
  evidenceId: string,
  expectedVersion: number
) {
  assertPermission(context, 'evidence.item.verify');
  return dbTransaction(async (connection) => {
    const evidence = await getEvidence(context, evidenceId, connection, true);
    if (evidence.version !== expectedVersion) {
      throw new Error('This Evidence Item changed after you opened it.');
    }
    if (evidence.status !== 'CAPTURED') {
      throw new Error('Only captured Evidence Items can be verified.');
    }
    if (evidence.capturedByPartyId === context.actorPartyId) {
      throw new Error('Evidence must be verified by a different Party from the capture actor.');
    }

    const verifiedAt = now();
    const result = await executeMutation(
      "UPDATE evidence_items SET status = 'VERIFIED', version = version + 1, verified_by_party_id = ?, verified_at = ?, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ? AND status = 'CAPTURED'",
      [
        context.actorPartyId,
        verifiedAt,
        verifiedAt,
        evidence.id,
        context.tenantId,
        expectedVersion
      ],
      connection
    );
    if (result.affectedRows !== 1)
      throw new Error('Concurrent Evidence Item verification detected.');

    const verified = await getEvidence(context, evidence.id, connection);
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-28-EVIDENCE',
        objectType: 'evidence_item',
        objectId: evidence.id,
        action: 'EVIDENCE_ITEM_VERIFIED',
        fromState: 'CAPTURED',
        toState: 'VERIFIED'
      },
      connection
    );
    await emitBusinessEvent(
      context,
      {
        aggregateId: 'AGG-28-EVIDENCE',
        aggregateType: 'EvidenceItem',
        aggregateObjectId: evidence.id,
        aggregateVersion: verified.version,
        eventType: 'EVIDENCE_ITEM_VERIFIED',
        topic: 'nublox.evidence.item',
        payload: {
          evidenceType: verified.evidenceType,
          subjectType: verified.subjectType,
          subjectId: verified.subjectId,
          subjectVersion: verified.subjectVersion,
          capturedByPartyId: verified.capturedByPartyId,
          verifiedByPartyId: verified.verifiedByPartyId,
          verifiedAt: verified.verifiedAt,
          hashAlgorithm: verified.hashAlgorithm,
          contentHash: verified.contentHash
        }
      },
      connection
    );
    return verified;
  });
}
