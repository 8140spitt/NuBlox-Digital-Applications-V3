<script lang="ts">
  let { data } = $props();

  const recentContexts = $derived((data.workContexts ?? []).slice(0, 6));

  function workMeta(item: (typeof data.work)[number]) {
    return item.status.replaceAll('_', ' ') + ' · ' + item.workType.replaceAll('_', ' ');
  }
</script>

<svelte:head>
  <title>Home · NuBlox</title>
</svelte:head>

<div class="home-page">
  {#if data.accessRequestState === 'submitted'}
    <div class="access-message success" role="status">
      <strong>Permission request submitted.</strong>
      <span>A Tenant Administrator can now review it in My Work.</span>
    </div>
  {:else if data.accessRequestState === 'already-requested'}
    <div class="access-message" role="status">
      <strong>Permission request already open.</strong>
      <span>Your existing request is already waiting for a Tenant Administrator in My Work.</span>
    </div>
  {:else if data.accessRequestState === 'already-authorized'}
    <div class="access-message success" role="status">
      <strong>Your access has changed.</strong>
      <span>You already hold the requested permission. Try opening the area again.</span>
    </div>
  {/if}

  <header class="page-heading">
    <div>
      <span class="eyebrow">Home</span>
      <h1>Welcome, {data.actorDisplayName}</h1>
      <p>Pick up active work, return to a working context or move into a business function.</p>
    </div>
    <a class="directory-link" href={'/' + data.tenantSlug + '/app/functions'}
      >Browse all functions</a
    >
  </header>

  <section class="focus-grid" aria-label="Your work">
    <article class="section-card work-card">
      <div class="card-heading">
        <div>
          <span class="eyebrow">My Work</span>
          <h2>Needs your attention</h2>
        </div>
        <a href={'/' + data.tenantSlug + '/app/work'}>
          <strong>{data.workCount}</strong>
          <span>open</span>
        </a>
      </div>

      <div class="work-preview">
        {#each data.work as item}
          <a href={item.subjectHref ?? '/' + data.tenantSlug + '/app/work'}>
            <span class={'priority priority-' + item.priority.toLowerCase()}>{item.priority}</span>
            <span class="work-copy">
              <strong>{item.title}</strong>
              <small>{workMeta(item)}</small>
            </span>
            <span class="arrow" aria-hidden="true">→</span>
          </a>
        {:else}
          <div class="empty">
            <span class="empty-mark">✓</span>
            <div>
              <strong>You are clear for now</strong>
              <span>No active work is assigned to you.</span>
            </div>
          </div>
        {/each}
      </div>

      <a class="text-link" href={'/' + data.tenantSlug + '/app/work'}>Open My Work →</a>
    </article>

    <article class="section-card continue-card">
      <div class="card-heading">
        <div>
          <span class="eyebrow">Task Bar</span>
          <h2>Continue working</h2>
        </div>
        <span class="context-count">{recentContexts.length} open</span>
      </div>

      <div class="context-list">
        {#each recentContexts as context}
          <a href={context.routePath}>
            <span class="context-key">{context.workspaceFunctionId ?? context.objectType}</span>
            <span class="context-copy">
              <strong>{context.title}</strong>
              <small>{context.subtitle ?? 'Open working context'}</small>
            </span>
            <span class="arrow" aria-hidden="true">→</span>
          </a>
        {:else}
          <div class="empty">
            <span class="empty-mark neutral">□</span>
            <div>
              <strong>No pinned work yet</strong>
              <span>Pin a page or begin editing and it will stay available in the Task Bar.</span>
            </div>
          </div>
        {/each}
      </div>
    </article>
  </section>

  <section class="personal-grid" aria-label="Favourites and recent items">
    <article class="section-card personal-card">
      <div class="card-heading">
        <div>
          <span class="eyebrow">Favourites</span>
          <h2>Pinned by you</h2>
        </div>
        <span class="context-count">{data.favourites.length}</span>
      </div>

      <div class="personal-list">
        {#each data.favourites as item}
          <a href={item.routePath}>
            <span class="item-kind">{item.itemType}</span>
            <span class="item-copy">
              <strong>{item.title}</strong>
              <small>{item.subtitle ?? 'Favourite enterprise item'}</small>
            </span>
            <span class="arrow" aria-hidden="true">→</span>
          </a>
        {:else}
          <div class="empty compact">
            <span class="empty-mark neutral">☆</span>
            <div>
              <strong>No favourites yet</strong>
              <span>Favourite a canonical object to keep it close at hand.</span>
            </div>
          </div>
        {/each}
      </div>
    </article>

    <article class="section-card personal-card">
      <div class="card-heading">
        <div>
          <span class="eyebrow">Recent</span>
          <h2>Recently opened</h2>
        </div>
        <span class="context-count">{data.recent.length}</span>
      </div>

      <div class="personal-list">
        {#each data.recent as item}
          <a href={item.routePath}>
            <span class="item-kind">{item.itemType}</span>
            <span class="item-copy">
              <strong>{item.title}</strong>
              <small>{item.subtitle ?? 'Recent enterprise item'}</small>
            </span>
            <span class="arrow" aria-hidden="true">→</span>
          </a>
        {:else}
          <div class="empty compact">
            <span class="empty-mark neutral">↺</span>
            <div>
              <strong>No recent objects yet</strong>
              <span>Open an object or workspace and it will appear here.</span>
            </div>
          </div>
        {/each}
      </div>
    </article>
  </section>

  <section class="section-card function-section">
    <div class="section-heading">
      <div>
        <span class="eyebrow">Business functions</span>
        <h2>Move through the enterprise by the work you need to do</h2>
      </div>
      <a href={'/' + data.tenantSlug + '/app/functions'}>Function directory →</a>
    </div>

    <div class="function-grid">
      {#each data.functions as fn}
        <a href={'/' + data.tenantSlug + '/app/functions/' + fn.id.toLowerCase()} title={fn.name}>
          <span class="fn-id">{fn.id}</span>
          <span class="fn-copy">
            <strong>{fn.shortName}</strong>
            <small>{fn.name}</small>
          </span>
          <span class="arrow" aria-hidden="true">→</span>
        </a>
      {/each}
    </div>
  </section>
</div>

<style>
  .home-page {
    display: grid;
    gap: 18px;
    max-width: 1500px;
    margin: 0 auto;
  }
  .access-message {
    display: flex;
    gap: 8px;
    align-items: baseline;
    padding: 10px 12px;
    border: 1px solid #b8dcef;
    border-radius: 8px;
    background: #f4faff;
    color: #456275;
    font-size: 10.5px;
  }
  .access-message.success {
    border-color: #b8dfc0;
    background: #f2faf4;
    color: #326841;
  }
  .page-heading {
    display: flex;
    justify-content: space-between;
    gap: 22px;
    align-items: end;
    padding: 4px 2px 2px;
  }
  .eyebrow {
    color: #657f90;
    font-size: 9px;
    font-weight: 850;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  h1 {
    margin: 3px 0 5px;
    color: #183b51;
    font-size: 25px;
    line-height: 1.2;
    letter-spacing: -0.025em;
  }
  h2 {
    margin: 2px 0 0;
    color: #28495e;
    font-size: 15px;
    line-height: 1.25;
  }
  .page-heading p {
    margin: 0;
    color: #657a89;
    font-size: 11.5px;
  }
  .directory-link,
  .text-link,
  .section-heading > a {
    color: #23698e;
    font-size: 10px;
    font-weight: 800;
    text-decoration: none;
  }
  .directory-link:hover,
  .text-link:hover,
  .section-heading > a:hover {
    text-decoration: underline;
  }
  .focus-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
    gap: 14px;
  }
  .personal-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }
  .personal-card {
    min-width: 0;
    padding: 15px;
  }
  .personal-list {
    display: grid;
    gap: 4px;
  }
  .personal-list > a {
    min-width: 0;
    min-height: 43px;
    display: grid;
    grid-template-columns: 58px minmax(0, 1fr) auto;
    gap: 9px;
    align-items: center;
    padding: 6px 8px;
    border: 1px solid transparent;
    border-radius: 7px;
    color: inherit;
    text-decoration: none;
  }
  .personal-list > a:hover {
    border-color: #c9dce7;
    background: #f5fafc;
  }
  .item-kind {
    width: max-content;
    padding: 3px 6px;
    border-radius: 5px;
    background: #eef4f7;
    color: #607887;
    font-size: 7px;
    font-weight: 850;
    text-transform: uppercase;
  }
  .item-copy {
    min-width: 0;
    display: grid;
    gap: 2px;
  }
  .item-copy strong,
  .item-copy small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .item-copy strong {
    color: #38576b;
    font-size: 10px;
  }
  .item-copy small {
    color: #81909a;
    font-size: 8.5px;
  }
  .empty.compact {
    min-height: 58px;
  }
  .work-card,
  .continue-card,
  .function-section {
    padding: 15px;
  }
  .card-heading,
  .section-heading {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: start;
  }
  .card-heading {
    margin-bottom: 11px;
  }
  .card-heading > a {
    min-width: 54px;
    display: grid;
    justify-items: end;
    color: #245f80;
    text-decoration: none;
  }
  .card-heading > a strong {
    font-size: 19px;
    line-height: 1;
  }
  .card-heading > a span,
  .context-count {
    color: #7d8d98;
    font-size: 8px;
    font-weight: 750;
    text-transform: uppercase;
  }
  .work-preview,
  .context-list {
    display: grid;
    gap: 5px;
  }
  .work-preview > a,
  .context-list > a {
    min-height: 48px;
    display: grid;
    gap: 9px;
    align-items: center;
    padding: 7px 8px;
    border: 1px solid transparent;
    border-radius: 8px;
    color: inherit;
    text-decoration: none;
  }
  .work-preview > a {
    grid-template-columns: 58px minmax(0, 1fr) auto;
  }
  .context-list > a {
    grid-template-columns: 42px minmax(0, 1fr) auto;
  }
  .work-preview > a:hover,
  .context-list > a:hover {
    border-color: #c9dce7;
    background: #f5fafc;
  }
  .work-copy,
  .context-copy {
    min-width: 0;
    display: grid;
    gap: 2px;
  }
  .work-copy strong,
  .context-copy strong {
    overflow: hidden;
    color: #375568;
    font-size: 10.5px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .work-copy small,
  .context-copy small {
    overflow: hidden;
    color: #81909a;
    font-size: 8.5px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .priority,
  .context-key {
    width: max-content;
    padding: 3px 6px;
    border-radius: 999px;
    font-size: 7.5px;
    font-weight: 850;
    text-transform: uppercase;
  }
  .priority {
    background: #edf2f5;
    color: #607582;
  }
  .priority-urgent {
    background: #fde9df;
    color: #88451f;
  }
  .priority-high {
    background: #fff2d7;
    color: #7c5b18;
  }
  .context-key {
    border-radius: 5px;
    background: #edf6fb;
    color: #35647e;
  }
  .arrow {
    color: #8aa0ad;
    font-size: 12px;
  }
  .text-link {
    display: inline-block;
    margin-top: 11px;
  }
  .empty {
    min-height: 72px;
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 8px;
    color: #728591;
  }
  .empty-mark {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    flex: 0 0 34px;
    border-radius: 50%;
    background: #e9f6ec;
    color: #347344;
    font-size: 13px;
  }
  .empty-mark.neutral {
    background: #eef3f5;
    color: #708691;
  }
  .empty > div {
    display: grid;
    gap: 2px;
  }
  .empty strong {
    color: #516b7b;
    font-size: 10.5px;
  }
  .empty span {
    font-size: 9px;
    line-height: 1.35;
  }
  .function-section {
    min-width: 0;
  }
  .section-heading {
    align-items: end;
    margin-bottom: 12px;
  }
  .function-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 5px;
  }
  .function-grid > a {
    min-width: 0;
    min-height: 51px;
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr) auto;
    gap: 8px;
    align-items: center;
    padding: 8px;
    border: 1px solid #e2e8ec;
    border-radius: 8px;
    background: #fbfcfd;
    color: inherit;
    text-decoration: none;
  }
  .function-grid > a:hover {
    border-color: #b5d4e4;
    background: #f2f9fc;
  }
  .fn-id {
    color: #477188;
    font-size: 9px;
    font-weight: 900;
  }
  .fn-copy {
    min-width: 0;
    display: grid;
    gap: 2px;
  }
  .fn-copy strong,
  .fn-copy small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .fn-copy strong {
    color: #365267;
    font-size: 10px;
  }
  .fn-copy small {
    color: #86949d;
    font-size: 8px;
  }
  @media (max-width: 1100px) {
    .function-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 800px) {
    .page-heading,
    .focus-grid,
    .personal-grid {
      display: grid;
      grid-template-columns: 1fr;
    }
    .page-heading {
      align-items: start;
    }
    .function-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
