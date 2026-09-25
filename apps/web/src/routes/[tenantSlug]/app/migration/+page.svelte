<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  function planName(planId: string): string {
    const plan = data.projection?.plans.find((item) => item.id === planId);
    return plan ? `${plan.code} · ${plan.name}` : planId;
  }

  function runName(runId: string): string {
    const run = data.projection?.runs.find((item) => item.id === runId);
    return run?.runReference ?? runId;
  }
</script>

<svelte:head>
  <title>Migration Control — NuBlox</title>
</svelte:head>

{#if !data.allowed || !data.projection}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit Migration Control access.</h1>
      <p>NuBlox evaluated <code>platform.migration.read</code> in the current tenant scope.</p>
      <p class="permission-reason">{data.reason}</p>
      <div class="permission-actions">
        <a
          class="primary-action permission-back"
          href="/app/request-access?permission=platform.migration.read&returnTo=/app/migration"
        >
          Request access <span aria-hidden="true">→</span>
        </a>
        <a class="quiet-link" href="/app/integration">Back to Integration Control</a>
      </div>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact">
    <div>
      <p class="app-eyebrow">Controlled data transition</p>
      <h1>Migration Control</h1>
      <p class="workspace-lede">
        Define migration scope, freeze transformation rules, retain exact source evidence,
        control semantic conflicts, prove reconciliation and approve operational cutover
        without treating successful inserts as migration completion.
      </p>
    </div>
  </section>

  {#if form?.message || form?.error}
    <div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
      <strong>{form?.ok ? 'Completed' : 'Action not completed'}</strong>
      <span>{form?.message ?? form?.error}</span>
    </div>
  {/if}

  <section class="architecture-metrics" aria-label="Migration totals">
    <article>
      <span>Plans</span>
      <strong>{data.projection.totals.plans}</strong>
      <p>{data.projection.totals.activePlans} active</p>
    </article>
    <article>
      <span>Runs</span>
      <strong>{data.projection.totals.runs}</strong>
      <p>{data.projection.totals.blockedRuns} blocked</p>
    </article>
    <article>
      <span>Blocking conflicts</span>
      <strong>{data.projection.totals.openBlockingConflicts}</strong>
      <p>Must be dispositioned before verified cutover</p>
    </article>
    <article>
      <span>Approved cutovers</span>
      <strong>{data.projection.totals.approvedCutovers}</strong>
      <p>{data.projection.totals.verifiedReconciliations} verified reconciliation(s)</p>
    </article>
  </section>

  <section class="workspace-panel">
    <div class="panel-heading">
      <div>
        <p class="app-eyebrow">Critical invariant</p>
        <h2>Load success is not migration completion</h2>
      </div>
    </div>
    <p>
      <strong>Extract ≠ map ≠ load ≠ reconcile ≠ semantic preservation ≠ cutover ≠ authority transfer.</strong>
      A production cutover requires a frozen Mapping Version, exact per-item evidence,
      resolved blocking conflicts, a VERIFIED Reconciliation Run, an approved Decision
      and an effective NuBlox Source Authority Rule.
    </p>
  </section>

  <div class="control-workspace-grid">
    <section class="workspace-panel">
      <div class="panel-heading">
        <div>
          <p class="app-eyebrow">Definition &amp; governance</p>
          <h2>Plans and immutable mappings</h2>
        </div>
        <span>{data.canManage ? 'Manage' : 'Read only'}</span>
      </div>

      {#if !data.canManage}
        <p>
          Migration definition management requires <code>platform.migration.manage</code>.
          <a href="/app/request-access?permission=platform.migration.manage&returnTo=/app/migration">Request access</a>.
        </p>
      {:else}
        <details open>
          <summary>Create migration plan</summary>
          <form method="POST" action="?/createPlan" class="admin-form access-form">
            <label><span>Code</span><input name="code" required /></label>
            <label><span>Name</span><input name="name" required /></label>
            <label><span>Source system</span><input name="sourceSystem" required /></label>
            <label><span>Target system</span><input name="targetSystem" value="NUBLOX" required /></label>
            <label>
              <span>Governed scope object</span>
              <select name="scopeObjectId" required>
                <option value="">Select canonical scope</option>
                {#each data.projection.canonicalObjects as item}
                  <option value={item.id}>{item.objectType} · {item.stableKey}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Cutover strategy</span>
              <select name="cutoverStrategy" required>
                <option value="PHASED">Phased</option>
                <option value="BIG_BANG">Big bang</option>
                <option value="PARALLEL">Parallel</option>
                <option value="ROLLING">Rolling</option>
              </select>
            </label>
            <label class="wide-field">
              <span>Scope definition JSON</span>
              <textarea name="scopeDefinition" rows="6" required placeholder="JSON object describing selected object families and scope"></textarea>
            </label>
            <button type="submit">Create Plan <span>→</span></button>
          </form>
        </details>

        <details>
          <summary>Approve migration plan</summary>
          <form method="POST" action="?/approvePlan" class="admin-form access-form">
            <label>
              <span>Draft plan</span>
              <select name="planId" required>
                <option value="">Select plan</option>
                {#each data.projection.plans.filter((item) => item.status === 'DRAFT') as item}
                  <option value={item.id}>{item.code} · {item.name}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Approved Decision on plan scope</span>
              <select name="decisionId" required>
                <option value="">Select Decision</option>
                {#each data.projection.decisions.filter((item) => item.outcome === 'APPROVED') as item}
                  <option value={item.id}>{item.decisionType} · {item.subjectObjectId}</option>
                {/each}
              </select>
            </label>
            <button type="submit">Approve Plan <span>→</span></button>
          </form>
        </details>

        <details>
          <summary>Create and freeze mapping version</summary>
          <form method="POST" action="?/createMapping" class="admin-form access-form">
            <label>
              <span>Plan</span>
              <select name="planId" required>
                <option value="">Select plan</option>
                {#each data.projection.plans.filter((item) => ['DRAFT','APPROVED'].includes(item.status)) as item}
                  <option value={item.id}>{item.code} · {item.status}</option>
                {/each}
              </select>
            </label>
            <label><span>Mapping version</span><input name="version" required /></label>
            <label><span>Source schema version</span><input name="sourceSchemaVersion" required /></label>
            <label><span>Target schema version</span><input name="targetSchemaVersion" required /></label>
            <label class="wide-field">
              <span>Mapping definition JSON</span>
              <textarea name="mappingDefinition" rows="8" required placeholder="JSON object defining source-to-target transformation semantics"></textarea>
            </label>
            <button type="submit">Create Mapping Version <span>→</span></button>
          </form>

          <form method="POST" action="?/freezeMapping" class="admin-form access-form">
            <label>
              <span>Draft mapping</span>
              <select name="mappingId" required>
                <option value="">Select mapping</option>
                {#each data.projection.mappings.filter((item) => item.status === 'DRAFT') as item}
                  <option value={item.id}>{planName(item.migrationPlanId)} · v{item.version}</option>
                {/each}
              </select>
            </label>
            <button type="submit">Freeze Mapping <span>→</span></button>
          </form>
        </details>
      {/if}

      <div class="control-record-list">
        {#each data.projection.plans as plan}
          <article>
            <header>
              <span>{plan.sourceSystem} → {plan.targetSystem}</span>
              <strong>{plan.status}</strong>
            </header>
            <h3>{plan.code} — {plan.name}</h3>
            <p>{plan.scopeType} · {plan.scopeKey} · {plan.cutoverStrategy}</p>
            <footer>
              <span>{data.projection.mappings.filter((item) => item.migrationPlanId === plan.id).length} mapping version(s)</span>
              <span>{data.projection.runs.filter((item) => item.migrationPlanId === plan.id).length} run(s)</span>
              <span>{plan.approvedDecisionId ? 'Decision approved' : 'Awaiting approval'}</span>
            </footer>
          </article>
        {/each}
      </div>
    </section>

    <section class="workspace-panel">
      <div class="panel-heading">
        <div>
          <p class="app-eyebrow">Execution evidence</p>
          <h2>Source evidence and migration runs</h2>
        </div>
        <span>{data.canExecute ? 'Execute' : 'Read only'}</span>
      </div>

      {#if !data.canExecute}
        <p>
          Migration execution requires <code>platform.migration.execute</code>.
          <a href="/app/request-access?permission=platform.migration.execute&returnTo=/app/migration">Request access</a>.
        </p>
      {:else}
        <details open>
          <summary>Capture exact source payload</summary>
          <form method="POST" action="?/storeEnvelope" class="admin-form access-form">
            <label>
              <span>Approved / active plan</span>
              <select name="planId" required>
                <option value="">Select plan</option>
                {#each data.projection.plans.filter((item) => ['APPROVED','ACTIVE'].includes(item.status)) as item}
                  <option value={item.id}>{item.code} · {item.sourceSystem}</option>
                {/each}
              </select>
            </label>
            <label><span>Schema name</span><input name="schemaName" required /></label>
            <label><span>Schema version</span><input name="schemaVersion" required /></label>
            <label><span>Source object type</span><input name="objectType" required /></label>
            <label><span>Source object ID</span><input name="sourceObjectId" required /></label>
            <label class="wide-field">
              <span>Source JSON payload</span>
              <textarea name="payload" rows="8" required placeholder="Exact source payload represented as a JSON object"></textarea>
            </label>
            <button type="submit">Store Source Evidence <span>→</span></button>
          </form>
        </details>

        <details>
          <summary>Bind source identity to canonical target</summary>
          <form method="POST" action="?/bindIdentity" class="admin-form access-form">
            <label>
              <span>Plan</span>
              <select name="planId" required>
                <option value="">Select plan</option>
                {#each data.projection.plans.filter((item) => ['APPROVED','ACTIVE'].includes(item.status)) as item}
                  <option value={item.id}>{item.code} · {item.sourceSystem}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Target canonical object</span>
              <select name="targetCanonicalObjectId" required>
                <option value="">Select target</option>
                {#each data.projection.canonicalObjects as item}
                  <option value={item.id}>{item.objectType} · {item.stableKey}</option>
                {/each}
              </select>
            </label>
            <label><span>Source object type</span><input name="sourceObjectType" required /></label>
            <label><span>Source object ID</span><input name="sourceObjectId" required /></label>
            <label><span>Source version</span><input name="sourceVersion" /></label>
            <label><span>Source reference</span><input name="sourceReference" /></label>
            <button type="submit">Bind Provenance <span>→</span></button>
          </form>
        </details>

        <details>
          <summary>Queue and start migration run</summary>
          <form method="POST" action="?/createRun" class="admin-form access-form">
            <label>
              <span>Approved / active plan</span>
              <select name="planId" required>
                <option value="">Select plan</option>
                {#each data.projection.plans.filter((item) => ['APPROVED','ACTIVE'].includes(item.status)) as item}
                  <option value={item.id}>{item.code} · {item.status}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Frozen mapping</span>
              <select name="mappingVersionId" required>
                <option value="">Select mapping</option>
                {#each data.projection.mappings.filter((item) => item.status === 'FROZEN') as item}
                  <option value={item.id}>{planName(item.migrationPlanId)} · v{item.version}</option>
                {/each}
              </select>
            </label>
            <label><span>Run reference</span><input name="runReference" required /></label>
            <label>
              <span>Run type</span>
              <select name="runType" required>
                <option value="DRY_RUN">Dry run</option>
                <option value="REHEARSAL">Rehearsal</option>
                <option value="PRODUCTION">Production</option>
              </select>
            </label>
            <label>
              <span>Import Integration Job</span>
              <select name="integrationJobId">
                <option value="">No linked job</option>
                {#each data.projection.integrationJobs as item}
                  <option value={item.id}>{item.id} · {item.sourceSystem ?? 'No source'} · {item.status}</option>
                {/each}
              </select>
            </label>
            <button type="submit">Queue Run <span>→</span></button>
          </form>

          <form method="POST" action="?/startRun" class="admin-form access-form">
            <label>
              <span>Queued run</span>
              <select name="runId" required>
                <option value="">Select run</option>
                {#each data.projection.runs.filter((item) => item.status === 'QUEUED') as item}
                  <option value={item.id}>{item.runReference} · {item.runType}</option>
                {/each}
              </select>
            </label>
            <button type="submit">Start Run <span>→</span></button>
          </form>
        </details>

        <details>
          <summary>Record per-item result and load completion</summary>
          <form method="POST" action="?/recordItem" class="admin-form access-form">
            <label>
              <span>Running migration</span>
              <select name="runId" required>
                <option value="">Select run</option>
                {#each data.projection.runs.filter((item) => item.status === 'RUNNING') as item}
                  <option value={item.id}>{item.runReference}</option>
                {/each}
              </select>
            </label>
            <label><span>Sequence</span><input name="sequence" type="number" min="1" required /></label>
            <label><span>Source object type</span><input name="sourceObjectType" required /></label>
            <label><span>Source object ID</span><input name="sourceObjectId" required /></label>
            <label><span>Source version</span><input name="sourceVersion" /></label>
            <label>
              <span>Exact source envelope</span>
              <select name="sourceEnvelopeId" required>
                <option value="">Select envelope</option>
                {#each data.projection.envelopes as item}
                  <option value={item.id}>{item.externalSystem ?? 'Source'} · {item.objectType} · {item.externalObjectId ?? item.stableKey}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Target canonical object</span>
              <select name="targetCanonicalObjectId">
                <option value="">No target object</option>
                {#each data.projection.canonicalObjects as item}
                  <option value={item.id}>{item.objectType} · {item.stableKey}</option>
                {/each}
              </select>
            </label>
            <label><span>Target version</span><input name="targetVersion" /></label>
            <label>
              <span>External identity evidence</span>
              <select name="externalIdentityId">
                <option value="">No external identity</option>
                {#each data.projection.externalIdentities as item}
                  <option value={item.id}>{item.externalSystem} · {item.externalObjectType} · {item.externalObjectId}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Outcome</span>
              <select name="outcome" required>
                <option value="CREATED">Created</option>
                <option value="UPDATED">Updated</option>
                <option value="MATCHED">Matched</option>
                <option value="SKIPPED">Skipped</option>
                <option value="FAILED">Failed</option>
                <option value="CONFLICT">Conflict</option>
              </select>
            </label>
            <label><span>Target hash</span><input name="targetHash" /></label>
            <label class="wide-field"><span>Message / diagnostic</span><textarea name="message" rows="3"></textarea></label>
            <button type="submit">Record Item Result <span>→</span></button>
          </form>

          <form method="POST" action="?/completeLoad" class="admin-form access-form">
            <label>
              <span>Running migration with items</span>
              <select name="runId" required>
                <option value="">Select run</option>
                {#each data.projection.runs.filter((item) => item.status === 'RUNNING' && data.projection.items.some((result) => result.migrationRunId === item.id)) as item}
                  <option value={item.id}>{item.runReference}</option>
                {/each}
              </select>
            </label>
            <button type="submit">Complete Load Phase <span>→</span></button>
          </form>
        </details>
      {/if}
    </section>
  </div>

  <div class="control-workspace-grid">
    <section class="workspace-panel">
      <div class="panel-heading">
        <div>
          <p class="app-eyebrow">Semantic control</p>
          <h2>Conflicts and dispositions</h2>
        </div>
        <span>{data.projection.totals.openBlockingConflicts} blocking</span>
      </div>

      {#if data.canExecute}
        <details>
          <summary>Open migration conflict</summary>
          <form method="POST" action="?/createConflict" class="admin-form access-form">
            <label>
              <span>Migration run</span>
              <select name="runId" required>
                <option value="">Select run</option>
                {#each data.projection.runs.filter((item) => ['RUNNING','BLOCKED','AWAITING_RECONCILIATION'].includes(item.status)) as item}
                  <option value={item.id}>{item.runReference} · {item.status}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Item result</span>
              <select name="itemResultId">
                <option value="">Run-level conflict</option>
                {#each data.projection.items as item}
                  <option value={item.id}>{runName(item.migrationRunId)} · #{item.sequence} · {item.sourceObjectId}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Conflict type</span>
              <select name="conflictType" required>
                {#each ['IDENTITY','MAPPING','VALIDATION','VERSION','AUTHORITY','DUPLICATE','DATA','OTHER'] as type}
                  <option value={type}>{type}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Severity</span>
              <select name="severity" required>
                <option value="BLOCKING">Blocking</option>
                <option value="WARNING">Warning</option>
              </select>
            </label>
            <label><span>Code</span><input name="code" required /></label>
            <label class="wide-field"><span>Description</span><textarea name="description" rows="4" required></textarea></label>
            <button type="submit">Open Conflict <span>→</span></button>
          </form>
        </details>
      {/if}

      {#if !data.canDisposition}
        <p>
          Conflict disposition requires <code>platform.migration.conflict_disposition</code>.
          <a href="/app/request-access?permission=platform.migration.conflict_disposition&returnTo=/app/migration">Request access</a>.
        </p>
      {:else}
        <details open>
          <summary>Record authority-backed disposition</summary>
          <form method="POST" action="?/dispositionConflict" class="admin-form access-form">
            <label>
              <span>Open conflict</span>
              <select name="conflictId" required>
                <option value="">Select conflict</option>
                {#each data.projection.conflicts.filter((item) => item.status === 'OPEN') as item}
                  <option value={item.id}>{item.code} · {item.severity} · {runName(item.migrationRunId)}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Disposition</span>
              <select name="disposition" required>
                <option value="USE_SOURCE">Use source</option>
                <option value="USE_TARGET">Use target</option>
                <option value="MAP">Map</option>
                <option value="WAIVE">Waive</option>
                <option value="RETRY">Retry</option>
                <option value="EXCLUDE">Exclude</option>
              </select>
            </label>
            <label>
              <span>Approved Decision on migration scope</span>
              <select name="decisionId" required>
                <option value="">Select Decision</option>
                {#each data.projection.decisions.filter((item) => item.outcome === 'APPROVED') as item}
                  <option value={item.id}>{item.decisionType} · {item.subjectObjectId}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Retry run</span>
              <select name="retryRunId">
                <option value="">Only required for RETRY</option>
                {#each data.projection.runs as item}
                  <option value={item.id}>{item.runReference} · {item.runType} · {item.status}</option>
                {/each}
              </select>
            </label>
            <label class="wide-field"><span>Rationale</span><textarea name="rationale" rows="4" required></textarea></label>
            <button type="submit">Record Disposition <span>→</span></button>
          </form>
        </details>
      {/if}

      <div class="control-record-list">
        {#each data.projection.conflicts as conflict}
          <article>
            <header>
              <span>{conflict.conflictType} · {runName(conflict.migrationRunId)}</span>
              <strong>{conflict.severity} / {conflict.status}</strong>
            </header>
            <h3>{conflict.code}</h3>
            <p>{conflict.description}</p>
            <footer>
              <span>{conflict.migrationItemResultId ? 'Item-specific' : 'Run-level'}</span>
              <span>{data.projection.dispositions.find((item) => item.migrationConflictId === conflict.id)?.disposition ?? 'No disposition'}</span>
            </footer>
          </article>
        {/each}
      </div>
    </section>

    <section class="workspace-panel">
      <div class="panel-heading">
        <div>
          <p class="app-eyebrow">Proof &amp; authority</p>
          <h2>Reconciliation and cutover</h2>
        </div>
        <span>{data.projection.totals.verifiedReconciliations} verified</span>
      </div>

      {#if data.canExecute}
        <details open>
          <summary>Run reconciliation checkpoint</summary>
          <form method="POST" action="?/startReconciliation" class="admin-form access-form">
            <label>
              <span>Loaded run</span>
              <select name="runId" required>
                <option value="">Select run</option>
                {#each data.projection.runs.filter((item) => ['AWAITING_RECONCILIATION','BLOCKED'].includes(item.status)) as item}
                  <option value={item.id}>{item.runReference} · {item.status}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Checkpoint</span>
              <select name="checkpoint" required>
                <option value="PRE_CUTOVER">Pre-cutover</option>
                <option value="CUTOVER">Cutover</option>
                <option value="POST_CUTOVER">Post-cutover</option>
              </select>
            </label>
            <button type="submit">Start Reconciliation <span>→</span></button>
          </form>

          <form method="POST" action="?/recordReconciliation" class="admin-form access-form">
            <label>
              <span>Running reconciliation</span>
              <select name="reconciliationRunId" required>
                <option value="">Select reconciliation</option>
                {#each data.projection.reconciliationRuns.filter((item) => item.status === 'RUNNING') as item}
                  <option value={item.id}>{runName(item.migrationRunId)} · {item.checkpoint}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Migration item evidence</span>
              <select name="itemResultId" required>
                <option value="">Select item</option>
                {#each data.projection.items.filter((item) => item.externalIdentityId && item.targetCanonicalObjectId) as item}
                  <option value={item.id}>{runName(item.migrationRunId)} · #{item.sequence} · {item.sourceObjectId}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Result</span>
              <select name="status" required>
                <option value="VERIFIED">Verified</option>
                <option value="MATCHED">Matched</option>
                <option value="CONFLICT">Conflict</option>
                <option value="MISSING">Missing</option>
                <option value="PENDING">Pending</option>
              </select>
            </label>
            <label><span>Observed target hash</span><input name="targetHash" /></label>
            <label class="wide-field"><span>Evidence details</span><textarea name="details" rows="3"></textarea></label>
            <button type="submit">Record Reconciliation Evidence <span>→</span></button>
          </form>

          <form method="POST" action="?/completeReconciliation" class="admin-form access-form">
            <label>
              <span>Running reconciliation</span>
              <select name="reconciliationRunId" required>
                <option value="">Select reconciliation</option>
                {#each data.projection.reconciliationRuns.filter((item) => item.status === 'RUNNING') as item}
                  <option value={item.id}>{runName(item.migrationRunId)} · {item.checkpoint}</option>
                {/each}
              </select>
            </label>
            <label class="wide-field"><span>Completion details</span><textarea name="details" rows="3"></textarea></label>
            <button type="submit">Complete Reconciliation <span>→</span></button>
          </form>
        </details>
      {/if}

      {#if !data.canCutover}
        <p>
          Cutover approval requires <code>platform.migration.cutover_approve</code>.
          <a href="/app/request-access?permission=platform.migration.cutover_approve&returnTo=/app/migration">Request access</a>.
        </p>
      {:else}
        <details open>
          <summary>Record production cutover decision</summary>
          <form method="POST" action="?/recordCutover" class="admin-form access-form">
            <label>
              <span>Active plan</span>
              <select name="planId" required>
                <option value="">Select plan</option>
                {#each data.projection.plans.filter((item) => item.status === 'ACTIVE') as item}
                  <option value={item.id}>{item.code} · {item.name}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Reconciled production run</span>
              <select name="runId" required>
                <option value="">Select run</option>
                {#each data.projection.runs.filter((item) => item.runType === 'PRODUCTION' && item.status === 'RECONCILED') as item}
                  <option value={item.id}>{item.runReference}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Verified reconciliation</span>
              <select name="reconciliationRunId" required>
                <option value="">Select reconciliation</option>
                {#each data.projection.reconciliationRuns.filter((item) => item.status === 'VERIFIED') as item}
                  <option value={item.id}>{runName(item.migrationRunId)} · {item.checkpoint}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Authority Decision</span>
              <select name="decisionId" required>
                <option value="">Select Decision</option>
                {#each data.projection.decisions.filter((item) => ['APPROVED','REJECTED'].includes(item.outcome)) as item}
                  <option value={item.id}>{item.decisionType} · {item.outcome} · {item.subjectObjectId}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Cutover outcome</span>
              <select name="outcome" required>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </label>
            <label>
              <span>NuBlox Source Authority Rule</span>
              <select name="targetAuthorityRuleId">
                <option value="">Required for approved cutover</option>
                {#each data.projection.authorityRules.filter((item) => item.status === 'ACTIVE' && item.authorityOwner === 'NUBLOX') as item}
                  <option value={item.id}>{item.code} · {item.subjectObjectType}</option>
                {/each}
              </select>
            </label>
            <label><span>Effective at</span><input name="effectiveAt" type="datetime-local" /></label>
            <label class="wide-field"><span>Reason</span><textarea name="reason" rows="4" required></textarea></label>
            <button type="submit">Record Cutover Decision <span>→</span></button>
          </form>
        </details>
      {/if}
    </section>
  </div>

  <section class="workspace-panel">
    <div class="panel-heading">
      <div>
        <p class="app-eyebrow">Audit-ready execution</p>
        <h2>Migration run register</h2>
      </div>
      <span>{data.projection.runs.length}</span>
    </div>

    {#if data.projection.runs.length === 0}
      <p class="control-empty">No governed Migration Runs exist yet.</p>
    {:else}
      <div class="control-record-list">
        {#each data.projection.runs as run}
          <article>
            <header>
              <span>{planName(run.migrationPlanId)} · {run.runType}</span>
              <strong>{run.status}</strong>
            </header>
            <h3>{run.runReference}</h3>
            <p>
              Mapping:
              {data.projection.mappings.find((item) => item.id === run.mappingVersionId)?.version ?? run.mappingVersionId}
              · requested by {run.requesterName}
            </p>
            <footer>
              <span>{data.projection.items.filter((item) => item.migrationRunId === run.id).length} item result(s)</span>
              <span>{data.projection.conflicts.filter((item) => item.migrationRunId === run.id).length} conflict(s)</span>
              <span>{data.projection.reconciliationRuns.filter((item) => item.migrationRunId === run.id).length} reconciliation checkpoint(s)</span>
            </footer>
          </article>

          {#each data.projection.items.filter((item) => item.migrationRunId === run.id) as item}
            <div class="access-assignment-list">
              <article>
                <div><span>Item</span><strong>#{item.sequence} · {item.sourceObjectType}</strong></div>
                <div><span>Source</span><strong>{item.sourceObjectId}{item.sourceVersion ? ` · ${item.sourceVersion}` : ''}</strong></div>
                <div><span>Target</span><strong>{item.targetKey ?? 'No target'}</strong></div>
                <div><span>Outcome</span><strong>{item.outcome}</strong></div>
                <div><span>Source hash</span><strong>{item.sourceHash.slice(0, 20)}…</strong></div>
                <div><span>Target hash</span><strong>{item.targetHash ? `${item.targetHash.slice(0, 20)}…` : '—'}</strong></div>
              </article>
            </div>
          {/each}

          {#each data.projection.reconciliationRuns.filter((item) => item.migrationRunId === run.id) as reconciliation}
            <div class="access-assignment-list">
              <article>
                <div><span>Checkpoint</span><strong>{reconciliation.checkpoint}</strong></div>
                <div><span>Status</span><strong>{reconciliation.status}</strong></div>
                <div><span>Verified</span><strong>{reconciliation.verifiedCount ?? '—'}</strong></div>
                <div><span>Conflicts</span><strong>{reconciliation.conflictCount ?? '—'}</strong></div>
                <div><span>Missing</span><strong>{reconciliation.missingCount ?? '—'}</strong></div>
                <div><span>Starter</span><strong>{reconciliation.starterName}</strong></div>
              </article>
            </div>
          {/each}
        {/each}
      </div>
    {/if}
  </section>

  {#if data.projection.cutovers.length > 0}
    <section class="workspace-panel">
      <div class="panel-heading">
        <div>
          <p class="app-eyebrow">Operational authority</p>
          <h2>Cutover decisions</h2>
        </div>
        <span>{data.projection.cutovers.length}</span>
      </div>
      <div class="access-assignment-list">
        {#each data.projection.cutovers as item}
          <article>
            <div><span>Plan</span><strong>{planName(item.migrationPlanId)}</strong></div>
            <div><span>Run</span><strong>{runName(item.migrationRunId)}</strong></div>
            <div><span>Outcome</span><strong>{item.outcome}</strong></div>
            <div><span>Authority</span><strong>{item.authorityRuleCode ?? 'No authority transfer'}</strong></div>
            <div><span>Decider</span><strong>{item.deciderName}</strong></div>
            <div><span>Effective</span><strong>{item.effectiveAt ?? 'Not effective'}</strong></div>
          </article>
        {/each}
      </div>
    </section>
  {/if}
{/if}
