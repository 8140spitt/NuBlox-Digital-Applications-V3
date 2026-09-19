<script lang="ts">
  import EditLeaseHeartbeat from '$lib/components/EditLeaseHeartbeat.svelte';
  import TaskContextButton from '$lib/components/TaskContextButton.svelte';

  let { data, form } = $props();

  type ActionFeedback = {
    message?: string;
    conflict?: boolean;
    holderDisplayName?: string | null;
  };

  const feedback = $derived((form ?? null) as ActionFeedback | null);

  const statusLabel: Record<string, string> = {
    PROPOSED: 'Proposed',
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    DISSOLVED: 'Dissolved',
    MERGED: 'Merged'
  };

  const functionNames: Record<string, string> = {
    F07: 'Sales & Commercial',
    F09: 'Procurement & Suppliers',
    F15: 'People & Workforce',
    F19: 'Legal & Secretariat',
    PLATFORM: 'Platform / migration'
  };

  const formatDate = (value: string) => new Date(value).toLocaleString('en-GB');

  function route(id: string) {
    return `/${data.tenantSlug}/app/admin/master-data/organisations?organisation=${encodeURIComponent(id)}`;
  }

  function activeDraft() {
    return Boolean(
      data.draft &&
        data.draft.status === 'ACTIVE' &&
        String(data.draft.baseVersion ?? '') === String(data.selected?.version ?? '')
    );
  }

  function draftValue(name: string, fallback: string | null | undefined) {
    if (activeDraft()) {
      const value = data.draft?.payload?.[name];
      if (typeof value === 'string') return value;
    }
    return fallback ?? '';
  }
</script>

<svelte:head><title>Organisation Identity Stewardship · NuBlox</title></svelte:head>

<div class="master-page">
  <nav class="breadcrumb"><a href={`/${data.tenantSlug}/app/admin/master-data/parties`}>Party directory</a><span>›</span><strong>Organisation identity stewardship</strong></nav>

  <header class="hero section-card">
    <div><span class="eyebrow">AGG-01-PARTY · Exceptional master stewardship</span><h1>Organisation identity stewardship</h1><p>Canonical organisations are originated by their home business workflows. This screen is reserved for resolving and correcting shared identity attributes; it is not an alternative customer or supplier onboarding route.</p></div>
    <div class="authority"><strong>Stewardship authority</strong><span>{data.actorDisplayName}</span><small>Edit lease + recoverable draft + optimistic version control</small></div>
  </header>

  {#if feedback?.message}
    <div class:conflict={feedback?.conflict} class="message" role="alert">
      <strong>{feedback?.conflict ? 'Edit conflict' : 'Command could not be completed'}</strong>
      <span>{feedback?.message}</span>
      {#if feedback?.holderDisplayName}<small>Current editor: {feedback?.holderDisplayName}</small>{/if}
    </div>
  {/if}

  <section class="metrics">
    <article class="section-card"><strong>{data.organisations.length}</strong><span>canonical organisations</span></article>
    <article class="section-card"><strong>{data.organisations.filter((item) => item.status === 'ACTIVE').length}</strong><span>active</span></article>
    <article class="section-card"><strong>{data.organisations.filter((item) => item.status === 'PROPOSED').length}</strong><span>proposed</span></article>
  </section>

  <div class="workspace">
    <aside class="register section-card">
      <div class="panel-heading"><div><span class="eyebrow">Canonical register</span><h2>Organisations</h2></div></div>
      <div class="records">
        {#each data.organisations as organisation}
          <a class:active={data.selected?.id === organisation.id} href={`?organisation=${organisation.id}`}>
            <span><strong>{organisation.displayName}</strong><small>{organisation.registrationNumber || 'No registration number'}</small></span>
            <em class={`status status-${organisation.status.toLowerCase()}`}>{statusLabel[organisation.status]}</em>
          </a>
        {:else}<p class="empty">No Organisation identities exist yet. Create them through their owning business workflow.</p>{/each}
      </div>
      <div class="creation-rule"><strong>Originate from the business</strong><p>Clients: F07 · Suppliers: F09 · Employees/people: F15. Canonical identity resolution happens behind those workflows.</p></div>
    </aside>

    <main class="detail">
      {#if data.selected}
        <section class="section-card editor">
          <div class="panel-heading">
            <div><span class="eyebrow">Canonical Party / Organisation</span><h2>{data.selected.displayName}</h2></div>
            <div class="toolbar">
              <span class={`status status-${data.selected.status.toLowerCase()}`}>{statusLabel[data.selected.status]}</span>
              <TaskContextButton
                contextKey={'ORGANISATION:' + data.selected.id}
                objectType="ORGANISATION"
                objectId={data.selected.id}
                objectVersion={data.selected.version}
                title={data.selected.displayName}
                subtitle="Canonical Organisation identity"
                routePath={route(data.selected.id)}
                workspaceFunctionId={data.origination?.originFunctionId?.startsWith('F') ? data.origination.originFunctionId : null}
              />
            </div>
          </div>

          <div class="record-meta"><span>Immutable ID <code>{data.selected.id}</code></span><span>Version <strong>{data.selected.version}</strong></span><span>Updated <strong>{formatDate(data.selected.updatedAt)}</strong></span></div>

          <section class="origin">
            <span class="eyebrow">Origination</span>
            <div class="origin-grid">
              <span><small>Home function</small><strong>{functionNames[data.origination?.originFunctionId ?? 'PLATFORM'] ?? data.origination?.originFunctionId ?? 'Legacy'}</strong></span>
              <span><small>Origin object</small><strong>{data.origination?.originObjectType ?? 'Legacy / platform'}</strong></span>
              <span><small>Steward</small><strong>{functionNames[data.origination?.stewardFunctionId ?? 'PLATFORM'] ?? data.origination?.stewardFunctionId ?? 'Platform'}</strong></span>
            </div>
          </section>

          {#if data.lease && !data.editing && !data.lease.holderIsCurrentActor}
            <div class="lease-banner locked"><strong>{data.lease.holderDisplayName} is currently editing this Organisation</strong><span>You can continue to view it. The edit lease expires at {formatDate(data.lease.expiresAt)} unless renewed.</span></div>
          {:else if data.lease && !data.editing && data.lease.holderIsCurrentActor}
            <div class="lease-banner"><strong>You have an active edit session</strong><span>Resume editing to restore your working draft.</span></div>
          {/if}

          {#if data.editing && data.actorLease && data.workContext}
            <EditLeaseHeartbeat tenantSlug={data.tenantSlug} objectType="ORGANISATION" objectId={data.selected.id} leaseToken={data.actorLease.leaseToken} />

            {#if data.draft?.status === 'ACTIVE'}
              <div class:stale={!activeDraft()} class="draft-banner">
                <strong>{activeDraft() ? 'Recoverable draft restored' : 'Draft retained against an older version'}</strong>
                <span>{activeDraft() ? 'Your unsaved fields were restored from the Task Bar work context.' : 'The canonical Organisation changed after this draft was created. Review before copying any values forward.'}</span>
              </div>
            {/if}

            <form
              method="POST"
              action="?/save"
              class="editor-form"
              data-nublox-work-context={data.workContext.id}
              data-nublox-form-key="organisation-stewardship"
              data-nublox-base-version={data.selected.version}
              data-nublox-draft-endpoint={`/${data.tenantSlug}/app/api/work-drafts`}
            >
              <input type="hidden" name="id" value={data.selected.id} />
              <input type="hidden" name="version" value={data.selected.version} />
              <input type="hidden" name="editLeaseToken" value={data.actorLease.leaseToken} />
              <input type="hidden" name="workContextId" value={data.workContext.id} />
              <label class="full">Legal name<input name="legalName" value={draftValue('legalName', data.selected.legalName)} required /></label>
              <label>Trading name<input name="tradingName" value={draftValue('tradingName', data.selected.tradingName)} /></label>
              <label>Registration number<input name="registrationNumber" value={draftValue('registrationNumber', data.selected.registrationNumber)} /></label>
              <label>Tax identifier<input name="taxIdentifier" value={draftValue('taxIdentifier', data.selected.taxIdentifier)} /></label>
              <label>Country code<input name="countryCode" maxlength="2" value={draftValue('countryCode', data.selected.countryCode)} /></label>
              <div class="full actions"><button type="submit">Save canonical changes</button></div>
            </form>

            <div class="editing-actions">
              <form method="POST" action="?/cancelEdit"><input type="hidden" name="id" value={data.selected.id}/><input type="hidden" name="editLeaseToken" value={data.actorLease.leaseToken}/><button class="secondary" type="submit">Stop editing · keep draft</button></form>
              <form method="POST" action="?/discardDraft"><input type="hidden" name="id" value={data.selected.id}/><input type="hidden" name="editLeaseToken" value={data.actorLease.leaseToken}/><input type="hidden" name="workContextId" value={data.workContext.id}/><button class="quiet" type="submit">Discard draft & release</button></form>
            </div>
          {:else}
            <dl class="read-grid">
              <div><dt>Legal name</dt><dd>{data.selected.legalName}</dd></div>
              <div><dt>Trading name</dt><dd>{data.selected.tradingName ?? '—'}</dd></div>
              <div><dt>Registration</dt><dd>{data.selected.registrationNumber ?? '—'}</dd></div>
              <div><dt>Tax identifier</dt><dd>{data.selected.taxIdentifier ?? '—'}</dd></div>
              <div><dt>Country</dt><dd>{data.selected.countryCode ?? '—'}</dd></div>
            </dl>
            {#if data.capabilities.canSteward && (!data.lease || data.lease.holderIsCurrentActor)}
              <form method="POST" action="?/beginEdit" class="begin-edit"><input type="hidden" name="id" value={data.selected.id}/><input type="hidden" name="version" value={data.selected.version}/><input type="hidden" name="title" value={data.selected.displayName}/><button type="submit">{data.lease?.holderIsCurrentActor ? 'Resume stewardship edit' : 'Begin stewardship edit'}</button></form>
            {/if}
          {/if}
        </section>

        {#if data.editing && data.actorLease && data.capabilities.canChangeStatus}
          <section class="section-card lifecycle">
            <div><span class="eyebrow">Lifecycle stewardship</span><h2>Organisation status</h2><p>Lifecycle changes require the same active edit lease and canonical record version as attribute changes.</p></div>
            <div class="lifecycle-actions">
              {#if data.selected.status === 'PROPOSED' || data.selected.status === 'INACTIVE'}
                <form method="POST" action="?/activate"><input type="hidden" name="id" value={data.selected.id}/><input type="hidden" name="version" value={data.selected.version}/><input type="hidden" name="editLeaseToken" value={data.actorLease.leaseToken}/><button type="submit">Activate organisation</button></form>
              {:else if data.selected.status === 'ACTIVE'}
                <form method="POST" action="?/deactivate"><input type="hidden" name="id" value={data.selected.id}/><input type="hidden" name="version" value={data.selected.version}/><input type="hidden" name="editLeaseToken" value={data.actorLease.leaseToken}/><button class="secondary" type="submit">Set inactive</button></form>
              {/if}
            </div>
          </section>
        {/if}

        <section class="section-card audit">
          <div class="panel-heading"><div><span class="eyebrow">Evidence by default</span><h2>Audit trail</h2></div></div>
          <ol>
            {#each data.audit as event}
              <li><div><strong>{event.action}</strong><small>{event.actorDisplayName} · {formatDate(event.occurredAt)}</small></div><span>{event.fromState || 'New'} → {event.toState || '—'}</span>{#if event.note}<p>{event.note}</p>{/if}</li>
            {:else}<li class="empty">No audit evidence recorded.</li>{/each}
          </ol>
        </section>
      {:else}
        <section class="section-card welcome"><span class="eyebrow">Canonical identity</span><h2>No Organisations yet</h2><p>Create the first business relationship from its owning function. NuBlox will resolve or originate the shared Organisation identity there.</p></section>
      {/if}
    </main>
  </div>
</div>

<style>
.master-page{display:grid;gap:12px}.section-card{border:1px solid var(--line);border-radius:10px;background:#fff}.breadcrumb{display:flex;gap:7px;align-items:center;color:var(--muted);font-size:9px}.breadcrumb a{color:var(--blue-700);text-decoration:none}.hero{display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:24px;align-items:center;padding:18px;border-color:#9bcfe7;background:linear-gradient(120deg,#fbfdff,#edf8f7 65%,#fff)}.eyebrow{color:var(--blue-700);font-size:9px;font-weight:850;letter-spacing:.07em;text-transform:uppercase}h1{margin:4px 0 7px;font-size:25px}h2{margin:2px 0;font-size:16px}.hero p,.lifecycle p,.welcome p,.creation-rule p{margin:0;color:#50697c;font-size:10px;line-height:1.55}.authority{display:grid;gap:3px;padding:11px;border:1px solid #c5dfe9;border-radius:9px;background:#ffffffd9}.authority strong{font-size:8px;text-transform:uppercase;color:#60788a}.authority span{font-size:13px;font-weight:800}.authority small{font-size:8px;color:#748695}.message{display:grid;gap:3px;padding:9px 12px;border:1px solid #dd8a8a;border-radius:8px;background:#fff3f3;color:#792f2f;font-size:9px}.message.conflict{border-color:#d59b57;background:#fff8e8;color:#704e1d}.message small{font-size:8px}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.metrics article{display:grid;gap:2px;padding:10px 12px}.metrics strong{font-size:20px;color:#26475e}.metrics span{font-size:8px;color:#748796;text-transform:uppercase}.workspace{display:grid;grid-template-columns:300px minmax(0,1fr);gap:12px;align-items:start}.register{position:sticky;top:78px;padding:12px}.panel-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:9px}.records{display:grid;gap:5px}.records a{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;padding:8px;border:1px solid #e0e7ec;border-radius:7px;text-decoration:none;background:#fafcfd}.records a.active{border-color:#79bde2;background:#eef8fd;box-shadow:inset 3px 0 var(--blue-700)}.records a>span{display:grid;gap:2px}.records strong{font-size:9.5px;color:#263f51}.records small{font-size:8px;color:#7d8d99}.status{display:inline-block;padding:3px 6px;border-radius:999px;font-size:7.5px;font-style:normal;font-weight:850;text-transform:uppercase;background:#eef1f3;color:#526574}.status-active{background:#e5f5e9;color:#2a6939}.status-proposed{background:#fff3da;color:#7b5a18}.status-inactive{background:#edf0f2;color:#68757f}.creation-rule{margin-top:10px;padding:8px;border:1px solid #d7e4ea;border-radius:7px;background:#f8fbfd}.creation-rule strong{display:block;margin-bottom:3px;color:#315d76;font-size:8.5px}.detail{display:grid;gap:10px;min-width:0}.editor,.lifecycle,.audit,.welcome{padding:13px}.toolbar{display:flex;gap:7px;align-items:center}.record-meta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}.record-meta span{padding:5px 7px;border-radius:6px;background:#f4f7f9;color:#687d8d;font-size:8px}.record-meta code{font-size:7.5px}.origin{padding:9px;border:1px solid #dce7ec;border-radius:7px;background:#fbfdfe}.origin-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:6px}.origin-grid span{display:grid;gap:2px}.origin-grid small{font-size:7px;color:#84939d}.origin-grid strong{font-size:8.5px;color:#405c6f}.lease-banner,.draft-banner{display:grid;gap:3px;margin-top:9px;padding:8px 9px;border:1px solid #bcd8e7;border-radius:7px;background:#f1f9fd;color:#365d75;font-size:8.5px}.lease-banner.locked,.draft-banner.stale{border-color:#d6aa70;background:#fff9eb;color:#704f23}.editor-form{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:10px}.editor-form .full{grid-column:1/-1}label{display:grid;gap:4px;color:#435c70;font-size:9px;font-weight:750}input{width:100%;border:1px solid #cfdbe3;border-radius:7px;padding:8px;background:white;color:var(--ink);font-size:10px}button{border:0;border-radius:7px;padding:8px 10px;background:var(--blue-700);color:white;font-size:9px;font-weight:800;cursor:pointer}.secondary{background:#657987}.quiet{background:#eef2f4;color:#526574}.actions{display:flex;justify-content:flex-end}.editing-actions{display:flex;justify-content:flex-end;gap:6px;margin-top:8px}.editing-actions form{margin:0}.read-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:10px 0 0}.read-grid div{padding:8px;border-radius:6px;background:#f5f8fa}.read-grid dt{font-size:7px;text-transform:uppercase;color:#82919c}.read-grid dd{margin:3px 0 0;font-size:9px;font-weight:700;color:#395569}.begin-edit{display:flex;justify-content:flex-end;margin-top:9px}.lifecycle{display:flex;justify-content:space-between;align-items:end;gap:18px}.lifecycle>div:first-child{max-width:680px}.audit ol{list-style:none;display:grid;gap:5px;margin:0;padding:0}.audit li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:3px 12px;padding:7px;border:1px solid #e5eaee;border-radius:7px}.audit li strong{display:block;font-size:9px}.audit li small{display:block;margin-top:2px;color:#7d8d99;font-size:8px}.audit li>span{color:#526a7d;font-size:8px}.audit li p{grid-column:1/-1;margin:2px 0 0;color:#5f7484;font-size:8.5px}.empty{color:#7b8c99;font-size:9px}.welcome{min-height:260px;display:grid;place-content:center;text-align:center}.welcome p{max-width:540px}@media(max-width:980px){.workspace{grid-template-columns:240px minmax(0,1fr)}.hero{grid-template-columns:1fr}.authority{display:none}}@media(max-width:740px){.workspace,.metrics,.editor-form,.read-grid,.origin-grid{grid-template-columns:1fr}.register{position:static}.editor-form .full{grid-column:auto}.lifecycle{display:grid}}
</style>
