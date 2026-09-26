<script lang="ts">
  import MarketingShell from '$lib/components/MarketingShell.svelte';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
  const viewForm = $derived(
    form as ActionData &
      Partial<{
        success: boolean;
        error: string;
        values: {
          name: string;
          email: string;
          company: string;
          jobTitle: string;
          phone: string;
          interest: string;
          message: string;
        };
      }>
  );
</script>

<svelte:head>
  <title>Contact NuBlox</title>
  <meta name="description" content="Talk to NuBlox about enterprise ERP consolidation, Construction & Built Environment operations, product architecture, security, pricing or implementation." />
</svelte:head>

<MarketingShell>
  <main class="marketing-main">
    <section class="marketing-hero compact">
      <div class="marketing-hero-copy">
        <p class="marketing-kicker">Contact</p>
        <h1>Bring us the operating model you need software to handle.</h1>
        <p class="marketing-lede">Tell us about the organisation, the work you deliver, the systems you are replacing, and the problem you need NuBlox to solve. We will use that context to structure the conversation.</p>
      </div>
    </section>

    <section class="marketing-contact-section">
      <aside class="marketing-contact-aside">
        <p class="marketing-kicker">Useful starting points</p>
        <h2>What should we discuss?</h2>
        <ul>
          <li>Whole-enterprise ERP and application-estate consolidation</li>
          <li>Construction & Built Environment operating models</li>
          <li>29 Core Business Functions and functional coverage</li>
          <li>Job Architecture, HCM and Position-led working worlds</li>
          <li>Work products, projects, information and governed delivery</li>
          <li>Security, architecture, migration and procurement review</li>
          <li>Commercial model and implementation scope</li>
        </ul>
      </aside>

      <div class="marketing-form-panel">
        {#if viewForm?.success}
          <div class="marketing-success" role="status">
            <p class="marketing-kicker">Enquiry received</p>
            <h2>Thank you. Your enquiry has been recorded.</h2>
            <p>NuBlox now has the context you submitted for the commercial or product conversation.</p>
            <a class="marketing-link-arrow" href="/resources">Continue exploring NuBlox <span>→</span></a>
          </div>
        {:else}
          {#if viewForm?.error}<p class="marketing-form-error" role="alert">{viewForm.error}</p>{/if}
          <form method="POST" class="marketing-form">
            <div class="marketing-form-grid">
              <label><span>Name</span><input name="name" autocomplete="name" required value={viewForm?.values?.name ?? ''} /></label>
              <label><span>Business email</span><input name="email" type="email" autocomplete="email" required value={viewForm?.values?.email ?? ''} /></label>
              <label><span>Organisation</span><input name="company" autocomplete="organization" required value={viewForm?.values?.company ?? ''} /></label>
              <label><span>Job title</span><input name="jobTitle" autocomplete="organization-title" value={viewForm?.values?.jobTitle ?? ''} /></label>
              <label><span>Telephone <small>optional</small></span><input name="phone" autocomplete="tel" value={viewForm?.values?.phone ?? ''} /></label>
              <label>
                <span>Area of interest</span>
                <select name="interest" required>
                  <option value="">Choose one</option>
                  <option value="ENTERPRISE_ERP" selected={viewForm?.values?.interest === 'ENTERPRISE_ERP'}>Enterprise ERP / application consolidation</option>
                  <option value="CBE" selected={viewForm?.values?.interest === 'CBE'}>Construction & Built Environment</option>
                  <option value="HCM" selected={viewForm?.values?.interest === 'HCM'}>Human Capital / organisation design</option>
                  <option value="ARCHITECTURE" selected={viewForm?.values?.interest === 'ARCHITECTURE'}>Platform / architecture review</option>
                  <option value="SECURITY" selected={viewForm?.values?.interest === 'SECURITY'}>Security / procurement review</option>
                  <option value="PRICING" selected={viewForm?.values?.interest === 'PRICING'}>Pricing / commercial discussion</option>
                  <option value="PARTNERSHIP" selected={viewForm?.values?.interest === 'PARTNERSHIP'}>Partnership / other</option>
                </select>
              </label>
            </div>
            <label><span>Tell us what you need NuBlox to handle</span><textarea name="message" rows="8" minlength="20" required>{viewForm?.values?.message ?? ''}</textarea></label>
            <label class="marketing-honeypot" aria-hidden="true"><span>Website</span><input name="website" tabindex="-1" autocomplete="off" /></label>
            <p class="marketing-form-note">By submitting this form, you are asking NuBlox to use the details provided to respond to this enquiry.</p>
            <button class="marketing-button" type="submit">Send enquiry</button>
          </form>
        {/if}
      </div>
    </section>

    <section class="marketing-split marketing-section marketing-section-tint">
      <div><p class="marketing-kicker">Prefer to explore first?</p><h2>Review the product model before starting a conversation.</h2></div>
      <div class="marketing-inline-links">
        <a href="/product">Product overview →</a>
        <a href="/functions">Function catalogue →</a>
        <a href="/construction-built-environment">CBE solution →</a>
        <a href="/security">Trust & security →</a>
        <a href="/pricing">Pricing model →</a>
      </div>
    </section>
  </main>
</MarketingShell>
