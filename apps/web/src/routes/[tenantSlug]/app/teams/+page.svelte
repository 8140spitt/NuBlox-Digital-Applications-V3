<script lang="ts">
  import { functionGroups, functions, functionsForGroup } from '$lib/function-catalog';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const contextQuery = $derived(data.selectedContext ? encodeURIComponent(data.selectedContext.key) : 'tenant');

  function functionMembers(code: string, purpose: 'FUNCTIONAL_GOVERNANCE' | 'FUNCTIONAL_DELIVERY') {
    return data.functionalDeployments
      .filter((item) => item.functionCode === code && item.deploymentPurpose === purpose)
      .reduce((sum, item) => sum + item.assignments.filter((assignment) => assignment.status === 'ACTIVE').length, 0);
  }

  function domainMembers(name: string, purpose: 'FUNCTIONAL_GOVERNANCE' | 'FUNCTIONAL_DELIVERY') {
    return data.domainDeployments.filter(
      (item) => item.domainName === name && item.deploymentPurpose === purpose && item.status === 'ACTIVE'
    ).length;
  }
</script>

<svelte:head>
  <title>Teams — NuBlox</title>
  <meta name="description" content="Core Function and professional Domain Teams within the current context" />
</svelte:head>

{#if !data.selectedContext}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Context unavailable</p>
      <h1>No operating context is available.</h1>
      <a class="quiet-link" href="/app">Back Home</a>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact team-directory-hero">
    <div>
      <p class="app-eyebrow">Teams · {data.selectedContext.kind.replaceAll('_', ' ')}</p>
      <h1>{data.selectedContext.name}</h1>
      <p class="workspace-lede">
        The 29 Core Functions and 16 CBE professional Domains operate here as Teams. Each Team has a Governance side
        and a Delivery side, with Positions and People providing the actual organisational capability.
      </p>
    </div>
  </section>

  <section class="context-switcher">
    <div>
      <span>Current context</span>
      <strong>{data.selectedContext.pathLabel}</strong>
    </div>
    <form method="GET">
      <label>
        <span class="sr-only">Choose context</span>
        <select name="context">
          {#each data.contextOptions as option}
            <option value={option.key} selected={option.key === data.selectedContext.key}>{option.pathLabel}</option>
          {/each}
        </select>
      </label>
      <button type="submit">Change context</button>
    </form>
    <a href="/app/contexts">Browse hierarchy →</a>
  </section>

  <section class="directory-summary" aria-label="Team coverage">
    <span><strong>{functions.length}</strong> Core Function Teams</span>
    <span><strong>{data.deliveryDomains.length}</strong> Professional Domain Teams</span>
    <span><strong>{data.functionalDeployments.length + data.domainDeployments.length}</strong> active team assignment records</span>
  </section>

  <section class="workspace-section">
    <header class="workspace-section-heading">
      <div>
        <p class="app-eyebrow">How the organisation operates</p>
        <h2>Core Function Teams</h2>
      </div>
      <p>Every organisational context receives the same canonical F01–F29 capability structure; local Positions, People, governance and work make the Team real in this context.</p>
    </header>

    <div class="function-directory compact-directory">
      {#each functionGroups as group}
        <section class="function-group-card">
          <header>
            <h3>{group.name}</h3>
            <span>{group.functionCodes.length} Teams</span>
          </header>
          <div class="function-card-grid">
            {#each functionsForGroup(group.id) as fn}
              <a class="function-card" href={`/app/teams/${fn.code.toLowerCase()}?context=${contextQuery}`}>
                <div class="function-card-topline">
                  <span class="function-code">{fn.code}</span>
                  <span class="function-arrow" aria-hidden="true">→</span>
                </div>
                <strong>{fn.name}</strong>
                <div class="function-card-meta">
                  <span>{functionMembers(fn.code, 'FUNCTIONAL_GOVERNANCE')} governance</span>
                  <span>{functionMembers(fn.code, 'FUNCTIONAL_DELIVERY')} delivery</span>
                  <span>{fn.subfunctionCount} L2</span>
                </div>
              </a>
            {/each}
          </div>
        </section>
      {/each}
    </div>
  </section>

  <section class="workspace-section">
    <header class="workspace-section-heading">
      <div>
        <p class="app-eyebrow">What professional work the organisation delivers</p>
        <h2>CBE Professional Domain Teams</h2>
      </div>
      <p>The D01–D16 Teams organise construction and built-environment professions and the Job Profiles that deliver technical, commercial and asset work.</p>
    </header>

    {#if data.domainAllowed}
      <div class="domain-directory">
        {#each data.deliveryDomains as domain}
          {@const jobs = data.jobProfiles.filter((profile) => profile.primaryDeliveryDomainId === domain.id)}
          <a class="domain-directory-card" href={`/app/teams/${domain.code.toLowerCase()}?context=${contextQuery}`}>
            <div class="function-card-topline">
              <span class="function-code">{domain.code}</span>
              <span class="function-arrow" aria-hidden="true">→</span>
            </div>
            <strong>{domain.name}</strong>
            <p>{domain.purpose}</p>
            <div class="function-card-meta">
              <span>{domainMembers(domain.name, 'FUNCTIONAL_GOVERNANCE')} governance</span>
              <span>{domainMembers(domain.name, 'FUNCTIONAL_DELIVERY')} delivery</span>
              <span>{jobs.length} Job Profiles</span>
            </div>
          </a>
        {/each}
      </div>
    {:else}
      <div class="information-empty">Professional Domain Team information is permission controlled for the current role.</div>
    {/if}
  </section>
{/if}
