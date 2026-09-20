import {
  createConstructionContextProfile,
  createIndustryObjectClassification,
  createSectorClassificationScheme,
  createSectorClassificationValue,
  type CanonicalObjectIdentity,
  type ConstructionContextProfile,
  type ConstructionWorkProductType,
  type DeliveryDomainDefinition,
  type IndustryJobProfileDefinition,
  type IndustryObjectClassification,
  type IndustrySolutionDefinition,
  type JobProfile,
  type Person,
  type SectorClassificationScheme,
  type SectorClassificationValue,
  type TenantId
} from '@nublox/kernel';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';
import type { AuditContext } from './repository.js';

interface CountRow extends RowDataPacket {
  count: number | string;
}

interface IndustrySolutionRow extends RowDataPacket {
  id: string;
  code: string;
  name: string;
  description: string;
  status: IndustrySolutionDefinition['status'];
}

interface DeliveryDomainRow extends RowDataPacket {
  id: string;
  industry_solution_id: string;
  code: string;
  name: string;
  purpose: string;
  sequence: number;
  status: DeliveryDomainDefinition['status'];
}

interface JobProfileRow extends RowDataPacket {
  id: string;
  catalogue_scope: JobProfile['catalogueScope'];
  tenant_id: string | null;
  code: string;
  name: string;
  status: JobProfile['status'];
}

interface IndustryJobProfileRow extends RowDataPacket {
  id: string;
  industry_solution_id: string;
  job_profile_id: string;
  primary_delivery_domain_id: string;
  sequence: number;
  canonical_name: string;
  source_name: string;
  source_verified_date: Date | string;
  status: IndustryJobProfileDefinition['status'];
}

interface ClassificationSchemeRow extends RowDataPacket {
  id: string;
  industry_solution_id: string;
  code: string;
  name: string;
  version: string;
  description: string | null;
  status: SectorClassificationScheme['status'];
}

interface ClassificationValueRow extends RowDataPacket {
  id: string;
  scheme_id: string;
  code: string;
  name: string;
  parent_value_id: string | null;
  description: string | null;
  status: SectorClassificationValue['status'];
}

interface ContextRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  canonical_object_id: string;
  context_type: ConstructionContextProfile['contextType'];
  code: string;
  name: string;
  parent_context_object_id: string | null;
  status: ConstructionContextProfile['status'];
}

interface ObjectRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  object_type: string;
  stable_key: string;
  created_at: Date;
}

interface PersonRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  party_id: string;
  legal_name: string;
  preferred_name: string | null;
  status: Person['status'];
}

interface WorkProductRow extends RowDataPacket {
  id: string;
  industry_solution_id: string;
  code: string;
  name: string;
  category: ConstructionWorkProductType['category'];
  default_authoring_mode: ConstructionWorkProductType['defaultAuthoringMode'];
  governed_output_type: string;
  default_representation_types: string | string[];
  status: ConstructionWorkProductType['status'];
}

function jsonArray(value: string | string[]): string[] {
  if (Array.isArray(value)) return value.map(String);
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) throw new Error('Expected JSON array.');
  return parsed.map(String);
}

function dateOnly(value: Date | string): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function mapIndustrySolution(row: IndustrySolutionRow): IndustrySolutionDefinition {
  return {
    id: row.id as IndustrySolutionDefinition['id'],
    code: row.code,
    name: row.name,
    description: row.description,
    status: row.status
  };
}

function mapDeliveryDomain(row: DeliveryDomainRow): DeliveryDomainDefinition {
  return {
    id: row.id as DeliveryDomainDefinition['id'],
    industrySolutionId: row.industry_solution_id as DeliveryDomainDefinition['industrySolutionId'],
    code: row.code,
    name: row.name,
    purpose: row.purpose,
    sequence: Number(row.sequence),
    status: row.status
  };
}

function mapJobProfile(row: JobProfileRow): JobProfile {
  return {
    id: row.id as JobProfile['id'],
    catalogueScope: row.catalogue_scope,
    ...(row.tenant_id ? { tenantId: row.tenant_id as TenantId } : {}),
    code: row.code,
    name: row.name,
    status: row.status
  };
}

function mapIndustryJobProfile(row: IndustryJobProfileRow): IndustryJobProfileDefinition {
  return {
    id: row.id as IndustryJobProfileDefinition['id'],
    industrySolutionId: row.industry_solution_id as IndustryJobProfileDefinition['industrySolutionId'],
    jobProfileId: row.job_profile_id as IndustryJobProfileDefinition['jobProfileId'],
    primaryDeliveryDomainId:
      row.primary_delivery_domain_id as IndustryJobProfileDefinition['primaryDeliveryDomainId'],
    sequence: Number(row.sequence),
    canonicalName: row.canonical_name,
    source: row.source_name,
    sourceVerifiedDate: dateOnly(row.source_verified_date),
    status: row.status
  };
}

function mapScheme(row: ClassificationSchemeRow): SectorClassificationScheme {
  return {
    id: row.id as SectorClassificationScheme['id'],
    industrySolutionId: row.industry_solution_id as SectorClassificationScheme['industrySolutionId'],
    code: row.code,
    name: row.name,
    version: row.version,
    ...(row.description ? { description: row.description } : {}),
    status: row.status
  };
}

function mapValue(row: ClassificationValueRow): SectorClassificationValue {
  return {
    id: row.id as SectorClassificationValue['id'],
    schemeId: row.scheme_id as SectorClassificationValue['schemeId'],
    code: row.code,
    name: row.name,
    ...(row.parent_value_id
      ? { parentValueId: row.parent_value_id as NonNullable<SectorClassificationValue['parentValueId']> }
      : {}),
    ...(row.description ? { description: row.description } : {}),
    status: row.status
  };
}

function mapContext(row: ContextRow): ConstructionContextProfile {
  return {
    id: row.id as ConstructionContextProfile['id'],
    tenantId: row.tenant_id as TenantId,
    canonicalObjectId: row.canonical_object_id as ConstructionContextProfile['canonicalObjectId'],
    contextType: row.context_type,
    code: row.code,
    name: row.name,
    ...(row.parent_context_object_id
      ? {
          parentContextObjectId:
            row.parent_context_object_id as NonNullable<ConstructionContextProfile['parentContextObjectId']>
        }
      : {}),
    status: row.status
  };
}

function mapObject(row: ObjectRow): CanonicalObjectIdentity {
  return {
    id: row.id as CanonicalObjectIdentity['id'],
    tenantId: row.tenant_id as TenantId,
    objectType: row.object_type,
    stableKey: row.stable_key,
    createdAt: row.created_at.toISOString()
  };
}

function mapPerson(row: PersonRow): Person {
  return {
    id: row.id as Person['id'],
    tenantId: row.tenant_id as TenantId,
    partyId: row.party_id as Person['partyId'],
    legalName: row.legal_name,
    ...(row.preferred_name ? { preferredName: row.preferred_name } : {}),
    status: row.status
  };
}

function mapWorkProduct(row: WorkProductRow): ConstructionWorkProductType {
  return {
    id: row.id as ConstructionWorkProductType['id'],
    industrySolutionId: row.industry_solution_id as ConstructionWorkProductType['industrySolutionId'],
    code: row.code,
    name: row.name,
    category: row.category,
    defaultAuthoringMode: row.default_authoring_mode,
    governedOutputType: row.governed_output_type,
    defaultRepresentationTypes: Object.freeze(jsonArray(row.default_representation_types)),
    status: row.status
  };
}

async function writeAudit(
  connection: PoolConnection,
  tenantId: string,
  entityType: string,
  entityId: string,
  action: string,
  audit: AuditContext,
  payload: unknown
): Promise<void> {
  await connection.execute(
    `INSERT INTO kernel_audit_entries
      (tenant_id, entity_type, entity_id, action, actor_person_id, correlation_id, payload)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      tenantId,
      entityType,
      entityId,
      action,
      audit.actorPersonId ?? null,
      audit.correlationId ?? null,
      JSON.stringify(payload)
    ]
  );

  await writeOutboxEvent(connection, {
    tenantId,
    aggregateType: entityType,
    aggregateId: entityId,
    eventType: `${entityType}.${action}`,
    payload
  });
}

export class MySqlIndustryRepository {
  constructor(private readonly pool: Pool) {}

  async catalogueCounts(industrySolutionId = 'CBE'): Promise<{
    deliveryDomains: number;
    jobProfiles: number;
    workProductTypes: number;
  }> {
    const [[domains], [jobs], [products]] = await Promise.all([
      this.pool.execute<CountRow[]>(
        'SELECT COUNT(*) AS count FROM delivery_domains WHERE industry_solution_id = ?',
        [industrySolutionId]
      ),
      this.pool.execute<CountRow[]>(
        'SELECT COUNT(*) AS count FROM industry_job_profiles WHERE industry_solution_id = ?',
        [industrySolutionId]
      ),
      this.pool.execute<CountRow[]>(
        'SELECT COUNT(*) AS count FROM construction_work_product_types WHERE industry_solution_id = ?',
        [industrySolutionId]
      )
    ]);

    return {
      deliveryDomains: Number(domains[0]?.count ?? 0),
      jobProfiles: Number(jobs[0]?.count ?? 0),
      workProductTypes: Number(products[0]?.count ?? 0)
    };
  }

  async getIndustrySolution(id = 'CBE'): Promise<IndustrySolutionDefinition> {
    const [rows] = await this.pool.execute<IndustrySolutionRow[]>(
      'SELECT id, code, name, description, status FROM industry_solutions WHERE id = ?',
      [id]
    );
    const row = rows[0];
    if (!row) throw new Error('Industry Solution not found.');
    return mapIndustrySolution(row);
  }

  async listDeliveryDomains(industrySolutionId = 'CBE'): Promise<DeliveryDomainDefinition[]> {
    const [rows] = await this.pool.execute<DeliveryDomainRow[]>(
      `SELECT id, industry_solution_id, code, name, purpose, sequence, status
         FROM delivery_domains
        WHERE industry_solution_id = ?
        ORDER BY sequence`,
      [industrySolutionId]
    );
    return rows.map(mapDeliveryDomain);
  }

  async listIndustryJobProfiles(
    industrySolutionId = 'CBE'
  ): Promise<Array<{ industry: IndustryJobProfileDefinition; jobProfile: JobProfile }>> {
    const [rows] = await this.pool.execute<Array<IndustryJobProfileRow & JobProfileRow>>(
      `SELECT
          ijp.id,
          ijp.industry_solution_id,
          ijp.job_profile_id,
          ijp.primary_delivery_domain_id,
          ijp.sequence,
          ijp.canonical_name,
          ijp.source_name,
          ijp.source_verified_date,
          ijp.status,
          jp.id AS jp_id,
          jp.catalogue_scope,
          jp.tenant_id,
          jp.code,
          jp.name,
          jp.status AS jp_status
         FROM industry_job_profiles ijp
         JOIN job_profiles jp ON jp.id = ijp.job_profile_id
        WHERE ijp.industry_solution_id = ?
        ORDER BY ijp.sequence`,
      [industrySolutionId]
    );

    return rows.map((row) => ({
      industry: mapIndustryJobProfile(row),
      jobProfile: mapJobProfile({
        id: String((row as unknown as Record<string, unknown>).jp_id),
        catalogue_scope: row.catalogue_scope,
        tenant_id: row.tenant_id,
        code: row.code,
        name: row.name,
        status: (row as unknown as Record<string, unknown>).jp_status as JobProfile['status']
      } as JobProfileRow)
    }));
  }

  async getWorkProductType(
    code: string,
    industrySolutionId = 'CBE'
  ): Promise<ConstructionWorkProductType> {
    const [rows] = await this.pool.execute<WorkProductRow[]>(
      `SELECT id, industry_solution_id, code, name, category,
              default_authoring_mode, governed_output_type,
              default_representation_types, status
         FROM construction_work_product_types
        WHERE industry_solution_id = ? AND code = ?`,
      [industrySolutionId, code]
    );
    const row = rows[0];
    if (!row) throw new Error('Construction Work Product Type not found.');
    return mapWorkProduct(row);
  }

  async createClassificationScheme(
    scheme: SectorClassificationScheme
  ): Promise<void> {
    const industry = await this.getIndustrySolution(scheme.industrySolutionId);
    createSectorClassificationScheme(scheme, industry);

    await this.pool.execute(
      `INSERT INTO sector_classification_schemes
        (id, industry_solution_id, code, name, version, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        scheme.id,
        scheme.industrySolutionId,
        scheme.code,
        scheme.name,
        scheme.version,
        scheme.description ?? null,
        scheme.status
      ]
    );
  }

  async createClassificationValue(
    value: SectorClassificationValue
  ): Promise<void> {
    const [scheme, parent] = await Promise.all([
      this.requireScheme(value.schemeId),
      value.parentValueId ? this.requireValue(value.parentValueId) : Promise.resolve(undefined)
    ]);
    createSectorClassificationValue(value, scheme, parent);

    await this.pool.execute(
      `INSERT INTO sector_classification_values
        (id, scheme_id, code, name, parent_value_id, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        value.id,
        value.schemeId,
        value.code,
        value.name,
        value.parentValueId ?? null,
        value.description ?? null,
        value.status
      ]
    );
  }

  async assignClassification(
    tenantId: TenantId,
    assignment: IndustryObjectClassification,
    audit: AuditContext = {}
  ): Promise<void> {
    if (assignment.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }

    const [object, value, actor] = await Promise.all([
      this.requireObject(tenantId, assignment.canonicalObjectId),
      this.requireValue(assignment.classificationValueId),
      assignment.assignedByPersonId
        ? this.requirePerson(tenantId, assignment.assignedByPersonId)
        : Promise.resolve(undefined)
    ]);
    createIndustryObjectClassification(assignment, object, value, actor);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO industry_object_classifications
          (id, tenant_id, canonical_object_id, classification_value_id,
           assigned_at, assigned_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          assignment.id,
          assignment.tenantId,
          assignment.canonicalObjectId,
          assignment.classificationValueId,
          new Date(assignment.assignedAt),
          assignment.assignedByPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        tenantId,
        'INDUSTRY_OBJECT_CLASSIFICATION',
        assignment.id,
        'ASSIGNED',
        audit,
        assignment
      );
    });
  }

  async createConstructionContext(
    tenantId: TenantId,
    context: ConstructionContextProfile,
    audit: AuditContext = {}
  ): Promise<void> {
    if (context.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }

    const [object, parent] = await Promise.all([
      this.requireObject(tenantId, context.canonicalObjectId),
      context.parentContextObjectId
        ? this.requireObject(tenantId, context.parentContextObjectId)
        : Promise.resolve(undefined)
    ]);
    createConstructionContextProfile(context, object, parent);

    if (context.parentContextObjectId) {
      const [rows] = await this.pool.execute<ContextRow[]>(
        `SELECT id, tenant_id, canonical_object_id, context_type, code, name,
                parent_context_object_id, status
           FROM construction_context_profiles
          WHERE tenant_id = ? AND canonical_object_id = ? AND status = 'ACTIVE'`,
        [tenantId, context.parentContextObjectId]
      );
      if (!rows[0]) {
        throw new Error('Parent canonical object is not an ACTIVE Construction Context.');
      }
    }

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO construction_context_profiles
          (id, tenant_id, canonical_object_id, context_type, code, name,
           parent_context_object_id, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          context.id,
          context.tenantId,
          context.canonicalObjectId,
          context.contextType,
          context.code,
          context.name,
          context.parentContextObjectId ?? null,
          context.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        tenantId,
        'CONSTRUCTION_CONTEXT_PROFILE',
        context.id,
        'CREATED',
        audit,
        context
      );
    });
  }

  async listConstructionContextChildren(
    tenantId: TenantId,
    parentContextObjectId: CanonicalObjectIdentity['id']
  ): Promise<ConstructionContextProfile[]> {
    const [rows] = await this.pool.execute<ContextRow[]>(
      `SELECT id, tenant_id, canonical_object_id, context_type, code, name,
              parent_context_object_id, status
         FROM construction_context_profiles
        WHERE tenant_id = ? AND parent_context_object_id = ?
        ORDER BY context_type, code`,
      [tenantId, parentContextObjectId]
    );
    return rows.map(mapContext);
  }

  private async requireScheme(id: string): Promise<SectorClassificationScheme> {
    const [rows] = await this.pool.execute<ClassificationSchemeRow[]>(
      `SELECT id, industry_solution_id, code, name, version, description, status
         FROM sector_classification_schemes WHERE id = ?`,
      [id]
    );
    const row = rows[0];
    if (!row) throw new Error('Sector Classification Scheme not found.');
    return mapScheme(row);
  }

  private async requireValue(id: string): Promise<SectorClassificationValue> {
    const [rows] = await this.pool.execute<ClassificationValueRow[]>(
      `SELECT id, scheme_id, code, name, parent_value_id, description, status
         FROM sector_classification_values WHERE id = ?`,
      [id]
    );
    const row = rows[0];
    if (!row) throw new Error('Sector Classification Value not found.');
    return mapValue(row);
  }

  private async requireObject(
    tenantId: TenantId,
    id: string
  ): Promise<CanonicalObjectIdentity> {
    const [rows] = await this.pool.execute<ObjectRow[]>(
      `SELECT id, tenant_id, object_type, stable_key, created_at
         FROM canonical_objects WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Canonical Object not found in tenant.');
    return mapObject(row);
  }

  private async requirePerson(tenantId: TenantId, id: string): Promise<Person> {
    const [rows] = await this.pool.execute<PersonRow[]>(
      `SELECT id, tenant_id, party_id, legal_name, preferred_name, status
         FROM persons WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Person not found in tenant.');
    return mapPerson(row);
  }
}
