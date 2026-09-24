<script lang="ts">
  import type { ActionData,PageData } from './$types';
  let {data,form}:{data:PageData;form:ActionData}=$props();

  const positions=$derived(data.projection?.positions??[]);
  const employments=$derived(data.projection?.employments??[]);
  const structure=$derived(data.structure);

  function primaryFunction(position:NonNullable<PageData['projection']>['positions'][number]){
    return position.functionAssignments.find(item=>item.isPrimary&&item.status==='ACTIVE');
  }
  function lineManager(position:NonNullable<PageData['projection']>['positions'][number]){
    return position.reportingLines.find(item=>item.relationshipType==='LINE_MANAGER'&&item.status==='ACTIVE');
  }
  function dateOnly(value:string|undefined){
    if(!value)return '—';
    return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value));
  }
</script>

<svelte:head>
  <title>Human Capital Management — NuBlox</title>
  <meta name="description" content="Employment, job, Position, Function ownership and reporting hierarchy authority" />
</svelte:head>

{#if !data.allowed || !data.projection || !structure}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit Human Capital Management.</h1>
      <p>{data.reason}</p>
      <div class="permission-actions">
        <a class="primary-action permission-back" href="/app/request-access?permission=domain.hcm.read&returnTo=/app/hcm">Request access <span aria-hidden="true">→</span></a>
        <a class="quiet-link" href="/app">Back Home</a>
      </div>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact">
    <div>
      <p class="app-eyebrow">F15 · Human Resources / Human Capital</p>
      <h1>Human Capital Management</h1>
      <p class="workspace-lede">Authoritative workforce identity: who is employed, which Position they occupy, which Function owns that Position, whether it belongs to Governance or Delivery, and where that Position sits in the management hierarchy.</p>
    </div>
    <div class="workspace-action-row">
      <a class="primary-action" href="/app/function">Open My Function <span>→</span></a>
      <a class="quiet-link" href="/app/my-team">Open My Team</a>
    </div>
  </section>

  {#if form?.message || form?.error}
    <div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
      <strong>{form?.ok?'Completed':'Action not completed'}</strong><span>{form?.message??form?.error}</span>
    </div>
  {/if}

  <section class="architecture-metrics delivery-metrics" aria-label="HCM authority totals">
    <article><span>Employments</span><strong>{data.projection.totals.activeEmployments}</strong><p>{data.projection.totals.employments} total employment records</p></article>
    <article><span>Positions</span><strong>{data.projection.totals.positions}</strong><p>{data.projection.totals.occupiedPositions} currently occupied</p></article>
    <article><span>Function-owned Positions</span><strong>{data.projection.totals.functionOwnedPositions}</strong><p>primary Function world configured</p></article>
    <article><span>Manager Positions</span><strong>{data.projection.totals.managerPositions}</strong><p>line hierarchy driving roll-up scope</p></article>
  </section>

  {#if data.canManage}
    <details class="workspace-command-drawer" open>
      <summary><span>HCM administration</span><strong>Build the workforce authority chain</strong><small>Job → Person → Employment → Position → Function → Manager</small></summary>
      <section class="information-admin">
        <div class="information-command-grid">
          <details>
            <summary><span>01</span><strong>Create Job Profile</strong></summary>
            <form method="POST" action="?/createJobProfile" class="admin-form">
              <label><span>Code</span><input name="code" required maxlength="80" /></label>
              <label><span>Name</span><input name="name" required maxlength="255" placeholder="Sales Executive" /></label>
              <button type="submit">Create Job Profile <span>→</span></button>
            </form>
          </details>

          <details>
            <summary><span>02</span><strong>Create Person</strong></summary>
            <form method="POST" action="?/createPerson" class="admin-form">
              <label><span>Legal name</span><input name="legalName" required maxlength="255" /></label>
              <label><span>Preferred name</span><input name="preferredName" maxlength="255" /></label>
              <button type="submit">Create Person <span>→</span></button>
            </form>
          </details>

          <details>
            <summary><span>03</span><strong>Create Employment</strong></summary>
            <form method="POST" action="?/createEmployment" class="admin-form">
              <label><span>Person</span><select name="personId" required><option value="">Select Person</option>{#each structure.people.filter(item=>item.status==='ACTIVE') as person}<option value={person.id}>{person.name}</option>{/each}</select></label>
              <label><span>Employer</span><select name="organisationId" required><option value="">Select Organisation</option>{#each structure.organisations.filter(item=>item.status==='ACTIVE') as organisation}<option value={organisation.id}>{organisation.tradingName??organisation.legalName}</option>{/each}</select></label>
              <label><span>Employee number</span><input name="employeeNumber" required maxlength="80" /></label>
              <label><span>Worker type</span><select name="workerType"><option>EMPLOYEE</option><option>CONTINGENT</option></select></label>
              <label><span>Employment type</span><select name="employmentType"><option>PERMANENT</option><option>FIXED_TERM</option><option>TEMPORARY</option><option>APPRENTICE</option><option>INTERN</option><option>CONTRACTOR</option></select></label>
              <label><span>Status</span><select name="status"><option>ACTIVE</option><option>PENDING</option><option>SUSPENDED</option><option>ENDED</option></select></label>
              <label><span>Start date</span><input name="startDate" type="datetime-local" required /></label>
              <label><span>End date</span><input name="endDate" type="datetime-local" /></label>
              <button type="submit">Create Employment <span>→</span></button>
            </form>
          </details>

          <details>
            <summary><span>04</span><strong>Create Position</strong></summary>
            <form method="POST" action="?/createPosition" class="admin-form">
              <label><span>Organisation Unit</span><select name="organisationUnitId" required><option value="">Select Unit</option>{#each structure.organisations as organisation}{#each organisation.units.filter(item=>item.status==='ACTIVE') as unit}<option value={unit.id}>{organisation.tradingName??organisation.legalName} · {unit.code} · {unit.name}</option>{/each}{/each}</select></label>
              <label><span>Job Profile</span><select name="jobProfileId"><option value="">No Job Profile</option>{#each structure.jobProfiles as profile}<option value={profile.id}>{profile.code} · {profile.name}</option>{/each}</select></label>
              <label><span>Position code</span><input name="code" required maxlength="80" /></label>
              <label><span>Position title</span><input name="title" required maxlength="255" /></label>
              <button type="submit">Create Position <span>→</span></button>
            </form>
          </details>

          <details>
            <summary><span>05</span><strong>Assign Position to Function</strong></summary>
            <form method="POST" action="?/assignFunction" class="admin-form">
              <label><span>Position</span><select name="positionId" required><option value="">Select Position</option>{#each positions.filter(item=>item.status==='ACTIVE') as position}<option value={position.id}>{position.code} · {position.title}</option>{/each}</select></label>
              <label><span>Home Function</span><select name="functionId" required><option value="">Select Function</option>{#each data.projection.functions as fn}<option value={fn.id}>{fn.code} · {fn.name}</option>{/each}</select></label>
              <label><span>Function side</span><select name="deploymentPurpose"><option value="FUNCTIONAL_DELIVERY">Delivery</option><option value="FUNCTIONAL_GOVERNANCE">Governance</option></select></label>
              <label><span>Primary world</span><select name="isPrimary"><option value="true">Yes</option><option value="false">No</option></select></label>
              <label><span>Effective from</span><input name="effectiveFrom" type="datetime-local" /></label>
              <label><span>Effective to</span><input name="effectiveTo" type="datetime-local" /></label>
              <button type="submit">Assign Function <span>→</span></button>
            </form>
          </details>

          <details>
            <summary><span>06</span><strong>Place Employee in Position</strong></summary>
            <form method="POST" action="?/assignPosition" class="admin-form">
              <label><span>Employment</span><select name="employmentId" required><option value="">Select Employment</option>{#each employments.filter(item=>item.status==='ACTIVE'||item.status==='PENDING') as employment}<option value={employment.id}>{employment.employeeNumber} · {employment.personName}</option>{/each}</select></label>
              <label><span>Position</span><select name="positionId" required><option value="">Select Position</option>{#each positions.filter(item=>item.status==='ACTIVE') as position}<option value={position.id}>{position.code} · {position.title}</option>{/each}</select></label>
              <label><span>Primary Position</span><select name="isPrimary"><option value="true">Yes</option><option value="false">No</option></select></label>
              <label><span>Effective from</span><input name="effectiveFrom" type="datetime-local" /></label>
              <label><span>Effective to</span><input name="effectiveTo" type="datetime-local" /></label>
              <button type="submit">Place in Position <span>→</span></button>
            </form>
          </details>

          <details>
            <summary><span>07</span><strong>Set Position Manager</strong></summary>
            <form method="POST" action="?/setManager" class="admin-form">
              <label><span>Subordinate Position</span><select name="subordinatePositionId" required><option value="">Select Position</option>{#each positions.filter(item=>item.status==='ACTIVE') as position}<option value={position.id}>{position.code} · {position.title}</option>{/each}</select></label>
              <label><span>Manager Position</span><select name="managerPositionId" required><option value="">Select Manager Position</option>{#each positions.filter(item=>item.status==='ACTIVE') as position}<option value={position.id}>{position.code} · {position.title}</option>{/each}</select></label>
              <label><span>Relationship</span><select name="relationshipType"><option>LINE_MANAGER</option><option>FUNCTIONAL_MANAGER</option><option>DOTTED_LINE</option></select></label>
              <label><span>Effective from</span><input name="effectiveFrom" type="datetime-local" /></label>
              <label><span>Effective to</span><input name="effectiveTo" type="datetime-local" /></label>
              <button type="submit">Set Manager <span>→</span></button>
            </form>
          </details>
        </div>
      </section>
    </details>
  {/if}

  <div class="function-workspace-grid">
    <section class="workspace-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">Employment authority</p><h2>Current workforce</h2></div><span>{employments.length}</span></div>
      <div class="workspace-register-list">
        {#each employments as employment}
          <article>
            <div><strong>{employment.personName}</strong><span>{employment.employeeNumber} · {employment.organisationName}</span></div>
            <small>{employment.workerType} · {employment.employmentType.replaceAll('_',' ')} · {employment.status} · {dateOnly(employment.startDate)}{#if employment.endDate} → {dateOnly(employment.endDate)}{/if}</small>
          </article>
        {:else}<p class="information-empty">No Employment records exist yet.</p>{/each}
      </div>
    </section>

    <section class="workspace-panel">
      <div class="panel-heading"><div><p class="app-eyebrow">Position authority</p><h2>Function ownership &amp; hierarchy</h2></div><span>{positions.length}</span></div>
      <div class="workspace-register-list">
        {#each positions as position}
          {@const fn=primaryFunction(position)}
          {@const manager=lineManager(position)}
          <article>
            <div>
              <strong>{position.code} · {position.title}</strong>
              <span>{position.organisationName} · {position.organisationUnitName} · {position.jobProfileName??'No Job Profile'}</span>
              <span>{fn ? `${fn.functionCode} · ${fn.functionName} · ${fn.deploymentPurpose==='FUNCTIONAL_DELIVERY'?'Delivery':'Governance'}` : 'No primary Function world assigned'}</span>
            </div>
            <small>
              {position.occupants.length ? position.occupants.map(item=>item.personName).join(', ') : 'Vacant'}
              {manager ? ` · reports to ${manager.managerTitle}` : ''}
            </small>
          </article>
        {:else}<p class="information-empty">No Positions exist yet.</p>{/each}
      </div>
    </section>
  </div>
{/if}
