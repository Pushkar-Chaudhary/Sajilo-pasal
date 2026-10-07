const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const userModel = require('../src/models/user.model');
const Order = require('../src/models/order.model');
const { saveEsewaSettings } = require('../src/controllers/payment-settings.controller');
const { decryptSellerSecret, encryptSellerSecret } = require('../src/services/seller-payment.service');

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

function query(value) {
  return {
    select() {
      return this;
    },
    lean: async () => value
  };
}

test('seller eSewa settings save the mobile number and merchant credentials securely', async () => {
  const originalKey = process.env.SELLER_PAYMENT_ENCRYPTION_KEY;
  const originalFindById = userModel.findById;
  const originalFindByIdAndUpdate = userModel.findByIdAndUpdate;
  const originalOrderExists = Order.exists;
  const sellerId = 'seller-id';
  let update;
  process.env.SELLER_PAYMENT_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
  Order.exists = async () => false;
  userModel.findById = () => query({ _id: sellerId });
  userModel.findByIdAndUpdate = (_id, changes) => {
    update = changes;
    return query({
      paymentSettings: {
        esewa: {
          phoneNumber: changes.$set['paymentSettings.esewa.phoneNumber'],
          merchantCode: changes.$set['paymentSettings.esewa.merchantCode']
        }
      }
    });
  };

  try {
    const res = responseRecorder();
    await saveEsewaSettings({
      user: { _id: sellerId },
      body: { phoneNumber: '+977 981-234-5678', merchantCode: 'seller-code', merchantSecret: 'private-merchant-api-secret' }
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.phoneNumber, '+9779812345678');
    assert.equal(res.body.merchantCode, 'seller-code');
    assert.equal(decryptSellerSecret(update.$set['paymentSettings.esewa.secretCiphertext']), 'private-merchant-api-secret');
    assert.equal(Object.hasOwn(res.body, 'merchantSecret'), false);
  } finally {
    userModel.findById = originalFindById;
    userModel.findByIdAndUpdate = originalFindByIdAndUpdate;
    Order.exists = originalOrderExists;
    if (originalKey === undefined) delete process.env.SELLER_PAYMENT_ENCRYPTION_KEY;
    else process.env.SELLER_PAYMENT_ENCRYPTION_KEY = originalKey;
  }
});

test('seller eSewa settings reject an invalid Nepal mobile number', async () => {
  const res = responseRecorder();
  await saveEsewaSettings({
    user: { _id: 'seller-id' },
    body: { phoneNumber: '12345', merchantCode: 'seller-code', merchantSecret: 'private-merchant-api-secret' }
  }, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /valid Nepal eSewa mobile number/);
});
