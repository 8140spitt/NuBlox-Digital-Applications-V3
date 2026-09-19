<script lang="ts">
  let { data, form } = $props();

  function bodyHref(bodyId: string) {
    return `/${data.tenantSlug}/app/functions/f02/governance-bodies/meetings?body=${encodeURIComponent(bodyId)}`;
  }

  function meetingHref(bodyId: string, meetingId: string) {
    return bodyHref(bodyId) + '&meeting=' + encodeURIComponent(meetingId);
  }
</script>

<svelte:head><title>Board & Committee Meetings · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f02`}>F02 Corporate Governance</a>
    <span>›</span>
    <a href={`/${data.tenantSlug}/app/functions/f02/governance-bodies`}>Governance Bodies</a>
    <span>›</span>
    <strong>Meetings</strong>
  </nav>

  <header class="hero section-card">
    <div>
      <span class="eyebrow">F02.01 / F02.05 · AGG-02-GOVERNANCE-MEETING</span>
      <h1>Board & committee meetings</h1>
      <p>Schedule from effective Governance Body membership, pin exact issued meeting packs, establish quorum, record resolutions and coordinate accountable follow-up.</p>
    </div>
    <div class="principle">
      <strong>Body ≠ Meeting ≠ Decision ≠ Action</strong>
      <span>The body defines mandate and membership; each meeting is a governed occurrence.</span>
      <small>Resolutions are immutable Decisions and follow-up remains shared Work.</small>
    </div>
  </header>

  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <div class="body-switch section-card">
    <span class="eyebrow">Governance body</span>
    <nav>
      {#each data.bodies as body}
        <a class:active={data.body?.id === body.id} href={bodyHref(body.id)}>
          <strong>{body.bodyRef}</strong><span>{body.name}</span><small>{body.bodyType} · {body.status}</small>
        </a>
      {/each}
    </nav>
  </div>

  {#if data.body}
    <div class="workspace">
      <aside class="section-card register">
        <div><span class="eyebrow">{data.body.bodyType} schedule</span><h2>{data.meetings.length} meetings</h2></div>
        <nav class="meeting-list">
          {#each data.meetings as meeting}
            <a class:active={data.selected?.id === meeting.id} href={meetingHref(data.body.id, meeting.id)}>
              <div><strong>{meeting.meetingRef}</strong><span class={'status '+meeting.status.toLowerCase()}>{meeting.status}</span></div>
              <p>{new Date(meeting.scheduledAt).toLocaleString('en-GB')}</p>
              <small>Quorum {meeting.quorumRequired} · {meeting.meetingType}</small>
            </a>
          {:else}
            <p class="empty">No meetings scheduled for this body.</p>
          {/each}
        </nav>

        {#if data.capabilities.canManage && data.body.status === 'ACTIVE'}
          <details class="command"><summary>Schedule meeting</summary>
            <form method="POST" action="?/schedule">
              <input type="hidden" name="bodyId" value={data.body.id}/>
              <label>Meeting reference<input name="meetingRef" required/></label>
              <label>Scheduled at<input name="scheduledAt" type="datetime-local" required/></label>
              <label>Location / channel<input name="locationChannel"/></label>
              <label>Agenda<textarea name="agenda" rows="7" required></textarea>
                <small>Subject | REVIEW/DECISION | Purpose | Subject type | Subject ID | Subject version</small>
              </label>
              <button>Schedule from effective membership</button>
            </form>
          </details>
        {/if}
      </aside>

      <main class="main">
        {#if data.selected}
          <section class="section-card detail">
            <div class="head">
              <div><span class="eyebrow">{data.body.name}</span><h2>{data.selected.meetingRef}</h2></div>
              <span class={'status large '+data.selected.status.toLowerCase()}>{data.selected.status}</span>
            </div>

            <div class="facts">
              <span><small>Aggregate</small><strong>v{data.selected.aggregateVersion}</strong></span>
              <span><small>Quorum</small><strong>{data.selected.quorumRequired}</strong></span>
              <span><small>Attendees</small><strong>{data.attendees.length}</strong></span>
              <span><small>Papers</small><strong>{data.information.length}</strong></span>
              <span><small>Resolutions</small><strong>{data.decisions.length}</strong></span>
              <span><small>Actions</small><strong>{data.actions.length}</strong></span>
            </div>

            <div class="two">
              <section>
                <span class="eyebrow">Attendance</span>
                <div class="rows">
                  {#each data.attendees as row}
                    <article>
                      <div><strong>{row.attendanceRole}</strong><span>{row.attendanceStatus}</span></div>
                      <small>{row.partyId}</small>
                      {#if data.capabilities.canConduct && data.selected.status === 'SCHEDULED'}
                        <form method="POST" action="?/attendance" class="inline">
                          <input type="hidden" name="bodyId" value={data.body.id}/>
                          <input type="hidden" name="meetingId" value={data.selected.id}/>
                          <input type="hidden" name="partyId" value={row.partyId}/>
                          <button name="status" value="PRESENT">Present</button>
                          <button class="quiet" name="status" value="ABSENT">Absent</button>
                        </form>
                      {/if}
                    </article>
                  {/each}
                </div>
              </section>

              <section>
                <span class="eyebrow">Agenda</span>
                <div class="rows">
                  {#each data.agendaRows as row}
                    <article>
                      <div><strong>{row.itemNo}. {row.subject}</strong><span>{row.requiredOutcome}</span></div>
                      <p>{row.purpose}</p>
                      <small>{row.subjectType ?? 'General'} · {row.subjectId ?? '—'} · {row.status}</small>
                    </article>
                  {/each}
                </div>
              </section>
            </div>

            {#if data.capabilities.canConduct && data.selected.status === 'SCHEDULED'}
              <form method="POST" action="?/convene" class="actions">
                <input type="hidden" name="bodyId" value={data.body.id}/>
                <input type="hidden" name="meetingId" value={data.selected.id}/>
                <input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/>
                <button>Convene when quorum is met</button>
              </form>
            {/if}
          </section>

          <section class="section-card panel">
            <div class="section-head"><div><span class="eyebrow">Controlled meeting information</span><h2>Exact issued revisions</h2></div></div>
            <div class="rows">
              {#each data.information as item}
                <article>
                  <div><strong>{item.linkRole}</strong><span>{item.containerRef}</span></div>
                  <p>{item.title}</p>
                  <small>Revision {item.revisionCode} · #{item.revisionNo} · {item.revisionId}</small>
                </article>
              {:else}<p class="empty">No issued Information Revisions linked to this meeting.</p>{/each}
            </div>

            {#if data.capabilities.canManage && data.capabilities.canReadInformation && data.selected.status !== 'COMPLETED'}
              <details class="command"><summary>Link issued paper / minutes</summary>
                <form method="POST" action="?/information">
                  <input type="hidden" name="bodyId" value={data.body.id}/>
                  <input type="hidden" name="meetingId" value={data.selected.id}/>
                  <label>Information Revision ID<input name="revisionId" required/></label>
                  <label>Role<select name="linkRole">
                    <option>AGENDA</option>
                    <option selected={data.body.bodyType === 'BOARD'}>BOARD_PACK</option>
                    <option selected={data.body.bodyType === 'COMMITTEE'}>COMMITTEE_PACK</option>
                    <option>SUPPORTING_PAPER</option>
                    <option>MINUTES</option>
                  </select></label>
                  <button>Pin exact issued revision</button>
                </form>
              </details>
            {/if}
          </section>

          {#if data.capabilities.canConduct && data.selected.status === 'CONVENED'}
            <div class="two">
              <section class="section-card panel">
                <span class="eyebrow">Resolution</span><h2>Immutable decision evidence</h2>
                <form method="POST" action="?/resolution">
                  <input type="hidden" name="bodyId" value={data.body.id}/>
                  <input type="hidden" name="meetingId" value={data.selected.id}/>
                  <div class="grid">
                    <label>Subject type<input name="subjectType" required/></label>
                    <label>Subject ID<input name="subjectId" required/></label>
                    <label>Subject version<input name="subjectVersion"/></label>
                    <label>Outcome<input name="outcome" required/></label>
                  </div>
                  <label>Reason<textarea name="reason" rows="4" required></textarea></label>
                  <button>Record resolution as Decision</button>
                </form>
              </section>

              <section class="section-card panel">
                <span class="eyebrow">Follow-up</span><h2>Shared accountable work</h2>
                <form method="POST" action="?/action">
                  <input type="hidden" name="bodyId" value={data.body.id}/>
                  <input type="hidden" name="meetingId" value={data.selected.id}/>
                  <label>Title<input name="title" required/></label>
                  <label>Instructions<textarea name="instructions" rows="3" required></textarea></label>
                  <div class="grid">
                    <label>Subject type<input name="subjectType"/></label>
                    <label>Subject ID<input name="subjectId"/></label>
                    <label>Subject version<input name="subjectVersion"/></label>
                    <label>Priority<select name="priority"><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select></label>
                    <label>Due date<input name="dueAt" type="date"/></label>
                  </div>
                  <button>Create shared action</button>
                </form>
              </section>
            </div>

            <section class="section-card panel">
              <span class="eyebrow">Minutes & closure</span>
              <form method="POST" action="?/complete">
                <input type="hidden" name="bodyId" value={data.body.id}/>
                <input type="hidden" name="meetingId" value={data.selected.id}/>
                <input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/>
                <label>Minutes summary<textarea name="minutesSummary" rows="5" required></textarea></label>
                <button>Complete governed meeting</button>
              </form>
            </section>
          {/if}

          {#if data.selected.status === 'COMPLETED'}
            <section class="section-card panel">
              <span class="eyebrow">Recorded minutes</span>
              <p>{data.selected.minutesSummary}</p>
            </section>
          {/if}
        {:else}
          <section class="section-card empty-state">
            <h2>Schedule the first meeting</h2>
            <p>Meeting attendance will be snapshotted from the body’s effective membership at the scheduled time.</p>
          </section>
        {/if}
      </main>
    </div>
  {:else}
    <section class="section-card empty-state">
      <h2>No Governance Body configured</h2>
      <p>Create and activate a Board or Committee before scheduling governed meetings.</p>
    </section>
  {/if}
</div>

<style>
.page{display:grid;gap:12px}.breadcrumb{display:flex;gap:7px;align-items:center;font-size:9px;color:#728694}.breadcrumb a{color:#315f7d;text-decoration:none}.hero{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(290px,.65fr);gap:24px;padding:18px;border-color:#8fc9ee;background:linear-gradient(120deg,#fbfdff,#eaf6fd)}.eyebrow{color:var(--blue-700);font-size:10px;font-weight:850;letter-spacing:.07em;text-transform:uppercase}h1{margin:3px 0 6px;font-size:25px}h2{margin:2px 0 0;font-size:16px}p{color:#5f7484;font-size:10px;line-height:1.45}.hero p{margin:0;max-width:760px;font-size:11.5px}.principle{display:grid;gap:5px;padding:12px;border:1px solid #bddded;border-radius:9px;background:white}.principle strong{color:#315d76;font-size:11px}.principle span{color:#526d7d;font-size:9.5px}.principle small{color:#7b8e9a;font-size:8.5px}.message{padding:9px 12px;border:1px solid #dd8a8a;border-radius:8px;background:#fff3f3;color:#792f2f;font-size:11px}.body-switch{padding:10px}.body-switch nav{display:flex;gap:6px;overflow:auto;margin-top:7px}.body-switch a{display:grid;min-width:180px;gap:2px;padding:7px 9px;border:1px solid #dce5ea;border-radius:7px;color:inherit;text-decoration:none;background:#fafcfd}.body-switch a.active{border-color:#79bde2;background:#edf8fe}.body-switch strong{font-size:9px}.body-switch span,.body-switch small{font-size:8px;color:#6f8290}.workspace{display:grid;grid-template-columns:330px minmax(0,1fr);gap:12px;align-items:start}.register{position:sticky;top:78px;padding:12px}.meeting-list,.rows{display:grid;gap:6px;margin-top:10px}.meeting-list a,.rows article{display:grid;gap:5px;padding:9px;border:1px solid #e0e7ec;border-radius:8px;background:#fafcfd;color:inherit;text-decoration:none}.meeting-list a.active{border-color:#79bde2;background:#edf8fe;box-shadow:inset 3px 0 var(--blue-700)}.meeting-list a>div,.head,.rows article>div,.section-head{display:flex;justify-content:space-between;gap:8px}.meeting-list strong{font-size:9.5px;color:#315b75}.meeting-list p,.rows p{margin:0}.meeting-list small,.rows small{color:#788a97;font-size:8px}.status{width:max-content;padding:2px 5px;border-radius:999px;background:#eef2f5;color:#607483;font-size:7.5px;font-weight:850}.status.convened{background:#fff3d9;color:#805d19}.status.completed{background:#e6f5e9;color:#2b6c39}.status.large{padding:4px 7px;font-size:8.5px}.command{margin-top:10px;padding-top:9px;border-top:1px solid #e5ebef}.command summary{width:max-content;padding:6px 8px;border-radius:6px;background:#edf5fa;color:#35617d;font-size:9px;font-weight:800;cursor:pointer}form{display:grid;gap:7px;margin-top:8px}form.inline{display:flex;gap:5px}label{display:grid;gap:4px;color:#52697a;font-size:9px;font-weight:750}label small{font-weight:400;color:#81909a}input,select,textarea{width:100%;border:1px solid #ccd8e0;border-radius:6px;padding:7px 8px;background:white;color:var(--ink);font-size:9.5px}textarea{resize:vertical;font-family:inherit}.grid,.two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}button{border:0;border-radius:6px;padding:7px 9px;background:var(--blue-700);color:white;font-size:9px;font-weight:800;cursor:pointer}button.quiet{background:white;color:#4e697b;border:1px solid #d5e0e6}.main{display:grid;gap:12px;min-width:0}.detail,.panel{padding:14px}.facts{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}.facts span{display:grid;gap:2px;min-width:100px;padding:6px 8px;border-radius:6px;background:#f4f7f9}.facts small{color:#86959f;font-size:7.5px;text-transform:uppercase}.facts strong{color:#405d70;font-size:9px}.actions{display:flex;gap:6px;margin-top:10px}.actions input{display:none}.empty,.empty-state{color:#81909a}.empty-state{min-height:180px;display:grid;place-content:center;padding:24px;text-align:center}@media(max-width:850px){.hero,.workspace,.grid,.two{grid-template-columns:1fr}.register{position:static}}
</style>
