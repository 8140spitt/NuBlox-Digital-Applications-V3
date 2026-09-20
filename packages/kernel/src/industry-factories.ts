import { invariant } from './errors.js';
import type {
  ConstructionContextProfile,
  ConstructionWorkProductType,
  DeliveryDomainDefinition,
  IndustryJobProfileDefinition,
  IndustryObjectClassification,
  IndustrySolutionDefinition,
  SectorClassificationScheme,
  SectorClassificationValue
} from './industry.js';
import type {
  CanonicalObjectIdentity,
  JobProfile,
  Person
} from './model.js';

function assertNonEmpty(value: string, label: string) {
  invariant(Boolean(value.trim()), `${label} must not be empty.`);
}

function assertSameTenant(expected: string, actual: string, label: string) {
  invariant(expected === actual, `${label} must belong to the same tenant.`);
}

function assertDate(value: string, label: string) {
  invariant(Number.isFinite(Date.parse(value)), `${label} must be a valid date/time.`);
}

export function createIndustrySolutionDefinition(
  input: IndustrySolutionDefinition
): IndustrySolutionDefinition {
  invariant(input.id === input.code, 'Industry Solution id must equal its stable code.');
  assertNonEmpty(input.code, 'Industry Solution code');
  assertNonEmpty(input.name, 'Industry Solution name');
  assertNonEmpty(input.description, 'Industry Solution description');
  return Object.freeze({ ...input });
}

export function createDeliveryDomainDefinition(
  input: DeliveryDomainDefinition,
  industrySolution: IndustrySolutionDefinition
): DeliveryDomainDefinition {
  invariant(
    input.industrySolutionId === industrySolution.id,
    'Delivery Domain must reference the supplied Industry Solution.'
  );
  invariant(/^D\d{2}$/.test(input.code), 'Delivery Domain code must use D01-D99 format.');
  invariant(input.id === input.code, 'Delivery Domain id must equal its stable domain code.');
  invariant(
    Number.isInteger(input.sequence) && input.sequence >= 1,
    'Delivery Domain sequence must be a positive integer.'
  );
  assertNonEmpty(input.name, 'Delivery Domain name');
  assertNonEmpty(input.purpose, 'Delivery Domain purpose');
  return Object.freeze({ ...input });
}

export function createIndustryJobProfileDefinition(
  input: IndustryJobProfileDefinition,
  industrySolution: IndustrySolutionDefinition,
  deliveryDomain: DeliveryDomainDefinition,
  jobProfile: JobProfile
): IndustryJobProfileDefinition {
  invariant(
    input.industrySolutionId === industrySolution.id,
    'Industry Job Profile must reference the supplied Industry Solution.'
  );
  invariant(
    input.primaryDeliveryDomainId === deliveryDomain.id,
    'Industry Job Profile must reference the supplied Delivery Domain.'
  );
  invariant(
    deliveryDomain.industrySolutionId === industrySolution.id,
    'Industry Job Profile Delivery Domain must belong to the supplied Industry Solution.'
  );
  invariant(
    input.jobProfileId === jobProfile.id,
    'Industry Job Profile must reference the supplied Job Profile.'
  );
  invariant(
    jobProfile.catalogueScope === 'PLATFORM',
    'Industry Solution Job Profiles must use platform Job Profiles.'
  );
  invariant(
    input.canonicalName === jobProfile.name,
    'Industry Job Profile canonicalName must equal the supplied Job Profile name.'
  );
  invariant(
    Number.isInteger(input.sequence) && input.sequence >= 1,
    'Industry Job Profile sequence must be a positive integer.'
  );
  assertNonEmpty(input.source, 'Industry Job Profile source');
  assertDate(input.sourceVerifiedDate, 'Industry Job Profile sourceVerifiedDate');
  return Object.freeze({ ...input });
}

export function createSectorClassificationScheme(
  input: SectorClassificationScheme,
  industrySolution: IndustrySolutionDefinition
): SectorClassificationScheme {
  invariant(
    input.industrySolutionId === industrySolution.id,
    'Classification Scheme must reference the supplied Industry Solution.'
  );
  assertNonEmpty(input.code, 'Classification Scheme code');
  assertNonEmpty(input.name, 'Classification Scheme name');
  assertNonEmpty(input.version, 'Classification Scheme version');
  return Object.freeze({ ...input });
}

export function createSectorClassificationValue(
  input: SectorClassificationValue,
  scheme: SectorClassificationScheme,
  parent?: SectorClassificationValue
): SectorClassificationValue {
  invariant(
    input.schemeId === scheme.id,
    'Classification Value must reference the supplied Classification Scheme.'
  );
  assertNonEmpty(input.code, 'Classification Value code');
  assertNonEmpty(input.name, 'Classification Value name');

  if (parent) {
    invariant(parent.schemeId === scheme.id, 'Classification parent must use the same Scheme.');
    invariant(input.parentValueId === parent.id, 'Classification Value must reference the supplied parent.');
    invariant(input.id !== parent.id, 'Classification Value cannot parent itself.');
  } else {
    invariant(!input.parentValueId, 'Classification Value cannot reference an unsupplied parent.');
  }

  return Object.freeze({ ...input });
}

export function createIndustryObjectClassification(
  input: IndustryObjectClassification,
  object: CanonicalObjectIdentity,
  value: SectorClassificationValue,
  actor?: Person
): IndustryObjectClassification {
  assertSameTenant(input.tenantId, object.tenantId, 'Object Classification and canonical object');
  invariant(
    input.canonicalObjectId === object.id,
    'Object Classification must reference the supplied canonical object.'
  );
  invariant(
    input.classificationValueId === value.id,
    'Object Classification must reference the supplied Classification Value.'
  );
  assertDate(input.assignedAt, 'Object Classification assignedAt');

  if (actor) {
    assertSameTenant(input.tenantId, actor.tenantId, 'Object Classification and assigning Person');
    invariant(
      input.assignedByPersonId === actor.id,
      'Object Classification assignedByPersonId must reference the supplied Person.'
    );
  } else {
    invariant(
      !input.assignedByPersonId,
      'Object Classification cannot reference an unsupplied assigning Person.'
    );
  }

  return Object.freeze({ ...input });
}

export function createConstructionContextProfile(
  input: ConstructionContextProfile,
  object: CanonicalObjectIdentity,
  parent?: CanonicalObjectIdentity
): ConstructionContextProfile {
  assertSameTenant(input.tenantId, object.tenantId, 'Construction Context and canonical object');
  invariant(
    input.canonicalObjectId === object.id,
    'Construction Context must reference the supplied canonical object.'
  );
  invariant(
    object.objectType === input.contextType,
    'Construction Context type must equal the canonical objectType.'
  );
  assertNonEmpty(input.code, 'Construction Context code');
  assertNonEmpty(input.name, 'Construction Context name');

  if (parent) {
    assertSameTenant(input.tenantId, parent.tenantId, 'Construction Context and parent');
    invariant(
      input.parentContextObjectId === parent.id,
      'Construction Context must reference the supplied parent context object.'
    );
    invariant(
      object.id !== parent.id,
      'Construction Context cannot parent itself.'
    );
  } else {
    invariant(
      !input.parentContextObjectId,
      'Construction Context cannot reference an unsupplied parent.'
    );
  }

  return Object.freeze({ ...input });
}

export function createConstructionWorkProductType(
  input: ConstructionWorkProductType,
  industrySolution: IndustrySolutionDefinition
): ConstructionWorkProductType {
  invariant(
    input.industrySolutionId === industrySolution.id,
    'Construction Work Product Type must reference the supplied Industry Solution.'
  );
  assertNonEmpty(input.code, 'Construction Work Product Type code');
  assertNonEmpty(input.name, 'Construction Work Product Type name');
  assertNonEmpty(input.governedOutputType, 'Construction Work Product governedOutputType');

  const seen = new Set<string>();
  for (const representationType of input.defaultRepresentationTypes) {
    assertNonEmpty(representationType, 'Construction Work Product Representation type');
    invariant(
      !seen.has(representationType),
      'Construction Work Product Representation types must not contain duplicates.'
    );
    seen.add(representationType);
  }

  return Object.freeze({
    ...input,
    defaultRepresentationTypes: Object.freeze([...input.defaultRepresentationTypes])
  });
}
