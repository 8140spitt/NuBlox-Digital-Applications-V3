<script lang="ts">
  import { page } from '$app/state';
  import { enterpriseFunctions } from '$lib/enterprise/functions';

  let { tenantSlug } = $props();
  let filterText = $state('');

  const visibleFunctions = $derived(
    enterpriseFunctions.filter((fn) => {
      const needle = filterText.trim().toLowerCase();
      if (!needle) return true;
      return (
        fn.id.toLowerCase().includes(needle) ||
        fn.shortName.toLowerCase().includes(needle) ||
        fn.name.toLowerCase().includes(needle)
      );
    })
  );

  function isCurrentFunction(functionId: string) {
    return page.url.pathname.includes('/functions/' + functionId.toLowerCase());
  }
</script>

<aside class="sidebar">
  <nav aria-label="Tenant navigation">
    <section class="primary">
      <p class="label">Workspace</p>
      <a
        class="utility"
        class:active={page.url.pathname === '/' + tenantSlug + '/app'}
        href={'/' + tenantSlug + '/app'}
      >
        <span class="nav-mark" aria-hidden="true">⌂</span>
        <span>Home</span>
      </a>
      <a
        class="utility"
        class:active={page.url.pathname.includes('/app/work')}
        href={'/' + tenantSlug + '/app/work'}
      >
        <span class="nav-mark" aria-hidden="true">✓</span>
        <span>My Work</span>
      </a>
      <a
        class="utility"
        class:active={page.url.pathname === '/' + tenantSlug + '/app/functions'}
        href={'/' + tenantSlug + '/app/functions'}
      >
        <span class="nav-mark" aria-hidden="true">▦</span>
        <span>Function directory</span>
      </a>
    </section>

    <section class="functions">
      <div class="label-row">
        <p class="label">Business functions</p>
        <span>29</span>
      </div>

      <label class="filter">
        <span class="sr-only">Filter business functions</span>
        <input bind:value={filterText} placeholder="Filter functions" />
      </label>

      <div class="function-list">
        {#each visibleFunctions as fn}
          <a
            class="function"
            class:active={isCurrentFunction(fn.id)}
            href={'/' + tenantSlug + '/app/functions/' + fn.id.toLowerCase()}
            title={fn.name}
          >
            <span class="fn-id">{fn.id}</span>
            <span class="fn-name">{fn.shortName}</span>
          </a>
        {:else}
          <p class="no-functions">No function matches “{filterText}”.</p>
        {/each}
      </div>
    </section>

    <section class="administration">
      <details>
        <summary>
          <span>Administration</span>
          <span aria-hidden="true">⌄</span>
        </summary>
        <div class="admin-links">
          <a
            class:active={page.url.pathname.includes('/admin/security')}
            href={'/' + tenantSlug + '/app/admin/security'}
          >
            <span>Security & access</span>
          </a>
          <a
            class:active={page.url.pathname.includes('/admin/master-data/parties')}
            href={'/' + tenantSlug + '/app/admin/master-data/parties'}
          >
            <span>Party master data</span>
          </a>
          <a
            class:active={page.url.pathname.includes('/admin/master-data/organisation-structure')}
            href={'/' + tenantSlug + '/app/admin/master-data/organisation-structure'}
          >
            <span>Organisation structure</span>
          </a>
          <a
            class:active={page.url.pathname.includes('/admin/reference-data')}
            href={'/' + tenantSlug + '/app/admin/reference-data'}
          >
            <span>Reference data</span>
          </a>
          <a
            class:active={page.url.pathname === '/' + tenantSlug + '/app/admin/business-objects'}
            href={'/' + tenantSlug + '/app/admin/business-objects'}
          >
            <span>Business object model</span>
          </a>
          <a
            class:active={page.url.pathname.includes('/coverage-audit')}
            href={'/' + tenantSlug + '/app/admin/business-objects/coverage-audit'}
          >
            <span>Coverage audit</span>
          </a>
        </div>
      </details>
    </section>
  </nav>
</aside>

<style>
  .sidebar {
    position: sticky;
    top: 58px;
    height: calc(100vh - 58px);
    overflow: auto;
    padding: 14px 11px 66px;
    border-right: 1px solid var(--line);
    background: #f8fafb;
    scrollbar-width: thin;
  }
  section + section {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid #e3e9ed;
  }
  .label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 7px;
  }
  .label-row > span {
    color: #8b99a2;
    font-size: 8px;
    font-weight: 800;
  }
  .label {
    margin: 0 7px 7px;
    color: #748694;
    font-size: 9px;
    font-weight: 850;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .label-row .label {
    margin-inline: 0;
  }
  .utility,
  .function {
    position: relative;
    display: grid;
    align-items: center;
    border-radius: 7px;
    color: #425b6d;
    text-decoration: none;
  }
  .utility {
    grid-template-columns: 25px minmax(0, 1fr);
    min-height: 34px;
    padding: 6px 8px;
    font-size: 11.5px;
    font-weight: 650;
  }
  .utility:hover,
  .function:hover {
    background: #edf4f8;
    color: #214f6a;
  }
  .utility.active,
  .function.active {
    background: #e5f2f9;
    color: #174a68;
    font-weight: 800;
  }
  .utility.active::before,
  .function.active::before {
    content: '';
    position: absolute;
    left: -3px;
    top: 7px;
    bottom: 7px;
    width: 3px;
    border-radius: 3px;
    background: var(--blue-700);
  }
  .nav-mark {
    color: #6f8796;
    text-align: center;
  }
  .filter {
    display: block;
    margin: 0 4px 7px;
  }
  .filter input {
    width: 100%;
    min-height: 31px;
    border: 1px solid #d7e1e7;
    border-radius: 7px;
    padding: 0 9px;
    outline: 0;
    background: white;
    color: var(--ink);
    font-size: 10px;
  }
  .filter input:focus {
    border-color: #71afd2;
    box-shadow: 0 0 0 2px rgba(22, 104, 155, 0.1);
  }
  .function-list {
    display: grid;
    gap: 1px;
  }
  .function {
    grid-template-columns: 34px minmax(0, 1fr);
    min-height: 31px;
    padding: 5px 7px;
    font-size: 10.5px;
    line-height: 1.2;
  }
  .fn-id {
    color: #6d8290;
    font-size: 8.5px;
    font-weight: 900;
  }
  .fn-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .no-functions {
    margin: 8px;
    color: #7c8d98;
    font-size: 9px;
    line-height: 1.4;
  }
  .administration > details > summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 8px;
    border-radius: 7px;
    color: #536b7c;
    font-size: 10.5px;
    font-weight: 800;
    cursor: pointer;
    list-style: none;
  }
  .administration > details > summary::-webkit-details-marker {
    display: none;
  }
  .administration > details > summary:hover {
    background: #edf4f8;
  }
  .admin-links {
    display: grid;
    gap: 1px;
    padding-top: 4px;
  }
  .admin-links a {
    padding: 7px 8px 7px 14px;
    border-radius: 6px;
    color: #5d7382;
    font-size: 10px;
    text-decoration: none;
  }
  .admin-links a:hover,
  .admin-links a.active {
    background: #edf4f8;
    color: #214f6a;
  }
  .admin-links a.active {
    font-weight: 800;
  }
  @media (max-width: 1100px) {
    .sidebar {
      padding-inline: 9px;
    }
  }
  @media (max-width: 760px) {
    .sidebar {
      position: static;
      height: auto;
      overflow: visible;
      padding: 6px 8px;
      border-right: 0;
      border-bottom: 1px solid var(--line);
      background: white;
    }
    .primary {
      display: flex;
      gap: 4px;
      overflow-x: auto;
    }
    .primary .label {
      display: none;
    }
    .utility {
      min-width: max-content;
      grid-template-columns: auto auto;
      gap: 5px;
      border: 1px solid #e0e7eb;
      background: white;
    }
    .utility.active::before {
      display: none;
    }
    .functions,
    .administration {
      display: none;
    }
    section + section {
      margin: 0;
      padding: 0;
      border-top: 0;
    }
  }
</style>
