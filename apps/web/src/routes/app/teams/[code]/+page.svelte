<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const team = $derived(data.allowed ? data.team : null);
  const selectedContext = $derived(data.allowed ? data.selectedContext : null);
  const contextQuery = $derived(selectedContext ? encodeURIComponent(selectedContext.key) : 'tenant');

  function viewHref(view: string) {
    return `?context=${contextQuery}&view=${view}`;
  }
</script>

<svelte:head>
  <title>{data.allowed && team ? `${team.code} ${team.name} — NuBlox` : 'Team — NuBlox'}</title>
</svelte:head>

{#if !data.allowed || !team || !selectedContext}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit this Team workspace.</h1>
      <p>{data.reason}</p>
      <a class="quiet-link" href="/app/teams">Back to Teams</a>
    </div>
  </section>
{:else}
  <section class="function-workspace-header redesigned team-workspace-header">
    <div>
      <a class="function-back-link" href={`/app/teams?context=${contextQuery}`}>← All Teams in {selectedContext.name}</a>
      <div class="function-title-line">
        <span class="function-code large">{team.code}</span>
        <p class="app-eyebrow">{data.kind === 'CORE_FUNCTION' ? 'Core Function Team' : 'Professional Domain Team'}</p>
      </div>
      <h1>{team.name}</h1>
      <p class="workspace-lede">{team.purpose}</p>
    </div>
    <dl class="workspace-stat-block">
      <div><dt>Context</dt><dd>{selectedContext.name}</dd></div>
      <div><dt>Governance</dt><dd>{data.governanceMembers.length}</dd></div>
      <div><dt>Delivery</dt><dd>{data.deliveryMembers.length}</dd></div>
      <div><dt>{data.kind === 'CORE_FUNCTION' ? 'L2 scope' : 'Job Profiles'}</dt><dd>{data.kind === 'CORE_FUNCTION' ? team.subfunctions.length : team.jobs.length}</dd></div>
    </dl>
  </section>

  <section class="team-context-strip">
    <div>
      <span>Operating context</span>
      <strong>{selectedContext.pathLabel}</strong>
    </div>
    <a href="/app/contexts">Change context →</a>
  </section>

  <nav class="workspace-tabs" aria-label="Team workspace views">
    <a class:active={data.view === 'overview'} href={viewHref('overview')}>Overview</a>
    <a class:active={data.view === 'governance'} href={viewHref('governance')}>Governance</a>
    <a class:active={data.view === 'delivery'} href={viewHref('delivery')}>Delivery</a>
    <a class:active={data.view === 'people'} href={viewHref('people')}>People</a>
    <a class:active={data.view === 'performance'} href={viewHref('performance')}>Performance</a>
    <a class:active={data.view === 'records'} href={viewHref('records')}>Records</a>
  </nav>

  {#if data.view === 'overview'}
    <section class="architecture-metrics delivery-metrics">
      <article><span>Governance positions / people</span><strong>{data.governanceMembers.length}</strong><p>Accountability, control and assurance</p></article>
      <article><span>Delivery positions / people</span><strong>{data.deliveryMembers.length}</strong><p>People performing the Team's work</p></article>
      <article><span>{data.kind === 'CORE_FUNCTION' ? 'Sub-functions' : 'Job Profiles'}</span><strong>{data.kind === 'CORE_FUNCTION' ? team.subfunctions.length : team.jobs.length}</strong><p>Canonical capability scope</p></article>
      <article><span>Operating model</span><strong>G+D</strong><p>One Team with Governance and Delivery</p></article>
    </section>

    <div class="function-workspace-grid">
      <section class="workspace-panel">
        <div class="panel-heading"><div><p class="app-eyebrow">Team identity</p><h2>One capability in one Context</h2></div></div>
        <div class="governance-capability-grid">
          <article><strong>Context</strong><p>{selectedContext.pathLabel}</p></article>
          <article><strong>Team type</strong><p>{data.kind === 'CORE_FUNCTION' ? 'Canonical Core Function Team' : 'CBE Professional Domain Team'}</p></article>
          <article><strong>Governance</strong><p>How this Team is mandated, controlled, assured and improved in this Context.</p></article>
          <article><strong>Delivery</strong><p>The operational or professional work this Team performs and the work products it creates.</p></article>
        </div>
      </section>

      <aside class="workspace-panel">
        <div class="panel-heading"><div><p class="app-eyebrow">People</p><h2>Current Team shape</h2></div></div>
        <div class="team-member-summary">
          <div><strong>{data.governanceMembers.length}</strong><span>Governance</span></div>
          <div><strong>{data.deliveryMembers.length}</strong><span>Delivery</span></div>
        </div>
        <a class="primary-action" href="/app/hcm">Open Position Management <span>→</span></a>
      </aside>
    </div>

  {:else if data.view === 'governance'}
    <section class="workspace-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">Governance</p><h2>How {team.name} operates here</h2></div></div>
      <div class="governance-capability-grid">
        <article><strong>Mandate &amp; scope</strong><p>Purpose, boundaries, accountability and locally effective responsibilities.</p></article>
        <article><strong>Policy, standards &amp; methods</strong><p>Inherited and local controlled information that governs Team delivery.</p><a href="/app/information">Controlled information →</a></article>
        <article><strong>Authority, control &amp; assurance</strong><p>Decision rights, lifecycle, review, approval, evidence and segregation of duties.</p><a href="/app/control">Control →</a></article>
        <article><strong>Competence</strong><p>Requirements and evidence for Positions and People performing governed work.</p><a href="/app/competence">Competence →</a></article>
      </div>
    </section>

    <section class="workspace-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">Governance Team</p><h2>Accountable Positions &amp; People</h2></div><span>{data.governanceMembers.length}</span></div>
      <div class="workspace-register-list">
        {#each data.governanceMembers as member}
          <article>
            <div><strong>{member.label}</strong><span>{member.jobProfileName ?? member.assigneeType} · {member.scope}</span></div>
            <small>{member.role}{member.capacityPercent ? ` · ${member.capacityPercent}%` : ''}</small>
          </article>
        {:else}
          <p class="information-empty">No Governance membership is assigned in this Context yet.</p>
        {/each}
      </div>
    </section>

  {:else if data.view === 'delivery'}
    <section class="workspace-panel">
      <div class="panel-heading">
        <div><p class="app-eyebrow">Delivery</p><h2>Work performed by {team.name}</h2></div>
        <span>{data.kind === 'CORE_FUNCTION' ? team.subfunctions.length : team.jobs.length}</span>
      </div>

      {#if data.kind === 'CORE_FUNCTION'}
        <div class="subfunction-list">
          {#each team.subfunctions as subfunction}
            <details>
              <summary>
                <div><span class="subfunction-code">{subfunction.code}</span><strong>{subfunction.name}</strong></div>
                <span class="subfunction-count">{subfunction.activities.length} activities</span>
              </summary>
              <div class="subfunction-detail redesigned">
                <div><h3>Activities</h3><ol class="activity-list">{#each subfunction.activities as activity, index}<li><span>{String(index + 1).padStart(2, '0')}</span><strong>{activity}</strong></li>{/each}</ol></div>
              </div>
            </details>
          {/each}
        </div>
      {:else}
        <div class="domain-job-list">
          {#each team.jobs as job}
            <article><span>{job.jobCode}</span><strong>{job.canonicalName}</strong><small>{job.jobName}</small></article>
          {/each}
        </div>
      {/if}
    </section>

    <section class="workspace-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">Delivery Team</p><h2>Positions &amp; People performing the work</h2></div><span>{data.deliveryMembers.length}</span></div>
      <div class="workspace-register-list">
        {#each data.deliveryMembers as member}
          <article>
            <div><strong>{member.label}</strong><span>{member.jobProfileName ?? member.assigneeType} · {member.scope}</span></div>
            <small>{member.role}{member.capacityPercent ? ` · ${member.capacityPercent}%` : ''}</small>
          </article>
        {:else}
          <p class="information-empty">No Delivery membership is assigned in this Context yet.</p>
        {/each}
      </div>
    </section>

  {:else if data.view === 'people'}
    <div class="function-workspace-grid">
      <section class="workspace-panel">
        <div class="panel-heading"><div><p class="app-eyebrow">Governance</p><h2>Governance Positions &amp; People</h2></div><span>{data.governanceMembers.length}</span></div>
        <div class="workspace-register-list">
          {#each data.governanceMembers as member}
            <article><div><strong>{member.label}</strong><span>{member.jobProfileName ?? member.assigneeType}</span></div><small>{member.role}</small></article>
          {:else}<p class="information-empty">No Governance membership assigned.</p>{/each}
        </div>
      </section>
      <section class="workspace-panel">
        <div class="panel-heading"><div><p class="app-eyebrow">Delivery</p><h2>Delivery Positions &amp; People</h2></div><span>{data.deliveryMembers.length}</span></div>
        <div class="workspace-register-list">
          {#each data.deliveryMembers as member}
            <article><div><strong>{member.label}</strong><span>{member.jobProfileName ?? member.assigneeType}</span></div><small>{member.role}</small></article>
          {:else}<p class="information-empty">No Delivery membership assigned.</p>{/each}
        </div>
      </section>
    </div>
    <section class="workspace-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">HCM authority</p><h2>Positions and occupancy remain HCM-owned</h2></div></div>
      <p class="workspace-lede">The Team consumes Position and occupancy state. HCM remains the administrative authority for organisational structure, Positions and People.</p>
      <a class="primary-action" href="/app/hcm">Open HCM &amp; Position Management <span>→</span></a>
    </section>

  {:else if data.view === 'performance'}
    <section class="architecture-metrics delivery-metrics">
      <article><span>Governance membership</span><strong>{data.governanceMembers.length}</strong><p>Current accountability capacity</p></article>
      <article><span>Delivery membership</span><strong>{data.deliveryMembers.length}</strong><p>Current execution capacity</p></article>
      <article><span>Capability scope</span><strong>{data.kind === 'CORE_FUNCTION' ? team.subfunctions.length : team.jobs.length}</strong><p>{data.kind === 'CORE_FUNCTION' ? 'L2 sub-functions' : 'Job Profiles'}</p></article>
      <article><span>Context</span><strong>1</strong><p>{selectedContext.name}</p></article>
    </section>
    <section class="workspace-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">Performance</p><h2>Measure Team outcomes</h2></div></div>
      <div class="governance-capability-grid">
        <article><strong>Work</strong><p>Demand, backlog, cycle time, due dates, service level and throughput.</p></article>
        <article><strong>Control</strong><p>Exceptions, approvals, findings, actions and control effectiveness.</p></article>
        <article><strong>Outputs</strong><p>Quality, acceptance, rework, defects and handoff performance.</p></article>
        <article><strong>Capacity</strong><p>Position occupancy, Team capacity, competence coverage and constrained capability.</p></article>
      </div>
    </section>

  {:else}
    <section class="workspace-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">Records</p><h2>Governed work products and evidence</h2></div></div>
      <div class="governance-capability-grid">
        <article><strong>Information</strong><p>Controlled documents, data, revisions and issued information.</p><a href="/app/information">Open Information →</a></article>
        <article><strong>Deliverables</strong><p>Required outputs, review, issue, response and acceptance.</p><a href="/app/deliverables">Open Deliverables →</a></article>
        <article><strong>Change &amp; configuration</strong><p>Controlled change, baselines, configuration and effectivity.</p><a href="/app/configuration">Open Change &amp; configuration →</a></article>
        <article><strong>Decision &amp; evidence</strong><p>Authority, review, approval and attributable audit evidence.</p><a href="/app/control">Open Control →</a></article>
      </div>
    </section>
  {/if}
{/if}
