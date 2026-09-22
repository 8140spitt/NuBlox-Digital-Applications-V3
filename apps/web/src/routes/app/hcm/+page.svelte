<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();

  const functionalGovernance = $derived(
    data.functional?.deployments.filter((item) => item.deploymentPurpose === 'FUNCTIONAL_GOVERNANCE').length ?? 0
  );
  const functionalDelivery = $derived(
    data.functional?.deployments.filter((item) => item.deploymentPurpose === 'FUNCTIONAL_DELIVERY').length ?? 0
  );
  const domainGovernance = $derived(data.domains?.totals.governanceDeployments ?? 0);
  const domainDelivery = $derived(data.domains?.totals.deliveryDeployments ?? 0);
</script>

<svelte:head>
  <title>HCM Position Management — NuBlox</title>
  <meta name="description" content="People, positions, occupancy and capability deployment" />
</svelte:head>

{#if !data.allowed}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit HCM Position Management.</h1>
      <p>Position, workforce and deployment information is permission controlled in the current tenant.</p>
      <div class="permission-actions">
        <a class="primary-action permission-back" href="/app/request-access?permission=platform.organisation.read&returnTo=/app/hcm">
          Request access <span aria-hidden="true">→</span>
        </a>
        <a class="quiet-link" href="/app">Back Home</a>
      </div>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact">
    <div>
      <p class="app-eyebrow">F15 · Human Resources / Human Capital</p>
      <h1>Position Management</h1>
      <p class="workspace-lede">
        Manage organisational Positions and their occupants, then deploy that workforce into an enterprise Function
        or CBE professional Domain for either Governance or Delivery.
      </p>
    </div>
  </section>

  <section class="architecture-metrics delivery-metrics" aria-label="Position and deployment totals">
    <article>
      <span>Positions</span>
      <strong>{data.structure?.totals.positions ?? '—'}</strong>
      <p>{data.structure ? `${data.structure.totals.occupiedPositions} occupied` : 'Organisation access required'}</p>
    </article>
    <article>
      <span>People</span>
      <strong>{data.structure?.totals.people ?? '—'}</strong>
      <p>Current tenant workforce records</p>
    </article>
    <article>
      <span>Governance deployments</span>
      <strong>{functionalGovernance + domainGovernance}</strong>
      <p>{functionalGovernance} Function · {domainGovernance} CBE Domain</p>
    </article>
    <article>
      <span>Delivery deployments</span>
      <strong>{functionalDelivery + domainDelivery}</strong>
      <p>{functionalDelivery} Function · {domainDelivery} CBE Domain</p>
    </article>
  </section>

  <section class="workspace-panel">
    <div class="panel-heading">
      <div>
        <p class="app-eyebrow">HCM operating model</p>
        <h2>Employment Position → Capability Deployment</h2>
      </div>
    </div>
    <div class="governance-capability-grid">
      <article>
        <strong>1. Position &amp; occupant</strong>
        <p>Create the organisational Position, associate its Job Profile and assign the employed Person through an effective Position occupancy.</p>
        <a href="/app/organisation">Manage organisation &amp; positions →</a>
      </article>
      <article>
        <strong>2. Choose capability</strong>
        <p>Deploy the Person, Position or appropriate organisational capacity into an enterprise Function or CBE professional Domain.</p>
      </article>
      <article>
        <strong>3. Choose purpose</strong>
        <p>Every deployment is explicitly <b>Governance</b> or <b>Delivery</b>. This belongs to the deployment, not permanently to the Person or Job Profile.</p>
      </article>
      <article>
        <strong>4. Set operating context</strong>
        <p>Set responsibility, scope, capacity, effectivity and the tenant, organisation, Project, Contract, Package, Site, Asset or Service context.</p>
      </article>
    </div>
  </section>

  <div class="function-workspace-grid">
    <section class="workspace-panel">
      <div class="panel-heading">
        <div><p class="app-eyebrow">Enterprise Functions</p><h2>Function deployments</h2></div>
        <span>{data.functional?.deployments.length ?? 0}</span>
      </div>
      {#if data.functionalAllowed && data.functional}
        <div class="workspace-register-list">
          {#each data.functional.deployments.slice(0, 12) as deployment}
            <article>
              <div>
                <strong>{deployment.functionCode} · {deployment.functionName}</strong>
                <span>{deployment.scopeDescription}</span>
              </div>
              <small>{deployment.deploymentPurpose === 'FUNCTIONAL_GOVERNANCE' ? 'Governance' : 'Delivery'} · {deployment.assignments.length} assignment(s)</small>
            </article>
          {:else}
            <p class="information-empty">No Function deployments have been created.</p>
          {/each}
        </div>
        <div class="hcm-panel-action"><a class="primary-action" href="/app/deployments">Manage Function deployments <span>→</span></a></div>
      {:else}
        <p class="information-empty">Function deployment access is not available to the current role.</p>
      {/if}
    </section>

    <section class="workspace-panel">
      <div class="panel-heading">
        <div><p class="app-eyebrow">CBE Professional Domains</p><h2>Domain deployments</h2></div>
        <span>{data.domains?.disciplineDeployments.length ?? 0}</span>
      </div>
      {#if data.domainAllowed && data.domains}
        <div class="workspace-register-list">
          {#each data.domains.disciplineDeployments.slice(0, 12) as deployment}
            <article>
              <div>
                <strong>{deployment.domainName} · {deployment.roleTitle}</strong>
                <span>{deployment.canonicalName} · {deployment.assigneeName}</span>
              </div>
              <small>{deployment.deploymentPurpose === 'FUNCTIONAL_GOVERNANCE' ? 'Governance' : 'Delivery'} · {deployment.contextType}</small>
            </article>
          {:else}
            <p class="information-empty">No CBE Domain deployments have been created.</p>
          {/each}
        </div>
        <div class="hcm-panel-action"><a class="primary-action" href="/app/delivery">Manage CBE Domain deployments <span>→</span></a></div>
      {:else}
        <p class="information-empty">CBE Domain deployment access is not available to the current role.</p>
      {/if}
    </section>
  </div>

  <section class="workspace-panel">
    <div class="panel-heading">
      <div><p class="app-eyebrow">Position state</p><h2>Current Positions &amp; occupants</h2></div>
      <span>{data.structure?.totals.positions ?? 0}</span>
    </div>
    {#if data.organisationAllowed && data.structure}
      <div class="workspace-register-list">
        {#each data.structure.organisations as organisation}
          {#each organisation.units as unit}
            {#each unit.positions as position}
              <article>
                <div>
                  <strong>{position.code} · {position.title}</strong>
                  <span>{organisation.tradingName ?? organisation.legalName} · {unit.code} · {position.jobProfileName ?? 'No Job Profile'}</span>
                </div>
                <small>
                  {position.occupants.length
                    ? position.occupants.map((occupant) => occupant.personName).join(', ')
                    : 'Vacant'}
                </small>
              </article>
            {/each}
          {/each}
        {/each}
      </div>
    {:else}
      <p class="information-empty">Organisation and Position access is not available to the current role.</p>
    {/if}
  </section>
{/if}
