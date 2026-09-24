import type { MetadataConstraintType, MetadataDataType } from './metadata.js';

export interface MetadataConstraintRuntimeInput {
  code: string;
  constraintType: MetadataConstraintType;
  configuration: Readonly<Record<string, unknown>>;
  dataType: MetadataDataType;
  value: unknown;
  referenceObjectFamily?: string;
  referenceTypeDefinitionId?: string;
}

export interface MetadataConstraintRuntimeResult {
  supported: boolean;
  passed: boolean;
  message?: string;
}

function fail(message:string):MetadataConstraintRuntimeResult{
  return {supported:true,passed:false,message};
}
function ok():MetadataConstraintRuntimeResult{
  return {supported:true,passed:true};
}
function stringArray(value:unknown,key:string):string[]|undefined{
  if(value===undefined) return undefined;
  if(!Array.isArray(value)||value.some(item=>typeof item!=='string'||!item.trim())){
    return undefined;
  }
  return value.map(item=>String(item).trim());
}
function numberConfig(value:unknown):number|undefined{
  if(value===undefined||value===null||value==='') return undefined;
  const parsed=typeof value==='number'?value:Number(value);
  return Number.isFinite(parsed)?parsed:undefined;
}
function integerConfig(value:unknown):number|undefined{
  const parsed=numberConfig(value);
  return parsed!==undefined&&Number.isInteger(parsed)&&parsed>=0?parsed:undefined;
}
function isMissing(value:unknown):boolean{
  return value===null||value===undefined||
    (typeof value==='string'&&value.trim()==='')||
    (Array.isArray(value)&&value.length===0);
}

export function evaluateMetadataConstraint(
  input:MetadataConstraintRuntimeInput
):MetadataConstraintRuntimeResult{
  const {configuration,dataType,value}=input;
  switch(input.constraintType){
    case 'REQUIRED':
      return isMissing(value)?fail(`${input.code}: value is required.`):ok();

    case 'MIN_MAX': {
      if(!['INTEGER','DECIMAL','DATE','DATETIME'].includes(dataType)){
        return fail(`${input.code}: MIN_MAX is not valid for ${dataType}.`);
      }
      const min=configuration.min;
      const max=configuration.max;
      if(min===undefined&&max===undefined){
        return fail(`${input.code}: MIN_MAX requires min and/or max configuration.`);
      }
      if(dataType==='INTEGER'||dataType==='DECIMAL'){
        const actual=typeof value==='number'?value:Number(value);
        const minNumber=numberConfig(min);
        const maxNumber=numberConfig(max);
        if(!Number.isFinite(actual)) return fail(`${input.code}: value is not numeric.`);
        if(min!==undefined&&minNumber===undefined) return fail(`${input.code}: configured min is invalid.`);
        if(max!==undefined&&maxNumber===undefined) return fail(`${input.code}: configured max is invalid.`);
        if(minNumber!==undefined&&actual<minNumber) return fail(`${input.code}: value is below minimum ${minNumber}.`);
        if(maxNumber!==undefined&&actual>maxNumber) return fail(`${input.code}: value is above maximum ${maxNumber}.`);
        return ok();
      }
      const actualTime=Date.parse(String(value));
      const minTime=min===undefined?undefined:Date.parse(String(min));
      const maxTime=max===undefined?undefined:Date.parse(String(max));
      if(Number.isNaN(actualTime)) return fail(`${input.code}: value is not a valid date/time.`);
      if(min!==undefined&&(minTime===undefined||Number.isNaN(minTime))) return fail(`${input.code}: configured min is invalid.`);
      if(max!==undefined&&(maxTime===undefined||Number.isNaN(maxTime))) return fail(`${input.code}: configured max is invalid.`);
      if(minTime!==undefined&&actualTime<minTime) return fail(`${input.code}: value is before the configured minimum.`);
      if(maxTime!==undefined&&actualTime>maxTime) return fail(`${input.code}: value is after the configured maximum.`);
      return ok();
    }

    case 'LENGTH': {
      const minLength=integerConfig(configuration.minLength);
      const maxLength=integerConfig(configuration.maxLength);
      if(configuration.minLength!==undefined&&minLength===undefined){
        return fail(`${input.code}: configured minLength is invalid.`);
      }
      if(configuration.maxLength!==undefined&&maxLength===undefined){
        return fail(`${input.code}: configured maxLength is invalid.`);
      }
      if(minLength===undefined&&maxLength===undefined){
        return fail(`${input.code}: LENGTH requires minLength and/or maxLength.`);
      }
      const length=typeof value==='string'||Array.isArray(value)?value.length:undefined;
      if(length===undefined) return fail(`${input.code}: LENGTH requires a string or array value.`);
      if(minLength!==undefined&&length<minLength) return fail(`${input.code}: length is below minimum ${minLength}.`);
      if(maxLength!==undefined&&length>maxLength) return fail(`${input.code}: length exceeds maximum ${maxLength}.`);
      return ok();
    }

    case 'PATTERN': {
      if(dataType!=='STRING') return fail(`${input.code}: PATTERN is only valid for STRING fields.`);
      const pattern=configuration.pattern;
      const flags=configuration.flags??'';
      if(typeof pattern!=='string'||!pattern) return fail(`${input.code}: PATTERN requires a pattern string.`);
      if(typeof flags!=='string'||/[^imsu]/.test(flags)) return fail(`${input.code}: PATTERN flags are invalid.`);
      try{
        return new RegExp(pattern,flags).test(String(value))
          ?ok()
          :fail(`${input.code}: value does not match the configured pattern.`);
      }catch{
        return fail(`${input.code}: configured regular expression is invalid.`);
      }
    }

    case 'ENUMERATION': {
      if(dataType!=='ENUMERATION') return fail(`${input.code}: ENUMERATION constraint requires an ENUMERATION field.`);
      const allowed=stringArray(configuration.allowedValueIds,'allowedValueIds');
      const excluded=stringArray(configuration.excludedValueIds,'excludedValueIds');
      if(configuration.allowedValueIds!==undefined&&!allowed) return fail(`${input.code}: allowedValueIds configuration is invalid.`);
      if(configuration.excludedValueIds!==undefined&&!excluded) return fail(`${input.code}: excludedValueIds configuration is invalid.`);
      const id=String(value);
      if(allowed&& !allowed.includes(id)) return fail(`${input.code}: enumeration value is not allowed.`);
      if(excluded?.includes(id)) return fail(`${input.code}: enumeration value is excluded.`);
      return ok();
    }

    case 'REFERENCE': {
      if(dataType!=='REFERENCE') return fail(`${input.code}: REFERENCE constraint requires a REFERENCE field.`);
      const families=stringArray(configuration.allowedObjectFamilies,'allowedObjectFamilies');
      const types=stringArray(configuration.allowedTypeDefinitionIds,'allowedTypeDefinitionIds');
      if(configuration.allowedObjectFamilies!==undefined&&!families){
        return fail(`${input.code}: allowedObjectFamilies configuration is invalid.`);
      }
      if(configuration.allowedTypeDefinitionIds!==undefined&&!types){
        return fail(`${input.code}: allowedTypeDefinitionIds configuration is invalid.`);
      }
      if(families&&(!input.referenceObjectFamily||!families.includes(input.referenceObjectFamily))){
        return fail(`${input.code}: referenced object family is not allowed.`);
      }
      if(types&&(!input.referenceTypeDefinitionId||!types.includes(input.referenceTypeDefinitionId))){
        return fail(`${input.code}: referenced Thing type is not allowed.`);
      }
      return ok();
    }

    case 'CUSTOM':
      return {
        supported:false,
        passed:false,
        message:`${input.code}: CUSTOM constraint requires a registered evaluator.`
      };
  }
}
