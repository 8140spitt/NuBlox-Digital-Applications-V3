import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import {
  discardWorkDraft,
  getWorkDraft,
  markWorkDraftApplied,
  saveWorkDraft
} from '$lib/server/work-context';

export const POST: RequestHandler = async ({ request, params, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const body = (await request.json()) as Record<string, unknown>;
  const operation = String(body.operation ?? 'save');
  const workContextId = String(body.workContextId ?? '');
  const formKey = String(body.formKey ?? '');

  if (operation === 'save') {
    const payload =
      body.payload && typeof body.payload === 'object' && !Array.isArray(body.payload)
        ? (body.payload as Record<string, unknown>)
        : {};
    const draft = await saveWorkDraft(context, {
      workContextId,
      formKey,
      baseVersion: body.baseVersion == null ? null : String(body.baseVersion),
      payload
    });
    return json({ draft });
  }

  if (operation === 'discard') {
    await discardWorkDraft(context, workContextId, formKey);
    return json({ ok: true });
  }

  if (operation === 'applied') {
    await markWorkDraftApplied(context, workContextId, formKey);
    return json({ ok: true });
  }

  if (operation === 'get') {
    return json({ draft: await getWorkDraft(context, workContextId, formKey) });
  }

  return json({ message: 'Unsupported work-draft operation.' }, { status: 400 });
};
