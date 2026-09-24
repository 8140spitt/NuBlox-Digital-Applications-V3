import { createHash, randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type SourceApprovalStatus,
  type SourcingRuleStatus,
  type SupplierRelationshipType,
  type TenantId
} from '@nublox/kernel';
import type { Pool } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlSupplierSourcingRepository } from './supplier-sourcing-repository.js';

export class SupplierSourcingCommandError extends Error {
  constructor(
    message:string,
    readonly code:'PERMISSION_DENIED'|'INVALID_INPUT'|'NOT_FOUND'|'CONFLICT'
  ){
    super(message);
    this.name='SupplierSourcingCommandError';
  }
}

function required(value:string|undefined,label:string){
  const v=value?.trim()??'';
  if(!v)throw new SupplierSourcingCommandError(label+' is required.','INVALID_INPUT');
  return v;
}
function optional(value:string|undefined){
  const v=value?.trim()??'';
  return v||undefined;
}
function at(value?:string){
  const d=new Date(value??new Date().toISOString());
  if(Number.isNaN(d.getTime()))throw new SupplierSourcingCommandError('Date/time is invalid.','INVALID_INPUT');
  return d.toISOString();
}
function positiveInt(value:number,label:string){
  if(!Number.isInteger(value)||value<1){
    throw new SupplierSourcingCommandError(label+' must be a positive integer.','INVALID_INPUT');
  }
  return value;
}

function sourceApprovalFingerprint(input:{
  sourcingContextId:string;
  supplierRelationshipId:string;
  supplierItemObjectId:string;
  sourceStatus:string;
  effectiveFrom:string;
  effectiveTo?:string;
}){
  const canonical=JSON.stringify({
    sourcingContextId:input.sourcingContextId,
    supplierRelationshipId:input.supplierRelationshipId,
    supplierItemObjectId:input.supplierItemObjectId,
    sourceStatus:input.sourceStatus,
    effectiveFrom:input.effectiveFrom,
    effectiveTo:input.effectiveTo??null
  });
  return 'sha256:'+createHash('sha256').update(canonical).digest('hex');
}

function mapError(error:unknown):never{
  if(error instanceof SupplierSourcingCommandError)throw error;
  if(typeof error==='object'&&error!==null&&'code' in error&&(error as {code?:string}).code==='ER_DUP_ENTRY'){
    throw new SupplierSourcingCommandError('Equivalent sourcing relationship or current source approval already exists.','CONFLICT');
  }
  if(error instanceof Error){
    if(/not found/i.test(error.message))throw new SupplierSourcingCommandError(error.message,'NOT_FOUND');
    if(/must|required|invalid|only|requires|belong|match|cannot|active|released|differ|predate|effective/i.test(error.message)){
      throw new SupplierSourcingCommandError(error.message,'INVALID_INPUT');
    }
  }
  throw error;
}

export class MySqlSupplierSourcingCommandService {
  private readonly access:MySqlAccessRepository;
  private readonly repo:MySqlSupplierSourcingRepository;

  constructor(pool:Pool){
    this.access=new MySqlAccessRepository(pool);
    this.repo=new MySqlSupplierSourcingRepository(pool);
  }

  async createSupplierRelationship(
    tenantId:TenantId,
    actor:string,
    input:{
      supplierOrganisationId:string;
      relationshipType:SupplierRelationshipType;
      code:string;
      name:string;
      createdAt?:string;
    }
  ){
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.SUPPLIER_SOURCING_MANAGE);
    const code=required(input.code,'Code').toUpperCase();
    const createdAt=at(input.createdAt);
    const object={
      id:asId<'CanonicalObjectId'>('SUPREL-OBJ-'+randomUUID(),'Canonical Object'),
      tenantId,
      objectType:'SUPPLIER_RELATIONSHIP',
      stableKey:'SUPPLIER_RELATIONSHIP:'+code,
      createdAt
    };
    const relationship={
      id:asId<'SupplierRelationshipId'>('SUPREL-'+randomUUID(),'Supplier Relationship'),
      tenantId,
      canonicalObjectId:object.id,
      supplierOrganisationId:asId<'OrganisationId'>(required(input.supplierOrganisationId,'Supplier Organisation'),'Supplier Organisation'),
      relationshipType:input.relationshipType,
      code,
      name:required(input.name,'Name'),
      status:'IN_WORK' as const,
      createdByPersonId:asId<'PersonId'>(actor,'Creator'),
      createdAt
    };
    try{
      await this.repo.createSupplierRelationship(object,relationship,this.audit(actor));
      return relationship;
    }catch(error){
      return mapError(error);
    }
  }

  async releaseSupplierRelationship(
    tenantId:TenantId,
    actor:string,
    input:{supplierRelationshipId:string;decisionId:string;releasedAt?:string}
  ){
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.SUPPLIER_SOURCING_MANAGE);
    try{
      return await this.repo.releaseSupplierRelationship(
        tenantId,
        asId<'SupplierRelationshipId'>(required(input.supplierRelationshipId,'Supplier Relationship'),'Supplier Relationship'),
        asId<'DecisionId'>(required(input.decisionId,'Decision'),'Decision'),
        at(input.releasedAt),
        this.audit(actor)
      );
    }catch(error){
      return mapError(error);
    }
  }

  async cancelSupplierRelationship(
    tenantId:TenantId,
    actor:string,
    input:{supplierRelationshipId:string;decisionId:string;cancelledAt?:string}
  ){
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.SUPPLIER_SOURCING_MANAGE);
    try{
      return await this.repo.cancelSupplierRelationship(
        tenantId,
        asId<'SupplierRelationshipId'>(required(input.supplierRelationshipId,'Supplier Relationship'),'Supplier Relationship'),
        asId<'DecisionId'>(required(input.decisionId,'Decision'),'Decision'),
        at(input.cancelledAt),
        this.audit(actor)
      );
    }catch(error){
      return mapError(error);
    }
  }

  async createSourcingContext(
    tenantId:TenantId,
    actor:string,
    input:{
      code:string;
      name:string;
      description?:string;
      scopeType:string;
      scopeObjectId?:string;
      criteria:Readonly<Record<string,unknown>>;
      createdAt?:string;
    }
  ){
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.SUPPLIER_SOURCING_MANAGE);
    const description=optional(input.description);
    const scopeObjectId=optional(input.scopeObjectId);
    const context={
      id:asId<'SourcingContextId'>('SOURCE-CTX-'+randomUUID(),'Sourcing Context'),
      tenantId,
      code:required(input.code,'Code').toUpperCase(),
      name:required(input.name,'Name'),
      ...(description?{description}:{}),
      scopeType:required(input.scopeType,'Scope type'),
      ...(scopeObjectId?{scopeObjectId:asId<'CanonicalObjectId'>(scopeObjectId,'Scope object')}:{}),
      criteria:input.criteria,
      status:'ACTIVE' as const,
      createdByPersonId:asId<'PersonId'>(actor,'Creator'),
      createdAt:at(input.createdAt)
    };
    try{
      await this.repo.createSourcingContext(context,this.audit(actor));
      return context;
    }catch(error){
      return mapError(error);
    }
  }

  async createSourceApproval(
    tenantId:TenantId,
    actor:string,
    input:{
      sourcingContextId:string;
      supplierRelationshipId:string;
      internalItemObjectId:string;
      supplierItemObjectId:string;
      sourceStatus:SourceApprovalStatus;
      rationale:string;
      effectiveFrom:string;
      effectiveTo?:string;
      decisionId:string;
      approvedAt?:string;
    }
  ){
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.SUPPLIER_SOURCING_APPROVE);
    const effectiveFrom=at(input.effectiveFrom);
    const effectiveTo=optional(input.effectiveTo);
    const decisionFingerprint=sourceApprovalFingerprint({
      sourcingContextId:required(input.sourcingContextId,'Sourcing Context'),
      supplierRelationshipId:required(input.supplierRelationshipId,'Supplier Relationship'),
      supplierItemObjectId:required(input.supplierItemObjectId,'Supplier item'),
      sourceStatus:input.sourceStatus,
      effectiveFrom,
      ...(effectiveTo?{effectiveTo:at(effectiveTo)}:{})
    });
    const approval={
      id:asId<'SourceApprovalId'>('SOURCE-APP-'+randomUUID(),'Source Approval'),
      tenantId,
      sourcingContextId:asId<'SourcingContextId'>(required(input.sourcingContextId,'Sourcing Context'),'Sourcing Context'),
      supplierRelationshipId:asId<'SupplierRelationshipId'>(required(input.supplierRelationshipId,'Supplier Relationship'),'Supplier Relationship'),
      internalItemObjectId:asId<'CanonicalObjectId'>(required(input.internalItemObjectId,'Internal item'),'Internal item'),
      supplierItemObjectId:asId<'CanonicalObjectId'>(required(input.supplierItemObjectId,'Supplier item'),'Supplier item'),
      sourceStatus:input.sourceStatus,
      rationale:required(input.rationale,'Rationale'),
      effectiveFrom,
      ...(effectiveTo?{effectiveTo:at(effectiveTo)}:{}),
      approvalDecisionId:asId<'DecisionId'>(required(input.decisionId,'Decision'),'Decision'),
      decisionFingerprint,
      approvedByPersonId:asId<'PersonId'>(actor,'Approver'),
      approvedAt:at(input.approvedAt)
    };
    try{
      await this.repo.createSourceApproval(approval,this.audit(actor));
      return{
        ...approval,
        decisionSubjectVersion:decisionFingerprint
      };
    }catch(error){
      return mapError(error);
    }
  }

  getSourceApprovalDecisionVersion(input:{
    sourcingContextId:string;
    supplierRelationshipId:string;
    supplierItemObjectId:string;
    sourceStatus:SourceApprovalStatus;
    effectiveFrom:string;
    effectiveTo?:string;
  }){
    const effectiveTo=optional(input.effectiveTo);
    return sourceApprovalFingerprint({
      sourcingContextId:required(input.sourcingContextId,'Sourcing Context'),
      supplierRelationshipId:required(input.supplierRelationshipId,'Supplier Relationship'),
      supplierItemObjectId:required(input.supplierItemObjectId,'Supplier item'),
      sourceStatus:input.sourceStatus,
      effectiveFrom:at(input.effectiveFrom),
      ...(effectiveTo?{effectiveTo:at(effectiveTo)}:{})
    });
  }

  async createSourcingRule(
    tenantId:TenantId,
    actor:string,
    input:{
      code:string;
      name:string;
      sourcingContextId?:string;
      supplierRelationshipId?:string;
      itemObjectType?:string;
      criteria:Readonly<Record<string,unknown>>;
      assignedStatus:SourceApprovalStatus;
      priority:number;
      status:SourcingRuleStatus;
      createdAt?:string;
    }
  ){
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.SUPPLIER_SOURCING_RULE_MANAGE);
    const contextId=optional(input.sourcingContextId);
    const supplierId=optional(input.supplierRelationshipId);
    const itemObjectType=optional(input.itemObjectType);
    const rule={
      id:asId<'SourcingRuleId'>('SOURCE-RULE-'+randomUUID(),'Sourcing Rule'),
      tenantId,
      code:required(input.code,'Code').toUpperCase(),
      name:required(input.name,'Name'),
      ...(contextId?{sourcingContextId:asId<'SourcingContextId'>(contextId,'Sourcing Context')}:{}),
      ...(supplierId?{supplierRelationshipId:asId<'SupplierRelationshipId'>(supplierId,'Supplier Relationship')}:{}),
      ...(itemObjectType?{itemObjectType}:{}),
      criteria:input.criteria,
      assignedStatus:input.assignedStatus,
      priority:positiveInt(input.priority,'Priority'),
      status:input.status,
      createdByPersonId:asId<'PersonId'>(actor,'Creator'),
      createdAt:at(input.createdAt)
    };
    try{
      await this.repo.createSourcingRule(rule,this.audit(actor));
      return rule;
    }catch(error){
      return mapError(error);
    }
  }

  async setSourcingRuleStatus(
    tenantId:TenantId,
    actor:string,
    input:{ruleId:string;status:SourcingRuleStatus}
  ){
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.SUPPLIER_SOURCING_RULE_MANAGE);
    try{
      return await this.repo.setSourcingRuleStatus(
        tenantId,
        asId<'SourcingRuleId'>(required(input.ruleId,'Sourcing Rule'),'Sourcing Rule'),
        input.status,
        this.audit(actor)
      );
    }catch(error){
      return mapError(error);
    }
  }

  private audit(actor:string){
    return{actorPersonId:actor,correlationId:'SUPPLIER-SOURCING'};
  }

  private async require(tenantId:TenantId,actor:string,key:string){
    const evaluation=await this.access.evaluatePermission(tenantId,actor,key,{scopeType:'TENANT'});
    if(!evaluation.allowed){
      throw new SupplierSourcingCommandError(evaluation.reason,'PERMISSION_DENIED');
    }
  }
}
