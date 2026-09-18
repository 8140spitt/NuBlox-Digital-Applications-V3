<script lang="ts">
  let { data, form } = $props();
  const activeMemberships = $derived(data.memberships.filter((item: any) => item.status === 'ACTIVE'));
  const activeRoles = $derived(data.roles.filter((item: any) => item.status === 'ACTIVE'));
  const activeAssignments = $derived(data.assignments.filter((item: any) => item.status === 'ACTIVE'));
</script>

<svelte:head>
  <title>Security administration · NuBlox</title>
</svelte:head>

<div class="workspace-page security-page">
  <header class="page-header">
    <div>
      <p class="eyebrow">Tenant administration</p>
      <h1>Security &amp; access</h1>
      <p class="intro">Govern tenant membership, role-based authority and authenticated identity links from one controlled workspace.</p>
    </div>
    <div class="summary" aria-label="Security summary">
      <span><strong>{activeMemberships.length}</strong> active members</span>
      <span><strong>{activeRoles.length}</strong> active roles</span>
      <span><strong>{data.identities.filter((item: any) => item.status === 'ACTIVE').length}</strong> active identities</span>
    </div>
  </header>

  {#if form?.message}
    <div class="message error" role="alert">{form.message}</div>
  {/if}

  <nav class="view-tabs" aria-label="Security administration sections">
    <a class:active={data.view === 'access'} href="?view=access">Membership &amp; access</a>
    <a class:active={data.view === 'roles'} href="?view=roles">Roles &amp; permissions</a>
    <a class:active={data.view === 'identities'} href="?view=identities">Authenticated identities</a>
  </nav>

  {#if data.view === 'access'}
    <div class="two-column">
      <section class="section-card card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Membership</p>
            <h2>Tenant members</h2>
          </div>
          <span class="count">{activeMemberships.length}</span>
        </div>

        <form method="POST" action="?/grantMembership" class="compact-form">
          <label>
            <span>Person</span>
            <select name="partyId" required>
              <option value="">Choose a person</option>
              {#each data.people.filter((person: any) => person.status === 'ACTIVE') as person}
                <option value={person.id}>{person.displayName}</option>
              {/each}
            </select>
          </label>
          <label>
            <span>Membership type</span>
            <select name="membershipType">
              <option value="INTERNAL">Internal</option>
              <option value="EXTERNAL">External</option>
              <option value="SERVICE">Service</option>
            </select>
          </label>
          <button type="submit">Grant membership</button>
        </form>

        <div class="table-wrap">
          <table>
            <thead><tr><th>Person</th><th>Type</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {#each data.memberships as membership}
                <tr>
                  <td>{membership.displayName}</td>
                  <td>{membership.membershipType}</td>
                  <td><span class:active-status={membership.status === 'ACTIVE'} class="status">{membership.status}</span></td>
                  <td class="actions">
                    {#if membership.status === 'ACTIVE'}
                      <form method="POST" action="?/revokeMembership">
                        <input type="hidden" name="membershipId" value={membership.id} />
                        <button class="text-button danger" type="submit">Revoke</button>
                      </form>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>

      <section class="section-card card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Authority</p>
            <h2>Role assignments</h2>
          </div>
          <span class="count">{activeAssignments.length}</span>
        </div>

        <form method="POST" action="?/assignRole" class="compact-form">
          <label>
            <span>Member</span>
            <select name="partyId" required>
              <option value="">Choose a member</option>
              {#each activeMemberships as membership}
                <option value={membership.partyId}>{membership.displayName}</option>
              {/each}
            </select>
          </label>
          <label>
            <span>Role</span>
            <select name="roleId" required>
              <option value="">Choose a role</option>
              {#each activeRoles as role}
                <option value={role.id}>{role.name}</option>
              {/each}
            </select>
          </label>
          <button type="submit">Assign role</button>
        </form>

        <div class="table-wrap">
          <table>
            <thead><tr><th>Person</th><th>Role</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {#each data.assignments as assignment}
                <tr>
                  <td>{assignment.displayName}</td>
                  <td><strong>{assignment.roleName}</strong><small>{assignment.roleKey}</small></td>
                  <td><span class:active-status={assignment.status === 'ACTIVE'} class="status">{assignment.status}</span></td>
                  <td class="actions">
                    {#if assignment.status === 'ACTIVE'}
                      <form method="POST" action="?/unassignRole">
                        <input type="hidden" name="assignmentId" value={assignment.id} />
                        <button class="text-button danger" type="submit">Remove</button>
                      </form>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  {:else if data.view === 'roles'}
    <section class="section-card card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">RBAC</p>
          <h2>Roles &amp; permissions</h2>
          <p>Roles are tenant-scoped authority bundles. Changes are audited and version the Tenant aggregate.</p>
        </div>
        <details class="create-panel">
          <summary>Create role</summary>
          <form method="POST" action="?/createRole" class="role-form">
            <div class="form-row">
              <label><span>Role key</span><input name="roleKey" placeholder="commercial-manager" required /></label>
              <label><span>Name</span><input name="name" placeholder="Commercial Manager" required /></label>
            </div>
            <fieldset>
              <legend>Permissions</legend>
              <div class="permission-grid">
                {#each data.permissions as permission}
                  <label class="permission">
                    <input type="checkbox" name="permission" value={permission.key} />
                    <span><strong>{permission.key}</strong><small>{permission.description}</small></span>
                  </label>
                {/each}
              </div>
            </fieldset>
            <button type="submit">Create role</button>
          </form>
        </details>
      </div>

      <div class="role-list">
        {#each data.roles as role}
          <details class="role" open={role.roleKey === 'tenant-admin'}>
            <summary>
              <span><strong>{role.name}</strong><small>{role.roleKey}</small></span>
              <span class:active-status={role.status === 'ACTIVE'} class="status">{role.status}</span>
            </summary>
            <form method="POST" action="?/updateRole" class="role-form">
              <input type="hidden" name="roleId" value={role.id} />
              <label class="single-field"><span>Role name</span><input name="name" value={role.name} required /></label>
              <fieldset>
                <legend>Permissions</legend>
                <div class="permission-grid">
                  {#each data.permissions as permission}
                    <label class="permission">
                      <input type="checkbox" name="permission" value={permission.key} checked={role.permissions.includes(permission.key)} />
                      <span><strong>{permission.key}</strong><small>{permission.description}</small></span>
                    </label>
                  {/each}
                </div>
              </fieldset>
              <div class="button-row">
                {#if role.status === 'ACTIVE'}
                  <button type="submit">Save role</button>
                  <button class="secondary danger" type="submit" formaction="?/deactivateRole">Deactivate</button>
                {:else}
                  <button class="secondary" type="submit" formaction="?/reactivateRole">Reactivate</button>
                {/if}
              </div>
            </form>
          </details>
        {/each}
      </div>
    </section>
  {:else}
    <section class="section-card card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Authentication mapping</p>
          <h2>Authenticated identities</h2>
          <p>Authentication accounts are deliberately separate from Party identity and tenant business authority.</p>
        </div>
      </div>

      <form method="POST" action="?/linkIdentity" class="compact-form identity-form">
        <label>
          <span>Person</span>
          <select name="partyId" required>
            <option value="">Choose a person</option>
            {#each data.people.filter((person: any) => person.status === 'ACTIVE') as person}
              <option value={person.id}>{person.displayName}</option>
            {/each}
          </select>
        </label>
        <label>
          <span>Authentication account email</span>
          <input name="email" type="email" autocomplete="off" placeholder="name@company.com" required />
        </label>
        <button type="submit">Link identity</button>
      </form>

      <div class="table-wrap">
        <table>
          <thead><tr><th>Party</th><th>Identity</th><th>Provider</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {#each data.identities as identity}
              <tr>
                <td>{identity.partyDisplayName}</td>
                <td>{identity.displayName}</td>
                <td>{identity.provider}</td>
                <td><span class:active-status={identity.status === 'ACTIVE'} class="status">{identity.status}</span></td>
                <td class="actions">
                  {#if identity.status === 'ACTIVE'}
                    <form method="POST" action="?/deactivateIdentity">
                      <input type="hidden" name="identityId" value={identity.id} />
                      <button class="text-button danger" type="submit">Deactivate</button>
                    </form>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="note">For security, account discovery is exact-email only; the workspace never exposes the global authentication directory.</p>
    </section>
  {/if}
</div>

<style>
  .security-page { max-width: 1500px; margin: 0 auto; }
  .page-header { display: flex; justify-content: space-between; gap: 28px; align-items: end; padding: 10px 4px 2px; }
  .eyebrow { margin: 0 0 5px; color: var(--blue-700); font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
  h1, h2 { margin: 0; color: var(--navy-950); letter-spacing: -.025em; }
  h1 { font-size: 28px; }
  h2 { font-size: 18px; }
  .intro, .section-heading p { margin: 7px 0 0; color: var(--muted); font-size: 12.5px; line-height: 1.55; max-width: 720px; }
  .summary { display: flex; gap: 8px; flex-wrap: wrap; justify-content: end; }
  .summary span { border: 1px solid var(--line); border-radius: 8px; padding: 7px 10px; background: white; color: var(--muted); font-size: 11px; white-space: nowrap; }
  .summary strong { color: var(--navy-900); font-size: 14px; margin-right: 3px; }
  .view-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--line); }
  .view-tabs a { padding: 10px 14px; color: var(--muted); text-decoration: none; font-size: 12px; font-weight: 650; border-bottom: 2px solid transparent; }
  .view-tabs a.active { color: var(--navy-900); border-bottom-color: var(--blue-700); }
  .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; min-width: 0; }
  .card { min-width: 0; padding: 16px; }
  .section-heading { display: flex; justify-content: space-between; align-items: start; gap: 18px; margin-bottom: 14px; }
  .count { display: grid; place-items: center; min-width: 30px; height: 30px; padding: 0 8px; border-radius: 999px; background: var(--blue-100); color: var(--navy-900); font-weight: 760; font-size: 12px; }
  .compact-form { display: grid; grid-template-columns: minmax(0,1fr) minmax(140px,.55fr) auto; gap: 8px; align-items: end; padding: 11px; margin-bottom: 12px; border: 1px solid var(--line); border-radius: 9px; background: var(--surface); }
  .identity-form { grid-template-columns: minmax(0,1fr) minmax(220px,1fr) auto; }
  label { display: grid; gap: 5px; color: var(--ink); font-size: 11px; font-weight: 670; }
  input, select { min-width: 0; width: 100%; height: 36px; border: 1px solid #c4d0d9; border-radius: 7px; padding: 0 9px; background: white; color: var(--ink); }
  button { min-height: 36px; border: 0; border-radius: 7px; padding: 0 12px; background: var(--navy-900); color: white; font-weight: 680; font-size: 11.5px; cursor: pointer; }
  button:hover { background: var(--navy-800); }
  .secondary { background: white; color: var(--navy-900); border: 1px solid var(--line); }
  .danger { color: #9a3434; }
  button.secondary.danger { border-color: #e0b6b6; color: #8a3030; }
  .table-wrap { overflow: auto; border: 1px solid var(--line); border-radius: 8px; }
  table { width: 100%; border-collapse: collapse; min-width: 520px; }
  th { padding: 8px 10px; background: #f5f8fa; border-bottom: 1px solid var(--line); color: #6a7a88; text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: .055em; }
  td { padding: 9px 10px; border-bottom: 1px solid #edf1f4; color: var(--ink); font-size: 11.5px; vertical-align: middle; }
  tr:last-child td { border-bottom: 0; }
  td small { display: block; margin-top: 2px; color: var(--muted); font-size: 10px; }
  .actions { width: 1%; text-align: right; }
  .actions form { display: inline; }
  .text-button { min-height: 0; padding: 4px 6px; background: transparent; color: var(--blue-700); }
  .text-button:hover { background: var(--blue-100); }
  .status { display: inline-flex; padding: 3px 6px; border-radius: 999px; background: #eef1f4; color: #667786; font-size: 9px; font-weight: 800; letter-spacing: .04em; }
  .status.active-status { background: #e7f5e9; color: #356b3e; }
  .create-panel { min-width: 190px; }
  .create-panel > summary { cursor: pointer; list-style: none; border: 1px solid var(--line); border-radius: 7px; padding: 8px 11px; color: var(--navy-900); font-size: 11.5px; font-weight: 680; background: white; text-align: center; }
  .create-panel[open] { width: min(100%, 760px); }
  .create-panel[open] > summary { margin-bottom: 10px; }
  .role-list { display: grid; gap: 8px; }
  .role { border: 1px solid var(--line); border-radius: 9px; background: white; }
  .role > summary { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 11px 13px; cursor: pointer; }
  .role > summary strong, .role > summary small { display: block; }
  .role > summary small { color: var(--muted); font-size: 10px; margin-top: 2px; }
  .role-form { display: grid; gap: 12px; border-top: 1px solid var(--line); padding: 13px; background: #fbfcfd; }
  .form-row { display: grid; grid-template-columns: .7fr 1.3fr; gap: 10px; }
  .single-field { max-width: 440px; }
  fieldset { border: 0; padding: 0; margin: 0; }
  legend { margin-bottom: 7px; color: var(--ink); font-size: 11px; font-weight: 720; }
  .permission-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 6px; }
  .permission { grid-template-columns: auto minmax(0,1fr); align-items: start; gap: 7px; padding: 8px; border: 1px solid #e0e7ed; border-radius: 7px; background: white; font-weight: 400; cursor: pointer; }
  .permission input { width: 14px; height: 14px; margin: 2px 0 0; }
  .permission strong { display: block; color: var(--navy-900); font-size: 10px; }
  .permission small { display: block; margin-top: 2px; color: var(--muted); font-size: 9px; line-height: 1.35; }
  .button-row { display: flex; gap: 8px; }
  .message { border-radius: 8px; padding: 10px 12px; font-size: 12px; }
  .message.error { border: 1px solid #e0b6b6; background: #fff4f4; color: #843434; }
  .note { margin: 10px 2px 0; color: var(--muted); font-size: 10.5px; }
  @media (max-width: 1100px) { .two-column { grid-template-columns: 1fr; } .permission-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } }
  @media (max-width: 760px) { .page-header { display: grid; } .summary { justify-content: start; } .compact-form, .identity-form, .form-row { grid-template-columns: 1fr; } .permission-grid { grid-template-columns: 1fr; } .view-tabs { overflow-x: auto; } }
</style>
