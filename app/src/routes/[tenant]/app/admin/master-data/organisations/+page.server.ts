import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  activateOrganisation,
  deactivateOrganisation,
  listOrganisationAudit,
  listOrganisations,
  updateOrganisation,
  type OrganisationInput
} from '$lib/server/foundation-organisation';
import { actionProblem } from '$lib/server/action-problem';
import {
  acquireEditLease,
  getEditLease,
  releaseEditLease
} from '$lib/server/edit-lease';
import { getPartyOrigination } from '$lib/server/party-origination';
import { assertPermission, hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import {
  discardWorkDraft,
  findWorkContext,
  getWorkDraft,
  markWorkDraftApplied,
  openWorkContext
} from '$lib/server/work-context';

const formKey = 'organisation-stewardship';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function input(data: FormData): OrganisationInput {
  return {
    legalName: text(data, 'legalName'),
    tradingName: text(data, 'tradingName'),
    registrationNumber: text(data, 'registrationNumber'),
    taxIdentifier: text(data, 'taxIdentifier'),
    countryCode: text(data, 'countryCode')
  };
}

function version(data: FormData) {
  const value = Number(text(data, 'version'));
  if (!Number.isInteger(value) || value < 1) throw new Error('A valid record version is required.');
  return value;
}

function viewTarget(tenant: string, id: string) {
  return `/${tenant}/app/admin/master-data/organisations?organisation=${encodeURIComponent(id)}`;
}

function editTarget(tenant: string, id: string) {
  return viewTarget(tenant, id) + '&edit=1';
}

function contextKey(id: string) {
  return 'ORGANISATION:' + id;
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const organisations = await listOrganisations(context);
  const requestedId = url.searchParams.get('organisation');
  const selected =
    organisations.find((item) => item.id === requestedId) ?? organisations[0] ?? null;

  const [audit, origination, lease, workContext] = selected
    ? await Promise.all([
        listOrganisationAudit(context, selected.id),
        getPartyOrigination(context, selected.id),
        getEditLease(context, 'ORGANISATION', selected.id),
        findWorkContext(context, contextKey(selected.id))
      ])
    : [[], null, null, null];

  const actorLease =
    lease && lease.holderIdentityId === context.userIdentityId ? lease : null;
  const editing = Boolean(
    selected && url.searchParams.get('edit') === '1' && actorLease && workContext
  );
  const draft =
    editing && workContext
      ? await getWorkDraft(context, workContext.id, formKey)
      : null;

  return {
    tenantSlug: params.tenant,
    actorDisplayName: context.actorDisplayName,
    organisations,
    selected,
    audit,
    origination,
    workContext,
    draft,
    editing,
    actorLease: editing ? actorLease : null,
    lease: lease
      ? {
          holderDisplayName: lease.holderDisplayName,
          holderIsCurrentActor: lease.holderIdentityId === context.userIdentityId,
          expiresAt: lease.expiresAt
        }
      : null,
    capabilities: {
      canSteward:
        hasPermission(context, 'party.steward.manage') &&
        hasPermission(context, 'party.change'),
      canChangeStatus:
        hasPermission(context, 'party.steward.manage') &&
        hasPermission(context, 'party.activate')
    }
  };
};

export const actions: Actions = {
  beginEdit: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    assertPermission(context, 'party.steward.manage');
    assertPermission(context, 'party.change');
    const id = text(data, 'id');
    const recordVersion = version(data);

    try {
      const workContext = await openWorkContext(context, {
        contextKey: contextKey(id),
        contextType: 'OBJECT',
        objectType: 'ORGANISATION',
        objectId: id,
        objectVersion: recordVersion,
        title: text(data, 'title') || 'Organisation',
        subtitle: 'Canonical identity stewardship',
        routePath: viewTarget(params.tenant, id),
        workspaceFunctionId: 'PLATFORM'
      });
      const result = await acquireEditLease(context, {
        objectType: 'ORGANISATION',
        objectId: id,
        workContextId: workContext.id,
        baseVersion: recordVersion
      });
      if (!result.acquired) {
        return fail(409, {
          message:
            result.lease.holderDisplayName +
            ' is currently editing this Organisation. You can continue to view it.',
          conflict: true,
          holderDisplayName: result.lease.holderDisplayName,
          expiresAt: result.lease.expiresAt
        });
      }
    } catch (error) {
      return actionProblem(error, 'The edit session could not be started.');
    }
    redirect(303, editTarget(params.tenant, id));
  },

  save: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    assertPermission(context, 'party.steward.manage');
    const id = text(data, 'id');
    const leaseToken = text(data, 'editLeaseToken');
    const workContextId = text(data, 'workContextId');
    try {
      await updateOrganisation(context, id, input(data), version(data), leaseToken);
      if (workContextId) await markWorkDraftApplied(context, workContextId, formKey);
      await releaseEditLease(
        context,
        'ORGANISATION',
        id,
        leaseToken,
        'Organisation stewardship changes committed.'
      );
    } catch (error) {
      return actionProblem(error, 'The Organisation could not be saved.');
    }
    redirect(303, viewTarget(params.tenant, id));
  },

  activate: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    assertPermission(context, 'party.steward.manage');
    const id = text(data, 'id');
    const leaseToken = text(data, 'editLeaseToken');
    try {
      await activateOrganisation(context, id, version(data), leaseToken);
      await releaseEditLease(context, 'ORGANISATION', id, leaseToken, 'Lifecycle change committed.');
    } catch (error) {
      return actionProblem(error, 'The Organisation lifecycle could not be changed.');
    }
    redirect(303, viewTarget(params.tenant, id));
  },

  deactivate: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    assertPermission(context, 'party.steward.manage');
    const id = text(data, 'id');
    const leaseToken = text(data, 'editLeaseToken');
    try {
      await deactivateOrganisation(context, id, version(data), leaseToken);
      await releaseEditLease(context, 'ORGANISATION', id, leaseToken, 'Lifecycle change committed.');
    } catch (error) {
      return actionProblem(error, 'The Organisation lifecycle could not be changed.');
    }
    redirect(303, viewTarget(params.tenant, id));
  },

  cancelEdit: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const id = text(data, 'id');
    try {
      await releaseEditLease(
        context,
        'ORGANISATION',
        id,
        text(data, 'editLeaseToken'),
        'Edit session stopped; recoverable draft retained.'
      );
    } catch (error) {
      return actionProblem(error, 'The edit session could not be stopped.');
    }
    redirect(303, viewTarget(params.tenant, id));
  },

  discardDraft: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const id = text(data, 'id');
    const workContextId = text(data, 'workContextId');
    try {
      if (workContextId) await discardWorkDraft(context, workContextId, formKey);
      const leaseToken = text(data, 'editLeaseToken');
      if (leaseToken) {
        await releaseEditLease(
          context,
          'ORGANISATION',
          id,
          leaseToken,
          'Edit session stopped and working draft discarded.'
        );
      }
    } catch (error) {
      return actionProblem(error, 'The working draft could not be discarded.');
    }
    redirect(303, viewTarget(params.tenant, id));
  }
};
