import type {
  CanonicalObjectId,
  CanonicalRelationshipId,
  RelationshipAttributeAssignmentId,
  RelationshipAttributeValueId,
  RelationshipTypeDefinitionId,
  TenantId,
  ThingAttributeValueId,
  TypeAttributeAssignmentId,
  TypeDefinitionId
} from './ids.js';
import type { MetadataDataType } from './metadata.js';
import type { RecordStatus } from './model.js';

export interface Thing {
  id: CanonicalObjectId;
  tenantId: TenantId;
  typeDefinitionId: TypeDefinitionId;
  typeCode: string;
  stableKey: string;
  displayName?: string;
  status: RecordStatus;
  createdAt: string;
}

export interface ThingAttributeValue {
  id: ThingAttributeValueId;
  tenantId: TenantId;
  thingId: CanonicalObjectId;
  typeAttributeAssignmentId: TypeAttributeAssignmentId;
  sequence: number;
  dataType: MetadataDataType;
  value: unknown;
}

export interface ThingRelationship {
  id: CanonicalRelationshipId;
  tenantId: TenantId;
  relationshipTypeDefinitionId: RelationshipTypeDefinitionId;
  relationshipCode: string;
  fromThingId: CanonicalObjectId;
  toThingId: CanonicalObjectId;
  effectiveFrom: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export interface ThingRelationshipAttributeValue {
  id: RelationshipAttributeValueId;
  tenantId: TenantId;
  relationshipId: CanonicalRelationshipId;
  relationshipAttributeAssignmentId: RelationshipAttributeAssignmentId;
  sequence: number;
  dataType: MetadataDataType;
  value: unknown;
}
