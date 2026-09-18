import { error, redirect } from '@sveltejs/kit';
import {
  resolveContextForAuthUser,
  resolveDevelopmentCommandContext,
  type CommandContext
} from '$lib/server/platform-context';

export async function resolveRequestCommandContext(
  tenantSlug: string,
  locals: App.Locals,
  returnTo = '/' + tenantSlug + '/app'
): Promise<CommandContext> {
  if (locals.user) {
    try {
      return await resolveContextForAuthUser(tenantSlug, locals.user.id);
    } catch (cause) {
      error(403, cause instanceof Error ? cause.message : 'Authenticated user has no authority in this tenant.');
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    return resolveDevelopmentCommandContext(tenantSlug);
  }

  redirect(303, '/login?returnTo=' + encodeURIComponent(returnTo));
}
