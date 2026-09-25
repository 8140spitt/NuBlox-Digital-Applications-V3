<script lang="ts">
  import type { ActionData, PageData } from './$types';
  import { tenantPublicPath, tenantSignInPath } from '$lib/tenant-paths';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Multi-factor authentication — {data.tenantName}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="login-page">
  <section class="login-brand-panel">
    <a class="login-brand" href={tenantPublicPath(data.tenantSlug)}>NuBlox</a>
    <div>
      <p class="app-eyebrow">{data.tenantName}</p>
      <h1>Verify your<br />second factor.</h1>
      <p>
        Enter the current six-digit code from your authenticator app, or use one of your single-use
        recovery codes.
      </p>
    </div>
    <span class="login-version">Multi-factor authentication</span>
  </section>

  <section class="login-form-panel">
    <div class="login-form-wrap">
      <header>
        <p class="app-eyebrow">Secure sign in</p>
        <h2>Authentication code</h2>
        <p>TOTP codes are accepted only once for each time window.</p>
      </header>

      {#if form?.error}
        <p class="form-message error">{form.error}</p>
      {/if}

      {#if form?.expired}
        <p class="login-help">
          <a href={tenantSignInPath(data.tenantSlug)}>Start sign in again</a>
        </p>
      {:else}
        <form method="POST" class="login-form">
          <label>
            <span>Authenticator or recovery code</span>
            <input
              name="code"
              autocomplete="one-time-code"
              autocapitalize="characters"
              spellcheck="false"
              autofocus
              required
            />
          </label>

          <button type="submit" class="login-submit">
            Verify
            <span aria-hidden="true">→</span>
          </button>
        </form>
      {/if}
    </div>
  </section>
</main>
