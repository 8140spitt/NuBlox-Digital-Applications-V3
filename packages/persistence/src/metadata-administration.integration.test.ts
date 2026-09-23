import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  PLATFORM_ADMINISTRATOR_ROLE_ID,
  asId,
  type AccessRoleAssignment,
  type Party,
  type Person,
  type Tenant
} from '@nublox/kernel';
import { MySqlAccessRepository } from './access-repository.js';
import {
  MetadataAdministrationCommandError,
  MySqlMetadataAdministrationCommandService
} from './metadata-administration-command-service.js';
import { MySqlMetadataAdministrationReadRepository } from './metadata-administration-read-repository.js';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('governed metadata administration', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('creates governed metadata and resolves inherited effective attributes', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const tenantId = asId<'TenantId'>('TENANT-METADATA-' + suffix, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const access = new MySqlAccessRepository(pool);
    const commands = new MySqlMetadataAdministrationCommandService(pool);
    const reads = new MySqlMetadataAdministrationReadRepository(pool);

    const tenant: Tenant = {
      id: tenantId,
      name: 'Metadata Administration Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant);

    async function person(label: string): Promise<Person> {
      const party: Party = {
        id: asId<'PartyId'>('PARTY-' + label + '-' + suffix, 'Party'),
        tenantId,
        kind: 'PERSON',
        displayName: label,
        status: 'ACTIVE'
      };
      await kernel.createParty(tenantId, party);
      const result: Person = {
        id: asId<'PersonId'>('PERSON-' + label + '-' + suffix, 'Person'),
        tenantId,
        partyId: party.id,
        legalName: label,
        status: 'ACTIVE'
      };
      await kernel.createPerson(tenantId, result);
      return result;
    }

    const admin = await person('Metadata-Admin');
    const worker = await person('Metadata-Worker');

    const assignment: AccessRoleAssignment = {
      id: asId<'AccessRoleAssignmentId'>('ARA-METADATA-' + suffix, 'Access Role Assignment'),
      tenantId,
      accessRoleId: PLATFORM_ADMINISTRATOR_ROLE_ID,
      principalType: 'PERSON',
      principalId: admin.id,
      scopeType: 'TENANT',
      effectiveFrom: '2026-09-23T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await access.assignAccessRole(tenantId, assignment, {
      actorPersonId: admin.id,
      correlationId: 'METADATA-TEST'
    });

    await expect(commands.createTypeDefinition(tenantId, worker.id, {
      code: 'DENIED',
      name: 'Denied',
      objectFamily: 'INFORMATION_CONTAINER'
    })).rejects.toMatchObject({
      name: 'MetadataAdministrationCommandError',
      code: 'PERMISSION_DENIED'
    } satisfies Partial<MetadataAdministrationCommandError>);

    const enumeration = await commands.createEnumerationDefinition(tenantId, admin.id, {
      code: 'DRAWING_PURPOSE',
      name: 'Drawing purpose'
    });
    await commands.addEnumerationValue(tenantId, admin.id, {
      enumerationDefinitionId: enumeration.id,
      code: 'CONSTRUCTION',
      label: 'For Construction',
      sequence: 10
    });
    await commands.addEnumerationValue(tenantId, admin.id, {
      enumerationDefinitionId: enumeration.id,
      code: 'INFORMATION',
      label: 'For Information',
      sequence: 20
    });

    const baseType = await commands.createTypeDefinition(tenantId, admin.id, {
      code: 'TECHNICAL_INFORMATION',
      name: 'Technical Information',
      objectFamily: 'INFORMATION_CONTAINER'
    });
    const drawingType = await commands.createTypeDefinition(tenantId, admin.id, {
      code: 'DRAWING',
      name: 'Drawing',
      objectFamily: 'INFORMATION_CONTAINER',
      parentTypeDefinitionId: baseType.id
    });

    const title = await commands.createAttributeDefinition(tenantId, admin.id, {
      code: 'TITLE',
      name: 'Title',
      dataType: 'STRING'
    });
    const purpose = await commands.createAttributeDefinition(tenantId, admin.id, {
      code: 'PURPOSE',
      name: 'Purpose',
      dataType: 'ENUMERATION',
      enumerationDefinitionId: enumeration.id
    });
    const baseTitle = await commands.assignAttributeToType(tenantId, admin.id, {
      typeDefinitionId: baseType.id,
      attributeDefinitionId: title.id,
      sequence: 10,
      required: true
    });
    await commands.assignAttributeToType(tenantId, admin.id, {
      typeDefinitionId: drawingType.id,
      attributeDefinitionId: purpose.id,
      sequence: 20,
      required: true
    });

    const requiredConstraint = await commands.createConstraintDefinition(tenantId, admin.id, {
      code: 'TITLE_REQUIRED',
      name: 'Title required',
      constraintType: 'REQUIRED',
      configuration: {}
    });
    await commands.assignConstraintToAttribute(tenantId, admin.id, {
      typeAttributeAssignmentId: baseTitle.id,
      constraintDefinitionId: requiredConstraint.id,
      sequence: 10
    });

    const projection = await reads.getProjection(tenantId, admin.id);
    const drawingEffective = projection.effectiveTypeAttributes
      .filter((item) => item.requestedTypeDefinitionId === drawingType.id);

    expect(drawingEffective).toEqual(expect.arrayContaining([
      expect.objectContaining({
        attributeCode: 'TITLE',
        inherited: true,
        sourceTypeDefinitionId: baseType.id
      }),
      expect.objectContaining({
        attributeCode: 'PURPOSE',
        inherited: false,
        sourceTypeDefinitionId: drawingType.id
      })
    ]));
    expect(projection.enumerations[0]?.values).toHaveLength(2);
    expect(projection.constraintAssignments).toEqual(expect.arrayContaining([
      expect.objectContaining({ typeAttributeAssignmentId: baseTitle.id })
    ]));

    await expect(reads.getProjection(tenantId, worker.id)).rejects.toMatchObject({
      name: 'MetadataAdministrationReadError',
      code: 'PERMISSION_DENIED'
    });
  });
});
