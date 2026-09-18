<script lang="ts">
  import {
    qhseAssuranceModel,
    qhseAssuranceRelationships,
    qhseAssuranceRules
  } from '$lib/data/qhse-assurance-model';
  let { data } = $props();
  const names = new Map(qhseAssuranceModel.map((x) => [x.modelId, x.canonicalName]));
</script>

<svelte:head><title>QHSE & Assurance Semantics · NuBlox</title></svelte:head>
<div class="page">
  <header class="hero card">
    <div>
      <span class="eyebrow">Canonical assurance model</span>
      <h1>Quality, Health, Safety, Environment & Assurance</h1>
      <p>
        Shared plans, verification, nonconformance, safe-work controls, incidents, compliance and
        environmental evidence without duplicating project, worker, asset or information identities.
      </p>
    </div>
    <div class="actions">
      <a href={`/${data.tenantSlug}/app/admin/business-objects`}>← Canonicalization workbench</a><a
        href={`/${data.tenantSlug}/app/admin/business-objects/coverage-audit`}>Coverage audit</a
      ><strong>{qhseAssuranceModel.length} governed constructs</strong><span
        >{qhseAssuranceRelationships.length} relationships</span
      >
    </div>
  </header>

  <section class="card chain">
    <div><span>Plan</span><strong>Quality Plan → ITP → Verification Point</strong></div>
    <div><span>Verify</span><strong>Inspection / Test / Calibration / Certificate</strong></div>
    <div><span>Resolve</span><strong>NCR / Defect → CAPA → Verification</strong></div>
    <div><span>Control work</span><strong>Risk → RAMS → Permit → Isolation</strong></div>
    <div><span>Learn</span><strong>Observation → Incident → Investigation → Cause</strong></div>
  </section>

  <section class="card content">
    <div class="heading">
      <div>
        <span class="eyebrow">Semantic contracts</span>
        <h2>Governed QHSE constructs</h2>
      </div>
      <p>
        Definitions, execution, evidence, cases and projections have independent identities and
        lifecycles.
      </p>
    </div>
    <div class="grid">
      {#each qhseAssuranceModel as item, i}
        <details open={i < 4}>
          <summary
            ><span><code>{item.modelId}</code><strong>{item.canonicalName}</strong></span><small
              >{item.kind}</small
            ></summary
          >
          <div class="body">
            <p>{item.definition}</p>
            <dl>
              <div>
                <dt>Candidate</dt>
                <dd>{item.candidateKeys.join(', ')}</dd>
              </div>
              <div>
                <dt>Identity</dt>
                <dd>{item.identityRule}</dd>
              </div>
              <div>
                <dt>Lifecycle</dt>
                <dd>{item.lifecycle.join(' · ')}</dd>
              </div>
              <div>
                <dt>Governance</dt>
                <dd>
                  <ul>
                    {#each item.governance as x}<li>{x}</li>{/each}
                  </ul>
                </dd>
              </div>
            </dl>
          </div>
        </details>
      {/each}
    </div>
  </section>

  <section class="card content">
    <div class="heading">
      <div>
        <span class="eyebrow">Relationship graph</span>
        <h2>Assurance flow</h2>
      </div>
    </div>
    <div class="table">
      <table>
        <thead
          ><tr><th>ID</th><th>From</th><th>Relationship</th><th>To</th><th>Governance</th></tr
          ></thead
        ><tbody>
          {#each qhseAssuranceRelationships as r}<tr
              ><td><code>{r.id}</code></td><td>{names.get(r.from)}</td><td>{r.predicate}</td><td
                >{names.get(r.to)}</td
              ><td>{r.governance}</td></tr
            >{/each}
        </tbody>
      </table>
    </div>
  </section>

  <section class="card content rules">
    <span class="eyebrow">Non-negotiable rules</span>
    <h2>What NuBlox must preserve</h2>
    <ol>
      {#each qhseAssuranceRules as x}<li>{x}</li>{/each}
    </ol>
  </section>
</div>

<style>
  .page {
    display: grid;
    gap: 12px;
  }
  .card {
    border: 1px solid var(--line);
    border-radius: 10px;
    background: #fff;
  }
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 20px;
    padding: 20px;
  }
  .eyebrow {
    font-size: 10px;
    font-weight: 850;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--blue-700);
  }
  h1 {
    margin: 5px 0 7px;
    font-size: 27px;
  }
  h2 {
    margin: 3px 0;
    font-size: 16px;
  }
  p {
    color: #50697c;
    font-size: 11px;
    line-height: 1.55;
  }
  .actions {
    display: grid;
    gap: 5px;
    padding: 12px;
    border: 1px solid #d9e3ea;
    border-radius: 8px;
  }
  .actions a {
    font-size: 10px;
    font-weight: 800;
    text-decoration: none;
    color: var(--blue-700);
  }
  .actions strong {
    margin-top: 5px;
  }
  .actions span {
    font-size: 10px;
    color: #718493;
  }
  .chain {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    overflow: hidden;
  }
  .chain div {
    padding: 12px;
    border-right: 1px solid var(--line);
  }
  .chain div:last-child {
    border-right: 0;
  }
  .chain span {
    display: block;
    font-size: 9px;
    text-transform: uppercase;
    color: #718493;
  }
  .chain strong {
    display: block;
    margin-top: 4px;
    font-size: 10.5px;
    line-height: 1.4;
  }
  .content {
    padding: 15px;
  }
  .heading {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 20px;
    margin-bottom: 12px;
  }
  .heading p {
    max-width: 520px;
    text-align: right;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
  }
  details {
    border: 1px solid #dbe5eb;
    border-radius: 8px;
    overflow: hidden;
    background: #fbfcfd;
  }
  summary {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 10px;
    background: #fff;
    cursor: pointer;
  }
  summary span {
    display: flex;
    gap: 7px;
    align-items: center;
  }
  summary strong {
    font-size: 12px;
  }
  summary small {
    font-size: 9px;
    color: #708393;
  }
  code {
    font-size: 9px;
    background: #eef3f6;
    padding: 2px 5px;
    border-radius: 4px;
  }
  .body {
    padding: 10px;
    border-top: 1px solid #e4ebef;
  }
  .body p {
    margin-top: 0;
  }
  dl {
    display: grid;
    gap: 7px;
    margin: 0;
  }
  dl > div {
    display: grid;
    grid-template-columns: 90px 1fr;
    gap: 10px;
  }
  dt {
    font-size: 8.5px;
    font-weight: 800;
    text-transform: uppercase;
    color: #718493;
  }
  dd {
    margin: 0;
    font-size: 10px;
    color: #40596c;
    line-height: 1.45;
  }
  dd ul {
    margin: 0;
    padding-left: 15px;
  }
  .table {
    overflow: auto;
    border: 1px solid #e1e8ed;
    border-radius: 8px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 900px;
    font-size: 9.5px;
  }
  th,
  td {
    padding: 8px;
    border-bottom: 1px solid #e6ecef;
    text-align: left;
    vertical-align: top;
  }
  th {
    background: #f5f8fa;
    font-size: 8.5px;
    text-transform: uppercase;
    color: #617485;
  }
  .rules ol {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 7px 24px;
    padding-left: 22px;
  }
  .rules li {
    font-size: 10.5px;
    color: #415b6e;
    line-height: 1.45;
  }
  @media (max-width: 1050px) {
    .hero {
      grid-template-columns: 1fr;
    }
    .chain {
      grid-template-columns: repeat(2, 1fr);
    }
    .grid {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 700px) {
    .chain {
      grid-template-columns: 1fr;
    }
    .heading {
      display: grid;
    }
    .heading p {
      text-align: left;
    }
    .rules ol {
      grid-template-columns: 1fr;
    }
    dl > div {
      grid-template-columns: 1fr;
    }
  }
</style>
