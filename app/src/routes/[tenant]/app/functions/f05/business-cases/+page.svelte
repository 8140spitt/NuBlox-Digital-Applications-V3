<script lang="ts">
  let { data, form } = $props();

  const href = (id: string) => {
    const q = new URLSearchParams({ domain: data.domain, mode: data.mode, case: id });
    return `/${data.tenantSlug}/app/functions/f05/business-cases?${q.toString()}`;
  };

  const heading = $derived(
    data.mode === 'innovation'
      ? 'Innovation management'
      : data.mode === 'portfolio'
        ? 'Portfolio strategy'
        : 'Business case development'
  );
  const area = $derived(
    data.mode === 'innovation' ? 'F05.10' : data.mode === 'portfolio' ? 'F05.01' : 'F05.04'
  );
</script>

<svelte:head><title>{heading} · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f05`}>F05 Product, Service & Innovation</a><span
      >›</span
    ><strong>{area} {heading}</strong>
  </nav>
  <header class="hero section-card">
    <div>
      <span class="eyebrow">{area} · AGG-04-BUSINESS-CASE</span>
      <h1>{heading}</h1>
      <p>
        {data.mode === 'innovation'
          ? 'Govern experiments, incubation and innovation funding around exact Business Case versions.'
          : data.mode === 'portfolio'
            ? 'Classify and prioritise offering investment through a governed portfolio of Product / Service Business Cases.'
            : 'Develop demand, benefit, cost, risk and ROI evidence before an immutable investment Decision.'}
      </p>
    </div>
    <div class="principle">
      <strong>Business Case ≠ Decision</strong><span
        >The case is versioned decision support; approval remains immutable shared Decision
        evidence.</span
      ><small
        >Finance and market sources are referenced inputs—not copied ledger or market truth.</small
      >
    </div>
  </header>
  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <span class="eyebrow"
        >{data.domain === 'INNOVATION' ? 'Innovation pipeline' : 'Offering portfolio'}</span
      >
      <h2>{data.cases.length} cases</h2>
      <nav class="rows">
        {#each data.cases as item}
          <a class:active={data.selected?.id === item.id} href={href(item.id)}>
            <div><strong>{item.caseRef}</strong><span>{item.status}</span></div>
            <p>{item.title}</p>
            <small>{item.portfolioBucket} · v{item.currentVersionNo}</small>
          </a>
        {:else}<p>No governed Business Cases.</p>{/each}
      </nav>

      {#if data.capabilities.canManage}
        <details class="command">
          <summary
            >Create {data.domain === 'INNOVATION' ? 'innovation' : 'product / service'} case</summary
          >
          <form method="POST" action="?/create">
            <input type="hidden" name="domain" value={data.domain} /><input
              type="hidden"
              name="mode"
              value={data.mode}
            />
            <div class="grid">
              <label>Case reference<input name="caseRef" required /></label><label
                >Portfolio bucket<input name="portfolioBucket" required /></label
              >
            </div>
            <label>Title<input name="title" required /></label>
            <div class="grid">
              <label
                >Item / concept<select name="itemId"
                  ><option value="">Portfolio-level / none</option>{#each data.items as item}<option
                      value={item.id}>{item.itemNumber} · {item.name}</option
                    >{/each}</select
                ></label
              ><label
                >Primary market insight<select name="primaryMarketInsightId"
                  ><option value="">None</option>{#each data.insights as insight}<option
                      value={insight.id}>{insight.insightRef} · {insight.title}</option
                    >{/each}</select
                ></label
              >
            </div>
            {#if data.domain === 'INNOVATION'}<label
                >Innovation stage<select name="innovationStage"
                  ><option>DISCOVERY</option><option>EXPERIMENT</option><option>INCUBATION</option
                  ><option>SCALE</option></select
                ></label
              >{/if}
            <label
              >Objectives / need<textarea name="objectivesNeed" rows="3" required></textarea></label
            >
            <div class="json-grid">
              <label>Options JSON<textarea name="options" rows="3">{'{}'}</textarea></label><label
                >Benefits JSON<textarea name="benefits" rows="3">{'{}'}</textarea></label
              >
              <label
                >Cost / funding basis JSON<textarea name="costFundingBasis" rows="3"
                  >{'{}'}</textarea
                ></label
              ><label>Risks JSON<textarea name="risks" rows="3">{'{}'}</textarea></label>
              <label>Assumptions JSON<textarea name="assumptions" rows="3">{'{}'}</textarea></label
              ><label
                >Demand forecast JSON<textarea name="demandForecast" rows="3">{'{}'}</textarea
                ></label
              >
              <label>ROI JSON<textarea name="roi" rows="3">{'{}'}</textarea></label><label
                >Market basis JSON<textarea name="marketBasis" rows="3">{'{}'}</textarea></label
              >
              <label
                >Product scope JSON<textarea name="productScope" rows="3">{'{}'}</textarea></label
              ><label
                >Funding envelope JSON<textarea name="fundingEnvelope" rows="3">{'{}'}</textarea
                ></label
              >
              <label
                >Commercial model JSON<textarea name="commercialModel" rows="3">{'{}'}</textarea
                ></label
              ><label
                >Route to market JSON<textarea name="routeToMarket" rows="3">{'{}'}</textarea
                ></label
              >
            </div>
            <label
              >Recommendation<textarea name="recommendation" rows="3" required></textarea></label
            >
            <button>Create governed Business Case</button>
          </form>
        </details>
      {/if}
    </aside>

    <main>
      {#if data.selected && data.currentVersion}
        <section class="section-card detail">
          <div class="head">
            <div>
              <span class="eyebrow">{data.selected.caseDomain}</span>
              <h2>{data.selected.caseRef} · {data.selected.title}</h2>
            </div>
            <div class="states">
              <span>{data.selected.status}</span><span>v{data.selected.currentVersionNo}</span>
            </div>
          </div>
          <div class="facts">
            <span><small>Portfolio</small><strong>{data.selected.portfolioBucket}</strong></span
            ><span
              ><small>Item</small><strong
                >{data.items.find((i) => i.id === data.selected?.itemId)?.itemNumber ??
                  'Portfolio-level'}</strong
              ></span
            ><span
              ><small>Market basis</small><strong
                >{data.selected.primaryMarketInsightId ? 'Linked' : 'None'}</strong
              ></span
            ><span
              ><small>Decision</small><strong
                >{data.selected.approvalDecisionId ? 'Bound' : 'Not decided'}</strong
              ></span
            ><span><small>Aggregate</small><strong>v{data.selected.aggregateVersion}</strong></span>
          </div>
          <section class="panel">
            <span class="eyebrow">Current case version</span>
            <p><strong>Need</strong> {data.currentVersion.objectivesNeed}</p>
            <p><strong>Recommendation</strong> {data.currentVersion.recommendation}</p>
          </section>
          <div class="evidence-grid">
            <article>
              <span>Demand</span>
              <pre>{JSON.stringify(data.currentVersion.demandForecast, null, 2)}</pre>
            </article>
            <article>
              <span>ROI</span>
              <pre>{JSON.stringify(data.currentVersion.roi, null, 2)}</pre>
            </article>
            <article>
              <span>Benefits</span>
              <pre>{JSON.stringify(data.currentVersion.benefits, null, 2)}</pre>
            </article>
            <article>
              <span>Risks</span>
              <pre>{JSON.stringify(data.currentVersion.risks, null, 2)}</pre>
            </article>
          </div>

          {#if data.capabilities.canManage && ['DRAFT', 'REWORK', 'REJECTED'].includes(data.selected.status)}
            <details class="command">
              <summary>Create successor case version</summary>
              <form method="POST" action="?/revise">
                <input type="hidden" name="businessCaseId" value={data.selected.id} /><input
                  type="hidden"
                  name="aggregateVersion"
                  value={data.selected.aggregateVersion}
                /><input type="hidden" name="domain" value={data.domain} /><input
                  type="hidden"
                  name="mode"
                  value={data.mode}
                />
                <div class="grid">
                  <label
                    >Portfolio bucket<input
                      name="portfolioBucket"
                      value={data.selected.portfolioBucket}
                    /></label
                  >{#if data.domain === 'INNOVATION'}<label
                      >Innovation stage<input
                        name="innovationStage"
                        value={data.selected.innovationStage ?? ''}
                      /></label
                    >{/if}
                </div>
                <label
                  >Objectives / need<textarea name="objectivesNeed" rows="3" required
                    >{data.currentVersion.objectivesNeed}</textarea
                  ></label
                >
                <div class="json-grid">
                  <label
                    >Options JSON<textarea name="options" rows="3"
                      >{JSON.stringify(data.currentVersion.options)}</textarea
                    ></label
                  ><label
                    >Benefits JSON<textarea name="benefits" rows="3"
                      >{JSON.stringify(data.currentVersion.benefits)}</textarea
                    ></label
                  ><label
                    >Cost basis JSON<textarea name="costFundingBasis" rows="3"
                      >{JSON.stringify(data.currentVersion.costFundingBasis)}</textarea
                    ></label
                  ><label
                    >Risks JSON<textarea name="risks" rows="3"
                      >{JSON.stringify(data.currentVersion.risks)}</textarea
                    ></label
                  ><label
                    >Assumptions JSON<textarea name="assumptions" rows="3"
                      >{JSON.stringify(data.currentVersion.assumptions)}</textarea
                    ></label
                  ><label
                    >Demand JSON<textarea name="demandForecast" rows="3"
                      >{JSON.stringify(data.currentVersion.demandForecast)}</textarea
                    ></label
                  ><label
                    >ROI JSON<textarea name="roi" rows="3"
                      >{JSON.stringify(data.currentVersion.roi)}</textarea
                    ></label
                  ><label
                    >Market basis JSON<textarea name="marketBasis" rows="3"
                      >{JSON.stringify(data.currentVersion.marketBasis)}</textarea
                    ></label
                  ><label
                    >Product scope JSON<textarea name="productScope" rows="3"
                      >{JSON.stringify(data.currentVersion.productScope)}</textarea
                    ></label
                  ><label
                    >Funding JSON<textarea name="fundingEnvelope" rows="3"
                      >{JSON.stringify(data.currentVersion.fundingEnvelope)}</textarea
                    ></label
                  ><label
                    >Commercial model JSON<textarea name="commercialModel" rows="3"
                      >{JSON.stringify(data.currentVersion.transactionStructure)}</textarea
                    ></label
                  ><label
                    >Route to market JSON<textarea name="routeToMarket" rows="3"
                      >{JSON.stringify(data.currentVersion.negotiatedTerms)}</textarea
                    ></label
                  >
                </div>
                <label
                  >Recommendation<textarea name="recommendation" rows="3" required
                    >{data.currentVersion.recommendation}</textarea
                  ></label
                ><button>Create successor version</button>
              </form>
            </details>
          {/if}

          <div class="decision-zone">
            {#if data.capabilities.canManage && data.selected.status === 'DRAFT'}
              <form method="POST" action="?/submit">
                <input type="hidden" name="businessCaseId" value={data.selected.id} /><input
                  type="hidden"
                  name="aggregateVersion"
                  value={data.selected.aggregateVersion}
                /><input type="hidden" name="domain" value={data.domain} /><input
                  type="hidden"
                  name="mode"
                  value={data.mode}
                /><button>Submit exact version for Decision</button>
              </form>
            {/if}
            {#if data.capabilities.canApprove && data.selected.status === 'DECISION_REQUIRED'}
              <form method="POST" action="?/decide" class="decision-form">
                <input type="hidden" name="businessCaseId" value={data.selected.id} /><input
                  type="hidden"
                  name="aggregateVersion"
                  value={data.selected.aggregateVersion}
                /><input
                  type="hidden"
                  name="currentVersionNo"
                  value={data.selected.currentVersionNo}
                /><input type="hidden" name="domain" value={data.domain} /><input
                  type="hidden"
                  name="mode"
                  value={data.mode}
                />
                <label
                  >Decision outcome<select name="outcome"
                    ><option>APPROVED</option><option>REWORK</option><option>REJECTED</option
                    ></select
                  ></label
                ><label>Decision reason<input name="reason" required /></label><button
                  >Record & apply Decision</button
                >
              </form>
            {/if}
          </div>

          {#if data.domain === 'INNOVATION'}
            <section class="innovation">
              <div class="section-head">
                <div>
                  <span class="eyebrow">Innovation experiments</span>
                  <h3>{data.experiments.length} experiments</h3>
                </div>
                <span>{data.funding.length} funding records</span>
              </div>
              <div class="experiment-list">
                {#each data.experiments as experiment}<article>
                    <div>
                      <strong>{experiment.experimentRef} · {experiment.title}</strong><span
                        >{experiment.status}{experiment.outcome
                          ? ' · ' + experiment.outcome
                          : ''}</span
                      >
                    </div>
                    <p>{experiment.hypothesis}</p>
                    {#if data.capabilities.canInnovate && experiment.status === 'PLANNED'}<form
                        method="POST"
                        action="?/startExperiment"
                      >
                        <input type="hidden" name="businessCaseId" value={data.selected.id} /><input
                          type="hidden"
                          name="experimentId"
                          value={experiment.id}
                        /><button>Start experiment</button>
                      </form>{/if}{#if data.capabilities.canInnovate && experiment.status === 'RUNNING'}<form
                        method="POST"
                        action="?/completeExperiment"
                      >
                        <input type="hidden" name="businessCaseId" value={data.selected.id} /><input
                          type="hidden"
                          name="experimentId"
                          value={experiment.id}
                        /><label
                          >Outcome<select name="outcome"
                            ><option>VALIDATED</option><option>INVALIDATED</option><option
                              >INCONCLUSIVE</option
                            ></select
                          ></label
                        ><label>Result<input name="resultSummary" required /></label><label
                          >Evidence<input name="evidenceReference" /></label
                        ><button>Complete experiment</button>
                      </form>{/if}
                  </article>{:else}<p>No experiments recorded.</p>{/each}
              </div>
              {#if data.capabilities.canInnovate}
                <div class="innovation-commands">
                  <details class="command">
                    <summary>Run experiment</summary>
                    <form method="POST" action="?/createExperiment">
                      <input type="hidden" name="businessCaseId" value={data.selected.id} /><input
                        type="hidden"
                        name="businessCaseVersionId"
                        value={data.currentVersion.id}
                      />
                      <div class="grid">
                        <label>Reference<input name="experimentRef" required /></label><label
                          >Title<input name="title" required /></label
                        >
                      </div>
                      <label
                        >Hypothesis<textarea name="hypothesis" rows="2" required></textarea></label
                      ><label>Method<textarea name="method" rows="2" required></textarea></label
                      ><label
                        >Success criteria<textarea name="successCriteria" rows="2" required
                        ></textarea></label
                      ><button>Create experiment</button>
                    </form>
                  </details>
                  <details class="command">
                    <summary>Record innovation funding</summary>
                    <form method="POST" action="?/fund">
                      <input type="hidden" name="businessCaseId" value={data.selected.id} /><input
                        type="hidden"
                        name="businessCaseVersionId"
                        value={data.currentVersion.id}
                      />
                      <div class="grid">
                        <label
                          >Funding type<input
                            name="fundingType"
                            value="EXPERIMENT"
                            required
                          /></label
                        ><label
                          >Amount<input
                            type="number"
                            step="any"
                            min="0"
                            name="amount"
                            required
                          /></label
                        >
                      </div>
                      <label
                        >Currency<select name="currencyId" required
                          ><option value="">Select currency</option
                          >{#each data.currencies.filter((c) => c.status === 'ACTIVE') as currency}<option
                              value={currency.id}>{currency.isoCode}</option
                            >{/each}</select
                        ></label
                      ><label>Basis<textarea name="basis" rows="2" required></textarea></label
                      ><label
                        >Status<select name="status"
                          ><option>PLANNED</option><option>ALLOCATED</option><option
                            >COMMITTED</option
                          ></select
                        ></label
                      ><button>Record funding evidence</button>
                    </form>
                  </details>
                </div>
              {/if}
            </section>
          {/if}
        </section>
      {:else}<section class="section-card empty-state">
          <h2>
            Create the first governed {data.domain === 'INNOVATION'
              ? 'Innovation'
              : 'Product / Service'} Business Case
          </h2>
          <p>
            Use a Business Case for decision support; the approval Decision remains a separate
            immutable authority record.
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
  h3 {
    margin: 2px 0;
    font-size: 14px;
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
  .head,
  .section-head,
  .experiment-list article > div {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .rows p {
    margin: 0;
  }
  .rows strong {
    font-size: 9.5px;
  }
  .rows span,
  .rows small {
    font-size: 8px;
    color: #718693;
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
  .facts {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
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
    padding: 10px;
    border: 1px solid #dfe7ec;
    border-radius: 8px;
  }
  .evidence-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 7px;
    margin-top: 8px;
  }
  .evidence-grid article {
    min-width: 0;
    padding: 8px;
    border: 1px solid #e1e8ec;
    border-radius: 7px;
    background: #fafcfd;
  }
  .evidence-grid span {
    font-size: 8px;
    font-weight: 850;
    color: #35617d;
  }
  .evidence-grid pre {
    overflow: auto;
    margin: 5px 0 0;
    font-size: 7.5px;
    color: #657986;
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
  .grid,
  .json-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .decision-zone {
    margin-top: 10px;
    padding: 9px;
    border: 1px solid #d8e6ee;
    border-radius: 8px;
    background: #f7fbfd;
  }
  .decision-zone form {
    margin: 0;
  }
  .decision-form {
    grid-template-columns: 180px 1fr auto;
    align-items: end;
  }
  .innovation {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #dce5ea;
  }
  .experiment-list {
    display: grid;
    gap: 6px;
    margin-top: 8px;
  }
  .experiment-list article {
    padding: 9px;
    border: 1px solid #e0e7eb;
    border-radius: 8px;
    background: #fbfcfd;
  }
  .experiment-list strong {
    font-size: 9px;
  }
  .experiment-list span {
    font-size: 8px;
    color: #647b8b;
  }
  .experiment-list form {
    padding: 7px;
    background: #fff;
    border-radius: 6px;
  }
  .innovation-commands {
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
  @media (max-width: 1050px) {
    .workspace,
    .hero,
    .facts,
    .evidence-grid,
    .grid,
    .json-grid,
    .decision-form,
    .innovation-commands {
      grid-template-columns: 1fr;
    }
    .register {
      position: static;
    }
  }
</style>
