<script lang="ts">
  import type { PageData } from './$types';
  let {data}:{data:PageData}=$props();
  const direct=$derived(data.experience?.managementScope.filter(item=>item.depth===1)??[]);
  const wider=$derived(data.experience?.managementScope.filter(item=>item.depth>1)??[]);
</script>

<svelte:head><title>My Team — NuBlox</title></svelte:head>

{#if !data.experience}
  <section class="permission-state"><div class="permission-state-code">HC</div><div><h1>Your Position is not configured.</h1><p>Human Capital must establish your Employment and primary Position before NuBlox can resolve a management span.</p><a class="quiet-link" href="/app/function">Open My Function</a></div></section>
{:else}
  <section class="workspace-hero compact">
    <div><p class="app-eyebrow">{data.experience.functionName??'My Function'} · Position hierarchy</p><h1>My Team</h1><p class="workspace-lede">Your management scope is derived from the Position hierarchy. Business dashboards can roll up work from these subordinate Positions while still applying object permissions and information governance.</p></div>
  </section>

  <section class="architecture-metrics delivery-metrics">
    <article><span>Direct reports</span><strong>{direct.length}</strong><p>Positions immediately below yours</p></article>
    <article><span>Total management span</span><strong>{data.experience.managementScope.length}</strong><p>All subordinate Positions</p></article>
    <article><span>My Position</span><strong>{data.experience.positionCode}</strong><p>{data.experience.positionTitle}</p></article>
    <article><span>Function</span><strong>{data.experience.functionCode??'—'}</strong><p>{data.experience.functionName??'Not assigned'}</p></article>
  </section>

  <section class="workspace-panel">
    <div class="panel-heading"><div><p class="app-eyebrow">Position hierarchy</p><h2>Direct reports</h2></div><span>{direct.length}</span></div>
    <div class="workspace-register-list">
      {#each direct as item}
        <article><div><strong>{item.positionCode} · {item.positionTitle}</strong><span>{item.personName??'Vacant Position'}</span></div><small>Depth {item.depth}</small></article>
      {:else}<p class="information-empty">Your Position has no direct reports.</p>{/each}
    </div>
  </section>

  {#if wider.length>0}
    <section class="workspace-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">Cascaded management scope</p><h2>Wider team</h2></div><span>{wider.length}</span></div>
      <div class="workspace-register-list">
        {#each wider as item}
          <article><div><strong>{item.positionCode} · {item.positionTitle}</strong><span>{item.personName??'Vacant Position'}</span></div><small>Depth {item.depth}</small></article>
        {/each}
      </div>
    </section>
  {/if}
{/if}
