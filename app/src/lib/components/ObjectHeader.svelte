<script lang="ts">
  type MetadataItem = {
    label: string;
    value: string;
  };

  type TabItem = {
    label: string;
    href: string;
    count?: number | null;
  };

  let {
    objectType,
    reference,
    title,
    subtitle = null,
    status = null,
    metadata = [],
    tabs = [],
    activeTab = ''
  }: {
    objectType: string;
    reference: string;
    title: string;
    subtitle?: string | null;
    status?: string | null;
    metadata?: MetadataItem[];
    tabs?: TabItem[];
    activeTab?: string;
  } = $props();

  const statusClass = $derived(
    status ? 'status-' + status.toLowerCase().replace(/[^a-z0-9]+/g, '-') : ''
  );
</script>

<section class="object-workspace-header section-card">
  <header class="object-identity">
    <div class="object-copy">
      <span class="eyebrow">{objectType}</span>
      <div class="title-row">
        <h1>{title}</h1>
        {#if status}
          <span class={'status ' + statusClass}>{status.replaceAll('_', ' ')}</span>
        {/if}
      </div>
      <div class="reference-row">
        <strong>{reference}</strong>
        {#if subtitle}<span>{subtitle}</span>{/if}
      </div>
    </div>

    {#if metadata.length}
      <dl class="metadata">
        {#each metadata as item}
          <div>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        {/each}
      </dl>
    {/if}
  </header>

  {#if tabs.length}
    <nav class="object-tabs" aria-label={objectType + ' sections'}>
      {#each tabs as tab}
        <a class:active={tab.label === activeTab} href={tab.href}>
          <span>{tab.label}</span>
          {#if tab.count !== undefined && tab.count !== null}<small>{tab.count}</small>{/if}
        </a>
      {/each}
    </nav>
  {/if}
</section>

<style>
  .object-workspace-header {
    overflow: hidden;
  }
  .object-identity {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: start;
    padding: 17px 18px 14px;
  }
  .object-copy {
    min-width: 0;
  }
  .eyebrow {
    color: #6d8392;
    font-size: 8.5px;
    font-weight: 850;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .title-row {
    display: flex;
    gap: 9px;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 2px;
  }
  h1 {
    margin: 0;
    color: #183b51;
    font-size: 21px;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }
  .status {
    padding: 4px 7px;
    border: 1px solid #cfdce3;
    border-radius: 999px;
    background: #f4f7f9;
    color: #5e7482;
    font-size: 7.5px;
    font-weight: 850;
    text-transform: uppercase;
  }
  .status-approved,
  .status-active,
  .status-complete,
  .status-completed {
    border-color: #b7d9bd;
    background: #eef8f0;
    color: #326c3f;
  }
  .status-draft,
  .status-in-progress,
  .status-under-review {
    border-color: #c8ddeb;
    background: #f0f7fb;
    color: #32637e;
  }
  .status-blocked,
  .status-rejected,
  .status-cancelled {
    border-color: #e2bbbb;
    background: #fff2f2;
    color: #863d3d;
  }
  .reference-row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 5px;
    color: #6e8290;
    font-size: 9.5px;
  }
  .reference-row strong {
    color: #456276;
    font-size: 9.5px;
  }
  .reference-row span::before {
    content: '·';
    margin-right: 8px;
    color: #a1adb4;
  }
  .metadata {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: end;
    margin: 0;
  }
  .metadata div {
    min-width: 100px;
    display: grid;
    gap: 2px;
    padding: 6px 8px;
    border-left: 1px solid #e1e8ec;
  }
  dt {
    color: #87959d;
    font-size: 7.5px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  dd {
    margin: 0;
    color: #456173;
    font-size: 9.5px;
    font-weight: 700;
  }
  .object-tabs {
    display: flex;
    gap: 2px;
    overflow-x: auto;
    padding: 0 10px;
    border-top: 1px solid #e2e8ec;
    background: #fbfcfd;
  }
  .object-tabs a {
    min-height: 38px;
    display: inline-flex;
    gap: 5px;
    align-items: center;
    padding: 0 9px;
    border-bottom: 2px solid transparent;
    color: #607887;
    font-size: 9.5px;
    font-weight: 750;
    text-decoration: none;
    white-space: nowrap;
  }
  .object-tabs a:hover {
    color: #285a76;
  }
  .object-tabs a.active {
    border-bottom-color: var(--blue-700);
    color: #225b7b;
  }
  .object-tabs small {
    min-width: 18px;
    padding: 2px 4px;
    border-radius: 999px;
    background: #e9eff2;
    color: #6d7f89;
    font-size: 7px;
    text-align: center;
  }
  @media (max-width: 800px) {
    .object-identity {
      display: grid;
      gap: 12px;
    }
    .metadata {
      justify-content: start;
    }
  }
</style>
