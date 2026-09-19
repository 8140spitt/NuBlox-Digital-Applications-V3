<script lang="ts">
  import CollectionView from '$lib/components/CollectionView.svelte';
  import { objectHref } from '$lib/data/runtime-object-registry';

  let { data, form } = $props();
  const href = (id: string) => objectHref(data.tenantSlug, 'lead', id, { from: 'F06.09' });

  const collectionColumns = [
    { key: 'reference', label: 'Lead', sortable: true },
    { key: 'prospect', label: 'Prospect', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'score', label: 'Score', sortable: true, align: 'end' as const }
  ];

  const collectionRows = $derived(
    data.leads.map((lead) => ({
      id: lead.id,
      href: href(lead.id),
      ariaLabel: 'Open ' + lead.leadRef + ' · ' + lead.prospectName,
      searchText: [
        lead.leadRef,
        lead.prospectName,
        lead.organisationName,
        lead.status,
        lead.sourceType,
        lead.sector,
        lead.geography
      ]
        .filter(Boolean)
        .join(' '),
      values: {
        reference: lead.leadRef,
        prospect: lead.prospectName,
        status: lead.status,
        score: lead.score
      }
    }))
  );
</script>

<svelte:head><title>Lead Generation · NuBlox</title></svelte:head>

<div class="page">
  <nav class="breadcrumb">
    <a href={`/${data.tenantSlug}/app/functions/f06`}>F06 Marketing & Brand</a><span>›</span><strong
      >F06.09 Lead Generation</strong
    >
  </nav>
  <header class="hero section-card">
    <div>
      <span class="eyebrow">F06.09 · AGG-03-LEAD</span>
      <h1>Lead generation</h1>
      <p>
        Capture early demand signals, enrich and score them, nurture them against privacy evidence,
        then transfer qualified exact Lead versions to Sales.
      </p>
    </div>
    <div class="principle">
      <strong>Lead ≠ Party ≠ Opportunity</strong><span
        >An unresolved Lead may hold prospect contact clues without polluting the Party master.</span
      ><small
        >Sales handoff pins the exact qualified Lead version; F07 later accepts it into Opportunity.</small
      >
    </div>
  </header>
  {#if form?.message}<div class="message" role="alert">{form.message}</div>{/if}

  <div class:collection-only={!data.selected} class="workspace">
    <aside class="section-card register">
      <CollectionView
        eyebrow="Lead register"
        title="Leads"
        rows={collectionRows}
        columns={collectionColumns}
        emptyText="No Leads captured."
        searchPlaceholder="Search Leads"
        savedViews={data.savedViews}
        saveViewAction="?/saveView"
        deleteViewAction="?/deleteView"
      />
      {#if data.capabilities.canManage}
        <details class="command">
          <summary>Capture Lead</summary>
          <form method="POST" action="?/create">
            <div class="grid">
              <label>Lead reference<input name="leadRef" required /></label><label
                >Source type<select name="sourceType"
                  ><option>CAMPAIGN</option><option>EVENT</option><option>WEB</option><option
                    >REFERRAL</option
                  ><option>INBOUND</option><option>OTHER</option></select
                ></label
              >
            </div>
            <label
              >Source campaign<select name="sourceCampaignId"
                ><option value="">None</option>{#each data.campaigns as campaign}<option
                    value={campaign.id}>{campaign.campaignRef} · {campaign.title}</option
                  >{/each}</select
              ></label
            >
            <label
              >Source communication item<select name="sourceCommunicationItemId"
                ><option value="">None</option>{#each data.items as item}<option value={item.id}
                    >{item.itemRef} · {item.channel}</option
                  >{/each}</select
              ></label
            >
            <label>Source reference<input name="sourceReference" /></label>
            <div class="grid">
              <label>Prospect name<input name="prospectName" required /></label><label
                >Organisation<input name="organisationName" /></label
              >
            </div>
            <div class="grid">
              <label>Email<input type="email" name="email" /></label><label
                >Phone<input name="phone" /></label
              >
            </div>
            <div class="grid">
              <label>Geography<input name="geography" /></label><label
                >Sector<input name="sector" /></label
              >
            </div>
            <label>Need summary<textarea name="needSummary" rows="3" required></textarea></label>
            <div class="grid">
              <label
                >Estimated value low<input
                  type="number"
                  min="0"
                  step="any"
                  name="estimatedValueLow"
                /></label
              ><label
                >Estimated value high<input
                  type="number"
                  min="0"
                  step="any"
                  name="estimatedValueHigh"
                /></label
              >
            </div>
            <label
              >Currency<select name="currencyId"
                ><option value="">None</option
                >{#each data.currencies.filter((c) => c.status === 'ACTIVE') as currency}<option
                    value={currency.id}>{currency.isoCode} · {currency.name}</option
                  >{/each}</select
              ></label
            >
            <button>Capture governed Lead</button>
          </form>
        </details>
      {/if}
    </aside>

    <main>
      {#if data.selected}
        <section class="section-card detail">
          <div class="head">
            <div>
              <span class="eyebrow">{data.selected.sourceType}</span>
              <h2>{data.selected.leadRef} · {data.selected.prospectName}</h2>
            </div>
            <div class="state-group">
              <span>{data.selected.status}</span><span>score {data.selected.score}</span>
            </div>
          </div>
          <p>{data.selected.needSummary}</p>
          <div class="facts">
            <span
              ><small>Organisation</small><strong
                >{data.selected.organisationName ?? 'Unresolved'}</strong
              ></span
            >
            <span><small>Email</small><strong>{data.selected.email ?? '—'}</strong></span>
            <span
              ><small>Party resolution</small><strong
                >{data.selected.resolvedPartyId ? 'Resolved' : 'Unresolved'}</strong
              ></span
            >
            <span
              ><small>Source campaign</small><strong
                >{data.selected.sourceCampaignId ? 'Linked' : '—'}</strong
              ></span
            >
            <span><small>Aggregate</small><strong>v{data.selected.aggregateVersion}</strong></span>
          </div>

          <div class="timeline-grid">
            <section class="panel">
              <div class="section-head">
                <span class="eyebrow">Score history</span><strong>{data.scores.length}</strong>
              </div>
              {#each data.scores as row}<article>
                  <div>
                    <strong>{row.reasonCode}</strong><span
                      >{Number(row.scoreDelta) >= 0 ? '+' : ''}{row.scoreDelta} → {row.scoreAfter}</span
                    >
                  </div>
                  <small>{row.reason}</small>
                </article>{:else}<p>No scoring events.</p>{/each}
            </section>
            <section class="panel">
              <div class="section-head">
                <span class="eyebrow">Nurture evidence</span><strong>{data.nurture.length}</strong>
              </div>
              {#each data.nurture as row}<article>
                  <div><strong>{row.interactionType}</strong><span>{row.channel}</span></div>
                  <small>{row.summary}</small>
                </article>{:else}<p>No nurture events.</p>{/each}
            </section>
            <section class="panel">
              <div class="section-head">
                <span class="eyebrow">Consent evidence</span><strong>{data.consents.length}</strong>
              </div>
              {#each data.consents as row}<article>
                  <div><strong>{row.purposeKey}</strong><span>{row.action}</span></div>
                  <small>{row.channel} · wording {row.wordingVersion}</small>
                </article>{:else}<p>No consent events.</p>{/each}
            </section>
            <section class="panel">
              <div class="section-head">
                <span class="eyebrow">Preferences</span><strong>{data.preferences.length}</strong>
              </div>
              {#each data.preferences as row}<article>
                  <div>
                    <strong>{row.preferenceType} · {row.scopeKey}</strong><span
                      >{row.preferenceValue}</span
                    >
                  </div>
                  <small>{row.channel}</small>
                </article>{:else}<p>No preference events.</p>{/each}
            </section>
          </div>

          {#if data.capabilities.canManage && ['NEW', 'QUALIFYING', 'QUALIFIED'].includes(data.selected.status)}
            <div class="command-grid">
              <details class="command">
                <summary>Enrich / resolve identity</summary>
                <form method="POST" action="?/enrich">
                  <input type="hidden" name="leadId" value={data.selected.id} /><input
                    type="hidden"
                    name="aggregateVersion"
                    value={data.selected.aggregateVersion}
                  />
                  <div class="grid">
                    <label
                      >Prospect name<input
                        name="prospectName"
                        value={data.selected.prospectName}
                      /></label
                    ><label
                      >Organisation<input
                        name="organisationName"
                        value={data.selected.organisationName ?? ''}
                      /></label
                    >
                  </div>
                  <div class="grid">
                    <label>Email<input name="email" value={data.selected.email ?? ''} /></label
                    ><label>Phone<input name="phone" value={data.selected.phone ?? ''} /></label>
                  </div>
                  <div class="grid">
                    <label
                      >Geography<input
                        name="geography"
                        value={data.selected.geography ?? ''}
                      /></label
                    ><label>Sector<input name="sector" value={data.selected.sector ?? ''} /></label>
                  </div>
                  <label
                    >Need summary<textarea name="needSummary" rows="2"
                      >{data.selected.needSummary}</textarea
                    ></label
                  >
                  <label
                    >Canonical Party ID<input
                      name="resolvedPartyId"
                      value={data.selected.resolvedPartyId ?? ''}
                      placeholder="Optional deliberate identity resolution"
                    /></label
                  >
                  <label
                    >Party Relationship ID<input
                      name="resolvedPartyRelationshipId"
                      value={data.selected.resolvedPartyRelationshipId ?? ''}
                    /></label
                  >
                  <button>Save enrichment</button>
                </form>
              </details>

              <details class="command">
                <summary>Score Lead</summary>
                <form method="POST" action="?/score">
                  <input type="hidden" name="leadId" value={data.selected.id} /><input
                    type="hidden"
                    name="aggregateVersion"
                    value={data.selected.aggregateVersion}
                  />
                  <div class="grid">
                    <label
                      >Score delta<input
                        type="number"
                        min="-100"
                        max="100"
                        step="any"
                        name="scoreDelta"
                        required
                      /></label
                    ><label>Reason code<input name="reasonCode" required /></label>
                  </div>
                  <label>Reason<textarea name="reason" rows="2" required></textarea></label><label
                    >Evidence reference<input name="evidenceReference" /></label
                  ><button>Record score event</button>
                </form>
              </details>

              <details class="command">
                <summary>Record nurture interaction</summary>
                <form method="POST" action="?/nurture">
                  <input type="hidden" name="leadId" value={data.selected.id} />
                  <label
                    >Campaign<select name="campaignId"
                      ><option value="">None</option>{#each data.campaigns as campaign}<option
                          value={campaign.id}>{campaign.campaignRef}</option
                        >{/each}</select
                    ></label
                  >
                  <div class="grid">
                    <label
                      >Interaction type<input
                        name="interactionType"
                        value="FOLLOW_UP"
                        required
                      /></label
                    ><label>Channel<input name="channel" value="PHONE" required /></label>
                  </div>
                  <label>Summary<textarea name="summary" rows="2" required></textarea></label><label
                    >Evidence reference<input name="evidenceReference" /></label
                  >
                  <div class="grid">
                    <label>Privacy purpose (if marketing)<input name="purposeKey" /></label><label
                      >Lawful basis<select name="lawfulBasis"
                        ><option value="">Not applicable</option><option>CONSENT</option><option
                          >LEGITIMATE_INTEREST</option
                        ></select
                      ></label
                    >
                  </div>
                  <button>Record nurture evidence</button>
                </form>
              </details>
            </div>
          {/if}

          <div class="privacy-grid">
            {#if data.capabilities.canConsent}
              <details class="command">
                <summary>Record Consent Evidence</summary>
                <form method="POST" action="?/consent">
                  <input type="hidden" name="leadId" value={data.selected.id} /><label
                    >Purpose<input name="purposeKey" value="MARKETING.GENERAL" required /></label
                  >
                  <div class="grid">
                    <label
                      >Action<select name="action"
                        ><option>GRANT</option><option>REFUSE</option><option>WITHDRAW</option
                        ><option>INVALIDATE</option></select
                      ></label
                    ><label>Channel<input name="channel" value="WEB" required /></label>
                  </div>
                  <div class="grid">
                    <label>Wording reference<input name="wordingReference" required /></label><label
                      >Wording version<input name="wordingVersion" required /></label
                    >
                  </div>
                  <label>Proof reference<input name="proofReference" required /></label><button
                    >Append consent event</button
                  >
                </form>
              </details>
            {/if}
            {#if data.capabilities.canPreference}
              <details class="command">
                <summary>Record Preference Evidence</summary>
                <form method="POST" action="?/preference">
                  <input type="hidden" name="leadId" value={data.selected.id} /><input
                    type="hidden"
                    name="preferenceType"
                    value="MARKETING"
                  />
                  <div class="grid">
                    <label
                      >Preference<select name="preferenceValue"
                        ><option>OPT_IN</option><option>OPT_OUT</option><option>BLOCK</option
                        ></select
                      ></label
                    ><label>Channel<input name="channel" value="EMAIL" required /></label>
                  </div>
                  <label>Scope<input name="scopeKey" value="MARKETING.GENERAL" required /></label
                  ><label>Source reference<input name="sourceReference" required /></label><button
                    >Append preference event</button
                  >
                </form>
              </details>
            {/if}
          </div>

          {#if data.capabilities.canQualify && ['NEW', 'QUALIFYING'].includes(data.selected.status)}
            <div class="decision-zone">
              <form method="POST" action="?/qualify">
                <input type="hidden" name="leadId" value={data.selected.id} /><input
                  type="hidden"
                  name="aggregateVersion"
                  value={data.selected.aggregateVersion}
                /><label
                  >Qualification summary<textarea name="qualificationSummary" rows="2" required
                  ></textarea></label
                ><button>Qualify Lead</button>
              </form>
              <form method="POST" action="?/disqualify">
                <input type="hidden" name="leadId" value={data.selected.id} /><input
                  type="hidden"
                  name="aggregateVersion"
                  value={data.selected.aggregateVersion}
                /><label
                  >Disqualification reason<textarea name="reason" rows="2" required
                  ></textarea></label
                ><button class="secondary">Disqualify</button>
              </form>
            </div>
          {/if}

          {#if data.capabilities.canQualify && data.selected.status === 'QUALIFIED'}
            <form method="POST" action="?/transfer" class="handoff">
              <input type="hidden" name="leadId" value={data.selected.id} /><input
                type="hidden"
                name="aggregateVersion"
                value={data.selected.aggregateVersion}
              />
              <div class="grid">
                <label>Sales handoff reference<input name="handoffRef" required /></label><label
                  >Qualification summary<textarea name="qualificationSummary" rows="2" required
                  ></textarea></label
                >
              </div>
              <button>Transfer exact Lead version to F07 Sales</button>
            </form>
          {/if}

          <section class="panel">
            <div class="section-head">
              <span class="eyebrow">Sales handoffs</span><strong>{data.handoffs.length}</strong>
            </div>
            {#each data.handoffs as row}<article>
                <div>
                  <strong>{row.handoffRef} · Lead v{row.leadVersion}</strong><span
                    >{row.status}</span
                  >
                </div>
                <small>{row.qualificationSummary}</small>
              </article>{:else}<p>No sales handoff.</p>{/each}
          </section>

          {#if data.capabilities.canManage && ['TRANSFERRED', 'DISQUALIFIED'].includes(data.selected.status)}
            <form method="POST" action="?/close" class="inline-action">
              <input type="hidden" name="leadId" value={data.selected.id} /><input
                type="hidden"
                name="aggregateVersion"
                value={data.selected.aggregateVersion}
              /><button>Close Lead record</button>
            </form>
          {/if}
        </section>
      {:else}<section class="section-card empty-state">
          <h2>Capture the first attributable Lead</h2>
          <p>
            Keep unresolved demand separate from Party and Opportunity until identity and
            qualification are deliberate.
          </p>
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
    grid-template-columns: 330px 1fr;
    gap: 12px;
    align-items: start;
  }
  .workspace.collection-only {
    grid-template-columns: minmax(0, 1fr);
  }
  .workspace.collection-only main {
    display: none;
  }
  .workspace.collection-only .register {
    position: static;
  }
  .register,
  .detail {
    padding: 13px;
  }
  .register {
    position: sticky;
    top: 106px;
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
  .state-group {
    display: flex;
    gap: 5px;
  }
  .state-group span {
    font-size: 8px;
    font-weight: 850;
    padding: 4px 6px;
    border-radius: 999px;
    background: #eaf4f9;
    color: #35617d;
  }
  .facts {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
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
  .timeline-grid,
  .command-grid,
  .privacy-grid,
  .decision-zone,
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
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
  button.secondary {
    background: #6d7e89;
  }
  .privacy-grid {
    margin-top: 4px;
  }
  .decision-zone,
  .handoff {
    margin-top: 10px;
    padding: 9px;
    border: 1px solid #d8e6ee;
    border-radius: 8px;
    background: #f7fbfd;
  }
  .inline-action {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }
  .message {
    padding: 9px;
    border: 1px solid #dd8a8a;
    background: #fff3f3;
    color: #792f2f;
    font-size: 9px;
  }
  .empty,
  .empty-state {
    color: #758896;
  }
  .empty-state {
    padding: 24px;
    text-align: center;
  }
  @media (max-width: 1000px) {
    .hero,
    .workspace,
    .facts,
    .timeline-grid,
    .command-grid,
    .privacy-grid,
    .decision-zone,
    .grid {
      grid-template-columns: 1fr;
    }
    .register {
      position: static;
    }
  }
</style>
