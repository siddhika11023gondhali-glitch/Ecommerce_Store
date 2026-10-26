/**
 * SaMaa'S Collection - Orders & Checkout API Routes
 * Handles order checkout with atomic MySQL transactions, stock reduction, order history, and invoice details.
 */

const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/db');
const { isAuthenticated, verifyCsrfToken } = require('../middleware/auth');

/**
 * Generates an elegant order reference number.
 * e.g., SMA-20261019-8492
 */
function generateOrderNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `SMA-${dateStr}-${randomSuffix}`;
}

/**
 * POST /api/orders/checkout
 * Places an order using an atomic MySQL transaction.
 */
router.post('/checkout', isAuthenticated, verifyCsrfToken, async (req, res, next) => {
  const userId = req.session.user.id;
  const {
    customerName,
    customerPhone,
    shippingAddress,
    city,
    state,
    postalCode,
    paymentMethod = 'Cash on Delivery',
    notes = ''
  } = req.body;

  // 1. Server-side validation of shipping inputs
  if (!customerName || !customerPhone || !shippingAddress || !city || !state || !postalCode) {
    return res.status(400).json({
      success: false,
      message: 'Please complete all required shipping address fields.'
    });
  }

  const phoneRegex = /^[0-9+\s\-]{7,15}$/;
  if (!phoneRegex.test(customerPhone.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid contact phone number.'
    });
  }

  const postalRegex = /^[a-zA-Z0-9\s\-]{3,10}$/;
  if (!postalRegex.test(postalCode.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid postal/PIN code.'
    });
  }

  // Enforce payment method
  const allowedPaymentMethods = ['Cash on Delivery'];
  if (!allowedPaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      message: 'Currently, Cash on Delivery is the supported payment method.'
    });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 2. Fetch cart items for the user
    const [cartRows] = await connection.query(
      `SELECT c.id AS cart_id, c.product_id, c.quantity, p.name, p.price, p.stock_quantity, p.is_active
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?
       FOR UPDATE`,
      [userId]
    );

    if (cartRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Your shopping cart is empty. Please add items before placing an order.'
      });
    }

    // 3. Verify stock availability and recalculate totals strictly on server
    let subtotal = 0;
    const validatedItems = [];

    for (const item of cartRows) {
      if (!item.is_active) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Product "${item.name}" is no longer active in our catalog.`
        });
      }

      if (item.quantity > item.stock_quantity) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.name}". Only ${item.stock_quantity} left in stock.`
        });
      }

      const unitPrice = parseFloat(item.price);
      const lineSubtotal = unitPrice * item.quantity;
      subtotal += lineSubtotal;

      validatedItems.push({
        productId: item.product_id,
        name: item.name,
        unitPrice,
        quantity: item.quantity,
        lineSubtotal: parseFloat(lineSubtotal.toFixed(2))
      });
    }

    // Free shipping on >= ₹999
    const shippingFee = subtotal >= 999 ? 0.00 : 99.00;
    const totalAmount = parseFloat((subtotal + shippingFee).toFixed(2));
    const subtotalFormatted = parseFloat(subtotal.toFixed(2));
    const orderNumber = generateOrderNumber();

    // 4. Insert into orders table
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        order_number, user_id, customer_name, customer_email, customer_phone,
        shipping_address, city, state, postal_code, payment_method,
        payment_status, order_status, subtotal, shipping_fee, total_amount, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?, ?, ?, ?)`,
      [
        orderNumber,
        userId,
        customerName.trim(),
        req.session.user.email,
        customerPhone.trim(),
        shippingAddress.trim(),
        city.trim(),
        state.trim(),
        postalCode.trim(),
        paymentMethod,
        subtotalFormatted,
        shippingFee,
        totalAmount,
        notes.trim() || null
      ]
    );

    const orderId = orderResult.insertId;

    // 5. Insert order items snapshot & deduct inventory
    for (const item of validatedItems) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.name, item.unitPrice, item.quantity, item.lineSubtotal]
      );

      // Decrement product inventory
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.productId]
      );
    }

    // 6. Clear user's cart
    await connection.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

    // 7. Commit the entire transaction atomically
    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Thank you for shopping with SaMaa\'S Collection.',
      order: {
        id: orderId,
        orderNumber,
        totalAmount,
        subtotal: subtotalFormatted,
        shippingFee,
        paymentMethod
      }
    });

  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('Rollback error:', rollbackErr.message);
      }
    }
    next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

/**
 * GET /api/orders
 * Returns list of past orders for the authenticated user.
 */
router.get('/', isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.session.user.id;

    const orders = await query(
      `SELECT 
        o.id,
        o.order_number,
        o.order_status,
        o.payment_method,
        o.payment_status,
        o.subtotal,
        o.shipping_fee,
        o.total_amount,
        o.created_at,
        COUNT(oi.id) AS total_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders/:id
 * Fetches single order details with item breakdown.
 */
router.get('/:id', isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const orderId = parseInt(req.params.id, 10);

    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID.' });
    }

    // Check authorization: customer can only view own order unless admin
    let sql = 'SELECT * FROM orders WHERE id = ?';
    const params = [orderId];

    if (req.session.user.role !== 'admin') {
      sql += ' AND user_id = ?';
      params.push(userId);
    }

    const orders = await query(sql, params);

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or you do not have permission to view it.'
      });
    }

    const order = orders[0];

    // Fetch line items
    const items = await query(
      `SELECT oi.*, p.image_url
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    res.json({
      success: true,
      order,
      items
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
