<script lang="ts">
  let { data, form } = $props();
</script>

<svelte:head>
  <title>Sign in · NuBlox</title>
  <meta name="description" content="Sign in to your NuBlox workspace." />
</svelte:head>

<main class="auth-shell">
  <section class="auth-brand">
    <div class="wordmark"><span class="mark">N</span><span>NuBlox</span></div>
    <div class="brand-copy">
      <p class="eyebrow">Construction &amp; Built Environment ERP</p>
      <h1>One governed operating system for the built environment.</h1>
      <p>
        Secure access to your organisation's functions, projects, commercial controls, information,
        assets and evidence.
      </p>
    </div>
  </section>

  <section class="auth-panel" aria-labelledby="sign-in-heading">
    <div class="panel-copy">
      <p class="eyebrow">Secure workspace</p>
      <h2 id="sign-in-heading">Sign in</h2>
      <p>Use the account issued by your NuBlox administrator.</p>
    </div>

    {#if form?.message}
      <div class="error" role="alert">{form.message}</div>
    {/if}

    <form method="POST">
      <input type="hidden" name="returnTo" value={data.returnTo} />
      <label>
        <span>Email</span>
        <input name="email" type="email" autocomplete="email" required value={form?.email ?? ''} />
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
      <button type="submit">Sign in</button>
    </form>

    <p class="support">
      Account access is controlled by your tenant administrator. Public account registration is not
      enabled.
    </p>
  </section>
</main>

<style>
  :global(body) {
    background: var(--navy-950);
  }
  .auth-shell {
    min-height: 100vh;
    display: grid;
    grid-template-columns: minmax(360px, 1fr) minmax(420px, 560px);
    background: linear-gradient(
      120deg,
      var(--navy-950) 0%,
      var(--navy-900) 48%,
      #eef4f8 48%,
      #f7f9fb 100%
    );
  }
  .auth-brand {
    min-height: 100vh;
    padding: clamp(32px, 6vw, 84px);
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 56px;
  }
  .wordmark {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 30px;
    font-weight: 760;
    letter-spacing: -0.03em;
  }
  .mark {
    width: 38px;
    height: 42px;
    display: grid;
    place-items: center;
    border: 2px solid rgba(255, 255, 255, 0.92);
    border-radius: 5px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
  }
  .brand-copy {
    max-width: 680px;
    padding-bottom: 5vh;
  }
  .eyebrow {
    margin: 0 0 12px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 11px;
    font-weight: 760;
    color: #87c7eb;
  }
  .brand-copy h1 {
    margin: 0;
    max-width: 760px;
    font-size: clamp(38px, 5vw, 68px);
    line-height: 0.98;
    letter-spacing: -0.045em;
    font-weight: 690;
  }
  .brand-copy p:last-child {
    max-width: 650px;
    margin: 28px 0 0;
    font-size: 17px;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.72);
  }
  .auth-panel {
    align-self: center;
    justify-self: center;
    width: min(420px, calc(100% - 48px));
    padding: 36px;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.97);
    box-shadow: 0 24px 70px rgba(7, 36, 58, 0.18);
  }
  .panel-copy h2 {
    margin: 0;
    color: var(--navy-950);
    font-size: 32px;
    letter-spacing: -0.03em;
  }
  .panel-copy > p:last-child {
    margin: 8px 0 0;
    color: var(--muted);
    line-height: 1.55;
  }
  form {
    display: grid;
    gap: 18px;
    margin-top: 28px;
  }
  label {
    display: grid;
    gap: 7px;
    color: var(--ink);
    font-size: 13px;
    font-weight: 670;
  }
  input {
    width: 100%;
    height: 46px;
    border: 1px solid #bdcbd6;
    border-radius: 8px;
    padding: 0 13px;
    background: white;
    color: var(--ink);
    outline: none;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
  }
  input:focus {
    border-color: var(--blue-700);
    box-shadow: 0 0 0 3px rgba(22, 104, 155, 0.12);
  }
  button {
    height: 46px;
    border: 0;
    border-radius: 8px;
    background: var(--navy-900);
    color: white;
    font-weight: 730;
    cursor: pointer;
  }
  button:hover {
    background: var(--navy-800);
  }
  .error {
    margin-top: 20px;
    padding: 11px 12px;
    border: 1px solid #d9a0a0;
    border-radius: 8px;
    background: #fff3f3;
    color: #812c2c;
    font-size: 13px;
  }
  .support {
    margin: 22px 0 0;
    padding-top: 18px;
    border-top: 1px solid var(--line);
    color: var(--muted);
    font-size: 12px;
    line-height: 1.55;
  }
  @media (max-width: 860px) {
    .auth-shell {
      grid-template-columns: 1fr;
      background: #f4f7fa;
    }
    .auth-brand {
      min-height: auto;
      padding: 24px;
      background: var(--navy-950);
      gap: 28px;
    }
    .brand-copy {
      padding: 22px 0 10px;
    }
    .brand-copy h1 {
      font-size: clamp(32px, 10vw, 48px);
    }
    .auth-panel {
      margin: 42px auto;
    }
  }
</style>
