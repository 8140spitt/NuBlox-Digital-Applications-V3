import type {
  SalesForecastCategory,
  SalesOpportunityStage,
  SalesOpportunityStatus,
  TenantId
} from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import {
  MySqlFunctionWorkAuthorizationService,
  type FunctionWorkAuthorization
} from './function-work-authorization.js';

interface AccountViewRow extends RowDataPacket {
  id:string;canonical_object_id:string;organisation_id:string;code:string;segment:string|null;status:'ACTIVE'|'INACTIVE';
  owner_position_id:string;owner_position_code:string;owner_position_title:string;
  organisation_name:string;owner_person_id:string|null;owner_person_name:string|null;row_version:number|string;
}
interface OpportunityViewRow extends RowDataPacket {
  id:string;canonical_object_id:string;sales_account_id:string;account_code:string;organisation_id:string;organisation_name:string;
  code:string;title:string;description:string;owner_position_id:string;owner_position_code:string;owner_position_title:string;
  owner_person_id:string|null;owner_person_name:string|null;stage:SalesOpportunityStage;probability_percent:string|number;
  estimated_value:string|number;currency:string;expected_close_date:Date|null;forecast_category:SalesForecastCategory;
  status:SalesOpportunityStatus;row_version:number|string;
}
interface OrganisationRow extends RowDataPacket {
  id:string;name:string;
}
interface PositionRow extends RowDataPacket {
  id:string;code:string;title:string;person_id:string|null;person_name:string|null;
}

export interface SalesAccountView {
  id:string;
  canonicalObjectId:string;
  organisationId:string;
  organisationName:string;
  code:string;
  segment?:string;
  status:'ACTIVE'|'INACTIVE';
  ownerPositionId:string;
  ownerPositionCode:string;
  ownerPositionTitle:string;
  ownerPersonId?:string;
  ownerPersonName?:string;
  rowVersion:number;
}

export interface SalesOpportunityView {
  id:string;
  canonicalObjectId:string;
  salesAccountId:string;
  accountCode:string;
  organisationId:string;
  organisationName:string;
  code:string;
  title:string;
  description:string;
  ownerPositionId:string;
  ownerPositionCode:string;
  ownerPositionTitle:string;
  ownerPersonId?:string;
  ownerPersonName?:string;
  stage:SalesOpportunityStage;
  probabilityPercent:number;
  estimatedValue:number;
  currency:string;
  expectedCloseDate?:string;
  forecastCategory:SalesForecastCategory;
  status:SalesOpportunityStatus;
  rowVersion:number;
}

export interface SalesPositionRollup {
  positionId:string;
  positionCode:string;
  positionTitle:string;
  personId?:string;
  personName?:string;
  relation:'SELF'|'DIRECT_REPORT'|'INDIRECT_REPORT'|'AUTHORIZED';
  managementDepth?:number;
  accounts:number;
  openOpportunities:number;
  currencyTotals:Array<{
    currency:string;
    pipelineValue:number;
    weightedPipeline:number;
    wonValue:number;
  }>;
}

export interface SalesWorkbench {
  scope:{
    unrestricted:boolean;
    positionIds:readonly string[];
    positionTitle?:string;
    managementSpan:number;
    reason:string;
  };
  canWork:boolean;
  workReason:string;
  ownerPositions:Array<{id:string;code:string;title:string;personId?:string;personName?:string}>;
  organisations:Array<{id:string;name:string}>;
  accounts:SalesAccountView[];
  opportunities:SalesOpportunityView[];
  positionRollup:SalesPositionRollup[];
  totals:{
    accounts:number;
    openOpportunities:number;
  };
  currencyTotals:Array<{
    currency:string;
    pipelineValue:number;
    weightedPipeline:number;
    wonValue:number;
  }>;
  stageBreakdown:Array<{stage:SalesOpportunityStage;count:number}>;
  forecastBreakdown:Array<{category:SalesForecastCategory;count:number}>;
}

export class SalesReadError extends Error {
  constructor(message:string,readonly code:'PERMISSION_DENIED') {
    super(message);
    this.name='SalesReadError';
  }
}

export class MySqlSalesReadRepository {
  private readonly authorization:MySqlFunctionWorkAuthorizationService;

  constructor(private readonly pool:Pool) {
    this.authorization=new MySqlFunctionWorkAuthorizationService(pool);
  }

  async getWorkbench(
    tenantId:TenantId,
    actorPersonId:string,
    evaluatedAt=new Date().toISOString()
  ):Promise<SalesWorkbench> {
    const [read,work]=await Promise.all([
      this.authorization.resolveF07Read(tenantId,actorPersonId,evaluatedAt),
      this.authorization.resolveF07Work(tenantId,actorPersonId,evaluatedAt)
    ]);
    if(!read.allowed) throw new SalesReadError(read.reason,'PERMISSION_DENIED');

    const [accounts,opportunities,organisations,ownerPositions]=await Promise.all([
      this.listAccounts(tenantId,read,evaluatedAt),
      this.listOpportunities(tenantId,read,evaluatedAt),
      this.listOrganisations(tenantId),
      this.listOwnerPositions(tenantId,work.allowed?work:read,evaluatedAt)
    ]);

    const open=opportunities.filter(item=>item.status==='OPEN');
    const stageMap=new Map<SalesOpportunityStage,number>();
    const forecastMap=new Map<SalesForecastCategory,number>();
    const currencyMap=new Map<string,{pipelineValue:number;weightedPipeline:number;wonValue:number}>();

    for(const opportunity of opportunities) {
      stageMap.set(opportunity.stage,(stageMap.get(opportunity.stage)??0)+1);
      forecastMap.set(
        opportunity.forecastCategory,
        (forecastMap.get(opportunity.forecastCategory)??0)+1
      );
      const currency=currencyMap.get(opportunity.currency)??{
        pipelineValue:0,weightedPipeline:0,wonValue:0
      };
      if(opportunity.status==='OPEN') {
        currency.pipelineValue+=opportunity.estimatedValue;
        currency.weightedPipeline+=opportunity.estimatedValue*opportunity.probabilityPercent/100;
      } else if(opportunity.status==='WON') {
        currency.wonValue+=opportunity.estimatedValue;
      }
      currencyMap.set(opportunity.currency,currency);
    }

    const managementDepthByPosition=new Map<string,number>(
      (read.experience?.managementScope??[]).map(item=>[item.positionId,item.depth] as const)
    );
    const currentPositionId=read.experience?.positionId;
    const positionRollup:SalesPositionRollup[]=ownerPositions
      .map(position=>{
        const ownedAccounts=accounts.filter(item=>item.ownerPositionId===position.id);
        const ownedOpportunities=opportunities.filter(item=>item.ownerPositionId===position.id);
        const ownedCurrencyMap=new Map<string,{pipelineValue:number;weightedPipeline:number;wonValue:number}>();
        for(const opportunity of ownedOpportunities) {
          const totals=ownedCurrencyMap.get(opportunity.currency)??{
            pipelineValue:0,weightedPipeline:0,wonValue:0
          };
          if(opportunity.status==='OPEN') {
            totals.pipelineValue+=opportunity.estimatedValue;
            totals.weightedPipeline+=opportunity.estimatedValue*opportunity.probabilityPercent/100;
          } else if(opportunity.status==='WON') {
            totals.wonValue+=opportunity.estimatedValue;
          }
          ownedCurrencyMap.set(opportunity.currency,totals);
        }
        const depth=position.id===currentPositionId?0:managementDepthByPosition.get(position.id);
        const relation:SalesPositionRollup['relation']=position.id===currentPositionId
          ?'SELF'
          :depth===1
            ?'DIRECT_REPORT'
            :typeof depth==='number'
              ?'INDIRECT_REPORT'
              :'AUTHORIZED';
        return {
          positionId:position.id,
          positionCode:position.code,
          positionTitle:position.title,
          ...(position.personId?{personId:position.personId}:{}),
          ...(position.personName?{personName:position.personName}:{}),
          relation,
          ...(depth!==undefined?{managementDepth:depth}:{}),
          accounts:ownedAccounts.length,
          openOpportunities:ownedOpportunities.filter(item=>item.status==='OPEN').length,
          currencyTotals:Array.from(ownedCurrencyMap.entries())
            .sort(([a],[b])=>a.localeCompare(b))
            .map(([currency,value])=>({currency,...value}))
        };
      })
      .sort((a,b)=>(a.managementDepth??Number.MAX_SAFE_INTEGER)-(b.managementDepth??Number.MAX_SAFE_INTEGER)
        ||a.positionTitle.localeCompare(b.positionTitle)||a.positionCode.localeCompare(b.positionCode));

    return {
      scope:{
        unrestricted:read.unrestricted,
        positionIds:read.positionIds,
        ...(read.experience?{positionTitle:read.experience.positionTitle}:{}),
        managementSpan:read.experience?.managementScope.length??0,
        reason:read.reason
      },
      canWork:work.allowed,
      workReason:work.reason,
      ownerPositions,
      organisations,
      accounts,
      opportunities,
      positionRollup,
      totals:{
        accounts:accounts.length,
        openOpportunities:open.length
      },
      currencyTotals:Array.from(currencyMap.entries())
        .sort(([a],[b])=>a.localeCompare(b))
        .map(([currency,value])=>({currency,...value})),
      stageBreakdown:Array.from(stageMap.entries()).map(([stage,count])=>({stage,count})),
      forecastBreakdown:Array.from(forecastMap.entries()).map(([category,count])=>({category,count}))
    };
  }

  private scopeClause(
    authority:FunctionWorkAuthorization,
    column:string
  ):{sql:string;params:string[]} {
    if(authority.unrestricted) return {sql:'',params:[]};
    if(authority.positionIds.length===0) return {sql:' AND 1=0',params:[]};
    return {
      sql:` AND ${column} IN (${authority.positionIds.map(()=>'?').join(',')})`,
      params:[...authority.positionIds]
    };
  }

  private async listAccounts(
    tenantId:TenantId,
    authority:FunctionWorkAuthorization,
    evaluatedAt:string
  ):Promise<SalesAccountView[]> {
    const scope=this.scopeClause(authority,'a.owner_position_id');
    const at=new Date(evaluatedAt);
    const [rows]=await this.pool.execute<AccountViewRow[]>(
      `SELECT a.id,a.canonical_object_id,a.organisation_id,a.code,a.segment,a.status,a.owner_position_id,
              p.code AS owner_position_code,p.title AS owner_position_title,
              COALESCE(o.trading_name,o.legal_name) AS organisation_name,
              po.person_id AS owner_person_id,COALESCE(pe.preferred_name,pe.legal_name) AS owner_person_name,a.row_version
         FROM sales_accounts a
         JOIN organisations o ON o.tenant_id=a.tenant_id AND o.id=a.organisation_id
         JOIN positions p ON p.tenant_id=a.tenant_id AND p.id=a.owner_position_id
         LEFT JOIN position_occupancies po
           ON po.tenant_id=p.tenant_id AND po.position_id=p.id AND po.is_primary=TRUE
          AND po.effective_from<=? AND (po.effective_to IS NULL OR po.effective_to>=?)
         LEFT JOIN persons pe ON pe.tenant_id=po.tenant_id AND pe.id=po.person_id
        WHERE a.tenant_id=?${scope.sql}
        ORDER BY organisation_name,a.code`,
      [at,at,tenantId,...scope.params]
    );
    return rows.map(row=>({
      id:row.id,canonicalObjectId:row.canonical_object_id,organisationId:row.organisation_id,
      organisationName:row.organisation_name,code:row.code,...(row.segment?{segment:row.segment}:{}),
      status:row.status,ownerPositionId:row.owner_position_id,ownerPositionCode:row.owner_position_code,
      ownerPositionTitle:row.owner_position_title,...(row.owner_person_id?{ownerPersonId:row.owner_person_id}:{}),
      ...(row.owner_person_name?{ownerPersonName:row.owner_person_name}:{}),rowVersion:Number(row.row_version)
    }));
  }

  private async listOpportunities(
    tenantId:TenantId,
    authority:FunctionWorkAuthorization,
    evaluatedAt:string
  ):Promise<SalesOpportunityView[]> {
    const scope=this.scopeClause(authority,'op.owner_position_id');
    const at=new Date(evaluatedAt);
    const [rows]=await this.pool.execute<OpportunityViewRow[]>(
      `SELECT op.id,op.canonical_object_id,op.sales_account_id,a.code AS account_code,a.organisation_id,
              COALESCE(o.trading_name,o.legal_name) AS organisation_name,
              op.code,op.title,op.description,op.owner_position_id,p.code AS owner_position_code,
              p.title AS owner_position_title,po.person_id AS owner_person_id,COALESCE(pe.preferred_name,pe.legal_name) AS owner_person_name,
              op.stage,op.probability_percent,op.estimated_value,op.currency,op.expected_close_date,
              op.forecast_category,op.status,op.row_version
         FROM sales_opportunities op
         JOIN sales_accounts a ON a.tenant_id=op.tenant_id AND a.id=op.sales_account_id
         JOIN organisations o ON o.tenant_id=a.tenant_id AND o.id=a.organisation_id
         JOIN positions p ON p.tenant_id=op.tenant_id AND p.id=op.owner_position_id
         LEFT JOIN position_occupancies po
           ON po.tenant_id=p.tenant_id AND po.position_id=p.id AND po.is_primary=TRUE
          AND po.effective_from<=? AND (po.effective_to IS NULL OR po.effective_to>=?)
         LEFT JOIN persons pe ON pe.tenant_id=po.tenant_id AND pe.id=po.person_id
        WHERE op.tenant_id=?${scope.sql}
        ORDER BY op.status='OPEN' DESC,op.expected_close_date IS NULL,op.expected_close_date,op.code`,
      [at,at,tenantId,...scope.params]
    );
    return rows.map(row=>({
      id:row.id,canonicalObjectId:row.canonical_object_id,salesAccountId:row.sales_account_id,
      accountCode:row.account_code,organisationId:row.organisation_id,organisationName:row.organisation_name,
      code:row.code,title:row.title,description:row.description,ownerPositionId:row.owner_position_id,
      ownerPositionCode:row.owner_position_code,ownerPositionTitle:row.owner_position_title,
      ...(row.owner_person_id?{ownerPersonId:row.owner_person_id}:{}),
      ...(row.owner_person_name?{ownerPersonName:row.owner_person_name}:{}),
      stage:row.stage,probabilityPercent:Number(row.probability_percent),estimatedValue:Number(row.estimated_value),
      currency:row.currency,...(row.expected_close_date?{expectedCloseDate:row.expected_close_date.toISOString().slice(0,10)}:{}),
      forecastCategory:row.forecast_category,status:row.status,rowVersion:Number(row.row_version)
    }));
  }

  private async listOrganisations(tenantId:TenantId):Promise<Array<{id:string;name:string}>> {
    const [rows]=await this.pool.execute<OrganisationRow[]>(
      `SELECT id,COALESCE(trading_name,legal_name) AS name
         FROM organisations WHERE tenant_id=? AND status='ACTIVE' ORDER BY name`,
      [tenantId]
    );
    return rows;
  }

  private async listOwnerPositions(
    tenantId:TenantId,
    authority:FunctionWorkAuthorization,
    evaluatedAt:string
  ):Promise<Array<{id:string;code:string;title:string;personId?:string;personName?:string}>> {
    const at=new Date(evaluatedAt);
    let where='';
    if(!authority.unrestricted) {
      if(authority.positionIds.length===0) return [];
      where=` AND p.id IN (${authority.positionIds.map(()=>'?').join(',')})`;
    }
    const [rows]=await this.pool.execute<PositionRow[]>(
      `SELECT p.id,p.code,p.title,po.person_id,COALESCE(pe.preferred_name,pe.legal_name) AS person_name
         FROM positions p
         JOIN position_function_assignments pfa
           ON pfa.tenant_id=p.tenant_id AND pfa.position_id=p.id AND pfa.function_id='F07'
          AND pfa.deployment_purpose='FUNCTIONAL_DELIVERY' AND pfa.status='ACTIVE'
          AND pfa.effective_from<=? AND (pfa.effective_to IS NULL OR pfa.effective_to>=?)
         LEFT JOIN position_occupancies po
           ON po.tenant_id=p.tenant_id AND po.position_id=p.id AND po.is_primary=TRUE
          AND po.effective_from<=? AND (po.effective_to IS NULL OR po.effective_to>=?)
         LEFT JOIN persons pe ON pe.tenant_id=po.tenant_id AND pe.id=po.person_id
        WHERE p.tenant_id=? AND p.status='ACTIVE'${where}
        ORDER BY p.title,p.code`,
      [at,at,at,at,tenantId,...(!authority.unrestricted?authority.positionIds:[])]
    );
    return rows.map(row=>({
      id:row.id,code:row.code,title:row.title,
      ...(row.person_id?{personId:row.person_id}:{}),...(row.person_name?{personName:row.person_name}:{})
    }));
  }
}
