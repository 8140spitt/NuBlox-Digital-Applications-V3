<script lang="ts">
  let { data } = $props();

  const mappedFunctions = $derived(data.functions.filter((item) => item.implementationState === 'planned'));
  const operationalFunctions = $derived(data.functions.filter((item) => item.implementationState === 'active'));
</script>

<svelte:head>
  <title>Home · NuBlox</title>
</svelte:head>

<div class="home-page">
  <header class="hero section-card">
    <div>
      <span class="eyebrow">NuBlox enterprise operating system</span>
      <h1>Welcome, {data.actorDisplayName}</h1>
      <p>
        One governed operating model across construction and the built environment: shared master
        data, explicit aggregate ownership, traceable work and all 29 business functions.
      </p>
    </div>
    <div class="coverage">
      <strong>Governed enterprise coverage</strong>
      <div><span>{data.coverage.functions}</span><small>functions</small></div>
      <div><span>{data.coverage.subfunctions}</span><small>L2 subfunctions</small></div>
      <div><span>{data.coverage.activities}</span><small>activities</small></div>
    </div>
  </header>

  <section class="focus-grid">
    <article class="section-card focus-card">
      <div class="card-heading">
        <div><span class="eyebrow">My Work</span><h2>Current assignments</h2></div>
        <a href={'/' + data.tenantSlug + '/app/work'}>Open My Work →</a>
      </div>
      <strong class="large-number">{data.workCount}</strong>
      <span class="muted">open Work Items currently visible to you</span>
      <div class="work-preview">
        {#each data.work as item}
          <a href={'/' + data.tenantSlug + '/app/work'}>
            <span class={'priority priority-' + item.priority.toLowerCase()}>{item.priority}</span>
            <span><strong>{item.title}</strong><small>{item.status.replaceAll('_', ' ')} · {item.workType}</small></span>
          </a>
        {:else}
          <p>No active work is assigned to your Party, identity or tenant roles.</p>
        {/each}
      </div>
    </article>

    <article class="section-card focus-card">
      <div class="card-heading">
        <div><span class="eyebrow">Enterprise foundation</span><h2>Authoritative shared services</h2></div>
      </div>
      <div class="foundation-links">
        <a href={'/' + data.tenantSlug + '/app/admin/master-data/parties'}><strong>Party master</strong><span>People, organisations, legal entities & relationships</span></a>
        <a href={'/' + data.tenantSlug + '/app/admin/master-data/organisation-structure'}><strong>Organisation structure</strong><span>Units, hierarchy & legal accountability</span></a>
        <a href={'/' + data.tenantSlug + '/app/admin/security'}><strong>Security & authority</strong><span>Identity, membership, RBAC & delegated authority</span></a>
        <a href={'/' + data.tenantSlug + '/app/admin/business-objects'}><strong>Architecture authority</strong><span>Canonical objects, aggregate coverage & decisions</span></a>
      </div>
    </article>
  </section>

  <section class="section-card function-section" id="functions">
    <div class="card-heading">
      <div>
        <span class="eyebrow">Business functions</span>
        <h2>29 governed workspaces</h2>
      </div>
      <a href={'/' + data.tenantSlug + '/app/functions'}>Open function directory →</a>
    </div>

    <div class="function-grid">
      {#each data.functions as fn}
        <a href={'/' + data.tenantSlug + '/app/functions/' + fn.id.toLowerCase()}>
          <span class="fn-id">{fn.id}</span>
          <span class="fn-copy">
            <strong>{fn.shortName}</strong>
            <small>{fn.subfunctionCount} L2 · {fn.activityCount} activities · {fn.aggregateCount} aggregates</small>
          </span>
          <span class:operational={fn.implementationState === 'active'} class="state">
            {fn.implementationState === 'active' ? 'Operational slice' : 'Governed map'}
          </span>
        </a>
      {/each}
    </div>

    <p class="implementation-note">
      {operationalFunctions.length} function currently has a dedicated transactional workspace;
      {mappedFunctions.length} additional functions are fully mapped to canonical objects and aggregate
      commands and are being implemented without duplicating shared masters.
    </p>
  </section>
</div>

<style>
  .home-page { display: grid; gap: 12px; }
  .hero { display: grid; grid-template-columns: minmax(0,1.45fr) minmax(340px,.65fr); gap: 24px; align-items: center; padding: 18px; border-color: #8fc9ee; background: linear-gradient(120deg,#fbfdff,#eaf6fd); }
  .eyebrow { color: var(--blue-700); font-size: 10px; font-weight: 850; letter-spacing: .07em; text-transform: uppercase; }
  h1 { margin: 3px 0 6px; font-size: 25px; }
  h2 { margin: 2px 0 0; font-size: 16px; }
  .hero p { margin: 0; max-width: 820px; color: #526a7d; font-size: 11.5px; line-height: 1.45; }
  .coverage { display: grid; grid-template-columns: repeat(3,1fr); gap: 7px; }
  .coverage > strong { grid-column: 1/-1; color: #315a73; font-size: 10.5px; }
  .coverage div { display: grid; gap: 1px; padding: 9px; border: 1px solid #bfddeb; border-radius: 8px; background: rgba(255,255,255,.78); }
  .coverage span { color: #1d5374; font-size: 18px; font-weight: 850; }
  .coverage small { color: #718592; font-size: 8px; text-transform: uppercase; }
  .focus-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .focus-card, .function-section { padding: 14px; }
  .card-heading { display: flex; justify-content: space-between; gap: 18px; align-items: end; margin-bottom: 10px; }
  .card-heading > a { color: var(--blue-700); font-size: 9.5px; font-weight: 800; text-decoration: none; }
  .large-number { display: block; color: #1d5272; font-size: 28px; line-height: 1; }
  .muted { color: #7b8c98; font-size: 9px; }
  .work-preview { display: grid; gap: 5px; margin-top: 10px; }
  .work-preview > a { display: grid; grid-template-columns: 58px minmax(0,1fr); gap: 8px; align-items: center; padding: 7px; border: 1px solid #e3e9ed; border-radius: 7px; color: inherit; text-decoration: none; background: #fbfcfd; }
  .work-preview strong { display: block; color: #3b5669; font-size: 10px; }
  .work-preview small { display: block; margin-top: 2px; color: #82909a; font-size: 8.5px; }
  .work-preview p { margin: 9px 0 0; color: #758896; font-size: 10px; }
  .priority { width: max-content; padding: 3px 5px; border-radius: 999px; background: #edf2f5; color: #607582; font-size: 7px; font-weight: 850; }
  .priority-urgent { background: #fde9df; color: #88451f; }
  .foundation-links { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
  .foundation-links a { display: grid; gap: 2px; padding: 9px; border: 1px solid #e0e7eb; border-radius: 8px; background: #fbfcfd; color: inherit; text-decoration: none; }
  .foundation-links a:hover { border-color: #98cbe8; background: #f1f9fd; }
  .foundation-links strong { color: #36566b; font-size: 10px; }
  .foundation-links span { color: #7a8b97; font-size: 8.5px; line-height: 1.35; }
  .function-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 6px; }
  .function-grid > a { display: grid; grid-template-columns: 38px minmax(0,1fr) auto; gap: 8px; align-items: center; min-height: 52px; padding: 8px; border: 1px solid #e1e7eb; border-radius: 7px; background: #fbfcfd; color: inherit; text-decoration: none; }
  .function-grid > a:hover { border-color: #8bc7e8; background: #eff8fd; }
  .fn-id { color: #2f6280; font-size: 9px; font-weight: 900; }
  .fn-copy { display: grid; gap: 2px; min-width: 0; }
  .fn-copy strong { color: #365267; font-size: 10px; }
  .fn-copy small { color: #82919c; font-size: 8px; }
  .state { padding: 3px 5px; border-radius: 999px; background: #eef2f4; color: #788690; font-size: 7px; font-weight: 800; text-transform: uppercase; }
  .state.operational { background: #e5f4e8; color: #2e6f3b; }
  .implementation-note { margin: 10px 0 0; color: #788a96; font-size: 9px; line-height: 1.4; }
  @media(max-width:1150px) { .function-grid { grid-template-columns: repeat(2,1fr); } }
  @media(max-width:800px) { .hero, .focus-grid { grid-template-columns: 1fr; } .function-grid { grid-template-columns: 1fr; } .foundation-links { grid-template-columns: 1fr; } }
</style>
