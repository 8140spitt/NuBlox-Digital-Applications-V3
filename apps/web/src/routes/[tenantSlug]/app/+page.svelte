<svelte:head>
  <title>Home — NuBlox</title>
  <meta name="description" content="NuBlox operational home" />
</svelte:head>

<section class="workspace-hero home-hero">
  <div>
    <p class="app-eyebrow">Operational home</p>
    <h1>Your business. Your Function. Your work.</h1>
    <p class="workspace-lede">
      NuBlox resolves your occupied Position into the Function and work stream in which you operate,
      then composes the work, tools, business objects and decisions relevant to your role.
    </p>
  </div>

  <a class="primary-action" href="/app/function">
    Open My Function
    <span aria-hidden="true">→</span>
  </a>
</section>

<section class="home-primary-grid" aria-label="Primary work areas">
  <a class="home-primary-card" href="/app/function">
    <span>01</span>
    <div>
      <strong>My Function</strong>
      <p>Your Function Governance or Function Delivery working environment, determined by your Position.</p>
    </div>
    <span aria-hidden="true">→</span>
  </a>

  <a class="home-primary-card" href="/app/my-work">
    <span>02</span>
    <div>
      <strong>My Work</strong>
      <p>Assignments, reviews, approvals, acceptance actions, exceptions and other cross-Function attention.</p>
    </div>
    <span aria-hidden="true">→</span>
  </a>

  <a class="home-primary-card" href="/app/my-team">
    <span>03</span>
    <div>
      <strong>My Team</strong>
      <p>For managers, roll authorised work and performance through the Position reporting hierarchy.</p>
    </div>
    <span aria-hidden="true">→</span>
  </a>
</section>

<section class="home-section">
  <header class="home-section-heading">
    <div>
      <p class="app-eyebrow">Operational workspaces</p>
      <h2>Work with governed business objects</h2>
    </div>
    <p>These workspaces operate shared canonical objects rather than separate application silos.</p>
  </header>

  <div class="home-workspace-grid">
    <a href="/app/information">
      <span>IN</span>
      <div>
        <strong>Information</strong>
        <p>Authoritative information, revisions, iterations, Representations and controlled issue.</p>
      </div>
      <span aria-hidden="true">→</span>
    </a>
    <a href="/app/configuration">
      <span>CC</span>
      <div>
        <strong>Change &amp; configuration</strong>
        <p>Changes, affected objects, Configuration Items, Baselines and Effectivity.</p>
      </div>
      <span aria-hidden="true">→</span>
    </a>
    <a href="/app/deliverables">
      <span>DL</span>
      <div>
        <strong>Deliverables</strong>
        <p>Requirements, Items, reviews, approvals, Transmittals, responses and acceptance.</p>
      </div>
      <span aria-hidden="true">→</span>
    </a>
  </div>
</section>

<section class="home-section home-governance">
  <header class="home-section-heading">
    <div>
      <p class="app-eyebrow">Enterprise governance</p>
      <h2>Configure how the organisation operates</h2>
    </div>
  </header>

  <div class="home-governance-links">
    <a href="/app/hcm"><strong>HCM &amp; Position Management</strong><span>People, Job Profiles, Positions, occupancy, Function work streams and reporting hierarchy</span></a>
    <a href="/app/competence"><strong>Competence</strong><span>Required capability and evidence</span></a>
    <a href="/app/control"><strong>Control</strong><span>Lifecycle, Decision and evidence state</span></a>
    <a href="/app/access"><strong>Access</strong><span>Roles, permissions and access requests</span></a>
  </div>
</section>
