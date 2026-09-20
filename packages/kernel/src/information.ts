import type {
  BaselineId,
  BaselineItemId,
  CanonicalObjectId,
  ConfigurationItemId,
  DecisionId,
  EffectivityId,
  InformationContainerId,
  InformationIssueId,
  InformationIterationId,
  InformationRevisionId,
  PersonId,
  RepresentationId,
  TenantId
} from './ids.js';
import type { RecordStatus } from './model.js';

export type InformationRevisionStatus =
  | 'DRAFT'
  | 'RELEASED'
  | 'SUPERSEDED'
  | 'WITHDRAWN';

export type InformationIterationStatus = 'WORKING' | 'FROZEN';

export type RepresentationType =
  | 'NATIVE'
  | 'PDF'
  | 'IMAGE'
  | 'DATA'
  | 'REPORT'
  | 'OTHER';

export interface InformationContainer {
  id: InformationContainerId;
  tenantId: TenantId;
  canonicalObjectId: CanonicalObjectId;
  containerType: string;
  code: string;
  title: string;
  status: RecordStatus;
}

export interface InformationRevision {
  id: InformationRevisionId;
  tenantId: TenantId;
  informationContainerId: InformationContainerId;
  revision: string;
  status: InformationRevisionStatus;
  createdAt: string;
  releasedAt?: string;
  releaseDecisionId?: DecisionId;
  releasedIterationId?: InformationIterationId;
  supersededByRevisionId?: InformationRevisionId;
}

export interface InformationIteration {
  id: InformationIterationId;
  tenantId: TenantId;
  informationRevisionId: InformationRevisionId;
  iteration: number;
  status: InformationIterationStatus;
  createdAt: string;
  authorPersonId?: PersonId;
}

export interface Representation {
  id: RepresentationId;
  tenantId: TenantId;
  informationIterationId: InformationIterationId;
  representationType: RepresentationType;
  mediaType: string;
  fileName?: string;
  contentReference: string;
  integrityHash?: string;
  generatedAt: string;
}

export interface InformationIssue {
  id: InformationIssueId;
  tenantId: TenantId;
  informationContainerId: InformationContainerId;
  informationRevisionId: InformationRevisionId;
  representationId?: RepresentationId;
  issueReference: string;
  issuePurpose: string;
  issuedByPersonId: PersonId;
  issuedAt: string;
  recipientContext?: string;
}

export interface ConfigurationItem {
  id: ConfigurationItemId;
  tenantId: TenantId;
  canonicalObjectId: CanonicalObjectId;
  code: string;
  name: string;
  status: RecordStatus;
}

export type BaselineStatus = 'DRAFT' | 'ESTABLISHED' | 'SUPERSEDED';

export interface Baseline {
  id: BaselineId;
  tenantId: TenantId;
  contextObjectId: CanonicalObjectId;
  code: string;
  name: string;
  status: BaselineStatus;
  establishedAt?: string;
  establishmentDecisionId?: DecisionId;
  supersededByBaselineId?: BaselineId;
}

export interface BaselineItem {
  id: BaselineItemId;
  tenantId: TenantId;
  baselineId: BaselineId;
  configurationItemId: ConfigurationItemId;
  subjectVersion: string;
}

export type EffectivityType =
  | 'DATE'
  | 'SERIAL'
  | 'LOT'
  | 'UNIT'
  | 'PROJECT'
  | 'LOCATION'
  | 'CUSTOM';

export interface Effectivity {
  id: EffectivityId;
  tenantId: TenantId;
  configurationItemId: ConfigurationItemId;
  subjectVersion: string;
  effectivityType: EffectivityType;
  scopeType: string;
  scopeId?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  expression?: string;
  status: RecordStatus;
}
