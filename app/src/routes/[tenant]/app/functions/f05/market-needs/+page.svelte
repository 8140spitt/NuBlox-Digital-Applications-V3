<script lang="ts">
  let { data, form } = $props();
  const href = (id: string) =>
    `/${data.tenantSlug}/app/functions/f05/market-needs?insight=${encodeURIComponent(id)}`;
</script>

<svelte:head><title>Market & Customer Needs · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f05`}>F05 Product, Service & Innovation</a><span
      >›</span
    ><strong>F05.02 Market / Customer Needs</strong>
  </nav>
  <header class="hero section-card">
    <div>
      <span class="eyebrow">F05.02 · AGG-03-MARKET-INSIGHT</span>
      <h1>Market & customer needs</h1>
      <p>
        Capture attributable research, customer problems and unmet needs with source, as-of and
        confidence context before they become design requirements.
      </p>
    </div>
    <div class="principle">
      <strong>Insight is evidence, not master data</strong><span
        >Observation time and provenance survive later interpretation.</span
      ><small
        >Validated insights can be traced into Product Configuration and future Engineering
        Requirement Sets.</small
      >
    </div>
  </header>
  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <div class="heading">
        <div>
          <span class="eyebrow">Need evidence</span>
          <h2>{data.insights.length} insights</h2>
        </div>
      </div>
      <nav class="rows">
        {#each data.insights as item}
          <a class:active={data.selected?.id === item.id} href={href(item.id)}>
            <div><strong>{item.insightRef}</strong><span>{item.status}</span></div>
            <p>{item.title}</p>
            <small>{item.insightType} · {item.confidence}</small>
          </a>
        {:else}<p class="empty">No market or customer needs captured.</p>{/each}
      </nav>

      {#if data.canManage}
        <details class="command">
          <summary>Capture need / insight</summary>
          <form method="POST" action="?/create">
            <div class="grid">
              <label>Reference<input name="insightRef" required /></label><label
                >Type<select name="insightType"
                  ><option>CUSTOMER_NEED</option><option>MARKET_RESEARCH</option><option
                    >COMPETITOR_INSIGHT</option
                  ><option>TREND</option></select
                ></label
              >
            </div>
            <label>Title<input name="title" required /></label>
            <label>Subject<textarea name="subject" rows="2" required></textarea></label>
            <div class="grid">
              <label
                >Source type<input name="sourceType" value="CUSTOMER_RESEARCH" required /></label
              ><label>Source reference<input name="sourceReference" /></label>
            </div>
            <div class="grid">
              <label
                >Confidence<select name="confidence"
                  ><option>HIGH</option><option selected>MEDIUM</option><option>LOW</option></select
                ></label
              ><label>As-of<input type="datetime-local" name="asOfAt" /></label>
            </div>
            <div class="grid">
              <label>Geography<input name="geography" /></label><label
                >Sector<input name="sector" /></label
              >
            </div>
            <label
              >Customer / market problem<textarea name="problemStatement" rows="3" required
              ></textarea></label
            >
            <label>Need statement<textarea name="needStatement" rows="3" required></textarea></label
            >
            <label>Desired outcome<textarea name="desiredOutcome" rows="2"></textarea></label>
            <label>Evidence reference<input name="evidenceReference" /></label>
            <button>Capture governed insight</button>
          </form>
        </details>
      {/if}
    </aside>

    <main>
      {#if data.selected}
        <section class="section-card detail">
          <div class="head">
            <div>
              <span class="eyebrow">{data.selected.insightType}</span>
              <h2>{data.selected.insightRef} · {data.selected.title}</h2>
            </div>
            <span class="status">{data.selected.status}</span>
          </div>
          <div class="facts">
            <span><small>Confidence</small><strong>{data.selected.confidence}</strong></span><span
              ><small>As-of</small><strong
                >{new Date(data.selected.asOfAt).toLocaleDateString('en-GB')}</strong
              ></span
            ><span><small>Geography</small><strong>{data.selected.geography ?? '—'}</strong></span
            ><span><small>Aggregate</small><strong>v{data.selected.aggregateVersion}</strong></span>
          </div>
          <section class="panel">
            <span class="eyebrow">Problem</span>
            <p>{data.selected.problemStatement}</p>
          </section>
          <section class="panel">
            <span class="eyebrow">Need</span>
            <p>{data.selected.needStatement}</p>
            {#if data.selected.desiredOutcome}<small
                >Desired outcome · {data.selected.desiredOutcome}</small
              >{/if}
          </section>
          <div class="source">
            <span><strong>Source</strong>{data.selected.sourceType}</span><span
              ><strong>Reference</strong>{data.selected.sourceReference ?? 'Not recorded'}</span
            ><span
              ><strong>Evidence</strong>{data.selected.evidenceReference ?? 'Not recorded'}</span
            >
          </div>
          {#if data.canManage && data.selected.status === 'CAPTURED'}
            <form method="POST" action="?/validate" class="actions">
              <input type="hidden" name="insightId" value={data.selected.id} />
              <input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion} />
              <button>Validate insight</button>
            </form>
          {/if}
        </section>
      {:else}<section class="section-card empty-state">
          <h2>Start with attributable need evidence</h2>
          <p>Capture the problem and source before creating a solution concept.</p>
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
    line-height: 1.45;
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
    grid-template-columns: 330px 1fr;
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
  .rows a {
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
  .facts {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    margin: 10px 0;
  }
  .facts span,
  .source span {
    display: grid;
    gap: 2px;
    padding: 7px;
    background: #f4f7f9;
    border-radius: 6px;
  }
  .facts small,
  .source strong {
    font-size: 7.5px;
    color: #85949e;
  }
  .facts strong,
  .source span {
    font-size: 9px;
  }
  .panel {
    margin-top: 8px;
    padding: 10px;
    border: 1px solid #dfe7ec;
    border-radius: 8px;
  }
  .panel p {
    font-size: 11px;
  }
  .panel small {
    font-size: 9px;
    color: #718693;
  }
  .source {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    margin-top: 8px;
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
    padding: 8px 10px;
    background: var(--blue-700);
    color: #fff;
    font-size: 9px;
    font-weight: 800;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }
  .status {
    font-size: 8px;
    font-weight: 850;
  }
  .message {
    padding: 9px;
    border: 1px solid #dd8a8a;
    background: #fff3f3;
    color: #792f2f;
  }
  .empty,
  .empty-state {
    color: #758896;
  }
  .empty-state {
    padding: 24px;
    text-align: center;
  }
  @media (max-width: 850px) {
    .hero,
    .workspace,
    .grid,
    .facts,
    .source {
      grid-template-columns: 1fr;
    }
    .register {
      position: static;
    }
  }
</style>
