import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let authority: typeof import('./authority-configuration');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  authority = await import('./authority-configuration');
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
});
