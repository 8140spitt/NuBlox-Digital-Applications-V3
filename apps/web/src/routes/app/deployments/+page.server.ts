import {
  FunctionalDeploymentCommandError,
  type MySqlAccessRepository,
  type MySqlFunctionalDeploymentReadRepository
} from '@nublox/persistence';
import {
  PLATFORM_PERMISSION_KEYS,
  type DeploymentAssigneeType,
  type DeploymentContextType,
  type DeploymentPurpose,
  type WorkResponsibilityRole
} from '@nublox/kernel';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getFunctionalDeploymentCommandService,
  getFunctionalDeploymentReadRepository
} from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];
type ProjectionTenantId = Parameters<MySqlFunctionalDeploymentReadRepository['getProjection']>[0];

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function optionalValue(formData: FormData, name: string): string | undefined {
  const result = value(formData, name);
  return result || undefined;
}

function failure(error: unknown, action: string) {
  if (error instanceof FunctionalDeploymentCommandError) {
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

function parseCapability(raw: string): {
  functionId: string;
  subFunctionId?: string;
} {
  const [functionId = '', subFunctionId = ''] = raw.split('|');
  if (!functionId.trim()) {
    throw new FunctionalDeploymentCommandError(
      'A Function or L2 sub-function is required.',
      'INVALID_INPUT'
    );
  }
  return {
    functionId: functionId.trim(),
    ...(subFunctionId.trim() ? { subFunctionId: subFunctionId.trim() } : {})
  };
}

function parseOrganisationScope(raw: string): {
  organisationId: string;
  organisationUnitId?: string;
} {
  const [organisationId = '', organisationUnitId = ''] = raw.split('|');
  if (!organisationId.trim()) {
    throw new FunctionalDeploymentCommandError(
      'An Organisation is required.',
      'INVALID_INPUT'
    );
  }
  return {
    organisationId: organisationId.trim(),
    ...(organisationUnitId.trim()
      ? { organisationUnitId: organisationUnitId.trim() }
      : {})
  };
}

function parsePrincipal(raw: string): {
  assigneeType: DeploymentAssigneeType;
  assigneeId: string;
} {
  const [type = '', ...rest] = raw.split('|');
  const assigneeId = rest.join('|').trim();

  if (
    !assigneeId ||
    (type !== 'PERSON' &&
      type !== 'POSITION' &&
      type !== 'ORGANISATION_UNIT')
  ) {
    throw new FunctionalDeploymentCommandError(
      'A valid deployment assignee is required.',
      'INVALID_INPUT'
    );
  }

  return {
    assigneeType: type,
    assigneeId
  };
}

function parseContext(raw: string): {
  contextType: DeploymentContextType;
  contextObjectId?: string;
} {
  const [type = '', ...rest] = raw.split('|');
  const contextObjectId = rest.join('|').trim();

  const allowed: DeploymentContextType[] = [
    'TENANT',
    'ORGANISATION',
    'PROJECT',
    'CONTRACT',
    'PACKAGE',
    'SITE',
    'ASSET',
    'SERVICE',
    'CUSTOM'
  ];

  if (!allowed.includes(type as DeploymentContextType)) {
    throw new FunctionalDeploymentCommandError(
      'A valid deployment context is required.',
      'INVALID_INPUT'
    );
  }

  return {
    contextType: type as DeploymentContextType,
    ...(contextObjectId ? { contextObjectId } : {})
  };
}

function parseDeploymentPurpose(raw: string): DeploymentPurpose {
  if (raw !== 'FUNCTIONAL_GOVERNANCE' && raw !== 'FUNCTIONAL_DELIVERY') {
    throw new FunctionalDeploymentCommandError(
      'Choose Functional Governance or Functional Delivery.',
      'INVALID_INPUT'
    );
  }
  return raw;
}

function parseResponsibilityRole(raw: string): WorkResponsibilityRole {
  const roles: WorkResponsibilityRole[] = [
    'ACCOUNTABLE',
    'RESPONSIBLE',
    'CONTRIBUTOR',
    'REVIEWER',
    'CHECKER',
    'APPROVER',
    'ACCEPTOR',
    'CONSULTED',
    'INFORMED',
    'ASSURANCE'
  ];

  if (!roles.includes(raw as WorkResponsibilityRole)) {
    throw new FunctionalDeploymentCommandError(
      'A valid responsibility role is required.',
      'INVALID_INPUT'
    );
  }

  return raw as WorkResponsibilityRole;
}

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.auth;

  if (!session) {
    return {
      allowed: false,
      canManage: false,
      reason: 'No authenticated tenant context is available.',
      projection: null
    };
  }

  const tenantId = session.tenantId as TenantId;
  const access = getAccessRepository();
  const [readEvaluation, manageEvaluation] = await Promise.all([
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.DEPLOYMENT_READ,
      { scopeType: 'TENANT' }
    ),
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.DEPLOYMENT_MANAGE,
      { scopeType: 'TENANT' }
    )
  ]);

  if (!readEvaluation.allowed) {
    return {
      allowed: false,
      canManage: false,
      reason: readEvaluation.reason,
      projection: null
    };
  }

  return {
    allowed: true,
    canManage: manageEvaluation.allowed,
    reason: readEvaluation.reason,
    projection: await getFunctionalDeploymentReadRepository().getProjection(
      session.tenantId as ProjectionTenantId
    )
  };
};

export const actions: Actions = {
  createDeployment: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'createDeployment',
        ok: false,
        error: 'Sign in required.'
      });
    }

    const formData = await request.formData();

    try {
      const capability = parseCapability(value(formData, 'capability'));
      const organisation = parseOrganisationScope(
        value(formData, 'organisationScope')
      );
      const context = parseContext(value(formData, 'context'));

      const created =
        await getFunctionalDeploymentCommandService().createDeployment(
          session.tenantId as TenantId,
          session.personId,
          {
            ...capability,
            ...organisation,
            ...context,
            deploymentPurpose: parseDeploymentPurpose(value(formData, 'deploymentPurpose')),
            scopeDescription: value(formData, 'scopeDescription'),
            effectiveFrom: optionalValue(formData, 'effectiveFrom'),
            effectiveTo: optionalValue(formData, 'effectiveTo')
          }
        );

      return {
        action: 'createDeployment',
        ok: true,
        message: `Functional Deployment ${created.id} created.`
      };
    } catch (error) {
      return failure(error, 'createDeployment');
    }
  },

  createAssignment: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'createAssignment',
        ok: false,
        error: 'Sign in required.'
      });
    }

    const formData = await request.formData();

    try {
      const principal = parsePrincipal(value(formData, 'principal'));
      const created =
        await getFunctionalDeploymentCommandService().createAssignment(
          session.tenantId as TenantId,
          session.personId,
          {
            functionalDeploymentId: value(formData, 'functionalDeploymentId'),
            ...principal,
            jobProfileId: optionalValue(formData, 'jobProfileId'),
            responsibilityRole: parseResponsibilityRole(
              value(formData, 'responsibilityRole')
            ),
            effectiveFrom: optionalValue(formData, 'effectiveFrom'),
            effectiveTo: optionalValue(formData, 'effectiveTo')
          }
        );

      return {
        action: 'createAssignment',
        ok: true,
        message: `Deployment Assignment ${created.id} created.`
      };
    } catch (error) {
      return failure(error, 'createAssignment');
    }
  },

  createScope: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'createScope',
        ok: false,
        error: 'Sign in required.'
      });
    }

    const formData = await request.formData();

    try {
      const created =
        await getFunctionalDeploymentCommandService().createResponsibilityScope(
          session.tenantId as TenantId,
          session.personId,
          {
            deploymentAssignmentId: value(
              formData,
              'deploymentAssignmentId'
            ),
            scopeType: value(formData, 'scopeType') || 'TENANT',
            scopeId: optionalValue(formData, 'scopeId'),
            description: optionalValue(formData, 'description'),
            effectiveFrom: optionalValue(formData, 'effectiveFrom'),
            effectiveTo: optionalValue(formData, 'effectiveTo')
          }
        );

      return {
        action: 'createScope',
        ok: true,
        message: `Responsibility Scope ${created.id} created.`
      };
    } catch (error) {
      return failure(error, 'createScope');
    }
  },

  createCapacity: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'createCapacity',
        ok: false,
        error: 'Sign in required.'
      });
    }

    const formData = await request.formData();
    const capacityPercent = Number(value(formData, 'capacityPercent'));

    try {
      const created =
        await getFunctionalDeploymentCommandService().createCapacity(
          session.tenantId as TenantId,
          session.personId,
          {
            deploymentAssignmentId: value(
              formData,
              'deploymentAssignmentId'
            ),
            capacityPercent,
            effectiveFrom: optionalValue(formData, 'effectiveFrom'),
            effectiveTo: optionalValue(formData, 'effectiveTo')
          }
        );

      return {
        action: 'createCapacity',
        ok: true,
        message: `Capacity allocation ${created.capacityPercent}% created.`
      };
    } catch (error) {
      return failure(error, 'createCapacity');
    }
  }
};
