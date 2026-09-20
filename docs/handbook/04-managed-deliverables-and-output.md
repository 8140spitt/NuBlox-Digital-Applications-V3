# 04 — Managed Deliverables & Business Output

## Why this is a core product capability

A business does not only run processes. Its people are employed to produce things.

NuBlox must know what is required, who is responsible, how it is created, what state it is in, when it is due, what must happen before it can be issued, who accepted it and what superseded it.

This applies to physical and design deliverables as much as financial or operational outputs.

## Managed Output

Managed Output is the umbrella concept for a material thing produced by the enterprise.

Examples include drawing, model, specification, calculation, schedule, programme, cost plan, estimate, contract, purchase order, invoice, inspection, test result, risk assessment, permit, decision, report, certificate and handover package.

The output is not necessarily a file.

## Deliverable Item

A Deliverable Item is a required, planned output with an identifiable obligation or need.

A Deliverable Item should carry, where relevant:

- immutable system identity and business/deliverable number;
- title and type;
- requirement source;
- project/programme/contract/package context;
- discipline and classification;
- responsible organisation and accountable Position;
- author, contributors, reviewers and approver;
- planned and required dates;
- lifecycle/status;
- revision/version/iteration;
- suitability/status code;
- dependencies;
- affected business objects;
- native structured object link;
- representations/files/models;
- comments and markups;
- review outcomes;
- issue/transmittal history;
- acceptance/rejection;
- supersession;
- retention/record status;
- complete audit and evidence history.

## Requirement to deliverable

Client, regulatory, contractual or internal requirement
-> deliverable requirement
-> deliverable schedule/register
-> responsible organisation / position
-> authoring
-> review
-> approval
-> issue
-> recipient review
-> acceptance / rejection / comments
-> revision / change
-> final record / handover

## Architectural example

An architect on Project Alpha is required to produce Ground Floor General Arrangement Drawing A-1001.

NuBlox should manage the requirement, project/package context, responsible architect/organisation, planned issue dates, current revision, authoring state, Revit/DWG/PDF or other representations, design review, comments/markups, suitability/status, approval, issue/transmittal, recipient response, superseded revisions, related model/specification/design change and final handover state.

The PDF is not the deliverable identity. It is one representation of it.

## Authoring modes

### Native

The output is created directly in NuBlox, for example a cost plan, risk register, inspection, purchase order, report or decision.

### Assisted

NuBlox is the authoring environment but uses templates, automation, calculations or AI assistance.

### Connected

The specialist content is authored in another application while NuBlox manages the enterprise deliverable.

Examples include Revit, AutoCAD, Tekla, Bentley, specialist engineering software, Primavera P6, Microsoft Project and specialist estimating/design tools.

### Ingested

An externally produced item is received and brought under NuBlox control.

## Deliverable schedules

NuBlox should support deliverable registers/schedules by enterprise/function, client, contract, programme, project, stage, discipline, work package, supplier/subcontract and asset/handover context.

The schedule should show planned versus actual production, review, issue and acceptance.

## Role examples

Architects produce drawings, models, schedules, specifications, reports and submissions.

Structural Engineers produce models, calculations, drawings, checks and reports.

Quantity Surveyors produce cost plans, estimates, valuations, payment assessments, cost reports, forecasts and final accounts.

Planners produce programmes, baselines, look-aheads, progress updates and delay analyses.

Buyers produce RFQs, tender events, comparisons, recommendations, awards and purchase orders.

Site Managers produce daily records, progress records, work instructions, completion records and site evidence.

Safety Inspectors produce inspection records, findings, evidence and corrective actions.

Project Managers produce project plans, reports, changes, risk/issue/decision records and closure packs.

## Structured output versus representation

A Cost Plan may be structured data with XLSX/PDF representations.

A Purchase Order may be a transaction with a PDF representation.

A Drawing may be authored in a connected design tool with RVT/DWG/PDF representations.

A Decision may be structured evidence without a traditional document.

NuBlox governs the business item first and its representations second.

## Product-completeness test

For any job or contractual requirement NuBlox should answer:

- What must be produced?
- Why is it required?
- Who is accountable?
- Who is producing it?
- When is it due?
- What is its current state?
- What revision/version is current?
- Where is the actual content?
- What reviews and approvals are required?
- What was issued, when and to whom?
- Was it accepted?
- What changed?
- What superseded it?
- What is the final record?
