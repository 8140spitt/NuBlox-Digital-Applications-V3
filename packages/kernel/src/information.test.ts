import { describe, expect, it } from 'vitest';
import {
  KernelInvariantError,
  asId,
  createBaseline,
  createBaselineItem,
  createConfigurationItem,
  createDecision,
  createEffectivity,
  createInformationContainer,
  createInformationIssue,
  createInformationIteration,
  createInformationRevision,
  createRepresentation,
  establishBaseline,
  freezeInformationIteration,
  releaseInformationRevision,
  supersedeBaseline,
  supersedeInformationRevision,
  type Baseline,
  type CanonicalObjectIdentity,
  type ConfigurationItem,
  type Decision,
  type InformationContainer,
  type InformationIteration,
  type InformationRevision,
  type Party,
  type Person,
  type Representation
} from './index.js';

const tenantId = asId<'TenantId'>('TENANT-INFO', 'Tenant');

const personParty: Party = {
  id: asId<'PartyId'>('PARTY-INFO', 'Party'),
  tenantId,
  kind: 'PERSON',
  displayName: 'Information Approver',
  status: 'ACTIVE'
};

const person: Person = {
  id: asId<'PersonId'>('PERSON-INFO', 'Person'),
  tenantId,
  partyId: personParty.id,
  legalName: 'Information Approver',
  status: 'ACTIVE'
};

const informationObject: CanonicalObjectIdentity = {
  id: asId<'CanonicalObjectId'>('OBJ-INFO-A1001', 'Canonical Object'),
  tenantId,
  objectType: 'INFORMATION_CONTAINER',
  stableKey: 'A-1001',
  createdAt: '2026-09-20T09:00:00.000Z'
};

const projectObject: CanonicalObjectIdentity = {
  id: asId<'CanonicalObjectId'>('OBJ-PROJECT-1', 'Canonical Object'),
  tenantId,
  objectType: 'PROJECT',
  stableKey: 'PROJECT-1',
  createdAt: '2026-09-20T09:00:00.000Z'
};

const container: InformationContainer = createInformationContainer(
  {
    id: asId<'InformationContainerId'>('INFO-A1001', 'Information Container'),
    tenantId,
    canonicalObjectId: informationObject.id,
    containerType: 'DRAWING',
    code: 'A-1001',
    title: 'Ground Floor Plan',
    status: 'ACTIVE'
  },
  informationObject
);

const revisionA: InformationRevision = createInformationRevision(
  {
    id: asId<'InformationRevisionId'>('INFO-A1001-REV-A', 'Information Revision'),
    tenantId,
    informationContainerId: container.id,
    revision: 'A',
    status: 'DRAFT',
    createdAt: '2026-09-20T09:05:00.000Z'
  },
  container
);

const iteration1: InformationIteration = createInformationIteration(
  {
    id: asId<'InformationIterationId'>('INFO-A1001-A-I1', 'Information Iteration'),
    tenantId,
    informationRevisionId: revisionA.id,
    iteration: 1,
    status: 'WORKING',
    createdAt: '2026-09-20T09:10:00.000Z',
    authorPersonId: person.id
  },
  revisionA,
  person
);

describe('kernel controlled information and configuration invariants', () => {
  it('keeps Master, Revision, Iteration and Representation separate', () => {
    const frozen = freezeInformationIteration(iteration1);
    const representation = createRepresentation(
      {
        id: asId<'RepresentationId'>('REP-A1001-A-I1-PDF', 'Representation'),
        tenantId,
        informationIterationId: frozen.id,
        representationType: 'PDF',
        mediaType: 'application/pdf',
        fileName: 'A-1001-A.pdf',
        contentReference: 'urn:nublox:content:A-1001:A:1:pdf',
        integrityHash: 'sha256:test',
        generatedAt: '2026-09-20T09:30:00.000Z'
      },
      frozen
    );

    expect(container.id).not.toBe(revisionA.id);
    expect(revisionA.id).not.toBe(frozen.id);
    expect(representation.informationIterationId).toBe(frozen.id);
  });

  it('requires a frozen exact iteration before releasing a revision', () => {
    expect(() =>
      releaseInformationRevision(
        revisionA,
        container,
        iteration1,
        '2026-09-20T10:00:00.000Z'
      )
    ).toThrow(KernelInvariantError);

    const frozen = freezeInformationIteration(iteration1);
    const decision: Decision = createDecision(
      {
        id: asId<'DecisionId'>('DEC-REL-A', 'Decision'),
        tenantId,
        decisionType: 'INFORMATION_APPROVAL',
        subjectObjectId: informationObject.id,
        subjectVersion: 'A',
        outcome: 'APPROVED',
        reason: 'Revision A approved for release.',
        deciderPersonId: person.id,
        decidedAt: '2026-09-20T09:55:00.000Z'
      },
      informationObject,
      person
    );

    const released = releaseInformationRevision(
      revisionA,
      container,
      frozen,
      '2026-09-20T10:00:00.000Z',
      decision
    );

    expect(released.status).toBe('RELEASED');
    expect(released.releasedIterationId).toBe(frozen.id);
    expect(released.releaseDecisionId).toBe(decision.id);

    expect(() =>
      releaseInformationRevision(
        revisionA,
        container,
        frozen,
        '2026-09-20T10:00:00.000Z',
        { ...decision, subjectVersion: 'B' }
      )
    ).toThrow(KernelInvariantError);
  });

  it('issues only released information and exact released representations', () => {
    const frozen = freezeInformationIteration(iteration1);
    const released = releaseInformationRevision(
      revisionA,
      container,
      frozen,
      '2026-09-20T10:00:00.000Z'
    );
    const representation: Representation = createRepresentation(
      {
        id: asId<'RepresentationId'>('REP-A1001-A-I1-PDF-ISSUE', 'Representation'),
        tenantId,
        informationIterationId: frozen.id,
        representationType: 'PDF',
        mediaType: 'application/pdf',
        contentReference: 'urn:nublox:content:A-1001:A:1:issue',
        generatedAt: '2026-09-20T10:01:00.000Z'
      },
      frozen
    );

    const issue = createInformationIssue(
      {
        id: asId<'InformationIssueId'>('ISSUE-A1001-A', 'Information Issue'),
        tenantId,
        informationContainerId: container.id,
        informationRevisionId: released.id,
        representationId: representation.id,
        issueReference: 'TR-0001',
        issuePurpose: 'FOR CONSTRUCTION',
        issuedByPersonId: person.id,
        issuedAt: '2026-09-20T10:05:00.000Z'
      },
      container,
      released,
      person,
      representation
    );

    expect(issue.issuePurpose).toBe('FOR CONSTRUCTION');

    expect(() =>
      createInformationIssue(
        { ...issue, informationRevisionId: revisionA.id },
        container,
        revisionA,
        person,
        representation
      )
    ).toThrow(KernelInvariantError);
  });

  it('supersedes released revisions instead of overwriting them', () => {
    const frozenA = freezeInformationIteration(iteration1);
    const releasedA = releaseInformationRevision(
      revisionA,
      container,
      frozenA,
      '2026-09-20T10:00:00.000Z'
    );

    const revisionB = createInformationRevision(
      {
        id: asId<'InformationRevisionId'>('INFO-A1001-REV-B', 'Information Revision'),
        tenantId,
        informationContainerId: container.id,
        revision: 'B',
        status: 'DRAFT',
        createdAt: '2026-09-21T09:00:00.000Z'
      },
      container
    );
    const iterationB = freezeInformationIteration(
      createInformationIteration(
        {
          id: asId<'InformationIterationId'>('INFO-A1001-B-I1', 'Information Iteration'),
          tenantId,
          informationRevisionId: revisionB.id,
          iteration: 1,
          status: 'WORKING',
          createdAt: '2026-09-21T09:05:00.000Z',
          authorPersonId: person.id
        },
        revisionB,
        person
      )
    );
    const releasedB = releaseInformationRevision(
      revisionB,
      container,
      iterationB,
      '2026-09-21T10:00:00.000Z'
    );

    const supersededA = supersedeInformationRevision(releasedA, releasedB);
    expect(supersededA.status).toBe('SUPERSEDED');
    expect(supersededA.supersededByRevisionId).toBe(releasedB.id);
  });

  it('establishes Baselines through an approved Decision and pins exact Configuration Item versions', () => {
    const configurationItem: ConfigurationItem = createConfigurationItem(
      {
        id: asId<'ConfigurationItemId'>('CI-A1001', 'Configuration Item'),
        tenantId,
        canonicalObjectId: informationObject.id,
        code: 'CI-A1001',
        name: 'Drawing A-1001',
        status: 'ACTIVE'
      },
      informationObject
    );

    const baseline: Baseline = createBaseline(
      {
        id: asId<'BaselineId'>('BL-PROJECT-1-001', 'Baseline'),
        tenantId,
        contextObjectId: projectObject.id,
        code: 'BL-001',
        name: 'Project Design Baseline 001',
        status: 'DRAFT'
      },
      projectObject
    );

    const item = createBaselineItem(
      {
        id: asId<'BaselineItemId'>('BLITEM-A1001-A', 'Baseline Item'),
        tenantId,
        baselineId: baseline.id,
        configurationItemId: configurationItem.id,
        subjectVersion: 'A'
      },
      baseline,
      configurationItem
    );
    expect(item.subjectVersion).toBe('A');

    const decision = createDecision(
      {
        id: asId<'DecisionId'>('DEC-BL-001', 'Decision'),
        tenantId,
        decisionType: 'BASELINE_ESTABLISHMENT',
        subjectObjectId: projectObject.id,
        outcome: 'APPROVED',
        reason: 'Project design baseline approved.',
        deciderPersonId: person.id,
        decidedAt: '2026-09-20T11:00:00.000Z'
      },
      projectObject,
      person
    );

    const established = establishBaseline(
      baseline,
      projectObject,
      decision,
      '2026-09-20T11:01:00.000Z'
    );
    expect(established.status).toBe('ESTABLISHED');
    expect(established.establishmentDecisionId).toBe(decision.id);

    expect(() =>
      createBaselineItem(
        {
          id: asId<'BaselineItemId'>('BLITEM-LATE', 'Baseline Item'),
          tenantId,
          baselineId: established.id,
          configurationItemId: configurationItem.id,
          subjectVersion: 'B'
        },
        established,
        configurationItem
      )
    ).toThrow(KernelInvariantError);

    const replacementDraft = createBaseline(
      {
        id: asId<'BaselineId'>('BL-PROJECT-1-002', 'Baseline'),
        tenantId,
        contextObjectId: projectObject.id,
        code: 'BL-002',
        name: 'Project Design Baseline 002',
        status: 'DRAFT'
      },
      projectObject
    );
    const replacementDecision = createDecision(
      {
        id: asId<'DecisionId'>('DEC-BL-002', 'Decision'),
        tenantId,
        decisionType: 'BASELINE_ESTABLISHMENT',
        subjectObjectId: projectObject.id,
        outcome: 'APPROVED',
        reason: 'Replacement baseline approved.',
        deciderPersonId: person.id,
        decidedAt: '2026-09-21T11:00:00.000Z'
      },
      projectObject,
      person
    );
    const replacement = establishBaseline(
      replacementDraft,
      projectObject,
      replacementDecision,
      '2026-09-21T11:01:00.000Z'
    );
    expect(supersedeBaseline(established, replacement).status).toBe('SUPERSEDED');
  });

  it('treats Effectivity as explicit applicability rather than the current revision', () => {
    const configurationItem = createConfigurationItem(
      {
        id: asId<'ConfigurationItemId'>('CI-EFFECTIVITY', 'Configuration Item'),
        tenantId,
        canonicalObjectId: informationObject.id,
        code: 'CI-EFFECTIVITY',
        name: 'Effectivity Test Item',
        status: 'ACTIVE'
      },
      informationObject
    );

    const effectivity = createEffectivity(
      {
        id: asId<'EffectivityId'>('EFF-1', 'Effectivity'),
        tenantId,
        configurationItemId: configurationItem.id,
        subjectVersion: 'A',
        effectivityType: 'DATE',
        scopeType: 'PROJECT',
        scopeId: 'PROJECT-1',
        effectiveFrom: '2026-10-01T00:00:00.000Z',
        status: 'ACTIVE'
      },
      configurationItem
    );

    expect(effectivity.subjectVersion).toBe('A');
    expect(effectivity.scopeId).toBe('PROJECT-1');

    const {
      effectiveFrom: _effectiveFrom,
      effectiveTo: _effectiveTo,
      ...effectivityWithoutDates
    } = effectivity;

    expect(() =>
      createEffectivity(
        {
          ...effectivityWithoutDates,
          id: asId<'EffectivityId'>('EFF-BAD', 'Effectivity')
        },
        configurationItem
      )
    ).toThrow();
  });
});
