/**
 * Authentication related utilities for La Marzocco API
 */

import * as crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

const TOKEN_EXPIRATION = 60 * 60; // 1 hour in seconds

/**
 * Base64 encode a buffer to ASCII string
 */
function b64(data: Buffer): string {
  return data.toString("base64");
}

/**
 * Holds key material derived from installation ID
 */
export interface InstallationKey {
  secret: Buffer;
  privateKey: Buffer;
  installationId: string;
}

/**
 * Serializable format for installation key
 */
export interface InstallationKeyJSON {
  secret: string; // base64
  privateKey: string; // base64 DER format
  installationId: string;
}

/**
 * Access token response model
 */
export interface AccessToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

/**
 * Sign in token request model
 */
export interface SigninTokenRequest {
  username: string;
  password: string;
}

/**
 * Refresh token request model
 */
export interface RefreshTokenRequest {
  username: string;
  refreshToken: string;
}

/**
 * Get public key in base64-encoded DER format
 */
export function getPublicKeyB64(installationKey: InstallationKey): string {
  const keyObject = crypto.createPrivateKey({
    key: installationKey.privateKey,
    format: "der",
    type: "pkcs8",
  });

  const publicKey = crypto.createPublicKey(keyObject);
  const publicKeyDer = publicKey.export({ format: "der", type: "spki" });

  return b64(publicKeyDer);
}

/**
 * Get base string: installation_id.sha256(public_key_der_bytes)
 */
export function getBaseString(installationKey: InstallationKey): string {
  const keyObject = crypto.createPrivateKey({
    key: installationKey.privateKey,
    format: "der",
    type: "pkcs8",
  });

  const publicKey = crypto.createPublicKey(keyObject);
  const publicKeyDer = publicKey.export({ format: "der", type: "spki" });
  const pubHash = crypto.createHash("sha256").update(publicKeyDer).digest();
  const pubHashB64 = b64(pubHash);

  return `${installationKey.installationId}.${pubHashB64}`;
}

/**
 * La Marzocco's custom proof generation algorithm
 */
export function generateRequestProof(
  baseString: string,
  secret32: Buffer
): string {
  if (secret32.length !== 32) {
    throw new Error("secret must be 32 bytes");
  }

  const work = Buffer.from(secret32); // Make mutable copy

  const baseStringBytes = Buffer.from(baseString, "utf-8");
  for (const byteVal of baseStringBytes) {
    const idx = byteVal % 32;
    const shiftIdx = (idx + 1) % 32;
    const shiftAmount = work[shiftIdx] & 7; // 0-7 bit shift

    // XOR then rotate left
    const xorResult = byteVal ^ work[idx];
    const rotated = ((xorResult << shiftAmount) | (xorResult >> (8 - shiftAmount))) & 0xff;
    work[idx] = rotated;
  }

  const hash = crypto.createHash("sha256").update(work).digest();
  return b64(hash);
}

/**
 * Generate extra headers for normal API calls after authentication
 */
export function generateExtraRequestHeaders(
  installationKey: InstallationKey
): Record<string, string> {
  // Generate nonce and timestamp
  const nonce = uuidv4().toLowerCase();
  const timestamp = Date.now().toString(); // milliseconds

  // Create proof using Y5.e algorithm: installation_id.nonce.timestamp
  const proofInput = `${installationKey.installationId}.${nonce}.${timestamp}`;
  const proof = generateRequestProof(proofInput, installationKey.secret);

  // Create signature data: installation_id.nonce.timestamp.proof
  const signatureData = `${proofInput}.${proof}`;

  // Sign with ECDSA
  const keyObject = crypto.createPrivateKey({
    key: installationKey.privateKey,
    format: "der",
    type: "pkcs8",
  });

  const sign = crypto.createSign("SHA256");
  sign.update(signatureData);
  const signature = sign.sign(keyObject);
  const signatureB64 = b64(signature);

  // Return headers
  return {
    "X-App-Installation-Id": installationKey.installationId,
    "X-Timestamp": timestamp,
    "X-Nonce": nonce,
    "X-Request-Signature": signatureB64,
  };
}

/**
 * Derive secret bytes from installation ID and public key
 */
function deriveSecretBytes(installationId: string, pubDerBytes: Buffer): Buffer {
  const pubB64 = b64(pubDerBytes);
  const instHash = crypto.createHash("sha256").update(installationId, "utf-8").digest();
  const instHashB64 = b64(instHash);
  const triple = `${installationId}.${pubB64}.${instHashB64}`;
  return crypto.createHash("sha256").update(triple, "utf-8").digest(); // 32 bytes
}

/**
 * Generate the key material from installation ID
 */
export function generateInstallationKey(installationId: string): InstallationKey {
  // Generate ECDSA P-256 key pair
  const { privateKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "prime256v1", // SECP256R1 / P-256
    privateKeyEncoding: {
      type: "pkcs8",
      format: "der",
    },
    publicKeyEncoding: {
      type: "spki",
      format: "der",
    },
  });

  const keyObject = crypto.createPrivateKey({
    key: privateKey,
    format: "der",
    type: "pkcs8",
  });

  const publicKey = crypto.createPublicKey(keyObject);
  const pubBytes = publicKey.export({ format: "der", type: "spki" });

  const secretBytes = deriveSecretBytes(installationId, pubBytes as Buffer);

  return {
    installationId,
    secret: secretBytes,
    privateKey: privateKey as Buffer,
  };
}

/**
 * Serialize installation key to JSON
 */
export function installationKeyToJSON(key: InstallationKey): string {
  const obj: InstallationKeyJSON = {
    secret: b64(key.secret),
    privateKey: b64(key.privateKey),
    installationId: key.installationId,
  };
  return JSON.stringify(obj);
}

/**
 * Deserialize installation key from JSON
 */
export function installationKeyFromJSON(json: string): InstallationKey {
  const obj: InstallationKeyJSON = JSON.parse(json);
  return {
    secret: Buffer.from(obj.secret, "base64"),
    privateKey: Buffer.from(obj.privateKey, "base64"),
    installationId: obj.installationId,
  };
}

/**
 * Create an access token response with expiration time
 */
export function createAccessToken(
  accessToken: string,
  refreshToken: string
): AccessToken {
  return {
    accessToken,
    refreshToken,
    expiresAt: Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION,
  };
}

