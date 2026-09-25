import {
  PLATFORM_PERMISSION_KEYS,
  type ChangeDisposition,
  type ChangeImpactLevel,
  type ChangeVerificationOutcome,
  type EffectivityType
} from '@nublox/kernel';
import {
  ChangeConfigurationCommandError,
  type MySqlAccessRepository,
  type MySqlChangeConfigurationReadRepository
} from '@nublox/persistence';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getChangeConfigurationCommandService,
  getChangeConfigurationReadRepository
} from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];
type ProjectionTenantId = Parameters<MySqlChangeConfigurationReadRepository['getProjection']>[0];

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}
function optionalValue(formData: FormData, name: string): string | undefined {
  const result = value(formData, name);
  return result || undefined;
}
function commandFailure(error: unknown, action: string) {
  if (error instanceof ChangeConfigurationCommandError) {
    const status =
      error.code === 'PERMISSION_DENIED'
        ? 403
        : error.code === 'NOT_FOUND'
          ? 404
          : error.code === 'CONFLICT'
            ? 409
            : 400;
    return fail(status, { action, ok: false, error: error.message, code: error.code });
  }
  throw error;
}
function parseEnum<T extends string>(raw: string, allowed: ReadonlyArray<T>, label: string): T {
  if (!allowed.includes(raw as T)) {
    throw new ChangeConfigurationCommandError(`A valid ${label} is required.`, 'INVALID_INPUT');
  }
  return raw as T;
}
function signedIn(locals: App.Locals) {
  if (!locals.auth) {
    throw new ChangeConfigurationCommandError('Sign in required.', 'PERMISSION_DENIED');
  }
  return locals.auth;
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
      PLATFORM_PERMISSION_KEYS.CONFIGURATION_READ,
      { scopeType: 'TENANT' }
    ),
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.CONFIGURATION_MANAGE,
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
    projection: await getChangeConfigurationReadRepository().getProjection(
      session.tenantId as ProjectionTenantId
    )
  };
};

export const actions: Actions = {
  raiseChange: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      const change = await getChangeConfigurationCommandService().raiseChange(
        session.tenantId as TenantId,
        session.personId,
        {
          code: value(formData, 'code'),
          title: value(formData, 'title'),
          description: value(formData, 'description'),
          changeType: value(formData, 'changeType')
        }
      );
      return { action: 'raiseChange', ok: true, message: `Change ${change.code} raised.` };
    } catch (error) {
      return commandFailure(error, 'raiseChange');
    }
  },

  startAssessment: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getChangeConfigurationCommandService().startAssessment(
        session.tenantId as TenantId,
        session.personId,
        value(formData, 'changeId')
      );
      return { action: 'startAssessment', ok: true, message: 'Change assessment started.' };
    } catch (error) {
      return commandFailure(error, 'startAssessment');
    }
  },

  addAffectedObject: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getChangeConfigurationCommandService().addAffectedObject(
        session.tenantId as TenantId,
        session.personId,
        {
          changeId: value(formData, 'changeId'),
          subjectObjectId: value(formData, 'subjectObjectId'),
          subjectVersion: optionalValue(formData, 'subjectVersion'),
          disposition: parseEnum<ChangeDisposition>(
            value(formData, 'disposition'),
            ['ADD', 'MODIFY', 'REMOVE', 'REVIEW'],
            'disposition'
          ),
          rationale: value(formData, 'rationale')
        }
      );
      return { action: 'addAffectedObject', ok: true, message: 'Affected object added.' };
    } catch (error) {
      return commandFailure(error, 'addAffectedObject');
    }
  },

  addImpactAssessment: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getChangeConfigurationCommandService().addImpactAssessment(
        session.tenantId as TenantId,
        session.personId,
        {
          changeId: value(formData, 'changeId'),
          domain: value(formData, 'domain'),
          impactLevel: parseEnum<ChangeImpactLevel>(
            value(formData, 'impactLevel'),
            ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            'impact level'
          ),
          summary: value(formData, 'summary'),
          costImpact: optionalValue(formData, 'costImpact'),
          scheduleImpactDays: optionalValue(formData, 'scheduleImpactDays')
        }
      );
      return { action: 'addImpactAssessment', ok: true, message: 'Impact assessment recorded.' };
    } catch (error) {
      return commandFailure(error, 'addImpactAssessment');
    }
  },

  submitForDecision: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getChangeConfigurationCommandService().submitForDecision(
        session.tenantId as TenantId,
        session.personId,
        value(formData, 'changeId')
      );
      return { action: 'submitForDecision', ok: true, message: 'Change submitted for Decision.' };
    } catch (error) {
      return commandFailure(error, 'submitForDecision');
    }
  },

  applyDecision: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      const change = await getChangeConfigurationCommandService().applyDecision(
        session.tenantId as TenantId,
        session.personId,
        {
          changeId: value(formData, 'changeId'),
          decisionId: value(formData, 'decisionId')
        }
      );
      return { action: 'applyDecision', ok: true, message: `Change is now ${change.status}.` };
    } catch (error) {
      return commandFailure(error, 'applyDecision');
    }
  },

  startImplementation: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getChangeConfigurationCommandService().startImplementation(
        session.tenantId as TenantId,
        session.personId,
        value(formData, 'changeId')
      );
      return { action: 'startImplementation', ok: true, message: 'Change implementation started.' };
    } catch (error) {
      return commandFailure(error, 'startImplementation');
    }
  },

  createImplementationAction: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getChangeConfigurationCommandService().createImplementationAction(
        session.tenantId as TenantId,
        session.personId,
        {
          changeId: value(formData, 'changeId'),
          actionType: value(formData, 'actionType'),
          description: value(formData, 'description'),
          targetObjectId: optionalValue(formData, 'targetObjectId'),
          targetVersion: optionalValue(formData, 'targetVersion')
        }
      );
      return { action: 'createImplementationAction', ok: true, message: 'Implementation action created.' };
    } catch (error) {
      return commandFailure(error, 'createImplementationAction');
    }
  },

  startImplementationAction: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getChangeConfigurationCommandService().startImplementationAction(
        session.tenantId as TenantId,
        session.personId,
        value(formData, 'actionId')
      );
      return { action: 'startImplementationAction', ok: true, message: 'Implementation action started.' };
    } catch (error) {
      return commandFailure(error, 'startImplementationAction');
    }
  },

  completeImplementationAction: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getChangeConfigurationCommandService().completeImplementationAction(
        session.tenantId as TenantId,
        session.personId,
        value(formData, 'actionId')
      );
      return { action: 'completeImplementationAction', ok: true, message: 'Implementation action completed.' };
    } catch (error) {
      return commandFailure(error, 'completeImplementationAction');
    }
  },

  beginVerification: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getChangeConfigurationCommandService().beginVerification(
        session.tenantId as TenantId,
        session.personId,
        value(formData, 'changeId')
      );
      return { action: 'beginVerification', ok: true, message: 'Change entered verification.' };
    } catch (error) {
      return commandFailure(error, 'beginVerification');
    }
  },

  recordVerification: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getChangeConfigurationCommandService().recordVerification(
        session.tenantId as TenantId,
        session.personId,
        {
          changeId: value(formData, 'changeId'),
          outcome: parseEnum<ChangeVerificationOutcome>(
            value(formData, 'outcome'),
            ['PASS', 'FAIL', 'PARTIAL'],
            'verification outcome'
          ),
          evidenceRecordId: optionalValue(formData, 'evidenceRecordId'),
          notes: value(formData, 'notes')
        }
      );
      return { action: 'recordVerification', ok: true, message: 'Verification recorded.' };
    } catch (error) {
      return commandFailure(error, 'recordVerification');
    }
  },

  createDiscrepancy: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getChangeConfigurationCommandService().createDiscrepancy(
        session.tenantId as TenantId,
        session.personId,
        {
          changeId: value(formData, 'changeId'),
          affectedObjectId: optionalValue(formData, 'affectedObjectId'),
          description: value(formData, 'description')
        }
      );
      return { action: 'createDiscrepancy', ok: true, message: 'Discrepancy opened.' };
    } catch (error) {
      return commandFailure(error, 'createDiscrepancy');
    }
  },

  resolveDiscrepancy: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getChangeConfigurationCommandService().resolveDiscrepancy(
        session.tenantId as TenantId,
        session.personId,
        {
          discrepancyId: value(formData, 'discrepancyId'),
          status: parseEnum(value(formData, 'status'), ['RESOLVED', 'ACCEPTED'] as const, 'resolution status'),
          resolution: value(formData, 'resolution')
        }
      );
      return { action: 'resolveDiscrepancy', ok: true, message: 'Discrepancy resolved.' };
    } catch (error) {
      return commandFailure(error, 'resolveDiscrepancy');
    }
  },

  closeChange: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getChangeConfigurationCommandService().closeChange(
        session.tenantId as TenantId,
        session.personId,
        {
          changeId: value(formData, 'changeId'),
          resultingBaselineId: optionalValue(formData, 'resultingBaselineId')
        }
      );
      return { action: 'closeChange', ok: true, message: 'Change closed.' };
    } catch (error) {
      return commandFailure(error, 'closeChange');
    }
  },

  createConfigurationItem: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      const item = await getChangeConfigurationCommandService().createConfigurationItem(
        session.tenantId as TenantId,
        session.personId,
        {
          canonicalObjectId: value(formData, 'canonicalObjectId'),
          code: value(formData, 'code'),
          name: value(formData, 'name')
        }
      );
      return { action: 'createConfigurationItem', ok: true, message: `Configuration Item ${item.code} created.` };
    } catch (error) {
      return commandFailure(error, 'createConfigurationItem');
    }
  },

  createBaseline: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      const baseline = await getChangeConfigurationCommandService().createBaseline(
        session.tenantId as TenantId,
        session.personId,
        {
          contextObjectId: value(formData, 'contextObjectId'),
          code: value(formData, 'code'),
          name: value(formData, 'name')
        }
      );
      return { action: 'createBaseline', ok: true, message: `Baseline ${baseline.code} created.` };
    } catch (error) {
      return commandFailure(error, 'createBaseline');
    }
  },

  addBaselineItem: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getChangeConfigurationCommandService().addBaselineItem(
        session.tenantId as TenantId,
        session.personId,
        {
          baselineId: value(formData, 'baselineId'),
          configurationItemId: value(formData, 'configurationItemId'),
          subjectVersion: value(formData, 'subjectVersion')
        }
      );
      return { action: 'addBaselineItem', ok: true, message: 'Baseline Item added.' };
    } catch (error) {
      return commandFailure(error, 'addBaselineItem');
    }
  },

  establishBaseline: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      const baseline = await getChangeConfigurationCommandService().establishBaseline(
        session.tenantId as TenantId,
        session.personId,
        {
          baselineId: value(formData, 'baselineId'),
          decisionId: value(formData, 'decisionId')
        }
      );
      return { action: 'establishBaseline', ok: true, message: `Baseline ${baseline.code} established.` };
    } catch (error) {
      return commandFailure(error, 'establishBaseline');
    }
  },

  supersedeBaseline: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getChangeConfigurationCommandService().supersedeBaseline(
        session.tenantId as TenantId,
        session.personId,
        {
          currentBaselineId: value(formData, 'currentBaselineId'),
          replacementBaselineId: value(formData, 'replacementBaselineId')
        }
      );
      return { action: 'supersedeBaseline', ok: true, message: 'Baseline superseded.' };
    } catch (error) {
      return commandFailure(error, 'supersedeBaseline');
    }
  },

  createEffectivity: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getChangeConfigurationCommandService().createEffectivity(
        session.tenantId as TenantId,
        session.personId,
        {
          configurationItemId: value(formData, 'configurationItemId'),
          subjectVersion: value(formData, 'subjectVersion'),
          effectivityType: parseEnum<EffectivityType>(
            value(formData, 'effectivityType'),
            ['DATE', 'SERIAL', 'LOT', 'UNIT', 'PROJECT', 'LOCATION', 'CUSTOM'],
            'effectivity type'
          ),
          scopeType: value(formData, 'scopeType'),
          scopeId: optionalValue(formData, 'scopeId'),
          effectiveFrom: optionalValue(formData, 'effectiveFrom'),
          effectiveTo: optionalValue(formData, 'effectiveTo'),
          expression: optionalValue(formData, 'expression')
        }
      );
      return { action: 'createEffectivity', ok: true, message: 'Effectivity rule created.' };
    } catch (error) {
      return commandFailure(error, 'createEffectivity');
    }
  }
};
