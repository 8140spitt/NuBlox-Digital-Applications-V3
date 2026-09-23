import { invariant } from './errors.js';
import type {
  ClearanceGrant,
  SecurityAccessException,
  SecurityClassificationAccessEvaluation,
  SecurityClassificationAssignment,
  SecurityClassificationLevel,
  SecurityClassificationScheme,
  SecurityClearanceCandidate,
  SecurityPrincipalReference
} from './security-classification.js';

function nonEmpty(value: string, label: string): void {
  invariant(Boolean(value.trim()), `${label} must not be empty.`);
}

function timestamp(value: string, label: string): number {
  const result = Date.parse(value);
  invariant(Number.isFinite(result), `${label} must be a valid date/time.`);
  return result;
}

function period(from: string, to: string | undefined, label: string): void {
  const start = timestamp(from, `${label} effectiveFrom`);
  if (to) {
    invariant(
      timestamp(to, `${label} effectiveTo`) >= start,
      `${label} effectiveTo must not be earlier than effectiveFrom.`
    );
  }
}

function effective(
  status: 'ACTIVE' | 'INACTIVE',
  from: string,
  to: string | undefined,
  evaluatedAt: string
): boolean {
  if (status !== 'ACTIVE') return false;
  const at = timestamp(evaluatedAt, 'Security evaluation time');
  if (timestamp(from, 'Effective from') > at) return false;
  return !to || timestamp(to, 'Effective to') >= at;
}

export function createSecurityClassificationScheme(
  input: SecurityClassificationScheme
): SecurityClassificationScheme {
  nonEmpty(input.code, 'Security Classification Scheme code');
  nonEmpty(input.name, 'Security Classification Scheme name');
  return Object.freeze({ ...input });
}

export function createSecurityClassificationLevel(
  input: SecurityClassificationLevel,
  scheme: SecurityClassificationScheme
): SecurityClassificationLevel {
  invariant(input.tenantId === scheme.tenantId, 'Classification Level and Scheme must share tenant.');
  invariant(input.schemeId === scheme.id, 'Classification Level must reference the supplied Scheme.');
  invariant(scheme.status === 'ACTIVE', 'Security Classification Scheme must be active.');
  nonEmpty(input.code, 'Security Classification Level code');
  nonEmpty(input.name, 'Security Classification Level name');

  if (scheme.kind === 'ORDINAL') {
    invariant(
      Number.isInteger(input.rankOrder) && (input.rankOrder ?? -1) >= 0,
      'ORDINAL classification levels require a non-negative integer rankOrder.'
    );
  } else {
    invariant(
      input.rankOrder === undefined,
      'CATEGORICAL classification levels must not define rankOrder.'
    );
  }

  return Object.freeze({ ...input });
}

export function createSecurityClassificationAssignment(
  input: SecurityClassificationAssignment,
  level: SecurityClassificationLevel
): SecurityClassificationAssignment {
  invariant(input.tenantId === level.tenantId, 'Classification Assignment and Level must share tenant.');
  invariant(
    input.classificationLevelId === level.id,
    'Classification Assignment must reference the supplied Level.'
  );
  invariant(level.status === 'ACTIVE', 'Security Classification Level must be active.');
  period(input.effectiveFrom, input.effectiveTo, 'Classification Assignment');
  return Object.freeze({ ...input });
}

export function createClearanceGrant(
  input: ClearanceGrant,
  level: SecurityClassificationLevel,
  scheme: SecurityClassificationScheme
): ClearanceGrant {
  invariant(input.tenantId === level.tenantId, 'Clearance Grant and Level must share tenant.');
  invariant(level.schemeId === scheme.id, 'Clearance Level must belong to the supplied Scheme.');
  invariant(input.classificationLevelId === level.id, 'Clearance Grant must reference the supplied Level.');
  invariant(level.status === 'ACTIVE' && scheme.status === 'ACTIVE', 'Clearance Scheme and Level must be active.');
  nonEmpty(input.principalId, 'Clearance principal');
  nonEmpty(input.scopeType, 'Clearance scope type');

  if (input.scopeType === 'TENANT') {
    invariant(!input.scopeId, 'TENANT clearance scope must not specify scopeId.');
  } else {
    invariant(Boolean(input.scopeId?.trim()), 'Non-TENANT clearance scope requires scopeId.');
  }

  if (input.includeLowerLevels) {
    invariant(
      scheme.kind === 'ORDINAL' && level.rankOrder !== undefined,
      'includeLowerLevels is only valid for ranked ORDINAL classifications.'
    );
  }

  period(input.effectiveFrom, input.effectiveTo, 'Clearance Grant');
  return Object.freeze({ ...input });
}

export function createSecurityAccessException(
  input: SecurityAccessException,
  level: SecurityClassificationLevel
): SecurityAccessException {
  invariant(input.tenantId === level.tenantId, 'Security Access Exception and Level must share tenant.');
  invariant(
    input.classificationLevelId === level.id,
    'Security Access Exception must reference the supplied Level.'
  );
  nonEmpty(input.principalId, 'Security Access Exception principal');
  nonEmpty(input.reason, 'Security Access Exception reason');
  period(input.effectiveFrom, input.effectiveTo, 'Security Access Exception');
  return Object.freeze({ ...input });
}

function scopeMatches(
  scopeType: string,
  scopeId: string | undefined,
  targetScopeType: string,
  targetScopeId: string | undefined
): boolean {
  if (scopeType === 'TENANT') return true;
  return scopeType === targetScopeType && scopeId === targetScopeId;
}

function clearanceCovers(
  subjectLevel: SecurityClassificationLevel,
  candidate: SecurityClearanceCandidate
): boolean {
  const grant = candidate.grant;
  const grantedLevel = candidate.level;
  const scheme = candidate.scheme;

  if (subjectLevel.schemeId !== scheme.id || grantedLevel.schemeId !== scheme.id) return false;
  if (subjectLevel.id === grantedLevel.id) return true;

  return Boolean(
    grant.includeLowerLevels &&
      scheme.kind === 'ORDINAL' &&
      subjectLevel.rankOrder !== undefined &&
      grantedLevel.rankOrder !== undefined &&
      subjectLevel.rankOrder <= grantedLevel.rankOrder
  );
}

export function evaluateSecurityClassificationAccess(input: {
  assignment: SecurityClassificationAssignment;
  level: SecurityClassificationLevel;
  scheme: SecurityClassificationScheme;
  clearances: ReadonlyArray<SecurityClearanceCandidate>;
  exceptions: ReadonlyArray<SecurityAccessException>;
  principals: ReadonlyArray<SecurityPrincipalReference>;
  evaluatedAt: string;
  targetScopeType: string;
  targetScopeId?: string;
}): SecurityClassificationAccessEvaluation {
  const {
    assignment,
    level,
    scheme,
    clearances,
    exceptions,
    principals,
    evaluatedAt,
    targetScopeType,
    targetScopeId
  } = input;

  invariant(assignment.classificationLevelId === level.id, 'Assignment and Level do not match.');
  invariant(level.schemeId === scheme.id, 'Classification Level and Scheme do not match.');

  if (!effective(assignment.status, assignment.effectiveFrom, assignment.effectiveTo, evaluatedAt)) {
    return { allowed: true, reason: 'Classification Assignment is not effective at the evaluation time.' };
  }

  const isPrincipal = (principalType: string, principalId: string) =>
    principals.some(
      (principal) =>
        principal.principalType === principalType && principal.principalId === principalId
    );

  const exception = exceptions.find(
    (item) =>
      item.tenantId === assignment.tenantId &&
      isPrincipal(item.principalType, item.principalId) &&
      item.subjectObjectId === assignment.subjectObjectId &&
      item.subjectVersion === assignment.subjectVersion &&
      item.classificationLevelId === level.id &&
      effective(item.status, item.effectiveFrom, item.effectiveTo, evaluatedAt)
  );

  if (exception) {
    return {
      allowed: true,
      reason: 'An effective approved Security Access Exception applies.',
      matchedExceptionId: exception.id
    };
  }

  const clearance = clearances.find(
    (candidate) =>
      candidate.grant.tenantId === assignment.tenantId &&
      isPrincipal(candidate.grant.principalType, candidate.grant.principalId) &&
      effective(
        candidate.grant.status,
        candidate.grant.effectiveFrom,
        candidate.grant.effectiveTo,
        evaluatedAt
      ) &&
      scopeMatches(
        candidate.grant.scopeType,
        candidate.grant.scopeId,
        targetScopeType,
        targetScopeId
      ) &&
      clearanceCovers(level, candidate)
  );

  if (clearance) {
    return {
      allowed: true,
      reason: 'An effective Clearance Grant covers the classification.',
      matchedClearanceGrantId: clearance.grant.id
    };
  }

  return {
    allowed: false,
    reason: 'No effective Clearance Grant or approved Security Access Exception covers the classification.'
  };
}
