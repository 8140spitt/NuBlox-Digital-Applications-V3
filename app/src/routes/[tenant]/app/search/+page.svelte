<script lang="ts">
  let { data } = $props();
</script>

<svelte:head>
  <title>Enterprise Search · NuBlox</title>
</svelte:head>

<div class="search-page">
  <header class="page-heading">
    <span class="eyebrow">Enterprise Search</span>
    <h1>Find business objects and enterprise destinations</h1>
    <p>
      Search results are permission-aware and link to the canonical object or workspace identity.
    </p>
  </header>

  <form class="search-box" method="GET">
    <span aria-hidden="true">⌕</span>
    <label>
      <span class="sr-only">Search NuBlox</span>
      <input
        name="q"
        value={data.query}
        minlength="2"
        maxlength="200"
        autocomplete="off"
        placeholder="Search Leads, functions and enterprise destinations"
        autofocus
      />
    </label>
    <button type="submit">Search</button>
  </form>

  {#if data.query.length < 2}
    <section class="search-state section-card">
      <strong>Enter at least two characters.</strong>
      <span
        >Object search currently covers runtime-registered business objects and expands as object
        types join the registry.</span
      >
    </section>
  {:else}
    <div class="result-summary">
      <strong>{data.resultCount}</strong>
      <span>result{data.resultCount === 1 ? '' : 's'} for “{data.query}”</span>
    </div>

    {#if data.objects.length}
      <section class="result-section section-card">
        <header>
          <div>
            <span class="eyebrow">Objects</span>
            <h2>Canonical business objects</h2>
          </div>
          <span class="count">{data.objects.length}</span>
        </header>

        <div class="result-list">
          {#each data.objects as item}
            <a href={item.href}>
              <span class="type">{item.objectLabel}</span>
              <span class="result-copy">
                <span class="identity">
                  <strong>{item.reference}</strong>
                  {#if item.status}<span class="status">{item.status.replaceAll('_', ' ')}</span
                    >{/if}
                </span>
                <span class="title">{item.title}</span>
                {#if item.subtitle}<small>{item.subtitle}</small>{/if}
              </span>
              <span class="arrow" aria-hidden="true">→</span>
            </a>
          {/each}
        </div>
      </section>
    {/if}

    {#if data.destinations.length}
      <section class="result-section section-card">
        <header>
          <div>
            <span class="eyebrow">Destinations</span>
            <h2>Enterprise workspaces and functions</h2>
          </div>
          <span class="count">{data.destinations.length}</span>
        </header>

        <div class="result-list">
          {#each data.destinations as item}
            <a href={item.href}>
              <span class="type">{item.type}</span>
              <span class="result-copy">
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </span>
              <span class="arrow" aria-hidden="true">→</span>
            </a>
          {/each}
        </div>
      </section>
    {/if}

    {#if data.resultCount === 0}
      <section class="search-state section-card">
        <strong>No authorised results found.</strong>
        <span
          >Try a business reference, prospect, organisation, function number or enterprise workspace
          name.</span
        >
      </section>
    {/if}
  {/if}
</div>

<style>
  .search-page {
    max-width: 1050px;
    display: grid;
    gap: 13px;
  }

  .page-heading {
    padding: 4px 2px 1px;
  }

  .eyebrow {
    color: #6f8492;
    font-size: 8.5px;
    font-weight: 850;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1 {
    margin: 4px 0 6px;
    color: #193d53;
    font-size: 24px;
    letter-spacing: -0.025em;
  }

  h2 {
    margin: 2px 0 0;
    color: #36576b;
    font-size: 14px;
  }

  .page-heading p {
    max-width: 760px;
    margin: 0;
    color: #687d8b;
    font-size: 10.5px;
    line-height: 1.5;
  }

  .search-box {
    min-height: 47px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 9px;
    align-items: center;
    padding: 5px 6px 5px 13px;
    border: 1px solid #bfd1dc;
    border-radius: 9px;
    background: white;
    box-shadow: 0 4px 16px rgba(12, 48, 70, 0.06);
  }

  .search-box > span {
    color: #607d8e;
    font-size: 18px;
  }

  .search-box label {
    min-width: 0;
  }

  .search-box input {
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: #29495e;
    font-size: 12px;
  }

  .search-box button {
    min-height: 35px;
    border: 0;
    border-radius: 7px;
    padding: 0 13px;
    background: var(--blue-700);
    color: white;
    font-size: 9px;
    font-weight: 850;
    cursor: pointer;
  }

  .result-summary {
    display: flex;
    gap: 5px;
    align-items: baseline;
    padding: 0 2px;
    color: #748894;
    font-size: 9px;
  }

  .result-summary strong {
    color: #405f72;
    font-size: 12px;
  }

  .result-section {
    padding: 13px;
  }

  .result-section > header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: end;
    margin-bottom: 8px;
  }

  .count {
    min-width: 24px;
    padding: 3px 6px;
    border-radius: 999px;
    background: #edf3f6;
    color: #607987;
    font-size: 8px;
    font-weight: 850;
    text-align: center;
  }

  .result-list {
    display: grid;
    gap: 3px;
  }

  .result-list > a {
    min-width: 0;
    min-height: 50px;
    display: grid;
    grid-template-columns: 112px minmax(0, 1fr) 24px;
    gap: 10px;
    align-items: center;
    padding: 7px 9px;
    border: 1px solid transparent;
    border-radius: 7px;
    color: inherit;
    text-decoration: none;
  }

  .result-list > a:hover,
  .result-list > a:focus-visible {
    outline: 0;
    border-color: #c9dce6;
    background: #f5fafc;
  }

  .type {
    color: #718692;
    font-size: 8px;
    font-weight: 850;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .result-copy {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .identity {
    display: flex;
    gap: 7px;
    align-items: center;
  }

  .result-copy strong,
  .title {
    overflow: hidden;
    color: #35566a;
    font-size: 10.5px;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .title {
    color: #526d7e;
    font-size: 9.5px;
    font-weight: 700;
  }

  .result-copy small {
    overflow: hidden;
    color: #81909a;
    font-size: 8.5px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .status {
    flex: 0 0 auto;
    padding: 2px 5px;
    border-radius: 999px;
    background: #edf4f7;
    color: #607887;
    font-size: 7px;
    font-weight: 850;
    text-transform: uppercase;
  }

  .arrow {
    color: #8199a7;
    text-align: center;
  }

  .search-state {
    display: grid;
    gap: 4px;
    padding: 18px;
    text-align: center;
  }

  .search-state strong {
    color: #405e71;
    font-size: 11px;
  }

  .search-state span {
    color: #788b96;
    font-size: 9px;
    line-height: 1.45;
  }

  @media (max-width: 640px) {
    .result-list > a {
      grid-template-columns: minmax(0, 1fr) 24px;
    }

    .type {
      display: none;
    }
  }
</style>
