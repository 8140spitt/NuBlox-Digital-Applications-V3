import type { MySqlHcmReadRepository } from '@nublox/persistence';
import type { PageServerLoad } from './$types';
import { getHcmReadRepository } from '$lib/server/platform';

type TenantId=Parameters<MySqlHcmReadRepository['getUserExperience']>[0];

export const load:PageServerLoad=async({locals})=>{
  const session=locals.auth;
  if(!session) return {experience:null};
  return {
    experience:await getHcmReadRepository().getUserExperience(
      session.tenantId as TenantId,session.personId
    )
  };
};
