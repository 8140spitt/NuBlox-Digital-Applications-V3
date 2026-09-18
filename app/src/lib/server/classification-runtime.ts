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

export type ClassificationSystem = {
  id: string;
  systemKey: string;
  name: string;
  publisher: string;
  systemIdentifier: string | null;
  purpose: string | null;
  status: string;
  version: number;
};

export type ClassificationRelease = {
  id: string;
  classificationSystemId: string;
  releaseKey: string;
  publicationDate: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  sourceDigestAlgorithm: string;
  sourceDigest: string;
  status: string;
  publishedAt: string | null;
};

export type ClassificationCode = {
  id: string;
  classificationSystemId: string;
  classificationReleaseId: string;
  code: string;
  title: string;
  description: string | null;
  parentCodeId: string | null;
  parentCode: string | null;
  status: string;
};

export type ClassificationCodeInput = {
  code: string;
  title: string;
  description?: string;
  parentCode?: string;
  status?: string;
};

const systemSelect =
  'SELECT id, system_key AS systemKey, name, publisher, system_identifier AS systemIdentifier, purpose, status, version FROM classification_systems';
const releaseSelect =
  'SELECT id, classification_system_id AS classificationSystemId, release_key AS releaseKey, publication_date AS publicationDate, effective_from AS effectiveFrom, effective_to AS effectiveTo, source_digest_algorithm AS sourceDigestAlgorithm, source_digest AS sourceDigest, status, published_at AS publishedAt FROM classification_releases';

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

function optionalDate(value: string | undefined, label: string) {
  const clean = value?.trim();
  if (!clean) return null;
  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) throw new Error(label + ' is invalid.');
  return parsed.toISOString();
}

function digest(algorithmValue: string, digestValue: string) {
  const algorithm = key(algorithmValue, 'Classification source digest algorithm', 32);
  const value = required(digestValue, 'Classification source digest').toLowerCase();
  const lengths: Record<string, number> = { SHA256: 64, SHA512: 128 };
  const length = lengths[algorithm];
  if (!length) throw new Error('Classification source digest algorithm must be SHA256 or SHA512.');
  if (value.length !== length || !/^[a-f0-9]+$/.test(value)) {
    throw new Error(`Classification ${algorithm} digest must be ${length} hexadecimal characters.`);
  }
  return { algorithm, value };
}

async function getSystem(
  context: CommandContext,
  systemId: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & ClassificationSystem>(
    systemSelect +
      ' WHERE id = ? AND tenant_id = ?' +
      (forUpdate ? ' FOR UPDATE' : ''),
    [systemId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Classification System not found.');
  return row;
}

async function getRelease(
  context: CommandContext,
  systemId: string,
  releaseId: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & ClassificationRelease>(
    releaseSelect +
      ' WHERE id = ? AND classification_system_id = ? AND tenant_id = ?' +
      (forUpdate ? ' FOR UPDATE' : ''),
    [releaseId, systemId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Classification Release not found.');
  return row;
}

async function bumpSystem(
  context: CommandContext,
  system: ClassificationSystem,
  executor: DbExecutor
) {
  const timestamp = now();
  const result = await executeMutation(
    'UPDATE classification_systems SET version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?',
    [timestamp, system.id, context.tenantId, system.version],
    executor
  );
  if (result.affectedRows !== 1) throw new Error('Concurrent Classification System change detected.');
  return getSystem(context, system.id, executor);
}

async function evidence(
  context: CommandContext,
  system: ClassificationSystem,
  objectType: string,
  objectId: string,
  action: string,
  payload: Record<string, unknown>,
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-29-CLASSIFICATION',
      objectType,
      objectId,
      action,
      toState: typeof payload.status === 'string' ? payload.status : undefined
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: 'AGG-29-CLASSIFICATION',
      aggregateType: 'ClassificationSystem',
      aggregateObjectId: system.id,
      aggregateVersion: system.version,
      eventType: action,
      topic: 'nublox.reference.classification',
      payload
    },
    executor
  );
}

export async function listClassificationSystems(context: CommandContext) {
  assertPermission(context, 'reference.classification.read');
  return queryRows<RowDataPacket & ClassificationSystem>(
    systemSelect + ' WHERE tenant_id = ? ORDER BY name, system_key',
    [context.tenantId]
  );
}

export async function listClassificationReleases(
  context: CommandContext,
  systemId: string
) {
  assertPermission(context, 'reference.classification.read');
  await getSystem(context, systemId);
  return queryRows<RowDataPacket & ClassificationRelease>(
    releaseSelect +
      ' WHERE tenant_id = ? AND classification_system_id = ? ORDER BY publication_date DESC, release_key DESC',
    [context.tenantId, systemId]
  );
}

export async function listClassificationCodes(
  context: CommandContext,
  systemId: string,
  releaseId: string,
  search = ''
) {
  assertPermission(context, 'reference.classification.read');
  await getRelease(context, systemId, releaseId);
  const needle = search.trim();
  const filter = needle ? ' AND (c.code LIKE ? OR c.title LIKE ?)' : '';
  const params: unknown[] = [context.tenantId, systemId, releaseId];
  if (needle) params.push('%' + needle + '%', '%' + needle + '%');
  return queryRows<RowDataPacket & ClassificationCode>(
    `SELECT c.id,
            c.classification_system_id AS classificationSystemId,
            c.classification_release_id AS classificationReleaseId,
            c.code,
            c.title,
            c.description,
            c.parent_code_id AS parentCodeId,
            p.code AS parentCode,
            c.status
       FROM classification_codes c
       LEFT JOIN classification_codes p
         ON p.id = c.parent_code_id
        AND p.classification_release_id = c.classification_release_id
      WHERE c.tenant_id = ?
        AND c.classification_system_id = ?
        AND c.classification_release_id = ?
        ${filter}
      ORDER BY c.code`,
    params
  );
}

export async function createClassificationSystem(
  context: CommandContext,
  input: {
    systemKey: string;
    name: string;
    publisher: string;
    systemIdentifier?: string;
    purpose?: string;
  }
) {
  assertPermission(context, 'reference.classification.manage');
  const systemKey = key(input.systemKey, 'Classification system key');
  const name = required(input.name, 'Classification system name');
  const publisher = required(input.publisher, 'Classification publisher');
  if (name.length > 255) throw new Error('Classification system name is too long.');
  if (publisher.length > 255) throw new Error('Classification publisher is too long.');
  const systemIdentifier = input.systemIdentifier?.trim() || null;
  if (systemIdentifier && systemIdentifier.length > 255) {
    throw new Error('Classification system identifier is too long.');
  }

  return dbTransaction(async (connection) => {
    const id = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO classification_systems (id, tenant_id, system_key, name, publisher, system_identifier, purpose, status, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1, ?, ?)",
      [
        id,
        context.tenantId,
        systemKey,
        name,
        publisher,
        systemIdentifier,
        input.purpose?.trim() || null,
        timestamp,
        timestamp
      ],
      connection
    );
    const system = await getSystem(context, id, connection);
    await evidence(
      context,
      system,
      'classification_system',
      id,
      'CLASSIFICATION_SYSTEM_CREATED',
      { systemId: id, systemKey, name, publisher, status: system.status },
      connection
    );
    return id;
  });
}

export async function createClassificationRelease(
  context: CommandContext,
  systemId: string,
  expectedSystemVersion: number,
  input: {
    releaseKey: string;
    publicationDate?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    sourceDigestAlgorithm: string;
    sourceDigest: string;
  }
) {
  assertPermission(context, 'reference.classification.manage');
  const releaseKey = key(input.releaseKey, 'Classification release key');
  const publicationDate = optionalDate(input.publicationDate, 'Classification publication date');
  const effectiveFrom = optionalDate(input.effectiveFrom, 'Classification effective-from');
  const effectiveTo = optionalDate(input.effectiveTo, 'Classification effective-to');
  if (effectiveFrom && effectiveTo && effectiveTo <= effectiveFrom) {
    throw new Error('Classification effective-to must be later than effective-from.');
  }
  const sourceDigest = digest(input.sourceDigestAlgorithm, input.sourceDigest);

  return dbTransaction(async (connection) => {
    const system = await getSystem(context, systemId, connection, true);
    if (system.version !== expectedSystemVersion) {
      throw new Error('This Classification System changed after you opened it.');
    }
    if (system.status !== 'ACTIVE') throw new Error('Classification System is not active.');

    const id = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO classification_releases (id, tenant_id, classification_system_id, release_key, publication_date, effective_from, effective_to, source_digest_algorithm, source_digest, status, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', NULL, ?, ?)",
      [
        id,
        context.tenantId,
        system.id,
        releaseKey,
        publicationDate,
        effectiveFrom,
        effectiveTo,
        sourceDigest.algorithm,
        sourceDigest.value,
        timestamp,
        timestamp
      ],
      connection
    );
    const updatedSystem = await bumpSystem(context, system, connection);
    await evidence(
      context,
      updatedSystem,
      'classification_release',
      id,
      'CLASSIFICATION_RELEASE_CREATED',
      { systemId: system.id, releaseId: id, releaseKey, status: 'DRAFT' },
      connection
    );
    return id;
  });
}

export async function importClassificationCodes(
  context: CommandContext,
  systemId: string,
  releaseId: string,
  expectedSystemVersion: number,
  inputCodes: ClassificationCodeInput[]
) {
  assertPermission(context, 'reference.classification.manage');
  if (!inputCodes.length) throw new Error('At least one Classification Code is required.');
  if (inputCodes.length > 5000) {
    throw new Error('A classification import command cannot exceed 5,000 codes.');
  }

  const normalised = inputCodes.map((entry) => {
    const codeValue = required(entry.code, 'Classification code');
    const title = required(entry.title, 'Classification code title');
    if (codeValue.length > 191) throw new Error('Classification code is too long.');
    if (title.length > 500) throw new Error('Classification code title is too long.');
    const status = key(entry.status ?? 'ACTIVE', 'Classification code status', 32);
    if (!['ACTIVE', 'DEPRECATED'].includes(status)) {
      throw new Error('Classification code status must be ACTIVE or DEPRECATED.');
    }
    return {
      id: randomUUID(),
      code: codeValue,
      title,
      description: entry.description?.trim() || null,
      parentCode: entry.parentCode?.trim() || null,
      status
    };
  });

  const batchCodes = new Set<string>();
  for (const entry of normalised) {
    if (batchCodes.has(entry.code)) {
      throw new Error('Duplicate Classification Code in import batch: ' + entry.code);
    }
    batchCodes.add(entry.code);
  }

  return dbTransaction(async (connection) => {
    const system = await getSystem(context, systemId, connection, true);
    if (system.version !== expectedSystemVersion) {
      throw new Error('This Classification System changed after you opened it.');
    }
    const release = await getRelease(context, system.id, releaseId, connection, true);
    if (release.status !== 'DRAFT') {
      throw new Error('Published or retired Classification Releases are immutable.');
    }

    const existing = await queryRows<
      RowDataPacket & { id: string; code: string; parentCode: string | null }
    >(
      `SELECT c.id, c.code, p.code AS parentCode
         FROM classification_codes c
         LEFT JOIN classification_codes p
           ON p.id = c.parent_code_id
          AND p.classification_release_id = c.classification_release_id
        WHERE c.tenant_id = ?
          AND c.classification_system_id = ?
          AND c.classification_release_id = ?`,
      [context.tenantId, system.id, release.id],
      connection
    );

    const canonical = (value: string) => value.toUpperCase();
    const byCode = new Map<string, string>();
    const parentByCode = new Map<string, string | null>();
    for (const row of existing) {
      byCode.set(canonical(row.code), row.id);
      parentByCode.set(canonical(row.code), row.parentCode ? canonical(row.parentCode) : null);
    }

    for (const entry of normalised) {
      const canonicalCode = canonical(entry.code);
      if (byCode.has(canonicalCode)) {
        throw new Error('Classification Code already exists in this release: ' + entry.code);
      }
      byCode.set(canonicalCode, entry.id);
      parentByCode.set(
        canonicalCode,
        entry.parentCode ? canonical(entry.parentCode) : null
      );
    }

    for (const entry of normalised) {
      const canonicalCode = canonical(entry.code);
      const canonicalParent = entry.parentCode ? canonical(entry.parentCode) : null;
      if (canonicalParent && canonicalParent === canonicalCode) {
        throw new Error('Classification Code cannot be its own parent: ' + entry.code);
      }
      if (canonicalParent && !byCode.has(canonicalParent)) {
        throw new Error(
          'Classification parent code is not present in this release: ' + entry.parentCode
        );
      }
    }

    for (const start of normalised.map((entry) => canonical(entry.code))) {
      const seen = new Set<string>();
      let cursor: string | null = start;
      while (cursor) {
        if (seen.has(cursor)) {
          throw new Error('Classification hierarchy contains a cycle involving code: ' + cursor);
        }
        seen.add(cursor);
        cursor = parentByCode.get(cursor) ?? null;
      }
    }

    const timestamp = now();
    const chunkSize = 250;
    for (let offset = 0; offset < normalised.length; offset += chunkSize) {
      const chunk = normalised.slice(offset, offset + chunkSize);
      const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)').join(', ');
      const params: unknown[] = [];
      for (const entry of chunk) {
        params.push(
          entry.id,
          context.tenantId,
          system.id,
          release.id,
          entry.code,
          entry.title,
          entry.description,
          entry.status,
          timestamp
        );
      }
      await executeMutation(
        `INSERT INTO classification_codes
          (id, tenant_id, classification_system_id, classification_release_id, code, title,
           description, parent_code_id, status, created_at)
         VALUES ${placeholders}`,
        params,
        connection
      );
    }

    const parented = normalised.filter((entry) => entry.parentCode);
    for (let offset = 0; offset < parented.length; offset += chunkSize) {
      const chunk = parented.slice(offset, offset + chunkSize);
      const cases = chunk.map(() => 'WHEN ? THEN ?').join(' ');
      const ids = chunk.map(() => '?').join(', ');
      const params: unknown[] = [];
      for (const entry of chunk) {
        params.push(entry.id, byCode.get(canonical(entry.parentCode!))!);
      }
      params.push(...chunk.map((entry) => entry.id));
      await executeMutation(
        `UPDATE classification_codes
            SET parent_code_id = CASE id ${cases} END
          WHERE id IN (${ids})
            AND tenant_id = ?
            AND classification_release_id = ?`,
        [...params, context.tenantId, release.id],
        connection
      );
    }

    const updatedSystem = await bumpSystem(context, system, connection);
    await evidence(
      context,
      updatedSystem,
      'classification_release',
      release.id,
      'CLASSIFICATION_CODES_IMPORTED',
      {
        systemId: system.id,
        releaseId: release.id,
        releaseKey: release.releaseKey,
        importedCodeCount: normalised.length,
        status: release.status
      },
      connection
    );
    return normalised.length;
  });
}

export async function publishClassificationRelease(
  context: CommandContext,
  systemId: string,
  releaseId: string,
  expectedSystemVersion: number
) {
  assertPermission(context, 'reference.classification.publish');
  return dbTransaction(async (connection) => {
    const system = await getSystem(context, systemId, connection, true);
    if (system.version !== expectedSystemVersion) {
      throw new Error('This Classification System changed after you opened it.');
    }
    const release = await getRelease(context, system.id, releaseId, connection, true);
    if (release.status !== 'DRAFT') {
      throw new Error('Only a draft Classification Release can be published.');
    }
    const count = await queryOne<RowDataPacket & { count: number }>(
      'SELECT COUNT(*) AS count FROM classification_codes WHERE tenant_id = ? AND classification_system_id = ? AND classification_release_id = ?',
      [context.tenantId, system.id, release.id],
      connection
    );
    const codeCount = Number(count?.count ?? 0);
    if (!codeCount) throw new Error('Classification Release cannot be published without codes.');

    const timestamp = now();
    const result = await executeMutation(
      "UPDATE classification_releases SET status = 'PUBLISHED', published_at = ?, updated_at = ? WHERE id = ? AND tenant_id = ? AND classification_system_id = ? AND status = 'DRAFT'",
      [timestamp, timestamp, release.id, context.tenantId, system.id],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Classification Release change detected.');

    const updatedSystem = await bumpSystem(context, system, connection);
    await evidence(
      context,
      updatedSystem,
      'classification_release',
      release.id,
      'CLASSIFICATION_RELEASE_PUBLISHED',
      {
        systemId: system.id,
        releaseId: release.id,
        releaseKey: release.releaseKey,
        codeCount,
        sourceDigestAlgorithm: release.sourceDigestAlgorithm,
        sourceDigest: release.sourceDigest,
        status: 'PUBLISHED'
      },
      connection
    );
    return getRelease(context, system.id, release.id, connection);
  });
}
