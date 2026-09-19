<script lang="ts">
  let { data, form } = $props();
  const href = (id: string) => {
    const q = new URLSearchParams({ mode: data.mode, plan: id });
    return `/${data.tenantSlug}/app/functions/f06/brand-strategy?${q.toString()}`;
  };
  const heading = $derived(data.mode === 'brand' ? 'Brand management' : 'Marketing strategy');
</script>

<svelte:head><title>{heading} · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f06`}>F06 Marketing & Brand</a><span>›</span><strong
      >{data.mode === 'brand' ? 'F06.03 Brand Management' : 'F06.04 Marketing Strategy'}</strong
    >
  </nav>
  <header class="hero section-card">
    <div>
      <span class="eyebrow">F06.03–F06.04 · AGG-25-COMMUNICATIONS</span>
      <h1>{heading}</h1>
      <p>
        Govern brand positioning and marketing direction as versioned Communications Plans, with
        issued guideline/content references and exact-version approval Decisions.
      </p>
    </div>
    <div class="principle">
      <strong>Plan ≠ content ≠ campaign</strong><span
        >The Plan coordinates intent; Information owns content; Campaign owns execution.</span
      ><small
        >Approved changes create successor plan versions instead of rewriting historic marketing
        direction.</small
      >
    </div>
  </header>
  <div class="mode-tabs">
    <a
      class:active={data.mode === 'brand'}
      href={`/${data.tenantSlug}/app/functions/f06/brand-strategy?mode=brand`}>Brand</a
    >
    <a
      class:active={data.mode === 'strategy'}
      href={`/${data.tenantSlug}/app/functions/f06/brand-strategy?mode=strategy`}
      >Marketing strategy</a
    >
  </div>
  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <span class="eyebrow">Communications plan register</span>
      <h2>{data.plans.length} plans</h2>
      <nav class="rows">
        {#each data.plans as plan}
          <a class:active={data.selected?.id === plan.id} href={href(plan.id)}
            ><div><strong>{plan.planRef}</strong><span>{plan.status}</span></div>
            <p>{plan.title}</p>
            <small>{plan.planType} · v{plan.currentVersionNo}</small></a
          >
        {:else}<p class="empty">No brand or marketing plans.</p>{/each}
      </nav>
      {#if data.capabilities.canManage}
        <details class="command">
          <summary>Create {data.mode === 'brand' ? 'brand' : 'marketing strategy'} plan</summary>
          <form method="POST" action="?/create">
            <input type="hidden" name="mode" value={data.mode} />
            <div class="grid">
              <label>Reference<input name="planRef" required /></label><label
                >Title<input name="title" required /></label
              >
            </div>
            <label>Scope / context<textarea name="scopeContext" rows="3" required></textarea></label
            >
            <div class="json-grid">
              <label
                >Objectives JSON<textarea name="objectives" rows="3" value={'{}'}></textarea></label
              ><label
                >Audiences JSON<textarea name="audiences" rows="3" value={'{}'}></textarea></label
              ><label
                >Key messages JSON<textarea name="keyMessages" rows="3" value={'{}'}
                ></textarea></label
              ><label
                >Channels JSON<textarea name="channels" rows="3" value={'[]'}></textarea></label
              ><label
                >Activities JSON<textarea name="activities" rows="3" value={'[]'}></textarea></label
              ><label
                >Schedule JSON<textarea name="schedule" rows="3" value={'{}'}></textarea></label
              ><label
                >Measures JSON<textarea name="measures" rows="3" value={'{}'}></textarea></label
              ><label
                >Positioning JSON<textarea name="positioning" rows="3" value={'{}'}
                ></textarea></label
              ><label
                >Brand definition JSON<textarea name="brandDefinition" rows="3" value={'{}'}
                ></textarea></label
              >
            </div>
            <label>Guideline summary<textarea name="guidelineSummary" rows="3"></textarea></label
            ><button>Create governed plan</button>
          </form>
        </details>
      {/if}
    </aside>

    <main>
      {#if data.selected && data.current}
        <section class="section-card detail">
          <div class="head">
            <div>
              <span class="eyebrow">{data.selected.planType}</span>
              <h2>{data.selected.planRef} · {data.selected.title}</h2>
            </div>
            <div class="state-group">
              <span>{data.selected.status}</span><span>v{data.selected.currentVersionNo}</span>
            </div>
          </div>
          <div class="facts">
            <span
              ><small>Owner</small><strong>{data.selected.ownerPartyId.slice(0, 8)}…</strong></span
            ><span
              ><small>Controlled references</small><strong>{data.information.length}</strong></span
            ><span
              ><small>Decision</small><strong
                >{data.selected.approvalDecisionId ? 'Bound' : 'Not approved'}</strong
              ></span
            ><span><small>Aggregate</small><strong>v{data.selected.aggregateVersion}</strong></span>
          </div>
          <section class="panel">
            <span class="eyebrow">Scope & context</span>
            <p>{data.current.scopeContext}</p>
            {#if data.current.guidelineSummary}<small>{data.current.guidelineSummary}</small>{/if}
          </section>
          <div class="evidence-grid">
            <article>
              <span>Positioning</span>
              <pre>{JSON.stringify(data.current.positioning, null, 2)}</pre>
            </article>
            <article>
              <span>Brand definition</span>
              <pre>{JSON.stringify(data.current.brandDefinition, null, 2)}</pre>
            </article>
            <article>
              <span>Audiences</span>
              <pre>{JSON.stringify(data.current.audiences, null, 2)}</pre>
            </article>
            <article>
              <span>Messages</span>
              <pre>{JSON.stringify(data.current.keyMessages, null, 2)}</pre>
            </article>
          </div>
          <section class="panel">
            <div class="section-head">
              <span class="eyebrow">Issued controlled information</span><strong
                >{data.information.length}</strong
              >
            </div>
            {#each data.information as row}<article>
                <div>
                  <strong>{row.linkRole} · {row.containerRef}/{row.revisionCode}</strong><span
                    >{row.lifecycleStatus}</span
                  >
                </div>
                <small>{row.title}</small>
              </article>{:else}<p>No issued Information linked yet.</p>{/each}
          </section>

          {#if data.capabilities.canManage && data.selected.status === 'DRAFT'}
            <div class="command-grid">
              <details class="command">
                <summary>Link issued guideline / asset</summary>
                <form method="POST" action="?/linkInformation">
                  <input type="hidden" name="planId" value={data.selected.id} /><input
                    type="hidden"
                    name="mode"
                    value={data.mode}
                  /><label
                    >Issued information<select name="informationRevisionId" required
                      ><option value="">Select revision</option
                      >{#each data.issuedInformation as item}<option value={item.id}
                          >{item.containerRef}/{item.revisionCode} · {item.title}</option
                        >{/each}</select
                    ></label
                  ><label
                    >Role<select name="linkRole"
                      ><option>BRAND_GUIDELINE</option><option>BRAND_ASSET</option><option
                        >RESEARCH_EVIDENCE</option
                      ><option>SUPPORTING_CONTENT</option></select
                    ></label
                  ><button>Link exact issued revision</button>
                </form>
              </details>
              <details class="command">
                <summary>Create successor plan version</summary>
                <form method="POST" action="?/revise">
                  <input type="hidden" name="planId" value={data.selected.id} /><input
                    type="hidden"
                    name="aggregateVersion"
                    value={data.selected.aggregateVersion}
                  /><input type="hidden" name="mode" value={data.mode} /><label
                    >Title<input name="title" value={data.selected.title} /></label
                  ><label
                    >Scope<textarea name="scopeContext" rows="3" required
                      >{data.current.scopeContext}</textarea
                    ></label
                  >
                  <div class="json-grid">
                    <label
                      >Objectives<textarea name="objectives" rows="3"
                        >{JSON.stringify(data.current.objectives)}</textarea
                      ></label
                    ><label
                      >Audiences<textarea name="audiences" rows="3"
                        >{JSON.stringify(data.current.audiences)}</textarea
                      ></label
                    ><label
                      >Messages<textarea name="keyMessages" rows="3"
                        >{JSON.stringify(data.current.keyMessages)}</textarea
                      ></label
                    ><label
                      >Channels<textarea name="channels" rows="3"
                        >{JSON.stringify(data.current.channels)}</textarea
                      ></label
                    ><label
                      >Activities<textarea name="activities" rows="3"
                        >{JSON.stringify(data.current.activities)}</textarea
                      ></label
                    ><label
                      >Schedule<textarea name="schedule" rows="3"
                        >{JSON.stringify(data.current.schedule)}</textarea
                      ></label
                    ><label
                      >Measures<textarea name="measures" rows="3"
                        >{JSON.stringify(data.current.measures)}</textarea
                      ></label
                    ><label
                      >Positioning<textarea name="positioning" rows="3"
                        >{JSON.stringify(data.current.positioning)}</textarea
                      ></label
                    ><label
                      >Brand definition<textarea name="brandDefinition" rows="3"
                        >{JSON.stringify(data.current.brandDefinition)}</textarea
                      ></label
                    >
                  </div>
                  <label
                    >Guidelines<textarea name="guidelineSummary" rows="2"
                      >{data.current.guidelineSummary ?? ''}</textarea
                    ></label
                  ><button>Create successor version</button>
                </form>
              </details>
            </div>
            <form method="POST" action="?/submit" class="inline-action">
              <input type="hidden" name="planId" value={data.selected.id} /><input
                type="hidden"
                name="aggregateVersion"
                value={data.selected.aggregateVersion}
              /><input type="hidden" name="mode" value={data.mode} /><button
                >Submit exact version for Decision</button
              >
            </form>
          {/if}

          {#if data.capabilities.canApprove && data.selected.status === 'REVIEW'}
            <form method="POST" action="?/decide" class="decision-form">
              <input type="hidden" name="planId" value={data.selected.id} /><input
                type="hidden"
                name="aggregateVersion"
                value={data.selected.aggregateVersion}
              /><input
                type="hidden"
                name="currentVersionNo"
                value={data.selected.currentVersionNo}
              /><input type="hidden" name="mode" value={data.mode} /><label
                >Outcome<select name="outcome"
                  ><option>APPROVED</option><option>REWORK</option><option>REJECTED</option></select
                ></label
              ><label>Decision reason<input name="reason" required /></label><button
                >Record & apply Decision</button
              >
            </form>
          {/if}
          {#if data.capabilities.canManage && data.selected.status === 'APPROVED'}
            <form method="POST" action="?/activate" class="inline-action">
              <input type="hidden" name="planId" value={data.selected.id} /><input
                type="hidden"
                name="aggregateVersion"
                value={data.selected.aggregateVersion}
              /><input type="hidden" name="mode" value={data.mode} /><button
                >Activate approved plan</button
              >
            </form>
          {/if}
        </section>
      {:else}<section class="section-card empty-state">
          <h2>Create the first governed brand or marketing plan</h2>
        </section>{/if}
    </main>
  </div>
</div>

<style>
  .page {
    display: grid;
    gap: 12px;
  }
  .breadcrumb,
  .mode-tabs,
  .head,
  .rows div,
  .section-head,
  .panel article div {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .breadcrumb {
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
    font-size: 9px;
    font-weight: 850;
    color: var(--blue-700);
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }
  h1 {
    margin: 4px 0 6px;
    font-size: 25px;
  }
  h2 {
    margin: 3px 0 8px;
    font-size: 16px;
  }
  p {
    font-size: 10px;
    color: #5f7484;
    line-height: 1.5;
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
  .mode-tabs {
    width: max-content;
    padding: 4px;
    border: 1px solid #dbe6ec;
    border-radius: 8px;
    background: #fff;
  }
  .mode-tabs a {
    padding: 6px 9px;
    border-radius: 5px;
    color: #637987;
    font-size: 9px;
    font-weight: 800;
    text-decoration: none;
  }
  .mode-tabs a.active {
    background: #eaf6fd;
    color: #2f6584;
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
    margin-top: 8px;
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
  .panel article div {
    justify-content: space-between;
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
  .state-group {
    display: flex;
    gap: 5px;
  }
  .state-group span {
    font-size: 8px;
    font-weight: 850;
    padding: 4px 6px;
    border-radius: 999px;
    background: #eaf4f9;
    color: #35617d;
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
    font-size: 7px;
    color: #85949e;
  }
  .facts strong {
    font-size: 9px;
  }
  .panel {
    padding: 10px;
    border: 1px solid #dfe7ec;
    border-radius: 8px;
    margin-top: 8px;
  }
  .panel article {
    padding: 7px 0;
    border-bottom: 1px solid #edf1f3;
  }
  .panel article:last-child {
    border: 0;
  }
  .panel article strong {
    font-size: 8.5px;
  }
  .panel article span,
  .panel article small {
    font-size: 8px;
    color: #748894;
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
    font-size: 7.5px;
    color: #657986;
  }
  .command {
    margin-top: 10px;
    border-top: 1px solid #e4eaee;
    padding-top: 8px;
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
    font-size: 8.5px;
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
    cursor: pointer;
  }
  .grid,
  .json-grid,
  .command-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .json-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .inline-action {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }
  .decision-form {
    display: grid;
    grid-template-columns: 180px 1fr auto;
    gap: 8px;
    align-items: end;
    padding: 9px;
    margin-top: 10px;
    border: 1px solid #d8e6ee;
    border-radius: 8px;
    background: #f7fbfd;
  }
  .message {
    padding: 9px;
    border: 1px solid #dd8a8a;
    background: #fff3f3;
    color: #792f2f;
    font-size: 9px;
  }
  .empty,
  .empty-state {
    color: #758896;
  }
  .empty-state {
    padding: 24px;
    text-align: center;
  }
  @media (max-width: 1000px) {
    .hero,
    .workspace,
    .facts,
    .evidence-grid,
    .grid,
    .json-grid,
    .command-grid,
    .decision-form {
      grid-template-columns: 1fr;
    }
    .register {
      position: static;
    }
  }
</style>
