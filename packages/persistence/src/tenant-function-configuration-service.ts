import type { Pool, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';

export type TenantFunctionConfigurationState =
  | 'DEFAULT_ENABLED'
  | 'AVAILABLE_DISABLED'
  | 'HIDDEN_NOT_APPLICABLE';

export interface TenantFunctionConfigurationProjection {
  provisioningCode: string;
  resolverVersion: number;
  intakeArchetypeCode: string;
  effectiveArchetypeCode: string;
  contractualPositionCode: string;
  employsOperatives: boolean;
  sizeBand: string;
  functions: Array<{
    functionId: string;
    code: string;
    name: string;
    functionFamily: 'CORE_BUSINESS' | 'CBE';
    recommendationState: TenantFunctionConfigurationState;
    effectiveState: TenantFunctionConfigurationState;
    rationale: string;
    updatedAt: string;
  }>;
}

export class TenantFunctionConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantFunctionConfigurationError';
  }
}

interface ProfileRow extends RowDataPacket {
  resolver_version: number;
  intake_archetype_code: string;
  effective_archetype_code: string;
  contractual_position_code: string;
  employs_operatives: number | boolean;
  size_band: string;
  provisioning_code: string;
}

interface FunctionRow extends RowDataPacket {
  function_id: string;
  code: string;
  name: string;
  function_family: 'CORE_BUSINESS' | 'CBE';
  recommendation_state: TenantFunctionConfigurationState;
  effective_state: TenantFunctionConfigurationState;
  rationale: string;
  updated_at: Date;
}

export class MySqlTenantFunctionConfigurationService {
  constructor(private readonly pool: Pool) {}

  async getTenantConfiguration(
    tenantId: string
  ): Promise<TenantFunctionConfigurationProjection | null> {
    const [profiles] = await this.pool.execute<ProfileRow[]>(
      `SELECT resolver_version,intake_archetype_code,effective_archetype_code,
              contractual_position_code,employs_operatives,size_band,provisioning_code
         FROM tenant_cbe_operating_profiles
        WHERE tenant_id=? LIMIT 1`,
      [tenantId]
    );
    const profile = profiles[0];
    if (!profile) return null;

    const [functions] = await this.pool.execute<FunctionRow[]>(
      `SELECT c.function_id,f.code,f.name,f.function_family,
              c.recommendation_state,c.effective_state,c.rationale,c.updated_at
         FROM tenant_function_configurations c
         JOIN function_definitions f ON f.id=c.function_id
        WHERE c.tenant_id=?
        ORDER BY CASE f.function_family WHEN 'CORE_BUSINESS' THEN 0 ELSE 1 END,f.code`,
      [tenantId]
    );

    return {
      provisioningCode: profile.provisioning_code,
      resolverVersion: Number(profile.resolver_version),
      intakeArchetypeCode: profile.intake_archetype_code,
      effectiveArchetypeCode: profile.effective_archetype_code,
      contractualPositionCode: profile.contractual_position_code,
      employsOperatives: Boolean(profile.employs_operatives),
      sizeBand: profile.size_band,
      functions: functions.map((row) => ({
        functionId: row.function_id,
        code: row.code,
        name: row.name,
        functionFamily: row.function_family,
        recommendationState: row.recommendation_state,
        effectiveState: row.effective_state,
        rationale: row.rationale,
        updatedAt: row.updated_at.toISOString()
      }))
    };
  }

  async setEffectiveState(input: {
    tenantId: string;
    actorPersonId: string;
    functionId: string;
    effectiveState: 'DEFAULT_ENABLED' | 'AVAILABLE_DISABLED';
    reason: string;
  }): Promise<void> {
    const reason = input.reason.trim();
    if (!reason) throw new TenantFunctionConfigurationError('A reason is required for a Function configuration change.');

    await withTransaction(this.pool, async (connection) => {
      const [rows] = await connection.execute<Array<RowDataPacket & {
        recommendation_state: TenantFunctionConfigurationState;
        effective_state: TenantFunctionConfigurationState;
        code: string;
      }>>(
        `SELECT c.recommendation_state,c.effective_state,f.code
           FROM tenant_function_configurations c
           JOIN function_definitions f ON f.id=c.function_id
          WHERE c.tenant_id=? AND c.function_id=?
          FOR UPDATE`,
        [input.tenantId, input.functionId]
      );
      const current = rows[0];
      if (!current) throw new TenantFunctionConfigurationError('Tenant Function configuration was not found.');
      if (
        current.recommendation_state === 'HIDDEN_NOT_APPLICABLE' &&
        input.effectiveState === 'DEFAULT_ENABLED'
      ) {
        throw new TenantFunctionConfigurationError(
          'A Function marked not applicable requires operating-profile reassessment before it can be enabled.'
        );
      }

      await connection.execute(
        `UPDATE tenant_function_configurations
            SET effective_state=?,updated_by_person_id=?
          WHERE tenant_id=? AND function_id=?`,
        [input.effectiveState, input.actorPersonId, input.tenantId, input.functionId]
      );

      await connection.execute(
        `INSERT INTO kernel_audit_entries
          (tenant_id,entity_type,entity_id,action,actor_person_id,correlation_id,payload)
         VALUES (?,'TENANT_FUNCTION_CONFIGURATION',?,'EFFECTIVE_STATE_CHANGED',?,?,?)`,
        [
          input.tenantId,
          input.functionId,
          input.actorPersonId,
          `TENANT-FUNCTION-CONFIG:${input.tenantId}:${input.functionId}`,
          JSON.stringify({
            functionCode: current.code,
            previousState: current.effective_state,
            effectiveState: input.effectiveState,
            recommendationState: current.recommendation_state,
            reason
          })
        ]
      );

      await writeOutboxEvent(connection, {
        tenantId: input.tenantId,
        aggregateType: 'TENANT_FUNCTION_CONFIGURATION',
        aggregateId: input.functionId,
        eventType: 'TENANT_FUNCTION_CONFIGURATION.EFFECTIVE_STATE_CHANGED',
        payload: {
          functionCode: current.code,
          previousState: current.effective_state,
          effectiveState: input.effectiveState,
          recommendationState: current.recommendation_state,
          reason,
          actorPersonId: input.actorPersonId
        }
      });
    });
  }
}
