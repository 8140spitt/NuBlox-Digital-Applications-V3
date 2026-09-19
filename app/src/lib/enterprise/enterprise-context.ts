export const enterpriseContextDimensionDefinitions = [
  { key: 'legalEntity', queryKey: 'ctx.legalEntity', label: 'Legal entity' },
  { key: 'organisationUnit', queryKey: 'ctx.organisationUnit', label: 'Organisation unit' },
  { key: 'portfolio', queryKey: 'ctx.portfolio', label: 'Portfolio' },
  { key: 'programme', queryKey: 'ctx.programme', label: 'Programme' },
  { key: 'project', queryKey: 'ctx.project', label: 'Project' },
  { key: 'contract', queryKey: 'ctx.contract', label: 'Contract' },
  { key: 'site', queryKey: 'ctx.site', label: 'Site / property' },
  { key: 'location', queryKey: 'ctx.location', label: 'Space / location' },
  { key: 'system', queryKey: 'ctx.system', label: 'System / network' },
  { key: 'asset', queryKey: 'ctx.asset', label: 'Asset' }
] as const;

export type EnterpriseContextDimensionKey =
  (typeof enterpriseContextDimensionDefinitions)[number]['key'];

export type EnterpriseContextSelection = {
  id: string;
  reference: string | null;
  label: string | null;
};

export type EnterpriseContext = Partial<
  Record<EnterpriseContextDimensionKey, EnterpriseContextSelection>
>;

export type EnterpriseRuntimeContext = {
  tenantSlug: string;
  dimensions: EnterpriseContext;
  originFunctionId: string | null;
  currentObject: {
    type: string;
    id: string;
  } | null;
};

function clean(value: string | null | undefined, max = 500) {
  const result = value?.trim() ?? '';
  return result ? result.slice(0, max) : null;
}

function definitionFor(key: EnterpriseContextDimensionKey) {
  return enterpriseContextDimensionDefinitions.find((definition) => definition.key === key)!;
}

export function encodeEnterpriseContextSelection(selection: EnterpriseContextSelection) {
  const id = clean(selection.id, 191);
  if (!id) throw new Error('Enterprise context identity is required.');
  return [id, clean(selection.reference), clean(selection.label)]
    .map((value) => encodeURIComponent(value ?? ''))
    .join('~');
}

export function decodeEnterpriseContextSelection(
  value: string | null | undefined
): EnterpriseContextSelection | null {
  const raw = clean(value, 2000);
  if (!raw) return null;
  const parts = raw.split('~');
  try {
    const id = clean(decodeURIComponent(parts[0] ?? ''), 191);
    if (!id) return null;
    return {
      id,
      reference: clean(decodeURIComponent(parts[1] ?? '')),
      label: clean(decodeURIComponent(parts[2] ?? ''))
    };
  } catch {
    return null;
  }
}

export function parseEnterpriseContext(searchParams: URLSearchParams): EnterpriseContext {
  const context: EnterpriseContext = {};
  for (const definition of enterpriseContextDimensionDefinitions) {
    const selection = decodeEnterpriseContextSelection(searchParams.get(definition.queryKey));
    if (selection) context[definition.key] = selection;
  }
  return context;
}

export function enterpriseContextItems(context: EnterpriseContext) {
  return enterpriseContextDimensionDefinitions.flatMap((definition) => {
    const selection = context[definition.key];
    return selection ? [{ ...definition, selection }] : [];
  });
}

export function patchEnterpriseContextHref(
  currentUrl: URL,
  patch: Partial<Record<EnterpriseContextDimensionKey, EnterpriseContextSelection | null>>
) {
  const target = new URL(currentUrl.toString());
  for (const [key, selection] of Object.entries(patch) as Array<
    [EnterpriseContextDimensionKey, EnterpriseContextSelection | null]
  >) {
    const definition = definitionFor(key);
    if (selection) {
      target.searchParams.set(definition.queryKey, encodeEnterpriseContextSelection(selection));
    } else {
      target.searchParams.delete(definition.queryKey);
    }
  }
  return target.pathname + target.search + target.hash;
}

export function setEnterpriseContextHref(
  currentUrl: URL,
  key: EnterpriseContextDimensionKey,
  selection: EnterpriseContextSelection | null
) {
  return patchEnterpriseContextHref(currentUrl, { [key]: selection });
}

export function clearEnterpriseContextHref(currentUrl: URL) {
  const target = new URL(currentUrl.toString());
  for (const definition of enterpriseContextDimensionDefinitions) {
    target.searchParams.delete(definition.queryKey);
  }
  return target.pathname + target.search + target.hash;
}

export function contextPreservingHref(currentUrl: URL, targetHref: string, tenantSlug: string) {
  const current = parseEnterpriseContext(currentUrl.searchParams);
  if (!enterpriseContextItems(current).length) return targetHref;

  let target: URL;
  try {
    target = new URL(targetHref, currentUrl);
  } catch {
    return targetHref;
  }

  if (target.origin !== currentUrl.origin) return targetHref;
  const applicationRoot = '/' + encodeURIComponent(tenantSlug) + '/app';
  if (!(target.pathname === applicationRoot || target.pathname.startsWith(applicationRoot + '/'))) {
    return targetHref;
  }
  if (target.pathname.startsWith(applicationRoot + '/admin')) return targetHref;

  for (const definition of enterpriseContextDimensionDefinitions) {
    if (target.searchParams.has(definition.queryKey)) continue;
    const selection = current[definition.key];
    if (selection) {
      target.searchParams.set(definition.queryKey, encodeEnterpriseContextSelection(selection));
    }
  }

  return target.pathname + target.search + target.hash;
}

export function resolveEnterpriseRuntimeContext(
  currentUrl: URL,
  tenantSlug: string
): EnterpriseRuntimeContext {
  const objectMatch = currentUrl.pathname.match(/\/app\/objects\/([^/]+)\/([^/]+)$/);
  const origin = currentUrl.searchParams.get('from')?.match(/^F\d{2}(?:\.\d{2})?/i)?.[0] ?? null;

  return {
    tenantSlug,
    dimensions: parseEnterpriseContext(currentUrl.searchParams),
    originFunctionId: origin?.toUpperCase() ?? null,
    currentObject: objectMatch
      ? {
          type: decodeURIComponent(objectMatch[1]).toLowerCase(),
          id: decodeURIComponent(objectMatch[2])
        }
      : null
  };
}
