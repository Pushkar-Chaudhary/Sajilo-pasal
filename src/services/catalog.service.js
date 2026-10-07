const Category = require('../models/category.model');
const { DEFAULT_CATEGORIES } = require('../constants/nepal');

async function ensureDefaultCategories() {
  await Promise.all(DEFAULT_CATEGORIES.map((name) => Category.updateOne(
    { name: name.toLowerCase() },
    { $setOnInsert: { name: name.toLowerCase(), isActive: true } },
    { upsert: true }
  )));
}

module.exports = { ensureDefaultCategories };
