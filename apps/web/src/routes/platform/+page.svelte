<script lang="ts">
  import PlatformAdminNav from '$lib/components/platform/PlatformAdminNav.svelte';
  import type { PageData } from './$types';
  let { data }: { data:PageData }=$props();
  function value(row:Record<string,string|number|boolean|null>,key:string){return row[key]??'—';}
</script>

<svelte:head><title>NuBlox Platform Administration</title><meta name="robots" content="noindex,nofollow" /></svelte:head>

<div class="platform-layout">
  <PlatformAdminNav operator={data.operator} />
  <main>
    <header><p class="eyebrow">NuBlox Operator Control Plane</p><h1>Platform administration</h1><p>Operate the NuBlox service independently of every Tenant's own administration.</p></header>

    <section class="metrics">
      {#each data.dashboard.metrics as metric}
        <article><strong>{metric.value}</strong><span>{metric.label}</span><small>{metric.detail}</small></article>
      {/each}
    </section>

    <section class="panel">
      <div class="heading"><div><p class="eyebrow">Control estate</p><h2>Platform administration areas</h2></div></div>
      <div class="section-grid">
        <a href="/platform/tenants"><strong>Tenants</strong><span>Lifecycle, configuration, people, security, sessions, audit, provisioning and deletion.</span></a>
        {#each data.dashboard.globalSections as section}
          <a href={`/platform/${section.key}`}><strong>{section.title}</strong><span>{section.description}</span></a>
        {/each}
      </div>
    </section>

    <div class="two-column">
      <section class="panel">
        <div class="heading"><div><p class="eyebrow">Attention</p><h2>Needs operator review</h2></div><span>{data.dashboard.attention.length}</span></div>
        {#if data.dashboard.attention.length===0}<p class="empty">No current provider attention items.</p>{:else}
          <div class="rows">{#each data.dashboard.attention as row}<article><strong>{value(row,'attention_type')}</strong><span>{value(row,'subject')}</span><small>{value(row,'reason')}</small></article>{/each}</div>
        {/if}
      </section>
      <section class="panel">
        <div class="heading"><div><p class="eyebrow">Provider audit</p><h2>Recent operator activity</h2></div><a href="/platform/audit">Open audit</a></div>
        <div class="rows">{#each data.dashboard.recentAudit as row}<article><strong>{value(row,'action')}</strong><span>{value(row,'operator_name')} · {value(row,'tenant_id')}</span><small>{value(row,'occurred_at')}</small></article>{/each}</div>
      </section>
    </div>
  </main>
</div>

<style>
  :global(body){margin:0;background:#f5f6f8;color:#111827;font-family:Inter,system-ui,sans-serif}.platform-layout{display:grid;grid-template-columns:17rem minmax(0,1fr);min-height:100vh}main{padding:2rem;max-width:100rem;width:100%;box-sizing:border-box}header{margin-bottom:1.5rem}h1{font-size:2.4rem;margin:.2rem 0 .5rem}h2{margin:.1rem 0}.eyebrow{margin:0;font-size:.72rem;text-transform:uppercase;letter-spacing:.1em;font-weight:800;color:#667085}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem;margin-bottom:1rem}.metrics article,.panel{background:#fff;border:1px solid #dfe3e8;border-radius:.65rem}.metrics article{padding:1rem;display:grid;gap:.25rem}.metrics strong{font-size:1.8rem}.metrics small{color:#667085}.panel{padding:1rem;margin-bottom:1rem}.heading{display:flex;justify-content:space-between;align-items:start;gap:1rem;margin-bottom:1rem}.section-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.75rem}.section-grid a{display:grid;gap:.35rem;padding:1rem;border:1px solid #e4e7ec;border-radius:.5rem;text-decoration:none;color:inherit;background:#fafbfc}.section-grid a:hover{border-color:#98a2b3;background:#fff}.section-grid span,.rows span,.rows small{color:#667085}.two-column{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.rows{display:grid;gap:.5rem}.rows article{display:grid;gap:.15rem;padding:.65rem 0;border-top:1px solid #eee}.empty{color:#667085}@media(max-width:1000px){.platform-layout{grid-template-columns:1fr}.metrics,.section-grid,.two-column{grid-template-columns:1fr}}
</style>
