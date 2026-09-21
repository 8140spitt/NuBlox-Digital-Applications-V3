import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { TenantId } from '@nublox/kernel';

interface DomainRow extends RowDataPacket {
  id: string; code: string; name: string; purpose: string; sequence: number;
}
interface JobRow extends RowDataPacket {
  industry_job_profile_id: string; job_profile_id: string; canonical_name: string;
  primary_delivery_domain_id: string; job_code: string; job_name: string;
}
interface ServiceRow extends RowDataPacket {
  id: string; canonical_object_id: string; delivery_domain_id: string; domain_name: string;
  code: string; name: string; description: string; status: string;
}
interface ServiceJobRow extends RowDataPacket {
  id: string; service_offering_id: string; industry_job_profile_id: string;
  canonical_name: string; role: string; status: string;
}
interface CapabilityRow extends RowDataPacket {
  id: string; industry_job_profile_id: string; canonical_name: string;
  primary_delivery_domain_id: string; domain_name: string; supply_model: string;
  notes: string | null; status: string;
}
interface ContextRow extends RowDataPacket {
  id: string; canonical_object_id: string; context_type: string; code: string; name: string;
}
interface RequirementRow extends RowDataPacket {
  id: string; canonical_object_id: string; context_object_id: string; context_type: string;
  context_code: string; context_name: string; service_offering_id: string; service_code: string;
  service_name: string; industry_job_profile_id: string; canonical_name: string;
  description: string; required_headcount: number; sourcing_strategy: string;
  effective_from: Date | null; effective_to: Date | null; status: string;
}
interface FulfilmentRow extends RowDataPacket {
  id: string; requirement_id: string; fulfilment_type: string; provider_type: string;
  provider_id: string; provider_organisation_id: string | null;
  provider_name: string; requirement_share_percent: string | number;
  resource_capacity_percent: string | number | null; effective_from: Date;
  effective_to: Date | null; status: string;
}
interface InternalProviderRow extends RowDataPacket {
  provider_type: 'PERSON' | 'POSITION'; provider_id: string; label: string;
  organisation_id: string; organisation_name: string; industry_job_profile_id: string;
  canonical_name: string;
}
interface DisciplineDeploymentRow extends RowDataPacket {
  id: string;
  industry_job_profile_id: string;
  canonical_name: string;
  domain_name: string;
  deployment_purpose: string;
  organisation_id: string;
  organisation_name: string;
  organisation_unit_id: string | null;
  organisation_unit_name: string | null;
  assignee_type: 'PERSON' | 'POSITION';
  assignee_id: string;
  assignee_name: string;
  role_title: string;
  responsibility_role: string;
  context_type: string;
  context_object_id: string | null;
  context_key: string | null;
  scope_description: string;
  capacity_percent: string | number | null;
  effective_from: Date;
  effective_to: Date | null;
  status: string;
}
interface OrganisationRow extends RowDataPacket {
  id: string; name: string;
}

export interface IndustryDeliveryProjection {
  deliveryDomains: Array<{ id: string; code: string; name: string; purpose: string; sequence: number }>;
  jobProfiles: Array<{
    industryJobProfileId: string; jobProfileId: string; canonicalName: string;
    primaryDeliveryDomainId: string; jobCode: string; jobName: string;
  }>;
  services: Array<{
    id: string; canonicalObjectId: string; deliveryDomainId: string; domainName: string;
    code: string; name: string; description: string; status: string;
    professions: Array<{
      id: string; industryJobProfileId: string; canonicalName: string; role: string; status: string;
    }>;
  }>;
  internalCapabilities: Array<{
    id: string; industryJobProfileId: string; canonicalName: string;
    primaryDeliveryDomainId: string; domainName: string; supplyModel: string;
    notes?: string; status: string;
  }>;
  disciplineDeployments: Array<{
    id: string;
    industryJobProfileId: string;
    canonicalName: string;
    domainName: string;
    deploymentPurpose: string;
    organisationId: string;
    organisationName: string;
    organisationUnitId?: string;
    organisationUnitName?: string;
    assigneeType: 'PERSON' | 'POSITION';
    assigneeId: string;
    assigneeName: string;
    roleTitle: string;
    responsibilityRole: string;
    contextType: string;
    contextObjectId?: string;
    contextKey?: string;
    scopeDescription: string;
    capacityPercent?: number;
    effectiveFrom: string;
    effectiveTo?: string;
    status: string;
  }>;
  deliveryContexts: Array<{
    id: string; canonicalObjectId: string; contextType: string; code: string; name: string;
  }>;
  requirements: Array<{
    id: string; canonicalObjectId: string; contextObjectId: string; contextType: string;
    contextCode: string; contextName: string; serviceOfferingId: string; serviceCode: string;
    serviceName: string; industryJobProfileId: string; canonicalName: string;
    description: string; requiredHeadcount: number; sourcingStrategy: string;
    effectiveFrom?: string; effectiveTo?: string; status: string;
    fulfilledPercent: number; remainingPercent: number;
    fulfilments: Array<{
      id: string; fulfilmentType: string; providerType: string; providerId: string;
      providerOrganisationId?: string; providerName: string; requirementSharePercent: number;
      resourceCapacityPercent?: number; effectiveFrom: string; effectiveTo?: string; status: string;
    }>;
  }>;
  internalProviders: Array<{
    providerType: 'PERSON' | 'POSITION'; providerId: string; label: string;
    organisationId: string; organisationName: string; industryJobProfileId: string;
    canonicalName: string;
  }>;
  organisations: Array<{ id: string; name: string }>;
  totals: {
    services: number;
    internalCapabilities: number;
    governanceDeployments: number;
    deliveryDeployments: number;
    projects: number;
    requirements: number;
    fulfilled: number;
    partiallyFulfilled: number;
    sourcingRequired: number;
  };
}

export class MySqlIndustryDeliveryReadRepository {
  constructor(private readonly pool: Pool) {}

  async getProjection(tenantId: TenantId): Promise<IndustryDeliveryProjection> {
    const [
      domainResult, jobResult, serviceResult, serviceJobResult, capabilityResult,
      disciplineDeploymentResult, contextResult, requirementResult, fulfilmentResult, positionProviderResult,
      personProviderResult, organisationResult
    ] = await Promise.all([
      this.pool.query<DomainRow[]>(
        `SELECT id, code, name, purpose, sequence
           FROM delivery_domains
          WHERE industry_solution_id = 'CBE' AND status = 'ACTIVE'
          ORDER BY sequence`
      ),
      this.pool.query<JobRow[]>(
        `SELECT ijp.id AS industry_job_profile_id, ijp.job_profile_id, ijp.canonical_name,
                ijp.primary_delivery_domain_id, jp.code AS job_code, jp.name AS job_name
           FROM industry_job_profiles ijp
           JOIN job_profiles jp ON jp.id = ijp.job_profile_id
          WHERE ijp.industry_solution_id = 'CBE' AND ijp.status = 'ACTIVE'
          ORDER BY ijp.sequence`
      ),
      this.pool.query<ServiceRow[]>(
        `SELECT s.id, s.canonical_object_id, s.delivery_domain_id, d.name AS domain_name,
                s.code, s.name, s.description, s.status
           FROM tenant_service_offerings s
           JOIN delivery_domains d ON d.id = s.delivery_domain_id
          WHERE s.tenant_id = ?
          ORDER BY d.sequence, s.code`, [tenantId]
      ),
      this.pool.query<ServiceJobRow[]>(
        `SELECT m.id, m.service_offering_id, m.industry_job_profile_id,
                ijp.canonical_name, m.role, m.status
           FROM tenant_service_job_profiles m
           JOIN industry_job_profiles ijp ON ijp.id = m.industry_job_profile_id
          WHERE m.tenant_id = ?
          ORDER BY m.service_offering_id, m.role, ijp.sequence`, [tenantId]
      ),
      this.pool.query<CapabilityRow[]>(
        `SELECT c.id, c.industry_job_profile_id, ijp.canonical_name,
                ijp.primary_delivery_domain_id, d.name AS domain_name,
                c.supply_model, c.notes, c.status
           FROM tenant_industry_capabilities c
           JOIN industry_job_profiles ijp ON ijp.id = c.industry_job_profile_id
           JOIN delivery_domains d ON d.id = ijp.primary_delivery_domain_id
          WHERE c.tenant_id = ?
          ORDER BY d.sequence, ijp.sequence`, [tenantId]
      ),
      this.pool.query<DisciplineDeploymentRow[]>(
        `SELECT dd.id, dd.industry_job_profile_id, ijp.canonical_name,
                dom.name AS domain_name, dd.deployment_purpose,
                dd.organisation_id,
                COALESCE(org.trading_name, org.legal_name) AS organisation_name,
                dd.organisation_unit_id, ou.name AS organisation_unit_name,
                dd.assignee_type, dd.assignee_id,
                COALESCE(pe.preferred_name, pe.legal_name, pos.title, dd.assignee_id) AS assignee_name,
                dd.role_title, dd.responsibility_role, dd.context_type,
                dd.context_object_id, co.stable_key AS context_key,
                dd.scope_description, dd.capacity_percent,
                dd.effective_from, dd.effective_to, dd.status
           FROM industry_discipline_deployments dd
           JOIN industry_job_profiles ijp ON ijp.id = dd.industry_job_profile_id
           JOIN delivery_domains dom ON dom.id = ijp.primary_delivery_domain_id
           JOIN organisations org
             ON org.tenant_id = dd.tenant_id AND org.id = dd.organisation_id
           LEFT JOIN organisation_units ou
             ON ou.tenant_id = dd.tenant_id AND ou.id = dd.organisation_unit_id
           LEFT JOIN persons pe
             ON dd.assignee_type = 'PERSON' AND pe.tenant_id = dd.tenant_id AND pe.id = dd.assignee_id
           LEFT JOIN positions pos
             ON dd.assignee_type = 'POSITION' AND pos.tenant_id = dd.tenant_id AND pos.id = dd.assignee_id
           LEFT JOIN canonical_objects co
             ON co.tenant_id = dd.tenant_id AND co.id = dd.context_object_id
          WHERE dd.tenant_id = ?
          ORDER BY dd.status = 'ACTIVE' DESC, dom.sequence, ijp.sequence,
                   dd.deployment_purpose, dd.effective_from DESC`, [tenantId]
      ),
      this.pool.query<ContextRow[]>(
        `SELECT id, canonical_object_id, context_type, code, name
           FROM construction_context_profiles
          WHERE tenant_id = ? AND status = 'ACTIVE'
            AND context_type IN ('PROJECT', 'PROGRAMME', 'CONTRACT', 'APPOINTMENT', 'WORK_PACKAGE', 'SERVICE')
          ORDER BY context_type, code`, [tenantId]
      ),
      this.pool.query<RequirementRow[]>(
        `SELECT r.id, r.canonical_object_id, r.context_object_id,
                c.context_type, c.code AS context_code, c.name AS context_name,
                r.service_offering_id, s.code AS service_code, s.name AS service_name,
                r.industry_job_profile_id, ijp.canonical_name, r.description,
                r.required_headcount, r.sourcing_strategy, r.effective_from, r.effective_to, r.status
           FROM delivery_capability_requirements r
           JOIN construction_context_profiles c
             ON c.tenant_id = r.tenant_id AND c.canonical_object_id = r.context_object_id
           JOIN tenant_service_offerings s
             ON s.tenant_id = r.tenant_id AND s.id = r.service_offering_id
           JOIN industry_job_profiles ijp ON ijp.id = r.industry_job_profile_id
          WHERE r.tenant_id = ?
          ORDER BY c.code, s.code, ijp.sequence`, [tenantId]
      ),
      this.pool.query<FulfilmentRow[]>(
        `SELECT f.id, f.requirement_id, f.fulfilment_type, f.provider_type, f.provider_id,
                f.provider_organisation_id,
                COALESCE(pe.preferred_name, pe.legal_name, pos.title, ou.name,
                         org.trading_name, org.legal_name, f.provider_id) AS provider_name,
                f.requirement_share_percent, f.resource_capacity_percent,
                f.effective_from, f.effective_to, f.status
           FROM delivery_capability_fulfilments f
           LEFT JOIN persons pe
             ON f.provider_type = 'PERSON' AND pe.tenant_id = f.tenant_id AND pe.id = f.provider_id
           LEFT JOIN positions pos
             ON f.provider_type = 'POSITION' AND pos.tenant_id = f.tenant_id AND pos.id = f.provider_id
           LEFT JOIN organisation_units ou
             ON f.provider_type = 'ORGANISATION_UNIT' AND ou.tenant_id = f.tenant_id AND ou.id = f.provider_id
           LEFT JOIN organisations org
             ON f.provider_type = 'ORGANISATION' AND org.tenant_id = f.tenant_id AND org.id = f.provider_id
          WHERE f.tenant_id = ?
          ORDER BY f.requirement_id, f.created_at`, [tenantId]
      ),
      this.pool.query<InternalProviderRow[]>(
        `SELECT 'POSITION' AS provider_type, p.id AS provider_id,
                p.title AS label, ou.organisation_id,
                COALESCE(o.trading_name, o.legal_name) AS organisation_name,
                ijp.id AS industry_job_profile_id, ijp.canonical_name
           FROM positions p
           JOIN organisation_units ou ON ou.tenant_id = p.tenant_id AND ou.id = p.organisation_unit_id
           JOIN organisations o ON o.tenant_id = ou.tenant_id AND o.id = ou.organisation_id
           JOIN industry_job_profiles ijp ON ijp.job_profile_id = p.job_profile_id
          WHERE p.tenant_id = ? AND p.status = 'ACTIVE' AND ijp.industry_solution_id = 'CBE'
          ORDER BY ijp.sequence, p.title`, [tenantId]
      ),
      this.pool.query<InternalProviderRow[]>(
        `SELECT 'PERSON' AS provider_type, pe.id AS provider_id,
                CONCAT(COALESCE(pe.preferred_name, pe.legal_name), ' · ', p.title) AS label,
                ou.organisation_id, COALESCE(o.trading_name, o.legal_name) AS organisation_name,
                ijp.id AS industry_job_profile_id, ijp.canonical_name
           FROM position_occupancies po
           JOIN persons pe ON pe.tenant_id = po.tenant_id AND pe.id = po.person_id
           JOIN positions p ON p.tenant_id = po.tenant_id AND p.id = po.position_id
           JOIN organisation_units ou ON ou.tenant_id = p.tenant_id AND ou.id = p.organisation_unit_id
           JOIN organisations o ON o.tenant_id = ou.tenant_id AND o.id = ou.organisation_id
           JOIN industry_job_profiles ijp ON ijp.job_profile_id = p.job_profile_id
          WHERE po.tenant_id = ? AND pe.status = 'ACTIVE' AND p.status = 'ACTIVE'
            AND ijp.industry_solution_id = 'CBE'
            AND po.effective_from <= CURRENT_TIMESTAMP(6)
            AND (po.effective_to IS NULL OR po.effective_to >= CURRENT_TIMESTAMP(6))
          ORDER BY ijp.sequence, label`, [tenantId]
      ),
      this.pool.query<OrganisationRow[]>(
        `SELECT id, COALESCE(trading_name, legal_name) AS name
           FROM organisations
          WHERE tenant_id = ? AND status = 'ACTIVE'
          ORDER BY name`, [tenantId]
      )
    ]);

    const serviceJobs = new Map<string, ServiceJobRow[]>();
    for (const row of serviceJobResult[0]) {
      const list = serviceJobs.get(row.service_offering_id) ?? [];
      list.push(row);
      serviceJobs.set(row.service_offering_id, list);
    }

    const fulfilments = new Map<string, IndustryDeliveryProjection['requirements'][number]['fulfilments']>();
    for (const row of fulfilmentResult[0]) {
      const list = fulfilments.get(row.requirement_id) ?? [];
      list.push({
        id: row.id,
        fulfilmentType: row.fulfilment_type,
        providerType: row.provider_type,
        providerId: row.provider_id,
        ...(row.provider_organisation_id ? { providerOrganisationId: row.provider_organisation_id } : {}),
        providerName: row.provider_name,
        requirementSharePercent: Number(row.requirement_share_percent),
        ...(row.resource_capacity_percent !== null ? { resourceCapacityPercent: Number(row.resource_capacity_percent) } : {}),
        effectiveFrom: row.effective_from.toISOString(),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
        status: row.status
      });
      fulfilments.set(row.requirement_id, list);
    }

    const requirements = requirementResult[0].map((row) => {
      const rows = fulfilments.get(row.id) ?? [];
      const fulfilledPercent = rows
        .filter((entry) => entry.status === 'ACTIVE')
        .reduce((sum, entry) => sum + entry.requirementSharePercent, 0);
      return {
        id: row.id,
        canonicalObjectId: row.canonical_object_id,
        contextObjectId: row.context_object_id,
        contextType: row.context_type,
        contextCode: row.context_code,
        contextName: row.context_name,
        serviceOfferingId: row.service_offering_id,
        serviceCode: row.service_code,
        serviceName: row.service_name,
        industryJobProfileId: row.industry_job_profile_id,
        canonicalName: row.canonical_name,
        description: row.description,
        requiredHeadcount: Number(row.required_headcount),
        sourcingStrategy: row.sourcing_strategy,
        ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
        status: row.status,
        fulfilledPercent: Math.min(100, fulfilledPercent),
        remainingPercent: Math.max(0, 100 - fulfilledPercent),
        fulfilments: rows
      };
    });

    const projects = contextResult[0].filter((context) => context.context_type === 'PROJECT').length;
    return {
      deliveryDomains: domainResult[0].map((row) => ({
        id: row.id, code: row.code, name: row.name, purpose: row.purpose, sequence: Number(row.sequence)
      })),
      jobProfiles: jobResult[0].map((row) => ({
        industryJobProfileId: row.industry_job_profile_id,
        jobProfileId: row.job_profile_id,
        canonicalName: row.canonical_name,
        primaryDeliveryDomainId: row.primary_delivery_domain_id,
        jobCode: row.job_code,
        jobName: row.job_name
      })),
      services: serviceResult[0].map((row) => ({
        id: row.id, canonicalObjectId: row.canonical_object_id,
        deliveryDomainId: row.delivery_domain_id, domainName: row.domain_name,
        code: row.code, name: row.name, description: row.description, status: row.status,
        professions: (serviceJobs.get(row.id) ?? []).map((mapping) => ({
          id: mapping.id, industryJobProfileId: mapping.industry_job_profile_id,
          canonicalName: mapping.canonical_name, role: mapping.role, status: mapping.status
        }))
      })),
      internalCapabilities: capabilityResult[0].map((row) => ({
        id: row.id, industryJobProfileId: row.industry_job_profile_id,
        canonicalName: row.canonical_name, primaryDeliveryDomainId: row.primary_delivery_domain_id,
        domainName: row.domain_name, supplyModel: row.supply_model,
        ...(row.notes ? { notes: row.notes } : {}), status: row.status
      })),
      disciplineDeployments: disciplineDeploymentResult[0].map((row) => ({
        id: row.id,
        industryJobProfileId: row.industry_job_profile_id,
        canonicalName: row.canonical_name,
        domainName: row.domain_name,
        deploymentPurpose: row.deployment_purpose,
        organisationId: row.organisation_id,
        organisationName: row.organisation_name,
        ...(row.organisation_unit_id ? { organisationUnitId: row.organisation_unit_id } : {}),
        ...(row.organisation_unit_name ? { organisationUnitName: row.organisation_unit_name } : {}),
        assigneeType: row.assignee_type,
        assigneeId: row.assignee_id,
        assigneeName: row.assignee_name,
        roleTitle: row.role_title,
        responsibilityRole: row.responsibility_role,
        contextType: row.context_type,
        ...(row.context_object_id ? { contextObjectId: row.context_object_id } : {}),
        ...(row.context_key ? { contextKey: row.context_key } : {}),
        scopeDescription: row.scope_description,
        ...(row.capacity_percent !== null
          ? { capacityPercent: Number(row.capacity_percent) }
          : {}),
        effectiveFrom: row.effective_from.toISOString(),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
        status: row.status
      })),
      deliveryContexts: contextResult[0].map((row) => ({
        id: row.id, canonicalObjectId: row.canonical_object_id,
        contextType: row.context_type, code: row.code, name: row.name
      })),
      requirements,
      internalProviders: [...positionProviderResult[0], ...personProviderResult[0]].map((row) => ({
        providerType: row.provider_type,
        providerId: row.provider_id,
        label: row.label,
        organisationId: row.organisation_id,
        organisationName: row.organisation_name,
        industryJobProfileId: row.industry_job_profile_id,
        canonicalName: row.canonical_name
      })),
      organisations: organisationResult[0].map((row) => ({ id: row.id, name: row.name })),
      totals: {
        services: serviceResult[0].filter((row) => row.status === 'ACTIVE').length,
        internalCapabilities: capabilityResult[0].filter((row) => row.status === 'ACTIVE').length,
        governanceDeployments: disciplineDeploymentResult[0].filter(
          (row) => row.status === 'ACTIVE' && row.deployment_purpose === 'FUNCTIONAL_GOVERNANCE'
        ).length,
        deliveryDeployments: disciplineDeploymentResult[0].filter(
          (row) => row.status === 'ACTIVE' && row.deployment_purpose === 'FUNCTIONAL_DELIVERY'
        ).length,
        projects,
        requirements: requirements.filter((row) => row.status !== 'CANCELLED').length,
        fulfilled: requirements.filter((row) => row.status === 'FULFILLED').length,
        partiallyFulfilled: requirements.filter((row) => row.status === 'PARTIALLY_FULFILLED').length,
        sourcingRequired: requirements.filter((row) =>
          row.status !== 'FULFILLED' &&
          (row.sourcingStrategy === 'EXTERNAL' || row.sourcingStrategy === 'HYBRID' || row.sourcingStrategy === 'UNDECIDED')
        ).length
      }
    };
  }
}
