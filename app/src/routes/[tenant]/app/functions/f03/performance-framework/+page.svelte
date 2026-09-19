<script lang="ts">
  let { data, form } = $props();
  function href(id: string) {
    return `/${data.tenantSlug}/app/functions/f03/performance-framework?scorecard=${encodeURIComponent(id)}`;
  }
</script>

<svelte:head><title>Performance Framework · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f03`}>F03 Enterprise Performance Management</a><span
      >›</span
    ><strong>F03.01 Performance Framework</strong>
  </nav>
  <header class="hero section-card">
    <div>
      <span class="eyebrow">F03.01 · AGG-02-PERFORMANCE</span>
      <h1>Performance framework</h1>
      <p>
        Compose governed enterprise scorecards from exact published or effective KPI versions
        without creating a second KPI master.
      </p>
    </div>
    <div class="principle">
      <strong>Scorecard ≠ KPI definition</strong><span
        >Scorecards organise and weight shared KPI versions.</span
      ><small>KPI meaning and lifecycle remain owned by the canonical performance aggregate.</small>
    </div>
  </header>
  {#if form?.message}<div class="message">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <span class="eyebrow">Scorecard register</span>
      <h2>{data.scorecards.length} scorecards</h2>
      <nav class="rows">
        {#each data.scorecards as item}
          <a class:active={data.selected?.id === item.id} href={href(item.id)}
            ><div><strong>{item.scorecardRef}</strong><span>{item.status}</span></div>
            <p>{item.name}</p>
            <small>{item.scopeType} · {item.scopeId}</small></a
          >
        {:else}<p class="empty">No enterprise scorecards.</p>{/each}
      </nav>
      {#if data.canManage}
        <details class="command">
          <summary>Create scorecard</summary>
          <form method="POST" action="?/create">
            <label>Reference<input name="scorecardRef" required /></label><label
              >Name<input name="name" required /></label
            >
            <div class="grid">
              <label>Scope type<input name="scopeType" value="TENANT" required /></label><label
                >Scope ID<input name="scopeId" required /></label
              >
            </div>
            <label>Owner Party ID<input name="ownerPartyId" /></label>
            <label
              >Hierarchy<textarea
                name="nodes"
                rows="5"
                required
                placeholder="ENTERPRISE | Enterprise&#10;DELIVERY | Delivery | ENTERPRISE | 10"
              ></textarea><small>Node key | Name | Parent key | Sort order</small></label
            >
            <label
              >KPI mappings<textarea name="kpiMappings" rows="5" required></textarea><small
                >Node key | KPI ID | KPI version | Weight | Sort order</small
              ></label
            >
            <button>Create governed scorecard</button>
          </form>
        </details>
      {/if}
    </aside>

    <main class="main">
      {#if data.selected}
        <section class="section-card detail">
          <div class="head">
            <div>
              <span class="eyebrow">{data.selected.scopeType} · {data.selected.scopeId}</span>
              <h2>{data.selected.scorecardRef} · {data.selected.name}</h2>
            </div>
            <span class="status">{data.selected.status}</span>
          </div>
          <div class="facts">
            <span><small>Version</small><strong>v{data.selected.aggregateVersion}</strong></span
            ><span><small>Hierarchy nodes</small><strong>{data.nodes.length}</strong></span><span
              ><small>KPI mappings</small><strong>{data.mappings.length}</strong></span
            >
          </div>
          <div class="two">
            <section>
              <span class="eyebrow">Hierarchy</span>
              <div class="rows">
                {#each data.nodes as node}<article>
                    <div><strong>{node.nodeKey}</strong><span>#{node.sortOrder}</span></div>
                    <p>{node.name}</p>
                    <small>Parent: {node.parentNodeId ?? 'root'}</small>
                  </article>{/each}
              </div>
            </section>
            <section>
              <span class="eyebrow">Pinned KPI versions</span>
              <div class="rows">
                {#each data.mappings as row}<article>
                    <div><strong>{row.kpiCode}</strong><span>v{row.kpiVersionNo}</span></div>
                    <p>{row.kpiName}</p>
                    <small>Weight {row.weight ?? '—'} · node {row.nodeId}</small>
                  </article>{/each}
              </div>
            </section>
          </div>
          {#if data.canManage && data.selected.status === 'DRAFT'}
            <form method="POST" action="?/publish" class="actions">
              <input type="hidden" name="scorecardId" value={data.selected.id} /><input
                type="hidden"
                name="aggregateVersion"
                value={data.selected.aggregateVersion}
              /><button>Publish scorecard</button>
            </form>
          {/if}
        </section>
        <section class="section-card detail">
          <span class="eyebrow">Shared KPI register</span>
          <h2>{data.kpis.length} canonical definitions</h2>
          <div class="rows">
            {#each data.kpis as kpi}<article>
                <div><strong>{kpi.kpiCode}</strong><span>{kpi.status}</span></div>
                <p>{kpi.name}</p>
                <small>v{kpi.currentVersionNo} · {kpi.frequency}</small>
              </article>{/each}
          </div>
        </section>
      {:else}<section class="section-card empty-state">
          <h2>Create the first enterprise scorecard</h2>
          <p>Use existing governed KPI versions; do not duplicate KPI definitions in F03.</p>
        </section>{/if}
    </main>
  </div>
</div>

<style>
  .page {
    display: grid;
    gap: 12px;
  }
  .breadcrumb {
    display: flex;
    gap: 7px;
    font-size: 9px;
    color: #728694;
  }
  .breadcrumb a {
    color: #315f7d;
    text-decoration: none;
  }
  .hero {
    display: grid;
    grid-template-columns: 1.5fr 0.7fr;
    gap: 20px;
    padding: 18px;
    background: linear-gradient(120deg, #fbfdff, #eaf6fd);
  }
  .eyebrow {
    font-size: 10px;
    font-weight: 850;
    color: var(--blue-700);
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }
  h1 {
    margin: 3px 0 6px;
    font-size: 25px;
  }
  h2 {
    margin: 3px 0 8px;
    font-size: 16px;
  }
  p {
    font-size: 10px;
    color: #5f7484;
  }
  .principle {
    display: grid;
    gap: 5px;
    padding: 12px;
    border: 1px solid #bddded;
    border-radius: 9px;
    background: #fff;
  }
  .principle strong {
    font-size: 11px;
    color: #315d76;
  }
  .principle span,
  .principle small {
    font-size: 9px;
    color: #667c8b;
  }
  .workspace {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 12px;
    align-items: start;
  }
  .register,
  .detail {
    padding: 13px;
  }
  .register {
    position: sticky;
    top: 78px;
  }
  .rows {
    display: grid;
    gap: 6px;
    margin-top: 9px;
  }
  .rows a,
  .rows article {
    display: grid;
    gap: 4px;
    padding: 8px;
    border: 1px solid #dfe7ec;
    border-radius: 7px;
    background: #fafcfd;
    color: inherit;
    text-decoration: none;
  }
  .rows a.active {
    border-color: #79bde2;
    background: #edf8fe;
  }
  .rows div,
  .head {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .rows strong {
    font-size: 9.5px;
  }
  .rows span,
  .rows small {
    font-size: 8px;
    color: #718693;
  }
  .rows p {
    margin: 0;
  }
  .command {
    margin-top: 10px;
    border-top: 1px solid #e4eaee;
    padding-top: 9px;
  }
  .command summary {
    cursor: pointer;
    font-size: 9px;
    font-weight: 800;
    color: #35617d;
  }
  form {
    display: grid;
    gap: 7px;
    margin-top: 8px;
  }
  label {
    display: grid;
    gap: 4px;
    font-size: 9px;
    color: #52697a;
    font-weight: 750;
  }
  label small {
    font-weight: 400;
  }
  input,
  textarea {
    width: 100%;
    padding: 7px;
    border: 1px solid #ccd8e0;
    border-radius: 6px;
    font: inherit;
  }
  button {
    border: 0;
    border-radius: 6px;
    padding: 7px 9px;
    background: var(--blue-700);
    color: white;
    font-size: 9px;
    font-weight: 800;
  }
  .grid,
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .facts {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin: 10px 0;
  }
  .facts span {
    display: grid;
    gap: 2px;
    min-width: 110px;
    padding: 7px;
    background: #f4f7f9;
    border-radius: 6px;
  }
  .facts small {
    font-size: 7.5px;
    color: #85949e;
  }
  .facts strong {
    font-size: 10px;
  }
  .status {
    font-size: 8px;
    font-weight: 800;
  }
  .message {
    padding: 9px;
    border: 1px solid #dd8a8a;
    background: #fff3f3;
    color: #792f2f;
  }
  .empty-state {
    padding: 24px;
    text-align: center;
  }
  @media (max-width: 850px) {
    .hero,
    .workspace,
    .grid,
    .two {
      grid-template-columns: 1fr;
    }
    .register {
      position: static;
    }
  }
</style>
