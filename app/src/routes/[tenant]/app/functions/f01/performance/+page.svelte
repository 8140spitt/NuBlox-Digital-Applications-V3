<script lang="ts">
  let { data, form } = $props();
  function href(id: string) {
    return `/${data.tenantSlug}/app/functions/f01/performance?kpi=${encodeURIComponent(id)}`;
  }
</script>

<svelte:head><title>Strategic Performance · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f01`}>F01 Strategy & Enterprise Planning</a><span
      >›</span
    ><strong>F01.06 Performance</strong>
  </nav>
  <header class="hero section-card">
    <div>
      <span class="eyebrow">F01.06 · AGG-02-PERFORMANCE</span>
      <h1>Strategic performance</h1>
      <p>
        Govern KPI meaning, targets, baselines and immutable observations separately, then analyse
        variance and create corrective work without corrupting source evidence.
      </p>
    </div>
    <div class="principle">
      <strong>Definition ≠ target ≠ observation</strong><span
        >Each semantic layer has its own identity and lifecycle.</span
      ><small>Dashboards and variance are projections over pinned governed inputs.</small>
    </div>
  </header>
  {#if form?.message}<div class="message">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <div>
        <span class="eyebrow">KPI register</span>
        <h2>{data.kpis.length} definitions</h2>
      </div>
      <nav class="kpis">
        {#each data.kpis as item}<a
            class:active={data.selected?.id === item.id}
            href={href(item.id)}
            ><div>
              <strong>{item.kpiCode}</strong><span class={'status ' + item.status.toLowerCase()}
                >{item.status}</span
              >
            </div>
            <p>{item.name}</p>
            <small>{item.frequency} · v{item.currentVersionNo}</small></a
          >{:else}<p class="empty">No KPI definitions.</p>{/each}
      </nav>
      {#if data.capabilities.canManage}<details class="command">
          <summary>Define KPI</summary>
          <form method="POST" action="?/createKpi">
            <label>Code<input name="kpiCode" required placeholder="KPI-ON-TIME" /></label><label
              >Name<input name="name" required /></label
            >
            <label
              >Business definition<textarea name="businessDefinition" rows="3" required
              ></textarea></label
            ><label>Formula<textarea name="formula" rows="2" required></textarea></label>
            <label
              >Unit<select name="unitOfMeasureId" required
                ><option value="">Select unit</option>{#each data.units as u}<option value={u.id}
                    >{u.unitCode} · {u.name}</option
                  >{/each}</select
              ></label
            >
            <label>Frequency<input name="frequency" required placeholder="MONTHLY" /></label><label
              >Dimensions<input name="dimensions" placeholder="PROJECT, REGION" /></label
            >
            <label>Source data<textarea name="sourceData" rows="2" required></textarea></label
            ><label>Quality rules<textarea name="qualityRules" rows="2" required></textarea></label>
            <label
              >Objectives<select name="objectives" multiple size="5" required
                >{#each data.objectives as o}<option value={`${o.id}:${o.currentVersionNo}`}
                    >{o.objectiveRef} · v{o.currentVersionNo}</option
                  >{/each}</select
              ></label
            >
            <button>Create draft KPI</button>
          </form>
        </details>{/if}
    </aside>

    <main class="main">
      {#if data.selected}
        <section class="section-card detail">
          <div class="head">
            <div>
              <span class="eyebrow">{data.selected.frequency}</span>
              <h2>{data.selected.kpiCode} · {data.selected.name}</h2>
            </div>
            <span class={'status large ' + data.selected.status.toLowerCase()}
              >{data.selected.status}</span
            >
          </div>
          <blockquote>{data.selected.businessDefinition}</blockquote>
          <div class="facts">
            <span><small>Version</small><strong>v{data.selected.currentVersionNo}</strong></span
            ><span><small>Objectives</small><strong>{data.objectiveRefs.length}</strong></span><span
              ><small>Targets</small><strong>{data.targets.length}</strong></span
            ><span><small>Observations</small><strong>{data.observations.length}</strong></span>
          </div>
          <div class="cards">
            <article>
              <span class="eyebrow">Formula</span>
              <p>{data.selected.formula}</p>
            </article>
            <article>
              <span class="eyebrow">Source data</span>
              <p>{data.selected.sourceData}</p>
            </article>
            <article>
              <span class="eyebrow">Quality rules</span>
              <p>{data.selected.qualityRules}</p>
            </article>
            <article>
              <span class="eyebrow">Dimensions</span>
              <p>{data.selected.dimensions.join(', ') || 'None'}</p>
            </article>
          </div>
          {#if data.capabilities.canManage}<form
              method="POST"
              action="?/kpiTransition"
              class="actions"
            >
              <input type="hidden" name="kpiId" value={data.selected.id} /><input
                type="hidden"
                name="aggregateVersion"
                value={data.selected.aggregateVersion}
              />{#if data.selected.status === 'DRAFT'}<button name="action" value="VALIDATE"
                  >Validate definition</button
                >{/if}{#if data.selected.status === 'VALIDATED'}<button
                  name="action"
                  value="PUBLISH">Publish definition</button
                >{/if}{#if data.selected.status === 'PUBLISHED'}<button
                  name="action"
                  value="ACTIVATE">Make effective</button
                >{/if}
            </form>{/if}
        </section>

        <div class="two">
          <section class="section-card panel">
            <span class="eyebrow">Targets</span>
            <h2>Expected performance</h2>
            {#if data.capabilities.canManage && data.selected.status === 'EFFECTIVE'}<details
                class="command"
              >
                <summary>Set target</summary>
                <form method="POST" action="?/createTarget">
                  <input type="hidden" name="kpiId" value={data.selected.id} /><input
                    type="hidden"
                    name="kpiVersionNo"
                    value={data.selected.currentVersionNo}
                  /><label>Reference<input name="targetRef" required /></label>
                  <div class="grid">
                    <label>Scope type<input name="scopeType" required value="TENANT" /></label
                    ><label>Scope ID<input name="scopeId" required /></label><label
                      >Period start<input name="periodStart" type="date" required /></label
                    ><label>Period end<input name="periodEnd" type="date" required /></label><label
                      >Target value<input
                        name="targetValue"
                        type="number"
                        step="any"
                        required
                      /></label
                    ><label
                      >Comparison<select name="comparisonOperator"
                        ><option value="GREATER_EQUAL">≥ target</option><option value="LESS_EQUAL"
                          >≤ target</option
                        ><option value="EQUAL">= target</option></select
                      ></label
                    >
                  </div>
                  <button>Create proposed target</button>
                </form>
              </details>{/if}
            <div class="rows">
              {#each data.targets as t}<article>
                  <div>
                    <strong>{t.targetRef}</strong><span class={'status ' + t.status.toLowerCase()}
                      >{t.status}</span
                    >
                  </div>
                  <p>{t.comparisonOperator} {Number(t.targetValue)}</p>
                  {#if data.capabilities.canManage}<form method="POST" action="?/targetTransition">
                      <input type="hidden" name="kpiId" value={data.selected.id} /><input
                        type="hidden"
                        name="targetId"
                        value={t.id}
                      /><input
                        type="hidden"
                        name="aggregateVersion"
                        value={t.aggregateVersion}
                      />{#if t.status === 'PROPOSED'}<button name="action" value="APPROVE"
                          >Approve</button
                        >{/if}{#if t.status === 'APPROVED'}<button name="action" value="ACTIVATE"
                          >Activate</button
                        >{/if}
                    </form>{/if}
                </article>{/each}
            </div>
          </section>

          <section class="section-card panel">
            <span class="eyebrow">Observations</span>
            <h2>Performance evidence</h2>
            {#if data.capabilities.canObserve && data.selected.status === 'EFFECTIVE'}<details
                class="command"
              >
                <summary>Record observation</summary>
                <form method="POST" action="?/observe">
                  <input type="hidden" name="kpiId" value={data.selected.id} /><input
                    type="hidden"
                    name="kpiVersionNo"
                    value={data.selected.currentVersionNo}
                  />
                  <div class="grid">
                    <label>Subject type<input name="subjectType" required value="TENANT" /></label
                    ><label>Subject ID<input name="subjectId" required /></label><label
                      >Period start<input name="periodStart" type="date" required /></label
                    ><label>Period end<input name="periodEnd" type="date" required /></label><label
                      >Value<input name="numericValue" type="number" step="any" required /></label
                    >
                  </div>
                  <label>Source reference<input name="sourceReference" required /></label><button
                    >Record immutable observation</button
                  >
                </form>
              </details>{/if}
            <div class="rows">
              {#each data.observations as o}<article>
                  <div>
                    <strong>{Number(o.numericValue)}</strong><span
                      class={'status ' + o.qualityStatus.toLowerCase()}>{o.qualityStatus}</span
                    >
                  </div>
                  <p>{o.sourceReference}</p>
                  {#if data.capabilities.canObserve && o.qualityStatus === 'RECORDED'}<form
                      method="POST"
                      action="?/validateObservation"
                    >
                      <input type="hidden" name="kpiId" value={data.selected.id} /><input
                        type="hidden"
                        name="observationId"
                        value={o.id}
                      /><button>Validate</button>
                    </form>{/if}{#if data.capabilities.canManage && o.qualityStatus === 'VALIDATED'}<form
                      method="POST"
                      action="?/baseline"
                    >
                      <input type="hidden" name="kpiId" value={data.selected.id} /><input
                        type="hidden"
                        name="observationId"
                        value={o.id}
                      /><input name="baselineRef" required placeholder="Baseline ref" /><input
                        name="scopeType"
                        required
                        value={o.subjectType}
                      /><input name="scopeId" required value={o.subjectId} /><button
                        >Create baseline</button
                      >
                    </form>{/if}
                </article>{/each}
            </div>
          </section>
        </div>

        <section class="section-card panel">
          <span class="eyebrow">Variance & corrective action</span>
          <h2>Performance intervention</h2>
          <form method="GET" class="variance-form">
            <input type="hidden" name="kpi" value={data.selected.id} /><input
              name="scopeType"
              value="TENANT"
              placeholder="Scope type"
            /><input name="scopeId" placeholder="Scope ID" required /><input
              name="periodStart"
              type="date"
              required
            /><input name="periodEnd" type="date" required /><button>Analyse variance</button>
          </form>
          {#if data.variance}<div class="variance">
              <span
                ><small>Actual</small><strong
                  >{data.variance.observation
                    ? Number(data.variance.observation.numericValue)
                    : '—'}</strong
                ></span
              ><span
                ><small>Target</small><strong
                  >{data.variance.target ? Number(data.variance.target.targetValue) : '—'}</strong
                ></span
              ><span><small>Delta</small><strong>{data.variance.delta ?? '—'}</strong></span><span
                ><small>Status</small><strong
                  >{data.variance.onTarget === null
                    ? 'Incomplete'
                    : data.variance.onTarget
                      ? 'On target'
                      : 'Intervention required'}</strong
                ></span
              >
            </div>{/if}
          {#if data.capabilities.canManage && data.selected.status === 'EFFECTIVE'}<details
              class="command"
            >
              <summary>Create corrective action</summary>
              <form method="POST" action="?/corrective">
                <input type="hidden" name="kpiId" value={data.selected.id} /><input
                  type="hidden"
                  name="kpiVersionNo"
                  value={data.selected.currentVersionNo}
                /><label>Title<input name="title" required /></label><label
                  >Instructions<textarea name="instructions" rows="3" required></textarea></label
                >
                <div class="grid">
                  <label
                    >Priority<select name="priority"
                      ><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select
                    ></label
                  ><label>Due date<input name="dueAt" type="date" /></label>
                </div>
                <button>Create shared work item</button>
              </form>
            </details>{/if}
        </section>
      {:else}<section class="section-card empty-state">
          <h2>Define the first strategic KPI</h2>
          <p>Activate a Strategic Objective and configure a governed Unit of Measure first.</p>
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
    grid-template-columns: 320px minmax(0, 1fr);
    gap: 12px;
    align-items: start;
  }
  .register {
    position: sticky;
    top: 78px;
    padding: 12px;
  }
  .kpis {
    display: grid;
    gap: 6px;
    margin-top: 10px;
  }
  .kpis a {
    display: grid;
    gap: 5px;
    padding: 9px;
    border: 1px solid #e0e7ec;
    border-radius: 8px;
    background: #fafcfd;
    color: inherit;
    text-decoration: none;
  }
  .kpis a.active {
    border-color: #79bde2;
    background: #edf8fe;
    box-shadow: inset 3px 0 var(--blue-700);
  }
  .kpis a > div,
  .head,
  .rows article > div {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .kpis strong {
    font-size: 9.5px;
    color: #315b75;
  }
  .kpis p {
    margin: 0;
  }
  .kpis small {
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
  .status.effective,
  .status.active,
  .status.validated,
  .status.approved {
    background: #e6f5e9;
    color: #2b6c39;
  }
  .status.published,
  .status.proposed,
  .status.recorded {
    background: #fff3d9;
    color: #805d19;
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
  .cards,
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
  .facts,
  .variance {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 10px 0;
  }
  .facts span,
  .variance span {
    display: grid;
    gap: 2px;
    min-width: 110px;
    padding: 6px 8px;
    border-radius: 6px;
    background: #f4f7f9;
  }
  .facts small,
  .variance small {
    color: #86959f;
    font-size: 7.5px;
    text-transform: uppercase;
  }
  .facts strong,
  .variance strong {
    color: #405d70;
    font-size: 9px;
  }
  .cards article {
    padding: 10px;
    border: 1px solid #e3e9ed;
    border-radius: 8px;
    background: #fafcfd;
  }
  .cards p {
    margin: 4px 0 0;
  }
  .actions {
    display: flex;
    gap: 6px;
  }
  .actions input {
    display: none;
  }
  .rows {
    display: grid;
    gap: 7px;
    margin-top: 10px;
  }
  .rows article {
    padding: 8px;
    border: 1px solid #e1e8ec;
    border-radius: 8px;
    background: #fafcfd;
  }
  .rows p {
    margin: 4px 0;
  }
  .rows form {
    display: flex;
    gap: 5px;
    align-items: end;
  }
  .variance-form {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    align-items: end;
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
  @media (max-width: 900px) {
    .hero,
    .workspace,
    .grid,
    .cards,
    .two,
    .variance-form {
      grid-template-columns: 1fr;
    }
    .register {
      position: static;
    }
  }
</style>
