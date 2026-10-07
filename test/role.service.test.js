const test = require('node:test');
const assert = require('node:assert/strict');
const Product = require('../src/models/product.model');
const Order = require('../src/models/order.model');
const { applyMarketplaceRole } = require('../src/services/role.service');

test('switching between buyer and seller hides then restores seller listings', async () => {
  const originalUpdateMany = Product.updateMany;
  const originalExists = Order.exists;
  const updates = [];
  Product.updateMany = async (...args) => { updates.push(args); };
  Order.exists = () => ({ session: async () => null });
  try {
    const user = { _id: 'seller-id', role: 'seller', save: async () => {} };
    await applyMarketplaceRole(user, 'buyer', {});
    assert.equal(user.role, 'buyer');
    assert.deepEqual(updates[0][1], { $set: { sellerModeActive: false } });

    await applyMarketplaceRole(user, 'seller', {});
    assert.equal(user.role, 'seller');
    assert.deepEqual(updates[1][1], { $set: { sellerModeActive: true } });
  } finally {
    Product.updateMany = originalUpdateMany;
    Order.exists = originalExists;
  }
});

test('a seller with open fulfillment items cannot switch modes', async () => {
  const originalExists = Order.exists;
  Order.exists = () => ({ session: async () => ({ _id: 'open-order' }) });
  try {
    await assert.rejects(
      applyMarketplaceRole({ _id: 'seller-id', role: 'seller' }, 'buyer', {}),
      { code: 'OPEN_SELLER_ORDERS' }
    );
  } finally {
    Order.exists = originalExists;
  }
});
