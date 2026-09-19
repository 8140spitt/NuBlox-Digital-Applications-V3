import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { listPartyDirectory } from '$lib/server/foundation-party-directory';
import { listGovernanceBodies } from '$lib/server/governance-body';
import { recordWorkDecision } from '$lib/server/work-decision';
import {
  addPolicyRepresentation,
  approvePolicyRevision,
  createPolicy,
  createSuccessorPolicyRevision,
  listPolicies,
  listPolicyRepresentations,
  listPolicyRevisions,
  publishPolicyRevision,
  submitPolicyRevision
} from '$lib/server/policy-governance';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function aggregateVersion(data: FormData) {
  const value = Number(text(data, 'aggregateVersion'));
  if (!Number.isInteger(value) || value < 1) {
    throw new Error('A valid aggregate version is required.');
  }
  return value;
}

function target(tenant: string, id?: string) {
  return `/${tenant}/app/functions/f02/policies${id ? '?policy=' + encodeURIComponent(id) : ''}`;
}

function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'Policy Governance command failed.'
  });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const policies = await listPolicies(context);
  const selected =
    policies.find((item) => item.id === url.searchParams.get('policy')) ?? policies[0] ?? null;
  const [revisions, representations, parties, bodies] = await Promise.all([
    selected ? listPolicyRevisions(context, selected.id) : Promise.resolve([]),
    selected ? listPolicyRepresentations(context, selected.currentRevisionId) : Promise.resolve([]),
    hasPermission(context, 'party.read') ? listPartyDirectory(context) : Promise.resolve([]),
    hasPermission(context, 'governance.body.read')
      ? listGovernanceBodies(context)
      : Promise.resolve([])
  ]);

  return {
    tenantSlug: params.tenant,
    policies,
    selected,
    revisions,
    representations,
    parties: parties.filter((party) => party.status === 'ACTIVE'),
    bodies: bodies.filter((body) => ['CONSTITUTED', 'ACTIVE'].includes(body.status)),
    actorPartyId: context.actorPartyId,
    capabilities: {
      canManage: hasPermission(context, 'information.container.manage'),
      canApprove: hasPermission(context, 'information.container.approve'),
      canReadParties: hasPermission(context, 'party.read'),
      canReadBodies: hasPermission(context, 'governance.body.read')
    }
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createPolicy(await resolveRequestCommandContext(params.tenant, locals), {
        policyRef: text(data, 'policyRef'),
        policyType: text(data, 'policyType'),
        title: text(data, 'title'),
        ownerPartyId: text(data, 'ownerPartyId') || undefined,
        governanceBodyId: text(data, 'governanceBodyId') || undefined,
        applicabilitySummary: text(data, 'applicabilitySummary'),
        scopeType: text(data, 'scopeType') || undefined,
        scopeId: text(data, 'scopeId') || undefined,
        classificationCode: text(data, 'classificationCode') || undefined,
        securityClassification: text(data, 'securityClassification') || undefined,
        revisionCode: text(data, 'revisionCode') || undefined,
        purposeOfIssue: text(data, 'purposeOfIssue') || undefined,
        suitabilityCode: text(data, 'suitabilityCode') || undefined,
        effectiveFrom: text(data, 'effectiveFrom') || undefined,
        effectiveTo: text(data, 'effectiveTo') || undefined,
        reviewDueAt: text(data, 'reviewDueAt') || undefined,
        attestationRequired: data.get('attestationRequired') === 'on'
      });
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  representation: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'policyId');
    try {
      await addPolicyRepresentation(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        aggregateVersion(data),
        {
          representationType: text(data, 'representationType'),
          contentReference: text(data, 'contentReference'),
          contentMediaType: text(data, 'contentMediaType') || undefined,
          sourceFilename: text(data, 'sourceFilename') || undefined,
          hashAlgorithm: text(data, 'hashAlgorithm'),
          contentHash: text(data, 'contentHash')
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  submit: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'policyId');
    try {
      await submitPolicyRevision(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        aggregateVersion(data)
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  approve: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'policyId');
    try {
      const context = await resolveRequestCommandContext(params.tenant, locals);
      const current = (await listPolicies(context)).find((item) => item.id === id);
      if (!current) throw new Error('Policy not found.');
      const decisionId = await recordWorkDecision(context, {
        decisionType: 'INFORMATION_REVISION_REVIEW',
        subjectType: 'INFORMATION_CONTAINER',
        subjectId: id,
        subjectVersion: String(current.currentRevisionNo),
        outcome: 'APPROVED',
        reason: text(data, 'reason') || 'Policy revision approved through governed review.'
      });
      await approvePolicyRevision(context, id, aggregateVersion(data), decisionId);
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  publish: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'policyId');
    try {
      await publishPolicyRevision(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        aggregateVersion(data)
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  successor: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'policyId');
    try {
      await createSuccessorPolicyRevision(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        aggregateVersion(data),
        {
          revisionCode: text(data, 'revisionCode'),
          title: text(data, 'title') || undefined,
          purposeOfIssue: text(data, 'purposeOfIssue') || undefined,
          suitabilityCode: text(data, 'suitabilityCode') || undefined,
          ownerPartyId: text(data, 'ownerPartyId') || undefined,
          governanceBodyId: text(data, 'governanceBodyId') || undefined,
          applicabilitySummary: text(data, 'applicabilitySummary') || undefined,
          scopeType: text(data, 'scopeType') || undefined,
          scopeId: text(data, 'scopeId') || undefined,
          effectiveFrom: text(data, 'effectiveFrom') || undefined,
          effectiveTo: text(data, 'effectiveTo') || undefined,
          reviewDueAt: text(data, 'reviewDueAt') || undefined,
          attestationRequired: data.get('attestationRequired') === 'on'
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
