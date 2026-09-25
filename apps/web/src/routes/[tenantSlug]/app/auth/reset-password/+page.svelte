<script lang="ts">
  import type { ActionData, PageData } from './$types';
  import { tenantPublicPath, tenantSignInPath } from '$lib/tenant-paths';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Choose a new password — {data.tenantName}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="login-page">
  <section class="login-brand-panel">
    <a class="login-brand" href={tenantPublicPath(data.tenantSlug)}>NuBlox</a>
    <div>
      <p class="app-eyebrow">{data.tenantName}</p>
      <h1>Choose a new<br />password.</h1>
      <p>A successful reset revokes all existing application sessions for this identity.</p>
    </div>
    <span class="login-version">Identity security</span>
  </section>

  <section class="login-form-panel">
    <div class="login-form-wrap">
      <header>
        <p class="app-eyebrow">Account recovery</p>
        <h2>New password</h2>
      </header>

      <form method="POST" class="login-form">
        <input type="hidden" name="token" value={form?.token ?? data.token} />
        <label>
          <span>New password</span>
          <input name="password" type="password" autocomplete="new-password" minlength="12" required />
        </label>
        <label>
          <span>Confirm new password</span>
          <input name="confirmPassword" type="password" autocomplete="new-password" minlength="12" required />
        </label>

        {#if form?.error}
          <p class="form-message error">{form.error}</p>
        {/if}

        <button type="submit" class="login-submit">
          Reset password
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <p class="login-help"><a href={tenantSignInPath(data.tenantSlug)}>Back to sign in</a></p>
    </div>
  </section>
</main>
