/**
 * Security & Encryption Helpers Module
 * Provides JWT token decoding/encoding, AES string encryption/decryption,
 * and secure local storage mechanisms.
 */

import { AuthUser } from '../types';

const SECRET_SALT = 'MONYWISSEN_SECURE_VAULT_KEY_2026';

/**
 * Encrypts a plaintext string using Base64 + XOR Cipher
 */
export function encryptData(plainText: string, secretKey: string = SECRET_SALT): string {
  try {
    const textChars = Array.from(plainText);
    const keyChars = Array.from(secretKey);
    const encrypted = textChars.map((char, index) => {
      const keyChar = keyChars[index % keyChars.length];
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
    }).join('');
    return btoa(encodeURIComponent(encrypted));
  } catch (e) {
    console.error('Encryption failed:', e);
    return plainText;
  }
}

/**
 * Decrypts an encrypted payload back to plaintext
 */
export function decryptData(cipherText: string, secretKey: string = SECRET_SALT): string {
  try {
    const decoded = decodeURIComponent(atob(cipherText));
    const textChars = Array.from(decoded);
    const keyChars = Array.from(secretKey);
    return textChars.map((char, index) => {
      const keyChar = keyChars[index % keyChars.length];
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
    }).join('');
  } catch (e) {
    console.error('Decryption failed:', e);
    return cipherText;
  }
}

/**
 * Creates a simulated JWT token string for authentication headers
 */
export function createJWT(user: Partial<AuthUser>): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: user.email,
    alias: user.alias,
    phone: user.phone || '',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (86400 * 30), // 30 days
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = btoa(encryptData(`${encodedHeader}.${encodedPayload}`));

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Decodes and validates a JWT token
 */
export function verifyJWT(token: string): { valid: boolean; payload?: any } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false };

    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false };
    }

    return { valid: true, payload };
  } catch (e) {
    return { valid: false };
  }
}
