import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  asId,
  type ConstructionContextProfile,
  type IndustryObjectClassification,
  type Organisation,
  type OrganisationUnit,
  type Party,
  type Person,
  type Position,
  type SectorClassificationScheme,
  type SectorClassificationValue,
  type Tenant
} from '@nublox/kernel';
import { createDatabasePool } from './database.js';
import { MySqlIndustryRepository } from './industry-repository.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('MySQL Construction & Built Environment industry solution', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('seeds 16 domains, 84 jobs and governed work products and overlays real construction contexts on canonical objects', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = `CBE-${Date.now().toString(36)}`;
    const tenantId = asId<'TenantId'>(`TENANT-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const industry = new MySqlIndustryRepository(pool);

    expect(await industry.catalogueCounts()).toEqual({
      deliveryDomains: 16,
      jobProfiles: 84,
      workProductTypes: 58
    });

    const solution = await industry.getIndustrySolution();
    expect(solution).toEqual(
      expect.objectContaining({
        id: 'CBE',
        code: 'CBE',
        name: 'Construction & Built Environment',
        status: 'ACTIVE'
      })
    );

    const domains = await industry.listDeliveryDomains();
    expect(domains).toHaveLength(16);
    expect(domains[0]).toEqual(
      expect.objectContaining({
        id: 'D01',
        name: 'Architecture & Design'
      })
    );
    expect(domains[15]).toEqual(
      expect.objectContaining({
        id: 'D16',
        name: 'Infrastructure, Land & Rural'
      })
    );

    const jobs = await industry.listIndustryJobProfiles();
    expect(jobs).toHaveLength(84);
    expect(jobs[2]).toEqual(
      expect.objectContaining({
        industry: expect.objectContaining({
          id: 'CBE-JP-003',
          canonicalName: 'Architect',
          primaryDeliveryDomainId: 'D01',
          source: 'National Careers Service',
          sourceVerifiedDate: '2026-08-15'
        }),
        jobProfile: expect.objectContaining({
          id: 'JP-CBE-003',
          catalogueScope: 'PLATFORM',
          name: 'Architect'
        })
      })
    );
    expect(jobs[59]).toEqual(
      expect.objectContaining({
        industry: expect.objectContaining({
          canonicalName: 'Quantity surveyor',
          primaryDeliveryDomainId: 'D04'
        })
      })
    );

    const architectCapabilities = await industry.getJobCapabilityProfile(
      asId<'IndustryJobProfileId'>('CBE-JP-003', 'Industry Job Profile')
    );
    expect(architectCapabilities).toEqual(
      expect.objectContaining({
        specialistCapabilities: expect.arrayContaining([
          'Briefing',
          'drawings',
          'site reviews'
        ]),
        primaryStructuredRecords: expect.arrayContaining([
          'Drawings',
          'models',
          'design decisions'
        ]),
        lifecycleStages: ['Brief', 'Design', 'Construction', 'Handover']
      })
    );

    const quantitySurveyorCapabilities = await industry.getJobCapabilityProfile(
      asId<'IndustryJobProfileId'>('CBE-JP-060', 'Industry Job Profile')
    );
    expect(quantitySurveyorCapabilities).toEqual(
      expect.objectContaining({
        specialistCapabilities: expect.arrayContaining([
          'Measurement',
          'valuations',
          'final accounts'
        ]),
        primaryStructuredRecords: expect.arrayContaining([
          'Cost plans',
          'BoQs',
          'variations'
        ]),
        lifecycleStages: ['Feasibility', 'Design', 'Construction', 'Final account']
      })
    );

    const drawing = await industry.getWorkProductType('DRAWING');
    expect(drawing).toEqual(
      expect.objectContaining({
        category: 'DESIGN_TECHNICAL',
        defaultAuthoringMode: 'NATIVE',
        governedOutputType: 'INFORMATION_CONTAINER'
      })
    );

    const tenant: Tenant = {
      id: tenantId,
      name: 'Construction Industry Runtime Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant);

    const personParty: Party = {
      id: asId<'PartyId'>(`PARTY-P-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Project Architect',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, personParty);

    const person: Person = {
      id: asId<'PersonId'>(`PERSON-${suffix}`, 'Person'),
      tenantId,
      partyId: personParty.id,
      legalName: 'Project Architect',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, person);

    const organisationParty: Party = {
      id: asId<'PartyId'>(`PARTY-O-${suffix}`, 'Party'),
      tenantId,
      kind: 'ORGANISATION',
      displayName: 'Construction Design Ltd',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, organisationParty, {
      actorPersonId: person.id
    });

    const organisation: Organisation = {
      id: asId<'OrganisationId'>(`ORG-${suffix}`, 'Organisation'),
      tenantId,
      partyId: organisationParty.id,
      legalName: 'Construction Design Ltd',
      status: 'ACTIVE'
    };
    await kernel.createOrganisation(tenantId, organisation, {
      actorPersonId: person.id
    });

    const unit: OrganisationUnit = {
      id: asId<'OrganisationUnitId'>(`UNIT-${suffix}`, 'Organisation Unit'),
      tenantId,
      organisationId: organisation.id,
      code: 'DESIGN',
      name: 'Design',
      status: 'ACTIVE'
    };
    await kernel.createOrganisationUnit(tenantId, unit, {
      actorPersonId: person.id
    });

    const position: Position = {
      id: asId<'PositionId'>(`POS-${suffix}`, 'Position'),
      tenantId,
      organisationUnitId: unit.id,
      jobProfileId: asId<'JobProfileId'>('JP-CBE-003', 'Job Profile'),
      code: 'ARCH-01',
      title: 'Project Architect',
      status: 'ACTIVE'
    };
    await kernel.createPosition(tenantId, position, {
      actorPersonId: person.id
    });

    const project = {
      id: asId<'CanonicalObjectId'>(`PROJECT-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'PROJECT',
      stableKey: `PROJECT-${suffix}`,
      createdAt: '2026-09-20T09:00:00.000Z'
    };
    const site = {
      id: asId<'CanonicalObjectId'>(`SITE-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'SITE',
      stableKey: `SITE-${suffix}`,
      createdAt: '2026-09-20T09:01:00.000Z'
    };
    const system = {
      id: asId<'CanonicalObjectId'>(`SYSTEM-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'SYSTEM',
      stableKey: `SYSTEM-${suffix}`,
      createdAt: '2026-09-20T09:02:00.000Z'
    };
    const asset = {
      id: asId<'CanonicalObjectId'>(`ASSET-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'ASSET',
      stableKey: `ASSET-${suffix}`,
      createdAt: '2026-09-20T09:03:00.000Z'
    };

    await kernel.createCanonicalObject(tenantId, project, {
      actorPersonId: person.id
    });
    await kernel.createCanonicalObject(tenantId, site, {
      actorPersonId: person.id
    });
    await kernel.createCanonicalObject(tenantId, system, {
      actorPersonId: person.id
    });
    await kernel.createCanonicalObject(tenantId, asset, {
      actorPersonId: person.id
    });

    const siteProfile: ConstructionContextProfile = {
      id: asId<'ConstructionContextProfileId'>(`CTX-SITE-${suffix}`, 'Construction Context Profile'),
      tenantId,
      canonicalObjectId: site.id,
      contextType: 'SITE',
      code: 'SITE-01',
      name: 'Main Site',
      parentContextObjectId: project.id,
      status: 'ACTIVE'
    };

    await expect(
      industry.createConstructionContext(tenantId, siteProfile, {
        actorPersonId: person.id
      })
    ).rejects.toThrow('Parent canonical object is not an ACTIVE Construction Context');

    const projectProfile: ConstructionContextProfile = {
      id: asId<'ConstructionContextProfileId'>(`CTX-PROJECT-${suffix}`, 'Construction Context Profile'),
      tenantId,
      canonicalObjectId: project.id,
      contextType: 'PROJECT',
      code: 'P001',
      name: 'Project Alpha',
      status: 'ACTIVE'
    };
    await industry.createConstructionContext(tenantId, projectProfile, {
      actorPersonId: person.id,
      correlationId: suffix
    });
    await industry.createConstructionContext(tenantId, siteProfile, {
      actorPersonId: person.id,
      correlationId: suffix
    });

    const systemProfile: ConstructionContextProfile = {
      id: asId<'ConstructionContextProfileId'>(`CTX-SYSTEM-${suffix}`, 'Construction Context Profile'),
      tenantId,
      canonicalObjectId: system.id,
      contextType: 'SYSTEM',
      code: 'SYS-HVAC',
      name: 'HVAC System',
      parentContextObjectId: site.id,
      status: 'ACTIVE'
    };
    await industry.createConstructionContext(tenantId, systemProfile, {
      actorPersonId: person.id
    });

    const assetProfile: ConstructionContextProfile = {
      id: asId<'ConstructionContextProfileId'>(`CTX-ASSET-${suffix}`, 'Construction Context Profile'),
      tenantId,
      canonicalObjectId: asset.id,
      contextType: 'ASSET',
      code: 'AHU-01',
      name: 'Air Handling Unit 01',
      parentContextObjectId: system.id,
      status: 'ACTIVE'
    };
    await industry.createConstructionContext(tenantId, assetProfile, {
      actorPersonId: person.id
    });

    const projectChildren = await industry.listConstructionContextChildren(
      tenantId,
      project.id
    );
    expect(projectChildren).toEqual([
      expect.objectContaining({
        canonicalObjectId: site.id,
        contextType: 'SITE'
      })
    ]);

    const scheme: SectorClassificationScheme = {
      id: asId<'SectorClassificationSchemeId'>(`SCHEME-${suffix}`, 'Classification Scheme'),
      industrySolutionId: asId<'IndustrySolutionId'>('CBE', 'Industry Solution'),
      code: `TEST_CLASS_${suffix}`,
      name: 'Test Construction Classification',
      version: '1.0',
      status: 'ACTIVE'
    };
    await industry.createClassificationScheme(scheme);

    const systemClass: SectorClassificationValue = {
      id: asId<'SectorClassificationValueId'>(`CLASS-SYSTEM-${suffix}`, 'Classification Value'),
      schemeId: scheme.id,
      code: 'SYSTEM',
      name: 'Building System',
      status: 'ACTIVE'
    };
    await industry.createClassificationValue(systemClass);

    const hvacClass: SectorClassificationValue = {
      id: asId<'SectorClassificationValueId'>(`CLASS-HVAC-${suffix}`, 'Classification Value'),
      schemeId: scheme.id,
      code: 'HVAC',
      name: 'Heating, Ventilation and Air Conditioning',
      parentValueId: systemClass.id,
      status: 'ACTIVE'
    };
    await industry.createClassificationValue(hvacClass);

    const assignment: IndustryObjectClassification = {
      id: asId<'IndustryObjectClassificationId'>(`CLASS-ASG-${suffix}`, 'Object Classification'),
      tenantId,
      canonicalObjectId: asset.id,
      classificationValueId: hvacClass.id,
      assignedAt: '2026-09-20T10:00:00.000Z',
      assignedByPersonId: person.id
    };
    await industry.assignClassification(tenantId, assignment, {
      actorPersonId: person.id,
      correlationId: suffix
    });

    const [classificationRows] = await pool.query(
      `SELECT classification_value_id
         FROM industry_object_classifications
        WHERE tenant_id = ? AND canonical_object_id = ?`,
      [tenantId, asset.id]
    );
    expect(classificationRows).toEqual([
      expect.objectContaining({
        classification_value_id: hvacClass.id
      })
    ]);

    const [auditRows] = await pool.query(
      `SELECT entity_type, action
         FROM kernel_audit_entries
        WHERE tenant_id = ?
          AND entity_type IN (
            'CONSTRUCTION_CONTEXT_PROFILE',
            'INDUSTRY_OBJECT_CLASSIFICATION'
          )`,
      [tenantId]
    );
    expect(auditRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entity_type: 'CONSTRUCTION_CONTEXT_PROFILE',
          action: 'CREATED'
        }),
        expect.objectContaining({
          entity_type: 'INDUSTRY_OBJECT_CLASSIFICATION',
          action: 'ASSIGNED'
        })
      ])
    );
  });
});
