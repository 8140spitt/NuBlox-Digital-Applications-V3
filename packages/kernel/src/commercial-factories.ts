import { invariant } from './errors.js';
import type { Change } from './change.js';
import type {
  CommercialFinalAccount,
  CommercialForecast,
  CommercialForecastLine,
  CommercialMoney,
  CommercialValuation,
  CommercialValuationLine,
  CommercialVariation,
  CommercialVariationDecision,
  CommercialVariationLine,
  CommercialVariationVersion,
  CostPlan,
  CostPlanLine,
  CostPlanVersion,
  ProjectCostCode
} from './commercial.js';
import type { Decision, EvidenceRecord } from './control.js';
import type { CanonicalObjectIdentity } from './model.js';

function assertSameTenant(expected: string, actual: string, label: string) {
  invariant(expected === actual, `${label} must belong to the same tenant.`);
}

function assertNonEmpty(value: string, label: string) {
  invariant(Boolean(value.trim()), `${label} must not be empty.`);
}

function assertDate(value: string, label: string) {
  invariant(Number.isFinite(Date.parse(value)), `${label} must be a valid date/time.`);
}

function assertCurrency(value: string) {
  invariant(/^[A-Z]{3}$/.test(value), 'Commercial currency must be a 3-letter uppercase ISO code.');
}

function assertMoney(value: CommercialMoney, label: string, allowNegative = true) {
  invariant(
    /^-?\d+(?:\.\d{1,4})?$/.test(value),
    `${label} must be a decimal string with at most 4 decimal places.`
  );
  if (!allowNegative) {
    invariant(!value.startsWith('-'), `${label} must not be negative.`);
  }
}

function assertProjectObject(project: CanonicalObjectIdentity) {
  invariant(project.objectType === 'PROJECT', 'Commercial project context must use canonical objectType PROJECT.');
}

function assertCommercialObject(
  object: CanonicalObjectIdentity,
  expectedType: string,
  tenantId: string
) {
  assertSameTenant(tenantId, object.tenantId, expectedType);
  invariant(
    object.objectType === expectedType,
    `Commercial canonical object must use objectType ${expectedType}.`
  );
}

function assertDecisionSubject(
  decision: Decision,
  tenantId: string,
  objectId: string,
  subjectVersion: string | undefined,
  decisionType: string
) {
  assertSameTenant(tenantId, decision.tenantId, 'Commercial record and Decision');
  invariant(decision.decisionType === decisionType, `Decision must use type ${decisionType}.`);
  invariant(decision.subjectObjectId === objectId, 'Decision must reference the exact commercial subject object.');
  invariant(
    decision.subjectVersion === subjectVersion,
    'Decision must reference the exact commercial subject version.'
  );
}

export function createProjectCostCode(
  input: ProjectCostCode,
  project: CanonicalObjectIdentity,
  parent?: ProjectCostCode
): ProjectCostCode {
  assertProjectObject(project);
  assertSameTenant(input.tenantId, project.tenantId, 'Cost Code and Project');
  invariant(input.projectObjectId === project.id, 'Cost Code must reference the supplied Project.');
  assertNonEmpty(input.code, 'Cost Code code');
  assertNonEmpty(input.name, 'Cost Code name');

  if (parent) {
    assertSameTenant(input.tenantId, parent.tenantId, 'Cost Code and parent');
    invariant(parent.projectObjectId === project.id, 'Cost Code parent must belong to the same Project.');
    invariant(input.parentCostCodeId === parent.id, 'Cost Code must reference the supplied parent.');
    invariant(input.id !== parent.id, 'Cost Code cannot parent itself.');
  } else {
    invariant(!input.parentCostCodeId, 'Cost Code cannot reference an unsupplied parent.');
  }

  return Object.freeze({ ...input });
}

export function createCostPlan(
  input: CostPlan,
  object: CanonicalObjectIdentity,
  project: CanonicalObjectIdentity
): CostPlan {
  assertCommercialObject(object, 'COST_PLAN', input.tenantId);
  assertProjectObject(project);
  assertSameTenant(input.tenantId, project.tenantId, 'Cost Plan and Project');
  invariant(input.canonicalObjectId === object.id, 'Cost Plan must reference the supplied canonical object.');
  invariant(input.projectObjectId === project.id, 'Cost Plan must reference the supplied Project.');
  invariant(input.status === 'ACTIVE', 'New Cost Plan must start ACTIVE.');
  assertNonEmpty(input.code, 'Cost Plan code');
  assertNonEmpty(input.title, 'Cost Plan title');
  return Object.freeze({ ...input });
}

export function createCostPlanVersion(
  input: CostPlanVersion,
  costPlan: CostPlan
): CostPlanVersion {
  assertSameTenant(input.tenantId, costPlan.tenantId, 'Cost Plan Version and Cost Plan');
  invariant(input.costPlanId === costPlan.id, 'Cost Plan Version must reference the supplied Cost Plan.');
  invariant(Number.isInteger(input.version) && input.version >= 1, 'Cost Plan version must be a positive integer.');
  invariant(input.status === 'DRAFT', 'New Cost Plan Version must start DRAFT.');
  assertCurrency(input.currency);
  assertDate(input.createdAt, 'Cost Plan Version createdAt');
  invariant(
    !input.approvedDecisionId && !input.approvedAt,
    'New Cost Plan Version must not contain approval state.'
  );
  return Object.freeze({ ...input });
}

export function createCostPlanLine(
  input: CostPlanLine,
  version: CostPlanVersion,
  costCode: ProjectCostCode
): CostPlanLine {
  assertSameTenant(input.tenantId, version.tenantId, 'Cost Plan Line and Version');
  assertSameTenant(input.tenantId, costCode.tenantId, 'Cost Plan Line and Cost Code');
  invariant(input.costPlanVersionId === version.id, 'Cost Plan Line must reference the supplied Version.');
  invariant(input.costCodeId === costCode.id, 'Cost Plan Line must reference the supplied Cost Code.');
  invariant(version.status === 'DRAFT', 'Cost Plan Lines can only be created on a DRAFT Version.');
  assertNonEmpty(input.description, 'Cost Plan Line description');
  assertMoney(input.amount, 'Cost Plan Line amount', false);
  return Object.freeze({ ...input });
}

export function approveCostPlanVersion(
  current: CostPlanVersion,
  costPlan: CostPlan,
  decision: Decision
): CostPlanVersion {
  invariant(current.status === 'DRAFT', 'Only a DRAFT Cost Plan Version can be approved.');
  assertDecisionSubject(
    decision,
    current.tenantId,
    costPlan.canonicalObjectId,
    String(current.version),
    'COST_PLAN_APPROVAL'
  );
  invariant(decision.outcome === 'APPROVED', 'Cost Plan approval Decision must be APPROVED.');
  invariant(current.costPlanId === costPlan.id, 'Cost Plan Version must belong to the supplied Cost Plan.');
  return Object.freeze({
    ...current,
    status: 'APPROVED',
    approvedDecisionId: decision.id,
    approvedAt: decision.decidedAt
  });
}

export function supersedeCostPlanVersion(
  current: CostPlanVersion
): CostPlanVersion {
  invariant(current.status === 'APPROVED', 'Only an APPROVED Cost Plan Version can be superseded.');
  return Object.freeze({ ...current, status: 'SUPERSEDED' });
}

export function createCommercialVariation(
  input: CommercialVariation,
  object: CanonicalObjectIdentity,
  project: CanonicalObjectIdentity,
  options: {
    change?: Change;
    commercialContext?: CanonicalObjectIdentity;
  } = {}
): CommercialVariation {
  assertCommercialObject(object, 'COMMERCIAL_VARIATION', input.tenantId);
  assertProjectObject(project);
  assertSameTenant(input.tenantId, project.tenantId, 'Variation and Project');
  invariant(input.canonicalObjectId === object.id, 'Variation must reference the supplied canonical object.');
  invariant(input.projectObjectId === project.id, 'Variation must reference the supplied Project.');
  invariant(input.status === 'OPEN', 'New Commercial Variation must start OPEN.');
  assertNonEmpty(input.code, 'Commercial Variation code');
  assertNonEmpty(input.title, 'Commercial Variation title');

  if (options.change) {
    assertSameTenant(input.tenantId, options.change.tenantId, 'Variation and Change');
    invariant(input.linkedChangeId === options.change.id, 'Variation must reference the supplied Change.');
  } else {
    invariant(!input.linkedChangeId, 'Variation cannot reference an unsupplied Change.');
  }

  if (options.commercialContext) {
    assertSameTenant(input.tenantId, options.commercialContext.tenantId, 'Variation and commercial context');
    invariant(
      input.commercialContextObjectId === options.commercialContext.id,
      'Variation must reference the supplied commercial context.'
    );
  } else {
    invariant(
      !input.commercialContextObjectId,
      'Variation cannot reference an unsupplied commercial context.'
    );
  }

  return Object.freeze({ ...input });
}

export function createCommercialVariationVersion(
  input: CommercialVariationVersion,
  variation: CommercialVariation
): CommercialVariationVersion {
  assertSameTenant(input.tenantId, variation.tenantId, 'Variation Version and Variation');
  invariant(input.variationId === variation.id, 'Variation Version must reference the supplied Variation.');
  invariant(variation.status === 'OPEN', 'Variation Version requires an OPEN Variation.');
  invariant(Number.isInteger(input.version) && input.version >= 1, 'Variation version must be a positive integer.');
  invariant(input.status === 'DRAFT', 'New Variation Version must start DRAFT.');
  assertCurrency(input.currency);
  assertMoney(input.submittedAmount, 'Variation submittedAmount');
  assertDate(input.createdAt, 'Variation Version createdAt');
  invariant(!input.issuedAt, 'New Variation Version must not contain issuedAt.');
  return Object.freeze({ ...input });
}

export function createCommercialVariationLine(
  input: CommercialVariationLine,
  version: CommercialVariationVersion,
  costCode?: ProjectCostCode
): CommercialVariationLine {
  assertSameTenant(input.tenantId, version.tenantId, 'Variation Line and Version');
  invariant(input.variationVersionId === version.id, 'Variation Line must reference the supplied Version.');
  invariant(version.status === 'DRAFT', 'Variation Lines can only be created on a DRAFT Version.');
  assertNonEmpty(input.description, 'Variation Line description');
  assertMoney(input.amount, 'Variation Line amount');

  if (costCode) {
    assertSameTenant(input.tenantId, costCode.tenantId, 'Variation Line and Cost Code');
    invariant(input.costCodeId === costCode.id, 'Variation Line must reference the supplied Cost Code.');
  } else {
    invariant(!input.costCodeId, 'Variation Line cannot reference an unsupplied Cost Code.');
  }

  return Object.freeze({ ...input });
}

export function issueCommercialVariationVersion(
  current: CommercialVariationVersion,
  issuedAt: string
): CommercialVariationVersion {
  invariant(current.status === 'DRAFT', 'Only a DRAFT Variation Version can be issued.');
  assertDate(issuedAt, 'Variation Version issuedAt');
  return Object.freeze({ ...current, status: 'ISSUED', issuedAt });
}

export function createCommercialVariationDecision(
  input: CommercialVariationDecision,
  variation: CommercialVariation,
  version: CommercialVariationVersion,
  decision: Decision
): CommercialVariationDecision {
  assertSameTenant(input.tenantId, variation.tenantId, 'Variation Decision and Variation');
  assertSameTenant(input.tenantId, version.tenantId, 'Variation Decision and Version');
  invariant(version.variationId === variation.id, 'Variation Decision Version must belong to the supplied Variation.');
  invariant(input.variationVersionId === version.id, 'Variation Decision must reference the supplied Version.');
  invariant(version.status === 'ISSUED', 'Variation Decision requires an ISSUED Version.');
  invariant(input.decisionId === decision.id, 'Variation Decision must reference the supplied Decision.');
  assertDecisionSubject(
    decision,
    input.tenantId,
    variation.canonicalObjectId,
    String(version.version),
    'COMMERCIAL_VARIATION_DECISION'
  );
  invariant(decision.outcome === input.outcome, 'Variation Decision outcome must equal the immutable Decision outcome.');
  invariant(input.decidedAt === decision.decidedAt, 'Variation Decision timestamp must equal the immutable Decision timestamp.');
  assertMoney(input.decidedAmount, 'Variation decidedAmount');
  if (input.outcome === 'REJECTED' || input.outcome === 'WITHDRAWN') {
    invariant(
      Number(input.decidedAmount) === 0,
      'Rejected or withdrawn Variation Decision must have zero decidedAmount.'
    );
  }
  return Object.freeze({ ...input });
}

export function closeCommercialVariation(
  current: CommercialVariation,
  decision: CommercialVariationDecision
): CommercialVariation {
  invariant(current.status === 'OPEN', 'Only an OPEN Commercial Variation can close.');
  if (decision.outcome === 'WITHDRAWN') {
    return Object.freeze({ ...current, status: 'CANCELLED' });
  }
  return Object.freeze({ ...current, status: 'CLOSED' });
}

export function createCommercialValuation(
  input: CommercialValuation,
  object: CanonicalObjectIdentity,
  project: CanonicalObjectIdentity,
  options: {
    commercialContext?: CanonicalObjectIdentity;
    sourceApplication?: CommercialValuation;
  } = {}
): CommercialValuation {
  assertCommercialObject(object, 'COMMERCIAL_VALUATION', input.tenantId);
  assertProjectObject(project);
  assertSameTenant(input.tenantId, project.tenantId, 'Valuation and Project');
  invariant(input.canonicalObjectId === object.id, 'Valuation must reference the supplied canonical object.');
  invariant(input.projectObjectId === project.id, 'Valuation must reference the supplied Project.');
  invariant(input.status === 'DRAFT', 'New Commercial Valuation must start DRAFT.');
  assertCurrency(input.currency);
  assertDate(input.valuationDate, 'Commercial Valuation valuationDate');
  invariant(!input.decisionId && !input.certifiedAt, 'New Valuation must not contain certification state.');

  if (options.commercialContext) {
    assertSameTenant(input.tenantId, options.commercialContext.tenantId, 'Valuation and commercial context');
    invariant(
      input.commercialContextObjectId === options.commercialContext.id,
      'Valuation must reference the supplied commercial context.'
    );
  } else {
    invariant(!input.commercialContextObjectId, 'Valuation cannot reference an unsupplied commercial context.');
  }

  if (options.sourceApplication) {
    assertSameTenant(input.tenantId, options.sourceApplication.tenantId, 'Certificate and source application');
    invariant(
      input.sourceApplicationId === options.sourceApplication.id,
      'Certificate must reference the supplied source application.'
    );
    invariant(
      input.projectObjectId === options.sourceApplication.projectObjectId,
      'Certificate and source application must belong to the same Project.'
    );
    invariant(
      input.kind === 'CLIENT_CERTIFICATE' || input.kind === 'SUPPLIER_CERTIFICATE',
      'Only certificate Valuations may reference a source application.'
    );
  } else {
    invariant(!input.sourceApplicationId, 'Valuation cannot reference an unsupplied source application.');
  }

  return Object.freeze({ ...input });
}

export function createCommercialValuationLine(
  input: CommercialValuationLine,
  valuation: CommercialValuation,
  costCode?: ProjectCostCode
): CommercialValuationLine {
  assertSameTenant(input.tenantId, valuation.tenantId, 'Valuation Line and Valuation');
  invariant(input.valuationId === valuation.id, 'Valuation Line must reference the supplied Valuation.');
  invariant(valuation.status === 'DRAFT', 'Valuation Lines can only be created on a DRAFT Valuation.');
  assertNonEmpty(input.description, 'Valuation Line description');
  assertMoney(input.cumulativeAmount, 'Valuation Line cumulativeAmount');

  if (costCode) {
    assertSameTenant(input.tenantId, costCode.tenantId, 'Valuation Line and Cost Code');
    invariant(input.costCodeId === costCode.id, 'Valuation Line must reference the supplied Cost Code.');
  } else {
    invariant(!input.costCodeId, 'Valuation Line cannot reference an unsupplied Cost Code.');
  }

  return Object.freeze({ ...input });
}

export function submitCommercialValuation(
  current: CommercialValuation
): CommercialValuation {
  invariant(current.status === 'DRAFT', 'Only a DRAFT Commercial Valuation can submit.');
  return Object.freeze({ ...current, status: 'SUBMITTED' });
}

export function certifyCommercialValuation(
  current: CommercialValuation,
  decision: Decision
): CommercialValuation {
  invariant(current.status === 'SUBMITTED', 'Only a SUBMITTED Commercial Valuation can certify.');
  assertDecisionSubject(
    decision,
    current.tenantId,
    current.canonicalObjectId,
    undefined,
    'COMMERCIAL_VALUATION_CERTIFICATION'
  );
  invariant(decision.outcome === 'APPROVED', 'Valuation certification Decision must be APPROVED.');
  return Object.freeze({
    ...current,
    status: 'CERTIFIED',
    decisionId: decision.id,
    certifiedAt: decision.decidedAt
  });
}

export function closeCommercialValuation(
  current: CommercialValuation
): CommercialValuation {
  invariant(current.status === 'CERTIFIED', 'Only a CERTIFIED Commercial Valuation can close.');
  return Object.freeze({ ...current, status: 'CLOSED' });
}

export function createCommercialForecast(
  input: CommercialForecast,
  object: CanonicalObjectIdentity,
  project: CanonicalObjectIdentity
): CommercialForecast {
  assertCommercialObject(object, 'COMMERCIAL_FORECAST', input.tenantId);
  assertProjectObject(project);
  assertSameTenant(input.tenantId, project.tenantId, 'Forecast and Project');
  invariant(input.canonicalObjectId === object.id, 'Forecast must reference the supplied canonical object.');
  invariant(input.projectObjectId === project.id, 'Forecast must reference the supplied Project.');
  invariant(input.status === 'DRAFT', 'New Commercial Forecast must start DRAFT.');
  assertDate(input.reportingCutoffAt, 'Commercial Forecast reportingCutoffAt');
  assertCurrency(input.currency);
  assertMoney(input.forecastRevenue, 'Commercial Forecast forecastRevenue');
  invariant(!input.approvedDecisionId && !input.approvedAt, 'New Forecast must not contain approval state.');
  return Object.freeze({ ...input });
}

export function createCommercialForecastLine(
  input: CommercialForecastLine,
  forecast: CommercialForecast,
  costCode: ProjectCostCode
): CommercialForecastLine {
  assertSameTenant(input.tenantId, forecast.tenantId, 'Forecast Line and Forecast');
  assertSameTenant(input.tenantId, costCode.tenantId, 'Forecast Line and Cost Code');
  invariant(input.forecastId === forecast.id, 'Forecast Line must reference the supplied Forecast.');
  invariant(input.costCodeId === costCode.id, 'Forecast Line must reference the supplied Cost Code.');
  invariant(forecast.status === 'DRAFT', 'Forecast Lines can only be created on a DRAFT Forecast.');
  assertMoney(input.controlBudget, 'Forecast controlBudget');
  assertMoney(input.actualCost, 'Forecast actualCost');
  assertMoney(input.remainingCommitment, 'Forecast remainingCommitment');
  assertMoney(input.approvedChange, 'Forecast approvedChange');
  assertMoney(input.pendingChangeExposure, 'Forecast pendingChangeExposure');
  assertMoney(input.forecastToComplete, 'Forecast forecastToComplete');
  return Object.freeze({ ...input });
}

export function approveCommercialForecast(
  current: CommercialForecast,
  decision: Decision
): CommercialForecast {
  invariant(current.status === 'DRAFT', 'Only a DRAFT Commercial Forecast can be approved.');
  assertDecisionSubject(
    decision,
    current.tenantId,
    current.canonicalObjectId,
    undefined,
    'COMMERCIAL_FORECAST_APPROVAL'
  );
  invariant(decision.outcome === 'APPROVED', 'Forecast approval Decision must be APPROVED.');
  return Object.freeze({
    ...current,
    status: 'APPROVED',
    approvedDecisionId: decision.id,
    approvedAt: decision.decidedAt
  });
}

export function supersedeCommercialForecast(
  current: CommercialForecast
): CommercialForecast {
  invariant(current.status === 'APPROVED', 'Only an APPROVED Forecast can be superseded.');
  return Object.freeze({ ...current, status: 'SUPERSEDED' });
}

export function createCommercialFinalAccount(
  input: CommercialFinalAccount,
  object: CanonicalObjectIdentity,
  project: CanonicalObjectIdentity,
  commercialContext?: CanonicalObjectIdentity
): CommercialFinalAccount {
  assertCommercialObject(object, 'COMMERCIAL_FINAL_ACCOUNT', input.tenantId);
  assertProjectObject(project);
  assertSameTenant(input.tenantId, project.tenantId, 'Final Account and Project');
  invariant(input.canonicalObjectId === object.id, 'Final Account must reference the supplied canonical object.');
  invariant(input.projectObjectId === project.id, 'Final Account must reference the supplied Project.');
  invariant(input.status === 'DRAFT', 'New Final Account must start DRAFT.');
  assertCurrency(input.currency);
  assertMoney(input.agreedAmount, 'Final Account agreedAmount');
  invariant(
    !input.decisionId && !input.agreedAt && !input.evidenceRecordId,
    'New Final Account must not contain agreement state.'
  );

  if (commercialContext) {
    assertSameTenant(input.tenantId, commercialContext.tenantId, 'Final Account and commercial context');
    invariant(
      input.commercialContextObjectId === commercialContext.id,
      'Final Account must reference the supplied commercial context.'
    );
  } else {
    invariant(!input.commercialContextObjectId, 'Final Account cannot reference an unsupplied commercial context.');
  }

  return Object.freeze({ ...input });
}

export function agreeCommercialFinalAccount(
  current: CommercialFinalAccount,
  decision: Decision,
  evidence?: EvidenceRecord
): CommercialFinalAccount {
  invariant(current.status === 'DRAFT', 'Only a DRAFT Final Account can be agreed.');
  assertDecisionSubject(
    decision,
    current.tenantId,
    current.canonicalObjectId,
    undefined,
    'COMMERCIAL_FINAL_ACCOUNT_AGREEMENT'
  );
  invariant(decision.outcome === 'APPROVED', 'Final Account Decision must be APPROVED.');

  if (evidence) {
    assertSameTenant(current.tenantId, evidence.tenantId, 'Final Account and Evidence');
    invariant(
      evidence.subjectObjectId === current.canonicalObjectId,
      'Final Account Evidence must reference the Final Account canonical object.'
    );
  }

  return Object.freeze({
    ...current,
    status: 'AGREED',
    decisionId: decision.id,
    agreedAt: decision.decidedAt,
    ...(evidence ? { evidenceRecordId: evidence.id } : {})
  });
}

export function closeCommercialFinalAccount(
  current: CommercialFinalAccount
): CommercialFinalAccount {
  invariant(current.status === 'AGREED', 'Only an AGREED Final Account can close.');
  return Object.freeze({ ...current, status: 'CLOSED' });
}
