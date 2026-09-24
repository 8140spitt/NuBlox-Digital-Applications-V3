import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  PLATFORM_ADMINISTRATOR_ROLE_ID,
  asId,
  type AccessRoleAssignment,
  type CanonicalObjectIdentity,
  type Decision,
  type Organisation,
  type Party,
  type Person,
  type Tenant
} from '@nublox/kernel';
import { MySqlAccessRepository } from './access-repository.js';
import {
  MySqlSupplierSourcingCommandService,
  SupplierSourcingCommandError
} from './supplier-sourcing-command-service.js';
import { MySqlSupplierSourcingReadRepository } from './supplier-sourcing-read-repository.js';
import { MySqlKernelControlRepository } from './control-repository.js';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';

const enabled=Boolean(process.env.NUBLOX_DATABASE_URL);
const suite=enabled?describe:describe.skip;
const pool=enabled?createDatabasePool():undefined;

suite('contextual supplier source approval',()=>{
  beforeAll(async()=>{await migrate();});
  afterAll(async()=>{await pool?.end();});

  it('keeps supplier lifecycle separate from item/context source approval and supersession',async()=>{
    if(!pool)throw new Error('Database pool missing.');
    const suffix=randomUUID().replaceAll('-','').slice(0,12);
    const tenantId=asId<'TenantId'>('TENANT-SOURCE-'+suffix,'Tenant');
    const kernel=new MySqlKernelRepository(pool);
    const access=new MySqlAccessRepository(pool);
    const control=new MySqlKernelControlRepository(pool);
    const service=new MySqlSupplierSourcingCommandService(pool);
    const read=new MySqlSupplierSourcingReadRepository(pool);

    await kernel.createTenant({id:tenantId,name:'Supplier Sourcing Test',status:'ACTIVE'} satisfies Tenant);

    async function createPerson(label:string):Promise<Person>{
      const party:Party={
        id:asId<'PartyId'>('PARTY-'+label+'-'+suffix,'Party'),
        tenantId,kind:'PERSON',displayName:label,status:'ACTIVE'
      };
      await kernel.createParty(tenantId,party);
      const person:Person={
        id:asId<'PersonId'>('PERSON-'+label+'-'+suffix,'Person'),
        tenantId,partyId:party.id,legalName:label,status:'ACTIVE'
      };
      await kernel.createPerson(tenantId,person);
      return person;
    }

    const admin=await createPerson('Admin');
    const worker=await createPerson('Worker');
    const assignment:AccessRoleAssignment={
      id:asId<'AccessRoleAssignmentId'>('ARA-SOURCE-'+suffix,'Access Role Assignment'),
      tenantId,accessRoleId:PLATFORM_ADMINISTRATOR_ROLE_ID,
      principalType:'PERSON',principalId:admin.id,scopeType:'TENANT',
      effectiveFrom:'2026-09-24T00:00:00.000Z',status:'ACTIVE'
    };
    await access.assignAccessRole(tenantId,assignment,{actorPersonId:admin.id,correlationId:'SOURCE-TEST'});

    const supplierParty:Party={
      id:asId<'PartyId'>('PARTY-SUPPLIER-'+suffix,'Party'),
      tenantId,kind:'ORGANISATION',displayName:'Precision Supplier '+suffix,status:'ACTIVE'
    };
    await kernel.createParty(tenantId,supplierParty,{actorPersonId:admin.id});
    const supplierOrganisation:Organisation={
      id:asId<'OrganisationId'>('ORG-SUPPLIER-'+suffix,'Organisation'),
      tenantId,partyId:supplierParty.id,legalName:'Precision Supplier '+suffix+' Ltd',status:'ACTIVE'
    };
    await kernel.createOrganisation(tenantId,supplierOrganisation,{actorPersonId:admin.id});

    const internalItem:CanonicalObjectIdentity={
      id:asId<'CanonicalObjectId'>('ITEM-INTERNAL-'+suffix,'Canonical Object'),
      tenantId,objectType:'ITEM',stableKey:'OEM-ITEM:'+suffix,createdAt:'2026-09-24T10:00:00.000Z'
    };
    const supplierItem:CanonicalObjectIdentity={
      id:asId<'CanonicalObjectId'>('ITEM-SUPPLIER-'+suffix,'Canonical Object'),
      tenantId,objectType:'SUPPLIER_ITEM',stableKey:'SUPPLIER-ITEM:'+suffix,createdAt:'2026-09-24T10:01:00.000Z'
    };
    const projectScope:CanonicalObjectIdentity={
      id:asId<'CanonicalObjectId'>('PROJECT-SOURCE-'+suffix,'Canonical Object'),
      tenantId,objectType:'PROJECT',stableKey:'PROJECT:'+suffix,createdAt:'2026-09-24T10:02:00.000Z'
    };
    await kernel.createCanonicalObject(tenantId,internalItem,{actorPersonId:admin.id});
    await kernel.createCanonicalObject(tenantId,supplierItem,{actorPersonId:admin.id});
    await kernel.createCanonicalObject(tenantId,projectScope,{actorPersonId:admin.id});

    await expect(service.createSupplierRelationship(tenantId,worker.id,{
      supplierOrganisationId:supplierOrganisation.id,
      relationshipType:'MANUFACTURER',
      code:'DENIED-'+suffix,
      name:'Denied supplier relationship'
    })).rejects.toMatchObject({
      name:'SupplierSourcingCommandError',code:'PERMISSION_DENIED'
    } satisfies Partial<SupplierSourcingCommandError>);

    const relationship=await service.createSupplierRelationship(tenantId,admin.id,{
      supplierOrganisationId:supplierOrganisation.id,
      relationshipType:'MANUFACTURER',
      code:'SUP-'+suffix,
      name:'Precision manufactured components',
      createdAt:'2026-09-24T10:05:00.000Z'
    });
    expect(relationship.status).toBe('IN_WORK');

    const context=await service.createSourcingContext(tenantId,admin.id,{
      code:'UK-PROJECT-'+suffix,
      name:'UK Project Sourcing',
      scopeType:'PROJECT',
      scopeObjectId:projectScope.id,
      criteria:{region:'GB',project:projectScope.stableKey},
      createdAt:'2026-09-24T10:06:00.000Z'
    });

    const preReleaseVersion=service.getSourceApprovalDecisionVersion({
      sourcingContextId:context.id,
      supplierRelationshipId:relationship.id,
      supplierItemObjectId:supplierItem.id,
      sourceStatus:'APPROVED',
      effectiveFrom:'2026-10-01T00:00:00.000Z'
    });
    const preReleaseDecision:Decision={
      id:asId<'DecisionId'>('DEC-SOURCE-PRE-'+suffix,'Decision'),
      tenantId,decisionType:'SOURCE_APPROVAL',
      subjectObjectId:internalItem.id,subjectVersion:preReleaseVersion,
      outcome:'APPROVED',reason:'Premature source approval must not bypass supplier release.',
      deciderPersonId:admin.id,decidedAt:'2026-09-24T10:07:00.000Z'
    };
    await control.createDecision(tenantId,preReleaseDecision,{actorPersonId:admin.id,correlationId:'SOURCE-PRE'});
    await expect(service.createSourceApproval(tenantId,admin.id,{
      sourcingContextId:context.id,
      supplierRelationshipId:relationship.id,
      internalItemObjectId:internalItem.id,
      supplierItemObjectId:supplierItem.id,
      sourceStatus:'APPROVED',
      rationale:'Premature source approval.',
      effectiveFrom:'2026-10-01T00:00:00.000Z',
      decisionId:preReleaseDecision.id,
      approvedAt:'2026-09-24T10:08:00.000Z'
    })).rejects.toMatchObject({code:'INVALID_INPUT'});

    const releaseDecision:Decision={
      id:asId<'DecisionId'>('DEC-SUP-REL-'+suffix,'Decision'),
      tenantId,decisionType:'SUPPLIER_RELATIONSHIP_RELEASE',
      subjectObjectId:relationship.canonicalObjectId,
      outcome:'APPROVED',reason:'Supplier relationship approved for sourcing consideration.',
      deciderPersonId:admin.id,decidedAt:'2026-09-24T10:10:00.000Z'
    };
    await control.createDecision(tenantId,releaseDecision,{actorPersonId:admin.id,correlationId:'SUPPLIER-RELEASE'});
    const released=await service.releaseSupplierRelationship(tenantId,admin.id,{
      supplierRelationshipId:relationship.id,
      decisionId:releaseDecision.id,
      releasedAt:'2026-09-24T10:11:00.000Z'
    });
    expect(released.status).toBe('RELEASED');

    const version1=service.getSourceApprovalDecisionVersion({
      sourcingContextId:context.id,
      supplierRelationshipId:relationship.id,
      supplierItemObjectId:supplierItem.id,
      sourceStatus:'APPROVED',
      effectiveFrom:'2026-10-01T00:00:00.000Z'
    });
    const decision1:Decision={
      id:asId<'DecisionId'>('DEC-SOURCE-1-'+suffix,'Decision'),
      tenantId,decisionType:'SOURCE_APPROVAL',
      subjectObjectId:internalItem.id,subjectVersion:version1,
      outcome:'APPROVED',reason:'Approve supplier item in UK project sourcing context.',
      deciderPersonId:admin.id,decidedAt:'2026-09-24T10:12:00.000Z'
    };
    await control.createDecision(tenantId,decision1,{actorPersonId:admin.id,correlationId:'SOURCE-1'});
    const approval1=await service.createSourceApproval(tenantId,admin.id,{
      sourcingContextId:context.id,
      supplierRelationshipId:relationship.id,
      internalItemObjectId:internalItem.id,
      supplierItemObjectId:supplierItem.id,
      sourceStatus:'APPROVED',
      rationale:'Approved source for project.',
      effectiveFrom:'2026-10-01T00:00:00.000Z',
      decisionId:decision1.id,
      approvedAt:'2026-09-24T10:13:00.000Z'
    });
    expect(approval1.sourceStatus).toBe('APPROVED');

    const version2=service.getSourceApprovalDecisionVersion({
      sourcingContextId:context.id,
      supplierRelationshipId:relationship.id,
      supplierItemObjectId:supplierItem.id,
      sourceStatus:'PREFERRED',
      effectiveFrom:'2026-11-01T00:00:00.000Z'
    });
    const decision2:Decision={
      id:asId<'DecisionId'>('DEC-SOURCE-2-'+suffix,'Decision'),
      tenantId,decisionType:'SOURCE_APPROVAL',
      subjectObjectId:internalItem.id,subjectVersion:version2,
      outcome:'APPROVED',reason:'Promote source to preferred after performance review.',
      deciderPersonId:admin.id,decidedAt:'2026-09-24T10:14:00.000Z'
    };
    await control.createDecision(tenantId,decision2,{actorPersonId:admin.id,correlationId:'SOURCE-2'});
    const approval2=await service.createSourceApproval(tenantId,admin.id,{
      sourcingContextId:context.id,
      supplierRelationshipId:relationship.id,
      internalItemObjectId:internalItem.id,
      supplierItemObjectId:supplierItem.id,
      sourceStatus:'PREFERRED',
      rationale:'Preferred source after review.',
      effectiveFrom:'2026-11-01T00:00:00.000Z',
      decisionId:decision2.id,
      approvedAt:'2026-09-24T10:15:00.000Z'
    });
    expect(approval2.sourceStatus).toBe('PREFERRED');

    const rule=await service.createSourcingRule(tenantId,admin.id,{
      code:'RULE-'+suffix,
      name:'Default project manufacturer source status',
      sourcingContextId:context.id,
      supplierRelationshipId:relationship.id,
      itemObjectType:'ITEM',
      criteria:{classification:'STRUCTURAL_COMPONENT'},
      assignedStatus:'APPROVED',
      priority:10,
      status:'ACTIVE',
      createdAt:'2026-09-24T10:16:00.000Z'
    });
    expect(rule.status).toBe('ACTIVE');
    const disabledRule=await service.setSourcingRuleStatus(tenantId,admin.id,{
      ruleId:rule.id,status:'DISABLED'
    });
    expect(disabledRule.status).toBe('DISABLED');

    const projection=await read.getProjection(tenantId,admin.id);
    expect(projection.totals.supplierRelationships).toBe(1);
    expect(projection.totals.releasedSuppliers).toBe(1);
    expect(projection.totals.sourcingContexts).toBe(1);
    expect(projection.totals.currentApprovals).toBe(1);
    expect(projection.totals.preferredSources).toBe(1);
    expect(projection.totals.activeRules).toBe(0);

    const prior=projection.sourceApprovals.find(item=>item.id===approval1.id);
    const current=projection.sourceApprovals.find(item=>item.id===approval2.id);
    expect(prior?.current).toBe(false);
    expect(prior?.supersededBySourceApprovalId).toBe(approval2.id);
    expect(current?.current).toBe(true);
  });
});
