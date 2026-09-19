<script lang="ts">
  let { data, form } = $props();
  function href(id: string) {
    return `/${data.tenantSlug}/app/functions/f02/authority-framework?framework=${encodeURIComponent(id)}`;
  }
</script>

<svelte:head><title>Authority Framework · NuBlox</title></svelte:head>

<div class="page">
  <nav class="crumb"><a href={`/${data.tenantSlug}/app/functions/f02`}>F02 Corporate Governance</a><span>›</span><strong>F02.02 Governance Framework</strong></nav>
  <header class="hero section-card">
    <div><span class="eyebrow">AGG-02-AUTHORITY-FRAMEWORK</span><h1>Authority framework</h1><p>Govern decision rights, reserved matters, delegation boundaries and segregation-of-duties rules without creating runtime authority.</p></div>
    <aside><strong>Framework ≠ grant</strong><span>Governance policy remains separate from permissions, executable authority policy and effective Delegated Authority.</span></aside>
  </header>
  {#if form?.message}<div class="error">{form.message}</div>{/if}

  <div class="grid">
    <aside class="section-card list">
      <div><span class="eyebrow">Register</span><h2>{data.frameworks.length} frameworks</h2></div>
      <nav>{#each data.frameworks as item}<a class:active={data.selected?.id===item.id} href={href(item.id)}><strong>{item.frameworkRef}</strong><span>{item.name}</span><small>{item.status} · v{item.currentVersionNo}</small></a>{:else}<p>No frameworks yet.</p>{/each}</nav>
      {#if data.capabilities.canManage}
        <details><summary>Create framework</summary><form method="POST" action="?/create">
          <label>Reference<input name="frameworkRef" required /></label>
          <label>Name<input name="name" required /></label>
          <label>Purpose<textarea name="purpose" rows="3" required></textarea></label>
          <div class="pair"><label>Scope type<input name="scopeType" placeholder="TENANT" /></label><label>Scope ID<input name="scopeId" /></label></div>
          <label>Rules JSON<textarea name="rules" rows="12" required></textarea></label>
          <small>Rule types: AUTHORITY_CLASS, DECISION_RIGHT, RESERVED_MATTER, SOD.</small>
          <button>Create draft</button>
        </form></details>
      {/if}
    </aside>

    <main>
      {#if data.selected}
        <section class="section-card detail">
          <div class="head"><div><span class="eyebrow">{data.selected.frameworkRef}</span><h2>{data.selected.name}</h2></div><strong>{data.selected.status}</strong></div>
          <div class="facts"><span><small>Current</small><b>v{data.selected.currentVersionNo}</b></span><span><small>Active</small><b>{data.selected.activeVersionNo ? 'v'+data.selected.activeVersionNo : '—'}</b></span><span><small>Rules</small><b>{data.rules.length}</b></span><span><small>Aggregate</small><b>v{data.selected.aggregateVersion}</b></span></div>
          <div class="rules">{#each data.rules as rule}<article><div><b>{rule.ruleKey}</b><span>{rule.ruleType}</span></div><p>{rule.description}</p><small>{rule.actionType || rule.authorityClass || 'Governance rule'}{rule.reservedMatter ? ' · reserved' : ''}{rule.incompatibleRoleKey ? ' · SoD '+rule.incompatibleRoleKey : ''}</small></article>{/each}</div>
          {#if data.capabilities.canManage && data.selected.status==='DRAFT'}<form method="POST" action="?/submit"><input type="hidden" name="frameworkId" value={data.selected.id}/><input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/><button>Submit for review</button></form>{/if}
          {#if data.capabilities.canApprove && data.selected.status==='IN_REVIEW'}<form method="POST" action="?/approve"><input type="hidden" name="frameworkId" value={data.selected.id}/><input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/><label>Approval rationale<textarea name="reason" rows="2"></textarea></label><button>Approve</button></form>{/if}
          {#if data.capabilities.canApprove && data.selected.status==='APPROVED'}<form method="POST" action="?/activate"><input type="hidden" name="frameworkId" value={data.selected.id}/><input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/><button>Activate version</button></form>{/if}
        </section>
        <section class="section-card history"><span class="eyebrow">Immutable versions</span>{#each data.versions as version}<article><strong>v{version.versionNo}</strong><span>{version.lifecycleStatus}</span><p>{version.purpose}</p>{#if version.approvalDecisionId}<small>Decision {version.approvalDecisionId.slice(0,8)}</small>{/if}</article>{/each}</section>
      {:else}<section class="section-card empty"><h2>Create the first Authority Framework</h2></section>{/if}
    </main>
  </div>
</div>

<style>
.page{display:grid;gap:12px}.crumb{display:flex;gap:7px;font-size:9px}.crumb a{text-decoration:none}.hero{display:grid;grid-template-columns:1.5fr .65fr;gap:20px;padding:18px;background:linear-gradient(120deg,#fbfdff,#eaf6fd);border-color:#8fc9ee}.hero aside{display:grid;gap:6px;padding:12px;background:white;border:1px solid #bddded;border-radius:8px}.hero aside span,p{font-size:10px;color:#637887}.eyebrow{font-size:9px;font-weight:850;letter-spacing:.07em;color:var(--blue-700);text-transform:uppercase}h1{margin:3px 0 6px;font-size:25px}h2{margin:2px 0;font-size:16px}.error{padding:8px 10px;background:#fff2f2;border:1px solid #e2aaaa;border-radius:7px}.grid{display:grid;grid-template-columns:300px minmax(0,1fr);gap:12px;align-items:start}.list,.detail,.history{padding:12px}.list>nav{display:grid;gap:6px;margin-top:10px}.list>nav a{display:grid;gap:3px;padding:8px;border:1px solid #dfe7ec;border-radius:7px;text-decoration:none;color:inherit}.list>nav a.active{border-color:#79bde2;background:#edf8fe}.list>nav span,.list>nav small{font-size:8px;color:#788a97}details{margin-top:10px;padding-top:8px;border-top:1px solid #e6ecef}summary{font-size:9px;font-weight:800;cursor:pointer}form{display:grid;gap:7px;margin-top:8px}label{display:grid;gap:3px;font-size:9px;font-weight:700}input,textarea{width:100%;padding:7px;border:1px solid #ccd8e0;border-radius:6px;font-size:9px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:7px}button{border:0;border-radius:6px;padding:7px 9px;background:var(--blue-700);color:white;font-size:9px;font-weight:800}.head,.rules article>div{display:flex;justify-content:space-between;gap:8px}.facts{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.facts span{display:grid;gap:2px;min-width:90px;padding:6px;background:#f4f7f9;border-radius:6px}.facts small{font-size:7px}.facts b{font-size:9px}.rules{display:grid;gap:6px}.rules article,.history article{padding:8px;border:1px solid #e2e9ed;border-radius:7px;background:#fafcfd}.rules p,.history p{margin:4px 0}.rules small,.history small{font-size:8px;color:#7c8d98}.history{margin-top:12px;display:grid;gap:6px}.empty{min-height:220px;display:grid;place-content:center}@media(max-width:800px){.hero,.grid,.pair{grid-template-columns:1fr}}
</style>
