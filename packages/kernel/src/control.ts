import type {
  AuthorityGrantId,
  BusinessEventId,
  CanonicalObjectId,
  DecisionId,
  EvidenceRecordId,
  LifecycleDefinitionId,
  LifecycleStateDefinitionId,
  LifecycleTransitionDefinitionId,
  ObjectLifecycleStateId,
  PersonId,
  TenantId
} from './ids.js';
import type { RecordStatus } from './model.js';

export type LifecycleStateCategory =
  | 'DRAFT'
  | 'ACTIVE'
  | 'RELEASED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'SUPERSEDED';

export interface LifecycleDefinition {
  id: LifecycleDefinitionId;
  tenantId: TenantId;
  code: string;
  name: string;
  objectType: string;
  status: RecordStatus;
}

export interface LifecycleStateDefinition {
  id: LifecycleStateDefinitionId;
  tenantId: TenantId;
  lifecycleDefinitionId: LifecycleDefinitionId;
  code: string;
  name: string;
  category: LifecycleStateCategory;
  initial: boolean;
  terminal: boolean;
  status: RecordStatus;
}

export interface LifecycleTransitionDefinition {
  id: LifecycleTransitionDefinitionId;
  tenantId: TenantId;
  lifecycleDefinitionId: LifecycleDefinitionId;
  code: string;
  name: string;
  fromStateId: LifecycleStateDefinitionId;
  toStateId: LifecycleStateDefinitionId;
  requiresDecision: boolean;
  requiredDecisionType?: string;
  requiredDecisionOutcome?: string;
  status: RecordStatus;
}

export interface Decision {
  id: DecisionId;
  tenantId: TenantId;
  decisionType: string;
  subjectObjectId: CanonicalObjectId;
  subjectVersion?: string;
  outcome: string;
  reason: string;
  deciderPersonId: PersonId;
  authorityGrantId?: AuthorityGrantId;
  decidedAt: string;
}

export interface ObjectLifecycleState {
  id: ObjectLifecycleStateId;
  tenantId: TenantId;
  canonicalObjectId: CanonicalObjectId;
  lifecycleDefinitionId: LifecycleDefinitionId;
  lifecycleStateId: LifecycleStateDefinitionId;
  subjectVersion?: string;
  sequence: number;
  effectiveAt: string;
  transitionId?: LifecycleTransitionDefinitionId;
  decisionId?: DecisionId;
}

export interface BusinessEvent {
  id: BusinessEventId;
  tenantId: TenantId;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  subjectObjectId?: CanonicalObjectId;
  actorPersonId?: PersonId;
  correlationId?: string;
  occurredAt: string;
  payload?: Readonly<Record<string, unknown>>;
}

export interface EvidenceRecord {
  id: EvidenceRecordId;
  tenantId: TenantId;
  evidenceType: string;
  subjectObjectId: CanonicalObjectId;
  subjectVersion?: string;
  capturedByPersonId?: PersonId;
  capturedAt: string;
  contentReference?: string;
  integrityHash?: string;
  metadata?: Readonly<Record<string, unknown>>;
}
