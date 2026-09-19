<script lang="ts">
  let { data, form } = $props();

  const campaignHref = (id: string, itemId?: string) => {
    const q = new URLSearchParams({ mode: data.mode, campaign: id });
    if (itemId) q.set('item', itemId);
    return `/${data.tenantSlug}/app/functions/f06/campaigns?${q.toString()}`;
  };

  const modeTitle = $derived(
    data.mode === 'digital'
      ? 'Digital marketing'
      : data.mode === 'content'
        ? 'Content marketing'
        : data.mode === 'communications'
          ? 'Market communications'
          : 'Campaign management'
  );
</script>

<svelte:head><title>{modeTitle} · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f06`}>F06 Marketing & Brand</a><span>›</span><strong>{modeTitle}</strong>
  </nav>
  <header class="hero section-card">
    <div><span class="eyebrow">F06.05 / .06 / .07 / .11 · AGG-25-COMMS-CAMPAIGN</span><h1>{modeTitle}</h1><p>Plan and execute multi-channel campaigns against exact audience and controlled-content versions. Delivery is evaluated against current privacy evidence before it can leave NuBlox.</p></div>
    <div class="principle"><strong>Campaign ≠ content ≠ recipient identity</strong><span>Campaign orchestrates; Information owns approved content; Party/Lead owns recipient context.</span><small>Every delivery request retains the exact Information revision and privacy basis used at execution time.</small></div>
  </header>

  <div class="mode-tabs">
    <a class:active={data.mode==='campaign'} href={`/${data.tenantSlug}/app/functions/f06/campaigns?mode=campaign`}>Campaign</a>
    <a class:active={data.mode==='digital'} href={`/${data.tenantSlug}/app/functions/f06/campaigns?mode=digital`}>Digital</a>
    <a class:active={data.mode==='content'} href={`/${data.tenantSlug}/app/functions/f06/campaigns?mode=content`}>Content</a>
    <a class:active={data.mode==='communications'} href={`/${data.tenantSlug}/app/functions/f06/campaigns?mode=communications`}>Communications</a>
  </div>

  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <div class="workspace">
    <aside class="section-card register">
      <span class="eyebrow">Campaign register</span><h2>{data.campaigns.length} campaigns</h2>
      <nav class="rows">
        {#each data.campaigns as campaign}
          <a class:active={data.selected?.id===campaign.id} href={campaignHref(campaign.id)}>
            <div><strong>{campaign.campaignRef}</strong><span>{campaign.status}</span></div>
            <p>{campaign.title}</p><small>{campaign.campaignType} · v{campaign.currentVersionNo}</small>
          </a>
        {:else}<p class="empty">No campaigns created.</p>{/each}
      </nav>
      {#if data.capabilities.canManage}
        <details class="command">
          <summary>Create campaign</summary>
          <form method="POST" action="?/create">
            <input type="hidden" name="mode" value={data.mode}/>
            <div class="grid"><label>Reference<input name="campaignRef" required/></label><label>Type<select name="campaignType"><option>MARKETING</option><option>DIGITAL</option><option>CONTENT</option><option>COMMUNICATIONS</option><option>EVENT</option></select></label></div>
            <label>Title<input name="title" required/></label>
            <label>Active / approved plan<select name="communicationsPlanId"><option value="">No linked plan</option>{#each data.plans.filter((p)=>['APPROVED','ACTIVE'].includes(p.status)) as plan}<option value={plan.id}>{plan.planRef} · {plan.title}</option>{/each}</select></label>
            <div class="json-grid"><label>Objectives JSON<textarea name="objectives" rows="3" value={'{}'}></textarea></label><label>Audience strategy JSON<textarea name="audienceStrategy" rows="3" value={'{}'}></textarea></label><label>Key messages JSON<textarea name="keyMessages" rows="3" value={'{}'}></textarea></label><label>Channels JSON<textarea name="channels" rows="3" value={'[]'}></textarea></label><label>Schedule JSON<textarea name="schedule" rows="3" value={'{}'}></textarea></label><label>Budget context JSON<textarea name="budgetContext" rows="3" value={'{}'}></textarea></label><label>Measurement plan JSON<textarea name="measurementPlan" rows="3" value={'{}'}></textarea></label><label>Automation JSON<textarea name="automation" rows="3" value={'{}'}></textarea></label></div>
            <button>Create governed campaign</button>
          </form>
        </details>
      {/if}
    </aside>

    <main>
      {#if data.selected && data.current}
        <section class="section-card detail">
          <div class="head">
            <div><span class="eyebrow">{data.selected.campaignType}</span><h2>{data.selected.campaignRef} · {data.selected.title}</h2></div>
            <div class="state-group"><span>{data.selected.status}</span><span>v{data.selected.currentVersionNo}</span></div>
          </div>

          <div class="facts">
            <span><small>Audience definitions</small><strong>{data.campaignSegments.length}</strong></span>
            <span><small>Controlled content</small><strong>{data.campaignInformation.length}</strong></span>
            <span><small>Communication items</small><strong>{data.items.length}</strong></span>
            <span><small>Decision</small><strong>{data.selected.approvalDecisionId ? 'Bound' : 'Pending'}</strong></span>
            <span><small>Aggregate</small><strong>v{data.selected.aggregateVersion}</strong></span>
          </div>

          <div class="evidence-grid">
            <article><span>Objectives</span><pre>{JSON.stringify(data.current.objectives,null,2)}</pre></article>
            <article><span>Audience strategy</span><pre>{JSON.stringify(data.current.audienceStrategy,null,2)}</pre></article>
            <article><span>Channels</span><pre>{JSON.stringify(data.current.channels,null,2)}</pre></article>
            <article><span>Automation</span><pre>{JSON.stringify(data.current.automation,null,2)}</pre></article>
          </div>

          <div class="split">
            <section class="panel">
              <div class="section-head"><span class="eyebrow">Pinned audience</span><strong>{data.campaignSegments.length}</strong></div>
              {#each data.campaignSegments as segment}
                <article><div><strong>{segment.segmentRef} · v{segment.segmentVersionNo}</strong><span>{segment.inclusionType}</span></div><small>{segment.name}</small></article>
              {:else}<p>No exact segment versions pinned.</p>{/each}
            </section>
            <section class="panel">
              <div class="section-head"><span class="eyebrow">Controlled content</span><strong>{data.campaignInformation.length}</strong></div>
              {#each data.campaignInformation as info}
                <article><div><strong>{info.containerRef}/{info.revisionCode}</strong><span>{info.channel ?? info.linkRole}</span></div><small>{info.title}</small></article>
              {:else}<p>No issued campaign content linked.</p>{/each}
            </section>
          </div>

          {#if data.capabilities.canManage && data.selected.status === 'PLANNED'}
            <div class="command-grid">
              <details class="command"><summary>Pin audience segment</summary><form method="POST" action="?/linkSegment">
                <input type="hidden" name="campaignId" value={data.selected.id}/><input type="hidden" name="mode" value={data.mode}/>
                <label>Active segment<select name="segmentId" required><option value="">Select segment</option>{#each data.segments.filter((s)=>s.status==='ACTIVE') as segment}<option value={segment.id}>{segment.segmentRef} · {segment.name}</option>{/each}</select></label>
                <label>Exact version<select name="segmentVersionNo" required><option value="">Select version number</option>{#each data.segments.filter((s)=>s.status==='ACTIVE') as segment}{#each (data.segmentVersions[segment.id] ?? []).filter((v)=>v.lifecycleStatus==='ACTIVE') as version}<option value={version.versionNo}>{segment.segmentRef} · v{version.versionNo}</option>{/each}{/each}</select></label>
                <label>Inclusion<select name="inclusionType"><option>INCLUDE</option><option>EXCLUDE</option></select></label><button>Pin segment version</button>
              </form></details>

              <details class="command" open={data.mode==='content'}><summary>Link issued campaign content</summary><form method="POST" action="?/linkInformation">
                <input type="hidden" name="campaignId" value={data.selected.id}/><input type="hidden" name="mode" value={data.mode}/>
                <label>Issued Information<select name="informationRevisionId" required><option value="">Select revision</option>{#each data.issuedInformation as info}<option value={info.id}>{info.containerRef}/{info.revisionCode} · {info.title}</option>{/each}</select></label>
                <div class="grid"><label>Role<select name="linkRole"><option>PRIMARY_CONTENT</option><option>CREATIVE_ASSET</option><option>LANDING_PAGE</option><option>ADVERTISING_COLLATERAL</option></select></label><label>Channel<input name="channel" placeholder="EMAIL / WEB / SOCIAL"/></label></div>
                <button>Link exact issued revision</button>
              </form></details>

              <details class="command"><summary>Create communication item</summary><form method="POST" action="?/createItem">
                <input type="hidden" name="campaignId" value={data.selected.id}/><input type="hidden" name="mode" value={data.mode}/>
                <div class="grid"><label>Item reference<input name="itemRef" required/></label><label>Type<select name="itemType"><option>EMAIL</option><option>SOCIAL_POST</option><option>PAID_AD</option><option>WEB_CONTENT</option><option>MARKETING_MESSAGE</option></select></label></div>
                <label>Channel<input name="channel" required/></label>
                <label>Issued content<select name="informationRevisionId" required><option value="">Select revision</option>{#each data.issuedInformation as info}<option value={info.id}>{info.containerRef}/{info.revisionCode} · {info.title}</option>{/each}</select></label>
                <label>Audience scope JSON<textarea name="audienceScope" rows="3" value={'{}'}></textarea></label><button>Create communication item</button>
              </form></details>

              <details class="command"><summary>Create successor campaign version</summary><form method="POST" action="?/revise">
                <input type="hidden" name="campaignId" value={data.selected.id}/><input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/><input type="hidden" name="mode" value={data.mode}/>
                <label>Title<input name="title" value={data.selected.title}/></label>
                <div class="json-grid"><label>Objectives<textarea name="objectives" rows="3">{JSON.stringify(data.current.objectives)}</textarea></label><label>Audience<textarea name="audienceStrategy" rows="3">{JSON.stringify(data.current.audienceStrategy)}</textarea></label><label>Messages<textarea name="keyMessages" rows="3">{JSON.stringify(data.current.keyMessages)}</textarea></label><label>Channels<textarea name="channels" rows="3">{JSON.stringify(data.current.channels)}</textarea></label><label>Schedule<textarea name="schedule" rows="3">{JSON.stringify(data.current.schedule)}</textarea></label><label>Budget<textarea name="budgetContext" rows="3">{JSON.stringify(data.current.budgetContext)}</textarea></label><label>Measurement<textarea name="measurementPlan" rows="3">{JSON.stringify(data.current.measurementPlan)}</textarea></label><label>Automation<textarea name="automation" rows="3">{JSON.stringify(data.current.automation)}</textarea></label></div>
                <button>Create successor campaign version</button>
              </form></details>
            </div>
            <form method="POST" action="?/submit" class="inline-action"><input type="hidden" name="campaignId" value={data.selected.id}/><input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/><input type="hidden" name="mode" value={data.mode}/><button>Submit exact campaign version for Decision</button></form>
          {/if}

          {#if data.capabilities.canApprove && data.selected.status === 'REVIEW'}
            <form method="POST" action="?/decide" class="decision-form">
              <input type="hidden" name="campaignId" value={data.selected.id}/><input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/><input type="hidden" name="currentVersionNo" value={data.selected.currentVersionNo}/><input type="hidden" name="mode" value={data.mode}/>
              <label>Outcome<select name="outcome"><option>APPROVED</option><option>REWORK</option><option>REJECTED</option></select></label><label>Decision reason<input name="reason" required/></label><button>Record & apply Decision</button>
            </form>
          {/if}
          {#if data.capabilities.canExecute && data.selected.status === 'APPROVED'}
            <form method="POST" action="?/activate" class="inline-action"><input type="hidden" name="campaignId" value={data.selected.id}/><input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/><input type="hidden" name="mode" value={data.mode}/><button>Activate approved campaign</button></form>
          {/if}

          <section class="panel items">
            <div class="section-head"><span class="eyebrow">Communication items</span><strong>{data.items.length}</strong></div>
            <div class="item-list">
              {#each data.items as item}
                <a class:active={data.selectedItem?.id===item.id} href={campaignHref(data.selected.id,item.id)}>
                  <div><strong>{item.itemRef}</strong><span>{item.status}</span></div><small>{item.channel} · {item.itemType}</small>
                </a>
              {:else}<p>No communication items.</p>{/each}
            </div>
          </section>

          {#if data.selectedItem}
            <section class="section-card item-detail">
              <div class="head"><div><span class="eyebrow">Communication Item</span><h3>{data.selectedItem.itemRef} · {data.selectedItem.channel}</h3></div><span class="status">{data.selectedItem.status}</span></div>
              <div class="facts compact"><span><small>Content revision</small><strong>{data.selectedItem.informationRevisionId.slice(0,8)}…</strong></span><span><small>Scheduled</small><strong>{data.selectedItem.scheduledAt ? new Date(data.selectedItem.scheduledAt).toLocaleString('en-GB') : 'Not scheduled'}</strong></span><span><small>Delivery events</small><strong>{data.deliveryEvents.length}</strong></span></div>

              {#if data.capabilities.canExecute && data.selectedItem.status === 'PLANNED'}
                <form method="POST" action="?/scheduleItem" class="inline-form"><input type="hidden" name="campaignId" value={data.selected.id}/><input type="hidden" name="itemId" value={data.selectedItem.id}/><input type="hidden" name="aggregateVersion" value={data.selectedItem.aggregateVersion}/><input type="hidden" name="mode" value={data.mode}/><label>Schedule<input type="datetime-local" name="scheduledAt" required/></label><button>Schedule item</button></form>
              {/if}

              {#if data.capabilities.canExecute && data.selected.status === 'ACTIVE' && ['SCHEDULED','IN_DELIVERY'].includes(data.selectedItem.status)}
                <div class="command-grid">
                  <details class="command" open><summary>Request privacy-checked delivery</summary><form method="POST" action="?/requestDelivery">
                    <input type="hidden" name="campaignId" value={data.selected.id}/><input type="hidden" name="itemId" value={data.selectedItem.id}/><input type="hidden" name="mode" value={data.mode}/><input type="hidden" name="recipientType" value="LEAD"/>
                    <label>Lead recipient<select name="recipientId" required><option value="">Select Lead</option>{#each data.leads as lead}<option value={lead.id}>{lead.leadRef} · {lead.prospectName}</option>{/each}</select></label>
                    <label>Marketing purpose<input name="purposeKey" value="MARKETING.GENERAL" required/></label>
                    <label>Lawful basis<select name="lawfulBasis"><option>CONSENT</option><option>LEGITIMATE_INTEREST</option></select></label><label>Provider request reference<input name="externalReference"/></label><button>Evaluate privacy & request delivery</button>
                  </form></details>
                  <details class="command"><summary>Record provider / engagement event</summary><form method="POST" action="?/recordDelivery">
                    <input type="hidden" name="campaignId" value={data.selected.id}/><input type="hidden" name="itemId" value={data.selectedItem.id}/><input type="hidden" name="mode" value={data.mode}/><input type="hidden" name="recipientType" value="LEAD"/>
                    <label>Lead recipient<select name="recipientId" required><option value="">Select Lead</option>{#each data.leads as lead}<option value={lead.id}>{lead.leadRef} · {lead.prospectName}</option>{/each}</select></label>
                    <div class="grid"><label>Event<select name="deliveryAction"><option>SENT</option><option>DELIVERED</option><option>BOUNCE</option><option>OPEN</option><option>CLICK</option><option>CONVERSION</option><option>UNSUBSCRIBE</option></select></label><label>External reference<input name="externalReference"/></label></div>
                    <label>Metadata JSON<textarea name="metadata" rows="3" value={'{}'}></textarea></label><button>Record engagement evidence</button>
                  </form></details>
                </div>
              {/if}

              <section class="event-stream">
                {#each data.deliveryEvents as event}<article><strong>{event.deliveryAction}</strong><span>{event.recipientType} · {event.recipientLeadId ?? event.recipientPartyId}</span><small>{new Date(event.occurredAt).toLocaleString('en-GB')}</small></article>{:else}<p>No delivery evidence.</p>{/each}
              </section>
              {#if data.capabilities.canExecute && ['SCHEDULED','IN_DELIVERY'].includes(data.selectedItem.status)}
                <form method="POST" action="?/completeItem" class="inline-action"><input type="hidden" name="campaignId" value={data.selected.id}/><input type="hidden" name="itemId" value={data.selectedItem.id}/><input type="hidden" name="aggregateVersion" value={data.selectedItem.aggregateVersion}/><input type="hidden" name="mode" value={data.mode}/><button>Complete communication item</button></form>
              {/if}
            </section>
          {/if}

          {#if data.capabilities.canExecute && ['ACTIVE','PAUSED','COMPLETED'].includes(data.selected.status)}
            <form method="POST" action="?/transition" class="transition-form"><input type="hidden" name="campaignId" value={data.selected.id}/><input type="hidden" name="aggregateVersion" value={data.selected.aggregateVersion}/><input type="hidden" name="mode" value={data.mode}/><label>Campaign lifecycle<select name="targetStatus">{#if data.selected.status==='ACTIVE'}<option>PAUSED</option><option>COMPLETED</option><option>CANCELLED</option>{:else if data.selected.status==='PAUSED'}<option>ACTIVE</option><option>COMPLETED</option><option>CANCELLED</option>{:else}<option>CLOSED</option>{/if}</select></label><button>Apply transition</button></form>
          {/if}
        </section>
      {:else}<section class="section-card empty-state"><h2>Create a campaign against an approved marketing plan</h2><p>Audience, content and approval evidence are all pinned before activation.</p></section>{/if}
    </main>
  </div>
</div>

<style>
.page{display:grid;gap:12px}.breadcrumb,.mode-tabs,.head,.rows div,.section-head,.panel article div,.item-list a div{display:flex;gap:8px;align-items:center}.breadcrumb{font-size:9px;color:#728694}.breadcrumb a{color:#315f7d;text-decoration:none}.hero{display:grid;grid-template-columns:1.5fr .7fr;gap:20px;padding:18px;background:linear-gradient(120deg,#fbfdff,#eaf6fd)}.eyebrow{font-size:9px;font-weight:850;color:var(--blue-700);text-transform:uppercase;letter-spacing:.07em}h1{margin:4px 0 6px;font-size:25px}h2{margin:3px 0 8px;font-size:16px}h3{margin:3px 0;font-size:14px}p{font-size:10px;color:#5f7484;line-height:1.5}.principle{display:grid;gap:5px;padding:12px;border:1px solid #bddded;border-radius:9px;background:#fff}.principle strong{font-size:11px;color:#315d76}.principle span,.principle small{font-size:9px;color:#667c8b}.mode-tabs{width:max-content;padding:4px;border:1px solid #dbe6ec;border-radius:8px;background:#fff}.mode-tabs a{padding:6px 9px;border-radius:5px;color:#637987;font-size:9px;font-weight:800;text-decoration:none}.mode-tabs a.active{background:#eaf6fd;color:#2f6584}.workspace{display:grid;grid-template-columns:330px 1fr;gap:12px;align-items:start}.register,.detail,.item-detail{padding:13px}.register{position:sticky;top:78px}.rows{display:grid;gap:6px;margin-top:8px}.rows a{display:grid;gap:4px;padding:8px;border:1px solid #dfe7ec;border-radius:7px;background:#fafcfd;color:inherit;text-decoration:none}.rows a.active{border-color:#79bde2;background:#edf8fe}.rows div,.head,.section-head,.item-list a div{justify-content:space-between}.rows p{margin:0}.rows strong,.item-list strong{font-size:9.5px}.rows span,.rows small,.item-list span,.item-list small{font-size:8px;color:#718693}.state-group{display:flex;gap:5px}.state-group span,.status{font-size:8px;font-weight:850;padding:4px 6px;border-radius:999px;background:#eaf4f9;color:#35617d}.facts{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:10px 0}.facts.compact{grid-template-columns:repeat(3,1fr)}.facts span{display:grid;gap:2px;padding:7px;background:#f4f7f9;border-radius:6px}.facts small{font-size:7px;color:#85949e}.facts strong{font-size:9px}.evidence-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:8px}.evidence-grid article{min-width:0;padding:8px;border:1px solid #e1e8ec;border-radius:7px;background:#fafcfd}.evidence-grid span{font-size:8px;font-weight:850;color:#35617d}.evidence-grid pre{overflow:auto;font-size:7.5px;color:#657986}.split,.command-grid,.grid,.json-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.panel{padding:10px;border:1px solid #dfe7ec;border-radius:8px;margin-top:8px}.panel article{padding:7px 0;border-bottom:1px solid #edf1f3}.panel article:last-child{border:0}.panel article strong{font-size:8.5px}.panel article span,.panel article small{font-size:8px;color:#748894}.items{margin-top:12px}.item-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:6px;margin-top:7px}.item-list a{display:grid;gap:3px;padding:8px;border:1px solid #dfe7ec;border-radius:6px;color:inherit;text-decoration:none}.item-list a.active{border-color:#70b6dc;background:#f0f9fe}.item-detail{margin-top:10px;border:1px solid #cddde6}.command{margin-top:10px;border-top:1px solid #e4eaee;padding-top:8px}.command summary{cursor:pointer;font-size:9px;font-weight:800;color:#35617d}form{display:grid;gap:7px;margin-top:8px}label{display:grid;gap:4px;font-size:8.5px;color:#52697a;font-weight:750}input,select,textarea{width:100%;padding:7px;border:1px solid #ccd8e0;border-radius:6px;font:inherit}button{border:0;border-radius:6px;padding:8px 10px;background:var(--blue-700);color:#fff;font-size:9px;font-weight:800;cursor:pointer}.inline-action{display:flex;justify-content:flex-end;margin-top:10px}.inline-form,.transition-form{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;padding:8px;border:1px solid #e2e8ec;border-radius:7px;margin-top:9px}.decision-form{display:grid;grid-template-columns:180px 1fr auto;gap:8px;align-items:end;padding:9px;margin-top:10px;border:1px solid #d8e6ee;border-radius:8px;background:#f7fbfd}.event-stream{display:grid;gap:5px;margin-top:8px}.event-stream article{display:grid;grid-template-columns:90px 1fr auto;gap:8px;padding:7px;border-bottom:1px solid #edf1f3;font-size:8px}.event-stream span,.event-stream small{color:#728694}.message{padding:9px;border:1px solid #dd8a8a;background:#fff3f3;color:#792f2f;font-size:9px}.empty,.empty-state{color:#758896}.empty-state{padding:24px;text-align:center}@media(max-width:1050px){.hero,.workspace,.facts,.evidence-grid,.split,.command-grid,.grid,.json-grid,.decision-form,.inline-form,.transition-form{grid-template-columns:1fr}.register{position:static}}
</style>