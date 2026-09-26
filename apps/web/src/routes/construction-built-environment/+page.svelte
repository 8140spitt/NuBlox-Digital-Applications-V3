<script lang="ts">
  import MarketingShell from '$lib/components/MarketingShell.svelte';
  import { cbeFunctions } from '$lib/marketing/site';

  const archetypes = [
    ['Consultancy / advisory', 'Design, surveying, commercial, engineering, compliance and professional-services organisations.'],
    ['Main contractor', 'Prime delivery organisations coordinating projects, supply chain, site execution and commercial control.'],
    ['Subcontractor / specialist', 'Package and specialist delivery organisations combining trade, technical and project obligations.'],
    ['Supplier / manufacturer', 'Product, fabrication, merchant, logistics and fulfilment businesses serving the built environment.'],
    ['Client / asset owner', 'Owners and operators commissioning, governing, receiving and operating built assets.']
  ];

  const workProducts = ['Appointments', 'Surveys', 'Drawings', 'Specifications', 'Reports', 'Cost plans', 'Estimates', 'Contracts', 'Inspections', 'Certificates', 'Asset records', 'Handover evidence'];
</script>

<svelte:head>
  <title>Construction & Built Environment — NuBlox</title>
  <meta name="description" content="NuBlox for Construction & Built Environment: 16 industry Functions, 84 governed Job Profiles, real work products and configurable operating profiles on one enterprise platform." />
</svelte:head>

<MarketingShell>
  <main class="marketing-main">
    <section class="marketing-hero marketing-hero-cbe">
      <div class="marketing-hero-copy">
        <p class="marketing-kicker">Construction & Built Environment</p>
        <h1>Run the enterprise and deliver the built environment in the same system.</h1>
        <p class="marketing-lede">NuBlox connects the 29 Functions required to operate a sophisticated business with 16 specialist CBE Functions that govern and execute the work performed by real industry roles.</p>
        <div class="marketing-cta-row">
          <a class="marketing-button" href="/contact">Book a CBE conversation</a>
          <a class="marketing-link-arrow" href="/functions">See the complete Function model <span>→</span></a>
        </div>
      </div>
      <aside class="marketing-hero-panel">
        <span>CBE operating model</span>
        <strong>29 Core Business Functions</strong>
        <div class="marketing-flow-line"></div>
        <strong>16 CBE Functions</strong>
        <div class="marketing-flow-line"></div>
        <strong>84 governed Job Profiles</strong>
        <p>Connected through Positions, projects, work, information, authority and evidence.</p>
      </aside>
    </section>

    <section class="marketing-section">
      <div class="marketing-section-heading">
        <p class="marketing-kicker">D01–D16</p>
        <h2>The specialist delivery model.</h2>
      </div>
      <div class="marketing-function-grid cbe light">
        {#each cbeFunctions as fn}
          <article><span>{fn[0]}</span><h3>{fn[1]}</h3><p>{fn[2]}</p></article>
        {/each}
      </div>
    </section>

    <section class="marketing-section marketing-section-tint">
      <div class="marketing-section-heading">
        <p class="marketing-kicker">Configured to the operating model</p>
        <h2>Different CBE businesses should not receive the same default workspace.</h2>
        <p>NuBlox uses the organisation’s archetype, contractual position, direct operative workforce and size to resolve a governed CBE operating profile.</p>
      </div>
      <div class="marketing-card-grid three">
        {#each archetypes as archetype}
          <article class="marketing-card"><h3>{archetype[0]}</h3><p>{archetype[1]}</p></article>
        {/each}
      </div>
      <div class="marketing-state-row">
        <div><strong>Default enabled</strong><span>Recommended from day one.</span></div>
        <div><strong>Available</strong><span>Ready to activate as the business needs it.</span></div>
        <div><strong>Not applicable</strong><span>Retained in the canonical model but hidden from the initial working world.</span></div>
      </div>
    </section>

    <section class="marketing-split marketing-section">
      <div>
        <p class="marketing-kicker">Real jobs, real outputs</p>
        <h2>The work product matters as much as the workflow.</h2>
      </div>
      <div>
        <p>NuBlox is intended to let industry workers perform the job they were employed to do and create the governed outputs that job requires. Those outputs stay connected to requirement, author, project, review, approval, issue, acceptance and record status.</p>
        <div class="marketing-chip-grid">
          {#each workProducts as item}<span>{item}</span>{/each}
        </div>
      </div>
    </section>

    <section class="marketing-section marketing-section-dark">
      <div class="marketing-section-heading">
        <p class="marketing-kicker">Consultancy through physical delivery</p>
        <h2>One model across advisory, design, commercial, site, trade, asset and regulatory work.</h2>
      </div>
      <div class="marketing-card-grid three">
        <article class="marketing-card dark"><h3>Consultancy</h3><p>Appointments, professional services, surveys, reports, designs, cost advice, specifications and client acceptance.</p></article>
        <article class="marketing-card dark"><h3>Project & site delivery</h3><p>Packages, resources, site coordination, inspections, quality evidence, commercial control, progress and handover.</p></article>
        <article class="marketing-card dark"><h3>Asset operations</h3><p>Operational assets, planned/reactive maintenance, compliance, inspections, records and lifecycle evidence.</p></article>
      </div>
    </section>

    <section class="marketing-final-cta">
      <p class="marketing-kicker">CBE operating review</p>
      <h2>Map your company type, jobs and work products to NuBlox.</h2>
      <a class="marketing-button inverse" href="/contact">Start the conversation</a>
    </section>
  </main>
</MarketingShell>
