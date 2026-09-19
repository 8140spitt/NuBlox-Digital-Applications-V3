import type { PageServerLoad } from './$types';
import { enterpriseFunctions } from '$lib/enterprise/functions';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { searchRuntimeObjects } from '$lib/server/runtime-object-search';

type SearchDestination = {
  type: string;
  label: string;
  detail: string;
  href: string;
};

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const query = (url.searchParams.get('q') ?? '').trim().slice(0, 200);
  const needle = query.toLowerCase();

  const enterpriseDestinations: SearchDestination[] = [
    {
      type: 'Enterprise',
      label: 'Operate the Business',
      detail: 'Strategy, governance, performance and enterprise operations',
      href: '/' + params.tenant + '/app/operate'
    },
    {
      type: 'Enterprise',
      label: 'Deliver the Business',
      detail: 'Opportunity, contract, project, delivery and asset outcomes',
      href: '/' + params.tenant + '/app/deliver'
    },
    {
      type: 'Enterprise',
      label: 'Enterprise Data',
      detail: 'Parties, organisation, products, assets and reference data',
      href: '/' + params.tenant + '/app/data'
    },
    {
      type: 'Workspace',
      label: 'My Work',
      detail: 'Assignments, decisions, exceptions and accountable follow-up',
      href: '/' + params.tenant + '/app/work'
    }
  ];

  const functionDestinations: SearchDestination[] = enterpriseFunctions.map((fn) => ({
    type: 'Business function',
    label: fn.id + ' · ' + fn.shortName,
    detail: fn.name,
    href: '/' + params.tenant + '/app/functions/' + fn.id.toLowerCase()
  }));

  const destinations =
    query.length >= 2
      ? [...enterpriseDestinations, ...functionDestinations]
          .filter((destination) =>
            [destination.type, destination.label, destination.detail].some((value) =>
              value.toLowerCase().includes(needle)
            )
          )
          .slice(0, 20)
      : [];

  const objects = query.length >= 2 ? await searchRuntimeObjects(context, query, 30) : [];

  return {
    tenantSlug: params.tenant,
    query,
    objects,
    destinations,
    resultCount: objects.length + destinations.length
  };
};
