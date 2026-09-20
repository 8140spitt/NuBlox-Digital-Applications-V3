export type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

export type TenantId = Brand<string, 'TenantId'>;
export type PartyId = Brand<string, 'PartyId'>;
export type PersonId = Brand<string, 'PersonId'>;
export type OrganisationId = Brand<string, 'OrganisationId'>;
export type OrganisationUnitId = Brand<string, 'OrganisationUnitId'>;
export type PositionId = Brand<string, 'PositionId'>;
export type PositionOccupancyId = Brand<string, 'PositionOccupancyId'>;
export type JobProfileId = Brand<string, 'JobProfileId'>;
export type AuthorityDefinitionId = Brand<string, 'AuthorityDefinitionId'>;
export type AuthorityGrantId = Brand<string, 'AuthorityGrantId'>;
export type DelegationId = Brand<string, 'DelegationId'>;
export type CanonicalObjectId = Brand<string, 'CanonicalObjectId'>;
export type CanonicalRelationshipId = Brand<string, 'CanonicalRelationshipId'>;
export type LifecycleDefinitionId = Brand<string, 'LifecycleDefinitionId'>;
export type LifecycleStateDefinitionId = Brand<string, 'LifecycleStateDefinitionId'>;
export type LifecycleTransitionDefinitionId = Brand<string, 'LifecycleTransitionDefinitionId'>;
export type ObjectLifecycleStateId = Brand<string, 'ObjectLifecycleStateId'>;
export type DecisionId = Brand<string, 'DecisionId'>;
export type BusinessEventId = Brand<string, 'BusinessEventId'>;
export type EvidenceRecordId = Brand<string, 'EvidenceRecordId'>;

export function asId<T extends string>(value: string, label: string): Brand<string, T> {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${label} must not be empty.`);
  }

  return trimmed as Brand<string, T>;
}
