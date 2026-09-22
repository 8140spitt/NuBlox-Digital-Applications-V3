import type {
  FunctionalDeploymentView,
  IndustryDeliveryProjection,
  OrganisationStructureProjection
} from '@nublox/persistence';

export type TeamContextSelection = {
  key: string;
  kind: 'TENANT' | 'ORGANISATION' | 'ORGANISATION_UNIT';
  name: string;
  pathLabel: string;
  organisationId?: string;
  organisationUnitId?: string;
};

function organisationName(
  organisation: OrganisationStructureProjection['organisations'][number]
): string {
  return organisation.tradingName ?? organisation.legalName;
}

function unitPath(
  unit: OrganisationStructureProjection['organisations'][number]['units'][number],
  units: OrganisationStructureProjection['organisations'][number]['units']
): string[] {
  const byId = new Map(units.map((item) => [item.id, item]));
  const path: string[] = [unit.name];
  const visited = new Set<string>([unit.id]);
  let parentId = unit.parentUnitId;

  while (parentId) {
    if (visited.has(parentId)) break;
    visited.add(parentId);
    const parent = byId.get(parentId);
    if (!parent) break;
    path.unshift(parent.name);
    parentId = parent.parentUnitId;
  }

  return path;
}

export function buildTeamContextOptions(
  tenantName: string,
  structure: OrganisationStructureProjection | null
): TeamContextSelection[] {
  const options: TeamContextSelection[] = [
    {
      key: 'tenant',
      kind: 'TENANT',
      name: tenantName,
      pathLabel: tenantName
    }
  ];

  if (!structure) return options;

  for (const organisation of structure.organisations.filter((item) => item.status === 'ACTIVE')) {
    const name = organisationName(organisation);
    options.push({
      key: `org:${organisation.id}`,
      kind: 'ORGANISATION',
      name,
      pathLabel: `${tenantName} / ${name}`,
      organisationId: organisation.id
    });

    for (const unit of organisation.units.filter((item) => item.status === 'ACTIVE')) {
      const path = unitPath(unit, organisation.units);
      options.push({
        key: `unit:${unit.id}`,
        kind: 'ORGANISATION_UNIT',
        name: unit.name,
        pathLabel: [tenantName, name, ...path].join(' / '),
        organisationId: organisation.id,
        organisationUnitId: unit.id
      });
    }
  }

  return options;
}

export function resolveTeamContext(
  requested: string | null,
  options: TeamContextSelection[]
): TeamContextSelection {
  return options.find((option) => option.key === requested) ?? options[0];
}

export function functionalDeploymentMatchesContext(
  deployment: FunctionalDeploymentView,
  context: TeamContextSelection
): boolean {
  if (context.kind === 'TENANT') {
    return !deployment.organisationId && !deployment.organisationUnitId;
  }
  if (context.kind === 'ORGANISATION') {
    return deployment.organisationId === context.organisationId && !deployment.organisationUnitId;
  }
  return deployment.organisationUnitId === context.organisationUnitId;
}

type DomainDeployment = IndustryDeliveryProjection['disciplineDeployments'][number];

export function domainDeploymentMatchesContext(
  deployment: DomainDeployment,
  context: TeamContextSelection
): boolean {
  if (context.kind === 'TENANT') {
    return !deployment.organisationId && !deployment.organisationUnitId;
  }
  if (context.kind === 'ORGANISATION') {
    return deployment.organisationId === context.organisationId && !deployment.organisationUnitId;
  }
  return deployment.organisationUnitId === context.organisationUnitId;
}
