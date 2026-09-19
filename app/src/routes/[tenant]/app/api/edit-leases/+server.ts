import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import {
  acquireEditLease,
  heartbeatEditLease,
  releaseEditLease
} from '$lib/server/edit-lease';

export const POST: RequestHandler = async ({ request, params, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const body = (await request.json()) as Record<string, unknown>;
  const operation = String(body.operation ?? 'heartbeat');
  const objectType = String(body.objectType ?? '');
  const objectId = String(body.objectId ?? '');

  if (operation === 'acquire') {
    const result = await acquireEditLease(context, {
      objectType,
      objectId,
      workContextId: body.workContextId == null ? null : String(body.workContextId),
      baseVersion: body.baseVersion == null ? null : String(body.baseVersion)
    });
    return json(result, { status: result.acquired ? 200 : 409 });
  }

  if (operation === 'heartbeat') {
    await heartbeatEditLease(
      context,
      objectType,
      objectId,
      String(body.leaseToken ?? '')
    );
    return json({ ok: true });
  }

  if (operation === 'release') {
    await releaseEditLease(
      context,
      objectType,
      objectId,
      String(body.leaseToken ?? ''),
      String(body.note ?? 'Edit session released by the browser.')
    );
    return json({ ok: true });
  }

  return json({ message: 'Unsupported edit-lease operation.' }, { status: 400 });
};
