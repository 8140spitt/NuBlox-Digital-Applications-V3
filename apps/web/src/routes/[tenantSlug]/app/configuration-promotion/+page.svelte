<script lang="ts">
  import type { ActionData, PageData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Configuration Promotion — NuBlox</title></svelte:head>

{#if !data.allowed || !data.projection}
<section class="permission-state">
  <div class="permission-state-code">403</div>
  <div>
    <p class="app-eyebrow">Controlled access outcome</p>
    <h1>Your role does not permit Configuration Promotion access.</h1>
    <p>{data.reason}</p>
    <a class="primary-action" href="/app/request-access?permission=platform.configuration_promotion.read&returnTo=/app/configuration-promotion">Request access →</a>
  </div>
</section>
{:else}
<section class="workspace-hero compact">
  <div>
    <p class="app-eyebrow">Administrative configuration control</p>
    <h1>Configuration Promotion</h1>
    <p class="workspace-lede">
      Promote exact approved configuration deltas between governed environments with frozen before/after baselines,
      mapping and rollback evidence, per-item results and explicit conflict disposition.
    </p>
  </div>
</section>

{#if form?.message || form?.error}
<div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
  <strong>{form?.ok ? 'Completed' : 'Action not completed'}</strong>
  <span>{form?.message ?? form?.error}</span>
</div>
{/if}

<section class="architecture-metrics">
  <article><span>Environments</span><strong>{data.projection.totals.environments}</strong><p>Explicit configuration targets</p></article>
  <article><span>Frozen baselines</span><strong>{data.projection.totals.frozenBaselines}</strong><p>Reconstructable configuration</p></article>
  <article><span>Approved change sets</span><strong>{data.projection.totals.approvedChangeSets}</strong><p>Decision-backed exact deltas</p></article>
  <article><span>Promotions</span><strong>{data.projection.totals.succeededPromotions}</strong><p>{data.projection.totals.activePromotions} active · {data.projection.totals.blockedPromotions} blocked</p></article>
</section>

<section class="workspace-panel">
  <div class="panel-heading">
    <div><p class="app-eyebrow">Control boundary</p><h2>Configuration promotion is not business Change or code deployment</h2></div>
  </div>
  <p><strong>Author configuration ≠ approve configuration ≠ promote configuration ≠ disposition conflicts.</strong> A successful promotion requires an exact approved frozen delta and a new frozen target baseline.</p>
</section>

<div class="control-workspace-grid">
<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Environment state</p><h2>Environments &amp; baselines</h2></div></div>

  {#if data.canManage}
  <details open>
    <summary>Create configuration environment</summary>
    <form method="POST" action="?/createEnvironment" class="admin-form access-form">
      <label><span>Code</span><input name="code" required /></label>
      <label><span>Name</span><input name="name" required /></label>
      <label><span>Type</span><select name="environmentType"><option>DEVELOPMENT</option><option>INTEGRATION</option><option>TEST</option><option>PREPRODUCTION</option><option>PRODUCTION</option></select></label>
      <label><span>Platform version</span><input name="platformVersion" required /></label>
      <label class="wide-field"><span>Environment reference</span><input name="environmentReference" required /></label>
      <button type="submit">Create Environment →</button>
    </form>
  </details>

  <details>
    <summary>Create baseline and item evidence</summary>
    <form method="POST" action="?/createBaseline" class="admin-form access-form">
      <label><span>Environment</span><select name="environmentId" required><option value="">Select</option>{#each data.projection.environments as e}<option value={e.id}>{e.code} · {e.name}</option>{/each}</select></label>
      <label><span>Baseline reference</span><input name="baselineReference" required /></label>
      <label><span>Platform version</span><input name="platformVersion" required /></label>
      <button type="submit">Create Draft Baseline →</button>
    </form>

    <form method="POST" action="?/addBaselineItem" class="admin-form access-form">
      <label><span>Draft baseline</span><select name="baselineId" required><option value="">Select</option>{#each data.projection.environments as e}{#each e.baselines.filter((b) => b.status === 'DRAFT') as b}<option value={b.id}>{e.code} · {b.baselineReference}</option>{/each}{/each}</select></label>
      <label><span>Sequence</span><input name="sequence" type="number" min="1" value="1" required /></label>
      <label><span>Object family</span><input name="objectFamily" required /></label>
      <label><span>Object reference</span><input name="objectReference" required /></label>
      <label><span>Object version</span><input name="objectVersion" /></label>
      <label><span>Content hash</span><input name="contentHash" required /></label>
      <label class="wide-field"><span>Snapshot JSON</span><textarea name="snapshot" rows="5" required placeholder="Configuration snapshot JSON object"></textarea></label>
      <button type="submit">Add Baseline Item →</button>
    </form>

    <form method="POST" action="?/freezeBaseline" class="admin-form access-form">
      <label><span>Draft baseline</span><select name="baselineId" required><option value="">Select</option>{#each data.projection.environments as e}{#each e.baselines.filter((b) => b.status === 'DRAFT' && b.items.length > 0) as b}<option value={b.id}>{e.code} · {b.baselineReference} · {b.items.length} item(s)</option>{/each}{/each}</select></label>
      <button type="submit">Freeze Baseline →</button>
    </form>
  </details>
  {:else}
  <p>Environment/baseline administration requires <code>platform.configuration_promotion.manage</code>.</p>
  {/if}

  <div class="control-record-list">
  {#each data.projection.environments as e}
    <article>
      <header><span>{e.environmentType}</span><strong>{e.status}</strong></header>
      <h3>{e.code} — {e.name}</h3>
      <p>{e.platformVersion} · {e.environmentReference}</p>
      <footer><span>{e.baselines.length} baseline(s)</span></footer>
    </article>
    {#each e.baselines as b}
      <div class="access-assignment-list">
        <article>
          <div><span>Baseline</span><strong>{b.baselineReference}</strong></div>
          <div><span>Status</span><strong>{b.status}</strong></div>
          <div><span>Items</span><strong>{b.items.length}</strong></div>
          <div><span>Checksum</span><strong>{b.checksum ?? 'Not frozen'}</strong></div>
        </article>
      </div>
    {/each}
  {/each}
  </div>
</section>

<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Controlled delta</p><h2>Change set &amp; approval</h2></div></div>

  {#if data.canManage}
  <details open>
    <summary>Create configuration change set</summary>
    <form method="POST" action="?/createChangeSet" class="admin-form access-form">
      <label><span>Source environment</span><select name="sourceEnvironmentId" required><option value="">Select</option>{#each data.projection.environments as e}<option value={e.id}>{e.code} · {e.name}</option>{/each}</select></label>
      <label><span>Frozen base baseline</span><select name="baseBaselineId" required><option value="">Select</option>{#each data.projection.environments as e}{#each e.baselines.filter((b) => b.status === 'FROZEN') as b}<option value={b.id}>{e.code} · {b.baselineReference}</option>{/each}{/each}</select></label>
      <label><span>Approval scope object</span><select name="scopeObjectId" required><option value="">Select</option>{#each data.projection.scopeObjects as o}<option value={o.id}>{o.objectType} · {o.stableKey}</option>{/each}</select></label>
      <label><span>Code</span><input name="code" required /></label>
      <label><span>Name</span><input name="name" required /></label>
      <label><span>Version</span><input name="version" required /></label>
      <label class="wide-field"><span>Description</span><input name="description" /></label>
      <button type="submit">Create Change Set →</button>
    </form>
  </details>

  <details>
    <summary>Add exact configuration change</summary>
    <form method="POST" action="?/addChangeItem" class="admin-form access-form">
      <label><span>Draft change set</span><select name="changeSetId" required><option value="">Select</option>{#each data.projection.changeSets.filter((s) => s.status === 'DRAFT') as s}<option value={s.id}>{s.code} v{s.version}</option>{/each}</select></label>
      <label><span>Sequence</span><input name="sequence" type="number" min="1" value="1" required /></label>
      <label><span>Operation</span><select name="operation"><option>CREATE</option><option>UPDATE</option><option>DELETE</option></select></label>
      <label><span>Object family</span><input name="objectFamily" required /></label>
      <label><span>Object reference</span><input name="objectReference" required /></label>
      <label><span>Before hash</span><input name="beforeHash" /></label>
      <label><span>After hash</span><input name="afterHash" /></label>
      <label><span>Dependencies</span><input name="dependencies" placeholder="Comma-separated references" /></label>
      <label class="wide-field"><span>Definition JSON</span><textarea name="definition" rows="5" required placeholder="Administrative object definition JSON"></textarea></label>
      <button type="submit">Add Change Item →</button>
    </form>

    <form method="POST" action="?/freezeChangeSet" class="admin-form access-form">
      <label><span>Draft change set</span><select name="changeSetId" required><option value="">Select</option>{#each data.projection.changeSets.filter((s) => s.status === 'DRAFT' && s.items.length > 0) as s}<option value={s.id}>{s.code} · {s.items.length} item(s)</option>{/each}</select></label>
      <button type="submit">Freeze Exact Change Set →</button>
    </form>
  </details>
  {/if}

  {#if data.canApprove}
  <details>
    <summary>Bind approval Decision</summary>
    <p>Create the immutable approval in <a href="/app/control">Control</a>. The Decision must reference the same scope object and exact frozen change-set checksum.</p>
    <form method="POST" action="?/approveChangeSet" class="admin-form access-form">
      <label><span>Frozen change set</span><select name="changeSetId" required><option value="">Select</option>{#each data.projection.changeSets.filter((s) => s.status === 'FROZEN') as s}<option value={s.id}>{s.code} · {s.checksum}</option>{/each}</select></label>
      <label><span>Approved Decision</span><select name="decisionId" required><option value="">Select</option>{#each data.projection.decisions as d}<option value={d.id}>{d.decisionType} · {d.subjectVersion ?? 'no version'} · {d.reason}</option>{/each}</select></label>
      <button type="submit">Approve Change Set →</button>
    </form>
  </details>
  {/if}

  <div class="control-record-list">
  {#each data.projection.changeSets as s}
    <article>
      <header><span>{s.sourceEnvironmentName}</span><strong>{s.status}</strong></header>
      <h3>{s.code} v{s.version} — {s.name}</h3>
      <p>Base: {s.baseBaselineReference}</p>
      <footer><span>{s.items.length} item(s)</span><span>{s.checksum ?? 'Draft'}</span></footer>
    </article>
  {/each}
  </div>
</section>
</div>

<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Promotion transaction</p><h2>Execute &amp; reconcile target configuration</h2></div></div>

  {#if data.canExecute}
  <details open>
    <summary>Queue promotion</summary>
    <form method="POST" action="?/createRun" class="admin-form access-form">
      <label><span>Approved change set</span><select name="changeSetId" required><option value="">Select</option>{#each data.projection.changeSets.filter((s) => s.status === 'APPROVED') as s}<option value={s.id}>{s.code} v{s.version}</option>{/each}</select></label>
      <label><span>Source environment</span><select name="sourceEnvironmentId" required><option value="">Select</option>{#each data.projection.environments as e}<option value={e.id}>{e.code}</option>{/each}</select></label>
      <label><span>Target environment</span><select name="targetEnvironmentId" required><option value="">Select</option>{#each data.projection.environments as e}<option value={e.id}>{e.code}</option>{/each}</select></label>
      <label><span>Source baseline</span><select name="sourceBaselineId" required><option value="">Select</option>{#each data.projection.environments as e}{#each e.baselines.filter((b) => b.status === 'FROZEN') as b}<option value={b.id}>{e.code} · {b.baselineReference}</option>{/each}{/each}</select></label>
      <label><span>Expected target baseline</span><select name="expectedTargetBaselineId" required><option value="">Select</option>{#each data.projection.environments as e}{#each e.baselines.filter((b) => b.status === 'FROZEN') as b}<option value={b.id}>{e.code} · {b.baselineReference}</option>{/each}{/each}</select></label>
      <label><span>Run reference</span><input name="runReference" required /></label>
      <label class="wide-field"><span>Mapping JSON</span><textarea name="mappingDefinition" rows="4" required placeholder="Target identity mapping JSON object"></textarea></label>
      <label class="wide-field"><span>Rollback JSON</span><textarea name="rollbackDefinition" rows="4" required placeholder="Rollback strategy JSON object"></textarea></label>
      <button type="submit">Queue Promotion →</button>
    </form>
  </details>

  <details>
    <summary>Start / record item outcome</summary>
    <form method="POST" action="?/startRun" class="admin-form access-form">
      <label><span>Queued run</span><select name="runId" required><option value="">Select</option>{#each data.projection.runs.filter((r) => r.status === 'QUEUED') as r}<option value={r.id}>{r.runReference} · {r.targetEnvironmentName}</option>{/each}</select></label>
      <button type="submit">Start Promotion →</button>
    </form>

    <form method="POST" action="?/recordResult" class="admin-form access-form">
      <label><span>Running run</span><select name="runId" required><option value="">Select</option>{#each data.projection.runs.filter((r) => r.status === 'RUNNING') as r}<option value={r.id}>{r.runReference}</option>{/each}</select></label>
      <label><span>Change item</span><select name="changeItemId" required><option value="">Select</option>{#each data.projection.changeSets as s}{#each s.items as i}<option value={i.id}>{s.code} · {i.objectReference}</option>{/each}{/each}</select></label>
      <label><span>Outcome</span><select name="outcome"><option>APPLIED</option><option>NO_CHANGE</option><option>SKIPPED</option><option>FAILED</option><option>CONFLICT</option></select></label>
      <label><span>Target hash</span><input name="targetHash" /></label>
      <label class="wide-field"><span>Message</span><input name="message" /></label>
      <button type="submit">Record Item Result →</button>
    </form>
  </details>

  <details>
    <summary>Open conflict</summary>
    <form method="POST" action="?/createConflict" class="admin-form access-form">
      <label><span>Running run</span><select name="runId" required><option value="">Select</option>{#each data.projection.runs.filter((r) => r.status === 'RUNNING') as r}<option value={r.id}>{r.runReference}</option>{/each}</select></label>
      <label><span>Item result</span><select name="itemResultId"><option value="">Run-level conflict</option>{#each data.projection.runs as r}{#each r.results as result}<option value={result.id}>{r.runReference} · {result.changeItemId} · {result.outcome}</option>{/each}{/each}</select></label>
      <label><span>Type</span><select name="conflictType"><option>MAPPING</option><option>DEPENDENCY</option><option>VERSION</option><option>AUTHORITY</option><option>COMPATIBILITY</option><option>TARGET_DRIFT</option><option>DATA</option><option>OTHER</option></select></label>
      <label><span>Severity</span><select name="severity"><option>BLOCKING</option><option>WARNING</option></select></label>
      <label><span>Code</span><input name="code" required /></label>
      <label class="wide-field"><span>Description</span><input name="description" required /></label>
      <button type="submit">Open Conflict →</button>
    </form>
  </details>

  <details>
    <summary>Complete promotion</summary>
    <p>A successful run requires a newly frozen target baseline created after the run started. Blocked/failed runs must not claim one.</p>
    <form method="POST" action="?/completeRun" class="admin-form access-form">
      <label><span>Running run</span><select name="runId" required><option value="">Select</option>{#each data.projection.runs.filter((r) => r.status === 'RUNNING') as r}<option value={r.id}>{r.runReference}</option>{/each}</select></label>
      <label><span>Resulting target baseline</span><select name="resultingTargetBaselineId"><option value="">None — blocked/failed expected</option>{#each data.projection.environments as e}{#each e.baselines.filter((b) => b.status === 'FROZEN') as b}<option value={b.id}>{e.code} · {b.baselineReference}</option>{/each}{/each}</select></label>
      <button type="submit">Complete Promotion →</button>
    </form>
  </details>
  {/if}

  {#if data.canDisposition}
  <details>
    <summary>Disposition promotion conflict</summary>
    <p>The selected Decision must govern the same scope object and exact approved change-set checksum.</p>
    <form method="POST" action="?/dispositionConflict" class="admin-form access-form">
      <label><span>Open conflict</span><select name="conflictId" required><option value="">Select</option>{#each data.projection.runs as r}{#each r.conflicts.filter((c) => c.status === 'OPEN') as c}<option value={c.id}>{r.runReference} · {c.code} · {c.severity}</option>{/each}{/each}</select></label>
      <label><span>Disposition</span><select name="disposition"><option>MAP</option><option>USE_SOURCE</option><option>USE_TARGET</option><option>WAIVE</option><option>EXCLUDE</option><option>ABORT</option></select></label>
      <label><span>Approved Decision</span><select name="decisionId" required><option value="">Select</option>{#each data.projection.decisions as d}<option value={d.id}>{d.decisionType} · {d.subjectVersion ?? 'no version'} · {d.reason}</option>{/each}</select></label>
      <label class="wide-field"><span>Rationale</span><input name="rationale" required /></label>
      <button type="submit">Record Disposition →</button>
    </form>
  </details>
  {/if}

  <div class="control-record-list">
  {#each data.projection.runs as r}
    <article>
      <header><span>{r.sourceEnvironmentName} → {r.targetEnvironmentName}</span><strong>{r.status}</strong></header>
      <h3>{r.runReference} · {r.changeSetCode}</h3>
      <p>Before: {r.expectedTargetBaselineReference} · After: {r.resultingTargetBaselineReference ?? 'Not established'}</p>
      <footer><span>{r.results.length} item result(s)</span><span>{r.conflicts.length} conflict(s)</span><span>{r.mappingChecksum}</span></footer>
    </article>
  {/each}
  </div>
</section>
{/if}
