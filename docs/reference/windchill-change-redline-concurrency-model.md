# PTC Windchill — Change Redline Concurrency, Synchronisation & Merge Model

**Status:** Verified benchmark evidence — core concurrent-change semantics closed  
**Primary source:** PTC Windchill Cloud 12.0.2.0 Help Center  
**Last updated:** 23 September 2026  
**Purpose:** Decompose Windchill BOM redline behaviour into proposed-change branching, iteration, merge, synchronisation, conflict detection and suspect resolution before translating concurrent change into NuBlox.

> This is benchmark evidence. Windchill Redline is not automatically the NuBlox implementation.

## 1. Redline is a proposed-change branch, not the next released revision

A Redline is created against an affected Part version in the context of a Change Notice / Change Task.

The affected Part must be either:

- the latest released version; or
- a never-released version with no previous revisions.

Redlines are supported only for Parts in the root View.

The Redline can carry planned BOM changes without immediately creating the next normal Part revision.

Typical changes include:

- quantity;
- reference designator;
- child addition/deletion;
- child removal/replacement;
- usage/occurrence/attribute changes.

Checking in a Redline creates the **next Redline iteration**.

Thus proposed change evolves independently from the authoritative affected Part revision while planning is underway.

## 2. Merge occurs through Revise

When implementation begins, the latest checked-in Redline iteration is merged as part of **Revise**.

The merge uses:

- latest Redline iteration;
- latest revision of the affected Part;
- latest iteration of that revision.

It creates the resulting object in the change context.

If an open Redline is attached to a non-latest affected-object iteration, it is not merged into the next revision.

A checked-out Redline blocks Revise of its affected object.

The essential model is:

~~~text
Released Part B.1
     │
     ├── Redline CN-1 Chg-B-1.1 → Chg-B-1.2
     │                               │
     │                               └── merge during Revise
     │                                      ↓
     │                                  Part C.1
     │
     └── Redline CN-2 Chg-B-1.1
                │
                └── synchronize/rebase after C.1 release
                       ↓
                   Chg-C-1.1
                       │
                       └── later merge during Revise
                              ↓
                          Part D.1
~~~

This permits parallel planning without prematurely committing multiple sequential released revisions.

## 3. Synchronisation rebases other open change branches

Synchronisation is triggered when:

- later changes are made to the latest released revision that has open Redlines;
- a Change Notice or Change Task is released;
- the affected object version is modified/check-in occurs;
- a resulting object is released.

When a resulting object is released, other open Redlines are synchronized with that latest released resulting object.

The affected-object base of the open change can therefore advance while preserving its unmerged proposed changes.

The PTC use case explicitly demonstrates two Change Notices starting from B.1:

- CN1 completes first and produces C.1;
- CN2's open Redline synchronizes from B.1 to C.1;
- CN2 later merges to create D.1 containing both compatible change sets.

This is effectively governed **rebase/synchronisation**, not simple overwrite.

## 4. Synchronisation is granular

Windchill evaluates synchronisation at multiple levels:

- Part;
- Part attributes;
- usage;
- usage attributes;
- occurrences;
- occurrence attributes;
- quantity;
- reference designator;
- line-number uniqueness.

The conflict engine therefore compares semantic changes, not just whole-object modification timestamps.

## 5. Non-conflicting changes are retained together

PTC defines non-conflicting changes broadly as changes:

- to different Parts; or
- to the same Part at different semantic levels; or
- to different attributes at the same level.

Examples:

- resulting object changes Source while Redline changes Assembly Mode → both retained;
- resulting object adds Part A while Redline adds Part B → both retained;
- resulting object changes a usage while Redline changes a different semantic aspect that does not overlap → both retained.

This is a field/relationship-aware merge model.

## 6. Conflicting changes produce Suspect state

Changes conflict when both sides modify the same semantic target incompatibly.

A conflict does **not** silently select the newest edit. Windchill marks the Redline as **Suspect**.

Examples include:

- resulting object removes a Part while Redline modifies/replaces/removes that same Part;
- both sides modify the same usage field such as quantity;
- both sides change the same attribute to different values;
- competing line numbers violate uniqueness;
- occurrence modifications/removals collide;
- reference-designator uniqueness is violated;
- occurrence quantity constraints are exceeded.

The retained side depends on the conflict family; there is no universal last-write-wins rule.

## 7. Conflict-resolution retention differs by conflict family

Representative rules:

| Conflict family | Example | Retained state after automatic synchronization | Suspect |
|---|---|---|---|
| Usage conflict | Result removes Part, Redline modifies same Part | Redline | Yes |
| Usage conflict | Result modifies Part, Redline modifies/replaces/removes same Part | Redline | Yes |
| Same added Part with incompatible attributes | Both add same Part differently | Latest released result | Yes |
| Same attribute changed differently | Source Make vs Buy | Redline | Yes |
| Line-number uniqueness | Different Parts assigned same unique line number | Latest released result | Yes |
| Same occurrence modified/removed incompatibly | Result modifies occurrence, Redline removes it | Redline | Yes |
| Reference-designator uniqueness | Same designator used incompatibly | Latest released result | Yes |
| Quantity constraint exceeded | Combined occurrence quantity invalid | Latest released result | Yes |

The merge policy is therefore **conflict-type-specific**.

## 8. Suspect is governed unresolved-change state

Suspect can be raised automatically by synchronization or manually by a user.

Resolution requires comparing the Redline with the latest released resulting object and resolving the conflicting intent.

After the suspect is resolved, Windchill creates the next Redline iteration.

This provides evidence that conflict resolution itself is a controlled change to the proposed-change branch.

## 9. Checked-out and cancelled Redlines have special synchronisation states

If a Redline is checked out when synchronization is required:

- synchronization remains pending for that Redline;
- other eligible Redlines can continue;
- after check-in or undo checkout, synchronization occurs;
- synchronization creates a new Redline iteration.

Cancelled Redlines are not eligible for synchronization.

Thus concurrency state includes more than Open/Closed; it includes checkout and synchronization eligibility/pending state.

## 10. Change execution does not require every Suspect to be cleared before Start Execution

PTC states that a checked-out Redline prevents Change Notice execution from starting, while a Suspect Redline does not by itself block Start Execution.

When execution starts:

- Actual Start Date is set;
- Redlines not previously approved become approved.

This means:

**Suspect = unresolved synchronization concern**, not automatically the same thing as **workflow execution gate**.

A NuBlox equivalent should keep conflict state, approval state and workflow gate state separate.

## 11. Redline is deliberately excluded from several generic object operations

Windchill does not treat Redline as an ordinary independently managed Part revision.

Examples of unsupported behaviour include:

- advanced search;
- baseline collection;
- Promotion Request collection;
- delivery-package content;
- one-off version redline actions;
- normal information-page usage.

That reinforces Redline as a change-planning artefact bound to the affected object/change process rather than a general released configuration object.

## 12. Candidate NuBlox change model

The benchmark suggests separating:

1. **Authoritative Object Version**
2. **Change Transaction**
3. **Affected Object Reference**
4. **Proposed Change Branch / Delta**
5. **Proposed Change Iteration**
6. **Base Version**
7. **Synchronization / Rebase Event**
8. **Semantic Difference**
9. **Conflict**
10. **Conflict Resolution**
11. **Merge / Apply Event**
12. **Resulting Object Version**
13. **Approval / Execution / Release state**
14. **Audit evidence**

A candidate flow is:

~~~text
Authoritative released configuration
          ↓
Change Transaction
          ↓
Affected Object + Base Version
          ↓
Proposed Change Branch / Delta
          ↓
iterate during planning
          ↓
authoritative base advances?
     ┌────┴────┐
     │         │
    no        yes
     │         ↓
     │    synchronize / rebase
     │         ↓
     │    semantic compare
     │      ┌──┴──┐
     │      │     │
     │   clean  conflict
     │      │     ↓
     │      │   Suspect
     │      │     ↓
     │      │   resolve
     │      └──┬──┘
     ↓         ↓
       approved implementation
              ↓
       merge/apply during controlled version transition
              ↓
       Resulting Object Version
~~~

For CBE this pattern is relevant to design changes, technical queries that mature into changes, contract variations, site changes, as-built updates and asset-configuration change.

## 13. Architecture implications to test

NuBlox should not assume:

- one active change per object;
- object locking as the only concurrency mechanism;
- whole-record last-write-wins;
- a Change Notice directly edits the released record;
- approval and merge are the same event;
- conflict and workflow state are the same state.

Instead, the benchmark supports explicit concurrent proposed-change branches with base-version provenance, semantic conflict detection, governed rebase/synchronisation and controlled merge into a resulting version.

These remain hypotheses until accepted into NuBlox architecture.

## 14. Research conclusion for concurrent redline semantics

The canonical Windchill pattern is now sufficiently evidenced:

- parallel Redlines can exist against the same released base;
- Redlines iterate independently;
- merge occurs during controlled Revise;
- released results trigger synchronization of other open Redlines;
- synchronization can advance the base while preserving compatible pending changes;
- conflicts are semantic and granular;
- conflicts become Suspect, not last-write-wins;
- conflict-resolution behaviour varies by semantic conflict type;
- resolving Suspect creates a new Redline iteration;
- checked-out Redlines defer synchronization and block Revise;
- cancelled Redlines stop participating.

Remaining Change Management work is now primarily object cardinalities/process variants, change-intent/disposition detail and broader change-object family version semantics rather than the core concurrency model.

## Primary PTC sources

- Redline Process — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ChgMgmtRedlineProcess.html
- Synchronization and Redline Suspect Status — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ChgMgmtRedlineSynchSuspect.html
- Use Case Example for Redline — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ChgMgmtRedlineUseCase.html
- Starting the Execution of a Change Notice — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ChgMgmtChangeNoticeExecute.html
- Define Mapping Rules for Change Management — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WCCG_BusLogicCust_ChgMgmt_BusRulesMappingDefine.html
