/**
 * SaMaa'S Collection - Authentication & Authorization Middleware
 */

const crypto = require('crypto');

/**
 * Checks if the user is authenticated via active session.
 */
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user && req.session.user.id) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Authentication required. Please log in to proceed.'
  });
}

/**
 * Checks if the authenticated user has an 'admin' role.
 */
function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Administrator privileges are required.'
  });
}

/**
 * Optional authentication: Populates req.user if logged in, but does not block guests.
 */
function optionalAuth(req, res, next) {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  } else {
    req.user = null;
  }
  next();
}

/**
 * Ensures or generates a CSRF token in the user's session.
 */
function ensureCsrfToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  }
  return req.session.csrfToken;
}

/**
 * CSRF Protection Middleware for session-authenticated state-changing requests.
 * Allows safe methods (GET, HEAD, OPTIONS).
 * Verifies X-CSRF-Token header matches req.session.csrfToken.
 */
function verifyCsrfToken(req, res, next) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // If user is logged in, verify CSRF token for state-changing requests
  if (req.session && req.session.user) {
    const clientToken = req.headers['x-csrf-token'] || req.body?._csrf;
    const sessionToken = req.session.csrfToken;

    if (!sessionToken || !clientToken || clientToken !== sessionToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or missing CSRF token. Please refresh the page and try again.'
      });
    }
  }

  next();
}

module.exports = {
  isAuthenticated,
  isAdmin,
  optionalAuth,
  ensureCsrfToken,
  verifyCsrfToken
};
