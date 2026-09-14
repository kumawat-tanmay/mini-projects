const crypto = require('crypto');

// Derive a 32-byte AES-256 key using scrypt (deterministic)
const SALT = 'mini-projects-key-vault-v1'; // Fixed salt for deterministic key derivation

function deriveKey(secret) {
  return crypto.scryptSync(secret, SALT, 32);
}

function getMasterKey() {
  const secret = process.env.VAULT_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('VAULT_ENCRYPTION_KEY or JWT_SECRET environment variable is required for encryption.');
  }
  return deriveKey(secret);
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a string in the format: iv:authTag:ciphertext (all base64-encoded)
 * Safe for storage in MongoDB as a single string field.
 *
 * @param {string} plaintext - The text to encrypt (e.g., an API key)
 * @returns {string} Encrypted string in format iv:authTag:ciphertext
 */
function encrypt(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Plaintext must be a non-empty string.');
  }

  const key = getMasterKey();
  const iv = crypto.randomBytes(16); // 128-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag(); // 128-bit authentication tag

  // Format: iv:authTag:ciphertext (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt a string that was encrypted with the encrypt() function.
 * Expects format: iv:authTag:ciphertext (all base64-encoded)
 *
 * @param {string} encryptedString - The encrypted string to decrypt
 * @returns {string} The original plaintext
 */
function decrypt(encryptedString) {
  if (!encryptedString || typeof encryptedString !== 'string') {
    throw new Error('Encrypted string must be a non-empty string.');
  }

  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted string format. Expected iv:authTag:ciphertext.');
  }

  const [ivBase64, authTagBase64, ciphertext] = parts;
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');

  // Try with primary key (VAULT_ENCRYPTION_KEY or JWT_SECRET)
  const primaryKey = getMasterKey();
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', primaryKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    // If primary key failed and we have a separate JWT_SECRET, try backward-compatible fallback
    if (process.env.VAULT_ENCRYPTION_KEY && process.env.JWT_SECRET && process.env.VAULT_ENCRYPTION_KEY !== process.env.JWT_SECRET) {
      try {
        const fallbackKey = deriveKey(process.env.JWT_SECRET);
        const fallbackDecipher = crypto.createDecipheriv('aes-256-gcm', fallbackKey, iv);
        fallbackDecipher.setAuthTag(authTag);
        let fallbackDecrypted = fallbackDecipher.update(ciphertext, 'base64', 'utf8');
        fallbackDecrypted += fallbackDecipher.final('utf8');
        return fallbackDecrypted;
      } catch (fallbackErr) {
        // Fallthrough to throw original error
      }
    }
    throw err;
  }
}

module.exports = { encrypt, decrypt };
