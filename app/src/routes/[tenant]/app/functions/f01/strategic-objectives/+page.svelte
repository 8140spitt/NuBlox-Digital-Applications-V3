<script lang="ts">
  import { objectHref } from '$lib/data/runtime-object-registry';

  let { data, form } = $props();

  function href(id: string) {
    return objectHref(data.tenantSlug, 'strategic-objective', id, { from: 'F01.03' });
  }
</script>

<svelte:head><title>Strategic Objectives · NuBlox</title></svelte:head>

<div class="objective-page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f01`}>F01 Strategy & Enterprise Planning</a><span
      >›</span
    ><strong>F01.03 Strategic Planning</strong>
  </nav>

  <header class="hero section-card">
    <div>
      <span class="eyebrow">F01.03 · AGG-02-OBJECTIVE</span>
      <h1>Strategic objectives</h1>
      <p>
        Translate the published enterprise strategy into stable, owned outcomes with explicit
        success criteria, horizon and priority.
      </p>
    </div>
    <div class="principle">
      <strong>Objective identity survives KPI change</strong><span
        >Objectives reference an exact published Strategy Framework version.</span
      ><small
        >KPI definitions, targets and observations remain separate performance identities.</small
      >
    </div>
  </header>

  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <div class="workspace-grid">
    <aside class="section-card register">
      <div>
        <span class="eyebrow">Objective register</span>
        <h2>{data.objectives.length} objectives</h2>
      </div>
      <nav class="objective-list">
        {#each data.objectives as item}
          <a class:active={data.selected?.id === item.id} href={href(item.id)}>
            <div>
              <strong>{item.objectiveRef}</strong><span
                class={'status ' + item.status.toLowerCase()}>{item.status}</span
              >
            </div>
            <p>{item.statement}</p>
            <small>{item.priority} · Strategy v{item.frameworkVersionNo}</small>
          </a>
        {:else}<p class="empty-copy">No Strategic Objectives have been created.</p>{/each}
      </nav>

      {#if data.capabilities.canManage}
        <details class="command">
          <summary>Create objective</summary>
          <form method="POST" action="?/create">
            <label
              >Reference<input name="objectiveRef" required placeholder="OBJ-DIGITAL-01" /></label
            >
            <label
              >Published strategy<select name="frameworkId" required
                ><option value="">Select framework</option
                >{#each data.publishedFrameworks as framework}<option value={framework.id}
                    >{framework.title} · v{framework.currentVersion}</option
                  >{/each}</select
              ></label
            >
            <label
              >Strategy version<input
                name="frameworkVersionNo"
                type="number"
                min="1"
                required
              /></label
            >
            <label
              >Objective statement<textarea name="statement" rows="4" required></textarea></label
            >
            <label
              >Success criteria<textarea name="successCriteria" rows="3" required></textarea></label
            >
            <div class="form-grid">
              <label
                >Priority<select name="priority"
                  ><option>CRITICAL</option><option>HIGH</option><option selected>MEDIUM</option
                  ><option>LOW</option></select
                ></label
              >
              <label>Scope type<input name="scopeType" placeholder="TENANT" /></label>
              <label>Scope ID<input name="scopeId" /></label>
              <label>Horizon start<input name="horizonStart" type="date" /></label>
              <label>Horizon end<input name="horizonEnd" type="date" /></label>
            </div>
            <button type="submit">Create proposed objective</button>
          </form>
        </details>
      {/if}
    </aside>

    <main class="main-column">
      {#if data.selected}
        <section class="section-card detail">
          <div class="detail-head">
            <div>
              <span class="eyebrow">{data.selected.priority}</span>
              <h2>{data.selected.objectiveRef}</h2>
            </div>
            <span class={'status large ' + data.selected.status.toLowerCase()}
              >{data.selected.status}</span
            >
          </div>
          <blockquote>{data.selected.statement}</blockquote>
          <div class="facts">
            <span
              ><small>Strategy version</small><strong>v{data.selected.frameworkVersionNo}</strong
              ></span
            >
            <span
              ><small>Objective version</small><strong>v{data.selected.currentVersionNo}</strong
              ></span
            >
            <span><small>Aggregate</small><strong>v{data.selected.aggregateVersion}</strong></span>
            <span><small>Priority</small><strong>{data.selected.priority}</strong></span>
          </div>
          <div class="criteria">
            <span class="eyebrow">Success criteria</span>
            <p>{data.selected.successCriteria}</p>
          </div>

          {#if data.capabilities.canApprove}
            <form method="POST" action="?/transition" class="actions">
              <input type="hidden" name="objectiveId" value={data.selected.id} />
              <input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion} />
              {#if data.selected.status === 'PROPOSED'}<button name="action" value="APPROVE"
                  >Approve objective</button
                >{/if}
              {#if data.selected.status === 'APPROVED'}<button name="action" value="ACTIVATE"
                  >Activate</button
                >{/if}
              {#if data.selected.status === 'ACTIVE'}<button name="action" value="ACHIEVE"
                  >Mark achieved</button
                ><button class="quiet" name="action" value="MISS">Mark not achieved</button>{/if}
              {#if ['PROPOSED', 'APPROVED', 'ACTIVE'].includes(data.selected.status)}<button
                  class="quiet"
                  name="action"
                  value="SUPERSEDE">Supersede</button
                >{/if}
              {#if ['APPROVED', 'ACTIVE', 'ACHIEVED', 'NOT_ACHIEVED', 'SUPERSEDED'].includes(data.selected.status)}<button
                  class="quiet"
                  name="action"
                  value="RETIRE">Retire</button
                >{/if}
            </form>
          {/if}

          {#if data.capabilities.canManage && data.selected.status === 'PROPOSED'}
            <details class="command">
              <summary>Revise objective</summary>
              <form method="POST" action="?/revise">
                <input type="hidden" name="objectiveId" value={data.selected.id} />
                <input
                  type="hidden"
                  name="aggregateVersion"
                  value={data.selected.aggregateVersion}
                />
                <label
                  >Statement<textarea name="statement" rows="4" required
                    >{data.selected.statement}</textarea
                  ></label
                >
                <label
                  >Success criteria<textarea name="successCriteria" rows="3" required
                    >{data.selected.successCriteria}</textarea
                  ></label
                >
                <div class="form-grid">
                  <label
                    >Priority<select name="priority"
                      ><option selected={data.selected.priority === 'CRITICAL'}>CRITICAL</option
                      ><option selected={data.selected.priority === 'HIGH'}>HIGH</option><option
                        selected={data.selected.priority === 'MEDIUM'}>MEDIUM</option
                      ><option selected={data.selected.priority === 'LOW'}>LOW</option></select
                    ></label
                  >
                  <label
                    >Scope type<input
                      name="scopeType"
                      value={data.selected.scopeType ?? ''}
                    /></label
                  >
                  <label>Scope ID<input name="scopeId" value={data.selected.scopeId ?? ''} /></label
                  >
                </div>
                <button type="submit">Create new objective version</button>
              </form>
            </details>
          {/if}
        </section>

        <section class="section-card history">
          <span class="eyebrow">Immutable versions</span>
          <h2>{data.versions.length} versions</h2>
          <div class="version-list">
            {#each data.versions as version}<article>
                <div>
                  <strong>v{version.versionNo}</strong><span
                    class={'status ' + version.lifecycleStatus.toLowerCase()}
                    >{version.lifecycleStatus}</span
                  >
                </div>
                <p>{version.statement}</p>
                <small>{version.priority} · {version.successCriteria}</small>
              </article>{/each}
          </div>
        </section>
      {:else}
        <section class="section-card empty-state">
          <h2>Create the first Strategic Objective</h2>
          <p>Publish a Strategy Framework first, then translate it into governed outcomes here.</p>
        </section>
      {/if}
    </main>
  </div>
</div>

<style>
  .objective-page {
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
  .workspace-grid {
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
  .objective-list {
    display: grid;
    gap: 6px;
    margin-top: 10px;
  }
  .objective-list a {
    display: grid;
    gap: 5px;
    padding: 9px;
    border: 1px solid #e0e7ec;
    border-radius: 8px;
    background: #fafcfd;
    color: inherit;
    text-decoration: none;
  }
  .objective-list a.active {
    border-color: #79bde2;
    background: #edf8fe;
    box-shadow: inset 3px 0 var(--blue-700);
  }
  .objective-list a > div,
  .detail-head {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .objective-list strong {
    font-size: 9.5px;
    color: #315b75;
  }
  .objective-list p {
    margin: 0;
  }
  .objective-list small {
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
  .status.achieved {
    background: #e6f5e9;
    color: #2b6c39;
  }
  .status.not_achieved {
    background: #fdeaea;
    color: #8d3232;
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
  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
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
  .main-column {
    display: grid;
    gap: 12px;
    min-width: 0;
  }
  .detail,
  .history {
    padding: 14px;
  }
  blockquote {
    margin: 14px 0;
    padding: 10px 12px;
    border-left: 3px solid #79bde2;
    background: #f8fbfd;
    color: #314f62;
    font-size: 13px;
    line-height: 1.5;
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
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
  .criteria {
    margin-top: 12px;
    padding: 10px;
    border: 1px solid #e3e9ed;
    border-radius: 8px;
  }
  .criteria p {
    margin: 4px 0 0;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .version-list {
    display: grid;
    gap: 7px;
    margin-top: 10px;
  }
  .version-list article {
    padding: 9px;
    border: 1px solid #e1e8ec;
    border-radius: 8px;
    background: #fafcfd;
  }
  .version-list article > div {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .version-list p {
    margin: 5px 0;
  }
  .version-list small {
    color: #7d8d98;
    font-size: 8.5px;
  }
  .empty-copy,
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
  @media (max-width: 800px) {
    .hero,
    .workspace-grid,
    .form-grid {
      grid-template-columns: 1fr;
    }
    .register {
      position: static;
    }
  }
</style>
