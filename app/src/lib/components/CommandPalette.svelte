<script lang="ts">
  import { onMount } from 'svelte';
  import { enterpriseFunctions } from '$lib/enterprise/functions';

  let { tenantSlug } = $props();

  let open = $state(false);
  let query = $state('');
  let input = $state<HTMLInputElement | null>(null);

  const destinations = $derived([
    {
      label: 'Home',
      detail: 'Tenant operating overview',
      group: 'Workspace',
      href: '/' + tenantSlug + '/app'
    },
    {
      label: 'My Work',
      detail: 'Assignments, decisions and exceptions',
      group: 'Workspace',
      href: '/' + tenantSlug + '/app/work'
    },
    {
      label: 'Function directory',
      detail: 'Browse all 29 business functions',
      group: 'Workspace',
      href: '/' + tenantSlug + '/app/functions'
    },
    {
      label: 'Party master data',
      detail: 'People, organisations and legal entities',
      group: 'Administration',
      href: '/' + tenantSlug + '/app/admin/master-data/parties'
    },
    {
      label: 'Organisation structure',
      detail: 'Units, hierarchy and accountability',
      group: 'Administration',
      href: '/' + tenantSlug + '/app/admin/master-data/organisation-structure'
    },
    {
      label: 'Security & access',
      detail: 'Membership, RBAC and authority',
      group: 'Administration',
      href: '/' + tenantSlug + '/app/admin/security'
    },
    ...enterpriseFunctions.map((fn) => ({
      label: fn.id + ' · ' + fn.shortName,
      detail: fn.name,
      group: 'Business function',
      href: '/' + tenantSlug + '/app/functions/' + fn.id.toLowerCase()
    }))
  ]);

  const filtered = $derived(
    destinations
      .filter((destination) => {
        const needle = query.trim().toLowerCase();
        if (!needle) return true;
        return (
          destination.label.toLowerCase().includes(needle) ||
          destination.detail.toLowerCase().includes(needle) ||
          destination.group.toLowerCase().includes(needle)
        );
      })
      .slice(0, 12)
  );

  function show() {
    open = true;
    query = '';
    setTimeout(() => input?.focus(), 0);
  }

  function close() {
    open = false;
  }

  onMount(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        show();
      }
      if (event.key === 'Escape' && open) close();
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

<button class="launcher" type="button" onclick={show} aria-haspopup="dialog">
  <span class="launcher-copy">Search or jump to…</span>
  <kbd>⌘K</kbd>
</button>

{#if open}
  <div
    class="backdrop"
    role="presentation"
    onclick={(event) => {
      if (event.target === event.currentTarget) close();
    }}
  >
    <section class="palette" role="dialog" aria-modal="true" aria-label="Navigate NuBlox">
      <label class="search">
        <span class="sr-only">Search destinations</span>
        <span aria-hidden="true">⌕</span>
        <input
          bind:this={input}
          bind:value={query}
          placeholder="Search functions and destinations"
        />
        <button type="button" onclick={close} aria-label="Close navigation">Esc</button>
      </label>

      <div class="results" aria-live="polite">
        {#each filtered as destination}
          <a href={destination.href} onclick={close}>
            <span class="group">{destination.group}</span>
            <span class="copy">
              <strong>{destination.label}</strong>
              <small>{destination.detail}</small>
            </span>
            <span class="arrow" aria-hidden="true">→</span>
          </a>
        {:else}
          <div class="no-results">
            <strong>No matching destination</strong>
            <span>Try a function number, business function name or administration area.</span>
          </div>
        {/each}
      </div>

      <footer>
        <span><kbd>↑</kbd><kbd>↓</kbd> browse</span>
        <span><kbd>Esc</kbd> close</span>
      </footer>
    </section>
  </div>
{/if}

<style>
  .launcher {
    width: min(520px, 100%);
    min-height: 36px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 0 8px 0 12px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.78);
    cursor: pointer;
  }
  .launcher:hover {
    border-color: rgba(255, 255, 255, 0.32);
    background: rgba(255, 255, 255, 0.12);
    color: white;
  }
  .launcher-copy {
    overflow: hidden;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  kbd {
    min-width: 25px;
    padding: 3px 6px;
    border: 1px solid currentColor;
    border-radius: 5px;
    font-family: inherit;
    font-size: 9px;
    font-weight: 750;
    line-height: 1.2;
    text-align: center;
    opacity: 0.78;
  }
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: start center;
    padding: 10vh 18px 18px;
    background: rgba(5, 20, 31, 0.48);
    backdrop-filter: blur(3px);
  }
  .palette {
    width: min(660px, 100%);
    overflow: hidden;
    border: 1px solid #bfd0da;
    border-radius: 13px;
    background: white;
    color: var(--ink);
    box-shadow: 0 22px 70px rgba(4, 27, 42, 0.28);
  }
  .search {
    min-height: 56px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    padding: 0 14px;
    border-bottom: 1px solid #dce5ea;
  }
  .search > span {
    color: #60798b;
    font-size: 20px;
  }
  .search input {
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: #183047;
    font-size: 15px;
  }
  .search button {
    border: 1px solid #d4dfe5;
    border-radius: 5px;
    padding: 4px 6px;
    background: #f8fafb;
    color: #6a7d89;
    font-size: 9px;
    font-weight: 800;
    cursor: pointer;
  }
  .results {
    max-height: min(520px, 62vh);
    overflow: auto;
    padding: 7px;
  }
  .results a {
    display: grid;
    grid-template-columns: 108px minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    min-height: 50px;
    padding: 8px 10px;
    border-radius: 8px;
    color: inherit;
    text-decoration: none;
  }
  .results a:hover,
  .results a:focus-visible {
    outline: 0;
    background: #edf7fc;
  }
  .group {
    color: #718592;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .copy {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .copy strong {
    overflow: hidden;
    color: #29475c;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .copy small {
    overflow: hidden;
    color: #788b97;
    font-size: 9.5px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .arrow {
    color: #7f9aaa;
    font-size: 14px;
  }
  .no-results {
    display: grid;
    gap: 4px;
    padding: 24px 18px;
    text-align: center;
  }
  .no-results strong {
    color: #39576a;
    font-size: 12px;
  }
  .no-results span {
    color: #7d8e99;
    font-size: 10px;
  }
  footer {
    display: flex;
    gap: 16px;
    justify-content: end;
    padding: 8px 12px;
    border-top: 1px solid #e3eaee;
    background: #fafcfd;
    color: #81919b;
    font-size: 9px;
  }
  footer span {
    display: inline-flex;
    gap: 4px;
    align-items: center;
  }
  @media (max-width: 760px) {
    .launcher {
      width: 40px;
      padding: 0;
      justify-content: center;
    }
    .launcher-copy {
      font-size: 0;
    }
    .launcher-copy::after {
      content: '⌕';
      font-size: 17px;
    }
    .launcher kbd {
      display: none;
    }
    .backdrop {
      padding-top: 62px;
    }
    .results a {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .group {
      display: none;
    }
  }
</style>
