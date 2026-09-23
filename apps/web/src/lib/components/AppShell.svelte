<script lang="ts">
  import { page } from '$app/state';
  import type { AuthSession } from '@nublox/persistence';
  import type { Snippet } from 'svelte';

  let { children, session }: { children: Snippet; session: AuthSession } = $props();
  let navigationOpen = $state(false);

  function isActive(href: string, exact = false) {
    return exact
      ? page.url.pathname === href
      : page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
  }

  function closeNavigation() {
    navigationOpen = false;
  }

  function currentArea(pathname: string) {
    if (pathname.startsWith('/app/my-work')) return 'My Work';
    if (pathname.startsWith('/app/contexts')) return 'Contexts';
    if (pathname.startsWith('/app/teams')) return 'Teams';
    if (pathname.startsWith('/app/functions')) return 'Teams';
    if (pathname.startsWith('/app/domains')) return 'Teams';
    if (pathname.startsWith('/app/delivery')) return 'CBE Capability Administration';
    if (pathname.startsWith('/app/information')) return 'Information';
    if (pathname.startsWith('/app/deliverables')) return 'Deliverables';
    if (pathname.startsWith('/app/configuration')) return 'Change & Configuration';
    if (pathname.startsWith('/app/hcm')) return 'HCM Position Management';
    if (pathname.startsWith('/app/organisation')) return 'HCM Position Management';
    if (pathname.startsWith('/app/deployments')) return 'HCM Position Management';
    if (pathname.startsWith('/app/competence')) return 'Competence';
    if (pathname.startsWith('/app/control')) return 'Control';
    if (pathname.startsWith('/app/access')) return 'Access';
    if (pathname.startsWith('/app/policy')) return 'Policy Governance';
    return 'Home';
  }
</script>

<div class="app-shell" class:nav-open={navigationOpen}>
  <aside class="app-sidebar" aria-label="NuBlox application navigation">
    <div class="app-brand-row">
      <a class="app-brand" href="/app" onclick={closeNavigation}>NuBlox</a>
      <span class="app-version">V3</span>
    </div>

    <div class="app-navigation">
      <nav class="primary-nav" aria-label="Workspace navigation">
        <section class="nav-section">
          <h2>Work</h2>
          <a class:active={isActive('/app', true)} href="/app" onclick={closeNavigation}>
            <span class="nav-symbol">HM</span>
            <span>Home</span>
          </a>
          <a class:active={isActive('/app/my-work')} href="/app/my-work" onclick={closeNavigation}>
            <span class="nav-symbol">MW</span>
            <span>My Work</span>
          </a>
          <a class:active={isActive('/app/contexts')} href="/app/contexts" onclick={closeNavigation}>
            <span class="nav-symbol">CX</span>
            <span>Contexts</span>
          </a>
          <a class:active={isActive('/app/teams')} href="/app/teams" onclick={closeNavigation}>
            <span class="nav-symbol">TM</span>
            <span>Teams</span>
          </a>
        </section>

        <section class="nav-section">
          <h2>Work products</h2>
          <a class:active={isActive('/app/information')} href="/app/information" onclick={closeNavigation}>
            <span class="nav-symbol">IN</span>
            <span>Information</span>
          </a>
          <a class:active={isActive('/app/deliverables')} href="/app/deliverables" onclick={closeNavigation}>
            <span class="nav-symbol">DL</span>
            <span>Deliverables</span>
          </a>
          <a class:active={isActive('/app/configuration')} href="/app/configuration" onclick={closeNavigation}>
            <span class="nav-symbol">CC</span>
            <span>Change &amp; configuration</span>
          </a>
        </section>

        <section class="nav-section">
          <h2>Governance</h2>
          <a class:active={isActive('/app/hcm')} href="/app/hcm" onclick={closeNavigation}>
            <span class="nav-symbol">HC</span>
            <span>HCM &amp; positions</span>
          </a>
          <a class:active={isActive('/app/competence')} href="/app/competence" onclick={closeNavigation}>
            <span class="nav-symbol">CP</span>
            <span>Competence</span>
          </a>
          <a class:active={isActive('/app/control')} href="/app/control" onclick={closeNavigation}>
            <span class="nav-symbol">CT</span>
            <span>Control</span>
          </a>
          <a class:active={isActive('/app/access')} href="/app/access" onclick={closeNavigation}>
            <span class="nav-symbol">AC</span>
            <span>Access</span>
          </a>
          <a class:active={isActive('/app/policy')} href="/app/policy" onclick={closeNavigation}>
            <span class="nav-symbol">PL</span>
            <span>Policy</span>
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
        <form method="POST" action="/logout">
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
