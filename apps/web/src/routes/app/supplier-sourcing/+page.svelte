<script lang="ts">
  import type { ActionData, PageData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Supplier Sourcing — NuBlox</title></svelte:head>

{#if !data.allowed || !data.projection}
<section class="permission-state">
  <div class="permission-state-code">403</div>
  <div>
    <p class="app-eyebrow">Controlled access outcome</p>
    <h1>Your role does not permit Supplier Sourcing access.</h1>
    <p>{data.reason}</p>
    <a class="primary-action" href="/app/request-access?permission=domain.supplier_sourcing.read&returnTo=/app/supplier-sourcing">Request access →</a>
  </div>
</section>
{:else}
<section class="workspace-hero compact">
  <div>
    <p class="app-eyebrow">F09 · Supplier, sourcing &amp; procurement</p>
    <h1>Supplier Sourcing</h1>
    <p class="workspace-lede">
      Govern supplier relationships separately from contextual source approval. A released supplier is not globally approved:
      each internal-item ↔ supplier-item source status is controlled by Sourcing Context, exact effectivity and immutable Decision evidence.
    </p>
  </div>
</section>

{#if form?.message || form?.error}
<div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
  <strong>{form?.ok ? 'Completed' : 'Action not completed'}</strong>
  <span>{form?.message ?? form?.error}</span>
</div>
{/if}

{#if form?.approvalFingerprint}
<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Approval fingerprint</p><h2>Create the matching Decision in Control</h2></div></div>
  <p><strong>Decision subject object:</strong> <code>{form.approvalSubjectObjectId}</code></p>
  <p><strong>Decision subject version:</strong> <code>{form.approvalFingerprint}</code></p>
  <p>Use an <strong>APPROVED</strong> Decision in <a href="/app/control">Control</a>, then bind that Decision in the Source Approval form below.</p>
</section>
{/if}

<section class="architecture-metrics">
  <article><span>Supplier relationships</span><strong>{data.projection.totals.supplierRelationships}</strong><p>{data.projection.totals.releasedSuppliers} released</p></article>
  <article><span>Sourcing contexts</span><strong>{data.projection.totals.sourcingContexts}</strong><p>Conditional approval scope</p></article>
  <article><span>Current approvals</span><strong>{data.projection.totals.currentApprovals}</strong><p>{data.projection.totals.preferredSources} preferred</p></article>
  <article><span>Restrictions</span><strong>{data.projection.totals.restrictedSources}</strong><p>{data.projection.totals.activeRules} active rule(s)</p></article>
</section>

<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Control boundary</p><h2>Supplier lifecycle is not source approval</h2></div></div>
  <p>
    <strong>Organisation ≠ Supplier Relationship ≠ Supplier Item ≠ Source Approval.</strong>
    A Supplier Relationship must be released before it can support a contextual source approval. Preferred, Approved and Do Not Use
    belong to the exact internal-item/supplier-item relationship inside a Sourcing Context and effectivity window.
  </p>
</section>

<div class="control-workspace-grid">
<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Commercial relationship</p><h2>Supplier relationships</h2></div></div>

  {#if data.canManage}
  <details open>
    <summary>Create supplier relationship</summary>
    <form method="POST" action="?/createSupplierRelationship" class="admin-form access-form">
      <label><span>Supplier Organisation</span><select name="supplierOrganisationId" required><option value="">Select</option>{#each data.projection.organisations.filter((o) => o.status === 'ACTIVE') as o}<option value={o.id}>{o.name}</option>{/each}</select></label>
      <label><span>Relationship type</span><select name="relationshipType"><option>MANUFACTURER</option><option>VENDOR</option><option>SERVICE_PROVIDER</option><option>SUBCONTRACTOR</option><option>OTHER</option></select></label>
      <label><span>Code</span><input name="code" required /></label>
      <label><span>Name</span><input name="name" required /></label>
      <button type="submit">Create Relationship →</button>
    </form>
  </details>

  <details>
    <summary>Release supplier relationship</summary>
    <p>Create an APPROVED Decision in <a href="/app/control">Control</a> with the Supplier Relationship canonical object as the Decision subject.</p>
    <form method="POST" action="?/releaseSupplierRelationship" class="admin-form access-form">
      <label><span>IN_WORK relationship</span><select name="supplierRelationshipId" required><option value="">Select</option>{#each data.projection.supplierRelationships.filter((s) => s.status === 'IN_WORK') as s}<option value={s.id}>{s.code} · {s.organisationName} · subject {s.canonicalObjectId}</option>{/each}</select></label>
      <label><span>Approved Decision</span><select name="decisionId" required><option value="">Select</option>{#each data.projection.decisions as d}<option value={d.id}>{d.decisionType} · {d.subjectObjectId} · {d.reason}</option>{/each}</select></label>
      <button type="submit">Release Relationship →</button>
    </form>
  </details>

  <details>
    <summary>Cancel supplier relationship</summary>
    <form method="POST" action="?/cancelSupplierRelationship" class="admin-form access-form">
      <label><span>Relationship</span><select name="supplierRelationshipId" required><option value="">Select</option>{#each data.projection.supplierRelationships.filter((s) => s.status !== 'CANCELLED') as s}<option value={s.id}>{s.code} · {s.status} · {s.organisationName}</option>{/each}</select></label>
      <label><span>Approved Decision</span><select name="decisionId" required><option value="">Select</option>{#each data.projection.decisions as d}<option value={d.id}>{d.decisionType} · {d.subjectObjectId} · {d.reason}</option>{/each}</select></label>
      <button type="submit">Cancel Relationship →</button>
    </form>
  </details>
  {/if}

  <div class="control-record-list">
  {#each data.projection.supplierRelationships as s}
    <article>
      <header><span>{s.relationshipType}</span><strong>{s.status}</strong></header>
      <h3>{s.code} — {s.organisationName}</h3>
      <p>{s.name}</p>
      <footer><span>Relationship object: {s.canonicalObjectId}</span><span>{s.currentApprovals.length} current source(s)</span></footer>
    </article>
  {/each}
  </div>
</section>

<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Conditional scope</p><h2>Sourcing contexts</h2></div></div>

  {#if data.canManage}
  <details open>
    <summary>Create sourcing context</summary>
    <form method="POST" action="?/createSourcingContext" class="admin-form access-form">
      <label><span>Code</span><input name="code" required /></label>
      <label><span>Name</span><input name="name" required /></label>
      <label><span>Scope type</span><input name="scopeType" required placeholder="PROJECT, REGION, PRODUCT_LINE…" /></label>
      <label><span>Scope object</span><select name="scopeObjectId"><option value="">No canonical scope object</option>{#each data.projection.canonicalObjects as o}<option value={o.id}>{o.objectType} · {o.stableKey}</option>{/each}</select></label>
      <label class="wide-field"><span>Description</span><input name="description" /></label>
      <label class="wide-field"><span>Criteria JSON</span><textarea name="criteria" rows="5" required placeholder='{"region":"GB","productLine":"Structures"}'></textarea></label>
      <button type="submit">Create Context →</button>
    </form>
  </details>
  {/if}

  <div class="control-record-list">
  {#each data.projection.sourcingContexts as c}
    <article>
      <header><span>{c.scopeType}</span><strong>{c.status}</strong></header>
      <h3>{c.code} — {c.name}</h3>
      <p>{c.description ?? 'No description'}</p>
      <footer><span>{c.currentApprovals.length} current source approval(s)</span></footer>
    </article>
  {/each}
  </div>
</section>
</div>

<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">AML / AVL authority</p><h2>Contextual source approval</h2></div></div>

  {#if data.canApprove}
  <details open>
    <summary>1. Generate exact Decision fingerprint</summary>
    <form method="POST" action="?/previewApprovalVersion" class="admin-form access-form">
      <label><span>Sourcing Context</span><select name="sourcingContextId" required><option value="">Select</option>{#each data.projection.sourcingContexts.filter((c) => c.status === 'ACTIVE') as c}<option value={c.id}>{c.code} · {c.name}</option>{/each}</select></label>
      <label><span>Released Supplier Relationship</span><select name="supplierRelationshipId" required><option value="">Select</option>{#each data.projection.supplierRelationships.filter((s) => s.status === 'RELEASED') as s}<option value={s.id}>{s.code} · {s.organisationName}</option>{/each}</select></label>
      <label><span>Internal item</span><select name="internalItemObjectId" required><option value="">Select</option>{#each data.projection.canonicalObjects.filter((o) => o.objectType !== 'SUPPLIER_RELATIONSHIP') as o}<option value={o.id}>{o.objectType} · {o.stableKey}</option>{/each}</select></label>
      <label><span>Supplier item</span><select name="supplierItemObjectId" required><option value="">Select</option>{#each data.projection.canonicalObjects.filter((o) => o.objectType !== 'SUPPLIER_RELATIONSHIP') as o}<option value={o.id}>{o.objectType} · {o.stableKey}</option>{/each}</select></label>
      <label><span>Source status</span><select name="sourceStatus"><option>PREFERRED</option><option>APPROVED</option><option>DO_NOT_USE</option></select></label>
      <label><span>Effective from</span><input name="effectiveFrom" required placeholder="2026-10-01T00:00:00Z" /></label>
      <label><span>Effective to</span><input name="effectiveTo" placeholder="Optional ISO-8601 end" /></label>
      <button type="submit">Generate Decision Fingerprint →</button>
    </form>
  </details>

  <details>
    <summary>2. Bind approved Decision to source relationship</summary>
    <form method="POST" action="?/createSourceApproval" class="admin-form access-form">
      <label><span>Sourcing Context</span><select name="sourcingContextId" required><option value="">Select</option>{#each data.projection.sourcingContexts.filter((c) => c.status === 'ACTIVE') as c}<option value={c.id}>{c.code}</option>{/each}</select></label>
      <label><span>Released Supplier Relationship</span><select name="supplierRelationshipId" required><option value="">Select</option>{#each data.projection.supplierRelationships.filter((s) => s.status === 'RELEASED') as s}<option value={s.id}>{s.code} · {s.organisationName}</option>{/each}</select></label>
      <label><span>Internal item</span><select name="internalItemObjectId" required><option value="">Select</option>{#each data.projection.canonicalObjects.filter((o) => o.objectType !== 'SUPPLIER_RELATIONSHIP') as o}<option value={o.id}>{o.objectType} · {o.stableKey}</option>{/each}</select></label>
      <label><span>Supplier item</span><select name="supplierItemObjectId" required><option value="">Select</option>{#each data.projection.canonicalObjects.filter((o) => o.objectType !== 'SUPPLIER_RELATIONSHIP') as o}<option value={o.id}>{o.objectType} · {o.stableKey}</option>{/each}</select></label>
      <label><span>Source status</span><select name="sourceStatus"><option>PREFERRED</option><option>APPROVED</option><option>DO_NOT_USE</option></select></label>
      <label><span>Effective from</span><input name="effectiveFrom" required placeholder="2026-10-01T00:00:00Z" /></label>
      <label><span>Effective to</span><input name="effectiveTo" placeholder="Optional ISO-8601 end" /></label>
      <label><span>Approved Decision</span><select name="decisionId" required><option value="">Select</option>{#each data.projection.decisions as d}<option value={d.id}>{d.decisionType} · {d.subjectObjectId} · {d.subjectVersion ?? 'no version'}</option>{/each}</select></label>
      <label class="wide-field"><span>Rationale</span><input name="rationale" required /></label>
      <button type="submit">Record Source Approval →</button>
    </form>
  </details>
  {/if}

  <div class="control-record-list">
  {#each data.projection.sourceApprovals as a}
    <article>
      <header><span>{a.contextCode} · {a.supplierCode}</span><strong>{a.current ? a.sourceStatus : 'SUPERSEDED'}</strong></header>
      <h3>{a.internalItemKey} ← {a.supplierItemKey}</h3>
      <p>{a.rationale}</p>
      <footer><span>{a.effectiveFrom} → {a.effectiveTo ?? 'open-ended'}</span><span>Decision: {a.approvalDecisionId}</span></footer>
    </article>
  {/each}
  </div>
</section>

<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Automation policy</p><h2>Sourcing rules</h2></div></div>

  {#if data.canManageRules}
  <details open>
    <summary>Create sourcing rule</summary>
    <form method="POST" action="?/createSourcingRule" class="admin-form access-form">
      <label><span>Code</span><input name="code" required /></label>
      <label><span>Name</span><input name="name" required /></label>
      <label><span>Sourcing Context</span><select name="sourcingContextId"><option value="">All contexts</option>{#each data.projection.sourcingContexts.filter((c) => c.status === 'ACTIVE') as c}<option value={c.id}>{c.code}</option>{/each}</select></label>
      <label><span>Supplier Relationship</span><select name="supplierRelationshipId"><option value="">All suppliers</option>{#each data.projection.supplierRelationships.filter((s) => s.status === 'RELEASED') as s}<option value={s.id}>{s.code} · {s.organisationName}</option>{/each}</select></label>
      <label><span>Item object type</span><input name="itemObjectType" /></label>
      <label><span>Assigned status</span><select name="assignedStatus"><option>PREFERRED</option><option>APPROVED</option><option>DO_NOT_USE</option></select></label>
      <label><span>Priority</span><input name="priority" type="number" min="1" value="10" required /></label>
      <label><span>Status</span><select name="status"><option>ACTIVE</option><option>DISABLED</option></select></label>
      <label class="wide-field"><span>Criteria JSON</span><textarea name="criteria" rows="5" required placeholder='{"classification":"STRUCTURAL_COMPONENT"}'></textarea></label>
      <button type="submit">Create Rule →</button>
    </form>
  </details>

  <details>
    <summary>Enable / disable sourcing rule</summary>
    <form method="POST" action="?/setSourcingRuleStatus" class="admin-form access-form">
      <label><span>Rule</span><select name="ruleId" required><option value="">Select</option>{#each data.projection.sourcingRules as r}<option value={r.id}>{r.code} · {r.status}</option>{/each}</select></label>
      <label><span>New status</span><select name="status"><option>ACTIVE</option><option>DISABLED</option></select></label>
      <button type="submit">Update Rule →</button>
    </form>
  </details>
  {/if}

  <div class="control-record-list">
  {#each data.projection.sourcingRules as r}
    <article>
      <header><span>Priority {r.priority}</span><strong>{r.status}</strong></header>
      <h3>{r.code} — {r.name}</h3>
      <p>{r.contextCode} · {r.supplierCode} · assigns {r.assignedStatus}</p>
      <footer><span>{r.itemObjectType ?? 'All item types'}</span></footer>
    </article>
  {/each}
  </div>
</section>
{/if}
