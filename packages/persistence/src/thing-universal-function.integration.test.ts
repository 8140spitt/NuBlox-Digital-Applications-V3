import { randomUUID } from 'node:crypto';
import { afterAll,beforeAll,describe,expect,it } from 'vitest';
import {
  PLATFORM_ADMINISTRATOR_ROLE_ID,
  asId,
  type AccessRoleAssignment,
  type Party,
  type Person,
  type Tenant
} from '@nublox/kernel';
import { MySqlAccessRepository } from './access-repository.js';
import { createDatabasePool } from './database.js';
import { MySqlHcmCommandService } from './hcm-command-service.js';
import { MySqlHcmReadRepository } from './hcm-read-repository.js';
import { MySqlMetadataAdministrationCommandService } from './metadata-administration-command-service.js';
import { migrate } from './migrations.js';
import { MySqlOrganisationCommandService } from './organisation-command-service.js';
import { MySqlKernelRepository } from './repository.js';
import { MySqlThingAdministrationCommandService } from './thing-administration-command-service.js';
import { MySqlThingAdministrationReadRepository } from './thing-administration-read-repository.js';
import { MySqlUniversalFunctionReadRepository } from './universal-function-read-repository.js';

const enabled=Boolean(process.env.NUBLOX_DATABASE_URL);
const suite=enabled?describe:describe.skip;
const pool=enabled?createDatabasePool():undefined;

suite('universal Function and metadata-driven Thing runtime',()=>{
  beforeAll(async()=>{await migrate();});
  afterAll(async()=>{await pool?.end();});

  it('treats CBE as Functions and executes typed Things and Relationships from metadata',async()=>{
    if(!pool) throw new Error('Database pool missing.');

    const suffix=randomUUID().replaceAll('-','').slice(0,12);
    const tenantId=asId<'TenantId'>(`TENANT-THING-${suffix}`,'Tenant');
    const kernel=new MySqlKernelRepository(pool);
    const access=new MySqlAccessRepository(pool);
    const metadata=new MySqlMetadataAdministrationCommandService(pool);
    const things=new MySqlThingAdministrationCommandService(pool);
    const thingReads=new MySqlThingAdministrationReadRepository(pool);
    const functions=new MySqlUniversalFunctionReadRepository(pool);
    const organisation=new MySqlOrganisationCommandService(pool);
    const hcm=new MySqlHcmCommandService(pool);
    const hcmReads=new MySqlHcmReadRepository(pool);

    const tenant:Tenant={id:tenantId,name:'Thing Runtime Test',status:'ACTIVE'};
    await kernel.createTenant(tenant);

    const adminParty:Party={
      id:asId<'PartyId'>(`PARTY-ADMIN-${suffix}`,'Party'),
      tenantId,kind:'PERSON',displayName:'Platform Administrator',status:'ACTIVE'
    };
    await kernel.createParty(tenantId,adminParty);
    const admin:Person={
      id:asId<'PersonId'>(`PERSON-ADMIN-${suffix}`,'Person'),
      tenantId,partyId:adminParty.id,legalName:'Platform Administrator',status:'ACTIVE'
    };
    await kernel.createPerson(tenantId,admin);

    const role:AccessRoleAssignment={
      id:asId<'AccessRoleAssignmentId'>(`ARA-THING-${suffix}`,'Access Role Assignment'),
      tenantId,accessRoleId:PLATFORM_ADMINISTRATOR_ROLE_ID,principalType:'PERSON',
      principalId:admin.id,scopeType:'TENANT',effectiveFrom:'2026-09-24T00:00:00.000Z',status:'ACTIVE'
    };
    await access.assignAccessRole(tenantId,role,{actorPersonId:admin.id,correlationId:suffix});

    const customerType=await metadata.createTypeDefinition(tenantId,admin.id,{
      code:`CUSTOMER_${suffix}`,name:'Customer',objectFamily:'PARTY'
    });
    const opportunityType=await metadata.createTypeDefinition(tenantId,admin.id,{
      code:`OPPORTUNITY_${suffix}`,name:'Sales Opportunity',objectFamily:'COMMERCIAL'
    });

    const customerName=await metadata.createAttributeDefinition(tenantId,admin.id,{
      code:`CUSTOMER_NAME_${suffix}`,name:'Customer Name',dataType:'STRING'
    });
    const opportunityValue=await metadata.createAttributeDefinition(tenantId,admin.id,{
      code:`OPPORTUNITY_VALUE_${suffix}`,name:'Opportunity Value',dataType:'DECIMAL',unitCode:'GBP'
    });
    const relationshipRole=await metadata.createAttributeDefinition(tenantId,admin.id,{
      code:`RELATIONSHIP_ROLE_${suffix}`,name:'Relationship Role',dataType:'STRING'
    });

    const customerNameAssignment=await metadata.assignAttributeToType(tenantId,admin.id,{
      typeDefinitionId:customerType.id,attributeDefinitionId:customerName.id,sequence:1,required:true
    });
    const opportunityValueAssignment=await metadata.assignAttributeToType(tenantId,admin.id,{
      typeDefinitionId:opportunityType.id,attributeDefinitionId:opportunityValue.id,sequence:1,required:true
    });

    const relationshipType=await things.createRelationshipTypeDefinition(tenantId,admin.id,{
      code:`CUSTOMER_HAS_OPPORTUNITY_${suffix}`,
      name:'Customer has Opportunity',
      inverseName:'Opportunity belongs to Customer',
      fromTypeDefinitionId:customerType.id,
      toTypeDefinitionId:opportunityType.id,
      fromCardinality:'ONE',
      toCardinality:'MANY'
    });
    const relationshipRoleAssignment=await things.assignAttributeToRelationshipType(tenantId,admin.id,{
      relationshipTypeDefinitionId:relationshipType.id,
      attributeDefinitionId:relationshipRole.id,
      sequence:1,
      required:true
    });

    const customer=await things.createThing(tenantId,admin.id,{
      typeDefinitionId:customerType.id,stableKey:'CUST-001',displayName:'Acme Developments',
      fieldValues:[{typeAttributeAssignmentId:customerNameAssignment.id,value:'Acme Developments'}]
    });
    const opportunity=await things.createThing(tenantId,admin.id,{
      typeDefinitionId:opportunityType.id,stableKey:'OPP-001',displayName:'Central Station Redevelopment',
      fieldValues:[{typeAttributeAssignmentId:opportunityValueAssignment.id,value:12500000.50}]
    });

    const relationship=await things.relateThings(tenantId,admin.id,{
      relationshipTypeDefinitionId:relationshipType.id,
      fromThingId:customer.id,toThingId:opportunity.id,
      effectiveFrom:'2026-09-24T12:00:00.000Z',
      fieldValues:[{relationshipAttributeAssignmentId:relationshipRoleAssignment.id,value:'CLIENT'}]
    });

    const customerView=await thingReads.getThing(tenantId,admin.id,customer.id);
    expect(customerView).toMatchObject({
      id:customer.id,typeCode:customerType.code,displayName:'Acme Developments',
      fields:[expect.objectContaining({code:customerName.code,value:'Acme Developments'})]
    });
    expect(customerView?.relationships).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id:relationship.id,direction:'OUTGOING',otherThingId:opportunity.id,
        fields:[expect.objectContaining({code:relationshipRole.code,value:'CLIENT'})]
      })
    ]));

    const anotherCustomer=await things.createThing(tenantId,admin.id,{
      typeDefinitionId:customerType.id,stableKey:'CUST-002',displayName:'Second Client',
      fieldValues:[{typeAttributeAssignmentId:customerNameAssignment.id,value:'Second Client'}]
    });
    await expect(things.relateThings(tenantId,admin.id,{
      relationshipTypeDefinitionId:relationshipType.id,
      fromThingId:anotherCustomer.id,toThingId:opportunity.id,
      effectiveFrom:'2026-09-24T12:00:00.000Z',
      fieldValues:[{relationshipAttributeAssignmentId:relationshipRoleAssignment.id,value:'CLIENT'}]
    })).rejects.toMatchObject({code:'CONFLICT'});

    const functionCounts=await functions.getCounts();
    expect(functionCounts).toEqual({total:45,coreBusiness:29,cbe:16,custom:0});

    const architecture=await functions.getFunction('D01');
    expect(architecture).toMatchObject({
      code:'D01',name:'Architecture & Design',functionFamily:'CBE',industrySolutionId:'CBE'
    });
    expect(architecture?.jobs.some(job=>job.canonicalName==='Architect')).toBe(true);

    const company=await organisation.createOrganisation(tenantId,admin.id,{
      legalName:'Design Practice Limited',tradingName:'Design Practice'
    });
    const designUnit=await organisation.createOrganisationUnit(tenantId,admin.id,{
      organisationId:company.id,code:'ARCH',name:'Architecture'
    });
    const architectPosition=await organisation.createPosition(tenantId,admin.id,{
      organisationUnitId:designUnit.id,jobProfileId:'JP-CBE-003',code:'ARCH-001',title:'Architect'
    });
    const architect=await organisation.createPerson(tenantId,admin.id,{legalName:'Alex Architect'});
    const employment=await hcm.createEmployment(tenantId,admin.id,{
      personId:architect.id,organisationId:company.id,employeeNumber:`ARCH-${suffix}`,
      workerType:'EMPLOYEE',employmentType:'PERMANENT',startDate:'2026-01-01T00:00:00.000Z'
    });
    await hcm.assignPositionToFunction(tenantId,admin.id,{
      positionId:architectPosition.id,functionId:'D01',deploymentPurpose:'FUNCTIONAL_DELIVERY',
      effectiveFrom:'2026-01-01T00:00:00.000Z'
    });
    await hcm.assignEmploymentToPosition(tenantId,admin.id,{
      employmentId:employment.id,positionId:architectPosition.id,isPrimary:true,
      effectiveFrom:'2026-01-01T00:00:00.000Z'
    });

    const architectWorld=await hcmReads.getUserExperience(
      tenantId,architect.id,'2026-09-24T12:00:00.000Z'
    );
    expect(architectWorld).toMatchObject({
      personName:'Alex Architect',
      positionTitle:'Architect',
      functionCode:'D01',
      functionName:'Architecture & Design',
      deploymentPurpose:'FUNCTIONAL_DELIVERY'
    });
  });
});
