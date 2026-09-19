<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import {
    clearEnterpriseContextHref,
    decodeEnterpriseContextSelection,
    encodeEnterpriseContextSelection,
    enterpriseContextItems,
    patchEnterpriseContextHref,
    resolveEnterpriseRuntimeContext,
    type EnterpriseContextDimensionKey,
    type EnterpriseContextSelection
  } from '$lib/enterprise/enterprise-context';

  type LegalEntityOption = EnterpriseContextSelection;
  type OrganisationUnitOption = EnterpriseContextSelection & {
    legalEntityId: string | null;
  };

  let {
    tenantSlug,
    legalEntities = [],
    organisationUnits = []
  }: {
    tenantSlug: string;
    legalEntities?: LegalEntityOption[];
    organisationUnits?: OrganisationUnitOption[];
  } = $props();

  const runtimeContext = $derived(resolveEnterpriseRuntimeContext(page.url, tenantSlug));
  const activeItems = $derived(enterpriseContextItems(runtimeContext.dimensions));
  const hasSelectableContext = $derived(legalEntities.length > 0 || organisationUnits.length > 0);

  function display(selection: EnterpriseContextSelection) {
    if (selection.reference && selection.label && selection.reference !== selection.label) {
      return selection.reference + ' · ' + selection.label;
    }
    return selection.reference ?? selection.label ?? selection.id;
  }

  function currentValue(key: EnterpriseContextDimensionKey) {
    const selection = runtimeContext.dimensions[key];
    return selection ? encodeEnterpriseContextSelection(selection) : '';
  }

  async function selectLegalEntity(event: Event) {
    const value = (event.currentTarget as HTMLSelectElement).value;
    const selection = decodeEnterpriseContextSelection(value);
    const patch: Partial<Record<EnterpriseContextDimensionKey, EnterpriseContextSelection | null>> =
      { legalEntity: selection };

    const currentUnit = runtimeContext.dimensions.organisationUnit;
    if (currentUnit) {
      const unit = organisationUnits.find((option) => option.id === currentUnit.id);
      if (!selection || (unit?.legalEntityId && unit.legalEntityId !== selection.id)) {
        patch.organisationUnit = null;
      }
    }

    await goto(patchEnterpriseContextHref(page.url, patch), {
      keepFocus: true,
      noScroll: true
    });
  }

  async function selectOrganisationUnit(event: Event) {
    const value = (event.currentTarget as HTMLSelectElement).value;
    const selection = decodeEnterpriseContextSelection(value);
    const patch: Partial<Record<EnterpriseContextDimensionKey, EnterpriseContextSelection | null>> =
      { organisationUnit: selection };

    if (selection) {
      const option = organisationUnits.find((item) => item.id === selection.id);
      if (option?.legalEntityId) {
        const legalEntity = legalEntities.find((item) => item.id === option.legalEntityId);
        if (legalEntity) patch.legalEntity = legalEntity;
      }
    }

    await goto(patchEnterpriseContextHref(page.url, patch), {
      keepFocus: true,
      noScroll: true
    });
  }
</script>

<div class="context-bar" aria-label="Enterprise context">
  <div class="context-path">
    <span class="context-label">Context</span>
    {#if activeItems.length}
      {#each activeItems as item, index}
        {#if index > 0}<span class="separator" aria-hidden="true">›</span>{/if}
        <span
          class="context-item"
          title={item.selection.label ?? item.selection.reference ?? item.selection.id}
        >
          <small>{item.label}</small>
          <strong>{item.selection.reference ?? item.selection.label ?? item.selection.id}</strong>
        </span>
      {/each}
    {:else}
      <span class="enterprise-wide">Enterprise-wide</span>
    {/if}
  </div>

  <div class="context-actions">
    {#if hasSelectableContext}
      <details class="selector">
        <summary>{activeItems.length ? 'Change context' : 'Set context'}</summary>
        <div class="selector-panel">
          <div class="selector-heading">
            <strong>Enterprise context</strong>
            <span>Context filters work. It does not change canonical ownership.</span>
          </div>

          {#if legalEntities.length}
            <label>
              <span>Legal entity</span>
              <select value={currentValue('legalEntity')} onchange={selectLegalEntity}>
                <option value="">Enterprise-wide</option>
                {#each legalEntities as option}
                  <option value={encodeEnterpriseContextSelection(option)}>{display(option)}</option
                  >
                {/each}
              </select>
            </label>
          {/if}

          {#if organisationUnits.length}
            <label>
              <span>Organisation unit</span>
              <select value={currentValue('organisationUnit')} onchange={selectOrganisationUnit}>
                <option value="">All organisation units</option>
                {#each organisationUnits as option}
                  <option value={encodeEnterpriseContextSelection(option)}>{display(option)}</option
                  >
                {/each}
              </select>
            </label>
          {/if}

          {#if activeItems.length}
            <a
              class="clear"
              data-nublox-context="clear"
              href={clearEnterpriseContextHref(page.url)}
            >
              Clear enterprise context
            </a>
          {/if}
        </div>
      </details>
    {:else if activeItems.length}
      <a
        class="clear-inline"
        data-nublox-context="clear"
        href={clearEnterpriseContextHref(page.url)}
      >
        Clear
      </a>
    {/if}
  </div>
</div>

<style>
  .context-bar {
    position: sticky;
    top: 58px;
    z-index: 45;
    min-height: 36px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    padding: 4px 14px 4px 15px;
    border-bottom: 1px solid #d7e2e8;
    background: rgba(249, 251, 252, 0.98);
    color: #536d7d;
    box-shadow: 0 2px 8px rgba(20, 48, 66, 0.04);
    backdrop-filter: blur(8px);
  }

  .context-path {
    min-width: 0;
    display: flex;
    gap: 7px;
    align-items: center;
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .context-label {
    flex: 0 0 auto;
    color: #7d8d97;
    font-size: 8px;
    font-weight: 850;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .separator {
    color: #a4b0b7;
    font-size: 10px;
  }

  .context-item {
    min-width: 0;
    display: flex;
    gap: 5px;
    align-items: baseline;
    white-space: nowrap;
  }

  .context-item small {
    color: #8998a1;
    font-size: 7.5px;
    font-weight: 700;
  }

  .context-item strong,
  .enterprise-wide {
    color: #405f72;
    font-size: 9.5px;
    font-weight: 800;
  }

  .context-actions {
    flex: 0 0 auto;
  }

  .selector {
    position: relative;
  }

  .selector > summary,
  .clear-inline {
    list-style: none;
    border-radius: 6px;
    padding: 5px 8px;
    color: #315f7c;
    font-size: 8.5px;
    font-weight: 800;
    text-decoration: none;
    cursor: pointer;
  }

  .selector > summary::-webkit-details-marker {
    display: none;
  }

  .selector > summary:hover,
  .clear-inline:hover {
    background: #eaf3f8;
  }

  .selector-panel {
    position: absolute;
    top: calc(100% + 7px);
    right: 0;
    width: 330px;
    display: grid;
    gap: 10px;
    padding: 12px;
    border: 1px solid #cbd9e1;
    border-radius: 10px;
    background: white;
    box-shadow: 0 14px 36px rgba(8, 38, 58, 0.18);
  }

  .selector-heading {
    display: grid;
    gap: 2px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e6ebee;
  }

  .selector-heading strong {
    color: #36566a;
    font-size: 10.5px;
  }

  .selector-heading span {
    color: #7d8d97;
    font-size: 8.5px;
    line-height: 1.35;
  }

  label {
    display: grid;
    gap: 4px;
  }

  label > span {
    color: #687f8d;
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
  }

  select {
    width: 100%;
    min-height: 34px;
    border: 1px solid #cfdbe2;
    border-radius: 7px;
    padding: 0 8px;
    background: white;
    color: #3d596c;
    font-size: 10px;
  }

  .clear {
    width: max-content;
    color: #7b4a4a;
    font-size: 8.5px;
    font-weight: 800;
    text-decoration: none;
  }

  .clear:hover {
    text-decoration: underline;
  }

  @media (max-width: 760px) {
    .context-bar {
      position: static;
      min-height: 34px;
      padding-inline: 10px;
    }

    .context-item small {
      display: none;
    }

    .selector-panel {
      position: fixed;
      top: 102px;
      right: 10px;
      left: 10px;
      width: auto;
    }
  }
</style>
