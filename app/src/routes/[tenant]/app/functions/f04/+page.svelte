<script lang="ts">
  import WorkspaceHeader from '$lib/components/WorkspaceHeader.svelte';
  import SubfunctionGrid from '$lib/components/SubfunctionGrid.svelte';
  import JourneyStrip from '$lib/components/JourneyStrip.svelte';
  import PlatformStrip from '$lib/components/PlatformStrip.svelte';
  import { f04Workspace } from '$lib/workspaces/f04';

  let { data } = $props();
  const baseHref = $derived(`/${data.tenantSlug}/app/functions/f04`);
</script>

<svelte:head>
  <title>F04 Corporate Development & M&A · NuBlox</title>
</svelte:head>

<div class="workspace-page">
  <WorkspaceHeader
    id={f04Workspace.id}
    name={f04Workspace.name}
    purpose={f04Workspace.purpose}
    objects={f04Workspace.objects}
  />
  <SubfunctionGrid
    areas={f04Workspace.areas}
    {baseHref}
    eyebrow="Corporate development workspace map"
    title="Seven governed Corporate Development work areas"
    description="F04 separates opportunity, appraisal, legal diligence, decision-support case and integration transformation so the deal lifecycle remains auditable without duplicating CRM, finance, legal, organisation or project masters."
  />
  <JourneyStrip journey={f04Workspace.journey} />
  <PlatformStrip services={f04Workspace.platformServices} integration={f04Workspace.integration} />
</div>
