import {
  PLATFORM_PERMISSION_KEYS,
  type DeploymentPurpose,
  type TenantId
} from '@nublox/kernel';
import type { Pool } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import {
  MySqlHcmReadRepository,
  type HcmUserExperience
} from './hcm-read-repository.js';

export interface FunctionWorkAuthorizationOptions {
  requireDelivery?: boolean;
  evaluatedAt?: string;
}

export interface FunctionWorkAuthorization {
  allowed:boolean;
  reason:string;
  unrestricted:boolean;
  permissionKey:string;
  functionCode:string;
  experience?:HcmUserExperience;
  positionIds:readonly string[];
}

export class MySqlFunctionWorkAuthorizationService {
  private readonly access:MySqlAccessRepository;
  private readonly hcm:MySqlHcmReadRepository;

  constructor(pool:Pool) {
    this.access=new MySqlAccessRepository(pool);
    this.hcm=new MySqlHcmReadRepository(pool);
  }

  async resolve(
    tenantId:TenantId,
    personId:string,
    functionCode:string,
    permissionKey:string,
    options:FunctionWorkAuthorizationOptions={}
  ):Promise<FunctionWorkAuthorization> {
    const evaluatedAt=options.evaluatedAt??new Date().toISOString();
    const normalizedFunction=functionCode.trim().toUpperCase();

    const explicit=await this.access.evaluatePermission(
      tenantId,
      personId,
      permissionKey,
      {scopeType:'TENANT'},
      evaluatedAt
    );
    const experience=await this.hcm.getUserExperience(tenantId,personId,evaluatedAt);

    if(explicit.allowed) {
      return {
        allowed:true,
        reason:explicit.reason,
        unrestricted:true,
        permissionKey,
        functionCode:normalizedFunction,
        ...(experience?{experience}:{}),
        positionIds:experience
          ? Object.freeze([
              experience.positionId,
              ...experience.managementScope.map(item=>item.positionId)
            ])
          : Object.freeze([])
      };
    }

    if(!experience) {
      return {
        allowed:false,
        reason:'Human Capital has not established an active primary Position for this Person.',
        unrestricted:false,
        permissionKey,
        functionCode:normalizedFunction,
        positionIds:Object.freeze([])
      };
    }

    if(experience.functionCode?.toUpperCase()!==normalizedFunction) {
      return {
        allowed:false,
        reason:`This Position belongs to ${experience.functionName??experience.functionCode??'another Function'}, not ${normalizedFunction}.`,
        unrestricted:false,
        permissionKey,
        functionCode:normalizedFunction,
        experience,
        positionIds:Object.freeze([])
      };
    }

    const purpose:DeploymentPurpose|undefined=experience.deploymentPurpose;
    if(options.requireDelivery&&purpose!=='FUNCTIONAL_DELIVERY') {
      return {
        allowed:false,
        reason:'This business action requires a Functional Delivery Position or an explicit Access Role grant.',
        unrestricted:false,
        permissionKey,
        functionCode:normalizedFunction,
        experience,
        positionIds:Object.freeze([])
      };
    }

    return {
      allowed:true,
      reason:'Authority derived from the active Human Capital Position and Function assignment.',
      unrestricted:false,
      permissionKey,
      functionCode:normalizedFunction,
      experience,
      positionIds:Object.freeze([
        experience.positionId,
        ...experience.managementScope.map(item=>item.positionId)
      ])
    };
  }

  async resolveF07Read(
    tenantId:TenantId,
    personId:string,
    evaluatedAt?:string
  ):Promise<FunctionWorkAuthorization> {
    return this.resolve(
      tenantId,
      personId,
      'F07',
      PLATFORM_PERMISSION_KEYS.F07_READ,
      {evaluatedAt}
    );
  }

  async resolveF07Work(
    tenantId:TenantId,
    personId:string,
    evaluatedAt?:string
  ):Promise<FunctionWorkAuthorization> {
    return this.resolve(
      tenantId,
      personId,
      'F07',
      PLATFORM_PERMISSION_KEYS.F07_WORK,
      {requireDelivery:true,evaluatedAt}
    );
  }
}
