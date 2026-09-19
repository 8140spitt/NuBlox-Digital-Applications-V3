<script lang="ts">
  let { data, form } = $props();
  const href = (id: string) => {
    const q = new URLSearchParams({ mode: data.mode, model: id });
    return `/${data.tenantSlug}/app/functions/f05/configuration?${q.toString()}`;
  };
  const title = $derived(data.mode === 'development' ? 'Development & validation' : 'Product & service design');
</script>

<svelte:head><title>{title} · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb"><a href={`/${data.tenantSlug}/app/functions/f05`}>F05 Product, Service & Innovation</a><span>›</span><strong>{data.mode === 'development' ? 'F05.06 Development' : 'F05.05 Product / Service Design'}</strong></nav>
  <header class="hero section-card">
    <div><span class="eyebrow">F05.05–F05.06 · AGG-10-CONFIGURATION</span><h1>{title}</h1><p>Control product and service definitions as versioned configuration models with characteristics, rules, traceable requirements and validation trials.</p></div>
    <div class="principle"><strong>Released definition is immutable</strong><span>Enhancement creates a successor version; it never overwrites prior configuration truth.</span><small>Effectivity and future engineering requirements remain explicit references to their owning authorities.</small></div>
  </header>
  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <span class="eyebrow">Configuration register</span><h2>{data.models.length} models</h2>
      <nav class="rows">{#each data.models as model}<a class:active={data.selected?.id===model.id} href={href(model.id)}><div><strong>{model.modelRef}</strong><span>{model.status}</span></div><p>{model.title}</p><small>v{model.currentVersionNo} · aggregate v{model.aggregateVersion}</small></a>{:else}<p>No Product Configuration Models.</p>{/each}</nav>
      {#if data.canManage}
        <details class="command">
          <summary>Create configuration model</summary>
          <form method="POST" action="?/create">
            <input type="hidden" name="mode" value={data.mode}/>
            <label>Selected concept<select name="itemId" required><option value="">Choose selected Item</option>{#each data.items.filter((i)=>i.conceptStatus==='SELECTED') as item}<option value={item.id}>{item.itemNumber} · {item.name}</option>{/each}</select></label>
            <div class="grid"><label>Model reference<input name="modelRef" required/></label><label>Title<input name="title" required/></label></div>
            <label>Definition scope<textarea name="definitionScope" rows="2" required></textarea></label>
            <label>Design summary<textarea name="designSummary" rows="3" required></textarea></label>
            <div class="grid"><label>Definition JSON<textarea name="definition" rows="4">{'{}'}</textarea></label><label>Specification JSON<textarea name="specification" rows="4">{'{}'}</textarea></label></div>
            <label>Validation criteria<textarea name="validationCriteria" rows="3" required></textarea></label>
            <label>Prototype basis JSON<textarea name="prototypeBasis" rows="3">{'{}'}</textarea></label>
            <button>Create controlled model</button>
          </form>
        </details>
      {/if}
    </aside>

    <main>
      {#if data.selected && data.current}
        <section class="section-card detail">
          <div class="head"><div><span class="eyebrow">Product Configuration Model</span><h2>{data.selected.modelRef} · {data.selected.title}</h2></div><div class="states"><span>{data.selected.status}</span><span>v{data.current.versionNo}</span></div></div>
          <p>{data.selected.definitionScope}</p>
          <div class="facts"><span><small>Item</small><strong>{data.items.find((i)=>i.id===data.selected?.itemId)?.itemNumber ?? '—'}</strong></span><span><small>Characteristics</small><strong>{data.characteristics.length}</strong></span><span><small>Rules</small><strong>{data.rules.length}</strong></span><span><small>Trace links</small><strong>{data.requirements.length}</strong></span><span><small>Trials</small><strong>{data.trials.length}</strong></span></div>
          <section class="panel"><span class="eyebrow">Current version definition</span><p>{data.current.designSummary}</p><small>Validation · {data.current.validationCriteria}</small></section>

          <div class="split">
            <section class="panel"><div class="section-head"><span class="eyebrow">Characteristics</span><strong>{data.characteristics.length}</strong></div>{#each data.characteristics as row}<article><strong>{row.characteristicKey} · {row.name}</strong><small>{row.valueType} · {row.required ? 'Required' : 'Optional'} · default {row.defaultValue ?? '—'}</small></article>{:else}<p>No characteristics.</p>{/each}</section>
            <section class="panel"><div class="section-head"><span class="eyebrow">Rules</span><strong>{data.rules.length}</strong></div>{#each data.rules as row}<article><strong>{row.ruleKey} · {row.ruleType}</strong><small>{row.severity} · {row.expression}</small></article>{:else}<p>No rules.</p>{/each}</section>
          </div>
          <div class="split">
            <section class="panel"><div class="section-head"><span class="eyebrow">Requirement traceability</span><strong>{data.requirements.length}</strong></div>{#each data.requirements as row}<article><strong>{row.requirementType} · {row.traceabilityRole}</strong><small>{row.subjectId} · v{row.subjectVersion ?? '—'} · {row.validationStatus}</small></article>{:else}<p>No trace links.</p>{/each}</section>
            <section class="panel"><div class="section-head"><span class="eyebrow">Trials & validation</span><strong>{data.trials.length}</strong></div>{#each data.trials as row}<article><strong>{row.trialRef} · {row.outcome}</strong><small>{row.trialType} · {row.resultSummary}</small></article>{:else}<p>No trials.</p>{/each}</section>
          </div>

          {#if data.canManage && data.current.lifecycleStatus !== 'RELEASED'}
            <div class="commands">
              <details class="command"><summary>Add characteristic</summary><form method="POST" action="?/characteristic">
                <input type="hidden" name="modelId" value={data.selected.id}/><input type="hidden" name="mode" value={data.mode}/>
                <div class="grid"><label>Key<input name="characteristicKey" required/></label><label>Name<input name="name" required/></label></div>
                <div class="grid"><label>Value type<select name="valueType"><option>ENUM</option><option>TEXT</option><option>NUMBER</option><option>BOOLEAN</option></select></label><label>UOM<select name="unitOfMeasureId"><option value="">None</option>{#each data.units.filter((u)=>u.status==='ACTIVE') as unit}<option value={unit.id}>{unit.unitCode}</option>{/each}</select></label></div>
                <label><span><input type="checkbox" name="required"/> Required characteristic</span></label>
                <label>Allowed values JSON<textarea name="allowedValues" rows="2">[]</textarea></label><label>Default value<input name="defaultValue"/></label><button>Add characteristic</button>
              </form></details>
              <details class="command"><summary>Add configuration rule</summary><form method="POST" action="?/rule">
                <input type="hidden" name="modelId" value={data.selected.id}/><input type="hidden" name="mode" value={data.mode}/>
                <div class="grid"><label>Rule key<input name="ruleKey" required/></label><label>Rule type<select name="ruleType"><option>CONSTRAINT</option><option>COMPATIBILITY</option><option>DERIVATION</option></select></label></div>
                <label>Expression<textarea name="expression" rows="2" required></textarea></label><label>Severity<select name="severity"><option>ERROR</option><option>WARNING</option></select></label><button>Add rule</button>
              </form></details>
              <details class="command"><summary>Link requirement / market need</summary><form method="POST" action="?/requirement">
                <input type="hidden" name="modelId" value={data.selected.id}/><input type="hidden" name="mode" value={data.mode}/>
                <label>Requirement type<select name="requirementType"><option>MARKET_INSIGHT</option><option>ENGINEERING_REQUIREMENT_SET</option><option>ENGINEERING_MODEL</option></select></label>
                <label>Validated market insight<select name="subjectId" required><option value="">Choose governed subject</option>{#each data.insights.filter((i)=>i.status==='VALIDATED') as insight}<option value={insight.id}>{insight.insightRef} · {insight.title}</option>{/each}</select></label>
                <div class="grid"><label>Subject version<input name="subjectVersion"/></label><label>Trace role<input name="traceabilityRole" value="SATISFIES"/></label></div>
                <label>Validation status<select name="validationStatus"><option>PENDING</option><option>VALIDATED</option></select></label><button>Link exact requirement</button>
              </form></details>
              <details class="command" open={data.mode === 'development'}><summary>Record prototype / trial</summary><form method="POST" action="?/trial">
                <input type="hidden" name="modelId" value={data.selected.id}/><input type="hidden" name="mode" value={data.mode}/>
                <div class="grid"><label>Trial ref<input name="trialRef" required/></label><label>Type<select name="trialType"><option>PILOT</option><option>PROTOTYPE</option><option>VALIDATION</option></select></label></div>
                <label>Hypothesis<textarea name="hypothesis" rows="2" required></textarea></label><label>Method<textarea name="method" rows="2" required></textarea></label><label>Success criteria<textarea name="successCriteria" rows="2" required></textarea></label>
                <label>Outcome<select name="outcome"><option>PASS</option><option>FAIL</option><option>INCONCLUSIVE</option></select></label><label>Result summary<textarea name="resultSummary" rows="2" required></textarea></label><label>Evidence reference<input name="evidenceReference"/></label><button>Record trial evidence</button>
              </form></details>
            </div>
            <form method="POST" action="?/release" class="release">
              <input type="hidden" name="modelId" value={data.selected.id}/><input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/><input type="hidden" name="mode" value={data.mode}/><button>Release current configuration</button>
            </form>
          {:else if data.canManage && data.current.lifecycleStatus === 'RELEASED'}
            <details class="command"><summary>Create successor version</summary><form method="POST" action="?/revise">
              <input type="hidden" name="modelId" value={data.selected.id}/><input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/><input type="hidden" name="mode" value={data.mode}/>
              <label>Design summary<textarea name="designSummary" rows="3" required></textarea></label><div class="grid"><label>Definition JSON<textarea name="definition" rows="3">{'{}'}</textarea></label><label>Specification JSON<textarea name="specification" rows="3">{'{}'}</textarea></label></div><label>Validation criteria<textarea name="validationCriteria" rows="2" required></textarea></label><label>Prototype basis JSON<textarea name="prototypeBasis" rows="2">{'{}'}</textarea></label><button>Create successor draft</button>
            </form></details>
          {/if}
        </section>
      {:else}<section class="section-card empty-state"><h2>Create a configuration from a selected concept</h2><p>Configuration is the controlled definition authority; released versions become immutable traceability points.</p></section>{/if}
    </main>
  </div>
</div>

<style>
.page{display:grid;gap:12px}.breadcrumb{display:flex;gap:7px;font-size:9px;color:#728694}.breadcrumb a{color:#315f7d;text-decoration:none}.hero{display:grid;grid-template-columns:1.5fr .7fr;gap:20px;padding:18px;background:linear-gradient(120deg,#fbfdff,#eaf6fd)}.eyebrow{font-size:10px;font-weight:850;color:var(--blue-700);text-transform:uppercase;letter-spacing:.07em}h1{margin:3px 0 6px;font-size:25px}h2{margin:3px 0 8px;font-size:16px}p{font-size:10px;color:#5f7484;line-height:1.45}.principle{display:grid;gap:5px;padding:12px;border:1px solid #bddded;border-radius:9px;background:#fff}.principle strong{font-size:11px;color:#315d76}.principle span,.principle small{font-size:9px;color:#667c8b}.workspace{display:grid;grid-template-columns:320px 1fr;gap:12px;align-items:start}.register,.detail{padding:13px}.register{position:sticky;top:78px}.rows{display:grid;gap:6px;margin-top:9px}.rows a{display:grid;gap:4px;padding:8px;border:1px solid #dfe7ec;border-radius:7px;background:#fafcfd;color:inherit;text-decoration:none}.rows a.active{border-color:#79bde2;background:#edf8fe}.rows div,.head,.section-head{display:flex;justify-content:space-between;gap:8px}.rows p{margin:0}.rows strong{font-size:9.5px}.rows span,.rows small{font-size:8px;color:#718693}.states{display:flex;gap:5px}.states span{padding:4px 6px;border-radius:999px;background:#eaf4f9;color:#35617d;font-size:8px;font-weight:800}.facts{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:10px 0}.facts span{display:grid;gap:2px;padding:7px;background:#f4f7f9;border-radius:6px}.facts small{font-size:7.5px;color:#85949e}.facts strong{font-size:9px}.split{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.panel{padding:10px;border:1px solid #dfe7ec;border-radius:8px}.panel article{display:grid;gap:2px;padding:7px 0;border-bottom:1px solid #edf1f3}.panel article:last-child{border:0}.panel article strong{font-size:9px;color:#3d5b6f}.panel article small{font-size:8px;color:#758894}.commands{display:grid;grid-template-columns:1fr 1fr;gap:8px}.command{margin-top:12px;border-top:1px solid #e4eaee;padding-top:9px}.command summary{cursor:pointer;font-size:9px;font-weight:800;color:#35617d}form{display:grid;gap:7px;margin-top:8px}label{display:grid;gap:4px;font-size:9px;color:#52697a;font-weight:750}label>span{display:flex;align-items:center;gap:5px}label>span input{width:auto}input,select,textarea{width:100%;padding:7px;border:1px solid #ccd8e0;border-radius:6px;font:inherit}button{border:0;border-radius:6px;padding:8px 10px;background:var(--blue-700);color:#fff;font-size:9px;font-weight:800}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.release{display:flex;justify-content:flex-end;margin-top:10px}.message{padding:9px;border:1px solid #dd8a8a;background:#fff3f3;color:#792f2f}.empty-state{padding:24px;text-align:center}@media(max-width:1000px){.workspace,.hero,.facts,.split,.commands,.grid{grid-template-columns:1fr}.register{position:static}}
</style>