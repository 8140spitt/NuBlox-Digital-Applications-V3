# PTC Windchill ESI — Transaction, Publication History & Source-Authority Model

**Status:** Active reference evidence  
**Primary target:** Windchill 12.0.2.0 ESI / ERP Connector / Integration for MES  
**Purpose:** Capture the semantics of downstream publication, distribution-target authority, transaction tracking, acknowledgement, failure and resubmission before translating the pattern into NuBlox integration architecture.

> This is Windchill reference evidence, not a NuBlox design decision.

## 1. Core publication model

Windchill ESI is not simply an export file mechanism.

The core model is:

```text
Windchill business object
    |
    +-- release / publish request
            |
            +-- distribution target selection
                    |
                    +-- ESI transaction per downstream ERP/MES instance
                            |
                            +-- subtransaction / ReleaseActivity
                            |      per object × distribution target
                            |
                            +-- outbound response/message
                            |
                            +-- downstream processing
                            |
                            +-- result / acknowledgement
                            |
                            +-- persisted publication status/history
```

A single release can therefore create multiple ESI transactions where the released object is associated with multiple downstream ERP/MES instances.

## 2. Distribution Target

A Distribution Target is an explicit governed representation of the downstream destination.

The target carries identifiers used by the integration layer to route publication to the correct enterprise system / organisation / plant.

PTC's Oracle integration documentation separates:

- **Destination** — connection/destination identity for the downstream system;
- **TargetID** — the Windchill distribution-target identity, potentially including downstream organisation context.

The pair defines where data is being published.

This means:

```text
business object
!=
publication destination
!=
downstream organisation/site
```

These are separately governed relationships.

## 3. Transaction and subtransaction

Windchill ESI records publication at more than one level.

### Transaction

Represents the overall publication of a business object and related objects to the distribution targets belonging to a given downstream system instance.

Documented transaction states include:

- pending;
- processing;
- succeeded;
- failed;
- warning;
- partially_succeeded.

### ReleaseActivity / subtransaction

Represents publication of an individual Windchill object to a particular distribution target.

A separate ReleaseActivity exists for each:

```text
Windchill object × Distribution Target
```

Documented subtransaction states include:

- pending;
- succeeded;
- failed.

A pending ReleaseActivity also acts as a guard against concurrently publishing the same object to the same target again.

This is a major distinction:

```text
Release
  -> Transaction per target-system instance
      -> ReleaseActivity per published object × target
```

## 4. Closed-loop acknowledgement

The ESI flow is explicitly closed-loop.

The outbound flow broadly performs:

1. Windchill detects/releases the object.
2. ESI resolves the associated distribution targets.
3. Windchill generates the ESI response and marks publication as pending.
4. The message is delivered to middleware/downstream processing.
5. Downstream processing produces acknowledgement/results.
6. Result messages are returned to Windchill.
7. Windchill updates transaction and ReleaseActivity state.

The downstream result therefore forms part of the governed publication history; message delivery alone is not evidence of successful downstream application.

## 5. Result message semantics

PTC's ESI Result Service schema includes, among other values:

- ObjectID;
- ObjectDescription;
- Class;
- Action;
- TargetID;
- TransactionID;
- Successful;
- Message;
- ERP primary/secondary result information;
- EAI primary/secondary result information;
- Root Cause;
- additional integration information;
- Subtransaction flag;
- timestamp.

The result contract therefore correlates:

```text
object identity
+
requested action
+
target identity
+
transaction identity
+
success/failure
+
diagnostic evidence
```

This is substantially richer than a generic "integration succeeded" flag.

## 6. Publication history

Transaction management provides:

1. an audit trail of objects published to targets;
2. history used to determine what should be published on later publication attempts;
3. end-user administration of publication status/history.

Publication history is therefore operational state, not merely logging.

It influences future delta publication.

## 7. Failure and resubmission

PTC's 12.0.2.0 Integration for MES documentation is explicit about resubmission:

- a failed transaction causes the overall ESI release to be considered failed;
- the publishing user can correct the cause and republish;
- resubmitted data is regenerated by ESI services from Windchill;
- the downstream interface does **not** simply retain and replay the previous transaction;
- resubmitted data is processed as newly published data;
- by default, only objects changed since the last successful publication attempt are republished;
- a **new transaction object** is created for each downstream instance where the original publication failed;
- data is sent only to the distribution targets where the original publication failed.

Therefore:

```text
retry
!=
blind message replay

retry
=
new governed publication attempt
derived from current authoritative state
scoped using prior publication history
```

This avoids treating an old payload as inherently authoritative after source state may have changed.

## 8. System-of-record boundary

Windchill ESI requires system-of-record ownership to be defined at object and attribute level.

PTC's published model distinguishes information mastered by Windchill from information mastered by the downstream ERP system.

Examples in the documented baseline include:

- Windchill-mastered part identity/version/product-definition attributes;
- downstream-mastered ERP planning/cost/operational attributes;
- Windchill-mastered BOM/version information;
- downstream-controlled information such as some effectivity/ERP execution data depending on the integration;
- Change Notice authority that can transition as part of the downstream business process.

The critical semantic principle is:

```text
integration
does not mean
shared uncontrolled authorship
```

Authority must be explicit for every exchanged object/attribute family.

## 9. Publication sequencing and source assumptions

PTC documents integration assumptions that include:

- source validation before publication;
- shared version-scheme expectations for published objects;
- source-of-record ownership over published versioning;
- releases not being published out of order;
- downstream changes to source-mastered fields risking overwrite or publication failure.

This is evidence that integration consistency depends on explicit authority and ordered publication semantics.

## 10. Object families participating in publication

Across the ESI/MPMLink transaction material, publishable or tracked families include:

- Change Orders / Change Notices;
- Parts;
- Part Usage/BOM relationships;
- substitutes/alternates;
- co-produce data;
- Process Plans;
- Operations;
- Sequences;
- Resources;
- Documents;
- CAD-related document structures/links;
- Control Characteristics;
- related quality/model-item links.

Not every object placed in an ESI response is necessarily persisted as a native object in every downstream ERP. Publication transport and downstream ownership remain distinct.

## 11. Candidate NuBlox implications

Subject to later architecture translation, the Windchill benchmark supports these candidate principles:

1. **Integration Endpoint** must be a governed object, not connection strings hidden in code.
2. Publication must have a first-class **Publication Transaction** identity.
3. A transaction must decompose into per-object/per-target **Publication Activities**.
4. Queued/sent/acknowledged/applied/failed are different states.
5. Successful HTTP/message transport must not equal business acceptance.
6. Retry should normally generate a new attempt from current authoritative state rather than replaying stale payload blindly.
7. Prior publication history should support delta selection and duplicate/concurrency prevention.
8. Source-of-record/attribute authority must be explicit.
9. Downstream diagnostics should be retained as evidence correlated to object, operation, target and transaction.
10. Integration history must survive independently of the transient queue/message.

## 12. NuBlox distinction to preserve

```text
Business Object
!= Integration Endpoint
!= Publication Transaction
!= Publication Activity
!= Outbound Message
!= Delivery Receipt
!= Downstream Business Acceptance
!= Authority Transfer
```

An import/export or successful acknowledgement must not implicitly transfer master-data authority.

## 13. Open edge research

The core transaction/source-authority model is now substantially closed. Remaining implementation-detail research includes:

- transport-specific acknowledgement timing;
- SAP vs Oracle vs MES adapter differences;
- exact warning/partial-success combinations by object family;
- deletion/purge/retention of transaction history;
- detailed ERP Connector file-output semantics;
- exact technical idempotency guarantees at middleware/adaptor level.

## Primary PTC evidence

- Windchill 12.0.2.0 — Transaction Resubmission: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/MES_Impl_TransMgmt_Resubmission.html
- Windchill 12.0.2.0 — Help Center ESI / transaction-management branch: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PackageOverview.html
- Windchill 12.0.2.0 — ESI Result Service (official PTC localized Help Center): https://support.ptc.com/help/windchill/cloud/r12.0.2.0/it/Windchill_Help_Center/ESISAPResultService.html
- Windchill 12.0.2.0 — ESI message flow (official PTC localized Help Center): https://support.ptc.com/help/windchill/cloud/r12.0.2.0/de/Windchill_Help_Center/ESIORACLEMessageFlow.html
- Windchill 12.0.2.0 — ESI assumptions / source authority (official PTC localized Help Center): https://support.ptc.com/help/windchill/cloud/r12.0.2.0/de/Windchill_Help_Center/ESIORACLEAssumptions.html
- PTC current corroboration — System-of-Record: https://support.ptc.com/help/windchill_esi/r2026.0.0.0/en/windchill_esi/esi_users/ESISAPSystemOfRecord.html
- PTC current corroboration — Transaction Management and Error Handling: https://support.ptc.com/help/windchill_esi/r2026.0.0.0/en/windchill_esi/ESISAPCustomizersGuide/2_1_7_transaction_management_error_handling.html
