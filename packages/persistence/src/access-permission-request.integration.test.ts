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
import { MySqlAccessPermissionRequestRepository } from './access-permission-request-repository.js';
import { MySqlAccessRepository } from './access-repository.js';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlMyWorkRepository } from './my-work-repository.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('access permission request lifecycle', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('moves denied access through administrator My Work to verified fulfilment', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const tenantId = asId<'TenantId'>(`TENANT-ACCESS-REQ-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const access = new MySqlAccessRepository(pool);
    const accessAdmin = new MySqlAccessAdministrationCommandService(pool);
    const requests = new MySqlAccessPermissionRequestRepository(pool);
    const myWork = new MySqlMyWorkRepository(pool);

    const tenant: Tenant = {
      id: tenantId,
      name: 'Access Request Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant);

    const adminParty: Party = {
      id: asId<'PartyId'>(`PARTY-REQ-ADMIN-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Request Administrator',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, adminParty);

    const admin: Person = {
      id: asId<'PersonId'>(`PERSON-REQ-ADMIN-${suffix}`, 'Person'),
      tenantId,
      partyId: adminParty.id,
      legalName: 'Request Administrator',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, admin);

    const userParty: Party = {
      id: asId<'PartyId'>(`PARTY-REQ-USER-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Request User',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, userParty);

    const user: Person = {
      id: asId<'PersonId'>(`PERSON-REQ-USER-${suffix}`, 'Person'),
      tenantId,
      partyId: userParty.id,
      legalName: 'Request User',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, user);

    const administratorAssignment: AccessRoleAssignment = {
      id: asId<'AccessRoleAssignmentId'>(
        `ARA-REQ-ADMIN-${suffix}`,
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
      correlationId: 'ACCESS-REQUEST-TEST'
    });

    const request = await requests.createRequest(tenantId, user.id, {
      permissionKey: PLATFORM_PERMISSION_KEYS.ORGANISATION_READ,
      scopeType: 'TENANT',
      reason: 'I need to inspect the Organisation structure for delivery planning.'
    });

    expect(request.status).toBe('PENDING');

    await expect(
      requests.createRequest(tenantId, user.id, {
        permissionKey: PLATFORM_PERMISSION_KEYS.ORGANISATION_READ,
        scopeType: 'TENANT',
        reason: 'Duplicate request should be rejected.'
      })
    ).rejects.toMatchObject({
      name: 'AccessPermissionRequestError',
      code: 'CONFLICT'
    });

    const administratorWork = await myWork.listMyWork(
      tenantId,
      admin.id,
      '2026-09-21T12:00:00.000Z'
    );
    expect(administratorWork).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'ACCESS_REQUEST',
          sourceId: request.id,
          title: 'Access request: Read Organisation structure'
        })
      ])
    );

    const requesterWork = await myWork.listMyWork(
      tenantId,
      user.id,
      '2026-09-21T12:00:00.000Z'
    );
    expect(
      requesterWork.some((item) => item.kind === 'ACCESS_REQUEST')
    ).toBe(false);

    await expect(
      requests.resolveRequest(
        tenantId,
        admin.id,
        request.id,
        'FULFILLED',
        'Attempting fulfilment before permission exists.'
      )
    ).rejects.toMatchObject({
      name: 'AccessPermissionRequestError',
      code: 'CONFLICT'
    });

    const readerRole = await accessAdmin.createTenantRole(tenantId, admin.id, {
      code: 'ORG-READER',
      name: 'Organisation Reader'
    });
    await accessAdmin.grantPermission(tenantId, admin.id, {
      accessRoleId: readerRole.id,
      permissionKey: PLATFORM_PERMISSION_KEYS.ORGANISATION_READ
    });
    await accessAdmin.assignRole(tenantId, admin.id, {
      accessRoleId: readerRole.id,
      principalType: 'PERSON',
      principalId: user.id,
      scopeType: 'TENANT',
      effectiveFrom: '2026-09-21T08:00:00.000Z'
    });

    const resolved = await requests.resolveRequest(
      tenantId,
      admin.id,
      request.id,
      'FULFILLED',
      'Organisation Reader role assigned in tenant scope.'
    );

    expect(resolved.status).toBe('FULFILLED');
    expect(resolved.resolvedByPersonId).toBe(admin.id);
    expect(await requests.listPending(tenantId)).toHaveLength(0);

    const administratorWorkAfter = await myWork.listMyWork(
      tenantId,
      admin.id,
      '2026-09-21T12:30:00.000Z'
    );
    expect(
      administratorWorkAfter.some(
        (item) => item.kind === 'ACCESS_REQUEST' && item.sourceId === request.id
      )
    ).toBe(false);

    await expect(
      requests.createRequest(tenantId, user.id, {
        permissionKey: PLATFORM_PERMISSION_KEYS.ORGANISATION_READ,
        scopeType: 'TENANT',
        reason: 'This permission is already effective and must not be re-requested.'
      })
    ).rejects.toMatchObject({
      name: 'AccessPermissionRequestError',
      code: 'ALREADY_GRANTED'
    });

    const [auditRows] = await pool.query(
      `SELECT action
         FROM kernel_audit_entries
        WHERE tenant_id = ?
          AND entity_type = 'ACCESS_PERMISSION_REQUEST'
          AND entity_id = ?
        ORDER BY audit_id`,
      [tenantId, request.id]
    );

    expect(auditRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'REQUESTED' }),
        expect.objectContaining({ action: 'FULFILLED' })
      ])
    );
  });
});
