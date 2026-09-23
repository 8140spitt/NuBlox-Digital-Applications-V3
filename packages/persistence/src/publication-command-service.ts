import { createHash, randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type CanonicalDataEnvelope,
  type IntegrationEndpoint,
  type IntegrationEndpointDirection,
  type IntegrationEndpointType,
  type IntegrationTransportProtocol,
  type PublicationAcknowledgement,
  type PublicationAcknowledgementOutcome,
  type PublicationAcknowledgementType,
  type PublicationActivity,
  type PublicationAttempt,
  type PublicationOperation,
  type PublicationResult,
  type PublicationResultOutcome,
  type PublicationTransaction,
  type SourceAuthorityOwner,
  type SourceAuthorityRule,
  type TenantId
} from '@nublox/kernel';
import type { Pool } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlPortabilityRepository } from './portability-repository.js';
import { MySqlPublicationRepository } from './publication-repository.js';

export class PublicationCommandError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'PERMISSION_DENIED'
      | 'INVALID_INPUT'
      | 'NOT_FOUND'
      | 'CONFLICT'
  ) {
    super(message);
    this.name = 'PublicationCommandError';
  }
}

const ENDPOINT_TYPES = new Set<IntegrationEndpointType>([
  'ERP', 'MES', 'API', 'WEBHOOK', 'FILE', 'MESSAGE_BUS', 'CUSTOM'
]);
const DIRECTIONS = new Set<IntegrationEndpointDirection>([
  'OUTBOUND', 'INBOUND', 'BIDIRECTIONAL'
]);
const TRANSPORTS = new Set<IntegrationTransportProtocol>([
  'HTTP', 'HTTPS', 'SFTP', 'AMQP', 'KAFKA', 'FILE', 'CUSTOM'
]);
const OPERATIONS = new Set<PublicationOperation>([
  'CREATE', 'UPDATE', 'UPSERT', 'DELETE', 'PUBLISH', 'SYNC'
]);
const AUTHORITY_OWNERS = new Set<SourceAuthorityOwner>([
  'NUBLOX', 'ENDPOINT', 'EXTERNAL'
]);
const ACK_TYPES = new Set<PublicationAcknowledgementType>([
  'TRANSPORT', 'RECEIPT'
]);
const ACK_OUTCOMES = new Set<PublicationAcknowledgementOutcome>([
  'ACKNOWLEDGED', 'NEGATIVE_ACKNOWLEDGEMENT'
]);
const RESULT_OUTCOMES = new Set<PublicationResultOutcome>([
  'APPLIED', 'NO_CHANGE', 'WARNING', 'REJECTED', 'FAILED'
]);

function required(value: string | undefined, label: string): string {
  const result = value?.trim() ?? '';
  if (!result) {
    throw new PublicationCommandError(`${label} is required.`, 'INVALID_INPUT');
  }
  return result;
}

function optional(value: string | undefined): string | undefined {
  const result = value?.trim() ?? '';
  return result || undefined;
}

function integer(
  value: number | undefined,
  label: string,
  minimum: number
): number {
  if (!Number.isInteger(value) || (value ?? minimum - 1) < minimum) {
    throw new PublicationCommandError(
      `${label} must be an integer >= ${minimum}.`,
      'INVALID_INPUT'
    );
  }
  return value as number;
}

function iso(value: string | undefined, label: string): string {
  const raw = value ?? new Date().toISOString();
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new PublicationCommandError(`${label} is invalid.`, 'INVALID_INPUT');
  }
  return parsed.toISOString();
}

function enumValue<T extends string>(
  value: T,
  allowed: Set<T>,
  label: string
): T {
  if (!allowed.has(value)) {
    throw new PublicationCommandError(`${label} is invalid.`, 'INVALID_INPUT');
  }
  return value;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (typeof value === 'object' && value !== null) {
    const source = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(source)
        .sort()
        .map((key) => [key, stableValue(source[key])])
    );
  }
  return value;
}

function checksum(payload: Readonly<Record<string, unknown>>): string {
  const stable = JSON.stringify(stableValue(payload));
  return `sha256:${createHash('sha256').update(stable).digest('hex')}`;
}

function mapError(error: unknown): never {
  if (error instanceof PublicationCommandError) throw error;
  if (typeof error === 'object' && error !== null && 'code' in error) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw new PublicationCommandError(
        'An equivalent publication control record already exists or an active publication guard is already held.',
        'CONFLICT'
      );
    }
  }
  if (error instanceof Error) {
    if (/not found/i.test(error.message)) {
      throw new PublicationCommandError(error.message, 'NOT_FOUND');
    }
    if (
      /must|required|invalid|only|cannot|same tenant|requires|belong|permit|authority/i.test(
        error.message
      )
    ) {
      throw new PublicationCommandError(error.message, 'INVALID_INPUT');
    }
  }
  throw error;
}

export class MySqlPublicationCommandService {
  private readonly access: MySqlAccessRepository;
  private readonly repository: MySqlPublicationRepository;
  private readonly portability: MySqlPortabilityRepository;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
    this.repository = new MySqlPublicationRepository(pool);
    this.portability = new MySqlPortabilityRepository(pool);
  }

  async createEndpoint(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      code: string;
      name: string;
      endpointType: IntegrationEndpointType;
      direction: IntegrationEndpointDirection;
      transportProtocol: IntegrationTransportProtocol;
      systemName: string;
      endpointReference: string;
      recipientPartyId?: string;
      acknowledgementRequired?: boolean;
      businessResultRequired?: boolean;
      capabilities?: string[];
    }
  ): Promise<IntegrationEndpoint> {
    await this.requirePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.INTEGRATION_MANAGE
    );
    enumValue(input.endpointType, ENDPOINT_TYPES, 'Endpoint type');
    enumValue(input.direction, DIRECTIONS, 'Endpoint direction');
    enumValue(input.transportProtocol, TRANSPORTS, 'Transport protocol');
    const recipientPartyId = optional(input.recipientPartyId);
    const endpoint: IntegrationEndpoint = {
      id: asId<'IntegrationEndpointId'>(
        `INTEND-${randomUUID()}`,
        'Integration Endpoint'
      ),
      tenantId,
      code: required(input.code, 'Endpoint code').toUpperCase(),
      name: required(input.name, 'Endpoint name'),
      endpointType: input.endpointType,
      direction: input.direction,
      transportProtocol: input.transportProtocol,
      systemName: required(input.systemName, 'System name'),
      endpointReference: required(input.endpointReference, 'Endpoint reference'),
      ...(recipientPartyId
        ? {
            recipientPartyId: asId<'PartyId'>(
              recipientPartyId,
              'Recipient Party'
            )
          }
        : {}),
      acknowledgementRequired: input.acknowledgementRequired ?? true,
      businessResultRequired: input.businessResultRequired ?? true,
      capabilities: (input.capabilities ?? [])
        .map((item) => item.trim())
        .filter(Boolean),
      status: 'ACTIVE'
    };
    try {
      await this.repository.createEndpoint(endpoint, this.audit(actorPersonId));
      return endpoint;
    } catch (error) {
      return mapError(error);
    }
  }

  async createSourceAuthorityRule(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      code: string;
      name: string;
      subjectObjectType: string;
      attributePath?: string;
      authorityOwner: SourceAuthorityOwner;
      endpointId?: string;
      authorityReference?: string;
      priority?: number;
      effectiveFrom?: string;
      effectiveTo?: string;
    }
  ): Promise<SourceAuthorityRule> {
    await this.requirePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.SOURCE_AUTHORITY_MANAGE
    );
    enumValue(input.authorityOwner, AUTHORITY_OWNERS, 'Authority owner');
    const attributePath = optional(input.attributePath);
    const endpointId = optional(input.endpointId);
    const authorityReference = optional(input.authorityReference);
    const effectiveTo = optional(input.effectiveTo);
    const rule: SourceAuthorityRule = {
      id: asId<'SourceAuthorityRuleId'>(
        `SAUTH-${randomUUID()}`,
        'Source Authority Rule'
      ),
      tenantId,
      code: required(input.code, 'Source Authority Rule code').toUpperCase(),
      name: required(input.name, 'Source Authority Rule name'),
      subjectObjectType: required(
        input.subjectObjectType,
        'Subject object type'
      ).toUpperCase(),
      ...(attributePath ? { attributePath } : {}),
      authorityOwner: input.authorityOwner,
      ...(endpointId
        ? {
            endpointId: asId<'IntegrationEndpointId'>(
              endpointId,
              'Integration Endpoint'
            )
          }
        : {}),
      ...(authorityReference ? { authorityReference } : {}),
      priority: integer(input.priority ?? 0, 'Priority', 0),
      effectiveFrom: iso(input.effectiveFrom, 'Effective from'),
      ...(effectiveTo ? { effectiveTo: iso(effectiveTo, 'Effective to') } : {}),
      status: 'ACTIVE'
    };
    try {
      await this.repository.createSourceAuthorityRule(
        rule,
        this.audit(actorPersonId)
      );
      return rule;
    } catch (error) {
      return mapError(error);
    }
  }

  async storeOutboundEnvelope(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      endpointId: string;
      schemaName: string;
      schemaVersion: string;
      objectType: string;
      stableKey: string;
      payload: Readonly<Record<string, unknown>>;
      externalObjectId?: string;
      createdAt?: string;
    }
  ): Promise<CanonicalDataEnvelope> {
    await this.requirePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.PUBLICATION_EXECUTE
    );
    const endpoint = await this.repository.getEndpoint(
      tenantId,
      asId<'IntegrationEndpointId'>(
        required(input.endpointId, 'Integration Endpoint'),
        'Integration Endpoint'
      )
    );
    if (!endpoint) {
      throw new PublicationCommandError(
        'Integration Endpoint not found in tenant.',
        'NOT_FOUND'
      );
    }
    const externalObjectId = optional(input.externalObjectId);
    const envelope: CanonicalDataEnvelope = {
      id: asId<'DataEnvelopeId'>(
        `ENV-${randomUUID()}`,
        'Canonical Data Envelope'
      ),
      tenantId,
      direction: 'EXPORT',
      schemaName: required(input.schemaName, 'Schema name'),
      schemaVersion: required(input.schemaVersion, 'Schema version'),
      objectType: required(input.objectType, 'Object type').toUpperCase(),
      stableKey: required(input.stableKey, 'Stable key'),
      payload: input.payload,
      externalSystem: endpoint.systemName,
      ...(externalObjectId ? { externalObjectId } : {}),
      checksum: checksum(input.payload),
      createdAt: iso(input.createdAt, 'Envelope createdAt')
    };
    try {
      await this.portability.storeDataEnvelope(
        envelope,
        this.audit(actorPersonId)
      );
      return envelope;
    } catch (error) {
      return mapError(error);
    }
  }

  async createTransaction(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      endpointId: string;
      transactionReference: string;
      idempotencyKey: string;
      operation: PublicationOperation;
      exchangeDeliveryId?: string;
      integrationJobId?: string;
      resubmissionOfTransactionId?: string;
      requestedAt?: string;
    }
  ): Promise<PublicationTransaction> {
    await this.requirePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.PUBLICATION_EXECUTE
    );
    enumValue(input.operation, OPERATIONS, 'Publication operation');
    const exchangeDeliveryId = optional(input.exchangeDeliveryId);
    const integrationJobId = optional(input.integrationJobId);
    const resubmissionOfTransactionId = optional(
      input.resubmissionOfTransactionId
    );
    const transaction: PublicationTransaction = {
      id: asId<'PublicationTransactionId'>(
        `PUBTX-${randomUUID()}`,
        'Publication Transaction'
      ),
      tenantId,
      endpointId: asId<'IntegrationEndpointId'>(
        required(input.endpointId, 'Integration Endpoint'),
        'Integration Endpoint'
      ),
      transactionReference: required(
        input.transactionReference,
        'Transaction reference'
      ),
      idempotencyKey: required(input.idempotencyKey, 'Idempotency key'),
      operation: input.operation,
      ...(exchangeDeliveryId
        ? {
            exchangeDeliveryId: asId<'ExchangeDeliveryId'>(
              exchangeDeliveryId,
              'Exchange Delivery'
            )
          }
        : {}),
      ...(integrationJobId
        ? {
            integrationJobId: asId<'IntegrationJobId'>(
              integrationJobId,
              'Integration Job'
            )
          }
        : {}),
      ...(resubmissionOfTransactionId
        ? {
            resubmissionOfTransactionId: asId<'PublicationTransactionId'>(
              resubmissionOfTransactionId,
              'Resubmission Transaction'
            )
          }
        : {}),
      requestedByPersonId: asId<'PersonId'>(
        actorPersonId,
        'Publication requester'
      ),
      requestedAt: iso(input.requestedAt, 'Publication requestedAt'),
      status: 'QUEUED'
    };
    try {
      await this.repository.createTransaction(
        transaction,
        this.audit(actorPersonId)
      );
      return transaction;
    } catch (error) {
      return mapError(error);
    }
  }

  async addActivity(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      transactionId: string;
      subjectObjectId: string;
      subjectVersion?: string;
      action: PublicationOperation;
      sequence: number;
      dataEnvelopeId: string;
      externalIdentityId?: string;
      sourceAuthorityRuleId: string;
    }
  ): Promise<PublicationActivity> {
    await this.requirePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.PUBLICATION_EXECUTE
    );
    enumValue(input.action, OPERATIONS, 'Publication action');
    const subjectVersion = optional(input.subjectVersion);
    const externalIdentityId = optional(input.externalIdentityId);
    const activity: PublicationActivity = {
      id: asId<'PublicationActivityId'>(
        `PUBACT-${randomUUID()}`,
        'Publication Activity'
      ),
      tenantId,
      publicationTransactionId: asId<'PublicationTransactionId'>(
        required(input.transactionId, 'Publication Transaction'),
        'Publication Transaction'
      ),
      subjectObjectId: asId<'CanonicalObjectId'>(
        required(input.subjectObjectId, 'Subject Object'),
        'Subject Object'
      ),
      ...(subjectVersion ? { subjectVersion } : {}),
      action: input.action,
      sequence: integer(input.sequence, 'Activity sequence', 1),
      dataEnvelopeId: asId<'DataEnvelopeId'>(
        required(input.dataEnvelopeId, 'Data Envelope'),
        'Data Envelope'
      ),
      ...(externalIdentityId
        ? {
            externalIdentityId: asId<'ExternalIdentityId'>(
              externalIdentityId,
              'External Identity'
            )
          }
        : {}),
      sourceAuthorityRuleId: asId<'SourceAuthorityRuleId'>(
        required(input.sourceAuthorityRuleId, 'Source Authority Rule'),
        'Source Authority Rule'
      ),
      status: 'PENDING'
    };
    try {
      await this.repository.addActivity(activity, this.audit(actorPersonId));
      return activity;
    } catch (error) {
      return mapError(error);
    }
  }

  async startTransaction(
    tenantId: TenantId,
    actorPersonId: string,
    transactionId: string,
    startedAt?: string
  ): Promise<PublicationTransaction> {
    await this.requirePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.PUBLICATION_EXECUTE
    );
    try {
      return await this.repository.startTransaction(
        tenantId,
        asId<'PublicationTransactionId'>(
          required(transactionId, 'Publication Transaction'),
          'Publication Transaction'
        ),
        iso(startedAt, 'Transaction startedAt'),
        this.audit(actorPersonId)
      );
    } catch (error) {
      return mapError(error);
    }
  }

  async startAttempt(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      activityId: string;
      outboxMessageId?: string;
      startedAt?: string;
    }
  ): Promise<PublicationAttempt> {
    await this.requirePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.PUBLICATION_EXECUTE
    );
    const activityId = asId<'PublicationActivityId'>(
      required(input.activityId, 'Publication Activity'),
      'Publication Activity'
    );
    const activity = await this.repository.getActivity(tenantId, activityId);
    if (!activity) {
      throw new PublicationCommandError(
        'Publication Activity not found in tenant.',
        'NOT_FOUND'
      );
    }
    const priorAttempts = await this.repository.listAttempts(
      tenantId,
      activityId
    );
    const outboxMessageId = optional(input.outboxMessageId);
    const attempt: PublicationAttempt = {
      id: asId<'PublicationAttemptId'>(
        `PUBATT-${randomUUID()}`,
        'Publication Attempt'
      ),
      tenantId,
      publicationActivityId: activityId,
      attemptNumber: priorAttempts.length + 1,
      dataEnvelopeId: activity.dataEnvelopeId,
      ...(outboxMessageId
        ? {
            outboxMessageId: asId<'OutboxMessageId'>(
              outboxMessageId,
              'Outbox Message'
            )
          }
        : {}),
      startedAt: iso(input.startedAt, 'Attempt startedAt'),
      status: 'STARTED'
    };
    try {
      await this.repository.startAttempt(attempt, this.audit(actorPersonId));
      return attempt;
    } catch (error) {
      return mapError(error);
    }
  }

  async markAttemptSent(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      attemptId: string;
      transportReference: string;
      sentAt?: string;
    }
  ): Promise<PublicationAttempt> {
    await this.requirePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.PUBLICATION_EXECUTE
    );
    try {
      return await this.repository.markAttemptSent(
        tenantId,
        asId<'PublicationAttemptId'>(
          required(input.attemptId, 'Publication Attempt'),
          'Publication Attempt'
        ),
        iso(input.sentAt, 'Attempt sentAt'),
        required(input.transportReference, 'Transport reference'),
        this.audit(actorPersonId)
      );
    } catch (error) {
      return mapError(error);
    }
  }

  async failAttempt(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      attemptId: string;
      errorMessage: string;
      timedOut?: boolean;
      completedAt?: string;
    }
  ): Promise<PublicationAttempt> {
    await this.requirePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.PUBLICATION_EXECUTE
    );
    try {
      return await this.repository.failAttempt(
        tenantId,
        asId<'PublicationAttemptId'>(
          required(input.attemptId, 'Publication Attempt'),
          'Publication Attempt'
        ),
        iso(input.completedAt, 'Attempt completedAt'),
        required(input.errorMessage, 'Transport error'),
        input.timedOut ?? false,
        this.audit(actorPersonId)
      );
    } catch (error) {
      return mapError(error);
    }
  }

  async recordAcknowledgement(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      attemptId: string;
      acknowledgementType: PublicationAcknowledgementType;
      outcome: PublicationAcknowledgementOutcome;
      externalTransactionId?: string;
      message?: string;
      diagnosticReference?: string;
      receivedAt?: string;
    }
  ): Promise<PublicationAcknowledgement> {
    await this.requirePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.PUBLICATION_RESULT_RECORD
    );
    enumValue(
      input.acknowledgementType,
      ACK_TYPES,
      'Acknowledgement type'
    );
    enumValue(input.outcome, ACK_OUTCOMES, 'Acknowledgement outcome');
    const externalTransactionId = optional(input.externalTransactionId);
    const message = optional(input.message);
    const diagnosticReference = optional(input.diagnosticReference);
    const acknowledgement: PublicationAcknowledgement = {
      id: asId<'PublicationAcknowledgementId'>(
        `PUBACK-${randomUUID()}`,
        'Publication Acknowledgement'
      ),
      tenantId,
      publicationAttemptId: asId<'PublicationAttemptId'>(
        required(input.attemptId, 'Publication Attempt'),
        'Publication Attempt'
      ),
      acknowledgementType: input.acknowledgementType,
      outcome: input.outcome,
      receivedAt: iso(input.receivedAt, 'Acknowledgement receivedAt'),
      ...(externalTransactionId ? { externalTransactionId } : {}),
      ...(message ? { message } : {}),
      ...(diagnosticReference ? { diagnosticReference } : {})
    };
    try {
      await this.repository.recordAcknowledgement(
        acknowledgement,
        this.audit(actorPersonId)
      );
      return acknowledgement;
    } catch (error) {
      return mapError(error);
    }
  }

  async recordResult(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      activityId: string;
      acknowledgementId: string;
      outcome: PublicationResultOutcome;
      externalObjectId?: string;
      externalVersion?: string;
      resultReference?: string;
      message?: string;
      rootCause?: string;
      completedAt?: string;
    }
  ): Promise<{
    result: PublicationResult;
    transaction: PublicationTransaction;
  }> {
    await this.requirePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.PUBLICATION_RESULT_RECORD
    );
    enumValue(input.outcome, RESULT_OUTCOMES, 'Publication result outcome');
    const acknowledgementId = required(
      input.acknowledgementId,
      'Publication Acknowledgement'
    );
    const externalObjectId = optional(input.externalObjectId);
    const externalVersion = optional(input.externalVersion);
    const resultReference = optional(input.resultReference);
    const message = optional(input.message);
    const rootCause = optional(input.rootCause);
    const result: PublicationResult = {
      id: asId<'PublicationResultId'>(
        `PUBRES-${randomUUID()}`,
        'Publication Result'
      ),
      tenantId,
      publicationActivityId: asId<'PublicationActivityId'>(
        required(input.activityId, 'Publication Activity'),
        'Publication Activity'
      ),
      acknowledgementId: asId<'PublicationAcknowledgementId'>(
        acknowledgementId,
        'Publication Acknowledgement'
      ),
      outcome: input.outcome,
      completedAt: iso(input.completedAt, 'Result completedAt'),
      ...(externalObjectId ? { externalObjectId } : {}),
      ...(externalVersion ? { externalVersion } : {}),
      ...(resultReference ? { resultReference } : {}),
      ...(message ? { message } : {}),
      ...(rootCause ? { rootCause } : {})
    };
    try {
      const transaction = await this.repository.recordResult(
        result,
        this.audit(actorPersonId)
      );
      return { result, transaction };
    } catch (error) {
      return mapError(error);
    }
  }

  private audit(actorPersonId: string) {
    return {
      actorPersonId,
      correlationId: 'CLOSED-LOOP-PUBLICATION'
    };
  }

  private async requirePermission(
    tenantId: TenantId,
    actorPersonId: string,
    permissionKey: string
  ): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      actorPersonId,
      permissionKey,
      { scopeType: 'TENANT' }
    );
    if (!evaluation.allowed) {
      throw new PublicationCommandError(
        evaluation.reason,
        'PERMISSION_DENIED'
      );
    }
  }
}
