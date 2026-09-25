import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
  const code = params.code.toLowerCase();
  const context = url.searchParams.get('context');
  const view = url.searchParams.get('view');
  const search = new URLSearchParams();
  if (context) search.set('context', context);
  if (view) search.set('view', view);
  const query = search.size ? `?${search.toString()}` : '';
  redirect(307, `/app/teams/${code}${query}`);
};
