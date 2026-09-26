import { randomUUID } from 'node:crypto';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';
import type { TenantSizeTier } from './tenant-provisioning-service.js';

export type CbeArchetypeCode = 'CON' | 'MC' | 'SUB' | 'SUP' | 'CLI';
export type CbeContractualPositionCode = 'PRIME' | 'PACKAGE' | 'ADVISORY' | 'EMPLOYER';
export type TenantFunctionConfigurationState =
  | 'DEFAULT_ENABLED'
  | 'AVAILABLE_DISABLED'
  | 'HIDDEN_NOT_APPLICABLE';

export interface CbeOperatingProfileInput {
  archetypeCode: CbeArchetypeCode;
  contractualPositionCode: CbeContractualPositionCode;
  employsOperatives: boolean;
}

export interface CbeOperatingProfileCatalogue {
  archetypes: Array<{ code: CbeArchetypeCode; name: string; description: string }>;
  contractualPositions: Array<{
    code: CbeContractualPositionCode;
    name: string;
    effectiveArchetypeCode: CbeArchetypeCode;
    description: string;
  }>;
}

export interface CbeOperatingProfileResolution {
  resolverVersion: number;
  provisioningCode: string;
  intakeArchetypeCode: CbeArchetypeCode;
  effectiveArchetypeCode: CbeArchetypeCode;
  contractualPositionCode: CbeContractualPositionCode;
  employsOperatives: boolean;
  sizeBand: 'T1' | 'T2' | 'T3' | 'T4';
  summary: {
    totalFunctions: number;
    defaultEnabled: number;
    availableDisabled: number;
    hiddenNotApplicable: number;
  };
  functions: Array<{
    functionId: string;
    code: string;
    name: string;
    functionFamily: 'CORE_BUSINESS' | 'CBE';
    recommendationState: TenantFunctionConfigurationState;
    rationale: string;
  }>;
  capabilityAdders: Array<{
    code: string;
    name: string;
    capabilityType: 'SUB_FUNCTION';
    sizeBand: string;
  }>;
}

export class CbeOperatingProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CbeOperatingProfileError';
  }
}

interface ArchetypeRow extends RowDataPacket {
  code: CbeArchetypeCode;
  name: string;
  description: string;
}

interface ContractRow extends RowDataPacket {
  code: CbeContractualPositionCode;
  name: string;
  effective_archetype_code: CbeArchetypeCode;
  description: string;
}

interface FunctionRow extends RowDataPacket {
  id: string;
  code: string;
  name: string;
  function_family: 'CORE_BUSINESS' | 'CBE';
}

interface FunctionRuleRow extends RowDataPacket {
  function_id: string;
  recommendation_state: TenantFunctionConfigurationState;
  rationale: string;
}

interface SizeAdderRow extends RowDataPacket {
  size_band: string;
  band_rank: number;
  capability_type: 'FUNCTION' | 'SUB_FUNCTION';
  function_id: string | null;
  sub_function_id: string | null;
  capability_name: string;
  rationale: string;
}

interface CountRow extends RowDataPacket {
  count: number | string;
}

const RESOLVER_VERSION = 1;

const SIZE_BAND: Record<TenantSizeTier, { code: 'T1' | 'T2' | 'T3' | 'T4'; rank: number }> = {
  MICRO: { code: 'T1', rank: 1 },
  SMALL: { code: 'T2', rank: 2 },
  MEDIUM: { code: 'T3', rank: 3 },
  LARGE: { code: 'T4', rank: 4 },
  ENTERPRISE: { code: 'T4', rank: 4 }
};

function asCode(value: string, label: string): string {
  const normalized = value.trim().toUpperCase();
  if (!normalized) throw new CbeOperatingProfileError(`${label} is required.`);
  return normalized;
}

function atLeastAvailable(
  current: TenantFunctionConfigurationState
): TenantFunctionConfigurationState {
  return current === 'HIDDEN_NOT_APPLICABLE' ? 'AVAILABLE_DISABLED' : current;
}

export class MySqlCbeOperatingProfileService {
  constructor(private readonly pool: Pool) {}

  async catalogue(): Promise<CbeOperatingProfileCatalogue> {
    const [archetypeRows, contractRows] = await Promise.all([
      this.pool.query<ArchetypeRow[]>(
        `SELECT code,name,description
           FROM cbe_operating_archetypes
          WHERE status='ACTIVE'
          ORDER BY FIELD(code,'CON','MC','SUB','SUP','CLI'),code`
      ),
      this.pool.query<ContractRow[]>(
        `SELECT code,name,effective_archetype_code,description
           FROM cbe_contractual_positions
          WHERE status='ACTIVE'
          ORDER BY FIELD(code,'ADVISORY','PRIME','PACKAGE','EMPLOYER'),code`
      )
    ]);

    return {
      archetypes: archetypeRows[0].map((row) => ({
        code: row.code,
        name: row.name,
        description: row.description
      })),
      contractualPositions: contractRows[0].map((row) => ({
        code: row.code,
        name: row.name,
        effectiveArchetypeCode: row.effective_archetype_code,
        description: row.description
      }))
    };
  }

  async preview(
    sizeTier: TenantSizeTier,
    input: CbeOperatingProfileInput
  ): Promise<CbeOperatingProfileResolution> {
    const connection = await this.pool.getConnection();
    try {
      return await this.resolve(connection, sizeTier, input);
    } finally {
      connection.release();
    }
  }

  async applyToExistingTenant(
    tenantId: string,
    actorPersonId: string,
    sizeTier: TenantSizeTier,
    input: CbeOperatingProfileInput,
    provisioningRunId?: string
  ): Promise<CbeOperatingProfileResolution> {
    return withTransaction(this.pool, (connection) =>
      this.applyToTenant(
        connection,
        tenantId,
        actorPersonId,
        sizeTier,
        input,
        provisioningRunId
      )
    );
  }

  async applyToTenant(
    connection: PoolConnection,
    tenantId: string,
    actorPersonId: string,
    sizeTier: TenantSizeTier,
    input: CbeOperatingProfileInput,
    provisioningRunId?: string
  ): Promise<CbeOperatingProfileResolution> {
    const [industryRows] = await connection.execute<Array<RowDataPacket & { tenant_id: string }>>(
      `SELECT tenant_id
         FROM tenant_industry_solution_assignments
        WHERE tenant_id=?
          AND industry_solution_id='CBE'
          AND status='ACTIVE'
        LIMIT 1`,
      [tenantId]
    );
    if (!industryRows[0]) {
      throw new CbeOperatingProfileError(
        'The CBE operating profile can only be applied to a Tenant with the CBE Industry Solution.'
      );
    }

    const [existingRows] = await connection.execute<CountRow[]>(
      `SELECT COUNT(*) AS count
         FROM tenant_cbe_operating_profiles
        WHERE tenant_id=?
        FOR UPDATE`,
      [tenantId]
    );
    if (Number(existingRows[0]?.count ?? 0) > 0) {
      throw new CbeOperatingProfileError(
        'This Tenant already has a governed CBE operating profile. Changes require configuration reassessment.'
      );
    }

    const resolution = await this.resolve(connection, sizeTier, input);
    const now = new Date();

    await connection.execute(
      `INSERT INTO tenant_cbe_operating_profiles
        (tenant_id,resolver_version,intake_archetype_code,effective_archetype_code,
         contractual_position_code,employs_operatives,size_band,provisioning_code,
         profile_snapshot,created_at,created_by_person_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        tenantId,
        resolution.resolverVersion,
        resolution.intakeArchetypeCode,
        resolution.effectiveArchetypeCode,
        resolution.contractualPositionCode,
        resolution.employsOperatives,
        resolution.sizeBand,
        resolution.provisioningCode,
        JSON.stringify(resolution),
        now,
        actorPersonId
      ]
    );

    for (const item of resolution.functions) {
      await connection.execute(
        `INSERT INTO tenant_function_configurations
          (tenant_id,function_id,recommendation_state,effective_state,source_profile_code,
           rationale,created_at,created_by_person_id,updated_by_person_id)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [
          tenantId,
          item.functionId,
          item.recommendationState,
          item.recommendationState,
          resolution.provisioningCode,
          item.rationale,
          now,
          actorPersonId,
          actorPersonId
        ]
      );
    }

    if (provisioningRunId) {
      await connection.execute(
        `INSERT INTO tenant_provisioning_steps
          (id,provisioning_run_id,step_key,sequence,status,evidence,started_at,completed_at)
         VALUES (?,?,'CBE_OPERATING_PROFILE',27,'APPLIED',?,?,?)`,
        [
          `TPS-${randomUUID()}`,
          provisioningRunId,
          JSON.stringify({
            provisioningCode: resolution.provisioningCode,
            resolverVersion: resolution.resolverVersion,
            intakeArchetypeCode: resolution.intakeArchetypeCode,
            effectiveArchetypeCode: resolution.effectiveArchetypeCode,
            contractualPositionCode: resolution.contractualPositionCode,
            employsOperatives: resolution.employsOperatives,
            sizeBand: resolution.sizeBand,
            summary: resolution.summary,
            capabilityAdders: resolution.capabilityAdders
          }),
          now,
          now
        ]
      );
    }

    await connection.execute(
      `INSERT INTO kernel_audit_entries
        (tenant_id,entity_type,entity_id,action,actor_person_id,correlation_id,payload)
       VALUES (?,'TENANT_CBE_OPERATING_PROFILE',?,'RESOLVED',?,?,?)`,
      [
        tenantId,
        tenantId,
        actorPersonId,
        `CBE-OPERATING-PROFILE:${tenantId}`,
        JSON.stringify({
          provisioningCode: resolution.provisioningCode,
          resolverVersion: resolution.resolverVersion,
          summary: resolution.summary
        })
      ]
    );

    await writeOutboxEvent(connection, {
      tenantId,
      aggregateType: 'TENANT_CBE_OPERATING_PROFILE',
      aggregateId: tenantId,
      eventType: 'TENANT_CBE_OPERATING_PROFILE.RESOLVED',
      payload: {
        provisioningCode: resolution.provisioningCode,
        resolverVersion: resolution.resolverVersion,
        summary: resolution.summary
      }
    });

    return resolution;
  }

  private async resolve(
    connection: PoolConnection,
    sizeTier: TenantSizeTier,
    input: CbeOperatingProfileInput
  ): Promise<CbeOperatingProfileResolution> {
    const size = SIZE_BAND[sizeTier];
    if (!size) throw new CbeOperatingProfileError('Business size tier is not valid.');

    const archetypeCode = asCode(input.archetypeCode, 'CBE business archetype') as CbeArchetypeCode;
    const contractualPositionCode = asCode(
      input.contractualPositionCode,
      'CBE contractual position'
    ) as CbeContractualPositionCode;

    const [[archetypes], [contracts], [functions], [baseRules], [sizeAdders]] =
      await Promise.all([
        connection.query<ArchetypeRow[]>(
          `SELECT code,name,description
             FROM cbe_operating_archetypes
            WHERE code=? AND status='ACTIVE'
            LIMIT 1`,
          [archetypeCode]
        ),
        connection.query<ContractRow[]>(
          `SELECT code,name,effective_archetype_code,description
             FROM cbe_contractual_positions
            WHERE code=? AND status='ACTIVE'
            LIMIT 1`,
          [contractualPositionCode]
        ),
        connection.query<FunctionRow[]>(
          `SELECT id,code,name,function_family
             FROM function_definitions
            WHERE status='ACTIVE'
              AND (
                function_family='CORE_BUSINESS'
                OR (function_family='CBE' AND industry_solution_id='CBE')
              )
            ORDER BY CASE function_family WHEN 'CORE_BUSINESS' THEN 0 ELSE 1 END,code`
        ),
        connection.query<FunctionRuleRow[]>(
          `SELECT r.function_id,'DEFAULT_ENABLED' AS recommendation_state,r.rationale
             FROM cbe_base_function_rules r
             JOIN function_definitions f ON f.id=r.function_id AND f.status='ACTIVE'
            ORDER BY f.code`
        ),
        connection.query<SizeAdderRow[]>(
          `SELECT size_band,band_rank,capability_type,function_id,sub_function_id,
                  capability_name,rationale
             FROM cbe_size_capability_adders
            WHERE band_rank<=?
            ORDER BY band_rank,capability_type,capability_name`,
          [size.rank]
        )
      ]);

    if (!archetypes[0]) {
      throw new CbeOperatingProfileError('CBE business archetype is not available.');
    }
    const contract = contracts[0];
    if (!contract) {
      throw new CbeOperatingProfileError('CBE contractual position is not available.');
    }
    if (functions.length !== 45) {
      throw new CbeOperatingProfileError(
        `CBE operating profile expected 45 canonical Functions but found ${functions.length}.`
      );
    }

    const [archetypeRules] = await connection.query<FunctionRuleRow[]>(
      `SELECT function_id,recommendation_state,rationale
         FROM cbe_archetype_function_rules
        WHERE archetype_code=?
        ORDER BY function_id`,
      [contract.effective_archetype_code]
    );

    const states = new Map<
      string,
      { state: TenantFunctionConfigurationState; rationale: string }
    >();

    for (const item of functions) {
      states.set(item.id, {
        state:
          item.function_family === 'CORE_BUSINESS'
            ? 'AVAILABLE_DISABLED'
            : 'HIDDEN_NOT_APPLICABLE',
        rationale:
          item.function_family === 'CORE_BUSINESS'
            ? 'Canonical Core Business Function retained as available; this CBE profile does not enable it by default.'
            : 'Canonical CBE Function is hidden by default unless the CBE operating profile marks it applicable.'
      });
    }

    for (const rule of baseRules) {
      states.set(rule.function_id, {
        state: 'DEFAULT_ENABLED',
        rationale: rule.rationale
      });
    }

    for (const adder of sizeAdders) {
      if (adder.capability_type !== 'FUNCTION' || !adder.function_id) continue;
      states.set(adder.function_id, {
        state: 'DEFAULT_ENABLED',
        rationale: `${adder.rationale} Applied through cumulative ${adder.size_band} size configuration.`
      });
    }

    for (const rule of archetypeRules) {
      states.set(rule.function_id, {
        state: rule.recommendation_state,
        rationale: rule.rationale
      });
    }

    if (input.employsOperatives) {
      for (const functionId of ['D07', 'D08', 'D11']) {
        const current = states.get(functionId);
        if (current) {
          states.set(functionId, {
            state: atLeastAvailable(current.state),
            rationale:
              'Direct operative/trade employment makes this physical-delivery capability available for Tenant confirmation.'
          });
        }
      }
      const siteDelivery = states.get('D06');
      if (siteDelivery) {
        states.set('D06', {
          state: 'DEFAULT_ENABLED',
          rationale:
            'Direct operative/trade employment requires site-delivery coordination to be enabled by default.'
        });
      }
      const serviceDelivery = states.get('F12');
      if (serviceDelivery) {
        states.set('F12', {
          state: 'DEFAULT_ENABLED',
          rationale:
            'Direct operative/trade employment requires service and field-delivery coordination.'
        });
      }
    }

    const resolvedFunctions = functions.map((item) => {
      const resolved = states.get(item.id)!;
      return {
        functionId: item.id,
        code: item.code,
        name: item.name,
        functionFamily: item.function_family,
        recommendationState: resolved.state,
        rationale: resolved.rationale
      };
    });

    const capabilityAdders = sizeAdders
      .filter(
        (adder): adder is SizeAdderRow & { sub_function_id: string } =>
          adder.capability_type === 'SUB_FUNCTION' && Boolean(adder.sub_function_id)
      )
      .map((adder) => ({
        code: adder.sub_function_id,
        name: adder.capability_name,
        capabilityType: 'SUB_FUNCTION' as const,
        sizeBand: adder.size_band
      }));

    const provisioningCode = [
      'CBE',
      `V${RESOLVER_VERSION}`,
      contract.effective_archetype_code,
      contractualPositionCode,
      input.employsOperatives ? 'OPS' : 'NOOPS',
      size.code
    ].join('.');

    return {
      resolverVersion: RESOLVER_VERSION,
      provisioningCode,
      intakeArchetypeCode: archetypeCode,
      effectiveArchetypeCode: contract.effective_archetype_code,
      contractualPositionCode,
      employsOperatives: input.employsOperatives,
      sizeBand: size.code,
      summary: {
        totalFunctions: resolvedFunctions.length,
        defaultEnabled: resolvedFunctions.filter(
          (item) => item.recommendationState === 'DEFAULT_ENABLED'
        ).length,
        availableDisabled: resolvedFunctions.filter(
          (item) => item.recommendationState === 'AVAILABLE_DISABLED'
        ).length,
        hiddenNotApplicable: resolvedFunctions.filter(
          (item) => item.recommendationState === 'HIDDEN_NOT_APPLICABLE'
        ).length
      },
      functions: resolvedFunctions,
      capabilityAdders
    };
  }
}
