# Canonical Business Object Candidate Register — Generated Summary

**Generated from:** scripts/generate-business-object-register.mjs  
**Status:** discovery baseline — not yet canonical schema authority  

## Baseline counts

- Candidate object occurrences: **750**
- Exact unique names: **724**
- Exact duplicate-name groups requiring normalization: **26**
- Business-object discovery families: **29**

A repeated name across families is not automatically an error. It is a signal to decide whether the same canonical object is reused across contexts or whether the meanings are genuinely distinct and require different names.

## Candidate counts by family

| Family | Discovery family | Candidates |
| --- | --- | ---: |
| BOF-01 | Tenant, identity, party and enterprise structure | 20 |
| BOF-02 | Strategy, governance and enterprise performance | 20 |
| BOF-03 | Market, CRM, business development and customer | 17 |
| BOF-04 | Land, development, investment and property acquisition | 19 |
| BOF-05 | Estimating, measurement, tendering, proposals and sales | 23 |
| BOF-06 | Portfolio, programme, project and project controls | 30 |
| BOF-07 | Design, engineering, BIM and information management | 31 |
| BOF-08 | Contract, appointment and commercial management | 31 |
| BOF-09 | Procurement, supplier and subcontract sourcing | 28 |
| BOF-10 | Product, material, catalogue, inventory and logistics | 38 |
| BOF-11 | Manufacturing, fabrication and off-site production | 18 |
| BOF-12 | Site, field and construction operations | 26 |
| BOF-13 | Quality, health, safety, environment and assurance | 37 |
| BOF-14 | Building safety, regulatory control and statutory assurance | 15 |
| BOF-15 | Commissioning, completion, handover and closeout | 19 |
| BOF-16 | Property, estate, space, infrastructure and physical asset | 31 |
| BOF-17 | Maintenance, facilities, service, warranty and aftercare | 31 |
| BOF-18 | People, HCM, competence, time, payroll and expenses | 43 |
| BOF-19 | Finance, accounting, tax, treasury and enterprise performance | 46 |
| BOF-20 | Sustainability, carbon, energy, circularity and social value | 25 |
| BOF-21 | Enterprise risk, compliance, internal control and audit | 17 |
| BOF-22 | Legal, corporate secretariat, privacy and records obligations | 21 |
| BOF-23 | Business continuity, crisis and physical security | 15 |
| BOF-24 | IT, data, cyber, analytics and AI | 38 |
| BOF-25 | Knowledge, document/records management, communications and stakeholder engagement | 21 |
| BOF-26 | Organisation change, transformation and continuous improvement | 23 |
| BOF-27 | Shared work, workflow, decision and collaboration | 15 |
| BOF-28 | Evidence, audit, retention and legal traceability | 15 |
| BOF-29 | Reference data, classification and jurisdiction configuration | 37 |

## Provisional semantic classification

The semantic kind is generated heuristically to accelerate review; it is **not** authoritative until validated.

| Semantic kind | Count |
| --- | ---: |
| master / identity | 354 |
| controlled information | 71 |
| plan | 51 |
| relationship | 44 |
| event / evidence | 36 |
| asset / technical object | 36 |
| transaction | 36 |
| projection / measure | 31 |
| case | 27 |
| work / execution | 23 |
| reference / classification | 23 |
| configuration / policy | 15 |
| ledger / posting | 3 |

## Review sequence

1. Normalize duplicate names and obvious aliases.
2. Separate root identities from children, relationships, events, versions and projections.
3. Establish the core identity graph: party/person/organisation, enterprise structure, project/programme, spatial/location, contract, information container, product/material and physical asset.
4. Define lifecycle and version semantics by object family rather than using one universal status model.
5. Map each surviving object to F01–F29 workspaces, whole-life lifecycle stages and end-to-end process chains.
6. Validate permissions, delegated authority, audit/evidence, retention and commercial/accounting consequences.
7. Promote only reviewed concepts from **candidate** to **validated** and then **canonical**.
