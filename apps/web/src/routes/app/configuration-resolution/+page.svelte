<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  function label(value: string) {
    return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
</script>

<svelte:head>
  <title>Configuration Resolution — NuBlox</title>
</svelte:head>

{#if !data.allowed || !data.projection}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit Configuration Resolution access.</h1>
      <p>NuBlox evaluated <code>platform.configuration_resolution.read</code> in the current tenant scope.</p>
      <p class="permission-reason">{data.reason}</p>
      <div class="permission-actions">
        <a
          class="primary-action permission-back"
          href="/app/request-access?permission=platform.configuration_resolution.read&returnTo=/app/configuration-resolution"
        >
          Request access <span aria-hidden="true">→</span>
        </a>
        <a class="quiet-link" href="/app/configuration">Back to Change &amp; Configuration</a>
      </div>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact">
    <div>
      <p class="app-eyebrow">Configuration control</p>
      <h1>Configuration Resolution</h1>
      <p class="workspace-lede">
        Resolve exact governed Configuration Item versions from a named, versioned and ordered
        resolution definition. Every run retains its inputs, selected criterion, exact result
        version, unresolved items and conflicts.
      </p>
    </div>
  </section>

  {#if form?.message || form?.error}
    <div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
      <strong>{form?.ok ? 'Completed' : 'Action not completed'}</strong>
      <span>{form?.message ?? form?.error}</span>
    </div>
  {/if}

  <section class="architecture-metrics" aria-label="Configuration resolution totals">
    <article>
      <span>Definitions</span>
      <strong>{data.projection.definitions.length}</strong>
      <p>Versioned reusable resolution policies</p>
    </article>
    <article>
      <span>Criteria</span>
      <strong>{data.projection.criteria.length}</strong>
      <p>Ordered deterministic selection rules</p>
    </article>
    <article>
      <span>Runs</span>
      <strong>{data.projection.runs.length}</strong>
      <p>Retained resolution executions</p>
    </article>
    <article>
      <span>Conflicts</span>
      <strong>{data.projection.items.filter((item) => item.status === 'CONFLICT').length}</strong>
      <p>Ambiguous version selections requiring correction</p>
    </article>
  </section>

  {#if !data.canManage || !data.canExecute}
    <section class="workspace-panel">
      <div class="panel-heading">
        <div>
          <p class="app-eyebrow">Separate command authority</p>
          <h2>Administration and execution are independently permissioned</h2>
        </div>
      </div>
      {#if !data.canManage}
        <p>
          Definition changes require <code>platform.configuration_resolution.manage</code>.
          <a href="/app/request-access?permission=platform.configuration_resolution.manage&returnTo=/app/configuration-resolution">
            Request administration access
          </a>.
        </p>
      {/if}
      {#if !data.canExecute}
        <p>
          Resolution runs require <code>platform.configuration_resolution.execute</code>.
          <a href="/app/request-access?permission=platform.configuration_resolution.execute&returnTo=/app/configuration-resolution">
            Request execution access
          </a>.
        </p>
      {/if}
    </section>
  {/if}

  {#if data.canManage || data.canExecute}
    <section class="access-command-grid">
      {#if data.canManage}
        <article>
          <header>
            <span>01</span>
            <div>
              <h2>Create resolution definition</h2>
              <p>Version a reusable configuration-selection policy.</p>
            </div>
          </header>
          <form method="POST" action="?/createDefinition" class="admin-form access-form">
            <label><span>Code</span><input name="code" required maxlength="80" /></label>
            <label><span>Name</span><input name="name" required maxlength="255" /></label>
            <label><span>Version</span><input name="version" type="number" min="1" value="1" required /></label>
            <label class="wide-field"><span>Description</span><textarea name="description" rows="3"></textarea></label>
            <div class="admin-form-split">
              <label><span>Effective from</span><input name="effectiveFrom" type="datetime-local" /></label>
              <label><span>Effective to</span><input name="effectiveTo" type="datetime-local" /></label>
            </div>
            <button type="submit">Create Definition <span>→</span></button>
          </form>
        </article>

        <article>
          <header>
            <span>02</span>
            <div>
              <h2>Add ordered criterion</h2>
              <p>Define exactly how candidate versions may be selected.</p>
            </div>
          </header>
          <form method="POST" action="?/addCriterion" class="admin-form access-form">
            <label>
              <span>Definition</span>
              <select name="definitionId" required>
                <option value="">Select definition</option>
                {#each data.projection.definitions.filter((item) => item.status === 'ACTIVE') as item}
                  <option value={item.id}>{item.code} v{item.version}</option>
                {/each}
              </select>
            </label>
            <label><span>Sequence</span><input name="sequence" type="number" min="0" value="10" required /></label>
            <label>
              <span>Criterion</span>
              <select name="criterionType" required>
                <option value="BASELINE">Baseline</option>
                <option value="EXPLICIT_VERSION">Explicit version</option>
                <option value="EFFECTIVITY">Effectivity</option>
                <option value="LATEST_ESTABLISHED_BASELINE">Latest established baseline</option>
              </select>
            </label>
            <label>
              <span>Mode</span>
              <select name="mandatory">
                <option value="true">Mandatory</option>
                <option value="false">Advisory</option>
              </select>
            </label>
            <label class="wide-field">
              <span>Configuration (JSON object)</span>
              <textarea
                name="configuration"
                rows="3"
                placeholder="Optional criterion-specific configuration"
              ></textarea>
            </label>
            <button type="submit">Add Criterion <span>→</span></button>
          </form>
        </article>
      {/if}

      {#if data.canExecute}
        <article>
          <header>
            <span>03</span>
            <div>
              <h2>Execute resolution</h2>
              <p>Resolve exact versions and retain reproducible evidence.</p>
            </div>
          </header>
          <form method="POST" action="?/execute" class="admin-form access-form">
            <label>
              <span>Definition code</span>
              <select name="definitionCode" required>
                <option value="">Select definition</option>
                {#each data.projection.definitions.filter((item) => item.status === 'ACTIVE') as item}
                  <option value={item.code}>{item.code} v{item.version}</option>
                {/each}
              </select>
            </label>
            <label><span>Context object ID</span><input name="contextObjectId" required /></label>
            <label><span>Baseline ID</span><input name="baselineId" /></label>
            <label><span>Scope type</span><input name="scopeType" placeholder="e.g. PROJECT" /></label>
            <label><span>Scope ID</span><input name="scopeId" /></label>
            <label><span>Evaluated at</span><input name="evaluatedAt" type="datetime-local" /></label>
            <label class="wide-field">
              <span>Configuration Item IDs</span>
              <textarea
                name="configurationItemIds"
                rows="4"
                placeholder="One ID per line or comma-separated. Baseline members are added automatically."
              ></textarea>
            </label>
            <label class="wide-field">
              <span>Explicit versions (JSON object)</span>
              <textarea
                name="explicitVersions"
                rows="3"
                placeholder="Optional map from Configuration Item ID to exact version"
              ></textarea>
            </label>
            <button type="submit">Run Resolution <span>→</span></button>
          </form>
        </article>
      {/if}
    </section>
  {/if}

  <div class="control-workspace-grid">
    <section class="workspace-panel">
      <div class="panel-heading">
        <div><p class="app-eyebrow">Resolution policy</p><h2>Definitions</h2></div>
        <span>{data.projection.definitions.length}</span>
      </div>
      <div class="control-record-list">
        {#if data.projection.definitions.length === 0}
          <p class="control-empty">No Configuration Resolution Definitions exist yet.</p>
        {:else}
          {#each data.projection.definitions as definition}
            <article>
              <header><span>Definition</span><strong>v{definition.version}</strong></header>
              <h3>{definition.code} — {definition.name}</h3>
              <p>{definition.description ?? 'No description.'}</p>
              <footer>
                <span>{data.projection.criteria.filter((criterion) => criterion.definitionId === definition.id).length} criteria</span>
                <span>{definition.status}</span>
              </footer>
            </article>
          {/each}
        {/if}
      </div>
    </section>

    <section class="workspace-panel">
      <div class="panel-heading">
        <div><p class="app-eyebrow">Deterministic order</p><h2>Criteria</h2></div>
        <span>{data.projection.criteria.length}</span>
      </div>
      <div class="access-assignment-list">
        {#if data.projection.criteria.length === 0}
          <p class="control-empty">No resolution criteria exist yet.</p>
        {:else}
          {#each data.projection.criteria as criterion}
            <article>
              <div><span>Definition</span><strong>{criterion.definitionCode}</strong></div>
              <div><span>Sequence</span><strong>{criterion.sequence}</strong></div>
              <div><span>Criterion</span><strong>{label(criterion.criterionType)}</strong></div>
              <div><span>Mode</span><strong>{criterion.mandatory ? 'Mandatory' : 'Advisory'}</strong></div>
            </article>
          {/each}
        {/if}
      </div>
    </section>
  </div>

  <section class="workspace-panel">
    <div class="panel-heading">
      <div><p class="app-eyebrow">Reproducible evidence</p><h2>Resolution runs</h2></div>
      <span>{data.projection.runs.length}</span>
    </div>
    {#if data.projection.runs.length === 0}
      <p class="control-empty">No resolution runs have been recorded.</p>
    {:else}
      <div class="control-record-list">
        {#each data.projection.runs as run}
          {@const runItems = data.projection.items.filter((item) => item.runId === run.id)}
          <article>
            <header><span>{run.definitionCode}</span><strong>{run.status}</strong></header>
            <h3>{run.id}</h3>
            <p>Context {run.contextObjectId} · evaluated {run.evaluatedAt}</p>
            <footer>
              <span>{runItems.filter((item) => item.status === 'RESOLVED').length} resolved</span>
              <span>{runItems.filter((item) => item.status === 'CONFLICT').length} conflicts</span>
              <span>{runItems.filter((item) => item.status === 'UNRESOLVED').length} unresolved</span>
            </footer>
          </article>
        {/each}
      </div>
    {/if}
  </section>

  <section class="workspace-panel">
    <div class="panel-heading">
      <div><p class="app-eyebrow">Exact selected versions</p><h2>Resolution items</h2></div>
      <span>{data.projection.items.length}</span>
    </div>
    {#if data.projection.items.length === 0}
      <p class="control-empty">No item-level resolution evidence exists yet.</p>
    {:else}
      <div class="access-assignment-list">
        {#each data.projection.items as item}
          <article>
            <div>
              <span>Configuration Item</span>
              <strong>{item.configurationItemCode} — {item.configurationItemName}</strong>
            </div>
            <div><span>Status</span><strong>{item.status}</strong></div>
            <div><span>Version</span><strong>{item.selectedVersion ?? '—'}</strong></div>
            <div><span>Criterion</span><strong>{item.criterionType ? label(item.criterionType) : '—'}</strong></div>
            {#if item.message}
              <div><span>Outcome</span><strong>{item.message}</strong></div>
            {/if}
          </article>
        {/each}
      </div>
    {/if}
  </section>
{/if}
