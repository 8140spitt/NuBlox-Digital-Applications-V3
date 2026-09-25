<script lang="ts">
  import type { ActionData, PageData } from './$types';
  let {data,form}:{data:PageData;form:ActionData}=$props();

  function dateOnly(value:string){return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value));}
  function candidates(requirement:NonNullable<PageData['projection']>['requirements'][number]){
    return data.projection?.candidates.filter(candidate=>
      candidate.functionContextId===requirement.supplyingFunctionContextId &&
      candidate.jobProfileId===requirement.jobProfileId
    )??[];
  }
  function allocated(requirement:NonNullable<PageData['projection']>['requirements'][number]){
    return requirement.fulfilments.filter(item=>item.status==='ACTIVE').reduce((sum,item)=>sum+item.requirementSharePercent,0);
  }
</script>

<svelte:head><title>Resource Planning — NuBlox</title></svelte:head>

{#if !data.allowed || !data.projection}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit Organisational Resource Planning.</h1>
      <p>{data.reason}</p>
      <div class="permission-actions">
        <a class="primary-action permission-back" href="/app/request-access?permission=platform.resource_planning.read&returnTo=/app/resource-planning">Request access <span aria-hidden="true">→</span></a>
        <a class="quiet-link" href="/app">Back to Home</a>
      </div>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact">
    <div>
      <p class="app-eyebrow">Enterprise organisation · workforce supply and demand</p>
      <h1>Resource Planning</h1>
      <p class="workspace-lede">Functions are permanent capability organisations. Projects are temporary delivery organisations. Projects request roles from Functions; Functions fulfil demand with named employees, and NuBlox records the resulting project deployment and capacity.</p>
    </div>
  </section>

  {#if form?.message || form?.error}
    <div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
      <strong>{form?.ok?'Completed':'Action not completed'}</strong>
      <span>{form?.message??form?.error}</span>
    </div>
  {/if}

  <section class="architecture-metrics" aria-label="Resource planning totals">
    <article><span>Function organisations</span><strong>{data.projection.totals.functions}</strong><p>permanent capability homes</p></article>
    <article><span>Project organisations</span><strong>{data.projection.totals.projects}</strong><p>temporary delivery organisations</p></article>
    <article><span>Demand awaiting supply</span><strong>{data.projection.totals.openRequirements}</strong><p>open or partly fulfilled</p></article>
    <article><span>Named deployments</span><strong>{data.projection.totals.namedDeployments}</strong><p>people supplied into delivery</p></article>
  </section>

  {#if data.canManage}
    <section class="information-admin">
      <div class="panel-heading"><div><p class="app-eyebrow">Organisational model</p><h2>Establish Function and Project organisations</h2></div></div>
      <div class="admin-grid">
        <form method="POST" action="?/registerFunction" class="admin-form">
          <h3>Permanent Function organisation</h3>
          <label><span>Function</span><select name="functionId" required><option value="">Select Function</option>{#each data.projection.functions as item}<option value={item.id}>{item.code} · {item.name}</option>{/each}</select></label>
          <label><span>Tenant organisation</span><select name="organisationId" required><option value="">Select Organisation</option>{#each data.projection.organisations as item}<option value={item.id}>{item.name}</option>{/each}</select></label>
          <label><span>Function root organisation unit</span><select name="organisationUnitId" required><option value="">Select Organisation Unit</option>{#each data.projection.organisationUnits as item}<option value={item.id}>{item.code} · {item.name}</option>{/each}</select></label>
          <label><span>Effective from</span><input name="effectiveFrom" type="datetime-local" /></label>
          <button type="submit">Register Function organisation <span>→</span></button>
        </form>

        <form method="POST" action="?/registerProject" class="admin-form">
          <h3>Temporary Project organisation</h3>
          <label><span>Project</span><select name="projectObjectId" required><option value="">Select Project</option>{#each data.projection.availableProjects.filter(project=>!data.projection?.projectContexts.some(context=>context.canonicalObjectId===project.objectId)) as item}<option value={item.objectId}>{item.code} · {item.name}</option>{/each}</select></label>
          <label><span>Owning tenant organisation</span><select name="organisationId" required><option value="">Select Organisation</option>{#each data.projection.organisations as item}<option value={item.id}>{item.name}</option>{/each}</select></label>
          <label><span>Effective from</span><input name="effectiveFrom" type="datetime-local" /></label>
          <label><span>Effective to</span><input name="effectiveTo" type="datetime-local" /></label>
          <button type="submit">Register Project organisation <span>→</span></button>
        </form>
      </div>
    </section>

    <details class="workspace-command-drawer" open>
      <summary><span>Project demand</span><strong>Request capability from a Function</strong><small>Example: ABC0001 requests a Financial Controller from Finance</small></summary>
      <section class="information-admin">
        <form method="POST" action="?/createRequirement" class="admin-form">
          <label><span>Requesting Project</span><select name="requestingContextId" required><option value="">Select Project</option>{#each data.projection.projectContexts.filter(item=>item.status==='ACTIVE') as item}<option value={item.id}>{item.code} · {item.name}</option>{/each}</select></label>
          <label><span>Supplying Function</span><select name="supplyingFunctionContextId" required><option value="">Select Function</option>{#each data.projection.functionContexts.filter(item=>item.status==='ACTIVE') as item}<option value={item.id}>{item.code} · {item.name}</option>{/each}</select></label>
          <label><span>Required Job Profile</span><select name="jobProfileId" required><option value="">Select Job Profile</option>{#each data.projection.jobProfiles as item}<option value={item.id}>{item.name}</option>{/each}</select></label>
          <label><span>Project role title</span><input name="roleTitle" required placeholder="Project Financial Controller" /></label>
          <label><span>Headcount</span><input name="requiredHeadcount" type="number" min="1" step="1" value="1" required /></label>
          <label><span>Capacity per named fulfilment</span><input name="requiredCapacityPercent" type="number" min="0.01" max="100" step="0.01" value="100" required /></label>
          <label><span>Required from</span><input name="effectiveFrom" type="datetime-local" required /></label>
          <label><span>Required to</span><input name="effectiveTo" type="datetime-local" /></label>
          <label class="information-wide"><span>Requirement / scope</span><textarea name="description" required rows="3" placeholder="Financial control, reporting and project finance accountability for the delivery period."></textarea></label>
          <button type="submit" disabled={data.projection.projectContexts.length===0||data.projection.functionContexts.length===0}>Send request to Function <span>→</span></button>
        </form>
      </section>
    </details>
  {/if}

  <section class="my-work-register">
    <header class="my-work-register-heading"><div><p class="app-eyebrow">Function supply queue</p><h2>Resource requirements</h2></div><span>{data.projection.requirements.length} requirements</span></header>
    {#if data.projection.requirements.length===0}
      <div class="empty-work-state"><div class="empty-state-mark">RP</div><div><h2>No resource demand has been raised.</h2><p>Register at least one Function organisation and one Project organisation, then create the Project's first capability request.</p></div></div>
    {:else}
      <div class="my-work-items">
        {#each data.projection.requirements as requirement}
          <article>
            <div class="my-work-kind"><span>{requirement.status.replaceAll('_',' ')}</span><strong>{allocated(requirement).toFixed(0)}%</strong></div>
            <div class="my-work-primary">
              <h3>{requirement.requestingCode} · {requirement.roleTitle}</h3>
              <p><strong>Demand:</strong> {requirement.requestingName} → <strong>Supply:</strong> {requirement.functionCode} · {requirement.functionName}</p>
              <p>{requirement.jobProfileName} · {requirement.requiredHeadcount} headcount · {requirement.requiredCapacityPercent}% capacity · {dateOnly(requirement.effectiveFrom)}{#if requirement.effectiveTo} – {dateOnly(requirement.effectiveTo)}{/if}</p>
              <p>{requirement.description}</p>

              {#if requirement.fulfilments.length>0}
                <div class="delivery-fulfilments">
                  {#each requirement.fulfilments as fulfilment}
                    <div class="delivery-fulfilment-row">
                      <span>NAMED PERSON</span>
                      <strong>{fulfilment.personName}</strong>
                      <small>{fulfilment.positionTitle} · {fulfilment.resourceCapacityPercent}% capacity · {fulfilment.requirementSharePercent}% of requirement</small>
                      <small>Deployment {fulfilment.functionalDeploymentId}</small>
                    </div>
                  {/each}
                </div>
              {/if}

              {#if data.canFulfil && requirement.status!=='FULFILLED' && requirement.status!=='CANCELLED'}
                <details>
                  <summary>Finance / Function: provide named individual</summary>
                  <form method="POST" action="?/fulfilRequirement" class="admin-form">
                    <input type="hidden" name="requirementId" value={requirement.id} />
                    <label><span>Named employee</span><select name="personId" required><option value="">Select matching employee</option>{#each candidates(requirement) as candidate}<option value={candidate.personId}>{candidate.personName} · {candidate.positionTitle} · {candidate.organisationUnitName}</option>{/each}</select></label>
                    <label><span>Requirement share %</span><input name="requirementSharePercent" type="number" min="0.01" max={100-allocated(requirement)} step="0.01" value={100-allocated(requirement)} required /></label>
                    <label><span>Employee capacity %</span><input name="resourceCapacityPercent" type="number" min="0.01" max="100" step="0.01" value={requirement.requiredCapacityPercent} required /></label>
                    <button type="submit" disabled={candidates(requirement).length===0}>Deploy named employee <span>→</span></button>
                  </form>
                  {#if candidates(requirement).length===0}<p>No active employee currently occupies the required Job Profile inside this Function organisation.</p>{/if}
                </details>
              {/if}
            </div>
            <dl class="my-work-meta">
              <div><dt>Supplying Function</dt><dd>{requirement.functionCode}</dd></div>
              <div><dt>Job Profile</dt><dd>{requirement.jobProfileName}</dd></div>
              <div><dt>Fulfilled</dt><dd>{allocated(requirement).toFixed(2)}%</dd></div>
            </dl>
          </article>
        {/each}
      </div>
    {/if}
  </section>

  <section class="information-admin">
    <div class="panel-heading"><div><p class="app-eyebrow">Matrix organisation</p><h2>Permanent capability and temporary delivery</h2></div></div>
    <div class="admin-grid">
      <article>
        <h3>Function organisations</h3>
        {#each data.projection.functionContexts as item}
          <p><strong>{item.code} · {item.name}</strong><br />{item.organisationUnitName} · {item.lifecycle}</p>
        {/each}
      </article>
      <article>
        <h3>Project organisations</h3>
        {#each data.projection.projectContexts as item}
          <p><strong>{item.code} · {item.name}</strong><br />{item.organisationName} · {item.lifecycle}</p>
        {/each}
      </article>
    </div>
  </section>
{/if}
