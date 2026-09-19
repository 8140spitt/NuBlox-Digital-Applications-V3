<script lang="ts">
  let { data } = $props();

  const areas = $derived([
    {
      title: 'Parties',
      detail: 'People, organisations, legal entities and canonical business identities.',
      href: '/' + data.tenantSlug + '/app/admin/master-data/parties'
    },
    {
      title: 'Organisation structure',
      detail: 'Units, hierarchy and effective organisational relationships.',
      href: '/' + data.tenantSlug + '/app/admin/master-data/organisation-structure'
    },
    {
      title: 'Products & Items',
      detail: 'Product, service, innovation and configuration work enters through F05 today.',
      href: '/' + data.tenantSlug + '/app/functions/f05'
    },
    {
      title: 'Reference data',
      detail: 'Classifications, lifecycles, calendars and governed reference configuration.',
      href: '/' + data.tenantSlug + '/app/admin/reference-data'
    }
  ]);
</script>

<svelte:head><title>Enterprise Data · NuBlox</title></svelte:head>

<div class="data-page">
  <header>
    <span class="eyebrow">Enterprise Data</span>
    <h1>Define the shared data the enterprise operates on</h1>
    <p>
      Enterprise Data is business work, not technical administration. These masters and governed
      reference structures are reused across Operate and Deliver without creating function-local
      copies.
    </p>
  </header>

  <section class="section-card">
    <div class="section-heading">
      <span class="eyebrow">Available data domains</span>
      <h2>Shared enterprise data</h2>
    </div>
    <div class="rows">
      {#each areas as area}
        <a href={area.href}>
          <span><strong>{area.title}</strong><small>{area.detail}</small></span>
          <span aria-hidden="true">→</span>
        </a>
      {/each}
    </div>
  </section>
</div>

<style>
  .data-page {
    display: grid;
    gap: 14px;
    max-width: 1000px;
  }
  header {
    padding: 4px 2px;
  }
  .eyebrow {
    color: var(--blue-700);
    font-size: 9px;
    font-weight: 850;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }
  h1 {
    margin: 4px 0 7px;
    color: #29495e;
    font-size: 25px;
  }
  h2 {
    margin: 2px 0 10px;
    color: #29495e;
    font-size: 16px;
  }
  header p {
    max-width: 820px;
    margin: 0;
    color: #5c7282;
    font-size: 11px;
    line-height: 1.5;
  }
  section {
    padding: 14px;
  }
  .section-heading {
    margin-bottom: 8px;
  }
  .rows {
    display: grid;
    gap: 5px;
  }
  .rows a {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 10px;
    border: 1px solid #e0e7eb;
    border-radius: 7px;
    color: #405d70;
    text-decoration: none;
  }
  .rows a:hover {
    border-color: #b9d4e3;
    background: #f7fbfd;
  }
  .rows strong,
  .rows small {
    display: block;
  }
  .rows strong {
    font-size: 10.5px;
  }
  .rows small {
    margin-top: 3px;
    color: #738794;
    font-size: 9px;
    line-height: 1.4;
  }
</style>
