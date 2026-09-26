import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asId, type Tenant } from '@nublox/kernel';
import type { RowDataPacket } from 'mysql2/promise';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';
import { MySqlCbeOperatingProfileService } from './cbe-operating-profile-service.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('CBE operating-profile resolver', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('resolves a small advisory consultancy to a focused 13-Function default profile', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const service = new MySqlCbeOperatingProfileService(pool);
    const preview = await service.preview('SMALL', {
      archetypeCode: 'CON',
      contractualPositionCode: 'ADVISORY',
      employsOperatives: false
    });

    expect(preview.provisioningCode).toBe('CBE.V1.CON.ADVISORY.NOOPS.T2');
    expect(preview.effectiveArchetypeCode).toBe('CON');
    expect(preview.summary).toEqual({
      totalFunctions: 45,
      defaultEnabled: 13,
      availableDisabled: 28,
      hiddenNotApplicable: 4
    });

    expect(
      preview.functions
        .filter((item) => item.recommendationState === 'DEFAULT_ENABLED')
        .map((item) => item.code)
    ).toEqual([
      'F07',
      'F09',
      'F14',
      'F15',
      'F19',
      'F23',
      'F25',
      'F26',
      'F27',
      'D01',
      'D03',
      'D04',
      'D15'
    ]);

    expect(new Set(preview.capabilityAdders.map((item) => item.code))).toEqual(
      new Set(['F15.09', 'F15.10', 'F15.13'])
    );
  });

  it('lets contractual position determine the effective archetype and persists the recommendation', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const tenantId = asId<'TenantId'>(`TENANT-CBE-PROFILE-${suffix}`, 'Tenant');
    const tenant: Tenant = {
      id: tenantId,
      name: `CBE Profile Test ${suffix}`,
      status: 'ACTIVE'
    };
    await new MySqlKernelRepository(pool).createTenant(tenant);
    await pool.execute(
      `INSERT INTO tenant_industry_solution_assignments
        (tenant_id,industry_solution_id,status)
       VALUES (?,'CBE','ACTIVE')`,
      [tenantId]
    );

    const service = new MySqlCbeOperatingProfileService(pool);
    const result = await service.applyToExistingTenant(
      tenantId,
      `PERSON-CBE-PROFILE-${suffix}`,
      'SMALL',
      {
        archetypeCode: 'MC',
        contractualPositionCode: 'ADVISORY',
        employsOperatives: false
      }
    );

    expect(result.intakeArchetypeCode).toBe('MC');
    expect(result.effectiveArchetypeCode).toBe('CON');
    expect(result.provisioningCode).toBe('CBE.V1.CON.ADVISORY.NOOPS.T2');

    const [profileRows] = await pool.query<Array<RowDataPacket & {
      provisioning_code: string;
      intake_archetype_code: string;
      effective_archetype_code: string;
    }>>(
      `SELECT provisioning_code,intake_archetype_code,effective_archetype_code
         FROM tenant_cbe_operating_profiles
        WHERE tenant_id=?`,
      [tenantId]
    );
    expect(profileRows[0]).toEqual(
      expect.objectContaining({
        provisioning_code: 'CBE.V1.CON.ADVISORY.NOOPS.T2',
        intake_archetype_code: 'MC',
        effective_archetype_code: 'CON'
      })
    );

    const [countRows] = await pool.query<Array<RowDataPacket & {
      count: number | string;
    }>>(
      `SELECT COUNT(*) AS count
         FROM tenant_function_configurations
        WHERE tenant_id=?`,
      [tenantId]
    );
    expect(Number(countRows[0]?.count ?? 0)).toBe(45);
  });
});
