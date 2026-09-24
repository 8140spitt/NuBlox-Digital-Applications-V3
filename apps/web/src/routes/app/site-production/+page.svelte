<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  function dateTime(value?:string) {
    if(!value) return '—';
    return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value));
  }
</script>

<svelte:head><title>Site Production — NuBlox</title></svelte:head>

{#if !data.allowed || !data.projection}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit Construction Site Production.</h1>
      <p>{data.reason}</p>
      <div class="permission-actions">
        <a class="primary-action permission-back" href="/app/request-access?permission=domain.site_production.read&returnTo=/app/site-production">Request access <span aria-hidden="true">→</span></a>
        <a class="quiet-link" href="/app">Back to Home</a>
      </div>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact">
    <div>
      <p class="app-eyebrow">Construction Manager · Site Delivery</p>
      <h1>Site Production</h1>
      <p class="workspace-lede">Run project Work Packages, daily site records, progress, field evidence and site issues from one operational workspace. Formal Inspection/Test/NCR/CAPA is handed to the Quality engine rather than duplicated here.</p>
    </div>
  </section>

  {#if form?.message || form?.error}
    <div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
      <strong>{form?.ok ? 'Completed' : 'Action not completed'}</strong>
      <span>{form?.message ?? form?.error}</span>
    </div>
  {/if}

  <section class="architecture-metrics" aria-label="Site production totals">
    <article><span>Work Packages</span><strong>{data.projection.totals.workPackages}</strong><p>controlled project packages</p></article>
    <article><span>Active</span><strong>{data.projection.totals.active}</strong><p>currently in production</p></article>
    <article><span>Open issues</span><strong>{data.projection.totals.openIssues}</strong><p>RFIs, punch, defects and blockers</p></article>
    <article><span>Field evidence</span><strong>{data.projection.totals.evidence}</strong><p>recorded evidence items</p></article>
  </section>

  {#if data.canManage}
    <details class="workspace-command-drawer">
      <summary><span>Actions</span><strong>Create Work Package</strong><small>Establish a controlled package beneath an existing Project</small></summary>
      <section class="information-admin">
        <form method="POST" action="?/createWorkPackage" class="admin-form">
          <label><span>Project</span><select name="projectObjectId" required><option value="">Select Project</option>{#each data.projection.projects as project}<option value={project.id}>{project.code} · {project.name}</option>{/each}</select></label>
          <label><span>Package code</span><input name="code" required maxlength="120" placeholder="WP-001" /></label>
          <label class="information-wide"><span>Title</span><input name="title" required maxlength="255" /></label>
          <label><span>Construction manager</span><select name="managerPersonId"><option value="">Current user</option>{#each data.projection.people as person}<option value={person.id}>{person.name}</option>{/each}</select></label>
          <label><span>Planned start</span><input name="plannedStart" type="datetime-local" /></label>
          <label><span>Planned end</span><input name="plannedEnd" type="datetime-local" /></label>
          <label class="information-wide"><span>Description / scope</span><textarea name="description" rows="3"></textarea></label>
          <button type="submit" disabled={data.projection.projects.length===0}>Create Work Package <span>→</span></button>
        </form>
      </section>
    </details>
  {/if}

  {#if data.projection.workPackages.length===0}
    <section class="empty-work-state">
      <div class="empty-state-mark">SP</div>
      <div><p class="app-eyebrow">No production packages</p><h2>No construction Work Packages exist yet.</h2><p>Create a Project in CBE Capability Administration, then establish the first Work Package here.</p></div>
    </section>
  {:else}
    <section class="my-work-register">
      <header class="my-work-register-heading"><div><p class="app-eyebrow">Live project delivery</p><h2>Work Packages</h2></div><span>{data.projection.workPackages.length} packages</span></header>
      <div class="my-work-items">
        {#each data.projection.workPackages as wp}
          <article>
            <div class="my-work-kind"><span>{wp.status.replaceAll('_',' ')}</span><strong>{wp.latestPercentComplete.toFixed(0)}%</strong></div>
            <div class="my-work-primary">
              <h3>{wp.code} · {wp.title}</h3>
              <p>{wp.project.code} · {wp.project.name} · Manager {wp.managerName}</p>
              {#if wp.description}<p>{wp.description}</p>{/if}
              <div class="my-work-identifiers">
                <span>Daily logs <strong>{wp.logs.length}</strong></span>
                <span>Evidence <strong>{wp.evidence.length}</strong></span>
                <span>Issues <strong>{wp.issues.filter((issue)=>issue.status==='OPEN'||issue.status==='IN_PROGRESS').length}</strong></span>
              </div>

              {#if data.canManage && (wp.status==='PLANNED'||wp.status==='ON_HOLD')}
                <form method="POST" action="?/activateWorkPackage"><input type="hidden" name="workPackageId" value={wp.id} /><button type="submit">Activate package</button></form>
              {/if}

              {#if data.canExecute && wp.status!=='COMPLETE' && wp.status!=='CANCELLED'}
                <details>
                  <summary>Record today's site work</summary>
                  <form method="POST" action="?/dailyLog" class="admin-form">
                    <input type="hidden" name="workPackageId" value={wp.id} />
                    <label><span>Date</span><input name="logDate" type="date" required /></label>
                    <label><span>Labour</span><input name="labourCount" type="number" min="0" step="1" /></label>
                    <label class="information-wide"><span>Summary</span><textarea name="summary" required rows="3"></textarea></label>
                    <label><span>Conditions</span><input name="conditions" /></label>
                    <label><span>Plant</span><input name="plantSummary" /></label>
                    <label><span>Materials</span><input name="materialsSummary" /></label>
                    <button type="submit">Record daily log</button>
                  </form>
                </details>

                <details>
                  <summary>Record progress</summary>
                  <form method="POST" action="?/progress" class="admin-form">
                    <input type="hidden" name="workPackageId" value={wp.id} />
                    <label><span>% complete</span><input name="percentComplete" type="number" min="0" max="100" step="0.1" required /></label>
                    <label><span>Quantity</span><input name="quantityCompleted" type="number" min="0" step="0.01" /></label>
                    <label><span>Unit</span><input name="unit" placeholder="m² / nr / t" /></label>
                    <label><span>Occurred at</span><input name="occurredAt" type="datetime-local" /></label>
                    <label class="information-wide"><span>Progress note</span><textarea name="note" rows="2"></textarea></label>
                    <button type="submit">Record progress</button>
                  </form>
                </details>

                <details>
                  <summary>Capture field evidence</summary>
                  <form method="POST" action="?/evidence" class="admin-form">
                    <input type="hidden" name="workPackageId" value={wp.id} />
                    <label><span>Evidence type</span><select name="evidenceType" required><option>PHOTO</option><option>DOCUMENT</option><option>CHECKLIST</option><option>MEASUREMENT</option><option>DELIVERY</option><option>OTHER</option></select></label>
                    <label class="information-wide"><span>Reference</span><input name="reference" required placeholder="file/object/reference URI" /></label>
                    <label><span>Occurred at</span><input name="occurredAt" type="datetime-local" /></label>
                    <label class="information-wide"><span>Description</span><textarea name="description" rows="2"></textarea></label>
                    <button type="submit">Record evidence</button>
                  </form>
                </details>
              {/if}

              {#if data.canManageIssues && wp.status!=='COMPLETE' && wp.status!=='CANCELLED'}
                <details>
                  <summary>Raise site issue / RFI / punch item</summary>
                  <form method="POST" action="?/issue" class="admin-form">
                    <input type="hidden" name="workPackageId" value={wp.id} />
                    <label><span>Type</span><select name="issueType" required><option>RFI</option><option>PUNCH</option><option>DEFECT</option><option>BLOCKER</option><option>QUALITY</option><option>SAFETY</option><option>DESIGN</option><option>OTHER</option></select></label>
                    <label><span>Priority</span><select name="priority" required><option>NORMAL</option><option>LOW</option><option>HIGH</option><option>CRITICAL</option></select></label>
                    <label class="information-wide"><span>Title</span><input name="title" required /></label>
                    <label class="information-wide"><span>Description</span><textarea name="description" required rows="3"></textarea></label>
                    <label><span>Assign to</span><select name="assignedToPersonId"><option value="">Unassigned</option>{#each data.projection.people as person}<option value={person.id}>{person.name}</option>{/each}</select></label>
                    <label><span>Due</span><input name="dueAt" type="datetime-local" /></label>
                    <button type="submit">Raise issue</button>
                  </form>
                </details>
              {/if}

              {#if wp.issues.length>0}
                <div class="delivery-fulfilments">
                  {#each wp.issues as issue}
                    <div class="delivery-fulfilment-row">
                      <span>{issue.issueType}</span><strong>{issue.title}</strong><small>{issue.priority} · {issue.status}</small>
                      {#if issue.assignedToName}<span>{issue.assignedToName}</span>{/if}
                      {#if issue.dueAt}<small>Due {dateTime(issue.dueAt)}</small>{/if}
                      {#if data.canManageIssues && (issue.status==='OPEN'||issue.status==='IN_PROGRESS')}
                        <form method="POST" action="?/resolveIssue"><input type="hidden" name="issueId" value={issue.id} /><button type="submit">Resolve</button></form>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}

              {#if data.canManage && wp.status!=='COMPLETE' && wp.status!=='CANCELLED'}
                <form method="POST" action="?/completeWorkPackage">
                  <input type="hidden" name="workPackageId" value={wp.id} />
                  <button type="submit" disabled={wp.latestPercentComplete<100 || wp.evidence.length===0 || wp.issues.some((issue)=>issue.status==='OPEN'||issue.status==='IN_PROGRESS')}>Complete Work Package</button>
                </form>
              {/if}
            </div>
            <dl class="my-work-meta">
              <div><dt>Planned start</dt><dd>{dateTime(wp.plannedStart)}</dd></div>
              <div><dt>Planned end</dt><dd>{dateTime(wp.plannedEnd)}</dd></div>
              <div><dt>Latest progress</dt><dd>{wp.latestPercentComplete.toFixed(1)}%</dd></div>
            </dl>
          </article>
        {/each}
      </div>
    </section>
  {/if}
{/if}
