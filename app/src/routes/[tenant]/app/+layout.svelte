<script lang="ts">
  import AppShell from '$lib/components/AppShell.svelte';
  let { data, children } = $props();
</script>

<AppShell
  tenantSlug={data.tenantSlug}
  actorDisplayName={data.actorDisplayName}
  authenticated={data.authenticated}
  initialWorkContexts={data.workContexts}
>
  {@render children()}
</AppShell>
