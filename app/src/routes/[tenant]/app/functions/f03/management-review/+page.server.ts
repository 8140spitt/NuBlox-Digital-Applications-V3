import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { listGovernanceBodies } from '$lib/server/governance-body';
import { listPerformanceSnapshots } from '$lib/server/enterprise-performance';
import {
  completePerformanceManagementReview,
  convenePerformanceManagementReview,
  createPerformanceManagementReviewAction,
  linkPerformanceSnapshotToManagementReview,
  listPerformanceManagementReviewActionIds,
  listPerformanceManagementReviewAgenda,
  listPerformanceManagementReviewAttendees,
  listPerformanceManagementReviewDecisionIds,
  listPerformanceManagementReviews,
  listPerformanceManagementReviewSnapshots,
  recordPerformanceManagementReviewAttendance,
  recordPerformanceManagementReviewDecision,
  schedulePerformanceManagementReview
} from '$lib/server/performance-management-review';

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
  return `/${tenant}/app/functions/f03/management-review${id ? '?review=' + encodeURIComponent(id) : ''}`;
}
function problem(error: unknown) {
  return fail(400, { message: error instanceof Error ? error.message : 'The Management Review command could not be completed.' });
}
function agenda(data: FormData) {
  return text(data, 'agenda')
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row, index) => {
      const [subject, outcome, purpose, subjectType = '', subjectId = '', subjectVersion = ''] = row
        .split('|')
        .map((item) => item.trim());
      if (!subject || !outcome || !purpose) throw new Error('Agenda row ' + (index + 1) + ' requires subject, outcome and purpose.');
      return {
        subject,
        requiredOutcome: outcome,
        purpose,
        subjectType: subjectType || undefined,
        subjectId: subjectId || undefined,
        subjectVersion: subjectVersion || undefined
      };
    });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [reviews, bodies, snapshots] = await Promise.all([
    listPerformanceManagementReviews(context),
    listGovernanceBodies(context),
    listPerformanceSnapshots(context)
  ]);
  const selected = reviews.find((row) => row.id === url.searchParams.get('review')) ?? reviews[0] ?? null;
  const [attendees, agendaRows, linkedSnapshots, decisions, actions] = selected
    ? await Promise.all([
        listPerformanceManagementReviewAttendees(context, selected.id),
        listPerformanceManagementReviewAgenda(context, selected.id),
        listPerformanceManagementReviewSnapshots(context, selected.id),
        listPerformanceManagementReviewDecisionIds(context, selected.id),
        listPerformanceManagementReviewActionIds(context, selected.id)
      ])
    : [[], [], [], [], []];

  return {
    tenantSlug: params.tenant,
    reviews,
    bodies: bodies.filter((body) => body.status === 'ACTIVE'),
    publishedSnapshots: snapshots.filter((snapshot) => snapshot.status === 'PUBLISHED'),
    selected,
    attendees,
    agendaRows,
    linkedSnapshots,
    decisions,
    actions,
    canManage: hasPermission(context, 'performance.review.manage')
  };
};

export const actions: Actions = {
  schedule: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await schedulePerformanceManagementReview(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          governanceBodyId: text(data, 'governanceBodyId'),
          meetingRef: text(data, 'meetingRef'),
          scheduledAt: text(data, 'scheduledAt'),
          locationChannel: text(data, 'locationChannel') || undefined,
          agenda: agenda(data)
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  linkSnapshot: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'reviewId');
    try {
      await linkPerformanceSnapshotToManagementReview(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        text(data, 'snapshotId')
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  attendance: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'reviewId');
    try {
      await recordPerformanceManagementReviewAttendance(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        text(data, 'partyId'),
        text(data, 'status') as 'PRESENT' | 'ABSENT'
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  convene: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'reviewId');
    try {
      await convenePerformanceManagementReview(
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
  decision: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'reviewId');
    try {
      await recordPerformanceManagementReviewDecision(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        {
          subjectType: text(data, 'subjectType'),
          subjectId: text(data, 'subjectId'),
          subjectVersion: text(data, 'subjectVersion') || undefined,
          outcome: text(data, 'outcome'),
          reason: text(data, 'reason')
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  action: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'reviewId');
    try {
      await createPerformanceManagementReviewAction(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        {
          title: text(data, 'title'),
          instructions: text(data, 'instructions'),
          subjectType: text(data, 'subjectType') || undefined,
          subjectId: text(data, 'subjectId') || undefined,
          subjectVersion: text(data, 'subjectVersion') || undefined,
          priority: text(data, 'priority') || undefined,
          dueAt: text(data, 'dueAt') || undefined
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  complete: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'reviewId');
    try {
      await completePerformanceManagementReview(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        integer(data, 'aggregateVersion'),
        text(data, 'minutesSummary')
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
