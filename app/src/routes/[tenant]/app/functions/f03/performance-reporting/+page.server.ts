import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { recordWorkDecision } from '$lib/server/work-decision';
import {
  calculatePerformanceSnapshot,
  distributePerformanceSnapshot,
  listPerformanceScorecards,
  listPerformanceSnapshotItems,
  listPerformanceSnapshots,
  publishPerformanceSnapshot,
  reviewPerformanceSnapshot
} from '$lib/server/enterprise-performance';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function integer(data: FormData, name: string) {
  const value = Number(text(data, name));
  if (!Number.isInteger(value) || value < 1) throw new Error(name + ' must be a positive whole number.');
  return value;
}

function target(tenant: string, id?: string) {
  return `/${tenant}/app/functions/f03/performance-reporting${id ? '?snapshot=' + encodeURIComponent(id) : ''}`;
}

function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The Performance Reporting command could not be completed.'
  });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [snapshots, scorecards] = await Promise.all([
    listPerformanceSnapshots(context),
    listPerformanceScorecards(context)
  ]);
  const selected = snapshots.find((row) => row.id === url.searchParams.get('snapshot')) ?? snapshots[0] ?? null;
  const items = selected ? await listPerformanceSnapshotItems(context, selected.id) : [];
  return {
    tenantSlug: params.tenant,
    snapshots,
    scorecards,
    selected,
    items,
    capabilities: {
      canManage: hasPermission(context, 'performance.reporting.manage'),
      canPublish: hasPermission(context, 'performance.reporting.publish')
    }
  };
};

export const actions: Actions = {
  calculate: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await calculatePerformanceSnapshot(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          snapshotRef: text(data, 'snapshotRef'),
          scorecardId: text(data, 'scorecardId') || undefined,
          scopeType: text(data, 'scopeType'),
          scopeId: text(data, 'scopeId'),
          periodStart: text(data, 'periodStart'),
          periodEnd: text(data, 'periodEnd'),
          asOfAt: text(data, 'asOfAt') || undefined
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  review: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'snapshotId');
    try {
      await reviewPerformanceSnapshot(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        integer(data, 'aggregateVersion')
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  publish: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'snapshotId');
    const version = integer(data, 'aggregateVersion');
    try {
      const context = await resolveRequestCommandContext(params.tenant, locals);
      const decisionId = await recordWorkDecision(context, {
        decisionType: 'PERFORMANCE_SNAPSHOT_REVIEW',
        subjectType: 'PERFORMANCE_SNAPSHOT',
        subjectId: id,
        subjectVersion: String(version),
        outcome: 'APPROVED',
        reason: text(data, 'reason')
      });
      await publishPerformanceSnapshot(context, id, version, decisionId);
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  distribute: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'snapshotId');
    try {
      await distributePerformanceSnapshot(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        {
          recipientPartyId: text(data, 'recipientPartyId'),
          channel: text(data, 'channel'),
          distributionReference: text(data, 'distributionReference') || undefined
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
