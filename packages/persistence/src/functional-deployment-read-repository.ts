import type { Pool, RowDataPacket } from 'mysql2/promise';
import type {
  DeploymentContextType,
  DeploymentAssigneeType,
  TenantId,
  WorkResponsibilityRole
} from '@nublox/kernel';

interface FunctionRow extends RowDataPacket {
  id: string;
  code: string;
  name: string;
}
interface SubFunctionRow extends RowDataPacket {
  id: string;
  function_id: string;
  code: string;
  name: string;
  sequence: number;
}
interface OrganisationRow extends RowDataPacket {
  id: string;
  legal_name: string;
  trading_name: string | null;
}
interface UnitRow extends RowDataPacket {
  id: string;
  organisation_id: string;
  code: string;
  name: string;
}
interface PersonRow extends RowDataPacket {
  id: string;
  name: string;
}
interface PositionRow extends RowDataPacket {
  id: string;
  code: string;
  title: string;
}
interface JobProfileRow extends RowDataPacket {
  id: string;
  code: string;
  name: string;
  catalogue_scope: 'PLATFORM' | 'TENANT';
}
interface CanonicalRow extends RowDataPacket {
  id: string;
  object_type: string;
  stable_key: string;
}
interface DeploymentRow extends RowDataPacket {
  id: string;
  function_id: string;
  function_code: string;
  function_name: string;
  sub_function_id: string | null;
  sub_function_code: string | null;
  sub_function_name: string | null;
  organisation_id: string;
  organisation_name: string;
  organisation_unit_id: string | null;
  unit_name: string | null;
  context_type: DeploymentContextType;
  context_object_id: string | null;
  scope_description: string;
  effective_from: Date;
  effective_to: Date | null;
  status: 'ACTIVE' | 'INACTIVE';
}
interface AssignmentRow extends RowDataPacket {
  id: string;
  functional_deployment_id: string;
  assignee_type: DeploymentAssigneeType;
  assignee_id: string;
  job_profile_id: string | null;
  job_profile_name: string | null;
  responsibility_role: WorkResponsibilityRole;
  effective_from: Date;
  effective_to: Date | null;
  status: 'ACTIVE' | 'INACTIVE';
}
interface CapacityRow extends RowDataPacket {
  deployment_assignment_id: string;
  capacity_percent: string | number;
  effective_from: Date;
  effective_to: Date | null;
}
interface ResponsibilityRow extends RowDataPacket {
  deployment_assignment_id: string;
  responsibility_role: WorkResponsibilityRole;
  scope_type: string;
  scope_id: string | null;
  description: string | null;
}

export interface DeploymentSubFunctionView {
  id: string;
  code: string;
  name: string;
}

export interface DeploymentFunctionView {
  id: string;
  code: string;
  name: string;
  subFunctions: DeploymentSubFunctionView[];
}

export interface DeploymentOrganisationView {
  id: string;
  name: string;
  units: Array<{ id: string; code: string; name: string }>;
}

export interface DeploymentPrincipalView {
  type: DeploymentAssigneeType;
  id: string;
  label: string;
}

export interface FunctionalDeploymentAssignmentView {
  id: string;
  assigneeType: DeploymentAssigneeType;
  assigneeId: string;
  assigneeLabel: string;
  jobProfileId?: string;
  jobProfileName?: string;
  responsibilityRole: WorkResponsibilityRole;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'ACTIVE' | 'INACTIVE';
  activeCapacityPercent: number;
  responsibilityScopes: Array<{
    role: WorkResponsibilityRole;
    scopeType: string;
    scopeId?: string;
    description?: string;
  }>;
}

export interface FunctionalDeploymentView {
  id: string;
  functionId: string;
  functionCode: string;
  functionName: string;
  subFunctionId?: string;
  subFunctionCode?: string;
  subFunctionName?: string;
  organisationId: string;
  organisationName: string;
  organisationUnitId?: string;
  organisationUnitName?: string;
  contextType: DeploymentContextType;
  contextObjectId?: string;
  scopeDescription: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'ACTIVE' | 'INACTIVE';
  assignments: FunctionalDeploymentAssignmentView[];
}

export interface FunctionalDeploymentAdministrationProjection {
  functions: DeploymentFunctionView[];
  organisations: DeploymentOrganisationView[];
  principals: DeploymentPrincipalView[];
  jobProfiles: Array<{
    id: string;
    code: string;
    name: string;
    catalogueScope: 'PLATFORM' | 'TENANT';
  }>;
  canonicalObjects: Array<{
    id: string;
    objectType: string;
    stableKey: string;
  }>;
  deployments: FunctionalDeploymentView[];
}

export class MySqlFunctionalDeploymentReadRepository {
  constructor(private readonly pool: Pool) {}

  async getProjection(
    tenantId: TenantId,
    evaluatedAt = new Date().toISOString()
  ): Promise<FunctionalDeploymentAdministrationProjection> {
    const at = new Date(evaluatedAt);
    if (Number.isNaN(at.getTime())) {
      throw new Error('Deployment projection evaluation time is invalid.');
    }

    const [
      functionRows,
      subFunctionRows,
      organisationRows,
      unitRows,
      personRows,
      positionRows,
      jobProfileRows,
      canonicalRows,
      deploymentRows,
      assignmentRows,
      capacityRows,
      responsibilityRows
    ] = await Promise.all([
      this.pool.execute<FunctionRow[]>(
        `SELECT id, code, name FROM function_definitions WHERE status = 'ACTIVE' ORDER BY code`
      ),
      this.pool.execute<SubFunctionRow[]>(
        `SELECT id, function_id, code, name, sequence
           FROM sub_function_definitions
          WHERE status = 'ACTIVE'
          ORDER BY function_id, sequence`
      ),
      this.pool.execute<OrganisationRow[]>(
        `SELECT id, legal_name, trading_name
           FROM organisations
          WHERE tenant_id = ? AND status = 'ACTIVE'
          ORDER BY COALESCE(trading_name, legal_name), id`,
        [tenantId]
      ),
      this.pool.execute<UnitRow[]>(
        `SELECT id, organisation_id, code, name
           FROM organisation_units
          WHERE tenant_id = ? AND status = 'ACTIVE'
          ORDER BY organisation_id, code, name`,
        [tenantId]
      ),
      this.pool.execute<PersonRow[]>(
        `SELECT id, COALESCE(preferred_name, legal_name) AS name
           FROM persons
          WHERE tenant_id = ? AND status = 'ACTIVE'
          ORDER BY name, id`,
        [tenantId]
      ),
      this.pool.execute<PositionRow[]>(
        `SELECT id, code, title
           FROM positions
          WHERE tenant_id = ? AND status = 'ACTIVE'
          ORDER BY code, title, id`,
        [tenantId]
      ),
      this.pool.execute<JobProfileRow[]>(
        `SELECT id, code, name, catalogue_scope
           FROM job_profiles
          WHERE status = 'ACTIVE'
            AND (catalogue_scope = 'PLATFORM' OR tenant_id = ?)
          ORDER BY catalogue_scope, code, name`,
        [tenantId]
      ),
      this.pool.execute<CanonicalRow[]>(
        `SELECT id, object_type, stable_key
           FROM canonical_objects
          WHERE tenant_id = ?
          ORDER BY object_type, stable_key`,
        [tenantId]
      ),
      this.pool.execute<DeploymentRow[]>(
        `SELECT d.id, d.function_id, f.code AS function_code, f.name AS function_name,
                d.sub_function_id, sf.code AS sub_function_code, sf.name AS sub_function_name,
                d.organisation_id, COALESCE(o.trading_name, o.legal_name) AS organisation_name,
                d.organisation_unit_id, ou.name AS unit_name,
                d.context_type, d.context_object_id, d.scope_description,
                d.effective_from, d.effective_to, d.status
           FROM functional_deployments d
           JOIN function_definitions f ON f.id = d.function_id
           LEFT JOIN sub_function_definitions sf ON sf.id = d.sub_function_id
           JOIN organisations o
             ON o.tenant_id = d.tenant_id AND o.id = d.organisation_id
           LEFT JOIN organisation_units ou
             ON ou.tenant_id = d.tenant_id AND ou.id = d.organisation_unit_id
          WHERE d.tenant_id = ?
          ORDER BY d.status = 'ACTIVE' DESC, f.code, sf.sequence, d.effective_from DESC, d.id`,
        [tenantId]
      ),
      this.pool.execute<AssignmentRow[]>(
        `SELECT da.id, da.functional_deployment_id, da.assignee_type, da.assignee_id,
                da.job_profile_id, jp.name AS job_profile_name, da.responsibility_role,
                da.effective_from, da.effective_to, da.status
           FROM deployment_assignments da
           LEFT JOIN job_profiles jp ON jp.id = da.job_profile_id
          WHERE da.tenant_id = ?
          ORDER BY da.status = 'ACTIVE' DESC, da.effective_from DESC, da.id`,
        [tenantId]
      ),
      this.pool.execute<CapacityRow[]>(
        `SELECT deployment_assignment_id, capacity_percent, effective_from, effective_to
           FROM deployment_capacities
          WHERE tenant_id = ?
            AND status = 'ACTIVE'
            AND effective_from <= ?
            AND (effective_to IS NULL OR effective_to >= ?)
          ORDER BY effective_from DESC, id`,
        [tenantId, at, at]
      ),
      this.pool.execute<ResponsibilityRow[]>(
        `SELECT deployment_assignment_id, responsibility_role, scope_type, scope_id, description
           FROM responsibility_scopes
          WHERE tenant_id = ? AND status = 'ACTIVE'
          ORDER BY deployment_assignment_id, responsibility_role, id`,
        [tenantId]
      )
    ]);

    const subFunctionsByFunction = new Map<string, DeploymentSubFunctionView[]>();
    for (const row of subFunctionRows[0]) {
      const list = subFunctionsByFunction.get(row.function_id) ?? [];
      list.push({ id: row.id, code: row.code, name: row.name });
      subFunctionsByFunction.set(row.function_id, list);
    }

    const unitsByOrganisation = new Map<string, Array<{ id: string; code: string; name: string }>>();
    for (const row of unitRows[0]) {
      const list = unitsByOrganisation.get(row.organisation_id) ?? [];
      list.push({ id: row.id, code: row.code, name: row.name });
      unitsByOrganisation.set(row.organisation_id, list);
    }

    const principals: DeploymentPrincipalView[] = [
      ...personRows[0].map((row) => ({
        type: 'PERSON' as const,
        id: row.id,
        label: row.name
      })),
      ...positionRows[0].map((row) => ({
        type: 'POSITION' as const,
        id: row.id,
        label: `${row.code} — ${row.title}`
      })),
      ...unitRows[0].map((row) => ({
        type: 'ORGANISATION_UNIT' as const,
        id: row.id,
        label: `${row.code} — ${row.name}`
      }))
    ];
    const principalLabelByKey = new Map(
      principals.map((principal) => [`${principal.type}:${principal.id}`, principal.label])
    );

    const capacitiesByAssignment = new Map<string, number>();
    for (const row of capacityRows[0]) {
      capacitiesByAssignment.set(
        row.deployment_assignment_id,
        (capacitiesByAssignment.get(row.deployment_assignment_id) ?? 0) +
          Number(row.capacity_percent)
      );
    }

    const responsibilitiesByAssignment = new Map<
      string,
      FunctionalDeploymentAssignmentView['responsibilityScopes']
    >();
    for (const row of responsibilityRows[0]) {
      const list = responsibilitiesByAssignment.get(row.deployment_assignment_id) ?? [];
      list.push({
        role: row.responsibility_role,
        scopeType: row.scope_type,
        ...(row.scope_id ? { scopeId: row.scope_id } : {}),
        ...(row.description ? { description: row.description } : {})
      });
      responsibilitiesByAssignment.set(row.deployment_assignment_id, list);
    }

    const assignmentsByDeployment = new Map<string, FunctionalDeploymentAssignmentView[]>();
    for (const row of assignmentRows[0]) {
      const list = assignmentsByDeployment.get(row.functional_deployment_id) ?? [];
      list.push({
        id: row.id,
        assigneeType: row.assignee_type,
        assigneeId: row.assignee_id,
        assigneeLabel:
          principalLabelByKey.get(`${row.assignee_type}:${row.assignee_id}`) ??
          row.assignee_id,
        ...(row.job_profile_id ? { jobProfileId: row.job_profile_id } : {}),
        ...(row.job_profile_name ? { jobProfileName: row.job_profile_name } : {}),
        responsibilityRole: row.responsibility_role,
        effectiveFrom: row.effective_from.toISOString(),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
        status: row.status,
        activeCapacityPercent: capacitiesByAssignment.get(row.id) ?? 0,
        responsibilityScopes: responsibilitiesByAssignment.get(row.id) ?? []
      });
      assignmentsByDeployment.set(row.functional_deployment_id, list);
    }

    return {
      functions: functionRows[0].map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        subFunctions: subFunctionsByFunction.get(row.id) ?? []
      })),
      organisations: organisationRows[0].map((row) => ({
        id: row.id,
        name: row.trading_name ?? row.legal_name,
        units: unitsByOrganisation.get(row.id) ?? []
      })),
      principals,
      jobProfiles: jobProfileRows[0].map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        catalogueScope: row.catalogue_scope
      })),
      canonicalObjects: canonicalRows[0].map((row) => ({
        id: row.id,
        objectType: row.object_type,
        stableKey: row.stable_key
      })),
      deployments: deploymentRows[0].map((row) => ({
        id: row.id,
        functionId: row.function_id,
        functionCode: row.function_code,
        functionName: row.function_name,
        ...(row.sub_function_id ? { subFunctionId: row.sub_function_id } : {}),
        ...(row.sub_function_code ? { subFunctionCode: row.sub_function_code } : {}),
        ...(row.sub_function_name ? { subFunctionName: row.sub_function_name } : {}),
        organisationId: row.organisation_id,
        organisationName: row.organisation_name,
        ...(row.organisation_unit_id ? { organisationUnitId: row.organisation_unit_id } : {}),
        ...(row.unit_name ? { organisationUnitName: row.unit_name } : {}),
        contextType: row.context_type,
        ...(row.context_object_id ? { contextObjectId: row.context_object_id } : {}),
        scopeDescription: row.scope_description,
        effectiveFrom: row.effective_from.toISOString(),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
        status: row.status,
        assignments: assignmentsByDeployment.get(row.id) ?? []
      }))
    };
  }
}
