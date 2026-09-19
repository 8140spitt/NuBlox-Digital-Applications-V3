<script lang="ts">
  let { data, form } = $props();
  const insightHref = (id: string) =>
    `/${data.tenantSlug}/app/functions/f06/intelligence-segmentation?mode=intelligence&insight=${encodeURIComponent(id)}`;
  const segmentHref = (id: string) =>
    `/${data.tenantSlug}/app/functions/f06/intelligence-segmentation?mode=segmentation&segment=${encodeURIComponent(id)}`;
</script>

<svelte:head>
  <title>{data.mode === 'segmentation' ? 'Customer Segmentation' : 'Market Intelligence'} · NuBlox</title>
</svelte:head>

<div class="page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f06`}>F06 Marketing & Brand</a>
    <span>›</span>
    <strong>{data.mode === 'segmentation' ? 'F06.02 Customer Segmentation' : 'F06.01 Market Intelligence'}</strong>
  </nav>

  <header class="hero section-card">
    <div>
      <span class="eyebrow">{data.mode === 'segmentation' ? 'F06.02 · MARKET SEGMENT' : 'F06.01 · AGG-03-MARKET-INSIGHT'}</span>
      <h1>{data.mode === 'segmentation' ? 'Customer segmentation' : 'Market intelligence'}</h1>
      <p>
        {data.mode === 'segmentation'
          ? 'Define effective-dated audience criteria and record exact membership evaluations without creating a second customer identity.'
          : 'Capture attributable research, competitors, trends and market observations before they become strategy, product or campaign assumptions.'}
      </p>
    </div>
    <div class="principle">
      <strong>{data.mode === 'segmentation' ? 'Segment ≠ customer master' : 'Observation time matters'}</strong>
      <span>{data.mode === 'segmentation' ? 'Membership overlays Party, relationship or Lead identities.' : 'Insight keeps source, confidence and as-of context.'}</span>
      <small>{data.mode === 'segmentation' ? 'Campaigns later pin the exact active segment version.' : 'F05 and F06 consume the same canonical Market Insight authority.'}</small>
    </div>
  </header>

  <div class="mode-tabs">
    <a class:active={data.mode === 'intelligence'} href={`/${data.tenantSlug}/app/functions/f06/intelligence-segmentation?mode=intelligence`}>Market intelligence</a>
    <a class:active={data.mode === 'segmentation'} href={`/${data.tenantSlug}/app/functions/f06/intelligence-segmentation?mode=segmentation`}>Customer segmentation</a>
  </div>

  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  {#if data.mode === 'intelligence'}
    <div class="workspace">
      <aside class="section-card register">
        <span class="eyebrow">Insight register</span>
        <h2>{data.insights.length} observations</h2>
        <nav class="rows">
          {#each data.insights as item}
            <a class:active={data.selectedInsight?.id === item.id} href={insightHref(item.id)}>
              <div><strong>{item.insightRef}</strong><span>{item.status}</span></div>
              <p>{item.title}</p>
              <small>{item.insightType} · {item.confidence}</small>
            </a>
          {:else}
            <p class="empty">No market intelligence captured.</p>
          {/each}
        </nav>
        {#if data.capabilities.canIntelligence}
          <details class="command">
            <summary>Capture market intelligence</summary>
            <form method="POST" action="?/createInsight">
              <div class="grid">
                <label>Reference<input name="insightRef" required /></label>
                <label>Type<select name="insightType"><option>MARKET_RESEARCH</option><option>COMPETITOR_INSIGHT</option><option>TREND</option><option>CUSTOMER_NEED</option></select></label>
              </div>
              <label>Title<input name="title" required /></label>
              <label>Subject<textarea name="subject" rows="2" required></textarea></label>
              <div class="grid">
                <label>Source type<input name="sourceType" value="PRIMARY_RESEARCH" required /></label>
                <label>Source reference<input name="sourceReference" /></label>
              </div>
              <div class="grid">
                <label>Confidence<select name="confidence"><option>HIGH</option><option selected>MEDIUM</option><option>LOW</option></select></label>
                <label>Geography<input name="geography" /></label>
              </div>
              <label>Sector<input name="sector" /></label>
              <label>Problem / observation<textarea name="problemStatement" rows="3" required></textarea></label>
              <label>Need / implication<textarea name="needStatement" rows="3" required></textarea></label>
              <label>Desired outcome<textarea name="desiredOutcome" rows="2"></textarea></label>
              <label>Evidence reference<input name="evidenceReference" /></label>
              <button>Capture governed insight</button>
            </form>
          </details>
        {/if}
      </aside>

      <main>
        {#if data.selectedInsight}
          <section class="section-card detail">
            <div class="head">
              <div><span class="eyebrow">{data.selectedInsight.insightType}</span><h2>{data.selectedInsight.insightRef} · {data.selectedInsight.title}</h2></div>
              <span class="status">{data.selectedInsight.status}</span>
            </div>
            <div class="facts">
              <span><small>Confidence</small><strong>{data.selectedInsight.confidence}</strong></span>
              <span><small>As-of</small><strong>{new Date(data.selectedInsight.asOfAt).toLocaleDateString('en-GB')}</strong></span>
              <span><small>Geography</small><strong>{data.selectedInsight.geography ?? '—'}</strong></span>
              <span><small>Sector</small><strong>{data.selectedInsight.sector ?? '—'}</strong></span>
              <span><small>Aggregate</small><strong>v{data.selectedInsight.aggregateVersion}</strong></span>
            </div>
            <section class="panel"><span class="eyebrow">Observation / problem</span><p>{data.selectedInsight.problemStatement}</p></section>
            <section class="panel"><span class="eyebrow">Implication / need</span><p>{data.selectedInsight.needStatement}</p><small>{data.selectedInsight.desiredOutcome ?? 'No desired outcome recorded.'}</small></section>
            {#if data.capabilities.canIntelligence && data.selectedInsight.status === 'CAPTURED'}
              <form method="POST" action="?/validateInsight" class="inline-action">
                <input type="hidden" name="insightId" value={data.selectedInsight.id} />
                <input type="hidden" name="aggregateVersion" value={data.selectedInsight.aggregateVersion} />
                <button>Validate market insight</button>
              </form>
            {/if}
          </section>
        {:else}
          <section class="section-card empty-state"><h2>Capture the first attributable market observation</h2></section>
        {/if}
      </main>
    </div>
  {:else}
    <div class="workspace">
      <aside class="section-card register">
        <span class="eyebrow">Segment register</span>
        <h2>{data.segments.length} segments</h2>
        <nav class="rows">
          {#each data.segments as segment}
            <a class:active={data.selectedSegment?.id === segment.id} href={segmentHref(segment.id)}>
              <div><strong>{segment.segmentRef}</strong><span>{segment.status}</span></div>
              <p>{segment.name}</p><small>definition v{segment.currentVersionNo}</small>
            </a>
          {:else}<p class="empty">No market segments defined.</p>{/each}
        </nav>
        {#if data.capabilities.canSegment}
          <details class="command">
            <summary>Create segment</summary>
            <form method="POST" action="?/createSegment">
              <div class="grid"><label>Reference<input name="segmentRef" required /></label><label>Name<input name="name" required /></label></div>
              <label>Description<textarea name="description" rows="3" required></textarea></label>
              <label>Criteria JSON<textarea name="criteria" rows="4" value="{}"></textarea></label>
              <div class="grid"><label>Geography JSON<textarea name="geography" rows="3" value="{}"></textarea></label><label>Sector JSON<textarea name="sector" rows="3" value="{}"></textarea></label></div>
              <div class="grid"><label>Profile JSON<textarea name="profile" rows="3" value="{}"></textarea></label><label>Value assessment JSON<textarea name="valueAssessment" rows="3" value="{}"></textarea></label></div>
              <button>Create governed segment</button>
            </form>
          </details>
        {/if}
      </aside>

      <main>
        {#if data.selectedSegment && data.currentSegmentVersion}
          <section class="section-card detail">
            <div class="head">
              <div><span class="eyebrow">Market Segment</span><h2>{data.selectedSegment.segmentRef} · {data.selectedSegment.name}</h2></div>
              <div class="state-group"><span>{data.selectedSegment.status}</span><span>v{data.currentSegmentVersion.versionNo}</span></div>
            </div>
            <p>{data.selectedSegment.description}</p>
            <div class="facts">
              <span><small>Definition status</small><strong>{data.currentSegmentVersion.lifecycleStatus}</strong></span>
              <span><small>Members</small><strong>{data.memberships.filter((m) => m.membershipStatus === 'INCLUDED').length}</strong></span>
              <span><small>Excluded</small><strong>{data.memberships.filter((m) => m.membershipStatus === 'EXCLUDED').length}</strong></span>
              <span><small>Aggregate</small><strong>v{data.selectedSegment.aggregateVersion}</strong></span>
            </div>
            <div class="split">
              <section class="panel"><span class="eyebrow">Criteria</span><pre>{JSON.stringify(data.currentSegmentVersion.criteria, null, 2)}</pre></section>
              <section class="panel"><span class="eyebrow">Profile & value</span><pre>{JSON.stringify(data.currentSegmentVersion.profile, null, 2)}</pre><pre>{JSON.stringify(data.currentSegmentVersion.valueAssessment, null, 2)}</pre></section>
            </div>
            <section class="panel">
              <div class="section-head"><span class="eyebrow">Evaluated membership</span><strong>{data.memberships.length}</strong></div>
              {#each data.memberships as row}
                <article><div><strong>{row.subjectType} · {row.subjectId}</strong><span>{row.membershipStatus}</span></div><small>Score {row.score ?? '—'} · {new Date(row.evaluatedAt).toLocaleString('en-GB')}</small></article>
              {:else}<p>No membership evaluations.</p>{/each}
            </section>
            {#if data.capabilities.canSegment && data.currentSegmentVersion.lifecycleStatus === 'DRAFT'}
              <form method="POST" action="?/activateSegment" class="inline-action">
                <input type="hidden" name="segmentId" value={data.selectedSegment.id} />
                <input type="hidden" name="aggregateVersion" value={data.selectedSegment.aggregateVersion} />
                <button>Activate exact segment version</button>
              </form>
            {/if}
            {#if data.capabilities.canSegment}
              <div class="command-grid">
                <details class="command"><summary>Create successor definition</summary><form method="POST" action="?/reviseSegment">
                  <input type="hidden" name="segmentId" value={data.selectedSegment.id} />
                  <input type="hidden" name="aggregateVersion" value={data.selectedSegment.aggregateVersion} />
                  <label>Description<textarea name="description" rows="2">{data.selectedSegment.description}</textarea></label>
                  <label>Criteria JSON<textarea name="criteria" rows="4">{JSON.stringify(data.currentSegmentVersion.criteria)}</textarea></label>
                  <div class="grid"><label>Geography JSON<textarea name="geography" rows="3">{JSON.stringify(data.currentSegmentVersion.geography)}</textarea></label><label>Sector JSON<textarea name="sector" rows="3">{JSON.stringify(data.currentSegmentVersion.sector)}</textarea></label></div>
                  <div class="grid"><label>Profile JSON<textarea name="profile" rows="3">{JSON.stringify(data.currentSegmentVersion.profile)}</textarea></label><label>Value JSON<textarea name="valueAssessment" rows="3">{JSON.stringify(data.currentSegmentVersion.valueAssessment)}</textarea></label></div>
                  <button>Create successor segment version</button>
                </form></details>
                <details class="command"><summary>Evaluate membership</summary><form method="POST" action="?/evaluateMember">
                  <input type="hidden" name="segmentId" value={data.selectedSegment.id} />
                  <input type="hidden" name="segmentVersionNo" value={data.currentSegmentVersion.versionNo} />
                  <div class="grid"><label>Subject type<select name="subjectType"><option>PARTY</option><option>PARTY_RELATIONSHIP</option><option>LEAD</option></select></label><label>Subject ID<input name="subjectId" required /></label></div>
                  <div class="grid"><label>Membership<select name="membershipStatus"><option>INCLUDED</option><option>EXCLUDED</option></select></label><label>Score<input name="score" type="number" min="0" max="100" step="any" /></label></div>
                  <label>Basis JSON<textarea name="basis" rows="3" value="{}"></textarea></label>
                  <button>Record membership evaluation</button>
                </form></details>
              </div>
            {/if}
          </section>
        {:else}<section class="section-card empty-state"><h2>Create a versioned customer/market segment</h2></section>{/if}
      </main>
    </div>
  {/if}
</div>

<style>
  .page{display:grid;gap:12px}.breadcrumb,.mode-tabs,.head,.rows div,.section-head,.panel article div{display:flex;gap:8px;align-items:center}.breadcrumb{font-size:9px;color:#728694}.breadcrumb a{color:#315f7d;text-decoration:none}.hero{display:grid;grid-template-columns:1.5fr .7fr;gap:20px;padding:18px;background:linear-gradient(120deg,#fbfdff,#eaf6fd)}.eyebrow{font-size:9px;font-weight:850;color:var(--blue-700);text-transform:uppercase;letter-spacing:.07em}h1{margin:4px 0 6px;font-size:25px}h2{margin:3px 0 8px;font-size:16px}p{font-size:10px;color:#5f7484;line-height:1.5}.principle{display:grid;gap:5px;padding:12px;border:1px solid #bddded;border-radius:9px;background:#fff}.principle strong{font-size:11px;color:#315d76}.principle span,.principle small{font-size:9px;color:#667c8b}.mode-tabs{padding:4px;border:1px solid #dbe6ec;border-radius:8px;background:#fff;width:max-content}.mode-tabs a{padding:6px 9px;border-radius:5px;color:#637987;font-size:9px;font-weight:800;text-decoration:none}.mode-tabs a.active{background:#eaf6fd;color:#2f6584}.workspace{display:grid;grid-template-columns:330px 1fr;gap:12px;align-items:start}.register,.detail{padding:13px}.register{position:sticky;top:78px}.rows{display:grid;gap:6px;margin-top:8px}.rows a{display:grid;gap:4px;padding:8px;border:1px solid #dfe7ec;border-radius:7px;background:#fafcfd;color:inherit;text-decoration:none}.rows a.active{border-color:#79bde2;background:#edf8fe}.rows div,.head,.section-head,.panel article div{justify-content:space-between}.rows p{margin:0}.rows strong{font-size:9.5px}.rows span,.rows small{font-size:8px;color:#718693}.facts{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:10px 0}.facts span{display:grid;gap:2px;padding:7px;background:#f4f7f9;border-radius:6px}.facts small{font-size:7px;color:#85949e}.facts strong{font-size:9px}.status,.state-group span{font-size:8px;font-weight:850;padding:4px 6px;border-radius:999px;background:#eaf4f9;color:#35617d}.state-group{display:flex;gap:5px}.panel{padding:10px;border:1px solid #dfe7ec;border-radius:8px;margin-top:8px;min-width:0}.panel pre{overflow:auto;font-size:8px;color:#607686}.panel article{padding:7px 0;border-bottom:1px solid #edf1f3}.panel article:last-child{border:0}.panel article strong{font-size:8.5px}.panel article span,.panel article small{font-size:8px;color:#748894}.split,.command-grid,.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.command{margin-top:10px;border-top:1px solid #e4eaee;padding-top:8px}.command summary{cursor:pointer;font-size:9px;font-weight:800;color:#35617d}form{display:grid;gap:7px;margin-top:8px}label{display:grid;gap:4px;font-size:8.5px;color:#52697a;font-weight:750}input,select,textarea{width:100%;padding:7px;border:1px solid #ccd8e0;border-radius:6px;font:inherit}button{border:0;border-radius:6px;padding:8px 10px;background:var(--blue-700);color:#fff;font-size:9px;font-weight:800;cursor:pointer}.inline-action{display:flex;justify-content:flex-end;margin-top:10px}.message{padding:9px;border:1px solid #dd8a8a;background:#fff3f3;color:#792f2f;font-size:9px}.empty,.empty-state{color:#758896}.empty-state{padding:24px;text-align:center}@media(max-width:900px){.hero,.workspace,.facts,.split,.command-grid,.grid{grid-template-columns:1fr}.register{position:static}}
</style>