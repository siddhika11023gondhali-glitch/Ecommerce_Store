/**
 * SaMaa'S Collection - Products API Routes
 * Handles catalog browsing, searching, category filtering, sorting, and detail views.
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

/**
 * GET /api/products/categories
 * Returns list of distinct categories currently available in catalog.
 */
router.get('/categories', async (req, res, next) => {
  try {
    const rows = await query(
      'SELECT DISTINCT category FROM products WHERE is_active = 1 ORDER BY category ASC'
    );
    const categories = rows.map((r) => r.category);
    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products
 * Query parameters:
 *   - search: string (matches name or description)
 *   - category: string
 *   - sort: 'price_asc' | 'price_desc' | 'newest' | 'name_asc'
 *   - featured: 'true' | '1'
 *   - limit: number
 */
router.get('/', async (req, res, next) => {
  try {
    const { search, category, sort, featured, limit } = req.query;

    let sql = 'SELECT * FROM products WHERE is_active = 1';
    const params = [];

    // Category filter
    if (category && category !== 'All') {
      sql += ' AND category = ?';
      params.push(category);
    }

    // Keyword search filter (parameterized LIKE)
    if (search && search.trim() !== '') {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    // Featured only
    if (featured === 'true' || featured === '1') {
      sql += ' AND is_featured = 1';
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        sql += ' ORDER BY price ASC';
        break;
      case 'price_desc':
        sql += ' ORDER BY price DESC';
        break;
      case 'newest':
        sql += ' ORDER BY created_at DESC';
        break;
      case 'name_asc':
        sql += ' ORDER BY name ASC';
        break;
      default:
        sql += ' ORDER BY is_featured DESC, created_at DESC';
        break;
    }

    // Limit
    const parsedLimit = parseInt(limit, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      sql += ` LIMIT ${Math.min(parsedLimit, 100)}`;
    }

    const products = await query(sql, params);

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/:id
 * Fetches single product details and related products from same category.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const products = await query(
      'SELECT * FROM products WHERE id = ? AND is_active = 1',
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or is currently unavailable.'
      });
    }

    const product = products[0];

    // Fetch related products in the same category
    const related = await query(
      'SELECT id, name, category, price, stock_quantity, image_url, rating FROM products WHERE category = ? AND id != ? AND is_active = 1 LIMIT 4',
      [product.category, product.id]
    );

    res.json({
      success: true,
      product,
      related
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
