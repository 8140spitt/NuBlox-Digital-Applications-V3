<script lang="ts">
  import WorkspaceHeader from '$lib/components/WorkspaceHeader.svelte';
  import SubfunctionGrid from '$lib/components/SubfunctionGrid.svelte';
  import JourneyStrip from '$lib/components/JourneyStrip.svelte';
  import PlatformStrip from '$lib/components/PlatformStrip.svelte';
  import { f03Workspace } from '$lib/workspaces/f03';

  let { data } = $props();
  const baseHref = $derived(`/${data.tenantSlug}/app/functions/f03`);
</script>

<svelte:head>
  <title>F03 Enterprise Performance Management · NuBlox</title>
</svelte:head>

<div class="workspace-page">
  <WorkspaceHeader
    id={f03Workspace.id}
    name={f03Workspace.name}
    purpose={f03Workspace.purpose}
    objects={f03Workspace.objects}
  />
  <SubfunctionGrid
    areas={f03Workspace.areas}
    {baseHref}
    eyebrow="Enterprise performance workspace map"
    title="Six integrated performance work areas"
    description="F03 reuses the shared performance aggregate established in F01: KPI definitions, targets, observations and baselines are not duplicated. F03 adds enterprise scorecards, published snapshots, operating review, benchmarking and benefit traceability."
  />
  <JourneyStrip journey={f03Workspace.journey} />
  <PlatformStrip services={f03Workspace.platformServices} integration={f03Workspace.integration} />
</div>