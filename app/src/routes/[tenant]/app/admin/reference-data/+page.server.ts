import type { PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { listClassificationSystems } from '$lib/server/classification-runtime';
import { listLifecycleDefinitions } from '$lib/server/lifecycle-configuration';

export const load: PageServerLoad = async ({ params, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const canReadClassifications = hasPermission(context, 'reference.classification.read');
  const canReadLifecycles = hasPermission(context, 'reference.lifecycle.read');

  const [classifications, lifecycles] = await Promise.all([
    canReadClassifications ? listClassificationSystems(context) : Promise.resolve([]),
    canReadLifecycles ? listLifecycleDefinitions(context) : Promise.resolve([])
  ]);

  return {
    tenantSlug: params.tenant,
    counts: {
      classifications: classifications.length,
      lifecycles: lifecycles.length
    },
    capabilities: { canReadClassifications, canReadLifecycles }
  };
};
