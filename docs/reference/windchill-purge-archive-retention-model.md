# PTC Windchill — Purge, Archive, Restore & Retention Model

**Status:** Reference evidence — deep pass  
**Primary target:** Windchill 12.0.2.0  
**Purpose:** Separate governed data disposition from backup/recovery, ordinary deletion and audit-log retention.

> This is Windchill reference evidence, not a NuBlox retention-policy decision.

## 1. Purge is a governed job, not generic delete

Windchill exposes Purge Management with:

- purge queries;
- selection criteria;
- scheduled jobs;
- purge jobs;
- job information/results;
- conflict handling;
- performance controls;
- troubleshooting.

The operational pattern is:

```text
Purge Query / Policy
   -> Selection Criteria
      -> Purge Job / Schedule
         -> candidate collection
            -> conflict evaluation
               -> purge / skip / fail
                  -> job evidence
```

## 2. Iteration-level disposition

Windchill explicitly includes **Purging Iterations**.

This matters because deletion/disposition can operate below stable master/revision identity.

Retention semantics must therefore understand:

```text
Master
 -> Revision
    -> Iteration
```

rather than treating an object as one indivisible row.

## 3. Purge query is reusable configuration

Purge queries can be created, enabled/disabled, copied, renamed, imported/exported, merged and repaired.

The selection definition is therefore a governed reusable policy/configuration object distinct from a single execution.

## 4. Scheduling and execution are separate

Windchill exposes purge schedules separately from purge jobs.

A schedule defines recurrence/timing; a purge job is an execution instance with its own status/evidence.

```text
Purge Policy/Query
!= Schedule
!= Job
!= Purged Object
```

## 5. Conflicts

Purge uses a conflict framework.

Some conflicts can be overridden/resolved; others prevent deletion. Objects may also be skipped when retrying a collection.

Examples documented by PTC include conflicts around objects that are:

- downloaded to a workspace;
- shared to a project;
- not authorized for deletion;
- otherwise protected by relationship/state constraints.

Deletion eligibility is therefore relationship- and authority-aware.

## 6. Archive and restore

Where archive functionality is installed, Windchill can archive selected data for later restoration rather than permanently purge it.

This produces a crucial distinction:

```text
Active
 -> Archived -> Restored

Active
 -> Purged (permanent disposition)
```

Archive is not equivalent to backup: it is an application-governed data state/disposition capability.

## 7. Audit-log retention is a separate concern

Windchill also provides audit-log purge management/scheduling.

Security/business audit evidence therefore has its own retention mechanics and must not be assumed to follow the transactional object's purge policy automatically.

## 8. Purge vs backup/recovery

Backup/recovery protects authoritative platform state against infrastructure failure.

Purge/archive/restore governs the lifecycle/disposition of application data.

```text
Purge/Archive Policy
!= Backup Retention
!= Disaster Recovery
```

Deleting a record from live operational state and expiring a backup copy are separate controls.

## 9. Candidate NuBlox implications

Subject to architecture translation:

1. Retention Policy must be first-class and versioned.
2. Disposition eligibility must understand object family, version/iteration, relationships, legal/records holds and authority.
3. Purge Query/selection policy must be separate from Purge Job execution.
4. Scheduled disposition and ad-hoc disposition require the same auditable execution model.
5. Archive and permanent destruction are different outcomes.
6. Restore requires provenance back to the archived object/version and original governance context.
7. Conflicts and skipped objects must be retained as disposition evidence.
8. Audit/evidence retention must be independently governed from the source transactional object.
9. Content-blob deletion and metadata disposition must be coordinated but remain distinct technical operations.
10. Backup expiry must not be mistaken for records disposition.

## 10. Distinctions to preserve

```text
Delete
!= Purge
!= Archive
!= Restore
!= Backup
!= Retention Expiry

Retention Policy
!= Purge Query
!= Schedule
!= Purge Job
!= Disposition Evidence
```

## Primary PTC evidence

- Windchill 12.0.2.0 Purge branch:
  https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PackageOverview.html
- Scheduled purge jobs:
  https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/PurgeManagingSchedules.html
- Site/Organisation purge/archive/restore administration is exposed in the 12.0.2.0 Help Center navigation.
- Later PTC corroboration for archive/restore:
  https://support.ptc.com/help/windchill/r13.1.2.0/en/Windchill_Help_Center/siteadmin_chp/SiteAdminChp_PurgeArchiveRestore.html
