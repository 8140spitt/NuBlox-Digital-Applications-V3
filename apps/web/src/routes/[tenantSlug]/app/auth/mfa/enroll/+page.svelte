<script lang="ts">
  import type { ActionData, PageData } from './$types';
  import { tenantPublicPath } from '$lib/tenant-paths';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>MFA enrollment required — {data.tenantName}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="login-page">
  <section class="login-brand-panel">
    <a class="login-brand" href={tenantPublicPath(data.tenantSlug)}>NuBlox</a>
    <div>
      <p class="app-eyebrow">{data.tenantName}</p>
      <h1>Multi-factor<br />authentication required.</h1>
      <p>
        This Tenant requires MFA before an employee application session can be created.
      </p>
    </div>
    <span class="login-version">Tenant authentication policy</span>
  </section>

  <section class="login-form-panel">
    <div class="login-form-wrap">
      {#if form?.error}
        <p class="form-message error">{form.error}</p>
      {/if}

      {#if form?.recoveryCodes && form?.returnTo}
        <header>
          <p class="app-eyebrow">MFA enabled</p>
          <h2>Save your recovery codes</h2>
          <p>Each code works once. This set will not be shown again.</p>
        </header>

        <div class="home-primary-grid">
          {#each form.recoveryCodes as recoveryCode}
            <article class="home-primary-card">
              <strong><code>{recoveryCode}</code></strong>
            </article>
          {/each}
        </div>

        <a class="login-submit auth-link-button" href={form.returnTo}>
          Continue to NuBlox <span aria-hidden="true">→</span>
        </a>
      {:else if form?.provisioningSecret && form?.otpauthUri}
        <header>
          <p class="app-eyebrow">Step 1</p>
          <h2>Add NuBlox to your authenticator</h2>
          <p>Use the secret below or open the authenticator provisioning link.</p>
        </header>

        <p><code>{form.provisioningSecret}</code></p>
        <p><a href={form.otpauthUri}>Open authenticator provisioning link</a></p>

        <form method="POST" action="?/confirm" class="login-form">
          <label>
            <span>Six-digit authenticator code</span>
            <input
              name="code"
              inputmode="numeric"
              autocomplete="one-time-code"
              pattern="[0-9]{6}"
              maxlength="6"
              required
            />
          </label>
          <button type="submit" class="login-submit">
            Verify and enable MFA
            <span aria-hidden="true">→</span>
          </button>
        </form>
      {:else}
        <header>
          <p class="app-eyebrow">Security requirement</p>
          <h2>Set up an authenticator</h2>
          <p>
            Your password has been verified. Complete MFA enrollment to enter this Tenant.
          </p>
        </header>

        <form method="POST" action="?/start">
          <button type="submit" class="login-submit">
            Start MFA setup
            <span aria-hidden="true">→</span>
          </button>
        </form>
      {/if}
    </div>
  </section>
</main>
