<script lang="ts">
  import type { ActionData, PageData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Manufacturing — NuBlox</title></svelte:head>

{#if !data.allowed || !data.projection}
<section class="permission-state">
  <div class="permission-state-code">403</div>
  <div>
    <p class="app-eyebrow">Controlled access outcome</p>
    <h1>Your role does not permit Manufacturing access.</h1>
    <p>{data.reason}</p>
    <a class="primary-action" href="/app/request-access?permission=domain.manufacturing.read&returnTo=/app/manufacturing">Request access →</a>
  </div>
</section>
{:else}
<section class="workspace-hero compact">
  <div>
    <p class="app-eyebrow">F11 · Manufacturing &amp; production execution</p>
    <h1>Manufacturing Process Management</h1>
    <p class="workspace-lede">
      Govern process plans, operations, precedence, manufacturing resources and control characteristics
      as exact release-controlled production definitions.
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
  <article><span>Released plans</span><strong>{data.projection.totals.releasedPlans}</strong><p>{data.projection.totals.draftPlans} draft</p></article>
  <article><span>Operations</span><strong>{data.projection.totals.operations}</strong><p>Plan-controlled execution steps</p></article>
  <article><span>Active resources</span><strong>{data.projection.totals.resources}</strong><p>Reusable production capacity</p></article>
  <article><span>Control characteristics</span><strong>{data.projection.totals.controlCharacteristics}</strong><p>Effective production/inspection criteria</p></article>
</section>

<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Canonical boundary</p><h2>Plan definition is separate from production execution</h2></div></div>
  <p><strong>Process Plan ≠ Production Order.</strong> This workspace governs the reusable production definition. Released plans can later be consumed by production scheduling/orders without mutating their approved operations, resources or control characteristics.</p>
</section>

<div class="control-workspace-grid">
<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Plan structure</p><h2>Process plan &amp; operations</h2></div></div>
  {#if data.canManage}
  <details open>
    <summary>Create Process Plan</summary>
    <form method="POST" action="?/createPlan" class="admin-form access-form">
      <label><span>Governed scope/item</span><select name="scopeObjectId" required><option value="">Select</option>{#each data.projection.scopeObjects as o}<option value={o.id}>{o.objectType} · {o.stableKey}</option>{/each}</select></label>
      <label><span>Code</span><input name="code" required /></label>
      <label><span>Name</span><input name="name" required /></label>
      <label><span>Version</span><input name="version" type="number" min="1" value="1" required /></label>
      <label><span>Plant reference</span><input name="plantReference" /></label>
      <label class="wide-field"><span>Description</span><input name="description" /></label>
      <button type="submit">Create Draft Plan →</button>
    </form>
  </details>

  <details>
    <summary>Add Operation</summary>
    <form method="POST" action="?/addOperation" class="admin-form access-form">
      <label><span>Draft plan</span><select name="processPlanId" required><option value="">Select</option>{#each data.projection.plans.filter((p) => p.status === 'DRAFT') as p}<option value={p.id}>{p.code} v{p.version}</option>{/each}</select></label>
      <label><span>Operation number</span><input name="operationNumber" required placeholder="0010" /></label>
      <label><span>Name</span><input name="name" required /></label>
      <label><span>Type</span><select name="operationType"><option>PROCESS</option><option>INSPECTION</option><option>MOVE</option><option>WAIT</option><option>PACK</option><option>OTHER</option></select></label>
      <label><span>Setup minutes</span><input name="setupMinutes" type="number" step="0.001" min="0" value="0" required /></label>
      <label><span>Run minutes</span><input name="runMinutes" type="number" step="0.001" min="0" value="0" required /></label>
      <label><span>Yield %</span><input name="yieldPercent" type="number" step="0.0001" min="0.0001" max="100" value="100" required /></label>
      <label class="wide-field"><span>Description</span><input name="description" /></label>
      <label class="wide-field"><span>Work instructions JSON</span><textarea name="workInstructions" rows="4" placeholder='{"instruction":"..."}'></textarea></label>
      <button type="submit">Add Operation →</button>
    </form>
  </details>

  <details>
    <summary>Add Sequence Link</summary>
    <form method="POST" action="?/addSequence" class="admin-form access-form">
      <label><span>Draft plan</span><select name="processPlanId" required><option value="">Select</option>{#each data.projection.plans.filter((p) => p.status === 'DRAFT') as p}<option value={p.id}>{p.code} v{p.version}</option>{/each}</select></label>
      <label><span>Predecessor</span><select name="predecessorOperationId" required><option value="">Select</option>{#each data.projection.plans as p}{#each p.operations as o}<option value={o.id}>{p.code} · {o.operationNumber} · {o.name}</option>{/each}{/each}</select></label>
      <label><span>Successor</span><select name="successorOperationId" required><option value="">Select</option>{#each data.projection.plans as p}{#each p.operations as o}<option value={o.id}>{p.code} · {o.operationNumber} · {o.name}</option>{/each}{/each}</select></label>
      <label><span>Sequence</span><select name="sequenceType"><option>FINISH_START</option><option>START_START</option><option>FINISH_FINISH</option><option>START_FINISH</option></select></label>
      <label><span>Lag minutes</span><input name="lagMinutes" type="number" step="0.001" value="0" required /></label>
      <button type="submit">Add Sequence →</button>
    </form>
  </details>
  {/if}

  <div class="control-record-list">
  {#each data.projection.plans as p}
    <article>
      <header><span>{p.code} v{p.version}</span><strong>{p.status}</strong></header>
      <h3>{p.name}</h3>
      <p>{p.operations.length} operation(s) · {p.sequences.length} sequence link(s)</p>
      <footer><span>{p.checksum ?? 'Draft — not frozen'}</span></footer>
    </article>
    {#each p.operations as o}
      <div class="access-assignment-list">
        <article>
          <div><span>Operation</span><strong>{o.operationNumber} · {o.name}</strong></div>
          <div><span>Type</span><strong>{o.operationType}</strong></div>
          <div><span>Run</span><strong>{o.runMinutes} min</strong></div>
          <div><span>Yield</span><strong>{o.yieldPercent}%</strong></div>
        </article>
      </div>
    {/each}
  {/each}
  </div>
</section>

<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Reusable capability</p><h2>Manufacturing resources</h2></div></div>
  {#if data.canResources}
  <details open>
    <summary>Create Resource</summary>
    <form method="POST" action="?/createResource" class="admin-form access-form">
      <label><span>Code</span><input name="code" required /></label>
      <label><span>Name</span><input name="name" required /></label>
      <label><span>Type</span><select name="resourceType"><option>WORK_CENTER</option><option>LABOUR</option><option>SKILL</option><option>TOOLING</option><option>EQUIPMENT</option><option>PROCESSING_MATERIAL</option></select></label>
      <label><span>Capacity unit</span><input name="capacityUnit" /></label>
      <label><span>Capacity/day</span><input name="capacityPerDay" type="number" step="0.0001" min="0" /></label>
      <label><span>Status</span><select name="status"><option>ACTIVE</option><option>INACTIVE</option></select></label>
      <label><span>Effective from</span><input name="effectiveFrom" type="datetime-local" /></label>
      <label><span>Effective to</span><input name="effectiveTo" type="datetime-local" /></label>
      <label class="wide-field"><span>Description</span><input name="description" /></label>
      <button type="submit">Create Resource →</button>
    </form>
  </details>

  <details>
    <summary>Allocate Resource to Operation</summary>
    <form method="POST" action="?/allocateResource" class="admin-form access-form">
      <label><span>Operation</span><select name="operationId" required><option value="">Select</option>{#each data.projection.plans.filter((p) => p.status === 'DRAFT') as p}{#each p.operations as o}<option value={o.id}>{p.code} · {o.operationNumber} · {o.name}</option>{/each}{/each}</select></label>
      <label><span>Resource</span><select name="resourceId" required><option value="">Select</option>{#each data.projection.resources.filter((r) => r.status === 'ACTIVE') as r}<option value={r.id}>{r.code} · {r.name}</option>{/each}</select></label>
      <label><span>Quantity</span><input name="quantity" type="number" step="0.0001" min="0.0001" value="1" required /></label>
      <label><span>Usage unit</span><input name="usageUnit" value="EACH" required /></label>
      <label><span><input name="required" type="checkbox" checked /> Required</span></label>
      <button type="submit">Allocate Resource →</button>
    </form>
  </details>
  {/if}

  <div class="control-record-list">
  {#each data.projection.resources as r}
    <article>
      <header><span>{r.resourceType}</span><strong>{r.status}</strong></header>
      <h3>{r.code} — {r.name}</h3>
      <p>{r.capacityPerDay ?? '—'} {r.capacityUnit ?? ''} / day</p>
      <footer><span>{r.allocations.length} allocation(s)</span></footer>
    </article>
  {/each}
  </div>
</section>
</div>

<div class="control-workspace-grid">
<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Production assurance</p><h2>Control characteristics</h2></div></div>
  {#if data.canCharacteristics}
  <form method="POST" action="?/createCharacteristic" class="admin-form access-form">
    <label><span>Governed scope/item</span><select name="scopeObjectId" required><option value="">Select</option>{#each data.projection.scopeObjects as o}<option value={o.id}>{o.objectType} · {o.stableKey}</option>{/each}</select></label>
    <label><span>Operation (optional)</span><select name="operationId"><option value="">Item-level characteristic</option>{#each data.projection.plans.filter((p) => p.status === 'DRAFT') as p}{#each p.operations as o}<option value={o.id}>{p.code} · {o.operationNumber}</option>{/each}{/each}</select></label>
    <label><span>Code</span><input name="code" required /></label>
    <label><span>Name</span><input name="name" required /></label>
    <label><span>Type</span><select name="characteristicType"><option>DIMENSION</option><option>ATTRIBUTE</option><option>MATERIAL</option><option>PROCESS_PARAMETER</option><option>VISUAL</option><option>FUNCTIONAL</option><option>OTHER</option></select></label>
    <label><span>Severity</span><select name="severity"><option>CRITICAL</option><option>MAJOR</option><option>MINOR</option><option>INFORMATIONAL</option></select></label>
    <label><span>Unit</span><input name="unit" /></label>
    <label><span>Nominal</span><input name="nominalValue" type="number" step="any" /></label>
    <label><span>Lower limit</span><input name="lowerLimit" type="number" step="any" /></label>
    <label><span>Upper limit</span><input name="upperLimit" type="number" step="any" /></label>
    <label><span>Status</span><select name="status"><option>ACTIVE</option><option>INACTIVE</option></select></label>
    <label class="wide-field"><span>Specification</span><input name="specification" /></label>
    <label class="wide-field"><span>Sampling plan JSON</span><textarea name="samplingPlan" rows="4" placeholder='{"method":"100_PERCENT"}'></textarea></label>
    <button type="submit">Create Control Characteristic →</button>
  </form>
  {/if}

  <div class="control-record-list">
  {#each data.projection.characteristics as c}
    <article>
      <header><span>{c.characteristicType}</span><strong>{c.severity}</strong></header>
      <h3>{c.code} — {c.name}</h3>
      <p>{c.nominalValue ?? '—'} {c.unit ?? ''} · limits {c.lowerLimit ?? '—'} / {c.upperLimit ?? '—'}</p>
      <footer><span>{c.operationId ? 'Operation-linked' : 'Item-level'}</span><span>{c.status}</span></footer>
    </article>
  {/each}
  </div>
</section>

<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Release control</p><h2>Freeze &amp; release exact definition</h2></div></div>
  {#if data.canRelease}
  <details open>
    <summary>Freeze Process Plan</summary>
    <p>Freezing hashes the exact operations, sequence links, resource allocations and applicable control characteristics.</p>
    <form method="POST" action="?/freezePlan" class="admin-form access-form">
      <label><span>Draft plan</span><select name="planId" required><option value="">Select</option>{#each data.projection.plans.filter((p) => p.status === 'DRAFT' && p.operations.length > 0) as p}<option value={p.id}>{p.code} v{p.version}</option>{/each}</select></label>
      <button type="submit">Freeze Definition →</button>
    </form>
  </details>

  <details>
    <summary>Release with approved Decision</summary>
    <p>Create the approval in <a href="/app/control">Control</a>. Its subject must be the plan scope object and its subject version must equal the frozen plan checksum.</p>
    <form method="POST" action="?/releasePlan" class="admin-form access-form">
      <label><span>Frozen plan</span><select name="planId" required><option value="">Select</option>{#each data.projection.plans.filter((p) => p.status === 'FROZEN') as p}<option value={p.id}>{p.code} v{p.version} · {p.checksum}</option>{/each}</select></label>
      <label><span>Approved Decision</span><select name="decisionId" required><option value="">Select</option>{#each data.projection.decisions as d}<option value={d.id}>{d.decisionType} · {d.subjectVersion ?? 'no version'} · {d.reason}</option>{/each}</select></label>
      <button type="submit">Release Process Plan →</button>
    </form>
  </details>
  {/if}
</section>
</div>
{/if}
