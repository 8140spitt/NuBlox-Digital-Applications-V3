import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  asId,
  type AccessRoleAssignment,
  type AccessRoleDefinition,
  type AccessRolePermission,
  type AuthorityDefinition,
  type AuthorityGrant,
  type CanonicalObjectIdentity,
  type CompetenceEvidence,
  type CompetenceRequirement,
  type DeploymentAssignment,
  type DeploymentCapacity,
  type EvidenceRecord,
  type FunctionGovernanceVersion,
  type FunctionalDeployment,
  type FunctionJobProfileParticipation,
  type JobProfile,
  type Organisation,
  type OrganisationUnit,
  type Party,
  type PermissionDefinition,
  type Person,
  type Position,
  type PositionOccupancy,
  type ProcessDefinition,
  type ResponsibilityScope,
  type TaskDefinition,
  type Tenant
} from '@nublox/kernel';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlKernelControlRepository } from './control-repository.js';
import { createDatabasePool } from './database.js';
import { MySqlFunctionalRepository } from './functional-repository.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('MySQL functional framework and deployment runtime', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('seeds the canonical taxonomy and gates real functional deployment across competence, authority, permission and capacity', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = Date.now().toString(36);
    const tenantId = asId<'TenantId'>(`TENANT-FUNC-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const control = new MySqlKernelControlRepository(pool);
    const access = new MySqlAccessRepository(pool);
    const functional = new MySqlFunctionalRepository(pool);

    expect(await functional.taxonomyCounts()).toEqual({
      functions: 29,
      subFunctions: 353,
      activities: 1510
    });

    const functions = await functional.listFunctions();
    expect(functions).toHaveLength(29);
    expect(functions[0]).toEqual(
      expect.objectContaining({
        id: 'F01',
        code: 'F01',
        name: 'Strategy & Enterprise Planning'
      })
    );
    expect(functions[28]).toEqual(
      expect.objectContaining({
        id: 'F29',
        name: 'Business Process & Continuous Improvement'
      })
    );

    const tenant: Tenant = {
      id: tenantId,
      name: 'Functional Deployment Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant);

    const personParty: Party = {
      id: asId<'PartyId'>(`PARTY-P-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Strategy Director',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, personParty);

    const person: Person = {
      id: asId<'PersonId'>(`PERSON-${suffix}`, 'Person'),
      tenantId,
      partyId: personParty.id,
      legalName: 'Strategy Director',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, person);

    const organisationParty: Party = {
      id: asId<'PartyId'>(`PARTY-O-${suffix}`, 'Party'),
      tenantId,
      kind: 'ORGANISATION',
      displayName: 'NuBlox Functional Test Ltd',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, organisationParty, {
      actorPersonId: person.id
    });

    const organisation: Organisation = {
      id: asId<'OrganisationId'>(`ORG-${suffix}`, 'Organisation'),
      tenantId,
      partyId: organisationParty.id,
      legalName: 'NuBlox Functional Test Ltd',
      status: 'ACTIVE'
    };
    await kernel.createOrganisation(tenantId, organisation, {
      actorPersonId: person.id
    });

    const unit: OrganisationUnit = {
      id: asId<'OrganisationUnitId'>(`UNIT-${suffix}`, 'Organisation Unit'),
      tenantId,
      organisationId: organisation.id,
      code: 'STRATEGY',
      name: 'Strategy',
      status: 'ACTIVE'
    };
    await kernel.createOrganisationUnit(tenantId, unit, {
      actorPersonId: person.id
    });

    const jobProfile: JobProfile = {
      id: asId<'JobProfileId'>(`JOB-${suffix}`, 'Job Profile'),
      catalogueScope: 'TENANT',
      tenantId,
      code: 'STRATEGY_DIRECTOR',
      name: 'Strategy Director',
      status: 'ACTIVE'
    };
    await kernel.createJobProfile(jobProfile, {
      actorPersonId: person.id
    });

    const position: Position = {
      id: asId<'PositionId'>(`POS-${suffix}`, 'Position'),
      tenantId,
      organisationUnitId: unit.id,
      jobProfileId: jobProfile.id,
      code: 'STRATEGY-DIR-01',
      title: 'Strategy Director',
      status: 'ACTIVE'
    };
    await kernel.createPosition(tenantId, position, {
      actorPersonId: person.id
    });

    const occupancy: PositionOccupancy = {
      id: asId<'PositionOccupancyId'>(`OCC-${suffix}`, 'Position Occupancy'),
      tenantId,
      positionId: position.id,
      personId: person.id,
      effectiveFrom: '2026-09-01T00:00:00.000Z'
    };
    await kernel.createPositionOccupancy(tenantId, occupancy, {
      actorPersonId: person.id
    });

    const project: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`PROJECT-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'PROJECT',
      stableKey: `PROJECT-${suffix}`,
      createdAt: '2026-09-20T09:00:00.000Z'
    };
    await kernel.createCanonicalObject(tenantId, project, {
      actorPersonId: person.id
    });

    const process: ProcessDefinition = {
      id: asId<'ProcessDefinitionId'>(`PROC-${suffix}`, 'Process Definition'),
      tenantId,
      functionId: asId<'FunctionId'>('F01', 'Function'),
      subFunctionId: asId<'SubFunctionId'>('F01.01', 'Sub-function'),
      code: 'STRATEGY_DIRECTION',
      name: 'Strategy Direction',
      purpose: 'Establish and govern enterprise direction.',
      status: 'ACTIVE'
    };
    await functional.createProcessDefinition(tenantId, process, {
      actorPersonId: person.id
    });

    const task: TaskDefinition = {
      id: asId<'TaskDefinitionId'>(`TASK-${suffix}`, 'Task Definition'),
      tenantId,
      processDefinitionId: process.id,
      functionalActivityId: asId<'FunctionalActivityId'>(
        'F01.01.A001',
        'Functional Activity'
      ),
      code: 'DEFINE_PURPOSE',
      name: 'Define enterprise purpose',
      sequence: 1,
      status: 'ACTIVE'
    };
    await functional.createTaskDefinition(tenantId, task, {
      actorPersonId: person.id
    });

    const governance: FunctionGovernanceVersion = {
      id: asId<'FunctionGovernanceVersionId'>(`F01-GOV-${suffix}`, 'Function Governance Version'),
      tenantId,
      functionId: asId<'FunctionId'>('F01', 'Function'),
      version: 1,
      status: 'DRAFT',
      purpose: 'Govern enterprise strategy and planning.',
      mandate: 'Set enterprise direction and performance expectations.',
      scopeIn: ['Enterprise strategy', 'Business planning'],
      scopeOut: ['Project delivery execution'],
      accountableOwnerType: 'POSITION',
      accountableOwnerId: position.id,
      policyReferences: ['POL-STRATEGY-001'],
      standardReferences: [],
      procedureReferences: ['PROC-STRATEGY-001'],
      assuranceRequirements: ['Quarterly strategy review'],
      performanceMeasures: ['Strategy execution rate']
    };
    await functional.createGovernanceVersion(tenantId, governance, {
      actorPersonId: person.id
    });
    const publishedGovernance = await functional.publishGovernanceVersion(
      tenantId,
      governance.id,
      '2026-09-20T09:30:00.000Z',
      { actorPersonId: person.id }
    );
    expect(publishedGovernance.status).toBe('PUBLISHED');

    const governanceV2: FunctionGovernanceVersion = {
      ...governance,
      id: asId<'FunctionGovernanceVersionId'>(`F01-GOV-V2-${suffix}`, 'Function Governance Version'),
      version: 2
    };
    await functional.createGovernanceVersion(tenantId, governanceV2, {
      actorPersonId: person.id
    });
    await expect(
      functional.publishGovernanceVersion(
        tenantId,
        governanceV2.id,
        '2026-09-21T09:30:00.000Z',
        { actorPersonId: person.id }
      )
    ).rejects.toThrow('another version is PUBLISHED');

    const participation: FunctionJobProfileParticipation = {
      id: asId<'FunctionJobProfileParticipationId'>(`PARTICIPATION-${suffix}`, 'Function Job Profile Participation'),
      catalogueScope: 'TENANT',
      tenantId,
      functionId: asId<'FunctionId'>('F01', 'Function'),
      subFunctionId: asId<'SubFunctionId'>('F01.01', 'Sub-function'),
      jobProfileId: jobProfile.id,
      mode: 'GOVERNANCE',
      status: 'ACTIVE'
    };
    await functional.createJobProfileParticipation(participation, {
      actorPersonId: person.id
    });

    const competenceRequirement: CompetenceRequirement = {
      id: asId<'CompetenceRequirementId'>(`COMP-REQ-${suffix}`, 'Competence Requirement'),
      tenantId,
      subjectType: 'FUNCTION',
      subjectId: 'F01',
      competenceCode: 'STRATEGY_LEADERSHIP',
      competenceName: 'Strategy Leadership',
      requiredLevel: 'ADVANCED',
      evidenceRequired: true,
      expiryRequired: false,
      status: 'ACTIVE'
    };
    await functional.createCompetenceRequirement(
      tenantId,
      competenceRequirement,
      { actorPersonId: person.id }
    );

    const deployment: FunctionalDeployment = {
      id: asId<'FunctionalDeploymentId'>(`DEPLOY-${suffix}`, 'Functional Deployment'),
      tenantId,
      functionId: asId<'FunctionId'>('F01', 'Function'),
      subFunctionId: asId<'SubFunctionId'>('F01.01', 'Sub-function'),
      deploymentPurpose: 'FUNCTIONAL_GOVERNANCE',
      organisationId: organisation.id,
      organisationUnitId: unit.id,
      contextType: 'PROJECT',
      contextObjectId: project.id,
      scopeDescription: 'Provide F01 strategy governance for the project.',
      effectiveFrom: '2026-09-20T09:00:00.000Z',
      status: 'ACTIVE'
    };
    await functional.createDeployment(tenantId, deployment, {
      actorPersonId: person.id
    });

    const deploymentAssignment: DeploymentAssignment = {
      id: asId<'DeploymentAssignmentId'>(`DEPLOY-ASG-${suffix}`, 'Deployment Assignment'),
      tenantId,
      functionalDeploymentId: deployment.id,
      assigneeType: 'POSITION',
      assigneeId: position.id,
      jobProfileId: jobProfile.id,
      responsibilityRole: 'ACCOUNTABLE',
      effectiveFrom: '2026-09-20T09:00:00.000Z',
      status: 'ACTIVE'
    };
    await functional.createDeploymentAssignment(
      tenantId,
      deploymentAssignment,
      { actorPersonId: person.id }
    );

    const responsibility: ResponsibilityScope = {
      id: asId<'ResponsibilityScopeId'>(`RESP-${suffix}`, 'Responsibility Scope'),
      tenantId,
      deploymentAssignmentId: deploymentAssignment.id,
      responsibilityRole: 'ACCOUNTABLE',
      scopeType: 'PROJECT',
      scopeId: project.id,
      description: 'Accountable for F01 governance in this project.',
      effectiveFrom: '2026-09-20T09:00:00.000Z',
      status: 'ACTIVE'
    };
    await functional.createResponsibilityScope(
      tenantId,
      responsibility,
      { actorPersonId: person.id }
    );

    const capacity: DeploymentCapacity = {
      id: asId<'DeploymentCapacityId'>(`CAP-${suffix}`, 'Deployment Capacity'),
      tenantId,
      deploymentAssignmentId: deploymentAssignment.id,
      capacityPercent: 40,
      effectiveFrom: '2026-09-20T09:00:00.000Z',
      status: 'ACTIVE'
    };
    await functional.createDeploymentCapacity(
      tenantId,
      capacity,
      { actorPersonId: person.id }
    );

    await expect(
      functional.createDeploymentCapacity(
        tenantId,
        {
          ...capacity,
          id: asId<'DeploymentCapacityId'>(`CAP-OVER-${suffix}`, 'Deployment Capacity'),
          capacityPercent: 70
        },
        { actorPersonId: person.id }
      )
    ).rejects.toThrow('exceed 100%');

    const permission: PermissionDefinition = {
      key: `function.f01.execute.${suffix}`,
      name: 'Execute F01 work',
      description: 'Execute F01 governed work in the assigned Project scope.'
    };
    await access.createPermissionDefinition(permission);

    const accessRole: AccessRoleDefinition = {
      id: asId<'AccessRoleId'>(`ROLE-${suffix}`, 'Access Role'),
      catalogueScope: 'TENANT',
      tenantId,
      code: 'F01_PROJECT_EXECUTOR',
      name: 'F01 Project Executor',
      status: 'ACTIVE'
    };
    await access.createAccessRole(accessRole, {
      actorPersonId: person.id
    });

    const rolePermission: AccessRolePermission = {
      id: asId<'AccessRolePermissionId'>(`ROLE-PERM-${suffix}`, 'Access Role Permission'),
      accessRoleId: accessRole.id,
      permissionKey: permission.key
    };
    await access.grantPermissionToRole(rolePermission, {
      actorPersonId: person.id
    });

    const accessAssignment: AccessRoleAssignment = {
      id: asId<'AccessRoleAssignmentId'>(`ACCESS-ASG-${suffix}`, 'Access Role Assignment'),
      tenantId,
      accessRoleId: accessRole.id,
      principalType: 'POSITION',
      principalId: position.id,
      scopeType: 'PROJECT',
      scopeId: project.id,
      effectiveFrom: '2026-09-20T09:00:00.000Z',
      status: 'ACTIVE'
    };
    await access.assignAccessRole(tenantId, accessAssignment, {
      actorPersonId: person.id
    });

    const authorityDefinition: AuthorityDefinition = {
      id: asId<'AuthorityDefinitionId'>(`AUTH-${suffix}`, 'Authority Definition'),
      tenantId,
      code: 'F01_PROJECT_COMMIT',
      name: 'Commit F01 Project Decisions',
      authorityType: 'GOVERNANCE',
      status: 'ACTIVE'
    };
    await kernel.createAuthorityDefinition(
      tenantId,
      authorityDefinition,
      { actorPersonId: person.id }
    );

    const authorityGrant: AuthorityGrant = {
      id: asId<'AuthorityGrantId'>(`AUTH-GRANT-${suffix}`, 'Authority Grant'),
      tenantId,
      authorityDefinitionId: authorityDefinition.id,
      granteeType: 'POSITION',
      granteeId: position.id,
      scopeType: 'PROJECT',
      scopeId: project.id,
      effectiveFrom: '2026-09-20T09:00:00.000Z',
      status: 'ACTIVE'
    };
    await kernel.createAuthorityGrant(
      tenantId,
      authorityGrant,
      { actorPersonId: person.id }
    );

    const gateRequirements = {
      requiredPermission: {
        permissionKey: permission.key,
        scope: { scopeType: 'PROJECT', scopeId: project.id }
      },
      requiredAuthority: {
        authorityDefinitionId: authorityDefinition.id,
        scopeType: 'PROJECT',
        scopeId: project.id
      },
      minimumCapacityPercent: 20
    };

    const denied = await functional.evaluateDeploymentGate(
      tenantId,
      deployment.id,
      person.id,
      gateRequirements,
      '2026-09-20T12:00:00.000Z'
    );

    expect(denied.allowed).toBe(false);
    expect(
      denied.checks.find((check) => check.check === 'COMPETENCE')
    ).toEqual(
      expect.objectContaining({
        passed: false
      })
    );
    expect(
      denied.checks.find((check) => check.check === 'PERMISSION')
    ).toEqual(expect.objectContaining({ passed: true }));
    expect(
      denied.checks.find((check) => check.check === 'AUTHORITY')
    ).toEqual(expect.objectContaining({ passed: true }));
    expect(
      denied.checks.find((check) => check.check === 'AVAILABILITY')
    ).toEqual(expect.objectContaining({ passed: true }));

    const evidenceRecord: EvidenceRecord = {
      id: asId<'EvidenceRecordId'>(`EVIDENCE-${suffix}`, 'Evidence Record'),
      tenantId,
      evidenceType: 'COMPETENCE',
      subjectObjectId: project.id,
      capturedByPersonId: person.id,
      capturedAt: '2026-09-20T12:01:00.000Z',
      contentReference: `urn:nublox:competence:${suffix}`,
      integrityHash: 'sha256:strategy-leadership'
    };
    await control.recordEvidence(tenantId, evidenceRecord, {
      actorPersonId: person.id
    });

    const competenceEvidence: CompetenceEvidence = {
      id: asId<'CompetenceEvidenceId'>(`COMP-EVIDENCE-${suffix}`, 'Competence Evidence'),
      tenantId,
      personId: person.id,
      competenceCode: competenceRequirement.competenceCode,
      attainedLevel: 'ADVANCED',
      evidenceRecordId: evidenceRecord.id,
      issuedAt: '2026-09-20T12:01:00.000Z',
      effectiveFrom: '2026-09-20T12:01:00.000Z',
      status: 'ACTIVE'
    };
    await functional.createCompetenceEvidence(
      tenantId,
      competenceEvidence,
      { actorPersonId: person.id }
    );

    const allowed = await functional.evaluateDeploymentGate(
      tenantId,
      deployment.id,
      person.id,
      gateRequirements,
      '2026-09-20T12:02:00.000Z'
    );

    expect(allowed.allowed).toBe(true);
    expect(allowed.checks.every((check) => check.passed)).toBe(true);

    const [auditRows] = await pool.query(
      `SELECT entity_type, action
         FROM kernel_audit_entries
        WHERE tenant_id = ?
          AND entity_type IN (
            'FUNCTION_GOVERNANCE_VERSION',
            'FUNCTIONAL_DEPLOYMENT',
            'DEPLOYMENT_ASSIGNMENT',
            'COMPETENCE_EVIDENCE'
          )`,
      [tenantId]
    );
    expect(auditRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entity_type: 'FUNCTION_GOVERNANCE_VERSION',
          action: 'PUBLISHED'
        }),
        expect.objectContaining({
          entity_type: 'FUNCTIONAL_DEPLOYMENT',
          action: 'CREATED'
        }),
        expect.objectContaining({
          entity_type: 'DEPLOYMENT_ASSIGNMENT',
          action: 'CREATED'
        }),
        expect.objectContaining({
          entity_type: 'COMPETENCE_EVIDENCE',
          action: 'CREATED'
        })
      ])
    );
  });
});
