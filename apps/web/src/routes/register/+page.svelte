<script lang="ts">
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
  <title>Start with NuBlox</title>
  <meta
    name="description"
    content="Create your NuBlox tenant and start configuring your business operating environment."
  />
</svelte:head>

<main class="login-page">
  <section class="login-brand-panel">
    <a class="login-brand" href="/">NuBlox</a>
    <div>
      <p class="app-eyebrow">Start with NuBlox</p>
      <h1>Create your<br />business environment.</h1>
      <p>
        Registration creates the Tenant, its Tenant Party and Organisation, your Employee Party and
        Person identity, and the initial Tenant administrator access required to configure the business.
      </p>
    </div>
    <span class="login-version">Digital Applications V3</span>
  </section>

  <section class="login-form-panel">
    <div class="login-form-wrap">
      <header>
        <p class="app-eyebrow">Tenant registration</p>
        <h2>Create your NuBlox tenant</h2>
        <p>
          Your business address becomes <code>nublox.com/your-slug/app</code>.
          NuBlox verifies your work email before the first sign-in.
        </p>
      </header>

      <form method="POST" class="login-form">
        <label>
          <span>Business name</span>
          <input
            name="businessName"
            autocomplete="organization"
            maxlength="255"
            value={form?.businessName ?? ''}
            required
          />
        </label>

        <label>
          <span>Tenant address</span>
          <input
            name="tenantSlug"
            autocomplete="off"
            maxlength="80"
            pattern="[a-z0-9][a-z0-9-]{1,78}[a-z0-9]"
            placeholder="spittal-construction"
            value={form?.tenantSlug ?? ''}
          />
          <small>Lowercase letters, numbers and hyphens. Leave blank and NuBlox will generate one.</small>
        </label>

        <label>
          <span>Your name</span>
          <input
            name="personName"
            autocomplete="name"
            maxlength="255"
            value={form?.personName ?? ''}
            required
          />
        </label>

        <label>
          <span>Work email</span>
          <input
            name="email"
            type="email"
            autocomplete="email"
            maxlength="320"
            value={form?.email ?? ''}
            required
          />
        </label>

        <label>
          <span>Password</span>
          <input
            name="password"
            type="password"
            autocomplete="new-password"
            minlength="12"
            required
          />
        </label>

        <label class="login-checkbox">
          <input
            name="acceptedTerms"
            type="checkbox"
            checked={form?.acceptedTerms ?? false}
            required
          />
          <span>I accept the NuBlox terms and privacy notice.</span>
        </label>

        {#if form?.error}
          <p class="form-message error">{form.error}</p>
        {/if}

        <button type="submit" class="login-submit">
          Create tenant
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <p class="login-help">
        Already have access? <a href="/login">Sign in</a>
      </p>
    </div>
  </section>
</main>
