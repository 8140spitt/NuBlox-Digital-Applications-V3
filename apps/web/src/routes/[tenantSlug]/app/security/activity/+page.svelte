<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function formatDate(value: string) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }
</script>

<svelte:head>
  <title>Security activity — NuBlox</title>
  <meta
    name="description"
    content="Review authentication and account-security activity for this Tenant."
  />
</svelte:head>

<section class="workspace-hero">
  <div>
    <p class="app-eyebrow">Account security</p>
    <h1>Security activity</h1>
    <p class="workspace-lede">
      Authentication events for your identity in this Tenant. NuBlox records security outcomes
      without exposing session tokens, authenticator secrets or raw recovery codes.
    </p>
  </div>
</section>

<section class="home-section">
  {#if data.events.length === 0}
    <p>No authentication activity is recorded yet.</p>
  {:else}
    <div class="home-primary-grid">
      {#each data.events as event}
        <article class="home-primary-card">
          <span>{event.outcome === 'SUCCESS' ? 'OK' : event.outcome === 'DENIED' ? 'NO' : 'ER'}</span>
          <div>
            <strong>{event.label}</strong>
            <p>{event.outcome} · {formatDate(event.occurredAt)}</p>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>
