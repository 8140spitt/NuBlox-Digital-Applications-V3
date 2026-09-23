import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type AttributeConstraintAssignment,
  type AttributeDefinition,
  type ConstraintDefinition,
  type EnumerationDefinition,
  type EnumerationValue,
  type MetadataCardinality,
  type MetadataConstraintType,
  type MetadataDataType,
  type TenantId,
  type TypeAttributeAssignment,
  type TypeDefinition
} from '@nublox/kernel';
import type { Pool } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlMetadataRepository } from './metadata-repository.js';

export class MetadataAdministrationCommandError extends Error {
  constructor(
    message: string,
    readonly code: 'PERMISSION_DENIED' | 'INVALID_INPUT' | 'NOT_FOUND' | 'CONFLICT'
  ) {
    super(message);
    this.name = 'MetadataAdministrationCommandError';
  }
}

function required(value: string | undefined, label: string): string {
  const result = value?.trim() ?? '';
  if (!result) throw new MetadataAdministrationCommandError(`${label} is required.`, 'INVALID_INPUT');
  return result;
}
function optional(value: string | undefined): string | undefined {
  const result = value?.trim() ?? '';
  return result || undefined;
}
function integer(value: number | undefined, label: string, minimum: number): number {
  if (!Number.isInteger(value) || (value ?? -1) < minimum) {
    throw new MetadataAdministrationCommandError(`${label} must be an integer >= ${minimum}.`, 'INVALID_INPUT');
  }
  return value as number;
}
function mapError(error: unknown): never {
  if (error instanceof MetadataAdministrationCommandError) throw error;
  if (typeof error === 'object' && error !== null && 'code' in error) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw new MetadataAdministrationCommandError(
        'An equivalent governed metadata record already exists.',
        'CONFLICT'
      );
    }
  }
  if (error instanceof Error) {
    if (/not found/i.test(error.message)) {
      throw new MetadataAdministrationCommandError(error.message, 'NOT_FOUND');
    }
    if (/must|required|invalid|only|same tenant|active|reference/i.test(error.message)) {
      throw new MetadataAdministrationCommandError(error.message, 'INVALID_INPUT');
    }
  }
  throw error;
}

const DATA_TYPES = new Set<MetadataDataType>([
  'STRING','INTEGER','DECIMAL','BOOLEAN','DATE','DATETIME','ENUMERATION','REFERENCE','JSON'
]);
const CARDINALITIES = new Set<MetadataCardinality>(['SINGLE','MULTIPLE']);
const CONSTRAINT_TYPES = new Set<MetadataConstraintType>([
  'REQUIRED','MIN_MAX','LENGTH','PATTERN','ENUMERATION','REFERENCE','CUSTOM'
]);

export class MySqlMetadataAdministrationCommandService {
  private readonly access: MySqlAccessRepository;
  private readonly metadata: MySqlMetadataRepository;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
    this.metadata = new MySqlMetadataRepository(pool);
  }

  async createEnumerationDefinition(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      code: string; name: string; description?: string; version?: number;
      effectiveFrom?: string; effectiveTo?: string;
    }
  ): Promise<EnumerationDefinition> {
    await this.requireManage(tenantId, actorPersonId);
    const description = optional(input.description);
    const effectiveFrom = optional(input.effectiveFrom);
    const effectiveTo = optional(input.effectiveTo);
    const item: EnumerationDefinition = {
      id: asId<'EnumerationDefinitionId'>(`ENUM-${randomUUID()}`, 'Enumeration Definition'),
      tenantId,
      code: required(input.code, 'Enumeration code').toUpperCase(),
      name: required(input.name, 'Enumeration name'),
      ...(description ? { description } : {}),
      version: integer(input.version ?? 1, 'Version', 1),
      ...(effectiveFrom ? { effectiveFrom } : {}),
      ...(effectiveTo ? { effectiveTo } : {}),
      status: 'ACTIVE'
    };
    try {
      await this.metadata.createEnumerationDefinition(item, this.audit(actorPersonId));
      return item;
    } catch (error) { return mapError(error); }
  }

  async addEnumerationValue(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      enumerationDefinitionId: string; code: string; label: string; sequence?: number;
      externalValue?: string;
    }
  ): Promise<EnumerationValue> {
    await this.requireManage(tenantId, actorPersonId);
    const externalValue = optional(input.externalValue);
    const item: EnumerationValue = {
      id: asId<'EnumerationValueId'>(`ENUMV-${randomUUID()}`, 'Enumeration Value'),
      tenantId,
      enumerationDefinitionId: asId<'EnumerationDefinitionId'>(
        required(input.enumerationDefinitionId, 'Enumeration Definition'),
        'Enumeration Definition'
      ),
      code: required(input.code, 'Enumeration Value code').toUpperCase(),
      label: required(input.label, 'Enumeration Value label'),
      sequence: integer(input.sequence ?? 0, 'Sequence', 0),
      ...(externalValue ? { externalValue } : {}),
      status: 'ACTIVE'
    };
    try {
      await this.metadata.createEnumerationValue(item, this.audit(actorPersonId));
      return item;
    } catch (error) { return mapError(error); }
  }

  async createTypeDefinition(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      code: string; name: string; description?: string; objectFamily: string;
      parentTypeDefinitionId?: string; version?: number; lifecycleDefinitionId?: string;
      defaultTemplateReference?: string; creationPolicyReference?: string;
      classificationApplicability?: Readonly<Record<string, unknown>>;
      extensionPackage?: string; effectiveFrom?: string; effectiveTo?: string;
    }
  ): Promise<TypeDefinition> {
    await this.requireManage(tenantId, actorPersonId);
    const parent = optional(input.parentTypeDefinitionId);
    const description = optional(input.description);
    const lifecycleDefinitionId = optional(input.lifecycleDefinitionId);
    const defaultTemplateReference = optional(input.defaultTemplateReference);
    const creationPolicyReference = optional(input.creationPolicyReference);
    const extensionPackage = optional(input.extensionPackage);
    const effectiveFrom = optional(input.effectiveFrom);
    const effectiveTo = optional(input.effectiveTo);
    const item: TypeDefinition = {
      id: asId<'TypeDefinitionId'>(`TYPE-${randomUUID()}`, 'Type Definition'),
      tenantId,
      code: required(input.code, 'Type code').toUpperCase(),
      name: required(input.name, 'Type name'),
      ...(description ? { description } : {}),
      objectFamily: required(input.objectFamily, 'Object family').toUpperCase(),
      ...(parent
        ? { parentTypeDefinitionId: asId<'TypeDefinitionId'>(parent, 'Parent Type Definition') }
        : {}),
      version: integer(input.version ?? 1, 'Version', 1),
      ...(lifecycleDefinitionId ? { lifecycleDefinitionId } : {}),
      ...(defaultTemplateReference ? { defaultTemplateReference } : {}),
      ...(creationPolicyReference ? { creationPolicyReference } : {}),
      ...(input.classificationApplicability
        ? { classificationApplicability: input.classificationApplicability }
        : {}),
      ...(extensionPackage ? { extensionPackage } : {}),
      ...(effectiveFrom ? { effectiveFrom } : {}),
      ...(effectiveTo ? { effectiveTo } : {}),
      status: 'ACTIVE'
    };
    try {
      await this.metadata.createTypeDefinition(item, this.audit(actorPersonId));
      return item;
    } catch (error) { return mapError(error); }
  }

  async createAttributeDefinition(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      code: string; name: string; description?: string; dataType: MetadataDataType;
      version?: number; unitCode?: string; enumerationDefinitionId?: string;
      referenceObjectFamily?: string; effectiveFrom?: string; effectiveTo?: string;
    }
  ): Promise<AttributeDefinition> {
    await this.requireManage(tenantId, actorPersonId);
    if (!DATA_TYPES.has(input.dataType)) {
      throw new MetadataAdministrationCommandError('Attribute data type is not supported.', 'INVALID_INPUT');
    }
    const description = optional(input.description);
    const unitCode = optional(input.unitCode);
    const enumerationDefinitionId = optional(input.enumerationDefinitionId);
    const referenceObjectFamily = optional(input.referenceObjectFamily);
    const effectiveFrom = optional(input.effectiveFrom);
    const effectiveTo = optional(input.effectiveTo);
    const item: AttributeDefinition = {
      id: asId<'AttributeDefinitionId'>(`ATTR-${randomUUID()}`, 'Attribute Definition'),
      tenantId,
      code: required(input.code, 'Attribute code').toUpperCase(),
      name: required(input.name, 'Attribute name'),
      ...(description ? { description } : {}),
      dataType: input.dataType,
      version: integer(input.version ?? 1, 'Version', 1),
      ...(unitCode ? { unitCode: unitCode.toUpperCase() } : {}),
      ...(enumerationDefinitionId
        ? { enumerationDefinitionId: asId<'EnumerationDefinitionId'>(enumerationDefinitionId, 'Enumeration Definition') }
        : {}),
      ...(referenceObjectFamily ? { referenceObjectFamily: referenceObjectFamily.toUpperCase() } : {}),
      ...(effectiveFrom ? { effectiveFrom } : {}),
      ...(effectiveTo ? { effectiveTo } : {}),
      status: 'ACTIVE'
    };
    try {
      await this.metadata.createAttributeDefinition(item, this.audit(actorPersonId));
      return item;
    } catch (error) { return mapError(error); }
  }

  async assignAttributeToType(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      typeDefinitionId: string; attributeDefinitionId: string; sequence?: number;
      required?: boolean; cardinality?: MetadataCardinality; localLabel?: string;
      defaultValue?: unknown;
    }
  ): Promise<TypeAttributeAssignment> {
    await this.requireManage(tenantId, actorPersonId);
    const cardinality = input.cardinality ?? 'SINGLE';
    if (!CARDINALITIES.has(cardinality)) {
      throw new MetadataAdministrationCommandError('Attribute cardinality is not supported.', 'INVALID_INPUT');
    }
    const localLabel = optional(input.localLabel);
    const item: TypeAttributeAssignment = {
      id: asId<'TypeAttributeAssignmentId'>(`TYPEATTR-${randomUUID()}`, 'Type Attribute Assignment'),
      tenantId,
      typeDefinitionId: asId<'TypeDefinitionId'>(required(input.typeDefinitionId, 'Type Definition'), 'Type Definition'),
      attributeDefinitionId: asId<'AttributeDefinitionId'>(required(input.attributeDefinitionId, 'Attribute Definition'), 'Attribute Definition'),
      sequence: integer(input.sequence ?? 0, 'Sequence', 0),
      required: input.required ?? false,
      cardinality,
      ...(localLabel ? { localLabel } : {}),
      ...(input.defaultValue !== undefined ? { defaultValue: input.defaultValue } : {}),
      status: 'ACTIVE'
    };
    try {
      await this.metadata.assignAttributeToType(item, this.audit(actorPersonId));
      return item;
    } catch (error) { return mapError(error); }
  }

  async createConstraintDefinition(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      code: string; name: string; description?: string; constraintType: MetadataConstraintType;
      configuration?: Readonly<Record<string, unknown>>; version?: number;
      effectiveFrom?: string; effectiveTo?: string;
    }
  ): Promise<ConstraintDefinition> {
    await this.requireManage(tenantId, actorPersonId);
    if (!CONSTRAINT_TYPES.has(input.constraintType)) {
      throw new MetadataAdministrationCommandError('Constraint type is not supported.', 'INVALID_INPUT');
    }
    const description = optional(input.description);
    const effectiveFrom = optional(input.effectiveFrom);
    const effectiveTo = optional(input.effectiveTo);
    const item: ConstraintDefinition = {
      id: asId<'ConstraintDefinitionId'>(`CONSTRAINT-${randomUUID()}`, 'Constraint Definition'),
      tenantId,
      code: required(input.code, 'Constraint code').toUpperCase(),
      name: required(input.name, 'Constraint name'),
      ...(description ? { description } : {}),
      constraintType: input.constraintType,
      configuration: input.configuration ?? {},
      version: integer(input.version ?? 1, 'Version', 1),
      ...(effectiveFrom ? { effectiveFrom } : {}),
      ...(effectiveTo ? { effectiveTo } : {}),
      status: 'ACTIVE'
    };
    try {
      await this.metadata.createConstraintDefinition(item, this.audit(actorPersonId));
      return item;
    } catch (error) { return mapError(error); }
  }

  async assignConstraintToAttribute(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      typeAttributeAssignmentId: string; constraintDefinitionId: string;
      sequence?: number; mandatory?: boolean;
    }
  ): Promise<AttributeConstraintAssignment> {
    await this.requireManage(tenantId, actorPersonId);
    const item: AttributeConstraintAssignment = {
      id: asId<'AttributeConstraintAssignmentId'>(`ATTRCON-${randomUUID()}`, 'Attribute Constraint Assignment'),
      tenantId,
      typeAttributeAssignmentId: asId<'TypeAttributeAssignmentId'>(
        required(input.typeAttributeAssignmentId, 'Type Attribute Assignment'),
        'Type Attribute Assignment'
      ),
      constraintDefinitionId: asId<'ConstraintDefinitionId'>(
        required(input.constraintDefinitionId, 'Constraint Definition'),
        'Constraint Definition'
      ),
      sequence: integer(input.sequence ?? 0, 'Sequence', 0),
      mandatory: input.mandatory ?? true,
      status: 'ACTIVE'
    };
    try {
      await this.metadata.assignConstraintToAttribute(item, this.audit(actorPersonId));
      return item;
    } catch (error) { return mapError(error); }
  }

  private audit(actorPersonId: string) {
    return { actorPersonId, correlationId: 'METADATA-ADMINISTRATION' };
  }

  private async requireManage(tenantId: TenantId, actorPersonId: string): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.METADATA_MANAGE,
      { scopeType: 'TENANT' }
    );
    if (!evaluation.allowed) {
      throw new MetadataAdministrationCommandError(evaluation.reason, 'PERMISSION_DENIED');
    }
  }
}
