import { invariant } from './errors.js';
import type { Decision } from './control.js';
import type {
  DeliverableApproval,
  DeliverableConsequence,
  DeliverableItem,
  DeliverableRequirement,
  DeliverableResponsibility,
  DeliverableReview,
  DeliverableRework,
  RecipientResponse,
  Transmittal,
  TransmittalRecipient
} from './deliverables.js';
import type {
  FunctionalDeployment,
  FunctionDefinition,
  ProcessDefinition,
  SubFunctionDefinition,
  TaskDefinition
} from './functional.js';
import type {
  CanonicalObjectIdentity,
  Organisation,
  OrganisationUnit,
  Party,
  Person,
  Position
} from './model.js';

function assertSameTenant(expected: string, actual: string, label: string) {
  invariant(expected === actual, `${label} must belong to the same tenant.`);
}

function assertNonEmpty(value: string, label: string) {
  invariant(Boolean(value.trim()), `${label} must not be empty.`);
}

function assertDate(value: string, label: string) {
  invariant(Number.isFinite(Date.parse(value)), `${label} must be a valid date/time.`);
}

function assertDateOrder(from: string, to: string | undefined, label: string) {
  assertDate(from, `${label} effectiveFrom`);
  if (to) {
    assertDate(to, `${label} effectiveTo`);
    invariant(
      Date.parse(to) >= Date.parse(from),
      `${label} effectiveTo must not be earlier than effectiveFrom.`
    );
  }
}

function assertExactSubject(
  item: DeliverableItem,
  subject: CanonicalObjectIdentity,
  subjectVersion: string | undefined,
  label: string
) {
  assertSameTenant(item.tenantId, subject.tenantId, `${label} and subject`);
  invariant(
    item.governedOutputObjectId === subject.id,
    `${label} must reference the Deliverable Item governed output.`
  );
  invariant(
    item.governedOutputVersion === subjectVersion,
    `${label} must reference the exact governed output version.`
  );
}

export function createDeliverableRequirement(
  input: DeliverableRequirement,
  context: CanonicalObjectIdentity,
  options: {
    functionDefinition?: FunctionDefinition;
    subFunction?: SubFunctionDefinition;
    process?: ProcessDefinition;
    task?: TaskDefinition;
    deployment?: FunctionalDeployment;
    sourceRequirement?: CanonicalObjectIdentity;
  } = {}
): DeliverableRequirement {
  assertSameTenant(input.tenantId, context.tenantId, 'Deliverable Requirement and context');
  invariant(
    input.contextObjectId === context.id,
    'Deliverable Requirement must reference the supplied context object.'
  );
  assertNonEmpty(input.code, 'Deliverable Requirement code');
  assertNonEmpty(input.title, 'Deliverable Requirement title');
  assertNonEmpty(input.deliverableType, 'Deliverable Requirement deliverableType');
  assertNonEmpty(input.description, 'Deliverable Requirement description');

  if (input.plannedDueAt) assertDate(input.plannedDueAt, 'Deliverable Requirement plannedDueAt');
  for (const representationType of input.requiredRepresentationTypes) {
    assertNonEmpty(representationType, 'Required Representation type');
  }

  if (options.functionDefinition) {
    invariant(
      input.functionId === options.functionDefinition.id,
      'Deliverable Requirement must reference the supplied Function.'
    );
  } else {
    invariant(!input.functionId, 'Deliverable Requirement cannot reference an unsupplied Function.');
  }

  if (options.subFunction) {
    invariant(
      input.subFunctionId === options.subFunction.id,
      'Deliverable Requirement must reference the supplied Sub-function.'
    );
    invariant(
      options.functionDefinition?.id === options.subFunction.functionId,
      'Deliverable Requirement Sub-function must belong to the supplied Function.'
    );
  } else {
    invariant(
      !input.subFunctionId,
      'Deliverable Requirement cannot reference an unsupplied Sub-function.'
    );
  }

  if (options.process) {
    assertSameTenant(input.tenantId, options.process.tenantId, 'Deliverable Requirement and Process');
    invariant(
      input.processDefinitionId === options.process.id,
      'Deliverable Requirement must reference the supplied Process.'
    );
    if (input.functionId) {
      invariant(
        options.process.functionId === input.functionId,
        'Deliverable Requirement Process must belong to the selected Function.'
      );
    }
  } else {
    invariant(
      !input.processDefinitionId,
      'Deliverable Requirement cannot reference an unsupplied Process.'
    );
  }

  if (options.task) {
    assertSameTenant(input.tenantId, options.task.tenantId, 'Deliverable Requirement and Task');
    invariant(
      input.taskDefinitionId === options.task.id,
      'Deliverable Requirement must reference the supplied Task.'
    );
    invariant(
      options.process?.id === options.task.processDefinitionId,
      'Deliverable Requirement Task must belong to the supplied Process.'
    );
  } else {
    invariant(
      !input.taskDefinitionId,
      'Deliverable Requirement cannot reference an unsupplied Task.'
    );
  }

  if (options.deployment) {
    assertSameTenant(input.tenantId, options.deployment.tenantId, 'Deliverable Requirement and deployment');
    invariant(
      input.functionalDeploymentId === options.deployment.id,
      'Deliverable Requirement must reference the supplied Functional Deployment.'
    );
    invariant(
      options.deployment.contextObjectId === context.id ||
        options.deployment.contextType === 'TENANT' ||
        options.deployment.contextType === 'ORGANISATION',
      'Deliverable Requirement context must be compatible with its Functional Deployment.'
    );
  } else {
    invariant(
      !input.functionalDeploymentId,
      'Deliverable Requirement cannot reference an unsupplied Functional Deployment.'
    );
  }

  if (options.sourceRequirement) {
    assertSameTenant(input.tenantId, options.sourceRequirement.tenantId, 'Deliverable Requirement and source Requirement');
    invariant(
      input.sourceRequirementObjectId === options.sourceRequirement.id,
      'Deliverable Requirement must reference the supplied source Requirement.'
    );
    if (input.sourceRequirementVersion !== undefined) {
      assertNonEmpty(input.sourceRequirementVersion, 'Source Requirement version');
    }
  } else {
    invariant(
      !input.sourceRequirementObjectId && !input.sourceRequirementVersion,
      'Deliverable Requirement cannot reference an unsupplied source Requirement.'
    );
  }

  return Object.freeze({
    ...input,
    requiredRepresentationTypes: Object.freeze([...input.requiredRepresentationTypes])
  });
}

export function createDeliverableItem(
  input: DeliverableItem,
  object: CanonicalObjectIdentity,
  requirement: DeliverableRequirement,
  context: CanonicalObjectIdentity,
  deployment?: FunctionalDeployment
): DeliverableItem {
  assertSameTenant(input.tenantId, object.tenantId, 'Deliverable Item and canonical object');
  assertSameTenant(input.tenantId, requirement.tenantId, 'Deliverable Item and Requirement');
  assertSameTenant(input.tenantId, context.tenantId, 'Deliverable Item and context');
  invariant(
    object.objectType === 'DELIVERABLE_ITEM',
    'Deliverable Item canonical object must use objectType DELIVERABLE_ITEM.'
  );
  invariant(input.canonicalObjectId === object.id, 'Deliverable Item must reference the supplied canonical object.');
  invariant(input.requirementId === requirement.id, 'Deliverable Item must reference the supplied Requirement.');
  invariant(input.contextObjectId === context.id, 'Deliverable Item must reference the supplied context.');
  invariant(
    requirement.contextObjectId === context.id,
    'Deliverable Item context must match its Requirement context.'
  );
  invariant(requirement.status === 'ACTIVE', 'Deliverable Item requires an ACTIVE Requirement.');
  invariant(input.status === 'PLANNED', 'New Deliverable Item must start PLANNED.');
  invariant(
    input.deliverableType === requirement.deliverableType,
    'Deliverable Item type must match its Requirement.'
  );
  assertNonEmpty(input.code, 'Deliverable Item code');
  assertNonEmpty(input.title, 'Deliverable Item title');

  if (input.plannedAt) assertDate(input.plannedAt, 'Deliverable Item plannedAt');
  if (input.forecastAt) assertDate(input.forecastAt, 'Deliverable Item forecastAt');
  invariant(
    !input.actualAt &&
      !input.governedOutputObjectId &&
      !input.governedOutputVersion &&
      !input.configurationItemId &&
      !input.baselineId &&
      !input.linkedChangeId,
    'New Deliverable Item must not contain execution/output/configuration state.'
  );

  if (deployment) {
    assertSameTenant(input.tenantId, deployment.tenantId, 'Deliverable Item and deployment');
    invariant(
      input.functionalDeploymentId === deployment.id,
      'Deliverable Item must reference the supplied Functional Deployment.'
    );
    invariant(
      requirement.functionalDeploymentId === undefined ||
        requirement.functionalDeploymentId === deployment.id,
      'Deliverable Item deployment must be compatible with its Requirement.'
    );
  } else {
    invariant(
      !input.functionalDeploymentId,
      'Deliverable Item cannot reference an unsupplied Functional Deployment.'
    );
  }

  return Object.freeze({ ...input });
}

export function startDeliverable(current: DeliverableItem): DeliverableItem {
  invariant(current.status === 'PLANNED', 'Only a PLANNED Deliverable Item can start.');
  return Object.freeze({ ...current, status: 'IN_PROGRESS' });
}

export function bindDeliverableOutput(
  current: DeliverableItem,
  output: CanonicalObjectIdentity,
  outputVersion?: string
): DeliverableItem {
  assertSameTenant(current.tenantId, output.tenantId, 'Deliverable Item and governed output');
  invariant(
    ['IN_PROGRESS', 'REWORK'].includes(current.status),
    'Governed output can only be bound while Deliverable Item is IN_PROGRESS or REWORK.'
  );
  if (outputVersion !== undefined) assertNonEmpty(outputVersion, 'Governed output version');

  return Object.freeze({
    ...current,
    governedOutputObjectId: output.id,
    ...(outputVersion !== undefined ? { governedOutputVersion: outputVersion } : {})
  });
}

export function submitDeliverableForReview(
  current: DeliverableItem
): DeliverableItem {
  invariant(
    current.status === 'IN_PROGRESS' || current.status === 'REWORK',
    'Only IN_PROGRESS or REWORK Deliverable Item can enter review.'
  );
  invariant(
    Boolean(current.governedOutputObjectId),
    'Deliverable Item requires a governed output before review.'
  );
  return Object.freeze({ ...current, status: 'IN_REVIEW' });
}

export function createDeliverableResponsibility(
  input: DeliverableResponsibility,
  item: DeliverableItem,
  principal: Person | Position | OrganisationUnit | Organisation
): DeliverableResponsibility {
  assertSameTenant(input.tenantId, item.tenantId, 'Deliverable Responsibility and Item');
  assertSameTenant(input.tenantId, principal.tenantId, 'Deliverable Responsibility and principal');
  invariant(input.deliverableItemId === item.id, 'Deliverable Responsibility must reference the supplied Item.');
  invariant(input.principalId === principal.id, 'Deliverable Responsibility must reference the supplied principal.');
  assertDateOrder(input.effectiveFrom, input.effectiveTo, 'Deliverable Responsibility');

  const typeMatches =
    (input.principalType === 'PERSON' && 'legalName' in principal && 'partyId' in principal) ||
    (input.principalType === 'POSITION' && 'title' in principal && 'organisationUnitId' in principal) ||
    (input.principalType === 'ORGANISATION_UNIT' && 'organisationId' in principal && 'code' in principal) ||
    (input.principalType === 'ORGANISATION' && 'legalName' in principal && !('preferredName' in principal));
  invariant(typeMatches, 'Deliverable Responsibility principalType must match the supplied principal.');

  return Object.freeze({ ...input });
}

export function createDeliverableReview(
  input: DeliverableReview,
  item: DeliverableItem,
  subject: CanonicalObjectIdentity,
  reviewer: Person
): DeliverableReview {
  assertSameTenant(input.tenantId, reviewer.tenantId, 'Deliverable Review and reviewer');
  invariant(input.deliverableItemId === item.id, 'Deliverable Review must reference the supplied Item.');
  invariant(item.status === 'IN_REVIEW', 'Deliverable Review requires an Item IN_REVIEW.');
  invariant(input.reviewerPersonId === reviewer.id, 'Deliverable Review must reference the supplied reviewer.');
  assertExactSubject(item, subject, input.subjectVersion, 'Deliverable Review');
  assertDate(input.reviewedAt, 'Deliverable Review reviewedAt');

  if (input.outcome === 'COMMENTS' || input.outcome === 'REVISE' || input.outcome === 'REJECTED') {
    invariant(Boolean(input.comments?.trim()), 'Review comments are required for this outcome.');
  }
  return Object.freeze({ ...input });
}

export function createDeliverableApproval(
  input: DeliverableApproval,
  item: DeliverableItem,
  subject: CanonicalObjectIdentity,
  decision: Decision
): DeliverableApproval {
  invariant(input.deliverableItemId === item.id, 'Deliverable Approval must reference the supplied Item.');
  assertSameTenant(input.tenantId, decision.tenantId, 'Deliverable Approval and Decision');
  invariant(item.status === 'IN_REVIEW', 'Deliverable Approval requires an Item IN_REVIEW.');
  invariant(input.decisionId === decision.id, 'Deliverable Approval must reference the supplied Decision.');
  assertExactSubject(item, subject, input.subjectVersion, 'Deliverable Approval');
  invariant(
    decision.subjectObjectId === subject.id &&
      decision.subjectVersion === input.subjectVersion,
    'Approval Decision must reference the exact approved subject/version.'
  );
  invariant(decision.outcome === 'APPROVED', 'Deliverable Approval requires an APPROVED Decision.');
  assertDate(input.approvedAt, 'Deliverable Approval approvedAt');
  invariant(
    input.approvedAt === decision.decidedAt,
    'Deliverable Approval approvedAt must equal the immutable Decision timestamp.'
  );
  return Object.freeze({ ...input });
}

export function markDeliverableApproved(
  current: DeliverableItem,
  approval: DeliverableApproval
): DeliverableItem {
  invariant(current.status === 'IN_REVIEW', 'Only an IN_REVIEW Deliverable Item can become APPROVED.');
  invariant(approval.deliverableItemId === current.id, 'Approval must belong to the Deliverable Item.');
  return Object.freeze({ ...current, status: 'APPROVED' });
}

export function createTransmittal(
  input: Transmittal,
  item: DeliverableItem,
  subject: CanonicalObjectIdentity,
  issuer: Person
): Transmittal {
  assertSameTenant(input.tenantId, issuer.tenantId, 'Transmittal and issuer');
  invariant(input.deliverableItemId === item.id, 'Transmittal must reference the supplied Deliverable Item.');
  invariant(item.status === 'APPROVED', 'Only an APPROVED Deliverable Item can be issued.');
  invariant(input.issuedByPersonId === issuer.id, 'Transmittal must reference the supplied issuer.');
  assertExactSubject(item, subject, input.subjectVersion, 'Transmittal');
  assertNonEmpty(input.issueReference, 'Transmittal issueReference');
  assertNonEmpty(input.issuePurpose, 'Transmittal issuePurpose');
  assertDate(input.issuedAt, 'Transmittal issuedAt');
  return Object.freeze({ ...input });
}

export function markDeliverableIssued(
  current: DeliverableItem,
  transmittal: Transmittal
): DeliverableItem {
  invariant(current.status === 'APPROVED', 'Only an APPROVED Deliverable Item can become ISSUED.');
  invariant(transmittal.deliverableItemId === current.id, 'Transmittal must belong to the Deliverable Item.');
  return Object.freeze({ ...current, status: 'ISSUED' });
}

export function createTransmittalRecipient(
  input: TransmittalRecipient,
  transmittal: Transmittal,
  recipient: Party
): TransmittalRecipient {
  assertSameTenant(input.tenantId, transmittal.tenantId, 'Transmittal Recipient and Transmittal');
  assertSameTenant(input.tenantId, recipient.tenantId, 'Transmittal Recipient and Party');
  invariant(input.transmittalId === transmittal.id, 'Transmittal Recipient must reference the supplied Transmittal.');
  invariant(input.recipientPartyId === recipient.id, 'Transmittal Recipient must reference the supplied Party.');
  if (input.dueAt) assertDate(input.dueAt, 'Transmittal Recipient dueAt');
  return Object.freeze({ ...input });
}

export function createRecipientResponse(
  input: RecipientResponse,
  recipient: TransmittalRecipient,
  responder?: Person
): RecipientResponse {
  assertSameTenant(input.tenantId, recipient.tenantId, 'Recipient Response and Transmittal Recipient');
  invariant(
    input.transmittalRecipientId === recipient.id,
    'Recipient Response must reference the supplied Transmittal Recipient.'
  );
  assertDate(input.respondedAt, 'Recipient Response respondedAt');

  if (responder) {
    assertSameTenant(input.tenantId, responder.tenantId, 'Recipient Response and responder');
    invariant(input.responderPersonId === responder.id, 'Recipient Response must reference the supplied responder.');
  } else {
    invariant(!input.responderPersonId, 'Recipient Response cannot reference an unsupplied responder.');
  }

  if (
    input.outcome === 'ACCEPTED_WITH_COMMENTS' ||
    input.outcome === 'REVISE' ||
    input.outcome === 'REJECTED'
  ) {
    invariant(Boolean(input.comments?.trim()), 'Recipient response comments are required for this outcome.');
  }

  return Object.freeze({ ...input });
}

export function markDeliverableAccepted(
  current: DeliverableItem,
  requirement: DeliverableRequirement,
  recipients: ReadonlyArray<TransmittalRecipient>,
  responses: ReadonlyArray<RecipientResponse>
): DeliverableItem {
  invariant(current.status === 'ISSUED', 'Only an ISSUED Deliverable Item can become ACCEPTED.');
  invariant(requirement.id === current.requirementId, 'Requirement must belong to the Deliverable Item.');
  invariant(requirement.acceptanceRequired, 'Requirement does not require acceptance.');

  const responsesByRecipient = new Map(
    responses.map((response) => [response.transmittalRecipientId, response])
  );
  const mandatoryRecipients = recipients.filter((recipient) => recipient.responseRequired);
  invariant(mandatoryRecipients.length > 0, 'Acceptance requires at least one response-required recipient.');

  for (const recipient of mandatoryRecipients) {
    const response = responsesByRecipient.get(recipient.id);
    invariant(Boolean(response), 'All response-required recipients must respond before acceptance.');
    invariant(
      response?.outcome === 'ACCEPTED' ||
        response?.outcome === 'ACCEPTED_WITH_COMMENTS' ||
        response?.outcome === 'NO_OBJECTION',
      'All required recipient responses must be accepting outcomes.'
    );
  }

  return Object.freeze({ ...current, status: 'ACCEPTED' });
}

export function createDeliverableRework(
  input: DeliverableRework,
  item: DeliverableItem,
  previousSubject: CanonicalObjectIdentity
): DeliverableRework {
  assertSameTenant(input.tenantId, item.tenantId, 'Deliverable Rework and Item');
  invariant(input.deliverableItemId === item.id, 'Deliverable Rework must reference the supplied Item.');
  invariant(
    ['IN_REVIEW', 'ISSUED', 'ACCEPTED'].includes(item.status),
    'Deliverable Rework must arise from reviewed, issued or accepted work.'
  );
  invariant(
    input.previousSubjectObjectId === previousSubject.id,
    'Deliverable Rework must reference the supplied previous subject.'
  );
  assertSameTenant(input.tenantId, previousSubject.tenantId, 'Deliverable Rework and previous subject');
  invariant(
    item.governedOutputObjectId === previousSubject.id &&
      item.governedOutputVersion === input.previousSubjectVersion,
    'Deliverable Rework must preserve the exact previous governed output version.'
  );
  assertNonEmpty(input.triggerId, 'Deliverable Rework triggerId');
  assertNonEmpty(input.reason, 'Deliverable Rework reason');
  assertDate(input.createdAt, 'Deliverable Rework createdAt');
  return Object.freeze({ ...input });
}

export function markDeliverableRework(
  current: DeliverableItem,
  rework: DeliverableRework
): DeliverableItem {
  invariant(rework.deliverableItemId === current.id, 'Rework must belong to the Deliverable Item.');
  invariant(
    ['IN_REVIEW', 'ISSUED', 'ACCEPTED'].includes(current.status),
    'Only reviewed, issued or accepted Deliverable Items can enter REWORK.'
  );
  return Object.freeze({ ...current, status: 'REWORK' });
}

export function closeDeliverable(
  current: DeliverableItem,
  requirement: DeliverableRequirement,
  actualAt: string
): DeliverableItem {
  invariant(requirement.id === current.requirementId, 'Requirement must belong to the Deliverable Item.');
  const closable = requirement.acceptanceRequired
    ? current.status === 'ACCEPTED'
    : current.status === 'ISSUED' || current.status === 'ACCEPTED';
  invariant(closable, 'Deliverable Item has not reached the state required for closure.');
  assertDate(actualAt, 'Deliverable Item actualAt');
  return Object.freeze({ ...current, status: 'CLOSED', actualAt });
}

export function createDeliverableConsequence(
  input: DeliverableConsequence,
  item: DeliverableItem,
  target?: CanonicalObjectIdentity
): DeliverableConsequence {
  assertSameTenant(input.tenantId, item.tenantId, 'Deliverable Consequence and Item');
  invariant(input.deliverableItemId === item.id, 'Deliverable Consequence must reference the supplied Item.');
  assertNonEmpty(input.consequenceType, 'Deliverable Consequence type');
  invariant(input.status === 'PENDING', 'New Deliverable Consequence must start PENDING.');

  if (target) {
    assertSameTenant(input.tenantId, target.tenantId, 'Deliverable Consequence and target');
    invariant(input.targetObjectId === target.id, 'Deliverable Consequence must reference the supplied target.');
  } else {
    invariant(!input.targetObjectId, 'Deliverable Consequence cannot reference an unsupplied target.');
  }

  if (input.targetVersion !== undefined) {
    invariant(Boolean(input.targetObjectId), 'Deliverable Consequence targetVersion requires targetObjectId.');
    assertNonEmpty(input.targetVersion, 'Deliverable Consequence targetVersion');
  }
  invariant(!input.appliedAt, 'New Deliverable Consequence must not contain appliedAt.');
  return Object.freeze({ ...input });
}

export function markDeliverableConsequenceApplied(
  current: DeliverableConsequence,
  appliedAt: string
): DeliverableConsequence {
  invariant(current.status === 'PENDING', 'Only a PENDING Deliverable Consequence can be applied.');
  assertDate(appliedAt, 'Deliverable Consequence appliedAt');
  return Object.freeze({ ...current, status: 'APPLIED', appliedAt });
}
