# 08 — Architecture Invariants

These rules are architectural constraints, not implementation preferences.

1. **NuBlox is the product.** External platforms do not define NuBlox boundaries.
2. **One canonical enterprise object graph.** Functional domains do not create competing masters.
3. **Function ≠ department ≠ application context.**
4. **Job Profile ≠ Person ≠ Position ≠ Role ≠ Permission ≠ Authority.**
5. **Assignment ≠ authority.**
6. **Work Item ≠ domain truth.**
7. **Deliverable Item ≠ file.**
8. **Information Container ≠ Deliverable Item.**
9. **Master identity ≠ revision ≠ iteration.**
10. **Workflow ≠ lifecycle.**
11. **Lifecycle ≠ change authority.**
12. **Decision evidence ≠ domain state transition.**
13. **Baseline and configuration are explicit controlled concepts where required.**
14. **Industry solutions configure the platform; they do not fork its kernel.**
15. **Every material state-changing command must be attributable and auditable.**
16. **Integration never silently transfers system-of-record ownership.**
17. **Generated representations do not replace the governed identity of structured or controlled source objects.**
18. **The 29 functions and 84 Construction job profiles must resolve through shared runtimes, not become isolated applications.**
