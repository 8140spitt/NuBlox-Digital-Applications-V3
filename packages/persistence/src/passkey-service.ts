import {
  createHash,
  createPublicKey,
  randomBytes,
  timingSafeEqual,
  verify as verifySignature
} from 'node:crypto';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import type { AuthPrincipal } from './auth-repository.js';
import { withTransaction } from './database.js';

const CHALLENGE_TTL_SECONDS = 5 * 60;
const MAX_ATTEMPTS = 5;
const ES256_ALGORITHM = -7;

export type PasskeyErrorCode =
  | 'NOT_AVAILABLE'
  | 'INVALID_CHALLENGE'
  | 'CHALLENGE_EXPIRED'
  | 'TOO_MANY_ATTEMPTS'
  | 'INVALID_RESPONSE'
  | 'CREDENTIAL_NOT_FOUND'
  | 'CREDENTIAL_ALREADY_REGISTERED';

export class PasskeyError extends Error {
  constructor(
    message: string,
    readonly code: PasskeyErrorCode
  ) {
    super(message);
    this.name = 'PasskeyError';
  }
}

export interface PasskeySummary {
  credentialId: string;
  displayName: string;
  createdAt: string;
  lastUsedAt: string | null;
  backupEligible: boolean;
  backedUp: boolean;
}

export interface PasskeyRegistrationOptions {
  challenge: string;
  rp: { id: string; name: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: Array<{ type: 'public-key'; alg: number }>;
  timeout: number;
  attestation: 'none';
  authenticatorSelection: {
    residentKey: 'preferred';
    userVerification: 'required';
  };
  excludeCredentials: Array<{
    type: 'public-key';
    id: string;
    transports?: string[];
  }>;
}

export interface PasskeyAuthenticationOptions {
  challenge: string;
  rpId: string;
  timeout: number;
  userVerification: 'required';
  allowCredentials: Array<{
    type: 'public-key';
    id: string;
    transports?: string[];
  }>;
}

export interface PasskeyRegistrationStart {
  token: string;
  expiresAt: string;
  options: PasskeyRegistrationOptions;
}

export interface PasskeyAuthenticationStart {
  token: string;
  expiresAt: string;
  options: PasskeyAuthenticationOptions;
}

export interface PasskeyAuthenticationResult {
  principal: AuthPrincipal;
  returnTo: string;
}

export interface PasskeyCredentialResponse {
  id: string;
  rawId?: string;
  type: 'public-key';
  response: {
    clientDataJSON: string;
    attestationObject?: string;
    authenticatorData?: string;
    signature?: string;
    userHandle?: string | null;
    transports?: string[];
  };
}

interface ChallengeRow extends RowDataPacket {
  token_hash: string;
  challenge: string;
  ceremony: 'REGISTER' | 'AUTHENTICATE';
  user_id: string;
  tenant_id: string;
  person_id: string;
  rp_id: string;
  expected_origin: string;
  return_to: string | null;
  expires_at: Date;
  consumed_at: Date | null;
  attempt_count: number;
  email: string;
  tenant_slug: string;
  tenant_name: string;
  person_name: string;
}

interface PasskeyRow extends RowDataPacket {
  credential_id: string;
  user_id: string;
  tenant_id: string;
  person_id: string;
  user_handle: string;
  display_name: string;
  public_key_cose: Buffer;
  algorithm: number;
  signature_counter: string | number;
  transports: string | null;
  backup_eligible: number | boolean;
  backed_up: number | boolean;
  created_at: Date;
  last_used_at: Date | null;
}

interface IdentityRow extends RowDataPacket {
  user_id: string;
  email: string;
  email_verified_at: Date | null;
  tenant_id: string;
  tenant_slug: string;
  tenant_name: string;
  person_id: string;
  person_name: string;
}

type CborValue =
  | number
  | string
  | Buffer
  | boolean
  | null
  | CborValue[]
  | Map<number | string, CborValue>;

function sha256(value: Buffer | string): Buffer {
  return createHash('sha256').update(value).digest();
}

function tokenHash(value: string): string {
  return sha256(value).toString('hex');
}

function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}

function decodeBase64Url(value: string): Buffer {
  try {
    return Buffer.from(value, 'base64url');
  } catch {
    throw new PasskeyError('The passkey response is malformed.', 'INVALID_RESPONSE');
  }
}

function equalBytes(left: Buffer, right: Buffer): boolean {
  return left.length === right.length && timingSafeEqual(left, right);
}

function sanitiseTransports(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const accepted = new Set([
    'ble',
    'cable',
    'hybrid',
    'internal',
    'nfc',
    'smart-card',
    'usb'
  ]);

  return value
    .filter((item): item is string => typeof item === 'string' && accepted.has(item))
    .slice(0, 8);
}

function parseStoredTransports(value: string | null): string[] | undefined {
  if (!value) return undefined;
  const transports = value.split(',').map((part) => part.trim()).filter(Boolean);
  return transports.length > 0 ? transports : undefined;
}

function validateRelyingParty(rpId: string, origin: string): void {
  const hostname = rpId.trim().toLowerCase();
  if (!hostname || hostname.length > 255) {
    throw new PasskeyError('The WebAuthn relying party is not valid.', 'INVALID_RESPONSE');
  }

  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    throw new PasskeyError('The WebAuthn origin is not valid.', 'INVALID_RESPONSE');
  }

  const originHost = parsed.hostname.toLowerCase();
  if (originHost !== hostname && !originHost.endsWith(`.${hostname}`)) {
    throw new PasskeyError('The WebAuthn origin does not match the relying party.', 'INVALID_RESPONSE');
  }

  const local = originHost === 'localhost' || originHost === '127.0.0.1' || originHost === '::1';
  if (parsed.protocol !== 'https:' && !local) {
    throw new PasskeyError('Passkeys require HTTPS outside local development.', 'INVALID_RESPONSE');
  }
}

function readUnsigned(buffer: Buffer, offset: number, byteLength: number): {
  value: number;
  offset: number;
} {
  if (offset + byteLength > buffer.length) {
    throw new PasskeyError('The passkey CBOR payload is truncated.', 'INVALID_RESPONSE');
  }

  if (byteLength === 1) return { value: buffer.readUInt8(offset), offset: offset + 1 };
  if (byteLength === 2) return { value: buffer.readUInt16BE(offset), offset: offset + 2 };
  if (byteLength === 4) return { value: buffer.readUInt32BE(offset), offset: offset + 4 };
  if (byteLength === 8) {
    const value = buffer.readBigUInt64BE(offset);
    if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new PasskeyError('The passkey CBOR integer is too large.', 'INVALID_RESPONSE');
    }
    return { value: Number(value), offset: offset + 8 };
  }

  throw new PasskeyError('The passkey CBOR integer width is unsupported.', 'INVALID_RESPONSE');
}

function cborArgument(
  buffer: Buffer,
  offset: number,
  additional: number
): { value: number; offset: number } {
  if (additional < 24) return { value: additional, offset };
  if (additional === 24) return readUnsigned(buffer, offset, 1);
  if (additional === 25) return readUnsigned(buffer, offset, 2);
  if (additional === 26) return readUnsigned(buffer, offset, 4);
  if (additional === 27) return readUnsigned(buffer, offset, 8);

  throw new PasskeyError('Indefinite CBOR values are not accepted.', 'INVALID_RESPONSE');
}

function decodeCbor(buffer: Buffer, initialOffset = 0): {
  value: CborValue;
  offset: number;
} {
  if (initialOffset >= buffer.length) {
    throw new PasskeyError('The passkey CBOR payload is empty.', 'INVALID_RESPONSE');
  }

  const first = buffer.readUInt8(initialOffset);
  const major = first >> 5;
  const additional = first & 0x1f;
  let offset = initialOffset + 1;

  const argument = cborArgument(buffer, offset, additional);
  const length = argument.value;
  offset = argument.offset;

  if (major === 0) return { value: length, offset };
  if (major === 1) return { value: -1 - length, offset };

  if (major === 2 || major === 3) {
    if (offset + length > buffer.length) {
      throw new PasskeyError('The passkey CBOR value is truncated.', 'INVALID_RESPONSE');
    }
    const bytes = buffer.subarray(offset, offset + length);
    return {
      value: major === 2 ? Buffer.from(bytes) : bytes.toString('utf8'),
      offset: offset + length
    };
  }

  if (major === 4) {
    const values: CborValue[] = [];
    for (let index = 0; index < length; index += 1) {
      const decoded = decodeCbor(buffer, offset);
      values.push(decoded.value);
      offset = decoded.offset;
    }
    return { value: values, offset };
  }

  if (major === 5) {
    const map = new Map<number | string, CborValue>();
    for (let index = 0; index < length; index += 1) {
      const decodedKey = decodeCbor(buffer, offset);
      offset = decodedKey.offset;
      if (typeof decodedKey.value !== 'number' && typeof decodedKey.value !== 'string') {
        throw new PasskeyError('The passkey CBOR map key is invalid.', 'INVALID_RESPONSE');
      }
      const decodedValue = decodeCbor(buffer, offset);
      offset = decodedValue.offset;
      map.set(decodedKey.value, decodedValue.value);
    }
    return { value: map, offset };
  }

  if (major === 7) {
    if (additional === 20) return { value: false, offset: initialOffset + 1 };
    if (additional === 21) return { value: true, offset: initialOffset + 1 };
    if (additional === 22) return { value: null, offset: initialOffset + 1 };
  }

  throw new PasskeyError('The passkey CBOR value type is unsupported.', 'INVALID_RESPONSE');
}

function cborMap(value: CborValue): Map<number | string, CborValue> {
  if (!(value instanceof Map)) {
    throw new PasskeyError('The passkey CBOR object is invalid.', 'INVALID_RESPONSE');
  }
  return value;
}

function cborBuffer(value: CborValue | undefined): Buffer {
  if (!Buffer.isBuffer(value)) {
    throw new PasskeyError('The passkey CBOR byte value is invalid.', 'INVALID_RESPONSE');
  }
  return value;
}

function cborNumber(value: CborValue | undefined): number {
  if (typeof value !== 'number') {
    throw new PasskeyError('The passkey CBOR numeric value is invalid.', 'INVALID_RESPONSE');
  }
  return value;
}

function parseClientData(
  encoded: string,
  expectedType: 'webauthn.create' | 'webauthn.get',
  expectedChallenge: string,
  expectedOrigin: string
): Buffer {
  const bytes = decodeBase64Url(encoded);
  let clientData: {
    type?: unknown;
    challenge?: unknown;
    origin?: unknown;
    crossOrigin?: unknown;
  };

  try {
    clientData = JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new PasskeyError('The passkey client data is invalid.', 'INVALID_RESPONSE');
  }

  if (
    clientData.type !== expectedType ||
    clientData.challenge !== expectedChallenge ||
    clientData.origin !== expectedOrigin ||
    clientData.crossOrigin === true
  ) {
    throw new PasskeyError('The passkey client data could not be verified.', 'INVALID_RESPONSE');
  }

  return bytes;
}

function parseAuthenticatorData(
  authData: Buffer,
  rpId: string,
  requireAttestedCredential: boolean
): {
  flags: number;
  counter: number;
  credentialId?: string;
  publicKeyCose?: Buffer;
} {
  if (authData.length < 37) {
    throw new PasskeyError('The authenticator data is truncated.', 'INVALID_RESPONSE');
  }

  const expectedRpHash = sha256(rpId);
  if (!equalBytes(authData.subarray(0, 32), expectedRpHash)) {
    throw new PasskeyError('The passkey relying-party binding is invalid.', 'INVALID_RESPONSE');
  }

  const flags = authData.readUInt8(32);
  const userPresent = (flags & 0x01) !== 0;
  const userVerified = (flags & 0x04) !== 0;
  const attestedCredentialData = (flags & 0x40) !== 0;

  if (!userPresent || !userVerified) {
    throw new PasskeyError('The authenticator did not verify the user.', 'INVALID_RESPONSE');
  }

  if (requireAttestedCredential && !attestedCredentialData) {
    throw new PasskeyError('The authenticator did not provide credential data.', 'INVALID_RESPONSE');
  }

  const counter = authData.readUInt32BE(33);
  if (!requireAttestedCredential) return { flags, counter };

  let offset = 37;
  if (offset + 18 > authData.length) {
    throw new PasskeyError('The attested credential data is truncated.', 'INVALID_RESPONSE');
  }

  offset += 16;
  const credentialLength = authData.readUInt16BE(offset);
  offset += 2;

  if (credentialLength < 1 || offset + credentialLength > authData.length) {
    throw new PasskeyError('The credential ID is invalid.', 'INVALID_RESPONSE');
  }

  const credentialId = authData.subarray(offset, offset + credentialLength).toString('base64url');
  offset += credentialLength;

  const decodedKey = decodeCbor(authData, offset);
  const publicKeyCose = Buffer.from(authData.subarray(offset, decodedKey.offset));
  validateCoseKey(publicKeyCose);

  return {
    flags,
    counter,
    credentialId,
    publicKeyCose
  };
}

function validateCoseKey(cose: Buffer): {
  x: Buffer;
  y: Buffer;
} {
  const decoded = decodeCbor(cose);
  if (decoded.offset !== cose.length) {
    throw new PasskeyError('The passkey public key contains trailing data.', 'INVALID_RESPONSE');
  }

  const key = cborMap(decoded.value);
  if (
    cborNumber(key.get(1)) !== 2 ||
    cborNumber(key.get(3)) !== ES256_ALGORITHM ||
    cborNumber(key.get(-1)) !== 1
  ) {
    throw new PasskeyError('Only ES256 P-256 passkeys are currently accepted.', 'INVALID_RESPONSE');
  }

  const x = cborBuffer(key.get(-2));
  const y = cborBuffer(key.get(-3));
  if (x.length !== 32 || y.length !== 32) {
    throw new PasskeyError('The passkey P-256 public key is invalid.', 'INVALID_RESPONSE');
  }

  return { x, y };
}

function verifyAssertion(
  publicKeyCose: Buffer,
  authenticatorData: Buffer,
  clientDataBytes: Buffer,
  signature: Buffer
): boolean {
  const { x, y } = validateCoseKey(publicKeyCose);
  const key = createPublicKey({
    key: {
      kty: 'EC',
      crv: 'P-256',
      x: x.toString('base64url'),
      y: y.toString('base64url')
    },
    format: 'jwk'
  });

  return verifySignature(
    'sha256',
    Buffer.concat([authenticatorData, sha256(clientDataBytes)]),
    key,
    signature
  );
}

async function authEvent(
  connection: PoolConnection,
  input: {
    userId: string;
    tenantId: string;
    email?: string;
    eventType: string;
    outcome: 'SUCCESS' | 'DENIED' | 'ERROR';
    metadata?: Record<string, string | number | boolean>;
  }
): Promise<void> {
  await connection.execute(
    `INSERT INTO application_auth_events
      (user_id, tenant_id, email_normalized, event_type, outcome, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.userId,
      input.tenantId,
      input.email ? normaliseEmail(input.email) : null,
      input.eventType,
      input.outcome,
      input.metadata ? JSON.stringify(input.metadata) : null
    ]
  );
}

export class MySqlPasskeyService {
  constructor(private readonly pool: Pool) {}

  async list(principal: AuthPrincipal): Promise<PasskeySummary[]> {
    const [rows] = await this.pool.query<PasskeyRow[]>(
      `SELECT credential_id, user_id, tenant_id, person_id, user_handle, display_name,
              public_key_cose, algorithm, signature_counter, transports,
              backup_eligible, backed_up, created_at, last_used_at
         FROM application_passkeys
        WHERE user_id = ?
          AND tenant_id = ?
          AND status = 'ACTIVE'
        ORDER BY created_at DESC`,
      [principal.userId, principal.tenantId]
    );

    return rows.map((row) => ({
      credentialId: row.credential_id,
      displayName: row.display_name,
      createdAt: row.created_at.toISOString(),
      lastUsedAt: row.last_used_at?.toISOString() ?? null,
      backupEligible: Boolean(row.backup_eligible),
      backedUp: Boolean(row.backed_up)
    }));
  }

  async beginRegistration(
    principal: AuthPrincipal,
    rpId: string,
    origin: string
  ): Promise<PasskeyRegistrationStart> {
    validateRelyingParty(rpId, origin);
    await this.assertPasskeyEnabled(principal.tenantId);

    const existing = await this.list(principal);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CHALLENGE_TTL_SECONDS * 1000);
    const challenge = randomBytes(32).toString('base64url');
    const token = randomBytes(32).toString('base64url');

    const userHandle = await withTransaction(this.pool, async (connection) => {
      const [profileRows] = await connection.query<Array<RowDataPacket & { user_handle: string }>>(
        `SELECT user_handle
           FROM application_passkey_profiles
          WHERE user_id = ?
            AND tenant_id = ?
          LIMIT 1
          FOR UPDATE`,
        [principal.userId, principal.tenantId]
      );

      let handle = profileRows[0]?.user_handle;
      if (!handle) {
        handle = randomBytes(32).toString('base64url');
        await connection.execute(
          `INSERT INTO application_passkey_profiles
            (user_id, tenant_id, person_id, user_handle)
           VALUES (?, ?, ?, ?)`,
          [principal.userId, principal.tenantId, principal.personId, handle]
        );
      }

      await connection.execute(
        `UPDATE application_passkey_challenges
            SET consumed_at = COALESCE(consumed_at, UTC_TIMESTAMP(6))
          WHERE user_id = ?
            AND tenant_id = ?
            AND ceremony = 'REGISTER'
            AND consumed_at IS NULL`,
        [principal.userId, principal.tenantId]
      );

      await connection.execute(
        `INSERT INTO application_passkey_challenges
          (token_hash, challenge, ceremony, user_id, tenant_id, person_id,
           rp_id, expected_origin, created_at, expires_at, attempt_count)
         VALUES (?, ?, 'REGISTER', ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          tokenHash(token),
          challenge,
          principal.userId,
          principal.tenantId,
          principal.personId,
          rpId,
          origin,
          now,
          expiresAt
        ]
      );

      await authEvent(connection, {
        userId: principal.userId,
        tenantId: principal.tenantId,
        email: principal.email,
        eventType: 'PASSKEY_REGISTRATION_CHALLENGE_ISSUED',
        outcome: 'SUCCESS'
      });

      return handle;
    });

    return {
      token,
      expiresAt: expiresAt.toISOString(),
      options: {
        challenge,
        rp: { id: rpId, name: 'NuBlox' },
        user: {
          id: userHandle,
          name: principal.email,
          displayName: principal.personName
        },
        pubKeyCredParams: [{ type: 'public-key', alg: ES256_ALGORITHM }],
        timeout: CHALLENGE_TTL_SECONDS * 1000,
        attestation: 'none',
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'required'
        },
        excludeCredentials: existing.map((passkey) => ({
          type: 'public-key',
          id: passkey.credentialId
        }))
      }
    };
  }

  async completeRegistration(
    principal: AuthPrincipal,
    tokenValue: string,
    response: PasskeyCredentialResponse,
    displayNameValue: string
  ): Promise<PasskeySummary> {
    const challenge = await this.challenge(tokenValue, 'REGISTER');
    this.assertPrincipal(challenge, principal);

    try {
      if (
        response.type !== 'public-key' ||
        !response.id ||
        response.id.length > 2048
      ) {
        throw new PasskeyError('The passkey credential type is invalid.', 'INVALID_RESPONSE');
      }

      parseClientData(
        response.response.clientDataJSON,
        'webauthn.create',
        challenge.challenge,
        challenge.expected_origin
      );

      if (!response.response.attestationObject) {
        throw new PasskeyError('The passkey attestation is missing.', 'INVALID_RESPONSE');
      }

      const attestation = cborMap(decodeCbor(decodeBase64Url(response.response.attestationObject)).value);
      if (attestation.get('fmt') !== 'none') {
        throw new PasskeyError('Unexpected passkey attestation format.', 'INVALID_RESPONSE');
      }

      const authData = cborBuffer(attestation.get('authData'));
      const parsed = parseAuthenticatorData(authData, challenge.rp_id, true);
      const credentialId = parsed.credentialId;
      const publicKeyCose = parsed.publicKeyCose;
      if (!credentialId || !publicKeyCose) {
        throw new PasskeyError('The authenticator did not provide complete credential data.', 'INVALID_RESPONSE');
      }
      const rawId = response.rawId ?? response.id;

      if (credentialId !== response.id || credentialId !== rawId) {
        throw new PasskeyError('The passkey credential ID is inconsistent.', 'INVALID_RESPONSE');
      }

      const displayName = displayNameValue.trim().slice(0, 120) || 'Passkey';
      const transports = sanitiseTransports(response.response.transports);
      const backupEligible = (parsed.flags & 0x08) !== 0;
      const backedUp = (parsed.flags & 0x10) !== 0;

      return await withTransaction(this.pool, async (connection) => {
        await this.lockUsableChallenge(connection, challenge.token_hash);

        const [existingRows] = await connection.query<Array<RowDataPacket & { credential_id: string }>>(
          'SELECT credential_id FROM application_passkeys WHERE credential_id = ? LIMIT 1 FOR UPDATE',
          [credentialId]
        );
        if (existingRows[0]) {
          throw new PasskeyError(
            'This passkey is already registered.',
            'CREDENTIAL_ALREADY_REGISTERED'
          );
        }

        const [profileRows] = await connection.query<Array<RowDataPacket & { user_handle: string }>>(
          `SELECT user_handle
             FROM application_passkey_profiles
            WHERE user_id = ?
              AND tenant_id = ?
            LIMIT 1`,
          [principal.userId, principal.tenantId]
        );
        const userHandle = profileRows[0]?.user_handle;
        if (!userHandle) {
          throw new PasskeyError('Passkey profile not found.', 'INVALID_CHALLENGE');
        }

        await connection.execute(
          `INSERT INTO application_passkeys
            (credential_id, user_id, tenant_id, person_id, user_handle, display_name,
             public_key_cose, algorithm, signature_counter, transports,
             backup_eligible, backed_up, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
          [
            credentialId,
            principal.userId,
            principal.tenantId,
            principal.personId,
            userHandle,
            displayName,
            publicKeyCose,
            ES256_ALGORITHM,
            parsed.counter,
            transports.length > 0 ? transports.join(',') : null,
            backupEligible,
            backedUp
          ]
        );

        await connection.execute(
          `UPDATE application_passkey_challenges
              SET consumed_at = UTC_TIMESTAMP(6)
            WHERE token_hash = ?`,
          [challenge.token_hash]
        );

        await authEvent(connection, {
          userId: principal.userId,
          tenantId: principal.tenantId,
          email: principal.email,
          eventType: 'PASSKEY_REGISTERED',
          outcome: 'SUCCESS',
          metadata: { backupEligible, backedUp }
        });

        return {
          credentialId,
          displayName,
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
          backupEligible,
          backedUp
        };
      });
    } catch (error) {
      await this.recordFailure(challenge, principal.email);
      throw error;
    }
  }

  async beginAuthentication(
    tenantId: string,
    emailValue: string,
    rpId: string,
    origin: string,
    returnTo: string
  ): Promise<PasskeyAuthenticationStart> {
    validateRelyingParty(rpId, origin);
    await this.assertPasskeyEnabled(tenantId);
    const email = normaliseEmail(emailValue);

    const [identityRows] = await this.pool.query<IdentityRow[]>(
      `SELECT u.id AS user_id, u.email, u.email_verified_at,
              ut.tenant_id, t.slug AS tenant_slug, t.name AS tenant_name,
              ut.person_id, COALESCE(p.preferred_name, p.legal_name) AS person_name
         FROM application_users u
         JOIN application_user_tenants ut
           ON ut.user_id = u.id
          AND ut.tenant_id = ?
          AND ut.status = 'ACTIVE'
         JOIN tenants t
           ON t.id = ut.tenant_id
          AND t.status = 'ACTIVE'
         JOIN persons p
           ON p.tenant_id = ut.tenant_id
          AND p.id = ut.person_id
          AND p.status = 'ACTIVE'
        WHERE u.email_normalized = ?
          AND u.status = 'ACTIVE'
        LIMIT 1`,
      [tenantId, email]
    );
    const identity = identityRows[0];

    if (!identity || !identity.email_verified_at) {
      throw new PasskeyError('Passkey sign-in is not available for this identity.', 'NOT_AVAILABLE');
    }

    const [passkeys] = await this.pool.query<PasskeyRow[]>(
      `SELECT credential_id, user_id, tenant_id, person_id, user_handle, display_name,
              public_key_cose, algorithm, signature_counter, transports,
              backup_eligible, backed_up, created_at, last_used_at
         FROM application_passkeys
        WHERE user_id = ?
          AND tenant_id = ?
          AND status = 'ACTIVE'
        ORDER BY created_at DESC`,
      [identity.user_id, tenantId]
    );

    if (passkeys.length === 0) {
      throw new PasskeyError('Passkey sign-in is not available for this identity.', 'NOT_AVAILABLE');
    }

    const challenge = randomBytes(32).toString('base64url');
    const token = randomBytes(32).toString('base64url');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CHALLENGE_TTL_SECONDS * 1000);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `UPDATE application_passkey_challenges
            SET consumed_at = COALESCE(consumed_at, UTC_TIMESTAMP(6))
          WHERE user_id = ?
            AND tenant_id = ?
            AND ceremony = 'AUTHENTICATE'
            AND consumed_at IS NULL`,
        [identity.user_id, tenantId]
      );

      await connection.execute(
        `INSERT INTO application_passkey_challenges
          (token_hash, challenge, ceremony, user_id, tenant_id, person_id,
           rp_id, expected_origin, return_to, created_at, expires_at, attempt_count)
         VALUES (?, ?, 'AUTHENTICATE', ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          tokenHash(token),
          challenge,
          identity.user_id,
          tenantId,
          identity.person_id,
          rpId,
          origin,
          returnTo.slice(0, 1024),
          now,
          expiresAt
        ]
      );

      await authEvent(connection, {
        userId: identity.user_id,
        tenantId,
        email: identity.email,
        eventType: 'PASSKEY_LOGIN_CHALLENGE_ISSUED',
        outcome: 'SUCCESS'
      });
    });

    return {
      token,
      expiresAt: expiresAt.toISOString(),
      options: {
        challenge,
        rpId,
        timeout: CHALLENGE_TTL_SECONDS * 1000,
        userVerification: 'required',
        allowCredentials: passkeys.map((passkey) => {
          const transports = parseStoredTransports(passkey.transports);
          return {
            type: 'public-key' as const,
            id: passkey.credential_id,
            ...(transports ? { transports } : {})
          };
        })
      }
    };
  }

  async completeAuthentication(
    tokenValue: string,
    response: PasskeyCredentialResponse
  ): Promise<PasskeyAuthenticationResult> {
    const challenge = await this.challenge(tokenValue, 'AUTHENTICATE');

    try {
      if (
        response.type !== 'public-key' ||
        !response.id ||
        response.id.length > 2048
      ) {
        throw new PasskeyError('The passkey credential type is invalid.', 'INVALID_RESPONSE');
      }

      const passkey = await this.passkeyForChallenge(challenge, response.id);
      if (
        response.response.userHandle &&
        response.response.userHandle !== passkey.user_handle
      ) {
        throw new PasskeyError('The passkey user handle is invalid.', 'INVALID_RESPONSE');
      }

      const clientData = parseClientData(
        response.response.clientDataJSON,
        'webauthn.get',
        challenge.challenge,
        challenge.expected_origin
      );

      if (!response.response.authenticatorData || !response.response.signature) {
        throw new PasskeyError('The passkey assertion is incomplete.', 'INVALID_RESPONSE');
      }

      const authenticatorData = decodeBase64Url(response.response.authenticatorData);
      const parsed = parseAuthenticatorData(authenticatorData, challenge.rp_id, false);
      const signature = decodeBase64Url(response.response.signature);

      if (!verifyAssertion(passkey.public_key_cose, authenticatorData, clientData, signature)) {
        throw new PasskeyError('The passkey signature could not be verified.', 'INVALID_RESPONSE');
      }

      const storedCounter = Number(passkey.signature_counter);
      if (storedCounter > 0 && parsed.counter <= storedCounter) {
        throw new PasskeyError('The passkey signature counter is invalid.', 'INVALID_RESPONSE');
      }

      const backedUp = (parsed.flags & 0x10) !== 0;

      await withTransaction(this.pool, async (connection) => {
        await this.lockUsableChallenge(connection, challenge.token_hash);

        await connection.execute(
          `UPDATE application_passkeys
              SET signature_counter = ?,
                  backed_up = ?,
                  last_used_at = UTC_TIMESTAMP(6)
            WHERE credential_id = ?
              AND user_id = ?
              AND tenant_id = ?
              AND status = 'ACTIVE'`,
          [
            parsed.counter,
            backedUp,
            passkey.credential_id,
            challenge.user_id,
            challenge.tenant_id
          ]
        );

        await connection.execute(
          `UPDATE application_passkey_challenges
              SET consumed_at = UTC_TIMESTAMP(6)
            WHERE token_hash = ?`,
          [challenge.token_hash]
        );

        await authEvent(connection, {
          userId: challenge.user_id,
          tenantId: challenge.tenant_id,
          email: challenge.email,
          eventType: 'PASSKEY_LOGIN',
          outcome: 'SUCCESS',
          metadata: { backedUp }
        });
      });

      return {
        principal: {
          userId: challenge.user_id,
          email: challenge.email,
          tenantId: challenge.tenant_id,
          tenantSlug: challenge.tenant_slug,
          tenantName: challenge.tenant_name,
          personId: challenge.person_id,
          personName: challenge.person_name
        },
        returnTo: challenge.return_to ?? `/${challenge.tenant_slug}/app/function`
      };
    } catch (error) {
      await this.recordFailure(challenge, challenge.email);
      throw error;
    }
  }

  async revoke(principal: AuthPrincipal, credentialId: string): Promise<boolean> {
    return withTransaction(this.pool, async (connection) => {
      const [rows] = await connection.query<Array<RowDataPacket & { credential_id: string }>>(
        `SELECT credential_id
           FROM application_passkeys
          WHERE credential_id = ?
            AND user_id = ?
            AND tenant_id = ?
            AND status = 'ACTIVE'
          LIMIT 1
          FOR UPDATE`,
        [credentialId, principal.userId, principal.tenantId]
      );
      if (!rows[0]) return false;

      await connection.execute(
        `UPDATE application_passkeys
            SET status = 'REVOKED',
                revoked_at = UTC_TIMESTAMP(6)
          WHERE credential_id = ?
            AND user_id = ?
            AND tenant_id = ?`,
        [credentialId, principal.userId, principal.tenantId]
      );

      await authEvent(connection, {
        userId: principal.userId,
        tenantId: principal.tenantId,
        email: principal.email,
        eventType: 'PASSKEY_REVOKED',
        outcome: 'SUCCESS'
      });
      return true;
    });
  }

  private async challenge(
    tokenValue: string,
    ceremony: 'REGISTER' | 'AUTHENTICATE'
  ): Promise<ChallengeRow> {
    const token = tokenValue.trim();
    if (token.length < 32 || token.length > 256) {
      throw new PasskeyError('The passkey challenge is not valid.', 'INVALID_CHALLENGE');
    }

    const [rows] = await this.pool.query<ChallengeRow[]>(
      `SELECT c.token_hash, c.challenge, c.ceremony, c.user_id, c.tenant_id, c.person_id,
              c.rp_id, c.expected_origin, c.return_to, c.expires_at, c.consumed_at,
              c.attempt_count, u.email, t.slug AS tenant_slug, t.name AS tenant_name,
              COALESCE(p.preferred_name, p.legal_name) AS person_name
         FROM application_passkey_challenges c
         JOIN application_users u
           ON u.id = c.user_id
          AND u.status = 'ACTIVE'
         JOIN application_user_tenants ut
           ON ut.user_id = c.user_id
          AND ut.tenant_id = c.tenant_id
          AND ut.person_id = c.person_id
          AND ut.status = 'ACTIVE'
         JOIN tenants t
           ON t.id = c.tenant_id
          AND t.status = 'ACTIVE'
         JOIN persons p
           ON p.tenant_id = c.tenant_id
          AND p.id = c.person_id
          AND p.status = 'ACTIVE'
        WHERE c.token_hash = ?
          AND c.ceremony = ?
        LIMIT 1`,
      [tokenHash(token), ceremony]
    );
    const row = rows[0];

    if (!row || row.consumed_at) {
      throw new PasskeyError('The passkey challenge is not valid.', 'INVALID_CHALLENGE');
    }
    if (row.expires_at.getTime() <= Date.now()) {
      throw new PasskeyError('The passkey challenge has expired.', 'CHALLENGE_EXPIRED');
    }
    if (Number(row.attempt_count) >= MAX_ATTEMPTS) {
      throw new PasskeyError('Too many passkey attempts. Start again.', 'TOO_MANY_ATTEMPTS');
    }

    await this.assertPasskeyEnabled(row.tenant_id);
    return row;
  }

  private async assertPasskeyEnabled(tenantId: string): Promise<void> {
    const [rows] = await this.pool.query<Array<RowDataPacket & { passkey_enabled: number | boolean }>>(
      `SELECT passkey_enabled
         FROM tenant_authentication_policies
        WHERE tenant_id = ?
        LIMIT 1`,
      [tenantId]
    );

    if (!rows[0] || !Boolean(rows[0].passkey_enabled)) {
      throw new PasskeyError(
        'Passkey authentication is disabled for this Tenant.',
        'NOT_AVAILABLE'
      );
    }
  }

  private assertPrincipal(challenge: ChallengeRow, principal: AuthPrincipal): void {
    if (
      challenge.user_id !== principal.userId ||
      challenge.tenant_id !== principal.tenantId ||
      challenge.person_id !== principal.personId
    ) {
      throw new PasskeyError('The passkey challenge belongs to another identity.', 'INVALID_CHALLENGE');
    }
  }

  private async passkeyForChallenge(
    challenge: ChallengeRow,
    credentialId: string
  ): Promise<PasskeyRow> {
    const [rows] = await this.pool.query<PasskeyRow[]>(
      `SELECT credential_id, user_id, tenant_id, person_id, user_handle, display_name,
              public_key_cose, algorithm, signature_counter, transports,
              backup_eligible, backed_up, created_at, last_used_at
         FROM application_passkeys
        WHERE credential_id = ?
          AND user_id = ?
          AND tenant_id = ?
          AND status = 'ACTIVE'
        LIMIT 1`,
      [credentialId, challenge.user_id, challenge.tenant_id]
    );

    const passkey = rows[0];
    if (!passkey) {
      throw new PasskeyError('The passkey is not registered for this Tenant.', 'CREDENTIAL_NOT_FOUND');
    }
    return passkey;
  }

  private async lockUsableChallenge(
    connection: PoolConnection,
    hash: string
  ): Promise<void> {
    const [rows] = await connection.query<Array<RowDataPacket & {
      consumed_at: Date | null;
      expires_at: Date;
      attempt_count: number;
    }>>(
      `SELECT consumed_at, expires_at, attempt_count
         FROM application_passkey_challenges
        WHERE token_hash = ?
        LIMIT 1
        FOR UPDATE`,
      [hash]
    );
    const row = rows[0];

    if (
      !row ||
      row.consumed_at ||
      row.expires_at.getTime() <= Date.now() ||
      Number(row.attempt_count) >= MAX_ATTEMPTS
    ) {
      throw new PasskeyError('The passkey challenge is no longer usable.', 'INVALID_CHALLENGE');
    }
  }

  private async recordFailure(challenge: ChallengeRow, email: string): Promise<void> {
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `UPDATE application_passkey_challenges
            SET attempt_count = LEAST(attempt_count + 1, ?),
                consumed_at = CASE
                  WHEN attempt_count + 1 >= ? THEN UTC_TIMESTAMP(6)
                  ELSE consumed_at
                END
          WHERE token_hash = ?
            AND consumed_at IS NULL`,
        [MAX_ATTEMPTS, MAX_ATTEMPTS, challenge.token_hash]
      );

      await authEvent(connection, {
        userId: challenge.user_id,
        tenantId: challenge.tenant_id,
        email,
        eventType: challenge.ceremony === 'REGISTER' ? 'PASSKEY_REGISTRATION' : 'PASSKEY_LOGIN',
        outcome: 'DENIED'
      });
    });
  }
}

export const passkeyInternals = {
  decodeCbor,
  parseAuthenticatorData,
  parseClientData,
  validateCoseKey,
  verifyAssertion
};
