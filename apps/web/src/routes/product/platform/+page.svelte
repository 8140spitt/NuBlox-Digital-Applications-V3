<script lang="ts">
  import MarketingShell from '$lib/components/MarketingShell.svelte';

  const layers = [
    ['01', 'Enterprise identity & parties', 'Tenant, Employee, Client and Vendor/Supplier Party Types sit on a shared identity and organisation model.'],
    ['02', 'Organisation & HCM authority', 'Organisation Units, Job Architecture, Positions, reporting hierarchy, work relationships, occupancy, roles, permissions and delegated authority form the workforce spine.'],
    ['03', 'Universal Functions', 'Core Business Functions F01–F29 and industry Functions such as CBE D01–D16 use one Function model rather than separate application families.'],
    ['04', 'Metadata runtime', 'Things, fields, values, relationships, constraints, lifecycle and configuration are governed as metadata so business objects can evolve coherently.'],
    ['05', 'Work-delivery runtime', 'Requirements, responsibilities, workflow, review, approval, issue, acceptance, change and closure connect to the actual deliverables and records created by work.'],
    ['06', 'Evidence & control', 'Audit, business events, outbox, validation, records retention, security classification and configuration evidence make control part of normal execution.']
  ];
</script>

<svelte:head>
  <title>Platform architecture — NuBlox</title>
  <meta name="description" content="Understand the NuBlox platform architecture: one enterprise object graph, universal Functions, metadata-driven business objects, work delivery, authority and evidence." />
</svelte:head>

<MarketingShell>
  <main class="marketing-main">
    <section class="marketing-hero compact">
      <div class="marketing-hero-copy">
        <p class="marketing-kicker">Platform architecture</p>
        <h1>A single governed spine for enterprise structure, work and evidence.</h1>
        <p class="marketing-lede">NuBlox is designed so identity, organisation, Functions, information, workflow and deliverables do not become separate sources of truth. They remain connected through one authoritative enterprise model.</p>
      </div>
    </section>

    <section class="marketing-section">
      <div class="marketing-section-heading">
        <p class="marketing-kicker">Architecture</p>
        <h2>Six connected layers. One application model.</h2>
      </div>
      <div class="marketing-architecture-stack">
        {#each layers as layer}
          <article>
            <span>{layer[0]}</span>
            <div><h3>{layer[1]}</h3><p>{layer[2]}</p></div>
          </article>
        {/each}
      </div>
    </section>

    <section class="marketing-split marketing-section marketing-section-tint">
      <div>
        <p class="marketing-kicker">Configuration without fragmentation</p>
        <h2>Tenant-specific, without breaking the canonical product.</h2>
      </div>
      <div>
        <p>NuBlox retains the canonical enterprise model and resolves which capabilities are enabled, available or not currently applicable for a Tenant. Configuration is versioned and evidenced instead of creating bespoke forks of the product.</p>
        <p>That same principle underpins the CBE operating-profile resolver: the Tenant’s archetype, contractual position, operative workforce and size inform the recommended Function set while preserving the full canonical model.</p>
      </div>
    </section>

    <section class="marketing-section marketing-section-dark">
      <div class="marketing-section-heading">
        <p class="marketing-kicker">Design principles</p>
        <h2>Authority, responsibility and information remain explicit.</h2>
      </div>
      <div class="marketing-card-grid three">
        <article class="marketing-card dark"><h3>Role is not permission</h3><p>Job Profile, Position, Project Role, Access Role, Permission and Authority are separate concepts so organisational meaning does not silently become system access.</p></article>
        <article class="marketing-card dark"><h3>Assignment is not authority</h3><p>Being assigned to work does not automatically grant decision rights. Responsibility, approval and delegated authority remain independently governed.</p></article>
        <article class="marketing-card dark"><h3>Records are not files alone</h3><p>Work products retain their business context, lifecycle, versions, approvals, relationships and evidence rather than existing as detached documents.</p></article>
      </div>
    </section>

    <section class="marketing-final-cta">
      <p class="marketing-kicker">Platform evaluation</p>
      <h2>Review the NuBlox architecture against your enterprise landscape.</h2>
      <a class="marketing-button inverse" href="/contact">Talk to NuBlox</a>
    </section>
  </main>
</MarketingShell>
