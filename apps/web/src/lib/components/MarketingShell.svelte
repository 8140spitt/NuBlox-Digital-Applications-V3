<script lang="ts">
  import { marketingNav } from '$lib/marketing/site';

  let { children }: { children: import('svelte').Snippet } = $props();
</script>

<div class="marketing-site">
  <header class="marketing-header">
    <a class="marketing-brand" href="/" aria-label="NuBlox home">NuBlox</a>
    <nav class="marketing-nav" aria-label="Primary">
      {#each marketingNav as item}
        <a href={item.href}>{item.label}</a>
      {/each}
    </nav>
    <div class="marketing-actions">
      <a class="marketing-text-link" href="/login">Sign in</a>
      <a class="marketing-button small" href="/contact">Book a conversation</a>
    </div>
  </header>

  {@render children()}

  <footer class="marketing-footer">
    <div>
      <a class="marketing-brand" href="/">NuBlox</a>
      <p>One connected enterprise operating environment for how organisations operate and how they deliver.</p>
    </div>
    <div class="marketing-footer-grid">
      <div>
        <strong>Product</strong>
        <a href="/product">Overview</a>
        <a href="/product/platform">Platform architecture</a>
        <a href="/functions">Functions</a>
        <a href="/pricing">Pricing</a>
      </div>
      <div>
        <strong>Industries</strong>
        <a href="/industries">Industry solutions</a>
        <a href="/construction-built-environment">Construction & Built Environment</a>
      </div>
      <div>
        <strong>Trust</strong>
        <a href="/security">Security & governance</a>
        <a href="/resources">Resources</a>
      </div>
      <div>
        <strong>NuBlox</strong>
        <a href="/company">Company</a>
        <a href="/contact">Contact</a>
        <a href="/register">Start with NuBlox</a>
      </div>
    </div>
    <p class="marketing-footer-note">© {new Date().getFullYear()} NuBlox. Product capabilities evolve through governed releases.</p>
  </footer>
</div>
