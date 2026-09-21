<script lang="ts">
  import type { LayoutData } from './$types';
  import AppShell from '$lib/components/AppShell.svelte';

  let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
</script>

{#if data.session}
  <AppShell session={data.session}>
    {@render children()}
  </AppShell>
{/if}
