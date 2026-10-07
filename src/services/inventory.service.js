const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Product = require('../models/product.model');

async function releaseOrderStock(order, session) {
  if (order.stockReleased) return;

  for (const item of order.items) {
    const result = await Product.updateOne(
      { _id: item.product },
      { $inc: { stock: item.quantity } },
      { session }
    );
    if (result.matchedCount !== 1) {
      throw new Error(`Could not restore reserved stock for product ${item.product}`);
    }
  }

  order.stockReleased = true;
  order.paymentStatus = 'FAILED';
  order.orderStatus = 'CANCELLED';
  order.paymentExpiresAt = null;
  await order.save({ session });
}

async function expirePendingEsewaOrders(now = new Date()) {
  const expired = await Order.find({
    paymentMethod: 'esewa',
    paymentStatus: 'PENDING',
    stockReleased: false,
    paymentExpiresAt: { $lte: now }
  }).select('_id').limit(50).lean();

  for (const { _id } of expired) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const order = await Order.findOne({
          _id,
          paymentMethod: 'esewa',
          paymentStatus: 'PENDING',
          stockReleased: false,
          paymentExpiresAt: { $lte: now }
        }).session(session);
        if (order) {
          await releaseOrderStock(order, session);
        }
      });
    } finally {
      await session.endSession();
    }
  }

  return expired.length;
}

module.exports = { releaseOrderStock, expirePendingEsewaOrders };
