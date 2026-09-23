import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RowDataPacket } from 'mysql2/promise';
import {
  PLATFORM_ADMINISTRATOR_ROLE_ID,
  asId,
  type AccessRoleAssignment,
  type CanonicalObjectIdentity,
  type Decision,
  type Party,
  type Person,
  type Tenant
} from '@nublox/kernel';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlKernelControlRepository } from './control-repository.js';
import { createDatabasePool } from './database.js';
import {
  MigrationCommandError,
  MySqlMigrationCommandService
} from './migration-command-service.js';
import { MySqlMigrationRepository } from './migration-repository.js';
import { migrate } from './migrations.js';
import { MySqlPublicationCommandService } from './publication-command-service.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('governed migration control', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('requires frozen mapping, conflict disposition, verified reconciliation and authority-backed cutover', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const tenantId = asId<'TenantId'>('TENANT-MIG-' + suffix, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const control = new MySqlKernelControlRepository(pool);
    const access = new MySqlAccessRepository(pool);
    const service = new MySqlMigrationCommandService(pool);
    const repository = new MySqlMigrationRepository(pool);
    const publication = new MySqlPublicationCommandService(pool);

    const tenant: Tenant = {
      id: tenantId,
      name: 'Governed Migration Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant);

    async function createPerson(label: string): Promise<Person> {
      const party: Party = {
        id: asId<'PartyId'>('PARTY-' + label + '-' + suffix, 'Party'),
        tenantId,
        kind: 'PERSON',
        displayName: label,
        status: 'ACTIVE'
      };
      await kernel.createParty(tenantId, party);

      const person: Person = {
        id: asId<'PersonId'>('PERSON-' + label + '-' + suffix, 'Person'),
        tenantId,
        partyId: party.id,
        legalName: label,
        status: 'ACTIVE'
      };
      await kernel.createPerson(tenantId, person);
      return person;
    }

    const admin = await createPerson('Migration-Admin');
    const worker = await createPerson('Migration-Worker');

    const assignment: AccessRoleAssignment = {
      id: asId<'AccessRoleAssignmentId'>(
        'ARA-MIG-' + suffix,
        'Access Role Assignment'
      ),
      tenantId,
      accessRoleId: PLATFORM_ADMINISTRATOR_ROLE_ID,
      principalType: 'PERSON',
      principalId: admin.id,
      scopeType: 'TENANT',
      effectiveFrom: '2026-09-23T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await access.assignAccessRole(tenantId, assignment, {
      actorPersonId: admin.id,
      correlationId: 'MIGRATION-TEST'
    });

    const scope: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>('SCOPE-MIG-' + suffix, 'Migration Scope'),
      tenantId,
      objectType: 'ORGANISATION',
      stableKey: 'MIGRATION-SCOPE:' + suffix,
      createdAt: '2026-09-23T18:00:00.000Z'
    };
    const target: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>('TARGET-MIG-' + suffix, 'Migration Target'),
      tenantId,
      objectType: 'INFORMATION_CONTAINER',
      stableKey: 'DOC:' + suffix,
      createdAt: '2026-09-23T18:00:30.000Z'
    };
    await kernel.createCanonicalObject(tenantId, scope, {
      actorPersonId: admin.id
    });
    await kernel.createCanonicalObject(tenantId, target, {
      actorPersonId: admin.id
    });

    async function createDecision(
      idLabel: string,
      decisionType: string,
      reason: string,
      decidedAt: string
    ): Promise<Decision> {
      const decision: Decision = {
        id: asId<'DecisionId'>(
          'DEC-' + idLabel + '-' + suffix,
          'Decision'
        ),
        tenantId,
        decisionType,
        subjectObjectId: scope.id,
        outcome: 'APPROVED',
        reason,
        deciderPersonId: admin.id,
        decidedAt
      };
      await control.createDecision(tenantId, decision, {
        actorPersonId: admin.id,
        correlationId: 'MIGRATION-TEST'
      });
      return decision;
    }

    const planDecision = await createDecision(
      'PLAN',
      'MIGRATION_PLAN_APPROVAL',
      'Migration scope and controls approved.',
      '2026-09-23T18:01:00.000Z'
    );

    await expect(
      service.createPlan(tenantId, worker.id, {
        code: 'DENIED',
        name: 'Denied migration',
        sourceSystem: 'LEGACY',
        targetSystem: 'NUBLOX',
        scopeObjectId: scope.id,
        scopeDefinition: { objectTypes: ['INFORMATION_CONTAINER'] },
        cutoverStrategy: 'PHASED'
      })
    ).rejects.toMatchObject({
      name: 'MigrationCommandError',
      code: 'PERMISSION_DENIED'
    } satisfies Partial<MigrationCommandError>);

    const plan = await service.createPlan(tenantId, admin.id, {
      code: 'MIG-' + suffix,
      name: 'Controlled legacy migration',
      sourceSystem: 'LEGACY-' + suffix,
      targetSystem: 'NUBLOX',
      scopeObjectId: scope.id,
      scopeDefinition: {
        objectTypes: ['INFORMATION_CONTAINER'],
        selection: 'approved migration scope'
      },
      cutoverStrategy: 'PHASED',
      createdAt: '2026-09-23T18:00:45.000Z'
    });
    expect(plan.status).toBe('DRAFT');

    const approvedPlan = await service.approvePlan(
      tenantId,
      admin.id,
      {
        planId: plan.id,
        decisionId: planDecision.id,
        approvedAt: '2026-09-23T18:01:30.000Z'
      }
    );
    expect(approvedPlan.status).toBe('APPROVED');

    const mapping = await service.createMappingVersion(
      tenantId,
      admin.id,
      {
        planId: plan.id,
        version: '1.0',
        sourceSchemaVersion: 'legacy-12',
        targetSchemaVersion: 'nublox-1',
        mappingDefinition: {
          objectType: 'INFORMATION_CONTAINER',
          fields: {
            number: 'stableKey',
            name: 'title'
          }
        },
        createdAt: '2026-09-23T18:02:00.000Z'
      }
    );
    expect(mapping.status).toBe('DRAFT');
    expect(mapping.checksum).toMatch(/^sha256:[0-9a-f]{64}$/);

    await expect(
      service.createRun(tenantId, admin.id, {
        planId: plan.id,
        mappingVersionId: mapping.id,
        runReference: 'RUN-DRAFT-' + suffix,
        runType: 'PRODUCTION',
        requestedAt: '2026-09-23T18:02:30.000Z'
      })
    ).rejects.toMatchObject({
      name: 'MigrationCommandError',
      code: 'INVALID_INPUT'
    } satisfies Partial<MigrationCommandError>);

    const frozenMapping = await service.freezeMappingVersion(
      tenantId,
      admin.id,
      mapping.id,
      '2026-09-23T18:03:00.000Z'
    );
    expect(frozenMapping.status).toBe('FROZEN');

    const envelope = await service.storeSourceEnvelope(
      tenantId,
      admin.id,
      {
        planId: plan.id,
        schemaName: 'legacy.document',
        schemaVersion: '12',
        objectType: 'WTDocument',
        sourceObjectId: 'LEGACY-DOC-' + suffix,
        payload: {
          number: 'LEGACY-DOC-' + suffix,
          name: 'Controlled source record',
          revision: 'A'
        },
        createdAt: '2026-09-23T18:03:30.000Z'
      }
    );

    const identity = await service.bindExternalIdentity(
      tenantId,
      admin.id,
      {
        planId: plan.id,
        targetCanonicalObjectId: target.id,
        sourceObjectType: 'WTDocument',
        sourceObjectId: 'LEGACY-DOC-' + suffix,
        sourceVersion: 'A',
        sourceReference: 'legacy://document/' + suffix
      }
    );

    const run = await service.createRun(
      tenantId,
      admin.id,
      {
        planId: plan.id,
        mappingVersionId: frozenMapping.id,
        runReference: 'RUN-PROD-' + suffix,
        runType: 'PRODUCTION',
        requestedAt: '2026-09-23T18:04:00.000Z'
      }
    );
    const running = await service.startRun(
      tenantId,
      admin.id,
      run.id,
      '2026-09-23T18:04:30.000Z'
    );
    expect(running.status).toBe('RUNNING');
    expect((await repository.getPlan(tenantId, plan.id))?.status)
      .toBe('ACTIVE');

    const item = await service.recordItemResult(
      tenantId,
      admin.id,
      {
        runId: run.id,
        sequence: 1,
        sourceObjectType: 'WTDocument',
        sourceObjectId: 'LEGACY-DOC-' + suffix,
        sourceVersion: 'A',
        sourceEnvelopeId: envelope.id,
        targetCanonicalObjectId: target.id,
        targetVersion: 'A',
        externalIdentityId: identity.id,
        outcome: 'CONFLICT',
        targetHash: envelope.checksum,
        message: 'Legacy lifecycle semantics require explicit disposition.',
        recordedAt: '2026-09-23T18:05:00.000Z'
      }
    );
    expect(item.sourceHash).toBe(envelope.checksum);

    const conflict = await service.createConflict(
      tenantId,
      admin.id,
      {
        runId: run.id,
        itemResultId: item.id,
        conflictType: 'MAPPING',
        severity: 'BLOCKING',
        code: 'LIFECYCLE-' + suffix,
        description: 'Legacy lifecycle value has no automatic target mapping.',
        detectedAt: '2026-09-23T18:05:30.000Z'
      }
    );

    const blocked = await service.completeLoad(
      tenantId,
      admin.id,
      run.id,
      '2026-09-23T18:06:00.000Z'
    );
    expect(blocked.status).toBe('BLOCKED');

    const preCutover = await service.startReconciliationRun(
      tenantId,
      admin.id,
      {
        runId: run.id,
        checkpoint: 'PRE_CUTOVER',
        startedAt: '2026-09-23T18:06:30.000Z'
      }
    );
    await service.recordReconciliation(
      tenantId,
      admin.id,
      {
        reconciliationRunId: preCutover.id,
        itemResultId: item.id,
        status: 'VERIFIED',
        targetHash: envelope.checksum,
        details: 'Identity and payload hashes match; semantic conflict remains open.',
        checkedAt: '2026-09-23T18:07:00.000Z'
      }
    );

    const firstReconciliation =
      await service.completeReconciliationRun(
        tenantId,
        admin.id,
        {
          reconciliationRunId: preCutover.id,
          details: 'Blocked by unresolved lifecycle mapping conflict.',
          completedAt: '2026-09-23T18:07:30.000Z'
        }
      );
    expect(firstReconciliation.reconciliation.status).toBe('CONFLICT');
    expect(firstReconciliation.run.status).toBe('BLOCKED');
    expect(firstReconciliation.run.completedAt).toBeUndefined();

    const conflictDecision = await createDecision(
      'CONFLICT',
      'MIGRATION_CONFLICT_DISPOSITION',
      'Approve explicit lifecycle mapping waiver for the retained source value.',
      '2026-09-23T18:08:00.000Z'
    );
    const disposition = await service.dispositionConflict(
      tenantId,
      admin.id,
      {
        conflictId: conflict.id,
        disposition: 'WAIVE',
        rationale: 'Source value is retained as provenance; target lifecycle remains governed by NuBlox.',
        decisionId: conflictDecision.id,
        disposedAt: '2026-09-23T18:08:30.000Z'
      }
    );
    expect(disposition.disposition).toBe('WAIVE');
    expect((await repository.getConflict(tenantId, conflict.id))?.status)
      .toBe('DISPOSITIONED');

    const cutoverReconciliation = await service.startReconciliationRun(
      tenantId,
      admin.id,
      {
        runId: run.id,
        checkpoint: 'CUTOVER',
        startedAt: '2026-09-23T18:09:00.000Z'
      }
    );
    await service.recordReconciliation(
      tenantId,
      admin.id,
      {
        reconciliationRunId: cutoverReconciliation.id,
        itemResultId: item.id,
        status: 'VERIFIED',
        targetHash: envelope.checksum,
        details: 'Payload and identity verified after approved semantic disposition.',
        checkedAt: '2026-09-23T18:09:30.000Z'
      }
    );

    const reconciled = await service.completeReconciliationRun(
      tenantId,
      admin.id,
      {
        reconciliationRunId: cutoverReconciliation.id,
        details: 'All source/target evidence verified and no blocking conflicts remain.',
        completedAt: '2026-09-23T18:10:00.000Z'
      }
    );
    expect(reconciled.reconciliation.status).toBe('VERIFIED');
    expect(reconciled.run.status).toBe('RECONCILED');
    expect(reconciled.run.completedAt).toBe('2026-09-23T18:10:00.000Z');

    const authorityRule = await publication.createSourceAuthorityRule(
      tenantId,
      admin.id,
      {
        code: 'NUBLOX-MASTER-' + suffix,
        name: 'NuBlox authority after migration',
        subjectObjectType: 'INFORMATION_CONTAINER',
        authorityOwner: 'NUBLOX',
        priority: 0,
        effectiveFrom: '2026-09-23T18:11:00.000Z'
      }
    );

    const cutoverDecision = await createDecision(
      'CUTOVER',
      'MIGRATION_CUTOVER',
      'Production migration is reconciled and ready for NuBlox authority.',
      '2026-09-23T18:10:30.000Z'
    );

    const cutover = await service.recordCutoverDecision(
      tenantId,
      admin.id,
      {
        planId: plan.id,
        runId: run.id,
        reconciliationRunId: cutoverReconciliation.id,
        decisionId: cutoverDecision.id,
        outcome: 'APPROVED',
        targetAuthorityRuleId: authorityRule.id,
        reason: 'Verified migration accepted; NuBlox becomes operational authority.',
        decidedAt: '2026-09-23T18:10:30.000Z',
        effectiveAt: '2026-09-23T18:11:00.000Z'
      }
    );
    expect(cutover.cutover.outcome).toBe('APPROVED');
    expect(cutover.plan.status).toBe('COMPLETED');

    const [auditRows] = await pool.query<
      Array<RowDataPacket & { entity_type: string; action: string }>
    >(
      `SELECT entity_type, action
         FROM kernel_audit_entries
        WHERE tenant_id = ?
          AND entity_type IN (
            'MIGRATION_PLAN',
            'MIGRATION_MAPPING_VERSION',
            'MIGRATION_RUN',
            'MIGRATION_CONFLICT_DISPOSITION',
            'MIGRATION_RECONCILIATION_RUN',
            'CUTOVER_DECISION'
          )
        ORDER BY audit_id`,
      [tenantId]
    );
    expect(auditRows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        entity_type: 'MIGRATION_MAPPING_VERSION',
        action: 'FROZEN'
      }),
      expect.objectContaining({
        entity_type: 'MIGRATION_CONFLICT_DISPOSITION',
        action: 'WAIVE'
      }),
      expect.objectContaining({
        entity_type: 'MIGRATION_RECONCILIATION_RUN',
        action: 'VERIFIED'
      }),
      expect.objectContaining({
        entity_type: 'CUTOVER_DECISION',
        action: 'APPROVED'
      }),
      expect.objectContaining({
        entity_type: 'MIGRATION_PLAN',
        action: 'COMPLETED'
      })
    ]));
  });
});
