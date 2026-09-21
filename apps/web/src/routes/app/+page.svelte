<script lang="ts">
  import { functionGroups, functions, functionsForGroup } from '$lib/function-catalog';

  const totals = {
    functions: functions.length,
    subfunctions: functions.reduce((sum, fn) => sum + fn.subfunctionCount, 0),
    activities: functions.reduce((sum, fn) => sum + fn.activityCount, 0),
    engines: new Set(functions.flatMap((fn) => fn.engines.map((engine) => engine.id))).size
  };
</script>

<svelte:head>
  <title>Functions — NuBlox</title>
  <meta
    name="description"
    content="NuBlox governed enterprise function workspaces"
  />
</svelte:head>

<section class="workspace-hero">
  <div>
    <p class="app-eyebrow">Tenant application</p>
    <h1>Operate the enterprise from one governed system.</h1>
    <p class="workspace-lede">
      The 29 Functions are stable workspaces over one canonical object graph. Each workspace
      composes the native tools, work, records, decisions and evidence required to perform the
      function without creating another application silo.
    </p>
  </div>

  <a class="primary-action" href="/app/my-work">
    Open My Work
    <span aria-hidden="true">→</span>
  </a>
</section>

<section class="architecture-metrics" aria-label="Governed architecture coverage">
  <article>
    <span>Functions</span>
    <strong>{totals.functions}</strong>
    <p>Stable enterprise workspaces</p>
  </article>
  <article>
    <span>L2 sub-functions</span>
    <strong>{totals.subfunctions}</strong>
    <p>Governed functional depth</p>
  </article>
  <article>
    <span>Activities</span>
    <strong>{totals.activities.toLocaleString()}</strong>
    <p>Canonical work capabilities</p>
  </article>
  <article>
    <span>Primary engines</span>
    <strong>{totals.engines}</strong>
    <p>Function-owned native engines</p>
  </article>
</section>

<section class="workspace-section">
  <div class="workspace-section-heading">
    <div>
      <p class="app-eyebrow">Function directory</p>
      <h2>29 governed workspaces</h2>
    </div>
    <p>
      Open a Function to see its governed scope and the canonical native engines that will execute
      its work.
    </p>
  </div>

  <div class="function-directory">
    {#each functionGroups as group}
      <section class="function-group-card">
        <header>
          <h3>{group.name}</h3>
          <span>{group.functionCodes.length} functions</span>
        </header>
        <div class="function-card-grid">
          {#each functionsForGroup(group.id) as fn}
            <a class="function-card" href={`/app/functions/${fn.code.toLowerCase()}`}>
              <div class="function-card-topline">
                <span class="function-code">{fn.code}</span>
                <span class="function-arrow" aria-hidden="true">↗</span>
              </div>
              <strong>{fn.name}</strong>
              <div class="function-card-meta">
                <span>{fn.subfunctionCount} L2</span>
                <span>{fn.activityCount} activities</span>
                <span>{fn.engines.length} primary engines</span>
              </div>
            </a>
          {/each}
        </div>
      </section>
    {/each}
  </div>
</section>
