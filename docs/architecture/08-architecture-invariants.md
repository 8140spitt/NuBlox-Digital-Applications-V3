# 08 — Architecture Invariants

**Status:** Mandatory architecture constraints  
**Effective:** 20 September 2026

These rules are architectural constraints, not implementation preferences.

1. **NuBlox is the product.** External platforms do not define NuBlox product boundaries.
2. **Construction & Built Environment is an Industry Solution.** It is not the whole NuBlox platform.
3. **One canonical enterprise object graph.** Functional Domains and Industry Solutions do not create competing masters.
4. **Function != department != application silo.**
5. **The 29 Functions are stable workspaces, not 29 independent products/databases.**
6. **Function is universal. Core Business and CBE are Function families, not competing capability entity types.**
7. **Job Profile != Person != Position != Project Role != access role != Permission != Authority.**
8. **Responsibility != Permission.**
9. **Assignment != Authority.**
10. **Employment/engagement != Position-to-Function assignment != contextual assignment.**
11. **A separate contextual Deployment is not required merely to establish a Person's primary Function world.**
12. **Position reporting hierarchy may extend management scope but does not transfer ownership of subordinate records.**
13. **Work Item != domain truth.**
14. **Deliverable Requirement != Deliverable Item.**
15. **Deliverable Item != file.**
16. **Deliverable Item != Information Container.**
17. **Information Container != physical Item/System/Asset.**
18. **Business transaction != PDF Representation.**
19. **Master identity != Revision != Iteration.**
20. **Representation != authoritative source object.**
21. **Workflow != Lifecycle.**
22. **Workflow != business object.**
23. **Lifecycle != Change Authority.**
24. **Review != Approval.**
25. **Approval != release/issue.**
26. **Release/issue != Acceptance.**
27. **Decision Evidence != domain state transition.**
28. **Baseline != folder.**
29. **Configuration != current file revision.**
30. **Baseline, Configuration and Effectivity are explicit controlled concepts where required.**
31. **Organisation context != Product/System structure.**
32. **Project context != Organisation Unit.**
33. **Generated Representations do not replace governed structured/controlled source identity.**
34. **Every material state-changing command must be attributable and auditable.**
35. **Permission denial must produce a controlled business/user outcome, not an unhandled server failure.**
36. **A supported NuBlox capability must be executable natively inside NuBlox.**
37. **No external application may be required to create, edit, approve, transact, control or complete NuBlox work.**
38. **External products are benchmarks or migration/import/export boundaries, not runtime components of the NuBlox operating model.**
39. **External source object != canonical NuBlox identity.**
40. **Migration preserves source semantics and provenance; it does not flatten controlled object history into files.**
41. **After governed cutover of a supported capability, NuBlox is the authoritative operational system for that capability.**
42. **Industry Solutions configure and extend the platform; they do not fork the Enterprise Kernel.**
43. **Reference architectures inform what NuBlox builds natively; they do not become NuBlox.**
44. **Core Business Functions, CBE Functions and their Job Profiles resolve through shared native runtimes rather than isolated or externally hosted applications.**
45. **Native authoring is part of the unified platform obligation wherever authoring is required to perform a supported job.**
46. **Validation Rule != Workflow.**
47. **Validation Rule != Lifecycle transition.**
48. **Conversation != Work Item.**
49. **Comment != Decision.**
50. **Subscription != Permission.**
51. **Reference Collection != authoritative containment.**
52. **Cross-Context Reference != context hierarchy.**

Any implementation that violates an invariant requires an explicit architecture decision before it can be accepted.
