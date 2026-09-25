import { PLATFORM_PERMISSION_KEYS } from '@nublox/kernel';
import {
  TenantProvisioningError,
  type MySqlAccessRepository,
  type TenantSizeTier
} from '@nublox/persistence';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getTenantProvisioningService
} from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];

const SIZE_TIERS = new Set<TenantSizeTier>([
  'MICRO',
  'SMALL',
  'MEDIUM',
  'LARGE',
  'ENTERPRISE'
]);

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function values(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function positiveInteger(raw: string, required: boolean): number | undefined {
  if (!raw && !required) return undefined;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : Number.NaN;
}

async function permissions(
  tenantId: string,
  personId: string
): Promise<{ canRead: boolean; canManage: boolean; reason: string }> {
  const access = getAccessRepository();
  const [read, manage] = await Promise.all([
    access.evaluatePermission(
      tenantId as TenantId,
      personId,
      PLATFORM_PERMISSION_KEYS.TENANT_CONFIGURATION_READ,
      { scopeType: 'TENANT' }
    ),
    access.evaluatePermission(
      tenantId as TenantId,
      personId,
      PLATFORM_PERMISSION_KEYS.TENANT_CONFIGURATION_MANAGE,
      { scopeType: 'TENANT' }
    )
  ]);

  return {
    canRead: read.allowed,
    canManage: manage.allowed,
    reason: read.allowed ? manage.reason : read.reason
  };
}

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.auth;
  if (!session) {
    return {
      canRead: false,
      canManage: false,
      reason: 'No authenticated Tenant context is available.',
      configuration: null,
      catalogue: null,
      needsConfiguration: false
    };
  }

  const permission = await permissions(session.tenantId, session.personId);
  if (!permission.canRead) {
    return {
      ...permission,
      configuration: null,
      catalogue: null,
      needsConfiguration: false
    };
  }

  try {
    return {
      ...permission,
      configuration: await getTenantProvisioningService().getTenantConfiguration(
        session.tenantId
      ),
      catalogue: null,
      needsConfiguration: false
    };
  } catch (error) {
    if (
      error instanceof TenantProvisioningError &&
      error.message === 'Tenant business profile does not exist.'
    ) {
      return {
        ...permission,
        configuration: null,
        catalogue: permission.canManage
          ? await getTenantProvisioningService().catalogue()
          : null,
        needsConfiguration: true
      };
    }
    throw error;
  }
};

export const actions: Actions = {
  configure: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { error: 'Authentication required.' });

    const permission = await permissions(session.tenantId, session.personId);
    if (!permission.canManage) {
      return fail(403, {
        error: 'Your current access does not permit Tenant configuration changes.'
      });
    }

    const formData = await request.formData();
    const sizeTier = value(formData, 'sizeTier') as TenantSizeTier;
    const employeeCount = positiveInteger(value(formData, 'employeeCount'), false);
    const legalEntityCount = positiveInteger(
      value(formData, 'legalEntityCount'),
      true
    );

    const submitted = {
      primaryClassificationValueId: value(
        formData,
        'primaryClassificationValueId'
      ),
      sizeTier,
      employeeCount: value(formData, 'employeeCount'),
      legalEntityCount: value(formData, 'legalEntityCount'),
      primaryCountryCode: value(formData, 'primaryCountryCode').toUpperCase(),
      primaryLanguageCode: value(formData, 'primaryLanguageCode'),
      operatingModelCodes: values(formData, 'operatingModelCodes'),
      regulatoryRegimeIds: values(formData, 'regulatoryRegimeIds')
    };

    if (!SIZE_TIERS.has(sizeTier)) {
      return fail(400, { ...submitted, error: 'Choose a valid business size tier.' });
    }
    if (Number.isNaN(employeeCount)) {
      return fail(400, {
        ...submitted,
        error: 'Employee count must be a positive whole number when supplied.'
      });
    }
    if (!legalEntityCount || Number.isNaN(legalEntityCount)) {
      return fail(400, {
        ...submitted,
        error: 'Number of legal entities must be a positive whole number.'
      });
    }

    try {
      const result = await getTenantProvisioningService().provisionExistingTenant(
        session.tenantId,
        session.personId,
        {
          primaryClassificationValueId: submitted.primaryClassificationValueId,
          sizeTier,
          ...(employeeCount !== undefined ? { employeeCount } : {}),
          legalEntityCount,
          primaryCountryCode: submitted.primaryCountryCode,
          primaryLanguageCode: submitted.primaryLanguageCode,
          operatingModelCodes: submitted.operatingModelCodes,
          regulatoryRegimeIds: submitted.regulatoryRegimeIds
        }
      );

      return {
        configured: true,
        provisioningRunId: result.provisioningRunId,
        industrySolutionIds: result.industrySolutionIds
      };
    } catch (error) {
      if (error instanceof TenantProvisioningError) {
        return fail(400, { ...submitted, error: error.message });
      }
      throw error;
    }
  }
};
