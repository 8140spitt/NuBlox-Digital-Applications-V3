<script lang="ts">
  let { data, form } = $props();

  function href(id: string) {
    return `/${data.tenantSlug}/app/functions/f02/policies?policy=${encodeURIComponent(id)}`;
  }

  function date(value: string | null) {
    return value ? new Date(value).toLocaleDateString('en-GB') : '—';
  }

  function yesNo(value: number | boolean) {
    return Boolean(value) ? 'Required' : 'Not required';
  }
</script>

<svelte:head><title>Policy Governance · NuBlox</title></svelte:head>

<div class="page">
  <nav class="crumb">
    <a href={`/${data.tenantSlug}/app/functions/f02`}>F02 Corporate Governance</a>
    <span>›</span>
    <strong>F02.06 Policy Governance</strong>
  </nav>

  <header class="hero section-card">
    <div>
      <span class="eyebrow">AGG-02-POLICY · AGG-07-INFORMATION</span>
      <h1>Policy governance</h1>
      <p>
        Govern policy ownership, applicability and effectivity while retaining one controlled
        Information Container identity and immutable issued revisions.
      </p>
    </div>
    <aside>
      <strong>One policy. One information identity.</strong>
      <span>Draft → freeze for review → approve → publish → supersede by successor revision.</span>
    </aside>
  </header>

  {#if form?.message}<div class="error">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <div class="section-title">
        <div><span class="eyebrow">Policy register</span><h2>{data.policies.length} policies</h2></div>
      </div>

      <nav class="policy-list">
        {#each data.policies as item}
          <a class:active={data.selected?.id === item.id} href={href(item.id)}>
            <span class="row-head"><strong>{item.policyRef}</strong><small>{item.status}</small></span>
            <span>{item.title}</span>
            <small>{item.policyType} · {item.currentRevisionCode}</small>
          </a>
        {:else}
          <p class="empty-copy">No governed policies yet.</p>
        {/each}
      </nav>

      {#if data.capabilities.canManage}
        <details class="create">
          <summary>Create policy</summary>
          <form method="POST" action="?/create">
            <div class="pair">
              <label>Policy reference<input name="policyRef" required placeholder="POL-GOV-001" /></label>
              <label>Policy type
                <select name="policyType" required>
                  <option value="CORPORATE">Corporate</option>
                  <option value="ETHICS">Ethics</option>
                  <option value="HSE">HSE</option>
                  <option value="QUALITY">Quality</option>
                  <option value="SECURITY">Security</option>
                  <option value="INFORMATION">Information</option>
                  <option value="COMMERCIAL">Commercial</option>
                </select>
              </label>
            </div>
            <label>Title<input name="title" required /></label>
            <label>Applicability
              <textarea name="applicabilitySummary" rows="3" required placeholder="Who and what this policy applies to"></textarea>
            </label>

            {#if data.capabilities.canReadParties}
              <label>Policy owner
                <select name="ownerPartyId">
                  <option value="">Current actor</option>
                  {#each data.parties as party}<option value={party.id}>{party.displayName}</option>{/each}
                </select>
              </label>
            {/if}

            {#if data.capabilities.canReadBodies}
              <label>Governance body
                <select name="governanceBodyId">
                  <option value="">No body assigned</option>
                  {#each data.bodies as body}<option value={body.id}>{body.bodyRef} · {body.name}</option>{/each}
                </select>
              </label>
            {/if}

            <div class="pair">
              <label>Revision<input name="revisionCode" value="P01" required /></label>
              <label>Security
                <select name="securityClassification">
                  <option value="INTERNAL">Internal</option>
                  <option value="PUBLIC">Public</option>
                  <option value="CONFIDENTIAL">Confidential</option>
                  <option value="RESTRICTED">Restricted</option>
                </select>
              </label>
            </div>
            <div class="pair">
              <label>Effective from<input type="date" name="effectiveFrom" /></label>
              <label>Review due<input type="date" name="reviewDueAt" /></label>
            </div>
            <label class="check"><input type="checkbox" name="attestationRequired" /><span>Require attestation for this revision</span></label>

            <details class="advanced">
              <summary>Advanced classification & scope</summary>
              <div class="pair">
                <label>Scope type<input name="scopeType" placeholder="TENANT" /></label>
                <label>Scope ID<input name="scopeId" /></label>
              </div>
              <div class="pair">
                <label>Classification<input name="classificationCode" /></label>
                <label>Suitability<input name="suitabilityCode" /></label>
              </div>
              <label>Purpose of issue<input name="purposeOfIssue" value="Policy review" /></label>
              <label>Effective to<input type="date" name="effectiveTo" /></label>
            </details>
            <button>Create working revision</button>
          </form>
        </details>
      {/if}
    </aside>

    <main class="content">
      {#if data.selected}
        <section class="section-card policy-card">
          <div class="policy-heading">
            <div>
              <span class="eyebrow">{data.selected.policyRef}</span>
              <h2>{data.selected.title}</h2>
              <p>{data.selected.applicabilitySummary}</p>
            </div>
            <span class="status">{data.selected.currentLifecycleStatus}</span>
          </div>

          <div class="facts">
            <article><small>Policy type</small><strong>{data.selected.policyType}</strong></article>
            <article><small>Current revision</small><strong>{data.selected.currentRevisionCode}</strong></article>
            <article><small>Owner</small><strong>{data.selected.ownerDisplayName}</strong></article>
            <article><small>Governance body</small><strong>{data.selected.governanceBodyName ?? '—'}</strong></article>
            <article><small>Effective from</small><strong>{date(data.selected.effectiveFrom)}</strong></article>
            <article><small>Review due</small><strong>{date(data.selected.reviewDueAt)}</strong></article>
            <article><small>Attestation</small><strong>{yesNo(data.selected.attestationRequired)}</strong></article>
            <article><small>Aggregate</small><strong>v{data.selected.aggregateVersion}</strong></article>
          </div>

          <div class="actions">
            {#if data.capabilities.canManage && data.selected.currentLifecycleStatus === 'WORKING'}
              <form method="POST" action="?/submit" class="inline">
                <input type="hidden" name="policyId" value={data.selected.id} />
                <input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion} />
                <button>Freeze & submit for review</button>
              </form>
            {/if}
            {#if data.capabilities.canApprove && data.selected.currentLifecycleStatus === 'REVIEW'}
              <form method="POST" action="?/approve" class="approval">
                <input type="hidden" name="policyId" value={data.selected.id} />
                <input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion} />
                <label>Approval rationale<textarea name="reason" rows="2"></textarea></label>
                <button>Approve revision</button>
              </form>
            {/if}
            {#if data.capabilities.canApprove && data.selected.currentLifecycleStatus === 'APPROVED'}
              <form method="POST" action="?/publish" class="inline">
                <input type="hidden" name="policyId" value={data.selected.id} />
                <input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion} />
                <button>Publish revision</button>
              </form>
            {/if}
          </div>
        </section>

        <div class="lower-grid">
          <section class="section-card representations">
            <div class="section-title">
              <div><span class="eyebrow">Controlled representations</span><h3>{data.representations.length} files / renditions</h3></div>
              <small>{data.selected.currentRevisionCode}</small>
            </div>
            <div class="representation-list">
              {#each data.representations as item}
                <article>
                  <div><strong>{item.sourceFilename ?? item.representationType}</strong><small>{item.contentMediaType ?? item.representationType}</small></div>
                  <code>{item.contentReference}</code>
                  <small>{item.hashAlgorithm} · {item.contentHash.slice(0, 16)}…</small>
                </article>
              {:else}
                <p class="empty-copy">No representation has been attached to this revision.</p>
              {/each}
            </div>

            {#if data.capabilities.canManage && data.selected.currentLifecycleStatus === 'WORKING'}
              <details>
                <summary>Add controlled representation</summary>
                <form method="POST" action="?/representation">
                  <input type="hidden" name="policyId" value={data.selected.id} />
                  <input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion} />
                  <div class="pair">
                    <label>Type<input name="representationType" value="PDF" required /></label>
                    <label>Media type<input name="contentMediaType" value="application/pdf" /></label>
                  </div>
                  <label>Content reference<input name="contentReference" required placeholder="s3://… or governed repository reference" /></label>
                  <label>Source filename<input name="sourceFilename" /></label>
                  <div class="pair">
                    <label>Hash algorithm<select name="hashAlgorithm"><option value="SHA256">SHA-256</option><option value="SHA512">SHA-512</option></select></label>
                    <label>Content hash<input name="contentHash" required /></label>
                  </div>
                  <button>Add representation</button>
                </form>
              </details>
            {/if}
          </section>

          <section class="section-card history">
            <div class="section-title"><div><span class="eyebrow">Revision history</span><h3>Immutable lineage</h3></div></div>
            <div class="revision-list">
              {#each data.revisions as revision}
                <article>
                  <div class="row-head"><strong>{revision.revisionCode}</strong><span>{revision.lifecycleStatus}</span></div>
                  <p>{revision.title}</p>
                  <small>{revision.ownerDisplayName} · effective {date(revision.effectiveFrom)}</small>
                  {#if revision.approvalDecisionId}<small>Decision {revision.approvalDecisionId.slice(0, 8)}</small>{/if}
                </article>
              {/each}
            </div>
          </section>
        </div>

        {#if data.capabilities.canManage && data.selected.currentLifecycleStatus === 'ISSUED'}
          <section class="section-card successor">
            <details>
              <summary>Create successor revision</summary>
              <form method="POST" action="?/successor">
                <input type="hidden" name="policyId" value={data.selected.id} />
                <input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion} />
                <div class="pair">
                  <label>Revision code<input name="revisionCode" required placeholder="P02" /></label>
                  <label>Title<input name="title" value={data.selected.title} /></label>
                </div>
                <label>Applicability<textarea name="applicabilitySummary" rows="3">{data.selected.applicabilitySummary}</textarea></label>
                <div class="pair">
                  <label>Effective from<input type="date" name="effectiveFrom" required /></label>
                  <label>Review due<input type="date" name="reviewDueAt" /></label>
                </div>
                {#if data.capabilities.canReadParties}
                  <label>Owner
                    <select name="ownerPartyId">
                      {#each data.parties as party}<option value={party.id} selected={party.id === data.selected.ownerPartyId}>{party.displayName}</option>{/each}
                    </select>
                  </label>
                {/if}
                {#if data.capabilities.canReadBodies}
                  <label>Governance body
                    <select name="governanceBodyId">
                      <option value="">No body assigned</option>
                      {#each data.bodies as body}<option value={body.id} selected={body.id === data.selected.governanceBodyId}>{body.bodyRef} · {body.name}</option>{/each}
                    </select>
                  </label>
                {/if}
                <label class="check"><input type="checkbox" name="attestationRequired" checked={Boolean(data.selected.attestationRequired)} /><span>Require attestation</span></label>
                <button>Create successor draft</button>
              </form>
            </details>
          </section>
        {/if}
      {:else}
        <section class="section-card empty-state">
          <span class="eyebrow">F02.06</span>
          <h2>Create the first governed policy</h2>
          <p>The Policy register will retain ownership, applicability, effectivity, review evidence and controlled revision history.</p>
        </section>
      {/if}
    </main>
  </div>
</div>

<style>
  .page{display:grid;gap:12px}.crumb{display:flex;gap:7px;font-size:9px}.crumb a{text-decoration:none}.hero{display:grid;grid-template-columns:1.5fr .7fr;gap:20px;padding:18px;background:linear-gradient(120deg,#fbfdff,#eaf6fd);border-color:#8fc9ee}.hero aside{display:grid;gap:6px;padding:12px;background:white;border:1px solid #bddded;border-radius:8px}.hero aside span,.hero p,.empty-copy,.policy-heading p,.empty-state p{font-size:10px;color:#637887}.eyebrow{font-size:9px;font-weight:850;letter-spacing:.07em;color:var(--blue-700);text-transform:uppercase}h1{margin:3px 0 6px;font-size:25px}h2{margin:2px 0;font-size:17px}h3{margin:2px 0;font-size:14px}.error{padding:8px 10px;background:#fff2f2;border:1px solid #e2aaaa;border-radius:7px}.workspace{display:grid;grid-template-columns:300px minmax(0,1fr);gap:12px;align-items:start}.register,.policy-card,.representations,.history,.successor{padding:12px}.section-title,.policy-heading,.row-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.policy-list{display:grid;gap:6px;margin-top:10px}.policy-list a{display:grid;gap:4px;padding:8px;border:1px solid #dfe7ec;border-radius:7px;text-decoration:none;color:inherit}.policy-list a.active{border-color:#79bde2;background:#edf8fe}.policy-list span,.policy-list small{font-size:8px;color:#748793}.policy-list strong{color:#263944}.create,.advanced,.representations details,.successor details{margin-top:10px;padding-top:9px;border-top:1px solid #e4ebef}summary{font-size:9px;font-weight:850;cursor:pointer}form{display:grid;gap:7px;margin-top:8px}label{display:grid;gap:3px;font-size:9px;font-weight:750}input,textarea,select{width:100%;padding:7px;border:1px solid #cad7df;border-radius:6px;background:white;font:inherit;font-size:9px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:7px}.check{display:flex;grid-template-columns:none;flex-direction:row;align-items:center;gap:6px}.check input{width:auto}button{border:0;border-radius:6px;padding:7px 10px;background:var(--blue-700);color:white;font-size:9px;font-weight:850;cursor:pointer}.content{display:grid;gap:12px}.status{padding:5px 7px;border-radius:999px;background:#edf8fe;color:var(--blue-700);font-size:8px;font-weight:850}.facts{display:grid;grid-template-columns:repeat(4,minmax(100px,1fr));gap:6px;margin:12px 0}.facts article{display:grid;gap:3px;padding:8px;background:#f5f8fa;border-radius:7px}.facts small{font-size:7px;color:#7c8d98}.facts strong{font-size:9px}.actions{display:grid;gap:7px}.inline{display:flex;justify-content:flex-end}.approval{grid-template-columns:minmax(0,1fr) auto;align-items:end}.lower-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr);gap:12px}.representation-list,.revision-list{display:grid;gap:6px;margin-top:9px}.representation-list article,.revision-list article{display:grid;gap:4px;padding:8px;border:1px solid #e1e9ed;border-radius:7px;background:#fbfcfd}.representation-list article>div{display:flex;justify-content:space-between;gap:8px}.representation-list small,.revision-list small{font-size:8px;color:#798b97}.representation-list code{font-size:8px;overflow-wrap:anywhere}.revision-list p{margin:0;font-size:9px}.revision-list span{font-size:8px;color:var(--blue-700);font-weight:800}.empty-state{min-height:260px;display:grid;place-content:center;max-width:620px}.successor{border-color:#b9dbea}@media(max-width:1000px){.facts{grid-template-columns:repeat(2,1fr)}.lower-grid{grid-template-columns:1fr}}@media(max-width:800px){.hero,.workspace,.pair,.approval{grid-template-columns:1fr}.facts{grid-template-columns:1fr 1fr}}
</style>
