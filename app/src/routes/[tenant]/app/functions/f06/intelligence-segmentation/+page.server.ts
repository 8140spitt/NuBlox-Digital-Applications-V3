import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import {
  createMarketInsight,
  listMarketInsights,
  validateMarketInsight
} from '$lib/server/market-insight';
import {
  activateMarketSegment,
  createMarketSegment,
  evaluateSegmentMembership,
  listMarketSegmentMemberships,
  listMarketSegments,
  listMarketSegmentVersions,
  reviseMarketSegment
} from '$lib/server/marketing-segmentation';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
function num(data: FormData, name: string) {
  const raw = text(data, name);
  if (!raw) return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(name + ' must be numeric.');
  return value;
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
  if (id) q.set(mode === 'segmentation' ? 'segment' : 'insight', id);
  return `/${tenant}/app/functions/f06/intelligence-segmentation?${q.toString()}`;
}
function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The marketing intelligence command failed.'
  });
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const mode = url.searchParams.get('mode') === 'segmentation' ? 'segmentation' : 'intelligence';
  const [insights, segments] = await Promise.all([
    listMarketInsights(context),
    listMarketSegments(context)
  ]);
  const selectedInsight =
    insights.find((item) => item.id === url.searchParams.get('insight')) ?? insights[0] ?? null;
  const selectedSegment =
    segments.find((item) => item.id === url.searchParams.get('segment')) ?? segments[0] ?? null;
  const segmentVersions = selectedSegment
    ? await listMarketSegmentVersions(context, selectedSegment.id)
    : [];
  const currentSegmentVersion =
    segmentVersions.find((item) => item.versionNo === selectedSegment?.currentVersionNo) ?? null;
  const memberships = currentSegmentVersion
    ? await listMarketSegmentMemberships(context, currentSegmentVersion.id)
    : [];
  return {
    tenantSlug: params.tenant,
    mode,
    insights,
    segments,
    selectedInsight,
    selectedSegment,
    segmentVersions,
    currentSegmentVersion,
    memberships,
    capabilities: {
      canIntelligence: hasPermission(context, 'marketing.intelligence.manage'),
      canSegment: hasPermission(context, 'marketing.segment.manage')
    }
  };
};

export const actions: Actions = {
  createInsight: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createMarketInsight(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          insightRef: text(data, 'insightRef'),
          insightType: text(data, 'insightType') || 'MARKET_RESEARCH',
          title: text(data, 'title'),
          subject: text(data, 'subject'),
          sourceType: text(data, 'sourceType'),
          sourceReference: text(data, 'sourceReference') || undefined,
          confidence: text(data, 'confidence') || 'MEDIUM',
          geography: text(data, 'geography') || undefined,
          sector: text(data, 'sector') || undefined,
          problemStatement: text(data, 'problemStatement'),
          needStatement: text(data, 'needStatement'),
          desiredOutcome: text(data, 'desiredOutcome') || undefined,
          evidenceReference: text(data, 'evidenceReference') || undefined
        }
      );
      redirect(303, target(params.tenant, 'intelligence', id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  validateInsight: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'insightId');
    try {
      await validateMarketInsight(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        version(data)
      );
      redirect(303, target(params.tenant, 'intelligence', id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  createSegment: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createMarketSegment(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          segmentRef: text(data, 'segmentRef'),
          name: text(data, 'name'),
          description: text(data, 'description'),
          criteria: json(data, 'criteria'),
          geography: json(data, 'geography'),
          sector: json(data, 'sector'),
          profile: json(data, 'profile'),
          valueAssessment: json(data, 'valueAssessment')
        }
      );
      redirect(303, target(params.tenant, 'segmentation', id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  reviseSegment: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'segmentId');
    try {
      await reviseMarketSegment(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        version(data),
        {
          description: text(data, 'description') || undefined,
          criteria: json(data, 'criteria'),
          geography: json(data, 'geography'),
          sector: json(data, 'sector'),
          profile: json(data, 'profile'),
          valueAssessment: json(data, 'valueAssessment')
        }
      );
      redirect(303, target(params.tenant, 'segmentation', id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  activateSegment: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'segmentId');
    try {
      await activateMarketSegment(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        version(data)
      );
      redirect(303, target(params.tenant, 'segmentation', id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  evaluateMember: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'segmentId');
    try {
      await evaluateSegmentMembership(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        Number(text(data, 'segmentVersionNo')),
        {
          subjectType: text(data, 'subjectType'),
          subjectId: text(data, 'subjectId'),
          membershipStatus: text(data, 'membershipStatus') || 'INCLUDED',
          score: num(data, 'score'),
          basis: json(data, 'basis')
        }
      );
      redirect(303, target(params.tenant, 'segmentation', id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
