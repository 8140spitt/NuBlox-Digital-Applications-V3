import type {
  AuthorityDefinitionId,
  AuthorityGrantId,
  CanonicalObjectId,
  CanonicalRelationshipId,
  DelegationId,
  JobProfileId,
  OrganisationId,
  OrganisationUnitId,
  PartyId,
  PersonId,
  PositionId,
  PositionOccupancyId,
  TenantId
} from './ids.js';

export type RecordStatus = 'ACTIVE' | 'INACTIVE';

/**
 * Structural persistence shape only. This is not a NuBlox Party Type.
 */
export type PartyEntityKind = 'PERSON' | 'ORGANISATION';

/**
 * Canonical NuBlox Party Types.
 * A Party may hold more than one Party Type where the business relationship requires it
 * (for example an Organisation may be both CLIENT and VENDOR_SUPPLIER).
 */
export type PartyType = 'TENANT' | 'EMPLOYEE' | 'CLIENT' | 'VENDOR_SUPPLIER';

/** @deprecated Use PartyEntityKind when referring to structural identity shape. */
export type PartyKind = PartyEntityKind;

export interface Tenant {
  id: TenantId;
  slug?: string;
  name: string;
  status: RecordStatus;
}

export interface Party {
  id: PartyId;
  tenantId: TenantId;
  kind: PartyEntityKind;
  displayName: string;
  partyTypes?: readonly PartyType[];
  status: RecordStatus;
}

export interface PartyTypeAssignment {
  tenantId: TenantId;
  partyId: PartyId;
  partyType: PartyType;
  status: RecordStatus;
}

export interface Person {
  id: PersonId;
  tenantId: TenantId;
  partyId: PartyId;
  legalName: string;
  preferredName?: string;
  status: RecordStatus;
}

export interface Organisation {
  id: OrganisationId;
  tenantId: TenantId;
  partyId: PartyId;
  legalName: string;
  tradingName?: string;
  status: RecordStatus;
}

export interface OrganisationUnit {
  id: OrganisationUnitId;
  tenantId: TenantId;
  organisationId: OrganisationId;
  parentUnitId?: OrganisationUnitId;
  code: string;
  name: string;
  status: RecordStatus;
}

export interface JobProfile {
  id: JobProfileId;
  catalogueScope: 'PLATFORM' | 'TENANT';
  tenantId?: TenantId;
  code: string;
  name: string;
  status: RecordStatus;
}

export interface Position {
  id: PositionId;
  tenantId: TenantId;
  organisationUnitId: OrganisationUnitId;
  jobProfileId?: JobProfileId;
  code: string;
  title: string;
  status: RecordStatus;
}

export interface PositionOccupancy {
  id: PositionOccupancyId;
  tenantId: TenantId;
  positionId: PositionId;
  personId: PersonId;
  effectiveFrom: string;
  effectiveTo?: string;
}

export type AuthorityType =
  | 'FINANCIAL'
  | 'CONTRACTUAL'
  | 'TECHNICAL'
  | 'OPERATIONAL'
  | 'GOVERNANCE';

export interface AuthorityDefinition {
  id: AuthorityDefinitionId;
  tenantId: TenantId;
  code: string;
  name: string;
  authorityType: AuthorityType;
  unit?: string;
  status: RecordStatus;
}

export type AuthorityGranteeType = 'PERSON' | 'POSITION' | 'ORGANISATION_UNIT';

export interface AuthorityGrant {
  id: AuthorityGrantId;
  tenantId: TenantId;
  authorityDefinitionId: AuthorityDefinitionId;
  granteeType: AuthorityGranteeType;
  granteeId: string;
  scopeType: string;
  scopeId?: string;
  limitValue?: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export interface Delegation {
  id: DelegationId;
  tenantId: TenantId;
  authorityGrantId: AuthorityGrantId;
  delegatedByPersonId: PersonId;
  delegatedToPersonId: PersonId;
  effectiveFrom: string;
  effectiveTo?: string;
  reason: string;
  status: RecordStatus;
}

export interface PermissionDefinition {
  key: string;
  name: string;
  description: string;
}

export interface CanonicalObjectIdentity {
  id: CanonicalObjectId;
  tenantId: TenantId;
  objectType: string;
  stableKey: string;
  createdAt: string;
}

export interface CanonicalRelationship {
  id: CanonicalRelationshipId;
  tenantId: TenantId;
  relationshipType: string;
  fromObjectId: CanonicalObjectId;
  toObjectId: CanonicalObjectId;
  effectiveFrom: string;
  effectiveTo?: string;
  status: RecordStatus;
  metadata?: Readonly<Record<string, string | number | boolean>>;
}
