# Windchill Reference Map

## Status

**Reference architecture / benchmark / migration source. Not a NuBlox foundation layer.**

## Concepts to retain and redesign

| Windchill concept family | NuBlox treatment |
|---|---|
| Master / Revision / Iteration | Kernel version/configuration semantics |
| WTDocument / EPMDocument style controlled information | Typed Information Containers and domain objects |
| Product structures | Canonical Item/System/Asset structures and governed relationships |
| Lifecycle | Shared Lifecycle runtime |
| Workflow | Shared Workflow runtime |
| Change objects | Shared Change runtime with domain-specific change types |
| Baselines | Shared Baseline and Configuration runtime |
| Effectivity | Shared Effectivity semantics |
| Contexts / teams / roles | Organisation, operating context, deployment and authority model |
| Content / representations | Information and Representation services |
| Publication | Representation/publication services |
| CAD integration | Connected-authoring adapters |
| Access control | Contextual authority and access policy |
| Packages / collections | Governed collections, transmittals and exchange packages |

## Improvement direction

NuBlox extends beyond PLM boundaries by integrating the same controlled object graph with enterprise functions, commercial operation, people and competence, work execution, project/asset delivery, physical outcomes and assurance evidence.
