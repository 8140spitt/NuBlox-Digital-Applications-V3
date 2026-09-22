import { PLATFORM_PERMISSION_KEYS } from '@nublox/kernel';
import type { MySqlAccessRepository, MySqlIndustryDeliveryReadRepository } from '@nublox/persistence';
import type { PageServerLoad } from './$types';
import { getAccessRepository, getIndustryDeliveryReadRepository } from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];
type ProjectionTenantId = Parameters<MySqlIndustryDeliveryReadRepository['getProjection']>[0];

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.auth;
  if (!session) {
    return { allowed: false, reason: 'No authenticated tenant context is available.', projection: null };
  }

  const tenantId = session.tenantId as TenantId;
  const evaluation = await getAccessRepository().evaluatePermission(
    tenantId,
    session.personId,
    PLATFORM_PERMISSION_KEYS.INDUSTRY_DELIVERY_READ,
    { scopeType: 'TENANT' }
  );

  if (!evaluation.allowed) {
    return { allowed: false, reason: evaluation.reason, projection: null };
  }

  return {
    allowed: true,
    reason: evaluation.reason,
    projection: await getIndustryDeliveryReadRepository().getProjection(
      session.tenantId as ProjectionTenantId
    )
  };
};
