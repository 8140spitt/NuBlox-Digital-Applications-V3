import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  asId,
  type Baseline,
  type BaselineItem,
  type CanonicalObjectIdentity,
  type Change,
  type ChangeAffectedObject,
  type ChangeDiscrepancy,
  type ChangeImpactAssessment,
  type ChangeImplementationAction,
  type ChangeVerification,
  type ConfigurationItem,
  type Decision,
  type EvidenceRecord,
  type Party,
  type Person,
  type Tenant
} from '@nublox/kernel';
import { MySqlChangeRepository } from './change-repository.js';
import { MySqlKernelControlRepository } from './control-repository.js';
import { createDatabasePool } from './database.js';
import { MySqlInformationRepository } from './information-repository.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('MySQL governed change runtime', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('governs assessment, decision, implementation, verification, discrepancy resolution and resulting baseline', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = `CHANGE-${Date.now().toString(36)}`;
    const tenantId = asId<'TenantId'>(`TENANT-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const control = new MySqlKernelControlRepository(pool);
    const information = new MySqlInformationRepository(pool);
    const changes = new MySqlChangeRepository(pool);

    const tenant: Tenant = {
      id: tenantId,
      name: 'Governed Change Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant);

    const personParty: Party = {
      id: asId<'PartyId'>(`PARTY-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Change Manager',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, personParty);

    const person: Person = {
      id: asId<'PersonId'>(`PERSON-${suffix}`, 'Person'),
      tenantId,
      partyId: personParty.id,
      legalName: 'Change Manager',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, person);

    const changeObject: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`OBJ-CHANGE-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'CHANGE',
      stableKey: `CHG-${suffix}`,
      createdAt: '2026-09-20T09:00:00.000Z'
    };
    const targetObject: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`OBJ-TARGET-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'INFORMATION_CONTAINER',
      stableKey: `A-1001-${suffix}`,
      createdAt: '2026-09-20T09:00:00.000Z'
    };
    const projectObject: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`OBJ-PROJECT-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'PROJECT',
      stableKey: `PROJECT-${suffix}`,
      createdAt: '2026-09-20T09:00:00.000Z'
    };

    await kernel.createCanonicalObject(tenantId, changeObject, {
      actorPersonId: person.id
    });
    await kernel.createCanonicalObject(tenantId, targetObject, {
      actorPersonId: person.id
    });
    await kernel.createCanonicalObject(tenantId, projectObject, {
      actorPersonId: person.id
    });

    const change: Change = {
      id: asId<'ChangeId'>(`CHANGE-${suffix}`, 'Change'),
      tenantId,
      canonicalObjectId: changeObject.id,
      code: `CHG-${suffix}`,
      title: 'Revise ground floor layout',
      description: 'Coordinate and implement the approved design change.',
      changeType: 'DESIGN_CHANGE',
      status: 'DRAFT',
      raisedByPersonId: person.id,
      raisedAt: '2026-09-20T10:00:00.000Z'
    };
    await changes.createChange(tenantId, change, {
      actorPersonId: person.id,
      correlationId: suffix
    });

    const assessing = await changes.startAssessment(
      tenantId,
      change.id,
      '2026-09-20T10:05:00.000Z',
      { actorPersonId: person.id, correlationId: suffix }
    );
    expect(assessing.status).toBe('UNDER_ASSESSMENT');

    await expect(
      changes.submitForDecision(
        tenantId,
        change.id,
        '2026-09-20T10:06:00.000Z',
        { actorPersonId: person.id }
      )
    ).rejects.toThrow('Change cannot await decision without affected objects.');

    const affected: ChangeAffectedObject = {
      id: asId<'ChangeAffectedObjectId'>(`AFFECT-${suffix}`, 'Change Affected Object'),
      tenantId,
      changeId: change.id,
      subjectObjectId: targetObject.id,
      subjectVersion: 'A',
      disposition: 'MODIFY',
      rationale: 'Ground floor drawing must be revised.'
    };
    await changes.addAffectedObject(tenantId, affected, {
      actorPersonId: person.id
    });

    const assessment: ChangeImpactAssessment = {
      id: asId<'ChangeImpactAssessmentId'>(`IMPACT-${suffix}`, 'Change Impact Assessment'),
      tenantId,
      changeId: change.id,
      domain: 'COST_AND_PROGRAMME',
      assessorPersonId: person.id,
      assessedAt: '2026-09-20T10:10:00.000Z',
      impactLevel: 'MEDIUM',
      summary: 'Drawing rework plus minor cost and one-day programme impact.',
      costImpact: 1500,
      scheduleImpactDays: 1
    };
    await changes.addImpactAssessment(tenantId, assessment, {
      actorPersonId: person.id
    });

    const awaiting = await changes.submitForDecision(
      tenantId,
      change.id,
      '2026-09-20T10:15:00.000Z',
      { actorPersonId: person.id, correlationId: suffix }
    );
    expect(awaiting.status).toBe('AWAITING_DECISION');

    const decision: Decision = {
      id: asId<'DecisionId'>(`DEC-${suffix}`, 'Decision'),
      tenantId,
      decisionType: 'CHANGE_APPROVAL',
      subjectObjectId: changeObject.id,
      outcome: 'APPROVED',
      reason: 'Change approved for implementation.',
      deciderPersonId: person.id,
      decidedAt: '2026-09-20T10:20:00.000Z'
    };
    await control.createDecision(tenantId, decision, {
      actorPersonId: person.id,
      correlationId: suffix
    });

    const approved = await changes.applyDecision(
      tenantId,
      change.id,
      decision.id,
      { actorPersonId: person.id, correlationId: suffix }
    );
    expect(approved.status).toBe('APPROVED');
    expect(approved.decisionId).toBe(decision.id);

    const implementing = await changes.startImplementation(
      tenantId,
      change.id,
      '2026-09-20T10:25:00.000Z',
      { actorPersonId: person.id }
    );
    expect(implementing.status).toBe('IMPLEMENTING');

    const action: ChangeImplementationAction = {
      id: asId<'ChangeImplementationActionId'>(`ACTION-${suffix}`, 'Change Implementation Action'),
      tenantId,
      changeId: change.id,
      actionType: 'REVISE_INFORMATION',
      description: 'Revise drawing A-1001 from A to B.',
      targetObjectId: targetObject.id,
      targetVersion: 'A',
      status: 'PLANNED'
    };
    await changes.createImplementationAction(tenantId, action, {
      actorPersonId: person.id
    });

    await expect(
      changes.beginVerification(
        tenantId,
        change.id,
        '2026-09-20T10:30:00.000Z',
        { actorPersonId: person.id }
      )
    ).rejects.toThrow(
      'Change cannot enter verification while implementation actions remain open.'
    );

    await changes.startImplementationAction(
      tenantId,
      action.id,
      '2026-09-20T10:35:00.000Z',
      { actorPersonId: person.id }
    );
    await changes.completeImplementationAction(
      tenantId,
      action.id,
      '2026-09-20T11:00:00.000Z',
      { actorPersonId: person.id }
    );

    const verifying = await changes.beginVerification(
      tenantId,
      change.id,
      '2026-09-20T11:05:00.000Z',
      { actorPersonId: person.id, correlationId: suffix }
    );
    expect(verifying.status).toBe('VERIFYING');

    const discrepancy: ChangeDiscrepancy = {
      id: asId<'ChangeDiscrepancyId'>(`DISC-${suffix}`, 'Change Discrepancy'),
      tenantId,
      changeId: change.id,
      affectedObjectId: affected.id,
      description: 'As-built annotation initially omitted.',
      status: 'OPEN'
    };
    await changes.createDiscrepancy(tenantId, discrepancy, {
      actorPersonId: person.id
    });

    const evidence: EvidenceRecord = {
      id: asId<'EvidenceRecordId'>(`EVIDENCE-${suffix}`, 'Evidence'),
      tenantId,
      evidenceType: 'CHANGE_VERIFICATION',
      subjectObjectId: changeObject.id,
      capturedByPersonId: person.id,
      capturedAt: '2026-09-20T11:10:00.000Z',
      contentReference: `urn:nublox:change-verification:${suffix}`,
      integrityHash: 'sha256:change-verification'
    };
    await control.recordEvidence(tenantId, evidence, {
      actorPersonId: person.id,
      correlationId: suffix
    });

    const verification: ChangeVerification = {
      id: asId<'ChangeVerificationId'>(`VERIFY-${suffix}`, 'Change Verification'),
      tenantId,
      changeId: change.id,
      verifierPersonId: person.id,
      verifiedAt: '2026-09-20T11:15:00.000Z',
      outcome: 'PASS',
      evidenceRecordId: evidence.id,
      notes: 'Approved change is implemented and technically verified.'
    };
    await changes.createVerification(tenantId, verification, {
      actorPersonId: person.id
    });

    await expect(
      changes.closeChange(
        tenantId,
        change.id,
        '2026-09-20T11:20:00.000Z',
        undefined,
        { actorPersonId: person.id }
      )
    ).rejects.toThrow('Change cannot close while discrepancies remain open.');

    await changes.resolveDiscrepancy(
      tenantId,
      discrepancy.id,
      'RESOLVED',
      '2026-09-20T11:25:00.000Z',
      'As-built annotation added and rechecked.',
      { actorPersonId: person.id }
    );

    const configurationItem: ConfigurationItem = {
      id: asId<'ConfigurationItemId'>(`CI-${suffix}`, 'Configuration Item'),
      tenantId,
      canonicalObjectId: targetObject.id,
      code: 'CI-A-1001',
      name: 'Ground Floor Drawing',
      status: 'ACTIVE'
    };
    await information.createConfigurationItem(tenantId, configurationItem, {
      actorPersonId: person.id
    });

    const baseline: Baseline = {
      id: asId<'BaselineId'>(`BL-${suffix}`, 'Baseline'),
      tenantId,
      contextObjectId: projectObject.id,
      code: 'POST-CHANGE-BL',
      name: 'Post-change Design Baseline',
      status: 'DRAFT'
    };
    await information.createBaseline(tenantId, baseline, {
      actorPersonId: person.id
    });

    const baselineItem: BaselineItem = {
      id: asId<'BaselineItemId'>(`BLI-${suffix}`, 'Baseline Item'),
      tenantId,
      baselineId: baseline.id,
      configurationItemId: configurationItem.id,
      subjectVersion: 'B'
    };
    await information.addBaselineItem(tenantId, baselineItem, {
      actorPersonId: person.id
    });

    const baselineDecision: Decision = {
      id: asId<'DecisionId'>(`DEC-BL-${suffix}`, 'Decision'),
      tenantId,
      decisionType: 'BASELINE_ESTABLISHMENT',
      subjectObjectId: projectObject.id,
      outcome: 'APPROVED',
      reason: 'Post-change baseline approved.',
      deciderPersonId: person.id,
      decidedAt: '2026-09-20T11:30:00.000Z'
    };
    await control.createDecision(tenantId, baselineDecision, {
      actorPersonId: person.id
    });

    const establishedBaseline = await information.establishBaseline(
      tenantId,
      baseline.id,
      baselineDecision.id,
      '2026-09-20T11:31:00.000Z',
      { actorPersonId: person.id }
    );

    const closed = await changes.closeChange(
      tenantId,
      change.id,
      '2026-09-20T11:35:00.000Z',
      establishedBaseline.id,
      { actorPersonId: person.id, correlationId: suffix }
    );
    expect(closed.status).toBe('CLOSED');
    expect(closed.resultingBaselineId).toBe(establishedBaseline.id);

    const persisted = await changes.getChange(tenantId, change.id);
    expect(persisted.status).toBe('CLOSED');
    expect(persisted.decisionId).toBe(decision.id);
    expect(persisted.resultingBaselineId).toBe(establishedBaseline.id);

    const [historyRows] = await pool.query(
      `SELECT status
         FROM change_status_history
        WHERE tenant_id = ? AND change_id = ?
        ORDER BY history_id`,
      [tenantId, change.id]
    );
    expect((historyRows as Array<{ status: string }>).map((row) => row.status)).toEqual([
      'DRAFT',
      'UNDER_ASSESSMENT',
      'AWAITING_DECISION',
      'APPROVED',
      'IMPLEMENTING',
      'VERIFYING',
      'CLOSED'
    ]);
  });
});
