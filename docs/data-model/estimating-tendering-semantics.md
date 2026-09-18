# Estimating, Measurement, Tendering, Proposals & Sales Semantics

## Purpose

BOF-05 governs the commercial pricing and bid-side object model from customer enquiry through estimate, tender submission and accepted offer.

The governing chain is:

```text
Opportunity / Customer Enquiry
        ↓
Estimate
        ↓
Estimate Version
        ↓
Breakdown / Take-off / Measurement
        ↓
Resource Build-up / Estimate Rate
        ↓
Estimate Provision
        ↓
Tender Adjudication
        ↓
Proposal / Quotation
        ↓
Offer Acceptance
        ↓
Sales Order and/or Contract
```

The central rule is:

> Estimating creates a controlled pricing basis. It does not become the Project, WBS, procurement structure, accounting structure or Contract.

## Customer Enquiry and Invitation to Tender

A Customer Enquiry is a governed inbound commercial request linked to the canonical Party/Party Relationship and, where applicable, CRM Opportunity.

Invitation to Tender is a formal enquiry type with stronger issue, amendment, deadline and submission requirements. It does not require a parallel master identity.

## Estimate identity and versions

Estimate is the stable aggregate identity. Estimate Version contains the exact pricing basis at one point in time.

```text
Estimate
   ↓
Working Version
   ↓
Frozen / Adjudicated / Submitted Version
```

A frozen/adjudicated/submitted version is immutable. Later changes create a successor version.

Estimate identity therefore remains separate from:

- Project;
- WBS;
- Budget;
- Forecast;
- Contract;
- Ledger/accounting posting;
- customer Proposal/Quotation.

## Breakdown structure

Estimate Breakdown Item is an estimating hierarchy only.

It may map to:

- WBS Elements;
- Work Packages;
- Cost Codes;
- Commercial Packages;
- Procurement Packages;
- Items;
- information classifications.

Those mappings do not create shared identity.

Preliminaries are represented through typed Estimate Breakdown Items/sections rather than a second estimating hierarchy.

## Take-off and measurement

Take-off is a governed measurement set linked to exact controlled-information sources and revisions.

Measurement Item is subordinate to Take-off and retains:

- dimensions/formula;
- quantity;
- Unit of Measure;
- information/model/drawing source;
- location/classification;
- check/freeze evidence.

If source information changes, NuBlox preserves prior frozen measurement evidence and records successor measurement work.

## Resource build-up and rates

Resource Build-up is subordinate estimating detail that references canonical labour/plant/material/service/Item identities.

It never creates duplicate resource masters.

Estimate Rate is contextual applied/derived pricing evidence. It may reference:

- Price List / Commercial Rate;
- supplier/subcontract response;
- historic cost data;
- productivity assumptions;
- labour/plant/material resource costs;
- explicit override.

The actual rate used in a frozen Estimate Version remains traceable even when source price lists later change.

## Allowance and contingency

Allowance and Contingency use one **Estimate Provision** pattern with a governed type.

Every provision records its basis, owner, value/method and release/use rule.

Provision is not automatically:

- Project Risk;
- accounting reserve;
- Contract allowance;
- commercial change;
- management contingency in a later approved budget.

Explicit transformation/mapping is required.

## Tender Package

Tender Package is bid-side scope/information grouping answering the customer enquiry.

It is deliberately distinct from:

```text
Tender Package
≠ Procurement Package
≠ Commercial Package
≠ Work Package
≠ WBS Element
≠ Contract
```

## Supplier and subcontract market testing

Estimating does not build a second sourcing engine.

```text
Supplier / Subcontract Enquiry
        ↓
shared Sourcing Request
        ↓
Quote / Bid Return
        ↓
shared Sourcing Response
        ↓
Comparison
        ↓
shared Sourcing Evaluation
```

Purpose/context identifies that the sourcing round supports estimating/market testing.

A supplier Sourcing Evaluation is distinct from the contractor's internal Tender Adjudication.

## Tender adjudication

Tender Adjudication is immutable decision evidence binding:

- exact Estimate Version;
- proposed tender price;
- margin/mark-up;
- assumptions;
- exclusions/qualifications;
- provisions and major risks;
- decision actor/body;
- authority basis;
- timestamp.

The decision never silently modifies the Estimate Version it approves.

## Proposal and quotation

Proposal and Quotation are controlled external offers.

Proposal typically represents the wider solution, methodology, scope and qualifications.

Quotation represents a priced commercial offer.

Both retain immutable issued versions and link to their exact internal Estimate Version/pricing basis.

Neither becomes Contract identity merely because the customer receives it.

## Offer acceptance and sales order

Offer Acceptance is immutable evidence that an exact issued offer/version was accepted.

```text
Issued Proposal / Quotation
        ↓
Offer Acceptance
        ↓
explicit domain action
        ↓
Sales Order and/or Contract
        ↓
Project/delivery context where applicable
```

Acceptance is not itself the Sales Order, Contract or Project.

## Non-negotiable rules

1. Estimate identity is stable; versions carry controlled revision/freeze semantics.
2. Estimate Breakdown is not WBS, accounting structure or package identity.
3. Preliminaries use the estimating breakdown structure.
4. Allowance and Contingency use one Estimate Provision pattern.
5. Take-off/measurement retain exact source-information provenance.
6. Build-ups reference shared Items/resources rather than duplicate masters.
7. Estimate Rates retain the exact applied basis and do not rewrite source price lists.
8. Tender Package remains distinct from Procurement/Commercial/Work Packages.
9. Estimating supplier/subcontract market testing reuses shared sourcing semantics.
10. Tender Adjudication is internal immutable decision evidence.
11. Proposal/Quotation are controlled external offers, not internal Estimate truth.
12. Offer Acceptance binds an exact offer version and does not become downstream commitment identity.
13. Project controls trace accepted estimate basis by explicit mapping rather than reusing estimate structure as WBS.
