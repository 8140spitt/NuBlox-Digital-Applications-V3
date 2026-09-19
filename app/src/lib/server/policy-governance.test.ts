import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let policy: typeof import('./policy-governance');
let decision: typeof import('./work-decision');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  policy = await import('./policy-governance');
  decision = await import('./work-decision');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

describe('F02.06 Policy Governance profile runtime', () => {
  it('shares Information Container identity while preserving governed Policy metadata by revision', async () => {
    const tenant = 'policy-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const id = await policy.createPolicy(context, {
      policyRef: 'POL-GOV-001',
      policyType: 'CORPORATE',
      title: 'Corporate Governance Policy',
      applicabilitySummary: 'Applies to all tenant members and governed operating entities.',
      effectiveFrom: '2026-10-01',
      reviewDueAt: '2027-10-01',
      attestationRequired: true,
      revisionCode: 'P01'
    });

    let current = (await policy.listPolicies(context)).find((item) => item.id === id)!;
    expect(current.policyRef).toBe('POL-GOV-001');
    expect(current.currentRevisionNo).toBe(1);
    expect(current.currentLifecycleStatus).toBe('WORKING');
    expect(current.ownerPartyId).toBe(context.actorPartyId);
    expect(current.attestationRequired).toBe(1);

    const container = await db.queryOne<any>(
      'SELECT id, container_type AS containerType FROM information_containers WHERE id = ? AND tenant_id = ?',
      [id, context.tenantId]
    );
    const profile = await db.queryOne<any>(
      'SELECT information_container_id AS informationContainerId FROM policy_profiles WHERE information_container_id = ? AND tenant_id = ?',
      [id, context.tenantId]
    );
    expect(container?.containerType).toBe('POLICY');
    expect(profile?.informationContainerId).toBe(id);

    await policy.addPolicyRepresentation(context, id, current.aggregateVersion, {
      representationType: 'PDF',
      contentReference: 's3://controlled/pol-gov-001-p01.pdf',
      contentMediaType: 'application/pdf',
      sourceFilename: 'POL-GOV-001-P01.pdf',
      hashAlgorithm: 'SHA256',
      contentHash: 'c'.repeat(64)
    });
    current = (await policy.listPolicies(context)).find((item) => item.id === id)!;
    await policy.submitPolicyRevision(context, id, current.aggregateVersion);
    current = (await policy.listPolicies(context)).find((item) => item.id === id)!;

    const decisionId = await decision.recordWorkDecision(context, {
      decisionType: 'INFORMATION_REVISION_REVIEW',
      subjectType: 'INFORMATION_CONTAINER',
      subjectId: id,
      subjectVersion: '1',
      outcome: 'APPROVED',
      reason: 'Policy approved by governed review.'
    });
    await policy.approvePolicyRevision(context, id, current.aggregateVersion, decisionId);
    current = (await policy.listPolicies(context)).find((item) => item.id === id)!;
    await policy.publishPolicyRevision(context, id, current.aggregateVersion);

    current = (await policy.listPolicies(context)).find((item) => item.id === id)!;
    expect(current.status).toBe('PUBLISHED');

    expect(
      await policy.createSuccessorPolicyRevision(context, id, current.aggregateVersion, {
        revisionCode: 'P02',
        title: 'Corporate Governance Policy — revised',
        applicabilitySummary: 'Applies to all tenant members, subsidiaries and controlled joint ventures.',
        effectiveFrom: '2027-01-01',
        reviewDueAt: '2028-01-01'
      })
    ).toBe(2);

    const revisions = await policy.listPolicyRevisions(context, id);
    expect(revisions.map((item) => [item.revisionNo, item.lifecycleStatus])).toEqual([
      [2, 'WORKING'],
      [1, 'ISSUED']
    ]);
    expect(revisions[1].applicabilitySummary).toContain('tenant members');
    expect(revisions[0].applicabilitySummary).toContain('joint ventures');
    expect(new Set(revisions.map((item) => item.containerId))).toEqual(new Set([id]));
  });

  it('does not publish a Policy revision without governed effectivity', async () => {
    const tenant = 'policy-effectivity-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const id = await policy.createPolicy(context, {
      policyRef: 'POL-ETH-001',
      policyType: 'ETHICS',
      title: 'Ethics Policy',
      applicabilitySummary: 'Applies to all workers.',
      revisionCode: 'P01'
    });
    let current = (await policy.listPolicies(context)).find((item) => item.id === id)!;
    await policy.addPolicyRepresentation(context, id, current.aggregateVersion, {
      representationType: 'PDF',
      contentReference: 's3://controlled/pol-eth-001-p01.pdf',
      hashAlgorithm: 'SHA256',
      contentHash: 'd'.repeat(64)
    });
    current = (await policy.listPolicies(context)).find((item) => item.id === id)!;
    await policy.submitPolicyRevision(context, id, current.aggregateVersion);
    current = (await policy.listPolicies(context)).find((item) => item.id === id)!;
    const decisionId = await decision.recordWorkDecision(context, {
      decisionType: 'INFORMATION_REVISION_REVIEW',
      subjectType: 'INFORMATION_CONTAINER',
      subjectId: id,
      subjectVersion: '1',
      outcome: 'APPROVED',
      reason: 'Approved.'
    });
    await policy.approvePolicyRevision(context, id, current.aggregateVersion, decisionId);
    current = (await policy.listPolicies(context)).find((item) => item.id === id)!;
    await expect(
      policy.publishPolicyRevision(context, id, current.aggregateVersion)
    ).rejects.toThrow('effective-from');
  });
});
