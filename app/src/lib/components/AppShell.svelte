<script lang="ts">
  import FunctionSidebar from '$lib/components/FunctionSidebar.svelte';

  let { tenantSlug, children } = $props();

  const tenantName = tenantSlug
    .split('-')
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
</script>

<header class="topbar">
  <div class="brand" aria-label="NuBlox"><span class="brand-mark">N</span><span>NuBlox</span></div>
  <nav class="topnav" aria-label="Global">
    <a href={`/${tenantSlug}/app/functions/f01`}>Home</a>
    <a href={`/${tenantSlug}/app/functions/f01`}>My work</a>
    <a class="active" href={`/${tenantSlug}/app/functions/f01`}>Functions</a>
    <a href={`/${tenantSlug}/app/functions/f01`}>Reports</a>
    <a href={`/${tenantSlug}/app/functions/f01`}>Administration</a>
  </nav>
  <div class="profile">
    <span class="avatar">SS</span>
    <span class="profile-copy"><strong>Stephen Spittal</strong><small>{tenantName}</small></span>
  </div>
</header>

<div class="shell">
  <FunctionSidebar {tenantSlug} />
  <main class="main-content">{@render children()}</main>
</div>

<style>
  .topbar { height: 64px; display: grid; grid-template-columns: 220px minmax(0, 1fr) auto; align-items: center; gap: 22px; padding: 0 22px; color: white; background: linear-gradient(100deg, var(--navy-950), var(--navy-900)); box-shadow: 0 2px 8px rgba(5, 30, 48, .22); position: sticky; top: 0; z-index: 20; }
  .brand { display: flex; align-items: center; gap: 9px; font-size: 25px; font-weight: 760; letter-spacing: -.02em; }
  .brand-mark { display: grid; place-items: center; width: 30px; height: 34px; border: 2px solid rgba(255,255,255,.9); border-radius: 3px; font-weight: 850; background: linear-gradient(135deg, rgba(255,255,255,.2), transparent); }
  .topnav { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .topnav a { text-decoration: none; color: rgba(255,255,255,.85); padding: 10px 12px; border-radius: 7px; font-size: 14px; white-space: nowrap; }
  .topnav a:hover, .topnav a.active { color: white; background: rgba(255,255,255,.1); }
  .profile { display: flex; align-items: center; gap: 10px; padding-left: 20px; border-left: 1px solid rgba(255,255,255,.4); }
  .avatar { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; background: #edf6fc; color: var(--navy-900); font-size: 12px; font-weight: 800; }
  .profile-copy { display: grid; line-height: 1.2; }
  .profile-copy strong { font-size: 13px; font-weight: 680; }
  .profile-copy small { margin-top: 3px; color: rgba(255,255,255,.72); font-size: 11px; }
  .shell { display: grid; grid-template-columns: 238px minmax(0, 1fr); min-height: calc(100vh - 64px); }
  .main-content { min-width: 0; padding: 14px; }
  @media (max-width: 1050px) { .topbar { grid-template-columns: auto 1fr auto; } .topnav a:nth-child(n+4) { display: none; } .shell { grid-template-columns: 210px minmax(0,1fr); } }
  @media (max-width: 760px) { .topbar { height: auto; min-height: 58px; grid-template-columns: 1fr auto; padding: 10px 14px; } .brand { font-size: 21px; } .topnav { display: none; } .profile-copy { display: none; } .profile { padding-left: 0; border-left: 0; } .shell { display: block; } .main-content { padding: 10px; } }
</style>
