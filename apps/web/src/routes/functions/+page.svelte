<script lang="ts">
  import MarketingShell from '$lib/components/MarketingShell.svelte';
  import { coreFunctions, cbeFunctions } from '$lib/marketing/site';
</script>

<svelte:head>
  <title>Functions — NuBlox</title>
  <meta name="description" content="Explore the complete NuBlox Function model: 29 Core Business Functions plus 16 Construction & Built Environment Functions in one universal enterprise model." />
</svelte:head>

<MarketingShell>
  <main class="marketing-main">
    <section class="marketing-hero compact">
      <div class="marketing-hero-copy">
        <p class="marketing-kicker">Universal Function model</p>
        <h1>Every area of the enterprise belongs in the same operating model.</h1>
        <p class="marketing-lede">NuBlox treats a Function as a universal enterprise concept. The 29 Core Business Functions and specialist industry Functions use the same principles for governance, delivery, people, work, information and evidence.</p>
      </div>
    </section>

    <section class="marketing-section">
      <div class="marketing-section-heading">
        <p class="marketing-kicker">F01–F29</p>
        <h2>29 Core Business Functions.</h2>
        <p>The canonical NuBlox enterprise taxonomy spans strategy through continuous improvement. Each Function can contain governed sub-functions, activities, native tools, shared processes and work products.</p>
      </div>
      <div class="marketing-function-grid">
        {#each coreFunctions as fn}
          <article>
            <span>{fn[0]}</span>
            <h3>{fn[1]}</h3>
          </article>
        {/each}
      </div>
    </section>

    <section class="marketing-section marketing-section-dark">
      <div class="marketing-section-heading">
        <p class="marketing-kicker">D01–D16</p>
        <h2>16 Construction & Built Environment Functions.</h2>
        <p>Industry work does not sit outside the ERP. These Functions extend the same universal model into specialist delivery and regulated work.</p>
      </div>
      <div class="marketing-function-grid cbe">
        {#each cbeFunctions as fn}
          <article>
            <span>{fn[0]}</span>
            <h3>{fn[1]}</h3>
            <p>{fn[2]}</p>
          </article>
        {/each}
      </div>
      <a class="marketing-link-arrow light" href="/construction-built-environment">Explore the CBE operating model <span>→</span></a>
    </section>

    <section class="marketing-split marketing-section">
      <div>
        <p class="marketing-kicker">Not a module catalogue</p>
        <h2>Functions define the enterprise. They do not become isolated software silos.</h2>
      </div>
      <div>
        <p>NuBlox uses the Function model to organise working context, governance, delivery capabilities and tool composition while keeping cross-functional processes connected. Sales can collaborate with Finance, HCM, Legal, Delivery and Projects without reproducing the business in separate application databases.</p>
        <a class="marketing-link-arrow" href="/product/platform">See the platform architecture <span>→</span></a>
      </div>
    </section>
  </main>
</MarketingShell>
