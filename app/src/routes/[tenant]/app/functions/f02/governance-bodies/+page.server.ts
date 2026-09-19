import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import {
  addGovernanceBodyMember,
  createGovernanceBody,
  endGovernanceBodyMembership,
  listGovernanceBodies,
  listGovernanceBodyMemberships,
  listGovernanceBodyVersions,
  reviseGovernanceBody,
  transitionGovernanceBody,
  type GovernanceBodyInput
} from '$lib/server/governance-body';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function integer(data: FormData, name: string) {
  const value = Number(text(data, name));
  if (!Number.isInteger(value) || value < 1) throw new Error(name + ' must be a positive whole number.');
  return value;
}

function members(data: FormData) {
  return text(data, 'members')
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row, index) => {
      const [partyId, roleKey] = row.split('|').map((part) => part.trim());
      if (!partyId || !roleKey) throw new Error('Member row ' + (index + 1) + ' requires Party ID and role.');
      return { partyId, roleKey };
    });
}

function input(data: FormData): GovernanceBodyInput {
  return {
    bodyRef: text(data, 'bodyRef'),
    name: text(data, 'name'),
    bodyType: text(data, 'bodyType'),
    mandate: text(data, 'mandate'),
    termsOfReference: text(data, 'termsOfReference'),
    scopeType: text(data, 'scopeType'),
    scopeId: text(data, 'scopeId'),
    membershipRules: text(data, 'membershipRules'),
    quorumRequired: integer(data, 'quorumRequired'),
    chairPartyId: text(data, 'chairPartyId'),
    secretariatPartyId: text(data, 'secretariatPartyId'),
    effectiveFrom: text(data, 'effectiveFrom') || undefined,
    effectiveTo: text(data, 'effectiveTo') || undefined,
    members: members(data)
  };
}

function target(tenant: string, id?: string) {
  return `/${tenant}/app/functions/f02/governance-bodies${id ? '?body=' + encodeURIComponent(id) : ''}`;
}

function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The Governance Body command could not be completed.'
  });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const bodies = await listGovernanceBodies(context);
  const selected = bodies.find((row) => row.id === url.searchParams.get('body')) ?? bodies[0] ?? null;
  const [versions, memberships] = selected
    ? await Promise.all([
        listGovernanceBodyVersions(context, selected.id),
        listGovernanceBodyMemberships(context, selected.id)
      ])
    : [[], []];

  return {
    tenantSlug: params.tenant,
    bodies,
    selected,
    versions,
    memberships,
    actorPartyId: context.actorPartyId,
    capabilities: {
      canManage: hasPermission(context, 'governance.body.manage'),
      canApprove: hasPermission(context, 'governance.body.approve')
    }
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createGovernanceBody(
        await resolveRequestCommandContext(params.tenant, locals),
        input(data)
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  revise: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'bodyId');
    try {
      await reviseGovernanceBody(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        integer(data, 'aggregateVersion'),
        input(data)
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  transition: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'bodyId');
    try {
      await transitionGovernanceBody(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        integer(data, 'aggregateVersion'),
        text(data, 'action') as 'CONSTITUTE' | 'ACTIVATE' | 'SUSPEND' | 'DISSOLVE'
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  addMember: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'bodyId');
    try {
      await addGovernanceBodyMember(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        integer(data, 'aggregateVersion'),
        { partyId: text(data, 'partyId'), roleKey: text(data, 'roleKey') }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  endMember: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'bodyId');
    try {
      await endGovernanceBodyMembership(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        text(data, 'membershipId'),
        integer(data, 'aggregateVersion')
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
