<script lang="ts">
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
  <title>NuBlox Platform Administration</title>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<main class="platform-login-shell">
  <section class="platform-login-card">
    <p class="platform-eyebrow">NuBlox Operator Control Plane</p>
    <h1>Platform administration</h1>
    <p class="platform-lede">
      This sign-in is separate from every Tenant. Only authorised NuBlox platform operators can access this control plane.
    </p>

    {#if form?.missing}
      <p class="platform-message error">Enter your operator email address and password.</p>
    {:else if form?.invalid}
      <p class="platform-message error">The platform operator credentials are not valid.</p>
    {:else if form?.rateLimited}
      <p class="platform-message error">
        Too many attempts. Try again in {form.retryAfterSeconds ?? 60} seconds.
      </p>
    {/if}

    <form method="POST" class="platform-login-form">
      <label>
        <span>Operator email</span>
        <input name="email" type="email" autocomplete="username" value={form?.email ?? ''} required />
      </label>
      <label>
        <span>Password</span>
        <input name="password" type="password" autocomplete="current-password" required />
      </label>
      <button type="submit">Sign in to platform administration</button>
    </form>
  </section>
</main>

<style>
  .platform-login-shell {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 2rem;
    background: var(--surface-canvas, #f5f5f3);
  }

  .platform-login-card {
    width: min(100%, 34rem);
    padding: 2.5rem;
    border: 1px solid var(--border-subtle, #d9d9d3);
    border-radius: 1rem;
    background: var(--surface-raised, #fff);
    box-shadow: 0 1.5rem 4rem rgb(0 0 0 / 8%);
  }

  .platform-eyebrow {
    margin: 0 0 0.75rem;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    font-size: clamp(2rem, 6vw, 3rem);
  }

  .platform-lede {
    margin: 1rem 0 1.75rem;
    line-height: 1.6;
  }

  .platform-login-form {
    display: grid;
    gap: 1rem;
  }

  label {
    display: grid;
    gap: 0.4rem;
    font-weight: 600;
  }

  input {
    width: 100%;
    padding: 0.8rem 0.9rem;
    border: 1px solid var(--border-subtle, #c8c8c2);
    border-radius: 0.55rem;
    font: inherit;
  }

  button {
    margin-top: 0.35rem;
    padding: 0.9rem 1rem;
    border: 0;
    border-radius: 0.55rem;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
    background: #111;
    color: #fff;
  }

  .platform-message {
    padding: 0.8rem 1rem;
    border-radius: 0.55rem;
  }

  .error {
    background: #fff1f0;
    color: #8a1f17;
  }
</style>
