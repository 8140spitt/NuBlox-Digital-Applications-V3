<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const items = $derived(data.items ?? []);
  const assignedCount = $derived(
    items.filter((item) => item.kind === 'WORK' || item.kind === 'DELIVERABLE' || item.kind === 'FUNCTION_WORK').length
  );
  const reviewCount = $derived(items.filter((item) => item.kind === 'REVIEW').length);
  const decisionCount = $derived(
    items.filter((item) => item.kind === 'APPROVAL' || item.kind === 'ACCEPTANCE').length
  );
  const attentionCount = $derived(
    items.filter(
      (item) =>
        item.isOverdue ||
        item.kind === 'COMPETENCE' ||
        item.kind === 'ACCESS_REQUEST'
    ).length
  );

  function kindLabel(kind: string) {
    switch (kind) {
      case 'WORK':
        return 'Work';
      case 'DELIVERABLE':
        return 'Deliverable';
      case 'REVIEW':
        return 'Review';
      case 'APPROVAL':
        return 'Approval';
      case 'ACCEPTANCE':
        return 'Acceptance';
      case 'COMPETENCE':
        return 'Competence';
      case 'ACCESS_REQUEST':
        return 'Access request';
      case 'FUNCTION_WORK':
        return 'Function work';
      default:
        return kind;
    }
  }

  function dueLabel(value?: string) {
    if (!value) return 'No due date';
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value));
  }
</script>

<svelte:head>
  <title>My Work — NuBlox</title>
</svelte:head>

<section class="workspace-hero compact">
  <div>
    <p class="app-eyebrow">Work-delivery runtime</p>
    <h1>My Work</h1>
    <p class="workspace-lede">
      One authoritative projection of assignments, deliverables, reviews, approvals, acceptance
      actions and competence obligations across every Function and operating context.
    </p>
  </div>
</section>

<section class="work-lanes" aria-label="My Work categories">
  <article>
    <div class="work-lane-heading">
      <span class="lane-marker">01</span>
      <strong>{assignedCount}</strong>
    </div>
    <h2>Assigned work</h2>
    <p>Work Items and Deliverable Items resolved through your active responsibilities.</p>
  </article>
  <article>
    <div class="work-lane-heading">
      <span class="lane-marker">02</span>
      <strong>{reviewCount}</strong>
    </div>
    <h2>Reviews</h2>
    <p>Exact governed subject states requiring review, checking or assurance.</p>
  </article>
  <article>
    <div class="work-lane-heading">
      <span class="lane-marker">03</span>
      <strong>{decisionCount}</strong>
    </div>
    <h2>Approval &amp; acceptance</h2>
    <p>Approval or recipient-response actions tied to the exact issued subject.</p>
  </article>
  <article>
    <div class="work-lane-heading">
      <span class="lane-marker">04</span>
      <strong>{attentionCount}</strong>
    </div>
    <h2>Needs attention</h2>
    <p>Overdue obligations and competence evidence approaching expiry.</p>
  </article>
</section>

{#if items.length === 0}
  <section class="empty-work-state">
    <div class="empty-state-mark">MW</div>
    <div>
      <p class="app-eyebrow">Current tenant/person projection</p>
      <h2>No work requires your action.</h2>
      <p>
        The live My Work repository returned no active assignments, deliverable responsibilities,
        recipient responses or competence expiries for the current session.
      </p>
    </div>
  </section>
{:else}
  <section class="my-work-register">
    <header class="my-work-register-heading">
      <div>
        <p class="app-eyebrow">Live projection</p>
        <h2>Action register</h2>
      </div>
      <span>{items.length} active items</span>
    </header>

    <div class="my-work-items">
      {#each items as item}
        <article class:overdue={item.isOverdue}>
          <div class="my-work-kind">
            <span>{kindLabel(item.kind)}</span>
            {#if item.isOverdue}
              <strong>Overdue</strong>
            {/if}
          </div>

          <div class="my-work-primary">
            <h3>{item.title}</h3>
            <p>{item.reason}</p>
            <div class="my-work-identifiers">
              <span>Source <strong>{item.sourceId}</strong></span>
              {#if item.subjectObjectId}
                <span>Subject <strong>{item.subjectObjectId}</strong></span>
              {/if}
              {#if item.subjectVersion}
                <span>Version <strong>{item.subjectVersion}</strong></span>
              {/if}
            </div>
            {#if item.kind === 'ACCESS_REQUEST'}
              <a class="my-work-action-link" href={`/app/access#request-${item.sourceId}`}>
                Review access request →
              </a>
            {:else if item.href}
              <a class="my-work-action-link" href={item.href}>
                Open Function work →
              </a>
            {/if}
          </div>

          <dl class="my-work-meta">
            <div>
              <dt>Due</dt>
              <dd>{dueLabel(item.dueAt)}</dd>
            </div>
            {#if item.responsibilityRole}
              <div>
                <dt>Responsibility</dt>
                <dd>{item.responsibilityRole}</dd>
              </div>
            {/if}
            {#if item.priority}
              <div>
                <dt>Priority</dt>
                <dd>{item.priority}</dd>
              </div>
            {/if}
          </dl>
        </article>
      {/each}
    </div>
  </section>
{/if}
