<script lang="ts">
  import type { ActionData, PageData } from './$types';
  import {
    browserSupportsPasskeys,
    createPasskey
  } from '$lib/passkeys';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let busy = $state(false);
  let clientMessage = $state('');
  let displayName = $state('');

  function formatDate(value: string | null) {
    if (!value) return 'Never';
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  function credentialHint(value: string) {
    return value.length > 12 ? `…${value.slice(-12)}` : value;
  }

  async function registerPasskey() {
    if (!browserSupportsPasskeys()) {
      clientMessage = 'This browser does not support WebAuthn passkeys.';
      return;
    }

    busy = true;
    clientMessage = '';

    try {
      const optionsResponse = await fetch('./passkeys/register/options', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}'
      });
      const start = await optionsResponse.json();

      if (optionsResponse.status === 428 && start.stepUpUrl) {
        window.location.href = start.stepUpUrl;
        return;
      }
      if (!optionsResponse.ok) {
        throw new Error(start.error ?? 'Passkey registration could not start.');
      }

      const credential = await createPasskey(start.options);
      const verifyResponse = await fetch('./passkeys/register/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: start.token,
          displayName: displayName.trim() || 'Passkey',
          credential
        })
      });
      const result = await verifyResponse.json();

      if (verifyResponse.status === 428 && result.stepUpUrl) {
        window.location.href = result.stepUpUrl;
        return;
      }
      if (!verifyResponse.ok) {
        throw new Error(result.error ?? 'Passkey registration failed.');
      }

      window.location.reload();
    } catch (error) {
      clientMessage = error instanceof Error ? error.message : 'Passkey registration failed.';
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head>
  <title>Passkeys — NuBlox</title>
  <meta name="description" content="Register and manage phishing-resistant passkeys." />
</svelte:head>

<section class="workspace-hero">
  <div>
    <p class="app-eyebrow">Account security</p>
    <h1>Passkeys</h1>
    <p class="workspace-lede">
      Passkeys use WebAuthn public-key cryptography and local user verification. The private key
      remains with your authenticator; NuBlox stores only the credential identifier and public key.
    </p>
  </div>
</section>

{#if form?.stepUpRequired && form?.stepUpUrl}
  <p class="form-message error">
    {form.error}
    <a href={form.stepUpUrl}>Verify again and return</a>
  </p>
{:else if form?.error}
  <p class="form-message error">{form.error}</p>
{:else if form?.revoked}
  <p class="form-message info">Passkey revoked.</p>
{/if}

{#if clientMessage}
  <p class="form-message error">{clientMessage}</p>
{/if}

<section class="home-section">
  <header class="home-section-heading">
    <div>
      <p class="app-eyebrow">Register</p>
      <h2>Add a passkey</h2>
    </div>
  </header>

  <div class="login-form">
    <label>
      <span>Passkey name</span>
      <input
        bind:value={displayName}
        maxlength="120"
        placeholder="e.g. Stephen's MacBook"
        autocomplete="off"
      />
    </label>

    <button type="button" class="primary-action" onclick={registerPasskey} disabled={busy}>
      {busy ? 'Waiting for authenticator…' : 'Register passkey'}
    </button>
  </div>

  <p class="workspace-lede">
    Adding or removing a passkey requires recent strong authentication. User verification is
    required for every NuBlox passkey ceremony.
  </p>
</section>

<section class="home-section">
  <header class="home-section-heading">
    <div>
      <p class="app-eyebrow">Registered credentials</p>
      <h2>Your passkeys</h2>
    </div>
  </header>

  {#if data.passkeys.length === 0}
    <p>No passkeys are registered for your identity in this Tenant.</p>
  {:else}
    <div class="home-primary-grid">
      {#each data.passkeys as passkey}
        <article class="home-primary-card">
          <span>PK</span>
          <div>
            <strong>{passkey.displayName}</strong>
            <p>
              Credential {credentialHint(passkey.credentialId)} · Created {formatDate(passkey.createdAt)}
            </p>
            <p>
              Last used {formatDate(passkey.lastUsedAt)}
              {passkey.backedUp ? ' · Synced/backed up' : ''}
            </p>

            <form method="POST" action="?/revoke">
              <input type="hidden" name="credentialId" value={passkey.credentialId} />
              <button type="submit" class="quiet-button">Revoke passkey</button>
            </form>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>
