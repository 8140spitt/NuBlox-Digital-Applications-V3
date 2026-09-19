import { randomUUID } from 'node:crypto';
import { afterAll,beforeAll,describe,expect,it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';
let contextService:typeof import('./platform-context'),info:typeof import('./information-container'),decision:typeof import('./work-decision'),db:typeof import('./db');
beforeAll(async()=>{contextService=await import('./platform-context');info=await import('./information-container');decision=await import('./work-decision');db=await import('./db');});
afterAll(async()=>{await db.closeDbPool();});
describe('AGG-07-INFORMATION controlled information runtime',()=>{
 it('preserves stable identity across immutable issued revisions and representations',async()=>{
  const tenant='information-'+randomUUID().slice(0,8);await seedDevelopmentTenant(tenant);const context=await contextService.resolveDevelopmentCommandContext(tenant);
  const id=await info.createInformationContainer(context,{containerRef:'POL-CORP-001',containerType:'POLICY',title:'Corporate Governance Policy',subjectType:'TENANT',subjectId:context.tenantId,securityClassification:'INTERNAL',revisionCode:'P01',purposeOfIssue:'Review'});
  let container=(await info.listInformationContainers(context)).find(x=>x.id===id)!;expect(container.status).toBe('WORK_IN_PROGRESS');
  await info.addInformationRepresentation(context,id,container.aggregateVersion,{representationType:'PDF',contentReference:'s3://controlled/pol-corp-001-p01.pdf',contentMediaType:'application/pdf',sourceFilename:'POL-CORP-001-P01.pdf',hashAlgorithm:'SHA256',contentHash:'a'.repeat(64)});
  container=(await info.listInformationContainers(context)).find(x=>x.id===id)!;
  await info.submitInformationRevision(context,id,container.aggregateVersion);container=(await info.listInformationContainers(context)).find(x=>x.id===id)!;
  const decisionId=await decision.recordWorkDecision(context,{decisionType:'INFORMATION_REVISION_REVIEW',subjectType:'INFORMATION_CONTAINER',subjectId:id,subjectVersion:'1',outcome:'APPROVED',reason:'Approved controlled revision.'});
  await info.approveInformationRevision(context,id,container.aggregateVersion,decisionId);container=(await info.listInformationContainers(context)).find(x=>x.id===id)!;
  await info.issueInformationRevision(context,id,container.aggregateVersion);container=(await info.listInformationContainers(context)).find(x=>x.id===id)!;expect(container.status).toBe('PUBLISHED');
  const v1=(await info.listInformationRevisions(context,id))[0];expect(v1.lifecycleStatus).toBe('ISSUED');expect(v1.approvalDecisionId).toBe(decisionId);
  await expect(info.addInformationRepresentation(context,id,container.aggregateVersion,{representationType:'PDF',contentReference:'s3://controlled/replacement.pdf',hashAlgorithm:'SHA256',contentHash:'b'.repeat(64)})).rejects.toThrow('after revision approval');
  expect(await info.createSuccessorInformationRevision(context,id,container.aggregateVersion,{revisionCode:'P02',title:'Corporate Governance Policy — revised',purposeOfIssue:'Review'})).toBe(2);
  const revisions=await info.listInformationRevisions(context,id);expect(revisions.map(r=>[r.revisionNo,r.lifecycleStatus])).toEqual([[2,'WORKING'],[1,'ISSUED']]);
  expect(new Set(revisions.map(r=>r.containerId))).toEqual(new Set([id]));
 });
 it('requires at least one representation before issue',async()=>{
  const tenant='information-empty-'+randomUUID().slice(0,8);await seedDevelopmentTenant(tenant);const context=await contextService.resolveDevelopmentCommandContext(tenant);
  const id=await info.createInformationContainer(context,{containerRef:'DOC-001',containerType:'DOCUMENT',title:'Controlled document'});
  let c=(await info.listInformationContainers(context)).find(x=>x.id===id)!;await info.submitInformationRevision(context,id,c.aggregateVersion);c=(await info.listInformationContainers(context)).find(x=>x.id===id)!;
  const d=await decision.recordWorkDecision(context,{decisionType:'INFORMATION_REVISION_REVIEW',subjectType:'INFORMATION_CONTAINER',subjectId:id,subjectVersion:'1',outcome:'APPROVED',reason:'Approved.'});
  await info.approveInformationRevision(context,id,c.aggregateVersion,d);c=(await info.listInformationContainers(context)).find(x=>x.id===id)!;
  await expect(info.issueInformationRevision(context,id,c.aggregateVersion)).rejects.toThrow('at least one Representation');
 });
});
