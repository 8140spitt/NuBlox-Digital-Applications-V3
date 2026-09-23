# 08 — Architecture Invariants

**Status:** Mandatory architecture constraints  
**Effective:** 20 September 2026

These rules are architectural constraints, not implementation preferences.

1. **NuBlox is the product.** External platforms do not define NuBlox product boundaries.
2. **Construction & Built Environment is an Industry Solution.** It is not the whole NuBlox platform.
3. **One canonical enterprise object graph.** Functional Domains and Industry Solutions do not create competing masters.
4. **Function != department != application silo.**
5. **The 29 Functions are stable workspaces, not 29 independent products/databases.**
6. **Delivery Domain != Function.**
7. **Job Profile != Person != Position != Project Role != access role != Permission != Authority.**
8. **Responsibility != Permission.**
9. **Assignment != Authority.**
10. **Employment/engagement != Functional Deployment.**
11. **Work Item != domain truth.**
12. **Deliverable Requirement != Deliverable Item.**
13. **Deliverable Item != file.**
14. **Deliverable Item != Information Container.**
15. **Information Container != physical Item/System/Asset.**
16. **Business transaction != PDF Representation.**
17. **Master identity != Revision != Iteration.**
18. **Representation != authoritative source object.**
19. **Workflow != Lifecycle.**
20. **Workflow != business object.**
21. **Lifecycle != Change Authority.**
22. **Review != Approval.**
23. **Approval != release/issue.**
24. **Release/issue != Acceptance.**
25. **Decision Evidence != domain state transition.**
26. **Baseline != folder.**
27. **Configuration != current file revision.**
28. **Baseline, Configuration and Effectivity are explicit controlled concepts where required.**
29. **Organisation context != Product/System structure.**
30. **Project context != Organisation Unit.**
31. **Generated Representations do not replace governed structured/controlled source identity.**
32. **Every material state-changing command must be attributable and auditable.**
33. **Permission denial must produce a controlled business/user outcome, not an unhandled server failure.**
34. **A supported NuBlox capability must be executable natively inside NuBlox.**
35. **No external application may be required to create, edit, approve, transact, control or complete NuBlox work.**
36. **External products are benchmarks or migration/import/export boundaries, not runtime components of the NuBlox operating model.**
37. **External source object != canonical NuBlox identity.**
38. **Migration preserves source semantics and provenance; it does not flatten controlled object history into files.**
39. **After governed cutover of a supported capability, NuBlox is the authoritative operational system for that capability.**
40. **Industry Solutions configure and extend the platform; they do not fork the Enterprise Kernel.**
41. **Reference architectures inform what NuBlox builds natively; they do not become NuBlox.**
42. **The 29 Functions and 84 Construction Job Profiles resolve through shared native runtimes rather than isolated or externally hosted applications.**
43. **Native authoring is part of the unified platform obligation wherever authoring is required to perform a supported job.**
44. **Validation Rule != Workflow.**
45. **Validation Rule != Lifecycle transition.**
46. **Conversation != Work Item.**
47. **Comment != Decision.**
48. **Subscription != Permission.**
49. **Reference Collection != authoritative containment.**
50. **Cross-Context Reference != context hierarchy.**

Any implementation that violates an invariant requires an explicit architecture decision before it can be accepted.
