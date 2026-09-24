import { invariant } from './errors.js';
import type {
  CompetenceEvidence,
  CompetenceRequirement,
  DeploymentAssignment,
  DeploymentCapacity,
  DeploymentGateResult,
  FunctionDefinition,
  FunctionGovernanceVersion,
  FunctionalActivityDefinition,
  FunctionalDeployment,
  FunctionJobProfileParticipation,
  ProcessDefinition,
  ResponsibilityScope,
  SubFunctionDefinition,
  TaskDefinition
} from './functional.js';
import type {
  CanonicalObjectIdentity,
  JobProfile,
  Organisation,
  OrganisationUnit,
  Person,
  Position
} from './model.js';

function assertNonEmpty(value: string, label: string) {
  invariant(Boolean(value.trim()), `${label} must not be empty.`);
}

function assertSameTenant(expected: string, actual: string, label: string) {
  invariant(expected === actual, `${label} must belong to the same tenant.`);
}

function assertDate(value: string, label: string) {
  invariant(Number.isFinite(Date.parse(value)), `${label} must be a valid date/time.`);
}

function assertDateOrder(from: string, to: string | undefined, label: string) {
  assertDate(from, `${label} effectiveFrom`);
  if (to) {
    assertDate(to, `${label} effectiveTo`);
    invariant(
      Date.parse(to) >= Date.parse(from),
      `${label} effectiveTo must not be earlier than effectiveFrom.`
    );
  }
}

function assertStringArray(values: ReadonlyArray<string>, label: string) {
  for (const value of values) assertNonEmpty(value, label);
}

export function createFunctionDefinition(
  input: FunctionDefinition
): FunctionDefinition {
  if (input.functionFamily === 'CORE_BUSINESS') {
    invariant(/^F\d{2}$/.test(input.code), 'Core Business Function code must use F01-F99 format.');
  } else if (input.functionFamily === 'CBE') {
    invariant(/^D\d{2}$/.test(input.code), 'CBE Function code must use D01-D99 format.');
    assertNonEmpty(input.industrySolutionId ?? '', 'CBE Function industry solution');
  } else {
    assertNonEmpty(input.code, 'Custom Function code');
  }
  invariant(input.id === input.code, 'Function id must equal its stable Function code.');
  invariant(input.parentFunctionId !== input.id, 'Function cannot parent itself.');
  assertNonEmpty(input.name, 'Function name');
  return Object.freeze({ ...input });
}

export function createSubFunctionDefinition(
  input: SubFunctionDefinition,
  parent: FunctionDefinition
): SubFunctionDefinition {
  invariant(input.functionId === parent.id, 'Sub-function must reference the supplied Function.');
  invariant(
    input.code.startsWith(`${parent.code}.`),
    'Sub-function code must be namespaced by its parent Function.'
  );
  invariant(input.id === input.code, 'Sub-function id must equal its stable code.');
  invariant(
    Number.isInteger(input.sequence) && input.sequence >= 1,
    'Sub-function sequence must be a positive integer.'
  );
  assertNonEmpty(input.name, 'Sub-function name');
  return Object.freeze({ ...input });
}

export function createFunctionalActivityDefinition(
  input: FunctionalActivityDefinition,
  subFunction: SubFunctionDefinition
): FunctionalActivityDefinition {
  invariant(
    input.subFunctionId === subFunction.id,
    'Functional Activity must reference the supplied Sub-function.'
  );
  invariant(
    Number.isInteger(input.sequence) && input.sequence >= 1,
    'Functional Activity sequence must be a positive integer.'
  );
  assertNonEmpty(input.name, 'Functional Activity name');
  return Object.freeze({ ...input });
}

export function createProcessDefinition(
  input: ProcessDefinition,
  functionDefinition: FunctionDefinition,
  subFunction?: SubFunctionDefinition
): ProcessDefinition {
  invariant(
    input.functionId === functionDefinition.id,
    'Process Definition must reference the supplied Function.'
  );
  assertNonEmpty(input.code, 'Process Definition code');
  assertNonEmpty(input.name, 'Process Definition name');
  assertNonEmpty(input.purpose, 'Process Definition purpose');

  if (subFunction) {
    invariant(
      input.subFunctionId === subFunction.id,
      'Process Definition must reference the supplied Sub-function.'
    );
    invariant(
      subFunction.functionId === functionDefinition.id,
      'Process Definition Sub-function must belong to the supplied Function.'
    );
  } else {
    invariant(
      !input.subFunctionId,
      'Process Definition cannot reference a Sub-function that was not supplied.'
    );
  }

  return Object.freeze({ ...input });
}

export function createTaskDefinition(
  input: TaskDefinition,
  process: ProcessDefinition,
  activity?: FunctionalActivityDefinition
): TaskDefinition {
  assertSameTenant(input.tenantId, process.tenantId, 'Task Definition and Process Definition');
  invariant(
    input.processDefinitionId === process.id,
    'Task Definition must reference the supplied Process Definition.'
  );
  invariant(
    Number.isInteger(input.sequence) && input.sequence >= 1,
    'Task Definition sequence must be a positive integer.'
  );
  assertNonEmpty(input.code, 'Task Definition code');
  assertNonEmpty(input.name, 'Task Definition name');

  if (activity) {
    invariant(
      input.functionalActivityId === activity.id,
      'Task Definition must reference the supplied Functional Activity.'
    );
    invariant(
      process.subFunctionId === activity.subFunctionId,
      'Mapped Functional Activity must belong to the Process Definition Sub-function.'
    );
  } else {
    invariant(
      !input.functionalActivityId,
      'Task Definition cannot reference a Functional Activity that was not supplied.'
    );
  }

  return Object.freeze({ ...input });
}

export function createFunctionGovernanceVersion(
  input: FunctionGovernanceVersion,
  functionDefinition: FunctionDefinition,
  owner: Person | Position
): FunctionGovernanceVersion {
  assertSameTenant(input.tenantId, owner.tenantId, 'Function Governance and accountable owner');
  invariant(
    input.functionId === functionDefinition.id,
    'Function Governance Version must reference the supplied Function.'
  );
  invariant(
    Number.isInteger(input.version) && input.version >= 1,
    'Function Governance version must be a positive integer.'
  );
  invariant(input.status === 'DRAFT', 'New Function Governance Version must start DRAFT.');
  invariant(
    input.accountableOwnerId === owner.id,
    'Function Governance accountableOwnerId must reference the supplied owner.'
  );
  invariant(
    (input.accountableOwnerType === 'PERSON' && 'partyId' in owner) ||
      (input.accountableOwnerType === 'POSITION' && 'organisationUnitId' in owner),
    'Function Governance accountable owner type must match the supplied owner.'
  );
  assertNonEmpty(input.purpose, 'Function Governance purpose');
  assertNonEmpty(input.mandate, 'Function Governance mandate');
  assertStringArray(input.scopeIn, 'Function Governance scopeIn item');
  assertStringArray(input.scopeOut, 'Function Governance scopeOut item');
  assertStringArray(input.policyReferences, 'Function Governance policy reference');
  assertStringArray(input.standardReferences, 'Function Governance standard reference');
  assertStringArray(input.procedureReferences, 'Function Governance procedure reference');
  assertStringArray(input.assuranceRequirements, 'Function Governance assurance requirement');
  assertStringArray(input.performanceMeasures, 'Function Governance performance measure');

  invariant(
    !input.effectiveFrom && !input.effectiveTo,
    'New DRAFT Function Governance Version must not contain effectivity.'
  );

  return Object.freeze({ ...input });
}

export function publishFunctionGovernanceVersion(
  current: FunctionGovernanceVersion,
  effectiveFrom: string
): FunctionGovernanceVersion {
  invariant(
    current.status === 'DRAFT',
    'Only a DRAFT Function Governance Version can publish.'
  );
  assertDate(effectiveFrom, 'Function Governance effectiveFrom');
  return Object.freeze({
    ...current,
    status: 'PUBLISHED',
    effectiveFrom
  });
}

export function retireFunctionGovernanceVersion(
  current: FunctionGovernanceVersion,
  effectiveTo: string
): FunctionGovernanceVersion {
  invariant(
    current.status === 'PUBLISHED',
    'Only a PUBLISHED Function Governance Version can retire.'
  );
  assertDate(effectiveTo, 'Function Governance effectiveTo');
  invariant(Boolean(current.effectiveFrom), 'Published Function Governance must have effectiveFrom.');
  invariant(
    Date.parse(effectiveTo) >= Date.parse(current.effectiveFrom!),
    'Function Governance effectiveTo must not be earlier than effectiveFrom.'
  );
  return Object.freeze({
    ...current,
    status: 'RETIRED',
    effectiveTo
  });
}

export function createFunctionJobProfileParticipation(
  input: FunctionJobProfileParticipation,
  functionDefinition: FunctionDefinition,
  jobProfile: JobProfile,
  subFunction?: SubFunctionDefinition
): FunctionJobProfileParticipation {
  invariant(
    input.functionId === functionDefinition.id,
    'Function participation must reference the supplied Function.'
  );
  invariant(
    input.jobProfileId === jobProfile.id,
    'Function participation must reference the supplied Job Profile.'
  );

  if (subFunction) {
    invariant(
      input.subFunctionId === subFunction.id,
      'Function participation must reference the supplied Sub-function.'
    );
    invariant(
      subFunction.functionId === functionDefinition.id,
      'Participation Sub-function must belong to the supplied Function.'
    );
  } else {
    invariant(
      !input.subFunctionId,
      'Function participation cannot reference an unsupplied Sub-function.'
    );
  }

  if (input.catalogueScope === 'TENANT') {
    invariant(Boolean(input.tenantId), 'Tenant Function participation must specify tenantId.');
    invariant(
      jobProfile.catalogueScope === 'PLATFORM' ||
        (jobProfile.tenantId !== undefined && jobProfile.tenantId === input.tenantId),
      'Tenant Function participation cannot use a Job Profile from another tenant.'
    );
  } else {
    invariant(!input.tenantId, 'Platform Function participation must not specify tenantId.');
    invariant(
      jobProfile.catalogueScope === 'PLATFORM',
      'Platform Function participation requires a platform Job Profile.'
    );
  }

  return Object.freeze({ ...input });
}

export function createCompetenceRequirement(
  input: CompetenceRequirement
): CompetenceRequirement {
  assertNonEmpty(input.subjectId, 'Competence Requirement subjectId');
  assertNonEmpty(input.competenceCode, 'Competence Requirement code');
  assertNonEmpty(input.competenceName, 'Competence Requirement name');
  assertNonEmpty(input.requiredLevel, 'Competence Requirement requiredLevel');
  return Object.freeze({ ...input });
}

export function createCompetenceEvidence(
  input: CompetenceEvidence,
  person: Person
): CompetenceEvidence {
  assertSameTenant(input.tenantId, person.tenantId, 'Competence Evidence and Person');
  invariant(input.personId === person.id, 'Competence Evidence must reference the supplied Person.');
  assertNonEmpty(input.competenceCode, 'Competence Evidence code');
  assertNonEmpty(input.attainedLevel, 'Competence Evidence attainedLevel');
  assertDate(input.issuedAt, 'Competence Evidence issuedAt');
  assertDateOrder(input.effectiveFrom, input.effectiveTo, 'Competence Evidence');
  return Object.freeze({ ...input });
}

export function createFunctionalDeployment(
  input: FunctionalDeployment,
  functionDefinition: FunctionDefinition,
  organisation: Organisation,
  organisationUnit?: OrganisationUnit,
  context?: CanonicalObjectIdentity,
  subFunction?: SubFunctionDefinition
): FunctionalDeployment {
  assertSameTenant(input.tenantId, organisation.tenantId, 'Functional Deployment and Organisation');
  invariant(
    input.functionId === functionDefinition.id,
    'Functional Deployment must reference the supplied Function.'
  );
  invariant(
    input.organisationId === organisation.id,
    'Functional Deployment must reference the supplied Organisation.'
  );
  assertNonEmpty(input.scopeDescription, 'Functional Deployment scopeDescription');
  assertDateOrder(input.effectiveFrom, input.effectiveTo, 'Functional Deployment');

  if (subFunction) {
    invariant(
      input.subFunctionId === subFunction.id,
      'Functional Deployment must reference the supplied Sub-function.'
    );
    invariant(
      subFunction.functionId === functionDefinition.id,
      'Deployment Sub-function must belong to the supplied Function.'
    );
  } else {
    invariant(
      !input.subFunctionId,
      'Functional Deployment cannot reference an unsupplied Sub-function.'
    );
  }

  if (organisationUnit) {
    assertSameTenant(input.tenantId, organisationUnit.tenantId, 'Functional Deployment and Organisation Unit');
    invariant(
      input.organisationUnitId === organisationUnit.id,
      'Functional Deployment must reference the supplied Organisation Unit.'
    );
    invariant(
      organisationUnit.organisationId === organisation.id,
      'Functional Deployment Organisation Unit must belong to the supplied Organisation.'
    );
  } else {
    invariant(
      !input.organisationUnitId,
      'Functional Deployment cannot reference an unsupplied Organisation Unit.'
    );
  }

  if (input.contextType === 'TENANT' || input.contextType === 'ORGANISATION') {
    invariant(
      !input.contextObjectId,
      'TENANT or ORGANISATION deployment context must not specify contextObjectId.'
    );
    invariant(!context, 'TENANT or ORGANISATION deployment context must not supply a context object.');
  } else {
    invariant(Boolean(context), 'Scoped Functional Deployment requires a context object.');
    if (context) {
      assertSameTenant(input.tenantId, context.tenantId, 'Functional Deployment and context object');
      invariant(
        input.contextObjectId === context.id,
        'Functional Deployment contextObjectId must reference the supplied context object.'
      );
    }
  }

  return Object.freeze({ ...input });
}

export function createDeploymentAssignment(
  input: DeploymentAssignment,
  deployment: FunctionalDeployment,
  assignee: Person | Position | OrganisationUnit,
  jobProfile?: JobProfile
): DeploymentAssignment {
  assertSameTenant(input.tenantId, deployment.tenantId, 'Deployment Assignment and Functional Deployment');
  assertSameTenant(input.tenantId, assignee.tenantId, 'Deployment Assignment and assignee');
  invariant(
    input.functionalDeploymentId === deployment.id,
    'Deployment Assignment must reference the supplied Functional Deployment.'
  );
  invariant(input.assigneeId === assignee.id, 'Deployment Assignment must reference the supplied assignee.');
  assertDateOrder(input.effectiveFrom, input.effectiveTo, 'Deployment Assignment');

  const typeMatches =
    (input.assigneeType === 'PERSON' && 'partyId' in assignee) ||
    (input.assigneeType === 'POSITION' && 'organisationUnitId' in assignee && 'title' in assignee) ||
    (input.assigneeType === 'ORGANISATION_UNIT' && 'organisationId' in assignee && 'name' in assignee);
  invariant(typeMatches, 'Deployment Assignment assigneeType must match the supplied assignee.');

  if (jobProfile) {
    invariant(
      input.jobProfileId === jobProfile.id,
      'Deployment Assignment must reference the supplied Job Profile.'
    );
    if (jobProfile.catalogueScope === 'TENANT') {
      invariant(Boolean(jobProfile.tenantId), 'Tenant Job Profile must specify tenantId.');
      assertSameTenant(input.tenantId, jobProfile.tenantId!, 'Deployment Assignment and Job Profile');
    }
  } else {
    invariant(
      !input.jobProfileId,
      'Deployment Assignment cannot reference a Job Profile that was not supplied.'
    );
  }

  return Object.freeze({ ...input });
}

export function createResponsibilityScope(
  input: ResponsibilityScope,
  assignment: DeploymentAssignment
): ResponsibilityScope {
  assertSameTenant(input.tenantId, assignment.tenantId, 'Responsibility Scope and Deployment Assignment');
  invariant(
    input.deploymentAssignmentId === assignment.id,
    'Responsibility Scope must reference the supplied Deployment Assignment.'
  );
  invariant(
    input.responsibilityRole === assignment.responsibilityRole,
    'Responsibility Scope role must match its Deployment Assignment responsibility role.'
  );
  assertNonEmpty(input.scopeType, 'Responsibility Scope scopeType');
  assertDateOrder(input.effectiveFrom, input.effectiveTo, 'Responsibility Scope');

  if (input.scopeType === 'TENANT') {
    invariant(!input.scopeId, 'TENANT Responsibility Scope must not specify scopeId.');
  } else {
    invariant(Boolean(input.scopeId?.trim()), 'Non-TENANT Responsibility Scope must specify scopeId.');
  }

  return Object.freeze({ ...input });
}

export function createDeploymentCapacity(
  input: DeploymentCapacity,
  assignment: DeploymentAssignment
): DeploymentCapacity {
  assertSameTenant(input.tenantId, assignment.tenantId, 'Deployment Capacity and Deployment Assignment');
  invariant(
    input.deploymentAssignmentId === assignment.id,
    'Deployment Capacity must reference the supplied Deployment Assignment.'
  );
  invariant(
    Number.isFinite(input.capacityPercent) &&
      input.capacityPercent >= 0 &&
      input.capacityPercent <= 100,
    'Deployment Capacity percent must be between 0 and 100.'
  );
  assertDateOrder(input.effectiveFrom, input.effectiveTo, 'Deployment Capacity');
  return Object.freeze({ ...input });
}

export function createDeploymentGateResult(
  input: DeploymentGateResult
): DeploymentGateResult {
  assertDate(input.evaluatedAt, 'Deployment Gate evaluatedAt');
  invariant(input.checks.length > 0, 'Deployment Gate must contain at least one check.');

  const seen = new Set<string>();
  for (const check of input.checks) {
    invariant(!seen.has(check.check), 'Deployment Gate checks must not contain duplicates.');
    seen.add(check.check);
    assertNonEmpty(check.reason, 'Deployment Gate check reason');
  }

  invariant(
    input.allowed === input.checks.every((check) => check.passed),
    'Deployment Gate allowed must equal the combined check outcomes.'
  );

  return Object.freeze({
    ...input,
    checks: Object.freeze(input.checks.map((check) => Object.freeze({ ...check })))
  });
}
