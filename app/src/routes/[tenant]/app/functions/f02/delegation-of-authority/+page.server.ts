import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
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
  listDelegatedAuthorityRules,
  listDelegatedAuthorityRuleVersions
} from '$lib/server/authority-configuration';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
function numberValue(data: FormData, name: string) {
  const value = text(data, name);
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(name + ' must be a number.');
  return parsed;
}
function version(data: FormData) {
  const value = Number(text(data, 'version'));
  if (!Number.isInteger(value) || value < 1) throw new Error('A valid grant version is required.');
  return value;
}
function target(tenant: string, id?: string) {
  return `/${tenant}/app/functions/f02/delegation-of-authority${id ? '?grant=' + encodeURIComponent(id) : ''}`;
}
function problem(error: unknown) {
  return fail(400, { message: error instanceof Error ? error.message : 'Delegated Authority command failed.' });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const canReadGrants = hasPermission(context, 'authority.delegation.read');
  const canReadPolicy = hasPermission(context, 'reference.authority.read');
  const [grants, parties, policyRules] = await Promise.all([
    canReadGrants ? listDelegatedAuthorities(context) : Promise.resolve([]),
    listPartyDirectory(context),
    canReadPolicy ? listDelegatedAuthorityRules(context) : Promise.resolve([])
  ]);
  const selected = grants.find((grant) => grant.id === url.searchParams.get('grant')) ?? grants[0] ?? null;
  const policyVersions = selected?.policyRuleId
    ? await listDelegatedAuthorityRuleVersions(context, selected.policyRuleId)
    : [];
  return {
    tenantSlug: params.tenant,
    grants,
    parties,
    policyRules,
    policyVersions,
    selected,
    capabilities: {
      canManage: hasPermission(context, 'authority.delegation.manage'),
      canApprove: hasPermission(context, 'authority.delegation.approve'),
      canReadPolicy
    }
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createDelegatedAuthority(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          delegatePartyId: text(data, 'delegatePartyId'),
          authorityType: text(data, 'authorityType'),
          basis: text(data, 'basis'),
          scopeType: text(data, 'scopeType'),
          scopeId: text(data, 'scopeId'),
          currencyCode: text(data, 'currencyCode') || undefined,
          valueLimit: numberValue(data, 'valueLimit'),
          allowSubdelegation: data.get('allowSubdelegation') === 'on',
          validFrom: text(data, 'validFrom') || undefined,
          validTo: text(data, 'validTo') || undefined
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  approve: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'grantId');
    try {
      await approveDelegatedAuthority(await resolveRequestCommandContext(params.tenant, locals), id, version(data));
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  activate: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'grantId');
    try {
      await activateDelegatedAuthority(await resolveRequestCommandContext(params.tenant, locals), id, version(data));
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  suspend: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'grantId');
    try {
      await suspendDelegatedAuthority(await resolveRequestCommandContext(params.tenant, locals), id, version(data));
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  revoke: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'grantId');
    try {
      await revokeDelegatedAuthority(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        version(data),
        text(data, 'reason')
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
