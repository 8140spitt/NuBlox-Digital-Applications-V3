<script lang="ts">
  import type { ActionData, PageData } from './$types';
  import { tenantPublicPath, tenantSignInPath } from '$lib/tenant-paths';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Verify your email — {data.tenantName}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="login-page">
  <section class="login-brand-panel">
    <a class="login-brand" href={tenantPublicPath(data.tenantSlug)}>NuBlox</a>
    <div>
      <p class="app-eyebrow">{data.tenantName}</p>
      <h1>Verify your<br />email address.</h1>
      <p>
        NuBlox does not activate employee application sign-in until the application identity's
        email address has been verified.
      </p>
    </div>
    <span class="login-version">Identity security</span>
  </section>

  <section class="login-form-panel">
    <div class="login-form-wrap">
      <header>
        <p class="app-eyebrow">Email verification</p>
        <h2>Check your inbox</h2>
        <p>Use the one-time verification link issued for this Tenant.</p>
      </header>

      <form method="POST" class="login-form">
        <label>
          <span>Email</span>
          <input
            name="email"
            type="email"
            autocomplete="email"
            value={form?.email ?? data.email}
            required
          />
        </label>

        {#if form?.message}
          <p class:info={form?.ok} class:error={!form?.ok} class="form-message">{form.message}</p>
        {/if}

        <button type="submit" class="login-submit">
          Resend verification
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <p class="login-help">
        <a href={tenantSignInPath(data.tenantSlug)}>Back to sign in</a>
      </p>
    </div>
  </section>
</main>
