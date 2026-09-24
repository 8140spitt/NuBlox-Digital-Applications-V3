<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let selectedThingTypeId = $state('');
  let selectedRelationshipTypeId = $state('');

  const things = $derived(data.things ?? []);
  const relationshipTypes = $derived(data.relationshipTypes ?? []);
  const activeTypes = $derived(data.projection?.types.filter((item) => item.status === 'ACTIVE') ?? []);
  const selectedThingFields = $derived(
    data.projection?.effectiveTypeAttributes.filter(
      (item) => item.requestedTypeDefinitionId === selectedThingTypeId && item.status === 'ACTIVE'
    ) ?? []
  );
  const selectedRelationshipType = $derived(
    relationshipTypes.find((item) => item.id === selectedRelationshipTypeId)
  );

  function label(value: string) {
    return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
  function attribute(attributeDefinitionId: string) {
    return data.projection?.attributes.find((item) => item.id === attributeDefinitionId);
  }
  function enumeration(enumerationDefinitionId: string | undefined) {
    return enumerationDefinitionId
      ? data.projection?.enumerations.find((item) => item.id === enumerationDefinitionId)
      : undefined;
  }
  function renderValue(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') {
      const maybe = value as { label?: string; id?: string };
      if (maybe.label) return maybe.label;
      return JSON.stringify(value);
    }
    return String(value);
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
        Define business types once, compose their fields and relationships, then create real governed
        Things from those definitions. Type inheritance, typed values and relationship rules execute
        against the shared canonical object graph rather than spawning another application silo.
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
    <article><span>Types</span><strong>{data.projection.types.length}</strong><p>Governed Thing definitions</p></article>
    <article><span>Attributes</span><strong>{data.projection.attributes.length}</strong><p>Reusable typed field definitions</p></article>
    <article><span>Relationship types</span><strong>{relationshipTypes.length}</strong><p>Typed graph connections</p></article>
    <article><span>Things</span><strong>{things.length}</strong><p>Runtime business objects</p></article>
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

  <section class="workspace-panel">
    <div class="panel-heading">
      <div>
        <p class="app-eyebrow">Runtime object platform</p>
        <h2>Definition → Thing → Relationship</h2>
      </div>
      <span>{things.length} Things</span>
    </div>
    <p>
      Metadata is executable here. A Type defines the legal shape of a Thing; Relationship Types define
      the legal graph between Things. Required fields and relationship cardinality are enforced by the
      same runtime used by the application.
    </p>
    <p>
      The enterprise vocabulary binds native authoritative records into this same graph. Organisation,
      Person, Position, Project, Contract, Asset and the other shared identities remain single masters;
      business roles such as customer or supplier do not create duplicate organisations.
    </p>
    {#if data.canManage}
      <form method="POST" action="?/provisionEnterpriseVocabulary" class="inline-status-form">
        <button type="submit">Install / reconcile enterprise vocabulary <span>→</span></button>
      </form>
    {/if}
  </section>

  {#if data.canManage}
    <section class="access-command-grid">
      <article>
        <header><span>08</span><div><h2>Create relationship type</h2><p>Define a governed connection between two Thing types.</p></div></header>
        <form method="POST" action="?/createRelationshipType" class="admin-form access-form">
          <label><span>Code</span><input name="code" required maxlength="120" placeholder="CUSTOMER_HAS_OPPORTUNITY" /></label>
          <label><span>Name</span><input name="name" required maxlength="255" placeholder="Customer has Opportunity" /></label>
          <label>
            <span>From type</span>
            <select name="fromTypeDefinitionId" required>
              <option value="">Select type</option>
              {#each activeTypes as item}<option value={item.id}>{item.code} — {item.name}</option>{/each}
            </select>
          </label>
          <label>
            <span>To type</span>
            <select name="toTypeDefinitionId" required>
              <option value="">Select type</option>
              {#each activeTypes as item}<option value={item.id}>{item.code} — {item.name}</option>{/each}
            </select>
          </label>
          <label>
            <span>From cardinality</span>
            <select name="fromCardinality" required>
              <option value="MANY">Many source Things allowed</option>
              <option value="ONE">One source Thing per target</option>
            </select>
          </label>
          <label>
            <span>To cardinality</span>
            <select name="toCardinality" required>
              <option value="MANY">Many target Things allowed</option>
              <option value="ONE">One target Thing per source</option>
            </select>
          </label>
          <label><span>Inverse name</span><input name="inverseName" placeholder="Opportunity belongs to Customer" /></label>
          <label><span>Version</span><input name="version" type="number" min="1" value="1" required /></label>
          <label class="wide-field"><span>Description</span><textarea name="description" rows="3"></textarea></label>
          <div class="admin-form-split">
            <label><span>Effective from</span><input name="effectiveFrom" type="datetime-local" /></label>
            <label><span>Effective to</span><input name="effectiveTo" type="datetime-local" /></label>
          </div>
          <button type="submit">Create Relationship Type <span>→</span></button>
        </form>
      </article>

      <article>
        <header><span>09</span><div><h2>Add relationship field</h2><p>Give the relationship itself governed business data.</p></div></header>
        <form method="POST" action="?/assignRelationshipAttribute" class="admin-form access-form">
          <label>
            <span>Relationship type</span>
            <select name="relationshipTypeDefinitionId" required>
              <option value="">Select relationship</option>
              {#each relationshipTypes.filter((item) => item.status === 'ACTIVE') as item}
                <option value={item.id}>{item.code}</option>
              {/each}
            </select>
          </label>
          <label>
            <span>Attribute</span>
            <select name="attributeDefinitionId" required>
              <option value="">Select attribute</option>
              {#each data.projection.attributes.filter((item) => item.status === 'ACTIVE') as item}
                <option value={item.id}>{item.code} — {item.name}</option>
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
          <button type="submit">Assign Relationship Field <span>→</span></button>
        </form>
      </article>

      <article>
        <header><span>10</span><div><h2>Add relationship constraint</h2><p>Apply executable validation to a relationship field.</p></div></header>
        <form method="POST" action="?/assignRelationshipConstraint" class="admin-form access-form">
          <label>
            <span>Relationship field</span>
            <select name="relationshipAttributeAssignmentId" required>
              <option value="">Select field</option>
              {#each relationshipTypes.filter((item) => item.status === 'ACTIVE') as relationship}
                {#each relationship.fields.filter((field) => field.status === 'ACTIVE') as field}
                  <option value={field.assignmentId}>{relationship.code} · {field.name}</option>
                {/each}
              {/each}
            </select>
          </label>
          <label>
            <span>Constraint</span>
            <select name="constraintDefinitionId" required>
              <option value="">Select constraint</option>
              {#each data.projection.constraints.filter((item) => item.status === 'ACTIVE') as item}
                <option value={item.id}>{item.code} — {label(item.constraintType)}</option>
              {/each}
            </select>
          </label>
          <label><span>Sequence</span><input name="sequence" type="number" min="0" value="10" required /></label>
          <label>
            <span>Mode</span>
            <select name="mandatory">
              <option value="true">Mandatory — block invalid writes</option>
              <option value="false">Advisory — do not block writes</option>
            </select>
          </label>
          <button type="submit">Assign Relationship Constraint <span>→</span></button>
        </form>
      </article>

      <article>
        <header><span>11</span><div><h2>Create Thing</h2><p>Instantiate a governed business object from its Type.</p></div></header>
        <form method="POST" action="?/createThing" class="admin-form access-form">
          <label>
            <span>Type</span>
            <select name="typeDefinitionId" bind:value={selectedThingTypeId} required>
              <option value="">Select type</option>
              {#each activeTypes as item}<option value={item.id}>{item.code} — {item.name}</option>{/each}
            </select>
          </label>
          <label><span>Stable key</span><input name="stableKey" required placeholder="CUST-001" /></label>
          <label><span>Display name</span><input name="displayName" placeholder="Acme Developments" /></label>

          {#each selectedThingFields as field}
            {@const definition = attribute(field.attributeDefinitionId)}
            {#if definition}
              <label class:wide-field={definition.dataType === 'JSON'}>
                <span>{field.localLabel ?? field.attributeName}{field.required ? ' *' : ''}</span>
                {#if definition.dataType === 'BOOLEAN'}
                  <select name={`field:${field.id}:${definition.dataType}:0`} required={field.required}>
                    <option value="">Select</option><option value="true">True</option><option value="false">False</option>
                  </select>
                {:else if definition.dataType === 'ENUMERATION'}
                  {@const values = enumeration(definition.enumerationDefinitionId)?.values ?? []}
                  <select name={`field:${field.id}:${definition.dataType}:0`} required={field.required}>
                    <option value="">Select</option>
                    {#each values.filter((item) => item.status === 'ACTIVE') as option}
                      <option value={option.id}>{option.label}</option>
                    {/each}
                  </select>
                {:else if definition.dataType === 'REFERENCE'}
                  <select name={`field:${field.id}:${definition.dataType}:0`} required={field.required}>
                    <option value="">Select Thing</option>
                    {#each things.filter((item) => !definition.referenceObjectFamily || item.objectFamily === definition.referenceObjectFamily) as item}
                      <option value={item.id}>{item.typeCode} · {item.displayName}</option>
                    {/each}
                  </select>
                {:else if definition.dataType === 'JSON'}
                  <textarea name={`field:${field.id}:${definition.dataType}:0`} rows="3" required={field.required} placeholder="JSON value"></textarea>
                {:else}
                  <input
                    name={`field:${field.id}:${definition.dataType}:0`}
                    type={definition.dataType === 'INTEGER' || definition.dataType === 'DECIMAL' ? 'number' : definition.dataType === 'DATE' ? 'date' : definition.dataType === 'DATETIME' ? 'datetime-local' : 'text'}
                    step={definition.dataType === 'DECIMAL' ? 'any' : undefined}
                    required={field.required}
                  />
                {/if}
              </label>
            {/if}
          {/each}
          <button type="submit">Create Thing <span>→</span></button>
        </form>
      </article>

      <article>
        <header><span>12</span><div><h2>Relate Things</h2><p>Create a typed, effective relationship in the canonical graph.</p></div></header>
        <form method="POST" action="?/relateThings" class="admin-form access-form">
          <label>
            <span>Relationship type</span>
            <select name="relationshipTypeDefinitionId" bind:value={selectedRelationshipTypeId} required>
              <option value="">Select relationship</option>
              {#each relationshipTypes.filter((item) => item.status === 'ACTIVE') as item}
                <option value={item.id}>{item.code} — {item.name}</option>
              {/each}
            </select>
          </label>
          <label>
            <span>From Thing</span>
            <select name="fromThingId" required>
              <option value="">Select Thing</option>
              {#each things as item}
                <option value={item.id}>{item.typeCode} · {item.displayName}</option>
              {/each}
            </select>
          </label>
          <label>
            <span>To Thing</span>
            <select name="toThingId" required>
              <option value="">Select Thing</option>
              {#each things as item}
                <option value={item.id}>{item.typeCode} · {item.displayName}</option>
              {/each}
            </select>
          </label>
          <div class="admin-form-split">
            <label><span>Effective from</span><input name="effectiveFrom" type="datetime-local" /></label>
            <label><span>Effective to</span><input name="effectiveTo" type="datetime-local" /></label>
          </div>

          {#if selectedRelationshipType}
            {#each selectedRelationshipType.fields.filter((item) => item.status === 'ACTIVE') as field}
              <label class:wide-field={field.dataType === 'JSON'}>
                <span>{field.name}{field.required ? ' *' : ''}</span>
                {#if field.dataType === 'BOOLEAN'}
                  <select name={`relationshipField:${field.assignmentId}:${field.dataType}:0`} required={field.required}>
                    <option value="">Select</option><option value="true">True</option><option value="false">False</option>
                  </select>
                {:else if field.dataType === 'ENUMERATION'}
                  {@const values = enumeration(field.enumerationDefinitionId)?.values ?? []}
                  <select name={`relationshipField:${field.assignmentId}:${field.dataType}:0`} required={field.required}>
                    <option value="">Select</option>
                    {#each values.filter((item) => item.status === 'ACTIVE') as option}
                      <option value={option.id}>{option.label}</option>
                    {/each}
                  </select>
                {:else if field.dataType === 'REFERENCE'}
                  <select name={`relationshipField:${field.assignmentId}:${field.dataType}:0`} required={field.required}>
                    <option value="">Select Thing</option>
                    {#each things.filter((item) => !field.referenceObjectFamily || item.objectFamily === field.referenceObjectFamily) as item}
                      <option value={item.id}>{item.typeCode} · {item.displayName}</option>
                    {/each}
                  </select>
                {:else if field.dataType === 'JSON'}
                  <textarea name={`relationshipField:${field.assignmentId}:${field.dataType}:0`} rows="3" required={field.required} placeholder="JSON value"></textarea>
                {:else}
                  <input
                    name={`relationshipField:${field.assignmentId}:${field.dataType}:0`}
                    type={field.dataType === 'INTEGER' || field.dataType === 'DECIMAL' ? 'number' : field.dataType === 'DATE' ? 'date' : field.dataType === 'DATETIME' ? 'datetime-local' : 'text'}
                    step={field.dataType === 'DECIMAL' ? 'any' : undefined}
                    required={field.required}
                  />
                {/if}
              </label>
            {/each}
          {/if}
          <button type="submit">Create Relationship <span>→</span></button>
        </form>
      </article>
    </section>
  {/if}

  <section class="workspace-panel">
    <div class="panel-heading">
      <div><p class="app-eyebrow">Runtime graph</p><h2>Governed Things</h2></div>
      <span>{things.length}</span>
    </div>
    {#if things.length === 0}
      <p class="control-empty">No metadata-defined Things exist yet. Create a Type, assign its fields, then instantiate the first Thing.</p>
    {:else}
      <div class="control-record-list">
        {#each things as thing}
          <article>
            <header><span>{thing.typeCode}</span><strong>{thing.status}</strong></header>
            <h3>{thing.displayName}</h3>
            <p>{thing.stableKey}{thing.objectFamily ? ` · ${thing.objectFamily}` : ''}</p>
            {#if thing.lifecycle}
              <div class="function-record-meta">
                Lifecycle · {thing.lifecycle.definitionName} · {thing.lifecycle.stateName} · sequence {thing.lifecycle.sequence}
              </div>
            {/if}
            {#if thing.fields.length > 0}
              <div class="governance-capability-grid">
                {#each thing.fields as field}
                  <div><strong>{field.name}</strong><p>{renderValue(field.value)}</p></div>
                {/each}
              </div>
            {/if}
            {#if thing.relationships.length > 0}
              <footer>
                <span>{thing.relationships.length} relationships</span>
                <span>{thing.relationships.map((item) => `${item.name}: ${item.otherThingLabel}`).join(' · ')}</span>
              </footer>
            {:else}
              <footer><span>No relationships yet</span></footer>
            {/if}
          </article>
        {/each}
      </div>
    {/if}
  </section>

  <section class="workspace-panel">
    <div class="panel-heading">
      <div><p class="app-eyebrow">Relationship catalogue</p><h2>Typed relationship definitions</h2></div>
      <span>{relationshipTypes.length}</span>
    </div>
    {#if relationshipTypes.length === 0}
      <p class="control-empty">No relationship types have been defined.</p>
    {:else}
      <div class="access-assignment-list">
        {#each relationshipTypes as item}
          <article>
            <div><span>Relationship</span><strong>{item.code}</strong></div>
            <div><span>From</span><strong>{item.fromTypeCode} · {item.fromCardinality}</strong></div>
            <div><span>To</span><strong>{item.toTypeCode} · {item.toCardinality}</strong></div>
            <div><span>Relationship fields</span><strong>{item.fields.length}</strong></div>
          </article>
        {/each}
      </div>
    {/if}
  </section>

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
