import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  createConstructionContextProfile,
  createDeliveryCapabilityFulfilment,
  createDeliveryCapabilityRequirement,
  createTenantIndustryCapability,
  createTenantServiceJobProfile,
  createTenantServiceOffering,
  type CanonicalObjectIdentity,
  type ConstructionContextProfile,
  type DeliveryCapabilityFulfilment,
  type DeliveryCapabilityFulfilmentType,
  type DeliveryCapabilityProviderType,
  type DeliveryCapabilityRequirement,
  type DeliveryCapabilitySourcingStrategy,
  type DeliveryDomainDefinition,
  type IndustryJobProfileDefinition,
  type IndustrySolutionDefinition,
  type ServiceCapabilityRole,
  type TenantCapabilitySupplyModel,
  type TenantId,
  type TenantIndustryCapability,
  type TenantServiceJobProfile,
  type TenantServiceOffering
} from '@nublox/kernel';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';

interface IndustryRow extends RowDataPacket {
  id: string; code: string; name: string; description: string; status: 'ACTIVE' | 'INACTIVE';
}
interface DomainRow extends RowDataPacket {
  id: string; industry_solution_id: string; code: string; name: string; purpose: string;
  sequence: number; status: 'ACTIVE' | 'INACTIVE';
}
interface IndustryJobRow extends RowDataPacket {
  id: string; industry_solution_id: string; job_profile_id: string; primary_delivery_domain_id: string;
  sequence: number; canonical_name: string; source_name: string; source_verified_date: Date | string;
  status: 'ACTIVE' | 'INACTIVE';
}
interface ObjectRow extends RowDataPacket {
  id: string; tenant_id: string; object_type: string; stable_key: string; created_at: Date;
}
interface ContextRow extends RowDataPacket {
  id: string; tenant_id: string; canonical_object_id: string; context_type: ConstructionContextProfile['contextType'];
  code: string; name: string; parent_context_object_id: string | null; status: 'ACTIVE' | 'INACTIVE';
}
interface ServiceRow extends RowDataPacket {
  id: string; tenant_id: string; canonical_object_id: string; industry_solution_id: string;
  delivery_domain_id: string; code: string; name: string; description: string; status: 'ACTIVE' | 'INACTIVE';
}
interface ServiceJobRow extends RowDataPacket {
  id: string; tenant_id: string; service_offering_id: string; industry_job_profile_id: string;
  role: ServiceCapabilityRole; status: 'ACTIVE' | 'INACTIVE';
}
interface RequirementRow extends RowDataPacket {
  id: string; tenant_id: string; canonical_object_id: string; context_object_id: string;
  service_offering_id: string; industry_job_profile_id: string; description: string;
  required_headcount: number; sourcing_strategy: DeliveryCapabilitySourcingStrategy;
  effective_from: Date | null; effective_to: Date | null;
  status: DeliveryCapabilityRequirement['status'];
}
interface ShareRow extends RowDataPacket { total_share: string | number | null; }
interface IdRow extends RowDataPacket { id: string; }
interface PositionMatchRow extends RowDataPacket {
  id: string; organisation_id: string; job_profile_id: string | null;
}

export class IndustryDeliveryCommandError extends Error {
  constructor(
    message: string,
    readonly code: 'PERMISSION_DENIED' | 'INVALID_INPUT' | 'NOT_FOUND' | 'CONFLICT'
  ) {
    super(message);
    this.name = 'IndustryDeliveryCommandError';
  }
}

function required(value: string | undefined, label: string): string {
  const result = value?.trim() ?? '';
  if (!result) throw new IndustryDeliveryCommandError(`${label} is required.`, 'INVALID_INPUT');
  return result;
}
function optional(value: string | undefined): string | undefined {
  const result = value?.trim() ?? '';
  return result || undefined;
}
function dateValue(value: string | undefined, label: string): string | undefined {
  const raw = optional(value);
  if (!raw) return undefined;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new IndustryDeliveryCommandError(`${label} must be a valid date/time.`, 'INVALID_INPUT');
  }
  return date.toISOString();
}
function positiveInteger(value: number | string, label: string): number {
  const result = Number(value);
  if (!Number.isInteger(result) || result < 1) {
    throw new IndustryDeliveryCommandError(`${label} must be a positive whole number.`, 'INVALID_INPUT');
  }
  return result;
}
function percent(value: number | string, label: string): number {
  const result = Number(value);
  if (!Number.isFinite(result) || result <= 0 || result > 100) {
    throw new IndustryDeliveryCommandError(`${label} must be greater than 0 and no more than 100.`, 'INVALID_INPUT');
  }
  return result;
}
function optionalPercent(value: number | string | undefined, label: string): number | undefined {
  if (value === undefined || value === '') return undefined;
  const result = Number(value);
  if (!Number.isFinite(result) || result < 0 || result > 100) {
    throw new IndustryDeliveryCommandError(`${label} must be between 0 and 100.`, 'INVALID_INPUT');
  }
  return result;
}
function now() { return new Date().toISOString(); }
function dateOnly(value: Date | string) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}
function databaseDate(value?: string) { return value ? new Date(value) : null; }

async function writeAudit(
  connection: PoolConnection,
  tenantId: string,
  entityType: string,
  entityId: string,
  action: string,
  actorPersonId: string,
  payload: unknown
) {
  await connection.execute(
    `INSERT INTO kernel_audit_entries
      (tenant_id, entity_type, entity_id, action, actor_person_id, correlation_id, payload)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [tenantId, entityType, entityId, action, actorPersonId, 'INDUSTRY-DELIVERY', JSON.stringify(payload)]
  );
  await writeOutboxEvent(connection, {
    tenantId,
    aggregateType: entityType,
    aggregateId: entityId,
    eventType: `${entityType}.${action}`,
    payload
  });
}

function mapIndustry(row: IndustryRow): IndustrySolutionDefinition {
  return {
    id: row.id as IndustrySolutionDefinition['id'], code: row.code, name: row.name,
    description: row.description, status: row.status
  };
}
function mapDomain(row: DomainRow): DeliveryDomainDefinition {
  return {
    id: row.id as DeliveryDomainDefinition['id'],
    industrySolutionId: row.industry_solution_id as DeliveryDomainDefinition['industrySolutionId'],
    code: row.code, name: row.name, purpose: row.purpose, sequence: Number(row.sequence), status: row.status
  };
}
function mapJob(row: IndustryJobRow): IndustryJobProfileDefinition {
  return {
    id: row.id as IndustryJobProfileDefinition['id'],
    industrySolutionId: row.industry_solution_id as IndustryJobProfileDefinition['industrySolutionId'],
    jobProfileId: row.job_profile_id as IndustryJobProfileDefinition['jobProfileId'],
    primaryDeliveryDomainId: row.primary_delivery_domain_id as IndustryJobProfileDefinition['primaryDeliveryDomainId'],
    sequence: Number(row.sequence), canonicalName: row.canonical_name, source: row.source_name,
    sourceVerifiedDate: dateOnly(row.source_verified_date), status: row.status
  };
}
function mapObject(row: ObjectRow): CanonicalObjectIdentity {
  return {
    id: row.id as CanonicalObjectIdentity['id'], tenantId: row.tenant_id as TenantId,
    objectType: row.object_type, stableKey: row.stable_key, createdAt: row.created_at.toISOString()
  };
}
function mapContext(row: ContextRow): ConstructionContextProfile {
  return {
    id: row.id as ConstructionContextProfile['id'], tenantId: row.tenant_id as TenantId,
    canonicalObjectId: row.canonical_object_id as ConstructionContextProfile['canonicalObjectId'],
    contextType: row.context_type, code: row.code, name: row.name,
    ...(row.parent_context_object_id ? { parentContextObjectId: row.parent_context_object_id as ConstructionContextProfile['canonicalObjectId'] } : {}),
    status: row.status
  };
}
function mapService(row: ServiceRow): TenantServiceOffering {
  return {
    id: row.id as TenantServiceOffering['id'], tenantId: row.tenant_id as TenantId,
    canonicalObjectId: row.canonical_object_id as TenantServiceOffering['canonicalObjectId'],
    industrySolutionId: row.industry_solution_id as TenantServiceOffering['industrySolutionId'],
    deliveryDomainId: row.delivery_domain_id as TenantServiceOffering['deliveryDomainId'],
    code: row.code, name: row.name, description: row.description, status: row.status
  };
}
function mapServiceJob(row: ServiceJobRow): TenantServiceJobProfile {
  return {
    id: row.id as TenantServiceJobProfile['id'], tenantId: row.tenant_id as TenantId,
    serviceOfferingId: row.service_offering_id as TenantServiceJobProfile['serviceOfferingId'],
    industryJobProfileId: row.industry_job_profile_id as TenantServiceJobProfile['industryJobProfileId'],
    role: row.role, status: row.status
  };
}
function mapRequirement(row: RequirementRow): DeliveryCapabilityRequirement {
  return {
    id: row.id as DeliveryCapabilityRequirement['id'], tenantId: row.tenant_id as TenantId,
    canonicalObjectId: row.canonical_object_id as DeliveryCapabilityRequirement['canonicalObjectId'],
    contextObjectId: row.context_object_id as DeliveryCapabilityRequirement['contextObjectId'],
    serviceOfferingId: row.service_offering_id as DeliveryCapabilityRequirement['serviceOfferingId'],
    industryJobProfileId: row.industry_job_profile_id as DeliveryCapabilityRequirement['industryJobProfileId'],
    description: row.description, requiredHeadcount: Number(row.required_headcount),
    sourcingStrategy: row.sourcing_strategy,
    ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
    ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
    status: row.status
  };
}

export class MySqlIndustryDeliveryCommandService {
  private readonly access: MySqlAccessRepository;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
  }

  async createProjectContext(
    tenantId: TenantId,
    actorPersonId: string,
    input: { code: string; name: string }
  ): Promise<ConstructionContextProfile> {
    await this.requireManage(tenantId, actorPersonId);
    const code = required(input.code, 'Project code').toUpperCase();
    const createdAt = now();
    const object: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`PROJECT-${randomUUID()}`, 'Canonical Object'),
      tenantId, objectType: 'PROJECT', stableKey: `PROJECT:${code}`, createdAt
    };
    const context: ConstructionContextProfile = {
      id: asId<'ConstructionContextProfileId'>(`CCTX-${randomUUID()}`, 'Construction Context'),
      tenantId, canonicalObjectId: object.id, contextType: 'PROJECT', code,
      name: required(input.name, 'Project name'), status: 'ACTIVE'
    };
    createConstructionContextProfile(context, object);
    try {
      await withTransaction(this.pool, async (connection) => {
        await connection.execute(
          'INSERT INTO canonical_objects (id, tenant_id, object_type, stable_key, created_at) VALUES (?, ?, ?, ?, ?)',
          [object.id, tenantId, object.objectType, object.stableKey, new Date(createdAt)]
        );
        await connection.execute(
          `INSERT INTO construction_context_profiles
            (id, tenant_id, canonical_object_id, context_type, code, name, status, created_by_person_id, updated_by_person_id)
           VALUES (?, ?, ?, 'PROJECT', ?, ?, 'ACTIVE', ?, ?)`,
          [context.id, tenantId, object.id, code, context.name, actorPersonId, actorPersonId]
        );
        await writeAudit(connection, tenantId, 'CONSTRUCTION_CONTEXT_PROFILE', context.id, 'CREATED', actorPersonId, context);
      });
      return context;
    } catch (error) { return this.mapError(error); }
  }

  async createServiceOffering(
    tenantId: TenantId,
    actorPersonId: string,
    input: { deliveryDomainId: string; code: string; name: string; description: string }
  ): Promise<TenantServiceOffering> {
    await this.requireManage(tenantId, actorPersonId);
    const [industry, domain] = await Promise.all([
      this.requireIndustry('CBE'),
      this.requireDomain(input.deliveryDomainId)
    ]);
    const code = required(input.code, 'Service code').toUpperCase();
    const createdAt = now();
    const object: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`SERVICE-${randomUUID()}`, 'Canonical Object'),
      tenantId, objectType: 'SERVICE_OFFERING', stableKey: `SERVICE:${code}`, createdAt
    };
    const service: TenantServiceOffering = {
      id: asId<'TenantServiceOfferingId'>(`SVC-${randomUUID()}`, 'Service Offering'),
      tenantId, canonicalObjectId: object.id, industrySolutionId: industry.id,
      deliveryDomainId: domain.id, code, name: required(input.name, 'Service name'),
      description: required(input.description, 'Service description'), status: 'ACTIVE'
    };
    createTenantServiceOffering(service, object, industry, domain);
    try {
      await withTransaction(this.pool, async (connection) => {
        await connection.execute(
          'INSERT INTO canonical_objects (id, tenant_id, object_type, stable_key, created_at) VALUES (?, ?, ?, ?, ?)',
          [object.id, tenantId, object.objectType, object.stableKey, new Date(createdAt)]
        );
        await connection.execute(
          `INSERT INTO tenant_service_offerings
            (id, tenant_id, canonical_object_id, industry_solution_id, delivery_domain_id,
             code, name, description, status, created_by_person_id, updated_by_person_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
          [service.id, tenantId, object.id, service.industrySolutionId, service.deliveryDomainId,
           service.code, service.name, service.description, actorPersonId, actorPersonId]
        );
        await writeAudit(connection, tenantId, 'SERVICE_OFFERING', service.id, 'CREATED', actorPersonId, service);
      });
      return service;
    } catch (error) { return this.mapError(error); }
  }

  async addServiceProfession(
    tenantId: TenantId,
    actorPersonId: string,
    input: { serviceOfferingId: string; industryJobProfileId: string; role: ServiceCapabilityRole }
  ): Promise<TenantServiceJobProfile> {
    await this.requireManage(tenantId, actorPersonId);
    const [service, profile] = await Promise.all([
      this.requireService(tenantId, input.serviceOfferingId),
      this.requireIndustryJob(input.industryJobProfileId)
    ]);
    const mapping: TenantServiceJobProfile = {
      id: asId<'TenantServiceJobProfileId'>(`SVCJP-${randomUUID()}`, 'Service Job Profile'),
      tenantId, serviceOfferingId: service.id, industryJobProfileId: profile.id,
      role: input.role, status: 'ACTIVE'
    };
    createTenantServiceJobProfile(mapping, service, profile);
    try {
      await this.pool.execute(
        `INSERT INTO tenant_service_job_profiles
          (id, tenant_id, service_offering_id, industry_job_profile_id, role, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
        [mapping.id, tenantId, mapping.serviceOfferingId, mapping.industryJobProfileId, mapping.role, actorPersonId, actorPersonId]
      );
      return mapping;
    } catch (error) { return this.mapError(error); }
  }

  async declareInternalCapability(
    tenantId: TenantId,
    actorPersonId: string,
    input: { industryJobProfileId: string; supplyModel: TenantCapabilitySupplyModel; notes?: string }
  ): Promise<TenantIndustryCapability> {
    await this.requireManage(tenantId, actorPersonId);
    const profile = await this.requireIndustryJob(input.industryJobProfileId);
    const notes = optional(input.notes);
    const capability: TenantIndustryCapability = {
      id: asId<'TenantIndustryCapabilityId'>(`TCAP-${randomUUID()}`, 'Tenant Industry Capability'),
      tenantId, industryJobProfileId: profile.id, supplyModel: input.supplyModel,
      ...(notes ? { notes } : {}), status: 'ACTIVE'
    };
    createTenantIndustryCapability(capability, profile);
    try {
      await this.pool.execute(
        `INSERT INTO tenant_industry_capabilities
          (id, tenant_id, industry_job_profile_id, supply_model, notes, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
        [capability.id, tenantId, capability.industryJobProfileId, capability.supplyModel,
         capability.notes ?? null, actorPersonId, actorPersonId]
      );
      return capability;
    } catch (error) { return this.mapError(error); }
  }

  async createRequirement(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      contextObjectId: string; serviceOfferingId: string; industryJobProfileId: string;
      description: string; requiredHeadcount: number | string;
      sourcingStrategy: DeliveryCapabilitySourcingStrategy; effectiveFrom?: string; effectiveTo?: string;
    }
  ): Promise<DeliveryCapabilityRequirement> {
    await this.requireManage(tenantId, actorPersonId);
    const [context, service, profile, serviceProfile] = await Promise.all([
      this.requireContext(tenantId, input.contextObjectId),
      this.requireService(tenantId, input.serviceOfferingId),
      this.requireIndustryJob(input.industryJobProfileId),
      this.requireServiceJob(tenantId, input.serviceOfferingId, input.industryJobProfileId)
    ]);
    if (['INTERNAL', 'HYBRID'].includes(input.sourcingStrategy)) {
      await this.requireTenantCapability(tenantId, profile.id);
    }
    const createdAt = now();
    const object: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`CAPREQOBJ-${randomUUID()}`, 'Canonical Object'),
      tenantId, objectType: 'DELIVERY_CAPABILITY_REQUIREMENT',
      stableKey: `CAPREQ:${context.code}:${service.code}:${profile.canonicalName}:${randomUUID().slice(0, 8)}`,
      createdAt
    };
    const effectiveFrom = dateValue(input.effectiveFrom, 'Effective from');
    const effectiveTo = dateValue(input.effectiveTo, 'Effective to');
    const requirement: DeliveryCapabilityRequirement = {
      id: asId<'DeliveryCapabilityRequirementId'>(`CAPREQ-${randomUUID()}`, 'Delivery Capability Requirement'),
      tenantId, canonicalObjectId: object.id, contextObjectId: context.canonicalObjectId,
      serviceOfferingId: service.id, industryJobProfileId: profile.id,
      description: required(input.description, 'Requirement description'),
      requiredHeadcount: positiveInteger(input.requiredHeadcount, 'Required headcount'),
      sourcingStrategy: input.sourcingStrategy, ...(effectiveFrom ? { effectiveFrom } : {}),
      ...(effectiveTo ? { effectiveTo } : {}), status: 'OPEN'
    };
    createDeliveryCapabilityRequirement(requirement, object, context, service, profile, serviceProfile);
    try {
      await withTransaction(this.pool, async (connection) => {
        await connection.execute(
          'INSERT INTO canonical_objects (id, tenant_id, object_type, stable_key, created_at) VALUES (?, ?, ?, ?, ?)',
          [object.id, tenantId, object.objectType, object.stableKey, new Date(createdAt)]
        );
        await connection.execute(
          `INSERT INTO delivery_capability_requirements
            (id, tenant_id, canonical_object_id, context_object_id, service_offering_id,
             industry_job_profile_id, description, required_headcount, sourcing_strategy,
             effective_from, effective_to, status, created_by_person_id, updated_by_person_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?)`,
          [requirement.id, tenantId, object.id, requirement.contextObjectId, requirement.serviceOfferingId,
           requirement.industryJobProfileId, requirement.description, requirement.requiredHeadcount,
           requirement.sourcingStrategy, databaseDate(requirement.effectiveFrom),
           databaseDate(requirement.effectiveTo), actorPersonId, actorPersonId]
        );
        await writeAudit(connection, tenantId, 'DELIVERY_CAPABILITY_REQUIREMENT', requirement.id, 'CREATED', actorPersonId, requirement);
      });
      return requirement;
    } catch (error) { return this.mapError(error); }
  }

  async fulfilRequirement(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      requirementId: string; fulfilmentType: DeliveryCapabilityFulfilmentType;
      providerType: DeliveryCapabilityProviderType; providerId: string;
      requirementSharePercent: number | string; resourceCapacityPercent?: number | string;
      effectiveFrom?: string; effectiveTo?: string;
    }
  ): Promise<DeliveryCapabilityFulfilment> {
    await this.requireManage(tenantId, actorPersonId);
    const requirement = await this.requireRequirement(tenantId, input.requirementId);
    if (
      (requirement.sourcingStrategy === 'INTERNAL' && input.fulfilmentType !== 'INTERNAL') ||
      (requirement.sourcingStrategy === 'EXTERNAL' && input.fulfilmentType !== 'EXTERNAL')
    ) {
      throw new IndustryDeliveryCommandError('Fulfilment type conflicts with the Requirement sourcing strategy.', 'INVALID_INPUT');
    }

    let providerOrganisationId: string | undefined;
    if (input.fulfilmentType === 'INTERNAL') {
      await this.requireTenantCapability(tenantId, requirement.industryJobProfileId);
      providerOrganisationId = await this.requireInternalProvider(
        tenantId, input.providerType, input.providerId, requirement.industryJobProfileId
      );
    } else {
      if (input.providerType !== 'ORGANISATION') {
        throw new IndustryDeliveryCommandError('External fulfilment requires an Organisation provider.', 'INVALID_INPUT');
      }
      await this.requireOrganisation(tenantId, input.providerId);
      providerOrganisationId = input.providerId;
    }

    const share = percent(input.requirementSharePercent, 'Requirement share');
    const [shares] = await this.pool.query<ShareRow[]>(
      `SELECT COALESCE(SUM(requirement_share_percent), 0) AS total_share
         FROM delivery_capability_fulfilments
        WHERE tenant_id = ? AND requirement_id = ? AND status = 'ACTIVE'`,
      [tenantId, requirement.id]
    );
    const currentShare = Number(shares[0]?.total_share ?? 0);
    if (currentShare + share > 100.0001) {
      throw new IndustryDeliveryCommandError('Active fulfilment would exceed 100% of the Requirement.', 'INVALID_INPUT');
    }

    const effectiveFrom = dateValue(input.effectiveFrom, 'Effective from') ?? now();
    const effectiveTo = dateValue(input.effectiveTo, 'Effective to');
    const resourceCapacityPercent = optionalPercent(input.resourceCapacityPercent, 'Resource capacity');
    const fulfilment: DeliveryCapabilityFulfilment = {
      id: asId<'DeliveryCapabilityFulfilmentId'>(`CAPFUL-${randomUUID()}`, 'Delivery Capability Fulfilment'),
      tenantId, requirementId: requirement.id, fulfilmentType: input.fulfilmentType,
      providerType: input.providerType, providerId: required(input.providerId, 'Provider'),
      ...(providerOrganisationId ? { providerOrganisationId: providerOrganisationId as DeliveryCapabilityFulfilment['providerOrganisationId'] } : {}),
      requirementSharePercent: share,
      ...(resourceCapacityPercent !== undefined ? { resourceCapacityPercent } : {}),
      effectiveFrom, ...(effectiveTo ? { effectiveTo } : {}), status: 'ACTIVE'
    };
    createDeliveryCapabilityFulfilment(fulfilment, requirement);

    const totalShare = currentShare + share;
    const status: DeliveryCapabilityRequirement['status'] =
      totalShare >= 99.999 ? 'FULFILLED' : 'PARTIALLY_FULFILLED';

    try {
      await withTransaction(this.pool, async (connection) => {
        await connection.execute(
          `INSERT INTO delivery_capability_fulfilments
            (id, tenant_id, requirement_id, fulfilment_type, provider_type, provider_id,
             provider_organisation_id, requirement_share_percent, resource_capacity_percent,
             effective_from, effective_to, status, created_by_person_id, updated_by_person_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
          [fulfilment.id, tenantId, fulfilment.requirementId, fulfilment.fulfilmentType,
           fulfilment.providerType, fulfilment.providerId, fulfilment.providerOrganisationId ?? null,
           fulfilment.requirementSharePercent, fulfilment.resourceCapacityPercent ?? null,
           new Date(fulfilment.effectiveFrom), databaseDate(fulfilment.effectiveTo),
           actorPersonId, actorPersonId]
        );
        await connection.execute(
          'UPDATE delivery_capability_requirements SET status = ?, updated_by_person_id = ? WHERE tenant_id = ? AND id = ?',
          [status, actorPersonId, tenantId, requirement.id]
        );
        await writeAudit(connection, tenantId, 'DELIVERY_CAPABILITY_FULFILMENT', fulfilment.id, 'CREATED', actorPersonId, fulfilment);
        await writeAudit(connection, tenantId, 'DELIVERY_CAPABILITY_REQUIREMENT', requirement.id, 'FULFILMENT_UPDATED', actorPersonId, { status, totalShare });
      });
      return fulfilment;
    } catch (error) { return this.mapError(error); }
  }

  private async requireManage(tenantId: TenantId, actorPersonId: string) {
    const evaluation = await this.access.evaluatePermission(
      tenantId, actorPersonId, PLATFORM_PERMISSION_KEYS.INDUSTRY_DELIVERY_MANAGE, { scopeType: 'TENANT' }
    );
    if (!evaluation.allowed) throw new IndustryDeliveryCommandError(evaluation.reason, 'PERMISSION_DENIED');
  }

  private async requireIndustry(id: string): Promise<IndustrySolutionDefinition> {
    const [rows] = await this.pool.query<IndustryRow[]>(
      'SELECT id, code, name, description, status FROM industry_solutions WHERE id = ?', [id]
    );
    if (!rows[0]) throw new IndustryDeliveryCommandError('Industry Solution was not found.', 'NOT_FOUND');
    return mapIndustry(rows[0]);
  }
  private async requireDomain(id: string): Promise<DeliveryDomainDefinition> {
    const [rows] = await this.pool.query<DomainRow[]>(
      'SELECT id, industry_solution_id, code, name, purpose, sequence, status FROM delivery_domains WHERE id = ?', [required(id, 'Delivery Domain')]
    );
    if (!rows[0]) throw new IndustryDeliveryCommandError('Delivery Domain was not found.', 'NOT_FOUND');
    return mapDomain(rows[0]);
  }
  private async requireIndustryJob(id: string): Promise<IndustryJobProfileDefinition> {
    const [rows] = await this.pool.query<IndustryJobRow[]>(
      `SELECT id, industry_solution_id, job_profile_id, primary_delivery_domain_id,
              sequence, canonical_name, source_name, source_verified_date, status
         FROM industry_job_profiles WHERE id = ?`, [required(id, 'Industry Job Profile')]
    );
    if (!rows[0]) throw new IndustryDeliveryCommandError('Industry Job Profile was not found.', 'NOT_FOUND');
    return mapJob(rows[0]);
  }
  private async requireContext(tenantId: TenantId, objectId: string): Promise<ConstructionContextProfile> {
    const [rows] = await this.pool.query<ContextRow[]>(
      `SELECT id, tenant_id, canonical_object_id, context_type, code, name,
              parent_context_object_id, status
         FROM construction_context_profiles
        WHERE tenant_id = ? AND canonical_object_id = ? AND status = 'ACTIVE'`,
      [tenantId, required(objectId, 'Delivery context')]
    );
    if (!rows[0]) throw new IndustryDeliveryCommandError('Active delivery context was not found in tenant.', 'NOT_FOUND');
    return mapContext(rows[0]);
  }
  private async requireService(tenantId: TenantId, id: string): Promise<TenantServiceOffering> {
    const [rows] = await this.pool.query<ServiceRow[]>(
      `SELECT id, tenant_id, canonical_object_id, industry_solution_id, delivery_domain_id,
              code, name, description, status
         FROM tenant_service_offerings WHERE tenant_id = ? AND id = ?`,
      [tenantId, required(id, 'Service Offering')]
    );
    if (!rows[0]) throw new IndustryDeliveryCommandError('Service Offering was not found in tenant.', 'NOT_FOUND');
    return mapService(rows[0]);
  }
  private async requireServiceJob(tenantId: TenantId, serviceId: string, profileId: string): Promise<TenantServiceJobProfile> {
    const [rows] = await this.pool.query<ServiceJobRow[]>(
      `SELECT id, tenant_id, service_offering_id, industry_job_profile_id, role, status
         FROM tenant_service_job_profiles
        WHERE tenant_id = ? AND service_offering_id = ? AND industry_job_profile_id = ? AND status = 'ACTIVE'`,
      [tenantId, serviceId, profileId]
    );
    if (!rows[0]) throw new IndustryDeliveryCommandError('Profession is not configured for this Service Offering.', 'INVALID_INPUT');
    return mapServiceJob(rows[0]);
  }
  private async requireTenantCapability(tenantId: TenantId, profileId: string) {
    const [rows] = await this.pool.query<IdRow[]>(
      `SELECT id FROM tenant_industry_capabilities
        WHERE tenant_id = ? AND industry_job_profile_id = ? AND status = 'ACTIVE'`,
      [tenantId, profileId]
    );
    if (!rows[0]) {
      throw new IndustryDeliveryCommandError(
        'The tenant has not declared this profession as an internal CBE capability.',
        'INVALID_INPUT'
      );
    }
  }
  private async requireRequirement(tenantId: TenantId, id: string): Promise<DeliveryCapabilityRequirement> {
    const [rows] = await this.pool.query<RequirementRow[]>(
      `SELECT id, tenant_id, canonical_object_id, context_object_id, service_offering_id,
              industry_job_profile_id, description, required_headcount, sourcing_strategy,
              effective_from, effective_to, status
         FROM delivery_capability_requirements WHERE tenant_id = ? AND id = ?`,
      [tenantId, required(id, 'Capability Requirement')]
    );
    if (!rows[0]) throw new IndustryDeliveryCommandError('Capability Requirement was not found in tenant.', 'NOT_FOUND');
    return mapRequirement(rows[0]);
  }
  private async requireOrganisation(tenantId: TenantId, id: string) {
    const [rows] = await this.pool.query<IdRow[]>(
      `SELECT id FROM organisations WHERE tenant_id = ? AND id = ? AND status = 'ACTIVE'`,
      [tenantId, required(id, 'Organisation')]
    );
    if (!rows[0]) throw new IndustryDeliveryCommandError('Active Organisation was not found in tenant.', 'NOT_FOUND');
  }

  private async requireInternalProvider(
    tenantId: TenantId,
    providerType: DeliveryCapabilityProviderType,
    providerId: string,
    industryJobProfileId: string
  ): Promise<string | undefined> {
    const profile = await this.requireIndustryJob(industryJobProfileId);
    if (providerType === 'POSITION') {
      const [rows] = await this.pool.query<PositionMatchRow[]>(
        `SELECT p.id, ou.organisation_id, p.job_profile_id
           FROM positions p
           JOIN organisation_units ou ON ou.tenant_id = p.tenant_id AND ou.id = p.organisation_unit_id
          WHERE p.tenant_id = ? AND p.id = ? AND p.status = 'ACTIVE'`,
        [tenantId, providerId]
      );
      const row = rows[0];
      if (!row || row.job_profile_id !== profile.jobProfileId) {
        throw new IndustryDeliveryCommandError('Position does not match the required CBE Job Profile.', 'INVALID_INPUT');
      }
      return row.organisation_id;
    }
    if (providerType === 'PERSON') {
      const [rows] = await this.pool.query<PositionMatchRow[]>(
        `SELECT p.id, ou.organisation_id, p.job_profile_id
           FROM position_occupancies po
           JOIN positions p ON p.tenant_id = po.tenant_id AND p.id = po.position_id
           JOIN organisation_units ou ON ou.tenant_id = p.tenant_id AND ou.id = p.organisation_unit_id
          WHERE po.tenant_id = ? AND po.person_id = ? AND p.status = 'ACTIVE'
            AND p.job_profile_id = ?
            AND po.effective_from <= CURRENT_TIMESTAMP(6)
            AND (po.effective_to IS NULL OR po.effective_to >= CURRENT_TIMESTAMP(6))
          LIMIT 1`,
        [tenantId, providerId, profile.jobProfileId]
      );
      if (!rows[0]) {
        throw new IndustryDeliveryCommandError(
          'Person does not currently occupy a Position matching the required CBE Job Profile.',
          'INVALID_INPUT'
        );
      }
      return rows[0].organisation_id;
    }
    throw new IndustryDeliveryCommandError(
      'Internal CBE fulfilment currently requires a Person or Position with the matching Job Profile.',
      'INVALID_INPUT'
    );
  }

  private mapError(error: unknown): never {
    if (error instanceof IndustryDeliveryCommandError) throw error;
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw new IndustryDeliveryCommandError('An equivalent industry delivery record already exists.', 'CONFLICT');
    }
    if (error instanceof Error) {
      if (/not found/i.test(error.message)) throw new IndustryDeliveryCommandError(error.message, 'NOT_FOUND');
      if (/must|required|invalid|requires|same tenant|active|supported|capability|profession/i.test(error.message)) {
        throw new IndustryDeliveryCommandError(error.message, 'INVALID_INPUT');
      }
    }
    throw error;
  }
}
