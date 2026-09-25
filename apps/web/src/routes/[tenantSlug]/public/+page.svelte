<script lang="ts">
  import type { PageData } from './$types';
  import { tenantPublicPath, tenantSignInPath } from '$lib/tenant-paths';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.tenant.name} — NuBlox</title>
  <meta name="description" content={`${data.tenant.name} public site on NuBlox`} />
</svelte:head>

<main>
  <header class="masthead">
    <a class="brand" href={tenantPublicPath(data.tenant.slug)}>{data.tenant.name}</a>
    <span class="status">Powered by NuBlox</span>
  </header>

  <section class="hero">
    <p class="eyebrow">Tenant public site</p>
    <h1>{data.tenant.name}</h1>
    <div>
      <p class="lede">
        Public information published by {data.tenant.name} from its governed NuBlox tenant.
      </p>
      <a class="primary-action landing-action" href={tenantPublicPath(data.tenant.slug, '/careers')}>
        View careers <span aria-hidden="true">→</span>
      </a>
    </div>
  </section>

  <section class="architecture" aria-labelledby="tenant-public-title">
    <div class="section-heading">
      <p class="eyebrow">Public access</p>
      <h2 id="tenant-public-title">One business. Controlled public surfaces.</h2>
    </div>

    <div class="layer-grid">
      <article class="layer">
        <span>01</span>
        <h3>Careers</h3>
        <p>View roles that the organisation has deliberately published for external applicants.</p>
        <a href={tenantPublicPath(data.tenant.slug, '/careers')}>Open careers →</a>
      </article>
      <article class="layer">
        <span>02</span>
        <h3>Candidate portal</h3>
        <p>Candidate access is isolated from the employee application and tenant workforce session.</p>
        <a href={tenantPublicPath(data.tenant.slug, '/candidate')}>Candidate portal →</a>
      </article>
      <article class="layer">
        <span>03</span>
        <h3>Employee access</h3>
        <p>Employees enter the private NuBlox operating environment through tenant-scoped authentication.</p>
        <a href={tenantSignInPath(data.tenant.slug)}>Employee sign in →</a>
      </article>
      <article class="layer">
        <span>04</span>
        <h3>NuBlox</h3>
        <p>Learn about the enterprise platform that powers this organisation's digital operating environment.</p>
        <a href="/">Visit NuBlox →</a>
      </article>
    </div>
  </section>
</main>
