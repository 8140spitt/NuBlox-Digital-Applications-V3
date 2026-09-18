<script lang="ts">
  let { id, name, purpose, objects } = $props();
</script>

<header class="workspace-header section-card">
  <div class="identity">
    <div class="function-icon">▤</div>
    <div>
      <span class="eyebrow">{id}</span>
      <h1>{name}</h1>
    </div>
  </div>
  <p class="purpose">{purpose}</p>
  <div class="objects">
    <strong>Objects</strong>{#each objects as object}<span>{object}</span>{/each}
  </div>
</header>

<style>
  .workspace-header {
    display: grid;
    grid-template-columns: minmax(320px, 1.05fr) minmax(320px, 1.25fr) minmax(180px, 0.55fr);
    gap: 24px;
    align-items: start;
    padding: 15px;
    border-color: #8fc9ee;
    background: linear-gradient(120deg, #fafdff 0%, #eaf6fd 56%, #fafdff 100%);
  }
  .identity {
    display: flex;
    gap: 14px;
    align-items: center;
  }
  .function-icon {
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    flex: 0 0 58px;
    border-radius: 9px;
    background: linear-gradient(145deg, var(--navy-800), #075478);
    color: white;
    font-size: 29px;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
  }
  .eyebrow {
    color: var(--navy-800);
    font-size: 15px;
    font-weight: 850;
  }
  h1 {
    margin: 1px 0 0;
    font-size: 21px;
    line-height: 1.15;
    letter-spacing: -0.02em;
  }
  .purpose {
    margin: 7px 0 0;
    max-width: 700px;
    color: #2c465c;
    line-height: 1.45;
    font-size: 13px;
  }
  .objects {
    display: grid;
    gap: 1px;
    padding: 10px 12px;
    border: 1px solid #83c5ed;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.73);
    color: #31516b;
    font-size: 10.5px;
  }
  .objects strong {
    color: #1c3e58;
    font-size: 10px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  @media (max-width: 1120px) {
    .workspace-header {
      grid-template-columns: 1fr 1fr;
    }
    .objects {
      grid-column: 1 / -1;
      grid-template-columns: repeat(4, 1fr);
    }
    .objects strong {
      grid-column: 1 / -1;
    }
  }
  @media (max-width: 720px) {
    .workspace-header {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    .objects {
      grid-column: auto;
      grid-template-columns: 1fr 1fr;
    }
    h1 {
      font-size: 19px;
    }
  }
</style>
