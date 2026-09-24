import { randomUUID } from 'node:crypto';
import { afterAll,beforeAll,describe,expect,it } from 'vitest';
import {
  ENTERPRISE_RELATIONSHIP_VOCABULARY,
  ENTERPRISE_THING_VOCABULARY,
  PLATFORM_ADMINISTRATOR_ROLE_ID,
  asId,
  type AccessRoleAssignment,
  type Party,
  type Person,
  type Tenant
} from '@nublox/kernel';
import type { RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { createDatabasePool } from './database.js';
import { MySqlEnterpriseVocabularyProvisioningService } from './enterprise-vocabulary-provisioning-service.js';
import { migrate } from './migrations.js';
import { MySqlOrganisationCommandService } from './organisation-command-service.js';
import { MySqlKernelRepository } from './repository.js';
import { MySqlThingAdministrationReadRepository } from './thing-administration-read-repository.js';

interface CanonicalRow extends RowDataPacket {
  id:string;
  object_type:string;
  stable_key:string;
  type_definition_id:string|null;
}

const enabled=Boolean(process.env.NUBLOX_DATABASE_URL);
const suite=enabled?describe:describe.skip;
const pool=enabled?createDatabasePool():undefined;

suite('enterprise Thing vocabulary provisioning',()=>{
  beforeAll(async()=>{await migrate();});
  afterAll(async()=>{await pool?.end();});

  it('binds native authoritative identities into one governed Thing graph without duplication',async()=>{
    if(!pool) throw new Error('Database pool missing.');

    const suffix=randomUUID().replaceAll('-','').slice(0,12);
    const tenantId=asId<'TenantId'>(`TENANT-VOCAB-${suffix}`,'Tenant');
    const kernel=new MySqlKernelRepository(pool);
    const access=new MySqlAccessRepository(pool);
    const organisation=new MySqlOrganisationCommandService(pool);
    const vocabulary=new MySqlEnterpriseVocabularyProvisioningService(pool);
    const thingReads=new MySqlThingAdministrationReadRepository(pool);

    const tenant:Tenant={id:tenantId,name:'Enterprise Vocabulary Test',status:'ACTIVE'};
    await kernel.createTenant(tenant);

    const adminParty:Party={
      id:asId<'PartyId'>(`PARTY-VOCAB-${suffix}`,'Party'),
      tenantId,kind:'PERSON',displayName:'Vocabulary Administrator',status:'ACTIVE'
    };
    await kernel.createParty(tenantId,adminParty);
    const admin:Person={
      id:asId<'PersonId'>(`PERSON-VOCAB-${suffix}`,'Person'),
      tenantId,partyId:adminParty.id,legalName:'Vocabulary Administrator',status:'ACTIVE'
    };
    await kernel.createPerson(tenantId,admin);
    const role:AccessRoleAssignment={
      id:asId<'AccessRoleAssignmentId'>(`ARA-VOCAB-${suffix}`,'Access Role Assignment'),
      tenantId,accessRoleId:PLATFORM_ADMINISTRATOR_ROLE_ID,principalType:'PERSON',
      principalId:admin.id,scopeType:'TENANT',
      effectiveFrom:'2026-09-24T00:00:00.000Z',status:'ACTIVE'
    };
    await access.assignAccessRole(tenantId,role,{actorPersonId:admin.id,correlationId:suffix});

    const first=await vocabulary.provision(tenantId,admin.id);
    expect(first).toMatchObject({
      typeDefinitions:ENTERPRISE_THING_VOCABULARY.length,
      relationshipTypeDefinitions:ENTERPRISE_RELATIONSHIP_VOCABULARY.length,
      nativeTypeBindings:ENTERPRISE_THING_VOCABULARY.length
    });

    const second=await vocabulary.provision(tenantId,admin.id);
    expect(second).toMatchObject({
      typeDefinitions:ENTERPRISE_THING_VOCABULARY.length,
      relationshipTypeDefinitions:ENTERPRISE_RELATIONSHIP_VOCABULARY.length,
      nativeTypeBindings:0,
      nativeRelationshipBindings:0
    });

    const company=await organisation.createOrganisation(tenantId,admin.id,{
      legalName:'Integrated Construction Group Limited',
      tradingName:'Integrated Construction Group'
    });
    const sales=await organisation.createOrganisationUnit(tenantId,admin.id,{
      organisationId:company.id,code:'SALES',name:'Sales'
    });
    const salesDirector=await organisation.createPosition(tenantId,admin.id,{
      organisationUnitId:sales.id,code:'SALES-DIRECTOR',title:'Sales Director'
    });
    const seller=await organisation.createPerson(tenantId,admin.id,{
      legalName:'Sam Seller',preferredName:'Sam'
    });

    const [canonical]=await pool.execute<CanonicalRow[]>(
      `SELECT id,object_type,stable_key,type_definition_id
         FROM canonical_objects
        WHERE tenant_id=? AND stable_key IN (?,?,?,?)
        ORDER BY object_type`,
      [tenantId,company.id,sales.id,salesDirector.id,seller.id]
    );
    expect(canonical).toHaveLength(4);
    expect(canonical.every(row=>row.type_definition_id===null)).toBe(true);

    const byStableKey=new Map(canonical.map(row=>[row.stable_key,row]));
    const organisationObject=byStableKey.get(company.id);
    const unitObject=byStableKey.get(sales.id);
    const positionObject=byStableKey.get(salesDirector.id);
    const personObject=byStableKey.get(seller.id);
    expect(organisationObject&&unitObject&&positionObject&&personObject).toBeTruthy();

    const [organisationThing,unitThing,positionThing,personThing]=await Promise.all([
      thingReads.getThing(tenantId,admin.id,organisationObject!.id),
      thingReads.getThing(tenantId,admin.id,unitObject!.id),
      thingReads.getThing(tenantId,admin.id,positionObject!.id),
      thingReads.getThing(tenantId,admin.id,personObject!.id)
    ]);

    expect(organisationThing).toMatchObject({
      id:organisationObject!.id,typeCode:'ORGANISATION',objectFamily:'PARTY'
    });
    expect(unitThing).toMatchObject({
      id:unitObject!.id,typeCode:'ORGANISATION_UNIT',objectFamily:'ORGANISATION'
    });
    expect(positionThing).toMatchObject({
      id:positionObject!.id,typeCode:'POSITION',objectFamily:'HCM'
    });
    expect(personThing).toMatchObject({
      id:personObject!.id,typeCode:'PERSON',objectFamily:'PARTY'
    });

    expect(organisationThing?.relationships).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code:'ORGANISATION_CONTAINS_UNIT',
        direction:'OUTGOING',
        otherThingId:unitObject!.id
      })
    ]));
    expect(unitThing?.relationships).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code:'UNIT_HAS_POSITION',
        direction:'OUTGOING',
        otherThingId:positionObject!.id
      })
    ]));

    const allThings=await thingReads.listThings(tenantId,admin.id);
    expect(allThings).toEqual(expect.arrayContaining([
      expect.objectContaining({id:organisationObject!.id,typeCode:'ORGANISATION'}),
      expect.objectContaining({id:unitObject!.id,typeCode:'ORGANISATION_UNIT'}),
      expect.objectContaining({id:positionObject!.id,typeCode:'POSITION'}),
      expect.objectContaining({id:personObject!.id,typeCode:'PERSON'})
    ]));
  });
});
