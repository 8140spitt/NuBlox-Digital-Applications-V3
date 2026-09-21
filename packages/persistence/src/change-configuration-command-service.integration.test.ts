import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  PLATFORM_ADMINISTRATOR_ROLE_ID,
  asId,
  type AccessRoleAssignment,
  type AuthorityDefinition,
  type AuthorityGrant,
  type CanonicalObjectIdentity,
  type Decision,
  type Party,
  type Person,
  type Tenant
} from '@nublox/kernel';
import { MySqlAccessRepository } from './access-repository.js';
import {
  ChangeConfigurationCommandError,
  MySqlChangeConfigurationCommandService
} from './change-configuration-command-service.js';
import { MySqlKernelControlRepository } from './control-repository.js';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('change and configuration command service', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('requires configuration permission and Authority-backed Change Decisions', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const tenantId = asId<'TenantId'>(`TENANT-CFG-CMD-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const access = new MySqlAccessRepository(pool);
    const control = new MySqlKernelControlRepository(pool);
    const service = new MySqlChangeConfigurationCommandService(pool);

    const tenant: Tenant = {
      id: tenantId,
      name: 'Configuration Command Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant);

    async function createPerson(label: string): Promise<Person> {
      const party: Party = {
        id: asId<'PartyId'>(`PARTY-CFG-CMD-${label}-${suffix}`, 'Party'),
        tenantId,
        kind: 'PERSON',
        displayName: label,
        status: 'ACTIVE'
      };
      await kernel.createParty(tenantId, party);
      const person: Person = {
        id: asId<'PersonId'>(`PERSON-CFG-CMD-${label}-${suffix}`, 'Person'),
        tenantId,
        partyId: party.id,
        legalName: label,
        status: 'ACTIVE'
      };
      await kernel.createPerson(tenantId, person);
      return person;
    }

    const admin = await createPerson('Configuration Administrator');
    const worker = await createPerson('Unprivileged Worker');

    const assignment: AccessRoleAssignment = {
      id: asId<'AccessRoleAssignmentId'>(`ARA-CFG-CMD-${suffix}`, 'Access Role Assignment'),
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
      correlationId: 'CONFIGURATION-COMMAND-TEST'
    });

    await expect(
      service.raiseChange(tenantId, worker.id, {
        code: `CHG-DENIED-${suffix}`,
        title: 'Denied Change',
        description: 'Permission gate must reject this.',
        changeType: 'DESIGN_CHANGE'
      })
    ).rejects.toMatchObject({
      name: 'ChangeConfigurationCommandError',
      code: 'PERMISSION_DENIED'
    } satisfies Partial<ChangeConfigurationCommandError>);

    const change = await service.raiseChange(tenantId, admin.id, {
      code: `CHG-${suffix}`,
      title: 'Coordinate revised façade information',
      description: 'Assess the impact and govern implementation.',
      changeType: 'DESIGN_CHANGE'
    });
    await service.startAssessment(tenantId, admin.id, change.id);

    const targetObject: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`OBJ-CFG-CMD-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'INFORMATION_CONTAINER',
      stableKey: `A-2001-${suffix}`,
      createdAt: new Date().toISOString()
    };
    await kernel.createCanonicalObject(tenantId, targetObject, {
      actorPersonId: admin.id
    });

    await service.addAffectedObject(tenantId, admin.id, {
      changeId: change.id,
      subjectObjectId: targetObject.id,
      subjectVersion: 'A',
      disposition: 'MODIFY',
      rationale: 'Façade drawing requires revision.'
    });
    await service.addImpactAssessment(tenantId, admin.id, {
      changeId: change.id,
      domain: 'DESIGN',
      impactLevel: 'MEDIUM',
      summary: 'Drawing coordination and one-day review impact.',
      scheduleImpactDays: 1
    });
    await service.submitForDecision(tenantId, admin.id, change.id);

    const unbackedDecision: Decision = {
      id: asId<'DecisionId'>(`DEC-CFG-UNBACKED-${suffix}`, 'Decision'),
      tenantId,
      decisionType: 'CHANGE_APPROVAL',
      subjectObjectId: change.canonicalObjectId,
      outcome: 'APPROVED',
      reason: 'Approval without Authority must not be executable.',
      deciderPersonId: admin.id,
      decidedAt: new Date().toISOString()
    };
    await control.createDecision(tenantId, unbackedDecision, {
      actorPersonId: admin.id,
      correlationId: 'CONFIGURATION-COMMAND-TEST'
    });

    await expect(
      service.applyDecision(tenantId, admin.id, {
        changeId: change.id,
        decisionId: unbackedDecision.id
      })
    ).rejects.toMatchObject({
      name: 'ChangeConfigurationCommandError',
      code: 'INVALID_INPUT'
    } satisfies Partial<ChangeConfigurationCommandError>);

    const authorityDefinition: AuthorityDefinition = {
      id: asId<'AuthorityDefinitionId'>(`AUTH-CFG-${suffix}`, 'Authority Definition'),
      tenantId,
      code: `CHANGE_APPROVAL_${suffix}`,
      name: 'Change Approval Authority',
      authorityType: 'TECHNICAL',
      status: 'ACTIVE'
    };
    await kernel.createAuthorityDefinition(tenantId, authorityDefinition, {
      actorPersonId: admin.id
    });

    const authorityGrant: AuthorityGrant = {
      id: asId<'AuthorityGrantId'>(`AUTH-GRANT-CFG-${suffix}`, 'Authority Grant'),
      tenantId,
      authorityDefinitionId: authorityDefinition.id,
      granteeType: 'PERSON',
      granteeId: admin.id,
      scopeType: 'TENANT',
      effectiveFrom: '2026-09-21T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await kernel.createAuthorityGrant(tenantId, authorityGrant, {
      actorPersonId: admin.id
    });

    const governedDecision: Decision = {
      id: asId<'DecisionId'>(`DEC-CFG-${suffix}`, 'Decision'),
      tenantId,
      decisionType: 'CHANGE_APPROVAL',
      subjectObjectId: change.canonicalObjectId,
      outcome: 'APPROVED',
      reason: 'Impact assessment accepted and Change authorised.',
      deciderPersonId: admin.id,
      authorityGrantId: authorityGrant.id,
      decidedAt: new Date().toISOString()
    };
    await control.createDecision(tenantId, governedDecision, {
      actorPersonId: admin.id,
      correlationId: 'CONFIGURATION-COMMAND-TEST'
    });

    const approved = await service.applyDecision(tenantId, admin.id, {
      changeId: change.id,
      decisionId: governedDecision.id
    });
    expect(approved.status).toBe('APPROVED');
    expect(approved.decisionId).toBe(governedDecision.id);
  });
});
