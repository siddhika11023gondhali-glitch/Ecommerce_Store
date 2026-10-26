/**
 * SaMaa'S Collection - Checkout & Order Submission Controller
 * Handles authentication verification, address pre-fill, server-side transactional checkout, and redirection.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('checkoutForm');
  const itemsContainer = document.getElementById('checkoutItemsList');
  const summarySubtotal = document.getElementById('summarySubtotal');
  const summaryShipping = document.getElementById('summaryShipping');
  const summaryTotal = document.getElementById('summaryTotal');
  const placeOrderBtn = document.getElementById('placeOrderBtn');

  // 1. Verify User Authentication
  try {
    const authRes = await fetch('/api/auth/me');
    const authData = await authRes.json();

    if (!authData.success || !authData.authenticated) {
      window.location.href = 'login.html?redirect=checkout.html';
      return;
    }

    // Pre-fill user profile if available
    prefillUserProfile();
  } catch (e) {
    window.location.href = 'login.html?redirect=checkout.html';
    return;
  }

  // 2. Load Cart Data from Server
  await loadCartSummary();

  async function prefillUserProfile() {
    try {
      const res = await fetch('/api/auth/profile');
      const data = await res.json();
      if (data.success && data.profile) {
        const p = data.profile;
        if (p.name) document.getElementById('customerName').value = p.name;
        if (p.phone) document.getElementById('customerPhone').value = p.phone;
        if (p.address) document.getElementById('shippingAddress').value = p.address;
      }
    } catch (e) {
      // Ignore prefill errors
    }
  }

  async function loadCartSummary() {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();

      if (!data.success || !data.items || data.items.length === 0) {
        itemsContainer.innerHTML = `
          <div style="text-align: center; padding: 2rem 0; color: var(--color-danger);">
            Your shopping bag is empty.
          </div>
        `;
        placeOrderBtn.disabled = true;
        setTimeout(() => {
          window.location.href = 'cart.html';
        }, 1500);
        return;
      }

      // Render Items Preview
      itemsContainer.innerHTML = data.items.map((item) => `
        <div style="display: flex; gap: 0.75rem; margin-bottom: 0.85rem; padding-bottom: 0.85rem; border-bottom: 1px solid var(--color-border); align-items: center;">
          <div style="width: 45px; height: 55px; border-radius: 4px; overflow: hidden; background: #EEE; flex-shrink: 0;">
            <img src="${item.image_url}" alt="${App.escapeHtml(item.name)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="App.handleImageError(this)">
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${App.escapeHtml(item.name)}
            </div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">
              Qty: ${item.quantity} &times; ${App.formatINR(item.price)}
            </div>
          </div>
          <div style="font-weight: 700; font-size: 0.92rem;">
            ${App.formatINR(item.lineTotal)}
          </div>
        </div>
      `).join('');

      summarySubtotal.textContent = App.formatINR(data.subtotal);
      summaryShipping.innerHTML = data.shippingFee === 0
        ? '<span style="color: var(--color-success); font-weight: 700;">FREE</span>'
        : App.formatINR(data.shippingFee);
      summaryTotal.textContent = App.formatINR(data.totalAmount);

    } catch (e) {
      itemsContainer.innerHTML = '<p style="color: var(--color-danger);">Error fetching cart items.</p>';
    }
  }

  // 3. Handle Order Submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const customerName = document.getElementById('customerName').value.trim();
      const customerPhone = document.getElementById('customerPhone').value.trim();
      const shippingAddress = document.getElementById('shippingAddress').value.trim();
      const city = document.getElementById('city').value.trim();
      const state = document.getElementById('state').value.trim();
      const postalCode = document.getElementById('postalCode').value.trim();
      const notes = document.getElementById('orderNotes').value.trim();

      // Client-side validations
      if (!customerName || !customerPhone || !shippingAddress || !city || !state || !postalCode) {
        App.showToast('Please complete all mandatory delivery fields (*)', 'error');
        return;
      }

      const phoneRegex = /^[0-9+\s\-]{7,15}$/;
      if (!phoneRegex.test(customerPhone)) {
        App.showToast('Please enter a valid phone number (7-15 digits)', 'error');
        return;
      }

      placeOrderBtn.disabled = true;
      placeOrderBtn.innerHTML = `
        <span style="display: inline-block; animation: spin 1s infinite linear;">⏳</span>
        Securing Inventory &amp; Placing Order...
      `;

      try {
        const res = await fetch('/api/orders/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': App.getCsrfToken() || ''
          },
          body: JSON.stringify({
            customerName,
            customerPhone,
            shippingAddress,
            city,
            state,
            postalCode,
            paymentMethod: 'Cash on Delivery',
            notes
          })
        });

        const data = await res.json();

        if (data.success && data.order) {
          // Clear any local remnants & update counter
          localStorage.removeItem('samaas_guest_cart');
          App.updateCartBadge();
          App.showToast(data.message || 'Order confirmed!', 'success');

          // Redirect to confirmation page
          setTimeout(() => {
            window.location.href = `orders.html?orderId=${data.order.id}&new=true`;
          }, 600);
        } else {
          App.showToast(data.message || 'Order placement failed.', 'error');
          placeOrderBtn.disabled = false;
          placeOrderBtn.textContent = 'Confirm & Place Order (Cash on Delivery)';
        }
      } catch (err) {
        App.showToast('Server communication error. Please try again.', 'error');
        placeOrderBtn.disabled = false;
        placeOrderBtn.textContent = 'Confirm & Place Order (Cash on Delivery)';
      }
    });
  }
});
