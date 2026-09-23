import { invariant } from './errors.js';
import type {
  MappingPolicy,
  RelationshipConstraintPolicy,
  ValidationRuleDefinition,
  ValidationRuleSet,
  ValidationRuleSetMember
} from './validation.js';

function nonEmpty(value: string, label: string): void {
  invariant(Boolean(value.trim()), `${label} must not be empty.`);
}

function positiveVersion(value: number, label: string): void {
  invariant(Number.isInteger(value) && value > 0, `${label} must be a positive integer.`);
}

function validDate(value: string, label: string): number {
  const parsed = Date.parse(value);
  invariant(Number.isFinite(parsed), `${label} must be a valid date/time.`);
  return parsed;
}

function dateRange(from: string | undefined, to: string | undefined, label: string): void {
  if (to) invariant(Boolean(from), `${label} effectiveTo requires effectiveFrom.`);
  if (from) {
    const start = validDate(from, `${label} effectiveFrom`);
    if (to) invariant(validDate(to, `${label} effectiveTo`) >= start, `${label} effectiveTo must not be earlier than effectiveFrom.`);
  }
}

export function createValidationRuleDefinition(input: ValidationRuleDefinition): ValidationRuleDefinition {
  nonEmpty(input.code, 'Validation Rule code');
  nonEmpty(input.name, 'Validation Rule name');
  nonEmpty(input.handlerKey, 'Validation Rule handlerKey');
  positiveVersion(input.version, 'Validation Rule version');
  dateRange(input.effectiveFrom, input.effectiveTo, 'Validation Rule');
  return Object.freeze({ ...input });
}

export function createValidationRuleSet(input: ValidationRuleSet): ValidationRuleSet {
  nonEmpty(input.code, 'Validation Rule Set code');
  nonEmpty(input.name, 'Validation Rule Set name');
  positiveVersion(input.version, 'Validation Rule Set version');
  dateRange(input.effectiveFrom, input.effectiveTo, 'Validation Rule Set');
  return Object.freeze({ ...input });
}

export function createValidationRuleSetMember(
  input: ValidationRuleSetMember,
  ruleSet: ValidationRuleSet,
  rule: ValidationRuleDefinition
): ValidationRuleSetMember {
  invariant(input.tenantId === ruleSet.tenantId && input.tenantId === rule.tenantId, 'Validation Rule Set membership must remain tenant-bound.');
  invariant(input.ruleSetId === ruleSet.id, 'Validation Rule Set Member must reference the supplied Rule Set.');
  invariant(input.ruleDefinitionId === rule.id, 'Validation Rule Set Member must reference the supplied Rule Definition.');
  invariant(ruleSet.status === 'ACTIVE' && rule.status === 'ACTIVE', 'Validation Rule Set and Rule Definition must be active.');
  invariant(Number.isInteger(input.sequence) && input.sequence >= 0, 'Validation Rule Set Member sequence must be a non-negative integer.');
  return Object.freeze({ ...input });
}

export function createRelationshipConstraintPolicy(input: RelationshipConstraintPolicy): RelationshipConstraintPolicy {
  nonEmpty(input.code, 'Relationship Constraint Policy code');
  nonEmpty(input.name, 'Relationship Constraint Policy name');
  nonEmpty(input.relationshipType, 'Relationship type');
  nonEmpty(input.sourceObjectType, 'Source object type');
  nonEmpty(input.targetObjectType, 'Target object type');
  positiveVersion(input.version, 'Relationship Constraint Policy version');
  dateRange(input.effectiveFrom, input.effectiveTo, 'Relationship Constraint Policy');
  return Object.freeze({ ...input });
}

export function createMappingPolicy(input: MappingPolicy): MappingPolicy {
  nonEmpty(input.code, 'Mapping Policy code');
  nonEmpty(input.name, 'Mapping Policy name');
  nonEmpty(input.sourceType, 'Mapping Policy source type');
  nonEmpty(input.targetType, 'Mapping Policy target type');
  positiveVersion(input.version, 'Mapping Policy version');
  invariant(Number.isInteger(input.precedence) && input.precedence >= 0, 'Mapping Policy precedence must be a non-negative integer.');
  dateRange(input.effectiveFrom, input.effectiveTo, 'Mapping Policy');
  return Object.freeze({ ...input, mapping: Object.freeze({ ...input.mapping }) });
}
