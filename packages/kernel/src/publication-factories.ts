import { invariant } from './errors.js';
import type { CanonicalObjectIdentity, Party, Person } from './model.js';
import type {
  CanonicalDataEnvelope,
  ExternalIdentity,
  IntegrationJob,
  OutboxMessage
} from './portability.js';
import type { ExchangeDelivery } from './exchange.js';
import type {
  IntegrationEndpoint,
  PublicationAcknowledgement,
  PublicationActivity,
  PublicationAttempt,
  PublicationResult,
  PublicationTransaction,
  SourceAuthorityRule
} from './publication.js';

function sameTenant(a: { tenantId: string }, b: { tenantId: string }, label: string): void {
  invariant(a.tenantId === b.tenantId, `${label} must stay within one tenant.`);
}

function text(value: string, label: string): void {
  invariant(value.trim().length > 0, `${label} must not be empty.`);
}

function date(value: string, label: string): number {
  const parsed = Date.parse(value);
  invariant(!Number.isNaN(parsed), `${label} must be a valid date/time.`);
  return parsed;
}

function terminalActivity(status: PublicationActivity['status']): boolean {
  return [
    'APPLIED',
    'WARNING',
    'BUSINESS_REJECTED',
    'BUSINESS_FAILED',
    'SKIPPED'
  ].includes(status);
}

export function createIntegrationEndpoint(
  input: IntegrationEndpoint,
  recipientParty?: Party
): IntegrationEndpoint {
  text(input.code, 'Integration Endpoint code');
  text(input.name, 'Integration Endpoint name');
  text(input.systemName, 'Integration Endpoint systemName');
  text(input.endpointReference, 'Integration Endpoint endpointReference');
  invariant(
    input.direction === 'OUTBOUND' || input.direction === 'BIDIRECTIONAL',
    'Publication Endpoint must support outbound traffic.'
  );
  invariant(
    input.capabilities.every((item) => item.trim().length > 0),
    'Integration Endpoint capabilities must not contain empty values.'
  );

  if (recipientParty) {
    sameTenant(input, recipientParty, 'Integration Endpoint recipient Party');
    invariant(
      input.recipientPartyId === recipientParty.id,
      'Integration Endpoint must reference the supplied recipient Party.'
    );
  } else {
    invariant(
      !input.recipientPartyId,
      'Integration Endpoint cannot reference an unsupplied recipient Party.'
    );
  }

  return Object.freeze({ ...input, capabilities: Object.freeze([...input.capabilities]) });
}

export function createSourceAuthorityRule(
  input: SourceAuthorityRule,
  endpoint?: IntegrationEndpoint
): SourceAuthorityRule {
  text(input.code, 'Source Authority Rule code');
  text(input.name, 'Source Authority Rule name');
  text(input.subjectObjectType, 'Source Authority Rule subjectObjectType');
  if (input.attributePath !== undefined) text(input.attributePath, 'Source Authority Rule attributePath');
  invariant(
    Number.isInteger(input.priority) && input.priority >= 0,
    'Source Authority Rule priority must be a non-negative integer.'
  );
  date(input.effectiveFrom, 'Source Authority Rule effectiveFrom');
  if (input.effectiveTo) {
    date(input.effectiveTo, 'Source Authority Rule effectiveTo');
    invariant(
      Date.parse(input.effectiveTo) >= Date.parse(input.effectiveFrom),
      'Source Authority Rule effectiveTo must not precede effectiveFrom.'
    );
  }

  if (input.authorityOwner === 'ENDPOINT') {
    invariant(Boolean(endpoint), 'ENDPOINT authority requires an Integration Endpoint.');
    if (endpoint) {
      sameTenant(input, endpoint, 'Source Authority Rule Endpoint');
      invariant(input.endpointId === endpoint.id, 'Source Authority Rule Endpoint reference does not match.');
    }
    invariant(!input.authorityReference, 'ENDPOINT authority uses endpointId rather than authorityReference.');
  } else if (input.authorityOwner === 'EXTERNAL') {
    invariant(!input.endpointId, 'EXTERNAL authority must not reference a managed Integration Endpoint.');
    text(input.authorityReference ?? '', 'Source Authority Rule authorityReference');
  } else {
    invariant(!input.endpointId && !input.authorityReference, 'NUBLOX authority must not reference an external authority.');
  }

  return Object.freeze({ ...input });
}

export function createPublicationTransaction(
  input: PublicationTransaction,
  endpoint: IntegrationEndpoint,
  requester: Person,
  exchangeDelivery?: ExchangeDelivery,
  integrationJob?: IntegrationJob,
  resubmissionOf?: PublicationTransaction
): PublicationTransaction {
  sameTenant(input, endpoint, 'Publication Transaction Endpoint');
  sameTenant(input, requester, 'Publication Transaction requester');
  invariant(input.endpointId === endpoint.id, 'Publication Transaction must reference the supplied Endpoint.');
  invariant(endpoint.status === 'ACTIVE', 'Publication Transaction requires an ACTIVE Integration Endpoint.');
  invariant(
    endpoint.direction === 'OUTBOUND' || endpoint.direction === 'BIDIRECTIONAL',
    'Publication Transaction Endpoint does not permit outbound publication.'
  );
  invariant(input.requestedByPersonId === requester.id, 'Publication Transaction requester reference does not match.');
  text(input.transactionReference, 'Publication Transaction reference');
  text(input.idempotencyKey, 'Publication Transaction idempotencyKey');
  date(input.requestedAt, 'Publication Transaction requestedAt');
  invariant(input.status === 'QUEUED', 'New Publication Transaction must start QUEUED.');
  invariant(!input.startedAt && !input.completedAt, 'New Publication Transaction must not contain execution timestamps.');

  if (exchangeDelivery) {
    sameTenant(input, exchangeDelivery, 'Publication Transaction Exchange Delivery');
    invariant(input.exchangeDeliveryId === exchangeDelivery.id, 'Publication Transaction Exchange Delivery reference does not match.');
    invariant(exchangeDelivery.status === 'DISPATCHED', 'Publication Transaction Exchange Delivery must be DISPATCHED.');
  } else {
    invariant(!input.exchangeDeliveryId, 'Publication Transaction cannot reference an unsupplied Exchange Delivery.');
  }

  if (integrationJob) {
    sameTenant(input, integrationJob, 'Publication Transaction Integration Job');
    invariant(input.integrationJobId === integrationJob.id, 'Publication Transaction Integration Job reference does not match.');
    invariant(integrationJob.jobType === 'EXPORT', 'Publication Transaction Integration Job must be EXPORT.');
    invariant(
      integrationJob.targetSystem === endpoint.systemName,
      'Publication Transaction Integration Job target system must match the Endpoint system.'
    );
  } else {
    invariant(!input.integrationJobId, 'Publication Transaction cannot reference an unsupplied Integration Job.');
  }

  if (resubmissionOf) {
    sameTenant(input, resubmissionOf, 'Publication Transaction resubmission');
    invariant(
      input.resubmissionOfTransactionId === resubmissionOf.id,
      'Publication Transaction resubmission reference does not match.'
    );
    invariant(
      resubmissionOf.status === 'FAILED' || resubmissionOf.status === 'PARTIALLY_SUCCEEDED',
      'Publication resubmission requires a failed or partially succeeded prior Transaction.'
    );
    invariant(resubmissionOf.endpointId === input.endpointId, 'Publication resubmission must target the same Endpoint.');
    invariant(input.id !== resubmissionOf.id, 'Publication Transaction cannot resubmit itself.');
  } else {
    invariant(!input.resubmissionOfTransactionId, 'Publication Transaction cannot reference an unsupplied resubmission Transaction.');
  }

  return Object.freeze({ ...input });
}

export function createPublicationActivity(
  input: PublicationActivity,
  transaction: PublicationTransaction,
  subject: CanonicalObjectIdentity,
  dataEnvelope?: CanonicalDataEnvelope,
  externalIdentity?: ExternalIdentity,
  authorityRule?: SourceAuthorityRule
): PublicationActivity {
  sameTenant(input, transaction, 'Publication Activity Transaction');
  sameTenant(input, subject, 'Publication Activity subject');
  invariant(input.publicationTransactionId === transaction.id, 'Publication Activity must reference the supplied Transaction.');
  invariant(transaction.status === 'QUEUED', 'Publication Activities can only be added while Transaction is QUEUED.');
  invariant(input.subjectObjectId === subject.id, 'Publication Activity must reference the supplied subject.');
  invariant(Number.isInteger(input.sequence) && input.sequence > 0, 'Publication Activity sequence must be a positive integer.');
  invariant(input.status === 'PENDING', 'New Publication Activity must start PENDING.');
  if (input.subjectVersion !== undefined) text(input.subjectVersion, 'Publication Activity subjectVersion');

  if (dataEnvelope) {
    sameTenant(input, dataEnvelope, 'Publication Activity Data Envelope');
    invariant(input.dataEnvelopeId === dataEnvelope.id, 'Publication Activity Data Envelope reference does not match.');
    invariant(dataEnvelope.direction === 'EXPORT', 'Publication Activity requires an EXPORT Data Envelope.');
  } else {
    invariant(!input.dataEnvelopeId, 'Publication Activity cannot reference an unsupplied Data Envelope.');
  }

  if (externalIdentity) {
    sameTenant(input, externalIdentity, 'Publication Activity External Identity');
    invariant(input.externalIdentityId === externalIdentity.id, 'Publication Activity External Identity reference does not match.');
    invariant(externalIdentity.canonicalObjectId === subject.id, 'Publication Activity External Identity must belong to the subject.');
  } else {
    invariant(!input.externalIdentityId, 'Publication Activity cannot reference an unsupplied External Identity.');
  }

  if (authorityRule) {
    sameTenant(input, authorityRule, 'Publication Activity Source Authority Rule');
    invariant(input.sourceAuthorityRuleId === authorityRule.id, 'Publication Activity Source Authority Rule reference does not match.');
    invariant(authorityRule.status === 'ACTIVE', 'Publication Activity requires an ACTIVE Source Authority Rule.');
    invariant(authorityRule.subjectObjectType === subject.objectType, 'Source Authority Rule object type must match the published subject.');
  } else {
    invariant(!input.sourceAuthorityRuleId, 'Publication Activity cannot reference an unsupplied Source Authority Rule.');
  }

  return Object.freeze({ ...input });
}

export function startPublicationTransaction(
  current: PublicationTransaction,
  activities: ReadonlyArray<PublicationActivity>,
  startedAt: string
): PublicationTransaction {
  invariant(current.status === 'QUEUED', 'Only a QUEUED Publication Transaction can start.');
  invariant(activities.length > 0, 'Publication Transaction cannot start without Activities.');
  invariant(
    activities.every((item) => item.publicationTransactionId === current.id && item.status === 'PENDING'),
    'Publication Transaction can only start with its own pending Activities.'
  );
  date(startedAt, 'Publication Transaction startedAt');
  invariant(Date.parse(startedAt) >= Date.parse(current.requestedAt), 'Publication Transaction cannot start before it was requested.');
  return Object.freeze({ ...current, status: 'IN_PROGRESS', startedAt });
}

export function createPublicationAttempt(
  input: PublicationAttempt,
  transaction: PublicationTransaction,
  activity: PublicationActivity,
  envelope: CanonicalDataEnvelope,
  outboxMessage?: OutboxMessage,
  priorAttempts: ReadonlyArray<PublicationAttempt> = []
): PublicationAttempt {
  sameTenant(input, transaction, 'Publication Attempt Transaction');
  sameTenant(input, activity, 'Publication Attempt Activity');
  sameTenant(input, envelope, 'Publication Attempt Data Envelope');
  invariant(activity.publicationTransactionId === transaction.id, 'Publication Attempt Activity must belong to the Transaction.');
  invariant(
    transaction.status === 'IN_PROGRESS' || transaction.status === 'AWAITING_RESULTS',
    'Publication Attempt requires an active Publication Transaction.'
  );
  invariant(
    activity.status === 'PENDING' || activity.status === 'TRANSPORT_FAILED',
    'Publication Attempt requires a pending or transport-failed Activity.'
  );
  invariant(input.publicationActivityId === activity.id, 'Publication Attempt must reference the supplied Activity.');
  invariant(input.dataEnvelopeId === envelope.id, 'Publication Attempt must reference the supplied Data Envelope.');
  invariant(envelope.direction === 'EXPORT', 'Publication Attempt requires an EXPORT Data Envelope.');
  invariant(input.status === 'STARTED', 'New Publication Attempt must start STARTED.');
  invariant(
    Number.isInteger(input.attemptNumber) && input.attemptNumber === priorAttempts.length + 1,
    'Publication Attempt number must advance monotonically.'
  );
  invariant(
    priorAttempts.every((attempt) =>
      attempt.publicationActivityId === activity.id &&
      ['DELIVERED', 'FAILED', 'TIMED_OUT'].includes(attempt.status)
    ),
    'Prior Publication Attempts must belong to the Activity and be terminal.'
  );
  date(input.startedAt, 'Publication Attempt startedAt');
  invariant(
    !input.sentAt && !input.completedAt && !input.transportReference && !input.errorMessage,
    'New Publication Attempt must not contain later transport state.'
  );

  if (outboxMessage) {
    sameTenant(input, outboxMessage, 'Publication Attempt Outbox Message');
    invariant(input.outboxMessageId === outboxMessage.id, 'Publication Attempt Outbox reference does not match.');
  } else {
    invariant(!input.outboxMessageId, 'Publication Attempt cannot reference an unsupplied Outbox Message.');
  }

  return Object.freeze({ ...input });
}

export function markPublicationAttemptSent(
  current: PublicationAttempt,
  sentAt: string,
  transportReference: string
): PublicationAttempt {
  invariant(current.status === 'STARTED', 'Only a STARTED Publication Attempt can be sent.');
  date(sentAt, 'Publication Attempt sentAt');
  invariant(Date.parse(sentAt) >= Date.parse(current.startedAt), 'Publication Attempt cannot be sent before it starts.');
  text(transportReference, 'Publication Attempt transportReference');
  return Object.freeze({ ...current, status: 'SENT', sentAt, transportReference });
}

export function failPublicationAttempt(
  current: PublicationAttempt,
  completedAt: string,
  errorMessage: string,
  timedOut = false
): PublicationAttempt {
  invariant(
    current.status === 'STARTED' || current.status === 'SENT',
    'Only an active Publication Attempt can fail.'
  );
  date(completedAt, 'Publication Attempt completedAt');
  text(errorMessage, 'Publication Attempt errorMessage');
  return Object.freeze({
    ...current,
    status: timedOut ? 'TIMED_OUT' : 'FAILED',
    completedAt,
    errorMessage
  });
}

export function createPublicationAcknowledgement(
  input: PublicationAcknowledgement,
  attempt: PublicationAttempt
): PublicationAcknowledgement {
  sameTenant(input, attempt, 'Publication Acknowledgement Attempt');
  invariant(input.publicationAttemptId === attempt.id, 'Publication Acknowledgement must reference the supplied Attempt.');
  invariant(attempt.status === 'SENT', 'Publication Acknowledgement requires a SENT Attempt.');
  date(input.receivedAt, 'Publication Acknowledgement receivedAt');
  invariant(
    Date.parse(input.receivedAt) >= Date.parse(attempt.sentAt ?? attempt.startedAt),
    'Publication Acknowledgement cannot precede the transport send.'
  );
  if (input.externalTransactionId) text(input.externalTransactionId, 'Publication Acknowledgement externalTransactionId');
  if (input.message) text(input.message, 'Publication Acknowledgement message');
  if (input.diagnosticReference) text(input.diagnosticReference, 'Publication Acknowledgement diagnosticReference');
  return Object.freeze({ ...input });
}

export function applyPublicationAcknowledgementToAttempt(
  attempt: PublicationAttempt,
  acknowledgement: PublicationAcknowledgement
): PublicationAttempt {
  sameTenant(attempt, acknowledgement, 'Publication Attempt Acknowledgement');
  invariant(acknowledgement.publicationAttemptId === attempt.id, 'Acknowledgement must belong to the Publication Attempt.');
  invariant(attempt.status === 'SENT', 'Only a SENT Publication Attempt can be acknowledged.');
  return Object.freeze({
    ...attempt,
    status: acknowledgement.outcome === 'ACKNOWLEDGED' ? 'DELIVERED' : 'FAILED',
    completedAt: acknowledgement.receivedAt,
    ...(acknowledgement.outcome === 'NEGATIVE_ACKNOWLEDGEMENT'
      ? { errorMessage: acknowledgement.message ?? 'Negative acknowledgement received.' }
      : {})
  });
}

export function applyPublicationAcknowledgementToActivity(
  activity: PublicationActivity,
  acknowledgement: PublicationAcknowledgement
): PublicationActivity {
  invariant(
    activity.status === 'AWAITING_ACKNOWLEDGEMENT',
    'Only an Activity awaiting acknowledgement can consume an Acknowledgement.'
  );
  return Object.freeze({
    ...activity,
    status: acknowledgement.outcome === 'ACKNOWLEDGED'
      ? 'ACKNOWLEDGED'
      : 'TRANSPORT_FAILED'
  });
}

export function createPublicationResult(
  input: PublicationResult,
  activity: PublicationActivity,
  acknowledgement?: PublicationAcknowledgement
): PublicationResult {
  sameTenant(input, activity, 'Publication Result Activity');
  invariant(input.publicationActivityId === activity.id, 'Publication Result must reference the supplied Activity.');
  invariant(
    activity.status === 'ACKNOWLEDGED',
    'Publication Result requires an acknowledged Activity; transport delivery alone is insufficient.'
  );
  date(input.completedAt, 'Publication Result completedAt');

  if (acknowledgement) {
    sameTenant(input, acknowledgement, 'Publication Result Acknowledgement');
    invariant(input.acknowledgementId === acknowledgement.id, 'Publication Result Acknowledgement reference does not match.');
    invariant(acknowledgement.outcome === 'ACKNOWLEDGED', 'Publication Result cannot rely on a negative Acknowledgement.');
  } else {
    invariant(!input.acknowledgementId, 'Publication Result cannot reference an unsupplied Acknowledgement.');
  }

  if (input.externalObjectId) text(input.externalObjectId, 'Publication Result externalObjectId');
  if (input.externalVersion) text(input.externalVersion, 'Publication Result externalVersion');
  if (input.resultReference) text(input.resultReference, 'Publication Result resultReference');
  if (input.message) text(input.message, 'Publication Result message');
  if (input.rootCause) text(input.rootCause, 'Publication Result rootCause');

  if (input.outcome === 'FAILED' || input.outcome === 'REJECTED') {
    invariant(Boolean(input.message || input.rootCause), 'Failed or rejected Publication Result requires diagnostic evidence.');
  }

  return Object.freeze({ ...input });
}

export function applyPublicationResultToActivity(
  activity: PublicationActivity,
  result: PublicationResult
): PublicationActivity {
  sameTenant(activity, result, 'Publication Activity Result');
  invariant(result.publicationActivityId === activity.id, 'Publication Result must belong to the Activity.');
  invariant(activity.status === 'ACKNOWLEDGED', 'Publication Result requires an ACKNOWLEDGED Activity.');
  const status: PublicationActivity['status'] =
    result.outcome === 'APPLIED' || result.outcome === 'NO_CHANGE'
      ? 'APPLIED'
      : result.outcome === 'WARNING'
        ? 'WARNING'
        : result.outcome === 'REJECTED'
          ? 'BUSINESS_REJECTED'
          : 'BUSINESS_FAILED';
  return Object.freeze({ ...activity, status });
}

export function updatePublicationTransactionFromActivities(
  transaction: PublicationTransaction,
  activities: ReadonlyArray<PublicationActivity>,
  evaluatedAt: string
): PublicationTransaction {
  invariant(
    transaction.status === 'IN_PROGRESS' || transaction.status === 'AWAITING_RESULTS',
    'Only an active Publication Transaction can derive status from Activities.'
  );
  invariant(activities.length > 0, 'Publication Transaction status requires Activities.');
  invariant(
    activities.every((item) => item.publicationTransactionId === transaction.id),
    'All Publication Activities must belong to the Transaction.'
  );
  date(evaluatedAt, 'Publication Transaction evaluatedAt');

  if (!activities.every((item) => terminalActivity(item.status))) {
    const awaitingBusiness = activities.some((item) =>
      item.status === 'ACKNOWLEDGED' ||
      item.status === 'AWAITING_ACKNOWLEDGEMENT' ||
      item.status === 'SENDING'
    );
    return Object.freeze({
      ...transaction,
      status: awaitingBusiness ? 'AWAITING_RESULTS' : 'IN_PROGRESS'
    });
  }

  const successful = activities.filter((item) =>
    item.status === 'APPLIED' || item.status === 'SKIPPED'
  ).length;
  const warning = activities.filter((item) => item.status === 'WARNING').length;
  const failed = activities.length - successful - warning;

  const status: PublicationTransaction['status'] =
    failed === 0 && warning === 0
      ? 'SUCCEEDED'
      : successful === 0 && warning === 0
        ? 'FAILED'
        : 'PARTIALLY_SUCCEEDED';

  return Object.freeze({
    ...transaction,
    status,
    completedAt: evaluatedAt
  });
}
