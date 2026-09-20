import type {
  CanonicalObjectId,
  ConstructionContextProfileId,
  ConstructionWorkProductTypeId,
  DeliveryDomainId,
  IndustryJobProfileId,
  IndustryObjectClassificationId,
  IndustrySolutionId,
  JobProfileId,
  PersonId,
  SectorClassificationSchemeId,
  SectorClassificationValueId,
  TenantId
} from './ids.js';
import type { AuthoringMode } from './deliverables.js';
import type { RecordStatus } from './model.js';

export interface IndustrySolutionDefinition {
  id: IndustrySolutionId;
  code: string;
  name: string;
  description: string;
  status: RecordStatus;
}

export interface DeliveryDomainDefinition {
  id: DeliveryDomainId;
  industrySolutionId: IndustrySolutionId;
  code: string;
  name: string;
  purpose: string;
  sequence: number;
  status: RecordStatus;
}

export interface IndustryJobProfileDefinition {
  id: IndustryJobProfileId;
  industrySolutionId: IndustrySolutionId;
  jobProfileId: JobProfileId;
  primaryDeliveryDomainId: DeliveryDomainId;
  sequence: number;
  canonicalName: string;
  source: string;
  sourceVerifiedDate: string;
  status: RecordStatus;
}

export interface IndustryJobCapabilityProfile {
  industryJobProfileId: IndustryJobProfileId;
  specialistCapabilities: ReadonlyArray<string>;
  primaryStructuredRecords: ReadonlyArray<string>;
  lifecycleStages: ReadonlyArray<string>;
}

export interface SectorClassificationScheme {
  id: SectorClassificationSchemeId;
  industrySolutionId: IndustrySolutionId;
  code: string;
  name: string;
  version: string;
  description?: string;
  status: RecordStatus;
}

export interface SectorClassificationValue {
  id: SectorClassificationValueId;
  schemeId: SectorClassificationSchemeId;
  code: string;
  name: string;
  parentValueId?: SectorClassificationValueId;
  description?: string;
  status: RecordStatus;
}

export interface IndustryObjectClassification {
  id: IndustryObjectClassificationId;
  tenantId: TenantId;
  canonicalObjectId: CanonicalObjectId;
  classificationValueId: SectorClassificationValueId;
  assignedAt: string;
  assignedByPersonId?: PersonId;
}

export type ConstructionContextType =
  | 'PORTFOLIO'
  | 'PROGRAMME'
  | 'OPPORTUNITY'
  | 'TENDER'
  | 'PROJECT'
  | 'CONTRACT'
  | 'APPOINTMENT'
  | 'WORK_PACKAGE'
  | 'SITE'
  | 'FACILITY'
  | 'BUILDING'
  | 'ZONE'
  | 'LEVEL'
  | 'SPACE'
  | 'SYSTEM'
  | 'ASSET'
  | 'PRODUCTION_ORDER'
  | 'FABRICATION_ORDER'
  | 'SERVICE'
  | 'MAINTENANCE';

export interface ConstructionContextProfile {
  id: ConstructionContextProfileId;
  tenantId: TenantId;
  canonicalObjectId: CanonicalObjectId;
  contextType: ConstructionContextType;
  code: string;
  name: string;
  parentContextObjectId?: CanonicalObjectId;
  status: RecordStatus;
}

export type ConstructionWorkProductCategory =
  | 'DESIGN_TECHNICAL'
  | 'COMMERCIAL_CONTRACTUAL'
  | 'PROCUREMENT_SUPPLY'
  | 'PRODUCTION_FABRICATION'
  | 'SITE_DELIVERY'
  | 'COMMISSIONING_HANDOVER'
  | 'OPERATIONS_MAINTENANCE';

export interface ConstructionWorkProductType {
  id: ConstructionWorkProductTypeId;
  industrySolutionId: IndustrySolutionId;
  code: string;
  name: string;
  category: ConstructionWorkProductCategory;
  defaultAuthoringMode: AuthoringMode;
  governedOutputType: string;
  defaultRepresentationTypes: ReadonlyArray<string>;
  status: RecordStatus;
}
