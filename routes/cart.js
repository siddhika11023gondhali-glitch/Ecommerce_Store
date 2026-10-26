/**
 * SaMaa'S Collection - Cart API Routes
 * Handles database cart persistence, inventory stock validation, quantity changes, and guest cart merging.
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { isAuthenticated, verifyCsrfToken } = require('../middleware/auth');

/**
 * Helper to calculate cart totals and check stock availability.
 */
function calculateCartTotals(items) {
  let subtotal = 0;
  const processedItems = items.map((item) => {
    const itemPrice = parseFloat(item.price);
    const itemQty = parseInt(item.quantity, 10);
    const lineTotal = itemPrice * itemQty;
    subtotal += lineTotal;

    const isAvailable = item.stock_quantity >= itemQty && item.stock_quantity > 0;

    return {
      id: item.cart_item_id || null,
      productId: item.product_id,
      name: item.name,
      category: item.category,
      price: itemPrice,
      image_url: item.image_url,
      stock_quantity: item.stock_quantity,
      quantity: itemQty,
      lineTotal: parseFloat(lineTotal.toFixed(2)),
      isAvailable
    };
  });

  // Free shipping on orders over ₹999, else ₹99
  const shippingFee = subtotal > 0 && subtotal >= 999 ? 0.00 : (subtotal > 0 ? 99.00 : 0.00);
  const totalAmount = subtotal + shippingFee;

  return {
    items: processedItems,
    itemCount: processedItems.reduce((acc, curr) => acc + curr.quantity, 0),
    subtotal: parseFloat(subtotal.toFixed(2)),
    shippingFee: parseFloat(shippingFee.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2))
  };
}

/**
 * GET /api/cart
 * Returns database cart for logged-in user.
 */
router.get('/', isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.session.user.id;

    const rows = await query(
      `SELECT 
        c.id AS cart_item_id,
        c.quantity,
        p.id AS product_id,
        p.name,
        p.category,
        p.price,
        p.stock_quantity,
        p.image_url,
        p.is_active
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ? AND p.is_active = 1
      ORDER BY c.created_at DESC`,
      [userId]
    );

    const cartData = calculateCartTotals(rows);

    res.json({
      success: true,
      ...cartData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cart/add
 * Adds a product to the authenticated user's cart or increments quantity.
 */
router.post('/add', isAuthenticated, verifyCsrfToken, async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { productId, quantity = 1 } = req.body;

    const parsedProductId = parseInt(productId, 10);
    const parsedQty = parseInt(quantity, 10);

    if (isNaN(parsedProductId) || isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product or quantity specified.'
      });
    }

    // Verify product exists and check stock
    const products = await query(
      'SELECT id, name, price, stock_quantity, is_active FROM products WHERE id = ?',
      [parsedProductId]
    );

    if (products.length === 0 || !products[0].is_active) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or is no longer available.'
      });
    }

    const product = products[0];

    if (product.stock_quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: `Sorry, "${product.name}" is currently out of stock.`
      });
    }

    // Check existing cart item
    const existing = await query(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, parsedProductId]
    );

    let newQuantity = parsedQty;
    if (existing.length > 0) {
      newQuantity = existing[0].quantity + parsedQty;
    }

    if (newQuantity > product.stock_quantity) {
      return res.status(400).json({
        success: false,
        message: `Cannot add ${parsedQty} more. Only ${product.stock_quantity} items available in stock.`
      });
    }

    // Upsert into cart_items
    await query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
      [userId, parsedProductId, newQuantity]
    );

    res.json({
      success: true,
      message: `"${product.name}" added to your shopping cart.`,
      currentQuantity: newQuantity
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/cart/update
 * Updates quantity for an existing cart item.
 */
router.put('/update', isAuthenticated, verifyCsrfToken, async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { productId, quantity } = req.body;

    const parsedProductId = parseInt(productId, 10);
    const parsedQty = parseInt(quantity, 10);

    if (isNaN(parsedProductId) || isNaN(parsedQty) || parsedQty < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID or quantity specified.'
      });
    }

    // If quantity is 0, remove item
    if (parsedQty === 0) {
      await query('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, parsedProductId]);
      return res.json({
        success: true,
        message: 'Item removed from your shopping cart.'
      });
    }

    // Check stock
    const products = await query(
      'SELECT id, name, stock_quantity FROM products WHERE id = ?',
      [parsedProductId]
    );

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = products[0];

    if (parsedQty > product.stock_quantity) {
      return res.status(400).json({
        success: false,
        message: `Maximum available stock for "${product.name}" is ${product.stock_quantity}.`
      });
    }

    await query(
      'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
      [parsedQty, userId, parsedProductId]
    );

    res.json({
      success: true,
      message: 'Cart quantity updated.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/cart/remove/:productId
 * Removes an item from the user's cart.
 */
router.delete('/remove/:productId', isAuthenticated, verifyCsrfToken, async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const productId = parseInt(req.params.productId, 10);

    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' });
    }

    await query(
      'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    res.json({
      success: true,
      message: 'Item removed from cart.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cart/clear
 * Clears all items from user's cart.
 */
router.post('/clear', isAuthenticated, verifyCsrfToken, async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    await query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cart/sync
 * Merges guest cart items from localStorage after logging in.
 */
router.post('/sync', isAuthenticated, verifyCsrfToken, async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ success: true, message: 'No items to sync.' });
    }

    for (const item of items) {
      const pid = parseInt(item.productId, 10);
      const qty = parseInt(item.quantity, 10);

      if (!isNaN(pid) && !isNaN(qty) && qty > 0) {
        // Check product and stock
        const pRows = await query('SELECT stock_quantity, is_active FROM products WHERE id = ?', [pid]);
        if (pRows.length > 0 && pRows[0].is_active) {
          const maxStock = pRows[0].stock_quantity;
          const cappedQty = Math.min(qty, maxStock);

          if (cappedQty > 0) {
            await query(
              `INSERT INTO cart_items (user_id, product_id, quantity)
               VALUES (?, ?, ?)
               ON DUPLICATE KEY UPDATE quantity = LEAST(quantity + VALUES(quantity), ?)`,
              [userId, pid, cappedQty, maxStock]
            );
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Cart synchronized with your account.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
