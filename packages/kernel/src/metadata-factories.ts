import { invariant } from './errors.js';
import type {
  AttributeConstraintAssignment,
  AttributeDefinition,
  ConstraintDefinition,
  EnumerationDefinition,
  EnumerationValue,
  TypeAttributeAssignment,
  TypeDefinition
} from './metadata.js';

function text(value: string, label: string): void {
  invariant(value.trim().length > 0, `${label} must not be empty.`);
}
function positive(value: number, label: string): void {
  invariant(Number.isInteger(value) && value > 0, `${label} must be a positive integer.`);
}
function sequence(value: number, label: string): void {
  invariant(Number.isInteger(value) && value >= 0, `${label} must be a non-negative integer.`);
}
function date(value: string | undefined, label: string): number | undefined {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  invariant(!Number.isNaN(parsed), `${label} must be a valid date/time.`);
  return parsed;
}
function period(from: string | undefined, to: string | undefined, label: string): void {
  const start = date(from, `${label} effectiveFrom`);
  const end = date(to, `${label} effectiveTo`);
  invariant(end === undefined || (start !== undefined && end >= start), `${label} effective period is invalid.`);
}
function sameTenant(a: { tenantId: string }, b: { tenantId: string }, label: string): void {
  invariant(a.tenantId === b.tenantId, `${label} must stay within one tenant.`);
}

export function createTypeDefinition(
  input: TypeDefinition,
  parent?: TypeDefinition
): TypeDefinition {
  text(input.code, 'Type Definition code');
  text(input.name, 'Type Definition name');
  text(input.objectFamily, 'Type Definition objectFamily');
  positive(input.version, 'Type Definition version');
  period(input.effectiveFrom, input.effectiveTo, 'Type Definition');
  if (input.parentTypeDefinitionId) {
    invariant(Boolean(parent), 'Parent Type Definition is required.');
    if (parent) {
      sameTenant(input, parent, 'Type inheritance');
      invariant(parent.id === input.parentTypeDefinitionId, 'Parent Type Definition reference does not match.');
      invariant(parent.objectFamily === input.objectFamily, 'Parent and child Type Definitions must use the same object family.');
      invariant(parent.status === 'ACTIVE', 'Parent Type Definition must be active.');
      invariant(parent.id !== input.id, 'Type Definition cannot inherit from itself.');
    }
  }
  return Object.freeze({
    ...input,
    ...(input.classificationApplicability
      ? { classificationApplicability: Object.freeze({ ...input.classificationApplicability }) }
      : {})
  });
}

export function createEnumerationDefinition(input: EnumerationDefinition): EnumerationDefinition {
  text(input.code, 'Enumeration Definition code');
  text(input.name, 'Enumeration Definition name');
  positive(input.version, 'Enumeration Definition version');
  period(input.effectiveFrom, input.effectiveTo, 'Enumeration Definition');
  return Object.freeze({ ...input });
}

export function createEnumerationValue(
  input: EnumerationValue,
  definition: EnumerationDefinition
): EnumerationValue {
  sameTenant(input, definition, 'Enumeration Value');
  invariant(input.enumerationDefinitionId === definition.id, 'Enumeration Value must reference the supplied Enumeration Definition.');
  invariant(definition.status === 'ACTIVE', 'Enumeration Definition must be active.');
  text(input.code, 'Enumeration Value code');
  text(input.label, 'Enumeration Value label');
  sequence(input.sequence, 'Enumeration Value sequence');
  return Object.freeze({ ...input });
}

export function createAttributeDefinition(
  input: AttributeDefinition,
  enumeration?: EnumerationDefinition
): AttributeDefinition {
  text(input.code, 'Attribute Definition code');
  text(input.name, 'Attribute Definition name');
  positive(input.version, 'Attribute Definition version');
  period(input.effectiveFrom, input.effectiveTo, 'Attribute Definition');
  if (input.dataType === 'ENUMERATION') {
    invariant(Boolean(input.enumerationDefinitionId), 'Enumeration Attribute requires an Enumeration Definition.');
    invariant(Boolean(enumeration), 'Enumeration Definition is required.');
    if (enumeration) {
      sameTenant(input, enumeration, 'Attribute Enumeration');
      invariant(enumeration.id === input.enumerationDefinitionId, 'Enumeration Definition reference does not match.');
      invariant(enumeration.status === 'ACTIVE', 'Enumeration Definition must be active.');
    }
  } else {
    invariant(!input.enumerationDefinitionId, 'Only ENUMERATION attributes may reference an Enumeration Definition.');
  }
  if (input.dataType === 'REFERENCE') {
    text(input.referenceObjectFamily ?? '', 'Reference Attribute object family');
  } else {
    invariant(!input.referenceObjectFamily, 'Only REFERENCE attributes may declare a reference object family.');
  }
  return Object.freeze({ ...input });
}

export function createTypeAttributeAssignment(
  input: TypeAttributeAssignment,
  typeDefinition: TypeDefinition,
  attributeDefinition: AttributeDefinition
): TypeAttributeAssignment {
  sameTenant(input, typeDefinition, 'Type Attribute Assignment');
  sameTenant(input, attributeDefinition, 'Type Attribute Assignment');
  invariant(input.typeDefinitionId === typeDefinition.id, 'Type Attribute Assignment must reference the supplied Type Definition.');
  invariant(input.attributeDefinitionId === attributeDefinition.id, 'Type Attribute Assignment must reference the supplied Attribute Definition.');
  invariant(typeDefinition.status === 'ACTIVE' && attributeDefinition.status === 'ACTIVE', 'Type and Attribute Definitions must be active.');
  sequence(input.sequence, 'Type Attribute Assignment sequence');
  return Object.freeze({ ...input });
}

export function createConstraintDefinition(input: ConstraintDefinition): ConstraintDefinition {
  text(input.code, 'Constraint Definition code');
  text(input.name, 'Constraint Definition name');
  positive(input.version, 'Constraint Definition version');
  period(input.effectiveFrom, input.effectiveTo, 'Constraint Definition');
  invariant(typeof input.configuration === 'object' && input.configuration !== null, 'Constraint configuration is required.');
  return Object.freeze({ ...input, configuration: Object.freeze({ ...input.configuration }) });
}

export function createAttributeConstraintAssignment(
  input: AttributeConstraintAssignment,
  assignment: TypeAttributeAssignment,
  constraint: ConstraintDefinition
): AttributeConstraintAssignment {
  sameTenant(input, assignment, 'Attribute Constraint Assignment');
  sameTenant(input, constraint, 'Attribute Constraint Assignment');
  invariant(input.typeAttributeAssignmentId === assignment.id, 'Attribute Constraint Assignment must reference the supplied Type Attribute Assignment.');
  invariant(input.constraintDefinitionId === constraint.id, 'Attribute Constraint Assignment must reference the supplied Constraint Definition.');
  invariant(assignment.status === 'ACTIVE' && constraint.status === 'ACTIVE', 'Attribute assignment and Constraint Definition must be active.');
  sequence(input.sequence, 'Attribute Constraint Assignment sequence');
  return Object.freeze({ ...input });
}

export function isMetadataEffective(
  item: { status: 'ACTIVE' | 'INACTIVE'; effectiveFrom?: string; effectiveTo?: string },
  at = new Date().toISOString()
): boolean {
  if (item.status !== 'ACTIVE') return false;
  const when = Date.parse(at);
  invariant(!Number.isNaN(when), 'Metadata evaluation date/time is invalid.');
  return (!item.effectiveFrom || Date.parse(item.effectiveFrom) <= when) &&
    (!item.effectiveTo || Date.parse(item.effectiveTo) >= when);
}
