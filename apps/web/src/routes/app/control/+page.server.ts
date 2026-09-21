import { PLATFORM_PERMISSION_KEYS } from '@nublox/kernel';
import type { MySqlAccessRepository, MySqlControlReadRepository } from '@nublox/persistence';
import type { PageServerLoad } from './$types';
import { getAccessRepository, getControlReadRepository } from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];
type ControlTenantId = Parameters<MySqlControlReadRepository['getControlProjection']>[0];

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.auth;

  if (!session) {
    return {
      allowed: false,
      canReadAudit: false,
      reason: 'No authenticated tenant context is available.',
      control: null
    };
  }

  const tenantId = session.tenantId as TenantId;
  const access = getAccessRepository();
  const [configurationRead, auditRead] = await Promise.all([
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.CONFIGURATION_READ,
      { scopeType: 'TENANT' }
    ),
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.AUDIT_READ,
      { scopeType: 'TENANT' }
    )
  ]);

  if (!configurationRead.allowed) {
    return {
      allowed: false,
      canReadAudit: false,
      reason: configurationRead.reason,
      control: null
    };
  }

  const control = await getControlReadRepository().getControlProjection(
    session.tenantId as ControlTenantId
  );

  return {
    allowed: true,
    canReadAudit: auditRead.allowed,
    reason: configurationRead.reason,
    control: auditRead.allowed ? control : { ...control, audit: [] }
  };
};
