import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  approveStrategyFramework,
  createStrategyFramework,
  listStrategyFrameworkAudit,
  listStrategyFrameworks,
  listStrategyFrameworkVersions,
  publishStrategyFramework,
  rejectStrategyFramework,
  returnStrategyFramework,
  submitStrategyFramework,
  updateStrategyFramework,
  type StrategyFrameworkInput
} from '$lib/server/strategy-framework';

const actor = 'Development User';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value : '';
}

function input(data: FormData): StrategyFrameworkInput {
  return {
    title: text(data, 'title'),
    purpose: text(data, 'purpose'),
    vision: text(data, 'vision'),
    mission: text(data, 'mission'),
    direction: text(data, 'direction'),
    reviewCadence: text(data, 'reviewCadence')
  };
}

function target(tenant: string, id: string) {
  return `/${tenant}/app/functions/f01/strategy-framework?framework=${encodeURIComponent(id)}`;
}

function problem(error: unknown) {
  return fail(400, { message: error instanceof Error ? error.message : 'The requested action could not be completed.' });
}

export const load: PageServerLoad = ({ params, url }) => {
  const frameworks = listStrategyFrameworks(params.tenant);
  const requestedId = url.searchParams.get('framework');
  const selected = frameworks.find((item) => item.id === requestedId) ?? frameworks[0] ?? null;
  return {
    frameworks,
    selected,
    versions: selected ? listStrategyFrameworkVersions(selected.id) : [],
    audit: selected ? listStrategyFrameworkAudit(params.tenant, selected.id) : []
  };
};

export const actions: Actions = {
  create: async ({ request, params }) => {
    const data = await request.formData();
    let id: string;
    try {
      id = createStrategyFramework(params.tenant, input(data), actor);
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },
  save: async ({ request, params }) => {
    const data = await request.formData();
    const id = text(data, 'id');
    try {
      updateStrategyFramework(params.tenant, id, input(data), actor);
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },
  submit: async ({ request, params }) => {
    const data = await request.formData();
    const id = text(data, 'id');
    try {
      submitStrategyFramework(params.tenant, id, actor);
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },
  return: async ({ request, params }) => {
    const data = await request.formData();
    const id = text(data, 'id');
    try {
      returnStrategyFramework(params.tenant, id, actor, text(data, 'note'));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },
  approve: async ({ request, params }) => {
    const data = await request.formData();
    const id = text(data, 'id');
    try {
      approveStrategyFramework(params.tenant, id, actor, text(data, 'note'));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },
  reject: async ({ request, params }) => {
    const data = await request.formData();
    const id = text(data, 'id');
    try {
      rejectStrategyFramework(params.tenant, id, actor, text(data, 'note'));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },
  publish: async ({ request, params }) => {
    const data = await request.formData();
    const id = text(data, 'id');
    try {
      publishStrategyFramework(params.tenant, id, actor, text(data, 'note'));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  }
};
