# 01 — Product & Enterprise Model

## Purpose

NuBlox exists to provide one operational environment for a construction and built-environment enterprise.

The product must support both:

1. **how the organisation operates**, and
2. **how the organisation delivers value to clients, users and asset owners**.

These streams share the same people, parties, projects, contracts, assets, information, decisions, evidence and financial consequences.

## Enterprise levels

NuBlox must work across multiple levels without duplicating truth:

```text
Tenant / Enterprise
  -> Legal Entity
  -> Organisation Unit
  -> Portfolio
  -> Programme
  -> Project / Job
  -> Contract / Appointment
  -> Package / Work Package
  -> Site / Property / Facility / Network
  -> System / Asset / Component
  -> Task / Work Item / Work Order
```

A record may be relevant to several levels, but it retains one canonical identity.

## Context

Context determines where the user is working and what is relevant.

Examples:

- legal entity;
- business unit;
- project;
- contract;
- site;
- property;
- asset;
- programme;
- accounting period.

Context is a filter and authority dimension. It is not another copy of the record.

## One enterprise truth

NuBlox follows the rule:

> **One concept, one canonical meaning.**

Examples:

- one Organisation identity reused as customer, supplier, subcontractor or consultant through relationships;
- one Project identity reused by programme, commercial, finance, information and HSE views;
- one Asset identity reused by commissioning, maintenance, finance and sustainability;
- one controlled Information Container reused as document evidence without becoming a substitute for structured business state.

## Business functions and workspaces

F01-F29 describe the enterprise capability model and provide stable workspace homes.

A workspace answers:

- what function is responsible;
- what work is currently active;
- which sub-functions apply;
- which canonical objects are relevant;
- which decisions and exceptions need attention;
- what performance and evidence should be visible.

A workspace does not own a private database.

## Native, assisted, connected and ingested work

A required work product can be produced in four ways.

### NATIVE

NuBlox owns the authoring experience, business semantics, lifecycle, evidence and canonical state.

### ASSISTED

NuBlox remains authoritative but may use assistance such as templates, automation, AI or specialist calculations.

### CONNECTED

A specialist external application performs part of the authoring or analysis while NuBlox governs the enterprise identity, handoff, approval and resulting controlled state.

Examples may include design authoring, advanced scheduling, estimating or specialist engineering tools.

### INGESTED

NuBlox receives external evidence or a completed deliverable and controls how it is classified, reviewed, accepted and retained.

## Product success

The product is successful when the organisation can answer, directly from NuBlox:

- What are we trying to achieve?
- What work are we committed to deliver?
- Who is responsible?
- What does each person need to do?
- What information and evidence support the current position?
- What has been approved, by whom and under what authority?
- What are the current cost, programme, quality, risk, safety and asset consequences?
- What needs attention next?
- What was the complete history of a material decision or outcome?
