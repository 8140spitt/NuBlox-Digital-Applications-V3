export type RuntimeObjectSection = 'overview' | 'work' | 'decisions' | 'evidence' | 'history';

export type RuntimeObjectDefinition = {
  type: string;
  subjectType: string;
  canonicalModelId: string;
  aggregateId: string;
  singular: string;
  plural: string;
  readPermission: string;
  sections: readonly RuntimeObjectSection[];
  auditObjectType: string;
  originFunctionId: string;
};

export const runtimeObjectDefinitions: readonly RuntimeObjectDefinition[] = [
  {
    type: 'lead',
    subjectType: 'LEAD',
    canonicalModelId: 'CRM-LEAD',
    aggregateId: 'AGG-03-LEAD',
    singular: 'Lead',
    plural: 'Leads',
    readPermission: 'marketing.read',
    sections: ['overview', 'work', 'decisions', 'evidence', 'history'],
    auditObjectType: 'lead',
    originFunctionId: 'F06'
  }
] as const;

function normalizeObjectType(value: string) {
  return value.trim().toLowerCase();
}

function requiredSegment(value: string, label: string) {
  const clean = value.trim();
  if (!clean) throw new Error(label + ' is required.');
  return clean;
}

export function runtimeObjectDefinition(objectType: string): RuntimeObjectDefinition | null {
  const key = normalizeObjectType(objectType);
  return runtimeObjectDefinitions.find((definition) => definition.type === key) ?? null;
}

export function runtimeObjectDefinitionForSubject(
  subjectType: string
): RuntimeObjectDefinition | null {
  const key = subjectType.trim().toUpperCase();
  return runtimeObjectDefinitions.find((definition) => definition.subjectType === key) ?? null;
}

export function objectHref(
  tenantSlug: string,
  objectType: string,
  objectId: string,
  options?: { section?: RuntimeObjectSection; from?: string }
) {
  const tenant = requiredSegment(tenantSlug, 'Tenant slug');
  const definition = runtimeObjectDefinition(objectType);
  if (!definition) throw new Error('Runtime object type is not registered.');
  const id = requiredSegment(objectId, 'Object ID');
  const base =
    '/' +
    encodeURIComponent(tenant) +
    '/app/objects/' +
    encodeURIComponent(definition.type) +
    '/' +
    encodeURIComponent(id);
  const query = new URLSearchParams();
  if (options?.section && options.section !== 'overview') query.set('section', options.section);
  if (options?.from?.trim()) query.set('from', options.from.trim());
  return query.size ? base + '?' + query.toString() : base;
}

export function subjectObjectHref(
  tenantSlug: string,
  subjectType: string,
  subjectId: string,
  options?: { section?: RuntimeObjectSection; from?: string }
) {
  const definition = runtimeObjectDefinitionForSubject(subjectType);
  if (!definition) return null;
  return objectHref(tenantSlug, definition.type, subjectId, options);
}

export function validateRuntimeObjectRegistry() {
  const typeKeys = new Set(runtimeObjectDefinitions.map((definition) => definition.type));
  const subjectTypes = new Set(
    runtimeObjectDefinitions.map((definition) => definition.subjectType)
  );
  if (typeKeys.size !== runtimeObjectDefinitions.length) return false;
  if (subjectTypes.size !== runtimeObjectDefinitions.length) return false;
  return runtimeObjectDefinitions.every(
    (definition) =>
      definition.type === normalizeObjectType(definition.type) &&
      definition.subjectType === definition.subjectType.toUpperCase() &&
      Boolean(definition.canonicalModelId) &&
      Boolean(definition.aggregateId) &&
      Boolean(definition.readPermission) &&
      definition.sections.length > 0 &&
      definition.sections[0] === 'overview'
  );
}
