import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  PLATFORM_ADMINISTRATOR_ROLE_ID,
  asId,
  type AccessRoleAssignment,
  type JobProfile,
  type Party,
  type Person,
  type Tenant
} from '@nublox/kernel';
import { MySqlAccessRepository } from './access-repository.js';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import {
  MySqlOrganisationCommandService,
  OrganisationCommandError
} from './organisation-command-service.js';
import { MySqlOrganisationReadRepository } from './organisation-read-repository.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('organisation administration command service', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('creates governed Organisation structure for an authorised administrator and denies an ordinary Person', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const tenantId = asId<'TenantId'>(`TENANT-ORG-CMD-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const access = new MySqlAccessRepository(pool);
    const commands = new MySqlOrganisationCommandService(pool);
    const reads = new MySqlOrganisationReadRepository(pool);

    const tenant: Tenant = {
      id: tenantId,
      name: 'Organisation Command Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant);

    const adminParty: Party = {
      id: asId<'PartyId'>(`PARTY-ADMIN-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Platform Administrator',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, adminParty);

    const adminPerson: Person = {
      id: asId<'PersonId'>(`PERSON-ADMIN-${suffix}`, 'Person'),
      tenantId,
      partyId: adminParty.id,
      legalName: 'Platform Administrator',
      preferredName: 'Admin',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, adminPerson);

    const ordinaryParty: Party = {
      id: asId<'PartyId'>(`PARTY-USER-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Ordinary User',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, ordinaryParty);

    const ordinaryPerson: Person = {
      id: asId<'PersonId'>(`PERSON-USER-${suffix}`, 'Person'),
      tenantId,
      partyId: ordinaryParty.id,
      legalName: 'Ordinary User',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, ordinaryPerson);

    const assignment: AccessRoleAssignment = {
      id: asId<'AccessRoleAssignmentId'>(
        `ARA-ORG-CMD-${suffix}`,
        'Access Role Assignment'
      ),
      tenantId,
      accessRoleId: PLATFORM_ADMINISTRATOR_ROLE_ID,
      principalType: 'PERSON',
      principalId: adminPerson.id,
      scopeType: 'TENANT',
      effectiveFrom: '2026-09-21T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await access.assignAccessRole(tenantId, assignment, {
      actorPersonId: adminPerson.id,
      correlationId: 'ORG-COMMAND-TEST'
    });

    const jobProfile: JobProfile = {
      id: asId<'JobProfileId'>(`JOB-ORG-CMD-${suffix}`, 'Job Profile'),
      catalogueScope: 'TENANT',
      tenantId,
      code: 'PM',
      name: 'Project Manager',
      status: 'ACTIVE'
    };
    await kernel.createJobProfile(jobProfile, { actorPersonId: adminPerson.id });

    const organisation = await commands.createOrganisation(
      tenantId,
      adminPerson.id,
      {
        legalName: 'NuBlox Command Test Limited',
        tradingName: 'NuBlox Command Test'
      }
    );

    const unit = await commands.createOrganisationUnit(
      tenantId,
      adminPerson.id,
      {
        organisationId: organisation.id,
        code: 'DELIVERY',
        name: 'Delivery'
      }
    );

    const createdPerson = await commands.createPerson(
      tenantId,
      adminPerson.id,
      {
        legalName: 'Delivery Manager',
        preferredName: 'Delivery Manager'
      }
    );

    const position = await commands.createPosition(
      tenantId,
      adminPerson.id,
      {
        organisationUnitId: unit.id,
        jobProfileId: jobProfile.id,
        code: 'PM-01',
        title: 'Project Manager'
      }
    );

    const occupancy = await commands.assignPersonToPosition(
      tenantId,
      adminPerson.id,
      {
        positionId: position.id,
        personId: createdPerson.id,
        effectiveFrom: '2026-09-21T09:00:00.000Z'
      }
    );

    expect(occupancy.positionId).toBe(position.id);
    expect(occupancy.personId).toBe(createdPerson.id);

    const projection = await reads.getStructure(
      tenantId,
      '2026-09-21T12:00:00.000Z'
    );

    expect(projection.organisations).toEqual([
      expect.objectContaining({
        id: organisation.id,
        tradingName: 'NuBlox Command Test',
        units: [
          expect.objectContaining({
            id: unit.id,
            positions: [
              expect.objectContaining({
                id: position.id,
                jobProfileId: jobProfile.id,
                occupants: [
                  expect.objectContaining({
                    personId: createdPerson.id,
                    personName: 'Delivery Manager'
                  })
                ]
              })
            ]
          })
        ]
      })
    ]);

    expect(projection.jobProfiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: jobProfile.id,
          code: 'PM',
          name: 'Project Manager',
          catalogueScope: 'TENANT'
        })
      ])
    );

    const [canonicalRows] = await pool.query(
      `SELECT object_type, stable_key
         FROM canonical_objects
        WHERE tenant_id = ?
          AND stable_key IN (?, ?, ?, ?)`,
      [tenantId, organisation.id, unit.id, createdPerson.id, position.id]
    );
    expect(canonicalRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ object_type: 'ORGANISATION', stable_key: organisation.id }),
        expect.objectContaining({ object_type: 'ORGANISATION_UNIT', stable_key: unit.id }),
        expect.objectContaining({ object_type: 'PERSON', stable_key: createdPerson.id }),
        expect.objectContaining({ object_type: 'POSITION', stable_key: position.id })
      ])
    );

    const [auditRows] = await pool.query(
      `SELECT entity_type, action
         FROM kernel_audit_entries
        WHERE tenant_id = ?
          AND correlation_id = 'ORGANISATION-ADMIN'`,
      [tenantId]
    );
    expect(auditRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ entity_type: 'ORGANISATION', action: 'CREATED' }),
        expect.objectContaining({ entity_type: 'ORGANISATION_UNIT', action: 'CREATED' }),
        expect.objectContaining({ entity_type: 'PERSON', action: 'CREATED' }),
        expect.objectContaining({ entity_type: 'POSITION', action: 'CREATED' }),
        expect.objectContaining({ entity_type: 'POSITION_OCCUPANCY', action: 'CREATED' })
      ])
    );

    const [outboxRows] = await pool.query(
      `SELECT aggregate_type, event_type
         FROM outbox_messages
        WHERE tenant_id = ?
          AND aggregate_id IN (?, ?, ?, ?, ?)`,
      [tenantId, organisation.id, unit.id, createdPerson.id, position.id, occupancy.id]
    );
    expect(outboxRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ aggregate_type: 'ORGANISATION', event_type: 'ORGANISATION.CREATED' }),
        expect.objectContaining({ aggregate_type: 'ORGANISATION_UNIT', event_type: 'ORGANISATION_UNIT.CREATED' }),
        expect.objectContaining({ aggregate_type: 'PERSON', event_type: 'PERSON.CREATED' }),
        expect.objectContaining({ aggregate_type: 'POSITION', event_type: 'POSITION.CREATED' }),
        expect.objectContaining({ aggregate_type: 'POSITION_OCCUPANCY', event_type: 'POSITION_OCCUPANCY.CREATED' })
      ])
    );

    await expect(
      commands.createOrganisation(tenantId, ordinaryPerson.id, {
        legalName: 'Unauthorised Organisation'
      })
    ).rejects.toMatchObject<Partial<OrganisationCommandError>>({
      name: 'OrganisationCommandError',
      code: 'PERMISSION_DENIED'
    });

    const [deniedRows] = await pool.query(
      'SELECT COUNT(*) AS count FROM organisations WHERE tenant_id = ? AND legal_name = ?',
      [tenantId, 'Unauthorised Organisation']
    );
    expect(Number((deniedRows as Array<{ count: number }>)[0]?.count)).toBe(0);
  });
});
