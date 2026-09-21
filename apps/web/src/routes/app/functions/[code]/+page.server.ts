import {
  PLATFORM_PERMISSION_KEYS,
  type StrategyPlanType,
  type StrategyRecordStatus
} from '@nublox/kernel';
import { StrategyCommandError, type MySqlAccessRepository } from '@nublox/persistence';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getStrategyCommandService,
  getStrategyReadRepository
} from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? '').trim();
}
function optionalValue(formData: FormData, name: string) {
  const v = value(formData, name);
  return v || undefined;
}
function signedIn(locals: App.Locals) {
  if (!locals.auth) throw new StrategyCommandError('Sign in required.', 'PERMISSION_DENIED');
  return locals.auth;
}
function ensureF01(params: { code: string }) {
  if (params.code.toUpperCase() !== 'F01') {
    throw new StrategyCommandError('This native workbench is currently available for F01 only.', 'INVALID_INPUT');
  }
}
function commandFailure(error: unknown, action: string) {
  if (error instanceof StrategyCommandError) {
    const status =
      error.code === 'PERMISSION_DENIED' ? 403 :
      error.code === 'NOT_FOUND' ? 404 :
      error.code === 'CONFLICT' ? 409 : 400;
    return fail(status, { action, ok: false, error: error.message, code: error.code });
  }
  throw error;
}
function owner(formData: FormData) {
  return optionalValue(formData, 'ownerPersonId');
}

export const load: PageServerLoad = async ({ params, locals }) => {
  if (params.code.toUpperCase() !== 'F01') {
    return { strategyWorkbench: null, strategyAllowed: false, strategyCanWork: false, strategyReason: '' };
  }
  const session = locals.auth;
  if (!session) {
    return {
      strategyWorkbench: null,
      strategyAllowed: false,
      strategyCanWork: false,
      strategyReason: 'No authenticated tenant context is available.'
    };
  }
  const tenantId = session.tenantId as TenantId;
  const access = getAccessRepository();
  const [read, work] = await Promise.all([
    access.evaluatePermission(tenantId, session.personId, PLATFORM_PERMISSION_KEYS.F01_READ, { scopeType: 'TENANT' }),
    access.evaluatePermission(tenantId, session.personId, PLATFORM_PERMISSION_KEYS.F01_WORK, { scopeType: 'TENANT' })
  ]);
  if (!read.allowed) {
    return { strategyWorkbench: null, strategyAllowed: false, strategyCanWork: false, strategyReason: read.reason };
  }
  return {
    strategyAllowed: true,
    strategyCanWork: work.allowed,
    strategyReason: read.reason,
    strategyWorkbench: await getStrategyReadRepository().getWorkbench(tenantId)
  };
};

export const actions: Actions = {
  createObjective: async ({ request, locals, params }) => {
    try {
      ensureF01(params);
      const session = signedIn(locals), form = await request.formData();
      await getStrategyCommandService().createObjective(session.tenantId as TenantId, session.personId, {
        code: value(form,'code'), title: value(form,'title'), description: value(form,'description'),
        ownerPersonId: owner(form), parentObjectiveId: optionalValue(form,'parentObjectiveId'),
        level: value(form,'level') as 'ENTERPRISE'|'FUNCTION'|'TEAM',
        effectiveFrom: optionalValue(form,'effectiveFrom'), effectiveTo: optionalValue(form,'effectiveTo')
      });
      return { action:'createObjective', ok:true, message:'Objective created.' };
    } catch(error){ return commandFailure(error,'createObjective'); }
  },

  createKeyResult: async ({ request, locals, params }) => {
    try {
      ensureF01(params);
      const session=signedIn(locals), form=await request.formData();
      await getStrategyCommandService().createKeyResult(session.tenantId as TenantId,session.personId,{
        objectiveId:value(form,'objectiveId'), title:value(form,'title'), measure:value(form,'measure'),
        ownerPersonId:owner(form), baselineValue:optionalValue(form,'baselineValue'),
        targetValue:optionalValue(form,'targetValue'), actualValue:optionalValue(form,'actualValue')
      });
      return {action:'createKeyResult',ok:true,message:'Key Result created.'};
    }catch(error){return commandFailure(error,'createKeyResult');}
  },

  createInitiative: async ({ request, locals, params }) => {
    try{
      ensureF01(params);
      const session=signedIn(locals),form=await request.formData();
      await getStrategyCommandService().createInitiative(session.tenantId as TenantId,session.personId,{
        objectiveId:value(form,'objectiveId'),code:value(form,'code'),title:value(form,'title'),
        description:value(form,'description'),ownerPersonId:owner(form),
        investmentAmount:optionalValue(form,'investmentAmount'),capacityDemand:optionalValue(form,'capacityDemand'),
        startDate:optionalValue(form,'startDate'),endDate:optionalValue(form,'endDate')
      });
      return {action:'createInitiative',ok:true,message:'Initiative aligned to Objective.'};
    }catch(error){return commandFailure(error,'createInitiative');}
  },

  createRoadmap: async ({ request, locals, params }) => {
    try{
      ensureF01(params);
      const session=signedIn(locals),form=await request.formData();
      await getStrategyCommandService().createRoadmap(session.tenantId as TenantId,session.personId,{
        code:value(form,'code'),title:value(form,'title'),description:value(form,'description'),ownerPersonId:owner(form),
        startDate:optionalValue(form,'startDate'),endDate:optionalValue(form,'endDate')
      });
      return {action:'createRoadmap',ok:true,message:'Strategic Roadmap created.'};
    }catch(error){return commandFailure(error,'createRoadmap');}
  },

  addRoadmapItem: async ({ request, locals, params }) => {
    try{
      ensureF01(params);
      const session=signedIn(locals),form=await request.formData();
      await getStrategyCommandService().addRoadmapItem(session.tenantId as TenantId,session.personId,{
        roadmapId:value(form,'roadmapId'),objectiveId:optionalValue(form,'objectiveId'),
        initiativeId:optionalValue(form,'initiativeId'),title:value(form,'title'),
        milestoneDate:optionalValue(form,'milestoneDate'),sequence:value(form,'sequence')
      });
      return {action:'addRoadmapItem',ok:true,message:'Roadmap item added.'};
    }catch(error){return commandFailure(error,'addRoadmapItem');}
  },

  createScenario: async ({ request, locals, params }) => {
    try{
      ensureF01(params);
      const session=signedIn(locals),form=await request.formData();
      await getStrategyCommandService().createScenario(session.tenantId as TenantId,session.personId,{
        code:value(form,'code'),title:value(form,'title'),description:value(form,'description'),ownerPersonId:owner(form),
        baseScenarioId:optionalValue(form,'baseScenarioId'),assumptions:optionalValue(form,'assumptions'),
        budgetAmount:optionalValue(form,'budgetAmount'),capacityAmount:optionalValue(form,'capacityAmount'),
        expectedOutcome:value(form,'expectedOutcome')
      });
      return {action:'createScenario',ok:true,message:'Scenario created for comparison.'};
    }catch(error){return commandFailure(error,'createScenario');}
  },

  createPlan: async ({ request, locals, params }) => {
    try{
      ensureF01(params);
      const session=signedIn(locals),form=await request.formData();
      await getStrategyCommandService().createPlan(session.tenantId as TenantId,session.personId,{
        code:value(form,'code'),title:value(form,'title'),description:value(form,'description'),ownerPersonId:owner(form),
        planType:value(form,'planType') as StrategyPlanType,periodStart:optionalValue(form,'periodStart'),
        periodEnd:optionalValue(form,'periodEnd'),assumptions:optionalValue(form,'assumptions'),
        targetAmount:optionalValue(form,'targetAmount'),forecastAmount:optionalValue(form,'forecastAmount'),
        actualAmount:optionalValue(form,'actualAmount')
      });
      return {action:'createPlan',ok:true,message:'Planning record created.'};
    }catch(error){return commandFailure(error,'createPlan');}
  },

  createOutcome: async ({ request, locals, params }) => {
    try{
      ensureF01(params);
      const session=signedIn(locals),form=await request.formData();
      await getStrategyCommandService().createOutcome(session.tenantId as TenantId,session.personId,{
        initiativeId:value(form,'initiativeId'),title:value(form,'title'),measure:value(form,'measure'),ownerPersonId:owner(form),
        targetValue:optionalValue(form,'targetValue'),actualValue:optionalValue(form,'actualValue'),
        realisedValue:optionalValue(form,'realisedValue')
      });
      return {action:'createOutcome',ok:true,message:'Outcome tracking record created.'};
    }catch(error){return commandFailure(error,'createOutcome');}
  },

  createAnalysis: async ({ request, locals, params }) => {
    try{
      ensureF01(params);
      const session=signedIn(locals),form=await request.formData();
      const [kind='',id='']=value(form,'source').split('|');
      await getStrategyCommandService().createAnalysis(session.tenantId as TenantId,session.personId,{
        title:value(form,'title'),summary:value(form,'summary'),ownerPersonId:owner(form),
        ...(kind==='PLAN'?{planId:id}:{}),...(kind==='SCENARIO'?{scenarioId:id}:{}),...(kind==='OUTCOME'?{outcomeId:id}:{})
      });
      return {action:'createAnalysis',ok:true,message:'Management analysis created.'};
    }catch(error){return commandFailure(error,'createAnalysis');}
  },

  transition: async ({ request, locals, params }) => {
    try{
      ensureF01(params);
      const session=signedIn(locals),form=await request.formData();
      await getStrategyCommandService().transition(session.tenantId as TenantId,session.personId,{
        entityType:value(form,'entityType') as any,entityId:value(form,'entityId'),
        status:value(form,'status') as StrategyRecordStatus
      });
      return {action:'transition',ok:true,message:'Strategy record status updated.'};
    }catch(error){return commandFailure(error,'transition');}
  }
};
