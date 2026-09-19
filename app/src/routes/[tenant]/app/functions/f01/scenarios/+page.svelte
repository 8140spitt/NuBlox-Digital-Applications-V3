<script lang="ts">
  let { data, form } = $props();
  function href(id: string) {
    return `/${data.tenantSlug}/app/functions/f01/scenarios?scenario=${encodeURIComponent(id)}`;
  }
</script>

<svelte:head><title>Scenario & Foresight · NuBlox</title></svelte:head>
<div class="page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f01`}>F01 Strategy & Enterprise Planning</a><span
      >›</span
    ><strong>F01.08 Scenario & Foresight</strong>
  </nav>
  <header class="hero section-card">
    <div>
      <span class="eyebrow">F01.08 · AGG-02-SCENARIO</span>
      <h1>Scenario & foresight</h1>
      <p>
        Develop coherent possible futures with explicit drivers and exact assumption versions, test
        sensitivities and define contingencies without presenting scenarios as forecast truth.
      </p>
    </div>
    <div class="principle">
      <strong>Scenario ≠ forecast</strong><span
        >It is controlled planning context used to test resilience and choices.</span
      ><small
        >Older Scenario versions remain reconstructable after assumptions or conditions change.</small
      >
    </div>
  </header>
  {#if form?.message}<div class="message">{form.message}</div>{/if}
  <div class="workspace">
    <aside class="section-card register">
      <div>
        <span class="eyebrow">Scenario library</span>
        <h2>{data.scenarios.length} scenarios</h2>
      </div>
      <nav class="scenarios">
        {#each data.scenarios as s}<a class:active={data.selected?.id === s.id} href={href(s.id)}
            ><div>
              <strong>{s.scenarioRef}</strong><span class={'status ' + s.status.toLowerCase()}
                >{s.status}</span
              >
            </div>
            <p>{s.name}</p>
            <small>{s.scenarioType} · v{s.currentVersionNo}</small></a
          >{:else}<p class="empty">No scenarios yet.</p>{/each}
      </nav>
      {#if data.capabilities.canManage}<details class="command">
          <summary>Develop scenario</summary>
          <form method="POST" action="?/create">
            <label>Reference<input name="scenarioRef" required /></label><label
              >Name<input name="name" required /></label
            >
            <div class="grid">
              <label
                >Type<select name="scenarioType"
                  ><option>BASELINE</option><option>UPSIDE</option><option>DOWNSIDE</option><option
                    >STRESS</option
                  ><option>CUSTOM</option></select
                ></label
              ><label>Scope type<input name="scopeType" required value="TENANT" /></label><label
                >Scope ID<input name="scopeId" required /></label
              ><label>Horizon start<input name="horizonStart" type="date" required /></label><label
                >Horizon end<input name="horizonEnd" type="date" required /></label
              >
            </div>
            <label>Narrative<textarea name="narrative" rows="4" required></textarea></label><label
              >Drivers<textarea name="drivers" rows="6" required></textarea><small
                >KEY | Name | UP/DOWN/STABLE/VOLATILE/UNKNOWN | Base state | Rationale</small
              ></label
            ><label
              >Assumptions<select name="assumptions" multiple size="6" required
                >{#each data.assumptions as a}<option value={`${a.id}:${a.currentVersionNo}`}
                    >{a.assumptionRef} · v{a.currentVersionNo}</option
                  >{/each}</select
              ></label
            ><button>Create draft Scenario</button>
          </form>
        </details>{/if}
    </aside>
    <main class="main">
      {#if data.selected}
        <section class="section-card detail">
          <div class="head">
            <div>
              <span class="eyebrow">{data.selected.scenarioType}</span>
              <h2>{data.selected.scenarioRef} · {data.selected.name}</h2>
            </div>
            <span class={'status large ' + data.selected.status.toLowerCase()}
              >{data.selected.status}</span
            >
          </div>
          <blockquote>{data.selected.narrative}</blockquote>
          <div class="facts">
            <span><small>Version</small><strong>v{data.selected.currentVersionNo}</strong></span
            ><span><small>Aggregate</small><strong>v{data.selected.aggregateVersion}</strong></span
            ><span><small>Drivers</small><strong>{data.driverRows.length}</strong></span><span
              ><small>Assumptions</small><strong>{data.assumptionRefs.length}</strong></span
            >
          </div>
          <div class="drivers">
            {#each data.driverRows as d}<article>
                <div><strong>{d.name}</strong><span>{d.direction}</span></div>
                <p>{d.baseState}</p>
                <small>{d.rationale}</small>
              </article>{/each}
          </div>
          {#if data.capabilities.canApprove}<form
              method="POST"
              action="?/transition"
              class="actions"
            >
              <input type="hidden" name="scenarioId" value={data.selected.id} /><input
                type="hidden"
                name="aggregateVersion"
                value={data.selected.aggregateVersion}
              />{#if data.selected.status === 'DRAFT'}<button name="action" value="REVIEW"
                  >Mark reviewed</button
                >{/if}{#if data.selected.status === 'REVIEWED'}<button name="action" value="APPROVE"
                  >Approve</button
                >{/if}{#if data.selected.status === 'APPROVED'}<button
                  name="action"
                  value="ACTIVATE">Activate</button
                >{/if}{#if data.selected.status === 'ACTIVE'}<button name="action" value="SUPERSEDE"
                  >Supersede</button
                >{/if}{#if ['APPROVED', 'ACTIVE', 'SUPERSEDED'].includes(data.selected.status)}<button
                  class="quiet"
                  name="action"
                  value="RETIRE">Retire</button
                >{/if}
            </form>{/if}
        </section>
        <div class="two">
          <section class="section-card panel">
            <span class="eyebrow">Sensitivity analysis</span>
            <h2>{data.sensitivityRuns.length} runs</h2>
            {#if data.capabilities.canManage}<details class="command">
                <summary>Run sensitivity</summary>
                <form method="POST" action="?/sensitivity">
                  <input type="hidden" name="scenarioId" value={data.selected.id} /><label
                    >Variable key<input name="variableKey" required /></label
                  >
                  <div class="grid">
                    <label>Low<input name="lowCase" type="number" step="any" /></label><label
                      >Base<input name="baseCase" type="number" step="any" /></label
                    ><label>High<input name="highCase" type="number" step="any" /></label>
                  </div>
                  <label
                    >Result summary<textarea name="resultSummary" rows="3" required
                    ></textarea></label
                  ><button>Record sensitivity analysis</button>
                </form>
              </details>{/if}
            <div class="rows">
              {#each data.sensitivityRuns as r}<article>
                  <div><strong>{r.variableKey}</strong><span>v{r.scenarioVersionNo}</span></div>
                  <p>{r.resultSummary}</p>
                  <small
                    >Low {r.lowCase ?? '—'} · Base {r.baseCase ?? '—'} · High {r.highCase ??
                      '—'}</small
                  >
                </article>{/each}
            </div>
          </section>
          <section class="section-card panel">
            <span class="eyebrow">Contingency strategies</span>
            <h2>{data.contingencies.length} contingencies</h2>
            {#if data.capabilities.canManage}<details class="command">
                <summary>Add contingency</summary>
                <form method="POST" action="?/contingency">
                  <input type="hidden" name="scenarioId" value={data.selected.id} /><label
                    >Reference<input name="contingencyRef" required /></label
                  ><label
                    >Trigger condition<textarea name="triggerCondition" rows="3" required
                    ></textarea></label
                  ><label
                    >Response strategy<textarea name="responseStrategy" rows="3" required
                    ></textarea></label
                  ><button>Create contingency</button>
                </form>
              </details>{/if}
            <div class="rows">
              {#each data.contingencies as c}<article>
                  <div><strong>{c.contingencyRef}</strong><span>{c.status}</span></div>
                  <p>{c.triggerCondition}</p>
                  <small>{c.responseStrategy}</small>
                </article>{/each}
            </div>
          </section>
        </div>
        <section class="section-card panel">
          <span class="eyebrow">Immutable versions</span>
          <h2>{data.versions.length} Scenario versions</h2>
          <div class="rows">
            {#each data.versions as v}<article>
                <div>
                  <strong>v{v.versionNo}</strong><span
                    class={'status ' + v.lifecycleStatus.toLowerCase()}>{v.lifecycleStatus}</span
                  >
                </div>
                <p>{v.narrative}</p>
              </article>{/each}
          </div>
        </section>
      {:else}<section class="section-card empty-state">
          <h2>Create the first Scenario</h2>
          <p>
            Accept at least one governed Strategic Assumption, then construct a controlled possible
            future here.
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
  .workspace {
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
  .scenarios,
  .rows,
  .drivers {
    display: grid;
    gap: 6px;
    margin-top: 10px;
  }
  .scenarios a,
  .rows article,
  .drivers article {
    display: grid;
    gap: 5px;
    padding: 9px;
    border: 1px solid #e0e7ec;
    border-radius: 8px;
    background: #fafcfd;
    color: inherit;
    text-decoration: none;
  }
  .scenarios a.active {
    border-color: #79bde2;
    background: #edf8fe;
    box-shadow: inset 3px 0 var(--blue-700);
  }
  .scenarios a > div,
  .head,
  .rows article > div,
  .drivers article > div {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .scenarios strong {
    font-size: 9.5px;
    color: #315b75;
  }
  .scenarios p,
  .rows p,
  .drivers p {
    margin: 0;
  }
  .scenarios small,
  .rows small,
  .drivers small {
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
  .status.approved,
  .status.reviewed {
    background: #e6f5e9;
    color: #2b6c39;
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
  label small {
    font-weight: 400;
    color: #81909a;
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
  .grid,
  .two {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
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
  button.quiet {
    background: white;
    color: #4e697b;
    border: 1px solid #d5e0e6;
  }
  .main {
    display: grid;
    gap: 12px;
    min-width: 0;
  }
  .detail,
  .panel {
    padding: 14px;
  }
  blockquote {
    margin: 12px 0;
    padding: 10px 12px;
    border-left: 3px solid #79bde2;
    background: #f8fbfd;
    color: #314f62;
    font-size: 12px;
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 10px 0;
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
  .actions {
    display: flex;
    gap: 6px;
  }
  .actions input {
    display: none;
  }
  .empty,
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
