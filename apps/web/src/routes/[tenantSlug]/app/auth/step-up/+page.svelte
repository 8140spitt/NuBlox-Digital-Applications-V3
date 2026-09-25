<script lang="ts">
  import type { ActionData, PageData } from './$types';
  import { browserSupportsPasskeys, getPasskey } from '$lib/passkeys';
  import { tenantAppPath } from '$lib/tenant-paths';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let passkeyBusy = $state(false);
  let passkeyMessage = $state('');

  async function verifyWithPasskey() {
    if (!browserSupportsPasskeys()) {
      passkeyMessage = 'This browser does not support WebAuthn passkeys.';
      return;
    }

    passkeyBusy = true;
    passkeyMessage = '';

    try {
      const optionsResponse = await fetch('./step-up/passkey/options', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ returnTo: data.returnTo })
      });
      const start = await optionsResponse.json();
      if (!optionsResponse.ok) {
        throw new Error(start.error ?? 'Passkey verification could not start.');
      }

      const credential = await getPasskey(start.options);
      const verifyResponse = await fetch('./step-up/passkey/verify', {
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
      passkeyMessage = error instanceof Error ? error.message : 'Passkey verification failed.';
    } finally {
      passkeyBusy = false;
    }
  }
</script>

<svelte:head>
  <title>Confirm security action — {data.tenantName}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="login-page">
  <section class="login-brand-panel">
    <a class="login-brand" href={tenantAppPath(data.tenantSlug)}>NuBlox</a>
    <div>
      <p class="app-eyebrow">{data.tenantName}</p>
      <h1>Confirm this<br />security action.</h1>
      <p>
        Sensitive identity and authentication changes require a fresh MFA verification even when
        the application session is already signed in.
      </p>
    </div>
    <span class="login-version">Step-up authentication</span>
  </section>

  <section class="login-form-panel">
    <div class="login-form-wrap">
      {#if form?.error}
        <p class="form-message error">{form.error}</p>
      {/if}

      {#if (!data.enrolled && data.passkeyCount === 0) || form?.enrollmentRequired}
        <header>
          <p class="app-eyebrow">MFA required</p>
          <h2>Enroll an authenticator first</h2>
          <p>
            This account does not currently have tenant-scoped MFA available for step-up authentication.
          </p>
        </header>
        <a
          class="login-submit auth-link-button"
          href={tenantAppPath(data.tenantSlug, '/app/security/mfa')}
        >
          Set up MFA <span aria-hidden="true">→</span>
        </a>
      {:else}
        <header>
          <p class="app-eyebrow">Fresh verification</p>
          <h2>Verify your identity again</h2>
          <p>Use a registered passkey or your authenticator/recovery code.</p>
        </header>

        {#if data.passkeyCount > 0}
          <button
            type="button"
            class="login-submit"
            onclick={verifyWithPasskey}
            disabled={passkeyBusy}
          >
            {passkeyBusy ? 'Waiting for passkey…' : 'Verify with passkey'}
            <span aria-hidden="true">→</span>
          </button>
        {/if}

        {#if passkeyMessage}
          <p class="form-message error">{passkeyMessage}</p>
        {/if}

        {#if data.enrolled}
          <form method="POST" class="login-form">
            <label>
              <span>Authenticator or recovery code</span>
              <input
                name="code"
                autocomplete="one-time-code"
                autocapitalize="characters"
                spellcheck="false"
                autofocus={data.passkeyCount === 0}
                required
              />
            </label>
            <button type="submit" class="quiet-button">
              Verify authenticator code
            </button>
          </form>
        {/if}
      {/if}
    </div>
  </section>
</main>
