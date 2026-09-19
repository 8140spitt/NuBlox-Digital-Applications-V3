<script lang="ts">
  let { data, form } = $props();
  function href(id: string) {
    return `/${data.tenantSlug}/app/functions/f03/performance-reporting?snapshot=${encodeURIComponent(id)}`;
  }
</script>

<svelte:head><title>Performance Reporting · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb"><a href={`/${data.tenantSlug}/app/functions/f03`}>F03 Enterprise Performance Management</a><span>›</span><strong>F03.02 Performance Reporting</strong></nav>
  <header class="hero section-card">
    <div><span class="eyebrow">F03.02 · SGP-PERFORMANCE-SNAPSHOT</span><h1>Performance reporting</h1><p>Calculate period performance from pinned KPI versions, validated observations and active targets, then review, approve, publish and distribute immutable snapshots.</p></div>
    <div class="principle"><strong>Observation ≠ snapshot</strong><span>Source observations remain immutable evidence.</span><small>Published snapshots pin the exact inputs and calculation basis used at issue time.</small></div>
  </header>
  {#if form?.message}<div class="message">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <span class="eyebrow">Snapshot register</span><h2>{data.snapshots.length} snapshots</h2>
      <nav class="rows">
        {#each data.snapshots as item}
          <a class:active={data.selected?.id === item.id} href={href(item.id)}><div><strong>{item.snapshotRef}</strong><span>{item.status}</span></div><p>{item.scopeType} · {item.scopeId}</p><small>{new Date(item.periodStart).toLocaleDateString('en-GB')} → {new Date(item.periodEnd).toLocaleDateString('en-GB')}</small></a>
        {:else}<p class="empty">No performance snapshots.</p>{/each}
      </nav>
      {#if data.capabilities.canManage}
        <details class="command"><summary>Calculate snapshot</summary><form method="POST" action="?/calculate">
          <label>Reference<input name="snapshotRef" required/></label>
          <label>Published scorecard<select name="scorecardId"><option value="">All effective KPIs</option>{#each data.scorecards.filter((s) => s.status === 'PUBLISHED') as scorecard}<option value={scorecard.id}>{scorecard.scorecardRef} · {scorecard.name}</option>{/each}</select></label>
          <div class="grid"><label>Scope type<input name="scopeType" value="TENANT" required/></label><label>Scope ID<input name="scopeId" required/></label><label>Period start<input name="periodStart" type="date" required/></label><label>Period end<input name="periodEnd" type="date" required/></label></div>
          <label>As-of time<input name="asOfAt" type="datetime-local"/></label>
          <button>Calculate reproducible snapshot</button>
        </form></details>
      {/if}
    </aside>

    <main class="main">
      {#if data.selected}
        <section class="section-card detail">
          <div class="head"><div><span class="eyebrow">{data.selected.scopeType} · {data.selected.scopeId}</span><h2>{data.selected.snapshotRef}</h2></div><span class="status">{data.selected.status}</span></div>
          <div class="facts"><span><small>Aggregate</small><strong>v{data.selected.aggregateVersion}</strong></span><span><small>Quality</small><strong>{data.selected.qualityStatus}</strong></span><span><small>Completeness</small><strong>{Number(data.selected.completenessPercent).toFixed(1)}%</strong></span><span><small>KPIs</small><strong>{data.items.length}</strong></span></div>
          <div class="rows">{#each data.items as item}<article><div><strong>{item.kpiCode} · {item.kpiName}</strong><span class:item-off={item.performanceStatus === 'OFF_TARGET'}>{item.performanceStatus}</span></div><p>Actual {item.actualValue ?? '—'} · Target {item.targetValue ?? '—'} · Variance {item.varianceValue ?? '—'}</p><small>KPI v{item.kpiVersionNo} · observation {item.observationId ?? 'missing'} · target {item.targetId ?? 'none'}</small></article>{/each}</div>

          {#if data.capabilities.canManage && data.selected.status === 'CALCULATED'}
            <form method="POST" action="?/review" class="actions"><input type="hidden" name="snapshotId" value={data.selected.id}/><input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/><button>Mark reviewed</button></form>
          {/if}

          {#if data.capabilities.canPublish && data.selected.status === 'REVIEWED'}
            <details class="command" open><summary>Approve & publish</summary><form method="POST" action="?/publish"><input type="hidden" name="snapshotId" value={data.selected.id}/><input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/><label>Approval rationale<textarea name="reason" rows="4" required></textarea></label><button>Record Decision and publish snapshot</button></form></details>
          {/if}

          {#if data.capabilities.canPublish && data.selected.status === 'PUBLISHED'}
            <details class="command"><summary>Distribute published snapshot</summary><form method="POST" action="?/distribute"><input type="hidden" name="snapshotId" value={data.selected.id}/><label>Recipient Party ID<input name="recipientPartyId" required/></label><label>Channel<input name="channel" value="WORKSPACE" required/></label><label>Distribution reference<input name="distributionReference"/></label><button>Record distribution</button></form></details>
          {/if}
        </section>
      {:else}<section class="section-card empty-state"><h2>Calculate the first performance snapshot</h2><p>A snapshot uses governed KPI versions, validated observations and active targets for a precise scope and period.</p></section>{/if}
    </main>
  </div>
</div>

<style>
.page{display:grid;gap:12px}.breadcrumb{display:flex;gap:7px;font-size:9px;color:#728694}.breadcrumb a{color:#315f7d;text-decoration:none}.hero{display:grid;grid-template-columns:1.5fr .7fr;gap:20px;padding:18px;background:linear-gradient(120deg,#fbfdff,#eaf6fd)}.eyebrow{font-size:10px;font-weight:850;color:var(--blue-700);text-transform:uppercase;letter-spacing:.07em}h1{margin:3px 0 6px;font-size:25px}h2{margin:3px 0 8px;font-size:16px}p{font-size:10px;color:#5f7484}.principle{display:grid;gap:5px;padding:12px;border:1px solid #bddded;border-radius:9px;background:#fff}.principle strong{font-size:11px;color:#315d76}.principle span,.principle small{font-size:9px;color:#667c8b}.workspace{display:grid;grid-template-columns:320px 1fr;gap:12px;align-items:start}.register,.detail{padding:13px}.register{position:sticky;top:78px}.rows{display:grid;gap:6px;margin-top:9px}.rows a,.rows article{display:grid;gap:4px;padding:8px;border:1px solid #dfe7ec;border-radius:7px;background:#fafcfd;color:inherit;text-decoration:none}.rows a.active{border-color:#79bde2;background:#edf8fe}.rows div,.head{display:flex;justify-content:space-between;gap:8px}.rows strong{font-size:9.5px}.rows span,.rows small{font-size:8px;color:#718693}.rows p{margin:0}.item-off{color:#9b4a32!important;font-weight:850}.command{margin-top:10px;border-top:1px solid #e4eaee;padding-top:9px}.command summary{cursor:pointer;font-size:9px;font-weight:800;color:#35617d}form{display:grid;gap:7px;margin-top:8px}label{display:grid;gap:4px;font-size:9px;color:#52697a;font-weight:750}input,select,textarea{width:100%;padding:7px;border:1px solid #ccd8e0;border-radius:6px;font:inherit}button{border:0;border-radius:6px;padding:7px 9px;background:var(--blue-700);color:white;font-size:9px;font-weight:800}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.facts{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.facts span{display:grid;gap:2px;min-width:110px;padding:7px;background:#f4f7f9;border-radius:6px}.facts small{font-size:7.5px;color:#85949e}.facts strong{font-size:10px}.status{font-size:8px;font-weight:800}.message{padding:9px;border:1px solid #dd8a8a;background:#fff3f3;color:#792f2f}.empty-state{padding:24px;text-align:center}@media(max-width:850px){.hero,.workspace,.grid{grid-template-columns:1fr}.register{position:static}}
</style>