<script lang="ts">
  import type { PageData } from './$types';
  import { tenantAppPath } from '$lib/tenant-paths';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Account security — NuBlox</title>
  <meta name="description" content="Manage your NuBlox authentication and active sessions." />
</svelte:head>

<section class="workspace-hero">
  <div>
    <p class="app-eyebrow">Account security</p>
    <h1>Protect your NuBlox access</h1>
    <p class="workspace-lede">
      Authentication proves who is accessing this Tenant. These controls do not grant business
      Permission, Responsibility or Authority.
    </p>
  </div>
</section>

<section class="home-primary-grid">
  <a class="home-primary-card" href={tenantAppPath(data.tenantSlug, '/app/security/mfa')}>
    <span>MFA</span>
    <div>
      <strong>Multi-factor authentication</strong>
      <p>Enroll an authenticator, manage recovery codes and strengthen sign-in.</p>
    </div>
    <span aria-hidden="true">→</span>
  </a>

  <a class="home-primary-card" href={tenantAppPath(data.tenantSlug, '/app/security/sessions')}>
    <span>SS</span>
    <div>
      <strong>Active sessions</strong>
      <p>Review recent application sessions and revoke access you no longer recognise or need.</p>
    </div>
    <span aria-hidden="true">→</span>
  </a>

  <a class="home-primary-card" href={tenantAppPath(data.tenantSlug, '/app/security/policy')}>
    <span>PL</span>
    <div>
      <strong>Tenant authentication policy</strong>
      <p>Govern MFA requirement, session lifetime, idle timeout and concurrent-session limits.</p>
    </div>
    <span aria-hidden="true">→</span>
  </a>
</section>
