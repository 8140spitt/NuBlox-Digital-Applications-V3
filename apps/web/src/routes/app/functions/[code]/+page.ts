import { error, redirect } from '@sveltejs/kit';
import { getFunction } from '$lib/function-catalog';
import type { PageLoad } from './$types';

export type FunctionWorkspaceView = 'overview' | 'governance' | 'delivery' | 'performance' | 'records';

const VALID_VIEWS = new Set<FunctionWorkspaceView>([
  'overview',
  'governance',
  'delivery',
  'performance',
  'records'
]);

export const load: PageLoad = ({ params, data, url }) => {
  const workspace = getFunction(params.code);

  if (!workspace) {
    error(404, 'Function workspace not found');
  }

  if (workspace.code !== 'F01') {
    const search = new URLSearchParams(url.searchParams);
    const query = search.size ? `?${search.toString()}` : '';
    redirect(307, `/app/teams/${workspace.code.toLowerCase()}${query}`);
  }

  const requestedView = url.searchParams.get('view')?.toLowerCase() as FunctionWorkspaceView | undefined;
  const view: FunctionWorkspaceView = requestedView && VALID_VIEWS.has(requestedView)
    ? requestedView
    : 'overview';

  return { ...data, workspace, view };
};
