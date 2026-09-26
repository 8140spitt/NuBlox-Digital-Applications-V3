import {
  MySqlPlatformControlPlaneCommandService,
  MySqlPlatformControlPlaneReadRepository,
  type PlatformOperatorSession
} from '@nublox/persistence';
import { redirect, type Cookies } from '@sveltejs/kit';
import { getDatabasePool } from './platform';
import { resolvePlatformOperatorSession } from './platform-auth';

let readRepository:MySqlPlatformControlPlaneReadRepository|undefined;
let commandService:MySqlPlatformControlPlaneCommandService|undefined;

export function getPlatformControlPlaneReadRepository():MySqlPlatformControlPlaneReadRepository {
  if(!readRepository) readRepository=new MySqlPlatformControlPlaneReadRepository(getDatabasePool());
  return readRepository;
}

export function getPlatformControlPlaneCommandService():MySqlPlatformControlPlaneCommandService {
  if(!commandService) commandService=new MySqlPlatformControlPlaneCommandService(getDatabasePool());
  return commandService;
}

export async function requirePlatformOperator(cookies:Cookies):Promise<PlatformOperatorSession> {
  const operator=await resolvePlatformOperatorSession(cookies);
  if(!operator) throw redirect(303,'/platform/login');
  return operator;
}
