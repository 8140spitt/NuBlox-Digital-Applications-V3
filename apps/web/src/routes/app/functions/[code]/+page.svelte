<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const workspace = $derived(data.workspace);

  function engineStateLabel(state: string) {
    if (state === 'IMPLEMENTED_PLATFORM') return 'Platform foundation';
    if (state === 'IMPLEMENTED_DOMAIN_CORE') return 'Domain foundation';
    if (state === 'PARTIAL') return 'Partial';
    return 'To build';
  }
</script>

<svelte:head>
  <title>{workspace.code} {workspace.name} — NuBlox</title>
</svelte:head>

<section class="function-workspace-header">
  <div>
    <div class="function-title-line">
      <span class="function-code large">{workspace.code}</span>
      <p class="app-eyebrow">Governed function workspace</p>
    </div>
    <h1>{workspace.name}</h1>
    <p class="workspace-lede">
      This workspace composes shared platform controls with the native domain engines required to
      govern and perform {workspace.name.toLowerCase()} work.
    </p>
  </div>

  <dl class="workspace-stat-block">
    <div>
      <dt>L2 sub-functions</dt>
      <dd>{workspace.subfunctionCount}</dd>
    </div>
    <div>
      <dt>Activities</dt>
      <dd>{workspace.activityCount}</dd>
    </div>
    <div>
      <dt>Primary engines</dt>
      <dd>{workspace.engines.length}</dd>
    </div>
  </dl>
</section>

<nav class="workspace-tabs" aria-label="Workspace views">
  <span class="selected">Overview</span>
  <span>Work</span>
  <span>Records</span>
  <span>Decisions &amp; evidence</span>
  <span>Performance</span>
</nav>

<div class="workspace-two-column">
  <section class="workspace-panel">
    <div class="panel-heading">
      <div>
        <p class="app-eyebrow">Native execution</p>
        <h2>Canonical engines</h2>
      </div>
      <span>{workspace.engines.length}</span>
    </div>

    <div class="engine-list">
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
  </section>

  <aside class="workspace-panel control-panel">
    <div class="panel-heading">
      <div>
        <p class="app-eyebrow">Shared controls</p>
        <h2>Always in context</h2>
      </div>
    </div>

    <div class="control-list">
      <div><span>01</span><strong>Assignment &amp; responsibility</strong></div>
      <div><span>02</span><strong>Permission &amp; Authority</strong></div>
      <div><span>03</span><strong>Lifecycle &amp; workflow</strong></div>
      <div><span>04</span><strong>Review &amp; Decision</strong></div>
      <div><span>05</span><strong>Evidence &amp; audit</strong></div>
      <div><span>06</span><strong>Change &amp; configuration</strong></div>
    </div>
  </aside>
</div>

<section class="workspace-panel subfunction-panel">
  <div class="panel-heading">
    <div>
      <p class="app-eyebrow">Governed scope</p>
      <h2>L2 sub-functions &amp; activities</h2>
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

        <div class="subfunction-detail">
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
            <h3>Native engine composition</h3>
            <div class="subfunction-engines">
              {#each subfunction.engineNames as engineName, index}
                <span><strong>{subfunction.engineIds[index]}</strong>{engineName}</span>
              {/each}
            </div>
            <p class="subfunction-note">
              Shared workflow, lifecycle, authority, information, deliverable and evidence controls
              are composed from the Enterprise Kernel and are not duplicated inside this L2.
            </p>
          </div>
        </div>
      </details>
    {/each}
  </div>
</section>

<section class="activation-strip">
  <div>
    <span class="activation-status complete">Mapped</span>
    <strong>Function taxonomy</strong>
    <p>{workspace.subfunctionCount} L2 sub-functions and {workspace.activityCount} activities are governed.</p>
  </div>
  <div>
    <span class="activation-status complete">Mapped</span>
    <strong>Native engine architecture</strong>
    <p>The workspace resolves to reusable canonical engines rather than vendor-shaped modules.</p>
  </div>
  <div>
    <span class="activation-status active">Wave 0</span>
    <strong>Executable workspace</strong>
    <p>The product shell is active; live repository-backed work views are the current implementation target.</p>
  </div>
</section>
