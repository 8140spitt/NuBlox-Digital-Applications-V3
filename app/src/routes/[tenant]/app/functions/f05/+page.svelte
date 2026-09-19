<script lang="ts">
  import WorkspaceHeader from '$lib/components/WorkspaceHeader.svelte';
  import SubfunctionGrid from '$lib/components/SubfunctionGrid.svelte';
  import JourneyStrip from '$lib/components/JourneyStrip.svelte';
  import PlatformStrip from '$lib/components/PlatformStrip.svelte';
  import { f05Workspace } from '$lib/workspaces/f05';

  let { data } = $props();
  const baseHref = $derived(`/${data.tenantSlug}/app/functions/f05`);
</script>

<svelte:head>
  <title>F05 Product, Service & Innovation Management · NuBlox</title>
</svelte:head>

<div class="workspace-page">
  <WorkspaceHeader
    id={f05Workspace.id}
    name={f05Workspace.name}
    purpose={f05Workspace.purpose}
    objects={f05Workspace.objects}
  />
  <SubfunctionGrid
    areas={f05Workspace.areas}
    {baseHref}
    eyebrow="Product, service & innovation workspace map"
    title="Ten governed product and innovation work areas"
    description="F05 separates market evidence, Item identity, investment decision support and controlled configuration. This preserves traceability from customer need to launched offering without creating a monolithic PLM silo."
  />
  <JourneyStrip journey={f05Workspace.journey} />
  <PlatformStrip services={f05Workspace.platformServices} integration={f05Workspace.integration} />
</div>
