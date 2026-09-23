<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  function label(value: string) {
    return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
  }

  function dateTime(value: string) {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  function schemeLevels(schemeId: string) {
    return data.projection?.levels.filter((level) => level.schemeId === schemeId) ?? [];
  }
</script>

<svelte:head>
  <title>Information Security — NuBlox</title>
</svelte:head>

{#if !data.allowed || !data.projection}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit Information Security administration.</h1>
      <p>
        NuBlox evaluated <code>platform.security_classification.read</code> in the current tenant
        scope and did not find an active matching Access Role Assignment.
      </p>
      <p class="permission-reason">{data.reason}</p>
      <div class="permission-actions">
        <a
          class="primary-action permission-back"
          href="/app/request-access?permission=platform.security_classification.read&returnTo=/app/security-classification"
        >
          Request access
          <span aria-hidden="true">→</span>
        </a>
        <a class="quiet-link" href="/app">Back to Functions</a>
      </div>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact">
    <div>
      <p class="app-eyebrow">Shared control plane</p>
      <h1>Information Security</h1>
      <p class="workspace-lede">
        Govern information classification and clearance independently from ordinary access
        permission. Permission allows an action; classification determines whether the principal is
        cleared to see the protected subject in the applicable scope.
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
          <p class="app-eyebrow">Read-only security governance</p>
          <h2>Security administration is separately permissioned</h2>
        </div>
      </div>
      <p>
        You can inspect classifications and clearances, but changes require
        <code>platform.security_classification.manage</code>.
        <a
          href="/app/request-access?permission=platform.security_classification.manage&returnTo=/app/security-classification"
        >
          Request Information Security administration access
        </a>.
      </p>
    </section>
  {/if}

  <section class="architecture-metrics" aria-label="Information security totals">
    <article>
      <span>Schemes</span>
      <strong>{data.projection.schemes.length}</strong>
      <p>Governed classification schemes</p>
    </article>
    <article>
      <span>Levels</span>
      <strong>{data.projection.levels.length}</strong>
      <p>Ordinal or categorical values</p>
    </article>
    <article>
      <span>Classified subjects</span>
      <strong>{data.projection.assignments.length}</strong>
      <p>Exact governed object/version assignments</p>
    </article>
    <article>
      <span>Clearance grants</span>
      <strong>{data.projection.clearances.length}</strong>
      <p>Principal and scope-specific clearance</p>
    </article>
  </section>

  {#if data.canManage}
    <section class="access-command-grid">
      <article>
        <header>
          <span>01</span>
          <div>
            <h2>Create classification scheme</h2>
            <p>Define either ranked clearance levels or independent categories.</p>
          </div>
        </header>
        <form method="POST" action="?/createScheme" class="admin-form access-form">
          <label>
            <span>Scheme code</span>
            <input name="code" required maxlength="80" autocomplete="off" />
          </label>
          <label>
            <span>Scheme name</span>
            <input name="name" required maxlength="255" />
          </label>
          <label>
            <span>Scheme kind</span>
            <select name="kind" required>
              <option value="ORDINAL">Ordinal — ranked clearance</option>
              <option value="CATEGORICAL">Categorical — independent values</option>
            </select>
          </label>
          <label class="wide-field">
            <span>Description</span>
            <textarea name="description" rows="3"></textarea>
          </label>
          <button type="submit">Create Scheme <span>→</span></button>
        </form>
      </article>

      <article>
        <header>
          <span>02</span>
          <div>
            <h2>Create classification level</h2>
            <p>Rank is required for ordinal schemes and must be blank for categorical schemes.</p>
          </div>
        </header>
        <form method="POST" action="?/createLevel" class="admin-form access-form">
          <label>
            <span>Scheme</span>
            <select name="schemeId" required>
              <option value="">Select scheme</option>
              {#each data.projection.schemes.filter((scheme) => scheme.status === 'ACTIVE') as scheme}
                <option value={scheme.id}>
                  {scheme.code} — {scheme.name} ({label(scheme.kind)})
                </option>
              {/each}
            </select>
          </label>
          <label>
            <span>Level code</span>
            <input name="code" required maxlength="80" autocomplete="off" />
          </label>
          <label>
            <span>Level name</span>
            <input name="name" required maxlength="255" />
          </label>
          <label>
            <span>Rank order</span>
            <input name="rankOrder" type="number" min="0" step="1" placeholder="Ordinal only" />
          </label>
          <label class="wide-field">
            <span>Description</span>
            <textarea name="description" rows="3"></textarea>
          </label>
          <button type="submit">Create Level <span>→</span></button>
        </form>
      </article>

      <article>
        <header>
          <span>03</span>
          <div>
            <h2>Grant clearance</h2>
            <p>Grant clearance to an existing Person, Position, Organisation Unit or Organisation.</p>
          </div>
        </header>
        <form method="POST" action="?/grantClearance" class="admin-form access-form">
          <label>
            <span>Principal</span>
            <select name="principal" required>
              <option value="">Select principal</option>
              {#each data.projection.principals as principal}
                <option value={principal.type + '|' + principal.id}>
                  {label(principal.type)} · {principal.label}
                </option>
              {/each}
            </select>
          </label>
          <label>
            <span>Classification level</span>
            <select name="classificationLevelId" required>
              <option value="">Select level</option>
              {#each data.projection.levels.filter((level) => level.status === 'ACTIVE') as levelItem}
                <option value={levelItem.id}>
                  {levelItem.schemeCode} · {levelItem.code} — {levelItem.name}
                </option>
              {/each}
            </select>
          </label>
          <label>
            <span>Scope type</span>
            <select name="scopeType" required>
              <option value="TENANT">Tenant</option>
              <option value="ORGANISATION">Organisation</option>
              <option value="ORGANISATION_UNIT">Organisation Unit</option>
              <option value="PROGRAMME">Programme</option>
              <option value="PROJECT">Project</option>
              <option value="CONTRACT">Contract</option>
              <option value="WORK_PACKAGE">Work Package</option>
              <option value="SITE">Site</option>
              <option value="ASSET">Asset</option>
              <option value="SERVICE">Service</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </label>
          <label>
            <span>Scope object ID</span>
            <input name="scopeId" placeholder="Leave blank only for TENANT" />
          </label>
          <label>
            <span>Include lower ranked levels</span>
            <input name="includeLowerLevels" type="checkbox" />
          </label>
          <div class="admin-form-split">
            <label>
              <span>Effective from</span>
              <input name="effectiveFrom" type="datetime-local" />
            </label>
            <label>
              <span>Effective to</span>
              <input name="effectiveTo" type="datetime-local" />
            </label>
          </div>
          <button
            type="submit"
            disabled={data.projection.principals.length === 0 || data.projection.levels.length === 0}
          >
            Grant Clearance <span>→</span>
          </button>
        </form>
      </article>
    </section>
  {/if}

  <div class="control-workspace-grid">
    <section class="workspace-panel">
      <div class="panel-heading">
        <div>
          <p class="app-eyebrow">Classification model</p>
          <h2>Schemes &amp; levels</h2>
        </div>
        <span>{data.projection.schemes.length}</span>
      </div>

      <div class="control-definition-list">
        {#if data.projection.schemes.length === 0}
          <p class="control-empty">No Security Classification Schemes have been created.</p>
        {:else}
          {#each data.projection.schemes as scheme}
            <details open>
              <summary>
                <div>
                  <span>{scheme.code}</span>
                  <strong>{scheme.name}</strong>
                </div>
                <em>{label(scheme.kind)}</em>
              </summary>
              <div class="control-definition-detail">
                {#if scheme.description}<p>{scheme.description}</p>{/if}
                <div>
                  <h3>Levels</h3>
                  <div class="control-chip-list">
                    {#each schemeLevels(scheme.id) as levelItem}
                      <span>
                        <strong>{levelItem.code}</strong>
                        {levelItem.name}
                        {#if levelItem.rankOrder !== undefined}<small>Rank {levelItem.rankOrder}</small>{/if}
                      </span>
                    {:else}
                      <span>No levels configured</span>
                    {/each}
                  </div>
                </div>
              </div>
            </details>
          {/each}
        {/if}
      </div>
    </section>

    <section class="workspace-panel">
      <div class="panel-heading">
        <div>
          <p class="app-eyebrow">Effective clearance</p>
          <h2>Clearance grants</h2>
        </div>
        <span>{data.projection.clearances.length}</span>
      </div>

      <div class="access-assignment-list">
        {#if data.projection.clearances.length === 0}
          <p class="control-empty">No Clearance Grants exist in this tenant.</p>
        {:else}
          {#each data.projection.clearances as grant}
            <article>
              <div>
                <span>{label(grant.principalType)}</span>
                <strong>{grant.principalLabel}</strong>
              </div>
              <div>
                <span>Clearance</span>
                <strong>{grant.schemeCode} · {grant.levelCode}</strong>
              </div>
              <div>
                <span>Scope</span>
                <strong>{label(grant.scopeType)}{grant.scopeId ? ' · ' + grant.scopeId : ''}</strong>
              </div>
              <div>
                <span>Effective</span>
                <strong>
                  {dateTime(grant.effectiveFrom)}
                  {grant.effectiveTo ? ' → ' + dateTime(grant.effectiveTo) : ''}
                </strong>
              </div>
            </article>
          {/each}
        {/if}
      </div>
    </section>
  </div>

  <section class="workspace-panel">
    <div class="panel-heading">
      <div>
        <p class="app-eyebrow">Protected subjects</p>
        <h2>Classification assignments</h2>
      </div>
      <span>{data.projection.assignments.length}</span>
    </div>

    <div class="control-table">
      {#if data.projection.assignments.length === 0}
        <p class="control-empty">
          No subjects are classified yet. Classification is applied from the governed object's
          workspace so the exact subject/version remains explicit.
        </p>
      {:else}
        {#each data.projection.assignments as assignment}
          <article>
            <div>
              <span class="control-type">{assignment.objectType}</span>
              <strong>{assignment.stableKey}</strong>
              <small>
                {assignment.subjectVersion
                  ? 'Version ' + assignment.subjectVersion
                  : assignment.subjectObjectId}
              </small>
            </div>
            <div>
              <span>Classification</span>
              <strong>{assignment.schemeCode} · {assignment.levelCode}</strong>
            </div>
            <div>
              <span>Effective</span>
              <strong>{dateTime(assignment.effectiveFrom)}</strong>
            </div>
          </article>
        {/each}
      {/if}
    </div>
  </section>

  <section class="workspace-panel">
    <div class="panel-heading">
      <div>
        <p class="app-eyebrow">Exceptional access</p>
        <h2>Decision-backed exceptions</h2>
      </div>
      <span>{data.projection.exceptions.length}</span>
    </div>

    <div class="control-record-list">
      {#if data.projection.exceptions.length === 0}
        <p class="control-empty">
          No exceptional access is active. Exceptions require an approval Decision for the exact
          protected subject/version and are not ordinary permission grants.
        </p>
      {:else}
        {#each data.projection.exceptions as exception}
          <article>
            <header>
              <span>{label(exception.principalType)} · {exception.principalId}</span>
              <strong>{exception.schemeCode} · {exception.levelCode}</strong>
            </header>
            <h3>
              {exception.stableKey}
              {exception.subjectVersion ? ' · ' + exception.subjectVersion : ''}
            </h3>
            <p>{exception.reason}</p>
            <footer>
              <span>Decision {exception.approvalDecisionId}</span>
              <span>{dateTime(exception.effectiveFrom)}</span>
            </footer>
          </article>
        {/each}
      {/if}
    </div>
  </section>
{/if}
