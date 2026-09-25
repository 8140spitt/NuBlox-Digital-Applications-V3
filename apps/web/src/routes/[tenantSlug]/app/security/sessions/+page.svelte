<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  function formatDate(value: string) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }
</script>

<svelte:head>
  <title>Active sessions — NuBlox</title>
  <meta name="description" content="Review and revoke active NuBlox application sessions." />
</svelte:head>

<section class="workspace-hero">
  <div>
    <p class="app-eyebrow">Account security</p>
    <h1>Active sessions</h1>
    <p class="workspace-lede">
      Review where this Tenant identity is currently signed in. NuBlox stores a protected network
      fingerprint rather than displaying a raw network address.
    </p>
  </div>

  {#if data.sessions.length > 1}
    <form method="POST" action="?/revokeOthers">
      <button type="submit" class="primary-action">Revoke all other sessions</button>
    </form>
  {/if}
</section>

{#if form?.error}
  <p class="form-message error">{form.error}</p>
{:else if form?.revoked}
  <p class="form-message info">Session revoked.</p>
{:else if form?.revokedOthers !== undefined}
  <p class="form-message info">Revoked {form.revokedOthers} other session(s).</p>
{/if}

<section class="home-section">
  <div class="home-primary-grid">
    {#each data.sessions as session}
      <article class="home-primary-card">
        <span>{session.current ? 'NOW' : 'SS'}</span>
        <div>
          <strong>{session.clientLabel}</strong>
          <p>
            {session.authenticationMethod === 'PASSKEY'
              ? 'Passkey verified'
              : session.authenticationMethod === 'PASSWORD_TOTP'
                ? 'Password + authenticator verified'
                : 'Password verified'}
            · Last active {formatDate(session.lastSeenAt)}
          </p>
          <p>
            Created {formatDate(session.createdAt)} · Expires {formatDate(session.expiresAt)}
          </p>

          <form method="POST" action="?/revoke">
            <input type="hidden" name="sessionId" value={session.sessionId} />
            <button type="submit" class="quiet-button">
              {session.current ? 'Sign out this session' : 'Revoke session'}
            </button>
          </form>
        </div>
      </article>
    {/each}
  </div>
</section>
