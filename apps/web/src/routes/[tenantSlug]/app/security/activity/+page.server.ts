import type { PageServerLoad } from './$types';
import { getAuthRepository } from '$lib/server/platform';

function requireSession(locals: App.Locals) {
  if (!locals.auth) throw new Error('Authenticated session required.');
  return locals.auth;
}

function eventLabel(eventType: string): string {
  const labels: Record<string, string> = {
    LOGIN: 'Password sign-in',
    LOGIN_EMAIL_UNVERIFIED: 'Sign-in blocked: email unverified',
    SESSION_CREATED: 'Application session created',
    SESSION_REVOKED: 'Application session revoked',
    OTHER_SESSIONS_REVOKED: 'Other sessions revoked',
    SESSION_POLICY_REVOKED: 'Session revoked by Tenant policy',
    SESSION_MFA_VERIFIED: 'Session MFA verified',
    EMAIL_VERIFICATION_QUEUED: 'Email verification requested',
    EMAIL_VERIFIED: 'Email verified',
    PASSWORD_RESET_QUEUED: 'Password reset requested',
    PASSWORD_RESET: 'Password reset completed',
    MFA_ENROLLMENT_STARTED: 'MFA enrollment started',
    MFA_ENABLED: 'MFA enabled',
    MFA_DISABLED: 'MFA disabled',
    MFA_RECOVERY_CODES_REGENERATED: 'MFA recovery codes regenerated',
    MFA_LOGIN_CHALLENGE_ISSUED: 'MFA sign-in challenge issued',
    MFA_REQUIRED_ENROLLMENT_CHALLENGE_ISSUED: 'Required MFA enrollment challenge issued',
    MFA_LOGIN: 'MFA sign-in verification',
    MFA_STEP_UP: 'MFA step-up verification',
    PASSKEY_REGISTRATION_CHALLENGE_ISSUED: 'Passkey registration started',
    PASSKEY_REGISTERED: 'Passkey registered',
    PASSKEY_REGISTRATION: 'Passkey registration verification',
    PASSKEY_LOGIN_CHALLENGE_ISSUED: 'Passkey sign-in challenge issued',
    PASSKEY_LOGIN: 'Passkey verification',
    PASSKEY_REVOKED: 'Passkey revoked',
    TENANT_REGISTERED: 'Tenant registration completed',
    ACCOUNT_BOOTSTRAPPED: 'Application account bootstrapped'
  };

  return labels[eventType] ?? eventType
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export const load: PageServerLoad = async ({ locals }) => {
  const session = requireSession(locals);
  const events = await getAuthRepository().listSecurityEvents(session, 100);

  return {
    events: events.map((event) => ({
      ...event,
      label: eventLabel(event.eventType)
    }))
  };
};
