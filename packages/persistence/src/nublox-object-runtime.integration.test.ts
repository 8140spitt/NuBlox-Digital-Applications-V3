import { randomUUID } from 'node:crypto';
import { afterAll,beforeAll,describe,expect,it } from 'vitest';
import {
  PLATFORM_ADMINISTRATOR_ROLE_ID,
  asId,
  type AccessRoleAssignment,
  type LifecycleDefinition,
  type LifecycleStateDefinition,
  type LifecycleTransitionDefinition,
  type Party,
  type Person,
  type Tenant
} from '@nublox/kernel';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlKernelControlRepository } from './control-repository.js';
import { createDatabasePool } from './database.js';
import { MySqlEnterpriseVocabularyProvisioningService } from './enterprise-vocabulary-provisioning-service.js';
import { MySqlMetadataAdministrationCommandService } from './metadata-administration-command-service.js';
import { migrate } from './migrations.js';
import { MySqlNuBloxObjectFactory,NuBloxObject,NuBloxObjectRuntimeError } from './nublox-object-runtime.js';
import { MySqlKernelRepository } from './repository.js';

const enabled=Boolean(process.env.NUBLOX_DATABASE_URL);
const suite=enabled?describe:describe.skip;
const pool=enabled?createDatabasePool():undefined;

suite('metadata-driven NuBlox ObjectFactory runtime',()=>{
  beforeAll(async()=>{await migrate();});
  afterAll(async()=>{await pool?.end();});

  it('creates a runtime class from metadata and executes persistence and lifecycle without source-code domain classes',async()=>{
    if(!pool) throw new Error('Database pool missing.');

    const suffix=randomUUID().replaceAll('-','').slice(0,12);
    const tenantId=asId<'TenantId'>(`TENANT-OBJECT-${suffix}`,'Tenant');
    const kernel=new MySqlKernelRepository(pool);
    const access=new MySqlAccessRepository(pool);
    const metadata=new MySqlMetadataAdministrationCommandService(pool);
    const control=new MySqlKernelControlRepository(pool);

    await kernel.createTenant({id:tenantId,name:'Object Factory Test',status:'ACTIVE'} satisfies Tenant);
    const party:Party={
      id:asId<'PartyId'>(`PARTY-OBJECT-${suffix}`,'Party'),
      tenantId,kind:'PERSON',displayName:'Object Administrator',status:'ACTIVE'
    };
    await kernel.createParty(tenantId,party);
    const admin:Person={
      id:asId<'PersonId'>(`PERSON-OBJECT-${suffix}`,'Person'),
      tenantId,partyId:party.id,legalName:'Object Administrator',status:'ACTIVE'
    };
    await kernel.createPerson(tenantId,admin);
    const role:AccessRoleAssignment={
      id:asId<'AccessRoleAssignmentId'>(`ARA-OBJECT-${suffix}`,'Access Role Assignment'),
      tenantId,accessRoleId:PLATFORM_ADMINISTRATOR_ROLE_ID,
      principalType:'PERSON',principalId:admin.id,scopeType:'TENANT',
      effectiveFrom:'2026-09-24T00:00:00.000Z',status:'ACTIVE'
    };
    await access.assignAccessRole(tenantId,role,{actorPersonId:admin.id,correlationId:suffix});

    const typeCode=`CHANGE_REQUEST_${suffix}`.toUpperCase();
    const lifecycle:LifecycleDefinition={
      id:asId<'LifecycleDefinitionId'>(`LIFE-OBJECT-${suffix}`,'Lifecycle Definition'),
      tenantId,code:`CR_LIFECYCLE_${suffix}`.toUpperCase(),name:'Change Request Lifecycle',
      objectType:typeCode,status:'ACTIVE'
    };
    const draft:LifecycleStateDefinition={
      id:asId<'LifecycleStateDefinitionId'>(`STATE-DRAFT-${suffix}`,'Lifecycle State'),
      tenantId,lifecycleDefinitionId:lifecycle.id,code:'DRAFT',name:'Draft',
      category:'DRAFT',initial:true,terminal:false,status:'ACTIVE'
    };
    const submitted:LifecycleStateDefinition={
      id:asId<'LifecycleStateDefinitionId'>(`STATE-SUBMITTED-${suffix}`,'Lifecycle State'),
      tenantId,lifecycleDefinitionId:lifecycle.id,code:'SUBMITTED',name:'Submitted',
      category:'REVIEW',initial:false,terminal:false,status:'ACTIVE'
    };
    const approved:LifecycleStateDefinition={
      id:asId<'LifecycleStateDefinitionId'>(`STATE-APPROVED-${suffix}`,'Lifecycle State'),
      tenantId,lifecycleDefinitionId:lifecycle.id,code:'APPROVED',name:'Approved',
      category:'RELEASED',initial:false,terminal:false,status:'ACTIVE'
    };
    const submit:LifecycleTransitionDefinition={
      id:asId<'LifecycleTransitionDefinitionId'>(`TRANS-SUBMIT-${suffix}`,'Lifecycle Transition'),
      tenantId,lifecycleDefinitionId:lifecycle.id,code:'SUBMIT',name:'Submit',
      fromStateId:draft.id,toStateId:submitted.id,requiresDecision:false,status:'ACTIVE'
    };
    const approve:LifecycleTransitionDefinition={
      id:asId<'LifecycleTransitionDefinitionId'>(`TRANS-APPROVE-${suffix}`,'Lifecycle Transition'),
      tenantId,lifecycleDefinitionId:lifecycle.id,code:'APPROVE',name:'Approve',
      fromStateId:submitted.id,toStateId:approved.id,requiresDecision:false,status:'ACTIVE'
    };
    await control.createLifecycleDefinition(tenantId,lifecycle,{actorPersonId:admin.id,correlationId:suffix});
    await control.createLifecycleStateDefinition(tenantId,draft,{actorPersonId:admin.id,correlationId:suffix});
    await control.createLifecycleStateDefinition(tenantId,submitted,{actorPersonId:admin.id,correlationId:suffix});
    await control.createLifecycleStateDefinition(tenantId,approved,{actorPersonId:admin.id,correlationId:suffix});
    await control.createLifecycleTransitionDefinition(tenantId,submit,{actorPersonId:admin.id,correlationId:suffix});
    await control.createLifecycleTransitionDefinition(tenantId,approve,{actorPersonId:admin.id,correlationId:suffix});

    const type=await metadata.createTypeDefinition(tenantId,admin.id,{
      code:typeCode,name:'Change Request',objectFamily:'CHANGE',
      lifecycleDefinitionId:lifecycle.id,version:1,creationPolicyReference:'METADATA_RUNTIME'
    });
    const number=await metadata.createAttributeDefinition(tenantId,admin.id,{
      code:'NUMBER',name:'Number',dataType:'STRING',version:1
    });
    const title=await metadata.createAttributeDefinition(tenantId,admin.id,{
      code:'TITLE',name:'Title',dataType:'STRING',version:1
    });
    const tags=await metadata.createAttributeDefinition(tenantId,admin.id,{
      code:'TAGS',name:'Tags',dataType:'STRING',version:1
    });
    const active=await metadata.createAttributeDefinition(tenantId,admin.id,{
      code:'ACTIVE',name:'Active',dataType:'BOOLEAN',version:1
    });
    await metadata.assignAttributeToType(tenantId,admin.id,{
      typeDefinitionId:type.id,attributeDefinitionId:number.id,sequence:1,required:true
    });
    await metadata.assignAttributeToType(tenantId,admin.id,{
      typeDefinitionId:type.id,attributeDefinitionId:title.id,sequence:2,required:true
    });
    await metadata.assignAttributeToType(tenantId,admin.id,{
      typeDefinitionId:type.id,attributeDefinitionId:tags.id,sequence:3,
      required:false,cardinality:'MULTIPLE'
    });
    await metadata.assignAttributeToType(tenantId,admin.id,{
      typeDefinitionId:type.id,attributeDefinitionId:active.id,sequence:4,
      required:true,defaultValue:true
    });

    const factory=new MySqlNuBloxObjectFactory(pool,tenantId,admin.id);
    const ChangeRequest=await factory.define(typeCode);
    expect(ChangeRequest.name).toBe('ChangeRequest');
    expect(ChangeRequest.definition.fields.map(field=>field.propertyName)).toEqual([
      'number','title','tags','active'
    ]);

    const request=new ChangeRequest({
      number:'CR-000123',
      title:'Update hydraulic pump',
      tags:['hydraulic','design']
    }) as NuBloxObject & {
      number:string;
      title:string;
      tags:string[];
      active:boolean;
      submit():Promise<NuBloxObject>;
      approve():Promise<NuBloxObject>;
    };

    expect(request).toBeInstanceOf(NuBloxObject);
    expect(request.number).toBe('CR-000123');
    expect(request.active).toBe(true);
    await request.save();

    expect(request.id).toBeTruthy();
    expect(request.stableKey).toBe('CR-000123');
    expect(request.displayName).toBe('Update hydraulic pump');
    expect(request.lifecycle?.stateCode).toBe('DRAFT');

    request.title='Update hydraulic pump specification';
    request.tags=['hydraulic'];
    await request.save();

    const reloaded=await ChangeRequest.load(request.id!) as typeof request;
    expect(reloaded.title).toBe('Update hydraulic pump specification');
    expect(reloaded.tags).toEqual(['hydraulic']);
    expect(reloaded.toJSON()).toMatchObject({
      id:request.id,
      type:typeCode,
      number:'CR-000123',
      title:'Update hydraulic pump specification',
      tags:['hydraulic'],
      active:true
    });

    await reloaded.submit();
    expect(reloaded.lifecycle?.stateCode).toBe('SUBMITTED');
    await reloaded.approve();
    expect(reloaded.lifecycle?.stateCode).toBe('APPROVED');
  });

  it('refuses generic construction of native-authority masters',async()=>{
    if(!pool) throw new Error('Database pool missing.');

    const suffix=randomUUID().replaceAll('-','').slice(0,12);
    const tenantId=asId<'TenantId'>(`TENANT-NATIVE-${suffix}`,'Tenant');
    const kernel=new MySqlKernelRepository(pool);
    const access=new MySqlAccessRepository(pool);
    await kernel.createTenant({id:tenantId,name:'Native Authority Test',status:'ACTIVE'} satisfies Tenant);
    const party:Party={
      id:asId<'PartyId'>(`PARTY-NATIVE-${suffix}`,'Party'),
      tenantId,kind:'PERSON',displayName:'Native Administrator',status:'ACTIVE'
    };
    await kernel.createParty(tenantId,party);
    const admin:Person={
      id:asId<'PersonId'>(`PERSON-NATIVE-${suffix}`,'Person'),
      tenantId,partyId:party.id,legalName:'Native Administrator',status:'ACTIVE'
    };
    await kernel.createPerson(tenantId,admin);
    await access.assignAccessRole(tenantId,{
      id:asId<'AccessRoleAssignmentId'>(`ARA-NATIVE-${suffix}`,'Access Role Assignment'),
      tenantId,accessRoleId:PLATFORM_ADMINISTRATOR_ROLE_ID,principalType:'PERSON',
      principalId:admin.id,scopeType:'TENANT',effectiveFrom:'2026-09-24T00:00:00.000Z',status:'ACTIVE'
    },{actorPersonId:admin.id,correlationId:suffix});

    await new MySqlEnterpriseVocabularyProvisioningService(pool).provision(tenantId,admin.id);
    const factory=new MySqlNuBloxObjectFactory(pool,tenantId,admin.id);
    const Organisation=await factory.define('ORGANISATION');
    const ghost=new Organisation({stableKey:'ORG-GHOST'});

    await expect(ghost.save()).rejects.toEqual(
      expect.objectContaining<Partial<NuBloxObjectRuntimeError>>({code:'NATIVE_AUTHORITY'})
    );
  });
});
