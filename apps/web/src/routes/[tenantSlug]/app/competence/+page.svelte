<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  function formatDate(value:string){
    return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value));
  }
</script>

<svelte:head><title>Competence — NuBlox</title></svelte:head>

{#if !data.allowed || !data.projection}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit Competence governance.</h1>
      <p>
        NuBlox evaluated <code>platform.competence.read</code> in the current tenant scope and did
        not find an active matching Access Role Assignment.
      </p>
      <p class="permission-reason">{data.reason}</p>
      <div class="permission-actions">
        <a class="primary-action permission-back" href="/app/request-access?permission=platform.competence.read&returnTo=/app/competence">
          Request access <span aria-hidden="true">→</span>
        </a>
        <a class="quiet-link" href="/app">Back to Functions</a>
      </div>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact competence-hero">
    <div>
      <p class="app-eyebrow">Functional deployment control</p>
      <h1>Competence</h1>
      <p class="workspace-lede">
        Govern the competence required to perform Function, L2 and deployed work, then record
        attributable Person evidence with effectivity, expiry and optional formal Evidence Record
        linkage.
      </p>
    </div>
  </section>

  {#if form?.message || form?.error}
    <div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
      <strong>{form?.ok ? 'Completed' : 'Action not completed'}</strong>
      <span>{form?.message ?? form?.error}</span>
    </div>
  {/if}

  <section class="architecture-metrics competence-metrics">
    <article>
      <span>Requirements</span>
      <strong>{data.projection.requirements.length}</strong>
      <p>Governed competence demand</p>
    </article>
    <article>
      <span>Evidence records</span>
      <strong>{data.projection.evidence.length}</strong>
      <p>Person competence attestations</p>
    </article>
    <article>
      <span>Expired</span>
      <strong>{data.projection.evidence.filter((item)=>item.isExpired).length}</strong>
      <p>Evidence no longer effective</p>
    </article>
    <article>
      <span>Formal links</span>
      <strong>{data.projection.evidence.filter((item)=>item.evidenceRecordId).length}</strong>
      <p>Linked to platform Evidence</p>
    </article>
  </section>

  {#if data.canManage}
    <section class="competence-admin">
      <header>
        <div>
          <p class="app-eyebrow">Controlled administration</p>
          <h2>Maintain competence governance</h2>
        </div>
        <p>
          Requirements describe what work demands. Evidence describes what a Person has attained.
          Neither substitutes for Permission, Responsibility or Authority.
        </p>
      </header>

      <div class="competence-command-grid">
        <article>
          <header><span>01</span><div><strong>Create requirement</strong><small>Capability → required competence</small></div></header>
          <form method="POST" action="?/createRequirement" class="admin-form competence-form">
            <label>
              <span>Subject</span>
              <select name="subject" required>
                <option value="">Select Function, L2 or Deployment</option>
                {#each data.projection.subjects as subject}
                  <option value={`${subject.type}|${subject.id}`}>{subject.type.replace('_',' ')} · {subject.label}</option>
                {/each}
              </select>
            </label>
            <label><span>Competence code</span><input name="competenceCode" required maxlength="120" autocomplete="off" /></label>
            <label><span>Competence name</span><input name="competenceName" required maxlength="255" /></label>
            <label><span>Required level</span><input name="requiredLevel" required maxlength="120" /></label>
            <div class="competence-checks">
              <label><input type="checkbox" name="evidenceRequired" /><span>Formal evidence required</span></label>
              <label><input type="checkbox" name="expiryRequired" /><span>Expiry date required</span></label>
            </div>
            <button type="submit">Create requirement <span>→</span></button>
          </form>
        </article>

        <article>
          <header><span>02</span><div><strong>Record evidence</strong><small>Person → attained competence</small></div></header>
          <form method="POST" action="?/createEvidence" class="admin-form competence-form">
            <label>
              <span>Person</span>
              <select name="personId" required>
                <option value="">Select Person</option>
                {#each data.projection.people as person}<option value={person.id}>{person.name}</option>{/each}
              </select>
            </label>
            <label><span>Competence code</span><input name="competenceCode" required maxlength="120" autocomplete="off" /></label>
            <label><span>Attained level</span><input name="attainedLevel" required maxlength="120" /></label>
            <label>
              <span>Formal Evidence Record</span>
              <select name="evidenceRecordId">
                <option value="">No formal Evidence Record</option>
                {#each data.projection.evidenceRecords as record}<option value={record.id}>{record.label}</option>{/each}
              </select>
            </label>
            <div class="admin-form-split">
              <label><span>Issued at</span><input name="issuedAt" type="datetime-local" /></label>
              <label><span>Effective from</span><input name="effectiveFrom" type="datetime-local" /></label>
            </div>
            <label><span>Effective to</span><input name="effectiveTo" type="datetime-local" /></label>
            <button type="submit" disabled={data.projection.people.length===0}>Record evidence <span>→</span></button>
          </form>
        </article>
      </div>
    </section>
  {/if}

  <div class="competence-two-column">
    <section class="workspace-panel">
      <div class="panel-heading">
        <div><p class="app-eyebrow">Competence demand</p><h2>Requirements</h2></div>
        <span>{data.projection.requirements.length}</span>
      </div>
      <div class="competence-requirement-list">
        {#if data.projection.requirements.length===0}
          <p class="organisation-empty">No competence requirements exist yet.</p>
        {:else}
          {#each data.projection.requirements as requirement}
            <article>
              <div>
                <span>{requirement.subjectType.replace('_',' ')}</span>
                <strong>{requirement.subjectLabel}</strong>
              </div>
              <div>
                <code>{requirement.competenceCode}</code>
                <h3>{requirement.competenceName}</h3>
                <p>Required level: {requirement.requiredLevel}</p>
              </div>
              <div class="requirement-flags">
                <span class:active={requirement.evidenceRequired}>Evidence {requirement.evidenceRequired?'required':'optional'}</span>
                <span class:active={requirement.expiryRequired}>Expiry {requirement.expiryRequired?'required':'optional'}</span>
              </div>
            </article>
          {/each}
        {/if}
      </div>
    </section>

    <section class="workspace-panel">
      <div class="panel-heading">
        <div><p class="app-eyebrow">Person capability</p><h2>Evidence</h2></div>
        <span>{data.projection.evidence.length}</span>
      </div>
      <div class="competence-evidence-list">
        {#if data.projection.evidence.length===0}
          <p class="organisation-empty">No competence evidence exists yet.</p>
        {:else}
          {#each data.projection.evidence as evidence}
            <article class:expired={evidence.isExpired}>
              <div>
                <span>{evidence.personName}</span>
                <code>{evidence.competenceCode}</code>
                <strong>{evidence.attainedLevel}</strong>
              </div>
              <dl>
                <div><dt>Effective</dt><dd>{formatDate(evidence.effectiveFrom)}</dd></div>
                <div><dt>Expires</dt><dd>{evidence.effectiveTo?formatDate(evidence.effectiveTo):'No expiry'}</dd></div>
                <div><dt>Evidence</dt><dd>{evidence.evidenceRecordId??'No formal link'}</dd></div>
              </dl>
            </article>
          {/each}
        {/if}
      </div>
    </section>
  </div>
{/if}
