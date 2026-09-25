<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  function label(value: string) {
    return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
</script>

<svelte:head>
  <title>Validation Policy — NuBlox</title>
</svelte:head>

{#if !data.allowed || !data.projection}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit Validation Policy access.</h1>
      <p>NuBlox evaluated <code>platform.validation_policy.read</code> in the current tenant scope.</p>
      <p class="permission-reason">{data.reason}</p>
      <div class="permission-actions">
        <a class="primary-action permission-back" href="/app/request-access?permission=platform.validation_policy.read&returnTo=/app/validation-policy">
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
      <h1>Validation Policy</h1>
      <p class="workspace-lede">
        Govern reusable business validation independently from Workflow and Lifecycle. Rule sets,
        relationship constraints and mappings are versioned controls; evaluation results are retained
        as evidence rather than transient screen validation.
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
          <h2>Validation administration is separately permissioned</h2>
        </div>
      </div>
      <p>
        Changes require <code>platform.validation_policy.manage</code>.
        <a href="/app/request-access?permission=platform.validation_policy.manage&returnTo=/app/validation-policy">
          Request administration access
        </a>.
      </p>
    </section>
  {/if}

  <section class="architecture-metrics" aria-label="Validation policy totals">
    <article><span>Rules</span><strong>{data.projection.rules.length}</strong><p>Versioned validation definitions</p></article>
    <article><span>Rule sets</span><strong>{data.projection.ruleSets.length}</strong><p>Ordered reusable validation controls</p></article>
    <article><span>Constraints</span><strong>{data.projection.relationshipConstraints.length}</strong><p>Governed relationship validity</p></article>
    <article><span>Open conflicts</span><strong>{data.projection.conflicts.filter((item) => item.status === 'OPEN').length}</strong><p>Evaluation outcomes requiring disposition</p></article>
  </section>

  {#if data.canManage}
    <section class="access-command-grid">
      <article>
        <header><span>01</span><div><h2>Create validation rule</h2><p>Define reusable validation logic and its implementation handler.</p></div></header>
        <form method="POST" action="?/createRule" class="admin-form access-form">
          <label><span>Rule code</span><input name="code" required maxlength="80" /></label>
          <label><span>Rule name</span><input name="name" required maxlength="255" /></label>
          <label>
            <span>Rule type</span>
            <select name="ruleType" required>
              <option value="ELIGIBILITY">Eligibility</option>
              <option value="REQUIRED_DATA">Required data</option>
              <option value="STATE">State</option>
              <option value="RELATIONSHIP">Relationship</option>
              <option value="CONSISTENCY">Consistency</option>
              <option value="MAPPING">Mapping</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </label>
          <label>
            <span>Severity</span>
            <select name="severity" required>
              <option value="BLOCKING">Blocking</option>
              <option value="ERROR">Error</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
            </select>
          </label>
          <label><span>Version</span><input name="version" type="number" min="1" step="1" value="1" required /></label>
          <label><span>Handler key</span><input name="handlerKey" required placeholder="e.g. lifecycle.required_state" /></label>
          <label class="wide-field"><span>Configuration (JSON object)</span><textarea name="configuration" rows="3" placeholder="Optional JSON configuration"></textarea></label>
          <label class="wide-field"><span>Description</span><textarea name="description" rows="3"></textarea></label>
          <div class="admin-form-split">
            <label><span>Effective from</span><input name="effectiveFrom" type="datetime-local" /></label>
            <label><span>Effective to</span><input name="effectiveTo" type="datetime-local" /></label>
          </div>
          <button type="submit">Create Rule <span>→</span></button>
        </form>
      </article>

      <article>
        <header><span>02</span><div><h2>Create rule set</h2><p>Version a reusable ordered validation gate.</p></div></header>
        <form method="POST" action="?/createRuleSet" class="admin-form access-form">
          <label><span>Set code</span><input name="code" required maxlength="80" /></label>
          <label><span>Set name</span><input name="name" required maxlength="255" /></label>
          <label><span>Version</span><input name="version" type="number" min="1" step="1" value="1" required /></label>
          <label class="wide-field"><span>Description</span><textarea name="description" rows="3"></textarea></label>
          <div class="admin-form-split">
            <label><span>Effective from</span><input name="effectiveFrom" type="datetime-local" /></label>
            <label><span>Effective to</span><input name="effectiveTo" type="datetime-local" /></label>
          </div>
          <button type="submit">Create Rule Set <span>→</span></button>
        </form>
      </article>

      <article>
        <header><span>03</span><div><h2>Add rule to set</h2><p>Compose deterministic rule order without duplicating rule definitions.</p></div></header>
        <form method="POST" action="?/addMember" class="admin-form access-form">
          <label>
            <span>Rule set</span>
            <select name="ruleSetId" required>
              <option value="">Select rule set</option>
              {#each data.projection.ruleSets.filter((item) => item.status === 'ACTIVE') as item}
                <option value={item.id}>{item.code} v{item.version} — {item.name}</option>
              {/each}
            </select>
          </label>
          <label>
            <span>Rule</span>
            <select name="ruleDefinitionId" required>
              <option value="">Select rule</option>
              {#each data.projection.rules.filter((item) => item.status === 'ACTIVE') as item}
                <option value={item.id}>{item.code} v{item.version} — {item.name}</option>
              {/each}
            </select>
          </label>
          <label><span>Sequence</span><input name="sequence" type="number" min="0" step="1" value="0" required /></label>
          <label>
            <span>Mandatory</span>
            <select name="mandatory"><option value="true">Mandatory</option><option value="false">Advisory</option></select>
          </label>
          <button type="submit">Add Rule <span>→</span></button>
        </form>
      </article>

      <article>
        <header><span>04</span><div><h2>Create relationship constraint</h2><p>Govern which object relationships are semantically valid.</p></div></header>
        <form method="POST" action="?/createConstraint" class="admin-form access-form">
          <label><span>Code</span><input name="code" required /></label>
          <label><span>Name</span><input name="name" required /></label>
          <label><span>Relationship type</span><input name="relationshipType" required /></label>
          <label><span>Source object type</span><input name="sourceObjectType" required /></label>
          <label><span>Target object type</span><input name="targetObjectType" required /></label>
          <label><span>Version</span><input name="version" type="number" min="1" value="1" required /></label>
          <button type="submit">Create Constraint <span>→</span></button>
        </form>
      </article>

      <article>
        <header><span>05</span><div><h2>Create mapping policy</h2><p>Govern reusable semantic/default mappings with explicit precedence.</p></div></header>
        <form method="POST" action="?/createMapping" class="admin-form access-form">
          <label><span>Code</span><input name="code" required /></label>
          <label><span>Name</span><input name="name" required /></label>
          <label><span>Source type</span><input name="sourceType" required /></label>
          <label><span>Target type</span><input name="targetType" required /></label>
          <label><span>Precedence</span><input name="precedence" type="number" min="0" value="0" required /></label>
          <label><span>Version</span><input name="version" type="number" min="1" value="1" required /></label>
          <label class="wide-field"><span>Mapping (JSON object)</span><textarea name="mapping" required rows="4" placeholder="JSON source-to-target mapping"></textarea></label>
          <button type="submit">Create Mapping <span>→</span></button>
        </form>
      </article>
    </section>
  {/if}

  <div class="control-workspace-grid">
    <section class="workspace-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">Rule catalogue</p><h2>Validation rules</h2></div><span>{data.projection.rules.length}</span></div>
      <div class="control-record-list">
        {#if data.projection.rules.length === 0}
          <p class="control-empty">No validation rules have been created.</p>
        {:else}
          {#each data.projection.rules as rule}
            <article>
              <header><span>{label(rule.ruleType)}</span><strong>{rule.severity}</strong></header>
              <h3>{rule.code} v{rule.version} — {rule.name}</h3>
              <p>{rule.description ?? 'No description.'}</p>
              <footer><span>{rule.handlerKey}</span><span>{rule.status}</span></footer>
            </article>
          {/each}
        {/if}
      </div>
    </section>

    <section class="workspace-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">Reusable gates</p><h2>Rule sets</h2></div><span>{data.projection.ruleSets.length}</span></div>
      <div class="control-record-list">
        {#if data.projection.ruleSets.length === 0}
          <p class="control-empty">No validation rule sets have been created.</p>
        {:else}
          {#each data.projection.ruleSets as set}
            <article>
              <header><span>Rule Set</span><strong>v{set.version}</strong></header>
              <h3>{set.code} — {set.name}</h3>
              <p>{data.projection.members.filter((member) => member.ruleSetId === set.id).length} governed rules</p>
              <footer><span>{set.status}</span></footer>
            </article>
          {/each}
        {/if}
      </div>
    </section>
  </div>

  <section class="workspace-panel">
    <div class="panel-heading"><div><p class="app-eyebrow">Composition</p><h2>Rule-set membership</h2></div><span>{data.projection.members.length}</span></div>
    <div class="access-assignment-list">
      {#if data.projection.members.length === 0}
        <p class="control-empty">No rule-set membership exists.</p>
      {:else}
        {#each data.projection.members as member}
          <article>
            <div><span>Set</span><strong>{member.ruleSetCode}</strong></div>
            <div><span>Sequence</span><strong>{member.sequence}</strong></div>
            <div><span>Rule</span><strong>{member.ruleCode} — {member.ruleName}</strong></div>
            <div><span>Mode</span><strong>{member.mandatory ? 'Mandatory' : 'Advisory'}</strong></div>
          </article>
        {/each}
      {/if}
    </div>
  </section>

  <div class="control-workspace-grid">
    <section class="workspace-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">Relationship policy</p><h2>Constraints</h2></div><span>{data.projection.relationshipConstraints.length}</span></div>
      <div class="control-record-list">
        {#each data.projection.relationshipConstraints as item}
          <article>
            <header><span>{item.relationshipType}</span><strong>v{item.version}</strong></header>
            <h3>{item.code} — {item.name}</h3>
            <p>{item.sourceObjectType} → {item.targetObjectType}</p>
          </article>
        {/each}
      </div>
    </section>

    <section class="workspace-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">Semantic mapping</p><h2>Mapping policies</h2></div><span>{data.projection.mappings.length}</span></div>
      <div class="control-record-list">
        {#each data.projection.mappings as item}
          <article>
            <header><span>Precedence {item.precedence}</span><strong>v{item.version}</strong></header>
            <h3>{item.code} — {item.name}</h3>
            <p>{item.sourceType} → {item.targetType}</p>
          </article>
        {/each}
      </div>
    </section>
  </div>

  <section class="workspace-panel">
    <div class="panel-heading"><div><p class="app-eyebrow">Evaluation evidence</p><h2>Runs and conflicts</h2></div><span>{data.projection.evaluations.length}</span></div>
    {#if data.projection.evaluations.length === 0}
      <p class="control-empty">No evaluation runs have been recorded yet. Governed release and change commands create retained evaluation evidence when an applicable rule set is configured.</p>
    {:else}
      <div class="access-assignment-list">
        {#each data.projection.evaluations as item}
          <article>
            <div><span>Rule set</span><strong>{item.ruleSetCode}</strong></div>
            <div><span>Subject</span><strong>{item.subjectObjectId}</strong></div>
            <div><span>Status</span><strong>{item.status}</strong></div>
            <div><span>Conflicts</span><strong>{data.projection.conflicts.filter((conflict) => conflict.evaluationRunId === item.id).length}</strong></div>
          </article>
        {/each}
      </div>
    {/if}

    {#if data.projection.conflicts.length > 0}
      <div class="panel-heading">
        <div><p class="app-eyebrow">Disposition evidence</p><h2>Validation conflicts</h2></div>
        <span>{data.projection.conflicts.length}</span>
      </div>
      <div class="control-record-list">
        {#each data.projection.conflicts as conflict}
          <article>
            <header><span>{conflict.status}</span><strong>{conflict.subjectObjectId}</strong></header>
            <h3>{conflict.summary}</h3>
            <p>Evaluation {conflict.evaluationRunId}</p>
            {#if conflict.resolutionReason}
              <p><strong>Disposition reason:</strong> {conflict.resolutionReason}</p>
            {/if}
            {#if conflict.status === 'OPEN'}
              {#if data.canDisposition}
                <form method="POST" action="?/dispositionConflict" class="admin-form access-form">
                  <input type="hidden" name="conflictId" value={conflict.id} />
                  <label>
                    <span>Disposition</span>
                    <select name="status" required>
                      <option value="RESOLVED">Resolved</option>
                      <option value="WAIVED">Waived</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </label>
                  <label class="wide-field">
                    <span>Reason</span>
                    <textarea name="resolutionReason" rows="2" required></textarea>
                  </label>
                  <button type="submit">Record disposition <span>→</span></button>
                </form>
              {:else}
                <p>
                  Conflict disposition requires
                  <code>platform.validation.conflict.disposition</code>.
                </p>
              {/if}
            {/if}
          </article>
        {/each}
      </div>
    {/if}
  </section>
{/if}
