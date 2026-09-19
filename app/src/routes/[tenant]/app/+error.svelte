<script lang="ts">
  import { page } from '$app/state';

  function permissionFromError(message: string | undefined) {
    const prefix = 'Permission denied: ';
    return message?.startsWith(prefix) ? message.slice(prefix.length).trim() : null;
  }

  const tenantHome = $derived(`/${page.params.tenant}/app`);
  const forbidden = $derived(page.status === 403);
  const notFound = $derived(page.status === 404);
  const requiredPermission = $derived(forbidden ? permissionFromError(page.error?.message) : null);
</script>

<svelte:head>
  <title
    >{forbidden ? 'Access restricted' : notFound ? 'Not found' : 'Request failed'} · NuBlox</title
  >
</svelte:head>

<section class="error-state section-card" aria-labelledby="error-title">
  <div class="status" aria-hidden="true">{page.status}</div>

  <div class="content">
    <span class="eyebrow">
      {forbidden ? 'Access control' : notFound ? 'Navigation' : 'Application'}
    </span>

    <h1 id="error-title">
      {forbidden
        ? 'Access restricted'
        : notFound
          ? 'This page could not be found'
          : 'This request could not be completed'}
    </h1>

    {#if forbidden && requiredPermission}
      <p>Your role does not permit access to this area. The rest of NuBlox remains available.</p>
      <p class="guidance">
        You can return home or request the required access. Your request will be routed to Tenant
        Administrators through My Work for review.
      </p>
    {:else if forbidden}
      <p>
        Your current tenant authority does not permit access to this area. Return home and contact a
        Tenant Administrator if you believe your tenant membership should be reviewed.
      </p>
    {:else if notFound}
      <p>
        The page or business record may have moved, been removed, or the address may be incorrect.
      </p>
    {:else}
      <p>
        NuBlox could not complete this request. Return to the workspace home and continue from a
        known state.
      </p>
    {/if}

    <div class="actions">
      <a class="primary" href={tenantHome}>Back to home</a>
      {#if requiredPermission}
        <form method="POST" action={`/${page.params.tenant}/app/access-request`}>
          <input type="hidden" name="permissionKey" value={requiredPermission} />
          <input type="hidden" name="requestedPath" value={page.url.pathname} />
          <button class="secondary" type="submit">Request permission</button>
        </form>
      {/if}
    </div>
  </div>
</section>

<style>
  .error-state {
    min-height: 360px;
    display: grid;
    grid-template-columns: 110px minmax(0, 620px);
    justify-content: center;
    align-content: center;
    gap: 28px;
    padding: 44px;
    background:
      radial-gradient(circle at top right, rgba(111, 190, 232, 0.14), transparent 38%), #fff;
  }

  .status {
    display: grid;
    place-items: center;
    width: 96px;
    height: 96px;
    border: 1px solid #b9d9ea;
    border-radius: 18px;
    background: #f3faff;
    color: #315f7d;
    font-size: 28px;
    font-weight: 850;
    letter-spacing: -0.03em;
  }

  .content {
    align-self: center;
  }

  .eyebrow {
    color: var(--blue-700);
    font-size: 10px;
    font-weight: 850;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  h1 {
    margin: 5px 0 10px;
    color: #203b4f;
    font-size: 26px;
    line-height: 1.15;
  }

  p {
    max-width: 580px;
    margin: 0;
    color: #566d7e;
    font-size: 12px;
    line-height: 1.55;
  }

  .guidance {
    margin-top: 8px;
    color: #718391;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 18px;
  }

  .actions form {
    margin: 0;
  }

  .primary,
  .secondary {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    padding: 0 14px;
    border-radius: 7px;
    font-size: 10.5px;
    font-weight: 800;
    text-decoration: none;
  }

  .primary {
    border: 1px solid var(--blue-700);
    background: var(--blue-700);
    color: white;
  }

  .primary:hover {
    background: var(--navy-800);
  }

  .secondary {
    border: 1px solid #9dc9e1;
    background: #f4faff;
    color: #2c607f;
    cursor: pointer;
  }

  .secondary:hover {
    border-color: #6fb0d4;
    background: #eaf6fd;
  }

  @media (max-width: 720px) {
    .error-state {
      grid-template-columns: 1fr;
      min-height: 300px;
      padding: 26px 18px;
    }

    .status {
      width: 72px;
      height: 72px;
      border-radius: 14px;
      font-size: 22px;
    }
  }
</style>
