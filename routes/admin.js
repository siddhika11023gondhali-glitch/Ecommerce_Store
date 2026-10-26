/**
 * SaMaa'S Collection - Admin API Routes
 * Role-protected endpoints for inventory management, product CRUD, and order fulfillment.
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { isAuthenticated, isAdmin, verifyCsrfToken } = require('../middleware/auth');

// Apply authentication & admin authorization to all routes in this router
router.use(isAuthenticated, isAdmin);

/**
 * GET /api/admin/stats
 * Dashboard overview counters.
 */
router.get('/stats', async (req, res, next) => {
  try {
    const [productCount] = await query('SELECT COUNT(*) AS count FROM products WHERE is_active = 1');
    const [orderCount] = await query('SELECT COUNT(*) AS count FROM orders');
    const [revenue] = await query(
      "SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE order_status != 'cancelled'"
    );
    const [lowStock] = await query(
      'SELECT COUNT(*) AS count FROM products WHERE stock_quantity <= 5 AND is_active = 1'
    );

    res.json({
      success: true,
      stats: {
        totalProducts: productCount.count,
        totalOrders: orderCount.count,
        totalRevenue: parseFloat(revenue.total),
        lowStockCount: lowStock.count
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/products
 * Returns all products for administration.
 */
router.get('/products', async (req, res, next) => {
  try {
    const products = await query('SELECT * FROM products ORDER BY created_at DESC');
    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/products
 * Adds a new product to the catalog.
 */
router.post('/products', verifyCsrfToken, async (req, res, next) => {
  try {
    const {
      name,
      description,
      category,
      price,
      stock_quantity = 0,
      image_url,
      is_featured = 0,
      is_active = 1
    } = req.body;

    if (!name || !description || !category || price === undefined || !image_url) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, category, price, and image URL are required.'
      });
    }

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock_quantity, 10);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Price must be a positive number.' });
    }

    if (isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ success: false, message: 'Stock must be zero or positive.' });
    }

    const result = await query(
      `INSERT INTO products (name, description, category, price, stock_quantity, image_url, is_featured, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        description.trim(),
        category.trim(),
        parsedPrice,
        parsedStock,
        image_url.trim(),
        is_featured ? 1 : 0,
        is_active ? 1 : 0
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Product added successfully.',
      productId: result.insertId
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/products/:id
 * Updates an existing product.
 */
router.put('/products/:id', verifyCsrfToken, async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' });
    }

    const {
      name,
      description,
      category,
      price,
      stock_quantity,
      image_url,
      is_featured,
      is_active
    } = req.body;

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock_quantity, 10);

    await query(
      `UPDATE products SET 
        name = ?, description = ?, category = ?, price = ?,
        stock_quantity = ?, image_url = ?, is_featured = ?, is_active = ?
       WHERE id = ?`,
      [
        name.trim(),
        description.trim(),
        category.trim(),
        parsedPrice,
        parsedStock,
        image_url.trim(),
        is_featured ? 1 : 0,
        is_active ? 1 : 0,
        productId
      ]
    );

    res.json({
      success: true,
      message: 'Product updated successfully.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/products/:id/stock
 * Quickly updates inventory stock level.
 */
router.patch('/products/:id/stock', verifyCsrfToken, async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const { stock_quantity } = req.body;

    const parsedStock = parseInt(stock_quantity, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ success: false, message: 'Valid stock quantity is required.' });
    }

    await query('UPDATE products SET stock_quantity = ? WHERE id = ?', [parsedStock, productId]);

    res.json({
      success: true,
      message: 'Inventory stock updated.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/products/:id
 * Safely deactivates product (soft delete) to preserve historical order records.
 */
router.delete('/products/:id', verifyCsrfToken, async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' });
    }

    await query('UPDATE products SET is_active = 0 WHERE id = ?', [productId]);

    res.json({
      success: true,
      message: 'Product safely deactivated from catalog.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/orders
 * Returns all orders with customer details and line items.
 */
router.get('/orders', async (req, res, next) => {
  try {
    const { status } = req.query;

    let sql = 'SELECT * FROM orders';
    const params = [];

    if (status && status !== 'all') {
      sql += ' WHERE order_status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    const orders = await query(sql, params);

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/orders/:id/status
 * Updates status of an order.
 */
router.patch('/orders/:id/status', verifyCsrfToken, async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { order_status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(order_status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    await query('UPDATE orders SET order_status = ? WHERE id = ?', [order_status, orderId]);

    res.json({
      success: true,
      message: `Order status updated to "${order_status}".`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
