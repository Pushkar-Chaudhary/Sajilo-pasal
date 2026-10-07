const crypto = require('crypto');

function createEsewaSignature({ totalAmount, transactionUuid, productCode, merchantSecret }) {
  const data = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto.createHmac('sha256', merchantSecret).update(data).digest('base64');
}

function verifyEsewaResponse(payload, merchantSecret) {
  if (!payload || !payload.signature || !payload.signed_field_names || !merchantSecret) {
    return false;
  }

  const fields = payload.signed_field_names.split(',');
  if (!fields.length || fields.some((field) => !Object.prototype.hasOwnProperty.call(payload, field))) {
    return false;
  }

  const signedData = fields.map((field) => `${field}=${payload[field]}`).join(',');
  const expected = crypto.createHmac('sha256', merchantSecret).update(signedData).digest();
  const received = Buffer.from(payload.signature, 'base64');
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

function createEsewaForm({ amount, transactionUuid, productCode, successUrl, failureUrl, merchantSecret }) {
  const totalAmount = Number(amount).toFixed(2);
  const fields = {
    amount: totalAmount,
    tax_amount: '0',
    total_amount: totalAmount,
    transaction_uuid: transactionUuid,
    product_code: productCode,
    product_service_charge: '0',
    product_delivery_charge: '0',
    success_url: successUrl,
    failure_url: failureUrl,
    signed_field_names: 'total_amount,transaction_uuid,product_code'
  };

  fields.signature = createEsewaSignature({
    totalAmount,
    transactionUuid,
    productCode,
    merchantSecret
  });

  const baseUrl = (process.env.ESEWA_BASE_URL || 'https://epay.esewa.com.np').replace(/\/+$/, '');
  return {
    gatewayUrl: `${baseUrl}/api/epay/main/v2/form`,
    formData: fields
  };
}

async function verifyEsewaTransaction({ totalAmount, transactionUuid, productCode }) {
  const statusUrl = process.env.ESEWA_STATUS_URL
    || (process.env.ESEWA_ENV === 'uat'
      ? 'https://rc.esewa.com.np/api/epay/transaction/status/'
      : 'https://esewa.com.np/api/epay/transaction/status/');
  const url = new URL(statusUrl);
  url.searchParams.set('product_code', productCode);
  url.searchParams.set('total_amount', Number(totalAmount).toFixed(2));
  url.searchParams.set('transaction_uuid', transactionUuid);

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) {
    throw new Error(`eSewa status service returned HTTP ${response.status}`);
  }
  return response.json();
}

module.exports = {
  createEsewaSignature,
  verifyEsewaResponse,
  createEsewaForm,
  verifyEsewaTransaction
};
