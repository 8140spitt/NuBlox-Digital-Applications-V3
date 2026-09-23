# PTC Windchill — Configuration Specification & Effectivity Resolution Model

**Status:** Verified benchmark evidence — core resolution model  
**Primary source:** PTC Windchill Cloud 12.0.2.0 Help Center, with later PTC detail used only where the 12.0.2 page is indexed as a navigation shell  
**Last updated:** 23 September 2026  
**Purpose:** Separate object version creation from the rules that resolve a usable product/configuration state.

> This is benchmark evidence. Windchill configuration-specification names are not automatically NuBlox terminology.

## 1. A configuration specification resolves existing versions

Windchill structure filtering supports multiple configuration-specification families including:

- Latest
- As Matured
- Baseline
- Change
- Unit Effectivity
- Date Effectivity
- Promotion Request
- As Stored

A configuration specification answers:

**Which existing version of each governed object should participate in this resolved structure?**

It does not, by itself, create a revision, create an iteration, release an object, create a baseline or assign effectivity. Those are separate operations/objects.

## 2. Resolution families

| Configuration specification | Resolution authority | Canonical purpose |
|---|---|---|
| Latest | View + lifecycle/state and latest checked-in version rules | Resolve current/latest qualifying structure |
| As Matured | Maturity history / lifecycle-state timing | Reconstruct a structure using maturity-state semantics rather than today's latest versions |
| Baseline | Explicit Managed Baseline membership | Resolve only versions captured in a named baseline |
| Change | Change Notice and its resulting/associated version set | Resolve structure in relation to a governed change |
| Unit Effectivity | Effectivity context + serial/lot/unit value + qualifying version | Resolve configuration applicable to a particular produced unit/range |
| Date Effectivity | Effective date/time + qualifying version | Resolve configuration applicable at a date |
| Promotion Request | Versions referenced by a Promotion Request | Resolve the exact promoted candidate set |
| As Stored | Check-in-time CAD workspace snapshot | Reconstruct CAD dependency versions as stored at a particular check-in |

The important pattern is that several distinct kinds of evidence can select versions: recency, maturity, an explicit snapshot, a change transaction, an effective range, a promotion set or a check-in snapshot.

## 3. Latest is constrained latest, not “max version”

A Latest configuration is not equivalent to sorting every object by version and taking the highest number.

It can be constrained by dimensions such as:

- View;
- lifecycle state;
- manufacturing BOM type / alternate BOM where applicable;
- whether the user's own work-in-progress version may participate.

When a requested View has no version for a Part, Windchill can resolve through the parent View hierarchy.

Therefore any NuBlox latest resolver needs to retain the governing criteria.

## 4. Baseline resolution is explicit membership

A Baseline configuration specification selects versions that are members of the specified baseline.

If no version of a required Part is present in that baseline, Windchill can expose the unresolved Part master rather than silently substituting a random later version.

**Absence from the selected configuration is evidence, not permission to silently use latest.**

Fallback behaviour, if permitted at all, must be explicit.

## 5. Change configuration is transaction-relative

A Change configuration specification resolves versions in relation to a selected Change Notice and the availability of resulting objects.

This is a different question from “what is latest?”, “what is released?” or “what was in baseline X?”.

A change-aware view of a structure is therefore a transaction/configuration projection. NuBlox should be capable of expressing a configuration such as “the structure including the effects/results of governed change C” without overwriting the authoritative released baseline.

## 6. Promotion Request is another explicit configuration set

A Promotion Request configuration specification resolves versions referenced by a particular Promotion Request.

This reinforces that a review/release candidate set is not merely “all objects currently at state X”. The candidate set itself is governed evidence and can be used to reconstruct exactly what was under promotion review.

## 7. Unit effectivity

Unit Effectivity resolves versions applicable to a unit/serial/lot domain.

The configuration criteria include an **Effectivity Context**: a traceable Part providing the serial/lot identity space.

Documented criteria include:

- View;
- optional manufacturing BOM dimensions;
- Effectivity Context;
- Effectivity Type such as serial/MSN;
- Effectivity Unit.

Effectivity is assigned to qualifying versions through governed processes such as change.

~~~text
Version
   +
Effectivity assignment
   +
Effectivity context
   +
queried unit
   ↓
Applicable configuration
~~~

A revision can exist without being effective for a given physical unit.

## 8. Date effectivity

Date Effectivity resolves versions that are applicable for a requested effective date/time.

This is conceptually separate from creation date, modification date, check-in date and release date. NuBlox CBE usage should therefore treat “effective from/to” as governed applicability, not infer it from audit timestamps.

## 9. As Stored is authoring/check-in provenance

For CAD data, As Stored records a check-in-time snapshot of the workspace/dependency configuration.

PTC describes As Stored as a baseline-like snapshot created at check-in. It supports reopening/retrieving an assembly using the dependency versions that were stored together, rather than silently replacing components with newer independently modified versions.

As Stored is less formal than a deliberately created Managed Baseline, but it is critical provenance.

For NuBlox technical work products this suggests preserving source version, dependency versions, authoring/check-in event, resolver used and derived-output provenance.

## 10. Configuration Specification can be combined with other filters

Windchill separates configuration specification from other filtering dimensions including:

- spatial filters;
- attribute filters;
- option/variant filters;
- path filters in relevant interfaces;
- document/type filters in service information contexts.

This means two operations must remain distinct:

1. **version resolution** — which version of a node/link is valid;
2. **scope filtering** — which resolved nodes are included in the presented/derived structure.

~~~text
Stable structure identity
      ↓
Configuration Specification
      ↓
resolved versions
      ↓
effectivity / option / attribute / spatial / path filters
      ↓
task-specific resolved configuration
~~~

Exact processing order can vary by product area and should be retained as part of navigation/filter criteria.

## 11. Configuration criteria must be reusable and auditable

Windchill allows filters/navigation criteria to be saved and reused.

A NuBlox configuration result should therefore retain enough information to reproduce it:

- configuration-specification type;
- View;
- state/maturity criteria;
- baseline/change/promotion identifier when relevant;
- date/unit effectivity inputs;
- effectivity context;
- option/variant criteria;
- other filters;
- unresolved/fallback policy;
- evaluation time;
- resulting exact object/link versions where a frozen snapshot is required.

## 12. CBE translation

This is directly relevant to design configuration, tender/contract baseline, construction issue set, approved-for-construction configuration, commissioning configuration, as-built configuration, handover information set, asset/facility operational configuration and serialised equipment configuration.

Those are not all synonyms for lifecycle state.

A CBE configuration may need to answer both:

- **What versions were approved / contractually frozen?**
- **What versions are applicable to this asset/unit/location/date?**

Those are different resolution questions.

## 13. Architecture hold

NuBlox should not implement a single current-version pointer as the sole configuration model.

The benchmark indicates at minimum separate concepts for:

- version identity;
- maturity/lifecycle;
- baseline membership;
- change membership;
- effectivity;
- configuration/navigation criteria;
- resolved configuration;
- optional frozen configuration snapshot.

The exact NuBlox canonical model remains an architecture decision after the remaining benchmark work.

## Primary PTC sources

- Windchill 12.0.2.0 Part Structure Filter branch — Configuration Specification types and saved filters
- Unit Effectivity Configuration Specification — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PMConfigSpecEffectivityUnit.html
- About Effectivity — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ChgMgmtEffectivityAbout.html
- Enabling As Stored Configurations — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/ru/Windchill_Help_Center/WWGMCADDS5AdminEnableAsStored.html
- Creating a Design Context from a Part Structure — https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/DICDesignContextCreate.html
- Later PTC detail pages used as corroboration where the 12.0.2 content page is indexed only as a navigation shell: Latest, Baseline, Change, Unit Effectivity, Promotion Request and As Stored configuration specification pages.
