import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asId, type Tenant } from '@nublox/kernel';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';
import {
  MySqlTenantProvisioningService,
  TenantProvisioningError
} from './tenant-provisioning-service.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('metadata-driven Tenant provisioning', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('profiles an existing Tenant exactly once and retains configuration provenance', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const tenantId = asId<'TenantId'>(
      `TENANT-PROVISION-${suffix}`,
      'Tenant'
    );
    const tenant: Tenant = {
      id: tenantId,
      name: `Existing Provisioning Test ${suffix}`,
      status: 'ACTIVE'
    };

    await new MySqlKernelRepository(pool).createTenant(tenant);

    const provisioning = new MySqlTenantProvisioningService(pool);
    await expect(
      provisioning.getTenantConfiguration(tenantId)
    ).rejects.toBeInstanceOf(TenantProvisioningError);

    const result = await provisioning.provisionExistingTenant(
      tenantId,
      `PERSON-PROVISION-${suffix}`,
      {
        primaryClassificationValueId: 'BCV-NAICS-2022-23',
        sizeTier: 'LARGE',
        employeeCount: 500,
        legalEntityCount: 3,
        primaryCountryCode: 'GB',
        primaryLanguageCode: 'en-GB',
        operatingModelCodes: ['MULTI_SITE', 'PROJECT_BASED']
      }
    );

    expect(result.provisioningRunId).toMatch(/^TPR-/);
    expect(result.industrySolutionIds).toEqual(['CBE']);
    expect(result.templateApplications.map((template) => template.code)).toEqual(
      ['NUBLOX_CORE', 'CBE_BASE']
    );

    const configuration = await provisioning.getTenantConfiguration(tenantId);
    expect(configuration.profile).toEqual(
      expect.objectContaining({
        classificationSchemeCode: 'NAICS',
        classificationCode: '23',
        classificationName: 'Construction',
        sizeTier: 'LARGE',
        employeeCount: 500,
        legalEntityCount: 3,
        primaryCountryCode: 'GB',
        primaryLanguageCode: 'en-GB',
        configurationState: 'ACTIVE'
      })
    );
    expect(configuration.operatingModels.map((model) => model.code)).toEqual(
      expect.arrayContaining(['MULTI_SITE', 'PROJECT_BASED'])
    );
    expect(configuration.operatingModels.filter((model) => model.primary)).toHaveLength(1);
    expect(configuration.industrySolutions).toContainEqual(
      expect.objectContaining({ id: 'CBE', status: 'ACTIVE' })
    );
    expect(configuration.capabilityGuidance).toEqual(
      expect.objectContaining({
        totalCapabilities: 47,
        defaultEnabled: 16,
        availableDisabled: 7,
        hiddenNotApplicable: 24
      })
    );
    expect(configuration.templateApplications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'NUBLOX_CORE', version: 1, status: 'APPLIED' }),
        expect.objectContaining({ code: 'CBE_BASE', version: 1, status: 'APPLIED' })
      ])
    );
    expect(configuration.latestProvisioningRun?.status).toBe('APPLIED');
    expect(
      configuration.latestProvisioningRun?.steps.map((step) => step.stepKey)
    ).toEqual([
      'BUSINESS_PROFILE',
      'TEMPLATE_RESOLUTION',
      'MARKET_CAPABILITY_GUIDANCE',
      'CONFIGURATION_APPLICATION'
    ]);

    await expect(
      provisioning.provisionExistingTenant(
        tenantId,
        `PERSON-PROVISION-${suffix}`,
        {
          primaryClassificationValueId: 'BCV-NAICS-2022-23',
          sizeTier: 'SMALL',
          employeeCount: 25,
          legalEntityCount: 1,
          primaryCountryCode: 'GB',
          primaryLanguageCode: 'en-GB',
          operatingModelCodes: ['PROJECT_BASED']
        }
      )
    ).rejects.toThrow('already has a governed Business Profile');
  });

  it('exposes all 20 governed NAICS 2022 sector groups and maps Construction to CBE', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const provisioning = new MySqlTenantProvisioningService(pool);
    const catalogue = await provisioning.catalogue();
    const naics = catalogue.industries.filter(
      (industry) =>
        industry.schemeCode === 'NAICS' &&
        industry.schemeEdition === '2022'
    );

    expect(naics).toHaveLength(20);
    expect(naics.map((industry) => industry.classificationCode)).toEqual([
      '11',
      '21',
      '22',
      '23',
      '31-33',
      '42',
      '44-45',
      '48-49',
      '51',
      '52',
      '53',
      '54',
      '55',
      '56',
      '61',
      '62',
      '71',
      '72',
      '81',
      '92'
    ]);

    expect(
      naics.find((industry) => industry.classificationCode === '23')
    ).toEqual(
      expect.objectContaining({
        classificationValueId: 'BCV-NAICS-2022-23',
        name: 'Construction',
        industrySolutionId: 'CBE',
        industrySolutionName: 'Construction & Built Environment'
      })
    );

    const preview = await provisioning.preview({
      primaryClassificationValueId: 'BCV-NAICS-2022-23',
      sizeTier: 'MEDIUM',
      employeeCount: 100,
      legalEntityCount: 1,
      primaryCountryCode: 'GB',
      primaryLanguageCode: 'en-GB',
      operatingModelCodes: ['PROJECT_BASED']
    });
    expect(preview.capabilityGuidance).toEqual(
      expect.objectContaining({
        totalCapabilities: 47,
        defaultEnabled: 16,
        availableDisabled: 7,
        hiddenNotApplicable: 24
      })
    );

    expect(
      catalogue.industries.find(
        (industry) =>
          industry.schemeCode === 'NUBLOX_INDUSTRY' &&
          industry.classificationCode === 'CBE'
      )
    ).toEqual(
      expect.objectContaining({
        classificationValueId: 'BCV-NUBLOX-CBE',
        industrySolutionId: 'CBE'
      })
    );
  });

  it('rejects an exact employee count that conflicts with the selected size tier', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const provisioning = new MySqlTenantProvisioningService(pool);

    await expect(
      provisioning.preview({
        primaryClassificationValueId: 'BCV-NAICS-2022-23',
        sizeTier: 'SMALL',
        employeeCount: 500,
        legalEntityCount: 1,
        primaryCountryCode: 'GB',
        primaryLanguageCode: 'en-GB',
        operatingModelCodes: ['PROJECT_BASED']
      })
    ).rejects.toThrow('does not match the selected Small size tier');
  });
});
