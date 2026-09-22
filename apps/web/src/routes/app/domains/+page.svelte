<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>CBE Domains — NuBlox</title>
  <meta name="description" content="Construction & Built Environment professional domains" />
</svelte:head>

{#if !data.allowed || !data.projection}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit CBE Domain access.</h1>
      <p>{data.reason}</p>
      <div class="permission-actions">
        <a class="primary-action permission-back" href="/app/request-access?permission=platform.industry_delivery.read&returnTo=/app/domains">
          Request access <span aria-hidden="true">→</span>
        </a>
        <a class="quiet-link" href="/app">Back Home</a>
      </div>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact function-directory-hero">
    <div>
      <p class="app-eyebrow">Construction &amp; Built Environment</p>
      <h1>Professional Domains</h1>
      <p class="workspace-lede">
        Choose a CBE Domain to govern the professional capability or deliver the work performed by its Job Profiles.
      </p>
    </div>
    <a class="primary-action" href="/app/delivery">Capability administration <span aria-hidden="true">→</span></a>
  </section>

  <section class="directory-summary" aria-label="CBE domain coverage">
    <span><strong>{data.projection.deliveryDomains.length}</strong> Domains</span>
    <span><strong>{data.projection.jobProfiles.length}</strong> Job Profiles</span>
    <span><strong>{data.projection.totals.internalCapabilities}</strong> Internal professions</span>
  </section>

  <section class="domain-directory">
    {#each data.projection.deliveryDomains as domain}
      {@const jobs = data.projection.jobProfiles.filter((profile) => profile.primaryDeliveryDomainId === domain.id)}
      {@const capabilities = data.projection.internalCapabilities.filter((capability) => capability.primaryDeliveryDomainId === domain.id)}
      {@const deployments = data.projection.disciplineDeployments.filter((deployment) => deployment.domainName === domain.name)}
      <a class="domain-directory-card" href={`/app/domains/${domain.code.toLowerCase()}`}>
        <div class="function-card-topline">
          <span class="function-code">{domain.code}</span>
          <span class="function-arrow" aria-hidden="true">→</span>
        </div>
        <strong>{domain.name}</strong>
        <p>{domain.purpose}</p>
        <div class="function-card-meta">
          <span>{jobs.length} jobs</span>
          <span>{capabilities.length} internal</span>
          <span>{deployments.length} deployed roles</span>
        </div>
      </a>
    {/each}
  </section>
{/if}
