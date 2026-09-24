import { invariant } from './errors.js';
import type {
  OrganisationalContext,
  OrganisationalResourceFulfilment,
  OrganisationalResourceRequirement
} from './organisational-context.js';

function nonEmpty(value: string, label: string) {
  invariant(Boolean(value.trim()), `${label} must not be empty.`);
}

function sameTenant(left: string, right: string, label: string) {
  invariant(left === right, `${label} must belong to the same tenant.`);
}

function validDate(value: string, label: string) {
  invariant(Number.isFinite(Date.parse(value)), `${label} must be a valid date/time.`);
}

function validPeriod(from: string, to: string | undefined, label: string) {
  validDate(from, `${label} effectiveFrom`);
  if (to) {
    validDate(to, `${label} effectiveTo`);
    invariant(Date.parse(to) >= Date.parse(from), `${label} effectiveTo must not precede effectiveFrom.`);
  }
}

export function createOrganisationalContext(
  input: OrganisationalContext,
  parent?: OrganisationalContext
): OrganisationalContext {
  nonEmpty(input.code, 'Organisational Context code');
  nonEmpty(input.name, 'Organisational Context name');
  validPeriod(input.effectiveFrom, input.effectiveTo, 'Organisational Context');

  if (input.contextType === 'FUNCTION') {
    invariant(input.lifecycle === 'PERMANENT', 'Function organisational contexts must be PERMANENT.');
    invariant(Boolean(input.functionId), 'Function organisational contexts require a Function.');
    invariant(Boolean(input.organisationUnitId), 'Function organisational contexts require an Organisation Unit.');
    invariant(!input.canonicalObjectId, 'Function organisational contexts do not use a delivery canonical object.');
  } else {
    invariant(!input.functionId, 'Delivery organisational contexts must not claim Function ownership.');
    invariant(Boolean(input.canonicalObjectId), 'Delivery organisational contexts require a canonical object.');
  }

  if (input.contextType === 'PROJECT') {
    invariant(input.lifecycle === 'TEMPORARY', 'Project organisational contexts must be TEMPORARY.');
  }

  if (parent) {
    sameTenant(input.tenantId, parent.tenantId, 'Child and parent Organisational Context');
    invariant(input.parentContextId === parent.id, 'Organisational Context parent reference must match the supplied parent.');
  } else {
    invariant(!input.parentContextId, 'Organisational Context cannot reference an unsupplied parent.');
  }

  return Object.freeze({ ...input });
}

export function createOrganisationalResourceRequirement(
  input: OrganisationalResourceRequirement,
  requestingContext: OrganisationalContext,
  supplyingFunctionContext: OrganisationalContext
): OrganisationalResourceRequirement {
  sameTenant(input.tenantId, requestingContext.tenantId, 'Resource Requirement and requesting context');
  sameTenant(input.tenantId, supplyingFunctionContext.tenantId, 'Resource Requirement and supplying Function');
  invariant(input.requestingContextId === requestingContext.id, 'Resource Requirement must reference the supplied requesting context.');
  invariant(input.supplyingFunctionContextId === supplyingFunctionContext.id, 'Resource Requirement must reference the supplied supplying Function.');
  invariant(requestingContext.contextType !== 'FUNCTION', 'A Function cannot request project-delivery resource from itself through this flow.');
  invariant(supplyingFunctionContext.contextType === 'FUNCTION', 'Resource supply must come from a Function organisational context.');
  invariant(requestingContext.status === 'ACTIVE' && supplyingFunctionContext.status === 'ACTIVE', 'Resource Requirement contexts must be ACTIVE.');
  invariant(input.status === 'OPEN', 'New Resource Requirements must start OPEN.');
  invariant(Number.isInteger(input.requiredHeadcount) && input.requiredHeadcount >= 1, 'Required headcount must be a positive whole number.');
  invariant(input.requiredCapacityPercent > 0 && input.requiredCapacityPercent <= 100, 'Required capacity must be greater than 0 and no more than 100 percent.');
  nonEmpty(input.roleTitle, 'Resource Requirement role title');
  nonEmpty(input.description, 'Resource Requirement description');
  validPeriod(input.effectiveFrom, input.effectiveTo, 'Resource Requirement');
  return Object.freeze({ ...input });
}

export function createOrganisationalResourceFulfilment(
  input: OrganisationalResourceFulfilment,
  requirement: OrganisationalResourceRequirement
): OrganisationalResourceFulfilment {
  sameTenant(input.tenantId, requirement.tenantId, 'Resource Fulfilment and Requirement');
  invariant(input.requirementId === requirement.id, 'Resource Fulfilment must reference the supplied Requirement.');
  invariant(requirement.status !== 'CANCELLED', 'Cancelled Resource Requirements cannot be fulfilled.');
  invariant(input.requirementSharePercent > 0 && input.requirementSharePercent <= 100, 'Requirement share must be greater than 0 and no more than 100 percent.');
  invariant(input.resourceCapacityPercent > 0 && input.resourceCapacityPercent <= 100, 'Resource capacity must be greater than 0 and no more than 100 percent.');
  validPeriod(input.effectiveFrom, input.effectiveTo, 'Resource Fulfilment');
  return Object.freeze({ ...input });
}
