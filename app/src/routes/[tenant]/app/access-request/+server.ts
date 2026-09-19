import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requestPermissionAccess } from '$lib/server/permission-access-request';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

export const POST: RequestHandler = async ({ request, params, locals }) => {
  const data = await request.formData();
  const context = await resolveRequestCommandContext(params.tenant, locals);

  let result;
  try {
    result = await requestPermissionAccess(context, {
      permissionKey: text(data, 'permissionKey'),
      requestedPath: text(data, 'requestedPath')
    });
  } catch (cause) {
    error(
      400,
      cause instanceof Error ? cause.message : 'The permission request could not be submitted.'
    );
  }

  const state = result.alreadyAuthorized
    ? 'already-authorized'
    : result.created
      ? 'submitted'
      : 'already-requested';
  redirect(303, `/${params.tenant}/app?accessRequest=${state}`);
};
