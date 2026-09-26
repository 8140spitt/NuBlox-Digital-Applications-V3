<script lang="ts">
  import MarketingShell from '$lib/components/MarketingShell.svelte';
  import { platformPillars } from '$lib/marketing/site';

  const lifecycle = [
    ['1', 'Define', 'Set strategy, policy, structure, roles, authority, metadata and standards.'],
    ['2', 'Plan', 'Turn intent into portfolios, programmes, projects, capacity, budgets and accountable work.'],
    ['3', 'Execute', 'Perform work inside the relevant Function with the right tools, data and responsibilities.'],
    ['4', 'Review', 'Route work through validation, review, approval, acceptance and controlled change.'],
    ['5', 'Evidence', 'Retain the decisions, versions, records, audit trail and outcomes needed to prove what happened.'],
    ['6', 'Improve', 'Feed performance, lessons, risks and operational evidence back into enterprise planning and improvement.']
  ];
</script>

<svelte:head>
  <title>Product — NuBlox</title>
  <meta name="description" content="Explore the NuBlox enterprise operating product: Functions, work delivery, information, authority, workflow, evidence and industry execution in one connected model." />
</svelte:head>

<MarketingShell>
  <main class="marketing-main">
    <section class="marketing-hero compact">
      <div class="marketing-hero-copy">
        <p class="marketing-kicker">Product</p>
        <h1>One operating environment from enterprise intent to delivered work.</h1>
        <p class="marketing-lede">NuBlox connects the structures that define the business with the work people actually perform — without losing authority, context, evidence or the resulting work product between systems.</p>
      </div>
    </section>

    <section class="marketing-section">
      <div class="marketing-section-heading">
        <p class="marketing-kicker">What NuBlox connects</p>
        <h2>The enterprise model and the execution model are the same system.</h2>
      </div>
      <div class="marketing-card-grid three">
        {#each platformPillars as pillar}
          <article class="marketing-card"><h3>{pillar.title}</h3><p>{pillar.body}</p></article>
        {/each}
      </div>
    </section>

    <section class="marketing-section marketing-section-tint">
      <div class="marketing-section-heading">
        <p class="marketing-kicker">Execution lifecycle</p>
        <h2>Govern the complete chain of work, not just its final transaction.</h2>
      </div>
      <div class="marketing-step-grid">
        {#each lifecycle as step}
          <article>
            <span>{step[0]}</span>
            <h3>{step[1]}</h3>
            <p>{step[2]}</p>
          </article>
        {/each}
      </div>
    </section>

    <section class="marketing-split marketing-section">
      <div>
        <p class="marketing-kicker">Working world</p>
        <h2>The application resolves around the Person’s Position and Function.</h2>
      </div>
      <div>
        <p>A worker’s occupied Position determines their primary working context, Function, reporting hierarchy and authority. Managers can see their own work plus the work that falls within their Position hierarchy, while cross-functional work remains explicit rather than becoming an uncontrolled permission shortcut.</p>
        <p>That gives NuBlox a coherent answer to a basic enterprise question: <strong>what should this person see, do, own, review or approve right now?</strong></p>
      </div>
    </section>

    <section class="marketing-section marketing-section-dark">
      <div class="marketing-section-heading">
        <p class="marketing-kicker">Industry execution</p>
        <h2>Extend the universal Function model into specialist work without building a second platform.</h2>
      </div>
      <div class="marketing-card-grid two">
        <article class="marketing-card dark">
          <h3>Core Business Functions</h3>
          <p>F01–F29 govern and execute the capabilities every sophisticated enterprise needs: strategy, commercial, finance, HCM, technology, risk, information, projects and more.</p>
          <a class="marketing-link-arrow light" href="/functions">Explore F01–F29 <span>→</span></a>
        </article>
        <article class="marketing-card dark">
          <h3>Construction & Built Environment</h3>
          <p>D01–D16 bring architecture, engineering, surveying, cost, site delivery, trades, facilities, infrastructure and regulation into the same Function, work and evidence model.</p>
          <a class="marketing-link-arrow light" href="/construction-built-environment">Explore D01–D16 <span>→</span></a>
        </article>
      </div>
    </section>

    <section class="marketing-final-cta">
      <p class="marketing-kicker">See the model in your business context</p>
      <h2>Map NuBlox to how your organisation operates and delivers.</h2>
      <a class="marketing-button inverse" href="/contact">Book a conversation</a>
    </section>
  </main>
</MarketingShell>
