import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  acknowledgeWorkItem,
  completeWorkItem,
  escalateWorkItem,
  listMyWork,
  listMyWorkEscalations,
  resolveWorkEscalation,
  startWorkItem
} from '$lib/server/shared-work';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function version(data: FormData) {
  const value = Number(text(data, 'version'));
  if (!Number.isInteger(value) || value < 1)
    throw new Error('A valid Work Item version is required.');
  return value;
}

function problem(error: unknown) {
  return fail(400, {
    message:
      error instanceof Error ? error.message : 'The requested work action could not be completed.'
  });
}

function target(tenant: string) {
  return `/${tenant}/app/work`;
}

export const load: PageServerLoad = async ({ params, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [work, escalations] = await Promise.all([
    listMyWork(context),
    listMyWorkEscalations(context)
  ]);
  return {
    tenantSlug: params.tenant,
    actorDisplayName: context.actorDisplayName,
    currentTime: new Date().toISOString(),
    work,
    escalations,
    capabilities: {
      canExecute: hasPermission(context, 'work.item.execute'),
      canManage: hasPermission(context, 'work.item.manage')
    }
  };
};

export const actions: Actions = {
  start: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await startWorkItem(
        await resolveRequestCommandContext(params.tenant, locals),
        text(data, 'workItemId'),
        version(data)
      );
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant));
  },

  complete: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await completeWorkItem(
        await resolveRequestCommandContext(params.tenant, locals),
        text(data, 'workItemId'),
        version(data),
        text(data, 'completionNote')
      );
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant));
  },

  acknowledge: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await acknowledgeWorkItem(
        await resolveRequestCommandContext(params.tenant, locals),
        text(data, 'workItemId'),
        {
          acknowledgementType: text(data, 'acknowledgementType') || 'RECEIVED',
          statement: text(data, 'statement'),
          channel: 'NUBLOX'
        }
      );
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant));
  },

  escalate: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await escalateWorkItem(
        await resolveRequestCommandContext(params.tenant, locals),
        text(data, 'workItemId'),
        {
          triggerCode: text(data, 'triggerCode'),
          ruleKey: text(data, 'ruleKey') || undefined,
          reason: text(data, 'reason')
        }
      );
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant));
  },

  resolveEscalation: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await resolveWorkEscalation(
        await resolveRequestCommandContext(params.tenant, locals),
        text(data, 'escalationId'),
        text(data, 'resolutionNote')
      );
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant));
  }
};
