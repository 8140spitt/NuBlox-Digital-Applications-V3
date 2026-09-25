<script lang="ts">
  import type { ActionData, PageData } from './$types';
  import { tenantPublicPath, tenantSignInPath } from '$lib/tenant-paths';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Reset password — {data.tenantName}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="login-page">
  <section class="login-brand-panel">
    <a class="login-brand" href={tenantPublicPath(data.tenantSlug)}>NuBlox</a>
    <div>
      <p class="app-eyebrow">{data.tenantName}</p>
      <h1>Recover your<br />secure access.</h1>
      <p>Password-reset requests do not reveal whether an account exists for the supplied address.</p>
    </div>
    <span class="login-version">Identity security</span>
  </section>

  <section class="login-form-panel">
    <div class="login-form-wrap">
      <header>
        <p class="app-eyebrow">Account recovery</p>
        <h2>Reset password</h2>
        <p>Enter the email address used for this Tenant.</p>
      </header>

      <form method="POST" class="login-form">
        <label>
          <span>Email</span>
          <input name="email" type="email" autocomplete="email" value={form?.email ?? ''} required />
        </label>

        {#if form?.message}
          <p class:info={form?.ok} class:error={!form?.ok} class="form-message">{form.message}</p>
        {/if}

        <button type="submit" class="login-submit">
          Send reset instructions
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <p class="login-help"><a href={tenantSignInPath(data.tenantSlug)}>Back to sign in</a></p>
    </div>
  </section>
</main>
