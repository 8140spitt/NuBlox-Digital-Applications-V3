<script lang="ts">
  let { data, form } = $props();

  function href(id: string) {
    return `/${data.tenantSlug}/app/functions/f02/ethics-governance?case=${encodeURIComponent(id)}`;
  }

  function transitions(status: string) {
    const result: string[] = [];
    if (status === 'REPORTED' && data.capabilities.canManage) result.push('TRIAGE');
    if (status === 'TRIAGE' && data.capabilities.canManage) result.push('OPEN', 'UNSUBSTANTIATED');
    if (status === 'OPEN') {
      if (data.capabilities.canInvestigate) result.push('INVESTIGATING');
      if (data.capabilities.canDecide) result.push('CLOSED');
    }
    if (status === 'INVESTIGATING') {
      if (data.capabilities.canDecide) result.push('DECISION_ACTION');
      if (data.capabilities.canManage) result.push('OPEN');
    }
    if (status === 'DECISION_ACTION') {
      if (data.capabilities.canDecide) result.push('APPEAL_REVIEW', 'CLOSED');
      if (data.capabilities.canInvestigate) result.push('INVESTIGATING');
    }
    if (status === 'APPEAL_REVIEW') {
      if (data.capabilities.canInvestigate) result.push('INVESTIGATING');
      if (data.capabilities.canDecide) result.push('DECISION_ACTION', 'CLOSED');
    }
    return [...new Set(result)];
  }
</script>

<svelte:head><title>Ethics Governance · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f02`}>F02 Corporate Governance</a>
    <span>›</span>
    <strong>F02.07 Ethics Governance</strong>
  </nav>

  <header class="hero section-card">
    <div>
      <span class="eyebrow">F02.07 · AGG-21-CASE · INTEGRITY-CASE</span>
      <h1>Ethics governance</h1>
      <p>
        Govern conduct, conflict, fraud and ethics concerns through restricted cases with
        attributable triage, investigation, evidence, decisions and follow-up.
      </p>
    </div>
    <div class="principle">
      <strong>Need-to-know is enforced server-side</strong>
      <span>Tenant permission alone never exposes an Integrity Case.</span>
      <small>Every case requires an explicit active Party access grant.</small>
    </div>
  </header>

  {#if form?.message}<div class="message">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <div>
        <span class="eyebrow">Restricted register</span>
        <h2>{data.cases.length} accessible cases</h2>
      </div>

      <nav class="cases">
        {#each data.cases as item}
          <a class:active={data.selected?.id === item.id} href={href(item.id)}>
            <div>
              <strong>{item.caseRef}</strong><span class={'status ' + item.status.toLowerCase()}
                >{item.status}</span
              >
            </div>
            <p>{item.title}</p>
            <small>{item.caseType} · {item.severity} · {item.accessRole}</small>
          </a>
        {:else}
          <p class="empty">No Integrity Cases are accessible to the current Party.</p>
        {/each}
      </nav>

      {#if data.capabilities.canCreate}
        <details class="command">
          <summary>Report integrity case</summary>
          <form method="POST" action="?/create">
            <div class="grid">
              <label>Case reference<input name="caseRef" required /></label>
              <label
                >Case type<select name="caseType"
                  ><option>CONDUCT</option><option>CONFLICT_OF_INTEREST</option><option
                    >FRAUD</option
                  ><option>WHISTLEBLOWING</option><option>DECLARATION</option><option>OTHER</option
                  ></select
                ></label
              >
              <label
                >Severity<select name="severity"
                  ><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option
                    >CRITICAL</option
                  ></select
                ></label
              >
              <label>Received at<input name="receivedAt" type="datetime-local" /></label>
            </div>
            <label>Title<input name="title" required /></label>
            <label>Issue summary<textarea name="issueSummary" rows="5" required></textarea></label>
            <div class="grid">
              <label>Source type<input name="sourceType" required placeholder="SPEAK_UP" /></label>
              <label>Source reference<input name="sourceReference" /></label>
              <label>Reporter Party ID<input name="reportedByPartyId" /></label>
            </div>
            <label
              >Subjects<textarea name="subjects" rows="4"></textarea><small
                >Party ID | SUBJECT / WITNESS / RELATED</small
              ></label
            >
            <button>Report restricted case</button>
          </form>
        </details>
      {/if}
    </aside>

    <main class="main">
      {#if data.selected}
        <section class="section-card detail">
          <div class="head">
            <div>
              <span class="eyebrow">{data.selected.caseType} · {data.selected.accessRole}</span>
              <h2>{data.selected.caseRef} · {data.selected.title}</h2>
            </div>
            <span class={'status large ' + data.selected.status.toLowerCase()}
              >{data.selected.status}</span
            >
          </div>

          <div class="facts">
            <span><small>Aggregate</small><strong>v{data.selected.aggregateVersion}</strong></span>
            <span><small>Severity</small><strong>{data.selected.severity}</strong></span>
            <span><small>Subjects</small><strong>{data.subjectRows.length}</strong></span>
            <span><small>Evidence</small><strong>{data.evidence.length}</strong></span>
            <span><small>Decisions</small><strong>{data.decisions.length}</strong></span>
            <span><small>Actions</small><strong>{data.actions.length}</strong></span>
          </div>

          <section class="sensitive">
            <span class="eyebrow">Restricted case information</span>
            <p>{data.selected.issueSummary}</p>
            <div class="meta">
              <span>Source: <strong>{data.selected.sourceType}</strong></span>
              <span
                >Received: <strong
                  >{new Date(data.selected.receivedAt).toLocaleString('en-GB')}</strong
                ></span
              >
              <span
                >Owner: <strong>{data.selected.investigationOwnerPartyId ?? 'Not assigned'}</strong
                ></span
              >
            </div>
            {#if data.selected.impactSummary}<p>
                <strong>Impact:</strong>
                {data.selected.impactSummary}
              </p>{/if}
            {#if data.selected.outcomeSummary}<p>
                <strong>Outcome:</strong>
                {data.selected.outcomeSummary}
              </p>{/if}
          </section>

          <div class="two">
            <section>
              <span class="eyebrow">Case subjects</span>
              <div class="rows">
                {#each data.subjectRows as row}<article>
                    <div><strong>{row.subjectRole}</strong></div>
                    <small>{row.partyId}</small>
                  </article>
                {:else}<p class="empty">No Party subjects recorded.</p>{/each}
              </div>
              {#if data.capabilities.canManage}
                <details class="command">
                  <summary>Add subject</summary>
                  <form method="POST" action="?/subject">
                    <input type="hidden" name="caseId" value={data.selected.id} />
                    <label>Party ID<input name="partyId" required /></label>
                    <label
                      >Subject role<input
                        name="subjectRole"
                        required
                        placeholder="SUBJECT"
                      /></label
                    >
                    <button>Add subject</button>
                  </form>
                </details>
              {/if}
            </section>

            <section>
              <span class="eyebrow">Governed evidence</span>
              <div class="rows">
                {#each data.evidence as row}<article>
                    <div><strong>{row.evidenceType}</strong><span>{row.status}</span></div>
                    <p>{row.contentReference}</p>
                    <small>{row.linkType} · {row.classification ?? 'unclassified'}</small>
                  </article>
                {:else}<p class="empty">No Evidence Items linked.</p>{/each}
              </div>
              {#if data.capabilities.canInvestigate}
                <details class="command">
                  <summary>Link evidence</summary>
                  <form method="POST" action="?/evidence">
                    <input type="hidden" name="caseId" value={data.selected.id} />
                    <label>Evidence Item ID<input name="evidenceItemId" required /></label>
                    <label>Link type<input name="linkType" required value="INVESTIGATION" /></label>
                    <button>Link governed evidence</button>
                  </form>
                </details>
              {/if}
            </section>
          </div>

          {#if data.capabilities.canManage}
            <details class="command">
              <summary>Assign investigation owner</summary>
              <form method="POST" action="?/owner">
                <input type="hidden" name="caseId" value={data.selected.id} />
                <input
                  type="hidden"
                  name="aggregateVersion"
                  value={data.selected.aggregateVersion}
                />
                <label>Investigator Party ID<input name="partyId" required /></label>
                <button>Assign owner</button>
              </form>
            </details>
          {/if}

          {#if data.capabilities.canManageAccess}
            <section class="access">
              <span class="eyebrow">Need-to-know access</span>
              <div class="rows">
                {#each data.accessRows as row}
                  <article>
                    <div><strong>{row.accessRole}</strong><span>{row.status}</span></div>
                    <small>{row.partyId}</small>
                    {#if row.status === 'ACTIVE' && row.partyId !== data.selected.investigationOwnerPartyId}
                      <form method="POST" action="?/revokeAccess">
                        <input type="hidden" name="caseId" value={data.selected.id} />
                        <input type="hidden" name="partyId" value={row.partyId} />
                        <button class="quiet">Revoke</button>
                      </form>
                    {/if}
                  </article>
                {/each}
              </div>
              <details class="command">
                <summary>Grant access</summary>
                <form method="POST" action="?/grantAccess">
                  <input type="hidden" name="caseId" value={data.selected.id} />
                  <label>Party ID<input name="partyId" required /></label>
                  <label
                    >Access role<select name="accessRole"
                      ><option>INVESTIGATOR</option><option>DECISION_AUTHORITY</option><option
                        >OBSERVER</option
                      ><option>CASE_MANAGER</option></select
                    ></label
                  >
                  <button>Grant case access</button>
                </form>
              </details>
            </section>
          {/if}

          {#if data.capabilities.canInvestigate}
            <details class="command" open>
              <summary>Record investigation entry</summary>
              <form method="POST" action="?/entry">
                <input type="hidden" name="caseId" value={data.selected.id} />
                <label
                  >Entry type<select name="entryType"
                    ><option>TRIAGE_NOTE</option><option>INVESTIGATION_NOTE</option><option
                      >INTERVIEW_NOTE</option
                    ><option>NOTIFICATION</option><option>REVIEW_NOTE</option></select
                  ></label
                >
                <label>Summary<textarea name="summary" rows="4" required></textarea></label>
                <button>Record append-only entry</button>
              </form>
            </details>
          {/if}

          {#if transitions(data.selected.status).length}
            <details class="command">
              <summary>Advance case</summary>
              <form method="POST" action="?/transition">
                <input type="hidden" name="caseId" value={data.selected.id} />
                <input
                  type="hidden"
                  name="aggregateVersion"
                  value={data.selected.aggregateVersion}
                />
                <label
                  >Next state<select name="toStatus"
                    >{#each transitions(data.selected.status) as state}<option value={state}
                        >{state.replaceAll('_', ' ')}</option
                      >{/each}</select
                  ></label
                >
                <label
                  >Transition rationale<textarea name="summary" rows="3" required></textarea></label
                >
                <div class="grid">
                  <label>Impact summary<textarea name="impactSummary" rows="3"></textarea></label
                  ><label>Outcome summary<textarea name="outcomeSummary" rows="3"></textarea></label
                  >
                </div>
                <button>Apply governed transition</button>
              </form>
            </details>
          {/if}

          {#if data.capabilities.canDecide && ['INVESTIGATING', 'DECISION_ACTION', 'APPEAL_REVIEW'].includes(data.selected.status)}
            <div class="two">
              <details class="command">
                <summary>Record case decision</summary>
                <form method="POST" action="?/decision">
                  <input type="hidden" name="caseId" value={data.selected.id} />
                  <label>Outcome<input name="outcome" required placeholder="SUBSTANTIATED" /></label
                  >
                  <label>Reason<textarea name="reason" rows="4" required></textarea></label>
                  <button>Record immutable Decision</button>
                </form>
              </details>

              {#if ['DECISION_ACTION', 'APPEAL_REVIEW'].includes(data.selected.status)}
                <details class="command">
                  <summary>Create follow-up action</summary>
                  <form method="POST" action="?/action">
                    <input type="hidden" name="caseId" value={data.selected.id} />
                    <label>Title<input name="title" required /></label>
                    <label
                      >Instructions<textarea name="instructions" rows="3" required
                      ></textarea></label
                    >
                    <div class="grid">
                      <label
                        >Priority<select name="priority"
                          ><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select
                        ></label
                      ><label>Due date<input name="dueAt" type="date" /></label>
                    </div>
                    <button>Create shared Work Item</button>
                  </form>
                </details>
              {/if}
            </div>
          {/if}
        </section>

        <section class="section-card journal">
          <span class="eyebrow">Restricted investigation journal</span>
          <h2>{data.entries.length} entries</h2>
          <div class="rows">
            {#each data.entries as entry}<article>
                <div>
                  <strong>{entry.entryType}</strong><span
                    >{new Date(entry.createdAt).toLocaleString('en-GB')}</span
                  >
                </div>
                <p>{entry.entrySummary}</p>
                <small>{entry.createdByPartyId}</small>
              </article>
            {:else}<p class="empty">No case journal entries.</p>{/each}
          </div>
        </section>
      {:else}
        <section class="section-card empty-state">
          <h2>No accessible Integrity Case</h2>
          <p>
            Cases appear only when the current Party has both tenant permission and an explicit
            active case-access grant.
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
  .principle,
  .sensitive {
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
    grid-template-columns: 330px minmax(0, 1fr);
    gap: 12px;
    align-items: start;
  }
  .register {
    position: sticky;
    top: 78px;
    padding: 12px;
  }
  .cases,
  .rows {
    display: grid;
    gap: 6px;
    margin-top: 10px;
  }
  .cases a,
  .rows article {
    display: grid;
    gap: 5px;
    padding: 9px;
    border: 1px solid #e0e7ec;
    border-radius: 8px;
    background: #fafcfd;
    color: inherit;
    text-decoration: none;
  }
  .cases a.active {
    border-color: #79bde2;
    background: #edf8fe;
    box-shadow: inset 3px 0 var(--blue-700);
  }
  .cases a > div,
  .head,
  .rows article > div {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .cases strong {
    font-size: 9.5px;
    color: #315b75;
  }
  .cases p,
  .rows p {
    margin: 0;
  }
  .cases small,
  .rows small {
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
  .status.investigating,
  .status.decision_action {
    background: #fff3d9;
    color: #805d19;
  }
  .status.closed,
  .status.unsubstantiated {
    background: #e6f5e9;
    color: #2b6c39;
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
  .journal {
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
    min-width: 100px;
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
  .sensitive {
    background: #fffdf8;
    border-color: #e5d8ad;
  }
  .sensitive p {
    margin: 2px 0;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    color: #697b87;
    font-size: 8.5px;
  }
  .access {
    margin-top: 12px;
    padding: 10px;
    border: 1px solid #dce5ea;
    border-radius: 8px;
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
    .two {
      grid-template-columns: 1fr;
    }
    .register {
      position: static;
    }
  }
</style>
