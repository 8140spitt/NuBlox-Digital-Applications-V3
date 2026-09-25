<script lang="ts">
  import type { ActionData, PageData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Service Delivery — NuBlox</title></svelte:head>

{#if !data.allowed || !data.projection}
<section class="permission-state">
  <div class="permission-state-code">403</div>
  <div>
    <p class="app-eyebrow">Controlled access outcome</p>
    <h1>Your role does not permit Service Delivery access.</h1>
    <p>{data.reason}</p>
    <a class="primary-action" href="/app/request-access?permission=domain.service_delivery.read&returnTo=/app/service-delivery">Request access →</a>
  </div>
</section>
{:else}
<section class="workspace-hero compact">
  <div>
    <p class="app-eyebrow">F12 · Service Delivery &amp; Field Operations</p>
    <h1>Service Planning, Dispatch &amp; Field Execution</h1>
    <p class="workspace-lede">
      Plan service work, schedule and dispatch accountable people, capture field evidence, complete the work and record acceptance in one governed service-order lifecycle.
    </p>
  </div>
</section>

{#if form?.message || form?.error}
<div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
  <strong>{form?.ok ? 'Completed' : 'Action not completed'}</strong>
  <span>{form?.message ?? form?.error}</span>
</div>
{/if}

<section class="architecture-metrics">
  <article><span>Service orders</span><strong>{data.projection.totals.orders}</strong><p>All governed work</p></article>
  <article><span>Scheduled / dispatched</span><strong>{data.projection.totals.scheduled}</strong><p>Ready for field execution</p></article>
  <article><span>In progress</span><strong>{data.projection.totals.inProgress}</strong><p>Active delivery</p></article>
  <article><span>Accepted</span><strong>{data.projection.totals.accepted}</strong><p>Closed with acceptance</p></article>
</section>

<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Canonical boundary</p><h2>Service Order ≠ assignment ≠ execution evidence</h2></div></div>
  <p>A Service Order defines the governed commitment. Assignments control who is scheduled and dispatched. Execution Records preserve what actually happened in the field. Completion and acceptance are explicit lifecycle events rather than implicit status edits.</p>
</section>

<div class="control-workspace-grid">
<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Service demand</p><h2>Create &amp; schedule work</h2></div></div>

  {#if data.canManage}
  <details open>
    <summary>Create Service Order</summary>
    <form method="POST" action="?/createOrder" class="admin-form access-form">
      <label><span>Governed scope</span><select name="scopeObjectId" required><option value="">Select</option>{#each data.projection.scopeObjects as object}<option value={object.id}>{object.objectType} · {object.stableKey}</option>{/each}</select></label>
      <label><span>Order number</span><input name="orderNumber" required /></label>
      <label><span>Title</span><input name="title" required /></label>
      <label><span>Service type</span><select name="serviceType"><option>FIELD_SERVICE</option><option>INSTALLATION</option><option>MAINTENANCE</option><option>REPAIR</option><option>INSPECTION</option><option>PROFESSIONAL_SERVICE</option><option>OTHER</option></select></label>
      <label><span>Priority</span><select name="priority"><option>NORMAL</option><option>LOW</option><option>HIGH</option><option>URGENT</option></select></label>
      <label><span>Service location</span><input name="serviceLocation" /></label>
      <label><span>Requested start</span><input name="requestedStart" type="datetime-local" /></label>
      <label><span>Requested end</span><input name="requestedEnd" type="datetime-local" /></label>
      <label><span>SLA due</span><input name="slaDueAt" type="datetime-local" /></label>
      <label class="wide-field"><span>Description</span><input name="description" /></label>
      <button type="submit">Create Service Order →</button>
    </form>
  </details>
  {/if}

  {#if data.canDispatch}
  <details>
    <summary>Schedule Assignment</summary>
    <form method="POST" action="?/createAssignment" class="admin-form access-form">
      <label><span>Service Order</span><select name="serviceOrderId" required><option value="">Select</option>{#each data.projection.orders.filter((order) => order.status === 'DRAFT' || order.status === 'SCHEDULED') as order}<option value={order.id}>{order.orderNumber} · {order.title}</option>{/each}</select></label>
      <label><span>Assignee</span><select name="assigneePersonId" required><option value="">Select</option>{#each data.projection.people as person}<option value={person.id}>{person.name}</option>{/each}</select></label>
      <label><span>Scheduled start</span><input name="scheduledStart" type="datetime-local" required /></label>
      <label><span>Scheduled end</span><input name="scheduledEnd" type="datetime-local" required /></label>
      <label class="wide-field"><span>Dispatch notes</span><input name="dispatchNotes" /></label>
      <button type="submit">Schedule Assignment →</button>
    </form>
  </details>
  {/if}
</section>

<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Dispatch control</p><h2>Issue &amp; start field work</h2></div></div>

  {#if data.canDispatch}
  <form method="POST" action="?/dispatchAssignment" class="admin-form access-form">
    <label><span>Planned assignment</span><select name="assignmentId" required><option value="">Select</option>{#each data.projection.orders as order}{#each order.assignments.filter((assignment) => assignment.status === 'PLANNED') as assignment}<option value={assignment.id}>{order.orderNumber} · {assignment.assigneeName}</option>{/each}{/each}</select></label>
    <button type="submit">Dispatch Work →</button>
  </form>
  {/if}

  {#if data.canExecute}
  <form method="POST" action="?/startAssignment" class="admin-form access-form">
    <label><span>Dispatched assignment</span><select name="assignmentId" required><option value="">Select</option>{#each data.projection.orders as order}{#each order.assignments.filter((assignment) => assignment.status === 'DISPATCHED' || assignment.status === 'ACKNOWLEDGED' || assignment.status === 'EN_ROUTE') as assignment}<option value={assignment.id}>{order.orderNumber} · {assignment.assigneeName}</option>{/each}{/each}</select></label>
    <button type="submit">Start On Site →</button>
  </form>
  {/if}
</section>
</div>

<div class="control-workspace-grid">
<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Field evidence</p><h2>Record execution</h2></div></div>
  {#if data.canExecute}
  <form method="POST" action="?/recordExecution" class="admin-form access-form">
    <label><span>Service Order</span><select name="serviceOrderId" required><option value="">Select</option>{#each data.projection.orders.filter((order) => order.status === 'DISPATCHED' || order.status === 'IN_PROGRESS' || order.status === 'COMPLETED') as order}<option value={order.id}>{order.orderNumber} · {order.title}</option>{/each}</select></label>
    <label><span>Assignment (optional)</span><select name="assignmentId"><option value="">Order-level evidence</option>{#each data.projection.orders as order}{#each order.assignments as assignment}<option value={assignment.id}>{order.orderNumber} · {assignment.assigneeName}</option>{/each}{/each}</select></label>
    <label><span>Record type</span><select name="recordType"><option>WORK</option><option>TRAVEL</option><option>ARRIVAL</option><option>INSPECTION</option><option>TEST</option><option>NOTE</option><option>COMPLETION</option></select></label>
    <label><span>Occurred at</span><input name="occurredAt" type="datetime-local" /></label>
    <label><span>Duration minutes</span><input name="durationMinutes" type="number" min="0" step="0.001" /></label>
    <label class="wide-field"><span>Notes</span><input name="notes" /></label>
    <label class="wide-field"><span>Evidence JSON</span><textarea name="evidence" rows="4" placeholder="JSON object with photo references, test results and other field evidence"></textarea></label>
    <button type="submit">Record Evidence →</button>
  </form>
  {/if}
</section>

<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Closure</p><h2>Complete &amp; accept service</h2></div></div>

  {#if data.canExecute}
  <form method="POST" action="?/completeOrder" class="admin-form access-form">
    <label><span>Active Service Order</span><select name="serviceOrderId" required><option value="">Select</option>{#each data.projection.orders.filter((order) => order.status === 'DISPATCHED' || order.status === 'IN_PROGRESS') as order}<option value={order.id}>{order.orderNumber} · {order.title}</option>{/each}</select></label>
    <button type="submit">Complete Service →</button>
  </form>
  {/if}

  {#if data.canAccept}
  <form method="POST" action="?/acceptOrder" class="admin-form access-form">
    <label><span>Completed Service Order</span><select name="serviceOrderId" required><option value="">Select</option>{#each data.projection.orders.filter((order) => order.status === 'COMPLETED') as order}<option value={order.id}>{order.orderNumber} · {order.title}</option>{/each}</select></label>
    <label class="wide-field"><span>Acceptance note</span><input name="acceptanceNote" /></label>
    <button type="submit">Accept &amp; Close →</button>
  </form>
  {/if}
</section>
</div>

<section class="workspace-panel">
  <div class="panel-heading"><div><p class="app-eyebrow">Operational record</p><h2>Service Orders</h2></div></div>
  <div class="control-record-list">
    {#each data.projection.orders as order}
    <article>
      <header><span>{order.orderNumber} · {order.serviceType}</span><strong>{order.status}</strong></header>
      <h3>{order.title}</h3>
      <p>{order.priority} priority · {order.serviceLocation ?? 'No service location'} · {order.assignments.length} assignment(s) · {order.execution.length} execution record(s)</p>
      <footer><span>{order.slaDueAt ? 'SLA ' + order.slaDueAt : 'No SLA due date'}</span><span>{order.acceptedAt ? 'Accepted ' + order.acceptedAt : order.completedAt ? 'Completed ' + order.completedAt : 'Open'}</span></footer>
    </article>
    {#each order.assignments as assignment}
    <div class="access-assignment-list">
      <article>
        <div><span>Assignee</span><strong>{assignment.assigneeName}</strong></div>
        <div><span>Window</span><strong>{assignment.scheduledStart} → {assignment.scheduledEnd}</strong></div>
        <div><span>Status</span><strong>{assignment.status}</strong></div>
      </article>
    </div>
    {/each}
    {/each}
  </div>
</section>
{/if}
