import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { recordWorkDecision } from '$lib/server/work-decision';
import {
  activateAuthorityFramework,
  approveAuthorityFramework,
  createAuthorityFramework,
  listAuthorityFrameworks,
  listAuthorityFrameworkRules,
  listAuthorityFrameworkVersions,
  submitAuthorityFramework,
  type AuthorityFrameworkRuleInput
} from '$lib/server/authority-framework';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
function integer(data: FormData, name: string) {
  const value = Number(text(data, name));
  if (!Number.isInteger(value) || value < 1)
    throw new Error(name + ' must be a positive whole number.');
  return value;
}
function rules(data: FormData) {
  const raw = text(data, 'rules');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Rules must be valid JSON.');
  }
  if (!Array.isArray(parsed)) throw new Error('Rules must be a JSON array.');
  return parsed as AuthorityFrameworkRuleInput[];
}
function target(tenant: string, id?: string) {
  return `/${tenant}/app/functions/f02/authority-framework${id ? '?framework=' + encodeURIComponent(id) : ''}`;
}
function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'Authority Framework command failed.'
  });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const frameworks = await listAuthorityFrameworks(context);
  const selected =
    frameworks.find((row) => row.id === url.searchParams.get('framework')) ?? frameworks[0] ?? null;
  const versions = selected ? await listAuthorityFrameworkVersions(context, selected.id) : [];
  const ruleset = selected
    ? await listAuthorityFrameworkRules(context, selected.id, selected.currentVersionNo)
    : [];
  return {
    tenantSlug: params.tenant,
    frameworks,
    selected,
    versions,
    rules: ruleset,
    capabilities: {
      canManage: hasPermission(context, 'governance.framework.manage'),
      canApprove: hasPermission(context, 'governance.framework.approve')
    }
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createAuthorityFramework(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          frameworkRef: text(data, 'frameworkRef'),
          name: text(data, 'name'),
          scopeType: text(data, 'scopeType') || undefined,
          scopeId: text(data, 'scopeId') || undefined,
          purpose: text(data, 'purpose'),
          rules: rules(data)
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  submit: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'frameworkId');
    try {
      await submitAuthorityFramework(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        integer(data, 'aggregateVersion')
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  approve: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'frameworkId');
    try {
      const context = await resolveRequestCommandContext(params.tenant, locals);
      const current = (await listAuthorityFrameworks(context)).find((row) => row.id === id);
      if (!current) throw new Error('Authority Framework not found.');
      const decisionId = await recordWorkDecision(context, {
        decisionType: 'AUTHORITY_FRAMEWORK_REVIEW',
        subjectType: 'AUTHORITY_FRAMEWORK',
        subjectId: id,
        subjectVersion: String(current.currentVersionNo),
        outcome: 'APPROVED',
        reason: text(data, 'reason') || 'Approved through governed review.'
      });
      await approveAuthorityFramework(context, id, integer(data, 'aggregateVersion'), decisionId);
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  activate: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'frameworkId');
    try {
      await activateAuthorityFramework(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        integer(data, 'aggregateVersion')
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
