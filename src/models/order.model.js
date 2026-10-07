const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      index: true
    },
    productName: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    fulfillmentStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING'
    }
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    checkoutId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      index: true
    },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      addressLine1: { type: String, required: true, trim: true },
      addressLine2: { type: String, default: '', trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true }
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cash_on_delivery', 'esewa', 'bank_transfer', 'khalti']
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING'
    },
    orderStatus: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING'
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    shippingCost: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    transactionId: {
      type: String,
      default: ''
    },
    transactionReference: {
      type: String,
      default: ''
    },
    paymentProductCode: {
      type: String,
      default: ''
    },
    paymentSecretCiphertext: {
      type: String,
      select: false
    },
    paymentExpiresAt: {
      type: Date,
      default: null
    },
    stockReleased: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ paymentMethod: 1, paymentStatus: 1, paymentExpiresAt: 1, stockReleased: 1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
