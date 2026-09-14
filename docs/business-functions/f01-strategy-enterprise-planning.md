# F01 — Strategy & Enterprise Planning

**Status:** Governing V3 workspace specification  
**Workspace ID:** `F01`  
**Tenant surface:** first-class enterprise-function workspace  
**Purpose:** define the organisation's direction, operating model, plans and performance so that long-term value can be governed and achieved.

## 1. Workspace outcome

F01 provides one controlled place for an organisation to formulate strategy, understand its external environment, convert strategic choices into approved plans, define the target operating model, monitor strategic performance, conduct formal reviews and explore future scenarios.

The workspace must preserve a continuous evidence chain from assumptions and analysis through decisions, plans, approvals, published strategy, performance, review and subsequent change.

F01 is a tenant workspace, not an isolated application. It consumes and references canonical organisation, people, finance, portfolio, project, risk, performance and document records owned across NuBlox while preserving one authoritative version of each business fact.

## 2. Canonical workspace anatomy

The F01 landing surface follows the V3 function-workspace grammar:

1. **Workspace identity** — F01, name, purpose, tenant and current organisational context.
2. **Objects summary** — the principal F01 business objects and their current states.
3. **Eight L2 work areas** — stable sub-function entry points.
4. **Business process** — the current strategy lifecycle and user journey.
5. **Work requiring attention** — drafts, reviews, approvals, overdue actions and exceptions.
6. **Performance** — strategic KPIs, variance and drill-through.
7. **Evidence** — decisions, versions, approvals, assumptions, comments and audit history.
8. **Supporting services** — lifecycle, workflow, permissions, version control, evidence and integration services.

The architecture diagram may display all layers together; the production UI must progressively disclose detail rather than render every layer fully expanded at once.

## 3. F01 sub-functions

The eight L2 sub-functions are the stable primary work areas inside the F01 workspace.

| ID | V3 workspace label | Source business meaning | Core outcome |
| --- | --- | --- | --- |
| `F01.01` | Strategy Framework | Vision & purpose | Establish the organisation's strategic identity, purpose, vision, mission and governing strategic framework. |
| `F01.02` | External Environment | Environmental analysis | Maintain evidence-based understanding of markets, competitors, economic, technology and regulatory conditions. |
| `F01.03` | Strategy | Strategic planning | Define objectives, evaluate choices and scenarios, select strategy and establish strategic priorities. |
| `F01.04` | Business Plan | Business planning | Translate approved strategy into funded, owned, time-bound business plans and initiatives. |
| `F01.05` | Operating Model | Operating model | Define the organisational capabilities, structures, accountabilities and delivery model required by strategy. |
| `F01.06` | Performance | Goal & KPI management | Define strategic measures and targets, monitor performance, explain variance and initiate corrective action. |
| `F01.07` | Review | Strategic review | Conduct governed strategy reviews, challenge assumptions, assess progress and approve changes. |
| `F01.08` | Scenario & Foresight | Scenario & foresight planning | Model plausible futures, sensitivities and contingencies to improve strategic resilience and decision quality. |

### F01.01 — Strategy Framework

**Activities:**

- define purpose;
- define vision;
- establish mission;
- define strategic principles and value thesis;
- communicate direction;
- review continuing relevance.

**Primary records:** strategy framework, purpose statement, vision, mission, strategic principles, strategic themes, approval record, published version.

### F01.02 — External Environment

**Activities:**

- monitor economic conditions;
- assess markets and sectors;
- analyse competitors;
- analyse technology trends;
- analyse regulatory environment;
- identify opportunities and threats;
- maintain insights and source evidence.

**Primary records:** environmental assessment, PESTLE assessment, market analysis, competitor assessment, industry trend, regulatory observation, opportunity/threat, insight, source reference.

### F01.03 — Strategy

**Activities:**

- define strategic objectives;
- develop strategic options;
- evaluate choices and trade-offs;
- evaluate scenarios;
- select strategy;
- establish strategic priorities;
- document dependencies and strategic risks.

**Primary records:** strategy, objective, strategic option, strategic theme, strategic choice, value driver, dependency, strategic risk/opportunity, decision record.

### F01.04 — Business Plan

**Activities:**

- create enterprise and business-unit plans;
- define initiatives;
- establish financial plan;
- establish resource plan;
- define delivery roadmap;
- assign ownership;
- identify expected benefits;
- approve and publish plans.

**Primary records:** business plan, planning period, initiative, roadmap item, financial plan reference, resource plan reference, benefit, owner assignment, approval, published plan version.

### F01.05 — Operating Model

**Activities:**

- assess current state;
- define target state;
- define organisational capabilities;
- design organisational structures;
- determine centralisation/decentralisation;
- establish shared-service requirements;
- define accountabilities;
- identify change initiatives;
- approve target operating model.

**Primary records:** operating model, current-state assessment, target-state definition, capability, organisation-model reference, accountability, design principle, gap, change initiative, approval.

### F01.06 — Performance

**Activities:**

- define strategic KPIs;
- establish baselines;
- set targets;
- collect and validate performance data;
- monitor performance;
- analyse variance;
- initiate corrective action;
- publish strategic performance views and reports.

**Primary records:** KPI, measure definition, target, baseline, observation, variance, commentary, corrective action, performance report.

### F01.07 — Review

**Activities:**

- maintain review schedule;
- prepare review inputs;
- conduct strategy reviews;
- reassess assumptions;
- evaluate progress;
- record decisions and actions;
- reprioritise initiatives;
- approve strategy or plan changes;
- establish the next review cycle.

**Primary records:** review cycle, review meeting, agenda/input pack reference, finding, decision, action, change proposal, outcome, next-review date.

### F01.08 — Scenario & Foresight

**Activities:**

- develop scenarios;
- define assumptions;
- establish baseline scenario;
- model future conditions;
- model upside/downside cases;
- conduct sensitivity analysis;
- project KPI effects;
- develop contingency strategies;
- approve scenarios used in strategic decisions.

**Primary records:** scenario, scenario version, assumption, variable, projection, sensitivity, contingency, scenario comparison, approval.

## 4. Principal F01 objects

The F01 workspace exposes the following business concepts. These are conceptual objects; final domain ownership is governed separately by the canonical data model.

| Object | Purpose | Key lifecycle expectation |
| --- | --- | --- |
| Strategy framework | Governs purpose, vision, mission and strategic principles | Draft → Review → Approved → Published → Superseded |
| Environmental assessment | Evidence base for the strategy | Draft → Validated → Current → Superseded |
| Strategy | Governs selected direction and strategic priorities | Draft → Review → Approved → Published → Under review → Superseded |
| Strategic objective | Defines an intended strategic outcome | Proposed → Active → Achieved / Retired |
| Business plan | Converts strategy into an executable planning period | Draft → Review → Approved → Published → In execution → Closed / Superseded |
| Operating model | Defines how the organisation must operate to execute strategy | Draft → Review → Approved → Active → Superseded |
| KPI | Defines a controlled strategic measure | Draft → Approved → Active → Retired |
| Target | Defines expected performance for a KPI and period | Draft → Approved → Active → Closed / Superseded |
| Strategic review | Formal governance event for strategy and progress | Planned → In preparation → Held → Decisions recorded → Closed |
| Scenario | Controlled representation of a plausible future state | Draft → Reviewed → Approved → Current / Archived |
| Assumption | Explicit proposition used by a plan, strategy or scenario | Proposed → Accepted → Challenged → Revised / Retired |
| Strategic decision | Records authorised choices and rationale | Proposed → Decided → Implementing → Verified / Superseded |
| Strategic action | Records accountable follow-up arising from strategy or review | Open → In progress → Blocked → Complete / Cancelled |

## 5. Primary user journey

The high-level strategy lifecycle is:

`Develop → Submit → Review → Decide → Publish → Monitor → Review / Revise`

### 1. Develop

Authorised contributors create or revise strategic content across F01.01–F01.08. Work remains explicitly versioned and attributable.

### 2. Submit

A controlled version is submitted into the applicable review workflow. Submission freezes the review candidate while permitting a new working revision only through governed rules.

### 3. Review

Assigned reviewers examine content, assumptions, evidence, dependencies, risks and impacts. Review comments and requested amendments are attributable and retained.

### 4. Decide

An authorised decision-maker or governance body approves, returns for amendment, rejects or supersedes the proposal in accordance with delegated authority and approval rules.

### 5. Publish

The approved version becomes the effective strategic baseline. Publication records effective date, version, decision authority and superseded predecessor where applicable.

### 6. Monitor

Objectives, initiatives, KPIs, assumptions and external signals are monitored. Material variance or changed assumptions can trigger corrective actions, escalation or a formal review.

### 7. Review / Revise

Formal review determines whether the existing strategic baseline remains appropriate. Approved changes create a new controlled version; history is never overwritten.

## 6. Work queues

F01 must support role-sensitive queues rather than relying on users to search for work manually. At minimum:

- drafts requiring completion;
- items submitted for my review;
- decisions awaiting my authority;
- requested amendments awaiting response;
- overdue strategic actions;
- KPIs outside tolerance;
- assumptions requiring revalidation;
- reviews due or overdue;
- scenarios requiring approval;
- unpublished approved versions;
- material external changes requiring assessment.

## 7. Roles and responsibilities

V3 must not hard-code job titles into permission rules. Functional responsibilities are expected to include:

- strategy owner;
- strategy contributor;
- planning owner;
- business-unit plan owner;
- operating-model owner;
- KPI owner;
- data provider;
- reviewer;
- approver / delegated authority holder;
- governance body participant;
- read-only stakeholder;
- assurance / audit reviewer.

A tenant may map these responsibilities to its own positions and job architecture.

## 8. Permissions and authority

F01 authorisation must consider tenant, organisational scope, workspace permission, object responsibility, lifecycle state and delegated authority.

Minimum permission semantics include:

- view;
- create;
- edit working version;
- submit for review;
- review/comment;
- return for amendment;
- approve;
- reject;
- publish;
- supersede;
- manage KPI definitions;
- enter/validate performance observations;
- manage scenarios and assumptions;
- record decisions;
- close actions;
- view audit/evidence;
- administer workspace configuration.

Approval permission alone does not imply sufficient authority. Material decisions must also satisfy the applicable delegation-of-authority and governance rules.

## 9. Controls and evidence

Material F01 changes must retain:

- actor and effective organisational context;
- timestamp;
- prior and resulting state;
- prior and resulting version where applicable;
- rationale/comment where required;
- review evidence;
- approval/decision evidence;
- authority basis;
- supporting document or source references;
- linked assumptions;
- linked risks/opportunities;
- resulting actions;
- relationships to superseded records.

Published strategic records are immutable. Correction occurs through a controlled replacement or superseding version rather than silent mutation.

## 10. Cross-workspace relationships

F01 is intentionally cross-functional. Typical relationships include:

- **F02 Corporate Governance** — decision authority, governance bodies, policies and formal approvals;
- **F03 Enterprise Performance Management** — enterprise scorecards, variance and benefits;
- **F04 Corporate Development & M&A** — strategic investment, acquisition, divestiture and partnership choices;
- **F05 Product, Service & Innovation Management** — portfolio choices and investment priorities;
- **F14 Finance, Accounting, Treasury & Tax** — financial plans, funding constraints and actual financial performance;
- **F15 Human Resources / Human Capital** — workforce capacity, organisation design and strategic capability requirements;
- **F17 Data, Analytics & AI** — trusted metrics, models, external data and analytical methods;
- **F20 Risk, Compliance, Internal Control & Audit** — strategic risks, controls and assurance;
- **F27 Portfolio, Programme & Project Management** — initiatives, programmes, delivery roadmaps and benefits;
- **F28 Change & Transformation Management** — organisational change required by strategy and target operating model.

These relationships use references and governed commands; they do not justify duplicate records in F01.

## 11. Reporting and analytics

The F01 workspace should progressively provide:

- strategy-on-a-page / strategy map;
- objective and initiative status;
- KPI scorecard;
- target versus actual and variance;
- initiative/benefit progress;
- assumption health;
- strategic risk/opportunity exposure;
- scenario comparison;
- review decision and action status;
- plan execution health;
- operating-model change progress;
- drill-through from aggregate metrics to authoritative source records.

## 12. Integration and data

F01 must support controlled use of both internal and external information.

**Internal sources may include:** finance, projects, portfolio, CRM, supply chain, workforce, assets, HSE, quality, risk and operational performance.

**External sources may include:** market, economic, competitor, technology, regulatory and sector data.

Imported data never becomes trusted merely because it was integrated. Source, effective date, validation status and lineage must remain available for material strategic inputs.

## 13. Workspace UX requirements

The F01 landing view should communicate the operating structure without becoming a wall of controls.

Desktop experience should provide:

- persistent tenant application shell;
- visible F01 workspace identity and purpose;
- eight clear L2 entry points;
- concise status/exception summaries per work area;
- immediate visibility of work requiring the current user's attention;
- the current strategy lifecycle / review position;
- performance exceptions and major decisions;
- access to objects, evidence and history without placing all detail on the landing page.

The architecture reference image is therefore treated as a **workspace map**, not a requirement to reproduce every small box as permanently expanded production UI.

## 14. Definition of F01 complete

F01 is not complete merely because eight navigation cards exist. The workspace is complete only when:

1. all eight L2 work areas have governed records and workflows;
2. canonical object ownership is defined;
3. lifecycle transitions are enforced server-side;
4. role and authority rules are enforceable and tested;
5. submission, review, decision and publication are fully auditable;
6. versioning prevents silent alteration of approved strategy and plans;
7. KPI monitoring can trigger traceable action/review;
8. cross-workspace references preserve one authoritative business fact;
9. reporting drills through to source data and evidence;
10. empty, loading, blocked, denied, rejected, superseded and overdue states are designed;
11. accessibility and responsive behaviour meet the V3 design-system baseline;
12. automated tests prove permissions, lifecycle invariants, tenant isolation and critical user journeys.

## 15. Source revalidation note

The previous NuBlox taxonomy defined F01 as eight sub-functions: Vision & purpose, Environmental analysis, Strategic planning, Business planning, Operating model, Goal & KPI management, Strategic review, and Scenario & foresight planning. V3 retains that business coverage but uses the clearer workspace-facing labels defined in this specification.

The legacy application implementation is not inherited by this specification.