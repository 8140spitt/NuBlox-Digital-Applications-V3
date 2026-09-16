<script lang="ts">
  import { authorityEvaluation, authorityModel, authorityRules } from '$lib/data/authority-participation-model';
  let { data } = $props();
</script>

<svelte:head><title>Authority & Participation Model · NuBlox</title></svelte:head>

<div class="page">
  <header class="hero section-card">
    <div>
      <span class="eyebrow">Canonical authority model</span>
      <h1>Authority & Participation</h1>
      <p>Governed semantics for authentication, participation, roles, responsibility and delegated authority. This model determines who may see and execute actions without turning lifecycle plumbing into the user interface.</p>
    </div>
    <div class="hero-actions">
      <a href={`/${data.tenantSlug}/app/admin/business-objects/foundation`}>← Foundation semantics</a>
      <strong>{authorityModel.length} governed concepts</strong>
      <span>{authorityEvaluation.length} authorization evaluation steps</span>
    </div>
  </header>

  <section class="equation section-card">
    <span class="eyebrow">Runtime decision</span>
    <h2>Available action = identity + participation + role + responsibility + authority + policy + object context</h2>
    <p>NuBlox evaluates this server-side for the requested action. The UI only presents actions that survive the evaluation.</p>
  </section>

  <section class="concept-grid">
    {#each authorityModel as item}
      <article class="section-card concept">
        <header>
          <div><code>{item.modelId}</code><h2>{item.canonicalName}</h2></div>
          <span class:item-auth={item.kind === 'authorization'}>{item.kind}</span>
        </header>
        <p>{item.definition}</p>
        <dl>
          <div><dt>Candidate</dt><dd>{item.candidateKey}</dd></div>
          <div><dt>System identity</dt><dd>{item.systemIdentity}</dd></div>
          <div><dt>Scope</dt><dd class="chips">{#each item.scope as scope}<span>{scope}</span>{/each}</dd></div>
          <div><dt>Key data</dt><dd><ul>{#each item.keyData as field}<li>{field}</li>{/each}</ul></dd></div>
          <div><dt>Lifecycle</dt><dd class="states">{#each item.lifecycle as state}<span>{state}</span>{/each}</dd></div>
          <div><dt>Effectivity</dt><dd>{item.effectivity}</dd></div>
          <div><dt>Governance</dt><dd><ul>{#each item.governance as rule}<li>{rule}</li>{/each}</ul></dd></div>
        </dl>
      </article>
    {/each}
  </section>

  <section class="section-card evaluation">
    <div class="section-heading">
      <div><span class="eyebrow">Authorization pipeline</span><h2>How an action becomes available</h2></div>
      <p>Evaluation is repeated at execution time; task assignment or a visible button is never sufficient security evidence.</p>
    </div>
    <ol>
      {#each authorityEvaluation as step}
        <li><span>{step.order}</span><div><strong>{step.name}</strong><p>{step.rule}</p></div></li>
      {/each}
    </ol>
  </section>

  <section class="section-card rules">
    <span class="eyebrow">Non-negotiable rules</span>
    <h2>Authorization invariants</h2>
    <div class="rule-grid">{#each authorityRules as rule}<div>✓ {rule}</div>{/each}</div>
  </section>

  <section class="section-card example">
    <span class="eyebrow">F01.01 correction</span>
    <h2>Why this fixes the approval screen</h2>
    <div class="flow"><span>User Identity</span><b>→</b><span>Person / Party</span><b>→</b><span>Membership</span><b>→</b><span>Role / Responsibility</span><b>→</b><span>Delegated Authority</span><b>→</b><span>Policy + record state</span><b>→</b><strong>Allowed actions</strong></div>
    <p>An F01.01 record being <em>In Review</em> no longer means every viewer sees Approve, Return and Reject. The action set is calculated for the current actor and record context.</p>
  </section>
</div>

<style>
  .page{display:grid;gap:12px}.section-card{border:1px solid var(--line);border-radius:10px;background:white}.hero{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px;align-items:center;padding:20px;background:linear-gradient(120deg,#fbfdff,#eaf6fd 65%,#fff)}.eyebrow{color:var(--blue-700);font-size:10px;font-weight:850;letter-spacing:.07em;text-transform:uppercase}h1{margin:5px 0 7px;font-size:27px}h2{margin:3px 0 0;font-size:16px}.hero p,.equation p,.section-heading p,.example p{margin:0;color:#50697c;font-size:11px;line-height:1.55}.hero-actions{display:grid;gap:5px;padding:12px;border:1px solid #a7d1eb;border-radius:8px;background:#fff}.hero-actions a{color:var(--blue-700);font-size:10px;font-weight:800;text-decoration:none}.hero-actions strong{font-size:16px}.hero-actions span{color:#6c8192;font-size:10px}.equation{padding:15px;background:#f7fbfe}.equation h2{margin:5px 0}.concept-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.concept{padding:14px}.concept header{display:flex;align-items:start;justify-content:space-between;gap:12px;padding-bottom:9px;border-bottom:1px solid var(--line)}.concept header div{display:grid;gap:3px}.concept header>span{padding:3px 7px;border-radius:999px;background:#eef3f6;color:#536a79;font-size:8.5px;font-weight:800;text-transform:uppercase}.concept header>span.item-auth{background:#fff0d9;color:#825414}.concept p{color:#4b6375;font-size:10.5px;line-height:1.5}.concept code{width:max-content;padding:2px 5px;border-radius:4px;background:#eef3f6;color:#4a6679;font-size:9px}.concept dl{display:grid;gap:8px;margin:0}.concept dl>div{display:grid;grid-template-columns:105px minmax(0,1fr);gap:8px}.concept dt{color:#718493;font-size:8.5px;font-weight:800;text-transform:uppercase}.concept dd{margin:0;color:#40596c;font-size:9.5px;line-height:1.45}.concept ul{margin:0;padding-left:15px}.chips,.states{display:flex;flex-wrap:wrap;gap:4px}.chips span,.states span{padding:3px 6px;border-radius:999px;background:#eef6fb;color:#285a79;font-size:8.5px;font-weight:750}.states span{background:#f2f4f6;color:#4f6575}.evaluation,.rules,.example{padding:15px}.section-heading{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:11px}.section-heading p{max-width:560px;text-align:right}.evaluation ol{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;list-style:none;margin:0;padding:0}.evaluation li{display:grid;grid-template-columns:28px minmax(0,1fr);gap:8px;padding:10px;border:1px solid #dfe7ec;border-radius:8px;background:#fbfcfd}.evaluation li>span{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#e5f3fb;color:#1e587b;font-size:10px;font-weight:850}.evaluation strong{font-size:10.5px}.evaluation p{margin:3px 0 0;color:#667b8c;font-size:9.5px;line-height:1.45}.rule-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:10px}.rule-grid div{padding:9px;border:1px solid #e0e7eb;border-radius:7px;background:#fbfcfd;color:#435d70;font-size:9.5px;line-height:1.4}.flow{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:11px 0}.flow span,.flow strong{padding:6px 8px;border-radius:7px;background:#eef5f9;color:#365b72;font-size:9.5px}.flow strong{background:#e1f2e5;color:#2d6c3a}.flow b{color:#8295a3}.example{background:#fbfcfd}@media(max-width:1000px){.concept-grid{grid-template-columns:1fr}.evaluation ol,.rule-grid{grid-template-columns:repeat(2,1fr)}.hero{grid-template-columns:1fr}}@media(max-width:700px){.evaluation ol,.rule-grid{grid-template-columns:1fr}.section-heading{display:grid}.section-heading p{text-align:left}.concept dl>div{grid-template-columns:1fr}.hero{padding:14px}}
</style>
