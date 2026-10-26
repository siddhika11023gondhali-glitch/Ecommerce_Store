/**
 * SaMaa'S Collection - Shopping Cart Controller
 * Supports authenticated database cart and guest localStorage cart, stock limits, and checkout transition.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('cartContentContainer');
  const guestNotice = document.getElementById('guestLoginNotice');

  // Load and render cart
  await renderCart();

  async function renderCart() {
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 0;">
        <div style="font-size: 2rem; margin-bottom: 1rem;">🛍️</div>
        <h2>Loading your shopping cart...</h2>
      </div>
    `;

    // 1. Await App authentication check to ensure accurate session state
    const user = await App.getUser();

    if (user) {
      // 2. If user has any items remaining in guest localStorage, merge them into the database!
      const guestItems = App.getGuestCart();
      if (guestItems.length > 0) {
        await App.syncGuestCartAfterLogin();
      }

      if (guestNotice) guestNotice.style.display = 'none';
      await renderAuthenticatedCart();
    } else {
      if (guestNotice) guestNotice.style.display = 'flex';
      renderGuestCart();
    }
  }

  /**
   * Loads cart for logged-in user from MySQL via /api/cart
   */
  async function renderAuthenticatedCart() {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();

      if (data.success && data.items && data.items.length > 0) {
        renderCartLayout(data.items, data.subtotal, data.shippingFee, data.totalAmount, true);
      } else {
        renderEmptyCart();
      }
    } catch (e) {
      renderEmptyCart('Could not load cart items. Please refresh or try again.');
    }
  }

  /**
   * Loads cart from guest localStorage
   */
  function renderGuestCart() {
    const guestItems = App.getGuestCart();

    if (guestItems.length === 0) {
      renderEmptyCart();
      return;
    }

    let subtotal = 0;
    const items = guestItems.map((item) => {
      const price = parseFloat(item.price) || 0;
      const qty = parseInt(item.quantity, 10) || 1;
      const lineTotal = price * qty;
      subtotal += lineTotal;

      return {
        productId: item.productId,
        name: item.name,
        category: item.category || 'Fashion',
        price: price,
        image_url: item.image_url,
        stock_quantity: item.stock_quantity || 10,
        quantity: qty,
        lineTotal: lineTotal
      };
    });

    const shippingFee = subtotal >= 999 ? 0.00 : 99.00;
    const totalAmount = subtotal + shippingFee;

    renderCartLayout(items, subtotal, shippingFee, totalAmount, false);
  }

  /**
   * Renders the full cart HTML layout
   */
  function renderCartLayout(items, subtotal, shippingFee, totalAmount, isAuthenticated) {
    const itemsHtml = items.map((item) => {
      return `
        <div class="cart-item-row" data-id="${item.productId}">
          <div class="cart-item-thumb">
            <a href="product-details.html?id=${item.productId}">
              <img src="${item.image_url}" alt="${App.escapeHtml(item.name)}" onerror="App.handleImageError(this)">
            </a>
          </div>

          <div class="cart-item-info">
            <span class="cart-item-category">${App.escapeHtml(item.category || 'Luxe')}</span>
            <h4>
              <a href="product-details.html?id=${item.productId}">${App.escapeHtml(item.name)}</a>
            </h4>
            <div class="cart-item-unit-price">${App.formatINR(item.price)} each</div>
            <div style="font-size: 0.78rem; color: var(--color-text-muted); margin-top: 4px;">
              Max Stock: ${item.stock_quantity}
            </div>
          </div>

          <div>
            <div class="quantity-control">
              <button class="qty-btn" onclick="updateItemQuantity(${item.productId}, ${item.quantity - 1}, ${item.stock_quantity}, ${isAuthenticated})">-</button>
              <input type="number" class="qty-input" value="${item.quantity}" readonly>
              <button class="qty-btn" onclick="updateItemQuantity(${item.productId}, ${item.quantity + 1}, ${item.stock_quantity}, ${isAuthenticated})">+</button>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 1rem;">
            <div class="cart-item-total">${App.formatINR(item.lineTotal)}</div>
            <button class="cart-remove-btn" title="Remove item" onclick="removeItemFromCart(${item.productId}, ${isAuthenticated})">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    const shippingText = shippingFee === 0 ? '<span style="color: var(--color-success); font-weight: 700;">FREE</span>' : App.formatINR(shippingFee);

    container.innerHTML = `
      <div class="cart-layout">
        <!-- Item Rows Table Card -->
        <div class="cart-table-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--color-border);">
            <h3>Bag Items (${items.reduce((acc, i) => acc + i.quantity, 0)})</h3>
            <button class="btn btn-secondary btn-sm" onclick="clearFullCart(${isAuthenticated})">Clear Cart</button>
          </div>

          <div>${itemsHtml}</div>

          <div style="margin-top: 1.5rem;">
            <a href="products.html" class="btn btn-secondary btn-sm">
              ← Continue Shopping
            </a>
          </div>
        </div>

        <!-- Order Summary Card -->
        <div class="summary-card">
          <h3>Order Summary</h3>
          <div class="summary-row">
            <span>Subtotal</span>
            <span>${App.formatINR(subtotal)}</span>
          </div>
          <div class="summary-row">
            <span>Estimated Shipping</span>
            <span>${shippingText}</span>
          </div>
          ${subtotal < 999 ? `
            <div style="font-size: 0.78rem; color: var(--color-accent); margin-bottom: 1rem; background: var(--color-accent-light); padding: 0.4rem 0.6rem; border-radius: var(--radius-sm);">
              💡 Add items worth ${App.formatINR(999 - subtotal)} more for Free Shipping!
            </div>
          ` : ''}
          <div class="summary-row total">
            <span>Grand Total</span>
            <span>${App.formatINR(totalAmount)}</span>
          </div>

          <div style="margin-top: 1.75rem;">
            ${isAuthenticated ? `
              <a href="checkout.html" class="btn btn-primary btn-block btn-lg">
                Proceed to Checkout
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </a>
            ` : `
              <a href="login.html?redirect=checkout.html" class="btn btn-primary btn-block btn-lg">
                Sign In to Checkout
              </a>
              <p style="font-size: 0.78rem; text-align: center; color: var(--color-text-muted); margin-top: 0.5rem;">
                Account required to complete delivery details
              </p>
            `}
          </div>

          <!-- Trust Badges -->
          <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--color-border); font-size: 0.82rem; color: var(--color-text-muted); display: flex; flex-direction: column; gap: 0.5rem;">
            <div>🔒 100% Secure Checkout with SSL</div>
            <div>💵 Cash on Delivery Accepted</div>
            <div>📦 Verified Quality Guarantee</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderEmptyCart(msg) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🛍️</div>
        <h2>Your Shopping Bag is Empty</h2>
        <p style="color: var(--color-text-muted); margin: 0.5rem 0 1.5rem;">
          ${msg || 'Explore our bespoke bridal and contemporary edits to find your next favorite ensemble.'}
        </p>
        <a href="products.html" class="btn btn-primary btn-lg">
          Explore Our Collection
        </a>
      </div>
    `;
    App.updateCartBadge();
  }

  // Attach renderCart to window so action handlers can trigger a clean re-render
  window.refreshCartView = renderCart;
});

/**
 * Updates item quantity
 */
async function updateItemQuantity(productId, newQty, stockQuantity, isAuthenticated) {
  if (newQty > stockQuantity) {
    App.showToast(`Cannot add more. Only ${stockQuantity} in stock.`, 'warning');
    return;
  }

  if (isAuthenticated) {
    try {
      const res = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': App.getCsrfToken() || ''
        },
        body: JSON.stringify({ productId, quantity: newQty })
      });
      const data = await res.json();
      if (data.success) {
        if (window.refreshCartView) {
          await window.refreshCartView();
        } else {
          window.location.reload();
        }
        await App.updateCartBadge();
      } else {
        App.showToast(data.message, 'error');
      }
    } catch (e) {
      App.showToast('Could not update quantity.', 'error');
    }
  } else {
    // Guest cart in localStorage
    let guestCart = App.getGuestCart();
    if (newQty <= 0) {
      guestCart = guestCart.filter((i) => i.productId !== productId);
    } else {
      const item = guestCart.find((i) => i.productId === productId);
      if (item) item.quantity = newQty;
    }
    App.setGuestCart(guestCart);
    if (window.refreshCartView) {
      await window.refreshCartView();
    } else {
      window.location.reload();
    }
    await App.updateCartBadge();
  }
}

/**
 * Removes an item completely from cart
 */
async function removeItemFromCart(productId, isAuthenticated) {
  if (isAuthenticated) {
    try {
      const res = await fetch(`/api/cart/remove/${productId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': App.getCsrfToken() || ''
        }
      });
      const data = await res.json();
      if (data.success) {
        App.showToast('Item removed from cart', 'info');
        if (window.refreshCartView) {
          await window.refreshCartView();
        } else {
          window.location.reload();
        }
        await App.updateCartBadge();
      } else {
        App.showToast(data.message, 'error');
      }
    } catch (e) {
      App.showToast('Could not remove item.', 'error');
    }
  } else {
    let guestCart = App.getGuestCart();
    guestCart = guestCart.filter((i) => i.productId !== productId);
    App.setGuestCart(guestCart);
    App.showToast('Item removed from cart', 'info');
    if (window.refreshCartView) {
      await window.refreshCartView();
    } else {
      window.location.reload();
    }
    await App.updateCartBadge();
  }
}

/**
 * Clears the full shopping cart
 */
async function clearFullCart(isAuthenticated) {
  if (!confirm('Are you sure you want to clear all items from your shopping bag?')) return;

  if (isAuthenticated) {
    try {
      const res = await fetch('/api/cart/clear', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': App.getCsrfToken() || ''
        }
      });
      const data = await res.json();
      if (data.success) {
        App.showToast('Cart cleared', 'info');
        if (window.refreshCartView) {
          await window.refreshCartView();
        } else {
          window.location.reload();
        }
        await App.updateCartBadge();
      }
    } catch (e) {
      App.showToast('Could not clear cart.', 'error');
    }
  } else {
    localStorage.removeItem('samaas_guest_cart');
    App.showToast('Cart cleared', 'info');
    if (window.refreshCartView) {
      await window.refreshCartView();
    } else {
      window.location.reload();
    }
    await App.updateCartBadge();
  }
}
