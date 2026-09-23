import {
  MetadataAdministrationCommandError,
  type MySqlAccessRepository
} from '@nublox/persistence';
import {
  PLATFORM_PERMISSION_KEYS,
  type MetadataCardinality,
  type MetadataConstraintType,
  type MetadataDataType
} from '@nublox/kernel';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getMetadataAdministrationCommandService,
  getMetadataAdministrationReadRepository
} from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];

const DATA_TYPES = [
  'STRING','INTEGER','DECIMAL','BOOLEAN','DATE','DATETIME','ENUMERATION','REFERENCE','JSON'
] as const satisfies readonly MetadataDataType[];

const CARDINALITIES = ['SINGLE','MULTIPLE'] as const satisfies readonly MetadataCardinality[];

const CONSTRAINT_TYPES = [
  'REQUIRED','MIN_MAX','LENGTH','PATTERN','ENUMERATION','REFERENCE','CUSTOM'
] as const satisfies readonly MetadataConstraintType[];

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}
function optionalValue(formData: FormData, name: string): string | undefined {
  const v = value(formData, name);
  return v || undefined;
}
function integerValue(raw: string, label: string): number | undefined {
  if (!raw) return undefined;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    throw new MetadataAdministrationCommandError(`${label} must be an integer.`, 'INVALID_INPUT');
  }
  return parsed;
}
function enumValue<T extends string>(raw: string, allowed: readonly T[], label: string): T {
  if (!allowed.includes(raw as T)) {
    throw new MetadataAdministrationCommandError(`${label} is invalid.`, 'INVALID_INPUT');
  }
  return raw as T;
}
function jsonObject(raw: string, label: string): Readonly<Record<string, unknown>> | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error();
    return parsed as Readonly<Record<string, unknown>>;
  } catch {
    throw new MetadataAdministrationCommandError(`${label} must be a JSON object.`, 'INVALID_INPUT');
  }
}
function jsonAny(raw: string, label: string): unknown {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    throw new MetadataAdministrationCommandError(`${label} must be valid JSON.`, 'INVALID_INPUT');
  }
}
function failure(error: unknown, action: string) {
  if (error instanceof MetadataAdministrationCommandError) {
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
    return {
      allowed: false,
      canManage: false,
      reason: 'No authenticated tenant context is available.',
      projection: null
    };
  }

  const tenantId = session.tenantId as TenantId;
  const access = getAccessRepository();
  const [readEvaluation, manageEvaluation] = await Promise.all([
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.METADATA_READ,
      { scopeType: 'TENANT' }
    ),
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.METADATA_MANAGE,
      { scopeType: 'TENANT' }
    )
  ]);

  if (!readEvaluation.allowed) {
    return {
      allowed: false,
      canManage: false,
      reason: readEvaluation.reason,
      projection: null
    };
  }

  const projection = await getMetadataAdministrationReadRepository()
    .getProjection(tenantId, session.personId);

  return {
    allowed: true,
    canManage: manageEvaluation.allowed,
    reason: readEvaluation.reason,
    projection
  };
};

export const actions: Actions = {
  createEnumeration: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'createEnumeration', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMetadataAdministrationCommandService().createEnumerationDefinition(
        session.tenantId as TenantId,
        session.personId,
        {
          code: value(formData, 'code'),
          name: value(formData, 'name'),
          description: optionalValue(formData, 'description'),
          version: integerValue(value(formData, 'version'), 'Version'),
          effectiveFrom: optionalValue(formData, 'effectiveFrom'),
          effectiveTo: optionalValue(formData, 'effectiveTo')
        }
      );
      return { action: 'createEnumeration', ok: true, message: `Enumeration ${item.code} v${item.version} created.` };
    } catch (error) { return failure(error, 'createEnumeration'); }
  },

  addEnumerationValue: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'addEnumerationValue', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMetadataAdministrationCommandService().addEnumerationValue(
        session.tenantId as TenantId,
        session.personId,
        {
          enumerationDefinitionId: value(formData, 'enumerationDefinitionId'),
          code: value(formData, 'code'),
          label: value(formData, 'label'),
          sequence: integerValue(value(formData, 'sequence'), 'Sequence'),
          externalValue: optionalValue(formData, 'externalValue')
        }
      );
      return { action: 'addEnumerationValue', ok: true, message: `Enumeration value ${item.code} created.` };
    } catch (error) { return failure(error, 'addEnumerationValue'); }
  },

  createType: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'createType', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMetadataAdministrationCommandService().createTypeDefinition(
        session.tenantId as TenantId,
        session.personId,
        {
          code: value(formData, 'code'),
          name: value(formData, 'name'),
          description: optionalValue(formData, 'description'),
          objectFamily: value(formData, 'objectFamily'),
          parentTypeDefinitionId: optionalValue(formData, 'parentTypeDefinitionId'),
          version: integerValue(value(formData, 'version'), 'Version'),
          lifecycleDefinitionId: optionalValue(formData, 'lifecycleDefinitionId'),
          defaultTemplateReference: optionalValue(formData, 'defaultTemplateReference'),
          creationPolicyReference: optionalValue(formData, 'creationPolicyReference'),
          classificationApplicability: jsonObject(
            value(formData, 'classificationApplicability'),
            'Classification applicability'
          ),
          extensionPackage: optionalValue(formData, 'extensionPackage'),
          effectiveFrom: optionalValue(formData, 'effectiveFrom'),
          effectiveTo: optionalValue(formData, 'effectiveTo')
        }
      );
      return { action: 'createType', ok: true, message: `Type ${item.code} v${item.version} created.` };
    } catch (error) { return failure(error, 'createType'); }
  },

  createAttribute: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'createAttribute', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMetadataAdministrationCommandService().createAttributeDefinition(
        session.tenantId as TenantId,
        session.personId,
        {
          code: value(formData, 'code'),
          name: value(formData, 'name'),
          description: optionalValue(formData, 'description'),
          dataType: enumValue(value(formData, 'dataType'), DATA_TYPES, 'Data type'),
          version: integerValue(value(formData, 'version'), 'Version'),
          unitCode: optionalValue(formData, 'unitCode'),
          enumerationDefinitionId: optionalValue(formData, 'enumerationDefinitionId'),
          referenceObjectFamily: optionalValue(formData, 'referenceObjectFamily'),
          effectiveFrom: optionalValue(formData, 'effectiveFrom'),
          effectiveTo: optionalValue(formData, 'effectiveTo')
        }
      );
      return { action: 'createAttribute', ok: true, message: `Attribute ${item.code} v${item.version} created.` };
    } catch (error) { return failure(error, 'createAttribute'); }
  },

  assignAttribute: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'assignAttribute', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMetadataAdministrationCommandService().assignAttributeToType(
        session.tenantId as TenantId,
        session.personId,
        {
          typeDefinitionId: value(formData, 'typeDefinitionId'),
          attributeDefinitionId: value(formData, 'attributeDefinitionId'),
          sequence: integerValue(value(formData, 'sequence'), 'Sequence'),
          required: value(formData, 'required') === 'true',
          cardinality: enumValue(value(formData, 'cardinality'), CARDINALITIES, 'Cardinality'),
          localLabel: optionalValue(formData, 'localLabel'),
          defaultValue: jsonAny(value(formData, 'defaultValue'), 'Default value')
        }
      );
      return { action: 'assignAttribute', ok: true, message: `Attribute assignment ${item.id} created.` };
    } catch (error) { return failure(error, 'assignAttribute'); }
  },

  createConstraint: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'createConstraint', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMetadataAdministrationCommandService().createConstraintDefinition(
        session.tenantId as TenantId,
        session.personId,
        {
          code: value(formData, 'code'),
          name: value(formData, 'name'),
          description: optionalValue(formData, 'description'),
          constraintType: enumValue(
            value(formData, 'constraintType'),
            CONSTRAINT_TYPES,
            'Constraint type'
          ),
          configuration: jsonObject(value(formData, 'configuration'), 'Configuration'),
          version: integerValue(value(formData, 'version'), 'Version'),
          effectiveFrom: optionalValue(formData, 'effectiveFrom'),
          effectiveTo: optionalValue(formData, 'effectiveTo')
        }
      );
      return { action: 'createConstraint', ok: true, message: `Constraint ${item.code} v${item.version} created.` };
    } catch (error) { return failure(error, 'createConstraint'); }
  },

  assignConstraint: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'assignConstraint', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMetadataAdministrationCommandService().assignConstraintToAttribute(
        session.tenantId as TenantId,
        session.personId,
        {
          typeAttributeAssignmentId: value(formData, 'typeAttributeAssignmentId'),
          constraintDefinitionId: value(formData, 'constraintDefinitionId'),
          sequence: integerValue(value(formData, 'sequence'), 'Sequence'),
          mandatory: value(formData, 'mandatory') !== 'false'
        }
      );
      return { action: 'assignConstraint', ok: true, message: `Constraint assignment ${item.id} created.` };
    } catch (error) { return failure(error, 'assignConstraint'); }
  }
};
