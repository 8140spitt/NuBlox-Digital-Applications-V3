import { invariant } from './errors.js';
import type {
  PolicyAssignment,
  EffectivePolicySet,
  PolicyDefinition,
  PolicyResolutionCandidate,
  PolicyScope
} from './policy.js';

function assertNonEmpty(value: string, label: string): void {
  invariant(Boolean(value.trim()), `${label} must not be empty.`);
}

function assertDate(value: string, label: string): number {
  const timestamp = Date.parse(value);
  invariant(Number.isFinite(timestamp), `${label} must be a valid date/time.`);
  return timestamp;
}

function assertDateOrder(from: string, to: string | undefined, label: string): void {
  const fromTime = assertDate(from, `${label} effectiveFrom`);

  if (to) {
    const toTime = assertDate(to, `${label} effectiveTo`);
    invariant(toTime >= fromTime, `${label} effectiveTo must not be earlier than effectiveFrom.`);
  }
}

export function createPolicyScope(input: PolicyScope): PolicyScope {
  assertNonEmpty(input.code, 'Policy Scope code');
  assertNonEmpty(input.name, 'Policy Scope name');

  if (input.scopeType === 'TENANT') {
    invariant(!input.scopeObjectId, 'TENANT Policy Scope must not specify scopeObjectId.');
  } else {
    invariant(Boolean(input.scopeObjectId?.trim()), 'Non-TENANT Policy Scope must specify scopeObjectId.');
  }

  invariant(
    input.parentPolicyScopeId !== input.id,
    'Policy Scope must not reference itself as parent.'
  );

  return Object.freeze({ ...input });
}

export function createPolicyDefinition(input: PolicyDefinition): PolicyDefinition {
  assertNonEmpty(input.code, 'Policy Definition code');
  assertNonEmpty(input.name, 'Policy Definition name');
  invariant(
    Number.isInteger(input.version) && input.version > 0,
    'Policy Definition version must be a positive integer.'
  );

  if (input.effectiveTo) {
    invariant(Boolean(input.effectiveFrom), 'Policy Definition effectiveTo requires effectiveFrom.');
  }

  if (input.effectiveFrom) {
    assertDateOrder(input.effectiveFrom, input.effectiveTo, 'Policy Definition');
  }

  return Object.freeze({ ...input });
}

export function createPolicyAssignment(
  input: PolicyAssignment,
  scope: PolicyScope,
  definition: PolicyDefinition
): PolicyAssignment {
  invariant(input.tenantId === scope.tenantId, 'Policy Assignment and Policy Scope must share tenant.');
  invariant(
    input.tenantId === definition.tenantId,
    'Policy Assignment and Policy Definition must share tenant.'
  );
  invariant(input.policyScopeId === scope.id, 'Policy Assignment must reference the supplied Policy Scope.');
  invariant(
    input.policyDefinitionId === definition.id,
    'Policy Assignment must reference the supplied Policy Definition.'
  );
  invariant(scope.status === 'ACTIVE', 'Policy Scope must be active.');
  invariant(definition.status === 'ACTIVE', 'Policy Definition must be active.');
  invariant(
    Number.isInteger(input.precedence) && input.precedence >= 0,
    'Policy Assignment precedence must be a non-negative integer.'
  );
  assertDateOrder(input.effectiveFrom, input.effectiveTo, 'Policy Assignment');

  return Object.freeze({ ...input });
}

export function isPolicyAssignmentEffective(
  assignment: PolicyAssignment,
  evaluatedAt: string
): boolean {
  const at = assertDate(evaluatedAt, 'Policy evaluation time');

  if (assignment.status !== 'ACTIVE') return false;
  if (assertDate(assignment.effectiveFrom, 'Policy Assignment effectiveFrom') > at) return false;
  if (
    assignment.effectiveTo &&
    assertDate(assignment.effectiveTo, 'Policy Assignment effectiveTo') < at
  ) {
    return false;
  }

  return true;
}


function policySemanticKey(candidate: PolicyResolutionCandidate): string {
  return `${candidate.definition.policyType}:${candidate.definition.code}`;
}

export function resolveEffectivePolicySet(
  candidates: ReadonlyArray<PolicyResolutionCandidate>
): EffectivePolicySet {
  const ordered = [...candidates].sort(
    (a, b) =>
      b.scopeDepth - a.scopeDepth ||
      a.assignment.precedence - b.assignment.precedence ||
      a.assignment.id.localeCompare(b.assignment.id)
  );

  const active = new Map<string, PolicyResolutionCandidate>();
  const blocked = new Map<string, PolicyResolutionCandidate>();

  for (const candidate of ordered) {
    invariant(
      Number.isInteger(candidate.scopeDepth) && candidate.scopeDepth >= 0,
      'Policy resolution scopeDepth must be a non-negative integer.'
    );
    invariant(
      candidate.assignment.tenantId === candidate.definition.tenantId,
      'Policy resolution candidate must remain tenant-bound.'
    );
    invariant(
      candidate.assignment.policyDefinitionId === candidate.definition.id,
      'Policy resolution candidate assignment must reference its Policy Definition.'
    );

    const key = policySemanticKey(candidate);

    if (candidate.assignment.assignmentMode === 'BLOCK') {
      active.delete(key);
      blocked.set(key, candidate);
      continue;
    }

    if (candidate.assignment.assignmentMode === 'OVERRIDE') {
      blocked.delete(key);
      active.set(key, candidate);
      continue;
    }

    if (!active.has(key) && !blocked.has(key)) {
      active.set(key, candidate);
    }
  }

  const bySemanticKey = (
    a: PolicyResolutionCandidate,
    b: PolicyResolutionCandidate
  ): number => policySemanticKey(a).localeCompare(policySemanticKey(b));

  return Object.freeze({
    active: Object.freeze([...active.values()].sort(bySemanticKey)),
    blocked: Object.freeze([...blocked.values()].sort(bySemanticKey))
  });
}
