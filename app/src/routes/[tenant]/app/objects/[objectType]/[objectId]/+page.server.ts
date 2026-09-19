import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  objectHref,
  runtimeObjectDefinition,
  type RuntimeObjectSection
} from '$lib/data/runtime-object-registry';
import { listEvidenceItems } from '$lib/server/governed-evidence';
import {
  isFavourite,
  objectNavigationItemKey,
  recordRecentItem,
  toggleFavourite
} from '$lib/server/interaction-preferences';
import { requestPermissionAccess } from '$lib/server/permission-access-request';
import { listPlatformAudit } from '$lib/server/platform-evidence';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { resolveRuntimeObject } from '$lib/server/runtime-object-resolver';
import { listMyWork } from '$lib/server/shared-work';
import { listWorkDecisions } from '$lib/server/work-decision';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function problem(value: unknown) {
  return fail(400, {
    message:
      value instanceof Error ? value.message : 'The requested object action could not be completed.'
  });
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const definition = runtimeObjectDefinition(params.objectType);
  if (!definition) error(404, 'That business object type is not registered in NuBlox.');

  const requestedPath = url.pathname + url.search;
  if (!hasPermission(context, definition.readPermission)) {
    return {
      state: 'denied' as const,
      tenantSlug: params.tenant,
      definition,
      requestedPath,
      accessRequested: url.searchParams.get('access') === 'requested'
    };
  }

  let object;
  try {
    object = await resolveRuntimeObject(context, definition.type, params.objectId);
  } catch (value) {
    if (value instanceof Error && /not found\.?$/i.test(value.message)) {
      error(404, definition.singular + ' not found.');
    }
    throw value;
  }

  const requestedSection = url.searchParams.get('section') as RuntimeObjectSection | null;
  const section =
    requestedSection && definition.sections.includes(requestedSection)
      ? requestedSection
      : ('overview' as RuntimeObjectSection);

  const subject = { type: definition.subjectType, id: object.objectId };
  const navigationItemKey = objectNavigationItemKey(definition.subjectType, object.objectId);
  const canonicalRoute = objectHref(params.tenant, definition.type, object.objectId);
  await recordRecentItem(context, {
    itemKey: navigationItemKey,
    itemType: 'OBJECT',
    objectType: definition.subjectType,
    objectId: object.objectId,
    title: object.reference + ' · ' + object.title,
    subtitle:
      definition.singular + (object.status ? ' · ' + object.status.replaceAll('_', ' ') : ''),
    routePath: canonicalRoute
  });

  const canReadWork = hasPermission(context, 'work.item.read');
  const canReadDecisions = hasPermission(context, 'work.decision.read');
  const canReadEvidence = hasPermission(context, 'evidence.item.read');
  const canReadAudit = hasPermission(context, 'platform.audit.read');

  const [work, decisions, evidence, historySets, favourite] = await Promise.all([
    canReadWork
      ? listMyWork(context).then((items) =>
          items.filter(
            (item) =>
              item.subjectType === definition.subjectType && item.subjectId === object.objectId
          )
        )
      : Promise.resolve([]),
    canReadDecisions ? listWorkDecisions(context, subject) : Promise.resolve([]),
    canReadEvidence ? listEvidenceItems(context, subject) : Promise.resolve([]),
    canReadAudit
      ? Promise.all(
          object.auditObjectTypes.map((auditObjectType) =>
            listPlatformAudit(context, auditObjectType, object.objectId)
          )
        )
      : Promise.resolve([]),
    isFavourite(context, navigationItemKey)
  ]);
  const history = historySets
    .flat()
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));

  return {
    state: 'ready' as const,
    tenantSlug: params.tenant,
    definition,
    object,
    section,
    from: url.searchParams.get('from'),
    work,
    decisions,
    evidence,
    history,
    favourite,
    capabilities: {
      canReadWork,
      canReadDecisions,
      canReadEvidence,
      canReadAudit
    }
  };
};

export const actions: Actions = {
  toggleFavourite: async ({ params, locals }) => {
    const definition = runtimeObjectDefinition(params.objectType);
    if (!definition) return fail(404, { message: 'That business object type is not registered.' });
    const context = await resolveRequestCommandContext(params.tenant, locals);
    if (!hasPermission(context, definition.readPermission)) {
      return fail(403, { message: 'Your role does not permit access to this object.' });
    }

    try {
      const object = await resolveRuntimeObject(context, definition.type, params.objectId);
      const favourite = await toggleFavourite(context, {
        itemKey: objectNavigationItemKey(definition.subjectType, object.objectId),
        itemType: 'OBJECT',
        objectType: definition.subjectType,
        objectId: object.objectId,
        title: object.reference + ' · ' + object.title,
        subtitle:
          definition.singular + (object.status ? ' · ' + object.status.replaceAll('_', ' ') : ''),
        routePath: objectHref(params.tenant, definition.type, object.objectId)
      });
      return { favourite };
    } catch (value) {
      return problem(value);
    }
  },

  requestAccess: async ({ request, params, locals }) => {
    const definition = runtimeObjectDefinition(params.objectType);
    if (!definition) return fail(404, { message: 'That business object type is not registered.' });
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    try {
      const result = await requestPermissionAccess(context, {
        permissionKey: definition.readPermission,
        requestedPath:
          text(data, 'requestedPath') || objectHref(params.tenant, definition.type, params.objectId)
      });
      if (result.alreadyAuthorized) {
        redirect(303, objectHref(params.tenant, definition.type, params.objectId));
      }
    } catch (value) {
      if (value && typeof value === 'object' && 'status' in value) throw value;
      return problem(value);
    }
    const target = new URL(
      'https://nublox.invalid' + objectHref(params.tenant, definition.type, params.objectId)
    );
    target.searchParams.set('access', 'requested');
    redirect(303, target.pathname + target.search);
  }
};
