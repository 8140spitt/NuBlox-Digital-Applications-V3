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
  <title>Change &amp; Configuration — NuBlox</title>
</svelte:head>

{#if !data.allowed || !data.projection}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit Change &amp; Configuration control.</h1>
      <p>
        NuBlox evaluated <code>platform.configuration.read</code> in the current tenant scope and
        did not find an active matching Access Role Assignment.
      </p>
      <p class="permission-reason">{data.reason}</p>
      <div class="permission-actions">
        <a
          class="primary-action permission-back"
          href="/app/request-access?permission=platform.configuration.read&returnTo=/app/configuration"
        >
          Request access <span aria-hidden="true">→</span>
        </a>
        <a class="quiet-link" href="/app">Back to Functions</a>
      </div>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact configuration-hero">
    <div>
      <p class="app-eyebrow">NTE-006 · governed change and configuration state</p>
      <h1>Change, Configuration &amp; Baseline</h1>
      <p class="workspace-lede">
        Trace proposed change through affected objects, impact, implementation and verification,
        then reconcile the controlled configuration items, baselines and effectivity that define
        the authoritative state.
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

  <section class="architecture-metrics configuration-metrics" aria-label="Configuration totals">
    <article>
      <span>Changes</span>
      <strong>{data.projection.totals.changes}</strong>
      <p>{data.projection.totals.openChanges} currently open</p>
    </article>
    <article>
      <span>Configuration items</span>
      <strong>{data.projection.totals.configurationItems}</strong>
      <p>Canonical controlled items</p>
    </article>
    <article>
      <span>Baselines</span>
      <strong>{data.projection.totals.baselines}</strong>
      <p>{data.projection.totals.establishedBaselines} established</p>
    </article>
    <article>
      <span>Effectivities</span>
      <strong>{data.projection.totals.effectivities}</strong>
      <p>Version applicability rules</p>
    </article>
  </section>

  {#if data.canManage}
    <details class="workspace-command-drawer">
      <summary>
        <span>Actions</span>
        <strong>Manage change &amp; configuration</strong>
        <small>Raise Changes, control Baselines and maintain Effectivity</small>
      </summary>
      <section class="information-admin configuration-admin">
      <header class="information-admin-heading">
        <div>
          <p class="app-eyebrow">Controlled commands</p>
          <h2>Change &amp; configuration administration</h2>
        </div>
        <p>
          Commitments are permission-gated. Change approval and Baseline establishment additionally
          require a Decision backed by an effective Authority Grant.
        </p>
      </header>

      <div class="information-command-grid">
        <details>
          <summary><span>01</span><strong>Raise change</strong></summary>
          <form method="POST" action="?/raiseChange" class="admin-form">
            <label><span>Code</span><input name="code" required maxlength="160" placeholder="CHG-0001" /></label>
            <label><span>Type</span><input name="changeType" required maxlength="120" placeholder="DESIGN_CHANGE" /></label>
            <label class="information-wide"><span>Title</span><input name="title" required maxlength="255" /></label>
            <label class="information-wide"><span>Description</span><textarea name="description" required rows="3"></textarea></label>
            <button type="submit">Raise Change <span>→</span></button>
          </form>
        </details>

        <details>
          <summary><span>02</span><strong>Create configuration item</strong></summary>
          <form method="POST" action="?/createConfigurationItem" class="admin-form">
            <label class="information-wide">
              <span>Canonical object</span>
              <select name="canonicalObjectId" required>
                <option value="">Select controlled object</option>
                {#each data.projection.canonicalObjects.filter((object) => object.objectType !== 'CHANGE') as object}
                  <option value={object.id}>{object.objectType} · {object.stableKey}</option>
                {/each}
              </select>
            </label>
            <label><span>Code</span><input name="code" required maxlength="160" /></label>
            <label><span>Name</span><input name="name" required maxlength="255" /></label>
            <button type="submit">Create Configuration Item <span>→</span></button>
          </form>
        </details>

        <details>
          <summary><span>03</span><strong>Create baseline</strong></summary>
          <form method="POST" action="?/createBaseline" class="admin-form">
            <label class="information-wide">
              <span>Context object</span>
              <select name="contextObjectId" required>
                <option value="">Select context</option>
                {#each data.projection.canonicalObjects.filter((object) => object.objectType !== 'CHANGE') as object}
                  <option value={object.id}>{object.objectType} · {object.stableKey}</option>
                {/each}
              </select>
            </label>
            <label><span>Code</span><input name="code" required maxlength="160" /></label>
            <label><span>Name</span><input name="name" required maxlength="255" /></label>
            <button type="submit">Create draft Baseline <span>→</span></button>
          </form>
        </details>

        <details>
          <summary><span>04</span><strong>Add baseline item</strong></summary>
          <form method="POST" action="?/addBaselineItem" class="admin-form">
            <label>
              <span>Draft Baseline</span>
              <select name="baselineId" required>
                <option value="">Select Baseline</option>
                {#each data.projection.baselines.filter((baseline) => baseline.status === 'DRAFT') as baseline}
                  <option value={baseline.id}>{baseline.code} · {baseline.name}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Configuration Item</span>
              <select name="configurationItemId" required>
                <option value="">Select item</option>
                {#each data.projection.configurationItems as item}
                  <option value={item.id}>{item.code} · {item.name}</option>
                {/each}
              </select>
            </label>
            <label><span>Subject version</span><input name="subjectVersion" required maxlength="120" /></label>
            <button type="submit">Add Baseline Item <span>→</span></button>
          </form>
        </details>

        <details>
          <summary><span>05</span><strong>Establish baseline</strong></summary>
          <form method="POST" action="?/establishBaseline" class="admin-form">
            <label>
              <span>Draft Baseline</span>
              <select name="baselineId" required>
                <option value="">Select Baseline</option>
                {#each data.projection.baselines.filter((baseline) => baseline.status === 'DRAFT') as baseline}
                  <option value={baseline.id}>{baseline.code} · {baseline.name}</option>
                {/each}
              </select>
            </label>
            <label class="information-wide">
              <span>Approved Authority-backed Decision ID</span>
              <input name="decisionId" required maxlength="64" placeholder="DEC-…" />
            </label>
            <button type="submit">Establish Baseline <span>→</span></button>
          </form>
        </details>

        <details>
          <summary><span>06</span><strong>Create effectivity</strong></summary>
          <form method="POST" action="?/createEffectivity" class="admin-form">
            <label>
              <span>Configuration Item</span>
              <select name="configurationItemId" required>
                <option value="">Select item</option>
                {#each data.projection.configurationItems as item}
                  <option value={item.id}>{item.code} · {item.name}</option>
                {/each}
              </select>
            </label>
            <label><span>Subject version</span><input name="subjectVersion" required maxlength="120" /></label>
            <label>
              <span>Effectivity type</span>
              <select name="effectivityType" required>
                <option value="PROJECT">Project</option>
                <option value="DATE">Date</option>
                <option value="LOCATION">Location</option>
                <option value="SERIAL">Serial</option>
                <option value="LOT">Lot</option>
                <option value="UNIT">Unit</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </label>
            <label><span>Scope type</span><input name="scopeType" required maxlength="80" placeholder="PROJECT" /></label>
            <label><span>Scope ID</span><input name="scopeId" maxlength="160" /></label>
            <label><span>Effective from</span><input type="datetime-local" name="effectiveFrom" /></label>
            <label><span>Effective to</span><input type="datetime-local" name="effectiveTo" /></label>
            <label class="information-wide"><span>Expression</span><input name="expression" /></label>
            <button type="submit">Create Effectivity <span>→</span></button>
          </form>
        </details>

        <details>
          <summary><span>07</span><strong>Supersede baseline</strong></summary>
          <form method="POST" action="?/supersedeBaseline" class="admin-form">
            <label>
              <span>Current established Baseline</span>
              <select name="currentBaselineId" required>
                <option value="">Select current</option>
                {#each data.projection.baselines.filter((baseline) => baseline.status === 'ESTABLISHED') as baseline}
                  <option value={baseline.id}>{baseline.code}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Replacement established Baseline</span>
              <select name="replacementBaselineId" required>
                <option value="">Select replacement</option>
                {#each data.projection.baselines.filter((baseline) => baseline.status === 'ESTABLISHED') as baseline}
                  <option value={baseline.id}>{baseline.code}</option>
                {/each}
              </select>
            </label>
            <button type="submit">Supersede Baseline <span>→</span></button>
          </form>
        </details>
      </div>
      </section>
    </details>
  {/if}

  <section class="configuration-workspace-grid">
    <div class="configuration-primary">
      <header class="configuration-section-heading">
        <div>
          <p class="app-eyebrow">Controlled change register</p>
          <h2>Change lifecycle</h2>
        </div>
        <p>Every status movement is retained in the governed Change history.</p>
      </header>

      <div class="change-register">
        {#if data.projection.changes.length === 0}
          <div class="empty-work-state">
            <p class="app-eyebrow">No changes</p>
            <h2>No governed Change records exist yet.</h2>
          </div>
        {:else}
          {#each data.projection.changes as change}
            <article class="change-card">
              <header>
                <div>
                  <span class="change-code">{change.code}</span>
                  <h3>{change.title}</h3>
                  <p>{change.changeType} · raised by {change.raisedByName} · {dateTime(change.raisedAt)}</p>
                </div>
                <span class="change-status">{change.status}</span>
              </header>

              <p class="change-description">{change.description}</p>

              <div class="change-facts">
                <span>{change.affectedObjects.length} affected object{change.affectedObjects.length === 1 ? '' : 's'}</span>
                <span>{change.impactAssessments.length} impact assessment{change.impactAssessments.length === 1 ? '' : 's'}</span>
                <span>{change.implementationActions.length} implementation action{change.implementationActions.length === 1 ? '' : 's'}</span>
                <span>{change.verifications.length} verification{change.verifications.length === 1 ? '' : 's'}</span>
              </div>

              {#if data.canManage}
                <div class="change-command-strip">
                  {#if change.status === 'DRAFT'}
                    <form method="POST" action="?/startAssessment">
                      <input type="hidden" name="changeId" value={change.id} />
                      <button type="submit">Start assessment</button>
                    </form>
                  {:else if change.status === 'UNDER_ASSESSMENT'}
                    <details>
                      <summary>Assessment commands</summary>
                      <div class="change-command-forms">
                        <form method="POST" action="?/addAffectedObject" class="admin-form">
                          <input type="hidden" name="changeId" value={change.id} />
                          <label>
                            <span>Affected object</span>
                            <select name="subjectObjectId" required>
                              <option value="">Select object</option>
                              {#each data.projection.canonicalObjects.filter((object) => object.id !== change.canonicalObjectId) as object}
                                <option value={object.id}>{object.objectType} · {object.stableKey}</option>
                              {/each}
                            </select>
                          </label>
                          <label><span>Version</span><input name="subjectVersion" maxlength="120" /></label>
                          <label>
                            <span>Disposition</span>
                            <select name="disposition" required>
                              <option value="MODIFY">Modify</option>
                              <option value="ADD">Add</option>
                              <option value="REMOVE">Remove</option>
                              <option value="REVIEW">Review</option>
                            </select>
                          </label>
                          <label class="information-wide"><span>Rationale</span><input name="rationale" required /></label>
                          <button type="submit">Add affected object</button>
                        </form>

                        <form method="POST" action="?/addImpactAssessment" class="admin-form">
                          <input type="hidden" name="changeId" value={change.id} />
                          <label><span>Domain</span><input name="domain" required maxlength="120" /></label>
                          <label>
                            <span>Impact level</span>
                            <select name="impactLevel" required>
                              <option value="LOW">Low</option>
                              <option value="MEDIUM">Medium</option>
                              <option value="HIGH">High</option>
                              <option value="CRITICAL">Critical</option>
                              <option value="NONE">None</option>
                            </select>
                          </label>
                          <label><span>Cost impact</span><input type="number" step="0.01" name="costImpact" /></label>
                          <label><span>Schedule days</span><input type="number" step="0.1" name="scheduleImpactDays" /></label>
                          <label class="information-wide"><span>Summary</span><textarea name="summary" required rows="2"></textarea></label>
                          <button type="submit">Record impact</button>
                        </form>
                      </div>
                    </details>
                    <form method="POST" action="?/submitForDecision">
                      <input type="hidden" name="changeId" value={change.id} />
                      <button type="submit">Submit for Decision</button>
                    </form>
                  {:else if change.status === 'AWAITING_DECISION'}
                    <form method="POST" action="?/applyDecision" class="inline-command-form">
                      <input type="hidden" name="changeId" value={change.id} />
                      <input name="decisionId" required maxlength="64" placeholder="Authority-backed Decision ID" />
                      <button type="submit">Apply Decision</button>
                    </form>
                  {:else if change.status === 'APPROVED'}
                    <form method="POST" action="?/startImplementation">
                      <input type="hidden" name="changeId" value={change.id} />
                      <button type="submit">Start implementation</button>
                    </form>
                  {:else if change.status === 'IMPLEMENTING'}
                    <details>
                      <summary>Implementation commands</summary>
                      <form method="POST" action="?/createImplementationAction" class="admin-form">
                        <input type="hidden" name="changeId" value={change.id} />
                        <label><span>Action type</span><input name="actionType" required maxlength="120" /></label>
                        <label class="information-wide"><span>Description</span><input name="description" required /></label>
                        <label>
                          <span>Target object</span>
                          <select name="targetObjectId">
                            <option value="">No target</option>
                            {#each data.projection.canonicalObjects.filter((object) => object.id !== change.canonicalObjectId) as object}
                              <option value={object.id}>{object.objectType} · {object.stableKey}</option>
                            {/each}
                          </select>
                        </label>
                        <label><span>Target version</span><input name="targetVersion" maxlength="120" /></label>
                        <button type="submit">Create action</button>
                      </form>
                      <div class="change-action-controls">
                        {#each change.implementationActions as action}
                          {#if action.status === 'PLANNED'}
                            <form method="POST" action="?/startImplementationAction">
                              <input type="hidden" name="actionId" value={action.id} />
                              <button type="submit">Start · {action.actionType}</button>
                            </form>
                          {/if}
                          {#if action.status === 'PLANNED' || action.status === 'IN_PROGRESS'}
                            <form method="POST" action="?/completeImplementationAction">
                              <input type="hidden" name="actionId" value={action.id} />
                              <button type="submit">Complete · {action.actionType}</button>
                            </form>
                          {/if}
                        {/each}
                      </div>
                    </details>
                    <form method="POST" action="?/beginVerification">
                      <input type="hidden" name="changeId" value={change.id} />
                      <button type="submit">Begin verification</button>
                    </form>
                  {:else if change.status === 'VERIFYING'}
                    <details>
                      <summary>Verification commands</summary>
                      <div class="change-command-forms">
                        <form method="POST" action="?/recordVerification" class="admin-form">
                          <input type="hidden" name="changeId" value={change.id} />
                          <label>
                            <span>Outcome</span>
                            <select name="outcome" required>
                              <option value="PASS">Pass</option>
                              <option value="PARTIAL">Partial</option>
                              <option value="FAIL">Fail</option>
                            </select>
                          </label>
                          <label><span>Evidence record ID</span><input name="evidenceRecordId" maxlength="64" /></label>
                          <label class="information-wide"><span>Notes</span><textarea name="notes" required rows="2"></textarea></label>
                          <button type="submit">Record verification</button>
                        </form>

                        <form method="POST" action="?/createDiscrepancy" class="admin-form">
                          <input type="hidden" name="changeId" value={change.id} />
                          <label>
                            <span>Affected object</span>
                            <select name="affectedObjectId">
                              <option value="">General discrepancy</option>
                              {#each change.affectedObjects as affected}
                                <option value={affected.id}>{affected.stableKey}</option>
                              {/each}
                            </select>
                          </label>
                          <label class="information-wide"><span>Description</span><input name="description" required /></label>
                          <button type="submit">Open discrepancy</button>
                        </form>
                      </div>
                      {#each change.discrepancies.filter((discrepancy) => discrepancy.status === 'OPEN') as discrepancy}
                        <form method="POST" action="?/resolveDiscrepancy" class="inline-command-form">
                          <input type="hidden" name="discrepancyId" value={discrepancy.id} />
                          <select name="status" required>
                            <option value="RESOLVED">Resolved</option>
                            <option value="ACCEPTED">Accepted</option>
                          </select>
                          <input name="resolution" required placeholder={discrepancy.description} />
                          <button type="submit">Close discrepancy</button>
                        </form>
                      {/each}
                    </details>
                    <form method="POST" action="?/closeChange" class="inline-command-form">
                      <input type="hidden" name="changeId" value={change.id} />
                      <select name="resultingBaselineId">
                        <option value="">No resulting Baseline</option>
                        {#each data.projection.baselines.filter((baseline) => baseline.status === 'ESTABLISHED') as baseline}
                          <option value={baseline.id}>{baseline.code}</option>
                        {/each}
                      </select>
                      <button type="submit">Close Change</button>
                    </form>
                  {/if}
                </div>
              {/if}

              <details>
                <summary>Change evidence and lineage</summary>
                <div class="change-detail-grid">
                  <section>
                    <h4>Affected objects</h4>
                    {#if change.affectedObjects.length === 0}
                      <p class="information-empty">No affected objects recorded.</p>
                    {:else}
                      {#each change.affectedObjects as affected}
                        <div class="change-detail-row">
                          <strong>{affected.disposition} · {affected.stableKey}</strong>
                          <span>{affected.objectType}{affected.subjectVersion ? ` · v${affected.subjectVersion}` : ''}</span>
                          <p>{affected.rationale}</p>
                        </div>
                      {/each}
                    {/if}
                  </section>

                  <section>
                    <h4>Impact</h4>
                    {#if change.impactAssessments.length === 0}
                      <p class="information-empty">No impact assessment recorded.</p>
                    {:else}
                      {#each change.impactAssessments as impact}
                        <div class="change-detail-row">
                          <strong>{impact.impactLevel} · {impact.domain}</strong>
                          <span>{impact.assessorName} · {dateTime(impact.assessedAt)}</span>
                          <p>{impact.summary}</p>
                        </div>
                      {/each}
                    {/if}
                  </section>

                  <section>
                    <h4>Implementation</h4>
                    {#if change.implementationActions.length === 0}
                      <p class="information-empty">No implementation actions recorded.</p>
                    {:else}
                      {#each change.implementationActions as action}
                        <div class="change-detail-row">
                          <strong>{action.status} · {action.actionType}</strong>
                          <p>{action.description}</p>
                        </div>
                      {/each}
                    {/if}
                  </section>

                  <section>
                    <h4>Verification &amp; discrepancies</h4>
                    {#each change.verifications as verification}
                      <div class="change-detail-row">
                        <strong>{verification.outcome} · {verification.verifierName}</strong>
                        <span>{dateTime(verification.verifiedAt)}</span>
                        <p>{verification.notes}</p>
                      </div>
                    {/each}
                    {#each change.discrepancies as discrepancy}
                      <div class="change-detail-row">
                        <strong>{discrepancy.status} discrepancy</strong>
                        <p>{discrepancy.description}</p>
                      </div>
                    {/each}
                    {#if change.verifications.length === 0 && change.discrepancies.length === 0}
                      <p class="information-empty">No verification evidence or discrepancies recorded.</p>
                    {/if}
                  </section>
                </div>

                <div class="change-history">
                  {#each change.history as history}
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
    </div>

    <aside class="configuration-secondary">
      <section class="configuration-panel">
        <header>
          <p class="app-eyebrow">Configuration status</p>
          <h2>Configuration items</h2>
        </header>
        <div class="configuration-item-list">
          {#if data.projection.configurationItems.length === 0}
            <p class="information-empty">No Configuration Items exist yet.</p>
          {:else}
            {#each data.projection.configurationItems as item}
              <div>
                <span>{item.status}</span>
                <strong>{item.code}</strong>
                <p>{item.name}</p>
                <small>{item.objectType} · {item.stableKey}</small>
              </div>
            {/each}
          {/if}
        </div>
      </section>

      <section class="configuration-panel">
        <header>
          <p class="app-eyebrow">Frozen configuration</p>
          <h2>Baselines</h2>
        </header>
        <div class="baseline-list">
          {#if data.projection.baselines.length === 0}
            <p class="information-empty">No Baselines exist yet.</p>
          {:else}
            {#each data.projection.baselines as baseline}
              <article>
                <div>
                  <span>{baseline.status}</span>
                  <strong>{baseline.code}</strong>
                </div>
                <h3>{baseline.name}</h3>
                <p>{baseline.contextObjectType} · {baseline.contextStableKey}</p>
                {#if baseline.establishedAt}
                  <small>Established {dateTime(baseline.establishedAt)}</small>
                {/if}
                <div class="baseline-items">
                  {#each baseline.items as item}
                    <span>{item.configurationItemCode} · v{item.subjectVersion}</span>
                  {/each}
                </div>
              </article>
            {/each}
          {/if}
        </div>
      </section>

      <section class="configuration-panel">
        <header>
          <p class="app-eyebrow">Applicability</p>
          <h2>Effectivity</h2>
        </header>
        <div class="effectivity-list">
          {#if data.projection.effectivities.length === 0}
            <p class="information-empty">No Effectivity rules exist yet.</p>
          {:else}
            {#each data.projection.effectivities as effectivity}
              <div>
                <span>{effectivity.status}</span>
                <strong>{effectivity.configurationItemCode} · v{effectivity.subjectVersion}</strong>
                <p>{effectivity.effectivityType} · {effectivity.scopeType}{effectivity.scopeId ? ` · ${effectivity.scopeId}` : ''}</p>
              </div>
            {/each}
          {/if}
        </div>
      </section>
    </aside>
  </section>
{/if}
