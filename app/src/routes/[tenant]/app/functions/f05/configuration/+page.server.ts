import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { listUnitsOfMeasure } from '$lib/server/reference-data';
import {
  addConfigurationCharacteristic,
  addConfigurationRule,
  createProductConfiguration,
  linkConfigurationRequirement,
  listItems,
  listMarketInsights,
  listProductConfigurationCharacteristics,
  listProductConfigurationRequirements,
  listProductConfigurationRules,
  listProductConfigurations,
  listProductConfigurationTrials,
  listProductConfigurationVersions,
  recordConfigurationTrial,
  releaseProductConfiguration,
  reviseProductConfiguration
} from '$lib/server/product-innovation';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
function version(data: FormData) {
  const value = Number(text(data, 'aggregateVersion'));
  if (!Number.isInteger(value) || value < 1) throw new Error('A valid aggregate version is required.');
  return value;
}
function json(data: FormData, name: string) {
  const raw = text(data, name);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(name + ' must contain valid JSON.');
  }
}
function target(tenant: string, modelId?: string, mode = 'design') {
  const q = new URLSearchParams({ mode });
  if (modelId) q.set('model', modelId);
  return `/${tenant}/app/functions/f05/configuration?${q.toString()}`;
}
function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The configuration command could not be completed.'
  });
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [models, items, insights, units] = await Promise.all([
    listProductConfigurations(context),
    listItems(context),
    listMarketInsights(context),
    listUnitsOfMeasure(context)
  ]);
  const selected = models.find((item) => item.id === url.searchParams.get('model')) ?? models[0] ?? null;
  const versions = selected ? await listProductConfigurationVersions(context, selected.id) : [];
  const current = versions.find((item) => item.versionNo === selected?.currentVersionNo) ?? null;
  const [characteristics, rules, requirements, trials] = current
    ? await Promise.all([
        listProductConfigurationCharacteristics(context, current.id),
        listProductConfigurationRules(context, current.id),
        listProductConfigurationRequirements(context, current.id),
        listProductConfigurationTrials(context, current.id)
      ])
    : [[], [], [], []];
  return {
    tenantSlug: params.tenant,
    mode: url.searchParams.get('mode') === 'development' ? 'development' : 'design',
    models,
    items,
    insights,
    units,
    selected,
    versions,
    current,
    characteristics,
    rules,
    requirements,
    trials,
    canManage: hasPermission(context, 'product.configuration.manage')
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    const mode = text(data, 'mode') || 'design';
    try {
      const id = await createProductConfiguration(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          modelRef: text(data, 'modelRef'),
          itemId: text(data, 'itemId'),
          title: text(data, 'title'),
          definitionScope: text(data, 'definitionScope'),
          designSummary: text(data, 'designSummary'),
          definition: json(data, 'definition'),
          specification: json(data, 'specification'),
          validationCriteria: text(data, 'validationCriteria'),
          prototypeBasis: json(data, 'prototypeBasis')
        }
      );
      redirect(303, target(params.tenant, id, mode));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  revise: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'modelId');
    const mode = text(data, 'mode') || 'design';
    try {
      await reviseProductConfiguration(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        version(data),
        {
          designSummary: text(data, 'designSummary'),
          definition: json(data, 'definition'),
          specification: json(data, 'specification'),
          validationCriteria: text(data, 'validationCriteria'),
          prototypeBasis: json(data, 'prototypeBasis')
        }
      );
      redirect(303, target(params.tenant, id, mode));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  characteristic: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'modelId');
    const mode = text(data, 'mode') || 'design';
    try {
      await addConfigurationCharacteristic(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        {
          characteristicKey: text(data, 'characteristicKey'),
          name: text(data, 'name'),
          valueType: text(data, 'valueType'),
          required: data.get('required') === 'on',
          allowedValues: json(data, 'allowedValues'),
          defaultValue: text(data, 'defaultValue') || undefined,
          unitOfMeasureId: text(data, 'unitOfMeasureId') || undefined
        }
      );
      redirect(303, target(params.tenant, id, mode));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  rule: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'modelId');
    const mode = text(data, 'mode') || 'design';
    try {
      await addConfigurationRule(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        {
          ruleKey: text(data, 'ruleKey'),
          ruleType: text(data, 'ruleType'),
          expression: text(data, 'expression'),
          severity: text(data, 'severity')
        }
      );
      redirect(303, target(params.tenant, id, mode));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  requirement: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'modelId');
    const mode = text(data, 'mode') || 'design';
    try {
      await linkConfigurationRequirement(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        {
          requirementType: text(data, 'requirementType'),
          subjectId: text(data, 'subjectId'),
          subjectVersion: text(data, 'subjectVersion') || undefined,
          traceabilityRole: text(data, 'traceabilityRole') || 'SATISFIES',
          validationStatus: text(data, 'validationStatus') || 'PENDING'
        }
      );
      redirect(303, target(params.tenant, id, mode));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  trial: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'modelId');
    const mode = text(data, 'mode') || 'development';
    try {
      await recordConfigurationTrial(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        {
          trialRef: text(data, 'trialRef'),
          trialType: text(data, 'trialType') || 'VALIDATION',
          hypothesis: text(data, 'hypothesis'),
          method: text(data, 'method'),
          successCriteria: text(data, 'successCriteria'),
          outcome: text(data, 'outcome'),
          resultSummary: text(data, 'resultSummary'),
          evidenceReference: text(data, 'evidenceReference') || undefined
        }
      );
      redirect(303, target(params.tenant, id, mode));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  release: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'modelId');
    const mode = text(data, 'mode') || 'development';
    try {
      await releaseProductConfiguration(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        version(data)
      );
      redirect(303, target(params.tenant, id, mode));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};