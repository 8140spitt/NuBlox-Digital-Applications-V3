import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { CompetenceSubjectType, TenantId } from '@nublox/kernel';

interface FunctionRow extends RowDataPacket { id:string; code:string; name:string; }
interface SubFunctionRow extends RowDataPacket { id:string; function_id:string; code:string; name:string; }
interface DeploymentRow extends RowDataPacket { id:string; function_code:string; sub_function_code:string|null; scope_description:string; }
interface PersonRow extends RowDataPacket { id:string; name:string; }
interface RequirementRow extends RowDataPacket {
  id:string; subject_type:CompetenceSubjectType; subject_id:string; competence_code:string;
  competence_name:string; required_level:string; evidence_required:number|boolean;
  expiry_required:number|boolean; status:'ACTIVE'|'INACTIVE';
}
interface EvidenceRow extends RowDataPacket {
  id:string; person_id:string; person_name:string; competence_code:string; attained_level:string;
  evidence_record_id:string|null; issued_at:Date; effective_from:Date; effective_to:Date|null;
  status:'ACTIVE'|'INACTIVE';
}
interface EvidenceRecordRow extends RowDataPacket {
  id:string; evidence_type:string; subject_object_id:string; subject_version:string|null; captured_at:Date;
}

export interface CompetenceSubjectView {
  type: 'FUNCTION'|'SUB_FUNCTION'|'DEPLOYMENT';
  id: string;
  label: string;
}
export interface CompetenceRequirementView {
  id:string; subjectType:CompetenceSubjectType; subjectId:string; subjectLabel:string;
  competenceCode:string; competenceName:string; requiredLevel:string;
  evidenceRequired:boolean; expiryRequired:boolean; status:'ACTIVE'|'INACTIVE';
}
export interface CompetenceEvidenceView {
  id:string; personId:string; personName:string; competenceCode:string; attainedLevel:string;
  evidenceRecordId?:string; issuedAt:string; effectiveFrom:string; effectiveTo?:string;
  status:'ACTIVE'|'INACTIVE'; isExpired:boolean;
}
export interface CompetenceAdministrationProjection {
  subjects: CompetenceSubjectView[];
  people: Array<{id:string; name:string}>;
  evidenceRecords: Array<{id:string; label:string}>;
  requirements: CompetenceRequirementView[];
  evidence: CompetenceEvidenceView[];
}

export class MySqlCompetenceReadRepository {
  constructor(private readonly pool:Pool){}

  async getProjection(tenantId:TenantId, evaluatedAt=new Date().toISOString()):Promise<CompetenceAdministrationProjection>{
    const at=new Date(evaluatedAt);
    if(Number.isNaN(at.getTime())) throw new Error('Competence projection evaluation time is invalid.');

    const [functions,subs,deployments,people,requirements,evidence,evidenceRecords]=await Promise.all([
      this.pool.execute<FunctionRow[]>(
        `SELECT id, code, name FROM function_definitions WHERE status='ACTIVE' ORDER BY code`
      ),
      this.pool.execute<SubFunctionRow[]>(
        `SELECT id, function_id, code, name FROM sub_function_definitions WHERE status='ACTIVE' ORDER BY code`
      ),
      this.pool.execute<DeploymentRow[]>(
        `SELECT d.id, f.code AS function_code, sf.code AS sub_function_code, d.scope_description
           FROM functional_deployments d
           JOIN function_definitions f ON f.id=d.function_id
           LEFT JOIN sub_function_definitions sf ON sf.id=d.sub_function_id
          WHERE d.tenant_id=? AND d.status='ACTIVE'
          ORDER BY f.code, sf.code, d.id`,
        [tenantId]
      ),
      this.pool.execute<PersonRow[]>(
        `SELECT id, COALESCE(preferred_name, legal_name) AS name
           FROM persons WHERE tenant_id=? AND status='ACTIVE' ORDER BY name,id`,
        [tenantId]
      ),
      this.pool.execute<RequirementRow[]>(
        `SELECT id, subject_type, subject_id, competence_code, competence_name,
                required_level, evidence_required, expiry_required, status
           FROM competence_requirements WHERE tenant_id=?
          ORDER BY status='ACTIVE' DESC, competence_code, id`,
        [tenantId]
      ),
      this.pool.execute<EvidenceRow[]>(
        `SELECT ce.id, ce.person_id, COALESCE(p.preferred_name,p.legal_name) AS person_name,
                ce.competence_code, ce.attained_level, ce.evidence_record_id,
                ce.issued_at, ce.effective_from, ce.effective_to, ce.status
           FROM competence_evidence ce
           JOIN persons p ON p.tenant_id=ce.tenant_id AND p.id=ce.person_id
          WHERE ce.tenant_id=?
          ORDER BY ce.status='ACTIVE' DESC, person_name, ce.competence_code, ce.effective_from DESC`,
        [tenantId]
      ),
      this.pool.execute<EvidenceRecordRow[]>(
        `SELECT id, evidence_type, subject_object_id, subject_version, captured_at
           FROM evidence_records WHERE tenant_id=? ORDER BY captured_at DESC,id`,
        [tenantId]
      )
    ]);

    const subjects:CompetenceSubjectView[]=[
      ...functions[0].map(row=>({type:'FUNCTION' as const,id:row.id,label:`${row.code} — ${row.name}`})),
      ...subs[0].map(row=>({type:'SUB_FUNCTION' as const,id:row.id,label:`${row.code} — ${row.name}`})),
      ...deployments[0].map(row=>({
        type:'DEPLOYMENT' as const,id:row.id,
        label:`${row.function_code}${row.sub_function_code? ` · ${row.sub_function_code}`:''} — ${row.scope_description}`
      }))
    ];
    const subjectLabels=new Map(subjects.map(subject=>[`${subject.type}:${subject.id}`,subject.label]));

    return {
      subjects,
      people:people[0].map(row=>({id:row.id,name:row.name})),
      evidenceRecords:evidenceRecords[0].map(row=>({
        id:row.id,
        label:`${row.evidence_type} · ${row.subject_object_id}${row.subject_version? ` · ${row.subject_version}`:''}`
      })),
      requirements:requirements[0].map(row=>({
        id:row.id,subjectType:row.subject_type,subjectId:row.subject_id,
        subjectLabel:subjectLabels.get(`${row.subject_type}:${row.subject_id}`)??row.subject_id,
        competenceCode:row.competence_code,competenceName:row.competence_name,
        requiredLevel:row.required_level,evidenceRequired:Boolean(row.evidence_required),
        expiryRequired:Boolean(row.expiry_required),status:row.status
      })),
      evidence:evidence[0].map(row=>({
        id:row.id,personId:row.person_id,personName:row.person_name,
        competenceCode:row.competence_code,attainedLevel:row.attained_level,
        ...(row.evidence_record_id?{evidenceRecordId:row.evidence_record_id}:{}),
        issuedAt:row.issued_at.toISOString(),effectiveFrom:row.effective_from.toISOString(),
        ...(row.effective_to?{effectiveTo:row.effective_to.toISOString()}:{}),
        status:row.status,
        isExpired:Boolean(row.effective_to && row.effective_to.getTime()<at.getTime())
      }))
    };
  }
}
