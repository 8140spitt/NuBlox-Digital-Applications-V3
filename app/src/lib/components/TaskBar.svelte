<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';

  type WorkContext = {
    id: string;
    contextKey: string;
    contextType: string;
    objectType: string;
    objectId: string;
    objectVersion: string | null;
    title: string;
    subtitle: string | null;
    routePath: string;
    workspaceFunctionId: string | null;
    status: string;
    position: number;
    openedAt: string;
    lastAccessedAt: string;
  };

  type OpenInput = Omit<WorkContext, 'id' | 'status' | 'position' | 'openedAt' | 'lastAccessedAt'>;

  let {
    tenantSlug,
    initialContexts = []
  }: { tenantSlug: string; initialContexts?: WorkContext[] } = $props();

  let contexts = $state<WorkContext[]>([]);
  let dirtyIds = $state<Set<string>>(new Set());
  let pending = $state(false);
  let expanded = $state(true);

  $effect(() => {
    contexts = initialContexts;
  });

  const endpoint = $derived(`/${tenantSlug}/app/api/work-contexts`);
  const currentRoute = $derived(page.url.pathname + page.url.search);

  async function send(body: Record<string, unknown>) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('Task Bar update failed.');
    return response.json();
  }

  async function openContext(input: OpenInput) {
    pending = true;
    try {
      const result = await send({ operation: 'open', ...input });
      const item = result.workContext as WorkContext;
      contexts = [...contexts.filter((context) => context.id !== item.id), item].sort(
        (a, b) => a.position - b.position
      );
      expanded = true;
      return item;
    } finally {
      pending = false;
    }
  }

  function setDirty(id: string, dirty: boolean) {
    const next = new Set(dirtyIds);
    if (dirty) next.add(id);
    else next.delete(id);
    dirtyIds = next;
  }

  function pageContextKey(routePath: string) {
    return 'PAGE:' + routePath.replace(/[^A-Za-z0-9._:/-]+/g, '-').replace(/^-+|-+$/g, '');
  }

  async function openDirtyFormContext(routePath: string) {
    const functionMatch = routePath.match(/\/functions\/(f\d{2})(?:\/|\?|$)/i);
    const item = await openContext({
      contextKey: pageContextKey(routePath),
      contextType: 'FORM',
      objectType: 'PAGE',
      objectId: routePath,
      objectVersion: null,
      title: document.title.replace(/\s+·\s+NuBlox$/, ''),
      subtitle: 'Unsaved form changes',
      routePath,
      workspaceFunctionId: functionMatch?.[1]?.toUpperCase() ?? null
    });
    if (item) setDirty(item.id, true);
  }

  async function pinCurrent() {
    if (typeof document === 'undefined') return;

    const objectMatch = page.url.pathname.match(/\/app\/objects\/([^/]+)\/([^/]+)$/);
    if (objectMatch) {
      const objectType = decodeURIComponent(objectMatch[1]).toUpperCase();
      const objectId = decodeURIComponent(objectMatch[2]);
      const origin =
        page.url.searchParams
          .get('from')
          ?.match(/^F\d{2}/i)?.[0]
          ?.toUpperCase() ?? null;
      await openContext({
        contextKey: 'OBJECT:' + objectType + ':' + objectId,
        contextType: 'OBJECT',
        objectType,
        objectId,
        objectVersion: null,
        title: document.title.replace(/\s+·\s+NuBlox$/, ''),
        subtitle: 'Canonical ' + objectType.toLowerCase().replaceAll('-', ' ') + ' object',
        routePath: currentRoute,
        workspaceFunctionId: origin
      });
      return;
    }

    const suffix = page.url.search.replace(/[^A-Za-z0-9._:-]+/g, '-').replace(/^-+|-+$/g, '');
    await openContext({
      contextKey:
        'PAGE:' +
        page.url.pathname.replace(/[^A-Za-z0-9._:/-]+/g, '-') +
        (suffix ? ':' + suffix : ''),
      contextType: 'PAGE',
      objectType: 'PAGE',
      objectId: currentRoute,
      objectVersion: null,
      title: document.title.replace(/\s+·\s+NuBlox$/, ''),
      subtitle: page.url.pathname,
      routePath: currentRoute,
      workspaceFunctionId: null
    });
  }

  async function closeContext(id: string) {
    await send({ operation: 'close', id });
    contexts = contexts.filter((context) => context.id !== id);
    const next = new Set(dirtyIds);
    next.delete(id);
    dirtyIds = next;
  }

  function dirtyForRoute(routePath: string) {
    const match = contexts.find((context) => context.routePath === routePath);
    return match?.id;
  }

  onMount(() => {
    const handleOpen = (event: Event) => {
      const detail = (event as CustomEvent<OpenInput>).detail;
      if (detail) void openContext(detail);
    };
    const handleForm = (event: Event) => {
      const detail = (
        event as CustomEvent<{ state: string; routePath: string; workContextId?: string | null }>
      ).detail;
      const id = detail.workContextId ?? dirtyForRoute(detail.routePath);
      if (!id) {
        if (detail.state === 'dirty') void openDirtyFormContext(detail.routePath);
        return;
      }
      const next = new Set(dirtyIds);
      if (detail.state === 'dirty') next.add(id);
      if (detail.state === 'saved') next.delete(id);
      dirtyIds = next;
    };
    window.addEventListener('nublox:open-context', handleOpen);
    window.addEventListener('nublox:form-state', handleForm);
    return () => {
      window.removeEventListener('nublox:open-context', handleOpen);
      window.removeEventListener('nublox:form-state', handleForm);
    };
  });
</script>

<div class:collapsed={!expanded} class="taskbar" aria-label="Task Bar">
  <button
    class="toggle"
    type="button"
    onclick={() => (expanded = !expanded)}
    aria-label="Toggle Task Bar"
  >
    <span>Task Bar</span>
    <strong>{contexts.length}</strong>
    <span>{expanded ? '⌄' : '⌃'}</span>
  </button>

  {#if expanded}
    <div class="contexts">
      {#each contexts as context}
        <div class:active={context.routePath === currentRoute} class="context">
          <a href={context.routePath} title={context.subtitle ?? context.title}>
            <span class="kind">{context.workspaceFunctionId ?? context.objectType}</span>
            <strong>{context.title}</strong>
            {#if dirtyIds.has(context.id)}<span class="dirty" title="Unsaved changes">●</span>{/if}
          </a>
          <button
            class="close"
            type="button"
            onclick={() => void closeContext(context.id)}
            aria-label={'Close ' + context.title}>×</button
          >
        </div>
      {/each}
      {#if contexts.length === 0}
        <span class="empty">Pin pages or begin editing an item to keep it here.</span>
      {/if}
    </div>
    <button class="pin" type="button" disabled={pending} onclick={() => void pinCurrent()}>
      + Pin current
    </button>
  {/if}
</div>

<style>
  .taskbar {
    position: fixed;
    left: 248px;
    right: 0;
    bottom: 0;
    z-index: 40;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: stretch;
    min-height: 46px;
    border-top: 1px solid #b9ccd8;
    background: rgba(248, 251, 253, 0.97);
    box-shadow: 0 -4px 16px rgba(22, 55, 76, 0.11);
    backdrop-filter: blur(10px);
  }
  .taskbar.collapsed {
    left: auto;
    grid-template-columns: auto;
    min-height: 36px;
    margin: 0 12px 10px 0;
    border: 1px solid #b9ccd8;
    border-radius: 8px;
    overflow: hidden;
  }
  .toggle,
  .pin {
    border: 0;
    background: transparent;
    color: #31566e;
    font-size: 9px;
    font-weight: 800;
    cursor: pointer;
  }
  .toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 12px;
    border-right: 1px solid #d6e1e7;
  }
  .toggle strong {
    display: grid;
    place-items: center;
    min-width: 20px;
    height: 20px;
    border-radius: 999px;
    background: #e3f1f9;
    color: #2e6381;
  }
  .contexts {
    display: flex;
    align-items: stretch;
    gap: 4px;
    min-width: 0;
    overflow-x: auto;
    padding: 5px;
  }
  .context {
    flex: 0 0 auto;
    display: flex;
    align-items: stretch;
    max-width: 280px;
    border: 1px solid #d7e2e8;
    border-radius: 6px;
    overflow: hidden;
    background: white;
  }
  .context.active {
    border-color: #6fb7de;
    box-shadow: inset 0 -2px #2579a8;
  }
  .context a {
    display: grid;
    grid-template-columns: auto minmax(70px, 1fr) auto;
    gap: 6px;
    align-items: center;
    min-width: 0;
    padding: 7px 9px;
    color: #324f63;
    text-decoration: none;
  }
  .context strong {
    overflow: hidden;
    font-size: 9px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .kind {
    font-size: 7px;
    font-weight: 900;
    color: #6f8492;
    text-transform: uppercase;
  }
  .dirty {
    color: #c17b16;
    font-size: 11px;
  }
  .close {
    width: 26px;
    border: 0;
    border-left: 1px solid #edf1f3;
    background: #fbfcfd;
    color: #738590;
    cursor: pointer;
  }
  .pin {
    padding: 0 12px;
    border-left: 1px solid #d6e1e7;
  }
  .pin:disabled {
    opacity: 0.55;
  }
  .empty {
    align-self: center;
    padding: 0 9px;
    color: #7c8d98;
    font-size: 9.5px;
  }
  @media (max-width: 1050px) {
    .taskbar {
      left: 220px;
    }
  }
  @media (max-width: 760px) {
    .taskbar {
      left: 0;
    }
    .pin {
      display: none;
    }
  }
</style>
