<script lang="ts">
  import type { WorkArea } from '$lib/workspaces/f01';
  let { areas, baseHref }: { areas: readonly WorkArea[]; baseHref: string } = $props();
</script>

<section class="subfunctions section-card" aria-labelledby="subfunctions-title">
  <div class="section-heading"><div><span class="eyebrow">Workspace map</span><h2 id="subfunctions-title">Eight strategy work areas</h2></div><p>Each area is a stable F01 sub-function surface backed by shared lifecycle, workflow and evidence services.</p></div>
  <div class="area-grid">
    {#each areas as area}
      <article class:operational={Boolean(area.path)} class="area-card">
        <header><span>{area.id}</span><h3>{area.name}</h3><small>{area.sourceName}</small></header>
        <p>{area.summary}</p>
        <ul>{#each area.items as item}<li>{item}</li>{/each}</ul>
        {#if area.path}
          <a class="open-link" href={`${baseHref}/${area.path}`}>Open operational workspace →</a>
        {:else}
          <span class="planned-label">Planned</span>
        {/if}
      </article>
    {/each}
  </div>
</section>

<style>
  .subfunctions { padding: 12px; border-color: #92cbed; background: #f5fbff; }
  .section-heading { display: flex; justify-content: space-between; gap: 20px; align-items: end; margin: 0 2px 10px; }
  .section-heading .eyebrow { color: var(--blue-700); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .07em; }
  h2 { margin: 2px 0 0; font-size: 16px; }
  .section-heading p { margin: 0; max-width: 560px; color: var(--muted); font-size: 11px; line-height: 1.4; }
  .area-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 9px; }
  .area-card { min-width: 0; overflow: hidden; border: 1px solid #b8dcef; border-radius: 9px; background: white; box-shadow: 0 2px 7px rgba(31,81,111,.04); }
  .area-card.operational { border-color: #63afd8; box-shadow: 0 5px 14px rgba(31,81,111,.09); }
  .area-card header { min-height: 80px; padding: 10px 11px 8px; border-bottom: 1px solid #d9eaf4; background: linear-gradient(180deg,#fbfdff,#f2f9fd); }
  .area-card header span { color: var(--blue-700); font-size: 10.5px; font-weight: 850; }
  .area-card h3 { margin: 3px 0 3px; color: #1f3e54; font-size: 14px; line-height: 1.2; }
  .area-card small { color: #80909d; font-size: 9.5px; }
  .area-card > p { min-height: 57px; margin: 0; padding: 9px 11px; color: #516779; font-size: 10.5px; line-height: 1.35; }
  ul { list-style: none; margin: 0; padding: 0 8px 9px; display: grid; gap: 4px; }
  li { padding: 5px 7px; border: 1px solid #e3e9ee; border-radius: 5px; background: #fafbfc; color: #344d61; font-size: 10px; }
  .open-link, .planned-label { display: block; margin: 0 8px 9px; padding: 7px 8px; border-radius: 6px; font-size: 10.5px; font-weight: 750; }
  .open-link { text-decoration: none; color: white; background: var(--blue-700); }
  .open-link:hover { background: var(--navy-800); }
  .planned-label { color: #788794; background: #f2f4f6; }
  @media (max-width: 1260px) { .area-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
  @media (max-width: 720px) { .section-heading { display: block; } .section-heading p { margin-top: 5px; } .area-grid { grid-template-columns: 1fr; } .area-card > p { min-height: 0; } }
</style>
