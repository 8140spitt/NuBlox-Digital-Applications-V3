<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  function label(value: string) {
    return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function dateTime(value: string) {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  function scopeName(scopeId: string) {
    return data.projection?.scopes.find((scope) => scope.id === scopeId)?.name ?? scopeId;
  }
</script>

<svelte:head>
  <title>Policy Governance — NuBlox</title>
</svelte:head>

{#if !data.allowed || !data.projection}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit Policy Governance access.</h1>
      <p>
        NuBlox evaluated <code>platform.policy.read</code> in the current tenant scope and did not
        find an active matching Access Role Assignment.
      </p>
      <p class="permission-reason">{data.reason}</p>
      <div class="permission-actions">
        <a
          class="primary-action permission-back"
          href="/app/request-access?permission=platform.policy.read&returnTo=/app/policy"
        >
          Request access
          <span aria-hidden="true">→</span>
        </a>
        <a class="quiet-link" href="/app">Back to Functions</a>
      </div>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact">
    <div>
      <p class="app-eyebrow">Shared control plane</p>
      <h1>Policy Governance</h1>
      <p class="workspace-lede">
        Govern policy independently from Organisation and Context hierarchy. Policies can be
        inherited, supplemented, locally overridden or explicitly blocked while retaining the
        provenance of why an effective policy applies.
      </p>
    </div>
  </section>

  {#if form?.message || form?.error}
    <div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
      <strong>{form?.ok ? 'Completed' : 'Action not completed'}</strong>
      <span>{form?.message ?? form?.error}</span>
    </div>
  {/if}

  {#if !data.canManage}
    <section class="workspace-panel">
      <div class="panel-heading">
        <div>
          <p class="app-eyebrow">Read-only governance</p>
          <h2>Policy administration is separately permissioned</h2>
        </div>
      </div>
      <p>
        You can inspect governed policy, but changes require
        <code>platform.policy.manage</code>.
        <a href="/app/request-access?permission=platform.policy.manage&returnTo=/app/policy">
          Request Policy administration access
        </a>.
      </p>
    </section>
  {/if}

  <section class="architecture-metrics" aria-label="Policy governance totals">
    <article>
      <span>Policy scopes</span>
      <strong>{data.projection.scopes.length}</strong>
      <p>Independent policy inheritance scopes</p>
    </article>
    <article>
      <span>Definitions</span>
      <strong>{data.projection.definitions.length}</strong>
      <p>Versioned governed policy definitions</p>
    </article>
    <article>
      <span>Assignments</span>
      <strong>{data.projection.assignments.length}</strong>
      <p>Supplement, override and block controls</p>
    </article>
    <article>
      <span>Active</span>
      <strong>{data.projection.assignments.filter((item) => item.status === 'ACTIVE').length}</strong>
      <p>Current assignment records</p>
    </article>
  </section>

  {#if data.canManage}
    <section class="access-command-grid">
      <article>
        <header>
          <span>01</span>
          <div>
            <h2>Create policy scope</h2>
            <p>Create a policy hierarchy without changing Organisation or Context hierarchy.</p>
          </div>
        </header>
        <form method="POST" action="?/createScope" class="admin-form access-form">
          <label>
            <span>Scope code</span>
            <input name="code" required maxlength="80" autocomplete="off" />
          </label>
          <label>
            <span>Scope name</span>
            <input name="name" required maxlength="255" />
          </label>
          <label>
            <span>Scope type</span>
            <select name="scopeType" required>
              <option value="TENANT">Tenant</option>
              <option value="ORGANISATION">Organisation</option>
              <option value="ORGANISATION_UNIT">Organisation Unit</option>
              <option value="PROGRAMME">Programme</option>
              <option value="PROJECT">Project</option>
              <option value="CONTRACT">Contract</option>
              <option value="WORK_PACKAGE">Work Package</option>
              <option value="SITE">Site</option>
              <option value="ASSET">Asset</option>
              <option value="SERVICE">Service</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </label>
          <label>
            <span>Bound object ID</span>
            <input name="scopeObjectId" placeholder="Leave blank only for TENANT scope" />
          </label>
          <label class="wide-field">
            <span>Parent policy scope</span>
            <select name="parentPolicyScopeId">
              <option value="">No parent</option>
              {#each data.projection.scopes.filter((scope) => scope.status === 'ACTIVE') as scope}
                <option value={scope.id}>{scope.code} — {scope.name}</option>
              {/each}
            </select>
          </label>
          <button type="submit">Create Scope <span>→</span></button>
        </form>
      </article>

      <article>
        <header>
          <span>02</span>
          <div>
            <h2>Create policy definition</h2>
            <p>Version policy independently from its assignments to operating scopes.</p>
          </div>
        </header>
        <form method="POST" action="?/createDefinition" class="admin-form access-form">
          <label>
            <span>Policy code</span>
            <input name="code" required maxlength="80" autocomplete="off" />
          </label>
          <label>
            <span>Policy name</span>
            <input name="name" required maxlength="255" />
          </label>
          <label>
            <span>Policy type</span>
            <select name="policyType" required>
              <option value="ACCESS">Access</option>
              <option value="SECURITY">Security</option>
              <option value="GOVERNANCE">Governance</option>
              <option value="CONFIGURATION">Configuration</option>
              <option value="CREATION">Creation</option>
              <option value="RETENTION">Retention</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </label>
          <label>
            <span>Version</span>
            <input name="version" type="number" min="1" step="1" value="1" required />
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
          <label class="wide-field">
            <span>Description</span>
            <textarea name="description" rows="3"></textarea>
          </label>
          <button type="submit">Create Definition <span>→</span></button>
        </form>
      </article>

      <article>
        <header>
          <span>03</span>
          <div>
            <h2>Assign policy</h2>
            <p>Supplement, override or block a policy at an explicit policy scope.</p>
          </div>
        </header>
        <form method="POST" action="?/assignPolicy" class="admin-form access-form">
          <label>
            <span>Policy scope</span>
            <select name="policyScopeId" required>
              <option value="">Select scope</option>
              {#each data.projection.scopes.filter((scope) => scope.status === 'ACTIVE') as scope}
                <option value={scope.id}>{scope.code} — {scope.name}</option>
              {/each}
            </select>
          </label>
          <label>
            <span>Policy definition</span>
            <select name="policyDefinitionId" required>
              <option value="">Select definition</option>
              {#each data.projection.definitions.filter((definition) => definition.status === 'ACTIVE') as definition}
                <option value={definition.id}>
                  {definition.code} v{definition.version} — {definition.name}
                </option>
              {/each}
            </select>
          </label>
          <label>
            <span>Assignment mode</span>
            <select name="assignmentMode" required>
              <option value="SUPPLEMENT">Supplement</option>
              <option value="OVERRIDE">Override</option>
              <option value="BLOCK">Block inherited policy</option>
            </select>
          </label>
          <label>
            <span>Precedence</span>
            <input name="precedence" type="number" min="0" step="1" value="0" required />
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
          <button type="submit">Assign Policy <span>→</span></button>
        </form>
      </article>
    </section>
  {/if}

  <div class="control-workspace-grid">
    <section class="workspace-panel">
      <div class="panel-heading">
        <div>
          <p class="app-eyebrow">Policy scope hierarchy</p>
          <h2>Scopes</h2>
        </div>
        <span>{data.projection.scopes.length}</span>
      </div>

      <div class="control-table">
        {#if data.projection.scopes.length === 0}
          <p class="control-empty">No Policy Scopes have been created.</p>
        {:else}
          {#each data.projection.scopes as scope}
            <article>
              <div>
                <span class="control-type">{label(scope.scopeType)}</span>
                <strong>{scope.code} — {scope.name}</strong>
                <small>{scope.id}</small>
              </div>
              <div>
                <span>Parent</span>
                <strong>{scope.parentPolicyScopeId ? scopeName(scope.parentPolicyScopeId) : 'Root'}</strong>
              </div>
              <div>
                <span>Bound object</span>
                <strong>{scope.scopeObjectId ?? 'Tenant'}</strong>
              </div>
            </article>
          {/each}
        {/if}
      </div>
    </section>

    <section class="workspace-panel">
      <div class="panel-heading">
        <div>
          <p class="app-eyebrow">Versioned policy</p>
          <h2>Definitions</h2>
        </div>
        <span>{data.projection.definitions.length}</span>
      </div>

      <div class="control-record-list">
        {#if data.projection.definitions.length === 0}
          <p class="control-empty">No Policy Definitions have been created.</p>
        {:else}
          {#each data.projection.definitions as definition}
            <article>
              <header>
                <span>{label(definition.policyType)}</span>
                <strong>v{definition.version}</strong>
              </header>
              <h3>{definition.code} — {definition.name}</h3>
              {#if definition.description}<p>{definition.description}</p>{/if}
              <footer>
                <span>{definition.status}</span>
                {#if definition.effectiveFrom}<span>From {dateTime(definition.effectiveFrom)}</span>{/if}
                {#if definition.effectiveTo}<span>To {dateTime(definition.effectiveTo)}</span>{/if}
              </footer>
            </article>
          {/each}
        {/if}
      </div>
    </section>
  </div>

  <section class="workspace-panel">
    <div class="panel-heading">
      <div>
        <p class="app-eyebrow">Inheritance controls</p>
        <h2>Policy assignments</h2>
      </div>
      <span>{data.projection.assignments.length}</span>
    </div>

    <div class="access-assignment-list">
      {#if data.projection.assignments.length === 0}
        <p class="control-empty">No Policy Assignments have been created.</p>
      {:else}
        {#each data.projection.assignments as assignment}
          <article>
            <div>
              <span>Scope</span>
              <strong>{assignment.scopeCode} — {assignment.scopeName}</strong>
            </div>
            <div>
              <span>Policy</span>
              <strong>{assignment.definitionCode} v{assignment.version}</strong>
            </div>
            <div>
              <span>Mode</span>
              <strong>{label(assignment.assignmentMode)}</strong>
            </div>
            <div>
              <span>Precedence</span>
              <strong>{assignment.precedence}</strong>
            </div>
          </article>
        {/each}
      {/if}
    </div>
  </section>
{/if}
