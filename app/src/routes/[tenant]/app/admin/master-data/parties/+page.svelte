<script lang="ts">
  let { data, form } = $props();

  const totals = $derived({
    parties: data.allParties.length,
    persons: data.allParties.filter((party) => party.partyType === 'PERSON').length,
    organisations: data.allParties.filter((party) => party.partyType === 'ORGANISATION').length,
    legalEntities: data.allParties.filter((party) => party.isLegalEntity).length
  });

  function partyHref(id: string) {
    const params = new URLSearchParams();
    if (data.filters.q) params.set('q', data.filters.q);
    if (data.filters.type) params.set('type', data.filters.type);
    if (data.filters.status) params.set('status', data.filters.status);
    params.set('party', id);
    return '?' + params.toString();
  }

  function relationshipDirection(relationship: (typeof data.relationships)[number]) {
    if (!data.selected) return '';
    return relationship.fromPartyId === data.selected.id ? 'Outgoing' : 'Incoming';
  }

  function relationshipParty(relationship: (typeof data.relationships)[number]) {
    if (!data.selected) return '';
    return relationship.fromPartyId === data.selected.id
      ? relationship.toDisplayName
      : relationship.fromDisplayName;
  }
</script>

<svelte:head>
  <title>Party Master Data · NuBlox</title>
</svelte:head>

<div class="party-page">
  <header class="hero section-card">
    <div>
      <span class="eyebrow">Canonical master data · AGG-01-PARTY</span>
      <h1>Party master data</h1>
      <p>
        One identity model for people, organisations and legal entities. Relationships are governed
        separately so CRM, procurement, HCM and project functions reuse the same authoritative
        parties instead of creating duplicate masters.
      </p>
    </div>
    <div class="hero-actions">
      {#if data.authority.canCreate}
        <details>
          <summary>New person</summary>
          <form method="POST" action="?/createPerson">
            <label>Given name<input name="givenName" required /></label>
            <label>Middle names<input name="middleNames" /></label>
            <label>Family name<input name="familyName" required /></label>
            <label>Preferred name<input name="preferredName" /></label>
            <label>Date of birth<input type="date" name="dateOfBirth" /></label>
            <button type="submit">Create person</button>
          </form>
        </details>
        <details>
          <summary>New organisation</summary>
          <form method="POST" action="?/createOrganisation">
            <label>Legal name<input name="legalName" required /></label>
            <label>Trading name<input name="tradingName" /></label>
            <label>Registration number<input name="registrationNumber" /></label>
            <label>Tax identifier<input name="taxIdentifier" /></label>
            <label>Country code<input name="countryCode" maxlength="2" placeholder="GB" /></label>
            <button type="submit">Create organisation</button>
          </form>
        </details>
      {/if}
    </div>
  </header>

  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <section class="metrics" aria-label="Party master summary">
    <div class="metric section-card"><strong>{totals.parties}</strong><span>parties</span></div>
    <div class="metric section-card"><strong>{totals.persons}</strong><span>people</span></div>
    <div class="metric section-card"><strong>{totals.organisations}</strong><span>organisations</span></div>
    <div class="metric section-card"><strong>{totals.legalEntities}</strong><span>legal entities</span></div>
  </section>

  <form class="filters section-card" method="GET">
    <label class="search">Search<input name="q" value={data.filters.q} placeholder="Name, registration or identifier" /></label>
    <label>
      Party type
      <select name="type">
        <option value="">All types</option>
        <option value="PERSON" selected={data.filters.type === 'PERSON'}>Person</option>
        <option value="ORGANISATION" selected={data.filters.type === 'ORGANISATION'}>Organisation</option>
      </select>
    </label>
    <label>
      Status
      <select name="status">
        <option value="">All statuses</option>
        <option value="ACTIVE" selected={data.filters.status === 'ACTIVE'}>Active</option>
        <option value="PROPOSED" selected={data.filters.status === 'PROPOSED'}>Proposed</option>
        <option value="INACTIVE" selected={data.filters.status === 'INACTIVE'}>Inactive</option>
      </select>
    </label>
    <div class="filter-actions"><button type="submit">Apply</button><a href={'/' + data.tenantSlug + '/app/admin/master-data/parties'}>Clear</a></div>
  </form>

  <div class="workspace-grid">
    <section class="register section-card">
      <div class="panel-heading">
        <div><span class="eyebrow">Party register</span><h2>{data.parties.length} matching records</h2></div>
      </div>
      <div class="party-list">
        {#each data.parties as party}
          <a class:active={data.selected?.id === party.id} href={partyHref(party.id)}>
            <span class:person={party.partyType === 'PERSON'} class="type-icon">
              {party.partyType === 'PERSON' ? 'P' : 'O'}
            </span>
            <span class="party-copy">
              <strong>{party.displayName}</strong>
              <small>
                {party.partyType === 'PERSON' ? 'Person' : party.isLegalEntity ? 'Legal entity' : 'Organisation'}
                · {party.status}
              </small>
            </span>
            <span class={'status status-' + party.status.toLowerCase()}>{party.status}</span>
          </a>
        {:else}
          <p class="empty">No parties match these filters.</p>
        {/each}
      </div>
    </section>

    <main class="inspector">
      {#if data.selected}
        <section class="identity-card section-card">
          <div class="identity-heading">
            <div>
              <span class="eyebrow">{data.selected.partyType} · canonical identity</span>
              <h2>{data.selected.displayName}</h2>
              <code>{data.selected.id}</code>
            </div>
            <div class="identity-badges">
              <span>{data.selected.status}</span>
              <span>v{data.selected.version}</span>
              {#if data.selected.isLegalEntity}<span class="legal">Legal entity</span>{/if}
            </div>
          </div>

          <dl>
            {#if data.selected.partyType === 'PERSON'}
              <div><dt>Given name</dt><dd>{data.selected.givenName || '—'}</dd></div>
              <div><dt>Middle names</dt><dd>{data.selected.middleNames || '—'}</dd></div>
              <div><dt>Family name</dt><dd>{data.selected.familyName || '—'}</dd></div>
              <div><dt>Preferred name</dt><dd>{data.selected.preferredName || '—'}</dd></div>
            {:else}
              <div><dt>Legal name</dt><dd>{data.selected.legalName || '—'}</dd></div>
              <div><dt>Trading name</dt><dd>{data.selected.tradingName || '—'}</dd></div>
              <div><dt>Registration</dt><dd>{data.selected.registrationNumber || '—'}</dd></div>
              <div><dt>Country</dt><dd>{data.selected.countryCode || '—'}</dd></div>
              {#if data.selected.isLegalEntity}
                <div><dt>Entity type</dt><dd>{data.selected.legalEntityType || '—'}</dd></div>
                <div><dt>Jurisdiction</dt><dd>{data.selected.jurisdictionCode || '—'}</dd></div>
                <div><dt>Accounting currency</dt><dd>{data.selected.accountingCurrency || '—'}</dd></div>
              {/if}
            {/if}
          </dl>

          {#if data.selected.partyType === 'ORGANISATION'}
            <a class="editor-link" href={'/' + data.tenantSlug + '/app/admin/master-data/organisations?organisation=' + data.selected.id}>
              Open organisation record →
            </a>
          {/if}
        </section>

        {#if data.selected.partyType === 'ORGANISATION' && !data.selected.isLegalEntity && data.authority.canChange}
          <section class="section-card compact-panel">
            <details>
              <summary>Designate this organisation as a legal entity</summary>
              <form method="POST" action="?/designateLegalEntity" class="legal-form">
                <input type="hidden" name="partyId" value={data.selected.id} />
                <input type="hidden" name="version" value={data.selected.version} />
                <label>Legal entity type<input name="legalEntityType" required placeholder="LIMITED_COMPANY" /></label>
                <label>Jurisdiction code<input name="jurisdictionCode" required placeholder="GB" /></label>
                <label>Statutory identifier<input name="statutoryIdentifier" /></label>
                <label>Tax registration<input name="taxRegistrationNumber" /></label>
                <label>Accounting currency<input name="accountingCurrency" maxlength="3" placeholder="GBP" /></label>
                <label>Effective from<input type="date" name="effectiveFrom" /></label>
                <label>Effective to<input type="date" name="effectiveTo" /></label>
                <div class="full"><button type="submit">Designate legal entity</button></div>
              </form>
            </details>
          </section>
        {/if}

        <section class="relationships section-card">
          <div class="panel-heading">
            <div><span class="eyebrow">AGG-01-PARTY-RELATIONSHIP</span><h2>Party relationships</h2></div>
            <span class="count">{data.relationships.length}</span>
          </div>

          {#if data.authority.canManageRelationships}
            <details class="relationship-create">
              <summary>Create relationship</summary>
              <form method="POST" action="?/createRelationship">
                <input type="hidden" name="fromPartyId" value={data.selected.id} />
                <label>
                  Related party
                  <select name="toPartyId" required>
                    <option value="">Select party</option>
                    {#each data.allParties.filter((party) => party.id !== data.selected.id) as party}
                      <option value={party.id}>{party.displayName} · {party.partyType}</option>
                    {/each}
                  </select>
                </label>
                <label>Relationship type<input name="relationshipType" required placeholder="SUPPLIER, EMPLOYER, CONTACT…" /></label>
                <button type="submit">Create proposed relationship</button>
              </form>
            </details>
          {/if}

          <div class="relationship-list">
            {#each data.relationships as relationship}
              <article>
                <div class="relationship-main">
                  <span class="direction">{relationshipDirection(relationship)}</span>
                  <div>
                    <strong>{relationshipParty(relationship)}</strong>
                    <small>{relationship.relationshipType} · {relationship.contextType}</small>
                  </div>
                  <span class={'status status-' + relationship.status.toLowerCase()}>{relationship.status}</span>
                </div>
                {#if data.authority.canManageRelationships}
                  <div class="relationship-actions">
                    {#if relationship.status === 'PROPOSED' || relationship.status === 'SUSPENDED'}
                      <form method="POST" action="?/activateRelationship">
                        <input type="hidden" name="partyId" value={data.selected.id} />
                        <input type="hidden" name="relationshipId" value={relationship.id} />
                        <input type="hidden" name="version" value={relationship.version} />
                        <button type="submit">Activate</button>
                      </form>
                    {/if}
                    {#if relationship.status === 'ACTIVE'}
                      <form method="POST" action="?/suspendRelationship">
                        <input type="hidden" name="partyId" value={data.selected.id} />
                        <input type="hidden" name="relationshipId" value={relationship.id} />
                        <input type="hidden" name="version" value={relationship.version} />
                        <button class="secondary" type="submit">Suspend</button>
                      </form>
                    {/if}
                    {#if relationship.status !== 'ENDED'}
                      <form method="POST" action="?/endRelationship">
                        <input type="hidden" name="partyId" value={data.selected.id} />
                        <input type="hidden" name="relationshipId" value={relationship.id} />
                        <input type="hidden" name="version" value={relationship.version} />
                        <button class="quiet" type="submit">End</button>
                      </form>
                    {/if}
                  </div>
                {/if}
              </article>
            {:else}
              <p class="empty">No governed relationships recorded for this party.</p>
            {/each}
          </div>
        </section>
      {:else}
        <section class="section-card empty-state">
          <span class="eyebrow">AGG-01-PARTY</span>
          <h2>Create the first Party</h2>
          <p>People and organisations share one canonical Party identity and are specialised only where their data differs.</p>
        </section>
      {/if}
    </main>
  </div>
</div>

<style>
  .party-page { display: grid; gap: 12px; }
  .hero { display: grid; grid-template-columns: minmax(0,1.45fr) minmax(300px,.65fr); gap: 24px; align-items: start; padding: 18px; border-color: #8fc9ee; background: linear-gradient(120deg,#fbfdff,#eaf6fd); }
  .eyebrow { color: var(--blue-700); font-size: 10px; font-weight: 850; letter-spacing: .07em; text-transform: uppercase; }
  h1 { margin: 3px 0 6px; font-size: 25px; }
  h2 { margin: 2px 0 0; font-size: 16px; }
  .hero p { margin: 0; max-width: 820px; color: #526a7d; font-size: 11.5px; line-height: 1.45; }
  .hero-actions { display: grid; gap: 6px; }
  details { border: 1px solid #d7e3ea; border-radius: 8px; background: white; }
  details > summary { padding: 9px 10px; cursor: pointer; color: #31586f; font-size: 10.5px; font-weight: 800; }
  .hero-actions form, .relationship-create form { display: grid; gap: 7px; padding: 9px; border-top: 1px solid #e6ecef; }
  label { display: grid; gap: 4px; color: #496073; font-size: 9.5px; font-weight: 700; }
  input, select { width: 100%; border: 1px solid #cfdbe3; border-radius: 6px; padding: 7px 8px; background: white; color: var(--ink); font-size: 10px; }
  button, .filter-actions a, .editor-link { border: 0; border-radius: 6px; padding: 7px 9px; background: var(--blue-700); color: white; font-size: 9.5px; font-weight: 800; text-decoration: none; cursor: pointer; }
  button.secondary { background: #b6782d; }
  button.quiet { border: 1px solid #d7e0e6; background: white; color: #526b7e; }
  .message { padding: 9px 12px; border: 1px solid #dd8a8a; border-radius: 8px; background: #fff3f3; color: #792f2f; font-size: 11px; }
  .metrics { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 8px; }
  .metric { display: grid; gap: 2px; padding: 10px 12px; }
  .metric strong { color: #1d4f70; font-size: 19px; }
  .metric span { color: #718492; font-size: 9px; text-transform: uppercase; }
  .filters { display: grid; grid-template-columns: minmax(220px,1fr) 180px 160px auto; gap: 8px; align-items: end; padding: 10px; }
  .filter-actions { display: flex; gap: 6px; }
  .filter-actions a { border: 1px solid #d6e0e6; background: white; color: #536c7e; }
  .workspace-grid { display: grid; grid-template-columns: minmax(300px,.72fr) minmax(0,1.5fr); gap: 12px; align-items: start; }
  .register { position: sticky; top: 78px; padding: 12px; max-height: calc(100vh - 92px); overflow: auto; }
  .panel-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 9px; }
  .party-list { display: grid; gap: 4px; }
  .party-list a { display: grid; grid-template-columns: 32px minmax(0,1fr) auto; gap: 8px; align-items: center; padding: 8px; border: 1px solid #e2e8ec; border-radius: 7px; background: #fbfcfd; color: inherit; text-decoration: none; }
  .party-list a:hover, .party-list a.active { border-color: #8bc6e8; background: #eff8fd; }
  .type-icon { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 7px; background: #e9f3f8; color: #37667f; font-size: 10px; font-weight: 900; }
  .type-icon.person { border-radius: 50%; background: #edf4ed; color: #46704c; }
  .party-copy { display: grid; gap: 2px; min-width: 0; }
  .party-copy strong { overflow: hidden; color: #334f63; font-size: 10.5px; text-overflow: ellipsis; white-space: nowrap; }
  .party-copy small { color: #81909b; font-size: 8.5px; }
  .status { width: max-content; padding: 3px 5px; border-radius: 999px; background: #edf1f4; color: #5e7180; font-size: 7.5px; font-weight: 850; text-transform: uppercase; }
  .status-active { background: #e6f5e9; color: #2c713a; }
  .status-proposed { background: #fff2d9; color: #815f19; }
  .status-inactive, .status-suspended, .status-ended { background: #f0f0f2; color: #6d6d78; }
  .inspector { display: grid; gap: 12px; min-width: 0; }
  .identity-card, .relationships, .compact-panel, .empty-state { padding: 14px; }
  .identity-heading { display: flex; justify-content: space-between; gap: 14px; align-items: start; padding-bottom: 11px; border-bottom: 1px solid #e4eaee; }
  .identity-heading code { display: inline-block; margin-top: 5px; padding: 3px 5px; border-radius: 5px; background: #f2f5f7; color: #687d8d; font-size: 8px; }
  .identity-badges { display: flex; gap: 5px; flex-wrap: wrap; justify-content: end; }
  .identity-badges span { padding: 4px 6px; border-radius: 999px; background: #eef2f5; color: #5f7484; font-size: 8px; font-weight: 800; }
  .identity-badges .legal { background: #e8f4fb; color: #286384; }
  dl { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 10px; margin: 12px 0; }
  dl div { display: grid; gap: 2px; }
  dt { color: #7c8d99; font-size: 8px; text-transform: uppercase; }
  dd { margin: 0; color: #3f596b; font-size: 10px; }
  .editor-link { display: inline-block; }
  .compact-panel details { border: 0; }
  .compact-panel details > summary { padding: 0; }
  .legal-form { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e6ecef; }
  .legal-form .full { grid-column: 1/-1; }
  .count { min-width: 26px; padding: 4px 6px; border-radius: 999px; background: #eef3f6; color: #607584; font-size: 9px; font-weight: 800; text-align: center; }
  .relationship-create { margin-bottom: 9px; }
  .relationship-create form { grid-template-columns: 1fr 1fr auto; align-items: end; }
  .relationship-list { display: grid; gap: 6px; }
  .relationship-list article { display: grid; gap: 7px; padding: 8px; border: 1px solid #e2e8ec; border-radius: 7px; background: #fbfcfd; }
  .relationship-main { display: grid; grid-template-columns: 62px minmax(0,1fr) auto; gap: 8px; align-items: center; }
  .relationship-main > div { display: grid; gap: 2px; }
  .relationship-main strong { color: #355166; font-size: 10px; }
  .relationship-main small { color: #82919c; font-size: 8.5px; }
  .direction { color: #6b8190; font-size: 8px; font-weight: 800; text-transform: uppercase; }
  .relationship-actions { display: flex; gap: 5px; justify-content: end; }
  .empty, .empty-state { color: #758896; font-size: 10px; }
  .empty-state { min-height: 230px; display: grid; place-content: center; text-align: center; }
  .empty-state p { max-width: 520px; margin: 7px 0 0; }
  @media(max-width:1100px) { .workspace-grid { grid-template-columns: 280px minmax(0,1fr); } .filters { grid-template-columns: 1fr 1fr 1fr; } .filter-actions { grid-column: 1/-1; } dl { grid-template-columns: repeat(2,1fr); } }
  @media(max-width:760px) { .hero, .workspace-grid { grid-template-columns: 1fr; } .metrics { grid-template-columns: repeat(2,1fr); } .filters { grid-template-columns: 1fr; } .filter-actions { grid-column: auto; } .register { position: static; max-height: none; } .legal-form, .relationship-create form { grid-template-columns: 1fr; } .legal-form .full { grid-column: auto; } dl { grid-template-columns: 1fr 1fr; } }
</style>
