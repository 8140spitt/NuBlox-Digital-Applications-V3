<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  function dateTime(value: string) {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }
</script>

<svelte:head>
  <title>Information — NuBlox</title>
</svelte:head>

{#if !data.allowed || !data.projection}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit Information control.</h1>
      <p>
        NuBlox evaluated <code>platform.configuration.read</code> in the current tenant scope and
        did not find an active matching Access Role Assignment.
      </p>
      <p class="permission-reason">{data.reason}</p>
      <div class="permission-actions">
        <a
          class="primary-action permission-back"
          href="/app/request-access?permission=platform.configuration.read&returnTo=/app/information"
        >
          Request access <span aria-hidden="true">→</span>
        </a>
        <a class="quiet-link" href="/app">Back to Functions</a>
      </div>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact information-hero">
    <div>
      <p class="app-eyebrow">NTE-005 · governed work product control</p>
      <h1>Information, Revision &amp; Representation</h1>
      <p class="workspace-lede">
        Create the authoritative information object, control exact revisions and iterations,
        preserve native and derived Representations, then release and issue the exact governed
        version through Decision and Authority.
      </p>
    </div>
  </section>

  {#if form?.message || form?.error}
    <div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
      <strong>{form?.ok ? 'Completed' : 'Action not completed'}</strong>
      <span>{form?.message ?? form?.error}</span>
    </div>
  {/if}

  <section class="architecture-metrics information-metrics" aria-label="Information totals">
    <article>
      <span>Containers</span>
      <strong>{data.projection.totals.containers}</strong>
      <p>Authoritative information objects</p>
    </article>
    <article>
      <span>Revisions</span>
      <strong>{data.projection.totals.revisions}</strong>
      <p>Controlled version states</p>
    </article>
    <article>
      <span>Representations</span>
      <strong>{data.projection.totals.representations}</strong>
      <p>Native and derived formats</p>
    </article>
    <article>
      <span>Issues</span>
      <strong>{data.projection.totals.issues}</strong>
      <p>Recorded information issues</p>
    </article>
  </section>

  {#if data.canManage}
    <section class="information-admin">
      <header class="information-admin-heading">
        <div>
          <p class="app-eyebrow">Controlled authoring</p>
          <h2>Work product commands</h2>
        </div>
        <p>
          Commands operate the canonical revision chain. Release requires an APPROVED Decision
          backed by an effective Authority Grant.
        </p>
      </header>

      <div class="information-command-grid">
        <details>
          <summary><span>01</span><strong>Create information</strong></summary>
          <form method="POST" action="?/createContainer" class="admin-form">
            <label>
              <span>Type</span>
              <input name="containerType" required maxlength="120" placeholder="DRAWING" />
            </label>
            <label>
              <span>Code</span>
              <input name="code" required maxlength="160" placeholder="A-1001" />
            </label>
            <label class="information-wide">
              <span>Title</span>
              <input name="title" required maxlength="255" />
            </label>
            <button type="submit">Create information <span>→</span></button>
          </form>
        </details>

        <details>
          <summary><span>02</span><strong>Create revision</strong></summary>
          <form method="POST" action="?/createRevision" class="admin-form">
            <label class="information-wide">
              <span>Information</span>
              <select name="informationContainerId" required>
                <option value="">Select information</option>
                {#each data.projection.containers as container}
                  <option value={container.id}>{container.code} · {container.title}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Revision</span>
              <input name="revision" required maxlength="120" placeholder="A" />
            </label>
            <button type="submit" disabled={data.projection.containers.length === 0}>
              Create revision <span>→</span>
            </button>
          </form>
        </details>

        <details>
          <summary><span>03</span><strong>New iteration</strong></summary>
          <form method="POST" action="?/createIteration" class="admin-form">
            <label class="information-wide">
              <span>Draft revision</span>
              <select name="informationRevisionId" required>
                <option value="">Select draft revision</option>
                {#each data.projection.containers as container}
                  {#each container.revisions.filter((revision) => revision.status === 'DRAFT') as revision}
                    <option value={revision.id}>{container.code} · Rev {revision.revision}</option>
                  {/each}
                {/each}
              </select>
            </label>
            <button type="submit">Create next iteration <span>→</span></button>
          </form>
        </details>

        <details>
          <summary><span>04</span><strong>Add representation</strong></summary>
          <form method="POST" action="?/createRepresentation" class="admin-form">
            <label class="information-wide">
              <span>Iteration</span>
              <select name="informationIterationId" required>
                <option value="">Select iteration</option>
                {#each data.projection.containers as container}
                  {#each container.revisions as revision}
                    {#each revision.iterations as iteration}
                      <option value={iteration.id}>
                        {container.code} · Rev {revision.revision} · Iter {iteration.iteration} · {iteration.status}
                      </option>
                    {/each}
                  {/each}
                {/each}
              </select>
            </label>
            <label>
              <span>Representation type</span>
              <select name="representationType" required>
                <option value="NATIVE">Native</option>
                <option value="PDF">PDF</option>
                <option value="IMAGE">Image</option>
                <option value="DATA">Data</option>
                <option value="REPORT">Report</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label>
              <span>Media type</span>
              <input name="mediaType" required maxlength="255" placeholder="application/pdf" />
            </label>
            <label>
              <span>File name</span>
              <input name="fileName" maxlength="512" />
            </label>
            <label>
              <span>Integrity hash</span>
              <input name="integrityHash" maxlength="255" placeholder="sha256:…" />
            </label>
            <label class="information-wide">
              <span>Content reference</span>
              <input name="contentReference" required maxlength="1024" placeholder="urn:nublox:…" />
            </label>
            <button type="submit">Record representation <span>→</span></button>
          </form>
        </details>

        <details>
          <summary><span>05</span><strong>Freeze iteration</strong></summary>
          <form method="POST" action="?/freezeIteration" class="admin-form">
            <label class="information-wide">
              <span>Working iteration</span>
              <select name="iterationId" required>
                <option value="">Select working iteration</option>
                {#each data.projection.containers as container}
                  {#each container.revisions as revision}
                    {#each revision.iterations.filter((iteration) => iteration.status === 'WORKING') as iteration}
                      <option value={iteration.id}>
                        {container.code} · Rev {revision.revision} · Iter {iteration.iteration}
                      </option>
                    {/each}
                  {/each}
                {/each}
              </select>
            </label>
            <button type="submit">Freeze iteration <span>→</span></button>
          </form>
        </details>

        <details>
          <summary><span>06</span><strong>Release revision</strong></summary>
          <form method="POST" action="?/releaseRevision" class="admin-form">
            <label class="information-wide">
              <span>Draft revision</span>
              <select name="informationRevisionId" required>
                <option value="">Select draft revision</option>
                {#each data.projection.containers as container}
                  {#each container.revisions.filter((revision) => revision.status === 'DRAFT') as revision}
                    <option value={revision.id}>{container.code} · Rev {revision.revision}</option>
                  {/each}
                {/each}
              </select>
            </label>
            <label class="information-wide">
              <span>Frozen iteration</span>
              <select name="releasedIterationId" required>
                <option value="">Select frozen iteration</option>
                {#each data.projection.containers as container}
                  {#each container.revisions as revision}
                    {#each revision.iterations.filter((iteration) => iteration.status === 'FROZEN') as iteration}
                      <option value={iteration.id}>
                        {container.code} · Rev {revision.revision} · Iter {iteration.iteration}
                      </option>
                    {/each}
                  {/each}
                {/each}
              </select>
            </label>
            <label class="information-wide">
              <span>Approved Authority-backed Decision</span>
              <select name="decisionId" required>
                <option value="">Select Decision</option>
                {#each data.projection.releaseDecisions as decision}
                  <option value={decision.id}>
                    {decision.subjectVersion ?? 'Unversioned'} · {decision.decisionType} · {decision.deciderName}
                  </option>
                {/each}
              </select>
            </label>
            <button type="submit" disabled={data.projection.releaseDecisions.length === 0}>
              Release revision <span>→</span>
            </button>
          </form>
        </details>

        <details>
          <summary><span>07</span><strong>Issue information</strong></summary>
          <form method="POST" action="?/issueInformation" class="admin-form">
            <label class="information-wide">
              <span>Released revision</span>
              <select name="revisionReference" required>
                <option value="">Select released revision</option>
                {#each data.projection.containers as container}
                  {#each container.revisions.filter((revision) => revision.status === 'RELEASED') as revision}
                    <option value={`${container.id}|${revision.id}`}>
                      {container.code} · Rev {revision.revision}
                    </option>
                  {/each}
                {/each}
              </select>
            </label>
            <label class="information-wide">
              <span>Representation</span>
              <select name="representationId">
                <option value="">No specific Representation</option>
                {#each data.projection.containers as container}
                  {#each container.revisions as revision}
                    {#each revision.iterations as iteration}
                      {#each iteration.representations as representation}
                        <option value={representation.id}>
                          {container.code} · Rev {revision.revision} · {representation.representationType} · {representation.fileName ?? representation.id}
                        </option>
                      {/each}
                    {/each}
                  {/each}
                {/each}
              </select>
            </label>
            <label>
              <span>Issue reference</span>
              <input name="issueReference" required maxlength="160" />
            </label>
            <label>
              <span>Purpose</span>
              <input name="issuePurpose" required maxlength="160" placeholder="FOR CONSTRUCTION" />
            </label>
            <label class="information-wide">
              <span>Recipient/context</span>
              <input name="recipientContext" maxlength="512" />
            </label>
            <button type="submit">Record issue <span>→</span></button>
          </form>
        </details>
      </div>
    </section>
  {/if}

  <section class="information-register">
    <header class="information-register-heading">
      <div>
        <p class="app-eyebrow">Authoritative register</p>
        <h2>Information lineage</h2>
      </div>
      <p>Container → Revision → Iteration → Representation, with exact release and issue evidence.</p>
    </header>

    <div class="information-container-list">
      {#if data.projection.containers.length === 0}
        <div class="empty-work-state">
          <p class="app-eyebrow">No information yet</p>
          <h2>Create the first governed work product.</h2>
        </div>
      {:else}
        {#each data.projection.containers as container}
          <article class="information-container-card">
            <header>
              <div>
                <span class="information-type">{container.containerType}</span>
                <h3>{container.code} · {container.title}</h3>
                <p>{container.canonicalObjectId}</p>
              </div>
              <span class:inactive={container.status !== 'ACTIVE'} class="information-status">
                {container.status}
              </span>
            </header>

            <div class="information-revision-list">
              {#if container.revisions.length === 0}
                <p class="information-empty">No revisions exist yet.</p>
              {:else}
                {#each container.revisions as revision}
                  <details open={revision.status === 'DRAFT'}>
                    <summary>
                      <div>
                        <strong>Revision {revision.revision}</strong>
                        <span
                          class:released={revision.status === 'RELEASED'}
                          class="information-revision-status"
                        >
                          {revision.status}
                        </span>
                      </div>
                      <span>
                        {revision.iterations.length} iteration{revision.iterations.length === 1 ? '' : 's'}
                      </span>
                    </summary>

                    <div class="information-revision-detail">
                      <div class="information-revision-meta">
                        <span>Created {dateTime(revision.createdAt)}</span>
                        {#if revision.releasedAt}
                          <span>Released {dateTime(revision.releasedAt)}</span>
                        {/if}
                        {#if revision.releaseDecisionId}
                          <span>Decision {revision.releaseDecisionId}</span>
                        {/if}
                      </div>

                      <div class="information-iteration-list">
                        {#if revision.iterations.length === 0}
                          <span class="information-empty-inline">No iterations exist yet.</span>
                        {:else}
                          {#each revision.iterations as iteration}
                            <article>
                              <header>
                                <div>
                                  <strong>Iteration {iteration.iteration}</strong>
                                  <span>{iteration.status}</span>
                                </div>
                                <small>
                                  {iteration.authorName ?? 'Unattributed'} · {dateTime(iteration.createdAt)}
                                </small>
                              </header>
                              <div class="information-representation-list">
                                {#if iteration.representations.length === 0}
                                  <span class="information-empty-inline">No Representations recorded.</span>
                                {:else}
                                  {#each iteration.representations as representation}
                                    <div>
                                      <span>{representation.representationType}</span>
                                      <strong>{representation.fileName ?? representation.mediaType}</strong>
                                      <small>{representation.contentReference}</small>
                                    </div>
                                  {/each}
                                {/if}
                              </div>
                            </article>
                          {/each}
                        {/if}
                      </div>
                    </div>
                  </details>
                {/each}
              {/if}
            </div>

            {#if container.issues.length > 0}
              <footer class="information-issue-list">
                {#each container.issues as issue}
                  <div>
                    <span>{issue.issueReference}</span>
                    <strong>{issue.issuePurpose}</strong>
                    <small>
                      {issue.issuedByName} · {dateTime(issue.issuedAt)}
                      {#if issue.recipientContext} · {issue.recipientContext}{/if}
                    </small>
                  </div>
                {/each}
              </footer>
            {/if}
          </article>
        {/each}
      {/if}
    </div>
  </section>
{/if}
