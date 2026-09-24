<script lang="ts">
  import type { PageData } from './$types';
  let {data}:{data:PageData}=$props();
  const side=$derived(data.experience?.deploymentPurpose==='FUNCTIONAL_GOVERNANCE'?'Governance':'Delivery');
</script>

<svelte:head><title>My Function — NuBlox</title></svelte:head>

{#if !data.experience}
  <section class="permission-state">
    <div class="permission-state-code">HC</div>
    <div>
      <p class="app-eyebrow">Human Capital authority required</p>
      <h1>Your primary Position has not been established.</h1>
      <p>NuBlox cannot determine your working world until Human Capital has created your Employment and primary Position occupancy.</p>
      <div class="permission-actions">
        <a class="primary-action permission-back" href="/app/hcm">Open HCM <span>→</span></a>
        <a class="quiet-link" href="/app">Back Home</a>
      </div>
    </div>
  </section>
{:else if !data.experience.functionCode || !data.workspace}
  <section class="permission-state">
    <div class="permission-state-code">FN</div>
    <div>
      <p class="app-eyebrow">Function assignment required</p>
      <h1>{data.experience.positionTitle} does not yet have a primary Function world.</h1>
      <p>Human Capital must assign the Position to a Core Function and mark it as Governance or Delivery.</p>
      <div class="permission-actions">
        <a class="primary-action permission-back" href="/app/hcm">Open HCM <span>→</span></a>
        <a class="quiet-link" href="/app">Back Home</a>
      </div>
    </div>
  </section>
{:else}
  <section class="function-workspace-header redesigned">
    <div>
      <div class="function-title-line">
        <span class="function-code large">{data.experience.functionCode}</span>
        <p class="app-eyebrow">My Function · {side}</p>
      </div>
      <h1>{data.experience.functionName}</h1>
      <p class="workspace-lede">This is your primary NuBlox working world because Human Capital has assigned your occupied Position to {data.experience.functionName} {side}.</p>
    </div>
    <dl class="workspace-stat-block">
      <div><dt>Position</dt><dd>{data.experience.positionTitle}</dd></div>
      <div><dt>Job</dt><dd>{data.experience.jobProfileName??'—'}</dd></div>
      <div><dt>Manager</dt><dd>{data.experience.managerPersonName??data.experience.managerPositionTitle??'—'}</dd></div>
      <div><dt>Management span</dt><dd>{data.experience.managementScope.length}</dd></div>
    </dl>
  </section>

  <nav class="workspace-tabs" aria-label="My Function views">
    <a class="active" href="/app/function">{side}</a>
    <a href="/app/my-work">My Work</a>
    {#if data.experience.managementScope.length>0}<a href="/app/my-team">My Team</a>{/if}
  </nav>

  <div class="function-workspace-grid">
    <section class="workspace-panel">
      <div class="panel-heading">
        <div><p class="app-eyebrow">{side} capability</p><h2>{data.workspace.name}</h2></div>
        <span>{data.workspace.subfunctions.length}</span>
      </div>
      <div class="subfunction-list">
        {#each data.workspace.subfunctions as subfunction}
          <details>
            <summary>
              <div><span class="subfunction-code">{subfunction.code}</span><strong>{subfunction.name}</strong></div>
              <span class="subfunction-count">{subfunction.activities.length} activities</span>
            </summary>
            <div class="subfunction-detail redesigned">
              <div><h3>Work scope</h3><ol class="activity-list">{#each subfunction.activities as activity,index}<li><span>{String(index+1).padStart(2,'0')}</span><strong>{activity}</strong></li>{/each}</ol></div>
            </div>
          </details>
        {/each}
      </div>
    </section>

    <aside class="workspace-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">My organisational context</p><h2>Position authority</h2></div></div>
      <div class="governance-capability-grid">
        <article><strong>{data.experience.personName}</strong><p>{data.experience.employeeNumber??'Employee'} · {data.experience.organisationName}</p></article>
        <article><strong>{data.experience.positionTitle}</strong><p>{data.experience.organisationUnitName} · {data.experience.jobProfileName??'No Job Profile'}</p></article>
        <article><strong>{side}</strong><p>{data.experience.functionCode} · {data.experience.functionName}</p></article>
        <article><strong>Line manager</strong><p>{data.experience.managerPersonName??data.experience.managerPositionTitle??'No line manager assigned'}</p></article>
      </div>
      <div class="workspace-action-row">
        <a class="primary-action" href="/app/my-work">Open My Work <span>→</span></a>
        {#if data.experience.managementScope.length>0}<a class="quiet-link" href="/app/my-team">Open My Team</a>{/if}
      </div>
    </aside>
  </div>
{/if}
