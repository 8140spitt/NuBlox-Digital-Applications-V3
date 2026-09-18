# Enterprise Risk, Compliance, Internal Control & Audit Semantics

## Purpose

BOF-21 is the shared enterprise assurance backbone for risk, compliance, internal control and audit.

It is deliberately reusable by QHSE, sustainability, finance, legal, cyber, governance and project domains without creating separate risk or compliance engines.

The core architecture is:

```text
Risk Framework
      ↓
Enterprise Risk
      ↓
Risk Assessment
      ↓
Treatment Plan / Actions

Regulatory Obligation
      ↓
Compliance Requirement
      ↓
Internal Control
      ↓
Control Test

Compliance Requirement + Evidence
      ↓
Compliance Assessment

Assurance Plan
      ↓
Audit Engagement
      ↓
Audit Finding
      ↓
Remediation Action
```

## Risk

Enterprise Risk is the stable risk identity.

Risk Assessment is a dated, attributable assessment occurrence.

Treatment Plan is the forward-looking response plan.

Current risk rating is therefore derived from retained assessments; it is not a mutable property that erases history.

Climate and Resilience Risk reuse Enterprise Risk. QHSE risk assessments reuse the same Risk Assessment pattern.

## Risk framework

Risk Framework is controlled/versioned governance including taxonomy, methodology, assessment scales, appetite/tolerance, ownership and review rules.

Historic assessments pin the exact framework/method version used.

Changing appetite or scales never retrospectively rewrites earlier assessments or decisions.

## Regulatory obligation and compliance requirement

These are distinct:

```text
Regulatory Obligation
  source legal/regulatory duty
        ↓
Compliance Requirement
  actionable / testable requirement
```

A source obligation may generate several operational requirements.

Requirements may also derive from standards, licences, permits, contracts or policy.

QHSE Compliance Requirement reuses this enterprise pattern.

## Compliance assessment and evidence

Compliance Evidence is immutable source evidence.

Compliance Assessment evaluates exact Requirement versions against exact evidence at a defined time.

A dashboard or compliance register is a projection over those authoritative records, not another editable source of truth.

## Internal control

Internal Control is the persistent/versioned definition of a control.

Control Test is an execution/evidence occurrence against one exact control version.

```text
Internal Control
      ↓
Control Test
      ↓
exception / finding
      ↓
Remediation Action
```

Retesting produces a new test occurrence rather than overwriting the previous result.

## Assurance planning

Assurance Plan is the general planning structure for audits, control testing, reviews and other assurance work.

Audit Plan is an Assurance Plan type rather than a second planning engine.

Plan items do not become execution truth until an Audit Engagement, Control Test or other assurance occurrence is explicitly created.

## Audit

Audit Engagement is the execution/case.

Audit Finding is a separate governed finding.

Remediation Action is separately owned work.

QHSE Audit reuses Audit Engagement.

Finding closure does not silently close unfinished remediation, and remediation completion does not itself prove effectiveness.

## Remediation action

Remediation Action is domain truth.

A shared Work Item may coordinate assignment, due date or workflow around it, but Work Item completion never substitutes for the remediation record or its verification.

## Integrity cases

Fraud Case and Conduct Case use one restricted **Integrity Case** pattern with explicit case type.

The case retains allegation/source, triage, subjects, investigation evidence, impact/loss where relevant, required notifications and outcome.

Access is need-to-know and separately governed.

Integrity-case outcome does not silently mutate HCM, legal or criminal-justice truth; those domains receive explicit linked actions/decisions.

## Non-negotiable rules

1. Risk identity and Risk Assessment are separate.
2. Current risk position is derived from retained assessments.
3. Risk Framework/method versions are pinned historically.
4. Treatment Plan never overwrites assessment history.
5. Regulatory Obligation and Compliance Requirement are distinct.
6. Compliance Requirement, Assessment and Evidence are separate layers.
7. Internal Control and Control Test are separate definition and occurrence layers.
8. Audit Plan is an Assurance Plan type.
9. Audit Engagement, Finding and Remediation Action have independent identities/lifecycles.
10. Workflow Work Item coordinates remediation but never replaces domain truth.
11. Fraud and Conduct use one restricted Integrity Case architecture.
12. QHSE and sustainability reuse the shared risk/compliance/audit patterns.
13. Material assurance evidence retains actor, source, time, authority where applicable and provenance.
