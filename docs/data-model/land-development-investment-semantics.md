# Land, Development, Investment & Property Acquisition Semantics

## Purpose

BOF-04 governs development opportunities, investment/business cases, land/property interests, development appraisals, planning/consent and acquisition-support evidence while reusing canonical spatial, Party, Contract, Project and finance identities.

The governing rule is:

> Development context operates around canonical land/property and enterprise truth. It does not create a second estate, project, contract, party or finance model.

## Development opportunity and business case

Development Opportunity is a land/property investment opportunity. It is distinct from CRM Opportunity because no customer sales relationship is required.

Investment Case is a Business Case type.

Business Case combines need/objectives, options, benefits, costs, risks, assumptions, funding and recommendation.

Approval is a separate immutable shared Decision with authority evidence.

## Development appraisal

Development Appraisal is a versioned or frozen decision-support projection over exact source assumptions and data such as:

- land/acquisition cost;
- development/estimate cost;
- programme;
- sales/rental/value assumptions;
- finance/funding;
- tax/context where relevant;
- scenario/sensitivity assumptions.

It is not ledger truth, an Estimate, a Budget or a Property Valuation.

## Land option

The source Option candidate is treated as a land/development Option Agreement using canonical Contract identity.

Option-specific rights, exercise windows, conditions and pricing mechanisms are contractual terms/context around one Contract identity.

## Land parcel and property interests

Land Parcel reuses the canonical BOF-16 cadastral spatial identity.

Property Interest is the effective relationship between a Party and Property/Land Parcel.

Ownership Interest and Occupation Interest are Property Interest types.

Changes in ownership/occupation never recreate the Property, Parcel or Party.

## Site appraisal, constraints and survey

Site Appraisal is dated multi-disciplinary assessment evidence.

Development Constraint is a governed constraint affecting development feasibility/scope/timing/use. It is distinct from project-delivery Constraint and may exist before a Project.

Survey is an event/evidence occurrence over exact spatial scope. Reports, plans and models use controlled Information Container identity.

## Property valuation

Property Valuation is a professional value opinion for Property, Land Parcel or Property Interest at an effective valuation date under an explicit basis and purpose.

It is deliberately distinct from BOF-08 contract/payment Valuation.

Property Valuation does not automatically change accounting Fixed Asset values.

## Planning

The planning chain is:

```text
Development Opportunity / proposal
        ↓
Planning Application
        ↓
authority determination
        ↓
Planning Consent
        ↓
Planning Conditions
        ↓
discharge / compliance evidence
```

Application and Consent are different identities.

Planning Condition is subordinate to the Consent and preserves exact wording and discharge history.

Planning Obligation reuses shared Legal Obligation semantics while retaining planning/legal source context.

## Funding evidence

Funding Evidence captures attributable proof of funding approval, commitment, availability or grant award.

Grant Evidence is a Funding Evidence type.

Evidence never creates a Finance posting, Treasury Facility or Contract on its own.

## Non-negotiable rules

1. Reuse Site, Land Parcel, Property, Party, Contract and Project identities.
2. Development Opportunity is distinct from CRM Opportunity and Project.
3. Investment Case is a Business Case type; Business Case is separate from Decision.
4. Development Appraisal is decision support, not ledger or valuation truth.
5. Land Option uses Contract.
6. Property Interest models ownership/occupation without mutating Property/Party identity.
7. Development Constraint is distinct from Project Delivery Constraint.
8. Property Valuation is distinct from commercial/payment Valuation.
9. Planning Application, Consent and Conditions remain separate layers.
10. Planning Obligation reuses Legal Obligation with source authority preserved.
11. Survey/Appraisal/Funding are attributable evidence with exact source/scope.
12. Material investment decisions use shared Decision evidence and authority evaluation.
