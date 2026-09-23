<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  function label(value: string) {
    return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
</script>

<svelte:head>
  <title>Exchange Control — NuBlox</title>
</svelte:head>

{#if !data.allowed || !data.projection}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit Exchange Control access.</h1>
      <p>NuBlox evaluated <code>platform.exchange.read</code> in the current tenant scope.</p>
      <p class="permission-reason">{data.reason}</p>
      <div class="permission-actions">
        <a class="primary-action permission-back" href="/app/request-access?permission=platform.exchange.read&returnTo=/app/exchange">
          Request access <span aria-hidden="true">→</span>
        </a>
        <a class="quiet-link" href="/app/deliverables">Back to Deliverables</a>
      </div>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact">
    <div>
      <p class="app-eyebrow">Controlled information exchange</p>
      <h1>Exchange Control</h1>
      <p class="workspace-lede">
        Package exact governed objects, dispatch immutable exchange snapshots, record recipient-side
        receipt and mapping, import under explicit evidence, and transfer master authority only through
        a separate approved Decision.
      </p>
    </div>
  </section>

  {#if form?.message || form?.error}
    <div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
      <strong>{form?.ok ? 'Completed' : 'Action not completed'}</strong>
      <span>{form?.message ?? form?.error}</span>
    </div>
  {/if}

  <section class="architecture-metrics" aria-label="Exchange totals">
    <article><span>Packages</span><strong>{data.projection.totals.packages}</strong><p>{data.projection.totals.frozenPackages} frozen snapshots</p></article>
    <article><span>Deliveries</span><strong>{data.projection.totals.deliveries}</strong><p>Outbound dispatch events</p></article>
    <article><span>Received</span><strong>{data.projection.totals.received}</strong><p>{data.projection.totals.imported} imported · {data.projection.totals.rejected} rejected</p></article>
    <article><span>Authority adoptions</span><strong>{data.projection.totals.adoptions}</strong><p>Explicit approved master transfers</p></article>
  </section>

  <section class="workspace-panel">
    <div class="panel-heading">
      <div>
        <p class="app-eyebrow">Critical invariant</p>
        <h2>Exchange states remain separate</h2>
      </div>
    </div>
    <p>
      <strong>Package ≠ Delivery ≠ Receipt ≠ Acceptance ≠ Import ≠ Authority transfer.</strong>
      A transmittal response can show acceptance, but it does not mark a package received, imported,
      or authoritative in the recipient context.
    </p>
  </section>

  <div class="control-workspace-grid">
    <section class="workspace-panel">
      <div class="panel-heading">
        <div><p class="app-eyebrow">Sender side</p><h2>Outbound package &amp; delivery</h2></div>
        <span>{data.canManage ? 'Manage' : 'Read only'}</span>
      </div>

      {#if !data.canManage}
        <p>
          Outbound changes require <code>platform.exchange.manage</code>.
          <a href="/app/request-access?permission=platform.exchange.manage&returnTo=/app/exchange">Request access</a>.
        </p>
      {:else}
        <details open>
          <summary>Create package</summary>
          <form method="POST" action="?/createPackage" class="admin-form access-form">
            <label><span>Code</span><input name="code" required /></label>
            <label><span>Name</span><input name="name" required /></label>
            <label><span>Purpose</span><input name="purpose" required /></label>
            <label><span>Source system</span><input name="sourceSystem" value="NuBlox" required /></label>
            <label><span>Package version</span><input name="packageVersion" type="number" min="1" value="1" required /></label>
            <label>
              <span>Source context</span>
              <select name="sourceContextObjectId">
                <option value="">No context</option>
                {#each data.projection.canonicalObjects as item}
                  <option value={item.id}>{item.objectType} · {item.stableKey}</option>
                {/each}
              </select>
            </label>
            <button type="submit">Create Package <span>→</span></button>
          </form>
        </details>

        <details>
          <summary>Add exact package item</summary>
          <form method="POST" action="?/addPackageItem" class="admin-form access-form">
            <label>
              <span>Draft package</span>
              <select name="packageId" required>
                <option value="">Select package</option>
                {#each data.projection.packages.filter((item) => item.status === 'DRAFT') as item}
                  <option value={item.id}>{item.code} v{item.packageVersion}</option>
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
            <label><span>Exact version</span><input name="subjectVersion" /></label>
            <label><span>Item role</span><input name="itemRole" value="PRIMARY" required /></label>
            <label><span>Representation ID</span><input name="representationId" /></label>
            <label><span>External Identity ID</span><input name="externalIdentityId" /></label>
            <label><span>Checksum</span><input name="itemChecksum" /></label>
            <button type="submit">Add Package Item <span>→</span></button>
          </form>
        </details>

        <details>
          <summary>Freeze package snapshot</summary>
          <form method="POST" action="?/freezePackage" class="admin-form access-form">
            <label>
              <span>Draft package</span>
              <select name="packageId" required>
                <option value="">Select package</option>
                {#each data.projection.packages.filter((item) => item.status === 'DRAFT') as item}
                  <option value={item.id}>{item.code} v{item.packageVersion} · {item.items.length} item(s)</option>
                {/each}
              </select>
            </label>
            <label><span>Package checksum</span><input name="packageChecksum" required /></label>
            <button type="submit">Freeze Snapshot <span>→</span></button>
          </form>
        </details>

        <details>
          <summary>Dispatch frozen package</summary>
          <form method="POST" action="?/dispatch" class="admin-form access-form">
            <label>
              <span>Frozen package</span>
              <select name="packageId" required>
                <option value="">Select package</option>
                {#each data.projection.packages.filter((item) => item.status === 'FROZEN') as item}
                  <option value={item.id}>{item.code} v{item.packageVersion}</option>
                {/each}
              </select>
            </label>
            <label><span>Delivery reference</span><input name="deliveryReference" required /></label>
            <label><span>Delivery sequence</span><input name="deliverySequence" type="number" min="1" value="1" required /></label>
            <label>
              <span>Prior delivery</span>
              <select name="priorDeliveryId">
                <option value="">Full delivery / no base</option>
                {#each data.projection.packages as pkg}
                  {#each pkg.deliveries as item}
                    <option value={item.id}>{item.deliveryReference}</option>
                  {/each}
                {/each}
              </select>
            </label>
            <label>
              <span>Transmittal</span>
              <select name="transmittalId">
                <option value="">No linked Transmittal</option>
                {#each data.projection.transmittals as item}
                  <option value={item.id}>{item.issueReference}</option>
                {/each}
              </select>
            </label>
            <label><span>Transport reference</span><input name="transportReference" /></label>
            <label><span>Delivery checksum</span><input name="deliveryChecksum" /></label>
            <button type="submit">Dispatch Delivery <span>→</span></button>
          </form>
        </details>

        <details>
          <summary>Add delivery recipient</summary>
          <form method="POST" action="?/addRecipient" class="admin-form access-form">
            <label>
              <span>Delivery</span>
              <select name="deliveryId" required>
                <option value="">Select delivery</option>
                {#each data.projection.packages as pkg}
                  {#each pkg.deliveries as item}
                    <option value={item.id}>{item.deliveryReference}</option>
                  {/each}
                {/each}
              </select>
            </label>
            <label>
              <span>Recipient party</span>
              <select name="recipientPartyId" required>
                <option value="">Select party</option>
                {#each data.projection.parties as item}
                  <option value={item.id}>{item.displayName} · {item.kind}</option>
                {/each}
              </select>
            </label>
            <label><span>Target system</span><input name="targetSystem" /></label>
            <label>
              <span>Target context</span>
              <select name="targetContextObjectId">
                <option value="">No target context</option>
                {#each data.projection.canonicalObjects as item}
                  <option value={item.id}>{item.objectType} · {item.stableKey}</option>
                {/each}
              </select>
            </label>
            <label><span>Target reference</span><input name="targetReference" /></label>
            <label>
              <span>Transmittal recipient</span>
              <select name="transmittalRecipientId">
                <option value="">No linked Transmittal recipient</option>
                {#each data.projection.transmittalRecipients as item}
                  <option value={item.id}>{item.id}</option>
                {/each}
              </select>
            </label>
            <button type="submit">Add Recipient <span>→</span></button>
          </form>
        </details>

        <details>
          <summary>Record full/incremental delta</summary>
          <form method="POST" action="?/addDelta" class="admin-form access-form">
            <label>
              <span>Delivery</span>
              <select name="deliveryId" required>
                <option value="">Select delivery</option>
                {#each data.projection.packages as pkg}
                  {#each pkg.deliveries as item}
                    <option value={item.id}>{item.deliveryReference}</option>
                  {/each}
                {/each}
              </select>
            </label>
            <label>
              <span>Subject object</span>
              <select name="subjectObjectId" required>
                <option value="">Select subject</option>
                {#each data.projection.canonicalObjects as item}
                  <option value={item.id}>{item.objectType} · {item.stableKey}</option>
                {/each}
              </select>
            </label>
            <label>
              <span>Current package item</span>
              <select name="packageItemId">
                <option value="">None — required for deleted/absent</option>
                {#each data.projection.packages as pkg}
                  {#each pkg.items as item}
                    <option value={item.id}>{pkg.code} · {item.subjectKey} {item.subjectVersion ?? ''}</option>
                  {/each}
                {/each}
              </select>
            </label>
            <label>
              <span>Delta type</span>
              <select name="deltaType" required>
                <option value="NEW">New</option>
                <option value="CHANGED">Changed</option>
                <option value="MOVED">Moved</option>
                <option value="DELETED">Deleted</option>
                <option value="ABSENT">Absent</option>
              </select>
            </label>
            <label>
              <span>Prior delivery</span>
              <select name="priorDeliveryId">
                <option value="">No base</option>
                {#each data.projection.packages as pkg}
                  {#each pkg.deliveries as item}
                    <option value={item.id}>{item.deliveryReference}</option>
                  {/each}
                {/each}
              </select>
            </label>
            <label><span>Prior subject version</span><input name="priorSubjectVersion" /></label>
            <label><span>Prior location</span><input name="priorLocationReference" /></label>
            <label><span>Current location</span><input name="currentLocationReference" /></label>
            <label class="wide-field"><span>Details</span><textarea name="details" rows="2"></textarea></label>
            <button type="submit">Record Delta <span>→</span></button>
          </form>
        </details>
      {/if}
    </section>

    <section class="workspace-panel">
      <div class="panel-heading">
        <div><p class="app-eyebrow">Recipient side</p><h2>Receipt, mapping &amp; import</h2></div>
        <span>{data.canReceive ? 'Process' : 'Read only'}</span>
      </div>

      {#if !data.canReceive}
        <p>
          Recipient processing requires <code>platform.exchange.receive</code>.
          <a href="/app/request-access?permission=platform.exchange.receive&returnTo=/app/exchange">Request access</a>.
        </p>
      {:else}
        <details open>
          <summary>Record receipt</summary>
          <form method="POST" action="?/receive" class="admin-form access-form">
            <label>
              <span>Exchange recipient</span>
              <select name="recipientId" required>
                <option value="">Select recipient</option>
                {#each data.projection.packages as pkg}
                  {#each pkg.deliveries as delivery}
                    {#each delivery.recipients.filter((item) => !item.received) as item}
                      <option value={item.id}>{delivery.deliveryReference} · {item.recipientName}</option>
                    {/each}
                  {/each}
                {/each}
              </select>
            </label>
            <label>
              <span>Delivery</span>
              <select name="deliveryId" required>
                <option value="">Select matching delivery</option>
                {#each data.projection.packages as pkg}
                  {#each pkg.deliveries as item}
                    <option value={item.id}>{item.deliveryReference}</option>
                  {/each}
                {/each}
              </select>
            </label>
            <label><span>Received package checksum</span><input name="receivedPackageChecksum" /></label>
            <button type="submit">Record Receipt <span>→</span></button>
          </form>
        </details>

        <details>
          <summary>Validate receipt</summary>
          <form method="POST" action="?/validate" class="admin-form access-form">
            <label>
              <span>Received Delivery</span>
              <select name="receivedDeliveryId" required>
                <option value="">Select received record</option>
                {#each data.projection.packages as pkg}
                  {#each pkg.deliveries as delivery}
                    {#each delivery.recipients.filter((item) => item.received?.status === 'RECEIVED') as item}
                      <option value={item.received?.id}>{delivery.deliveryReference} · {item.recipientName}</option>
                    {/each}
                  {/each}
                {/each}
              </select>
            </label>
            <button type="submit">Validate <span>→</span></button>
          </form>
        </details>

        <details>
          <summary>Add semantic mapping</summary>
          <form method="POST" action="?/addMapping" class="admin-form access-form">
            <label>
              <span>Validated/Mapped Delivery</span>
              <select name="receivedDeliveryId" required>
                <option value="">Select received record</option>
                {#each data.projection.packages as pkg}
                  {#each pkg.deliveries as delivery}
                    {#each delivery.recipients.filter((item) => item.received && ['VALIDATED','MAPPED'].includes(item.received.status)) as item}
                      <option value={item.received?.id}>{delivery.deliveryReference} · {item.recipientName}</option>
                    {/each}
                  {/each}
                {/each}
              </select>
            </label>
            <label>
              <span>Mapping type</span>
              <select name="mappingType" required>
                <option value="CONTEXT">Context</option>
                <option value="ORGANISATION">Organisation</option>
                <option value="VIEW">View</option>
                <option value="LIFECYCLE">Lifecycle</option>
                <option value="FOLDER">Folder</option>
                <option value="SECURITY_LABEL">Security label</option>
                <option value="CLASSIFICATION">Classification</option>
                <option value="TYPE">Type</option>
                <option value="VERSION">Version</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </label>
            <label><span>Source value</span><input name="sourceValue" required /></label>
            <label><span>Target value</span><input name="targetValue" required /></label>
            <label>
              <span>Target object</span>
              <select name="targetObjectId">
                <option value="">No target object</option>
                {#each data.projection.canonicalObjects as item}
                  <option value={item.id}>{item.objectType} · {item.stableKey}</option>
                {/each}
              </select>
            </label>
            <label><span>Notes</span><input name="notes" /></label>
            <button type="submit">Add Mapping <span>→</span></button>
          </form>
        </details>

        <details>
          <summary>Complete mapping / import / reject</summary>
          <form method="POST" action="?/markMapped" class="admin-form access-form">
            <label>
              <span>Validated Delivery</span>
              <select name="receivedDeliveryId" required>
                <option value="">Select received record</option>
                {#each data.projection.packages as pkg}
                  {#each pkg.deliveries as delivery}
                    {#each delivery.recipients.filter((item) => item.received?.status === 'VALIDATED') as item}
                      <option value={item.received?.id}>{delivery.deliveryReference} · {item.recipientName}</option>
                    {/each}
                  {/each}
                {/each}
              </select>
            </label>
            <button type="submit">Complete Mapping <span>→</span></button>
          </form>

          <form method="POST" action="?/importDelivery" class="admin-form access-form">
            <label>
              <span>Mapped Delivery</span>
              <select name="receivedDeliveryId" required>
                <option value="">Select received record</option>
                {#each data.projection.packages as pkg}
                  {#each pkg.deliveries as delivery}
                    {#each delivery.recipients.filter((item) => item.received?.status === 'MAPPED') as item}
                      <option value={item.received?.id}>{delivery.deliveryReference} · {item.recipientName}</option>
                    {/each}
                  {/each}
                {/each}
              </select>
            </label>
            <label><span>Import reference</span><input name="importReference" required /></label>
            <button type="submit">Record Import <span>→</span></button>
          </form>

          <form method="POST" action="?/rejectDelivery" class="admin-form access-form">
            <label>
              <span>Open Received Delivery</span>
              <select name="receivedDeliveryId" required>
                <option value="">Select received record</option>
                {#each data.projection.packages as pkg}
                  {#each pkg.deliveries as delivery}
                    {#each delivery.recipients.filter((item) => item.received && ['RECEIVED','VALIDATED','MAPPED'].includes(item.received.status)) as item}
                      <option value={item.received?.id}>{delivery.deliveryReference} · {item.recipientName}</option>
                    {/each}
                  {/each}
                {/each}
              </select>
            </label>
            <label><span>Reason</span><input name="reason" required /></label>
            <button type="submit">Reject Delivery <span>→</span></button>
          </form>
        </details>
      {/if}

      <details open>
        <summary>Adopt master authority</summary>
        {#if !data.canAdopt}
          <p>
            Authority transfer requires <code>platform.exchange.authority_adopt</code>.
            <a href="/app/request-access?permission=platform.exchange.authority_adopt&returnTo=/app/exchange">Request access</a>.
          </p>
        {:else}
          <form method="POST" action="?/adoptAuthority" class="admin-form access-form">
            <label>
              <span>Imported Received Delivery</span>
              <select name="receivedDeliveryId" required>
                <option value="">Select imported delivery</option>
                {#each data.projection.packages as pkg}
                  {#each pkg.deliveries as delivery}
                    {#each delivery.recipients.filter((item) => item.received?.status === 'IMPORTED') as item}
                      <option value={item.received?.id}>{delivery.deliveryReference} · {item.recipientName}</option>
                    {/each}
                  {/each}
                {/each}
              </select>
            </label>
            <label>
              <span>Source subject</span>
              <select name="sourceSubjectObjectId" required>
                <option value="">Select source object</option>
                {#each data.projection.canonicalObjects as item}
                  <option value={item.id}>{item.objectType} · {item.stableKey}</option>
                {/each}
              </select>
            </label>
            <label><span>Source version</span><input name="sourceSubjectVersion" /></label>
            <label>
              <span>Target canonical object</span>
              <select name="targetCanonicalObjectId" required>
                <option value="">Select target object</option>
                {#each data.projection.canonicalObjects as item}
                  <option value={item.id}>{item.objectType} · {item.stableKey}</option>
                {/each}
              </select>
            </label>
            <label><span>Target version</span><input name="targetSubjectVersion" /></label>
            <label><span>Source authority</span><input name="sourceAuthority" required /></label>
            <label><span>Target authority</span><input name="targetAuthority" required /></label>
            <label>
              <span>Approved Decision</span>
              <select name="decisionId" required>
                <option value="">Select Decision</option>
                {#each data.projection.decisions.filter((item) => item.outcome === 'APPROVED') as item}
                  <option value={item.id}>{item.decisionType} · {item.subjectObjectId} {item.subjectVersion ?? ''}</option>
                {/each}
              </select>
            </label>
            <button type="submit">Adopt Authority <span>→</span></button>
          </form>
        {/if}
      </details>
    </section>
  </div>

  <section class="workspace-panel">
    <div class="panel-heading">
      <div><p class="app-eyebrow">Exchange evidence</p><h2>Package and delivery register</h2></div>
      <span>{data.projection.packages.length}</span>
    </div>
    {#if data.projection.packages.length === 0}
      <p class="control-empty">No Exchange Packages exist yet.</p>
    {:else}
      <div class="control-record-list">
        {#each data.projection.packages as pkg}
          <article>
            <header><span>{pkg.sourceSystem}</span><strong>{pkg.status} · v{pkg.packageVersion}</strong></header>
            <h3>{pkg.code} — {pkg.name}</h3>
            <p>{pkg.purpose}</p>
            <footer>
              <span>{pkg.items.length} exact item(s)</span>
              <span>{pkg.deliveries.length} delivery event(s)</span>
              {#if pkg.packageChecksum}<span>{pkg.packageChecksum}</span>{/if}
            </footer>
          </article>

          {#each pkg.deliveries as delivery}
            <div class="access-assignment-list">
              <article>
                <div><span>Delivery</span><strong>{delivery.deliveryReference}</strong></div>
                <div><span>State</span><strong>{delivery.status}</strong></div>
                <div><span>Base</span><strong>{delivery.priorDeliveryId ?? 'Full delivery'}</strong></div>
                <div><span>Delta</span><strong>{delivery.deltas.length} item(s)</strong></div>
              </article>
              {#each delivery.recipients as recipient}
                <article>
                  <div><span>Recipient</span><strong>{recipient.recipientName}</strong></div>
                  <div><span>Acceptance</span><strong>{recipient.response?.outcome ?? 'Separate / not recorded'}</strong></div>
                  <div><span>Receipt</span><strong>{recipient.received?.status ?? 'Not received'}</strong></div>
                  <div><span>Mappings</span><strong>{recipient.received?.mappings.length ?? 0}</strong></div>
                  <div><span>Authority</span><strong>{recipient.received?.adoptions.length ?? 0} adoption(s)</strong></div>
                </article>
              {/each}
            </div>
          {/each}
        {/each}
      </div>
    {/if}
  </section>
{/if}
