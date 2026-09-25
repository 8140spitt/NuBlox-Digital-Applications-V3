import {
  PublicationCommandError,
  type MySqlAccessRepository
} from '@nublox/persistence';
import {
  PLATFORM_PERMISSION_KEYS,
  type IntegrationEndpointDirection,
  type IntegrationEndpointType,
  type IntegrationTransportProtocol,
  type PublicationAcknowledgementOutcome,
  type PublicationAcknowledgementType,
  type PublicationOperation,
  type PublicationResultOutcome,
  type SourceAuthorityOwner
} from '@nublox/kernel';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getPublicationCommandService,
  getPublicationReadRepository
} from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];

const ENDPOINT_TYPES = [
  'ERP','MES','API','WEBHOOK','FILE','MESSAGE_BUS','CUSTOM'
] as const satisfies readonly IntegrationEndpointType[];
const DIRECTIONS = [
  'OUTBOUND','INBOUND','BIDIRECTIONAL'
] as const satisfies readonly IntegrationEndpointDirection[];
const TRANSPORTS = [
  'HTTP','HTTPS','SFTP','AMQP','KAFKA','FILE','CUSTOM'
] as const satisfies readonly IntegrationTransportProtocol[];
const OPERATIONS = [
  'CREATE','UPDATE','UPSERT','DELETE','PUBLISH','SYNC'
] as const satisfies readonly PublicationOperation[];
const AUTHORITY_OWNERS = [
  'NUBLOX','ENDPOINT','EXTERNAL'
] as const satisfies readonly SourceAuthorityOwner[];
const ACK_TYPES = [
  'TRANSPORT','RECEIPT'
] as const satisfies readonly PublicationAcknowledgementType[];
const ACK_OUTCOMES = [
  'ACKNOWLEDGED','NEGATIVE_ACKNOWLEDGEMENT'
] as const satisfies readonly PublicationAcknowledgementOutcome[];
const RESULT_OUTCOMES = [
  'APPLIED','NO_CHANGE','WARNING','REJECTED','FAILED'
] as const satisfies readonly PublicationResultOutcome[];

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function optionalValue(formData: FormData, name: string): string | undefined {
  const result = value(formData, name);
  return result || undefined;
}

function integerValue(raw: string, label: string): number | undefined {
  if (!raw) return undefined;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    throw new PublicationCommandError(
      `${label} must be an integer.`,
      'INVALID_INPUT'
    );
  }
  return parsed;
}

function enumValue<T extends string>(
  raw: string,
  allowed: readonly T[],
  label: string
): T {
  if (!allowed.includes(raw as T)) {
    throw new PublicationCommandError(
      `${label} is invalid.`,
      'INVALID_INPUT'
    );
  }
  return raw as T;
}

function jsonObject(raw: string): Readonly<Record<string, unknown>> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new PublicationCommandError(
      'Payload must be valid JSON.',
      'INVALID_INPUT'
    );
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new PublicationCommandError(
      'Payload must be a JSON object.',
      'INVALID_INPUT'
    );
  }
  return parsed as Readonly<Record<string, unknown>>;
}

function failure(error: unknown, action: string) {
  if (error instanceof PublicationCommandError) {
    const status =
      error.code === 'PERMISSION_DENIED'
        ? 403
        : error.code === 'NOT_FOUND'
          ? 404
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
      canManageEndpoints: false,
      canExecute: false,
      canRecordResults: false,
      canManageAuthority: false,
      reason: 'No authenticated tenant context is available.',
      projection: null
    };
  }

  const tenantId = session.tenantId as TenantId;
  const access = getAccessRepository();
  const [read, manage, execute, result, authority] = await Promise.all([
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.INTEGRATION_READ,
      { scopeType: 'TENANT' }
    ),
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.INTEGRATION_MANAGE,
      { scopeType: 'TENANT' }
    ),
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.PUBLICATION_EXECUTE,
      { scopeType: 'TENANT' }
    ),
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.PUBLICATION_RESULT_RECORD,
      { scopeType: 'TENANT' }
    ),
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.SOURCE_AUTHORITY_MANAGE,
      { scopeType: 'TENANT' }
    )
  ]);

  if (!read.allowed) {
    return {
      allowed: false,
      canManageEndpoints: false,
      canExecute: false,
      canRecordResults: false,
      canManageAuthority: false,
      reason: read.reason,
      projection: null
    };
  }

  return {
    allowed: true,
    canManageEndpoints: manage.allowed,
    canExecute: execute.allowed,
    canRecordResults: result.allowed,
    canManageAuthority: authority.allowed,
    reason: read.reason,
    projection: await getPublicationReadRepository().getProjection(
      tenantId,
      session.personId
    )
  };
};

export const actions: Actions = {
  createEndpoint: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'createEndpoint',
        ok: false,
        error: 'Sign in required.'
      });
    }
    const formData = await request.formData();
    try {
      const item = await getPublicationCommandService().createEndpoint(
        session.tenantId as TenantId,
        session.personId,
        {
          code: value(formData, 'code'),
          name: value(formData, 'name'),
          endpointType: enumValue(
            value(formData, 'endpointType'),
            ENDPOINT_TYPES,
            'Endpoint type'
          ),
          direction: enumValue(
            value(formData, 'direction'),
            DIRECTIONS,
            'Direction'
          ),
          transportProtocol: enumValue(
            value(formData, 'transportProtocol'),
            TRANSPORTS,
            'Transport protocol'
          ),
          systemName: value(formData, 'systemName'),
          endpointReference: value(formData, 'endpointReference'),
          recipientPartyId: optionalValue(formData, 'recipientPartyId'),
          acknowledgementRequired: true,
          businessResultRequired: true,
          capabilities: value(formData, 'capabilities')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        }
      );
      return {
        action: 'createEndpoint',
        ok: true,
        message: `Integration Endpoint ${item.code} created.`
      };
    } catch (error) {
      return failure(error, 'createEndpoint');
    }
  },

  createAuthorityRule: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'createAuthorityRule',
        ok: false,
        error: 'Sign in required.'
      });
    }
    const formData = await request.formData();
    try {
      const item =
        await getPublicationCommandService().createSourceAuthorityRule(
          session.tenantId as TenantId,
          session.personId,
          {
            code: value(formData, 'code'),
            name: value(formData, 'name'),
            subjectObjectType: value(formData, 'subjectObjectType'),
            attributePath: optionalValue(formData, 'attributePath'),
            authorityOwner: enumValue(
              value(formData, 'authorityOwner'),
              AUTHORITY_OWNERS,
              'Authority owner'
            ),
            endpointId: optionalValue(formData, 'endpointId'),
            authorityReference: optionalValue(
              formData,
              'authorityReference'
            ),
            priority: integerValue(
              value(formData, 'priority'),
              'Priority'
            ),
            effectiveFrom: optionalValue(formData, 'effectiveFrom'),
            effectiveTo: optionalValue(formData, 'effectiveTo')
          }
        );
      return {
        action: 'createAuthorityRule',
        ok: true,
        message: `Source Authority Rule ${item.code} created.`
      };
    } catch (error) {
      return failure(error, 'createAuthorityRule');
    }
  },

  storeEnvelope: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'storeEnvelope',
        ok: false,
        error: 'Sign in required.'
      });
    }
    const formData = await request.formData();
    try {
      const item =
        await getPublicationCommandService().storeOutboundEnvelope(
          session.tenantId as TenantId,
          session.personId,
          {
            endpointId: value(formData, 'endpointId'),
            schemaName: value(formData, 'schemaName'),
            schemaVersion: value(formData, 'schemaVersion'),
            objectType: value(formData, 'objectType'),
            stableKey: value(formData, 'stableKey'),
            payload: jsonObject(value(formData, 'payload')),
            externalObjectId: optionalValue(
              formData,
              'externalObjectId'
            )
          }
        );
      return {
        action: 'storeEnvelope',
        ok: true,
        message: `Outbound envelope ${item.id} stored with ${item.checksum}.`
      };
    } catch (error) {
      return failure(error, 'storeEnvelope');
    }
  },

  createTransaction: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'createTransaction',
        ok: false,
        error: 'Sign in required.'
      });
    }
    const formData = await request.formData();
    try {
      const item = await getPublicationCommandService().createTransaction(
        session.tenantId as TenantId,
        session.personId,
        {
          endpointId: value(formData, 'endpointId'),
          transactionReference: value(
            formData,
            'transactionReference'
          ),
          idempotencyKey: value(formData, 'idempotencyKey'),
          operation: enumValue(
            value(formData, 'operation'),
            OPERATIONS,
            'Operation'
          ),
          exchangeDeliveryId: optionalValue(
            formData,
            'exchangeDeliveryId'
          ),
          integrationJobId: optionalValue(
            formData,
            'integrationJobId'
          ),
          resubmissionOfTransactionId: optionalValue(
            formData,
            'resubmissionOfTransactionId'
          )
        }
      );
      return {
        action: 'createTransaction',
        ok: true,
        message: `Publication Transaction ${item.transactionReference} queued.`
      };
    } catch (error) {
      return failure(error, 'createTransaction');
    }
  },

  addActivity: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'addActivity',
        ok: false,
        error: 'Sign in required.'
      });
    }
    const formData = await request.formData();
    try {
      const item = await getPublicationCommandService().addActivity(
        session.tenantId as TenantId,
        session.personId,
        {
          transactionId: value(formData, 'transactionId'),
          subjectObjectId: value(formData, 'subjectObjectId'),
          subjectVersion: optionalValue(formData, 'subjectVersion'),
          action: enumValue(
            value(formData, 'action'),
            OPERATIONS,
            'Activity action'
          ),
          sequence:
            integerValue(
              value(formData, 'sequence'),
              'Activity sequence'
            ) ?? 1,
          dataEnvelopeId: value(formData, 'dataEnvelopeId'),
          externalIdentityId: optionalValue(
            formData,
            'externalIdentityId'
          ),
          sourceAuthorityRuleId: value(
            formData,
            'sourceAuthorityRuleId'
          )
        }
      );
      return {
        action: 'addActivity',
        ok: true,
        message: `Publication Activity ${item.id} added.`
      };
    } catch (error) {
      return failure(error, 'addActivity');
    }
  },

  startTransaction: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'startTransaction',
        ok: false,
        error: 'Sign in required.'
      });
    }
    const formData = await request.formData();
    try {
      const item =
        await getPublicationCommandService().startTransaction(
          session.tenantId as TenantId,
          session.personId,
          value(formData, 'transactionId')
        );
      return {
        action: 'startTransaction',
        ok: true,
        message: `Publication Transaction ${item.transactionReference} started.`
      };
    } catch (error) {
      return failure(error, 'startTransaction');
    }
  },

  startAttempt: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'startAttempt',
        ok: false,
        error: 'Sign in required.'
      });
    }
    const formData = await request.formData();
    try {
      const item = await getPublicationCommandService().startAttempt(
        session.tenantId as TenantId,
        session.personId,
        {
          activityId: value(formData, 'activityId'),
          outboxMessageId: optionalValue(
            formData,
            'outboxMessageId'
          )
        }
      );
      return {
        action: 'startAttempt',
        ok: true,
        message: `Publication Attempt #${item.attemptNumber} started.`
      };
    } catch (error) {
      return failure(error, 'startAttempt');
    }
  },

  markSent: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'markSent',
        ok: false,
        error: 'Sign in required.'
      });
    }
    const formData = await request.formData();
    try {
      const item = await getPublicationCommandService().markAttemptSent(
        session.tenantId as TenantId,
        session.personId,
        {
          attemptId: value(formData, 'attemptId'),
          transportReference: value(
            formData,
            'transportReference'
          )
        }
      );
      return {
        action: 'markSent',
        ok: true,
        message: `Attempt ${item.id} sent; business transaction remains open.`
      };
    } catch (error) {
      return failure(error, 'markSent');
    }
  },

  failAttempt: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'failAttempt',
        ok: false,
        error: 'Sign in required.'
      });
    }
    const formData = await request.formData();
    try {
      const item = await getPublicationCommandService().failAttempt(
        session.tenantId as TenantId,
        session.personId,
        {
          attemptId: value(formData, 'attemptId'),
          errorMessage: value(formData, 'errorMessage'),
          timedOut: value(formData, 'timedOut') === 'true'
        }
      );
      return {
        action: 'failAttempt',
        ok: true,
        message: `Attempt ${item.id} recorded as ${item.status}; activity is eligible for transport retry.`
      };
    } catch (error) {
      return failure(error, 'failAttempt');
    }
  },

  recordAcknowledgement: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'recordAcknowledgement',
        ok: false,
        error: 'Sign in required.'
      });
    }
    const formData = await request.formData();
    try {
      const item =
        await getPublicationCommandService().recordAcknowledgement(
          session.tenantId as TenantId,
          session.personId,
          {
            attemptId: value(formData, 'attemptId'),
            acknowledgementType: enumValue(
              value(formData, 'acknowledgementType'),
              ACK_TYPES,
              'Acknowledgement type'
            ),
            outcome: enumValue(
              value(formData, 'outcome'),
              ACK_OUTCOMES,
              'Acknowledgement outcome'
            ),
            externalTransactionId: optionalValue(
              formData,
              'externalTransactionId'
            ),
            message: optionalValue(formData, 'message'),
            diagnosticReference: optionalValue(
              formData,
              'diagnosticReference'
            )
          }
        );
      return {
        action: 'recordAcknowledgement',
        ok: true,
        message: `Acknowledgement ${item.id} recorded; this does not itself prove business application.`
      };
    } catch (error) {
      return failure(error, 'recordAcknowledgement');
    }
  },

  recordResult: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'recordResult',
        ok: false,
        error: 'Sign in required.'
      });
    }
    const formData = await request.formData();
    try {
      const item = await getPublicationCommandService().recordResult(
        session.tenantId as TenantId,
        session.personId,
        {
          activityId: value(formData, 'activityId'),
          acknowledgementId: value(
            formData,
            'acknowledgementId'
          ),
          outcome: enumValue(
            value(formData, 'outcome'),
            RESULT_OUTCOMES,
            'Result outcome'
          ),
          externalObjectId: optionalValue(
            formData,
            'externalObjectId'
          ),
          externalVersion: optionalValue(
            formData,
            'externalVersion'
          ),
          resultReference: optionalValue(
            formData,
            'resultReference'
          ),
          message: optionalValue(formData, 'message'),
          rootCause: optionalValue(formData, 'rootCause')
        }
      );
      return {
        action: 'recordResult',
        ok: true,
        message: `Business result ${item.result.outcome} recorded; transaction is now ${item.transaction.status}.`
      };
    } catch (error) {
      return failure(error, 'recordResult');
    }
  }
};
