<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
  const workspace = $derived(data.workspace);

  function cleanPurpose(value: string) {
    return value || 'Professional capability and delivery within this Construction & Built Environment domain.';
  }
</script>

<svelte:head>
  <title>{workspace?.domain.code ?? 'CBE'} {workspace?.domain.name ?? 'Domain'} — NuBlox</title>
</svelte:head>

{#if !data.allowed || !workspace}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit this CBE Domain.</h1>
      <p>{data.reason}</p>
      <div class="permission-actions">
        <a class="primary-action permission-back" href="/app/request-access?permission=platform.industry_delivery.read&returnTo=/app/domains">
          Request access <span aria-hidden="true">→</span>
        </a>
        <a class="quiet-link" href="/app/domains">Back to CBE Domains</a>
      </div>
    </div>
  </section>
{:else}
  <section class="function-workspace-header redesigned">
    <div>
      <a class="function-back-link" href="/app/domains">← All CBE Domains</a>
      <div class="function-title-line">
        <span class="function-code large">{workspace.domain.code}</span>
        <p class="app-eyebrow">CBE Professional Domain</p>
      </div>
      <h1>{workspace.domain.name}</h1>
      <p class="workspace-lede">{cleanPurpose(workspace.domain.purpose)}</p>
    </div>
    <dl class="workspace-stat-block">
      <div><dt>Job Profiles</dt><dd>{workspace.totals.jobs}</dd></div>
      <div><dt>Internal</dt><dd>{workspace.totals.internalCapabilities}</dd></div>
    </dl>
  </section>

  <nav class="workspace-tabs" aria-label="Domain workspace views">
    {#each [
      ['overview', 'Overview'],
      ['governance', 'Governance'],
      ['delivery', 'Delivery'],
      ['performance', 'Performance'],
      ['records', 'Records']
    ] as item}
      <a class:active={workspace.view === item[0]} aria-current={workspace.view === item[0] ? 'page' : undefined}
        href={`?view=${item[0]}`}>{item[1]}</a>
    {/each}
  </nav>

  {#if workspace.view === 'overview'}
    <section class="architecture-metrics delivery-metrics" aria-label="Domain summary">
      <article><span>Job Profiles</span><strong>{workspace.totals.jobs}</strong><p>Governed professional roles in this Domain</p></article>
      <article><span>Internal capability</span><strong>{workspace.totals.internalCapabilities}</strong><p>Professions declared internally available</p></article>
      <article><span>Governance roles</span><strong>{workspace.totals.governanceDeployments}</strong><p>Roles governing how the Domain operates</p></article>
      <article><span>Delivery roles</span><strong>{workspace.totals.deliveryDeployments}</strong><p>Roles performing professional delivery</p></article>
    </section>

    <section class="workspace-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">Professional scope</p><h2>Job Profiles</h2></div><span>{workspace.jobs.length}</span></div>
      <div class="domain-job-list">
        {#each workspace.jobs as job}
          <article><span>{job.jobCode}</span><strong>{job.canonicalName}</strong><small>{job.jobName}</small></article>
        {/each}
      </div>
    </section>
  {:else if workspace.view === 'governance'}
    <section class="workspace-two-column capability-operating-view">
      <section class="workspace-panel">
        <div class="panel-heading"><div><p class="app-eyebrow">Domain governance</p><h2>Govern how this profession operates</h2></div></div>
        <div class="governance-capability-grid">
          <article><strong>Standards &amp; methods</strong><p>Define the professional standards, methods, procedures and templates used by the Domain.</p><a href="/app/information">Controlled information →</a></article>
          <article><strong>Competence</strong><p>Define the competence and evidence required for people performing governed professional work.</p><a href="/app/competence">Competence →</a></article>
          <article><strong>Authority &amp; assurance</strong><p>Control review, checking, approval, assurance and decision rights.</p><a href="/app/control">Control →</a></article>
          <article><strong>Deployment</strong><p>Assign accountable and responsible professional roles into tenant, project and delivery contexts.</p><a href="/app/delivery">CBE capability administration →</a></article>
        </div>
      </section>

      <section class="workspace-panel">
        <div class="panel-heading"><div><p class="app-eyebrow">Deployed governance</p><h2>Governance roles</h2></div><span>{workspace.governanceDeployments.length}</span></div>
        <div class="workspace-register-list">
          {#each workspace.governanceDeployments as deployment}
            <article><div><strong>{deployment.roleTitle}</strong><span>{deployment.canonicalName} · {deployment.assigneeName}</span></div><small>{deployment.responsibilityRole} · {deployment.contextType}</small></article>
          {:else}
            <p class="information-empty">No Domain governance roles are currently deployed.</p>
          {/each}
        </div>
      </section>
    </section>
  {:else if workspace.view === 'delivery'}
    <section class="architecture-metrics delivery-metrics">
      <article><span>Delivery roles</span><strong>{workspace.totals.deliveryDeployments}</strong><p>People or Positions deployed to perform Domain work</p></article>
      <article><span>Services</span><strong>{workspace.totals.services}</strong><p>Configured service offerings in this Domain</p></article>
      <article><span>Capability demand</span><strong>{workspace.requirements.length}</strong><p>Professional requirements raised in delivery contexts</p></article>
      <article><span>Sourcing gaps</span><strong>{workspace.totals.sourcingGaps}</strong><p>Requirements with remaining supply to secure</p></article>
    </section>

    <div class="function-workspace-grid">
      <section class="workspace-panel">
        <div class="panel-heading"><div><p class="app-eyebrow">Professional delivery</p><h2>Deployed delivery roles</h2></div><span>{workspace.deliveryDeployments.length}</span></div>
        <div class="workspace-register-list">
          {#each workspace.deliveryDeployments as deployment}
            <article><div><strong>{deployment.roleTitle}</strong><span>{deployment.canonicalName} · {deployment.assigneeName}</span></div><small>{deployment.contextType} · {deployment.responsibilityRole}{deployment.capacityPercent !== undefined ? ` · ${deployment.capacityPercent}%` : ''}</small></article>
          {:else}
            <p class="information-empty">No professional delivery roles are currently deployed.</p>
          {/each}
        </div>
      </section>

      <section class="workspace-panel">
        <div class="panel-heading"><div><p class="app-eyebrow">Delivery demand</p><h2>Services &amp; requirements</h2></div><span>{workspace.requirements.length}</span></div>
        <div class="workspace-register-list">
          {#each workspace.services as service}
            <article><div><strong>{service.code} · {service.name}</strong><span>{service.description}</span></div><small>{service.status}</small></article>
          {/each}
          {#each workspace.requirements as requirement}
            <article><div><strong>{requirement.contextCode} · {requirement.canonicalName}</strong><span>{requirement.description}</span></div><small>{requirement.fulfilledPercent}% fulfilled</small></article>
          {/each}
          {#if workspace.services.length === 0 && workspace.requirements.length === 0}
            <p class="information-empty">No Services or professional capability requirements are configured for this Domain.</p>
          {/if}
        </div>
      </section>
    </div>

    <div class="workspace-action-row"><a class="primary-action" href="/app/delivery">Manage professional capability <span>→</span></a></div>
  {:else if workspace.view === 'performance'}
    <section class="architecture-metrics delivery-metrics">
      <article><span>Capability coverage</span><strong>{workspace.totals.internalCapabilities}/{workspace.totals.jobs}</strong><p>Internal professions against governed Job Profiles</p></article>
      <article><span>Governance roles</span><strong>{workspace.totals.governanceDeployments}</strong><p>Current Domain governance deployments</p></article>
      <article><span>Delivery roles</span><strong>{workspace.totals.deliveryDeployments}</strong><p>Current professional delivery deployments</p></article>
      <article><span>Open sourcing gaps</span><strong>{workspace.totals.sourcingGaps}</strong><p>Delivery requirements not yet fully supplied</p></article>
    </section>
    <section class="workspace-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">Performance model</p><h2>Measure capability and delivery outcomes</h2></div></div>
      <div class="governance-capability-grid">
        <article><strong>Capability</strong><p>Coverage, competence, capacity, availability and utilisation.</p></article>
        <article><strong>Work</strong><p>Assignment, progress, due dates, review and acceptance.</p></article>
        <article><strong>Outputs</strong><p>Deliverable quality, rework, defects, issue and acceptance performance.</p></article>
        <article><strong>Improvement</strong><p>Assurance findings, lessons learned and governed corrective action.</p></article>
      </div>
    </section>
  {:else}
    <section class="workspace-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">Domain records</p><h2>Governed work products and evidence</h2></div></div>
      <div class="governance-capability-grid">
        <article><strong>Information</strong><p>Models, drawings, specifications, reports and other controlled professional information.</p><a href="/app/information">Open Information →</a></article>
        <article><strong>Deliverables</strong><p>Required outputs, review, issue, response and acceptance.</p><a href="/app/deliverables">Open Deliverables →</a></article>
        <article><strong>Change &amp; configuration</strong><p>Controlled change, baselines, configuration and effectivity.</p><a href="/app/configuration">Open Change &amp; configuration →</a></article>
        <article><strong>Evidence &amp; decisions</strong><p>Review, approval, assurance, decisions and attributable evidence.</p><a href="/app/control">Open Control →</a></article>
      </div>
    </section>
  {/if}
{/if}
