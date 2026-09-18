import type { PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { listMyWork } from '$lib/server/shared-work';
import { functionWorkspaceDirectory } from '$lib/workspaces/function-directory';

export const load: PageServerLoad = async ({ params, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const canReadWork = hasPermission(context, 'work.item.read');
  const work = canReadWork ? await listMyWork(context) : [];

  return {
    tenantSlug: params.tenant,
    actorDisplayName: context.actorDisplayName,
    work: work.slice(0, 5),
    workCount: work.length,
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
