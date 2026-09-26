import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  AuthenticationRateLimitError,
  MySqlCbeOperatingProfileService,
  TenantRegistrationError,
  type CbeArchetypeCode,
  type CbeContractualPositionCode,
  type TenantSizeTier
} from '@nublox/persistence';
import {
  getAuthenticationRateLimiter,
  getDatabasePool,
  getTenantProvisioningService,
  getTenantRegistrationService
} from '$lib/server/platform';

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

function optionalPositiveInteger(value: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : Number.NaN;
}

function formState(formData: FormData) {
  return {
    businessName: value(formData, 'businessName'),
    tenantSlug: value(formData, 'tenantSlug'),
    primaryCountryCode: value(formData, 'primaryCountryCode').toUpperCase(),
    primaryLanguageCode: value(formData, 'primaryLanguageCode'),
    primaryClassificationValueId: value(formData, 'primaryClassificationValueId'),
    sizeTier: value(formData, 'sizeTier'),
    employeeCount: value(formData, 'employeeCount'),
    legalEntityCount: value(formData, 'legalEntityCount'),
    operatingModelCodes: values(formData, 'operatingModelCodes'),
    regulatoryRegimeIds: values(formData, 'regulatoryRegimeIds'),
    cbeArchetypeCode: value(formData, 'cbeArchetypeCode'),
    cbeContractualPositionCode: value(formData, 'cbeContractualPositionCode'),
    cbeEmploysOperatives: value(formData, 'cbeEmploysOperatives'),
    personName: value(formData, 'personName'),
    email: value(formData, 'email'),
    acceptedTerms: formData.get('acceptedTerms') === 'on'
  };
}

export const load: PageServerLoad = async () => {
  const cbeProfiles = new MySqlCbeOperatingProfileService(getDatabasePool());
  const [catalogue, cbeCatalogue] = await Promise.all([
    getTenantProvisioningService().catalogue(),
    cbeProfiles.catalogue()
  ]);
  return { catalogue, cbeCatalogue };
};

export const actions: Actions = {
  default: async ({ request, getClientAddress }) => {
    const formData = await request.formData();
    const state = formState(formData);
    const password = String(formData.get('password') ?? '');

    if (!SIZE_TIERS.has(state.sizeTier as TenantSizeTier)) {
      return fail(400, {
        ...state,
        error: 'Choose a valid business size tier.'
      });
    }

    const employeeCount = optionalPositiveInteger(state.employeeCount);
    const legalEntityCount = optionalPositiveInteger(state.legalEntityCount);

    if (Number.isNaN(employeeCount)) {
      return fail(400, {
        ...state,
        error: 'Employee count must be a positive whole number when supplied.'
      });
    }

    if (!legalEntityCount || Number.isNaN(legalEntityCount)) {
      return fail(400, {
        ...state,
        error: 'Number of legal entities must be a positive whole number.'
      });
    }

    const hasCbeProfile = Boolean(
      state.cbeArchetypeCode ||
      state.cbeContractualPositionCode ||
      state.cbeEmploysOperatives
    );
    if (
      hasCbeProfile &&
      (!state.cbeArchetypeCode ||
        !state.cbeContractualPositionCode ||
        !['Y', 'N'].includes(state.cbeEmploysOperatives))
    ) {
      return fail(400, {
        ...state,
        error: 'Complete all Construction & Built Environment operating-profile questions.'
      });
    }

    try {
      await getAuthenticationRateLimiter().consume(
        'TENANT_REGISTRATION',
        state.email,
        getClientAddress()
      );

      const registration = await getTenantRegistrationService().register({
        businessName: state.businessName,
        ...(state.tenantSlug ? { tenantSlug: state.tenantSlug } : {}),
        personName: state.personName,
        email: state.email,
        password,
        acceptedTerms: state.acceptedTerms,
        businessProfile: {
          primaryClassificationValueId: state.primaryClassificationValueId,
          sizeTier: state.sizeTier as TenantSizeTier,
          ...(employeeCount !== undefined ? { employeeCount } : {}),
          legalEntityCount,
          primaryCountryCode: state.primaryCountryCode,
          primaryLanguageCode: state.primaryLanguageCode,
          operatingModelCodes: state.operatingModelCodes,
          regulatoryRegimeIds: state.regulatoryRegimeIds
        },
        ...(hasCbeProfile
          ? {
              cbeOperatingProfile: {
                archetypeCode: state.cbeArchetypeCode as CbeArchetypeCode,
                contractualPositionCode:
                  state.cbeContractualPositionCode as CbeContractualPositionCode,
                employsOperatives: state.cbeEmploysOperatives === 'Y'
              }
            }
          : {})
      });

      throw redirect(
        303,
        `/${registration.tenantSlug}/app/auth/check-email?email=${encodeURIComponent(state.email)}`
      );
    } catch (error) {
      if (error instanceof AuthenticationRateLimitError) {
        return fail(429, {
          ...state,
          rateLimited: true,
          retryAfterSeconds: error.retryAfterSeconds,
          error: 'Too many registration attempts. Try again later.'
        });
      }

      if (error instanceof TenantRegistrationError) {
        const status =
          error.code === 'EMAIL_ALREADY_REGISTERED' || error.code === 'SLUG_UNAVAILABLE'
            ? 409
            : 400;

        return fail(status, {
          ...state,
          error: error.message,
          code: error.code
        });
      }
      throw error;
    }
  }
};
