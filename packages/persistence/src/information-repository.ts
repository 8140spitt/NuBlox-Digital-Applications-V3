import {
  createBaseline,
  createBaselineItem,
  createConfigurationItem,
  createEffectivity,
  createInformationContainer,
  createInformationIssue,
  createInformationIteration,
  createInformationRevision,
  createRepresentation,
  establishBaseline,
  freezeInformationIteration,
  releaseInformationRevision,
  supersedeBaseline,
  supersedeInformationRevision,
  type Baseline,
  type BaselineItem,
  type CanonicalObjectIdentity,
  type ConfigurationItem,
  type ConfigurationStatusEntry,
  type Decision,
  type Effectivity,
  type InformationContainer,
  type InformationIssue,
  type InformationIteration,
  type InformationRevision,
  type Person,
  type Representation,
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

interface InformationContainerRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  canonical_object_id: string;
  container_type: string;
  code: string;
  title: string;
  status: InformationContainer['status'];
  row_version: number;
}

interface InformationRevisionRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  information_container_id: string;
  revision: string;
  status: InformationRevision['status'];
  created_at: Date;
  released_at: Date | null;
  release_decision_id: string | null;
  released_iteration_id: string | null;
  superseded_by_revision_id: string | null;
  row_version: number;
}

interface InformationIterationRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  information_revision_id: string;
  iteration: number;
  status: InformationIteration['status'];
  created_at: Date;
  author_person_id: string | null;
  row_version: number;
}

interface RepresentationRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  information_iteration_id: string;
  representation_type: Representation['representationType'];
  media_type: string;
  file_name: string | null;
  content_reference: string;
  integrity_hash: string | null;
  generated_at: Date;
}

interface CanonicalObjectRow extends RowDataPacket {
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

interface DecisionRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  decision_type: string;
  subject_object_id: string;
  subject_version: string | null;
  outcome: string;
  reason: string;
  decider_person_id: string;
  authority_grant_id: string | null;
  decided_at: Date;
}

interface ConfigurationItemRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  canonical_object_id: string;
  code: string;
  name: string;
  status: ConfigurationItem['status'];
  row_version: number;
}

interface BaselineRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  context_object_id: string;
  code: string;
  name: string;
  status: Baseline['status'];
  established_at: Date | null;
  establishment_decision_id: string | null;
  superseded_by_baseline_id: string | null;
  row_version: number;
}

interface EffectivityRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  configuration_item_id: string;
  subject_version: string;
  effectivity_type: Effectivity['effectivityType'];
  scope_type: string;
  scope_id: string | null;
  effective_from: Date | null;
  effective_to: Date | null;
  expression: string | null;
  status: Effectivity['status'];
}

interface ConfigurationStatusRow extends RowDataPacket {
  baseline_id: string;
  baseline_code: string;
  baseline_status: Baseline['status'];
  configuration_item_id: string;
  configuration_item_code: string;
  configuration_item_name: string;
  subject_version: string;
}

interface EffectivityStatusRow extends EffectivityRow {
  baseline_id: string;
}

function databaseDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date/time value: ${value}`);
  }
  return date;
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

function mapInformationContainer(row: InformationContainerRow): InformationContainer {
  return {
    id: row.id as InformationContainer['id'],
    tenantId: row.tenant_id as TenantId,
    canonicalObjectId: row.canonical_object_id as InformationContainer['canonicalObjectId'],
    containerType: row.container_type,
    code: row.code,
    title: row.title,
    status: row.status
  };
}

function mapInformationRevision(row: InformationRevisionRow): InformationRevision {
  return {
    id: row.id as InformationRevision['id'],
    tenantId: row.tenant_id as TenantId,
    informationContainerId:
      row.information_container_id as InformationRevision['informationContainerId'],
    revision: row.revision,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    ...(row.released_at ? { releasedAt: row.released_at.toISOString() } : {}),
    ...(row.release_decision_id
      ? { releaseDecisionId: row.release_decision_id as NonNullable<InformationRevision['releaseDecisionId']> }
      : {}),
    ...(row.released_iteration_id
      ? { releasedIterationId: row.released_iteration_id as NonNullable<InformationRevision['releasedIterationId']> }
      : {}),
    ...(row.superseded_by_revision_id
      ? { supersededByRevisionId: row.superseded_by_revision_id as NonNullable<InformationRevision['supersededByRevisionId']> }
      : {})
  };
}

function mapInformationIteration(row: InformationIterationRow): InformationIteration {
  return {
    id: row.id as InformationIteration['id'],
    tenantId: row.tenant_id as TenantId,
    informationRevisionId:
      row.information_revision_id as InformationIteration['informationRevisionId'],
    iteration: Number(row.iteration),
    status: row.status,
    createdAt: row.created_at.toISOString(),
    ...(row.author_person_id
      ? { authorPersonId: row.author_person_id as NonNullable<InformationIteration['authorPersonId']> }
      : {})
  };
}

function mapRepresentation(row: RepresentationRow): Representation {
  return {
    id: row.id as Representation['id'],
    tenantId: row.tenant_id as TenantId,
    informationIterationId:
      row.information_iteration_id as Representation['informationIterationId'],
    representationType: row.representation_type,
    mediaType: row.media_type,
    ...(row.file_name ? { fileName: row.file_name } : {}),
    contentReference: row.content_reference,
    ...(row.integrity_hash ? { integrityHash: row.integrity_hash } : {}),
    generatedAt: row.generated_at.toISOString()
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

function mapDecision(row: DecisionRow): Decision {
  return {
    id: row.id as Decision['id'],
    tenantId: row.tenant_id as TenantId,
    decisionType: row.decision_type,
    subjectObjectId: row.subject_object_id as Decision['subjectObjectId'],
    ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
    outcome: row.outcome,
    reason: row.reason,
    deciderPersonId: row.decider_person_id as Decision['deciderPersonId'],
    ...(row.authority_grant_id
      ? { authorityGrantId: row.authority_grant_id as NonNullable<Decision['authorityGrantId']> }
      : {}),
    decidedAt: row.decided_at.toISOString()
  };
}

function mapConfigurationItem(row: ConfigurationItemRow): ConfigurationItem {
  return {
    id: row.id as ConfigurationItem['id'],
    tenantId: row.tenant_id as TenantId,
    canonicalObjectId: row.canonical_object_id as ConfigurationItem['canonicalObjectId'],
    code: row.code,
    name: row.name,
    status: row.status
  };
}

function mapBaseline(row: BaselineRow): Baseline {
  return {
    id: row.id as Baseline['id'],
    tenantId: row.tenant_id as TenantId,
    contextObjectId: row.context_object_id as Baseline['contextObjectId'],
    code: row.code,
    name: row.name,
    status: row.status,
    ...(row.established_at ? { establishedAt: row.established_at.toISOString() } : {}),
    ...(row.establishment_decision_id
      ? { establishmentDecisionId: row.establishment_decision_id as NonNullable<Baseline['establishmentDecisionId']> }
      : {}),
    ...(row.superseded_by_baseline_id
      ? { supersededByBaselineId: row.superseded_by_baseline_id as NonNullable<Baseline['supersededByBaselineId']> }
      : {})
  };
}

function mapEffectivity(row: EffectivityRow): Effectivity {
  return {
    id: row.id as Effectivity['id'],
    tenantId: row.tenant_id as TenantId,
    configurationItemId:
      row.configuration_item_id as Effectivity['configurationItemId'],
    subjectVersion: row.subject_version,
    effectivityType: row.effectivity_type,
    scopeType: row.scope_type,
    ...(row.scope_id ? { scopeId: row.scope_id } : {}),
    ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
    ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
    ...(row.expression ? { expression: row.expression } : {}),
    status: row.status
  };
}

export class MySqlInformationRepository {
  constructor(private readonly pool: Pool) {}

  async createInformationContainer(
    tenantId: TenantId,
    container: InformationContainer,
    audit: AuditContext = {}
  ): Promise<void> {
    if (container.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const object = await this.requireCanonicalObject(tenantId, container.canonicalObjectId);
    createInformationContainer(container, object);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO information_containers
          (id, tenant_id, canonical_object_id, container_type, code, title, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          container.id,
          container.tenantId,
          container.canonicalObjectId,
          container.containerType,
          container.code,
          container.title,
          container.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        tenantId,
        'INFORMATION_CONTAINER',
        container.id,
        'CREATED',
        audit,
        container
      );
    });
  }

  async createInformationRevision(
    tenantId: TenantId,
    revision: InformationRevision,
    audit: AuditContext = {}
  ): Promise<void> {
    if (revision.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const container = await this.requireInformationContainer(
      tenantId,
      revision.informationContainerId
    );
    createInformationRevision(revision, container);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO information_revisions
          (id, tenant_id, information_container_id, revision, status, created_at,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          revision.id,
          revision.tenantId,
          revision.informationContainerId,
          revision.revision,
          revision.status,
          databaseDate(revision.createdAt),
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        tenantId,
        'INFORMATION_REVISION',
        revision.id,
        'CREATED',
        audit,
        revision
      );
    });
  }

  async createInformationIteration(
    tenantId: TenantId,
    iteration: InformationIteration,
    audit: AuditContext = {}
  ): Promise<void> {
    if (iteration.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const [revision, author] = await Promise.all([
      this.requireInformationRevision(tenantId, iteration.informationRevisionId),
      iteration.authorPersonId
        ? this.requirePerson(tenantId, iteration.authorPersonId)
        : Promise.resolve(undefined)
    ]);
    createInformationIteration(iteration, revision, author);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO information_iterations
          (id, tenant_id, information_revision_id, iteration, status, created_at,
           author_person_id, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          iteration.id,
          iteration.tenantId,
          iteration.informationRevisionId,
          iteration.iteration,
          iteration.status,
          databaseDate(iteration.createdAt),
          iteration.authorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        tenantId,
        'INFORMATION_ITERATION',
        iteration.id,
        'CREATED',
        audit,
        iteration
      );
    });
  }

  async freezeInformationIteration(
    tenantId: TenantId,
    iterationId: InformationIteration['id'],
    audit: AuditContext = {}
  ): Promise<InformationIteration> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireInformationIterationForUpdate(
        connection,
        tenantId,
        iterationId
      );
      const current = mapInformationIteration(row);
      const next = freezeInformationIteration(current);

      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE information_iterations
            SET status = ?, row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ? AND status = 'WORKING'`,
        [next.status, tenantId, iterationId, row.row_version]
      );
      if (result.affectedRows !== 1) {
        throw new Error('Concurrent Information Iteration freeze detected.');
      }

      await writeAudit(
        connection,
        tenantId,
        'INFORMATION_ITERATION',
        iterationId,
        'FROZEN',
        audit,
        next
      );
      return next;
    });
  }

  async createRepresentation(
    tenantId: TenantId,
    representation: Representation,
    audit: AuditContext = {}
  ): Promise<void> {
    if (representation.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const iteration = await this.requireInformationIteration(
      tenantId,
      representation.informationIterationId
    );
    createRepresentation(representation, iteration);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO representations
          (id, tenant_id, information_iteration_id, representation_type, media_type,
           file_name, content_reference, integrity_hash, generated_at, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          representation.id,
          representation.tenantId,
          representation.informationIterationId,
          representation.representationType,
          representation.mediaType,
          representation.fileName ?? null,
          representation.contentReference,
          representation.integrityHash ?? null,
          databaseDate(representation.generatedAt),
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        tenantId,
        'REPRESENTATION',
        representation.id,
        'CREATED',
        audit,
        representation
      );
    });
  }

  async releaseInformationRevision(
    tenantId: TenantId,
    revisionId: InformationRevision['id'],
    releasedIterationId: InformationIteration['id'],
    releasedAt: string,
    decisionId?: Decision['id'],
    audit: AuditContext = {}
  ): Promise<InformationRevision> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireInformationRevisionForUpdate(
        connection,
        tenantId,
        revisionId
      );
      const current = mapInformationRevision(row);
      const [container, iteration, decision] = await Promise.all([
        this.requireInformationContainer(
          tenantId,
          current.informationContainerId,
          connection
        ),
        this.requireInformationIteration(tenantId, releasedIterationId, connection),
        decisionId
          ? this.requireDecision(tenantId, decisionId, connection)
          : Promise.resolve(undefined)
      ]);

      const next = releaseInformationRevision(
        current,
        container,
        iteration,
        releasedAt,
        decision
      );

      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE information_revisions
            SET status = ?, released_at = ?, release_decision_id = ?,
                released_iteration_id = ?, row_version = row_version + 1,
                updated_by_person_id = ?
          WHERE tenant_id = ? AND id = ? AND row_version = ? AND status = 'DRAFT'`,
        [
          next.status,
          databaseDate(releasedAt),
          next.releaseDecisionId ?? null,
          next.releasedIterationId ?? null,
          audit.actorPersonId ?? null,
          tenantId,
          revisionId,
          row.row_version
        ]
      );
      if (result.affectedRows !== 1) {
        throw new Error('Concurrent Information Revision release detected.');
      }

      await writeAudit(
        connection,
        tenantId,
        'INFORMATION_REVISION',
        revisionId,
        'RELEASED',
        audit,
        next
      );
      return next;
    });
  }

  async supersedeInformationRevision(
    tenantId: TenantId,
    currentRevisionId: InformationRevision['id'],
    replacementRevisionId: InformationRevision['id'],
    audit: AuditContext = {}
  ): Promise<InformationRevision> {
    return withTransaction(this.pool, async (connection) => {
      const currentRow = await this.requireInformationRevisionForUpdate(
        connection,
        tenantId,
        currentRevisionId
      );
      const replacementRow = await this.requireInformationRevisionForUpdate(
        connection,
        tenantId,
        replacementRevisionId
      );
      const current = mapInformationRevision(currentRow);
      const replacement = mapInformationRevision(replacementRow);
      const next = supersedeInformationRevision(current, replacement);

      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE information_revisions
            SET status = ?, superseded_by_revision_id = ?,
                row_version = row_version + 1, updated_by_person_id = ?
          WHERE tenant_id = ? AND id = ? AND row_version = ? AND status = 'RELEASED'`,
        [
          next.status,
          replacementRevisionId,
          audit.actorPersonId ?? null,
          tenantId,
          currentRevisionId,
          currentRow.row_version
        ]
      );
      if (result.affectedRows !== 1) {
        throw new Error('Concurrent Information Revision supersession detected.');
      }

      await writeAudit(
        connection,
        tenantId,
        'INFORMATION_REVISION',
        currentRevisionId,
        'SUPERSEDED',
        audit,
        { replacementRevisionId }
      );
      return next;
    });
  }

  async issueInformation(
    tenantId: TenantId,
    issue: InformationIssue,
    audit: AuditContext = {}
  ): Promise<void> {
    if (issue.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }

    const [container, revision, issuer, representation] = await Promise.all([
      this.requireInformationContainer(tenantId, issue.informationContainerId),
      this.requireInformationRevision(tenantId, issue.informationRevisionId),
      this.requirePerson(tenantId, issue.issuedByPersonId),
      issue.representationId
        ? this.requireRepresentation(tenantId, issue.representationId)
        : Promise.resolve(undefined)
    ]);
    createInformationIssue(issue, container, revision, issuer, representation);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO information_issues
          (id, tenant_id, information_container_id, information_revision_id,
           representation_id, issue_reference, issue_purpose, issued_by_person_id,
           issued_at, recipient_context, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          issue.id,
          issue.tenantId,
          issue.informationContainerId,
          issue.informationRevisionId,
          issue.representationId ?? null,
          issue.issueReference,
          issue.issuePurpose,
          issue.issuedByPersonId,
          databaseDate(issue.issuedAt),
          issue.recipientContext ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        tenantId,
        'INFORMATION_ISSUE',
        issue.id,
        'ISSUED',
        audit,
        issue
      );
    });
  }

  async createConfigurationItem(
    tenantId: TenantId,
    item: ConfigurationItem,
    audit: AuditContext = {}
  ): Promise<void> {
    if (item.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const object = await this.requireCanonicalObject(tenantId, item.canonicalObjectId);
    createConfigurationItem(item, object);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO configuration_items
          (id, tenant_id, canonical_object_id, code, name, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.tenantId,
          item.canonicalObjectId,
          item.code,
          item.name,
          item.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        tenantId,
        'CONFIGURATION_ITEM',
        item.id,
        'CREATED',
        audit,
        item
      );
    });
  }

  async createBaseline(
    tenantId: TenantId,
    baseline: Baseline,
    audit: AuditContext = {}
  ): Promise<void> {
    if (baseline.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const context = await this.requireCanonicalObject(tenantId, baseline.contextObjectId);
    createBaseline(baseline, context);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO baselines
          (id, tenant_id, context_object_id, code, name, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          baseline.id,
          baseline.tenantId,
          baseline.contextObjectId,
          baseline.code,
          baseline.name,
          baseline.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        tenantId,
        'BASELINE',
        baseline.id,
        'CREATED',
        audit,
        baseline
      );
    });
  }

  async addBaselineItem(
    tenantId: TenantId,
    item: BaselineItem,
    audit: AuditContext = {}
  ): Promise<void> {
    if (item.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const [baseline, configurationItem] = await Promise.all([
      this.requireBaseline(tenantId, item.baselineId),
      this.requireConfigurationItem(tenantId, item.configurationItemId)
    ]);
    createBaselineItem(item, baseline, configurationItem);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO baseline_items
          (id, tenant_id, baseline_id, configuration_item_id, subject_version,
           created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.tenantId,
          item.baselineId,
          item.configurationItemId,
          item.subjectVersion,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        tenantId,
        'BASELINE_ITEM',
        item.id,
        'ADDED',
        audit,
        item
      );
    });
  }

  async establishBaseline(
    tenantId: TenantId,
    baselineId: Baseline['id'],
    decisionId: Decision['id'],
    establishedAt: string,
    audit: AuditContext = {}
  ): Promise<Baseline> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireBaselineForUpdate(connection, tenantId, baselineId);
      const current = mapBaseline(row);
      const [context, decision] = await Promise.all([
        this.requireCanonicalObject(tenantId, current.contextObjectId, connection),
        this.requireDecision(tenantId, decisionId, connection)
      ]);

      const next = establishBaseline(current, context, decision, establishedAt);

      const [countRows] = await connection.execute<Array<RowDataPacket & { count: number | string }>>(
        `SELECT COUNT(*) AS count
           FROM baseline_items
          WHERE tenant_id = ? AND baseline_id = ?`,
        [tenantId, baselineId]
      );
      if (Number(countRows[0]?.count ?? 0) === 0) {
        throw new Error('Baseline cannot be established without Baseline Items.');
      }

      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE baselines
            SET status = ?, established_at = ?, establishment_decision_id = ?,
                row_version = row_version + 1, updated_by_person_id = ?
          WHERE tenant_id = ? AND id = ? AND row_version = ? AND status = 'DRAFT'`,
        [
          next.status,
          databaseDate(establishedAt),
          next.establishmentDecisionId ?? null,
          audit.actorPersonId ?? null,
          tenantId,
          baselineId,
          row.row_version
        ]
      );
      if (result.affectedRows !== 1) {
        throw new Error('Concurrent Baseline establishment detected.');
      }

      await writeAudit(
        connection,
        tenantId,
        'BASELINE',
        baselineId,
        'ESTABLISHED',
        audit,
        next
      );
      return next;
    });
  }

  async supersedeBaseline(
    tenantId: TenantId,
    currentBaselineId: Baseline['id'],
    replacementBaselineId: Baseline['id'],
    audit: AuditContext = {}
  ): Promise<Baseline> {
    return withTransaction(this.pool, async (connection) => {
      const currentRow = await this.requireBaselineForUpdate(
        connection,
        tenantId,
        currentBaselineId
      );
      const replacementRow = await this.requireBaselineForUpdate(
        connection,
        tenantId,
        replacementBaselineId
      );
      const current = mapBaseline(currentRow);
      const replacement = mapBaseline(replacementRow);
      const next = supersedeBaseline(current, replacement);

      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE baselines
            SET status = ?, superseded_by_baseline_id = ?,
                row_version = row_version + 1, updated_by_person_id = ?
          WHERE tenant_id = ? AND id = ? AND row_version = ? AND status = 'ESTABLISHED'`,
        [
          next.status,
          replacementBaselineId,
          audit.actorPersonId ?? null,
          tenantId,
          currentBaselineId,
          currentRow.row_version
        ]
      );
      if (result.affectedRows !== 1) {
        throw new Error('Concurrent Baseline supersession detected.');
      }

      await writeAudit(
        connection,
        tenantId,
        'BASELINE',
        currentBaselineId,
        'SUPERSEDED',
        audit,
        { replacementBaselineId }
      );
      return next;
    });
  }

  async createEffectivity(
    tenantId: TenantId,
    effectivity: Effectivity,
    audit: AuditContext = {}
  ): Promise<void> {
    if (effectivity.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const item = await this.requireConfigurationItem(
      tenantId,
      effectivity.configurationItemId
    );
    createEffectivity(effectivity, item);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO effectivities
          (id, tenant_id, configuration_item_id, subject_version, effectivity_type,
           scope_type, scope_id, effective_from, effective_to, expression, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          effectivity.id,
          effectivity.tenantId,
          effectivity.configurationItemId,
          effectivity.subjectVersion,
          effectivity.effectivityType,
          effectivity.scopeType,
          effectivity.scopeId ?? null,
          effectivity.effectiveFrom ? databaseDate(effectivity.effectiveFrom) : null,
          effectivity.effectiveTo ? databaseDate(effectivity.effectiveTo) : null,
          effectivity.expression ?? null,
          effectivity.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        tenantId,
        'EFFECTIVITY',
        effectivity.id,
        'CREATED',
        audit,
        effectivity
      );
    });
  }

  async listConfigurationStatus(
    tenantId: TenantId,
    contextObjectId: CanonicalObjectIdentity['id']
  ): Promise<ConfigurationStatusEntry[]> {
    const [rows] = await this.pool.execute<ConfigurationStatusRow[]>(
      `SELECT
          b.id AS baseline_id,
          b.code AS baseline_code,
          b.status AS baseline_status,
          ci.id AS configuration_item_id,
          ci.code AS configuration_item_code,
          ci.name AS configuration_item_name,
          bi.subject_version
         FROM baselines b
         JOIN baseline_items bi
           ON bi.tenant_id = b.tenant_id
          AND bi.baseline_id = b.id
         JOIN configuration_items ci
           ON ci.tenant_id = bi.tenant_id
          AND ci.id = bi.configuration_item_id
        WHERE b.tenant_id = ?
          AND b.context_object_id = ?
          AND b.status IN ('ESTABLISHED', 'SUPERSEDED')
        ORDER BY b.established_at, b.id, ci.code`,
      [tenantId, contextObjectId]
    );

    const [effectivityRows] = await this.pool.execute<EffectivityStatusRow[]>(
      `SELECT e.id, e.tenant_id, e.configuration_item_id, e.subject_version,
              e.effectivity_type, e.scope_type, e.scope_id, e.effective_from,
              e.effective_to, e.expression, e.status, bi.baseline_id
         FROM baselines b
         JOIN baseline_items bi
           ON bi.tenant_id = b.tenant_id
          AND bi.baseline_id = b.id
         JOIN effectivities e
           ON e.tenant_id = bi.tenant_id
          AND e.configuration_item_id = bi.configuration_item_id
          AND e.subject_version = bi.subject_version
        WHERE b.tenant_id = ?
          AND b.context_object_id = ?
          AND b.status IN ('ESTABLISHED', 'SUPERSEDED')
        ORDER BY b.established_at, bi.baseline_id, e.id`,
      [tenantId, contextObjectId]
    );

    const effectivitiesByKey = new Map<string, Effectivity[]>();
    for (const row of effectivityRows) {
      const key = `${row.baseline_id}::${row.configuration_item_id}::${row.subject_version}`;
      const list = effectivitiesByKey.get(key) ?? [];
      list.push(mapEffectivity(row));
      effectivitiesByKey.set(key, list);
    }

    return rows.map((row) => {
      const key = `${row.baseline_id}::${row.configuration_item_id}::${row.subject_version}`;
      return {
        baselineId: row.baseline_id as ConfigurationStatusEntry['baselineId'],
        baselineCode: row.baseline_code,
        baselineStatus: row.baseline_status,
        configurationItemId:
          row.configuration_item_id as ConfigurationStatusEntry['configurationItemId'],
        configurationItemCode: row.configuration_item_code,
        configurationItemName: row.configuration_item_name,
        subjectVersion: row.subject_version,
        effectivities: Object.freeze([...(effectivitiesByKey.get(key) ?? [])])
      };
    });
  }

  async getInformationRevision(
    tenantId: TenantId,
    revisionId: InformationRevision['id']
  ): Promise<InformationRevision> {
    return this.requireInformationRevision(tenantId, revisionId);
  }

  private async requireInformationContainer(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<InformationContainer> {
    const [rows] = await connection.execute<InformationContainerRow[]>(
      `SELECT id, tenant_id, canonical_object_id, container_type, code, title,
              status, row_version
         FROM information_containers
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Information Container not found in tenant.');
    return mapInformationContainer(row);
  }

  private async requireInformationRevision(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<InformationRevision> {
    const [rows] = await connection.execute<InformationRevisionRow[]>(
      `SELECT id, tenant_id, information_container_id, revision, status, created_at,
              released_at, release_decision_id, released_iteration_id,
              superseded_by_revision_id, row_version
         FROM information_revisions
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Information Revision not found in tenant.');
    return mapInformationRevision(row);
  }

  private async requireInformationRevisionForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: string
  ): Promise<InformationRevisionRow> {
    const [rows] = await connection.execute<InformationRevisionRow[]>(
      `SELECT id, tenant_id, information_container_id, revision, status, created_at,
              released_at, release_decision_id, released_iteration_id,
              superseded_by_revision_id, row_version
         FROM information_revisions
        WHERE tenant_id = ? AND id = ?
        FOR UPDATE`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Information Revision not found in tenant.');
    return row;
  }

  private async requireInformationIteration(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<InformationIteration> {
    const [rows] = await connection.execute<InformationIterationRow[]>(
      `SELECT id, tenant_id, information_revision_id, iteration, status, created_at,
              author_person_id, row_version
         FROM information_iterations
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Information Iteration not found in tenant.');
    return mapInformationIteration(row);
  }

  private async requireInformationIterationForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: string
  ): Promise<InformationIterationRow> {
    const [rows] = await connection.execute<InformationIterationRow[]>(
      `SELECT id, tenant_id, information_revision_id, iteration, status, created_at,
              author_person_id, row_version
         FROM information_iterations
        WHERE tenant_id = ? AND id = ?
        FOR UPDATE`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Information Iteration not found in tenant.');
    return row;
  }

  private async requireRepresentation(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<Representation> {
    const [rows] = await connection.execute<RepresentationRow[]>(
      `SELECT id, tenant_id, information_iteration_id, representation_type,
              media_type, file_name, content_reference, integrity_hash, generated_at
         FROM representations
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Representation not found in tenant.');
    return mapRepresentation(row);
  }

  private async requireConfigurationItem(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<ConfigurationItem> {
    const [rows] = await connection.execute<ConfigurationItemRow[]>(
      `SELECT id, tenant_id, canonical_object_id, code, name, status, row_version
         FROM configuration_items
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Configuration Item not found in tenant.');
    return mapConfigurationItem(row);
  }

  private async requireBaseline(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<Baseline> {
    const [rows] = await connection.execute<BaselineRow[]>(
      `SELECT id, tenant_id, context_object_id, code, name, status, established_at,
              establishment_decision_id, superseded_by_baseline_id, row_version
         FROM baselines
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Baseline not found in tenant.');
    return mapBaseline(row);
  }

  private async requireBaselineForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: string
  ): Promise<BaselineRow> {
    const [rows] = await connection.execute<BaselineRow[]>(
      `SELECT id, tenant_id, context_object_id, code, name, status, established_at,
              establishment_decision_id, superseded_by_baseline_id, row_version
         FROM baselines
        WHERE tenant_id = ? AND id = ?
        FOR UPDATE`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Baseline not found in tenant.');
    return row;
  }

  private async requireCanonicalObject(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<CanonicalObjectIdentity> {
    const [rows] = await connection.execute<CanonicalObjectRow[]>(
      `SELECT id, tenant_id, object_type, stable_key, created_at
         FROM canonical_objects
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Canonical Object not found in tenant.');
    return mapCanonicalObject(row);
  }

  private async requirePerson(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<Person> {
    const [rows] = await connection.execute<PersonRow[]>(
      `SELECT id, tenant_id, party_id, legal_name, preferred_name, status
         FROM persons
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Person not found in tenant.');
    return mapPerson(row);
  }

  private async requireDecision(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<Decision> {
    const [rows] = await connection.execute<DecisionRow[]>(
      `SELECT id, tenant_id, decision_type, subject_object_id, subject_version,
              outcome, reason, decider_person_id, authority_grant_id, decided_at
         FROM decisions
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Decision not found in tenant.');
    return mapDecision(row);
  }
}
