<script lang="ts">
  import { enterpriseFunctions } from '$lib/enterprise/functions';
  let { tenantSlug } = $props();
</script>

<aside class="sidebar">
  <section>
    <p class="label">Workspace</p>
    <a class="utility active" href={`/${tenantSlug}/app/functions/f01`}>⌂ <span>Home</span></a>
    <a class="utility" href={`/${tenantSlug}/app/functions/f01`}>▣ <span>My work</span></a>
    <a class="utility" href={`/${tenantSlug}/app/functions/f01`}>◌ <span>Notifications</span></a>
  </section>

  <section class="functions">
    <p class="label">Business functions</p>
    <div class="function-list">
      {#each enterpriseFunctions as fn}
        {#if fn.state === 'active'}
          <a class="function active" href={`/${tenantSlug}/app/functions/${fn.id.toLowerCase()}`} title={fn.name}>
            <span class="fn-id">{fn.id}</span><span>{fn.shortName}</span>
          </a>
        {:else}
          <div class="function planned" title={`${fn.name} — planned`}>
            <span class="fn-id">{fn.id}</span><span>{fn.shortName}</span>
          </div>
        {/if}
      {/each}
    </div>
  </section>

  <section class="admin">
    <p class="label">Administration</p>
    <div class="admin-item">Function directory</div>
    <div class="admin-item">Job architecture</div>
    <div class="admin-item">Positions</div>
    <div class="admin-item">Lifecycle administration</div>
    <div class="admin-item">Design system</div>
  </section>
</aside>

<style>
  .sidebar { position: sticky; top: 64px; height: calc(100vh - 64px); overflow: auto; padding: 18px 14px 22px; border-right: 1px solid var(--line); background: #fbfcfd; }
  .sidebar section + section { border-top: 1px solid #e5ebf0; margin-top: 15px; padding-top: 15px; }
  .label { margin: 0 8px 9px; color: #758493; font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
  .utility, .function { display: grid; grid-template-columns: 31px minmax(0,1fr); align-items: center; min-height: 34px; padding: 6px 9px; border-radius: 7px; text-decoration: none; color: #30465a; font-size: 12px; }
  .utility:hover, .function.active { background: #dff0fb; color: #123f5f; }
  .utility.active { font-weight: 700; }
  .function-list { display: grid; gap: 2px; }
  .function { font-size: 11.5px; line-height: 1.25; }
  .function.active { font-weight: 700; }
  .function.planned { color: #788794; cursor: default; }
  .fn-id { font-size: 10px; font-weight: 800; color: #52687b; }
  .admin-item { padding: 7px 9px; color: #536779; font-size: 11.5px; }
  @media (max-width: 760px) { .sidebar { position: static; height: auto; padding: 8px 10px; border-right: 0; border-bottom: 1px solid var(--line); } .sidebar > section:first-child, .sidebar .admin { display: none; } .sidebar section + section { border-top: 0; margin: 0; padding: 0; } .label { display: none; } .function-list { display: flex; overflow-x: auto; gap: 6px; padding-bottom: 2px; } .function { min-width: max-content; grid-template-columns: auto auto; gap: 5px; border: 1px solid var(--line); background: white; } .function.planned { display: none; } }
</style>
