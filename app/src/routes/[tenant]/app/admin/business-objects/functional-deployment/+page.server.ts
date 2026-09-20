import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  activateFunctionalDeployment,
  assignToFunctionalDeployment,
  bootstrapFunctionalCatalogue,
  createFunctionalDeployment,
  createPosition,
  listDeploymentAssignments,
  listDeploymentOrganisationUnits,
  listDeploymentOrganisations,
  listDeploymentPeople,
  listFunctionalDefinitions,
  listFunctionalDeployments,
  listJobProfiles,
  listPositions
} from '$lib/server/functional-deployment';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value : '';
}

function number(data: FormData, name: string, fallback: number) {
  const raw = text(data, name).trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(name + ' must be a number.');
  return value;
}

function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The requested action could not be completed.'
  });
}

function target(tenant: string, deploymentId?: string) {
  const base = `/${tenant}/app/admin/business-objects/functional-deployment`;
  return deploymentId ? `${base}?deployment=${encodeURIComponent(deploymentId)}` : base;
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [
    functions,
    jobs,
    positions,
    deployments,
    people,
    organisations,
    organisationUnits
  ] = await Promise.all([
    listFunctionalDefinitions(context),
    listJobProfiles(context),
    listPositions(context),
    listFunctionalDeployments(context),
    listDeploymentPeople(context),
    listDeploymentOrganisations(context),
    listDeploymentOrganisationUnits(context)
  ]);

  const requestedDeploymentId = url.searchParams.get('deployment');
  const selected =
    deployments.find((item) => item.id === requestedDeploymentId) ?? deployments[0] ?? null;
  const assignments = selected ? await listDeploymentAssignments(context, selected.id) : [];

  return {
    tenantSlug: params.tenant,
    functions,
    jobs,
    positions,
    deployments,
    selected,
    assignments,
    people,
    organisations,
    organisationUnits,
    canManageCatalogue: hasPermission(context, 'functional.capability.manage'),
    canManageDeployment: hasPermission(context, 'functional.deployment.manage'),
    canManagePositions: hasPermission(context, 'people.position.manage')
  };
};

export const actions: Actions = {
  bootstrap: async ({ params, locals }) => {
    const context = await resolveRequestCommandContext(params.tenant, locals);
    try {
      await bootstrapFunctionalCatalogue(context);
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant));
  },

  createPosition: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    try {
      await createPosition(context, {
        positionCode: text(data, 'positionCode'),
        name: text(data, 'positionName'),
        jobProfileId: text(data, 'jobProfileId'),
        organisationUnitId: text(data, 'organisationUnitId'),
        capacityFte: number(data, 'capacityFte', 1),
        validFrom: text(data, 'validFrom'),
        validTo: text(data, 'validTo')
      });
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant));
  },

  createDeployment: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    let id: string;
    try {
      id = await createFunctionalDeployment(context, {
        functionalDefinitionId: text(data, 'functionalDefinitionId'),
        deploymentReference: text(data, 'deploymentReference'),
        contextType: text(data, 'contextType'),
        contextId: text(data, 'contextId'),
        responsibilityScope: text(data, 'responsibilityScope'),
        deliveryOrganisationPartyId: text(data, 'deliveryOrganisationPartyId'),
        organisationUnitId: text(data, 'organisationUnitId'),
        validFrom: text(data, 'validFrom'),
        validTo: text(data, 'validTo')
      });
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },

  activate: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const id = text(data, 'deploymentId');
    try {
      await activateFunctionalDeployment(context, id, number(data, 'version', 0));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },

  assign: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const deploymentId = text(data, 'deploymentId');
    try {
      await assignToFunctionalDeployment(context, deploymentId, {
        jobProfileId: text(data, 'jobProfileId'),
        positionId: text(data, 'positionId'),
        personPartyId: text(data, 'personPartyId'),
        organisationPartyId: text(data, 'organisationPartyId'),
        assignmentRole: text(data, 'assignmentRole'),
        responsibilityScope: text(data, 'assignmentScope'),
        allocationPercent: number(data, 'allocationPercent', 100),
        authorityReferenceType: text(data, 'authorityReferenceType'),
        authorityReferenceId: text(data, 'authorityReferenceId'),
        validFrom: text(data, 'validFrom'),
        validTo: text(data, 'validTo')
      });
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, deploymentId));
  }
};
