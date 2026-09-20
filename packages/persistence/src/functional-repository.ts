import {
  createCompetenceEvidence,
  createCompetenceRequirement,
  createDeploymentAssignment,
  createDeploymentCapacity,
  createDeploymentGateResult,
  createFunctionGovernanceVersion,
  createFunctionalDeployment,
  createFunctionJobProfileParticipation,
  createProcessDefinition,
  createResponsibilityScope,
  createTaskDefinition,
  publishFunctionGovernanceVersion,
  retireFunctionGovernanceVersion,
  type CanonicalObjectIdentity,
  type CompetenceEvidence,
  type CompetenceRequirement,
  type DeploymentAssignment,
  type DeploymentCapacity,
  type DeploymentGateResult,
  type FunctionDefinition,
  type FunctionGovernanceVersion,
  type FunctionalActivityDefinition,
  type FunctionalDeployment,
  type FunctionJobProfileParticipation,
  type JobProfile,
  type Organisation,
  type OrganisationUnit,
  type PermissionScope,
  type Person,
  type Position,
  type ProcessDefinition,
  type ResponsibilityScope,
  type SubFunctionDefinition,
  type TaskDefinition,
  type TenantId
} from '@nublox/kernel';
import type {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket
} from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';
import type { AuditContext } from './repository.js';
import { MySqlAccessRepository } from './access-repository.js';

interface FunctionRow extends RowDataPacket {
  id: string;
  code: string;
  name: string;
  status: FunctionDefinition['status'];
}

interface SubFunctionRow extends RowDataPacket {
  id: string;
  function_id: string;
  code: string;
  name: string;
  sequence: number;
  status: SubFunctionDefinition['status'];
}

interface ActivityRow extends RowDataPacket {
  id: string;
  sub_function_id: string;
  name: string;
  sequence: number;
  status: FunctionalActivityDefinition['status'];
}

interface ProcessRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  function_id: string;
  sub_function_id: string | null;
  code: string;
  name: string;
  purpose: string;
  status: ProcessDefinition['status'];
}

interface GovernanceRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  function_id: string;
  version: number;
  status: FunctionGovernanceVersion['status'];
  purpose: string;
  mandate: string;
  scope_in: string | string[];
  scope_out: string | string[];
  accountable_owner_type: FunctionGovernanceVersion['accountableOwnerType'];
  accountable_owner_id: string;
  governance_body: string | null;
  policy_references: string | string[];
  standard_references: string | string[];
  procedure_references: string | string[];
  assurance_requirements: string | string[];
  performance_measures: string | string[];
  retention_requirements: string | null;
  effective_from: Date | null;
  effective_to: Date | null;
  row_version: number;
}

interface DeploymentRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  function_id: string;
  sub_function_id: string | null;
  organisation_id: string;
  organisation_unit_id: string | null;
  context_type: FunctionalDeployment['contextType'];
  context_object_id: string | null;
  scope_description: string;
  effective_from: Date;
  effective_to: Date | null;
  status: FunctionalDeployment['status'];
}

interface AssignmentRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  functional_deployment_id: string;
  assignee_type: DeploymentAssignment['assigneeType'];
  assignee_id: string;
  job_profile_id: string | null;
  responsibility_role: DeploymentAssignment['responsibilityRole'];
  effective_from: Date;
  effective_to: Date | null;
  status: DeploymentAssignment['status'];
}

interface PersonRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  party_id: string;
  legal_name: string;
  preferred_name: string | null;
  status: Person['status'];
}

interface OrganisationRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  party_id: string;
  legal_name: string;
  trading_name: string | null;
  status: Organisation['status'];
}

interface OrganisationUnitRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  organisation_id: string;
  parent_unit_id: string | null;
  code: string;
  name: string;
  status: OrganisationUnit['status'];
}

interface PositionRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  organisation_unit_id: string;
  job_profile_id: string | null;
  code: string;
  title: string;
  status: Position['status'];
}

interface JobProfileRow extends RowDataPacket {
  id: string;
  catalogue_scope: JobProfile['catalogueScope'];
  tenant_id: string | null;
  code: string;
  name: string;
  status: JobProfile['status'];
}

interface CanonicalObjectRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  object_type: string;
  stable_key: string;
  created_at: Date;
}

interface CountRow extends RowDataPacket {
  count: number | string;
}

interface CompetenceRequirementRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  subject_type: CompetenceRequirement['subjectType'];
  subject_id: string;
  competence_code: string;
  competence_name: string;
  required_level: string;
  evidence_required: number | boolean;
  expiry_required: number | boolean;
  status: CompetenceRequirement['status'];
}

interface PositionContextRow extends RowDataPacket {
  position_id: string;
  organisation_unit_id: string;
}

interface CapacityRow extends RowDataPacket {
  capacity_percent: string | number;
}

export interface DeploymentGateRequirements {
  requiredPermission?: {
    permissionKey: string;
    scope: PermissionScope;
  };
  requiredAuthority?: {
    authorityDefinitionId: string;
    scopeType: string;
    scopeId?: string;
    minimumLimitValue?: number;
  };
  minimumCapacityPercent?: number;
}

function databaseDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date/time value: ${value}`);
  }
  return date;
}

function jsonArray(value: string | string[]): string[] {
  if (Array.isArray(value)) return value.map(String);
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) throw new Error('Expected JSON array.');
  return parsed.map(String);
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

function mapFunction(row: FunctionRow): FunctionDefinition {
  return {
    id: row.id as FunctionDefinition['id'],
    code: row.code,
    name: row.name,
    status: row.status
  };
}

function mapSubFunction(row: SubFunctionRow): SubFunctionDefinition {
  return {
    id: row.id as SubFunctionDefinition['id'],
    functionId: row.function_id as SubFunctionDefinition['functionId'],
    code: row.code,
    name: row.name,
    sequence: Number(row.sequence),
    status: row.status
  };
}

function mapActivity(row: ActivityRow): FunctionalActivityDefinition {
  return {
    id: row.id as FunctionalActivityDefinition['id'],
    subFunctionId: row.sub_function_id as FunctionalActivityDefinition['subFunctionId'],
    name: row.name,
    sequence: Number(row.sequence),
    status: row.status
  };
}

function mapProcess(row: ProcessRow): ProcessDefinition {
  return {
    id: row.id as ProcessDefinition['id'],
    tenantId: row.tenant_id as TenantId,
    functionId: row.function_id as ProcessDefinition['functionId'],
    ...(row.sub_function_id
      ? { subFunctionId: row.sub_function_id as NonNullable<ProcessDefinition['subFunctionId']> }
      : {}),
    code: row.code,
    name: row.name,
    purpose: row.purpose,
    status: row.status
  };
}

function mapGovernance(row: GovernanceRow): FunctionGovernanceVersion {
  return {
    id: row.id as FunctionGovernanceVersion['id'],
    tenantId: row.tenant_id as TenantId,
    functionId: row.function_id as FunctionGovernanceVersion['functionId'],
    version: Number(row.version),
    status: row.status,
    purpose: row.purpose,
    mandate: row.mandate,
    scopeIn: Object.freeze(jsonArray(row.scope_in)),
    scopeOut: Object.freeze(jsonArray(row.scope_out)),
    accountableOwnerType: row.accountable_owner_type,
    accountableOwnerId: row.accountable_owner_id,
    ...(row.governance_body ? { governanceBody: row.governance_body } : {}),
    policyReferences: Object.freeze(jsonArray(row.policy_references)),
    standardReferences: Object.freeze(jsonArray(row.standard_references)),
    procedureReferences: Object.freeze(jsonArray(row.procedure_references)),
    assuranceRequirements: Object.freeze(jsonArray(row.assurance_requirements)),
    performanceMeasures: Object.freeze(jsonArray(row.performance_measures)),
    ...(row.retention_requirements
      ? { retentionRequirements: row.retention_requirements }
      : {}),
    ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
    ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {})
  };
}

function mapDeployment(row: DeploymentRow): FunctionalDeployment {
  return {
    id: row.id as FunctionalDeployment['id'],
    tenantId: row.tenant_id as TenantId,
    functionId: row.function_id as FunctionalDeployment['functionId'],
    ...(row.sub_function_id
      ? { subFunctionId: row.sub_function_id as NonNullable<FunctionalDeployment['subFunctionId']> }
      : {}),
    organisationId: row.organisation_id as FunctionalDeployment['organisationId'],
    ...(row.organisation_unit_id
      ? { organisationUnitId: row.organisation_unit_id as NonNullable<FunctionalDeployment['organisationUnitId']> }
      : {}),
    contextType: row.context_type,
    ...(row.context_object_id
      ? { contextObjectId: row.context_object_id as NonNullable<FunctionalDeployment['contextObjectId']> }
      : {}),
    scopeDescription: row.scope_description,
    effectiveFrom: row.effective_from.toISOString(),
    ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
    status: row.status
  };
}

function mapAssignment(row: AssignmentRow): DeploymentAssignment {
  return {
    id: row.id as DeploymentAssignment['id'],
    tenantId: row.tenant_id as TenantId,
    functionalDeploymentId:
      row.functional_deployment_id as DeploymentAssignment['functionalDeploymentId'],
    assigneeType: row.assignee_type,
    assigneeId: row.assignee_id,
    ...(row.job_profile_id
      ? { jobProfileId: row.job_profile_id as NonNullable<DeploymentAssignment['jobProfileId']> }
      : {}),
    responsibilityRole: row.responsibility_role,
    effectiveFrom: row.effective_from.toISOString(),
    ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
    status: row.status
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

function mapOrganisation(row: OrganisationRow): Organisation {
  return {
    id: row.id as Organisation['id'],
    tenantId: row.tenant_id as TenantId,
    partyId: row.party_id as Organisation['partyId'],
    legalName: row.legal_name,
    ...(row.trading_name ? { tradingName: row.trading_name } : {}),
    status: row.status
  };
}

function mapOrganisationUnit(row: OrganisationUnitRow): OrganisationUnit {
  return {
    id: row.id as OrganisationUnit['id'],
    tenantId: row.tenant_id as TenantId,
    organisationId: row.organisation_id as OrganisationUnit['organisationId'],
    ...(row.parent_unit_id
      ? { parentUnitId: row.parent_unit_id as NonNullable<OrganisationUnit['parentUnitId']> }
      : {}),
    code: row.code,
    name: row.name,
    status: row.status
  };
}

function mapPosition(row: PositionRow): Position {
  return {
    id: row.id as Position['id'],
    tenantId: row.tenant_id as TenantId,
    organisationUnitId: row.organisation_unit_id as Position['organisationUnitId'],
    ...(row.job_profile_id
      ? { jobProfileId: row.job_profile_id as NonNullable<Position['jobProfileId']> }
      : {}),
    code: row.code,
    title: row.title,
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

function mapCanonicalObject(row: CanonicalObjectRow): CanonicalObjectIdentity {
  return {
    id: row.id as CanonicalObjectIdentity['id'],
    tenantId: row.tenant_id as TenantId,
    objectType: row.object_type,
    stableKey: row.stable_key,
    createdAt: row.created_at.toISOString()
  };
}

function isEffective(
  status: string,
  effectiveFrom: string,
  effectiveTo: string | undefined,
  at: string
): boolean {
  if (status !== 'ACTIVE') return false;
  const t = Date.parse(at);
  if (Date.parse(effectiveFrom) > t) return false;
  if (effectiveTo && Date.parse(effectiveTo) < t) return false;
  return true;
}

export class MySqlFunctionalRepository {
  private readonly access: MySqlAccessRepository;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
  }

  async taxonomyCounts(): Promise<{
    functions: number;
    subFunctions: number;
    activities: number;
  }> {
    const [[f], [s], [a]] = await Promise.all([
      this.pool.execute<CountRow[]>('SELECT COUNT(*) AS count FROM function_definitions'),
      this.pool.execute<CountRow[]>('SELECT COUNT(*) AS count FROM sub_function_definitions'),
      this.pool.execute<CountRow[]>('SELECT COUNT(*) AS count FROM functional_activity_definitions')
    ]);
    return {
      functions: Number(f[0]?.count ?? 0),
      subFunctions: Number(s[0]?.count ?? 0),
      activities: Number(a[0]?.count ?? 0)
    };
  }

  async listFunctions(): Promise<FunctionDefinition[]> {
    const [rows] = await this.pool.execute<FunctionRow[]>(
      `SELECT id, code, name, status
         FROM function_definitions
        ORDER BY code`
    );
    return rows.map(mapFunction);
  }

  async createProcessDefinition(
    tenantId: TenantId,
    process: ProcessDefinition,
    audit: AuditContext = {}
  ): Promise<void> {
    if (process.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const [fn, sf] = await Promise.all([
      this.requireFunction(process.functionId),
      process.subFunctionId ? this.requireSubFunction(process.subFunctionId) : Promise.resolve(undefined)
    ]);
    createProcessDefinition(process, fn, sf);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO process_definitions
          (id, tenant_id, function_id, sub_function_id, code, name, purpose, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          process.id,
          process.tenantId,
          process.functionId,
          process.subFunctionId ?? null,
          process.code,
          process.name,
          process.purpose,
          process.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(connection, tenantId, 'PROCESS_DEFINITION', process.id, 'CREATED', audit, process);
    });
  }

  async createTaskDefinition(
    tenantId: TenantId,
    task: TaskDefinition,
    audit: AuditContext = {}
  ): Promise<void> {
    if (task.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const [process, activity] = await Promise.all([
      this.requireProcess(tenantId, task.processDefinitionId),
      task.functionalActivityId ? this.requireActivity(task.functionalActivityId) : Promise.resolve(undefined)
    ]);
    createTaskDefinition(task, process, activity);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO task_definitions
          (id, tenant_id, process_definition_id, functional_activity_id,
           code, name, instructions, sequence, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          task.id,
          task.tenantId,
          task.processDefinitionId,
          task.functionalActivityId ?? null,
          task.code,
          task.name,
          task.instructions ?? null,
          task.sequence,
          task.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(connection, tenantId, 'TASK_DEFINITION', task.id, 'CREATED', audit, task);
    });
  }

  async createGovernanceVersion(
    tenantId: TenantId,
    governance: FunctionGovernanceVersion,
    audit: AuditContext = {}
  ): Promise<void> {
    if (governance.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const [fn, owner] = await Promise.all([
      this.requireFunction(governance.functionId),
      governance.accountableOwnerType === 'PERSON'
        ? this.requirePerson(tenantId, governance.accountableOwnerId)
        : this.requirePosition(tenantId, governance.accountableOwnerId)
    ]);
    createFunctionGovernanceVersion(governance, fn, owner);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO function_governance_versions
          (id, tenant_id, function_id, version, status, purpose, mandate,
           scope_in, scope_out, accountable_owner_type, accountable_owner_id,
           governance_body, policy_references, standard_references,
           procedure_references, assurance_requirements, performance_measures,
           retention_requirements, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          governance.id,
          governance.tenantId,
          governance.functionId,
          governance.version,
          governance.status,
          governance.purpose,
          governance.mandate,
          JSON.stringify(governance.scopeIn),
          JSON.stringify(governance.scopeOut),
          governance.accountableOwnerType,
          governance.accountableOwnerId,
          governance.governanceBody ?? null,
          JSON.stringify(governance.policyReferences),
          JSON.stringify(governance.standardReferences),
          JSON.stringify(governance.procedureReferences),
          JSON.stringify(governance.assuranceRequirements),
          JSON.stringify(governance.performanceMeasures),
          governance.retentionRequirements ?? null,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(connection, tenantId, 'FUNCTION_GOVERNANCE_VERSION', governance.id, 'CREATED', audit, governance);
    });
  }

  async publishGovernanceVersion(
    tenantId: TenantId,
    id: FunctionGovernanceVersion['id'],
    effectiveFrom: string,
    audit: AuditContext = {}
  ): Promise<FunctionGovernanceVersion> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireGovernanceForUpdate(connection, tenantId, id);
      const next = publishFunctionGovernanceVersion(mapGovernance(row), effectiveFrom);
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE function_governance_versions
            SET status = ?, effective_from = ?, row_version = row_version + 1,
                updated_by_person_id = ?
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          next.status,
          databaseDate(effectiveFrom),
          audit.actorPersonId ?? null,
          tenantId,
          id,
          row.row_version
        ]
      );
      if (result.affectedRows !== 1) {
        throw new Error('Concurrent Function Governance publication detected.');
      }
      await writeAudit(connection, tenantId, 'FUNCTION_GOVERNANCE_VERSION', id, 'PUBLISHED', audit, next);
      return next;
    });
  }

  async retireGovernanceVersion(
    tenantId: TenantId,
    id: FunctionGovernanceVersion['id'],
    effectiveTo: string,
    audit: AuditContext = {}
  ): Promise<FunctionGovernanceVersion> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireGovernanceForUpdate(connection, tenantId, id);
      const next = retireFunctionGovernanceVersion(mapGovernance(row), effectiveTo);
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE function_governance_versions
            SET status = ?, effective_to = ?, row_version = row_version + 1,
                updated_by_person_id = ?
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          next.status,
          databaseDate(effectiveTo),
          audit.actorPersonId ?? null,
          tenantId,
          id,
          row.row_version
        ]
      );
      if (result.affectedRows !== 1) {
        throw new Error('Concurrent Function Governance retirement detected.');
      }
      await writeAudit(connection, tenantId, 'FUNCTION_GOVERNANCE_VERSION', id, 'RETIRED', audit, next);
      return next;
    });
  }

  async createJobProfileParticipation(
    participation: FunctionJobProfileParticipation,
    audit: AuditContext = {}
  ): Promise<void> {
    const [fn, sf, job] = await Promise.all([
      this.requireFunction(participation.functionId),
      participation.subFunctionId ? this.requireSubFunction(participation.subFunctionId) : Promise.resolve(undefined),
      this.requireJobProfile(participation.jobProfileId)
    ]);
    createFunctionJobProfileParticipation(participation, fn, job, sf);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO function_job_profile_participations
          (id, catalogue_scope, tenant_id, function_id, sub_function_id,
           job_profile_id, mode, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          participation.id,
          participation.catalogueScope,
          participation.tenantId ?? null,
          participation.functionId,
          participation.subFunctionId ?? null,
          participation.jobProfileId,
          participation.mode,
          participation.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      if (participation.tenantId) {
        await writeAudit(
          connection,
          participation.tenantId,
          'FUNCTION_JOB_PROFILE_PARTICIPATION',
          participation.id,
          'CREATED',
          audit,
          participation
        );
      }
    });
  }

  async createCompetenceRequirement(
    tenantId: TenantId,
    requirement: CompetenceRequirement,
    audit: AuditContext = {}
  ): Promise<void> {
    if (requirement.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    createCompetenceRequirement(requirement);
    await this.requireCompetenceSubject(requirement);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO competence_requirements
          (id, tenant_id, subject_type, subject_id, competence_code,
           competence_name, required_level, evidence_required, expiry_required,
           status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          requirement.id,
          requirement.tenantId,
          requirement.subjectType,
          requirement.subjectId,
          requirement.competenceCode,
          requirement.competenceName,
          requirement.requiredLevel,
          requirement.evidenceRequired,
          requirement.expiryRequired,
          requirement.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(connection, tenantId, 'COMPETENCE_REQUIREMENT', requirement.id, 'CREATED', audit, requirement);
    });
  }

  async createCompetenceEvidence(
    tenantId: TenantId,
    evidence: CompetenceEvidence,
    audit: AuditContext = {}
  ): Promise<void> {
    if (evidence.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const person = await this.requirePerson(tenantId, evidence.personId);
    createCompetenceEvidence(evidence, person);

    if (evidence.evidenceRecordId) {
      const [rows] = await this.pool.execute<RowDataPacket[]>(
        'SELECT id FROM evidence_records WHERE tenant_id = ? AND id = ?',
        [tenantId, evidence.evidenceRecordId]
      );
      if (!rows[0]) throw new Error('Evidence Record not found in tenant.');
    }

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO competence_evidence
          (id, tenant_id, person_id, competence_code, attained_level,
           evidence_record_id, issued_at, effective_from, effective_to, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          evidence.id,
          evidence.tenantId,
          evidence.personId,
          evidence.competenceCode,
          evidence.attainedLevel,
          evidence.evidenceRecordId ?? null,
          databaseDate(evidence.issuedAt),
          databaseDate(evidence.effectiveFrom),
          evidence.effectiveTo ? databaseDate(evidence.effectiveTo) : null,
          evidence.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(connection, tenantId, 'COMPETENCE_EVIDENCE', evidence.id, 'CREATED', audit, evidence);
    });
  }

  async createDeployment(
    tenantId: TenantId,
    deployment: FunctionalDeployment,
    audit: AuditContext = {}
  ): Promise<void> {
    if (deployment.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const [fn, org, unit, context, sf] = await Promise.all([
      this.requireFunction(deployment.functionId),
      this.requireOrganisation(tenantId, deployment.organisationId),
      deployment.organisationUnitId
        ? this.requireOrganisationUnit(tenantId, deployment.organisationUnitId)
        : Promise.resolve(undefined),
      deployment.contextObjectId
        ? this.requireCanonicalObject(tenantId, deployment.contextObjectId)
        : Promise.resolve(undefined),
      deployment.subFunctionId
        ? this.requireSubFunction(deployment.subFunctionId)
        : Promise.resolve(undefined)
    ]);
    createFunctionalDeployment(deployment, fn, org, unit, context, sf);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO functional_deployments
          (id, tenant_id, function_id, sub_function_id, organisation_id,
           organisation_unit_id, context_type, context_object_id, scope_description,
           effective_from, effective_to, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          deployment.id,
          deployment.tenantId,
          deployment.functionId,
          deployment.subFunctionId ?? null,
          deployment.organisationId,
          deployment.organisationUnitId ?? null,
          deployment.contextType,
          deployment.contextObjectId ?? null,
          deployment.scopeDescription,
          databaseDate(deployment.effectiveFrom),
          deployment.effectiveTo ? databaseDate(deployment.effectiveTo) : null,
          deployment.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(connection, tenantId, 'FUNCTIONAL_DEPLOYMENT', deployment.id, 'CREATED', audit, deployment);
    });
  }

  async createDeploymentAssignment(
    tenantId: TenantId,
    assignment: DeploymentAssignment,
    audit: AuditContext = {}
  ): Promise<void> {
    if (assignment.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const [deployment, assignee, job] = await Promise.all([
      this.requireDeployment(tenantId, assignment.functionalDeploymentId),
      this.requireDeploymentAssignee(tenantId, assignment.assigneeType, assignment.assigneeId),
      assignment.jobProfileId ? this.requireJobProfile(assignment.jobProfileId) : Promise.resolve(undefined)
    ]);
    createDeploymentAssignment(assignment, deployment, assignee, job);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO deployment_assignments
          (id, tenant_id, functional_deployment_id, assignee_type, assignee_id,
           job_profile_id, responsibility_role, effective_from, effective_to, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          assignment.id,
          assignment.tenantId,
          assignment.functionalDeploymentId,
          assignment.assigneeType,
          assignment.assigneeId,
          assignment.jobProfileId ?? null,
          assignment.responsibilityRole,
          databaseDate(assignment.effectiveFrom),
          assignment.effectiveTo ? databaseDate(assignment.effectiveTo) : null,
          assignment.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(connection, tenantId, 'DEPLOYMENT_ASSIGNMENT', assignment.id, 'CREATED', audit, assignment);
    });
  }

  async createResponsibilityScope(
    tenantId: TenantId,
    scope: ResponsibilityScope,
    audit: AuditContext = {}
  ): Promise<void> {
    if (scope.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const assignment = await this.requireAssignment(tenantId, scope.deploymentAssignmentId);
    createResponsibilityScope(scope, assignment);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO responsibility_scopes
          (id, tenant_id, deployment_assignment_id, responsibility_role,
           scope_type, scope_id, description, effective_from, effective_to, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          scope.id,
          scope.tenantId,
          scope.deploymentAssignmentId,
          scope.responsibilityRole,
          scope.scopeType,
          scope.scopeId ?? null,
          scope.description ?? null,
          databaseDate(scope.effectiveFrom),
          scope.effectiveTo ? databaseDate(scope.effectiveTo) : null,
          scope.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(connection, tenantId, 'RESPONSIBILITY_SCOPE', scope.id, 'CREATED', audit, scope);
    });
  }

  async createDeploymentCapacity(
    tenantId: TenantId,
    capacity: DeploymentCapacity,
    audit: AuditContext = {}
  ): Promise<void> {
    if (capacity.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const assignment = await this.requireAssignment(tenantId, capacity.deploymentAssignmentId);
    createDeploymentCapacity(capacity, assignment);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO deployment_capacities
          (id, tenant_id, deployment_assignment_id, capacity_percent,
           effective_from, effective_to, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          capacity.id,
          capacity.tenantId,
          capacity.deploymentAssignmentId,
          capacity.capacityPercent,
          databaseDate(capacity.effectiveFrom),
          capacity.effectiveTo ? databaseDate(capacity.effectiveTo) : null,
          capacity.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(connection, tenantId, 'DEPLOYMENT_CAPACITY', capacity.id, 'CREATED', audit, capacity);
    });
  }

  async evaluateDeploymentGate(
    tenantId: TenantId,
    deploymentId: FunctionalDeployment['id'],
    personId: Person['id'],
    requirements: DeploymentGateRequirements = {},
    evaluatedAt = new Date().toISOString()
  ): Promise<DeploymentGateResult> {
    const at = databaseDate(evaluatedAt);
    const [deployment, person] = await Promise.all([
      this.requireDeployment(tenantId, deploymentId),
      this.requirePerson(tenantId, personId)
    ]);

    const checks: Array<DeploymentGateResult['checks'][number]> = [];

    const deploymentActive = isEffective(
      deployment.status,
      deployment.effectiveFrom,
      deployment.effectiveTo,
      evaluatedAt
    );
    checks.push({
      check: 'ACTIVE_DEPLOYMENT',
      passed: deploymentActive,
      reason: deploymentActive
        ? 'Functional Deployment is active and effective.'
        : 'Functional Deployment is not active/effective at the evaluation time.'
    });

    const [positionRows] = await this.pool.execute<PositionContextRow[]>(
      `SELECT po.position_id, p.organisation_unit_id
         FROM position_occupancies po
         JOIN positions p
           ON p.tenant_id = po.tenant_id
          AND p.id = po.position_id
        WHERE po.tenant_id = ?
          AND po.person_id = ?
          AND po.effective_from <= ?
          AND (po.effective_to IS NULL OR po.effective_to >= ?)
          AND p.status = 'ACTIVE'`,
      [tenantId, personId, at, at]
    );

    const [assignmentRows] = await this.pool.execute<AssignmentRow[]>(
      `SELECT da.id, da.tenant_id, da.functional_deployment_id,
              da.assignee_type, da.assignee_id, da.job_profile_id,
              da.responsibility_role, da.effective_from, da.effective_to, da.status
         FROM deployment_assignments da
        WHERE da.tenant_id = ?
          AND da.functional_deployment_id = ?
          AND da.status = 'ACTIVE'
          AND da.effective_from <= ?
          AND (da.effective_to IS NULL OR da.effective_to >= ?)
          AND (
            (da.assignee_type = 'PERSON' AND da.assignee_id = ?)
            OR
            (da.assignee_type = 'POSITION' AND da.assignee_id IN (
              SELECT po.position_id
                FROM position_occupancies po
               WHERE po.tenant_id = ?
                 AND po.person_id = ?
                 AND po.effective_from <= ?
                 AND (po.effective_to IS NULL OR po.effective_to >= ?)
            ))
            OR
            (da.assignee_type = 'ORGANISATION_UNIT' AND da.assignee_id IN (
              SELECT p.organisation_unit_id
                FROM position_occupancies po
                JOIN positions p
                  ON p.tenant_id = po.tenant_id
                 AND p.id = po.position_id
               WHERE po.tenant_id = ?
                 AND po.person_id = ?
                 AND po.effective_from <= ?
                 AND (po.effective_to IS NULL OR po.effective_to >= ?)
                 AND p.status = 'ACTIVE'
            ))
          )
        ORDER BY
          CASE da.assignee_type
            WHEN 'PERSON' THEN 1
            WHEN 'POSITION' THEN 2
            ELSE 3
          END,
          da.effective_from DESC
        LIMIT 1`,
      [
        tenantId,
        deploymentId,
        at,
        at,
        personId,
        tenantId,
        personId,
        at,
        at,
        tenantId,
        personId,
        at,
        at
      ]
    );
    const assignmentRow = assignmentRows[0];
    const assignment = assignmentRow ? mapAssignment(assignmentRow) : undefined;

    checks.push({
      check: 'ACTIVE_ASSIGNMENT',
      passed: Boolean(assignment),
      reason: assignment
        ? `Active Deployment Assignment matched through ${assignment.assigneeType}.`
        : 'No active Deployment Assignment resolves to this Person.'
    });

    const occupancyPass =
      assignment?.assigneeType === 'PERSON' || positionRows.length > 0;
    checks.push({
      check: 'POSITION_OCCUPANCY',
      passed: occupancyPass,
      reason: assignment?.assigneeType === 'PERSON'
        ? 'Direct Person deployment does not require Position occupancy.'
        : occupancyPass
          ? 'Person has an effective active Position occupancy.'
          : 'No effective active Position occupancy supports the deployment assignment.'
    });

    const [competenceRows] = await this.pool.execute<CompetenceRequirementRow[]>(
      `SELECT id, tenant_id, subject_type, subject_id, competence_code,
              competence_name, required_level, evidence_required, expiry_required, status
         FROM competence_requirements
        WHERE tenant_id = ?
          AND status = 'ACTIVE'
          AND (
            (subject_type = 'FUNCTION' AND subject_id = ?)
            OR
            (? IS NOT NULL AND subject_type = 'SUB_FUNCTION' AND subject_id = ?)
            OR
            (subject_type = 'DEPLOYMENT' AND subject_id = ?)
          )
        ORDER BY competence_code`,
      [
        tenantId,
        deployment.functionId,
        deployment.subFunctionId ?? null,
        deployment.subFunctionId ?? null,
        deployment.id
      ]
    );

    const competenceFailures: string[] = [];
    for (const requirement of competenceRows) {
      const [evidenceRows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT id, evidence_record_id, effective_to
           FROM competence_evidence
          WHERE tenant_id = ?
            AND person_id = ?
            AND competence_code = ?
            AND attained_level = ?
            AND status = 'ACTIVE'
            AND effective_from <= ?
            AND (effective_to IS NULL OR effective_to >= ?)
          ORDER BY effective_from DESC
          LIMIT 1`,
        [
          tenantId,
          personId,
          requirement.competence_code,
          requirement.required_level,
          at,
          at
        ]
      );
      const evidence = evidenceRows[0] as
        | { evidence_record_id?: string | null; effective_to?: Date | null }
        | undefined;
      if (!evidence) {
        competenceFailures.push(
          `${requirement.competence_code}: required level ${requirement.required_level} is not evidenced.`
        );
        continue;
      }
      if (Boolean(requirement.evidence_required) && !evidence.evidence_record_id) {
        competenceFailures.push(
          `${requirement.competence_code}: formal Evidence Record is required.`
        );
      }
      if (Boolean(requirement.expiry_required) && !evidence.effective_to) {
        competenceFailures.push(
          `${requirement.competence_code}: expiring competence requires effectiveTo.`
        );
      }
    }
    checks.push({
      check: 'COMPETENCE',
      passed: competenceFailures.length === 0,
      reason: competenceFailures.length === 0
        ? competenceRows.length === 0
          ? 'No active competence requirements apply.'
          : 'All applicable competence requirements are satisfied.'
        : competenceFailures.join(' ')
    });

    let authorityPassed = true;
    let authorityReason = 'No authority requirement was requested for this deployment gate.';
    if (requirements.requiredAuthority) {
      const auth = requirements.requiredAuthority;
      const [authorityRows] = await this.pool.execute<CountRow[]>(
        `SELECT COUNT(*) AS count
           FROM authority_grants ag
          WHERE ag.tenant_id = ?
            AND ag.authority_definition_id = ?
            AND ag.status = 'ACTIVE'
            AND ag.effective_from <= ?
            AND (ag.effective_to IS NULL OR ag.effective_to >= ?)
            AND (
              (ag.scope_type = 'TENANT' AND ag.scope_id IS NULL)
              OR
              (ag.scope_type = ? AND ag.scope_id <=> ?)
            )
            AND (
              ? IS NULL
              OR ag.limit_value IS NULL
              OR ag.limit_value >= ?
            )
            AND (
              (ag.grantee_type = 'PERSON' AND ag.grantee_id = ?)
              OR
              (ag.grantee_type = 'POSITION' AND ag.grantee_id IN (
                SELECT po.position_id
                  FROM position_occupancies po
                 WHERE po.tenant_id = ?
                   AND po.person_id = ?
                   AND po.effective_from <= ?
                   AND (po.effective_to IS NULL OR po.effective_to >= ?)
              ))
              OR
              (ag.grantee_type = 'ORGANISATION_UNIT' AND ag.grantee_id IN (
                SELECT p.organisation_unit_id
                  FROM position_occupancies po
                  JOIN positions p
                    ON p.tenant_id = po.tenant_id
                   AND p.id = po.position_id
                 WHERE po.tenant_id = ?
                   AND po.person_id = ?
                   AND po.effective_from <= ?
                   AND (po.effective_to IS NULL OR po.effective_to >= ?)
              ))
              OR
              EXISTS (
                SELECT 1
                  FROM delegations d
                 WHERE d.tenant_id = ag.tenant_id
                   AND d.authority_grant_id = ag.id
                   AND d.delegated_to_person_id = ?
                   AND d.status = 'ACTIVE'
                   AND d.effective_from <= ?
                   AND (d.effective_to IS NULL OR d.effective_to >= ?)
              )
            )`,
        [
          tenantId,
          auth.authorityDefinitionId,
          at,
          at,
          auth.scopeType,
          auth.scopeId ?? null,
          auth.minimumLimitValue ?? null,
          auth.minimumLimitValue ?? null,
          personId,
          tenantId,
          personId,
          at,
          at,
          tenantId,
          personId,
          at,
          at,
          personId,
          at,
          at
        ]
      );
      authorityPassed = Number(authorityRows[0]?.count ?? 0) > 0;
      authorityReason = authorityPassed
        ? 'Required active Authority Grant or Delegation is present in scope.'
        : 'Required Authority is not present for the Person in scope.';
    }
    checks.push({
      check: 'AUTHORITY',
      passed: authorityPassed,
      reason: authorityReason
    });

    let permissionPassed = true;
    let permissionReason = 'No permission requirement was requested for this deployment gate.';
    if (requirements.requiredPermission) {
      const permission = await this.access.evaluatePermission(
        tenantId,
        personId,
        requirements.requiredPermission.permissionKey,
        requirements.requiredPermission.scope,
        evaluatedAt
      );
      permissionPassed = permission.allowed;
      permissionReason = permission.reason;
    }
    checks.push({
      check: 'PERMISSION',
      passed: permissionPassed,
      reason: permissionReason
    });

    let capacityPassed = false;
    let capacityReason = 'No active capacity allocation is available.';
    if (assignment) {
      const [capacityRows] = await this.pool.execute<CapacityRow[]>(
        `SELECT capacity_percent
           FROM deployment_capacities
          WHERE tenant_id = ?
            AND deployment_assignment_id = ?
            AND status = 'ACTIVE'
            AND effective_from <= ?
            AND (effective_to IS NULL OR effective_to >= ?)
          ORDER BY effective_from DESC`,
        [tenantId, assignment.id, at, at]
      );
      const available = capacityRows.reduce(
        (total, row) => total + Number(row.capacity_percent),
        0
      );
      const minimum = requirements.minimumCapacityPercent ?? 0.01;
      capacityPassed = available >= minimum;
      capacityReason = capacityPassed
        ? `Active deployment capacity is ${available}% (required ${minimum}%).`
        : `Active deployment capacity is ${available}% (required ${minimum}%).`;
    }
    checks.push({
      check: 'AVAILABILITY',
      passed: capacityPassed,
      reason: capacityReason
    });

    return createDeploymentGateResult({
      tenantId,
      functionalDeploymentId: deployment.id,
      personId: person.id,
      evaluatedAt,
      allowed: checks.every((check) => check.passed),
      checks
    });
  }

  private async requireFunction(id: string): Promise<FunctionDefinition> {
    const [rows] = await this.pool.execute<FunctionRow[]>(
      'SELECT id, code, name, status FROM function_definitions WHERE id = ?',
      [id]
    );
    const row = rows[0];
    if (!row) throw new Error('Function Definition not found.');
    return mapFunction(row);
  }

  private async requireSubFunction(id: string): Promise<SubFunctionDefinition> {
    const [rows] = await this.pool.execute<SubFunctionRow[]>(
      `SELECT id, function_id, code, name, sequence, status
         FROM sub_function_definitions WHERE id = ?`,
      [id]
    );
    const row = rows[0];
    if (!row) throw new Error('Sub-function Definition not found.');
    return mapSubFunction(row);
  }

  private async requireActivity(id: string): Promise<FunctionalActivityDefinition> {
    const [rows] = await this.pool.execute<ActivityRow[]>(
      `SELECT id, sub_function_id, name, sequence, status
         FROM functional_activity_definitions WHERE id = ?`,
      [id]
    );
    const row = rows[0];
    if (!row) throw new Error('Functional Activity Definition not found.');
    return mapActivity(row);
  }

  private async requireProcess(
    tenantId: TenantId,
    id: string
  ): Promise<ProcessDefinition> {
    const [rows] = await this.pool.execute<ProcessRow[]>(
      `SELECT id, tenant_id, function_id, sub_function_id, code, name, purpose, status
         FROM process_definitions WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Process Definition not found in tenant.');
    return mapProcess(row);
  }

  private async requireGovernanceForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: string
  ): Promise<GovernanceRow> {
    const [rows] = await connection.execute<GovernanceRow[]>(
      `SELECT id, tenant_id, function_id, version, status, purpose, mandate,
              scope_in, scope_out, accountable_owner_type, accountable_owner_id,
              governance_body, policy_references, standard_references,
              procedure_references, assurance_requirements, performance_measures,
              retention_requirements, effective_from, effective_to, row_version
         FROM function_governance_versions
        WHERE tenant_id = ? AND id = ?
        FOR UPDATE`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Function Governance Version not found in tenant.');
    return row;
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

  private async requireOrganisation(
    tenantId: TenantId,
    id: string
  ): Promise<Organisation> {
    const [rows] = await this.pool.execute<OrganisationRow[]>(
      `SELECT id, tenant_id, party_id, legal_name, trading_name, status
         FROM organisations WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Organisation not found in tenant.');
    return mapOrganisation(row);
  }

  private async requireOrganisationUnit(
    tenantId: TenantId,
    id: string
  ): Promise<OrganisationUnit> {
    const [rows] = await this.pool.execute<OrganisationUnitRow[]>(
      `SELECT id, tenant_id, organisation_id, parent_unit_id, code, name, status
         FROM organisation_units WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Organisation Unit not found in tenant.');
    return mapOrganisationUnit(row);
  }

  private async requirePosition(tenantId: TenantId, id: string): Promise<Position> {
    const [rows] = await this.pool.execute<PositionRow[]>(
      `SELECT id, tenant_id, organisation_unit_id, job_profile_id, code, title, status
         FROM positions WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Position not found in tenant.');
    return mapPosition(row);
  }

  private async requireJobProfile(id: string): Promise<JobProfile> {
    const [rows] = await this.pool.execute<JobProfileRow[]>(
      `SELECT id, catalogue_scope, tenant_id, code, name, status
         FROM job_profiles WHERE id = ?`,
      [id]
    );
    const row = rows[0];
    if (!row) throw new Error('Job Profile not found.');
    return mapJobProfile(row);
  }

  private async requireCanonicalObject(
    tenantId: TenantId,
    id: string
  ): Promise<CanonicalObjectIdentity> {
    const [rows] = await this.pool.execute<CanonicalObjectRow[]>(
      `SELECT id, tenant_id, object_type, stable_key, created_at
         FROM canonical_objects WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Canonical Object not found in tenant.');
    return mapCanonicalObject(row);
  }

  private async requireDeployment(
    tenantId: TenantId,
    id: string
  ): Promise<FunctionalDeployment> {
    const [rows] = await this.pool.execute<DeploymentRow[]>(
      `SELECT id, tenant_id, function_id, sub_function_id, organisation_id,
              organisation_unit_id, context_type, context_object_id, scope_description,
              effective_from, effective_to, status
         FROM functional_deployments WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Functional Deployment not found in tenant.');
    return mapDeployment(row);
  }

  private async requireAssignment(
    tenantId: TenantId,
    id: string
  ): Promise<DeploymentAssignment> {
    const [rows] = await this.pool.execute<AssignmentRow[]>(
      `SELECT id, tenant_id, functional_deployment_id, assignee_type, assignee_id,
              job_profile_id, responsibility_role, effective_from, effective_to, status
         FROM deployment_assignments WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Deployment Assignment not found in tenant.');
    return mapAssignment(row);
  }

  private async requireDeploymentAssignee(
    tenantId: TenantId,
    type: DeploymentAssignment['assigneeType'],
    id: string
  ): Promise<Person | Position | OrganisationUnit> {
    if (type === 'PERSON') return this.requirePerson(tenantId, id);
    if (type === 'POSITION') return this.requirePosition(tenantId, id);
    return this.requireOrganisationUnit(tenantId, id);
  }

  private async requireCompetenceSubject(
    requirement: CompetenceRequirement
  ): Promise<void> {
    let query = '';
    let params: unknown[] = [];

    switch (requirement.subjectType) {
      case 'FUNCTION':
        query = 'SELECT id FROM function_definitions WHERE id = ?';
        params = [requirement.subjectId];
        break;
      case 'SUB_FUNCTION':
        query = 'SELECT id FROM sub_function_definitions WHERE id = ?';
        params = [requirement.subjectId];
        break;
      case 'ACTIVITY':
        query = 'SELECT id FROM functional_activity_definitions WHERE id = ?';
        params = [requirement.subjectId];
        break;
      case 'PROCESS':
        query = 'SELECT id FROM process_definitions WHERE tenant_id = ? AND id = ?';
        params = [requirement.tenantId, requirement.subjectId];
        break;
      case 'TASK':
        query = 'SELECT id FROM task_definitions WHERE tenant_id = ? AND id = ?';
        params = [requirement.tenantId, requirement.subjectId];
        break;
      case 'DEPLOYMENT':
        query = 'SELECT id FROM functional_deployments WHERE tenant_id = ? AND id = ?';
        params = [requirement.tenantId, requirement.subjectId];
        break;
    }

    const [rows] = await this.pool.execute<RowDataPacket[]>(query, params);
    if (!rows[0]) {
      throw new Error('Competence Requirement subject does not exist in scope.');
    }
  }
}
