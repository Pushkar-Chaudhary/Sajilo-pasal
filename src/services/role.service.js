const Order = require('../models/order.model');
const Product = require('../models/product.model');

async function applyMarketplaceRole(user, newRole, session) {
  if (user.role === 'seller' && newRole !== 'seller') {
    const openOrders = await Order.exists({
      orderStatus: { $ne: 'CANCELLED' },
      items: {
        $elemMatch: {
          seller: user._id,
          fulfillmentStatus: { $nin: ['DELIVERED', 'CANCELLED'] }
        }
      }
    }).session(session);
    if (openOrders) {
      const error = new Error('Finish all open seller orders before switching out of seller mode');
      error.code = 'OPEN_SELLER_ORDERS';
      throw error;
    }
    await Product.updateMany(
      { seller: user._id },
      { $set: { sellerModeActive: false } },
      { session }
    );
  } else if (user.role !== 'seller' && newRole === 'seller') {
    await Product.updateMany(
      { seller: user._id },
      { $set: { sellerModeActive: true } },
      { session }
    );
  }

  user.role = newRole;
  await user.save({ session });
}

module.exports = { applyMarketplaceRole };
