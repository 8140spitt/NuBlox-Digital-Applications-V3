import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import {
  addIntegrityCaseSubject,
  assignIntegrityCaseOwner,
  createIntegrityCase,
  createIntegrityCaseAction,
  grantIntegrityCaseAccess,
  linkIntegrityCaseEvidence,
  listIntegrityCaseAccess,
  listIntegrityCaseActionIds,
  listIntegrityCaseDecisionIds,
  listIntegrityCaseEntries,
  listIntegrityCaseEvidence,
  listIntegrityCases,
  listIntegrityCaseSubjects,
  recordIntegrityCaseDecision,
  recordIntegrityCaseEntry,
  revokeIntegrityCaseAccess,
  transitionIntegrityCase
} from '$lib/server/integrity-case';

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
function target(tenant: string, id?: string) {
  return `/${tenant}/app/functions/f02/ethics-governance${id ? '?case=' + encodeURIComponent(id) : ''}`;
}
function problem(error: unknown) {
  return fail(400, {
    message:
      error instanceof Error
        ? error.message
        : 'The Ethics Governance command could not be completed.'
  });
}
function subjects(data: FormData) {
  return text(data, 'subjects')
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row, index) => {
      const [partyId, subjectRole] = row.split('|').map((x) => x.trim());
      if (!partyId || !subjectRole)
        throw new Error('Subject row ' + (index + 1) + ' requires Party ID and subject role.');
      return { partyId, subjectRole };
    });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const cases = await listIntegrityCases(context);
  const selected = cases.find((row) => row.id === url.searchParams.get('case')) ?? cases[0] ?? null;
  const isManager = selected?.accessRole === 'CASE_MANAGER';
  const [subjectRows, accessRows, entries, evidence, decisions, actions] = selected
    ? await Promise.all([
        listIntegrityCaseSubjects(context, selected.id),
        isManager ? listIntegrityCaseAccess(context, selected.id) : Promise.resolve([]),
        listIntegrityCaseEntries(context, selected.id),
        listIntegrityCaseEvidence(context, selected.id),
        listIntegrityCaseDecisionIds(context, selected.id),
        listIntegrityCaseActionIds(context, selected.id)
      ])
    : [[], [], [], [], [], []];

  return {
    tenantSlug: params.tenant,
    cases,
    selected,
    subjectRows,
    accessRows,
    entries,
    evidence,
    decisions,
    actions,
    capabilities: {
      canCreate: hasPermission(context, 'governance.ethics.manage'),
      canManage: Boolean(
        selected && isManager && hasPermission(context, 'governance.ethics.manage')
      ),
      canInvestigate: Boolean(
        selected &&
        ['CASE_MANAGER', 'INVESTIGATOR'].includes(selected.accessRole) &&
        hasPermission(context, 'governance.ethics.investigate')
      ),
      canDecide: Boolean(
        selected &&
        ['CASE_MANAGER', 'DECISION_AUTHORITY'].includes(selected.accessRole) &&
        hasPermission(context, 'governance.ethics.decide')
      ),
      canManageAccess: Boolean(
        selected && isManager && hasPermission(context, 'governance.ethics.access.manage')
      )
    }
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createIntegrityCase(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          caseRef: text(data, 'caseRef'),
          caseType: text(data, 'caseType'),
          title: text(data, 'title'),
          issueSummary: text(data, 'issueSummary'),
          sourceType: text(data, 'sourceType'),
          sourceReference: text(data, 'sourceReference') || undefined,
          reportedByPartyId: text(data, 'reportedByPartyId') || undefined,
          receivedAt: text(data, 'receivedAt') || undefined,
          severity: text(data, 'severity'),
          subjects: subjects(data)
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  subject: async ({ request, params, locals }) => {
    const data = await request.formData(),
      id = text(data, 'caseId');
    try {
      await addIntegrityCaseSubject(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        text(data, 'partyId'),
        text(data, 'subjectRole')
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  grantAccess: async ({ request, params, locals }) => {
    const data = await request.formData(),
      id = text(data, 'caseId');
    try {
      await grantIntegrityCaseAccess(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        text(data, 'partyId'),
        text(data, 'accessRole')
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  revokeAccess: async ({ request, params, locals }) => {
    const data = await request.formData(),
      id = text(data, 'caseId');
    try {
      await revokeIntegrityCaseAccess(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        text(data, 'partyId')
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  owner: async ({ request, params, locals }) => {
    const data = await request.formData(),
      id = text(data, 'caseId');
    try {
      await assignIntegrityCaseOwner(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        text(data, 'partyId'),
        integer(data, 'aggregateVersion')
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  entry: async ({ request, params, locals }) => {
    const data = await request.formData(),
      id = text(data, 'caseId');
    try {
      await recordIntegrityCaseEntry(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        { entryType: text(data, 'entryType'), summary: text(data, 'summary') }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  evidence: async ({ request, params, locals }) => {
    const data = await request.formData(),
      id = text(data, 'caseId');
    try {
      await linkIntegrityCaseEvidence(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        text(data, 'evidenceItemId'),
        text(data, 'linkType')
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  transition: async ({ request, params, locals }) => {
    const data = await request.formData(),
      id = text(data, 'caseId');
    try {
      await transitionIntegrityCase(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        integer(data, 'aggregateVersion'),
        {
          toStatus: text(data, 'toStatus'),
          summary: text(data, 'summary'),
          impactSummary: text(data, 'impactSummary') || undefined,
          outcomeSummary: text(data, 'outcomeSummary') || undefined
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  decision: async ({ request, params, locals }) => {
    const data = await request.formData(),
      id = text(data, 'caseId');
    try {
      await recordIntegrityCaseDecision(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        { outcome: text(data, 'outcome'), reason: text(data, 'reason') }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  action: async ({ request, params, locals }) => {
    const data = await request.formData(),
      id = text(data, 'caseId');
    try {
      await createIntegrityCaseAction(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        {
          title: text(data, 'title'),
          instructions: text(data, 'instructions'),
          priority: text(data, 'priority') || undefined,
          dueAt: text(data, 'dueAt') || undefined
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
