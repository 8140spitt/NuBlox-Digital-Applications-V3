<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const enabled = $derived(form?.disabled ? false : form?.enabled ? true : data.status.enabled);
</script>

<svelte:head>
  <title>Account security — NuBlox</title>
  <meta
    name="description"
    content="Manage tenant-scoped multi-factor authentication and recovery codes."
  />
</svelte:head>

<section class="workspace-hero">
  <div>
    <p class="app-eyebrow">Account security</p>
    <h1>Multi-factor authentication</h1>
    <p class="workspace-lede">
      Protect this Tenant with a time-based authenticator. MFA enrollment is tenant-scoped and
      does not change your Person, Position, Permission or Authority.
      Tenant policy: {data.policy.mfaRequirement === 'REQUIRED' ? 'MFA required' : 'MFA optional'}.
    </p>
  </div>
</section>

{#if form?.stepUpRequired && form?.stepUpUrl}
  <p class="form-message error">
    {form.error}
    <a href={form.stepUpUrl}>Verify MFA and return</a>
  </p>
{:else if form?.error}
  <p class="form-message error">{form.error}</p>
{/if}

{#if form?.recoveryCodes}
  <section class="home-section">
    <header class="home-section-heading">
      <div>
        <p class="app-eyebrow">Recovery codes</p>
        <h2>Save these codes now</h2>
      </div>
      <p>Each code can be used once. NuBlox will not show this set again.</p>
    </header>

    <div class="home-primary-grid">
      {#each form.recoveryCodes as recoveryCode}
        <article class="home-primary-card">
          <strong><code>{recoveryCode}</code></strong>
        </article>
      {/each}
    </div>
  </section>
{/if}

<section class="home-section">
  <header class="home-section-heading">
    <div>
      <p class="app-eyebrow">Status</p>
      <h2>{enabled ? 'MFA is enabled' : 'MFA is not enabled'}</h2>
    </div>
    <p>
      Current session: {data.authenticationStrength === 'MFA' ? 'MFA verified' : 'password verified'}.
    </p>
  </header>

  {#if !enabled}
    {#if form?.provisioningSecret && form?.otpauthUri}
      <div class="home-primary-grid">
        <article class="home-primary-card">
          <span>01</span>
          <div>
            <strong>Add NuBlox to your authenticator</strong>
            <p>Account secret:</p>
            <p><code>{form.provisioningSecret}</code></p>
            <p>
              If your authenticator supports provisioning links:
              <a href={form.otpauthUri}>Open authenticator</a>
            </p>
          </div>
        </article>

        <article class="home-primary-card">
          <span>02</span>
          <div>
            <strong>Verify the enrollment</strong>
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
              <button type="submit" class="login-submit">Enable MFA →</button>
            </form>
          </div>
        </article>
      </div>
    {:else}
      <form method="POST" action="?/start">
        <button type="submit" class="primary-action">Set up authenticator →</button>
      </form>
    {/if}
  {:else}
    <div class="home-primary-grid">
      <article class="home-primary-card">
        <span>RC</span>
        <div>
          <strong>Recovery codes</strong>
          <p>
            {form?.recoveryCodes
              ? form.recoveryCodes.length
              : data.status.recoveryCodesRemaining}
            recovery code(s) available.
          </p>
          <form method="POST" action="?/regenerate">
            <button type="submit" class="quiet-button">Generate a new set</button>
          </form>
        </div>
      </article>

      {#if data.policy.mfaRequirement !== 'REQUIRED'}
      <article class="home-primary-card">
        <span>OFF</span>
        <div>
          <strong>Disable MFA</strong>
          <p>Re-enter your password. Existing recovery codes will be destroyed.</p>
          <form method="POST" action="?/disable" class="login-form">
            <label>
              <span>Password</span>
              <input name="password" type="password" autocomplete="current-password" required />
            </label>
            <button type="submit" class="quiet-button">Disable MFA</button>
          </form>
        </div>
      </article>
      {/if}
    </div>
  {/if}
</section>
