<script lang="ts">
  import PlatformAdminNav from '$lib/components/platform/PlatformAdminNav.svelte';
  import type { ActionData,PageData } from './$types';
  let {data,form}:{data:PageData;form:ActionData}=$props();
  function display(value:string|number|boolean|null){if(value===null)return '—';if(typeof value==='boolean')return value?'Yes':'No';return String(value);}
</script>

<svelte:head><title>{data.section.title} — NuBlox Platform</title><meta name="robots" content="noindex,nofollow" /></svelte:head>
<div class="layout">
  <PlatformAdminNav operator={data.operator}/>
  <main>
    <header><p class="eyebrow">NuBlox Operator Control Plane</p><h1>{data.section.title}</h1><p>{data.section.description}</p></header>
    {#if form?.message||form?.error}<div class:ok={form?.ok} class:error={!form?.ok} class="message">{form?.message??form?.error}</div>{/if}

    {#if data.operator.role!=='READ_ONLY' && data.section.key==='feature-flags'}
      <details class="command"><summary>Create or update feature flag</summary><form method="POST" action="?/upsertFeatureFlag">
        <label>Flag key<input name="flagKey" placeholder="hcm.new-experience" required/></label><label>Name<input name="name" required/></label>
        <label class="wide">Description<textarea name="description" rows="3" required></textarea></label><label class="check"><input name="defaultEnabled" type="checkbox"/> Enabled by default</label>
        <button type="submit">Save feature flag</button></form></details>
    {/if}
    {#if data.operator.role==='SUPER_ADMIN' && data.section.key==='platform-configuration'}
      <details class="command"><summary>Create or update platform configuration</summary><form method="POST" action="?/upsertConfiguration">
        <label>Configuration key<input name="configKey" required/></label><label>Sensitivity<select name="sensitivity"><option>INTERNAL</option><option>PUBLIC</option><option>SECRET_REFERENCE</option></select></label>
        <label class="wide">Description<textarea name="description" rows="2" required></textarea></label><label class="wide">JSON value<textarea name="jsonValue" rows="4" required>{'{}'}</textarea></label>
        <button type="submit">Save configuration</button></form></details>
    {/if}
    {#if data.operator.role!=='READ_ONLY' && data.section.key==='integrations'}
      <details class="command"><summary>Register integration</summary><form method="POST" action="?/registerIntegration">
        <label>Tenant ID (optional)<input name="tenantId"/></label><label>Code<input name="code" required/></label><label>Name<input name="name" required/></label>
        <label>Type<select name="integrationType"><option>API</option><option>WEBHOOK</option><option>IDENTITY</option><option>DATA_EXCHANGE</option><option>MESSAGING</option><option>OBSERVABILITY</option><option>OTHER</option></select></label>
        <label class="wide">Endpoint/reference<input name="endpointReference"/></label><button type="submit">Register integration</button></form></details>
    {/if}

    <section class="panel">
      <div class="panel-heading"><strong>{data.section.rows.length} record{data.section.rows.length===1?'':'s'}</strong><a href="/platform">Platform overview</a></div>
      {#if data.section.rows.length===0}<p class="empty">No records exist in this control area yet.</p>{:else}
        <div class="table-wrap"><table><thead><tr>{#each data.section.columns as column}<th>{column}</th>{/each}{#if data.section.key==='jobs'&&data.operator.role!=='READ_ONLY'}<th>Action</th>{/if}</tr></thead>
          <tbody>{#each data.section.rows as row}<tr>{#each Object.values(row) as value}<td>{display(value)}</td>{/each}
            {#if data.section.key==='jobs'&&data.operator.role!=='READ_ONLY'}<td>{#if row.status==='FAILED'}<form method="POST" action="?/retryJob"><input type="hidden" name="jobId" value={String(row.id??'')}/><button class="small" type="submit">Retry</button></form>{:else}—{/if}</td>{/if}
          </tr>{/each}</tbody></table></div>
      {/if}
    </section>
  </main>
</div>

<style>
  :global(body){margin:0;background:#f5f6f8;color:#111827;font-family:Inter,system-ui,sans-serif}.layout{display:grid;grid-template-columns:17rem minmax(0,1fr);min-height:100vh}main{padding:2rem;min-width:0}header{margin-bottom:1.25rem}h1{font-size:2.35rem;margin:.15rem 0 .45rem}.eyebrow{margin:0;color:#667085;font-size:.72rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.panel,.command{background:#fff;border:1px solid #dfe3e8;border-radius:.6rem;padding:1rem;margin-bottom:1rem}.panel-heading{display:flex;justify-content:space-between;gap:1rem;margin-bottom:.75rem}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;font-size:.86rem}th,td{text-align:left;vertical-align:top;padding:.65rem;border-bottom:1px solid #e5e7eb;white-space:nowrap}th{font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:#667085;background:#fafafa}.command summary{font-weight:700;cursor:pointer}.command form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem;margin-top:1rem}.command label{display:grid;gap:.3rem;font-size:.8rem;font-weight:700}.command .wide{grid-column:1/-1}.command input,.command textarea,.command select{font:inherit;padding:.6rem;border:1px solid #cfd4dc;border-radius:.35rem}.command .check{display:flex;align-items:center}.command button,.small{border:0;background:#111827;color:#fff;padding:.65rem .9rem;border-radius:.35rem;cursor:pointer;width:max-content}.small{padding:.35rem .55rem}.message{padding:.75rem 1rem;border-radius:.4rem;margin-bottom:1rem}.message.ok{background:#ecfdf3}.message.error{background:#fef3f2}.empty{color:#667085}@media(max-width:900px){.layout{grid-template-columns:1fr}.command form{grid-template-columns:1fr}.command .wide{grid-column:auto}}
</style>
