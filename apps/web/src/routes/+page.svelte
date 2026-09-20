<script lang="ts">
  const layers = [
    {
      number: '01',
      title: 'Enterprise Kernel',
      body: 'Canonical objects, identity, organisation, authority, workflow, lifecycle, change, information, configuration, evidence and audit.'
    },
    {
      number: '02',
      title: 'Functional Domains',
      body: '29 governed enterprise functions with native domain tools operating on one shared enterprise object graph.'
    },
    {
      number: '03',
      title: 'Work-Delivery Runtime',
      body: 'Deployments, assignments, work, deliverables, decisions, review, approval, issue, acceptance and controlled evidence.'
    },
    {
      number: '04',
      title: 'Industry Solutions',
      body: 'Sector configurations beginning with Construction & Built Environment: 16 delivery domains and 84 job profiles.'
    }
  ];
</script>

<svelte:head>
  <title>NuBlox — Enterprise Operating Platform</title>
  <meta
    name="description"
    content="NuBlox enterprise operating platform"
  />
</svelte:head>

<main>
  <header class="masthead">
    <a class="brand" href="/" aria-label="NuBlox home">NuBlox</a>
    <span class="status">Product foundation</span>
  </header>

  <section class="hero">
    <p class="eyebrow">Enterprise Operating Platform</p>
    <h1>Govern capability.<br />Deploy it.<br />Deliver the work.</h1>
    <p class="lede">
      One canonical enterprise platform for how an organisation operates, how it delivers value,
      and the controlled work products it creates.
    </p>
  </section>

  <section class="architecture" aria-labelledby="architecture-title">
    <div class="section-heading">
      <p class="eyebrow">Architecture</p>
      <h2 id="architecture-title">One product. Shared kernel. Native execution.</h2>
    </div>

    <div class="layer-grid">
      {#each layers as layer}
        <article class="layer">
          <span>{layer.number}</span>
          <h3>{layer.title}</h3>
          <p>{layer.body}</p>
        </article>
      {/each}
    </div>
  </section>

  <section class="industry">
    <p class="eyebrow">First industry solution</p>
    <h2>Construction &amp; Built Environment</h2>
    <p>
      The construction solution configures NuBlox for projects, contracts, packages, sites,
      facilities, systems, assets, technical information and the work of 84 sector job profiles.
      It does not define the boundary of the platform.
    </p>
  </section>
</main>
