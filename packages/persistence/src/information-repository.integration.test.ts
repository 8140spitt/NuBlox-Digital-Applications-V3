import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  asId,
  type Baseline,
  type BaselineItem,
  type CanonicalObjectIdentity,
  type ConfigurationItem,
  type Decision,
  type Effectivity,
  type InformationContainer,
  type InformationIssue,
  type InformationIteration,
  type InformationRevision,
  type Party,
  type Person,
  type Representation,
  type Tenant
} from '@nublox/kernel';
import { MySqlKernelControlRepository } from './control-repository.js';
import { createDatabasePool } from './database.js';
import { MySqlInformationRepository } from './information-repository.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('MySQL controlled information and configuration runtime', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('preserves exact information revisions through release, issue, baselines, supersession and effectivity status accounting', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = `INFO-${Date.now().toString(36)}`;
    const tenantId = asId<'TenantId'>(`TENANT-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const control = new MySqlKernelControlRepository(pool);
    const information = new MySqlInformationRepository(pool);

    const tenant: Tenant = {
      id: tenantId,
      name: 'Information Configuration Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant);

    const personParty: Party = {
      id: asId<'PartyId'>(`PARTY-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Information Approver',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, personParty);

    const person: Person = {
      id: asId<'PersonId'>(`PERSON-${suffix}`, 'Person'),
      tenantId,
      partyId: personParty.id,
      legalName: 'Information Approver',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, person);

    const informationObject: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`OBJ-INFO-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'INFORMATION_CONTAINER',
      stableKey: `A-1001-${suffix}`,
      createdAt: '2026-09-20T09:00:00.000Z'
    };
    await kernel.createCanonicalObject(tenantId, informationObject, {
      actorPersonId: person.id
    });

    const projectObject: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`OBJ-PROJECT-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'PROJECT',
      stableKey: `PROJECT-${suffix}`,
      createdAt: '2026-09-20T09:00:00.000Z'
    };
    await kernel.createCanonicalObject(tenantId, projectObject, {
      actorPersonId: person.id
    });

    const container: InformationContainer = {
      id: asId<'InformationContainerId'>(`INFO-${suffix}`, 'Information Container'),
      tenantId,
      canonicalObjectId: informationObject.id,
      containerType: 'DRAWING',
      code: 'A-1001',
      title: 'Ground Floor Plan',
      status: 'ACTIVE'
    };
    await information.createInformationContainer(tenantId, container, {
      actorPersonId: person.id
    });

    const revisionA: InformationRevision = {
      id: asId<'InformationRevisionId'>(`REV-A-${suffix}`, 'Information Revision'),
      tenantId,
      informationContainerId: container.id,
      revision: 'A',
      status: 'DRAFT',
      createdAt: '2026-09-20T09:05:00.000Z'
    };
    await information.createInformationRevision(tenantId, revisionA, {
      actorPersonId: person.id
    });

    const iterationA: InformationIteration = {
      id: asId<'InformationIterationId'>(`ITER-A1-${suffix}`, 'Information Iteration'),
      tenantId,
      informationRevisionId: revisionA.id,
      iteration: 1,
      status: 'WORKING',
      createdAt: '2026-09-20T09:10:00.000Z',
      authorPersonId: person.id
    };
    await information.createInformationIteration(tenantId, iterationA, {
      actorPersonId: person.id
    });
    const frozenA = await information.freezeInformationIteration(
      tenantId,
      iterationA.id,
      { actorPersonId: person.id }
    );
    expect(frozenA.status).toBe('FROZEN');

    const representationA: Representation = {
      id: asId<'RepresentationId'>(`REP-A-${suffix}`, 'Representation'),
      tenantId,
      informationIterationId: frozenA.id,
      representationType: 'PDF',
      mediaType: 'application/pdf',
      fileName: 'A-1001-A.pdf',
      contentReference: `urn:nublox:content:${suffix}:A:pdf`,
      integrityHash: 'sha256:revision-a',
      generatedAt: '2026-09-20T09:30:00.000Z'
    };
    await information.createRepresentation(tenantId, representationA, {
      actorPersonId: person.id
    });

    const releaseDecisionA: Decision = {
      id: asId<'DecisionId'>(`DEC-REL-A-${suffix}`, 'Decision'),
      tenantId,
      decisionType: 'INFORMATION_APPROVAL',
      subjectObjectId: informationObject.id,
      subjectVersion: 'A',
      outcome: 'APPROVED',
      reason: 'Revision A approved for construction issue.',
      deciderPersonId: person.id,
      decidedAt: '2026-09-20T09:55:00.000Z'
    };
    await control.createDecision(tenantId, releaseDecisionA, {
      actorPersonId: person.id,
      correlationId: suffix
    });

    const releasedA = await information.releaseInformationRevision(
      tenantId,
      revisionA.id,
      frozenA.id,
      '2026-09-20T10:00:00.000Z',
      releaseDecisionA.id,
      { actorPersonId: person.id, correlationId: suffix }
    );
    expect(releasedA.status).toBe('RELEASED');
    expect(releasedA.releaseDecisionId).toBe(releaseDecisionA.id);

    const issueA: InformationIssue = {
      id: asId<'InformationIssueId'>(`ISSUE-A-${suffix}`, 'Information Issue'),
      tenantId,
      informationContainerId: container.id,
      informationRevisionId: releasedA.id,
      representationId: representationA.id,
      issueReference: 'TR-0001',
      issuePurpose: 'FOR CONSTRUCTION',
      issuedByPersonId: person.id,
      issuedAt: '2026-09-20T10:05:00.000Z',
      recipientContext: 'Main contractor'
    };
    await information.issueInformation(tenantId, issueA, {
      actorPersonId: person.id,
      correlationId: suffix
    });

    const configurationItem: ConfigurationItem = {
      id: asId<'ConfigurationItemId'>(`CI-${suffix}`, 'Configuration Item'),
      tenantId,
      canonicalObjectId: informationObject.id,
      code: 'CI-A-1001',
      name: 'Ground Floor Plan',
      status: 'ACTIVE'
    };
    await information.createConfigurationItem(tenantId, configurationItem, {
      actorPersonId: person.id
    });

    const baseline1: Baseline = {
      id: asId<'BaselineId'>(`BL-1-${suffix}`, 'Baseline'),
      tenantId,
      contextObjectId: projectObject.id,
      code: 'DESIGN-BL-001',
      name: 'Design Baseline 001',
      status: 'DRAFT'
    };
    await information.createBaseline(tenantId, baseline1, {
      actorPersonId: person.id
    });

    const baselineItemA: BaselineItem = {
      id: asId<'BaselineItemId'>(`BLI-A-${suffix}`, 'Baseline Item'),
      tenantId,
      baselineId: baseline1.id,
      configurationItemId: configurationItem.id,
      subjectVersion: 'A'
    };
    await information.addBaselineItem(tenantId, baselineItemA, {
      actorPersonId: person.id
    });

    const baselineDecision1: Decision = {
      id: asId<'DecisionId'>(`DEC-BL1-${suffix}`, 'Decision'),
      tenantId,
      decisionType: 'BASELINE_ESTABLISHMENT',
      subjectObjectId: projectObject.id,
      outcome: 'APPROVED',
      reason: 'Initial design baseline approved.',
      deciderPersonId: person.id,
      decidedAt: '2026-09-20T10:30:00.000Z'
    };
    await control.createDecision(tenantId, baselineDecision1, {
      actorPersonId: person.id
    });

    const established1 = await information.establishBaseline(
      tenantId,
      baseline1.id,
      baselineDecision1.id,
      '2026-09-20T10:31:00.000Z',
      { actorPersonId: person.id, correlationId: suffix }
    );
    expect(established1.status).toBe('ESTABLISHED');

    const effectivityA: Effectivity = {
      id: asId<'EffectivityId'>(`EFF-A-${suffix}`, 'Effectivity'),
      tenantId,
      configurationItemId: configurationItem.id,
      subjectVersion: 'A',
      effectivityType: 'PROJECT',
      scopeType: 'PROJECT',
      scopeId: projectObject.id,
      status: 'ACTIVE'
    };
    await information.createEffectivity(tenantId, effectivityA, {
      actorPersonId: person.id
    });

    const revisionB: InformationRevision = {
      id: asId<'InformationRevisionId'>(`REV-B-${suffix}`, 'Information Revision'),
      tenantId,
      informationContainerId: container.id,
      revision: 'B',
      status: 'DRAFT',
      createdAt: '2026-09-21T09:00:00.000Z'
    };
    await information.createInformationRevision(tenantId, revisionB, {
      actorPersonId: person.id
    });

    const iterationB: InformationIteration = {
      id: asId<'InformationIterationId'>(`ITER-B1-${suffix}`, 'Information Iteration'),
      tenantId,
      informationRevisionId: revisionB.id,
      iteration: 1,
      status: 'WORKING',
      createdAt: '2026-09-21T09:05:00.000Z',
      authorPersonId: person.id
    };
    await information.createInformationIteration(tenantId, iterationB, {
      actorPersonId: person.id
    });
    const frozenB = await information.freezeInformationIteration(
      tenantId,
      iterationB.id,
      { actorPersonId: person.id }
    );

    const releaseDecisionB: Decision = {
      id: asId<'DecisionId'>(`DEC-REL-B-${suffix}`, 'Decision'),
      tenantId,
      decisionType: 'INFORMATION_APPROVAL',
      subjectObjectId: informationObject.id,
      subjectVersion: 'B',
      outcome: 'APPROVED',
      reason: 'Revision B approved.',
      deciderPersonId: person.id,
      decidedAt: '2026-09-21T09:55:00.000Z'
    };
    await control.createDecision(tenantId, releaseDecisionB, {
      actorPersonId: person.id
    });

    const releasedB = await information.releaseInformationRevision(
      tenantId,
      revisionB.id,
      frozenB.id,
      '2026-09-21T10:00:00.000Z',
      releaseDecisionB.id,
      { actorPersonId: person.id }
    );
    await information.supersedeInformationRevision(
      tenantId,
      releasedA.id,
      releasedB.id,
      { actorPersonId: person.id }
    );

    const baseline2: Baseline = {
      id: asId<'BaselineId'>(`BL-2-${suffix}`, 'Baseline'),
      tenantId,
      contextObjectId: projectObject.id,
      code: 'DESIGN-BL-002',
      name: 'Design Baseline 002',
      status: 'DRAFT'
    };
    await information.createBaseline(tenantId, baseline2, {
      actorPersonId: person.id
    });

    await information.addBaselineItem(
      tenantId,
      {
        id: asId<'BaselineItemId'>(`BLI-B-${suffix}`, 'Baseline Item'),
        tenantId,
        baselineId: baseline2.id,
        configurationItemId: configurationItem.id,
        subjectVersion: 'B'
      },
      { actorPersonId: person.id }
    );

    const baselineDecision2: Decision = {
      id: asId<'DecisionId'>(`DEC-BL2-${suffix}`, 'Decision'),
      tenantId,
      decisionType: 'BASELINE_ESTABLISHMENT',
      subjectObjectId: projectObject.id,
      outcome: 'APPROVED',
      reason: 'Replacement design baseline approved.',
      deciderPersonId: person.id,
      decidedAt: '2026-09-21T10:30:00.000Z'
    };
    await control.createDecision(tenantId, baselineDecision2, {
      actorPersonId: person.id
    });

    const established2 = await information.establishBaseline(
      tenantId,
      baseline2.id,
      baselineDecision2.id,
      '2026-09-21T10:31:00.000Z',
      { actorPersonId: person.id }
    );
    await information.supersedeBaseline(
      tenantId,
      established1.id,
      established2.id,
      { actorPersonId: person.id }
    );

    const effectivityB: Effectivity = {
      id: asId<'EffectivityId'>(`EFF-B-${suffix}`, 'Effectivity'),
      tenantId,
      configurationItemId: configurationItem.id,
      subjectVersion: 'B',
      effectivityType: 'PROJECT',
      scopeType: 'PROJECT',
      scopeId: projectObject.id,
      status: 'ACTIVE'
    };
    await information.createEffectivity(tenantId, effectivityB, {
      actorPersonId: person.id
    });

    const status = await information.listConfigurationStatus(
      tenantId,
      projectObject.id
    );

    expect(status).toHaveLength(2);
    expect(status[0]).toEqual(
      expect.objectContaining({
        baselineCode: 'DESIGN-BL-001',
        baselineStatus: 'SUPERSEDED',
        configurationItemCode: 'CI-A-1001',
        subjectVersion: 'A'
      })
    );
    expect(status[0]?.effectivities).toEqual([
      expect.objectContaining({
        subjectVersion: 'A',
        scopeId: projectObject.id
      })
    ]);

    expect(status[1]).toEqual(
      expect.objectContaining({
        baselineCode: 'DESIGN-BL-002',
        baselineStatus: 'ESTABLISHED',
        subjectVersion: 'B'
      })
    );
    expect(status[1]?.effectivities).toEqual([
      expect.objectContaining({
        subjectVersion: 'B',
        scopeId: projectObject.id
      })
    ]);

    const persistedA = await information.getInformationRevision(
      tenantId,
      revisionA.id
    );
    expect(persistedA.status).toBe('SUPERSEDED');
    expect(persistedA.supersededByRevisionId).toBe(revisionB.id);

    const [issueRows] = await pool.query(
      `SELECT issue_reference, issue_purpose, representation_id
         FROM information_issues
        WHERE tenant_id = ? AND information_revision_id = ?`,
      [tenantId, revisionA.id]
    );
    expect(issueRows).toEqual([
      expect.objectContaining({
        issue_reference: 'TR-0001',
        issue_purpose: 'FOR CONSTRUCTION',
        representation_id: representationA.id
      })
    ]);
  });
});
