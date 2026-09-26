import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  clearPlatformOperatorSession,
  getPlatformAdministrationService,
  PLATFORM_SESSION_COOKIE
} from '$lib/server/platform-auth';
import {
  getPlatformControlPlaneReadRepository,
  requirePlatformOperator
} from '$lib/server/platform-control-plane';

export const load:PageServerLoad=async({cookies})=>{
  const operator=await requirePlatformOperator(cookies);
  const dashboard=await getPlatformControlPlaneReadRepository().dashboard();
  return {operator,dashboard};
};

export const actions:Actions={
  logout:async({cookies})=>{
    const token=cookies.get(PLATFORM_SESSION_COOKIE);
    if(token) await getPlatformAdministrationService().revokeSession(token);
    clearPlatformOperatorSession(cookies);
    throw redirect(303,'/platform/login');
  }
};
