<script lang="ts">
  import MarketingShell from '$lib/components/MarketingShell.svelte';
  import { proofPoints } from '$lib/marketing/site';
</script>

<svelte:head>
  <title>Company — NuBlox</title>
  <meta name="description" content="Learn what NuBlox is building: a connected enterprise operating platform designed around complete business Functions, real work delivery and industry depth." />
</svelte:head>

<MarketingShell>
  <main class="marketing-main">
    <section class="marketing-hero compact">
      <div class="marketing-hero-copy">
        <p class="marketing-kicker">Company</p>
        <h1>Building enterprise software around the business — not the software category.</h1>
        <p class="marketing-lede">NuBlox exists to connect how an organisation operates with how it delivers. The product is being developed from explicit enterprise architecture, real job requirements, market-tool evidence and governed implementation rather than a narrow module list.</p>
      </div>
    </section>

    <section class="marketing-proof">
      {#each proofPoints as point}<div><strong>{point[0]}</strong><span>{point[1]}</span></div>{/each}
    </section>

    <section class="marketing-split marketing-section">
      <div><p class="marketing-kicker">Product conviction</p><h2>A sophisticated organisation should not need dozens of disconnected systems to know itself.</h2></div>
      <div>
        <p>Strategy, organisation, people, customers, suppliers, finance, projects, information, risk, assets and delivery are different areas of work — but they are not different businesses. NuBlox is designed so those areas retain their specialist capability while operating over a connected enterprise model.</p>
        <p>The same conviction applies to industry delivery: specialist construction and built-environment work belongs inside the enterprise operating model, connected to commercial, people, finance, governance and evidence.</p>
      </div>
    </section>

    <section class="marketing-section marketing-section-dark">
      <div class="marketing-section-heading">
        <p class="marketing-kicker">How the product is being built</p>
        <h2>Architecture-led. Evidence-led. Implementation-led.</h2>
      </div>
      <div class="marketing-card-grid three">
        <article class="marketing-card dark"><h3>Canonical architecture</h3><p>Functions, aggregates, enterprise vocabulary and authority boundaries are governed so feature development converges on one product model.</p></article>
        <article class="marketing-card dark"><h3>Market benchmark</h3><p>Capabilities are compared with leading enterprise and specialist tools to identify the depth required for credible replacement and consolidation.</p></article>
        <article class="marketing-card dark"><h3>Real workflow evidence</h3><p>Industry jobs, work products and delivery journeys are used to test whether the architecture supports the work practitioners actually perform.</p></article>
      </div>
    </section>

    <section class="marketing-final-cta">
      <p class="marketing-kicker">Work with NuBlox</p>
      <h2>Bring us a complex operating model. That is the point.</h2>
      <a class="marketing-button inverse" href="/contact">Start a conversation</a>
    </section>
  </main>
</MarketingShell>
