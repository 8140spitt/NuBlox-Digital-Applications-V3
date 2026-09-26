<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  function formatDate(value: string | null) {
    if (!value) return '—';
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  function stateLabel(value: string) {
    return value.toLowerCase().replaceAll('_', ' ');
  }
</script>

<svelte:head>
  <title>NuBlox Platform Administration</title>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<main class="platform-shell">
  <header class="platform-header">
    <div>
      <p class="platform-eyebrow">NuBlox Operator Control Plane</p>
      <h1>Tenant administration</h1>
      <p>
        Service-provider controls for NuBlox Tenants. This authority is separate from every Tenant's own administration.
      </p>
    </div>
    <div class="operator-block">
      <strong>{data.operator.displayName}</strong>
      <span>{data.operator.role.replaceAll('_', ' ')}</span>
      <a href="/platform/logout">Sign out</a>
    </div>
  </header>

  <section class="platform-summary">
    <article>
      <strong>{data.tenants.length}</strong>
      <span>Tenants shown</span>
    </article>
    <article>
      <strong>{data.tenants.filter((tenant) => tenant.lifecycleState === 'ACTIVE').length}</strong>
      <span>Active</span>
    </article>
    <article>
      <strong>{data.tenants.filter((tenant) => tenant.lifecycleState === 'SUSPENDED').length}</strong>
      <span>Suspended</span>
    </article>
    <article>
      <strong>{data.tenants.filter((tenant) => tenant.lifecycleState === 'DELETION_REQUESTED').length}</strong>
      <span>Deletion requested</span>
    </article>
  </section>

  <section class="platform-panel">
    <form method="GET" class="search-form">
      <label>
        <span>Find a Tenant</span>
        <input name="q" value={data.search} placeholder="Business name, slug or Tenant ID" />
      </label>
      <button type="submit">Search</button>
      {#if data.search}<a href="/platform">Clear</a>{/if}
    </form>
  </section>

  {#if form?.error}
    <p class="platform-message error">{form.error}</p>
  {:else if form?.success}
    <p class="platform-message success">Tenant lifecycle updated.</p>
  {/if}

  <section class="tenant-list">
    {#if data.tenants.length === 0}
      <div class="platform-panel"><p>No Tenants matched the current search.</p></div>
    {:else}
      {#each data.tenants as tenant}
        <article class="tenant-card">
          <div class="tenant-heading">
            <div>
              <div class="tenant-title-row">
                <h2>{tenant.name}</h2>
                <span class:danger={tenant.lifecycleState === 'DELETED'} class:warning={tenant.lifecycleState === 'SUSPENDED' || tenant.lifecycleState === 'DELETION_REQUESTED'} class="state-chip">
                  {stateLabel(tenant.lifecycleState)}
                </span>
              </div>
              <p><code>{tenant.slug}</code> · <code>{tenant.tenantId}</code></p>
            </div>
            {#if tenant.lifecycleState === 'ACTIVE'}
              <div class="tenant-links">
                <a href={`/${tenant.slug}/app`}>Open app</a>
                <a href={`/${tenant.slug}/public`}>Open public site</a>
              </div>
            {/if}
          </div>

          <dl class="tenant-facts">
            <div><dt>Members</dt><dd>{tenant.memberCount}</dd></div>
            <div><dt>Active sessions</dt><dd>{tenant.activeSessionCount}</dd></div>
            <div><dt>Created</dt><dd>{formatDate(tenant.createdAt)}</dd></div>
            <div><dt>Tenant status</dt><dd>{tenant.tenantStatus}</dd></div>
          </dl>

          {#if tenant.lifecycleReason}
            <p class="lifecycle-reason"><strong>Latest lifecycle reason:</strong> {tenant.lifecycleReason}</p>
          {/if}
          {#if tenant.deletionRequestedAt}
            <p class="lifecycle-reason"><strong>Deletion requested:</strong> {formatDate(tenant.deletionRequestedAt)}</p>
          {/if}
          {#if tenant.deletedAt}
            <p class="lifecycle-reason"><strong>Deleted from service:</strong> {formatDate(tenant.deletedAt)}</p>
          {/if}

          {#if data.operator.role !== 'READ_ONLY' && tenant.lifecycleState !== 'DELETED'}
            <div class="tenant-actions">
              {#if tenant.lifecycleState === 'ACTIVE'}
                <form method="POST" action="?/suspend" class="action-form">
                  <input type="hidden" name="tenantId" value={tenant.tenantId} />
                  <label>
                    <span>Suspension reason</span>
                    <input name="reason" minlength="8" required placeholder="Why access is being suspended" />
                  </label>
                  <button type="submit">Suspend Tenant</button>
                </form>
              {:else if tenant.lifecycleState === 'SUSPENDED' || tenant.lifecycleState === 'DELETION_REQUESTED'}
                <form method="POST" action="?/reactivate" class="action-form">
                  <input type="hidden" name="tenantId" value={tenant.tenantId} />
                  <label>
                    <span>Reactivation reason</span>
                    <input name="reason" minlength="8" required placeholder="Why access is being restored" />
                  </label>
                  <button type="submit">Reactivate Tenant</button>
                </form>
              {/if}

              {#if data.operator.role === 'SUPER_ADMIN' && tenant.lifecycleState !== 'DELETION_REQUESTED'}
                <form method="POST" action="?/requestDeletion" class="action-form danger-zone">
                  <input type="hidden" name="tenantId" value={tenant.tenantId} />
                  <label>
                    <span>Deletion reason</span>
                    <input name="reason" minlength="8" required placeholder="Why this Tenant must be removed from service" />
                  </label>
                  <button type="submit">Request deletion</button>
                </form>
              {/if}

              {#if data.operator.role === 'SUPER_ADMIN' && tenant.lifecycleState === 'DELETION_REQUESTED'}
                <form method="POST" action="?/finaliseDeletion" class="action-form danger-zone final-delete">
                  <input type="hidden" name="tenantId" value={tenant.tenantId} />
                  <p>
                    Final deletion removes this Tenant from service but does <strong>not</strong> physically purge retained ERP data.
                  </p>
                  <label>
                    <span>Type <code>{tenant.slug}</code> to confirm</span>
                    <input name="confirmationSlug" required autocomplete="off" />
                  </label>
                  <label>
                    <span>Final deletion reason</span>
                    <input name="reason" minlength="8" required placeholder="Confirm the governed deletion rationale" />
                  </label>
                  <button type="submit">Delete Tenant from service</button>
                </form>
              {/if}
            </div>
          {/if}
        </article>
      {/each}
    {/if}
  </section>
</main>

<style>
  .platform-shell {
    max-width: 96rem;
    margin: 0 auto;
    padding: 2rem;
  }

  .platform-header {
    display: flex;
    justify-content: space-between;
    gap: 2rem;
    align-items: start;
    margin-bottom: 2rem;
  }

  .platform-eyebrow {
    margin: 0 0 0.6rem;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  h1, h2, p { margin-top: 0; }
  h1 { font-size: clamp(2rem, 5vw, 3.5rem); margin-bottom: 0.7rem; }
  h2 { margin-bottom: 0.25rem; }

  .operator-block {
    display: grid;
    min-width: 14rem;
    gap: 0.25rem;
    padding: 1rem;
    border: 1px solid #d8d8d2;
    border-radius: 0.75rem;
    background: #fff;
  }

  .operator-block span { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; }

  .platform-summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .platform-summary article, .platform-panel, .tenant-card {
    border: 1px solid #d8d8d2;
    border-radius: 0.8rem;
    background: #fff;
  }

  .platform-summary article {
    display: grid;
    padding: 1rem;
  }

  .platform-summary strong { font-size: 1.7rem; }
  .platform-summary span { font-size: 0.85rem; }
  .platform-panel { padding: 1rem; margin-bottom: 1rem; }

  .search-form {
    display: flex;
    gap: 0.75rem;
    align-items: end;
  }

  .search-form label { flex: 1; }
  label { display: grid; gap: 0.35rem; font-weight: 650; }

  input {
    width: 100%;
    padding: 0.7rem 0.8rem;
    border: 1px solid #c8c8c2;
    border-radius: 0.5rem;
    font: inherit;
  }

  button {
    padding: 0.72rem 0.9rem;
    border: 1px solid #1e1e1b;
    border-radius: 0.5rem;
    background: #1e1e1b;
    color: #fff;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .tenant-list { display: grid; gap: 1rem; }
  .tenant-card { padding: 1.25rem; }

  .tenant-heading, .tenant-title-row, .tenant-links {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
  }

  .tenant-links { justify-content: flex-end; }

  .state-chip {
    display: inline-flex;
    padding: 0.3rem 0.55rem;
    border-radius: 999px;
    background: #e8f5ea;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  .state-chip.warning { background: #fff3cd; }
  .state-chip.danger { background: #fde3e0; }

  .tenant-facts {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
    margin: 1rem 0;
  }

  .tenant-facts div { padding: 0.8rem; background: #f7f7f4; border-radius: 0.6rem; }
  dt { font-size: 0.75rem; text-transform: uppercase; font-weight: 800; }
  dd { margin: 0.2rem 0 0; }

  .lifecycle-reason { margin-bottom: 0.5rem; }
  .tenant-actions { display: grid; gap: 0.8rem; margin-top: 1rem; }

  .action-form {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.8rem;
    align-items: end;
    padding: 0.9rem;
    border: 1px solid #dfdfd8;
    border-radius: 0.65rem;
  }

  .danger-zone { border-color: #d7958e; background: #fff9f8; }
  .danger-zone button { background: #8a1f17; border-color: #8a1f17; }

  .final-delete {
    grid-template-columns: 1fr 1fr auto;
  }

  .final-delete p { grid-column: 1 / -1; margin-bottom: 0; }

  .platform-message { padding: 0.85rem 1rem; border-radius: 0.6rem; }
  .error { background: #fff1f0; color: #8a1f17; }
  .success { background: #edf8ef; color: #1f6430; }

  code { font-size: 0.88em; }

  @media (max-width: 800px) {
    .platform-header, .tenant-heading, .tenant-title-row, .tenant-links, .search-form {
      align-items: stretch;
      flex-direction: column;
    }

    .platform-summary, .tenant-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .action-form, .final-delete { grid-template-columns: 1fr; }
  }
</style>
