<script lang="ts">
	let { data } = $props();

	const basePath = `/${data.tenantSlug}/app/admin/business-objects`;

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
</script>

<svelte:head>
	<title>Canonical Business Objects · NuBlox</title>
</svelte:head>

<div class="object-page">
	<header class="hero section-card">
		<div>
			<span class="eyebrow">Architecture administration</span>
			<h1>Canonical Business Object Explorer</h1>
			<p>
				Review the candidate object universe that underpins all 29 tenant workspaces. This is a
				discovery and normalization surface, not a physical database-schema editor.
			</p>
		</div>
		<div class="authority-note">
			<strong>Current authority</strong>
			<span>Candidate register</span>
			<small>Candidate → Validated → Canonical → Implemented → Proven</small>
		</div>
	</header>

	<section class="metrics" aria-label="Object model summary">
		<div class="metric section-card"><strong>{data.summary.candidateOccurrences}</strong><span>candidate occurrences</span></div>
		<div class="metric section-card"><strong>{data.summary.uniqueNames}</strong><span>exact unique names</span></div>
		<div class="metric section-card"><strong>{data.summary.duplicateGroups}</strong><span>duplicate-name groups</span></div>
		<div class="metric section-card"><strong>{data.summary.familyCount}</strong><span>discovery families</span></div>
	</section>

	<form class="filters section-card" method="GET">
		<label class="search">
			<span>Search objects</span>
			<input name="q" value={data.filters.q} placeholder="Name, family, key or semantic kind" />
		</label>
		<label>
			<span>Family</span>
			<select name="family">
				<option value="" selected={!data.filters.family}>All 29 families</option>
				{#each data.families as family}
					<option value={family.id} selected={data.filters.family === family.id}>
						{family.id} · {family.name} ({family.count})
					</option>
				{/each}
			</select>
		</label>
		<label>
			<span>Semantic kind</span>
			<select name="kind">
				<option value="" selected={!data.filters.kind}>All kinds</option>
				{#each data.semanticKinds as kind}
					<option value={kind.name} selected={data.filters.kind === kind.name}>
						{kind.name} ({kind.count})
					</option>
				{/each}
			</select>
		</label>
		<label class="check">
			<input type="checkbox" name="review" value="duplicates" checked={data.filters.review === 'duplicates'} />
			<span>Duplicate review only</span>
		</label>
		<div class="filter-actions">
			<button type="submit">Apply filters</button>
			<a href={basePath}>Clear</a>
		</div>
	</form>

	<div class="workspace-grid">
		<section class="register section-card">
			<div class="panel-heading">
				<div>
					<span class="eyebrow">Candidate register</span>
					<h2>{data.resultCount} matching objects</h2>
				</div>
				<span class="page-copy">Page {data.page} of {data.pageCount}</span>
			</div>

			<div class="table-wrap">
				<table>
					<thead>
						<tr><th>Object</th><th>Family</th><th>Semantic kind</th><th>Maturity</th></tr>
					</thead>
					<tbody>
						{#each data.rows as object}
							<tr class:active={data.selected?.candidate_key === object.candidate_key}>
								<td>
									<a href={queryHref({ object: object.candidate_key, page: data.page })}>
										<strong>{object.canonical_name}</strong><small>{object.candidate_key}</small>
									</a>
								</td>
								<td><span class="family-id">{object.family_id}</span><small>{object.family_name}</small></td>
								<td><span class="kind">{object.semantic_kind}</span></td>
								<td><span class="maturity">{object.maturity}</span></td>
							</tr>
						{:else}
							<tr><td colspan="4" class="empty">No candidate objects match these filters.</td></tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if data.pageCount > 1}
				<nav class="pagination" aria-label="Candidate register pages">
					{#if data.page > 1}<a href={queryHref({ page: data.page - 1 })}>← Previous</a>{/if}
					<span>{(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.resultCount)} of {data.resultCount}</span>
					{#if data.page < data.pageCount}<a href={queryHref({ page: data.page + 1 })}>Next →</a>{/if}
				</nav>
			{/if}
		</section>

		<aside class="inspector section-card">
			{#if data.selected}
				<div class="inspector-heading">
					<span class="eyebrow">Object inspector</span>
					<h2>{data.selected.canonical_name}</h2>
					<code>{data.selected.candidate_key}</code>
				</div>

				<dl>
					<div><dt>Discovery family</dt><dd><strong>{data.selected.family_id}</strong> {data.selected.family_name}</dd></div>
					<div><dt>Provisional kind</dt><dd>{data.selected.semantic_kind}</dd></div>
					<div><dt>Maturity</dt><dd><span class="maturity">{data.selected.maturity}</span></dd></div>
					<div><dt>Source</dt><dd>{data.selected.source}</dd></div>
				</dl>

				{#if data.duplicate}
					<section class="review-alert">
						<strong>Normalization review required</strong>
						<p>This exact name occurs {data.duplicate.occurrence_count} times across the discovery model.</p>
						<div class="chips">
							{#each splitPipe(data.duplicate.families) as family}<span>{family}</span>{/each}
						</div>
						<small>{data.duplicate.review_action}</small>
					</section>
				{/if}

				<section class="questions">
					<h3>Canonicalization questions</h3>
					<ol>
						<li>Is this a stable business identity, a child, relationship, event, state, version or projection?</li>
						<li>What is its authoritative owning context and business owner?</li>
						<li>Does it require lifecycle, revision/iteration or effectivity semantics?</li>
						<li>Which F01–F29 workspaces create, govern or consume it?</li>
						<li>What permissions, evidence, retention and financial/commercial consequences apply?</li>
					</ol>
				</section>
			{:else}
				<div class="empty-inspector"><strong>No object selected</strong><span>Choose a candidate from the register.</span></div>
			{/if}
		</aside>
	</div>
</div>

<style>
	.object-page { display: grid; gap: 12px; }
	.hero { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 28px; align-items: center; padding: 20px; border-color: #8fc9ee; background: linear-gradient(120deg, #fbfdff, #eaf6fd 62%, #fafdff); }
	.eyebrow { color: var(--blue-700); font-size: 10px; font-weight: 850; letter-spacing: .07em; text-transform: uppercase; }
	h1 { margin: 4px 0 7px; font-size: 26px; letter-spacing: -.025em; }
	h2 { margin: 2px 0 0; font-size: 16px; }
	h3 { margin: 0; font-size: 13px; }
	.hero p { margin: 0; max-width: 820px; color: #476176; font-size: 12px; line-height: 1.55; }
	.authority-note { display: grid; gap: 3px; padding: 12px 14px; border: 1px solid #9ccfeb; border-radius: 10px; background: rgba(255,255,255,.78); }
	.authority-note strong { color: #264a65; font-size: 10px; text-transform: uppercase; letter-spacing: .06em; }
	.authority-note span { font-size: 14px; font-weight: 800; }
	.authority-note small { color: #6e8292; font-size: 9.5px; line-height: 1.35; }
	.metrics { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 10px; }
	.metric { display: grid; gap: 2px; padding: 13px 15px; box-shadow: none; }
	.metric strong { color: var(--navy-800); font-size: 22px; line-height: 1; }
	.metric span { color: #6e8090; font-size: 10px; }
	.filters { display: grid; grid-template-columns: minmax(220px,1.25fr) minmax(210px,1fr) minmax(180px,.8fr) auto auto; gap: 10px; align-items: end; padding: 12px; box-shadow: none; }
	.filters label { display: grid; gap: 5px; color: #4a6173; font-size: 10px; font-weight: 750; }
	.filters input[type='text'], .filters input:not([type]), .filters select { width: 100%; min-height: 35px; padding: 7px 9px; border: 1px solid #cfdbe3; border-radius: 7px; background: white; color: var(--ink); font-size: 11px; }
	.check { display: flex !important; grid-auto-flow: column; align-items: center; gap: 7px !important; min-height: 35px; padding: 0 4px; white-space: nowrap; }
	.check input { width: 15px; height: 15px; margin: 0; }
	.filter-actions { display: flex; gap: 7px; align-items: center; min-height: 35px; }
	button, .filter-actions a { border: 0; border-radius: 7px; padding: 8px 11px; font-size: 10.5px; font-weight: 800; text-decoration: none; cursor: pointer; }
	button { background: var(--blue-700); color: white; }
	.filter-actions a { border: 1px solid #d5e0e7; color: #496175; background: white; }
	.workspace-grid { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(300px, .72fr); gap: 12px; align-items: start; }
	.register, .inspector { padding: 14px; }
	.panel-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 10px; }
	.page-copy { color: #728492; font-size: 10px; }
	.table-wrap { overflow-x: auto; border: 1px solid #e2e8ed; border-radius: 8px; }
	table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
	th, td { padding: 8px 9px; border-bottom: 1px solid #e7ecef; text-align: left; vertical-align: top; }
	th { position: sticky; top: 0; background: #f5f8fa; color: #617486; font-size: 9px; text-transform: uppercase; letter-spacing: .05em; z-index: 1; }
	tbody tr:last-child td { border-bottom: 0; }
	tbody tr:hover, tbody tr.active { background: #f0f8fd; }
	td a { display: grid; gap: 2px; color: inherit; text-decoration: none; }
	td strong { font-size: 11px; }
	td small { display: block; margin-top: 2px; color: #778a99; font-size: 9px; line-height: 1.35; }
	.family-id { display: block; color: #315a76; font-weight: 850; font-size: 9.5px; }
	.kind { color: #435e73; }
	.maturity { display: inline-block; padding: 3px 6px; border-radius: 999px; background: #fff2d8; color: #805d19; font-size: 8.5px; font-weight: 850; text-transform: uppercase; letter-spacing: .04em; }
	.empty { padding: 30px 12px; color: #758796; text-align: center; }
	.pagination { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px; margin-top: 10px; color: #6b7f90; font-size: 10px; }
	.pagination a { color: var(--blue-700); font-weight: 750; text-decoration: none; }
	.pagination a:last-child { justify-self: end; }
	.inspector { position: sticky; top: 78px; display: grid; gap: 14px; }
	.inspector-heading { display: grid; gap: 3px; padding-bottom: 12px; border-bottom: 1px solid var(--line); }
	.inspector-heading h2 { font-size: 20px; letter-spacing: -.02em; }
	.inspector-heading code { width: max-content; padding: 3px 6px; border-radius: 5px; background: #f0f4f7; color: #526d80; font-size: 9.5px; }
	dl { display: grid; gap: 9px; margin: 0; }
	dl div { display: grid; gap: 2px; }
	dt { color: #718392; font-size: 8.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
	dd { margin: 0; color: #344f63; font-size: 10.5px; line-height: 1.4; }
	dd strong { margin-right: 4px; }
	.review-alert { display: grid; gap: 7px; padding: 11px; border: 1px solid #e2b666; border-radius: 9px; background: #fff8e9; }
	.review-alert strong { color: #765315; font-size: 11px; }
	.review-alert p, .review-alert small { margin: 0; color: #7b673e; font-size: 9.5px; line-height: 1.4; }
	.chips { display: flex; flex-wrap: wrap; gap: 5px; }
	.chips span { padding: 3px 6px; border-radius: 999px; background: white; color: #73591f; font-size: 9px; font-weight: 800; }
	.questions { display: grid; gap: 8px; padding-top: 2px; }
	.questions ol { display: grid; gap: 7px; margin: 0; padding-left: 18px; color: #546b7d; font-size: 10px; line-height: 1.4; }
	.empty-inspector { display: grid; gap: 4px; min-height: 180px; place-content: center; color: #718391; text-align: center; font-size: 10px; }
	.empty-inspector strong { color: #455f73; font-size: 13px; }
	@media (max-width: 1180px) { .filters { grid-template-columns: 1fr 1fr 1fr; } .check, .filter-actions { align-self: end; } .workspace-grid { grid-template-columns: 1fr; } .inspector { position: static; } }
	@media (max-width: 760px) { .hero { grid-template-columns: 1fr; gap: 12px; } .metrics { grid-template-columns: 1fr 1fr; } .filters { grid-template-columns: 1fr; } .check { justify-content: start; } .filter-actions { justify-content: flex-start; } th:nth-child(3), td:nth-child(3), th:nth-child(4), td:nth-child(4) { display: none; } }
</style>
