import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import {
  closeWorkContext,
  listOpenWorkContexts,
  openWorkContext,
  reorderWorkContexts,
  touchWorkContext
} from '$lib/server/work-context';

export const GET: RequestHandler = async ({ params, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  return json({ contexts: await listOpenWorkContexts(context) });
};

export const POST: RequestHandler = async ({ request, params, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const body = (await request.json()) as Record<string, unknown>;
  const operation = String(body.operation ?? 'open');

  if (operation === 'open') {
    const workContext = await openWorkContext(context, {
      contextKey: String(body.contextKey ?? ''),
      contextType: String(body.contextType ?? 'OBJECT'),
      objectType: String(body.objectType ?? 'PAGE'),
      objectId: String(body.objectId ?? ''),
      objectVersion:
        body.objectVersion == null || body.objectVersion === '' ? null : String(body.objectVersion),
      title: String(body.title ?? ''),
      subtitle: body.subtitle == null ? null : String(body.subtitle),
      routePath: String(body.routePath ?? ''),
      workspaceFunctionId:
        body.workspaceFunctionId == null ? null : String(body.workspaceFunctionId)
    });
    return json({ workContext });
  }

  if (operation === 'touch') {
    await touchWorkContext(context, String(body.id ?? ''));
    return json({ ok: true });
  }

  if (operation === 'close') {
    await closeWorkContext(context, String(body.id ?? ''));
    return json({ ok: true });
  }

  if (operation === 'reorder') {
    const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
    await reorderWorkContexts(context, ids);
    return json({ ok: true });
  }

  return json({ message: 'Unsupported work-context operation.' }, { status: 400 });
};
