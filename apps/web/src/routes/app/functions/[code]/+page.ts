import { error } from '@sveltejs/kit';
import { getFunction } from '$lib/function-catalog';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params, data }) => {
  const workspace = getFunction(params.code);

  if (!workspace) {
    error(404, 'Function workspace not found');
  }

  return { ...data, workspace };
};
