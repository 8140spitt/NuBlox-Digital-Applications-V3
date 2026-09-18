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
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects`}><span>◇</span>Business object model</a>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/coverage-audit`}><span>✓</span>Coverage audit</a>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/foundation`}><span>⌘</span>Foundation semantics</a>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/authority`}><span>◆</span>Authority & participation</a>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/crm-business-development`}><span>◎</span>CRM & business development</a>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/estimating-tendering`}><span>∑</span>Estimating & tendering</a>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/people-hcm`}><span>♙</span>People & HCM</a>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/qhse-assurance`}><span>△</span>QHSE & assurance</a>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/building-safety-regulatory`}><span>◇</span>Building safety & regulatory</a>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/sustainability-carbon`}><span>◌</span>Sustainability & carbon</a>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/risk-compliance-audit`}><span>◆</span>Risk, compliance & audit</a>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/legal-privacy`}><span>§</span>Legal & privacy</a>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/knowledge-records-communications`}><span>▩</span>Knowledge, records & comms</a>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/delivery-context`}><span>▤</span>Delivery context</a>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/built-environment`}><span>▧</span>Built environment</a>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/commercial-procurement`}><span>▥</span>Commercial & procurement</a>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/item-manufacturing`}><span>▦</span>Item & manufacturing</a>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/inventory-logistics`}><span>▣</span>Inventory & logistics</a>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/controlled-information`}><span>▨</span>Controlled information</a>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/asset-operations`}><span>◉</span>Asset operations</a>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/finance-accounting`}><span>¤</span>Finance & accounting</a>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/shared-work-evidence`}><span>◈</span>Work, decisions & evidence</a>
    <a class="admin-item" href={`/${tenantSlug}/app/admin/business-objects/reference-configuration`}><span>⌁</span>Reference & configuration</a>
    <div class="admin-item muted"><span>◫</span>Function directory</div>
    <div class="admin-item muted"><span>▦</span>Job architecture</div>
    <div class="admin-item muted"><span>◎</span>Positions</div>
    <div class="admin-item muted"><span>↻</span>Lifecycle administration</div>
    <div class="admin-item muted"><span>◈</span>Design system</div>
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
  .admin-item { display: grid; grid-template-columns: 22px minmax(0,1fr); align-items: center; min-height: 31px; padding: 6px 9px; border-radius: 7px; color: #536779; font-size: 11.5px; text-decoration: none; }
  a.admin-item:hover { background: #eaf5fc; color: #1b5072; }
  .admin-item.muted { color: #8795a1; }
  .admin-item span { color: #607b8e; text-align: center; }
  @media (max-width: 760px) { .sidebar { position: static; height: auto; padding: 8px 10px; border-right: 0; border-bottom: 1px solid var(--line); } .sidebar > section:first-child, .sidebar .admin { display: none; } .sidebar section + section { border-top: 0; margin: 0; padding: 0; } .label { display: none; } .function-list { display: flex; overflow-x: auto; gap: 6px; padding-bottom: 2px; } .function { min-width: max-content; grid-template-columns: auto auto; gap: 5px; border: 1px solid var(--line); background: white; } .function.planned { display: none; } }
</style>
