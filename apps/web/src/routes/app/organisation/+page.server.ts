import { PLATFORM_PERMISSION_KEYS } from '@nublox/kernel';
import type {
  MySqlAccessRepository,
  MySqlOrganisationReadRepository
} from '@nublox/persistence';
import type { PageServerLoad } from './$types';
import {
  getAccessRepository,
  getOrganisationReadRepository
} from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];
type StructureTenantId = Parameters<MySqlOrganisationReadRepository['getStructure']>[0];

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.auth;

  if (!session) {
    return {
      allowed: false,
      reason: 'No authenticated tenant context is available.',
      structure: null
    };
  }

  const tenantId = session.tenantId as TenantId;
  const evaluation = await getAccessRepository().evaluatePermission(
    tenantId,
    session.personId,
    PLATFORM_PERMISSION_KEYS.ORGANISATION_READ,
    { scopeType: 'TENANT' }
  );

  if (!evaluation.allowed) {
    return {
      allowed: false,
      reason: evaluation.reason,
      structure: null
    };
  }

  const structure = await getOrganisationReadRepository().getStructure(
    session.tenantId as StructureTenantId
  );

  return {
    allowed: true,
    reason: evaluation.reason,
    structure
  };
};
