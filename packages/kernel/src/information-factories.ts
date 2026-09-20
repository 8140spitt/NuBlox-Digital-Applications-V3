import { invariant } from './errors.js';
import type {
  Baseline,
  BaselineItem,
  ConfigurationItem,
  Effectivity,
  InformationContainer,
  InformationIssue,
  InformationIteration,
  InformationRevision,
  Representation
} from './information.js';
import type {
  CanonicalObjectIdentity,
  Person
} from './model.js';
import type { Decision } from './control.js';

function assertSameTenant(expected: string, actual: string, label: string) {
  invariant(expected === actual, `${label} must belong to the same tenant.`);
}

function assertNonEmpty(value: string, label: string) {
  invariant(Boolean(value.trim()), `${label} must not be empty.`);
}

function assertDate(value: string, label: string) {
  invariant(Number.isFinite(Date.parse(value)), `${label} must be a valid date/time.`);
}

function assertDateOrder(from: string | undefined, to: string | undefined, label: string) {
  if (from) assertDate(from, `${label} effectiveFrom`);
  if (to) assertDate(to, `${label} effectiveTo`);
  if (from && to) {
    invariant(
      Date.parse(to) >= Date.parse(from),
      `${label} effectiveTo must not be earlier than effectiveFrom.`
    );
  }
}

export function createInformationContainer(
  input: InformationContainer,
  object: CanonicalObjectIdentity
): InformationContainer {
  assertSameTenant(input.tenantId, object.tenantId, 'Information Container and canonical object');
  invariant(
    input.canonicalObjectId === object.id,
    'Information Container must reference the supplied canonical object.'
  );
  invariant(
    object.objectType === 'INFORMATION_CONTAINER',
    'Information Container canonical object must use objectType INFORMATION_CONTAINER.'
  );
  assertNonEmpty(input.containerType, 'Information Container type');
  assertNonEmpty(input.code, 'Information Container code');
  assertNonEmpty(input.title, 'Information Container title');
  return Object.freeze({ ...input });
}

export function createInformationRevision(
  input: InformationRevision,
  container: InformationContainer
): InformationRevision {
  assertSameTenant(input.tenantId, container.tenantId, 'Information Revision and container');
  invariant(
    input.informationContainerId === container.id,
    'Information Revision must reference the supplied Information Container.'
  );
  invariant(input.status === 'DRAFT', 'New Information Revision must start DRAFT.');
  assertNonEmpty(input.revision, 'Information Revision code');
  assertDate(input.createdAt, 'Information Revision createdAt');
  invariant(
    !input.releasedAt &&
      !input.releaseDecisionId &&
      !input.releasedIterationId &&
      !input.supersededByRevisionId,
    'New Information Revision must not contain release or supersession state.'
  );
  return Object.freeze({ ...input });
}

export function createInformationIteration(
  input: InformationIteration,
  revision: InformationRevision,
  author?: Person
): InformationIteration {
  assertSameTenant(input.tenantId, revision.tenantId, 'Information Iteration and revision');
  invariant(
    input.informationRevisionId === revision.id,
    'Information Iteration must reference the supplied Information Revision.'
  );
  invariant(revision.status === 'DRAFT', 'New Information Iterations require a DRAFT revision.');
  invariant(input.status === 'WORKING', 'New Information Iteration must start WORKING.');
  invariant(
    Number.isInteger(input.iteration) && input.iteration >= 1,
    'Information Iteration number must be a positive integer.'
  );
  assertDate(input.createdAt, 'Information Iteration createdAt');

  if (author) {
    assertSameTenant(input.tenantId, author.tenantId, 'Information Iteration and author');
    invariant(
      input.authorPersonId === author.id,
      'Information Iteration authorPersonId must reference the supplied Person.'
    );
  } else {
    invariant(
      !input.authorPersonId,
      'Information Iteration cannot reference an author that was not supplied.'
    );
  }

  return Object.freeze({ ...input });
}

export function freezeInformationIteration(
  current: InformationIteration
): InformationIteration {
  invariant(current.status === 'WORKING', 'Only a WORKING Information Iteration can be frozen.');
  return Object.freeze({ ...current, status: 'FROZEN' });
}

export function createRepresentation(
  input: Representation,
  iteration: InformationIteration
): Representation {
  assertSameTenant(input.tenantId, iteration.tenantId, 'Representation and Information Iteration');
  invariant(
    input.informationIterationId === iteration.id,
    'Representation must reference the supplied Information Iteration.'
  );
  assertNonEmpty(input.mediaType, 'Representation mediaType');
  assertNonEmpty(input.contentReference, 'Representation contentReference');
  assertDate(input.generatedAt, 'Representation generatedAt');
  if (input.fileName !== undefined) assertNonEmpty(input.fileName, 'Representation fileName');
  if (input.integrityHash !== undefined) assertNonEmpty(input.integrityHash, 'Representation integrityHash');
  return Object.freeze({ ...input });
}

export function releaseInformationRevision(
  current: InformationRevision,
  container: InformationContainer,
  releasedIteration: InformationIteration,
  releasedAt: string,
  decision?: Decision
): InformationRevision {
  assertSameTenant(current.tenantId, container.tenantId, 'Information Revision and container');
  assertSameTenant(current.tenantId, releasedIteration.tenantId, 'Information Revision and released iteration');
  invariant(
    current.informationContainerId === container.id,
    'Information Revision must belong to the supplied Information Container.'
  );
  invariant(current.status === 'DRAFT', 'Only a DRAFT Information Revision can be released.');
  invariant(
    releasedIteration.informationRevisionId === current.id,
    'Released Information Iteration must belong to the Information Revision.'
  );
  invariant(
    releasedIteration.status === 'FROZEN',
    'Information Revision release requires a FROZEN Information Iteration.'
  );
  assertDate(releasedAt, 'Information Revision releasedAt');

  if (decision) {
    assertSameTenant(current.tenantId, decision.tenantId, 'Information Revision and release Decision');
    invariant(
      decision.subjectObjectId === container.canonicalObjectId,
      'Release Decision must reference the Information Container canonical object.'
    );
    invariant(
      decision.subjectVersion === current.revision,
      'Release Decision must reference the exact Information Revision.'
    );
    invariant(
      decision.outcome === 'APPROVED',
      'Release Decision outcome must be APPROVED.'
    );
  }

  return Object.freeze({
    ...current,
    status: 'RELEASED',
    releasedAt,
    releasedIterationId: releasedIteration.id,
    ...(decision ? { releaseDecisionId: decision.id } : {})
  });
}

export function supersedeInformationRevision(
  current: InformationRevision,
  replacement: InformationRevision
): InformationRevision {
  assertSameTenant(current.tenantId, replacement.tenantId, 'Superseded and replacement revisions');
  invariant(
    current.informationContainerId === replacement.informationContainerId,
    'Replacement Information Revision must belong to the same Information Container.'
  );
  invariant(current.id !== replacement.id, 'Information Revision cannot supersede itself.');
  invariant(current.status === 'RELEASED', 'Only a RELEASED Information Revision can be superseded.');
  invariant(replacement.status === 'RELEASED', 'Replacement Information Revision must be RELEASED.');
  return Object.freeze({
    ...current,
    status: 'SUPERSEDED',
    supersededByRevisionId: replacement.id
  });
}

export function createInformationIssue(
  input: InformationIssue,
  container: InformationContainer,
  revision: InformationRevision,
  issuer: Person,
  representation?: Representation
): InformationIssue {
  assertSameTenant(input.tenantId, container.tenantId, 'Information Issue and container');
  assertSameTenant(input.tenantId, revision.tenantId, 'Information Issue and revision');
  assertSameTenant(input.tenantId, issuer.tenantId, 'Information Issue and issuer');
  invariant(input.informationContainerId === container.id, 'Information Issue must reference the supplied container.');
  invariant(input.informationRevisionId === revision.id, 'Information Issue must reference the supplied revision.');
  invariant(input.issuedByPersonId === issuer.id, 'Information Issue must reference the supplied issuer.');
  invariant(revision.status === 'RELEASED', 'Only a RELEASED Information Revision can be issued.');
  assertNonEmpty(input.issueReference, 'Information Issue reference');
  assertNonEmpty(input.issuePurpose, 'Information Issue purpose');
  assertDate(input.issuedAt, 'Information Issue issuedAt');

  if (representation) {
    assertSameTenant(input.tenantId, representation.tenantId, 'Information Issue and Representation');
    invariant(
      input.representationId === representation.id,
      'Information Issue representationId must reference the supplied Representation.'
    );
    invariant(
      revision.releasedIterationId === representation.informationIterationId,
      'Issued Representation must belong to the released Information Iteration.'
    );
  } else {
    invariant(
      !input.representationId,
      'Information Issue cannot reference a Representation that was not supplied.'
    );
  }

  return Object.freeze({ ...input });
}

export function createConfigurationItem(
  input: ConfigurationItem,
  object: CanonicalObjectIdentity
): ConfigurationItem {
  assertSameTenant(input.tenantId, object.tenantId, 'Configuration Item and canonical object');
  invariant(
    input.canonicalObjectId === object.id,
    'Configuration Item must reference the supplied canonical object.'
  );
  assertNonEmpty(input.code, 'Configuration Item code');
  assertNonEmpty(input.name, 'Configuration Item name');
  return Object.freeze({ ...input });
}

export function createBaseline(
  input: Baseline,
  context: CanonicalObjectIdentity
): Baseline {
  assertSameTenant(input.tenantId, context.tenantId, 'Baseline and context object');
  invariant(
    input.contextObjectId === context.id,
    'Baseline must reference the supplied context object.'
  );
  invariant(input.status === 'DRAFT', 'New Baseline must start DRAFT.');
  assertNonEmpty(input.code, 'Baseline code');
  assertNonEmpty(input.name, 'Baseline name');
  invariant(
    !input.establishedAt &&
      !input.establishmentDecisionId &&
      !input.supersededByBaselineId,
    'New Baseline must not contain establishment or supersession state.'
  );
  return Object.freeze({ ...input });
}

export function createBaselineItem(
  input: BaselineItem,
  baseline: Baseline,
  configurationItem: ConfigurationItem
): BaselineItem {
  assertSameTenant(input.tenantId, baseline.tenantId, 'Baseline Item and Baseline');
  assertSameTenant(input.tenantId, configurationItem.tenantId, 'Baseline Item and Configuration Item');
  invariant(input.baselineId === baseline.id, 'Baseline Item must reference the supplied Baseline.');
  invariant(
    input.configurationItemId === configurationItem.id,
    'Baseline Item must reference the supplied Configuration Item.'
  );
  invariant(baseline.status === 'DRAFT', 'Baseline Items can only be changed while the Baseline is DRAFT.');
  assertNonEmpty(input.subjectVersion, 'Baseline Item subjectVersion');
  return Object.freeze({ ...input });
}

export function establishBaseline(
  current: Baseline,
  context: CanonicalObjectIdentity,
  decision: Decision,
  establishedAt: string
): Baseline {
  assertSameTenant(current.tenantId, context.tenantId, 'Baseline and context object');
  assertSameTenant(current.tenantId, decision.tenantId, 'Baseline and establishment Decision');
  invariant(current.contextObjectId === context.id, 'Baseline must belong to the supplied context object.');
  invariant(current.status === 'DRAFT', 'Only a DRAFT Baseline can be established.');
  invariant(
    decision.subjectObjectId === context.id,
    'Baseline establishment Decision must reference the Baseline context object.'
  );
  invariant(decision.outcome === 'APPROVED', 'Baseline establishment Decision outcome must be APPROVED.');
  assertDate(establishedAt, 'Baseline establishedAt');
  return Object.freeze({
    ...current,
    status: 'ESTABLISHED',
    establishedAt,
    establishmentDecisionId: decision.id
  });
}

export function supersedeBaseline(
  current: Baseline,
  replacement: Baseline
): Baseline {
  assertSameTenant(current.tenantId, replacement.tenantId, 'Superseded and replacement Baselines');
  invariant(current.id !== replacement.id, 'Baseline cannot supersede itself.');
  invariant(
    current.contextObjectId === replacement.contextObjectId,
    'Replacement Baseline must belong to the same context object.'
  );
  invariant(current.status === 'ESTABLISHED', 'Only an ESTABLISHED Baseline can be superseded.');
  invariant(replacement.status === 'ESTABLISHED', 'Replacement Baseline must be ESTABLISHED.');
  return Object.freeze({
    ...current,
    status: 'SUPERSEDED',
    supersededByBaselineId: replacement.id
  });
}

export function createEffectivity(
  input: Effectivity,
  configurationItem: ConfigurationItem
): Effectivity {
  assertSameTenant(input.tenantId, configurationItem.tenantId, 'Effectivity and Configuration Item');
  invariant(
    input.configurationItemId === configurationItem.id,
    'Effectivity must reference the supplied Configuration Item.'
  );
  assertNonEmpty(input.subjectVersion, 'Effectivity subjectVersion');
  assertNonEmpty(input.scopeType, 'Effectivity scopeType');

  if (input.scopeType === 'TENANT') {
    invariant(!input.scopeId, 'TENANT Effectivity scope must not specify scopeId.');
  } else {
    invariant(Boolean(input.scopeId?.trim()), 'Non-TENANT Effectivity scope must specify scopeId.');
  }

  assertDateOrder(input.effectiveFrom, input.effectiveTo, 'Effectivity');

  if (input.effectivityType === 'DATE') {
    invariant(
      Boolean(input.effectiveFrom || input.effectiveTo),
      'DATE Effectivity must specify an effective date boundary.'
    );
  }

  if (input.effectivityType === 'CUSTOM') {
    invariant(Boolean(input.expression?.trim()), 'CUSTOM Effectivity must specify expression.');
  }

  return Object.freeze({ ...input });
}
