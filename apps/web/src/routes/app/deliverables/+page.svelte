<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function dateTime(value: string) {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }
</script>

<svelte:head>
  <title>Deliverables — NuBlox</title>
</svelte:head>

{#if !data.allowed || !data.projection}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit Deliverable control.</h1>
      <p>
        NuBlox evaluated <code>platform.deliverable.read</code> in the current tenant scope and
        did not find an active matching Access Role Assignment.
      </p>
      <p class="permission-reason">{data.reason}</p>
      <div class="permission-actions">
        <a
          class="primary-action permission-back"
          href="/app/request-access?permission=platform.deliverable.read&returnTo=/app/deliverables"
        >
          Request access <span aria-hidden="true">→</span>
        </a>
        <a class="quiet-link" href="/app">Back to Functions</a>
      </div>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact deliverable-hero">
    <div>
      <p class="app-eyebrow">NTE-007 · governed work delivery</p>
      <h1>Deliverable, Issue &amp; Acceptance</h1>
      <p class="workspace-lede">
        Control required work products from requirement and responsibility through exact-version
        review, approval, issue, recipient response, rework, acceptance and closure.
      </p>
    </div>
    {#if !data.canManage}
      <div class="workspace-readonly">Read access only</div>
    {/if}
  </section>

  <section class="architecture-metrics deliverable-metrics" aria-label="Deliverable totals">
    <article>
      <span>Requirements</span>
      <strong>{data.projection.totals.requirements}</strong>
      <p>Governed delivery obligations</p>
    </article>
    <article>
      <span>Active items</span>
      <strong>{data.projection.totals.activeItems}</strong>
      <p>{data.projection.totals.inReview} currently in review</p>
    </article>
    <article>
      <span>Issued</span>
      <strong>{data.projection.totals.issued}</strong>
      <p>{data.projection.totals.responseActions} recipient responses due</p>
    </article>
    <article>
      <span>Accepted</span>
      <strong>{data.projection.totals.accepted}</strong>
      <p>{data.projection.totals.rework} currently in rework</p>
    </article>
  </section>

  <section class="deliverable-register">
    <header class="configuration-section-heading">
      <div>
        <p class="app-eyebrow">Requirement to acceptance</p>
        <h2>Delivery register</h2>
      </div>
      <p>All controls remain bound to the exact governed output object and version.</p>
    </header>

    {#if data.projection.requirements.length === 0}
      <div class="empty-work-state">
        <p class="app-eyebrow">No requirements</p>
        <h2>No governed Deliverable Requirements exist yet.</h2>
      </div>
    {:else}
      <div class="deliverable-requirements">
        {#each data.projection.requirements as requirement}
          <article class="deliverable-requirement-card">
            <header>
              <div>
                <span class="change-code">{requirement.code}</span>
                <h3>{requirement.title}</h3>
                <p>{requirement.deliverableType} · {requirement.contextType} · {requirement.contextKey}</p>
              </div>
              <div class="deliverable-requirement-meta">
                <span>{requirement.authoringMode}</span>
                <span>{requirement.acceptanceRequired ? 'Acceptance required' : 'Acceptance not required'}</span>
              </div>
            </header>
            <p class="change-description">{requirement.description}</p>
            <div class="deliverable-representation-tags">
              {#each requirement.requiredRepresentationTypes as representation}
                <span>{representation}</span>
              {/each}
              {#if requirement.plannedDueAt}
                <span>Due {dateTime(requirement.plannedDueAt)}</span>
              {/if}
            </div>

            <div class="deliverable-items">
              {#if requirement.items.length === 0}
                <p class="information-empty">No Deliverable Items have been instantiated.</p>
              {:else}
                {#each requirement.items as item}
                  <article class="deliverable-item-card">
                    <header>
                      <div>
                        <strong>{item.code}</strong>
                        <h4>{item.title}</h4>
                        <p>{item.deliverableType}</p>
                      </div>
                      <span class="change-status">{item.status}</span>
                    </header>

                    <div class="deliverable-item-facts">
                      <span>
                        Output:
                        {item.governedOutputObjectId
                          ? `${item.governedOutputObjectId}${item.governedOutputVersion ? ` · v${item.governedOutputVersion}` : ''}`
                          : 'Not yet bound'}
                      </span>
                      {#if item.authoringBinding}
                        <span>Authoring: {item.authoringBinding.mode} · {item.authoringBinding.providerKey}</span>
                      {/if}
                      <span>{item.responsibilities.length} responsibilities</span>
                      <span>{item.reviews.length} reviews</span>
                      <span>{item.approvals.length} approvals</span>
                      <span>{item.transmittals.length} issues</span>
                    </div>

                    <details>
                      <summary>Responsibility, assurance &amp; issue history</summary>
                      <div class="deliverable-detail-grid">
                        <section>
                          <h5>Responsibilities</h5>
                          {#if item.responsibilities.length === 0}
                            <p class="information-empty">No responsibilities assigned.</p>
                          {:else}
                            {#each item.responsibilities as responsibility}
                              <div class="change-detail-row">
                                <strong>{responsibility.responsibilityRole} · {responsibility.principalName}</strong>
                                <span>{responsibility.principalType} · {responsibility.status}</span>
                              </div>
                            {/each}
                          {/if}
                        </section>

                        <section>
                          <h5>Review &amp; approval</h5>
                          {#each item.reviews as review}
                            <div class="change-detail-row">
                              <strong>{review.outcome} · {review.reviewType}</strong>
                              <span>{review.reviewerName} · {dateTime(review.reviewedAt)}</span>
                              {#if review.comments}<p>{review.comments}</p>{/if}
                            </div>
                          {/each}
                          {#each item.approvals as approval}
                            <div class="change-detail-row">
                              <strong>{approval.decisionOutcome} Decision</strong>
                              <span>{approval.deciderName} · {dateTime(approval.approvedAt)}</span>
                              <p>{approval.authorityGrantId ? 'Authority-backed' : 'No Authority Grant recorded'}</p>
                            </div>
                          {/each}
                          {#if item.reviews.length === 0 && item.approvals.length === 0}
                            <p class="information-empty">No review or approval evidence recorded.</p>
                          {/if}
                        </section>

                        <section>
                          <h5>Issue &amp; recipient response</h5>
                          {#if item.transmittals.length === 0}
                            <p class="information-empty">No Transmittals recorded.</p>
                          {:else}
                            {#each item.transmittals as transmittal}
                              <div class="deliverable-transmittal">
                                <strong>{transmittal.issueReference} · {transmittal.issuePurpose}</strong>
                                <span>{transmittal.issuerName} · {dateTime(transmittal.issuedAt)}</span>
                                {#each transmittal.recipients as recipient}
                                  <div class="deliverable-recipient">
                                    <span>{recipient.recipientName}</span>
                                    {#if recipient.response}
                                      <strong>{recipient.response.outcome}</strong>
                                      <small>{dateTime(recipient.response.respondedAt)}</small>
                                    {:else if recipient.responseRequired}
                                      <strong>Response pending</strong>
                                      {#if recipient.dueAt}<small>Due {dateTime(recipient.dueAt)}</small>{/if}
                                    {:else}
                                      <strong>For information</strong>
                                    {/if}
                                  </div>
                                {/each}
                              </div>
                            {/each}
                          {/if}
                        </section>

                        <section>
                          <h5>Rework &amp; consequences</h5>
                          {#each item.rework as rework}
                            <div class="change-detail-row">
                              <strong>REWORK · {rework.triggerType}</strong>
                              <span>{dateTime(rework.createdAt)}</span>
                              <p>{rework.reason}</p>
                            </div>
                          {/each}
                          {#each item.consequences as consequence}
                            <div class="change-detail-row">
                              <strong>{consequence.status} · {consequence.consequenceType}</strong>
                              {#if consequence.targetObjectId}
                                <span>{consequence.targetObjectId}{consequence.targetVersion ? ` · v${consequence.targetVersion}` : ''}</span>
                              {/if}
                            </div>
                          {/each}
                          {#if item.rework.length === 0 && item.consequences.length === 0}
                            <p class="information-empty">No rework or downstream consequences recorded.</p>
                          {/if}
                        </section>
                      </div>

                      <div class="change-history">
                        {#each item.history as history}
                          <div>
                            <span>{history.status}</span>
                            <strong>{dateTime(history.recordedAt)}</strong>
                            <small>{history.actorName ?? 'System'}{history.note ? ` · ${history.note}` : ''}</small>
                          </div>
                        {/each}
                      </div>
                    </details>
                  </article>
                {/each}
              {/if}
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </section>
{/if}
