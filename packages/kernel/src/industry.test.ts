import { describe, expect, it } from 'vitest';
import {
  KernelInvariantError,
  asId,
  createConstructionContextProfile,
  createConstructionWorkProductType,
  createDeliveryDomainDefinition,
  createIndustryJobProfileDefinition,
  createIndustryObjectClassification,
  createIndustrySolutionDefinition,
  createSectorClassificationScheme,
  createSectorClassificationValue,
  type CanonicalObjectIdentity,
  type JobProfile,
  type Person
} from './index.js';

const industry = createIndustrySolutionDefinition({
  id: asId<'IndustrySolutionId'>('CBE', 'Industry Solution'),
  code: 'CBE',
  name: 'Construction & Built Environment',
  description: 'NuBlox industry configuration for the built environment.',
  status: 'ACTIVE'
});

const architecture = createDeliveryDomainDefinition(
  {
    id: asId<'DeliveryDomainId'>('D01', 'Delivery Domain'),
    industrySolutionId: industry.id,
    code: 'D01',
    name: 'Architecture & Design',
    purpose: 'Architectural and interior/fit-out design workflows.',
    sequence: 1,
    status: 'ACTIVE'
  },
  industry
);

const architectJob: JobProfile = {
  id: asId<'JobProfileId'>('JP-CBE-003', 'Job Profile'),
  catalogueScope: 'PLATFORM',
  code: 'CBE_003_ARCHITECT',
  name: 'Architect',
  status: 'ACTIVE'
};

const tenantId = asId<'TenantId'>('TENANT-CBE', 'Tenant');

const architect: Person = {
  id: asId<'PersonId'>('PERSON-CBE', 'Person'),
  tenantId,
  partyId: asId<'PartyId'>('PARTY-CBE', 'Party'),
  legalName: 'Architect Person',
  status: 'ACTIVE'
};

describe('construction industry solution invariants', () => {
  it('keeps Delivery Domain composition separate from enterprise Functions', () => {
    expect(industry.id).toBe('CBE');
    expect(architecture.id).toBe('D01');
    expect(architecture.industrySolutionId).toBe(industry.id);
    expect(architecture.id).not.toBe('F01');

    expect(() =>
      createDeliveryDomainDefinition(
        {
          ...architecture,
          id: asId<'DeliveryDomainId'>('F01', 'Delivery Domain'),
          code: 'F01'
        },
        industry
      )
    ).toThrow(KernelInvariantError);
  });

  it('composes the canonical Construction job into a platform Job Profile', () => {
    const profile = createIndustryJobProfileDefinition(
      {
        id: asId<'IndustryJobProfileId'>('CBE-JP-003', 'Industry Job Profile'),
        industrySolutionId: industry.id,
        jobProfileId: architectJob.id,
        primaryDeliveryDomainId: architecture.id,
        sequence: 3,
        canonicalName: 'Architect',
        source: 'National Careers Service',
        sourceVerifiedDate: '2026-08-15',
        status: 'ACTIVE'
      },
      industry,
      architecture,
      architectJob
    );

    expect(profile.jobProfileId).toBe(architectJob.id);
    expect(profile.canonicalName).toBe('Architect');
    expect(profile.id).not.toBe(architect.id);
  });

  it('overlays Construction context semantics on the canonical object graph', () => {
    const project: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>('PROJECT-CBE', 'Canonical Object'),
      tenantId,
      objectType: 'PROJECT',
      stableKey: 'PROJECT-001',
      createdAt: '2026-09-20T09:00:00.000Z'
    };
    const site: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>('SITE-CBE', 'Canonical Object'),
      tenantId,
      objectType: 'SITE',
      stableKey: 'SITE-001',
      createdAt: '2026-09-20T09:01:00.000Z'
    };

    const projectProfile = createConstructionContextProfile(
      {
        id: asId<'ConstructionContextProfileId'>('CTX-PROJECT', 'Construction Context Profile'),
        tenantId,
        canonicalObjectId: project.id,
        contextType: 'PROJECT',
        code: 'P001',
        name: 'Project Alpha',
        status: 'ACTIVE'
      },
      project
    );

    const siteProfile = createConstructionContextProfile(
      {
        id: asId<'ConstructionContextProfileId'>('CTX-SITE', 'Construction Context Profile'),
        tenantId,
        canonicalObjectId: site.id,
        contextType: 'SITE',
        code: 'S001',
        name: 'Project Alpha Site',
        parentContextObjectId: project.id,
        status: 'ACTIVE'
      },
      site,
      project
    );

    expect(projectProfile.canonicalObjectId).toBe(project.id);
    expect(siteProfile.parentContextObjectId).toBe(project.id);

    expect(() =>
      createConstructionContextProfile(
        { ...siteProfile, contextType: 'ASSET' },
        site,
        project
      )
    ).toThrow(KernelInvariantError);
  });

  it('classifies canonical objects without changing their identity', () => {
    const scheme = createSectorClassificationScheme(
      {
        id: asId<'SectorClassificationSchemeId'>('CBE-CLASS', 'Classification Scheme'),
        industrySolutionId: industry.id,
        code: 'CBE_CLASS',
        name: 'Construction Classification',
        version: '1.0',
        status: 'ACTIVE'
      },
      industry
    );

    const value = createSectorClassificationValue(
      {
        id: asId<'SectorClassificationValueId'>('CBE-CLASS-DRAWING', 'Classification Value'),
        schemeId: scheme.id,
        code: 'DRAWING',
        name: 'Drawing',
        status: 'ACTIVE'
      },
      scheme
    );

    const object: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>('OBJECT-CBE', 'Canonical Object'),
      tenantId,
      objectType: 'INFORMATION_CONTAINER',
      stableKey: 'A-1001',
      createdAt: '2026-09-20T09:00:00.000Z'
    };

    const assigned = createIndustryObjectClassification(
      {
        id: asId<'IndustryObjectClassificationId'>('CLASS-ASSIGN-1', 'Object Classification'),
        tenantId,
        canonicalObjectId: object.id,
        classificationValueId: value.id,
        assignedAt: '2026-09-20T10:00:00.000Z',
        assignedByPersonId: architect.id
      },
      object,
      value,
      architect
    );

    expect(assigned.canonicalObjectId).toBe(object.id);
    expect(assigned.classificationValueId).toBe(value.id);
  });

  it('governs Construction work-product types over the shared Deliverable runtime', () => {
    const drawing = createConstructionWorkProductType(
      {
        id: asId<'ConstructionWorkProductTypeId'>('CBE-WP-DRAWING', 'Construction Work Product Type'),
        industrySolutionId: industry.id,
        code: 'DRAWING',
        name: 'Drawing',
        category: 'DESIGN_TECHNICAL',
        defaultAuthoringMode: 'NATIVE',
        governedOutputType: 'INFORMATION_CONTAINER',
        defaultRepresentationTypes: ['PDF', 'NATIVE'],
        status: 'ACTIVE'
      },
      industry
    );

    expect(drawing.defaultAuthoringMode).toBe('NATIVE');
    expect(drawing.defaultRepresentationTypes).toEqual(['PDF', 'NATIVE']);

    expect(() =>
      createConstructionWorkProductType(
        {
          ...drawing,
          id: asId<'ConstructionWorkProductTypeId'>('CBE-WP-DRAWING-BAD', 'Construction Work Product Type'),
          defaultRepresentationTypes: ['PDF', 'PDF']
        },
        industry
      )
    ).toThrow(KernelInvariantError);
  });
});
