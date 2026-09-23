# PTC Windchill — System Operations, Queue, Vault, Replication & Observability Model

**Status:** Reference evidence — deep pass  
**Primary target:** Windchill 12.0.2.0  
**Purpose:** Decompose the operational runtime concepts that keep governed work, content and background processing reliable without confusing infrastructure state with business-object state.

> This is Windchill reference evidence, not a NuBlox implementation prescription.

## 1. Operational concerns are separate first-class systems

Windchill separates at least:

```text
Business objects / metadata
Content storage
Background execution
Publication workers
Replication/caching
Application server processes
Monitoring/management
Logs
Backup/recovery
```

These concerns interact, but they are not one object or one state machine.

## 2. Background Queue

Windchill background queues execute asynchronous work.

A queue has operational controls including:

- enabled/disabled;
- started/stopped;
- queue entries;
- queue maintenance;
- group assignment;
- dedicated vs pooled behaviour for some workload families.

An enabled queue is not necessarily started, and a queue can be stopped without being disabled.

Queue entries are the executable work units; the queue itself is the execution channel.

## 3. Queue groups and Background Method Servers

Queues can be assigned to queue groups, and queue groups can be assigned to one or more Background Method Servers.

```text
Queue Entry
   -> Queue
      -> Queue Group
          -> Background Method Server
```

This allows workload placement and horizontal distribution without changing the business object that originated the work.

A queue group with no assigned processing server does not execute its queued entries.

Multiple servers can process a group for high availability where configured.

## 4. Dedicated vs pooled queues

Windchill recommends pooled queue processing where possible but supports dedicated queues for workloads such as heavily used or complex workflow templates.

Publication/VCS similarly distinguishes priority queues, publishing queues and scheduler/status queues.

This demonstrates that:

```text
business priority
execution queue
worker capacity
job state
```

are different concepts.

## 5. Content metadata vs binary storage

Windchill can store content externally in file vaults while retaining business-object metadata, access control, indexing and other governing information in the Windchill platform.

The storage hierarchy includes logical and physical concepts such as:

```text
Site
 -> Vault
    -> Folder / Root Folder
       -> Mount
          -> physical storage
```

The object/content relationship must therefore not depend on a user-facing file path as canonical identity.

## 6. Vault roles

PTC distinguishes:

### Master Vault

Stores master/revaulted copies of content.

### Replica Vault

Stores replicated copies intended to make content available closer to remote consumers.

### Cache Vault

Stores uploaded/local cached files until permanent placement or for locality/cache behaviour.

Each site requires appropriate default-target semantics.

These storage roles must not be conflated with object mastership or business-system authority.

A **master vault** means master storage copy; it does not mean that the vault owns the business object's governance authority.

## 7. Vaulting rules

Vaulting rules can resolve storage placement using dimensions including:

- object class/type;
- administrative domain;
- lifecycle state;
- target site/vault.

Windchill restricts a rule to one class, one lifecycle state and one vault, and a given type/state combination resolves to one vault rule.

Storage routing can therefore depend on governed object classification/state without making storage location part of business identity.

## 8. Replication

Replication copies specified content to remote/replica vaults to improve access performance.

PTC explicitly states that replicated data sent to remote sites does **not include metadata**.

Replication may be driven by:

- replication rules;
- schedules;
- user-initiated replication;
- predictive/ad-hoc caching.

A user-initiated replication can also create predictive caching rule/schedule behaviour for future iterations.

Therefore:

```text
authoritative metadata
!= authoritative content storage
!= replicated content copy
!= cache copy
```

Replication is locality/performance semantics, not authority transfer.

## 9. Background publication work

Windchill Visualization Services uses queues to separate:

- workload priority;
- publishing/pre-processing;
- worker-type execution;
- post-processing;
- periodic job-status retrieval.

This reinforces the platform pattern:

```text
Publication Job
 -> Queue Entry
 -> Worker execution
 -> status polling/result
 -> Representation
```

The queue is not the publication job, and the publication job is not the resulting representation.

## 10. Method Server and Server Manager

Windchill uses Method Servers for application execution and Background Method Servers for asynchronous queue workloads.

Server Managers can proxy Method Server JMX MBeans, while direct Method Server connections provide more detailed JVM/server information.

Operational process identity therefore sits below business-service identity.

## 11. JMX / MBeans

PTC exposes operational management through JMX/MBeans for concerns including:

- Method Server monitoring;
- Server Manager monitoring;
- property inspection/modification;
- persisted configuration;
- Method Server stop/restart;
- log viewing;
- queue attributes;
- cluster monitoring;
- notifications.

This is an operations/control plane distinct from the end-user business application surface.

## 12. Backup and recovery

PTC's backup guidance identifies several independent assets that require protection:

- Windchill database;
- Windchill installation/configuration;
- site-customized source/code;
- database scripts;
- index/search data;
- access/authentication-related data where applicable;
- external file-vault content.

A valid recovery therefore requires consistency across more than transactional database rows.

For vaults, Windchill can generate mount information to help external backup tooling identify the physical content-storage paths.

## 13. Operational evidence

Relevant operational evidence includes:

- queue/queue-entry status;
- replication results;
- publication job results;
- Event Console outcomes;
- vault/revault history;
- logs;
- monitoring metrics;
- backup configuration/inventory.

These records solve operational evidence problems and should not replace business audit, approval, lifecycle or Decision evidence.

## 14. Candidate NuBlox implications

Subject to later architecture translation:

1. Async work requires first-class **Job/Execution** identity separate from business Work.
2. Queue/channel state must be distinct from the state of the business transaction that created it.
3. Storage location must not be canonical object identity.
4. Content authority, content physical placement and cached/replicated copies must be separate.
5. Background workers should be horizontally placeable without changing business-domain ownership.
6. Publication jobs and resulting representations need separate identities.
7. The operational control plane should be separated from business administration.
8. Backup/recovery completeness must cover database, object content, indexes/search state, configuration and required identity/security dependencies.
9. Operational telemetry is not a substitute for immutable business audit/evidence.
10. Recovery objectives should be tested across the complete authoritative state set, not a single datastore.

## 15. Distinctions to preserve

```text
Business Work
!= Background Job
!= Queue Entry
!= Worker Process
!= Publication Job
!= Representation

Business Object
!= Content Blob
!= Vault
!= Replica
!= Cache

Business Authority
!= Storage Master Copy
!= Infrastructure Primary
```

## Primary PTC evidence

- Background Queue Details: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/queuemgmtChp_Intro.html
- Assigning Queues to Groups: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/QueueGroupAssign.html
- Configuring Background Method Servers: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/ko/Windchill_Help_Center/WCAdvDepAdv_BackgroundMethServConfig.html
- About Storing and Moving Data: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/it/Windchill_Help_Center/filevaultChp_AboutStoreMoveDataWC.html
- Configuring Remote File Servers / vault roles: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/it/Windchill_Help_Center/WCInstall_PostInstallFileServer.html
- Understanding Replication: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/ReplicateChp_Intro.html
- Ad Hoc Caching: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/VaultReplCachingAdhocCachingAbout.html
- Windchill MBeans: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WCSysAdminJMX_WCMBean.html
- JMX Connections / Method Server proxying: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/it/Windchill_Help_Center/WCSysAdminJMX_EstablishingConnections.html
- Backup and Recovery: https://support.ptc.com/help/windchill/cloud/r12.0.2.0/en/Windchill_Help_Center/WCSysAdminBackupRecovery_EnsureProperBackupRecovery.html
