<script lang="ts">
  let { data, form } = $props();
  function href(id: string) {
    return `/${data.tenantSlug}/app/functions/f03/benefits-realisation?benefit=${encodeURIComponent(id)}`;
  }
</script>

<svelte:head><title>Benefits Realisation · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb"><a href={`/${data.tenantSlug}/app/functions/f03`}>F03 Enterprise Performance Management</a><span>›</span><strong>F03.06 Benefits Realisation</strong></nav>
  <header class="hero section-card"><div><span class="eyebrow">F03.06 · Benefit / Performance Target</span><h1>Benefits realisation</h1><p>Define measurable transformation benefits against exact baselines, govern their targets and validate realised outcomes from attributable performance observations.</p></div><div class="principle"><strong>Benefit ≠ target ≠ baseline ≠ observation</strong><span>The benefit profile binds these governed layers together.</span><small>Validation records measured realised value without rewriting the target or source observation.</small></div></header>
  {#if form?.message}<div class="message">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <span class="eyebrow">Benefit register</span><h2>{data.benefits.length} benefits</h2>
      <nav class="rows">{#each data.benefits as item}<a class:active={data.selected?.targetId === item.targetId} href={href(item.targetId)}><div><strong>{item.targetRef}</strong><span>{item.targetStatus}</span></div><p>{item.benefitType} · {item.valueCategory}</p><small>{item.transformationSubjectType} · {item.transformationSubjectId}</small></a>{/each}</nav>
      {#if data.canManage}
        <details class="command"><summary>Define benefit</summary><form method="POST" action="?/create">
          <label>KPI<select name="kpiId" required><option value="">Select effective KPI</option>{#each data.kpis.filter((kpi) => kpi.status === 'EFFECTIVE') as kpi}<option value={kpi.id}>{kpi.kpiCode} · {kpi.name} · v{kpi.currentVersionNo}</option>{/each}</select></label>
          <label>KPI version<input name="kpiVersionNo" type="number" min="1" required/></label>
          <label>Active baseline<select name="baselineId" required><option value="">Select baseline</option>{#each data.baselines.filter((row) => row.status === 'ACTIVE') as row}<option value={row.id}>{row.baselineRef} · {row.scopeType} · {row.scopeId}</option>{/each}</select></label>
          <label>Benefit target reference<input name="targetRef" required/></label>
          <div class="grid"><label>Scope type<input name="scopeType" value="TENANT" required/></label><label>Scope ID<input name="scopeId" required/></label><label>Period start<input name="periodStart" type="date" required/></label><label>Period end<input name="periodEnd" type="date" required/></label><label>Target value<input name="targetValue" type="number" step="any" required/></label><label>Comparison<select name="comparisonOperator"><option value="GREATER_EQUAL">≥ target</option><option value="LESS_EQUAL">≤ target</option><option value="EQUAL">= target</option></select></label></div>
          <label>Benefit type<input name="benefitType" value="OPERATIONAL" required/></label><label>Value category<input name="valueCategory" required/></label>
          <div class="grid"><label>Transformation subject type<input name="transformationSubjectType" value="TRANSFORMATION_INITIATIVE" required/></label><label>Transformation subject ID<input name="transformationSubjectId" required/></label></div>
          <label>Benefit owner Party ID<input name="benefitOwnerPartyId"/></label><label>Benefit statement<textarea name="benefitStatement" rows="4" required></textarea></label>
          <button>Define governed benefit</button>
        </form></details>

        <details class="command"><summary>Establish baseline from observation</summary><form method="POST" action="?/baseline"><label>Reference<input name="baselineRef" required/></label><label>Validated observation ID<input name="observationId" required/></label><div class="grid"><label>Scope type<input name="scopeType" required value="TENANT"/></label><label>Scope ID<input name="scopeId" required/></label></div><button>Create active baseline</button></form></details>
      {/if}
    </aside>

    <main class="main">
      {#if data.selected && data.selectedTarget}
        <section class="section-card detail">
          <div class="head"><div><span class="eyebrow">{data.selected.benefitType} · {data.selected.valueCategory}</span><h2>{data.selected.targetRef}</h2></div><span class="status">{data.selected.targetStatus}</span></div>
          <p class="statement">{data.selected.benefitStatement}</p>
          <div class="facts"><span><small>Target</small><strong>{Number(data.selected.targetValue)}</strong></span><span><small>Baseline</small><strong>{data.selected.baselineId}</strong></span><span><small>Validations</small><strong>{data.validations.length}</strong></span><span><small>Owner</small><strong>{data.selected.benefitOwnerPartyId}</strong></span></div>
          <section class="subject"><span class="eyebrow">Transformation traceability</span><p>{data.selected.transformationSubjectType} · {data.selected.transformationSubjectId}</p></section>

          {#if data.canManage && data.selectedTarget.status === 'PROPOSED'}<form method="POST" action="?/transition" class="actions"><input type="hidden" name="targetId" value={data.selectedTarget.id}/><input type="hidden" name="aggregateVersion" value={data.selectedTarget.aggregateVersion}/><button name="action" value="APPROVE">Approve benefit target</button></form>{/if}
          {#if data.canManage && data.selectedTarget.status === 'APPROVED'}<form method="POST" action="?/transition" class="actions"><input type="hidden" name="targetId" value={data.selectedTarget.id}/><input type="hidden" name="aggregateVersion" value={data.selectedTarget.aggregateVersion}/><button name="action" value="ACTIVATE">Activate benefit target</button></form>{/if}

          {#if data.canManage}
            <details class="command" open><summary>Validate realised outcome</summary><form method="POST" action="?/validate"><input type="hidden" name="targetId" value={data.selected.targetId}/><label>Validated observation<select name="observationId" required><option value="">Select observation</option>{#each data.observations.filter((row) => row.qualityStatus === 'VALIDATED' && row.subjectType === data.selectedTarget?.scopeType && row.subjectId === data.selectedTarget?.scopeId) as row}<option value={row.id}>{Number(row.numericValue)} · {new Date(row.observedAt).toLocaleDateString('en-GB')} · {row.sourceReference}</option>{/each}</select></label><label>Validation status<select name="validationStatus"><option>REALISED</option><option>PARTIAL</option><option>NOT_REALISED</option></select></label><label>Evidence Item ID<input name="evidenceItemId"/></label><label>Validation note<textarea name="validationNote" rows="4" required></textarea></label><button>Record benefit validation</button></form></details>
          {/if}

          <section class="validations"><span class="eyebrow">Realised-value evidence</span><div class="rows">{#each data.validations as row}<article><div><strong>{row.validationStatus}</strong><span>{Number(row.realisedValue)}</span></div><p>{row.validationNote}</p><small>Observation {row.observationId} · {new Date(row.validatedAt).toLocaleString('en-GB')}</small></article>{:else}<p class="empty">No realised-value validations recorded.</p>{/each}</div></section>
        </section>
      {:else}<section class="section-card empty-state"><h2>Define the first measurable benefit</h2><p>Benefits require a governed KPI, an exact active baseline and a separate Performance Target.</p></section>{/if}
    </main>
  </div>
</div>

<style>
.page{display:grid;gap:12px}.breadcrumb{display:flex;gap:7px;font-size:9px;color:#728694}.breadcrumb a{color:#315f7d;text-decoration:none}.hero{display:grid;grid-template-columns:1.5fr .7fr;gap:20px;padding:18px;background:linear-gradient(120deg,#fbfdff,#eaf6fd)}.eyebrow{font-size:10px;font-weight:850;color:var(--blue-700);text-transform:uppercase;letter-spacing:.07em}h1{margin:3px 0 6px;font-size:25px}h2{margin:3px 0 8px;font-size:16px}p{font-size:10px;color:#5f7484}.principle{display:grid;gap:5px;padding:12px;border:1px solid #bddded;border-radius:9px;background:#fff}.principle strong{font-size:11px;color:#315d76}.principle span,.principle small{font-size:9px;color:#667c8b}.workspace{display:grid;grid-template-columns:330px 1fr;gap:12px;align-items:start}.register,.detail{padding:13px}.register{position:sticky;top:78px}.rows{display:grid;gap:6px;margin-top:9px}.rows a,.rows article{display:grid;gap:4px;padding:8px;border:1px solid #dfe7ec;border-radius:7px;background:#fafcfd;color:inherit;text-decoration:none}.rows a.active{border-color:#79bde2;background:#edf8fe}.rows div,.head{display:flex;justify-content:space-between;gap:8px}.rows strong{font-size:9.5px}.rows span,.rows small{font-size:8px;color:#718693}.rows p{margin:0}.statement{font-size:11px}.facts{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:10px 0}.facts span{display:grid;gap:2px;padding:7px;background:#f4f7f9;border-radius:6px}.facts small{font-size:7.5px;color:#85949e}.facts strong{font-size:9px;overflow-wrap:anywhere}.subject,.validations{margin-top:12px;padding:10px;border:1px solid #dfe7ec;border-radius:8px}.command{margin-top:12px;border-top:1px solid #e4eaee;padding-top:9px}.command summary{cursor:pointer;font-size:9px;font-weight:800;color:#35617d}form{display:grid;gap:7px;margin-top:8px}label{display:grid;gap:4px;font-size:9px;color:#52697a;font-weight:750}input,select,textarea{width:100%;padding:7px;border:1px solid #ccd8e0;border-radius:6px;font:inherit}button{border:0;border-radius:6px;padding:7px 9px;background:var(--blue-700);color:white;font-size:9px;font-weight:800}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.status{font-size:8px;font-weight:800}.message{padding:9px;border:1px solid #dd8a8a;background:#fff3f3;color:#792f2f}.empty-state{padding:24px;text-align:center}@media(max-width:850px){.hero,.workspace,.grid,.facts{grid-template-columns:1fr}.register{position:static}}
</style>