<script lang="ts">
  import { functionGroups, functions, functionsForGroup } from '$lib/function-catalog';

  const totals = {
    functions: functions.length,
    subfunctions: functions.reduce((sum, fn) => sum + fn.subfunctionCount, 0),
    activities: functions.reduce((sum, fn) => sum + fn.activityCount, 0)
  };
</script>

<svelte:head>
  <title>Functions — NuBlox</title>
  <meta name="description" content="NuBlox enterprise Functions" />
</svelte:head>

<section class="workspace-hero compact function-directory-hero">
  <div>
    <p class="app-eyebrow">Enterprise Functions</p>
    <h1>Choose where the work belongs.</h1>
    <p class="workspace-lede">
      The 29 Functions organise enterprise responsibility and execution. Open a Function to see its
      governed sub-functions, activities and the native capabilities that support the work.
    </p>
  </div>
</section>

<section class="directory-summary" aria-label="Function coverage">
  <span><strong>{totals.functions}</strong> Functions</span>
  <span><strong>{totals.subfunctions}</strong> L2 sub-functions</span>
  <span><strong>{totals.activities.toLocaleString()}</strong> activities</span>
</section>

<section class="function-directory compact-directory">
  {#each functionGroups as group}
    <section class="function-group-card">
      <header>
        <h2>{group.name}</h2>
        <span>{group.functionCodes.length}</span>
      </header>
      <div class="function-card-grid">
        {#each functionsForGroup(group.id) as fn}
          <a class="function-card" href={`/app/functions/${fn.code.toLowerCase()}`}>
            <div class="function-card-topline">
              <span class="function-code">{fn.code}</span>
              <span class="function-arrow" aria-hidden="true">→</span>
            </div>
            <strong>{fn.name}</strong>
            <div class="function-card-meta">
              <span>{fn.subfunctionCount} L2</span>
              <span>{fn.activityCount} activities</span>
            </div>
          </a>
        {/each}
      </div>
    </section>
  {/each}
</section>
