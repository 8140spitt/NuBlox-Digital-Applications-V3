<script lang="ts">
  let { operator }: { operator: { displayName:string; role:string } } = $props();
  const links=[
    ['/platform','Overview'],
    ['/platform/tenants','Tenants'],
    ['/platform/users','Users'],
    ['/platform/templates','Templates'],
    ['/platform/industries','Industries'],
    ['/platform/metadata','Metadata'],
    ['/platform/feature-flags','Feature flags'],
    ['/platform/provisioning','Provisioning'],
    ['/platform/migrations','Migrations'],
    ['/platform/integrations','Integrations'],
    ['/platform/jobs','Jobs'],
    ['/platform/security','Security'],
    ['/platform/audit','Audit'],
    ['/platform/metrics','Metrics'],
    ['/platform/platform-configuration','Platform configuration']
  ];
</script>

<aside class="platform-nav">
  <div class="brand">
    <strong>NuBlox</strong>
    <span>Operator Control Plane</span>
  </div>
  <nav aria-label="Platform administration">
    {#each links as link}
      <a href={link[0]}>{link[1]}</a>
    {/each}
  </nav>
  <div class="operator">
    <strong>{operator.displayName}</strong>
    <span>{operator.role.replaceAll('_',' ')}</span>
    <form method="POST" action="/platform?/logout"><button type="submit">Sign out</button></form>
  </div>
</aside>

<style>
  .platform-nav{position:sticky;top:0;align-self:start;height:100vh;overflow:auto;padding:1.25rem;background:#111827;color:#fff;display:grid;grid-template-rows:auto 1fr auto;gap:1.5rem}.brand{display:grid;gap:.2rem}.brand strong{font-size:1.25rem}.brand span,.operator span{font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:#aab3c2}nav{display:grid;gap:.25rem}nav a{color:#e5e7eb;text-decoration:none;padding:.55rem .65rem;border-radius:.35rem}nav a:hover,nav a:focus{background:#1f2937;color:#fff}.operator{display:grid;gap:.35rem;border-top:1px solid #374151;padding-top:1rem}.operator button{background:transparent;color:#fff;border:1px solid #4b5563;border-radius:.35rem;padding:.45rem .65rem;cursor:pointer;text-align:left;width:100%}@media(max-width:900px){.platform-nav{position:static;height:auto;grid-template-rows:auto auto auto}.platform-nav nav{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>
