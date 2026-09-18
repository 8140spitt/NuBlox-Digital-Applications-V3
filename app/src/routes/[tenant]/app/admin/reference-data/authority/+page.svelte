<script lang="ts">
  let { data, form } = $props();

  const kind = $derived<'approval' | 'delegated'>(
    data.kind === 'delegated' ? 'delegated' : 'approval'
  );
  const selectedRule = $derived(
    kind === 'approval' ? data.selectedApprovalRule : data.selectedDelegatedRule
  );
  const rules = $derived(kind === 'approval' ? data.approvalRules : data.delegatedRules);
  const draftVersion = $derived(data.versions.find((version) => version.status === 'DRAFT') ?? null);

  function ruleHref(kind: 'approval' | 'delegated', ruleId?: string) {
    const params = new URLSearchParams({ kind });
    if (ruleId) params.set('rule', ruleId);
    return `/${data.tenantSlug}/app/admin/reference-data/authority?${params.toString()}`;
  }
</script>

<svelte:head>
  <title>Authority Policy · NuBlox</title>
</svelte:head>

<div class="authority-page">
  <header class="hero section-card">
    <div>
      <span class="eyebrow">Reference configuration · AGG-29-AUTHORITY-CONFIG</span>
      <h1>Authority policy</h1>
      <p>
        Define the rules that govern protected decisions and Delegated Authority grants. Policy is
        configuration; it never becomes an effective grant, role assignment or decision.
      </p>
    </div>
    <div class="principle">
      <strong>Permission ≠ authority</strong>
      <span>Published policy constrains runtime authority evaluation.</span>
      <small>Material rule changes create new immutable versions rather than rewriting history.</small>
    </div>
  </header>

  {#if form?.message}
    <div class="message" role="alert">{form.message}</div>
  {/if}

  <div class="tabs">
    <a class:active={kind === 'approval'} href={ruleHref('approval')}>Approval authority</a>
    <a class:active={kind === 'delegated'} href={ruleHref('delegated')}>Delegated authority</a>
  </div>

  <div class="workspace-grid">
    <aside class="rule-list section-card">
      <div class="panel-heading">
        <div>
          <span class="eyebrow">{kind === 'approval' ? 'Approval rules' : 'Delegation rules'}</span>
          <h2>{rules.length} policies</h2>
        </div>
      </div>

      <nav aria-label="Authority policy rules">
        {#each rules as rule}
          <a class:active={selectedRule?.id === rule.id} href={ruleHref(kind, rule.id)}>
            <strong>{rule.ruleKey}</strong>
            <span>
              {kind === 'approval'
                ? data.approvalRules.find((entry) => entry.id === rule.id)?.actionKey
                : data.delegatedRules.find((entry) => entry.id === rule.id)?.authorityType}
            </span>
            <small>aggregate v{rule.version} · {rule.status}</small>
          </a>
        {:else}
          <p class="empty-copy">No policy rules have been configured.</p>
        {/each}
      </nav>

      {#if data.capabilities.canManage}
        <details class="command-panel">
          <summary>New {kind === 'approval' ? 'approval' : 'delegation'} policy</summary>
          {#if kind === 'approval'}
            <form method="POST" action="?/createApproval">
              <label>Rule key<input name="ruleKey" required placeholder="COMMERCIAL.APPROVAL.TIER1" /></label>
              <label>Protected action<input name="actionKey" required placeholder="COMMERCIAL_APPROVAL" /></label>
              <label>Object type<input name="objectType" required placeholder="COMMERCIAL_COMMITMENT" /></label>
              <label>Required authority<input name="requiredAuthorityType" required placeholder="COMMERCIAL_COMMITMENT" /></label>
              <div class="form-grid">
                <label>Scope type<input name="scopeType" placeholder="TENANT" /></label>
                <label>Scope ID<input name="scopeId" placeholder="Optional exact scope" /></label>
                <label>Currency<input name="currencyCode" maxlength="3" placeholder="GBP" /></label>
                <label>Minimum value<input name="minimumValue" type="number" min="0" step="0.01" /></label>
                <label>Maximum value<input name="maximumValue" type="number" min="0" step="0.01" /></label>
              </div>
              <button type="submit">Create draft policy</button>
            </form>
          {:else}
            <form method="POST" action="?/createDelegated">
              <label>Rule key<input name="ruleKey" required placeholder="COMMERCIAL.DELEGATION" /></label>
              <label>Authority type<input name="authorityType" required placeholder="COMMERCIAL_COMMITMENT" /></label>
              <label>Allowed scope type<input name="allowedScopeType" required placeholder="TENANT" /></label>
              <label>Allowed scope ID<input name="allowedScopeId" placeholder="Optional exact scope" /></label>
              <div class="form-grid">
                <label>Currency<input name="currencyCode" maxlength="3" placeholder="GBP" /></label>
                <label>Maximum value<input name="maximumValue" type="number" min="0" step="0.01" /></label>
                <label>Maximum duration (days)<input name="maximumDurationDays" type="number" min="1" step="1" /></label>
              </div>
              <label class="check"><input name="allowSubdelegation" type="checkbox" />Permit subdelegation</label>
              <button type="submit">Create draft policy</button>
            </form>
          {/if}
        </details>
      {/if}
    </aside>

    <main class="main-column">
      {#if selectedRule}
        <section class="rule-header section-card">
          <div>
            <span class="eyebrow">{kind === 'approval' ? 'Approval Authority Rule' : 'Delegated Authority Rule'}</span>
            <h2>{selectedRule.ruleKey}</h2>
            <p>
              {kind === 'approval'
                ? `${data.selectedApprovalRule?.actionKey} · ${data.selectedApprovalRule?.objectType}`
                : data.selectedDelegatedRule?.authorityType}
            </p>
          </div>
          <div class="facts">
            <span><small>Aggregate version</small><strong>{selectedRule.version}</strong></span>
            <span><small>Versions</small><strong>{data.versions.length}</strong></span>
            <span><small>Status</small><strong>{selectedRule.status}</strong></span>
          </div>
        </section>

        <section class="versions section-card">
          <div class="panel-heading">
            <div>
              <span class="eyebrow">Immutable policy history</span>
              <h2>{data.versions.length} versions</h2>
            </div>
            {#if data.capabilities.canManage && !draftVersion}
              <details class="command-panel compact">
                <summary>Create revision</summary>
                {#if kind === 'approval'}
                  <form method="POST" action="?/reviseApproval">
                    <input type="hidden" name="ruleId" value={selectedRule.id} />
                    <input type="hidden" name="ruleVersion" value={selectedRule.version} />
                    <label>Required authority<input name="requiredAuthorityType" required /></label>
                    <div class="form-grid">
                      <label>Scope type<input name="scopeType" /></label>
                      <label>Scope ID<input name="scopeId" /></label>
                      <label>Currency<input name="currencyCode" maxlength="3" /></label>
                      <label>Minimum value<input name="minimumValue" type="number" min="0" step="0.01" /></label>
                      <label>Maximum value<input name="maximumValue" type="number" min="0" step="0.01" /></label>
                    </div>
                    <button type="submit">Create new draft version</button>
                  </form>
                {:else}
                  <form method="POST" action="?/reviseDelegated">
                    <input type="hidden" name="ruleId" value={selectedRule.id} />
                    <input type="hidden" name="ruleVersion" value={selectedRule.version} />
                    <label>Allowed scope type<input name="allowedScopeType" required /></label>
                    <label>Allowed scope ID<input name="allowedScopeId" /></label>
                    <div class="form-grid">
                      <label>Currency<input name="currencyCode" maxlength="3" /></label>
                      <label>Maximum value<input name="maximumValue" type="number" min="0" step="0.01" /></label>
                      <label>Maximum duration<input name="maximumDurationDays" type="number" min="1" step="1" /></label>
                    </div>
                    <label class="check"><input name="allowSubdelegation" type="checkbox" />Permit subdelegation</label>
                    <button type="submit">Create new draft version</button>
                  </form>
                {/if}
              </details>
            {/if}
          </div>

          <div class="version-list">
            {#each data.versions as version}
              <article>
                <div>
                  <strong>v{version.versionNo}</strong>
                  <span class:published={version.status === 'PUBLISHED'} class="status">{version.status}</span>
                </div>
                {#if kind === 'approval'}
                  <p>
                    {version.requiredAuthorityType} ·
                    {version.currencyCode || 'non-monetary'}
                    {#if version.maximumValue} · max {Number(version.maximumValue).toLocaleString('en-GB')}{/if}
                  </p>
                {:else}
                  <p>
                    {version.allowedScopeType}
                    {#if version.maximumValue} · max {Number(version.maximumValue).toLocaleString('en-GB')} {version.currencyCode}{/if}
                    {#if version.maximumDurationDays} · {version.maximumDurationDays} days{/if}
                  </p>
                {/if}
                {#if version.status === 'DRAFT' && data.capabilities.canPublish}
                  <form method="POST" action={kind === 'approval' ? '?/publishApproval' : '?/publishDelegated'}>
                    <input type="hidden" name="ruleId" value={selectedRule.id} />
                    <input type="hidden" name="versionId" value={version.id} />
                    <input type="hidden" name="ruleVersion" value={selectedRule.version} />
                    <button type="submit">Publish version</button>
                  </form>
                {/if}
              </article>
            {/each}
          </div>
        </section>
      {:else}
        <section class="empty-state section-card">
          <span class="eyebrow">Authority governance</span>
          <h2>Create the first policy rule</h2>
          <p>Published policy constrains runtime decisions and grants; it does not create authority itself.</p>
        </section>
      {/if}
    </main>
  </div>
</div>

<style>
  .authority-page { display: grid; gap: 12px; }
  .hero { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(290px, .65fr); gap: 24px; padding: 18px; border-color: #8fc9ee; background: linear-gradient(120deg, #fbfdff, #eaf6fd); }
  .eyebrow { color: var(--blue-700); font-size: 10px; font-weight: 850; letter-spacing: .07em; text-transform: uppercase; }
  h1 { margin: 3px 0 6px; font-size: 25px; }
  h2 { margin: 2px 0 0; font-size: 16px; }
  p { color: #5f7484; font-size: 10px; line-height: 1.45; }
  .hero p { margin: 0; max-width: 760px; font-size: 11.5px; }
  .principle { display: grid; gap: 5px; padding: 12px; border: 1px solid #bddded; border-radius: 9px; background: white; }
  .principle strong { color: #315d76; font-size: 11px; }
  .principle span { color: #526d7d; font-size: 9.5px; }
  .principle small { color: #7b8e9a; font-size: 8.5px; line-height: 1.4; }
  .message { padding: 9px 12px; border: 1px solid #dd8a8a; border-radius: 8px; background: #fff3f3; color: #792f2f; font-size: 11px; }
  .tabs { display: flex; gap: 6px; }
  .tabs a { padding: 7px 10px; border: 1px solid #dce5ea; border-radius: 7px; background: white; color: #617584; font-size: 10px; font-weight: 800; text-decoration: none; }
  .tabs a.active { border-color: #79bde2; background: #edf8fe; color: #245876; }
  .workspace-grid { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 12px; align-items: start; }
  .rule-list { position: sticky; top: 78px; padding: 12px; }
  .main-column { display: grid; gap: 12px; min-width: 0; }
  .panel-heading { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 10px; }
  nav { display: grid; gap: 6px; }
  nav a { display: grid; gap: 3px; padding: 9px; border: 1px solid #e0e7ec; border-radius: 8px; color: inherit; background: #fafcfd; text-decoration: none; }
  nav a.active { border-color: #79bde2; background: #edf8fe; box-shadow: inset 3px 0 var(--blue-700); }
  nav strong { font-size: 10.5px; }
  nav span, nav small { color: #788a97; font-size: 8.5px; }
  .command-panel { margin-top: 10px; padding-top: 9px; border-top: 1px solid #e5ebef; }
  .command-panel.compact { margin: 0; padding: 0; border: 0; }
  .command-panel summary { width: max-content; padding: 6px 8px; border-radius: 6px; background: #edf5fa; color: #35617d; font-size: 9px; font-weight: 800; cursor: pointer; }
  form { display: grid; gap: 7px; }
  .command-panel form { margin-top: 8px; }
  .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }
  label { display: grid; gap: 4px; color: #52697a; font-size: 9px; font-weight: 750; }
  label.check { display: flex; align-items: center; gap: 6px; }
  input { width: 100%; border: 1px solid #ccd8e0; border-radius: 6px; padding: 7px 8px; color: var(--ink); font-size: 9.5px; }
  .check input { width: auto; }
  button { border: 0; border-radius: 6px; padding: 7px 9px; background: var(--blue-700); color: white; font-size: 9px; font-weight: 800; cursor: pointer; }
  .rule-header { display: flex; justify-content: space-between; gap: 18px; padding: 14px; }
  .rule-header p { margin: 5px 0 0; }
  .facts { display: flex; flex-wrap: wrap; gap: 6px; }
  .facts span { display: grid; gap: 2px; min-width: 105px; padding: 6px 8px; border-radius: 6px; background: #f4f7f9; }
  .facts small { color: #86959f; font-size: 7.5px; text-transform: uppercase; }
  .facts strong { color: #405d70; font-size: 9px; }
  .versions { padding: 14px; }
  .version-list { display: grid; gap: 7px; }
  .version-list article { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-items: center; padding: 9px 10px; border: 1px solid #e1e8ec; border-radius: 8px; background: #fafcfd; }
  .version-list article > div { display: flex; gap: 6px; align-items: center; }
  .version-list p { grid-column: 1; margin: 0; }
  .status { padding: 2px 5px; border-radius: 999px; background: #fff3d9; color: #805d19; font-size: 7.5px; font-weight: 850; }
  .status.published { background: #e6f5e9; color: #2b6c39; }
  .empty-copy { padding: 10px 4px; color: #81909a; }
  .empty-state { display: grid; place-content: center; min-height: 250px; padding: 24px; text-align: center; }
  @media (max-width: 760px) {
    .hero, .workspace-grid, .form-grid { grid-template-columns: 1fr; }
    .rule-list { position: static; }
    .rule-header, .panel-heading { display: grid; }
  }
</style>
