const crypto = require('crypto');

function getEncryptionKey() {
  const value = process.env.SELLER_PAYMENT_ENCRYPTION_KEY;
  if (!value) {
    throw new Error('SELLER_PAYMENT_ENCRYPTION_KEY is required to store seller payment credentials');
  }

  const key = Buffer.from(value, 'base64');
  if (key.length !== 32 || key.toString('base64') !== value) {
    throw new Error('SELLER_PAYMENT_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
  }
  return key;
}

function encryptSellerSecret(secret) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((value) => value.toString('base64url')).join('.');
}

function decryptSellerSecret(encrypted) {
  const parts = typeof encrypted === 'string' ? encrypted.split('.') : [];
  if (parts.length !== 3) throw new Error('Stored seller payment credential is invalid');

  const [iv, tag, ciphertext] = parts.map((part) => Buffer.from(part, 'base64url'));
  if (iv.length !== 12 || tag.length !== 16 || ciphertext.length === 0) {
    throw new Error('Stored seller payment credential is invalid');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

module.exports = { encryptSellerSecret, decryptSellerSecret };
