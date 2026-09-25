import {
  ExchangeCommandError,
  type MySqlAccessRepository
} from '@nublox/persistence';
import {
  PLATFORM_PERMISSION_KEYS,
  type ExchangeDeltaType,
  type ExchangeMappingType
} from '@nublox/kernel';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getExchangeCommandService,
  getExchangeReadRepository
} from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];

const DELTA_TYPES = ['NEW','CHANGED','MOVED','DELETED','ABSENT'] as const satisfies readonly ExchangeDeltaType[];
const MAPPING_TYPES = [
  'CONTEXT','ORGANISATION','VIEW','LIFECYCLE','FOLDER','SECURITY_LABEL',
  'CLASSIFICATION','TYPE','VERSION','CUSTOM'
] as const satisfies readonly ExchangeMappingType[];

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}
function optionalValue(formData: FormData, name: string): string | undefined {
  const result = value(formData, name);
  return result || undefined;
}
function integerValue(raw: string, label: string): number | undefined {
  if (!raw) return undefined;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) throw new ExchangeCommandError(`${label} must be an integer.`, 'INVALID_INPUT');
  return parsed;
}
function enumValue<T extends string>(raw: string, allowed: readonly T[], label: string): T {
  if (!allowed.includes(raw as T)) throw new ExchangeCommandError(`${label} is invalid.`, 'INVALID_INPUT');
  return raw as T;
}
function failure(error: unknown, action: string) {
  if (error instanceof ExchangeCommandError) {
    const status = error.code === 'PERMISSION_DENIED' ? 403
      : error.code === 'NOT_FOUND' ? 404
      : error.code === 'CONFLICT' ? 409 : 400;
    return fail(status, { action, ok: false, error: error.message, code: error.code });
  }
  throw error;
}

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.auth;
  if (!session) {
    return { allowed: false, canManage: false, canReceive: false, canAdopt: false, reason: 'No authenticated tenant context is available.', projection: null };
  }
  const tenantId = session.tenantId as TenantId;
  const access = getAccessRepository();
  const [read, manage, receive, adopt] = await Promise.all([
    access.evaluatePermission(tenantId, session.personId, PLATFORM_PERMISSION_KEYS.EXCHANGE_READ, { scopeType: 'TENANT' }),
    access.evaluatePermission(tenantId, session.personId, PLATFORM_PERMISSION_KEYS.EXCHANGE_MANAGE, { scopeType: 'TENANT' }),
    access.evaluatePermission(tenantId, session.personId, PLATFORM_PERMISSION_KEYS.EXCHANGE_RECEIVE, { scopeType: 'TENANT' }),
    access.evaluatePermission(tenantId, session.personId, PLATFORM_PERMISSION_KEYS.EXCHANGE_AUTHORITY_ADOPT, { scopeType: 'TENANT' })
  ]);
  if (!read.allowed) {
    return { allowed: false, canManage: false, canReceive: false, canAdopt: false, reason: read.reason, projection: null };
  }
  return {
    allowed: true,
    canManage: manage.allowed,
    canReceive: receive.allowed,
    canAdopt: adopt.allowed,
    reason: read.reason,
    projection: await getExchangeReadRepository().getProjection(tenantId, session.personId)
  };
};

export const actions: Actions = {
  createPackage: async ({ request, locals }) => {
    const session = locals.auth; if (!session) return fail(401, { action:'createPackage', ok:false, error:'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getExchangeCommandService().createPackage(session.tenantId as TenantId, session.personId, {
        code:value(formData,'code'), name:value(formData,'name'), purpose:value(formData,'purpose'),
        sourceContextObjectId:optionalValue(formData,'sourceContextObjectId'),
        sourceSystem:value(formData,'sourceSystem'),
        packageVersion:integerValue(value(formData,'packageVersion'),'Package version')
      });
      return { action:'createPackage', ok:true, message:`Exchange Package ${item.code} v${item.packageVersion} created.` };
    } catch(error){ return failure(error,'createPackage'); }
  },
  addPackageItem: async ({ request, locals }) => {
    const session = locals.auth; if (!session) return fail(401,{action:'addPackageItem',ok:false,error:'Sign in required.'});
    const formData=await request.formData();
    try {
      const item=await getExchangeCommandService().addPackageItem(session.tenantId as TenantId,session.personId,{
        packageId:value(formData,'packageId'), subjectObjectId:value(formData,'subjectObjectId'),
        subjectVersion:optionalValue(formData,'subjectVersion'), representationId:optionalValue(formData,'representationId'),
        externalIdentityId:optionalValue(formData,'externalIdentityId'), itemRole:value(formData,'itemRole'),
        itemChecksum:optionalValue(formData,'itemChecksum')
      });
      return {action:'addPackageItem',ok:true,message:`Package Item ${item.id} added.`};
    } catch(error){ return failure(error,'addPackageItem'); }
  },
  freezePackage: async ({ request, locals }) => {
    const session=locals.auth; if(!session) return fail(401,{action:'freezePackage',ok:false,error:'Sign in required.'});
    const formData=await request.formData();
    try {
      const item=await getExchangeCommandService().freezePackage(session.tenantId as TenantId,session.personId,{
        packageId:value(formData,'packageId'),packageChecksum:value(formData,'packageChecksum')
      });
      return {action:'freezePackage',ok:true,message:`Package ${item.code} frozen.`};
    } catch(error){ return failure(error,'freezePackage'); }
  },
  dispatch: async ({ request, locals }) => {
    const session=locals.auth; if(!session) return fail(401,{action:'dispatch',ok:false,error:'Sign in required.'});
    const formData=await request.formData();
    try {
      const item=await getExchangeCommandService().dispatchDelivery(session.tenantId as TenantId,session.personId,{
        packageId:value(formData,'packageId'),transmittalId:optionalValue(formData,'transmittalId'),
        deliveryReference:value(formData,'deliveryReference'),
        deliverySequence:integerValue(value(formData,'deliverySequence'),'Delivery sequence'),
        priorDeliveryId:optionalValue(formData,'priorDeliveryId'),
        transportReference:optionalValue(formData,'transportReference'),
        deliveryChecksum:optionalValue(formData,'deliveryChecksum')
      });
      return {action:'dispatch',ok:true,message:`Delivery ${item.deliveryReference} dispatched.`};
    } catch(error){ return failure(error,'dispatch'); }
  },
  addRecipient: async ({ request, locals }) => {
    const session=locals.auth; if(!session) return fail(401,{action:'addRecipient',ok:false,error:'Sign in required.'});
    const formData=await request.formData();
    try {
      const item=await getExchangeCommandService().addRecipient(session.tenantId as TenantId,session.personId,{
        deliveryId:value(formData,'deliveryId'),recipientPartyId:value(formData,'recipientPartyId'),
        transmittalRecipientId:optionalValue(formData,'transmittalRecipientId'),
        targetSystem:optionalValue(formData,'targetSystem'),
        targetContextObjectId:optionalValue(formData,'targetContextObjectId'),
        targetReference:optionalValue(formData,'targetReference')
      });
      return {action:'addRecipient',ok:true,message:`Recipient ${item.id} added.`};
    } catch(error){ return failure(error,'addRecipient'); }
  },
  addDelta: async ({ request, locals }) => {
    const session=locals.auth; if(!session) return fail(401,{action:'addDelta',ok:false,error:'Sign in required.'});
    const formData=await request.formData();
    try {
      const item=await getExchangeCommandService().addDeltaItem(session.tenantId as TenantId,session.personId,{
        deliveryId:value(formData,'deliveryId'),subjectObjectId:value(formData,'subjectObjectId'),
        packageItemId:optionalValue(formData,'packageItemId'),
        deltaType:enumValue(value(formData,'deltaType'),DELTA_TYPES,'Delta type'),
        priorDeliveryId:optionalValue(formData,'priorDeliveryId'),
        priorSubjectVersion:optionalValue(formData,'priorSubjectVersion'),
        priorLocationReference:optionalValue(formData,'priorLocationReference'),
        currentLocationReference:optionalValue(formData,'currentLocationReference'),
        details:optionalValue(formData,'details')
      });
      return {action:'addDelta',ok:true,message:`${item.deltaType} delta recorded.`};
    } catch(error){ return failure(error,'addDelta'); }
  },
  receive: async ({ request, locals }) => {
    const session=locals.auth; if(!session) return fail(401,{action:'receive',ok:false,error:'Sign in required.'});
    const formData=await request.formData();
    try {
      const item=await getExchangeCommandService().receiveDelivery(session.tenantId as TenantId,session.personId,{
        deliveryId:value(formData,'deliveryId'),recipientId:value(formData,'recipientId'),
        receivedPackageChecksum:optionalValue(formData,'receivedPackageChecksum')
      });
      return {action:'receive',ok:true,message:`Received Delivery ${item.id} recorded.`};
    } catch(error){ return failure(error,'receive'); }
  },
  validate: async ({ request, locals }) => {
    const session=locals.auth; if(!session) return fail(401,{action:'validate',ok:false,error:'Sign in required.'});
    const formData=await request.formData();
    try {
      const item=await getExchangeCommandService().validateReceived(session.tenantId as TenantId,session.personId,value(formData,'receivedDeliveryId'));
      return {action:'validate',ok:true,message:`Received Delivery ${item.id} validated.`};
    } catch(error){ return failure(error,'validate'); }
  },
  addMapping: async ({ request, locals }) => {
    const session=locals.auth; if(!session) return fail(401,{action:'addMapping',ok:false,error:'Sign in required.'});
    const formData=await request.formData();
    try {
      const item=await getExchangeCommandService().addMapping(session.tenantId as TenantId,session.personId,{
        receivedDeliveryId:value(formData,'receivedDeliveryId'),
        mappingType:enumValue(value(formData,'mappingType'),MAPPING_TYPES,'Mapping type'),
        sourceValue:value(formData,'sourceValue'),targetValue:value(formData,'targetValue'),
        targetObjectId:optionalValue(formData,'targetObjectId'),notes:optionalValue(formData,'notes')
      });
      return {action:'addMapping',ok:true,message:`Mapping ${item.mappingType} recorded.`};
    } catch(error){ return failure(error,'addMapping'); }
  },
  markMapped: async ({ request, locals }) => {
    const session=locals.auth; if(!session) return fail(401,{action:'markMapped',ok:false,error:'Sign in required.'});
    const formData=await request.formData();
    try {
      const item=await getExchangeCommandService().markMapped(session.tenantId as TenantId,session.personId,value(formData,'receivedDeliveryId'));
      return {action:'markMapped',ok:true,message:`Received Delivery ${item.id} mapping completed.`};
    } catch(error){ return failure(error,'markMapped'); }
  },
  importDelivery: async ({ request, locals }) => {
    const session=locals.auth; if(!session) return fail(401,{action:'importDelivery',ok:false,error:'Sign in required.'});
    const formData=await request.formData();
    try {
      const item=await getExchangeCommandService().importReceived(session.tenantId as TenantId,session.personId,{
        receivedDeliveryId:value(formData,'receivedDeliveryId'),importReference:value(formData,'importReference')
      });
      return {action:'importDelivery',ok:true,message:`Received Delivery ${item.id} imported.`};
    } catch(error){ return failure(error,'importDelivery'); }
  },
  rejectDelivery: async ({ request, locals }) => {
    const session=locals.auth; if(!session) return fail(401,{action:'rejectDelivery',ok:false,error:'Sign in required.'});
    const formData=await request.formData();
    try {
      const item=await getExchangeCommandService().rejectReceived(session.tenantId as TenantId,session.personId,{
        receivedDeliveryId:value(formData,'receivedDeliveryId'),reason:value(formData,'reason')
      });
      return {action:'rejectDelivery',ok:true,message:`Received Delivery ${item.id} rejected.`};
    } catch(error){ return failure(error,'rejectDelivery'); }
  },
  adoptAuthority: async ({ request, locals }) => {
    const session=locals.auth; if(!session) return fail(401,{action:'adoptAuthority',ok:false,error:'Sign in required.'});
    const formData=await request.formData();
    try {
      const item=await getExchangeCommandService().adoptAuthority(session.tenantId as TenantId,session.personId,{
        receivedDeliveryId:value(formData,'receivedDeliveryId'),
        sourceSubjectObjectId:value(formData,'sourceSubjectObjectId'),
        sourceSubjectVersion:optionalValue(formData,'sourceSubjectVersion'),
        targetCanonicalObjectId:value(formData,'targetCanonicalObjectId'),
        targetSubjectVersion:optionalValue(formData,'targetSubjectVersion'),
        sourceAuthority:value(formData,'sourceAuthority'),targetAuthority:value(formData,'targetAuthority'),
        decisionId:value(formData,'decisionId')
      });
      return {action:'adoptAuthority',ok:true,message:`Authority Adoption ${item.id} recorded.`};
    } catch(error){ return failure(error,'adoptAuthority'); }
  }
};
