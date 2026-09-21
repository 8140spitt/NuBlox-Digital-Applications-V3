import type {
  ConstructionContextProfile,
  DeliveryDomainDefinition,
  IndustryJobProfileDefinition,
  IndustrySolutionDefinition
} from './industry.js';
import type { CanonicalObjectIdentity } from './model.js';
import type {
  DeliveryCapabilityFulfilment,
  DeliveryCapabilityRequirement,
  TenantIndustryCapability,
  TenantServiceJobProfile,
  TenantServiceOffering
} from './industry-delivery.js';

function assertSameTenant(left: string, right: string, label: string) {
  if (left !== right) throw new Error(`${label} must belong to the same tenant.`);
}

function assertPeriod(from?: string, to?: string) {
  if (from && Number.isNaN(Date.parse(from))) throw new Error('Effective from must be a valid date.');
  if (to && Number.isNaN(Date.parse(to))) throw new Error('Effective to must be a valid date.');
  if (from && to && Date.parse(to) < Date.parse(from)) {
    throw new Error('Effective to must not precede effective from.');
  }
}

export function createTenantServiceOffering(
  input: TenantServiceOffering,
  object: CanonicalObjectIdentity,
  industry: IndustrySolutionDefinition,
  domain: DeliveryDomainDefinition
): TenantServiceOffering {
  assertSameTenant(input.tenantId, object.tenantId, 'Service Offering and canonical object');
  if (object.objectType !== 'SERVICE_OFFERING') throw new Error('Service Offering canonical object type is invalid.');
  if (input.canonicalObjectId !== object.id) throw new Error('Service Offering must reference its canonical object.');
  if (industry.id !== input.industrySolutionId || industry.status !== 'ACTIVE') {
    throw new Error('Service Offering requires an ACTIVE Industry Solution.');
  }
  if (
    domain.id !== input.deliveryDomainId ||
    domain.industrySolutionId !== input.industrySolutionId ||
    domain.status !== 'ACTIVE'
  ) {
    throw new Error('Service Offering requires an ACTIVE Delivery Domain in the same Industry Solution.');
  }
  if (!input.code.trim() || !input.name.trim() || !input.description.trim()) {
    throw new Error('Service Offering code, name and description are required.');
  }
  return Object.freeze({ ...input });
}

export function createTenantServiceJobProfile(
  input: TenantServiceJobProfile,
  service: TenantServiceOffering,
  profile: IndustryJobProfileDefinition
): TenantServiceJobProfile {
  assertSameTenant(input.tenantId, service.tenantId, 'Service capability and Service Offering');
  if (service.id !== input.serviceOfferingId || service.status !== 'ACTIVE') {
    throw new Error('Service capability requires an ACTIVE Service Offering.');
  }
  if (
    profile.id !== input.industryJobProfileId ||
    profile.industrySolutionId !== service.industrySolutionId ||
    profile.status !== 'ACTIVE'
  ) {
    throw new Error('Service capability requires an ACTIVE Job Profile in the same Industry Solution.');
  }
  return Object.freeze({ ...input });
}

export function createTenantIndustryCapability(
  input: TenantIndustryCapability,
  profile: IndustryJobProfileDefinition
): TenantIndustryCapability {
  if (profile.id !== input.industryJobProfileId || profile.status !== 'ACTIVE') {
    throw new Error('Tenant capability requires an ACTIVE Industry Job Profile.');
  }
  return Object.freeze({ ...input });
}

export function createDeliveryCapabilityRequirement(
  input: DeliveryCapabilityRequirement,
  object: CanonicalObjectIdentity,
  context: ConstructionContextProfile,
  service: TenantServiceOffering,
  profile: IndustryJobProfileDefinition,
  serviceProfile: TenantServiceJobProfile
): DeliveryCapabilityRequirement {
  assertSameTenant(input.tenantId, object.tenantId, 'Capability Requirement and canonical object');
  assertSameTenant(input.tenantId, context.tenantId, 'Capability Requirement and delivery context');
  assertSameTenant(input.tenantId, service.tenantId, 'Capability Requirement and Service Offering');
  if (object.objectType !== 'DELIVERY_CAPABILITY_REQUIREMENT') {
    throw new Error('Capability Requirement canonical object type is invalid.');
  }
  if (input.canonicalObjectId !== object.id) {
    throw new Error('Capability Requirement must reference its canonical object.');
  }
  if (input.contextObjectId !== context.canonicalObjectId || context.status !== 'ACTIVE') {
    throw new Error('Capability Requirement requires an ACTIVE Construction Context.');
  }
  if (!['PROJECT', 'PROGRAMME', 'CONTRACT', 'APPOINTMENT', 'WORK_PACKAGE', 'SERVICE'].includes(context.contextType)) {
    throw new Error('Capability Requirement context is not a supported delivery context.');
  }
  if (service.id !== input.serviceOfferingId || service.status !== 'ACTIVE') {
    throw new Error('Capability Requirement requires an ACTIVE Service Offering.');
  }
  if (profile.id !== input.industryJobProfileId || profile.status !== 'ACTIVE') {
    throw new Error('Capability Requirement requires an ACTIVE Industry Job Profile.');
  }
  if (
    serviceProfile.serviceOfferingId !== service.id ||
    serviceProfile.industryJobProfileId !== profile.id ||
    serviceProfile.status !== 'ACTIVE'
  ) {
    throw new Error('The selected profession is not configured for this Service Offering.');
  }
  if (!Number.isInteger(input.requiredHeadcount) || input.requiredHeadcount < 1) {
    throw new Error('Required headcount must be a positive whole number.');
  }
  if (!input.description.trim()) throw new Error('Capability Requirement description is required.');
  assertPeriod(input.effectiveFrom, input.effectiveTo);
  return Object.freeze({ ...input });
}

export function createDeliveryCapabilityFulfilment(
  input: DeliveryCapabilityFulfilment,
  requirement: DeliveryCapabilityRequirement
): DeliveryCapabilityFulfilment {
  assertSameTenant(input.tenantId, requirement.tenantId, 'Capability Fulfilment and Requirement');
  if (input.requirementId !== requirement.id || requirement.status === 'CANCELLED') {
    throw new Error('Capability Fulfilment requires an active Requirement.');
  }
  if (input.requirementSharePercent <= 0 || input.requirementSharePercent > 100) {
    throw new Error('Requirement share must be greater than 0 and no more than 100 percent.');
  }
  if (
    input.resourceCapacityPercent !== undefined &&
    (input.resourceCapacityPercent < 0 || input.resourceCapacityPercent > 100)
  ) {
    throw new Error('Resource capacity must be between 0 and 100 percent.');
  }
  if (input.fulfilmentType === 'EXTERNAL' && input.providerType !== 'ORGANISATION') {
    throw new Error('External capability must initially be fulfilled by an Organisation.');
  }
  assertPeriod(input.effectiveFrom, input.effectiveTo);
  return Object.freeze({ ...input });
}
