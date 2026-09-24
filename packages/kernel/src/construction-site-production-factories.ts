import type { CanonicalObjectIdentity, Person } from './model.js';
import type {
  SiteDailyLog,
  SiteFieldEvidence,
  SiteIssue,
  SiteProgressRecord,
  SiteWorkPackage
} from './construction-site-production.js';

function validDate(value:string,label:string) {
  if (Number.isNaN(Date.parse(value))) throw new Error(`${label} must be a valid date/time.`);
}
function sameTenant(expected:string, actual:string, label:string) {
  if (expected !== actual) throw new Error(`${label} must belong to the same tenant.`);
}

export function createSiteWorkPackage(
  input:SiteWorkPackage,
  object:CanonicalObjectIdentity,
  projectObject:CanonicalObjectIdentity,
  manager:Person
):SiteWorkPackage {
  sameTenant(input.tenantId,object.tenantId,'Work Package and canonical object');
  sameTenant(input.tenantId,projectObject.tenantId,'Work Package and Project');
  sameTenant(input.tenantId,manager.tenantId,'Work Package and manager');
  if (input.canonicalObjectId !== object.id || object.objectType !== 'WORK_PACKAGE') {
    throw new Error('Work Package requires its WORK_PACKAGE canonical object.');
  }
  if (input.projectObjectId !== projectObject.id || projectObject.objectType !== 'PROJECT') {
    throw new Error('Work Package requires a Project canonical object.');
  }
  if (!input.code.trim() || !input.title.trim()) throw new Error('Work Package code and title are required.');
  if (input.plannedStart) validDate(input.plannedStart,'Planned start');
  if (input.plannedEnd) validDate(input.plannedEnd,'Planned end');
  if (input.plannedStart && input.plannedEnd && Date.parse(input.plannedEnd) < Date.parse(input.plannedStart)) {
    throw new Error('Planned end must not precede planned start.');
  }
  validDate(input.createdAt,'Created at');
  return Object.freeze({...input});
}

export function createSiteDailyLog(
  input:SiteDailyLog,
  workPackage:SiteWorkPackage,
  creator:Person
):SiteDailyLog {
  sameTenant(input.tenantId,workPackage.tenantId,'Daily Log and Work Package');
  sameTenant(input.tenantId,creator.tenantId,'Daily Log and creator');
  if (input.workPackageId !== workPackage.id || ['COMPLETE','CANCELLED'].includes(workPackage.status)) {
    throw new Error('Daily Log requires an open Work Package.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.logDate)) throw new Error('Daily Log date must be YYYY-MM-DD.');
  if (!input.summary.trim()) throw new Error('Daily Log summary is required.');
  if (input.labourCount !== undefined && (!Number.isInteger(input.labourCount) || input.labourCount < 0)) {
    throw new Error('Labour count must be a non-negative whole number.');
  }
  validDate(input.createdAt,'Created at');
  return Object.freeze({...input});
}

export function createSiteProgressRecord(
  input:SiteProgressRecord,
  workPackage:SiteWorkPackage,
  recorder:Person
):SiteProgressRecord {
  sameTenant(input.tenantId,workPackage.tenantId,'Progress Record and Work Package');
  sameTenant(input.tenantId,recorder.tenantId,'Progress Record and recorder');
  if (input.workPackageId !== workPackage.id || ['COMPLETE','CANCELLED'].includes(workPackage.status)) {
    throw new Error('Progress Record requires an open Work Package.');
  }
  if (!Number.isFinite(input.percentComplete) || input.percentComplete < 0 || input.percentComplete > 100) {
    throw new Error('Percent complete must be between 0 and 100.');
  }
  if (input.quantityCompleted !== undefined && (!Number.isFinite(input.quantityCompleted) || input.quantityCompleted < 0)) {
    throw new Error('Quantity completed must be non-negative.');
  }
  validDate(input.occurredAt,'Progress occurred at');
  return Object.freeze({...input});
}

export function createSiteFieldEvidence(
  input:SiteFieldEvidence,
  workPackage:SiteWorkPackage,
  recorder:Person
):SiteFieldEvidence {
  sameTenant(input.tenantId,workPackage.tenantId,'Field Evidence and Work Package');
  sameTenant(input.tenantId,recorder.tenantId,'Field Evidence and recorder');
  if (input.workPackageId !== workPackage.id || workPackage.status === 'CANCELLED') {
    throw new Error('Field Evidence requires a non-cancelled Work Package.');
  }
  if (!input.reference.trim()) throw new Error('Field Evidence reference is required.');
  validDate(input.occurredAt,'Evidence occurred at');
  return Object.freeze({...input});
}

export function createSiteIssue(
  input:SiteIssue,
  workPackage:SiteWorkPackage,
  raiser:Person,
  assignee?:Person
):SiteIssue {
  sameTenant(input.tenantId,workPackage.tenantId,'Site Issue and Work Package');
  sameTenant(input.tenantId,raiser.tenantId,'Site Issue and raiser');
  if (assignee) sameTenant(input.tenantId,assignee.tenantId,'Site Issue and assignee');
  if (input.workPackageId !== workPackage.id || workPackage.status === 'CANCELLED') {
    throw new Error('Site Issue requires a non-cancelled Work Package.');
  }
  if (!input.title.trim() || !input.description.trim()) throw new Error('Site Issue title and description are required.');
  validDate(input.raisedAt,'Raised at');
  if (input.dueAt) validDate(input.dueAt,'Due at');
  return Object.freeze({...input});
}

export function resolveSiteIssue(input:SiteIssue,resolvedAt:string):SiteIssue {
  if (!['OPEN','IN_PROGRESS'].includes(input.status)) throw new Error('Only an open Site Issue can be resolved.');
  validDate(resolvedAt,'Resolved at');
  if (Date.parse(resolvedAt) < Date.parse(input.raisedAt)) throw new Error('Resolved at cannot predate issue creation.');
  return Object.freeze({...input,status:'RESOLVED' as const,resolvedAt});
}

export function completeSiteWorkPackage(
  input:SiteWorkPackage,
  completedAt:string,
  progress:ReadonlyArray<SiteProgressRecord>,
  issues:ReadonlyArray<SiteIssue>,
  evidence:ReadonlyArray<SiteFieldEvidence>
):SiteWorkPackage {
  if (!['PLANNED','ACTIVE','ON_HOLD'].includes(input.status)) throw new Error('Work Package cannot be completed from its current state.');
  validDate(completedAt,'Completed at');
  const latestProgress=[...progress].sort((a,b)=>Date.parse(b.occurredAt)-Date.parse(a.occurredAt))[0];
  if (!latestProgress || latestProgress.percentComplete < 100) throw new Error('Work Package completion requires 100 percent recorded progress.');
  if (issues.some((issue)=>issue.status==='OPEN'||issue.status==='IN_PROGRESS')) throw new Error('Work Package completion requires all Site Issues to be resolved or closed.');
  if (evidence.length===0) throw new Error('Work Package completion requires field evidence.');
  return Object.freeze({...input,status:'COMPLETE' as const,completedAt});
}
