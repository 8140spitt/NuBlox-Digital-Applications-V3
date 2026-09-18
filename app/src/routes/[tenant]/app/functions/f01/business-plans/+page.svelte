<script lang="ts">
  let { data, form } = $props();

  const currentVersion = $derived(
    data.versions.find((version) => version.versionNo === data.selected?.currentVersionNo) ?? null
  );

  function href(id: string) {
    return `/${data.tenantSlug}/app/functions/f01/business-plans?plan=${encodeURIComponent(id)}`;
  }

  function isObjectiveSelected(id: string) {
    return data.objectiveReferences.some((row) => row.objectiveId === id);
  }

  function isAssumptionSelected(id: string) {
    return data.assumptionReferences.some((row) => row.assumptionId === id);
  }
</script>

<svelte:head><title>Business Plans · NuBlox</title></svelte:head>

<div class="plan-page">
  <nav class="breadcrumb"><a href={`/${data.tenantSlug}/app/functions/f01`}>F01 Strategy & Enterprise Planning</a><span>›</span><strong>F01.04 Business Planning</strong></nav>

  <header class="hero section-card">
    <div><span class="eyebrow">F01.04 · SGP-BUSINESS-PLAN</span><h1>Business plans</h1><p>Translate published strategy into owned, period-bound execution plans while preserving exact objective and assumption versions behind each approved baseline.</p></div>
    <div class="principle"><strong>Plan ≠ budget or forecast truth</strong><span>Financial and resource values here are governed planning expectations.</span><small>Approved plan baselines remain reconstructable when later revisions are created.</small></div>
  </header>

  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <div class="workspace-grid">
    <aside class="section-card register">
      <div><span class="eyebrow">Plan register</span><h2>{data.plans.length} plans</h2></div>
      <nav class="plan-list">
        {#each data.plans as item}
          <a class:active={data.selected?.id === item.id} href={href(item.id)}>
            <div><strong>{item.planRef}</strong><span class={'status '+item.status.toLowerCase()}>{item.status}</span></div>
            <p>{item.name}</p><small>{new Date(item.periodStart).getUTCFullYear()}–{new Date(item.periodEnd).getUTCFullYear()} · v{item.currentVersionNo}</small>
          </a>
        {:else}<p class="empty-copy">No governed Business Plans yet.</p>{/each}
      </nav>

      {#if data.capabilities.canManage}
        <details class="command">
          <summary>Create business plan</summary>
          <form method="POST" action="?/create">
            <label>Plan reference<input name="planRef" required placeholder="BP-2027" /></label>
            <label>Name<input name="name" required placeholder="FY27 Enterprise Business Plan" /></label>
            <label>Published strategy<select name="frameworkId" required><option value="">Select strategy</option>{#each data.frameworks as item}<option value={item.id}>{item.title} · v{item.currentVersion}</option>{/each}</select></label>
            <label>Strategy version<input name="frameworkVersionNo" type="number" min="1" required /></label>
            <div class="form-grid"><label>Scope type<input name="scopeType" required value="TENANT" /></label><label>Scope ID<input name="scopeId" required /></label><label>Period start<input name="periodStart" type="date" required /></label><label>Period end<input name="periodEnd" type="date" required /></label></div>
            <label>Resource assumptions<textarea name="resourceAssumptions" rows="3" required></textarea></label>
            <label>Financial expectations<textarea name="financialExpectations" rows="3" required></textarea></label>
            <label>Measurable outcomes<textarea name="measurableOutcomes" rows="3" required></textarea></label>
            <label>Delivery roadmap<textarea name="deliveryRoadmap" rows="3" required></textarea></label>
            <label>Strategic objectives<select name="objectives" multiple size="5">{#each data.objectives as item}<option value={`${item.id}:${item.currentVersionNo}`}>{item.objectiveRef} · v{item.currentVersionNo}</option>{/each}</select></label>
            <label>Planning assumptions<select name="assumptions" multiple size="5">{#each data.assumptions as item}<option value={`${item.id}:${item.currentVersionNo}`}>{item.assumptionRef} · v{item.currentVersionNo}</option>{/each}</select></label>
            <button type="submit">Create draft plan</button>
          </form>
        </details>
      {/if}
    </aside>

    <main class="main-column">
      {#if data.selected}
        <section class="section-card detail">
          <div class="detail-head"><div><span class="eyebrow">Strategy v{data.selected.frameworkVersionNo}</span><h2>{data.selected.planRef} · {data.selected.name}</h2></div><span class={'status large '+data.selected.status.toLowerCase()}>{data.selected.status}</span></div>
          <div class="facts"><span><small>Plan version</small><strong>v{data.selected.currentVersionNo}</strong></span><span><small>Aggregate</small><strong>v{data.selected.aggregateVersion}</strong></span><span><small>Objectives</small><strong>{data.objectiveReferences.length}</strong></span><span><small>Assumptions</small><strong>{data.assumptionReferences.length}</strong></span></div>
          <div class="content-grid">
            <article><span class="eyebrow">Resource assumptions</span><p>{data.selected.resourceAssumptions}</p></article>
            <article><span class="eyebrow">Financial expectations</span><p>{data.selected.financialExpectations}</p></article>
            <article><span class="eyebrow">Measurable outcomes</span><p>{data.selected.measurableOutcomes}</p></article>
            <article><span class="eyebrow">Delivery roadmap</span><p>{data.selected.deliveryRoadmap}</p></article>
          </div>

          <div class="actions">
            {#if data.capabilities.canManage && data.selected.status === 'DRAFT'}
              <form method="POST" action="?/submit"><input type="hidden" name="planId" value={data.selected.id}/><input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/><button>Submit for approval</button></form>
            {/if}
            {#if data.capabilities.canApprove && data.selected.status === 'IN_REVIEW'}
              <form method="POST" action="?/approve"><input type="hidden" name="planId" value={data.selected.id}/><input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/><input name="reason" required placeholder="Approval rationale"/><button>Approve plan</button></form>
            {/if}
            {#if data.capabilities.canApprove && data.selected.status === 'APPROVED'}
              <form method="POST" action="?/activate"><input type="hidden" name="planId" value={data.selected.id}/><input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/><button>Make current baseline</button></form>
            {/if}
            {#if data.capabilities.canApprove && data.selected.status === 'CURRENT'}
              <form method="POST" action="?/close"><input type="hidden" name="planId" value={data.selected.id}/><input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/><button class="quiet">Close plan</button></form>
            {/if}
          </div>

          {#if data.capabilities.canManage && (data.selected.status === 'DRAFT' || data.selected.status === 'CURRENT')}
            <details class="command">
              <summary>Create revised plan version</summary>
              <form method="POST" action="?/revise">
                <input type="hidden" name="planId" value={data.selected.id}/><input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/>
                <label>Resource assumptions<textarea name="resourceAssumptions" rows="3" required>{data.selected.resourceAssumptions}</textarea></label>
                <label>Financial expectations<textarea name="financialExpectations" rows="3" required>{data.selected.financialExpectations}</textarea></label>
                <label>Measurable outcomes<textarea name="measurableOutcomes" rows="3" required>{data.selected.measurableOutcomes}</textarea></label>
                <label>Delivery roadmap<textarea name="deliveryRoadmap" rows="3" required>{data.selected.deliveryRoadmap}</textarea></label>
                <label>Strategic objectives<select name="objectives" multiple size="5">{#each data.objectives as item}<option selected={isObjectiveSelected(item.id)} value={`${item.id}:${item.currentVersionNo}`}>{item.objectiveRef} · v{item.currentVersionNo}</option>{/each}</select></label>
                <label>Planning assumptions<select name="assumptions" multiple size="5">{#each data.assumptions as item}<option selected={isAssumptionSelected(item.id)} value={`${item.id}:${item.currentVersionNo}`}>{item.assumptionRef} · v{item.currentVersionNo}</option>{/each}</select></label>
                <button type="submit">Create revised draft version</button>
              </form>
            </details>
          {/if}
        </section>

        <section class="section-card history">
          <span class="eyebrow">Immutable baselines</span><h2>{data.versions.length} versions</h2>
          <div class="version-list">{#each data.versions as version}<article><div><strong>v{version.versionNo}</strong><span class={'status '+version.lifecycleStatus.toLowerCase()}>{version.lifecycleStatus}</span></div><p>{version.measurableOutcomes}</p>{#if version.approvalDecisionId}<small>Decision · {version.approvalDecisionId.slice(0,8)}</small>{/if}</article>{/each}</div>
        </section>
      {:else}
        <section class="section-card empty-state"><h2>Create the first Business Plan</h2><p>Publish Strategy and approve at least one Strategic Objective first, then convert that direction into an executable plan.</p></section>
      {/if}
    </main>
  </div>
</div>

<style>
.plan-page{display:grid;gap:12px}.breadcrumb{display:flex;gap:7px;align-items:center;font-size:9px;color:#728694}.breadcrumb a{color:#315f7d;text-decoration:none}.hero{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(290px,.65fr);gap:24px;padding:18px;border-color:#8fc9ee;background:linear-gradient(120deg,#fbfdff,#eaf6fd)}.eyebrow{color:var(--blue-700);font-size:10px;font-weight:850;letter-spacing:.07em;text-transform:uppercase}h1{margin:3px 0 6px;font-size:25px}h2{margin:2px 0 0;font-size:16px}p{color:#5f7484;font-size:10px;line-height:1.45}.hero p{margin:0;max-width:760px;font-size:11.5px}.principle{display:grid;gap:5px;padding:12px;border:1px solid #bddded;border-radius:9px;background:white}.principle strong{color:#315d76;font-size:11px}.principle span{color:#526d7d;font-size:9.5px}.principle small{color:#7b8e9a;font-size:8.5px}.message{padding:9px 12px;border:1px solid #dd8a8a;border-radius:8px;background:#fff3f3;color:#792f2f;font-size:11px}.workspace-grid{display:grid;grid-template-columns:340px minmax(0,1fr);gap:12px;align-items:start}.register{position:sticky;top:78px;padding:12px}.plan-list{display:grid;gap:6px;margin-top:10px}.plan-list a{display:grid;gap:5px;padding:9px;border:1px solid #e0e7ec;border-radius:8px;background:#fafcfd;color:inherit;text-decoration:none}.plan-list a.active{border-color:#79bde2;background:#edf8fe;box-shadow:inset 3px 0 var(--blue-700)}.plan-list a>div,.detail-head{display:flex;justify-content:space-between;gap:8px}.plan-list strong{font-size:9.5px;color:#315b75}.plan-list p{margin:0}.plan-list small{color:#788a97;font-size:8px}.status{width:max-content;padding:2px 5px;border-radius:999px;background:#eef2f5;color:#607483;font-size:7.5px;font-weight:850}.status.current,.status.approved{background:#e6f5e9;color:#2b6c39}.status.in_review,.status.review{background:#fff3d9;color:#805d19}.status.large{padding:4px 7px;font-size:8.5px}.command{margin-top:10px;padding-top:9px;border-top:1px solid #e5ebef}.command summary{width:max-content;padding:6px 8px;border-radius:6px;background:#edf5fa;color:#35617d;font-size:9px;font-weight:800;cursor:pointer}form{display:grid;gap:7px;margin-top:8px}label{display:grid;gap:4px;color:#52697a;font-size:9px;font-weight:750}input,select,textarea{width:100%;border:1px solid #ccd8e0;border-radius:6px;padding:7px 8px;background:white;color:var(--ink);font-size:9.5px}textarea{resize:vertical;font-family:inherit}.form-grid,.content-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}button{border:0;border-radius:6px;padding:7px 9px;background:var(--blue-700);color:white;font-size:9px;font-weight:800;cursor:pointer}button.quiet{background:white;color:#4e697b;border:1px solid #d5e0e6}.main-column{display:grid;gap:12px;min-width:0}.detail,.history{padding:14px}.facts{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}.facts span{display:grid;gap:2px;min-width:110px;padding:6px 8px;border-radius:6px;background:#f4f7f9}.facts small{color:#86959f;font-size:7.5px;text-transform:uppercase}.facts strong{color:#405d70;font-size:9px}.content-grid article{padding:10px;border:1px solid #e3e9ed;border-radius:8px;background:#fafcfd}.content-grid p{margin:4px 0 0}.actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.actions form{display:flex;margin:0}.version-list{display:grid;gap:7px;margin-top:10px}.version-list article{padding:9px;border:1px solid #e1e8ec;border-radius:8px;background:#fafcfd}.version-list article>div{display:flex;gap:6px;align-items:center}.version-list p{margin:5px 0}.version-list small{color:#7d8d98;font-size:8.5px}.empty-copy,.empty-state{color:#81909a}.empty-state{min-height:220px;display:grid;place-content:center;padding:24px;text-align:center}@media(max-width:800px){.hero,.workspace-grid,.form-grid,.content-grid{grid-template-columns:1fr}.register{position:static}}
</style>
