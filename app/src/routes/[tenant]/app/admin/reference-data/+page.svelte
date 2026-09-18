<script lang="ts">
  let { data } = $props();
</script>

<svelte:head><title>Reference Data · NuBlox</title></svelte:head>

<div class="reference-page">
  <header class="hero section-card">
    <div>
      <span class="eyebrow">Platform governance · BOF-29</span>
      <h1>Reference & configuration data</h1>
      <p>
        Govern shared meaning once and reuse it across all 29 workspaces without creating duplicate
        business masters.
      </p>
    </div>
    <div class="principles">
      <strong>Reference defines meaning—not transaction truth.</strong>
      <span>Versioned · effective-dated · release-pinned · auditable</span>
    </div>
  </header>

  <section class="cards">
    {#if data.capabilities.canReadClassifications}
      <a
        class="section-card card"
        href={`/${data.tenantSlug}/app/admin/reference-data/classifications`}
      >
        <span class="icon">⌁</span>
        <div>
          <span class="eyebrow">AGG-29-CLASSIFICATION</span>
          <h2>Classification systems</h2>
          <p>
            Govern Uniclass and other taxonomies through immutable published releases and
            hierarchical codes.
          </p>
        </div>
        <strong>{data.counts.classifications}</strong>
      </a>
    {/if}

    {#if data.capabilities.canReadLifecycles}
      <a class="section-card card" href={`/${data.tenantSlug}/app/admin/reference-data/lifecycles`}>
        <span class="icon">↻</span>
        <div>
          <span class="eyebrow">AGG-29-LIFECYCLE-CONFIG</span>
          <h2>Lifecycle definitions</h2>
          <p>
            Define permitted domain states and transitions while runtime state remains on the owning
            aggregate.
          </p>
        </div>
        <strong>{data.counts.lifecycles}</strong>
      </a>
    {/if}
  </section>
</div>

<style>
  .reference-page {
    display: grid;
    gap: 12px;
  }
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 24px;
    align-items: center;
    padding: 18px;
    border-color: #8fc9ee;
    background: linear-gradient(120deg, #fbfdff, #eaf6fd);
  }
  .eyebrow {
    color: var(--blue-700);
    font-size: 10px;
    font-weight: 850;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }
  h1 {
    margin: 3px 0 6px;
    font-size: 25px;
  }
  h2 {
    margin: 3px 0 5px;
    font-size: 16px;
  }
  p {
    margin: 0;
    color: #5e7383;
    font-size: 11px;
    line-height: 1.45;
  }
  .principles {
    display: grid;
    gap: 5px;
    max-width: 340px;
    padding: 12px;
    border: 1px solid #bddded;
    border-radius: 9px;
    background: white;
  }
  .principles strong {
    color: #315c75;
    font-size: 10.5px;
  }
  .principles span {
    color: #78909f;
    font-size: 9px;
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .card {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 16px;
    color: inherit;
    text-decoration: none;
  }
  .card:hover {
    border-color: #7bbce0;
    transform: translateY(-1px);
  }
  .card > strong {
    min-width: 44px;
    color: #315c75;
    font-size: 23px;
    text-align: right;
  }
  .icon {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 9px;
    background: #eaf6fd;
    color: #235a7b;
    font-size: 19px;
  }
  @media (max-width: 760px) {
    .hero,
    .cards {
      grid-template-columns: 1fr;
    }
    .principles {
      max-width: none;
    }
  }
</style>
