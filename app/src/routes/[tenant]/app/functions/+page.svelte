<script lang="ts">
  let { data } = $props();
  let query = $state('');

  const visible = $derived(
    data.functions.filter((fn) => {
      const needle = query.trim().toLowerCase();
      return !needle || (fn.id + ' ' + fn.name + ' ' + fn.shortName).toLowerCase().includes(needle);
    })
  );
</script>

<svelte:head>
  <title>Business Functions · NuBlox</title>
</svelte:head>

<div class="directory-page">
  <header class="hero section-card">
    <div>
      <span class="eyebrow">Enterprise function directory</span>
      <h1>29 business functions</h1>
      <p>
        The tenant operating model is organised around business functions, while data ownership
        stays with shared canonical aggregates. Function boundaries do not create duplicate masters.
      </p>
    </div>
    <label class="search">
      <span>Find a function</span>
      <input bind:value={query} placeholder="F06, commercial, finance, HCM…" />
    </label>
  </header>

  <section class="function-grid">
    {#each visible as fn}
      <a
        class="function-card section-card"
        href={'/' + data.tenantSlug + '/app/functions/' + fn.id.toLowerCase()}
      >
        <div class="title-row">
          <span class="fn-id">{fn.id}</span>
          <span class:operational={fn.implementationState === 'active'} class="state">
            {fn.implementationState === 'active' ? 'Operational slice' : 'Governed map'}
          </span>
        </div>
        <h2>{fn.name}</h2>
        <div class="metrics">
          <span><strong>{fn.subfunctionCount}</strong>L2</span>
          <span><strong>{fn.activityCount}</strong>activities</span>
          <span><strong>{fn.aggregateCount}</strong>aggregates</span>
        </div>
        <div class="execution">
          <span>{fn.commandCount} commands</span>
          <span>{fn.queryCount} queries</span>
          <span>{fn.decisionControlledCount} decision-controlled</span>
        </div>
      </a>
    {:else}
      <div class="empty section-card">No business function matches “{query}”.</div>
    {/each}
  </section>
</div>

<style>
  .directory-page {
    display: grid;
    gap: 12px;
  }
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 24px;
    align-items: end;
    padding: 18px;
    border-color: #8fc9ee;
    background: linear-gradient(120deg, #fbfdff, #eaf6fd);
  }
  .eyebrow {
    color: var(--blue-700);
    font-size: 10px;
    font-weight: 850;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }
  h1 {
    margin: 3px 0 6px;
    font-size: 25px;
  }
  h2 {
    margin: 10px 0 12px;
    color: #314f64;
    font-size: 15px;
    line-height: 1.25;
  }
  .hero p {
    margin: 0;
    max-width: 780px;
    color: #526a7d;
    font-size: 11.5px;
    line-height: 1.45;
  }
  .search {
    display: grid;
    gap: 5px;
    color: #50697b;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
  }
  .search input {
    width: 100%;
    border: 1px solid #bfd3df;
    border-radius: 7px;
    padding: 9px 10px;
    background: white;
    color: var(--ink);
    font-size: 10.5px;
    text-transform: none;
  }
  .function-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 9px;
  }
  .function-card {
    padding: 12px;
    color: inherit;
    text-decoration: none;
    transition:
      border-color 0.12s ease,
      transform 0.12s ease;
  }
  .function-card:hover {
    border-color: #80bee2;
    transform: translateY(-1px);
  }
  .title-row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: center;
  }
  .fn-id {
    color: #2d6688;
    font-size: 10px;
    font-weight: 900;
  }
  .state {
    padding: 3px 6px;
    border-radius: 999px;
    background: #eef2f4;
    color: #778690;
    font-size: 7px;
    font-weight: 850;
    text-transform: uppercase;
  }
  .state.operational {
    background: #e5f4e8;
    color: #2e6f3b;
  }
  .metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 5px;
  }
  .metrics span {
    display: grid;
    gap: 1px;
    padding: 6px;
    border-radius: 6px;
    background: #f5f7f8;
    color: #7b8b96;
    font-size: 7.5px;
    text-transform: uppercase;
  }
  .metrics strong {
    color: #3d5b6e;
    font-size: 12px;
  }
  .execution {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;
  }
  .execution span {
    padding: 3px 5px;
    border-radius: 5px;
    background: #f0f5f8;
    color: #647b8b;
    font-size: 7.5px;
  }
  .empty {
    grid-column: 1/-1;
    min-height: 160px;
    display: grid;
    place-items: center;
    color: #748693;
    font-size: 11px;
  }
  @media (max-width: 1100px) {
    .function-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 720px) {
    .hero,
    .function-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
