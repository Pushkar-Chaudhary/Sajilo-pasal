const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { encryptSellerSecret, decryptSellerSecret } = require('../src/services/seller-payment.service');

test('seller eSewa secrets are encrypted and can be decrypted with the configured key', () => {
  const previousKey = process.env.SELLER_PAYMENT_ENCRYPTION_KEY;
  process.env.SELLER_PAYMENT_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
  try {
    const secret = 'seller-private-merchant-secret';
    const encrypted = encryptSellerSecret(secret);
    assert.notEqual(encrypted, secret);
    assert.equal(decryptSellerSecret(encrypted), secret);
    assert.throws(() => decryptSellerSecret(`${encrypted.slice(0, -1)}A`));
  } finally {
    if (previousKey === undefined) delete process.env.SELLER_PAYMENT_ENCRYPTION_KEY;
    else process.env.SELLER_PAYMENT_ENCRYPTION_KEY = previousKey;
  }
});

test('seller credential encryption refuses missing or invalid encryption keys', () => {
  const previousKey = process.env.SELLER_PAYMENT_ENCRYPTION_KEY;
  delete process.env.SELLER_PAYMENT_ENCRYPTION_KEY;
  try {
    assert.throws(() => encryptSellerSecret('secret'), /SELLER_PAYMENT_ENCRYPTION_KEY/);
    process.env.SELLER_PAYMENT_ENCRYPTION_KEY = 'not-a-32-byte-key';
    assert.throws(() => encryptSellerSecret('secret'), /base64-encoded 32-byte key/);
  } finally {
    if (previousKey === undefined) delete process.env.SELLER_PAYMENT_ENCRYPTION_KEY;
    else process.env.SELLER_PAYMENT_ENCRYPTION_KEY = previousKey;
  }
});
