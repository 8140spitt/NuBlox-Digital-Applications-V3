import { invariant } from './errors.js';
import type {
  Employment,
  PositionFunctionAssignment,
  PositionReportingLine
} from './hcm.js';
import type {
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
