import { redirect } from '@sveltejs/kit';

export const load = () => {
  throw redirect(307, '/perspective-bc/app/functions/f01');
};
