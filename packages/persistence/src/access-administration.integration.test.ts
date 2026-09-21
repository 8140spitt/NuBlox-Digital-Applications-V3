import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  PLATFORM_ADMINISTRATOR_ROLE_ID,
  PLATFORM_PERMISSION_KEYS,
  asId,
  type AccessRoleAssignment,
  type Party,
  type Person,
  type Tenant
} from '@nublox/kernel';
import { MySqlAccessAdministrationCommandService } from './access-administration-command-service.js';
import { MySqlAccessAdministrationReadRepository } from './access-administration-read-repository.js';
import { MySqlAccessRepository } from './access-repository.js';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('access administration services', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('creates tenant roles, grants permissions and assigns them without allowing tenant mutation of platform roles', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const tenantId = asId<'TenantId'>(`TENANT-ACCESS-ADMIN-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const access = new MySqlAccessRepository(pool);
    const commands = new MySqlAccessAdministrationCommandService(pool);
    const reads = new MySqlAccessAdministrationReadRepository(pool);

    const tenant: Tenant = {
      id: tenantId,
      name: 'Access Administration Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant);

    const adminParty: Party = {
      id: asId<'PartyId'>(`PARTY-ACCESS-ADMIN-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Access Administrator',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, adminParty);
    const admin: Person = {
      id: asId<'PersonId'>(`PERSON-ACCESS-ADMIN-${suffix}`, 'Person'),
      tenantId,
      partyId: adminParty.id,
      legalName: 'Access Administrator',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, admin);

    const userParty: Party = {
      id: asId<'PartyId'>(`PARTY-ACCESS-USER-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Access User',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, userParty);
    const user: Person = {
      id: asId<'PersonId'>(`PERSON-ACCESS-USER-${suffix}`, 'Person'),
      tenantId,
      partyId: userParty.id,
      legalName: 'Access User',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, user);

    const administratorAssignment: AccessRoleAssignment = {
      id: asId<'AccessRoleAssignmentId'>(
        `ARA-ACCESS-ADMIN-${suffix}`,
        'Access Role Assignment'
      ),
      tenantId,
      accessRoleId: PLATFORM_ADMINISTRATOR_ROLE_ID,
      principalType: 'PERSON',
      principalId: admin.id,
      scopeType: 'TENANT',
      effectiveFrom: '2026-09-21T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await access.assignAccessRole(tenantId, administratorAssignment, {
      actorPersonId: admin.id,
      correlationId: 'ACCESS-ADMIN-TEST'
    });

    const role = await commands.createTenantRole(tenantId, admin.id, {
      code: 'ORG-READER',
      name: 'Organisation Reader',
      description: 'Read-only Organisation workspace access.'
    });

    const grant = await commands.grantPermission(tenantId, admin.id, {
      accessRoleId: role.id,
      permissionKey: PLATFORM_PERMISSION_KEYS.ORGANISATION_READ
    });

    expect(grant.accessRoleId).toBe(role.id);
    expect(grant.permissionKey).toBe(PLATFORM_PERMISSION_KEYS.ORGANISATION_READ);

    const assignment = await commands.assignRole(tenantId, admin.id, {
      accessRoleId: role.id,
      principalType: 'PERSON',
      principalId: user.id,
      scopeType: 'TENANT',
      effectiveFrom: '2026-09-21T08:00:00.000Z'
    });

    expect(assignment.principalId).toBe(user.id);

    const evaluation = await access.evaluatePermission(
      tenantId,
      user.id,
      PLATFORM_PERMISSION_KEYS.ORGANISATION_READ,
      { scopeType: 'TENANT' },
      '2026-09-21T12:00:00.000Z'
    );
    expect(evaluation.allowed).toBe(true);
    expect(evaluation.matchedRoleId).toBe(role.id);

    const projection = await reads.getProjection(tenantId);
    expect(projection.roles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: role.id,
          catalogueScope: 'TENANT',
          permissionKeys: expect.arrayContaining([
            PLATFORM_PERMISSION_KEYS.ORGANISATION_READ
          ])
        })
      ])
    );
    expect(projection.assignments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: assignment.id,
          accessRoleId: role.id,
          principalType: 'PERSON',
          principalId: user.id,
          principalLabel: 'Access User',
          scopeType: 'TENANT'
        })
      ])
    );

    await expect(
      commands.grantPermission(tenantId, admin.id, {
        accessRoleId: PLATFORM_ADMINISTRATOR_ROLE_ID,
        permissionKey: PLATFORM_PERMISSION_KEYS.ORGANISATION_READ
      })
    ).rejects.toMatchObject({
      name: 'AccessAdministrationCommandError',
      code: 'PERMISSION_DENIED'
    });

    await expect(
      commands.createTenantRole(tenantId, user.id, {
        code: 'UNAUTHORISED',
        name: 'Unauthorised Role'
      })
    ).rejects.toMatchObject({
      name: 'AccessAdministrationCommandError',
      code: 'PERMISSION_DENIED'
    });
  });
});
