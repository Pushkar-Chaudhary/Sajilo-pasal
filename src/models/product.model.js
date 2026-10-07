const mongoose = require('mongoose');
const { PROVINCES } = require('../constants/nepal');

const productLocationSchema = new mongoose.Schema({
  country: {
    type: String,
    enum: ['Nepal'],
    default: 'Nepal',
    required: true
  },
  province: {
    type: String,
    enum: PROVINCES,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80
  },
  municipality: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  ward: {
    type: String,
    default: '',
    trim: true,
    maxlength: 20
  }
}, { _id: false });

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative']
    },
    images: {
      type: [String],
      default: []
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
      lowercase: true
    },
    location: {
      type: productLocationSchema,
      required: [true, 'Product location in Nepal is required']
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: [true, 'Seller is required'],
      index: true
    },
    stock: {
      type: Number,
      required: [true, 'Product stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    sellerModeActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

productSchema.pre('validate', function preValidate() {
  if (!this.slug && this.name) {
    const base = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    this.slug = base || 'product';
  }

  if (this.slug) {
    this.slug = this.slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

});

productSchema.index({ seller: 1, category: 1, isActive: 1 });
productSchema.index({ 'location.province': 1, 'location.district': 1, 'location.municipality': 1, isActive: 1, sellerModeActive: 1 });
productSchema.index({ name: 'text', description: 'text', category: 'text' });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
