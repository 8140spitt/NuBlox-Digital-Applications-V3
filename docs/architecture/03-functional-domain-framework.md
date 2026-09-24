# 03 — Functional Domain Framework

**Status:** Governing functional architecture  
**Effective:** 20 September 2026

## Purpose

NuBlox has one canonical **Function** concept.

The baseline includes **29 Core Business Functions (F01–F29)**. Industry Solutions may add classified Functions; Construction & Built Environment adds **16 CBE Functions (D01–D16)**.

A Function is not merely a screen, department or mini-application. It is a governed organisational capability operating on the common Enterprise Kernel and Native Work-Delivery Runtime.

## Each function contains

Every function must define:

- purpose and mandate;
- scope and boundaries;
- accountable ownership;
- policies, standards and procedures;
- processes, activities and tasks;
- native tools and workspaces;
- controlled object and Deliverable types;
- lifecycle, workflow and Change rules;
- participating Job Profiles;
- competence requirements;
- Decision rights and delegated Authority;
- assurance and evidence requirements;
- KPIs/KRIs and performance measures;
- audit/retention requirements;
- deployment rules.

## Functional operating chain

~~~text
Govern
  -> Define
    -> Deploy
      -> Execute
        -> Produce
          -> Control
            -> Assure
              -> Evidence
                -> Improve
~~~

## Functional Governance

Functional Governance answers:

> How is this capability controlled so the enterprise can rely on its work and outputs?

Governance may include:

- Functional Owner;
- governance body;
- policy;
- standards;
- methods/procedures;
- process architecture;
- controlled types/classifications;
- templates;
- competence standards;
- authority thresholds;
- Segregation of Duties;
- assurance requirements;
- control evidence;
- KPIs/KRIs;
- retention;
- governed Change route.

Governance itself is versioned and controlled.

## Functional Delivery

Functional Delivery answers:

> What does this capability do and what outcomes does it produce?

A function may provide:

- business services;
- processes;
- transactions;
- analysis/calculation;
- planning;
- specialist authoring;
- inspections/tests;
- coordination;
- review;
- Decision;
- approval;
- exception/corrective action;
- report/KPI;
- Managed Output / Deliverable Item;
- handoff to another function.

~~~text
Function
-> Process
-> Activity
-> Task / Assignment
-> Business Object / Deliverable / Transaction / Decision
-> Review / Approval
-> Handoff
-> Outcome
~~~

## Position-to-Function assignment and work context

The primary organisational assignment answers:

> Which Function does this occupied Position operate in, and is its purpose Functional Governance or Functional Delivery?

~~~text
Person
-> Employment
-> occupied Position
-> Function assignment
   -> FUNCTIONAL_GOVERNANCE
   or
   -> FUNCTIONAL_DELIVERY
-> reporting hierarchy / management scope
-> authorised work and tools
~~~

This assignment establishes the user's primary Function world. It is not a Permission grant and it is not business Authority.

Projects, Contracts, Packages, Sites, Assets, Services and other Contexts then qualify **where or for what subject** the Position performs particular work. A separate contextual assignment may exist where responsibility, capacity or effectivity must be governed for that context; it is not required merely to make the Person a member of their primary Function.

## Separation of concepts

A **Function** describes governed organisational capability.

A **Department / Organisation Unit** describes organisational structure.

A **Job Profile** describes reusable governed expectations for work a Person may perform.

A **Position** is an organisational seat.

A **Person** is a Party.

A **Position-to-Function assignment** binds the Position to its primary Function and Governance/Delivery purpose. A **contextual work assignment** may additionally bind responsibility to a Project, Contract, Site, Asset, Service or other Context.

A **Permission** controls access/action.

An **Authority** controls what the Person is authorised to decide/commit within scope.

None is interchangeable with another.

## Job Profile participation

A Job Profile may participate in multiple functions.

Relationship modes may include:

- PRIMARY;
- DELIVERY;
- GOVERNANCE;
- ASSURANCE;
- SUPPORT.

A Job Profile is not forced into one function merely to simplify navigation.

## Function workspaces

Core Business and CBE Functions use the same workspace model. F01–F29 are the baseline Core Business set; D01–D16 are CBE-classified Functions supplied by the Industry Solution.

A function workspace:

- is the primary functional user destination;
- contains its sub-functions and queues;
- surfaces relevant canonical objects, Work, Decisions, evidence and KPIs;
- composes shared/native tools;
- participates in cross-functional workflows.

This does **not** create 29 independent applications, databases, schemas or canonical masters.

## Native tools

A function may compose:

- shared kernel tools;
- cross-domain tools;
- function-specific tools;
- Industry Solution tools;
- connected specialist authoring tools.

A connected specialist tool does not remove NuBlox's responsibility for governing the required output, responsibility, review, Decision, issue, acceptance and evidence.

## Cross-functional operation

Real business processes cross workspace boundaries.

Examples include:

- lead-to-contract;
- recruit-to-deploy;
- procure-to-pay;
- design-to-approved-information;
- change-to-implemented-configuration;
- valuation-to-payment;
- incident-to-corrective-action;
- asset-defect-to-maintenance-completion.

Processes preserve end-to-end context while functions contribute governed capability.

## Function acceptance test

For every function NuBlox must be able to answer:

- What is the function for?
- What is in/out of scope?
- Who owns it?
- Which policies/standards govern it?
- Which processes/tasks does it perform?
- Which native tools support the work?
- Which canonical objects does it use?
- Which outputs/Deliverables does it produce?
- Which Job Profiles participate?
- What competence and Authority are required?
- Which Positions are assigned to the Function for Governance and Delivery, and which work contexts refine their responsibility?
- Which Decisions/approvals control it?
- What evidence is required?
- How is performance measured?
- How is the function changed and assured?

If these answers cannot be represented and executed, the function is not complete.
