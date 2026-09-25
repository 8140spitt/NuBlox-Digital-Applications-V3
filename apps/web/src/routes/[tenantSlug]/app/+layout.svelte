<script lang="ts">
  import { page } from '$app/state';
  import type { LayoutData } from './$types';
  import AppShell from '$lib/components/AppShell.svelte';

  let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

  const isAuthenticationRoute = $derived(page.url.pathname.includes('/app/auth/'));
</script>

{#if isAuthenticationRoute}
  {@render children()}
{:else if data.session}
  <AppShell session={data.session}>
    {@render children()}
  </AppShell>
{/if}
