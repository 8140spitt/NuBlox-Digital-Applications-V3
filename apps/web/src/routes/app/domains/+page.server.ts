import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
  const context = url.searchParams.get('context');
  redirect(307, context ? `/app/teams?context=${encodeURIComponent(context)}` : '/app/teams');
};
