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

  type SavedViewOption = {
    id: string;
    name: string;
    definition: Record<string, unknown>;
    isDefault?: boolean;
    isPinned?: boolean;
  };

  let {
    title,
    eyebrow = 'Collection',
    rows = [],
    columns = [],
    emptyText = 'No records in this view.',
    searchPlaceholder = 'Search this view',
    savedViews = [],
    saveViewAction = null,
    deleteViewAction = null
  }: {
    title: string;
    eyebrow?: string;
    rows?: CollectionRow[];
    columns?: CollectionColumn[];
    emptyText?: string;
    searchPlaceholder?: string;
    savedViews?: SavedViewOption[];
    saveViewAction?: string | null;
    deleteViewAction?: string | null;
  } = $props();

  let query = $state('');
  let sortKey = $state<string | null>(null);
  let sortDirection = $state<'asc' | 'desc'>('asc');
  let selectedViewId = $state('');
  let defaultViewInitialised = $state(false);

  const selectedView = $derived(savedViews.find((view) => view.id === selectedViewId) ?? null);

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

    const activeSortKey = sortKey;
    if (!activeSortKey) return filtered;

    return [...filtered].sort((left, right) => {
      const a = String(left.values[activeSortKey] ?? '');
      const b = String(right.values[activeSortKey] ?? '');
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

  function applyView(view: SavedViewOption) {
    const nextQuery = view.definition.query;
    const nextSortKey = view.definition.sortKey;
    const nextSortDirection = view.definition.sortDirection;

    query = typeof nextQuery === 'string' ? nextQuery : '';
    sortKey =
      typeof nextSortKey === 'string' && columns.some((column) => column.key === nextSortKey)
        ? nextSortKey
        : null;
    sortDirection = nextSortDirection === 'desc' ? 'desc' : 'asc';
  }

  function applySavedView(event: Event) {
    selectedViewId = (event.currentTarget as HTMLSelectElement).value;
    const view = savedViews.find((item) => item.id === selectedViewId);
    if (view) applyView(view);
  }

  $effect(() => {
    if (selectedViewId && !savedViews.some((view) => view.id === selectedViewId)) {
      selectedViewId = '';
    }
    if (defaultViewInitialised) return;
    defaultViewInitialised = true;
    const defaultView = savedViews.find((view) => view.isDefault);
    if (defaultView) {
      selectedViewId = defaultView.id;
      applyView(defaultView);
    }
  });

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
        <button type="button" onclick={() => (query = '')} aria-label="Clear collection search">
          ×
        </button>
      {/if}
    </label>
  </header>

  {#if savedViews.length || saveViewAction}
    <div class="view-tools">
      <label class="saved-selector">
        <span>Saved view</span>
        <select value={selectedViewId} onchange={applySavedView}>
          <option value="">Current view</option>
          {#each savedViews as view}
            <option value={view.id}>
              {view.name}{view.isDefault ? ' · default' : ''}{view.isPinned ? ' · pinned' : ''}
            </option>
          {/each}
        </select>
      </label>

      <div class="view-actions">
        {#if saveViewAction}
          <details>
            <summary>Save view</summary>
            <form method="POST" action={saveViewAction}>
              <label>
                <span>View name</span>
                <input type="text" name="viewName" required maxlength="191" />
              </label>
              <input type="hidden" name="query" value={query} />
              <input type="hidden" name="sortKey" value={sortKey ?? ''} />
              <input type="hidden" name="sortDirection" value={sortDirection} />
              <input
                type="hidden"
                name="columns"
                value={columns.map((column) => column.key).join(',')}
              />
              <label class="check">
                <input type="checkbox" name="isPinned" />
                <span>Pin this view</span>
              </label>
              <label class="check">
                <input type="checkbox" name="isDefault" />
                <span>Make default</span>
              </label>
              <button type="submit">Save personal view</button>
            </form>
          </details>
        {/if}

        {#if deleteViewAction && selectedView}
          <form method="POST" action={deleteViewAction}>
            <input type="hidden" name="viewId" value={selectedView.id} />
            <button class="delete-view" type="submit">Delete view</button>
          </form>
        {/if}
      </div>
    </div>
  {/if}

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

  .collection-heading,
  .view-tools {
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

  .view-tools {
    align-items: center;
    min-height: 34px;
    padding: 5px 7px;
    border: 1px solid #e1e7eb;
    border-radius: 7px;
    background: #fafcfd;
  }

  .saved-selector {
    display: flex;
    gap: 6px;
    align-items: center;
    color: #738793;
    font-size: 8px;
    font-weight: 800;
  }

  .saved-selector select {
    max-width: 190px;
    min-height: 27px;
    border: 1px solid #d3dfe5;
    border-radius: 6px;
    padding: 0 6px;
    background: white;
    color: #4e6879;
    font-size: 8.5px;
  }

  .view-actions {
    display: flex;
    gap: 5px;
    align-items: center;
  }

  .view-actions details {
    position: relative;
  }

  .view-actions summary,
  .delete-view {
    list-style: none;
    border: 1px solid #d3dfe5;
    border-radius: 6px;
    padding: 5px 7px;
    background: white;
    color: #4e6879;
    font-size: 8px;
    font-weight: 800;
    cursor: pointer;
  }

  .view-actions summary::-webkit-details-marker {
    display: none;
  }

  .view-actions details form {
    position: absolute;
    top: calc(100% + 5px);
    right: 0;
    z-index: 5;
    width: 230px;
    display: grid;
    gap: 8px;
    padding: 10px;
    border: 1px solid #cbd9e1;
    border-radius: 8px;
    background: white;
    box-shadow: 0 12px 30px rgba(8, 38, 58, 0.16);
  }

  .view-actions details form > label:not(.check) {
    display: grid;
    gap: 4px;
    color: #687f8d;
    font-size: 8px;
    font-weight: 800;
  }

  .view-actions details input[type='text'],
  .view-actions details input:not([type]) {
    min-height: 30px;
    border: 1px solid #cfdbe2;
    border-radius: 6px;
    padding: 0 7px;
    font-size: 9px;
  }

  .check {
    display: flex;
    gap: 6px;
    align-items: center;
    color: #617987;
    font-size: 8.5px;
  }

  .view-actions details form > button {
    min-height: 30px;
    border: 0;
    border-radius: 6px;
    background: var(--blue-700);
    color: white;
    font-size: 8.5px;
    font-weight: 800;
    cursor: pointer;
  }

  .delete-view {
    color: #824949;
  }

  .view-actions > form {
    margin: 0;
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
    .collection-heading,
    .view-tools {
      align-items: stretch;
      flex-direction: column;
    }

    .search {
      width: 100%;
      min-width: 0;
    }

    .view-actions {
      justify-content: end;
    }
  }
</style>
