/**
 * SaMaa'S Collection - Product Details Controller
 * Handles detailed product rendering, quantity selection, stock validation, and related items.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('productDetailsWrapper');
  const relatedGrid = document.getElementById('relatedGrid');
  const breadcrumbCat = document.getElementById('breadcrumbCategory');
  const breadcrumbProd = document.getElementById('breadcrumbProduct');

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    renderNotFound('No product ID provided in request.');
    return;
  }

  try {
    const res = await fetch(`/api/products/${productId}`);
    const data = await res.json();

    if (!data.success || !data.product) {
      renderNotFound(data.message || 'Product not found.');
      return;
    }

    const product = data.product;
    document.title = `${product.name} | SaMaa'S Collection`;

    // Update Breadcrumbs
    breadcrumbCat.innerHTML = `<a href="products.html?category=${encodeURIComponent(product.category)}">${App.escapeHtml(product.category)}</a>`;
    breadcrumbProd.textContent = product.name;

    // Render Product Details
    renderProductDetails(product);

    // Render Related Products
    if (data.related && data.related.length > 0) {
      relatedGrid.innerHTML = data.related.map(renderRelatedCard).join('');
    } else {
      document.querySelector('section[style*="border-top"]').style.display = 'none';
    }

  } catch (err) {
    renderNotFound('Error loading product information. Please verify your connection.');
  }

  function renderNotFound(msg) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h2>Product Unavailable</h2>
        <p style="color: var(--color-text-muted); margin: 0.5rem 0 1.5rem;">${App.escapeHtml(msg)}</p>
        <a href="products.html" class="btn btn-primary">Return to Catalog</a>
      </div>
    `;
    relatedGrid.parentElement.style.display = 'none';
  }

  function renderProductDetails(p) {
    const inStock = p.stock_quantity > 0;
    const maxQty = Math.max(1, p.stock_quantity);

    let stockBadge = '';
    if (!inStock) {
      stockBadge = '<span class="badge badge-danger" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">Currently Out of Stock</span>';
    } else if (p.stock_quantity <= 5) {
      stockBadge = `<span class="badge badge-warning" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">Low Stock: Only ${p.stock_quantity} Left</span>`;
    } else {
      stockBadge = `<span class="badge badge-success" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">In Stock (${p.stock_quantity} available)</span>`;
    }

    container.innerHTML = `
      <div class="product-details-grid">
        <!-- Visual Gallery Column -->
        <div class="details-gallery">
          <div class="details-main-image">
            <img src="${p.image_url}" alt="${App.escapeHtml(p.name)}" onerror="App.handleImageError(this)">
          </div>
        </div>

        <!-- Information & Actions Column -->
        <div class="details-info">
          <div>
            <span class="badge badge-blush" style="margin-bottom: 0.5rem;">${App.escapeHtml(p.category)}</span>
            <h1 class="details-title">${App.escapeHtml(p.name)}</h1>
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem;">
              <span style="color: #E6A23C; font-weight: 700;">★ ${p.rating || '4.8'}</span>
              <span style="color: var(--color-text-muted); font-size: 0.88rem;">&bull; Verified Customer Reviews</span>
            </div>
          </div>

          <div class="details-price-badge">
            <span class="details-price">${App.formatINR(p.price)}</span>
            ${stockBadge}
          </div>

          <div class="details-desc">
            <h4 style="font-size: 1rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Product Description</h4>
            <p>${App.escapeHtml(p.description)}</p>
          </div>

          <!-- Quantity Selection & Add to Cart -->
          ${inStock ? `
            <div>
              <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--color-text-main);">
                Select Quantity:
              </label>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div class="quantity-control">
                  <button type="button" class="qty-btn" id="btnDec">-</button>
                  <input type="number" id="detailQtyInput" class="qty-input" value="1" min="1" max="${maxQty}" readonly>
                  <button type="button" class="qty-btn" id="btnInc">+</button>
                </div>
                <button type="button" class="btn btn-primary btn-lg" id="btnAddToCart" style="flex: 1;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                  Add to Cart
                </button>
              </div>
            </div>
          ` : `
            <div style="background: var(--color-danger-bg); border: 1px solid rgba(192, 57, 43, 0.2); padding: 1.25rem; border-radius: var(--radius-md);">
              <h4 style="color: var(--color-danger); margin-bottom: 0.25rem;">Currently Sold Out</h4>
              <p style="font-size: 0.88rem; color: var(--color-text-body);">This masterpiece is temporarily out of inventory. Please browse similar items below or check back soon.</p>
            </div>
          `}

          <!-- Product Assurance Highlights -->
          <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1.25rem; margin-top: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.88rem;">
              <span>🌿</span>
              <span><strong>Pure Craftsmanship:</strong> Authentic hand-finished textures and detailing.</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.88rem;">
              <span>📦</span>
              <span><strong>Signature Packaging:</strong> Delivered in protective luxury presentation box.</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.88rem;">
              <span>💵</span>
              <span><strong>Cash on Delivery:</strong> Available across pan-India pin codes.</span>
            </div>
          </div>
        </div>
      </div>
    `;

    if (inStock) {
      const qtyInput = document.getElementById('detailQtyInput');
      const btnDec = document.getElementById('btnDec');
      const btnInc = document.getElementById('btnInc');
      const btnAddToCart = document.getElementById('btnAddToCart');

      btnDec.addEventListener('click', () => {
        let val = parseInt(qtyInput.value, 10);
        if (val > 1) qtyInput.value = val - 1;
      });

      btnInc.addEventListener('click', () => {
        let val = parseInt(qtyInput.value, 10);
        if (val < maxQty) {
          qtyInput.value = val + 1;
        } else {
          App.showToast(`Maximum available stock is ${maxQty}.`, 'warning');
        }
      });

      btnAddToCart.addEventListener('click', async () => {
        const qty = parseInt(qtyInput.value, 10);
        await addDetailedItemToCart(p, qty);
      });
    }
  }

  async function addDetailedItemToCart(p, qty) {
    const user = await App.getUser();

    if (user) {
      try {
        const res = await fetch('/api/cart/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': App.getCsrfToken() || ''
          },
          body: JSON.stringify({ productId: p.id, quantity: qty })
        });
        const data = await res.json();

        if (data.success) {
          App.showToast(`Added ${qty} item(s) to your cart!`, 'success');
          await App.updateCartBadge();
        } else {
          App.showToast(data.message, 'error');
        }
      } catch (e) {
        App.showToast('Could not add to cart.', 'error');
      }
    } else {
      const guestCart = App.getGuestCart();
      const existing = guestCart.find((item) => item.productId === p.id);

      if (existing) {
        if (existing.quantity + qty > p.stock_quantity) {
          App.showToast(`Cannot add ${qty} more. Total in cart exceeds available stock (${p.stock_quantity}).`, 'warning');
          return;
        }
        existing.quantity += qty;
      } else {
        guestCart.push({
          productId: p.id,
          name: p.name,
          price: p.price,
          image_url: p.image_url,
          stock_quantity: p.stock_quantity,
          quantity: qty
        });
      }

      App.setGuestCart(guestCart);
      App.showToast(`Added ${qty} item(s) to your cart!`, 'success');
      await App.updateCartBadge();
    }
  }

  function renderRelatedCard(p) {
    return `
      <article class="product-card">
        <div class="product-media">
          <a href="product-details.html?id=${p.id}">
            <img src="${p.image_url}" alt="${App.escapeHtml(p.name)}" onerror="App.handleImageError(this)">
          </a>
        </div>
        <div class="product-body">
          <div class="product-meta">
            <span class="product-category">${App.escapeHtml(p.category)}</span>
            <span class="product-rating">★ ${p.rating || '4.8'}</span>
          </div>
          <h3 class="product-name">
            <a href="product-details.html?id=${p.id}">${App.escapeHtml(p.name)}</a>
          </h3>
          <div class="product-price-row">
            <span class="product-price">${App.formatINR(p.price)}</span>
          </div>
        </div>
        <div class="product-actions">
          <a href="product-details.html?id=${p.id}" class="btn btn-secondary btn-block btn-sm">
            View Details
          </a>
        </div>
      </article>
    `;
  }
});
