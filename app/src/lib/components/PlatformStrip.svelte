<script lang="ts">
  let { services, integration } = $props();
</script>

<section class="platform section-card" aria-labelledby="platform-title">
  <h2 id="platform-title">Platform services <span>Underpinning all F01 work</span></h2>
  <div class="service-grid">
    {#each services as service}<article><strong>{service[0]}</strong><p>{service[1]}</p></article>{/each}
  </div>
</section>

<section class="integration section-card" aria-labelledby="integration-title">
  <h2 id="integration-title">Integration & data <span>Foundation contract</span></h2>
  <div class="integration-grid">
    {#each integration as item}<article><strong>{item[0]}</strong><p>{item[1]}</p></article>{/each}
  </div>
</section>

<style>
  section { padding: 12px; }
  .platform { border-color: var(--service-line); background: var(--service-bg); }
  .integration { border-color: var(--data-line); background: var(--data-bg); }
  h2 { margin: 0 0 9px; font-size: 14px; }
  .platform h2 { color: #235b2d; } .integration h2 { color: #563c8f; }
  h2 span { margin-left: 4px; font-size: 10.5px; font-weight: 500; opacity: .8; }
  .service-grid { display: grid; grid-template-columns: repeat(6, minmax(0,1fr)); gap: 7px; }
  .integration-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 8px; }
  article { padding: 9px 10px; border: 1px solid rgba(70,95,110,.18); border-radius: 8px; background: rgba(255,255,255,.8); }
  strong { color: #334b5e; font-size: 10.5px; }
  p { margin: 4px 0 0; color: #607180; font-size: 9.5px; line-height: 1.35; }
  @media (max-width: 1150px) { .service-grid { grid-template-columns: repeat(3,1fr); } .integration-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 620px) { .service-grid, .integration-grid { grid-template-columns: 1fr; } }
</style>
