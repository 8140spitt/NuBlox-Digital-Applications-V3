import { PLATFORM_PERMISSION_KEYS } from '@nublox/kernel';
import type {
  MySqlAccessRepository,
  MySqlFunctionalDeploymentReadRepository,
  MySqlIndustryDeliveryReadRepository,
  MySqlOrganisationReadRepository
} from '@nublox/persistence';
import type { PageServerLoad } from './$types';
import {
  getAccessRepository,
  getFunctionalDeploymentReadRepository,
  getIndustryDeliveryReadRepository,
  getOrganisationReadRepository
} from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];
type OrganisationTenantId = Parameters<MySqlOrganisationReadRepository['getStructure']>[0];
type FunctionalTenantId = Parameters<MySqlFunctionalDeploymentReadRepository['getProjection']>[0];
type DomainTenantId = Parameters<MySqlIndustryDeliveryReadRepository['getProjection']>[0];

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.auth;
  if (!session) {
    return {
      allowed: false,
      organisationAllowed: false,
      functionalAllowed: false,
      domainAllowed: false,
      structure: null,
      functional: null,
      domains: null
    };
  }

  const tenantId = session.tenantId as TenantId;
  const access = getAccessRepository();
  const [organisationRead, functionalRead, domainRead] = await Promise.all([
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.ORGANISATION_READ,
      { scopeType: 'TENANT' }
    ),
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.DEPLOYMENT_READ,
      { scopeType: 'TENANT' }
    ),
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.INDUSTRY_DELIVERY_READ,
      { scopeType: 'TENANT' }
    )
  ]);

  const [structure, functional, domains] = await Promise.all([
    organisationRead.allowed
      ? getOrganisationReadRepository().getStructure(session.tenantId as OrganisationTenantId)
      : Promise.resolve(null),
    functionalRead.allowed
      ? getFunctionalDeploymentReadRepository().getProjection(session.tenantId as FunctionalTenantId)
      : Promise.resolve(null),
    domainRead.allowed
      ? getIndustryDeliveryReadRepository().getProjection(session.tenantId as DomainTenantId)
      : Promise.resolve(null)
  ]);

  return {
    allowed: organisationRead.allowed || functionalRead.allowed || domainRead.allowed,
    organisationAllowed: organisationRead.allowed,
    functionalAllowed: functionalRead.allowed,
    domainAllowed: domainRead.allowed,
    structure,
    functional,
    domains
  };
};
