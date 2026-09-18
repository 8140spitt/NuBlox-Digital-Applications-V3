<script lang="ts">
  let { data, form } = $props();

  const summary = $derived({
    total: data.work.length,
    assigned: data.work.filter((item) => item.status === 'ASSIGNED').length,
    inProgress: data.work.filter((item) => item.status === 'IN_PROGRESS').length,
    urgent: data.work.filter((item) => item.priority === 'URGENT').length,
    overdue: data.work.filter(
      (item) => item.dueAt && new Date(item.dueAt).getTime() < new Date(data.currentTime).getTime()
    ).length,
    escalations: data.escalations.filter((item) => item.status === 'OPEN').length
  });

  function formatDate(value: string | null) {
    return value ? new Date(value).toLocaleString('en-GB') : 'No due date';
  }
</script>

<svelte:head>
  <title>My Work · NuBlox</title>
</svelte:head>

<div class="work-page">
  <header class="hero section-card">
    <div>
      <span class="eyebrow">Shared work · AGG-27-WORKFLOW</span>
      <h1>My Work</h1>
      <p>
        Actionable work assigned to {data.actorDisplayName}. Work Items coordinate activity around
        canonical business objects; completing a Work Item does not silently change the referenced
        domain object.
      </p>
    </div>
    <div class="principle">
      <strong>Work is coordination, not domain truth</strong>
      <span>Assignment ≠ permission ≠ delegated authority.</span>
      <small
        >Protected business decisions are authorised and committed through their owning aggregate.</small
      >
    </div>
  </header>

  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  {#if data.capabilities.canReadDecisions}
    <nav class="work-tabs" aria-label="Shared work sections">
      <a class:active={data.view === 'work'} href="?view=work">My work</a>
      <a class:active={data.view === 'decisions'} href="?view=decisions">Decision register</a>
    </nav>
  {/if}

  {#if data.view === 'work'}
  <section class="metrics" aria-label="My Work summary">
    <div class="metric section-card"><strong>{summary.total}</strong><span>open work</span></div>
    <div class="metric section-card"><strong>{summary.assigned}</strong><span>assigned</span></div>
    <div class="metric section-card">
      <strong>{summary.inProgress}</strong><span>in progress</span>
    </div>
    <div class="metric section-card"><strong>{summary.urgent}</strong><span>urgent</span></div>
    <div class="metric section-card"><strong>{summary.overdue}</strong><span>overdue</span></div>
    <div class="metric section-card">
      <strong>{summary.escalations}</strong><span>open escalations</span>
    </div>
  </section>

  <section class="work-register section-card">
    <div class="section-heading">
      <div>
        <span class="eyebrow">Action queue</span>
        <h2>{summary.total} current assignments</h2>
      </div>
      <p>
        Ordered by priority and due date. Completed work leaves this queue but remains fully
        evidenced.
      </p>
    </div>

    <div class="work-list">
      {#each data.work as item}
        <article
          class:urgent={item.priority === 'URGENT'}
          class:overdue={item.dueAt &&
            new Date(item.dueAt).getTime() < new Date(data.currentTime).getTime()}
        >
          <div class="work-main">
            <div class="state-column">
              <span class={'priority priority-' + item.priority.toLowerCase()}>{item.priority}</span
              >
              <span class={'status status-' + item.status.toLowerCase().replaceAll('_', '-')}
                >{item.status.replaceAll('_', ' ')}</span
              >
            </div>
            <div class="work-copy">
              <span class="work-type">{item.workType}</span>
              <h3>{item.title}</h3>
              {#if item.instructions}<p>{item.instructions}</p>{/if}
              <div class="subject">
                <span><strong>Subject</strong>{item.subjectType} · {item.subjectId}</span>
                {#if item.subjectVersion}<span><strong>Version</strong>{item.subjectVersion}</span
                  >{/if}
                <span
                  ><strong>Workflow</strong>{item.workflowDefinitionKey} v{item.workflowDefinitionVersion}</span
                >
              </div>
            </div>
            <div class="due">
              <small>Due</small>
              <strong>{formatDate(item.dueAt)}</strong>
              <span>Work v{item.version}</span>
            </div>
          </div>

          {#if data.escalations.some((escalation) => escalation.workItemId === item.id && escalation.status === 'OPEN')}
            <div class="escalations">
              <strong>Open escalation</strong>
              {#each data.escalations.filter((escalation) => escalation.workItemId === item.id && escalation.status === 'OPEN') as escalation}
                <div class="escalation-row">
                  <div>
                    <span>{escalation.triggerCode}</span>
                    <p>{escalation.reason}</p>
                    {#if escalation.ruleKey}<small>Rule · {escalation.ruleKey}</small>{/if}
                  </div>
                  {#if data.capabilities.canManage}
                    <form method="POST" action="?/resolveEscalation">
                      <input type="hidden" name="escalationId" value={escalation.id} />
                      <input name="resolutionNote" required placeholder="Resolution note" />
                      <button class="quiet" type="submit">Resolve</button>
                    </form>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}

          <div class="actions">
            {#if item.status === 'ASSIGNED' || item.status === 'BLOCKED'}
              <form method="POST" action="?/start">
                <input type="hidden" name="workItemId" value={item.id} />
                <input type="hidden" name="version" value={item.version} />
                <button type="submit">Start work</button>
              </form>
            {/if}

            <details class="acknowledge">
              <summary>Acknowledge</summary>
              <form method="POST" action="?/acknowledge">
                <input type="hidden" name="workItemId" value={item.id} />
                <input type="hidden" name="acknowledgementType" value="RECEIVED" />
                <input name="statement" placeholder="Optional acknowledgement note" />
                <button class="quiet" type="submit">Record acknowledgement</button>
              </form>
            </details>

            {#if data.capabilities.canExecute}
              <details class="escalate">
                <summary>Escalate</summary>
                <form method="POST" action="?/escalate">
                  <input type="hidden" name="workItemId" value={item.id} />
                  <input name="triggerCode" required placeholder="Trigger code, e.g. SLA.BREACH" />
                  <input name="ruleKey" placeholder="Optional rule key" />
                  <textarea
                    name="reason"
                    rows="2"
                    required
                    placeholder="Why does this work require escalation?"></textarea>
                  <button class="quiet" type="submit">Raise escalation</button>
                </form>
              </details>
            {/if}

            <details class="complete">
              <summary>Complete</summary>
              <form method="POST" action="?/complete">
                <input type="hidden" name="workItemId" value={item.id} />
                <input type="hidden" name="version" value={item.version} />
                <textarea name="completionNote" rows="2" placeholder="Outcome / completion evidence"
                ></textarea>
                <button type="submit">Complete work item</button>
              </form>
            </details>
          </div>
        </article>
      {:else}
        <div class="empty">
          <span class="empty-mark">✓</span>
          <h3>No assigned work</h3>
          <p>
            There are no active Work Items currently assigned to your Party, identity or tenant
            role.
          </p>
        </div>
      {/each}
    </div>
  </section>
  {:else}
    <section class="decision-register section-card">
      <div class="section-heading">
        <div>
          <span class="eyebrow">AGG-27-DECISION</span>
          <h2>{data.decisions.length} immutable decisions</h2>
        </div>
        <p>
          Attributable outcomes bound to an exact subject/version. Protected decisions retain the
          exact Delegated Authority grant and Approval Policy version used at decision time.
        </p>
      </div>

      <div class="decision-list">
        {#each data.decisions as decision}
          <article class="decision-item">
            <div class="decision-head">
              <div>
                <span class="work-type">{decision.decisionType}</span>
                <h3>{decision.outcome.replaceAll('_', ' ')}</h3>
              </div>
              <div class="due">
                <small>Decided</small>
                <strong>{formatDate(decision.decidedAt)}</strong>
              </div>
            </div>
            <p>{decision.reason}</p>
            <div class="subject">
              <span><strong>Subject</strong>{decision.subjectType} · {decision.subjectId}</span>
              {#if decision.subjectVersion}
                <span><strong>Version</strong>{decision.subjectVersion}</span>
              {/if}
              <span><strong>Decider</strong>{decision.deciderPartyId.slice(0, 8)}</span>
              {#if decision.authorityGrantId}
                <span><strong>Authority grant</strong>{decision.authorityGrantId.slice(0, 8)}</span>
              {/if}
              {#if decision.approvalPolicyRuleKey}
                <span>
                  <strong>Approval policy</strong>
                  {decision.approvalPolicyRuleKey} v{decision.approvalPolicyVersionNo}
                </span>
              {/if}
              {#if decision.supersedesDecisionId}
                <span><strong>Corrects</strong>{decision.supersedesDecisionId.slice(0, 8)}</span>
              {/if}
            </div>
          </article>
        {:else}
          <div class="empty">
            <span class="empty-mark">✓</span>
            <h3>No decisions recorded</h3>
            <p>Governed Decisions will appear here as business functions begin using the shared Decision aggregate.</p>
          </div>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .work-page {
    display: grid;
    gap: 12px;
  }
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(300px, 0.65fr);
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
  h3 {
    margin: 2px 0 4px;
    color: #2d4b60;
    font-size: 14px;
  }
  .hero p,
  .section-heading p {
    margin: 0;
    color: #526a7d;
    font-size: 11.5px;
    line-height: 1.45;
  }
  .principle {
    display: grid;
    gap: 5px;
    padding: 12px;
    border: 1px solid #b8dcef;
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.82);
  }
  .principle strong {
    color: #245471;
    font-size: 11.5px;
  }
  .principle span {
    color: #456275;
    font-size: 10px;
  }
  .principle small {
    color: #788b98;
    font-size: 9px;
    line-height: 1.35;
  }
  .message {
    padding: 9px 12px;
    border: 1px solid #dd8a8a;
    border-radius: 8px;
    background: #fff3f3;
    color: #792f2f;
    font-size: 11px;
  }
  .work-tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid #dce5ea;
  }
  .work-tabs a {
    padding: 8px 11px;
    border-bottom: 2px solid transparent;
    color: #617584;
    font-size: 10px;
    font-weight: 800;
    text-decoration: none;
  }
  .work-tabs a.active {
    border-bottom-color: var(--blue-700);
    color: #245876;
  }
  .metrics {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 8px;
  }
  .metric {
    display: grid;
    gap: 2px;
    padding: 10px 12px;
  }
  .metric strong {
    color: #1d4f70;
    font-size: 19px;
  }
  .metric span {
    color: #718492;
    font-size: 9px;
    text-transform: uppercase;
  }
  .work-register {
    padding: 14px;
  }
  .section-heading {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: end;
    margin-bottom: 11px;
  }
  .section-heading p {
    max-width: 560px;
  }
  .decision-register {
    padding: 14px;
  }
  .decision-list {
    display: grid;
    gap: 8px;
  }
  .decision-item {
    padding: 11px;
  }
  .decision-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }
  .decision-item > p {
    margin: 7px 0;
    color: #647989;
    font-size: 10px;
    line-height: 1.45;
  }
  .work-list {
    display: grid;
    gap: 8px;
  }
  article {
    overflow: hidden;
    border: 1px solid #dde6eb;
    border-radius: 9px;
    background: #fff;
  }
  article.urgent {
    border-left: 3px solid #b55c2b;
  }
  article.overdue {
    box-shadow: inset 0 0 0 1px #e2b1b1;
  }
  .work-main {
    display: grid;
    grid-template-columns: 90px minmax(0, 1fr) 175px;
    gap: 12px;
    align-items: start;
    padding: 11px;
  }
  .state-column {
    display: grid;
    gap: 5px;
    align-content: start;
  }
  .priority,
  .status {
    width: max-content;
    padding: 3px 6px;
    border-radius: 999px;
    font-size: 7.5px;
    font-weight: 850;
    text-transform: uppercase;
  }
  .priority {
    background: #edf2f5;
    color: #586f80;
  }
  .priority-urgent {
    background: #fde9df;
    color: #88451f;
  }
  .priority-high {
    background: #fff2d7;
    color: #7c5b18;
  }
  .priority-low {
    background: #eef2f4;
    color: #71818d;
  }
  .status {
    background: #e8f2f8;
    color: #31627f;
  }
  .status-in-progress {
    background: #e8f5eb;
    color: #2c703b;
  }
  .status-blocked {
    background: #fce9e9;
    color: #8b3939;
  }
  .work-type {
    color: var(--blue-700);
    font-size: 8.5px;
    font-weight: 850;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .work-copy p {
    margin: 0 0 8px;
    color: #647989;
    font-size: 10px;
    line-height: 1.4;
  }
  .subject {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .subject span {
    display: inline-flex;
    gap: 4px;
    padding: 4px 6px;
    border-radius: 5px;
    background: #f5f7f8;
    color: #6b7d89;
    font-size: 8.5px;
  }
  .subject strong {
    color: #4f6574;
  }
  .due {
    display: grid;
    gap: 3px;
    justify-items: end;
    text-align: right;
  }
  .due small {
    color: #83929c;
    font-size: 8px;
    text-transform: uppercase;
  }
  .due strong {
    color: #425e70;
    font-size: 10px;
  }
  .due span {
    color: #8a98a1;
    font-size: 8px;
  }
  .escalations {
    display: grid;
    gap: 7px;
    padding: 9px 11px;
    border-top: 1px solid #efd9b2;
    background: #fffaf1;
  }
  .escalations > strong {
    color: #79541a;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .escalation-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(230px, 0.55fr);
    gap: 10px;
    align-items: start;
  }
  .escalation-row span {
    color: #7a5315;
    font-size: 9px;
    font-weight: 850;
  }
  .escalation-row p {
    margin: 2px 0;
    color: #6d5a3a;
    font-size: 9.5px;
  }
  .escalation-row small {
    color: #958263;
    font-size: 8px;
  }
  .escalation-row form {
    display: flex;
    gap: 5px;
  }
  .actions {
    display: flex;
    gap: 6px;
    justify-content: end;
    align-items: start;
    padding: 8px 10px;
    border-top: 1px solid #e8edef;
    background: #fafcfd;
  }
  button,
  summary {
    border: 0;
    border-radius: 6px;
    padding: 7px 9px;
    background: var(--blue-700);
    color: white;
    font-size: 9px;
    font-weight: 800;
    cursor: pointer;
  }
  button.quiet,
  details > summary {
    border: 1px solid #d7e0e6;
    background: white;
    color: #50697b;
  }
  details {
    position: relative;
  }
  details > summary {
    list-style: none;
  }
  details > summary::-webkit-details-marker {
    display: none;
  }
  details[open] {
    min-width: 280px;
  }
  details form {
    display: grid;
    gap: 6px;
    margin-top: 5px;
    padding: 8px;
    border: 1px solid #dce5ea;
    border-radius: 7px;
    background: white;
    box-shadow: 0 5px 18px rgba(30, 57, 75, 0.08);
  }
  input,
  textarea {
    width: 100%;
    border: 1px solid #ccd8e0;
    border-radius: 6px;
    padding: 7px 8px;
    color: var(--ink);
    font-size: 9.5px;
  }
  textarea {
    resize: vertical;
  }
  .empty {
    display: grid;
    place-items: center;
    min-height: 220px;
    padding: 24px;
    text-align: center;
  }
  .empty-mark {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: #e9f6ec;
    color: #347344;
    font-size: 18px;
  }
  .empty h3 {
    margin-top: 9px;
  }
  .empty p {
    margin: 0;
    max-width: 470px;
    color: #71838f;
    font-size: 10.5px;
  }
  @media (max-width: 1050px) {
    .metrics {
      grid-template-columns: repeat(3, 1fr);
    }
    .work-main {
      grid-template-columns: 80px minmax(0, 1fr);
    }
    .due {
      grid-column: 2;
      justify-items: start;
      text-align: left;
    }
  }
  @media (max-width: 760px) {
    .hero {
      grid-template-columns: 1fr;
    }
    .metrics {
      grid-template-columns: repeat(2, 1fr);
    }
    .escalation-row {
      grid-template-columns: 1fr;
    }
    .escalation-row form {
      display: grid;
    }
    .section-heading {
      display: grid;
      align-items: start;
    }
    .work-main {
      grid-template-columns: 1fr;
    }
    .due {
      grid-column: auto;
    }
    .actions {
      justify-content: stretch;
      flex-direction: column;
    }
    .actions form,
    .actions details,
    details[open] {
      width: 100%;
      min-width: 0;
    }
  }
</style>
