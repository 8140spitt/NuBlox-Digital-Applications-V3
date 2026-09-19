<script lang="ts">
  let { data, form } = $props();
  const campaignHref = (id: string) =>
    `/${data.tenantSlug}/app/functions/f06/analytics?campaign=${encodeURIComponent(id)}`;

  function metric(snapshot: (typeof data.snapshots)[number], key: string) {
    const values = snapshot.metrics as Record<string, unknown>;
    return values?.[key] ?? null;
  }
  function pct(value: unknown) {
    return typeof value === 'number' ? (value * 100).toFixed(1) + '%' : '—';
  }
</script>

<svelte:head><title>Marketing Analytics · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb"><a href={`/${data.tenantSlug}/app/functions/f06`}>F06 Marketing & Brand</a><span>›</span><strong>F06.10 Marketing Analytics</strong></nav>
  <header class="hero section-card"><div><span class="eyebrow">F06.10 · REPRODUCIBLE EVIDENCE</span><h1>Marketing analytics</h1><p>Record attributable campaign observations and freeze reproducible snapshots for reach, engagement, conversion, acquisition cost and return on marketing investment.</p></div><div class="principle"><strong>Observation ≠ snapshot</strong><span>Measurements remain source evidence; snapshots pin the exact event/Lead/source sets used.</span><small>Historical snapshots never recalculate silently when later campaign evidence arrives.</small></div></header>
  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <span class="eyebrow">Campaign analysis</span><h2>{data.campaigns.length} campaigns</h2>
      <nav class="rows">{#each data.campaigns as campaign}<a class:active={data.selectedCampaign?.id===campaign.id} href={campaignHref(campaign.id)}><div><strong>{campaign.campaignRef}</strong><span>{campaign.status}</span></div><p>{campaign.title}</p></a>{:else}<p>No campaigns.</p>{/each}</nav>
      {#if data.canManage && data.selectedCampaign}
        <details class="command"><summary>Record external measurement</summary><form method="POST" action="?/measure"><input type="hidden" name="campaignId" value={data.selectedCampaign.id}/><div class="grid"><label>Metric key<input name="metricKey" placeholder="SPEND" required/></label><label>Value<input type="number" step="any" name="metricValue" required/></label></div><label>Unit<input name="unitKey" placeholder="GBP / COUNT / PCT" required/></label><div class="grid"><label>Period start<input type="datetime-local" name="periodStart"/></label><label>Period end<input type="datetime-local" name="periodEnd"/></label></div><label>Source reference<input name="sourceReference" required/></label><button>Record measurement</button></form></details>
      {/if}
    </aside>

    <main>
      {#if data.selectedCampaign}
        <section class="section-card detail">
          <div class="head"><div><span class="eyebrow">Campaign evidence</span><h2>{data.selectedCampaign.campaignRef} · {data.selectedCampaign.title}</h2></div><span class="status">{data.selectedCampaign.status}</span></div>
          <section class="panel"><div class="section-head"><span class="eyebrow">Recorded measurements</span><strong>{data.measurements.length}</strong></div>{#each data.measurements as row}<article><div><strong>{row.metricKey}</strong><span>{row.metricValue} {row.unitKey}</span></div><small>{row.sourceReference} · {new Date(row.observedAt).toLocaleString('en-GB')}</small></article>{:else}<p>No external measurements recorded.</p>{/each}</section>
          {#if data.canManage}
            <details class="command" open><summary>Freeze analytics snapshot</summary><form method="POST" action="?/freeze"><input type="hidden" name="campaignId" value={data.selectedCampaign.id}/><div class="grid"><label>Snapshot reference<input name="snapshotRef" required/></label><label>Title<input name="title" required/></label></div><div class="grid"><label>Period start<input type="datetime-local" name="periodStart"/></label><label>Period end<input type="datetime-local" name="periodEnd"/></label></div><label>Segment<select name="segmentId"><option value="">None</option>{#each data.segments as segment}<option value={segment.id}>{segment.segmentRef} · {segment.name}</option>{/each}</select></label><label>Segment version<input type="number" min="1" name="segmentVersionNo"/></label><label>Query version<input name="sourceQueryVersion" value="marketing-analytics-v1" required/></label><button>Freeze reproducible snapshot</button></form></details>
          {/if}
        </section>
      {/if}

      <section class="section-card snapshots">
        <div class="section-head"><div><span class="eyebrow">Frozen evidence</span><h2>{data.snapshots.length} analytics snapshots</h2></div></div>
        <div class="snapshot-grid">
          {#each data.snapshots as snapshot}
            <article>
              <div class="head"><div><strong>{snapshot.snapshotRef}</strong><p>{snapshot.title}</p></div><small>{new Date(snapshot.asOfAt).toLocaleString('en-GB')}</small></div>
              <div class="kpis">
                <span><small>Delivered</small><strong>{metric(snapshot,'delivered') ?? '—'}</strong></span>
                <span><small>Open rate</small><strong>{pct(metric(snapshot,'openRate'))}</strong></span>
                <span><small>Click rate</small><strong>{pct(metric(snapshot,'clickThroughRate'))}</strong></span>
                <span><small>Conversions</small><strong>{metric(snapshot,'conversions') ?? '—'}</strong></span>
                <span><small>CAC</small><strong>{metric(snapshot,'customerAcquisitionCost') ?? '—'}</strong></span>
                <span><small>ROMI</small><strong>{pct(metric(snapshot,'returnOnMarketingInvestment'))}</strong></span>
              </div>
              <small class="query">Query · {snapshot.sourceQueryVersion}</small>
            </article>
          {:else}<p class="empty">No frozen marketing analytics snapshots.</p>{/each}
        </div>
      </section>
    </main>
  </div>
</div>

<style>
.page{display:grid;gap:12px}.breadcrumb,.head,.rows div,.section-head,.panel article div{display:flex;gap:8px;align-items:center}.breadcrumb{font-size:9px;color:#728694}.breadcrumb a{color:#315f7d;text-decoration:none}.hero{display:grid;grid-template-columns:1.5fr .7fr;gap:20px;padding:18px;background:linear-gradient(120deg,#fbfdff,#eaf6fd)}.eyebrow{font-size:9px;font-weight:850;color:var(--blue-700);text-transform:uppercase;letter-spacing:.07em}h1{margin:4px 0 6px;font-size:25px}h2{margin:3px 0 8px;font-size:16px}p{font-size:10px;color:#5f7484;line-height:1.5}.principle{display:grid;gap:5px;padding:12px;border:1px solid #bddded;border-radius:9px;background:#fff}.principle strong{font-size:11px;color:#315d76}.principle span,.principle small{font-size:9px;color:#667c8b}.workspace{display:grid;grid-template-columns:310px 1fr;gap:12px;align-items:start}.register,.detail,.snapshots{padding:13px}.register{position:sticky;top:78px}.rows{display:grid;gap:6px;margin-top:8px}.rows a{display:grid;gap:4px;padding:8px;border:1px solid #dfe7ec;border-radius:7px;background:#fafcfd;color:inherit;text-decoration:none}.rows a.active{border-color:#79bde2;background:#edf8fe}.rows div,.head,.section-head,.panel article div{justify-content:space-between}.rows p{margin:0}.rows strong{font-size:9.5px}.rows span{font-size:8px;color:#718693}.status{font-size:8px;font-weight:850;padding:4px 6px;border-radius:999px;background:#eaf4f9;color:#35617d}.panel{padding:10px;border:1px solid #dfe7ec;border-radius:8px;margin-top:8px}.panel article{padding:7px 0;border-bottom:1px solid #edf1f3}.panel article:last-child{border:0}.panel article strong{font-size:8.5px}.panel article span,.panel article small{font-size:8px;color:#748894}.command{margin-top:10px;border-top:1px solid #e4eaee;padding-top:8px}.command summary{cursor:pointer;font-size:9px;font-weight:800;color:#35617d}form{display:grid;gap:7px;margin-top:8px}label{display:grid;gap:4px;font-size:8.5px;color:#52697a;font-weight:750}input,select{width:100%;padding:7px;border:1px solid #ccd8e0;border-radius:6px;font:inherit}button{border:0;border-radius:6px;padding:8px 10px;background:var(--blue-700);color:#fff;font-size:9px;font-weight:800;cursor:pointer}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.snapshots{margin-top:12px}.snapshot-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:8px;margin-top:8px}.snapshot-grid>article{padding:10px;border:1px solid #dfe7ec;border-radius:8px;background:#fbfcfd}.snapshot-grid .head{align-items:flex-start}.snapshot-grid strong{font-size:9.5px}.snapshot-grid p{margin:2px 0}.snapshot-grid small{font-size:7.5px;color:#758894}.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:8px}.kpis span{display:grid;gap:2px;padding:6px;border-radius:5px;background:#f0f5f8}.kpis strong{font-size:10px}.query{display:block;margin-top:7px}.message{padding:9px;border:1px solid #dd8a8a;background:#fff3f3;color:#792f2f;font-size:9px}.empty{color:#758896}@media(max-width:900px){.hero,.workspace,.grid{grid-template-columns:1fr}.register{position:static}}
</style>