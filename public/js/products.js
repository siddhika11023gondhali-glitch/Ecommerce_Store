/**
 * SaMaa'S Collection - Products Listing Page Controller
 * Handles search, category filtering, sorting, responsive grid rendering, and cart addition.
 */

document.addEventListener('DOMContentLoaded', () => {
  const productsGrid = document.getElementById('productsGrid');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const categoryPillsContainer = document.getElementById('categoryPills');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const productCountLabel = document.getElementById('productCountLabel');

  // Parse initial query params from URL
  const urlParams = new URLSearchParams(window.location.search);
  let activeCategory = urlParams.get('category') || 'All';
  let searchQuery = urlParams.get('search') || '';
  let activeSort = urlParams.get('sort') || 'featured';

  if (searchQuery) searchInput.value = searchQuery;
  if (activeSort) sortSelect.value = activeSort;

  // Initialize
  loadCategories();
  fetchAndRenderProducts();

  // Search Input Event (Debounced)
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = e.target.value.trim();
      updateUrlAndFetch();
    }, 300);
  });

  // Sort Selection Event
  sortSelect.addEventListener('change', (e) => {
    activeSort = e.target.value;
    updateUrlAndFetch();
  });

  // Reset Filters Event
  resetFiltersBtn.addEventListener('click', () => {
    activeCategory = 'All';
    searchQuery = '';
    activeSort = 'featured';
    searchInput.value = '';
    sortSelect.value = 'featured';

    // Reset pills active state
    document.querySelectorAll('.category-pill').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.category === 'All');
    });

    updateUrlAndFetch();
  });

  /**
   * Loads category list from API to render category pills
   */
  async function loadCategories() {
    try {
      const res = await fetch('/api/products/categories');
      const data = await res.json();
      if (data.success && data.categories) {
        let pillsHtml = `
          <button class="category-pill ${activeCategory === 'All' ? 'active' : ''}" data-category="All">
            All Categories
          </button>
        `;

        data.categories.forEach((cat) => {
          const isActive = activeCategory === cat ? 'active' : '';
          pillsHtml += `
            <button class="category-pill ${isActive}" data-category="${App.escapeHtml(cat)}">
              ${App.escapeHtml(cat)}
            </button>
          `;
        });

        categoryPillsContainer.innerHTML = pillsHtml;

        // Attach click listeners
        categoryPillsContainer.querySelectorAll('.category-pill').forEach((btn) => {
          btn.addEventListener('click', () => {
            categoryPillsContainer.querySelectorAll('.category-pill').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.dataset.category;
            updateUrlAndFetch();
          });
        });
      }
    } catch (e) {
      console.warn('Could not load categories:', e.message);
    }
  }

  /**
   * Updates browser address bar query and reloads products
   */
  function updateUrlAndFetch() {
    const params = new URLSearchParams();
    if (activeCategory && activeCategory !== 'All') params.set('category', activeCategory);
    if (searchQuery) params.set('search', searchQuery);
    if (activeSort && activeSort !== 'featured') params.set('sort', activeSort);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);

    fetchAndRenderProducts();
  }

  /**
   * Fetches products from /api/products
   */
  async function fetchAndRenderProducts() {
    productsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🌸</div>
        <div style="font-weight: 600; color: var(--color-text-main);">Loading curated styles...</div>
      </div>
    `;

    try {
      const params = new URLSearchParams();
      if (activeCategory && activeCategory !== 'All') params.set('category', activeCategory);
      if (searchQuery) params.set('search', searchQuery);
      if (activeSort) params.set('sort', activeSort);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.products) {
        renderProducts(data.products);
      } else {
        renderEmptyState(data.message || 'No products found.');
      }
    } catch (err) {
      renderEmptyState('Could not load products. Please ensure the server and database are running.');
    }
  }

  /**
   * Renders the product cards grid
   */
  function renderProducts(products) {
    if (products.length === 0) {
      renderEmptyState();
      productCountLabel.textContent = 'Showing 0 products';
      return;
    }

    productCountLabel.textContent = `Showing ${products.length} product${products.length === 1 ? '' : 's'}`;

    productsGrid.innerHTML = products.map((p) => {
      const inStock = p.stock_quantity > 0;
      let stockHtml = '';
      if (!inStock) {
        stockHtml = '<span class="product-stock out-of-stock">Out of Stock</span>';
      } else if (p.stock_quantity <= 5) {
        stockHtml = `<span class="product-stock low-stock">Only ${p.stock_quantity} left</span>`;
      } else {
        stockHtml = `<span class="product-stock in-stock">In Stock (${p.stock_quantity})</span>`;
      }

      return `
        <article class="product-card">
          <div class="product-media">
            <a href="product-details.html?id=${p.id}">
              <img src="${p.image_url}" alt="${App.escapeHtml(p.name)}" onerror="App.handleImageError(this)">
            </a>
            <div class="product-badges">
              ${p.is_featured ? '<span class="badge badge-sage">Featured</span>' : ''}
              ${p.stock_quantity <= 5 && inStock ? '<span class="badge badge-warning">Low Stock</span>' : ''}
            </div>
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
              ${stockHtml}
            </div>
          </div>
          <div class="product-actions">
            <button class="btn btn-primary btn-block btn-sm" 
                    ${!inStock ? 'disabled' : ''}
                    onclick="handleCatalogAddToCart(${p.id}, '${App.escapeHtml(p.name.replace(/'/g, "\\'"))}', ${p.price}, '${p.image_url}', ${p.stock_quantity})">
              ${inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  /**
   * Renders an empty state when no products match filters
   */
  function renderEmptyState(customMsg) {
    productCountLabel.textContent = 'Showing 0 products';
    productsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">🛍️</div>
        <h3>No Products Found</h3>
        <p style="color: var(--color-text-muted); margin: 0.5rem 0 1.5rem;">
          ${customMsg || "We couldn't find any products matching your current search or category filter."}
        </p>
        <button class="btn btn-primary" onclick="document.getElementById('resetFiltersBtn').click()">
          Reset All Filters
        </button>
      </div>
    `;
  }
});

/**
 * Global handler for catalog Add to Cart button
 */
async function handleCatalogAddToCart(id, name, price, img, stock) {
  const user = await App.getUser();

  if (user) {
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': App.getCsrfToken() || ''
        },
        body: JSON.stringify({ productId: id, quantity: 1 })
      });
      const data = await res.json();

      if (data.success) {
        App.showToast(`"${name}" added to cart!`, 'success');
        await App.updateCartBadge();
      } else {
        App.showToast(data.message, 'error');
      }
    } catch (e) {
      App.showToast('Could not add item to cart.', 'error');
    }
  } else {
    // Guest cart in localStorage
    const guestCart = App.getGuestCart();
    const existing = guestCart.find((item) => item.productId === id);

    if (existing) {
      if (existing.quantity >= stock) {
        App.showToast(`Only ${stock} items available in stock.`, 'warning');
        return;
      }
      existing.quantity += 1;
    } else {
      guestCart.push({
        productId: id,
        name: name,
        price: price,
        image_url: img,
        stock_quantity: stock,
        quantity: 1
      });
    }

    App.setGuestCart(guestCart);
    App.showToast(`"${name}" added to cart!`, 'success');
    await App.updateCartBadge();
  }
}
