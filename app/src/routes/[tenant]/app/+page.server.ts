import type { PageServerLoad } from './$types';
import { subjectObjectHref } from '$lib/data/runtime-object-registry';
import { hasPermission } from '$lib/server/platform-context';
import { listFavourites, listRecentItems } from '$lib/server/interaction-preferences';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { listMyWork } from '$lib/server/shared-work';
import { functionWorkspaceDirectory } from '$lib/workspaces/function-directory';

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const canReadWork = hasPermission(context, 'work.item.read');
  const [work, recent, favourites] = await Promise.all([
    canReadWork ? listMyWork(context) : Promise.resolve([]),
    listRecentItems(context, 6),
    listFavourites(context)
  ]);

  return {
    tenantSlug: params.tenant,
    actorDisplayName: context.actorDisplayName,
    accessRequestState: url.searchParams.get('accessRequest'),
    work: work.slice(0, 5).map((item) => ({
      ...item,
      subjectHref: subjectObjectHref(params.tenant, item.subjectType, item.subjectId, {
        section: 'work'
      })
    })),
    workCount: work.length,
    recent,
    favourites: favourites.slice(0, 6),
    functions: functionWorkspaceDirectory.map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      shortName: workspace.shortName,
      implementationState: workspace.implementationState,
      subfunctionCount: workspace.summary.subfunctionCount,
      activityCount: workspace.summary.activityCount,
      aggregateCount: workspace.summary.aggregateCount
    })),
    coverage: {
      functions: functionWorkspaceDirectory.length,
      subfunctions: functionWorkspaceDirectory.reduce(
        (sum, workspace) => sum + workspace.summary.subfunctionCount,
        0
      ),
      activities: functionWorkspaceDirectory.reduce(
        (sum, workspace) => sum + workspace.summary.activityCount,
        0
      )
    }
  };
};
