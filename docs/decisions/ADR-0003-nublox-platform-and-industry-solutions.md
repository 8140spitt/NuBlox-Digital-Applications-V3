# ADR-0003 — NuBlox Is the Enterprise Platform; Construction Is an Industry Solution

**Status:** Accepted, partially superseded by ADR-0006  
**Date:** 20 September 2026

## Context

NuBlox V3 began by modelling the Construction & Built Environment solution in depth.

That work established:

- 29 enterprise functions;
- 16 Construction & Built Environment delivery domains;
- 84 Job Profiles;
- functional governance, delivery and deployment;
- managed Deliverable Items;
- shared Work, Decision, authority, evidence and audit concepts;
- controlled object/lifecycle/change principles informed in part by the PTC Windchill architecture study.

As the architecture matured, wording in the Handbook continued to describe "NuBlox Construction & The Built Environment" as though it were the NuBlox product itself.

The Windchill study also risked being interpreted as the parent operating architecture.

Both interpretations are too narrow.

## Decision

**NuBlox is an Enterprise Operating Platform.**

The platform has four primary architectural layers:

1. **Enterprise Kernel** — canonical object graph, identity, organisation, authority, workflow, lifecycle, change, baselines, information, Decisions, evidence, events and audit.
2. **Functional Domains** — 29 governed enterprise functions with native capabilities and shared cross-domain processes.
3. **Native Work-Delivery Runtime** — deployment, assignments, work, Deliverable Items, transactions, review, Decision, approval, issue, acceptance and evidence.
4. **Industry Solutions** — sector-specific configuration built on the shared platform.

**NuBlox Construction & Built Environment is the first Industry Solution.**

PTC Windchill and other external products are reference architectures, benchmarks and migration/import/export sources or targets. They do not define the NuBlox platform boundary and are not runtime dependencies.

## Consequences

1. The product documentation must refer to NuBlox as the enterprise platform.
2. Construction & Built Environment documentation must be framed as an Industry Solution.
3. Shared concepts must reside in the Enterprise Kernel rather than be owned by the Construction solution.
4. The 29 functions are stable first-class tenant workspaces while sharing one Enterprise Kernel and canonical object graph.
5. The 16 Construction delivery domains and 84 Construction Job Profiles remain industry-specific composition structures.
6. Additional Industry Solutions can reuse the Kernel, functional framework and work-delivery runtime.
7. Windchill concepts may be adopted only after mapping them into NuBlox canonical semantics.
8. Windchill-specific object/container boundaries must not become NuBlox platform boundaries by default.
9. Migration architecture must preserve source semantics without making source schemas canonical.
10. Benchmarking other enterprise products is encouraged where it improves NuBlox capability design.

## Product hierarchy

~~~text
NuBlox Enterprise Operating Platform
|
+-- Enterprise Kernel
+-- Functional Domains
+-- Native Work-Delivery Runtime
+-- Industry Solutions
    +-- Construction & Built Environment
    +-- future industry solutions
~~~

## Function workspace decision

The 29 enterprise functions are first-class tenant workspaces.

Those workspaces operate on the shared NuBlox platform and are not independent applications, databases or industry-specific silos.

## Superseded interpretation

Any documentation stating or implying that:

- NuBlox Construction & Built Environment is the entirety of the NuBlox product; or
- Windchill is the NuBlox operating foundation;

is superseded by this decision.
