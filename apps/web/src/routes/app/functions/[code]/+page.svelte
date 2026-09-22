<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const workspace = $derived(data.workspace);
  const strategy = $derived(data.strategyWorkbench);

  function engineStateLabel(state: string) {
    if (state === 'IMPLEMENTED_PLATFORM' || state === 'IMPLEMENTED_DOMAIN_CORE') return 'Available';
    if (state === 'PARTIAL') return 'Partially available';
    return 'Planned';
  }

  function money(value: number | undefined) {
    if (value === undefined) return '—';
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value);
  }

  function dateOnly(value: string | undefined) {
    if (!value) return '—';
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
  }
</script>

<svelte:head>
  <title>{workspace.code} {workspace.name} — NuBlox</title>
</svelte:head>

{#if workspace.code === 'F01'}
  <section class="function-workspace-header redesigned">
    <div>
      <a class="function-back-link" href="/app/functions">← All Functions</a>
      <div class="function-title-line">
        <span class="function-code large">F01</span>
        <p class="app-eyebrow">Enterprise Function</p>
      </div>
      <h1>Strategy &amp; Enterprise Planning</h1>
      <p class="workspace-lede">
        Define objectives, align investments and initiatives, plan scenarios and roadmaps, manage enterprise plans
        and trace funded work through to measurable outcomes.
      </p>
    </div>
    {#if strategy}
      <dl class="workspace-stat-block">
        <div><dt>Objectives</dt><dd>{strategy.totals.objectives}</dd></div>
        <div><dt>Initiatives</dt><dd>{strategy.totals.initiatives}</dd></div>
        <div><dt>Scenarios</dt><dd>{strategy.totals.scenarios}</dd></div>
        <div><dt>Plans</dt><dd>{strategy.totals.plans}</dd></div>
      </dl>
    {/if}
  </section>

  {#if !data.strategyAllowed || !strategy}
    <section class="permission-state">
      <div class="permission-state-code">403</div>
      <div>
        <p class="app-eyebrow">Controlled access outcome</p>
        <h1>Your role does not permit F01 Strategy &amp; Enterprise Planning.</h1>
        <p>{data.strategyReason}</p>
        <div class="permission-actions">
          <a class="primary-action permission-back" href="/app/request-access?permission=function.f01.read&returnTo=/app/functions/F01">
            Request access <span aria-hidden="true">→</span>
          </a>
          <a class="quiet-link" href="/app/functions">Back to Functions</a>
        </div>
      </div>
    </section>
  {:else}
    {#if form?.message || form?.error}
      <div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
        <strong>{form?.ok ? 'Completed' : 'Action not completed'}</strong>
        <span>{form?.message ?? form?.error}</span>
      </div>
    {/if}

    <section class="architecture-metrics delivery-metrics" aria-label="F01 work totals">
      <article><span>Objectives</span><strong>{strategy.totals.objectives}</strong><p>Enterprise, Function and Team objectives</p></article>
      <article><span>Initiatives</span><strong>{strategy.totals.initiatives}</strong><p>Aligned strategic investments</p></article>
      <article><span>Roadmaps</span><strong>{strategy.totals.roadmaps}</strong><p>Strategy-to-milestone plans</p></article>
      <article><span>Outcomes</span><strong>{strategy.totals.outcomes}</strong><p>Measured benefits and value</p></article>
    </section>

    {#if data.strategyCanWork}
      <details class="workspace-command-drawer">
        <summary>
          <span>Actions</span>
          <strong>Create strategy work</strong>
          <small>Objectives, Key Results, initiatives, roadmaps, scenarios, plans, outcomes and analysis</small>
        </summary>

        <section class="information-admin">
          <div class="information-command-grid">
            <details>
              <summary><span>01</span><strong>Create Objective</strong></summary>
              <form method="POST" action="?/createObjective" class="admin-form">
                <label><span>Code</span><input name="code" required placeholder="OBJ-001" /></label>
                <label><span>Level</span><select name="level"><option>ENTERPRISE</option><option>FUNCTION</option><option>TEAM</option></select></label>
                <label class="information-wide"><span>Title</span><input name="title" required /></label>
                <label class="information-wide"><span>Description</span><textarea name="description" rows="3" required></textarea></label>
                <label><span>Owner</span><select name="ownerPersonId"><option value="">Current user</option>{#each strategy.people as person}<option value={person.id}>{person.name}</option>{/each}</select></label>
                <label><span>Parent objective</span><select name="parentObjectiveId"><option value="">None</option>{#each strategy.objectives as objective}<option value={objective.id}>{objective.code} · {objective.title}</option>{/each}</select></label>
                <label><span>Effective from</span><input name="effectiveFrom" type="datetime-local" /></label>
                <label><span>Effective to</span><input name="effectiveTo" type="datetime-local" /></label>
                <button type="submit">Create Objective <span>→</span></button>
              </form>
            </details>

            <details>
              <summary><span>02</span><strong>Add Key Result</strong></summary>
              <form method="POST" action="?/createKeyResult" class="admin-form">
                <label class="information-wide"><span>Objective</span><select name="objectiveId" required><option value="">Select Objective</option>{#each strategy.objectives as objective}<option value={objective.id}>{objective.code} · {objective.title}</option>{/each}</select></label>
                <label class="information-wide"><span>Key Result</span><input name="title" required /></label>
                <label class="information-wide"><span>Measure</span><input name="measure" required /></label>
                <label><span>Baseline</span><input name="baselineValue" type="number" step="any" /></label>
                <label><span>Target</span><input name="targetValue" type="number" step="any" /></label>
                <label><span>Actual</span><input name="actualValue" type="number" step="any" /></label>
                <label><span>Owner</span><select name="ownerPersonId"><option value="">Current user</option>{#each strategy.people as person}<option value={person.id}>{person.name}</option>{/each}</select></label>
                <button type="submit" disabled={strategy.objectives.length===0}>Add Key Result <span>→</span></button>
              </form>
            </details>

            <details>
              <summary><span>03</span><strong>Create Initiative</strong></summary>
              <form method="POST" action="?/createInitiative" class="admin-form">
                <label class="information-wide"><span>Objective</span><select name="objectiveId" required><option value="">Select Objective</option>{#each strategy.objectives as objective}<option value={objective.id}>{objective.code} · {objective.title}</option>{/each}</select></label>
                <label><span>Code</span><input name="code" required /></label>
                <label><span>Owner</span><select name="ownerPersonId"><option value="">Current user</option>{#each strategy.people as person}<option value={person.id}>{person.name}</option>{/each}</select></label>
                <label class="information-wide"><span>Title</span><input name="title" required /></label>
                <label class="information-wide"><span>Description</span><textarea name="description" rows="3" required></textarea></label>
                <label><span>Investment</span><input name="investmentAmount" type="number" step="0.01" /></label>
                <label><span>Capacity demand</span><input name="capacityDemand" type="number" step="0.01" /></label>
                <label><span>Start</span><input name="startDate" type="datetime-local" /></label>
                <label><span>End</span><input name="endDate" type="datetime-local" /></label>
                <button type="submit" disabled={strategy.objectives.length===0}>Create Initiative <span>→</span></button>
              </form>
            </details>

            <details>
              <summary><span>04</span><strong>Create Roadmap</strong></summary>
              <form method="POST" action="?/createRoadmap" class="admin-form">
                <label><span>Code</span><input name="code" required /></label>
                <label><span>Owner</span><select name="ownerPersonId"><option value="">Current user</option>{#each strategy.people as person}<option value={person.id}>{person.name}</option>{/each}</select></label>
                <label class="information-wide"><span>Title</span><input name="title" required /></label>
                <label class="information-wide"><span>Description</span><textarea name="description" rows="3" required></textarea></label>
                <label><span>Start</span><input name="startDate" type="datetime-local" /></label>
                <label><span>End</span><input name="endDate" type="datetime-local" /></label>
                <button type="submit">Create Roadmap <span>→</span></button>
              </form>
            </details>

            <details>
              <summary><span>05</span><strong>Add Roadmap Item</strong></summary>
              <form method="POST" action="?/addRoadmapItem" class="admin-form">
                <label class="information-wide"><span>Roadmap</span><select name="roadmapId" required><option value="">Select Roadmap</option>{#each strategy.roadmaps as roadmap}<option value={roadmap.id}>{roadmap.code} · {roadmap.title}</option>{/each}</select></label>
                <label><span>Objective</span><select name="objectiveId"><option value="">None</option>{#each strategy.objectives as objective}<option value={objective.id}>{objective.code} · {objective.title}</option>{/each}</select></label>
                <label><span>Initiative</span><select name="initiativeId"><option value="">None</option>{#each strategy.initiatives as initiative}<option value={initiative.id}>{initiative.code} · {initiative.title}</option>{/each}</select></label>
                <label class="information-wide"><span>Milestone / item</span><input name="title" required /></label>
                <label><span>Milestone date</span><input name="milestoneDate" type="datetime-local" /></label>
                <label><span>Sequence</span><input name="sequence" type="number" min="1" value="1" /></label>
                <button type="submit" disabled={strategy.roadmaps.length===0}>Add Roadmap Item <span>→</span></button>
              </form>
            </details>

            <details>
              <summary><span>06</span><strong>Create Scenario</strong></summary>
              <form method="POST" action="?/createScenario" class="admin-form">
                <label><span>Code</span><input name="code" required /></label>
                <label><span>Owner</span><select name="ownerPersonId"><option value="">Current user</option>{#each strategy.people as person}<option value={person.id}>{person.name}</option>{/each}</select></label>
                <label class="information-wide"><span>Title</span><input name="title" required /></label>
                <label class="information-wide"><span>Description</span><textarea name="description" rows="2" required></textarea></label>
                <label><span>Base scenario</span><select name="baseScenarioId"><option value="">None / base case</option>{#each strategy.scenarios as scenario}<option value={scenario.id}>{scenario.code} · {scenario.title}</option>{/each}</select></label>
                <label><span>Budget</span><input name="budgetAmount" type="number" step="0.01" /></label>
                <label><span>Capacity</span><input name="capacityAmount" type="number" step="0.01" /></label>
                <label class="information-wide"><span>Assumptions (JSON)</span><textarea name="assumptions" rows="3" placeholder='{"growth": 0.05}'></textarea></label>
                <label class="information-wide"><span>Expected outcome</span><textarea name="expectedOutcome" rows="2" required></textarea></label>
                <button type="submit">Create Scenario <span>→</span></button>
              </form>
            </details>

            <details>
              <summary><span>07</span><strong>Create Plan / Forecast</strong></summary>
              <form method="POST" action="?/createPlan" class="admin-form">
                <label><span>Plan type</span><select name="planType"><option value="CONNECTED_ENTERPRISE">Connected Enterprise</option><option value="CAPACITY_INVESTMENT">Capacity &amp; Investment</option><option value="BUDGET_FORECAST">Budget / Forecast</option></select></label>
                <label><span>Code</span><input name="code" required /></label>
                <label class="information-wide"><span>Title</span><input name="title" required /></label>
                <label class="information-wide"><span>Description</span><textarea name="description" rows="2" required></textarea></label>
                <label><span>Owner</span><select name="ownerPersonId"><option value="">Current user</option>{#each strategy.people as person}<option value={person.id}>{person.name}</option>{/each}</select></label>
                <label><span>Period start</span><input name="periodStart" type="datetime-local" /></label>
                <label><span>Period end</span><input name="periodEnd" type="datetime-local" /></label>
                <label><span>Target</span><input name="targetAmount" type="number" step="0.01" /></label>
                <label><span>Forecast</span><input name="forecastAmount" type="number" step="0.01" /></label>
                <label><span>Actual</span><input name="actualAmount" type="number" step="0.01" /></label>
                <label class="information-wide"><span>Assumptions (JSON)</span><textarea name="assumptions" rows="3"></textarea></label>
                <button type="submit">Create Plan <span>→</span></button>
              </form>
            </details>

            <details>
              <summary><span>08</span><strong>Record Outcome</strong></summary>
              <form method="POST" action="?/createOutcome" class="admin-form">
                <label class="information-wide"><span>Initiative</span><select name="initiativeId" required><option value="">Select Initiative</option>{#each strategy.initiatives as initiative}<option value={initiative.id}>{initiative.code} · {initiative.title}</option>{/each}</select></label>
                <label class="information-wide"><span>Outcome</span><input name="title" required /></label>
                <label class="information-wide"><span>Measure</span><input name="measure" required /></label>
                <label><span>Target</span><input name="targetValue" type="number" step="any" /></label>
                <label><span>Actual</span><input name="actualValue" type="number" step="any" /></label>
                <label><span>Realised value</span><input name="realisedValue" type="number" step="0.01" /></label>
                <label><span>Owner</span><select name="ownerPersonId"><option value="">Current user</option>{#each strategy.people as person}<option value={person.id}>{person.name}</option>{/each}</select></label>
                <button type="submit" disabled={strategy.initiatives.length===0}>Record Outcome <span>→</span></button>
              </form>
            </details>

            <details>
              <summary><span>09</span><strong>Create Management Analysis</strong></summary>
              <form method="POST" action="?/createAnalysis" class="admin-form">
                <label class="information-wide"><span>Source</span><select name="source" required><option value="">Select plan, scenario or outcome</option>{#each strategy.plans as plan}<option value={"PLAN|"+plan.id}>Plan · {plan.title}</option>{/each}{#each strategy.scenarios as scenario}<option value={"SCENARIO|"+scenario.id}>Scenario · {scenario.title}</option>{/each}{#each strategy.outcomes as outcome}<option value={"OUTCOME|"+outcome.id}>Outcome · {outcome.title}</option>{/each}</select></label>
                <label class="information-wide"><span>Title</span><input name="title" required /></label>
                <label class="information-wide"><span>Analysis</span><textarea name="summary" rows="5" required></textarea></label>
                <label><span>Owner</span><select name="ownerPersonId"><option value="">Current user</option>{#each strategy.people as person}<option value={person.id}>{person.name}</option>{/each}</select></label>
                <button type="submit">Create Analysis <span>→</span></button>
              </form>
            </details>
          </div>
        </section>
      </details>
    {/if}

    <section class="workspace-panel">
      <div class="panel-heading">
        <div><p class="app-eyebrow">Strategy chain</p><h2>Objectives → Key Results → Initiatives</h2></div>
        <span>{strategy.objectives.length}</span>
      </div>
      <div class="subfunction-list">
        {#each strategy.objectives as objective}
          <details>
            <summary>
              <div><span class="subfunction-code">{objective.code}</span><strong>{objective.title}</strong></div>
              <span class="subfunction-count">{objective.status} · {objective.ownerName}</span>
            </summary>
            <div class="subfunction-detail redesigned">
              <div>
                <h3>Objective</h3>
                <p>{objective.description}</p>
                <p class="function-record-meta">{objective.level} · {dateOnly(objective.effectiveFrom)} → {dateOnly(objective.effectiveTo)}</p>
                {#if data.strategyCanWork}
                  <form method="POST" action="?/transition" class="inline-status-form">
                    <input type="hidden" name="entityType" value="OBJECTIVE" />
                    <input type="hidden" name="entityId" value={objective.id} />
                    <select name="status"><option>DRAFT</option><option>PROPOSED</option><option>ALIGNED</option><option>PRIORITISED</option><option>ACTIVE</option><option>TRACKING</option><option>REVIEW</option><option>REBALANCED</option><option>COMPLETE</option><option>CANCELLED</option></select>
                    <button type="submit">Update status</button>
                  </form>
                {/if}
              </div>
              <div>
                <h3>Key Results</h3>
                {#each strategy.keyResults.filter((kr) => kr.objectiveId === objective.id) as kr}
                  <article class="function-record-row">
                    <strong>{kr.title}</strong>
                    <span>{kr.measure}</span>
                    <small>{kr.actualValue ?? '—'} / {kr.targetValue ?? '—'} · {kr.status}</small>
                  </article>
                {:else}
                  <p class="information-empty-inline">No Key Results recorded.</p>
                {/each}
                <h3>Initiatives</h3>
                {#each strategy.initiatives.filter((initiative) => initiative.objectiveId === objective.id) as initiative}
                  <article class="function-record-row">
                    <strong>{initiative.code} · {initiative.title}</strong>
                    <span>{money(initiative.investmentAmount)} · capacity {initiative.capacityDemand ?? '—'}</span>
                    <small>{initiative.status} · {initiative.ownerName}</small>
                  </article>
                {:else}
                  <p class="information-empty-inline">No initiatives aligned.</p>
                {/each}
              </div>
            </div>
          </details>
        {:else}
          <div class="empty-work-state"><div class="empty-state-mark">F01</div><div><h2>No strategic objectives yet.</h2><p>Create the first enterprise objective to begin the strategy chain.</p></div></div>
        {/each}
      </div>
    </section>

    <div class="function-workspace-grid strategy-secondary-grid">
      <section class="workspace-panel">
        <div class="panel-heading"><div><p class="app-eyebrow">Roadmaps</p><h2>Strategic Roadmaps</h2></div><span>{strategy.roadmaps.length}</span></div>
        {#each strategy.roadmaps as roadmap}
          <article class="strategy-card">
            <header><div><span>{roadmap.code}</span><strong>{roadmap.title}</strong></div><small>{roadmap.status}</small></header>
            <p>{roadmap.description}</p>
            {#each roadmap.items as item}<div class="function-record-row"><strong>{item.sequence}. {item.title}</strong><small>{dateOnly(item.milestoneDate)}</small></div>{/each}
          </article>
        {:else}<p class="information-empty">No roadmaps.</p>{/each}
      </section>

      <section class="workspace-panel">
        <div class="panel-heading"><div><p class="app-eyebrow">Scenarios</p><h2>Investment &amp; Capacity Scenarios</h2></div><span>{strategy.scenarios.length}</span></div>
        {#each strategy.scenarios as scenario}
          <article class="strategy-card">
            <header><div><span>{scenario.code}</span><strong>{scenario.title}</strong></div><small>{scenario.status}</small></header>
            <p>{scenario.expectedOutcome}</p>
            <div class="strategy-numbers"><span>Budget <strong>{money(scenario.budgetAmount)}</strong></span><span>Capacity <strong>{scenario.capacityAmount ?? '—'}</strong></span></div>
            {#if scenario.baseScenarioTitle}<small>Compared with: {scenario.baseScenarioTitle}</small>{/if}
          </article>
        {:else}<p class="information-empty">No scenarios.</p>{/each}
      </section>
    </div>

    <div class="function-workspace-grid strategy-secondary-grid">
      <section class="workspace-panel">
        <div class="panel-heading"><div><p class="app-eyebrow">Enterprise planning</p><h2>Plans &amp; Forecasts</h2></div><span>{strategy.plans.length}</span></div>
        {#each strategy.plans as plan}
          <article class="strategy-card">
            <header><div><span>{plan.code}</span><strong>{plan.title}</strong></div><small>{plan.planType.replaceAll('_',' ')} · {plan.status}</small></header>
            <p>{plan.description}</p>
            <div class="strategy-numbers"><span>Target <strong>{money(plan.targetAmount)}</strong></span><span>Forecast <strong>{money(plan.forecastAmount)}</strong></span><span>Actual <strong>{money(plan.actualAmount)}</strong></span></div>
          </article>
        {:else}<p class="information-empty">No plans or forecasts.</p>{/each}
      </section>

      <section class="workspace-panel">
        <div class="panel-heading"><div><p class="app-eyebrow">Value realisation</p><h2>Outcomes &amp; Analysis</h2></div><span>{strategy.outcomes.length + strategy.analyses.length}</span></div>
        {#each strategy.outcomes as outcome}
          <article class="strategy-card">
            <header><div><span>{outcome.initiativeTitle}</span><strong>{outcome.title}</strong></div><small>{outcome.status}</small></header>
            <p>{outcome.measure}: {outcome.actualValue ?? '—'} / {outcome.targetValue ?? '—'} · realised value {money(outcome.realisedValue)}</p>
          </article>
        {/each}
        {#each strategy.analyses as analysis}
          <article class="strategy-card analysis-card">
            <header><div><span>Management analysis</span><strong>{analysis.title}</strong></div><small>{analysis.status}</small></header>
            <p>{analysis.summary}</p>
            <small>{analysis.planTitle ?? analysis.scenarioTitle ?? analysis.outcomeTitle ?? ''}</small>
          </article>
        {/each}
        {#if strategy.outcomes.length===0 && strategy.analyses.length===0}<p class="information-empty">No outcomes or management analysis.</p>{/if}
      </section>
    </div>
  {/if}

{:else}
  <section class="function-workspace-header redesigned">
    <div>
      <a class="function-back-link" href="/app/functions">← All Functions</a>
      <div class="function-title-line">
        <span class="function-code large">{workspace.code}</span>
        <p class="app-eyebrow">Enterprise Function</p>
      </div>
      <h1>{workspace.name}</h1>
      <p class="workspace-lede">
        Work within the governed scope of {workspace.name.toLowerCase()}, using shared NuBlox
        information, workflow, responsibility, Decision, evidence and delivery controls.
      </p>
    </div>

    <dl class="workspace-stat-block">
      <div><dt>Sub-functions</dt><dd>{workspace.subfunctionCount}</dd></div>
      <div><dt>Activities</dt><dd>{workspace.activityCount}</dd></div>
    </dl>
  </section>

  <div class="function-workspace-grid">
    <section class="workspace-panel function-scope-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">Work scope</p><h2>Sub-functions &amp; activities</h2></div><span>{workspace.subfunctions.length}</span></div>
      <div class="subfunction-list">
        {#each workspace.subfunctions as subfunction}
          <details>
            <summary><div><span class="subfunction-code">{subfunction.code}</span><strong>{subfunction.name}</strong></div><span class="subfunction-count">{subfunction.activities.length} activities</span></summary>
            <div class="subfunction-detail redesigned">
              <div><h3>Activities</h3><ol class="activity-list">{#each subfunction.activities as activity, index}<li><span>{String(index + 1).padStart(2, '0')}</span><strong>{activity}</strong></li>{/each}</ol></div>
              <div><h3>Supporting capabilities</h3><div class="subfunction-engines">{#each subfunction.engineNames as engineName, index}<span><strong>{subfunction.engineIds[index]}</strong>{engineName}</span>{/each}</div></div>
            </div>
          </details>
        {/each}
      </div>
    </section>

    <aside class="workspace-panel function-tools-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">Native capabilities</p><h2>Available in this Function</h2></div></div>
      <div class="engine-list compact-engine-list">
        {#each workspace.engines as engine}
          <article><div><span class="engine-id">{engine.id}</span><h3>{engine.name}</h3></div><span class="engine-state">{engineStateLabel(engine.state)}</span></article>
        {/each}
      </div>
      <div class="function-shared-controls"><h3>Shared controls</h3><p>Responsibility, access, workflow, lifecycle, Decision, evidence, information, change and audit remain in context across the Function.</p></div>
    </aside>
  </div>
{/if}
