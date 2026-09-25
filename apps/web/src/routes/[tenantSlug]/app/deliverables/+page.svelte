<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

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
        review, Authority-backed approval, controlled issue, recipient response, rework,
        acceptance and closure.
      </p>
    </div>
    {#if !data.canManage}
      <div class="workspace-readonly">Read access only</div>
    {/if}
  </section>

  {#if form?.message || form?.error}
    <div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
      <strong>{form?.ok ? 'Completed' : 'Action not completed'}</strong>
      <span>{form?.message ?? form?.error}</span>
    </div>
  {/if}

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

  {#if data.canManage}
    <details class="workspace-command-drawer">
      <summary>
        <span>Actions</span>
        <strong>Manage deliverables</strong>
        <small>Create obligations and initiate governed delivery work</small>
      </summary>
      <section class="information-admin deliverable-admin">
      <header class="information-admin-heading">
        <div>
          <p class="app-eyebrow">Controlled commands</p>
          <h2>Delivery setup</h2>
        </div>
        <p>
          NuBlox creates native Deliverable obligations and execution Items against canonical
          context. Approval cannot be applied without an exact-subject Decision backed by active
          Authority.
        </p>
      </header>

      <div class="information-command-grid">
        <details>
          <summary><span>01</span><strong>Create requirement</strong></summary>
          <form method="POST" action="?/createRequirement" class="admin-form">
            <label><span>Code</span><input name="code" required maxlength="160" placeholder="REQ-A-1001" /></label>
            <label><span>Deliverable type</span><input name="deliverableType" required maxlength="120" placeholder="DRAWING" /></label>
            <label class="information-wide"><span>Title</span><input name="title" required maxlength="255" /></label>
            <label class="information-wide"><span>Description</span><textarea name="description" required rows="3"></textarea></label>
            <label class="information-wide">
              <span>Context object</span>
              <select name="contextObjectId" required>
                <option value="">Select project, package, asset or other context</option>
                {#each data.projection.canonicalObjects.filter((object) => object.objectType !== 'DELIVERABLE_ITEM') as object}
                  <option value={object.id}>{object.objectType} · {object.stableKey}</option>
                {/each}
              </select>
            </label>
            <label><span>Required Representations</span><input name="requiredRepresentationTypes" placeholder="PDF, IFC" /></label>
            <label><span>Planned due</span><input type="datetime-local" name="plannedDueAt" /></label>
            <label class="information-checkbox">
              <input type="checkbox" name="acceptanceRequired" />
              <span>Recipient acceptance required</span>
            </label>
            <button type="submit">Create Requirement <span>→</span></button>
          </form>
        </details>

        <details>
          <summary><span>02</span><strong>Create Deliverable Item</strong></summary>
          <form method="POST" action="?/createItem" class="admin-form">
            <label class="information-wide">
              <span>Requirement</span>
              <select name="requirementId" required>
                <option value="">Select Requirement</option>
                {#each data.projection.requirements.filter((requirement) => requirement.status === 'ACTIVE') as requirement}
                  <option value={requirement.id}>{requirement.code} · {requirement.title}</option>
                {/each}
              </select>
            </label>
            <label><span>Item code</span><input name="code" required maxlength="160" /></label>
            <label><span>Title</span><input name="title" required maxlength="255" /></label>
            <label><span>Planned start</span><input type="datetime-local" name="plannedAt" /></label>
            <label><span>Forecast</span><input type="datetime-local" name="forecastAt" /></label>
            <button type="submit">Create Item <span>→</span></button>
          </form>
        </details>
      </div>
      </section>
    </details>
  {/if}

  <section class="deliverable-register">
    <header class="configuration-section-heading">
      <div>
        <p class="app-eyebrow">Requirement to acceptance</p>
        <h2>Delivery register</h2>
      </div>
      <p>All assurance and issue controls remain bound to the exact governed output object/version.</p>
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

                    {#if data.canManage && item.status !== 'CLOSED' && item.status !== 'CANCELLED'}
                      <div class="deliverable-command-strip">
                        {#if !item.authoringBinding}
                          <details>
                            <summary>Bind native authoring</summary>
                            <form method="POST" action="?/createAuthoringBinding" class="admin-form">
                              <input type="hidden" name="itemId" value={item.id} />
                              <label class="information-wide">
                                <span>Authoritative NuBlox Information object</span>
                                <select name="authoritativeObjectId" required>
                                  <option value="">Select Information Container</option>
                                  {#each data.projection.canonicalObjects.filter((object) => object.objectType === 'INFORMATION_CONTAINER') as object}
                                    <option value={object.id}>{object.stableKey}</option>
                                  {/each}
                                </select>
                              </label>
                              <button type="submit">Bind native authoring</button>
                            </form>
                          </details>
                        {/if}

                        <details>
                          <summary>Assign responsibility</summary>
                          <form method="POST" action="?/addResponsibility" class="admin-form">
                            <input type="hidden" name="itemId" value={item.id} />
                            <input type="hidden" name="principalType" value="PERSON" />
                            <label>
                              <span>Person</span>
                              <select name="principalId" required>
                                <option value="">Select person</option>
                                {#each data.projection.people as person}
                                  <option value={person.id}>{person.displayName}</option>
                                {/each}
                              </select>
                            </label>
                            <label>
                              <span>Responsibility</span>
                              <select name="responsibilityRole" required>
                                <option value="RESPONSIBLE">Responsible</option>
                                <option value="ACCOUNTABLE">Accountable</option>
                                <option value="CONTRIBUTOR">Contributor</option>
                                <option value="REVIEWER">Reviewer</option>
                                <option value="CHECKER">Checker</option>
                                <option value="APPROVER">Approver</option>
                                <option value="ACCEPTOR">Acceptor</option>
                                <option value="ASSURANCE">Assurance</option>
                                <option value="CONSULTED">Consulted</option>
                                <option value="INFORMED">Informed</option>
                              </select>
                            </label>
                            <label><span>Effective from</span><input type="datetime-local" name="effectiveFrom" /></label>
                            <label><span>Effective to</span><input type="datetime-local" name="effectiveTo" /></label>
                            <button type="submit">Assign responsibility</button>
                          </form>
                        </details>

                        {#if item.status === 'PLANNED'}
                          <form method="POST" action="?/startItem">
                            <input type="hidden" name="itemId" value={item.id} />
                            <button type="submit" disabled={!item.authoringBinding}>Start execution</button>
                          </form>
                        {:else if item.status === 'IN_PROGRESS' || item.status === 'REWORK'}
                          <details>
                            <summary>Bind exact output</summary>
                            <form method="POST" action="?/bindOutput" class="admin-form">
                              <input type="hidden" name="itemId" value={item.id} />
                              <label>
                                <span>Governed Information object</span>
                                <select name="outputObjectId" required>
                                  <option value="">Select output</option>
                                  {#each data.projection.canonicalObjects.filter((object) => object.objectType === 'INFORMATION_CONTAINER') as object}
                                    <option value={object.id}>{object.stableKey}</option>
                                  {/each}
                                </select>
                              </label>
                              <label><span>Exact revision/version</span><input name="outputVersion" maxlength="120" placeholder="A" /></label>
                              <button type="submit">Bind output</button>
                            </form>
                          </details>
                          <form method="POST" action="?/submitForReview">
                            <input type="hidden" name="itemId" value={item.id} />
                            <button type="submit" disabled={!item.governedOutputObjectId}>Submit for review</button>
                          </form>
                        {:else if item.status === 'IN_REVIEW'}
                          <details>
                            <summary>Record exact-version review</summary>
                            <form method="POST" action="?/recordReview" class="admin-form">
                              <input type="hidden" name="itemId" value={item.id} />
                              <label>
                                <span>Review type</span>
                                <select name="reviewType" required>
                                  <option value="CHECK">Check</option>
                                  <option value="PEER_REVIEW">Peer review</option>
                                  <option value="TECHNICAL_REVIEW">Technical review</option>
                                  <option value="ASSURANCE">Assurance</option>
                                  <option value="AUTHOR_REVIEW">Author review</option>
                                  <option value="CUSTOM">Custom</option>
                                </select>
                              </label>
                              <label>
                                <span>Outcome</span>
                                <select name="outcome" required>
                                  <option value="NO_COMMENT">No comment</option>
                                  <option value="COMMENTS">Comments</option>
                                  <option value="REVISE">Revise</option>
                                  <option value="REJECTED">Rejected</option>
                                </select>
                              </label>
                              <label class="information-wide"><span>Comments</span><textarea name="comments" rows="2"></textarea></label>
                              <label><span>Evidence record ID</span><input name="evidenceRecordId" maxlength="64" /></label>
                              <button type="submit">Record review</button>
                            </form>
                          </details>
                          <form method="POST" action="?/approve" class="inline-command-form">
                            <input type="hidden" name="itemId" value={item.id} />
                            <input name="decisionId" required maxlength="64" placeholder="Authority-backed approval Decision ID" />
                            <button type="submit">Apply approval</button>
                          </form>
                          {#if item.reviews.length > 0}
                            <details>
                              <summary>Require rework</summary>
                              <form method="POST" action="?/createRework" class="admin-form">
                                <input type="hidden" name="itemId" value={item.id} />
                                <input type="hidden" name="triggerType" value="REVIEW" />
                                <label>
                                  <span>Review trigger</span>
                                  <select name="triggerId" required>
                                    {#each item.reviews as review}
                                      <option value={review.id}>{review.outcome} · {review.reviewType} · {dateTime(review.reviewedAt)}</option>
                                    {/each}
                                  </select>
                                </label>
                                <label class="information-wide"><span>Reason</span><input name="reason" required /></label>
                                <button type="submit">Enter rework</button>
                              </form>
                            </details>
                          {/if}
                        {:else if item.status === 'APPROVED'}
                          <details>
                            <summary>Issue controlled Transmittal</summary>
                            <form method="POST" action="?/issue" class="admin-form">
                              <input type="hidden" name="itemId" value={item.id} />
                              <label><span>Issue reference</span><input name="issueReference" required maxlength="160" /></label>
                              <label><span>Issue purpose</span><input name="issuePurpose" required maxlength="160" placeholder="FOR CONSTRUCTION" /></label>
                              <label><span>Representation ID</span><input name="representationId" maxlength="64" placeholder="Optional exact Representation" /></label>
                              <label class="information-checkbox">
                                <input type="checkbox" name="responseRequired" />
                                <span>Recipient response required</span>
                              </label>
                              <button type="submit">Issue Deliverable</button>
                            </form>
                          </details>
                        {:else if item.status === 'ISSUED'}
                          {#each item.transmittals.slice(0, 1) as transmittal}
                            <details>
                              <summary>Add recipient</summary>
                              <form method="POST" action="?/addRecipient" class="admin-form">
                                <input type="hidden" name="transmittalId" value={transmittal.id} />
                                <label>
                                  <span>Recipient</span>
                                  <select name="recipientPartyId" required>
                                    <option value="">Select Party</option>
                                    {#each data.projection.parties as party}
                                      <option value={party.id}>{party.displayName} · {party.kind}</option>
                                    {/each}
                                  </select>
                                </label>
                                <label><span>Due</span><input type="datetime-local" name="dueAt" /></label>
                                <label class="information-checkbox">
                                  <input type="checkbox" name="responseRequired" />
                                  <span>Response required</span>
                                </label>
                                <button type="submit">Add recipient</button>
                              </form>
                            </details>

                            {#each transmittal.recipients.filter((recipient) => !recipient.response) as recipient}
                              <details>
                                <summary>Record response · {recipient.recipientName}</summary>
                                <form method="POST" action="?/recordResponse" class="admin-form">
                                  <input type="hidden" name="recipientId" value={recipient.id} />
                                  <label>
                                    <span>Outcome</span>
                                    <select name="outcome" required>
                                      <option value="ACCEPTED">Accepted</option>
                                      <option value="ACCEPTED_WITH_COMMENTS">Accepted with comments</option>
                                      <option value="NO_OBJECTION">No objection</option>
                                      <option value="REVISE">Revise</option>
                                      <option value="REJECTED">Rejected</option>
                                    </select>
                                  </label>
                                  <label class="information-wide"><span>Comments</span><textarea name="comments" rows="2"></textarea></label>
                                  <label><span>Evidence record ID</span><input name="evidenceRecordId" maxlength="64" /></label>
                                  <button type="submit">Record response</button>
                                </form>
                              </details>
                            {/each}

                            <form method="POST" action="?/accept">
                              <input type="hidden" name="itemId" value={item.id} />
                              <input type="hidden" name="transmittalId" value={transmittal.id} />
                              <button type="submit">Complete acceptance</button>
                            </form>

                            {#each transmittal.recipients.filter((recipient) => recipient.response && ['REVISE', 'REJECTED'].includes(recipient.response.outcome)) as recipient}
                              <form method="POST" action="?/createRework" class="inline-command-form">
                                <input type="hidden" name="itemId" value={item.id} />
                                <input type="hidden" name="triggerType" value="RECIPIENT_RESPONSE" />
                                <input type="hidden" name="triggerId" value={recipient.response?.id} />
                                <input name="reason" required placeholder="Rework reason from recipient response" />
                                <button type="submit">Enter rework</button>
                              </form>
                            {/each}
                          {/each}
                        {:else if item.status === 'ACCEPTED'}
                          <details>
                            <summary>Create downstream consequence</summary>
                            <form method="POST" action="?/createConsequence" class="admin-form">
                              <input type="hidden" name="itemId" value={item.id} />
                              <label><span>Consequence type</span><input name="consequenceType" required maxlength="120" placeholder="RELEASE_DOWNSTREAM_WORK" /></label>
                              <label>
                                <span>Target object</span>
                                <select name="targetObjectId">
                                  <option value="">No target</option>
                                  {#each data.projection.canonicalObjects.filter((object) => object.id !== item.canonicalObjectId) as object}
                                    <option value={object.id}>{object.objectType} · {object.stableKey}</option>
                                  {/each}
                                </select>
                              </label>
                              <label><span>Target version</span><input name="targetVersion" maxlength="120" /></label>
                              <label><span>Evidence record ID</span><input name="evidenceRecordId" maxlength="64" /></label>
                              <button type="submit">Create consequence</button>
                            </form>
                          </details>
                          {#each item.consequences.filter((consequence) => consequence.status === 'PENDING') as consequence}
                            <form method="POST" action="?/applyConsequence">
                              <input type="hidden" name="consequenceId" value={consequence.id} />
                              <button type="submit">Apply consequence · {consequence.consequenceType}</button>
                            </form>
                          {/each}
                          <form method="POST" action="?/close">
                            <input type="hidden" name="itemId" value={item.id} />
                            <button type="submit">Close Deliverable</button>
                          </form>
                        {/if}
                      </div>
                    {/if}

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
