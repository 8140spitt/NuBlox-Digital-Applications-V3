import {
  PLATFORM_PERMISSION_KEYS,
  type AttributeDefinition,
  type ConstraintDefinition,
  type EnumerationDefinition,
  type MetadataCardinality,
  type TenantId,
  type TypeDefinition
} from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';

interface TypeRow extends RowDataPacket {
  id: string; code: string; name: string; description: string | null; object_family: string;
  parent_type_definition_id: string | null; parent_code: string | null; version: number;
  lifecycle_definition_id: string | null; default_template_reference: string | null;
  creation_policy_reference: string | null; classification_applicability: unknown;
  extension_package: string | null; effective_from: Date | null; effective_to: Date | null;
  status: TypeDefinition['status'];
}
interface AttributeRow extends RowDataPacket {
  id: string; code: string; name: string; description: string | null;
  data_type: AttributeDefinition['dataType']; version: number; unit_code: string | null;
  enumeration_definition_id: string | null; enumeration_code: string | null;
  reference_object_family: string | null; effective_from: Date | null; effective_to: Date | null;
  status: AttributeDefinition['status'];
}
interface AssignmentRow extends RowDataPacket {
  id: string; type_definition_id: string; type_code: string; attribute_definition_id: string;
  attribute_code: string; attribute_name: string; sequence_no: number; required: number;
  cardinality: MetadataCardinality; local_label: string | null; default_value: unknown;
  status: 'ACTIVE' | 'INACTIVE';
}
interface ConstraintRow extends RowDataPacket {
  id: string; code: string; name: string; description: string | null;
  constraint_type: ConstraintDefinition['constraintType']; configuration: unknown; version: number;
  effective_from: Date | null; effective_to: Date | null; status: ConstraintDefinition['status'];
}
interface ConstraintAssignmentRow extends RowDataPacket {
  id: string; type_attribute_assignment_id: string; constraint_definition_id: string;
  constraint_code: string; sequence_no: number; mandatory: number; status: 'ACTIVE' | 'INACTIVE';
}
interface EnumerationRow extends RowDataPacket {
  id: string; code: string; name: string; description: string | null; version: number;
  effective_from: Date | null; effective_to: Date | null; status: EnumerationDefinition['status'];
}
interface EnumerationValueRow extends RowDataPacket {
  id: string; enumeration_definition_id: string; code: string; label: string;
  sequence_no: number; external_value: string | null; status: 'ACTIVE' | 'INACTIVE';
}

function objectValue(value: unknown): Readonly<Record<string, unknown>> {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    ? parsed as Readonly<Record<string, unknown>>
    : {};
}
function jsonValue(value: unknown): unknown {
  return typeof value === 'string' ? JSON.parse(value) : value;
}

export interface MetadataTypeView extends Omit<TypeDefinition, 'tenantId'> {
  parentCode?: string;
}
export interface MetadataAttributeView extends Omit<AttributeDefinition, 'tenantId'> {
  enumerationCode?: string;
}
export interface MetadataTypeAttributeView {
  id: string;
  typeDefinitionId: string;
  typeCode: string;
  attributeDefinitionId: string;
  attributeCode: string;
  attributeName: string;
  sequence: number;
  required: boolean;
  cardinality: MetadataCardinality;
  localLabel?: string;
  defaultValue?: unknown;
  status: 'ACTIVE' | 'INACTIVE';
}
export interface MetadataEffectiveAttributeView extends MetadataTypeAttributeView {
  requestedTypeDefinitionId: string;
  sourceTypeDefinitionId: string;
  inherited: boolean;
}
export interface MetadataConstraintView extends Omit<ConstraintDefinition, 'tenantId'> {}
export interface MetadataConstraintAssignmentView {
  id: string;
  typeAttributeAssignmentId: string;
  constraintDefinitionId: string;
  constraintCode: string;
  sequence: number;
  mandatory: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}
export interface MetadataEnumerationView extends Omit<EnumerationDefinition, 'tenantId'> {
  values: Array<{
    id: string; code: string; label: string; sequence: number;
    externalValue?: string; status: 'ACTIVE' | 'INACTIVE';
  }>;
}
export interface MetadataAdministrationProjection {
  types: MetadataTypeView[];
  attributes: MetadataAttributeView[];
  typeAttributes: MetadataTypeAttributeView[];
  effectiveTypeAttributes: MetadataEffectiveAttributeView[];
  constraints: MetadataConstraintView[];
  constraintAssignments: MetadataConstraintAssignmentView[];
  enumerations: MetadataEnumerationView[];
}

export class MetadataAdministrationReadError extends Error {
  constructor(message: string, readonly code: 'PERMISSION_DENIED') {
    super(message);
    this.name = 'MetadataAdministrationReadError';
  }
}

export class MySqlMetadataAdministrationReadRepository {
  private readonly access: MySqlAccessRepository;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
  }

  async getProjection(
    tenantId: TenantId,
    actorPersonId: string
  ): Promise<MetadataAdministrationProjection> {
    await this.requireRead(tenantId, actorPersonId);

    const [typeResult, attributeResult, assignmentResult, constraintResult, constraintAssignmentResult, enumerationResult, valueResult] =
      await Promise.all([
        this.pool.execute<TypeRow[]>(
          `SELECT t.id, t.code, t.name, t.description, t.object_family,
                  t.parent_type_definition_id, p.code AS parent_code, t.version,
                  t.lifecycle_definition_id, t.default_template_reference,
                  t.creation_policy_reference, t.classification_applicability,
                  t.extension_package, t.effective_from, t.effective_to, t.status
             FROM metadata_type_definitions t
             LEFT JOIN metadata_type_definitions p
               ON p.tenant_id = t.tenant_id AND p.id = t.parent_type_definition_id
            WHERE t.tenant_id = ?
            ORDER BY t.object_family, t.code, t.version DESC`,
          [tenantId]
        ),
        this.pool.execute<AttributeRow[]>(
          `SELECT a.id, a.code, a.name, a.description, a.data_type, a.version,
                  a.unit_code, a.enumeration_definition_id, e.code AS enumeration_code,
                  a.reference_object_family, a.effective_from, a.effective_to, a.status
             FROM metadata_attribute_definitions a
             LEFT JOIN metadata_enumeration_definitions e
               ON e.tenant_id = a.tenant_id AND e.id = a.enumeration_definition_id
            WHERE a.tenant_id = ?
            ORDER BY a.code, a.version DESC`,
          [tenantId]
        ),
        this.pool.execute<AssignmentRow[]>(
          `SELECT ta.id, ta.type_definition_id, t.code AS type_code,
                  ta.attribute_definition_id, a.code AS attribute_code, a.name AS attribute_name,
                  ta.sequence_no, ta.required, ta.cardinality, ta.local_label,
                  ta.default_value, ta.status
             FROM metadata_type_attribute_assignments ta
             JOIN metadata_type_definitions t
               ON t.tenant_id = ta.tenant_id AND t.id = ta.type_definition_id
             JOIN metadata_attribute_definitions a
               ON a.tenant_id = ta.tenant_id AND a.id = ta.attribute_definition_id
            WHERE ta.tenant_id = ?
            ORDER BY t.code, ta.sequence_no, a.code`,
          [tenantId]
        ),
        this.pool.execute<ConstraintRow[]>(
          `SELECT id, code, name, description, constraint_type, configuration,
                  version, effective_from, effective_to, status
             FROM metadata_constraint_definitions
            WHERE tenant_id = ?
            ORDER BY code, version DESC`,
          [tenantId]
        ),
        this.pool.execute<ConstraintAssignmentRow[]>(
          `SELECT ca.id, ca.type_attribute_assignment_id, ca.constraint_definition_id,
                  c.code AS constraint_code, ca.sequence_no, ca.mandatory, ca.status
             FROM metadata_attribute_constraint_assignments ca
             JOIN metadata_constraint_definitions c
               ON c.tenant_id = ca.tenant_id AND c.id = ca.constraint_definition_id
            WHERE ca.tenant_id = ?
            ORDER BY ca.type_attribute_assignment_id, ca.sequence_no, c.code`,
          [tenantId]
        ),
        this.pool.execute<EnumerationRow[]>(
          `SELECT id, code, name, description, version, effective_from, effective_to, status
             FROM metadata_enumeration_definitions
            WHERE tenant_id = ?
            ORDER BY code, version DESC`,
          [tenantId]
        ),
        this.pool.execute<EnumerationValueRow[]>(
          `SELECT id, enumeration_definition_id, code, label, sequence_no, external_value, status
             FROM metadata_enumeration_values
            WHERE tenant_id = ?
            ORDER BY enumeration_definition_id, sequence_no, code`,
          [tenantId]
        )
      ]);

    const types: MetadataTypeView[] = typeResult[0].map((row) => ({
      id: row.id as TypeDefinition['id'],
      code: row.code,
      name: row.name,
      ...(row.description ? { description: row.description } : {}),
      objectFamily: row.object_family,
      ...(row.parent_type_definition_id
        ? { parentTypeDefinitionId: row.parent_type_definition_id as NonNullable<TypeDefinition['parentTypeDefinitionId']> }
        : {}),
      ...(row.parent_code ? { parentCode: row.parent_code } : {}),
      version: Number(row.version),
      ...(row.lifecycle_definition_id ? { lifecycleDefinitionId: row.lifecycle_definition_id } : {}),
      ...(row.default_template_reference ? { defaultTemplateReference: row.default_template_reference } : {}),
      ...(row.creation_policy_reference ? { creationPolicyReference: row.creation_policy_reference } : {}),
      ...(row.classification_applicability
        ? { classificationApplicability: objectValue(row.classification_applicability) }
        : {}),
      ...(row.extension_package ? { extensionPackage: row.extension_package } : {}),
      ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
      ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
      status: row.status
    }));

    const typeAttributes: MetadataTypeAttributeView[] = assignmentResult[0].map((row) => ({
      id: row.id,
      typeDefinitionId: row.type_definition_id,
      typeCode: row.type_code,
      attributeDefinitionId: row.attribute_definition_id,
      attributeCode: row.attribute_code,
      attributeName: row.attribute_name,
      sequence: Number(row.sequence_no),
      required: Boolean(row.required),
      cardinality: row.cardinality,
      ...(row.local_label ? { localLabel: row.local_label } : {}),
      ...(row.default_value !== null && row.default_value !== undefined
        ? { defaultValue: jsonValue(row.default_value) }
        : {}),
      status: row.status
    }));

    const typeById = new Map(types.map((type) => [type.id as string, type]));
    const directByType = new Map<string, MetadataTypeAttributeView[]>();
    for (const assignment of typeAttributes) {
      const list = directByType.get(assignment.typeDefinitionId) ?? [];
      list.push(assignment);
      directByType.set(assignment.typeDefinitionId, list);
    }

    const effectiveTypeAttributes: MetadataEffectiveAttributeView[] = [];
    for (const type of types) {
      const lineage: MetadataTypeView[] = [];
      const visited = new Set<string>();
      let current: MetadataTypeView | undefined = type;
      while (current) {
        const id = current.id as string;
        if (visited.has(id)) throw new Error('Metadata Type Definition hierarchy contains a cycle.');
        visited.add(id);
        lineage.unshift(current);
        current = current.parentTypeDefinitionId
          ? typeById.get(current.parentTypeDefinitionId as string)
          : undefined;
        if (lineage.length > 64) throw new Error('Metadata Type Definition hierarchy exceeds supported depth.');
      }

      const resolved = new Map<string, MetadataEffectiveAttributeView>();
      for (const source of lineage) {
        for (const assignment of directByType.get(source.id as string) ?? []) {
          if (assignment.status !== 'ACTIVE') continue;
          resolved.set(assignment.attributeCode, {
            ...assignment,
            requestedTypeDefinitionId: type.id as string,
            sourceTypeDefinitionId: source.id as string,
            inherited: source.id !== type.id
          });
        }
      }
      effectiveTypeAttributes.push(
        ...Array.from(resolved.values()).sort((a, b) =>
          a.sequence - b.sequence || a.attributeCode.localeCompare(b.attributeCode)
        )
      );
    }

    return {
      types,
      attributes: attributeResult[0].map((row) => ({
        id: row.id as AttributeDefinition['id'],
        code: row.code,
        name: row.name,
        ...(row.description ? { description: row.description } : {}),
        dataType: row.data_type,
        version: Number(row.version),
        ...(row.unit_code ? { unitCode: row.unit_code } : {}),
        ...(row.enumeration_definition_id
          ? { enumerationDefinitionId: row.enumeration_definition_id as NonNullable<AttributeDefinition['enumerationDefinitionId']> }
          : {}),
        ...(row.enumeration_code ? { enumerationCode: row.enumeration_code } : {}),
        ...(row.reference_object_family ? { referenceObjectFamily: row.reference_object_family } : {}),
        ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
        status: row.status
      })),
      typeAttributes,
      effectiveTypeAttributes,
      constraints: constraintResult[0].map((row) => ({
        id: row.id as ConstraintDefinition['id'],
        code: row.code,
        name: row.name,
        ...(row.description ? { description: row.description } : {}),
        constraintType: row.constraint_type,
        configuration: objectValue(row.configuration),
        version: Number(row.version),
        ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
        status: row.status
      })),
      constraintAssignments: constraintAssignmentResult[0].map((row) => ({
        id: row.id,
        typeAttributeAssignmentId: row.type_attribute_assignment_id,
        constraintDefinitionId: row.constraint_definition_id,
        constraintCode: row.constraint_code,
        sequence: Number(row.sequence_no),
        mandatory: Boolean(row.mandatory),
        status: row.status
      })),
      enumerations: enumerationResult[0].map((row) => ({
        id: row.id as EnumerationDefinition['id'],
        code: row.code,
        name: row.name,
        ...(row.description ? { description: row.description } : {}),
        version: Number(row.version),
        ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
        status: row.status,
        values: valueResult[0]
          .filter((value) => value.enumeration_definition_id === row.id)
          .map((value) => ({
            id: value.id,
            code: value.code,
            label: value.label,
            sequence: Number(value.sequence_no),
            ...(value.external_value ? { externalValue: value.external_value } : {}),
            status: value.status
          }))
      }))
    };
  }

  private async requireRead(tenantId: TenantId, actorPersonId: string): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.METADATA_READ,
      { scopeType: 'TENANT' }
    );
    if (!evaluation.allowed) {
      throw new MetadataAdministrationReadError(evaluation.reason, 'PERMISSION_DENIED');
    }
  }
}
