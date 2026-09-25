import { PLATFORM_PERMISSION_KEYS } from '@nublox/kernel';
import type {
  MySqlAccessRepository,
  MySqlFunctionalDeploymentReadRepository,
  MySqlIndustryDeliveryReadRepository,
  MySqlOrganisationReadRepository
} from '@nublox/persistence';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { functions } from '$lib/function-catalog';
import {
  getAccessRepository,
  getFunctionalDeploymentReadRepository,
  getIndustryDeliveryReadRepository,
  getOrganisationReadRepository
} from '$lib/server/platform';
import {
  buildTeamContextOptions,
  domainDeploymentMatchesContext,
  functionalDeploymentMatchesContext,
  resolveTeamContext
} from '$lib/server/context-selection';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];
type OrganisationTenantId = Parameters<MySqlOrganisationReadRepository['getStructure']>[0];
type FunctionalTenantId = Parameters<MySqlFunctionalDeploymentReadRepository['getProjection']>[0];
type DomainTenantId = Parameters<MySqlIndustryDeliveryReadRepository['getProjection']>[0];

type TeamView = 'overview' | 'governance' | 'delivery' | 'people' | 'performance' | 'records';
const VALID_VIEWS = new Set<TeamView>(['overview', 'governance', 'delivery', 'people', 'performance', 'records']);

export const load: PageServerLoad = async ({ locals, params, url }) => {
  const session = locals.auth;
  if (!session) {
    return {
      allowed: false,
      reason: 'No authenticated tenant context is available.',
      kind: null,
      view: 'overview' as const,
      contextOptions: [],
      selectedContext: null,
      team: null,
      governanceMembers: [],
      deliveryMembers: []
    };
  }

  const code = params.code.toUpperCase();
  const isFunction = /^F\d{2}$/.test(code);
  const isDomain = /^D\d{2}$/.test(code);
  if (!isFunction && !isDomain) error(404, 'Team not found');

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

  const structure = organisationRead.allowed
    ? await getOrganisationReadRepository().getStructure(session.tenantId as OrganisationTenantId)
    : null;
  const contextOptions = buildTeamContextOptions(session.tenantName, structure);
  const selectedContext = resolveTeamContext(url.searchParams.get('context'), contextOptions);
  const requestedView = url.searchParams.get('view')?.toLowerCase() as TeamView | undefined;
  const view: TeamView = requestedView && VALID_VIEWS.has(requestedView) ? requestedView : 'overview';

  if (isFunction) {
    const definition = functions.find((item) => item.code === code);
    if (!definition) error(404, 'Core Function Team not found');

    const projection = functionalRead.allowed
      ? await getFunctionalDeploymentReadRepository().getProjection(session.tenantId as FunctionalTenantId)
      : null;
    const deployments = projection?.deployments.filter(
      (item) => item.functionCode === code && functionalDeploymentMatchesContext(item, selectedContext)
    ) ?? [];

    const members = deployments.flatMap((deployment) =>
      deployment.assignments
        .filter((assignment) => assignment.status === 'ACTIVE')
        .map((assignment) => ({
          id: assignment.id,
          side: deployment.deploymentPurpose === 'FUNCTIONAL_GOVERNANCE' ? 'GOVERNANCE' as const : 'DELIVERY' as const,
          label: assignment.assigneeLabel,
          assigneeType: assignment.assigneeType,
          role: assignment.responsibilityRole,
          jobProfileName: assignment.jobProfileName,
          organisationName: deployment.organisationName,
          organisationUnitName: deployment.organisationUnitName,
          scope: deployment.scopeDescription,
          capacityPercent: assignment.activeCapacityPercent
        }))
    );

    return {
      allowed: true,
      reason: functionalRead.reason,
      kind: 'CORE_FUNCTION' as const,
      view,
      contextOptions,
      selectedContext,
      team: {
        code: definition.code,
        name: definition.name,
        purpose: 'Canonical enterprise capability operated as a Team within the selected organisational context.',
        subfunctions: definition.subfunctions,
        jobs: [],
        engines: definition.engines,
        services: []
      },
      governanceMembers: members.filter((item) => item.side === 'GOVERNANCE'),
      deliveryMembers: members.filter((item) => item.side === 'DELIVERY')
    };
  }

  if (!domainRead.allowed) {
    return {
      allowed: false,
      reason: domainRead.reason,
      kind: null,
      view,
      contextOptions,
      selectedContext,
      team: null,
      governanceMembers: [],
      deliveryMembers: []
    };
  }

  const projection = await getIndustryDeliveryReadRepository().getProjection(session.tenantId as DomainTenantId);
  const domain = projection.deliveryDomains.find((item) => item.code === code);
  if (!domain) error(404, 'Professional Domain Team not found');

  const jobs = projection.jobProfiles.filter((item) => item.primaryDeliveryDomainId === domain.id);
  const deployments = projection.disciplineDeployments.filter(
    (item) => item.domainName === domain.name && domainDeploymentMatchesContext(item, selectedContext)
  );
  const services = projection.services.filter((item) => item.deliveryDomainId === domain.id);
  const members = deployments
    .filter((item) => item.status === 'ACTIVE')
    .map((item) => ({
      id: item.id,
      side: item.deploymentPurpose === 'FUNCTIONAL_GOVERNANCE' ? 'GOVERNANCE' as const : 'DELIVERY' as const,
      label: item.assigneeName,
      assigneeType: item.assigneeType,
      role: item.responsibilityRole,
      jobProfileName: item.canonicalName,
      organisationName: item.organisationName,
      organisationUnitName: item.organisationUnitName,
      scope: item.scopeDescription,
      capacityPercent: item.capacityPercent ?? 0
    }));

  return {
    allowed: true,
    reason: domainRead.reason,
    kind: 'PROFESSIONAL_DOMAIN' as const,
    view,
    contextOptions,
    selectedContext,
    team: {
      code: domain.code,
      name: domain.name,
      purpose: domain.purpose,
      subfunctions: [],
      jobs,
      engines: [],
      services
    },
    governanceMembers: members.filter((item) => item.side === 'GOVERNANCE'),
    deliveryMembers: members.filter((item) => item.side === 'DELIVERY')
  };
};
