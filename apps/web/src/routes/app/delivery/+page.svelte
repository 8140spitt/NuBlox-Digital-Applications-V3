<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  function dateOnly(value: string) {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value));
  }
</script>

<svelte:head>
  <title>Services &amp; Delivery — NuBlox</title>
</svelte:head>

{#if !data.allowed || !data.projection}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit Services &amp; Delivery planning.</h1>
      <p>
        NuBlox evaluated <code>platform.industry_delivery.read</code> in the current tenant scope
        and did not find an active matching Access Role Assignment.
      </p>
      <p class="permission-reason">{data.reason}</p>
      <div class="permission-actions">
        <a
          class="primary-action permission-back"
          href="/app/request-access?permission=platform.industry_delivery.read&returnTo=/app/delivery"
        >
          Request access <span aria-hidden="true">→</span>
        </a>
        <a class="quiet-link" href="/app">Back Home</a>
      </div>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact delivery-hero">
    <div>
      <p class="app-eyebrow">Construction &amp; Built Environment</p>
      <h1>Services &amp; Delivery</h1>
      <p class="workspace-lede">
        Define what the business can deliver, the CBE professions it can supply internally, and
        the capability each Project needs. Fulfil demand from internal People and Positions or
        external provider Organisations without mixing service delivery with the 29 enterprise
        Functions.
      </p>
    </div>
  </section>

  {#if form?.message || form?.error}
    <div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
      <strong>{form?.ok ? 'Completed' : 'Action not completed'}</strong>
      <span>{form?.message ?? form?.error}</span>
    </div>
  {/if}

  <section class="architecture-metrics delivery-metrics" aria-label="Delivery capability totals">
    <article>
      <span>Services</span>
      <strong>{data.projection.totals.services}</strong>
      <p>Tenant CBE service offerings</p>
    </article>
    <article>
      <span>Internal professions</span>
      <strong>{data.projection.totals.internalCapabilities}</strong>
      <p>of {data.projection.jobProfiles.length} CBE Job Profiles</p>
    </article>
    <article>
      <span>Projects</span>
      <strong>{data.projection.totals.projects}</strong>
      <p>Active CBE delivery contexts</p>
    </article>
    <article>
      <span>Sourcing gaps</span>
      <strong>{data.projection.totals.sourcingRequired}</strong>
      <p>Requirements still needing supply</p>
    </article>
  </section>

  {#if data.canManage}
    <details class="workspace-command-drawer delivery-command-drawer">
      <summary>
        <span>Actions</span>
        <strong>Configure services &amp; capability</strong>
        <small>Create Project contexts, define Services and raise professional capability demand</small>
      </summary>

      <section class="information-admin delivery-admin">
        <header class="information-admin-heading">
          <div>
            <p class="app-eyebrow">Delivery configuration</p>
            <h2>Build the supply and demand model</h2>
          </div>
          <p>
            Configure the tenant's market-facing Services and internal professional capability,
            then raise demand against real Project contexts.
          </p>
        </header>

        <div class="information-command-grid">
          <details>
            <summary><span>01</span><strong>Create Project context</strong></summary>
            <form method="POST" action="?/createProject" class="admin-form">
              <label><span>Project code</span><input name="code" required maxlength="120" placeholder="PRJ-001" /></label>
              <label class="information-wide"><span>Project name</span><input name="name" required maxlength="255" /></label>
              <button type="submit">Create Project context <span>→</span></button>
            </form>
          </details>

          <details>
            <summary><span>02</span><strong>Define Service</strong></summary>
            <form method="POST" action="?/createService" class="admin-form">
              <label>
                <span>Delivery domain</span>
                <select name="deliveryDomainId" required>
                  <option value="">Select CBE domain</option>
                  {#each data.projection.deliveryDomains as domain}
                    <option value={domain.id}>{domain.code} · {domain.name}</option>
                  {/each}
                </select>
              </label>
              <label><span>Service code</span><input name="code" required maxlength="120" placeholder="ARCH-DESIGN" /></label>
              <label class="information-wide"><span>Service name</span><input name="name" required maxlength="255" placeholder="Architectural Design" /></label>
              <label class="information-wide"><span>Description</span><textarea name="description" required rows="3"></textarea></label>
              <button type="submit">Create Service <span>→</span></button>
            </form>
          </details>

          <details>
            <summary><span>03</span><strong>Add profession to Service</strong></summary>
            <form method="POST" action="?/addServiceProfession" class="admin-form">
              <label>
                <span>Service</span>
                <select name="serviceOfferingId" required>
                  <option value="">Select Service</option>
                  {#each data.projection.services.filter((service) => service.status === 'ACTIVE') as service}
                    <option value={service.id}>{service.code} · {service.name}</option>
                  {/each}
                </select>
              </label>
              <label>
                <span>CBE profession</span>
                <select name="industryJobProfileId" required>
                  <option value="">Select profession</option>
                  {#each data.projection.deliveryDomains as domain}
                    <optgroup label={domain.name}>
                      {#each data.projection.jobProfiles.filter((profile) => profile.primaryDeliveryDomainId === domain.id) as profile}
                        <option value={profile.industryJobProfileId}>{profile.canonicalName}</option>
                      {/each}
                    </optgroup>
                  {/each}
                </select>
              </label>
              <label>
                <span>Role in Service</span>
                <select name="role" required>
                  <option value="CORE">Core</option>
                  <option value="SUPPORTING">Supporting</option>
                  <option value="ASSURANCE">Assurance</option>
                </select>
              </label>
              <button type="submit" disabled={data.projection.services.length === 0}>
                Add profession <span>→</span>
              </button>
            </form>
          </details>

          <details>
            <summary><span>04</span><strong>Declare internal capability</strong></summary>
            <form method="POST" action="?/declareCapability" class="admin-form">
              <label class="information-wide">
                <span>CBE profession</span>
                <select name="industryJobProfileId" required>
                  <option value="">Select profession</option>
                  {#each data.projection.deliveryDomains as domain}
                    <optgroup label={domain.name}>
                      {#each data.projection.jobProfiles.filter((profile) => profile.primaryDeliveryDomainId === domain.id) as profile}
                        <option value={profile.industryJobProfileId}>{profile.canonicalName}</option>
                      {/each}
                    </optgroup>
                  {/each}
                </select>
              </label>
              <label>
                <span>Supply model</span>
                <select name="supplyModel" required>
                  <option value="INTERNAL">Internal</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </label>
              <label class="information-wide"><span>Notes</span><textarea name="notes" rows="2"></textarea></label>
              <button type="submit">Declare capability <span>→</span></button>
            </form>
          </details>

          <details>
            <summary><span>05</span><strong>Raise Project capability demand</strong></summary>
            <form method="POST" action="?/createRequirement" class="admin-form">
              <label>
                <span>Delivery context</span>
                <select name="contextObjectId" required>
                  <option value="">Select Project / delivery context</option>
                  {#each data.projection.deliveryContexts as context}
                    <option value={context.canonicalObjectId}>{context.contextType} · {context.code} — {context.name}</option>
                  {/each}
                </select>
              </label>
              <label class="information-wide">
                <span>Service / required profession</span>
                <select name="serviceProfession" required>
                  <option value="">Select configured Service profession</option>
                  {#each data.projection.services.filter((service) => service.status === 'ACTIVE') as service}
                    <optgroup label={`${service.code} · ${service.name}`}>
                      {#each service.professions.filter((profession) => profession.status === 'ACTIVE') as profession}
                        <option value={`${service.id}|${profession.industryJobProfileId}`}>
                          {profession.canonicalName} · {profession.role}
                        </option>
                      {/each}
                    </optgroup>
                  {/each}
                </select>
              </label>
              <label>
                <span>Headcount</span>
                <input name="requiredHeadcount" type="number" min="1" step="1" value="1" required />
              </label>
              <label>
                <span>Sourcing strategy</span>
                <select name="sourcingStrategy" required>
                  <option value="UNDECIDED">Undecided</option>
                  <option value="INTERNAL">Internal</option>
                  <option value="EXTERNAL">External</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </label>
              <label><span>Required from</span><input name="effectiveFrom" type="datetime-local" /></label>
              <label><span>Required to</span><input name="effectiveTo" type="datetime-local" /></label>
              <label class="information-wide"><span>Requirement</span><textarea name="description" required rows="3"></textarea></label>
              <button type="submit" disabled={data.projection.deliveryContexts.length === 0 || data.projection.services.every((service) => service.professions.length === 0)}>
                Raise capability demand <span>→</span>
              </button>
            </form>
          </details>
        </div>
      </section>
    </details>
  {/if}

  <section class="delivery-demand-section">
    <header class="home-section-heading">
      <div>
        <p class="app-eyebrow">Project demand</p>
        <h2>Capability requirements</h2>
      </div>
      <p>
        Projects consume professional capability. Requirements remain visible until internal and/or
        external supply satisfies the complete demand.
      </p>
    </header>

    {#if data.projection.requirements.length === 0}
      <section class="empty-work-state">
        <div class="empty-state-mark">SD</div>
        <div>
          <p class="app-eyebrow">No demand yet</p>
          <h2>No Project capability requirements exist.</h2>
          <p>Define a Service and its professions, then raise demand against a Project context.</p>
        </div>
      </section>
    {:else}
      <div class="delivery-requirement-list">
        {#each data.projection.requirements as requirement}
          <article class="delivery-requirement-card">
            <header>
              <div>
                <span class="delivery-context-code">{requirement.contextCode}</span>
                <h3>{requirement.canonicalName}</h3>
                <p>{requirement.contextName} · {requirement.serviceName}</p>
              </div>
              <div class="delivery-requirement-state">
                <span class:fulfilled={requirement.status === 'FULFILLED'}>{requirement.status.replaceAll('_', ' ')}</span>
                <strong>{requirement.fulfilledPercent.toFixed(0)}%</strong>
              </div>
            </header>

            <div class="delivery-progress" aria-label={`${requirement.fulfilledPercent}% fulfilled`}>
              <span style={`width: ${requirement.fulfilledPercent}%`}></span>
            </div>

            <div class="delivery-requirement-meta">
              <span>{requirement.requiredHeadcount} required</span>
              <span>{requirement.sourcingStrategy}</span>
              {#if requirement.effectiveFrom}<span>From {dateOnly(requirement.effectiveFrom)}</span>{/if}
              {#if requirement.effectiveTo}<span>To {dateOnly(requirement.effectiveTo)}</span>{/if}
              {#if requirement.remainingPercent > 0}<span>{requirement.remainingPercent.toFixed(0)}% unsupplied</span>{/if}
            </div>

            <p class="delivery-requirement-description">{requirement.description}</p>

            <div class="delivery-fulfilments">
              {#if requirement.fulfilments.length === 0}
                <p class="information-empty-inline">No capability supply has been allocated.</p>
              {:else}
                {#each requirement.fulfilments as fulfilment}
                  <div class="delivery-fulfilment-row">
                    <span>{fulfilment.fulfilmentType}</span>
                    <strong>{fulfilment.providerName}</strong>
                    <small>{fulfilment.providerType.replaceAll('_', ' ')}</small>
                    <span>{fulfilment.requirementSharePercent.toFixed(0)}% of requirement</span>
                    {#if fulfilment.resourceCapacityPercent !== undefined}
                      <small>{fulfilment.resourceCapacityPercent.toFixed(0)}% resource capacity</small>
                    {/if}
                  </div>
                {/each}
              {/if}
            </div>

            {#if data.canManage && requirement.status !== 'FULFILLED' && requirement.status !== 'CANCELLED'}
              <div class="delivery-sourcing-actions">
                {#if requirement.sourcingStrategy !== 'EXTERNAL'}
                  <details>
                    <summary>Allocate internal capability</summary>
                    <form method="POST" action="?/fulfilRequirement" class="admin-form">
                      <input type="hidden" name="requirementId" value={requirement.id} />
                      <input type="hidden" name="fulfilmentType" value="INTERNAL" />
                      <label class="information-wide">
                        <span>Matching Person or Position</span>
                        <select name="provider" required>
                          <option value="">Select internal provider</option>
                          {#each data.projection.internalProviders.filter((provider) => provider.industryJobProfileId === requirement.industryJobProfileId) as provider}
                            <option value={`${provider.providerType}|${provider.providerId}`}>
                              {provider.label} · {provider.organisationName}
                            </option>
                          {/each}
                        </select>
                      </label>
                      <label>
                        <span>Requirement share %</span>
                        <input name="requirementSharePercent" type="number" min="0.01" max={requirement.remainingPercent} step="0.01" required />
                      </label>
                      <label>
                        <span>Resource capacity %</span>
                        <input name="resourceCapacityPercent" type="number" min="0" max="100" step="0.01" />
                      </label>
                      <label><span>From</span><input name="effectiveFrom" type="datetime-local" /></label>
                      <label><span>To</span><input name="effectiveTo" type="datetime-local" /></label>
                      <button
                        type="submit"
                        disabled={data.projection.internalProviders.every((provider) => provider.industryJobProfileId !== requirement.industryJobProfileId)}
                      >
                        Allocate internal supply
                      </button>
                    </form>
                  </details>
                {/if}

                {#if requirement.sourcingStrategy !== 'INTERNAL'}
                  <details>
                    <summary>Allocate external provider</summary>
                    <form method="POST" action="?/fulfilRequirement" class="admin-form">
                      <input type="hidden" name="requirementId" value={requirement.id} />
                      <input type="hidden" name="fulfilmentType" value="EXTERNAL" />
                      <label class="information-wide">
                        <span>Vendor / consultant Organisation</span>
                        <select name="provider" required>
                          <option value="">Select Organisation</option>
                          {#each data.projection.organisations as organisation}
                            <option value={`ORGANISATION|${organisation.id}`}>{organisation.name}</option>
                          {/each}
                        </select>
                      </label>
                      <label>
                        <span>Requirement share %</span>
                        <input name="requirementSharePercent" type="number" min="0.01" max={requirement.remainingPercent} step="0.01" required />
                      </label>
                      <label><span>From</span><input name="effectiveFrom" type="datetime-local" /></label>
                      <label><span>To</span><input name="effectiveTo" type="datetime-local" /></label>
                      <button type="submit" disabled={data.projection.organisations.length === 0}>
                        Allocate external supply
                      </button>
                    </form>
                  </details>
                {/if}
              </div>
            {/if}
          </article>
        {/each}
      </div>
    {/if}
  </section>

  <section class="delivery-portfolio-grid">
    <section class="workspace-panel">
      <div class="panel-heading">
        <div>
          <p class="app-eyebrow">Market-facing portfolio</p>
          <h2>Services</h2>
        </div>
        <span>{data.projection.services.length}</span>
      </div>

      <div class="delivery-service-list">
        {#if data.projection.services.length === 0}
          <p class="information-empty">No tenant Services have been defined.</p>
        {:else}
          {#each data.projection.services as service}
            <article>
              <header>
                <div>
                  <span>{service.code}</span>
                  <strong>{service.name}</strong>
                </div>
                <small>{service.domainName}</small>
              </header>
              <p>{service.description}</p>
              <div class="delivery-profession-tags">
                {#each service.professions as profession}
                  <span>{profession.canonicalName} · {profession.role}</span>
                {/each}
                {#if service.professions.length === 0}
                  <small>No professions mapped yet.</small>
                {/if}
              </div>
            </article>
          {/each}
        {/if}
      </div>
    </section>

    <section class="workspace-panel">
      <div class="panel-heading">
        <div>
          <p class="app-eyebrow">Owned professional capability</p>
          <h2>Internal CBE professions</h2>
        </div>
        <span>{data.projection.internalCapabilities.length}</span>
      </div>

      <div class="delivery-capability-list">
        {#if data.projection.internalCapabilities.length === 0}
          <p class="information-empty">No internal CBE capability has been declared.</p>
        {:else}
          {#each data.projection.internalCapabilities as capability}
            <article>
              <div>
                <span>{capability.domainName}</span>
                <strong>{capability.canonicalName}</strong>
              </div>
              <span class="change-status">{capability.supplyModel}</span>
              {#if capability.notes}<p>{capability.notes}</p>{/if}
            </article>
          {/each}
        {/if}
      </div>
    </section>
  </section>
{/if}
