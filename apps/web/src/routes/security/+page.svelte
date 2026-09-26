<script lang="ts">
  import MarketingShell from '$lib/components/MarketingShell.svelte';

  const controls = [
    ['Tenant isolation', 'Tenant context is explicit throughout the application model so business data and authority are resolved within the correct Tenant boundary.'],
    ['Identity & authentication', 'Email verification, password authentication, MFA, passkeys, session management and tenant authentication policy form the application identity control layer.'],
    ['Position-led access', 'A Person’s working context derives from occupied Position, Function assignment, reporting hierarchy, Access Roles, Permissions and explicit Authority rather than job title alone.'],
    ['Least-implicit authority', 'Responsibility, Assignment, Permission and Authority remain separate concepts. Being asked to perform work does not silently grant the right to approve it.'],
    ['Audit & business events', 'Material actions produce auditable evidence and business events so operational change can be traced rather than inferred after the fact.'],
    ['Information governance', 'Security classification, records retention, publication, validation and governed metadata support control over information throughout its lifecycle.']
  ];
</script>

<svelte:head>
  <title>Trust, security & governance — NuBlox</title>
  <meta name="description" content="Learn how NuBlox approaches tenant isolation, identity, access, authority, audit, information governance and controlled configuration." />
</svelte:head>

<MarketingShell>
  <main class="marketing-main">
    <section class="marketing-hero compact">
      <div class="marketing-hero-copy">
        <p class="marketing-kicker">Trust, security & governance</p>
        <h1>Enterprise control is part of the operating model.</h1>
        <p class="marketing-lede">NuBlox is designed so identity, access, authority, audit, information governance and configuration evidence are first-class parts of execution — not separate administrative overlays.</p>
      </div>
    </section>

    <section class="marketing-section">
      <div class="marketing-section-heading">
        <p class="marketing-kicker">Control model</p>
        <h2>Know who can do what, in which context, and why.</h2>
      </div>
      <div class="marketing-card-grid three">
        {#each controls as control}
          <article class="marketing-card"><h3>{control[0]}</h3><p>{control[1]}</p></article>
        {/each}
      </div>
    </section>

    <section class="marketing-section marketing-section-dark">
      <div class="marketing-section-heading">
        <p class="marketing-kicker">Separation of concerns</p>
        <h2>Organisational meaning does not automatically become system privilege.</h2>
      </div>
      <div class="marketing-equation-grid">
        <span>Job Profile ≠ Position</span>
        <span>Position ≠ Access Role</span>
        <span>Responsibility ≠ Permission</span>
        <span>Assignment ≠ Authority</span>
        <span>Employment ≠ Function assignment</span>
        <span>Record ownership ≠ management scope</span>
      </div>
    </section>

    <section class="marketing-split marketing-section">
      <div><p class="marketing-kicker">Governed change</p><h2>Configuration changes should leave evidence.</h2></div>
      <div><p>NuBlox treats material configuration as governed enterprise change. Tenant operating profiles, Function state changes, workflow, metadata and controlled configuration are designed to retain their source, rationale and audit evidence instead of becoming undocumented switches.</p></div>
    </section>

    <section class="marketing-section marketing-section-tint">
      <div class="marketing-section-heading">
        <p class="marketing-kicker">Security review</p>
        <h2>Evaluate NuBlox against your own control environment.</h2>
        <p>For procurement, security and architecture reviews, NuBlox can walk through the implemented identity, tenant, authority, audit and information-governance model in the context of your requirements.</p>
      </div>
      <a class="marketing-button" href="/contact">Request a trust review</a>
    </section>
  </main>
</MarketingShell>
