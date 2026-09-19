<script lang="ts">
  let { data, form } = $props();
  const types = [
    { key: 'TRANSACTION', label: 'Transaction Management', id: 'F04.04' },
    { key: 'DIVESTITURE', label: 'Divestiture', id: 'F04.06' },
    { key: 'STRATEGIC_PARTNERSHIP', label: 'Strategic Partnerships', id: 'F04.07' }
  ];
  function href(id: string, type = data.requestedType) {
    const params = new URLSearchParams();
    if (id) params.set('case', id);
    if (type) params.set('type', type);
    return `/${data.tenantSlug}/app/functions/f04/business-cases?${params.toString()}`;
  }
  function typeHref(type: string) {
    return `/${data.tenantSlug}/app/functions/f04/business-cases?type=${encodeURIComponent(type)}`;
  }
  function pretty(value: unknown) {
    return JSON.stringify(value ?? {}, null, 2);
  }
  const currentVersion = $derived(data.versions[0] ?? null);
  const selectedType = $derived(data.selected?.caseType ?? data.requestedType ?? 'TRANSACTION');
  const canCreateSelected = $derived(
    selectedType === 'DIVESTITURE'
      ? data.capabilities.canDivestiture
      : selectedType === 'STRATEGIC_PARTNERSHIP'
        ? data.capabilities.canPartnership
        : data.capabilities.canTransaction
  );
</script>

<svelte:head><title>Corporate Development Business Cases · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f04`}>F04 Corporate Development & M&A</a><span
      >›</span
    ><strong>Business Case workbench</strong>
  </nav>
  <header class="hero section-card">
    <div>
      <span class="eyebrow">F04.04 / F04.06 / F04.07 · AGG-04-BUSINESS-CASE</span>
      <h1>Corporate Development business cases</h1>
      <p>
        Structure transactions, divestitures and strategic partnerships through one governed,
        versioned decision-support case.
      </p>
    </div>
    <div class="principle">
      <strong>Business Case ≠ Decision</strong><span
        >The case presents evidence and recommendation.</span
      ><small
        >Approval is a separate immutable Decision against the exact Business Case version; source
        appraisal and Legal Matter evidence remain authoritative.</small
      >
    </div>
  </header>
  <nav class="tabs">
    {#each types as type}<a
        class:active={data.requestedType === type.key ||
          (!data.requestedType && type.key === 'TRANSACTION')}
        href={typeHref(type.key)}><small>{type.id}</small><strong>{type.label}</strong></a
      >{/each}
  </nav>
  {#if form?.message}<div class="message">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <span class="eyebrow"
        >{types.find((t) => t.key === selectedType)?.label ?? 'Business Case'} register</span
      >
      <h2>{data.cases.length} cases</h2>
      <nav class="rows">
        {#each data.cases as item}<a
            class:active={data.selected?.id === item.id}
            href={href(item.id, item.caseType)}
            ><div><strong>{item.caseRef}</strong><span>{item.status}</span></div>
            <p>{item.title}</p>
            <small>{item.caseType} · v{item.currentVersionNo}</small></a
          >{:else}<p class="empty">No cases in this view.</p>{/each}
      </nav>
      {#if canCreateSelected}
        <details class="command">
          <summary
            >Create {types.find((t) => t.key === selectedType)?.label ?? 'Business Case'}</summary
          >
          <form method="POST" action="?/create">
            <input type="hidden" name="caseType" value={selectedType} />
            <div class="grid">
              <label>Reference<input name="caseRef" required /></label><label
                >Sponsor Party ID<input
                  name="sponsorPartyId"
                  placeholder="Defaults to current actor"
                /></label
              >
            </div>
            <label>Title<input name="title" required /></label>
            <label
              >Primary counterparty<select name="primaryPartyId"
                ><option value="">None</option
                >{#each data.organisations.filter((o) => o.status === 'ACTIVE') as organisation}<option
                    value={organisation.id}>{organisation.name}</option
                  >{/each}</select
              ></label
            >
            <label
              >Development opportunity<select name="developmentOpportunityId"
                ><option value="">None</option>{#each data.opportunities as opportunity}<option
                    value={opportunity.id}
                    >{opportunity.opportunityRef} · {opportunity.title}</option
                  >{/each}</select
              ></label
            >
            <label
              >Approved appraisal<select name="appraisalId"
                ><option value="">None</option
                >{#each data.appraisals.filter((a) => a.status === 'APPROVED_SNAPSHOT') as appraisal}<option
                    value={appraisal.id}>{appraisal.appraisalRef} · {appraisal.scenarioName}</option
                  >{/each}</select
              ></label
            >
            <label
              >Due Diligence matter<select name="legalMatterId"
                ><option value="">None</option
                >{#each data.matters.filter( (m) => ['RESOLVED', 'CLOSED'].includes(m.status) ) as matter}<option
                    value={matter.id}>{matter.matterRef} · {matter.title}</option
                  >{/each}</select
              ></label
            >
            <label
              >Objectives / need<textarea name="objectivesNeed" rows="4" required></textarea></label
            >
            <label
              >Options JSON<textarea name="options" rows="4" required
                >{'{"options":[],"preferred":""}'}</textarea
              ></label
            >
            <label
              >Benefits JSON<textarea name="benefits" rows="4" required
                >{'{"strategic":[],"financial":[]}'}</textarea
              ></label
            >
            <label
              >Cost / funding basis JSON<textarea name="costFundingBasis" rows="4" required
                >{'{}'}</textarea
              ></label
            >
            <label
              >Risks JSON<textarea name="risks" rows="4" required>{'{"principal":[]}'}</textarea
              ></label
            >
            <label
              >Assumptions JSON<textarea name="assumptions" rows="4" required>{'{}'}</textarea
              ></label
            >
            <label
              >Transaction structure JSON<textarea name="transactionStructure" rows="4"
                >{'{}'}</textarea
              ></label
            >
            <label
              >Negotiated terms JSON<textarea name="negotiatedTerms" rows="4">{'{}'}</textarea
              ></label
            >
            <label
              >Recommendation<textarea name="recommendation" rows="4" required></textarea></label
            >
            <button>Create governed Business Case</button>
          </form>
        </details>
      {/if}
    </aside>

    <main>
      {#if data.selected && currentVersion}
        <section class="section-card detail">
          <div class="head">
            <div>
              <span class="eyebrow">{data.selected.caseType}</span>
              <h2>{data.selected.caseRef} · {data.selected.title}</h2>
            </div>
            <span class="status">{data.selected.status}</span>
          </div>
          <div class="facts">
            <span><small>Aggregate</small><strong>v{data.selected.aggregateVersion}</strong></span
            ><span
              ><small>Case version</small><strong>v{data.selected.currentVersionNo}</strong></span
            ><span
              ><small>Opportunity</small><strong
                >{data.opportunities.find((o) => o.id === data.selected?.developmentOpportunityId)
                  ?.opportunityRef ?? '—'}</strong
              ></span
            ><span
              ><small>Decision</small><strong
                >{data.selected.approvalDecisionId ?? 'Pending'}</strong
              ></span
            >
          </div>
          <section class="need">
            <span class="eyebrow">Objectives / need</span>
            <p>{currentVersion.objectivesNeed}</p>
            <strong class="recommendation">{currentVersion.recommendation}</strong>
          </section>
          <div class="three">
            <section>
              <span class="eyebrow">Options & benefits</span>
              <pre>{pretty(currentVersion.options)}</pre>
              <pre>{pretty(currentVersion.benefits)}</pre>
            </section>
            <section>
              <span class="eyebrow">Funding & risk</span>
              <pre>{pretty(currentVersion.costFundingBasis)}</pre>
              <pre>{pretty(currentVersion.risks)}</pre>
            </section>
            <section>
              <span class="eyebrow">Structure & terms</span>
              <pre>{pretty(currentVersion.transactionStructure)}</pre>
              <pre>{pretty(currentVersion.negotiatedTerms)}</pre>
            </section>
          </div>

          {#if canCreateSelected && ['DRAFT', 'DEVELOPING', 'REWORK'].includes(data.selected.status)}
            <details class="command">
              <summary>Create controlled successor version</summary>
              <form method="POST" action="?/revise">
                <input type="hidden" name="caseId" value={data.selected.id} /><input
                  type="hidden"
                  name="caseType"
                  value={data.selected.caseType}
                /><input
                  type="hidden"
                  name="aggregateVersion"
                  value={data.selected.aggregateVersion}
                /><label
                  >Approved appraisal<select name="appraisalId"
                    ><option value="">None</option
                    >{#each data.appraisals.filter((a) => a.status === 'APPROVED_SNAPSHOT') as appraisal}<option
                        value={appraisal.id}
                        selected={appraisal.id === currentVersion.appraisalId}
                        >{appraisal.appraisalRef}</option
                      >{/each}</select
                  ></label
                ><label
                  >Due Diligence matter<select name="legalMatterId"
                    ><option value="">None</option>{#each data.matters as matter}<option
                        value={matter.id}
                        selected={matter.id === currentVersion.legalMatterId}
                        >{matter.matterRef}</option
                      >{/each}</select
                  ></label
                ><label
                  >Objectives / need<textarea name="objectivesNeed" rows="4" required
                    >{currentVersion.objectivesNeed}</textarea
                  ></label
                ><label
                  >Options JSON<textarea name="options" rows="4" required
                    >{pretty(currentVersion.options)}</textarea
                  ></label
                ><label
                  >Benefits JSON<textarea name="benefits" rows="4" required
                    >{pretty(currentVersion.benefits)}</textarea
                  ></label
                ><label
                  >Cost / funding basis JSON<textarea name="costFundingBasis" rows="4" required
                    >{pretty(currentVersion.costFundingBasis)}</textarea
                  ></label
                ><label
                  >Risks JSON<textarea name="risks" rows="4" required
                    >{pretty(currentVersion.risks)}</textarea
                  ></label
                ><label
                  >Assumptions JSON<textarea name="assumptions" rows="4" required
                    >{pretty(currentVersion.assumptions)}</textarea
                  ></label
                ><label
                  >Transaction structure JSON<textarea name="transactionStructure" rows="4"
                    >{pretty(currentVersion.transactionStructure)}</textarea
                  ></label
                ><label
                  >Negotiated terms JSON<textarea name="negotiatedTerms" rows="4"
                    >{pretty(currentVersion.negotiatedTerms)}</textarea
                  ></label
                ><label
                  >Recommendation<textarea name="recommendation" rows="4" required
                    >{currentVersion.recommendation}</textarea
                  ></label
                ><button>Create successor version</button>
              </form>
            </details>
            <form method="POST" action="?/prepare" class="actions">
              <input type="hidden" name="caseId" value={data.selected.id} /><input
                type="hidden"
                name="caseType"
                value={data.selected.caseType}
              /><input
                type="hidden"
                name="aggregateVersion"
                value={data.selected.aggregateVersion}
              /><button>Submit exact version for Decision</button>
            </form>
          {/if}

          {#if data.capabilities.canApprove && data.selected.status === 'DECISION_REQUIRED'}
            <details class="command" open>
              <summary>Record approval Decision</summary>
              <form method="POST" action="?/decide">
                <input type="hidden" name="caseId" value={data.selected.id} /><input
                  type="hidden"
                  name="caseType"
                  value={data.selected.caseType}
                /><input
                  type="hidden"
                  name="aggregateVersion"
                  value={data.selected.aggregateVersion}
                /><input
                  type="hidden"
                  name="currentVersionNo"
                  value={data.selected.currentVersionNo}
                /><label
                  >Outcome<select name="outcome"
                    ><option>APPROVED</option><option>REWORK</option><option>REJECTED</option
                    ></select
                  ></label
                ><label
                  >Decision rationale<textarea name="reason" rows="4" required></textarea></label
                ><button>Record immutable Decision and apply outcome</button>
              </form>
            </details>
          {/if}

          {#if canCreateSelected && data.selected.status === 'APPROVED'}
            <section class="agreements">
              <span class="eyebrow">Executed agreement references</span>
              <div class="rows">
                {#each data.agreements as agreement}<article>
                    <div>
                      <strong>{agreement.agreementRole}</strong><span
                        >{agreement.executionStatus}</span
                      >
                    </div>
                    <p>{agreement.subjectType} · {agreement.subjectId}</p>
                    <small>{agreement.executionReference ?? 'No execution reference'}</small>
                  </article>{:else}<p class="empty">No agreement references recorded.</p>{/each}
              </div>
              <details class="command">
                <summary>Record executed agreement</summary>
                <form method="POST" action="?/agreement">
                  <input type="hidden" name="caseId" value={data.selected.id} /><input
                    type="hidden"
                    name="caseType"
                    value={data.selected.caseType}
                  /><label>Agreement role<input name="agreementRole" required /></label>
                  <div class="grid">
                    <label
                      >Subject type<input
                        name="subjectType"
                        value="INFORMATION_REVISION"
                        required
                      /></label
                    ><label>Subject ID<input name="subjectId" required /></label>
                  </div>
                  <label>Subject version<input name="subjectVersion" /></label><label
                    >Execution status<select name="executionStatus"
                      ><option>EXECUTED</option><option>CONDITIONALLY_EXECUTED</option><option
                        >PENDING</option
                      ></select
                    ></label
                  ><label>Execution reference<input name="executionReference" /></label><label
                    >Executed at<input name="executedAt" type="datetime-local" /></label
                  ><button>Record agreement reference</button>
                </form>
              </details>
            </section>
            <form method="POST" action="?/close" class="actions">
              <input type="hidden" name="caseId" value={data.selected.id} /><input
                type="hidden"
                name="caseType"
                value={data.selected.caseType}
              /><input
                type="hidden"
                name="aggregateVersion"
                value={data.selected.aggregateVersion}
              /><button>Complete / close Business Case</button>
            </form>
          {/if}

          <section class="history">
            <span class="eyebrow">Controlled version history</span>
            <div class="rows">
              {#each data.versions as version}<article>
                  <div>
                    <strong>v{version.versionNo}</strong><span>{version.lifecycleStatus}</span>
                  </div>
                  <p>{version.recommendation}</p>
                  <small>{new Date(version.createdAt).toLocaleString('en-GB')}</small>
                </article>{/each}
            </div>
          </section>
        </section>
      {:else}<section class="section-card empty-state">
          <h2>
            Create the first {types.find((t) => t.key === selectedType)?.label ?? 'Business Case'}
          </h2>
          <p>
            The shared Business Case master keeps transaction, divestiture and partnership evidence
            structurally consistent while preserving each case type.
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
  .tabs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 7px;
  }
  .tabs a {
    display: grid;
    gap: 3px;
    padding: 9px 11px;
    border: 1px solid #dce5ea;
    border-radius: 7px;
    background: #fff;
    text-decoration: none;
    color: #506777;
  }
  .tabs a.active {
    border-color: #78bce0;
    background: #edf8fe;
  }
  .tabs small {
    font-size: 8px;
  }
  .tabs strong {
    font-size: 10px;
  }
  .workspace {
    display: grid;
    grid-template-columns: 340px 1fr;
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
    font-size: 8.5px;
    overflow-wrap: anywhere;
  }
  .need,
  .agreements,
  .history {
    margin-top: 12px;
    padding: 10px;
    border: 1px solid #dfe7ec;
    border-radius: 8px;
  }
  .recommendation {
    display: block;
    margin-top: 8px;
    font-size: 10px;
    color: #315f7d;
  }
  .three {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 8px;
  }
  .three section {
    padding: 10px;
    border: 1px solid #dfe7ec;
    border-radius: 8px;
  }
  .three pre {
    margin: 7px 0 0;
    padding: 7px;
    background: #f5f7f8;
    border-radius: 6px;
    white-space: pre-wrap;
    font-size: 8px;
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
  @media (max-width: 1000px) {
    .three {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 850px) {
    .hero,
    .workspace,
    .grid,
    .facts,
    .tabs {
      grid-template-columns: 1fr;
    }
    .register {
      position: static;
    }
  }
</style>
