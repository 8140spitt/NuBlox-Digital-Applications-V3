import type {
  AttributeConstraintAssignmentId,
  AttributeDefinitionId,
  ConstraintDefinitionId,
  EnumerationDefinitionId,
  EnumerationValueId,
  TenantId,
  TypeAttributeAssignmentId,
  TypeDefinitionId
} from './ids.js';
import type { RecordStatus } from './model.js';

export type MetadataDataType =
  | 'STRING'
  | 'INTEGER'
  | 'DECIMAL'
  | 'BOOLEAN'
  | 'DATE'
  | 'DATETIME'
  | 'ENUMERATION'
  | 'REFERENCE'
  | 'JSON';

export type MetadataCardinality = 'SINGLE' | 'MULTIPLE';

export type MetadataConstraintType =
  | 'REQUIRED'
  | 'MIN_MAX'
  | 'LENGTH'
  | 'PATTERN'
  | 'ENUMERATION'
  | 'REFERENCE'
  | 'CUSTOM';

export interface TypeDefinition {
  id: TypeDefinitionId;
  tenantId: TenantId;
  code: string;
  name: string;
  description?: string;
  objectFamily: string;
  parentTypeDefinitionId?: TypeDefinitionId;
  version: number;
  lifecycleDefinitionId?: string;
  defaultTemplateReference?: string;
  creationPolicyReference?: string;
  classificationApplicability?: Readonly<Record<string, unknown>>;
  extensionPackage?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export interface EnumerationDefinition {
  id: EnumerationDefinitionId;
  tenantId: TenantId;
  code: string;
  name: string;
  description?: string;
  version: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export interface EnumerationValue {
  id: EnumerationValueId;
  tenantId: TenantId;
  enumerationDefinitionId: EnumerationDefinitionId;
  code: string;
  label: string;
  sequence: number;
  externalValue?: string;
  status: RecordStatus;
}

export interface AttributeDefinition {
  id: AttributeDefinitionId;
  tenantId: TenantId;
  code: string;
  name: string;
  description?: string;
  dataType: MetadataDataType;
  version: number;
  unitCode?: string;
  enumerationDefinitionId?: EnumerationDefinitionId;
  referenceObjectFamily?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export interface TypeAttributeAssignment {
  id: TypeAttributeAssignmentId;
  tenantId: TenantId;
  typeDefinitionId: TypeDefinitionId;
  attributeDefinitionId: AttributeDefinitionId;
  sequence: number;
  required: boolean;
  cardinality: MetadataCardinality;
  localLabel?: string;
  defaultValue?: unknown;
  status: RecordStatus;
}

export interface ConstraintDefinition {
  id: ConstraintDefinitionId;
  tenantId: TenantId;
  code: string;
  name: string;
  description?: string;
  constraintType: MetadataConstraintType;
  configuration: Readonly<Record<string, unknown>>;
  version: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export interface AttributeConstraintAssignment {
  id: AttributeConstraintAssignmentId;
  tenantId: TenantId;
  typeAttributeAssignmentId: TypeAttributeAssignmentId;
  constraintDefinitionId: ConstraintDefinitionId;
  sequence: number;
  mandatory: boolean;
  status: RecordStatus;
}
