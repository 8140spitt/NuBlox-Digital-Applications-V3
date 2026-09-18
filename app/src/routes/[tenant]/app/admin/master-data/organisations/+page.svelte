<script lang="ts">
  let { data, form } = $props();

  const statusLabel: Record<string, string> = {
    PROPOSED: 'Proposed',
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    DISSOLVED: 'Dissolved',
    MERGED: 'Merged'
  };

  const formatDate = (value: string) => new Date(value).toLocaleString('en-GB');
</script>

<svelte:head><title>Organisation Master · NuBlox</title></svelte:head>

<div class="master-page">
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <a href={`/${data.tenantSlug}/app/admin/business-objects`}>Administration</a>
    <span>›</span><strong>Organisation master</strong>
  </nav>

  <header class="hero section-card">
    <div>
      <span class="eyebrow">AGG-01-PARTY · Foundation master data</span>
      <h1>Organisation Master</h1>
      <p>
        One canonical organisation identity reused across customers, suppliers, subcontractors,
        consultants, partners and regulators. Commercial roles attach to this identity; they do not
        create another organisation master.
      </p>
    </div>
    <div class="authority">
      <strong>Command authority</strong>
      <span>{data.actorDisplayName}</span>
      <small>Tenant-scoped permissions · optimistic version control · immutable evidence</small>
    </div>
  </header>

  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <section class="metrics">
    <article class="section-card">
      <strong>{data.organisations.length}</strong><span>organisations</span>
    </article>
    <article class="section-card">
      <strong>{data.organisations.filter((item) => item.status === 'ACTIVE').length}</strong><span
        >active</span
      >
    </article>
    <article class="section-card">
      <strong>{data.organisations.filter((item) => item.status === 'PROPOSED').length}</strong><span
        >proposed</span
      >
    </article>
  </section>

  <div class="workspace">
    <aside class="register section-card">
      <div class="panel-heading">
        <div>
          <span class="eyebrow">Canonical register</span>
          <h2>Organisations</h2>
        </div>
      </div>
      <div class="records">
        {#each data.organisations as organisation}
          <a
            class:active={data.selected?.id === organisation.id}
            href={`?organisation=${organisation.id}`}
          >
            <span>
              <strong>{organisation.displayName}</strong>
              <small>{organisation.registrationNumber || 'No registration number'}</small>
            </span>
            <em class={`status status-${organisation.status.toLowerCase()}`}
              >{statusLabel[organisation.status]}</em
            >
          </a>
        {:else}
          <p class="empty">No organisations have been created for this tenant.</p>
        {/each}
      </div>

      <form class="create" method="POST" action="?/create">
        <span class="eyebrow">New identity</span>
        <label
          >Legal name<input name="legalName" required placeholder="Registered legal name" /></label
        >
        <label>Trading name<input name="tradingName" placeholder="Optional trading name" /></label>
        <div class="two">
          <label>Registration number<input name="registrationNumber" /></label>
          <label>Country<input name="countryCode" maxlength="2" placeholder="GB" /></label>
        </div>
        <input type="hidden" name="taxIdentifier" value="" />
        <button type="submit">Create proposed organisation</button>
      </form>
    </aside>

    <main class="detail">
      {#if data.selected}
        <section class="section-card editor">
          <div class="panel-heading">
            <div>
              <span class="eyebrow">Canonical Party / Organisation</span>
              <h2>{data.selected.displayName}</h2>
            </div>
            <span class={`status status-${data.selected.status.toLowerCase()}`}
              >{statusLabel[data.selected.status]}</span
            >
          </div>

          <div class="record-meta">
            <span>Immutable ID <code>{data.selected.id}</code></span>
            <span>Version <strong>{data.selected.version}</strong></span>
            <span>Updated <strong>{formatDate(data.selected.updatedAt)}</strong></span>
          </div>

          <form method="POST" action="?/save" class="editor-form">
            <input type="hidden" name="id" value={data.selected.id} />
            <input type="hidden" name="version" value={data.selected.version} />
            <label class="full"
              >Legal name<input name="legalName" value={data.selected.legalName} required /></label
            >
            <label
              >Trading name<input
                name="tradingName"
                value={data.selected.tradingName ?? ''}
              /></label
            >
            <label
              >Registration number<input
                name="registrationNumber"
                value={data.selected.registrationNumber ?? ''}
              /></label
            >
            <label
              >Tax identifier<input
                name="taxIdentifier"
                value={data.selected.taxIdentifier ?? ''}
              /></label
            >
            <label
              >Country code<input
                name="countryCode"
                maxlength="2"
                value={data.selected.countryCode ?? ''}
              /></label
            >
            <div class="full actions">
              <button type="submit">Save changes</button>
            </div>
          </form>
        </section>

        <section class="section-card lifecycle">
          <div>
            <span class="eyebrow">Lifecycle</span>
            <h2>Organisation status</h2>
            <p>
              Lifecycle changes are commands on the Party aggregate. No status is inferred from
              whether the organisation happens to be a customer or supplier.
            </p>
          </div>
          <div class="lifecycle-actions">
            {#if data.selected.status === 'PROPOSED' || data.selected.status === 'INACTIVE'}
              <form method="POST" action="?/activate">
                <input type="hidden" name="id" value={data.selected.id} />
                <input type="hidden" name="version" value={data.selected.version} />
                <button type="submit">Activate organisation</button>
              </form>
            {:else if data.selected.status === 'ACTIVE'}
              <form method="POST" action="?/deactivate">
                <input type="hidden" name="id" value={data.selected.id} />
                <input type="hidden" name="version" value={data.selected.version} />
                <button class="secondary" type="submit">Set inactive</button>
              </form>
            {/if}
          </div>
        </section>

        <section class="section-card audit">
          <div class="panel-heading">
            <div>
              <span class="eyebrow">Evidence by default</span>
              <h2>Audit trail</h2>
            </div>
          </div>
          <ol>
            {#each data.audit as event}
              <li>
                <div>
                  <strong>{event.action}</strong><small
                    >{event.actorDisplayName} · {formatDate(event.occurredAt)}</small
                  >
                </div>
                <span>{event.fromState || 'New'} → {event.toState || '—'}</span>
                {#if event.note}<p>{event.note}</p>{/if}
              </li>
            {:else}
              <li class="empty">No audit evidence recorded.</li>
            {/each}
          </ol>
        </section>
      {:else}
        <section class="section-card welcome">
          <span class="eyebrow">Foundation data</span>
          <h2>Create the first organisation</h2>
          <p>
            This single identity will later be related to customer, supplier, subcontractor,
            consultant, partner or regulator roles without duplicating the master record.
          </p>
        </section>
      {/if}
    </main>
  </div>
</div>

<style>
  .master-page {
    display: grid;
    gap: 12px;
  }
  .section-card {
    border: 1px solid var(--line);
    border-radius: 10px;
    background: #fff;
  }
  .breadcrumb {
    display: flex;
    gap: 7px;
    align-items: center;
    color: var(--muted);
    font-size: 11px;
  }
  .breadcrumb a {
    color: var(--blue-700);
    text-decoration: none;
  }
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 310px;
    gap: 24px;
    align-items: center;
    padding: 20px;
    border-color: #9bcfe7;
    background: linear-gradient(120deg, #fbfdff, #edf8f7 65%, #fff);
  }
  .eyebrow {
    color: var(--blue-700);
    font-size: 10px;
    font-weight: 850;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }
  h1 {
    margin: 4px 0 7px;
    font-size: 26px;
  }
  h2 {
    margin: 2px 0 0;
    font-size: 16px;
  }
  .hero p,
  .lifecycle p,
  .welcome p {
    margin: 0;
    color: #50697c;
    font-size: 11px;
    line-height: 1.55;
  }
  .authority {
    display: grid;
    gap: 3px;
    padding: 12px;
    border: 1px solid #c5dfe9;
    border-radius: 9px;
    background: #ffffffd9;
  }
  .authority strong {
    font-size: 9px;
    text-transform: uppercase;
    color: #60788a;
  }
  .authority span {
    font-size: 14px;
    font-weight: 800;
  }
  .authority small {
    font-size: 9px;
    color: #748695;
  }
  .message {
    padding: 9px 12px;
    border: 1px solid #dd8a8a;
    border-radius: 8px;
    background: #fff3f3;
    color: #792f2f;
    font-size: 11px;
  }
  .metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 9px;
  }
  .metrics article {
    display: grid;
    gap: 2px;
    padding: 12px 14px;
  }
  .metrics strong {
    font-size: 21px;
    color: #26475e;
  }
  .metrics span {
    font-size: 9px;
    color: #748796;
    text-transform: uppercase;
  }
  .workspace {
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr);
    gap: 12px;
    align-items: start;
  }
  .register {
    position: sticky;
    top: 78px;
    padding: 13px;
  }
  .panel-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }
  .records {
    display: grid;
    gap: 6px;
  }
  .records a {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: flex-start;
    padding: 9px;
    border: 1px solid #e0e7ec;
    border-radius: 8px;
    text-decoration: none;
    background: #fafcfd;
  }
  .records a.active {
    border-color: #79bde2;
    background: #eef8fd;
    box-shadow: inset 3px 0 var(--blue-700);
  }
  .records a > span {
    display: grid;
    gap: 3px;
  }
  .records strong {
    font-size: 11px;
    color: #263f51;
  }
  .records small {
    font-size: 9px;
    color: #7d8d99;
  }
  .status {
    display: inline-block;
    padding: 3px 6px;
    border-radius: 999px;
    font-size: 8px;
    font-style: normal;
    font-weight: 850;
    text-transform: uppercase;
    white-space: nowrap;
    background: #eef1f3;
    color: #526574;
  }
  .status-active {
    background: #e5f5e9;
    color: #2a6939;
  }
  .status-proposed {
    background: #fff3da;
    color: #7b5a18;
  }
  .status-inactive {
    background: #edf0f2;
    color: #68757f;
  }
  .create {
    display: grid;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  label {
    display: grid;
    gap: 4px;
    color: #435c70;
    font-size: 10px;
    font-weight: 750;
  }
  input {
    width: 100%;
    border: 1px solid #cfdbe3;
    border-radius: 7px;
    padding: 8px 9px;
    background: white;
    color: var(--ink);
    font-size: 11px;
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 72px;
    gap: 7px;
  }
  button {
    border: 0;
    border-radius: 7px;
    padding: 8px 11px;
    background: var(--blue-700);
    color: white;
    font-size: 10.5px;
    font-weight: 800;
    cursor: pointer;
  }
  .secondary {
    background: #657987;
  }
  .detail {
    display: grid;
    gap: 12px;
    min-width: 0;
  }
  .editor,
  .lifecycle,
  .audit,
  .welcome {
    padding: 14px;
  }
  .record-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 12px;
  }
  .record-meta span {
    padding: 5px 7px;
    border-radius: 6px;
    background: #f4f7f9;
    color: #687d8d;
    font-size: 9px;
  }
  .record-meta code {
    font-size: 8px;
  }
  .editor-form {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
  }
  .editor-form .full {
    grid-column: 1/-1;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
  }
  .lifecycle {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 18px;
  }
  .lifecycle > div:first-child {
    max-width: 690px;
  }
  .lifecycle-actions {
    flex: 0 0 auto;
  }
  .audit ol {
    list-style: none;
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
  }
  .audit li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 3px 12px;
    padding: 8px;
    border: 1px solid #e5eaee;
    border-radius: 7px;
  }
  .audit li strong {
    display: block;
    font-size: 10.5px;
  }
  .audit li small {
    display: block;
    margin-top: 2px;
    color: #7d8d99;
    font-size: 9px;
  }
  .audit li > span {
    color: #526a7d;
    font-size: 9px;
  }
  .audit li p {
    grid-column: 1/-1;
    margin: 2px 0 0;
    color: #5f7484;
    font-size: 9.5px;
  }
  .empty {
    color: #7b8c99;
    font-size: 10px;
  }
  .welcome {
    min-height: 260px;
    display: grid;
    place-content: center;
    text-align: center;
  }
  .welcome p {
    max-width: 540px;
  }
  @media (max-width: 980px) {
    .workspace {
      grid-template-columns: 240px minmax(0, 1fr);
    }
    .hero {
      grid-template-columns: 1fr;
    }
    .authority {
      display: none;
    }
  }
  @media (max-width: 740px) {
    .workspace,
    .metrics {
      grid-template-columns: 1fr;
    }
    .register {
      position: static;
    }
    .editor-form {
      grid-template-columns: 1fr;
    }
    .editor-form .full {
      grid-column: auto;
    }
    .lifecycle {
      display: grid;
    }
    .two {
      grid-template-columns: 1fr 80px;
    }
  }
</style>
