<script lang="ts">
  import { enterpriseFunctions } from '$lib/enterprise/functions';
  let { data } = $props();

  const ids = ['F05', 'F06', 'F07', 'F09', 'F12', 'F13', 'F22', 'F23', 'F26', 'F27'];
  const functions = enterpriseFunctions.filter((fn) => ids.includes(fn.id));
</script>

<svelte:head><title>Deliver the Business · NuBlox</title></svelte:head>

<div class="stream-page">
  <header>
    <span class="eyebrow">Deliver the Business</span>
    <h1>Turn opportunity into delivered and operated outcomes</h1>
    <p>
      The delivery stream connects product and market work to sales, contract, project, procurement,
      information, field delivery, handover and asset operation. Existing and planned function
      workspaces are shown together so the end-to-end chain remains visible.
    </p>
  </header>

  <section class="section-card chain">
    <span>Need</span><b>→</b><span>Lead</span><b>→</b><span>Opportunity</span><b>→</b><span
      >Bid</span
    ><b>→</b><span>Contract</span><b>→</b><span>Project</span><b>→</b><span>Handover</span><b>→</b
    ><span>Asset / Service</span>
  </section>

  <section class="section-card workspace-list">
    <div class="section-heading">
      <div>
        <span class="eyebrow">Delivery capability</span>
        <h2>Workspaces</h2>
      </div>
      <a href={'/' + data.tenantSlug + '/app/functions'}>All 29 functions</a>
    </div>
    <div class="rows">
      {#each functions as fn}
        <a href={'/' + data.tenantSlug + '/app/functions/' + fn.id.toLowerCase()}>
          <span class="id">{fn.id}</span>
          <span><strong>{fn.shortName}</strong><small>{fn.name}</small></span>
          <span class:planned={fn.state === 'planned'} class="state">{fn.state}</span>
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
    max-width: 840px;
    margin: 0;
    color: #5c7282;
    font-size: 11px;
    line-height: 1.5;
  }
  .chain {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    padding: 10px 12px;
    color: #49687b;
    font-size: 9px;
  }
  .chain span {
    padding: 5px 7px;
    border-radius: 6px;
    background: #f1f6f9;
    font-weight: 750;
  }
  .chain b {
    color: #9aabb5;
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
  .state.planned {
    background: #f2f4f5;
    color: #7a8992;
  }
</style>
