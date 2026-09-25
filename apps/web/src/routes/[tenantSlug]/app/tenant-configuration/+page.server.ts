import { PLATFORM_PERMISSION_KEYS } from '@nublox/kernel';
import type { MySqlAccessRepository } from '@nublox/persistence';
import type { PageServerLoad } from './$types';
import {
  getAccessRepository,
  getTenantProvisioningService
} from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.auth;
  if (!session) {
    return {
      canRead: false,
      reason: 'No authenticated Tenant context is available.',
      configuration: null
    };
  }

  const evaluation = await getAccessRepository().evaluatePermission(
    session.tenantId as TenantId,
    session.personId,
    PLATFORM_PERMISSION_KEYS.METADATA_READ,
    { scopeType: 'TENANT' }
  );

  if (!evaluation.allowed) {
    return {
      canRead: false,
      reason: evaluation.reason,
      configuration: null
    };
  }

  return {
    canRead: true,
    reason: evaluation.reason,
    configuration: await getTenantProvisioningService().getTenantConfiguration(
      session.tenantId
    )
  };
};
