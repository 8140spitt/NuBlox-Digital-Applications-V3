<script lang="ts">
  import { page } from '$app/state';
  import type { AuthSession } from '@nublox/persistence';
  import type { Snippet } from 'svelte';
  import { functionGroups, functionsForGroup } from '$lib/function-catalog';

  let { children, session }: { children: Snippet; session: AuthSession } = $props();
  let navigationOpen = $state(false);

  function isActive(href: string) {
    return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
  }

  function closeNavigation() {
    navigationOpen = false;
  }
</script>

<div class="app-shell" class:nav-open={navigationOpen}>
  <aside class="app-sidebar" aria-label="NuBlox application navigation">
    <div class="app-brand-row">
      <a class="app-brand" href="/app" onclick={closeNavigation}>NuBlox</a>
      <span class="app-version">V3</span>
    </div>

    <nav class="primary-nav" aria-label="Primary">
      <a class:active={isActive('/app/my-work')} href="/app/my-work" onclick={closeNavigation}>
        <span class="nav-symbol">MW</span>
        <span>My Work</span>
      </a>
      <a class:active={page.url.pathname === '/app'} href="/app" onclick={closeNavigation}>
        <span class="nav-symbol">29</span>
        <span>Functions</span>
      </a>
      <a class:active={isActive('/app/organisation')} href="/app/organisation" onclick={closeNavigation}>
        <span class="nav-symbol">OR</span>
        <span>Organisation</span>
      </a>
      <a class:active={isActive('/app/access')} href="/app/access" onclick={closeNavigation}>
        <span class="nav-symbol">AC</span>
        <span>Access</span>
      </a>
      <a class:active={isActive('/app/deployments')} href="/app/deployments" onclick={closeNavigation}>
        <span class="nav-symbol">DP</span>
        <span>Deployments</span>
      </a>
      <a class:active={isActive('/app/competence')} href="/app/competence" onclick={closeNavigation}>
        <span class="nav-symbol">CP</span>
        <span>Competence</span>
      </a>
      <a class:active={isActive('/app/control')} href="/app/control" onclick={closeNavigation}>
        <span class="nav-symbol">CT</span>
        <span>Control</span>
      </a>
    </nav>

    <div class="function-nav">
      {#each functionGroups as group}
        <section class="function-nav-group">
          <h2>{group.name}</h2>
          <div class="function-nav-links">
            {#each functionsForGroup(group.id) as fn}
              <a
                class:active={isActive(`/app/functions/${fn.code.toLowerCase()}`)}
                href={`/app/functions/${fn.code.toLowerCase()}`}
                onclick={closeNavigation}
              >
                <span>{fn.code}</span>
                <strong>{fn.name}</strong>
              </a>
            {/each}
          </div>
        </section>
      {/each}
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
        <strong>Enterprise Operating Platform</strong>
        <span>One governed system of work</span>
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
