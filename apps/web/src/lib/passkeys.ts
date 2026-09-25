export interface PasskeyCredentialPayload {
  id: string;
  rawId: string;
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

function fromBase64Url(value: string): ArrayBuffer {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function toBase64Url(value: ArrayBuffer): string {
  const bytes = new Uint8Array(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

export function browserSupportsPasskeys(): boolean {
  return typeof window !== 'undefined' &&
    typeof PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials?.create === 'function' &&
    typeof navigator.credentials?.get === 'function';
}

export async function createPasskey(
  options: {
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
): Promise<PasskeyCredentialPayload> {
  const credential = await navigator.credentials.create({
    publicKey: {
      ...options,
      challenge: fromBase64Url(options.challenge),
      user: {
        ...options.user,
        id: fromBase64Url(options.user.id)
      },
      pubKeyCredParams: options.pubKeyCredParams as PublicKeyCredentialParameters[],
      excludeCredentials: options.excludeCredentials.map((item) => ({
        type: 'public-key',
        id: fromBase64Url(item.id),
        ...(item.transports
          ? { transports: item.transports as AuthenticatorTransport[] }
          : {})
      }))
    }
  });

  if (!(credential instanceof PublicKeyCredential)) {
    throw new Error('The browser did not return a WebAuthn credential.');
  }

  const response = credential.response;
  if (!(response instanceof AuthenticatorAttestationResponse)) {
    throw new Error('The browser did not return passkey attestation data.');
  }

  return {
    id: credential.id,
    rawId: toBase64Url(credential.rawId),
    type: 'public-key',
    response: {
      clientDataJSON: toBase64Url(response.clientDataJSON),
      attestationObject: toBase64Url(response.attestationObject),
      transports:
        typeof response.getTransports === 'function'
          ? response.getTransports()
          : []
    }
  };
}

export async function getPasskey(
  options: {
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
): Promise<PasskeyCredentialPayload> {
  const credential = await navigator.credentials.get({
    publicKey: {
      ...options,
      challenge: fromBase64Url(options.challenge),
      allowCredentials: options.allowCredentials.map((item) => ({
        type: 'public-key',
        id: fromBase64Url(item.id),
        ...(item.transports
          ? { transports: item.transports as AuthenticatorTransport[] }
          : {})
      }))
    }
  });

  if (!(credential instanceof PublicKeyCredential)) {
    throw new Error('The browser did not return a WebAuthn assertion.');
  }

  const response = credential.response;
  if (!(response instanceof AuthenticatorAssertionResponse)) {
    throw new Error('The browser did not return passkey assertion data.');
  }

  return {
    id: credential.id,
    rawId: toBase64Url(credential.rawId),
    type: 'public-key',
    response: {
      clientDataJSON: toBase64Url(response.clientDataJSON),
      authenticatorData: toBase64Url(response.authenticatorData),
      signature: toBase64Url(response.signature),
      userHandle: response.userHandle ? toBase64Url(response.userHandle) : null
    }
  };
}
