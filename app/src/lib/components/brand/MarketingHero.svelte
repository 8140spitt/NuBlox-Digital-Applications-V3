<script lang="ts">
  let { primaryHref = '/start' }: { primaryHref?: string } = $props();
</script>

<section class="hero" aria-labelledby="marketing-hero-title">
  <div class="inner">
    <div class="copy">
      <p class="eyebrow">Built environment operating system</p>
      <h1 id="marketing-hero-title">Run the enterprise and deliver the built environment on one governed platform.</h1>
      <p class="lede">
        NuBlox connects strategy, people, commercial operations, projects, information and assets
        through shared business identities, controlled workflows and traceable decisions.
      </p>
      <div class="actions">
        <a class="primary" href={primaryHref}>Explore NuBlox</a>
        <a class="secondary" href="/login">Sign in</a>
      </div>
    </div>
    <div class="model" aria-label="NuBlox platform model">
      <div class="core">
        <span>Shared enterprise core</span>
        <strong>29 governed business functions</strong>
      </div>
      <div class="layers">
        <span>Strategy & governance</span>
        <span>Commercial & finance</span>
        <span>Projects & delivery</span>
        <span>Information & assets</span>
      </div>
      <small>One identity · one authority · one evidence spine</small>
    </div>
  </div>
</section>

<style>
  .hero {
    padding: clamp(5rem, 10vw, 9rem) 0;
    background:
      radial-gradient(circle at 82% 20%, rgba(64, 174, 225, 0.16), transparent 28rem),
      linear-gradient(180deg, #ffffff, #f2f8fb);
  }
  .inner {
    width: min(88rem, calc(100% - 2rem));
    margin: 0 auto;
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(22rem, 0.75fr);
    gap: clamp(3rem, 7vw, 7rem);
    align-items: center;
  }
  .copy {
    max-width: 58rem;
  }
  .eyebrow {
    margin: 0 0 1rem;
    color: #126f9f;
    font-size: 0.76rem;
    font-weight: 850;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  h1 {
    margin: 0;
    color: #17384c;
    font-size: clamp(2.75rem, 6.5vw, 5.8rem);
    font-weight: 780;
    letter-spacing: -0.06em;
    line-height: 0.98;
    text-wrap: balance;
  }
  .lede {
    max-width: 48rem;
    margin: 1.6rem 0 0;
    color: #5a7080;
    font-size: clamp(1rem, 1.5vw, 1.2rem);
    line-height: 1.65;
  }
  .actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 2rem;
  }
  .actions a {
    padding: 0.8rem 1rem;
    border-radius: 0.55rem;
    font-size: 0.86rem;
    font-weight: 800;
    text-decoration: none;
  }
  .primary {
    background: #126f9f;
    color: white;
  }
  .secondary {
    border: 1px solid #c7d7e0;
    background: white;
    color: #355568;
  }
  .model {
    display: grid;
    gap: 0.8rem;
    padding: 1.1rem;
    border: 1px solid #cfe0e9;
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 1.5rem 4rem rgba(31, 74, 99, 0.09);
  }
  .core {
    display: grid;
    gap: 0.35rem;
    padding: 1.1rem;
    border-radius: 0.7rem;
    background: #17384c;
    color: white;
  }
  .core span {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.7;
  }
  .core strong {
    font-size: 1.1rem;
  }
  .layers {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.55rem;
  }
  .layers span {
    padding: 0.85rem;
    border: 1px solid #dce7ec;
    border-radius: 0.6rem;
    background: #f8fbfc;
    color: #456174;
    font-size: 0.78rem;
    font-weight: 740;
  }
  .model small {
    color: #708692;
    font-size: 0.72rem;
  }
  @media (max-width: 820px) {
    .inner {
      grid-template-columns: 1fr;
    }
  }
</style>
