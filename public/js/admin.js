/**
 * SaMaa'S Collection - Administrator Dashboard Controller
 * Enforces role authorization, metric reporting, product CRUD, inventory updates, and order status handling.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const adminWorkspace = document.getElementById('adminWorkspace');
  const accessDeniedBanner = document.getElementById('accessDeniedBanner');

  const statProducts = document.getElementById('statProducts');
  const statOrders = document.getElementById('statOrders');
  const statRevenue = document.getElementById('statRevenue');
  const statLowStock = document.getElementById('statLowStock');

  const productsTableBody = document.getElementById('productsTableBody');
  const stockTableBody = document.getElementById('stockTableBody');
  const ordersTableBody = document.getElementById('ordersTableBody');
  const orderStatusFilter = document.getElementById('orderStatusFilter');

  const productFormModal = document.getElementById('productFormModal');
  const productForm = document.getElementById('productForm');
  const productModalTitle = document.getElementById('productModalTitle');
  const openAddProductModalBtn = document.getElementById('openAddProductModalBtn');
  const closeProductModalBtn = document.getElementById('closeProductModalBtn');

  let cachedProducts = [];

  // 1. Authorize Admin Role
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();

    if (!data.success || !data.authenticated || data.user.role !== 'admin') {
      adminWorkspace.style.display = 'none';
      accessDeniedBanner.style.display = 'block';
      return;
    }
  } catch (e) {
    adminWorkspace.style.display = 'none';
    accessDeniedBanner.style.display = 'block';
    return;
  }

  // 2. Initialize Dashboard Data
  initTabs();
  loadStats();
  loadProducts();
  loadOrders();

  // Tab Switching
  function initTabs() {
    const tabButtons = document.querySelectorAll('.admin-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabButtons.forEach((b) => b.classList.remove('active'));
        tabPanes.forEach((p) => (p.style.display = 'none'));

        btn.classList.add('active');
        const targetPane = document.getElementById(btn.dataset.tab);
        if (targetPane) targetPane.style.display = 'block';

        if (btn.dataset.tab === 'tabStock') loadStockControls();
        if (btn.dataset.tab === 'tabOrders') loadOrders();
      });
    });
  }

  /**
   * Loads operational counters
   */
  async function loadStats() {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success && data.stats) {
        statProducts.textContent = data.stats.totalProducts;
        statOrders.textContent = data.stats.totalOrders;
        statRevenue.textContent = App.formatINR(data.stats.totalRevenue);
        statLowStock.textContent = data.stats.lowStockCount;
      }
    } catch (e) {
      console.warn('Could not load admin stats:', e.message);
    }
  }

  /**
   * Loads all products for administration
   */
  async function loadProducts() {
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();

      if (data.success && data.products) {
        cachedProducts = data.products;
        renderProductsTable(data.products);
      }
    } catch (e) {
      productsTableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--color-danger);">Failed to load products.</td></tr>';
    }
  }

  function renderProductsTable(products) {
    if (products.length === 0) {
      productsTableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem;">No products in catalog yet.</td></tr>';
      return;
    }

    productsTableBody.innerHTML = products.map((p) => `
      <tr>
        <td>#${p.id}</td>
        <td>
          <img src="${p.image_url}" alt="${App.escapeHtml(p.name)}" style="width: 44px; height: 52px; object-fit: cover; border-radius: 4px;" onerror="App.handleImageError(this)">
        </td>
        <td style="font-weight: 600; max-width: 220px;">${App.escapeHtml(p.name)}</td>
        <td><span class="badge badge-blush">${App.escapeHtml(p.category)}</span></td>
        <td style="font-weight: 700;">${App.formatINR(p.price)}</td>
        <td>
          <span class="badge ${p.stock_quantity <= 5 ? 'badge-warning' : 'badge-success'}">
            ${p.stock_quantity}
          </span>
        </td>
        <td>${p.is_featured ? '⭐ Yes' : 'No'}</td>
        <td>
          <span class="badge ${p.is_active ? 'badge-success' : 'badge-danger'}">
            ${p.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary btn-sm" onclick="openEditProductModal(${p.id})">Edit</button>
            ${p.is_active ? `
              <button class="btn btn-secondary btn-sm" style="color: var(--color-danger);" onclick="deactivateProduct(${p.id}, '${App.escapeHtml(p.name.replace(/'/g, "\\'"))}')">Deactivate</button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  /**
   * Loads quick stock management view
   */
  function loadStockControls() {
    if (cachedProducts.length === 0) {
      stockTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No products available.</td></tr>';
      return;
    }

    stockTableBody.innerHTML = cachedProducts.map((p) => `
      <tr>
        <td>
          <div style="font-weight: 600;">${App.escapeHtml(p.name)}</div>
          <span style="font-size: 0.75rem; color: var(--color-text-muted);">ID: #${p.id}</span>
        </td>
        <td>${App.escapeHtml(p.category)}</td>
        <td>
          <span id="stockBadge_${p.id}" class="badge ${p.stock_quantity <= 5 ? 'badge-warning' : 'badge-success'}">
            ${p.stock_quantity} in stock
          </span>
        </td>
        <td>
          <input type="number" id="quickStock_${p.id}" class="form-input" value="${p.stock_quantity}" min="0" style="width: 90px; padding: 0.4rem 0.6rem;">
        </td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="saveStockQuantity(${p.id})">
            Update Stock
          </button>
        </td>
      </tr>
    `).join('');
  }

  /**
   * Loads customer orders with status filter
   */
  async function loadOrders() {
    const status = orderStatusFilter.value;
    try {
      const res = await fetch(`/api/admin/orders?status=${status}`);
      const data = await res.json();

      if (data.success && data.orders) {
        renderOrdersTable(data.orders);
      }
    } catch (e) {
      ordersTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--color-danger);">Failed to load orders.</td></tr>';
    }
  }

  function renderOrdersTable(orders) {
    if (orders.length === 0) {
      ordersTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No orders match filter.</td></tr>';
      return;
    }

    ordersTableBody.innerHTML = orders.map((o) => `
      <tr>
        <td style="font-weight: 700;">#${App.escapeHtml(o.order_number)}</td>
        <td>
          <div style="font-weight: 600;">${App.escapeHtml(o.customer_name)}</div>
          <div style="font-size: 0.78rem; color: var(--color-text-muted);">${App.escapeHtml(o.customer_phone)}</div>
        </td>
        <td>${new Date(o.created_at).toLocaleDateString('en-IN')}</td>
        <td style="font-weight: 700;">${App.formatINR(o.total_amount)}</td>
        <td><span class="badge badge-blush">${App.escapeHtml(o.payment_method)}</span></td>
        <td>
          <span class="badge ${getStatusBadgeClass(o.order_status)}">
            ${o.order_status.toUpperCase()}
          </span>
        </td>
        <td>
          <select class="form-select" style="padding: 0.35rem 0.6rem; font-size: 0.82rem; width: auto;" onchange="updateOrderStatus(${o.id}, this.value)">
            <option value="pending" ${o.order_status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="processing" ${o.order_status === 'processing' ? 'selected' : ''}>Processing</option>
            <option value="shipped" ${o.order_status === 'shipped' ? 'selected' : ''}>Shipped</option>
            <option value="delivered" ${o.order_status === 'delivered' ? 'selected' : ''}>Delivered</option>
            <option value="cancelled" ${o.order_status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
      </tr>
    `).join('');
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case 'delivered': return 'badge-success';
      case 'cancelled': return 'badge-danger';
      case 'shipped': return 'badge-blush';
      default: return 'badge-warning';
    }
  }

  orderStatusFilter.addEventListener('change', loadOrders);

  // Modal Open / Close
  openAddProductModalBtn.addEventListener('click', () => {
    productForm.reset();
    document.getElementById('formProductId').value = '';
    document.getElementById('formProductActive').value = '1';
    productModalTitle.textContent = 'Add New Product';
    productFormModal.classList.add('open');
  });

  closeProductModalBtn.addEventListener('click', () => {
    productFormModal.classList.remove('open');
  });

  productFormModal.addEventListener('click', (e) => {
    if (e.target === productFormModal) productFormModal.classList.remove('open');
  });

  // Modal Form Submit (Create or Update Product)
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('formProductId').value;
    const name = document.getElementById('formProductName').value.trim();
    const category = document.getElementById('formProductCategory').value;
    const price = parseFloat(document.getElementById('formProductPrice').value);
    const stock_quantity = parseInt(document.getElementById('formProductStock').value, 10);
    const is_featured = parseInt(document.getElementById('formProductFeatured').value, 10);
    const is_active = parseInt(document.getElementById('formProductActive').value, 10);
    const image_url = document.getElementById('formProductImage').value.trim();
    const description = document.getElementById('formProductDesc').value.trim();

    if (!name || !image_url || !description || isNaN(price) || isNaN(stock_quantity)) {
      App.showToast('Please fill out all mandatory product fields.', 'error');
      return;
    }

    const payload = {
      name,
      category,
      price,
      stock_quantity,
      is_featured,
      is_active,
      image_url,
      description
    };

    const isEdit = Boolean(id);
    const url = isEdit ? `/api/admin/products/${id}` : '/api/admin/products';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': App.getCsrfToken() || ''
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        App.showToast(data.message, 'success');
        productFormModal.classList.remove('open');
        await loadProducts();
        await loadStats();
      } else {
        App.showToast(data.message, 'error');
      }
    } catch (err) {
      App.showToast('Error saving product.', 'error');
    }
  });

  // Global window functions for table action buttons
  window.openEditProductModal = function (id) {
    const p = cachedProducts.find((item) => item.id === id);
    if (!p) return;

    document.getElementById('formProductId').value = p.id;
    document.getElementById('formProductName').value = p.name;
    document.getElementById('formProductCategory').value = p.category;
    document.getElementById('formProductPrice').value = p.price;
    document.getElementById('formProductStock').value = p.stock_quantity;
    document.getElementById('formProductFeatured').value = p.is_featured ? '1' : '0';
    document.getElementById('formProductActive').value = p.is_active ? '1' : '0';
    document.getElementById('formProductImage').value = p.image_url;
    document.getElementById('formProductDesc').value = p.description;

    productModalTitle.textContent = `Edit Product #${p.id}`;
    productFormModal.classList.add('open');
  };

  window.deactivateProduct = async function (id, name) {
    if (!confirm(`Are you sure you want to deactivate "${name}" from the active catalog? Historical orders will remain preserved.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': App.getCsrfToken() || ''
        }
      });
      const data = await res.json();
      if (data.success) {
        App.showToast(data.message, 'info');
        await loadProducts();
        await loadStats();
      } else {
        App.showToast(data.message, 'error');
      }
    } catch (e) {
      App.showToast('Could not deactivate product.', 'error');
    }
  };

  window.saveStockQuantity = async function (id) {
    const input = document.getElementById(`quickStock_${id}`);
    const newQty = parseInt(input.value, 10);

    if (isNaN(newQty) || newQty < 0) {
      App.showToast('Please enter a valid stock number.', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/admin/products/${id}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': App.getCsrfToken() || ''
        },
        body: JSON.stringify({ stock_quantity: newQty })
      });
      const data = await res.json();
      if (data.success) {
        App.showToast(`Stock for product #${id} updated to ${newQty}`, 'success');
        await loadProducts();
        await loadStats();
        loadStockControls();
      } else {
        App.showToast(data.message, 'error');
      }
    } catch (e) {
      App.showToast('Could not update inventory level.', 'error');
    }
  };

  window.updateOrderStatus = async function (orderId, newStatus) {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': App.getCsrfToken() || ''
        },
        body: JSON.stringify({ order_status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        App.showToast(`Order #${orderId} status set to "${newStatus}"`, 'success');
        await loadOrders();
        await loadStats();
      } else {
        App.showToast(data.message, 'error');
      }
    } catch (e) {
      App.showToast('Failed to update order status.', 'error');
    }
  };
});
