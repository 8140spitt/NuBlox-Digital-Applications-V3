<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<svelte:head>
  <meta name="description" content="NuBlox — construction and built-environment operating system" />
</svelte:head>

{@render children()}
