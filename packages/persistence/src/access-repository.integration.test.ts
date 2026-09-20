import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  asId,
  type AccessRoleAssignment,
  type AccessRoleDefinition,
  type AccessRolePermission,
  type JobProfile,
  type Organisation,
  type OrganisationUnit,
  type Party,
  type PermissionDefinition,
  type Person,
  type Position,
  type PositionOccupancy,
  type Tenant
} from '@nublox/kernel';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('MySQL scoped access runtime', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('resolves permission through current Position and exact Project scope without implying Authority', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = Date.now().toString(36);
    const tenantId = asId<'TenantId'>(`TENANT-ACCESS-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const access = new MySqlAccessRepository(pool);

    const tenant: Tenant = {
      id: tenantId,
      name: 'Access Runtime Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant);

    const personParty: Party = {
      id: asId<'PartyId'>(`PARTY-P-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Project Approver',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, personParty);

    const person: Person = {
      id: asId<'PersonId'>(`PERSON-${suffix}`, 'Person'),
      tenantId,
      partyId: personParty.id,
      legalName: 'Project Approver',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, person);

    const organisationParty: Party = {
      id: asId<'PartyId'>(`PARTY-O-${suffix}`, 'Party'),
      tenantId,
      kind: 'ORGANISATION',
      displayName: 'NuBlox Access Test Ltd',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, organisationParty, {
      actorPersonId: person.id
    });

    const organisation: Organisation = {
      id: asId<'OrganisationId'>(`ORG-${suffix}`, 'Organisation'),
      tenantId,
      partyId: organisationParty.id,
      legalName: 'NuBlox Access Test Ltd',
      status: 'ACTIVE'
    };
    await kernel.createOrganisation(tenantId, organisation, {
      actorPersonId: person.id
    });

    const unit: OrganisationUnit = {
      id: asId<'OrganisationUnitId'>(`UNIT-${suffix}`, 'Organisation Unit'),
      tenantId,
      organisationId: organisation.id,
      code: 'PROJECTS',
      name: 'Projects',
      status: 'ACTIVE'
    };
    await kernel.createOrganisationUnit(tenantId, unit, {
      actorPersonId: person.id
    });

    const profile: JobProfile = {
      id: asId<'JobProfileId'>(`JOB-${suffix}`, 'Job Profile'),
      catalogueScope: 'TENANT',
      tenantId,
      code: 'PM',
      name: 'Project Manager',
      status: 'ACTIVE'
    };
    await kernel.createJobProfile(profile, { actorPersonId: person.id });

    const position: Position = {
      id: asId<'PositionId'>(`POS-${suffix}`, 'Position'),
      tenantId,
      organisationUnitId: unit.id,
      jobProfileId: profile.id,
      code: 'PM-01',
      title: 'Project Manager',
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

    const permission: PermissionDefinition = {
      key: `deliverable.approve.${suffix}`,
      name: 'Approve deliverable',
      description: 'Approve a governed deliverable in an authorised access scope.'
    };
    await access.createPermissionDefinition(permission);

    const role: AccessRoleDefinition = {
      id: asId<'AccessRoleId'>(`ROLE-${suffix}`, 'Access Role'),
      catalogueScope: 'TENANT',
      tenantId,
      code: 'PROJECT_DELIVERABLE_APPROVER',
      name: 'Project Deliverable Approver',
      status: 'ACTIVE'
    };
    await access.createAccessRole(role, { actorPersonId: person.id });

    const rolePermission: AccessRolePermission = {
      id: asId<'AccessRolePermissionId'>(`ROLE-PERM-${suffix}`, 'Access Role Permission'),
      accessRoleId: role.id,
      permissionKey: permission.key
    };
    await access.grantPermissionToRole(rolePermission, {
      actorPersonId: person.id
    });

    const assignment: AccessRoleAssignment = {
      id: asId<'AccessRoleAssignmentId'>(`ROLE-ASG-${suffix}`, 'Access Role Assignment'),
      tenantId,
      accessRoleId: role.id,
      principalType: 'POSITION',
      principalId: position.id,
      scopeType: 'PROJECT',
      scopeId: 'PROJECT-ALPHA',
      effectiveFrom: '2026-09-01T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await access.assignAccessRole(tenantId, assignment, {
      actorPersonId: person.id
    });

    const allowed = await access.evaluatePermission(
      tenantId,
      person.id,
      permission.key,
      { scopeType: 'PROJECT', scopeId: 'PROJECT-ALPHA' },
      '2026-09-20T12:00:00.000Z'
    );

    expect(allowed.allowed).toBe(true);
    expect(allowed.matchedRoleId).toBe(role.id);
    expect(allowed.matchedAssignmentId).toBe(assignment.id);
    expect(allowed.matchedPrincipalType).toBe('POSITION');

    const deniedOtherProject = await access.evaluatePermission(
      tenantId,
      person.id,
      permission.key,
      { scopeType: 'PROJECT', scopeId: 'PROJECT-BETA' },
      '2026-09-20T12:00:00.000Z'
    );

    expect(deniedOtherProject.allowed).toBe(false);
    expect(deniedOtherProject.reason).toContain('No active Access Role Assignment');

    const deniedUnknownPermission = await access.evaluatePermission(
      tenantId,
      person.id,
      'permission.does.not.exist',
      { scopeType: 'PROJECT', scopeId: 'PROJECT-ALPHA' },
      '2026-09-20T12:00:00.000Z'
    );

    expect(deniedUnknownPermission.allowed).toBe(false);
    expect(deniedUnknownPermission.reason).toBe('Permission Definition does not exist.');

    const [authorityRows] = await pool.query(
      'SELECT COUNT(*) AS count FROM authority_grants WHERE tenant_id = ?',
      [tenantId]
    );
    expect(Number((authorityRows as Array<{ count: number }>)[0]?.count)).toBe(0);

    const [auditRows] = await pool.query(
      `SELECT entity_type, action
         FROM kernel_audit_entries
        WHERE tenant_id = ?
          AND entity_type IN ('ACCESS_ROLE', 'ACCESS_ROLE_PERMISSION', 'ACCESS_ROLE_ASSIGNMENT')`,
      [tenantId]
    );

    expect(auditRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ entity_type: 'ACCESS_ROLE', action: 'CREATED' }),
        expect.objectContaining({ entity_type: 'ACCESS_ROLE_PERMISSION', action: 'GRANTED' }),
        expect.objectContaining({ entity_type: 'ACCESS_ROLE_ASSIGNMENT', action: 'ASSIGNED' })
      ])
    );
  });
});
