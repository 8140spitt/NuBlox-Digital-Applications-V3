<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const workspace = $derived(data.workspace);

  function engineStateLabel(state: string) {
    if (state === 'IMPLEMENTED_PLATFORM') return 'Available';
    if (state === 'IMPLEMENTED_DOMAIN_CORE') return 'Available';
    if (state === 'PARTIAL') return 'Partially available';
    return 'Planned';
  }
</script>

<svelte:head>
  <title>{workspace.code} {workspace.name} — NuBlox</title>
</svelte:head>

<section class="function-workspace-header redesigned">
  <div>
    <a class="function-back-link" href="/app/functions">← All Functions</a>
    <div class="function-title-line">
      <span class="function-code large">{workspace.code}</span>
      <p class="app-eyebrow">Enterprise Function</p>
    </div>
    <h1>{workspace.name}</h1>
    <p class="workspace-lede">
      Work within the governed scope of {workspace.name.toLowerCase()}, using shared NuBlox
      information, workflow, responsibility, Decision, evidence and delivery controls.
    </p>
  </div>

  <dl class="workspace-stat-block">
    <div>
      <dt>Sub-functions</dt>
      <dd>{workspace.subfunctionCount}</dd>
    </div>
    <div>
      <dt>Activities</dt>
      <dd>{workspace.activityCount}</dd>
    </div>
  </dl>
</section>

<div class="function-workspace-grid">
  <section class="workspace-panel function-scope-panel">
    <div class="panel-heading">
      <div>
        <p class="app-eyebrow">Work scope</p>
        <h2>Sub-functions &amp; activities</h2>
      </div>
      <span>{workspace.subfunctions.length}</span>
    </div>

    <div class="subfunction-list">
      {#each workspace.subfunctions as subfunction}
        <details>
          <summary>
            <div>
              <span class="subfunction-code">{subfunction.code}</span>
              <strong>{subfunction.name}</strong>
            </div>
            <span class="subfunction-count">{subfunction.activities.length} activities</span>
          </summary>

          <div class="subfunction-detail redesigned">
            <div>
              <h3>Activities</h3>
              <ol class="activity-list">
                {#each subfunction.activities as activity, index}
                  <li>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{activity}</strong>
                  </li>
                {/each}
              </ol>
            </div>

            <div>
              <h3>Supporting capabilities</h3>
              <div class="subfunction-engines">
                {#each subfunction.engineNames as engineName, index}
                  <span><strong>{subfunction.engineIds[index]}</strong>{engineName}</span>
                {/each}
              </div>
            </div>
          </div>
        </details>
      {/each}
    </div>
  </section>

  <aside class="workspace-panel function-tools-panel">
    <div class="panel-heading">
      <div>
        <p class="app-eyebrow">Native capabilities</p>
        <h2>Available in this Function</h2>
      </div>
    </div>

    <div class="engine-list compact-engine-list">
      {#each workspace.engines as engine}
        <article>
          <div>
            <span class="engine-id">{engine.id}</span>
            <h3>{engine.name}</h3>
          </div>
          <span class="engine-state">{engineStateLabel(engine.state)}</span>
        </article>
      {/each}
    </div>

    <div class="function-shared-controls">
      <h3>Shared controls</h3>
      <p>
        Responsibility, access, workflow, lifecycle, Decision, evidence, information, change and
        audit remain in context across the Function.
      </p>
    </div>
  </aside>
</div>
