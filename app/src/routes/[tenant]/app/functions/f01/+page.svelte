<script lang="ts">
  import WorkspaceHeader from '$lib/components/WorkspaceHeader.svelte';
  import SubfunctionGrid from '$lib/components/SubfunctionGrid.svelte';
  import JourneyStrip from '$lib/components/JourneyStrip.svelte';
  import PlatformStrip from '$lib/components/PlatformStrip.svelte';
  import { f01Workspace } from '$lib/workspaces/f01';

  let { data } = $props();
  const baseHref = $derived(`/${data.tenantSlug}/app/functions/f01`);
</script>

<svelte:head>
  <title>F01 Strategy & Enterprise Planning · NuBlox</title>
</svelte:head>

<div class="workspace-page">
  <WorkspaceHeader
    id={f01Workspace.id}
    name={f01Workspace.name}
    purpose={f01Workspace.purpose}
    objects={f01Workspace.objects}
  />
  <SubfunctionGrid areas={f01Workspace.areas} {baseHref} />
  <JourneyStrip journey={f01Workspace.journey} />
  <PlatformStrip services={f01Workspace.platformServices} integration={f01Workspace.integration} />
</div>
