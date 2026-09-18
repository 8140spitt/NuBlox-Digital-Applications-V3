import type { FoundationCanonicalizationDecision } from './foundation-canonicalization';

export const itemManufacturingCanonicalization: FoundationCanonicalizationDecision[] = [
  {
    candidateKey: 'BOF-10-004',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Item Specification',
    notes:
      'Governed revision/effectivity-controlled specification attached to canonical Item identity. Specification change never creates a duplicate Item master.'
  },
  {
    candidateKey: 'BOF-10-005',
    decision: 'RENAME',
    proposedCanonicalName: 'Item Variant',
    notes:
      'Governed variant/configuration of an Item family. Variant is not a serial instance or installed Asset.'
  },
  {
    candidateKey: 'BOF-10-006',
    decision: 'RELATIONSHIP',
    proposedCanonicalName: 'Item Substitution',
    notes:
      'Effective relationship between original and substitute canonical Items carrying conditions, approval and applicability.'
  },
  {
    candidateKey: 'BOF-10-007',
    decision: 'RELATIONSHIP',
    proposedCanonicalName: 'Manufacturer-Item Relationship',
    notes:
      'Links canonical manufacturer Party/Organisation to Item and manufacturer-specific identifiers without duplicate organisation/item masters.'
  },
  {
    candidateKey: 'BOF-10-008',
    decision: 'RELATIONSHIP',
    proposedCanonicalName: 'Supplier-Item Relationship',
    notes:
      'Links supplier Party to Item with supplier SKU, lead-time and ordering context. Supplier and Item identities remain canonical elsewhere.'
  },
  {
    candidateKey: 'BOF-10-009',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Catalogue',
    notes:
      'Governed commercial collection of canonical Items. Catalogue membership is an effective relationship rather than duplicated Item data.'
  },
  {
    candidateKey: 'BOF-10-010',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Price List',
    notes:
      'Effective-dated commercial price/rate definition. Historic transactions retain the actual rate applied.'
  },
  {
    candidateKey: 'BOF-10-011',
    decision: 'CHILD',
    proposedCanonicalName: 'Price / Rate Entry',
    notes:
      'Commercial Rate is a governed effective-dated entry within a Price List or other explicit commercial context, not a standalone Item master.'
  },
  {
    candidateKey: 'BOF-10-012',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-29-004',
    notes:
      'Item/logistics reuses the shared Unit of Measure reference definition from the reference-data family.'
  },
  {
    candidateKey: 'BOF-10-013',
    decision: 'RENAME',
    proposedCanonicalName: 'Bill of Material',
    notes:
      'Canonical product/material structure. BOM is distinct from WBS, schedule, Asset hierarchy and actual installed configuration.'
  },
  {
    candidateKey: 'BOF-10-014',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-10-001',
    notes:
      'Assembly is an Item role/type that may own a BOM; it does not require a parallel Assembly master.'
  },
  {
    candidateKey: 'BOF-10-015',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Lot',
    notes:
      'Traceable quantity identity tied to Item and provenance. Lot is not Item identity or installed Asset.'
  },
  {
    candidateKey: 'BOF-10-016',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Batch',
    notes:
      'Traceable production/process grouping with governed genealogy. Lot and Batch remain distinct where sector semantics require.'
  },
  {
    candidateKey: 'BOF-10-017',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Serial Identity',
    notes:
      'Unique traceability identity for an individual Item instance. Serial identity may later be referenced by an Asset but is not automatically an Asset.'
  },
  {
    candidateKey: 'BOF-11-001',
    decision: 'RENAME',
    proposedCanonicalName: 'Manufacturing Definition',
    notes:
      'Governed manufacturing configuration for producing an Item, linking BOM, process plan, resources and effectivity. It is not a second product master.'
  },
  {
    candidateKey: 'BOF-11-002',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-10-013',
    notes: 'Manufacturing Bill of Material reuses the canonical Bill of Material structure.'
  },
  {
    candidateKey: 'BOF-11-003',
    decision: 'CHILD',
    proposedCanonicalName: 'Manufacturing Routing',
    notes:
      'Routing is controlled structure within the Manufacturing Process Plan rather than a separate product identity.'
  },
  {
    candidateKey: 'BOF-11-004',
    decision: 'RENAME',
    proposedCanonicalName: 'Manufacturing Process Plan',
    notes:
      'Governed definition of manufacturing operation sequence, routing, work-centre requirements and standard execution parameters.'
  },
  {
    candidateKey: 'BOF-11-005',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Work Centre',
    notes:
      'Production-capacity context linked to canonical Site, Organisation Unit and Asset resources without duplicating those identities.'
  },
  {
    candidateKey: 'BOF-11-006',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Production Plan',
    notes:
      'Planning object for intended production demand/capacity. It is distinct from authorised Production Order execution.'
  },
  {
    candidateKey: 'BOF-11-007',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Production Order',
    notes:
      'Stable authorised manufacturing execution order tied to Item/manufacturing definition, quantity and source demand.'
  },
  {
    candidateKey: 'BOF-11-008',
    decision: 'CHILD',
    proposedCanonicalName: 'Production Operation',
    notes:
      'Execution step within a Production Order derived from the governed process plan; not a separate production-order master.'
  },
  {
    candidateKey: 'BOF-11-009',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-10-016',
    notes: 'Production Batch uses the shared canonical Batch traceability identity.'
  },
  {
    candidateKey: 'BOF-11-010',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-10-015',
    notes: 'Production Lot uses the shared canonical Lot traceability identity.'
  },
  {
    candidateKey: 'BOF-11-011',
    decision: 'PROJECTION',
    proposedCanonicalName: 'Capacity Plan',
    notes:
      'Capacity planning is a derived/planning projection over work-centre/resource capacity and demand, not a new resource identity.'
  },
  {
    candidateKey: 'BOF-11-012',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Shop-floor Progress Event',
    notes:
      'Immutable execution observation contributing to production status; current progress is derived from retained events.'
  },
  {
    candidateKey: 'BOF-11-013',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Production Quality Record',
    notes:
      'Evidence of quality inspection/test outcome linked to production execution and traceability identities.'
  },
  {
    candidateKey: 'BOF-11-014',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Production Traceability Record',
    notes:
      'Evidence linking consumed and produced lots, batches, serial identities, operations and provenance.'
  },
  {
    candidateKey: 'BOF-11-015',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Scrap Record',
    notes:
      'Immutable material/production disposition event recording scrap quantity, reason, provenance and accounting/quality consequences.'
  },
  {
    candidateKey: 'BOF-11-016',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Waste Record',
    notes:
      'Immutable production waste evidence linked to material provenance, quantity, disposition and sustainability obligations.'
  },
  {
    candidateKey: 'BOF-11-017',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'As-Manufactured Configuration',
    notes:
      'Governed actual configuration/provenance snapshot of produced output; it preserves what was actually built without rewriting approved definitions.'
  },
  {
    candidateKey: 'BOF-11-018',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Production Cost Evidence',
    notes:
      'Traceable evidence of resource/material/cost consumption feeding finance/cost projections; not the accounting ledger itself.'
  }
];
