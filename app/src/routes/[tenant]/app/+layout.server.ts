import type { LayoutServerLoad } from './$types';
import { listLegalEntities } from '$lib/server/foundation-legal-entity';
import { listOrganisationUnits } from '$lib/server/organisation-structure';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { listOpenWorkContexts } from '$lib/server/work-context';

export const load: LayoutServerLoad = async ({ params, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const canReadParties = hasPermission(context, 'party.read');
  const canReadOrganisation = hasPermission(context, 'org.structure.read');

  const [workContexts, legalEntities, organisationUnits] = await Promise.all([
    listOpenWorkContexts(context),
    canReadParties ? listLegalEntities(context) : Promise.resolve([]),
    canReadOrganisation ? listOrganisationUnits(context) : Promise.resolve([])
  ]);

  return {
    tenantSlug: context.tenantSlug,
    actorDisplayName: context.actorDisplayName,
    roleKeys: context.roleKeys,
    authenticated: Boolean(locals.user),
    workContexts,
    enterpriseContextOptions: {
      legalEntities: legalEntities
        .filter(
          (entity) => entity.partyStatus === 'ACTIVE' && entity.legalEntityStatus === 'ACTIVE'
        )
        .map((entity) => ({
          id: entity.id,
          reference: entity.statutoryIdentifier ?? entity.displayName,
          label: entity.displayName
        })),
      organisationUnits: organisationUnits
        .filter((unit) => unit.status === 'ACTIVE')
        .map((unit) => ({
          id: unit.id,
          reference: unit.unitCode,
          label: unit.name,
          legalEntityId: unit.accountableLegalEntityPartyId
        }))
    }
  };
};
