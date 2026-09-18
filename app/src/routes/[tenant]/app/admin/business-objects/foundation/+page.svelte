<script lang="ts">
  import { foundationObjects, foundationRelationships } from '$lib/data/foundation-object-model';
  let { data } = $props();

  const objectNames = new Map(
    foundationObjects.map((object) => [object.modelId, object.canonicalName])
  );
</script>

<svelte:head><title>Foundation Object Semantics · NuBlox</title></svelte:head>

<div class="page">
  <header class="hero section-card">
    <div>
      <span class="eyebrow">Canonical data model</span>
      <h1>Foundation Object Semantics</h1>
      <p>
        Governed identity, scope, lifecycle, versioning and relationship semantics for the NuBlox
        object spine. This is a logical business model, not a physical database schema.
      </p>
    </div>
    <div class="hero-actions">
      <a href={`/${data.tenantSlug}/app/admin/business-objects`}>← Canonicalization workbench</a>
      <strong>{foundationObjects.length} foundation objects</strong>
      <span>{foundationRelationships.length} governed relationships</span>
    </div>
  </header>

  <section class="principles section-card">
    <div>
      <strong>Identity</strong><span
        >Immutable system identity survives business-number, name, state and relationship changes.</span
      >
    </div>
    <div>
      <strong>Lifecycle</strong><span
        >Object state is distinct from workflow tasks, project stages, condition, approval or
        availability.</span
      >
    </div>
    <div>
      <strong>Versioning</strong><span
        >Version semantics vary by object: history, effective dating, amendments, revision/iteration
        or configuration control.</span
      >
    </div>
    <div>
      <strong>Relationships</strong><span
        >Context belongs on governed relationships instead of duplicating master objects.</span
      >
    </div>
  </section>

  <section class="section-card objects">
    <div class="section-heading">
      <div>
        <span class="eyebrow">Object definitions</span>
        <h2>Canonical foundation</h2>
      </div>
      <p>Open any object to inspect its semantic contract.</p>
    </div>

    <div class="object-grid">
      {#each foundationObjects as object, index}
        <details open={index < 2}>
          <summary>
            <span><code>{object.modelId}</code><strong>{object.canonicalName}</strong></span>
            <small>{object.versioning.mode}</small>
          </summary>
          <div class="object-body">
            <p class="definition">{object.definition}</p>
            <dl>
              <div>
                <dt>Candidate source</dt>
                <dd>{object.candidateKey}</dd>
              </div>
              <div>
                <dt>Aggregate boundary</dt>
                <dd>{object.aggregateBoundary}</dd>
              </div>
              <div>
                <dt>System identity</dt>
                <dd>{object.systemIdentity}</dd>
              </div>
              <div>
                <dt>Scope</dt>
                <dd class="chips">
                  {#each object.scope as scope}<span>{scope}</span>{/each}
                </dd>
              </div>
              <div>
                <dt>Business identifiers</dt>
                <dd>
                  <ul>
                    {#each object.businessIdentifiers as identifier}<li>{identifier}</li>{/each}
                  </ul>
                </dd>
              </div>
              <div>
                <dt>Lifecycle</dt>
                <dd>
                  <div class="states">
                    {#each object.lifecycle.states as state}<span>{state}</span>{/each}
                  </div>
                  <small>{object.lifecycle.notes}</small>
                </dd>
              </div>
              <div>
                <dt>Version / history</dt>
                <dd>
                  <strong>{object.versioning.mode}</strong><small>{object.versioning.notes}</small>
                </dd>
              </div>
              <div>
                <dt>Effectivity</dt>
                <dd>{object.effectivity}</dd>
              </div>
              <div>
                <dt>Ownership</dt>
                <dd>{object.ownership}</dd>
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
        <h2>Governed semantic edges</h2>
      </div>
      <p>
        Cardinality is logical guidance. Relationship records may carry role, responsibility,
        effectivity, evidence and authority.
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
          {#each foundationRelationships as relationship}
            <tr>
              <td><code>{relationship.id}</code></td>
              <td
                ><strong>{objectNames.get(relationship.from)}</strong><small
                  >{relationship.from}</small
                ></td
              >
              <td
                ><strong>{relationship.predicate}</strong
                >{#if relationship.relationshipObject}<small
                    >via {relationship.relationshipObject}</small
                  >{/if}</td
              >
              <td
                ><strong>{objectNames.get(relationship.to)}</strong><small>{relationship.to}</small
                ></td
              >
              <td>{relationship.cardinality}</td>
              <td>{relationship.governance}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <section class="section-card boundary">
    <span class="eyebrow">Implementation boundary</span>
    <h2>What this does not mean</h2>
    <p>
      These definitions do not imply one table per object, direct foreign keys for every
      relationship, one universal lifecycle engine, or a single version model. Physical aggregates,
      commands, persistence and read models come after these semantics are accepted.
    </p>
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
    grid-template-columns: minmax(0, 1fr) 280px;
    gap: 24px;
    align-items: center;
    padding: 20px;
    background: linear-gradient(120deg, #fbfdff, #eaf6fd 65%, #fff);
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
    margin: 3px 0 0;
    font-size: 17px;
  }
  .hero p,
  .section-heading p,
  .boundary p {
    margin: 0;
    color: #50697c;
    font-size: 11px;
    line-height: 1.55;
  }
  .hero-actions {
    display: grid;
    gap: 5px;
    padding: 12px;
    border: 1px solid #a7d1eb;
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
    font-size: 16px;
  }
  .hero-actions span {
    color: #6c8192;
    font-size: 10px;
  }
  .principles {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
    overflow: hidden;
  }
  .principles div {
    display: grid;
    gap: 4px;
    padding: 14px;
    border-right: 1px solid var(--line);
  }
  .principles div:last-child {
    border-right: 0;
  }
  .principles strong {
    font-size: 11px;
    color: #294c65;
  }
  .principles span {
    font-size: 10px;
    line-height: 1.45;
    color: #657989;
  }
  .objects,
  .relationships,
  .boundary {
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
    grid-template-columns: 120px minmax(0, 1fr);
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
  dd small {
    display: block;
    margin-top: 4px;
    color: #728493;
    font-size: 9px;
  }
  .chips,
  .states {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .chips span,
  .states span {
    padding: 3px 6px;
    border-radius: 999px;
    background: #eef6fb;
    color: #285a79;
    font-size: 8.5px;
    font-weight: 750;
  }
  .states span {
    background: #f2f4f6;
    color: #4f6575;
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
  .boundary {
    background: #fbfcfd;
  }
  .boundary h2 {
    margin-bottom: 6px;
  }
  @media (max-width: 1000px) {
    .principles {
      grid-template-columns: repeat(2, 1fr);
    }
    .principles div:nth-child(2) {
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
    .principles {
      grid-template-columns: 1fr;
    }
    .principles div {
      border-right: 0;
      border-bottom: 1px solid var(--line);
    }
    .section-heading {
      display: grid;
    }
    .section-heading p {
      text-align: left;
    }
    .hero {
      padding: 14px;
    }
    dl > div {
      grid-template-columns: 1fr;
    }
  }
</style>
