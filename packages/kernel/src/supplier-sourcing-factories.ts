import { invariant } from './errors.js';
import type { Decision } from './control.js';
import type { CanonicalObjectIdentity, Organisation, Person } from './model.js';
import type {
  SourceApproval,
  SourcingContext,
  SourcingRule,
  SupplierRelationship
} from './supplier-sourcing.js';

function sameTenant(a:{tenantId:string},b:{tenantId:string},label:string){
  invariant(a.tenantId===b.tenantId,label+' must remain within one tenant.');
}
function required(value:string,label:string){
  invariant(value.trim().length>0,label+' must not be empty.');
}
function validDate(value:string,label:string){
  invariant(!Number.isNaN(Date.parse(value)),label+' must be a valid date/time.');
}

export function createSupplierRelationship(
  input:SupplierRelationship,
  object:CanonicalObjectIdentity,
  organisation:Organisation,
  creator:Person
):SupplierRelationship{
  sameTenant(input,object,'Supplier Relationship canonical object');
  sameTenant(input,organisation,'Supplier Relationship Organisation');
  sameTenant(input,creator,'Supplier Relationship creator');
  invariant(input.canonicalObjectId===object.id,'Supplier Relationship canonical object reference does not match.');
  invariant(object.objectType==='SUPPLIER_RELATIONSHIP','Supplier Relationship canonical object type is invalid.');
  invariant(input.supplierOrganisationId===organisation.id,'Supplier Relationship Organisation reference does not match.');
  invariant(input.createdByPersonId===creator.id,'Supplier Relationship creator reference does not match.');
  required(input.code,'Supplier Relationship code');
  required(input.name,'Supplier Relationship name');
  validDate(input.createdAt,'Supplier Relationship createdAt');
  invariant(input.status==='IN_WORK','New Supplier Relationship must start IN_WORK.');
  invariant(!input.releasedDecisionId&&!input.releasedAt&&!input.cancelledDecisionId&&!input.cancelledAt,'New Supplier Relationship cannot contain release/cancellation evidence.');
  return Object.freeze({...input});
}

export function releaseSupplierRelationship(
  current:SupplierRelationship,
  decision:Decision,
  releasedAt:string
):SupplierRelationship{
  sameTenant(current,decision,'Supplier Relationship release Decision');
  invariant(current.status==='IN_WORK','Only an IN_WORK Supplier Relationship can be released.');
  invariant(decision.outcome==='APPROVED','Supplier Relationship release requires an APPROVED Decision.');
  invariant(decision.subjectObjectId===current.canonicalObjectId,'Supplier Relationship release Decision must govern the supplier Organisation.');
  validDate(releasedAt,'Supplier Relationship releasedAt');
  invariant(Date.parse(decision.decidedAt)>=Date.parse(current.createdAt),'Supplier Relationship release Decision cannot predate relationship creation.');
  invariant(Date.parse(releasedAt)>=Date.parse(decision.decidedAt),'Supplier Relationship release cannot predate Decision.');
  return Object.freeze({...current,status:'RELEASED',releasedDecisionId:decision.id,releasedAt});
}

export function cancelSupplierRelationship(
  current:SupplierRelationship,
  decision:Decision,
  cancelledAt:string
):SupplierRelationship{
  sameTenant(current,decision,'Supplier Relationship cancellation Decision');
  invariant(current.status!=='CANCELLED','Supplier Relationship is already cancelled.');
  invariant(decision.outcome==='APPROVED','Supplier Relationship cancellation requires an APPROVED Decision.');
  invariant(decision.subjectObjectId===current.canonicalObjectId,'Supplier Relationship cancellation Decision must govern the supplier Organisation.');
  validDate(cancelledAt,'Supplier Relationship cancelledAt');
  invariant(Date.parse(cancelledAt)>=Date.parse(decision.decidedAt),'Supplier Relationship cancellation cannot predate Decision.');
  return Object.freeze({...current,status:'CANCELLED',cancelledDecisionId:decision.id,cancelledAt});
}

export function createSourcingContext(
  input:SourcingContext,
  creator:Person,
  scope?:CanonicalObjectIdentity
):SourcingContext{
  sameTenant(input,creator,'Sourcing Context creator');
  invariant(input.createdByPersonId===creator.id,'Sourcing Context creator reference does not match.');
  if(input.scopeObjectId){
    invariant(scope!==undefined,'Scoped Sourcing Context requires scope object.');
    sameTenant(input,scope!,'Sourcing Context scope');
    invariant(input.scopeObjectId===scope!.id,'Sourcing Context scope reference does not match.');
  }
  required(input.code,'Sourcing Context code');
  required(input.name,'Sourcing Context name');
  required(input.scopeType,'Sourcing Context scope type');
  validDate(input.createdAt,'Sourcing Context createdAt');
  return Object.freeze({...input,criteria:Object.freeze({...input.criteria})});
}

export function createSourceApproval(
  input:SourceApproval,
  context:SourcingContext,
  supplier:SupplierRelationship,
  internalItem:CanonicalObjectIdentity,
  supplierItem:CanonicalObjectIdentity,
  decision:Decision,
  approver:Person
):SourceApproval{
  for(const related of [context,supplier,internalItem,supplierItem,decision,approver])sameTenant(input,related,'Source Approval');
  invariant(context.status==='ACTIVE','Source Approval requires an ACTIVE Sourcing Context.');
  invariant(supplier.status==='RELEASED','Source Approval requires a RELEASED Supplier Relationship.');
  invariant(input.sourcingContextId===context.id,'Source Approval Sourcing Context reference does not match.');
  invariant(input.supplierRelationshipId===supplier.id,'Source Approval Supplier Relationship reference does not match.');
  invariant(input.internalItemObjectId===internalItem.id,'Source Approval internal item reference does not match.');
  invariant(input.supplierItemObjectId===supplierItem.id,'Source Approval supplier item reference does not match.');
  invariant(input.internalItemObjectId!==input.supplierItemObjectId,'Internal and supplier item identities must differ.');
  invariant(input.approvalDecisionId===decision.id,'Source Approval Decision reference does not match.');
  invariant(input.approvedByPersonId===approver.id,'Source Approval approver reference does not match.');
  invariant(decision.outcome==='APPROVED','Source Approval requires an APPROVED Decision.');
  invariant(decision.subjectObjectId===input.internalItemObjectId,'Source Approval Decision must govern the internal item.');
  required(input.decisionFingerprint,'Source Approval decision fingerprint');
  invariant(decision.subjectVersion===input.decisionFingerprint,'Source Approval Decision must cite the exact supplier-item/context/status/effectivity fingerprint.');
  invariant(Boolean(supplier.releasedAt),'Released Supplier Relationship requires release evidence.');
  invariant(Date.parse(decision.decidedAt)>=Date.parse(supplier.releasedAt!),'Source Approval Decision cannot predate Supplier Relationship release.');
  invariant(Date.parse(decision.decidedAt)>=Date.parse(context.createdAt),'Source Approval Decision cannot predate Sourcing Context creation.');
  required(input.rationale,'Source Approval rationale');
  validDate(input.effectiveFrom,'Source Approval effectiveFrom');
  validDate(input.approvedAt,'Source Approval approvedAt');
  invariant(Date.parse(input.approvedAt)>=Date.parse(decision.decidedAt),'Source Approval cannot predate its Decision.');
  if(input.effectiveTo){
    validDate(input.effectiveTo,'Source Approval effectiveTo');
    invariant(Date.parse(input.effectiveTo)>Date.parse(input.effectiveFrom),'Source Approval effectiveTo must follow effectiveFrom.');
  }
  return Object.freeze({...input});
}

export function createSourcingRule(
  input:SourcingRule,
  creator:Person,
  context?:SourcingContext,
  supplier?:SupplierRelationship
):SourcingRule{
  sameTenant(input,creator,'Sourcing Rule creator');
  invariant(input.createdByPersonId===creator.id,'Sourcing Rule creator reference does not match.');
  if(input.sourcingContextId){
    invariant(context!==undefined,'Scoped Sourcing Rule requires Sourcing Context.');
    sameTenant(input,context!,'Sourcing Rule Context');
    invariant(context!.id===input.sourcingContextId,'Sourcing Rule Context reference does not match.');
    invariant(context!.status==='ACTIVE','Sourcing Rule requires an ACTIVE Sourcing Context.');
  }
  if(input.supplierRelationshipId){
    invariant(supplier!==undefined,'Supplier-scoped Sourcing Rule requires Supplier Relationship.');
    sameTenant(input,supplier!,'Sourcing Rule Supplier');
    invariant(supplier!.id===input.supplierRelationshipId,'Sourcing Rule Supplier reference does not match.');
    invariant(supplier!.status==='RELEASED','Supplier-scoped Sourcing Rule requires a RELEASED Supplier Relationship.');
  }
  required(input.code,'Sourcing Rule code');
  required(input.name,'Sourcing Rule name');
  invariant(Number.isInteger(input.priority)&&input.priority>0,'Sourcing Rule priority must be positive.');
  validDate(input.createdAt,'Sourcing Rule createdAt');
  return Object.freeze({...input,criteria:Object.freeze({...input.criteria})});
}

export function isSourceApprovalEffective(
  approval:SourceApproval,
  at:string
):boolean{
  validDate(at,'Source Approval evaluation date');
  const point=Date.parse(at);
  return !approval.supersededBySourceApprovalId
    && point>=Date.parse(approval.effectiveFrom)
    && (!approval.effectiveTo||point<Date.parse(approval.effectiveTo));
}
