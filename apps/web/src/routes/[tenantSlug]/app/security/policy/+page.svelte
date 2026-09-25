<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const viewForm = $derived(
    form as ActionData & Partial<{ stepUpRequired: boolean; stepUpUrl: string }>
  );
</script>

<svelte:head>
  <title>Authentication policy — NuBlox</title>
  <meta
    name="description"
    content="Govern tenant-wide authentication, MFA and session policy."
  />
</svelte:head>

<section class="workspace-hero">
  <div>
    <p class="app-eyebrow">Account security</p>
    <h1>Tenant authentication policy</h1>
    <p class="workspace-lede">
      Govern how identities authenticate into this Tenant. These controls affect authentication
      only; business Permission and Authority remain separate.
    </p>
  </div>
</section>

{#if viewForm?.stepUpRequired && viewForm?.stepUpUrl}
  <p class="form-message error">
    {form.error}
    <a href={viewForm.stepUpUrl}>Verify again and return</a>
  </p>
{:else if form?.error}
  <p class="form-message error">{form.error}</p>
{:else if form?.message}
  <p class="form-message info">{form.message}</p>
{/if}

<section class="home-primary-grid">
  <article class="home-primary-card">
    <span>MFA</span>
    <div>
      <strong>Strong authentication coverage</strong>
      <p>
        {data.coverage.strongAuthenticationIdentities} of {data.coverage.activeIdentities} active
        identities have TOTP MFA, a passkey, or both.
      </p>
    </div>
  </article>

  <article class="home-primary-card">
    <span>PL</span>
    <div>
      <strong>Current requirement</strong>
      <p>{data.policy.mfaRequirement === 'REQUIRED' ? 'Strong authentication required' : 'Strong authentication optional'}</p>
    </div>
  </article>
</section>

<section class="home-section">
  <header class="home-section-heading">
    <div>
      <p class="app-eyebrow">Policy</p>
      <h2>Authentication controls</h2>
    </div>
    {#if !data.canManage}
      <p>Read only — {data.manageReason}</p>
    {/if}
  </header>

  <form method="POST" action="?/update" class="login-form">
    <label>
      <span>Strong authentication requirement</span>
      <select name="mfaRequirement" disabled={!data.canManage}>
        <option value="OPTIONAL" selected={data.policy.mfaRequirement === 'OPTIONAL'}>
          Optional
        </option>
        <option value="REQUIRED" selected={data.policy.mfaRequirement === 'REQUIRED'}>
          Require TOTP MFA or a user-verified passkey for every employee application session
        </option>
      </select>
    </label>

    <label>
      <span>Passkey authentication</span>
      <span>
        <input
          name="passkeyEnabled"
          type="checkbox"
          checked={data.policy.passkeyEnabled}
          disabled={!data.canManage}
        />
        Allow WebAuthn passkey registration, sign-in and step-up authentication
      </span>
    </label>

    <label>
      <span>Session lifetime (minutes)</span>
      <input
        name="sessionTtlMinutes"
        type="number"
        min="15"
        max="1440"
        value={data.policy.sessionTtlMinutes}
        disabled={!data.canManage}
        required
      />
    </label>

    <label>
      <span>Idle timeout (minutes)</span>
      <input
        name="idleTimeoutMinutes"
        type="number"
        min="5"
        max="720"
        value={data.policy.idleTimeoutMinutes}
        disabled={!data.canManage}
        required
      />
    </label>

    <label>
      <span>Maximum active sessions per identity</span>
      <input
        name="maxActiveSessions"
        type="number"
        min="1"
        max="20"
        value={data.policy.maxActiveSessions}
        disabled={!data.canManage}
        required
      />
    </label>

    {#if data.canManage}
      <button type="submit" class="primary-action">Save authentication policy</button>
    {/if}
  </form>

  <p class="workspace-lede">
    TOTP enrolled: {data.coverage.enrolledIdentities}. Passkey enrolled:
    {data.coverage.passkeyEnrolledIdentities}. Disabling passkeys immediately revokes active
    passkey-authenticated sessions and prevents outstanding passkey ceremonies from completing.
  </p>

  {#if data.policy.mfaRequirement === 'OPTIONAL' && data.coverage.strongAuthenticationIdentities < data.coverage.activeIdentities}
    <p class="workspace-lede">
      If strong authentication is changed to required, password-only access will no longer produce
      a full application session. Users can satisfy the requirement with TOTP MFA or a user-verified passkey.
    </p>
  {/if}
</section>
