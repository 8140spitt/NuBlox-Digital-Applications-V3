# 05 — NuBlox Construction & Built Environment

**Status:** Governing first Industry Solution architecture  
**Effective:** 20 September 2026

## Product position

Construction & Built Environment is the first Industry Solution on the NuBlox platform.

It is **not** the boundary of the NuBlox product.

It applies the shared Enterprise Kernel, 29 governed Functions and Native Work-Delivery Runtime to organisations that design, develop, construct, manufacture, manage, operate and maintain the built environment.

## Industry configuration

The solution introduces:

- 16 Construction & Built Environment professional Functions (D01–D16);
- 84 governed Job Profiles;
- construction-specific Project, Contract and Package structures;
- Sites, Facilities, Systems, Spaces and Assets;
- design and technical information;
- construction production and field records;
- inspections, testing and commissioning;
- commercial and contractual Deliverables;
- handover and Asset-information Requirements;
- industry-specific classifications;
- lifecycle/workflow templates;
- competence and qualification rules;
- regulatory and assurance Evidence.

## 16 CBE Functions / professional domains

ADR-0006 makes Function the universal organisational capability concept. The 16 CBE professional domains are therefore CBE-classified Function definitions (D01–D16) that group the 84 Job Profiles into recognisable sector capability areas. The legacy `delivery_domains` representation is a compatibility/industry-composition projection, not a second capability master.

They are composition structures used for:

- professional/trade capability;
- terminology;
- typical process participation;
- competence requirements;
- typical native NuBlox tools;
- typical work products;
- likely deployment contexts.

They are not:

- 16 applications;
- 16 databases;
- access-control boundaries;
- a second capability type competing with the Function model.

## 84 Job Profiles

The 84-job catalogue is a governed Industry Solution capability catalogue.

A Job Profile can define:

- purpose;
- responsibilities;
- capability;
- competence/skill;
- qualification where applicable;
- process participation;
- typical work products;
- native NuBlox tool needs;
- assurance responsibilities;
- Authority expectations.

A Job Profile is not a Person.

A Position may reference a Job Profile.

A Person may occupy a Position.

That Person may be deployed differently across Projects, Contracts, Packages, Sites, Systems or Assets.

## Core Business / CBE Function intersection

Core Business Functions and CBE Functions are complementary families in the same universal Function model.

Examples:

- Architecture & Design intersects Project Management, Quality, HSE, Information Management, Commercial and other Functions.
- Commercial / Contracts / Cost intersects Finance, Legal, Procurement, Project Management and Governance.
- Building Trades intersect Project Management, HSE, Quality, Materials/Procurement, resource management and Commercial controls.
- Asset Operations intersect Asset/Facilities Management, Finance, Procurement, HSE, Quality and Service Management.

A Job Profile can have a primary CBE Function while participating in multiple Core Business Functions and cross-Function processes.

## Construction operating contexts

The Industry Solution must support runtime contexts such as:

- Portfolio;
- Programme;
- Opportunity;
- Tender;
- Project;
- Contract;
- Appointment;
- Work Package;
- Site;
- Building / Facility;
- Zone;
- Level;
- Space;
- System;
- Asset;
- production/fabrication order;
- service/maintenance context.

## Representative managed outputs

### Design / technical

- drawing;
- model;
- calculation;
- specification;
- schedule;
- design Decision;
- survey;
- technical submission;
- RFI response;
- design review record.

### Commercial / contractual

- estimate;
- cost plan;
- BoQ;
- tender return;
- Contract;
- instruction;
- variation;
- valuation;
- payment certificate;
- final account.

### Procurement / supply

- requisition;
- RFQ;
- Purchase Order;
- material submittal;
- delivery record;
- goods receipt;
- material traceability record.

### Production / fabrication

- BOM;
- fabrication drawing;
- cut list;
- production order;
- weld record;
- manufactured component;
- inspection result.

### Site delivery

- Work Package;
- controlled work information/method;
- installed work;
- progress Evidence;
- permit;
- inspection;
- test;
- non-conformance;
- corrective action.

### Commissioning / handover

- commissioning plan;
- test result;
- commissioning record;
- O&M information;
- training record;
- as-built information;
- Asset information;
- handover certificate.

### Operations / maintenance

- Asset record;
- Work Order;
- defect;
- condition assessment;
- inspection;
- maintenance history;
- statutory/compliance Evidence;
- service report.

## Unified work experience

For every one of the 84 Job Profiles, the operative tools required to perform the supported job must be provided natively by NuBlox.

An architect must not need a separate PLM/CDE/BIM application to perform the NuBlox-managed job. A quantity surveyor must not need a separate commercial system. A planner must not need a separate planning platform. Finance, HR, procurement, quality, HSE, project controls, asset management and the other supported functions follow the same rule.

External files and datasets may be imported or exported where business exchange requires them, but the user's governed work remains inside NuBlox.

## Information-to-physical continuity

The Industry Solution must preserve continuity across technical definition and physical delivery.

~~~text
Requirement
-> Deliverable Requirement
-> Deliverable Item
-> design / technical definition
-> approved / released Configuration
-> procurement / fabrication / construction
-> delivered material / product
-> installed component / System
-> inspection / test / commissioning
-> as-built information
-> handover
-> operational Asset
-> maintenance / Change history
~~~

A drawing is not an installed Asset.

A model is not the physical System.

An inspection record is not the installed work.

The objects are related, not conflated.

## Example deployment

~~~text
Architect Job Profile
-> Position
-> Person occupancy
-> CBE Function assignment (Governance or Delivery)
-> Project Alpha contextual assignment
-> Design Package A
-> defined stages/scope
-> competence / Authority
-> assigned drawings/models/specifications
-> review/approval obligations
-> issue/acceptance
~~~

The same pattern applies across all 84 Job Profiles.

## Industry-solution acceptance test

For each Job Profile NuBlox must answer:

- What is the job expected to do?
- Which Core Business and CBE Functions does it participate in?
- What competence is required?
- In which Project, Contract, Package, Site, System or Asset contexts can its work be assigned?
- What native NuBlox tools are needed?
- What Work is assigned?
- What outputs does it produce?
- Which controls, reviews and Decisions apply?
- How does the work affect Project, Contract, cost, programme, quality, safety, Configuration and Asset truth?
- What Evidence proves the work was completed correctly?

The Industry Solution is complete only when real people can perform the jobs represented by their Position and Job Profile, in the required Function and work context, through the NuBlox operating model.
