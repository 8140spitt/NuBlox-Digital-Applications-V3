import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  asId,
  type Baseline,
  type BaselineItem,
  type CanonicalObjectIdentity,
  type Change,
  type ChangeAffectedObject,
  type ChangeImpactAssessment,
  type ConfigurationItem,
  type Effectivity,
  type Party,
  type Person,
  type Tenant
} from '@nublox/kernel';
import { MySqlChangeConfigurationReadRepository } from './change-configuration-read-repository.js';
import { MySqlChangeRepository } from './change-repository.js';
import { createDatabasePool } from './database.js';
import { MySqlInformationRepository } from './information-repository.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('change and configuration read projection', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('projects governed change, baseline and effectivity state without crossing tenant boundaries', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const kernel = new MySqlKernelRepository(pool);
    const changes = new MySqlChangeRepository(pool);
    const information = new MySqlInformationRepository(pool);
    const reads = new MySqlChangeConfigurationReadRepository(pool);

    async function createTenantContext(label: string) {
      const tenantId = asId<'TenantId'>(`TENANT-CFG-${label}-${suffix}`, 'Tenant');
      const tenant: Tenant = {
        id: tenantId,
        name: `Configuration ${label}`,
        status: 'ACTIVE'
      };
      await kernel.createTenant(tenant);

      const party: Party = {
        id: asId<'PartyId'>(`PARTY-CFG-${label}-${suffix}`, 'Party'),
        tenantId,
        kind: 'PERSON',
        displayName: `Configuration Manager ${label}`,
        status: 'ACTIVE'
      };
      await kernel.createParty(tenantId, party);

      const person: Person = {
        id: asId<'PersonId'>(`PERSON-CFG-${label}-${suffix}`, 'Person'),
        tenantId,
        partyId: party.id,
        legalName: `Configuration Manager ${label}`,
        status: 'ACTIVE'
      };
      await kernel.createPerson(tenantId, person);

      return { tenantId, person };
    }

    const tenantA = await createTenantContext('A');
    const tenantB = await createTenantContext('B');

    const changeObject: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`OBJ-CHANGE-${suffix}`, 'Canonical Object'),
      tenantId: tenantA.tenantId,
      objectType: 'CHANGE',
      stableKey: `CHG-${suffix}`,
      createdAt: '2026-09-21T12:00:00.000Z'
    };
    const targetObject: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`OBJ-INFO-${suffix}`, 'Canonical Object'),
      tenantId: tenantA.tenantId,
      objectType: 'INFORMATION_CONTAINER',
      stableKey: `A-1001-${suffix}`,
      createdAt: '2026-09-21T12:00:00.000Z'
    };
    const projectObject: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`OBJ-PROJECT-${suffix}`, 'Canonical Object'),
      tenantId: tenantA.tenantId,
      objectType: 'PROJECT',
      stableKey: `PROJECT-${suffix}`,
      createdAt: '2026-09-21T12:00:00.000Z'
    };

    for (const object of [changeObject, targetObject, projectObject]) {
      await kernel.createCanonicalObject(tenantA.tenantId, object, {
        actorPersonId: tenantA.person.id
      });
    }

    const change: Change = {
      id: asId<'ChangeId'>(`CHANGE-${suffix}`, 'Change'),
      tenantId: tenantA.tenantId,
      canonicalObjectId: changeObject.id,
      code: `CHG-${suffix}`,
      title: 'Coordinate revised design information',
      description: 'Assess and implement the controlled design amendment.',
      changeType: 'DESIGN_CHANGE',
      status: 'DRAFT',
      raisedByPersonId: tenantA.person.id,
      raisedAt: '2026-09-21T12:10:00.000Z'
    };
    await changes.createChange(tenantA.tenantId, change, {
      actorPersonId: tenantA.person.id,
      correlationId: 'CONFIGURATION-READ-TEST'
    });
    await changes.startAssessment(
      tenantA.tenantId,
      change.id,
      '2026-09-21T12:15:00.000Z',
      { actorPersonId: tenantA.person.id }
    );

    const affected: ChangeAffectedObject = {
      id: asId<'ChangeAffectedObjectId'>(`AFFECT-${suffix}`, 'Change Affected Object'),
      tenantId: tenantA.tenantId,
      changeId: change.id,
      subjectObjectId: targetObject.id,
      subjectVersion: 'A',
      disposition: 'MODIFY',
      rationale: 'Revision A requires coordinated amendment.'
    };
    await changes.addAffectedObject(tenantA.tenantId, affected, {
      actorPersonId: tenantA.person.id
    });

    const impact: ChangeImpactAssessment = {
      id: asId<'ChangeImpactAssessmentId'>(`IMPACT-${suffix}`, 'Change Impact Assessment'),
      tenantId: tenantA.tenantId,
      changeId: change.id,
      domain: 'DESIGN',
      assessorPersonId: tenantA.person.id,
      assessedAt: '2026-09-21T12:20:00.000Z',
      impactLevel: 'MEDIUM',
      summary: 'Drawing and coordination model require revision.',
      scheduleImpactDays: 1
    };
    await changes.addImpactAssessment(tenantA.tenantId, impact, {
      actorPersonId: tenantA.person.id
    });

    const configurationItem: ConfigurationItem = {
      id: asId<'ConfigurationItemId'>(`CI-${suffix}`, 'Configuration Item'),
      tenantId: tenantA.tenantId,
      canonicalObjectId: targetObject.id,
      code: `CI-A-1001-${suffix}`,
      name: 'Ground Floor Drawing',
      status: 'ACTIVE'
    };
    await information.createConfigurationItem(tenantA.tenantId, configurationItem, {
      actorPersonId: tenantA.person.id
    });

    const baseline: Baseline = {
      id: asId<'BaselineId'>(`BL-${suffix}`, 'Baseline'),
      tenantId: tenantA.tenantId,
      contextObjectId: projectObject.id,
      code: `DESIGN-BL-${suffix}`,
      name: 'Design Coordination Baseline',
      status: 'DRAFT'
    };
    await information.createBaseline(tenantA.tenantId, baseline, {
      actorPersonId: tenantA.person.id
    });

    const baselineItem: BaselineItem = {
      id: asId<'BaselineItemId'>(`BLI-${suffix}`, 'Baseline Item'),
      tenantId: tenantA.tenantId,
      baselineId: baseline.id,
      configurationItemId: configurationItem.id,
      subjectVersion: 'A'
    };
    await information.addBaselineItem(tenantA.tenantId, baselineItem, {
      actorPersonId: tenantA.person.id
    });

    const effectivity: Effectivity = {
      id: asId<'EffectivityId'>(`EFF-${suffix}`, 'Effectivity'),
      tenantId: tenantA.tenantId,
      configurationItemId: configurationItem.id,
      subjectVersion: 'A',
      effectivityType: 'PROJECT',
      scopeType: 'PROJECT',
      scopeId: projectObject.id,
      status: 'ACTIVE'
    };
    await information.createEffectivity(tenantA.tenantId, effectivity, {
      actorPersonId: tenantA.person.id
    });

    const tenantBObject: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`OBJ-B-${suffix}`, 'Canonical Object'),
      tenantId: tenantB.tenantId,
      objectType: 'CHANGE',
      stableKey: `CHG-B-${suffix}`,
      createdAt: '2026-09-21T13:00:00.000Z'
    };
    await kernel.createCanonicalObject(tenantB.tenantId, tenantBObject, {
      actorPersonId: tenantB.person.id
    });
    await changes.createChange(
      tenantB.tenantId,
      {
        id: asId<'ChangeId'>(`CHANGE-B-${suffix}`, 'Change'),
        tenantId: tenantB.tenantId,
        canonicalObjectId: tenantBObject.id,
        code: `CHG-B-${suffix}`,
        title: 'Other tenant change',
        description: 'Must not appear in tenant A.',
        changeType: 'OTHER',
        status: 'DRAFT',
        raisedByPersonId: tenantB.person.id,
        raisedAt: '2026-09-21T13:05:00.000Z'
      },
      { actorPersonId: tenantB.person.id }
    );

    const projectionA = await reads.getProjection(tenantA.tenantId);
    expect(projectionA.changes).toHaveLength(1);
    expect(projectionA.changes[0]).toEqual(
      expect.objectContaining({
        id: change.id,
        status: 'UNDER_ASSESSMENT',
        affectedObjects: [
          expect.objectContaining({
            id: affected.id,
            stableKey: targetObject.stableKey,
            subjectVersion: 'A'
          })
        ],
        impactAssessments: [
          expect.objectContaining({
            id: impact.id,
            impactLevel: 'MEDIUM'
          })
        ]
      })
    );
    expect(projectionA.changes[0]?.history.map((entry) => entry.status)).toEqual([
      'DRAFT',
      'UNDER_ASSESSMENT'
    ]);
    expect(projectionA.configurationItems).toEqual([
      expect.objectContaining({ id: configurationItem.id, canonicalObjectId: targetObject.id })
    ]);
    expect(projectionA.baselines).toEqual([
      expect.objectContaining({
        id: baseline.id,
        contextObjectId: projectObject.id,
        items: [
          expect.objectContaining({
            id: baselineItem.id,
            configurationItemId: configurationItem.id,
            subjectVersion: 'A'
          })
        ]
      })
    ]);
    expect(projectionA.effectivities).toEqual([
      expect.objectContaining({
        id: effectivity.id,
        configurationItemId: configurationItem.id,
        scopeId: projectObject.id
      })
    ]);
    expect(projectionA.totals).toMatchObject({
      changes: 1,
      openChanges: 1,
      configurationItems: 1,
      baselines: 1,
      effectivities: 1
    });

    const projectionB = await reads.getProjection(tenantB.tenantId);
    expect(projectionB.changes).toHaveLength(1);
    expect(projectionB.changes[0]?.code).toBe(`CHG-B-${suffix}`);
    expect(projectionB.configurationItems).toEqual([]);
    expect(projectionB.baselines).toEqual([]);
    expect(projectionB.effectivities).toEqual([]);
  });
});
