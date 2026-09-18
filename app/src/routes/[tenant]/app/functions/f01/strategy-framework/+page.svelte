<script lang="ts">
  let { data, form } = $props();

  const label: Record<string, string> = {
    DRAFT: 'Draft',
    IN_REVIEW: 'In review',
    RETURNED: 'Returned',
    APPROVED: 'Approved',
    PUBLISHED: 'Published',
    SUPERSEDED: 'Superseded',
    REJECTED: 'Rejected'
  };

  const editable = $derived(
    Boolean(data.selected && ['DRAFT', 'RETURNED'].includes(data.selected.status))
  );
  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleString('en-GB') : '—';
</script>

<svelte:head>
  <title>F01.01 Strategy Framework · NuBlox</title>
</svelte:head>

<div class="framework-page">
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f01`}>F01 Strategy & Enterprise Planning</a>
    <span>›</span><strong>F01.01 Strategy Framework</strong>
  </nav>

  <header class="page-header section-card">
    <div>
      <span class="eyebrow">F01.01 · Operational workspace</span>
      <h1>Strategy Framework</h1>
      <p>
        Govern purpose, vision, mission and strategic direction through a controlled version,
        review, approval and publication lifecycle.
      </p>
    </div>
    <div class="lifecycle">
      <span>Draft</span><i>→</i><span>Review</span><i>→</i><span>Approved</span><i>→</i><span
        >Published</span
      >
    </div>
  </header>

  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <div class="workspace-grid">
    <aside class="records section-card">
      <div class="panel-heading">
        <div>
          <span class="eyebrow">Framework register</span>
          <h2>Strategy frameworks</h2>
        </div>
        <span class="count">{data.frameworks.length}</span>
      </div>
      <div class="record-list">
        {#each data.frameworks as framework}
          <a class:active={data.selected?.id === framework.id} href={`?framework=${framework.id}`}>
            <strong>{framework.title}</strong><span
              class={`status status-${framework.status.toLowerCase()}`}
              >{label[framework.status]}</span
            ><small>v{framework.currentVersion || '—'} · {formatDate(framework.updatedAt)}</small>
          </a>
        {:else}
          <p class="empty">No strategy framework has been created for this tenant.</p>
        {/each}
      </div>
      <form class="create-form" method="POST" action="?/create">
        <h3>Create framework</h3>
        <label
          >Title<input
            name="title"
            required
            placeholder="e.g. 2027–2030 Enterprise Strategy"
          /></label
        >
        <input type="hidden" name="purpose" value="" /><input
          type="hidden"
          name="vision"
          value=""
        /><input type="hidden" name="mission" value="" /><input
          type="hidden"
          name="direction"
          value=""
        /><input type="hidden" name="reviewCadence" value="Quarterly" />
        <button type="submit">Create draft</button>
      </form>
    </aside>

    <main class="record-workspace">
      {#if data.selected}
        <section class="editor section-card">
          <div class="panel-heading">
            <div>
              <span class="eyebrow">Current working record</span>
              <h2>{data.selected.title}</h2>
            </div>
            <span class={`status status-${data.selected.status.toLowerCase()}`}
              >{label[data.selected.status]}</span
            >
          </div>
          <div class="record-meta">
            <span>Current version <strong>{data.selected.currentVersion || 'Draft'}</strong></span
            ><span>Updated <strong>{formatDate(data.selected.updatedAt)}</strong></span><span
              >Published <strong>{formatDate(data.selected.publishedAt)}</strong></span
            >
          </div>
          <form method="POST" action="?/save" class="editor-form">
            <input type="hidden" name="id" value={data.selected.id} />
            <label class="full"
              >Framework title<input
                name="title"
                value={data.selected.title}
                required
                disabled={!editable}
              /></label
            >
            <label
              >Purpose<textarea name="purpose" rows="5" disabled={!editable}
                >{data.selected.purpose}</textarea
              ></label
            >
            <label
              >Vision<textarea name="vision" rows="5" disabled={!editable}
                >{data.selected.vision}</textarea
              ></label
            >
            <label
              >Mission<textarea name="mission" rows="5" disabled={!editable}
                >{data.selected.mission}</textarea
              ></label
            >
            <label
              >Strategic direction<textarea name="direction" rows="5" disabled={!editable}
                >{data.selected.direction}</textarea
              ></label
            >
            <label class="full"
              >Review cadence<input
                name="reviewCadence"
                value={data.selected.reviewCadence}
                disabled={!editable}
                placeholder="e.g. Quarterly with annual refresh"
              /></label
            >
            {#if editable}<div class="full form-actions">
                <button type="submit">Save working draft</button>
              </div>{/if}
          </form>
        </section>

        <section class="workflow section-card">
          <div class="panel-heading">
            <div>
              <span class="eyebrow">Governance</span>
              <h2>Lifecycle decision</h2>
            </div>
            <span class="version">v{data.selected.currentVersion || '—'}</span>
          </div>
          {#if ['DRAFT', 'RETURNED'].includes(data.selected.status)}
            <form method="POST" action="?/submit" class="decision-form">
              <input type="hidden" name="id" value={data.selected.id} />
              <p>Submitting freezes the current content as a new immutable review version.</p>
              <button type="submit">Submit for review</button>
            </form>
          {:else if data.selected.status === 'IN_REVIEW'}
            <div class="decision-grid">
              <form method="POST" action="?/approve" class="decision-form">
                <input type="hidden" name="id" value={data.selected.id} /><label
                  >Decision note<input name="note" placeholder="Optional approval note" /></label
                ><button type="submit">Approve version</button>
              </form>
              <form method="POST" action="?/return" class="decision-form">
                <input type="hidden" name="id" value={data.selected.id} /><label
                  >Return reason<input
                    name="note"
                    required
                    placeholder="Required amendment reason"
                  /></label
                ><button class="secondary" type="submit">Return for amendment</button>
              </form>
              <form method="POST" action="?/reject" class="decision-form">
                <input type="hidden" name="id" value={data.selected.id} /><label
                  >Rejection reason<input
                    name="note"
                    required
                    placeholder="Required rejection reason"
                  /></label
                ><button class="danger" type="submit">Reject</button>
              </form>
            </div>
          {:else if data.selected.status === 'APPROVED'}
            <form method="POST" action="?/publish" class="decision-form">
              <input type="hidden" name="id" value={data.selected.id} /><label
                >Publication note<input
                  name="note"
                  placeholder="Optional publication note"
                /></label
              >
              <p>
                Publishing makes this the active tenant strategy framework and supersedes any
                previously published framework.
              </p>
              <button type="submit">Publish approved framework</button>
            </form>
          {:else}
            <p class="closed-state">
              This record is {label[data.selected.status].toLowerCase()} and has no available lifecycle
              transition in this slice.
            </p>
          {/if}
        </section>

        <section class="evidence-grid">
          <div class="section-card evidence-panel">
            <div class="panel-heading">
              <div>
                <span class="eyebrow">Version control</span>
                <h2>Version history</h2>
              </div>
            </div>
            <div class="table-wrap">
              <table>
                <thead
                  ><tr
                    ><th>Version</th><th>Status</th><th>Created</th><th>Actor</th><th>Decision</th
                    ></tr
                  ></thead
                ><tbody
                  >{#each data.versions as version}<tr
                      ><td>v{version.versionNo}</td><td>{label[version.status]}</td><td
                        >{formatDate(version.createdAt)}</td
                      ><td>{version.createdBy}</td><td>{version.decisionNote || '—'}</td></tr
                    >{:else}<tr><td colspan="5">No submitted versions yet.</td></tr>{/each}</tbody
                >
              </table>
            </div>
          </div>
          <div class="section-card evidence-panel">
            <div class="panel-heading">
              <div>
                <span class="eyebrow">Audit & evidence</span>
                <h2>Audit trail</h2>
              </div>
            </div>
            <ol class="audit-list">
              {#each data.audit as event}<li>
                  <div>
                    <strong>{event.action}</strong><small
                      >{formatDate(event.occurredAt)} · {event.actor}</small
                    >
                  </div>
                  <span
                    >{event.fromStatus ? label[event.fromStatus] : 'New'} → {event.toStatus
                      ? label[event.toStatus]
                      : '—'}</span
                  >{#if event.note}<p>{event.note}</p>{/if}
                </li>{:else}<li class="empty">No audit events recorded.</li>{/each}
            </ol>
          </div>
        </section>
      {:else}
        <section class="section-card welcome">
          <span class="eyebrow">F01.01</span>
          <h2>Create the first strategy framework</h2>
          <p>
            The first record will start in Draft and become the governed source for purpose, vision,
            mission and strategic direction.
          </p>
        </section>
      {/if}
    </main>
  </div>
</div>

<style>
  .framework-page {
    display: grid;
    gap: 12px;
  }
  .breadcrumb {
    display: flex;
    gap: 7px;
    align-items: center;
    color: var(--muted);
    font-size: 11px;
  }
  .breadcrumb a {
    color: var(--blue-700);
    text-decoration: none;
  }
  .page-header {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: center;
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
    margin: 3px 0 5px;
    font-size: 24px;
  }
  h2 {
    margin: 2px 0 0;
    font-size: 16px;
  }
  h3 {
    margin: 0 0 8px;
    font-size: 13px;
  }
  .page-header p {
    margin: 0;
    max-width: 720px;
    color: #465f73;
    font-size: 12px;
    line-height: 1.45;
  }
  .lifecycle {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #36566e;
    font-size: 10px;
    font-weight: 750;
    white-space: nowrap;
  }
  .lifecycle span {
    padding: 6px 8px;
    border: 1px solid #badbed;
    border-radius: 999px;
    background: white;
  }
  .lifecycle i {
    font-style: normal;
    color: #7894a7;
  }
  .message {
    padding: 9px 12px;
    border: 1px solid #dd8a8a;
    border-radius: 8px;
    background: #fff3f3;
    color: #792f2f;
    font-size: 12px;
  }
  .workspace-grid {
    display: grid;
    grid-template-columns: 275px minmax(0, 1fr);
    gap: 12px;
    align-items: start;
  }
  .records {
    position: sticky;
    top: 78px;
    padding: 12px;
  }
  .panel-heading {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    margin-bottom: 10px;
  }
  .count,
  .version {
    min-width: 28px;
    padding: 4px 7px;
    border-radius: 999px;
    background: #eef5f9;
    color: #47677d;
    font-size: 10px;
    text-align: center;
    font-weight: 800;
  }
  .record-list {
    display: grid;
    gap: 6px;
  }
  .record-list a {
    display: grid;
    gap: 4px;
    padding: 9px;
    border: 1px solid #e0e7ec;
    border-radius: 8px;
    text-decoration: none;
    background: #fafcfd;
  }
  .record-list a.active {
    border-color: #79bde2;
    background: #edf8fe;
    box-shadow: inset 3px 0 var(--blue-700);
  }
  .record-list strong {
    font-size: 11.5px;
    line-height: 1.3;
  }
  .record-list small {
    color: #7b8d9a;
    font-size: 9.5px;
  }
  .status {
    width: max-content;
    padding: 3px 6px;
    border-radius: 999px;
    background: #e9eef2;
    color: #506477;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .status-published {
    background: #e4f5e7;
    color: #246b33;
  }
  .status-approved {
    background: #e7f0fd;
    color: #275d99;
  }
  .status-in_review {
    background: #fff3d9;
    color: #855b08;
  }
  .status-returned {
    background: #fff0df;
    color: #8a4c0c;
  }
  .status-rejected {
    background: #fde7e7;
    color: #8b2929;
  }
  .status-superseded {
    background: #eeeef1;
    color: #646477;
  }
  .create-form {
    display: grid;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  label {
    display: grid;
    gap: 4px;
    color: #435c70;
    font-size: 10.5px;
    font-weight: 700;
  }
  input,
  textarea {
    width: 100%;
    border: 1px solid #cfdbe3;
    border-radius: 7px;
    padding: 8px 9px;
    background: white;
    color: var(--ink);
    font-size: 11px;
  }
  textarea {
    resize: vertical;
    line-height: 1.4;
  }
  input:disabled,
  textarea:disabled {
    background: #f3f5f6;
    color: #52697a;
  }
  button {
    border: 0;
    border-radius: 7px;
    padding: 8px 11px;
    background: var(--blue-700);
    color: white;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }
  button:hover {
    background: var(--navy-800);
  }
  button.secondary {
    background: #c77b22;
  }
  button.danger {
    background: #a43d3d;
  }
  .record-workspace {
    display: grid;
    gap: 12px;
    min-width: 0;
  }
  .editor,
  .workflow,
  .evidence-panel,
  .welcome {
    padding: 14px;
  }
  .record-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
  .record-meta span {
    padding: 5px 8px;
    border-radius: 6px;
    background: #f4f7f9;
    color: #64788a;
    font-size: 9.5px;
  }
  .record-meta strong {
    color: #314f65;
  }
  .editor-form {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .editor-form .full {
    grid-column: 1 / -1;
  }
  .form-actions {
    display: flex;
    justify-content: flex-end;
  }
  .decision-form {
    display: grid;
    gap: 8px;
    padding: 10px;
    border: 1px solid #e2e8ed;
    border-radius: 8px;
    background: #fafcfd;
  }
  .decision-form p,
  .closed-state {
    margin: 0;
    color: #607486;
    font-size: 10.5px;
    line-height: 1.4;
  }
  .decision-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .evidence-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
    gap: 12px;
  }
  .table-wrap {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10px;
  }
  th,
  td {
    padding: 7px 6px;
    border-bottom: 1px solid #e6ebef;
    text-align: left;
    vertical-align: top;
  }
  th {
    color: #617486;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .audit-list {
    list-style: none;
    display: grid;
    gap: 7px;
    margin: 0;
    padding: 0;
  }
  .audit-list li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 4px 10px;
    padding: 8px;
    border: 1px solid #e5eaee;
    border-radius: 7px;
  }
  .audit-list strong {
    display: block;
    font-size: 10.5px;
  }
  .audit-list small {
    display: block;
    margin-top: 2px;
    color: #7d8d99;
    font-size: 9px;
  }
  .audit-list span {
    color: #536b7d;
    font-size: 9.5px;
  }
  .audit-list p {
    grid-column: 1 / -1;
    margin: 2px 0 0;
    color: #596f80;
    font-size: 10px;
  }
  .empty {
    color: #7b8c99;
    font-size: 10.5px;
  }
  .welcome {
    min-height: 230px;
    display: grid;
    place-content: center;
    text-align: center;
  }
  .welcome p {
    max-width: 520px;
    color: var(--muted);
    font-size: 12px;
  }
  @media (max-width: 1100px) {
    .workspace-grid {
      grid-template-columns: 230px minmax(0, 1fr);
    }
    .evidence-grid,
    .decision-grid {
      grid-template-columns: 1fr;
    }
    .lifecycle {
      display: none;
    }
  }
  @media (max-width: 760px) {
    .workspace-grid {
      grid-template-columns: 1fr;
    }
    .records {
      position: static;
    }
    .editor-form {
      grid-template-columns: 1fr;
    }
    .editor-form .full {
      grid-column: auto;
    }
    .page-header {
      display: block;
    }
  }
</style>
