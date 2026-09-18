import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import {
  configureLifecycleVersion,
  createLifecycleDefinition,
  createLifecycleVersion,
  getLifecycleConfiguration,
  listLifecycleDefinitions,
  listLifecycleVersions,
  publishLifecycleVersion,
  type LifecycleConfigurationInput
} from '$lib/server/lifecycle-configuration';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function expectedVersion(data: FormData) {
  const value = Number(text(data, 'definitionVersion'));
  if (!Number.isInteger(value) || value < 1) {
    throw new Error('A valid Lifecycle Definition version is required.');
  }
  return value;
}

function problem(error: unknown) {
  return fail(400, {
    message:
      error instanceof Error ? error.message : 'The lifecycle command could not be completed.'
  });
}

function route(tenant: string, definitionId?: string, versionId?: string) {
  const params = new URLSearchParams();
  if (definitionId) params.set('definition', definitionId);
  if (versionId) params.set('version', versionId);
  const query = params.toString();
  return `/${tenant}/app/admin/reference-data/lifecycles${query ? '?' + query : ''}`;
}

function rows(raw: string) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function parseConfiguration(data: FormData): LifecycleConfigurationInput {
  const states = rows(text(data, 'states')).map((line, index) => {
    const separator = line.includes('\t') ? '\t' : '|';
    const [stateKey, label, terminal = '', sortOrder = ''] = line
      .split(separator)
      .map((part) => part.trim());
    if (!stateKey || !label) {
      throw new Error(`Lifecycle state row ${index + 1} requires state key and label.`);
    }
    const parsedSortOrder = sortOrder ? Number(sortOrder) : index * 10;
    if (!Number.isInteger(parsedSortOrder)) {
      throw new Error(`Lifecycle state row ${index + 1} has an invalid sort order.`);
    }
    return {
      stateKey,
      label,
      terminal: ['TRUE', 'YES', 'Y', '1', 'TERMINAL'].includes(terminal.toUpperCase()),
      sortOrder: parsedSortOrder
    };
  });

  const transitions = rows(text(data, 'transitions')).map((line, index) => {
    const separator = line.includes('\t') ? '\t' : '|';
    const [transitionKey, fromStateKey, toStateKey] = line
      .split(separator)
      .map((part) => part.trim());
    if (!transitionKey || !fromStateKey || !toStateKey) {
      throw new Error(
        `Lifecycle transition row ${index + 1} requires transition key, from-state and to-state.`
      );
    }
    return { transitionKey, fromStateKey, toStateKey };
  });

  return {
    initialStateKey: text(data, 'initialStateKey'),
    states,
    transitions
  };
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const definitions = await listLifecycleDefinitions(context);
  const selectedDefinition =
    definitions.find((entry) => entry.id === url.searchParams.get('definition')) ??
    definitions[0] ??
    null;
  const versions = selectedDefinition
    ? await listLifecycleVersions(context, selectedDefinition.id)
    : [];
  const selectedVersion =
    versions.find((entry) => entry.id === url.searchParams.get('version')) ?? versions[0] ?? null;
  const configuration =
    selectedDefinition && selectedVersion
      ? await getLifecycleConfiguration(context, selectedDefinition.id, selectedVersion.id)
      : null;

  return {
    tenantSlug: params.tenant,
    definitions,
    selectedDefinition,
    versions,
    selectedVersion,
    configuration,
    capabilities: {
      canManage: hasPermission(context, 'reference.lifecycle.manage'),
      canPublish: hasPermission(context, 'reference.lifecycle.publish')
    }
  };
};

export const actions: Actions = {
  createDefinition: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createLifecycleDefinition(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          lifecycleKey: text(data, 'lifecycleKey'),
          name: text(data, 'name'),
          appliesToType: text(data, 'appliesToType'),
          purpose: text(data, 'purpose') || undefined
        }
      );
      redirect(303, route(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  createVersion: async ({ request, params, locals }) => {
    const data = await request.formData();
    const definitionId = text(data, 'definitionId');
    try {
      const id = await createLifecycleVersion(
        await resolveRequestCommandContext(params.tenant, locals),
        definitionId,
        expectedVersion(data),
        text(data, 'description') || undefined
      );
      redirect(303, route(params.tenant, definitionId, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  configure: async ({ request, params, locals }) => {
    const data = await request.formData();
    const definitionId = text(data, 'definitionId');
    const versionId = text(data, 'versionId');
    try {
      await configureLifecycleVersion(
        await resolveRequestCommandContext(params.tenant, locals),
        definitionId,
        versionId,
        expectedVersion(data),
        parseConfiguration(data)
      );
      redirect(303, route(params.tenant, definitionId, versionId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  publish: async ({ request, params, locals }) => {
    const data = await request.formData();
    const definitionId = text(data, 'definitionId');
    const versionId = text(data, 'versionId');
    try {
      await publishLifecycleVersion(
        await resolveRequestCommandContext(params.tenant, locals),
        definitionId,
        versionId,
        expectedVersion(data)
      );
      redirect(303, route(params.tenant, definitionId, versionId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
