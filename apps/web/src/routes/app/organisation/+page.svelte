<script lang="ts">
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  function statusLabel(status: string) {
    return status === 'ACTIVE' ? 'Active' : 'Inactive';
  }
</script>

<svelte:head>
  <title>Organisation — NuBlox</title>
</svelte:head>

{#if !data.allowed || !data.structure}
  <section class="permission-state">
    <div class="permission-state-code">403</div>
    <div>
      <p class="app-eyebrow">Controlled access outcome</p>
      <h1>Your role does not permit this workspace.</h1>
      <p>
        NuBlox evaluated <code>platform.organisation.read</code> in the current tenant scope and
        did not find an active matching Access Role Assignment.
      </p>
      <p class="permission-reason">{data.reason}</p>
      <div class="permission-actions">
        <a
          class="primary-action permission-back"
          href="/app/request-access?permission=platform.organisation.read&returnTo=/app/organisation"
        >
          Request access
          <span aria-hidden="true">→</span>
        </a>
        <a class="quiet-link" href="/app">Back to Functions</a>
      </div>
    </div>
  </section>
{:else}
  <section class="workspace-hero compact organisation-hero">
    <div>
      <p class="app-eyebrow">Enterprise kernel</p>
      <h1>Organisation</h1>
      <p class="workspace-lede">
        Tenant Organisation, Organisation Unit, Position and Person occupancy truth. Structure is
        kept separate from Function, Job Profile, Permission, Responsibility and Authority.
      </p>
    </div>
  </section>

  {#if form?.message || form?.error}
    <div class:success={form?.ok} class:error={!form?.ok} class="admin-feedback" role="status">
      <strong>{form?.ok ? 'Completed' : 'Action not completed'}</strong>
      <span>{form?.message ?? form?.error}</span>
    </div>
  {/if}

  {#if data.canManageOrganisation || data.canManagePeople}
    <section class="organisation-admin">
      <header>
        <div>
          <p class="app-eyebrow">Controlled administration</p>
          <h2>Maintain organisation structure</h2>
        </div>
        <p>
          Each command is tenant-scoped, permission-checked, transactional and attributable.
          Organisation structure changes do not grant business Authority.
        </p>
      </header>

      <div class="admin-command-grid">
        {#if data.canManageOrganisation}
          <details>
            <summary>
              <span>01</span>
              <div>
                <strong>Create Organisation</strong>
                <small>Legal/trading entity master</small>
              </div>
            </summary>
            <form method="POST" action="?/createOrganisation" class="admin-form">
              <label>
                <span>Legal name</span>
                <input name="legalName" required maxlength="255" />
              </label>
              <label>
                <span>Trading name</span>
                <input name="tradingName" maxlength="255" />
              </label>
              <button type="submit">Create Organisation <span>→</span></button>
            </form>
          </details>

          <details>
            <summary>
              <span>02</span>
              <div>
                <strong>Add Organisation Unit</strong>
                <small>Governed structural unit</small>
              </div>
            </summary>
            <form method="POST" action="?/createUnit" class="admin-form">
              <label>
                <span>Organisation</span>
                <select name="organisationId" required>
                  <option value="">Select Organisation</option>
                  {#each data.structure.organisations as organisation}
                    <option value={organisation.id}>
                      {organisation.tradingName ?? organisation.legalName}
                    </option>
                  {/each}
                </select>
              </label>
              <label>
                <span>Parent Unit</span>
                <select name="parentUnitId">
                  <option value="">Root Unit</option>
                  {#each data.structure.organisations as organisation}
                    {#each organisation.units as unit}
                      <option value={unit.id}>
                        {organisation.tradingName ?? organisation.legalName} · {unit.code} — {unit.name}
                      </option>
                    {/each}
                  {/each}
                </select>
              </label>
              <div class="admin-form-split">
                <label>
                  <span>Unit code</span>
                  <input name="code" required maxlength="80" autocomplete="off" />
                </label>
                <label>
                  <span>Unit name</span>
                  <input name="name" required maxlength="255" />
                </label>
              </div>
              <button type="submit" disabled={data.structure.organisations.length === 0}>
                Add Unit <span>→</span>
              </button>
            </form>
          </details>

          <details>
            <summary>
              <span>03</span>
              <div>
                <strong>Create Position</strong>
                <small>Organisational seat linked to Job Profile</small>
              </div>
            </summary>
            <form method="POST" action="?/createPosition" class="admin-form">
              <label>
                <span>Organisation Unit</span>
                <select name="organisationUnitId" required>
                  <option value="">Select Unit</option>
                  {#each data.structure.organisations as organisation}
                    {#each organisation.units as unit}
                      <option value={unit.id}>
                        {organisation.tradingName ?? organisation.legalName} · {unit.code} — {unit.name}
                      </option>
                    {/each}
                  {/each}
                </select>
              </label>
              <label>
                <span>Job Profile</span>
                <select name="jobProfileId">
                  <option value="">No Job Profile yet</option>
                  {#each data.structure.jobProfiles as profile}
                    <option value={profile.id}>
                      {profile.code} — {profile.name} ({profile.catalogueScope.toLowerCase()})
                    </option>
                  {/each}
                </select>
              </label>
              <div class="admin-form-split">
                <label>
                  <span>Position code</span>
                  <input name="code" required maxlength="80" autocomplete="off" />
                </label>
                <label>
                  <span>Position title</span>
                  <input name="title" required maxlength="255" />
                </label>
              </div>
              <button
                type="submit"
                disabled={data.structure.organisations.every((organisation) => organisation.units.length === 0)}
              >
                Create Position <span>→</span>
              </button>
            </form>
          </details>
        {/if}

        {#if data.canManagePeople}
          <details>
            <summary>
              <span>04</span>
              <div>
                <strong>Create Person</strong>
                <small>Canonical tenant Person master</small>
              </div>
            </summary>
            <form method="POST" action="?/createPerson" class="admin-form">
              <label>
                <span>Legal name</span>
                <input name="legalName" required maxlength="255" />
              </label>
              <label>
                <span>Preferred name</span>
                <input name="preferredName" maxlength="255" />
              </label>
              <button type="submit">Create Person <span>→</span></button>
            </form>
          </details>

          <details>
            <summary>
              <span>05</span>
              <div>
                <strong>Assign Person to Position</strong>
                <small>Create effective Position occupancy</small>
              </div>
            </summary>
            <form method="POST" action="?/assignPerson" class="admin-form">
              <label>
                <span>Person</span>
                <select name="personId" required>
                  <option value="">Select Person</option>
                  {#each data.structure.people as person}
                    {#if person.status === 'ACTIVE'}
                      <option value={person.id}>{person.name}</option>
                    {/if}
                  {/each}
                </select>
              </label>
              <label>
                <span>Position</span>
                <select name="positionId" required>
                  <option value="">Select Position</option>
                  {#each data.structure.organisations as organisation}
                    {#each organisation.units as unit}
                      {#each unit.positions as position}
                        <option value={position.id}>
                          {unit.code} · {position.code} — {position.title}
                        </option>
                      {/each}
                    {/each}
                  {/each}
                </select>
              </label>
              <label>
                <span>Effective from</span>
                <input name="effectiveFrom" type="datetime-local" />
              </label>
              <button
                type="submit"
                disabled={
                  data.structure.people.length === 0 ||
                  data.structure.organisations.every((organisation) =>
                    organisation.units.every((unit) => unit.positions.length === 0)
                  )
                }
              >
                Assign Person <span>→</span>
              </button>
            </form>
          </details>
        {/if}
      </div>
    </section>
  {/if}

  <section class="architecture-metrics organisation-metrics" aria-label="Organisation structure totals">
    <article>
      <span>Organisations</span>
      <strong>{data.structure.totals.organisations}</strong>
      <p>Legal/trading entities in tenant scope</p>
    </article>
    <article>
      <span>Organisation units</span>
      <strong>{data.structure.totals.units}</strong>
      <p>Governed structural units</p>
    </article>
    <article>
      <span>Positions</span>
      <strong>{data.structure.totals.positions}</strong>
      <p>{data.structure.totals.occupiedPositions} currently occupied</p>
    </article>
    <article>
      <span>People</span>
      <strong>{data.structure.totals.people}</strong>
      <p>{data.structure.totals.unassignedPeople} active without a current Position</p>
    </article>
  </section>

  <section class="workspace-section organisation-section">
    <div class="workspace-section-heading">
      <div>
        <p class="app-eyebrow">Canonical structure</p>
        <h2>Organisation hierarchy</h2>
      </div>
      <p>
        Positions are organisational seats. Occupants are People. Job Profiles describe reusable
        expectations for work; they do not become access roles or delegated Authority.
      </p>
    </div>

    {#if data.structure.organisations.length === 0}
      <section class="empty-work-state">
        <div class="empty-state-mark">OR</div>
        <div>
          <p class="app-eyebrow">Current tenant</p>
          <h2>No Organisation records exist yet.</h2>
          <p>
            The tenant is valid, but no Organisation master has been established in the canonical
            kernel.
          </p>
        </div>
      </section>
    {:else}
      <div class="organisation-list">
        {#each data.structure.organisations as organisation}
          <article class="organisation-card">
            <header>
              <div>
                <span class="organisation-status">{statusLabel(organisation.status)}</span>
                <h3>{organisation.tradingName ?? organisation.legalName}</h3>
                {#if organisation.tradingName}
                  <p>{organisation.legalName}</p>
                {/if}
              </div>
              <span class="organisation-id">{organisation.id}</span>
            </header>

            <div class="organisation-units">
              {#if organisation.units.length === 0}
                <p class="organisation-empty">No Organisation Units.</p>
              {:else}
                {#each organisation.units as unit}
                  <details>
                    <summary>
                      <div>
                        <span class="unit-code">{unit.code}</span>
                        <strong>{unit.name}</strong>
                      </div>
                      <span>{unit.positions.length} positions</span>
                    </summary>

                    <div class="unit-detail">
                      {#if unit.parentUnitId}
                        <p class="unit-parent">Parent Unit: {unit.parentUnitId}</p>
                      {/if}

                      {#if unit.positions.length === 0}
                        <p class="organisation-empty">No Positions in this Unit.</p>
                      {:else}
                        <div class="position-list">
                          {#each unit.positions as position}
                            <article>
                              <div class="position-title">
                                <span>{position.code}</span>
                                <div>
                                  <strong>{position.title}</strong>
                                  {#if position.jobProfileName}
                                    <small>{position.jobProfileName}</small>
                                  {/if}
                                </div>
                              </div>

                              <div class="position-occupants">
                                {#if position.occupants.length === 0}
                                  <span class="vacant-position">Vacant</span>
                                {:else}
                                  {#each position.occupants as occupant}
                                    <span>
                                      <strong>{occupant.personName}</strong>
                                      <small>{occupant.personId}</small>
                                    </span>
                                  {/each}
                                {/if}
                              </div>
                            </article>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  </details>
                {/each}
              {/if}
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </section>

  <section class="workspace-panel people-panel">
    <div class="panel-heading">
      <div>
        <p class="app-eyebrow">Tenant people</p>
        <h2>People &amp; current Position state</h2>
      </div>
      <span>{data.structure.people.length}</span>
    </div>

    <div class="people-list">
      {#each data.structure.people as person}
        <div>
          <strong>{person.name}</strong>
          <span>{person.id}</span>
          <em class:unassigned={!person.hasCurrentPosition}>
            {person.hasCurrentPosition ? 'Position assigned' : 'No current Position'}
          </em>
        </div>
      {/each}
    </div>
  </section>
{/if}
