<svelte:head>
  <title>My Work — NuBlox</title>
</svelte:head>

<section class="workspace-hero compact">
  <div>
    <p class="app-eyebrow">Work-delivery runtime</p>
    <h1>My Work</h1>
    <p class="workspace-lede">
      One projection of assignments, reviews, approvals, decisions, exceptions and governed work
      across every Function and operating context.
    </p>
  </div>
</section>

<section class="work-lanes" aria-label="My Work categories">
  <article>
    <span class="lane-marker">01</span>
    <h2>Assigned work</h2>
    <p>Work Items and Deliverable Items where you are the responsible performer.</p>
  </article>
  <article>
    <span class="lane-marker">02</span>
    <h2>Reviews</h2>
    <p>Exact subject versions requiring review, checking, comment or response.</p>
  </article>
  <article>
    <span class="lane-marker">03</span>
    <h2>Decisions</h2>
    <p>Approvals and other decisions requiring delegated Authority.</p>
  </article>
  <article>
    <span class="lane-marker">04</span>
    <h2>Exceptions</h2>
    <p>Blocked, overdue, rejected or competence/authority-gated work requiring action.</p>
  </article>
</section>

<section class="empty-work-state">
  <div class="empty-state-mark">MW</div>
  <div>
    <p class="app-eyebrow">Runtime connection</p>
    <h2>The shared My Work UI is active.</h2>
    <p>
      Live tenant assignments are not fabricated in this shell. The next integration step connects
      this experience to the existing Work Item, Assignment, Deliverable and Decision repositories.
    </p>
  </div>
</section>
