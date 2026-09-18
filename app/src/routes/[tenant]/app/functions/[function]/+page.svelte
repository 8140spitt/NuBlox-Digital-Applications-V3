<script lang="ts">
  let { data } = $props();
  const workspace = $derived(data.workspace);
</script>

<svelte:head>
  <title>{workspace.id} {workspace.name} · NuBlox</title>
</svelte:head>

<div class="function-page">
  <header class="hero section-card">
    <div>
      <span class="eyebrow">{workspace.id} · Governed function workspace</span>
      <h1>{workspace.name}</h1>
      <p>
        Canonical execution map for this enterprise function. Every source activity is bound to its
        governed business object, aggregate boundary, action and authority model before operational
        commands are introduced.
      </p>
    </div>
    <div class="coverage">
      <strong>Architecture coverage</strong>
      <span>353 L2 subfunctions · 1,510 activities across NuBlox</span>
      <small>This function is fully mapped into the shared canonical model.</small>
    </div>
  </header>

  <section class="metrics" aria-label={workspace.id + ' coverage'}>
    <div class="metric section-card">
      <strong>{workspace.summary.subfunctionCount}</strong><span>subfunctions</span>
    </div>
    <div class="metric section-card">
      <strong>{workspace.summary.activityCount}</strong><span>activities</span>
    </div>
    <div class="metric section-card">
      <strong>{workspace.summary.aggregateCount}</strong><span>aggregate boundaries</span>
    </div>
    <div class="metric section-card">
      <strong>{workspace.summary.commandCount}</strong><span>command activities</span>
    </div>
    <div class="metric section-card">
      <strong>{workspace.summary.queryCount}</strong><span>query / analysis</span>
    </div>
    <div class="metric section-card">
      <strong>{workspace.summary.decisionControlledCount}</strong><span>decision controlled</span>
    </div>
  </section>

  <section class="aggregate-strip section-card">
    <div class="section-heading">
      <div>
        <span class="eyebrow">Aggregate authority</span>
        <h2>Canonical boundaries used by {workspace.id}</h2>
      </div>
      <p>
        Writes stay inside the owning aggregate. Cross-aggregate context is referenced, not mutated.
      </p>
    </div>
    <div class="aggregate-list">
      {#each workspace.aggregates as aggregate}
        <span><strong>{aggregate.id}</strong>{aggregate.rootName}</span>
      {/each}
    </div>
  </section>

  <section class="subfunction-register section-card">
    <div class="section-heading">
      <div>
        <span class="eyebrow">Function execution map</span>
        <h2>{workspace.summary.subfunctionCount} governed subfunctions</h2>
      </div>
      <p>
        Expand a subfunction to inspect its activities, canonical object routes and command/query
        intent.
      </p>
    </div>

    <div class="subfunctions">
      {#each workspace.subfunctions as subfunction}
        <details>
          <summary>
            <div class="identity">
              <span class="sub-id">{subfunction.id}</span>
              <span><strong>{subfunction.name}</strong><small>{subfunction.sourceName}</small></span
              >
            </div>
            <div class="summary-meta">
              <span>{subfunction.activityCount} activities</span>
              <span>{subfunction.aggregates.length} aggregates</span>
            </div>
          </summary>

          <div class="detail-body">
            <div class="object-strip">
              <strong>Canonical objects</strong>
              {#each subfunction.objects as object}<span>{object}</span>{/each}
            </div>

            <div class="activity-table-wrap">
              <table>
                <thead>
                  <tr
                    ><th>Activity</th><th>Intent</th><th>Canonical object</th><th>Aggregate</th><th
                      >Controls</th
                    ></tr
                  >
                </thead>
                <tbody>
                  {#each subfunction.activities as activity}
                    <tr>
                      <td><strong>{activity.name}</strong><small>{activity.id}</small></td>
                      <td>
                        <span class:command={activity.accessMode === 'command'} class="intent">
                          {activity.action} · {activity.accessMode}
                        </span>
                      </td>
                      <td>{activity.objectName}<small>{activity.objectModelId}</small></td>
                      <td
                        ><strong class="aggregate-id">{activity.aggregateId}</strong><small
                          >{activity.aggregateRootName}</small
                        ></td
                      >
                      <td>
                        <div class="controls">
                          {#if activity.approvalRequired}<span>Approval</span>{/if}
                          {#if activity.decisionRequired}<span>Decision</span>{/if}
                          {#if activity.evidenceRequired}<span>Evidence</span>{/if}
                          {#if !activity.approvalRequired && !activity.decisionRequired && !activity.evidenceRequired}
                            <span class="query-control">Read authority</span>
                          {/if}
                        </div>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      {/each}
    </div>
  </section>
</div>

<style>
  .function-page {
    display: grid;
    gap: 12px;
  }
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.65fr);
    gap: 24px;
    align-items: start;
    padding: 18px;
    border-color: #8fc9ee;
    background: linear-gradient(120deg, #fbfdff, #eaf6fd);
  }
  .eyebrow {
    color: var(--blue-700);
    font-size: 10px;
    font-weight: 850;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }
  h1 {
    margin: 3px 0 6px;
    font-size: 25px;
  }
  h2 {
    margin: 2px 0 0;
    font-size: 16px;
  }
  .hero p,
  .section-heading p {
    margin: 0;
    color: #526a7d;
    font-size: 11.5px;
    line-height: 1.45;
  }
  .coverage {
    display: grid;
    gap: 5px;
    padding: 12px;
    border: 1px solid #b8dcef;
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.8);
  }
  .coverage strong {
    color: #1e4e6e;
    font-size: 12px;
  }
  .coverage span {
    color: #36566d;
    font-size: 10.5px;
  }
  .coverage small {
    color: #7a8b97;
    font-size: 9.5px;
  }
  .metrics {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 8px;
  }
  .metric {
    display: grid;
    gap: 3px;
    padding: 11px;
  }
  .metric strong {
    color: #1d4f70;
    font-size: 20px;
  }
  .metric span {
    color: #718492;
    font-size: 9.5px;
    text-transform: uppercase;
  }
  .aggregate-strip,
  .subfunction-register {
    padding: 14px;
  }
  .section-heading {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: end;
    margin-bottom: 11px;
  }
  .section-heading p {
    max-width: 580px;
  }
  .aggregate-list,
  .object-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .aggregate-list span {
    display: grid;
    gap: 1px;
    padding: 6px 8px;
    border: 1px solid #dce6ec;
    border-radius: 7px;
    background: #f9fbfc;
    color: #5a7081;
    font-size: 9px;
  }
  .aggregate-list strong {
    color: #285a78;
    font-size: 9.5px;
  }
  .subfunctions {
    display: grid;
    gap: 7px;
  }
  details {
    overflow: hidden;
    border: 1px solid #dce5eb;
    border-radius: 8px;
    background: white;
  }
  summary {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    min-height: 55px;
    padding: 9px 11px;
    cursor: pointer;
    list-style: none;
    background: #fbfcfd;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary:hover {
    background: #f2f8fc;
  }
  .identity {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
  }
  .identity > span:last-child {
    display: grid;
    gap: 2px;
  }
  .identity strong {
    color: #29495f;
    font-size: 12px;
  }
  .identity small,
  td small {
    display: block;
    color: #82919b;
    font-size: 8.5px;
  }
  .sub-id {
    min-width: 52px;
    padding: 5px 6px;
    border-radius: 6px;
    background: #e9f5fc;
    color: #22638a;
    font-size: 9.5px;
    font-weight: 850;
    text-align: center;
  }
  .summary-meta {
    display: flex;
    gap: 6px;
    flex: 0 0 auto;
  }
  .summary-meta span {
    padding: 4px 6px;
    border-radius: 999px;
    background: #eef2f5;
    color: #637786;
    font-size: 8.5px;
  }
  .detail-body {
    display: grid;
    gap: 10px;
    padding: 10px;
    border-top: 1px solid #e2e8ed;
  }
  .object-strip {
    align-items: center;
  }
  .object-strip strong {
    margin-right: 3px;
    color: #687b89;
    font-size: 9px;
    text-transform: uppercase;
  }
  .object-strip span,
  .controls span {
    padding: 3px 6px;
    border-radius: 5px;
    background: #f2f6f8;
    color: #4e6678;
    font-size: 8.5px;
  }
  .activity-table-wrap {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5px;
  }
  th,
  td {
    padding: 7px 8px;
    border-bottom: 1px solid #e8edf0;
    text-align: left;
    vertical-align: top;
  }
  th {
    background: #f6f8fa;
    color: #687b89;
    font-size: 8.5px;
    text-transform: uppercase;
  }
  td:first-child {
    width: 27%;
  }
  td strong {
    color: #365267;
    font-size: 9.5px;
  }
  .intent {
    display: inline-block;
    padding: 3px 6px;
    border-radius: 999px;
    background: #edf3f7;
    color: #506a7c;
    font-size: 8.5px;
    text-transform: capitalize;
  }
  .intent.command {
    background: #e8f5eb;
    color: #2d6b3a;
  }
  .aggregate-id {
    color: #2b6385;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .controls .query-control {
    background: #f3f4f6;
    color: #75828d;
  }
  @media (max-width: 1180px) {
    .metrics {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 760px) {
    .hero {
      grid-template-columns: 1fr;
    }
    .metrics {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .section-heading {
      display: grid;
      align-items: start;
    }
    summary {
      display: grid;
      align-items: start;
    }
    .summary-meta {
      padding-left: 62px;
    }
  }
</style>
