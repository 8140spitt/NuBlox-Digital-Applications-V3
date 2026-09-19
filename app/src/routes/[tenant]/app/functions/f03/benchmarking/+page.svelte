<script lang="ts">
  let { data, form } = $props();
  function href(id: string) {
    return `/${data.tenantSlug}/app/functions/f03/benchmarking?target=${encodeURIComponent(id)}`;
  }
</script>

<svelte:head><title>Benchmarking · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb"><a href={`/${data.tenantSlug}/app/functions/f03`}>F03 Enterprise Performance Management</a><span>›</span><strong>F03.05 Benchmarking</strong></nav>
  <header class="hero section-card"><div><span class="eyebrow">F03.05 · Performance Target / Benchmark Basis</span><h1>Benchmarking</h1><p>Govern comparator scope, source date, evidence and approval before external or peer benchmarks become enterprise performance targets.</p></div><div class="principle"><strong>Benchmark evidence ≠ target</strong><span>The benchmark explains the target basis.</span><small>Approval creates an immutable Decision against the proposed Performance Target.</small></div></header>
  {#if form?.message}<div class="message">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <span class="eyebrow">Benchmark register</span><h2>{data.bases.length} governed bases</h2>
      <nav class="rows">{#each data.bases as item}<a class:active={data.selectedBasis?.targetId === item.targetId} href={href(item.targetId)}><div><strong>{item.targetRef}</strong><span>{item.status}</span></div><p>{item.benchmarkType}</p><small>{item.comparatorScope}</small></a>{/each}</nav>
      {#if data.canManage}
        <details class="command"><summary>Create benchmark target</summary><form method="POST" action="?/create">
          <label>KPI<select name="kpiId" required><option value="">Select effective KPI</option>{#each data.kpis.filter((kpi) => kpi.status === 'EFFECTIVE') as kpi}<option value={kpi.id}>{kpi.kpiCode} · {kpi.name} · v{kpi.currentVersionNo}</option>{/each}</select></label>
          <label>KPI version<input name="kpiVersionNo" type="number" min="1" required/></label>
          <label>Target reference<input name="targetRef" required/></label>
          <div class="grid"><label>Scope type<input name="scopeType" value="TENANT" required/></label><label>Scope ID<input name="scopeId" required/></label><label>Period start<input name="periodStart" type="date" required/></label><label>Period end<input name="periodEnd" type="date" required/></label><label>Target value<input name="targetValue" type="number" step="any" required/></label><label>Comparison<select name="comparisonOperator"><option value="GREATER_EQUAL">≥ target</option><option value="LESS_EQUAL">≤ target</option><option value="EQUAL">= target</option></select></label></div>
          <label>Benchmark type<input name="benchmarkType" required placeholder="PEER_QUARTILE"/></label>
          <label>Comparator scope<textarea name="comparatorScope" rows="2" required></textarea></label>
          <div class="grid"><label>Benchmark value<input name="benchmarkValue" type="number" step="any" required/></label><label>Source as-of<input name="sourceAsOf" type="date" required/></label></div>
          <label>Source reference<input name="sourceReference" required/></label><label>Evidence Item ID<input name="evidenceItemId"/></label>
          <button>Create proposed benchmark target</button>
        </form></details>
      {/if}
    </aside>

    <main class="main">
      {#if data.selectedBasis && data.selectedTarget}
        <section class="section-card detail">
          <div class="head"><div><span class="eyebrow">{data.selectedBasis.benchmarkType}</span><h2>{data.selectedBasis.targetRef}</h2></div><span class="status">{data.selectedTarget.status}</span></div>
          <div class="facts"><span><small>Benchmark</small><strong>{Number(data.selectedBasis.benchmarkValue)}</strong></span><span><small>Target</small><strong>{Number(data.selectedTarget.targetValue)}</strong></span><span><small>Basis status</small><strong>{data.selectedBasis.status}</strong></span><span><small>Source as-of</small><strong>{new Date(data.selectedBasis.sourceAsOf).toLocaleDateString('en-GB')}</strong></span></div>
          <section class="basis"><span class="eyebrow">Comparator basis</span><p>{data.selectedBasis.comparatorScope}</p><small>{data.selectedBasis.sourceReference}</small></section>

          {#if data.canManage && data.selectedBasis.status === 'PROPOSED' && data.selectedTarget.status === 'PROPOSED'}
            <details class="command" open><summary>Approve benchmark basis</summary><form method="POST" action="?/approve"><input type="hidden" name="targetId" value={data.selectedTarget.id}/><input type="hidden" name="aggregateVersion" value={data.selectedTarget.aggregateVersion}/><label>Approval rationale<textarea name="reason" rows="4" required></textarea></label><button>Record Decision and approve target</button></form></details>
          {/if}
          {#if data.canManage && data.selectedTarget.status === 'APPROVED'}
            <form method="POST" action="?/activate" class="actions"><input type="hidden" name="targetId" value={data.selectedTarget.id}/><input type="hidden" name="aggregateVersion" value={data.selectedTarget.aggregateVersion}/><button>Activate benchmark target</button></form>
          {/if}

          <section class="observations"><span class="eyebrow">Comparable governed observations</span><div class="rows">{#each data.observations.filter((row) => row.qualityStatus === 'VALIDATED') as row}<article><div><strong>{Number(row.numericValue)}</strong><span>{row.subjectType}</span></div><p>{row.subjectId}</p><small>{row.sourceReference} · {new Date(row.observedAt).toLocaleDateString('en-GB')}</small></article>{/each}</div></section>
        </section>
      {:else}<section class="section-card empty-state"><h2>Create the first benchmark basis</h2><p>Benchmark evidence must be governed before it can become an approved enterprise target.</p></section>{/if}
    </main>
  </div>
</div>

<style>
.page{display:grid;gap:12px}.breadcrumb{display:flex;gap:7px;font-size:9px;color:#728694}.breadcrumb a{color:#315f7d;text-decoration:none}.hero{display:grid;grid-template-columns:1.5fr .7fr;gap:20px;padding:18px;background:linear-gradient(120deg,#fbfdff,#eaf6fd)}.eyebrow{font-size:10px;font-weight:850;color:var(--blue-700);text-transform:uppercase;letter-spacing:.07em}h1{margin:3px 0 6px;font-size:25px}h2{margin:3px 0 8px;font-size:16px}p{font-size:10px;color:#5f7484}.principle{display:grid;gap:5px;padding:12px;border:1px solid #bddded;border-radius:9px;background:#fff}.principle strong{font-size:11px;color:#315d76}.principle span,.principle small{font-size:9px;color:#667c8b}.workspace{display:grid;grid-template-columns:320px 1fr;gap:12px;align-items:start}.register,.detail{padding:13px}.register{position:sticky;top:78px}.rows{display:grid;gap:6px;margin-top:9px}.rows a,.rows article{display:grid;gap:4px;padding:8px;border:1px solid #dfe7ec;border-radius:7px;background:#fafcfd;color:inherit;text-decoration:none}.rows a.active{border-color:#79bde2;background:#edf8fe}.rows div,.head{display:flex;justify-content:space-between;gap:8px}.rows strong{font-size:9.5px}.rows span,.rows small{font-size:8px;color:#718693}.rows p{margin:0}.facts{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:10px 0}.facts span{display:grid;gap:2px;padding:7px;background:#f4f7f9;border-radius:6px}.facts small{font-size:7.5px;color:#85949e}.facts strong{font-size:10px}.basis,.observations{margin-top:12px;padding:10px;border:1px solid #dfe7ec;border-radius:8px}.basis p{font-size:11px}.basis small{font-size:8px;color:#718693}.command{margin-top:12px;border-top:1px solid #e4eaee;padding-top:9px}.command summary{cursor:pointer;font-size:9px;font-weight:800;color:#35617d}form{display:grid;gap:7px;margin-top:8px}label{display:grid;gap:4px;font-size:9px;color:#52697a;font-weight:750}input,select,textarea{width:100%;padding:7px;border:1px solid #ccd8e0;border-radius:6px;font:inherit}button{border:0;border-radius:6px;padding:7px 9px;background:var(--blue-700);color:white;font-size:9px;font-weight:800}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.status{font-size:8px;font-weight:800}.message{padding:9px;border:1px solid #dd8a8a;background:#fff3f3;color:#792f2f}.empty-state{padding:24px;text-align:center}@media(max-width:850px){.hero,.workspace,.grid,.facts{grid-template-columns:1fr}.register{position:static}}
</style>