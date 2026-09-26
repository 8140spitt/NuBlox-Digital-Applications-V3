import { randomUUID } from 'node:crypto';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';
import {
  PlatformAdministrationError,
  type PlatformOperatorPrincipal
} from './platform-administration-service.js';

interface TenantRow extends RowDataPacket { id:string; slug:string; }
interface JobRow extends RowDataPacket { id:string; status:string; attempts:number; max_attempts:number; }

function requireWrite(operator:PlatformOperatorPrincipal):void {
  if(operator.role==='READ_ONLY') throw new PlatformAdministrationError('Read-only platform operators cannot change provider controls.');
}
function requireSuper(operator:PlatformOperatorPrincipal):void {
  if(operator.role!=='SUPER_ADMIN') throw new PlatformAdministrationError('This provider control requires a NuBlox Super Administrator.');
}
function text(value:string,label:string,max=255):string {
  const normalized=value.trim();
  if(!normalized) throw new PlatformAdministrationError(`${label} is required.`);
  return normalized.slice(0,max);
}
function optionalPositiveInteger(value:string|undefined,label:string):number|null {
  if(!value?.trim()) return null;
  const parsed=Number(value);
  if(!Number.isInteger(parsed)||parsed<=0) throw new PlatformAdministrationError(`${label} must be a positive whole number.`);
  return parsed;
}
async function requireTenant(connection:PoolConnection,tenantId:string):Promise<TenantRow>{
  const [rows]=await connection.execute<TenantRow[]>('SELECT id,slug FROM tenants WHERE id=? LIMIT 1',[tenantId]);
  if(!rows[0]) throw new PlatformAdministrationError('Tenant not found.');
  return rows[0];
}
async function audit(connection:PoolConnection,operator:PlatformOperatorPrincipal,action:string,tenantId:string|null,reason:string|null,payload:Record<string,unknown>):Promise<void>{
  await connection.execute(
    `INSERT INTO platform_operator_audit_entries (operator_id,tenant_id,action,reason,payload) VALUES (?,?,?,?,?)`,
    [operator.operatorId,tenantId,action,reason,JSON.stringify(payload)]
  );
}

export class MySqlPlatformControlPlaneCommandService {
  constructor(private readonly pool:Pool){}

  async upsertSubscription(operator:PlatformOperatorPrincipal,input:{tenantId:string;planCode:string;status:string;seatLimit?:string;storageLimitBytes?:string;billingCustomerReference?:string}):Promise<void>{
    requireWrite(operator);
    const planCode=text(input.planCode,'Plan code',64).toUpperCase();
    const allowed=new Set(['TRIAL','ACTIVE','PAST_DUE','SUSPENDED','CANCELLED']);
    const status=input.status.trim().toUpperCase();
    if(!allowed.has(status)) throw new PlatformAdministrationError('Invalid subscription status.');
    const seatLimit=optionalPositiveInteger(input.seatLimit,'Seat limit');
    const storageLimit=optionalPositiveInteger(input.storageLimitBytes,'Storage limit');
    await withTransaction(this.pool,async connection=>{
      const tenant=await requireTenant(connection,input.tenantId);
      await connection.execute(
        `INSERT INTO platform_subscriptions
          (tenant_id,plan_code,status,billing_customer_reference,seat_limit,storage_limit_bytes,updated_by_operator_id)
         VALUES (?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE plan_code=VALUES(plan_code),status=VALUES(status),
           billing_customer_reference=VALUES(billing_customer_reference),seat_limit=VALUES(seat_limit),
           storage_limit_bytes=VALUES(storage_limit_bytes),updated_by_operator_id=VALUES(updated_by_operator_id)`,
        [input.tenantId,planCode,status,input.billingCustomerReference?.trim()||null,seatLimit,storageLimit,operator.operatorId]
      );
      await audit(connection,operator,'TENANT_SUBSCRIPTION_UPDATED',input.tenantId,'Provider subscription administration',{slug:tenant.slug,planCode,status,seatLimit,storageLimit});
    });
  }

  async upsertFeatureFlag(operator:PlatformOperatorPrincipal,input:{flagKey:string;name:string;description:string;defaultEnabled:boolean}):Promise<void>{
    requireSuper(operator);
    const flagKey=text(input.flagKey,'Feature flag key',120).toLowerCase().replace(/[^a-z0-9._-]+/g,'-');
    const name=text(input.name,'Feature flag name',255);
    const description=text(input.description,'Feature flag description',2000);
    await withTransaction(this.pool,async connection=>{
      await connection.execute(
        `INSERT INTO platform_feature_flags (flag_key,name,description,default_enabled,status,updated_by_operator_id)
         VALUES (?,?,?,?,'ACTIVE',?)
         ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description),
           default_enabled=VALUES(default_enabled),status='ACTIVE',updated_by_operator_id=VALUES(updated_by_operator_id)`,
        [flagKey,name,description,input.defaultEnabled,operator.operatorId]
      );
      await audit(connection,operator,'PLATFORM_FEATURE_FLAG_UPDATED',null,'Provider feature administration',{flagKey,defaultEnabled:input.defaultEnabled});
    });
  }

  async setTenantFeatureOverride(operator:PlatformOperatorPrincipal,input:{tenantId:string;flagKey:string;enabled:boolean;reason:string}):Promise<void>{
    requireWrite(operator);
    const reason=text(input.reason,'Override reason',2000);
    await withTransaction(this.pool,async connection=>{
      const tenant=await requireTenant(connection,input.tenantId);
      await connection.execute(
        `INSERT INTO platform_tenant_feature_overrides (tenant_id,flag_key,enabled,reason,updated_by_operator_id)
         VALUES (?,?,?,?,?)
         ON DUPLICATE KEY UPDATE enabled=VALUES(enabled),reason=VALUES(reason),updated_by_operator_id=VALUES(updated_by_operator_id)`,
        [input.tenantId,input.flagKey,input.enabled,reason,operator.operatorId]
      );
      await audit(connection,operator,'TENANT_FEATURE_OVERRIDE_UPDATED',input.tenantId,reason,{slug:tenant.slug,flagKey:input.flagKey,enabled:input.enabled});
    });
  }

  async upsertPlatformConfiguration(operator:PlatformOperatorPrincipal,input:{configKey:string;description:string;sensitivity:string;jsonValue:string}):Promise<void>{
    requireSuper(operator);
    const configKey=text(input.configKey,'Configuration key',160);
    const description=text(input.description,'Configuration description',2000);
    const sensitivity=input.sensitivity.trim().toUpperCase();
    if(!['PUBLIC','INTERNAL','SECRET_REFERENCE'].includes(sensitivity)) throw new PlatformAdministrationError('Invalid configuration sensitivity.');
    let parsed:unknown;
    try{parsed=JSON.parse(input.jsonValue);}catch{throw new PlatformAdministrationError('Configuration value must be valid JSON.');}
    await withTransaction(this.pool,async connection=>{
      await connection.execute(
        `INSERT INTO platform_configuration (config_key,description,sensitivity,value_json,updated_by_operator_id)
         VALUES (?,?,?,?,?)
         ON DUPLICATE KEY UPDATE description=VALUES(description),sensitivity=VALUES(sensitivity),
           value_json=VALUES(value_json),updated_by_operator_id=VALUES(updated_by_operator_id)`,
        [configKey,description,sensitivity,JSON.stringify(parsed),operator.operatorId]
      );
      await audit(connection,operator,'PLATFORM_CONFIGURATION_UPDATED',null,'Provider configuration administration',{configKey,sensitivity});
    });
  }

  async registerIntegration(operator:PlatformOperatorPrincipal,input:{tenantId?:string;code:string;name:string;integrationType:string;endpointReference?:string}):Promise<void>{
    requireWrite(operator);
    const type=input.integrationType.trim().toUpperCase();
    if(!['API','WEBHOOK','IDENTITY','DATA_EXCHANGE','MESSAGING','OBSERVABILITY','OTHER'].includes(type)) throw new PlatformAdministrationError('Invalid integration type.');
    await withTransaction(this.pool,async connection=>{
      if(input.tenantId) await requireTenant(connection,input.tenantId);
      const id=`PLATFORM-INTEGRATION-${randomUUID()}`;
      await connection.execute(
        `INSERT INTO platform_integrations
          (id,tenant_id,code,name,integration_type,status,endpoint_reference,last_health_status,updated_by_operator_id)
         VALUES (?,?,?,?,?,'CONFIGURED',?,'UNKNOWN',?)`,
        [id,input.tenantId||null,text(input.code,'Integration code',96),text(input.name,'Integration name',255),type,input.endpointReference?.trim()||null,operator.operatorId]
      );
      await audit(connection,operator,'PLATFORM_INTEGRATION_REGISTERED',input.tenantId||null,'Provider integration administration',{id,code:input.code,type});
    });
  }

  async retryBackgroundJob(operator:PlatformOperatorPrincipal,jobId:string):Promise<void>{
    requireWrite(operator);
    await withTransaction(this.pool,async connection=>{
      const [rows]=await connection.execute<JobRow[]>(
        `SELECT id,status,attempts,max_attempts FROM platform_background_jobs WHERE id=? FOR UPDATE`,[jobId]
      );
      const job=rows[0];
      if(!job) throw new PlatformAdministrationError('Background job not found.');
      if(job.status!=='FAILED') throw new PlatformAdministrationError('Only failed background jobs can be retried.');
      if(Number(job.attempts)>=Number(job.max_attempts)) throw new PlatformAdministrationError('Background job has exhausted its configured attempts.');
      await connection.execute(
        `UPDATE platform_background_jobs SET status='PENDING',scheduled_at=UTC_TIMESTAMP(6),started_at=NULL,completed_at=NULL,last_error=NULL WHERE id=?`,[jobId]
      );
      await audit(connection,operator,'PLATFORM_BACKGROUND_JOB_RETRIED',null,'Provider job administration',{jobId});
    });
  }
}
