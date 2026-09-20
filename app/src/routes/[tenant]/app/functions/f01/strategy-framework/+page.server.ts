import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { objectHref } from '$lib/data/runtime-object-registry';
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
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { recordWorkDecision } from '$lib/server/work-decision';

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
  return objectHref(tenant, 'strategy-framework', id, { from: 'F01.01' });
}

function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The requested action could not be completed.'
  });
}

async function recordReviewDecision(
  context: Awaited<ReturnType<typeof resolveRequestCommandContext>>,
  id: string,
  outcome: 'RETURNED' | 'APPROVED' | 'REJECTED',
  reason: string
) {
  const framework = (await listStrategyFrameworks(context)).find((item) => item.id === id);
  if (!framework) throw new Error('Strategy framework not found.');
  return recordWorkDecision(context, {
    decisionType: 'STRATEGY_FRAMEWORK_REVIEW',
    subjectType: 'STRATEGY_FRAMEWORK',
    subjectId: framework.id,
    subjectVersion: String(framework.currentVersion),
    outcome,
    reason
  });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
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
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    let id: string;
    try {
      id = await createStrategyFramework(context, input(data));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },
  save: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const id = text(data, 'id');
    try {
      await updateStrategyFramework(context, id, input(data));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },
  submit: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const id = text(data, 'id');
    try {
      await submitStrategyFramework(context, id);
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },
  return: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const id = text(data, 'id');
    try {
      const note = text(data, 'note').trim();
      if (!note) throw new Error('A return reason is required.');
      const decisionId = await recordReviewDecision(context, id, 'RETURNED', note);
      await returnStrategyFramework(context, id, decisionId);
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },
  approve: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const id = text(data, 'id');
    try {
      const note =
        text(data, 'note').trim() || 'Approved through governed Strategy Framework review.';
      const decisionId = await recordReviewDecision(context, id, 'APPROVED', note);
      await approveStrategyFramework(context, id, decisionId);
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },
  reject: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const id = text(data, 'id');
    try {
      const note = text(data, 'note').trim();
      if (!note) throw new Error('A rejection reason is required.');
      const decisionId = await recordReviewDecision(context, id, 'REJECTED', note);
      await rejectStrategyFramework(context, id, decisionId);
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },
  publish: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const id = text(data, 'id');
    try {
      await publishStrategyFramework(context, id, text(data, 'note'));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  }
};
