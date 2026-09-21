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
  <title>Change &amp; Configuration — NuBlox</title>
</svelte:head>

{#if !data.allowed || !data.projection}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit Change &amp; Configuration control.</h1>
      <p>
        NuBlox evaluated <code>platform.configuration.read</code> in the current tenant scope and
        did not find an active matching Access Role Assignment.
      </p>
      <p class="permission-reason">{data.reason}</p>
      <div class="permission-actions">
        <a
          class="primary-action permission-back"
          href="/app/request-access?permission=platform.configuration.read&returnTo=/app/configuration"
        >
          Request access <span aria-hidden="true">→</span>
        </a>
        <a class="quiet-link" href="/app">Back to Functions</a>
      </div>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact configuration-hero">
    <div>
      <p class="app-eyebrow">NTE-006 · governed change and configuration state</p>
      <h1>Change, Configuration &amp; Baseline</h1>
      <p class="workspace-lede">
        Trace proposed change through affected objects, impact, implementation and verification,
        then reconcile the controlled configuration items, baselines and effectivity that define
        the authoritative state.
      </p>
    </div>
    {#if !data.canManage}
      <div class="workspace-readonly">Read access only</div>
    {/if}
  </section>

  <section class="architecture-metrics configuration-metrics" aria-label="Configuration totals">
    <article>
      <span>Changes</span>
      <strong>{data.projection.totals.changes}</strong>
      <p>{data.projection.totals.openChanges} currently open</p>
    </article>
    <article>
      <span>Configuration items</span>
      <strong>{data.projection.totals.configurationItems}</strong>
      <p>Canonical controlled items</p>
    </article>
    <article>
      <span>Baselines</span>
      <strong>{data.projection.totals.baselines}</strong>
      <p>{data.projection.totals.establishedBaselines} established</p>
    </article>
    <article>
      <span>Effectivities</span>
      <strong>{data.projection.totals.effectivities}</strong>
      <p>Version applicability rules</p>
    </article>
  </section>

  <section class="configuration-workspace-grid">
    <div class="configuration-primary">
      <header class="configuration-section-heading">
        <div>
          <p class="app-eyebrow">Controlled change register</p>
          <h2>Change lifecycle</h2>
        </div>
        <p>Every status movement is retained in the governed Change history.</p>
      </header>

      <div class="change-register">
        {#if data.projection.changes.length === 0}
          <div class="empty-work-state">
            <p class="app-eyebrow">No changes</p>
            <h2>No governed Change records exist yet.</h2>
          </div>
        {:else}
          {#each data.projection.changes as change}
            <article class="change-card">
              <header>
                <div>
                  <span class="change-code">{change.code}</span>
                  <h3>{change.title}</h3>
                  <p>{change.changeType} · raised by {change.raisedByName} · {dateTime(change.raisedAt)}</p>
                </div>
                <span class="change-status">{change.status}</span>
              </header>

              <p class="change-description">{change.description}</p>

              <div class="change-facts">
                <span>{change.affectedObjects.length} affected object{change.affectedObjects.length === 1 ? '' : 's'}</span>
                <span>{change.impactAssessments.length} impact assessment{change.impactAssessments.length === 1 ? '' : 's'}</span>
                <span>{change.implementationActions.length} implementation action{change.implementationActions.length === 1 ? '' : 's'}</span>
                <span>{change.verifications.length} verification{change.verifications.length === 1 ? '' : 's'}</span>
              </div>

              <details>
                <summary>Change evidence and lineage</summary>
                <div class="change-detail-grid">
                  <section>
                    <h4>Affected objects</h4>
                    {#if change.affectedObjects.length === 0}
                      <p class="information-empty">No affected objects recorded.</p>
                    {:else}
                      {#each change.affectedObjects as affected}
                        <div class="change-detail-row">
                          <strong>{affected.disposition} · {affected.stableKey}</strong>
                          <span>{affected.objectType}{affected.subjectVersion ? ` · v${affected.subjectVersion}` : ''}</span>
                          <p>{affected.rationale}</p>
                        </div>
                      {/each}
                    {/if}
                  </section>

                  <section>
                    <h4>Impact</h4>
                    {#if change.impactAssessments.length === 0}
                      <p class="information-empty">No impact assessment recorded.</p>
                    {:else}
                      {#each change.impactAssessments as impact}
                        <div class="change-detail-row">
                          <strong>{impact.impactLevel} · {impact.domain}</strong>
                          <span>{impact.assessorName} · {dateTime(impact.assessedAt)}</span>
                          <p>{impact.summary}</p>
                        </div>
                      {/each}
                    {/if}
                  </section>

                  <section>
                    <h4>Implementation</h4>
                    {#if change.implementationActions.length === 0}
                      <p class="information-empty">No implementation actions recorded.</p>
                    {:else}
                      {#each change.implementationActions as action}
                        <div class="change-detail-row">
                          <strong>{action.status} · {action.actionType}</strong>
                          <p>{action.description}</p>
                        </div>
                      {/each}
                    {/if}
                  </section>

                  <section>
                    <h4>Verification &amp; discrepancies</h4>
                    {#each change.verifications as verification}
                      <div class="change-detail-row">
                        <strong>{verification.outcome} · {verification.verifierName}</strong>
                        <span>{dateTime(verification.verifiedAt)}</span>
                        <p>{verification.notes}</p>
                      </div>
                    {/each}
                    {#each change.discrepancies as discrepancy}
                      <div class="change-detail-row">
                        <strong>{discrepancy.status} discrepancy</strong>
                        <p>{discrepancy.description}</p>
                      </div>
                    {/each}
                    {#if change.verifications.length === 0 && change.discrepancies.length === 0}
                      <p class="information-empty">No verification evidence or discrepancies recorded.</p>
                    {/if}
                  </section>
                </div>

                <div class="change-history">
                  {#each change.history as history}
                    <div>
                      <span>{history.status}</span>
                      <strong>{dateTime(history.recordedAt)}</strong>
                      <small>{history.actorName ?? 'System'}{history.note ? ` · ${history.note}` : ''}</small>
                    </div>
                  {/each}
                </div>
              </details>
            </article>
          {/each}
        {/if}
      </div>
    </div>

    <aside class="configuration-secondary">
      <section class="configuration-panel">
        <header>
          <p class="app-eyebrow">Configuration status</p>
          <h2>Configuration items</h2>
        </header>
        <div class="configuration-item-list">
          {#if data.projection.configurationItems.length === 0}
            <p class="information-empty">No Configuration Items exist yet.</p>
          {:else}
            {#each data.projection.configurationItems as item}
              <div>
                <span>{item.status}</span>
                <strong>{item.code}</strong>
                <p>{item.name}</p>
                <small>{item.objectType} · {item.stableKey}</small>
              </div>
            {/each}
          {/if}
        </div>
      </section>

      <section class="configuration-panel">
        <header>
          <p class="app-eyebrow">Frozen configuration</p>
          <h2>Baselines</h2>
        </header>
        <div class="baseline-list">
          {#if data.projection.baselines.length === 0}
            <p class="information-empty">No Baselines exist yet.</p>
          {:else}
            {#each data.projection.baselines as baseline}
              <article>
                <div>
                  <span>{baseline.status}</span>
                  <strong>{baseline.code}</strong>
                </div>
                <h3>{baseline.name}</h3>
                <p>{baseline.contextObjectType} · {baseline.contextStableKey}</p>
                {#if baseline.establishedAt}
                  <small>Established {dateTime(baseline.establishedAt)}</small>
                {/if}
                <div class="baseline-items">
                  {#each baseline.items as item}
                    <span>{item.configurationItemCode} · v{item.subjectVersion}</span>
                  {/each}
                </div>
              </article>
            {/each}
          {/if}
        </div>
      </section>

      <section class="configuration-panel">
        <header>
          <p class="app-eyebrow">Applicability</p>
          <h2>Effectivity</h2>
        </header>
        <div class="effectivity-list">
          {#if data.projection.effectivities.length === 0}
            <p class="information-empty">No Effectivity rules exist yet.</p>
          {:else}
            {#each data.projection.effectivities as effectivity}
              <div>
                <span>{effectivity.status}</span>
                <strong>{effectivity.configurationItemCode} · v{effectivity.subjectVersion}</strong>
                <p>{effectivity.effectivityType} · {effectivity.scopeType}{effectivity.scopeId ? ` · ${effectivity.scopeId}` : ''}</p>
              </div>
            {/each}
          {/if}
        </div>
      </section>
    </aside>
  </section>
{/if}
