<script lang="ts">
  import { page } from '$app/state';
  import type { AuthSession } from '@nublox/persistence';
  import type { Snippet } from 'svelte';
  import { parseTenantApplicationPath, tenantAppPath, tenantSignOutPath } from '$lib/tenant-paths';

  let { children, session }: { children: Snippet; session: AuthSession } = $props();
  let navigationOpen = $state(false);

  function currentInternalPath(pathname: string) {
    return parseTenantApplicationPath(pathname)?.internalPath ?? pathname;
  }

  function appHref(href: string) {
    return tenantAppPath(session.tenantSlug, href);
  }

  function isActive(href: string, exact = false) {
    const pathname = currentInternalPath(page.url.pathname);
    return exact
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  function closeNavigation() {
    navigationOpen = false;
  }

  function currentArea(pathname: string) {
    pathname = currentInternalPath(pathname);
    if (pathname.startsWith('/app/function')) return 'My Function';
    if (pathname.startsWith('/app/my-team')) return 'My Team';
    if (pathname.startsWith('/app/my-work')) return 'My Work';
    if (pathname.startsWith('/app/contexts')) return 'Contexts';
    if (pathname.startsWith('/app/teams')) return 'Teams';
    if (pathname.startsWith('/app/functions')) return 'Teams';
    if (pathname.startsWith('/app/domains')) return 'Teams';
    if (pathname.startsWith('/app/delivery')) return 'CBE Capability Administration';
    if (pathname.startsWith('/app/information')) return 'Information';
    if (pathname.startsWith('/app/deliverables')) return 'Deliverables';
    if (pathname.startsWith('/app/exchange')) return 'Exchange Control';
    if (pathname.startsWith('/app/integration')) return 'Integration & Publication';
    if (pathname.startsWith('/app/migration')) return 'Migration Control';
    if (pathname.startsWith('/app/extensions')) return 'Extension Governance';
    if (pathname.startsWith('/app/configuration-promotion')) return 'Configuration Promotion';
    if (pathname.startsWith('/app/records-retention')) return 'Records Retention';
    if (pathname.startsWith('/app/supplier-sourcing')) return 'Supplier Sourcing';
    if (pathname.startsWith('/app/manufacturing')) return 'Manufacturing';
    if (pathname.startsWith('/app/service-delivery')) return 'Service Delivery';
    if (pathname.startsWith('/app/site-production')) return 'Site Production';
    if (pathname.startsWith('/app/configuration-resolution')) return 'Configuration Resolution';
    if (pathname.startsWith('/app/configuration')) return 'Change & Configuration';
    if (pathname.startsWith('/app/hcm')) return 'Human Capital Management';
    if (pathname.startsWith('/app/resource-planning')) return 'Resource Planning';
    if (pathname.startsWith('/app/organisation')) return 'HCM Position Management';
    if (pathname.startsWith('/app/deployments')) return 'HCM Position Management';
    if (pathname.startsWith('/app/competence')) return 'Competence';
    if (pathname.startsWith('/app/control')) return 'Control';
    if (pathname === '/app/security' || pathname.startsWith('/app/security/')) return 'Account Security';
    if (pathname.startsWith('/app/access')) return 'Access';
    if (pathname.startsWith('/app/policy')) return 'Policy Governance';
    if (pathname.startsWith('/app/security-classification')) return 'Information Security';
    if (pathname.startsWith('/app/validation-policy')) return 'Validation Policy';
    if (pathname.startsWith('/app/metadata')) return 'Metadata Governance';
    return 'Home';
  }
</script>

<div class="app-shell" class:nav-open={navigationOpen}>
  <aside class="app-sidebar" aria-label="NuBlox application navigation">
    <div class="app-brand-row">
      <a class="app-brand" href={appHref('/app')} onclick={closeNavigation}>NuBlox</a>
      <span class="app-version">V3</span>
    </div>

    <div class="app-navigation">
      <nav class="primary-nav" aria-label="Workspace navigation">
        <section class="nav-section">
          <h2>Work</h2>
          <a class:active={isActive('/app', true)} href={appHref('/app')} onclick={closeNavigation}>
            <span class="nav-symbol">HM</span>
            <span>Home</span>
          </a>
          <a class:active={isActive('/app/function')} href={appHref('/app/function')} onclick={closeNavigation}>
            <span class="nav-symbol">FN</span>
            <span>My Function</span>
          </a>
          <a class:active={isActive('/app/my-work')} href={appHref('/app/my-work')} onclick={closeNavigation}>
            <span class="nav-symbol">MW</span>
            <span>My Work</span>
          </a>
          <a class:active={isActive('/app/my-team')} href={appHref('/app/my-team')} onclick={closeNavigation}>
            <span class="nav-symbol">MT</span>
            <span>My Team</span>
          </a>
          <a class:active={isActive('/app/contexts')} href={appHref('/app/contexts')} onclick={closeNavigation}>
            <span class="nav-symbol">CX</span>
            <span>My Contexts</span>
          </a>
        </section>

        <section class="nav-section">
          <h2>Work products</h2>
          <a class:active={isActive('/app/information')} href={appHref('/app/information')} onclick={closeNavigation}>
            <span class="nav-symbol">IN</span>
            <span>Information</span>
          </a>
          <a class:active={isActive('/app/deliverables')} href={appHref('/app/deliverables')} onclick={closeNavigation}>
            <span class="nav-symbol">DL</span>
            <span>Deliverables</span>
          </a>
          <a class:active={isActive('/app/exchange')} href={appHref('/app/exchange')} onclick={closeNavigation}>
            <span class="nav-symbol">EX</span>
            <span>Exchange control</span>
          </a>
          <a class:active={isActive('/app/integration')} href={appHref('/app/integration')} onclick={closeNavigation}>
            <span class="nav-symbol">IP</span>
            <span>Integration control</span>
          </a>
          <a class:active={isActive('/app/migration')} href={appHref('/app/migration')} onclick={closeNavigation}>
            <span class="nav-symbol">MG</span>
            <span>Migration control</span>
          </a>
          <a class:active={isActive('/app/configuration')} href={appHref('/app/configuration')} onclick={closeNavigation}>
            <span class="nav-symbol">CC</span>
            <span>Change &amp; configuration</span>
          </a>
          <a
            class:active={isActive('/app/configuration-resolution')}
            href={appHref('/app/configuration-resolution')}
            onclick={closeNavigation}
          >
            <span class="nav-symbol">CR</span>
            <span>Configuration resolution</span>
          </a>
        </section>

        <section class="nav-section">
          <h2>Governance</h2>
          <a class:active={isActive('/app/hcm')} href={appHref('/app/hcm')} onclick={closeNavigation}>
            <span class="nav-symbol">HC</span>
            <span>Human Capital</span>
          </a>
          <a class:active={isActive('/app/competence')} href={appHref('/app/competence')} onclick={closeNavigation}>
            <span class="nav-symbol">CP</span>
            <span>Competence</span>
          </a>
          <a class:active={isActive('/app/control')} href={appHref('/app/control')} onclick={closeNavigation}>
            <span class="nav-symbol">CT</span>
            <span>Control</span>
          </a>
          <a class:active={isActive('/app/access')} href={appHref('/app/access')} onclick={closeNavigation}>
            <span class="nav-symbol">AC</span>
            <span>Access</span>
          </a>
          <a class:active={isActive('/app/security')} href={appHref('/app/security')} onclick={closeNavigation}>
            <span class="nav-symbol">AU</span>
            <span>Account security</span>
          </a>
          <a class:active={isActive('/app/policy')} href={appHref('/app/policy')} onclick={closeNavigation}>
            <span class="nav-symbol">PL</span>
            <span>Policy</span>
          </a>
          <a
            class:active={isActive('/app/security-classification')}
            href={appHref('/app/security-classification')}
            onclick={closeNavigation}
          >
            <span class="nav-symbol">SC</span>
            <span>Information security</span>
          </a>
          <a
            class:active={isActive('/app/validation-policy')}
            href={appHref('/app/validation-policy')}
            onclick={closeNavigation}
          >
            <span class="nav-symbol">VR</span>
            <span>Validation policy</span>
          </a>
          <a
            class:active={isActive('/app/metadata')}
            href={appHref('/app/metadata')}
            onclick={closeNavigation}
          >
            <span class="nav-symbol">MD</span>
            <span>Metadata governance</span>
          </a>
          <a class:active={isActive('/app/extensions')} href={appHref('/app/extensions')} onclick={closeNavigation}>
            <span class="nav-symbol">EG</span>
            <span>Extension governance</span>
          </a>
          <a class:active={isActive('/app/configuration-promotion')} href={appHref('/app/configuration-promotion')} onclick={closeNavigation}>
            <span class="nav-symbol">PG</span>
            <span>Configuration promotion</span>
          </a>
          <a class:active={isActive('/app/records-retention')} href={appHref('/app/records-retention')} onclick={closeNavigation}>
            <span class="nav-symbol">RR</span>
            <span>Records retention</span>
          </a>
          <a class:active={isActive('/app/supplier-sourcing')} href={appHref('/app/supplier-sourcing')} onclick={closeNavigation}>
            <span class="nav-symbol">SS</span>
            <span>Supplier sourcing</span>
          </a>
          <a class:active={isActive('/app/manufacturing')} href={appHref('/app/manufacturing')} onclick={closeNavigation}>
            <span class="nav-symbol">MF</span>
            <span>Manufacturing</span>
          </a>
          <a class:active={isActive('/app/service-delivery')} href={appHref('/app/service-delivery')} onclick={closeNavigation}>
            <span class="nav-symbol">SD</span>
            <span>Service delivery</span>
          </a>
        </section>
      </nav>
    </div>

    <div class="sidebar-footer">
      <span class="system-indicator" aria-hidden="true"></span>
      <div>
        <strong>{session.tenantName}</strong>
        <span>{session.personName}</span>
      </div>
    </div>
  </aside>

  <div class="app-stage">
    <header class="app-topbar">
      <div class="topbar-leading">
        <button
          class="nav-toggle"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={navigationOpen}
          onclick={() => (navigationOpen = !navigationOpen)}
        >
          Menu
        </button>

        <div class="topbar-context">
          <span>NuBlox</span>
          <strong>{currentArea(page.url.pathname)}</strong>
        </div>
      </div>

      <div class="topbar-actions">
        <div class="session-context">
          <strong>{session.personName}</strong>
          <span>{session.tenantName}</span>
        </div>
        <form method="POST" action={tenantSignOutPath(session.tenantSlug)}>
          <button type="submit" class="quiet-button">Sign out</button>
        </form>
      </div>
    </header>

    <main class="app-content">
      {@render children()}
    </main>
  </div>

  {#if navigationOpen}
    <button class="nav-scrim" type="button" aria-label="Close navigation" onclick={closeNavigation}></button>
  {/if}
</div>
