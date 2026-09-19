<script lang="ts">
  let { data, form } = $props();
  const href = (id: string) => {
    const q = new URLSearchParams({ mode: data.mode, item: id });
    return `/${data.tenantSlug}/app/functions/f05/lifecycle?${q.toString()}`;
  };
  const title = $derived(
    data.mode === 'retirement' ? 'Product retirement' : 'Lifecycle management'
  );
</script>

<svelte:head><title>{title} · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f05`}>F05 Product, Service & Innovation</a><span
      >›</span
    ><strong
      >{data.mode === 'retirement'
        ? 'F05.09 Product Retirement'
        : 'F05.08 Lifecycle Management'}</strong
    >
  </nav>
  <header class="hero section-card">
    <div>
      <span class="eyebrow">F05.08–F05.09 · AGG-10-ITEM</span>
      <h1>{title}</h1>
      <p>
        Review adoption and improvement evidence across the stable Item identity, then control
        end-of-life without erasing launched offering history.
      </p>
    </div>
    <div class="principle">
      <strong>Review evidence ≠ configuration overwrite</strong><span
        >Enhancements become successor configuration work.</span
      ><small
        >Retirement requires customer migration, stakeholder notice, support-end and archive
        evidence.</small
      >
    </div>
  </header>
  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <span class="eyebrow">Item lifecycle register</span>
      <h2>{data.items.length} Items</h2>
      <nav class="rows">
        {#each data.items as item}<a
            class:active={data.selected?.id === item.id}
            href={href(item.id)}
            ><div><strong>{item.itemNumber}</strong><span>{item.status}</span></div>
            <p>{item.name}</p>
            <small>{item.itemType} · v{item.aggregateVersion}</small></a
          >{:else}<p>No Items.</p>{/each}
      </nav>
    </aside>
    <main>
      {#if data.selected}
        <section class="section-card detail">
          <div class="head">
            <div>
              <span class="eyebrow">{data.selected.itemType}</span>
              <h2>{data.selected.itemNumber} · {data.selected.name}</h2>
            </div>
            <span class="status">{data.selected.status}</span>
          </div>
          {#if data.mode === 'lifecycle'}
            <div class="facts">
              <span><small>Lifecycle reviews</small><strong>{data.reviews.length}</strong></span
              ><span
                ><small>Configurations</small><strong>{data.configurations.length}</strong></span
              ><span
                ><small>Current aggregate</small><strong>v{data.selected.aggregateVersion}</strong
                ></span
              >
            </div>
            <section class="panel">
              <div class="section-head">
                <span class="eyebrow">Review history</span><strong>{data.reviews.length}</strong>
              </div>
              {#each data.reviews as row}<article>
                  <div>
                    <strong>{row.reviewType}</strong><small
                      >{new Date(row.reviewedAt).toLocaleString('en-GB')}</small
                    >
                  </div>
                  <p>{row.summary}</p>
                  <small>Recommendation · {row.recommendation}</small>
                </article>{:else}<p>No lifecycle reviews.</p>{/each}
            </section>
            {#if data.capabilities.canLifecycle}
              <details class="command" open>
                <summary>Record lifecycle review</summary>
                <form method="POST" action="?/review">
                  <input type="hidden" name="itemId" value={data.selected.id} /><input
                    type="hidden"
                    name="mode"
                    value={data.mode}
                  />
                  <div class="grid">
                    <label
                      >Review type<select name="reviewType"
                        ><option>ADOPTION</option><option>ENHANCEMENT</option><option
                          >SPECIFICATION_CHANGE</option
                        ><option>PORTFOLIO_OPTIMISATION</option></select
                      ></label
                    ><label
                      >Configuration context<select name="configurationModelId"
                        ><option value="">None</option>{#each data.configurations as model}<option
                            value={model.id}>{model.modelRef} · {model.status}</option
                          >{/each}</select
                      ></label
                    >
                  </div>
                  <label>Summary<textarea name="summary" rows="3" required></textarea></label><label
                    >Metrics JSON<textarea name="metrics" rows="3">{'{}'}</textarea></label
                  ><label
                    >Recommendation<textarea name="recommendation" rows="3" required
                    ></textarea></label
                  ><button>Record lifecycle evidence</button>
                </form>
              </details>
            {/if}
          {:else}
            <div class="retirement-state">
              <strong>{data.retirement?.retirementStatus ?? 'NOT PLANNED'}</strong><span
                >{data.retirement?.supportEndAt
                  ? 'Support ends ' +
                    new Date(data.retirement.supportEndAt).toLocaleDateString('en-GB')
                  : 'No support-end date'}</span
              >
            </div>
            {#if data.retirement}
              <section class="panel">
                <span class="eyebrow">Retirement evidence</span>
                <p><strong>Rationale</strong> {data.retirement.rationale}</p>
                <p>
                  <strong>Stakeholder notice</strong>
                  {data.retirement.stakeholderNoticeReference ?? 'Missing'}
                </p>
                <p>
                  <strong>Customer migration</strong>
                  {data.retirement.customerMigrationPlan ?? 'Missing'}
                </p>
                <p><strong>Archive</strong> {data.retirement.archiveReference ?? 'Missing'}</p>
              </section>
            {/if}
            {#if data.capabilities.canRetire && data.selected.status !== 'RETIRED'}
              <details class="command" open>
                <summary>Plan / update retirement</summary>
                <form method="POST" action="?/beginRetirement">
                  <input type="hidden" name="itemId" value={data.selected.id} /><input
                    type="hidden"
                    name="aggregateVersion"
                    value={data.selected.aggregateVersion}
                  />
                  <label
                    >End-of-life rationale<textarea name="rationale" rows="3" required
                      >{data.retirement?.rationale ?? ''}</textarea
                    ></label
                  >
                  <label
                    >Stakeholder notice reference<input
                      name="stakeholderNoticeReference"
                      value={data.retirement?.stakeholderNoticeReference ?? ''}
                    /></label
                  >
                  <label
                    >Customer migration plan<textarea name="customerMigrationPlan" rows="3"
                      >{data.retirement?.customerMigrationPlan ?? ''}</textarea
                    ></label
                  >
                  <label>Support end<input type="datetime-local" name="supportEndAt" /></label
                  ><label
                    >Archive reference<input
                      name="archiveReference"
                      value={data.retirement?.archiveReference ?? ''}
                    /></label
                  ><button>Save retirement plan</button>
                </form>
              </details>
              {#if data.selected.status === 'OBSOLETE'}
                <form method="POST" action="?/completeRetirement" class="complete">
                  <input type="hidden" name="itemId" value={data.selected.id} /><input
                    type="hidden"
                    name="aggregateVersion"
                    value={data.selected.aggregateVersion}
                  /><button>Complete governed retirement</button>
                </form>
              {/if}
            {/if}
          {/if}
        </section>
      {:else}<section class="section-card empty-state">
          <h2>No Item lifecycle available</h2>
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
  .facts {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    margin: 10px 0;
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
  .panel {
    padding: 10px;
    border: 1px solid #dfe7ec;
    border-radius: 8px;
    margin-top: 8px;
  }
  .panel article {
    padding: 8px 0;
    border-bottom: 1px solid #edf1f3;
  }
  .panel article:last-child {
    border: 0;
  }
  .panel article strong {
    font-size: 9px;
  }
  .panel article small {
    font-size: 8px;
    color: #758894;
  }
  .retirement-state {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    border: 1px solid #edd7b5;
    border-radius: 8px;
    background: #fffaf0;
    color: #76571d;
    font-size: 9px;
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
  .complete {
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
