# NuBlox Administrator Guide

**Audience:** tenant administrators, business configuration owners, security administrators and technical operators

Start with the [Product Handbook](../handbook/README.md) and [System Architecture](../handbook/10-system-architecture.md).

## Administration model

NuBlox separates three concerns.

### Enterprise Data

Operational master/reference information used by business processes.

### Business Configuration

Rules that determine how business processes behave.

Examples:

- classifications;
- lifecycles;
- workflows;
- approval rules;
- delegated-authority rules;
- numbering;
- calendars;
- templates;
- reference data.

### Technical Administration

Platform operation and diagnostics.

Examples:

- authentication/identity administration;
- integrations;
- migration operations;
- queues/jobs;
- environment health;
- technical troubleshooting.

Do not mix these concerns merely because the same administrator can access them.

## Tenant and membership

Every business operation occurs within an explicit tenant context.

Administrators manage tenant membership and the relationship between authenticated users and NuBlox business identity.

Cross-tenant access must never arise from ordinary tenant administration.

## Party and Organisation master

Party/Organisation is shared canonical enterprise data.

Do not create separate copies of an Organisation because it becomes a:

- customer;
- supplier;
- subcontractor;
- consultant;
- partner.

Use governed Party Relationships.

## Organisation structure

Organisation Units and reporting/structural relationships should be effective-dated where history matters.

Do not use security-role hierarchy as a substitute for organisation structure.

## Security model

Effective security is contextual.

```text
User Identity
 -> Tenant Membership
 -> Role Assignment
 -> Permission
 -> Scope
 -> record/lifecycle rules
 -> Delegated / Approval Authority
 -> segregation-of-duties controls
```

### Access Role vs Job Profile

Never grant access by treating a Job Profile as an Access Role.

### Delegated authority

Delegated Authority must have explicit:

- grantor/basis;
- recipient;
- scope;
- threshold where applicable;
- start/end;
- status;
- evidence/history.

### Access requests

An access request is a request for authority, not authority itself.

Approval should create/update the governed access assignment/grant and retain the decision evidence.

## Deliverable configuration

Administrators and business owners can govern deliverable types, numbering, disciplines, metadata, lifecycle/status, revision rules, review/approval routes, issue/transmittal rules, templates, retention and connected-authoring behaviour.

## Reference data

Reference data should be centrally governed and versioned/effective where historical interpretation requires it.

Changes must not silently reinterpret existing transactions.

## Lifecycles

Lifecycle configuration defines allowed states/transitions.

Runtime object state remains on the object; it is not stored only in workflow history.

## Classifications

Classifications overlay canonical identity.

Use a governed System -> Release -> Code pattern for systems such as Uniclass and other controlled classifications.

## Audit and evidence

Administrators should not edit or delete material audit/decision evidence merely to correct business data.

Corrections should use governed reversal/correction patterns.

## Data retention and legal hold

Retention policy does not override active legal hold.

Disposition decisions require attributable evidence.

## System migrations

Database schema changes are managed through ordered migrations under `app/migrations/`.

Typical local/update operator flow:

```bash
pnpm install
pnpm db:migrate
pnpm db:status
pnpm db:types
pnpm check
```

Production change procedures should include backup, migration status, rollback/recovery planning and post-deployment verification appropriate to the environment.

## Troubleshooting categories

Distinguish:

- authentication failure;
- tenant-membership failure;
- permission denial;
- delegated-authority failure;
- validation failure;
- stale object/version conflict;
- edit-lease conflict;
- integration failure;
- migration/schema drift;
- unexpected server failure.

These require different responses and should not be collapsed into one generic error.

## Administration principle

Configuration may vary business behaviour, but it must not fragment canonical identity, tenant isolation or the fundamental meaning of core objects.
