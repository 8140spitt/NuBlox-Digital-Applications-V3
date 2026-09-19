<script lang="ts">
  let { data, form } = $props();

  const definition = $derived(data.selectedDefinition);
  const selectedVersion = $derived(data.selectedVersion);

  function href(definitionId: string, versionId?: string) {
    const params = new URLSearchParams({ definition: definitionId });
    if (versionId) params.set('version', versionId);
    return `/${data.tenantSlug}/app/admin/reference-data/lifecycles?${params.toString()}`;
  }

  function stateRows() {
    return (data.configuration?.states ?? [])
      .map((state) =>
        [state.stateKey, state.label, state.terminal ? 'terminal' : '', state.sortOrder].join(' | ')
      )
      .join('\n');
  }

  function transitionRows() {
    return (data.configuration?.transitions ?? [])
      .map((transition) =>
        [transition.transitionKey, transition.fromStateKey, transition.toStateKey].join(' | ')
      )
      .join('\n');
  }
</script>

<svelte:head>
  <title>Lifecycle Configuration · NuBlox</title>
</svelte:head>

<div class="lifecycle-page">
  <header class="hero section-card">
    <div>
      <span class="eyebrow">Reference configuration · AGG-29-LIFECYCLE-CONFIG</span>
      <h1>Lifecycle definitions</h1>
      <p>
        Govern permitted business states and transitions as immutable published configuration.
        Runtime state remains on each owning domain aggregate.
      </p>
    </div>
    <div class="principle">
      <strong>Configuration is not workflow</strong>
      <span>Lifecycle defines valid domain semantics.</span>
      <small
        >Shared workflow coordinates work around those semantics without owning domain truth.</small
      >
    </div>
  </header>

  {#if form?.message}
    <div class="message" role="alert">{form.message}</div>
  {/if}

  <div class="workspace-grid">
    <aside class="definitions section-card">
      <div class="panel-heading">
        <div>
          <span class="eyebrow">Definitions</span>
          <h2>{data.definitions.length} governed lifecycles</h2>
        </div>
      </div>

      <nav class="definition-list" aria-label="Lifecycle definitions">
        {#each data.definitions as item}
          <a class:active={definition?.id === item.id} href={href(item.id)}>
            <strong>{item.name}</strong>
            <span>{item.lifecycleKey}</span>
            <small>{item.appliesToType} · aggregate v{item.version}</small>
          </a>
        {:else}
          <p class="empty-copy">No lifecycle definition has been registered.</p>
        {/each}
      </nav>

      {#if data.capabilities.canManage}
        <details class="command-panel">
          <summary>Add lifecycle</summary>
          <form method="POST" action="?/createDefinition">
            <label
              >Lifecycle key<input
                name="lifecycleKey"
                required
                placeholder="CONTRACT.LIFECYCLE"
              /></label
            >
            <label>Name<input name="name" required placeholder="Contract lifecycle" /></label>
            <label
              >Applies to type<input name="appliesToType" required placeholder="CONTRACT" /></label
            >
            <label
              >Purpose<textarea name="purpose" rows="3" placeholder="Why this lifecycle exists"
              ></textarea></label
            >
            <button type="submit">Create lifecycle definition</button>
          </form>
        </details>
      {/if}
    </aside>

    <main class="main-column">
      {#if definition}
        <section class="definition-header section-card">
          <div>
            <span class="eyebrow">{definition.lifecycleKey}</span>
            <h2>{definition.name}</h2>
            <p>{definition.purpose || 'No purpose statement recorded.'}</p>
          </div>
          <div class="facts">
            <span><small>Applies to</small><strong>{definition.appliesToType}</strong></span>
            <span><small>Aggregate version</small><strong>{definition.version}</strong></span>
            <span><small>Status</small><strong>{definition.status}</strong></span>
          </div>
        </section>

        <section class="versions section-card">
          <div class="panel-heading">
            <div>
              <span class="eyebrow">Version history</span>
              <h2>{data.versions.length} configuration versions</h2>
            </div>
            {#if data.capabilities.canManage}
              <details class="command-panel compact">
                <summary>New draft</summary>
                <form method="POST" action="?/createVersion">
                  <input type="hidden" name="definitionId" value={definition.id} />
                  <input type="hidden" name="definitionVersion" value={definition.version} />
                  <label
                    >Description<input
                      name="description"
                      placeholder="Purpose of this version"
                    /></label
                  >
                  <button type="submit">Create draft version</button>
                </form>
              </details>
            {/if}
          </div>

          <nav class="version-list" aria-label="Lifecycle versions">
            {#each data.versions as item}
              <a class:active={selectedVersion?.id === item.id} href={href(definition.id, item.id)}>
                <strong>v{item.versionNo}</strong>
                <span class:published={item.status === 'PUBLISHED'} class="status"
                  >{item.status}</span
                >
                <small>{item.description || 'No description recorded'}</small>
              </a>
            {:else}
              <p class="empty-copy">Create a draft version to configure states and transitions.</p>
            {/each}
          </nav>
        </section>

        {#if selectedVersion && data.configuration}
          <section class="configuration section-card">
            <div class="panel-heading">
              <div>
                <span class="eyebrow">Version {selectedVersion.versionNo}</span>
                <h2>{selectedVersion.status} lifecycle model</h2>
              </div>
              {#if selectedVersion.status === 'DRAFT' && data.capabilities.canPublish}
                <form method="POST" action="?/publish">
                  <input type="hidden" name="definitionId" value={definition.id} />
                  <input type="hidden" name="versionId" value={selectedVersion.id} />
                  <input type="hidden" name="definitionVersion" value={definition.version} />
                  <button type="submit">Publish immutable version</button>
                </form>
              {/if}
            </div>

            <div class="version-facts">
              <span
                ><small>Initial state</small><strong
                  >{selectedVersion.initialStateKey || 'Not configured'}</strong
                ></span
              >
              <span><small>States</small><strong>{data.configuration.states.length}</strong></span>
              <span
                ><small>Transitions</small><strong>{data.configuration.transitions.length}</strong
                ></span
              >
            </div>

            {#if selectedVersion.status === 'DRAFT' && data.capabilities.canManage}
              <details
                class="command-panel config-editor"
                open={data.configuration.states.length === 0}
              >
                <summary>Configure draft lifecycle</summary>
                <form method="POST" action="?/configure">
                  <input type="hidden" name="definitionId" value={definition.id} />
                  <input type="hidden" name="versionId" value={selectedVersion.id} />
                  <input type="hidden" name="definitionVersion" value={definition.version} />
                  <label>
                    Initial state
                    <input
                      name="initialStateKey"
                      required
                      value={selectedVersion.initialStateKey || ''}
                      placeholder="DRAFT"
                    />
                  </label>
                  <div class="editor-grid">
                    <label>
                      State rows
                      <textarea
                        name="states"
                        rows="10"
                        required
                        value={stateRows()}
                        placeholder={'DRAFT | Draft | | 10\nIN_REVIEW | In review | | 20\nAPPROVED | Approved | terminal | 30'}
                      ></textarea>
                    </label>
                    <label>
                      Transition rows
                      <textarea
                        name="transitions"
                        rows="10"
                        value={transitionRows()}
                        placeholder={'SUBMIT | DRAFT | IN_REVIEW\nAPPROVE | IN_REVIEW | APPROVED'}
                      ></textarea>
                    </label>
                  </div>
                  <p>
                    Use tab or pipe delimiters. Every state must be reachable from the initial
                    state, and terminal states cannot have outgoing transitions.
                  </p>
                  <button type="submit">Save draft configuration</button>
                </form>
              </details>
            {/if}

            <div class="model-grid">
              <section>
                <span class="eyebrow">States</span>
                <div class="table-wrap">
                  <table>
                    <thead><tr><th>State</th><th>Label</th><th>Terminal</th></tr></thead>
                    <tbody>
                      {#each data.configuration.states as state}
                        <tr>
                          <td><strong>{state.stateKey}</strong></td>
                          <td>{state.label}</td>
                          <td>{state.terminal ? 'Yes' : 'No'}</td>
                        </tr>
                      {:else}
                        <tr><td class="empty-cell" colspan="3">No states configured.</td></tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <span class="eyebrow">Transitions</span>
                <div class="table-wrap">
                  <table>
                    <thead><tr><th>Command</th><th>From</th><th>To</th></tr></thead>
                    <tbody>
                      {#each data.configuration.transitions as transition}
                        <tr>
                          <td><strong>{transition.transitionKey}</strong></td>
                          <td>{transition.fromStateKey}</td>
                          <td>{transition.toStateKey}</td>
                        </tr>
                      {:else}
                        <tr><td class="empty-cell" colspan="3">No transitions configured.</td></tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </section>
        {/if}
      {:else}
        <section class="empty-state section-card">
          <span class="eyebrow">Lifecycle governance</span>
          <h2>Create the first lifecycle definition</h2>
          <p>Define domain semantics here; never hide lifecycle truth inside workflow steps.</p>
        </section>
      {/if}
    </main>
  </div>
</div>

<style>
  .lifecycle-page {
    display: grid;
    gap: 12px;
  }
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(290px, 0.65fr);
    gap: 24px;
    padding: 18px;
    border-color: #8fc9ee;
    background: linear-gradient(120deg, #fbfdff, #eaf6fd);
  }
  .eyebrow {
    color: var(--blue-700);
    font-size: 10px;
    font-weight: 850;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }
  h1 {
    margin: 3px 0 6px;
    font-size: 25px;
  }
  h2 {
    margin: 2px 0 0;
    font-size: 16px;
  }
  p {
    color: #5f7484;
    font-size: 10px;
    line-height: 1.45;
  }
  .hero p {
    margin: 0;
    max-width: 760px;
    font-size: 11.5px;
  }
  .principle {
    display: grid;
    gap: 5px;
    padding: 12px;
    border: 1px solid #bddded;
    border-radius: 9px;
    background: white;
  }
  .principle strong {
    color: #315d76;
    font-size: 11px;
  }
  .principle span {
    color: #526d7d;
    font-size: 9.5px;
  }
  .principle small {
    color: #7b8e9a;
    font-size: 8.5px;
    line-height: 1.4;
  }
  .message {
    padding: 9px 12px;
    border: 1px solid #dd8a8a;
    border-radius: 8px;
    background: #fff3f3;
    color: #792f2f;
    font-size: 11px;
  }
  .workspace-grid {
    display: grid;
    grid-template-columns: 270px minmax(0, 1fr);
    gap: 12px;
    align-items: start;
  }
  .definitions {
    position: sticky;
    top: 78px;
    padding: 12px;
  }
  .main-column {
    display: grid;
    gap: 12px;
    min-width: 0;
  }
  .panel-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }
  .definition-list,
  .version-list {
    display: grid;
    gap: 6px;
  }
  .definition-list a,
  .version-list a {
    display: grid;
    gap: 3px;
    padding: 9px;
    border: 1px solid #e0e7ec;
    border-radius: 8px;
    color: inherit;
    background: #fafcfd;
    text-decoration: none;
  }
  .definition-list a.active,
  .version-list a.active {
    border-color: #79bde2;
    background: #edf8fe;
    box-shadow: inset 3px 0 var(--blue-700);
  }
  .definition-list strong,
  .version-list strong {
    font-size: 11px;
  }
  .definition-list span,
  .definition-list small,
  .version-list small {
    color: #788a97;
    font-size: 8.5px;
  }
  .command-panel {
    margin-top: 10px;
    padding-top: 9px;
    border-top: 1px solid #e5ebef;
  }
  .command-panel.compact {
    margin: 0;
    padding: 0;
    border: 0;
  }
  .command-panel summary {
    width: max-content;
    padding: 6px 8px;
    border-radius: 6px;
    background: #edf5fa;
    color: #35617d;
    font-size: 9px;
    font-weight: 800;
    cursor: pointer;
  }
  form {
    display: grid;
    gap: 7px;
  }
  .command-panel form {
    margin-top: 8px;
  }
  label {
    display: grid;
    gap: 4px;
    color: #52697a;
    font-size: 9px;
    font-weight: 750;
  }
  input,
  textarea {
    width: 100%;
    border: 1px solid #ccd8e0;
    border-radius: 6px;
    padding: 7px 8px;
    color: var(--ink);
    font-size: 9.5px;
  }
  textarea {
    resize: vertical;
    font-family: inherit;
  }
  button {
    border: 0;
    border-radius: 6px;
    padding: 7px 9px;
    background: var(--blue-700);
    color: white;
    font-size: 9px;
    font-weight: 800;
    cursor: pointer;
  }
  .definition-header {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    padding: 14px;
  }
  .definition-header p {
    margin: 5px 0 0;
  }
  .facts,
  .version-facts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .facts span,
  .version-facts span {
    display: grid;
    gap: 2px;
    min-width: 105px;
    padding: 6px 8px;
    border-radius: 6px;
    background: #f4f7f9;
  }
  .facts small,
  .version-facts small {
    color: #86959f;
    font-size: 7.5px;
    text-transform: uppercase;
  }
  .facts strong,
  .version-facts strong {
    color: #405d70;
    font-size: 9px;
  }
  .versions,
  .configuration {
    padding: 14px;
  }
  .version-list {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .status {
    width: max-content;
    padding: 2px 5px;
    border-radius: 999px;
    background: #fff3d9;
    color: #805d19;
    font-size: 7.5px;
    font-weight: 850;
  }
  .status.published {
    background: #e6f5e9;
    color: #2b6c39;
  }
  .version-facts {
    margin-bottom: 10px;
  }
  .config-editor {
    margin-bottom: 12px;
    padding: 10px;
    border: 1px solid #dce6ec;
    border-radius: 8px;
    background: #fafcfd;
  }
  .editor-grid,
  .model-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .config-editor p {
    margin: 0;
  }
  .table-wrap {
    overflow-x: auto;
    margin-top: 6px;
    border: 1px solid #e1e8ec;
    border-radius: 8px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9px;
  }
  th,
  td {
    padding: 6px 7px;
    border-bottom: 1px solid #e8edef;
    text-align: left;
  }
  th {
    background: #f6f8f9;
    color: #687c8a;
    font-size: 7.5px;
    text-transform: uppercase;
  }
  td strong {
    color: #315b75;
  }
  .empty-copy {
    padding: 10px 4px;
    color: #81909a;
  }
  .empty-cell {
    padding: 18px;
    color: #81909a;
    text-align: center;
  }
  .empty-state {
    display: grid;
    place-content: center;
    min-height: 250px;
    padding: 24px;
    text-align: center;
  }
  @media (max-width: 1050px) {
    .workspace-grid {
      grid-template-columns: 230px minmax(0, 1fr);
    }
    .version-list {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 760px) {
    .hero,
    .workspace-grid,
    .editor-grid,
    .model-grid {
      grid-template-columns: 1fr;
    }
    .definitions {
      position: static;
    }
    .definition-header,
    .panel-heading {
      display: grid;
    }
    .version-list {
      grid-template-columns: 1fr;
    }
  }
</style>
