<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Candidate portal — {data.tenant.name}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main>
  <header class="masthead">
    <a class="brand" href={`/${data.tenant.slug}/`}>{data.tenant.name}</a>
    <span class="status">Candidate portal</span>
  </header>

  <section class="hero">
    <p class="eyebrow">External candidate access</p>
    <h1>Candidate<br />portal</h1>
    <div>
      <p class="lede">
        Candidate identity is kept separate from employee identity. A successful hire can later be
        converted into the governed Person, Employment and Position-occupancy records used inside NuBlox.
      </p>
      <a class="primary-action landing-action" href={`/${data.tenant.slug}/careers`}>
        View advertised roles <span aria-hidden="true">→</span>
      </a>
    </div>
  </section>
</main>
