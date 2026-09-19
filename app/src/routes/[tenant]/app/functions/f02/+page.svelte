<script lang="ts">
  import WorkspaceHeader from '$lib/components/WorkspaceHeader.svelte';
  import SubfunctionGrid from '$lib/components/SubfunctionGrid.svelte';
  import JourneyStrip from '$lib/components/JourneyStrip.svelte';
  import PlatformStrip from '$lib/components/PlatformStrip.svelte';
  import { f02Workspace } from '$lib/workspaces/f02';

  let { data } = $props();
  const baseHref = $derived(`/${data.tenantSlug}/app/functions/f02`);
</script>

<svelte:head>
  <title>F02 Corporate Governance · NuBlox</title>
</svelte:head>

<div class="workspace-page">
  <WorkspaceHeader
    id={f02Workspace.id}
    name={f02Workspace.name}
    purpose={f02Workspace.purpose}
    objects={f02Workspace.objects}
  />
  <SubfunctionGrid
    areas={f02Workspace.areas}
    {baseHref}
    eyebrow="Governance workspace map"
    title="Seven corporate governance work areas"
    description="Each area follows the frozen canonical authority model: governance context, meeting, authority, decision, policy and integrity evidence remain distinct identities."
  />
  <JourneyStrip journey={f02Workspace.journey} />
  <PlatformStrip services={f02Workspace.platformServices} integration={f02Workspace.integration} />
</div>
