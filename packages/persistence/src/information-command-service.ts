import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type CanonicalObjectIdentity,
  type InformationContainer,
  type InformationIssue,
  type InformationIteration,
  type InformationRevision,
  type Representation,
  type RepresentationType,
  type TenantId
} from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlInformationRepository } from './information-repository.js';

interface AuthorityBackedDecisionRow extends RowDataPacket {
  id: string;
  outcome: string;
  authority_grant_id: string | null;
  decided_at: Date;
  grant_status: 'ACTIVE' | 'INACTIVE';
  effective_from: Date;
  effective_to: Date | null;
}

export class InformationCommandError extends Error {
  constructor(
    message: string,
    readonly code: 'PERMISSION_DENIED' | 'INVALID_INPUT' | 'NOT_FOUND' | 'CONFLICT'
  ) {
    super(message);
    this.name = 'InformationCommandError';
  }
}

function required(value: string | undefined, label: string): string {
  const result = value?.trim() ?? '';
  if (!result) throw new InformationCommandError(`${label} is required.`, 'INVALID_INPUT');
  return result;
}
function optional(value: string | undefined): string | undefined {
  const result = value?.trim() ?? '';
  return result || undefined;
}
function now(): string {
  return new Date().toISOString();
}
function mapError(error: unknown): never {
  if (error instanceof InformationCommandError) throw error;
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: string }).code;
    if (code === 'ER_DUP_ENTRY') {
      throw new InformationCommandError(
        'An equivalent Information record already exists.',
        'CONFLICT'
      );
    }
  }
  if (error instanceof Error) {
    if (/not found|does not exist/i.test(error.message)) {
      throw new InformationCommandError(error.message, 'NOT_FOUND');
    }
    if (/must|required|invalid|cannot|only|same tenant|empty/i.test(error.message)) {
      throw new InformationCommandError(error.message, 'INVALID_INPUT');
    }
  }
  throw error;
}

const REPRESENTATION_TYPES: ReadonlySet<RepresentationType> = new Set([
  'NATIVE',
  'PDF',
  'IMAGE',
  'DATA',
  'REPORT',
  'OTHER'
]);

export class MySqlInformationCommandService {
  private readonly access: MySqlAccessRepository;
  private readonly information: MySqlInformationRepository;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
    this.information = new MySqlInformationRepository(pool);
  }

  async createContainer(
    tenantId: TenantId,
    actorPersonId: string,
    input: { containerType: string; code: string; title: string }
  ): Promise<InformationContainer> {
    await this.requireManage(tenantId, actorPersonId);
    const code = required(input.code, 'Information code').toUpperCase();
    const timestamp = now();
    const object: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`INFOOBJ-${randomUUID()}`, 'Canonical Object'),
      tenantId,
      objectType: 'INFORMATION_CONTAINER',
      stableKey: `INFORMATION:${code}`,
      createdAt: timestamp
    };
    const container: InformationContainer = {
      id: asId<'InformationContainerId'>(`INFO-${randomUUID()}`, 'Information Container'),
      tenantId,
      canonicalObjectId: object.id,
      containerType: required(input.containerType, 'Information type').toUpperCase(),
      code,
      title: required(input.title, 'Information title'),
      status: 'ACTIVE'
    };
    try {
      await this.information.createInformationContainerWithCanonicalObject(
        tenantId,
        object,
        container,
        { actorPersonId, correlationId: 'INFORMATION-WORKSPACE' }
      );
      return container;
    } catch (error) {
      return mapError(error);
    }
  }

  async createRevision(
    tenantId: TenantId,
    actorPersonId: string,
    input: { informationContainerId: string; revision: string }
  ): Promise<InformationRevision> {
    await this.requireManage(tenantId, actorPersonId);
    const revision: InformationRevision = {
      id: asId<'InformationRevisionId'>(`REV-${randomUUID()}`, 'Information Revision'),
      tenantId,
      informationContainerId: required(
        input.informationContainerId,
        'Information Container'
      ) as InformationRevision['informationContainerId'],
      revision: required(input.revision, 'Revision').toUpperCase(),
      status: 'DRAFT',
      createdAt: now()
    };
    try {
      await this.information.createInformationRevision(
        tenantId,
        revision,
        { actorPersonId, correlationId: 'INFORMATION-WORKSPACE' }
      );
      return revision;
    } catch (error) {
      return mapError(error);
    }
  }

  async createIteration(
    tenantId: TenantId,
    actorPersonId: string,
    input: { informationRevisionId: string }
  ): Promise<InformationIteration> {
    await this.requireManage(tenantId, actorPersonId);
    const informationRevisionId = required(input.informationRevisionId, 'Information Revision');
    const [rows] = await this.pool.query<Array<RowDataPacket & { next_iteration: number | string }>>(
      `SELECT COALESCE(MAX(iteration), 0) + 1 AS next_iteration
         FROM information_iterations
        WHERE tenant_id = ? AND information_revision_id = ?`,
      [tenantId, informationRevisionId]
    );
    const iteration: InformationIteration = {
      id: asId<'InformationIterationId'>(`ITER-${randomUUID()}`, 'Information Iteration'),
      tenantId,
      informationRevisionId: informationRevisionId as InformationIteration['informationRevisionId'],
      iteration: Number(rows[0]?.next_iteration ?? 1),
      status: 'WORKING',
      createdAt: now(),
      authorPersonId: actorPersonId as NonNullable<InformationIteration['authorPersonId']>
    };
    try {
      await this.information.createInformationIteration(
        tenantId,
        iteration,
        { actorPersonId, correlationId: 'INFORMATION-WORKSPACE' }
      );
      return iteration;
    } catch (error) {
      return mapError(error);
    }
  }

  async freezeIteration(
    tenantId: TenantId,
    actorPersonId: string,
    iterationId: string
  ): Promise<InformationIteration> {
    await this.requireManage(tenantId, actorPersonId);
    try {
      return await this.information.freezeInformationIteration(
        tenantId,
        iterationId as InformationIteration['id'],
        { actorPersonId, correlationId: 'INFORMATION-WORKSPACE' }
      );
    } catch (error) {
      return mapError(error);
    }
  }

  async createRepresentation(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      informationIterationId: string;
      representationType: RepresentationType;
      mediaType: string;
      fileName?: string;
      contentReference: string;
      integrityHash?: string;
    }
  ): Promise<Representation> {
    await this.requireManage(tenantId, actorPersonId);
    if (!REPRESENTATION_TYPES.has(input.representationType)) {
      throw new InformationCommandError('Representation type is not supported.', 'INVALID_INPUT');
    }
    const fileName = optional(input.fileName);
    const integrityHash = optional(input.integrityHash);
    const representation: Representation = {
      id: asId<'RepresentationId'>(`REP-${randomUUID()}`, 'Representation'),
      tenantId,
      informationIterationId: required(
        input.informationIterationId,
        'Information Iteration'
      ) as Representation['informationIterationId'],
      representationType: input.representationType,
      mediaType: required(input.mediaType, 'Media type'),
      ...(fileName ? { fileName } : {}),
      contentReference: required(input.contentReference, 'Content reference'),
      ...(integrityHash ? { integrityHash } : {}),
      generatedAt: now()
    };
    try {
      await this.information.createRepresentation(
        tenantId,
        representation,
        { actorPersonId, correlationId: 'INFORMATION-WORKSPACE' }
      );
      return representation;
    } catch (error) {
      return mapError(error);
    }
  }

  async releaseRevision(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      informationRevisionId: string;
      releasedIterationId: string;
      decisionId: string;
    }
  ): Promise<InformationRevision> {
    await this.requireManage(tenantId, actorPersonId);
    const decisionId = required(input.decisionId, 'Approved release Decision');
    await this.requireAuthorityBackedDecision(tenantId, decisionId);
    try {
      return await this.information.releaseInformationRevision(
        tenantId,
        required(input.informationRevisionId, 'Information Revision') as InformationRevision['id'],
        required(input.releasedIterationId, 'Released Information Iteration') as InformationIteration['id'],
        now(),
        decisionId as InformationRevision['releaseDecisionId'],
        { actorPersonId, correlationId: 'INFORMATION-WORKSPACE' }
      );
    } catch (error) {
      return mapError(error);
    }
  }

  async issueInformation(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      informationContainerId: string;
      informationRevisionId: string;
      representationId?: string;
      issueReference: string;
      issuePurpose: string;
      recipientContext?: string;
    }
  ): Promise<InformationIssue> {
    await this.requireManage(tenantId, actorPersonId);
    const representationId = optional(input.representationId);
    const recipientContext = optional(input.recipientContext);
    const issue: InformationIssue = {
      id: asId<'InformationIssueId'>(`ISSUE-${randomUUID()}`, 'Information Issue'),
      tenantId,
      informationContainerId: required(
        input.informationContainerId,
        'Information Container'
      ) as InformationIssue['informationContainerId'],
      informationRevisionId: required(
        input.informationRevisionId,
        'Information Revision'
      ) as InformationIssue['informationRevisionId'],
      ...(representationId
        ? { representationId: representationId as NonNullable<InformationIssue['representationId']> }
        : {}),
      issueReference: required(input.issueReference, 'Issue reference').toUpperCase(),
      issuePurpose: required(input.issuePurpose, 'Issue purpose'),
      issuedByPersonId: actorPersonId as InformationIssue['issuedByPersonId'],
      issuedAt: now(),
      ...(recipientContext ? { recipientContext } : {})
    };
    try {
      await this.information.issueInformation(
        tenantId,
        issue,
        { actorPersonId, correlationId: 'INFORMATION-WORKSPACE' }
      );
      return issue;
    } catch (error) {
      return mapError(error);
    }
  }

  private async requireManage(tenantId: TenantId, actorPersonId: string): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.INFORMATION_MANAGE,
      { scopeType: 'TENANT' }
    );
    if (!evaluation.allowed) {
      throw new InformationCommandError(evaluation.reason, 'PERMISSION_DENIED');
    }
  }

  private async requireAuthorityBackedDecision(tenantId: TenantId, decisionId: string): Promise<void> {
    const [rows] = await this.pool.query<AuthorityBackedDecisionRow[]>(
      `SELECT d.id, d.outcome, d.authority_grant_id, d.decided_at,
              ag.status AS grant_status, ag.effective_from, ag.effective_to
         FROM decisions d
         LEFT JOIN authority_grants ag
           ON ag.tenant_id = d.tenant_id AND ag.id = d.authority_grant_id
        WHERE d.tenant_id = ? AND d.id = ?`,
      [tenantId, decisionId]
    );
    const row = rows[0];
    if (!row) throw new InformationCommandError('Release Decision was not found in tenant.', 'NOT_FOUND');
    if (row.outcome !== 'APPROVED' || !row.authority_grant_id || row.grant_status !== 'ACTIVE') {
      throw new InformationCommandError(
        'Release requires an APPROVED Decision backed by an active Authority Grant.',
        'INVALID_INPUT'
      );
    }
    const decidedAt = row.decided_at.getTime();
    if (
      decidedAt < row.effective_from.getTime() ||
      (row.effective_to && decidedAt > row.effective_to.getTime())
    ) {
      throw new InformationCommandError(
        'Release Decision was made outside the Authority Grant effectivity period.',
        'INVALID_INPUT'
      );
    }
  }
}
