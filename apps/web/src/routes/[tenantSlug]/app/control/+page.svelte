<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function dateTime(value: string) {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }
</script>

<svelte:head>
  <title>Control — NuBlox</title>
</svelte:head>

{#if !data.allowed || !data.control}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit control-spine access.</h1>
      <p>
        NuBlox evaluated <code>platform.configuration.read</code> in the current tenant scope and
        did not find an active matching Access Role Assignment.
      </p>
      <p class="permission-reason">{data.reason}</p>
      <div class="permission-actions">
        <a
          class="primary-action permission-back"
          href="/app/request-access?permission=platform.configuration.read&returnTo=/app/control"
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
      <p class="app-eyebrow">Shared control spine</p>
      <h1>Lifecycle, Decision &amp; Evidence</h1>
      <p class="workspace-lede">
        One governed control surface for lifecycle definitions, exact current state, immutable
        Decisions, Evidence and attributable history across canonical objects.
      </p>
    </div>
  </section>

  <section class="architecture-metrics control-metrics" aria-label="Control spine totals">
    <article>
      <span>Lifecycle definitions</span>
      <strong>{data.control.totals.lifecycleDefinitions}</strong>
      <p>Governed object-state models</p>
    </article>
    <article>
      <span>Governed objects</span>
      <strong>{data.control.totals.governedObjects}</strong>
      <p>Objects with active lifecycle state</p>
    </article>
    <article>
      <span>Decisions</span>
      <strong>{data.control.totals.decisions}</strong>
      <p>Exact subject/version outcomes</p>
    </article>
    <article>
      <span>Evidence</span>
      <strong>{data.control.totals.evidenceRecords}</strong>
      <p>Recorded evidence items</p>
    </article>
  </section>

  <div class="control-workspace-grid">
    <section class="workspace-panel">
      <div class="panel-heading">
        <div>
          <p class="app-eyebrow">Lifecycle governance</p>
          <h2>Definitions</h2>
        </div>
        <span>{data.control.lifecycleDefinitions.length}</span>
      </div>

      <div class="control-definition-list">
        {#if data.control.lifecycleDefinitions.length === 0}
          <p class="control-empty">No lifecycle definitions exist in this tenant.</p>
        {:else}
          {#each data.control.lifecycleDefinitions as definition}
            <details>
              <summary>
                <div>
                  <span>{definition.code}</span>
                  <strong>{definition.name}</strong>
                </div>
                <em>{definition.objectType}</em>
              </summary>
              <div class="control-definition-detail">
                <div>
                  <h3>States</h3>
                  <div class="control-chip-list">
                    {#each definition.states as state}
                      <span>
                        <strong>{state.code}</strong>
                        {state.name}
                        {#if state.initial}<small>Initial</small>{/if}
                        {#if state.terminal}<small>Terminal</small>{/if}
                      </span>
                    {/each}
                  </div>
                </div>
                <div>
                  <h3>Transitions</h3>
                  <div class="control-transition-list">
                    {#each definition.transitions as transition}
                      <span>
                        <strong>{transition.code}</strong>
                        {transition.name}
                        {#if transition.requiresDecision}
                          <small>Decision required</small>
                        {/if}
                      </span>
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
          <p class="app-eyebrow">Current governed state</p>
          <h2>Object lifecycles</h2>
        </div>
        <span>{data.control.objectStates.length}</span>
      </div>

      <div class="control-table">
        {#each data.control.objectStates as item}
          <article>
            <div>
              <span class="control-type">{item.objectType}</span>
              <strong>{item.stableKey}</strong>
              <small>{item.canonicalObjectId}</small>
            </div>
            <div>
              <strong>{item.lifecycleStateName}</strong>
              <span>{item.lifecycleDefinitionName}</span>
            </div>
            <div>
              <strong>Seq {item.sequence}</strong>
              <span>{dateTime(item.effectiveAt)}</span>
            </div>
          </article>
        {/each}
        {#if data.control.objectStates.length === 0}
          <p class="control-empty">No canonical objects currently have lifecycle state.</p>
        {/if}
      </div>
    </section>
  </div>

  <div class="control-workspace-grid">
    <section class="workspace-panel">
      <div class="panel-heading">
        <div>
          <p class="app-eyebrow">Immutable outcomes</p>
          <h2>Decisions</h2>
        </div>
        <span>{data.control.decisions.length}</span>
      </div>
      <div class="control-record-list">
        {#each data.control.decisions as decision}
          <article>
            <header>
              <span>{decision.decisionType}</span>
              <strong>{decision.outcome}</strong>
            </header>
            <h3>{decision.objectType} · {decision.stableKey}</h3>
            <p>{decision.reason}</p>
            <footer>
              <span>{decision.deciderName}</span>
              <span>{dateTime(decision.decidedAt)}</span>
              {#if decision.subjectVersion}<span>Version {decision.subjectVersion}</span>{/if}
            </footer>
          </article>
        {/each}
        {#if data.control.decisions.length === 0}
          <p class="control-empty">No Decisions recorded yet.</p>
        {/if}
      </div>
    </section>

    <section class="workspace-panel">
      <div class="panel-heading">
        <div>
          <p class="app-eyebrow">Authoritative evidence</p>
          <h2>Evidence</h2>
        </div>
        <span>{data.control.evidence.length}</span>
      </div>
      <div class="control-record-list">
        {#each data.control.evidence as evidence}
          <article>
            <header>
              <span>{evidence.evidenceType}</span>
              <strong>{evidence.objectType}</strong>
            </header>
            <h3>{evidence.stableKey}</h3>
            <footer>
              <span>{evidence.capturedByName ?? 'System'}</span>
              <span>{dateTime(evidence.capturedAt)}</span>
              {#if evidence.subjectVersion}<span>Version {evidence.subjectVersion}</span>{/if}
            </footer>
          </article>
        {/each}
        {#if data.control.evidence.length === 0}
          <p class="control-empty">No Evidence records captured yet.</p>
        {/if}
      </div>
    </section>
  </div>

  <section class="workspace-panel control-audit-panel">
    <div class="panel-heading">
      <div>
        <p class="app-eyebrow">Attributable history</p>
        <h2>Audit trail</h2>
      </div>
      <span>{data.control.audit.length}</span>
    </div>

    {#if data.canReadAudit}
      <div class="audit-list">
        {#each data.control.audit as entry}
          <article>
            <span>{dateTime(entry.createdAt)}</span>
            <strong>{entry.entityType} · {entry.action}</strong>
            <span>{entry.entityId}</span>
            <span>{entry.actorName ?? 'System'}</span>
          </article>
        {/each}
      </div>
    {:else}
      <div class="control-empty">
        Audit history is separately permissioned through <code>platform.audit.read</code>.
      </div>
    {/if}
  </section>
{/if}
