const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { getProfile, updateProfile, getCart, addToCart, updateCartItem, removeCartItem, getWishlist, toggleWishlist, switchRole } = require('../controllers/user.controller');

const router = express.Router();

router.use(protect);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.patch('/role', switchRole);
router.get('/cart', getCart);
router.post('/cart', addToCart);
router.put('/cart/:productId', updateCartItem);
router.delete('/cart/:productId', removeCartItem);
router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', toggleWishlist);

module.exports = router;
