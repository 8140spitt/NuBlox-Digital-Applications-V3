<script lang="ts">
  import PlatformAdminNav from '$lib/components/platform/PlatformAdminNav.svelte';
  import type { ActionData,PageData } from './$types';
  let {data,form}:{data:PageData;form:ActionData}=$props();
  function state(value:string){return value.toLowerCase().replaceAll('_',' ');}
</script>
<svelte:head><title>Tenants — NuBlox Platform</title><meta name="robots" content="noindex,nofollow"/></svelte:head>
<div class="layout"><PlatformAdminNav operator={data.operator}/><main>
  <header><p class="eyebrow">NuBlox Operator Control Plane</p><h1>Tenants</h1><p>Provider-level Tenant lifecycle, service and operational administration.</p></header>
  <form method="GET" class="search"><input name="q" value={data.search} placeholder="Business name, slug or Tenant ID"/><button type="submit">Search</button>{#if data.search}<a href="/platform/tenants">Clear</a>{/if}</form>
  {#if form?.error}<div class="message error">{form.error}</div>{:else if form?.success}<div class="message ok">Tenant lifecycle updated.</div>{/if}
  <section class="tenant-grid">
    {#each data.tenants as tenant}
      <article class="tenant">
        <div class="head"><div><h2>{tenant.name}</h2><p><code>{tenant.slug}</code> · <code>{tenant.tenantId}</code></p></div><span class:warn={tenant.lifecycleState!=='ACTIVE'}>{state(tenant.lifecycleState)}</span></div>
        <dl><div><dt>Members</dt><dd>{tenant.memberCount}</dd></div><div><dt>Sessions</dt><dd>{tenant.activeSessionCount}</dd></div><div><dt>Status</dt><dd>{tenant.tenantStatus}</dd></div></dl>
        {#if tenant.lifecycleReason}<p class="reason">{tenant.lifecycleReason}</p>{/if}
        <div class="actions"><a class="primary" href={`/platform/tenants/${tenant.tenantId}/overview`}>Administer Tenant</a>{#if tenant.lifecycleState==='ACTIVE'}<a href={`/${tenant.slug}/app`}>Open app</a>{/if}</div>
        {#if data.operator.role!=='READ_ONLY' && tenant.lifecycleState!=='DELETED'}
          <details><summary>Quick lifecycle action</summary>
          {#if tenant.lifecycleState==='ACTIVE'}<form method="POST" action="?/suspend"><input type="hidden" name="tenantId" value={tenant.tenantId}/><input name="reason" minlength="8" required placeholder="Suspension reason"/><button>Suspend</button></form>
          {:else}<form method="POST" action="?/reactivate"><input type="hidden" name="tenantId" value={tenant.tenantId}/><input name="reason" minlength="8" required placeholder="Reactivation reason"/><button>Reactivate</button></form>{/if}
          </details>
        {/if}
      </article>
    {/each}
  </section>
</main></div>
<style>
:global(body){margin:0;background:#f5f6f8;color:#111827;font-family:Inter,system-ui,sans-serif}.layout{display:grid;grid-template-columns:17rem minmax(0,1fr);min-height:100vh}main{padding:2rem}h1{font-size:2.35rem;margin:.15rem 0 .45rem}.eyebrow{margin:0;color:#667085;font-size:.72rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.search{display:flex;gap:.5rem;margin:1.25rem 0}.search input{min-width:22rem;padding:.65rem;border:1px solid #cfd4dc;border-radius:.35rem}.search button,.tenant button{background:#111827;color:#fff;border:0;border-radius:.35rem;padding:.6rem .8rem}.tenant-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.tenant{background:#fff;border:1px solid #dfe3e8;border-radius:.65rem;padding:1rem}.head{display:flex;justify-content:space-between;gap:1rem}.head h2{margin:0}.head p{color:#667085}.head>span{height:max-content;padding:.3rem .5rem;border-radius:99px;background:#ecfdf3;font-size:.75rem;text-transform:capitalize}.head>span.warn{background:#fff4e5}dl{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem}dt{font-size:.7rem;text-transform:uppercase;color:#667085}dd{margin:.15rem 0;font-weight:700}.reason{padding:.65rem;background:#f8f9fb}.actions{display:flex;gap:.75rem;align-items:center;margin-top:.75rem}.actions a{text-decoration:none}.primary{background:#111827;color:#fff;padding:.55rem .75rem;border-radius:.35rem}details{margin-top:.75rem;border-top:1px solid #eee;padding-top:.75rem}details form{display:flex;gap:.5rem;margin-top:.65rem}details input{flex:1;padding:.55rem;border:1px solid #cfd4dc;border-radius:.35rem}.message{padding:.75rem 1rem;margin-bottom:1rem;border-radius:.4rem}.ok{background:#ecfdf3}.error{background:#fef3f2}@media(max-width:900px){.layout{grid-template-columns:1fr}.tenant-grid{grid-template-columns:1fr}.search input{min-width:0;flex:1}}
</style>
