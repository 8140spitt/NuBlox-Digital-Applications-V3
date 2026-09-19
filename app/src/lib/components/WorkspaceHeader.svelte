<script lang="ts">
  let { id, name, purpose, objects } = $props();
</script>

<header class="workspace-header section-card">
  <div class="identity">
    <span class="function-key">{id}</span>
    <div>
      <span class="eyebrow">Business function workspace</span>
      <h1>{name}</h1>
    </div>
  </div>

  <p class="purpose">{purpose}</p>

  {#if objects?.length}
    <div class="records" aria-label="Primary records">
      <span class="records-label">Primary records</span>
      <div class="record-list">
        {#each objects as object}
          <span>{object}</span>
        {/each}
      </div>
    </div>
  {/if}
</header>

<style>
  .workspace-header {
    display: grid;
    grid-template-columns: minmax(300px, 0.85fr) minmax(360px, 1.15fr);
    gap: 14px 30px;
    align-items: center;
    padding: 18px 20px;
    border-color: #c8d9e3;
    box-shadow: 0 3px 14px rgba(18, 47, 70, 0.05);
  }
  .identity {
    min-width: 0;
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .function-key {
    min-width: 47px;
    min-height: 39px;
    display: grid;
    place-items: center;
    flex: 0 0 47px;
    border: 1px solid #a7c7d9;
    border-radius: 8px;
    background: #edf6fb;
    color: #245d7e;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.04em;
  }
  .eyebrow,
  .records-label {
    color: #728796;
    font-size: 8.5px;
    font-weight: 850;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }
  h1 {
    margin: 2px 0 0;
    color: #1d3d52;
    font-size: 20px;
    line-height: 1.18;
    letter-spacing: -0.02em;
  }
  .purpose {
    margin: 0;
    max-width: 760px;
    color: #526b7c;
    font-size: 11.5px;
    line-height: 1.5;
  }
  .records {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 110px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    padding-top: 11px;
    border-top: 1px solid #e3e9ed;
  }
  .record-list {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .record-list span {
    padding: 4px 7px;
    border: 1px solid #d9e3e8;
    border-radius: 999px;
    background: #f8fafb;
    color: #536d7d;
    font-size: 9px;
    font-weight: 650;
  }
  @media (max-width: 900px) {
    .workspace-header {
      grid-template-columns: 1fr;
      gap: 10px;
    }
    .records {
      grid-column: auto;
      grid-template-columns: 1fr;
      gap: 6px;
    }
  }
  @media (max-width: 600px) {
    .workspace-header {
      padding: 14px;
    }
    h1 {
      font-size: 18px;
    }
  }
</style>
