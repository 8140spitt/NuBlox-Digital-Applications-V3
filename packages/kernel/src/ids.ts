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
export type AccessRoleId = Brand<string, 'AccessRoleId'>;
export type AccessRolePermissionId = Brand<string, 'AccessRolePermissionId'>;
export type AccessRoleAssignmentId = Brand<string, 'AccessRoleAssignmentId'>;
export type WorkflowDefinitionId = Brand<string, 'WorkflowDefinitionId'>;
export type WorkflowDefinitionVersionId = Brand<string, 'WorkflowDefinitionVersionId'>;
export type WorkflowInstanceId = Brand<string, 'WorkflowInstanceId'>;
export type WorkItemId = Brand<string, 'WorkItemId'>;
export type WorkAssignmentId = Brand<string, 'WorkAssignmentId'>;
export type InformationContainerId = Brand<string, 'InformationContainerId'>;
export type InformationRevisionId = Brand<string, 'InformationRevisionId'>;
export type InformationIterationId = Brand<string, 'InformationIterationId'>;
export type RepresentationId = Brand<string, 'RepresentationId'>;
export type InformationIssueId = Brand<string, 'InformationIssueId'>;
export type ConfigurationItemId = Brand<string, 'ConfigurationItemId'>;
export type BaselineId = Brand<string, 'BaselineId'>;
export type BaselineItemId = Brand<string, 'BaselineItemId'>;
export type EffectivityId = Brand<string, 'EffectivityId'>;
export type ChangeId = Brand<string, 'ChangeId'>;
export type ChangeAffectedObjectId = Brand<string, 'ChangeAffectedObjectId'>;
export type ChangeImpactAssessmentId = Brand<string, 'ChangeImpactAssessmentId'>;
export type ChangeImplementationActionId = Brand<string, 'ChangeImplementationActionId'>;
export type ChangeVerificationId = Brand<string, 'ChangeVerificationId'>;
export type ChangeDiscrepancyId = Brand<string, 'ChangeDiscrepancyId'>;
export type OutboxMessageId = Brand<string, 'OutboxMessageId'>;
export type IntegrationJobId = Brand<string, 'IntegrationJobId'>;
export type IdempotencyRecordId = Brand<string, 'IdempotencyRecordId'>;
export type DataEnvelopeId = Brand<string, 'DataEnvelopeId'>;
export type ExternalIdentityId = Brand<string, 'ExternalIdentityId'>;
export type MigrationReconciliationId = Brand<string, 'MigrationReconciliationId'>;
export type ProjectionCheckpointId = Brand<string, 'ProjectionCheckpointId'>;

export function asId<T extends string>(value: string, label: string): Brand<string, T> {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${label} must not be empty.`);
  }

  return trimmed as Brand<string, T>;
}
