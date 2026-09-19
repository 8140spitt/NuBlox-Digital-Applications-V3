<script lang="ts">
  type CollectionValue = string | number | null | undefined;

  type CollectionColumn = {
    key: string;
    label: string;
    sortable?: boolean;
    align?: 'start' | 'end';
    width?: string;
  };

  type CollectionRow = {
    id: string;
    href?: string | null;
    ariaLabel?: string | null;
    searchText?: string | null;
    values: Record<string, CollectionValue>;
  };

  let {
    title,
    eyebrow = 'Collection',
    rows = [],
    columns = [],
    emptyText = 'No records in this view.',
    searchPlaceholder = 'Search this view'
  }: {
    title: string;
    eyebrow?: string;
    rows?: CollectionRow[];
    columns?: CollectionColumn[];
    emptyText?: string;
    searchPlaceholder?: string;
  } = $props();

  let query = $state('');
  let sortKey = $state<string | null>(null);
  let sortDirection = $state<'asc' | 'desc'>('asc');

  const visibleRows = $derived.by(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? rows.filter((row) => {
          const haystack =
            row.searchText ??
            Object.values(row.values)
              .filter((value) => value !== null && value !== undefined)
              .join(' ');
          return haystack.toLowerCase().includes(needle);
        })
      : rows;

    if (!sortKey) return filtered;

    return [...filtered].sort((left, right) => {
      const a = String(left.values[sortKey] ?? '');
      const b = String(right.values[sortKey] ?? '');
      const result = a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? result : -result;
    });
  });

  function sort(column: CollectionColumn) {
    if (!column.sortable) return;
    if (sortKey === column.key) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      return;
    }
    sortKey = column.key;
    sortDirection = 'asc';
  }

  function ariaSort(column: CollectionColumn) {
    if (sortKey !== column.key) return 'none';
    return sortDirection === 'asc' ? 'ascending' : 'descending';
  }

  function display(value: CollectionValue) {
    if (value === null || value === undefined || value === '') return '—';
    return String(value);
  }
</script>

<section class="collection-view" aria-label={title}>
  <header class="collection-heading">
    <div>
      <span class="eyebrow">{eyebrow}</span>
      <div class="title-row">
        <h2>{title}</h2>
        <span class="count">{visibleRows.length}</span>
      </div>
    </div>

    <label class="search">
      <span class="sr-only">Search {title}</span>
      <span aria-hidden="true">⌕</span>
      <input bind:value={query} placeholder={searchPlaceholder} />
      {#if query}
        <button type="button" onclick={() => (query = '')} aria-label="Clear collection search">×</button>
      {/if}
    </label>
  </header>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          {#each columns as column}
            <th
              scope="col"
              style:width={column.width}
              class:end={column.align === 'end'}
              aria-sort={column.sortable ? ariaSort(column) : undefined}
            >
              {#if column.sortable}
                <button type="button" onclick={() => sort(column)}>
                  <span>{column.label}</span>
                  {#if sortKey === column.key}
                    <span aria-hidden="true">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  {/if}
                </button>
              {:else}
                {column.label}
              {/if}
            </th>
          {/each}
          <th class="open-column" scope="col"><span class="sr-only">Open record</span></th>
        </tr>
      </thead>
      <tbody>
        {#each visibleRows as row}
          <tr>
            {#each columns as column, index}
              <td class:end={column.align === 'end'}>
                {#if index === 0 && row.href}
                  <a href={row.href} aria-label={row.ariaLabel ?? undefined}>
                    {display(row.values[column.key])}
                  </a>
                {:else}
                  {display(row.values[column.key])}
                {/if}
              </td>
            {/each}
            <td class="open-column">
              {#if row.href}
                <a class="open" href={row.href} aria-label={row.ariaLabel ?? 'Open record'}>→</a>
              {/if}
            </td>
          </tr>
        {:else}
          <tr>
            <td class="empty" colspan={Math.max(columns.length + 1, 1)}>
              {query ? 'No records match this search.' : emptyText}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>

<style>
  .collection-view {
    min-width: 0;
    display: grid;
    gap: 9px;
  }

  .collection-heading {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: end;
  }

  .eyebrow {
    color: #728794;
    font-size: 8px;
    font-weight: 850;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  .title-row {
    display: flex;
    gap: 7px;
    align-items: center;
    margin-top: 2px;
  }

  h2 {
    margin: 0;
    color: #36566a;
    font-size: 13px;
  }

  .count {
    min-width: 21px;
    padding: 2px 5px;
    border-radius: 999px;
    background: #edf3f6;
    color: #647b89;
    font-size: 7.5px;
    font-weight: 850;
    text-align: center;
  }

  .search {
    min-width: min(210px, 42%);
    min-height: 30px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 5px;
    align-items: center;
    border: 1px solid #d4dfe5;
    border-radius: 7px;
    padding: 0 7px;
    background: white;
    color: #78909e;
  }

  .search input {
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: #405d70;
    font-size: 9px;
  }

  .search button {
    border: 0;
    background: transparent;
    color: #748995;
    cursor: pointer;
  }

  .table-wrap {
    min-width: 0;
    overflow: auto;
    border: 1px solid #e0e7eb;
    border-radius: 7px;
    background: white;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9px;
  }

  th,
  td {
    padding: 7px 8px;
    border-bottom: 1px solid #e8edf0;
    color: #536b7b;
    text-align: left;
    vertical-align: middle;
    white-space: nowrap;
  }

  th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: #f8fafb;
    color: #748793;
    font-size: 7.5px;
    font-weight: 850;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  th button {
    width: 100%;
    display: inline-flex;
    gap: 4px;
    align-items: center;
    border: 0;
    padding: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-transform: inherit;
    cursor: pointer;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  tbody tr:hover td {
    background: #f8fbfc;
  }

  td a {
    color: #285f7f;
    font-weight: 800;
    text-decoration: none;
  }

  td a:hover {
    text-decoration: underline;
  }

  .end {
    text-align: right;
  }

  .open-column {
    width: 28px;
    padding-inline: 5px;
    text-align: center;
  }

  .open {
    display: inline-grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 5px;
    color: #557286;
    text-decoration: none;
  }

  .open:hover {
    background: #eaf4f9;
    text-decoration: none;
  }

  .empty {
    padding: 18px 10px;
    color: #7c8d97;
    text-align: center;
    white-space: normal;
  }

  @media (max-width: 720px) {
    .collection-heading {
      align-items: stretch;
      flex-direction: column;
    }

    .search {
      width: 100%;
      min-width: 0;
    }
  }
</style>
