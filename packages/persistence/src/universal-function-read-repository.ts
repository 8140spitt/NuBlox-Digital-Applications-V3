import type { FunctionFamily } from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';

interface FunctionRow extends RowDataPacket {
  id:string;code:string;name:string;function_family:FunctionFamily;industry_solution_id:string|null;
  parent_function_id:string|null;description:string|null;status:'ACTIVE'|'INACTIVE';
}
interface SubFunctionRow extends RowDataPacket {
  id:string;function_id:string;code:string;name:string;sequence:number;
}
interface ActivityRow extends RowDataPacket {
  id:string;sub_function_id:string;name:string;sequence:number;
}
interface JobRow extends RowDataPacket {
  function_id:string;industry_job_profile_id:string;job_profile_id:string;job_code:string;canonical_name:string;
}
interface ToolRow extends RowDataPacket {
  id:string;code:string;name:string;tool_class:FunctionToolClass;owner_function_id:string|null;purpose:string;
  required_permission_key:string|null;required_authority_scope:string|null;config_schema_ref:string|null;
  consumes_object_types:unknown;produces_object_types:unknown;produces_deliverable_types:unknown;
  evidence_requirements:unknown;version:string;lifecycle_status:ToolLifecycleStatus;
  implementation_state:ToolImplementationState;
}
interface CompositionRow extends RowDataPacket {
  function_id:string;tool_id:string;workspace_view:FunctionWorkspaceView;workspace_zone:FunctionWorkspaceZone;
  operating_side:FunctionOperatingSide;display_order:number;is_default_open:number|boolean;
  tenant_configurable:number|boolean;status:'ACTIVE'|'INACTIVE';
}

export type FunctionToolClass='K0'|'K1'|'K2'|'K3'|'K4'|'K5';
export type FunctionWorkspaceView='OVERVIEW'|'GOVERNANCE'|'DELIVERY'|'PERFORMANCE'|'RECORDS';
export type FunctionWorkspaceZone='COMMAND_BAR'|'QUEUE_PANEL'|'WORK_SURFACE'|'OBJECT_INSPECTOR'|'EVIDENCE_PANEL'|'DECISION_PANEL'|'KPI_RAIL';
export type FunctionOperatingSide='BOTH'|'FUNCTIONAL_GOVERNANCE'|'FUNCTIONAL_DELIVERY';
export type ToolLifecycleStatus='REGISTERED'|'RETIRED';
export type ToolImplementationState='PLANNED'|'PARTIAL'|'IMPLEMENTED';

export interface UniversalFunctionActivityView {id:string;name:string;sequence:number;}
export interface UniversalSubFunctionView {
  id:string;code:string;name:string;sequence:number;activities:UniversalFunctionActivityView[];
}
export interface UniversalFunctionJobView {
  industryJobProfileId:string;jobProfileId:string;jobCode:string;canonicalName:string;
}
export interface UniversalFunctionToolView {
  id:string;code:string;name:string;toolClass:FunctionToolClass;ownerFunctionId?:string;purpose:string;
  requiredPermissionKey?:string;requiredAuthorityScope?:string;configSchemaRef?:string;
  consumesObjectTypes:string[];producesObjectTypes:string[];producesDeliverableTypes:string[];
  evidenceRequirements:string[];version:string;lifecycleStatus:ToolLifecycleStatus;
  implementationState:ToolImplementationState;
}
export interface UniversalFunctionToolCompositionView {
  toolId:string;workspaceView:FunctionWorkspaceView;workspaceZone:FunctionWorkspaceZone;
  operatingSide:FunctionOperatingSide;displayOrder:number;isDefaultOpen:boolean;
  tenantConfigurable:boolean;status:'ACTIVE'|'INACTIVE';tool:UniversalFunctionToolView;
}
export interface UniversalFunctionView {
  id:string;code:string;name:string;functionFamily:FunctionFamily;industrySolutionId?:string;
  parentFunctionId?:string;description?:string;status:'ACTIVE'|'INACTIVE';
  subfunctions:UniversalSubFunctionView[];jobs:UniversalFunctionJobView[];
  toolComposition:UniversalFunctionToolCompositionView[];
}

function stringArray(value:unknown):string[]{
  if(Array.isArray(value)) return value.map(String);
  if(typeof value==='string'){
    const parsed=JSON.parse(value) as unknown;
    if(Array.isArray(parsed)) return parsed.map(String);
  }
  return [];
}

function mapTool(row:ToolRow):UniversalFunctionToolView{
  return {
    id:row.id,code:row.code,name:row.name,toolClass:row.tool_class,
    ...(row.owner_function_id?{ownerFunctionId:row.owner_function_id}:{}),
    purpose:row.purpose,
    ...(row.required_permission_key?{requiredPermissionKey:row.required_permission_key}:{}),
    ...(row.required_authority_scope?{requiredAuthorityScope:row.required_authority_scope}:{}),
    ...(row.config_schema_ref?{configSchemaRef:row.config_schema_ref}:{}),
    consumesObjectTypes:stringArray(row.consumes_object_types),
    producesObjectTypes:stringArray(row.produces_object_types),
    producesDeliverableTypes:stringArray(row.produces_deliverable_types),
    evidenceRequirements:stringArray(row.evidence_requirements),
    version:row.version,lifecycleStatus:row.lifecycle_status,implementationState:row.implementation_state
  };
}

export class MySqlUniversalFunctionReadRepository {
  constructor(private readonly pool:Pool){}

  async listFunctions():Promise<UniversalFunctionView[]>{
    const [functions,subs,activities,jobs,tools,compositions]=await Promise.all([
      this.pool.execute<FunctionRow[]>(
        `SELECT id,code,name,function_family,industry_solution_id,parent_function_id,description,status
           FROM function_definitions WHERE status='ACTIVE'
          ORDER BY function_family,code`
      ),
      this.pool.execute<SubFunctionRow[]>(
        `SELECT id,function_id,code,name,sequence
           FROM sub_function_definitions WHERE status='ACTIVE'
          ORDER BY function_id,sequence`
      ),
      this.pool.execute<ActivityRow[]>(
        `SELECT id,sub_function_id,name,sequence
           FROM functional_activity_definitions WHERE status='ACTIVE'
          ORDER BY sub_function_id,sequence`
      ),
      this.pool.execute<JobRow[]>(
        `SELECT d.function_id,ijp.id AS industry_job_profile_id,ijp.job_profile_id,
                jp.code AS job_code,ijp.canonical_name
           FROM delivery_domains d
           JOIN industry_job_profiles ijp
             ON ijp.industry_solution_id=d.industry_solution_id
            AND ijp.primary_delivery_domain_id=d.id
            AND ijp.status='ACTIVE'
           JOIN job_profiles jp ON jp.id=ijp.job_profile_id AND jp.status='ACTIVE'
          WHERE d.function_id IS NOT NULL AND d.status='ACTIVE'
          ORDER BY d.function_id,ijp.sequence`
      ),
      this.pool.execute<ToolRow[]>(
        `SELECT id,code,name,tool_class,owner_function_id,purpose,required_permission_key,
                required_authority_scope,config_schema_ref,consumes_object_types,produces_object_types,
                produces_deliverable_types,evidence_requirements,version,lifecycle_status,implementation_state
           FROM platform_tool_definitions
          WHERE lifecycle_status='REGISTERED'
          ORDER BY tool_class,code`
      ),
      this.pool.execute<CompositionRow[]>(
        `SELECT function_id,tool_id,workspace_view,workspace_zone,operating_side,display_order,
                is_default_open,tenant_configurable,status
           FROM function_tool_compositions
          WHERE status='ACTIVE'
          ORDER BY function_id,workspace_view,display_order,tool_id`
      )
    ]);

    const activitiesBySub=new Map<string,UniversalFunctionActivityView[]>();
    for(const row of activities[0]){
      const list=activitiesBySub.get(row.sub_function_id)??[];
      list.push({id:row.id,name:row.name,sequence:row.sequence});activitiesBySub.set(row.sub_function_id,list);
    }

    const subsByFunction=new Map<string,UniversalSubFunctionView[]>();
    for(const row of subs[0]){
      const list=subsByFunction.get(row.function_id)??[];
      list.push({id:row.id,code:row.code,name:row.name,sequence:row.sequence,activities:activitiesBySub.get(row.id)??[]});
      subsByFunction.set(row.function_id,list);
    }

    const jobsByFunction=new Map<string,UniversalFunctionJobView[]>();
    for(const row of jobs[0]){
      const list=jobsByFunction.get(row.function_id)??[];
      list.push({
        industryJobProfileId:row.industry_job_profile_id,jobProfileId:row.job_profile_id,
        jobCode:row.job_code,canonicalName:row.canonical_name
      });
      jobsByFunction.set(row.function_id,list);
    }

    const toolById=new Map<string,UniversalFunctionToolView>();
    for(const row of tools[0]) toolById.set(row.id,mapTool(row));

    const compositionByFunction=new Map<string,UniversalFunctionToolCompositionView[]>();
    for(const row of compositions[0]){
      const tool=toolById.get(row.tool_id);
      if(!tool) continue;
      const list=compositionByFunction.get(row.function_id)??[];
      list.push({
        toolId:row.tool_id,workspaceView:row.workspace_view,workspaceZone:row.workspace_zone,
        operatingSide:row.operating_side,displayOrder:Number(row.display_order),
        isDefaultOpen:Boolean(row.is_default_open),tenantConfigurable:Boolean(row.tenant_configurable),
        status:row.status,tool
      });
      compositionByFunction.set(row.function_id,list);
    }

    return functions[0].map(row=>({
      id:row.id,code:row.code,name:row.name,functionFamily:row.function_family,
      ...(row.industry_solution_id?{industrySolutionId:row.industry_solution_id}:{}),
      ...(row.parent_function_id?{parentFunctionId:row.parent_function_id}:{}),
      ...(row.description?{description:row.description}:{}),status:row.status,
      subfunctions:subsByFunction.get(row.id)??[],jobs:jobsByFunction.get(row.id)??[],
      toolComposition:compositionByFunction.get(row.id)??[]
    }));
  }

  async getFunction(functionId:string):Promise<UniversalFunctionView|null>{
    const functions=await this.listFunctions();
    return functions.find(item=>item.id===functionId||item.code===functionId.toUpperCase())??null;
  }

  async getCounts():Promise<{total:number;coreBusiness:number;cbe:number;custom:number}>{
    const functions=await this.listFunctions();
    return {
      total:functions.length,
      coreBusiness:functions.filter(item=>item.functionFamily==='CORE_BUSINESS').length,
      cbe:functions.filter(item=>item.functionFamily==='CBE').length,
      custom:functions.filter(item=>item.functionFamily==='CUSTOM').length
    };
  }
}
