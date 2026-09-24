import type { MySqlHcmReadRepository } from '@nublox/persistence';
import type { PageServerLoad } from './$types';
import { getFunction } from '$lib/function-catalog';
import { getHcmReadRepository } from '$lib/server/platform';

type TenantId=Parameters<MySqlHcmReadRepository['getUserExperience']>[0];

export const load:PageServerLoad=async({locals})=>{
  const session=locals.auth;
  if(!session) return {experience:null,workspace:null};
  const experience=await getHcmReadRepository().getUserExperience(
    session.tenantId as TenantId,session.personId
  );
  const workspace=experience?.functionCode?getFunction(experience.functionCode):undefined;
  return {experience,workspace:workspace??null};
};
