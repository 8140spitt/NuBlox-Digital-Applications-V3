<script lang="ts">
  import { enterpriseFunctions } from '$lib/enterprise/functions';
  let { data } = $props();

  const ids = ['F01', 'F02', 'F03', 'F04'];
  const functions = enterpriseFunctions.filter((fn) => ids.includes(fn.id));
</script>

<svelte:head><title>Operate the Business · NuBlox</title></svelte:head>

<div class="stream-page">
  <header>
    <span class="eyebrow">Operate the Business</span>
    <h1>Run, govern and improve the enterprise</h1>
    <p>
      Strategy, governance, enterprise performance and corporate development are the currently
      implemented operating workspaces. Finance, people, risk, technology and the remaining
      operating capabilities will join this stream as their runtimes are built.
    </p>
  </header>

  <section class="section-card workspace-list">
    <div class="section-heading">
      <div>
        <span class="eyebrow">Available now</span>
        <h2>Operating workspaces</h2>
      </div>
      <a href={'/' + data.tenantSlug + '/app/functions'}>All 29 functions</a>
    </div>
    <div class="rows">
      {#each functions as fn}
        <a href={'/' + data.tenantSlug + '/app/functions/' + fn.id.toLowerCase()}>
          <span class="id">{fn.id}</span>
          <span><strong>{fn.shortName}</strong><small>{fn.name}</small></span>
          <span class="state">{fn.state}</span>
          <span aria-hidden="true">→</span>
        </a>
      {/each}
    </div>
  </section>
</div>

<style>
  .stream-page {
    display: grid;
    gap: 14px;
    max-width: 1100px;
  }
  header {
    padding: 4px 2px;
  }
  .eyebrow {
    color: var(--blue-700);
    font-size: 9px;
    font-weight: 850;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }
  h1 {
    margin: 4px 0 7px;
    color: #29495e;
    font-size: 25px;
  }
  h2 {
    margin: 2px 0 0;
    color: #29495e;
    font-size: 16px;
  }
  header p {
    max-width: 820px;
    margin: 0;
    color: #5c7282;
    font-size: 11px;
    line-height: 1.5;
  }
  .workspace-list {
    padding: 14px;
  }
  .section-heading {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: end;
    margin-bottom: 10px;
  }
  .section-heading a {
    color: #2f6483;
    font-size: 9.5px;
    font-weight: 800;
    text-decoration: none;
  }
  .rows {
    display: grid;
    gap: 4px;
  }
  .rows a {
    display: grid;
    grid-template-columns: 46px minmax(0, 1fr) auto 20px;
    gap: 10px;
    align-items: center;
    padding: 9px 10px;
    border: 1px solid #e0e7eb;
    border-radius: 7px;
    color: #405d70;
    text-decoration: none;
  }
  .rows a:hover {
    border-color: #b9d4e3;
    background: #f7fbfd;
  }
  .rows .id {
    color: #718693;
    font-size: 9px;
    font-weight: 900;
  }
  .rows strong,
  .rows small {
    display: block;
  }
  .rows strong {
    font-size: 10.5px;
  }
  .rows small {
    margin-top: 2px;
    color: #7a8b96;
    font-size: 8.5px;
  }
  .state {
    padding: 3px 6px;
    border-radius: 999px;
    background: #edf5ef;
    color: #3b7046;
    font-size: 7px;
    font-weight: 850;
    text-transform: uppercase;
  }
</style>
