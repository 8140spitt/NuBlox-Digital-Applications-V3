<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  function formatDate(value: string) {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value));
  }
</script>

<svelte:head>
  <title>Access Administration — NuBlox</title>
</svelte:head>

{#if !data.allowed || !data.projection}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit Access administration.</h1>
      <p>
        NuBlox evaluated <code>platform.access.manage</code> in the current tenant scope and did not
        find an active matching Access Role Assignment.
      </p>
      <p class="permission-reason">{data.reason}</p>
      <a class="primary-action permission-back" href="/app">
        Back to Functions
        <span aria-hidden="true">→</span>
      </a>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact access-hero">
    <div>
      <p class="app-eyebrow">Platform control plane</p>
      <h1>Access</h1>
      <p class="workspace-lede">
        Define tenant Access Roles, compose them from explicit Permission Definitions, and assign
        them to People, Positions or Organisation Units in controlled scope. Access never implies
        business Decision Authority.
      </p>
    </div>
  </section>

  {#if form?.message || form?.error}
    <div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
      <strong>{form?.ok ? 'Completed' : 'Action not completed'}</strong>
      <span>{form?.message ?? form?.error}</span>
    </div>
  {/if}

  <section class="architecture-metrics access-metrics" aria-label="Access control totals">
    <article>
      <span>Roles</span>
      <strong>{data.projection.roles.length}</strong>
      <p>
        {data.projection.roles.filter((role) => role.catalogueScope === 'TENANT').length} tenant-defined
      </p>
    </article>
    <article>
      <span>Permissions</span>
      <strong>{data.projection.permissions.length}</strong>
      <p>Explicit platform permission definitions</p>
    </article>
    <article>
      <span>Assignments</span>
      <strong>{data.projection.assignments.length}</strong>
      <p>Current and historical tenant role assignments</p>
    </article>
    <article>
      <span>Principals</span>
      <strong>{data.projection.principals.length}</strong>
      <p>People, Positions and Organisation Units</p>
    </article>
  </section>

  <section class="access-command-grid">
    <article>
      <header>
        <span>01</span>
        <div>
          <h2>Create tenant role</h2>
          <p>Define a reusable tenant Access Role.</p>
        </div>
      </header>
      <form method="POST" action="?/createRole" class="admin-form access-form">
        <label>
          <span>Role code</span>
          <input name="code" required maxlength="80" autocomplete="off" />
        </label>
        <label>
          <span>Role name</span>
          <input name="name" required maxlength="255" />
        </label>
        <label class="wide-field">
          <span>Description</span>
          <textarea name="description" rows="3"></textarea>
        </label>
        <button type="submit">Create Role <span>→</span></button>
      </form>
    </article>

    <article>
      <header>
        <span>02</span>
        <div>
          <h2>Grant permission</h2>
          <p>Compose a tenant role from governed Permission Definitions.</p>
        </div>
      </header>
      <form method="POST" action="?/grantPermission" class="admin-form access-form">
        <label>
          <span>Tenant Access Role</span>
          <select name="accessRoleId" required>
            <option value="">Select Role</option>
            {#each data.projection.roles as role}
              {#if role.catalogueScope === 'TENANT'}
                <option value={role.id}>{role.code} — {role.name}</option>
              {/if}
            {/each}
          </select>
        </label>
        <label>
          <span>Permission</span>
          <select name="permissionKey" required>
            <option value="">Select Permission</option>
            {#each data.projection.permissions as permission}
              <option value={permission.key}>{permission.key} — {permission.name}</option>
            {/each}
          </select>
        </label>
        <button
          type="submit"
          disabled={data.projection.roles.every((role) => role.catalogueScope !== 'TENANT')}
        >
          Grant Permission <span>→</span>
        </button>
      </form>
    </article>

    <article>
      <header>
        <span>03</span>
        <div>
          <h2>Assign role</h2>
          <p>Assign an available role to a tenant principal.</p>
        </div>
      </header>
      <form method="POST" action="?/assignRole" class="admin-form access-form">
        <label>
          <span>Access Role</span>
          <select name="accessRoleId" required>
            <option value="">Select Role</option>
            {#each data.projection.roles as role}
              <option value={role.id}>
                {role.code} — {role.name} ({role.catalogueScope.toLowerCase()})
              </option>
            {/each}
          </select>
        </label>
        <label>
          <span>Principal</span>
          <select name="principal" required>
            <option value="">Select Person, Position or Unit</option>
            {#each data.projection.principals as principal}
              <option value={`${principal.type}|${principal.id}`}>
                {principal.type.replaceAll('_', ' ')} · {principal.label}
              </option>
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
        <p class="access-scope-note">
          This first administration surface creates tenant-scoped assignments. Object-specific
          scopes remain supported by the kernel and will be exposed in their owning workspaces.
        </p>
        <button type="submit" disabled={data.projection.principals.length === 0}>
          Assign Role <span>→</span>
        </button>
      </form>
    </article>
  </section>

  <div class="access-two-column">
    <section class="workspace-panel">
      <div class="panel-heading">
        <div>
          <p class="app-eyebrow">Role catalogue</p>
          <h2>Roles &amp; permissions</h2>
        </div>
        <span>{data.projection.roles.length}</span>
      </div>

      <div class="access-role-list">
        {#each data.projection.roles as role}
          <article>
            <header>
              <div>
                <span class="access-role-scope">{role.catalogueScope}</span>
                <h3>{role.code} — {role.name}</h3>
                {#if role.description}
                  <p>{role.description}</p>
                {/if}
              </div>
              <strong>{role.permissionKeys.length} permissions</strong>
            </header>
            <div class="permission-chip-list">
              {#if role.permissionKeys.length === 0}
                <span class="permission-chip empty">No permissions granted</span>
              {:else}
                {#each role.permissionKeys as permissionKey}
                  <span class="permission-chip">{permissionKey}</span>
                {/each}
              {/if}
            </div>
          </article>
        {/each}
      </div>
    </section>

    <section class="workspace-panel">
      <div class="panel-heading">
        <div>
          <p class="app-eyebrow">Effective access</p>
          <h2>Role assignments</h2>
        </div>
        <span>{data.projection.assignments.length}</span>
      </div>

      <div class="access-assignment-list">
        {#if data.projection.assignments.length === 0}
          <p class="organisation-empty">No role assignments exist in this tenant.</p>
        {:else}
          {#each data.projection.assignments as assignment}
            <article>
              <div>
                <span>{assignment.principalType.replaceAll('_', ' ')}</span>
                <strong>{assignment.principalLabel}</strong>
              </div>
              <div>
                <span>Role</span>
                <strong>{assignment.roleName}</strong>
              </div>
              <div>
                <span>Scope</span>
                <strong>
                  {assignment.scopeType}{assignment.scopeId ? ` · ${assignment.scopeId}` : ''}
                </strong>
              </div>
              <div>
                <span>Effective</span>
                <strong>
                  {formatDate(assignment.effectiveFrom)}
                  {assignment.effectiveTo ? ` → ${formatDate(assignment.effectiveTo)}` : ''}
                </strong>
              </div>
            </article>
          {/each}
        {/if}
      </div>
    </section>
  </div>

  <section class="workspace-panel permission-definition-panel">
    <div class="panel-heading">
      <div>
        <p class="app-eyebrow">Permission catalogue</p>
        <h2>Explicit capabilities</h2>
      </div>
      <span>{data.projection.permissions.length}</span>
    </div>

    <div class="permission-definition-list">
      {#each data.projection.permissions as permission}
        <article>
          <code>{permission.key}</code>
          <div>
            <strong>{permission.name}</strong>
            <p>{permission.description}</p>
          </div>
        </article>
      {/each}
    </div>
  </section>
{/if}
