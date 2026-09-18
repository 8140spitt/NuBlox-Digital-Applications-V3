import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import {
  createApprovalAuthorityRule,
  createApprovalAuthorityRuleVersion,
  createDelegatedAuthorityRule,
  createDelegatedAuthorityRuleVersion,
  listApprovalAuthorityRules,
  listApprovalAuthorityRuleVersions,
  listDelegatedAuthorityRules,
  listDelegatedAuthorityRuleVersions,
  publishApprovalAuthorityRuleVersion,
  publishDelegatedAuthorityRuleVersion
} from '$lib/server/authority-configuration';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function numberValue(data: FormData, name: string) {
  const value = text(data, name);
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(name + ' must be a number.');
  return parsed;
}

function expectedVersion(data: FormData) {
  const value = Number(text(data, 'ruleVersion'));
  if (!Number.isInteger(value) || value < 1) throw new Error('A valid rule version is required.');
  return value;
}

function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The authority-policy command could not be completed.'
  });
}

function route(tenant: string, kind: 'approval' | 'delegated', ruleId?: string) {
  const params = new URLSearchParams({ kind });
  if (ruleId) params.set('rule', ruleId);
  return `/${tenant}/app/admin/reference-data/authority?${params.toString()}`;
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [approvalRules, delegatedRules] = await Promise.all([
    listApprovalAuthorityRules(context),
    listDelegatedAuthorityRules(context)
  ]);
  const kind = url.searchParams.get('kind') === 'delegated' ? 'delegated' : 'approval';
  const selectedRuleId = url.searchParams.get('rule');
  const selectedApprovalRule =
    kind === 'approval'
      ? approvalRules.find((rule) => rule.id === selectedRuleId) ?? approvalRules[0] ?? null
      : null;
  const selectedDelegatedRule =
    kind === 'delegated'
      ? delegatedRules.find((rule) => rule.id === selectedRuleId) ?? delegatedRules[0] ?? null
      : null;
  const versions = selectedApprovalRule
    ? await listApprovalAuthorityRuleVersions(context, selectedApprovalRule.id)
    : selectedDelegatedRule
      ? await listDelegatedAuthorityRuleVersions(context, selectedDelegatedRule.id)
      : [];

  return {
    tenantSlug: params.tenant,
    kind,
    approvalRules,
    delegatedRules,
    selectedApprovalRule,
    selectedDelegatedRule,
    versions,
    capabilities: {
      canManage: hasPermission(context, 'reference.authority.manage'),
      canPublish: hasPermission(context, 'reference.authority.publish')
    }
  };
};

export const actions: Actions = {
  createApproval: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const created = await createApprovalAuthorityRule(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          ruleKey: text(data, 'ruleKey'),
          actionKey: text(data, 'actionKey'),
          objectType: text(data, 'objectType'),
          configuration: {
            scopeType: text(data, 'scopeType') || undefined,
            scopeId: text(data, 'scopeId') || undefined,
            currencyCode: text(data, 'currencyCode') || undefined,
            minimumValue: numberValue(data, 'minimumValue'),
            maximumValue: numberValue(data, 'maximumValue'),
            requiredAuthorityType: text(data, 'requiredAuthorityType'),
            effectiveFrom: text(data, 'effectiveFrom') || undefined,
            effectiveTo: text(data, 'effectiveTo') || undefined
          }
        }
      );
      redirect(303, route(params.tenant, 'approval', created.ruleId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  reviseApproval: async ({ request, params, locals }) => {
    const data = await request.formData();
    const ruleId = text(data, 'ruleId');
    try {
      await createApprovalAuthorityRuleVersion(
        await resolveRequestCommandContext(params.tenant, locals),
        ruleId,
        expectedVersion(data),
        {
          scopeType: text(data, 'scopeType') || undefined,
          scopeId: text(data, 'scopeId') || undefined,
          currencyCode: text(data, 'currencyCode') || undefined,
          minimumValue: numberValue(data, 'minimumValue'),
          maximumValue: numberValue(data, 'maximumValue'),
          requiredAuthorityType: text(data, 'requiredAuthorityType'),
          effectiveFrom: text(data, 'effectiveFrom') || undefined,
          effectiveTo: text(data, 'effectiveTo') || undefined
        }
      );
      redirect(303, route(params.tenant, 'approval', ruleId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  publishApproval: async ({ request, params, locals }) => {
    const data = await request.formData();
    const ruleId = text(data, 'ruleId');
    try {
      await publishApprovalAuthorityRuleVersion(
        await resolveRequestCommandContext(params.tenant, locals),
        ruleId,
        text(data, 'versionId'),
        expectedVersion(data)
      );
      redirect(303, route(params.tenant, 'approval', ruleId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  createDelegated: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const created = await createDelegatedAuthorityRule(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          ruleKey: text(data, 'ruleKey'),
          authorityType: text(data, 'authorityType'),
          configuration: {
            allowedScopeType: text(data, 'allowedScopeType'),
            allowedScopeId: text(data, 'allowedScopeId') || undefined,
            currencyCode: text(data, 'currencyCode') || undefined,
            maximumValue: numberValue(data, 'maximumValue'),
            maximumDurationDays: numberValue(data, 'maximumDurationDays'),
            allowSubdelegation: data.get('allowSubdelegation') === 'on',
            effectiveFrom: text(data, 'effectiveFrom') || undefined,
            effectiveTo: text(data, 'effectiveTo') || undefined
          }
        }
      );
      redirect(303, route(params.tenant, 'delegated', created.ruleId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  reviseDelegated: async ({ request, params, locals }) => {
    const data = await request.formData();
    const ruleId = text(data, 'ruleId');
    try {
      await createDelegatedAuthorityRuleVersion(
        await resolveRequestCommandContext(params.tenant, locals),
        ruleId,
        expectedVersion(data),
        {
          allowedScopeType: text(data, 'allowedScopeType'),
          allowedScopeId: text(data, 'allowedScopeId') || undefined,
          currencyCode: text(data, 'currencyCode') || undefined,
          maximumValue: numberValue(data, 'maximumValue'),
          maximumDurationDays: numberValue(data, 'maximumDurationDays'),
          allowSubdelegation: data.get('allowSubdelegation') === 'on',
          effectiveFrom: text(data, 'effectiveFrom') || undefined,
          effectiveTo: text(data, 'effectiveTo') || undefined
        }
      );
      redirect(303, route(params.tenant, 'delegated', ruleId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  publishDelegated: async ({ request, params, locals }) => {
    const data = await request.formData();
    const ruleId = text(data, 'ruleId');
    try {
      await publishDelegatedAuthorityRuleVersion(
        await resolveRequestCommandContext(params.tenant, locals),
        ruleId,
        text(data, 'versionId'),
        expectedVersion(data)
      );
      redirect(303, route(params.tenant, 'delegated', ruleId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
