import { invariant } from './errors.js';
import type { Organisation, Position } from './model.js';
import type { CanonicalObjectIdentity } from './model.js';
import type { SalesAccount, SalesOpportunity } from './sales.js';

function sameTenant(expected:string,actual:string,label:string) {
  invariant(expected===actual,`${label} must belong to the same tenant.`);
}

export function createSalesAccount(
  input:SalesAccount,
  canonicalObject:CanonicalObjectIdentity,
  organisation:Organisation,
  ownerPosition:Position
):SalesAccount {
  sameTenant(input.tenantId,canonicalObject.tenantId,'Sales Account and canonical object');
  sameTenant(input.tenantId,organisation.tenantId,'Sales Account and Organisation');
  sameTenant(input.tenantId,ownerPosition.tenantId,'Sales Account and owner Position');
  invariant(input.canonicalObjectId===canonicalObject.id,'Sales Account canonical object reference does not match.');
  invariant(input.organisationId===organisation.id,'Sales Account must reference the supplied Organisation.');
  invariant(input.ownerPositionId===ownerPosition.id,'Sales Account owner Position does not match.');
  invariant(canonicalObject.objectType==='SALES_ACCOUNT','Sales Account canonical object must use SALES_ACCOUNT type.');
  invariant(Boolean(input.code.trim()),'Sales Account code must not be empty.');
  invariant(input.rowVersion>=1,'Sales Account row version must be positive.');
  return Object.freeze({...input});
}

export function createSalesOpportunity(
  input:SalesOpportunity,
  canonicalObject:CanonicalObjectIdentity,
  account:SalesAccount,
  ownerPosition:Position
):SalesOpportunity {
  sameTenant(input.tenantId,canonicalObject.tenantId,'Sales Opportunity and canonical object');
  sameTenant(input.tenantId,account.tenantId,'Sales Opportunity and Sales Account');
  sameTenant(input.tenantId,ownerPosition.tenantId,'Sales Opportunity and owner Position');
  invariant(input.canonicalObjectId===canonicalObject.id,'Sales Opportunity canonical object reference does not match.');
  invariant(input.salesAccountId===account.id,'Sales Opportunity must reference the supplied Sales Account.');
  invariant(input.ownerPositionId===ownerPosition.id,'Sales Opportunity owner Position does not match.');
  invariant(canonicalObject.objectType==='OPPORTUNITY','Sales Opportunity canonical object must use OPPORTUNITY type.');
  invariant(Boolean(input.code.trim()),'Sales Opportunity code must not be empty.');
  invariant(Boolean(input.title.trim()),'Sales Opportunity title must not be empty.');
  invariant(input.probabilityPercent>=0&&input.probabilityPercent<=100,'Sales Opportunity probability must be between 0 and 100.');
  invariant(input.estimatedValue>=0,'Sales Opportunity estimated value must not be negative.');
  invariant(/^[A-Z]{3}$/.test(input.currency),'Sales Opportunity currency must be a three-letter uppercase code.');
  if(input.expectedCloseDate) {
    invariant(Number.isFinite(Date.parse(input.expectedCloseDate)),'Sales Opportunity expected close date must be valid.');
  }
  invariant(input.rowVersion>=1,'Sales Opportunity row version must be positive.');
  return Object.freeze({...input});
}
