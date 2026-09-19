import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import {
  listInformationContainers,
  listInformationRevisions
} from '$lib/server/information-container';
import { recordWorkDecision } from '$lib/server/work-decision';
import {
  activateCommunicationsPlan,
  applyCommunicationsPlanDecision,
  createCommunicationsPlan,
  linkCommunicationsPlanInformation,
  listCommunicationsPlanInformation,
  listCommunicationsPlans,
  listCommunicationsPlanVersions,
  prepareCommunicationsPlanForDecision,
  reviseCommunicationsPlan
} from '$lib/server/marketing-communications';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
function version(data: FormData) {
  const value = Number(text(data, 'aggregateVersion'));
  if (!Number.isInteger(value) || value < 1)
    throw new Error('A valid aggregate version is required.');
  return value;
}
function json(data: FormData, name: string) {
  const raw = text(data, name);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(name + ' must contain valid JSON.');
  }
}
function target(tenant: string, mode: string, id?: string) {
  const q = new URLSearchParams({ mode });
  if (id) q.set('plan', id);
  return `/${tenant}/app/functions/f06/brand-strategy?${q.toString()}`;
}
function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The brand / strategy command failed.'
  });
}

async function issuedInformation(
  context: Awaited<ReturnType<typeof resolveRequestCommandContext>>
) {
  const containers = await listInformationContainers(context);
  const rows = [];
  for (const container of containers) {
    const revisions = await listInformationRevisions(context, container.id);
    for (const revision of revisions) {
      if (revision.lifecycleStatus === 'ISSUED') {
        rows.push({
          id: revision.id,
          containerRef: container.containerRef,
          revisionCode: revision.revisionCode,
          title: revision.title
        });
      }
    }
  }
  return rows;
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const mode = url.searchParams.get('mode') === 'brand' ? 'brand' : 'strategy';
  const plans = await listCommunicationsPlans(context);
  const selected =
    plans.find((item) => item.id === url.searchParams.get('plan')) ?? plans[0] ?? null;
  const versions = selected ? await listCommunicationsPlanVersions(context, selected.id) : [];
  const current = versions.find((item) => item.versionNo === selected?.currentVersionNo) ?? null;
  const information = current ? await listCommunicationsPlanInformation(context, current.id) : [];
  return {
    tenantSlug: params.tenant,
    mode,
    plans,
    selected,
    versions,
    current,
    information,
    issuedInformation: await issuedInformation(context),
    capabilities: {
      canManage: hasPermission(context, 'marketing.plan.manage'),
      canApprove:
        hasPermission(context, 'marketing.plan.approve') &&
        hasPermission(context, 'work.decision.record')
    }
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    const mode = text(data, 'mode') || 'strategy';
    try {
      const id = await createCommunicationsPlan(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          planRef: text(data, 'planRef'),
          planType: mode === 'brand' ? 'BRAND' : 'MARKETING_STRATEGY',
          title: text(data, 'title'),
          scopeContext: text(data, 'scopeContext'),
          objectives: json(data, 'objectives'),
          audiences: json(data, 'audiences'),
          keyMessages: json(data, 'keyMessages'),
          channels: json(data, 'channels'),
          activities: json(data, 'activities'),
          schedule: json(data, 'schedule'),
          measures: json(data, 'measures'),
          positioning: json(data, 'positioning'),
          brandDefinition: json(data, 'brandDefinition'),
          guidelineSummary: text(data, 'guidelineSummary') || undefined
        }
      );
      redirect(303, target(params.tenant, mode, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  revise: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'planId');
    const mode = text(data, 'mode') || 'strategy';
    try {
      await reviseCommunicationsPlan(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        version(data),
        {
          title: text(data, 'title') || undefined,
          scopeContext: text(data, 'scopeContext'),
          objectives: json(data, 'objectives'),
          audiences: json(data, 'audiences'),
          keyMessages: json(data, 'keyMessages'),
          channels: json(data, 'channels'),
          activities: json(data, 'activities'),
          schedule: json(data, 'schedule'),
          measures: json(data, 'measures'),
          positioning: json(data, 'positioning'),
          brandDefinition: json(data, 'brandDefinition'),
          guidelineSummary: text(data, 'guidelineSummary') || undefined
        }
      );
      redirect(303, target(params.tenant, mode, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  linkInformation: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'planId');
    const mode = text(data, 'mode') || 'strategy';
    try {
      await linkCommunicationsPlanInformation(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        {
          informationRevisionId: text(data, 'informationRevisionId'),
          linkRole: text(data, 'linkRole')
        }
      );
      redirect(303, target(params.tenant, mode, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  submit: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'planId');
    const mode = text(data, 'mode') || 'strategy';
    try {
      await prepareCommunicationsPlanForDecision(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        version(data)
      );
      redirect(303, target(params.tenant, mode, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  decide: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const id = text(data, 'planId');
    const mode = text(data, 'mode') || 'strategy';
    const aggregateVersion = version(data);
    const currentVersionNo = Number(text(data, 'currentVersionNo'));
    const outcome = text(data, 'outcome');
    try {
      const decisionId = await recordWorkDecision(context, {
        decisionType: 'COMMUNICATIONS_PLAN_APPROVAL',
        subjectType: 'COMMUNICATIONS_PLAN',
        subjectId: id,
        subjectVersion: String(currentVersionNo),
        outcome,
        reason: text(data, 'reason')
      });
      await applyCommunicationsPlanDecision(context, id, aggregateVersion, decisionId, outcome);
      redirect(303, target(params.tenant, mode, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  activate: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'planId');
    const mode = text(data, 'mode') || 'strategy';
    try {
      await activateCommunicationsPlan(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        version(data)
      );
      redirect(303, target(params.tenant, mode, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
