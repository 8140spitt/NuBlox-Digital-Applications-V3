import { PLATFORM_PERMISSION_KEYS } from '@nublox/kernel';
import type {
  MySqlAccessRepository,
  MySqlDeliverableReadRepository
} from '@nublox/persistence';
import type { PageServerLoad } from './$types';
import { getAccessRepository, getDeliverableReadRepository } from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];
type ProjectionTenantId = Parameters<MySqlDeliverableReadRepository['getProjection']>[0];

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.auth;
  if (!session) {
    return {
      allowed: false,
      canManage: false,
      reason: 'No authenticated tenant context is available.',
      projection: null
    };
  }

  const tenantId = session.tenantId as TenantId;
  const access = getAccessRepository();
  const [readEvaluation, manageEvaluation] = await Promise.all([
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.DELIVERABLE_READ,
      { scopeType: 'TENANT' }
    ),
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.DELIVERABLE_MANAGE,
      { scopeType: 'TENANT' }
    )
  ]);

  if (!readEvaluation.allowed) {
    return {
      allowed: false,
      canManage: false,
      reason: readEvaluation.reason,
      projection: null
    };
  }

  return {
    allowed: true,
    canManage: manageEvaluation.allowed,
    reason: readEvaluation.reason,
    projection: await getDeliverableReadRepository().getProjection(
      session.tenantId as ProjectionTenantId
    )
  };
};
