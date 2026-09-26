import type { Pool, RowDataPacket } from 'mysql2/promise';

export type PlatformGlobalSectionKey =
  | 'users'
  | 'templates'
  | 'industries'
  | 'metadata'
  | 'feature-flags'
  | 'provisioning'
  | 'migrations'
  | 'integrations'
  | 'jobs'
  | 'security'
  | 'audit'
  | 'metrics'
  | 'platform-configuration';

export type PlatformTenantSectionKey =
  | 'overview'
  | 'configuration'
  | 'people'
  | 'subscriptions'
  | 'usage'
  | 'health'
  | 'security'
  | 'sessions'
  | 'audit'
  | 'migrations'
  | 'provisioning'
  | 'suspend'
  | 'deletion';

export interface PlatformSectionDefinition {
  key: string;
  title: string;
  description: string;
}

export interface PlatformSectionView extends PlatformSectionDefinition {
  columns: string[];
  rows: Array<Record<string, string | number | boolean | null>>;
}

export interface PlatformDashboardMetric {
  label: string;
  value: number;
  detail: string;
}

export interface PlatformDashboardView {
  metrics: PlatformDashboardMetric[];
  globalSections: PlatformSectionDefinition[];
  recentAudit: Array<Record<string, string | number | boolean | null>>;
  attention: Array<Record<string, string | number | boolean | null>>;
}

export interface PlatformTenantHeader {
  tenantId: string;
  slug: string;
  name: string;
  tenantStatus: string;
  lifecycleState: string;
  lifecycleReason: string | null;
}

interface GenericRow extends RowDataPacket {
  [key: string]: unknown;
}

interface CountRow extends RowDataPacket {
  count: number | string;
}

interface TenantHeaderRow extends RowDataPacket {
  tenant_id: string;
  slug: string;
  name: string;
  tenant_status: string;
  lifecycle_state: string | null;
  lifecycle_reason: string | null;
}

const GLOBAL_SECTIONS: PlatformSectionDefinition[] = [
  { key: 'users', title: 'Users', description: 'Cross-Tenant application identities, membership footprint and sign-in state.' },
  { key: 'templates', title: 'Templates', description: 'Governed Tenant configuration templates used during provisioning.' },
  { key: 'industries', title: 'Industries', description: 'Industry Solutions and their current Tenant adoption.' },
  { key: 'metadata', title: 'Metadata', description: 'Tenant-governed type definitions across the metadata/Thing runtime.' },
  { key: 'feature-flags', title: 'Feature flags', description: 'Provider-controlled product flags and default availability.' },
  { key: 'provisioning', title: 'Provisioning', description: 'Tenant provisioning runs and failures across the platform.' },
  { key: 'migrations', title: 'Migrations', description: 'Authoritative platform schema migration state.' },
  { key: 'integrations', title: 'Integrations', description: 'Provider and Tenant integration registrations and health.' },
  { key: 'jobs', title: 'Jobs', description: 'Provider background jobs plus transactional-outbox delivery pressure.' },
  { key: 'security', title: 'Security', description: 'Platform operators, authentication activity and strong-auth coverage.' },
  { key: 'audit', title: 'Audit', description: 'Provider operator actions across the NuBlox service.' },
  { key: 'metrics', title: 'Metrics', description: 'Live service-level operating metrics.' },
  { key: 'platform-configuration', title: 'Platform configuration', description: 'Provider-owned non-secret platform configuration and secret references.' }
];

export const PLATFORM_TENANT_SECTIONS: PlatformSectionDefinition[] = [
  { key: 'overview', title: 'Overview', description: 'Tenant identity, lifecycle and service footprint.' },
  { key: 'configuration', title: 'Configuration', description: 'Business profile, operating model, industry solution and feature configuration.' },
  { key: 'people', title: 'People', description: 'Application identities and Person memberships for this Tenant.' },
  { key: 'subscriptions', title: 'Subscriptions', description: 'Commercial subscription and capacity controls.' },
  { key: 'usage', title: 'Usage', description: 'Current Tenant consumption and captured usage metrics.' },
  { key: 'health', title: 'Health', description: 'Operational health signals for provisioning, authentication and background work.' },
  { key: 'security', title: 'Security', description: 'Authentication policy, MFA, passkeys, OIDC and recent security activity.' },
  { key: 'sessions', title: 'Sessions', description: 'Active and recently revoked application sessions.' },
  { key: 'audit', title: 'Audit', description: 'Recent attributable Tenant audit evidence.' },
  { key: 'migrations', title: 'Migrations', description: 'Tenant configuration/template application history and current platform schema state.' },
  { key: 'provisioning', title: 'Provisioning', description: 'Provisioning runs and detailed outcome state.' },
  { key: 'suspend', title: 'Suspend', description: 'Governed Tenant suspension and reactivation controls.' },
  { key: 'deletion', title: 'Deletion', description: 'Two-stage logical deletion controls; physical purge is separately governed.' }
];

function normalizeValue(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return Number(value);
  if (Buffer.isBuffer(value)) return value.toString('utf8');
  return JSON.stringify(value);
}

function normalizeRow(row: GenericRow): Record<string, string | number | boolean | null> {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, normalizeValue(value)]));
}

function labelize(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

export class MySqlPlatformControlPlaneReadRepository {
  constructor(private readonly pool: Pool) {}

  globalSections(): PlatformSectionDefinition[] {
    return GLOBAL_SECTIONS;
  }

  async dashboard(): Promise<PlatformDashboardView> {
    const [tenants, users, activeSessions, failedProvisioning, failedJobs] = await Promise.all([
      this.count('SELECT COUNT(*) AS count FROM tenants'),
      this.count("SELECT COUNT(*) AS count FROM application_users WHERE status='ACTIVE'"),
      this.count("SELECT COUNT(*) AS count FROM application_sessions WHERE revoked_at IS NULL AND expires_at > UTC_TIMESTAMP(6)"),
      this.count("SELECT COUNT(*) AS count FROM tenant_provisioning_runs WHERE status='FAILED'"),
      this.count("SELECT COUNT(*) AS count FROM platform_background_jobs WHERE status='FAILED'")
    ]);
    const [auditRows] = await this.pool.query<GenericRow[]>(
      `SELECT a.audit_id, o.display_name AS operator_name, a.tenant_id, a.action, a.reason, a.occurred_at
         FROM platform_operator_audit_entries a
         JOIN platform_operators o ON o.id=a.operator_id
        ORDER BY a.occurred_at DESC LIMIT 12`
    );
    const [attentionRows] = await this.pool.query<GenericRow[]>(
      `SELECT 'Tenant deletion requested' AS attention_type, t.id AS subject_id, t.name AS subject, c.reason, c.updated_at AS occurred_at
         FROM platform_tenant_controls c JOIN tenants t ON t.id=c.tenant_id
        WHERE c.lifecycle_state='DELETION_REQUESTED'
       UNION ALL
       SELECT 'Provisioning failed', r.id, t.name, r.error_message, r.started_at
         FROM tenant_provisioning_runs r JOIN tenants t ON t.id=r.tenant_id
        WHERE r.status='FAILED'
       UNION ALL
       SELECT 'Background job failed', j.id, COALESCE(t.name,'Platform'), j.last_error, j.updated_at
         FROM platform_background_jobs j LEFT JOIN tenants t ON t.id=j.tenant_id
        WHERE j.status='FAILED'
       ORDER BY occurred_at DESC LIMIT 20`
    );
    return {
      metrics: [
        { label: 'Tenants', value: tenants, detail: 'All registered Tenant records' },
        { label: 'Active users', value: users, detail: 'Cross-Tenant application identities' },
        { label: 'Active sessions', value: activeSessions, detail: 'Unrevoked, unexpired Tenant sessions' },
        { label: 'Attention items', value: failedProvisioning + failedJobs + attentionRows.length, detail: 'Failures and governed lifecycle exceptions' }
      ],
      globalSections: GLOBAL_SECTIONS,
      recentAudit: auditRows.map(normalizeRow),
      attention: attentionRows.map(normalizeRow)
    };
  }

  async globalSection(section: PlatformGlobalSectionKey): Promise<PlatformSectionView> {
    switch (section) {
      case 'users': return this.section(section, `SELECT u.id, u.email, u.status, u.last_login_at,
        COUNT(DISTINCT ut.tenant_id) AS tenant_count,
        COUNT(DISTINCT CASE WHEN s.revoked_at IS NULL AND s.expires_at>UTC_TIMESTAMP(6) THEN s.token_hash END) AS active_sessions
        FROM application_users u
        LEFT JOIN application_user_tenants ut ON ut.user_id=u.id AND ut.status='ACTIVE'
        LEFT JOIN application_sessions s ON s.user_id=u.id
        GROUP BY u.id,u.email,u.status,u.last_login_at ORDER BY u.created_at DESC LIMIT 500`);
      case 'templates': return this.section(section, `SELECT t.id,t.code,t.name,t.template_kind,t.version,t.priority,
        COALESCE(i.name,'Core / cross-industry') AS industry,t.status,t.updated_at
        FROM tenant_configuration_templates t
        LEFT JOIN industry_solutions i ON i.id=t.industry_solution_id
        ORDER BY t.template_kind,t.priority,t.code,t.version DESC LIMIT 500`);
      case 'industries': return this.section(section, `SELECT i.id,i.code,i.name,i.status,
        COUNT(DISTINCT a.tenant_id) AS tenant_count,
        COUNT(DISTINCT f.id) AS function_count
        FROM industry_solutions i
        LEFT JOIN tenant_industry_solution_assignments a ON a.industry_solution_id=i.id AND a.status='ACTIVE'
        LEFT JOIN function_definitions f ON f.industry_solution_id=i.id AND f.status='ACTIVE'
        GROUP BY i.id,i.code,i.name,i.status ORDER BY i.name`);
      case 'metadata': return this.section(section, `SELECT m.tenant_id,t.slug,m.id,m.code,m.name,m.object_family,m.version,m.status,m.updated_at
        FROM metadata_type_definitions m JOIN tenants t ON t.id=m.tenant_id
        ORDER BY m.updated_at DESC LIMIT 500`);
      case 'feature-flags': return this.section(section, `SELECT f.flag_key,f.name,f.default_enabled,f.status,
        COUNT(o.tenant_id) AS tenant_overrides,f.updated_at
        FROM platform_feature_flags f
        LEFT JOIN platform_tenant_feature_overrides o ON o.flag_key=f.flag_key
        GROUP BY f.flag_key,f.name,f.default_enabled,f.status,f.updated_at
        ORDER BY f.flag_key`);
      case 'provisioning': return this.section(section, `SELECT r.id,r.tenant_id,t.slug,t.name,r.status,r.started_at,r.completed_at,r.error_message
        FROM tenant_provisioning_runs r JOIN tenants t ON t.id=r.tenant_id
        ORDER BY r.started_at DESC LIMIT 500`);
      case 'migrations': return this.section(section, `SELECT version,status,applied_at,error_message
        FROM kernel_schema_migrations ORDER BY version DESC`);
      case 'integrations': return this.section(section, `SELECT i.id,COALESCE(t.slug,'PLATFORM') AS scope,i.code,i.name,i.integration_type,i.status,
        i.last_health_status,i.last_checked_at,i.updated_at
        FROM platform_integrations i LEFT JOIN tenants t ON t.id=i.tenant_id
        ORDER BY i.updated_at DESC LIMIT 500`);
      case 'jobs': return this.section(section, `SELECT id,COALESCE(tenant_id,'PLATFORM') AS scope,job_type,status,attempts,max_attempts,
        scheduled_at,started_at,completed_at,last_error FROM platform_background_jobs
        ORDER BY scheduled_at DESC LIMIT 500`);
      case 'security': return this.section(section, `SELECT 'Active platform operators' AS metric, COUNT(*) AS value
          FROM platform_operators WHERE status='ACTIVE'
        UNION ALL SELECT 'Denied Tenant authentication events (24h)', COUNT(*) FROM application_auth_events
          WHERE outcome='DENIED' AND occurred_at >= UTC_TIMESTAMP(6)-INTERVAL 1 DAY
        UNION ALL SELECT 'Authentication errors (24h)', COUNT(*) FROM application_auth_events
          WHERE outcome='ERROR' AND occurred_at >= UTC_TIMESTAMP(6)-INTERVAL 1 DAY
        UNION ALL SELECT 'Active MFA enrollments', COUNT(*) FROM application_mfa_enrollments WHERE status='ACTIVE'
        UNION ALL SELECT 'Registered passkeys', COUNT(*) FROM application_passkeys WHERE status='ACTIVE'
        UNION ALL SELECT 'Active OIDC providers', COUNT(*) FROM application_oidc_providers WHERE status='ACTIVE'`);
      case 'audit': return this.section(section, `SELECT a.audit_id,o.display_name AS operator_name,o.email,a.tenant_id,
        a.action,a.reason,a.occurred_at FROM platform_operator_audit_entries a
        JOIN platform_operators o ON o.id=a.operator_id ORDER BY a.occurred_at DESC LIMIT 1000`);
      case 'metrics': return this.section(section, `SELECT 'Tenants' AS metric,COUNT(*) AS value FROM tenants
        UNION ALL SELECT 'Active application users',COUNT(*) FROM application_users WHERE status='ACTIVE'
        UNION ALL SELECT 'Active Tenant sessions',COUNT(*) FROM application_sessions WHERE revoked_at IS NULL AND expires_at>UTC_TIMESTAMP(6)
        UNION ALL SELECT 'Canonical objects',COUNT(*) FROM canonical_objects
        UNION ALL SELECT 'Metadata types',COUNT(*) FROM metadata_type_definitions WHERE status='ACTIVE'
        UNION ALL SELECT 'Provisioning failures',COUNT(*) FROM tenant_provisioning_runs WHERE status='FAILED'
        UNION ALL SELECT 'Outbox messages pending',COUNT(*) FROM outbox_messages WHERE published_at IS NULL
        UNION ALL SELECT 'Background jobs failed',COUNT(*) FROM platform_background_jobs WHERE status='FAILED'`);
      case 'platform-configuration': return this.section(section, `SELECT config_key,description,sensitivity,value_json,updated_at
        FROM platform_configuration ORDER BY config_key`);
    }
  }

  async tenantHeader(tenantId: string): Promise<PlatformTenantHeader | null> {
    const [rows] = await this.pool.execute<TenantHeaderRow[]>(
      `SELECT t.id AS tenant_id,t.slug,t.name,t.status AS tenant_status,
              c.lifecycle_state,c.reason AS lifecycle_reason
         FROM tenants t LEFT JOIN platform_tenant_controls c ON c.tenant_id=t.id
        WHERE t.id=? LIMIT 1`, [tenantId]
    );
    const row=rows[0];
    if(!row) return null;
    return {
      tenantId:row.tenant_id,slug:row.slug,name:row.name,tenantStatus:row.tenant_status,
      lifecycleState:row.lifecycle_state??(row.tenant_status==='ACTIVE'?'ACTIVE':'SUSPENDED'),
      lifecycleReason:row.lifecycle_reason
    };
  }

  async tenantSection(tenantId: string, section: PlatformTenantSectionKey): Promise<PlatformSectionView> {
    const definition=PLATFORM_TENANT_SECTIONS.find(item=>item.key===section)!;
    const make=(sql:string,params:unknown[]=[tenantId])=>this.customSection(definition,sql,params);
    switch(section) {
      case 'overview': return make(`SELECT t.id AS tenant_id,t.slug,t.name,t.status AS tenant_status,c.lifecycle_state,c.reason AS lifecycle_reason,
        t.created_at,t.updated_at,
        (SELECT COUNT(*) FROM application_user_tenants ut WHERE ut.tenant_id=t.id AND ut.status='ACTIVE') AS active_members,
        (SELECT COUNT(*) FROM application_sessions s WHERE s.tenant_id=t.id AND s.revoked_at IS NULL AND s.expires_at>UTC_TIMESTAMP(6)) AS active_sessions,
        (SELECT COUNT(*) FROM canonical_objects co WHERE co.tenant_id=t.id) AS canonical_objects
        FROM tenants t LEFT JOIN platform_tenant_controls c ON c.tenant_id=t.id WHERE t.id=?`);
      case 'configuration': return make(`SELECT 'BUSINESS_PROFILE' AS record_type,p.size_tier AS code,
        CONCAT(p.primary_country_code,' / ',p.primary_language_code) AS value,p.configuration_state AS status,p.updated_at
        FROM tenant_business_profiles p WHERE p.tenant_id=?
        UNION ALL SELECT 'OPERATING_MODEL',m.operating_model_code,COALESCE(d.name,m.operating_model_code),m.status,m.created_at
        FROM tenant_operating_models m JOIN operating_model_definitions d ON d.code=m.operating_model_code WHERE m.tenant_id=?
        UNION ALL SELECT 'INDUSTRY_SOLUTION',a.industry_solution_id,i.name,a.status,a.activated_at
        FROM tenant_industry_solution_assignments a JOIN industry_solutions i ON i.id=a.industry_solution_id WHERE a.tenant_id=?
        UNION ALL SELECT 'FEATURE_OVERRIDE',o.flag_key,IF(o.enabled,'Enabled','Disabled'),'ACTIVE',o.updated_at
        FROM platform_tenant_feature_overrides o WHERE o.tenant_id=?`,[tenantId,tenantId,tenantId,tenantId]);
      case 'people': return make(`SELECT u.id AS user_id,u.email,u.status AS user_status,ut.person_id,
        p.legal_name,p.preferred_name,ut.status AS membership_status,ut.is_default,u.last_login_at
        FROM application_user_tenants ut JOIN application_users u ON u.id=ut.user_id
        JOIN persons p ON p.tenant_id=ut.tenant_id AND p.id=ut.person_id
        WHERE ut.tenant_id=? ORDER BY p.legal_name LIMIT 1000`);
      case 'subscriptions': return make(`SELECT tenant_id,plan_code,status,billing_customer_reference,seat_limit,storage_limit_bytes,
        starts_at,renews_at,ends_at,updated_at FROM platform_subscriptions WHERE tenant_id=?`);
      case 'usage': return make(`SELECT 'Active members' AS metric,COUNT(*) AS value,'count' AS unit FROM application_user_tenants WHERE tenant_id=? AND status='ACTIVE'
        UNION ALL SELECT 'Active sessions',COUNT(*),'count' FROM application_sessions WHERE tenant_id=? AND revoked_at IS NULL AND expires_at>UTC_TIMESTAMP(6)
        UNION ALL SELECT 'Canonical objects',COUNT(*),'count' FROM canonical_objects WHERE tenant_id=?
        UNION ALL SELECT 'Metadata types',COUNT(*),'count' FROM metadata_type_definitions WHERE tenant_id=? AND status='ACTIVE'
        UNION ALL SELECT 'Audit entries',COUNT(*),'count' FROM kernel_audit_entries WHERE tenant_id=?
        UNION ALL SELECT CONCAT('Snapshot: ',metric_key),metric_value,unit FROM platform_usage_snapshots WHERE tenant_id=? ORDER BY metric`,[tenantId,tenantId,tenantId,tenantId,tenantId,tenantId]);
      case 'health': return make(`SELECT 'Lifecycle' AS health_signal,COALESCE(c.lifecycle_state,t.status) AS state,c.reason AS detail,c.updated_at AS occurred_at
        FROM tenants t LEFT JOIN platform_tenant_controls c ON c.tenant_id=t.id WHERE t.id=?
        UNION ALL SELECT 'Latest provisioning',p.status,COALESCE(p.error_message,'No error'),p.started_at
          FROM (
            SELECT status,error_message,started_at
              FROM tenant_provisioning_runs
             WHERE tenant_id=?
             ORDER BY started_at DESC
             LIMIT 1
          ) p
        UNION ALL SELECT 'Failed background jobs',IF(COUNT(*)=0,'HEALTHY','DEGRADED'),CONCAT(COUNT(*),' failed job(s)'),MAX(updated_at) FROM platform_background_jobs WHERE tenant_id=? AND status='FAILED'
        UNION ALL SELECT 'Authentication errors (24h)',IF(COUNT(*)=0,'HEALTHY','DEGRADED'),CONCAT(COUNT(*),' error event(s)'),MAX(occurred_at) FROM application_auth_events WHERE tenant_id=? AND outcome='ERROR' AND occurred_at>=UTC_TIMESTAMP(6)-INTERVAL 1 DAY`,[tenantId,tenantId,tenantId,tenantId]);
      case 'security': return make(`SELECT p.mfa_requirement,p.passkey_enabled,p.session_ttl_minutes,p.idle_timeout_minutes,p.max_active_sessions,
        (SELECT COUNT(*) FROM application_mfa_enrollments e WHERE e.tenant_id=p.tenant_id AND e.status='ACTIVE') AS active_mfa_enrollments,
        (SELECT COUNT(*) FROM application_passkeys k WHERE k.tenant_id=p.tenant_id AND k.status='ACTIVE') AS active_passkeys,
        (SELECT COUNT(*) FROM application_oidc_providers o WHERE o.tenant_id=p.tenant_id AND o.status='ACTIVE') AS active_oidc_providers,
        (SELECT COUNT(*) FROM application_auth_events a WHERE a.tenant_id=p.tenant_id AND a.outcome='DENIED' AND a.occurred_at>=UTC_TIMESTAMP(6)-INTERVAL 1 DAY) AS denied_auth_24h
        FROM tenant_authentication_policies p WHERE p.tenant_id=?`);
      case 'sessions': return make(`SELECT s.token_hash,u.email,p.legal_name,s.created_at,s.last_seen_at,s.expires_at,s.revoked_at
        FROM application_sessions s JOIN application_users u ON u.id=s.user_id
        JOIN persons p ON p.tenant_id=s.tenant_id AND p.id=s.person_id
        WHERE s.tenant_id=? ORDER BY s.last_seen_at DESC LIMIT 500`);
      case 'audit': return make(`SELECT audit_id,entity_type,entity_id,action,actor_person_id,correlation_id,occurred_at
        FROM kernel_audit_entries WHERE tenant_id=? ORDER BY occurred_at DESC LIMIT 1000`);
      case 'migrations': return make(`SELECT 'TENANT_TEMPLATE' AS migration_scope,a.id AS migration_id,t.code AS migration_name,
        a.template_version AS version,a.status,a.applied_at AS occurred_at
        FROM tenant_configuration_template_applications a JOIN tenant_configuration_templates t ON t.id=a.template_id
        WHERE a.tenant_id=?
        UNION ALL SELECT 'PLATFORM_SCHEMA',version,version,NULL,status,applied_at FROM kernel_schema_migrations
        ORDER BY occurred_at DESC`,[tenantId]);
      case 'provisioning': return make(`SELECT r.id,r.status,r.started_at,r.completed_at,r.error_message,
        (SELECT COUNT(*) FROM tenant_provisioning_steps s WHERE s.provisioning_run_id=r.id) AS step_count,
        (SELECT COUNT(*) FROM tenant_provisioning_steps s WHERE s.provisioning_run_id=r.id AND s.status='FAILED') AS failed_steps
        FROM tenant_provisioning_runs r WHERE r.tenant_id=? ORDER BY r.started_at DESC LIMIT 250`);
      case 'suspend':
      case 'deletion': return make(`SELECT t.id AS tenant_id,t.slug,t.name,t.status AS tenant_status,
        c.lifecycle_state,c.reason,c.deletion_requested_at,c.deleted_at,c.updated_at
        FROM tenants t LEFT JOIN platform_tenant_controls c ON c.tenant_id=t.id WHERE t.id=?`);
    }
  }

  private async count(sql:string):Promise<number>{
    const [rows]=await this.pool.query<CountRow[]>(sql);
    return Number(rows[0]?.count??0);
  }

  private async section(section:PlatformGlobalSectionKey,sql:string):Promise<PlatformSectionView>{
    const definition=GLOBAL_SECTIONS.find(item=>item.key===section)!;
    return this.customSection(definition,sql);
  }

  private async customSection(definition:PlatformSectionDefinition,sql:string,params:unknown[]=[]):Promise<PlatformSectionView>{
    const [rows]=await this.pool.query<GenericRow[]>(sql,params);
    const normalized=rows.map(normalizeRow);
    const columns=normalized.length>0?Object.keys(normalized[0]!).map(labelize):[];
    return {...definition,columns,rows:normalized};
  }
}
