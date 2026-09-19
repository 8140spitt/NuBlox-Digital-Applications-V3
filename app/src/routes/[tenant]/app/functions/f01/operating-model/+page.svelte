<script lang="ts">
  let { data, form } = $props();
  function href(id: string) {
    return `/${data.tenantSlug}/app/functions/f01/operating-model?model=${encodeURIComponent(id)}`;
  }
  function capabilityRows() {
    return data.capabilityRows
      .map((row) =>
        [row.capabilityKey, row.name, row.criticality, row.deliveryModel, row.description].join(
          ' | '
        )
      )
      .join('\n');
  }
  function accountabilityRows() {
    return data.accountabilityRows
      .map((row) =>
        [
          row.accountabilityKey,
          row.accountableRoleKey ?? row.accountablePartyId ?? '',
          row.responsibility,
          row.decisionRights
        ].join(' | ')
      )
      .join('\n');
  }
</script>

<svelte:head><title>Operating Model · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f01`}>F01 Strategy & Enterprise Planning</a><span
      >›</span
    ><strong>F01.05 Operating Model</strong>
  </nav>
  <header class="hero section-card">
    <div>
      <span class="eyebrow">F01.05 · AGG-02-STRATEGY</span>
      <h1>Operating model</h1>
      <p>
        Design the capabilities, structures, decision rights and shared-service model required to
        execute strategy without confusing target design with the live Organisation hierarchy.
      </p>
    </div>
    <div class="principle">
      <strong>Target design ≠ live organisation</strong><span
        >Operating Model versions describe how the organisation should operate.</span
      ><small
        >Actual Organisation Units, positions and workers remain authoritative in their owning
        domains.</small
      >
    </div>
  </header>
  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <div>
        <span class="eyebrow">Model register</span>
        <h2>{data.models.length} models</h2>
      </div>
      <nav class="model-list">
        {#each data.models as item}<a
            class:active={data.selected?.id === item.id}
            href={href(item.id)}
            ><div>
              <strong>{item.modelRef}</strong><span class={'status ' + item.status.toLowerCase()}
                >{item.status}</span
              >
            </div>
            <p>{item.name}</p>
            <small>Strategy v{item.frameworkVersionNo} · model v{item.currentVersionNo}</small></a
          >{:else}<p class="empty">No target Operating Model yet.</p>{/each}
      </nav>

      {#if data.capabilities.canManage}
        <details class="command">
          <summary>Create target model</summary>
          <form method="POST" action="?/create">
            <label>Reference<input name="modelRef" required placeholder="TOM-2027" /></label>
            <label
              >Name<input name="name" required placeholder="2027 Target Operating Model" /></label
            >
            <label
              >Published strategy<select name="frameworkId" required
                ><option value="">Select strategy</option>{#each data.frameworks as item}<option
                    value={item.id}>{item.title} · v{item.currentVersion}</option
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
            <div class="grid">
              <label>Scope type<input name="scopeType" required value="TENANT" /></label><label
                >Scope ID<input name="scopeId" required /></label
              >
            </div>
            <label
              >Current-state assessment<textarea name="currentStateSummary" rows="3" required
              ></textarea></label
            >
            <label
              >Target-state definition<textarea name="targetStateSummary" rows="3" required
              ></textarea></label
            >
            <label
              >Design principles<textarea name="designPrinciples" rows="3" required
              ></textarea></label
            >
            <label
              >Centralisation / decentralisation<textarea
                name="centralisationModel"
                rows="3"
                required></textarea></label
            >
            <label
              >Shared-service requirements<textarea
                name="sharedServiceRequirements"
                rows="3"
                required></textarea></label
            >
            <label
              >Organisation-model reference<input
                name="organisationModelReference"
                placeholder="Optional target model reference"
              /></label
            >
            <label
              >Change initiatives<textarea name="changeInitiativesSummary" rows="3" required
              ></textarea></label
            >
            <label
              >Capabilities<textarea name="capabilities" rows="6" required></textarea><small
                >KEY | Name | CRITICAL/IMPORTANT/ENABLING |
                CENTRALISED/DECENTRALISED/SHARED_SERVICE/HYBRID/OUTSOURCED | Description</small
              ></label
            >
            <label
              >Accountabilities<textarea name="accountabilities" rows="6" required></textarea><small
                >KEY | Role key | Responsibility | Decision rights</small
              ></label
            >
            <button>Create draft model</button>
          </form>
        </details>
      {/if}
    </aside>

    <main class="main">
      {#if data.selected}
        <section class="section-card detail">
          <div class="head">
            <div>
              <span class="eyebrow">Strategy v{data.selected.frameworkVersionNo}</span>
              <h2>{data.selected.modelRef} · {data.selected.name}</h2>
            </div>
            <span class={'status large ' + data.selected.status.toLowerCase()}
              >{data.selected.status}</span
            >
          </div>
          <div class="facts">
            <span
              ><small>Model version</small><strong>v{data.selected.currentVersionNo}</strong></span
            ><span><small>Aggregate</small><strong>v{data.selected.aggregateVersion}</strong></span
            ><span><small>Capabilities</small><strong>{data.capabilityRows.length}</strong></span
            ><span
              ><small>Accountabilities</small><strong>{data.accountabilityRows.length}</strong
              ></span
            >
          </div>
          <div class="cards">
            <article>
              <span class="eyebrow">Current state</span>
              <p>{data.selected.currentStateSummary}</p>
            </article>
            <article>
              <span class="eyebrow">Target state</span>
              <p>{data.selected.targetStateSummary}</p>
            </article>
            <article>
              <span class="eyebrow">Centralisation model</span>
              <p>{data.selected.centralisationModel}</p>
            </article>
            <article>
              <span class="eyebrow">Shared services</span>
              <p>{data.selected.sharedServiceRequirements}</p>
            </article>
          </div>

          <div class="tables">
            <section>
              <span class="eyebrow">Target capabilities</span>
              <table>
                <thead><tr><th>Capability</th><th>Criticality</th><th>Delivery</th></tr></thead
                ><tbody
                  >{#each data.capabilityRows as row}<tr
                      ><td><strong>{row.name}</strong><small>{row.description}</small></td><td
                        >{row.criticality}</td
                      ><td>{row.deliveryModel}</td></tr
                    >{/each}</tbody
                >
              </table>
            </section>
            <section>
              <span class="eyebrow">Accountabilities</span>
              <table>
                <thead
                  ><tr><th>Responsibility</th><th>Accountable</th><th>Decision rights</th></tr
                  ></thead
                ><tbody
                  >{#each data.accountabilityRows as row}<tr
                      ><td>{row.responsibility}</td><td
                        >{row.accountableRoleKey ?? row.accountablePartyId ?? '—'}</td
                      ><td>{row.decisionRights}</td></tr
                    >{/each}</tbody
                >
              </table>
            </section>
          </div>

          <div class="actions">
            {#if data.capabilities.canManage && data.selected.status === 'DRAFT'}<form
                method="POST"
                action="?/submit"
              >
                <input type="hidden" name="modelId" value={data.selected.id} /><input
                  type="hidden"
                  name="aggregateVersion"
                  value={data.selected.aggregateVersion}
                /><button>Submit for review</button>
              </form>{/if}
            {#if data.capabilities.canApprove && data.selected.status === 'IN_REVIEW'}<form
                method="POST"
                action="?/approve"
              >
                <input type="hidden" name="modelId" value={data.selected.id} /><input
                  type="hidden"
                  name="aggregateVersion"
                  value={data.selected.aggregateVersion}
                /><input name="reason" required placeholder="Approval rationale" /><button
                  >Approve target model</button
                >
              </form>{/if}
            {#if data.capabilities.canApprove && data.selected.status === 'APPROVED'}<form
                method="POST"
                action="?/activate"
              >
                <input type="hidden" name="modelId" value={data.selected.id} /><input
                  type="hidden"
                  name="aggregateVersion"
                  value={data.selected.aggregateVersion}
                /><button>Activate model</button>
              </form>{/if}
            {#if data.capabilities.canApprove && data.selected.status === 'ACTIVE'}<form
                method="POST"
                action="?/supersede"
              >
                <input type="hidden" name="modelId" value={data.selected.id} /><input
                  type="hidden"
                  name="aggregateVersion"
                  value={data.selected.aggregateVersion}
                /><button class="quiet">Supersede</button>
              </form>{/if}
          </div>

          {#if data.capabilities.canManage && (data.selected.status === 'DRAFT' || data.selected.status === 'ACTIVE')}
            <details class="command">
              <summary>Create revised model version</summary>
              <form method="POST" action="?/revise">
                <input type="hidden" name="modelId" value={data.selected.id} /><input
                  type="hidden"
                  name="aggregateVersion"
                  value={data.selected.aggregateVersion}
                />
                <label
                  >Current-state assessment<textarea name="currentStateSummary" rows="3" required
                    >{data.selected.currentStateSummary}</textarea
                  ></label
                >
                <label
                  >Target-state definition<textarea name="targetStateSummary" rows="3" required
                    >{data.selected.targetStateSummary}</textarea
                  ></label
                >
                <label
                  >Design principles<textarea name="designPrinciples" rows="3" required
                    >{data.selected.designPrinciples}</textarea
                  ></label
                >
                <label
                  >Centralisation model<textarea name="centralisationModel" rows="3" required
                    >{data.selected.centralisationModel}</textarea
                  ></label
                >
                <label
                  >Shared-service requirements<textarea
                    name="sharedServiceRequirements"
                    rows="3"
                    required>{data.selected.sharedServiceRequirements}</textarea
                  ></label
                >
                <label
                  >Organisation-model reference<input
                    name="organisationModelReference"
                    value={data.selected.organisationModelReference ?? ''}
                  /></label
                >
                <label
                  >Change initiatives<textarea name="changeInitiativesSummary" rows="3" required
                    >{data.selected.changeInitiativesSummary}</textarea
                  ></label
                >
                <label
                  >Capabilities<textarea
                    name="capabilities"
                    rows="6"
                    required
                    value={capabilityRows()}></textarea></label
                >
                <label
                  >Accountabilities<textarea
                    name="accountabilities"
                    rows="6"
                    required
                    value={accountabilityRows()}></textarea></label
                >
                <button>Create revised draft</button>
              </form>
            </details>
          {/if}
        </section>
        <section class="section-card history">
          <span class="eyebrow">Version history</span>
          <h2>{data.versions.length} versions</h2>
          <div class="versions">
            {#each data.versions as version}<article>
                <strong>v{version.versionNo}</strong><span
                  class={'status ' + version.lifecycleStatus.toLowerCase()}
                  >{version.lifecycleStatus}</span
                >
                <p>{version.targetStateSummary}</p>
                {#if version.approvalDecisionId}<small
                    >Decision · {version.approvalDecisionId.slice(0, 8)}</small
                  >{/if}
              </article>{/each}
          </div>
        </section>
      {:else}
        <section class="section-card empty-state">
          <h2>Create the first target Operating Model</h2>
          <p>
            Use a published Strategy Framework to define the target capabilities, structures and
            accountabilities required to execute it.
          </p>
        </section>
      {/if}
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
    grid-template-columns: 340px minmax(0, 1fr);
    gap: 12px;
    align-items: start;
  }
  .register {
    position: sticky;
    top: 78px;
    padding: 12px;
  }
  .model-list {
    display: grid;
    gap: 6px;
    margin-top: 10px;
  }
  .model-list a {
    display: grid;
    gap: 5px;
    padding: 9px;
    border: 1px solid #e0e7ec;
    border-radius: 8px;
    background: #fafcfd;
    color: inherit;
    text-decoration: none;
  }
  .model-list a.active {
    border-color: #79bde2;
    background: #edf8fe;
    box-shadow: inset 3px 0 var(--blue-700);
  }
  .model-list a > div,
  .head {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .model-list strong {
    font-size: 9.5px;
    color: #315b75;
  }
  .model-list p {
    margin: 0;
  }
  .model-list small {
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
  .status.approved {
    background: #e6f5e9;
    color: #2b6c39;
  }
  .status.in_review,
  .status.review {
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
  .cards,
  .tables {
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
  .history {
    padding: 14px;
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 12px 0;
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
  .cards article {
    padding: 10px;
    border: 1px solid #e3e9ed;
    border-radius: 8px;
    background: #fafcfd;
  }
  .cards p {
    margin: 4px 0 0;
  }
  .tables {
    margin-top: 12px;
  }
  .tables section {
    min-width: 0;
  }
  .tables table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6px;
    font-size: 8.5px;
  }
  .tables th,
  .tables td {
    padding: 6px;
    border-bottom: 1px solid #e7ecef;
    text-align: left;
    vertical-align: top;
  }
  .tables td strong,
  .tables td small {
    display: block;
  }
  .tables td small {
    margin-top: 2px;
    color: #81909a;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }
  .actions form {
    display: flex;
    margin: 0;
  }
  .versions {
    display: grid;
    gap: 7px;
    margin-top: 10px;
  }
  .versions article {
    display: grid;
    grid-template-columns: auto auto 1fr;
    gap: 7px;
    align-items: center;
    padding: 9px;
    border: 1px solid #e1e8ec;
    border-radius: 8px;
  }
  .versions p {
    margin: 0;
  }
  .versions small {
    grid-column: 3;
    color: #7d8d98;
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
    .cards,
    .tables {
      grid-template-columns: 1fr;
    }
    .register {
      position: static;
    }
  }
</style>
