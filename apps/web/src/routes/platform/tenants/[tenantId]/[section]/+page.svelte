<script lang="ts">
  import PlatformAdminNav from '$lib/components/platform/PlatformAdminNav.svelte';
  import type { ActionData,PageData } from './$types';
  let {data,form}:{data:PageData;form:ActionData}=$props();
  function display(value:string|number|boolean|null){if(value===null)return '—';if(typeof value==='boolean')return value?'Yes':'No';return String(value);}
</script>
<svelte:head><title>{data.tenant.name} · {data.section.title} — NuBlox Platform</title><meta name="robots" content="noindex,nofollow"/></svelte:head>
<div class="layout"><PlatformAdminNav operator={data.operator}/><main>
  <header><div><p class="eyebrow">Tenant · <code>{data.tenant.slug}</code></p><h1>{data.tenant.name}</h1><p>{data.section.title} — {data.section.description}</p></div><div class="state"><strong>{data.tenant.lifecycleState.replaceAll('_',' ')}</strong><span>{data.tenant.tenantId}</span></div></header>
  <nav class="tabs" aria-label="Tenant platform administration">{#each data.tenantSections as item}<a class:active={item.key===data.section.key} href={`/platform/tenants/${data.tenant.tenantId}/${item.key}`}>{item.title}</a>{/each}</nav>
  {#if form?.message||form?.error}<div class:ok={form?.ok} class:error={!form?.ok} class="message">{form?.message??form?.error}</div>{/if}

  {#if data.section.key==='configuration'&&data.operator.role!=='READ_ONLY'}
    <details class="command"><summary>Set Tenant feature override</summary><form method="POST" action="?/setFeatureOverride">
      <label>Feature flag key<input name="flagKey" required/></label><label class="check"><input type="checkbox" name="enabled"/> Enabled for this Tenant</label><label class="wide">Reason<textarea name="reason" minlength="8" rows="2" required></textarea></label><button>Save override</button>
    </form></details>
  {/if}
  {#if data.section.key==='subscriptions'&&data.operator.role!=='READ_ONLY'}
    <details class="command" open={data.section.rows.length===0}><summary>Create or update subscription</summary><form method="POST" action="?/upsertSubscription">
      <label>Plan code<input name="planCode" placeholder="ENTERPRISE" required/></label><label>Status<select name="status"><option>TRIAL</option><option selected>ACTIVE</option><option>PAST_DUE</option><option>SUSPENDED</option><option>CANCELLED</option></select></label>
      <label>Seat limit<input name="seatLimit" type="number" min="1"/></label><label>Storage limit bytes<input name="storageLimitBytes" type="number" min="1"/></label><label class="wide">Billing customer reference<input name="billingCustomerReference"/></label><button>Save subscription</button>
    </form></details>
  {/if}
  {#if data.section.key==='suspend'&&data.operator.role!=='READ_ONLY'}
    <section class="command danger"><h2>Tenant service access</h2>
      {#if data.tenant.lifecycleState==='ACTIVE'}<form method="POST" action="?/suspend"><label class="wide">Suspension reason<input name="reason" minlength="8" required/></label><button>Suspend Tenant</button></form>
      {:else if data.tenant.lifecycleState!=='DELETED'}<form method="POST" action="?/reactivate"><label class="wide">Reactivation reason<input name="reason" minlength="8" required/></label><button>Reactivate Tenant</button></form>
      {:else}<p>This Tenant has been logically deleted and cannot be reactivated through the suspension control.</p>{/if}
    </section>
  {/if}
  {#if data.section.key==='deletion'}
    <section class="command danger"><h2>Governed deletion</h2><p>Deletion removes the Tenant from service and revokes access. It does not physically purge retained ERP evidence.</p>
      {#if data.operator.role==='SUPER_ADMIN'&&data.tenant.lifecycleState!=='DELETED'&&data.tenant.lifecycleState!=='DELETION_REQUESTED'}<form method="POST" action="?/requestDeletion"><label class="wide">Deletion reason<input name="reason" minlength="8" required/></label><button>Request deletion</button></form>
      {:else if data.operator.role==='SUPER_ADMIN'&&data.tenant.lifecycleState==='DELETION_REQUESTED'}<form method="POST" action="?/finaliseDeletion"><label>Type <code>{data.tenant.slug}</code> to confirm<input name="confirmationSlug" autocomplete="off" required/></label><label>Final reason<input name="reason" minlength="8" required/></label><button>Delete Tenant from service</button></form>
      {:else if data.tenant.lifecycleState==='DELETED'}<p>Tenant is already deleted from service. Physical purge remains retention-controlled.</p>{:else}<p>Super Administrator authority is required for deletion.</p>{/if}
    </section>
  {/if}

  <section class="panel"><div class="panel-heading"><strong>{data.section.rows.length} record{data.section.rows.length===1?'':'s'}</strong><div><a href="/platform/tenants">All Tenants</a>{#if data.tenant.lifecycleState==='ACTIVE'} · <a href={`/${data.tenant.slug}/app`}>Open Tenant app</a>{/if}</div></div>
    {#if data.section.rows.length===0}<p class="empty">No records exist for this Tenant in this control area.</p>{:else}<div class="table-wrap"><table><thead><tr>{#each data.section.columns as column}<th>{column}</th>{/each}</tr></thead><tbody>{#each data.section.rows as row}<tr>{#each Object.values(row) as value}<td>{display(value)}</td>{/each}</tr>{/each}</tbody></table></div>{/if}
  </section>
</main></div>
<style>
:global(body){margin:0;background:#f5f6f8;color:#111827;font-family:Inter,system-ui,sans-serif}.layout{display:grid;grid-template-columns:17rem minmax(0,1fr);min-height:100vh}main{padding:2rem;min-width:0}header{display:flex;justify-content:space-between;gap:1rem;margin-bottom:1rem}h1{font-size:2.25rem;margin:.15rem 0 .4rem}.eyebrow{margin:0;color:#667085;font-size:.72rem;text-transform:uppercase;letter-spacing:.1em;font-weight:800}.state{display:grid;gap:.2rem;text-align:right}.state span{color:#667085;font-size:.75rem}.tabs{display:flex;gap:.35rem;overflow:auto;padding-bottom:.75rem;margin-bottom:1rem}.tabs a{white-space:nowrap;text-decoration:none;color:#475467;padding:.45rem .65rem;border:1px solid #dfe3e8;background:#fff;border-radius:.35rem}.tabs a.active{background:#111827;color:#fff;border-color:#111827}.panel,.command{background:#fff;border:1px solid #dfe3e8;border-radius:.6rem;padding:1rem;margin-bottom:1rem}.panel-heading{display:flex;justify-content:space-between;gap:1rem;margin-bottom:.75rem}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;font-size:.85rem}th,td{text-align:left;vertical-align:top;padding:.65rem;border-bottom:1px solid #e5e7eb;white-space:nowrap}th{font-size:.7rem;text-transform:uppercase;letter-spacing:.05em;color:#667085;background:#fafafa}.command summary{font-weight:700;cursor:pointer}.command form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem;margin-top:1rem}.command label{display:grid;gap:.3rem;font-size:.8rem;font-weight:700}.command .wide{grid-column:1/-1}.command .check{display:flex;align-items:center}.command input,.command textarea,.command select{font:inherit;padding:.6rem;border:1px solid #cfd4dc;border-radius:.35rem}.command button{background:#111827;color:#fff;border:0;padding:.65rem .9rem;border-radius:.35rem;width:max-content;cursor:pointer}.danger{border-color:#f0b5b0}.danger button{background:#9b1c1c}.message{padding:.75rem 1rem;border-radius:.4rem;margin-bottom:1rem}.ok{background:#ecfdf3}.error{background:#fef3f2}.empty{color:#667085}@media(max-width:900px){.layout{grid-template-columns:1fr}header{display:block}.state{text-align:left;margin-top:.75rem}.command form{grid-template-columns:1fr}.command .wide{grid-column:auto}}
</style>
