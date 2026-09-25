<script lang="ts">
  const capabilities = [
    {
      number: '01',
      title: 'Run the business',
      body: 'Define strategy and connect it to planning, people, customers, finance, risk, information, assets and operational execution across 29 core business Functions.'
    },
    {
      number: '02',
      title: 'One coherent application',
      body: 'NuBlox is designed to replace fragmented enterprise application estates with native capabilities operating on one connected enterprise object graph.'
    },
    {
      number: '03',
      title: 'Built from market evidence',
      body: 'The capability model is benchmarked against leading enterprise products across every Function rather than being designed from a narrow ERP module list.'
    },
    {
      number: '04',
      title: 'Industry job depth',
      body: 'Construction & Built Environment extends the platform around the real work, tools and work products required by industry Job Profiles.'
    }
  ];
</script>

<svelte:head>
  <title>NuBlox — Run your entire business in one coherent application</title>
  <meta
    name="description"
    content="NuBlox is a metadata-driven enterprise operating platform designed to connect strategy, operations, delivery, people, work and enterprise truth in one coherent application."
  />
</svelte:head>

<main>
  <header class="masthead">
    <a class="brand" href="/" aria-label="NuBlox home">NuBlox</a>
    <span class="status"><a href="/login">Sign in</a> · <a href="/register">Start with NuBlox</a></span>
  </header>

  <section class="hero">
    <p class="eyebrow">Metadata-driven enterprise operating platform</p>
    <h1>Run your entire<br />business on NuBlox.</h1>
    <div>
      <p class="lede">
        Define business strategy and carry it through the organisation, its people, Functions,
        transactions, projects, work products and results — in one connected operating environment.
      </p>
      <a class="primary-action landing-action" href="/register">
        Start with NuBlox <span aria-hidden="true">→</span>
      </a>
    </div>
  </section>

  <section class="architecture" id="capabilities" aria-labelledby="capabilities-title">
    <div class="section-heading">
      <p class="eyebrow">The proposition</p>
      <h2 id="capabilities-title">One business. One connected model. Every area of work.</h2>
    </div>

    <div class="layer-grid">
      {#each capabilities as capability}
        <article class="layer">
          <span>{capability.number}</span>
          <h3>{capability.title}</h3>
          <p>{capability.body}</p>
        </article>
      {/each}
    </div>
  </section>

  <section class="industry">
    <p class="eyebrow">Construction &amp; Built Environment</p>
    <h2>Go beyond generic ERP.</h2>
    <p>
      NuBlox is being developed around the real jobs performed in the built environment and the
      specialist tools, governed information, transactions and physical-delivery evidence those jobs require.
    </p>
  </section>
</main>
