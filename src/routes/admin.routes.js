const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const { getDashboardStats, getUsers, updateUserStatus, getAllProducts, getAllOrders, updateProductVisibility, getCategories, createCategory, updateCategory } = require('../controllers/admin.controller');

const router = express.Router();

router.use(protect, authorize('admin'));
router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.patch('/users/:userId', updateUserStatus);
router.get('/products', getAllProducts);
router.patch('/products/:productId', updateProductVisibility);
router.get('/orders', getAllOrders);
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.patch('/categories/:categoryId', updateCategory);

module.exports = router;
