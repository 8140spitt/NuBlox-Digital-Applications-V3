<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  function label(value: string) {
    return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
</script>

<svelte:head>
  <title>Metadata Governance — NuBlox</title>
</svelte:head>

{#if !data.allowed || !data.projection}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit Metadata Governance access.</h1>
      <p>NuBlox evaluated <code>platform.metadata.read</code> in the current tenant scope.</p>
      <p class="permission-reason">{data.reason}</p>
      <div class="permission-actions">
        <a class="primary-action permission-back" href="/app/request-access?permission=platform.metadata.read&returnTo=/app/metadata">
          Request access <span aria-hidden="true">→</span>
        </a>
        <a class="quiet-link" href="/app">Back to Functions</a>
      </div>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact">
    <div>
      <p class="app-eyebrow">Shared control plane</p>
      <h1>Metadata Governance</h1>
      <p class="workspace-lede">
        Define governed business types, reusable attributes, controlled enumerations and constraints
        without fragmenting the native NuBlox schema. Type inheritance resolves effective attributes
        while strongly typed native aggregates remain authoritative.
      </p>
    </div>
  </section>

  {#if form?.message || form?.error}
    <div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
      <strong>{form?.ok ? 'Completed' : 'Action not completed'}</strong>
      <span>{form?.message ?? form?.error}</span>
    </div>
  {/if}

  {#if !data.canManage}
    <section class="workspace-panel">
      <div class="panel-heading">
        <div>
          <p class="app-eyebrow">Read-only control</p>
          <h2>Metadata administration is separately permissioned</h2>
        </div>
      </div>
      <p>
        Changes require <code>platform.metadata.manage</code>.
        <a href="/app/request-access?permission=platform.metadata.manage&returnTo=/app/metadata">
          Request administration access
        </a>.
      </p>
    </section>
  {/if}

  <section class="architecture-metrics" aria-label="Metadata governance totals">
    <article><span>Types</span><strong>{data.projection.types.length}</strong><p>Versioned governed business/domain types</p></article>
    <article><span>Attributes</span><strong>{data.projection.attributes.length}</strong><p>Reusable controlled attribute definitions</p></article>
    <article><span>Constraints</span><strong>{data.projection.constraints.length}</strong><p>Reusable validation constraints</p></article>
    <article><span>Enumerations</span><strong>{data.projection.enumerations.length}</strong><p>Controlled value sets</p></article>
  </section>

  {#if data.canManage}
    <section class="access-command-grid">
      <article>
        <header><span>01</span><div><h2>Create type</h2><p>Define a governed type and optional same-family parent.</p></div></header>
        <form method="POST" action="?/createType" class="admin-form access-form">
          <label><span>Code</span><input name="code" required maxlength="80" /></label>
          <label><span>Name</span><input name="name" required maxlength="255" /></label>
          <label><span>Object family</span><input name="objectFamily" required placeholder="e.g. INFORMATION_CONTAINER" /></label>
          <label>
            <span>Parent type</span>
            <select name="parentTypeDefinitionId">
              <option value="">No parent</option>
              {#each data.projection.types.filter((item) => item.status === 'ACTIVE') as item}
                <option value={item.id}>{item.code} v{item.version}</option>
              {/each}
            </select>
          </label>
          <label><span>Version</span><input name="version" type="number" min="1" value="1" required /></label>
          <label><span>Lifecycle definition ID</span><input name="lifecycleDefinitionId" /></label>
          <label><span>Default template reference</span><input name="defaultTemplateReference" /></label>
          <label><span>Creation policy reference</span><input name="creationPolicyReference" /></label>
          <label><span>Extension package</span><input name="extensionPackage" /></label>
          <label class="wide-field"><span>Classification applicability (JSON)</span><textarea name="classificationApplicability" rows="3"></textarea></label>
          <label class="wide-field"><span>Description</span><textarea name="description" rows="3"></textarea></label>
          <div class="admin-form-split">
            <label><span>Effective from</span><input name="effectiveFrom" type="datetime-local" /></label>
            <label><span>Effective to</span><input name="effectiveTo" type="datetime-local" /></label>
          </div>
          <button type="submit">Create Type <span>→</span></button>
        </form>
      </article>

      <article>
        <header><span>02</span><div><h2>Create attribute</h2><p>Define a reusable attribute with controlled data semantics.</p></div></header>
        <form method="POST" action="?/createAttribute" class="admin-form access-form">
          <label><span>Code</span><input name="code" required maxlength="80" /></label>
          <label><span>Name</span><input name="name" required maxlength="255" /></label>
          <label>
            <span>Data type</span>
            <select name="dataType" required>
              <option value="STRING">String</option>
              <option value="INTEGER">Integer</option>
              <option value="DECIMAL">Decimal</option>
              <option value="BOOLEAN">Boolean</option>
              <option value="DATE">Date</option>
              <option value="DATETIME">Date/time</option>
              <option value="ENUMERATION">Enumeration</option>
              <option value="REFERENCE">Reference</option>
              <option value="JSON">JSON</option>
            </select>
          </label>
          <label><span>Version</span><input name="version" type="number" min="1" value="1" required /></label>
          <label><span>Unit code</span><input name="unitCode" /></label>
          <label>
            <span>Enumeration</span>
            <select name="enumerationDefinitionId">
              <option value="">Not enumeration-backed</option>
              {#each data.projection.enumerations.filter((item) => item.status === 'ACTIVE') as item}
                <option value={item.id}>{item.code} v{item.version}</option>
              {/each}
            </select>
          </label>
          <label><span>Reference object family</span><input name="referenceObjectFamily" /></label>
          <label class="wide-field"><span>Description</span><textarea name="description" rows="3"></textarea></label>
          <div class="admin-form-split">
            <label><span>Effective from</span><input name="effectiveFrom" type="datetime-local" /></label>
            <label><span>Effective to</span><input name="effectiveTo" type="datetime-local" /></label>
          </div>
          <button type="submit">Create Attribute <span>→</span></button>
        </form>
      </article>

      <article>
        <header><span>03</span><div><h2>Assign attribute to type</h2><p>Compose local metadata while inheriting parent attributes.</p></div></header>
        <form method="POST" action="?/assignAttribute" class="admin-form access-form">
          <label>
            <span>Type</span>
            <select name="typeDefinitionId" required>
              <option value="">Select type</option>
              {#each data.projection.types.filter((item) => item.status === 'ACTIVE') as item}
                <option value={item.id}>{item.code} v{item.version}</option>
              {/each}
            </select>
          </label>
          <label>
            <span>Attribute</span>
            <select name="attributeDefinitionId" required>
              <option value="">Select attribute</option>
              {#each data.projection.attributes.filter((item) => item.status === 'ACTIVE') as item}
                <option value={item.id}>{item.code} v{item.version}</option>
              {/each}
            </select>
          </label>
          <label><span>Sequence</span><input name="sequence" type="number" min="0" value="10" required /></label>
          <label>
            <span>Cardinality</span>
            <select name="cardinality" required>
              <option value="SINGLE">Single</option>
              <option value="MULTIPLE">Multiple</option>
            </select>
          </label>
          <label>
            <span>Required</span>
            <select name="required">
              <option value="false">Optional</option>
              <option value="true">Required</option>
            </select>
          </label>
          <label><span>Local label</span><input name="localLabel" /></label>
          <label class="wide-field"><span>Default value (JSON)</span><textarea name="defaultValue" rows="2"></textarea></label>
          <button type="submit">Assign Attribute <span>→</span></button>
        </form>
      </article>

      <article>
        <header><span>04</span><div><h2>Create enumeration</h2><p>Version a reusable controlled value set.</p></div></header>
        <form method="POST" action="?/createEnumeration" class="admin-form access-form">
          <label><span>Code</span><input name="code" required /></label>
          <label><span>Name</span><input name="name" required /></label>
          <label><span>Version</span><input name="version" type="number" min="1" value="1" required /></label>
          <label class="wide-field"><span>Description</span><textarea name="description" rows="3"></textarea></label>
          <div class="admin-form-split">
            <label><span>Effective from</span><input name="effectiveFrom" type="datetime-local" /></label>
            <label><span>Effective to</span><input name="effectiveTo" type="datetime-local" /></label>
          </div>
          <button type="submit">Create Enumeration <span>→</span></button>
        </form>
      </article>

      <article>
        <header><span>05</span><div><h2>Add enumeration value</h2><p>Add an ordered controlled value to an enumeration.</p></div></header>
        <form method="POST" action="?/addEnumerationValue" class="admin-form access-form">
          <label>
            <span>Enumeration</span>
            <select name="enumerationDefinitionId" required>
              <option value="">Select enumeration</option>
              {#each data.projection.enumerations.filter((item) => item.status === 'ACTIVE') as item}
                <option value={item.id}>{item.code} v{item.version}</option>
              {/each}
            </select>
          </label>
          <label><span>Code</span><input name="code" required /></label>
          <label><span>Label</span><input name="label" required /></label>
          <label><span>Sequence</span><input name="sequence" type="number" min="0" value="10" required /></label>
          <label><span>External value</span><input name="externalValue" /></label>
          <button type="submit">Add Value <span>→</span></button>
        </form>
      </article>

      <article>
        <header><span>06</span><div><h2>Create constraint</h2><p>Define reusable validation semantics for governed attributes.</p></div></header>
        <form method="POST" action="?/createConstraint" class="admin-form access-form">
          <label><span>Code</span><input name="code" required /></label>
          <label><span>Name</span><input name="name" required /></label>
          <label>
            <span>Constraint type</span>
            <select name="constraintType" required>
              <option value="REQUIRED">Required</option>
              <option value="MIN_MAX">Min/max</option>
              <option value="LENGTH">Length</option>
              <option value="PATTERN">Pattern</option>
              <option value="ENUMERATION">Enumeration</option>
              <option value="REFERENCE">Reference</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </label>
          <label><span>Version</span><input name="version" type="number" min="1" value="1" required /></label>
          <label class="wide-field"><span>Configuration (JSON object)</span><textarea name="configuration" rows="3" placeholder="e.g. minimum/maximum JSON configuration"></textarea></label>
          <label class="wide-field"><span>Description</span><textarea name="description" rows="3"></textarea></label>
          <button type="submit">Create Constraint <span>→</span></button>
        </form>
      </article>

      <article>
        <header><span>07</span><div><h2>Assign constraint</h2><p>Apply a reusable constraint to one type/attribute assignment.</p></div></header>
        <form method="POST" action="?/assignConstraint" class="admin-form access-form">
          <label>
            <span>Type attribute</span>
            <select name="typeAttributeAssignmentId" required>
              <option value="">Select assignment</option>
              {#each data.projection.typeAttributes.filter((item) => item.status === 'ACTIVE') as item}
                <option value={item.id}>{item.typeCode} · {item.attributeCode}</option>
              {/each}
            </select>
          </label>
          <label>
            <span>Constraint</span>
            <select name="constraintDefinitionId" required>
              <option value="">Select constraint</option>
              {#each data.projection.constraints.filter((item) => item.status === 'ACTIVE') as item}
                <option value={item.id}>{item.code} v{item.version}</option>
              {/each}
            </select>
          </label>
          <label><span>Sequence</span><input name="sequence" type="number" min="0" value="10" required /></label>
          <label>
            <span>Mode</span>
            <select name="mandatory">
              <option value="true">Mandatory</option>
              <option value="false">Advisory</option>
            </select>
          </label>
          <button type="submit">Assign Constraint <span>→</span></button>
        </form>
      </article>
    </section>
  {/if}

  <div class="control-workspace-grid">
    <section class="workspace-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">Type catalogue</p><h2>Governed types</h2></div><span>{data.projection.types.length}</span></div>
      <div class="control-record-list">
        {#if data.projection.types.length === 0}
          <p class="control-empty">No governed type definitions exist yet.</p>
        {:else}
          {#each data.projection.types as item}
            <article>
              <header><span>{item.objectFamily}</span><strong>v{item.version}</strong></header>
              <h3>{item.code} — {item.name}</h3>
              <p>{item.description ?? 'No description.'}</p>
              <footer>
                <span>{item.parentCode ? `inherits ${item.parentCode}` : 'root type'}</span>
                <span>{item.status}</span>
              </footer>
            </article>
          {/each}
        {/if}
      </div>
    </section>

    <section class="workspace-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">Attribute catalogue</p><h2>Reusable attributes</h2></div><span>{data.projection.attributes.length}</span></div>
      <div class="control-record-list">
        {#if data.projection.attributes.length === 0}
          <p class="control-empty">No governed attributes exist yet.</p>
        {:else}
          {#each data.projection.attributes as item}
            <article>
              <header><span>{label(item.dataType)}</span><strong>v{item.version}</strong></header>
              <h3>{item.code} — {item.name}</h3>
              <p>{item.enumerationCode ? `Enumeration: ${item.enumerationCode}` : item.referenceObjectFamily ? `Reference: ${item.referenceObjectFamily}` : item.unitCode ? `Unit: ${item.unitCode}` : 'Native scalar metadata'}</p>
              <footer><span>{item.status}</span></footer>
            </article>
          {/each}
        {/if}
      </div>
    </section>
  </div>

  <section class="workspace-panel">
    <div class="panel-heading">
      <div><p class="app-eyebrow">Resolved inheritance</p><h2>Effective type attributes</h2></div>
      <span>{data.projection.effectiveTypeAttributes.length}</span>
    </div>
    {#if data.projection.effectiveTypeAttributes.length === 0}
      <p class="control-empty">No type attributes have been assigned.</p>
    {:else}
      <div class="access-assignment-list">
        {#each data.projection.types as type}
          {@const effective = data.projection.effectiveTypeAttributes.filter((item) => item.requestedTypeDefinitionId === type.id)}
          {#each effective as item}
            <article>
              <div><span>Type</span><strong>{type.code}</strong></div>
              <div><span>Attribute</span><strong>{item.attributeCode}</strong></div>
              <div><span>Requirement</span><strong>{item.required ? 'Required' : 'Optional'} · {label(item.cardinality)}</strong></div>
              <div><span>Source</span><strong>{item.inherited ? `Inherited from ${item.typeCode}` : 'Local'}</strong></div>
            </article>
          {/each}
        {/each}
      </div>
    {/if}
  </section>

  <div class="control-workspace-grid">
    <section class="workspace-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">Constraint catalogue</p><h2>Constraints</h2></div><span>{data.projection.constraints.length}</span></div>
      <div class="control-record-list">
        {#each data.projection.constraints as item}
          <article>
            <header><span>{label(item.constraintType)}</span><strong>v{item.version}</strong></header>
            <h3>{item.code} — {item.name}</h3>
            <p>{data.projection.constraintAssignments.filter((assignment) => assignment.constraintDefinitionId === item.id).length} assignments</p>
          </article>
        {/each}
      </div>
    </section>

    <section class="workspace-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">Controlled values</p><h2>Enumerations</h2></div><span>{data.projection.enumerations.length}</span></div>
      <div class="control-record-list">
        {#each data.projection.enumerations as item}
          <article>
            <header><span>Enumeration</span><strong>v{item.version}</strong></header>
            <h3>{item.code} — {item.name}</h3>
            <p>{item.values.length} controlled values</p>
            <footer><span>{item.values.map((entry) => entry.label).join(' · ') || 'No values'}</span></footer>
          </article>
        {/each}
      </div>
    </section>
  </div>
{/if}
