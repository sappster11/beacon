import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// Get encryption key from environment, or throw error if not set
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  // Validate key is 64 hex characters (32 bytes)
  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypts a string using AES-256-GCM
 * Returns format: iv:authTag:encrypted
 */
export function encrypt(text: string): string {
  const KEY = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a string encrypted with the encrypt function
 * Expects format: iv:authTag:encrypted
 */
export function decrypt(text: string): string {
  const KEY = getEncryptionKey();
  const parts = text.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const [ivHex, authTagHex, encrypted] = parts;

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(ivHex, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generates a random encryption key (for initial setup)
 * Run this once and save the output to your .env file as ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
