<script lang="ts">
  import type { ActionData, PageData } from './$types';
  import { tenantAppPath } from '$lib/tenant-paths';

  let { data, form }: { data: PageData; form: ActionData } = $props();
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

      {#if !data.enrolled || form?.enrollmentRequired}
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
          <h2>Enter your authenticator code</h2>
          <p>You may also use a single-use recovery code.</p>
        </header>

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
            Confirm and continue <span aria-hidden="true">→</span>
          </button>
        </form>
      {/if}
    </div>
  </section>
</main>
