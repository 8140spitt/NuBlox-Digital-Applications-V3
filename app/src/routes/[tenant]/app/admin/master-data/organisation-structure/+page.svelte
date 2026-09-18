<script lang="ts">
  let { data, form } = $props();

  const children = $derived(
    data.selected
      ? data.hierarchy.filter(
          (edge) => edge.parentUnitId === data.selected.id && edge.status === 'ACTIVE'
        )
      : []
  );

  const activeCount = $derived(data.units.filter((unit) => unit.status === 'ACTIVE').length);
</script>

<svelte:head>
  <title>Organisation Structure · NuBlox</title>
</svelte:head>

<div class="structure-page">
  <header class="hero section-card">
    <div>
      <span class="eyebrow">Enterprise foundation · AGG-01-ORG-STRUCTURE</span>
      <h1>Organisation structure</h1>
      <p>
        Govern business units, divisions, departments and operating structures independently from
        legal-entity identity. Each unit can be accountable to a canonical Legal Entity and placed
        in one effective hierarchy without creating duplicate organisations.
      </p>
    </div>
    {#if data.canManage}
      <details class="create-panel">
        <summary>Create organisation unit</summary>
        <form method="POST" action="?/create">
          <label>Unit code<input name="unitCode" required placeholder="OPS-NORTH" /></label>
          <label>Unit name<input name="name" required /></label>
          <label>Unit type<input name="unitType" required placeholder="DIVISION, DEPARTMENT…" /></label>
          <label>
            Accountable legal entity
            <select name="accountableLegalEntityPartyId">
              <option value="">Not assigned</option>
              {#each data.legalEntities as entity}
                <option value={entity.id}>{entity.displayName}</option>
              {/each}
            </select>
          </label>
          <label>Valid from<input type="date" name="validFrom" /></label>
          <label>Valid to<input type="date" name="validTo" /></label>
          <button type="submit">Create planned unit</button>
        </form>
      </details>
    {/if}
  </header>

  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <section class="metrics">
    <div class="metric section-card"><strong>{data.units.length}</strong><span>organisation units</span></div>
    <div class="metric section-card"><strong>{activeCount}</strong><span>active units</span></div>
    <div class="metric section-card"><strong>{data.hierarchy.filter((edge) => edge.status === 'ACTIVE').length}</strong><span>active hierarchy links</span></div>
    <div class="metric section-card"><strong>{data.legalEntities.length}</strong><span>legal entities</span></div>
  </section>

  <div class="workspace-grid">
    <section class="unit-register section-card">
      <div class="panel-heading">
        <div><span class="eyebrow">Structure register</span><h2>Organisation units</h2></div>
      </div>
      <div class="unit-list">
        {#each data.units as unit}
          <a
            class:active={data.selected?.id === unit.id}
            href={'?unit=' + encodeURIComponent(unit.id)}
          >
            <span class="unit-code">{unit.unitCode}</span>
            <span class="unit-copy"><strong>{unit.name}</strong><small>{unit.unitType} · {unit.status}</small></span>
            <span class={'status status-' + unit.status.toLowerCase()}>{unit.status}</span>
          </a>
        {:else}
          <p class="empty">No organisation units have been created.</p>
        {/each}
      </div>
    </section>

    <main class="inspector">
      {#if data.selected}
        <section class="section-card unit-card">
          <div class="identity-heading">
            <div>
              <span class="eyebrow">{data.selected.unitType}</span>
              <h2>{data.selected.name}</h2>
              <code>{data.selected.unitCode}</code>
            </div>
            <div class="badges">
              <span>{data.selected.status}</span>
              <span>v{data.selected.version}</span>
            </div>
          </div>

          <dl>
            <div><dt>Accountable legal entity</dt><dd>{data.selected.accountableLegalEntityName || 'Not assigned'}</dd></div>
            <div><dt>Valid from</dt><dd>{data.selected.validFrom}</dd></div>
            <div><dt>Valid to</dt><dd>{data.selected.validTo || 'Open-ended'}</dd></div>
            <div><dt>Current parent</dt><dd>{data.activeParent?.parentUnitName || 'Root unit'}</dd></div>
          </dl>

          {#if data.canManage && data.selected.status !== 'CLOSED'}
            <details class="edit-panel">
              <summary>Edit organisation unit</summary>
              <form method="POST" action="?/save">
                <input type="hidden" name="unitId" value={data.selected.id} />
                <input type="hidden" name="version" value={data.selected.version} />
                <label>Unit code<input name="unitCode" value={data.selected.unitCode} required /></label>
                <label>Unit name<input name="name" value={data.selected.name} required /></label>
                <label>Unit type<input name="unitType" value={data.selected.unitType} required /></label>
                <label>
                  Accountable legal entity
                  <select name="accountableLegalEntityPartyId">
                    <option value="">Not assigned</option>
                    {#each data.legalEntities as entity}
                      <option
                        value={entity.id}
                        selected={data.selected.accountableLegalEntityPartyId === entity.id}
                      >
                        {entity.displayName}
                      </option>
                    {/each}
                  </select>
                </label>
                <label>Valid from<input type="date" name="validFrom" value={data.selected.validFrom.slice(0, 10)} /></label>
                <label>Valid to<input type="date" name="validTo" value={data.selected.validTo?.slice(0, 10) ?? ''} /></label>
                <button type="submit">Save unit</button>
              </form>
            </details>
          {/if}

          {#if data.canManage}
            <div class="lifecycle-actions">
              {#if data.selected.status === 'PLANNED' || data.selected.status === 'INACTIVE'}
                <form method="POST" action="?/activate">
                  <input type="hidden" name="unitId" value={data.selected.id} />
                  <input type="hidden" name="version" value={data.selected.version} />
                  <button type="submit">Activate</button>
                </form>
              {/if}
              {#if data.selected.status === 'ACTIVE'}
                <form method="POST" action="?/deactivate">
                  <input type="hidden" name="unitId" value={data.selected.id} />
                  <input type="hidden" name="version" value={data.selected.version} />
                  <button class="secondary" type="submit">Deactivate</button>
                </form>
              {/if}
              {#if data.selected.status !== 'CLOSED'}
                <form method="POST" action="?/close">
                  <input type="hidden" name="unitId" value={data.selected.id} />
                  <input type="hidden" name="version" value={data.selected.version} />
                  <button class="quiet" type="submit">Close</button>
                </form>
              {/if}
            </div>
          {/if}
        </section>

        <section class="section-card hierarchy-card">
          <div class="panel-heading">
            <div><span class="eyebrow">Effective hierarchy</span><h2>Parent & children</h2></div>
            <span class="count">{children.length} children</span>
          </div>

          <div class="hierarchy-summary">
            <div class="parent-box">
              <small>Parent</small>
              <strong>{data.activeParent?.parentUnitName || 'Root unit'}</strong>
              {#if data.activeParent}<span>{data.activeParent.parentUnitCode}</span>{/if}
            </div>
            <div class="children-box">
              <small>Direct children</small>
              {#each children as edge}
                <a href={'?unit=' + encodeURIComponent(edge.childUnitId)}>
                  <strong>{edge.childUnitName}</strong><span>{edge.childUnitCode}</span>
                </a>
              {:else}
                <span class="empty">No direct children.</span>
              {/each}
            </div>
          </div>

          {#if data.canManage && data.selected.status !== 'CLOSED'}
            <div class="hierarchy-actions">
              <form method="POST" action="?/assignParent">
                <input type="hidden" name="childUnitId" value={data.selected.id} />
                <label>
                  Assign / replace parent
                  <select name="parentUnitId" required>
                    <option value="">Select parent unit</option>
                    {#each data.units.filter((unit) => unit.id !== data.selected.id && unit.status !== 'CLOSED') as unit}
                      <option value={unit.id} selected={data.activeParent?.parentUnitId === unit.id}>
                        {unit.unitCode} · {unit.name}
                      </option>
                    {/each}
                  </select>
                </label>
                <label>Effective from<input type="datetime-local" name="effectiveFrom" /></label>
                <button type="submit">Assign parent</button>
              </form>

              {#if data.activeParent}
                <form method="POST" action="?/removeParent" class="remove-parent">
                  <input type="hidden" name="childUnitId" value={data.selected.id} />
                  <input type="hidden" name="version" value={data.selected.version} />
                  <label>Effective to<input type="datetime-local" name="effectiveTo" /></label>
                  <button class="quiet" type="submit">Remove parent</button>
                </form>
              {/if}
            </div>
          {/if}
        </section>

        <section class="section-card history-card">
          <div class="panel-heading">
            <div><span class="eyebrow">Hierarchy evidence</span><h2>Relationship history</h2></div>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Child</th><th>Parent</th><th>Status</th><th>Effective</th></tr></thead>
              <tbody>
                {#each data.hierarchy.filter((edge) => edge.childUnitId === data.selected.id || edge.parentUnitId === data.selected.id) as edge}
                  <tr>
                    <td>{edge.childUnitCode}<small>{edge.childUnitName}</small></td>
                    <td>{edge.parentUnitCode}<small>{edge.parentUnitName}</small></td>
                    <td>{edge.status}</td>
                    <td>{edge.validFrom}<small>{edge.validTo || 'Open'}</small></td>
                  </tr>
                {:else}
                  <tr><td colspan="4" class="empty">No hierarchy evidence recorded.</td></tr>
                {/each}
              </tbody>
            </table>
          </div>
        </section>
      {:else}
        <section class="section-card empty-state">
          <span class="eyebrow">AGG-01-ORG-STRUCTURE</span>
          <h2>Create the first organisation unit</h2>
          <p>Organisation structure is kept separate from legal organisation identity and can evolve independently over time.</p>
        </section>
      {/if}
    </main>
  </div>
</div>

<style>
  .structure-page { display: grid; gap: 12px; }
  .hero { display: grid; grid-template-columns: minmax(0,1.45fr) minmax(300px,.65fr); gap: 24px; align-items: start; padding: 18px; border-color: #8fc9ee; background: linear-gradient(120deg,#fbfdff,#eaf6fd); }
  .eyebrow { color: var(--blue-700); font-size: 10px; font-weight: 850; letter-spacing: .07em; text-transform: uppercase; }
  h1 { margin: 3px 0 6px; font-size: 25px; }
  h2 { margin: 2px 0 0; font-size: 16px; }
  .hero p { margin: 0; max-width: 820px; color: #526a7d; font-size: 11.5px; line-height: 1.45; }
  details { border: 1px solid #d7e3ea; border-radius: 8px; background: white; }
  details > summary { padding: 9px 10px; cursor: pointer; color: #31586f; font-size: 10.5px; font-weight: 800; }
  .create-panel form { display: grid; gap: 7px; padding: 9px; border-top: 1px solid #e6ecef; }
  label { display: grid; gap: 4px; color: #496073; font-size: 9.5px; font-weight: 700; }
  input, select { width: 100%; border: 1px solid #cfdbe3; border-radius: 6px; padding: 7px 8px; background: white; color: var(--ink); font-size: 10px; }
  button { border: 0; border-radius: 6px; padding: 7px 9px; background: var(--blue-700); color: white; font-size: 9.5px; font-weight: 800; cursor: pointer; }
  button.secondary { background: #b6782d; }
  button.quiet { border: 1px solid #d7e0e6; background: white; color: #526b7e; }
  .message { padding: 9px 12px; border: 1px solid #dd8a8a; border-radius: 8px; background: #fff3f3; color: #792f2f; font-size: 11px; }
  .metrics { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 8px; }
  .metric { display: grid; gap: 2px; padding: 10px 12px; }
  .metric strong { color: #1d4f70; font-size: 19px; }
  .metric span { color: #718492; font-size: 9px; text-transform: uppercase; }
  .workspace-grid { display: grid; grid-template-columns: minmax(300px,.72fr) minmax(0,1.5fr); gap: 12px; align-items: start; }
  .unit-register { position: sticky; top: 78px; max-height: calc(100vh - 92px); overflow: auto; padding: 12px; }
  .panel-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 9px; }
  .unit-list { display: grid; gap: 4px; }
  .unit-list a { display: grid; grid-template-columns: 72px minmax(0,1fr) auto; gap: 8px; align-items: center; padding: 8px; border: 1px solid #e2e8ec; border-radius: 7px; background: #fbfcfd; color: inherit; text-decoration: none; }
  .unit-list a:hover, .unit-list a.active { border-color: #8bc6e8; background: #eff8fd; }
  .unit-code { color: #2f607d; font-size: 9px; font-weight: 850; }
  .unit-copy { display: grid; gap: 2px; min-width: 0; }
  .unit-copy strong { overflow: hidden; color: #334f63; font-size: 10.5px; text-overflow: ellipsis; white-space: nowrap; }
  .unit-copy small, td small { display: block; color: #81909b; font-size: 8.5px; }
  .status { padding: 3px 5px; border-radius: 999px; background: #edf1f4; color: #5e7180; font-size: 7.5px; font-weight: 850; text-transform: uppercase; }
  .status-active { background: #e6f5e9; color: #2c713a; }
  .status-planned { background: #fff2d9; color: #815f19; }
  .inspector { display: grid; gap: 12px; min-width: 0; }
  .unit-card, .hierarchy-card, .history-card, .empty-state { padding: 14px; }
  .identity-heading { display: flex; justify-content: space-between; gap: 14px; align-items: start; padding-bottom: 11px; border-bottom: 1px solid #e4eaee; }
  .identity-heading code { display: inline-block; margin-top: 5px; padding: 3px 5px; border-radius: 5px; background: #f2f5f7; color: #687d8d; font-size: 8px; }
  .badges { display: flex; gap: 5px; }
  .badges span, .count { padding: 4px 6px; border-radius: 999px; background: #eef2f5; color: #5f7484; font-size: 8px; font-weight: 800; }
  dl { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 10px; margin: 12px 0; }
  dl div { display: grid; gap: 2px; }
  dt { color: #7c8d99; font-size: 8px; text-transform: uppercase; }
  dd { margin: 0; color: #3f596b; font-size: 10px; }
  .edit-panel { margin-bottom: 10px; }
  .edit-panel form { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px; padding: 9px; border-top: 1px solid #e6ecef; }
  .edit-panel button { align-self: end; }
  .lifecycle-actions, .relationship-actions { display: flex; gap: 5px; }
  .hierarchy-summary { display: grid; grid-template-columns: .65fr 1.35fr; gap: 8px; }
  .parent-box, .children-box { display: grid; gap: 5px; padding: 10px; border: 1px solid #e2e8ec; border-radius: 8px; background: #fafcfd; }
  .parent-box small, .children-box > small { color: #7b8d99; font-size: 8px; text-transform: uppercase; }
  .parent-box strong { color: #36556a; font-size: 11px; }
  .parent-box span { color: #708493; font-size: 8.5px; }
  .children-box a { display: flex; justify-content: space-between; gap: 10px; padding: 6px 7px; border-radius: 6px; background: white; color: #39566a; text-decoration: none; font-size: 9.5px; }
  .children-box a span { color: #7b8d99; font-size: 8.5px; }
  .hierarchy-actions { display: grid; gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5ebef; }
  .hierarchy-actions form { display: grid; grid-template-columns: minmax(0,1fr) 220px auto; gap: 8px; align-items: end; }
  .hierarchy-actions .remove-parent { grid-template-columns: minmax(0,220px) auto; justify-content: end; }
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
  th, td { padding: 7px 8px; border-bottom: 1px solid #e8edf0; text-align: left; vertical-align: top; }
  th { background: #f6f8fa; color: #687b89; font-size: 8.5px; text-transform: uppercase; }
  .empty, .empty-state { color: #758896; font-size: 10px; }
  .empty-state { min-height: 230px; display: grid; place-content: center; text-align: center; }
  .empty-state p { max-width: 520px; margin: 7px 0 0; }
  @media(max-width:1100px) { .workspace-grid { grid-template-columns: 280px minmax(0,1fr); } dl { grid-template-columns: repeat(2,1fr); } .hierarchy-actions form { grid-template-columns: 1fr 1fr; } }
  @media(max-width:760px) { .hero, .workspace-grid, .hierarchy-summary { grid-template-columns: 1fr; } .edit-panel form { grid-template-columns: 1fr; } .metrics { grid-template-columns: repeat(2,1fr); } .unit-register { position: static; max-height: none; } dl { grid-template-columns: 1fr 1fr; } .hierarchy-actions form, .hierarchy-actions .remove-parent { grid-template-columns: 1fr; justify-content: stretch; } }
</style>
