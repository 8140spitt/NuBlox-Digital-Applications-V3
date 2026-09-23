<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Integration &amp; Publication Control — NuBlox</title>
</svelte:head>

{#if !data.allowed || !data.projection}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit Integration Control access.</h1>
      <p>NuBlox evaluated <code>platform.integration.read</code> in the current tenant scope.</p>
      <p class="permission-reason">{data.reason}</p>
      <div class="permission-actions">
        <a
          class="primary-action permission-back"
          href="/app/request-access?permission=platform.integration.read&returnTo=/app/integration"
        >
          Request access <span aria-hidden="true">→</span>
        </a>
        <a class="quiet-link" href="/app/exchange">Back to Exchange Control</a>
      </div>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact">
    <div>
      <p class="app-eyebrow">Closed-loop system integration</p>
      <h1>Integration &amp; Publication Control</h1>
      <p class="workspace-lede">
        Govern target endpoints, source-of-record authority, exact outbound payloads,
        publication attempts, acknowledgements and downstream business outcomes without
        treating transport delivery as business completion.
      </p>
    </div>
  </section>

  {#if form?.message || form?.error}
    <div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
      <strong>{form?.ok ? 'Completed' : 'Action not completed'}</strong>
      <span>{form?.message ?? form?.error}</span>
    </div>
  {/if}

  <section class="architecture-metrics" aria-label="Integration totals">
    <article>
      <span>Endpoints</span>
      <strong>{data.projection.totals.endpoints}</strong>
      <p>{data.projection.totals.rules} source-authority rule(s)</p>
    </article>
    <article>
      <span>Transactions</span>
      <strong>{data.projection.totals.transactions}</strong>
      <p>{data.projection.totals.awaitingResults} awaiting business result</p>
    </article>
    <article>
      <span>Succeeded</span>
      <strong>{data.projection.totals.succeeded}</strong>
      <p>Closed-loop business completion</p>
    </article>
    <article>
      <span>Failures</span>
      <strong>{data.projection.totals.failed}</strong>
      <p>{data.projection.totals.transportFailures} transport failure(s)</p>
    </article>
  </section>

  <section class="workspace-panel">
    <div class="panel-heading">
      <div>
        <p class="app-eyebrow">Critical invariant</p>
        <h2>Transport state is not business state</h2>
      </div>
    </div>
    <p>
      <strong>Outbox published ≠ payload sent ≠ acknowledgement received ≠ business object applied ≠ source authority.</strong>
      A Publication Transaction remains open after a positive acknowledgement until the downstream
      business result is recorded against the exact acknowledged attempt.
    </p>
  </section>

  <div class="control-workspace-grid">
    <section class="workspace-panel">
      <div class="panel-heading">
        <div>
          <p class="app-eyebrow">Governance</p>
          <h2>Endpoint &amp; source authority</h2>
        </div>
        <span>{data.canManageEndpoints || data.canManageAuthority ? 'Manage' : 'Read only'}</span>
      </div>

      <details open>
        <summary>Create integration endpoint</summary>
        {#if !data.canManageEndpoints}
          <p>
            Endpoint administration requires <code>platform.integration.manage</code>.
            <a href="/app/request-access?permission=platform.integration.manage&returnTo=/app/integration">Request access</a>.
          </p>
        {:else}
          <form method="POST" action="?/createEndpoint" class="admin-form access-form">
            <label><span>Code</span><input name="code" required /></label>
            <label><span>Name</span><input name="name" required /></label>
            <label>
              <span>Endpoint type</span>
              <select name="endpointType" required>
                <option value="ERP">ERP</option>
                <option value="MES">MES</option>
                <option value="API">API</option>
                <option value="WEBHOOK">Webhook</option>
                <option value="FILE">File</option>
                <option value="MESSAGE_BUS">Message bus</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </label>
            <label>
              <span>Direction</span>
              <select name="direction" required>
                <option value="OUTBOUND">Outbound</option>
                <option value="BIDIRECTIONAL">Bidirectional</option>
              </select>
            </label>
            <label>
              <span>Transport</span>
              <select name="transportProtocol" required>
                <option value="HTTPS">HTTPS</option>
                <option value="HTTP">HTTP</option>
                <option value="SFTP">SFTP</option>
                <option value="AMQP">AMQP</option>
                <option value="KAFKA">Kafka</option>
                <option value="FILE">File</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </label>
            <label><span>System name</span><input name="systemName" required /></label>
            <label><span>Endpoint / secret reference</span><input name="endpointReference" required /></label>
            <label>
              <span>Recipient party</span>
              <select name="recipientPartyId">
                <option value="">No recipient party</option>
                {#each data.projection.parties as item}
                  <option value={item.id}>{item.displayName} · {item.kind}</option>
                {/each}
              </select>
            </label>
            <label class="wide-field">
              <span>Capabilities</span>
              <input name="capabilities" placeholder="INFORMATION_CONTAINER, CHANGE, PART" />
            </label>
            <button type="submit">Create Endpoint <span>→</span></button>
          </form>
        {/if}
      </details>

      <details>
        <summary>Create source-authority rule</summary>
        {#if !data.canManageAuthority}
          <p>
            Authority administration requires <code>platform.source_authority.manage</code>.
            <a href="/app/request-access?permission=platform.source_authority.manage&returnTo=/app/integration">Request access</a>.
          </p>
        {:else}
          <form method="POST" action="?/createAuthorityRule" class="admin-form access-form">
            <label><span>Code</span><input name="code" required /></label>
            <label><span>Name</span><input name="name" required /></label>
            <label>
              <span>Object type</span>
              <input
                name="subjectObjectType"
                list="publication-object-types"
                required
              />
              <datalist id="publication-object-types">
                {#each [...new Set(data.projection.canonicalObjects.map((item) => item.objectType))] as objectType}
                  <option value={objectType}></option>
                {/each}
              </datalist>
            </label>
            <label><span>Attribute path</span><input name="attributePath" placeholder="Optional attribute-level authority" /></label>
            <label>
              <span>Authority owner</span>
              <select name="authorityOwner" required>
                <option value="NUBLOX">NuBlox</option>
                <option value="ENDPOINT">Managed endpoint</option>
                <option value="EXTERNAL">External system</option>
              </select>
            </label>
            <label>
              <span>Managed endpoint</span>
              <select name="endpointId">
                <option value="">Not endpoint-owned</option>
                {#each data.projection.endpoints as item}
                  <option value={item.id}>{item.code} · {item.systemName}</option>
                {/each}
              </select>
            </label>
            <label><span>External authority reference</span><input name="authorityReference" placeholder="Required only for EXTERNAL" /></label>
            <label><span>Priority</span><input name="priority" type="number" min="0" value="0" /></label>
            <label><span>Effective from</span><input name="effectiveFrom" type="datetime-local" /></label>
            <label><span>Effective to</span><input name="effectiveTo" type="datetime-local" /></label>
            <button type="submit">Create Authority Rule <span>→</span></button>
          </form>
        {/if}
      </details>

      <div class="control-record-list">
        {#each data.projection.endpoints as endpoint}
          <article>
            <header>
              <span>{endpoint.endpointType} · {endpoint.transportProtocol}</span>
              <strong>{endpoint.status}</strong>
            </header>
            <h3>{endpoint.code} — {endpoint.name}</h3>
            <p>{endpoint.systemName} · {endpoint.direction}</p>
            <footer>
              <span>{endpoint.recipientName ?? 'No recipient party'}</span>
              <span>ACK required: {endpoint.acknowledgementRequired ? 'Yes' : 'No'}</span>
              <span>Business result required: {endpoint.businessResultRequired ? 'Yes' : 'No'}</span>
            </footer>
          </article>
        {/each}
      </div>

      {#if data.projection.sourceAuthorityRules.length > 0}
        <div class="access-assignment-list">
          {#each data.projection.sourceAuthorityRules as rule}
            <article>
              <div><span>Rule</span><strong>{rule.code}</strong></div>
              <div><span>Subject</span><strong>{rule.subjectObjectType}{rule.attributePath ? ` · ${rule.attributePath}` : ''}</strong></div>
              <div><span>Master</span><strong>{rule.authorityOwner}{rule.endpointName ? ` · ${rule.endpointName}` : ''}</strong></div>
              <div><span>Status</span><strong>{rule.status}</strong></div>
            </article>
          {/each}
        </div>
      {/if}
    </section>

    <section class="workspace-panel">
      <div class="panel-heading">
        <div>
          <p class="app-eyebrow">Execution</p>
          <h2>Publication lifecycle</h2>
        </div>
        <span>{data.canExecute ? 'Execute' : 'Read only'}</span>
      </div>

      {#if !data.canExecute}
        <p>
          Publication execution requires <code>platform.publication.execute</code>.
          <a href="/app/request-access?permission=platform.publication.execute&returnTo=/app/integration">Request access</a>.
        </p>
      {:else}
        <details open>
          <summary>Freeze outbound envelope</summary>
          <form method="POST" action="?/storeEnvelope" class="admin-form access-form">
            <label>
              <span>Endpoint</span>
              <select name="endpointId" required>
                <option value="">Select endpoint</option>
                {#each data.projection.endpoints.filter((item) => item.status === 'ACTIVE') as item}
                  <option value={item.id}>{item.code} · {item.systemName}</option>
                {/each}
              </select>
            </label>
            <label><span>Schema name</span><input name="schemaName" required /></label>
            <label><span>Schema version</span><input name="schemaVersion" value="1.0" required /></label>
            <label><span>Object type</span><input name="objectType" required /></label>
            <label><span>Stable key</span><input name="stableKey" required /></label>
            <label><span>External object ID</span><input name="externalObjectId" /></label>
            <label class="wide-field">
              <span>Canonical JSON payload</span>
              <textarea name="payload" rows="8" required placeholder='{"stableKey":"...","version":"A"}'></textarea>
            </label>
            <button type="submit">Freeze Envelope <span>→</span></button>
          </form>
        </details>

        <details>
          <summary>Queue publication transaction</summary>
          <form method="POST" action="?/createTransaction" class="admin-form access-form">
            <label>
              <span>Endpoint</span>
              <select name="endpointId" required>
                <option value="">Select endpoint</option>
                {#each data.projection.endpoints.filter((item) => item.status === 'ACTIVE') as item}
                  <option value={item.id}>{item.code} · {item.systemName}</option>
                {/each}
              </select>
            </label>
            <label><span>Transaction reference</span><input name="transactionReference" required /></label>
            <label><span>Idempotency key</span><input name="idempotencyKey" required /></label>
            <label>
              <span>Operation</span>
              <select name="operation" required>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="UPSERT">Upsert</option>
                <option value="DELETE">Delete</option>
                <option value="PUBLISH">Publish</option>
                <option value="SYNC">Sync</option>
              </select>
            </label>
            <label>
              <span>Exchange Delivery</span>
              <select name="exchangeDeliveryId">
                <option value="">No linked Exchange Delivery</option>
                {#each data.projection.exchangeDeliveries as item}
                  <option value={item.id}>{item.deliveryReference} · {item.status}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Export Integration Job</span>
              <select name="integrationJobId">
                <option value="">No linked Integration Job</option>
                {#each data.projection.integrationJobs as item}
                  <option value={item.id}>{item.id} · {item.targetSystem ?? 'No target'} · {item.status}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Business resubmission of</span>
              <select name="resubmissionOfTransactionId">
                <option value="">New transaction</option>
                {#each data.projection.transactions.filter((item) => ['FAILED','PARTIALLY_SUCCEEDED'].includes(item.status)) as item}
                  <option value={item.id}>{item.transactionReference} · {item.status}</option>
                {/each}
              </select>
            </label>
            <button type="submit">Queue Transaction <span>→</span></button>
          </form>
        </details>

        <details>
          <summary>Add governed publication activity</summary>
          <form method="POST" action="?/addActivity" class="admin-form access-form">
            <label>
              <span>Queued transaction</span>
              <select name="transactionId" required>
                <option value="">Select transaction</option>
                {#each data.projection.transactions.filter((item) => item.status === 'QUEUED') as item}
                  <option value={item.id}>{item.transactionReference} · {item.endpointName}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Subject object</span>
              <select name="subjectObjectId" required>
                <option value="">Select object</option>
                {#each data.projection.canonicalObjects as item}
                  <option value={item.id}>{item.objectType} · {item.stableKey}</option>
                {/each}
              </select>
            </label>
            <label><span>Subject version</span><input name="subjectVersion" /></label>
            <label>
              <span>Action</span>
              <select name="action" required>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="UPSERT">Upsert</option>
                <option value="DELETE">Delete</option>
                <option value="PUBLISH">Publish</option>
                <option value="SYNC">Sync</option>
              </select>
            </label>
            <label><span>Sequence</span><input name="sequence" type="number" min="1" value="1" required /></label>
            <label>
              <span>Exact outbound envelope</span>
              <select name="dataEnvelopeId" required>
                <option value="">Select envelope</option>
                {#each data.projection.envelopes as item}
                  <option value={item.id}>{item.schemaName} v{item.schemaVersion} · {item.stableKey} · {item.externalSystem ?? 'No endpoint'}</option>
                {/each}
              </select>
            </label>
            <label><span>External Identity ID</span><input name="externalIdentityId" /></label>
            <label>
              <span>Source-authority rule</span>
              <select name="sourceAuthorityRuleId" required>
                <option value="">Select rule</option>
                {#each data.projection.sourceAuthorityRules.filter((item) => item.status === 'ACTIVE') as item}
                  <option value={item.id}>{item.code} · {item.subjectObjectType} · {item.authorityOwner}</option>
                {/each}
              </select>
            </label>
            <button type="submit">Add Activity <span>→</span></button>
          </form>
        </details>

        <details>
          <summary>Start transaction / transport attempt</summary>
          <form method="POST" action="?/startTransaction" class="admin-form access-form">
            <label>
              <span>Queued transaction</span>
              <select name="transactionId" required>
                <option value="">Select transaction</option>
                {#each data.projection.transactions.filter((item) => item.status === 'QUEUED' && item.activities.length > 0) as item}
                  <option value={item.id}>{item.transactionReference} · {item.activities.length} activity(s)</option>
                {/each}
              </select>
            </label>
            <button type="submit">Start Transaction <span>→</span></button>
          </form>

          <form method="POST" action="?/startAttempt" class="admin-form access-form">
            <label>
              <span>Pending / transport-failed activity</span>
              <select name="activityId" required>
                <option value="">Select activity</option>
                {#each data.projection.transactions.filter((item) => ['IN_PROGRESS','AWAITING_RESULTS'].includes(item.status)) as transaction}
                  {#each transaction.activities.filter((item) => ['PENDING','TRANSPORT_FAILED'].includes(item.status)) as activity}
                    <option value={activity.id}>{transaction.transactionReference} · {activity.subjectKey} · {activity.status}</option>
                  {/each}
                {/each}
              </select>
            </label>
            <label><span>Outbox Message ID</span><input name="outboxMessageId" /></label>
            <button type="submit">Start Attempt <span>→</span></button>
          </form>
        </details>

        <details>
          <summary>Record transport outcome</summary>
          <form method="POST" action="?/markSent" class="admin-form access-form">
            <label>
              <span>Started attempt</span>
              <select name="attemptId" required>
                <option value="">Select attempt</option>
                {#each data.projection.transactions as transaction}
                  {#each transaction.activities as activity}
                    {#each activity.attempts.filter((item) => item.status === 'STARTED') as attempt}
                      <option value={attempt.id}>{transaction.transactionReference} · {activity.subjectKey} · attempt {attempt.attemptNumber}</option>
                    {/each}
                  {/each}
                {/each}
              </select>
            </label>
            <label><span>Transport reference</span><input name="transportReference" required /></label>
            <button type="submit">Mark Sent <span>→</span></button>
          </form>

          <form method="POST" action="?/failAttempt" class="admin-form access-form">
            <label>
              <span>Active attempt</span>
              <select name="attemptId" required>
                <option value="">Select attempt</option>
                {#each data.projection.transactions as transaction}
                  {#each transaction.activities as activity}
                    {#each activity.attempts.filter((item) => ['STARTED','SENT'].includes(item.status)) as attempt}
                      <option value={attempt.id}>{transaction.transactionReference} · {activity.subjectKey} · attempt {attempt.attemptNumber}</option>
                    {/each}
                  {/each}
                {/each}
              </select>
            </label>
            <label><span>Error</span><input name="errorMessage" required /></label>
            <label>
              <span>Outcome</span>
              <select name="timedOut">
                <option value="false">Failed</option>
                <option value="true">Timed out</option>
              </select>
            </label>
            <button type="submit">Record Failure <span>→</span></button>
          </form>
        </details>
      {/if}

      <details open>
        <summary>Record acknowledgement / business result</summary>
        {#if !data.canRecordResults}
          <p>
            Downstream result recording requires <code>platform.publication.result_record</code>.
            <a href="/app/request-access?permission=platform.publication.result_record&returnTo=/app/integration">Request access</a>.
          </p>
        {:else}
          <form method="POST" action="?/recordAcknowledgement" class="admin-form access-form">
            <label>
              <span>Sent attempt</span>
              <select name="attemptId" required>
                <option value="">Select attempt</option>
                {#each data.projection.transactions as transaction}
                  {#each transaction.activities as activity}
                    {#each activity.attempts.filter((item) => item.status === 'SENT' && !item.acknowledgement) as attempt}
                      <option value={attempt.id}>{transaction.transactionReference} · {activity.subjectKey} · attempt {attempt.attemptNumber}</option>
                    {/each}
                  {/each}
                {/each}
              </select>
            </label>
            <label>
              <span>Acknowledgement type</span>
              <select name="acknowledgementType" required>
                <option value="RECEIPT">Receipt</option>
                <option value="TRANSPORT">Transport</option>
              </select>
            </label>
            <label>
              <span>Outcome</span>
              <select name="outcome" required>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="NEGATIVE_ACKNOWLEDGEMENT">Negative acknowledgement</option>
              </select>
            </label>
            <label><span>External transaction ID</span><input name="externalTransactionId" /></label>
            <label><span>Message</span><input name="message" /></label>
            <label><span>Diagnostic reference</span><input name="diagnosticReference" /></label>
            <button type="submit">Record Acknowledgement <span>→</span></button>
          </form>

          <form method="POST" action="?/recordResult" class="admin-form access-form">
            <label>
              <span>Acknowledged activity</span>
              <select name="activityId" required>
                <option value="">Select activity</option>
                {#each data.projection.transactions as transaction}
                  {#each transaction.activities.filter((item) => item.status === 'ACKNOWLEDGED' && !item.result) as activity}
                    <option value={activity.id}>{transaction.transactionReference} · {activity.subjectKey}</option>
                  {/each}
                {/each}
              </select>
            </label>
            <label>
              <span>Exact acknowledgement</span>
              <select name="acknowledgementId" required>
                <option value="">Select acknowledgement</option>
                {#each data.projection.transactions as transaction}
                  {#each transaction.activities.filter((item) => item.status === 'ACKNOWLEDGED' && !item.result) as activity}
                    {#each activity.attempts.filter((attempt) => attempt.acknowledgement?.outcome === 'ACKNOWLEDGED') as attempt}
                      <option value={attempt.acknowledgement?.id}>{transaction.transactionReference} · {activity.subjectKey} · attempt {attempt.attemptNumber}</option>
                    {/each}
                  {/each}
                {/each}
              </select>
            </label>
            <label>
              <span>Business outcome</span>
              <select name="outcome" required>
                <option value="APPLIED">Applied</option>
                <option value="NO_CHANGE">No change</option>
                <option value="WARNING">Warning</option>
                <option value="REJECTED">Rejected</option>
                <option value="FAILED">Failed</option>
              </select>
            </label>
            <label><span>External object ID</span><input name="externalObjectId" /></label>
            <label><span>External version</span><input name="externalVersion" /></label>
            <label><span>Result reference</span><input name="resultReference" /></label>
            <label><span>Message</span><input name="message" /></label>
            <label><span>Root cause</span><input name="rootCause" /></label>
            <button type="submit">Record Business Result <span>→</span></button>
          </form>
        {/if}
      </details>
    </section>
  </div>

  <section class="workspace-panel">
    <div class="panel-heading">
      <div>
        <p class="app-eyebrow">Closed-loop evidence</p>
        <h2>Publication transaction register</h2>
      </div>
      <span>{data.projection.transactions.length}</span>
    </div>

    {#if data.projection.transactions.length === 0}
      <p class="control-empty">No governed Publication Transactions exist yet.</p>
    {:else}
      <div class="control-record-list">
        {#each data.projection.transactions as transaction}
          <article>
            <header>
              <span>{transaction.endpointName} · {transaction.operation}</span>
              <strong>{transaction.status}</strong>
            </header>
            <h3>{transaction.transactionReference}</h3>
            <p>
              Requested by {transaction.requesterName}. Idempotency key:
              <code>{transaction.idempotencyKey}</code>
            </p>
            <footer>
              <span>{transaction.activities.length} activity(s)</span>
              <span>{transaction.resubmissionOfTransactionId ? 'Business resubmission' : 'Original transaction'}</span>
              <span>{transaction.completedAt ? 'Business complete' : 'Open'}</span>
            </footer>
          </article>

          {#each transaction.activities as activity}
            <div class="access-assignment-list">
              <article>
                <div><span>Object</span><strong>{activity.subjectType} · {activity.subjectKey}</strong></div>
                <div><span>Action</span><strong>{activity.action}</strong></div>
                <div><span>Authority</span><strong>{activity.authorityOwner} · {activity.authorityRuleCode}</strong></div>
                <div><span>Activity</span><strong>{activity.status}</strong></div>
                <div><span>Attempts</span><strong>{activity.attempts.length}</strong></div>
                <div><span>Business result</span><strong>{activity.result?.outcome ?? 'Not recorded'}</strong></div>
              </article>

              {#each activity.attempts as attempt}
                <article>
                  <div><span>Attempt</span><strong>#{attempt.attemptNumber} · {attempt.status}</strong></div>
                  <div><span>Transport</span><strong>{attempt.transportReference ?? attempt.errorMessage ?? 'Not completed'}</strong></div>
                  <div><span>Acknowledgement</span><strong>{attempt.acknowledgement?.outcome ?? 'Not received'}</strong></div>
                  <div><span>External transaction</span><strong>{attempt.acknowledgement?.externalTransactionId ?? '—'}</strong></div>
                </article>
              {/each}
            </div>
          {/each}
        {/each}
      </div>
    {/if}
  </section>
{/if}
