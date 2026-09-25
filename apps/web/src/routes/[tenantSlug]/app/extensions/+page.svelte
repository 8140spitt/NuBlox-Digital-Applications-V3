<script lang="ts">
  import type { ActionData, PageData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Extension Governance — NuBlox</title></svelte:head>

{#if !data.allowed || !data.projection}
<section class="permission-state">
  <div class="permission-state-code">403</div>
  <div>
    <p class="app-eyebrow">Controlled access outcome</p>
    <h1>Your role does not permit Extension Governance access.</h1>
    <p>{data.reason}</p>
    <a class="primary-action" href="/app/request-access?permission=platform.extension.read&returnTo=/app/extensions">Request access →</a>
  </div>
</section>
{:else}
<section class="workspace-hero compact">
  <div>
    <p class="app-eyebrow">Platform configuration control</p>
    <h1>Extension Governance</h1>
    <p class="workspace-lede">Govern industry, tenant and platform extensions as immutable package versions with explicit compatibility and upgrade-reconciliation evidence.</p>
  </div>
</section>

{#if form?.message || form?.error}
<div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
  <strong>{form?.ok ? 'Completed' : 'Action not completed'}</strong>
  <span>{form?.message ?? form?.error}</span>
</div>
{/if}

<section class="architecture-metrics">
  <article><span>Extensions</span><strong>{data.projection.totals.definitions}</strong><p>Governed identities</p></article>
  <article><span>Package versions</span><strong>{data.projection.totals.packageVersions}</strong><p>Immutable manifests</p></article>
  <article><span>Assessments</span><strong>{data.projection.totals.compatibilityAssessments}</strong><p>Explicit target compatibility</p></article>
  <article><span>Reconciliations</span><strong>{data.projection.totals.reconciliationRuns}</strong><p>{data.projection.totals.blockedReconciliations} blocked</p></article>
</section>

<div class="control-workspace-grid">
<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Definition &amp; package</p><h2>Governed extension package</h2></div></div>
  {#if data.canManage}
  <details open>
    <summary>Create extension definition</summary>
    <form method="POST" action="?/createDefinition" class="admin-form access-form">
      <label><span>Code</span><input name="code" required /></label>
      <label><span>Name</span><input name="name" required /></label>
      <label><span>Kind</span><select name="extensionKind"><option>INDUSTRY</option><option>TENANT</option><option>PLATFORM</option><option>INTEGRATION</option></select></label>
      <label><span>Owner reference</span><input name="ownerReference" required /></label>
      <label class="wide-field"><span>Description</span><input name="description" /></label>
      <button type="submit">Create Extension →</button>
    </form>
  </details>
  <details>
    <summary>Create immutable package version</summary>
    <form method="POST" action="?/createPackage" class="admin-form access-form">
      <label><span>Extension</span><select name="extensionDefinitionId" required><option value="">Select</option>{#each data.projection.definitions as d}<option value={d.id}>{d.code} · {d.name}</option>{/each}</select></label>
      <label><span>Version</span><input name="version" required /></label>
      <label><span>Minimum platform version</span><input name="minimumPlatformVersion" /></label>
      <label><span>Maximum platform version</span><input name="maximumPlatformVersion" /></label>
      <label class="wide-field"><span>Manifest JSON</span><textarea name="manifest" rows="7" required placeholder="Extension manifest JSON object"></textarea></label>
      <button type="submit">Freeze Package Version →</button>
    </form>
  </details>
  <details>
    <summary>Add package component</summary>
    <form method="POST" action="?/addComponent" class="admin-form access-form">
      <label><span>Package version</span><select name="packageVersionId" required><option value="">Select</option>{#each data.projection.definitions as d}{#each d.packages as p}<option value={p.id}>{d.code} · {p.version}</option>{/each}{/each}</select></label>
      <label><span>Component key</span><input name="componentKey" required /></label>
      <label><span>Kind</span><select name="componentKind"><option>TYPE</option><option>ATTRIBUTE</option><option>POLICY</option><option>RULE</option><option>WORKFLOW</option><option>UI_ACTION</option><option>API</option><option>INTEGRATION</option><option>SEED_DATA</option><option>OTHER</option></select></label>
      <label><span>Sequence</span><input name="sequence" type="number" min="1" value="1" required /></label>
      <label><span>Target object type</span><input name="targetObjectType" /></label>
      <label><span>Target reference</span><input name="targetReference" /></label>
      <label class="wide-field"><span>Definition JSON</span><textarea name="definition" rows="6" required placeholder="Component definition JSON object"></textarea></label>
      <button type="submit">Add Component →</button>
    </form>
  </details>
  {:else}
  <p>Package management requires <code>platform.extension.manage</code>.</p>
  {/if}

  <div class="control-record-list">
  {#each data.projection.definitions as d}
    <article>
      <header><span>{d.extensionKind}</span><strong>{d.status}</strong></header>
      <h3>{d.code} — {d.name}</h3>
      <p>Owner: {d.ownerReference}</p>
      <footer><span>{d.packages.length} package version(s)</span></footer>
    </article>
    {#each d.packages as p}
      <div class="access-assignment-list">
        <article>
          <div><span>Version</span><strong>{p.version}</strong></div>
          <div><span>Status</span><strong>{p.status}</strong></div>
          <div><span>Components</span><strong>{p.components.length}</strong></div>
          <div><span>Checksum</span><strong>{p.checksum}</strong></div>
        </article>
      </div>
    {/each}
  {/each}
  </div>
</section>

<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Upgrade safety</p><h2>Compatibility &amp; reconciliation</h2></div></div>
  {#if data.canAssess}
  <details open>
    <summary>Assess compatibility</summary>
    <form method="POST" action="?/assess" class="admin-form access-form">
      <label><span>Package version</span><select name="packageVersionId" required><option value="">Select</option>{#each data.projection.definitions as d}{#each d.packages as p}<option value={p.id}>{d.code} · {p.version}</option>{/each}{/each}</select></label>
      <label><span>Platform version</span><input name="platformVersion" required /></label>
      <label><span>Outcome</span><select name="outcome"><option>COMPATIBLE</option><option>RECONCILIATION_REQUIRED</option><option>INCOMPATIBLE</option></select></label>
      <label class="wide-field"><span>Evidence JSON</span><textarea name="evidence" rows="5" required placeholder="Compatibility evidence JSON object"></textarea></label>
      <button type="submit">Record Assessment →</button>
    </form>
  </details>
  {/if}

  {#if data.canReconcile}
  <details>
    <summary>Start reconciliation</summary>
    <form method="POST" action="?/startReconciliation" class="admin-form access-form">
      <label><span>Extension</span><select name="extensionDefinitionId" required><option value="">Select</option>{#each data.projection.definitions as d}<option value={d.id}>{d.code}</option>{/each}</select></label>
      <label><span>From package</span><select name="fromPackageVersionId" required><option value="">Select</option>{#each data.projection.definitions as d}{#each d.packages as p}<option value={p.id}>{d.code} · {p.version}</option>{/each}{/each}</select></label>
      <label><span>To package</span><select name="toPackageVersionId" required><option value="">Select</option>{#each data.projection.definitions as d}{#each d.packages as p}<option value={p.id}>{d.code} · {p.version}</option>{/each}{/each}</select></label>
      <label><span>Target platform version</span><input name="targetPlatformVersion" required /></label>
      <button type="submit">Start Reconciliation →</button>
    </form>
  </details>
  <details>
    <summary>Record reconciliation item</summary>
    <form method="POST" action="?/recordItem" class="admin-form access-form">
      <label><span>Running reconciliation</span><select name="runId" required><option value="">Select</option>{#each data.projection.runs.filter((r) => r.status === 'RUNNING') as r}<option value={r.id}>{r.id} · {r.targetPlatformVersion}</option>{/each}</select></label>
      <label><span>Component key</span><input name="componentKey" required /></label>
      <label><span>Outcome</span><select name="outcome"><option>UNCHANGED</option><option>AUTO_MERGED</option><option>MANUAL_REQUIRED</option><option>CONFLICT</option><option>RESOLVED</option></select></label>
      <label><span>Source checksum</span><input name="sourceChecksum" /></label>
      <label><span>Target checksum</span><input name="targetChecksum" /></label>
      <label><span>Rationale</span><input name="rationale" /></label>
      <label class="wide-field"><span>Resolved definition JSON</span><textarea name="resolvedDefinition" rows="4"></textarea></label>
      <button type="submit">Record Item →</button>
    </form>
  </details>
  <details>
    <summary>Complete reconciliation</summary>
    <form method="POST" action="?/complete" class="admin-form access-form">
      <label><span>Running reconciliation</span><select name="runId" required><option value="">Select</option>{#each data.projection.runs.filter((r) => r.status === 'RUNNING') as r}<option value={r.id}>{r.id}</option>{/each}</select></label>
      <label class="wide-field"><span>Summary</span><input name="summary" required /></label>
      <button type="submit">Complete Reconciliation →</button>
    </form>
  </details>
  {/if}

  <div class="control-record-list">
  {#each data.projection.runs as r}
    <article>
      <header><span>{r.targetPlatformVersion}</span><strong>{r.status}</strong></header>
      <h3>{r.fromPackageVersionId} → {r.toPackageVersionId}</h3>
      <p>{r.items.length} reconciliation item(s)</p>
      <footer><span>{r.summary ?? 'In progress'}</span></footer>
    </article>
  {/each}
  </div>
</section>
</div>
{/if}
