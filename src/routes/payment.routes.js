const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const { initiateEsewaPayment, processEsewaCallback } = require('../controllers/payment.controller');
const { getEsewaSettings, saveEsewaSettings, disconnectEsewa } = require('../controllers/payment-settings.controller');

const router = express.Router();

router.get('/esewa/callback', processEsewaCallback);
router.use(protect);
router.post('/esewa/initiate', initiateEsewaPayment);
router.get('/seller/esewa', authorize('seller'), getEsewaSettings);
router.put('/seller/esewa', authorize('seller'), saveEsewaSettings);
router.delete('/seller/esewa', authorize('seller'), disconnectEsewa);

module.exports = router;
