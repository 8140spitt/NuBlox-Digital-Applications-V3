import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  createManagedDeliverable,
  listDeliverableDeploymentAssignments,
  listDeliverableItems,
  listDeliverableRequirements,
  recordDeliverableIssue
} from '$lib/server/managed-deliverable';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function checked(data: FormData, name: string) {
  return data.get(name) === 'on' || data.get(name) === 'true';
}

function version(data: FormData) {
  const value = Number(text(data, 'version'));
  if (!Number.isInteger(value) || value < 1)
    throw new Error('A valid Deliverable Item version is required.');
  return value;
}

function problem(error: unknown) {
  return fail(400, {
    message:
      error instanceof Error
        ? error.message
        : 'The requested deliverable action could not be completed.'
  });
}

function target(tenant: string, deliverableId?: string) {
  const base = `/${tenant}/app/deliverables`;
  return deliverableId ? `${base}?deliverable=${encodeURIComponent(deliverableId)}` : base;
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [requirements, items, deploymentAssignments] = await Promise.all([
    listDeliverableRequirements(context),
    listDeliverableItems(context),
    listDeliverableDeploymentAssignments(context)
  ]);

  const requested = url.searchParams.get('deliverable');
  const selected = items.find((item) => item.id === requested) ?? items[0] ?? null;

  return {
    tenantSlug: params.tenant,
    currentTime: new Date().toISOString(),
    requirements,
    items,
    selected,
    deploymentAssignments,
    canManage: hasPermission(context, 'deliverable.manage'),
    canIssue: hasPermission(context, 'deliverable.issue'),
    canManageInformation: hasPermission(context, 'information.container.manage')
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    let deliverableItemId: string;
    try {
      const result = await createManagedDeliverable(context, {
        requirementRef: text(data, 'requirementRef'),
        deliverableRef: text(data, 'deliverableRef'),
        title: text(data, 'title'),
        description: text(data, 'description'),
        requirementSourceType: text(data, 'requirementSourceType'),
        requirementSourceId: text(data, 'requirementSourceId'),
        contextType: text(data, 'contextType'),
        contextId: text(data, 'contextId'),
        responsibleDeploymentAssignmentId: text(data, 'responsibleDeploymentAssignmentId'),
        deliverableType: text(data, 'deliverableType'),
        outputKind: text(data, 'outputKind'),
        authoringMode: text(data, 'authoringMode'),
        disciplineCode: text(data, 'disciplineCode'),
        classificationCode: text(data, 'classificationCode'),
        reviewRequired: checked(data, 'reviewRequired'),
        approvalRequired: checked(data, 'approvalRequired'),
        acceptanceRequired: checked(data, 'acceptanceRequired'),
        plannedStartAt: text(data, 'plannedStartAt'),
        plannedIssueAt: text(data, 'plannedIssueAt'),
        requiredAcceptanceAt: text(data, 'requiredAcceptanceAt'),
        dueAt: text(data, 'dueAt'),
        createInformationContainer: checked(data, 'createInformationContainer'),
        initialRevisionCode: text(data, 'initialRevisionCode')
      });
      deliverableItemId = result.deliverableItemId;
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, deliverableItemId));
  },

  issue: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const id = text(data, 'deliverableId');
    try {
      await recordDeliverableIssue(context, id, version(data), {
        issueRef: text(data, 'issueRef'),
        issueType: text(data, 'issueType') || 'TRANSMITTAL',
        recipientPartyId: text(data, 'recipientPartyId'),
        recipientRole: text(data, 'recipientRole'),
        purposeOfIssue: text(data, 'purposeOfIssue'),
        suitabilityCode: text(data, 'suitabilityCode')
      });
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  }
};
