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

type BaseReference = {
  id: string;
  status: string;
  version: number;
  validFrom: string | null;
  validTo: string | null;
};

export type Jurisdiction = BaseReference & {
  jurisdictionKey: string;
  name: string;
  countryRegionCode: string | null;
  parentJurisdictionId: string | null;
  authorityContext: string | null;
};

export type Currency = BaseReference & {
  isoCode: string;
  name: string;
  minorUnits: number;
};

export type UnitOfMeasure = BaseReference & {
  unitCode: string;
  symbol: string;
  name: string;
  dimensionKey: string;
  baseUnitId: string | null;
  conversionMultiplier: string;
  conversionOffset: string;
};

export type TaxRegime = BaseReference & {
  regimeKey: string;
  name: string;
  taxType: string;
  jurisdictionId: string;
  authorityName: string | null;
};

export type ContractFormFamily = BaseReference & {
  familyKey: string;
  name: string;
  publisherBody: string | null;
  editionFamily: string | null;
  jurisdictionId: string | null;
};

export type ReferenceCalendar = {
  id: string;
  calendarKey: string;
  name: string;
  status: string;
  version: number;
};

export type ReferenceDataType =
  | 'JURISDICTION'
  | 'CURRENCY'
  | 'UNIT_OF_MEASURE'
  | 'TAX_REGIME'
  | 'CONTRACT_FORM_FAMILY';

export type ReferenceDataVersion = {
  id: string;
  referenceType: ReferenceDataType;
  referenceId: string;
  versionNo: number;
  status: string;
  snapshot: unknown;
  validFrom: string | null;
  validTo: string | null;
  changeReason: string | null;
  recordedByPartyId: string | null;
  recordedAt: string;
};

export type ReferenceCalendarVersion = {
  id: string;
  calendarId: string;
  versionNo: number;
  status: string;
  timezoneName: string;
  workingPattern: unknown;
  holidays: unknown;
  exceptions: unknown;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  publishedAt: string | null;
};

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

function range(from: string | undefined, to: string | undefined) {
  const parse = (value: string | undefined, label: string) => {
    const clean = value?.trim();
    if (!clean) return null;
    const parsed = new Date(clean);
    if (Number.isNaN(parsed.getTime())) throw new Error(label + ' is invalid.');
    return parsed.toISOString();
  };
  const validFrom = parse(from, 'Valid-from');
  const validTo = parse(to, 'Valid-to');
  if (validFrom && validTo && validTo <= validFrom) throw new Error('Valid-to must be later than valid-from.');
  return { validFrom, validTo };
}

async function evidence(
  context: CommandContext,
  objectType: string,
  objectId: string,
  version: number,
  action: string,
  payload: Record<string, unknown>,
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-29-REFERENCE-DATA',
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
      aggregateId: 'AGG-29-REFERENCE-DATA',
      aggregateType: 'ReferenceData',
      aggregateObjectId: objectId,
      aggregateVersion: version,
      eventType: action,
      topic: 'nublox.reference.data',
      payload
    },
    executor
  );
}

type SnapshotRow = RowDataPacket & {
  version: number;
  status: string;
  validFrom: string | null;
  validTo: string | null;
  [key: string]: unknown;
};

async function currentReferenceSnapshot(
  context: CommandContext,
  referenceType: ReferenceDataType,
  id: string,
  executor: DbExecutor
): Promise<SnapshotRow> {
  let row: SnapshotRow | undefined;
  if (referenceType === 'JURISDICTION') {
    row = await queryOne<SnapshotRow>(
      'SELECT jurisdiction_key AS jurisdictionKey, name, country_region_code AS countryRegionCode, parent_jurisdiction_id AS parentJurisdictionId, authority_context AS authorityContext, status, version, valid_from AS validFrom, valid_to AS validTo FROM reference_jurisdictions WHERE id = ? AND tenant_id = ?',
      [id, context.tenantId],
      executor
    );
  } else if (referenceType === 'CURRENCY') {
    row = await queryOne<SnapshotRow>(
      'SELECT iso_code AS isoCode, name, minor_units AS minorUnits, status, version, valid_from AS validFrom, valid_to AS validTo FROM reference_currencies WHERE id = ? AND tenant_id = ?',
      [id, context.tenantId],
      executor
    );
  } else if (referenceType === 'UNIT_OF_MEASURE') {
    row = await queryOne<SnapshotRow>(
      'SELECT unit_code AS unitCode, symbol, name, dimension_key AS dimensionKey, base_unit_id AS baseUnitId, conversion_multiplier AS conversionMultiplier, conversion_offset AS conversionOffset, status, version, valid_from AS validFrom, valid_to AS validTo FROM reference_units_of_measure WHERE id = ? AND tenant_id = ?',
      [id, context.tenantId],
      executor
    );
  } else if (referenceType === 'TAX_REGIME') {
    row = await queryOne<SnapshotRow>(
      'SELECT regime_key AS regimeKey, name, tax_type AS taxType, jurisdiction_id AS jurisdictionId, authority_name AS authorityName, status, version, valid_from AS validFrom, valid_to AS validTo FROM reference_tax_regimes WHERE id = ? AND tenant_id = ?',
      [id, context.tenantId],
      executor
    );
  } else {
    row = await queryOne<SnapshotRow>(
      'SELECT family_key AS familyKey, name, publisher_body AS publisherBody, edition_family AS editionFamily, jurisdiction_id AS jurisdictionId, status, version, valid_from AS validFrom, valid_to AS validTo FROM reference_contract_form_families WHERE id = ? AND tenant_id = ?',
      [id, context.tenantId],
      executor
    );
  }
  if (!row) throw new Error('Reference data item not found.');
  return row;
}

async function recordReferenceVersion(
  context: CommandContext,
  referenceType: ReferenceDataType,
  id: string,
  reason: string,
  executor: DbExecutor
) {
  const snapshot = await currentReferenceSnapshot(context, referenceType, id, executor);
  const { version, status, validFrom, validTo, ...meaning } = snapshot;
  await executeMutation(
    'INSERT INTO reference_data_versions (id, tenant_id, reference_type, reference_id, version_no, status, snapshot_json, valid_from, valid_to, change_reason, recorded_by_party_id, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      randomUUID(),
      context.tenantId,
      referenceType,
      id,
      version,
      status,
      JSON.stringify(meaning),
      validFrom,
      validTo,
      required(reason, 'Reference change reason'),
      context.actorPartyId,
      now()
    ],
    executor
  );
  return snapshot;
}

export async function listReferenceDataVersions(
  context: CommandContext,
  referenceType: ReferenceDataType,
  referenceId: string
): Promise<ReferenceDataVersion[]> {
  assertPermission(context, 'reference.data.read');
  return queryRows<RowDataPacket & ReferenceDataVersion>(
    'SELECT id, reference_type AS referenceType, reference_id AS referenceId, version_no AS versionNo, status, snapshot_json AS snapshot, valid_from AS validFrom, valid_to AS validTo, change_reason AS changeReason, recorded_by_party_id AS recordedByPartyId, recorded_at AS recordedAt FROM reference_data_versions WHERE tenant_id = ? AND reference_type = ? AND reference_id = ? ORDER BY version_no DESC',
    [context.tenantId, referenceType, referenceId]
  );
}

function validateTimezone(timezoneName: string) {
  const clean = required(timezoneName, 'Calendar timezone');
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: clean }).format(new Date());
  } catch {
    throw new Error('Calendar timezone must be a valid IANA timezone.');
  }
  return clean;
}

function validateWorkingPattern(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Calendar working pattern must be an object keyed by weekday.');
  }
  const allowed = new Set([
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
  ]);
  const clock = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  for (const [day, intervals] of Object.entries(value as Record<string, unknown>)) {
    if (!allowed.has(day.toLowerCase())) throw new Error('Calendar working pattern contains an invalid weekday.');
    if (!Array.isArray(intervals)) throw new Error('Calendar weekday working periods must be arrays.');
    let previousEnd = '';
    for (const interval of intervals) {
      if (
        !Array.isArray(interval) ||
        interval.length !== 2 ||
        typeof interval[0] !== 'string' ||
        typeof interval[1] !== 'string' ||
        !clock.test(interval[0]) ||
        !clock.test(interval[1]) ||
        interval[1] <= interval[0]
      ) {
        throw new Error('Calendar working periods must be valid [HH:MM, HH:MM] ranges.');
      }
      if (previousEnd && interval[0] < previousEnd) {
        throw new Error('Calendar working periods cannot overlap.');
      }
      previousEnd = interval[1];
    }
  }
  return value;
}

function validateArrayConfiguration(value: unknown, label: string) {
  if (value != null && !Array.isArray(value)) throw new Error(label + ' must be an array.');
  return value ?? [];
}

async function assertJurisdictionParent(
  context: CommandContext,
  jurisdictionId: string,
  parentJurisdictionId: string | null,
  executor: DbExecutor
) {
  if (!parentJurisdictionId) return;
  if (parentJurisdictionId === jurisdictionId) {
    throw new Error('Jurisdiction cannot be its own parent.');
  }

  let cursor: string | null = parentJurisdictionId;
  const visited = new Set<string>();
  while (cursor) {
    if (cursor === jurisdictionId) {
      throw new Error('Jurisdiction hierarchy cannot contain a cycle.');
    }
    if (visited.has(cursor)) {
      throw new Error('Existing Jurisdiction hierarchy contains a cycle.');
    }
    visited.add(cursor);
    const parentRow: (RowDataPacket & { parentJurisdictionId: string | null }) | undefined =
      await queryOne<RowDataPacket & { parentJurisdictionId: string | null }>(
        "SELECT parent_jurisdiction_id AS parentJurisdictionId FROM reference_jurisdictions WHERE id = ? AND tenant_id = ? AND status = 'ACTIVE'",
        [cursor, context.tenantId],
        executor
      );
    if (!parentRow) throw new Error('Active parent Jurisdiction not found.');
    cursor = parentRow.parentJurisdictionId;
  }
}

async function assertJurisdiction(context: CommandContext, id: string, executor: DbExecutor) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM reference_jurisdictions WHERE id = ? AND tenant_id = ? AND status = 'ACTIVE'",
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Active Jurisdiction not found.');
}

export async function listJurisdictions(context: CommandContext) {
  assertPermission(context, 'reference.data.read');
  return queryRows<RowDataPacket & Jurisdiction>(
    'SELECT id, jurisdiction_key AS jurisdictionKey, name, country_region_code AS countryRegionCode, parent_jurisdiction_id AS parentJurisdictionId, authority_context AS authorityContext, status, version, valid_from AS validFrom, valid_to AS validTo FROM reference_jurisdictions WHERE tenant_id = ? ORDER BY name, jurisdiction_key',
    [context.tenantId]
  );
}

export async function createJurisdiction(
  context: CommandContext,
  input: {
    jurisdictionKey: string;
    name: string;
    countryRegionCode?: string;
    parentJurisdictionId?: string;
    authorityContext?: string;
    validFrom?: string;
    validTo?: string;
  }
) {
  assertPermission(context, 'reference.data.manage');
  const jurisdictionKey = key(input.jurisdictionKey, 'Jurisdiction key');
  const name = required(input.name, 'Jurisdiction name');
  const validity = range(input.validFrom, input.validTo);
  return dbTransaction(async (connection) => {
    const id = randomUUID();
    const parentJurisdictionId = input.parentJurisdictionId?.trim() || null;
    await assertJurisdictionParent(context, id, parentJurisdictionId, connection);
    const timestamp = now();
    await executeMutation(
      "INSERT INTO reference_jurisdictions (id, tenant_id, jurisdiction_key, name, country_region_code, parent_jurisdiction_id, authority_context, status, version, valid_from, valid_to, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1, ?, ?, ?, ?)",
      [id, context.tenantId, jurisdictionKey, name, input.countryRegionCode?.trim() || null, parentJurisdictionId, input.authorityContext?.trim() || null, validity.validFrom, validity.validTo, timestamp, timestamp],
      connection
    );
    await recordReferenceVersion(context, 'JURISDICTION', id, 'Initial governed reference version.', connection);
    await evidence(context, 'reference_jurisdiction', id, 1, 'REFERENCE_JURISDICTION_CREATED', { jurisdictionKey, name, status: 'ACTIVE' }, connection);
    return id;
  });
}

export async function listCurrencies(context: CommandContext) {
  assertPermission(context, 'reference.data.read');
  return queryRows<RowDataPacket & Currency>(
    'SELECT id, iso_code AS isoCode, name, minor_units AS minorUnits, status, version, valid_from AS validFrom, valid_to AS validTo FROM reference_currencies WHERE tenant_id = ? ORDER BY iso_code',
    [context.tenantId]
  );
}

export async function createCurrency(
  context: CommandContext,
  input: { isoCode: string; name: string; minorUnits: number; validFrom?: string; validTo?: string }
) {
  assertPermission(context, 'reference.data.manage');
  const isoCode = required(input.isoCode, 'Currency ISO code').toUpperCase();
  if (!/^[A-Z]{3}$/.test(isoCode)) throw new Error('Currency ISO code must contain three letters.');
  if (!Number.isInteger(input.minorUnits) || input.minorUnits < 0 || input.minorUnits > 6) {
    throw new Error('Currency minor units must be a whole number from 0 to 6.');
  }
  const name = required(input.name, 'Currency name');
  const validity = range(input.validFrom, input.validTo);
  return dbTransaction(async (connection) => {
    const id = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO reference_currencies (id, tenant_id, iso_code, name, minor_units, status, version, valid_from, valid_to, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'ACTIVE', 1, ?, ?, ?, ?)",
      [id, context.tenantId, isoCode, name, input.minorUnits, validity.validFrom, validity.validTo, timestamp, timestamp],
      connection
    );
    await recordReferenceVersion(context, 'CURRENCY', id, 'Initial governed reference version.', connection);
    await evidence(context, 'reference_currency', id, 1, 'REFERENCE_CURRENCY_CREATED', { isoCode, name, minorUnits: input.minorUnits, status: 'ACTIVE' }, connection);
    return id;
  });
}

export async function listUnitsOfMeasure(context: CommandContext) {
  assertPermission(context, 'reference.data.read');
  return queryRows<RowDataPacket & UnitOfMeasure>(
    'SELECT id, unit_code AS unitCode, symbol, name, dimension_key AS dimensionKey, base_unit_id AS baseUnitId, conversion_multiplier AS conversionMultiplier, conversion_offset AS conversionOffset, status, version, valid_from AS validFrom, valid_to AS validTo FROM reference_units_of_measure WHERE tenant_id = ? ORDER BY dimension_key, unit_code',
    [context.tenantId]
  );
}

export async function createUnitOfMeasure(
  context: CommandContext,
  input: {
    unitCode: string;
    symbol: string;
    name: string;
    dimensionKey: string;
    baseUnitId?: string;
    conversionMultiplier?: number;
    conversionOffset?: number;
    validFrom?: string;
    validTo?: string;
  }
) {
  assertPermission(context, 'reference.data.manage');
  const unitCode = key(input.unitCode, 'Unit code', 64);
  const dimensionKey = key(input.dimensionKey, 'Dimension key', 128);
  const multiplier = input.conversionMultiplier ?? 1;
  const offset = input.conversionOffset ?? 0;
  if (!Number.isFinite(multiplier) || multiplier === 0) throw new Error('Conversion multiplier must be a non-zero number.');
  if (!Number.isFinite(offset)) throw new Error('Conversion offset must be a number.');
  const validity = range(input.validFrom, input.validTo);
  return dbTransaction(async (connection) => {
    if (input.baseUnitId) {
      const base = await queryOne<
        RowDataPacket & { id: string; dimensionKey: string; baseUnitId: string | null }
      >(
        "SELECT id, dimension_key AS dimensionKey, base_unit_id AS baseUnitId FROM reference_units_of_measure WHERE id = ? AND tenant_id = ? AND status = 'ACTIVE'",
        [input.baseUnitId, context.tenantId],
        connection
      );
      if (!base) throw new Error('Active base Unit of Measure not found.');
      if (base.dimensionKey !== dimensionKey) throw new Error('Base Unit of Measure must share the same dimension.');
      if (base.baseUnitId) throw new Error('Unit conversions must reference the dimension base unit directly.');
    } else if (multiplier !== 1 || offset !== 0) {
      throw new Error('A dimension base unit must use multiplier 1 and offset 0.');
    }
    const id = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO reference_units_of_measure (id, tenant_id, unit_code, symbol, name, dimension_key, base_unit_id, conversion_multiplier, conversion_offset, status, version, valid_from, valid_to, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1, ?, ?, ?, ?)",
      [id, context.tenantId, unitCode, required(input.symbol, 'Unit symbol'), required(input.name, 'Unit name'), dimensionKey, input.baseUnitId?.trim() || null, multiplier, offset, validity.validFrom, validity.validTo, timestamp, timestamp],
      connection
    );
    await recordReferenceVersion(context, 'UNIT_OF_MEASURE', id, 'Initial governed reference version.', connection);
    await evidence(context, 'reference_unit_of_measure', id, 1, 'REFERENCE_UOM_CREATED', { unitCode, dimensionKey, baseUnitId: input.baseUnitId?.trim() || null, status: 'ACTIVE' }, connection);
    return id;
  });
}

export async function listTaxRegimes(context: CommandContext) {
  assertPermission(context, 'reference.data.read');
  return queryRows<RowDataPacket & TaxRegime>(
    'SELECT id, regime_key AS regimeKey, name, tax_type AS taxType, jurisdiction_id AS jurisdictionId, authority_name AS authorityName, status, version, valid_from AS validFrom, valid_to AS validTo FROM reference_tax_regimes WHERE tenant_id = ? ORDER BY tax_type, name',
    [context.tenantId]
  );
}

export async function createTaxRegime(
  context: CommandContext,
  input: { regimeKey: string; name: string; taxType: string; jurisdictionId: string; authorityName?: string; validFrom?: string; validTo?: string }
) {
  assertPermission(context, 'reference.data.manage');
  const regimeKey = key(input.regimeKey, 'Tax regime key');
  const taxType = key(input.taxType, 'Tax type', 128);
  const validity = range(input.validFrom, input.validTo);
  return dbTransaction(async (connection) => {
    await assertJurisdiction(context, input.jurisdictionId, connection);
    const id = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO reference_tax_regimes (id, tenant_id, regime_key, name, tax_type, jurisdiction_id, authority_name, status, version, valid_from, valid_to, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1, ?, ?, ?, ?)",
      [id, context.tenantId, regimeKey, required(input.name, 'Tax regime name'), taxType, input.jurisdictionId, input.authorityName?.trim() || null, validity.validFrom, validity.validTo, timestamp, timestamp],
      connection
    );
    await recordReferenceVersion(context, 'TAX_REGIME', id, 'Initial governed reference version.', connection);
    await evidence(context, 'reference_tax_regime', id, 1, 'REFERENCE_TAX_REGIME_CREATED', { regimeKey, taxType, jurisdictionId: input.jurisdictionId, status: 'ACTIVE' }, connection);
    return id;
  });
}

export async function listContractFormFamilies(context: CommandContext) {
  assertPermission(context, 'reference.data.read');
  return queryRows<RowDataPacket & ContractFormFamily>(
    'SELECT id, family_key AS familyKey, name, publisher_body AS publisherBody, edition_family AS editionFamily, jurisdiction_id AS jurisdictionId, status, version, valid_from AS validFrom, valid_to AS validTo FROM reference_contract_form_families WHERE tenant_id = ? ORDER BY name, family_key',
    [context.tenantId]
  );
}

export async function createContractFormFamily(
  context: CommandContext,
  input: { familyKey: string; name: string; publisherBody?: string; editionFamily?: string; jurisdictionId?: string; validFrom?: string; validTo?: string }
) {
  assertPermission(context, 'reference.data.manage');
  const familyKey = key(input.familyKey, 'Contract form family key');
  const validity = range(input.validFrom, input.validTo);
  return dbTransaction(async (connection) => {
    if (input.jurisdictionId) await assertJurisdiction(context, input.jurisdictionId, connection);
    const id = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO reference_contract_form_families (id, tenant_id, family_key, name, publisher_body, edition_family, jurisdiction_id, status, version, valid_from, valid_to, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1, ?, ?, ?, ?)",
      [id, context.tenantId, familyKey, required(input.name, 'Contract form family name'), input.publisherBody?.trim() || null, input.editionFamily?.trim() || null, input.jurisdictionId?.trim() || null, validity.validFrom, validity.validTo, timestamp, timestamp],
      connection
    );
    await recordReferenceVersion(context, 'CONTRACT_FORM_FAMILY', id, 'Initial governed reference version.', connection);
    await evidence(context, 'reference_contract_form_family', id, 1, 'REFERENCE_CONTRACT_FORM_FAMILY_CREATED', { familyKey, jurisdictionId: input.jurisdictionId?.trim() || null, status: 'ACTIVE' }, connection);
    return id;
  });
}


export async function reviseJurisdiction(
  context: CommandContext,
  id: string,
  expectedVersion: number,
  input: {
    name: string;
    countryRegionCode?: string;
    parentJurisdictionId?: string;
    authorityContext?: string;
    validFrom?: string;
    validTo?: string;
    reason: string;
  }
) {
  assertPermission(context, 'reference.data.manage');
  const validity = range(input.validFrom, input.validTo);
  return dbTransaction(async (connection) => {
    const current = await currentReferenceSnapshot(context, 'JURISDICTION', id, connection);
    if (current.version !== expectedVersion) throw new Error('This Jurisdiction changed after you opened it.');
    if (current.status !== 'ACTIVE') throw new Error('Only an active Jurisdiction can be revised.');
    const parentId = input.parentJurisdictionId?.trim() || null;
    await assertJurisdictionParent(context, id, parentId, connection);
    const timestamp = now();
    const result = await executeMutation(
      'UPDATE reference_jurisdictions SET name = ?, country_region_code = ?, parent_jurisdiction_id = ?, authority_context = ?, valid_from = ?, valid_to = ?, version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?',
      [required(input.name, 'Jurisdiction name'), input.countryRegionCode?.trim() || null, parentId, input.authorityContext?.trim() || null, validity.validFrom, validity.validTo, timestamp, id, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Jurisdiction change detected.');
    const updated = await recordReferenceVersion(context, 'JURISDICTION', id, input.reason, connection);
    await evidence(context, 'reference_jurisdiction', id, updated.version, 'REFERENCE_JURISDICTION_REVISED', { status: updated.status }, connection);
    return updated;
  });
}

export async function reviseCurrency(
  context: CommandContext,
  id: string,
  expectedVersion: number,
  input: { name: string; minorUnits: number; validFrom?: string; validTo?: string; reason: string }
) {
  assertPermission(context, 'reference.data.manage');
  if (!Number.isInteger(input.minorUnits) || input.minorUnits < 0 || input.minorUnits > 6) {
    throw new Error('Currency minor units must be a whole number from 0 to 6.');
  }
  const validity = range(input.validFrom, input.validTo);
  return dbTransaction(async (connection) => {
    const current = await currentReferenceSnapshot(context, 'CURRENCY', id, connection);
    if (current.version !== expectedVersion) throw new Error('This Currency changed after you opened it.');
    if (current.status !== 'ACTIVE') throw new Error('Only an active Currency can be revised.');
    const timestamp = now();
    const result = await executeMutation(
      'UPDATE reference_currencies SET name = ?, minor_units = ?, valid_from = ?, valid_to = ?, version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?',
      [required(input.name, 'Currency name'), input.minorUnits, validity.validFrom, validity.validTo, timestamp, id, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Currency change detected.');
    const updated = await recordReferenceVersion(context, 'CURRENCY', id, input.reason, connection);
    await evidence(context, 'reference_currency', id, updated.version, 'REFERENCE_CURRENCY_REVISED', { status: updated.status }, connection);
    return updated;
  });
}

export async function reviseUnitOfMeasure(
  context: CommandContext,
  id: string,
  expectedVersion: number,
  input: {
    symbol: string;
    name: string;
    baseUnitId?: string;
    conversionMultiplier?: number;
    conversionOffset?: number;
    validFrom?: string;
    validTo?: string;
    reason: string;
  }
) {
  assertPermission(context, 'reference.data.manage');
  const multiplier = input.conversionMultiplier ?? 1;
  const offset = input.conversionOffset ?? 0;
  if (!Number.isFinite(multiplier) || multiplier === 0) throw new Error('Conversion multiplier must be a non-zero number.');
  if (!Number.isFinite(offset)) throw new Error('Conversion offset must be a number.');
  const validity = range(input.validFrom, input.validTo);
  return dbTransaction(async (connection) => {
    const current = await currentReferenceSnapshot(context, 'UNIT_OF_MEASURE', id, connection);
    if (current.version !== expectedVersion) throw new Error('This Unit of Measure changed after you opened it.');
    if (current.status !== 'ACTIVE') throw new Error('Only an active Unit of Measure can be revised.');
    const baseUnitId = input.baseUnitId?.trim() || null;
    if (baseUnitId === id) throw new Error('Unit of Measure cannot be its own base unit.');
    if (baseUnitId) {
      const base = await queryOne<RowDataPacket & { dimensionKey: string; baseUnitId: string | null }>(
        "SELECT dimension_key AS dimensionKey, base_unit_id AS baseUnitId FROM reference_units_of_measure WHERE id = ? AND tenant_id = ? AND status = 'ACTIVE'",
        [baseUnitId, context.tenantId],
        connection
      );
      if (!base) throw new Error('Active base Unit of Measure not found.');
      if (base.dimensionKey !== current.dimensionKey) throw new Error('Base Unit of Measure must share the same dimension.');
      if (base.baseUnitId) throw new Error('Unit conversions must reference the dimension base unit directly.');
    } else if (multiplier !== 1 || offset !== 0) {
      throw new Error('A dimension base unit must use multiplier 1 and offset 0.');
    }
    const timestamp = now();
    const result = await executeMutation(
      'UPDATE reference_units_of_measure SET symbol = ?, name = ?, base_unit_id = ?, conversion_multiplier = ?, conversion_offset = ?, valid_from = ?, valid_to = ?, version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?',
      [required(input.symbol, 'Unit symbol'), required(input.name, 'Unit name'), baseUnitId, multiplier, offset, validity.validFrom, validity.validTo, timestamp, id, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Unit of Measure change detected.');
    const updated = await recordReferenceVersion(context, 'UNIT_OF_MEASURE', id, input.reason, connection);
    await evidence(context, 'reference_unit_of_measure', id, updated.version, 'REFERENCE_UOM_REVISED', { status: updated.status }, connection);
    return updated;
  });
}

export async function reviseTaxRegime(
  context: CommandContext,
  id: string,
  expectedVersion: number,
  input: {
    name: string;
    jurisdictionId: string;
    authorityName?: string;
    validFrom?: string;
    validTo?: string;
    reason: string;
  }
) {
  assertPermission(context, 'reference.data.manage');
  const validity = range(input.validFrom, input.validTo);
  return dbTransaction(async (connection) => {
    const current = await currentReferenceSnapshot(context, 'TAX_REGIME', id, connection);
    if (current.version !== expectedVersion) throw new Error('This Tax Regime changed after you opened it.');
    if (current.status !== 'ACTIVE') throw new Error('Only an active Tax Regime can be revised.');
    await assertJurisdiction(context, input.jurisdictionId, connection);
    const timestamp = now();
    const result = await executeMutation(
      'UPDATE reference_tax_regimes SET name = ?, jurisdiction_id = ?, authority_name = ?, valid_from = ?, valid_to = ?, version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?',
      [required(input.name, 'Tax regime name'), input.jurisdictionId, input.authorityName?.trim() || null, validity.validFrom, validity.validTo, timestamp, id, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Tax Regime change detected.');
    const updated = await recordReferenceVersion(context, 'TAX_REGIME', id, input.reason, connection);
    await evidence(context, 'reference_tax_regime', id, updated.version, 'REFERENCE_TAX_REGIME_REVISED', { status: updated.status }, connection);
    return updated;
  });
}

export async function reviseContractFormFamily(
  context: CommandContext,
  id: string,
  expectedVersion: number,
  input: {
    name: string;
    publisherBody?: string;
    editionFamily?: string;
    jurisdictionId?: string;
    validFrom?: string;
    validTo?: string;
    reason: string;
  }
) {
  assertPermission(context, 'reference.data.manage');
  const validity = range(input.validFrom, input.validTo);
  return dbTransaction(async (connection) => {
    const current = await currentReferenceSnapshot(context, 'CONTRACT_FORM_FAMILY', id, connection);
    if (current.version !== expectedVersion) throw new Error('This Contract Form Family changed after you opened it.');
    if (current.status !== 'ACTIVE') throw new Error('Only an active Contract Form Family can be revised.');
    const jurisdictionId = input.jurisdictionId?.trim() || null;
    if (jurisdictionId) await assertJurisdiction(context, jurisdictionId, connection);
    const timestamp = now();
    const result = await executeMutation(
      'UPDATE reference_contract_form_families SET name = ?, publisher_body = ?, edition_family = ?, jurisdiction_id = ?, valid_from = ?, valid_to = ?, version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?',
      [required(input.name, 'Contract form family name'), input.publisherBody?.trim() || null, input.editionFamily?.trim() || null, jurisdictionId, validity.validFrom, validity.validTo, timestamp, id, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Contract Form Family change detected.');
    const updated = await recordReferenceVersion(context, 'CONTRACT_FORM_FAMILY', id, input.reason, connection);
    await evidence(context, 'reference_contract_form_family', id, updated.version, 'REFERENCE_CONTRACT_FORM_FAMILY_REVISED', { status: updated.status }, connection);
    return updated;
  });
}

const referenceTableByType: Record<ReferenceDataType, { table: string; objectType: string }> = {
  JURISDICTION: { table: 'reference_jurisdictions', objectType: 'reference_jurisdiction' },
  CURRENCY: { table: 'reference_currencies', objectType: 'reference_currency' },
  UNIT_OF_MEASURE: { table: 'reference_units_of_measure', objectType: 'reference_unit_of_measure' },
  TAX_REGIME: { table: 'reference_tax_regimes', objectType: 'reference_tax_regime' },
  CONTRACT_FORM_FAMILY: {
    table: 'reference_contract_form_families',
    objectType: 'reference_contract_form_family'
  }
};

export async function retireReferenceData(
  context: CommandContext,
  referenceType: ReferenceDataType,
  id: string,
  expectedVersion: number,
  reason: string
) {
  assertPermission(context, 'reference.data.manage');
  const definition = referenceTableByType[referenceType];
  if (!definition) throw new Error('Unsupported reference-data type.');
  return dbTransaction(async (connection) => {
    const current = await currentReferenceSnapshot(context, referenceType, id, connection);
    if (current.version !== expectedVersion) throw new Error('This Reference Data item changed after you opened it.');
    if (current.status !== 'ACTIVE') throw new Error('Only active Reference Data can be retired.');
    const timestamp = now();
    const result = await executeMutation(
      `UPDATE ${definition.table} SET status = 'RETIRED', valid_to = ?, version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?`,
      [timestamp, timestamp, id, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Reference Data retirement detected.');
    const updated = await recordReferenceVersion(context, referenceType, id, reason, connection);
    await evidence(
      context,
      definition.objectType,
      id,
      updated.version,
      'REFERENCE_DATA_RETIRED',
      { referenceType, status: 'RETIRED' },
      connection
    );
    return updated;
  });
}

export async function listReferenceCalendars(context: CommandContext) {
  assertPermission(context, 'reference.data.read');
  return queryRows<RowDataPacket & ReferenceCalendar>(
    'SELECT id, calendar_key AS calendarKey, name, status, version FROM reference_calendars WHERE tenant_id = ? ORDER BY name, calendar_key',
    [context.tenantId]
  );
}

export async function listReferenceCalendarVersions(context: CommandContext, calendarId: string) {
  assertPermission(context, 'reference.data.read');
  return queryRows<RowDataPacket & ReferenceCalendarVersion>(
    'SELECT id, calendar_id AS calendarId, version_no AS versionNo, status, timezone_name AS timezoneName, working_pattern_json AS workingPattern, holidays_json AS holidays, exceptions_json AS exceptions, effective_from AS effectiveFrom, effective_to AS effectiveTo, published_at AS publishedAt FROM reference_calendar_versions WHERE tenant_id = ? AND calendar_id = ? ORDER BY version_no DESC',
    [context.tenantId, calendarId]
  );
}

export async function createReferenceCalendar(
  context: CommandContext,
  input: { calendarKey: string; name: string; timezoneName: string; workingPattern: unknown; holidays?: unknown; exceptions?: unknown; effectiveFrom?: string; effectiveTo?: string }
) {
  assertPermission(context, 'reference.data.manage');
  const calendarKey = key(input.calendarKey, 'Calendar key');
  const timezoneName = validateTimezone(input.timezoneName);
  const workingPattern = validateWorkingPattern(input.workingPattern);
  const holidays = validateArrayConfiguration(input.holidays, 'Calendar holidays');
  const exceptions = validateArrayConfiguration(input.exceptions, 'Calendar exceptions');
  const validity = range(input.effectiveFrom, input.effectiveTo);
  return dbTransaction(async (connection) => {
    const id = randomUUID();
    const versionId = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO reference_calendars (id, tenant_id, calendar_key, name, status, version, created_at, updated_at) VALUES (?, ?, ?, ?, 'ACTIVE', 1, ?, ?)",
      [id, context.tenantId, calendarKey, required(input.name, 'Calendar name'), timestamp, timestamp],
      connection
    );
    await executeMutation(
      "INSERT INTO reference_calendar_versions (id, tenant_id, calendar_id, version_no, status, timezone_name, working_pattern_json, holidays_json, exceptions_json, effective_from, effective_to, published_at, created_by_party_id, created_at, updated_at) VALUES (?, ?, ?, 1, 'DRAFT', ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)",
      [versionId, context.tenantId, id, timezoneName, JSON.stringify(workingPattern), JSON.stringify(holidays), JSON.stringify(exceptions), validity.validFrom, validity.validTo, context.actorPartyId, timestamp, timestamp],
      connection
    );
    await evidence(context, 'reference_calendar', id, 1, 'REFERENCE_CALENDAR_CREATED', { calendarKey, versionId, versionNo: 1, versionStatus: 'DRAFT', status: 'ACTIVE' }, connection);
    return { calendarId: id, versionId };
  });
}


export async function createReferenceCalendarVersion(
  context: CommandContext,
  calendarId: string,
  expectedCalendarVersion: number,
  input: {
    timezoneName: string;
    workingPattern: unknown;
    holidays?: unknown;
    exceptions?: unknown;
    effectiveFrom?: string;
    effectiveTo?: string;
  }
) {
  assertPermission(context, 'reference.data.manage');
  const timezoneName = validateTimezone(input.timezoneName);
  const workingPattern = validateWorkingPattern(input.workingPattern);
  const holidays = validateArrayConfiguration(input.holidays, 'Calendar holidays');
  const exceptions = validateArrayConfiguration(input.exceptions, 'Calendar exceptions');
  const validity = range(input.effectiveFrom, input.effectiveTo);

  return dbTransaction(async (connection) => {
    const calendar = await queryOne<RowDataPacket & ReferenceCalendar>(
      'SELECT id, calendar_key AS calendarKey, name, status, version FROM reference_calendars WHERE id = ? AND tenant_id = ? FOR UPDATE',
      [calendarId, context.tenantId],
      connection
    );
    if (!calendar) throw new Error('Reference Calendar not found.');
    if (calendar.version !== expectedCalendarVersion) throw new Error('This Reference Calendar changed after you opened it.');
    if (calendar.status !== 'ACTIVE') throw new Error('Reference Calendar is not active.');

    const draft = await queryOne<RowDataPacket & { id: string }>(
      "SELECT id FROM reference_calendar_versions WHERE tenant_id = ? AND calendar_id = ? AND status = 'DRAFT' LIMIT 1 FOR UPDATE",
      [context.tenantId, calendar.id],
      connection
    );
    if (draft) throw new Error('Reference Calendar already has a draft version.');

    const maximum = await queryOne<RowDataPacket & { versionNo: number | null }>(
      'SELECT MAX(version_no) AS versionNo FROM reference_calendar_versions WHERE tenant_id = ? AND calendar_id = ?',
      [context.tenantId, calendar.id],
      connection
    );
    const versionNo = Number(maximum?.versionNo ?? 0) + 1;
    const versionId = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO reference_calendar_versions (id, tenant_id, calendar_id, version_no, status, timezone_name, working_pattern_json, holidays_json, exceptions_json, effective_from, effective_to, published_at, created_by_party_id, created_at, updated_at) VALUES (?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)",
      [versionId, context.tenantId, calendar.id, versionNo, timezoneName, JSON.stringify(workingPattern), JSON.stringify(holidays), JSON.stringify(exceptions), validity.validFrom, validity.validTo, context.actorPartyId, timestamp, timestamp],
      connection
    );
    const result = await executeMutation(
      'UPDATE reference_calendars SET version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?',
      [timestamp, calendar.id, context.tenantId, expectedCalendarVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Reference Calendar change detected.');
    await evidence(
      context,
      'reference_calendar',
      calendar.id,
      expectedCalendarVersion + 1,
      'REFERENCE_CALENDAR_VERSION_CREATED',
      { versionId, versionNo, status: 'DRAFT' },
      connection
    );
    return versionId;
  });
}

export async function publishReferenceCalendarVersion(
  context: CommandContext,
  calendarId: string,
  versionId: string,
  expectedCalendarVersion: number
) {
  assertPermission(context, 'reference.data.publish');
  return dbTransaction(async (connection) => {
    const calendar = await queryOne<RowDataPacket & ReferenceCalendar>(
      'SELECT id, calendar_key AS calendarKey, name, status, version FROM reference_calendars WHERE id = ? AND tenant_id = ? FOR UPDATE',
      [calendarId, context.tenantId],
      connection
    );
    if (!calendar) throw new Error('Reference Calendar not found.');
    if (calendar.version !== expectedCalendarVersion) throw new Error('This Reference Calendar changed after you opened it.');
    const version = await queryOne<RowDataPacket & ReferenceCalendarVersion>(
      'SELECT id, calendar_id AS calendarId, version_no AS versionNo, status, timezone_name AS timezoneName, working_pattern_json AS workingPattern, holidays_json AS holidays, exceptions_json AS exceptions, effective_from AS effectiveFrom, effective_to AS effectiveTo, published_at AS publishedAt FROM reference_calendar_versions WHERE id = ? AND calendar_id = ? AND tenant_id = ? FOR UPDATE',
      [versionId, calendar.id, context.tenantId],
      connection
    );
    if (!version) throw new Error('Reference Calendar Version not found.');
    if (version.status !== 'DRAFT') throw new Error('Only a draft Reference Calendar version can be published.');

    const overlap = await queryOne<RowDataPacket & { id: string }>(
      `SELECT id
         FROM reference_calendar_versions
        WHERE tenant_id = ?
          AND calendar_id = ?
          AND id <> ?
          AND status = 'PUBLISHED'
          AND (effective_to IS NULL OR ? IS NULL OR effective_to > ?)
          AND (? IS NULL OR effective_from IS NULL OR ? > effective_from)
        LIMIT 1`,
      [
        context.tenantId,
        calendar.id,
        version.id,
        version.effectiveFrom,
        version.effectiveFrom,
        version.effectiveTo,
        version.effectiveTo
      ],
      connection
    );
    if (overlap) throw new Error('Published Reference Calendar versions cannot have overlapping effectivity.');

    const timestamp = now();
    await executeMutation(
      "UPDATE reference_calendar_versions SET status = 'PUBLISHED', published_at = ?, updated_at = ? WHERE id = ? AND tenant_id = ? AND status = 'DRAFT'",
      [timestamp, timestamp, version.id, context.tenantId],
      connection
    );
    const updated = await executeMutation(
      'UPDATE reference_calendars SET version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?',
      [timestamp, calendar.id, context.tenantId, expectedCalendarVersion],
      connection
    );
    if (updated.affectedRows !== 1) throw new Error('Concurrent Reference Calendar change detected.');
    await evidence(context, 'reference_calendar', calendar.id, expectedCalendarVersion + 1, 'REFERENCE_CALENDAR_VERSION_PUBLISHED', { calendarKey: calendar.calendarKey, versionId: version.id, versionNo: version.versionNo, status: 'PUBLISHED' }, connection);
  });
}
