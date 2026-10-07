const test = require('node:test');
const assert = require('node:assert/strict');
const { buildProductQuery, normalizeProductLocation } = require('../src/controllers/product.controller');

test('public product queries are restricted to active Nepal marketplace listings', () => {
  const filters = buildProductQuery({ province: 'Bagmati', district: 'Kathmandu' });

  assert.equal(filters.isActive, true);
  assert.equal(filters.sellerModeActive, true);
  assert.equal(filters['location.country'], 'Nepal');
  assert.equal(filters['location.province'].test('Bagmati'), true);
  assert.equal(filters['location.district'].test('Kathmandu'), true);
});

test('product location accepts valid Nepal locations and rejects invalid locations', () => {
  assert.deepEqual(
    normalizeProductLocation({
      province: 'Gandaki',
      district: 'Kaski',
      municipality: 'Pokhara',
      ward: '6'
    }),
    {
      country: 'Nepal',
      province: 'Gandaki',
      district: 'Kaski',
      municipality: 'Pokhara',
      ward: '6'
    }
  );
  assert.equal(normalizeProductLocation({
    country: 'India',
    province: 'Gandaki',
    district: 'Kaski',
    municipality: 'Pokhara'
  }), null);
  assert.equal(normalizeProductLocation({
    province: 'Somewhere',
    district: 'Kaski',
    municipality: 'Pokhara'
  }), null);
});
