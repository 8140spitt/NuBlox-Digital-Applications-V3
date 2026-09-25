<script lang="ts">
  import type { PageData } from './$types';
  import { tenantPublicPath, tenantSignInPath } from '$lib/tenant-paths';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Email verification — {data.tenantName}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="login-page">
  <section class="login-brand-panel">
    <a class="login-brand" href={data.tenantSlug ? tenantPublicPath(data.tenantSlug) : '/'}>NuBlox</a>
    <div>
      <p class="app-eyebrow">{data.tenantName}</p>
      <h1>{data.verified ? 'Identity verified.' : 'Verification link invalid.'}</h1>
      <p>
        {data.verified
          ? 'Your application identity can now be used to authenticate into this Tenant.'
          : 'Verification links are single-use and expire automatically.'}
      </p>
    </div>
    <span class="login-version">Identity security</span>
  </section>

  <section class="login-form-panel">
    <div class="login-form-wrap">
      {#if data.verified}
        <header>
          <p class="app-eyebrow">Verified</p>
          <h2>{data.alreadyVerified ? 'Email already verified' : 'Email verified successfully'}</h2>
        </header>
        <a class="login-submit auth-link-button" href={tenantSignInPath(data.tenantSlug)}>
          Continue to sign in <span aria-hidden="true">→</span>
        </a>
      {:else}
        <header>
          <p class="app-eyebrow">Not verified</p>
          <h2>{data.error}</h2>
        </header>
        {#if data.tenantSlug}
          <a class="login-submit auth-link-button" href={`/${data.tenantSlug}/app/auth/check-email`}>
            Request another link <span aria-hidden="true">→</span>
          </a>
        {/if}
      {/if}
    </div>
  </section>
</main>
