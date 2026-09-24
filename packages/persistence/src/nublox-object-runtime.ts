import {
  PLATFORM_PERMISSION_KEYS,
  isMetadataEffective,
  type MetadataCardinality,
  type MetadataDataType,
  type TenantId
} from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlKernelControlRepository } from './control-repository.js';
import {
  MySqlMetadataAdministrationReadRepository,
  type MetadataAttributeView,
  type MetadataEffectiveAttributeView
} from './metadata-administration-read-repository.js';
import { MySqlThingAdministrationCommandService } from './thing-administration-command-service.js';
import {
  MySqlThingAdministrationReadRepository,
  type ThingRelationshipView,
  type ThingView
} from './thing-administration-read-repository.js';

interface TransitionRow extends RowDataPacket {
  id:string;
  code:string;
  name:string;
  lifecycle_definition_id:string;
  from_state_id:string;
  to_state_id:string;
  requires_decision:number;
  required_decision_type:string|null;
  required_decision_outcome:string|null;
}

export interface NuBloxObjectFieldDefinition {
  assignmentId:string;
  attributeDefinitionId:string;
  code:string;
  propertyName:string;
  name:string;
  dataType:MetadataDataType;
  cardinality:MetadataCardinality;
  required:boolean;
  defaultValue?:unknown;
  enumerationDefinitionId?:string;
  referenceObjectFamily?:string;
}

export interface NuBloxObjectTransitionDefinition {
  id:string;
  code:string;
  methodName:string;
  name:string;
  lifecycleDefinitionId:string;
  fromStateId:string;
  toStateId:string;
  requiresDecision:boolean;
  requiredDecisionType?:string;
  requiredDecisionOutcome?:string;
}

export interface NuBloxObjectDefinition {
  typeDefinitionId:string;
  code:string;
  name:string;
  objectFamily:string;
  version:number;
  lifecycleDefinitionId?:string;
  creationPolicyReference?:string;
  nativeAuthority:boolean;
  fields:readonly NuBloxObjectFieldDefinition[];
  transitions:readonly NuBloxObjectTransitionDefinition[];
}

export interface NuBloxObjectInput {
  id?:string;
  stableKey?:string;
  displayName?:string;
  [property:string]:unknown;
}

export interface NuBloxTransitionOptions {
  decisionId?:string;
  subjectVersion?:string;
  effectiveAt?:string;
}

export interface NuBloxObjectConstructor<T extends NuBloxObject = NuBloxObject> {
  new(data?:NuBloxObjectInput):T;
  readonly definition:NuBloxObjectDefinition;
  load(id:string):Promise<T>;
  create(data:NuBloxObjectInput):Promise<T>;
}

export class NuBloxObjectRuntimeError extends Error {
  constructor(
    message:string,
    readonly code:'TYPE_NOT_FOUND'|'INVALID_FIELD'|'INVALID_INPUT'|'NATIVE_AUTHORITY'|'PERMISSION_DENIED'|'NOT_FOUND'
  ){
    super(message);
    this.name='NuBloxObjectRuntimeError';
  }
}

function propertyName(code:string):string{
  const parts=code
    .trim()
    .replace(/([a-z0-9])([A-Z])/g,'$1_$2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map(part=>part.toLowerCase());
  if(parts.length===0) throw new NuBloxObjectRuntimeError(`Field code ${code} cannot become a JavaScript property.`,'INVALID_FIELD');
  const result=parts[0]+parts.slice(1).map(part=>part.charAt(0).toUpperCase()+part.slice(1)).join('');
  if(!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(result)){
    throw new NuBloxObjectRuntimeError(`Field code ${code} cannot become a JavaScript property.`,'INVALID_FIELD');
  }
  return result;
}

function transitionMethodName(code:string):string{
  return propertyName(code);
}

function cloneDefault(value:unknown):unknown{
  if(value===undefined||value===null||typeof value!=='object') return value;
  return structuredClone(value);
}

function missing(value:unknown):boolean{
  return value===undefined||value===null||value===''||(Array.isArray(value)&&value.length===0);
}

function writeScalar(value:unknown,dataType:MetadataDataType):unknown{
  if(value&&typeof value==='object'&&'id' in value&&(dataType==='ENUMERATION'||dataType==='REFERENCE')){
    return String((value as {id:unknown}).id);
  }
  return value;
}

function fieldValues(value:unknown,field:NuBloxObjectFieldDefinition):Array<{sequence:number;value:unknown}>{
  if(field.cardinality==='MULTIPLE'){
    if(value===undefined||value===null) return [];
    if(!Array.isArray(value)){
      throw new NuBloxObjectRuntimeError(`${field.propertyName} must be an array.`,'INVALID_INPUT');
    }
    return value.map((item,sequence)=>({sequence,value:writeScalar(item,field.dataType)}));
  }
  if(value===undefined||value===null||value==='') return [];
  if(Array.isArray(value)){
    throw new NuBloxObjectRuntimeError(`${field.propertyName} is single-valued.`,'INVALID_INPUT');
  }
  return [{sequence:0,value:writeScalar(value,field.dataType)}];
}

function validateLocalValue(field:NuBloxObjectFieldDefinition,value:unknown):void{
  if(missing(value)){
    if(field.required){
      throw new NuBloxObjectRuntimeError(`${field.propertyName} is required.`,'INVALID_INPUT');
    }
    return;
  }
  if(field.cardinality==='MULTIPLE'){
    if(!Array.isArray(value)){
      throw new NuBloxObjectRuntimeError(`${field.propertyName} must be an array.`,'INVALID_INPUT');
    }
    for(const item of value) validateLocalValue({...field,cardinality:'SINGLE',required:false},item);
    return;
  }
  switch(field.dataType){
    case 'STRING':
      if(typeof value!=='string') throw new NuBloxObjectRuntimeError(`${field.propertyName} must be a string.`,'INVALID_INPUT');
      break;
    case 'INTEGER':
      if(!(typeof value==='number'&&Number.isSafeInteger(value))){
        throw new NuBloxObjectRuntimeError(`${field.propertyName} must be an integer.`,'INVALID_INPUT');
      }
      break;
    case 'DECIMAL':
      if(!((typeof value==='number'&&Number.isFinite(value))||(typeof value==='string'&&value.trim()!==''&&!Number.isNaN(Number(value))))){
        throw new NuBloxObjectRuntimeError(`${field.propertyName} must be numeric.`,'INVALID_INPUT');
      }
      break;
    case 'BOOLEAN':
      if(typeof value!=='boolean') throw new NuBloxObjectRuntimeError(`${field.propertyName} must be boolean.`,'INVALID_INPUT');
      break;
    case 'DATE':
    case 'DATETIME':
      if(typeof value!=='string'||Number.isNaN(Date.parse(value))){
        throw new NuBloxObjectRuntimeError(`${field.propertyName} must be a valid date/time string.`,'INVALID_INPUT');
      }
      break;
    case 'ENUMERATION':
    case 'REFERENCE':
      if(!(typeof value==='string'||(typeof value==='object'&&value!==null&&'id' in value))){
        throw new NuBloxObjectRuntimeError(`${field.propertyName} must identify a governed value or Thing.`,'INVALID_INPUT');
      }
      break;
    case 'JSON':
      break;
  }
}

function deriveStableKey(
  definition:NuBloxObjectDefinition,
  values:ReadonlyMap<string,unknown>,
  explicit?:string
):string|undefined{
  const supplied=explicit?.trim();
  if(supplied) return supplied;
  for(const candidate of ['NUMBER','CODE','ID']){
    const field=definition.fields.find(item=>item.code===candidate);
    if(!field) continue;
    const value=values.get(field.code);
    if(value!==undefined&&value!==null&&String(value).trim()) return String(value).trim();
  }
  return undefined;
}

function deriveDisplayName(
  definition:NuBloxObjectDefinition,
  values:ReadonlyMap<string,unknown>,
  explicit?:string
):string|undefined{
  const supplied=explicit?.trim();
  if(supplied) return supplied;
  for(const candidate of ['NAME','TITLE','NUMBER','CODE']){
    const field=definition.fields.find(item=>item.code===candidate);
    if(!field) continue;
    const value=values.get(field.code);
    if(typeof value==='string'&&value.trim()) return value.trim();
  }
  return undefined;
}

export class NuBloxObject {
  id:string|undefined;
  stableKey:string|undefined;
  displayName:string|undefined;
  status:'ACTIVE'|'INACTIVE'|undefined;
  lifecycle:ThingView['lifecycle']|undefined;

  readonly #runtime:MySqlNuBloxObjectFactory;
  readonly #definition:NuBloxObjectDefinition;
  readonly #values=new Map<string,unknown>();
  readonly #dirty=new Set<string>();
  #relationships:ThingRelationshipView[]=[];

  constructor(
    runtime:MySqlNuBloxObjectFactory,
    definition:NuBloxObjectDefinition,
    data:NuBloxObjectInput={}
  ){
    this.#runtime=runtime;
    this.#definition=definition;
    this.id=typeof data.id==='string'?data.id:undefined;
    this.stableKey=typeof data.stableKey==='string'?data.stableKey:undefined;
    this.displayName=typeof data.displayName==='string'?data.displayName:undefined;

    for(const field of definition.fields){
      if(field.defaultValue!==undefined){
        this.#values.set(field.code,cloneDefault(field.defaultValue));
      }
      const direct=data[field.propertyName];
      const byCode=data[field.code];
      const supplied=direct!==undefined?direct:byCode;
      if(supplied!==undefined){
        this.#values.set(field.code,supplied);
        this.#dirty.add(field.code);
      }
    }
  }

  get definition():NuBloxObjectDefinition{return this.#definition;}

  getField(codeOrProperty:string):unknown{
    const field=this.#field(codeOrProperty);
    return this.#values.get(field.code);
  }

  setField(codeOrProperty:string,value:unknown):this{
    const field=this.#field(codeOrProperty);
    validateLocalValue({...field,required:false},value);
    this.#values.set(field.code,value);
    this.#dirty.add(field.code);
    return this;
  }

  validate():true{
    for(const field of this.#definition.fields){
      validateLocalValue(field,this.#values.get(field.code));
    }
    return true;
  }

  relationships(code?:string):readonly ThingRelationshipView[]{
    const normalized=code?.trim().toUpperCase();
    return Object.freeze(
      this.#relationships.filter(item=>!normalized||item.code.toUpperCase()===normalized)
    );
  }

  async save():Promise<this>{
    this.validate();
    if(!this.id){
      if(this.#definition.nativeAuthority){
        throw new NuBloxObjectRuntimeError(
          `${this.#definition.code} is native-authority controlled; create it through its authoritative NuBlox service and load it through the ObjectFactory.`,
          'NATIVE_AUTHORITY'
        );
      }
      const stableKey=deriveStableKey(this.#definition,this.#values,this.stableKey);
      if(!stableKey){
        throw new NuBloxObjectRuntimeError(
          `${this.#definition.code} requires stableKey because no NUMBER, CODE or ID field can supply one.`,
          'INVALID_INPUT'
        );
      }
      const displayName=deriveDisplayName(this.#definition,this.#values,this.displayName);
      const created=await this.#runtime.createThing(this.#definition,{
        stableKey,
        ...(displayName?{displayName}:{}),
        fieldValues:this.#writeValues()
      });
      this.id=created.id;
      this.stableKey=created.stableKey;
      this.displayName=created.displayName;
      this.status=created.status;
      this.#dirty.clear();
      return this.refresh();
    }

    for(const code of Array.from(this.#dirty)){
      const field=this.#definition.fields.find(item=>item.code===code);
      if(!field) continue;
      await this.#runtime.replaceFieldValues(
        this.id,field,fieldValues(this.#values.get(code),field)
      );
    }
    this.#dirty.clear();
    return this.refresh();
  }

  async refresh():Promise<this>{
    if(!this.id) return this;
    const view=await this.#runtime.getThing(this.id);
    if(!view) throw new NuBloxObjectRuntimeError(`Thing ${this.id} was not found.`,'NOT_FOUND');
    if(view.typeDefinitionId!==this.#definition.typeDefinitionId){
      throw new NuBloxObjectRuntimeError(
        `Thing ${this.id} is ${view.typeCode}, not ${this.#definition.code}.`,
        'INVALID_INPUT'
      );
    }
    this.stableKey=view.stableKey;
    this.displayName=view.displayName;
    this.status=view.status;
    this.lifecycle=view.lifecycle;
    this.#relationships=[...view.relationships];
    this.#values.clear();
    for(const field of this.#definition.fields){
      if(field.defaultValue!==undefined) this.#values.set(field.code,cloneDefault(field.defaultValue));
    }
    const grouped=new Map<string,Array<{sequence:number;value:unknown}>>();
    for(const value of view.fields){
      const list=grouped.get(value.code)??[];
      list.push({sequence:value.sequence,value:value.value});
      grouped.set(value.code,list);
    }
    for(const field of this.#definition.fields){
      const values=(grouped.get(field.code)??[]).sort((a,b)=>a.sequence-b.sequence);
      if(field.cardinality==='MULTIPLE'){
        if(values.length) this.#values.set(field.code,values.map(item=>item.value));
      }else if(values[0]){
        this.#values.set(field.code,values[0].value);
      }
    }
    this.#dirty.clear();
    return this;
  }

  async transition(code:string,options:NuBloxTransitionOptions={}):Promise<this>{
    if(!this.id) throw new NuBloxObjectRuntimeError('Save the Thing before changing lifecycle state.','INVALID_INPUT');
    if(!this.lifecycle) throw new NuBloxObjectRuntimeError(`${this.#definition.code} has no active lifecycle state.`,'INVALID_INPUT');
    const transition=this.#definition.transitions.find(item=>
      item.code.toUpperCase()===code.trim().toUpperCase()&&
      item.fromStateId===this.lifecycle?.stateId
    );
    if(!transition){
      throw new NuBloxObjectRuntimeError(
        `Transition ${code} is not available from lifecycle state ${this.lifecycle.stateCode}.`,
        'INVALID_INPUT'
      );
    }
    if(transition.requiresDecision&&!options.decisionId){
      throw new NuBloxObjectRuntimeError(
        `Transition ${transition.code} requires a governed Decision.`,
        'INVALID_INPUT'
      );
    }
    await this.#runtime.transition(this.id,transition,this.lifecycle.sequence,options);
    return this.refresh();
  }

  toJSON():Readonly<Record<string,unknown>>{
    const result:Record<string,unknown>={
      ...(this.id?{id:this.id}:{}),
      type:this.#definition.code,
      ...(this.stableKey?{stableKey:this.stableKey}:{}),
      ...(this.displayName?{displayName:this.displayName}:{}),
      ...(this.status?{status:this.status}:{}),
      ...(this.lifecycle?{lifecycle:this.lifecycle}:{})
    };
    for(const field of this.#definition.fields){
      result[field.propertyName]=this.#values.get(field.code);
    }
    return Object.freeze(result);
  }

  #field(codeOrProperty:string):NuBloxObjectFieldDefinition{
    const field=this.#definition.fields.find(item=>
      item.code===codeOrProperty||item.propertyName===codeOrProperty
    );
    if(!field) throw new NuBloxObjectRuntimeError(
      `${codeOrProperty} is not a field on ${this.#definition.code}.`,'INVALID_FIELD'
    );
    return field;
  }

  #writeValues():Array<{typeAttributeAssignmentId:string;sequence:number;value:unknown}>{
    const values:Array<{typeAttributeAssignmentId:string;sequence:number;value:unknown}>=[];
    for(const field of this.#definition.fields){
      for(const item of fieldValues(this.#values.get(field.code),field)){
        values.push({
          typeAttributeAssignmentId:field.assignmentId,
          sequence:item.sequence,
          value:item.value
        });
      }
    }
    return values;
  }
}

export class MySqlNuBloxObjectFactory {
  private readonly access:MySqlAccessRepository;
  private readonly metadata:MySqlMetadataAdministrationReadRepository;
  private readonly commands:MySqlThingAdministrationCommandService;
  private readonly reads:MySqlThingAdministrationReadRepository;
  private readonly control:MySqlKernelControlRepository;
  private readonly cache=new Map<string,NuBloxObjectConstructor>();

  constructor(
    private readonly pool:Pool,
    readonly tenantId:TenantId,
    readonly actorPersonId:string
  ){
    this.access=new MySqlAccessRepository(pool);
    this.metadata=new MySqlMetadataAdministrationReadRepository(pool);
    this.commands=new MySqlThingAdministrationCommandService(pool);
    this.reads=new MySqlThingAdministrationReadRepository(pool);
    this.control=new MySqlKernelControlRepository(pool);
  }

  async define(input:string|{type:string}):Promise<NuBloxObjectConstructor>{
    const typeCode=(typeof input==='string'?input:input.type).trim().toUpperCase();
    const cached=this.cache.get(typeCode);
    if(cached) return cached;

    const definition=await this.loadDefinition(typeCode);
    const runtime=this;
    const DynamicClass=class extends NuBloxObject {
      static readonly definition=definition;
      constructor(data:NuBloxObjectInput={}){
        super(runtime,definition,data);
      }
      static async load(id:string){
        const instance=new this();
        instance.id=id;
        return instance.refresh();
      }
      static async create(data:NuBloxObjectInput){
        const instance=new this(data);
        return instance.save();
      }
    };

    for(const field of definition.fields){
      if(field.propertyName in DynamicClass.prototype){
        throw new NuBloxObjectRuntimeError(
          `Metadata field ${field.code} collides with runtime property ${field.propertyName}.`,
          'INVALID_FIELD'
        );
      }
      Object.defineProperty(DynamicClass.prototype,field.propertyName,{
        get(this:NuBloxObject){return this.getField(field.code);},
        set(this:NuBloxObject,value:unknown){this.setField(field.code,value);},
        enumerable:true,
        configurable:false
      });
    }

    for(const transition of definition.transitions){
      if(transition.methodName in DynamicClass.prototype) continue;
      Object.defineProperty(DynamicClass.prototype,transition.methodName,{
        value:function(this:NuBloxObject,options?:NuBloxTransitionOptions){
          return this.transition(transition.code,options);
        },
        enumerable:false,
        configurable:false,
        writable:false
      });
    }

    Object.defineProperty(DynamicClass,'name',{
      value:definition.name.replace(/[^A-Za-z0-9_$]+/g,'')||definition.code,
      configurable:false
    });
    this.cache.set(typeCode,DynamicClass);
    return DynamicClass;
  }

  async load(type:string,id:string):Promise<NuBloxObject>{
    const ObjectType=await this.define(type);
    return ObjectType.load(id);
  }

  async create(type:string,data:NuBloxObjectInput):Promise<NuBloxObject>{
    const ObjectType=await this.define(type);
    return ObjectType.create(data);
  }

  async getThing(id:string):Promise<ThingView|null>{
    return this.reads.getThing(this.tenantId,this.actorPersonId,id);
  }

  async createThing(
    definition:NuBloxObjectDefinition,
    input:{
      stableKey:string;
      displayName?:string;
      fieldValues:Array<{typeAttributeAssignmentId:string;sequence:number;value:unknown}>;
    }
  ){
    return this.commands.createThing(this.tenantId,this.actorPersonId,{
      typeDefinitionId:definition.typeDefinitionId,
      stableKey:input.stableKey,
      ...(input.displayName?{displayName:input.displayName}:{}),
      fieldValues:input.fieldValues
    });
  }

  async replaceFieldValues(
    thingId:string,
    field:NuBloxObjectFieldDefinition,
    values:Array<{sequence:number;value:unknown}>
  ):Promise<void>{
    await this.commands.replaceThingFieldValues(this.tenantId,this.actorPersonId,{
      thingId,
      typeAttributeAssignmentId:field.assignmentId,
      values
    });
  }

  async transition(
    thingId:string,
    transition:NuBloxObjectTransitionDefinition,
    expectedSequence:number,
    options:NuBloxTransitionOptions
  ):Promise<void>{
    const evaluation=await this.access.evaluatePermission(
      this.tenantId,this.actorPersonId,PLATFORM_PERMISSION_KEYS.METADATA_MANAGE,{scopeType:'TENANT'}
    );
    if(!evaluation.allowed){
      throw new NuBloxObjectRuntimeError(evaluation.reason,'PERMISSION_DENIED');
    }
    await this.control.transitionObjectLifecycle(
      this.tenantId,
      thingId as Parameters<MySqlKernelControlRepository['transitionObjectLifecycle']>[1],
      transition.id as Parameters<MySqlKernelControlRepository['transitionObjectLifecycle']>[2],
      {
        effectiveAt:options.effectiveAt??new Date().toISOString(),
        expectedSequence,
        ...(options.subjectVersion?{subjectVersion:options.subjectVersion}:{}),
        ...(options.decisionId?{
          decisionId:options.decisionId as NonNullable<Parameters<MySqlKernelControlRepository['transitionObjectLifecycle']>[3]['decisionId']>
        }:{})
      },
      {actorPersonId:this.actorPersonId,correlationId:'NUBLOX-OBJECT-RUNTIME'}
    );
  }

  async loadDefinition(typeCode:string):Promise<NuBloxObjectDefinition>{
    const projection=await this.metadata.getProjection(this.tenantId,this.actorPersonId);
    const now=new Date().toISOString();
    const type=projection.types.find(item=>
      item.code.toUpperCase()===typeCode&&item.status==='ACTIVE'&&isMetadataEffective(item,now)
    );
    if(!type) throw new NuBloxObjectRuntimeError(`Type ${typeCode} was not found or is not effective.`,'TYPE_NOT_FOUND');

    const attributes=new Map<string,MetadataAttributeView>(
      projection.attributes.map(item=>[item.id as string,item])
    );
    const effective=projection.effectiveTypeAttributes.filter(item=>
      item.requestedTypeDefinitionId===(type.id as string)&&item.status==='ACTIVE'
    );
    const fields=effective.map(item=>this.mapField(item,attributes));
    const propertyNames=new Set<string>();
    for(const field of fields){
      if(propertyNames.has(field.propertyName)){
        throw new NuBloxObjectRuntimeError(
          `Type ${type.code} has multiple fields that resolve to property ${field.propertyName}.`,
          'INVALID_FIELD'
        );
      }
      propertyNames.add(field.propertyName);
    }

    let transitions:NuBloxObjectTransitionDefinition[]=[];
    if(type.lifecycleDefinitionId){
      const [rows]=await this.pool.execute<TransitionRow[]>(
        `SELECT id,code,name,lifecycle_definition_id,from_state_id,to_state_id,
                requires_decision,required_decision_type,required_decision_outcome
           FROM lifecycle_transition_definitions
          WHERE tenant_id=? AND lifecycle_definition_id=? AND status='ACTIVE'
          ORDER BY code`,
        [this.tenantId,type.lifecycleDefinitionId]
      );
      transitions=rows.map(row=>({
        id:row.id,
        code:row.code,
        methodName:transitionMethodName(row.code),
        name:row.name,
        lifecycleDefinitionId:row.lifecycle_definition_id,
        fromStateId:row.from_state_id,
        toStateId:row.to_state_id,
        requiresDecision:Boolean(row.requires_decision),
        ...(row.required_decision_type?{requiredDecisionType:row.required_decision_type}:{}),
        ...(row.required_decision_outcome?{requiredDecisionOutcome:row.required_decision_outcome}:{})
      }));
    }

    return Object.freeze({
      typeDefinitionId:type.id as string,
      code:type.code,
      name:type.name,
      objectFamily:type.objectFamily,
      version:type.version,
      ...(type.lifecycleDefinitionId?{lifecycleDefinitionId:type.lifecycleDefinitionId}:{}),
      ...(type.creationPolicyReference?{creationPolicyReference:type.creationPolicyReference}:{}),
      nativeAuthority:type.creationPolicyReference==='NATIVE_AUTHORITY',
      fields:Object.freeze(fields),
      transitions:Object.freeze(transitions)
    });
  }

  private mapField(
    assignment:MetadataEffectiveAttributeView,
    attributes:ReadonlyMap<string,MetadataAttributeView>
  ):NuBloxObjectFieldDefinition{
    const attribute=attributes.get(assignment.attributeDefinitionId);
    if(!attribute){
      throw new NuBloxObjectRuntimeError(
        `Attribute ${assignment.attributeDefinitionId} was not found for ${assignment.attributeCode}.`,
        'INVALID_FIELD'
      );
    }
    return Object.freeze({
      assignmentId:assignment.id,
      attributeDefinitionId:assignment.attributeDefinitionId,
      code:assignment.attributeCode,
      propertyName:propertyName(assignment.attributeCode),
      name:assignment.localLabel??assignment.attributeName,
      dataType:attribute.dataType,
      cardinality:assignment.cardinality,
      required:assignment.required,
      ...(assignment.defaultValue!==undefined?{defaultValue:cloneDefault(assignment.defaultValue)}:{}),
      ...(attribute.enumerationDefinitionId?{enumerationDefinitionId:attribute.enumerationDefinitionId as string}:{}),
      ...(attribute.referenceObjectFamily?{referenceObjectFamily:attribute.referenceObjectFamily}:{})
    });
  }
}
