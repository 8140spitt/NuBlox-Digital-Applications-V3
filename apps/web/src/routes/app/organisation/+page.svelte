<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

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
      <a class="primary-action permission-back" href="/app">
        Back to Functions
        <span aria-hidden="true">→</span>
      </a>
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
