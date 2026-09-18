import { randomUUID } from 'node:crypto';
import { afterAll,beforeAll,describe,expect,it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService:typeof import('./platform-context');
let review:typeof import('./strategic-review');
let person:typeof import('./foundation-person');
let db:typeof import('./db');

beforeAll(async()=>{contextService=await import('./platform-context');review=await import('./strategic-review');person=await import('./foundation-person');db=await import('./db');});
afterAll(async()=>{await db.closeDbPool();});

describe('F01.07 Strategic Review runtime',()=>{
  it('governs meeting evidence while keeping Decision and Action identities separate',async()=>{
    const tenant='review-'+randomUUID().slice(0,8);await seedDevelopmentTenant(tenant);const context=await contextService.resolveDevelopmentCommandContext(tenant);
    const reviewerId=await person.createPerson(context,{givenName:'Review',familyName:'Member'});
    const meetingId=await review.createStrategicReview(context,{
      meetingRef:'STRAT-REV-Q1-2027',governanceContextType:'STRATEGY',governanceContextId:'enterprise-strategy',
      scheduledAt:'2027-03-31T09:00:00Z',locationChannel:'Boardroom / Teams',quorumRequired:2,
      attendees:[{partyId:context.actorPartyId,attendanceRole:'CHAIR'},{partyId:reviewerId,attendanceRole:'MEMBER'}],
      agenda:[
        {subject:'Strategy progress',purpose:'Evaluate strategic progress.',requiredOutcome:'REVIEW',subjectType:'STRATEGY_FRAMEWORK',subjectId:'enterprise-strategy',subjectVersion:'1'},
        {subject:'Assumption challenge',purpose:'Reassess material assumptions.',requiredOutcome:'DECISION',subjectType:'STRATEGIC_ASSUMPTION',subjectId:'market-assumption',subjectVersion:'2'}
      ]
    });
    await review.recordMeetingAttendance(context,meetingId,context.actorPartyId,'PRESENT');
    await review.recordMeetingAttendance(context,meetingId,reviewerId,'PRESENT');
    let meeting=(await review.listGovernanceMeetings(context)).find(row=>row.id===meetingId)!;
    await review.conveneStrategicReview(context,meetingId,meeting.aggregateVersion);
    meeting=(await review.listGovernanceMeetings(context)).find(row=>row.id===meetingId)!;
    expect(meeting.status).toBe('CONVENED');

    await review.addStrategicReviewFinding(context,meetingId,{findingType:'PERFORMANCE',subjectType:'STRATEGY_FRAMEWORK',subjectId:'enterprise-strategy',subjectVersion:'1',finding:'Delivery predictability is below target.',recommendation:'Increase focus on recovery actions and operating-model change.'});
    const decisionId=await review.recordStrategicReviewDecision(context,meetingId,{decisionType:'STRATEGIC_REVIEW_DECISION',subjectType:'STRATEGY_FRAMEWORK',subjectId:'enterprise-strategy',subjectVersion:'1',outcome:'ADJUST_STRATEGY',reason:'Reprioritise delivery predictability.'});
    const action=await review.createStrategicReviewAction(context,meetingId,{title:'Prepare strategy adjustment',instructions:'Draft the controlled strategy change for review.',subjectType:'STRATEGY_FRAMEWORK',subjectId:'enterprise-strategy',subjectVersion:'1',priority:'HIGH'});

    expect((await review.listMeetingDecisionIds(context,meetingId)).map(row=>row.decisionId)).toEqual([decisionId]);
    expect((await review.listMeetingActionIds(context,meetingId)).map(row=>row.workItemId)).toEqual([action.workItemId]);

    await review.completeStrategicReview(context,meetingId,meeting.aggregateVersion,{minutesSummary:'Review completed with one strategic adjustment decision and one follow-up action.',nextReviewAt:'2027-06-30T09:00:00Z'});
    meeting=(await review.listGovernanceMeetings(context)).find(row=>row.id===meetingId)!;
    expect(meeting.status).toBe('COMPLETED');
    expect((await review.listStrategicReviewFindings(context,meetingId))).toHaveLength(1);

    const decision=await db.queryOne<any>('SELECT decision_type AS decisionType FROM work_decisions WHERE id=? AND tenant_id=?',[decisionId,context.tenantId]);
    const work=await db.queryOne<any>('SELECT work_type AS workType FROM work_items WHERE id=? AND tenant_id=?',[action.workItemId,context.tenantId]);
    expect(decision?.decisionType).toBe('STRATEGIC_REVIEW_DECISION');expect(work?.workType).toBe('STRATEGIC_REVIEW_ACTION');
  });
});
