<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import CommandPalette from '$lib/components/CommandPalette.svelte';
  import ContextBar from '$lib/components/ContextBar.svelte';
  import FunctionSidebar from '$lib/components/FunctionSidebar.svelte';
  import TaskBar from '$lib/components/TaskBar.svelte';
  import { enhanceForms } from '$lib/actions/enhance-forms';
  import { contextPreservingHref } from '$lib/enterprise/enterprise-context';

  let {
    tenantSlug,
    actorDisplayName,
    authenticated = false,
    initialWorkContexts = [],
    enterpriseContextOptions = { legalEntities: [], organisationUnits: [] },
    children
  } = $props();

  const tenantName = $derived(
    tenantSlug
      .split('-')
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  );

  const initials = $derived(
    actorDisplayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0]?.toUpperCase() ?? '')
      .join('') || 'U'
  );

  onMount(() => {
    const preserveEnterpriseContext = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (
        anchor.dataset.nubloxContext === 'clear' ||
        anchor.target ||
        anchor.hasAttribute('download')
      ) {
        return;
      }

      const href = anchor.getAttribute('href');
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:')
      ) {
        return;
      }

      const contextualHref = contextPreservingHref(page.url, href, tenantSlug);
      if (contextualHref !== href) anchor.setAttribute('href', contextualHref);
    };

    document.addEventListener('click', preserveEnterpriseContext, true);
    return () => document.removeEventListener('click', preserveEnterpriseContext, true);
  });
</script>

<a class="skip-link" href="#main-content">Skip to content</a>

<header class="topbar">
  <a class="brand" href={'/' + tenantSlug + '/app'} aria-label="NuBlox home">
    <span class="brand-mark">N</span>
    <span class="brand-copy">
      <strong>NuBlox</strong>
      <small>{tenantName}</small>
    </span>
  </a>

  <div class="command">
    <CommandPalette {tenantSlug} />
  </div>

  <nav class="quick-links" aria-label="Global shortcuts">
    <a class:active={page.url.pathname.includes('/app/work')} href={'/' + tenantSlug + '/app/work'}>
      <span>My Work</span>
    </a>
    <a
      class:active={page.url.pathname.includes('/app/operate')}
      href={'/' + tenantSlug + '/app/operate'}
    >
      <span>Operate</span>
    </a>
    <a
      class:active={page.url.pathname.endsWith('/app/deliver') || page.url.pathname.includes('/app/deliver/')}
      href={'/' + tenantSlug + '/app/deliver'}
    >
      <span>Deliver</span>
    </a>
    <a
      class:active={page.url.pathname.includes('/app/deliverables')}
      href={'/' + tenantSlug + '/app/deliverables'}
    >
      <span>Deliverables</span>
    </a>
    <a class:active={page.url.pathname.includes('/app/data')} href={'/' + tenantSlug + '/app/data'}>
      <span>Data</span>
    </a>
  </nav>

  <details class="profile">
    <summary aria-label={'Account menu for ' + actorDisplayName}>
      <span class="avatar">{initials}</span>
      <span class="profile-copy">
        <strong>{actorDisplayName}</strong>
        <small>{tenantName}</small>
      </span>
      <span class="chevron" aria-hidden="true">⌄</span>
    </summary>
    <div class="profile-menu">
      <div class="profile-context">
        <strong>{actorDisplayName}</strong>
        <span>{tenantName}</span>
      </div>
      <a href={'/' + tenantSlug + '/app'}>Home</a>
      <a href={'/' + tenantSlug + '/app/work'}>My Work</a>
      <a href={'/' + tenantSlug + '/app/functions'}>Function directory</a>
      {#if authenticated}
        <form method="POST" action="/logout">
          <button type="submit">Sign out</button>
        </form>
      {/if}
    </div>
  </details>
</header>

<ContextBar
  {tenantSlug}
  legalEntities={enterpriseContextOptions.legalEntities}
  organisationUnits={enterpriseContextOptions.organisationUnits}
/>

<div class="shell">
  <FunctionSidebar {tenantSlug} />
  <main id="main-content" class="main-content" use:enhanceForms>
    {@render children()}
  </main>
</div>

<TaskBar {tenantSlug} initialContexts={initialWorkContexts} />

<style>
  .skip-link {
    position: fixed;
    top: 8px;
    left: 8px;
    z-index: 200;
    transform: translateY(-140%);
    border-radius: 7px;
    padding: 8px 11px;
    background: white;
    color: var(--navy-900);
    font-size: 12px;
    font-weight: 800;
    text-decoration: none;
    box-shadow: var(--shadow);
  }
  .skip-link:focus {
    transform: translateY(0);
  }
  .topbar {
    position: sticky;
    top: 0;
    z-index: 50;
    min-height: 58px;
    display: grid;
    grid-template-columns: 236px minmax(260px, 1fr) auto auto;
    gap: 14px;
    align-items: center;
    padding: 0 16px 0 14px;
    color: white;
    background: var(--navy-950);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.08),
      0 4px 16px rgba(5, 30, 48, 0.14);
  }
  .brand {
    min-width: 0;
    display: flex;
    gap: 10px;
    align-items: center;
    color: white;
    text-decoration: none;
  }
  .brand-mark {
    width: 30px;
    height: 32px;
    display: grid;
    place-items: center;
    flex: 0 0 30px;
    border: 1px solid rgba(255, 255, 255, 0.58);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.08);
    font-size: 16px;
    font-weight: 900;
  }
  .brand-copy {
    min-width: 0;
    display: grid;
    gap: 1px;
    line-height: 1.05;
  }
  .brand-copy strong {
    font-size: 16px;
    letter-spacing: -0.02em;
  }
  .brand-copy small {
    overflow: hidden;
    color: rgba(255, 255, 255, 0.62);
    font-size: 9.5px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .command {
    min-width: 0;
    display: flex;
    justify-content: center;
  }
  .quick-links {
    display: flex;
    gap: 3px;
    align-items: center;
  }
  .quick-links a {
    padding: 8px 9px;
    border-radius: 7px;
    color: rgba(255, 255, 255, 0.72);
    font-size: 11px;
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;
  }
  .quick-links a:hover,
  .quick-links a.active {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  .profile {
    position: relative;
  }
  .profile > summary {
    min-width: 0;
    display: flex;
    gap: 8px;
    align-items: center;
    list-style: none;
    padding: 4px 5px;
    border-radius: 8px;
    cursor: pointer;
  }
  .profile > summary::-webkit-details-marker {
    display: none;
  }
  .profile > summary:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  .avatar {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    flex: 0 0 34px;
    border-radius: 50%;
    background: #edf6fc;
    color: var(--navy-900);
    font-size: 11px;
    font-weight: 850;
  }
  .profile-copy {
    max-width: 150px;
    display: grid;
    gap: 1px;
    line-height: 1.15;
  }
  .profile-copy strong,
  .profile-copy small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .profile-copy strong {
    font-size: 10.5px;
    font-weight: 750;
  }
  .profile-copy small {
    color: rgba(255, 255, 255, 0.62);
    font-size: 8.5px;
  }
  .chevron {
    color: rgba(255, 255, 255, 0.62);
    font-size: 10px;
  }
  .profile-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 220px;
    display: grid;
    gap: 2px;
    padding: 7px;
    border: 1px solid #cad8e0;
    border-radius: 10px;
    background: white;
    color: var(--ink);
    box-shadow: 0 12px 35px rgba(5, 30, 48, 0.2);
  }
  .profile-context {
    display: grid;
    gap: 2px;
    padding: 7px 8px 9px;
    border-bottom: 1px solid #e4eaee;
    margin-bottom: 3px;
  }
  .profile-context strong {
    color: #29475c;
    font-size: 11px;
  }
  .profile-context span {
    color: #778994;
    font-size: 9px;
  }
  .profile-menu a,
  .profile-menu button {
    width: 100%;
    display: block;
    border: 0;
    border-radius: 6px;
    padding: 8px;
    background: transparent;
    color: #415d70;
    font-size: 10.5px;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }
  .profile-menu a:hover,
  .profile-menu button:hover {
    background: #eef6fa;
    color: #214e69;
  }
  .profile-menu form {
    margin: 3px 0 0;
    padding-top: 3px;
    border-top: 1px solid #e4eaee;
  }
  .shell {
    min-height: calc(100vh - 58px);
    display: grid;
    grid-template-columns: 248px minmax(0, 1fr);
  }
  .main-content {
    min-width: 0;
    padding: 18px 20px 72px;
  }
  :global(form[data-nublox-submitting='true'] button[type='submit']),
  :global(form[data-nublox-submitting='true'] button:not([type])) {
    opacity: 0.65;
    cursor: wait;
  }
  @media (max-width: 1100px) {
    .topbar {
      grid-template-columns: 210px minmax(220px, 1fr) auto;
    }
    .quick-links {
      display: none;
    }
    .shell {
      grid-template-columns: 220px minmax(0, 1fr);
    }
  }
  @media (max-width: 760px) {
    .topbar {
      grid-template-columns: minmax(0, 1fr) auto auto;
      min-height: 54px;
      padding: 0 10px;
    }
    .brand {
      gap: 7px;
    }
    .brand-copy small,
    .profile-copy,
    .chevron {
      display: none;
    }
    .brand-mark {
      width: 28px;
      height: 30px;
      flex-basis: 28px;
    }
    .command {
      justify-content: end;
    }
    .shell {
      display: block;
    }
    .main-content {
      padding: 12px 10px 66px;
    }
  }
</style>
