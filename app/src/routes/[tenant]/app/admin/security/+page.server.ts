import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { listPersons } from '$lib/server/foundation-person';
import {
  platformPermissions,
  assertPermission,
  hasPermission
} from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { queryOne } from '$lib/server/db';
import { listPartyDirectory } from '$lib/server/foundation-party-directory';
import {
  activateDelegatedAuthority,
  approveDelegatedAuthority,
  createDelegatedAuthority,
  listDelegatedAuthorities,
  revokeDelegatedAuthority,
  suspendDelegatedAuthority
} from '$lib/server/delegated-authority';
import {
  assignTenantRole,
  createTenantRole,
  deactivateTenantIdentity,
  deactivateTenantRole,
  grantTenantMembership,
  linkAuthenticatedIdentity,
  listTenantIdentities,
  listTenantMemberships,
  listTenantRoleAssignments,
  listTenantRoles,
  reactivateTenantRole,
  revokeTenantMembership,
  unassignTenantRole,
  updateTenantRole
} from '$lib/server/tenant-authority';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function version(data: FormData) {
  const value = Number(text(data, 'version'));
  if (!Number.isInteger(value) || value < 1) throw new Error('A valid record version is required.');
  return value;
}

function optionalNumber(data: FormData, name: string) {
  const value = text(data, name);
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error('A valid numeric value is required.');
  return parsed;
}

function problem(error: unknown) {
  return fail(400, {
    message:
      error instanceof Error
        ? error.message
        : 'The requested security administration action could not be completed.'
  });
}

function target(tenant: string, view: string) {
  return `/${tenant}/app/admin/security?view=${encodeURIComponent(view)}`;
}

async function contextFor(params: { tenant: string }, locals: App.Locals) {
  return resolveRequestCommandContext(params.tenant, locals);
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const context = await contextFor(params, locals);
  const canReadDelegatedAuthority = hasPermission(context, 'authority.delegation.read');
  const [people, parties, memberships, roles, assignments, identities, delegatedAuthorities] =
    await Promise.all([
      listPersons(context),
      listPartyDirectory(context),
      listTenantMemberships(context),
      listTenantRoles(context),
      listTenantRoleAssignments(context),
      listTenantIdentities(context),
      canReadDelegatedAuthority ? listDelegatedAuthorities(context) : Promise.resolve([])
    ]);

  const view = ['access', 'roles', 'identities', 'authority'].includes(
    url.searchParams.get('view') ?? ''
  )
    ? url.searchParams.get('view')
    : 'access';

  return {
    view,
    people: people.map(({ id, displayName, status }) => ({ id, displayName, status })),
    parties: parties.map(({ id, displayName, partyType, status }) => ({
      id,
      displayName,
      partyType,
      status
    })),
    memberships,
    roles,
    assignments,
    identities,
    delegatedAuthorities,
    authorityCapabilities: {
      canRead: canReadDelegatedAuthority,
      canManage: hasPermission(context, 'authority.delegation.manage'),
      canApprove: hasPermission(context, 'authority.delegation.approve')
    },
    permissions: platformPermissions.map(([key, resource, action, description]) => ({
      key,
      resource,
      action,
      description
    }))
  };
};

export const actions: Actions = {
  grantMembership: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await grantTenantMembership(
        await contextFor(params, locals),
        text(data, 'partyId'),
        text(data, 'membershipType') || 'INTERNAL'
      );
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, 'access'));
  },

  revokeMembership: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await revokeTenantMembership(await contextFor(params, locals), text(data, 'membershipId'));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, 'access'));
  },

  createRole: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await createTenantRole(
        await contextFor(params, locals),
        text(data, 'roleKey'),
        text(data, 'name'),
        data.getAll('permission').map(String)
      );
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, 'roles'));
  },

  updateRole: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await updateTenantRole(await contextFor(params, locals), text(data, 'roleId'), {
        name: text(data, 'name'),
        permissions: data.getAll('permission').map(String)
      });
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, 'roles'));
  },

  deactivateRole: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await deactivateTenantRole(await contextFor(params, locals), text(data, 'roleId'));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, 'roles'));
  },

  reactivateRole: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await reactivateTenantRole(await contextFor(params, locals), text(data, 'roleId'));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, 'roles'));
  },

  assignRole: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await assignTenantRole(
        await contextFor(params, locals),
        text(data, 'partyId'),
        text(data, 'roleId')
      );
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, 'access'));
  },

  unassignRole: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await unassignTenantRole(await contextFor(params, locals), text(data, 'assignmentId'));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, 'access'));
  },

  linkIdentity: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await contextFor(params, locals);
    try {
      assertPermission(context, 'tenant.identity.manage');
      const email = text(data, 'email').toLowerCase();
      const user = await queryOne<
        { id: string; name: string } & import('mysql2/promise').RowDataPacket
      >('SELECT id, name FROM `user` WHERE email = ? LIMIT 1', [email]);
      if (!user) throw new Error('No authentication account exists for that exact email address.');
      await linkAuthenticatedIdentity(context, text(data, 'partyId'), user.id, user.name);
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, 'identities'));
  },

  deactivateIdentity: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await deactivateTenantIdentity(await contextFor(params, locals), text(data, 'identityId'));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, 'identities'));
  },
  createDelegatedAuthority: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await contextFor(params, locals);
    try {
      await createDelegatedAuthority(context, {
        delegatePartyId: text(data, 'delegatePartyId'),
        grantorPartyId: text(data, 'grantorPartyId') || undefined,
        authorityType: text(data, 'authorityType'),
        basis: text(data, 'basis'),
        scopeType: text(data, 'scopeType') || 'TENANT',
        scopeId: text(data, 'scopeId') || context.tenantId,
        currencyCode: text(data, 'currencyCode') || undefined,
        valueLimit: optionalNumber(data, 'valueLimit'),
        allowSubdelegation: data.get('allowSubdelegation') === 'on',
        validFrom: text(data, 'validFrom') || undefined,
        validTo: text(data, 'validTo') || undefined
      });
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, 'authority'));
  },

  approveDelegatedAuthority: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await approveDelegatedAuthority(
        await contextFor(params, locals),
        text(data, 'authorityId'),
        version(data)
      );
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, 'authority'));
  },

  activateDelegatedAuthority: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await activateDelegatedAuthority(
        await contextFor(params, locals),
        text(data, 'authorityId'),
        version(data)
      );
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, 'authority'));
  },

  suspendDelegatedAuthority: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await suspendDelegatedAuthority(
        await contextFor(params, locals),
        text(data, 'authorityId'),
        version(data)
      );
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, 'authority'));
  },

  revokeDelegatedAuthority: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await revokeDelegatedAuthority(
        await contextFor(params, locals),
        text(data, 'authorityId'),
        version(data),
        text(data, 'reason')
      );
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, 'authority'));
  }
};
