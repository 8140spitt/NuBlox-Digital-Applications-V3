<script lang="ts">
  import { page } from '$app/state';
  import { enterpriseFunctions } from '$lib/enterprise/functions';
  let { tenantSlug } = $props();

  function isCurrentFunction(functionId: string) {
    return page.url.pathname.includes('/functions/' + functionId.toLowerCase());
  }
</script>

<aside class="sidebar">
  <section>
    <p class="label">Workspace</p>
    <a
      class="utility"
      class:active={page.url.pathname === `/${tenantSlug}/app`}
      href={`/${tenantSlug}/app`}>⌂ <span>Home</span></a
    >
    <a
      class="utility"
      class:active={page.url.pathname.includes('/app/work')}
      href={`/${tenantSlug}/app/work`}>▣ <span>My work</span></a
    >
  </section>

  <section class="functions">
    <p class="label">Business functions</p>
    <div class="function-list">
      {#each enterpriseFunctions as fn}
        <a
          class="function"
          class:active={isCurrentFunction(fn.id)}
          class:mapped={fn.state === 'planned'}
          href={`/${tenantSlug}/app/functions/${fn.id.toLowerCase()}`}
          title={fn.state === 'active' ? fn.name : fn.name + ' — governed execution map'}
        >
          <span class="fn-id">{fn.id}</span><span>{fn.shortName}</span>
        </a>
      {/each}
    </div>
  </section>

  <section class="admin">
    <p class="label">Administration</p>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/security`}
      ><span>◈</span>Security & access</a
    >
    <a class="admin-item" href={`/${tenantSlug}/app/admin/master-data/parties`}
      ><span>◎</span>Party master data</a
    >
    <a class="admin-item" href={`/${tenantSlug}/app/admin/master-data/organisation-structure`}
      ><span>▦</span>Organisation structure</a
    >
    <a class="admin-item" href={`/${tenantSlug}/app/admin/reference-data`}
      ><span>⌁</span>Reference data</a
    >
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects`}
      ><span>◇</span>Business object model</a
    >
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/coverage-audit`}
      ><span>✓</span>Coverage audit</a
    >
    <a class="admin-item" href={`/${tenantSlug}/app/functions`}><span>◫</span>Function directory</a>

    <details class="admin-group">
      <summary>Architecture views</summary>
      <div class="admin-group-links">
        <a href={`/${tenantSlug}/app/admin/business-objects/foundation`}>Foundation semantics</a>
        <a href={`/${tenantSlug}/app/admin/business-objects/authority`}>Authority & participation</a
        >
        <a href={`/${tenantSlug}/app/admin/business-objects/delivery-context`}>Delivery context</a>
        <a href={`/${tenantSlug}/app/admin/business-objects/built-environment`}>Built environment</a
        >
        <a href={`/${tenantSlug}/app/admin/business-objects/commercial-procurement`}
          >Commercial & procurement</a
        >
        <a href={`/${tenantSlug}/app/admin/business-objects/controlled-information`}
          >Controlled information</a
        >
        <a href={`/${tenantSlug}/app/admin/business-objects/asset-operations`}>Asset operations</a>
        <a href={`/${tenantSlug}/app/admin/business-objects/finance-accounting`}
          >Finance & accounting</a
        >
        <a href={`/${tenantSlug}/app/admin/business-objects/item-manufacturing`}
          >Item & manufacturing</a
        >
        <a href={`/${tenantSlug}/app/admin/business-objects/inventory-logistics`}
          >Inventory & logistics</a
        >
        <a href={`/${tenantSlug}/app/admin/business-objects/crm-business-development`}
          >CRM & business development</a
        >
        <a href={`/${tenantSlug}/app/admin/business-objects/estimating-tendering`}
          >Estimating & tendering</a
        >
        <a href={`/${tenantSlug}/app/admin/business-objects/people-hcm`}>People & HCM</a>
        <a href={`/${tenantSlug}/app/admin/business-objects/qhse-assurance`}>QHSE & assurance</a>
        <a href={`/${tenantSlug}/app/admin/business-objects/building-safety-regulatory`}
          >Building safety & regulatory</a
        >
        <a href={`/${tenantSlug}/app/admin/business-objects/sustainability-carbon`}
          >Sustainability & carbon</a
        >
        <a href={`/${tenantSlug}/app/admin/business-objects/risk-compliance-audit`}
          >Risk, compliance & audit</a
        >
        <a href={`/${tenantSlug}/app/admin/business-objects/legal-privacy`}>Legal & privacy</a>
        <a href={`/${tenantSlug}/app/admin/business-objects/knowledge-records-communications`}
          >Knowledge, records & communications</a
        >
        <a href={`/${tenantSlug}/app/admin/business-objects/land-development-investment`}
          >Land & development</a
        >
        <a href={`/${tenantSlug}/app/admin/business-objects/strategy-governance-performance`}
          >Strategy & governance</a
        >
        <a href={`/${tenantSlug}/app/admin/business-objects/continuity-crisis-security`}
          >Continuity, crisis & security</a
        >
        <a href={`/${tenantSlug}/app/admin/business-objects/technology-data-cyber-ai`}
          >IT, data, cyber & AI</a
        >
        <a href={`/${tenantSlug}/app/admin/business-objects/transformation-process-improvement`}
          >Transformation & process</a
        >
        <a href={`/${tenantSlug}/app/admin/business-objects/site-field-operations`}
          >Site & field operations</a
        >
        <a href={`/${tenantSlug}/app/admin/business-objects/shared-work-evidence`}
          >Work, decisions & evidence</a
        >
        <a href={`/${tenantSlug}/app/admin/business-objects/reference-configuration`}
          >Reference & configuration</a
        >
      </div>
    </details>
  </section>
</aside>

<style>
  .sidebar {
    position: sticky;
    top: 64px;
    height: calc(100vh - 64px);
    overflow: auto;
    padding: 18px 14px 22px;
    border-right: 1px solid var(--line);
    background: #fbfcfd;
  }
  .sidebar section + section {
    border-top: 1px solid #e5ebf0;
    margin-top: 15px;
    padding-top: 15px;
  }
  .label {
    margin: 0 8px 9px;
    color: #758493;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .utility,
  .function {
    display: grid;
    grid-template-columns: 31px minmax(0, 1fr);
    align-items: center;
    min-height: 34px;
    padding: 6px 9px;
    border-radius: 7px;
    text-decoration: none;
    color: #30465a;
    font-size: 12px;
  }
  .utility:hover,
  .function.active {
    background: #dff0fb;
    color: #123f5f;
  }
  .utility.active {
    font-weight: 700;
  }
  .function-list {
    display: grid;
    gap: 2px;
  }
  .function {
    font-size: 11.5px;
    line-height: 1.25;
  }
  .function.active {
    font-weight: 700;
  }
  .function.mapped {
    color: #52697a;
  }
  .function.mapped:not(.active)::after {
    content: 'map';
    justify-self: end;
    padding: 2px 4px;
    border-radius: 999px;
    background: #eef2f5;
    color: #80909b;
    font-size: 7px;
    font-weight: 800;
    text-transform: uppercase;
  }
  .fn-id {
    font-size: 10px;
    font-weight: 800;
    color: #52687b;
  }
  .admin-item {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr);
    align-items: center;
    min-height: 31px;
    padding: 6px 9px;
    border-radius: 7px;
    color: #536779;
    font-size: 11.5px;
    text-decoration: none;
  }
  a.admin-item:hover {
    background: #eaf5fc;
    color: #1b5072;
  }
  .admin-group {
    margin-top: 7px;
    border-top: 1px solid #e7edf1;
    padding-top: 7px;
  }
  .admin-group summary {
    padding: 7px 9px;
    border-radius: 7px;
    color: #607487;
    font-size: 10.5px;
    font-weight: 750;
    cursor: pointer;
  }
  .admin-group summary:hover {
    background: #eef6fb;
    color: #244f6b;
  }
  .admin-group-links {
    display: grid;
    gap: 2px;
    padding: 4px 0 2px 16px;
  }
  .admin-group-links a {
    padding: 5px 8px;
    border-radius: 6px;
    color: #6b7d8a;
    font-size: 10px;
    text-decoration: none;
  }
  .admin-group-links a:hover {
    background: #eef6fb;
    color: #244f6b;
  }
  .admin-item span {
    color: #607b8e;
    text-align: center;
  }
  @media (max-width: 760px) {
    .sidebar {
      position: static;
      height: auto;
      padding: 8px 10px;
      border-right: 0;
      border-bottom: 1px solid var(--line);
    }
    .sidebar > section:first-child,
    .sidebar .admin {
      display: none;
    }
    .sidebar section + section {
      border-top: 0;
      margin: 0;
      padding: 0;
    }
    .label {
      display: none;
    }
    .function-list {
      display: flex;
      overflow-x: auto;
      gap: 6px;
      padding-bottom: 2px;
    }
    .function {
      min-width: max-content;
      grid-template-columns: auto auto;
      gap: 5px;
      border: 1px solid var(--line);
      background: white;
    }
    .function.mapped:not(.active)::after {
      display: none;
    }
  }
</style>
