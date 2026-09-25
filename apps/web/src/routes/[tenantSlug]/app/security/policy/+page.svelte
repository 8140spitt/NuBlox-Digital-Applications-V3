<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
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

{#if form?.stepUpRequired && form?.stepUpUrl}
  <p class="form-message error">
    {form.error}
    <a href={form.stepUpUrl}>Verify MFA and return</a>
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
      <strong>MFA coverage</strong>
      <p>
        {data.coverage.enrolledIdentities} of {data.coverage.activeIdentities} active application
        identities currently have tenant-scoped MFA enrolled.
      </p>
    </div>
  </article>

  <article class="home-primary-card">
    <span>PL</span>
    <div>
      <strong>Current requirement</strong>
      <p>{data.policy.mfaRequirement === 'REQUIRED' ? 'MFA required' : 'MFA optional'}</p>
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
      <span>MFA requirement</span>
      <select name="mfaRequirement" disabled={!data.canManage}>
        <option value="OPTIONAL" selected={data.policy.mfaRequirement === 'OPTIONAL'}>
          Optional
        </option>
        <option value="REQUIRED" selected={data.policy.mfaRequirement === 'REQUIRED'}>
          Required for every employee application session
        </option>
      </select>
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

  {#if data.policy.mfaRequirement === 'OPTIONAL' && data.coverage.enrolledIdentities < data.coverage.activeIdentities}
    <p class="workspace-lede">
      If MFA is changed to required, employees without an enrollment will be taken through secure
      MFA setup immediately after their password is verified and before NuBlox creates a full session.
    </p>
  {/if}
</section>
