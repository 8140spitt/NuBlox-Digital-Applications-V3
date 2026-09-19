import { enhance } from '$app/forms';

type FormState = 'dirty' | 'submitting' | 'saved' | 'error' | 'conflict' | 'draft-saved';

function emit(form: HTMLFormElement, state: FormState, detail: Record<string, unknown> = {}) {
  window.dispatchEvent(
    new CustomEvent('nublox:form-state', {
      detail: {
        state,
        routePath: window.location.pathname + window.location.search,
        workContextId: form.dataset.nubloxWorkContext ?? null,
        formKey: form.dataset.nubloxFormKey ?? null,
        ...detail
      }
    })
  );
}

function payload(form: HTMLFormElement) {
  const data = new FormData(form);
  const result: Record<string, unknown> = {};
  for (const [key, value] of data.entries()) {
    if (key === 'editLeaseToken') continue;
    const cleanValue =
      typeof value === 'string'
        ? value
        : {
            name: value.name,
            size: value.size,
            type: value.type
          };
    if (key in result) {
      result[key] = Array.isArray(result[key])
        ? [...(result[key] as unknown[]), cleanValue]
        : [result[key], cleanValue];
    } else {
      result[key] = cleanValue;
    }
  }
  return result;
}

function wireDraft(form: HTMLFormElement) {
  const endpoint = form.dataset.nubloxDraftEndpoint;
  const workContextId = form.dataset.nubloxWorkContext;
  const formKey = form.dataset.nubloxFormKey;
  if (!endpoint || !workContextId || !formKey) return () => {};

  let timer: ReturnType<typeof setTimeout> | undefined;
  const save = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            operation: 'save',
            workContextId,
            formKey,
            baseVersion: form.dataset.nubloxBaseVersion ?? null,
            payload: payload(form)
          })
        });
        if (response.ok) emit(form, 'draft-saved');
      } catch {
        // Draft persistence is additive UX. Native form submission remains authoritative.
      }
    }, 700);
  };
  form.addEventListener('input', save);
  form.addEventListener('change', save);
  return () => {
    if (timer) clearTimeout(timer);
    form.removeEventListener('input', save);
    form.removeEventListener('change', save);
  };
}

function shouldEnhance(form: HTMLFormElement) {
  if ((form.method || 'get').toLowerCase() !== 'post') return false;
  if (form.dataset.nubloxNative === 'true') return false;
  const action = form.getAttribute('action') ?? '';
  return action === '' || action.startsWith('?');
}

export function enhanceForms(node: HTMLElement) {
  const wired = new Map<HTMLFormElement, () => void>();

  const attach = (form: HTMLFormElement) => {
    if (wired.has(form) || !shouldEnhance(form)) return;
    form.dataset.nubloxEnhanced = 'true';

    const dirty = () => {
      form.dataset.nubloxDirty = 'true';
      emit(form, 'dirty');
    };
    form.addEventListener('input', dirty);
    form.addEventListener('change', dirty);
    const unwireDraft = wireDraft(form);

    const enhancement = enhance(form, () => {
      form.dataset.nubloxSubmitting = 'true';
      emit(form, 'submitting');
      return async ({ result, update }) => {
        delete form.dataset.nubloxSubmitting;
        if (result.type === 'failure') {
          const status = 'status' in result ? result.status : 400;
          emit(form, status === 409 ? 'conflict' : 'error', { status });
          await update({ reset: false, invalidateAll: false });
          return;
        }
        if (result.type === 'error') {
          emit(form, 'error');
          await update({ reset: false, invalidateAll: false });
          return;
        }
        delete form.dataset.nubloxDirty;
        emit(form, 'saved');
        await update();
      };
    });

    wired.set(form, () => {
      enhancement.destroy?.();
      unwireDraft();
      form.removeEventListener('input', dirty);
      form.removeEventListener('change', dirty);
      delete form.dataset.nubloxEnhanced;
    });
  };

  const scan = (root: ParentNode) => {
    if (root instanceof HTMLFormElement) attach(root);
    root.querySelectorAll?.('form').forEach((form) => attach(form as HTMLFormElement));
  };

  scan(node);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const added of record.addedNodes) {
        if (added instanceof HTMLElement) scan(added);
      }
    }
  });
  observer.observe(node, { childList: true, subtree: true });

  return {
    destroy() {
      observer.disconnect();
      for (const cleanup of wired.values()) cleanup();
      wired.clear();
    }
  };
}
