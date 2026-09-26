<script lang="ts">
  import MarketingShell from '$lib/components/MarketingShell.svelte';
  import { platformPillars, proofPoints } from '$lib/marketing/site';

  const journeys = [
    {
      eyebrow: 'Operate the enterprise',
      title: 'Run the 29 Functions that make the organisation work.',
      body: 'Strategy, governance, commercial, customers, procurement, finance, people, technology, risk, information, projects and continuous improvement share one governed enterprise model.',
      href: '/functions',
      action: 'Explore all 29 Functions'
    },
    {
      eyebrow: 'Deliver the work',
      title: 'Carry real work from requirement to accepted deliverable.',
      body: 'NuBlox connects the worker, Position, Function, project, responsibility, workflow, information, approval, evidence and resulting work product rather than treating work as a disconnected task list.',
      href: '/product',
      action: 'See how NuBlox works'
    },
    {
      eyebrow: 'Industry depth',
      title: 'Construction & Built Environment without a separate software universe.',
      body: 'D01–D16 extend the same Function model around real industry Job Profiles, specialist tools, surveys, drawings, specifications, cost plans, inspections, site delivery, assets and regulated evidence.',
      href: '/construction-built-environment',
      action: 'Explore the CBE solution'
    }
  ];
</script>

<svelte:head>
  <title>NuBlox — One connected operating environment for the whole enterprise</title>
  <meta
    name="description"
    content="NuBlox connects how an organisation operates with how it delivers: 29 core business Functions, industry Functions, people, work, projects, information and evidence in one enterprise operating environment."
  />
</svelte:head>

<MarketingShell>
  <main class="marketing-main">
    <section class="marketing-hero marketing-hero-home">
      <div class="marketing-hero-copy">
        <p class="marketing-kicker">Enterprise operating platform</p>
        <h1>Run the business.<br />Deliver the work.<br /><em>Keep it connected.</em></h1>
        <p class="marketing-lede">
          NuBlox brings together the organisation, its 29 Core Business Functions, industry delivery,
          people, projects, transactions, work products, decisions and evidence in one governed environment.
        </p>
        <div class="marketing-cta-row">
          <a class="marketing-button" href="/contact">Book a conversation</a>
          <a class="marketing-link-arrow" href="/product">Explore the product <span>→</span></a>
        </div>
      </div>
      <div class="marketing-hero-panel" aria-label="NuBlox operating model">
        <span>NuBlox enterprise model</span>
        <strong>How the organisation operates</strong>
        <div class="marketing-flow-line"></div>
        <strong>How the organisation delivers</strong>
        <p>Connected by shared identity, authority, work, information, workflow and evidence.</p>
      </div>
    </section>

    <section class="marketing-proof" aria-label="NuBlox product coverage">
      {#each proofPoints as point}
        <div>
          <strong>{point[0]}</strong>
          <span>{point[1]}</span>
        </div>
      {/each}
    </section>

    <section class="marketing-section">
      <div class="marketing-section-heading">
        <p class="marketing-kicker">Why NuBlox</p>
        <h2>Enterprise software should reflect the enterprise — not a collection of disconnected modules.</h2>
        <p>
          NuBlox is designed around one universal Function model and one connected object graph so operational
          work, functional governance and industry delivery can share the same enterprise truth.
        </p>
      </div>
      <div class="marketing-card-grid three">
        {#each journeys as journey}
          <article class="marketing-card marketing-card-link">
            <p class="marketing-kicker">{journey.eyebrow}</p>
            <h3>{journey.title}</h3>
            <p>{journey.body}</p>
            <a href={journey.href}>{journey.action} <span>→</span></a>
          </article>
        {/each}
      </div>
    </section>

    <section class="marketing-section marketing-section-dark">
      <div class="marketing-section-heading">
        <p class="marketing-kicker">One platform</p>
        <h2>The operating spine behind every Function and every industry workflow.</h2>
      </div>
      <div class="marketing-card-grid three">
        {#each platformPillars as pillar}
          <article class="marketing-card dark">
            <h3>{pillar.title}</h3>
            <p>{pillar.body}</p>
          </article>
        {/each}
      </div>
      <a class="marketing-link-arrow light" href="/product/platform">Explore the platform architecture <span>→</span></a>
    </section>

    <section class="marketing-split marketing-section">
      <div>
        <p class="marketing-kicker">Configured to the business</p>
        <h2>Start with the whole model. Activate what the organisation actually needs.</h2>
      </div>
      <div>
        <p>
          NuBlox does not need to fragment the enterprise into separately licensed Function silos. Tenant
          provisioning resolves the organisation’s business profile and industry context, keeps the canonical
          model intact, and distinguishes between capabilities enabled by default, available to activate, and
          not currently applicable.
        </p>
        <a class="marketing-link-arrow" href="/pricing">See the commercial model <span>→</span></a>
      </div>
    </section>

    <section class="marketing-final-cta">
      <p class="marketing-kicker">Build one operating environment</p>
      <h2>Replace application sprawl with connected enterprise execution.</h2>
      <div class="marketing-cta-row">
        <a class="marketing-button inverse" href="/contact">Talk to NuBlox</a>
        <a class="marketing-link-arrow light" href="/register">Start a Tenant <span>→</span></a>
      </div>
    </section>
  </main>
</MarketingShell>
