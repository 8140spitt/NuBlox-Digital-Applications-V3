# F09 Job Profile Reconciliation — Procurement & Supplier Management

**Status:** employment-model reconciliation complete  
**Date:** 20 September 2026  
**Function:** F09 Procurement & Supplier Management

## Result

All F09 source Job Profiles now have an explicit employment treatment.

Leadership:
- Head of Procurement & Supplier Management

Professional roles:
- Procurement Strategy Manager
- Category Manager
- Supplier Sourcing Specialist
- Strategic Sourcing Specialist
- Supplier Commercial Manager
- Procurement Contracts Manager
- Supplier Onboarding Specialist
- Procurement Operations Specialist
- Buyer
- Supplier Performance Specialist
- Supplier Risk Specialist
- Supplier Relationship Manager
- Procurement Analyst

The roles remain distinct because sourcing, onboarding, contracting, purchasing, performance, risk and relationship management have different Work Products and authority boundaries.

## Key architecture findings

- Procurement strategy, category planning and analytics currently share one Procurement Package model.
- Supplier discovery, onboarding/due diligence and ongoing SRM are overloaded onto Party Relationship.
- Requisition-to-PO conversion and PO approval require explicit procurement authority and separation-of-duties semantics.

The Party/Organisation master must remain canonical. Supplier qualification/onboarding must not create a second supplier identity.

See `job-profile-reconciliation-architecture-gap-register.csv`.

## Next work

Each retained role now needs explicit Work Products, exact activity mappings, sourcing/contract/commitment authority, supplier lifecycle semantics, evidence and downstream finance/logistics handoffs.
