import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { TenantId } from '@nublox/kernel';

interface OrganisationRow extends RowDataPacket {
  id: string;
  legal_name: string;
  trading_name: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

interface UnitRow extends RowDataPacket {
  id: string;
  organisation_id: string;
  parent_unit_id: string | null;
  code: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface PositionRow extends RowDataPacket {
  id: string;
  organisation_unit_id: string;
  code: string;
  title: string;
  job_profile_id: string | null;
  job_profile_name: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

interface OccupancyRow extends RowDataPacket {
  id: string;
  position_id: string;
  person_id: string;
  person_name: string;
  effective_from: Date;
  effective_to: Date | null;
}

interface PersonRow extends RowDataPacket {
  id: string;
  legal_name: string;
  preferred_name: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface OrganisationOccupantView {
  occupancyId: string;
  personId: string;
  personName: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface OrganisationPositionView {
  id: string;
  code: string;
  title: string;
  jobProfileId?: string;
  jobProfileName?: string;
  status: 'ACTIVE' | 'INACTIVE';
  occupants: OrganisationOccupantView[];
}

export interface OrganisationUnitView {
  id: string;
  parentUnitId?: string;
  code: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  positions: OrganisationPositionView[];
}

export interface OrganisationView {
  id: string;
  legalName: string;
  tradingName?: string;
  status: 'ACTIVE' | 'INACTIVE';
  units: OrganisationUnitView[];
}

export interface OrganisationPersonView {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  hasCurrentPosition: boolean;
}

export interface OrganisationStructureProjection {
  organisations: OrganisationView[];
  people: OrganisationPersonView[];
  totals: {
    organisations: number;
    units: number;
    positions: number;
    occupiedPositions: number;
    people: number;
    unassignedPeople: number;
  };
}

export class MySqlOrganisationReadRepository {
  constructor(private readonly pool: Pool) {}

  async getStructure(
    tenantId: TenantId,
    evaluatedAt = new Date().toISOString()
  ): Promise<OrganisationStructureProjection> {
    const at = new Date(evaluatedAt);
    if (Number.isNaN(at.getTime())) {
      throw new Error('Organisation structure evaluation time is invalid.');
    }

    const [organisationRows, unitRows, positionRows, occupancyRows, personRows] =
      await Promise.all([
        this.pool.execute<OrganisationRow[]>(
          `SELECT id, legal_name, trading_name, status
             FROM organisations
            WHERE tenant_id = ?
            ORDER BY status = 'ACTIVE' DESC, COALESCE(trading_name, legal_name), id`,
          [tenantId]
        ),
        this.pool.execute<UnitRow[]>(
          `SELECT id, organisation_id, parent_unit_id, code, name, status
             FROM organisation_units
            WHERE tenant_id = ?
            ORDER BY status = 'ACTIVE' DESC, code, name, id`,
          [tenantId]
        ),
        this.pool.execute<PositionRow[]>(
          `SELECT p.id, p.organisation_unit_id, p.code, p.title, p.job_profile_id,
                  jp.name AS job_profile_name, p.status
             FROM positions p
             LEFT JOIN job_profiles jp ON jp.id = p.job_profile_id
            WHERE p.tenant_id = ?
            ORDER BY p.status = 'ACTIVE' DESC, p.code, p.title, p.id`,
          [tenantId]
        ),
        this.pool.execute<OccupancyRow[]>(
          `SELECT po.id, po.position_id, po.person_id,
                  COALESCE(pr.preferred_name, pr.legal_name) AS person_name,
                  po.effective_from, po.effective_to
             FROM position_occupancies po
             JOIN persons pr
               ON pr.tenant_id = po.tenant_id
              AND pr.id = po.person_id
            WHERE po.tenant_id = ?
              AND po.effective_from <= ?
              AND (po.effective_to IS NULL OR po.effective_to >= ?)
              AND pr.status = 'ACTIVE'
            ORDER BY person_name, po.id`,
          [tenantId, at, at]
        ),
        this.pool.execute<PersonRow[]>(
          `SELECT id, legal_name, preferred_name, status
             FROM persons
            WHERE tenant_id = ?
            ORDER BY status = 'ACTIVE' DESC, COALESCE(preferred_name, legal_name), id`,
          [tenantId]
        )
      ]);

    const organisations = organisationRows[0];
    const units = unitRows[0];
    const positions = positionRows[0];
    const occupancies = occupancyRows[0];
    const people = personRows[0];

    const occupantsByPosition = new Map<string, OrganisationOccupantView[]>();
    const occupiedPersonIds = new Set<string>();

    for (const row of occupancies) {
      const list = occupantsByPosition.get(row.position_id) ?? [];
      list.push({
        occupancyId: row.id,
        personId: row.person_id,
        personName: row.person_name,
        effectiveFrom: row.effective_from.toISOString(),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {})
      });
      occupantsByPosition.set(row.position_id, list);
      occupiedPersonIds.add(row.person_id);
    }

    const positionsByUnit = new Map<string, OrganisationPositionView[]>();
    for (const row of positions) {
      const list = positionsByUnit.get(row.organisation_unit_id) ?? [];
      list.push({
        id: row.id,
        code: row.code,
        title: row.title,
        ...(row.job_profile_id ? { jobProfileId: row.job_profile_id } : {}),
        ...(row.job_profile_name ? { jobProfileName: row.job_profile_name } : {}),
        status: row.status,
        occupants: occupantsByPosition.get(row.id) ?? []
      });
      positionsByUnit.set(row.organisation_unit_id, list);
    }

    const unitsByOrganisation = new Map<string, OrganisationUnitView[]>();
    for (const row of units) {
      const list = unitsByOrganisation.get(row.organisation_id) ?? [];
      list.push({
        id: row.id,
        ...(row.parent_unit_id ? { parentUnitId: row.parent_unit_id } : {}),
        code: row.code,
        name: row.name,
        status: row.status,
        positions: positionsByUnit.get(row.id) ?? []
      });
      unitsByOrganisation.set(row.organisation_id, list);
    }

    const organisationViews: OrganisationView[] = organisations.map((row) => ({
      id: row.id,
      legalName: row.legal_name,
      ...(row.trading_name ? { tradingName: row.trading_name } : {}),
      status: row.status,
      units: unitsByOrganisation.get(row.id) ?? []
    }));

    const personViews: OrganisationPersonView[] = people.map((row) => ({
      id: row.id,
      name: row.preferred_name ?? row.legal_name,
      status: row.status,
      hasCurrentPosition: occupiedPersonIds.has(row.id)
    }));

    return {
      organisations: organisationViews,
      people: personViews,
      totals: {
        organisations: organisations.length,
        units: units.length,
        positions: positions.length,
        occupiedPositions: positions.filter((row) =>
          (occupantsByPosition.get(row.id)?.length ?? 0) > 0
        ).length,
        people: people.length,
        unassignedPeople: personViews.filter(
          (person) => person.status === 'ACTIVE' && !person.hasCurrentPosition
        ).length
      }
    };
  }
}
