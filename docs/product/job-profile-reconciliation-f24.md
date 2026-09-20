# F24 Job Profile Reconciliation — Business Continuity, Crisis & Physical Security

**Status:** employment-model reconciliation complete  
**Date:** 20 September 2026

All F24 source Job Profiles now have an explicit employment treatment.

Leadership: Head of Business Continuity, Crisis & Physical Security.

Professional roles retained: Business Continuity Manager; Business Continuity Analyst; Business Continuity Planner; Business Continuity Exercise Specialist; Crisis Manager; Emergency Response Coordinator; Crisis Communications Manager; Disaster Recovery Coordinator; Physical Security Manager; **Visitor Management Coordinator**; Security Investigator; Travel Security Specialist.

## Corrected source semantics

`JP-F24.10-PROFESSIONAL` was generated as **Security Operations Coordinator**, but its activities are exclusively Visitor Management: register visitor, verify identity, approve access, issue/recover pass. V3 therefore uses **Visitor Management Coordinator** while preserving the source Functional Role/activity provenance.

## Control findings

Continuity framework/BIA/plan/exercise/recovery invocation must be distinct linked records. Crisis, emergency response and communications need separate action/evidence lifecycles. Physical security events, visitor passes, security investigations and travel security cannot share one generic incident object. Security investigations require restricted-case evidence handling.

See `job-profile-reconciliation-architecture-gap-register.csv`.
