import type { FunctionFamily, TenantId } from '@nublox/kernel';
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

export interface UniversalFunctionActivityView {id:string;name:string;sequence:number;}
export interface UniversalSubFunctionView {
  id:string;code:string;name:string;sequence:number;activities:UniversalFunctionActivityView[];
}
export interface UniversalFunctionJobView {
  industryJobProfileId:string;jobProfileId:string;jobCode:string;canonicalName:string;
}
export interface UniversalFunctionView {
  id:string;code:string;name:string;functionFamily:FunctionFamily;industrySolutionId?:string;
  parentFunctionId?:string;description?:string;status:'ACTIVE'|'INACTIVE';
  subfunctions:UniversalSubFunctionView[];jobs:UniversalFunctionJobView[];
}

export class MySqlUniversalFunctionReadRepository {
  constructor(private readonly pool:Pool){}

  async listFunctions():Promise<UniversalFunctionView[]>{
    const [functions,subs,activities,jobs]=await Promise.all([
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
    return functions[0].map(row=>({
      id:row.id,code:row.code,name:row.name,functionFamily:row.function_family,
      ...(row.industry_solution_id?{industrySolutionId:row.industry_solution_id}:{}),
      ...(row.parent_function_id?{parentFunctionId:row.parent_function_id}:{}),
      ...(row.description?{description:row.description}:{}),status:row.status,
      subfunctions:subsByFunction.get(row.id)??[],jobs:jobsByFunction.get(row.id)??[]
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
