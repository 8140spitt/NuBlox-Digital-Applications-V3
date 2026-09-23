import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type AuthorityAdoption,
  type ExchangeDeltaItem,
  type ExchangeDeltaType,
  type ExchangeDelivery,
  type ExchangeMapping,
  type ExchangeMappingType,
  type ExchangePackage,
  type ExchangePackageItem,
  type ExchangeRecipient,
  type ReceivedDelivery,
  type TenantId
} from '@nublox/kernel';
import type { Pool } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlExchangeRepository } from './exchange-repository.js';

export class ExchangeCommandError extends Error {
  constructor(
    message: string,
    readonly code: 'PERMISSION_DENIED' | 'INVALID_INPUT' | 'NOT_FOUND' | 'CONFLICT'
  ) {
    super(message);
    this.name = 'ExchangeCommandError';
  }
}

const DELTA_TYPES = new Set<ExchangeDeltaType>(['NEW','CHANGED','MOVED','DELETED','ABSENT']);
const MAPPING_TYPES = new Set<ExchangeMappingType>([
  'CONTEXT','ORGANISATION','VIEW','LIFECYCLE','FOLDER','SECURITY_LABEL',
  'CLASSIFICATION','TYPE','VERSION','CUSTOM'
]);

function required(value: string | undefined, label: string): string {
  const result = value?.trim() ?? '';
  if (!result) throw new ExchangeCommandError(`${label} is required.`, 'INVALID_INPUT');
  return result;
}
function optional(value: string | undefined): string | undefined {
  const result = value?.trim() ?? '';
  return result || undefined;
}
function integer(value: number | undefined, label: string, minimum: number): number {
  if (!Number.isInteger(value) || (value ?? -1) < minimum) {
    throw new ExchangeCommandError(`${label} must be an integer >= ${minimum}.`, 'INVALID_INPUT');
  }
  return value as number;
}
function iso(value: string | undefined, label: string): string {
  const raw = value ?? new Date().toISOString();
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new ExchangeCommandError(`${label} is invalid.`, 'INVALID_INPUT');
  }
  return parsed.toISOString();
}
function mapError(error: unknown): never {
  if (error instanceof ExchangeCommandError) throw error;
  if (typeof error === 'object' && error !== null && 'code' in error) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw new ExchangeCommandError('An equivalent exchange record already exists.', 'CONFLICT');
    }
  }
  if (error instanceof Error) {
    if (/not found/i.test(error.message)) {
      throw new ExchangeCommandError(error.message, 'NOT_FOUND');
    }
    if (/must|required|invalid|only|cannot|same tenant|requires|belong/i.test(error.message)) {
      throw new ExchangeCommandError(error.message, 'INVALID_INPUT');
    }
  }
  throw error;
}

export class MySqlExchangeCommandService {
  private readonly access: MySqlAccessRepository;
  private readonly repository: MySqlExchangeRepository;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
    this.repository = new MySqlExchangeRepository(pool);
  }

  async createPackage(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      code: string;
      name: string;
      purpose: string;
      sourceContextObjectId?: string;
      sourceSystem: string;
      packageVersion?: number;
      createdAt?: string;
    }
  ): Promise<ExchangePackage> {
    await this.requireManage(tenantId, actorPersonId);
    const sourceContextObjectId = optional(input.sourceContextObjectId);
    const item: ExchangePackage = {
      id: asId<'ExchangePackageId'>(`EXPKG-${randomUUID()}`, 'Exchange Package'),
      tenantId,
      code: required(input.code, 'Exchange Package code').toUpperCase(),
      name: required(input.name, 'Exchange Package name'),
      purpose: required(input.purpose, 'Exchange Package purpose'),
      ...(sourceContextObjectId
        ? { sourceContextObjectId: asId<'CanonicalObjectId'>(sourceContextObjectId, 'Source Context') }
        : {}),
      sourceSystem: required(input.sourceSystem, 'Source system'),
      packageVersion: integer(input.packageVersion ?? 1, 'Package version', 1),
      status: 'DRAFT',
      createdByPersonId: asId<'PersonId'>(actorPersonId, 'Creator'),
      createdAt: iso(input.createdAt, 'Package createdAt')
    };
    try {
      await this.repository.createPackage(item, this.audit(actorPersonId));
      return item;
    } catch (error) { return mapError(error); }
  }

  async addPackageItem(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      packageId: string;
      subjectObjectId: string;
      subjectVersion?: string;
      representationId?: string;
      externalIdentityId?: string;
      itemRole: string;
      itemChecksum?: string;
    }
  ): Promise<ExchangePackageItem> {
    await this.requireManage(tenantId, actorPersonId);
    const subjectVersion = optional(input.subjectVersion);
    const representationId = optional(input.representationId);
    const externalIdentityId = optional(input.externalIdentityId);
    const itemChecksum = optional(input.itemChecksum);
    const item: ExchangePackageItem = {
      id: asId<'ExchangePackageItemId'>(`EXPKGI-${randomUUID()}`, 'Exchange Package Item'),
      tenantId,
      exchangePackageId: asId<'ExchangePackageId'>(required(input.packageId, 'Exchange Package'), 'Exchange Package'),
      subjectObjectId: asId<'CanonicalObjectId'>(required(input.subjectObjectId, 'Subject Object'), 'Subject Object'),
      ...(subjectVersion ? { subjectVersion } : {}),
      ...(representationId
        ? { representationId: asId<'RepresentationId'>(representationId, 'Representation') }
        : {}),
      ...(externalIdentityId
        ? { externalIdentityId: asId<'ExternalIdentityId'>(externalIdentityId, 'External Identity') }
        : {}),
      itemRole: required(input.itemRole, 'Package Item role').toUpperCase(),
      ...(itemChecksum ? { itemChecksum } : {})
    };
    try {
      await this.repository.addPackageItem(item, this.audit(actorPersonId));
      return item;
    } catch (error) { return mapError(error); }
  }

  async freezePackage(
    tenantId: TenantId,
    actorPersonId: string,
    input: { packageId: string; packageChecksum: string; frozenAt?: string }
  ): Promise<ExchangePackage> {
    await this.requireManage(tenantId, actorPersonId);
    try {
      return await this.repository.freezePackage(
        tenantId,
        asId<'ExchangePackageId'>(required(input.packageId, 'Exchange Package'), 'Exchange Package'),
        iso(input.frozenAt, 'Package frozenAt'),
        required(input.packageChecksum, 'Package checksum'),
        this.audit(actorPersonId)
      );
    } catch (error) { return mapError(error); }
  }

  async dispatchDelivery(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      packageId: string;
      transmittalId?: string;
      deliveryReference: string;
      deliverySequence?: number;
      priorDeliveryId?: string;
      transportReference?: string;
      deliveryChecksum?: string;
      dispatchedAt?: string;
    }
  ): Promise<ExchangeDelivery> {
    await this.requireManage(tenantId, actorPersonId);
    const transmittalId = optional(input.transmittalId);
    const priorDeliveryId = optional(input.priorDeliveryId);
    const transportReference = optional(input.transportReference);
    const deliveryChecksum = optional(input.deliveryChecksum);
    const delivery: ExchangeDelivery = {
      id: asId<'ExchangeDeliveryId'>(`EXDEL-${randomUUID()}`, 'Exchange Delivery'),
      tenantId,
      exchangePackageId: asId<'ExchangePackageId'>(required(input.packageId, 'Exchange Package'), 'Exchange Package'),
      ...(transmittalId ? { transmittalId: asId<'TransmittalId'>(transmittalId, 'Transmittal') } : {}),
      deliveryReference: required(input.deliveryReference, 'Delivery reference'),
      deliverySequence: integer(input.deliverySequence ?? 1, 'Delivery sequence', 1),
      ...(priorDeliveryId ? { priorDeliveryId: asId<'ExchangeDeliveryId'>(priorDeliveryId, 'Prior Delivery') } : {}),
      dispatchedByPersonId: asId<'PersonId'>(actorPersonId, 'Dispatcher'),
      dispatchedAt: iso(input.dispatchedAt, 'Delivery dispatchedAt'),
      ...(transportReference ? { transportReference } : {}),
      ...(deliveryChecksum ? { deliveryChecksum } : {}),
      status: 'DISPATCHED'
    };
    try {
      await this.repository.createDelivery(delivery, this.audit(actorPersonId));
      return delivery;
    } catch (error) { return mapError(error); }
  }

  async addRecipient(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      deliveryId: string;
      recipientPartyId: string;
      transmittalRecipientId?: string;
      targetSystem?: string;
      targetContextObjectId?: string;
      targetReference?: string;
    }
  ): Promise<ExchangeRecipient> {
    await this.requireManage(tenantId, actorPersonId);
    const transmittalRecipientId = optional(input.transmittalRecipientId);
    const targetSystem = optional(input.targetSystem);
    const targetContextObjectId = optional(input.targetContextObjectId);
    const targetReference = optional(input.targetReference);
    const recipient: ExchangeRecipient = {
      id: asId<'ExchangeRecipientId'>(`EXREC-${randomUUID()}`, 'Exchange Recipient'),
      tenantId,
      exchangeDeliveryId: asId<'ExchangeDeliveryId'>(required(input.deliveryId, 'Exchange Delivery'), 'Exchange Delivery'),
      recipientPartyId: asId<'PartyId'>(required(input.recipientPartyId, 'Recipient Party'), 'Recipient Party'),
      ...(transmittalRecipientId
        ? { transmittalRecipientId: asId<'TransmittalRecipientId'>(transmittalRecipientId, 'Transmittal Recipient') }
        : {}),
      ...(targetSystem ? { targetSystem } : {}),
      ...(targetContextObjectId
        ? { targetContextObjectId: asId<'CanonicalObjectId'>(targetContextObjectId, 'Target Context') }
        : {}),
      ...(targetReference ? { targetReference } : {}),
      status: 'ACTIVE'
    };
    try {
      await this.repository.addRecipient(recipient, this.audit(actorPersonId));
      return recipient;
    } catch (error) { return mapError(error); }
  }

  async addDeltaItem(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      deliveryId: string;
      subjectObjectId: string;
      packageItemId?: string;
      deltaType: ExchangeDeltaType;
      priorDeliveryId?: string;
      priorSubjectVersion?: string;
      priorLocationReference?: string;
      currentLocationReference?: string;
      details?: string;
    }
  ): Promise<ExchangeDeltaItem> {
    await this.requireManage(tenantId, actorPersonId);
    if (!DELTA_TYPES.has(input.deltaType)) {
      throw new ExchangeCommandError('Exchange Delta type is not supported.', 'INVALID_INPUT');
    }
    const packageItemId = optional(input.packageItemId);
    const priorDeliveryId = optional(input.priorDeliveryId);
    const priorSubjectVersion = optional(input.priorSubjectVersion);
    const priorLocationReference = optional(input.priorLocationReference);
    const currentLocationReference = optional(input.currentLocationReference);
    const details = optional(input.details);
    const item: ExchangeDeltaItem = {
      id: asId<'ExchangeDeltaItemId'>(`EXDELTA-${randomUUID()}`, 'Exchange Delta Item'),
      tenantId,
      exchangeDeliveryId: asId<'ExchangeDeliveryId'>(required(input.deliveryId, 'Exchange Delivery'), 'Exchange Delivery'),
      subjectObjectId: asId<'CanonicalObjectId'>(required(input.subjectObjectId, 'Delta Subject'), 'Delta Subject'),
      ...(packageItemId
        ? { exchangePackageItemId: asId<'ExchangePackageItemId'>(packageItemId, 'Exchange Package Item') }
        : {}),
      deltaType: input.deltaType,
      ...(priorDeliveryId ? { priorDeliveryId: asId<'ExchangeDeliveryId'>(priorDeliveryId, 'Prior Delivery') } : {}),
      ...(priorSubjectVersion ? { priorSubjectVersion } : {}),
      ...(priorLocationReference ? { priorLocationReference } : {}),
      ...(currentLocationReference ? { currentLocationReference } : {}),
      ...(details ? { details } : {})
    };
    try {
      await this.repository.addDeltaItem(item, this.audit(actorPersonId));
      return item;
    } catch (error) { return mapError(error); }
  }

  async receiveDelivery(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      deliveryId: string;
      recipientId: string;
      receivedPackageChecksum?: string;
      receivedAt?: string;
    }
  ): Promise<ReceivedDelivery> {
    await this.requireReceive(tenantId, actorPersonId);
    const checksum = optional(input.receivedPackageChecksum);
    const received: ReceivedDelivery = {
      id: asId<'ReceivedDeliveryId'>(`RCVDEL-${randomUUID()}`, 'Received Delivery'),
      tenantId,
      exchangeDeliveryId: asId<'ExchangeDeliveryId'>(required(input.deliveryId, 'Exchange Delivery'), 'Exchange Delivery'),
      exchangeRecipientId: asId<'ExchangeRecipientId'>(required(input.recipientId, 'Exchange Recipient'), 'Exchange Recipient'),
      receivedByPersonId: asId<'PersonId'>(actorPersonId, 'Receiver'),
      receivedAt: iso(input.receivedAt, 'Received at'),
      ...(checksum ? { receivedPackageChecksum: checksum } : {}),
      status: 'RECEIVED'
    };
    try {
      await this.repository.recordReceivedDelivery(received, this.audit(actorPersonId));
      return received;
    } catch (error) { return mapError(error); }
  }

  async validateReceived(
    tenantId: TenantId,
    actorPersonId: string,
    receivedDeliveryId: string,
    validatedAt?: string
  ): Promise<ReceivedDelivery> {
    await this.requireReceive(tenantId, actorPersonId);
    try {
      return await this.repository.validateReceived(
        tenantId,
        asId<'ReceivedDeliveryId'>(required(receivedDeliveryId, 'Received Delivery'), 'Received Delivery'),
        iso(validatedAt, 'Validated at'),
        this.audit(actorPersonId)
      );
    } catch (error) { return mapError(error); }
  }

  async addMapping(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      receivedDeliveryId: string;
      mappingType: ExchangeMappingType;
      sourceValue: string;
      targetValue: string;
      targetObjectId?: string;
      notes?: string;
    }
  ): Promise<ExchangeMapping> {
    await this.requireReceive(tenantId, actorPersonId);
    if (!MAPPING_TYPES.has(input.mappingType)) {
      throw new ExchangeCommandError('Exchange Mapping type is not supported.', 'INVALID_INPUT');
    }
    const targetObjectId = optional(input.targetObjectId);
    const notes = optional(input.notes);
    const mapping: ExchangeMapping = {
      id: asId<'ExchangeMappingId'>(`EXMAP-${randomUUID()}`, 'Exchange Mapping'),
      tenantId,
      receivedDeliveryId: asId<'ReceivedDeliveryId'>(required(input.receivedDeliveryId, 'Received Delivery'), 'Received Delivery'),
      mappingType: input.mappingType,
      sourceValue: required(input.sourceValue, 'Source value'),
      targetValue: required(input.targetValue, 'Target value'),
      ...(targetObjectId ? { targetObjectId: asId<'CanonicalObjectId'>(targetObjectId, 'Target Object') } : {}),
      ...(notes ? { notes } : {}),
      status: 'ACTIVE'
    };
    try {
      await this.repository.addMapping(mapping, this.audit(actorPersonId));
      return mapping;
    } catch (error) { return mapError(error); }
  }

  async markMapped(
    tenantId: TenantId,
    actorPersonId: string,
    receivedDeliveryId: string,
    mappedAt?: string
  ): Promise<ReceivedDelivery> {
    await this.requireReceive(tenantId, actorPersonId);
    try {
      return await this.repository.markMapped(
        tenantId,
        asId<'ReceivedDeliveryId'>(required(receivedDeliveryId, 'Received Delivery'), 'Received Delivery'),
        iso(mappedAt, 'Mapped at'),
        this.audit(actorPersonId)
      );
    } catch (error) { return mapError(error); }
  }

  async importReceived(
    tenantId: TenantId,
    actorPersonId: string,
    input: { receivedDeliveryId: string; importReference: string; importedAt?: string }
  ): Promise<ReceivedDelivery> {
    await this.requireReceive(tenantId, actorPersonId);
    try {
      return await this.repository.markImported(
        tenantId,
        asId<'ReceivedDeliveryId'>(required(input.receivedDeliveryId, 'Received Delivery'), 'Received Delivery'),
        iso(input.importedAt, 'Imported at'),
        required(input.importReference, 'Import reference'),
        this.audit(actorPersonId)
      );
    } catch (error) { return mapError(error); }
  }

  async rejectReceived(
    tenantId: TenantId,
    actorPersonId: string,
    input: { receivedDeliveryId: string; reason: string; rejectedAt?: string }
  ): Promise<ReceivedDelivery> {
    await this.requireReceive(tenantId, actorPersonId);
    try {
      return await this.repository.rejectReceived(
        tenantId,
        asId<'ReceivedDeliveryId'>(required(input.receivedDeliveryId, 'Received Delivery'), 'Received Delivery'),
        iso(input.rejectedAt, 'Rejected at'),
        required(input.reason, 'Rejection reason'),
        this.audit(actorPersonId)
      );
    } catch (error) { return mapError(error); }
  }

  async adoptAuthority(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      receivedDeliveryId: string;
      sourceSubjectObjectId: string;
      sourceSubjectVersion?: string;
      targetCanonicalObjectId: string;
      targetSubjectVersion?: string;
      sourceAuthority: string;
      targetAuthority: string;
      decisionId: string;
      adoptedAt?: string;
    }
  ): Promise<AuthorityAdoption> {
    await this.requireAuthorityAdopt(tenantId, actorPersonId);
    const sourceSubjectVersion = optional(input.sourceSubjectVersion);
    const targetSubjectVersion = optional(input.targetSubjectVersion);
    const adoption: AuthorityAdoption = {
      id: asId<'AuthorityAdoptionId'>(`AUTHADOPT-${randomUUID()}`, 'Authority Adoption'),
      tenantId,
      receivedDeliveryId: asId<'ReceivedDeliveryId'>(required(input.receivedDeliveryId, 'Received Delivery'), 'Received Delivery'),
      sourceSubjectObjectId: asId<'CanonicalObjectId'>(required(input.sourceSubjectObjectId, 'Source Subject'), 'Source Subject'),
      ...(sourceSubjectVersion ? { sourceSubjectVersion } : {}),
      targetCanonicalObjectId: asId<'CanonicalObjectId'>(required(input.targetCanonicalObjectId, 'Target Canonical Object'), 'Target Canonical Object'),
      ...(targetSubjectVersion ? { targetSubjectVersion } : {}),
      sourceAuthority: required(input.sourceAuthority, 'Source authority'),
      targetAuthority: required(input.targetAuthority, 'Target authority'),
      decisionId: asId<'DecisionId'>(required(input.decisionId, 'Authority Adoption Decision'), 'Decision'),
      adoptedByPersonId: asId<'PersonId'>(actorPersonId, 'Adopter'),
      adoptedAt: iso(input.adoptedAt, 'Adopted at')
    };
    try {
      await this.repository.adoptAuthority(adoption, this.audit(actorPersonId));
      return adoption;
    } catch (error) { return mapError(error); }
  }

  private audit(actorPersonId: string) {
    return { actorPersonId, correlationId: 'EXCHANGE-AUTHORITY' };
  }
  private async requirePermission(
    tenantId: TenantId,
    actorPersonId: string,
    permissionKey: string
  ): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId, actorPersonId, permissionKey, { scopeType: 'TENANT' }
    );
    if (!evaluation.allowed) throw new ExchangeCommandError(evaluation.reason, 'PERMISSION_DENIED');
  }
  private requireManage(tenantId: TenantId, actorPersonId: string) {
    return this.requirePermission(tenantId, actorPersonId, PLATFORM_PERMISSION_KEYS.EXCHANGE_MANAGE);
  }
  private requireReceive(tenantId: TenantId, actorPersonId: string) {
    return this.requirePermission(tenantId, actorPersonId, PLATFORM_PERMISSION_KEYS.EXCHANGE_RECEIVE);
  }
  private requireAuthorityAdopt(tenantId: TenantId, actorPersonId: string) {
    return this.requirePermission(tenantId, actorPersonId, PLATFORM_PERMISSION_KEYS.EXCHANGE_AUTHORITY_ADOPT);
  }
}
