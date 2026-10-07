const userModel = require('../models/user.model');
const Order = require('../models/order.model');
const { serverError } = require('../services/http.service');
const { encryptSellerSecret } = require('../services/seller-payment.service');

async function getEsewaSettings(req, res) {
  try {
    const user = await userModel.findById(req.user._id)
      .select('paymentSettings.esewa.phoneNumber paymentSettings.esewa.merchantCode paymentSettings.esewa.secretCiphertext')
      .lean();
    const esewa = user?.paymentSettings?.esewa;
    return res.json({
      connected: Boolean(esewa?.merchantCode && esewa?.secretCiphertext),
      phoneNumber: esewa?.phoneNumber || '',
      merchantCode: esewa?.merchantCode || ''
    });
  } catch (error) {
    return serverError(res, 'Failed to load eSewa connection', error);
  }
}

async function saveEsewaSettings(req, res) {
  const phoneNumber = typeof req.body.phoneNumber === 'string' ? req.body.phoneNumber.replace(/[\s-]/g, '') : '';
  const merchantCode = typeof req.body.merchantCode === 'string' ? req.body.merchantCode.trim() : '';
  const merchantSecret = typeof req.body.merchantSecret === 'string' ? req.body.merchantSecret : '';
  if (!/^(?:\+977)?9\d{9}$/.test(phoneNumber)
    || !/^[A-Za-z0-9_-]{2,80}$/.test(merchantCode)
    || (merchantSecret && (merchantSecret.length < 8 || merchantSecret.length > 256))) {
    return res.status(400).json({ message: 'Provide a valid Nepal eSewa mobile number, merchant code, and (when connecting for the first time) merchant API secret' });
  }

  try {
    const pendingPayment = await Order.exists({
      paymentMethod: 'esewa',
      paymentStatus: 'PENDING',
      stockReleased: false,
      'items.seller': req.user._id
    });
    if (pendingPayment) {
      return res.status(409).json({ message: 'Resolve or wait for existing eSewa orders to expire before changing your merchant account.' });
    }

    const existingUser = await userModel.findById(req.user._id)
      .select('+paymentSettings.esewa.secretCiphertext')
      .lean();
    const existingSecret = existingUser?.paymentSettings?.esewa?.secretCiphertext;
    if (!merchantSecret && !existingSecret) {
      return res.status(400).json({ message: 'Enter the merchant API secret issued for your eSewa merchant account' });
    }
    const user = await userModel.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'paymentSettings.esewa.phoneNumber': phoneNumber,
          'paymentSettings.esewa.merchantCode': merchantCode,
          ...(merchantSecret ? { 'paymentSettings.esewa.secretCiphertext': encryptSellerSecret(merchantSecret) } : {})
        }
      },
      { new: true, runValidators: true }
    ).select('paymentSettings.esewa.phoneNumber paymentSettings.esewa.merchantCode').lean();

    if (!user) return res.status(404).json({ message: 'Seller account not found' });
    return res.json({
      message: 'eSewa merchant account connected',
      connected: true,
      phoneNumber: user.paymentSettings.esewa.phoneNumber,
      merchantCode: user.paymentSettings.esewa.merchantCode
    });
  } catch (error) {
    if (error.message.includes('SELLER_PAYMENT_ENCRYPTION_KEY')) {
      return res.status(503).json({ message: 'Seller payment connections are not configured on this server' });
    }
    return serverError(res, 'Failed to save eSewa connection', error);
  }
}

async function disconnectEsewa(req, res) {
  try {
    const pendingPayment = await Order.exists({
      paymentMethod: 'esewa',
      paymentStatus: 'PENDING',
      stockReleased: false,
      'items.seller': req.user._id
    });
    if (pendingPayment) {
      return res.status(409).json({ message: 'A seller payment is still pending. Try disconnecting after it is resolved or expires.' });
    }

    await userModel.updateOne(
      { _id: req.user._id },
      { $unset: { 'paymentSettings.esewa': '' } }
    );
    return res.json({ message: 'eSewa merchant account disconnected', connected: false });
  } catch (error) {
    return serverError(res, 'Failed to disconnect eSewa', error);
  }
}

module.exports = { getEsewaSettings, saveEsewaSettings, disconnectEsewa };
