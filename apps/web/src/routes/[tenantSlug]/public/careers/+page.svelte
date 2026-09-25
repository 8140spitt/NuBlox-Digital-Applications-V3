<script lang="ts">
  import type { PageData } from './$types';
  import { tenantPublicPath, tenantSignInPath } from '$lib/tenant-paths';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Careers at {data.tenant.name} — NuBlox</title>
  <meta name="description" content={`Careers and advertised roles at ${data.tenant.name}`} />
</svelte:head>

<main>
  <header class="masthead">
    <a class="brand" href={tenantPublicPath(data.tenant.slug)}>{data.tenant.name}</a>
    <a class="status" href={tenantSignInPath(data.tenant.slug)}>Employee sign in</a>
  </header>

  <section class="hero">
    <p class="eyebrow">Careers</p>
    <h1>Work with<br />{data.tenant.name}</h1>
    <div>
      <p class="lede">
        Advertised roles published from the organisation's governed Human Capital process appear here.
      </p>
    </div>
  </section>

  <section class="industry">
    <p class="eyebrow">Current opportunities</p>
    <h2>No public roles are currently published.</h2>
    <p>
      When the organisation publishes an approved vacancy, candidates will be able to review the role
      and apply from this tenant-owned public surface without entering the private employee application.
    </p>
  </section>
</main>
