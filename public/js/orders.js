/**
 * SaMaa'S Collection - Order History & Order Confirmation Controller
 * Handles post-checkout confirmation display, status badge formatting, and invoice modal.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const successBanner = document.getElementById('orderSuccessBanner');
  const ordersContainer = document.getElementById('ordersListContainer');
  const orderModal = document.getElementById('orderModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalOrderTitle = document.getElementById('modalOrderTitle');
  const modalOrderBody = document.getElementById('modalOrderBody');

  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');
  const isNewOrder = urlParams.get('new') === 'true';

  // 1. Verify Authentication
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();

    if (!data.success || !data.authenticated) {
      renderUnauthenticatedPrompt();
      return;
    }
  } catch (e) {
    renderUnauthenticatedPrompt();
    return;
  }

  // 2. If orderId query param exists, show confirmation banner
  if (orderId) {
    await renderSingleOrderConfirmation(orderId, isNewOrder);
  }

  // 3. Load Order History
  await loadOrderHistory();

  // Modal Close Listeners
  modalCloseBtn.addEventListener('click', () => orderModal.classList.remove('open'));
  orderModal.addEventListener('click', (e) => {
    if (e.target === orderModal) orderModal.classList.remove('open');
  });

  function renderUnauthenticatedPrompt() {
    ordersContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔒</div>
        <h2>Sign In Required</h2>
        <p style="color: var(--color-text-muted); margin: 0.5rem 0 1.5rem;">
          Please sign in to your SaMaa'S account to view your past orders and track current shipments.
        </p>
        <a href="login.html?redirect=orders.html" class="btn btn-primary">Sign In to Continue</a>
      </div>
    `;
  }

  /**
   * Renders the confirmation card for a newly placed or selected order
   */
  async function renderSingleOrderConfirmation(id, isNew) {
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();

      if (data.success && data.order) {
        const o = data.order;
        const items = data.items || [];

        successBanner.style.display = 'block';
        successBanner.innerHTML = `
          <div style="background: var(--color-surface); border: 2px solid var(--color-primary); border-radius: var(--radius-md); padding: 2.5rem; box-shadow: var(--shadow-md);">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
              <div style="width: 52px; height: 52px; border-radius: 50%; background: var(--color-success-bg); color: var(--color-success); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 700;">
                ✓
              </div>
              <div>
                <span class="badge badge-success">Order Confirmed</span>
                <h2 style="font-size: 1.6rem; margin-top: 0.25rem;">Thank You, ${App.escapeHtml(o.customer_name)}!</h2>
              </div>
            </div>

            <p style="color: var(--color-text-body); margin-bottom: 1.5rem; font-size: 0.95rem;">
              Your order has been placed with order reference <strong>#${App.escapeHtml(o.order_number)}</strong>. Our team is hand-inspecting and preparing your items for delivery.
            </p>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; background: var(--color-surface-soft); padding: 1.25rem; border-radius: var(--radius-sm); margin-bottom: 1.75rem;">
              <div>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 700;">Delivery Address:</span>
                <div style="font-size: 0.88rem; color: var(--color-text-main); margin-top: 2px;">
                  ${App.escapeHtml(o.shipping_address)}, ${App.escapeHtml(o.city)}, ${App.escapeHtml(o.state)} - ${App.escapeHtml(o.postal_code)}
                </div>
              </div>
              <div>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 700;">Payment Method:</span>
                <div style="font-size: 0.88rem; color: var(--color-text-main); margin-top: 2px;">
                  ${App.escapeHtml(o.payment_method)} (${App.formatINR(o.total_amount)})
                </div>
              </div>
              <div>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 700;">Order Status:</span>
                <div style="margin-top: 2px;">
                  ${renderStatusBadge(o.order_status)}
                </div>
              </div>
            </div>

            <h4 style="font-size: 1.05rem; margin-bottom: 1rem;">Ordered Items:</h4>
            <div style="border: 1px solid var(--color-border); border-radius: var(--radius-sm); overflow: hidden; margin-bottom: 1.5rem;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                <thead>
                  <tr style="background: var(--color-surface-soft); border-bottom: 1px solid var(--color-border);">
                    <th style="padding: 0.75rem 1rem;">Item</th>
                    <th style="padding: 0.75rem 1rem;">Price</th>
                    <th style="padding: 0.75rem 1rem; text-align: center;">Qty</th>
                    <th style="padding: 0.75rem 1rem; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map((i) => `
                    <tr style="border-bottom: 1px solid var(--color-border);">
                      <td style="padding: 0.75rem 1rem; font-weight: 600;">${App.escapeHtml(i.product_name)}</td>
                      <td style="padding: 0.75rem 1rem;">${App.formatINR(i.unit_price)}</td>
                      <td style="padding: 0.75rem 1rem; text-align: center;">${i.quantity}</td>
                      <td style="padding: 0.75rem 1rem; text-align: right; font-weight: 600;">${App.formatINR(i.subtotal)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div style="display: flex; justify-content: flex-end;">
              <div style="min-width: 240px; font-size: 0.92rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
                  <span>Subtotal:</span>
                  <span>${App.formatINR(o.subtotal)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
                  <span>Shipping:</span>
                  <span>${o.shipping_fee === 0 ? 'FREE' : App.formatINR(o.shipping_fee)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1.15rem; border-top: 1px solid var(--color-border); padding-top: 0.5rem; color: var(--color-text-main);">
                  <span>Grand Total:</span>
                  <span>${App.formatINR(o.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        `;

        // Smooth scroll to banner if freshly ordered
        if (isNew) {
          successBanner.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } catch (e) {
      console.warn('Could not load confirmation details:', e.message);
    }
  }

  /**
   * Loads full order history list for the customer
   */
  async function loadOrderHistory() {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();

      if (data.success && data.orders && data.orders.length > 0) {
        ordersContainer.innerHTML = `
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Order Ref #</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${data.orders.map((o) => `
                  <tr>
                    <td style="font-weight: 700; color: var(--color-text-main);">#${App.escapeHtml(o.order_number)}</td>
                    <td>${new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>${o.total_items} item(s)</td>
                    <td style="font-weight: 700;">${App.formatINR(o.total_amount)}</td>
                    <td><span class="badge badge-blush">${App.escapeHtml(o.payment_method)}</span></td>
                    <td>${renderStatusBadge(o.order_status)}</td>
                    <td>
                      <button class="btn btn-secondary btn-sm" onclick="viewOrderModal(${o.id})">
                        View Details
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else {
        ordersContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📦</div>
            <h2>No Orders Placed Yet</h2>
            <p style="color: var(--color-text-muted); margin: 0.5rem 0 1.5rem;">
              When you complete an order, its invoice, tracking status, and delivery milestones will appear here.
            </p>
            <a href="products.html" class="btn btn-primary">Start Shopping</a>
          </div>
        `;
      }
    } catch (e) {
      ordersContainer.innerHTML = '<p style="color: var(--color-danger);">Error loading order history.</p>';
    }
  }

  function renderStatusBadge(status) {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'delivered':
        return '<span class="badge badge-success">Delivered</span>';
      case 'shipped':
        return '<span class="badge badge-blush">Shipped</span>';
      case 'processing':
        return '<span class="badge badge-warning">Processing</span>';
      case 'cancelled':
        return '<span class="badge badge-danger">Cancelled</span>';
      default:
        return '<span class="badge badge-warning">Pending Confirmation</span>';
    }
  }

  // Global modal opener
  window.viewOrderModal = async function(id) {
    orderModal.classList.add('open');
    modalOrderTitle.textContent = `Order Details #${id}`;
    modalOrderBody.innerHTML = '<p style="text-align: center; padding: 2rem;">Loading invoice...</p>';

    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();

      if (data.success && data.order) {
        const o = data.order;
        const items = data.items || [];

        modalOrderTitle.textContent = `Order #${App.escapeHtml(o.order_number)}`;
        modalOrderBody.innerHTML = `
          <div style="font-size: 0.9rem; margin-bottom: 1.25rem;">
            <div><strong>Status:</strong> ${renderStatusBadge(o.order_status)}</div>
            <div style="margin-top: 4px;"><strong>Placed On:</strong> ${new Date(o.created_at).toLocaleString('en-IN')}</div>
            <div style="margin-top: 4px;"><strong>Shipping To:</strong> ${App.escapeHtml(o.customer_name)}, ${App.escapeHtml(o.shipping_address)}, ${App.escapeHtml(o.city)} - ${App.escapeHtml(o.postal_code)} (Phone: ${App.escapeHtml(o.customer_phone)})</div>
            <div style="margin-top: 4px;"><strong>Payment:</strong> ${App.escapeHtml(o.payment_method)} (${App.escapeHtml(o.payment_status)})</div>
            ${o.notes ? `<div style="margin-top: 4px;"><strong>Notes:</strong> <em>${App.escapeHtml(o.notes)}</em></div>` : ''}
          </div>

          <div style="border: 1px solid var(--color-border); border-radius: var(--radius-sm); overflow: hidden; margin-bottom: 1.25rem;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem;">
              <thead style="background: var(--color-surface-soft);">
                <tr>
                  <th style="padding: 0.6rem 0.8rem; text-align: left;">Item</th>
                  <th style="padding: 0.6rem 0.8rem;">Price</th>
                  <th style="padding: 0.6rem 0.8rem; text-align: center;">Qty</th>
                  <th style="padding: 0.6rem 0.8rem; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((i) => `
                  <tr style="border-bottom: 1px solid var(--color-border);">
                    <td style="padding: 0.6rem 0.8rem;">${App.escapeHtml(i.product_name)}</td>
                    <td style="padding: 0.6rem 0.8rem;">${App.formatINR(i.unit_price)}</td>
                    <td style="padding: 0.6rem 0.8rem; text-align: center;">${i.quantity}</td>
                    <td style="padding: 0.6rem 0.8rem; text-align: right; font-weight: 600;">${App.formatINR(i.subtotal)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="display: flex; justify-content: flex-end; font-size: 0.95rem;">
            <div style="min-width: 220px;">
              <div style="display: flex; justify-content: space-between;">
                <span>Subtotal:</span>
                <span>${App.formatINR(o.subtotal)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                <span>Shipping:</span>
                <span>${o.shipping_fee === 0 ? 'FREE' : App.formatINR(o.shipping_fee)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: 700; margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--color-border);">
                <span>Grand Total:</span>
                <span>${App.formatINR(o.total_amount)}</span>
              </div>
            </div>
          </div>
        `;
      }
    } catch (e) {
      modalOrderBody.innerHTML = '<p style="color: var(--color-danger);">Failed to load order details.</p>';
    }
  };
});
