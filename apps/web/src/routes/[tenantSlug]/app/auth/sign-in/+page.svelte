<script lang="ts">
  import type { ActionData, PageData } from './$types';
  import { browserSupportsPasskeys, getPasskey } from '$lib/passkeys';
  import { tenantPublicPath } from '$lib/tenant-paths';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let email = $state(form?.email ?? '');
  let passkeyBusy = $state(false);
  let passkeyMessage = $state('');

  async function signInWithPasskey() {
    if (!data.tenantSlug) return;
    if (!email.trim()) {
      passkeyMessage = 'Enter your employee email address first.';
      return;
    }
    if (!browserSupportsPasskeys()) {
      passkeyMessage = 'This browser does not support WebAuthn passkeys.';
      return;
    }

    passkeyBusy = true;
    passkeyMessage = '';

    try {
      const startResponse = await fetch(`/${data.tenantSlug}/app/auth/passkey/options`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email,
          returnTo: form?.returnTo ?? data.returnTo
        })
      });
      const start = await startResponse.json();
      if (!startResponse.ok) {
        throw new Error(start.error ?? 'Passkey sign-in could not start.');
      }

      const credential = await getPasskey(start.options);
      const verifyResponse = await fetch(`/${data.tenantSlug}/app/auth/passkey/verify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: start.token, credential })
      });
      const result = await verifyResponse.json();
      if (!verifyResponse.ok) {
        throw new Error(result.error ?? 'Passkey verification failed.');
      }

      window.location.href = result.redirectTo;
    } catch (error) {
      passkeyMessage = error instanceof Error ? error.message : 'Passkey sign-in failed.';
    } finally {
      passkeyBusy = false;
    }
  }
</script>

<svelte:head>
  <title>Sign in — NuBlox</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="login-page">
  <section class="login-brand-panel">
    <a class="login-brand" href={data.tenantSlug ? tenantPublicPath(data.tenantSlug) : '/'}>NuBlox</a>
    <div>
      <p class="app-eyebrow">{data.tenantName ?? 'Enterprise Operating Platform'}</p>
      <h1>Secure identity.<br />Tenant boundary.<br />Governed work.</h1>
      <p>
        {#if data.tenantName}
          You are signing in to the private {data.tenantName} NuBlox environment. Authentication proves
          identity; Permission, Responsibility, competence and Authority remain separately governed.
        {:else}
          Authenticate your NuBlox identity, then enter the tenant environment in which you are authorised to work.
        {/if}
      </p>
    </div>
    <span class="login-version">Digital Applications V3</span>
  </section>

  <section class="login-form-panel">
    <div class="login-form-wrap">
      <header>
        <p class="app-eyebrow">Secure access</p>
        <h2>{data.tenantName ? `Sign in to ${data.tenantName}` : 'Sign in to NuBlox'}</h2>
        <p>
          {data.tenantName
            ? 'Use the employee identity provisioned for this tenant.'
            : 'Use an account provisioned against an active tenant Person.'}
        </p>
      </header>

      {#if data.passwordReset}
        <p class="form-message info">Password updated. Sign in with your new password.</p>
      {/if}

      <form method="POST" class="login-form">
        <input
          type="hidden"
          name="returnTo"
          value={form?.returnTo ?? data.returnTo}
        />

        <label>
          <span>Email</span>
          <input
            name="email"
            type="email"
            autocomplete="username"
            bind:value={email}
            required
          />
        </label>

        <label>
          <span>Password</span>
          <input
            name="password"
            type="password"
            autocomplete="current-password"
            minlength="12"
            required
          />
        </label>

        {#if form?.tenantSelection && form.tenants}
          <label>
            <span>Tenant</span>
            <select name="tenantId" required>
              <option value="">Select tenant</option>
              {#each form.tenants as tenant}
                <option value={tenant.tenantId}>{tenant.tenantName}</option>
              {/each}
            </select>
          </label>
          <p class="form-message info">
            This login is linked to more than one tenant. Select the operating context to continue.
          </p>
        {/if}

        {#if form?.rateLimited}
          <p class="form-message error">
            Too many sign-in attempts. Try again in about {Math.max(1, Math.ceil((form.retryAfterSeconds ?? 60) / 60))} minute(s).
          </p>
        {:else if form?.verificationRequired}
          <p class="form-message info">
            Verify this email address before signing in.
            <a href={`/${form.verificationTenantSlug}/app/auth/check-email?email=${encodeURIComponent(form.email ?? '')}`}>
              Resend verification{form.verificationTenantName ? ` for ${form.verificationTenantName}` : ''}
            </a>
          </p>
        {:else if form?.invalid}
          <p class="form-message error">Email or password is not valid for an active account.</p>
        {:else if form?.missing}
          <p class="form-message error">Email and password are required.</p>
        {/if}

        <button type="submit" class="login-submit">
          Sign in
          <span aria-hidden="true">→</span>
        </button>

        {#if data.tenantSlug}
          <button
            type="button"
            class="quiet-button"
            onclick={signInWithPasskey}
            disabled={passkeyBusy}
          >
            {passkeyBusy ? 'Waiting for passkey…' : 'Sign in with passkey'}
          </button>
        {/if}
      </form>

      {#if passkeyMessage}
        <p class="form-message error">{passkeyMessage}</p>
      {/if}

      <p class="login-help">
        {#if data.tenantSlug}
          <a href={`/${data.tenantSlug}/app/auth/forgot-password`}>Forgot password?</a> ·

          Employee access is separate from public and candidate access.
          <a href={tenantPublicPath(data.tenantSlug, '/careers')}>View careers</a>
        {:else}
          Tenant employee accounts are provisioned through governed NuBlox identity and Human Capital administration.
        {/if}
      </p>
    </div>
  </section>
</main>
