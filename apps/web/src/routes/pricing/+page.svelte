<script lang="ts">
  import MarketingShell from '$lib/components/MarketingShell.svelte';

  const principles = [
    ['Whole-enterprise product', 'NuBlox is positioned as one connected enterprise operating environment rather than a catalogue of disconnected Function licences.'],
    ['Configured by operating profile', 'Tenant configuration determines which Functions are enabled by default, available to activate, or not currently applicable without deleting the canonical enterprise model.'],
    ['Scale with the organisation', 'Commercial terms can reflect organisational scale, operating complexity, deployment scope and service requirements rather than charging separately for every Function.'],
    ['Transparent implementation scope', 'Data migration, integration, configuration, rollout, assurance and specialist implementation services are scoped explicitly rather than being hidden inside software access.']
  ];
</script>

<svelte:head>
  <title>Pricing & commercial model — NuBlox</title>
  <meta name="description" content="Understand the NuBlox commercial model: one enterprise product, operating-profile configuration and organisation-scale pricing rather than fragmented per-Function licensing." />
</svelte:head>

<MarketingShell>
  <main class="marketing-main">
    <section class="marketing-hero compact">
      <div class="marketing-hero-copy">
        <p class="marketing-kicker">Pricing & commercial model</p>
        <h1>One enterprise product. Commercial terms matched to the organisation.</h1>
        <p class="marketing-lede">NuBlox is not being designed as 29 separately licensed applications. The commercial model follows the product architecture: one connected platform, configured to the Tenant and scaled to the organisation.</p>
      </div>
    </section>

    <section class="marketing-section">
      <div class="marketing-card-grid two">
        {#each principles as principle}
          <article class="marketing-card feature-card"><h3>{principle[0]}</h3><p>{principle[1]}</p></article>
        {/each}
      </div>
    </section>

    <section class="marketing-section marketing-section-dark">
      <div class="marketing-section-heading">
        <p class="marketing-kicker">What informs a commercial proposal</p>
        <h2>Scope the operating environment, not a shopping basket of modules.</h2>
      </div>
      <div class="marketing-card-grid three">
        <article class="marketing-card dark"><h3>Organisation scale</h3><p>Employees, legal entities, operating geographies, business units and expected platform usage.</p></article>
        <article class="marketing-card dark"><h3>Operating complexity</h3><p>Industry profile, governance requirements, project and service delivery, regulatory obligations and enterprise structure.</p></article>
        <article class="marketing-card dark"><h3>Implementation scope</h3><p>Migration, integration, configuration, deployment, adoption, assurance and support requirements.</p></article>
      </div>
    </section>

    <section class="marketing-split marketing-section">
      <div><p class="marketing-kicker">No artificial Function penalty</p><h2>Activating a relevant Function should not force a new software estate.</h2></div>
      <div>
        <p>The NuBlox operating-profile model is designed so a capability can move from available to enabled as the organisation evolves. The commercial conversation therefore starts from the enterprise relationship and agreed scope, not from forcing each newly relevant Function into an unrelated product purchase.</p>
        <p class="marketing-note">Specific subscription rates, implementation fees and contractual terms are provided through a commercial proposal because deployment scope is organisation-specific.</p>
      </div>
    </section>

    <section class="marketing-final-cta">
      <p class="marketing-kicker">Commercial discussion</p>
      <h2>Tell us the shape of your organisation and what you need NuBlox to replace or enable.</h2>
      <a class="marketing-button inverse" href="/contact">Request a commercial conversation</a>
    </section>
  </main>
</MarketingShell>
