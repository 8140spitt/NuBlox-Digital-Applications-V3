<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const viewForm = $derived(
    form as ActionData &
      Partial<{
        error: string;
        businessName: string;
        tenantSlug: string;
        primaryCountryCode: string;
        primaryLanguageCode: string;
        primaryClassificationValueId: string;
        sizeTier: string;
        employeeCount: string;
        legalEntityCount: string;
        operatingModelCodes: string[];
        regulatoryRegimeIds: string[];
        cbeArchetypeCode: string;
        cbeContractualPositionCode: string;
        cbeEmploysOperatives: string;
        personName: string;
        email: string;
        acceptedTerms: boolean;
      }>
  );

  type FunctionState = 'DEFAULT_ENABLED' | 'AVAILABLE_DISABLED' | 'HIDDEN_NOT_APPLICABLE';

  type CbeOperatingProfilePreview = {
    resolverVersion: number;
    provisioningCode: string;
    intakeArchetypeCode: string;
    effectiveArchetypeCode: string;
    contractualPositionCode: string;
    employsOperatives: boolean;
    sizeBand: string;
    summary: {
      totalFunctions: number;
      defaultEnabled: number;
      availableDisabled: number;
      hiddenNotApplicable: number;
    };
    functions: Array<{
      functionId: string;
      code: string;
      name: string;
      functionFamily: 'CORE_BUSINESS' | 'CBE';
      recommendationState: FunctionState;
      rationale: string;
    }>;
    capabilityAdders: Array<{
      code: string;
      name: string;
      capabilityType: 'SUB_FUNCTION';
      sizeBand: string;
    }>;
  };

  let step = $state(1);
  let registrationForm: HTMLFormElement | undefined;
  let wizardMessage = $state('');
  let preview = $state<{
    templates: Array<{
      templateId: string;
      code: string;
      name: string;
      version: number;
      templateKind: string;
    }>;
    industrySolutionIds: string[];
    capabilityGuidance: {
      catalogueCode: string;
      catalogueName: string;
      catalogueEdition: string;
      totalCapabilities: number;
      defaultEnabled: number;
      availableDisabled: number;
      hiddenNotApplicable: number;
    } | null;
    cbeOperatingProfile: CbeOperatingProfilePreview | null;
  } | null>(null);
  let businessName = $state(viewForm?.businessName ?? '');
  let primaryClassificationValueId = $state(viewForm?.primaryClassificationValueId ?? '');
  let sizeTier = $state(viewForm?.sizeTier ?? '');
  let operatingModelCodes = $state<string[]>(viewForm?.operatingModelCodes ?? []);
  let cbeArchetypeCode = $state(viewForm?.cbeArchetypeCode ?? '');
  let cbeContractualPositionCode = $state(viewForm?.cbeContractualPositionCode ?? '');
  let cbeEmploysOperatives = $state(viewForm?.cbeEmploysOperatives ?? '');

  const selectedIndustry = $derived(
    data.catalogue.industries.find(
      (industry) => industry.classificationValueId === primaryClassificationValueId
    )
  );
  const isCbe = $derived(selectedIndustry?.industrySolutionId === 'CBE');
  const selectedSizeTier = $derived(
    data.catalogue.sizeTiers.find((tier) => tier.code === sizeTier)
  );
  const industrySchemeGroups = $derived(
    Object.values(
      data.catalogue.industries.reduce(
        (groups, industry) => {
          const key = `${industry.schemeCode}:${industry.schemeEdition}`;
          const group =
            groups[key] ??
            (groups[key] = {
              key,
              label:
                industry.schemeCode === 'NUBLOX_INDUSTRY'
                  ? `${industry.schemeName} · platform classification`
                  : `${industry.schemeName} ${industry.schemeEdition}${industry.schemeJurisdiction ? ` · ${industry.schemeJurisdiction}` : ''}`,
              industries: []
            });
          group.industries.push(industry);
          return groups;
        },
        {} as Record<
          string,
          {
            key: string;
            label: string;
            industries: typeof data.catalogue.industries;
          }
        >
      )
    )
  );

  async function nextStep() {
    wizardMessage = '';

    const fieldset = registrationForm?.querySelector<HTMLFieldSetElement>(
      `fieldset[data-step="${step}"]`
    );
    const controls = fieldset
      ? Array.from(
          fieldset.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
            'input, select, textarea'
          )
        )
      : [];

    for (const control of controls) {
      if (!control.checkValidity()) {
        control.reportValidity();
        return;
      }
    }

    if (step === 2 && operatingModelCodes.length === 0) {
      wizardMessage = 'Select at least one operating model.';
      return;
    }

    if (
      step === 2 &&
      isCbe &&
      (!cbeArchetypeCode || !cbeContractualPositionCode || !cbeEmploysOperatives)
    ) {
      wizardMessage = 'Complete all Construction & Built Environment operating-profile questions.';
      return;
    }

    if (step === 2 && registrationForm) {
      const response = await fetch('/register/preview', {
        method: 'POST',
        body: new FormData(registrationForm)
      });
      const result = await response.json();

      if (!response.ok) {
        wizardMessage = result.error ?? 'NuBlox could not resolve this Tenant configuration.';
        return;
      }

      preview = result;
    }

    step = Math.min(4, step + 1);
  }

  function previousStep() {
    step = Math.max(1, step - 1);
  }
</script>

<svelte:head>
  <title>Start with NuBlox</title>
  <meta
    name="description"
    content="Create your NuBlox tenant and configure its business operating environment."
  />
</svelte:head>

<main class="login-page">
  <section class="login-brand-panel">
    <a class="login-brand" href="/">NuBlox</a>
    <div>
      <p class="app-eyebrow">Start with NuBlox · Step {step} of 4</p>
      <h1>Configure your<br />business environment.</h1>
      <p>
        NuBlox captures the business context required to configure the Tenant from governed
        metadata. The 29 core enterprise Functions remain available; Industry Solutions and
        configuration templates extend how the business operates and delivers.
      </p>
    </div>
    <span class="login-version">Digital Applications V3</span>
  </section>

  <section class="login-form-panel">
    <div class="login-form-wrap">
      <header>
        <p class="app-eyebrow">Tenant registration</p>
        <h2>
          {step === 1
            ? 'Business identity'
            : step === 2
              ? 'Operating profile'
              : step === 3
                ? 'Configuration preview'
                : 'Administrator setup'}
        </h2>
        <p>
          {step === 1
            ? 'Tell NuBlox what business is being created and where it principally operates.'
            : step === 2
              ? 'Size, operating model and Industry Solution intake determine the recommended operating profile.'
              : step === 3
                ? 'Review the recommended configuration before the Tenant is provisioned.'
                : 'Create the first verified employee identity and Tenant administrator.'}
        </p>
      </header>

      <form method="POST" class="login-form" bind:this={registrationForm}>
        <fieldset data-step="1" hidden={step !== 1}>
          <label>
            <span>Business name</span>
            <input
              name="businessName"
              bind:value={businessName}
              autocomplete="organization"
              maxlength="255"
              required
            />
          </label>

          <label>
            <span>Tenant address</span>
            <input
              name="tenantSlug"
              autocomplete="off"
              maxlength="80"
              pattern={'[a-z0-9][a-z0-9-]{1,78}[a-z0-9]'}
              placeholder="baesystems"
              value={viewForm?.tenantSlug ?? ''}
            />
            <small>
              Leave blank and NuBlox derives the business route, for example
              BAE Systems → baesystems → nublox.com/baesystems/app.
            </small>
          </label>

          <label>
            <span>Primary country</span>
            <input
              name="primaryCountryCode"
              minlength="2"
              maxlength="2"
              autocomplete="country"
              placeholder="GB"
              value={viewForm?.primaryCountryCode ?? ''}
              required
            />
            <small>ISO alpha-2 country code, for example GB.</small>
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

          <label>
            <span>Industry classification</span>
            <select
              name="primaryClassificationValueId"
              bind:value={primaryClassificationValueId}
              required
            >
              <option value="">Choose an industry classification</option>
              {#each industrySchemeGroups as group}
                <optgroup label={group.label}>
                  {#each group.industries as industry}
                    <option value={industry.classificationValueId}>
                      {industry.classificationCode} · {industry.name}
                    </option>
                  {/each}
                </optgroup>
              {/each}
            </select>
            <small>
              Choose the classification scheme that is meaningful for your organisation.
              Classification data selects applicable Industry Solutions without replacing the
              universal NuBlox enterprise model.
            </small>
          </label>
        </fieldset>

        <fieldset data-step="2" hidden={step !== 2}>
          <label>
            <span>Business size</span>
            <select name="sizeTier" bind:value={sizeTier} required>
              <option value="">Choose a size tier</option>
              {#each data.catalogue.sizeTiers as tier}
                <option value={tier.code}>{tier.name} · {tier.employeeRange} employees</option>
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

          <div>
            <span>Operating model</span>
            <p class="login-help">Select every model that materially describes how the business operates.</p>
            {#each data.catalogue.operatingModels as model}
              <label class="login-checkbox">
                <input
                  name="operatingModelCodes"
                  type="checkbox"
                  value={model.code}
                  bind:group={operatingModelCodes}
                />
                <span><strong>{model.name}</strong> — {model.description}</span>
              </label>
            {/each}
          </div>

          {#if data.catalogue.regulatoryRegimes.length > 0}
            <div>
              <span>Regulatory regimes</span>
              {#each data.catalogue.regulatoryRegimes as regime}
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

          {#if isCbe}
            <section class="home-section">
              <header class="home-section-heading">
                <div>
                  <p class="app-eyebrow">Construction &amp; Built Environment</p>
                  <h2>Quick operating profile</h2>
                </div>
              </header>
              <p class="login-help">
                These questions recommend the CBE Functions most relevant to how the business actually
                operates and delivers. They do not remove the canonical Function model.
              </p>

              <label>
                <span>What does the business primarily do?</span>
                <select name="cbeArchetypeCode" bind:value={cbeArchetypeCode} required>
                  <option value="">Choose the closest business archetype</option>
                  {#each data.cbeCatalogue.archetypes as archetype}
                    <option value={archetype.code}>{archetype.name}</option>
                  {/each}
                </select>
                {#if cbeArchetypeCode}
                  <small>{data.cbeCatalogue.archetypes.find((item) => item.code === cbeArchetypeCode)?.description}</small>
                {/if}
              </label>

              <label>
                <span>What is the organisation's contractual position?</span>
                <select
                  name="cbeContractualPositionCode"
                  bind:value={cbeContractualPositionCode}
                  required
                >
                  <option value="">Choose the contractual position</option>
                  {#each data.cbeCatalogue.contractualPositions as position}
                    <option value={position.code}>{position.name}</option>
                  {/each}
                </select>
                <small>
                  Contractual position takes precedence when it materially changes the delivery model.
                </small>
              </label>

              <div>
                <span>Do you directly employ operatives or trades who perform physical site work?</span>
                <label class="login-checkbox">
                  <input
                    name="cbeEmploysOperatives"
                    type="radio"
                    value="Y"
                    bind:group={cbeEmploysOperatives}
                    required
                  />
                  <span>Yes — we directly employ operatives or trades.</span>
                </label>
                <label class="login-checkbox">
                  <input
                    name="cbeEmploysOperatives"
                    type="radio"
                    value="N"
                    bind:group={cbeEmploysOperatives}
                    required
                  />
                  <span>No — our work is professional, advisory, client-side, supply or otherwise non-operative.</span>
                </label>
              </div>
            </section>
          {/if}
        </fieldset>

        <fieldset data-step="3" hidden={step !== 3}>
          <div class="home-primary-grid">
            <article class="home-primary-card">
              <span>CORE</span>
              <div>
                <strong>NuBlox Enterprise Core</strong>
                <p>
                  All 29 core business Functions remain canonical. The operating profile recommends
                  what should be visible and enabled by default for this Tenant.
                </p>
              </div>
            </article>

            <article class="home-primary-card">
              <span>IND</span>
              <div>
                <strong>{selectedIndustry?.name ?? 'Choose an industry'}</strong>
                <p>
                  {selectedIndustry
                    ? `${selectedIndustry.schemeCode} ${selectedIndustry.schemeEdition} · ${selectedIndustry.classificationCode}`
                    : 'No classification selected'}
                </p>
                <p>
                  {selectedIndustry?.industrySolutionName
                    ? `${selectedIndustry.industrySolutionName} will be activated as an Industry Solution overlay.`
                    : 'No Industry Solution is currently mapped to this classification.'}
                </p>
              </div>
            </article>

            <article class="home-primary-card">
              <span>CFG</span>
              <div>
                <strong>{selectedSizeTier?.name ?? 'Choose a size tier'} configuration depth</strong>
                <p>
                  Operating model: {operatingModelCodes.length > 0
                    ? operatingModelCodes.join(', ')
                    : 'not selected'}.
                </p>
              </div>
            </article>

            <article class="home-primary-card">
              <span>MD</span>
              <div>
                <strong>Metadata-driven provisioning</strong>
                <p>
                  NuBlox records the exact template versions and configuration components applied to
                  {businessName || 'this Tenant'} so future changes remain auditable and upgradeable.
                </p>
              </div>
            </article>
          </div>

          {#if preview}
            <section class="home-section">
              <header class="home-section-heading">
                <div>
                  <p class="app-eyebrow">Resolved by NuBlox</p>
                  <h2>Configuration template stack</h2>
                </div>
              </header>

              <div class="home-primary-grid">
                {#each preview.templates as template}
                  <article class="home-primary-card">
                    <span>V{template.version}</span>
                    <div>
                      <strong>{template.name}</strong>
                      <p>{template.code} · {template.templateKind.toLowerCase().replaceAll('_', ' ')}</p>
                    </div>
                  </article>
                {/each}
              </div>

              {#if preview.industrySolutionIds.length > 0}
                <p class="workspace-lede">
                  Industry Solutions resolved: {preview.industrySolutionIds.join(', ')}.
                </p>
              {/if}

              {#if preview.cbeOperatingProfile}
                <section class="home-section">
                  <header class="home-section-heading">
                    <div>
                      <p class="app-eyebrow">Recommended operating profile</p>
                      <h2>{preview.cbeOperatingProfile.provisioningCode}</h2>
                    </div>
                  </header>

                  <div class="home-primary-grid">
                    <article class="home-primary-card">
                      <span>●</span>
                      <div>
                        <strong>{preview.cbeOperatingProfile.summary.defaultEnabled}</strong>
                        <p>Functions enabled by default</p>
                      </div>
                    </article>
                    <article class="home-primary-card">
                      <span>○</span>
                      <div>
                        <strong>{preview.cbeOperatingProfile.summary.availableDisabled}</strong>
                        <p>Functions available to enable</p>
                      </div>
                    </article>
                    <article class="home-primary-card">
                      <span>—</span>
                      <div>
                        <strong>{preview.cbeOperatingProfile.summary.hiddenNotApplicable}</strong>
                        <p>Functions hidden as not normally applicable</p>
                      </div>
                    </article>
                  </div>

                  <div class="home-primary-grid">
                    <article class="home-primary-card">
                      <span>ON</span>
                      <div>
                        <strong>Default workspace</strong>
                        <p>
                          {preview.cbeOperatingProfile.functions
                            .filter((item) => item.recommendationState === 'DEFAULT_ENABLED')
                            .map((item) => `${item.code} ${item.name}`)
                            .join(' · ')}
                        </p>
                      </div>
                    </article>
                    <article class="home-primary-card">
                      <span>OPT</span>
                      <div>
                        <strong>Available when needed</strong>
                        <p>
                          {preview.cbeOperatingProfile.functions
                            .filter((item) => item.recommendationState === 'AVAILABLE_DISABLED')
                            .map((item) => `${item.code} ${item.name}`)
                            .join(' · ')}
                        </p>
                      </div>
                    </article>
                  </div>

                  {#if preview.cbeOperatingProfile.capabilityAdders.length > 0}
                    <p class="workspace-lede">
                      Size-based capability adders:
                      {preview.cbeOperatingProfile.capabilityAdders
                        .map((item) => `${item.code} ${item.name}`)
                        .join(' · ')}.
                    </p>
                  {/if}
                  <p class="workspace-lede">
                    This is a governed recommendation, not a licence boundary. Tenant administrators can
                    later reassess applicable Functions without re-provisioning the canonical platform.
                  </p>
                </section>
              {/if}

              {#if preview.capabilityGuidance}
                <div class="home-primary-grid">
                  <article class="home-primary-card">
                    <span>●</span>
                    <div>
                      <strong>{preview.capabilityGuidance.defaultEnabled}</strong>
                      <p>Source capabilities enabled by default</p>
                    </div>
                  </article>
                  <article class="home-primary-card">
                    <span>○</span>
                    <div>
                      <strong>{preview.capabilityGuidance.availableDisabled}</strong>
                      <p>Source capabilities available but disabled</p>
                    </div>
                  </article>
                  <article class="home-primary-card">
                    <span>—</span>
                    <div>
                      <strong>{preview.capabilityGuidance.hiddenNotApplicable}</strong>
                      <p>Source capabilities marked hidden/not applicable</p>
                    </div>
                  </article>
                </div>
                <p class="workspace-lede">
                  Market capability guidance from
                  {preview.capabilityGuidance.catalogueName}
                  {preview.capabilityGuidance.catalogueEdition}.
                  These states are evidence for NuBlox capability composition; they do not switch
                  off the 29 core Functions.
                </p>
              {/if}
            </section>
          {/if}
        </fieldset>

        <fieldset data-step="4" hidden={step !== 4}>
          <label>
            <span>Your name</span>
            <input
              name="personName"
              autocomplete="name"
              maxlength="255"
              value={viewForm?.personName ?? ''}
              required
            />
          </label>

          <label>
            <span>Work email</span>
            <input
              name="email"
              type="email"
              autocomplete="email"
              maxlength="320"
              value={viewForm?.email ?? ''}
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              name="password"
              type="password"
              autocomplete="new-password"
              minlength="12"
              required
            />
          </label>

          <label class="login-checkbox">
            <input
              name="acceptedTerms"
              type="checkbox"
              checked={viewForm?.acceptedTerms ?? false}
              required
            />
            <span>I accept the NuBlox terms and privacy notice.</span>
          </label>
        </fieldset>

        {#if wizardMessage}
          <p class="form-message error">{wizardMessage}</p>
        {/if}

        {#if viewForm?.error}
          <p class="form-message error">{viewForm.error}</p>
        {/if}

        <div class="login-form">
          {#if step > 1}
            <button type="button" class="quiet-button" onclick={previousStep}>← Back</button>
          {/if}

          {#if step < 4}
            <button type="button" class="login-submit" onclick={nextStep}>
              Continue <span aria-hidden="true">→</span>
            </button>
          {:else}
            <button type="submit" class="login-submit">
              Create and provision tenant
              <span aria-hidden="true">→</span>
            </button>
          {/if}
        </div>
      </form>

      <p class="login-help">
        Already have access? <a href="/login">Sign in</a>
      </p>
    </div>
  </section>
</main>
