import { randomUUID } from 'node:crypto';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';

export type TenantSizeTier =
  | 'MICRO'
  | 'SMALL'
  | 'MEDIUM'
  | 'LARGE'
  | 'ENTERPRISE';

export interface TenantBusinessProfileInput {
  primaryClassificationValueId: string;
  sizeTier: TenantSizeTier;
  employeeCount?: number;
  legalEntityCount: number;
  primaryCountryCode: string;
  primaryLanguageCode: string;
  operatingModelCodes: string[];
  regulatoryRegimeIds?: string[];
}

export interface TenantProvisioningCatalogue {
  industries: Array<{
    classificationValueId: string;
    schemeCode: string;
    classificationCode: string;
    name: string;
    industrySolutionId: string | null;
    industrySolutionName: string | null;
  }>;
  sizeTiers: Array<{
    code: TenantSizeTier;
    name: string;
    employeeRange: string;
  }>;
  operatingModels: Array<{
    code: string;
    name: string;
    description: string;
  }>;
  regulatoryRegimes: Array<{
    id: string;
    code: string;
    name: string;
    jurisdiction: string | null;
  }>;
}

export interface TenantProvisioningResult {
  provisioningRunId: string;
  templateApplications: Array<{
    templateId: string;
    code: string;
    name: string;
    version: number;
    templateKind: string;
  }>;
  industrySolutionIds: string[];
}

export interface TenantConfigurationProjection {
  profile: {
    classificationSchemeCode: string;
    classificationCode: string;
    classificationName: string;
    sizeTier: TenantSizeTier;
    employeeCount: number | null;
    legalEntityCount: number;
    primaryCountryCode: string;
    primaryLanguageCode: string;
    configurationState: string;
    provisionedAt: string | null;
  };
  operatingModels: Array<{ code: string; name: string; primary: boolean }>;
  regulatoryRegimes: Array<{ code: string; name: string; jurisdiction: string | null }>;
  industrySolutions: Array<{ id: string; code: string; name: string; status: string }>;
  templateApplications: Array<{
    applicationId: string;
    templateId: string;
    code: string;
    name: string;
    version: number;
    templateKind: string;
    status: string;
    appliedAt: string;
    appliedConfiguration: Record<string, unknown>;
  }>;
  latestProvisioningRun: {
    id: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
    steps: Array<{
      stepKey: string;
      sequence: number;
      status: string;
      evidence: Record<string, unknown> | null;
      startedAt: string;
      completedAt: string | null;
    }>;
  } | null;
}

export class TenantProvisioningError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantProvisioningError';
  }
}

interface ClassificationRow extends RowDataPacket {
  id: string;
  scheme_code: string;
  value_code: string;
  value_name: string;
  industry_solution_id: string | null;
  industry_solution_name: string | null;
}

interface OperatingModelRow extends RowDataPacket {
  code: string;
  name: string;
  description: string;
}

interface RegulatoryRow extends RowDataPacket {
  id: string;
  code: string;
  name: string;
  jurisdiction: string | null;
}

interface TemplateRow extends RowDataPacket {
  id: string;
  code: string;
  name: string;
  description: string;
  template_kind:
    | 'CORE'
    | 'INDUSTRY'
    | 'SIZE'
    | 'OPERATING_MODEL'
    | 'REGULATORY'
    | 'COMPOSITE';
  version: number;
  priority: number;
  industry_solution_id: string | null;
  configuration_payload: unknown;
}

interface CriterionRow extends RowDataPacket {
  template_id: string;
  criterion_type:
    | 'INDUSTRY_CLASSIFICATION'
    | 'SIZE_TIER'
    | 'OPERATING_MODEL'
    | 'REGULATORY_REGIME'
    | 'COUNTRY';
  criterion_value: string;
  sequence: number;
}

interface ComponentRow extends RowDataPacket {
  id: string;
  template_id: string;
  component_key: string;
  component_type:
    | 'INDUSTRY_SOLUTION'
    | 'TERMINOLOGY'
    | 'METADATA_PACKAGE'
    | 'WORKFLOW_TEMPLATE'
    | 'RULE_SET'
    | 'DASHBOARD'
    | 'CLASSIFICATION'
    | 'PREFERENCE'
    | 'SPECIALIST_CAPABILITY'
    | 'SEED_DATA';
  sequence: number;
  required: number | boolean;
  configuration_payload: unknown;
}

interface ValidatedProfile {
  classification: ClassificationRow;
  sizeTier: TenantSizeTier;
  employeeCount?: number;
  legalEntityCount: number;
  primaryCountryCode: string;
  primaryLanguageCode: string;
  operatingModels: OperatingModelRow[];
  regulatoryRegimes: RegulatoryRow[];
}

const SIZE_TIERS: TenantProvisioningCatalogue['sizeTiers'] = [
  { code: 'MICRO', name: 'Micro', employeeRange: '1–9' },
  { code: 'SMALL', name: 'Small', employeeRange: '10–49' },
  { code: 'MEDIUM', name: 'Medium', employeeRange: '50–249' },
  { code: 'LARGE', name: 'Large', employeeRange: '250–999' },
  { code: 'ENTERPRISE', name: 'Enterprise', employeeRange: '1000+' }
];

const SIZE_BOUNDS: Record<TenantSizeTier, { min: number; max?: number }> = {
  MICRO: { min: 1, max: 9 },
  SMALL: { min: 10, max: 49 },
  MEDIUM: { min: 50, max: 249 },
  LARGE: { min: 250, max: 999 },
  ENTERPRISE: { min: 1000 }
};

function asJsonObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // handled below
    }
  }

  throw new TenantProvisioningError('Tenant configuration metadata contains invalid JSON.');
}

function requiredString(value: string, label: string, maxLength: number): string {
  const normalized = value.trim();
  if (!normalized) throw new TenantProvisioningError(`${label} is required.`);
  if (normalized.length > maxLength) {
    throw new TenantProvisioningError(`${label} must not exceed ${maxLength} characters.`);
  }
  return normalized;
}

function normalizeCountry(value: string): string {
  const normalized = requiredString(value, 'Primary country', 2).toUpperCase();
  if (!/^[A-Z]{2}$/u.test(normalized)) {
    throw new TenantProvisioningError('Primary country must use a two-letter country code.');
  }
  return normalized;
}

function normalizeLanguage(value: string): string {
  const normalized = requiredString(value, 'Primary language', 16);
  if (!/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/u.test(normalized)) {
    throw new TenantProvisioningError(
      'Primary language must use a language tag such as en or en-GB.'
    );
  }
  return normalized;
}

function validateEmployeeCount(sizeTier: TenantSizeTier, employeeCount?: number): void {
  if (employeeCount === undefined) return;
  if (!Number.isInteger(employeeCount) || employeeCount <= 0) {
    throw new TenantProvisioningError('Employee count must be a positive whole number.');
  }

  const bounds = SIZE_BOUNDS[sizeTier];
  if (
    employeeCount < bounds.min ||
    (bounds.max !== undefined && employeeCount > bounds.max)
  ) {
    const tier = SIZE_TIERS.find((item) => item.code === sizeTier)!;
    throw new TenantProvisioningError(
      `Employee count does not match the selected ${tier.name} size tier (${tier.employeeRange}).`
    );
  }
}

function uniqueCodes(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function criterionMatches(
  criterion: CriterionRow,
  profile: ValidatedProfile
): boolean {
  switch (criterion.criterion_type) {
    case 'INDUSTRY_CLASSIFICATION':
      return criterion.criterion_value ===
        `${profile.classification.scheme_code}:${profile.classification.value_code}`;
    case 'SIZE_TIER':
      return criterion.criterion_value === profile.sizeTier;
    case 'OPERATING_MODEL':
      return profile.operatingModels.some(
        (model) => model.code === criterion.criterion_value
      );
    case 'REGULATORY_REGIME':
      return profile.regulatoryRegimes.some(
        (regime) => regime.code === criterion.criterion_value
      );
    case 'COUNTRY':
      return criterion.criterion_value === profile.primaryCountryCode;
  }
}

async function audit(
  connection: PoolConnection,
  tenantId: string,
  entityType: string,
  entityId: string,
  action: string,
  actorPersonId: string,
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
      actorPersonId,
      `TENANT-PROVISIONING:${tenantId}`,
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

export class MySqlTenantProvisioningService {
  constructor(private readonly pool: Pool) {}

  async catalogue(): Promise<TenantProvisioningCatalogue> {
    const [industryResult, operatingResult, regulatoryResult] = await Promise.all([
      this.pool.query<ClassificationRow[]>(
        `SELECT v.id,
                s.code AS scheme_code,
                v.code AS value_code,
                v.name AS value_name,
                ism.industry_solution_id,
                i.name AS industry_solution_name
           FROM business_classification_values v
           JOIN business_classification_schemes s
             ON s.id = v.scheme_id
            AND s.status = 'ACTIVE'
           LEFT JOIN industry_solution_business_classifications ism
             ON ism.classification_value_id = v.id
           LEFT JOIN industry_solutions i
             ON i.id = ism.industry_solution_id
            AND i.status = 'ACTIVE'
          WHERE v.status = 'ACTIVE'
          ORDER BY s.code, v.code`
      ),
      this.pool.query<OperatingModelRow[]>(
        `SELECT code, name, description
           FROM operating_model_definitions
          WHERE status = 'ACTIVE'
          ORDER BY name`
      ),
      this.pool.query<RegulatoryRow[]>(
        `SELECT id, code, name, jurisdiction
           FROM regulatory_regimes
          WHERE status = 'ACTIVE'
          ORDER BY jurisdiction, name`
      )
    ]);

    return {
      industries: industryResult[0].map((row) => ({
        classificationValueId: row.id,
        schemeCode: row.scheme_code,
        classificationCode: row.value_code,
        name: row.value_name,
        industrySolutionId: row.industry_solution_id,
        industrySolutionName: row.industry_solution_name
      })),
      sizeTiers: SIZE_TIERS,
      operatingModels: operatingResult[0].map((row) => ({
        code: row.code,
        name: row.name,
        description: row.description
      })),
      regulatoryRegimes: regulatoryResult[0].map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        jurisdiction: row.jurisdiction
      }))
    };
  }

  async getTenantConfiguration(
    tenantId: string
  ): Promise<TenantConfigurationProjection> {
    const [profileRows] = await this.pool.query<Array<RowDataPacket & {
      scheme_code: string;
      classification_code: string;
      classification_name: string;
      size_tier: TenantSizeTier;
      employee_count: number | null;
      legal_entity_count: number;
      primary_country_code: string;
      primary_language_code: string;
      configuration_state: string;
      provisioned_at: Date | null;
    }>>(
      `SELECT s.code AS scheme_code,
              v.code AS classification_code,
              v.name AS classification_name,
              p.size_tier,
              p.employee_count,
              p.legal_entity_count,
              p.primary_country_code,
              p.primary_language_code,
              p.configuration_state,
              p.provisioned_at
         FROM tenant_business_profiles p
         JOIN business_classification_values v
           ON v.id = p.primary_classification_value_id
         JOIN business_classification_schemes s
           ON s.id = v.scheme_id
        WHERE p.tenant_id = ?
        LIMIT 1`,
      [tenantId]
    );
    const profile = profileRows[0];
    if (!profile) {
      throw new TenantProvisioningError('Tenant business profile does not exist.');
    }

    const [
      operatingResult,
      regulatoryResult,
      industryResult,
      templateResult,
      runResult
    ] = await Promise.all([
      this.pool.query<Array<RowDataPacket & {
        code: string;
        name: string;
        is_primary: number | boolean;
      }>>(
        `SELECT m.code, m.name, a.is_primary
           FROM tenant_operating_models a
           JOIN operating_model_definitions m
             ON m.code = a.operating_model_code
          WHERE a.tenant_id = ?
            AND a.status = 'ACTIVE'
          ORDER BY a.is_primary DESC, m.name`,
        [tenantId]
      ),
      this.pool.query<Array<RowDataPacket & {
        code: string;
        name: string;
        jurisdiction: string | null;
      }>>(
        `SELECT r.code, r.name, r.jurisdiction
           FROM tenant_regulatory_regime_assignments a
           JOIN regulatory_regimes r
             ON r.id = a.regulatory_regime_id
          WHERE a.tenant_id = ?
            AND a.status = 'ACTIVE'
          ORDER BY r.name`,
        [tenantId]
      ),
      this.pool.query<Array<RowDataPacket & {
        id: string;
        code: string;
        name: string;
        status: string;
      }>>(
        `SELECT i.id, i.code, i.name, a.status
           FROM tenant_industry_solution_assignments a
           JOIN industry_solutions i ON i.id = a.industry_solution_id
          WHERE a.tenant_id = ?
          ORDER BY i.name`,
        [tenantId]
      ),
      this.pool.query<Array<RowDataPacket & {
        application_id: string;
        template_id: string;
        code: string;
        name: string;
        template_version: number;
        template_kind: string;
        status: string;
        applied_at: Date;
        applied_configuration: unknown;
      }>>(
        `SELECT a.id AS application_id,
                a.template_id,
                t.code,
                t.name,
                a.template_version,
                t.template_kind,
                a.status,
                a.applied_at,
                a.applied_configuration
           FROM tenant_configuration_template_applications a
           JOIN tenant_configuration_templates t ON t.id = a.template_id
          WHERE a.tenant_id = ?
          ORDER BY a.applied_at, t.priority, t.code`,
        [tenantId]
      ),
      this.pool.query<Array<RowDataPacket & {
        id: string;
        status: string;
        started_at: Date;
        completed_at: Date | null;
      }>>(
        `SELECT id, status, started_at, completed_at
           FROM tenant_provisioning_runs
          WHERE tenant_id = ?
          ORDER BY started_at DESC
          LIMIT 1`,
        [tenantId]
      )
    ]);

    const latestRun = runResult[0][0];
    let steps: Array<{
      stepKey: string;
      sequence: number;
      status: string;
      evidence: Record<string, unknown> | null;
      startedAt: string;
      completedAt: string | null;
    }> = [];

    if (latestRun) {
      const [stepRows] = await this.pool.query<Array<RowDataPacket & {
        step_key: string;
        sequence: number;
        status: string;
        evidence: unknown;
        started_at: Date;
        completed_at: Date | null;
      }>>(
        `SELECT step_key, sequence, status, evidence, started_at, completed_at
           FROM tenant_provisioning_steps
          WHERE provisioning_run_id = ?
          ORDER BY sequence, step_key`,
        [latestRun.id]
      );
      steps = stepRows.map((row) => ({
        stepKey: row.step_key,
        sequence: Number(row.sequence),
        status: row.status,
        evidence: row.evidence === null ? null : asJsonObject(row.evidence),
        startedAt: row.started_at.toISOString(),
        completedAt: row.completed_at?.toISOString() ?? null
      }));
    }

    return {
      profile: {
        classificationSchemeCode: profile.scheme_code,
        classificationCode: profile.classification_code,
        classificationName: profile.classification_name,
        sizeTier: profile.size_tier,
        employeeCount: profile.employee_count === null ? null : Number(profile.employee_count),
        legalEntityCount: Number(profile.legal_entity_count),
        primaryCountryCode: profile.primary_country_code,
        primaryLanguageCode: profile.primary_language_code,
        configurationState: profile.configuration_state,
        provisionedAt: profile.provisioned_at?.toISOString() ?? null
      },
      operatingModels: operatingResult[0].map((row) => ({
        code: row.code,
        name: row.name,
        primary: Boolean(row.is_primary)
      })),
      regulatoryRegimes: regulatoryResult[0].map((row) => ({
        code: row.code,
        name: row.name,
        jurisdiction: row.jurisdiction
      })),
      industrySolutions: industryResult[0].map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        status: row.status
      })),
      templateApplications: templateResult[0].map((row) => ({
        applicationId: row.application_id,
        templateId: row.template_id,
        code: row.code,
        name: row.name,
        version: Number(row.template_version),
        templateKind: row.template_kind,
        status: row.status,
        appliedAt: row.applied_at.toISOString(),
        appliedConfiguration: asJsonObject(row.applied_configuration)
      })),
      latestProvisioningRun: latestRun
        ? {
            id: latestRun.id,
            status: latestRun.status,
            startedAt: latestRun.started_at.toISOString(),
            completedAt: latestRun.completed_at?.toISOString() ?? null,
            steps
          }
        : null
    };
  }

  async provisionExistingTenant(
    tenantId: string,
    actorPersonId: string,
    input: TenantBusinessProfileInput
  ): Promise<TenantProvisioningResult> {
    return withTransaction(this.pool, async (connection) => {
      const [tenantRows] = await connection.query<Array<RowDataPacket & { id: string }>>(
        `SELECT id
           FROM tenants
          WHERE id = ?
            AND status = 'ACTIVE'
          LIMIT 1
          FOR UPDATE`,
        [tenantId]
      );
      if (!tenantRows[0]) {
        throw new TenantProvisioningError('Active Tenant not found.');
      }

      const [profileRows] = await connection.query<Array<RowDataPacket & { tenant_id: string }>>(
        `SELECT tenant_id
           FROM tenant_business_profiles
          WHERE tenant_id = ?
          LIMIT 1
          FOR UPDATE`,
        [tenantId]
      );
      if (profileRows[0]) {
        throw new TenantProvisioningError(
          'This Tenant already has a governed Business Profile. Changes require configuration impact assessment rather than reprovisioning.'
        );
      }

      return this.provisionRegistration(
        connection,
        tenantId,
        actorPersonId,
        input
      );
    });
  }

  async preview(input: TenantBusinessProfileInput): Promise<{
    templates: TenantProvisioningResult['templateApplications'];
    industrySolutionIds: string[];
  }> {
    const connection = await this.pool.getConnection();
    try {
      const profile = await this.validateProfile(connection, input);
      const resolved = await this.resolveTemplates(connection, profile);
      return {
        templates: resolved.templates.map((template) => ({
          templateId: template.id,
          code: template.code,
          name: template.name,
          version: Number(template.version),
          templateKind: template.template_kind
        })),
        industrySolutionIds: resolved.industrySolutionIds
      };
    } finally {
      connection.release();
    }
  }

  async provisionRegistration(
    connection: PoolConnection,
    tenantId: string,
    actorPersonId: string,
    input: TenantBusinessProfileInput
  ): Promise<TenantProvisioningResult> {
    const profile = await this.validateProfile(connection, input);
    const resolved = await this.resolveTemplates(connection, profile);
    const runId = `TPR-${randomUUID()}`;
    const now = new Date();

    const profileSnapshot = {
      primaryClassification: {
        id: profile.classification.id,
        schemeCode: profile.classification.scheme_code,
        code: profile.classification.value_code,
        name: profile.classification.value_name
      },
      sizeTier: profile.sizeTier,
      ...(profile.employeeCount !== undefined
        ? { employeeCount: profile.employeeCount }
        : {}),
      legalEntityCount: profile.legalEntityCount,
      primaryCountryCode: profile.primaryCountryCode,
      primaryLanguageCode: profile.primaryLanguageCode,
      operatingModels: profile.operatingModels.map((model) => model.code),
      regulatoryRegimes: profile.regulatoryRegimes.map((regime) => regime.code)
    };

    const templateResolution = resolved.templates.map((template) => ({
      templateId: template.id,
      code: template.code,
      version: Number(template.version),
      templateKind: template.template_kind,
      priority: Number(template.priority)
    }));

    await connection.execute(
      `INSERT INTO tenant_business_profiles
        (tenant_id, primary_classification_value_id, size_tier, employee_count,
         legal_entity_count, primary_country_code, primary_language_code,
         configuration_state, created_by_person_id, updated_by_person_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PROVISIONING', ?, ?)`,
      [
        tenantId,
        profile.classification.id,
        profile.sizeTier,
        profile.employeeCount ?? null,
        profile.legalEntityCount,
        profile.primaryCountryCode,
        profile.primaryLanguageCode,
        actorPersonId,
        actorPersonId
      ]
    );

    for (const [index, model] of profile.operatingModels.entries()) {
      await connection.execute(
        `INSERT INTO tenant_operating_models
          (tenant_id, operating_model_code, is_primary, status, created_by_person_id)
         VALUES (?, ?, ?, 'ACTIVE', ?)`,
        [tenantId, model.code, index === 0, actorPersonId]
      );
    }

    for (const regime of profile.regulatoryRegimes) {
      await connection.execute(
        `INSERT INTO tenant_regulatory_regime_assignments
          (tenant_id, regulatory_regime_id, source, status, created_by_person_id)
         VALUES (?, ?, 'TENANT_SELECTED', 'ACTIVE', ?)`,
        [tenantId, regime.id, actorPersonId]
      );
    }

    await connection.execute(
      `INSERT INTO tenant_provisioning_runs
        (id, tenant_id, profile_snapshot, template_resolution, status,
         started_at, initiated_by_person_id)
       VALUES (?, ?, ?, ?, 'APPLYING', ?, ?)`,
      [
        runId,
        tenantId,
        JSON.stringify(profileSnapshot),
        JSON.stringify(templateResolution),
        now,
        actorPersonId
      ]
    );

    await this.recordStep(connection, runId, 'BUSINESS_PROFILE', 10, {
      profile: profileSnapshot
    });

    await this.recordStep(connection, runId, 'TEMPLATE_RESOLUTION', 20, {
      templates: templateResolution
    });

    const appliedTemplates: TenantProvisioningResult['templateApplications'] = [];
    const activatedIndustries = new Set<string>();

    for (const template of resolved.templates) {
      const components = resolved.components.filter(
        (component) => component.template_id === template.id
      );
      const applicationId = `TCA-${randomUUID()}`;
      const appliedConfiguration = {
        template: {
          id: template.id,
          code: template.code,
          name: template.name,
          version: Number(template.version),
          kind: template.template_kind
        },
        configuration: asJsonObject(template.configuration_payload),
        components: components.map((component) => ({
          key: component.component_key,
          type: component.component_type,
          sequence: Number(component.sequence),
          required: Boolean(component.required),
          configuration: asJsonObject(component.configuration_payload)
        }))
      };

      await connection.execute(
        `INSERT INTO tenant_configuration_template_applications
          (id, tenant_id, template_id, template_version, applied_configuration,
           status, applied_at, applied_by_person_id)
         VALUES (?, ?, ?, ?, ?, 'APPLIED', ?, ?)`,
        [
          applicationId,
          tenantId,
          template.id,
          Number(template.version),
          JSON.stringify(appliedConfiguration),
          now,
          actorPersonId
        ]
      );

      for (const component of components) {
        if (component.component_type !== 'INDUSTRY_SOLUTION') continue;

        const componentConfiguration = asJsonObject(component.configuration_payload);
        const industrySolutionId =
          typeof componentConfiguration.industrySolutionId === 'string'
            ? componentConfiguration.industrySolutionId.trim()
            : '';

        if (!industrySolutionId) {
          throw new TenantProvisioningError(
            `Template component ${component.component_key} does not identify an Industry Solution.`
          );
        }

        await connection.execute(
          `INSERT INTO tenant_industry_solution_assignments
            (tenant_id, industry_solution_id, source_template_id, status,
             activated_at, created_by_person_id)
           VALUES (?, ?, ?, 'ACTIVE', ?, ?)
           ON DUPLICATE KEY UPDATE
             source_template_id = VALUES(source_template_id),
             status = 'ACTIVE',
             activated_at = VALUES(activated_at),
             created_by_person_id = VALUES(created_by_person_id)`,
          [tenantId, industrySolutionId, template.id, now, actorPersonId]
        );
        activatedIndustries.add(industrySolutionId);
      }

      appliedTemplates.push({
        templateId: template.id,
        code: template.code,
        name: template.name,
        version: Number(template.version),
        templateKind: template.template_kind
      });
    }

    await this.recordStep(connection, runId, 'CONFIGURATION_APPLICATION', 30, {
      templates: appliedTemplates,
      industrySolutionIds: [...activatedIndustries]
    });

    await connection.execute(
      `UPDATE tenant_business_profiles
          SET configuration_state = 'ACTIVE',
              provisioned_at = ?,
              updated_by_person_id = ?,
              row_version = row_version + 1
        WHERE tenant_id = ?`,
      [now, actorPersonId, tenantId]
    );

    await connection.execute(
      `UPDATE tenant_provisioning_runs
          SET status = 'APPLIED',
              completed_at = ?
        WHERE id = ?`,
      [now, runId]
    );

    const result: TenantProvisioningResult = {
      provisioningRunId: runId,
      templateApplications: appliedTemplates,
      industrySolutionIds: [...activatedIndustries]
    };

    await audit(
      connection,
      tenantId,
      'TENANT_BUSINESS_PROFILE',
      tenantId,
      'PROVISIONED',
      actorPersonId,
      {
        ...profileSnapshot,
        provisioningRunId: runId,
        templates: appliedTemplates,
        industrySolutionIds: result.industrySolutionIds
      }
    );

    return result;
  }

  private async validateProfile(
    connection: PoolConnection,
    input: TenantBusinessProfileInput
  ): Promise<ValidatedProfile> {
    if (!SIZE_TIERS.some((tier) => tier.code === input.sizeTier)) {
      throw new TenantProvisioningError('Business size tier is not valid.');
    }
    validateEmployeeCount(input.sizeTier, input.employeeCount);

    if (!Number.isInteger(input.legalEntityCount) || input.legalEntityCount <= 0) {
      throw new TenantProvisioningError(
        'Number of legal entities must be a positive whole number.'
      );
    }

    const countryCode = normalizeCountry(input.primaryCountryCode);
    const languageCode = normalizeLanguage(input.primaryLanguageCode);
    const classificationId = requiredString(
      input.primaryClassificationValueId,
      'Industry classification',
      96
    );
    const operatingCodes = uniqueCodes(input.operatingModelCodes);
    if (operatingCodes.length === 0) {
      throw new TenantProvisioningError('At least one operating model is required.');
    }
    const regulatoryIds = uniqueCodes(input.regulatoryRegimeIds ?? []);

    const [classificationRows] = await connection.query<ClassificationRow[]>(
      `SELECT v.id,
              s.code AS scheme_code,
              v.code AS value_code,
              v.name AS value_name,
              ism.industry_solution_id,
              i.name AS industry_solution_name
         FROM business_classification_values v
         JOIN business_classification_schemes s
           ON s.id = v.scheme_id
          AND s.status = 'ACTIVE'
         LEFT JOIN industry_solution_business_classifications ism
           ON ism.classification_value_id = v.id
         LEFT JOIN industry_solutions i
           ON i.id = ism.industry_solution_id
          AND i.status = 'ACTIVE'
        WHERE v.id = ?
          AND v.status = 'ACTIVE'
        LIMIT 1`,
      [classificationId]
    );
    const classification = classificationRows[0];
    if (!classification) {
      throw new TenantProvisioningError('Industry classification is not available.');
    }

    const [operatingRows] = await connection.query<OperatingModelRow[]>(
      `SELECT code, name, description
         FROM operating_model_definitions
        WHERE code IN (?)
          AND status = 'ACTIVE'
        ORDER BY name`,
      [operatingCodes]
    );
    if (operatingRows.length !== operatingCodes.length) {
      throw new TenantProvisioningError('One or more operating models are not available.');
    }

    let regulatoryRows: RegulatoryRow[] = [];
    if (regulatoryIds.length > 0) {
      const [rows] = await connection.query<RegulatoryRow[]>(
        `SELECT id, code, name, jurisdiction
           FROM regulatory_regimes
          WHERE id IN (?)
            AND status = 'ACTIVE'
          ORDER BY name`,
        [regulatoryIds]
      );
      if (rows.length !== regulatoryIds.length) {
        throw new TenantProvisioningError('One or more regulatory regimes are not available.');
      }
      regulatoryRows = rows;
    }

    return {
      classification,
      sizeTier: input.sizeTier,
      ...(input.employeeCount !== undefined
        ? { employeeCount: input.employeeCount }
        : {}),
      legalEntityCount: input.legalEntityCount,
      primaryCountryCode: countryCode,
      primaryLanguageCode: languageCode,
      operatingModels: operatingRows,
      regulatoryRegimes: regulatoryRows
    };
  }

  private async resolveTemplates(
    connection: PoolConnection,
    profile: ValidatedProfile
  ): Promise<{
    templates: TemplateRow[];
    components: ComponentRow[];
    industrySolutionIds: string[];
  }> {
    const [templates, criteria, components] = await Promise.all([
      connection.query<TemplateRow[]>(
        `SELECT id, code, name, description, template_kind, version, priority,
                industry_solution_id, configuration_payload
           FROM tenant_configuration_templates
          WHERE status = 'ACTIVE'
          ORDER BY priority, template_kind, code, version`
      ),
      connection.query<CriterionRow[]>(
        `SELECT template_id, criterion_type, criterion_value, sequence
           FROM tenant_configuration_template_criteria
          ORDER BY template_id, sequence, id`
      ),
      connection.query<ComponentRow[]>(
        `SELECT id, template_id, component_key, component_type, sequence,
                required, configuration_payload
           FROM tenant_configuration_template_components
          ORDER BY template_id, sequence, id`
      )
    ]);

    const criteriaByTemplate = new Map<string, CriterionRow[]>();
    for (const criterion of criteria[0]) {
      const existing = criteriaByTemplate.get(criterion.template_id) ?? [];
      existing.push(criterion);
      criteriaByTemplate.set(criterion.template_id, existing);
    }

    const selected = templates[0].filter((template) => {
      const templateCriteria = criteriaByTemplate.get(template.id) ?? [];
      return templateCriteria.every((criterion) => criterionMatches(criterion, profile));
    });

    if (!selected.some((template) => template.template_kind === 'CORE')) {
      throw new TenantProvisioningError(
        'No active NuBlox core configuration template could be resolved.'
      );
    }

    const industrySolutionIds = [
      ...new Set(
        selected
          .map((template) => template.industry_solution_id)
          .filter((value): value is string => Boolean(value))
      )
    ];

    return {
      templates: selected,
      components: components[0].filter((component) =>
        selected.some((template) => template.id === component.template_id)
      ),
      industrySolutionIds
    };
  }

  private async recordStep(
    connection: PoolConnection,
    runId: string,
    stepKey: string,
    sequence: number,
    evidence: unknown
  ): Promise<void> {
    const now = new Date();
    await connection.execute(
      `INSERT INTO tenant_provisioning_steps
        (id, provisioning_run_id, step_key, sequence, status, evidence,
         started_at, completed_at)
       VALUES (?, ?, ?, ?, 'APPLIED', ?, ?, ?)`,
      [
        `TPS-${randomUUID()}`,
        runId,
        stepKey,
        sequence,
        JSON.stringify(evidence),
        now,
        now
      ]
    );
  }
}
