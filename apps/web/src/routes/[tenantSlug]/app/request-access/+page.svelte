<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const permissionKey = $derived(form?.permissionKey ?? data.permissionKey);
  const returnTo = $derived(form?.returnTo ?? data.returnTo);
</script>

<svelte:head>
  <title>Request access — NuBlox</title>
</svelte:head>

<section class="access-request-page">
  <div class="access-request-context">
    <p class="app-eyebrow">Controlled access request</p>
    <h1>Request permission</h1>
    <p>
      Access is granted through scoped Access Roles. Submitting this request does not grant
      permission automatically; it creates an attributable request for tenant administrators.
    </p>

    <dl>
      <div>
        <dt>Permission</dt>
        <dd>{permissionKey || 'Not specified'}</dd>
      </div>
      <div>
        <dt>Scope</dt>
        <dd>{data.scopeType}{data.scopeId ? ` · ${data.scopeId}` : ''}</dd>
      </div>
    </dl>
  </div>

  <div class="access-request-form-panel">
    {#if form?.ok}
      <div class="request-complete">
        <span>Submitted</span>
        <h2>Your request is in administrators’ My Work.</h2>
        <p>{form.message}</p>
        <small>Request ID: {form.requestId}</small>
        <div>
          <a class="primary-action" href={returnTo}>
            Return
            <span aria-hidden="true">→</span>
          </a>
          <a class="quiet-link" href="/app/my-work">Open My Work</a>
        </div>
      </div>
    {:else}
      <form method="POST" class="request-access-form">
        <input type="hidden" name="permissionKey" value={permissionKey} />
        <input type="hidden" name="scopeType" value={data.scopeType} />
        <input type="hidden" name="scopeId" value={data.scopeId} />
        <input type="hidden" name="returnTo" value={returnTo} />

        <header>
          <p class="app-eyebrow">Business justification</p>
          <h2>Why do you need this access?</h2>
          <p>
            State the work you need to perform. The request remains pending until an administrator
            assigns appropriate access and records the outcome.
          </p>
        </header>

        {#if form?.error}
          <div class="admin-feedback error" role="alert">
            <strong>Request not submitted</strong>
            <span>{form.error}</span>
          </div>
        {/if}

        <label>
          <span>Reason</span>
          <textarea
            name="reason"
            rows="6"
            minlength="10"
            required
            placeholder="Describe the work you need to perform and why this permission is required."
          ></textarea>
        </label>

        <button type="submit" class="login-submit" disabled={!permissionKey}>
          Submit request
          <span aria-hidden="true">→</span>
        </button>

        <a class="quiet-link request-cancel" href={returnTo}>Cancel and return</a>
      </form>
    {/if}
  </div>
</section>
