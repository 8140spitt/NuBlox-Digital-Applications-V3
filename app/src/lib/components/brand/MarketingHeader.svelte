<script lang="ts">
  const links = [
    { label: 'Platform', href: '#platform' },
    { label: 'Product', href: '/web#platform' },
    { label: 'Sign in', href: '/login' }
  ];
</script>

<header class="marketing-header">
  <div class="inner">
    <a class="brand" href="/web" aria-label="NuBlox home">
      <span class="mark" aria-hidden="true">N</span>
      <span class="wordmark">NuBlox</span>
    </a>
    <nav aria-label="Marketing navigation">
      {#each links as link}
        <a href={link.href}>{link.label}</a>
      {/each}
      <a class="cta" href="/start">Get started</a>
    </nav>
  </div>
</header>

<style>
  .marketing-header {
    position: sticky;
    top: 0;
    z-index: 20;
    border-bottom: 1px solid #dbe5eb;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(14px);
  }
  .inner {
    width: min(88rem, calc(100% - 2rem));
    min-height: 4.5rem;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    color: #17384c;
    text-decoration: none;
  }
  .mark {
    display: grid;
    width: 2rem;
    height: 2rem;
    place-items: center;
    border-radius: 0.45rem;
    background: #126f9f;
    color: white;
    font-weight: 850;
  }
  .wordmark {
    font-size: 1.12rem;
    font-weight: 820;
    letter-spacing: -0.03em;
  }
  nav {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }
  nav a {
    color: #4c6575;
    font-size: 0.82rem;
    font-weight: 700;
    text-decoration: none;
  }
  nav a:hover {
    color: #126f9f;
  }
  nav .cta {
    padding: 0.66rem 0.9rem;
    border-radius: 0.5rem;
    background: #126f9f;
    color: white;
  }
  nav .cta:hover {
    background: #0d557a;
    color: white;
  }
  @media (max-width: 700px) {
    nav a:not(.cta) {
      display: none;
    }
  }
</style>
