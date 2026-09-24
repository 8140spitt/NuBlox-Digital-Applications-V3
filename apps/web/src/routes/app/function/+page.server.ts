import type {
  MySqlHcmReadRepository,
  MySqlUniversalFunctionReadRepository
} from '@nublox/persistence';
import type { PageServerLoad } from './$types';
import {
  getHcmReadRepository,
  getUniversalFunctionReadRepository
} from '$lib/server/platform';

type TenantId=Parameters<MySqlHcmReadRepository['getUserExperience']>[0];
type FunctionCode=Parameters<MySqlUniversalFunctionReadRepository['getFunction']>[0];

export const load:PageServerLoad=async({locals})=>{
  const session=locals.auth;
  if(!session) return {experience:null,workspace:null};

  const experience=await getHcmReadRepository().getUserExperience(
    session.tenantId as TenantId,
    session.personId
  );

  const workspace=experience?.functionCode
    ? await getUniversalFunctionReadRepository().getFunction(
        experience.functionCode as FunctionCode
      )
    : null;

  return {experience,workspace};
};
