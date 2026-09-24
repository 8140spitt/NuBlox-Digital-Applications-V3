import { PLATFORM_PERMISSION_KEYS, type TenantId } from '@nublox/kernel';
import type { Pool } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlExtensionRepository } from './extension-repository.js';

export class ExtensionReadError extends Error {
  constructor(message:string,readonly code:'PERMISSION_DENIED'){super(message);this.name='ExtensionReadError';}
}
export class MySqlExtensionReadRepository {
  private readonly access:MySqlAccessRepository;
  private readonly repo:MySqlExtensionRepository;
  constructor(private readonly pool:Pool){this.access=new MySqlAccessRepository(pool);this.repo=new MySqlExtensionRepository(pool);}
  async getProjection(t:TenantId,actor:string){
    const e=await this.access.evaluatePermission(t,actor,PLATFORM_PERMISSION_KEYS.EXTENSION_READ,{scopeType:'TENANT'});
    if(!e.allowed)throw new ExtensionReadError(e.reason,'PERMISSION_DENIED');
    const [definitions,packages,components,assessments,runs,items]=await Promise.all([
      this.repo.listDefinitions(t),this.repo.listPackages(t),this.repo.listComponents(t),
      this.repo.listAssessments(t),this.repo.listRuns(t),this.repo.listItems(t)
    ]);
    return {
      definitions:definitions.map(d=>({...d,packages:packages.filter(p=>p.extensionDefinitionId===d.id).map(p=>({
        ...p,
        components:components.filter(c=>c.packageVersionId===p.id),
        assessments:assessments.filter(a=>a.packageVersionId===p.id)
      }))})),
      runs:runs.map(r=>({...r,items:items.filter(i=>i.reconciliationRunId===r.id)})),
      totals:{
        definitions:definitions.length,
        packageVersions:packages.length,
        compatibilityAssessments:assessments.length,
        reconciliationRuns:runs.length,
        blockedReconciliations:runs.filter(r=>r.status==='BLOCKED').length
      }
    };
  }
}
