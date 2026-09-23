import { describe, expect, it } from 'vitest';
import {
  KernelInvariantError,
  asId,
  createAttributeConstraintAssignment,
  createAttributeDefinition,
  createConstraintDefinition,
  createEnumerationDefinition,
  createEnumerationValue,
  createTypeAttributeAssignment,
  createTypeDefinition,
  type AttributeDefinition,
  type EnumerationDefinition,
  type TypeDefinition
} from './index.js';

const tenantId = asId<'TenantId'>('TENANT-METADATA', 'Tenant');

const enumeration: EnumerationDefinition = createEnumerationDefinition({
  id: asId<'EnumerationDefinitionId'>('ENUM-STATUS', 'Enumeration Definition'),
  tenantId,
  code: 'STATUS',
  name: 'Status',
  version: 1,
  status: 'ACTIVE'
});

const rootType: TypeDefinition = createTypeDefinition({
  id: asId<'TypeDefinitionId'>('TYPE-DOC', 'Type Definition'),
  tenantId,
  code: 'DOCUMENT',
  name: 'Document',
  objectFamily: 'INFORMATION_CONTAINER',
  version: 1,
  status: 'ACTIVE'
});

const attribute: AttributeDefinition = createAttributeDefinition({
  id: asId<'AttributeDefinitionId'>('ATTR-STATUS', 'Attribute Definition'),
  tenantId,
  code: 'STATUS',
  name: 'Status',
  dataType: 'ENUMERATION',
  version: 1,
  enumerationDefinitionId: enumeration.id,
  status: 'ACTIVE'
}, enumeration);

describe('governed metadata invariants', () => {
  it('supports same-family type inheritance and rejects cross-family inheritance', () => {
    const child = createTypeDefinition({
      id: asId<'TypeDefinitionId'>('TYPE-DRAWING', 'Type Definition'),
      tenantId,
      code: 'DRAWING',
      name: 'Drawing',
      objectFamily: 'INFORMATION_CONTAINER',
      parentTypeDefinitionId: rootType.id,
      version: 1,
      status: 'ACTIVE'
    }, rootType);

    expect(child.parentTypeDefinitionId).toBe(rootType.id);

    expect(() => createTypeDefinition({
      ...child,
      id: asId<'TypeDefinitionId'>('TYPE-BAD', 'Type Definition'),
      objectFamily: 'CHANGE'
    }, rootType)).toThrow(KernelInvariantError);
  });

  it('enforces enumeration and reference attribute semantics', () => {
    expect(attribute.enumerationDefinitionId).toBe(enumeration.id);

    expect(() => createAttributeDefinition({
      ...attribute,
      id: asId<'AttributeDefinitionId'>('ATTR-BAD-ENUM', 'Attribute Definition'),
      dataType: 'STRING'
    }, enumeration)).toThrow(KernelInvariantError);

    expect(() => createAttributeDefinition({
      id: asId<'AttributeDefinitionId'>('ATTR-BAD-REF', 'Attribute Definition'),
      tenantId,
      code: 'OWNER',
      name: 'Owner',
      dataType: 'REFERENCE',
      version: 1,
      status: 'ACTIVE'
    })).toThrow(KernelInvariantError);
  });

  it('governs enumeration values, type attributes and constraints', () => {
    const value = createEnumerationValue({
      id: asId<'EnumerationValueId'>('ENUMV-ACTIVE', 'Enumeration Value'),
      tenantId,
      enumerationDefinitionId: enumeration.id,
      code: 'ACTIVE',
      label: 'Active',
      sequence: 10,
      status: 'ACTIVE'
    }, enumeration);
    expect(value.code).toBe('ACTIVE');

    const assignment = createTypeAttributeAssignment({
      id: asId<'TypeAttributeAssignmentId'>('TYPEATTR-1', 'Type Attribute Assignment'),
      tenantId,
      typeDefinitionId: rootType.id,
      attributeDefinitionId: attribute.id,
      sequence: 10,
      required: true,
      cardinality: 'SINGLE',
      status: 'ACTIVE'
    }, rootType, attribute);

    const constraint = createConstraintDefinition({
      id: asId<'ConstraintDefinitionId'>('CONSTRAINT-1', 'Constraint Definition'),
      tenantId,
      code: 'STATUS-REQUIRED',
      name: 'Status required',
      constraintType: 'REQUIRED',
      configuration: {},
      version: 1,
      status: 'ACTIVE'
    });

    const constraintAssignment = createAttributeConstraintAssignment({
      id: asId<'AttributeConstraintAssignmentId'>('ATTRCON-1', 'Attribute Constraint Assignment'),
      tenantId,
      typeAttributeAssignmentId: assignment.id,
      constraintDefinitionId: constraint.id,
      sequence: 10,
      mandatory: true,
      status: 'ACTIVE'
    }, assignment, constraint);

    expect(constraintAssignment.mandatory).toBe(true);
  });
});
