import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  activateOrganisationUnit,
  assignOrganisationUnitParent,
  closeOrganisationUnit,
  createOrganisationUnit,
  deactivateOrganisationUnit,
  listOrganisationUnitHierarchy,
  listOrganisationUnits,
  removeOrganisationUnitParent,
  updateOrganisationUnit,
  type OrganisationUnitInput
} from '$lib/server/organisation-structure';
import { listLegalEntities } from '$lib/server/foundation-legal-entity';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value : '';
}

function version(data: FormData) {
  const value = Number(text(data, 'version'));
  if (!Number.isInteger(value) || value < 1) throw new Error('A valid record version is required.');
  return value;
}

function unitInput(data: FormData): OrganisationUnitInput {
  return {
    unitCode: text(data, 'unitCode'),
    name: text(data, 'name'),
    unitType: text(data, 'unitType'),
    accountableLegalEntityPartyId: text(data, 'accountableLegalEntityPartyId'),
    validFrom: text(data, 'validFrom'),
    validTo: text(data, 'validTo')
  };
}

function target(tenant: string, unitId: string) {
  return `/${tenant}/app/admin/master-data/organisation-structure?unit=${encodeURIComponent(unitId)}`;
}

function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The requested action could not be completed.'
  });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [units, hierarchy, legalEntities] = await Promise.all([
    listOrganisationUnits(context),
    listOrganisationUnitHierarchy(context),
    listLegalEntities(context)
  ]);
  const requestedId = url.searchParams.get('unit');
  const selected = units.find((unit) => unit.id === requestedId) ?? units[0] ?? null;
  const activeParent = selected
    ? (hierarchy.find((edge) => edge.childUnitId === selected.id && edge.status === 'ACTIVE') ??
      null)
    : null;

  return {
    tenantSlug: params.tenant,
    units,
    hierarchy,
    legalEntities,
    selected,
    activeParent,
    canManage: hasPermission(context, 'org.structure.manage')
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    let id: string;
    try {
      id = await createOrganisationUnit(context, unitInput(data));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },

  save: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const id = text(data, 'unitId');
    try {
      await updateOrganisationUnit(context, id, unitInput(data), version(data));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },

  activate: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const id = text(data, 'unitId');
    try {
      await activateOrganisationUnit(context, id, version(data));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },

  deactivate: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const id = text(data, 'unitId');
    try {
      await deactivateOrganisationUnit(context, id, version(data));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },

  close: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const id = text(data, 'unitId');
    try {
      await closeOrganisationUnit(context, id, version(data));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },

  assignParent: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const childUnitId = text(data, 'childUnitId');
    try {
      await assignOrganisationUnitParent(
        context,
        childUnitId,
        text(data, 'parentUnitId'),
        text(data, 'effectiveFrom')
      );
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, childUnitId));
  },

  removeParent: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const childUnitId = text(data, 'childUnitId');
    try {
      await removeOrganisationUnitParent(
        context,
        childUnitId,
        version(data),
        text(data, 'effectiveTo')
      );
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, childUnitId));
  }
};
