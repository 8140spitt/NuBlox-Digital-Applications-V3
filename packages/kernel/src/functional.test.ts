import { describe, expect, it } from 'vitest';
import {
  KernelInvariantError,
  asId,
  createCompetenceEvidence,
  createCompetenceRequirement,
  createDeploymentAssignment,
  createDeploymentCapacity,
  createDeploymentGateResult,
  createFunctionDefinition,
  createFunctionGovernanceVersion,
  createFunctionalActivityDefinition,
  createFunctionalDeployment,
  createFunctionJobProfileParticipation,
  createProcessDefinition,
  createResponsibilityScope,
  createSubFunctionDefinition,
  createTaskDefinition,
  publishFunctionGovernanceVersion,
  retireFunctionGovernanceVersion,
  type CanonicalObjectIdentity,
  type FunctionDefinition,
  type JobProfile,
  type Organisation,
  type OrganisationUnit,
  type Person,
  type Position
} from './index.js';

const tenantId = asId<'TenantId'>('TENANT-FUNCTIONAL', 'Tenant');

const f01: FunctionDefinition = createFunctionDefinition({
  id: asId<'FunctionId'>('F01', 'Function'),
  code: 'F01',
  name: 'Strategy & Enterprise Planning',
  status: 'ACTIVE'
});

const f01_01 = createSubFunctionDefinition(
  {
    id: asId<'SubFunctionId'>('F01.01', 'Sub-function'),
    functionId: f01.id,
    code: 'F01.01',
    name: 'Vision & purpose',
    sequence: 1,
    status: 'ACTIVE'
  },
  f01
);

const activity = createFunctionalActivityDefinition(
  {
    id: asId<'FunctionalActivityId'>('F01.01.A001', 'Functional Activity'),
    subFunctionId: f01_01.id,
    name: 'Define purpose',
    sequence: 1,
    status: 'ACTIVE'
  },
  f01_01
);

const person: Person = {
  id: asId<'PersonId'>('PERSON-FUNCTIONAL', 'Person'),
  tenantId,
  partyId: asId<'PartyId'>('PARTY-FUNCTIONAL', 'Party'),
  legalName: 'Functional Owner',
  status: 'ACTIVE'
};

const organisation: Organisation = {
  id: asId<'OrganisationId'>('ORG-FUNCTIONAL', 'Organisation'),
  tenantId,
  partyId: asId<'PartyId'>('PARTY-ORG-FUNCTIONAL', 'Party'),
  legalName: 'Functional Organisation',
  status: 'ACTIVE'
};

const unit: OrganisationUnit = {
  id: asId<'OrganisationUnitId'>('UNIT-FUNCTIONAL', 'Organisation Unit'),
  tenantId,
  organisationId: organisation.id,
  code: 'STRATEGY',
  name: 'Strategy',
  status: 'ACTIVE'
};

const platformJob: JobProfile = {
  id: asId<'JobProfileId'>('JOB-STRATEGY-DIRECTOR', 'Job Profile'),
  catalogueScope: 'PLATFORM',
  code: 'STRATEGY_DIRECTOR',
  name: 'Strategy Director',
  status: 'ACTIVE'
};

const position: Position = {
  id: asId<'PositionId'>('POS-FUNCTIONAL', 'Position'),
  tenantId,
  organisationUnitId: unit.id,
  jobProfileId: platformJob.id,
  code: 'STRATEGY-DIR-01',
  title: 'Strategy Director',
  status: 'ACTIVE'
};

const project: CanonicalObjectIdentity = {
  id: asId<'CanonicalObjectId'>('PROJECT-FUNCTIONAL', 'Canonical Object'),
  tenantId,
  objectType: 'PROJECT',
  stableKey: 'PROJECT-001',
  createdAt: '2026-09-20T00:00:00.000Z'
};

describe('functional framework and deployment invariants', () => {
  it('keeps stable Function, Sub-function and canonical Activity identities', () => {
    expect(f01.id).toBe('F01');
    expect(f01_01.functionId).toBe(f01.id);
    expect(activity.subFunctionId).toBe(f01_01.id);

    expect(() =>
      createFunctionDefinition({
        ...f01,
        id: asId<'FunctionId'>('FUNCTION-1', 'Function')
      })
    ).toThrow(KernelInvariantError);

    expect(() =>
      createSubFunctionDefinition(
        {
          ...f01_01,
          id: asId<'SubFunctionId'>('F02.01', 'Sub-function'),
          code: 'F02.01'
        },
        f01
      )
    ).toThrow(KernelInvariantError);
  });

  it('keeps Sub-function separate from Process and Activity separate from Task', () => {
    const process = createProcessDefinition(
      {
        id: asId<'ProcessDefinitionId'>('PROC-STRATEGY-DIRECTION', 'Process Definition'),
        tenantId,
        functionId: f01.id,
        subFunctionId: f01_01.id,
        code: 'STRATEGY_DIRECTION',
        name: 'Strategy Direction',
        purpose: 'Establish and govern enterprise direction.',
        status: 'ACTIVE'
      },
      f01,
      f01_01
    );

    const task = createTaskDefinition(
      {
        id: asId<'TaskDefinitionId'>('TASK-DEFINE-PURPOSE', 'Task Definition'),
        tenantId,
        processDefinitionId: process.id,
        functionalActivityId: activity.id,
        code: 'DEFINE_PURPOSE',
        name: 'Define enterprise purpose',
        sequence: 1,
        status: 'ACTIVE'
      },
      process,
      activity
    );

    expect(process.id).not.toBe(f01_01.id);
    expect(task.id).not.toBe(activity.id);
    expect(task.functionalActivityId).toBe(activity.id);
  });

  it('versions Function governance explicitly through draft, published and retired states', () => {
    const draft = createFunctionGovernanceVersion(
      {
        id: asId<'FunctionGovernanceVersionId'>('F01-GOV-V1', 'Function Governance Version'),
        tenantId,
        functionId: f01.id,
        version: 1,
        status: 'DRAFT',
        purpose: 'Govern enterprise strategy and planning.',
        mandate: 'Set direction, plans and performance expectations.',
        scopeIn: ['Enterprise strategy', 'Business planning'],
        scopeOut: ['Project execution'],
        accountableOwnerType: 'POSITION',
        accountableOwnerId: position.id,
        policyReferences: ['POL-STRATEGY-001'],
        standardReferences: [],
        procedureReferences: ['PROC-STRATEGY-001'],
        assuranceRequirements: ['Quarterly strategy review'],
        performanceMeasures: ['Strategy execution rate']
      },
      f01,
      position
    );

    const published = publishFunctionGovernanceVersion(
      draft,
      '2026-10-01T00:00:00.000Z'
    );
    expect(published.status).toBe('PUBLISHED');

    const retired = retireFunctionGovernanceVersion(
      published,
      '2027-09-30T23:59:59.000Z'
    );
    expect(retired.status).toBe('RETIRED');
  });

  it('allows Job Profiles to participate without turning participation into permission or authority', () => {
    const participation = createFunctionJobProfileParticipation(
      {
        id: asId<'FunctionJobProfileParticipationId'>('F01-JOB-STRATEGY-DIRECTOR', 'Function Job Profile Participation'),
        catalogueScope: 'PLATFORM',
        functionId: f01.id,
        jobProfileId: platformJob.id,
        mode: 'GOVERNANCE',
        status: 'ACTIVE'
      },
      f01,
      platformJob
    );

    expect(participation.mode).toBe('GOVERNANCE');
    expect('permission' in participation).toBe(false);
    expect('authority' in participation).toBe(false);
  });

  it('models competence requirements and evidence independently from Job Profile and access', () => {
    const requirement = createCompetenceRequirement({
      id: asId<'CompetenceRequirementId'>('COMP-REQ-STRATEGY', 'Competence Requirement'),
      tenantId,
      subjectType: 'FUNCTION',
      subjectId: f01.id,
      competenceCode: 'STRATEGY_LEADERSHIP',
      competenceName: 'Strategy Leadership',
      requiredLevel: 'ADVANCED',
      evidenceRequired: true,
      expiryRequired: false,
      status: 'ACTIVE'
    });

    const evidence = createCompetenceEvidence(
      {
        id: asId<'CompetenceEvidenceId'>('COMP-EVIDENCE-STRATEGY', 'Competence Evidence'),
        tenantId,
        personId: person.id,
        competenceCode: requirement.competenceCode,
        attainedLevel: 'ADVANCED',
        issuedAt: '2026-09-01T00:00:00.000Z',
        effectiveFrom: '2026-09-01T00:00:00.000Z',
        status: 'ACTIVE'
      },
      person
    );

    expect(evidence.competenceCode).toBe(requirement.competenceCode);
  });

  it('deploys capability into a real context separately from employment and position occupancy', () => {
    const deployment = createFunctionalDeployment(
      {
        id: asId<'FunctionalDeploymentId'>('DEPLOY-F01-PROJECT', 'Functional Deployment'),
        tenantId,
        functionId: f01.id,
        subFunctionId: f01_01.id,
        organisationId: organisation.id,
        organisationUnitId: unit.id,
        contextType: 'PROJECT',
        contextObjectId: project.id,
        scopeDescription: 'Provide strategy governance for Project 001.',
        effectiveFrom: '2026-09-20T00:00:00.000Z',
        status: 'ACTIVE'
      },
      f01,
      organisation,
      unit,
      project,
      f01_01
    );

    const assignment = createDeploymentAssignment(
      {
        id: asId<'DeploymentAssignmentId'>('DEPLOY-ASG-F01', 'Deployment Assignment'),
        tenantId,
        functionalDeploymentId: deployment.id,
        assigneeType: 'POSITION',
        assigneeId: position.id,
        jobProfileId: platformJob.id,
        responsibilityRole: 'ACCOUNTABLE',
        effectiveFrom: '2026-09-20T00:00:00.000Z',
        status: 'ACTIVE'
      },
      deployment,
      position,
      platformJob
    );

    const responsibility = createResponsibilityScope(
      {
        id: asId<'ResponsibilityScopeId'>('RESP-F01-PROJECT', 'Responsibility Scope'),
        tenantId,
        deploymentAssignmentId: assignment.id,
        responsibilityRole: 'ACCOUNTABLE',
        scopeType: 'PROJECT',
        scopeId: project.id,
        description: 'Accountable for strategy governance within Project 001.',
        effectiveFrom: '2026-09-20T00:00:00.000Z',
        status: 'ACTIVE'
      },
      assignment
    );

    const capacity = createDeploymentCapacity(
      {
        id: asId<'DeploymentCapacityId'>('CAP-F01-PROJECT', 'Deployment Capacity'),
        tenantId,
        deploymentAssignmentId: assignment.id,
        capacityPercent: 25,
        effectiveFrom: '2026-09-20T00:00:00.000Z',
        status: 'ACTIVE'
      },
      assignment
    );

    expect(deployment.contextObjectId).toBe(project.id);
    expect(assignment.assigneeId).toBe(position.id);
    expect(responsibility.scopeId).toBe(project.id);
    expect(capacity.capacityPercent).toBe(25);
  });

  it('derives deployment gate permission from all explicit checks', () => {
    const denied = createDeploymentGateResult({
      tenantId,
      functionalDeploymentId: asId<'FunctionalDeploymentId'>('DEPLOY-GATE', 'Functional Deployment'),
      personId: person.id,
      evaluatedAt: '2026-09-20T12:00:00.000Z',
      allowed: false,
      checks: [
        { check: 'ACTIVE_DEPLOYMENT', passed: true, reason: 'Deployment is active.' },
        { check: 'ACTIVE_ASSIGNMENT', passed: true, reason: 'Assignment is active.' },
        { check: 'COMPETENCE', passed: false, reason: 'Required competence has expired.' },
        { check: 'PERMISSION', passed: true, reason: 'Required permission is present.' }
      ]
    });

    expect(denied.allowed).toBe(false);

    expect(() =>
      createDeploymentGateResult({
        ...denied,
        allowed: true
      })
    ).toThrow(KernelInvariantError);
  });
});
