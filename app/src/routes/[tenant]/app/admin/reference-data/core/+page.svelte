<script lang="ts">
  let { data, form } = $props();

  const kind = $derived(
    ['jurisdiction', 'currency', 'uom', 'tax', 'contract', 'calendar'].includes(data.kind)
      ? data.kind
      : 'jurisdiction'
  );

  const tabs = [
    ['jurisdiction', 'Jurisdictions'],
    ['currency', 'Currencies'],
    ['uom', 'Units'],
    ['tax', 'Tax regimes'],
    ['contract', 'Contract forms'],
    ['calendar', 'Calendars']
  ] as const;

  function tabHref(nextKind: string, calendarId?: string) {
    const params = new URLSearchParams({ kind: nextKind });
    if (calendarId) params.set('calendar', calendarId);
    return `/${data.tenantSlug}/app/admin/reference-data/core?${params.toString()}`;
  }

  function jurisdictionName(id: string | null) {
    return data.jurisdictions.find((row) => row.id === id)?.name ?? '—';
  }

  function baseUnitCode(id: string | null) {
    return data.units.find((row) => row.id === id)?.unitCode ?? 'Base';
  }
</script>

<svelte:head>
  <title>Enterprise Reference Data · NuBlox</title>
</svelte:head>

<div class="reference-core">
  <header class="hero section-card">
    <div>
      <span class="eyebrow">Reference stewardship · AGG-29-REFERENCE-DATA</span>
      <h1>Enterprise reference data</h1>
      <p>
        Shared governed semantics for legal scope, money, measurement, tax, contract forms and
        working time. Reference data defines meaning; it never becomes transactional truth.
      </p>
    </div>
    <div class="principle">
      <strong>One reference truth</strong>
      <span>Versioned · effective · auditable · reusable</span>
      <small
        >Historical transactions retain the exact code or version needed to interpret original
        meaning.</small
      >
    </div>
  </header>

  {#if form?.message}
    <div class="message" role="alert">{form.message}</div>
  {/if}

  <nav class="tabs" aria-label="Reference data categories">
    {#each tabs as tab}
      <a class:active={kind === tab[0]} href={tabHref(tab[0])}>{tab[1]}</a>
    {/each}
  </nav>

  {#if kind === 'jurisdiction'}
    <section class="section-card panel">
      <div class="panel-heading">
        <div>
          <span class="eyebrow">REF-JURISDICTION</span>
          <h2>{data.jurisdictions.length} jurisdictions</h2>
        </div>
        {#if data.capabilities.canManage}
          <details class="command">
            <summary>Add jurisdiction</summary>
            <form method="POST" action="?/createJurisdiction">
              <label>Key<input name="jurisdictionKey" required placeholder="GB-SCT" /></label>
              <label>Name<input name="name" required placeholder="Scotland" /></label>
              <label
                >Country/region code<input name="countryRegionCode" placeholder="GB-SCT" /></label
              >
              <label
                >Parent<select name="parentJurisdictionId"
                  ><option value="">None</option>{#each data.jurisdictions as row}<option
                      value={row.id}>{row.name}</option
                    >{/each}</select
                ></label
              >
              <label>Authority context<textarea name="authorityContext" rows="2"></textarea></label>
              <button type="submit">Create jurisdiction</button>
            </form>
          </details>
        {/if}
      </div>
      <div class="table-wrap">
        <table>
          <thead
            ><tr><th>Key</th><th>Name</th><th>Region</th><th>Parent</th><th>Status</th></tr></thead
          ><tbody>
            {#each data.jurisdictions as row}<tr
                ><td><strong>{row.jurisdictionKey}</strong></td><td>{row.name}</td><td
                  >{row.countryRegionCode || '—'}</td
                ><td>{jurisdictionName(row.parentJurisdictionId)}</td><td>{row.status}</td></tr
              >
            {:else}<tr><td class="empty" colspan="5">No jurisdictions configured.</td></tr>{/each}
          </tbody>
        </table>
      </div>
    </section>
  {:else if kind === 'currency'}
    <section class="section-card panel">
      <div class="panel-heading">
        <div>
          <span class="eyebrow">REF-CURRENCY</span>
          <h2>{data.currencies.length} currencies</h2>
        </div>
        {#if data.capabilities.canManage}
          <details class="command">
            <summary>Add currency</summary>
            <form method="POST" action="?/createCurrency">
              <label
                >ISO code<input name="isoCode" required maxlength="3" placeholder="GBP" /></label
              >
              <label>Name<input name="name" required placeholder="Pound sterling" /></label>
              <label
                >Minor units<input
                  name="minorUnits"
                  type="number"
                  min="0"
                  max="6"
                  value="2"
                  required
                /></label
              >
              <button type="submit">Create currency</button>
            </form>
          </details>
        {/if}
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Code</th><th>Name</th><th>Minor units</th><th>Status</th></tr></thead
          ><tbody>
            {#each data.currencies as row}<tr
                ><td><strong>{row.isoCode}</strong></td><td>{row.name}</td><td>{row.minorUnits}</td
                ><td>{row.status}</td></tr
              >
            {:else}<tr><td class="empty" colspan="4">No currencies configured.</td></tr>{/each}
          </tbody>
        </table>
      </div>
    </section>
  {:else if kind === 'uom'}
    <section class="section-card panel">
      <div class="panel-heading">
        <div>
          <span class="eyebrow">REF-UOM</span>
          <h2>{data.units.length} units of measure</h2>
        </div>
        {#if data.capabilities.canManage}
          <details class="command">
            <summary>Add unit</summary>
            <form method="POST" action="?/createUom">
              <label>Code<input name="unitCode" required placeholder="MM" /></label>
              <label>Symbol<input name="symbol" required placeholder="mm" /></label>
              <label>Name<input name="name" required placeholder="millimetre" /></label>
              <label>Dimension<input name="dimensionKey" required placeholder="LENGTH" /></label>
              <label
                >Base unit<select name="baseUnitId"
                  ><option value="">This is a base unit</option>{#each data.units as row}<option
                      value={row.id}>{row.unitCode} · {row.name}</option
                    >{/each}</select
                ></label
              >
              <div class="form-grid">
                <label
                  >Multiplier<input
                    name="conversionMultiplier"
                    type="number"
                    step="any"
                    value="1"
                  /></label
                ><label
                  >Offset<input name="conversionOffset" type="number" step="any" value="0" /></label
                >
              </div>
              <button type="submit">Create unit</button>
            </form>
          </details>
        {/if}
      </div>
      <div class="table-wrap">
        <table>
          <thead
            ><tr><th>Code</th><th>Name</th><th>Dimension</th><th>Base</th><th>Conversion</th></tr
            ></thead
          ><tbody>
            {#each data.units as row}<tr
                ><td><strong>{row.unitCode}</strong> · {row.symbol}</td><td>{row.name}</td><td
                  >{row.dimensionKey}</td
                ><td>{baseUnitCode(row.baseUnitId)}</td><td
                  >× {Number(row.conversionMultiplier)} + {Number(row.conversionOffset)}</td
                ></tr
              >
            {:else}<tr><td class="empty" colspan="5">No units configured.</td></tr>{/each}
          </tbody>
        </table>
      </div>
    </section>
  {:else if kind === 'tax'}
    <section class="section-card panel">
      <div class="panel-heading">
        <div>
          <span class="eyebrow">REF-TAX-REGIME</span>
          <h2>{data.taxRegimes.length} tax regimes</h2>
        </div>
        {#if data.capabilities.canManage}
          <details class="command">
            <summary>Add tax regime</summary>
            <form method="POST" action="?/createTax">
              <label>Regime key<input name="regimeKey" required placeholder="UK.VAT" /></label>
              <label>Name<input name="name" required placeholder="United Kingdom VAT" /></label>
              <label>Tax type<input name="taxType" required placeholder="VAT" /></label>
              <label
                >Jurisdiction<select name="jurisdictionId" required
                  ><option value="">Select jurisdiction</option
                  >{#each data.jurisdictions as row}<option value={row.id}>{row.name}</option
                    >{/each}</select
                ></label
              >
              <label>Authority<input name="authorityName" placeholder="HMRC" /></label>
              <button type="submit">Create tax regime</button>
            </form>
          </details>
        {/if}
      </div>
      <div class="table-wrap">
        <table>
          <thead
            ><tr><th>Key</th><th>Name</th><th>Type</th><th>Jurisdiction</th><th>Authority</th></tr
            ></thead
          ><tbody>
            {#each data.taxRegimes as row}<tr
                ><td><strong>{row.regimeKey}</strong></td><td>{row.name}</td><td>{row.taxType}</td
                ><td>{jurisdictionName(row.jurisdictionId)}</td><td>{row.authorityName || '—'}</td
                ></tr
              >
            {:else}<tr><td class="empty" colspan="5">No tax regimes configured.</td></tr>{/each}
          </tbody>
        </table>
      </div>
    </section>
  {:else if kind === 'contract'}
    <section class="section-card panel">
      <div class="panel-heading">
        <div>
          <span class="eyebrow">REF-CONTRACT-FORM-FAMILY</span>
          <h2>{data.contractFamilies.length} contract families</h2>
        </div>
        {#if data.capabilities.canManage}
          <details class="command">
            <summary>Add contract family</summary>
            <form method="POST" action="?/createContract">
              <label>Family key<input name="familyKey" required placeholder="NEC4.ECC" /></label>
              <label
                >Name<input
                  name="name"
                  required
                  placeholder="NEC4 Engineering and Construction Contract"
                /></label
              >
              <label>Publisher/body<input name="publisherBody" placeholder="NEC" /></label>
              <label>Edition family<input name="editionFamily" placeholder="NEC4" /></label>
              <label
                >Jurisdiction<select name="jurisdictionId"
                  ><option value="">Not restricted</option>{#each data.jurisdictions as row}<option
                      value={row.id}>{row.name}</option
                    >{/each}</select
                ></label
              >
              <button type="submit">Create contract family</button>
            </form>
          </details>
        {/if}
      </div>
      <div class="table-wrap">
        <table>
          <thead
            ><tr
              ><th>Key</th><th>Name</th><th>Publisher</th><th>Edition</th><th>Jurisdiction</th></tr
            ></thead
          ><tbody>
            {#each data.contractFamilies as row}<tr
                ><td><strong>{row.familyKey}</strong></td><td>{row.name}</td><td
                  >{row.publisherBody || '—'}</td
                ><td>{row.editionFamily || '—'}</td><td>{jurisdictionName(row.jurisdictionId)}</td
                ></tr
              >
            {:else}<tr><td class="empty" colspan="5">No contract form families configured.</td></tr
              >{/each}
          </tbody>
        </table>
      </div>
    </section>
  {:else}
    <section class="section-card panel">
      <div class="panel-heading">
        <div>
          <span class="eyebrow">REF-CALENDAR</span>
          <h2>{data.calendars.length} working calendars</h2>
        </div>
        {#if data.capabilities.canManage}
          <details class="command">
            <summary>Add calendar</summary>
            <form method="POST" action="?/createCalendar">
              <label
                >Calendar key<input
                  name="calendarKey"
                  required
                  placeholder="UK.STANDARD.WORKING"
                /></label
              >
              <label
                >Name<input
                  name="name"
                  required
                  placeholder="UK Standard Working Calendar"
                /></label
              >
              <label>Timezone<input name="timezoneName" required value="Europe/London" /></label>
              <label>
                Working pattern JSON
                <textarea name="workingPattern" rows="6" required></textarea>
                <small>Example: Monday–Friday arrays of HH:MM start/end pairs.</small>
              </label>
              <label
                >Holidays JSON<textarea name="holidays" rows="3" placeholder="[]"></textarea></label
              >
              <label
                >Exceptions JSON<textarea name="exceptions" rows="3" placeholder="[]"
                ></textarea></label
              >
              <button type="submit">Create draft calendar</button>
            </form>
          </details>
        {/if}
      </div>

      <div class="calendar-grid">
        <nav class="calendar-list">
          {#each data.calendars as row}
            <a
              class:active={data.selectedCalendar?.id === row.id}
              href={tabHref('calendar', row.id)}
            >
              <strong>{row.name}</strong><span>{row.calendarKey}</span><small
                >aggregate v{row.version}</small
              >
            </a>
          {:else}<p class="empty-copy">No calendars configured.</p>{/each}
        </nav>

        {#if data.selectedCalendar}
          <div class="versions">
            <div class="facts">
              <span><small>Calendar</small><strong>{data.selectedCalendar.name}</strong></span><span
                ><small>Versions</small><strong>{data.calendarVersions.length}</strong></span
              >
            </div>
            {#each data.calendarVersions as version}
              <article>
                <div>
                  <strong>v{version.versionNo}</strong><span
                    class:published={version.status === 'PUBLISHED'}>{version.status}</span
                  >
                </div>
                <p>{version.timezoneName}</p>
                {#if version.status === 'DRAFT' && data.capabilities.canPublish}
                  <form method="POST" action="?/publishCalendar">
                    <input type="hidden" name="calendarId" value={data.selectedCalendar.id} />
                    <input type="hidden" name="versionId" value={version.id} />
                    <input
                      type="hidden"
                      name="calendarVersion"
                      value={data.selectedCalendar.version}
                    />
                    <button type="submit">Publish immutable version</button>
                  </form>
                {/if}
              </article>
            {/each}
          </div>
        {/if}
      </div>
    </section>
  {/if}
</div>

<style>
  .reference-core {
    display: grid;
    gap: 12px;
  }
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(290px, 0.65fr);
    gap: 24px;
    padding: 18px;
    border-color: #8fc9ee;
    background: linear-gradient(120deg, #fbfdff, #eaf6fd);
  }
  .eyebrow {
    color: var(--blue-700);
    font-size: 10px;
    font-weight: 850;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }
  h1 {
    margin: 3px 0 6px;
    font-size: 25px;
  }
  h2 {
    margin: 2px 0 0;
    font-size: 16px;
  }
  p {
    color: #5f7484;
    font-size: 10px;
    line-height: 1.45;
  }
  .hero p {
    margin: 0;
    max-width: 760px;
    font-size: 11.5px;
  }
  .principle {
    display: grid;
    gap: 5px;
    padding: 12px;
    border: 1px solid #bddded;
    border-radius: 9px;
    background: white;
  }
  .principle strong {
    color: #315d76;
    font-size: 11px;
  }
  .principle span {
    color: #526d7d;
    font-size: 9.5px;
  }
  .principle small {
    color: #7b8e9a;
    font-size: 8.5px;
  }
  .message {
    padding: 9px 12px;
    border: 1px solid #dd8a8a;
    border-radius: 8px;
    background: #fff3f3;
    color: #792f2f;
    font-size: 11px;
  }
  .tabs {
    display: flex;
    gap: 5px;
    overflow-x: auto;
  }
  .tabs a {
    min-width: max-content;
    padding: 7px 10px;
    border: 1px solid #dce5ea;
    border-radius: 7px;
    background: white;
    color: #617584;
    font-size: 9.5px;
    font-weight: 800;
    text-decoration: none;
  }
  .tabs a.active {
    border-color: #79bde2;
    background: #edf8fe;
    color: #245876;
  }
  .panel {
    padding: 14px;
  }
  .panel-heading {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: start;
    margin-bottom: 10px;
  }
  .command {
    min-width: 240px;
  }
  .command summary {
    width: max-content;
    margin-left: auto;
    padding: 6px 8px;
    border-radius: 6px;
    background: #edf5fa;
    color: #35617d;
    font-size: 9px;
    font-weight: 800;
    cursor: pointer;
  }
  form {
    display: grid;
    gap: 7px;
    margin-top: 8px;
  }
  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
  }
  label {
    display: grid;
    gap: 4px;
    color: #52697a;
    font-size: 9px;
    font-weight: 750;
  }
  input,
  select,
  textarea {
    width: 100%;
    border: 1px solid #ccd8e0;
    border-radius: 6px;
    padding: 7px 8px;
    background: white;
    color: var(--ink);
    font-size: 9.5px;
  }
  textarea {
    resize: vertical;
    font-family: inherit;
  }
  button {
    border: 0;
    border-radius: 6px;
    padding: 7px 9px;
    background: var(--blue-700);
    color: white;
    font-size: 9px;
    font-weight: 800;
    cursor: pointer;
  }
  .table-wrap {
    overflow-x: auto;
    border: 1px solid #e1e8ec;
    border-radius: 8px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5px;
  }
  th,
  td {
    padding: 7px 8px;
    border-bottom: 1px solid #e8edef;
    text-align: left;
    vertical-align: top;
  }
  th {
    background: #f6f8f9;
    color: #687c8a;
    font-size: 8px;
    text-transform: uppercase;
  }
  td strong {
    color: #315b75;
  }
  .empty {
    padding: 24px;
    color: #81909a;
    text-align: center;
  }
  .calendar-grid {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr);
    gap: 12px;
  }
  .calendar-list {
    display: grid;
    align-content: start;
    gap: 6px;
  }
  .calendar-list a {
    display: grid;
    gap: 3px;
    padding: 9px;
    border: 1px solid #e0e7ec;
    border-radius: 8px;
    background: #fafcfd;
    color: inherit;
    text-decoration: none;
  }
  .calendar-list a.active {
    border-color: #79bde2;
    background: #edf8fe;
  }
  .calendar-list strong {
    font-size: 10.5px;
  }
  .calendar-list span,
  .calendar-list small {
    color: #788a97;
    font-size: 8.5px;
  }
  .versions {
    display: grid;
    gap: 7px;
  }
  .facts {
    display: flex;
    gap: 6px;
  }
  .facts span {
    display: grid;
    gap: 2px;
    min-width: 120px;
    padding: 6px 8px;
    border-radius: 6px;
    background: #f4f7f9;
  }
  .facts small {
    color: #86959f;
    font-size: 7.5px;
    text-transform: uppercase;
  }
  .facts strong {
    color: #405d70;
    font-size: 9px;
  }
  .versions article {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 7px;
    align-items: center;
    padding: 9px;
    border: 1px solid #e1e8ec;
    border-radius: 8px;
  }
  .versions article > div {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .versions article span {
    padding: 2px 5px;
    border-radius: 999px;
    background: #fff3d9;
    color: #805d19;
    font-size: 7.5px;
    font-weight: 850;
  }
  .versions article span.published {
    background: #e6f5e9;
    color: #2b6c39;
  }
  .versions article p {
    margin: 0;
  }
  .empty-copy {
    color: #81909a;
  }
  @media (max-width: 760px) {
    .hero,
    .calendar-grid,
    .form-grid {
      grid-template-columns: 1fr;
    }
    .panel-heading {
      display: grid;
    }
    .command {
      min-width: 0;
    }
    .command summary {
      margin-left: 0;
    }
  }
</style>
