/**
 * SaMaa'S Collection - Authentication API Routes
 * Handles user registration, login, logout, session status, and CSRF token distribution.
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { ensureCsrfToken, isAuthenticated } = require('../middleware/auth');

/**
 * GET /api/auth/csrf-token
 * Fetches or initializes CSRF token for secure state-changing operations.
 */
router.get('/csrf-token', (req, res) => {
  const token = ensureCsrfToken(req);
  res.json({ success: true, csrfToken: token });
});

/**
 * GET /api/auth/me
 * Returns current authenticated user information (without sensitive fields).
 */
router.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    res.json({
      success: true,
      authenticated: true,
      user: {
        id: req.session.user.id,
        name: req.session.user.name,
        email: req.session.user.email,
        role: req.session.user.role
      }
    });
  } else {
    res.json({
      success: true,
      authenticated: false,
      user: null
    });
  }
});

/**
 * POST /api/auth/register
 * Creates a new customer account with securely hashed password.
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, phone, address } = req.body;

    // Server-side validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All required fields (Name, Email, Password, Confirm Password) must be provided.'
      });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match. Please verify and try again.'
      });
    }

    // Check for duplicate email
    const existingUsers = await query('SELECT id FROM users WHERE email = ?', [trimmedEmail]);
    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.'
      });
    }

    // Hash password with bcryptjs (salt rounds = 10)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into database
    const insertResult = await query(
      'INSERT INTO users (name, email, password_hash, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
      [trimmedName, trimmedEmail, passwordHash, 'customer', phone || null, address || null]
    );

    const newUserId = insertResult.insertId;

    // Establish authenticated session
    req.session.user = {
      id: newUserId,
      name: trimmedName,
      email: trimmedEmail,
      role: 'customer'
    };
    ensureCsrfToken(req);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to SaMaa\'S Collection.',
      user: {
        id: newUserId,
        name: trimmedName,
        email: trimmedEmail,
        role: 'customer'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Validates credentials and initializes a session.
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Query user by email
    const users = await query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = ?',
      [trimmedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Populate session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    const csrfToken = ensureCsrfToken(req);

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      csrfToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Destroys user session and clears cookie.
 */
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Could not log out at this moment. Please try again.'
        });
      }
      res.clearCookie('samaas.sid');
      res.json({
        success: true,
        message: 'You have been logged out successfully.'
      });
    });
  } else {
    res.json({ success: true, message: 'Already logged out.' });
  }
});

/**
 * GET /api/auth/profile
 * Get current user profile details
 */
router.get('/profile', isAuthenticated, async (req, res, next) => {
  try {
    const users = await query(
      'SELECT id, name, email, role, phone, address, created_at FROM users WHERE id = ?',
      [req.session.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      profile: users[0]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
