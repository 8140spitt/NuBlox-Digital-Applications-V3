import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getFunctionWorkspace } from '$lib/workspaces/function-directory';

export const load: PageServerLoad = async ({ params }) => {
  const workspace = getFunctionWorkspace(params.function);
  if (!workspace) throw error(404, 'Business function not found.');

  return {
    tenantSlug: params.tenant,
    workspace
  };
};
