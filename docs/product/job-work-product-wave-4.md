# Job-to-Work-Product Wave 4 — Field, Trades, Utilities, Plant & Supply Work

**Status:** external-career decomposition wave complete  
**Date:** 20 September 2026  
**Scope:** forty-nine remaining National Careers Service construction/built-environment careers, 392 candidate Work Products  
**Register:** `priority-job-work-product-wave-4.csv`

## Purpose

Wave 4 closes the remaining external-career coverage across building trades, fit-out, building-services installation and maintenance, utilities and networks, plant and specialist operations, manufacturing/supply, rural/external works and support roles.

The governing test remains:

> **Can the person receive, execute, record, evidence and hand over the work they are employed to carry out?**

All mappings remain `candidate-revalidation`. Completing the external-career treatment does not mean every candidate Work Product is already implemented or professionally/statutorily validated.

## Wave 4 coverage

Wave 4 covers the 49 external careers not represented by Waves 1-3, including:

- building trades and fit-out;
- building-services installation and maintenance;
- retrofit and energy installation;
- utilities and network field work;
- plant and specialist operations;
- manufacturing and supply;
- rural/external works;
- property/facilities support;
- heritage craft and conservation;
- planning support.

Each role is decomposed into eight material candidate Work Products, giving **392 candidate Work Products**.

The four-wave position is now:

```text
Wave 1: 10 jobs / 118 candidate Work Products
Wave 2: 16 jobs / 165 candidate Work Products
Wave 3: 20 jobs / 200 candidate Work Products
Wave 4: 49 jobs / 392 candidate Work Products

Total:  95 job archetypes / 875 candidate Work Products
```

The total job-archetype count exceeds the 84 external careers because Waves 1-3 also include important internal/sector employment jobs such as Project Planner, Project Controls Manager, Project Accountant, Design Manager, Health & Safety Manager, Quality Manager, Environmental Manager, Asset Manager and Maintenance Planner.

---

# 1. External career coverage is now 84/84

Across Waves 1-4, every career in the imported National Careers Service construction/built-environment baseline now has an explicit candidate NuBlox treatment.

This closes the **external-market coverage lens** at candidate-decomposition level.

It does not close all Job Architecture work.

The 382 prior internal candidate Job Profiles remain a separate reconciliation problem because they are primarily function/sub-function-derived capability profiles rather than a proven employment-job catalogue.

---

# 2. Physical-work roles require a repeatable execution chain

The field/trade roles show a stable professional pattern:

```text
Task / Work Pack
  -> Pre-start / permit / controls
     -> Material / plant / tool allocation
        -> Physical execution
           -> Progress / usage evidence
              -> Inspection / test
                 -> Defect / exception
                    -> Completion / handover
```

The physical outcome itself is not a database object.

NuBlox must own or govern the surrounding instruction, context, resource identity, evidence, quality, exception and handover record.

This is how the system supports a bricklayer, roofer, pipe fitter, road worker or steel erector without pretending that software performs the physical craft.

---

# 3. Field/Mobile composition is a platform primitive, not a separate app

Wave 4 reinforces the need for a common Field/Mobile composition with:

- assigned work and location context;
- current approved information;
- permit/RAMS/control acknowledgement;
- labour, plant, materials and tools;
- measurements and quantities;
- photos/evidence;
- inspection/test criteria;
- defects/incidents/exceptions;
- offline-tolerant capture where required;
- completion and handover.

The composition must reuse canonical Project, Site, Work Package, Location, Asset, Material, Person and Party identities.

It must not create field-only shadow masters.

---

# 4. Building-services trades require asset continuity

Gas, HVAC, heat-pump, refrigeration, security, solar, insulation and access-system roles repeatedly require:

```text
Survey / diagnostic
  -> quote / scope
     -> equipment/component schedule
        -> work order
           -> installation / service
              -> test / commissioning
                 -> defect / parts
                    -> certificate / completion / asset history
```

This is more than service-ticket workflow.

The job experience must preserve:

- property/system/asset identity;
- installed configuration;
- serial/product traceability where material;
- readings/test results;
- technician/competence evidence;
- service history;
- certificate or formal completion output;
- next-maintenance consequences.

---

# 5. Utilities require spatial and as-built continuity

Gas-main, road and water-network work requires location truth from instruction through handover:

```text
Work Pack
  -> existing asset/location
     -> permit/control
        -> execution
           -> test
              -> reinstatement
                 -> as-built geometry
                    -> operational network record
```

The Map/Spatial Workspace therefore belongs in operational delivery, not only professional GIS work.

As-built evidence must update or relate to the governed network/asset identity rather than become an orphan drawing or file.

---

# 6. Plant and specialist operations need equipment history

Construction Plant Mechanic, Crane Driver, Lighting Technician, Quarry roles, Scaffolder and Steeplejack expose recurring needs for:

- allocation;
- pre-use/pre-start checks;
- utilisation/hours;
- configuration/status;
- inspection/test;
- defect/out-of-service state;
- maintenance or corrective action;
- shift/use handover.

The Plant/Asset history must survive project and work-package boundaries.

---

# 7. Manufacturing and supply connect commercial, inventory and quality

Builders' Merchant, Furniture Maker, Welder and Wood Machinist demonstrate that NuBlox must join:

```text
Product / requirement
  -> quote / order
     -> BOM / material
        -> stock / issue
           -> production / fabrication
              -> quality
                 -> finished item
                    -> delivery / invoice / handover
```

This chain crosses functions but remains one operational job experience.

---

# 8. Reuse must not erase professional meaning

Wave 4 deliberately uses repeatable Work-Product patterns.

That does **not** mean all field roles get one generic screen or one generic Work Product.

For example:

- a scaffold inspection is not an electrical test;
- a weld record is not a masonry progress record;
- a water-network as-built is not a decorating completion photo;
- a gas-service certificate is not a roofing handover.

NuBlox should reuse platform primitives while preserving domain semantics, required evidence, lifecycle, competence and downstream consequences.

---

# 9. J1 state after Wave 4

The external-career lens is now complete at candidate-decomposition level:

```text
National Careers Service baseline: 84 careers
Explicit candidate NuBlox treatment: 84 / 84

Combined Waves 1-4:
95 job archetypes
875 candidate Work Products
```

However, **J1 remains open**.

Its next gate is internal Job Profile reconciliation:

1. reconcile the 382 prior function-derived candidate Job Profiles against real employment-job archetypes;
2. decide which profiles are retained as employable jobs, composed into cross-functional jobs, or retained only as Functional-Role provenance;
3. replace generic expected-output wording with explicit Work Products;
4. map those Work Products to exact source activities;
5. identify exact predecessor/downstream handoffs;
6. prove that every approved internal Job Profile has a complete treatment.

Only then should J1 be declared complete and the whole catalogue advance systematically into J2 canonical/aggregate/lifecycle/authority mapping.
