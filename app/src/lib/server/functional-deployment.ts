import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import {
  constructionJobCatalogue,
  deliveryDomainCatalogue,
  functionalCatalogue,
  functionalCatalogueCounts
} from '$lib/data/functional-deployment-catalogue';
import {
  dbTransaction,
  executeMutation,
  queryOne,
  queryRows,
  type DbExecutor
} from '$lib/server/db';
import {
  assertPermission,
  type CommandContext
} from '$lib/server/platform-context';
import { emitBusinessEvent, recordPlatformAudit } from '$lib/server/platform-evidence';

export type FunctionalDefinition = {
  id: string;
  functionCode: string;
  functionType: string;
  name: string;
  status: string;
  currentVersionNo: number;
  baselineLabel: string | null;
  versionStatus: string | null;
};

export type JobProfile = {
  id: string;
  jobCode: string;
  name: string;
  sectorDomain: string | null;
  purpose: string | null;
  status: string;
  version: number;
};

export type Position = {
  id: string;
  positionCode: string;
  name: string;
  jobProfileId: string;
  jobName: string;
  organisationUnitId: string | null;
  organisationUnitName: string | null;
  capacityFte: number;
  status: string;
  version: number;
  occupantPartyId: string | null;
  occupantName: string | null;
};

export type FunctionalDeployment = {
  id: string;
  deploymentReference: string;
  functionalDefinitionId: string;
  functionCode: string;
  functionName: string;
  functionType: string;
  contextType: string;
  contextId: string;
  responsibilityScope: string;
  deliveryOrganisationName: string | null;
  organisationUnitName: string | null;
  status: string;
  version: number;
  validFrom: string;
  validTo: string | null;
  assignmentCount: number;
};

export type DeploymentAssignment = {
  id: string;
  functionalDeploymentId: string;
  jobProfileId: string;
  jobName: string;
  positionId: string | null;
  positionName: string | null;
  personPartyId: string | null;
  personName: string | null;
  organisationPartyId: string | null;
  organisationName: string | null;
  assignmentRole: string;
  responsibilityScope: string | null;
  allocationPercent: number;
  status: string;
  validFrom: string;
  validTo: string | null;
};

export type DeploymentPartyOption = {
  id: string;
  displayName: string;
};

export type OrganisationUnitOption = {
  id: string;
  unitCode: string;
  name: string;
  status: string;
};

export const deploymentCatalogueCounts = functionalCatalogueCounts;

const functionalSelect = `
SELECT fd.id,
       fd.function_code AS functionCode,
       fd.function_type AS functionType,
       fd.name,
       fd.status,
       fd.current_version_no AS currentVersionNo,
       fdv.baseline_label AS baselineLabel,
       fdv.status AS versionStatus
  FROM functional_definitions fd
  LEFT JOIN functional_definition_versions fdv
    ON fdv.functional_definition_id = fd.id
   AND fdv.tenant_id = fd.tenant_id
   AND fdv.version_no = fd.current_version_no
`;

function now() {
  return new Date().toISOString();
}

function required(value: string, label: string) {
  const clean = value.trim();
  if (!clean) throw new Error(label + ' is required.');
  return clean;
}

function optional(value?: string) {
  const clean = value?.trim();
  return clean || null;
}

function timestamp(value: string | undefined, label: string, fallback?: string) {
  const clean = value?.trim();
  if (!clean) return fallback ?? null;
  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) throw new Error(label + ' is invalid.');
  return parsed.toISOString();
}

function positive(value: number, label: string, max?: number) {
  if (!Number.isFinite(value) || value <= 0 || (max !== undefined && value > max)) {
    throw new Error(label + ' is invalid.');
  }
  return value;
}

async function evidence(
  context: CommandContext,
  input: {
    objectType: string;
    objectId: string;
    action: string;
    fromState?: string;
    toState?: string;
    version: number;
    payload?: Record<string, unknown>;
  },
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-FUNCTIONAL-CAPABILITY',
      objectType: input.objectType,
      objectId: input.objectId,
      action: input.action,
      fromState: input.fromState,
      toState: input.toState
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: 'AGG-FUNCTIONAL-CAPABILITY',
      aggregateType: input.objectType,
      aggregateObjectId: input.objectId,
      aggregateVersion: input.version,
      eventType: input.action,
      topic: 'nublox.functional.capability',
      payload: input.payload ?? {}
    },
    executor
  );
}

export async function listFunctionalDefinitions(context: CommandContext): Promise<FunctionalDefinition[]> {
  assertPermission(context, 'functional.capability.read');
  return queryRows<RowDataPacket & FunctionalDefinition>(
    functionalSelect + ' WHERE fd.tenant_id = ? ORDER BY fd.function_type, fd.function_code',
    [context.tenantId]
  );
}

export async function listJobProfiles(context: CommandContext): Promise<JobProfile[]> {
  assertPermission(context, 'functional.capability.read');
  return queryRows<RowDataPacket & JobProfile>(
    `SELECT id,
            job_code AS jobCode,
            name,
            sector_domain AS sectorDomain,
            purpose,
            status,
            version
       FROM job_profiles
      WHERE tenant_id = ?
      ORDER BY sector_domain, name, job_code`,
    [context.tenantId]
  );
}

export async function listPositions(context: CommandContext): Promise<Position[]> {
  assertPermission(context, 'functional.capability.read');
  return queryRows<RowDataPacket & Position>(
    `SELECT p.id,
            p.position_code AS positionCode,
            p.name,
            p.job_profile_id AS jobProfileId,
            jp.name AS jobName,
            p.organisation_unit_id AS organisationUnitId,
            ou.name AS organisationUnitName,
            p.capacity_fte AS capacityFte,
            p.status,
            p.version,
            pa.person_party_id AS occupantPartyId,
            person_party.display_name AS occupantName
       FROM positions p
       JOIN job_profiles jp
         ON jp.id = p.job_profile_id
        AND jp.tenant_id = p.tenant_id
       LEFT JOIN organisation_units ou
         ON ou.id = p.organisation_unit_id
        AND ou.tenant_id = p.tenant_id
       LEFT JOIN position_assignments pa
         ON pa.position_id = p.id
        AND pa.tenant_id = p.tenant_id
        AND pa.status = 'ACTIVE'
        AND pa.valid_from <= ?
        AND (pa.valid_to IS NULL OR pa.valid_to > ?)
       LEFT JOIN parties person_party
         ON person_party.id = pa.person_party_id
        AND person_party.tenant_id = p.tenant_id
      WHERE p.tenant_id = ?
      ORDER BY p.status = 'CLOSED', p.name, p.position_code`,
    [now(), now(), context.tenantId]
  );
}

export async function listFunctionalDeployments(
  context: CommandContext
): Promise<FunctionalDeployment[]> {
  assertPermission(context, 'functional.capability.read');
  return queryRows<RowDataPacket & FunctionalDeployment>(
    `SELECT d.id,
            d.deployment_reference AS deploymentReference,
            d.functional_definition_id AS functionalDefinitionId,
            fd.function_code AS functionCode,
            fd.name AS functionName,
            fd.function_type AS functionType,
            d.context_type AS contextType,
            d.context_id AS contextId,
            d.responsibility_scope AS responsibilityScope,
            op.display_name AS deliveryOrganisationName,
            ou.name AS organisationUnitName,
            d.status,
            d.version,
            d.valid_from AS validFrom,
            d.valid_to AS validTo,
            COUNT(da.id) AS assignmentCount
       FROM functional_deployments d
       JOIN functional_definitions fd
         ON fd.id = d.functional_definition_id
        AND fd.tenant_id = d.tenant_id
       LEFT JOIN parties op
         ON op.id = d.delivery_organisation_party_id
        AND op.tenant_id = d.tenant_id
       LEFT JOIN organisation_units ou
         ON ou.id = d.organisation_unit_id
        AND ou.tenant_id = d.tenant_id
       LEFT JOIN deployment_assignments da
         ON da.functional_deployment_id = d.id
        AND da.tenant_id = d.tenant_id
        AND da.status = 'ACTIVE'
      WHERE d.tenant_id = ?
      GROUP BY d.id, d.deployment_reference, d.functional_definition_id, fd.function_code,
               fd.name, fd.function_type, d.context_type, d.context_id,
               d.responsibility_scope, op.display_name, ou.name,
               d.status, d.version, d.valid_from, d.valid_to
      ORDER BY d.status = 'CLOSED', d.valid_from DESC, d.deployment_reference`,
    [context.tenantId]
  );
}

export async function listDeploymentAssignments(
  context: CommandContext,
  deploymentId?: string
): Promise<DeploymentAssignment[]> {
  assertPermission(context, 'functional.capability.read');
  const where = deploymentId
    ? ' WHERE da.tenant_id = ? AND da.functional_deployment_id = ?'
    : ' WHERE da.tenant_id = ?';
  const params = deploymentId ? [context.tenantId, deploymentId] : [context.tenantId];
  return queryRows<RowDataPacket & DeploymentAssignment>(
    `SELECT da.id,
            da.functional_deployment_id AS functionalDeploymentId,
            da.job_profile_id AS jobProfileId,
            jp.name AS jobName,
            da.position_id AS positionId,
            p.name AS positionName,
            da.person_party_id AS personPartyId,
            person_party.display_name AS personName,
            da.organisation_party_id AS organisationPartyId,
            org_party.display_name AS organisationName,
            da.assignment_role AS assignmentRole,
            da.responsibility_scope AS responsibilityScope,
            da.allocation_percent AS allocationPercent,
            da.status,
            da.valid_from AS validFrom,
            da.valid_to AS validTo
       FROM deployment_assignments da
       JOIN job_profiles jp
         ON jp.id = da.job_profile_id
        AND jp.tenant_id = da.tenant_id
       LEFT JOIN positions p
         ON p.id = da.position_id
        AND p.tenant_id = da.tenant_id
       LEFT JOIN parties person_party
         ON person_party.id = da.person_party_id
        AND person_party.tenant_id = da.tenant_id
       LEFT JOIN parties org_party
         ON org_party.id = da.organisation_party_id
        AND org_party.tenant_id = da.tenant_id
       ${where}
      ORDER BY da.status = 'ENDED', da.valid_from DESC, jp.name`,
    params
  );
}

export async function listDeploymentPeople(
  context: CommandContext
): Promise<DeploymentPartyOption[]> {
  assertPermission(context, 'functional.capability.read');
  return queryRows<RowDataPacket & DeploymentPartyOption>(
    `SELECT p.id, p.display_name AS displayName
       FROM parties p
       JOIN persons pe ON pe.party_id = p.id
      WHERE p.tenant_id = ?
        AND p.status = 'ACTIVE'
      ORDER BY p.display_name`,
    [context.tenantId]
  );
}

export async function listDeploymentOrganisations(
  context: CommandContext
): Promise<DeploymentPartyOption[]> {
  assertPermission(context, 'functional.capability.read');
  return queryRows<RowDataPacket & DeploymentPartyOption>(
    `SELECT p.id, p.display_name AS displayName
       FROM parties p
       JOIN organisations o ON o.party_id = p.id
      WHERE p.tenant_id = ?
        AND p.status = 'ACTIVE'
      ORDER BY p.display_name`,
    [context.tenantId]
  );
}

export async function listDeploymentOrganisationUnits(
  context: CommandContext
): Promise<OrganisationUnitOption[]> {
  assertPermission(context, 'functional.capability.read');
  return queryRows<RowDataPacket & OrganisationUnitOption>(
    `SELECT id, unit_code AS unitCode, name, status
       FROM organisation_units
      WHERE tenant_id = ?
        AND status <> 'CLOSED'
      ORDER BY name, unit_code`,
    [context.tenantId]
  );
}

export async function bootstrapFunctionalCatalogue(context: CommandContext) {
  assertPermission(context, 'functional.capability.manage');
  return dbTransaction(async (connection) => {
    const timestampNow = now();
    const definitionIds = new Map<string, string>();

    for (const entry of functionalCatalogue) {
      let row = await queryOne<RowDataPacket & { id: string }>(
        'SELECT id FROM functional_definitions WHERE tenant_id = ? AND function_code = ?',
        [context.tenantId, entry.code],
        connection
      );
      if (!row) {
        const id = randomUUID();
        await executeMutation(
          `INSERT INTO functional_definitions
            (id, tenant_id, function_code, function_type, name, owner_position_id, status,
             current_version_no, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, NULL, 'ACTIVE', 1, ?, ?)`,
          [id, context.tenantId, entry.code, entry.type, entry.name, timestampNow, timestampNow],
          connection
        );
        row = { id } as RowDataPacket & { id: string };
      }
      definitionIds.set(entry.code, row.id);

      const existingVersion = await queryOne<RowDataPacket & { id: string }>(
        'SELECT id FROM functional_definition_versions WHERE tenant_id = ? AND functional_definition_id = ? AND version_no = 1',
        [context.tenantId, row.id],
        connection
      );
      if (!existingVersion) {
        await executeMutation(
          `INSERT INTO functional_definition_versions
            (id, tenant_id, functional_definition_id, version_no, baseline_label, purpose, scope_text,
             governance_json, delivery_json, deployment_rules_json, status, approved_decision_id,
             valid_from, valid_to, created_by_party_id, created_at, approved_at)
           VALUES (?, ?, ?, 1, 'NUBLOX-INITIAL', ?, NULL, ?, ?, ?, 'EFFECTIVE', NULL,
                   ?, NULL, ?, ?, ?)`,
          [
            randomUUID(),
            context.tenantId,
            row.id,
            entry.purpose,
            JSON.stringify({
              model: 'FUNCTIONAL_GOVERNANCE',
              baselineControlled: true,
              changeControlled: true,
              impactAssessmentRequired: true,
              competenceControlled: true,
              authorityControlled: true,
              verificationRequired: true
            }),
            JSON.stringify({
              model: 'FUNCTIONAL_DELIVERY',
              managedOutputsRequired: true,
              workflowAndDecisionEvidence: true
            }),
            JSON.stringify({
              model: 'FUNCTIONAL_DEPLOYMENT',
              contextRequired: true,
              jobRelationships: ['PRIMARY', 'DELIVERY', 'GOVERNANCE', 'ASSURANCE', 'SUPPORT']
            }),
            timestampNow,
            context.actorPartyId,
            timestampNow,
            timestampNow
          ],
          connection
        );
      }
    }

    const jobIds = new Map<string, string>();
    for (const job of constructionJobCatalogue) {
      let row = await queryOne<RowDataPacket & { id: string }>(
        'SELECT id FROM job_profiles WHERE tenant_id = ? AND job_code = ?',
        [context.tenantId, job.code],
        connection
      );
      if (!row) {
        const id = randomUUID();
        await executeMutation(
          `INSERT INTO job_profiles
            (id, tenant_id, job_code, name, job_family, job_level, sector_domain, purpose,
             source_reference, status, version, valid_from, valid_to, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'Construction & Built Environment', NULL, ?, ?, ?, 'ACTIVE', 1, ?, NULL, ?, ?)`,
          [
            id,
            context.tenantId,
            job.code,
            job.name,
            job.sectorDomain,
            job.specialistCapabilityFocus,
            job.sourceReference,
            timestampNow,
            timestampNow,
            timestampNow
          ],
          connection
        );
        row = { id } as RowDataPacket & { id: string };
      }
      jobIds.set(job.code, row.id);
    }

    for (const job of constructionJobCatalogue) {
      const domain = deliveryDomainCatalogue.find((entry) => entry.name === job.sectorDomain);
      const functionId = domain ? definitionIds.get(domain.code) : undefined;
      const jobId = jobIds.get(job.code);
      if (!functionId || !jobId) continue;
      const existing = await queryOne<RowDataPacket & { id: string }>(
        `SELECT id
           FROM function_job_relationships
          WHERE tenant_id = ?
            AND functional_definition_id = ?
            AND job_profile_id = ?
            AND relationship_type = 'PRIMARY'`,
        [context.tenantId, functionId, jobId],
        connection
      );
      if (!existing) {
        await executeMutation(
          `INSERT INTO function_job_relationships
            (id, tenant_id, functional_definition_id, job_profile_id, relationship_type,
             responsibility_summary, status, valid_from, valid_to, created_at)
           VALUES (?, ?, ?, ?, 'PRIMARY', ?, 'ACTIVE', ?, NULL, ?)`,
          [
            randomUUID(),
            context.tenantId,
            functionId,
            jobId,
            'Primary sector delivery-domain relationship from the NuBlox 84-job baseline.',
            timestampNow,
            timestampNow
          ],
          connection
        );
      }
    }

    await evidence(
      context,
      {
        objectType: 'functional_catalogue',
        objectId: context.tenantId,
        action: 'FUNCTIONAL_CATALOGUE_BOOTSTRAPPED',
        toState: 'ACTIVE',
        version: 1,
        payload: functionalCatalogueCounts
      },
      connection
    );

    return {
      ...functionalCatalogueCounts,
      totalFunctionalDefinitions: functionalCatalogue.length
    };
  });
}

export async function createPosition(
  context: CommandContext,
  input: {
    positionCode: string;
    name: string;
    jobProfileId: string;
    organisationUnitId?: string;
    accountableLegalEntityPartyId?: string;
    capacityFte?: number;
    validFrom?: string;
    validTo?: string;
  }
) {
  assertPermission(context, 'people.position.manage');
  return dbTransaction(async (connection) => {
    const job = await queryOne<RowDataPacket & { id: string }>(
      "SELECT id FROM job_profiles WHERE id = ? AND tenant_id = ? AND status = 'ACTIVE'",
      [required(input.jobProfileId, 'Job Profile'), context.tenantId],
      connection
    );
    if (!job) throw new Error('Active Job Profile not found.');

    const id = randomUUID();
    const timestampNow = now();
    const validFrom = timestamp(input.validFrom, 'Position valid from', timestampNow) as string;
    const validTo = timestamp(input.validTo, 'Position valid to');
    const capacity = positive(input.capacityFte ?? 1, 'Position capacity FTE');

    await executeMutation(
      `INSERT INTO positions
        (id, tenant_id, position_code, name, organisation_unit_id,
         accountable_legal_entity_party_id, job_profile_id, capacity_fte,
         location_type, location_id, status, version, valid_from, valid_to, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, 'OPEN', 1, ?, ?, ?, ?)`,
      [
        id,
        context.tenantId,
        required(input.positionCode, 'Position code'),
        required(input.name, 'Position name'),
        optional(input.organisationUnitId),
        optional(input.accountableLegalEntityPartyId),
        job.id,
        capacity,
        validFrom,
        validTo,
        timestampNow,
        timestampNow
      ],
      connection
    );

    await evidence(
      context,
      {
        objectType: 'position',
        objectId: id,
        action: 'POSITION_CREATED',
        toState: 'OPEN',
        version: 1,
        payload: { jobProfileId: job.id, capacityFte: capacity }
      },
      connection
    );
    return id;
  });
}

export async function createWorkerRelationship(
  context: CommandContext,
  input: {
    personPartyId: string;
    organisationPartyId: string;
    relationshipType?: string;
    jurisdictionCode?: string;
    termsReference?: string;
    validFrom?: string;
    validTo?: string;
  }
) {
  assertPermission(context, 'people.position.manage');
  return dbTransaction(async (connection) => {
    const person = await queryOne<RowDataPacket & { id: string }>(
      `SELECT p.id
         FROM parties p
         JOIN persons pe ON pe.party_id = p.id
        WHERE p.id = ? AND p.tenant_id = ? AND p.status = 'ACTIVE'`,
      [required(input.personPartyId, 'Person'), context.tenantId],
      connection
    );
    const organisation = await queryOne<RowDataPacket & { id: string }>(
      `SELECT p.id
         FROM parties p
         JOIN organisations o ON o.party_id = p.id
        WHERE p.id = ? AND p.tenant_id = ? AND p.status = 'ACTIVE'`,
      [required(input.organisationPartyId, 'Organisation'), context.tenantId],
      connection
    );
    if (!person) throw new Error('Active Person not found.');
    if (!organisation) throw new Error('Active Organisation not found.');

    const id = randomUUID();
    const timestampNow = now();
    const validFrom = timestamp(input.validFrom, 'Worker relationship valid from', timestampNow) as string;
    const validTo = timestamp(input.validTo, 'Worker relationship valid to');
    await executeMutation(
      `INSERT INTO worker_relationships
        (id, tenant_id, person_party_id, organisation_party_id, relationship_type,
         jurisdiction_code, terms_reference, status, version, valid_from, valid_to, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1, ?, ?, ?, ?)`,
      [
        id,
        context.tenantId,
        person.id,
        organisation.id,
        input.relationshipType?.trim().toUpperCase() || 'EMPLOYEE',
        optional(input.jurisdictionCode)?.toUpperCase() ?? null,
        optional(input.termsReference),
        validFrom,
        validTo,
        timestampNow,
        timestampNow
      ],
      connection
    );
    await evidence(
      context,
      {
        objectType: 'worker_relationship',
        objectId: id,
        action: 'WORKER_RELATIONSHIP_CREATED',
        toState: 'ACTIVE',
        version: 1,
        payload: { personPartyId: person.id, organisationPartyId: organisation.id }
      },
      connection
    );
    return id;
  });
}

export async function assignPersonToPosition(
  context: CommandContext,
  input: {
    positionId: string;
    workerRelationshipId: string;
    personPartyId: string;
    assignmentType?: string;
    allocationPercent?: number;
    validFrom?: string;
    validTo?: string;
  }
) {
  assertPermission(context, 'people.position.manage');
  return dbTransaction(async (connection) => {
    const position = await queryOne<RowDataPacket & { id: string }>(
      "SELECT id FROM positions WHERE id = ? AND tenant_id = ? AND status IN ('OPEN','OCCUPIED')",
      [required(input.positionId, 'Position'), context.tenantId],
      connection
    );
    const worker = await queryOne<RowDataPacket & { id: string; personPartyId: string }>(
      `SELECT id, person_party_id AS personPartyId
         FROM worker_relationships
        WHERE id = ? AND tenant_id = ? AND status = 'ACTIVE'`,
      [required(input.workerRelationshipId, 'Worker Relationship'), context.tenantId],
      connection
    );
    if (!position) throw new Error('Open Position not found.');
    if (!worker) throw new Error('Active Worker Relationship not found.');
    if (worker.personPartyId !== required(input.personPartyId, 'Person')) {
      throw new Error('Worker Relationship does not belong to the selected Person.');
    }

    const id = randomUUID();
    const timestampNow = now();
    const validFrom = timestamp(input.validFrom, 'Position assignment valid from', timestampNow) as string;
    const validTo = timestamp(input.validTo, 'Position assignment valid to');
    const allocation = positive(input.allocationPercent ?? 100, 'Position allocation percent', 100);

    await executeMutation(
      `INSERT INTO position_assignments
        (id, tenant_id, position_id, worker_relationship_id, person_party_id, assignment_type,
         allocation_percent, status, version, valid_from, valid_to, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1, ?, ?, ?, ?)`,
      [
        id,
        context.tenantId,
        position.id,
        worker.id,
        worker.personPartyId,
        input.assignmentType?.trim().toUpperCase() || 'PRIMARY',
        allocation,
        validFrom,
        validTo,
        timestampNow,
        timestampNow
      ],
      connection
    );
    await executeMutation(
      "UPDATE positions SET status = 'OCCUPIED', version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ?",
      [timestampNow, position.id, context.tenantId],
      connection
    );
    await evidence(
      context,
      {
        objectType: 'position_assignment',
        objectId: id,
        action: 'PERSON_ASSIGNED_TO_POSITION',
        toState: 'ACTIVE',
        version: 1,
        payload: { positionId: position.id, personPartyId: worker.personPartyId, allocationPercent: allocation }
      },
      connection
    );
    return id;
  });
}

export async function createFunctionalDeployment(
  context: CommandContext,
  input: {
    functionalDefinitionId: string;
    deploymentReference: string;
    contextType: string;
    contextId: string;
    responsibilityScope: string;
    deliveryOrganisationPartyId?: string;
    organisationUnitId?: string;
    validFrom?: string;
    validTo?: string;
  }
) {
  assertPermission(context, 'functional.deployment.manage');
  return dbTransaction(async (connection) => {
    const definition = await queryOne<
      RowDataPacket & { id: string; currentVersionNo: number; versionId: string }
    >(
      `SELECT fd.id,
              fd.current_version_no AS currentVersionNo,
              fdv.id AS versionId
         FROM functional_definitions fd
         JOIN functional_definition_versions fdv
           ON fdv.functional_definition_id = fd.id
          AND fdv.tenant_id = fd.tenant_id
          AND fdv.version_no = fd.current_version_no
          AND fdv.status = 'EFFECTIVE'
        WHERE fd.id = ?
          AND fd.tenant_id = ?
          AND fd.status = 'ACTIVE'`,
      [required(input.functionalDefinitionId, 'Functional definition'), context.tenantId],
      connection
    );
    if (!definition) throw new Error('Active governed Function/Delivery Domain not found.');

    const id = randomUUID();
    const timestampNow = now();
    const validFrom = timestamp(input.validFrom, 'Deployment valid from', timestampNow) as string;
    const validTo = timestamp(input.validTo, 'Deployment valid to');

    await executeMutation(
      `INSERT INTO functional_deployments
        (id, tenant_id, functional_definition_id, functional_version_id, deployment_requirement_id,
         deployment_reference, delivery_organisation_party_id, organisation_unit_id, context_type,
         context_id, responsibility_scope, status, version, valid_from, valid_to,
         created_by_party_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, 'PLANNED', 1, ?, ?, ?, ?, ?)`,
      [
        id,
        context.tenantId,
        definition.id,
        definition.versionId,
        required(input.deploymentReference, 'Deployment reference'),
        optional(input.deliveryOrganisationPartyId),
        optional(input.organisationUnitId),
        required(input.contextType, 'Context type').toUpperCase(),
        required(input.contextId, 'Context ID'),
        required(input.responsibilityScope, 'Responsibility scope'),
        validFrom,
        validTo,
        context.actorPartyId,
        timestampNow,
        timestampNow
      ],
      connection
    );

    await evidence(
      context,
      {
        objectType: 'functional_deployment',
        objectId: id,
        action: 'FUNCTIONAL_DEPLOYMENT_CREATED',
        toState: 'PLANNED',
        version: 1,
        payload: {
          functionalDefinitionId: definition.id,
          functionalVersionNo: definition.currentVersionNo,
          contextType: input.contextType.toUpperCase(),
          contextId: input.contextId
        }
      },
      connection
    );
    return id;
  });
}

export async function activateFunctionalDeployment(
  context: CommandContext,
  deploymentId: string,
  expectedVersion: number
) {
  assertPermission(context, 'functional.deployment.manage');
  return dbTransaction(async (connection) => {
    const row = await queryOne<RowDataPacket & { id: string; status: string; version: number }>(
      'SELECT id, status, version FROM functional_deployments WHERE id = ? AND tenant_id = ? FOR UPDATE',
      [deploymentId, context.tenantId],
      connection
    );
    if (!row) throw new Error('Functional Deployment not found.');
    if (row.version !== expectedVersion) throw new Error('Functional Deployment changed after you opened it.');
    if (!['PLANNED', 'INACTIVE'].includes(row.status)) {
      throw new Error('Only a planned or inactive Functional Deployment can be activated.');
    }
    const timestampNow = now();
    const result = await executeMutation(
      `UPDATE functional_deployments
          SET status = 'ACTIVE', version = version + 1, updated_at = ?
        WHERE id = ? AND tenant_id = ? AND version = ?`,
      [timestampNow, row.id, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Functional Deployment change detected.');
    await evidence(
      context,
      {
        objectType: 'functional_deployment',
        objectId: row.id,
        action: 'FUNCTIONAL_DEPLOYMENT_ACTIVATED',
        fromState: row.status,
        toState: 'ACTIVE',
        version: row.version + 1
      },
      connection
    );
  });
}

export async function assignToFunctionalDeployment(
  context: CommandContext,
  deploymentId: string,
  input: {
    jobProfileId: string;
    positionId?: string;
    personPartyId?: string;
    organisationPartyId?: string;
    assignmentRole?: string;
    responsibilityScope?: string;
    allocationPercent?: number;
    authorityReferenceType?: string;
    authorityReferenceId?: string;
    validFrom?: string;
    validTo?: string;
  }
) {
  assertPermission(context, 'functional.deployment.manage');
  return dbTransaction(async (connection) => {
    const deployment = await queryOne<RowDataPacket & { id: string; status: string; version: number }>(
      "SELECT id, status, version FROM functional_deployments WHERE id = ? AND tenant_id = ? AND status IN ('PLANNED','ACTIVE')",
      [deploymentId, context.tenantId],
      connection
    );
    if (!deployment) throw new Error('Planned or active Functional Deployment not found.');

    const job = await queryOne<RowDataPacket & { id: string }>(
      "SELECT id FROM job_profiles WHERE id = ? AND tenant_id = ? AND status = 'ACTIVE'",
      [required(input.jobProfileId, 'Job Profile'), context.tenantId],
      connection
    );
    if (!job) throw new Error('Active Job Profile not found.');

    const positionId = optional(input.positionId);
    const personPartyId = optional(input.personPartyId);
    const organisationPartyId = optional(input.organisationPartyId);
    if (!positionId && !personPartyId && !organisationPartyId) {
      throw new Error('Deployment assignment requires a Position, Person or Organisation.');
    }

    if (positionId) {
      const position = await queryOne<RowDataPacket & { id: string; jobProfileId: string }>(
        'SELECT id, job_profile_id AS jobProfileId FROM positions WHERE id = ? AND tenant_id = ?',
        [positionId, context.tenantId],
        connection
      );
      if (!position) throw new Error('Position not found.');
      if (position.jobProfileId !== job.id) {
        throw new Error('Selected Position does not use the selected Job Profile.');
      }
    }

    const id = randomUUID();
    const timestampNow = now();
    const validFrom = timestamp(input.validFrom, 'Deployment assignment valid from', timestampNow) as string;
    const validTo = timestamp(input.validTo, 'Deployment assignment valid to');
    const allocation = positive(input.allocationPercent ?? 100, 'Deployment allocation percent', 100);
    const role = (input.assignmentRole?.trim().toUpperCase() || 'DELIVERY');
    if (!['PRIMARY', 'DELIVERY', 'GOVERNANCE', 'ASSURANCE', 'SUPPORT'].includes(role)) {
      throw new Error('Deployment assignment role is invalid.');
    }

    await executeMutation(
      `INSERT INTO deployment_assignments
        (id, tenant_id, functional_deployment_id, job_profile_id, position_id,
         person_party_id, organisation_party_id, assignment_role, responsibility_scope,
         allocation_percent, authority_reference_type, authority_reference_id,
         status, valid_from, valid_to, created_by_party_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?)`,
      [
        id,
        context.tenantId,
        deployment.id,
        job.id,
        positionId,
        personPartyId,
        organisationPartyId,
        role,
        optional(input.responsibilityScope),
        allocation,
        optional(input.authorityReferenceType)?.toUpperCase() ?? null,
        optional(input.authorityReferenceId),
        validFrom,
        validTo,
        context.actorPartyId,
        timestampNow,
        timestampNow
      ],
      connection
    );

    await evidence(
      context,
      {
        objectType: 'deployment_assignment',
        objectId: id,
        action: 'FUNCTIONAL_DEPLOYMENT_ASSIGNED',
        toState: 'ACTIVE',
        version: 1,
        payload: {
          functionalDeploymentId: deployment.id,
          jobProfileId: job.id,
          positionId,
          personPartyId,
          organisationPartyId,
          assignmentRole: role,
          allocationPercent: allocation
        }
      },
      connection
    );
    return id;
  });
}
