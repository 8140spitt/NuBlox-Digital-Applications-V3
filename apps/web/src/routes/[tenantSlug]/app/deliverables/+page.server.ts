import {
  PLATFORM_PERMISSION_KEYS,
  type DeliverablePrincipalType,
  type DeliverableReviewOutcome,
  type DeliverableReviewType,
  type RecipientResponseOutcome,
  type WorkResponsibilityRole
} from '@nublox/kernel';
import {
  DeliverableCommandError,
  type MySqlAccessRepository,
  type MySqlDeliverableReadRepository
} from '@nublox/persistence';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getDeliverableCommandService,
  getDeliverableReadRepository
} from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];
type ProjectionTenantId = Parameters<MySqlDeliverableReadRepository['getProjection']>[0];

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}
function optionalValue(formData: FormData, name: string): string | undefined {
  const result = value(formData, name);
  return result || undefined;
}
function checked(formData: FormData, name: string): boolean {
  return formData.get(name) === 'on' || formData.get(name) === 'true';
}
function parseList(raw: string): string[] {
  return raw.split(',').map((entry) => entry.trim()).filter(Boolean);
}
function parseEnum<T extends string>(raw: string, allowed: ReadonlyArray<T>, label: string): T {
  if (!allowed.includes(raw as T)) {
    throw new DeliverableCommandError(`A valid ${label} is required.`, 'INVALID_INPUT');
  }
  return raw as T;
}
function signedIn(locals: App.Locals) {
  if (!locals.auth) {
    throw new DeliverableCommandError('Sign in required.', 'PERMISSION_DENIED');
  }
  return locals.auth;
}
function commandFailure(error: unknown, action: string) {
  if (error instanceof DeliverableCommandError) {
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
      PLATFORM_PERMISSION_KEYS.DELIVERABLE_READ,
      { scopeType: 'TENANT' }
    ),
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.DELIVERABLE_MANAGE,
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
    projection: await getDeliverableReadRepository().getProjection(
      session.tenantId as ProjectionTenantId
    )
  };
};

export const actions: Actions = {
  createRequirement: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      const requirement = await getDeliverableCommandService().createRequirement(
        session.tenantId as TenantId,
        session.personId,
        {
          code: value(formData, 'code'),
          title: value(formData, 'title'),
          deliverableType: value(formData, 'deliverableType'),
          description: value(formData, 'description'),
          contextObjectId: value(formData, 'contextObjectId'),
          requiredRepresentationTypes: parseList(value(formData, 'requiredRepresentationTypes')),
          plannedDueAt: optionalValue(formData, 'plannedDueAt'),
          acceptanceRequired: checked(formData, 'acceptanceRequired')
        }
      );
      return { action: 'createRequirement', ok: true, message: `Requirement ${requirement.code} created.` };
    } catch (error) {
      return commandFailure(error, 'createRequirement');
    }
  },

  createItem: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      const item = await getDeliverableCommandService().createItem(
        session.tenantId as TenantId,
        session.personId,
        {
          requirementId: value(formData, 'requirementId'),
          code: value(formData, 'code'),
          title: value(formData, 'title'),
          plannedAt: optionalValue(formData, 'plannedAt'),
          forecastAt: optionalValue(formData, 'forecastAt')
        }
      );
      return { action: 'createItem', ok: true, message: `Deliverable ${item.code} created.` };
    } catch (error) {
      return commandFailure(error, 'createItem');
    }
  },

  createAuthoringBinding: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getDeliverableCommandService().createNativeAuthoringBinding(
        session.tenantId as TenantId,
        session.personId,
        {
          deliverableItemId: value(formData, 'itemId'),
          authoritativeObjectId: value(formData, 'authoritativeObjectId')
        }
      );
      return { action: 'createAuthoringBinding', ok: true, message: 'Native authoring bound.' };
    } catch (error) {
      return commandFailure(error, 'createAuthoringBinding');
    }
  },

  addResponsibility: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getDeliverableCommandService().addResponsibility(
        session.tenantId as TenantId,
        session.personId,
        {
          deliverableItemId: value(formData, 'itemId'),
          principalType: parseEnum<DeliverablePrincipalType>(
            value(formData, 'principalType'),
            ['PERSON', 'POSITION', 'ORGANISATION_UNIT', 'ORGANISATION'],
            'principal type'
          ),
          principalId: value(formData, 'principalId'),
          responsibilityRole: parseEnum<WorkResponsibilityRole>(
            value(formData, 'responsibilityRole'),
            ['ACCOUNTABLE', 'RESPONSIBLE', 'CONTRIBUTOR', 'REVIEWER', 'CHECKER', 'APPROVER', 'ACCEPTOR', 'CONSULTED', 'INFORMED', 'ASSURANCE'],
            'responsibility role'
          ),
          effectiveFrom: optionalValue(formData, 'effectiveFrom'),
          effectiveTo: optionalValue(formData, 'effectiveTo')
        }
      );
      return { action: 'addResponsibility', ok: true, message: 'Deliverable responsibility assigned.' };
    } catch (error) {
      return commandFailure(error, 'addResponsibility');
    }
  },

  startItem: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getDeliverableCommandService().startItem(
        session.tenantId as TenantId,
        session.personId,
        value(formData, 'itemId')
      );
      return { action: 'startItem', ok: true, message: 'Deliverable execution started.' };
    } catch (error) {
      return commandFailure(error, 'startItem');
    }
  },

  bindOutput: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getDeliverableCommandService().bindOutput(
        session.tenantId as TenantId,
        session.personId,
        {
          itemId: value(formData, 'itemId'),
          outputObjectId: value(formData, 'outputObjectId'),
          outputVersion: optionalValue(formData, 'outputVersion')
        }
      );
      return { action: 'bindOutput', ok: true, message: 'Exact governed output bound.' };
    } catch (error) {
      return commandFailure(error, 'bindOutput');
    }
  },

  submitForReview: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getDeliverableCommandService().submitForReview(
        session.tenantId as TenantId,
        session.personId,
        value(formData, 'itemId')
      );
      return { action: 'submitForReview', ok: true, message: 'Deliverable submitted for review.' };
    } catch (error) {
      return commandFailure(error, 'submitForReview');
    }
  },

  recordReview: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getDeliverableCommandService().recordReview(
        session.tenantId as TenantId,
        session.personId,
        {
          itemId: value(formData, 'itemId'),
          reviewType: parseEnum<DeliverableReviewType>(
            value(formData, 'reviewType'),
            ['AUTHOR_REVIEW', 'PEER_REVIEW', 'CHECK', 'TECHNICAL_REVIEW', 'ASSURANCE', 'CUSTOM'],
            'review type'
          ),
          outcome: parseEnum<DeliverableReviewOutcome>(
            value(formData, 'outcome'),
            ['NO_COMMENT', 'COMMENTS', 'REVISE', 'REJECTED'],
            'review outcome'
          ),
          comments: optionalValue(formData, 'comments'),
          evidenceRecordId: optionalValue(formData, 'evidenceRecordId')
        }
      );
      return { action: 'recordReview', ok: true, message: 'Exact-version review recorded.' };
    } catch (error) {
      return commandFailure(error, 'recordReview');
    }
  },

  approve: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getDeliverableCommandService().approve(
        session.tenantId as TenantId,
        session.personId,
        {
          itemId: value(formData, 'itemId'),
          decisionId: value(formData, 'decisionId')
        }
      );
      return { action: 'approve', ok: true, message: 'Authority-backed approval applied.' };
    } catch (error) {
      return commandFailure(error, 'approve');
    }
  },

  issue: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getDeliverableCommandService().issue(
        session.tenantId as TenantId,
        session.personId,
        {
          itemId: value(formData, 'itemId'),
          issueReference: value(formData, 'issueReference'),
          issuePurpose: value(formData, 'issuePurpose'),
          representationId: optionalValue(formData, 'representationId'),
          responseRequired: checked(formData, 'responseRequired')
        }
      );
      return { action: 'issue', ok: true, message: 'Deliverable issued by controlled Transmittal.' };
    } catch (error) {
      return commandFailure(error, 'issue');
    }
  },

  addRecipient: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getDeliverableCommandService().addRecipient(
        session.tenantId as TenantId,
        session.personId,
        {
          transmittalId: value(formData, 'transmittalId'),
          recipientPartyId: value(formData, 'recipientPartyId'),
          responseRequired: checked(formData, 'responseRequired'),
          dueAt: optionalValue(formData, 'dueAt')
        }
      );
      return { action: 'addRecipient', ok: true, message: 'Transmittal recipient added.' };
    } catch (error) {
      return commandFailure(error, 'addRecipient');
    }
  },

  recordResponse: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getDeliverableCommandService().recordResponse(
        session.tenantId as TenantId,
        session.personId,
        {
          recipientId: value(formData, 'recipientId'),
          outcome: parseEnum<RecipientResponseOutcome>(
            value(formData, 'outcome'),
            ['ACCEPTED', 'ACCEPTED_WITH_COMMENTS', 'NO_OBJECTION', 'REVISE', 'REJECTED'],
            'recipient response outcome'
          ),
          comments: optionalValue(formData, 'comments'),
          evidenceRecordId: optionalValue(formData, 'evidenceRecordId')
        }
      );
      return { action: 'recordResponse', ok: true, message: 'Recipient response recorded.' };
    } catch (error) {
      return commandFailure(error, 'recordResponse');
    }
  },

  accept: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getDeliverableCommandService().accept(
        session.tenantId as TenantId,
        session.personId,
        {
          itemId: value(formData, 'itemId'),
          transmittalId: value(formData, 'transmittalId')
        }
      );
      return { action: 'accept', ok: true, message: 'Mandatory recipient acceptance completed.' };
    } catch (error) {
      return commandFailure(error, 'accept');
    }
  },

  createRework: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getDeliverableCommandService().createRework(
        session.tenantId as TenantId,
        session.personId,
        {
          itemId: value(formData, 'itemId'),
          triggerType: parseEnum(
            value(formData, 'triggerType'),
            ['REVIEW', 'DECISION', 'RECIPIENT_RESPONSE'] as const,
            'rework trigger type'
          ),
          triggerId: value(formData, 'triggerId'),
          reason: value(formData, 'reason')
        }
      );
      return { action: 'createRework', ok: true, message: 'Deliverable entered governed rework.' };
    } catch (error) {
      return commandFailure(error, 'createRework');
    }
  },

  createConsequence: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getDeliverableCommandService().createConsequence(
        session.tenantId as TenantId,
        session.personId,
        {
          itemId: value(formData, 'itemId'),
          consequenceType: value(formData, 'consequenceType'),
          targetObjectId: optionalValue(formData, 'targetObjectId'),
          targetVersion: optionalValue(formData, 'targetVersion'),
          evidenceRecordId: optionalValue(formData, 'evidenceRecordId')
        }
      );
      return { action: 'createConsequence', ok: true, message: 'Downstream consequence created.' };
    } catch (error) {
      return commandFailure(error, 'createConsequence');
    }
  },

  applyConsequence: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getDeliverableCommandService().applyConsequence(
        session.tenantId as TenantId,
        session.personId,
        value(formData, 'consequenceId')
      );
      return { action: 'applyConsequence', ok: true, message: 'Downstream consequence applied.' };
    } catch (error) {
      return commandFailure(error, 'applyConsequence');
    }
  },

  close: async ({ request, locals }) => {
    try {
      const session = signedIn(locals);
      const formData = await request.formData();
      await getDeliverableCommandService().close(
        session.tenantId as TenantId,
        session.personId,
        value(formData, 'itemId')
      );
      return { action: 'close', ok: true, message: 'Deliverable obligation closed.' };
    } catch (error) {
      return commandFailure(error, 'close');
    }
  }
};
