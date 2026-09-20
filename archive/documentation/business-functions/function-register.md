# Canonical Enterprise Function & Workspace Register

**Status:** V3 baseline tenant workspace taxonomy  
**Source treatment:** revalidated from the prior NuBlox business taxonomy; no legacy application structure is inherited by this register.

The 29 functions describe **what the enterprise must be able to do** and each function is also a **stable first-class workspace within the tenant application**.

They are user-facing navigation and work-context boundaries, but they are **not** independent applications, database schemas or data-ownership silos. Underlying capabilities and canonical business objects may support several workspaces while remaining governed by one authoritative model.

| ID | Tenant workspace / enterprise function | Purpose |
| --- | --- | --- |
| F01 | Strategy & Enterprise Planning | Set direction, translate strategy into funded plans and govern strategic outcomes. |
| F02 | Corporate Governance | Govern authority, policy, decisions, ethics and accountable enterprise actions. |
| F03 | Enterprise Performance Management | Measure performance, explain variance and drive corrective decisions. |
| F04 | Corporate Development & M&A | Identify, evaluate, execute and integrate acquisitions, divestitures and partnerships. |
| F05 | Product, Service & Innovation Management | Create, launch, improve and retire products and services through a controlled lifecycle. |
| F06 | Marketing & Brand | Understand markets, build demand and convert engagement into qualified opportunities. |
| F07 | Sales & Commercial Management | Develop accounts, win profitable work and convert commitments into governed revenue. |
| F08 | Customer Service, Experience & Success | Onboard, support, retain and recover customer value through controlled service. |
| F09 | Procurement & Supplier Management | Source and manage suppliers and preserve procurement-to-payment traceability. |
| F10 | Demand, Supply Chain & Logistics | Plan and move materials from demand through stock, logistics and delivery. |
| F11 | Manufacturing / Production Operations | Plan, execute and control production with material, labour, quality and cost traceability. |
| F12 | Service Delivery & Field Operations | Plan, dispatch, execute and evidence professional and field services. |
| F13 | Quality Management | Plan, assure, control and continuously improve quality with attributable evidence. |
| F14 | Finance, Accounting, Treasury & Tax | Control accounting and cash consequences and produce traceable financial reporting. |
| F15 | Human Resources / Human Capital | Plan, acquire, develop, deploy, pay and retain a competent workforce. |
| F16 | Information Technology | Govern and operate technology services, platforms, assets and changes reliably. |
| F17 | Data, Analytics & AI | Govern data and intelligence from source through trusted analytics and AI. |
| F18 | Cybersecurity & Information Security | Prevent, detect, respond to and assure information-security risks. |
| F19 | Legal & Corporate Secretariat | Manage legal obligations, agreements, corporate records and disputes. |
| F20 | Risk, Compliance, Internal Control & Audit | Identify risk, operate and test controls, manage compliance and assurance. |
| F21 | Privacy & Information Governance | Govern personal information, privacy obligations, rights and retention. |
| F22 | Property, Facilities & Physical Assets | Acquire, operate, maintain, optimise and dispose of property and physical assets. |
| F23 | Health, Safety, Environment & Sustainability | Protect people and environment and improve sustainability performance. |
| F24 | Business Continuity, Crisis & Physical Security | Prepare for disruption, coordinate crises and protect people and operations. |
| F25 | Communications, Public Affairs & Investor Relations | Manage corporate narrative, stakeholders, reputation and investor communications. |
| F26 | Knowledge, Document & Records Management | Create, control, retain, find and reuse trusted organisational knowledge and records. |
| F27 | Portfolio, Programme & Project Management | Select, plan, resource, execute, control and close projects predictably. |
| F28 | Change & Transformation Management | Move the organisation from current to target state and realise measurable benefits. |
| F29 | Business Process & Continuous Improvement | Design, govern, automate and continuously improve enterprise processes. |

## Required V3 depth

The prior taxonomy contained 353 L2 sub-functions and 1,510 source activities. The V3 architecture baseline now preserves and maps that full depth. Every source activity has been routed into the 29-workspace model against a frozen aggregate, canonical semantic object focus and governed action classification. The revalidation criteria remain:

- clear business meaning;
- duplication or overlap;
- construction/built-environment relevance;
- correct function/workspace placement;
- native capability ownership;
- end-to-end workflow relationships;
- accountable roles, permissions and controls;
- canonical records and evidence;
- measurable evidence of completion.

Current architecture result: **29/29 workspaces, 353/353 L2 sub-functions and 1,510/1,510 source activities mapped**, with zero unmapped/ambiguous L2 routes, zero unknown semantic objects and zero invalid write placements.

Every L2 sub-function has one primary workspace home. Cross-workspace visibility or action is allowed where the business process requires it, but the underlying record or process state must not be duplicated. This architecture result does not claim the corresponding workflows, permissions or UI surfaces are already implemented.

The V3 function IDs are therefore also the stable workspace IDs. Underlying implementation technology, service boundaries or component structure may evolve without changing them.
