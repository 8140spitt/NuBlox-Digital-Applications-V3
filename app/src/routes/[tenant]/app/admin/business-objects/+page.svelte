<script lang="ts">
  let { data, form } = $props();
  const basePath = `/${data.tenantSlug}/app/admin/business-objects`;
  let decision = $state('VALIDATE_OBJECT');

  $effect(() => {
    data.selected?.candidate_key;
    decision = data.selectedReview?.decision ?? 'VALIDATE_OBJECT';
  });

  const decisionLabels: Record<string, string> = {
    VALIDATE_OBJECT: 'Validate as business object',
    MERGE: 'Merge into another object',
    RENAME: 'Rename / distinguish semantics',
    RELATIONSHIP: 'Model as relationship',
    CHILD: 'Model as child / composition',
    EVENT_EVIDENCE: 'Model as event / evidence',
    PROJECTION: 'Model as projection / measure',
    REJECT: 'Reject candidate'
  };

  function queryHref(options: { object?: string; page?: number } = {}) {
    const params = new URLSearchParams();
    if (data.filters.q) params.set('q', data.filters.q);
    if (data.filters.family) params.set('family', data.filters.family);
    if (data.filters.kind) params.set('kind', data.filters.kind);
    if (data.filters.review) params.set('review', data.filters.review);
    if (options.page && options.page > 1) params.set('page', String(options.page));
    if (options.object) params.set('object', options.object);
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  function splitPipe(value: string) {
    return value.split('|').map((item) => item.trim()).filter(Boolean);
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString('en-GB');
  }
</script>

<svelte:head><title>Canonical Business Object Workbench · NuBlox</title></svelte:head>

<div class="object-page">
  <header class="hero section-card">
    <div>
      <span class="eyebrow">Architecture administration</span>
      <h1>Canonical Business Object Workbench</h1>
      <p>Discover, normalize and validate the shared business-object model that underpins all 29 tenant workspaces. Review decisions are persisted with an immutable decision history.</p>
    </div>
    <div class="authority-note">
      <strong>Model authority</strong>
      <span>Candidate register + review ledger</span>
      <small>Candidate → reviewed → validated → canonical → implemented → proven</small>
    </div>
  </header>

  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <section class="metrics" aria-label="Object model summary">
    <div class="metric section-card"><strong>{data.summary.candidateOccurrences}</strong><span>candidate occurrences</span></div>
    <div class="metric section-card"><strong>{data.summary.reviewed}</strong><span>reviewed candidates</span></div>
    <div class="metric section-card"><strong>{data.summary.unreviewed}</strong><span>awaiting review</span></div>
    <div class="metric section-card"><strong>{data.summary.duplicateGroups}</strong><span>duplicate-name groups</span></div>
  </section>

  <form class="filters section-card" method="GET">
    <label class="search"><span>Search objects</span><input name="q" value={data.filters.q} placeholder="Name, family, key or semantic kind" /></label>
    <label><span>Family</span><select name="family"><option value="">All 29 families</option>{#each data.families as family}<option value={family.id} selected={data.filters.family === family.id}>{family.id} · {family.name} ({family.count})</option>{/each}</select></label>
    <label><span>Semantic kind</span><select name="kind"><option value="">All kinds</option>{#each data.semanticKinds as kind}<option value={kind.name} selected={data.filters.kind === kind.name}>{kind.name} ({kind.count})</option>{/each}</select></label>
    <label><span>Review queue</span><select name="review"><option value="">All candidates</option><option value="unreviewed" selected={data.filters.review === 'unreviewed'}>Unreviewed</option><option value="reviewed" selected={data.filters.review === 'reviewed'}>Reviewed</option><option value="duplicates" selected={data.filters.review === 'duplicates'}>Duplicate-name review</option></select></label>
    <div class="filter-actions"><button type="submit">Apply</button><a href={basePath}>Clear</a></div>
  </form>

  <div class="workspace-grid">
    <section class="register section-card">
      <div class="panel-heading"><div><span class="eyebrow">Candidate register</span><h2>{data.resultCount} matching candidates</h2></div><span class="page-copy">Page {data.page} of {data.pageCount}</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Object</th><th>Family</th><th>Semantic kind</th><th>Review</th></tr></thead>
          <tbody>
            {#each data.rows as object}
              <tr class:active={data.selected?.candidate_key === object.candidate_key}>
                <td><a href={queryHref({ object: object.candidate_key, page: data.page })}><strong>{object.canonical_name}</strong><small>{object.candidate_key}</small></a></td>
                <td><span class="family-id">{object.family_id}</span><small>{object.family_name}</small></td>
                <td>{object.semantic_kind}</td>
                <td>{#if object.review}<span class="reviewed">{decisionLabels[object.review.decision]}</span>{:else}<span class="unreviewed">Open</span>{/if}</td>
              </tr>
            {:else}<tr><td colspan="4" class="empty">No candidates match these filters.</td></tr>{/each}
          </tbody>
        </table>
      </div>
      {#if data.pageCount > 1}
        <nav class="pagination" aria-label="Candidate register pages">
          <span>{#if data.page > 1}<a href={queryHref({ page: data.page - 1 })}>← Previous</a>{/if}</span>
          <span>{(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.resultCount)} of {data.resultCount}</span>
          <span>{#if data.page < data.pageCount}<a href={queryHref({ page: data.page + 1 })}>Next →</a>{/if}</span>
        </nav>
      {/if}
    </section>

    <aside class="inspector section-card">
      {#if data.selected}
        <div class="inspector-heading"><span class="eyebrow">Canonicalization workbench</span><h2>{data.selected.canonical_name}</h2><code>{data.selected.candidate_key}</code></div>
        <dl>
          <div><dt>Discovery family</dt><dd><strong>{data.selected.family_id}</strong> {data.selected.family_name}</dd></div>
          <div><dt>Provisional semantic kind</dt><dd>{data.selected.semantic_kind}</dd></div>
          <div><dt>Generated maturity</dt><dd><span class="candidate">{data.selected.maturity}</span></dd></div>
        </dl>

        {#if data.duplicate}
          <section class="review-alert"><strong>Duplicate-name review</strong><p>This name occurs {data.duplicate.occurrence_count} times.</p><div class="chips">{#each splitPipe(data.duplicate.families) as family}<span>{family}</span>{/each}</div></section>
        {/if}

        <form class="review-form" method="POST" action="?/review">
          <input type="hidden" name="candidateKey" value={data.selected.candidate_key} />
          <label><span>Architecture decision</span><select name="decision" bind:value={decision}>{#each data.reviewDecisions as value}<option value={value}>{decisionLabels[value]}</option>{/each}</select></label>

          {#if decision === 'MERGE'}
            <label><span>Merge target</span><input name="targetCandidateKey" list="merge-targets" value={data.selectedReview?.targetCandidateKey ?? ''} placeholder="Candidate key or choose a target" required /></label>
            <datalist id="merge-targets">{#each data.mergeTargets as target}<option value={target.key}>{target.name} · {target.family}</option>{/each}</datalist>
          {:else if decision === 'RENAME' || decision === 'VALIDATE_OBJECT'}
            <label><span>{decision === 'RENAME' ? 'Proposed canonical name' : 'Validated canonical name'}</span><input name="proposedCanonicalName" value={data.selectedReview?.proposedCanonicalName ?? data.selected.canonical_name} required={decision === 'RENAME'} /></label>
          {/if}

          <label><span>Rationale / modelling notes</span><textarea name="notes" rows="4" placeholder="Why is this the correct semantic treatment?">{data.selectedReview?.notes ?? ''}</textarea></label>
          <button type="submit">Save review decision</button>
        </form>

        {#if data.selectedReview}
          <section class="current-review">
            <div class="panel-heading"><div><span class="eyebrow">Current decision</span><h3>{decisionLabels[data.selectedReview.decision]}</h3></div><span class="reviewed">Reviewed</span></div>
            {#if data.selectedReview.proposedCanonicalName}<p><strong>Canonical name:</strong> {data.selectedReview.proposedCanonicalName}</p>{/if}
            {#if data.selectedReview.targetCandidateKey}<p><strong>Merge target:</strong> {data.selectedReview.targetCandidateKey}</p>{/if}
            <small>{data.selectedReview.reviewedBy} · {formatDate(data.selectedReview.reviewedAt)}</small>
          </section>
        {/if}

        <section class="history">
          <h3>Decision history</h3>
          <ol>{#each data.reviewEvents as event}<li><strong>{decisionLabels[event.decision]}</strong><span>{event.actor} · {formatDate(event.occurredAt)}</span>{#if event.notes}<p>{event.notes}</p>{/if}</li>{:else}<li class="empty-history">No review decisions recorded yet.</li>{/each}</ol>
        </section>
      {:else}<div class="empty-inspector">Choose a candidate from the register.</div>{/if}
    </aside>
  </div>
</div>

<style>
  .object-page{display:grid;gap:12px}.hero{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:28px;align-items:center;padding:20px;border-color:#8fc9ee;background:linear-gradient(120deg,#fbfdff,#eaf6fd 62%,#fafdff)}.eyebrow{color:var(--blue-700);font-size:10px;font-weight:850;letter-spacing:.07em;text-transform:uppercase}h1{margin:4px 0 7px;font-size:26px}h2{margin:2px 0 0;font-size:16px}h3{margin:0;font-size:13px}.hero p{margin:0;max-width:820px;color:#476176;font-size:12px;line-height:1.55}.authority-note{display:grid;gap:3px;padding:12px 14px;border:1px solid #9ccfeb;border-radius:10px;background:#ffffffc7}.authority-note strong{color:#264a65;font-size:10px;text-transform:uppercase}.authority-note span{font-size:14px;font-weight:800}.authority-note small{color:#6e8292;font-size:9.5px}.message{padding:9px 12px;border:1px solid #dd8a8a;border-radius:8px;background:#fff3f3;color:#792f2f;font-size:11px}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.metric{display:grid;gap:2px;padding:13px 15px}.metric strong{color:var(--navy-800);font-size:22px}.metric span{color:#6e8090;font-size:10px}.filters{display:grid;grid-template-columns:minmax(220px,1.2fr) minmax(190px,1fr) minmax(170px,.8fr) minmax(160px,.7fr) auto;gap:10px;align-items:end;padding:12px}.filters label,.review-form label{display:grid;gap:5px;color:#4a6173;font-size:10px;font-weight:750}.filters input,.filters select,.review-form input,.review-form select,.review-form textarea{width:100%;border:1px solid #cfdbe3;border-radius:7px;padding:8px 9px;background:white;color:var(--ink);font-size:11px}.filter-actions{display:flex;gap:7px}.filter-actions a,button{border:0;border-radius:7px;padding:8px 11px;font-size:10.5px;font-weight:800;text-decoration:none}.filter-actions a{border:1px solid #d5e0e7;color:#496175;background:white}button{background:var(--blue-700);color:white;cursor:pointer}.workspace-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(340px,.8fr);gap:12px;align-items:start}.register,.inspector{padding:14px}.panel-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px}.page-copy{color:#728492;font-size:10px}.table-wrap{overflow-x:auto;border:1px solid #e2e8ed;border-radius:8px}table{width:100%;border-collapse:collapse;font-size:10.5px}th,td{padding:8px 9px;border-bottom:1px solid #e7ecef;text-align:left;vertical-align:top}th{background:#f5f8fa;color:#617486;font-size:9px;text-transform:uppercase}tbody tr:hover,tbody tr.active{background:#f0f8fd}td a{display:grid;gap:2px;color:inherit;text-decoration:none}td small{display:block;color:#778a99;font-size:9px}.family-id{display:block;color:#315a76;font-weight:850}.reviewed,.unreviewed,.candidate{display:inline-block;padding:3px 6px;border-radius:999px;font-size:8.5px;font-weight:850;text-transform:uppercase}.reviewed{background:#e4f5e7;color:#246b33}.unreviewed,.candidate{background:#fff2d8;color:#805d19}.pagination{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;margin-top:10px;font-size:10px;color:#6b7f90}.pagination span:last-child{text-align:right}.pagination a{color:var(--blue-700);font-weight:750;text-decoration:none}.inspector{position:sticky;top:78px;display:grid;gap:14px}.inspector-heading{display:grid;gap:3px;padding-bottom:12px;border-bottom:1px solid var(--line)}.inspector-heading h2{font-size:20px}.inspector-heading code{width:max-content;padding:3px 6px;border-radius:5px;background:#f0f4f7;color:#526d80;font-size:9.5px}dl{display:grid;gap:8px;margin:0}dl div{display:grid;gap:2px}dt{color:#738695;font-size:9px;text-transform:uppercase}dd{margin:0;color:#405a6e;font-size:10.5px}.review-alert{padding:10px;border:1px solid #edcf83;border-radius:8px;background:#fff9e8}.review-alert strong{font-size:11px}.review-alert p{margin:4px 0;font-size:10px}.chips{display:flex;gap:5px;flex-wrap:wrap}.chips span{padding:3px 5px;border-radius:5px;background:white;border:1px solid #ead79c;font-size:9px}.review-form{display:grid;gap:9px;padding:11px;border:1px solid #dce5eb;border-radius:9px;background:#fafcfd}.current-review{padding:10px;border:1px solid #cfe4d3;border-radius:8px;background:#f5fbf6}.current-review p{margin:5px 0;font-size:10px}.current-review small{color:#718276;font-size:9px}.history{padding-top:4px}.history ol{list-style:none;display:grid;gap:6px;margin:8px 0 0;padding:0}.history li{display:grid;gap:2px;padding:7px;border:1px solid #e5eaee;border-radius:7px}.history li strong{font-size:10px}.history li span{color:#778a99;font-size:9px}.history li p{margin:3px 0 0;color:#52697a;font-size:9.5px}.empty,.empty-inspector,.empty-history{color:#758796;text-align:center;padding:24px 10px}.empty-history{padding:10px!important}
  @media(max-width:1100px){.workspace-grid{grid-template-columns:1fr}.inspector{position:static}.filters{grid-template-columns:1fr 1fr 1fr}.filter-actions{grid-column:1/-1}.hero{grid-template-columns:1fr}.metrics{grid-template-columns:repeat(2,1fr)}}@media(max-width:700px){.filters,.metrics{grid-template-columns:1fr}.workspace-grid{display:block}.inspector{margin-top:12px}}
</style>
