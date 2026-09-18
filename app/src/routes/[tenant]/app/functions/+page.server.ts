import type { PageServerLoad } from './$types';
import { functionWorkspaceDirectory } from '$lib/workspaces/function-directory';

export const load: PageServerLoad = async ({ params }) => ({
  tenantSlug: params.tenant,
  functions: functionWorkspaceDirectory.map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    shortName: workspace.shortName,
    implementationState: workspace.implementationState,
    subfunctionCount: workspace.summary.subfunctionCount,
    activityCount: workspace.summary.activityCount,
    aggregateCount: workspace.summary.aggregateCount,
    commandCount: workspace.summary.commandCount,
    queryCount: workspace.summary.queryCount,
    decisionControlledCount: workspace.summary.decisionControlledCount
  }))
});
