<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const viewForm = $derived(
    form as ActionData &
      Partial<{
        primaryClassificationValueId: string;
        sizeTier: string;
        employeeCount: string;
        legalEntityCount: string;
        primaryCountryCode: string;
        primaryLanguageCode: string;
        operatingModelCodes: string[];
        regulatoryRegimeIds: string[];
      }>
  );

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

{#if !data.canRead}
  <section class="workspace-hero">
    <div>
      <p class="app-eyebrow">Tenant configuration</p>
      <h1>Your role does not permit Tenant configuration access.</h1>
      <p class="workspace-lede">{data.reason}</p>
    </div>
  </section>
{:else if data.needsConfiguration}
  <section class="workspace-hero">
    <div>
      <p class="app-eyebrow">Tenant configuration</p>
      <h1>Complete this Tenant's Business Profile</h1>
      <p class="workspace-lede">
        This Tenant predates metadata-driven provisioning. NuBlox will not guess its industry,
        scale or operating model. An authorised administrator must profile it once so the correct
        versioned configuration stack can be resolved and retained as evidence.
      </p>
    </div>
  </section>

  {#if !data.canManage || !data.catalogue}
    <p class="form-message error">
      The Business Profile has not been configured and your current access does not permit the
      initial configuration.
    </p>
  {:else}
    {@const catalogue = data.catalogue}

    {#if form?.error}
      <p class="form-message error">{form.error}</p>
    {/if}

    <section class="home-section">
      <header class="home-section-heading">
        <div>
          <p class="app-eyebrow">Initial profiling</p>
          <h2>Describe this business</h2>
        </div>
        <p>This operation is one-time provisioning, not an uncontrolled reconfiguration.</p>
      </header>

      <form method="POST" action="?/configure" class="login-form">
        <label>
          <span>Industry</span>
          <select name="primaryClassificationValueId" required>
            <option value="">Choose an industry</option>
            {#each catalogue.industries as industry}
              <option
                value={industry.classificationValueId}
                selected={viewForm?.primaryClassificationValueId === industry.classificationValueId}
              >
                {industry.schemeCode} {industry.schemeEdition} · {industry.classificationCode} · {industry.name}
              </option>
            {/each}
          </select>
        </label>

        <label>
          <span>Business size</span>
          <select name="sizeTier" required>
            <option value="">Choose a size tier</option>
            {#each catalogue.sizeTiers as tier}
              <option value={tier.code} selected={viewForm?.sizeTier === tier.code}>
                {tier.name} · {tier.employeeRange} employees
              </option>
            {/each}
          </select>
        </label>

        <label>
          <span>Exact employee count <small>optional</small></span>
          <input
            name="employeeCount"
            type="number"
            min="1"
            step="1"
            value={viewForm?.employeeCount ?? ''}
          />
        </label>

        <label>
          <span>Number of legal entities</span>
          <input
            name="legalEntityCount"
            type="number"
            min="1"
            step="1"
            value={viewForm?.legalEntityCount ?? '1'}
            required
          />
        </label>

        <label>
          <span>Primary country <small>ISO alpha-2</small></span>
          <input
            name="primaryCountryCode"
            type="text"
            minlength="2"
            maxlength="2"
            autocomplete="country"
            autocapitalize="characters"
            placeholder="GB"
            title="Enter the two-letter ISO country code, for example GB."
            value={viewForm?.primaryCountryCode ?? ''}
            required
          />
          <small class="login-help">Use the two-letter country code, for example GB.</small>
        </label>

        <label>
          <span>Primary language</span>
          <input
            name="primaryLanguageCode"
            maxlength="16"
            placeholder="en-GB"
            value={viewForm?.primaryLanguageCode ?? ''}
            required
          />
        </label>

        <div>
          <span>Operating model</span>
          <p class="login-help">Select every model that materially describes this business.</p>
          {#each catalogue.operatingModels as model}
            <label class="login-checkbox">
              <input
                name="operatingModelCodes"
                type="checkbox"
                value={model.code}
                checked={viewForm?.operatingModelCodes?.includes(model.code) ?? false}
              />
              <span><strong>{model.name}</strong> — {model.description}</span>
            </label>
          {/each}
        </div>

        {#if catalogue.regulatoryRegimes.length > 0}
          <div>
            <span>Regulatory regimes</span>
            {#each catalogue.regulatoryRegimes as regime}
              <label class="login-checkbox">
                <input
                  name="regulatoryRegimeIds"
                  type="checkbox"
                  value={regime.id}
                  checked={viewForm?.regulatoryRegimeIds?.includes(regime.id) ?? false}
                />
                <span>{regime.name}{regime.jurisdiction ? ` · ${regime.jurisdiction}` : ''}</span>
              </label>
            {/each}
          </div>
        {/if}

        <button type="submit" class="primary-action">
          Profile and provision this Tenant
        </button>
      </form>
    </section>
  {/if}
{:else if data.configuration}
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

  {#if configuration.capabilityGuidance}
    <section class="home-section">
      <header class="home-section-heading">
        <div>
          <p class="app-eyebrow">Market capability evidence</p>
          <h2>{configuration.capabilityGuidance.catalogueName}</h2>
        </div>
        <p>
          {configuration.capabilityGuidance.catalogueEdition} ·
          {configuration.capabilityGuidance.totalCapabilities} source capabilities
        </p>
      </header>

      <div class="home-primary-grid">
        <article class="home-primary-card">
          <span>●</span>
          <div>
            <strong>{configuration.capabilityGuidance.defaultEnabled}</strong>
            <p>Default enabled in source guidance</p>
          </div>
        </article>
        <article class="home-primary-card">
          <span>○</span>
          <div>
            <strong>{configuration.capabilityGuidance.availableDisabled}</strong>
            <p>Available but disabled in source guidance</p>
          </div>
        </article>
        <article class="home-primary-card">
          <span>—</span>
          <div>
            <strong>{configuration.capabilityGuidance.hiddenNotApplicable}</strong>
            <p>Hidden/not applicable in source guidance</p>
          </div>
        </article>
      </div>

      <p class="workspace-lede">
        These are external ERP capability-applicability decisions retained as provenance.
        They do not remove NuBlox core Functions, permissions or native runtime capability.
      </p>
    </section>
  {/if}

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
