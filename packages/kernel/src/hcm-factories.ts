import { invariant } from './errors.js';
import type {
  CareerLevel,
  Employment,
  Grade,
  JobFamily,
  JobProfileArchitectureAssignment,
  JobSubfamily,
  PositionFunctionAssignment,
  PositionReportingLine
} from './hcm.js';
import type {
  JobProfile,
  Organisation,
  Person,
  Position
} from './model.js';

function sameTenant(expected:string,actual:string,label:string) {
  invariant(expected===actual,`${label} must belong to the same tenant.`);
}

function validPeriod(from:string,to:string|undefined,label:string) {
  invariant(Number.isFinite(Date.parse(from)),`${label} start date must be valid.`);
  if(to) {
    invariant(Number.isFinite(Date.parse(to)),`${label} end date must be valid.`);
    invariant(Date.parse(to)>=Date.parse(from),`${label} end date must not precede the start date.`);
  }
}


export function createJobFamily(input:JobFamily):JobFamily {
  invariant(Boolean(input.code.trim()),'Job Family code must not be empty.');
  invariant(Boolean(input.name.trim()),'Job Family name must not be empty.');
  return Object.freeze({...input});
}

export function createJobSubfamily(input:JobSubfamily,family:JobFamily):JobSubfamily {
  sameTenant(input.tenantId,family.tenantId,'Job Sub-family and Job Family');
  invariant(input.familyId===family.id,'Job Sub-family must reference the supplied Job Family.');
  invariant(Boolean(input.code.trim()),'Job Sub-family code must not be empty.');
  invariant(Boolean(input.name.trim()),'Job Sub-family name must not be empty.');
  return Object.freeze({...input});
}

export function createCareerLevel(input:CareerLevel):CareerLevel {
  invariant(Boolean(input.code.trim()),'Career Level code must not be empty.');
  invariant(Boolean(input.name.trim()),'Career Level name must not be empty.');
  invariant(Number.isInteger(input.sequence)&&input.sequence>=0,'Career Level sequence must be a non-negative integer.');
  return Object.freeze({...input});
}

export function createGrade(input:Grade):Grade {
  invariant(Boolean(input.code.trim()),'Grade code must not be empty.');
  invariant(Boolean(input.name.trim()),'Grade name must not be empty.');
  invariant(Number.isInteger(input.sequence)&&input.sequence>=0,'Grade sequence must be a non-negative integer.');
  return Object.freeze({...input});
}

export function createJobProfileArchitectureAssignment(
  input:JobProfileArchitectureAssignment,
  jobProfile:JobProfile,
  family:JobFamily,
  subfamily?:JobSubfamily,
  careerLevel?:CareerLevel,
  grade?:Grade
):JobProfileArchitectureAssignment {
  if(jobProfile.catalogueScope==='TENANT'){
    invariant(Boolean(jobProfile.tenantId),'Tenant Job Profile must specify tenantId.');
    sameTenant(input.tenantId,jobProfile.tenantId!,'Job Profile Architecture and Job Profile');
  }
  sameTenant(input.tenantId,family.tenantId,'Job Profile Architecture and Job Family');
  invariant(input.jobProfileId===jobProfile.id,'Job Profile Architecture must reference the supplied Job Profile.');
  invariant(input.familyId===family.id,'Job Profile Architecture must reference the supplied Job Family.');
  if(subfamily){
    sameTenant(input.tenantId,subfamily.tenantId,'Job Profile Architecture and Job Sub-family');
    invariant(input.subfamilyId===subfamily.id,'Job Profile Architecture must reference the supplied Job Sub-family.');
    invariant(subfamily.familyId===family.id,'Job Sub-family must belong to the selected Job Family.');
  } else invariant(!input.subfamilyId,'Job Profile Architecture cannot reference an unsupplied Job Sub-family.');
  if(careerLevel){
    sameTenant(input.tenantId,careerLevel.tenantId,'Job Profile Architecture and Career Level');
    invariant(input.careerLevelId===careerLevel.id,'Job Profile Architecture must reference the supplied Career Level.');
  } else invariant(!input.careerLevelId,'Job Profile Architecture cannot reference an unsupplied Career Level.');
  if(grade){
    sameTenant(input.tenantId,grade.tenantId,'Job Profile Architecture and Grade');
    invariant(input.gradeId===grade.id,'Job Profile Architecture must reference the supplied Grade.');
  } else invariant(!input.gradeId,'Job Profile Architecture cannot reference an unsupplied Grade.');
  validPeriod(input.effectiveFrom,input.effectiveTo,'Job Profile Architecture');
  return Object.freeze({...input});
}

export function createEmployment(
  input:Employment,
  person:Person,
  organisation:Organisation
):Employment {
  sameTenant(input.tenantId,person.tenantId,'Employment and Person');
  sameTenant(input.tenantId,organisation.tenantId,'Employment and Organisation');
  invariant(input.personId===person.id,'Employment must reference the supplied Person.');
  invariant(input.organisationId===organisation.id,'Employment must reference the supplied Organisation.');
  invariant(Boolean(input.employeeNumber.trim()),'Employment employeeNumber must not be empty.');
  invariant(Boolean(input.assignmentId.trim()),'Employment assignmentId must not be empty.');
  invariant(!input.isPrimary||input.relationshipType==='PRIMARY_EMPLOYMENT','Only PRIMARY_EMPLOYMENT may be the primary work relationship.');
  invariant(input.workerType!=='CONTINGENT'||input.relationshipType==='CONTINGENT_ENGAGEMENT','Contingent workers require a CONTINGENT_ENGAGEMENT work relationship.');
  invariant(input.workerType!=='EMPLOYEE'||input.relationshipType!=='CONTINGENT_ENGAGEMENT','Employees cannot use a CONTINGENT_ENGAGEMENT work relationship.');
  validPeriod(input.startDate,input.endDate,'Employment');
  if(input.status==='ENDED') invariant(Boolean(input.endDate),'Ended Employment must specify an end date.');
  return Object.freeze({...input});
}

export function createPositionFunctionAssignment(
  input:PositionFunctionAssignment,
  position:Position
):PositionFunctionAssignment {
  sameTenant(input.tenantId,position.tenantId,'Position Function Assignment and Position');
  invariant(input.positionId===position.id,'Position Function Assignment must reference the supplied Position.');
  validPeriod(input.effectiveFrom,input.effectiveTo,'Position Function Assignment');
  return Object.freeze({...input});
}

export function createPositionReportingLine(
  input:PositionReportingLine,
  subordinate:Position,
  manager:Position
):PositionReportingLine {
  sameTenant(input.tenantId,subordinate.tenantId,'Reporting Line and subordinate Position');
  sameTenant(input.tenantId,manager.tenantId,'Reporting Line and manager Position');
  invariant(input.subordinatePositionId===subordinate.id,'Reporting Line subordinate Position does not match.');
  invariant(input.managerPositionId===manager.id,'Reporting Line manager Position does not match.');
  invariant(subordinate.id!==manager.id,'A Position cannot report to itself.');
  validPeriod(input.effectiveFrom,input.effectiveTo,'Position Reporting Line');
  return Object.freeze({...input});
}
