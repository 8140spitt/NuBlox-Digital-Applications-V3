<script lang="ts">
  let { data, form } = $props();

  const selectedSystem = $derived(data.selectedSystem);
  const selectedRelease = $derived(data.selectedRelease);

  function formatDate(value: string | null) {
    return value ? new Date(value).toLocaleString('en-GB') : '—';
  }

  function href(systemId: string, releaseId?: string) {
    const params = new URLSearchParams({ system: systemId });
    if (releaseId) params.set('release', releaseId);
    return `/${data.tenantSlug}/app/admin/reference-data/classifications?${params.toString()}`;
  }
</script>

<svelte:head>
  <title>Classification Reference Data · NuBlox</title>
</svelte:head>

<div class="classification-page">
  <header class="hero section-card">
    <div>
      <span class="eyebrow">Reference data · AGG-29-CLASSIFICATION</span>
      <h1>Classification systems</h1>
      <p>
        Govern taxonomies such as Uniclass as stable systems with explicit immutable releases and
        release-scoped codes. Classification overlays canonical business identity; it never replaces it.
      </p>
    </div>
    <div class="principle">
      <strong>Release-pinned semantics</strong>
      <span>System → immutable release → code hierarchy</span>
      <small>Historical business assignments remain interpretable against the exact release used.</small>
    </div>
  </header>

  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <div class="workspace-grid">
    <aside class="systems section-card">
      <div class="panel-heading">
        <div><span class="eyebrow">Systems</span><h2>{data.systems.length} governed taxonomies</h2></div>
      </div>

      <nav class="system-list" aria-label="Classification systems">
        {#each data.systems as system}
          <a class:active={selectedSystem?.id === system.id} href={href(system.id)}>
            <strong>{system.name}</strong>
            <span>{system.systemKey}</span>
            <small>{system.publisher} · v{system.version}</small>
          </a>
        {:else}
          <p class="empty-copy">No classification system has been registered.</p>
        {/each}
      </nav>

      {#if data.capabilities.canManage}
        <details class="command-panel">
          <summary>Add system</summary>
          <form method="POST" action="?/createSystem">
            <label>System key<input name="systemKey" required placeholder="UNICLASS" /></label>
            <label>Name<input name="name" required placeholder="Uniclass" /></label>
            <label>Publisher<input name="publisher" required placeholder="NBS" /></label>
            <label>External identifier<input name="systemIdentifier" placeholder="Optional source identifier" /></label>
            <label>Purpose<textarea name="purpose" rows="3" placeholder="Classification purpose"></textarea></label>
            <button type="submit">Create classification system</button>
          </form>
        </details>
      {/if}
    </aside>

    <main class="main-column">
      {#if selectedSystem}
        <section class="section-card system-header">
          <div>
            <span class="eyebrow">{selectedSystem.systemKey}</span>
            <h2>{selectedSystem.name}</h2>
            <p>{selectedSystem.purpose || 'No purpose statement recorded.'}</p>
          </div>
          <div class="facts">
            <span><small>Publisher</small><strong>{selectedSystem.publisher}</strong></span>
            <span><small>Aggregate version</small><strong>{selectedSystem.version}</strong></span>
            <span><small>Status</small><strong>{selectedSystem.status}</strong></span>
          </div>
        </section>

        <section class="section-card releases">
          <div class="panel-heading">
            <div><span class="eyebrow">Release governance</span><h2>{data.releases.length} releases</h2></div>
            {#if data.capabilities.canManage}
              <details class="command-panel compact">
                <summary>New release</summary>
                <form method="POST" action="?/createRelease">
                  <input type="hidden" name="systemId" value={selectedSystem.id} />
                  <input type="hidden" name="systemVersion" value={selectedSystem.version} />
                  <label>Release key<input name="releaseKey" required placeholder="2026-09" /></label>
                  <label>Publication date<input name="publicationDate" type="date" /></label>
                  <label>Effective from<input name="effectiveFrom" type="date" /></label>
                  <label>Effective to<input name="effectiveTo" type="date" /></label>
                  <input type="hidden" name="sourceDigestAlgorithm" value="SHA256" />
                  <label>Source SHA-256<input name="sourceDigest" required minlength="64" maxlength="64" placeholder="64-character source digest" /></label>
                  <button type="submit">Create draft release</button>
                </form>
              </details>
            {/if}
          </div>
          <div class="release-list">
            {#each data.releases as release}
              <a class:active={selectedRelease?.id === release.id} href={href(selectedSystem.id, release.id)}>
                <strong>{release.releaseKey}</strong>
                <span class={'release-status ' + release.status.toLowerCase()}>{release.status}</span>
                <small>{release.publicationDate ? formatDate(release.publicationDate) : 'Publication date not recorded'}</small>
              </a>
            {:else}
              <p class="empty-copy">Create a draft release before loading codes.</p>
            {/each}
          </div>
        </section>

        {#if selectedRelease}
          <section class="section-card code-register">
            <div class="panel-heading">
              <div>
                <span class="eyebrow">Release {selectedRelease.releaseKey}</span>
                <h2>{data.codes.length} displayed codes</h2>
              </div>
              <div class="release-actions">
                <form method="GET" class="search">
                  <input type="hidden" name="system" value={selectedSystem.id} />
                  <input type="hidden" name="release" value={selectedRelease.id} />
                  <input name="q" value={data.search} placeholder="Search code or title" />
                  <button class="quiet" type="submit">Search</button>
                </form>
                {#if selectedRelease.status === 'DRAFT' && data.capabilities.canPublish}
                  <form method="POST" action="?/publishRelease">
                    <input type="hidden" name="systemId" value={selectedSystem.id} />
                    <input type="hidden" name="releaseId" value={selectedRelease.id} />
                    <input type="hidden" name="systemVersion" value={selectedSystem.version} />
                    <button type="submit">Publish immutable release</button>
                  </form>
                {/if}
              </div>
            </div>

            <div class="release-meta">
              <span><small>Status</small><strong>{selectedRelease.status}</strong></span>
              <span><small>Published</small><strong>{formatDate(selectedRelease.publishedAt)}</strong></span>
              <span><small>Digest</small><strong>{selectedRelease.sourceDigestAlgorithm} · {selectedRelease.sourceDigest.slice(0, 12)}…</strong></span>
            </div>

            {#if selectedRelease.status === 'DRAFT' && data.capabilities.canManage}
              <details class="command-panel import-panel">
                <summary>Load classification codes</summary>
                <form method="POST" action="?/importCodes">
                  <input type="hidden" name="systemId" value={selectedSystem.id} />
                  <input type="hidden" name="releaseId" value={selectedRelease.id} />
                  <input type="hidden" name="systemVersion" value={selectedSystem.version} />
                  <label>
                    Bulk code rows
                    <textarea
                      name="codeBatch"
                      rows="8"
                      required
                      placeholder={'code | title | parent code | status | description\nSs_25 | Wall systems\nSs_25_10 | External wall systems | Ss_25'}
                    ></textarea>
                  </label>
                  <p>Paste up to 5,000 tab- or pipe-delimited rows. Parent order does not matter. Status defaults to ACTIVE.</p>
                  <button type="submit">Load governed code batch</button>
                </form>
              </details>
            {/if}

            <div class="table-wrap">
              <table>
                <thead><tr><th>Code</th><th>Title</th><th>Parent</th><th>Status</th></tr></thead>
                <tbody>
                  {#each data.codes as code}
                    <tr>
                      <td><strong>{code.code}</strong></td>
                      <td>{code.title}{#if code.description}<small>{code.description}</small>{/if}</td>
                      <td>{code.parentCode || '—'}</td>
                      <td><span class="code-status">{code.status}</span></td>
                    </tr>
                  {:else}
                    <tr><td colspan="4" class="empty-cell">No codes match this release/search.</td></tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </section>
        {/if}
      {:else}
        <section class="section-card empty-state">
          <span class="eyebrow">Reference data</span>
          <h2>Create the first classification system</h2>
          <p>Use the governed classification runtime for Uniclass and every other external or internal taxonomy.</p>
        </section>
      {/if}
    </main>
  </div>
</div>

<style>
  .classification-page { display: grid; gap: 12px; }
  .hero { display: grid; grid-template-columns: minmax(0,1.5fr) minmax(300px,.65fr); gap: 24px; padding: 18px; border-color: #8fc9ee; background: linear-gradient(120deg,#fbfdff,#eaf6fd); }
  .eyebrow { color: var(--blue-700); font-size: 10px; font-weight: 850; letter-spacing: .07em; text-transform: uppercase; }
  h1 { margin: 3px 0 6px; font-size: 25px; }
  h2 { margin: 2px 0 0; font-size: 16px; }
  p { color: #5e7383; font-size: 10.5px; line-height: 1.45; }
  .hero p { margin: 0; max-width: 760px; font-size: 11.5px; }
  .principle { display: grid; gap: 5px; padding: 12px; border: 1px solid #b8dcef; border-radius: 9px; background: rgba(255,255,255,.82); }
  .principle strong { color: #245471; font-size: 11.5px; }
  .principle span { color: #456275; font-size: 10px; }
  .principle small { color: #788b98; font-size: 9px; }
  .message { padding: 9px 12px; border: 1px solid #dd8a8a; border-radius: 8px; background: #fff3f3; color: #792f2f; font-size: 11px; }
  .workspace-grid { display: grid; grid-template-columns: 270px minmax(0,1fr); gap: 12px; align-items: start; }
  .systems { position: sticky; top: 78px; padding: 12px; }
  .main-column { display: grid; gap: 12px; min-width: 0; }
  .panel-heading { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 10px; }
  .system-list, .release-list { display: grid; gap: 6px; }
  .system-list a, .release-list a { display: grid; gap: 3px; padding: 9px; border: 1px solid #e0e7ec; border-radius: 8px; color: inherit; text-decoration: none; background: #fafcfd; }
  .system-list a.active, .release-list a.active { border-color: #79bde2; background: #edf8fe; box-shadow: inset 3px 0 var(--blue-700); }
  .system-list strong, .release-list strong { font-size: 11px; }
  .system-list span, .release-list small { color: #758794; font-size: 8.5px; }
  .system-list small { color: #8a98a1; font-size: 8px; }
  .command-panel { margin-top: 10px; border-top: 1px solid #e5ebef; padding-top: 9px; }
  .command-panel > summary { width: max-content; padding: 6px 8px; border-radius: 6px; background: #edf5fa; color: #35617d; font-size: 9px; font-weight: 800; cursor: pointer; }
  .command-panel form { display: grid; gap: 7px; margin-top: 8px; }
  .command-panel.compact { margin: 0; border: 0; padding: 0; }
  label { display: grid; gap: 4px; color: #52697a; font-size: 9px; font-weight: 750; }
  input, textarea { width: 100%; border: 1px solid #ccd8e0; border-radius: 6px; padding: 7px 8px; color: var(--ink); font-size: 9.5px; }
  textarea { resize: vertical; font-family: inherit; }
  button { border: 0; border-radius: 6px; padding: 7px 9px; background: var(--blue-700); color: white; font-size: 9px; font-weight: 800; cursor: pointer; }
  button.quiet { border: 1px solid #d4e0e7; background: white; color: #4b6678; }
  .system-header { display: flex; justify-content: space-between; gap: 20px; padding: 14px; }
  .system-header p { margin: 5px 0 0; }
  .facts, .release-meta { display: flex; flex-wrap: wrap; gap: 6px; }
  .facts span, .release-meta span { display: grid; gap: 2px; min-width: 100px; padding: 6px 8px; border-radius: 6px; background: #f4f7f9; }
  .facts small, .release-meta small { color: #84929b; font-size: 7.5px; text-transform: uppercase; }
  .facts strong, .release-meta strong { color: #405d70; font-size: 9px; }
  .releases, .code-register { padding: 14px; }
  .release-list { grid-template-columns: repeat(3,minmax(0,1fr)); }
  .release-status, .code-status { width: max-content; padding: 2px 5px; border-radius: 999px; background: #edf2f5; color: #607483; font-size: 7.5px; font-weight: 850; }
  .release-status.published { background: #e6f5e9; color: #2b6c39; }
  .release-status.draft { background: #fff3d9; color: #805d19; }
  .release-actions { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; justify-content: end; }
  .search { display: flex; gap: 5px; }
  .search input { width: 220px; }
  .release-meta { margin-bottom: 10px; }
  .import-panel { margin: 0 0 10px; padding: 9px; border: 1px solid #dce6ec; border-radius: 8px; background: #fafcfd; }
  .import-panel p { margin: 0; font-size: 9px; }
  .table-wrap { overflow-x: auto; border: 1px solid #e1e8ec; border-radius: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
  th, td { padding: 7px 8px; border-bottom: 1px solid #e8edef; text-align: left; vertical-align: top; }
  th { background: #f6f8f9; color: #687c8a; font-size: 8px; text-transform: uppercase; }
  td strong { color: #315b75; }
  td small { display: block; margin-top: 2px; color: #81909a; font-size: 8px; }
  .empty-copy { padding: 12px 5px; color: #82909a; }
  .empty-cell { padding: 24px; color: #82909a; text-align: center; }
  .empty-state { min-height: 260px; display: grid; place-content: center; padding: 24px; text-align: center; }
  @media(max-width:1050px) { .workspace-grid { grid-template-columns: 230px minmax(0,1fr); } .release-list { grid-template-columns: repeat(2,1fr); } }
  @media(max-width:760px) { .hero, .workspace-grid { grid-template-columns: 1fr; } .systems { position: static; } .system-header, .panel-heading { display: grid; } .release-list { grid-template-columns: 1fr; } .release-actions, .search { justify-content: stretch; } .search input { width: 100%; } }
</style>
