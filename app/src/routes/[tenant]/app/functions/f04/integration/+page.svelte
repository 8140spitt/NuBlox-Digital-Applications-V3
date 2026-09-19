<script lang="ts">
  let { data, form } = $props();

  function href(id: string) {
    return `/${data.tenantSlug}/app/functions/f04/integration?initiative=${encodeURIComponent(id)}`;
  }

  function sourceCase(id: string | null) {
    return data.businessCases.find((row) => row.id === id);
  }
</script>

<svelte:head><title>Integration · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f04`}>F04 Corporate Development & M&A</a>
    <span>›</span>
    <strong>F04.05 Integration</strong>
  </nav>

  <header class="hero section-card">
    <div>
      <span class="eyebrow">F04.05 · AGG-26-TRANSFORMATION</span>
      <h1>Integration</h1>
      <p>
        Mobilise post-transaction integration as a governed Transformation Initiative over
        organisation, systems and policy, anchored to an approved Corporate Development Business
        Case.
      </p>
    </div>
    <div class="principle">
      <strong>Integration Initiative ≠ Project</strong>
      <span>The initiative governs transformation outcomes and adoption.</span>
      <small
        >Programme, project, Organisation Unit, systems and policy identities remain owned by their
        canonical domains.</small
      >
    </div>
  </header>

  {#if form?.message}<div class="message">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <span class="eyebrow">Integration register</span>
      <h2>{data.initiatives.length} initiatives</h2>

      <nav class="rows">
        {#each data.initiatives as item}
          <a class:active={data.selected?.id === item.id} href={href(item.id)}>
            <div><strong>{item.initiativeRef}</strong><span>{item.status}</span></div>
            <p>{item.title}</p>
            <small
              >{sourceCase(item.sourceSubjectId)?.caseRef ??
                item.sourceSubjectId ??
                'No source case'}</small
            >
          </a>
        {:else}
          <p class="empty">No M&A Integration initiatives.</p>
        {/each}
      </nav>

      {#if data.canManage}
        <details class="command">
          <summary>Mobilise integration initiative</summary>
          <form method="POST" action="?/create">
            <label
              >Approved Business Case
              <select name="businessCaseId" required>
                <option value="">Select case</option>
                {#each data.businessCases as item}
                  <option value={item.id}>{item.caseRef} · {item.title}</option>
                {/each}
              </select>
            </label>
            <div class="grid">
              <label>Reference<input name="initiativeRef" required /></label>
              <label
                >Owner Party ID<input
                  name="ownerPartyId"
                  placeholder="Defaults to current actor"
                /></label
              >
            </div>
            <label>Title<input name="title" required /></label>
            <label
              >Sponsor Party ID<input
                name="sponsorPartyId"
                placeholder="Defaults to current actor"
              /></label
            >
            <label
              >Purpose & outcomes<textarea name="purposeOutcomes" rows="4" required
              ></textarea></label
            >
            <label>Affected scope<textarea name="affectedScope" rows="4" required></textarea></label
            >
            <label>Benefits<textarea name="benefitsSummary" rows="3" required></textarea></label>
            <label>Impacts<textarea name="impactsSummary" rows="3" required></textarea></label>
            <label
              >Readiness criteria<textarea name="readinessCriteria" rows="3" required
              ></textarea></label
            >
            <label
              >Adoption criteria<textarea name="adoptionCriteria" rows="3" required
              ></textarea></label
            >
            <button>Create Transformation Initiative</button>
          </form>
        </details>
      {/if}
    </aside>

    <main>
      {#if data.selected}
        <section class="section-card detail">
          <div class="head">
            <div>
              <span class="eyebrow">M&A Integration</span>
              <h2>{data.selected.initiativeRef} · {data.selected.title}</h2>
            </div>
            <span class="status">{data.selected.status}</span>
          </div>

          <p class="purpose">{data.selected.purposeOutcomes}</p>

          <div class="facts">
            <span><small>Aggregate</small><strong>v{data.selected.aggregateVersion}</strong></span>
            <span
              ><small>Source case</small><strong
                >{sourceCase(data.selected.sourceSubjectId)?.caseRef ??
                  data.selected.sourceSubjectId ??
                  '—'}</strong
              ></span
            >
            <span
              ><small>Workstreams</small><strong
                >{data.workstreams.filter((row) => row.status === 'COMPLETED').length}/{data
                  .workstreams.length}</strong
              ></span
            >
            <span
              ><small>Average progress</small><strong
                >{data.workstreams.length
                  ? (
                      data.workstreams.reduce(
                        (total, row) => total + Number(row.progressPercent),
                        0
                      ) / data.workstreams.length
                    ).toFixed(0)
                  : 0}%</strong
              ></span
            >
          </div>

          <div class="two">
            <section>
              <span class="eyebrow">Affected scope</span>
              <p>{data.selected.affectedScope}</p>
            </section>
            <section>
              <span class="eyebrow">Benefits</span>
              <p>{data.selected.benefitsSummary}</p>
            </section>
            <section>
              <span class="eyebrow">Impacts</span>
              <p>{data.selected.impactsSummary}</p>
            </section>
            <section>
              <span class="eyebrow">Readiness / adoption</span>
              <p>{data.selected.readinessCriteria}</p>
              <p>{data.selected.adoptionCriteria}</p>
            </section>
          </div>

          <section class="workstreams">
            <span class="eyebrow">Integration workstreams</span>
            <div class="cards">
              {#each data.workstreams as row}
                <article>
                  <div class="head">
                    <strong>{row.workstreamType} · {row.title}</strong><span>{row.status}</span>
                  </div>
                  <p>{row.scopeSummary}</p>
                  <small>{Number(row.progressPercent).toFixed(0)}% · v{row.aggregateVersion}</small>
                  <div class="progress">
                    <span style:width={`${Number(row.progressPercent)}%`}></span>
                  </div>
                  {#if data.canManage && !['COMPLETED', 'STOPPED', 'CLOSED'].includes(data.selected.status)}
                    <details class="command">
                      <summary>Update workstream</summary>
                      <form method="POST" action="?/workstream">
                        <input type="hidden" name="initiativeId" value={data.selected.id} />
                        <input type="hidden" name="workstreamType" value={row.workstreamType} />
                        <input
                          type="hidden"
                          name="workstreamVersion"
                          value={row.aggregateVersion}
                        />
                        <div class="grid">
                          <label
                            >Status
                            <select name="status" value={row.status}>
                              <option>PLANNED</option>
                              <option>IN_PROGRESS</option>
                              <option>BLOCKED</option>
                              <option>COMPLETED</option>
                            </select>
                          </label>
                          <label
                            >Progress %
                            <input
                              name="progressPercent"
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={Number(row.progressPercent)}
                              required
                            />
                          </label>
                        </div>
                        <label
                          >Owner Party ID<input
                            name="ownerPartyId"
                            value={row.ownerPartyId}
                          /></label
                        >
                        <label
                          >Scope<textarea name="scopeSummary" rows="3">{row.scopeSummary}</textarea
                          ></label
                        >
                        <label
                          >Success criteria<textarea name="successCriteria" rows="3"
                            >{row.successCriteria}</textarea
                          ></label
                        >
                        <button>Update governed workstream</button>
                      </form>
                    </details>
                  {/if}
                </article>
              {/each}
            </div>
          </section>

          {#if data.canManage}
            <form method="POST" action="?/transition" class="actions">
              <input type="hidden" name="initiativeId" value={data.selected.id} />
              <input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion} />
              {#if data.selected.status === 'PROPOSED'}<button name="action" value="ASSESS"
                  >Start assessment</button
                >{/if}
              {#if data.selected.status === 'ASSESSMENT'}<button name="action" value="PRIORITISE"
                  >Prioritise</button
                >{/if}
              {#if data.selected.status === 'PRIORITISED'}<button name="action" value="APPROVE"
                  >Approve integration</button
                >{/if}
              {#if data.selected.status === 'APPROVED'}<button name="action" value="MOBILISE"
                  >Mobilise</button
                >{/if}
              {#if data.selected.status === 'MOBILISING'}<button name="action" value="ACTIVATE"
                  >Activate</button
                >{/if}
              {#if data.selected.status === 'ACTIVE'}<button name="action" value="TRANSITION"
                  >Enter transition</button
                >{/if}
              {#if ['ACTIVE', 'TRANSITIONING'].includes(data.selected.status)}<button
                  name="action"
                  value="COMPLETE">Complete when workstreams are complete</button
                >{/if}
              {#if !['COMPLETED', 'STOPPED', 'CLOSED'].includes(data.selected.status)}<button
                  class="danger"
                  name="action"
                  value="STOP">Stop initiative</button
                >{/if}
            </form>
          {/if}
        </section>
      {:else}
        <section class="section-card empty-state">
          <h2>Mobilise the first Integration Initiative</h2>
          <p>
            Start from an approved Corporate Development Business Case and govern organisation,
            systems and policy transition through the shared transformation boundary.
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
    background: linear-gradient(120deg, #fbfdff, #edf8f4);
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
    border: 1px solid #c8e1d8;
    border-radius: 9px;
    background: #fff;
  }
  .principle strong {
    font-size: 11px;
    color: #3c6757;
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
    border-color: #7bbfa8;
    background: #f0faf6;
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
  .purpose {
    font-size: 11px;
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
  .workstreams {
    padding: 10px;
    border: 1px solid #dfe7ec;
    border-radius: 8px;
  }
  .workstreams {
    margin-top: 10px;
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 8px;
  }
  .cards article {
    padding: 9px;
    border: 1px solid #dfe7ec;
    border-radius: 7px;
    background: #fafcfd;
  }
  .cards strong {
    font-size: 9px;
  }
  .cards small {
    font-size: 8px;
    color: #718693;
  }
  .progress {
    height: 4px;
    margin-top: 7px;
    background: #e8edf0;
    border-radius: 99px;
    overflow: hidden;
  }
  .progress span {
    display: block;
    height: 100%;
    background: #4d8d78;
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
    color: #3c6757;
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
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
  }
  .danger {
    background: #843e3e;
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
  @media (max-width: 1050px) {
    .cards {
      grid-template-columns: 1fr 1fr;
    }
  }
  @media (max-width: 850px) {
    .hero,
    .workspace,
    .grid,
    .facts,
    .two,
    .cards {
      grid-template-columns: 1fr;
    }
    .register {
      position: static;
    }
  }
</style>
