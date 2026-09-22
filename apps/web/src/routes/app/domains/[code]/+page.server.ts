import { PLATFORM_PERMISSION_KEYS } from '@nublox/kernel';
import type { MySqlAccessRepository, MySqlIndustryDeliveryReadRepository } from '@nublox/persistence';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAccessRepository, getIndustryDeliveryReadRepository } from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];
type ProjectionTenantId = Parameters<MySqlIndustryDeliveryReadRepository['getProjection']>[0];

type DomainWorkspaceView = 'overview' | 'governance' | 'delivery' | 'performance' | 'records';
const VALID_VIEWS = new Set<DomainWorkspaceView>(['overview', 'governance', 'delivery', 'performance', 'records']);

export const load: PageServerLoad = async ({ locals, params, url }) => {
  const session = locals.auth;
  if (!session) {
    return { allowed: false, reason: 'No authenticated tenant context is available.', workspace: null };
  }

  const tenantId = session.tenantId as TenantId;
  const evaluation = await getAccessRepository().evaluatePermission(
    tenantId,
    session.personId,
    PLATFORM_PERMISSION_KEYS.INDUSTRY_DELIVERY_READ,
    { scopeType: 'TENANT' }
  );

  if (!evaluation.allowed) {
    return { allowed: false, reason: evaluation.reason, workspace: null };
  }

  const projection = await getIndustryDeliveryReadRepository().getProjection(
    session.tenantId as ProjectionTenantId
  );
  const domain = projection.deliveryDomains.find((entry) => entry.code === params.code.toUpperCase());
  if (!domain) error(404, 'CBE Domain workspace not found');

  const jobs = projection.jobProfiles.filter((profile) => profile.primaryDeliveryDomainId === domain.id);
  const internalCapabilities = projection.internalCapabilities.filter(
    (capability) => capability.primaryDeliveryDomainId === domain.id
  );
  const deployments = projection.disciplineDeployments.filter(
    (deployment) => deployment.domainName === domain.name
  );
  const services = projection.services.filter((service) => service.deliveryDomainId === domain.id);
  const serviceIds = new Set(services.map((service) => service.id));
  const requirements = projection.requirements.filter((requirement) => serviceIds.has(requirement.serviceOfferingId));

  const requestedView = url.searchParams.get('view')?.toLowerCase() as DomainWorkspaceView | undefined;
  const view: DomainWorkspaceView = requestedView && VALID_VIEWS.has(requestedView)
    ? requestedView
    : 'overview';

  return {
    allowed: true,
    reason: evaluation.reason,
    workspace: {
      domain,
      view,
      jobs,
      internalCapabilities,
      governanceDeployments: deployments.filter((item) => item.deploymentPurpose === 'FUNCTIONAL_GOVERNANCE'),
      deliveryDeployments: deployments.filter((item) => item.deploymentPurpose === 'FUNCTIONAL_DELIVERY'),
      services,
      requirements,
      totals: {
        jobs: jobs.length,
        internalCapabilities: internalCapabilities.length,
        governanceDeployments: deployments.filter((item) => item.deploymentPurpose === 'FUNCTIONAL_GOVERNANCE').length,
        deliveryDeployments: deployments.filter((item) => item.deploymentPurpose === 'FUNCTIONAL_DELIVERY').length,
        services: services.length,
        sourcingGaps: requirements.filter((item) => item.remainingPercent > 0).length
      }
    }
  };
};
