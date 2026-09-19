import { fail } from '@sveltejs/kit';
import { EditLeaseConflictError } from '$lib/server/edit-lease';

export function actionProblem(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = Number((error as { status?: unknown }).status);
    if (status >= 300 && status < 400) throw error;
    if (status === 401 || status === 403 || status === 404) throw error;
  }
  if (error instanceof EditLeaseConflictError) {
    return fail(409, {
      message: error.message,
      conflict: true,
      holderDisplayName: error.holderDisplayName ?? null,
      expiresAt: error.expiresAt ?? null
    });
  }
  return fail(400, {
    message: error instanceof Error ? error.message : fallback
  });
}
