<script lang="ts">
  let { data, form } = $props();

  const enterpriseFunctions = $derived(
    data.functions.filter((item) => item.functionType === 'ENTERPRISE_FUNCTION')
  );
  const deliveryDomains = $derived(
    data.functions.filter((item) => item.functionType === 'DELIVERY_DOMAIN')
  );
  const selectedAssignments = $derived(data.assignments);
  const bootstrapReady = $derived(data.functions.length > 0 && data.jobs.length > 0);
</script>

<svelte:head>
  <title>Functional Governance & Deployment · NuBlox</title>
</svelte:head>

<div class="page">
  <header class="hero section-card">
    <div>
      <span class="eyebrow">Governance · Delivery · Deployment</span>
      <h1>Functional capability deployment</h1>
      <p>
        Govern the enterprise capability model, connect the 84 Construction & Built Environment jobs,
        create real organisational Positions and deploy those capabilities into projects, contracts,
        sites, assets and enterprise contexts.
      </p>
    </div>
    <div class="hero-actions">
      <a href={'/' + data.tenantSlug + '/app/admin/business-objects/people-hcm'}>People & HCM model</a>
      <a href={'/' + data.tenantSlug + '/app/admin/master-data/organisation-structure'}>Organisation structure</a>
      <a href={'/' + data.tenantSlug + '/app/work'}>My Work</a>
    </div>
  </header>

  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <section class="metrics" aria-label="Functional deployment summary">
    <div class="metric section-card">
      <strong>{enterpriseFunctions.length}</strong><span>enterprise functions</span>
    </div>
    <div class="metric section-card">
      <strong>{deliveryDomains.length}</strong><span>delivery domains</span>
    </div>
    <div class="metric section-card">
      <strong>{data.jobs.length}</strong><span>job profiles</span>
    </div>
    <div class="metric section-card">
      <strong>{data.positions.length}</strong><span>positions</span>
    </div>
    <div class="metric section-card">
      <strong>{data.deployments.length}</strong><span>deployments</span>
    </div>
  </section>

  {#if !bootstrapReady}
    <section class="bootstrap section-card">
      <div>
        <span class="eyebrow">Tenant capability baseline</span>
        <h2>Bootstrap the NuBlox functional catalogue</h2>
        <p>
          This creates the governed F01–F29 enterprise functions, 16 Construction & Built Environment
          delivery domains and 84 sector Job Profiles for this tenant. It is idempotent and can be run
          again safely.
        </p>
      </div>
      {#if data.canManageCatalogue}
        <form method="POST" action="?/bootstrap">
          <button type="submit">Bootstrap 29 + 16 + 84 catalogue</button>
        </form>
      {/if}
    </section>
  {:else}
    <section class="catalogue-strip section-card">
      <div>
        <span class="eyebrow">Governed baseline</span>
        <strong>29 enterprise functions</strong>
        <small>how the organisation operates</small>
      </div>
      <div>
        <span class="eyebrow">Sector delivery</span>
        <strong>16 delivery domains</strong>
        <small>where construction capability lives</small>
      </div>
      <div>
        <span class="eyebrow">Employment capability</span>
        <strong>84 construction jobs</strong>
        <small>who performs the work</small>
      </div>
      {#if data.canManageCatalogue}
        <form method="POST" action="?/bootstrap">
          <button class="quiet" type="submit">Reconcile catalogue</button>
        </form>
      {/if}
    </section>
  {/if}

  <div class="workspace-grid">
    <section class="register section-card">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Functional deployment register</span>
          <h2>Where capability is deployed</h2>
        </div>
        {#if data.canManageDeployment && bootstrapReady}
          <details>
            <summary>Create deployment</summary>
            <form class="form-grid" method="POST" action="?/createDeployment">
              <label>
                Function / delivery domain
                <select name="functionalDefinitionId" required>
                  <option value="">Select capability</option>
                  <optgroup label="Enterprise functions">
                    {#each enterpriseFunctions as item}
                      <option value={item.id}>{item.functionCode} · {item.name}</option>
                    {/each}
                  </optgroup>
                  <optgroup label="Sector delivery domains">
                    {#each deliveryDomains as item}
                      <option value={item.id}>{item.functionCode} · {item.name}</option>
                    {/each}
                  </optgroup>
                </select>
              </label>
              <label>Deployment reference<input name="deploymentReference" required placeholder="PRJ-ALPHA-ARCH" /></label>
              <label>
                Context type
                <select name="contextType" required>
                  <option>PROJECT</option>
                  <option>CONTRACT</option>
                  <option>PACKAGE</option>
                  <option>SITE</option>
                  <option>ASSET</option>
                  <option>ORGANISATION</option>
                  <option>ENTERPRISE</option>
                </select>
              </label>
              <label>Context ID<input name="contextId" required placeholder="PROJECT-ALPHA" /></label>
              <label>
                Delivery organisation
                <select name="deliveryOrganisationPartyId">
                  <option value="">Not assigned</option>
                  {#each data.organisations as item}
                    <option value={item.id}>{item.displayName}</option>
                  {/each}
                </select>
              </label>
              <label>
                Organisation unit
                <select name="organisationUnitId">
                  <option value="">Not assigned</option>
                  {#each data.organisationUnits as item}
                    <option value={item.id}>{item.unitCode} · {item.name}</option>
                  {/each}
                </select>
              </label>
              <label class="wide">Responsibility scope<textarea name="responsibilityScope" required rows="3" placeholder="Describe what this deployment is accountable for."></textarea></label>
              <label>Valid from<input type="datetime-local" name="validFrom" /></label>
              <label>Valid to<input type="datetime-local" name="validTo" /></label>
              <button type="submit">Create planned deployment</button>
            </form>
          </details>
        {/if}
      </div>

      <div class="deployment-list">
        {#each data.deployments as item}
          <a
            class:active={data.selected?.id === item.id}
            href={'?deployment=' + encodeURIComponent(item.id)}
          >
            <div>
              <span class="reference">{item.deploymentReference}</span>
              <strong>{item.functionCode} · {item.functionName}</strong>
              <small>{item.contextType} · {item.contextId}</small>
            </div>
            <div class="list-meta">
              <span class={'status status-' + item.status.toLowerCase()}>{item.status}</span>
              <small>{item.assignmentCount} assignments</small>
            </div>
          </a>
        {:else}
          <div class="empty">
            <strong>No functional deployments yet</strong>
            <span>Bootstrap the catalogue, then deploy a function or delivery domain to a real context.</span>
          </div>
        {/each}
      </div>
    </section>

    <main class="inspector">
      {#if data.selected}
        <section class="section-card deployment-card">
          <div class="identity">
            <div>
              <span class="eyebrow">{data.selected.functionType.replaceAll('_', ' ')}</span>
              <h2>{data.selected.functionCode} · {data.selected.functionName}</h2>
              <code>{data.selected.deploymentReference}</code>
            </div>
            <div class="badges">
              <span>{data.selected.status}</span>
              <span>v{data.selected.version}</span>
            </div>
          </div>

          <dl>
            <div><dt>Context</dt><dd>{data.selected.contextType} · {data.selected.contextId}</dd></div>
            <div><dt>Delivery organisation</dt><dd>{data.selected.deliveryOrganisationName || 'Not assigned'}</dd></div>
            <div><dt>Organisation unit</dt><dd>{data.selected.organisationUnitName || 'Not assigned'}</dd></div>
            <div><dt>Effective</dt><dd>{data.selected.validFrom} → {data.selected.validTo || 'Open'}</dd></div>
          </dl>
          <div class="scope">
            <small>Responsibility scope</small>
            <p>{data.selected.responsibilityScope}</p>
          </div>

          {#if data.canManageDeployment && data.selected.status === 'PLANNED'}
            <form method="POST" action="?/activate" class="lifecycle">
              <input type="hidden" name="deploymentId" value={data.selected.id} />
              <input type="hidden" name="version" value={data.selected.version} />
              <button type="submit">Activate deployment</button>
            </form>
          {/if}
        </section>

        <section class="section-card assignment-card">
          <div class="section-heading">
            <div>
              <span class="eyebrow">Deployment team</span>
              <h2>{selectedAssignments.length} active assignments</h2>
            </div>
            {#if data.canManageDeployment}
              <details>
                <summary>Assign capability</summary>
                <form class="form-grid" method="POST" action="?/assign">
                  <input type="hidden" name="deploymentId" value={data.selected.id} />
                  <label>
                    Job Profile
                    <select name="jobProfileId" required>
                      <option value="">Select job</option>
                      {#each data.jobs as job}
                        <option value={job.id}>{job.name} · {job.sectorDomain || 'Enterprise'}</option>
                      {/each}
                    </select>
                  </label>
                  <label>
                    Assignment role
                    <select name="assignmentRole">
                      <option>DELIVERY</option>
                      <option>PRIMARY</option>
                      <option>GOVERNANCE</option>
                      <option>ASSURANCE</option>
                      <option>SUPPORT</option>
                    </select>
                  </label>
                  <label>
                    Position
                    <select name="positionId">
                      <option value="">No Position</option>
                      {#each data.positions as position}
                        <option value={position.id}>{position.positionCode} · {position.name}</option>
                      {/each}
                    </select>
                  </label>
                  <label>
                    Person
                    <select name="personPartyId">
                      <option value="">No Person</option>
                      {#each data.people as person}
                        <option value={person.id}>{person.displayName}</option>
                      {/each}
                    </select>
                  </label>
                  <label>
                    Organisation
                    <select name="organisationPartyId">
                      <option value="">No organisation</option>
                      {#each data.organisations as organisation}
                        <option value={organisation.id}>{organisation.displayName}</option>
                      {/each}
                    </select>
                  </label>
                  <label>Allocation %<input type="number" min="0.01" max="100" step="0.01" name="allocationPercent" value="100" /></label>
                  <label class="wide">Assignment scope<textarea name="assignmentScope" rows="2" placeholder="Package, discipline, location, systems, deliverables or other responsibility scope."></textarea></label>
                  <label>Authority reference type<input name="authorityReferenceType" placeholder="DELEGATED_AUTHORITY" /></label>
                  <label>Authority reference ID<input name="authorityReferenceId" /></label>
                  <label>Valid from<input type="datetime-local" name="validFrom" /></label>
                  <label>Valid to<input type="datetime-local" name="validTo" /></label>
                  <button type="submit">Assign to deployment</button>
                </form>
              </details>
            {/if}
          </div>

          <div class="assignment-list">
            {#each selectedAssignments as assignment}
              <article>
                <div>
                  <span class="role">{assignment.assignmentRole}</span>
                  <strong>{assignment.jobName}</strong>
                  <small>
                    {assignment.positionName || assignment.personName || assignment.organisationName || 'Unresolved assignee'}
                  </small>
                </div>
                <div class="assignment-meta">
                  <span>{assignment.allocationPercent}%</span>
                  <small>{assignment.status}</small>
                </div>
                {#if assignment.responsibilityScope}
                  <p>{assignment.responsibilityScope}</p>
                {/if}
              </article>
            {:else}
              <div class="empty">
                <strong>No deployment assignments</strong>
                <span>Bind a Job Profile to a Position, Person or delivery organisation.</span>
              </div>
            {/each}
          </div>
        </section>
      {:else}
        <section class="section-card empty-state">
          <span class="eyebrow">Functional deployment</span>
          <h2>Select or create a deployment</h2>
          <p>
            A deployment connects a governed function/domain and Job Profile to the actual people,
            organisations and contexts responsible for delivering it.
          </p>
        </section>
      {/if}
    </main>
  </div>

  <section class="section-card positions-card">
    <div class="section-heading">
      <div>
        <span class="eyebrow">Organisation capability</span>
        <h2>Positions</h2>
      </div>
      {#if data.canManagePositions && bootstrapReady}
        <details>
          <summary>Create Position</summary>
          <form class="form-grid" method="POST" action="?/createPosition">
            <label>Position code<input name="positionCode" required placeholder="PRJ-A-ARCH-LEAD" /></label>
            <label>Position name<input name="positionName" required placeholder="Lead Architect — Project Alpha" /></label>
            <label>
              Job Profile
              <select name="jobProfileId" required>
                <option value="">Select job</option>
                {#each data.jobs as job}
                  <option value={job.id}>{job.name} · {job.sectorDomain || 'Enterprise'}</option>
                {/each}
              </select>
            </label>
            <label>
              Organisation unit
              <select name="organisationUnitId">
                <option value="">Not assigned</option>
                {#each data.organisationUnits as item}
                  <option value={item.id}>{item.unitCode} · {item.name}</option>
                {/each}
              </select>
            </label>
            <label>Capacity FTE<input type="number" min="0.01" step="0.01" name="capacityFte" value="1" /></label>
            <label>Valid from<input type="datetime-local" name="validFrom" /></label>
            <label>Valid to<input type="datetime-local" name="validTo" /></label>
            <button type="submit">Create Position</button>
          </form>
        </details>
      {/if}
    </div>

    <div class="position-grid">
      {#each data.positions.slice(0, 24) as position}
        <article>
          <span class="reference">{position.positionCode}</span>
          <strong>{position.name}</strong>
          <small>{position.jobName}</small>
          <div>
            <span>{position.organisationUnitName || 'No unit'}</span>
            <span>{position.occupantName || 'Vacant'}</span>
            <span>{position.capacityFte} FTE</span>
          </div>
        </article>
      {:else}
        <div class="empty">
          <strong>No Positions yet</strong>
          <span>Create governed organisational seats against the Job Profile catalogue.</span>
        </div>
      {/each}
    </div>
  </section>
</div>

<style>
  .page { display: grid; gap: 12px; }
  .section-card { border: 1px solid var(--line); border-radius: 10px; background: white; }
  .hero { display: grid; grid-template-columns: minmax(0,1fr) 260px; gap: 24px; padding: 18px; border-color: #8fc9ee; background: linear-gradient(120deg,#fbfdff,#eaf6fd); }
  .eyebrow { color: var(--blue-700); font-size: 9px; font-weight: 850; letter-spacing: .07em; text-transform: uppercase; }
  h1 { margin: 4px 0 7px; font-size: 25px; }
  h2 { margin: 2px 0 0; font-size: 16px; }
  .hero p, .bootstrap p, .scope p, .empty-state p { margin: 0; color: #526a7d; font-size: 11px; line-height: 1.5; }
  .hero-actions { display: grid; gap: 6px; align-content: start; }
  .hero-actions a { padding: 7px 9px; border: 1px solid #cfe0ea; border-radius: 7px; background: white; color: #315e79; font-size: 9.5px; font-weight: 800; text-decoration: none; }
  .message { padding: 9px 12px; border: 1px solid #dd8a8a; border-radius: 8px; background: #fff3f3; color: #792f2f; font-size: 11px; }
  .metrics { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); gap: 8px; }
  .metric { display: grid; gap: 2px; padding: 11px 13px; }
  .metric strong { color: #1d4f70; font-size: 20px; }
  .metric span { color: #718492; font-size: 8.5px; text-transform: uppercase; }
  .bootstrap { display: flex; justify-content: space-between; gap: 20px; align-items: center; padding: 14px; border-color: #dfc781; background: #fffaf0; }
  .catalogue-strip { display: grid; grid-template-columns: repeat(3,1fr) auto; gap: 10px; align-items: center; padding: 11px; }
  .catalogue-strip > div { display: grid; gap: 2px; }
  .catalogue-strip strong { color: #36566c; font-size: 12px; }
  .catalogue-strip small { color: #768895; font-size: 8.5px; }
  .workspace-grid { display: grid; grid-template-columns: 360px minmax(0,1fr); gap: 12px; align-items: start; }
  .register, .deployment-card, .assignment-card, .positions-card, .empty-state { padding: 14px; }
  .section-heading { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 10px; }
  details { border: 1px solid #d8e2e8; border-radius: 7px; background: white; }
  summary { padding: 7px 9px; cursor: pointer; color: #315c76; font-size: 9px; font-weight: 800; }
  .form-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 7px; padding: 9px; border-top: 1px solid #e4eaee; }
  .form-grid .wide { grid-column: 1/-1; }
  label { display: grid; gap: 3px; color: #546b7c; font-size: 8.5px; font-weight: 750; }
  input, select, textarea { width: 100%; border: 1px solid #cfdbe3; border-radius: 6px; padding: 7px; background: white; color: var(--ink); font-size: 9.5px; }
  textarea { resize: vertical; }
  button { border: 0; border-radius: 6px; padding: 7px 10px; background: var(--blue-700); color: white; font-size: 9px; font-weight: 800; cursor: pointer; }
  button.quiet { border: 1px solid #d5dfe6; background: white; color: #50697a; }
  .deployment-list { display: grid; gap: 5px; }
  .deployment-list a { display: flex; justify-content: space-between; gap: 10px; padding: 9px; border: 1px solid #e0e7eb; border-radius: 7px; color: inherit; text-decoration: none; }
  .deployment-list a:hover, .deployment-list a.active { border-color: #8fc9ee; background: #f1f9fd; }
  .deployment-list a > div:first-child { display: grid; gap: 2px; min-width: 0; }
  .reference { color: var(--blue-700); font-size: 8px; font-weight: 850; text-transform: uppercase; }
  .deployment-list strong, .position-grid strong, .assignment-list strong { color: #3b586b; font-size: 10px; }
  .deployment-list small, .position-grid small, .assignment-list small { color: #778a98; font-size: 8.5px; }
  .list-meta { display: grid; gap: 4px; justify-items: end; align-content: start; white-space: nowrap; }
  .status, .badges span, .role { padding: 3px 5px; border-radius: 999px; background: #edf2f5; color: #5d7383; font-size: 7.5px; font-weight: 850; text-transform: uppercase; }
  .status-active { background: #e7f5ea; color: #2f6d3c; }
  .status-planned { background: #fff2d7; color: #7d5c19; }
  .inspector { display: grid; gap: 12px; min-width: 0; }
  .identity { display: flex; justify-content: space-between; gap: 12px; align-items: start; padding-bottom: 10px; border-bottom: 1px solid #e5ebef; }
  .identity code { display: inline-block; margin-top: 4px; padding: 3px 5px; border-radius: 4px; background: #f2f5f7; color: #647b8b; font-size: 8px; }
  .badges { display: flex; gap: 4px; }
  dl { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 9px; margin: 11px 0; }
  dl div { display: grid; gap: 2px; }
  dt { color: #7b8d99; font-size: 8px; text-transform: uppercase; }
  dd { margin: 0; color: #435e70; font-size: 9.5px; }
  .scope { padding: 9px; border: 1px solid #e3e9ed; border-radius: 7px; background: #fafcfd; }
  .scope small { color: #7b8d99; font-size: 8px; text-transform: uppercase; }
  .scope p { margin-top: 4px; }
  .lifecycle { display: flex; justify-content: end; margin-top: 9px; }
  .assignment-list { display: grid; gap: 6px; }
  .assignment-list article { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 6px 12px; padding: 9px; border: 1px solid #e2e8ec; border-radius: 7px; }
  .assignment-list article > div:first-child { display: grid; gap: 2px; }
  .assignment-meta { display: grid; justify-items: end; align-content: start; gap: 2px; color: #5e7382; font-size: 9px; }
  .assignment-list p { grid-column: 1/-1; margin: 0; color: #657b8b; font-size: 9px; }
  .positions-card { display: grid; gap: 10px; }
  .position-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 7px; }
  .position-grid article { display: grid; gap: 3px; padding: 9px; border: 1px solid #e2e8ec; border-radius: 7px; }
  .position-grid article div { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 3px; }
  .position-grid article div span { padding: 3px 5px; border-radius: 5px; background: #f3f6f8; color: #647987; font-size: 7.5px; }
  .empty { display: grid; gap: 3px; padding: 20px 10px; color: #748895; text-align: center; font-size: 9px; }
  .empty-state { min-height: 280px; display: grid; place-content: center; text-align: center; }
  .empty-state p { max-width: 540px; margin-top: 7px; }
  @media (max-width: 1100px) {
    .workspace-grid { grid-template-columns: 300px minmax(0,1fr); }
    .position-grid { grid-template-columns: repeat(2,1fr); }
    .metrics { grid-template-columns: repeat(3,1fr); }
  }
  @media (max-width: 760px) {
    .hero, .workspace-grid, .catalogue-strip { grid-template-columns: 1fr; }
    .metrics, .position-grid, .form-grid, dl { grid-template-columns: 1fr; }
    .bootstrap { display: grid; }
    .form-grid .wide { grid-column: auto; }
  }
</style>
