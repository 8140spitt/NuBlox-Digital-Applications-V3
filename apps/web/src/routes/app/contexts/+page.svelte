<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function unitDepth(
    unit: NonNullable<PageData['structure']>['organisations'][number]['units'][number],
    units: NonNullable<PageData['structure']>['organisations'][number]['units']
  ) {
    const byId = new Map(units.map((item) => [item.id, item]));
    const visited = new Set<string>();
    let depth = 0;
    let parentId = unit.parentUnitId;

    while (parentId && !visited.has(parentId)) {
      visited.add(parentId);
      const parent = byId.get(parentId);
      if (!parent) break;
      depth += 1;
      parentId = parent.parentUnitId;
    }

    return depth;
  }
</script>

<svelte:head>
  <title>Contexts — NuBlox</title>
  <meta name="description" content="NuBlox tenant and organisational contexts" />
</svelte:head>

<section class="workspace-hero compact">
  <div>
    <p class="app-eyebrow">Context hierarchy</p>
    <h1>Choose where the organisation operates.</h1>
    <p class="workspace-lede">
      A Context establishes where Teams, Positions, work, information and governance apply. Start at the Tenant Site,
      then move into an Organisation or child organisational context.
    </p>
  </div>
</section>

<section class="context-principle" aria-label="Context operating model">
  <strong>Context → Team → Governance / Delivery → Positions / People → Work → Work Products / Evidence</strong>
  <p>The same canonical Team types can operate at each organisational level without duplicating the capability definition.</p>
</section>

{#if !data.allowed || !data.structure}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit organisation context access.</h1>
      <p>{data.reason}</p>
      <div class="permission-actions">
        <a class="primary-action" href="/app/request-access?permission=platform.organisation.read&returnTo=/app/contexts">
          Request access <span aria-hidden="true">→</span>
        </a>
        <a class="quiet-link" href="/app">Back Home</a>
      </div>
    </div>
  </section>
{:else}
  <section class="context-directory">
    <article class="context-site-card">
      <div>
        <span class="context-type">Tenant Site</span>
        <h2>{data.tenantName}</h2>
        <p>Enterprise-wide administrative and operating context.</p>
      </div>
      <a class="primary-action" href="/app/teams?context=tenant">Open Teams <span>→</span></a>
    </article>

    <div class="context-organisations">
      {#each data.structure.organisations.filter((item) => item.status === 'ACTIVE') as organisation}
        {@const organisationName = organisation.tradingName ?? organisation.legalName}
        <article class="context-organisation-card">
          <header>
            <div>
              <span class="context-type">Organisation Context</span>
              <h2>{organisationName}</h2>
              <p>{organisation.units.length} child organisational unit(s)</p>
            </div>
            <a class="quiet-action" href={`/app/teams?context=org:${encodeURIComponent(organisation.id)}`}>Open 45 Teams →</a>
          </header>

          {#if organisation.units.length}
            <div class="context-unit-list">
              {#each organisation.units.filter((item) => item.status === 'ACTIVE') as unit}
                {@const depth = unitDepth(unit, organisation.units)}
                <a
                  class="context-unit-row"
                  style={`--context-depth: ${depth}`}
                  href={`/app/teams?context=unit:${encodeURIComponent(unit.id)}`}
                >
                  <span class="context-tree-mark">{depth ? '↳' : '└'}</span>
                  <div>
                    <strong>{unit.name}</strong>
                    <small>{unit.code} · child organisational context</small>
                  </div>
                  <span aria-hidden="true">→</span>
                </a>
              {/each}
            </div>
          {/if}
        </article>
      {:else}
        <div class="information-empty">
          No Organisation contexts exist yet. Use HCM &amp; Position Management to establish the organisational structure.
        </div>
      {/each}
    </div>
  </section>
{/if}
