<script lang="ts">
  import MarketingShell from '$lib/components/MarketingShell.svelte';
  import { resourceCards } from '$lib/marketing/site';

  const guides = [
    ['Enterprise Function model', 'How F01–F29 organise the capabilities required to operate a sophisticated organisation.'],
    ['CBE operating profiles', 'How consultancy, contractor, specialist, supplier and client organisations resolve different initial Function states.'],
    ['Position-led working world', 'How Job Architecture, Positions, occupancy, Function assignment and hierarchy shape what a worker sees and does.'],
    ['Work-product governance', 'How requirements, versions, review, approval, issue, acceptance and records stay connected to the output of work.'],
    ['Metadata-driven configuration', 'How governed Things, fields, values, relationships and constraints support product evolution without uncontrolled forks.'],
    ['Migration & evidence', 'How enterprise data migration, reconciliation, cutover and evidence fit the same controlled operating model.']
  ];
</script>

<svelte:head>
  <title>Resources — NuBlox</title>
  <meta name="description" content="Explore NuBlox product architecture, Function models, CBE operating profiles, position-led work, metadata configuration and enterprise governance resources." />
</svelte:head>

<MarketingShell>
  <main class="marketing-main">
    <section class="marketing-hero compact">
      <div class="marketing-hero-copy">
        <p class="marketing-kicker">Resources</p>
        <h1>Understand the operating model behind the product.</h1>
        <p class="marketing-lede">NuBlox is being built from explicit enterprise architecture, market benchmarking and governed product decisions. These public resources explain the core model buyers and practitioners need to evaluate.</p>
      </div>
    </section>

    <section class="marketing-section">
      <div class="marketing-card-grid two">
        {#each resourceCards as card}
          <article class="marketing-card marketing-card-link">
            <h3>{card.title}</h3>
            <p>{card.body}</p>
            <a href={card.href}>Explore <span>→</span></a>
          </article>
        {/each}
      </div>
    </section>

    <section class="marketing-section marketing-section-tint">
      <div class="marketing-section-heading">
        <p class="marketing-kicker">Evaluation guides</p>
        <h2>Six questions to use when assessing NuBlox against your current estate.</h2>
      </div>
      <div class="marketing-card-grid three">
        {#each guides as guide}
          <article class="marketing-card"><h3>{guide[0]}</h3><p>{guide[1]}</p></article>
        {/each}
      </div>
    </section>

    <section class="marketing-split marketing-section">
      <div><p class="marketing-kicker">For enterprise reviewers</p><h2>Architecture, security, procurement and functional stakeholders should be able to inspect the same model.</h2></div>
      <div><p>NuBlox is intended to make product scope and control explicit: which Function owns the capability, which business objects are authoritative, which workflow governs the work, where authority comes from, what evidence is retained and how industry-specific execution extends the shared enterprise core.</p><a class="marketing-link-arrow" href="/contact">Request a structured review <span>→</span></a></div>
    </section>
  </main>
</MarketingShell>
