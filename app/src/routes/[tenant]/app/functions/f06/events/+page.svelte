<script lang="ts">
  let { data, form } = $props();
  const href = (id: string) =>
    `/${data.tenantSlug}/app/functions/f06/events?campaign=${encodeURIComponent(id)}`;
</script>

<svelte:head><title>Events · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f06`}>F06 Marketing & Brand</a><span>›</span><strong
      >F06.08 Events</strong
    >
  </nav>
  <header class="hero section-card">
    <div>
      <span class="eyebrow">F06.08 · EVENT CAMPAIGN</span>
      <h1>Events</h1>
      <p>
        Plan and evaluate events as Communications Campaigns with supplier references, governed
        registrations, attendance and outcome evidence.
      </p>
    </div>
    <div class="principle">
      <strong>Event is a campaign execution pattern</strong><span
        >It does not become a parallel CRM or project master.</span
      ><small
        >Participants remain Party or Lead identities and registrations retain their provenance.</small
      >
    </div>
  </header>
  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <span class="eyebrow">Event campaign register</span>
      <h2>{data.campaigns.length} events</h2>
      <nav class="rows">
        {#each data.campaigns as campaign}<a
            class:active={data.selected?.id === campaign.id}
            href={href(campaign.id)}
            ><div><strong>{campaign.campaignRef}</strong><span>{campaign.status}</span></div>
            <p>{campaign.title}</p>
            <small
              >{campaign.currentVersionNo ? 'Campaign v' + campaign.currentVersionNo : ''}</small
            ></a
          >{:else}<p class="empty">No event campaigns.</p>{/each}
      </nav>
      {#if data.canCampaign}
        <details class="command">
          <summary>Create EVENT campaign</summary>
          <form method="POST" action="?/createCampaign">
            <div class="grid">
              <label>Reference<input name="campaignRef" required /></label><label
                >Title<input name="title" required /></label
              >
            </div>
            <label
              >Approved / active plan<select name="communicationsPlanId"
                ><option value="">None</option
                >{#each data.plans.filter( (p) => ['APPROVED', 'ACTIVE'].includes(p.status) ) as plan}<option
                    value={plan.id}>{plan.planRef} · {plan.title}</option
                  >{/each}</select
              ></label
            >
            <label
              >Objectives JSON<textarea name="objectives" rows="3" value={'{}'}></textarea></label
            >
            <label
              >Audience strategy JSON<textarea name="audienceStrategy" rows="3" value={'{}'}
              ></textarea></label
            >
            <label
              >Key messages JSON<textarea name="keyMessages" rows="3" value={'{}'}
              ></textarea></label
            >
            <label>Schedule JSON<textarea name="schedule" rows="3" value={'{}'}></textarea></label>
            <label
              >Measurement plan JSON<textarea name="measurementPlan" rows="3" value={'{}'}
              ></textarea></label
            >
            <button>Create event campaign</button>
          </form>
        </details>
      {/if}
    </aside>

    <main>
      {#if data.selected}
        <section class="section-card detail">
          <div class="head">
            <div>
              <span class="eyebrow">EVENT CAMPAIGN</span>
              <h2>{data.selected.campaignRef} · {data.selected.title}</h2>
            </div>
            <span class="status">{data.event?.eventStatus ?? 'NOT CONFIGURED'}</span>
          </div>
          {#if data.event}
            <div class="facts">
              <span><small>Event type</small><strong>{data.event.eventType}</strong></span><span
                ><small>Start</small><strong
                  >{new Date(data.event.eventStartAt).toLocaleString('en-GB')}</strong
                ></span
              ><span><small>Registrations</small><strong>{data.registrations.length}</strong></span
              ><span
                ><small>Attended</small><strong
                  >{data.registrations.filter((r) => r.registrationStatus === 'ATTENDED')
                    .length}</strong
                ></span
              >
            </div>
            <section class="panel">
              <span class="eyebrow">Delivery context</span>
              <p><strong>Venue</strong> {data.event.venue ?? 'Not recorded'}</p>
              <p><strong>Delivery notes</strong> {data.event.deliveryNotes ?? '—'}</p>
              {#if data.event.outcomeSummary}<p>
                  <strong>Outcome</strong>
                  {data.event.outcomeSummary}
                </p>{/if}
            </section>
          {/if}

          {#if data.canManage}
            <div class="command-grid">
              <details class="command" open={!data.event}>
                <summary>Configure event</summary>
                <form method="POST" action="?/configure">
                  <input type="hidden" name="campaignId" value={data.selected.id} />
                  <div class="grid">
                    <label
                      >Event type<input
                        name="eventType"
                        value={data.event?.eventType ?? 'ROUNDTABLE'}
                        required
                      /></label
                    ><label>Venue<input name="venue" value={data.event?.venue ?? ''} /></label>
                  </div>
                  <div class="grid">
                    <label>Start<input type="datetime-local" name="eventStartAt" required /></label
                    ><label>End<input type="datetime-local" name="eventEndAt" required /></label>
                  </div>
                  <label
                    >Supplier references JSON<textarea name="supplierReferences" rows="3"
                      >{JSON.stringify(data.event?.supplierReferences ?? [])}</textarea
                    ></label
                  >
                  <label
                    >Registration policy JSON<textarea name="registrationPolicy" rows="3"
                      >{JSON.stringify(data.event?.registrationPolicy ?? {})}</textarea
                    ></label
                  >
                  <label
                    >Delivery notes<textarea name="deliveryNotes" rows="3"
                      >{data.event?.deliveryNotes ?? ''}</textarea
                    ></label
                  ><button>Save event profile</button>
                </form>
              </details>
              {#if data.event && data.event.eventStatus !== 'COMPLETED'}
                <details class="command">
                  <summary>Register participant</summary>
                  <form method="POST" action="?/register">
                    <input type="hidden" name="campaignId" value={data.selected.id} /><input
                      type="hidden"
                      name="subjectType"
                      value="LEAD"
                    />
                    <label
                      >Lead<select name="subjectId" required
                        ><option value="">Select Lead</option>{#each data.leads as lead}<option
                            value={lead.id}>{lead.leadRef} · {lead.prospectName}</option
                          >{/each}</select
                      ></label
                    >
                    <label
                      >Registration reference<input name="registrationReference" required /></label
                    ><label>Source reference<input name="sourceReference" /></label><button
                      >Register participant</button
                    >
                  </form>
                </details>
              {/if}
            </div>
          {/if}

          <section class="panel">
            <div class="section-head">
              <span class="eyebrow">Registrations & attendance</span><strong
                >{data.registrations.length}</strong
              >
            </div>
            {#each data.registrations as registration}
              <article>
                <div>
                  <strong>{registration.registrationReference}</strong><span
                    >{registration.registrationStatus}</span
                  >
                </div>
                <small
                  >{registration.leadId ?? registration.partyId} · {new Date(
                    registration.registeredAt
                  ).toLocaleString('en-GB')}</small
                >{#if data.canManage && registration.registrationStatus === 'REGISTERED'}<form
                    method="POST"
                    action="?/attend"
                    class="mini"
                  >
                    <input type="hidden" name="campaignId" value={data.selected.id} /><input
                      type="hidden"
                      name="registrationId"
                      value={registration.id}
                    /><button>Mark attended</button>
                  </form>{/if}
              </article>
            {:else}<p>No registrations.</p>{/each}
          </section>
          {#if data.canManage && data.event && data.event.eventStatus !== 'COMPLETED'}
            <form method="POST" action="?/complete" class="complete">
              <input type="hidden" name="campaignId" value={data.selected.id} /><label
                >Outcome summary<textarea name="outcomeSummary" rows="3" required></textarea></label
              ><button>Complete event evidence</button>
            </form>
          {/if}
          <p class="note">
            Campaign approval, audience/content control and activation are completed in Campaign
            Studio before outbound communications.
          </p>
        </section>
      {:else}<section class="section-card empty-state">
          <h2>Create an EVENT campaign to begin event planning</h2>
        </section>{/if}
    </main>
  </div>
</div>

<style>
  .page {
    display: grid;
    gap: 12px;
  }
  .breadcrumb,
  .head,
  .rows div,
  .section-head,
  .panel article div {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .breadcrumb {
    font-size: 9px;
    color: #728694;
  }
  .breadcrumb a {
    color: #315f7d;
    text-decoration: none;
  }
  .hero {
    display: grid;
    grid-template-columns: 1.5fr 0.7fr;
    gap: 20px;
    padding: 18px;
    background: linear-gradient(120deg, #fbfdff, #eaf6fd);
  }
  .eyebrow {
    font-size: 9px;
    font-weight: 850;
    color: var(--blue-700);
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }
  h1 {
    margin: 4px 0 6px;
    font-size: 25px;
  }
  h2 {
    margin: 3px 0 8px;
    font-size: 16px;
  }
  p {
    font-size: 10px;
    color: #5f7484;
    line-height: 1.5;
  }
  .principle {
    display: grid;
    gap: 5px;
    padding: 12px;
    border: 1px solid #bddded;
    border-radius: 9px;
    background: #fff;
  }
  .principle strong {
    font-size: 11px;
    color: #315d76;
  }
  .principle span,
  .principle small {
    font-size: 9px;
    color: #667c8b;
  }
  .workspace {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 12px;
    align-items: start;
  }
  .register,
  .detail {
    padding: 13px;
  }
  .register {
    position: sticky;
    top: 78px;
  }
  .rows {
    display: grid;
    gap: 6px;
    margin-top: 8px;
  }
  .rows a {
    display: grid;
    gap: 4px;
    padding: 8px;
    border: 1px solid #dfe7ec;
    border-radius: 7px;
    background: #fafcfd;
    color: inherit;
    text-decoration: none;
  }
  .rows a.active {
    border-color: #79bde2;
    background: #edf8fe;
  }
  .rows div,
  .head,
  .section-head,
  .panel article div {
    justify-content: space-between;
  }
  .rows p {
    margin: 0;
  }
  .rows strong {
    font-size: 9.5px;
  }
  .rows span,
  .rows small {
    font-size: 8px;
    color: #718693;
  }
  .status {
    font-size: 8px;
    font-weight: 850;
    padding: 4px 6px;
    border-radius: 999px;
    background: #eaf4f9;
    color: #35617d;
  }
  .facts {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    margin: 10px 0;
  }
  .facts span {
    display: grid;
    gap: 2px;
    padding: 7px;
    background: #f4f7f9;
    border-radius: 6px;
  }
  .facts small {
    font-size: 7px;
    color: #85949e;
  }
  .facts strong {
    font-size: 9px;
  }
  .panel {
    padding: 10px;
    border: 1px solid #dfe7ec;
    border-radius: 8px;
    margin-top: 8px;
  }
  .panel article {
    padding: 7px 0;
    border-bottom: 1px solid #edf1f3;
  }
  .panel article:last-child {
    border: 0;
  }
  .panel article strong {
    font-size: 8.5px;
  }
  .panel article span,
  .panel article small {
    font-size: 8px;
    color: #748894;
  }
  .command-grid,
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .command {
    margin-top: 10px;
    border-top: 1px solid #e4eaee;
    padding-top: 8px;
  }
  .command summary {
    cursor: pointer;
    font-size: 9px;
    font-weight: 800;
    color: #35617d;
  }
  form {
    display: grid;
    gap: 7px;
    margin-top: 8px;
  }
  label {
    display: grid;
    gap: 4px;
    font-size: 8.5px;
    color: #52697a;
    font-weight: 750;
  }
  input,
  select,
  textarea {
    width: 100%;
    padding: 7px;
    border: 1px solid #ccd8e0;
    border-radius: 6px;
    font: inherit;
  }
  button {
    border: 0;
    border-radius: 6px;
    padding: 8px 10px;
    background: var(--blue-700);
    color: #fff;
    font-size: 9px;
    font-weight: 800;
    cursor: pointer;
  }
  .mini {
    display: flex;
    justify-content: flex-end;
    margin: 4px 0 0;
  }
  .mini button {
    padding: 5px 7px;
  }
  .complete {
    margin-top: 10px;
    padding: 9px;
    border: 1px solid #d8e6ee;
    border-radius: 8px;
    background: #f7fbfd;
  }
  .message {
    padding: 9px;
    border: 1px solid #dd8a8a;
    background: #fff3f3;
    color: #792f2f;
    font-size: 9px;
  }
  .note {
    margin-top: 10px;
    font-size: 8.5px;
    color: #738795;
  }
  .empty,
  .empty-state {
    color: #758896;
  }
  .empty-state {
    padding: 24px;
    text-align: center;
  }
  @media (max-width: 900px) {
    .hero,
    .workspace,
    .facts,
    .command-grid,
    .grid {
      grid-template-columns: 1fr;
    }
    .register {
      position: static;
    }
  }
</style>
