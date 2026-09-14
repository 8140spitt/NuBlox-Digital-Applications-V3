# Native Capability Domain Hypothesis

**Status:** V3 architecture hypothesis — not yet approved  
**Purpose:** provide a starting point for revalidating native product ownership without turning enterprise functions into software modules.

## Why this exists

The enterprise has 29 L1 functions. NuBlox does not therefore need 29 independent application modules.

A business function describes **work the organisation performs**. A native capability domain describes **where NuBlox owns canonical records, invariants, lifecycle rules and commands**. One function usually composes several native domains, and one native domain normally supports several functions.

The previous NuBlox architecture identified 19 native domains. V3 treats these as a candidate decomposition to test, not an inherited truth.

## Candidate domains to revalidate

| Code | Candidate native domain |
| --- | --- |
| D01 | Enterprise, identity & master data |
| D02 | CRM, business development & customer management |
| D03 | Estimating, bidding, tendering, proposals & sales |
| D04 | Contracts, commercial management & revenue |
| D05 | Portfolio, programme & project management |
| D06 | Design, engineering, BIM & information management |
| D07 | Finance & statutory accounting |
| D08 | Management accounting, planning, treasury & enterprise performance |
| D09 | Procurement, subcontracting & supplier management |
| D10 | Materials, inventory, warehouse, distribution & logistics |
| D11 | Production, fabrication & prefabrication |
| D12 | People, HCM, workforce & payroll |
| D13 | Site, field & construction operations |
| D14 | Quality, health, safety, environment & compliance |
| D15 | Plant, fleet, equipment & enterprise asset management |
| D16 | Property, real estate, estates & facilities |
| D17 | Service, maintenance, warranty & aftercare |
| D18 | Sustainability, carbon & environmental performance |
| D19 | Data, workflow, analytics, search & intelligence |

## V3 revalidation tests

Each candidate domain must pass all of the following before it becomes part of the approved V3 architecture:

1. **Cohesion:** the domain owns a coherent set of business invariants and lifecycle decisions.
2. **Clear ownership:** material business objects have one authoritative owner.
3. **Low semantic leakage:** the boundary does not require other domains to understand its internal implementation details.
4. **Workflow composability:** cross-functional journeys can compose the domain without copying its records.
5. **Permission integrity:** authorisation can be expressed consistently at the domain boundary.
6. **Audit integrity:** material commands and state transitions generate attributable evidence.
7. **Construction relevance:** the boundary works for construction and built-environment operating models, including project, programme, asset and enterprise contexts.
8. **Scale realism:** the boundary is justified by business ownership, not by arbitrary technical decomposition.
9. **UX independence:** users are not forced to navigate by domain simply because the backend has that boundary.
10. **Benchmark coverage:** SAP or other enterprise benchmark capabilities can map into the domain without dictating its semantics.

## Possible outcomes

Revalidation may:

- retain a candidate domain unchanged;
- rename it to reflect clearer business semantics;
- split it because it contains materially different invariants;
- merge it because the supposed boundary creates artificial hand-offs;
- designate part of it as a cross-cutting platform service rather than a business domain.

The number **19 is not a target**. The target is the smallest coherent set of native ownership boundaries that can support all 29 functions and 353 validated sub-functions without semantic duplication.

## User-experience rule

Even after native domains are approved, users should work through contexts such as organisation, customer, supplier, opportunity, contract, project, site, property, asset, work order and personal work queue. Domain boundaries govern ownership behind the experience; they do not define a 19-item application menu.
