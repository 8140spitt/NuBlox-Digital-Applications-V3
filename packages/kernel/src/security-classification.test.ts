import { describe, expect, it } from 'vitest';
import {
  KernelInvariantError,
  asId,
  createClearanceGrant,
  createSecurityAccessException,
  createSecurityClassificationAssignment,
  createSecurityClassificationLevel,
  createSecurityClassificationScheme,
  evaluateSecurityClassificationAccess,
  type ClearanceGrant,
  type SecurityAccessException,
  type SecurityClassificationAssignment
} from './index.js';

const tenantId = asId<'TenantId'>('TENANT-SECURITY', 'Tenant');
const objectId = asId<'CanonicalObjectId'>('OBJ-SECURITY', 'Canonical Object');

const scheme = createSecurityClassificationScheme({
  id: asId<'SecurityClassificationSchemeId'>('SCS-1', 'Security Classification Scheme'),
  tenantId,
  code: 'CLASSIFICATION',
  name: 'Information Classification',
  kind: 'ORDINAL',
  status: 'ACTIVE'
});

const official = createSecurityClassificationLevel(
  {
    id: asId<'SecurityClassificationLevelId'>('SCL-OFFICIAL', 'Security Classification Level'),
    tenantId,
    schemeId: scheme.id,
    code: 'OFFICIAL',
    name: 'Official',
    rankOrder: 10,
    status: 'ACTIVE'
  },
  scheme
);

const sensitive = createSecurityClassificationLevel(
  {
    id: asId<'SecurityClassificationLevelId'>('SCL-SENSITIVE', 'Security Classification Level'),
    tenantId,
    schemeId: scheme.id,
    code: 'SENSITIVE',
    name: 'Sensitive',
    rankOrder: 20,
    status: 'ACTIVE'
  },
  scheme
);

const assignment: SecurityClassificationAssignment =
  createSecurityClassificationAssignment(
    {
      id: asId<'SecurityClassificationAssignmentId'>('SCA-1', 'Security Classification Assignment'),
      tenantId,
      subjectObjectId: objectId,
      subjectVersion: 'A.2',
      classificationLevelId: official.id,
      effectiveFrom: '2026-09-01T00:00:00.000Z',
      status: 'ACTIVE'
    },
    official
  );

describe('kernel security classification invariants', () => {
  it('requires ordinal levels to carry a rank', () => {
    expect(() =>
      createSecurityClassificationLevel(
        {
          id: asId<'SecurityClassificationLevelId'>('SCL-BAD', 'Security Classification Level'),
          tenantId,
          schemeId: scheme.id,
          code: 'BAD',
          name: 'Bad',
          status: 'ACTIVE'
        },
        scheme
      )
    ).toThrow(KernelInvariantError);
  });

  it('allows a higher ranked clearance to cover a lower classified level', () => {
    const grant: ClearanceGrant = createClearanceGrant(
      {
        id: asId<'ClearanceGrantId'>('CLR-1', 'Clearance Grant'),
        tenantId,
        principalType: 'PERSON',
        principalId: 'PERSON-1',
        classificationLevelId: sensitive.id,
        includeLowerLevels: true,
        scopeType: 'TENANT',
        effectiveFrom: '2026-09-01T00:00:00.000Z',
        status: 'ACTIVE'
      },
      sensitive,
      scheme
    );

    const result = evaluateSecurityClassificationAccess({
      assignment,
      level: official,
      scheme,
      clearances: [{ grant, level: sensitive, scheme }],
      exceptions: [],
      evaluatedAt: '2026-09-23T12:00:00.000Z',
      targetScopeType: 'PROJECT',
      targetScopeId: 'PROJECT-1'
    });

    expect(result.allowed).toBe(true);
    expect(result.matchedClearanceGrantId).toBe(grant.id);
  });

  it('denies access when no clearance or exception covers the classification', () => {
    const result = evaluateSecurityClassificationAccess({
      assignment,
      level: official,
      scheme,
      clearances: [],
      exceptions: [],
      evaluatedAt: '2026-09-23T12:00:00.000Z',
      targetScopeType: 'PROJECT',
      targetScopeId: 'PROJECT-1'
    });

    expect(result.allowed).toBe(false);
  });

  it('permits an exact-subject approved exception while keeping it separate from clearance', () => {
    const exception: SecurityAccessException = createSecurityAccessException(
      {
        id: asId<'SecurityAccessExceptionId'>('SAE-1', 'Security Access Exception'),
        tenantId,
        subjectObjectId: objectId,
        subjectVersion: 'A.2',
        principalType: 'PERSON',
        principalId: 'PERSON-1',
        classificationLevelId: official.id,
        approvalDecisionId: asId<'DecisionId'>('DEC-1', 'Decision'),
        reason: 'Approved exceptional project need.',
        effectiveFrom: '2026-09-20T00:00:00.000Z',
        effectiveTo: '2026-09-30T00:00:00.000Z',
        status: 'ACTIVE'
      },
      official
    );

    const result = evaluateSecurityClassificationAccess({
      assignment,
      level: official,
      scheme,
      clearances: [],
      exceptions: [exception],
      evaluatedAt: '2026-09-23T12:00:00.000Z',
      targetScopeType: 'PROJECT',
      targetScopeId: 'PROJECT-1'
    });

    expect(result.allowed).toBe(true);
    expect(result.matchedExceptionId).toBe(exception.id);
  });
});
