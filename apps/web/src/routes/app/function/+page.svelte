<script lang="ts">
  import type { ActionData, PageData } from './$types';
  let {data,form}:{data:PageData;form:ActionData}=$props();
  const side=$derived(data.experience?.deploymentPurpose==='FUNCTIONAL_GOVERNANCE'?'Governance':'Delivery');

  function money(value:number,currency:string) {
    return new Intl.NumberFormat('en-GB',{style:'currency',currency,maximumFractionDigits:0}).format(value);
  }

  function label(value:string) {
    return value.toLowerCase().replaceAll('_',' ').replace(/\b\w/g,(character)=>character.toUpperCase());
  }
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
      <p>Human Capital must assign the Position to a Function and mark it as Governance or Delivery.</p>
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

  {#if data.sales}
    <section class="workspace-panel">
      <div class="panel-heading">
        <div>
          <p class="app-eyebrow">F07 · Sales Delivery · {data.sales.scope.managementSpan>0?'My + team scope':'My scope'}</p>
          <h2>Customers, opportunities &amp; forecast</h2>
        </div>
        <span>{data.sales.totals.openOpportunities} open</span>
      </div>

      <div class="governance-capability-grid">
        <article>
          <strong>{data.sales.totals.accounts}</strong>
          <p>Sales Accounts in your authorised Position scope</p>
        </article>
        <article>
          <strong>{data.sales.totals.openOpportunities}</strong>
          <p>Open Opportunities</p>
        </article>
        {#each data.sales.currencyTotals as total}
          <article>
            <strong>{money(total.pipelineValue,total.currency)}</strong>
            <p>{total.currency} pipeline · weighted {money(total.weightedPipeline,total.currency)} · won {money(total.wonValue,total.currency)}</p>
          </article>
        {/each}
      </div>

      {#if form?.message || form?.error}
        <div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
          <strong>{form?.ok?'Completed':'Action not completed'}</strong>
          <span>{form?.message??form?.error}</span>
        </div>
      {/if}

      <div class="function-workspace-grid">
        <section>
          <div class="panel-heading">
            <div><p class="app-eyebrow">Pipeline</p><h2>Opportunities</h2></div>
            <span>{data.sales.opportunities.length}</span>
          </div>
          {#if data.sales.opportunities.length===0}
            <p class="control-empty">No Opportunities are currently visible in your Position scope.</p>
          {:else}
            <div class="workspace-register-list">
              {#each data.sales.opportunities as opportunity}
                <article>
                  <div>
                    <strong>{opportunity.code} · {opportunity.title}</strong>
                    <span>{opportunity.organisationName} · {label(opportunity.stage)} · {opportunity.probabilityPercent}%</span>
                  </div>
                  <div>
                    <strong>{money(opportunity.estimatedValue,opportunity.currency)}</strong>
                    <span>{opportunity.ownerPersonName??opportunity.ownerPositionTitle} · {opportunity.expectedCloseDate??'No close date'} · {label(opportunity.forecastCategory)}</span>
                  </div>
                  {#if data.sales.canWork && opportunity.status==='OPEN'}
                    <details>
                      <summary>Update opportunity</summary>
                      <form method="POST" action="?/updateSalesOpportunity" class="admin-form access-form">
                        <input type="hidden" name="opportunityId" value={opportunity.id} />
                        <input type="hidden" name="rowVersion" value={opportunity.rowVersion} />
                        <label><span>Title</span><input name="title" value={opportunity.title} required /></label>
                        <label><span>Description</span><textarea name="description" required>{opportunity.description}</textarea></label>
                        <label>
                          <span>Owner</span>
                          <select name="ownerPositionId" required>
                            {#each data.sales.ownerPositions as owner}
                              <option value={owner.id} selected={owner.id===opportunity.ownerPositionId}>{owner.personName??owner.title} · {owner.title}</option>
                            {/each}
                          </select>
                        </label>
                        <label>
                          <span>Stage</span>
                          <select name="stage" required>
                            {#each ['QUALIFICATION','DISCOVERY','SOLUTION','PROPOSAL','NEGOTIATION','COMMIT','WON','LOST'] as stage}
                              <option value={stage} selected={stage===opportunity.stage}>{label(stage)}</option>
                            {/each}
                          </select>
                        </label>
                        <label><span>Probability %</span><input name="probabilityPercent" type="number" min="0" max="100" step="1" value={opportunity.probabilityPercent} required /></label>
                        <label><span>Estimated value</span><input name="estimatedValue" type="number" min="0" step="0.01" value={opportunity.estimatedValue} required /></label>
                        <label><span>Currency</span><input name="currency" maxlength="3" value={opportunity.currency} required /></label>
                        <label><span>Expected close</span><input name="expectedCloseDate" type="date" value={opportunity.expectedCloseDate??''} /></label>
                        <label>
                          <span>Forecast</span>
                          <select name="forecastCategory" required>
                            {#each ['PIPELINE','BEST_CASE','COMMIT'] as category}
                              <option value={category} selected={category===opportunity.forecastCategory}>{label(category)}</option>
                            {/each}
                          </select>
                        </label>
                        <button type="submit" class="primary-action">Save Opportunity</button>
                      </form>
                    </details>
                  {/if}
                </article>
              {/each}
            </div>
          {/if}
        </section>

        <aside>
          <div class="panel-heading">
            <div><p class="app-eyebrow">Customer relationships</p><h2>Sales Accounts</h2></div>
            <span>{data.sales.accounts.length}</span>
          </div>
          <div class="workspace-register-list">
            {#each data.sales.accounts as account}
              <article>
                <div><strong>{account.organisationName}</strong><span>{account.code} · {account.segment??'Unsegmented'}</span></div>
                <span>{account.ownerPersonName??account.ownerPositionTitle}</span>
              </article>
            {/each}
          </div>
        </aside>
      </div>

      {#if data.sales.canWork}
        <div class="function-workspace-grid">
          <section>
            <div class="panel-heading"><div><p class="app-eyebrow">Customer ownership</p><h2>Create Sales Account</h2></div></div>
            <form method="POST" action="?/createSalesAccount" class="admin-form access-form">
              <label>
                <span>Organisation</span>
                <select name="organisationId" required>
                  <option value="">Select Organisation</option>
                  {#each data.sales.organisations as organisation}
                    <option value={organisation.id}>{organisation.name}</option>
                  {/each}
                </select>
              </label>
              <label><span>Account code</span><input name="code" placeholder="ACC-0001" required /></label>
              <label>
                <span>Owner Position</span>
                <select name="ownerPositionId" required>
                  {#each data.sales.ownerPositions as owner}
                    <option value={owner.id}>{owner.personName??owner.title} · {owner.title}</option>
                  {/each}
                </select>
              </label>
              <label><span>Segment</span><input name="segment" placeholder="Strategic / Major Projects / Public Sector…" /></label>
              <button type="submit" class="primary-action">Create Sales Account</button>
            </form>
          </section>

          <section>
            <div class="panel-heading"><div><p class="app-eyebrow">Pipeline creation</p><h2>Create Opportunity</h2></div></div>
            {#if data.sales.accounts.length===0}
              <p class="control-empty">Create a Sales Account in your scope before opening an Opportunity.</p>
            {:else}
              <form method="POST" action="?/createSalesOpportunity" class="admin-form access-form">
                <label>
                  <span>Sales Account</span>
                  <select name="salesAccountId" required>
                    {#each data.sales.accounts as account}
                      <option value={account.id}>{account.organisationName} · {account.code}</option>
                    {/each}
                  </select>
                </label>
                <label><span>Opportunity code</span><input name="code" placeholder="OPP-0001" required /></label>
                <label><span>Title</span><input name="title" required /></label>
                <label><span>Description</span><textarea name="description" required></textarea></label>
                <label>
                  <span>Owner Position</span>
                  <select name="ownerPositionId" required>
                    {#each data.sales.ownerPositions as owner}
                      <option value={owner.id}>{owner.personName??owner.title} · {owner.title}</option>
                    {/each}
                  </select>
                </label>
                <label>
                  <span>Stage</span>
                  <select name="stage" required>
                    <option value="QUALIFICATION">Qualification</option>
                    <option value="DISCOVERY">Discovery</option>
                    <option value="SOLUTION">Solution</option>
                    <option value="PROPOSAL">Proposal</option>
                    <option value="NEGOTIATION">Negotiation</option>
                    <option value="COMMIT">Commit</option>
                  </select>
                </label>
                <label><span>Probability %</span><input name="probabilityPercent" type="number" min="0" max="100" step="1" value="10" required /></label>
                <label><span>Estimated value</span><input name="estimatedValue" type="number" min="0" step="0.01" required /></label>
                <label><span>Currency</span><input name="currency" maxlength="3" value="GBP" required /></label>
                <label><span>Expected close</span><input name="expectedCloseDate" type="date" /></label>
                <label>
                  <span>Forecast</span>
                  <select name="forecastCategory" required>
                    <option value="PIPELINE">Pipeline</option>
                    <option value="BEST_CASE">Best case</option>
                    <option value="COMMIT">Commit</option>
                  </select>
                </label>
                <button type="submit" class="primary-action">Create Opportunity</button>
              </form>
            {/if}
          </section>
        </div>
      {:else}
        <p class="control-empty">{data.sales.workReason}</p>
      {/if}
    </section>
  {/if}

  <div class="function-workspace-grid">
    <section class="workspace-panel">
      <div class="panel-heading">
        <div><p class="app-eyebrow">{data.workspace.functionFamily === 'CBE' ? 'CBE Function' : 'Core Business Function'} · {side}</p><h2>{data.workspace.name}</h2></div>
        <span>{data.workspace.subfunctions.length + data.workspace.jobs.length}</span>
      </div>
      <div class="subfunction-list">
        {#each data.workspace.subfunctions as subfunction}
          <details>
            <summary>
              <div><span class="subfunction-code">{subfunction.code}</span><strong>{subfunction.name}</strong></div>
              <span class="subfunction-count">{subfunction.activities.length} activities</span>
            </summary>
            <div class="subfunction-detail redesigned">
              <div><h3>Work scope</h3><ol class="activity-list">{#each subfunction.activities as activity,index}<li><span>{String(index+1).padStart(2,'0')}</span><strong>{activity.name}</strong></li>{/each}</ol></div>
            </div>
          </details>
        {/each}
      </div>

      {#if data.workspace.jobs.length>0}
        <div class="panel-heading">
          <div><p class="app-eyebrow">Jobs in this Function</p><h2>Professional work</h2></div>
          <span>{data.workspace.jobs.length}</span>
        </div>
        <div class="workspace-register-list">
          {#each data.workspace.jobs as job}
            <article>
              <div><strong>{job.canonicalName}</strong><span>{job.jobCode}</span></div>
            </article>
          {/each}
        </div>
      {/if}
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
