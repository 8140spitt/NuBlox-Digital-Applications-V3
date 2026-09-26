<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Sign out — NuBlox Platform Administration</title>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<main class="signout-shell">
  <section>
    <p class="eyebrow">NuBlox Operator Control Plane</p>
    <h1>Sign out?</h1>
    <p>You are signed in as <strong>{data.operator.displayName}</strong>.</p>
    <form method="POST">
      <button type="submit">Sign out of platform administration</button>
      <a href="/platform">Return to Tenant administration</a>
    </form>
  </section>
</main>

<style>
  .signout-shell { min-height: 100vh; display: grid; place-items: center; padding: 2rem; }
  section { width: min(100%, 32rem); padding: 2rem; border: 1px solid #d8d8d2; border-radius: 0.8rem; background: #fff; }
  .eyebrow { font-size: 0.75rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
  form { display: flex; gap: 1rem; align-items: center; margin-top: 1.5rem; }
  button { padding: 0.8rem 1rem; border: 0; border-radius: 0.5rem; background: #111; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
</style>
