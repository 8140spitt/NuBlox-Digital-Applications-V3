import { randomUUID } from 'node:crypto';
import { createDatabasePool } from '@nublox/persistence';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

const pool = createDatabasePool();

function text(form: FormData, key: string, max: number): string {
  return String(form.get(key) ?? '').trim().slice(0, max);
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 320;
}

export const actions: Actions = {
  default: async ({ request, url }) => {
    const form = await request.formData();
    const honeypot = text(form, 'website', 200);
    if (honeypot) return { success: true };

    const name = text(form, 'name', 160);
    const email = text(form, 'email', 320).toLowerCase();
    const company = text(form, 'company', 200);
    const jobTitle = text(form, 'jobTitle', 200);
    const phone = text(form, 'phone', 64);
    const interest = text(form, 'interest', 80);
    const message = text(form, 'message', 6000);

    const values = { name, email, company, jobTitle, phone, interest, message };

    if (!name || !validEmail(email) || !company || !interest || message.length < 20) {
      return fail(400, {
        error: 'Please provide your name, business email, organisation, area of interest and enough detail for us to understand the enquiry.',
        values
      });
    }

    await pool.execute(
      `INSERT INTO marketing_enquiries
        (id,name,email,company,job_title,phone,interest,message,source_path,status)
       VALUES (?,?,?,?,?,?,?,?,?,'NEW')`,
      [
        `MKT-${randomUUID()}`,
        name,
        email,
        company,
        jobTitle || null,
        phone || null,
        interest,
        message,
        url.pathname
      ]
    );

    return { success: true };
  }
};
