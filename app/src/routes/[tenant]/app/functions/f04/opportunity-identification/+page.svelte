<script lang="ts">
  let { data, form } = $props();
  function href(id: string) {
    return `/${data.tenantSlug}/app/functions/f04/opportunity-identification?opportunity=${encodeURIComponent(id)}`;
  }
</script>

<svelte:head><title>Opportunity Identification · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb"><a href={`/${data.tenantSlug}/app/functions/f04`}>F04 Corporate Development & M&A</a><span>›</span><strong>F04.01 Opportunity Identification</strong></nav>
  <header class="hero section-card">
    <div><span class="eyebrow">F04.01 · AGG-04-DEVELOPMENT</span><h1>Opportunity identification</h1><p>Identify, screen and evaluate acquisition, merger, divestment and partnership opportunities against canonical Party targets and strategic evidence.</p></div>
    <div class="principle"><strong>Development Opportunity ≠ CRM Opportunity</strong><span>Corporate transactions retain their own stable opportunity identity.</span><small>Counterparties reuse canonical Party; later Business Cases and transactions link rather than rename the opportunity.</small></div>
  </header>
  {#if form?.message}<div class="message">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <span class="eyebrow">Corporate development pipeline</span><h2>{data.opportunities.length} opportunities</h2>
      <nav class="rows">
        {#each data.opportunities as item}
          <a class:active={data.selected?.id === item.id} href={href(item.id)}>
            <div><strong>{item.opportunityRef}</strong><span>{item.status}</span></div>
            <p>{item.title}</p><small>{item.opportunityType}</small>
          </a>
        {:else}<p class="empty">No Corporate Development opportunities.</p>{/each}
      </nav>

      {#if data.canManage}
        <details class="command"><summary>Identify opportunity</summary><form method="POST" action="?/create">
          <div class="grid"><label>Reference<input name="opportunityRef" required/></label><label>Type<select name="opportunityType"><option>ACQUISITION</option><option>MERGER</option><option>DIVESTMENT</option><option>STRATEGIC_PARTNERSHIP</option></select></label></div>
          <label>Title<input name="title" required/></label>
          <label>Target organisation<select name="targetPartyId"><option value="">Unknown / not yet qualified</option>{#each data.organisations.filter((o) => o.status === 'ACTIVE') as organisation}<option value={organisation.id}>{organisation.name}</option>{/each}</select></label>
          <label>Development thesis<textarea name="developmentThesis" rows="4" required></textarea></label>
          <label>Scope<textarea name="scopeDescription" rows="3" required></textarea></label>
          <div class="grid"><label>Source type<input name="sourceType" value="STRATEGIC_PIPELINE" required/></label><label>Source reference<input name="sourceReference"/></label></div>
          <div class="grid"><label>Indicative minimum<input name="indicativeValueMin" type="number" step="any"/></label><label>Indicative maximum<input name="indicativeValueMax" type="number" step="any"/></label></div>
          <label>Currency<select name="currencyId"><option value="">None</option>{#each data.currencies.filter((c) => c.status === 'ACTIVE') as currency}<option value={currency.id}>{currency.isoCode} · {currency.name}</option>{/each}</select></label>
          <button>Identify governed opportunity</button>
        </form></details>
      {/if}
    </aside>

    <main>
      {#if data.selected}
        <section class="section-card detail">
          <div class="head"><div><span class="eyebrow">{data.selected.opportunityType}</span><h2>{data.selected.opportunityRef} · {data.selected.title}</h2></div><span class="status">{data.selected.status}</span></div>
          <p class="thesis">{data.selected.developmentThesis}</p>
          <div class="facts"><span><small>Aggregate</small><strong>v{data.selected.aggregateVersion}</strong></span><span><small>Target</small><strong>{data.organisations.find((o) => o.id === data.selected?.targetPartyId)?.name ?? 'Unqualified'}</strong></span><span><small>Value range</small><strong>{data.selected.indicativeValueMin ?? '—'} → {data.selected.indicativeValueMax ?? '—'}</strong></span><span><small>Assessments</small><strong>{data.assessments.length}</strong></span></div>
          <section class="scope"><span class="eyebrow">Scope</span><p>{data.selected.scopeDescription}</p></section>
          <section class="assessments"><span class="eyebrow">Screening & strategic fit evidence</span><div class="rows">{#each data.assessments as row}<article><div><strong>{row.assessmentType}</strong><span>{row.recommendation}</span></div><p>{row.assessmentSummary}</p><small>{row.strategicFitRating ?? 'No fit rating'} · {new Date(row.assessedAt).toLocaleString('en-GB')}</small></article>{:else}<p class="empty">No assessments recorded.</p>{/each}</div></section>

          {#if data.canManage && !['REJECTED','CONVERTED_CLOSED'].includes(data.selected.status)}
            <details class="command" open><summary>Record assessment</summary><form method="POST" action="?/assess"><input type="hidden" name="opportunityId" value={data.selected.id}/><input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/><div class="grid"><label>Assessment type<select name="assessmentType"><option>SCREENING</option><option>STRATEGIC_FIT</option></select></label><label>Fit rating<select name="strategicFitRating"><option value="">Not applicable</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select></label></div><label>Recommendation<select name="recommendation"><option>PROCEED</option><option>HOLD</option><option>REJECT</option></select></label><label>Assessment summary<textarea name="assessmentSummary" rows="4" required></textarea></label><label>Evidence reference<input name="evidenceReference"/></label><button>Record assessment evidence</button></form></details>
          {/if}

          {#if data.canManage}
            <form method="POST" action="?/transition" class="actions"><input type="hidden" name="opportunityId" value={data.selected.id}/><input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/>
              {#if data.selected.status === 'EVALUATING'}<button name="action" value="SECURE_CONTROL">Move to securing control</button><button name="action" value="REQUEST_INVESTMENT_DECISION">Request investment decision</button>{/if}
              {#if data.selected.status === 'SECURING_CONTROL'}<button name="action" value="REQUEST_INVESTMENT_DECISION">Request investment decision</button>{/if}
              {#if data.selected.status === 'INVESTMENT_DECISION'}<button name="action" value="APPROVE">Approve opportunity</button>{/if}
              {#if !['APPROVED','REJECTED','CONVERTED_CLOSED'].includes(data.selected.status)}<button class="quiet" name="action" value="HOLD">Hold</button><button class="danger" name="action" value="REJECT">Reject</button>{/if}
              {#if ['APPROVED','REJECTED','ON_HOLD'].includes(data.selected.status)}<button class="quiet" name="action" value="CLOSE">Close / convert</button>{/if}
            </form>
          {/if}
        </section>
      {:else}<section class="section-card empty-state"><h2>Identify the first Corporate Development opportunity</h2><p>Start with the transaction thesis and canonical target Party rather than a duplicate CRM record.</p></section>{/if}
    </main>
  </div>
</div>

<style>
.page{display:grid;gap:12px}.breadcrumb{display:flex;gap:7px;font-size:9px;color:#728694}.breadcrumb a{color:#315f7d;text-decoration:none}.hero{display:grid;grid-template-columns:1.5fr .7fr;gap:20px;padding:18px;background:linear-gradient(120deg,#fbfdff,#eaf6fd)}.eyebrow{font-size:10px;font-weight:850;color:var(--blue-700);text-transform:uppercase;letter-spacing:.07em}h1{margin:3px 0 6px;font-size:25px}h2{margin:3px 0 8px;font-size:16px}p{font-size:10px;color:#5f7484}.principle{display:grid;gap:5px;padding:12px;border:1px solid #bddded;border-radius:9px;background:#fff}.principle strong{font-size:11px;color:#315d76}.principle span,.principle small{font-size:9px;color:#667c8b}.workspace{display:grid;grid-template-columns:330px 1fr;gap:12px;align-items:start}.register,.detail{padding:13px}.register{position:sticky;top:78px}.rows{display:grid;gap:6px;margin-top:9px}.rows a,.rows article{display:grid;gap:4px;padding:8px;border:1px solid #dfe7ec;border-radius:7px;background:#fafcfd;color:inherit;text-decoration:none}.rows a.active{border-color:#79bde2;background:#edf8fe}.rows div,.head{display:flex;justify-content:space-between;gap:8px}.rows strong{font-size:9.5px}.rows span,.rows small{font-size:8px;color:#718693}.rows p{margin:0}.thesis{font-size:11px}.facts{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:10px 0}.facts span{display:grid;gap:2px;padding:7px;background:#f4f7f9;border-radius:6px}.facts small{font-size:7.5px;color:#85949e}.facts strong{font-size:9px}.scope,.assessments{margin-top:12px;padding:10px;border:1px solid #dfe7ec;border-radius:8px}.command{margin-top:12px;border-top:1px solid #e4eaee;padding-top:9px}.command summary{cursor:pointer;font-size:9px;font-weight:800;color:#35617d}form{display:grid;gap:7px;margin-top:8px}label{display:grid;gap:4px;font-size:9px;color:#52697a;font-weight:750}input,select,textarea{width:100%;padding:7px;border:1px solid #ccd8e0;border-radius:6px;font:inherit}button{border:0;border-radius:6px;padding:7px 9px;background:var(--blue-700);color:white;font-size:9px;font-weight:800}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.actions{display:flex;flex-wrap:wrap;gap:6px}.quiet{background:white;color:#52697a;border:1px solid #ccd8e0}.danger{background:#843e3e}.status{font-size:8px;font-weight:800}.message{padding:9px;border:1px solid #dd8a8a;background:#fff3f3;color:#792f2f}.empty-state{padding:24px;text-align:center}@media(max-width:850px){.hero,.workspace,.grid,.facts{grid-template-columns:1fr}.register{position:static}}
</style>