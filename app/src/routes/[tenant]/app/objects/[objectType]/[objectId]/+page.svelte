<script lang="ts">
  import ObjectHeader from '$lib/components/ObjectHeader.svelte';
  import { objectHref, type RuntimeObjectSection } from '$lib/data/runtime-object-registry';

  let { data, form } = $props();

  function sectionLabel(section: RuntimeObjectSection) {
    if (section === 'overview') return 'Overview';
    if (section === 'relationships') return 'Relationships';
    if (section === 'work') return 'Work';
    if (section === 'decisions') return 'Decisions';
    if (section === 'evidence') return 'Evidence';
    return 'History';
  }

  function formatDate(value: string | null) {
    return value ? new Date(value).toLocaleString('en-GB') : '—';
  }

  function sectionAvailable(section: RuntimeObjectSection) {
    if (data.state !== 'ready' || section === 'overview') return true;
    if (section === 'relationships') return data.object.relationships !== null;
    if (section === 'work') return data.capabilities.canReadWork;
    if (section === 'decisions') return data.capabilities.canReadDecisions;
    if (section === 'evidence') return data.capabilities.canReadEvidence;
    if (section === 'history') return data.capabilities.canReadAudit;
    return false;
  }

  function sectionCount(section: RuntimeObjectSection) {
    if (data.state !== 'ready') return null;
    if (section === 'relationships') return data.object.relationships?.length ?? null;
    if (section === 'work') return data.work.length;
    if (section === 'decisions') return data.decisions.length;
    if (section === 'evidence') return data.evidence.length;
    if (section === 'history') return data.history.length;
    return null;
  }
</script>

<svelte:head>
  <title>
    {data.state === 'ready'
      ? data.object.reference + ' · ' + data.object.title
      : data.definition.singular} · NuBlox
  </title>
</svelte:head>

{#if data.state === 'denied'}
  <div class="state-page">
    <section class="denied section-card">
      <span class="eyebrow">Access controlled</span>
      <h1>Your role does not permit this {data.definition.singular}</h1>
      <p>
        This area requires <strong>{data.definition.readPermission}</strong>. The record has not
        been disclosed. You can return to Home or request access from the tenant administrators.
      </p>
      {#if data.accessRequested}
        <div class="confirmation" role="status">
          Access request submitted to the tenant administration queue.
        </div>
      {/if}
      {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}
      <div class="state-actions">
        <a class="secondary" href={'/' + data.tenantSlug + '/app'}>Back to Home</a>
        <form method="POST" action="?/requestAccess">
          <input type="hidden" name="requestedPath" value={data.requestedPath} />
          <button type="submit">Request access</button>
        </form>
      </div>
    </section>
  </div>
{:else}
  <div class="object-page">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href={'/' + data.tenantSlug + '/app'}>Home</a>
      <span>›</span>
      <a href={data.object.workspaceHref}>{data.object.workspaceLabel}</a>
      <span>›</span>
      <strong>{data.definition.singular}</strong>
    </nav>

    <ObjectHeader
      objectType={data.definition.singular}
      reference={data.object.reference}
      title={data.object.title}
      subtitle={data.object.subtitle}
      status={data.object.status}
      metadata={data.object.metadata}
      activeTab={sectionLabel(data.section)}
      tabs={data.object.sections
        .filter((section) => sectionAvailable(section))
        .map((section) => ({
          label: sectionLabel(section),
          href: objectHref(data.tenantSlug, data.object.objectType, data.object.objectId, {
            section,
            from: data.from ?? undefined
          }),
          count: sectionCount(section)
        }))}
    />

    <div class="object-tools">
      <div>
        <span>Canonical object</span>
        <strong>{data.definition.canonicalModelId}</strong>
      </div>
      {#if data.from}<span class="origin">Opened from {data.from}</span>{/if}
      <form class="favourite-form" method="POST" action="?/toggleFavourite">
        <button
          class:favourite={data.favourite}
          class="favourite-button"
          type="submit"
          aria-pressed={data.favourite}
        >
          <span aria-hidden="true">{data.favourite ? '★' : '☆'}</span>
          <span>{data.favourite ? 'Favourite' : 'Add favourite'}</span>
        </button>
      </form>
      {#if data.object.originHref && data.object.originLabel}
        <a href={data.object.originHref}>{data.object.originLabel}</a>
      {/if}
    </div>

    {#if data.section === 'overview'}
      <section class="section-card content-panel">
        <header>
          <div>
            <span class="eyebrow">Overview</span>
            <h2>{data.object.reference}</h2>
          </div>
          {#if data.object.objectVersion}
            <span class="version">Object version {data.object.objectVersion}</span>
          {/if}
        </header>
        {#if data.object.summary}<p class="summary">{data.object.summary}</p>{/if}
        <dl class="detail-grid">
          {#each data.object.fields as field}
            <div>
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          {/each}
        </dl>
      </section>
    {:else if data.section === 'relationships'}
      <section class="section-card content-panel">
        <header>
          <div>
            <span class="eyebrow">Relationships</span>
            <h2>Governed Party relationships</h2>
          </div>
          <strong>{data.object.relationships?.length ?? 0}</strong>
        </header>
        <div class="record-list">
          {#each data.object.relationships ?? [] as relationship}
            <article>
              <div>
                <span class="tag">{relationship.direction}</span>
                <a
                  class="record-link"
                  href={objectHref(data.tenantSlug, 'party', relationship.relatedPartyId)}
                  >{relationship.relatedPartyName}</a
                >
              </div>
              <div class="record-meta">
                <span>{relationship.relationshipType.replaceAll('_', ' ')}</span>
                <span>{relationship.status.replaceAll('_', ' ')}</span>
                <span>{relationship.contextType.replaceAll('_', ' ')}</span>
              </div>
              <p>Context: {relationship.contextId}</p>
            </article>
          {:else}
            <p class="empty">No governed Party relationships are recorded for this object.</p>
          {/each}
        </div>
      </section>
    {:else if data.section === 'work'}
      <section class="section-card content-panel">
        <header>
          <div>
            <span class="eyebrow">Work</span>
            <h2>My work on this {data.definition.singular}</h2>
          </div>
          <strong>{data.work.length}</strong>
        </header>
        <div class="record-list">
          {#each data.work as item}
            <article>
              <div><span class="tag">{item.workType}</span><strong>{item.title}</strong></div>
              <div class="record-meta">
                <span>{item.status.replaceAll('_', ' ')}</span><span>{item.priority}</span><span
                  >Due {formatDate(item.dueAt)}</span
                >
              </div>
              {#if item.instructions}<p>{item.instructions}</p>{/if}
            </article>
          {:else}
            <p class="empty">No active Work Items assigned to you for this object.</p>
          {/each}
        </div>
      </section>
    {:else if data.section === 'decisions'}
      <section class="section-card content-panel">
        <header>
          <div>
            <span class="eyebrow">Decisions</span>
            <h2>Governed decisions</h2>
          </div>
          <strong>{data.decisions.length}</strong>
        </header>
        <div class="record-list">
          {#each data.decisions as decision}
            <article>
              <div>
                <span class="tag">{decision.decisionType}</span><strong
                  >{decision.outcome.replaceAll('_', ' ')}</strong
                >
              </div>
              <p>{decision.reason}</p>
              <div class="record-meta">
                <span>{formatDate(decision.decidedAt)}</span>{#if decision.subjectVersion}<span
                    >Subject v{decision.subjectVersion}</span
                  >{/if}
              </div>
            </article>
          {:else}<p class="empty">No governed decisions are recorded for this object.</p>{/each}
        </div>
      </section>
    {:else if data.section === 'evidence'}
      <section class="section-card content-panel">
        <header>
          <div>
            <span class="eyebrow">Evidence</span>
            <h2>Governed evidence</h2>
          </div>
          <strong>{data.evidence.length}</strong>
        </header>
        <div class="record-list">
          {#each data.evidence as item}
            <article>
              <div>
                <span class="tag">{item.evidenceType}</span><strong>{item.contentReference}</strong>
              </div>
              <div class="record-meta">
                <span>{item.status}</span><span>{formatDate(item.capturedAt)}</span
                >{#if item.classification}<span>{item.classification}</span>{/if}
              </div>
            </article>
          {:else}<p class="empty">No governed evidence is linked to this object.</p>{/each}
        </div>
      </section>
    {:else}
      <section class="section-card content-panel">
        <header>
          <div>
            <span class="eyebrow">History</span>
            <h2>Attributable object history</h2>
          </div>
          <strong>{data.history.length}</strong>
        </header>
        <div class="record-list">
          {#each data.history as event}
            <article>
              <div>
                <span class="tag">{event.aggregateId}</span><strong
                  >{event.action.replaceAll('_', ' ')}</strong
                >
              </div>
              <div class="record-meta">
                <span>{event.actorDisplayName}</span><span>{formatDate(event.occurredAt)}</span
                >{#if event.fromState || event.toState}<span
                    >{event.fromState ?? '—'} → {event.toState ?? '—'}</span
                  >{/if}
              </div>
              {#if event.note}<p>{event.note}</p>{/if}
            </article>
          {:else}<p class="empty">No platform audit events are available for this object.</p>{/each}
        </div>
      </section>
    {/if}
  </div>
{/if}

<style>
  .object-page,
  .state-page {
    display: grid;
    gap: 12px;
  }
  .breadcrumb {
    display: flex;
    gap: 7px;
    align-items: center;
    color: #748794;
    font-size: 9px;
  }
  .breadcrumb a {
    color: #315f7d;
    text-decoration: none;
  }
  .object-tools {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 0 3px;
    color: #6c7f8c;
    font-size: 9px;
  }
  .object-tools > div {
    display: flex;
    gap: 5px;
  }
  .object-tools strong {
    color: #405f73;
  }
  .object-tools .origin {
    margin-left: auto;
  }
  .object-tools a {
    padding: 6px 8px;
    border: 1px solid #c9dae4;
    border-radius: 6px;
    background: white;
    color: #2e617f;
    font-weight: 800;
    text-decoration: none;
  }
  .favourite-form {
    margin: 0;
  }
  .favourite-button {
    min-height: 29px;
    display: inline-flex;
    gap: 5px;
    align-items: center;
    border: 1px solid #c9dae4;
    border-radius: 6px;
    padding: 0 8px;
    background: white;
    color: #536f81;
    font-size: 9px;
    font-weight: 800;
    cursor: pointer;
  }
  .favourite-button:hover,
  .favourite-button.favourite {
    border-color: #d4c278;
    background: #fff9e6;
    color: #6f5a17;
  }
  .content-panel {
    padding: 14px;
  }
  .content-panel > header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: end;
    margin-bottom: 10px;
  }
  .eyebrow {
    color: var(--blue-700);
    font-size: 9px;
    font-weight: 850;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }
  h1,
  h2 {
    color: #29495e;
  }
  h1 {
    margin: 4px 0 8px;
    font-size: 23px;
  }
  h2 {
    margin: 2px 0 0;
    font-size: 16px;
  }
  .summary {
    max-width: 900px;
    margin: 0 0 12px;
    color: #536d7e;
    font-size: 11px;
    line-height: 1.5;
  }
  .version,
  .tag {
    border-radius: 999px;
    background: #edf4f7;
    color: #4d6a7c;
    font-size: 8px;
    font-weight: 800;
  }
  .version {
    padding: 5px 7px;
  }
  .tag {
    padding: 3px 6px;
  }
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 7px;
    margin: 0;
  }
  .detail-grid div {
    min-width: 0;
    padding: 9px;
    border: 1px solid #e0e7eb;
    border-radius: 7px;
    background: #fafcfd;
  }
  dt {
    color: #84939d;
    font-size: 7.5px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  dd {
    overflow-wrap: anywhere;
    margin: 3px 0 0;
    color: #425e70;
    font-size: 10px;
    font-weight: 700;
  }
  .record-list {
    display: grid;
    gap: 7px;
  }
  .record-list article {
    display: grid;
    gap: 6px;
    padding: 10px;
    border: 1px solid #dee7ec;
    border-radius: 8px;
    background: #fff;
  }
  .record-list article > div:first-child {
    display: flex;
    gap: 7px;
    align-items: center;
  }
  .record-list article strong,
  .record-link {
    color: #38576b;
    font-size: 10px;
    font-weight: 800;
  }
  .record-link {
    text-decoration: none;
  }
  .record-link:hover {
    text-decoration: underline;
  }
  .record-list p {
    margin: 0;
    color: #617786;
    font-size: 9.5px;
    line-height: 1.45;
  }
  .record-meta {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    color: #748692;
    font-size: 8px;
  }
  .record-meta span {
    padding: 3px 5px;
    border-radius: 5px;
    background: #f5f7f8;
  }
  .empty {
    margin: 0;
    padding: 18px;
    color: #728592;
    font-size: 10px;
    text-align: center;
  }
  .denied {
    max-width: 720px;
    display: grid;
    gap: 10px;
    padding: 20px;
  }
  .denied p {
    margin: 0;
    color: #5c7282;
    font-size: 11px;
    line-height: 1.5;
  }
  .confirmation {
    padding: 9px;
    border: 1px solid #b8d9c1;
    border-radius: 7px;
    background: #eff8f1;
    color: #356843;
    font-size: 10px;
  }
  .message {
    padding: 9px;
    border: 1px solid #dd8a8a;
    border-radius: 7px;
    background: #fff3f3;
    color: #792f2f;
    font-size: 10px;
  }
  .state-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .state-actions form {
    margin: 0;
  }
  .state-actions button,
  .state-actions a {
    min-height: 34px;
    display: inline-flex;
    align-items: center;
    border-radius: 6px;
    padding: 0 11px;
    font-size: 10px;
    font-weight: 800;
    text-decoration: none;
    cursor: pointer;
  }
  .state-actions button {
    border: 0;
    background: var(--blue-700);
    color: white;
  }
  .state-actions a {
    border: 1px solid #cdd9e0;
    background: white;
    color: #496779;
  }
  @media (max-width: 900px) {
    .detail-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 620px) {
    .detail-grid {
      grid-template-columns: 1fr;
    }
    .object-tools {
      align-items: flex-start;
      flex-wrap: wrap;
    }
    .object-tools .origin {
      margin-left: 0;
    }
    .content-panel > header,
    .state-actions {
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
