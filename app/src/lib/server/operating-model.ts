import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { dbTransaction, executeMutation, queryOne, queryRows, type DbExecutor } from '$lib/server/db';
import { assertPermission, type CommandContext } from '$lib/server/platform-context';
import { emitBusinessEvent, recordPlatformAudit } from '$lib/server/platform-evidence';
import { assertWorkDecisionReference } from '$lib/server/work-decision';

export type OperatingModel = {
  id: string;
  modelRef: string;
  name: string;
  frameworkId: string;
  frameworkVersionNo: number;
  scopeType: string;
  scopeId: string;
  ownerPartyId: string;
  status: string;
  aggregateVersion: number;
  currentVersionNo: number;
  currentStateSummary: string;
  targetStateSummary: string;
  designPrinciples: string;
  centralisationModel: string;
  sharedServiceRequirements: string;
  organisationModelReference: string | null;
  changeInitiativesSummary: string;
  approvalDecisionId: string | null;
  updatedAt: string;
};

export type OperatingModelVersion = {
  id: string;
  operatingModelId: string;
  versionNo: number;
  lifecycleStatus: string;
  currentStateSummary: string;
  targetStateSummary: string;
  designPrinciples: string;
  centralisationModel: string;
  sharedServiceRequirements: string;
  organisationModelReference: string | null;
  changeInitiativesSummary: string;
  approvalDecisionId: string | null;
  createdAt: string;
};

export type OperatingModelCapabilityInput = {
  capabilityKey: string;
  name: string;
  description: string;
  criticality: 'CRITICAL' | 'IMPORTANT' | 'ENABLING';
  deliveryModel: 'CENTRALISED' | 'DECENTRALISED' | 'SHARED_SERVICE' | 'HYBRID' | 'OUTSOURCED';
};

export type OperatingModelAccountabilityInput = {
  accountabilityKey: string;
  responsibility: string;
  accountableRoleKey?: string;
  accountablePartyId?: string;
  decisionRights: string;
};

export type OperatingModelInput = {
  modelRef: string;
  name: string;
  frameworkId: string;
  frameworkVersionNo: number;
  scopeType: string;
  scopeId: string;
  ownerPartyId?: string;
  currentStateSummary: string;
  targetStateSummary: string;
  designPrinciples: string;
  centralisationModel: string;
  sharedServiceRequirements: string;
  organisationModelReference?: string;
  changeInitiativesSummary: string;
  capabilities: OperatingModelCapabilityInput[];
  accountabilities: OperatingModelAccountabilityInput[];
};

const currentSelect = `
SELECT m.id,
       m.model_ref AS modelRef,
       m.name,
       m.framework_id AS frameworkId,
       m.framework_version_no AS frameworkVersionNo,
       m.scope_type AS scopeType,
       m.scope_id AS scopeId,
       m.owner_party_id AS ownerPartyId,
       m.status,
       m.aggregate_version AS aggregateVersion,
       m.current_version_no AS currentVersionNo,
       v.current_state_summary AS currentStateSummary,
       v.target_state_summary AS targetStateSummary,
       v.design_principles AS designPrinciples,
       v.centralisation_model AS centralisationModel,
       v.shared_service_requirements AS sharedServiceRequirements,
       v.organisation_model_reference AS organisationModelReference,
       v.change_initiatives_summary AS changeInitiativesSummary,
       v.approval_decision_id AS approvalDecisionId,
       m.updated_at AS updatedAt
  FROM strategy_operating_models m
  JOIN strategy_operating_model_versions v
    ON v.operating_model_id = m.id
   AND v.version_no = m.current_version_no
   AND v.tenant_id = m.tenant_id`;

function now() {
  return new Date().toISOString();
}

function required(value: string, label: string) {
  const clean = value.trim();
  if (!clean) throw new Error(label + ' is required.');
  return clean;
}

function code(value: string, label: string, max = 191) {
  const clean = required(value, label).toUpperCase();
  if (clean.length > max || !/^[A-Z0-9][A-Z0-9._:-]*$/.test(clean)) {
    throw new Error(label + ' contains unsupported characters.');
  }
  return clean;
}

async function assertParty(context: CommandContext, partyId: string, executor: DbExecutor) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM parties WHERE id = ? AND tenant_id = ? AND status = 'ACTIVE'",
    [partyId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Active Operating Model owner/accountable Party not found.');
}

async function assertPublishedFrameworkVersion(
  context: CommandContext,
  frameworkId: string,
  frameworkVersionNo: number,
  executor: DbExecutor
) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT v.id FROM strategy_framework_versions v JOIN strategy_frameworks f ON f.id = v.framework_id WHERE v.framework_id = ? AND v.version_no = ? AND v.status = 'PUBLISHED' AND f.tenant_id = ?",
    [frameworkId, frameworkVersionNo, context.tenantId],
    executor
  );
  if (!row) throw new Error('Operating Model must reference an exact published Strategy Framework version.');
}

async function getOperatingModel(context: CommandContext, id: string, executor?: DbExecutor, forUpdate = false) {
  const row = await queryOne<RowDataPacket & OperatingModel>(
    currentSelect + ' WHERE m.id = ? AND m.tenant_id = ?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Operating Model not found.');
  return row;
}

async function evidence(
  context: CommandContext,
  model: OperatingModel,
  eventType: string,
  fromState: string | null,
  toState: string,
  payload: Record<string, unknown>,
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    { aggregateId: 'AGG-02-STRATEGY', objectType: 'strategy_operating_model', objectId: model.id, action: eventType, fromState: fromState ?? undefined, toState },
    executor
  );
  await emitBusinessEvent(
    context,
    { aggregateId: 'AGG-02-STRATEGY', aggregateType: 'OperatingModel', aggregateObjectId: model.id, aggregateVersion: model.aggregateVersion, eventType, topic: 'nublox.strategy.operating-model', payload },
    executor
  );
}

async function insertVersion(
  context: CommandContext,
  modelId: string,
  versionNo: number,
  input: Pick<OperatingModelInput,'currentStateSummary'|'targetStateSummary'|'designPrinciples'|'centralisationModel'|'sharedServiceRequirements'|'organisationModelReference'|'changeInitiativesSummary'|'capabilities'|'accountabilities'>,
  executor: DbExecutor
) {
  if (!input.capabilities.length) throw new Error('Operating Model requires at least one target capability.');
  if (!input.accountabilities.length) throw new Error('Operating Model requires at least one accountability.');

  const versionId = randomUUID();
  await executeMutation(
    "INSERT INTO strategy_operating_model_versions (id, tenant_id, operating_model_id, version_no, lifecycle_status, current_state_summary, target_state_summary, design_principles, centralisation_model, shared_service_requirements, organisation_model_reference, change_initiatives_summary, approval_decision_id, created_by_party_id, created_at) VALUES (?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)",
    [versionId, context.tenantId, modelId, versionNo, required(input.currentStateSummary,'Current-state summary'), required(input.targetStateSummary,'Target-state summary'), required(input.designPrinciples,'Operating-model design principles'), required(input.centralisationModel,'Centralisation/decentralisation model'), required(input.sharedServiceRequirements,'Shared-service requirements'), input.organisationModelReference?.trim() || null, required(input.changeInitiativesSummary,'Change initiatives summary'), context.actorPartyId, now()],
    executor
  );

  const capabilityKeys = new Set<string>();
  for (const capability of input.capabilities) {
    const capabilityKey = code(capability.capabilityKey, 'Capability key');
    if (capabilityKeys.has(capabilityKey)) throw new Error('Operating Model capability keys must be unique.');
    capabilityKeys.add(capabilityKey);
    if (!['CRITICAL','IMPORTANT','ENABLING'].includes(capability.criticality)) throw new Error('Unsupported capability criticality.');
    if (!['CENTRALISED','DECENTRALISED','SHARED_SERVICE','HYBRID','OUTSOURCED'].includes(capability.deliveryModel)) throw new Error('Unsupported capability delivery model.');
    await executeMutation(
      'INSERT INTO strategy_operating_model_capabilities (id, operating_model_version_id, capability_key, name, description, criticality, delivery_model) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [randomUUID(), versionId, capabilityKey, required(capability.name,'Capability name'), required(capability.description,'Capability description'), capability.criticality, capability.deliveryModel],
      executor
    );
  }

  const accountabilityKeys = new Set<string>();
  for (const accountability of input.accountabilities) {
    const accountabilityKey = code(accountability.accountabilityKey, 'Accountability key');
    if (accountabilityKeys.has(accountabilityKey)) throw new Error('Operating Model accountability keys must be unique.');
    accountabilityKeys.add(accountabilityKey);
    const roleKey = accountability.accountableRoleKey?.trim()
      ? code(accountability.accountableRoleKey, 'Accountable role key')
      : null;
    const partyId = accountability.accountablePartyId?.trim() || null;
    if (!roleKey && !partyId) throw new Error('Accountability requires a target role key or accountable Party.');
    if (partyId) await assertParty(context, partyId, executor);
    await executeMutation(
      'INSERT INTO strategy_operating_model_accountabilities (id, operating_model_version_id, accountability_key, responsibility, accountable_role_key, accountable_party_id, decision_rights) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [randomUUID(), versionId, accountabilityKey, required(accountability.responsibility,'Accountability responsibility'), roleKey, partyId, required(accountability.decisionRights,'Accountability decision rights')],
      executor
    );
  }
  return versionId;
}

export async function listOperatingModels(context: CommandContext) {
  assertPermission(context, 'strategy.operating-model.read');
  return queryRows<RowDataPacket & OperatingModel>(
    currentSelect + ' WHERE m.tenant_id = ? ORDER BY m.updated_at DESC, m.model_ref',
    [context.tenantId]
  );
}

export async function listOperatingModelVersions(context: CommandContext, modelId: string) {
  assertPermission(context, 'strategy.operating-model.read');
  await getOperatingModel(context, modelId);
  return queryRows<RowDataPacket & OperatingModelVersion>(
    'SELECT id, operating_model_id AS operatingModelId, version_no AS versionNo, lifecycle_status AS lifecycleStatus, current_state_summary AS currentStateSummary, target_state_summary AS targetStateSummary, design_principles AS designPrinciples, centralisation_model AS centralisationModel, shared_service_requirements AS sharedServiceRequirements, organisation_model_reference AS organisationModelReference, change_initiatives_summary AS changeInitiativesSummary, approval_decision_id AS approvalDecisionId, created_at AS createdAt FROM strategy_operating_model_versions WHERE tenant_id = ? AND operating_model_id = ? ORDER BY version_no DESC',
    [context.tenantId, modelId]
  );
}

export async function listOperatingModelCapabilities(context: CommandContext, versionId: string) {
  assertPermission(context, 'strategy.operating-model.read');
  return queryRows<RowDataPacket & OperatingModelCapabilityInput>(
    'SELECT capability_key AS capabilityKey, name, description, criticality, delivery_model AS deliveryModel FROM strategy_operating_model_capabilities c JOIN strategy_operating_model_versions v ON v.id = c.operating_model_version_id WHERE c.operating_model_version_id = ? AND v.tenant_id = ? ORDER BY FIELD(criticality, "CRITICAL","IMPORTANT","ENABLING"), capability_key',
    [versionId, context.tenantId]
  );
}

export async function listOperatingModelAccountabilities(context: CommandContext, versionId: string) {
  assertPermission(context, 'strategy.operating-model.read');
  return queryRows<RowDataPacket & OperatingModelAccountabilityInput>(
    'SELECT accountability_key AS accountabilityKey, responsibility, accountable_role_key AS accountableRoleKey, accountable_party_id AS accountablePartyId, decision_rights AS decisionRights FROM strategy_operating_model_accountabilities a JOIN strategy_operating_model_versions v ON v.id = a.operating_model_version_id WHERE a.operating_model_version_id = ? AND v.tenant_id = ? ORDER BY accountability_key',
    [versionId, context.tenantId]
  );
}

export async function createOperatingModel(context: CommandContext, input: OperatingModelInput) {
  assertPermission(context, 'strategy.operating-model.manage');
  const modelRef = code(input.modelRef,'Operating Model reference');
  const ownerPartyId = input.ownerPartyId?.trim() || context.actorPartyId;
  const scopeType = code(input.scopeType,'Operating Model scope type',64);
  const scopeId = required(input.scopeId,'Operating Model scope ID');

  return dbTransaction(async (connection) => {
    await assertPublishedFrameworkVersion(context,input.frameworkId,input.frameworkVersionNo,connection);
    await assertParty(context,ownerPartyId,connection);
    const id=randomUUID();
    const timestamp=now();
    await executeMutation(
      "INSERT INTO strategy_operating_models (id, tenant_id, model_ref, name, framework_id, framework_version_no, scope_type, scope_id, owner_party_id, status, aggregate_version, current_version_no, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', 1, 1, ?, ?)",
      [id,context.tenantId,modelRef,required(input.name,'Operating Model name'),input.frameworkId,input.frameworkVersionNo,scopeType,scopeId,ownerPartyId,timestamp,timestamp],
      connection
    );
    const versionId=await insertVersion(context,id,1,input,connection);
    const created=await getOperatingModel(context,id,connection);
    await evidence(context,created,'OPERATING_MODEL_CREATED',null,'DRAFT',{modelRef,versionId,frameworkId:input.frameworkId,frameworkVersionNo:input.frameworkVersionNo},connection);
    return id;
  });
}

export async function reviseOperatingModel(
  context: CommandContext,
  id: string,
  expectedAggregateVersion: number,
  input: Pick<OperatingModelInput,'currentStateSummary'|'targetStateSummary'|'designPrinciples'|'centralisationModel'|'sharedServiceRequirements'|'organisationModelReference'|'changeInitiativesSummary'|'capabilities'|'accountabilities'>
) {
  assertPermission(context,'strategy.operating-model.manage');
  return dbTransaction(async (connection)=>{
    const current=await getOperatingModel(context,id,connection,true);
    if(current.aggregateVersion!==expectedAggregateVersion) throw new Error('This Operating Model changed after you opened it.');
    if(!['DRAFT','ACTIVE'].includes(current.status)) throw new Error('Only draft or active Operating Models can be revised.');
    const nextVersionNo=current.currentVersionNo+1;
    const versionId=await insertVersion(context,current.id,nextVersionNo,input,connection);
    const result=await executeMutation(
      "UPDATE strategy_operating_models SET status='DRAFT', aggregate_version=aggregate_version+1, current_version_no=?, updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [nextVersionNo,now(),current.id,context.tenantId,expectedAggregateVersion],
      connection
    );
    if(result.affectedRows!==1) throw new Error('Concurrent Operating Model revision detected.');
    const updated=await getOperatingModel(context,current.id,connection);
    await evidence(context,updated,'OPERATING_MODEL_REVISED',current.status,'DRAFT',{versionId,versionNo:nextVersionNo},connection);
  });
}

export async function submitOperatingModel(context: CommandContext,id:string,expectedAggregateVersion:number){
  assertPermission(context,'strategy.operating-model.manage');
  return dbTransaction(async(connection)=>{
    const current=await getOperatingModel(context,id,connection,true);
    if(current.aggregateVersion!==expectedAggregateVersion) throw new Error('This Operating Model changed after you opened it.');
    if(current.status!=='DRAFT') throw new Error('Only a draft Operating Model can be submitted.');
    const result=await executeMutation(
      "UPDATE strategy_operating_models SET status='IN_REVIEW', aggregate_version=aggregate_version+1, updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [now(),current.id,context.tenantId,expectedAggregateVersion],
      connection
    );
    if(result.affectedRows!==1) throw new Error('Concurrent Operating Model submission detected.');
    await executeMutation("UPDATE strategy_operating_model_versions SET lifecycle_status='REVIEW' WHERE operating_model_id=? AND version_no=?",[current.id,current.currentVersionNo],connection);
    const updated=await getOperatingModel(context,current.id,connection);
    await evidence(context,updated,'OPERATING_MODEL_SUBMITTED','DRAFT','IN_REVIEW',{versionNo:current.currentVersionNo},connection);
  });
}

export async function approveOperatingModel(context:CommandContext,id:string,expectedAggregateVersion:number,decisionId:string){
  assertPermission(context,'strategy.operating-model.approve');
  return dbTransaction(async(connection)=>{
    const current=await getOperatingModel(context,id,connection,true);
    if(current.aggregateVersion!==expectedAggregateVersion) throw new Error('This Operating Model changed after you opened it.');
    if(current.status!=='IN_REVIEW') throw new Error('Only an in-review Operating Model can be approved.');
    const decision=await assertWorkDecisionReference(context,{
      decisionId,
      decisionType:'OPERATING_MODEL_APPROVAL',
      subjectType:'OPERATING_MODEL',
      subjectId:current.id,
      subjectVersion:String(current.currentVersionNo),
      outcome:'APPROVED'
    },connection);
    const result=await executeMutation(
      "UPDATE strategy_operating_models SET status='APPROVED', aggregate_version=aggregate_version+1, updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [now(),current.id,context.tenantId,expectedAggregateVersion],
      connection
    );
    if(result.affectedRows!==1) throw new Error('Concurrent Operating Model approval detected.');
    await executeMutation("UPDATE strategy_operating_model_versions SET lifecycle_status='APPROVED', approval_decision_id=? WHERE operating_model_id=? AND version_no=?",[decision.id,current.id,current.currentVersionNo],connection);
    const updated=await getOperatingModel(context,current.id,connection);
    await evidence(context,updated,'OPERATING_MODEL_APPROVED','IN_REVIEW','APPROVED',{versionNo:current.currentVersionNo,decisionId:decision.id},connection);
  });
}

export async function activateOperatingModel(context:CommandContext,id:string,expectedAggregateVersion:number){
  assertPermission(context,'strategy.operating-model.approve');
  return dbTransaction(async(connection)=>{
    const current=await getOperatingModel(context,id,connection,true);
    if(current.aggregateVersion!==expectedAggregateVersion) throw new Error('This Operating Model changed after you opened it.');
    if(current.status!=='APPROVED') throw new Error('Only an approved Operating Model can become active.');
    await executeMutation("UPDATE strategy_operating_model_versions SET lifecycle_status='SUPERSEDED' WHERE operating_model_id=? AND lifecycle_status='ACTIVE' AND version_no<>?",[current.id,current.currentVersionNo],connection);
    await executeMutation("UPDATE strategy_operating_model_versions SET lifecycle_status='ACTIVE' WHERE operating_model_id=? AND version_no=?",[current.id,current.currentVersionNo],connection);
    const result=await executeMutation(
      "UPDATE strategy_operating_models SET status='ACTIVE', aggregate_version=aggregate_version+1, updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [now(),current.id,context.tenantId,expectedAggregateVersion],
      connection
    );
    if(result.affectedRows!==1) throw new Error('Concurrent Operating Model activation detected.');
    const updated=await getOperatingModel(context,current.id,connection);
    await evidence(context,updated,'OPERATING_MODEL_ACTIVATED','APPROVED','ACTIVE',{versionNo:current.currentVersionNo},connection);
  });
}

export async function supersedeOperatingModel(context:CommandContext,id:string,expectedAggregateVersion:number){
  assertPermission(context,'strategy.operating-model.approve');
  return dbTransaction(async(connection)=>{
    const current=await getOperatingModel(context,id,connection,true);
    if(current.aggregateVersion!==expectedAggregateVersion) throw new Error('This Operating Model changed after you opened it.');
    if(current.status!=='ACTIVE') throw new Error('Only an active Operating Model can be superseded.');
    const result=await executeMutation(
      "UPDATE strategy_operating_models SET status='SUPERSEDED', aggregate_version=aggregate_version+1, updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [now(),current.id,context.tenantId,expectedAggregateVersion],
      connection
    );
    if(result.affectedRows!==1) throw new Error('Concurrent Operating Model supersession detected.');
    await executeMutation("UPDATE strategy_operating_model_versions SET lifecycle_status='SUPERSEDED' WHERE operating_model_id=? AND version_no=?",[current.id,current.currentVersionNo],connection);
    const updated=await getOperatingModel(context,current.id,connection);
    await evidence(context,updated,'OPERATING_MODEL_SUPERSEDED','ACTIVE','SUPERSEDED',{versionNo:current.currentVersionNo},connection);
  });
}
