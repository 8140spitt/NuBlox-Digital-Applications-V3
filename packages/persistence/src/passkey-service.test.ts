import {
  createHash,
  generateKeyPairSync,
  randomBytes,
  sign
} from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { PasskeyError, passkeyInternals } from './passkey-service.js';

function sha256(value: Buffer | string): Buffer {
  return createHash('sha256').update(value).digest();
}

function cborInteger(value: number): Buffer {
  const major = value >= 0 ? 0 : 1;
  const encoded = value >= 0 ? value : -1 - value;

  if (encoded < 24) return Buffer.from([(major << 5) | encoded]);
  if (encoded <= 0xff) return Buffer.from([(major << 5) | 24, encoded]);
  throw new Error('Test CBOR integer is too large.');
}

function cborBytes(value: Buffer): Buffer {
  if (value.length < 24) {
    return Buffer.concat([Buffer.from([(2 << 5) | value.length]), value]);
  }
  if (value.length <= 0xff) {
    return Buffer.concat([Buffer.from([(2 << 5) | 24, value.length]), value]);
  }
  throw new Error('Test CBOR byte string is too large.');
}

function cborMap(entries: Array<[number, Buffer]>): Buffer {
  if (entries.length >= 24) throw new Error('Test CBOR map is too large.');
  return Buffer.concat([
    Buffer.from([(5 << 5) | entries.length]),
    ...entries.flatMap(([key, value]) => [cborInteger(key), value])
  ]);
}

function es256Credential() {
  const { publicKey, privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1'
  });
  const jwk = publicKey.export({ format: 'jwk' });
  if (!jwk.x || !jwk.y) throw new Error('P-256 JWK coordinates missing.');

  const cose = cborMap([
    [1, cborInteger(2)],
    [3, cborInteger(-7)],
    [-1, cborInteger(1)],
    [-2, cborBytes(Buffer.from(jwk.x, 'base64url'))],
    [-3, cborBytes(Buffer.from(jwk.y, 'base64url'))]
  ]);

  return { privateKey, cose };
}

describe('passkey WebAuthn verification primitives', () => {
  it('verifies a user-verified ES256 assertion bound to the RP and origin', () => {
    const rpId = 'localhost';
    const origin = 'http://localhost:5173';
    const challenge = randomBytes(32).toString('base64url');
    const clientData = Buffer.from(
      JSON.stringify({
        type: 'webauthn.get',
        challenge,
        origin,
        crossOrigin: false
      })
    );

    const counter = Buffer.alloc(4);
    counter.writeUInt32BE(4);
    const authenticatorData = Buffer.concat([
      sha256(rpId),
      Buffer.from([0x05]),
      counter
    ]);

    const { privateKey, cose } = es256Credential();
    const signature = sign(
      'sha256',
      Buffer.concat([authenticatorData, sha256(clientData)]),
      privateKey
    );

    const parsedClient = passkeyInternals.parseClientData(
      clientData.toString('base64url'),
      'webauthn.get',
      challenge,
      origin
    );
    const parsedAuthenticator = passkeyInternals.parseAuthenticatorData(
      authenticatorData,
      rpId,
      false
    );

    expect(parsedClient.equals(clientData)).toBe(true);
    expect(parsedAuthenticator.counter).toBe(4);
    expect(
      passkeyInternals.verifyAssertion(
        cose,
        authenticatorData,
        clientData,
        signature
      )
    ).toBe(true);
  });

  it('extracts an attested ES256 credential during registration', () => {
    const rpId = 'nublox.com';
    const credentialId = randomBytes(32);
    const { cose } = es256Credential();
    const counter = Buffer.alloc(4);
    counter.writeUInt32BE(0);

    const credentialLength = Buffer.alloc(2);
    credentialLength.writeUInt16BE(credentialId.length);

    const authData = Buffer.concat([
      sha256(rpId),
      Buffer.from([0x45]),
      counter,
      Buffer.alloc(16),
      credentialLength,
      credentialId,
      cose
    ]);

    const parsed = passkeyInternals.parseAuthenticatorData(
      authData,
      rpId,
      true
    );

    expect(parsed.credentialId).toBe(credentialId.toString('base64url'));
    expect(parsed.publicKeyCose?.equals(cose)).toBe(true);
    expect(parsed.counter).toBe(0);
  });

  it('rejects the wrong RP ID and assertions without user verification', () => {
    const counter = Buffer.alloc(4);
    counter.writeUInt32BE(1);

    const wrongRp = Buffer.concat([
      sha256('localhost'),
      Buffer.from([0x05]),
      counter
    ]);
    expect(() =>
      passkeyInternals.parseAuthenticatorData(wrongRp, 'nublox.com', false)
    ).toThrow(PasskeyError);

    const noUserVerification = Buffer.concat([
      sha256('nublox.com'),
      Buffer.from([0x01]),
      counter
    ]);
    expect(() =>
      passkeyInternals.parseAuthenticatorData(
        noUserVerification,
        'nublox.com',
        false
      )
    ).toThrow('did not verify the user');
  });
});
