<script lang="ts">
  import TaskContextButton from '$lib/components/TaskContextButton.svelte';

  let { data } = $props();

  const totals = $derived({
    parties: data.allParties.length,
    persons: data.allParties.filter((party) => party.partyType === 'PERSON').length,
    organisations: data.allParties.filter((party) => party.partyType === 'ORGANISATION').length,
    legalEntities: data.allParties.filter((party) => party.isLegalEntity).length
  });

  const functionNames: Record<string, string> = {
    F07: 'Sales & Commercial',
    F09: 'Procurement & Suppliers',
    F15: 'People & Workforce',
    F19: 'Legal & Secretariat',
    PLATFORM: 'Platform / migration'
  };

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

  function selectedRoute() {
    return data.selected
      ? `/${data.tenantSlug}/app/admin/master-data/parties?party=${encodeURIComponent(data.selected.id)}`
      : `/${data.tenantSlug}/app/admin/master-data/parties`;
  }
</script>

<svelte:head><title>Party Directory · NuBlox</title></svelte:head>

<div class="party-page">
  <header class="hero section-card">
    <div>
      <span class="eyebrow">Canonical identity directory · AGG-01-PARTY</span>
      <h1>Party directory & identity stewardship</h1>
      <p>
        One canonical identity for people and organisations. Business roles originate in their home
        functions; this directory resolves, displays and stewards shared identity rather than
        creating parallel customer, supplier or employee masters.
      </p>
    </div>
    <div class="origin-policy">
      <strong>Business-role origination</strong>
      <a href={`/${data.tenantSlug}/app/functions/f07`}><span>Client / customer</span><b>F07 Sales & Commercial</b></a>
      <a href={`/${data.tenantSlug}/app/functions/f09`}><span>Supplier / subcontractor</span><b>F09 Procurement & Suppliers</b></a>
      <a href={`/${data.tenantSlug}/app/functions/f15`}><span>Employee / worker</span><b>F15 People & Workforce</b></a>
      <a href={`/${data.tenantSlug}/app/functions/f19`}><span>Legal / regulator role</span><b>F19 Legal & Secretariat</b></a>
    </div>
  </header>

  <section class="metrics" aria-label="Party directory summary">
    <div class="metric section-card"><strong>{totals.parties}</strong><span>parties</span></div>
    <div class="metric section-card"><strong>{totals.persons}</strong><span>people</span></div>
    <div class="metric section-card"><strong>{totals.organisations}</strong><span>organisations</span></div>
    <div class="metric section-card"><strong>{totals.legalEntities}</strong><span>legal entities</span></div>
  </section>

  <form class="filters section-card" method="GET">
    <label class="search">Search<input name="q" value={data.filters.q} placeholder="Name, registration, origin or identifier" /></label>
    <label>Party type<select name="type"><option value="">All types</option><option value="PERSON" selected={data.filters.type === 'PERSON'}>Person</option><option value="ORGANISATION" selected={data.filters.type === 'ORGANISATION'}>Organisation</option></select></label>
    <label>Status<select name="status"><option value="">All statuses</option><option value="ACTIVE" selected={data.filters.status === 'ACTIVE'}>Active</option><option value="PROPOSED" selected={data.filters.status === 'PROPOSED'}>Proposed</option><option value="INACTIVE" selected={data.filters.status === 'INACTIVE'}>Inactive</option></select></label>
    <div class="filter-actions"><button type="submit">Apply</button><a href={`/${data.tenantSlug}/app/admin/master-data/parties`}>Clear</a></div>
  </form>

  <div class="workspace-grid">
    <section class="register section-card">
      <div class="panel-heading"><div><span class="eyebrow">Canonical register</span><h2>{data.parties.length} matching identities</h2></div></div>
      <div class="party-list">
        {#each data.parties as party}
          <a class:active={data.selected?.id === party.id} href={partyHref(party.id)}>
            <span class:person={party.partyType === 'PERSON'} class="type-icon">{party.partyType === 'PERSON' ? 'P' : 'O'}</span>
            <span class="party-copy"><strong>{party.displayName}</strong><small>{party.partyType === 'PERSON' ? 'Person' : party.isLegalEntity ? 'Legal entity' : 'Organisation'} · {party.status}</small></span>
            <span class={'status status-' + party.status.toLowerCase()}>{party.status}</span>
          </a>
        {:else}<p class="empty">No canonical identities match these filters.</p>{/each}
      </div>
      <div class="creation-rule">
        <strong>No direct business-role creation here</strong>
        <p>Start client, supplier and employee onboarding in the owning business function. NuBlox resolves or creates the canonical Party behind that workflow.</p>
      </div>
    </section>

    <main class="inspector">
      {#if data.selected}
        <section class="identity-card section-card">
          <div class="identity-heading">
            <div><span class="eyebrow">{data.selected.partyType} · canonical identity</span><h2>{data.selected.displayName}</h2><code>{data.selected.id}</code></div>
            <div class="identity-actions">
              <div class="identity-badges"><span>{data.selected.status}</span><span>v{data.selected.version}</span>{#if data.selected.isLegalEntity}<span class="legal">Legal entity</span>{/if}</div>
              <TaskContextButton
                contextKey={'PARTY:' + data.selected.id}
                objectType="PARTY"
                objectId={data.selected.id}
                objectVersion={data.selected.version}
                title={data.selected.displayName}
                subtitle="Canonical Party identity"
                routePath={selectedRoute()}
                workspaceFunctionId={data.selected.originFunctionId?.startsWith('F') ? data.selected.originFunctionId : null}
              />
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
              {/if}
            {/if}
          </dl>

          <section class="provenance">
            <div><span class="eyebrow">Origination & stewardship</span><h3>{functionNames[data.selected.originFunctionId ?? 'PLATFORM'] ?? data.selected.originFunctionId ?? 'Legacy / unclassified'}</h3></div>
            <div class="provenance-grid">
              <span><small>Origin function</small><strong>{data.selected.originFunctionId ?? 'Legacy'}</strong></span>
              <span><small>Origin object</small><strong>{data.selected.originObjectType ?? '—'}</strong></span>
              <span><small>Steward</small><strong>{functionNames[data.selected.stewardFunctionId ?? 'PLATFORM'] ?? data.selected.stewardFunctionId ?? '—'}</strong></span>
              <span><small>Created</small><strong>{new Date(data.selected.createdAt).toLocaleDateString('en-GB')}</strong></span>
            </div>
            {#if data.selected.originReference}<p>{data.selected.originReference}</p>{/if}
          </section>

          {#if data.selected.partyType === 'ORGANISATION' && data.authority.canSteward}
            <a class="editor-link" href={`/${data.tenantSlug}/app/admin/master-data/organisations?organisation=${data.selected.id}`}>
              Open exceptional identity stewardship →
            </a>
          {/if}
        </section>

        <section class="relationships section-card">
          <div class="panel-heading"><div><span class="eyebrow">AGG-01-PARTY-RELATIONSHIP</span><h2>Business relationships</h2></div><span class="count">{data.relationships.length}</span></div>
          <p class="section-note">Relationships are displayed here for identity resolution. Their business lifecycle belongs to the owning function.</p>
          <div class="relationship-list">
            {#each data.relationships as relationship}
              <article>
                <span class="direction">{relationshipDirection(relationship)}</span>
                <div class="relationship-copy"><strong>{relationshipParty(relationship)}</strong><small>{relationship.relationshipType} · {relationship.contextType}</small></div>
                <span class={'status status-' + relationship.status.toLowerCase()}>{relationship.status}</span>
                {#if relationship.homeHref}
                  <a class="home-link" href={relationship.homeHref}>Open {relationship.homeFunctionName} →</a>
                {:else}
                  <span class="home-label">Shared / platform relationship</span>
                {/if}
              </article>
            {:else}<p class="empty">No governed relationships recorded for this Party.</p>{/each}
          </div>
        </section>
      {:else}
        <section class="section-card empty-state">
          <span class="eyebrow">Canonical identity</span><h2>No Parties yet</h2>
          <p>New identities will enter the directory through their owning client, supplier, employee or legal workflow—not from this administration page.</p>
        </section>
      {/if}
    </main>
  </div>
</div>

<style>
  .party-page{display:grid;gap:12px}.section-card{border:1px solid var(--line);border-radius:10px;background:#fff}.hero{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(360px,.7fr);gap:22px;padding:18px;border-color:#8fc9ee;background:linear-gradient(120deg,#fbfdff,#eaf6fd)}.eyebrow{color:var(--blue-700);font-size:9px;font-weight:850;letter-spacing:.07em;text-transform:uppercase}h1{margin:3px 0 6px;font-size:25px}h2{margin:2px 0;font-size:16px}h3{margin:3px 0;font-size:12px}.hero p,.section-note,.creation-rule p,.provenance p,.empty-state p{margin:0;color:#526a7d;font-size:10px;line-height:1.5}.origin-policy{display:grid;gap:5px;padding:10px;border:1px solid #c6dfe9;border-radius:9px;background:#ffffffd9}.origin-policy>strong{font-size:9px;text-transform:uppercase;color:#60788a}.origin-policy a{display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-top:1px solid #e7eef2;text-decoration:none}.origin-policy span{font-size:8.5px;color:#617786}.origin-policy b{font-size:8.5px;color:#315f7d}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.metric{display:grid;gap:2px;padding:10px 12px}.metric strong{font-size:20px;color:#274b64}.metric span{font-size:8px;text-transform:uppercase;color:#758896}.filters{display:grid;grid-template-columns:minmax(260px,1fr) 150px 150px auto;gap:8px;align-items:end;padding:10px}.filters label{display:grid;gap:4px;font-size:8.5px;font-weight:750;color:#52697a}.filters input,.filters select{width:100%;padding:7px;border:1px solid #ccd8e0;border-radius:6px;font:inherit}.filter-actions{display:flex;gap:5px}.filter-actions button,.filter-actions a{border:0;border-radius:6px;padding:8px 10px;font-size:8.5px;font-weight:800;text-decoration:none}.filter-actions button{background:var(--blue-700);color:white}.filter-actions a{border:1px solid #cdd9e0;color:#52697a}.workspace-grid{display:grid;grid-template-columns:430px minmax(0,1fr);gap:10px;align-items:start}.register,.identity-card,.relationships{padding:12px}.register{position:sticky;top:78px}.panel-heading,.identity-heading{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.party-list{display:grid;gap:5px;margin-top:8px}.party-list a{display:grid;grid-template-columns:26px minmax(0,1fr) auto;gap:8px;align-items:center;padding:7px;border:1px solid #e0e7ec;border-radius:7px;text-decoration:none;background:#fafcfd}.party-list a.active{border-color:#79bde2;background:#eef8fd;box-shadow:inset 3px 0 var(--blue-700)}.type-icon{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#edf5f9;color:#35627d;font-size:8px;font-weight:900}.type-icon.person{background:#edf7ed;color:#46704b}.party-copy{display:grid;gap:2px}.party-copy strong{font-size:9.5px;color:#2f4b5d}.party-copy small{font-size:7.5px;color:#7d8d99}.status{display:inline-block;padding:3px 6px;border-radius:999px;background:#eef1f3;color:#526574;font-size:7.5px;font-weight:850;text-transform:uppercase}.status-active{background:#e5f5e9;color:#2a6939}.status-proposed{background:#fff3da;color:#7b5a18}.status-inactive,.status-ended{background:#edf0f2;color:#68757f}.creation-rule{margin-top:10px;padding:9px;border:1px solid #d6e4eb;border-radius:7px;background:#f7fbfd}.creation-rule strong{display:block;margin-bottom:3px;color:#315d76;font-size:9px}.inspector{display:grid;gap:10px}.identity-actions{display:grid;justify-items:end;gap:7px}.identity-badges{display:flex;gap:4px}.identity-badges span{padding:3px 6px;border-radius:999px;background:#eef4f7;color:#526d7e;font-size:7.5px;font-weight:850}.identity-heading code{font-size:7.5px;color:#7d8d99}dl{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:11px 0}dl div{padding:7px;border-radius:6px;background:#f5f8fa}dt{font-size:7px;text-transform:uppercase;color:#82919c}dd{margin:3px 0 0;font-size:9px;font-weight:700;color:#395569}.provenance{padding:10px;border:1px solid #dce7ec;border-radius:8px;background:#fbfdfe}.provenance-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:7px}.provenance-grid span{display:grid;gap:2px}.provenance-grid small{font-size:7px;color:#84939d}.provenance-grid strong{font-size:8.5px;color:#405c6f}.editor-link{display:inline-block;margin-top:9px;color:#2f6686;font-size:8.5px;font-weight:800;text-decoration:none}.section-note{margin:5px 0 9px}.count{min-width:25px;padding:4px 6px;border-radius:999px;background:#eef3f6;color:#607584;font-size:8px;font-weight:800;text-align:center}.relationship-list{display:grid;gap:5px}.relationship-list article{display:grid;grid-template-columns:55px minmax(0,1fr) auto auto;gap:8px;align-items:center;padding:8px;border:1px solid #e2e8ec;border-radius:7px;background:#fbfcfd}.direction{font-size:7.5px;font-weight:850;text-transform:uppercase;color:#6c8190}.relationship-copy{display:grid;gap:2px}.relationship-copy strong{font-size:9px;color:#355166}.relationship-copy small,.home-label{font-size:7.5px;color:#82919c}.home-link{font-size:8px;font-weight:800;color:#2f6686;text-decoration:none}.empty,.empty-state{color:#758896;font-size:9px}.empty-state{min-height:240px;display:grid;place-content:center;text-align:center;padding:20px}.empty-state p{max-width:520px;margin-top:6px}@media(max-width:1100px){.hero,.workspace-grid{grid-template-columns:1fr}.register{position:static}.filters{grid-template-columns:1fr 1fr}.provenance-grid,dl{grid-template-columns:repeat(2,1fr)}}@media(max-width:700px){.metrics,.filters,.provenance-grid,dl{grid-template-columns:1fr}.relationship-list article{grid-template-columns:1fr auto}.direction,.home-link,.home-label{grid-column:1/-1}.origin-policy{display:none}}
</style>
