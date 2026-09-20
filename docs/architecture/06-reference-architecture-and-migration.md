# 06 — Reference Architecture & Migration

External enterprise products are **reference architectures, benchmarks, integration endpoints and migration sources/targets**.

They do not define NuBlox's product architecture.

## Reference method

For each external platform:

1. decompose its capabilities;
2. identify the underlying enterprise concepts;
3. identify useful control patterns and object semantics;
4. identify product-boundary limitations;
5. map the concepts to NuBlox canonical objects and runtimes;
6. decide whether NuBlox natively implements, extends, integrates, ingests, synchronises or migrates the capability;
7. preserve source-system identity and provenance where migration or federation requires it.

## Windchill

PTC Windchill is a major reference for:

- master / revision / iteration semantics;
- typed controlled objects;
- lifecycle and workflow;
- product and document structures;
- change management;
- baselines and configuration;
- effectivity;
- controlled content and representations;
- contexts, teams and access control; and
- publication and CAD/PLM integration.

These ideas are redesigned as NuBlox capabilities inside the Enterprise Kernel and relevant domains. **Windchill is not NuBlox's parent architecture or operating foundation.**

## Wider benchmark set

NuBlox should also be tested against relevant capabilities from ERP, EAM, PPM, CDE, BIM, ITSM, CRM, HCM and analytics platforms including SAP, Oracle, IFS, Autodesk, Bentley, Procore, Aconex, ServiceNow and Microsoft ecosystems.

Benchmarking informs capability completeness; it does not dictate NuBlox boundaries.
