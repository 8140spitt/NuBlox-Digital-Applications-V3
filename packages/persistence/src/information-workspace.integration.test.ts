import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  PLATFORM_ADMINISTRATOR_ROLE_ID,
  asId,
  type AccessRoleAssignment,
  type AuthorityDefinition,
  type AuthorityGrant,
  type Decision,
  type Party,
  type Person,
  type Tenant,
  type ValidationRuleDefinition,
  type ValidationRuleSet,
  type ValidationRuleSetMember
} from '@nublox/kernel';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlKernelControlRepository } from './control-repository.js';
import { createDatabasePool } from './database.js';
import { InformationCommandError, MySqlInformationCommandService } from './information-command-service.js';
import { MySqlInformationReadRepository } from './information-read-repository.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';
import { MySqlValidationPolicyRepository } from './validation-policy-repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('information workspace', () => {
  beforeAll(async () => {
    await migrate();
  });
  afterAll(async () => {
    await pool?.end();
  });

  it('creates and governs an Information Container revision lineage with Authority-backed release', async () => {
    if (!pool) throw new Error('Database pool missing.');
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const tenantId = asId<'TenantId'>(`TENANT-INFO-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const access = new MySqlAccessRepository(pool);
    const control = new MySqlKernelControlRepository(pool);
    const information = new MySqlInformationCommandService(pool);
    const reads = new MySqlInformationReadRepository(pool);
    const validationPolicies = new MySqlValidationPolicyRepository(pool);

    const tenant: Tenant = { id: tenantId, name: 'Information Workspace Test', status: 'ACTIVE' };
    await kernel.createTenant(tenant);

    const adminParty: Party = {
      id: asId<'PartyId'>(`PARTY-INFO-ADMIN-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Information Administrator',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, adminParty);
    const admin: Person = {
      id: asId<'PersonId'>(`PERSON-INFO-ADMIN-${suffix}`, 'Person'),
      tenantId,
      partyId: adminParty.id,
      legalName: 'Information Administrator',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, admin);

    const workerParty: Party = {
      id: asId<'PartyId'>(`PARTY-INFO-WORKER-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Information Worker',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, workerParty);
    const worker: Person = {
      id: asId<'PersonId'>(`PERSON-INFO-WORKER-${suffix}`, 'Person'),
      tenantId,
      partyId: workerParty.id,
      legalName: 'Information Worker',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, worker);

    const assignment: AccessRoleAssignment = {
      id: asId<'AccessRoleAssignmentId'>(`ARA-INFO-${suffix}`, 'Access Role Assignment'),
      tenantId,
      accessRoleId: PLATFORM_ADMINISTRATOR_ROLE_ID,
      principalType: 'PERSON',
      principalId: admin.id,
      scopeType: 'TENANT',
      effectiveFrom: '2026-09-21T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await access.assignAccessRole(tenantId, assignment, {
      actorPersonId: admin.id,
      correlationId: 'INFORMATION-TEST'
    });

    const container = await information.createContainer(tenantId, admin.id, {
      containerType: 'DRAWING',
      code: `A-1001-${suffix}`,
      title: 'Ground Floor Plan'
    });
    const revision = await information.createRevision(tenantId, admin.id, {
      informationContainerId: container.id,
      revision: 'A'
    });
    const iteration = await information.createIteration(tenantId, admin.id, {
      informationRevisionId: revision.id
    });
    const frozen = await information.freezeIteration(tenantId, admin.id, iteration.id);
    const representation = await information.createRepresentation(tenantId, admin.id, {
      informationIterationId: frozen.id,
      representationType: 'PDF',
      mediaType: 'application/pdf',
      fileName: 'A-1001-A.pdf',
      contentReference: `urn:nublox:test:${suffix}:A-1001-A`,
      integrityHash: 'sha256:test-information-a'
    });

    const authorityDefinition: AuthorityDefinition = {
      id: asId<'AuthorityDefinitionId'>(`AUTH-INFO-${suffix}`, 'Authority Definition'),
      tenantId,
      code: `INFO_RELEASE_${suffix}`,
      name: 'Information Release Authority',
      authorityType: 'TECHNICAL',
      status: 'ACTIVE'
    };
    await kernel.createAuthorityDefinition(tenantId, authorityDefinition, { actorPersonId: admin.id });
    const authorityGrant: AuthorityGrant = {
      id: asId<'AuthorityGrantId'>(`AUTH-GRANT-INFO-${suffix}`, 'Authority Grant'),
      tenantId,
      authorityDefinitionId: authorityDefinition.id,
      granteeType: 'PERSON',
      granteeId: admin.id,
      scopeType: 'TENANT',
      effectiveFrom: '2026-09-21T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await kernel.createAuthorityGrant(tenantId, authorityGrant, { actorPersonId: admin.id });

    const decision: Decision = {
      id: asId<'DecisionId'>(`DEC-INFO-${suffix}`, 'Decision'),
      tenantId,
      decisionType: 'INFORMATION_RELEASE',
      subjectObjectId: container.canonicalObjectId,
      subjectVersion: revision.revision,
      outcome: 'APPROVED',
      reason: 'Technical review complete.',
      deciderPersonId: admin.id,
      authorityGrantId: authorityGrant.id,
      decidedAt: new Date().toISOString()
    };
    await control.createDecision(tenantId, decision, {
      actorPersonId: admin.id,
      correlationId: 'INFORMATION-TEST'
    });

    const unrelatedContainer = await information.createContainer(tenantId, admin.id, {
      containerType: 'DRAWING',
      code: `A-2001-${suffix}`,
      title: 'Unrelated Drawing'
    });
    const unrelatedDecision: Decision = {
      id: asId<'DecisionId'>(`DEC-INFO-OTHER-${suffix}`, 'Decision'),
      tenantId,
      decisionType: 'INFORMATION_RELEASE',
      subjectObjectId: unrelatedContainer.canonicalObjectId,
      subjectVersion: revision.revision,
      outcome: 'APPROVED',
      reason: 'Approval belongs to another Information object.',
      deciderPersonId: admin.id,
      authorityGrantId: authorityGrant.id,
      decidedAt: new Date().toISOString()
    };
    await control.createDecision(tenantId, unrelatedDecision, {
      actorPersonId: admin.id,
      correlationId: 'INFORMATION-TEST'
    });
    await expect(
      information.releaseRevision(tenantId, admin.id, {
        informationRevisionId: revision.id,
        releasedIterationId: frozen.id,
        decisionId: unrelatedDecision.id
      })
    ).rejects.toMatchObject({
      name: 'InformationCommandError',
      code: 'INVALID_INPUT'
    } satisfies Partial<InformationCommandError>);

    const releaseRule: ValidationRuleDefinition = {
      id: asId<'ValidationRuleDefinitionId'>('VRD-INFO-RELEASE-' + suffix, 'Validation Rule Definition'),
      tenantId,
      code: 'INFORMATION-RELEASE-GATE-' + suffix,
      name: 'Information release authority gate',
      ruleType: 'CONSISTENCY',
      version: 1,
      severity: 'BLOCKING',
      handlerKey: 'subject.field_equals',
      configuration: { field: 'authorityBacked', expected: true },
      status: 'ACTIVE'
    };
    await validationPolicies.createRuleDefinition(releaseRule, {
      actorPersonId: admin.id,
      correlationId: 'INFORMATION-TEST'
    });

    const releaseRuleSet: ValidationRuleSet = {
      id: asId<'ValidationRuleSetId'>('VRS-INFO-RELEASE-' + suffix, 'Validation Rule Set'),
      tenantId,
      code: 'INFORMATION_RELEASE',
      name: 'Information Release Gate',
      version: 1,
      status: 'ACTIVE'
    };
    await validationPolicies.createRuleSet(releaseRuleSet, {
      actorPersonId: admin.id,
      correlationId: 'INFORMATION-TEST'
    });

    const releaseMember: ValidationRuleSetMember = {
      id: asId<'ValidationRuleSetMemberId'>('VRM-INFO-RELEASE-' + suffix, 'Validation Rule Set Member'),
      tenantId,
      ruleSetId: releaseRuleSet.id,
      ruleDefinitionId: releaseRule.id,
      sequence: 10,
      mandatory: true,
      status: 'ACTIVE'
    };
    await validationPolicies.addRuleSetMember(releaseMember, {
      actorPersonId: admin.id,
      correlationId: 'INFORMATION-TEST'
    });

    const released = await information.releaseRevision(tenantId, admin.id, {
      informationRevisionId: revision.id,
      releasedIterationId: frozen.id,
      decisionId: decision.id
    });
    expect(released.status).toBe('RELEASED');

    const [validationRows] = await pool.query<Array<RowDataPacket & { evaluation_status: string }>>(
      `SELECT evaluation_status
         FROM validation_rule_evaluation_runs
        WHERE tenant_id = ? AND rule_set_id = ? AND subject_object_id = ?
        ORDER BY evaluated_at DESC
        LIMIT 1`,
      [tenantId, releaseRuleSet.id, container.canonicalObjectId]
    );
    expect(validationRows[0]?.evaluation_status).toBe('PASSED');

    const issue = await information.issueInformation(tenantId, admin.id, {
      informationContainerId: container.id,
      informationRevisionId: revision.id,
      representationId: representation.id,
      issueReference: `ISS-${suffix}`,
      issuePurpose: 'FOR CONSTRUCTION',
      recipientContext: 'Main Contractor'
    });

    const projection = await reads.getProjection(tenantId);
    expect(projection.containers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
        id: container.id,
        canonicalObjectId: container.canonicalObjectId,
        revisions: [
          expect.objectContaining({
            id: revision.id,
            status: 'RELEASED',
            releaseDecisionId: decision.id,
            iterations: [
              expect.objectContaining({
                id: iteration.id,
                status: 'FROZEN',
                representations: [expect.objectContaining({ id: representation.id })]
              })
            ]
          })
        ],
          issues: [expect.objectContaining({ id: issue.id, issuePurpose: 'FOR CONSTRUCTION' })]
        })
      ])
    );
    expect(projection.releaseDecisions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: decision.id,
          informationContainerId: container.id,
          subjectVersion: 'A',
          authorityGrantId: authorityGrant.id
        })
      ])
    );

    const [objectRows] = await pool.query<Array<RowDataPacket & { object_type: string; stable_key: string }>>(
      'SELECT object_type, stable_key FROM canonical_objects WHERE tenant_id = ? AND id = ?',
      [tenantId, container.canonicalObjectId]
    );
    expect(objectRows[0]).toMatchObject({
      object_type: 'INFORMATION_CONTAINER',
      stable_key: `INFORMATION:A-1001-${suffix.toUpperCase()}`
    });

    await expect(
      information.createContainer(tenantId, worker.id, {
        containerType: 'DRAWING',
        code: `UNAUTH-${suffix}`,
        title: 'Unauthorised'
      })
    ).rejects.toMatchObject({
      name: 'InformationCommandError',
      code: 'PERMISSION_DENIED'
    } satisfies Partial<InformationCommandError>);
  });
});
