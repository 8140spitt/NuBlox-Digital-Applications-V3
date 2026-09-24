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
import type { RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { createDatabasePool } from './database.js';
import { MySqlHcmCommandService } from './hcm-command-service.js';
import { migrate } from './migrations.js';
import { MySqlOrganisationCommandService } from './organisation-command-service.js';
import { MySqlKernelRepository } from './repository.js';
import { MySqlSalesCommandService } from './sales-command-service.js';
import { MySqlSalesReadRepository,SalesReadError } from './sales-read-repository.js';

interface CanonicalRow extends RowDataPacket {
  id:string;object_type:string;stable_key:string;
}
interface RelationshipRow extends RowDataPacket {
  relationship_type:string;from_object_id:string;to_object_id:string;
}

const enabled=Boolean(process.env.NUBLOX_DATABASE_URL);
const suite=enabled?describe:describe.skip;
const pool=enabled?createDatabasePool():undefined;

suite('F07 Sales CRM follows Human Capital Position hierarchy',()=>{
  beforeAll(async()=>{await migrate();});
  afterAll(async()=>{await pool?.end();});

  it('scopes operational pipeline to self plus subordinate Positions without leaking across Functions or peer branches',async()=>{
    if(!pool) throw new Error('Database pool missing.');

    const suffix=randomUUID().replaceAll('-','').slice(0,12);
    const tenantId=asId<'TenantId'>(`TENANT-SALES-${suffix}`,'Tenant');
    const kernel=new MySqlKernelRepository(pool);
    const access=new MySqlAccessRepository(pool);
    const organisation=new MySqlOrganisationCommandService(pool);
    const hcm=new MySqlHcmCommandService(pool);
    const sales=new MySqlSalesCommandService(pool);
    const reads=new MySqlSalesReadRepository(pool);

    const tenant:Tenant={id:tenantId,name:'F07 Sales Test',status:'ACTIVE'};
    await kernel.createTenant(tenant);

    const adminParty:Party={
      id:asId<'PartyId'>(`PARTY-SALES-ADMIN-${suffix}`,'Party'),
      tenantId,kind:'PERSON',displayName:'Sales Test Admin',status:'ACTIVE'
    };
    await kernel.createParty(tenantId,adminParty);
    const admin:Person={
      id:asId<'PersonId'>(`PERSON-SALES-ADMIN-${suffix}`,'Person'),
      tenantId,partyId:adminParty.id,legalName:'Sales Test Admin',status:'ACTIVE'
    };
    await kernel.createPerson(tenantId,admin);
    const role:AccessRoleAssignment={
      id:asId<'AccessRoleAssignmentId'>(`ARA-SALES-${suffix}`,'Access Role Assignment'),
      tenantId,accessRoleId:PLATFORM_ADMINISTRATOR_ROLE_ID,principalType:'PERSON',principalId:admin.id,
      scopeType:'TENANT',effectiveFrom:'2026-09-24T00:00:00.000Z',status:'ACTIVE'
    };
    await access.assignAccessRole(tenantId,role,{actorPersonId:admin.id,correlationId:suffix});

    const company=await organisation.createOrganisation(tenantId,admin.id,{
      legalName:'NuBlox Construction Group plc',tradingName:'NuBlox Construction'
    });
    const salesUnit=await organisation.createOrganisationUnit(tenantId,admin.id,{
      organisationId:company.id,code:'SALES',name:'Sales & Commercial Management'
    });
    const financeUnit=await organisation.createOrganisationUnit(tenantId,admin.id,{
      organisationId:company.id,code:'FIN',name:'Finance'
    });

    const managerPosition=await organisation.createPosition(tenantId,admin.id,{
      organisationUnitId:salesUnit.id,code:'SALES-MGR',title:'Sales Manager'
    });
    const executiveAPosition=await organisation.createPosition(tenantId,admin.id,{
      organisationUnitId:salesUnit.id,code:'SALES-A',title:'Sales Executive A'
    });
    const executiveBPosition=await organisation.createPosition(tenantId,admin.id,{
      organisationUnitId:salesUnit.id,code:'SALES-B',title:'Sales Executive B'
    });
    const financePosition=await organisation.createPosition(tenantId,admin.id,{
      organisationUnitId:financeUnit.id,code:'FIN-CTRL',title:'Financial Controller'
    });

    const manager=await organisation.createPerson(tenantId,admin.id,{legalName:'Morgan Manager'});
    const executiveA=await organisation.createPerson(tenantId,admin.id,{legalName:'Alex Seller'});
    const executiveB=await organisation.createPerson(tenantId,admin.id,{legalName:'Blair Seller'});
    const financePerson=await organisation.createPerson(tenantId,admin.id,{legalName:'Fran Finance'});

    const managerEmployment=await hcm.createEmployment(tenantId,admin.id,{
      personId:manager.id,organisationId:company.id,employeeNumber:`MGR-${suffix}`,
      workerType:'EMPLOYEE',employmentType:'PERMANENT',startDate:'2026-01-01T00:00:00.000Z'
    });
    const executiveAEmployment=await hcm.createEmployment(tenantId,admin.id,{
      personId:executiveA.id,organisationId:company.id,employeeNumber:`A-${suffix}`,
      workerType:'EMPLOYEE',employmentType:'PERMANENT',startDate:'2026-01-01T00:00:00.000Z'
    });
    const executiveBEmployment=await hcm.createEmployment(tenantId,admin.id,{
      personId:executiveB.id,organisationId:company.id,employeeNumber:`B-${suffix}`,
      workerType:'EMPLOYEE',employmentType:'PERMANENT',startDate:'2026-01-01T00:00:00.000Z'
    });
    const financeEmployment=await hcm.createEmployment(tenantId,admin.id,{
      personId:financePerson.id,organisationId:company.id,employeeNumber:`FIN-${suffix}`,
      workerType:'EMPLOYEE',employmentType:'PERMANENT',startDate:'2026-01-01T00:00:00.000Z'
    });

    for(const position of [managerPosition,executiveAPosition,executiveBPosition]) {
      await hcm.assignPositionToFunction(tenantId,admin.id,{
        positionId:position.id,functionId:'F07',deploymentPurpose:'FUNCTIONAL_DELIVERY',
        effectiveFrom:'2026-01-01T00:00:00.000Z'
      });
    }
    await hcm.assignPositionToFunction(tenantId,admin.id,{
      positionId:financePosition.id,functionId:'F14',deploymentPurpose:'FUNCTIONAL_DELIVERY',
      effectiveFrom:'2026-01-01T00:00:00.000Z'
    });

    await hcm.assignEmploymentToPosition(tenantId,admin.id,{
      employmentId:managerEmployment.id,positionId:managerPosition.id,isPrimary:true,effectiveFrom:'2026-01-01T00:00:00.000Z'
    });
    await hcm.assignEmploymentToPosition(tenantId,admin.id,{
      employmentId:executiveAEmployment.id,positionId:executiveAPosition.id,isPrimary:true,effectiveFrom:'2026-01-01T00:00:00.000Z'
    });
    await hcm.assignEmploymentToPosition(tenantId,admin.id,{
      employmentId:executiveBEmployment.id,positionId:executiveBPosition.id,isPrimary:true,effectiveFrom:'2026-01-01T00:00:00.000Z'
    });
    await hcm.assignEmploymentToPosition(tenantId,admin.id,{
      employmentId:financeEmployment.id,positionId:financePosition.id,isPrimary:true,effectiveFrom:'2026-01-01T00:00:00.000Z'
    });
    await hcm.setReportingLine(tenantId,admin.id,{
      subordinatePositionId:executiveAPosition.id,managerPositionId:managerPosition.id,
      relationshipType:'LINE_MANAGER',effectiveFrom:'2026-01-01T00:00:00.000Z'
    });

    const customerA=await organisation.createOrganisation(tenantId,admin.id,{
      legalName:'Alpha Developments Limited',tradingName:'Alpha Developments'
    });
    const customerB=await organisation.createOrganisation(tenantId,admin.id,{
      legalName:'Beta Infrastructure Limited',tradingName:'Beta Infrastructure'
    });

    const accountA=await sales.createAccount(tenantId,admin.id,{
      organisationId:customerA.id,code:`ACC-A-${suffix}`,ownerPositionId:executiveAPosition.id,segment:'Strategic'
    });
    const accountB=await sales.createAccount(tenantId,admin.id,{
      organisationId:customerB.id,code:`ACC-B-${suffix}`,ownerPositionId:executiveBPosition.id,segment:'Major Projects'
    });

    const opportunityA=await sales.createOpportunity(tenantId,executiveA.id,{
      salesAccountId:accountA.id,code:`OPP-A-${suffix}`,title:'Alpha headquarters programme',
      description:'Preconstruction and delivery opportunity.',ownerPositionId:executiveAPosition.id,
      stage:'DISCOVERY',probabilityPercent:35,estimatedValue:500000,currency:'GBP',
      expectedCloseDate:'2026-12-15',forecastCategory:'PIPELINE'
    });
    const opportunityB=await sales.createOpportunity(tenantId,admin.id,{
      salesAccountId:accountB.id,code:`OPP-B-${suffix}`,title:'Beta infrastructure framework',
      description:'Framework opportunity owned by a peer Sales branch.',ownerPositionId:executiveBPosition.id,
      stage:'PROPOSAL',probabilityPercent:60,estimatedValue:900000,currency:'GBP',
      expectedCloseDate:'2027-01-31',forecastCategory:'BEST_CASE'
    });

    const sellerView=await reads.getWorkbench(tenantId,executiveA.id,'2026-09-24T12:00:00.000Z');
    expect(sellerView.accounts.map(item=>item.id)).toEqual([accountA.id]);
    expect(sellerView.opportunities.map(item=>item.id)).toEqual([opportunityA.id]);
    expect(sellerView.scope.managementSpan).toBe(0);
    expect(sellerView.canWork).toBe(true);
    expect(sellerView.currencyTotals).toEqual([
      expect.objectContaining({currency:'GBP',pipelineValue:500000,weightedPipeline:175000})
    ]);

    expect(sellerView.positionRollup).toEqual([
      expect.objectContaining({
        positionId:executiveAPosition.id,relation:'SELF',managementDepth:0,
        accounts:1,openOpportunities:1,
        currencyTotals:[expect.objectContaining({currency:'GBP',pipelineValue:500000,weightedPipeline:175000})]
      })
    ]);

    const managerView=await reads.getWorkbench(tenantId,manager.id,'2026-09-24T12:00:00.000Z');
    expect(managerView.scope.managementSpan).toBe(1);
    expect(managerView.opportunities).toEqual(expect.arrayContaining([
      expect.objectContaining({id:opportunityA.id,ownerPositionId:executiveAPosition.id})
    ]));
    expect(managerView.opportunities.some(item=>item.id===opportunityB.id)).toBe(false);
    expect(managerView.accounts.some(item=>item.id===accountB.id)).toBe(false);

    expect(managerView.positionRollup.find(item=>item.positionId===managerPosition.id)).toMatchObject({
      relation:'SELF',managementDepth:0,accounts:0,openOpportunities:0
    });
    expect(managerView.positionRollup.find(item=>item.positionId===executiveAPosition.id)).toMatchObject({
      relation:'DIRECT_REPORT',managementDepth:1,accounts:1,openOpportunities:1,
      currencyTotals:[expect.objectContaining({currency:'GBP',pipelineValue:500000,weightedPipeline:175000})]
    });
    expect(managerView.positionRollup.some(item=>item.positionId===executiveBPosition.id)).toBe(false);

    const updated=await sales.updateOpportunity(tenantId,manager.id,{
      opportunityId:opportunityA.id,rowVersion:opportunityA.rowVersion,
      title:'Alpha headquarters programme',description:'Qualified preconstruction and delivery opportunity.',
      ownerPositionId:executiveAPosition.id,stage:'PROPOSAL',probabilityPercent:55,
      estimatedValue:625000,currency:'GBP',expectedCloseDate:'2026-12-15',forecastCategory:'BEST_CASE'
    });
    expect(updated).toMatchObject({
      id:opportunityA.id,stage:'PROPOSAL',probabilityPercent:55,estimatedValue:625000,rowVersion:2
    });

    await expect(
      sales.updateOpportunity(tenantId,manager.id,{
        opportunityId:opportunityB.id,rowVersion:opportunityB.rowVersion,
        title:opportunityB.title,description:opportunityB.description,
        ownerPositionId:executiveBPosition.id,stage:'NEGOTIATION',probabilityPercent:70,
        estimatedValue:900000,currency:'GBP',expectedCloseDate:'2027-01-31',forecastCategory:'BEST_CASE'
      })
    ).rejects.toMatchObject({name:'SalesCommandError',code:'PERMISSION_DENIED'});

    await expect(
      reads.getWorkbench(tenantId,financePerson.id,'2026-09-24T12:00:00.000Z')
    ).rejects.toMatchObject({
      name:'SalesReadError',code:'PERMISSION_DENIED'
    } satisfies Partial<SalesReadError>);

    const [canonical]=await pool.execute<CanonicalRow[]>(
      `SELECT id,object_type,stable_key FROM canonical_objects
        WHERE tenant_id=? AND id IN (?,?,?,?) ORDER BY object_type,stable_key`,
      [tenantId,accountA.canonicalObjectId,accountB.canonicalObjectId,opportunityA.canonicalObjectId,opportunityB.canonicalObjectId]
    );
    expect(canonical.filter(item=>item.object_type==='SALES_ACCOUNT')).toHaveLength(2);
    expect(canonical.filter(item=>item.object_type==='OPPORTUNITY')).toHaveLength(2);

    const [relationships]=await pool.execute<RelationshipRow[]>(
      `SELECT relationship_type,from_object_id,to_object_id FROM canonical_relationships
        WHERE tenant_id=? AND to_object_id=?`,
      [tenantId,opportunityA.canonicalObjectId]
    );
    expect(relationships).toEqual(expect.arrayContaining([
      expect.objectContaining({
        relationship_type:'SALES_ACCOUNT_HAS_OPPORTUNITY',
        from_object_id:accountA.canonicalObjectId,
        to_object_id:opportunityA.canonicalObjectId
      })
    ]));
  });
});
