<script lang="ts">
  let { data, form } = $props();

  function href(id: string) {
    return `/${data.tenantSlug}/app/functions/f02/governance-bodies?body=${encodeURIComponent(id)}`;
  }

  function memberRows() {
    return data.memberships
      .filter((row) => row.status === 'ACTIVE')
      .map((row) => [row.partyId, row.roleKey].join(' | '))
      .join('\n');
  }
</script>

<svelte:head><title>Governance Bodies · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f02`}>F02 Corporate Governance</a>
    <span>›</span><strong>Board & Committee Governance</strong>
  </nav>

  <header class="hero section-card">
    <div>
      <span class="eyebrow">F02.01 / F02.05 · AGG-02-GOVERNANCE</span>
      <h1>Governance bodies</h1>
      <p>Constitute Boards, Committees and Steering Bodies with stable identity, immutable terms, effective membership and explicit quorum.</p>
    </div>
    <div class="principle">
      <strong>Membership ≠ authority</strong>
      <span>Being a Board or Committee member does not grant approval authority.</span>
      <small>Decision rights remain governed by Authority Framework, role and Delegated Authority.</small>
    </div>
  </header>

  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <div><span class="eyebrow">Body register</span><h2>{data.bodies.length} bodies</h2></div>
      <nav class="body-list">
        {#each data.bodies as body}
          <a class:active={data.selected?.id === body.id} href={href(body.id)}>
            <div><strong>{body.bodyRef}</strong><span class={'status ' + body.status.toLowerCase()}>{body.status}</span></div>
            <p>{body.name}</p><small>{body.bodyType} · v{body.currentVersionNo}</small>
          </a>
        {:else}<p class="empty">No Governance Bodies configured.</p>{/each}
      </nav>

      {#if data.capabilities.canManage}
        <details class="command">
          <summary>Create governance body</summary>
          <form method="POST" action="?/create">
            <label>Reference<input name="bodyRef" required placeholder="BOARD-MAIN" /></label>
            <label>Name<input name="name" required placeholder="Main Board" /></label>
            <label>Type<select name="bodyType"><option>BOARD</option><option>COMMITTEE</option><option>STEERING_BODY</option></select></label>
            <label>Mandate<textarea name="mandate" rows="3" required></textarea></label>
            <label>Terms of reference<textarea name="termsOfReference" rows="4" required></textarea></label>
            <div class="grid">
              <label>Scope type<input name="scopeType" required value="TENANT" /></label>
              <label>Scope ID<input name="scopeId" required /></label>
              <label>Quorum<input name="quorumRequired" type="number" min="1" value="2" required /></label>
              <label>Chair Party ID<input name="chairPartyId" required value={data.actorPartyId} /></label>
              <label>Secretariat Party ID<input name="secretariatPartyId" required /></label>
            </div>
            <label>Membership rules<textarea name="membershipRules" rows="3" required></textarea></label>
            <label>Members<textarea name="members" rows="6" required></textarea><small>Party ID | CHAIR / SECRETARY / MEMBER / OBSERVER</small></label>
            <button>Create proposed body</button>
          </form>
        </details>
      {/if}
    </aside>

    <main class="main">
      {#if data.selected}
        <section class="section-card detail">
          <div class="head">
            <div><span class="eyebrow">{data.selected.bodyType}</span><h2>{data.selected.bodyRef} · {data.selected.name}</h2></div>
            <span class={'status large ' + data.selected.status.toLowerCase()}>{data.selected.status}</span>
          </div>
          <div class="meeting-link">
            <a href={`/${data.tenantSlug}/app/functions/f02/governance-bodies/meetings?body=${encodeURIComponent(data.selected.id)}`}>Open Board / Committee meetings →</a>
          </div>
          <div class="facts">
            <span><small>Aggregate</small><strong>v{data.selected.aggregateVersion}</strong></span>
            <span><small>Configuration</small><strong>v{data.selected.currentVersionNo}</strong></span>
            <span><small>Quorum</small><strong>{data.selected.quorumRequired}</strong></span>
            <span><small>Active members</small><strong>{data.memberships.filter((row) => row.status === 'ACTIVE').length}</strong></span>
          </div>
          <div class="cards">
            <article><span class="eyebrow">Mandate</span><p>{data.selected.mandate}</p></article>
            <article><span class="eyebrow">Terms of reference</span><p>{data.selected.termsOfReference}</p></article>
            <article><span class="eyebrow">Membership rules</span><p>{data.selected.membershipRules}</p></article>
            <article><span class="eyebrow">Governance scope</span><p>{data.selected.scopeType} · {data.selected.scopeId}</p></article>
          </div>

          {#if data.capabilities.canApprove}
            <form method="POST" action="?/transition" class="actions">
              <input type="hidden" name="bodyId" value={data.selected.id} />
              <input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion} />
              {#if data.selected.status === 'PROPOSED'}<button name="action" value="CONSTITUTE">Constitute body</button>{/if}
              {#if data.selected.status === 'CONSTITUTED' || data.selected.status === 'SUSPENDED'}<button name="action" value="ACTIVATE">Activate</button>{/if}
              {#if data.selected.status === 'ACTIVE'}<button class="quiet" name="action" value="SUSPEND">Suspend</button>{/if}
              {#if ['CONSTITUTED','ACTIVE','SUSPENDED'].includes(data.selected.status)}<button class="danger" name="action" value="DISSOLVE">Dissolve</button>{/if}
            </form>
          {/if}
        </section>

        <div class="two">
          <section class="section-card panel">
            <span class="eyebrow">Effective membership</span><h2>{data.memberships.length} membership records</h2>
            <div class="rows">
              {#each data.memberships as member}
                <article>
                  <div><strong>{member.roleKey}</strong><span class={'status ' + member.status.toLowerCase()}>{member.status}</span></div>
                  <small>{member.partyId}</small>
                  {#if data.capabilities.canManage && member.status === 'ACTIVE' && member.partyId !== data.selected.chairPartyId && member.partyId !== data.selected.secretariatPartyId}
                    <form method="POST" action="?/endMember">
                      <input type="hidden" name="bodyId" value={data.selected.id} />
                      <input type="hidden" name="membershipId" value={member.id} />
                      <input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion} />
                      <button class="quiet">End membership</button>
                    </form>
                  {/if}
                </article>
              {/each}
            </div>
            {#if data.capabilities.canManage && data.selected.status !== 'DISSOLVED'}
              <details class="command"><summary>Add member</summary>
                <form method="POST" action="?/addMember">
                  <input type="hidden" name="bodyId" value={data.selected.id} />
                  <input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion} />
                  <label>Party ID<input name="partyId" required /></label>
                  <label>Role<input name="roleKey" required placeholder="MEMBER" /></label>
                  <button>Add effective member</button>
                </form>
              </details>
            {/if}
          </section>

          <section class="section-card panel">
            <span class="eyebrow">Immutable configuration</span><h2>{data.versions.length} versions</h2>
            <div class="rows">
              {#each data.versions as version}
                <article>
                  <div><strong>v{version.versionNo}</strong><span class={'status ' + version.lifecycleStatus.toLowerCase()}>{version.lifecycleStatus}</span></div>
                  <p>{version.mandate}</p><small>Quorum {version.quorumRequired}</small>
                </article>
              {/each}
            </div>
          </section>
        </div>

        {#if data.capabilities.canManage && (data.selected.status === 'PROPOSED' || data.selected.status === 'SUSPENDED')}
          <section class="section-card panel">
            <details class="command" open><summary>Revise governance configuration</summary>
              <form method="POST" action="?/revise">
                <input type="hidden" name="bodyId" value={data.selected.id} />
                <input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion} />
                <input type="hidden" name="bodyRef" value={data.selected.bodyRef} />
                <label>Name<input name="name" required value={data.selected.name} /></label>
                <label>Type<select name="bodyType"><option selected={data.selected.bodyType === 'BOARD'}>BOARD</option><option selected={data.selected.bodyType === 'COMMITTEE'}>COMMITTEE</option><option selected={data.selected.bodyType === 'STEERING_BODY'}>STEERING_BODY</option></select></label>
                <label>Mandate<textarea name="mandate" rows="3" required>{data.selected.mandate}</textarea></label>
                <label>Terms of reference<textarea name="termsOfReference" rows="4" required>{data.selected.termsOfReference}</textarea></label>
                <div class="grid">
                  <label>Scope type<input name="scopeType" required value={data.selected.scopeType} /></label>
                  <label>Scope ID<input name="scopeId" required value={data.selected.scopeId} /></label>
                  <label>Quorum<input name="quorumRequired" type="number" min="1" required value={data.selected.quorumRequired} /></label>
                  <label>Chair Party ID<input name="chairPartyId" required value={data.selected.chairPartyId} /></label>
                  <label>Secretariat Party ID<input name="secretariatPartyId" required value={data.selected.secretariatPartyId} /></label>
                </div>
                <label>Membership rules<textarea name="membershipRules" rows="3" required>{data.selected.membershipRules}</textarea></label>
                <label>Members<textarea name="members" rows="6" required value={memberRows()}></textarea></label>
                <button>Create new configuration version</button>
              </form>
            </details>
          </section>
        {/if}
      {:else}
        <section class="section-card empty-state"><h2>Constitute the first Governance Body</h2><p>Create the Board or Committee identity, its mandate, quorum and effective membership here.</p></section>
      {/if}
    </main>
  </div>
</div>

<style>
.page{display:grid;gap:12px}.breadcrumb{display:flex;gap:7px;align-items:center;font-size:9px;color:#728694}.breadcrumb a{color:#315f7d;text-decoration:none}.hero{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(290px,.65fr);gap:24px;padding:18px;border-color:#8fc9ee;background:linear-gradient(120deg,#fbfdff,#eaf6fd)}.eyebrow{color:var(--blue-700);font-size:10px;font-weight:850;letter-spacing:.07em;text-transform:uppercase}h1{margin:3px 0 6px;font-size:25px}h2{margin:2px 0 0;font-size:16px}p{color:#5f7484;font-size:10px;line-height:1.45}.hero p{margin:0;max-width:760px;font-size:11.5px}.principle{display:grid;gap:5px;padding:12px;border:1px solid #bddded;border-radius:9px;background:white}.principle strong{color:#315d76;font-size:11px}.principle span{color:#526d7d;font-size:9.5px}.principle small{color:#7b8e9a;font-size:8.5px}.message{padding:9px 12px;border:1px solid #dd8a8a;border-radius:8px;background:#fff3f3;color:#792f2f;font-size:11px}.workspace{display:grid;grid-template-columns:340px minmax(0,1fr);gap:12px;align-items:start}.register{position:sticky;top:78px;padding:12px}.body-list,.rows{display:grid;gap:6px;margin-top:10px}.body-list a,.rows article{display:grid;gap:5px;padding:9px;border:1px solid #e0e7ec;border-radius:8px;background:#fafcfd;color:inherit;text-decoration:none}.body-list a.active{border-color:#79bde2;background:#edf8fe;box-shadow:inset 3px 0 var(--blue-700)}.body-list a>div,.head,.rows article>div{display:flex;justify-content:space-between;gap:8px}.body-list strong{font-size:9.5px;color:#315b75}.body-list p,.rows p{margin:0}.body-list small,.rows small{color:#788a97;font-size:8px}.status{width:max-content;padding:2px 5px;border-radius:999px;background:#eef2f5;color:#607483;font-size:7.5px;font-weight:850}.status.active,.status.constituted{background:#e6f5e9;color:#2b6c39}.status.suspended{background:#fff3d9;color:#805d19}.status.dissolved{background:#fdeaea;color:#8d3232}.status.large{padding:4px 7px;font-size:8.5px}.command{margin-top:10px;padding-top:9px;border-top:1px solid #e5ebef}.command summary{width:max-content;padding:6px 8px;border-radius:6px;background:#edf5fa;color:#35617d;font-size:9px;font-weight:800;cursor:pointer}form{display:grid;gap:7px;margin-top:8px}label{display:grid;gap:4px;color:#52697a;font-size:9px;font-weight:750}label small{font-weight:400;color:#81909a}input,select,textarea{width:100%;border:1px solid #ccd8e0;border-radius:6px;padding:7px 8px;background:white;color:var(--ink);font-size:9.5px}textarea{resize:vertical;font-family:inherit}.grid,.two,.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}button{border:0;border-radius:6px;padding:7px 9px;background:var(--blue-700);color:white;font-size:9px;font-weight:800;cursor:pointer}button.quiet{background:white;color:#4e697b;border:1px solid #d5e0e6}button.danger{background:#934444}.main{display:grid;gap:12px;min-width:0}.detail,.panel{padding:14px}.meeting-link{margin-top:10px}.meeting-link a{display:inline-flex;padding:7px 9px;border:1px solid #b9d9eb;border-radius:6px;background:#edf8fe;color:#315f7d;font-size:9px;font-weight:800;text-decoration:none}.facts{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}.facts span{display:grid;gap:2px;min-width:110px;padding:6px 8px;border-radius:6px;background:#f4f7f9}.facts small{color:#86959f;font-size:7.5px;text-transform:uppercase}.facts strong{color:#405d70;font-size:9px}.cards article{padding:10px;border:1px solid #e3e9ed;border-radius:8px;background:#fafcfd}.cards p{margin:4px 0 0}.actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.actions input{display:none}.empty,.empty-state{color:#81909a}.empty-state{min-height:220px;display:grid;place-content:center;padding:24px;text-align:center}@media(max-width:850px){.hero,.workspace,.grid,.two,.cards{grid-template-columns:1fr}.register{position:static}}
</style>
