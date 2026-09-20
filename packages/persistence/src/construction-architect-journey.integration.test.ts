import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  asId,
  type AccessRoleAssignment,
  type AccessRoleDefinition,
  type AccessRolePermission,
  type AuthorityDefinition,
  type AuthorityGrant,
  type CompetenceEvidence,
  type CompetenceRequirement,
  type DeliverableApproval,
  type DeliverableAuthoringBinding,
  type DeliverableItem,
  type DeliverableRequirement,
  type DeliverableResponsibility,
  type DeliverableReview,
  type Decision,
  type DeploymentAssignment,
  type DeploymentCapacity,
  type EvidenceRecord,
  type FunctionJobProfileParticipation,
  type FunctionalDeployment,
  type InformationContainer,
  type InformationIteration,
  type InformationRevision,
  type Organisation,
  type OrganisationUnit,
  type Party,
  type PermissionDefinition,
  type Person,
  type Position,
  type PositionOccupancy,
  type RecipientResponse,
  type Representation,
  type ResponsibilityScope,
  type Tenant,
  type Transmittal,
  type TransmittalRecipient
} from '@nublox/kernel';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlKernelControlRepository } from './control-repository.js';
import { createDatabasePool } from './database.js';
import { MySqlDeliverableRepository } from './deliverable-repository.js';
import { MySqlFunctionalRepository } from './functional-repository.js';
import { MySqlIndustryRepository } from './industry-repository.js';
import { MySqlInformationRepository } from './information-repository.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('Construction Architect representative job journey', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('deploys an Architect into a Project and governs a Drawing through client acceptance', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = `ARCH-${Date.now().toString(36)}`;
    const tenantId = asId<'TenantId'>(`TENANT-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const access = new MySqlAccessRepository(pool);
    const control = new MySqlKernelControlRepository(pool);
    const functional = new MySqlFunctionalRepository(pool);
    const industry = new MySqlIndustryRepository(pool);
    const information = new MySqlInformationRepository(pool);
    const deliverables = new MySqlDeliverableRepository(pool);

    const architectIndustryProfile = (await industry.listIndustryJobProfiles())[2];
    expect(architectIndustryProfile).toEqual(
      expect.objectContaining({
        industry: expect.objectContaining({
          id: 'CBE-JP-003',
          canonicalName: 'Architect',
          primaryDeliveryDomainId: 'D01'
        }),
        jobProfile: expect.objectContaining({
          id: 'JP-CBE-003',
          name: 'Architect'
        })
      })
    );
    expect(
      await industry.getJobCapabilityProfile(
        asId<'IndustryJobProfileId'>('CBE-JP-003', 'Industry Job Profile')
      )
    ).toEqual(
      expect.objectContaining({
        primaryStructuredRecords: expect.arrayContaining([
          'Drawings',
          'models',
          'specifications',
          'design decisions'
        ])
      })
    );

    const drawingType = await industry.getWorkProductType('DRAWING');
    expect(drawingType.defaultAuthoringMode).toBe('NATIVE');

    const tenant: Tenant = {
      id: tenantId,
      name: 'Architect Journey Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant);

    const architectParty: Party = {
      id: asId<'PartyId'>(`PARTY-ARCH-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Project Architect',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, architectParty);

    const architect: Person = {
      id: asId<'PersonId'>(`PERSON-ARCH-${suffix}`, 'Person'),
      tenantId,
      partyId: architectParty.id,
      legalName: 'Project Architect',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, architect);

    const practiceParty: Party = {
      id: asId<'PartyId'>(`PARTY-PRACTICE-${suffix}`, 'Party'),
      tenantId,
      kind: 'ORGANISATION',
      displayName: 'Architectural Practice Ltd',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, practiceParty, {
      actorPersonId: architect.id
    });

    const practice: Organisation = {
      id: asId<'OrganisationId'>(`ORG-PRACTICE-${suffix}`, 'Organisation'),
      tenantId,
      partyId: practiceParty.id,
      legalName: 'Architectural Practice Ltd',
      status: 'ACTIVE'
    };
    await kernel.createOrganisation(tenantId, practice, {
      actorPersonId: architect.id
    });

    const designUnit: OrganisationUnit = {
      id: asId<'OrganisationUnitId'>(`UNIT-DESIGN-${suffix}`, 'Organisation Unit'),
      tenantId,
      organisationId: practice.id,
      code: 'DESIGN',
      name: 'Architecture & Design',
      status: 'ACTIVE'
    };
    await kernel.createOrganisationUnit(tenantId, designUnit, {
      actorPersonId: architect.id
    });

    const architectPosition: Position = {
      id: asId<'PositionId'>(`POS-ARCH-${suffix}`, 'Position'),
      tenantId,
      organisationUnitId: designUnit.id,
      jobProfileId: asId<'JobProfileId'>('JP-CBE-003', 'Job Profile'),
      code: 'ARCH-01',
      title: 'Project Architect',
      status: 'ACTIVE'
    };
    await kernel.createPosition(tenantId, architectPosition, {
      actorPersonId: architect.id
    });

    const occupancy: PositionOccupancy = {
      id: asId<'PositionOccupancyId'>(`OCC-ARCH-${suffix}`, 'Position Occupancy'),
      tenantId,
      positionId: architectPosition.id,
      personId: architect.id,
      effectiveFrom: '2026-09-01T00:00:00.000Z'
    };
    await kernel.createPositionOccupancy(tenantId, occupancy, {
      actorPersonId: architect.id
    });

    const clientParty: Party = {
      id: asId<'PartyId'>(`PARTY-CLIENT-${suffix}`, 'Party'),
      tenantId,
      kind: 'ORGANISATION',
      displayName: 'Client Organisation',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, clientParty, {
      actorPersonId: architect.id
    });

    const project = {
      id: asId<'CanonicalObjectId'>(`PROJECT-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'PROJECT',
      stableKey: `PROJECT-${suffix}`,
      createdAt: '2026-09-20T09:00:00.000Z'
    };
    const deliverableObject = {
      id: asId<'CanonicalObjectId'>(`DELIVERABLE-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'DELIVERABLE_ITEM',
      stableKey: `A-1001-${suffix}`,
      createdAt: '2026-09-20T09:01:00.000Z'
    };
    const drawingObject = {
      id: asId<'CanonicalObjectId'>(`DRAWING-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'INFORMATION_CONTAINER',
      stableKey: `DRAWING-A1001-${suffix}`,
      createdAt: '2026-09-20T09:02:00.000Z'
    };

    await kernel.createCanonicalObject(tenantId, project, {
      actorPersonId: architect.id
    });
    await kernel.createCanonicalObject(tenantId, deliverableObject, {
      actorPersonId: architect.id
    });
    await kernel.createCanonicalObject(tenantId, drawingObject, {
      actorPersonId: architect.id
    });

    await industry.createConstructionContext(
      tenantId,
      {
        id: asId<'ConstructionContextProfileId'>(`CTX-PROJECT-${suffix}`, 'Construction Context Profile'),
        tenantId,
        canonicalObjectId: project.id,
        contextType: 'PROJECT',
        code: 'P-ALPHA',
        name: 'Project Alpha',
        status: 'ACTIVE'
      },
      {
        actorPersonId: architect.id,
        correlationId: suffix
      }
    );

    const participation: FunctionJobProfileParticipation = {
      id: asId<'FunctionJobProfileParticipationId'>(`PARTICIPATION-${suffix}`, 'Function Job Profile Participation'),
      catalogueScope: 'TENANT',
      tenantId,
      functionId: asId<'FunctionId'>('F27', 'Function'),
      jobProfileId: asId<'JobProfileId'>('JP-CBE-003', 'Job Profile'),
      mode: 'DELIVERY',
      status: 'ACTIVE'
    };
    await functional.createJobProfileParticipation(participation, {
      actorPersonId: architect.id
    });

    const deployment: FunctionalDeployment = {
      id: asId<'FunctionalDeploymentId'>(`DEPLOY-${suffix}`, 'Functional Deployment'),
      tenantId,
      functionId: asId<'FunctionId'>('F27', 'Function'),
      organisationId: practice.id,
      organisationUnitId: designUnit.id,
      contextType: 'PROJECT',
      contextObjectId: project.id,
      scopeDescription: 'Architectural design delivery for Project Alpha.',
      effectiveFrom: '2026-09-20T09:00:00.000Z',
      status: 'ACTIVE'
    };
    await functional.createDeployment(tenantId, deployment, {
      actorPersonId: architect.id,
      correlationId: suffix
    });

    const deploymentAssignment: DeploymentAssignment = {
      id: asId<'DeploymentAssignmentId'>(`DEPLOY-ASG-${suffix}`, 'Deployment Assignment'),
      tenantId,
      functionalDeploymentId: deployment.id,
      assigneeType: 'POSITION',
      assigneeId: architectPosition.id,
      jobProfileId: asId<'JobProfileId'>('JP-CBE-003', 'Job Profile'),
      responsibilityRole: 'RESPONSIBLE',
      effectiveFrom: '2026-09-20T09:00:00.000Z',
      status: 'ACTIVE'
    };
    await functional.createDeploymentAssignment(
      tenantId,
      deploymentAssignment,
      { actorPersonId: architect.id }
    );

    const responsibilityScope: ResponsibilityScope = {
      id: asId<'ResponsibilityScopeId'>(`RESP-SCOPE-${suffix}`, 'Responsibility Scope'),
      tenantId,
      deploymentAssignmentId: deploymentAssignment.id,
      responsibilityRole: 'RESPONSIBLE',
      scopeType: 'PROJECT',
      scopeId: project.id,
      description: 'Responsible for architectural design deliverables on Project Alpha.',
      effectiveFrom: '2026-09-20T09:00:00.000Z',
      status: 'ACTIVE'
    };
    await functional.createResponsibilityScope(
      tenantId,
      responsibilityScope,
      { actorPersonId: architect.id }
    );

    const capacity: DeploymentCapacity = {
      id: asId<'DeploymentCapacityId'>(`CAP-${suffix}`, 'Deployment Capacity'),
      tenantId,
      deploymentAssignmentId: deploymentAssignment.id,
      capacityPercent: 60,
      effectiveFrom: '2026-09-20T09:00:00.000Z',
      status: 'ACTIVE'
    };
    await functional.createDeploymentCapacity(
      tenantId,
      capacity,
      { actorPersonId: architect.id }
    );

    const competenceRequirement: CompetenceRequirement = {
      id: asId<'CompetenceRequirementId'>(`COMP-REQ-${suffix}`, 'Competence Requirement'),
      tenantId,
      subjectType: 'DEPLOYMENT',
      subjectId: deployment.id,
      competenceCode: 'ARCHITECTURAL_DESIGN',
      competenceName: 'Architectural Design',
      requiredLevel: 'COMPETENT',
      evidenceRequired: true,
      expiryRequired: false,
      status: 'ACTIVE'
    };
    await functional.createCompetenceRequirement(
      tenantId,
      competenceRequirement,
      { actorPersonId: architect.id }
    );

    const competenceEvidenceRecord: EvidenceRecord = {
      id: asId<'EvidenceRecordId'>(`COMP-EVIDENCE-RECORD-${suffix}`, 'Evidence Record'),
      tenantId,
      evidenceType: 'COMPETENCE',
      subjectObjectId: project.id,
      capturedByPersonId: architect.id,
      capturedAt: '2026-09-20T09:10:00.000Z',
      contentReference: `urn:nublox:architect-competence:${suffix}`,
      integrityHash: 'sha256:architect-competence'
    };
    await control.recordEvidence(
      tenantId,
      competenceEvidenceRecord,
      { actorPersonId: architect.id }
    );

    const competenceEvidence: CompetenceEvidence = {
      id: asId<'CompetenceEvidenceId'>(`COMP-EVIDENCE-${suffix}`, 'Competence Evidence'),
      tenantId,
      personId: architect.id,
      competenceCode: competenceRequirement.competenceCode,
      attainedLevel: 'COMPETENT',
      evidenceRecordId: competenceEvidenceRecord.id,
      issuedAt: '2026-09-20T09:10:00.000Z',
      effectiveFrom: '2026-09-20T09:10:00.000Z',
      status: 'ACTIVE'
    };
    await functional.createCompetenceEvidence(
      tenantId,
      competenceEvidence,
      { actorPersonId: architect.id }
    );

    const permission: PermissionDefinition = {
      key: `cbe.architect.design.execute.${suffix}`,
      name: 'Execute architectural design work',
      description: 'Execute governed architectural design work in Project scope.'
    };
    await access.createPermissionDefinition(permission);

    const role: AccessRoleDefinition = {
      id: asId<'AccessRoleId'>(`ROLE-${suffix}`, 'Access Role'),
      catalogueScope: 'TENANT',
      tenantId,
      code: 'PROJECT_ARCHITECT',
      name: 'Project Architect',
      status: 'ACTIVE'
    };
    await access.createAccessRole(role, {
      actorPersonId: architect.id
    });

    const rolePermission: AccessRolePermission = {
      id: asId<'AccessRolePermissionId'>(`ROLE-PERM-${suffix}`, 'Access Role Permission'),
      accessRoleId: role.id,
      permissionKey: permission.key
    };
    await access.grantPermissionToRole(rolePermission, {
      actorPersonId: architect.id
    });

    const accessAssignment: AccessRoleAssignment = {
      id: asId<'AccessRoleAssignmentId'>(`ACCESS-ASG-${suffix}`, 'Access Role Assignment'),
      tenantId,
      accessRoleId: role.id,
      principalType: 'POSITION',
      principalId: architectPosition.id,
      scopeType: 'PROJECT',
      scopeId: project.id,
      effectiveFrom: '2026-09-20T09:00:00.000Z',
      status: 'ACTIVE'
    };
    await access.assignAccessRole(tenantId, accessAssignment, {
      actorPersonId: architect.id
    });

    const authorityDefinition: AuthorityDefinition = {
      id: asId<'AuthorityDefinitionId'>(`AUTH-${suffix}`, 'Authority Definition'),
      tenantId,
      code: 'ARCHITECTURAL_TECHNICAL_AUTHORITY',
      name: 'Architectural Technical Authority',
      authorityType: 'TECHNICAL',
      status: 'ACTIVE'
    };
    await kernel.createAuthorityDefinition(
      tenantId,
      authorityDefinition,
      { actorPersonId: architect.id }
    );

    const authorityGrant: AuthorityGrant = {
      id: asId<'AuthorityGrantId'>(`AUTH-GRANT-${suffix}`, 'Authority Grant'),
      tenantId,
      authorityDefinitionId: authorityDefinition.id,
      granteeType: 'POSITION',
      granteeId: architectPosition.id,
      scopeType: 'PROJECT',
      scopeId: project.id,
      effectiveFrom: '2026-09-20T09:00:00.000Z',
      status: 'ACTIVE'
    };
    await kernel.createAuthorityGrant(
      tenantId,
      authorityGrant,
      { actorPersonId: architect.id }
    );

    const gate = await functional.evaluateDeploymentGate(
      tenantId,
      deployment.id,
      architect.id,
      {
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
      },
      '2026-09-20T09:30:00.000Z'
    );
    expect(gate.allowed).toBe(true);
    expect(gate.checks.every((check) => check.passed)).toBe(true);

    const drawingContainer: InformationContainer = {
      id: asId<'InformationContainerId'>(`INFO-${suffix}`, 'Information Container'),
      tenantId,
      canonicalObjectId: drawingObject.id,
      containerType: drawingType.code,
      code: 'A-1001',
      title: 'Ground Floor Plan',
      status: 'ACTIVE'
    };
    await information.createInformationContainer(
      tenantId,
      drawingContainer,
      { actorPersonId: architect.id }
    );

    const revision: InformationRevision = {
      id: asId<'InformationRevisionId'>(`REV-${suffix}`, 'Information Revision'),
      tenantId,
      informationContainerId: drawingContainer.id,
      revision: 'A',
      status: 'DRAFT',
      createdAt: '2026-09-20T10:00:00.000Z'
    };
    await information.createInformationRevision(
      tenantId,
      revision,
      { actorPersonId: architect.id }
    );

    const iteration: InformationIteration = {
      id: asId<'InformationIterationId'>(`ITER-${suffix}`, 'Information Iteration'),
      tenantId,
      informationRevisionId: revision.id,
      iteration: 1,
      status: 'WORKING',
      createdAt: '2026-09-20T10:01:00.000Z',
      authorPersonId: architect.id
    };
    await information.createInformationIteration(
      tenantId,
      iteration,
      { actorPersonId: architect.id }
    );
    const frozen = await information.freezeInformationIteration(
      tenantId,
      iteration.id,
      { actorPersonId: architect.id }
    );

    const representation: Representation = {
      id: asId<'RepresentationId'>(`REP-${suffix}`, 'Representation'),
      tenantId,
      informationIterationId: frozen.id,
      representationType: 'PDF',
      mediaType: 'application/pdf',
      fileName: 'A-1001-A.pdf',
      contentReference: `urn:nublox:cbe:architect:${suffix}:drawing`,
      integrityHash: 'sha256:architect-drawing-a',
      generatedAt: '2026-09-20T10:05:00.000Z'
    };
    await information.createRepresentation(
      tenantId,
      representation,
      { actorPersonId: architect.id }
    );

    const requirement: DeliverableRequirement = {
      id: asId<'DeliverableRequirementId'>(`REQ-${suffix}`, 'Deliverable Requirement'),
      tenantId,
      code: `REQ-A1001-${suffix}`,
      title: 'Ground Floor Plan',
      deliverableType: drawingType.code,
      description: 'Produce, approve, issue and obtain acceptance of the Ground Floor Plan.',
      functionId: asId<'FunctionId'>('F27', 'Function'),
      functionalDeploymentId: deployment.id,
      contextObjectId: project.id,
      authoringMode: drawingType.defaultAuthoringMode,
      requiredRepresentationTypes: drawingType.defaultRepresentationTypes,
      plannedDueAt: '2026-09-30T17:00:00.000Z',
      acceptanceRequired: true,
      status: 'ACTIVE'
    };
    await deliverables.createRequirement(
      tenantId,
      requirement,
      { actorPersonId: architect.id, correlationId: suffix }
    );

    const item: DeliverableItem = {
      id: asId<'DeliverableItemId'>(`ITEM-${suffix}`, 'Deliverable Item'),
      tenantId,
      canonicalObjectId: deliverableObject.id,
      requirementId: requirement.id,
      contextObjectId: project.id,
      functionalDeploymentId: deployment.id,
      code: `DEL-A1001-${suffix}`,
      title: 'Ground Floor Plan',
      deliverableType: drawingType.code,
      status: 'PLANNED',
      plannedAt: '2026-09-20T10:10:00.000Z'
    };
    await deliverables.createItem(
      tenantId,
      item,
      { actorPersonId: architect.id, correlationId: suffix }
    );

    const authoring: DeliverableAuthoringBinding = {
      id: asId<'DeliverableAuthoringBindingId'>(`AUTHORING-${suffix}`, 'Deliverable Authoring Binding'),
      tenantId,
      deliverableItemId: item.id,
      mode: drawingType.defaultAuthoringMode,
      providerKey: 'NUBLOX_INFORMATION',
      authoritativeObjectId: drawingObject.id,
      createdAt: '2026-09-20T10:11:00.000Z',
      status: 'ACTIVE'
    };
    await deliverables.createAuthoringBinding(
      tenantId,
      authoring,
      { actorPersonId: architect.id }
    );

    const deliverableResponsibility: DeliverableResponsibility = {
      id: asId<'DeliverableResponsibilityId'>(`DEL-RESP-${suffix}`, 'Deliverable Responsibility'),
      tenantId,
      deliverableItemId: item.id,
      principalType: 'POSITION',
      principalId: architectPosition.id,
      responsibilityRole: 'RESPONSIBLE',
      effectiveFrom: '2026-09-20T10:00:00.000Z',
      status: 'ACTIVE'
    };
    await deliverables.addResponsibility(
      tenantId,
      deliverableResponsibility,
      { actorPersonId: architect.id }
    );

    await deliverables.startItem(
      tenantId,
      item.id,
      '2026-09-20T10:12:00.000Z',
      { actorPersonId: architect.id }
    );
    await deliverables.bindOutput(
      tenantId,
      item.id,
      drawingObject.id,
      'A',
      '2026-09-20T10:13:00.000Z',
      { actorPersonId: architect.id }
    );
    await deliverables.submitForReview(
      tenantId,
      item.id,
      '2026-09-20T10:14:00.000Z',
      { actorPersonId: architect.id }
    );

    const review: DeliverableReview = {
      id: asId<'DeliverableReviewId'>(`REVIEW-${suffix}`, 'Deliverable Review'),
      tenantId,
      deliverableItemId: item.id,
      reviewType: 'TECHNICAL_REVIEW',
      subjectObjectId: drawingObject.id,
      subjectVersion: 'A',
      reviewerPersonId: architect.id,
      reviewedAt: '2026-09-20T10:20:00.000Z',
      outcome: 'NO_COMMENT'
    };
    await deliverables.recordReview(
      tenantId,
      review,
      { actorPersonId: architect.id }
    );

    const approvalDecision: Decision = {
      id: asId<'DecisionId'>(`DECISION-${suffix}`, 'Decision'),
      tenantId,
      decisionType: 'DELIVERABLE_APPROVAL',
      subjectObjectId: drawingObject.id,
      subjectVersion: 'A',
      outcome: 'APPROVED',
      reason: 'Ground Floor Plan approved for issue.',
      deciderPersonId: architect.id,
      authorityGrantId: authorityGrant.id,
      decidedAt: '2026-09-20T10:25:00.000Z'
    };
    await control.createDecision(
      tenantId,
      approvalDecision,
      { actorPersonId: architect.id, correlationId: suffix }
    );

    const approval: DeliverableApproval = {
      id: asId<'DeliverableApprovalId'>(`APPROVAL-${suffix}`, 'Deliverable Approval'),
      tenantId,
      deliverableItemId: item.id,
      decisionId: approvalDecision.id,
      subjectObjectId: drawingObject.id,
      subjectVersion: 'A',
      approvedAt: approvalDecision.decidedAt
    };
    await deliverables.approve(
      tenantId,
      approval,
      { actorPersonId: architect.id, correlationId: suffix }
    );

    await information.releaseInformationRevision(
      tenantId,
      revision.id,
      frozen.id,
      '2026-09-20T10:26:00.000Z',
      approvalDecision.id,
      { actorPersonId: architect.id, correlationId: suffix }
    );

    const transmittal: Transmittal = {
      id: asId<'TransmittalId'>(`TR-${suffix}`, 'Transmittal'),
      tenantId,
      deliverableItemId: item.id,
      issueReference: `TR-${suffix}`,
      issuePurpose: 'FOR CONSTRUCTION',
      subjectObjectId: drawingObject.id,
      subjectVersion: 'A',
      representationId: representation.id,
      issuedByPersonId: architect.id,
      issuedAt: '2026-09-20T10:30:00.000Z',
      responseRequired: true
    };
    await deliverables.issue(
      tenantId,
      transmittal,
      { actorPersonId: architect.id, correlationId: suffix }
    );

    const recipient: TransmittalRecipient = {
      id: asId<'TransmittalRecipientId'>(`RECIPIENT-${suffix}`, 'Transmittal Recipient'),
      tenantId,
      transmittalId: transmittal.id,
      recipientPartyId: clientParty.id,
      responseRequired: true,
      dueAt: '2026-09-22T17:00:00.000Z'
    };
    await deliverables.addRecipient(
      tenantId,
      recipient,
      { actorPersonId: architect.id }
    );

    const response: RecipientResponse = {
      id: asId<'RecipientResponseId'>(`RESPONSE-${suffix}`, 'Recipient Response'),
      tenantId,
      transmittalRecipientId: recipient.id,
      outcome: 'ACCEPTED',
      respondedAt: '2026-09-21T10:00:00.000Z'
    };
    await deliverables.recordResponse(
      tenantId,
      response,
      { actorPersonId: architect.id }
    );

    const accepted = await deliverables.accept(
      tenantId,
      item.id,
      transmittal.id,
      '2026-09-21T10:01:00.000Z',
      { actorPersonId: architect.id, correlationId: suffix }
    );
    expect(accepted.status).toBe('ACCEPTED');

    const closed = await deliverables.close(
      tenantId,
      item.id,
      '2026-09-21T10:02:00.000Z',
      { actorPersonId: architect.id, correlationId: suffix }
    );
    expect(closed.status).toBe('CLOSED');
    expect(closed.governedOutputVersion).toBe('A');

    const [historyRows] = await pool.query(
      `SELECT status
         FROM deliverable_item_history
        WHERE tenant_id = ? AND deliverable_item_id = ?
        ORDER BY history_id`,
      [tenantId, item.id]
    );
    expect((historyRows as Array<{ status: string }>).map((row) => row.status)).toEqual([
      'PLANNED',
      'IN_PROGRESS',
      'IN_PROGRESS',
      'IN_REVIEW',
      'APPROVED',
      'ISSUED',
      'ACCEPTED',
      'CLOSED'
    ]);
  });
});
