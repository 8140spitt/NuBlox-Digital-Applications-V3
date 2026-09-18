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
import { resolveDevelopmentCommandContext } from '$lib/server/platform-context';

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

export const load: PageServerLoad = async ({ params, url }) => {
  const context = await resolveDevelopmentCommandContext(params.tenant);
  const frameworks = await listStrategyFrameworks(context);
  const requestedId = url.searchParams.get('framework');
  const selected = frameworks.find((item) => item.id === requestedId) ?? frameworks[0] ?? null;
  return {
    frameworks,
    selected,
    versions: selected ? await listStrategyFrameworkVersions(context, selected.id) : [],
    audit: selected ? await listStrategyFrameworkAudit(context, selected.id) : []
  };
};

export const actions: Actions = {
  create: async ({ request, params }) => {
    const data = await request.formData();
    const context = await resolveDevelopmentCommandContext(params.tenant);
    let id: string;
    try {
      id = await createStrategyFramework(context, input(data));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },
  save: async ({ request, params }) => {
    const data = await request.formData();
    const context = await resolveDevelopmentCommandContext(params.tenant);
    const id = text(data, 'id');
    try {
      await updateStrategyFramework(context, id, input(data));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },
  submit: async ({ request, params }) => {
    const data = await request.formData();
    const context = await resolveDevelopmentCommandContext(params.tenant);
    const id = text(data, 'id');
    try {
      await submitStrategyFramework(context, id);
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },
  return: async ({ request, params }) => {
    const data = await request.formData();
    const context = await resolveDevelopmentCommandContext(params.tenant);
    const id = text(data, 'id');
    try {
      await returnStrategyFramework(context, id, text(data, 'note'));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },
  approve: async ({ request, params }) => {
    const data = await request.formData();
    const context = await resolveDevelopmentCommandContext(params.tenant);
    const id = text(data, 'id');
    try {
      await approveStrategyFramework(context, id, text(data, 'note'));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },
  reject: async ({ request, params }) => {
    const data = await request.formData();
    const context = await resolveDevelopmentCommandContext(params.tenant);
    const id = text(data, 'id');
    try {
      await rejectStrategyFramework(context, id, text(data, 'note'));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },
  publish: async ({ request, params }) => {
    const data = await request.formData();
    const context = await resolveDevelopmentCommandContext(params.tenant);
    const id = text(data, 'id');
    try {
      await publishStrategyFramework(context, id, text(data, 'note'));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  }
};
