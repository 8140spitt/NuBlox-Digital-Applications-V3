import { invariant } from './errors.js';
import type {
  AuthorityGrant,
  CanonicalObjectIdentity,
  Person
} from './model.js';
import type {
  BusinessEvent,
  Decision,
  EvidenceRecord,
  LifecycleDefinition,
  LifecycleStateDefinition,
  LifecycleTransitionDefinition,
  ObjectLifecycleState
} from './control.js';

function assertSameTenant(expected: string, actual: string, label: string) {
  invariant(expected === actual, `${label} must belong to the same tenant.`);
}

function assertNonEmpty(value: string, label: string) {
  invariant(Boolean(value.trim()), `${label} must not be empty.`);
}

function assertIsoDate(value: string, label: string) {
  invariant(Number.isFinite(Date.parse(value)), `${label} must be a valid date/time.`);
}

export function createLifecycleDefinition(input: LifecycleDefinition): LifecycleDefinition {
  assertNonEmpty(input.code, 'Lifecycle code');
  assertNonEmpty(input.name, 'Lifecycle name');
  assertNonEmpty(input.objectType, 'Lifecycle objectType');
  return Object.freeze({ ...input });
}

export function createLifecycleStateDefinition(
  input: LifecycleStateDefinition,
  definition: LifecycleDefinition
): LifecycleStateDefinition {
  assertSameTenant(input.tenantId, definition.tenantId, 'Lifecycle State and definition');
  invariant(
    input.lifecycleDefinitionId === definition.id,
    'Lifecycle State must reference the supplied Lifecycle Definition.'
  );
  assertNonEmpty(input.code, 'Lifecycle State code');
  assertNonEmpty(input.name, 'Lifecycle State name');
  return Object.freeze({ ...input });
}

export function createLifecycleTransitionDefinition(
  input: LifecycleTransitionDefinition,
  definition: LifecycleDefinition,
  fromState: LifecycleStateDefinition,
  toState: LifecycleStateDefinition
): LifecycleTransitionDefinition {
  assertSameTenant(input.tenantId, definition.tenantId, 'Lifecycle Transition and definition');
  assertSameTenant(input.tenantId, fromState.tenantId, 'Lifecycle Transition and source state');
  assertSameTenant(input.tenantId, toState.tenantId, 'Lifecycle Transition and target state');
  invariant(
    input.lifecycleDefinitionId === definition.id,
    'Lifecycle Transition must reference the supplied Lifecycle Definition.'
  );
  invariant(
    fromState.lifecycleDefinitionId === definition.id &&
      toState.lifecycleDefinitionId === definition.id,
    'Lifecycle Transition states must belong to the supplied Lifecycle Definition.'
  );
  invariant(input.fromStateId === fromState.id, 'fromStateId must reference the supplied source state.');
  invariant(input.toStateId === toState.id, 'toStateId must reference the supplied target state.');
  invariant(fromState.id !== toState.id, 'Lifecycle Transition must change state.');
  assertNonEmpty(input.code, 'Lifecycle Transition code');
  assertNonEmpty(input.name, 'Lifecycle Transition name');

  if (input.requiresDecision) {
    invariant(
      Boolean(input.requiredDecisionType?.trim()),
      'Decision-controlled transition must specify requiredDecisionType.'
    );
    invariant(
      Boolean(input.requiredDecisionOutcome?.trim()),
      'Decision-controlled transition must specify requiredDecisionOutcome.'
    );
  } else {
    invariant(
      !input.requiredDecisionType && !input.requiredDecisionOutcome,
      'Transition without a Decision requirement must not specify Decision constraints.'
    );
  }

  return Object.freeze({ ...input });
}

export function createDecision(
  input: Decision,
  subject: CanonicalObjectIdentity,
  decider: Person,
  authorityGrant?: AuthorityGrant
): Decision {
  assertSameTenant(input.tenantId, subject.tenantId, 'Decision and subject');
  assertSameTenant(input.tenantId, decider.tenantId, 'Decision and decider');
  invariant(input.subjectObjectId === subject.id, 'Decision must reference the supplied subject.');
  invariant(input.deciderPersonId === decider.id, 'Decision must reference the supplied decider.');
  assertNonEmpty(input.decisionType, 'Decision type');
  assertNonEmpty(input.outcome, 'Decision outcome');
  assertNonEmpty(input.reason, 'Decision reason');
  assertIsoDate(input.decidedAt, 'Decision decidedAt');

  if (input.subjectVersion !== undefined) {
    assertNonEmpty(input.subjectVersion, 'Decision subjectVersion');
  }

  if (authorityGrant) {
    assertSameTenant(input.tenantId, authorityGrant.tenantId, 'Decision and Authority Grant');
    invariant(
      input.authorityGrantId === authorityGrant.id,
      'Decision authorityGrantId must reference the supplied Authority Grant.'
    );
    invariant(authorityGrant.status === 'ACTIVE', 'Decision Authority Grant must be active.');
  } else {
    invariant(
      !input.authorityGrantId,
      'Decision cannot reference an Authority Grant that was not supplied.'
    );
  }

  return Object.freeze({ ...input });
}

export function initialiseObjectLifecycle(
  input: ObjectLifecycleState,
  object: CanonicalObjectIdentity,
  definition: LifecycleDefinition,
  state: LifecycleStateDefinition
): ObjectLifecycleState {
  assertSameTenant(input.tenantId, object.tenantId, 'Lifecycle state and object');
  assertSameTenant(input.tenantId, definition.tenantId, 'Lifecycle state and definition');
  assertSameTenant(input.tenantId, state.tenantId, 'Lifecycle state and state definition');
  invariant(input.canonicalObjectId === object.id, 'Lifecycle state must reference the supplied object.');
  invariant(
    input.lifecycleDefinitionId === definition.id,
    'Lifecycle state must reference the supplied Lifecycle Definition.'
  );
  invariant(
    definition.objectType === object.objectType,
    'Lifecycle Definition objectType must match the canonical object type.'
  );
  invariant(definition.status === 'ACTIVE', 'Lifecycle Definition must be active.');
  invariant(state.status === 'ACTIVE', 'Initial Lifecycle State must be active.');
  invariant(
    input.lifecycleStateId === state.id,
    'Lifecycle state must reference the supplied Lifecycle State Definition.'
  );
  invariant(state.lifecycleDefinitionId === definition.id, 'Initial state must belong to the Lifecycle Definition.');
  invariant(state.initial, 'Object Lifecycle must begin in an initial state.');
  invariant(input.sequence === 1, 'Initial Object Lifecycle state sequence must be 1.');
  invariant(!input.transitionId, 'Initial Object Lifecycle state must not reference a transition.');
  invariant(!input.decisionId, 'Initial Object Lifecycle state must not reference a Decision.');
  assertIsoDate(input.effectiveAt, 'Lifecycle effectiveAt');
  return Object.freeze({ ...input });
}

export function transitionObjectLifecycle(
  next: ObjectLifecycleState,
  current: ObjectLifecycleState,
  transition: LifecycleTransitionDefinition,
  fromState: LifecycleStateDefinition,
  toState: LifecycleStateDefinition,
  decision?: Decision
): ObjectLifecycleState {
  assertSameTenant(next.tenantId, current.tenantId, 'Lifecycle transition states');
  assertSameTenant(next.tenantId, transition.tenantId, 'Lifecycle state and transition');
  invariant(next.id === current.id, 'Lifecycle current-state identity must remain stable.');
  invariant(
    next.canonicalObjectId === current.canonicalObjectId,
    'Lifecycle transition must remain on the same canonical object.'
  );
  invariant(
    next.lifecycleDefinitionId === current.lifecycleDefinitionId,
    'Lifecycle transition must remain in the same Lifecycle Definition.'
  );
  invariant(
    transition.lifecycleDefinitionId === current.lifecycleDefinitionId,
    'Transition must belong to the current Lifecycle Definition.'
  );
  invariant(current.lifecycleStateId === fromState.id, 'Current Lifecycle state must match transition source.');
  invariant(transition.fromStateId === fromState.id, 'Transition source must match supplied source state.');
  invariant(transition.toStateId === toState.id, 'Transition target must match supplied target state.');
  invariant(next.lifecycleStateId === toState.id, 'Next Lifecycle state must match transition target.');
  invariant(next.transitionId === transition.id, 'Next Lifecycle state must reference the transition.');
  invariant(next.sequence === current.sequence + 1, 'Lifecycle sequence must increase by exactly one.');
  invariant(transition.status === 'ACTIVE', 'Lifecycle Transition must be active.');
  invariant(fromState.status === 'ACTIVE' && toState.status === 'ACTIVE', 'Lifecycle states must be active.');
  invariant(!fromState.terminal, 'A terminal Lifecycle state cannot transition.');
  assertIsoDate(next.effectiveAt, 'Lifecycle effectiveAt');

  if (transition.requiresDecision) {
    invariant(Boolean(decision), 'Lifecycle Transition requires a Decision.');
    invariant(next.decisionId === decision?.id, 'Next Lifecycle state must reference the controlling Decision.');
    invariant(
      decision?.subjectObjectId === current.canonicalObjectId,
      'Decision subject must be the Lifecycle object.'
    );
    invariant(
      decision?.subjectVersion === current.subjectVersion,
      'Decision must reference the exact current subject version.'
    );
    invariant(
      decision?.decisionType === transition.requiredDecisionType,
      'Decision type does not satisfy Lifecycle Transition.'
    );
    invariant(
      decision?.outcome === transition.requiredDecisionOutcome,
      'Decision outcome does not satisfy Lifecycle Transition.'
    );
  } else {
    invariant(!decision && !next.decisionId, 'Uncontrolled Lifecycle Transition must not reference a Decision.');
  }

  return Object.freeze({ ...next });
}

export function createBusinessEvent(
  input: BusinessEvent,
  subject?: CanonicalObjectIdentity,
  actor?: Person
): BusinessEvent {
  assertNonEmpty(input.eventType, 'Business Event type');
  assertNonEmpty(input.aggregateType, 'Business Event aggregateType');
  assertNonEmpty(input.aggregateId, 'Business Event aggregateId');
  assertIsoDate(input.occurredAt, 'Business Event occurredAt');

  if (subject) {
    assertSameTenant(input.tenantId, subject.tenantId, 'Business Event and subject');
    invariant(input.subjectObjectId === subject.id, 'Business Event must reference the supplied subject.');
  } else {
    invariant(!input.subjectObjectId, 'Business Event cannot reference an unsupplied subject.');
  }

  if (actor) {
    assertSameTenant(input.tenantId, actor.tenantId, 'Business Event and actor');
    invariant(input.actorPersonId === actor.id, 'Business Event must reference the supplied actor.');
  } else {
    invariant(!input.actorPersonId, 'Business Event cannot reference an unsupplied actor.');
  }

  return Object.freeze({ ...input });
}

export function createEvidenceRecord(
  input: EvidenceRecord,
  subject: CanonicalObjectIdentity,
  capturedBy?: Person
): EvidenceRecord {
  assertSameTenant(input.tenantId, subject.tenantId, 'Evidence and subject');
  invariant(input.subjectObjectId === subject.id, 'Evidence must reference the supplied subject.');
  assertNonEmpty(input.evidenceType, 'Evidence type');
  assertIsoDate(input.capturedAt, 'Evidence capturedAt');

  if (input.subjectVersion !== undefined) {
    assertNonEmpty(input.subjectVersion, 'Evidence subjectVersion');
  }

  if (capturedBy) {
    assertSameTenant(input.tenantId, capturedBy.tenantId, 'Evidence and capturing Person');
    invariant(
      input.capturedByPersonId === capturedBy.id,
      'Evidence capturedByPersonId must reference the supplied Person.'
    );
  } else {
    invariant(
      !input.capturedByPersonId,
      'Evidence cannot reference a capturing Person that was not supplied.'
    );
  }

  return Object.freeze({ ...input });
}
