import { randomUUID } from 'node:crypto';
import { afterAll,beforeAll,describe,expect,it } from 'vitest';
import { asId,type Tenant } from '@nublox/kernel';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';
import { MySqlPlatformAdministrationService } from './platform-administration-service.js';
import { MySqlPlatformControlPlaneCommandService } from './platform-control-plane-command-service.js';
import {
  MySqlPlatformControlPlaneReadRepository,
  PLATFORM_TENANT_SECTIONS,
  type PlatformGlobalSectionKey,
  type PlatformTenantSectionKey
} from './platform-control-plane-read-repository.js';

const enabled=Boolean(process.env.NUBLOX_DATABASE_URL);
const suite=enabled?describe:describe.skip;
const pool=enabled?createDatabasePool():undefined;

suite('NuBlox operator control plane estate',()=>{
  beforeAll(async()=>{await migrate();});
  afterAll(async()=>{await pool?.end();});

  it('opens every global and Tenant administration section against the real schema',async()=>{
    if(!pool) throw new Error('Database pool missing.');
    const suffix=randomUUID().replaceAll('-','').slice(0,12);
    const tenantId=asId<'TenantId'>(`TENANT-PLATFORM-${suffix}`,'Tenant');
    const tenant:Tenant={id:tenantId,name:`Platform Estate ${suffix}`,status:'ACTIVE'};
    await new MySqlKernelRepository(pool).createTenant(tenant);

    const administration=new MySqlPlatformAdministrationService(pool);
    const operator=await administration.bootstrapOperator({
      email:`platform-${suffix}@example.test`,password:`NuBlox-${suffix}-Control-Plane-Password!`,displayName:'Platform Estate Admin',role:'SUPER_ADMIN'
    });
    const commands=new MySqlPlatformControlPlaneCommandService(pool);
    const reads=new MySqlPlatformControlPlaneReadRepository(pool);

    await commands.upsertFeatureFlag(operator,{flagKey:`test.${suffix}`,name:'Control Plane Test',description:'Integration-test feature flag.',defaultEnabled:false});
    await commands.setTenantFeatureOverride(operator,{tenantId,flagKey:`test.${suffix}`,enabled:true,reason:'Integration test override'});
    await commands.upsertSubscription(operator,{tenantId,planCode:'ENTERPRISE',status:'ACTIVE',seatLimit:'250'});
    await commands.upsertPlatformConfiguration(operator,{configKey:`test.${suffix}`,description:'Integration-test platform configuration.',sensitivity:'INTERNAL',jsonValue:'{"enabled":true}'});
    await commands.registerIntegration(operator,{tenantId,code:`INT-${suffix}`,name:'Control Plane Test Integration',integrationType:'API'});

    const dashboard=await reads.dashboard();
    expect(dashboard.globalSections.length).toBeGreaterThanOrEqual(13);

    const globalSections:PlatformGlobalSectionKey[]=[
      'users','templates','industries','metadata','feature-flags','provisioning','migrations','integrations','jobs','security','audit','metrics','platform-configuration'
    ];
    for(const section of globalSections){
      const view=await reads.globalSection(section);
      expect(view.key).toBe(section);
      expect(Array.isArray(view.rows)).toBe(true);
    }

    const header=await reads.tenantHeader(tenantId);
    expect(header).toMatchObject({tenantId,name:tenant.name,lifecycleState:'ACTIVE'});
    for(const definition of PLATFORM_TENANT_SECTIONS){
      const view=await reads.tenantSection(tenantId,definition.key as PlatformTenantSectionKey);
      expect(view.key).toBe(definition.key);
      expect(Array.isArray(view.rows)).toBe(true);
    }

    const subscription=await reads.tenantSection(tenantId,'subscriptions');
    expect(subscription.rows[0]).toMatchObject({plan_code:'ENTERPRISE',status:'ACTIVE'});
    const configuration=await reads.tenantSection(tenantId,'configuration');
    expect(configuration.rows.some(row=>row.record_type==='FEATURE_OVERRIDE')).toBe(true);
  });
});
