import type { RowDataPacket } from 'mysql2/promise';
import { executeMutation, queryOne, type DbExecutor } from '$lib/server/db';
import type { CommandContext } from '$lib/server/platform-context';

export type PartyOrigination = {
  partyId: string;
  originFunctionId: string;
  originObjectType: string;
  originObjectId: string;
  originReference: string | null;
  stewardFunctionId: string;
  createdAt: string;
};

export type PartyOriginationInput = {
  originFunctionId: string;
  originObjectType: string;
  originObjectId?: string;
  originReference?: string | null;
  stewardFunctionId?: string;
};

export const partyHomeFunctions = {
  CLIENT: 'F07',
  CUSTOMER: 'F07',
  SALES_PROSPECT: 'F07',
  SUPPLIER: 'F09',
  SUBCONTRACTOR: 'F09',
  CONSULTANT_SUPPLIER: 'F09',
  EMPLOYEE: 'F15',
  WORKER: 'F15',
  CANDIDATE: 'F15',
  LEGAL_ENTITY: 'F19',
  REGULATOR: 'F19'
} as const;

function value(input: string, label: string, max: number) {
  const clean = input.trim().toUpperCase();
  if (!clean) throw new Error(label + ' is required.');
  if (clean.length > max || !/^[A-Z0-9._:-]+$/.test(clean)) {
    throw new Error(label + ' is invalid.');
  }
  return clean;
}

export function homeFunctionForRelationshipType(type: string): string | null {
  const key = type.trim().toUpperCase() as keyof typeof partyHomeFunctions;
  return partyHomeFunctions[key] ?? null;
}

export async function getPartyOrigination(
  context: CommandContext,
  partyId: string,
  executor?: DbExecutor
): Promise<PartyOrigination | null> {
  return (
    (await queryOne<RowDataPacket & PartyOrigination>(
      `SELECT party_id AS partyId,origin_function_id AS originFunctionId,
              origin_object_type AS originObjectType,origin_object_id AS originObjectId,
              origin_reference AS originReference,steward_function_id AS stewardFunctionId,
              created_at AS createdAt
         FROM party_originations
        WHERE tenant_id=? AND party_id=?`,
      [context.tenantId, partyId],
      executor
    )) ?? null
  );
}

export async function recordPartyOrigination(
  context: CommandContext,
  partyId: string,
  input: PartyOriginationInput,
  executor?: DbExecutor
) {
  const originFunctionId = value(input.originFunctionId, 'Origin function', 16);
  const originObjectType = value(input.originObjectType, 'Origin object type', 64);
  const originObjectId = input.originObjectId?.trim() || partyId;
  const stewardFunctionId = value(
    input.stewardFunctionId ?? originFunctionId,
    'Steward function',
    16
  );
  const existing = await getPartyOrigination(context, partyId, executor);
  if (existing) {
    if (
      existing.originFunctionId === originFunctionId &&
      existing.originObjectType === originObjectType &&
      existing.originObjectId === originObjectId &&
      existing.stewardFunctionId === stewardFunctionId
    ) {
      return existing;
    }
    throw new Error('Party origination is immutable once recorded.');
  }
  await executeMutation(
    `INSERT INTO party_originations
      (party_id,tenant_id,origin_function_id,origin_object_type,origin_object_id,
       origin_reference,steward_function_id,created_at)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      partyId,
      context.tenantId,
      originFunctionId,
      originObjectType,
      originObjectId,
      input.originReference?.trim() || null,
      stewardFunctionId,
      new Date().toISOString()
    ],
    executor
  );
  return (await getPartyOrigination(context, partyId, executor))!;
}

export function platformPartyOrigination(
  objectType: 'PERSON' | 'ORGANISATION',
  partyId?: string
): PartyOriginationInput {
  return {
    originFunctionId: 'PLATFORM',
    originObjectType: 'INTERNAL_' + objectType,
    originObjectId: partyId,
    originReference: 'Canonical identity created by an internal platform or test/bootstrap process.',
    stewardFunctionId: 'PLATFORM'
  };
}
