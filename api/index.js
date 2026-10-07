require('dotenv').config();
const app = require('../src/app');
const connectDB = require('../src/config/db');
const { ensureDefaultCategories } = require('../src/services/catalog.service');

let categoriesInitialized = false;

module.exports = async (req, res) => {
  try {
    await connectDB();
    if (!categoriesInitialized) {
      await ensureDefaultCategories().catch((e) => console.warn('Categories init warning:', e.message));
      categoriesInitialized = true;
    }
  } catch (err) {
    console.error('Database connection error in Vercel serverless function:', err.message);
    return res.status(500).json({
      message: 'Database connection failed. Please ensure MONGO_URI is configured correctly in Vercel environment variables.'
    });
  }

  return app(req, res);
};
