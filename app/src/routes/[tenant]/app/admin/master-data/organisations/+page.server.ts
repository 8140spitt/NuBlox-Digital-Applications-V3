import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  activateOrganisation,
  createOrganisation,
  deactivateOrganisation,
  listOrganisationAudit,
  listOrganisations,
  updateOrganisation,
  type OrganisationInput
} from '$lib/server/foundation-organisation';
import { resolveDevelopmentCommandContext } from '$lib/server/platform-context';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value : '';
}

function input(data: FormData): OrganisationInput {
  return {
    legalName: text(data, 'legalName'),
    tradingName: text(data, 'tradingName'),
    registrationNumber: text(data, 'registrationNumber'),
    taxIdentifier: text(data, 'taxIdentifier'),
    countryCode: text(data, 'countryCode')
  };
}

function version(data: FormData) {
  const value = Number(text(data, 'version'));
  if (!Number.isInteger(value) || value < 1) throw new Error('A valid record version is required.');
  return value;
}

function target(tenant: string, id: string) {
  return `/${tenant}/app/admin/master-data/organisations?organisation=${encodeURIComponent(id)}`;
}

function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The requested action could not be completed.'
  });
}

export const load: PageServerLoad = ({ params, url }) => {
  const context = resolveDevelopmentCommandContext(params.tenant);
  const organisations = listOrganisations(context);
  const requestedId = url.searchParams.get('organisation');
  const selected = organisations.find((item) => item.id === requestedId) ?? organisations[0] ?? null;

  return {
    tenantSlug: params.tenant,
    actorDisplayName: context.actorDisplayName,
    organisations,
    selected,
    audit: selected ? listOrganisationAudit(context, selected.id) : []
  };
};

export const actions: Actions = {
  create: async ({ request, params }) => {
    const data = await request.formData();
    const context = resolveDevelopmentCommandContext(params.tenant);
    let id: string;
    try {
      id = createOrganisation(context, input(data));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },

  save: async ({ request, params }) => {
    const data = await request.formData();
    const context = resolveDevelopmentCommandContext(params.tenant);
    const id = text(data, 'id');
    try {
      updateOrganisation(context, id, input(data), version(data));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },

  activate: async ({ request, params }) => {
    const data = await request.formData();
    const context = resolveDevelopmentCommandContext(params.tenant);
    const id = text(data, 'id');
    try {
      activateOrganisation(context, id, version(data));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },

  deactivate: async ({ request, params }) => {
    const data = await request.formData();
    const context = resolveDevelopmentCommandContext(params.tenant);
    const id = text(data, 'id');
    try {
      deactivateOrganisation(context, id, version(data));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  }
};
