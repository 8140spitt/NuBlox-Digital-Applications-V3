import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let authority: typeof import('./authority-configuration');
let delegatedAuthorityService: typeof import('./delegated-authority');
let decisionService: typeof import('./work-decision');
let personService: typeof import('./foundation-person');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  authority = await import('./authority-configuration');
  delegatedAuthorityService = await import('./delegated-authority');
  decisionService = await import('./work-decision');
  personService = await import('./foundation-person');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

describe('governed authority configuration', () => {
  it('publishes and resolves approval authority policy without creating runtime authority', async () => {
    const tenant = 'authority-config-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const created = await authority.createApprovalAuthorityRule(context, {
      ruleKey: 'COMMERCIAL.COMMITMENT.TIER1',
      actionKey: 'COMMERCIAL_APPROVAL',
      objectType: 'COMMERCIAL_COMMITMENT',
      configuration: {
        scopeType: 'TENANT',
        scopeId: context.tenantId,
        currencyCode: 'GBP',
        minimumValue: 0,
        maximumValue: 250000,
        requiredAuthorityType: 'COMMERCIAL_COMMITMENT'
      }
    });

    let rule = (await authority.listApprovalAuthorityRules(context)).find(
      (entry) => entry.id === created.ruleId
    )!;
    expect(rule.version).toBe(1);

    expect(
      await authority.resolveApprovalAuthorityRequirement(context, {
        actionKey: 'COMMERCIAL_APPROVAL',
        objectType: 'COMMERCIAL_COMMITMENT',
        scopeType: 'TENANT',
        scopeId: context.tenantId,
        currencyCode: 'GBP',
        value: 100000
      })
    ).toBeNull();

    await authority.publishApprovalAuthorityRuleVersion(
      context,
      created.ruleId,
      created.versionId,
      rule.version
    );

    rule = (await authority.listApprovalAuthorityRules(context)).find(
      (entry) => entry.id === created.ruleId
    )!;
    expect(rule.version).toBe(2);

    const requirement = await authority.resolveApprovalAuthorityRequirement(context, {
      actionKey: 'COMMERCIAL_APPROVAL',
      objectType: 'COMMERCIAL_COMMITMENT',
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      currencyCode: 'GBP',
      value: 100000
    });
    expect(requirement?.requiredAuthorityType).toBe('COMMERCIAL_COMMITMENT');

    expect(
      await authority.resolveApprovalAuthorityRequirement(context, {
        actionKey: 'COMMERCIAL_APPROVAL',
        objectType: 'COMMERCIAL_COMMITMENT',
        scopeType: 'TENANT',
        scopeId: context.tenantId,
        currencyCode: 'GBP',
        value: 300000
      })
    ).toBeNull();

    const grants = await db.queryRows<any>(
      'SELECT id FROM delegated_authorities WHERE tenant_id = ?',
      [context.tenantId]
    );
    expect(grants).toHaveLength(0);
  });

  it('publishes delegated-authority policy and evaluates scope, limit, duration and subdelegation', async () => {
    const tenant = 'delegation-config-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const created = await authority.createDelegatedAuthorityRule(context, {
      ruleKey: 'COMMERCIAL.DELEGATION',
      authorityType: 'COMMERCIAL_COMMITMENT',
      configuration: {
        allowedScopeType: 'TENANT',
        allowedScopeId: context.tenantId,
        currencyCode: 'GBP',
        maximumValue: 500000,
        maximumDurationDays: 90,
        allowSubdelegation: false
      }
    });

    const rule = (await authority.listDelegatedAuthorityRules(context)).find(
      (entry) => entry.id === created.ruleId
    )!;
    await authority.publishDelegatedAuthorityRuleVersion(
      context,
      created.ruleId,
      created.versionId,
      rule.version
    );

    const allowed = await authority.resolveDelegatedAuthorityPolicy(context, {
      authorityType: 'COMMERCIAL_COMMITMENT',
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      currencyCode: 'GBP',
      value: 250000,
      durationDays: 30,
      allowSubdelegation: false
    });
    expect(allowed?.ruleKey).toBe('COMMERCIAL.DELEGATION');

    const overLimit = await authority.resolveDelegatedAuthorityPolicy(context, {
      authorityType: 'COMMERCIAL_COMMITMENT',
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      currencyCode: 'GBP',
      value: 750000,
      durationDays: 30
    });
    expect(overLimit).toBeNull();

    const subdelegated = await authority.resolveDelegatedAuthorityPolicy(context, {
      authorityType: 'COMMERCIAL_COMMITMENT',
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      currencyCode: 'GBP',
      value: 100000,
      durationDays: 30,
      allowSubdelegation: true
    });
    expect(subdelegated).toBeNull();

    const events = await db.queryRows<any>(
      "SELECT event_type AS eventType, aggregate_version AS aggregateVersion FROM business_events WHERE tenant_id = ? AND aggregate_id = 'AGG-29-AUTHORITY-CONFIG' AND aggregate_object_id = ? ORDER BY aggregate_version",
      [context.tenantId, created.ruleId]
    );
    expect(events.map((event) => event.eventType)).toEqual([
      'DELEGATED_AUTHORITY_RULE_CREATED',
      'DELEGATED_AUTHORITY_RULE_PUBLISHED'
    ]);
    expect(events.map((event) => Number(event.aggregateVersion))).toEqual([1, 2]);
  });

  it('enforces published authority policy at runtime without turning policy into a grant', async () => {
    const tenant = 'authority-policy-runtime-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const approval = await authority.createApprovalAuthorityRule(context, {
      ruleKey: 'COMMERCIAL.APPROVAL.RUNTIME',
      actionKey: 'COMMERCIAL_APPROVAL',
      objectType: 'COMMERCIAL_COMMITMENT',
      configuration: {
        scopeType: 'TENANT',
        scopeId: context.tenantId,
        currencyCode: 'GBP',
        maximumValue: 250000,
        requiredAuthorityType: 'COMMERCIAL_COMMITMENT'
      }
    });
    await authority.publishApprovalAuthorityRuleVersion(
      context,
      approval.ruleId,
      approval.versionId,
      1
    );

    await expect(
      decisionService.recordWorkDecision(context, {
        decisionType: 'COMMERCIAL_APPROVAL',
        subjectType: 'COMMERCIAL_COMMITMENT',
        subjectId: 'commitment-' + randomUUID(),
        outcome: 'APPROVED',
        reason: 'Missing authority context must be rejected by published policy.'
      })
    ).rejects.toThrow('requires explicit authority context');

    await expect(
      decisionService.recordWorkDecision(context, {
        decisionType: 'COMMERCIAL_APPROVAL',
        subjectType: 'COMMERCIAL_COMMITMENT',
        subjectId: 'commitment-' + randomUUID(),
        outcome: 'APPROVED',
        reason: 'Over-threshold authority must be rejected by published policy.',
        authority: {
          type: 'COMMERCIAL_COMMITMENT',
          scopeType: 'TENANT',
          scopeId: context.tenantId,
          currencyCode: 'GBP',
          value: 300000
        }
      })
    ).rejects.toThrow('does not permit');

    const delegation = await authority.createDelegatedAuthorityRule(context, {
      ruleKey: 'COMMERCIAL.DELEGATION.RUNTIME',
      authorityType: 'COMMERCIAL_COMMITMENT',
      configuration: {
        allowedScopeType: 'TENANT',
        allowedScopeId: context.tenantId,
        currencyCode: 'GBP',
        maximumValue: 250000,
        maximumDurationDays: 30,
        allowSubdelegation: false
      }
    });
    await authority.publishDelegatedAuthorityRuleVersion(
      context,
      delegation.ruleId,
      delegation.versionId,
      1
    );

    const delegatePartyId = await personService.createPerson(context, {
      givenName: 'Policy',
      familyName: 'Delegate'
    });
    const tooLargeGrantId = await delegatedAuthorityService.createDelegatedAuthority(context, {
      delegatePartyId,
      authorityType: 'COMMERCIAL_COMMITMENT',
      basis: 'Configured policy test',
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      currencyCode: 'GBP',
      valueLimit: 500000,
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 10 * 86_400_000).toISOString()
    });
    const tooLarge = (await delegatedAuthorityService.listDelegatedAuthorities(context)).find(
      (entry) => entry.id === tooLargeGrantId
    )!;
    await expect(
      delegatedAuthorityService.approveDelegatedAuthority(context, tooLarge.id, tooLarge.version)
    ).rejects.toThrow('does not permit');

    const permittedGrantId = await delegatedAuthorityService.createDelegatedAuthority(context, {
      delegatePartyId,
      authorityType: 'COMMERCIAL_COMMITMENT',
      basis: 'Configured policy test',
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      currencyCode: 'GBP',
      valueLimit: 200000,
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 10 * 86_400_000).toISOString()
    });
    const permitted = (await delegatedAuthorityService.listDelegatedAuthorities(context)).find(
      (entry) => entry.id === permittedGrantId
    )!;
    await delegatedAuthorityService.approveDelegatedAuthority(
      context,
      permitted.id,
      permitted.version
    );
    const approvedGrant = (await delegatedAuthorityService.listDelegatedAuthorities(context)).find(
      (entry) => entry.id === permittedGrantId
    )!;
    expect(approvedGrant.status).toBe('APPROVED');
    expect(approvedGrant.policyRuleId).toBe(delegation.ruleId);
    expect(approvedGrant.policyVersionId).toBe(delegation.versionId);

    const grantorPartyId = await personService.createPerson(context, {
      givenName: 'Policy',
      familyName: 'Grantor'
    });
    const actorGrantId = randomUUID();
    const timestamp = new Date().toISOString();
    await db.executeMutation(
      "INSERT INTO delegated_authorities (id, tenant_id, grantor_party_id, delegate_party_id, authority_type, basis, scope_type, scope_id, currency_code, value_limit, allow_subdelegation, status, version, valid_from, valid_to, approved_at, revoked_at, revocation_reason, policy_rule_id, policy_version_id, created_at, updated_at) VALUES (?, ?, ?, ?, 'COMMERCIAL_COMMITMENT', 'Independent board delegation', 'TENANT', ?, 'GBP', 250000, 0, 'ACTIVE', 3, ?, NULL, ?, NULL, NULL, NULL, NULL, ?, ?)",
      [
        actorGrantId,
        context.tenantId,
        grantorPartyId,
        context.actorPartyId,
        context.tenantId,
        timestamp,
        timestamp,
        timestamp,
        timestamp
      ]
    );

    const decisionId = await decisionService.recordWorkDecision(context, {
      decisionType: 'COMMERCIAL_APPROVAL',
      subjectType: 'COMMERCIAL_COMMITMENT',
      subjectId: 'policy-trace-' + randomUUID(),
      subjectVersion: '1',
      outcome: 'APPROVED',
      reason: 'Protected decision records exact policy-as-applied.',
      authority: {
        type: 'COMMERCIAL_COMMITMENT',
        scopeType: 'TENANT',
        scopeId: context.tenantId,
        currencyCode: 'GBP',
        value: 100000
      }
    });
    const decision = (await decisionService.listWorkDecisions(context)).find(
      (entry) => entry.id === decisionId
    )!;
    expect(decision.approvalPolicyRuleId).toBe(approval.ruleId);
    expect(decision.approvalPolicyVersionId).toBe(approval.versionId);
  });

  it('creates a new immutable approval policy version instead of editing published history', async () => {
    const tenant = 'authority-version-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const created = await authority.createApprovalAuthorityRule(context, {
      ruleKey: 'CAPEX.APPROVAL',
      actionKey: 'CAPEX_APPROVAL',
      objectType: 'CAPITAL_REQUEST',
      configuration: {
        currencyCode: 'GBP',
        maximumValue: 100000,
        requiredAuthorityType: 'CAPEX'
      }
    });
    await authority.publishApprovalAuthorityRuleVersion(
      context,
      created.ruleId,
      created.versionId,
      1
    );

    const secondVersionId = await authority.createApprovalAuthorityRuleVersion(
      context,
      created.ruleId,
      2,
      {
        currencyCode: 'GBP',
        maximumValue: 250000,
        requiredAuthorityType: 'CAPEX'
      }
    );

    let rule = (await authority.listApprovalAuthorityRules(context)).find(
      (entry) => entry.id === created.ruleId
    )!;
    expect(rule.version).toBe(3);

    const versionsBeforePublish = await authority.listApprovalAuthorityRuleVersions(
      context,
      created.ruleId
    );
    expect(versionsBeforePublish.map((entry) => [entry.versionNo, entry.status])).toEqual([
      [2, 'DRAFT'],
      [1, 'PUBLISHED']
    ]);

    await authority.publishApprovalAuthorityRuleVersion(
      context,
      created.ruleId,
      secondVersionId,
      rule.version
    );

    rule = (await authority.listApprovalAuthorityRules(context)).find(
      (entry) => entry.id === created.ruleId
    )!;
    expect(rule.version).toBe(4);

    const requirement = await authority.resolveApprovalAuthorityRequirement(context, {
      actionKey: 'CAPEX_APPROVAL',
      objectType: 'CAPITAL_REQUEST',
      currencyCode: 'GBP',
      value: 200000
    });
    expect(requirement?.versionNo).toBe(2);
  });
});
