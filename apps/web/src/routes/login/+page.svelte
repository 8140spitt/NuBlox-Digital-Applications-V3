<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Sign in — NuBlox</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="login-page">
  <section class="login-brand-panel">
    <a class="login-brand" href="/">NuBlox</a>
    <div>
      <p class="app-eyebrow">Enterprise Operating Platform</p>
      <h1>One identity.<br />One tenant context.<br />Governed work.</h1>
      <p>
        Application identity selects the tenant and Person context. Permission, Responsibility,
        competence and Authority are evaluated separately when governed work is performed.
      </p>
    </div>
    <span class="login-version">Digital Applications V3</span>
  </section>

  <section class="login-form-panel">
    <div class="login-form-wrap">
      <header>
        <p class="app-eyebrow">Secure access</p>
        <h2>Sign in to NuBlox</h2>
        <p>Use an account provisioned against an active tenant Person.</p>
      </header>

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
            value={form?.email ?? ''}
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

        {#if form?.invalid}
          <p class="form-message error">Email or password is not valid for an active account.</p>
        {:else if form?.missing}
          <p class="form-message error">Email and password are required.</p>
        {/if}

        <button type="submit" class="login-submit">
          Sign in
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <p class="login-help">
        Accounts are provisioned by an authorised platform administrator. NuBlox does not expose
        public self-registration.
      </p>
    </div>
  </section>
</main>
