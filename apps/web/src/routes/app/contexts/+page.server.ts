import { PLATFORM_PERMISSION_KEYS } from '@nublox/kernel';
import type { MySqlAccessRepository, MySqlOrganisationReadRepository } from '@nublox/persistence';
import type { PageServerLoad } from './$types';
import { getAccessRepository, getOrganisationReadRepository } from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];
type OrganisationTenantId = Parameters<MySqlOrganisationReadRepository['getStructure']>[0];

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.auth;
  if (!session) {
    return {
      allowed: false,
      reason: 'No authenticated tenant context is available.',
      tenantName: 'Tenant',
      structure: null
    };
  }

  const evaluation = await getAccessRepository().evaluatePermission(
    session.tenantId as TenantId,
    session.personId,
    PLATFORM_PERMISSION_KEYS.ORGANISATION_READ,
    { scopeType: 'TENANT' }
  );

  return {
    allowed: evaluation.allowed,
    reason: evaluation.reason,
    tenantName: session.tenantName,
    structure: evaluation.allowed
      ? await getOrganisationReadRepository().getStructure(session.tenantId as OrganisationTenantId)
      : null
  };
};
