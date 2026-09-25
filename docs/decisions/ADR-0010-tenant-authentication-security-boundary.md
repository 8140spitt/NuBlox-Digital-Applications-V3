# ADR-0010 — Tenant authentication security boundary

**Status:** Accepted  
**Date:** 25 September 2026

## Decision

NuBlox separates authentication from enterprise authorisation.

Authentication answers whether an application identity has securely proved control of an approved sign-in method. NuBlox authorisation separately resolves Tenant, EMPLOYEE Party, Person, Position, Function work stream, Permission, Responsibility, Authority, competence and object/context scope.

## Tenant route boundary

Employee authentication is tenant-scoped:

~~~text
/{tenantSlug}/app/auth/...
~~~

The Tenant slug is routing metadata. Every protected request must resolve the slug to the immutable Tenant ID and match that ID to the server-side session Tenant ID.

## Current authentication controls

- opaque random server sessions; only token hashes are persisted;
- application cookies scoped to `/{tenantSlug}/app`;
- verified email required for public Tenant registration;
- email-verification and password-reset challenges use random one-time tokens;
- challenge evidence stores SHA-256 token hashes rather than raw challenge tokens;
- challenges expire, are single-use and invalidate earlier active challenges of the same purpose;
- stale queued messages are cancelled when a replacement challenge is issued;
- password reset revokes every active application session for the identity;
- public recovery responses do not disclose whether an account exists;
- login, registration, verification resend and password-reset requests use persistent HMAC-hashed rate-limit buckets;
- rate limiting includes identity+network and network-wide dimensions;
- security messages are delivered through a retryable identity-message outbox;
- successful message delivery purges the raw action link from the outbox;
- tenant-scoped TOTP MFA uses encrypted authenticator secrets and single-use recovery codes;
- TOTP replay is prevented by retaining the last accepted time counter;
- application sessions record authentication strength and the time of the most recent MFA verification;
- active sessions have public-safe session IDs, client descriptors and hashed network fingerprints;
- Tenant authentication policy governs MFA requirement, total session lifetime, idle timeout and concurrent-session limits;
- policy changes immediately revoke existing sessions that no longer comply;
- sensitive authentication-administration actions require recent MFA step-up rather than relying on an old session verification;
- production console delivery is prohibited and production origins/transports require HTTPS.

## Tenant registration

Public `/register` creates the minimum authoritative business and identity spine atomically:

~~~text
Tenant
-> TENANT Party
-> Organisation
-> root Organisation Unit

registrant
-> EMPLOYEE Party
-> Person
-> application identity
-> Tenant membership
-> Tenant administrator access
-> email verification challenge
~~~

Registration does not fabricate Employment, Job Profile, Position or Position Occupancy. Those are created through governed HCM configuration.

## Message delivery

Security messages are business-critical infrastructure but are not authentication authority. The authentication transaction queues an identity message; a delivery worker transports it through the configured HTTPS adapter.

Mail transport failure does not create a verified identity and does not expose the raw challenge token through the authentication evidence table.

## Recovery

Password reset is valid only when:

- the challenge exists;
- the challenge belongs to the Tenant route being used;
- the challenge has not expired;
- the challenge has not been consumed or invalidated;
- the application identity remains active.

After reset, old sessions are revoked before the user can continue.

## Authentication policy and step-up

Tenant authentication policy is governed Tenant data. Changing the policy requires both the appropriate NuBlox access Permission and a recent MFA verification. Authorisation is evaluated first; stronger authentication never grants a Permission the Person does not already hold.

When MFA is required and an employee has not yet enrolled, password verification creates only a short-lived pre-session enrollment challenge. A full application session is not issued until TOTP enrollment has been verified.

## Future authentication methods

Passkeys/WebAuthn and enterprise OIDC/SAML SSO remain subsequent authentication-layer capabilities. They must bind into this same Tenant/session security boundary and must not replace NuBlox's Person/Position/Function/Permission/Authority model.

## Invariants

1. Tenant slug is never authentication or authorisation evidence.
2. Authentication identity != Person != Position != Permission != Authority.
3. Public registration cannot enter the Tenant application until the configured verification policy is satisfied.
4. Raw session tokens and raw challenge tokens are not persisted as authentication evidence.
5. Password recovery never preserves existing sessions.
6. Public recovery endpoints do not confirm account existence.
7. Rate-limit keys do not persist raw email or network addresses.
8. Authentication transport adapters do not own NuBlox business identity or authorisation.
9. Authentication step-up cannot create or expand business Permission or Authority.
10. Tenant policy changes take effect against existing sessions, not only future sessions.
