import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asId, type Tenant } from '@nublox/kernel';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';
import { MySqlCbeOperatingProfileService } from './cbe-operating-profile-service.js';
import {
  MySqlTenantFunctionConfigurationService,
  TenantFunctionConfigurationError
} from './tenant-function-configuration-service.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('Tenant Function configuration governance', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('allows an available Function to be enabled but blocks a hidden Function without reassessment', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const tenantId = asId<'TenantId'>(`TENANT-FUNCTION-CONFIG-${suffix}`, 'Tenant');
    const personId = `PERSON-FUNCTION-CONFIG-${suffix}`;
    const tenant: Tenant = {
      id: tenantId,
      name: `Function Configuration Test ${suffix}`,
      status: 'ACTIVE'
    };
    await new MySqlKernelRepository(pool).createTenant(tenant);
    await pool.execute(
      `INSERT INTO tenant_industry_solution_assignments
        (tenant_id,industry_solution_id,status)
       VALUES (?,'CBE','ACTIVE')`,
      [tenantId]
    );

    await new MySqlCbeOperatingProfileService(pool).applyToExistingTenant(
      tenantId,
      personId,
      'SMALL',
      {
        archetypeCode: 'CON',
        contractualPositionCode: 'ADVISORY',
        employsOperatives: false
      }
    );

    const service = new MySqlTenantFunctionConfigurationService(pool);
    const before = await service.getTenantConfiguration(tenantId);
    expect(before?.functions.find((item) => item.code === 'D02')?.effectiveState).toBe(
      'AVAILABLE_DISABLED'
    );

    await service.setEffectiveState({
      tenantId,
      actorPersonId: personId,
      functionId: 'D02',
      effectiveState: 'DEFAULT_ENABLED',
      reason: 'The consultancy now provides BIM and digital engineering coordination.'
    });

    const after = await service.getTenantConfiguration(tenantId);
    expect(after?.functions.find((item) => item.code === 'D02')?.effectiveState).toBe(
      'DEFAULT_ENABLED'
    );

    await expect(
      service.setEffectiveState({
        tenantId,
        actorPersonId: personId,
        functionId: 'D07',
        effectiveState: 'DEFAULT_ENABLED',
        reason: 'Attempt to bypass profile reassessment.'
      })
    ).rejects.toBeInstanceOf(TenantFunctionConfigurationError);
  });
});
