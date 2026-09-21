import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type CompetenceEvidence,
  type CompetenceRequirement,
  type CompetenceSubjectType,
  type TenantId
} from '@nublox/kernel';
import type { Pool } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlFunctionalRepository } from './functional-repository.js';

export class CompetenceCommandError extends Error {
  constructor(message:string,readonly code:'PERMISSION_DENIED'|'INVALID_INPUT'|'NOT_FOUND'|'CONFLICT'){
    super(message); this.name='CompetenceCommandError';
  }
}
function required(value:string|undefined,label:string):string{
  const v=value?.trim()??''; if(!v) throw new CompetenceCommandError(`${label} is required.`,'INVALID_INPUT'); return v;
}
function optional(value:string|undefined):string|undefined{ const v=value?.trim()??''; return v||undefined; }
function dateValue(value:string|undefined,label:string,defaultNow=true):string{
  if(!value?.trim()&&!defaultNow) throw new CompetenceCommandError(`${label} is required.`,'INVALID_INPUT');
  const d=value?.trim()?new Date(value):new Date();
  if(Number.isNaN(d.getTime())) throw new CompetenceCommandError(`${label} is invalid.`,'INVALID_INPUT');
  return d.toISOString();
}
function optionalDate(value:string|undefined,label:string):string|undefined{
  if(!value?.trim()) return undefined; const d=new Date(value);
  if(Number.isNaN(d.getTime())) throw new CompetenceCommandError(`${label} is invalid.`,'INVALID_INPUT');
  return d.toISOString();
}
function mapError(error:unknown):never{
  if(error instanceof CompetenceCommandError) throw error;
  if(typeof error==='object'&&error!==null&&'code' in error&&(error as {code?:string}).code==='ER_DUP_ENTRY')
    throw new CompetenceCommandError('An equivalent competence record already exists.','CONFLICT');
  if(error instanceof Error){
    if(/not found|does not exist/i.test(error.message)) throw new CompetenceCommandError(error.message,'NOT_FOUND');
    if(/must|required|invalid|cannot|earlier|empty/i.test(error.message)) throw new CompetenceCommandError(error.message,'INVALID_INPUT');
  }
  throw error;
}
const SUBJECT_TYPES:ReadonlySet<CompetenceSubjectType>=new Set(['FUNCTION','SUB_FUNCTION','DEPLOYMENT']);

export class MySqlCompetenceCommandService {
  private readonly access:MySqlAccessRepository;
  private readonly functional:MySqlFunctionalRepository;
  constructor(pool:Pool){ this.access=new MySqlAccessRepository(pool); this.functional=new MySqlFunctionalRepository(pool); }

  async createRequirement(tenantId:TenantId,actorPersonId:string,input:{
    subjectType:CompetenceSubjectType; subjectId:string; competenceCode:string; competenceName:string;
    requiredLevel:string; evidenceRequired:boolean; expiryRequired:boolean;
  }):Promise<CompetenceRequirement>{
    await this.requireManage(tenantId,actorPersonId);
    if(!SUBJECT_TYPES.has(input.subjectType)) throw new CompetenceCommandError('Competence subject type is not supported by this administration surface.','INVALID_INPUT');
    const requirement:CompetenceRequirement={
      id:asId<'CompetenceRequirementId'>(`CREQ-${randomUUID()}`,'Competence Requirement'),
      tenantId,subjectType:input.subjectType,subjectId:required(input.subjectId,'Subject'),
      competenceCode:required(input.competenceCode,'Competence code').toUpperCase(),
      competenceName:required(input.competenceName,'Competence name'),
      requiredLevel:required(input.requiredLevel,'Required level'),
      evidenceRequired:input.evidenceRequired,expiryRequired:input.expiryRequired,status:'ACTIVE'
    };
    try{
      await this.functional.createCompetenceRequirement(tenantId,requirement,{actorPersonId,correlationId:'COMPETENCE-ADMIN'});
      return requirement;
    }catch(error){ return mapError(error); }
  }

  async createEvidence(tenantId:TenantId,actorPersonId:string,input:{
    personId:string; competenceCode:string; attainedLevel:string; evidenceRecordId?:string;
    issuedAt?:string; effectiveFrom?:string; effectiveTo?:string;
  }):Promise<CompetenceEvidence>{
    await this.requireManage(tenantId,actorPersonId);
    const evidenceRecordId=optional(input.evidenceRecordId);
    const effectiveTo=optionalDate(input.effectiveTo,'Effective to');
    const evidence:CompetenceEvidence={
      id:asId<'CompetenceEvidenceId'>(`CEV-${randomUUID()}`,'Competence Evidence'),
      tenantId,personId:required(input.personId,'Person') as CompetenceEvidence['personId'],
      competenceCode:required(input.competenceCode,'Competence code').toUpperCase(),
      attainedLevel:required(input.attainedLevel,'Attained level'),
      ...(evidenceRecordId?{evidenceRecordId:evidenceRecordId as NonNullable<CompetenceEvidence['evidenceRecordId']>}:{}),
      issuedAt:dateValue(input.issuedAt,'Issued at'),
      effectiveFrom:dateValue(input.effectiveFrom,'Effective from'),
      ...(effectiveTo?{effectiveTo}:{}),
      status:'ACTIVE'
    };
    try{
      await this.functional.createCompetenceEvidence(tenantId,evidence,{actorPersonId,correlationId:'COMPETENCE-ADMIN'});
      return evidence;
    }catch(error){ return mapError(error); }
  }

  private async requireManage(tenantId:TenantId,actorPersonId:string):Promise<void>{
    const evaluation=await this.access.evaluatePermission(
      tenantId,actorPersonId,PLATFORM_PERMISSION_KEYS.COMPETENCE_MANAGE,{scopeType:'TENANT'}
    );
    if(!evaluation.allowed) throw new CompetenceCommandError(evaluation.reason,'PERMISSION_DENIED');
  }
}
