<script lang="ts">
  import {
    itemManufacturingBoundaries,
    itemManufacturingModel,
    itemManufacturingRelationships,
    itemManufacturingRules
  } from '$lib/data/item-manufacturing-model';

  let { data } = $props();
  const names = new Map(itemManufacturingModel.map((item) => [item.modelId, item.canonicalName]));
</script>

<svelte:head><title>Item & Manufacturing Semantics · NuBlox</title></svelte:head>

<div class="page">
  <header class="hero section-card">
    <div>
      <span class="eyebrow">Canonical item & manufacturing model</span>
      <h1>Item, Product & Manufacturing Semantics</h1>
      <p>
        One reusable Item identity connects product, material and service definitions to catalogues,
        pricing, BOMs, manufacturing definitions, traceability and as-manufactured evidence without
        duplicating masters across ERP workspaces.
      </p>
    </div>
    <div class="hero-actions">
      <a href={`/${data.tenantSlug}/app/admin/business-objects`}>← Canonicalization workbench</a>
      <a href={`/${data.tenantSlug}/app/admin/business-objects/commercial-procurement`}
        >Commercial & procurement</a
      >
      <a href={`/${data.tenantSlug}/app/admin/business-objects/built-environment`}
        >Built environment</a
      >
      <strong>{itemManufacturingModel.length} governed constructs</strong>
      <span>{itemManufacturingRelationships.length} governed relationships</span>
    </div>
  </header>

  <section class="section-card flow">
    <span class="eyebrow">Canonical flow</span>
    <div class="flow-row">
      <article>
        <small>Definition</small><strong>Item</strong><span
          >Product / Material / Service classification</span
        >
      </article>
      <b>→</b>
      <article>
        <small>Technical</small><strong>Specification / Variant / BOM</strong><span
          >Controlled definition and product structure</span
        >
      </article>
      <b>→</b>
      <article>
        <small>Manufacturing</small><strong>Definition / Process Plan</strong><span
          >How the Item is produced</span
        >
      </article>
      <b>→</b>
      <article>
        <small>Execution</small><strong>Production Order</strong><span
          >Authorised production work</span
        >
      </article>
      <b>→</b>
      <article>
        <small>Traceability</small><strong>Lot / Batch / Serial</strong><span
          >Actual provenance</span
        >
      </article>
      <b>→</b>
      <article>
        <small>Actual</small><strong>As-Manufactured</strong><span
          >Evidence of what was produced</span
        >
      </article>
    </div>
  </section>

  <section class="section-card boundary-grid">
    {#each itemManufacturingBoundaries as boundary}
      <article>
        <span class="eyebrow">{boundary.name}</span>
        <h2>{boundary.structure}</h2>
        <p>{boundary.purpose}</p>
        <small>Must not become: {boundary.mustNotBecome}</small>
      </article>
    {/each}
  </section>

  <section class="section-card model">
    <div class="section-heading">
      <div>
        <span class="eyebrow">Semantic contracts</span>
        <h2>Governed item & manufacturing constructs</h2>
      </div>
      <p>
        Open a construct to inspect its identity contract, scope, lifecycle and modelling
        boundaries.
      </p>
    </div>
    <div class="object-grid">
      {#each itemManufacturingModel as item, index}
        <details open={index < 2}>
          <summary>
            <span><code>{item.modelId}</code><strong>{item.canonicalName}</strong></span>
            <small>{item.kind}</small>
          </summary>
          <div class="object-body">
            <p class="definition">{item.definition}</p>
            <dl>
              <div>
                <dt>Candidate source</dt>
                <dd>{item.candidateKeys.join(', ')}</dd>
              </div>
              <div>
                <dt>Identity rule</dt>
                <dd>{item.identityRule}</dd>
              </div>
              <div>
                <dt>Scope</dt>
                <dd class="chips">
                  {#each item.scope as scope}<span>{scope}</span>{/each}
                </dd>
              </div>
              <div>
                <dt>Key data</dt>
                <dd>
                  <ul>
                    {#each item.keyData as value}<li>{value}</li>{/each}
                  </ul>
                </dd>
              </div>
              <div>
                <dt>Lifecycle</dt>
                <dd class="chips">
                  {#each item.lifecycle as state}<span>{state}</span>{/each}
                </dd>
              </div>
              <div>
                <dt>Governance</dt>
                <dd>
                  <ul>
                    {#each item.governance as rule}<li>{rule}</li>{/each}
                  </ul>
                </dd>
              </div>
            </dl>
          </div>
        </details>
      {/each}
    </div>
  </section>

  <section class="section-card relationships">
    <div class="section-heading">
      <div>
        <span class="eyebrow">Relationship graph</span>
        <h2>How definition, commercial context, manufacturing and traceability connect</h2>
      </div>
      <p>
        Relationships carry effectivity and provenance without duplicating canonical identities.
      </p>
    </div>
    <div class="table-wrap">
      <table>
        <thead
          ><tr
            ><th>ID</th><th>From</th><th>Relationship</th><th>To</th><th>Cardinality</th><th
              >Governance</th
            ></tr
          ></thead
        >
        <tbody>
          {#each itemManufacturingRelationships as relationship}
            <tr>
              <td><code>{relationship.id}</code></td>
              <td
                ><strong>{names.get(relationship.from)}</strong><small>{relationship.from}</small
                ></td
              >
              <td
                ><strong>{relationship.predicate}</strong
                >{#if relationship.relationshipObject}<small
                    >via {relationship.relationshipObject}</small
                  >{/if}</td
              >
              <td><strong>{names.get(relationship.to)}</strong><small>{relationship.to}</small></td>
              <td>{relationship.cardinality}</td>
              <td>{relationship.governance}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <section class="section-card rules">
    <span class="eyebrow">Non-negotiable modelling rules</span>
    <h2>What NuBlox must preserve</h2>
    <ol>
      {#each itemManufacturingRules as rule}<li>{rule}</li>{/each}
    </ol>
  </section>
</div>

<style>
  .page {
    display: grid;
    gap: 12px;
  }
  .section-card {
    border: 1px solid var(--line);
    border-radius: 10px;
    background: white;
  }
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 24px;
    align-items: center;
    padding: 20px;
    background: linear-gradient(120deg, #fbfdff, #eef8f2 65%, #fff);
  }
  .eyebrow {
    color: var(--blue-700);
    font-size: 10px;
    font-weight: 850;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }
  h1 {
    margin: 5px 0 7px;
    font-size: 27px;
  }
  h2 {
    margin: 3px 0 5px;
    font-size: 16px;
  }
  .hero p,
  .section-heading p,
  .boundary-grid p {
    margin: 0;
    color: #50697c;
    font-size: 11px;
    line-height: 1.55;
  }
  .hero-actions {
    display: grid;
    gap: 5px;
    padding: 12px;
    border: 1px solid #b8d7c3;
    border-radius: 8px;
    background: #fff;
  }
  .hero-actions a {
    color: var(--blue-700);
    font-size: 10px;
    font-weight: 800;
    text-decoration: none;
  }
  .hero-actions strong {
    margin-top: 4px;
    font-size: 15px;
  }
  .hero-actions span {
    color: #6c8192;
    font-size: 10px;
  }
  .flow {
    padding: 14px;
  }
  .flow-row {
    display: flex;
    align-items: stretch;
    gap: 7px;
    margin-top: 10px;
    overflow: auto;
  }
  .flow-row article {
    min-width: 150px;
    display: grid;
    gap: 3px;
    padding: 10px;
    border: 1px solid #dce7e1;
    border-radius: 8px;
    background: #fbfdfc;
  }
  .flow-row article small {
    font-size: 8px;
    text-transform: uppercase;
    color: #788b80;
  }
  .flow-row article strong {
    font-size: 11px;
  }
  .flow-row article span {
    font-size: 9px;
    line-height: 1.4;
    color: #63766b;
  }
  .flow-row b {
    align-self: center;
    color: #91a59a;
  }
  .boundary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    overflow: hidden;
  }
  .boundary-grid article {
    padding: 13px;
    border-right: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    min-height: 128px;
  }
  .boundary-grid article:nth-child(3n) {
    border-right: 0;
  }
  .boundary-grid h2 {
    font-size: 12px;
    line-height: 1.35;
  }
  .boundary-grid small {
    display: block;
    margin-top: 9px;
    padding-top: 7px;
    border-top: 1px solid #e8edf1;
    color: #8a5c35;
    font-size: 9px;
    line-height: 1.4;
  }
  .model,
  .relationships,
  .rules {
    padding: 15px;
  }
  .section-heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 12px;
  }
  .section-heading p {
    max-width: 560px;
    text-align: right;
  }
  .object-grid {
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
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 11px;
    cursor: pointer;
    background: white;
  }
  summary span {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  summary strong {
    font-size: 12px;
  }
  summary small {
    color: #6e8293;
    font-size: 9px;
  }
  code {
    padding: 2px 5px;
    border-radius: 4px;
    background: #eef3f6;
    color: #4a6679;
    font-size: 9px;
  }
  .object-body {
    display: grid;
    gap: 10px;
    padding: 11px;
    border-top: 1px solid #e4ebef;
  }
  .definition {
    margin: 0;
    color: #405c70;
    font-size: 10.5px;
    line-height: 1.5;
  }
  dl {
    display: grid;
    gap: 8px;
    margin: 0;
  }
  dl > div {
    display: grid;
    grid-template-columns: 115px minmax(0, 1fr);
    gap: 10px;
  }
  dt {
    color: #718493;
    font-size: 8.5px;
    font-weight: 800;
    text-transform: uppercase;
  }
  dd {
    margin: 0;
    color: #40596c;
    font-size: 10px;
    line-height: 1.45;
  }
  dd ul {
    margin: 0;
    padding-left: 16px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .chips span {
    padding: 3px 6px;
    border-radius: 999px;
    background: #eef6fb;
    color: #285a79;
    font-size: 8.5px;
    font-weight: 750;
  }
  .table-wrap {
    overflow: auto;
    border: 1px solid #e1e8ed;
    border-radius: 8px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 1050px;
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
    color: #617485;
    font-size: 8.5px;
    text-transform: uppercase;
  }
  td small {
    display: block;
    margin-top: 2px;
    color: #7d8d99;
    font-size: 8.5px;
  }
  td:nth-child(6) {
    max-width: 430px;
    line-height: 1.45;
  }
  .rules {
    background: #fbfcfd;
  }
  .rules ol {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 28px;
    margin: 10px 0 0;
    padding-left: 22px;
  }
  .rules li {
    color: #415b6e;
    font-size: 10.5px;
    line-height: 1.5;
    padding-left: 3px;
  }
  @media (max-width: 1050px) {
    .boundary-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .boundary-grid article:nth-child(3n) {
      border-right: 1px solid var(--line);
    }
    .boundary-grid article:nth-child(2n) {
      border-right: 0;
    }
    .object-grid {
      grid-template-columns: 1fr;
    }
    .hero {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 700px) {
    .boundary-grid {
      grid-template-columns: 1fr;
    }
    .boundary-grid article {
      border-right: 0 !important;
    }
    .section-heading {
      display: grid;
    }
    .section-heading p {
      text-align: left;
    }
    .rules ol {
      grid-template-columns: 1fr;
    }
    .hero {
      padding: 14px;
    }
    dl > div {
      grid-template-columns: 1fr;
    }
  }
</style>
