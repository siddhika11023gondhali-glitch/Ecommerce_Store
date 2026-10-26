/**
 * SaMaa'S Collection - Core Frontend Application Framework
 * Handles Session Auth State, Cart Counter, CSRF Tokens, Navigation & Toast Notifications.
 */

const App = (() => {
  let currentUser = null;
  let csrfToken = null;
  let initPromise = null;

  /**
   * Initializes application state on every page load.
   * Returns a singleton Promise so any caller can await App.init() or App.getUser().
   */
  function init() {
    if (!initPromise) {
      initPromise = (async () => {
        try {
          await Promise.all([fetchCsrfToken(), checkAuthStatus()]);
          await updateCartBadge();
          initMobileMenu();
        } catch (e) {
          console.warn('App initialization warning:', e.message);
        }
        return currentUser;
      })();
    }
    return initPromise;
  }

  /**
   * Always awaits authentication resolution before returning current user.
   */
  async function getUser() {
    await init();
    return currentUser;
  }

  /**
   * Synchronous getter for when auth is already known to be resolved.
   */
  function getCurrentUser() {
    return currentUser;
  }

  /**
   * Retrieves CSRF token for secure state-changing requests.
   */
  async function fetchCsrfToken() {
    try {
      const res = await fetch('/api/auth/csrf-token');
      const data = await res.json();
      if (data.success) {
        csrfToken = data.csrfToken;
      }
    } catch (e) {
      console.warn('Could not fetch CSRF token:', e.message);
    }
  }

  /**
   * Checks current session with the Express server.
   */
  async function checkAuthStatus() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (data.success && data.authenticated) {
        currentUser = data.user;
        renderNavForUser(currentUser);
      } else {
        currentUser = null;
        renderNavForGuest();
      }
    } catch (e) {
      currentUser = null;
      renderNavForGuest();
    }
  }

  /**
   * Renders navigation items for an authenticated user.
   */
  function renderNavForUser(user) {
    const authContainer = document.getElementById('navAuthContainer');
    if (!authContainer) return;

    let adminLinkHtml = '';
    if (user.role === 'admin') {
      adminLinkHtml = `
        <a href="admin.html" class="account-dropdown-item">
          <span>⚙️</span> Admin Portal
        </a>
      `;
    }

    authContainer.innerHTML = `
      <div class="account-menu-wrapper">
        <button class="nav-action-btn" title="My Account" aria-label="My Account">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </button>
        <div class="account-dropdown">
          <div class="account-dropdown-header">
            <div class="account-user-name">${escapeHtml(user.name)}</div>
            <div class="account-user-role">${user.role}</div>
          </div>
          ${adminLinkHtml}
          <a href="orders.html" class="account-dropdown-item">
            <span>📦</span> Order History
          </a>
          <a href="cart.html" class="account-dropdown-item">
            <span>🛍️</span> My Cart
          </a>
          <button id="logoutBtn" class="account-dropdown-item" style="width: 100%; text-align: left; border-top: 1px solid var(--color-border); margin-top: 4px;">
            <span>🚪</span> Log Out
          </button>
        </div>
      </div>
    `;

    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
  }

  /**
   * Renders navigation for a guest.
   */
  function renderNavForGuest() {
    const authContainer = document.getElementById('navAuthContainer');
    if (!authContainer) return;

    authContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <a href="login.html" class="btn btn-secondary btn-sm">Log In</a>
        <a href="register.html" class="btn btn-primary btn-sm">Register</a>
      </div>
    `;
  }

  /**
   * Handles user logout.
   */
  async function handleLogout() {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Logged out successfully', 'info');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 500);
      }
    } catch (e) {
      showToast('Error logging out. Please try again.', 'error');
    }
  }

  /**
   * Updates shopping cart badge count from database or guest localStorage.
   */
  async function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;

    let totalCount = 0;

    if (currentUser) {
      try {
        const res = await fetch('/api/cart');
        const data = await res.json();
        if (data.success) {
          totalCount = data.itemCount || 0;
        }
      } catch (e) {
        totalCount = 0;
      }
    } else {
      // Guest cart in localStorage
      const guestCart = getGuestCart();
      totalCount = guestCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    }

    badge.textContent = totalCount;
    badge.style.display = totalCount > 0 ? 'flex' : 'none';
  }

  /**
   * Guest Cart Helpers
   */
  function getGuestCart() {
    try {
      return JSON.parse(localStorage.getItem('samaas_guest_cart')) || [];
    } catch (e) {
      return [];
    }
  }

  function setGuestCart(items) {
    localStorage.setItem('samaas_guest_cart', JSON.stringify(items));
    updateCartBadge();
  }

  /**
   * Synchronizes guest cart into server session upon login.
   */
  async function syncGuestCartAfterLogin() {
    const guestItems = getGuestCart();
    if (guestItems.length === 0) return;

    try {
      const res = await fetch('/api/cart/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        body: JSON.stringify({ items: guestItems })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.removeItem('samaas_guest_cart');
        await updateCartBadge();
      }
    } catch (e) {
      console.warn('Cart sync notice:', e.message);
    }
  }

  /**
   * Global Currency Formatter for Indian Rupee (₹)
   */
  function formatINR(val) {
    const num = parseFloat(val) || 0;
    return '₹' + num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Image Fallback Handler
   */
  function handleImageError(img) {
    img.onerror = null;
    img.src = '/images/placeholder.svg';
  }

  /**
   * Toast Notification Controller
   */
  function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
      <span style="font-weight: 700; font-size: 1.1rem;">${icon}</span>
      <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  /**
   * Mobile Menu Drawer Toggle
   */
  function initMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const links = document.getElementById('navLinks');
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        links.classList.toggle('open');
      });
    }
  }

  /**
   * XSS Protection Helper
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  return {
    init,
    getUser,
    getCurrentUser,
    getCsrfToken: () => csrfToken,
    formatINR,
    showToast,
    updateCartBadge,
    getGuestCart,
    setGuestCart,
    syncGuestCartAfterLogin,
    handleImageError,
    escapeHtml
  };
})();

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
