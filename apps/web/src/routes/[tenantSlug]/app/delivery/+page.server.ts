import {
  PLATFORM_PERMISSION_KEYS,
  type DeliveryCapabilityFulfilmentType,
  type DeliveryCapabilityProviderType,
  type DeploymentContextType,
  type DeploymentPurpose,
  type DeliveryCapabilitySourcingStrategy,
  type ServiceCapabilityRole,
  type TenantCapabilitySupplyModel,
  type WorkResponsibilityRole
} from '@nublox/kernel';
import {
  IndustryDeliveryCommandError,
  type MySqlAccessRepository,
  type MySqlIndustryDeliveryReadRepository
} from '@nublox/persistence';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getIndustryDeliveryCommandService,
  getIndustryDeliveryReadRepository
} from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];
type ProjectionTenantId = Parameters<MySqlIndustryDeliveryReadRepository['getProjection']>[0];

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}
function optionalValue(formData: FormData, name: string): string | undefined {
  const result = value(formData, name);
  return result || undefined;
}
function parseEnum<T extends string>(raw: string, allowed: ReadonlyArray<T>, label: string): T {
  if (!allowed.includes(raw as T)) {
    throw new IndustryDeliveryCommandError(`A valid ${label} is required.`, 'INVALID_INPUT');
  }
  return raw as T;
}
function signedIn(locals: App.Locals) {
  if (!locals.auth) {
    throw new IndustryDeliveryCommandError('Sign in required.', 'PERMISSION_DENIED');
  }
  return locals.auth;
}
function commandFailure(error: unknown, action: string) {
  if (error instanceof IndustryDeliveryCommandError) {
    const status =
      error.code === 'PERMISSION_DENIED'
        ? 403
        : error.code === 'NOT_FOUND'
          ? 404
          : error.code === 'CONFLICT'
            ? 409
            : 400;
    return fail(status, { action, ok: false, error: error.message, code: error.code });
  }
  throw error;
}

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
      PLATFORM_PERMISSION_KEYS.INDUSTRY_DELIVERY_READ,
      { scopeType: 'TENANT' }
    ),
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.INDUSTRY_DELIVERY_MANAGE,
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
    projection: await getIndustryDeliveryReadRepository().getProjection(
      session.tenantId as ProjectionTenantId
    )
  };
};

export const actions: Actions = {
  createProject: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      const project = await getIndustryDeliveryCommandService().createProjectContext(
        session.tenantId as TenantId,
        session.personId,
        { code: value(formData, 'code'), name: value(formData, 'name') }
      );
      return { action: 'createProject', ok: true, message: `Project context ${project.code} created.` };
    } catch (error) {
      return commandFailure(error, 'createProject');
    }
  },

  createService: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      const service = await getIndustryDeliveryCommandService().createServiceOffering(
        session.tenantId as TenantId,
        session.personId,
        {
          deliveryDomainId: value(formData, 'deliveryDomainId'),
          code: value(formData, 'code'),
          name: value(formData, 'name'),
          description: value(formData, 'description')
        }
      );
      return { action: 'createService', ok: true, message: `Service ${service.name} created.` };
    } catch (error) {
      return commandFailure(error, 'createService');
    }
  },

  addServiceProfession: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getIndustryDeliveryCommandService().addServiceProfession(
        session.tenantId as TenantId,
        session.personId,
        {
          serviceOfferingId: value(formData, 'serviceOfferingId'),
          industryJobProfileId: value(formData, 'industryJobProfileId'),
          role: parseEnum<ServiceCapabilityRole>(
            value(formData, 'role'),
            ['CORE', 'SUPPORTING', 'ASSURANCE'],
            'service capability role'
          )
        }
      );
      return { action: 'addServiceProfession', ok: true, message: 'Profession added to Service.' };
    } catch (error) {
      return commandFailure(error, 'addServiceProfession');
    }
  },

  declareCapability: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      const capability = await getIndustryDeliveryCommandService().declareInternalCapability(
        session.tenantId as TenantId,
        session.personId,
        {
          industryJobProfileId: value(formData, 'industryJobProfileId'),
          supplyModel: parseEnum<TenantCapabilitySupplyModel>(
            value(formData, 'supplyModel'),
            ['INTERNAL', 'HYBRID'],
            'capability supply model'
          ),
          notes: optionalValue(formData, 'notes')
        }
      );
      return { action: 'declareCapability', ok: true, message: `Internal capability ${capability.supplyModel.toLowerCase()} recorded.` };
    } catch (error) {
      return commandFailure(error, 'declareCapability');
    }
  },

  createDisciplineDeployment: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      const [industryJobProfileId = '', assigneeTypeRaw = '', ...assigneeParts] =
        value(formData, 'disciplineProvider').split('|');
      const assigneeId = assigneeParts.join('|');
      const [contextTypeRaw = '', ...contextParts] = value(formData, 'context').split('|');
      const contextObjectId = contextParts.join('|').trim();

      const deployment = await getIndustryDeliveryCommandService().createDisciplineDeployment(
        session.tenantId as TenantId,
        session.personId,
        {
          industryJobProfileId,
          deploymentPurpose: parseEnum<DeploymentPurpose>(
            value(formData, 'deploymentPurpose'),
            ['FUNCTIONAL_GOVERNANCE', 'FUNCTIONAL_DELIVERY'],
            'deployment purpose'
          ),
          assigneeType: parseEnum<'PERSON' | 'POSITION'>(
            assigneeTypeRaw,
            ['PERSON', 'POSITION'],
            'discipline assignee'
          ),
          assigneeId,
          roleTitle: value(formData, 'roleTitle'),
          responsibilityRole: parseEnum<WorkResponsibilityRole>(
            value(formData, 'responsibilityRole'),
            [
              'ACCOUNTABLE',
              'RESPONSIBLE',
              'CONTRIBUTOR',
              'REVIEWER',
              'CHECKER',
              'APPROVER',
              'ACCEPTOR',
              'CONSULTED',
              'INFORMED',
              'ASSURANCE'
            ],
            'responsibility role'
          ),
          contextType: parseEnum<DeploymentContextType>(
            contextTypeRaw,
            ['TENANT', 'ORGANISATION', 'PROJECT', 'CONTRACT', 'PACKAGE', 'SITE', 'ASSET', 'SERVICE', 'CUSTOM'],
            'deployment context'
          ),
          ...(contextObjectId ? { contextObjectId } : {}),
          scopeDescription: value(formData, 'scopeDescription'),
          capacityPercent: optionalValue(formData, 'capacityPercent'),
          effectiveFrom: optionalValue(formData, 'effectiveFrom'),
          effectiveTo: optionalValue(formData, 'effectiveTo')
        }
      );

      return {
        action: 'createDisciplineDeployment',
        ok: true,
        message: `${deployment.roleTitle} deployed for ${deployment.deploymentPurpose.replaceAll('_', ' ').toLowerCase()}.`
      };
    } catch (error) {
      return commandFailure(error, 'createDisciplineDeployment');
    }
  },

  createRequirement: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      const [serviceOfferingId = '', industryJobProfileId = ''] =
        value(formData, 'serviceProfession').split('|');
      const requirement = await getIndustryDeliveryCommandService().createRequirement(
        session.tenantId as TenantId,
        session.personId,
        {
          contextObjectId: value(formData, 'contextObjectId'),
          serviceOfferingId,
          industryJobProfileId,
          description: value(formData, 'description'),
          requiredHeadcount: value(formData, 'requiredHeadcount'),
          sourcingStrategy: parseEnum<DeliveryCapabilitySourcingStrategy>(
            value(formData, 'sourcingStrategy'),
            ['INTERNAL', 'EXTERNAL', 'HYBRID', 'UNDECIDED'],
            'sourcing strategy'
          ),
          effectiveFrom: optionalValue(formData, 'effectiveFrom'),
          effectiveTo: optionalValue(formData, 'effectiveTo')
        }
      );
      return { action: 'createRequirement', ok: true, message: `Capability demand for ${requirement.requiredHeadcount} resource(s) created.` };
    } catch (error) {
      return commandFailure(error, 'createRequirement');
    }
  },

  fulfilRequirement: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      const [providerTypeRaw, providerId = ''] = value(formData, 'provider').split('|');
      await getIndustryDeliveryCommandService().fulfilRequirement(
        session.tenantId as TenantId,
        session.personId,
        {
          requirementId: value(formData, 'requirementId'),
          fulfilmentType: parseEnum<DeliveryCapabilityFulfilmentType>(
            value(formData, 'fulfilmentType'),
            ['INTERNAL', 'EXTERNAL'],
            'fulfilment type'
          ),
          providerType: parseEnum<DeliveryCapabilityProviderType>(
            providerTypeRaw ?? '',
            ['PERSON', 'POSITION', 'ORGANISATION_UNIT', 'ORGANISATION'],
            'provider type'
          ),
          providerId,
          requirementSharePercent: value(formData, 'requirementSharePercent'),
          resourceCapacityPercent: optionalValue(formData, 'resourceCapacityPercent'),
          effectiveFrom: optionalValue(formData, 'effectiveFrom'),
          effectiveTo: optionalValue(formData, 'effectiveTo')
        }
      );
      return { action: 'fulfilRequirement', ok: true, message: 'Capability fulfilment allocated.' };
    } catch (error) {
      return commandFailure(error, 'fulfilRequirement');
    }
  }
};
