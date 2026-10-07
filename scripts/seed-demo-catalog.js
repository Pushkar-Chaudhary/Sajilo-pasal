require('dotenv').config();
const mongoose = require('mongoose');
const userModel = require('../src/models/user.model');
const Product = require('../src/models/product.model');
const { ensureDefaultCategories } = require('../src/services/catalog.service');

const sellerEmail = process.env.DEMO_SELLER_EMAIL || 'demo-seller@sajilopasal.local';
const demoProducts = [
  {
    slug: 'demo-seasonal-garden-greens',
    name: 'Seasonal Garden Greens',
    description: 'A fresh seasonal mix from a small Kathmandu Valley grower.',
    price: 180,
    stock: 12,
    category: 'vegetables',
    location: { country: 'Nepal', province: 'Bagmati', district: 'Kathmandu', municipality: 'Kirtipur', ward: '' },
    images: ['https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80']
  },
  {
    slug: 'demo-ilam-orthodox-tea',
    name: 'Ilam Orthodox Tea',
    description: 'Fragrant whole-leaf tea inspired by the gardens of eastern Nepal.',
    price: 450,
    stock: 8,
    category: 'drinks',
    location: { country: 'Nepal', province: 'Koshi', district: 'Ilam', municipality: 'Suryodaya', ward: '' },
    images: ['https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=900&q=80']
  },
  {
    slug: 'demo-himalayan-wildflower-honey',
    name: 'Himalayan Wildflower Honey',
    description: 'A small-batch pantry favourite from Nepal’s hillside communities.',
    price: 650,
    stock: 6,
    category: 'grocery',
    location: { country: 'Nepal', province: 'Gandaki', district: 'Lamjung', municipality: 'Besisahar', ward: '' },
    images: ['https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=900&q=80']
  },
  {
    slug: 'demo-mountain-orchard-apples',
    name: 'Mountain Orchard Apples',
    description: 'Crisp orchard fruit selected for a simple, local fruit bowl.',
    price: 320,
    stock: 10,
    category: 'vegetables',
    location: { country: 'Nepal', province: 'Gandaki', district: 'Mustang', municipality: 'Gharpajhong', ward: '' },
    images: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=900&q=80']
  }
];

async function seedDemoCatalog() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo catalog seeding is disabled in production');
  }
  if (!process.env.DEMO_SELLER_PASSWORD || process.env.DEMO_SELLER_PASSWORD.length < 12) {
    throw new Error('Set DEMO_SELLER_PASSWORD to a private value of at least 12 characters in your local .env');
  }
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');

  await mongoose.connect(process.env.MONGO_URI);
  await ensureDefaultCategories();

  let seller = await userModel.findOne({ email: sellerEmail });
  if (!seller) {
    seller = await userModel.create({
      name: 'Sajilo Local Market Demo Seller',
      email: sellerEmail,
      password: process.env.DEMO_SELLER_PASSWORD,
      role: 'seller'
    });
  } else if (seller.role !== 'seller') {
    throw new Error('The configured demo seller email belongs to a non-seller account');
  }

  for (const product of demoProducts) {
    await Product.updateOne(
      { slug: product.slug },
      { $setOnInsert: { ...product, seller: seller._id, isActive: true, sellerModeActive: true } },
      { upsert: true, runValidators: true }
    );
  }
  console.log(`Demo seller and ${demoProducts.length} catalog items are ready. Demo seller email: ${sellerEmail}`);
}

seedDemoCatalog()
  .catch((error) => {
    console.error('Demo catalog seeding failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
