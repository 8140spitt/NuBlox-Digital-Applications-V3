import {
  createAttributeConstraintAssignment,
  createAttributeDefinition,
  createConstraintDefinition,
  createEnumerationDefinition,
  createEnumerationValue,
  createTypeAttributeAssignment,
  createTypeDefinition,
  type AttributeConstraintAssignment,
  type AttributeDefinition,
  type ConstraintDefinition,
  type EnumerationDefinition,
  type EnumerationValue,
  type TenantId,
  type TypeAttributeAssignment,
  type TypeDefinition
} from '@nublox/kernel';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';
import type { AuditContext } from './repository.js';

interface TypeRow extends RowDataPacket {
  id: string; tenant_id: string; code: string; name: string; description: string | null;
  object_family: string; parent_type_definition_id: string | null; version: number;
  lifecycle_definition_id: string | null; default_template_reference: string | null;
  creation_policy_reference: string | null; classification_applicability: unknown;
  extension_package: string | null; effective_from: Date | null; effective_to: Date | null;
  status: TypeDefinition['status'];
}
interface EnumerationDefinitionRow extends RowDataPacket {
  id: string; tenant_id: string; code: string; name: string; description: string | null;
  version: number; effective_from: Date | null; effective_to: Date | null;
  status: EnumerationDefinition['status'];
}
interface AttributeRow extends RowDataPacket {
  id: string; tenant_id: string; code: string; name: string; description: string | null;
  data_type: AttributeDefinition['dataType']; version: number; unit_code: string | null;
  enumeration_definition_id: string | null; reference_object_family: string | null;
  effective_from: Date | null; effective_to: Date | null; status: AttributeDefinition['status'];
}
interface TypeAttributeRow extends RowDataPacket {
  id: string; tenant_id: string; type_definition_id: string; attribute_definition_id: string;
  sequence_no: number; required: number; cardinality: TypeAttributeAssignment['cardinality'];
  local_label: string | null; default_value: unknown; status: TypeAttributeAssignment['status'];
}
interface ConstraintRow extends RowDataPacket {
  id: string; tenant_id: string; code: string; name: string; description: string | null;
  constraint_type: ConstraintDefinition['constraintType']; configuration: unknown; version: number;
  effective_from: Date | null; effective_to: Date | null; status: ConstraintDefinition['status'];
}

function dbDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date/time value: ${value}`);
  return date;
}
function objectValue(value: unknown): Readonly<Record<string, unknown>> {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    ? parsed as Readonly<Record<string, unknown>>
    : {};
}
async function evidence(
  connection: PoolConnection,
  tenantId: TenantId,
  entityType: string,
  entityId: string,
  action: string,
  audit: AuditContext,
  payload: unknown
): Promise<void> {
  await connection.execute(
    `INSERT INTO kernel_audit_entries
      (tenant_id, entity_type, entity_id, action, actor_person_id, correlation_id, payload)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [tenantId, entityType, entityId, action, audit.actorPersonId ?? null, audit.correlationId ?? null, JSON.stringify(payload)]
  );
  await writeOutboxEvent(connection, {
    tenantId,
    aggregateType: entityType,
    aggregateId: entityId,
    eventType: `${entityType}.${action}`,
    payload
  });
}
function mapType(row: TypeRow): TypeDefinition {
  return {
    id: row.id as TypeDefinition['id'],
    tenantId: row.tenant_id as TenantId,
    code: row.code,
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    objectFamily: row.object_family,
    ...(row.parent_type_definition_id
      ? { parentTypeDefinitionId: row.parent_type_definition_id as TypeDefinition['id'] }
      : {}),
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
  };
}
function mapEnumeration(row: EnumerationDefinitionRow): EnumerationDefinition {
  return {
    id: row.id as EnumerationDefinition['id'],
    tenantId: row.tenant_id as TenantId,
    code: row.code,
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    version: Number(row.version),
    ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
    ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
    status: row.status
  };
}
function mapAttribute(row: AttributeRow): AttributeDefinition {
  return {
    id: row.id as AttributeDefinition['id'],
    tenantId: row.tenant_id as TenantId,
    code: row.code,
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    dataType: row.data_type,
    version: Number(row.version),
    ...(row.unit_code ? { unitCode: row.unit_code } : {}),
    ...(row.enumeration_definition_id
      ? { enumerationDefinitionId: row.enumeration_definition_id as AttributeDefinition['enumerationDefinitionId'] }
      : {}),
    ...(row.reference_object_family ? { referenceObjectFamily: row.reference_object_family } : {}),
    ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
    ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
    status: row.status
  };
}
function mapTypeAttribute(row: TypeAttributeRow): TypeAttributeAssignment {
  return {
    id: row.id as TypeAttributeAssignment['id'],
    tenantId: row.tenant_id as TenantId,
    typeDefinitionId: row.type_definition_id as TypeAttributeAssignment['typeDefinitionId'],
    attributeDefinitionId: row.attribute_definition_id as TypeAttributeAssignment['attributeDefinitionId'],
    sequence: Number(row.sequence_no),
    required: Boolean(row.required),
    cardinality: row.cardinality,
    ...(row.local_label ? { localLabel: row.local_label } : {}),
    ...(row.default_value !== null && row.default_value !== undefined
      ? { defaultValue: typeof row.default_value === 'string' ? JSON.parse(row.default_value) : row.default_value }
      : {}),
    status: row.status
  };
}
function mapConstraint(row: ConstraintRow): ConstraintDefinition {
  return {
    id: row.id as ConstraintDefinition['id'],
    tenantId: row.tenant_id as TenantId,
    code: row.code,
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    constraintType: row.constraint_type,
    configuration: objectValue(row.configuration),
    version: Number(row.version),
    ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
    ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
    status: row.status
  };
}

export class MySqlMetadataRepository {
  constructor(private readonly pool: Pool) {}

  async createEnumerationDefinition(
    definition: EnumerationDefinition,
    audit: AuditContext = {}
  ): Promise<void> {
    createEnumerationDefinition(definition);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO metadata_enumeration_definitions
          (id, tenant_id, code, name, description, version, effective_from, effective_to,
           status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [definition.id, definition.tenantId, definition.code, definition.name,
         definition.description ?? null, definition.version,
         definition.effectiveFrom ? dbDate(definition.effectiveFrom) : null,
         definition.effectiveTo ? dbDate(definition.effectiveTo) : null,
         definition.status, audit.actorPersonId ?? null, audit.actorPersonId ?? null]
      );
      await evidence(connection, definition.tenantId, 'ENUMERATION_DEFINITION', definition.id, 'CREATED', audit, definition);
    });
  }

  async createEnumerationValue(
    value: EnumerationValue,
    audit: AuditContext = {}
  ): Promise<void> {
    const definition = await this.requireEnumerationDefinition(value.tenantId, value.enumerationDefinitionId);
    createEnumerationValue(value, definition);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO metadata_enumeration_values
          (id, tenant_id, enumeration_definition_id, code, label, sequence_no,
           external_value, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [value.id, value.tenantId, value.enumerationDefinitionId, value.code, value.label,
         value.sequence, value.externalValue ?? null, value.status,
         audit.actorPersonId ?? null, audit.actorPersonId ?? null]
      );
      await evidence(connection, value.tenantId, 'ENUMERATION_VALUE', value.id, 'CREATED', audit, value);
    });
  }

  async createTypeDefinition(definition: TypeDefinition, audit: AuditContext = {}): Promise<void> {
    const parent = definition.parentTypeDefinitionId
      ? await this.requireTypeDefinition(definition.tenantId, definition.parentTypeDefinitionId)
      : undefined;
    createTypeDefinition(definition, parent);
    if (definition.lifecycleDefinitionId) {
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        'SELECT id FROM lifecycle_definitions WHERE tenant_id = ? AND id = ? AND status = ?',
        [definition.tenantId, definition.lifecycleDefinitionId, 'ACTIVE']
      );
      if (!rows[0]) throw new Error('Lifecycle Definition not found or inactive in tenant.');
    }
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO metadata_type_definitions
          (id, tenant_id, code, name, description, object_family, parent_type_definition_id,
           version, lifecycle_definition_id, default_template_reference, creation_policy_reference,
           classification_applicability, extension_package, effective_from, effective_to,
           status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [definition.id, definition.tenantId, definition.code, definition.name,
         definition.description ?? null, definition.objectFamily,
         definition.parentTypeDefinitionId ?? null, definition.version,
         definition.lifecycleDefinitionId ?? null, definition.defaultTemplateReference ?? null,
         definition.creationPolicyReference ?? null,
         definition.classificationApplicability ? JSON.stringify(definition.classificationApplicability) : null,
         definition.extensionPackage ?? null,
         definition.effectiveFrom ? dbDate(definition.effectiveFrom) : null,
         definition.effectiveTo ? dbDate(definition.effectiveTo) : null,
         definition.status, audit.actorPersonId ?? null, audit.actorPersonId ?? null]
      );
      await evidence(connection, definition.tenantId, 'TYPE_DEFINITION', definition.id, 'CREATED', audit, definition);
    });
  }

  async createAttributeDefinition(definition: AttributeDefinition, audit: AuditContext = {}): Promise<void> {
    const enumeration = definition.enumerationDefinitionId
      ? await this.requireEnumerationDefinition(definition.tenantId, definition.enumerationDefinitionId)
      : undefined;
    createAttributeDefinition(definition, enumeration);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO metadata_attribute_definitions
          (id, tenant_id, code, name, description, data_type, version, unit_code,
           enumeration_definition_id, reference_object_family, effective_from, effective_to,
           status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [definition.id, definition.tenantId, definition.code, definition.name,
         definition.description ?? null, definition.dataType, definition.version,
         definition.unitCode ?? null, definition.enumerationDefinitionId ?? null,
         definition.referenceObjectFamily ?? null,
         definition.effectiveFrom ? dbDate(definition.effectiveFrom) : null,
         definition.effectiveTo ? dbDate(definition.effectiveTo) : null,
         definition.status, audit.actorPersonId ?? null, audit.actorPersonId ?? null]
      );
      await evidence(connection, definition.tenantId, 'ATTRIBUTE_DEFINITION', definition.id, 'CREATED', audit, definition);
    });
  }

  async assignAttributeToType(
    assignment: TypeAttributeAssignment,
    audit: AuditContext = {}
  ): Promise<void> {
    const [typeDefinition, attributeDefinition] = await Promise.all([
      this.requireTypeDefinition(assignment.tenantId, assignment.typeDefinitionId),
      this.requireAttributeDefinition(assignment.tenantId, assignment.attributeDefinitionId)
    ]);
    createTypeAttributeAssignment(assignment, typeDefinition, attributeDefinition);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO metadata_type_attribute_assignments
          (id, tenant_id, type_definition_id, attribute_definition_id, sequence_no,
           required, cardinality, local_label, default_value, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [assignment.id, assignment.tenantId, assignment.typeDefinitionId,
         assignment.attributeDefinitionId, assignment.sequence, assignment.required,
         assignment.cardinality, assignment.localLabel ?? null,
         assignment.defaultValue === undefined ? null : JSON.stringify(assignment.defaultValue),
         assignment.status, audit.actorPersonId ?? null, audit.actorPersonId ?? null]
      );
      await evidence(connection, assignment.tenantId, 'TYPE_ATTRIBUTE_ASSIGNMENT', assignment.id, 'ASSIGNED', audit, assignment);
    });
  }

  async createConstraintDefinition(
    definition: ConstraintDefinition,
    audit: AuditContext = {}
  ): Promise<void> {
    createConstraintDefinition(definition);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO metadata_constraint_definitions
          (id, tenant_id, code, name, description, constraint_type, configuration,
           version, effective_from, effective_to, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [definition.id, definition.tenantId, definition.code, definition.name,
         definition.description ?? null, definition.constraintType,
         JSON.stringify(definition.configuration), definition.version,
         definition.effectiveFrom ? dbDate(definition.effectiveFrom) : null,
         definition.effectiveTo ? dbDate(definition.effectiveTo) : null,
         definition.status, audit.actorPersonId ?? null, audit.actorPersonId ?? null]
      );
      await evidence(connection, definition.tenantId, 'CONSTRAINT_DEFINITION', definition.id, 'CREATED', audit, definition);
    });
  }

  async assignConstraintToAttribute(
    assignment: AttributeConstraintAssignment,
    audit: AuditContext = {}
  ): Promise<void> {
    const [attributeAssignment, constraint] = await Promise.all([
      this.requireTypeAttributeAssignment(assignment.tenantId, assignment.typeAttributeAssignmentId),
      this.requireConstraintDefinition(assignment.tenantId, assignment.constraintDefinitionId)
    ]);
    createAttributeConstraintAssignment(assignment, attributeAssignment, constraint);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO metadata_attribute_constraint_assignments
          (id, tenant_id, type_attribute_assignment_id, constraint_definition_id,
           sequence_no, mandatory, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [assignment.id, assignment.tenantId, assignment.typeAttributeAssignmentId,
         assignment.constraintDefinitionId, assignment.sequence, assignment.mandatory,
         assignment.status, audit.actorPersonId ?? null, audit.actorPersonId ?? null]
      );
      await evidence(connection, assignment.tenantId, 'ATTRIBUTE_CONSTRAINT_ASSIGNMENT', assignment.id, 'ASSIGNED', audit, assignment);
    });
  }

  async getTypeDefinition(tenantId: TenantId, id: TypeDefinition['id']): Promise<TypeDefinition | undefined> {
    const [rows] = await this.pool.execute<TypeRow[]>(
      `SELECT id, tenant_id, code, name, description, object_family, parent_type_definition_id,
              version, lifecycle_definition_id, default_template_reference, creation_policy_reference,
              classification_applicability, extension_package, effective_from, effective_to, status
         FROM metadata_type_definitions WHERE tenant_id = ? AND id = ?`, [tenantId, id]
    );
    return rows[0] ? mapType(rows[0]) : undefined;
  }

  async getEnumerationDefinition(
    tenantId: TenantId,
    id: EnumerationDefinition['id']
  ): Promise<EnumerationDefinition | undefined> {
    const [rows] = await this.pool.execute<EnumerationDefinitionRow[]>(
      `SELECT id, tenant_id, code, name, description, version, effective_from, effective_to, status
         FROM metadata_enumeration_definitions WHERE tenant_id = ? AND id = ?`, [tenantId, id]
    );
    return rows[0] ? mapEnumeration(rows[0]) : undefined;
  }

  async getAttributeDefinition(
    tenantId: TenantId,
    id: AttributeDefinition['id']
  ): Promise<AttributeDefinition | undefined> {
    const [rows] = await this.pool.execute<AttributeRow[]>(
      `SELECT id, tenant_id, code, name, description, data_type, version, unit_code,
              enumeration_definition_id, reference_object_family, effective_from, effective_to, status
         FROM metadata_attribute_definitions WHERE tenant_id = ? AND id = ?`, [tenantId, id]
    );
    return rows[0] ? mapAttribute(rows[0]) : undefined;
  }

  async getTypeAttributeAssignment(
    tenantId: TenantId,
    id: TypeAttributeAssignment['id']
  ): Promise<TypeAttributeAssignment | undefined> {
    const [rows] = await this.pool.execute<TypeAttributeRow[]>(
      `SELECT id, tenant_id, type_definition_id, attribute_definition_id, sequence_no,
              required, cardinality, local_label, default_value, status
         FROM metadata_type_attribute_assignments WHERE tenant_id = ? AND id = ?`, [tenantId, id]
    );
    return rows[0] ? mapTypeAttribute(rows[0]) : undefined;
  }

  async getConstraintDefinition(
    tenantId: TenantId,
    id: ConstraintDefinition['id']
  ): Promise<ConstraintDefinition | undefined> {
    const [rows] = await this.pool.execute<ConstraintRow[]>(
      `SELECT id, tenant_id, code, name, description, constraint_type, configuration,
              version, effective_from, effective_to, status
         FROM metadata_constraint_definitions WHERE tenant_id = ? AND id = ?`, [tenantId, id]
    );
    return rows[0] ? mapConstraint(rows[0]) : undefined;
  }

  private async requireTypeDefinition(tenantId: TenantId, id: TypeDefinition['id']): Promise<TypeDefinition> {
    const item = await this.getTypeDefinition(tenantId, id);
    if (!item) throw new Error('Type Definition not found in tenant.');
    return item;
  }
  private async requireEnumerationDefinition(
    tenantId: TenantId,
    id: EnumerationDefinition['id']
  ): Promise<EnumerationDefinition> {
    const item = await this.getEnumerationDefinition(tenantId, id);
    if (!item) throw new Error('Enumeration Definition not found in tenant.');
    return item;
  }
  private async requireAttributeDefinition(
    tenantId: TenantId,
    id: AttributeDefinition['id']
  ): Promise<AttributeDefinition> {
    const item = await this.getAttributeDefinition(tenantId, id);
    if (!item) throw new Error('Attribute Definition not found in tenant.');
    return item;
  }
  private async requireTypeAttributeAssignment(
    tenantId: TenantId,
    id: TypeAttributeAssignment['id']
  ): Promise<TypeAttributeAssignment> {
    const item = await this.getTypeAttributeAssignment(tenantId, id);
    if (!item) throw new Error('Type Attribute Assignment not found in tenant.');
    return item;
  }
  private async requireConstraintDefinition(
    tenantId: TenantId,
    id: ConstraintDefinition['id']
  ): Promise<ConstraintDefinition> {
    const item = await this.getConstraintDefinition(tenantId, id);
    if (!item) throw new Error('Constraint Definition not found in tenant.');
    return item;
  }
}
