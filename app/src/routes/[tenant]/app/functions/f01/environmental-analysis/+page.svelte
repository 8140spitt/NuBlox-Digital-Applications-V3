<script lang="ts">
  let { data, form } = $props();

  const categories = [
    ['', 'All'],
    ['ECONOMIC', 'Economic'],
    ['MARKET', 'Markets'],
    ['COMPETITOR', 'Competitors'],
    ['TECHNOLOGY', 'Technology'],
    ['REGULATORY', 'Regulation'],
    ['OPPORTUNITY', 'Opportunities'],
    ['THREAT', 'Threats']
  ] as const;

  function href(category: string, assumptionId?: string) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (assumptionId) params.set('assumption', assumptionId);
    const query = params.toString();
    return `/${data.tenantSlug}/app/functions/f01/environmental-analysis${query ? '?' + query : ''}`;
  }
</script>

<svelte:head><title>Environmental Analysis · NuBlox</title></svelte:head>

<div class="analysis-page">
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f01`}>F01 Strategy & Enterprise Planning</a>
    <span>›</span><strong>F01.02 Environmental Analysis</strong>
  </nav>

  <header class="hero section-card">
    <div>
      <span class="eyebrow">F01.02 · AGG-02-ASSUMPTION</span>
      <h1>Environmental analysis</h1>
      <p>
        Maintain the governed assumptions and evidence base used to assess markets, economic
        conditions, competitors, technology, regulation, opportunities and threats.
      </p>
    </div>
    <div class="principle">
      <strong>Assumption ≠ fact</strong>
      <span>Every planning proposition has a basis, confidence and validity context.</span>
      <small>Consumers pin the exact assumption/version used in later analysis and decisions.</small
      >
    </div>
  </header>

  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <nav class="lenses" aria-label="Environmental analysis lenses">
    {#each categories as category}
      <a class:active={data.category === category[0]} href={href(category[0])}>{category[1]}</a>
    {/each}
  </nav>

  <div class="workspace-grid">
    <aside class="section-card register">
      <div class="register-head">
        <div>
          <span class="eyebrow">Evidence base</span>
          <h2>{data.assumptions.length} assumptions</h2>
        </div>
        <form method="GET" class="search">
          {#if data.category}<input type="hidden" name="category" value={data.category} />{/if}
          <input name="q" value={data.search} placeholder="Search assumptions" />
        </form>
      </div>

      <nav class="assumption-list">
        {#each data.assumptions as item}
          <a class:active={data.selected?.id === item.id} href={href(data.category, item.id)}>
            <div>
              <strong>{item.assumptionRef}</strong><span
                class={'status ' + item.status.toLowerCase()}>{item.status}</span
              >
            </div>
            <p>{item.statement}</p>
            <small>{item.category} · confidence {item.confidencePercent ?? '—'}%</small>
          </a>
        {:else}<p class="empty-copy">No governed assumptions match this lens.</p>{/each}
      </nav>

      {#if data.capabilities.canManage}
        <details class="command">
          <summary>Propose assumption</summary>
          <form method="POST" action="?/create">
            <label
              >Reference<input name="assumptionRef" required placeholder="MARKET-UK-001" /></label
            >
            <label
              >Category<select name="category" required
                >{#each categories.slice(1) as category}<option value={category[0]}
                    >{category[1]}</option
                  >{/each}<option value="OTHER">Other</option></select
              ></label
            >
            <label>Statement<textarea name="statement" rows="4" required></textarea></label>
            <label
              >Basis/source summary<textarea name="basisSummary" rows="3" required
              ></textarea></label
            >
            <div class="form-grid">
              <label
                >Confidence %<input
                  name="confidencePercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                /></label
              >
              <label
                >Evidence item ID<input
                  name="evidenceItemId"
                  placeholder="Optional governed Evidence ID"
                /></label
              >
              <label>Scope type<input name="scopeType" placeholder="TENANT" /></label>
              <label>Scope ID<input name="scopeId" placeholder="Optional exact scope" /></label>
              <label>Valid from<input name="validFrom" type="date" /></label>
              <label>Valid to<input name="validTo" type="date" /></label>
            </div>
            <button type="submit">Create proposed assumption</button>
          </form>
        </details>
      {/if}
    </aside>

    <main class="main-column">
      {#if data.selected}
        <section class="section-card detail">
          <div class="detail-head">
            <div>
              <span class="eyebrow">{data.selected.category}</span>
              <h2>{data.selected.assumptionRef}</h2>
            </div>
            <span class={'status large ' + data.selected.status.toLowerCase()}
              >{data.selected.status}</span
            >
          </div>
          <blockquote>{data.selected.statement}</blockquote>
          <div class="facts">
            <span
              ><small>Confidence</small><strong>{data.selected.confidencePercent ?? '—'}%</strong
              ></span
            >
            <span><small>Version</small><strong>v{data.selected.currentVersionNo}</strong></span>
            <span><small>Aggregate</small><strong>v{data.selected.aggregateVersion}</strong></span>
            <span
              ><small>Evidence</small><strong
                >{data.selected.evidenceItemId
                  ? data.selected.evidenceItemId.slice(0, 8)
                  : 'None linked'}</strong
              ></span
            >
          </div>
          <div class="basis">
            <span class="eyebrow">Basis / source</span>
            <p>{data.selected.basisSummary}</p>
          </div>

          {#if data.capabilities.canAssess}
            <details class="command">
              <summary>Assess assumption</summary>
              <form method="POST" action="?/assess">
                <input type="hidden" name="assumptionId" value={data.selected.id} />
                <input
                  type="hidden"
                  name="aggregateVersion"
                  value={data.selected.aggregateVersion}
                />
                <label
                  >Outcome<select name="outcome" required>
                    {#if data.selected.status === 'PROPOSED' || data.selected.status === 'CHALLENGED'}<option
                        value="ACCEPT">Accept</option
                      >{/if}
                    {#if data.selected.status === 'ACCEPTED'}<option value="ACTIVATE"
                        >Activate</option
                      >{/if}
                    {#if data.selected.status === 'ACCEPTED' || data.selected.status === 'ACTIVE'}<option
                        value="CHALLENGE">Challenge</option
                      >{/if}
                    {#if data.selected.status !== 'INVALIDATED'}<option value="INVALIDATE"
                        >Invalidate</option
                      >{/if}
                  </select></label
                >
                <label>Assessment note<textarea name="note" rows="3" required></textarea></label>
                <button type="submit">Record assessment</button>
              </form>
            </details>
          {/if}

          {#if data.capabilities.canManage && (data.selected.status === 'PROPOSED' || data.selected.status === 'CHALLENGED')}
            <details class="command">
              <summary>Revise content</summary>
              <form method="POST" action="?/revise">
                <input type="hidden" name="assumptionId" value={data.selected.id} />
                <input
                  type="hidden"
                  name="aggregateVersion"
                  value={data.selected.aggregateVersion}
                />
                <label
                  >Statement<textarea name="statement" rows="4" required
                    >{data.selected.statement}</textarea
                  ></label
                >
                <label
                  >Basis/source summary<textarea name="basisSummary" rows="3" required
                    >{data.selected.basisSummary}</textarea
                  ></label
                >
                <div class="form-grid">
                  <label
                    >Confidence %<input
                      name="confidencePercent"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={data.selected.confidencePercent ?? ''}
                    /></label
                  >
                  <label
                    >Evidence item ID<input
                      name="evidenceItemId"
                      value={data.selected.evidenceItemId ?? ''}
                    /></label
                  >
                  <label
                    >Scope type<input
                      name="scopeType"
                      value={data.selected.scopeType ?? ''}
                    /></label
                  >
                  <label>Scope ID<input name="scopeId" value={data.selected.scopeId ?? ''} /></label
                  >
                </div>
                <button type="submit">Create new assumption version</button>
              </form>
            </details>
          {/if}
        </section>

        <section class="section-card history">
          <span class="eyebrow">Immutable history</span>
          <h2>{data.versions.length} versions</h2>
          <div class="version-list">
            {#each data.versions as version}
              <article>
                <div>
                  <strong>v{version.versionNo}</strong><span
                    class={'status ' + version.lifecycleStatus.toLowerCase()}
                    >{version.lifecycleStatus}</span
                  >
                </div>
                <p>{version.statement}</p>
                {#if version.assessmentNote}<small>{version.assessmentNote}</small>{/if}
              </article>
            {/each}
          </div>
        </section>
      {:else}
        <section class="section-card empty-state">
          <h2>No assumptions yet</h2>
          <p>
            Propose the first governed environmental assumption to start the F01.02 evidence base.
          </p>
        </section>
      {/if}
    </main>
  </div>
</div>

<style>
  .analysis-page {
    display: grid;
    gap: 12px;
  }
  .breadcrumb {
    display: flex;
    gap: 7px;
    align-items: center;
    font-size: 9px;
    color: #728694;
  }
  .breadcrumb a {
    color: #315f7d;
    text-decoration: none;
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
  }
  .message {
    padding: 9px 12px;
    border: 1px solid #dd8a8a;
    border-radius: 8px;
    background: #fff3f3;
    color: #792f2f;
    font-size: 11px;
  }
  .lenses {
    display: flex;
    gap: 5px;
    overflow-x: auto;
  }
  .lenses a {
    min-width: max-content;
    padding: 7px 10px;
    border: 1px solid #dce5ea;
    border-radius: 7px;
    background: white;
    color: #617584;
    font-size: 9.5px;
    font-weight: 800;
    text-decoration: none;
  }
  .lenses a.active {
    border-color: #79bde2;
    background: #edf8fe;
    color: #245876;
  }
  .workspace-grid {
    display: grid;
    grid-template-columns: 330px minmax(0, 1fr);
    gap: 12px;
    align-items: start;
  }
  .register {
    position: sticky;
    top: 78px;
    padding: 12px;
  }
  .register-head,
  .detail-head {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: start;
  }
  .search input {
    width: 130px;
  }
  input,
  select,
  textarea {
    width: 100%;
    border: 1px solid #ccd8e0;
    border-radius: 6px;
    padding: 7px 8px;
    background: white;
    color: var(--ink);
    font-size: 9.5px;
  }
  textarea {
    resize: vertical;
    font-family: inherit;
  }
  .assumption-list {
    display: grid;
    gap: 6px;
    margin-top: 10px;
  }
  .assumption-list a {
    display: grid;
    gap: 5px;
    padding: 9px;
    border: 1px solid #e0e7ec;
    border-radius: 8px;
    background: #fafcfd;
    color: inherit;
    text-decoration: none;
  }
  .assumption-list a.active {
    border-color: #79bde2;
    background: #edf8fe;
    box-shadow: inset 3px 0 var(--blue-700);
  }
  .assumption-list a > div {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .assumption-list strong {
    font-size: 9.5px;
    color: #315b75;
  }
  .assumption-list p {
    margin: 0;
  }
  .assumption-list small {
    color: #788a97;
    font-size: 8px;
  }
  .status {
    width: max-content;
    padding: 2px 5px;
    border-radius: 999px;
    background: #eef2f5;
    color: #607483;
    font-size: 7.5px;
    font-weight: 850;
  }
  .status.active,
  .status.accepted {
    background: #e6f5e9;
    color: #2b6c39;
  }
  .status.challenged {
    background: #fff3d9;
    color: #805d19;
  }
  .status.invalidated {
    background: #fdeaea;
    color: #8d3232;
  }
  .status.large {
    padding: 4px 7px;
    font-size: 8.5px;
  }
  .command {
    margin-top: 10px;
    padding-top: 9px;
    border-top: 1px solid #e5ebef;
  }
  .command summary {
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
    margin-top: 8px;
  }
  label {
    display: grid;
    gap: 4px;
    color: #52697a;
    font-size: 9px;
    font-weight: 750;
  }
  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
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
  .main-column {
    display: grid;
    gap: 12px;
    min-width: 0;
  }
  .detail,
  .history {
    padding: 14px;
  }
  blockquote {
    margin: 14px 0;
    padding: 10px 12px;
    border-left: 3px solid #79bde2;
    background: #f8fbfd;
    color: #314f62;
    font-size: 13px;
    line-height: 1.5;
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .facts span {
    display: grid;
    gap: 2px;
    min-width: 110px;
    padding: 6px 8px;
    border-radius: 6px;
    background: #f4f7f9;
  }
  .facts small {
    color: #86959f;
    font-size: 7.5px;
    text-transform: uppercase;
  }
  .facts strong {
    color: #405d70;
    font-size: 9px;
  }
  .basis {
    margin-top: 12px;
    padding: 10px;
    border: 1px solid #e3e9ed;
    border-radius: 8px;
  }
  .basis p {
    margin: 4px 0 0;
  }
  .version-list {
    display: grid;
    gap: 7px;
    margin-top: 10px;
  }
  .version-list article {
    padding: 9px;
    border: 1px solid #e1e8ec;
    border-radius: 8px;
    background: #fafcfd;
  }
  .version-list article > div {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .version-list p {
    margin: 5px 0;
  }
  .version-list small {
    color: #7d8d98;
    font-size: 8.5px;
  }
  .empty-copy,
  .empty-state {
    color: #81909a;
  }
  .empty-state {
    min-height: 220px;
    display: grid;
    place-content: center;
    padding: 24px;
    text-align: center;
  }
  @media (max-width: 800px) {
    .hero,
    .workspace-grid,
    .form-grid {
      grid-template-columns: 1fr;
    }
    .register {
      position: static;
    }
  }
</style>
