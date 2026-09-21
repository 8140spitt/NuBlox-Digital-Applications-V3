<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const responsibilityRoles = [
    'ACCOUNTABLE',
    'RESPONSIBLE',
    'CONTRIBUTOR',
    'REVIEWER',
    'CHECKER',
    'APPROVER',
    'ACCEPTOR',
    'CONSULTED',
    'INFORMED',
    'ASSURANCE'
  ];

  const supportedContextTypes = new Set([
    'PROJECT',
    'CONTRACT',
    'PACKAGE',
    'SITE',
    'ASSET',
    'SERVICE'
  ]);

  function formatDate(value: string) {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value));
  }

  function contextLabel(objectType: string, stableKey: string) {
    return `${objectType} · ${stableKey}`;
  }
</script>

<svelte:head>
  <title>Functional Deployments — NuBlox</title>
</svelte:head>

{#if !data.allowed || !data.projection}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit Functional Deployment.</h1>
      <p>
        NuBlox evaluated <code>platform.deployment.read</code> in the current tenant scope and did
        not find an active matching Access Role Assignment.
      </p>
      <p class="permission-reason">{data.reason}</p>
      <div class="permission-actions">
        <a
          class="primary-action permission-back"
          href="/app/request-access?permission=platform.deployment.read&returnTo=/app/deployments"
        >
          Request access
          <span aria-hidden="true">→</span>
        </a>
        <a class="quiet-link" href="/app">Back to Functions</a>
      </div>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact deployment-hero">
    <div>
      <p class="app-eyebrow">Functional operating model</p>
      <h1>Deployments</h1>
      <p class="workspace-lede">
        Deploy governed Function capability into a real organisational or delivery context for either
        Functional Governance or Functional Delivery, then assign responsibility, scope and capacity.
        Employment, Permission and business Authority remain separate controls.
      </p>
    </div>
  </section>

  {#if form?.message || form?.error}
    <div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
      <strong>{form?.ok ? 'Completed' : 'Action not completed'}</strong>
      <span>{form?.message ?? form?.error}</span>
    </div>
  {/if}

  <section class="architecture-metrics deployment-metrics" aria-label="Functional Deployment totals">
    <article>
      <span>Deployments</span>
      <strong>{data.projection.deployments.length}</strong>
      <p>Function/L2 capability in operating context</p>
    </article>
    <article>
      <span>Assignments</span>
      <strong>
        {data.projection.deployments.reduce(
          (total, deployment) => total + deployment.assignments.length,
          0
        )}
      </strong>
      <p>People, Positions and Units carrying work</p>
    </article>
    <article>
      <span>Active capacity</span>
      <strong>
        {data.projection.deployments
          .flatMap((deployment) => deployment.assignments)
          .reduce((total, assignment) => total + assignment.activeCapacityPercent, 0)
          .toFixed(0)}%
      </strong>
      <p>Current recorded deployment allocation</p>
    </article>
    <article>
      <span>Functions available</span>
      <strong>{data.projection.functions.length}</strong>
      <p>Governed enterprise capability catalogue</p>
    </article>
  </section>

  {#if data.canManage}
    <section class="deployment-admin">
      <header>
        <div>
          <p class="app-eyebrow">Controlled deployment</p>
          <h2>Configure operating responsibility</h2>
        </div>
        <p>
          Build the chain in order: create the Functional Deployment, assign a principal, define
          the exact responsibility scope, then allocate capacity.
        </p>
      </header>

      <div class="deployment-command-grid">
        <details>
          <summary>
            <span>01</span>
            <div>
              <strong>Create deployment</strong>
              <small>Function/L2 → Organisation/context</small>
            </div>
          </summary>
          <form method="POST" action="?/createDeployment" class="admin-form deployment-form">
            <label>
              <span>Capability</span>
              <select name="capability" required>
                <option value="">Select Function or L2</option>
                {#each data.projection.functions as fn}
                  <option value={`${fn.id}|`}>{fn.code} — {fn.name} (whole Function)</option>
                  {#each fn.subFunctions as subFunction}
                    <option value={`${fn.id}|${subFunction.id}`}>
                      {subFunction.code} — {subFunction.name}
                    </option>
                  {/each}
                {/each}
              </select>
            </label>

            <label>
              <span>Deployment purpose</span>
              <select name="deploymentPurpose" required>
                <option value="FUNCTIONAL_GOVERNANCE">Functional Governance</option>
                <option value="FUNCTIONAL_DELIVERY">Functional Delivery</option>
              </select>
            </label>

            <label>
              <span>Organisation scope</span>
              <select name="organisationScope" required>
                <option value="">Select Organisation or Unit</option>
                {#each data.projection.organisations as organisation}
                  <option value={`${organisation.id}|`}>
                    {organisation.name} (whole Organisation)
                  </option>
                  {#each organisation.units as unit}
                    <option value={`${organisation.id}|${unit.id}`}>
                      {organisation.name} · {unit.code} — {unit.name}
                    </option>
                  {/each}
                {/each}
              </select>
            </label>

            <label>
              <span>Operating context</span>
              <select name="context" required>
                <option value="TENANT|">Tenant-wide</option>
                <option value="ORGANISATION|">Organisation-wide</option>
                {#each data.projection.canonicalObjects as object}
                  {#if supportedContextTypes.has(object.objectType)}
                    <option value={`${object.objectType}|${object.id}`}>
                      {contextLabel(object.objectType, object.stableKey)}
                    </option>
                  {/if}
                {/each}
              </select>
            </label>

            <label>
              <span>Scope description</span>
              <textarea
                name="scopeDescription"
                rows="3"
                required
                placeholder="Describe the capability and operating scope being deployed."
              ></textarea>
            </label>

            <div class="admin-form-split">
              <label>
                <span>Effective from</span>
                <input name="effectiveFrom" type="datetime-local" />
              </label>
              <label>
                <span>Effective to</span>
                <input name="effectiveTo" type="datetime-local" />
              </label>
            </div>

            <button
              type="submit"
              disabled={data.projection.organisations.length === 0}
            >
              Create deployment <span>→</span>
            </button>
          </form>
        </details>

        <details>
          <summary>
            <span>02</span>
            <div>
              <strong>Assign responsibility</strong>
              <small>Deployment → Person/Position/Unit</small>
            </div>
          </summary>
          <form method="POST" action="?/createAssignment" class="admin-form deployment-form">
            <label>
              <span>Functional Deployment</span>
              <select name="functionalDeploymentId" required>
                <option value="">Select Deployment</option>
                {#each data.projection.deployments as deployment}
                  <option value={deployment.id}>
                    {deployment.functionCode}{deployment.subFunctionCode ? ` · ${deployment.subFunctionCode}` : ''}
                    — {deployment.organisationName}
                  </option>
                {/each}
              </select>
            </label>

            <label>
              <span>Assignee</span>
              <select name="principal" required>
                <option value="">Select Person, Position or Unit</option>
                {#each data.projection.principals as principal}
                  <option value={`${principal.type}|${principal.id}`}>
                    {principal.type.replaceAll('_', ' ')} · {principal.label}
                  </option>
                {/each}
              </select>
            </label>

            <label>
              <span>Job Profile</span>
              <select name="jobProfileId">
                <option value="">No Job Profile override</option>
                {#each data.projection.jobProfiles as profile}
                  <option value={profile.id}>
                    {profile.code} — {profile.name} ({profile.catalogueScope.toLowerCase()})
                  </option>
                {/each}
              </select>
            </label>

            <label>
              <span>Responsibility role</span>
              <select name="responsibilityRole" required>
                {#each responsibilityRoles as role}
                  <option value={role}>{role}</option>
                {/each}
              </select>
            </label>

            <div class="admin-form-split">
              <label>
                <span>Effective from</span>
                <input name="effectiveFrom" type="datetime-local" />
              </label>
              <label>
                <span>Effective to</span>
                <input name="effectiveTo" type="datetime-local" />
              </label>
            </div>

            <button
              type="submit"
              disabled={data.projection.deployments.length === 0 || data.projection.principals.length === 0}
            >
              Create assignment <span>→</span>
            </button>
          </form>
        </details>

        <details>
          <summary>
            <span>03</span>
            <div>
              <strong>Define responsibility scope</strong>
              <small>Exact responsibility boundary</small>
            </div>
          </summary>
          <form method="POST" action="?/createScope" class="admin-form deployment-form">
            <label>
              <span>Deployment Assignment</span>
              <select name="deploymentAssignmentId" required>
                <option value="">Select Assignment</option>
                {#each data.projection.deployments as deployment}
                  {#each deployment.assignments as assignment}
                    <option value={assignment.id}>
                      {deployment.functionCode} · {assignment.assigneeLabel} · {assignment.responsibilityRole}
                    </option>
                  {/each}
                {/each}
              </select>
            </label>

            <label>
              <span>Scope type</span>
              <select name="scopeType">
                <option value="TENANT">Tenant</option>
                <option value="ORGANISATION">Organisation</option>
                <option value="PROJECT">Project</option>
                <option value="CONTRACT">Contract</option>
                <option value="PACKAGE">Package</option>
                <option value="SITE">Site</option>
                <option value="ASSET">Asset</option>
                <option value="SERVICE">Service</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </label>

            <label>
              <span>Scope ID</span>
              <input
                name="scopeId"
                placeholder="Required for non-TENANT scope"
                autocomplete="off"
              />
            </label>

            <label>
              <span>Description</span>
              <textarea name="description" rows="3"></textarea>
            </label>

            <div class="admin-form-split">
              <label>
                <span>Effective from</span>
                <input name="effectiveFrom" type="datetime-local" />
              </label>
              <label>
                <span>Effective to</span>
                <input name="effectiveTo" type="datetime-local" />
              </label>
            </div>

            <button
              type="submit"
              disabled={data.projection.deployments.every((deployment) => deployment.assignments.length === 0)}
            >
              Add scope <span>→</span>
            </button>
          </form>
        </details>

        <details>
          <summary>
            <span>04</span>
            <div>
              <strong>Allocate capacity</strong>
              <small>Availability against assignment</small>
            </div>
          </summary>
          <form method="POST" action="?/createCapacity" class="admin-form deployment-form">
            <label>
              <span>Deployment Assignment</span>
              <select name="deploymentAssignmentId" required>
                <option value="">Select Assignment</option>
                {#each data.projection.deployments as deployment}
                  {#each deployment.assignments as assignment}
                    <option value={assignment.id}>
                      {deployment.functionCode} · {assignment.assigneeLabel} · {assignment.responsibilityRole}
                    </option>
                  {/each}
                {/each}
              </select>
            </label>

            <label>
              <span>Capacity percent</span>
              <input
                name="capacityPercent"
                type="number"
                min="0"
                max="100"
                step="0.01"
                required
              />
            </label>

            <div class="admin-form-split">
              <label>
                <span>Effective from</span>
                <input name="effectiveFrom" type="datetime-local" />
              </label>
              <label>
                <span>Effective to</span>
                <input name="effectiveTo" type="datetime-local" />
              </label>
            </div>

            <button
              type="submit"
              disabled={data.projection.deployments.every((deployment) => deployment.assignments.length === 0)}
            >
              Allocate capacity <span>→</span>
            </button>
          </form>
        </details>
      </div>
    </section>
  {/if}

  <section class="workspace-section deployment-register-section">
    <div class="workspace-section-heading">
      <div>
        <p class="app-eyebrow">Operating deployment register</p>
        <h2>Capability in context</h2>
      </div>
      <p>
        The register shows functional deployment separately from employment, access and Authority.
        Responsibility resolves through the assignment chain and capacity records current
        availability.
      </p>
    </div>

    {#if data.projection.deployments.length === 0}
      <section class="empty-work-state">
        <div class="empty-state-mark">DP</div>
        <div>
          <p class="app-eyebrow">Current tenant</p>
          <h2>No Functional Deployments exist yet.</h2>
          <p>
            Create the first deployment to connect a governed Function or L2 capability to an
            Organisation and operating context.
          </p>
        </div>
      </section>
    {:else}
      <div class="deployment-list">
        {#each data.projection.deployments as deployment}
          <article class="deployment-card">
            <header>
              <div class="deployment-capability">
                <span>{deployment.functionCode}</span>
                <div>
                  <h3>{deployment.functionName}</h3>
                  {#if deployment.subFunctionCode}
                    <p>{deployment.subFunctionCode} — {deployment.subFunctionName}</p>
                  {:else}
                    <p>Whole Function deployment</p>
                  {/if}
                </div>
              </div>

              <div class="deployment-context">
                <span>{deployment.deploymentPurpose.replaceAll('_', ' ')}</span>
                <strong>{deployment.contextType}</strong>
                <small>{deployment.organisationName}</small>
                {#if deployment.organisationUnitName}
                  <small>{deployment.organisationUnitName}</small>
                {/if}
              </div>
            </header>

            <div class="deployment-scope-bar">
              <p>{deployment.scopeDescription}</p>
              <span>
                {formatDate(deployment.effectiveFrom)}
                {deployment.effectiveTo ? ` → ${formatDate(deployment.effectiveTo)}` : ' → ongoing'}
              </span>
            </div>

            <div class="deployment-assignments">
              {#if deployment.assignments.length === 0}
                <p class="organisation-empty">No responsibility assignments yet.</p>
              {:else}
                {#each deployment.assignments as assignment}
                  <article>
                    <div class="assignment-principal">
                      <span>{assignment.assigneeType.replaceAll('_', ' ')}</span>
                      <strong>{assignment.assigneeLabel}</strong>
                      {#if assignment.jobProfileName}
                        <small>{assignment.jobProfileName}</small>
                      {/if}
                    </div>

                    <div class="assignment-responsibility">
                      <span>Responsibility</span>
                      <strong>{assignment.responsibilityRole}</strong>
                    </div>

                    <div class="assignment-capacity">
                      <span>Active capacity</span>
                      <strong>{assignment.activeCapacityPercent.toFixed(2)}%</strong>
                    </div>

                    <div class="assignment-scopes">
                      <span>Scopes</span>
                      {#if assignment.responsibilityScopes.length === 0}
                        <strong>No explicit scope</strong>
                      {:else}
                        {#each assignment.responsibilityScopes as scope}
                          <strong>
                            {scope.scopeType}{scope.scopeId ? ` · ${scope.scopeId}` : ''}
                            {scope.description ? ` — ${scope.description}` : ''}
                          </strong>
                        {/each}
                      {/if}
                    </div>
                  </article>
                {/each}
              {/if}
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </section>
{/if}
