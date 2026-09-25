<script lang="ts">
  import type { ActionData,PageData } from './$types';
  let {data,form}:{data:PageData;form:ActionData}=$props();

  const families=$derived(data.projection?.jobFamilies??[]);
  const subfamilies=$derived(data.projection?.jobSubfamilies??[]);
  const levels=$derived(data.projection?.careerLevels??[]);
  const grades=$derived(data.projection?.grades??[]);
  const architecture=$derived(data.projection?.jobArchitecture??[]);
  const profiles=$derived(data.structure?.jobProfiles??[]);

  function dateOnly(value:string|undefined){
    if(!value)return '—';
    return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value));
  }
</script>

<svelte:head>
  <title>Job Architecture — Human Capital Management — NuBlox</title>
  <meta name="description" content="Governed Job Families, Sub-families, Career Levels, Grades and Job Profile architecture" />
</svelte:head>

{#if !data.allowed || !data.projection || !data.structure}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit HCM Job Architecture.</h1>
      <p>{data.reason}</p>
      <div class="permission-actions">
        <a class="primary-action permission-back" href="/app/request-access?permission=domain.hcm.read&returnTo=/app/hcm/job-architecture">Request access <span aria-hidden="true">→</span></a>
        <a class="quiet-link" href="/app/hcm">Back to HCM</a>
      </div>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact">
    <div>
      <p class="app-eyebrow">F15 · HCM · Job Architecture</p>
      <h1>Job Architecture</h1>
      <p class="workspace-lede">Govern reusable work expectations independently from people and Positions: Family → Sub-family → Job Profile → Career Level → Grade. Architecture is effective-dated so future structures can be planned without rewriting history.</p>
    </div>
    <div class="workspace-action-row">
      <a class="quiet-link" href="/app/hcm">Back to HCM</a>
    </div>
  </section>

  {#if form?.message || form?.error}
    <div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
      <strong>{form?.ok?'Completed':'Action not completed'}</strong><span>{form?.message??form?.error}</span>
    </div>
  {/if}

  <section class="architecture-metrics delivery-metrics" aria-label="Job architecture totals">
    <article><span>Families</span><strong>{families.filter(item=>item.status==='ACTIVE').length}</strong><p>governed work domains</p></article>
    <article><span>Sub-families</span><strong>{subfamilies.filter(item=>item.status==='ACTIVE').length}</strong><p>specialised job groupings</p></article>
    <article><span>Career Levels</span><strong>{levels.filter(item=>item.status==='ACTIVE').length}</strong><p>career progression structure</p></article>
    <article><span>Grades</span><strong>{grades.filter(item=>item.status==='ACTIVE').length}</strong><p>workforce grade structure</p></article>
  </section>

  {#if data.canManage}
    <details class="workspace-command-drawer" open>
      <summary><span>Architecture administration</span><strong>Build the governed job catalogue</strong><small>Define reusable architecture before assigning it to Job Profiles.</small></summary>
      <section class="information-admin">
        <div class="information-command-grid">
          <details>
            <summary><span>01</span><strong>Create Job Family</strong></summary>
            <form method="POST" action="?/createJobFamily" class="admin-form">
              <label><span>Code</span><input name="code" required maxlength="80" /></label>
              <label><span>Name</span><input name="name" required maxlength="255" placeholder="Commercial" /></label>
              <label><span>Description</span><textarea name="description" rows="3"></textarea></label>
              <button type="submit">Create Family <span>→</span></button>
            </form>
          </details>

          <details>
            <summary><span>02</span><strong>Create Sub-family</strong></summary>
            <form method="POST" action="?/createJobSubfamily" class="admin-form">
              <label><span>Family</span><select name="familyId" required><option value="">Select Family</option>{#each families.filter(item=>item.status==='ACTIVE') as family}<option value={family.id}>{family.code} · {family.name}</option>{/each}</select></label>
              <label><span>Code</span><input name="code" required maxlength="80" /></label>
              <label><span>Name</span><input name="name" required maxlength="255" placeholder="Quantity Surveying" /></label>
              <label><span>Description</span><textarea name="description" rows="3"></textarea></label>
              <button type="submit">Create Sub-family <span>→</span></button>
            </form>
          </details>

          <details>
            <summary><span>03</span><strong>Create Career Level</strong></summary>
            <form method="POST" action="?/createCareerLevel" class="admin-form">
              <label><span>Code</span><input name="code" required maxlength="80" /></label>
              <label><span>Name</span><input name="name" required maxlength="255" placeholder="Senior Professional" /></label>
              <label><span>Track</span><select name="track" required><option value="INDIVIDUAL_CONTRIBUTOR">Individual Contributor</option><option value="MANAGEMENT">Management</option><option value="EXECUTIVE">Executive</option><option value="SPECIALIST">Specialist</option></select></label>
              <label><span>Sequence</span><input name="sequence" type="number" min="0" step="1" required /></label>
              <button type="submit">Create Career Level <span>→</span></button>
            </form>
          </details>

          <details>
            <summary><span>04</span><strong>Create Grade</strong></summary>
            <form method="POST" action="?/createGrade" class="admin-form">
              <label><span>Code</span><input name="code" required maxlength="80" /></label>
              <label><span>Name</span><input name="name" required maxlength="255" placeholder="G07" /></label>
              <label><span>Sequence</span><input name="sequence" type="number" min="0" step="1" required /></label>
              <button type="submit">Create Grade <span>→</span></button>
            </form>
          </details>

          <details>
            <summary><span>05</span><strong>Assign Job Profile Architecture</strong></summary>
            <form method="POST" action="?/assignJobArchitecture" class="admin-form">
              <label><span>Job Profile</span><select name="jobProfileId" required><option value="">Select Job Profile</option>{#each profiles as profile}<option value={profile.id}>{profile.code} · {profile.name}</option>{/each}</select></label>
              <label><span>Family</span><select name="familyId" required><option value="">Select Family</option>{#each families.filter(item=>item.status==='ACTIVE') as family}<option value={family.id}>{family.code} · {family.name}</option>{/each}</select></label>
              <label><span>Sub-family</span><select name="subfamilyId"><option value="">No Sub-family</option>{#each subfamilies.filter(item=>item.status==='ACTIVE') as subfamily}<option value={subfamily.id}>{subfamily.code} · {subfamily.name}</option>{/each}</select></label>
              <label><span>Career Level</span><select name="careerLevelId"><option value="">No Career Level</option>{#each levels.filter(item=>item.status==='ACTIVE') as level}<option value={level.id}>{level.code} · {level.name} · {level.track.replaceAll('_',' ')}</option>{/each}</select></label>
              <label><span>Grade</span><select name="gradeId"><option value="">No Grade</option>{#each grades.filter(item=>item.status==='ACTIVE') as grade}<option value={grade.id}>{grade.code} · {grade.name}</option>{/each}</select></label>
              <label><span>Effective from</span><input name="effectiveFrom" type="datetime-local" /></label>
              <label><span>Effective to</span><input name="effectiveTo" type="datetime-local" /></label>
              <button type="submit">Assign Architecture <span>→</span></button>
            </form>
          </details>
        </div>
      </section>
    </details>
  {/if}

  <section class="workspace-panel">
    <div class="panel-heading"><div><p class="app-eyebrow">Effective-dated architecture</p><h2>Job Profile catalogue</h2></div><span>{architecture.length}</span></div>
    <div class="workspace-register-list">
      {#each architecture as item}
        <article>
          <div>
            <strong>{item.jobProfileCode} · {item.jobProfileName}</strong>
            <span>{item.familyCode} · {item.familyName}{item.subfamilyName ? ` → ${item.subfamilyCode} · ${item.subfamilyName}` : ''}</span>
            <span>{item.careerLevelName ? `${item.careerLevelCode} · ${item.careerLevelName}` : 'No Career Level'} · {item.gradeName ? `${item.gradeCode} · ${item.gradeName}` : 'No Grade'}</span>
          </div>
          <small>{item.status} · {dateOnly(item.effectiveFrom)}{#if item.effectiveTo} → {dateOnly(item.effectiveTo)}{/if}</small>
        </article>
      {:else}
        <p class="information-empty">No Job Profiles have governed architecture assignments yet.</p>
      {/each}
    </div>
  </section>
{/if}
