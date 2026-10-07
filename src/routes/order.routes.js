const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const { createOrder, getCheckoutOrders, getMyOrders, getOrderById, updateOrderStatus, updateSellerFulfillment, getSellerOrders } = require('../controllers/order.controller');

const router = express.Router();

router.use(protect);
router.post('/', createOrder);
router.get('/checkout/:checkoutId', getCheckoutOrders);
router.get('/my-orders', getMyOrders);
router.get('/seller', authorize('seller'), getSellerOrders);
router.patch('/:orderId/items/:itemId/status', authorize('seller'), updateSellerFulfillment);
router.get('/:id', getOrderById);
router.patch('/:id', authorize('admin'), updateOrderStatus);

module.exports = router;
