import { randomUUID } from 'node:crypto';
import { afterAll,beforeAll,describe,expect,it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';
let contextService:typeof import('./platform-context'),frameworkService:typeof import('./authority-framework'),decisionService:typeof import('./work-decision'),db:typeof import('./db');
beforeAll(async()=>{contextService=await import('./platform-context');frameworkService=await import('./authority-framework');decisionService=await import('./work-decision');db=await import('./db');});
afterAll(async()=>{await db.closeDbPool();});
describe('F02.02 Authority Framework runtime',()=>{
 it('governs decision rights and SoD without granting runtime authority',async()=>{
  const tenant='authority-framework-'+randomUUID().slice(0,8);await seedDevelopmentTenant(tenant);const context=await contextService.resolveDevelopmentCommandContext(tenant);
  const id=await frameworkService.createAuthorityFramework(context,{frameworkRef:'CORP-DOA-001',name:'Corporate Delegation and Reserved Matters Framework',scopeType:'TENANT',scopeId:context.tenantId,purpose:'Define enterprise decision rights, reserved matters and segregation of duties.',rules:[
   {ruleKey:'CLASS.EXECUTIVE',ruleType:'AUTHORITY_CLASS',authorityClass:'EXECUTIVE',description:'Executive authority class.'},
   {ruleKey:'DECISION.COMMERCIAL.250K',ruleType:'DECISION_RIGHT',actionType:'COMMERCIAL_APPROVAL',authorityClass:'EXECUTIVE',currencyCode:'GBP',minimumValue:0,maximumValue:250000,allowDelegation:true,description:'Commercial approvals up to GBP 250k.'},
   {ruleKey:'RESERVED.ACQUISITION',ruleType:'RESERVED_MATTER',actionType:'ACQUISITION_APPROVAL',authorityClass:'BOARD',description:'Acquisitions remain a Board reserved matter.'},
   {ruleKey:'SOD.REQUEST.APPROVE',ruleType:'SOD',actionType:'COMMERCIAL_APPROVAL',incompatibleRoleKey:'COMMERCIAL_REQUESTOR',description:'Requestors cannot self-approve commercial commitments.'}
  ]});
  let f=(await frameworkService.listAuthorityFrameworks(context)).find(x=>x.id===id)!;expect(f.status).toBe('DRAFT');expect(await frameworkService.listAuthorityFrameworkRules(context,id,1)).toHaveLength(4);
  await frameworkService.submitAuthorityFramework(context,id,f.aggregateVersion);f=(await frameworkService.listAuthorityFrameworks(context)).find(x=>x.id===id)!;
  const decisionId=await decisionService.recordWorkDecision(context,{decisionType:'AUTHORITY_FRAMEWORK_REVIEW',subjectType:'AUTHORITY_FRAMEWORK',subjectId:id,subjectVersion:'1',outcome:'APPROVED',reason:'Approved by governance review.'});
  await frameworkService.approveAuthorityFramework(context,id,f.aggregateVersion,decisionId);f=(await frameworkService.listAuthorityFrameworks(context)).find(x=>x.id===id)!;await frameworkService.activateAuthorityFramework(context,id,f.aggregateVersion);
  f=(await frameworkService.listAuthorityFrameworks(context)).find(x=>x.id===id)!;expect(f.status).toBe('ACTIVE');expect(f.activeVersionNo).toBe(1);
  expect(await db.queryRows<any>('SELECT id FROM delegated_authorities WHERE tenant_id = ?',[context.tenantId])).toHaveLength(0);
  const versions=await frameworkService.listAuthorityFrameworkVersions(context,id);expect(versions[0].approvalDecisionId).toBe(decisionId);expect(versions[0].lifecycleStatus).toBe('ACTIVE');
 });
 it('creates a successor immutable framework version',async()=>{
  const tenant='authority-framework-version-'+randomUUID().slice(0,8);await seedDevelopmentTenant(tenant);const context=await contextService.resolveDevelopmentCommandContext(tenant);
  const id=await frameworkService.createAuthorityFramework(context,{frameworkRef:'CORP-DOA-002',name:'Delegation Framework',purpose:'Initial framework.',rules:[{ruleKey:'DECISION.CAPEX',ruleType:'DECISION_RIGHT',actionType:'CAPEX_APPROVAL',authorityClass:'EXECUTIVE',description:'Capex decision right.'}]});
  const f=(await frameworkService.listAuthorityFrameworks(context)).find(x=>x.id===id)!;
  expect(await frameworkService.reviseAuthorityFramework(context,id,f.aggregateVersion,{name:f.name,purpose:'Revised framework.',rules:[{ruleKey:'DECISION.CAPEX',ruleType:'DECISION_RIGHT',actionType:'CAPEX_APPROVAL',authorityClass:'EXECUTIVE',description:'Capex decision right.'},{ruleKey:'RESERVED.MA',ruleType:'RESERVED_MATTER',actionType:'ACQUISITION_APPROVAL',authorityClass:'BOARD',description:'M&A remains Board reserved.'}]})).toBe(2);
  expect((await frameworkService.listAuthorityFrameworkVersions(context,id)).map(v=>v.versionNo)).toEqual([2,1]);
  expect(await frameworkService.listAuthorityFrameworkRules(context,id,1)).toHaveLength(1);expect(await frameworkService.listAuthorityFrameworkRules(context,id,2)).toHaveLength(2);
 });
});
