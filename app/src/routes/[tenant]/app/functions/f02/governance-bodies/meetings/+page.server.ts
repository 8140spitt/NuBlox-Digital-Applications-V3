import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { listGovernanceBodies } from '$lib/server/governance-body';
import {
  completeGovernanceBodyMeeting,
  conveneGovernanceBodyMeeting,
  createGovernanceBodyMeetingAction,
  linkGovernanceMeetingInformation,
  listGovernanceBodyMeetingActionIds,
  listGovernanceBodyMeetingAgenda,
  listGovernanceBodyMeetingAttendees,
  listGovernanceBodyMeetingDecisionIds,
  listGovernanceBodyMeetings,
  listGovernanceMeetingInformation,
  recordGovernanceBodyMeetingAttendance,
  recordGovernanceBodyResolution,
  scheduleGovernanceBodyMeeting
} from '$lib/server/governance-body-meeting';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function integer(data: FormData, name: string) {
  const value = Number(text(data, name));
  if (!Number.isInteger(value) || value < 1)
    throw new Error(name + ' must be a positive whole number.');
  return value;
}

function target(tenant: string, bodyId: string, meetingId?: string) {
  const params = new URLSearchParams({ body: bodyId });
  if (meetingId) params.set('meeting', meetingId);
  return `/${tenant}/app/functions/f02/governance-bodies/meetings?${params.toString()}`;
}

function problem(error: unknown) {
  return fail(400, {
    message:
      error instanceof Error
        ? error.message
        : 'The Governance Meeting command could not be completed.'
  });
}

function agenda(data: FormData) {
  return text(data, 'agenda')
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row, index) => {
      const [
        subject,
        requiredOutcome,
        purpose,
        subjectType = '',
        subjectId = '',
        subjectVersion = ''
      ] = row.split('|').map((item) => item.trim());
      if (!subject || !requiredOutcome || !purpose) {
        throw new Error(
          'Agenda row ' + (index + 1) + ' requires subject, required outcome and purpose.'
        );
      }
      return {
        subject,
        requiredOutcome,
        purpose,
        subjectType: subjectType || undefined,
        subjectId: subjectId || undefined,
        subjectVersion: subjectVersion || undefined
      };
    });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const bodies = await listGovernanceBodies(context);
  const body = bodies.find((row) => row.id === url.searchParams.get('body')) ?? bodies[0] ?? null;
  const meetings = body ? await listGovernanceBodyMeetings(context, body.id) : [];
  const selected =
    meetings.find((row) => row.id === url.searchParams.get('meeting')) ?? meetings[0] ?? null;

  const [attendees, agendaRows, information, decisions, actions] = selected
    ? await Promise.all([
        listGovernanceBodyMeetingAttendees(context, selected.id),
        listGovernanceBodyMeetingAgenda(context, selected.id),
        listGovernanceMeetingInformation(context, selected.id),
        listGovernanceBodyMeetingDecisionIds(context, selected.id),
        listGovernanceBodyMeetingActionIds(context, selected.id)
      ])
    : [[], [], [], [], []];

  return {
    tenantSlug: params.tenant,
    bodies,
    body,
    meetings,
    selected,
    attendees,
    agendaRows,
    information,
    decisions,
    actions,
    capabilities: {
      canManage: hasPermission(context, 'governance.meeting.manage'),
      canConduct: hasPermission(context, 'governance.meeting.conduct'),
      canReadInformation: hasPermission(context, 'information.container.read')
    }
  };
};

export const actions: Actions = {
  schedule: async ({ request, params, locals }) => {
    const data = await request.formData();
    const bodyId = text(data, 'bodyId');
    try {
      const meetingId = await scheduleGovernanceBodyMeeting(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          bodyId,
          meetingRef: text(data, 'meetingRef'),
          scheduledAt: text(data, 'scheduledAt'),
          locationChannel: text(data, 'locationChannel') || undefined,
          agenda: agenda(data)
        }
      );
      redirect(303, target(params.tenant, bodyId, meetingId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  attendance: async ({ request, params, locals }) => {
    const data = await request.formData();
    const bodyId = text(data, 'bodyId');
    const meetingId = text(data, 'meetingId');
    try {
      await recordGovernanceBodyMeetingAttendance(
        await resolveRequestCommandContext(params.tenant, locals),
        meetingId,
        text(data, 'partyId'),
        text(data, 'status') as 'PRESENT' | 'ABSENT'
      );
      redirect(303, target(params.tenant, bodyId, meetingId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  convene: async ({ request, params, locals }) => {
    const data = await request.formData();
    const bodyId = text(data, 'bodyId');
    const meetingId = text(data, 'meetingId');
    try {
      await conveneGovernanceBodyMeeting(
        await resolveRequestCommandContext(params.tenant, locals),
        meetingId,
        integer(data, 'aggregateVersion')
      );
      redirect(303, target(params.tenant, bodyId, meetingId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  information: async ({ request, params, locals }) => {
    const data = await request.formData();
    const bodyId = text(data, 'bodyId');
    const meetingId = text(data, 'meetingId');
    try {
      await linkGovernanceMeetingInformation(
        await resolveRequestCommandContext(params.tenant, locals),
        meetingId,
        text(data, 'revisionId'),
        text(data, 'linkRole')
      );
      redirect(303, target(params.tenant, bodyId, meetingId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  resolution: async ({ request, params, locals }) => {
    const data = await request.formData();
    const bodyId = text(data, 'bodyId');
    const meetingId = text(data, 'meetingId');
    try {
      await recordGovernanceBodyResolution(
        await resolveRequestCommandContext(params.tenant, locals),
        meetingId,
        {
          subjectType: text(data, 'subjectType'),
          subjectId: text(data, 'subjectId'),
          subjectVersion: text(data, 'subjectVersion') || undefined,
          outcome: text(data, 'outcome'),
          reason: text(data, 'reason')
        }
      );
      redirect(303, target(params.tenant, bodyId, meetingId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  action: async ({ request, params, locals }) => {
    const data = await request.formData();
    const bodyId = text(data, 'bodyId');
    const meetingId = text(data, 'meetingId');
    try {
      await createGovernanceBodyMeetingAction(
        await resolveRequestCommandContext(params.tenant, locals),
        meetingId,
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
      redirect(303, target(params.tenant, bodyId, meetingId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  complete: async ({ request, params, locals }) => {
    const data = await request.formData();
    const bodyId = text(data, 'bodyId');
    const meetingId = text(data, 'meetingId');
    try {
      await completeGovernanceBodyMeeting(
        await resolveRequestCommandContext(params.tenant, locals),
        meetingId,
        integer(data, 'aggregateVersion'),
        text(data, 'minutesSummary')
      );
      redirect(303, target(params.tenant, bodyId, meetingId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
