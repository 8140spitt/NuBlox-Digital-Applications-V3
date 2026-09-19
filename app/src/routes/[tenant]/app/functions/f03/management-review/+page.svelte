<script lang="ts">
  let { data, form } = $props();
  function href(id: string) {
    return `/${data.tenantSlug}/app/functions/f03/management-review?review=${encodeURIComponent(id)}`;
  }
</script>

<svelte:head><title>Management Review · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb"><a href={`/${data.tenantSlug}/app/functions/f03`}>F03 Enterprise Performance Management</a><span>›</span><strong>F03.04 Management Review</strong></nav>
  <header class="hero section-card"><div><span class="eyebrow">F03.04 · AGG-02-GOVERNANCE-MEETING</span><h1>Management review</h1><p>Challenge enterprise performance through governed review occurrences that pin published snapshots, establish quorum and separate Decisions from follow-up Work.</p></div><div class="principle"><strong>Snapshot ≠ meeting ≠ Decision ≠ action</strong><span>Each layer retains its own identity and audit trail.</span><small>Management Review consumes published performance evidence; it never rewrites it.</small></div></header>
  {#if form?.message}<div class="message">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <span class="eyebrow">Review register</span><h2>{data.reviews.length} reviews</h2>
      <nav class="rows">{#each data.reviews as item}<a class:active={data.selected?.id === item.id} href={href(item.id)}><div><strong>{item.meetingRef}</strong><span>{item.status}</span></div><p>{new Date(item.scheduledAt).toLocaleString('en-GB')}</p><small>Quorum {item.quorumRequired}</small></a>{/each}</nav>
      {#if data.canManage}
        <details class="command"><summary>Schedule review</summary><form method="POST" action="?/schedule"><label>Governance body<select name="governanceBodyId" required><option value="">Select active body</option>{#each data.bodies as body}<option value={body.id}>{body.bodyRef} · {body.name}</option>{/each}</select></label><label>Review reference<input name="meetingRef" required/></label><label>Scheduled at<input name="scheduledAt" type="datetime-local" required/></label><label>Location / channel<input name="locationChannel"/></label><label>Agenda<textarea name="agenda" rows="6" required></textarea><small>Subject | DECISION/REVIEW | Purpose | Subject type | Subject ID | Subject version</small></label><button>Schedule governed review</button></form></details>
      {/if}
    </aside>

    <main class="main">
      {#if data.selected}
        <section class="section-card detail">
          <div class="head"><div><span class="eyebrow">Management Review</span><h2>{data.selected.meetingRef}</h2></div><span class="status">{data.selected.status}</span></div>
          <div class="facts"><span><small>Aggregate</small><strong>v{data.selected.aggregateVersion}</strong></span><span><small>Quorum</small><strong>{data.selected.quorumRequired}</strong></span><span><small>Snapshots</small><strong>{data.linkedSnapshots.length}</strong></span><span><small>Decisions</small><strong>{data.decisions.length}</strong></span><span><small>Actions</small><strong>{data.actions.length}</strong></span></div>

          <div class="two">
            <section><span class="eyebrow">Attendance</span><div class="rows">{#each data.attendees as row}<article><div><strong>{row.attendanceRole}</strong><span>{row.attendanceStatus}</span></div><small>{row.partyId}</small>{#if data.canManage && data.selected.status === 'SCHEDULED'}<form method="POST" action="?/attendance" class="inline"><input type="hidden" name="reviewId" value={data.selected.id}/><input type="hidden" name="partyId" value={row.partyId}/><button name="status" value="PRESENT">Present</button><button class="quiet" name="status" value="ABSENT">Absent</button></form>{/if}</article>{/each}</div></section>
            <section><span class="eyebrow">Agenda</span><div class="rows">{#each data.agendaRows as row}<article><div><strong>{row.itemNo}. {row.subject}</strong><span>{row.requiredOutcome}</span></div><p>{row.purpose}</p><small>{row.subjectType ?? 'General'} · {row.subjectId ?? '—'}</small></article>{/each}</div></section>
          </div>

          <section class="snapshot-block"><span class="eyebrow">Published performance evidence</span><div class="rows">{#each data.linkedSnapshots as row}<article><div><strong>{row.snapshotRef}</strong><span>{row.qualityStatus}</span></div><p>{row.scopeType} · {row.scopeId}</p><small>{Number(row.completenessPercent).toFixed(1)}% complete · published {new Date(row.publishedAt).toLocaleString('en-GB')}</small></article>{/each}</div>
            {#if data.canManage && data.selected.status !== 'COMPLETED'}<form method="POST" action="?/linkSnapshot"><input type="hidden" name="reviewId" value={data.selected.id}/><label>Published snapshot<select name="snapshotId" required><option value="">Select snapshot</option>{#each data.publishedSnapshots as snapshot}<option value={snapshot.id}>{snapshot.snapshotRef} · {snapshot.scopeType}</option>{/each}</select></label><button>Link exact published snapshot</button></form>{/if}
          </section>

          {#if data.canManage && data.selected.status === 'SCHEDULED'}<form method="POST" action="?/convene" class="actions"><input type="hidden" name="reviewId" value={data.selected.id}/><input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/><button>Convene when quorum and evidence are ready</button></form>{/if}

          {#if data.canManage && data.selected.status === 'CONVENED'}
            <div class="two">
              <details class="command" open><summary>Record Decision</summary><form method="POST" action="?/decision"><input type="hidden" name="reviewId" value={data.selected.id}/><label>Subject type<input name="subjectType" required value="PERFORMANCE_SNAPSHOT"/></label><label>Subject ID<input name="subjectId" required/></label><label>Subject version<input name="subjectVersion"/></label><label>Outcome<input name="outcome" required/></label><label>Reason<textarea name="reason" rows="4" required></textarea></label><button>Record immutable Decision</button></form></details>
              <details class="command" open><summary>Create follow-up Work</summary><form method="POST" action="?/action"><input type="hidden" name="reviewId" value={data.selected.id}/><label>Title<input name="title" required/></label><label>Instructions<textarea name="instructions" rows="4" required></textarea></label><div class="grid"><label>Priority<select name="priority"><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select></label><label>Due date<input name="dueAt" type="date"/></label></div><button>Create shared Work Item</button></form></details>
            </div>
            <details class="command" open><summary>Complete review</summary><form method="POST" action="?/complete"><input type="hidden" name="reviewId" value={data.selected.id}/><input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/><label>Minutes summary<textarea name="minutesSummary" rows="5" required></textarea></label><button>Complete Management Review</button></form></details>
          {/if}

          {#if data.selected.status === 'COMPLETED'}<section class="minutes"><span class="eyebrow">Minutes</span><p>{data.selected.minutesSummary}</p></section>{/if}
        </section>
      {:else}<section class="section-card empty-state"><h2>Schedule the first Management Review</h2><p>Use an active Governance Body and link at least one published Performance Snapshot before convening.</p></section>{/if}
    </main>
  </div>
</div>

<style>
.page{display:grid;gap:12px}.breadcrumb{display:flex;gap:7px;font-size:9px;color:#728694}.breadcrumb a{color:#315f7d;text-decoration:none}.hero{display:grid;grid-template-columns:1.5fr .7fr;gap:20px;padding:18px;background:linear-gradient(120deg,#fbfdff,#eaf6fd)}.eyebrow{font-size:10px;font-weight:850;color:var(--blue-700);text-transform:uppercase;letter-spacing:.07em}h1{margin:3px 0 6px;font-size:25px}h2{margin:3px 0 8px;font-size:16px}p{font-size:10px;color:#5f7484}.principle{display:grid;gap:5px;padding:12px;border:1px solid #bddded;border-radius:9px;background:#fff}.principle strong{font-size:11px;color:#315d76}.principle span,.principle small{font-size:9px;color:#667c8b}.workspace{display:grid;grid-template-columns:320px 1fr;gap:12px;align-items:start}.register,.detail{padding:13px}.register{position:sticky;top:78px}.rows{display:grid;gap:6px;margin-top:9px}.rows a,.rows article{display:grid;gap:4px;padding:8px;border:1px solid #dfe7ec;border-radius:7px;background:#fafcfd;color:inherit;text-decoration:none}.rows a.active{border-color:#79bde2;background:#edf8fe}.rows div,.head{display:flex;justify-content:space-between;gap:8px}.rows strong{font-size:9.5px}.rows span,.rows small{font-size:8px;color:#718693}.rows p{margin:0}.facts{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.facts span{display:grid;gap:2px;min-width:100px;padding:7px;background:#f4f7f9;border-radius:6px}.facts small{font-size:7.5px;color:#85949e}.facts strong{font-size:10px}.two,.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.snapshot-block,.minutes{margin-top:12px;padding:10px;border:1px solid #dfe7ec;border-radius:8px}.command{margin-top:12px;border-top:1px solid #e4eaee;padding-top:9px}.command summary{cursor:pointer;font-size:9px;font-weight:800;color:#35617d}form{display:grid;gap:7px;margin-top:8px}form.inline{display:flex;gap:5px}label{display:grid;gap:4px;font-size:9px;color:#52697a;font-weight:750}label small{font-weight:400}input,select,textarea{width:100%;padding:7px;border:1px solid #ccd8e0;border-radius:6px;font:inherit}button{border:0;border-radius:6px;padding:7px 9px;background:var(--blue-700);color:white;font-size:9px;font-weight:800}.quiet{background:white;color:#52697a;border:1px solid #ccd8e0}.status{font-size:8px;font-weight:800}.message{padding:9px;border:1px solid #dd8a8a;background:#fff3f3;color:#792f2f}.empty-state{padding:24px;text-align:center}@media(max-width:850px){.hero,.workspace,.two,.grid{grid-template-columns:1fr}.register{position:static}}
</style>