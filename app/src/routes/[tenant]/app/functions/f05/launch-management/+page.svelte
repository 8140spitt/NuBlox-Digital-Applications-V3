<script lang="ts">
  let { data, form } = $props();
  const href = (id: string) =>
    `/${data.tenantSlug}/app/functions/f05/launch-management?item=${encodeURIComponent(id)}`;
  const released = $derived(data.configurations.some((item) => item.status === 'RELEASED'));
  const approvedCase = $derived(data.businessCases.some((item) => item.status === 'APPROVED'));
</script>

<svelte:head><title>Launch Management · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f05`}>F05 Product, Service & Innovation</a><span
      >›</span
    ><strong>F05.07 Launch Management</strong>
  </nav>
  <header class="hero section-card">
    <div>
      <span class="eyebrow">F05.07 · AGG-10-ITEM</span>
      <h1>Launch management</h1>
      <p>
        Prepare channels, teams and pricing context, then activate an offering only when concept,
        investment and configuration evidence all pass the launch gate.
      </p>
    </div>
    <div class="principle">
      <strong>Launch is a gated Item transition</strong><span
        >Readiness cannot bypass concept selection, investment approval or released configuration.</span
      ><small
        >Pricing remains a governed reference to its owning commercial definition rather than copied
        price truth.</small
      >
    </div>
  </header>
  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <span class="eyebrow">Offering register</span>
      <h2>{data.items.length} Items</h2>
      <nav class="rows">
        {#each data.items as item}<a
            class:active={data.selected?.id === item.id}
            href={href(item.id)}
            ><div><strong>{item.itemNumber}</strong><span>{item.status}</span></div>
            <p>{item.name}</p>
            <small>{item.itemType}</small></a
          >{:else}<p>No Items available.</p>{/each}
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
            <span class="status">{data.launch?.launchStatus ?? 'NOT PREPARED'}</span>
          </div>
          <div class="gate">
            <article class:ok={Boolean(data.selected.selectedDecisionId)}>
              <strong>1</strong><span>Concept Decision</span><small
                >{data.selected.selectedDecisionId ? 'Bound' : 'Missing'}</small
              >
            </article>
            <article class:ok={approvedCase}>
              <strong>2</strong><span>Investment case</span><small
                >{approvedCase ? 'Approved' : 'Missing'}</small
              >
            </article>
            <article class:ok={released}>
              <strong>3</strong><span>Configuration</span><small
                >{released ? 'Released' : 'Missing'}</small
              >
            </article>
            <article class:ok={Boolean(data.launch)}>
              <strong>4</strong><span>Readiness</span><small
                >{data.launch ? data.launch.launchStatus : 'Missing'}</small
              >
            </article>
          </div>
          {#if data.launch}
            <section class="panel">
              <span class="eyebrow">Launch readiness</span>
              <p><strong>Plan</strong> {data.launch.launchPlan}</p>
              <p><strong>Channels</strong> {data.launch.channelReadiness}</p>
              <p><strong>Training</strong> {data.launch.trainingReadiness}</p>
              <p><strong>Pricing</strong> {data.launch.pricingReference}</p>
            </section>
          {/if}
          {#if data.canManage && data.selected.status === 'DRAFT'}
            <details class="command" open>
              <summary>Prepare / update launch</summary>
              <form method="POST" action="?/configure">
                <input type="hidden" name="itemId" value={data.selected.id} />
                <label
                  >Launch plan<textarea name="launchPlan" rows="3" required
                    >{data.launch?.launchPlan ?? ''}</textarea
                  ></label
                >
                <label
                  >Channel readiness<textarea name="channelReadiness" rows="2" required
                    >{data.launch?.channelReadiness ?? ''}</textarea
                  ></label
                >
                <label
                  >Training readiness<textarea name="trainingReadiness" rows="2" required
                    >{data.launch?.trainingReadiness ?? ''}</textarea
                  ></label
                >
                <label
                  >Pricing reference<input
                    name="pricingReference"
                    value={data.launch?.pricingReference ?? ''}
                    required
                  /></label
                >
                <label>Planned launch<input type="datetime-local" name="plannedLaunchAt" /></label
                ><button>Save launch readiness</button>
              </form>
            </details>
            <form method="POST" action="?/launch" class="launch-action">
              <input type="hidden" name="itemId" value={data.selected.id} /><input
                type="hidden"
                name="aggregateVersion"
                value={data.selected.aggregateVersion}
              />
              <button>Execute governed launch</button>
            </form>
          {/if}
        </section>
      {:else}<section class="section-card empty-state">
          <h2>No offering ready for launch preparation</h2>
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
  .head {
    display: flex;
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
  .gate {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 7px;
    margin: 12px 0;
  }
  .gate article {
    display: grid;
    gap: 3px;
    padding: 9px;
    border: 1px solid #e0c8c8;
    border-radius: 8px;
    background: #fff8f8;
  }
  .gate article.ok {
    border-color: #b8dfc0;
    background: #f3faf5;
  }
  .gate strong {
    font-size: 16px;
    color: #6d8290;
  }
  .gate span {
    font-size: 9px;
    font-weight: 800;
  }
  .gate small {
    font-size: 8px;
    color: #7a8c98;
  }
  .panel {
    padding: 10px;
    border: 1px solid #dfe7ec;
    border-radius: 8px;
  }
  .panel strong {
    color: #3e5d70;
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
  .launch-action {
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
    .gate {
      grid-template-columns: 1fr;
    }
    .register {
      position: static;
    }
  }
</style>
