<script lang="ts">
  let { data, form } = $props();
  function href(id: string) {
    return `/${data.tenantSlug}/app/functions/f03/variance-management?kpi=${encodeURIComponent(id)}`;
  }
</script>

<svelte:head><title>Variance Management · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f03`}>F03 Enterprise Performance Management</a><span
      >›</span
    ><strong>F03.03 Variance Management</strong>
  </nav>
  <header class="hero section-card">
    <div>
      <span class="eyebrow">F03.03 · Performance Observation / Variance</span>
      <h1>Variance management</h1>
      <p>
        Compare validated actuals with active targets and governed baselines, then create
        accountable recovery work without mutating performance evidence.
      </p>
    </div>
    <div class="principle">
      <strong>Variance is analysis, not source truth</strong><span
        >Actual, target and baseline remain separate identities.</span
      ><small>Corrective intervention is shared Work, not a rewritten observation.</small>
    </div>
  </header>
  {#if form?.message}<div class="message">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <span class="eyebrow">KPI register</span>
      <h2>{data.kpis.length} definitions</h2>
      <nav class="rows">
        {#each data.kpis as item}<a
            class:active={data.selected?.id === item.id}
            href={href(item.id)}
            ><div><strong>{item.kpiCode}</strong><span>{item.status}</span></div>
            <p>{item.name}</p>
            <small>v{item.currentVersionNo} · {item.frequency}</small></a
          >{/each}
      </nav>
    </aside>

    <main class="main">
      {#if data.selected}
        <section class="section-card detail">
          <span class="eyebrow">{data.selected.kpiCode}</span>
          <h2>{data.selected.name}</h2>
          <form method="GET" class="analysis">
            <input type="hidden" name="kpi" value={data.selected.id} />
            <label>Scope type<input name="scopeType" value={data.query.scopeType} required /></label
            >
            <label>Scope ID<input name="scopeId" value={data.query.scopeId} required /></label>
            <label
              >Period start<input
                name="periodStart"
                type="date"
                value={data.query.periodStart}
                required
              /></label
            >
            <label
              >Period end<input
                name="periodEnd"
                type="date"
                value={data.query.periodEnd}
                required
              /></label
            >
            <button>Analyse variance</button>
          </form>

          {#if data.variance}
            <div class="facts">
              <span
                ><small>Actual</small><strong
                  >{data.variance.observation
                    ? Number(data.variance.observation.numericValue)
                    : '—'}</strong
                ></span
              >
              <span
                ><small>Target</small><strong
                  >{data.variance.target ? Number(data.variance.target.targetValue) : '—'}</strong
                ></span
              >
              <span
                ><small>Baseline</small><strong
                  >{data.variance.baseline
                    ? Number(data.variance.baseline.baselineValue)
                    : '—'}</strong
                ></span
              >
              <span><small>Variance</small><strong>{data.variance.delta ?? '—'}</strong></span>
              <span
                ><small>Variance %</small><strong
                  >{data.variance.deltaPercent == null
                    ? '—'
                    : data.variance.deltaPercent.toFixed(1) + '%'}</strong
                ></span
              >
              <span
                ><small>Status</small><strong
                  >{data.variance.onTarget == null
                    ? 'Incomplete'
                    : data.variance.onTarget
                      ? 'On target'
                      : 'Intervention required'}</strong
                ></span
              >
            </div>
          {/if}

          <div class="three">
            <section>
              <span class="eyebrow">Targets</span>
              <div class="rows">
                {#each data.targets as row}<article>
                    <div><strong>{row.targetRef}</strong><span>{row.status}</span></div>
                    <p>{row.comparisonOperator} {Number(row.targetValue)}</p>
                    <small
                      >{new Date(row.periodStart).toLocaleDateString('en-GB')} → {new Date(
                        row.periodEnd
                      ).toLocaleDateString('en-GB')}</small
                    >
                  </article>{/each}
              </div>
            </section>
            <section>
              <span class="eyebrow">Validated observations</span>
              <div class="rows">
                {#each data.observations.filter((row) => row.qualityStatus === 'VALIDATED') as row}<article
                  >
                    <div>
                      <strong>{Number(row.numericValue)}</strong><span>{row.qualityStatus}</span>
                    </div>
                    <p>{row.sourceReference}</p>
                    <small>{new Date(row.observedAt).toLocaleString('en-GB')}</small>
                  </article>{/each}
              </div>
            </section>
            <section>
              <span class="eyebrow">Baselines</span>
              <div class="rows">
                {#each data.baselines as row}<article>
                    <div><strong>{row.baselineRef}</strong><span>{row.status}</span></div>
                    <p>{row.scopeType} · {row.scopeId}</p>
                    <small>Observation {row.observationId}</small>
                  </article>{/each}
              </div>
            </section>
          </div>

          {#if data.canManage && data.selected.status === 'EFFECTIVE'}
            <details class="command" open>
              <summary>Create recovery action</summary>
              <form method="POST" action="?/corrective">
                <input type="hidden" name="kpiId" value={data.selected.id} /><input
                  type="hidden"
                  name="kpiVersionNo"
                  value={data.selected.currentVersionNo}
                /><label>Title<input name="title" required /></label><label
                  >Instructions<textarea name="instructions" rows="4" required></textarea></label
                >
                <div class="grid">
                  <label
                    >Priority<select name="priority"
                      ><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select
                    ></label
                  ><label>Due date<input name="dueAt" type="date" /></label>
                </div>
                <button>Create shared corrective Work</button>
              </form>
            </details>
          {/if}
        </section>
      {:else}<section class="section-card empty-state">
          <h2>No KPI definitions</h2>
          <p>Define governed KPI meaning in F01/F03 Performance Framework first.</p>
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
    grid-template-columns: 300px 1fr;
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
  .rows div {
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
  .analysis {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 7px;
    align-items: end;
  }
  .facts {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
    margin: 12px 0;
  }
  .facts span {
    display: grid;
    gap: 2px;
    padding: 8px;
    background: #f4f7f9;
    border-radius: 6px;
  }
  .facts small {
    font-size: 7.5px;
    color: #85949e;
  }
  .facts strong {
    font-size: 11px;
  }
  .three {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .command {
    margin-top: 12px;
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
  input,
  select,
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
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
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
  @media (max-width: 1000px) {
    .analysis,
    .facts,
    .three {
      grid-template-columns: 1fr 1fr;
    }
  }
  @media (max-width: 850px) {
    .hero,
    .workspace,
    .analysis,
    .facts,
    .three,
    .grid {
      grid-template-columns: 1fr;
    }
    .register {
      position: static;
    }
  }
</style>
