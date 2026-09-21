import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { TenantId } from '@nublox/kernel';

interface ContainerRow extends RowDataPacket {
  id: string;
  canonical_object_id: string;
  container_type: string;
  code: string;
  title: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: Date;
  updated_at: Date;
}
interface RevisionRow extends RowDataPacket {
  id: string;
  information_container_id: string;
  revision: string;
  status: 'DRAFT' | 'RELEASED' | 'SUPERSEDED' | 'WITHDRAWN';
  created_at: Date;
  released_at: Date | null;
  release_decision_id: string | null;
  released_iteration_id: string | null;
  superseded_by_revision_id: string | null;
}
interface IterationRow extends RowDataPacket {
  id: string;
  information_revision_id: string;
  iteration: number;
  status: 'WORKING' | 'FROZEN';
  created_at: Date;
  author_person_id: string | null;
  author_name: string | null;
}
interface RepresentationRow extends RowDataPacket {
  id: string;
  information_iteration_id: string;
  representation_type: 'NATIVE' | 'PDF' | 'IMAGE' | 'DATA' | 'REPORT' | 'OTHER';
  media_type: string;
  file_name: string | null;
  content_reference: string;
  integrity_hash: string | null;
  generated_at: Date;
}
interface IssueRow extends RowDataPacket {
  id: string;
  information_container_id: string;
  information_revision_id: string;
  representation_id: string | null;
  issue_reference: string;
  issue_purpose: string;
  issued_by_person_id: string;
  issued_by_name: string;
  issued_at: Date;
  recipient_context: string | null;
}
interface ReleaseDecisionRow extends RowDataPacket {
  id: string;
  information_container_id: string;
  subject_version: string | null;
  decision_type: string;
  outcome: string;
  reason: string;
  decider_name: string;
  authority_grant_id: string;
  decided_at: Date;
}

export interface InformationWorkspaceProjection {
  containers: Array<{
    id: string;
    canonicalObjectId: string;
    containerType: string;
    code: string;
    title: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
    revisions: Array<{
      id: string;
      revision: string;
      status: 'DRAFT' | 'RELEASED' | 'SUPERSEDED' | 'WITHDRAWN';
      createdAt: string;
      releasedAt?: string;
      releaseDecisionId?: string;
      releasedIterationId?: string;
      supersededByRevisionId?: string;
      iterations: Array<{
        id: string;
        iteration: number;
        status: 'WORKING' | 'FROZEN';
        createdAt: string;
        authorPersonId?: string;
        authorName?: string;
        representations: Array<{
          id: string;
          representationType: 'NATIVE' | 'PDF' | 'IMAGE' | 'DATA' | 'REPORT' | 'OTHER';
          mediaType: string;
          fileName?: string;
          contentReference: string;
          integrityHash?: string;
          generatedAt: string;
        }>;
      }>;
    }>;
    issues: Array<{
      id: string;
      informationRevisionId: string;
      representationId?: string;
      issueReference: string;
      issuePurpose: string;
      issuedByPersonId: string;
      issuedByName: string;
      issuedAt: string;
      recipientContext?: string;
    }>;
  }>;
  releaseDecisions: Array<{
    id: string;
    informationContainerId: string;
    subjectVersion?: string;
    decisionType: string;
    outcome: string;
    reason: string;
    deciderName: string;
    authorityGrantId: string;
    decidedAt: string;
  }>;
  totals: {
    containers: number;
    revisions: number;
    iterations: number;
    representations: number;
    issues: number;
  };
}

export class MySqlInformationReadRepository {
  constructor(private readonly pool: Pool) {}

  async getProjection(tenantId: TenantId): Promise<InformationWorkspaceProjection> {
    const [containerResult, revisionResult, iterationResult, representationResult, issueResult, decisionResult] =
      await Promise.all([
        this.pool.query<ContainerRow[]>(
          `SELECT id, canonical_object_id, container_type, code, title, status, created_at, updated_at
             FROM information_containers
            WHERE tenant_id = ?
            ORDER BY status = 'ACTIVE' DESC, code, title`,
          [tenantId]
        ),
        this.pool.query<RevisionRow[]>(
          `SELECT id, information_container_id, revision, status, created_at, released_at,
                  release_decision_id, released_iteration_id, superseded_by_revision_id
             FROM information_revisions
            WHERE tenant_id = ?
            ORDER BY information_container_id, created_at DESC, revision DESC`,
          [tenantId]
        ),
        this.pool.query<IterationRow[]>(
          `SELECT ii.id, ii.information_revision_id, ii.iteration, ii.status, ii.created_at,
                  ii.author_person_id,
                  CASE WHEN p.id IS NULL THEN NULL ELSE COALESCE(p.preferred_name, p.legal_name) END AS author_name
             FROM information_iterations ii
             LEFT JOIN persons p
               ON p.tenant_id = ii.tenant_id AND p.id = ii.author_person_id
            WHERE ii.tenant_id = ?
            ORDER BY ii.information_revision_id, ii.iteration DESC`,
          [tenantId]
        ),
        this.pool.query<RepresentationRow[]>(
          `SELECT id, information_iteration_id, representation_type, media_type, file_name,
                  content_reference, integrity_hash, generated_at
             FROM representations
            WHERE tenant_id = ?
            ORDER BY information_iteration_id, generated_at DESC`,
          [tenantId]
        ),
        this.pool.query<IssueRow[]>(
          `SELECT i.id, i.information_container_id, i.information_revision_id, i.representation_id,
                  i.issue_reference, i.issue_purpose, i.issued_by_person_id,
                  COALESCE(p.preferred_name, p.legal_name) AS issued_by_name,
                  i.issued_at, i.recipient_context
             FROM information_issues i
             JOIN persons p
               ON p.tenant_id = i.tenant_id AND p.id = i.issued_by_person_id
            WHERE i.tenant_id = ?
            ORDER BY i.issued_at DESC, i.issue_reference DESC`,
          [tenantId]
        ),
        this.pool.query<ReleaseDecisionRow[]>(
          `SELECT d.id, ic.id AS information_container_id, d.subject_version, d.decision_type,
                  d.outcome, d.reason, COALESCE(p.preferred_name, p.legal_name) AS decider_name,
                  d.authority_grant_id, d.decided_at
             FROM decisions d
             JOIN information_containers ic
               ON ic.tenant_id = d.tenant_id AND ic.canonical_object_id = d.subject_object_id
             JOIN persons p
               ON p.tenant_id = d.tenant_id AND p.id = d.decider_person_id
            WHERE d.tenant_id = ?
              AND d.outcome = 'APPROVED'
              AND d.authority_grant_id IS NOT NULL
            ORDER BY d.decided_at DESC`,
          [tenantId]
        )
      ]);

    const representationsByIteration = new Map<string, InformationWorkspaceProjection['containers'][number]['revisions'][number]['iterations'][number]['representations']>();
    for (const row of representationResult[0]) {
      const list = representationsByIteration.get(row.information_iteration_id) ?? [];
      list.push({
        id: row.id,
        representationType: row.representation_type,
        mediaType: row.media_type,
        ...(row.file_name ? { fileName: row.file_name } : {}),
        contentReference: row.content_reference,
        ...(row.integrity_hash ? { integrityHash: row.integrity_hash } : {}),
        generatedAt: row.generated_at.toISOString()
      });
      representationsByIteration.set(row.information_iteration_id, list);
    }

    const iterationsByRevision = new Map<string, InformationWorkspaceProjection['containers'][number]['revisions'][number]['iterations']>();
    for (const row of iterationResult[0]) {
      const list = iterationsByRevision.get(row.information_revision_id) ?? [];
      list.push({
        id: row.id,
        iteration: Number(row.iteration),
        status: row.status,
        createdAt: row.created_at.toISOString(),
        ...(row.author_person_id ? { authorPersonId: row.author_person_id } : {}),
        ...(row.author_name ? { authorName: row.author_name } : {}),
        representations: representationsByIteration.get(row.id) ?? []
      });
      iterationsByRevision.set(row.information_revision_id, list);
    }

    const revisionsByContainer = new Map<string, InformationWorkspaceProjection['containers'][number]['revisions']>();
    for (const row of revisionResult[0]) {
      const list = revisionsByContainer.get(row.information_container_id) ?? [];
      list.push({
        id: row.id,
        revision: row.revision,
        status: row.status,
        createdAt: row.created_at.toISOString(),
        ...(row.released_at ? { releasedAt: row.released_at.toISOString() } : {}),
        ...(row.release_decision_id ? { releaseDecisionId: row.release_decision_id } : {}),
        ...(row.released_iteration_id ? { releasedIterationId: row.released_iteration_id } : {}),
        ...(row.superseded_by_revision_id ? { supersededByRevisionId: row.superseded_by_revision_id } : {}),
        iterations: iterationsByRevision.get(row.id) ?? []
      });
      revisionsByContainer.set(row.information_container_id, list);
    }

    const issuesByContainer = new Map<string, InformationWorkspaceProjection['containers'][number]['issues']>();
    for (const row of issueResult[0]) {
      const list = issuesByContainer.get(row.information_container_id) ?? [];
      list.push({
        id: row.id,
        informationRevisionId: row.information_revision_id,
        ...(row.representation_id ? { representationId: row.representation_id } : {}),
        issueReference: row.issue_reference,
        issuePurpose: row.issue_purpose,
        issuedByPersonId: row.issued_by_person_id,
        issuedByName: row.issued_by_name,
        issuedAt: row.issued_at.toISOString(),
        ...(row.recipient_context ? { recipientContext: row.recipient_context } : {})
      });
      issuesByContainer.set(row.information_container_id, list);
    }

    return {
      containers: containerResult[0].map((row) => ({
        id: row.id,
        canonicalObjectId: row.canonical_object_id,
        containerType: row.container_type,
        code: row.code,
        title: row.title,
        status: row.status,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        revisions: revisionsByContainer.get(row.id) ?? [],
        issues: issuesByContainer.get(row.id) ?? []
      })),
      releaseDecisions: decisionResult[0].map((row) => ({
        id: row.id,
        informationContainerId: row.information_container_id,
        ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
        decisionType: row.decision_type,
        outcome: row.outcome,
        reason: row.reason,
        deciderName: row.decider_name,
        authorityGrantId: row.authority_grant_id,
        decidedAt: row.decided_at.toISOString()
      })),
      totals: {
        containers: containerResult[0].length,
        revisions: revisionResult[0].length,
        iterations: iterationResult[0].length,
        representations: representationResult[0].length,
        issues: issueResult[0].length
      }
    };
  }
}
