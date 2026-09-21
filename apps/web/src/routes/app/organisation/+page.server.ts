import { PLATFORM_PERMISSION_KEYS } from '@nublox/kernel';
import {
  OrganisationCommandError,
  type MySqlAccessRepository,
  type MySqlOrganisationReadRepository
} from '@nublox/persistence';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getOrganisationCommandService,
  getOrganisationReadRepository
} from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];
type StructureTenantId = Parameters<MySqlOrganisationReadRepository['getStructure']>[0];

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function optionalValue(formData: FormData, name: string): string | undefined {
  const result = value(formData, name);
  return result || undefined;
}

function actionFailure(error: unknown, action: string) {
  if (error instanceof OrganisationCommandError) {
    const status =
      error.code === 'PERMISSION_DENIED'
        ? 403
        : error.code === 'CONFLICT'
          ? 409
          : 400;

    return fail(status, {
      action,
      ok: false,
      error: error.message,
      code: error.code
    });
  }

  throw error;
}

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.auth;

  if (!session) {
    return {
      allowed: false,
      canManageOrganisation: false,
      canManagePeople: false,
      reason: 'No authenticated tenant context is available.',
      structure: null
    };
  }

  const tenantId = session.tenantId as TenantId;
  const access = getAccessRepository();
  const [readEvaluation, organisationManageEvaluation, peopleManageEvaluation] =
    await Promise.all([
      access.evaluatePermission(
        tenantId,
        session.personId,
        PLATFORM_PERMISSION_KEYS.ORGANISATION_READ,
        { scopeType: 'TENANT' }
      ),
      access.evaluatePermission(
        tenantId,
        session.personId,
        PLATFORM_PERMISSION_KEYS.ORGANISATION_MANAGE,
        { scopeType: 'TENANT' }
      ),
      access.evaluatePermission(
        tenantId,
        session.personId,
        PLATFORM_PERMISSION_KEYS.PEOPLE_MANAGE,
        { scopeType: 'TENANT' }
      )
    ]);

  if (!readEvaluation.allowed) {
    return {
      allowed: false,
      canManageOrganisation: false,
      canManagePeople: false,
      reason: readEvaluation.reason,
      structure: null
    };
  }

  const structure = await getOrganisationReadRepository().getStructure(
    session.tenantId as StructureTenantId
  );

  return {
    allowed: true,
    canManageOrganisation: organisationManageEvaluation.allowed,
    canManagePeople: peopleManageEvaluation.allowed,
    reason: readEvaluation.reason,
    structure
  };
};

export const actions: Actions = {
  createOrganisation: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'createOrganisation', ok: false, error: 'Sign in required.' });

    const formData = await request.formData();

    try {
      const created = await getOrganisationCommandService().createOrganisation(
        session.tenantId as TenantId,
        session.personId,
        {
          legalName: value(formData, 'legalName'),
          tradingName: optionalValue(formData, 'tradingName')
        }
      );

      return {
        action: 'createOrganisation',
        ok: true,
        message: `Organisation ${created.tradingName ?? created.legalName} created.`
      };
    } catch (error) {
      return actionFailure(error, 'createOrganisation');
    }
  },

  createUnit: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'createUnit', ok: false, error: 'Sign in required.' });

    const formData = await request.formData();

    try {
      const created = await getOrganisationCommandService().createOrganisationUnit(
        session.tenantId as TenantId,
        session.personId,
        {
          organisationId: value(formData, 'organisationId'),
          parentUnitId: optionalValue(formData, 'parentUnitId'),
          code: value(formData, 'code'),
          name: value(formData, 'name')
        }
      );

      return {
        action: 'createUnit',
        ok: true,
        message: `Organisation Unit ${created.code} — ${created.name} created.`
      };
    } catch (error) {
      return actionFailure(error, 'createUnit');
    }
  },

  createPerson: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'createPerson', ok: false, error: 'Sign in required.' });

    const formData = await request.formData();

    try {
      const created = await getOrganisationCommandService().createPerson(
        session.tenantId as TenantId,
        session.personId,
        {
          legalName: value(formData, 'legalName'),
          preferredName: optionalValue(formData, 'preferredName')
        }
      );

      return {
        action: 'createPerson',
        ok: true,
        message: `Person ${created.preferredName ?? created.legalName} created.`
      };
    } catch (error) {
      return actionFailure(error, 'createPerson');
    }
  },

  createPosition: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'createPosition', ok: false, error: 'Sign in required.' });

    const formData = await request.formData();

    try {
      const created = await getOrganisationCommandService().createPosition(
        session.tenantId as TenantId,
        session.personId,
        {
          organisationUnitId: value(formData, 'organisationUnitId'),
          jobProfileId: optionalValue(formData, 'jobProfileId'),
          code: value(formData, 'code'),
          title: value(formData, 'title')
        }
      );

      return {
        action: 'createPosition',
        ok: true,
        message: `Position ${created.code} — ${created.title} created.`
      };
    } catch (error) {
      return actionFailure(error, 'createPosition');
    }
  },

  assignPerson: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'assignPerson', ok: false, error: 'Sign in required.' });

    const formData = await request.formData();

    try {
      await getOrganisationCommandService().assignPersonToPosition(
        session.tenantId as TenantId,
        session.personId,
        {
          positionId: value(formData, 'positionId'),
          personId: value(formData, 'personId'),
          effectiveFrom: optionalValue(formData, 'effectiveFrom')
        }
      );

      return {
        action: 'assignPerson',
        ok: true,
        message: 'Person assigned to Position.'
      };
    } catch (error) {
      return actionFailure(error, 'assignPerson');
    }
  }
};
