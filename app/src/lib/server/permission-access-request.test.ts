import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let accessRequestService: typeof import('./permission-access-request');
let workService: typeof import('./shared-work');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  accessRequestService = await import('./permission-access-request');
  workService = await import('./shared-work');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

describe('permission access request runtime', () => {
  it('routes denied access to tenant administrators through governed My Work', async () => {
    const tenant = 'access-request-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const admin = await contextService.resolveDevelopmentCommandContext(tenant);
    const requester = {
      ...admin,
      permissions: admin.permissions.filter((permission) => permission !== 'party.create')
    };
    const requestedPath = `/${tenant}/app/admin/master-data/organisations`;

    const first = await accessRequestService.requestPermissionAccess(requester, {
      permissionKey: 'party.create',
      requestedPath
    });
    expect(first.created).toBe(true);
    expect(first.alreadyAuthorized).toBe(false);
    expect(first.workItemId).toBeTruthy();

    const duplicate = await accessRequestService.requestPermissionAccess(requester, {
      permissionKey: 'party.create',
      requestedPath
    });
    expect(duplicate.created).toBe(false);
    expect(duplicate.workItemId).toBe(first.workItemId);

    const assignment = await db.queryOne<any>(
      `SELECT wi.work_type AS workType, wi.status, rd.role_key AS roleKey,
              par.permission_key AS permissionKey, par.requested_path AS requestedPath
         FROM permission_access_requests par
         JOIN work_items wi ON wi.id = par.work_item_id
         JOIN work_assignments wa ON wa.work_item_id = wi.id AND wa.status = 'ACTIVE'
         JOIN role_definitions rd ON rd.id = wa.assignee_id AND wa.assignee_type = 'ROLE'
        WHERE par.id = ? AND par.tenant_id = ?`,
      [first.requestId, admin.tenantId]
    );
    expect(assignment).toMatchObject({
      workType: 'ACCESS_REQUEST',
      status: 'ASSIGNED',
      roleKey: 'tenant-admin',
      permissionKey: 'party.create',
      requestedPath
    });

    const adminWork = await workService.listMyWork(admin);
    const item = adminWork.find((candidate) => candidate.id === first.workItemId);
    expect(item?.workType).toBe('ACCESS_REQUEST');
    expect(item?.instructions).toContain('party.create');

    await workService.completeWorkItem(
      admin,
      first.workItemId!,
      item!.version,
      'Role-based access reviewed.'
    );

    const next = await accessRequestService.requestPermissionAccess(requester, {
      permissionKey: 'party.create',
      requestedPath
    });
    expect(next.created).toBe(true);
    expect(next.workItemId).not.toBe(first.workItemId);
  });

  it('does not create an access request for authority the actor already holds', async () => {
    const tenant = 'access-authorized-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const result = await accessRequestService.requestPermissionAccess(context, {
      permissionKey: 'party.create',
      requestedPath: `/${tenant}/app/admin/master-data/organisations`
    });
    expect(result).toEqual({
      requestId: null,
      workItemId: null,
      created: false,
      alreadyAuthorized: true
    });
  });
});
