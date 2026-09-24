import { describe,expect,it } from 'vitest';
import { evaluateMetadataConstraint } from './metadata-constraint-runtime.js';

describe('metadata constraint runtime',()=>{
  it('enforces required, ranges, lengths and patterns',()=>{
    expect(evaluateMetadataConstraint({
      code:'REQ',constraintType:'REQUIRED',configuration:{},dataType:'STRING',value:''
    }).passed).toBe(false);
    expect(evaluateMetadataConstraint({
      code:'VALUE_RANGE',constraintType:'MIN_MAX',configuration:{min:10,max:20},dataType:'DECIMAL',value:15
    }).passed).toBe(true);
    expect(evaluateMetadataConstraint({
      code:'VALUE_RANGE',constraintType:'MIN_MAX',configuration:{min:10,max:20},dataType:'DECIMAL',value:25
    }).passed).toBe(false);
    expect(evaluateMetadataConstraint({
      code:'CODE_LENGTH',constraintType:'LENGTH',configuration:{minLength:3,maxLength:6},dataType:'STRING',value:'ABC'
    }).passed).toBe(true);
    expect(evaluateMetadataConstraint({
      code:'CODE_PATTERN',constraintType:'PATTERN',configuration:{pattern:'^[A-Z]{3}-\\d{3}$'},dataType:'STRING',value:'ABC-123'
    }).passed).toBe(true);
  });

  it('narrows enumerations and references and fails closed for custom constraints',()=>{
    expect(evaluateMetadataConstraint({
      code:'ENUM_ALLOWED',constraintType:'ENUMERATION',
      configuration:{allowedValueIds:['ENUMV-A']},dataType:'ENUMERATION',value:'ENUMV-B'
    }).passed).toBe(false);
    expect(evaluateMetadataConstraint({
      code:'REF_ALLOWED',constraintType:'REFERENCE',
      configuration:{allowedObjectFamilies:['PARTY'],allowedTypeDefinitionIds:['TYPE-CUSTOMER']},
      dataType:'REFERENCE',value:'THING-1',referenceObjectFamily:'PARTY',referenceTypeDefinitionId:'TYPE-CUSTOMER'
    }).passed).toBe(true);
    expect(evaluateMetadataConstraint({
      code:'CUSTOM_RULE',constraintType:'CUSTOM',configuration:{},dataType:'STRING',value:'x'
    })).toMatchObject({supported:false,passed:false});
  });
});
