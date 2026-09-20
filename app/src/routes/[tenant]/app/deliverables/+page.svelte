<script lang="ts">
  let { data, form } = $props();

  const overdue = $derived(
    data.items.filter(
      (item) =>
        item.dueAt &&
        new Date(item.dueAt).getTime() < new Date(data.currentTime).getTime() &&
        !['ISSUED', 'ACCEPTED', 'SUPERSEDED', 'CANCELLED'].includes(item.effectiveStatus)
    ).length
  );
  const authoring = $derived(
    data.items.filter((item) =>
      ['PLANNED', 'IN_PROGRESS', 'AUTHOR_COMPLETE'].includes(item.effectiveStatus)
    ).length
  );
  const issued = $derived(data.items.filter((item) => item.effectiveStatus === 'ISSUED').length);

  function fmt(value: string | null) {
    return value ? new Date(value).toLocaleDateString('en-GB') : '—';
  }
</script>

<svelte:head><title>Deliverables · NuBlox</title></svelte:head>

<div class="page">
  <header class="hero section-card">
    <div>
      <span class="eyebrow">Required enterprise output</span>
      <h1>Deliverables</h1>
      <p>
        Define what must be produced, connect it to the governed function and deployed job, route it
        into My Work, and retain the controlled identity through authoring, review, approval, issue,
        acceptance and handover.
      </p>
    </div>
    <div class="hero-actions">
      <a href={'/' + data.tenantSlug + '/app/work'}>My Work</a>
      <a href={'/' + data.tenantSlug + '/app/admin/business-objects/functional-deployment'}
        >Functional deployment</a
      >
      <a href={'/' + data.tenantSlug + '/app/deliver'}>Delivery lifecycle</a>
    </div>
  </header>

  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <section class="metrics">
    <div class="metric section-card">
      <strong>{data.requirements.length}</strong><span>requirements</span>
    </div>
    <div class="metric section-card">
      <strong>{data.items.length}</strong><span>deliverable items</span>
    </div>
    <div class="metric section-card">
      <strong>{authoring}</strong><span>authoring / ready</span>
    </div>
    <div class:attention={overdue > 0} class="metric section-card">
      <strong>{overdue}</strong><span>overdue</span>
    </div>
    <div class="metric section-card"><strong>{issued}</strong><span>issued</span></div>
  </section>

  <section class="section-card create-strip">
    <div>
      <span class="eyebrow">Requirement → accountable output</span>
      <h2>Create a required deliverable</h2>
      <p>
        A deliverable can be native, assisted, connected to specialist authoring, or ingested from
        an external party. For controlled drawings/models/documents NuBlox creates an Information
        Container without making the file itself the business identity.
      </p>
    </div>
    {#if data.canManage}
      <details>
        <summary>Create deliverable</summary>
        <form method="POST" action="?/create" class="create-form">
          <fieldset>
            <legend>Requirement</legend>
            <label
              >Requirement reference<input
                name="requirementRef"
                required
                placeholder="REQ-ARCH-001"
              /></label
            >
            <label
              >Deliverable reference<input
                name="deliverableRef"
                required
                placeholder="A-1001"
              /></label
            >
            <label class="wide"
              >Title<input
                name="title"
                required
                placeholder="Ground Floor General Arrangement"
              /></label
            >
            <label class="wide">Description<textarea name="description" rows="2"></textarea></label>
            <label>
              Requirement source
              <select name="requirementSourceType">
                <option>CONTRACT</option>
                <option>CLIENT_REQUIREMENT</option>
                <option>REGULATION</option>
                <option>PROJECT_PLAN</option>
                <option>INTERNAL_CONTROL</option>
              </select>
            </label>
            <label
              >Source ID<input
                name="requirementSourceId"
                required
                placeholder="CONTRACT-ABC"
              /></label
            >
          </fieldset>

          <fieldset>
            <legend>Delivery context</legend>
            <label>
              Context type
              <select name="contextType">
                <option>PROJECT</option>
                <option>CONTRACT</option>
                <option>PACKAGE</option>
                <option>SITE</option>
                <option>ASSET</option>
                <option>ENTERPRISE</option>
              </select>
            </label>
            <label>Context ID<input name="contextId" required placeholder="PROJECT-ALPHA" /></label>
            <label class="wide">
              Governed deployment responsibility
              <select name="responsibleDeploymentAssignmentId">
                <option value="">Not yet assigned</option>
                {#each data.deploymentAssignments as assignment}
                  <option value={assignment.id}>
                    {assignment.functionCode} · {assignment.jobName} · {assignment.positionName ||
                      assignment.personName ||
                      assignment.organisationName ||
                      assignment.deploymentReference}
                  </option>
                {/each}
              </select>
            </label>
          </fieldset>

          <fieldset>
            <legend>Output definition</legend>
            <label
              >Deliverable type<input
                name="deliverableType"
                required
                placeholder="DRAWING"
              /></label
            >
            <label>
              Output kind
              <select name="outputKind">
                <option>CONTROLLED_INFORMATION</option>
                <option>MODEL</option>
                <option>CALCULATION</option>
                <option>PLAN</option>
                <option>REGISTER</option>
                <option>TRANSACTION</option>
                <option>INSPECTION_RECORD</option>
                <option>REPORT</option>
                <option>CERTIFICATE</option>
                <option>HANDOVER_PACKAGE</option>
              </select>
            </label>
            <label>
              Authoring mode
              <select name="authoringMode">
                <option>NATIVE</option>
                <option>ASSISTED</option>
                <option selected>CONNECTED</option>
                <option>INGESTED</option>
              </select>
            </label>
            <label>Discipline<input name="disciplineCode" placeholder="A" /></label>
            <label
              >Classification<input
                name="classificationCode"
                placeholder="Uniclass / tenant classification"
              /></label
            >
            <label>Initial revision<input name="initialRevisionCode" value="P01" /></label>
            {#if data.canManageInformation}
              <label class="check wide"
                ><input type="checkbox" name="createInformationContainer" checked /> Create controlled
                Information Container</label
              >
            {/if}
          </fieldset>

          <fieldset>
            <legend>Dates & controls</legend>
            <label>Planned start<input type="datetime-local" name="plannedStartAt" /></label>
            <label>Authoring due<input type="datetime-local" name="dueAt" /></label>
            <label>Planned issue<input type="datetime-local" name="plannedIssueAt" /></label>
            <label
              >Required acceptance<input type="datetime-local" name="requiredAcceptanceAt" /></label
            >
            <label class="check"
              ><input type="checkbox" name="reviewRequired" checked /> Review required</label
            >
            <label class="check"
              ><input type="checkbox" name="approvalRequired" checked /> Approval required</label
            >
            <label class="check"
              ><input type="checkbox" name="acceptanceRequired" /> Recipient acceptance required</label
            >
          </fieldset>

          <button type="submit">Create requirement & deliverable</button>
        </form>
      </details>
    {/if}
  </section>

  <div class="workspace-grid">
    <section class="register section-card">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Deliverable register</span>
          <h2>{data.items.length} governed outputs</h2>
        </div>
      </div>

      <div class="rows">
        {#each data.items as item}
          <a
            class:active={data.selected?.id === item.id}
            href={'?deliverable=' + encodeURIComponent(item.id)}
          >
            <div class="identity">
              <span class="ref">{item.deliverableRef}</span>
              <strong>{item.title}</strong>
              <small>{item.contextType} · {item.contextId}</small>
            </div>
            <div class="owner">
              <strong
                >{item.responsiblePartyName || item.responsiblePositionName || 'Unassigned'}</strong
              >
              <small>{item.authoringMode} · {item.deliverableType.replaceAll('_', ' ')}</small>
            </div>
            <div class="date">
              <small>Due</small>
              <strong>{fmt(item.dueAt)}</strong>
            </div>
            <span
              class={'status status-' + item.effectiveStatus.toLowerCase().replaceAll('_', '-')}
            >
              {item.effectiveStatus.replaceAll('_', ' ')}
            </span>
          </a>
        {:else}
          <div class="empty">
            <strong>No deliverables have been created.</strong>
            <span>Create a required output and assign it to deployed capability.</span>
          </div>
        {/each}
      </div>
    </section>

    <aside class="inspector">
      {#if data.selected}
        <section class="section-card selected-card">
          <div class="selected-head">
            <div>
              <span class="eyebrow">{data.selected.outputKind.replaceAll('_', ' ')}</span>
              <h2>{data.selected.title}</h2>
              <code>{data.selected.deliverableRef}</code>
            </div>
            <span
              class={'status status-' +
                data.selected.effectiveStatus.toLowerCase().replaceAll('_', '-')}
            >
              {data.selected.effectiveStatus.replaceAll('_', ' ')}
            </span>
          </div>

          <dl>
            <div>
              <dt>Requirement</dt>
              <dd>{data.selected.requirementRef}</dd>
            </div>
            <div>
              <dt>Context</dt>
              <dd>{data.selected.contextType} · {data.selected.contextId}</dd>
            </div>
            <div>
              <dt>Responsible person</dt>
              <dd>{data.selected.responsiblePartyName || 'Not assigned'}</dd>
            </div>
            <div>
              <dt>Position</dt>
              <dd>{data.selected.responsiblePositionName || 'Not assigned'}</dd>
            </div>
            <div>
              <dt>Originating organisation</dt>
              <dd>{data.selected.originatingOrganisationName || 'Not assigned'}</dd>
            </div>
            <div>
              <dt>Authoring mode</dt>
              <dd>{data.selected.authoringMode}</dd>
            </div>
            <div>
              <dt>Revision</dt>
              <dd>{data.selected.currentRevisionLabel || '—'}</dd>
            </div>
            <div>
              <dt>Authoring work</dt>
              <dd>{data.selected.workStatus || 'No work item'}</dd>
            </div>
          </dl>

          <div class="links">
            <a href={'/' + data.tenantSlug + '/app/objects/deliverable-item/' + data.selected.id}
              >Open object workspace</a
            >
            {#if data.selected.informationContainerId}
              <a
                href={'/' +
                  data.tenantSlug +
                  '/app/objects/information-container/' +
                  data.selected.informationContainerId}
              >
                Open controlled information
              </a>
            {/if}
            <a href={'/' + data.tenantSlug + '/app/work'}>Open My Work</a>
          </div>

          {#if data.canIssue && !['ISSUED', 'ACCEPTED', 'SUPERSEDED', 'CANCELLED'].includes(data.selected.status)}
            <details class="issue-panel">
              <summary>Record issue / transmittal</summary>
              <form method="POST" action="?/issue">
                <input type="hidden" name="deliverableId" value={data.selected.id} />
                <input type="hidden" name="version" value={data.selected.version} />
                <label
                  >Issue reference<input
                    name="issueRef"
                    required
                    placeholder={data.selected.deliverableRef + '-T001'}
                  /></label
                >
                <label>Issue type<input name="issueType" value="TRANSMITTAL" /></label>
                <label>Purpose of issue<input name="purposeOfIssue" /></label>
                <label>Suitability code<input name="suitabilityCode" /></label>
                <label
                  >Recipient Party ID<input
                    name="recipientPartyId"
                    placeholder="Optional canonical Party ID"
                  /></label
                >
                <label
                  >Recipient role<input
                    name="recipientRole"
                    placeholder="CLIENT, CONTRACTOR…"
                  /></label
                >
                <button type="submit">Record issued deliverable</button>
              </form>
              {#if data.selected.informationContainerId}
                <p>
                  Controlled information must already be approved and issued in its Information
                  Container before the deliverable transmittal is recorded.
                </p>
              {/if}
            </details>
          {/if}
        </section>
      {:else}
        <section class="section-card empty-state">
          <span class="eyebrow">Managed output</span>
          <h2>Select a deliverable</h2>
          <p>
            The inspector shows responsibility, authoring work, revision and controlled information.
          </p>
        </section>
      {/if}
    </aside>
  </div>
</div>

<style>
  .page {
    display: grid;
    gap: 12px;
  }
  .section-card {
    border: 1px solid var(--line);
    border-radius: 10px;
    background: white;
  }
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 250px;
    gap: 22px;
    padding: 18px;
    border-color: #8fc9ee;
    background: linear-gradient(120deg, #fbfdff, #eaf6fd);
  }
  .eyebrow {
    color: var(--blue-700);
    font-size: 9px;
    font-weight: 850;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }
  h1 {
    margin: 4px 0 7px;
    font-size: 25px;
  }
  h2 {
    margin: 2px 0 0;
    font-size: 16px;
  }
  .hero p,
  .create-strip p,
  .issue-panel p,
  .empty-state p {
    margin: 0;
    color: #526a7d;
    font-size: 10.5px;
    line-height: 1.5;
  }
  .hero-actions {
    display: grid;
    gap: 6px;
    align-content: start;
  }
  .hero-actions a,
  .links a {
    padding: 7px 9px;
    border: 1px solid #cfe0ea;
    border-radius: 7px;
    background: white;
    color: #315e79;
    font-size: 9px;
    font-weight: 800;
    text-decoration: none;
  }
  .message {
    padding: 9px 12px;
    border: 1px solid #dd8a8a;
    border-radius: 8px;
    background: #fff3f3;
    color: #792f2f;
    font-size: 11px;
  }
  .metrics {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
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
    font-size: 8px;
    text-transform: uppercase;
  }
  .metric.attention {
    border-color: #e5c4a6;
    background: #fffaf5;
  }
  .metric.attention strong {
    color: #8b5127;
  }
  .create-strip {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(340px, 0.8fr);
    gap: 18px;
    align-items: start;
    padding: 14px;
  }
  details {
    border: 1px solid #d8e2e8;
    border-radius: 7px;
    background: white;
  }
  summary {
    padding: 8px 10px;
    cursor: pointer;
    color: #315c76;
    font-size: 9.5px;
    font-weight: 800;
  }
  .create-form {
    display: grid;
    gap: 8px;
    padding: 9px;
    border-top: 1px solid #e4eaee;
    max-height: 70vh;
    overflow: auto;
  }
  fieldset {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
    margin: 0;
    padding: 9px;
    border: 1px solid #e2e8ec;
    border-radius: 7px;
  }
  legend {
    padding: 0 5px;
    color: #456477;
    font-size: 9px;
    font-weight: 850;
  }
  label {
    display: grid;
    gap: 3px;
    color: #546b7c;
    font-size: 8.5px;
    font-weight: 750;
  }
  label.wide {
    grid-column: 1/-1;
  }
  label.check {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  label.check input {
    width: auto;
  }
  input,
  select,
  textarea {
    width: 100%;
    border: 1px solid #cfdbe3;
    border-radius: 6px;
    padding: 7px;
    background: white;
    color: var(--ink);
    font-size: 9.5px;
  }
  textarea {
    resize: vertical;
  }
  button {
    border: 0;
    border-radius: 6px;
    padding: 7px 10px;
    background: var(--blue-700);
    color: white;
    font-size: 9px;
    font-weight: 800;
    cursor: pointer;
  }
  .workspace-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(340px, 0.75fr);
    gap: 12px;
    align-items: start;
  }
  .register,
  .selected-card,
  .empty-state {
    padding: 14px;
  }
  .section-heading {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 12px;
    margin-bottom: 9px;
  }
  .rows {
    display: grid;
    gap: 5px;
  }
  .rows > a {
    display: grid;
    grid-template-columns: minmax(240px, 1.3fr) minmax(160px, 0.8fr) 75px auto;
    gap: 10px;
    align-items: center;
    padding: 9px;
    border: 1px solid #e1e8ec;
    border-radius: 7px;
    color: inherit;
    text-decoration: none;
  }
  .rows > a:hover,
  .rows > a.active {
    border-color: #93c8e5;
    background: #f4fafe;
  }
  .identity,
  .owner,
  .date {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .ref {
    color: var(--blue-700);
    font-size: 8px;
    font-weight: 850;
  }
  .identity strong,
  .owner strong,
  .date strong {
    overflow: hidden;
    color: #3d596b;
    font-size: 9.5px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .identity small,
  .owner small,
  .date small {
    color: #7a8c98;
    font-size: 8px;
  }
  .status {
    width: max-content;
    padding: 3px 6px;
    border-radius: 999px;
    background: #edf2f5;
    color: #5d7383;
    font-size: 7.5px;
    font-weight: 850;
    text-transform: uppercase;
  }
  .status-in-progress,
  .status-author-complete {
    background: #e9f4fb;
    color: #336783;
  }
  .status-issued {
    background: #e8f5eb;
    color: #2f6d3c;
  }
  .status-accepted {
    background: #e3f5e7;
    color: #216535;
  }
  .inspector {
    min-width: 0;
  }
  .selected-card {
    display: grid;
    gap: 11px;
    position: sticky;
    top: 76px;
  }
  .selected-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 9px;
    border-bottom: 1px solid #e5ebef;
  }
  .selected-head code {
    display: inline-block;
    margin-top: 4px;
    padding: 3px 5px;
    border-radius: 4px;
    background: #f2f5f7;
    color: #637987;
    font-size: 8px;
  }
  dl {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
  }
  dl div {
    display: grid;
    gap: 2px;
  }
  dt {
    color: #7c8d99;
    font-size: 7.5px;
    text-transform: uppercase;
  }
  dd {
    margin: 0;
    color: #425c6e;
    font-size: 9px;
    overflow-wrap: anywhere;
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .issue-panel form {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
    padding: 9px;
    border-top: 1px solid #e4eaee;
  }
  .issue-panel p {
    padding: 0 9px 9px;
  }
  .empty {
    display: grid;
    gap: 3px;
    padding: 24px;
    color: #748895;
    text-align: center;
    font-size: 9px;
  }
  .empty-state {
    min-height: 260px;
    display: grid;
    place-content: center;
    text-align: center;
  }
  .empty-state p {
    margin-top: 6px;
  }
  @media (max-width: 1100px) {
    .workspace-grid {
      grid-template-columns: 1fr;
    }
    .selected-card {
      position: static;
    }
    .rows > a {
      grid-template-columns: 1fr 1fr auto;
    }
    .owner {
      display: none;
    }
  }
  @media (max-width: 760px) {
    .hero,
    .create-strip,
    .workspace-grid {
      grid-template-columns: 1fr;
    }
    .metrics {
      grid-template-columns: repeat(2, 1fr);
    }
    fieldset,
    dl,
    .issue-panel form {
      grid-template-columns: 1fr;
    }
    label.wide {
      grid-column: auto;
    }
    .rows > a {
      grid-template-columns: 1fr auto;
    }
    .date {
      display: none;
    }
  }
</style>
