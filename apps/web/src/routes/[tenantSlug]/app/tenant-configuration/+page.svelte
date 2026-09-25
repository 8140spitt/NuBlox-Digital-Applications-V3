<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function formatDate(value: string | null) {
    if (!value) return '—';
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  function prettyKind(value: string) {
    return value.toLowerCase().replaceAll('_', ' ');
  }
</script>

<svelte:head>
  <title>Tenant configuration — NuBlox</title>
  <meta
    name="description"
    content="Review the business profile, Industry Solutions, configuration templates and provisioning evidence that configure this NuBlox Tenant."
  />
</svelte:head>

{#if !data.canRead || !data.configuration}
  <section class="workspace-hero">
    <div>
      <p class="app-eyebrow">Tenant configuration</p>
      <h1>Your role does not permit Tenant configuration access.</h1>
      <p class="workspace-lede">{data.reason}</p>
    </div>
  </section>
{:else}
  {@const configuration = data.configuration}

  <section class="workspace-hero">
    <div>
      <p class="app-eyebrow">Tenant configuration</p>
      <h1>Why this Tenant is configured this way</h1>
      <p class="workspace-lede">
        NuBlox resolves configuration from governed business-profile metadata and versioned
        templates. This view retains the provenance rather than hiding provisioning decisions in
        application code.
      </p>
    </div>
  </section>

  <section class="home-primary-grid">
    <article class="home-primary-card">
      <span>IND</span>
      <div>
        <strong>{configuration.profile.classificationName}</strong>
        <p>
          {configuration.profile.classificationSchemeCode}:{configuration.profile.classificationCode}
        </p>
      </div>
    </article>

    <article class="home-primary-card">
      <span>SZ</span>
      <div>
        <strong>{configuration.profile.sizeTier}</strong>
        <p>
          {configuration.profile.employeeCount
            ? `${configuration.profile.employeeCount} employees`
            : 'Employee count not recorded'}
          · {configuration.profile.legalEntityCount} legal entity/entities
        </p>
      </div>
    </article>

    <article class="home-primary-card">
      <span>LOC</span>
      <div>
        <strong>{configuration.profile.primaryCountryCode}</strong>
        <p>Primary language {configuration.profile.primaryLanguageCode}</p>
      </div>
    </article>

    <article class="home-primary-card">
      <span>CFG</span>
      <div>
        <strong>{configuration.profile.configurationState}</strong>
        <p>Provisioned {formatDate(configuration.profile.provisionedAt)}</p>
      </div>
    </article>
  </section>

  <section class="home-section">
    <header class="home-section-heading">
      <div>
        <p class="app-eyebrow">Operating model</p>
        <h2>How the business operates</h2>
      </div>
    </header>

    <div class="home-primary-grid">
      {#each configuration.operatingModels as model}
        <article class="home-primary-card">
          <span>{model.primary ? '01' : 'OM'}</span>
          <div>
            <strong>{model.name}</strong>
            <p>{model.code}{model.primary ? ' · primary' : ''}</p>
          </div>
        </article>
      {/each}
    </div>
  </section>

  <section class="home-section">
    <header class="home-section-heading">
      <div>
        <p class="app-eyebrow">Industry Solutions</p>
        <h2>Industry capability overlays</h2>
      </div>
    </header>

    {#if configuration.industrySolutions.length === 0}
      <p>No Industry Solution is currently activated for this Tenant.</p>
    {:else}
      <div class="home-primary-grid">
        {#each configuration.industrySolutions as solution}
          <article class="home-primary-card">
            <span>IS</span>
            <div>
              <strong>{solution.name}</strong>
              <p>{solution.code} · {solution.status}</p>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </section>

  <section class="home-section">
    <header class="home-section-heading">
      <div>
        <p class="app-eyebrow">Template provenance</p>
        <h2>Applied configuration templates</h2>
      </div>
      <p>Existing Tenants retain the exact template version that was applied.</p>
    </header>

    <div class="home-primary-grid">
      {#each configuration.templateApplications as application}
        <article class="home-primary-card">
          <span>V{application.version}</span>
          <div>
            <strong>{application.name}</strong>
            <p>
              {application.code} · {prettyKind(application.templateKind)} · {application.status}
            </p>
            <p>Applied {formatDate(application.appliedAt)}</p>
          </div>
        </article>
      {/each}
    </div>
  </section>

  {#if configuration.regulatoryRegimes.length > 0}
    <section class="home-section">
      <header class="home-section-heading">
        <div>
          <p class="app-eyebrow">Regulatory regime</p>
          <h2>Applicable regulatory configuration</h2>
        </div>
      </header>
      <div class="home-primary-grid">
        {#each configuration.regulatoryRegimes as regime}
          <article class="home-primary-card">
            <span>RG</span>
            <div>
              <strong>{regime.name}</strong>
              <p>{regime.code}{regime.jurisdiction ? ` · ${regime.jurisdiction}` : ''}</p>
            </div>
          </article>
        {/each}
      </div>
    </section>
  {/if}

  {#if configuration.latestProvisioningRun}
    <section class="home-section">
      <header class="home-section-heading">
        <div>
          <p class="app-eyebrow">Provisioning evidence</p>
          <h2>{configuration.latestProvisioningRun.id}</h2>
        </div>
        <p>
          {configuration.latestProvisioningRun.status} ·
          {formatDate(configuration.latestProvisioningRun.startedAt)}
        </p>
      </header>

      <div class="home-primary-grid">
        {#each configuration.latestProvisioningRun.steps as step}
          <article class="home-primary-card">
            <span>{step.sequence}</span>
            <div>
              <strong>{prettyKind(step.stepKey)}</strong>
              <p>{step.status} · completed {formatDate(step.completedAt)}</p>
            </div>
          </article>
        {/each}
      </div>
    </section>
  {/if}
{/if}
