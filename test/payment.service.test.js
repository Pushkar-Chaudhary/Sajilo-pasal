const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createEsewaSignature,
  verifyEsewaResponse,
  createEsewaForm
} = require('../src/services/payment.service');

test('eSewa HMAC matches the official UAT form signature example', () => {
  const signature = createEsewaSignature({
    totalAmount: '110',
    transactionUuid: '241028',
    productCode: 'EPAYTEST',
    merchantSecret: '8gBm/:&EnhH.1/q'
  });

  assert.equal(signature, 'i94zsd3oXF6ZsSr/kGqT4sSzYQzjj1W/waxjWyRwaME=');
});

test('eSewa callback verification checks exactly the provider signed fields', () => {
  const payload = {
    transaction_code: '000AWEO',
    status: 'COMPLETE',
    total_amount: '1000.0',
    transaction_uuid: '250610-162413',
    product_code: 'EPAYTEST',
    signed_field_names: 'transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names'
  };
  const signedFields = payload.signed_field_names.split(',');
  const signedData = signedFields.map((name) => `${name}=${payload[name]}`).join(',');
  const crypto = require('node:crypto');
  payload.signature = crypto.createHmac('sha256', 'test-secret').update(signedData).digest('base64');

  assert.equal(verifyEsewaResponse(payload, 'test-secret'), true);
  assert.equal(verifyEsewaResponse({ ...payload, total_amount: '1001' }, 'test-secret'), false);
});

test('eSewa payment form uses the server-provided signed amount and merchant data', () => {
  const previousBaseUrl = process.env.ESEWA_BASE_URL;
  process.env.ESEWA_BASE_URL = 'https://rc-epay.esewa.com.np';

  try {
    const payment = createEsewaForm({
      amount: 1200,
      transactionUuid: 'txn-01',
      productCode: 'EPAYTEST',
      successUrl: 'https://shop.example/api/v1/payments/esewa/callback',
      failureUrl: 'https://shop.example/api/v1/payments/esewa/callback',
      merchantSecret: 'test-secret'
    });

    assert.equal(payment.gatewayUrl, 'https://rc-epay.esewa.com.np/api/epay/main/v2/form');
    assert.equal(payment.formData.total_amount, '1200.00');
    assert.equal(payment.formData.signed_field_names, 'total_amount,transaction_uuid,product_code');
    assert.equal(typeof payment.formData.signature, 'string');
  } finally {
    if (previousBaseUrl === undefined) delete process.env.ESEWA_BASE_URL;
    else process.env.ESEWA_BASE_URL = previousBaseUrl;
  }
});
