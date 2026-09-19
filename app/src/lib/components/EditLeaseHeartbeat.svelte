<script lang="ts">
  import { onMount } from 'svelte';

  let {
    tenantSlug,
    objectType,
    objectId,
    leaseToken
  }: {
    tenantSlug: string;
    objectType: string;
    objectId: string;
    leaseToken: string;
  } = $props();

  let lost = $state(false);

  async function call(operation: 'heartbeat' | 'release', keepalive = false) {
    const response = await fetch(`/${tenantSlug}/app/api/edit-leases`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      keepalive,
      body: JSON.stringify({
        operation,
        objectType,
        objectId,
        leaseToken,
        note: operation === 'release' ? 'Edit view closed; recoverable draft retained.' : undefined
      })
    });
    if (!response.ok && operation === 'heartbeat') lost = true;
  }

  onMount(() => {
    const timer = window.setInterval(() => void call('heartbeat'), 45_000);
    const release = () => void call('release', true);
    window.addEventListener('pagehide', release);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('pagehide', release);
    };
  });
</script>

{#if lost}
  <div class="lease-lost" role="alert">
    This edit lease is no longer active. Your draft is retained; reload before committing changes.
  </div>
{/if}

<style>
  .lease-lost {
    padding: 8px 10px;
    border: 1px solid #d59857;
    border-radius: 7px;
    background: #fff8e8;
    color: #704e1d;
    font-size: 9px;
  }
</style>
