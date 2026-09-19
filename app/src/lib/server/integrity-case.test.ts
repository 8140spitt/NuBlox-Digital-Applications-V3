import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let integrity: typeof import('./integrity-case');
let person: typeof import('./foundation-person');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  integrity = await import('./integrity-case');
  person = await import('./foundation-person');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

describe('F02.07 restricted Integrity Case runtime', () => {
  it('requires explicit case access in addition to tenant permission and keeps sensitive narrative out of business events', async () => {
    const tenant = 'ethics-access-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const manager = await contextService.resolveDevelopmentCommandContext(tenant);
    const observerId = await person.createPerson(manager, {
      givenName: 'Case',
      familyName: 'Observer'
    });

    const caseId = await integrity.createIntegrityCase(manager, {
      caseRef: 'ETH-0001',
      caseType: 'CONDUCT',
      title: 'Restricted conduct concern',
      issueSummary: 'SENSITIVE-ALLEGATION-MUST-NOT-ENTER-EVENT-STREAM',
      sourceType: 'SPEAK_UP',
      severity: 'HIGH',
      subjects: [{ partyId: observerId, subjectRole: 'RELATED' }]
    });

    const observer = { ...manager, actorPartyId: observerId, actorDisplayName: 'Case Observer' };
    expect(await integrity.listIntegrityCases(observer)).toHaveLength(0);

    await integrity.grantIntegrityCaseAccess(manager, caseId, observerId, 'OBSERVER');
    const visible = await integrity.listIntegrityCases(observer);
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe(caseId);
    expect(visible[0].accessRole).toBe('OBSERVER');

    await expect(
      integrity.recordIntegrityCaseEntry(observer, caseId, {
        entryType: 'NOTE',
        summary: 'Should not be allowed.'
      })
    ).rejects.toThrow('sufficient case access');

    const eventRows = await db.queryRows<any>(
      'SELECT payload_json AS payloadJson FROM business_events WHERE tenant_id=? AND aggregate_object_id=? ORDER BY occurred_at',
      [manager.tenantId, caseId]
    );
    expect(eventRows.length).toBeGreaterThan(0);
    expect(eventRows.map((row) => row.payloadJson).join('\n')).not.toContain(
      'SENSITIVE-ALLEGATION-MUST-NOT-ENTER-EVENT-STREAM'
    );

    await integrity.revokeIntegrityCaseAccess(manager, caseId, observerId);
    expect(await integrity.listIntegrityCases(observer)).toHaveLength(0);
  });

  it('governs investigation, decision and follow-up while retaining separate shared identities', async () => {
    const tenant = 'ethics-flow-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const manager = await contextService.resolveDevelopmentCommandContext(tenant);
    const investigatorId = await person.createPerson(manager, {
      givenName: 'Integrity',
      familyName: 'Investigator'
    });

    const caseId = await integrity.createIntegrityCase(manager, {
      caseRef: 'ETH-0002',
      caseType: 'CONFLICT_OF_INTEREST',
      title: 'Declared conflict',
      issueSummary: 'Potential conflict requires independent review.',
      sourceType: 'DECLARATION',
      severity: 'MEDIUM'
    });

    await integrity.grantIntegrityCaseAccess(manager, caseId, investigatorId, 'INVESTIGATOR');

    let record = (await integrity.listIntegrityCases(manager)).find((row) => row.id === caseId)!;
    await integrity.assignIntegrityCaseOwner(
      manager,
      caseId,
      investigatorId,
      record.aggregateVersion
    );

    record = (await integrity.listIntegrityCases(manager)).find((row) => row.id === caseId)!;
    await integrity.transitionIntegrityCase(manager, caseId, record.aggregateVersion, {
      toStatus: 'TRIAGE',
      summary: 'Triage started.'
    });

    record = (await integrity.listIntegrityCases(manager)).find((row) => row.id === caseId)!;
    await integrity.transitionIntegrityCase(manager, caseId, record.aggregateVersion, {
      toStatus: 'OPEN',
      summary: 'Independent review required.'
    });

    const investigator = {
      ...manager,
      actorPartyId: investigatorId,
      actorDisplayName: 'Integrity Investigator'
    };
    record = (await integrity.listIntegrityCases(investigator)).find((row) => row.id === caseId)!;
    await integrity.transitionIntegrityCase(investigator, caseId, record.aggregateVersion, {
      toStatus: 'INVESTIGATING',
      summary: 'Investigation commenced.'
    });
    await integrity.recordIntegrityCaseEntry(investigator, caseId, {
      entryType: 'INVESTIGATION_NOTE',
      summary: 'Initial evidence reviewed.'
    });

    record = (await integrity.listIntegrityCases(manager)).find((row) => row.id === caseId)!;
    await integrity.transitionIntegrityCase(manager, caseId, record.aggregateVersion, {
      toStatus: 'DECISION_ACTION',
      summary: 'Investigation complete; decision required.'
    });

    const decisionId = await integrity.recordIntegrityCaseDecision(manager, caseId, {
      outcome: 'MITIGATION_REQUIRED',
      reason: 'Conflict can be controlled through recusal and independent approval.'
    });
    const action = await integrity.createIntegrityCaseAction(manager, caseId, {
      title: 'Implement conflict controls',
      instructions: 'Record recusal and route affected decisions to independent authority.',
      priority: 'HIGH'
    });

    expect(
      (await integrity.listIntegrityCaseDecisionIds(manager, caseId)).map((row) => row.decisionId)
    ).toContain(decisionId);
    expect(
      (await integrity.listIntegrityCaseActionIds(manager, caseId)).map((row) => row.workItemId)
    ).toContain(action.workItemId);

    record = (await integrity.listIntegrityCases(manager)).find((row) => row.id === caseId)!;
    await integrity.transitionIntegrityCase(manager, caseId, record.aggregateVersion, {
      toStatus: 'CLOSED',
      summary: 'Mitigation actions established.',
      outcomeSummary: 'Conflict managed through recusal and independent decision authority.'
    });

    record = (await integrity.listIntegrityCases(manager)).find((row) => row.id === caseId)!;
    expect(record.status).toBe('CLOSED');

    const decision = await db.queryOne<any>(
      'SELECT decision_type AS decisionType,subject_type AS subjectType FROM work_decisions WHERE id=?',
      [decisionId]
    );
    const work = await db.queryOne<any>(
      'SELECT work_type AS workType,subject_type AS subjectType FROM work_items WHERE id=?',
      [action.workItemId]
    );
    expect(decision?.decisionType).toBe('INTEGRITY_CASE_OUTCOME');
    expect(decision?.subjectType).toBe('INTEGRITY_CASE');
    expect(work?.workType).toBe('INTEGRITY_CASE_ACTION');
    expect(work?.subjectType).toBe('INTEGRITY_CASE');
  });
});
