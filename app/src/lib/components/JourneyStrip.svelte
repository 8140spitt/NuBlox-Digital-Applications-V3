<script lang="ts">
  let { journey } = $props();
</script>

<section class="journey section-card" aria-labelledby="journey-title">
  <h2 id="journey-title">Business process <span>User journey</span></h2>
  <div class="steps">
    {#each journey as item, index}
      <article class="step">
        <strong>{item.step}. {item.name}</strong>
        <p>{item.detail}</p>
      </article>
      {#if index < journey.length - 1}<span class="arrow" aria-hidden="true">→</span>{/if}
    {/each}
  </div>
</section>

<style>
  .journey {
    padding: 12px;
    border-color: var(--warning-line);
    background: var(--warning-bg);
  }
  h2 {
    margin: 0 0 9px;
    color: #7c4b0c;
    font-size: 14px;
  }
  h2 span {
    margin-left: 4px;
    font-weight: 500;
    font-size: 11px;
  }
  .steps {
    display: grid;
    grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr auto 1fr auto 1fr;
    align-items: stretch;
    gap: 6px;
  }
  .step {
    min-width: 0;
    padding: 9px 10px;
    border: 1px solid #efc776;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.77);
  }
  .step strong {
    color: #3d4e5c;
    font-size: 11px;
  }
  .step p {
    margin: 5px 0 0;
    color: #5b6872;
    font-size: 9.5px;
    line-height: 1.35;
  }
  .arrow {
    align-self: center;
    color: #6e7d86;
    font-weight: 800;
  }
  @media (max-width: 1080px) {
    .steps {
      grid-template-columns: repeat(3, 1fr);
    }
    .arrow {
      display: none;
    }
  }
  @media (max-width: 650px) {
    .steps {
      grid-template-columns: 1fr;
    }
  }
</style>
