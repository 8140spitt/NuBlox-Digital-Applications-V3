<script lang="ts">
  import { aliasConvergenceSummary } from '$lib/data/canonical-alias-convergence-audit';
  import {
    coverageAuditSummary,
    convergenceGapFamilies,
    endToEndChains,
    familyCoverageAudit,
    sectorLifecycle,
    specialistOverlays
  } from '$lib/data/canonical-coverage-audit';

  let { data } = $props();

  const statusLabel = (state: string) => state === 'governed-semantic-model'
    ? 'Governed'
    : state === 'partial-semantic-model' ? 'Partial' : 'Candidate only';
</script>

<svelte:head><title>Canonical Coverage Audit · NuBlox</title></svelte:head>

<div class="page">
  <header class="hero section-card">
    <div>
      <span class="eyebrow">Convergence & coverage</span>
      <h1>Canonical Model Coverage Audit</h1>
      <p>Machine-checkable proof that the 750-object discovery universe has governed baseline decisions across all 29 families, while keeping the remaining benchmark, alias-convergence and physical-design gates explicit.</p>
    </div>
    <div class="hero-actions">
      <a href={`/${data.tenantSlug}/app/admin/business-objects`}>← Canonicalization workbench</a>
      <strong>{coverageAuditSummary.baselineDecisionCoveragePct}% decision coverage</strong>
      <span>{coverageAuditSummary.baselineDecisionCount} / {coverageAuditSummary.candidateOccurrences} candidate occurrences</span>
      <span>External benchmark: {coverageAuditSummary.externalBenchmark.state}</span>
    </div>
  </header>

  <section class="metrics">
    <article class="section-card"><span>Candidate universe</span><strong>{coverageAuditSummary.candidateOccurrences}</strong><small>{coverageAuditSummary.uniqueCandidateNames} unique names</small></article>
    <article class="section-card"><span>Governed families</span><strong>{coverageAuditSummary.governedFamilyCount}</strong><small>{coverageAuditSummary.partialFamilyCount} partial · {coverageAuditSummary.candidateOnlyFamilyCount} candidate-only</small></article>
    <article class="section-card"><span>Tenant workspaces</span><strong>{coverageAuditSummary.coveredWorkspaceCount}/{coverageAuditSummary.workspaceCount}</strong><small>coverage lens represented</small></article>
    <article class="section-card"><span>Lifecycle stages</span><strong>{coverageAuditSummary.coveredLifecycleStageCount}/{coverageAuditSummary.lifecycleStageCount}</strong><small>whole-life chain represented</small></article>
    <article class="section-card"><span>E2E chains</span><strong>{coverageAuditSummary.coveredProcessChainCount}/{coverageAuditSummary.processChainCount}</strong><small>process-chain lens represented</small></article>
    <article class="section-card"><span>Specialist overlays</span><strong>{coverageAuditSummary.coveredSpecialistOverlayCount}/{coverageAuditSummary.specialistOverlayCount}</strong><small>sector overlays represented</small></article>
    <article class="section-card"><span>Alias convergence</span><strong>{aliasConvergenceSummary.exactDuplicateGroupsResolved}/{aliasConvergenceSummary.exactDuplicateGroups}</strong><small>exact groups · {aliasConvergenceSummary.nearAliasChallengesResolved}/{aliasConvergenceSummary.nearAliasChallenges} near-alias challenges</small></article>
  </section>

  <section class="section-card lenses">
    <div class="section-heading">
      <div><span class="eyebrow">Five-lens method</span><h2>Coverage dimensions</h2></div>
      <p>A family is not considered complete because one screen or one workflow exists. The audit checks the canonical model against independent operating-model lenses.</p>
    </div>
    <div class="lens-grid">
      <article><strong>1 · Sector lifecycle</strong><p>{sectorLifecycle.join(' → ')}</p></article>
      <article><strong>2 · 29 workspaces</strong><p>Every function is represented in the family-to-workspace usage map; later L2/L3 object-action mapping remains required.</p></article>
      <article><strong>3 · Specialist overlays</strong><p>{specialistOverlays.join(' · ')}</p></article>
      <article><strong>4 · End-to-end chains</strong><p>{endToEndChains.join(' · ')}</p></article>
      <article><strong>5 · External benchmark</strong><p>{coverageAuditSummary.externalBenchmark.name}: {coverageAuditSummary.externalBenchmark.requiredDomains} required study domains; status remains {coverageAuditSummary.externalBenchmark.state}.</p></article>
    </div>
  </section>

  <section class="section-card family-matrix">
    <div class="section-heading">
      <div><span class="eyebrow">29 discovery families</span><h2>Convergence matrix</h2></div>
      <p>Decision coverage is calculated from the generated 750-candidate register and the actual version-controlled canonicalization baselines.</p>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Family</th><th>Model state</th><th>Candidates</th><th>Decided</th><th>Coverage</th><th>Workspace use</th><th>Lifecycle</th><th>E2E chains</th></tr></thead>
        <tbody>
          {#each familyCoverageAudit as family}
            <tr>
              <td><code>{family.id}</code><strong>{family.name}</strong><small>{family.note}</small></td>
              <td><span class:governed={family.semanticModelState === 'governed-semantic-model'} class:partial={family.semanticModelState === 'partial-semantic-model'} class:candidate={family.semanticModelState === 'candidate-only'} class="state">{statusLabel(family.semanticModelState)}</span></td>
              <td>{family.candidateCount}</td>
              <td>{family.decidedCandidateCount}<small>{family.undecidedCandidateCount} open</small></td>
              <td><strong>{family.decisionCoveragePct}%</strong></td>
              <td class="chips">{#each family.workspaces as value}<span>{value}</span>{/each}</td>
              <td class="compact">{family.lifecycleStages.join(' · ')}</td>
              <td class="compact">{family.processChains.length ? family.processChains.join(' · ') : 'No direct chain assigned'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <section class="section-card gaps">
    <div class="section-heading">
      <div><span class="eyebrow">Convergence queue</span><h2>What remains before physical schema authority</h2></div>
      <p>The audit intentionally exposes gaps. “Candidate only” means discovery exists but family-level canonical semantics are not yet governed.</p>
    </div>
    {#if convergenceGapFamilies.length}
      <div class="gap-grid">
        {#each convergenceGapFamilies as family}
          <article>
            <div><code>{family.id}</code><span class:partial={family.semanticModelState === 'partial-semantic-model'} class:candidate={family.semanticModelState === 'candidate-only'} class="state">{statusLabel(family.semanticModelState)}</span></div>
            <strong>{family.name}</strong>
            <p>{family.note}</p>
            <small>{family.undecidedCandidateCount} candidate decisions open · {family.decisionCoveragePct}% baseline decision coverage</small>
          </article>
        {/each}
      </div>
    {:else}
      <div class="gap-grid">
        <article>
          <div><code>750/750</code><span class="state governed">Candidate closure</span></div>
          <strong>Candidate convergence complete</strong>
          <p>All 29 families are governed and every discovery candidate has a version-controlled baseline decision.</p>
          <small>Duplicate/alias convergence is closed. Next gates: external benchmark/standards challenge → aggregate-boundary freeze.</small>
        </article>
      </div>
    {/if}
  </section>

  <section class="section-card gate">
    <span class="eyebrow">Architecture gate</span>
    <h2>What this audit permits—and does not permit</h2>
    <p>All 750 candidates have governed baseline decisions, all 29 family semantic models are governed, and all 26 exact duplicate groups plus the documented near-alias challenges are converged. This is necessary but <strong>does not yet approve</strong> physical database/API design: the external benchmark/standards challenge, L2/L3 object-action mapping and canonical aggregate-boundary freeze remain explicit gates.</p>
  </section>
</div>

<style>
  .page{display:grid;gap:12px}.section-card{border:1px solid var(--line);border-radius:10px;background:white}.hero{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px;align-items:center;padding:20px;background:linear-gradient(120deg,#fbfdff,#eef7f2 65%,#fff)}.eyebrow{color:var(--blue-700);font-size:10px;font-weight:850;letter-spacing:.07em;text-transform:uppercase}h1{margin:5px 0 7px;font-size:27px}h2{margin:3px 0 5px;font-size:16px}.hero p,.section-heading p,.lens-grid p,.gap-grid p,.gate p{margin:0;color:#50697c;font-size:11px;line-height:1.55}.hero-actions{display:grid;gap:5px;padding:12px;border:1px solid #bddbc9;border-radius:8px;background:#fff}.hero-actions a{color:var(--blue-700);font-size:10px;font-weight:800;text-decoration:none}.hero-actions strong{margin-top:4px;font-size:15px}.hero-actions span{color:#6c8192;font-size:10px}.metrics{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}.metrics article{display:grid;gap:3px;padding:12px}.metrics span,.metrics small{color:#728493;font-size:9px}.metrics strong{font-size:19px;color:#263f51}.lenses,.family-matrix,.gaps,.gate{padding:15px}.section-heading{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:12px}.section-heading p{max-width:610px;text-align:right}.lens-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));border:1px solid #e1e8ed;border-radius:8px;overflow:hidden}.lens-grid article{padding:12px;border-right:1px solid #e1e8ed}.lens-grid article:last-child{border-right:0}.lens-grid strong{font-size:10.5px}.table-wrap{overflow:auto;border:1px solid #e1e8ed;border-radius:8px}table{width:100%;border-collapse:collapse;min-width:1500px;font-size:9.5px}th,td{padding:8px;border-bottom:1px solid #e6ecef;text-align:left;vertical-align:top}th{background:#f5f8fa;color:#617485;font-size:8.5px;text-transform:uppercase}td:first-child{min-width:275px}td strong,td small{display:block}td small{margin-top:3px;color:#7d8d99;font-size:8.5px;line-height:1.4}code{display:inline-block;margin-right:5px;padding:2px 5px;border-radius:4px;background:#eef3f6;color:#4a6679;font-size:9px}.state{display:inline-block;padding:3px 6px;border-radius:999px;font-size:8.5px;font-weight:800;white-space:nowrap}.state.governed{background:#e8f5ed;color:#28613e}.state.partial{background:#fff5dd;color:#845d12}.state.candidate{background:#f3eef0;color:#7a4653}.chips{min-width:170px}.chips span{display:inline-block;margin:0 3px 3px 0;padding:2px 5px;border-radius:999px;background:#eef6fb;color:#285a79;font-size:8px;font-weight:750}.compact{max-width:300px;color:#53697a;line-height:1.45}.gap-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.gap-grid article{padding:11px;border:1px solid #e1e8ed;border-radius:8px;background:#fbfcfd}.gap-grid article>div{display:flex;justify-content:space-between;align-items:center}.gap-grid strong{display:block;margin:7px 0 4px;font-size:11px}.gap-grid small{display:block;margin-top:8px;color:#7c8c98;font-size:9px}.gate{background:#fbfcfd}@media(max-width:1200px){.metrics{grid-template-columns:repeat(3,1fr)}.lens-grid{grid-template-columns:1fr}.lens-grid article{border-right:0;border-bottom:1px solid #e1e8ed}.gap-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:760px){.hero{grid-template-columns:1fr;padding:14px}.metrics,.gap-grid{grid-template-columns:1fr}.section-heading{display:grid}.section-heading p{text-align:left}}
</style>
