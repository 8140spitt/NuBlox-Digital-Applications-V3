<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

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
  } | null>(null);
  let businessName = $state(form?.businessName ?? '');
  let primaryClassificationValueId = $state(form?.primaryClassificationValueId ?? '');
  let sizeTier = $state(form?.sizeTier ?? '');
  let operatingModelCodes = $state<string[]>(form?.operatingModelCodes ?? []);

  const selectedIndustry = $derived(
    data.catalogue.industries.find(
      (industry) => industry.classificationValueId === primaryClassificationValueId
    )
  );
  const selectedSizeTier = $derived(
    data.catalogue.sizeTiers.find((tier) => tier.code === sizeTier)
  );
  const industrySchemeGroups = $derived(
    Object.values(
      data.catalogue.industries.reduce(
        (groups, industry) => {
          const key = `${industry.schemeCode}:${industry.schemeEdition}`;
          groups[key] ??= {
            key,
            label:
              industry.schemeCode === 'NUBLOX_INDUSTRY'
                ? `${industry.schemeName} · platform classification`
                : `${industry.schemeName} ${industry.schemeEdition}${industry.schemeJurisdiction ? ` · ${industry.schemeJurisdiction}` : ''}`,
            industries: []
          };
          groups[key].industries.push(industry);
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
              ? 'Size and operating model'
              : step === 3
                ? 'Configuration preview'
                : 'Administrator setup'}
        </h2>
        <p>
          {step === 1
            ? 'Tell NuBlox what business is being created and where it principally operates.'
            : step === 2
              ? 'These dimensions determine configuration depth and applicable template overlays.'
              : step === 3
                ? 'Review the configuration basis before the Tenant is provisioned.'
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
              pattern="[a-z0-9][a-z0-9-]{1,78}[a-z0-9]"
              placeholder="baesystems"
              value={form?.tenantSlug ?? ''}
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
              maxlength="2"
              pattern="[A-Za-z]{2}"
              placeholder="GB"
              value={form?.primaryCountryCode ?? ''}
              required
            />
            <small>Two-letter country code.</small>
          </label>

          <label>
            <span>Primary language</span>
            <input
              name="primaryLanguageCode"
              maxlength="16"
              placeholder="en-GB"
              value={form?.primaryLanguageCode ?? ''}
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
              value={form?.employeeCount ?? ''}
            />
          </label>

          <label>
            <span>Number of legal entities</span>
            <input
              name="legalEntityCount"
              type="number"
              min="1"
              step="1"
              value={form?.legalEntityCount ?? '1'}
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
                    checked={form?.regulatoryRegimeIds?.includes(regime.id) ?? false}
                  />
                  <span>{regime.name}{regime.jurisdiction ? ` · ${regime.jurisdiction}` : ''}</span>
                </label>
              {/each}
            </div>
          {/if}
        </fieldset>

        <fieldset data-step="3" hidden={step !== 3}>
          <div class="home-primary-grid">
            <article class="home-primary-card">
              <span>CORE</span>
              <div>
                <strong>NuBlox Enterprise Core</strong>
                <p>
                  All 29 core business Functions remain part of the Tenant. Industry configuration
                  does not remove enterprise capability.
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
              value={form?.personName ?? ''}
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
              value={form?.email ?? ''}
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
              checked={form?.acceptedTerms ?? false}
              required
            />
            <span>I accept the NuBlox terms and privacy notice.</span>
          </label>
        </fieldset>

        {#if wizardMessage}
          <p class="form-message error">{wizardMessage}</p>
        {/if}

        {#if form?.error}
          <p class="form-message error">{form.error}</p>
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
