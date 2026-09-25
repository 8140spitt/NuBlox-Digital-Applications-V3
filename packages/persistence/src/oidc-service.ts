import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createPublicKey,
  randomBytes,
  randomUUID,
  verify as verifySignature
} from 'node:crypto';
import type { JsonWebKey as NodeJsonWebKey } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import type { AuthenticationStrength, AuthPrincipal } from './auth-repository.js';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';

const LOGIN_CHALLENGE_TTL_SECONDS = 5 * 60;
const MAX_HTTP_BYTES = 1024 * 1024;
const CLOCK_SKEW_SECONDS = 60;

export type OidcProviderStatus = 'ACTIVE' | 'DISABLED';
export type OidcSessionAssurance = AuthenticationStrength;

export type OidcErrorCode =
  | 'INVALID_CONFIGURATION'
  | 'PROVIDER_NOT_FOUND'
  | 'PROVIDER_DISABLED'
  | 'DISCOVERY_FAILED'
  | 'INVALID_CHALLENGE'
  | 'CHALLENGE_EXPIRED'
  | 'TOKEN_EXCHANGE_FAILED'
  | 'INVALID_ID_TOKEN'
  | 'IDENTITY_NOT_LINKED'
  | 'UNTRUSTED_EMAIL';

export class OidcError extends Error {
  constructor(
    message: string,
    readonly code: OidcErrorCode
  ) {
    super(message);
    this.name = 'OidcError';
  }
}

export interface OidcProviderSummary {
  id: string;
  tenantId: string;
  name: string;
  issuerUrl: string;
  clientId: string;
  scopes: string;
  sessionAssurance: OidcSessionAssurance;
  emailClaim: string;
  trustEmailClaim: boolean;
  status: OidcProviderStatus;
  rowVersion: number;
}

export interface CreateOidcProviderInput {
  name: string;
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
  scopes?: string;
  sessionAssurance?: OidcSessionAssurance;
  emailClaim?: string;
  trustEmailClaim?: boolean;
}

export interface UpdateOidcProviderInput {
  name: string;
  issuerUrl: string;
  clientId: string;
  clientSecret?: string;
  scopes: string;
  sessionAssurance: OidcSessionAssurance;
  emailClaim: string;
  trustEmailClaim: boolean;
}

export interface OidcLoginStart {
  providerId: string;
  providerName: string;
  authorizationUrl: string;
  expiresAt: string;
}

export interface OidcLoginResult {
  providerId: string;
  providerName: string;
  principal: AuthPrincipal;
  returnTo: string;
  sessionAssurance: OidcSessionAssurance;
}

interface ProviderRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  name: string;
  issuer_url: string;
  issuer_hash: string;
  client_id: string;
  client_secret_ciphertext: string;
  client_secret_iv: string;
  client_secret_tag: string;
  scopes: string;
  session_assurance: OidcSessionAssurance;
  email_claim: string;
  trust_email_claim: number | boolean;
  status: OidcProviderStatus;
  row_version: string | number;
}

interface ChallengeRow extends RowDataPacket {
  state_hash: string;
  provider_id: string;
  tenant_id: string;
  nonce: string;
  code_verifier_ciphertext: string;
  code_verifier_iv: string;
  code_verifier_tag: string;
  return_to: string;
  redirect_uri: string;
  expires_at: Date;
  consumed_at: Date | null;
  attempt_count: number;
}

interface PrincipalRow extends RowDataPacket {
  user_id: string;
  email: string;
  tenant_id: string;
  tenant_slug: string;
  tenant_name: string;
  person_id: string;
  person_name: string;
}

interface FederatedRow extends PrincipalRow {
  federated_id: string;
  subject_hash: string;
}

interface DiscoveryDocument {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  token_endpoint_auth_methods_supported?: string[];
  id_token_signing_alg_values_supported?: string[];
}

interface JsonWebKeyLike {
  kty: string;
  kid?: string;
  use?: string;
  alg?: string;
  n?: string;
  e?: string;
  crv?: string;
  x?: string;
  y?: string;
}

interface JwksDocument {
  keys: JsonWebKeyLike[];
}

interface JwtHeader {
  alg?: unknown;
  kid?: unknown;
  typ?: unknown;
}

interface JwtClaims {
  iss?: unknown;
  sub?: unknown;
  aud?: unknown;
  azp?: unknown;
  exp?: unknown;
  iat?: unknown;
  nbf?: unknown;
  nonce?: unknown;
  email_verified?: unknown;
  [key: string]: unknown;
}

function authEncryptionKey(): Buffer {
  const configured = process.env.NUBLOX_AUTH_ENCRYPTION_KEY?.trim();
  if (configured) {
    const candidate = /^[0-9a-f]{64}$/i.test(configured)
      ? Buffer.from(configured, 'hex')
      : Buffer.from(configured, 'base64url');
    if (candidate.length !== 32) {
      throw new Error('NUBLOX_AUTH_ENCRYPTION_KEY must decode to exactly 32 bytes.');
    }
    return candidate;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NUBLOX_AUTH_ENCRYPTION_KEY is required in production.');
  }

  return createHash('sha256')
    .update('nublox-development-auth-encryption-key-not-for-production')
    .digest();
}

function encryptValue(value: string): {
  ciphertext: string;
  iv: string;
  tag: string;
} {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', authEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return {
    ciphertext: ciphertext.toString('base64url'),
    iv: iv.toString('base64url'),
    tag: cipher.getAuthTag().toString('base64url')
  };
}

function decryptValue(row: {
  ciphertext: string;
  iv: string;
  tag: string;
}): string {
  const decipher = createDecipheriv(
    'aes-256-gcm',
    authEncryptionKey(),
    Buffer.from(row.iv, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(row.tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(row.ciphertext, 'base64url')),
    decipher.final()
  ]).toString('utf8');
}

function sha256(value: string | Buffer): Buffer {
  return createHash('sha256').update(value).digest();
}

function sha256Hex(value: string): string {
  return sha256(value).toString('hex');
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeIssuer(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new OidcError('OIDC issuer URL is not valid.', 'INVALID_CONFIGURATION');
  }

  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new OidcError(
      'OIDC issuer URL cannot contain credentials, query parameters or fragments.',
      'INVALID_CONFIGURATION'
    );
  }

  const normalized = parsed.toString();
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
}

function normalizeScopes(value: string | undefined): string {
  const tokens = (value ?? 'openid profile email')
    .split(/\s+/u)
    .map((token) => token.trim())
    .filter(Boolean);

  if (!tokens.includes('openid')) tokens.unshift('openid');
  const unique = [...new Set(tokens)];
  if (
    unique.length === 0 ||
    unique.some((token) => !/^[A-Za-z0-9._~:/+-]{1,96}$/u.test(token))
  ) {
    throw new OidcError('OIDC scopes are not valid.', 'INVALID_CONFIGURATION');
  }

  const scopes = unique.join(' ');
  if (scopes.length > 512) {
    throw new OidcError('OIDC scopes are too long.', 'INVALID_CONFIGURATION');
  }
  return scopes;
}

function validateEmailClaim(value: string): string {
  const claim = value.trim();
  if (!/^[A-Za-z_][A-Za-z0-9_.-]{0,63}$/u.test(claim)) {
    throw new OidcError('OIDC email claim name is not valid.', 'INVALID_CONFIGURATION');
  }
  return claim;
}

function isPrivateIpv4(address: string): boolean {
  const octets = address.split('.').map(Number);
  if (
    octets.length !== 4 ||
    octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)
  ) {
    return true;
  }

  const [a = 0, b = 0, c = 0] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase().split('%')[0] ?? '';
  if (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    /^fe[89ab]/u.test(normalized) ||
    normalized.startsWith('ff') ||
    normalized.startsWith('2001:db8:')
  ) {
    return true;
  }

  const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/u);
  return mapped ? isPrivateIpv4(mapped[1]!) : false;
}

function isPrivateAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isPrivateIpv4(address);
  if (family === 6) return isPrivateIpv6(address);
  return true;
}

function localDevelopmentHost(hostname: string): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

async function assertSafeRemoteUrl(value: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new OidcError('OIDC endpoint URL is not valid.', 'INVALID_CONFIGURATION');
  }

  if (parsed.username || parsed.password || parsed.hash) {
    throw new OidcError('OIDC endpoint URL is not permitted.', 'INVALID_CONFIGURATION');
  }

  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && localDevelopmentHost(parsed.hostname))) {
    throw new OidcError(
      'OIDC endpoints must use HTTPS outside local development.',
      'INVALID_CONFIGURATION'
    );
  }

  if (localDevelopmentHost(parsed.hostname)) return parsed;

  const literalFamily = isIP(parsed.hostname);
  if (literalFamily !== 0) {
    if (isPrivateAddress(parsed.hostname)) {
      throw new OidcError('OIDC endpoint cannot target a private network.', 'INVALID_CONFIGURATION');
    }
    return parsed;
  }

  const addresses = await lookup(parsed.hostname, {
    all: true,
    verbatim: true
  }).catch(() => {
    throw new OidcError(
      'OIDC endpoint host could not be resolved.',
      'DISCOVERY_FAILED'
    );
  });

  if (addresses.length === 0 || addresses.some((entry) => isPrivateAddress(entry.address))) {
    throw new OidcError('OIDC endpoint cannot target a private network.', 'INVALID_CONFIGURATION');
  }

  return parsed;
}

async function fetchLimited(
  url: string,
  init: RequestInit = {}
): Promise<{ response: Response; text: string }> {
  await assertSafeRemoteUrl(url);

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      redirect: 'error',
      signal: AbortSignal.timeout(8_000),
      headers: {
        accept: 'application/json',
        ...(init.headers ?? {})
      }
    });
  } catch {
    throw new OidcError('OIDC provider could not be reached securely.', 'DISCOVERY_FAILED');
  }

  const contentLength = Number(response.headers.get('content-length') ?? 0);
  if (contentLength > MAX_HTTP_BYTES) {
    throw new OidcError('OIDC provider response is too large.', 'DISCOVERY_FAILED');
  }

  const text = await response.text();
  if (Buffer.byteLength(text, 'utf8') > MAX_HTTP_BYTES) {
    throw new OidcError('OIDC provider response is too large.', 'DISCOVERY_FAILED');
  }

  return { response, text };
}

async function fetchJson<T>(url: string): Promise<T> {
  const { response, text } = await fetchLimited(url);
  if (!response.ok) {
    throw new OidcError(
      `OIDC provider returned HTTP ${response.status}.`,
      'DISCOVERY_FAILED'
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new OidcError('OIDC provider returned invalid JSON.', 'DISCOVERY_FAILED');
  }
}

async function discoverProvider(issuerValue: string): Promise<DiscoveryDocument> {
  const issuer = normalizeIssuer(issuerValue);
  await assertSafeRemoteUrl(issuer);

  const discovery = await fetchJson<Partial<DiscoveryDocument>>(
    `${issuer}/.well-known/openid-configuration`
  );

  if (
    typeof discovery.issuer !== 'string' ||
    normalizeIssuer(discovery.issuer) !== issuer ||
    typeof discovery.authorization_endpoint !== 'string' ||
    typeof discovery.token_endpoint !== 'string' ||
    typeof discovery.jwks_uri !== 'string'
  ) {
    throw new OidcError(
      'OIDC discovery metadata does not match the configured issuer.',
      'INVALID_CONFIGURATION'
    );
  }

  await Promise.all([
    assertSafeRemoteUrl(discovery.authorization_endpoint),
    assertSafeRemoteUrl(discovery.token_endpoint),
    assertSafeRemoteUrl(discovery.jwks_uri)
  ]);

  if (
    discovery.id_token_signing_alg_values_supported &&
    !discovery.id_token_signing_alg_values_supported.some(
      (algorithm) => algorithm === 'RS256' || algorithm === 'ES256'
    )
  ) {
    throw new OidcError(
      'OIDC provider does not advertise a supported ID-token signing algorithm.',
      'INVALID_CONFIGURATION'
    );
  }

  return discovery as DiscoveryDocument;
}

function publicOrigin(): string {
  const configured = process.env.NUBLOX_PUBLIC_ORIGIN?.trim();
  const fallback = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173';
  const value = configured || fallback;
  if (!value) {
    throw new OidcError('NUBLOX_PUBLIC_ORIGIN is required for OIDC.', 'INVALID_CONFIGURATION');
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new OidcError('NUBLOX_PUBLIC_ORIGIN is not a valid URL.', 'INVALID_CONFIGURATION');
  }

  if (
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    parsed.pathname !== '/'
  ) {
    throw new OidcError(
      'NUBLOX_PUBLIC_ORIGIN must contain only scheme, host and optional port.',
      'INVALID_CONFIGURATION'
    );
  }

  if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
    throw new OidcError('NUBLOX_PUBLIC_ORIGIN must use HTTPS in production.', 'INVALID_CONFIGURATION');
  }

  return parsed.origin;
}

function callbackUri(tenantSlug: string, providerId: string): string {
  return `${publicOrigin()}/${encodeURIComponent(tenantSlug)}/app/auth/oidc/${encodeURIComponent(providerId)}/callback`;
}

function mapProvider(row: ProviderRow): OidcProviderSummary {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    issuerUrl: row.issuer_url,
    clientId: row.client_id,
    scopes: row.scopes,
    sessionAssurance: row.session_assurance,
    emailClaim: row.email_claim,
    trustEmailClaim: Boolean(row.trust_email_claim),
    status: row.status,
    rowVersion: Number(row.row_version)
  };
}

function validateProviderInput(input: {
  name: string;
  issuerUrl: string;
  clientId: string;
  clientSecret?: string;
  scopes?: string;
  sessionAssurance?: OidcSessionAssurance;
  emailClaim?: string;
}): {
  name: string;
  issuerUrl: string;
  clientId: string;
  clientSecret?: string;
  scopes: string;
  sessionAssurance: OidcSessionAssurance;
  emailClaim: string;
} {
  const name = input.name.trim();
  const clientId = input.clientId.trim();
  const clientSecret = input.clientSecret?.trim();
  const assurance = input.sessionAssurance ?? 'PASSWORD';

  if (name.length < 2 || name.length > 120) {
    throw new OidcError('OIDC provider name must contain 2 to 120 characters.', 'INVALID_CONFIGURATION');
  }
  if (!clientId || clientId.length > 255) {
    throw new OidcError('OIDC client ID is required and must not exceed 255 characters.', 'INVALID_CONFIGURATION');
  }
  if (clientSecret !== undefined && (clientSecret.length < 1 || clientSecret.length > 4096)) {
    throw new OidcError('OIDC client secret is not valid.', 'INVALID_CONFIGURATION');
  }
  if (assurance !== 'PASSWORD' && assurance !== 'MFA') {
    throw new OidcError('OIDC session assurance is not valid.', 'INVALID_CONFIGURATION');
  }

  return {
    name,
    issuerUrl: normalizeIssuer(input.issuerUrl),
    clientId,
    ...(clientSecret !== undefined ? { clientSecret } : {}),
    scopes: normalizeScopes(input.scopes),
    sessionAssurance: assurance,
    emailClaim: validateEmailClaim(input.emailClaim ?? 'email')
  };
}

async function writeProviderAudit(
  connection: PoolConnection,
  input: {
    tenantId: string;
    actorPersonId: string;
    providerId: string;
    action: string;
    payload: unknown;
  }
): Promise<void> {
  await connection.execute(
    `INSERT INTO kernel_audit_entries
      (tenant_id, entity_type, entity_id, action, actor_person_id, correlation_id, payload)
     VALUES (?, 'OIDC_PROVIDER', ?, ?, ?, ?, ?)`,
    [
      input.tenantId,
      input.providerId,
      input.action,
      input.actorPersonId,
      `OIDC:${input.providerId}`,
      JSON.stringify(input.payload)
    ]
  );

  await writeOutboxEvent(connection, {
    tenantId: input.tenantId,
    aggregateType: 'OIDC_PROVIDER',
    aggregateId: input.providerId,
    eventType: `OIDC_PROVIDER.${input.action}`,
    payload: input.payload
  });
}

async function writeAuthEvent(
  connection: PoolConnection,
  input: {
    userId?: string;
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
      input.userId ?? null,
      input.tenantId,
      input.email ? normalizeEmail(input.email) : null,
      input.eventType,
      input.outcome,
      input.metadata ? JSON.stringify(input.metadata) : null
    ]
  );
}

function decodeJwtPart<T>(value: string): T {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
  } catch {
    throw new OidcError('OIDC ID token is malformed.', 'INVALID_ID_TOKEN');
  }
}

function numberClaim(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringClaim(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

async function verifyIdToken(
  token: string,
  provider: ProviderRow,
  discovery: DiscoveryDocument,
  nonce: string
): Promise<JwtClaims> {
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => !part)) {
    throw new OidcError('OIDC ID token is malformed.', 'INVALID_ID_TOKEN');
  }

  const [headerPart, payloadPart, signaturePart] = parts as [string, string, string];
  const header = decodeJwtPart<JwtHeader>(headerPart);
  const claims = decodeJwtPart<JwtClaims>(payloadPart);
  const algorithm = typeof header.alg === 'string' ? header.alg : '';

  if (algorithm !== 'RS256' && algorithm !== 'ES256') {
    throw new OidcError('OIDC ID-token signing algorithm is not accepted.', 'INVALID_ID_TOKEN');
  }
  if (
    discovery.id_token_signing_alg_values_supported &&
    !discovery.id_token_signing_alg_values_supported.includes(algorithm)
  ) {
    throw new OidcError('OIDC ID-token signing algorithm was not advertised.', 'INVALID_ID_TOKEN');
  }

  const jwks = await fetchJson<Partial<JwksDocument>>(discovery.jwks_uri);
  if (!Array.isArray(jwks.keys) || jwks.keys.length === 0) {
    throw new OidcError('OIDC signing keys are unavailable.', 'INVALID_ID_TOKEN');
  }

  const kid = typeof header.kid === 'string' ? header.kid : null;
  const candidates = jwks.keys.filter((key) => {
    if (!key || typeof key !== 'object' || typeof key.kty !== 'string') return false;
    if (kid && key.kid !== kid) return false;
    if (key.use && key.use !== 'sig') return false;
    if (key.alg && key.alg !== algorithm) return false;
    return algorithm === 'RS256' ? key.kty === 'RSA' : key.kty === 'EC' && key.crv === 'P-256';
  });

  if (candidates.length !== 1) {
    throw new OidcError('OIDC signing key could not be selected unambiguously.', 'INVALID_ID_TOKEN');
  }

  let publicKey;
  try {
    publicKey = createPublicKey({
      key: candidates[0]! as unknown as NodeJsonWebKey,
      format: 'jwk'
    });
  } catch {
    throw new OidcError('OIDC signing key is invalid.', 'INVALID_ID_TOKEN');
  }

  const signingInput = Buffer.from(`${headerPart}.${payloadPart}`);
  const signature = Buffer.from(signaturePart, 'base64url');
  const valid =
    algorithm === 'RS256'
      ? verifySignature('RSA-SHA256', signingInput, publicKey, signature)
      : verifySignature(
          'sha256',
          signingInput,
          { key: publicKey, dsaEncoding: 'ieee-p1363' },
          signature
        );

  if (!valid) {
    throw new OidcError('OIDC ID-token signature is invalid.', 'INVALID_ID_TOKEN');
  }

  if (stringClaim(claims.iss) !== provider.issuer_url) {
    throw new OidcError('OIDC issuer claim does not match the provider.', 'INVALID_ID_TOKEN');
  }

  const audiences = Array.isArray(claims.aud)
    ? claims.aud.filter((value): value is string => typeof value === 'string')
    : typeof claims.aud === 'string'
      ? [claims.aud]
      : [];
  if (!audiences.includes(provider.client_id)) {
    throw new OidcError('OIDC audience claim does not include this client.', 'INVALID_ID_TOKEN');
  }
  if (audiences.length > 1 && stringClaim(claims.azp) !== provider.client_id) {
    throw new OidcError('OIDC authorised-party claim is invalid.', 'INVALID_ID_TOKEN');
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = numberClaim(claims.exp);
  if (exp === null || exp < now - CLOCK_SKEW_SECONDS) {
    throw new OidcError('OIDC ID token has expired.', 'INVALID_ID_TOKEN');
  }

  const nbf = numberClaim(claims.nbf);
  if (nbf !== null && nbf > now + CLOCK_SKEW_SECONDS) {
    throw new OidcError('OIDC ID token is not valid yet.', 'INVALID_ID_TOKEN');
  }

  const iat = numberClaim(claims.iat);
  if (iat !== null && iat > now + CLOCK_SKEW_SECONDS) {
    throw new OidcError('OIDC ID token issue time is invalid.', 'INVALID_ID_TOKEN');
  }

  if (stringClaim(claims.nonce) !== nonce) {
    throw new OidcError('OIDC nonce claim is invalid.', 'INVALID_ID_TOKEN');
  }

  const subject = stringClaim(claims.sub);
  if (!subject || subject.length > 512) {
    throw new OidcError('OIDC subject claim is invalid.', 'INVALID_ID_TOKEN');
  }

  return claims;
}

export class MySqlOidcService {
  constructor(private readonly pool: Pool) {}

  async listProviders(
    tenantId: string,
    activeOnly = false
  ): Promise<OidcProviderSummary[]> {
    const [rows] = await this.pool.query<ProviderRow[]>(
      `SELECT id, tenant_id, name, issuer_url, issuer_hash, client_id,
              client_secret_ciphertext, client_secret_iv, client_secret_tag,
              scopes, session_assurance, email_claim, trust_email_claim, status, row_version
         FROM application_oidc_providers
        WHERE tenant_id = ?
          ${activeOnly ? "AND status = 'ACTIVE'" : ''}
        ORDER BY name ASC`,
      [tenantId]
    );
    return rows.map(mapProvider);
  }

  async createProvider(
    tenantId: string,
    actorPersonId: string,
    input: CreateOidcProviderInput
  ): Promise<OidcProviderSummary> {
    const validated = validateProviderInput(input);
    if (!validated.clientSecret) {
      throw new OidcError('OIDC client secret is required.', 'INVALID_CONFIGURATION');
    }
    await discoverProvider(validated.issuerUrl);

    const encrypted = encryptValue(validated.clientSecret);
    const providerId = `OIDC-${randomUUID()}`;
    const provider: OidcProviderSummary = {
      id: providerId,
      tenantId,
      name: validated.name,
      issuerUrl: validated.issuerUrl,
      clientId: validated.clientId,
      scopes: validated.scopes,
      sessionAssurance: validated.sessionAssurance,
      emailClaim: validated.emailClaim,
      trustEmailClaim: Boolean(input.trustEmailClaim),
      status: 'ACTIVE',
      rowVersion: 1
    };

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO application_oidc_providers
          (id, tenant_id, name, issuer_url, issuer_hash, client_id,
           client_secret_ciphertext, client_secret_iv, client_secret_tag,
           scopes, session_assurance, email_claim, trust_email_claim, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
        [
          providerId,
          tenantId,
          provider.name,
          provider.issuerUrl,
          sha256Hex(provider.issuerUrl),
          provider.clientId,
          encrypted.ciphertext,
          encrypted.iv,
          encrypted.tag,
          provider.scopes,
          provider.sessionAssurance,
          provider.emailClaim,
          provider.trustEmailClaim,
          actorPersonId,
          actorPersonId
        ]
      );

      await writeProviderAudit(connection, {
        tenantId,
        actorPersonId,
        providerId,
        action: 'CREATED',
        payload: provider
      });
    });

    return provider;
  }

  async updateProvider(
    tenantId: string,
    actorPersonId: string,
    providerId: string,
    input: UpdateOidcProviderInput
  ): Promise<OidcProviderSummary> {
    const validated = validateProviderInput(input);
    await discoverProvider(validated.issuerUrl);

    return withTransaction(this.pool, async (connection) => {
      const [rows] = await connection.query<ProviderRow[]>(
        `SELECT id, tenant_id, name, issuer_url, issuer_hash, client_id,
                client_secret_ciphertext, client_secret_iv, client_secret_tag,
                scopes, session_assurance, email_claim, trust_email_claim, status, row_version
           FROM application_oidc_providers
          WHERE id = ?
            AND tenant_id = ?
          LIMIT 1
          FOR UPDATE`,
        [providerId, tenantId]
      );
      const current = rows[0];
      if (!current) throw new OidcError('OIDC provider not found.', 'PROVIDER_NOT_FOUND');

      const encrypted = validated.clientSecret
        ? encryptValue(validated.clientSecret)
        : {
            ciphertext: current.client_secret_ciphertext,
            iv: current.client_secret_iv,
            tag: current.client_secret_tag
          };

      await connection.execute(
        `UPDATE application_oidc_providers
            SET name = ?,
                issuer_url = ?,
                issuer_hash = ?,
                client_id = ?,
                client_secret_ciphertext = ?,
                client_secret_iv = ?,
                client_secret_tag = ?,
                scopes = ?,
                session_assurance = ?,
                email_claim = ?,
                trust_email_claim = ?,
                updated_by_person_id = ?,
                row_version = row_version + 1
          WHERE id = ?
            AND tenant_id = ?`,
        [
          validated.name,
          validated.issuerUrl,
          sha256Hex(validated.issuerUrl),
          validated.clientId,
          encrypted.ciphertext,
          encrypted.iv,
          encrypted.tag,
          validated.scopes,
          validated.sessionAssurance,
          validated.emailClaim,
          input.trustEmailClaim,
          actorPersonId,
          providerId,
          tenantId
        ]
      );

      const next: OidcProviderSummary = {
        id: providerId,
        tenantId,
        name: validated.name,
        issuerUrl: validated.issuerUrl,
        clientId: validated.clientId,
        scopes: validated.scopes,
        sessionAssurance: validated.sessionAssurance,
        emailClaim: validated.emailClaim,
        trustEmailClaim: input.trustEmailClaim,
        status: current.status,
        rowVersion: Number(current.row_version) + 1
      };

      await writeProviderAudit(connection, {
        tenantId,
        actorPersonId,
        providerId,
        action: 'UPDATED',
        payload: next
      });
      return next;
    });
  }

  async setProviderStatus(
    tenantId: string,
    actorPersonId: string,
    providerId: string,
    status: OidcProviderStatus
  ): Promise<boolean> {
    if (status !== 'ACTIVE' && status !== 'DISABLED') {
      throw new OidcError('OIDC provider status is invalid.', 'INVALID_CONFIGURATION');
    }

    return withTransaction(this.pool, async (connection) => {
      const [rows] = await connection.query<ProviderRow[]>(
        `SELECT id, tenant_id, name, issuer_url, issuer_hash, client_id,
                client_secret_ciphertext, client_secret_iv, client_secret_tag,
                scopes, session_assurance, email_claim, trust_email_claim, status, row_version
           FROM application_oidc_providers
          WHERE id = ?
            AND tenant_id = ?
          LIMIT 1
          FOR UPDATE`,
        [providerId, tenantId]
      );
      const current = rows[0];
      if (!current) return false;

      await connection.execute(
        `UPDATE application_oidc_providers
            SET status = ?,
                updated_by_person_id = ?,
                row_version = row_version + 1
          WHERE id = ?
            AND tenant_id = ?`,
        [status, actorPersonId, providerId, tenantId]
      );

      if (status === 'DISABLED') {
        await connection.execute(
          `UPDATE application_sessions
              SET revoked_at = COALESCE(revoked_at, UTC_TIMESTAMP(6))
            WHERE tenant_id = ?
              AND authentication_provider_id = ?
              AND revoked_at IS NULL`,
          [tenantId, providerId]
        );
        await connection.execute(
          `UPDATE application_oidc_login_challenges
              SET consumed_at = COALESCE(consumed_at, UTC_TIMESTAMP(6))
            WHERE tenant_id = ?
              AND provider_id = ?
              AND consumed_at IS NULL`,
          [tenantId, providerId]
        );
      }

      await writeProviderAudit(connection, {
        tenantId,
        actorPersonId,
        providerId,
        action: status === 'ACTIVE' ? 'ENABLED' : 'DISABLED',
        payload: {
          providerId,
          status,
          previousStatus: current.status
        }
      });
      return true;
    });
  }

  async beginLogin(
    tenantId: string,
    tenantSlug: string,
    providerId: string,
    returnTo: string
  ): Promise<OidcLoginStart> {
    const provider = await this.provider(tenantId, providerId, true);
    const discovery = await discoverProvider(provider.issuer_url);
    const state = randomBytes(32).toString('base64url');
    const nonce = randomBytes(32).toString('base64url');
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = sha256(codeVerifier).toString('base64url');
    const encryptedVerifier = encryptValue(codeVerifier);
    const redirectUri = callbackUri(tenantSlug, providerId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + LOGIN_CHALLENGE_TTL_SECONDS * 1000);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `DELETE FROM application_oidc_login_challenges
          WHERE expires_at <= UTC_TIMESTAMP(6)
             OR consumed_at < UTC_TIMESTAMP(6) - INTERVAL 1 DAY`
      );

      await connection.execute(
        `INSERT INTO application_oidc_login_challenges
          (state_hash, provider_id, tenant_id, nonce,
           code_verifier_ciphertext, code_verifier_iv, code_verifier_tag,
           return_to, redirect_uri, created_at, expires_at, attempt_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          sha256Hex(state),
          providerId,
          tenantId,
          nonce,
          encryptedVerifier.ciphertext,
          encryptedVerifier.iv,
          encryptedVerifier.tag,
          returnTo.slice(0, 1024),
          redirectUri,
          now,
          expiresAt
        ]
      );
    });

    const authorizationUrl = new URL(discovery.authorization_endpoint);
    authorizationUrl.searchParams.set('client_id', provider.client_id);
    authorizationUrl.searchParams.set('response_type', 'code');
    authorizationUrl.searchParams.set('redirect_uri', redirectUri);
    authorizationUrl.searchParams.set('scope', provider.scopes);
    authorizationUrl.searchParams.set('state', state);
    authorizationUrl.searchParams.set('nonce', nonce);
    authorizationUrl.searchParams.set('code_challenge', codeChallenge);
    authorizationUrl.searchParams.set('code_challenge_method', 'S256');

    return {
      providerId,
      providerName: provider.name,
      authorizationUrl: authorizationUrl.toString(),
      expiresAt: expiresAt.toISOString()
    };
  }

  async completeLogin(
    tenantId: string,
    providerId: string,
    stateValue: string,
    codeValue: string
  ): Promise<OidcLoginResult> {
    const state = stateValue.trim();
    const code = codeValue.trim();
    if (!state || state.length > 512 || !code || code.length > 8192) {
      throw new OidcError('OIDC callback is not valid.', 'INVALID_CHALLENGE');
    }

    const provider = await this.provider(tenantId, providerId, true);
    const challenge = await this.consumeChallenge(tenantId, providerId, state);
    const discovery = await discoverProvider(provider.issuer_url);
    const codeVerifier = decryptValue({
      ciphertext: challenge.code_verifier_ciphertext,
      iv: challenge.code_verifier_iv,
      tag: challenge.code_verifier_tag
    });

    const tokenResponse = await this.exchangeCode(
      provider,
      discovery,
      code,
      challenge.redirect_uri,
      codeVerifier
    );
    const claims = await verifyIdToken(
      tokenResponse.idToken,
      provider,
      discovery,
      challenge.nonce
    );
    const subject = stringClaim(claims.sub)!;
    const principal = await this.resolveFederatedPrincipal(provider, subject, claims);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `UPDATE application_federated_identities
            SET last_login_at = UTC_TIMESTAMP(6)
          WHERE provider_id = ?
            AND tenant_id = ?
            AND user_id = ?`,
        [provider.id, provider.tenant_id, principal.userId]
      );

      await writeAuthEvent(connection, {
        userId: principal.userId,
        tenantId: provider.tenant_id,
        email: principal.email,
        eventType: 'OIDC_LOGIN',
        outcome: 'SUCCESS',
        metadata: {
          providerId: provider.id,
          sessionAssurance: provider.session_assurance
        }
      });
    });

    return {
      providerId: provider.id,
      providerName: provider.name,
      principal,
      returnTo: challenge.return_to,
      sessionAssurance: provider.session_assurance
    };
  }

  private async provider(
    tenantId: string,
    providerId: string,
    requireActive: boolean
  ): Promise<ProviderRow> {
    const [rows] = await this.pool.query<ProviderRow[]>(
      `SELECT id, tenant_id, name, issuer_url, issuer_hash, client_id,
              client_secret_ciphertext, client_secret_iv, client_secret_tag,
              scopes, session_assurance, email_claim, trust_email_claim, status, row_version
         FROM application_oidc_providers
        WHERE id = ?
          AND tenant_id = ?
        LIMIT 1`,
      [providerId, tenantId]
    );
    const provider = rows[0];
    if (!provider) throw new OidcError('OIDC provider not found.', 'PROVIDER_NOT_FOUND');
    if (requireActive && provider.status !== 'ACTIVE') {
      throw new OidcError('OIDC provider is disabled.', 'PROVIDER_DISABLED');
    }
    return provider;
  }

  private async consumeChallenge(
    tenantId: string,
    providerId: string,
    state: string
  ): Promise<ChallengeRow> {
    return withTransaction(this.pool, async (connection) => {
      const [rows] = await connection.query<ChallengeRow[]>(
        `SELECT state_hash, provider_id, tenant_id, nonce,
                code_verifier_ciphertext, code_verifier_iv, code_verifier_tag,
                return_to, redirect_uri, expires_at, consumed_at, attempt_count
           FROM application_oidc_login_challenges
          WHERE state_hash = ?
            AND provider_id = ?
            AND tenant_id = ?
          LIMIT 1
          FOR UPDATE`,
        [sha256Hex(state), providerId, tenantId]
      );
      const challenge = rows[0];

      if (!challenge || challenge.consumed_at) {
        throw new OidcError('OIDC login challenge is not valid.', 'INVALID_CHALLENGE');
      }
      if (challenge.expires_at.getTime() <= Date.now()) {
        throw new OidcError('OIDC login challenge has expired.', 'CHALLENGE_EXPIRED');
      }

      await connection.execute(
        `UPDATE application_oidc_login_challenges
            SET consumed_at = UTC_TIMESTAMP(6),
                attempt_count = attempt_count + 1
          WHERE state_hash = ?`,
        [challenge.state_hash]
      );
      return challenge;
    });
  }

  private async exchangeCode(
    provider: ProviderRow,
    discovery: DiscoveryDocument,
    code: string,
    redirectUri: string,
    codeVerifier: string
  ): Promise<{ idToken: string }> {
    const clientSecret = decryptValue({
      ciphertext: provider.client_secret_ciphertext,
      iv: provider.client_secret_iv,
      tag: provider.client_secret_tag
    });
    const methods = discovery.token_endpoint_auth_methods_supported ?? ['client_secret_basic'];
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    });
    const headers: Record<string, string> = {
      'content-type': 'application/x-www-form-urlencoded'
    };

    if (methods.includes('client_secret_basic')) {
      const encodedClient = encodeURIComponent(provider.client_id);
      const encodedSecret = encodeURIComponent(clientSecret);
      headers.authorization = `Basic ${Buffer.from(`${encodedClient}:${encodedSecret}`).toString('base64')}`;
    } else if (methods.includes('client_secret_post')) {
      body.set('client_id', provider.client_id);
      body.set('client_secret', clientSecret);
    } else {
      throw new OidcError(
        'OIDC provider does not support an accepted client authentication method.',
        'INVALID_CONFIGURATION'
      );
    }

    const { response, text } = await fetchLimited(discovery.token_endpoint, {
      method: 'POST',
      headers,
      body: body.toString()
    });

    if (!response.ok) {
      throw new OidcError(
        `OIDC token exchange failed with HTTP ${response.status}.`,
        'TOKEN_EXCHANGE_FAILED'
      );
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new OidcError('OIDC token endpoint returned invalid JSON.', 'TOKEN_EXCHANGE_FAILED');
    }

    const idToken = stringClaim(payload.id_token);
    if (!idToken || idToken.length > 32_768) {
      throw new OidcError('OIDC token response did not include a valid ID token.', 'TOKEN_EXCHANGE_FAILED');
    }
    return { idToken };
  }

  private async resolveFederatedPrincipal(
    provider: ProviderRow,
    subject: string,
    claims: JwtClaims
  ): Promise<AuthPrincipal> {
    const subjectHash = sha256Hex(subject);

    const [linkedRows] = await this.pool.query<FederatedRow[]>(
      `SELECT fi.id AS federated_id, fi.subject_hash,
              u.id AS user_id, u.email,
              ut.tenant_id, t.slug AS tenant_slug, t.name AS tenant_name,
              ut.person_id, COALESCE(p.preferred_name, p.legal_name) AS person_name
         FROM application_federated_identities fi
         JOIN application_users u
           ON u.id = fi.user_id
          AND u.status = 'ACTIVE'
         JOIN application_user_tenants ut
           ON ut.user_id = fi.user_id
          AND ut.tenant_id = fi.tenant_id
          AND ut.person_id = fi.person_id
          AND ut.status = 'ACTIVE'
         JOIN tenants t
           ON t.id = ut.tenant_id
          AND t.status = 'ACTIVE'
         JOIN persons p
           ON p.tenant_id = ut.tenant_id
          AND p.id = ut.person_id
          AND p.status = 'ACTIVE'
        WHERE fi.provider_id = ?
          AND fi.tenant_id = ?
          AND fi.subject_hash = ?
        LIMIT 1`,
      [provider.id, provider.tenant_id, subjectHash]
    );
    const linked = linkedRows[0];
    if (linked) return this.principalFromRow(linked);

    const emailValue = claims[provider.email_claim];
    const email = typeof emailValue === 'string' ? normalizeEmail(emailValue) : '';
    if (!email || !email.includes('@') || email.length > 320) {
      throw new OidcError(
        'OIDC identity is not linked and did not provide a usable employee email.',
        'IDENTITY_NOT_LINKED'
      );
    }

    if (!Boolean(provider.trust_email_claim) && claims.email_verified !== true) {
      throw new OidcError(
        'OIDC provider email claim is not verified for automatic identity linking.',
        'UNTRUSTED_EMAIL'
      );
    }

    return withTransaction(this.pool, async (connection) => {
      const [membershipRows] = await connection.query<PrincipalRow[]>(
        `SELECT u.id AS user_id, u.email,
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
          LIMIT 2
          FOR UPDATE`,
        [provider.tenant_id, email]
      );

      if (membershipRows.length !== 1) {
        throw new OidcError(
          'OIDC identity does not map to exactly one active NuBlox employee identity.',
          'IDENTITY_NOT_LINKED'
        );
      }

      const principal = membershipRows[0]!;
      const [existingMembershipLinks] = await connection.query<Array<RowDataPacket & {
        subject_hash: string;
      }>>(
        `SELECT subject_hash
           FROM application_federated_identities
          WHERE provider_id = ?
            AND tenant_id = ?
            AND user_id = ?
          LIMIT 1
          FOR UPDATE`,
        [provider.id, provider.tenant_id, principal.user_id]
      );

      if (
        existingMembershipLinks[0] &&
        existingMembershipLinks[0].subject_hash !== subjectHash
      ) {
        throw new OidcError(
          'This NuBlox identity is already linked to another subject at this provider.',
          'IDENTITY_NOT_LINKED'
        );
      }

      const federatedId = `FED-${randomUUID()}`;
      await connection.execute(
        `INSERT INTO application_federated_identities
          (id, provider_id, tenant_id, subject, subject_hash, user_id, person_id, email_at_link)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          federatedId,
          provider.id,
          provider.tenant_id,
          subject,
          subjectHash,
          principal.user_id,
          principal.person_id,
          email
        ]
      );

      await writeAuthEvent(connection, {
        userId: principal.user_id,
        tenantId: provider.tenant_id,
        email: principal.email,
        eventType: 'OIDC_IDENTITY_LINKED',
        outcome: 'SUCCESS',
        metadata: { providerId: provider.id }
      });

      return this.principalFromRow(principal);
    });
  }

  private principalFromRow(row: PrincipalRow): AuthPrincipal {
    return {
      userId: row.user_id,
      email: row.email,
      tenantId: row.tenant_id,
      tenantSlug: row.tenant_slug,
      tenantName: row.tenant_name,
      personId: row.person_id,
      personName: row.person_name
    };
  }
}

export const oidcInternals = {
  normalizeIssuer,
  normalizeScopes,
  isPrivateAddress,
  validateEmailClaim,
  verifyIdToken
};
