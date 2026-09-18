import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const returnTo = safeReturnTo(url.searchParams.get('returnTo'));
  if (locals.user) redirect(303, returnTo);
  return { returnTo };
};

export const actions: Actions = {
  default: async ({ request, url }) => {
    const form = await request.formData();
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const password = String(form.get('password') ?? '');
    const returnTo = safeReturnTo(String(form.get('returnTo') ?? url.searchParams.get('returnTo') ?? '/'));

    if (!email || !password) return fail(400, { message: 'Email and password are required.', email, returnTo });

    try {
      await auth.api.signInEmail({
        body: { email, password, rememberMe: true },
        headers: request.headers
      });
    } catch {
      return fail(400, { message: 'The email or password was not accepted.', email, returnTo });
    }

    redirect(303, returnTo);
  }
};
