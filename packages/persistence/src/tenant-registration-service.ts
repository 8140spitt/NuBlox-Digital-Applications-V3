import { randomUUID } from 'node:crypto';
import {
  PLATFORM_ADMINISTRATOR_ROLE_ID,
  type TenantId
} from '@nublox/kernel';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';
import { hashPassword } from './auth-repository.js';
import { deriveTenantSlug, normaliseTenantSlug } from './tenant-routing-repository.js';

export type TenantRegistrationErrorCode =
  | 'INVALID_INPUT'
  | 'EMAIL_ALREADY_REGISTERED'
  | 'SLUG_UNAVAILABLE';

export class TenantRegistrationError extends Error {
  constructor(
    message: string,
    readonly code: TenantRegistrationErrorCode
  ) {
    super(message);
    this.name = 'TenantRegistrationError';
  }
}

export interface TenantRegistrationInput {
  businessName: string;
  tenantSlug?: string;
  personName: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
}

export interface TenantRegistrationResult {
  tenantId: TenantId;
  tenantSlug: string;
  tenantName: string;
  organisationId: string;
  tenantPartyId: string;
  personId: string;
  employeePartyId: string;
  userId: string;
}

interface CountRow extends RowDataPacket {
  count: number;
}

function required(value: string, label: string, maxLength = 255): string {
  const result = value.trim();
  if (!result) throw new TenantRegistrationError(`${label} is required.`, 'INVALID_INPUT');
  if (result.length > maxLength) {
    throw new TenantRegistrationError(
      `${label} must not exceed ${maxLength} characters.`,
      'INVALID_INPUT'
    );
  }
  return result;
}

function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}

async function audit(
  connection: PoolConnection,
  tenantId: string,
  entityType: string,
  entityId: string,
  action: string,
  actorPersonId: string,
  payload: unknown
): Promise<void> {
  await connection.execute(
    `INSERT INTO kernel_audit_entries
      (tenant_id, entity_type, entity_id, action, actor_person_id, correlation_id, payload)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      tenantId,
      entityType,
      entityId,
      action,
      actorPersonId,
      `TENANT-REGISTRATION:${tenantId}`,
      JSON.stringify(payload)
    ]
  );
}

export class MySqlTenantRegistrationService {
  constructor(private readonly pool: Pool) {}

  async register(input: TenantRegistrationInput): Promise<TenantRegistrationResult> {
    if (!input.acceptedTerms) {
      throw new TenantRegistrationError(
        'The NuBlox terms and privacy notice must be accepted.',
        'INVALID_INPUT'
      );
    }

    const businessName = required(input.businessName, 'Business name');
    const personName = required(input.personName, 'Your name');
    const email = required(input.email, 'Email', 320);
    const emailNormalized = normaliseEmail(email);

    if (!emailNormalized.includes('@')) {
      throw new TenantRegistrationError('A valid email address is required.', 'INVALID_INPUT');
    }

    if (input.password.length < 12) {
      throw new TenantRegistrationError(
        'Password must contain at least 12 characters.',
        'INVALID_INPUT'
      );
    }

    const tenantId = `TENANT-${randomUUID()}` as TenantId;
    let tenantSlug: string;
    try {
      tenantSlug = input.tenantSlug?.trim()
        ? normaliseTenantSlug(input.tenantSlug)
        : deriveTenantSlug(businessName, tenantId);
    } catch (error) {
      throw new TenantRegistrationError(
        error instanceof Error ? error.message : 'Tenant address is not valid.',
        'INVALID_INPUT'
      );
    }

    const passwordHash = await hashPassword(input.password);

    const tenantPartyId = `PARTY-TENANT-${randomUUID()}`;
    const organisationId = `ORG-${randomUUID()}`;
    const organisationUnitId = `ORGUNIT-${randomUUID()}`;
    const employeePartyId = `PARTY-EMPLOYEE-${randomUUID()}`;
    const personId = `PERSON-${randomUUID()}`;
    const userId = `USER-${randomUUID()}`;
    const accessAssignmentId = `ARA-${randomUUID()}`;
    const effectiveFrom = new Date();

    return withTransaction(this.pool, async (connection) => {
      const [emailRows] = await connection.execute<CountRow[]>(
        'SELECT COUNT(*) AS count FROM application_users WHERE email_normalized = ?',
        [emailNormalized]
      );
      if ((emailRows[0]?.count ?? 0) > 0) {
        throw new TenantRegistrationError(
          'An account already exists for this email address.',
          'EMAIL_ALREADY_REGISTERED'
        );
      }

      const [slugRows] = await connection.execute<CountRow[]>(
        'SELECT COUNT(*) AS count FROM tenants WHERE slug = ?',
        [tenantSlug]
      );
      if ((slugRows[0]?.count ?? 0) > 0) {
        throw new TenantRegistrationError(
          'That tenant address is already in use.',
          'SLUG_UNAVAILABLE'
        );
      }

      await connection.execute(
        `INSERT INTO tenants
          (id, slug, name, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, 'ACTIVE', ?, ?)`,
        [tenantId, tenantSlug, businessName, personId, personId]
      );

      await connection.execute(
        `INSERT INTO parties
          (id, tenant_id, kind, display_name, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, 'ORGANISATION', ?, 'ACTIVE', ?, ?)`,
        [tenantPartyId, tenantId, businessName, personId, personId]
      );
      await connection.execute(
        `INSERT INTO party_type_assignments
          (tenant_id, party_id, party_type, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, 'TENANT', 'ACTIVE', ?, ?)`,
        [tenantId, tenantPartyId, personId, personId]
      );

      await connection.execute(
        `INSERT INTO organisations
          (id, tenant_id, party_id, legal_name, trading_name, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
        [organisationId, tenantId, tenantPartyId, businessName, businessName, personId, personId]
      );

      await connection.execute(
        `INSERT INTO tenant_party_bindings
          (tenant_id, party_id, organisation_id, created_by_person_id)
         VALUES (?, ?, ?, ?)`,
        [tenantId, tenantPartyId, organisationId, personId]
      );

      await connection.execute(
        `INSERT INTO organisation_units
          (id, tenant_id, organisation_id, parent_unit_id, code, name, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, NULL, 'ROOT', ?, 'ACTIVE', ?, ?)`,
        [organisationUnitId, tenantId, organisationId, businessName, personId, personId]
      );

      await connection.execute(
        `INSERT INTO parties
          (id, tenant_id, kind, display_name, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, 'PERSON', ?, 'ACTIVE', ?, ?)`,
        [employeePartyId, tenantId, personName, personId, personId]
      );
      await connection.execute(
        `INSERT INTO party_type_assignments
          (tenant_id, party_id, party_type, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, 'EMPLOYEE', 'ACTIVE', ?, ?)`,
        [tenantId, employeePartyId, personId, personId]
      );

      await connection.execute(
        `INSERT INTO persons
          (id, tenant_id, party_id, legal_name, preferred_name, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
        [personId, tenantId, employeePartyId, personName, personName, personId, personId]
      );

      await connection.execute(
        `INSERT INTO application_users
          (id, email, email_normalized, password_hash, status, password_changed_at)
         VALUES (?, ?, ?, ?, 'ACTIVE', UTC_TIMESTAMP(6))`,
        [userId, email.trim(), emailNormalized, passwordHash]
      );

      await connection.execute(
        `INSERT INTO application_user_tenants
          (user_id, tenant_id, person_id, status, is_default)
         VALUES (?, ?, ?, 'ACTIVE', TRUE)`,
        [userId, tenantId, personId]
      );

      await connection.execute(
        `INSERT INTO access_role_assignments
          (id, tenant_id, access_role_id, principal_type, principal_id,
           scope_type, scope_id, effective_from, effective_to, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, 'PERSON', ?, 'TENANT', NULL, ?, NULL, 'ACTIVE', ?, ?)`,
        [
          accessAssignmentId,
          tenantId,
          PLATFORM_ADMINISTRATOR_ROLE_ID,
          personId,
          effectiveFrom,
          personId,
          personId
        ]
      );

      await connection.execute(
        `INSERT INTO application_auth_events
          (user_id, tenant_id, email_normalized, event_type, outcome, metadata)
         VALUES (?, ?, ?, 'TENANT_REGISTERED', 'SUCCESS', ?)`,
        [
          userId,
          tenantId,
          emailNormalized,
          JSON.stringify({ tenantSlug, organisationId, personId })
        ]
      );

      await audit(connection, tenantId, 'TENANT', tenantId, 'REGISTERED', personId, {
        tenantId,
        tenantSlug,
        name: businessName,
        tenantPartyId,
        organisationId
      });
      await audit(connection, tenantId, 'PARTY', tenantPartyId, 'CREATED', personId, {
        partyType: 'TENANT',
        displayName: businessName
      });
      await audit(connection, tenantId, 'ORGANISATION', organisationId, 'CREATED', personId, {
        legalName: businessName,
        partyId: tenantPartyId
      });
      await audit(connection, tenantId, 'PERSON', personId, 'CREATED', personId, {
        legalName: personName,
        partyId: employeePartyId,
        partyType: 'EMPLOYEE'
      });
      await audit(
        connection,
        tenantId,
        'ACCESS_ROLE_ASSIGNMENT',
        accessAssignmentId,
        'GRANTED',
        personId,
        {
          accessRoleId: PLATFORM_ADMINISTRATOR_ROLE_ID,
          principalType: 'PERSON',
          principalId: personId,
          scopeType: 'TENANT'
        }
      );

      return {
        tenantId,
        tenantSlug,
        tenantName: businessName,
        organisationId,
        tenantPartyId,
        personId,
        employeePartyId,
        userId
      };
    });
  }
}
