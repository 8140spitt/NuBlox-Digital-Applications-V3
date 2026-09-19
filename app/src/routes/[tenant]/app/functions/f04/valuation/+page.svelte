<script lang="ts">
  let { data, form } = $props();
  function href(id: string) {
    return `/${data.tenantSlug}/app/functions/f04/valuation?appraisal=${encodeURIComponent(id)}`;
  }
  function pretty(value: unknown) {
    return JSON.stringify(value ?? {}, null, 2);
  }
</script>

<svelte:head><title>Valuation · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f04`}>F04 Corporate Development & M&A</a><span
      >›</span
    ><strong>F04.02 Valuation</strong>
  </nav>
  <header class="hero section-card">
    <div>
      <span class="eyebrow">F04.02 · LDI-DEVELOPMENT-APPRAISAL</span>
      <h1>Valuation</h1>
      <p>
        Build governed transaction appraisal scenarios from exact source, synergy, valuation and
        sensitivity assumptions.
      </p>
    </div>
    <div class="principle">
      <strong>Appraisal ≠ ledger truth</strong><span>The appraisal is decision support.</span><small
        >Approved snapshots freeze the assumptions and metrics used at that point in the deal; new
        information creates a successor appraisal.</small
      >
    </div>
  </header>
  {#if form?.message}<div class="message">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <span class="eyebrow">Appraisal register</span>
      <h2>{data.appraisals.length} scenarios</h2>
      <nav class="rows">
        {#each data.appraisals as item}<a
            class:active={data.selected?.id === item.id}
            href={href(item.id)}
            ><div><strong>{item.appraisalRef}</strong><span>{item.status}</span></div>
            <p>{item.scenarioName}</p>
            <small>{new Date(item.asOfAt).toLocaleString('en-GB')}</small></a
          >{:else}<p class="empty">No appraisals.</p>{/each}
      </nav>
      {#if data.canManage}
        <details class="command">
          <summary>Create appraisal scenario</summary>
          <form method="POST" action="?/create">
            <label
              >Opportunity<select name="opportunityId" required
                ><option value="">Select active opportunity</option
                >{#each data.opportunities.filter((o) => !['REJECTED', 'CONVERTED_CLOSED'].includes(o.status)) as opportunity}<option
                    value={opportunity.id}
                    >{opportunity.opportunityRef} · {opportunity.title}</option
                  >{/each}</select
              ></label
            >
            <div class="grid">
              <label>Reference<input name="appraisalRef" required /></label><label
                >Scenario<input name="scenarioName" required value="Base case" /></label
              >
            </div>
            <label>As-of time<input name="asOfAt" type="datetime-local" /></label>
            <label
              >Supersedes approved appraisal<select name="supersedesAppraisalId"
                ><option value="">None</option
                >{#each data.appraisals.filter((a) => a.status === 'APPROVED_SNAPSHOT') as appraisal}<option
                    value={appraisal.id}>{appraisal.appraisalRef} · {appraisal.scenarioName}</option
                  >{/each}</select
              ></label
            >
            <label
              >Source basis JSON<textarea name="sourceBasis" rows="4" required
                >{'{"managementAccounts":"evidence://...","forecast":"evidence://..."}'}</textarea
              ></label
            >
            <label
              >Assumptions JSON<textarea name="assumptions" rows="5" required
                >{'{"purchasePrice":0,"discountRatePercent":0}'}</textarea
              ></label
            >
            <label
              >Synergy assumptions JSON<textarea name="synergyAssumptions" rows="4"
                >{'{"annualRunRate":0,"realisationYears":0}'}</textarea
              ></label
            >
            <label
              >Valuation metrics JSON<textarea name="valuationMetrics" rows="5" required
                >{'{"enterpriseValue":0,"equityValue":0,"irrPercent":0}'}</textarea
              ></label
            >
            <label
              >Sensitivity JSON<textarea name="sensitivity" rows="4"
                >{'{"downside":{},"upside":{}}'}</textarea
              ></label
            >
            <button>Create working appraisal</button>
          </form>
        </details>
      {/if}
    </aside>

    <main>
      {#if data.selected}
        <section class="section-card detail">
          <div class="head">
            <div>
              <span class="eyebrow">{data.selected.scenarioName}</span>
              <h2>{data.selected.appraisalRef}</h2>
            </div>
            <span class="status">{data.selected.status}</span>
          </div>
          <div class="facts">
            <span><small>Aggregate</small><strong>v{data.selected.aggregateVersion}</strong></span
            ><span
              ><small>Opportunity</small><strong
                >{data.opportunities.find((o) => o.id === data.selected?.opportunityId)
                  ?.opportunityRef ?? '—'}</strong
              ></span
            ><span
              ><small>As-of</small><strong
                >{new Date(data.selected.asOfAt).toLocaleDateString('en-GB')}</strong
              ></span
            ><span
              ><small>Supersedes</small><strong>{data.selected.supersedesAppraisalId ?? '—'}</strong
              ></span
            >
          </div>
          <div class="two">
            <section>
              <span class="eyebrow">Source & assumptions</span>
              <pre>{pretty(data.selected.sourceBasis)}</pre>
              <pre>{pretty(data.selected.assumptions)}</pre>
            </section>
            <section>
              <span class="eyebrow">Valuation & sensitivity</span>
              <pre>{pretty(data.selected.valuationMetrics)}</pre>
              <pre>{pretty(data.selected.sensitivity)}</pre>
            </section>
          </div>
          <section class="synergy">
            <span class="eyebrow">Synergy assumptions</span>
            <pre>{pretty(data.selected.synergyAssumptions)}</pre>
          </section>

          {#if data.canManage && data.selected.status === 'WORKING'}<form
              method="POST"
              action="?/review"
              class="actions"
            >
              <input type="hidden" name="appraisalId" value={data.selected.id} /><input
                type="hidden"
                name="aggregateVersion"
                value={data.selected.aggregateVersion}
              /><button>Mark appraisal reviewed</button>
            </form>{/if}
          {#if data.canManage && data.selected.status === 'REVIEWED'}<form
              method="POST"
              action="?/approve"
              class="actions"
            >
              <input type="hidden" name="appraisalId" value={data.selected.id} /><input
                type="hidden"
                name="aggregateVersion"
                value={data.selected.aggregateVersion}
              /><button>Freeze approved snapshot</button>
            </form>{/if}
        </section>
      {:else}<section class="section-card empty-state">
          <h2>Create the first appraisal scenario</h2>
          <p>
            Every scenario retains its exact source basis, assumptions, synergies, valuation metrics
            and sensitivity.
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
    overflow-wrap: anywhere;
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .two section,
  .synergy {
    padding: 10px;
    border: 1px solid #dfe7ec;
    border-radius: 8px;
  }
  .synergy {
    margin-top: 8px;
  }
  pre {
    margin: 7px 0 0;
    padding: 8px;
    background: #f5f7f8;
    border-radius: 6px;
    white-space: pre-wrap;
    font-size: 8px;
    overflow-wrap: anywhere;
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
  .actions {
    margin-top: 12px;
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
    .facts,
    .two {
      grid-template-columns: 1fr;
    }
    .register {
      position: static;
    }
  }
</style>
