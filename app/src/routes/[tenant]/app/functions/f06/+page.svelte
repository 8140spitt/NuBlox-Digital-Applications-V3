<script lang="ts">
  import WorkspaceHeader from '$lib/components/WorkspaceHeader.svelte';
  import SubfunctionGrid from '$lib/components/SubfunctionGrid.svelte';
  import JourneyStrip from '$lib/components/JourneyStrip.svelte';
  import PlatformStrip from '$lib/components/PlatformStrip.svelte';
  import { f06Workspace } from '$lib/workspaces/f06';

  let { data } = $props();
  const baseHref = $derived(`/${data.tenantSlug}/app/functions/f06`);
</script>

<svelte:head>
  <title>F06 Marketing & Brand · NuBlox</title>
</svelte:head>

<div class="workspace-page">
  <WorkspaceHeader
    id={f06Workspace.id}
    name={f06Workspace.name}
    purpose={f06Workspace.purpose}
    objects={f06Workspace.objects}
  />
  <SubfunctionGrid
    areas={f06Workspace.areas}
    {baseHref}
    eyebrow="Marketing & brand workspace map"
    title="Eleven governed marketing work areas"
    description="F06 uses shared Market Insight, Party, Information, Decision and Privacy authorities. Campaigns orchestrate exact audience/content versions, while Leads preserve commercial provenance into F07 rather than becoming a second customer database."
  />
  <JourneyStrip journey={f06Workspace.journey} />
  <PlatformStrip services={f06Workspace.platformServices} integration={f06Workspace.integration} />
</div>
