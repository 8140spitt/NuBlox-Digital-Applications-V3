<script lang="ts">
  let { data, form } = $props();
  const href = (id: string) =>
    `/${data.tenantSlug}/app/functions/f05/ideation?item=${encodeURIComponent(id)}`;
</script>

<svelte:head><title>Product & Service Ideation · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f05`}>F05 Product, Service & Innovation</a><span
      >›</span
    ><strong>F05.03 Ideation</strong>
  </nav>
  <header class="hero section-card">
    <div>
      <span class="eyebrow">F05.03 · AGG-10-ITEM</span>
      <h1>Product & service ideation</h1>
      <p>
        Capture concepts directly on the canonical Item spine, assess feasibility and value, then
        select concepts through exact immutable Decision evidence.
      </p>
    </div>
    <div class="principle">
      <strong>Concept → Item, not shadow idea master</strong><span
        >The stable identity survives launch and downstream commercial use.</span
      ><small
        >Product, material and service are behaviours/classifications of Item—not parallel masters.</small
      >
    </div>
  </header>
  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <span class="eyebrow">Concept pipeline</span>
      <h2>{data.items.length} Items / concepts</h2>
      <nav class="rows">
        {#each data.items as item}
          <a class:active={data.selected?.id === item.id} href={href(item.id)}>
            <div>
              <strong>{item.itemNumber}</strong><span>{item.conceptStatus ?? item.status}</span>
            </div>
            <p>{item.name}</p>
            <small>{item.itemType} · v{item.aggregateVersion}</small>
          </a>
        {:else}<p class="empty">No product or service concepts.</p>{/each}
      </nav>
      {#if data.capabilities.canManage}
        <details class="command">
          <summary>Capture concept</summary>
          <form method="POST" action="?/create">
            <div class="grid">
              <label>Item number<input name="itemNumber" required /></label><label
                >Concept type<select name="conceptType"
                  ><option>PRODUCT</option><option>SERVICE</option><option>PRODUCT_SERVICE</option
                  ></select
                ></label
              >
            </div>
            <label>Name<input name="name" required /></label><label
              >Description<textarea name="description" rows="3" required></textarea></label
            >
            <div class="grid">
              <label>Classification<input name="classificationCode" /></label><label
                >Base UOM<select name="baseUomId"
                  ><option value="">None</option
                  >{#each data.units.filter((u) => u.status === 'ACTIVE') as unit}<option
                      value={unit.id}>{unit.unitCode} · {unit.name}</option
                    >{/each}</select
                ></label
              >
            </div>
            <label>Need summary<textarea name="needSummary" rows="3" required></textarea></label>
            <label
              >Opportunity summary<textarea name="opportunitySummary" rows="3" required
              ></textarea></label
            >
            <label>Score basis JSON<textarea name="scoreBasis" rows="3">{'{}'}</textarea></label>
            <button>Capture canonical concept</button>
          </form>
        </details>
      {/if}
    </aside>

    <main>
      {#if data.selected}
        <section class="section-card detail">
          <div class="head">
            <div>
              <span class="eyebrow">{data.selected.itemType}</span>
              <h2>{data.selected.itemNumber} · {data.selected.name}</h2>
            </div>
            <div class="states">
              <span>{data.selected.status}</span><span>{data.selected.conceptStatus ?? '—'}</span>
            </div>
          </div>
          <p class="description">{data.selected.description}</p>
          <div class="facts">
            <span><small>Score</small><strong>{data.selected.score ?? '—'}</strong></span><span
              ><small>Classification</small><strong
                >{data.selected.classificationCode ?? '—'}</strong
              ></span
            ><span><small>Aggregate</small><strong>v{data.selected.aggregateVersion}</strong></span
            ><span
              ><small>Decision</small><strong
                >{data.selected.selectedDecisionId ? 'Bound' : 'Not selected'}</strong
              ></span
            >
          </div>
          <section class="panel">
            <span class="eyebrow">Need</span>
            <p>{data.selected.needSummary}</p>
            <span class="eyebrow">Opportunity</span>
            <p>{data.selected.opportunitySummary}</p>
            {#if data.selected.feasibilitySummary}<span class="eyebrow">Feasibility</span>
              <p>{data.selected.feasibilitySummary}</p>{/if}
          </section>
          <section class="panel">
            <div class="section-head">
              <span class="eyebrow">Assessment evidence</span><strong
                >{data.assessments.length}</strong
              >
            </div>
            <div class="assessment-list">
              {#each data.assessments as row}<article>
                  <div>
                    <strong>{row.assessmentType}</strong><span
                      >{row.rating ?? '—'} · {row.score ?? '—'}</span
                    >
                  </div>
                  <p>{row.summary}</p>
                  <small>{new Date(row.assessedAt).toLocaleString('en-GB')}</small>
                </article>{:else}<p>No assessment evidence yet.</p>{/each}
            </div>
          </section>
          {#if data.capabilities.canManage && data.selected.status === 'DRAFT' && data.selected.conceptStatus !== 'SELECTED'}
            <details class="command" open>
              <summary>Assess concept</summary>
              <form method="POST" action="?/assess">
                <input type="hidden" name="itemId" value={data.selected.id} /><input
                  type="hidden"
                  name="aggregateVersion"
                  value={data.selected.aggregateVersion}
                />
                <div class="grid">
                  <label
                    >Assessment<select name="assessmentType"
                      ><option>OPPORTUNITY</option><option>FEASIBILITY</option><option
                        >SCORING</option
                      ></select
                    ></label
                  ><label
                    >Rating<select name="rating"
                      ><option value="">None</option><option>HIGH</option><option>MEDIUM</option
                      ><option>LOW</option></select
                    ></label
                  >
                </div>
                <label
                  >Score 0–100<input
                    name="score"
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                  /></label
                >
                <label>Summary<textarea name="summary" rows="3" required></textarea></label><label
                  >Evidence reference<input name="evidenceReference" /></label
                ><button>Record assessment</button>
              </form>
            </details>
          {/if}
          {#if data.capabilities.canApprove && data.selected.status === 'DRAFT' && data.selected.conceptStatus !== 'SELECTED'}
            <details class="command">
              <summary>Select concept through Decision</summary>
              <form method="POST" action="?/select">
                <input type="hidden" name="itemId" value={data.selected.id} /><input
                  type="hidden"
                  name="aggregateVersion"
                  value={data.selected.aggregateVersion}
                />
                <label>Decision reason<textarea name="reason" rows="3" required></textarea></label
                ><button>Select concept</button>
              </form>
            </details>
          {/if}
        </section>
      {:else}<section class="section-card empty-state">
          <h2>Capture the first concept</h2>
          <p>
            Start with a reusable canonical Item identity so downstream design, pricing, supply and
            service all reference the same offering.
          </p>
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
  .rows a,
  .assessment-list article {
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
  .head,
  .assessment-list article div,
  .section-head {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .rows strong {
    font-size: 9.5px;
  }
  .rows span,
  .rows small,
  .assessment-list span,
  .assessment-list small {
    font-size: 8px;
    color: #718693;
  }
  .rows p,
  .assessment-list p {
    margin: 0;
  }
  .states {
    display: flex;
    gap: 5px;
  }
  .states span {
    padding: 4px 6px;
    border-radius: 999px;
    background: #eaf4f9;
    color: #35617d;
    font-size: 8px;
    font-weight: 800;
  }
  .description {
    font-size: 11px;
  }
  .facts {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    margin: 10px 0;
  }
  .facts span {
    display: grid;
    gap: 2px;
    padding: 7px;
    background: #f4f7f9;
    border-radius: 6px;
  }
  .facts small {
    font-size: 7.5px;
    color: #85949e;
  }
  .facts strong {
    font-size: 9px;
  }
  .panel {
    margin-top: 8px;
    padding: 10px;
    border: 1px solid #dfe7ec;
    border-radius: 8px;
  }
  .assessment-list {
    display: grid;
    gap: 6px;
    margin-top: 7px;
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
    .facts {
      grid-template-columns: 1fr;
    }
    .register {
      position: static;
    }
  }
</style>
