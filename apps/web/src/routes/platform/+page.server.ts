import { PlatformAdministrationError } from '@nublox/persistence';
import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  clearPlatformOperatorSession,
  getPlatformAdministrationService,
  PLATFORM_SESSION_COOKIE,
  resolvePlatformOperatorSession
} from '$lib/server/platform-auth';

async function requireOperator(event: Pick<RequestEvent, 'cookies'>) {
  const operator = await resolvePlatformOperatorSession(event.cookies);
  if (!operator) throw redirect(303, '/platform/login');
  return operator;
}

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

export const load: PageServerLoad = async ({ cookies, url }) => {
  const operator = await requireOperator({ cookies });
  const search = url.searchParams.get('q')?.trim() ?? '';
  const tenants = await getPlatformAdministrationService().listTenants(search);

  return { operator, tenants, search };
};

async function runLifecycleAction(
  event: RequestEvent,
  action: (
    operator: Awaited<ReturnType<typeof requireOperator>>,
    tenantId: string,
    reason: string,
    formData: FormData
  ) => Promise<void>
) {
  const operator = await requireOperator(event);
  const formData = await event.request.formData();
  const tenantId = field(formData, 'tenantId');
  const reason = field(formData, 'reason');

  if (!tenantId) return fail(400, { error: 'Tenant ID is required.' });

  try {
    await action(operator, tenantId, reason, formData);
    return { success: true };
  } catch (error) {
    if (error instanceof PlatformAdministrationError) {
      return fail(400, { error: error.message, tenantId });
    }
    throw error;
  }
}

export const actions: Actions = {
  logout: async ({ cookies }) => {
    const token = cookies.get(PLATFORM_SESSION_COOKIE);
    if (token) await getPlatformAdministrationService().revokeSession(token);
    clearPlatformOperatorSession(cookies);
    throw redirect(303, '/platform/login');
  },

  suspend: (event) =>
    runLifecycleAction(event, (operator, tenantId, reason) =>
      getPlatformAdministrationService().suspendTenant(operator, tenantId, reason)
    ),

  reactivate: (event) =>
    runLifecycleAction(event, (operator, tenantId, reason) =>
      getPlatformAdministrationService().reactivateTenant(operator, tenantId, reason)
    ),

  requestDeletion: (event) =>
    runLifecycleAction(event, (operator, tenantId, reason) =>
      getPlatformAdministrationService().requestTenantDeletion(operator, tenantId, reason)
    ),

  finaliseDeletion: (event) =>
    runLifecycleAction(event, (operator, tenantId, reason, formData) =>
      getPlatformAdministrationService().finaliseTenantDeletion(
        operator,
        tenantId,
        field(formData, 'confirmationSlug'),
        reason
      )
    )
};
