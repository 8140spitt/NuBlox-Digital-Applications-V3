<script lang="ts">
  import {
    crmBoundaries,
    crmBusinessDevelopmentModel,
    crmRelationships,
    crmRules
  } from '$lib/data/crm-business-development-model';

  let { data } = $props();
  const names = new Map(
    crmBusinessDevelopmentModel.map((item) => [item.modelId, item.canonicalName])
  );
  const externalNames = new Map([
    ['CBO-PARTY', 'Party'],
    ['AUTH-PARTY-RELATIONSHIP', 'Party Relationship']
  ]);
  const nameFor = (id: string) => names.get(id) ?? externalNames.get(id) ?? id;
</script>

<svelte:head><title>CRM & Business Development Semantics · NuBlox</title></svelte:head>

<div class="page">
  <header class="hero section-card">
    <div>
      <span class="eyebrow">Canonical commercial relationship model</span>
      <h1>CRM, Business Development & Customer</h1>
      <p>
        Governed market, funnel, account-planning, interaction, onboarding and customer-case
        semantics built on the same canonical Party and Party Relationship identities.
      </p>
    </div>
    <div class="hero-actions">
      <a href={`/${data.tenantSlug}/app/admin/business-objects`}>← Canonicalization workbench</a>
      <a href={`/${data.tenantSlug}/app/admin/business-objects/coverage-audit`}>Coverage audit</a>
      <a href={`/${data.tenantSlug}/app/admin/business-objects/commercial-procurement`}
        >Commercial & procurement</a
      >
      <strong>{crmBusinessDevelopmentModel.length} governed constructs</strong>
      <span>{crmRelationships.length} semantic relationships</span>
    </div>
  </header>

  <section class="section-card boundary-grid">
    {#each crmBoundaries as boundary}
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
        <h2>Governed CRM constructs</h2>
      </div>
      <p>
        Identity is preserved through the funnel: commercial objects link by provenance instead of
        one mutable record changing meaning from lead to project.
      </p>
    </div>
    <div class="object-grid">
      {#each crmBusinessDevelopmentModel as item, index}
        <details open={index < 4}>
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
        <h2>How the commercial funnel connects to shared truth</h2>
      </div>
      <p>
        Party/Organisation identity remains authoritative while Lead, Opportunity, Pursuit,
        decisions and customer cases retain their own independent business meaning.
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
          {#each crmRelationships as relationship}
            <tr>
              <td><code>{relationship.id}</code></td>
              <td
                ><strong>{nameFor(relationship.from)}</strong><small>{relationship.from}</small></td
              >
              <td><strong>{relationship.predicate}</strong></td>
              <td><strong>{nameFor(relationship.to)}</strong><small>{relationship.to}</small></td>
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
      {#each crmRules as rule}<li>{rule}</li>{/each}
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
    background: linear-gradient(120deg, #fbfdff, #f6f8fb 65%, #fff);
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
    border: 1px solid #d9e3ea;
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
  .boundary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    overflow: hidden;
  }
  .boundary-grid article {
    padding: 13px;
    border-right: 1px solid var(--line);
    min-height: 128px;
  }
  .boundary-grid article:last-child {
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
      border-right: 0;
      border-bottom: 1px solid var(--line);
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
