<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const viewForm = $derived(
    form as ActionData & Partial<{ stepUpRequired: boolean; stepUpUrl: string }>
  );
</script>

<svelte:head>
  <title>Enterprise identity — NuBlox</title>
  <meta
    name="description"
    content="Configure tenant enterprise identity providers and OIDC federation."
  />
</svelte:head>

<section class="workspace-hero">
  <div>
    <p class="app-eyebrow">Account security</p>
    <h1>Enterprise identity</h1>
    <p class="workspace-lede">
      Connect this Tenant to an OpenID Connect identity provider. Federation authenticates an
      existing NuBlox employee identity; provider claims do not create Positions, Permission,
      Responsibility or business Authority.
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

{#if !data.canManage}
  <section class="home-section">
    <p class="form-message error">
      Enterprise identity configuration is restricted. {data.manageReason}
    </p>
  </section>
{:else}
  <section class="home-section">
    <header class="home-section-heading">
      <div>
        <p class="app-eyebrow">New provider</p>
        <h2>Configure OpenID Connect</h2>
      </div>
    </header>

    <form method="POST" action="?/create" class="login-form">
      <label>
        <span>Provider name</span>
        <input name="name" maxlength="120" placeholder="Microsoft Entra ID" required />
      </label>

      <label>
        <span>Issuer URL</span>
        <input
          name="issuerUrl"
          type="url"
          maxlength="512"
          placeholder="https://login.microsoftonline.com/tenant-id/v2.0"
          required
        />
      </label>

      <label>
        <span>Client ID</span>
        <input name="clientId" maxlength="255" required />
      </label>

      <label>
        <span>Client secret</span>
        <input name="clientSecret" type="password" autocomplete="new-password" required />
      </label>

      <label>
        <span>Scopes</span>
        <input name="scopes" value="openid profile email" maxlength="512" required />
      </label>

      <label>
        <span>Session assurance</span>
        <select name="sessionAssurance">
          <option value="PASSWORD">Federated authentication</option>
          <option value="MFA">Provider enforces strong authentication</option>
        </select>
      </label>

      <label>
        <span>Email claim</span>
        <input name="emailClaim" value="email" maxlength="64" required />
      </label>

      <label>
        <span>
          <input name="trustEmailClaim" type="checkbox" />
          Trust the configured email claim even when the provider does not emit
          <code>email_verified=true</code>
        </span>
      </label>

      <button type="submit" class="primary-action">Validate and create provider</button>
    </form>

    <p class="workspace-lede">
      NuBlox validates live discovery metadata before saving the provider. Automatic first-time
      linking is permitted only to an existing active Tenant employee identity with an exact email
      match, and only when the email claim is verified or explicitly trusted here.
    </p>
  </section>

  <section class="home-section">
    <header class="home-section-heading">
      <div>
        <p class="app-eyebrow">Configured providers</p>
        <h2>Tenant federation</h2>
      </div>
    </header>

    {#if data.providers.length === 0}
      <p>No enterprise identity provider is configured.</p>
    {:else}
      <div class="home-primary-grid">
        {#each data.providers as provider}
          <article class="home-primary-card">
            <span>{provider.status === 'ACTIVE' ? 'SSO' : 'OFF'}</span>
            <div>
              <strong>{provider.name}</strong>
              <p>{provider.issuerUrl}</p>
              <p>
                {provider.sessionAssurance === 'MFA'
                  ? 'Provider trusted for strong authentication'
                  : 'NuBlox continuation policy applies'}
                · {provider.status}
              </p>

              <details>
                <summary>Edit provider</summary>
                <form method="POST" action="?/update" class="login-form">
                  <input type="hidden" name="providerId" value={provider.id} />

                  <label>
                    <span>Name</span>
                    <input name="name" value={provider.name} maxlength="120" required />
                  </label>

                  <label>
                    <span>Issuer URL</span>
                    <input name="issuerUrl" type="url" value={provider.issuerUrl} maxlength="512" required />
                  </label>

                  <label>
                    <span>Client ID</span>
                    <input name="clientId" value={provider.clientId} maxlength="255" required />
                  </label>

                  <label>
                    <span>New client secret</span>
                    <input
                      name="clientSecret"
                      type="password"
                      autocomplete="new-password"
                      placeholder="Leave blank to keep existing secret"
                    />
                  </label>

                  <label>
                    <span>Scopes</span>
                    <input name="scopes" value={provider.scopes} maxlength="512" required />
                  </label>

                  <label>
                    <span>Session assurance</span>
                    <select name="sessionAssurance">
                      <option value="PASSWORD" selected={provider.sessionAssurance === 'PASSWORD'}>
                        Federated authentication
                      </option>
                      <option value="MFA" selected={provider.sessionAssurance === 'MFA'}>
                        Provider enforces strong authentication
                      </option>
                    </select>
                  </label>

                  <label>
                    <span>Email claim</span>
                    <input name="emailClaim" value={provider.emailClaim} maxlength="64" required />
                  </label>

                  <label>
                    <span>
                      <input
                        name="trustEmailClaim"
                        type="checkbox"
                        checked={provider.trustEmailClaim}
                      />
                      Trust email claim without <code>email_verified=true</code>
                    </span>
                  </label>

                  <button type="submit" class="quiet-button">Validate and save</button>
                </form>
              </details>

              <form method="POST" action="?/status">
                <input type="hidden" name="providerId" value={provider.id} />
                <input
                  type="hidden"
                  name="status"
                  value={provider.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'}
                />
                <button type="submit" class="quiet-button">
                  {provider.status === 'ACTIVE' ? 'Disable provider' : 'Enable provider'}
                </button>
              </form>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </section>
{/if}
