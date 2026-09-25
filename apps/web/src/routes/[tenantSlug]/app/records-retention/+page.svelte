<script lang="ts">
  import type { ActionData, PageData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Records Retention — NuBlox</title></svelte:head>

{#if !data.allowed || !data.projection}
<section class="permission-state">
  <div class="permission-state-code">403</div>
  <div>
    <p class="app-eyebrow">Controlled access outcome</p>
    <h1>Your role does not permit Records Retention access.</h1>
    <p>{data.reason}</p>
    <a class="primary-action" href="/app/request-access?permission=platform.records_retention.read&returnTo=/app/records-retention">Request access →</a>
  </div>
</section>
{:else}
<section class="workspace-hero compact">
  <div>
    <p class="app-eyebrow">Records &amp; information governance</p>
    <h1>Records Retention</h1>
    <p class="workspace-lede">
      Govern versioned retention policy, legal and regulatory holds, scheduled or ad-hoc disposition,
      archive provenance, Decision-backed destruction and controlled restore without confusing records
      disposition with ordinary deletion, backup expiry or infrastructure recovery.
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
  <article><span>Active policies</span><strong>{data.projection.totals.activePolicies}</strong><p>{data.projection.totals.policies} policy version(s)</p></article>
  <article><span>Active holds</span><strong>{data.projection.totals.activeHolds}</strong><p>Override disposition eligibility</p></article>
  <article><span>Archived</span><strong>{data.projection.totals.archived}</strong><p>{data.projection.totals.restored} restore(s)</p></article>
  <article><span>Destroyed</span><strong>{data.projection.totals.destroyed}</strong><p>{data.projection.totals.exceptionRuns} exception run(s)</p></article>
</section>

<section class="workspace-panel">
  <div class="panel-heading">
    <div><p class="app-eyebrow">Control boundary</p><h2>Retention expiry is not deletion authority</h2></div>
  </div>
  <p>
    <strong>Retention Policy ≠ Hold ≠ Schedule ≠ Disposition Run ≠ Archive ≠ Destruction ≠ Restore.</strong>
    Destruction requires its own approved Decision and remains blocked by any applicable active hold.
    Archive and destruction evidence are retained independently from the source object they govern.
  </p>
</section>

<div class="control-workspace-grid">
<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Governed policy</p><h2>Policy versions &amp; rules</h2></div></div>

  {#if data.canManage}
  <details open>
    <summary>Create retention policy version</summary>
    <form method="POST" action="?/createPolicy" class="admin-form access-form">
      <label><span>Scope object</span><select name="scopeObjectId" required><option value="">Select</option>{#each data.projection.scopeObjects as o}<option value={o.id}>{o.objectType} · {o.stableKey}</option>{/each}</select></label>
      <label><span>Code</span><input name="code" required /></label>
      <label><span>Name</span><input name="name" required /></label>
      <label><span>Version</span><input name="version" type="number" min="1" value="1" required /></label>
      <label class="wide-field"><span>Description</span><input name="description" /></label>
      <button type="submit">Create Policy Version →</button>
    </form>
  </details>

  <details>
    <summary>Add retention rule</summary>
    <form method="POST" action="?/addRule" class="admin-form access-form">
      <label><span>Draft policy</span><select name="retentionPolicyId" required><option value="">Select</option>{#each data.projection.policies.filter((p) => p.status === 'DRAFT') as p}<option value={p.id}>{p.code} v{p.version}</option>{/each}</select></label>
      <label><span>Rule code</span><input name="code" required /></label>
      <label><span>Name</span><input name="name" required /></label>
      <label><span>Object family</span><input name="objectFamily" required /></label>
      <label><span>Trigger</span><select name="triggerType"><option>CREATED_AT</option><option>LAST_MODIFIED_AT</option><option>RELEASED_AT</option><option>CLOSED_AT</option><option>ARCHIVED_AT</option><option>CUSTOM</option></select></label>
      <label><span>Custom trigger field</span><input name="triggerField" /></label>
      <label><span>Retention days</span><input name="retentionPeriodDays" type="number" min="0" required /></label>
      <label><span>Disposition action</span><select name="dispositionAction"><option>ARCHIVE</option><option>DESTROY</option><option>REVIEW</option></select></label>
      <label><span>Sequence</span><input name="sequence" type="number" min="1" value="1" required /></label>
      <label><span><input name="enabled" type="checkbox" checked /> Enabled</span></label>
      <label class="wide-field"><span>Selection criteria JSON</span><textarea name="selectionCriteria" rows="5" required placeholder="Reusable selection/query criteria JSON object"></textarea></label>
      <button type="submit">Add Rule →</button>
    </form>
  </details>

  <details>
    <summary>Freeze policy checksum</summary>
    <form method="POST" action="?/freezePolicy" class="admin-form access-form">
      <label><span>Draft policy</span><select name="policyId" required><option value="">Select</option>{#each data.projection.policies.filter((p) => p.status === 'DRAFT' && p.rules.length > 0) as p}<option value={p.id}>{p.code} v{p.version} · {p.rules.length} rule(s)</option>{/each}</select></label>
      <button type="submit">Freeze Policy →</button>
    </form>
  </details>

  <details>
    <summary>Activate Decision-approved policy</summary>
    <p>Create the immutable approval in <a href="/app/control">Control</a>. It must govern the same scope object and exact frozen policy checksum.</p>
    <form method="POST" action="?/activatePolicy" class="admin-form access-form">
      <label><span>Frozen policy</span><select name="policyId" required><option value="">Select</option>{#each data.projection.policies.filter((p) => p.status === 'FROZEN') as p}<option value={p.id}>{p.code} v{p.version} · {p.checksum}</option>{/each}</select></label>
      <label><span>Approved Decision</span><select name="decisionId" required><option value="">Select</option>{#each data.projection.decisions as d}<option value={d.id}>{d.decisionType} · {d.subjectVersion ?? 'no version'} · {d.reason}</option>{/each}</select></label>
      <button type="submit">Activate Policy →</button>
    </form>
  </details>
  {/if}

  <div class="control-record-list">
  {#each data.projection.policies as p}
    <article>
      <header><span>v{p.version}</span><strong>{p.status}</strong></header>
      <h3>{p.code} — {p.name}</h3>
      <p>{p.rules.length} rule(s)</p>
      <footer><span>{p.checksum ?? 'Draft — not frozen'}</span></footer>
    </article>
    {#each p.rules as r}
      <div class="access-assignment-list">
        <article>
          <div><span>Rule</span><strong>{r.code}</strong></div>
          <div><span>Family</span><strong>{r.objectFamily}</strong></div>
          <div><span>Retention</span><strong>{r.retentionPeriodDays} days</strong></div>
          <div><span>Outcome</span><strong>{r.dispositionAction}</strong></div>
        </article>
      </div>
    {/each}
  {/each}
  </div>
</section>

<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Preservation authority</p><h2>Legal, regulatory &amp; records holds</h2></div></div>

  {#if data.canHold}
  <details open>
    <summary>Impose hold</summary>
    <form method="POST" action="?/imposeHold" class="admin-form access-form">
      <label><span>Subject object</span><select name="subjectObjectId" required><option value="">Select</option>{#each data.projection.scopeObjects as o}<option value={o.id}>{o.objectType} · {o.stableKey}</option>{/each}</select></label>
      <label><span>Subject version</span><input name="subjectVersion" /></label>
      <label><span>Hold type</span><select name="holdType"><option>LEGAL</option><option>REGULATORY</option><option>RECORDS</option><option>INVESTIGATION</option><option>OTHER</option></select></label>
      <label><span><input name="blocksArchive" type="checkbox" /> Block archive</span></label>
      <label><span><input name="blocksDestruction" type="checkbox" checked /> Block destruction</span></label>
      <label class="wide-field"><span>Reason</span><input name="reason" required /></label>
      <button type="submit">Impose Hold →</button>
    </form>
  </details>

  <details>
    <summary>Release hold with Decision</summary>
    <form method="POST" action="?/releaseHold" class="admin-form access-form">
      <label><span>Active hold</span><select name="holdId" required><option value="">Select</option>{#each data.projection.holds.filter((h) => h.status === 'ACTIVE') as h}<option value={h.id}>{h.holdType} · {h.subjectObjectId} · {h.subjectVersion ?? 'all versions'}</option>{/each}</select></label>
      <label><span>Approved Decision</span><select name="decisionId" required><option value="">Select</option>{#each data.projection.decisions as d}<option value={d.id}>{d.decisionType} · {d.subjectObjectId} · {d.subjectVersion ?? 'all versions'}</option>{/each}</select></label>
      <button type="submit">Release Hold →</button>
    </form>
  </details>
  {/if}

  <div class="control-record-list">
  {#each data.projection.holds as h}
    <article>
      <header><span>{h.holdType}</span><strong>{h.status}</strong></header>
      <h3>{h.subjectObjectId} {h.subjectVersion ?? '· all versions'}</h3>
      <p>{h.reason}</p>
      <footer><span>Archive: {h.blocksArchive ? 'blocked' : 'allowed'}</span><span>Destruction: {h.blocksDestruction ? 'blocked' : 'allowed'}</span></footer>
    </article>
  {/each}
  </div>
</section>
</div>

<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Auditable execution</p><h2>Disposition schedules &amp; runs</h2></div></div>

  {#if data.canManage}
  <details>
    <summary>Create disposition schedule</summary>
    <form method="POST" action="?/createSchedule" class="admin-form access-form">
      <label><span>Active rule</span><select name="retentionRuleId" required><option value="">Select</option>{#each data.projection.policies.filter((p) => p.status === 'ACTIVE') as p}{#each p.rules.filter((r) => r.enabled) as r}<option value={r.id}>{p.code} · {r.code} · {r.dispositionAction}</option>{/each}{/each}</select></label>
      <label><span>Schedule expression</span><input name="scheduleExpression" required placeholder="RRULE:FREQ=DAILY" /></label>
      <label><span>Timezone</span><input name="timezone" value="Europe/London" required /></label>
      <label><span><input name="enabled" type="checkbox" checked /> Enabled</span></label>
      <button type="submit">Create Schedule →</button>
    </form>
  </details>
  {/if}

  {#if data.canExecute}
  <details open>
    <summary>Queue and start disposition run</summary>
    <form method="POST" action="?/createRun" class="admin-form access-form">
      <label><span>Active rule</span><select name="retentionRuleId" required><option value="">Select</option>{#each data.projection.policies.filter((p) => p.status === 'ACTIVE') as p}{#each p.rules.filter((r) => r.enabled) as r}<option value={r.id}>{p.code} · {r.code} · {r.dispositionAction}</option>{/each}{/each}</select></label>
      <label><span>Schedule (optional)</span><select name="scheduleId"><option value="">Ad-hoc</option>{#each data.projection.policies as p}{#each p.rules as r}{#each r.schedules.filter((s) => s.enabled) as s}<option value={s.id}>{r.code} · {s.scheduleExpression}</option>{/each}{/each}{/each}</select></label>
      <label><span>Run reference</span><input name="runReference" required /></label>
      <label class="wide-field"><span>Selection snapshot JSON</span><textarea name="selectionSnapshot" rows="5" required placeholder="Frozen candidate/query evidence JSON"></textarea></label>
      <button type="submit">Queue Run →</button>
    </form>

    <form method="POST" action="?/startRun" class="admin-form access-form">
      <label><span>Queued run</span><select name="runId" required><option value="">Select</option>{#each data.projection.runs.filter((r) => r.status === 'QUEUED') as r}<option value={r.id}>{r.runReference} · {r.ruleCode}</option>{/each}</select></label>
      <button type="submit">Start Run →</button>
    </form>
  </details>

  <details>
    <summary>Record archive evidence</summary>
    <form method="POST" action="?/createArchive" class="admin-form access-form">
      <label><span>Running ARCHIVE run</span><select name="runId" required><option value="">Select</option>{#each data.projection.runs.filter((r) => r.status === 'RUNNING' && r.ruleAction === 'ARCHIVE') as r}<option value={r.id}>{r.runReference}</option>{/each}</select></label>
      <label><span>Subject</span><select name="subjectObjectId" required><option value="">Select</option>{#each data.projection.scopeObjects as o}<option value={o.id}>{o.objectType} · {o.stableKey}</option>{/each}</select></label>
      <label><span>Subject version</span><input name="subjectVersion" /></label>
      <label><span>Archive reference</span><input name="archiveReference" required /></label>
      <label><span>Integrity hash</span><input name="integrityHash" required /></label>
      <label class="wide-field"><span>Archive manifest JSON</span><textarea name="archiveManifest" rows="5" required></textarea></label>
      <button type="submit">Record Archive →</button>
    </form>
  </details>

  <details>
    <summary>Record disposition item result</summary>
    <form method="POST" action="?/recordResult" class="admin-form access-form">
      <label><span>Running run</span><select name="runId" required><option value="">Select</option>{#each data.projection.runs.filter((r) => r.status === 'RUNNING') as r}<option value={r.id}>{r.runReference} · {r.ruleAction}</option>{/each}</select></label>
      <label><span>Subject</span><select name="subjectObjectId" required><option value="">Select</option>{#each data.projection.scopeObjects as o}<option value={o.id}>{o.objectType} · {o.stableKey}</option>{/each}</select></label>
      <label><span>Subject version</span><input name="subjectVersion" /></label>
      <label><span>Outcome</span><select name="outcome"><option>HELD</option><option>ARCHIVED</option><option>DESTROYED</option><option>REVIEW_REQUIRED</option><option>SKIPPED</option><option>FAILED</option></select></label>
      <label><span>Hold evidence</span><select name="holdId"><option value="">None</option>{#each data.projection.holds.filter((h) => h.status === 'ACTIVE') as h}<option value={h.id}>{h.holdType} · {h.subjectObjectId}</option>{/each}</select></label>
      <label><span>Archive evidence</span><select name="archiveRecordId"><option value="">None</option>{#each data.projection.archives as a}<option value={a.id}>{a.archiveReference}</option>{/each}</select></label>
      <label><span>Destruction evidence</span><select name="destructionEvidenceId"><option value="">None</option>{#each data.projection.destructionEvidence as d}<option value={d.id}>{d.subjectObjectId} · {d.destroyedAt}</option>{/each}</select></label>
      <label class="wide-field"><span>Reason</span><input name="reason" required /></label>
      <button type="submit">Record Result →</button>
    </form>
  </details>

  <details>
    <summary>Complete disposition run</summary>
    <form method="POST" action="?/completeRun" class="admin-form access-form">
      <label><span>Running run</span><select name="runId" required><option value="">Select</option>{#each data.projection.runs.filter((r) => r.status === 'RUNNING') as r}<option value={r.id}>{r.runReference} · {r.results.length} result(s)</option>{/each}</select></label>
      <button type="submit">Complete Run →</button>
    </form>
  </details>
  {/if}

  <div class="control-record-list">
  {#each data.projection.runs as r}
    <article>
      <header><span>{r.policyCode ?? 'Policy'} · {r.ruleCode}</span><strong>{r.status}</strong></header>
      <h3>{r.runReference} — {r.ruleAction ?? 'Unknown action'}</h3>
      <p>{r.results.length} item result(s) · {r.archives.length} archive record(s) · {r.destructionEvidence.length} destruction record(s)</p>
      <footer><span>{r.selectionChecksum}</span></footer>
    </article>
  {/each}
  </div>
</section>

<div class="control-workspace-grid">
<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Irreversible outcome</p><h2>Decision-backed destruction</h2></div></div>

  {#if data.canDestroy}
  <p>An approved Decision is required for the exact subject/version. An applicable active hold blocks destruction even when an approval already exists.</p>
  <form method="POST" action="?/createDestruction" class="admin-form access-form">
    <label><span>Running DESTROY run</span><select name="runId" required><option value="">Select</option>{#each data.projection.runs.filter((r) => r.status === 'RUNNING' && r.ruleAction === 'DESTROY') as r}<option value={r.id}>{r.runReference}</option>{/each}</select></label>
    <label><span>Subject</span><select name="subjectObjectId" required><option value="">Select</option>{#each data.projection.scopeObjects as o}<option value={o.id}>{o.objectType} · {o.stableKey}</option>{/each}</select></label>
    <label><span>Subject version</span><input name="subjectVersion" /></label>
    <label><span>Archive record (optional)</span><select name="archiveRecordId"><option value="">None</option>{#each data.projection.archives.filter((a) => a.status === 'AVAILABLE') as a}<option value={a.id}>{a.archiveReference}</option>{/each}</select></label>
    <label><span>Approved Decision</span><select name="decisionId" required><option value="">Select</option>{#each data.projection.decisions as d}<option value={d.id}>{d.decisionType} · {d.subjectObjectId} · {d.subjectVersion ?? 'all versions'}</option>{/each}</select></label>
    <label><span>Method</span><input name="method" required /></label>
    <label><span>Metadata outcome</span><select name="metadataOutcome"><option>TOMBSTONE_RETAINED</option><option>DELETED</option></select></label>
    <label><span>Content outcome</span><select name="contentOutcome"><option>DELETED</option><option>NOT_APPLICABLE</option></select></label>
    <label class="wide-field"><span>Execution evidence JSON</span><textarea name="evidence" rows="5" required></textarea></label>
    <button type="submit">Record Destruction Evidence →</button>
  </form>
  {/if}

  <div class="control-record-list">
  {#each data.projection.destructionEvidence as d}
    <article>
      <header><span>{d.metadataOutcome}</span><strong>{d.contentOutcome}</strong></header>
      <h3>{d.subjectObjectId} {d.subjectVersion ?? ''}</h3>
      <p>{d.method}</p>
      <footer><span>{d.integrityHash}</span><span>{d.destroyedAt}</span></footer>
    </article>
  {/each}
  </div>
</section>

<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Reconstitution</p><h2>Archive &amp; restore provenance</h2></div></div>

  {#if data.canRestore}
  <p>Restore requires an approved Decision for the archived subject/version. The archive remains provenance evidence after restore.</p>
  <form method="POST" action="?/createRestore" class="admin-form access-form">
    <label><span>Available archive</span><select name="archiveRecordId" required><option value="">Select</option>{#each data.projection.archives.filter((a) => a.status === 'AVAILABLE') as a}<option value={a.id}>{a.archiveReference} · {a.subjectObjectId}</option>{/each}</select></label>
    <label><span>Subject</span><select name="subjectObjectId" required><option value="">Select</option>{#each data.projection.scopeObjects as o}<option value={o.id}>{o.objectType} · {o.stableKey}</option>{/each}</select></label>
    <label><span>Subject version</span><input name="subjectVersion" /></label>
    <label><span>Restore reference</span><input name="restoreReference" required /></label>
    <label><span>Approved Decision</span><select name="decisionId" required><option value="">Select</option>{#each data.projection.decisions as d}<option value={d.id}>{d.decisionType} · {d.subjectObjectId} · {d.subjectVersion ?? 'all versions'}</option>{/each}</select></label>
    <label><span>Restored content reference</span><input name="restoredContentReference" required /></label>
    <label><span>Integrity hash</span><input name="integrityHash" required /></label>
    <label><span>Status</span><select name="status"><option>SUCCEEDED</option><option>FAILED</option></select></label>
    <label class="wide-field"><span>Failure message</span><input name="message" /></label>
    <button type="submit">Record Restore →</button>
  </form>
  {/if}

  <div class="control-record-list">
  {#each data.projection.archives as a}
    <article>
      <header><span>{a.status}</span><strong>{a.restores.length} restore(s)</strong></header>
      <h3>{a.archiveReference}</h3>
      <p>{a.subjectObjectId} {a.subjectVersion ?? ''}</p>
      <footer><span>{a.integrityHash}</span><span>{a.archivedAt}</span></footer>
    </article>
  {/each}
  </div>
</section>
</div>
{/if}
