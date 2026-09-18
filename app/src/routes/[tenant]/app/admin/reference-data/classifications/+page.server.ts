import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import {
  createClassificationRelease,
  createClassificationSystem,
  importClassificationCodes,
  listClassificationCodes,
  listClassificationReleases,
  listClassificationSystems,
  publishClassificationRelease,
  type ClassificationCodeInput
} from '$lib/server/classification-runtime';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function positiveVersion(data: FormData) {
  const value = Number(text(data, 'systemVersion'));
  if (!Number.isInteger(value) || value < 1) {
    throw new Error('A valid Classification System version is required.');
  }
  return value;
}

function problem(error: unknown) {
  return fail(400, {
    message:
      error instanceof Error ? error.message : 'The classification command could not be completed.'
  });
}

function route(tenant: string, systemId?: string, releaseId?: string) {
  const params = new URLSearchParams();
  if (systemId) params.set('system', systemId);
  if (releaseId) params.set('release', releaseId);
  const query = params.toString();
  return `/${tenant}/app/admin/reference-data/classifications${query ? '?' + query : ''}`;
}

function parseCodeBatch(raw: string): ClassificationCodeInput[] {
  const rows = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  if (!rows.length) throw new Error('At least one classification code row is required.');
  if (rows.length > 5000) throw new Error('A single classification import cannot exceed 5,000 rows.');

  return rows.map((line, index) => {
    const separator = line.includes('\t') ? '\t' : '|';
    const [code, title, parentCode = '', status = 'ACTIVE', ...descriptionParts] = line
      .split(separator)
      .map((value) => value.trim());
    if (!code || !title) {
      throw new Error(`Classification import row ${index + 1} requires code and title.`);
    }
    return {
      code,
      title,
      parentCode: parentCode || undefined,
      status: status || 'ACTIVE',
      description: descriptionParts.join(separator).trim() || undefined
    };
  });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const systems = await listClassificationSystems(context);
  const requestedSystem = url.searchParams.get('system');
  const selectedSystem =
    systems.find((system) => system.id === requestedSystem) ?? systems[0] ?? null;

  const releases = selectedSystem
    ? await listClassificationReleases(context, selectedSystem.id)
    : [];
  const requestedRelease = url.searchParams.get('release');
  const selectedRelease =
    releases.find((release) => release.id === requestedRelease) ?? releases[0] ?? null;
  const search = url.searchParams.get('q')?.trim() ?? '';
  const codes =
    selectedSystem && selectedRelease
      ? await listClassificationCodes(context, selectedSystem.id, selectedRelease.id, search)
      : [];

  return {
    tenantSlug: params.tenant,
    systems,
    selectedSystem,
    releases,
    selectedRelease,
    codes,
    search,
    capabilities: {
      canManage: hasPermission(context, 'reference.classification.manage'),
      canPublish: hasPermission(context, 'reference.classification.publish')
    }
  };
};

export const actions: Actions = {
  createSystem: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createClassificationSystem(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          systemKey: text(data, 'systemKey'),
          name: text(data, 'name'),
          publisher: text(data, 'publisher'),
          systemIdentifier: text(data, 'systemIdentifier') || undefined,
          purpose: text(data, 'purpose') || undefined
        }
      );
      redirect(303, route(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  createRelease: async ({ request, params, locals }) => {
    const data = await request.formData();
    const systemId = text(data, 'systemId');
    try {
      const id = await createClassificationRelease(
        await resolveRequestCommandContext(params.tenant, locals),
        systemId,
        positiveVersion(data),
        {
          releaseKey: text(data, 'releaseKey'),
          publicationDate: text(data, 'publicationDate') || undefined,
          effectiveFrom: text(data, 'effectiveFrom') || undefined,
          effectiveTo: text(data, 'effectiveTo') || undefined,
          sourceDigestAlgorithm: text(data, 'sourceDigestAlgorithm') || 'SHA256',
          sourceDigest: text(data, 'sourceDigest')
        }
      );
      redirect(303, route(params.tenant, systemId, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  importCodes: async ({ request, params, locals }) => {
    const data = await request.formData();
    const systemId = text(data, 'systemId');
    const releaseId = text(data, 'releaseId');
    try {
      await importClassificationCodes(
        await resolveRequestCommandContext(params.tenant, locals),
        systemId,
        releaseId,
        positiveVersion(data),
        parseCodeBatch(text(data, 'codeBatch'))
      );
      redirect(303, route(params.tenant, systemId, releaseId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  publishRelease: async ({ request, params, locals }) => {
    const data = await request.formData();
    const systemId = text(data, 'systemId');
    const releaseId = text(data, 'releaseId');
    try {
      await publishClassificationRelease(
        await resolveRequestCommandContext(params.tenant, locals),
        systemId,
        releaseId,
        positiveVersion(data)
      );
      redirect(303, route(params.tenant, systemId, releaseId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
