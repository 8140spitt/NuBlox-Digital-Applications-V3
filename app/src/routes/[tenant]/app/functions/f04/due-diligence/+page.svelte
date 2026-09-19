<script lang="ts">
  let { data, form } = $props();
  function href(id: string) {
    return `/${data.tenantSlug}/app/functions/f04/due-diligence?matter=${encodeURIComponent(id)}`;
  }
</script>

<svelte:head><title>Due Diligence · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f04`}>F04 Corporate Development & M&A</a><span
      >›</span
    ><strong>F04.03 Due Diligence</strong>
  </nav>
  <header class="hero section-card">
    <div>
      <span class="eyebrow">F04.03 · AGG-22-LEGAL</span>
      <h1>Due diligence</h1>
      <p>
        Conduct financial, operational, technology, people, legal, tax and commercial/risk diligence
        inside a restricted Legal Matter.
      </p>
    </div>
    <div class="principle">
      <strong>Tenant permission is not enough</strong><span
        >Every matter also requires explicit Party access.</span
      ><small
        >Findings remain within the restricted matter; general business events carry only status and
        risk metadata.</small
      >
    </div>
  </header>
  {#if form?.message}<div class="message">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <span class="eyebrow">Restricted matter register</span>
      <h2>{data.matters.length} authorised matters</h2>
      <nav class="rows">
        {#each data.matters as item}<a
            class:active={data.selected?.id === item.id}
            href={href(item.id)}
            ><div><strong>{item.matterRef}</strong><span>{item.status}</span></div>
            <p>{item.title}</p>
            <small>{item.accessRole} · {item.privilegeClassification}</small></a
          >{:else}<p class="empty">No authorised Due Diligence matters.</p>{/each}
      </nav>
      {#if data.capabilities.canManage}
        <details class="command">
          <summary>Open Due Diligence matter</summary>
          <form method="POST" action="?/create">
            <label
              >Opportunity<select name="opportunityId" required
                ><option value="">Select opportunity</option
                >{#each data.opportunities.filter((o) => !['REJECTED', 'CONVERTED_CLOSED'].includes(o.status)) as opportunity}<option
                    value={opportunity.id}
                    >{opportunity.opportunityRef} · {opportunity.title}</option
                  >{/each}</select
              ></label
            >
            <label
              >Opportunity version<input
                name="opportunityVersion"
                type="number"
                min="1"
                required
              /></label
            >
            <div class="grid">
              <label>Matter reference<input name="matterRef" required /></label><label
                >Jurisdiction<select name="jurisdictionId"
                  ><option value="">Not specified</option
                  >{#each data.jurisdictions.filter((j) => j.status === 'ACTIVE') as jurisdiction}<option
                      value={jurisdiction.id}>{jurisdiction.code} · {jurisdiction.name}</option
                    >{/each}</select
                ></label
              >
            </div>
            <label>Title<input name="title" required /></label><label
              >Scope<textarea name="scopeSummary" rows="4" required></textarea></label
            >
            <div class="grid">
              <label
                >Owner Party ID<input
                  name="ownerPartyId"
                  placeholder="Defaults to current actor"
                /></label
              ><label>Counsel Party ID<input name="counselPartyId" /></label>
            </div>
            <div class="grid">
              <label>Privilege<input name="privilegeClassification" value="PRIVILEGED" /></label
              ><label
                >Confidentiality<input
                  name="confidentialityClassification"
                  value="STRICTLY_CONFIDENTIAL"
                /></label
              >
            </div>
            <button>Open restricted Legal Matter</button>
          </form>
        </details>
      {/if}
    </aside>

    <main>
      {#if data.selected}
        <section class="section-card detail">
          <div class="head">
            <div>
              <span class="eyebrow"
                >{data.selected.accessRole} · {data.selected.privilegeClassification}</span
              >
              <h2>{data.selected.matterRef} · {data.selected.title}</h2>
            </div>
            <span class="status">{data.selected.status}</span>
          </div>
          <p class="scope-text">{data.selected.scopeSummary}</p>
          <div class="facts">
            <span><small>Aggregate</small><strong>v{data.selected.aggregateVersion}</strong></span
            ><span
              ><small>Subject</small><strong
                >{data.opportunities.find((o) => o.id === data.selected?.subjectId)
                  ?.opportunityRef ?? data.selected.subjectId}</strong
              ></span
            ><span
              ><small>Confidentiality</small><strong
                >{data.selected.confidentialityClassification}</strong
              ></span
            ><span
              ><small>Workstreams</small><strong
                >{data.workstreams.filter((w) => w.status === 'COMPLETE').length}/{data.workstreams
                  .length} complete</strong
              ></span
            >
          </div>

          <section class="workstreams">
            <span class="eyebrow">Diligence workstreams</span>
            <div class="cards">
              {#each data.workstreams as row}
                <article>
                  <div class="head">
                    <strong>{row.workstreamType}</strong><span>{row.status}</span>
                  </div>
                  <p>{row.findingsSummary ?? 'No restricted findings recorded yet.'}</p>
                  <small>Risk {row.riskRating ?? '—'} · v{row.aggregateVersion}</small>
                  {#if data.capabilities.canManage && !['RESOLVED', 'CLOSED'].includes(data.selected.status)}
                    <details class="command">
                      <summary>Update restricted workstream</summary>
                      <form method="POST" action="?/workstream">
                        <input type="hidden" name="matterId" value={data.selected.id} /><input
                          type="hidden"
                          name="workstreamType"
                          value={row.workstreamType}
                        /><input
                          type="hidden"
                          name="aggregateVersion"
                          value={row.aggregateVersion}
                        />
                        <div class="grid">
                          <label
                            >Status<select name="status" value={row.status}
                              ><option>NOT_STARTED</option><option>IN_PROGRESS</option><option
                                >BLOCKED</option
                              ><option>COMPLETE</option></select
                            ></label
                          ><label
                            >Risk<select name="riskRating" value={row.riskRating ?? ''}
                              ><option value="">None</option><option>LOW</option><option
                                >MEDIUM</option
                              ><option>HIGH</option><option>CRITICAL</option></select
                            ></label
                          >
                        </div>
                        <label
                          >Findings<textarea name="findingsSummary" rows="3"
                            >{row.findingsSummary ?? ''}</textarea
                          ></label
                        ><label
                          >Conclusion<textarea name="conclusion" rows="3"
                            >{row.conclusion ?? ''}</textarea
                          ></label
                        ><label
                          >Evidence reference<input
                            name="evidenceReference"
                            value={row.evidenceReference ?? ''}
                          /></label
                        ><label
                          >Owner Party ID<input
                            name="ownerPartyId"
                            value={row.ownerPartyId}
                          /></label
                        ><button>Save restricted workstream</button>
                      </form>
                    </details>
                  {/if}
                </article>
              {/each}
            </div>
          </section>

          {#if data.capabilities.canManage && !['RESOLVED', 'CLOSED'].includes(data.selected.status)}
            <form method="POST" action="?/resolve" class="actions">
              <input type="hidden" name="matterId" value={data.selected.id} /><input
                type="hidden"
                name="aggregateVersion"
                value={data.selected.aggregateVersion}
              /><button>Resolve when all seven workstreams are complete</button>
            </form>
          {/if}
          {#if data.capabilities.canManage && data.selected.status === 'RESOLVED'}
            <form method="POST" action="?/close" class="actions">
              <input type="hidden" name="matterId" value={data.selected.id} /><input
                type="hidden"
                name="aggregateVersion"
                value={data.selected.aggregateVersion}
              /><button>Close Due Diligence matter</button>
            </form>
          {/if}

          {#if data.capabilities.canAccessManage && data.selected.accessRole === 'MATTER_MANAGER'}
            <section class="access">
              <span class="eyebrow">Need-to-know access</span>
              <div class="rows">
                {#each data.access as grant}<article>
                    <div>
                      <strong>{grant.partyId}</strong><span
                        >{grant.accessRole} · {grant.status}</span
                      >
                    </div>
                    {#if grant.status === 'ACTIVE' && grant.partyId !== data.selected.ownerPartyId}<form
                        method="POST"
                        action="?/revoke"
                        class="inline"
                      >
                        <input type="hidden" name="matterId" value={data.selected.id} /><input
                          type="hidden"
                          name="partyId"
                          value={grant.partyId}
                        /><button class="quiet">Revoke</button>
                      </form>{/if}
                  </article>{/each}
              </div>
              <form method="POST" action="?/grant" class="grant">
                <input type="hidden" name="matterId" value={data.selected.id} /><label
                  >Party ID<input name="partyId" required /></label
                ><label
                  >Access role<select name="accessRole"
                    ><option>REVIEWER</option><option>COUNSEL</option><option>MATTER_MANAGER</option
                    ></select
                  ></label
                ><button>Grant access</button>
              </form>
            </section>
          {/if}
        </section>
      {:else}<section class="section-card empty-state">
          <h2>Open the first Due Diligence matter</h2>
          <p>
            The matter automatically creates seven restricted workstreams and grants need-to-know
            access to the authorised matter team.
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
    background: linear-gradient(120deg, #fbfdff, #f4eef9);
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
    border: 1px solid #d5c8df;
    border-radius: 9px;
    background: #fff;
  }
  .principle strong {
    font-size: 11px;
    color: #574868;
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
    border-color: #9e88b5;
    background: #f7f2fb;
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
  .scope-text {
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
  .workstreams,
  .access {
    margin-top: 12px;
    padding: 10px;
    border: 1px solid #dfe7ec;
    border-radius: 8px;
  }
  .cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
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
  .command {
    margin-top: 10px;
    border-top: 1px solid #e4eaee;
    padding-top: 8px;
  }
  .command summary {
    cursor: pointer;
    font-size: 9px;
    font-weight: 800;
    color: #574868;
  }
  form {
    display: grid;
    gap: 7px;
    margin-top: 8px;
  }
  form.inline {
    display: flex;
    margin: 0;
  }
  .grant {
    grid-template-columns: 1fr 180px auto;
    align-items: end;
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
  .quiet {
    background: white;
    color: #52697a;
    border: 1px solid #ccd8e0;
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
  @media (max-width: 950px) {
    .cards {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 850px) {
    .hero,
    .workspace,
    .grid,
    .facts,
    .grant {
      grid-template-columns: 1fr;
    }
    .register {
      position: static;
    }
  }
</style>
