<script lang="ts">
  let { data, form } = $props();
  function href(id: string) {
    return `/${data.tenantSlug}/app/functions/f02/delegation-of-authority?grant=${encodeURIComponent(id)}`;
  }
</script>

<svelte:head><title>Delegation of Authority · NuBlox</title></svelte:head>

<div class="page">
  <nav class="crumb">
    <a href={`/${data.tenantSlug}/app/functions/f02`}>F02 Corporate Governance</a><span>›</span
    ><strong>F02.03 Delegation of Authority</strong>
  </nav>
  <header class="hero section-card">
    <div>
      <span class="eyebrow">F02.03 · AGG-01-AUTHORITY</span>
      <h1>Delegation of authority</h1>
      <p>
        Create and govern effective decision/commitment authority grants against published
        delegation policy.
      </p>
    </div>
    <aside>
      <strong>Grant ≠ role</strong><span
        >Membership, permission, policy and Delegated Authority remain distinct controls.</span
      >{#if data.capabilities.canReadPolicy}<a
          href={`/${data.tenantSlug}/app/admin/reference-data/authority?kind=delegated`}
          >Manage delegation policy →</a
        >{/if}
    </aside>
  </header>
  {#if form?.message}<div class="error">{form.message}</div>{/if}

  <div class="grid">
    <aside class="section-card list">
      <div>
        <span class="eyebrow">Grant register</span>
        <h2>{data.grants.length} grants</h2>
      </div>
      <nav>
        {#each data.grants as grant}<a
            class:active={data.selected?.id === grant.id}
            href={href(grant.id)}
            ><strong>{grant.delegateDisplayName}</strong><span>{grant.authorityType}</span><small
              >{grant.status} · v{grant.version}</small
            ></a
          >{:else}<p>No grants recorded.</p>{/each}
      </nav>
      {#if data.capabilities.canManage}
        <details>
          <summary>Create grant</summary>
          <form method="POST" action="?/create">
            <label
              >Delegate<select name="delegatePartyId" required
                ><option value="">Select Party</option>{#each data.parties as party}<option
                    value={party.id}>{party.displayName}</option
                  >{/each}</select
              ></label
            >
            <label
              >Authority type<input
                name="authorityType"
                required
                placeholder="COMMERCIAL_COMMITMENT"
              /></label
            >
            <label>Basis<textarea name="basis" rows="3" required></textarea></label>
            <div class="pair">
              <label>Scope type<input name="scopeType" required placeholder="TENANT" /></label
              ><label>Scope ID<input name="scopeId" required value={data.tenantSlug} /></label>
            </div>
            <div class="pair">
              <label>Currency<input name="currencyCode" maxlength="3" placeholder="GBP" /></label
              ><label
                >Value limit<input name="valueLimit" type="number" min="0" step="0.01" /></label
              >
            </div>
            <div class="pair">
              <label>Valid from<input name="validFrom" type="date" /></label><label
                >Valid to<input name="validTo" type="date" /></label
              >
            </div>
            <label class="check"
              ><input name="allowSubdelegation" type="checkbox" />Permit subdelegation</label
            >
            <button>Create draft grant</button>
          </form>
        </details>
      {/if}
    </aside>

    <main>
      {#if data.selected}
        <section class="section-card detail">
          <div class="head">
            <div>
              <span class="eyebrow">{data.selected.authorityType}</span>
              <h2>{data.selected.delegateDisplayName}</h2>
            </div>
            <strong>{data.selected.status}</strong>
          </div>
          <div class="facts">
            <span><small>Grantor</small><b>{data.selected.grantorDisplayName}</b></span><span
              ><small>Scope</small><b>{data.selected.scopeType}</b></span
            ><span
              ><small>Limit</small><b
                >{data.selected.valueLimit
                  ? data.selected.currencyCode +
                    ' ' +
                    Number(data.selected.valueLimit).toLocaleString('en-GB')
                  : 'Non-monetary'}</b
              ></span
            ><span><small>Version</small><b>v{data.selected.version}</b></span>
          </div>
          <div class="basis">
            <span class="eyebrow">Basis</span>
            <p>{data.selected.basis}</p>
          </div>
          <div class="policy">
            <span class="eyebrow">Policy evidence</span>{#if data.selected.policyRuleId}<p>
                <strong>{data.selected.policyRuleKey}</strong> · policy v{data.selected
                  .policyVersionNo}
              </p>{:else}<p>No published policy was pinned to this grant.</p>{/if}
          </div>

          {#if data.capabilities.canApprove && data.selected.status === 'DRAFT'}<form
              method="POST"
              action="?/approve"
            >
              <input type="hidden" name="grantId" value={data.selected.id} /><input
                type="hidden"
                name="version"
                value={data.selected.version}
              /><button>Approve grant</button>
            </form>{/if}
          {#if data.capabilities.canManage && data.selected.status === 'APPROVED'}<form
              method="POST"
              action="?/activate"
            >
              <input type="hidden" name="grantId" value={data.selected.id} /><input
                type="hidden"
                name="version"
                value={data.selected.version}
              /><button>Activate grant</button>
            </form>{/if}
          {#if data.capabilities.canManage && data.selected.status === 'ACTIVE'}<form
              method="POST"
              action="?/suspend"
            >
              <input type="hidden" name="grantId" value={data.selected.id} /><input
                type="hidden"
                name="version"
                value={data.selected.version}
              /><button class="quiet">Suspend</button>
            </form>{/if}
          {#if data.capabilities.canManage && ['DRAFT', 'APPROVED', 'ACTIVE', 'SUSPENDED'].includes(data.selected.status)}
            <form method="POST" action="?/revoke">
              <input type="hidden" name="grantId" value={data.selected.id} /><input
                type="hidden"
                name="version"
                value={data.selected.version}
              /><label>Revocation reason<textarea name="reason" rows="2" required></textarea></label
              ><button class="danger">Revoke</button>
            </form>
          {/if}
        </section>
      {:else}<section class="section-card empty">
          <h2>Create the first Delegated Authority grant</h2>
        </section>{/if}
    </main>
  </div>
</div>

<style>
  .page {
    display: grid;
    gap: 12px;
  }
  .crumb {
    display: flex;
    gap: 7px;
    font-size: 9px;
  }
  .crumb a {
    text-decoration: none;
  }
  .hero {
    display: grid;
    grid-template-columns: 1.5fr 0.65fr;
    gap: 20px;
    padding: 18px;
    background: linear-gradient(120deg, #fbfdff, #eaf6fd);
    border-color: #8fc9ee;
  }
  .hero aside {
    display: grid;
    gap: 6px;
    padding: 12px;
    background: white;
    border: 1px solid #bddded;
    border-radius: 8px;
  }
  .hero aside span,
  p,
  .hero aside a {
    font-size: 10px;
  }
  .eyebrow {
    font-size: 9px;
    font-weight: 850;
    letter-spacing: 0.07em;
    color: var(--blue-700);
    text-transform: uppercase;
  }
  h1 {
    margin: 3px 0 6px;
    font-size: 25px;
  }
  h2 {
    margin: 2px 0;
    font-size: 16px;
  }
  .error {
    padding: 8px 10px;
    background: #fff2f2;
    border: 1px solid #e2aaaa;
    border-radius: 7px;
  }
  .grid {
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr);
    gap: 12px;
    align-items: start;
  }
  .list,
  .detail {
    padding: 12px;
  }
  .list > nav {
    display: grid;
    gap: 6px;
    margin-top: 10px;
  }
  .list > nav a {
    display: grid;
    gap: 3px;
    padding: 8px;
    border: 1px solid #dfe7ec;
    border-radius: 7px;
    text-decoration: none;
    color: inherit;
  }
  .list > nav a.active {
    border-color: #79bde2;
    background: #edf8fe;
  }
  .list > nav span,
  .list > nav small {
    font-size: 8px;
    color: #788a97;
  }
  details {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid #e6ecef;
  }
  summary {
    font-size: 9px;
    font-weight: 800;
    cursor: pointer;
  }
  form {
    display: grid;
    gap: 7px;
    margin-top: 10px;
  }
  label {
    display: grid;
    gap: 3px;
    font-size: 9px;
    font-weight: 700;
  }
  input,
  select,
  textarea {
    width: 100%;
    padding: 7px;
    border: 1px solid #ccd8e0;
    border-radius: 6px;
    font-size: 9px;
  }
  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 7px;
  }
  .check {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .check input {
    width: auto;
  }
  button {
    border: 0;
    border-radius: 6px;
    padding: 7px 9px;
    background: var(--blue-700);
    color: white;
    font-size: 9px;
    font-weight: 800;
  }
  button.quiet {
    background: white;
    color: #4e697b;
    border: 1px solid #d5e0e6;
  }
  button.danger {
    background: #8e3434;
  }
  .head {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .facts {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin: 10px 0;
  }
  .facts span {
    display: grid;
    gap: 2px;
    min-width: 120px;
    padding: 6px;
    background: #f4f7f9;
    border-radius: 6px;
  }
  .facts small {
    font-size: 7px;
  }
  .facts b {
    font-size: 9px;
  }
  .basis,
  .policy {
    margin-top: 10px;
    padding: 9px;
    border: 1px solid #e2e9ed;
    border-radius: 7px;
  }
  .basis p,
  .policy p {
    margin: 4px 0;
    font-size: 9px;
  }
  .empty {
    min-height: 220px;
    display: grid;
    place-content: center;
  }
  @media (max-width: 800px) {
    .hero,
    .grid,
    .pair {
      grid-template-columns: 1fr;
    }
  }
</style>
