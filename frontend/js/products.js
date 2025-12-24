document.addEventListener('DOMContentLoaded', () => {
  const productGrid = document.getElementById('productsGrid');
  const userNameEl = document.getElementById('hpUserName');
  const loginLink = document.getElementById('hpLoginLink');
  const logoutBtn = document.getElementById('hpLogoutBtn');
  const adminLink = document.getElementById('hpAdminLink');
  const cartBtn = document.getElementById('hpCartBtn');
  const cartCount = document.getElementById('hpCartCount');
  // Cart is now managed by CartUtils

  // Product view elements
  let pv = {
    catMenu: null,
    minPrice: null,
    maxPrice: null,
    priceLabel: null,
    loading: null,
    empty: null,
    numbers: null,
    prev: null,
    next: null,
  };
  
  let pvState = {
    page: 1,
    pageSize: 40, // Load 40 products at a time for infinite scroll
    sort: 'all',
    categoryId: null,
    min: 0,
    max: 5000000,
    totalPages: 1,
    filteredItems: null, // For subcategory filtering
    isRendering: false, // Prevent duplicate renders
    isLoadingMore: false, // Track if loading more products
    hasMoreProducts: true, // Track if there are more products to load
    allLoadedProducts: [], // Store all loaded products for infinite scroll
  };

  // Load categories from API
  let categories = []; // Initialize categories array
  let categoryNameToId = new Map();

  // Load categories from API - only parent categories
  async function loadCategories() {
    try {
      const res = await window.apiService.get('/categories/main');
      
      if (res?.success) {
        // Handle nested data structure: res.data.data
        const data = res.data?.data || res.data;
        categories = Array.isArray(data) ? data : [];
        // Build category name to ID mapping
        categoryNameToId.clear();
        categories.forEach(cat => {
          categoryNameToId.set(String(cat.name).trim().toLowerCase(), cat.id);
        });
        console.log('Loaded parent categories:', categories.length);
      } else {
        categories = [];
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      categories = [];
    }
  }

  // ===== User session UI =====
  async function syncUserUI(){
    let user = null;
    let token = null;
    
    // Use AuthContextManager if available
    if (typeof window !== 'undefined' && window.authContextManager) {
      user = window.authContextManager.getCurrentUserData();
      token = window.authContextManager.getCurrentToken();
    } else {
      // Fallback to legacy logic
      try { user = JSON.parse(localStorage.getItem('user_data') || localStorage.getItem('admin_data') || localStorage.getItem('user') || 'null'); } catch(_) {}
      token = localStorage.getItem('user_token') || localStorage.getItem('admin_token') || localStorage.getItem('token') || localStorage.getItem('accessToken');
    }
    
    if(!user && token){
      // attempt to get profile
      const res = await window.apiService.get('/users/profile');
      if(res?.success){ 
        user = res.data; 
        // Store in appropriate context
        if (typeof window !== 'undefined' && window.authContextManager) {
          const context = window.authContextManager.getCurrentContext();
          if (context === 'user') {
            localStorage.setItem('user_data', JSON.stringify(user));
          } else if (context === 'admin') {
            localStorage.setItem('admin_data', JSON.stringify(user));
          }
        } else {
          localStorage.setItem('user_data', JSON.stringify(user));
        }
      }
    }
    if(user){
      userNameEl.textContent = user.fullName || user.username || '';
      loginLink.setAttribute('hidden','');
      logoutBtn.removeAttribute('hidden');
      if((user.role||'').toUpperCase() === 'ADMIN') adminLink.removeAttribute('hidden');
    } else {
      userNameEl.textContent = '';
      logoutBtn.setAttribute('hidden','');
      adminLink.setAttribute('hidden','');
      loginLink.removeAttribute('hidden');
    }
  }

  if(logoutBtn){
    logoutBtn.addEventListener('click', ()=>{
      try {
        console.log('Products: User logout clicked');
        console.log('Products: Before logout - user_token:', !!localStorage.getItem('user_token'));
        console.log('Products: Before logout - admin_token:', !!localStorage.getItem('admin_token'));
        
        // Use auth context manager if available
        if (typeof window.authContextManager !== 'undefined') {
          // Only logout user, keep admin context if exists
          window.authContextManager.logoutUser();
        } else {
          // Fallback: only clear user data, keep admin data
          ['user_token','user_data','token','accessToken','refreshToken','user'].forEach(k=>{
            localStorage.removeItem(k); 
            sessionStorage.removeItem(k);
          });
        }
        
        console.log('Products: After logout - user_token:', !!localStorage.getItem('user_token'));
        console.log('Products: After logout - admin_token:', !!localStorage.getItem('admin_token'));
      } catch(error){
        console.error('Products logout error:', error);
      }
      // Refresh current page
      window.location.reload();
    });
  }

  // Cart count is now handled by CartUtils
  cartBtn && cartBtn.addEventListener('click', ()=>{
    window.location.href = 'cart.html';
  });

  function formatVND(n){
    return Number(n||0).toLocaleString('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0});
  }

  // Helper function to create product card with stock status
  function createProductCard(p) {
    const card = document.createElement('div');
    card.className = 'hp-card';
    
    // Check stock status
    const isOutOfStock = (p.stock || 0) <= 0;
    const isLowStock = p.stock > 0 && p.stock < 10;
    
    if (isOutOfStock) {
      card.classList.add('out-of-stock');
      card.style.cursor = 'not-allowed';
    } else {
      card.style.cursor = 'pointer';
    }
    
    // Handle both base64 images (from admin) and regular URLs (from seed)
    const imageUrl = (p.images && p.images[0]?.url) || '';
    let thumb;
    if (!imageUrl) {
      thumb = '/assets/Icon MatFlow.png';
    } else if (imageUrl.startsWith('data:image')) {
      thumb = imageUrl; // Base64 image from admin
    } else {
      thumb = CONFIG.getAssetUrl(imageUrl); // Regular URL from seed
    }
    
    // Stock badge
    const stockBadge = isOutOfStock 
      ? '<div class="stock-badge out-of-stock-badge">Hết hàng</div>' 
      : (isLowStock ? '<div class="stock-badge low-stock-badge">Sắp hết</div>' : '');
    
    card.innerHTML = `
      ${stockBadge}
      <img src="${thumb}" alt="${p.name}" loading="lazy" style="width:100%;height:120px;object-fit:contain;background:#fff;border-radius:8px" onerror="this.src='/assets/Icon MatFlow.png'">
      <div class="name">${p.name}</div>
      <div class="price">${formatVND(p.price)}</div>
      ${isOutOfStock ? '<div class="stock-status-products">Liên hệ để đặt hàng</div>' : ''}
    `;
    
    if (!isOutOfStock) {
      card.addEventListener('click', () => { 
        window.location.href = `product-detail.html?id=${p.id}`; 
      });
    } else {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Sản phẩm này hiện đã hết hàng. Vui lòng liên hệ để được tư vấn sản phẩm tương tự!');
      });
    }
    
    return card;
  }

  // ===== Product view functions =====
  async function loadProductCategories(){
    // Ensure categoryNameToId is loaded first
    if(categoryNameToId.size === 0) {
      const res = await window.apiService.get('/categories/main');
      if(res?.success){
        // Handle nested data structure: res.data.data
        const data = res.data?.data || res.data;
        const backendCats = Array.isArray(data) ? data : [];
        categoryNameToId = new Map(backendCats.map(x=>[String(x.name).trim().toLowerCase(), x.id]));
      }
    }
    
    if(!pv.catMenu) return;
    pv.catMenu.innerHTML = '';
    
    // Create categories without subcategories
    categories.forEach(c => {
      const li = document.createElement('li');
      li.className = 'cat-item';
      const categoryId = categoryNameToId.get(c.name.toLowerCase()) || '';
      
      li.innerHTML = `<a href="#" data-cat="${c.name}" data-cat-id="${categoryId}">${c.name}</a>`;
      
      // Click on main category - navigate to product-all page
      li.querySelector('a').addEventListener('click', (e)=>{
        e.preventDefault();
        const categoryId = e.target.getAttribute('data-cat-id');
        const categoryName = e.target.getAttribute('data-cat');
        if(categoryId) {
          // Navigate to product-all page with category filter
          window.location.href = `product-all.html?category=${categoryId}&name=${encodeURIComponent(categoryName)}`;
        }
      });
      
      pv.catMenu.appendChild(li);
    });
  }

  function filterProductViewBySubCategory(categoryId, subCategoryName){
    // Load all products from the main category first
    const qs = `?categoryId=${encodeURIComponent(categoryId)}&take=1000`;
    window.apiService.get(`/products${qs}`).then(res => {
      if(!res?.success) return;
      // Handle nested data structure: res.data.data
      const data = res.data?.data || res.data;
      const allItems = Array.isArray(data) ? data : [];
      
      // Filter by subcategory using localStorage data
      const filteredItems = allItems.filter(p => {
        const savedSubCategory = getProductSubCategory(p.id);
        return savedSubCategory === subCategoryName;
      });
      
      // Update pvState to reflect the filtered results
      pvState.filteredItems = filteredItems; // Always use filtered items, even if empty
      pvState.categoryId = categoryId; // Set the main category
      pvState.page = 1;
      pvState.allLoadedProducts = [];
      pvState.hasMoreProducts = true;
      renderProductList().then(() => {
        setupInfiniteScroll();
      });
    });
  }

  // Helper function to get subcategory from localStorage (same as in admin.js)
  function getProductSubCategory(productId) {
    try {
      const subCategories = JSON.parse(localStorage.getItem('productSubCategories') || '{}');
      return subCategories[productId] || null;
    } catch (e) {
      console.error('Error getting subCategory:', e);
      return null;
    }
  }

  async function loadProductsDropdown(){
    const dropdown = document.getElementById('productsDropdown');
    if(!dropdown) return;
    
    // Ensure categoryNameToId is loaded first
    if(categoryNameToId.size === 0) {
      const res = await window.apiService.get('/categories/main');
      if(res?.success){
        // Handle nested data structure: res.data.data
        const data = res.data?.data || res.data;
        const backendCats = Array.isArray(data) ? data : [];
        categoryNameToId = new Map(backendCats.map(x=>[String(x.name).trim().toLowerCase(), x.id]));
      }
    }
    
    dropdown.innerHTML = '';
    
    // Add "Tất cả sản phẩm" option
    const allProductsLink = document.createElement('a');
    allProductsLink.className = 'nav-dropdown-item';
    allProductsLink.href = 'products.html';
    allProductsLink.innerHTML = '<i class="fa-solid fa-list"></i> Tất cả sản phẩm';
    dropdown.appendChild(allProductsLink);
    
    // Add separator
    const separator = document.createElement('div');
    separator.style.height = '1px';
    separator.style.background = '#e2e8f0';
    separator.style.margin = '8px 0';
    dropdown.appendChild(separator);
    
    // Add categories
    categories.forEach(c => {
      const categoryId = categoryNameToId.get(c.name.toLowerCase()) || '';
      const link = document.createElement('a');
      link.className = 'nav-dropdown-item';
      link.href = `product-all.html?category=${categoryId}&name=${encodeURIComponent(c.name)}`;
      link.innerHTML = `<i class="fa-solid fa-tag"></i> ${c.name}`;
      dropdown.appendChild(link);
    });
  }

  function buildProductQuery(){
    const params = new URLSearchParams();
    params.set('take', String(pvState.pageSize));
    params.set('page', String(pvState.page)); // Backend uses 'page' not 'skip'
    if(pvState.categoryId) params.set('categoryId', pvState.categoryId);
    // Sort mapping
    switch(pvState.sort){
      case 'oldest': params.set('orderBy', 'createdAt:asc'); break;
      case 'newest': params.set('orderBy', 'createdAt:desc'); break;
      case 'price-high': params.set('orderBy', 'price:desc'); break;
      case 'name-asc': params.set('orderBy', 'name:asc'); break;
      case 'name-desc': params.set('orderBy', 'name:desc'); break;
      case 'bestseller': params.set('orderBy', 'sold:desc'); break;
    }
    // Price range
    params.set('minPrice', String(pvState.min));
    params.set('maxPrice', String(pvState.max));
    return params.toString();
  }

  async function renderProductList(append = false){
    if(!productGrid) return;
    
    // Prevent multiple simultaneous renders
    if(pvState.isRendering) return;
    pvState.isRendering = true;
    
    console.log('=== renderProductList START ===');
    console.log('pvState:', {
      page: pvState.page,
      pageSize: pvState.pageSize,
      append: append,
      allLoadedProducts: pvState.allLoadedProducts.length
    });
    
    if(pv.loading) pv.loading.removeAttribute('hidden');
    if(pv.empty) pv.empty.setAttribute('hidden','');
    if(!append) {
      productGrid.innerHTML = '';
      pvState.allLoadedProducts = [];
    }
    
    let items, meta, total;
    
    try {
      // Check if we have filtered items (from subcategory filter)
      if(pvState.filteredItems !== null) {
        // We have filtered items (could be empty array)
        const allFilteredItems = pvState.filteredItems;
        const startIndex = (pvState.page - 1) * pvState.pageSize;
        const endIndex = startIndex + pvState.pageSize;
        items = allFilteredItems.slice(startIndex, endIndex);
        meta = { total: allFilteredItems.length };
        total = allFilteredItems.length;
      } else {
        // Normal API call
        const qs = buildProductQuery();
        console.log('Products API query:', qs);
        const res = await window.apiService.get(`/products?${qs}`);
        console.log('Products API response:', res);
        console.log('Response structure:', {
          success: res?.success,
          hasData: !!res?.data,
          hasMeta: !!res?.meta,
          dataType: typeof res?.data,
          dataIsArray: Array.isArray(res?.data)
        });
        
        if (!res?.success) {
          console.error('Failed to load products:', res?.message);
          items = [];
          meta = { total: 0 };
          total = 0;
        } else {
          // Try multiple response structures
          let data;
          if (res.data?.data) {
            // Nested structure: {success, data: {data: [...], meta: {...}}, meta: {...}}
            console.log('Using nested data structure: res.data.data');
            data = res.data.data;
            meta = res.data.meta || res.meta || { total: 0 };
          } else if (Array.isArray(res.data)) {
            // Direct array: {success, data: [...], meta: {...}}
            console.log('Using direct array structure: res.data');
            data = res.data;
            meta = res.meta || { total: data.length };
          } else if (res.data && typeof res.data === 'object') {
            // Object with data property
            console.log('Using object structure');
            data = res.data.items || res.data.products || res.data.data || [];
            meta = res.data.meta || res.meta || { total: res.data.total || 0 };
          } else {
            console.error('Unknown response structure!');
            data = [];
            meta = { total: 0 };
          }
          
          items = Array.isArray(data) ? data : [];
          total = Number(meta?.total || 0);
          console.log(`✅ Loaded ${items.length} products, total in DB: ${total}`);
          
          if (items.length > 0) {
            console.log('First product:', items[0]);
          } else if (total > 0) {
            console.warn('⚠️ Total > 0 but items.length = 0. Possible pagination issue.');
          }
        }
      }
      
      // Track loaded products
      if (Array.isArray(items)) {
        pvState.allLoadedProducts = append ? [...pvState.allLoadedProducts, ...items] : items;
        pvState.hasMoreProducts = pvState.allLoadedProducts.length < total;
        console.log(`Loaded: ${items.length} products, Total loaded: ${pvState.allLoadedProducts.length}/${total}, Has more: ${pvState.hasMoreProducts}`);
      }
      
      // Real-time count update
      const countEl = document.getElementById('productCount');
      if(countEl){
        countEl.textContent = String(total);
      }
      
      // Update page info
      const pageInfo = document.getElementById('pageInfo');
      if(pageInfo) {
        const loadedCount = pvState.allLoadedProducts.length;
        pageInfo.textContent = `Đang hiển thị ${loadedCount} / ${total} sản phẩm`;
      }
      
      // Calculate total pages based on actual items count
      pvState.totalPages = Math.max(1, Math.ceil(total / pvState.pageSize));
      
      // Build cards
      if (!Array.isArray(items)) {
        console.error('Items is not an array:', items);
        items = [];
      }
      items.forEach(p=>{
        const card = createProductCard(p);
        productGrid.appendChild(card);
      });
      
      // Hide pagination controls (using infinite scroll instead)
      const paginationContainer = document.getElementById('pvPagination');
      if(paginationContainer) {
        paginationContainer.style.display = 'none';
      }
      if(pv.loading) pv.loading.setAttribute('hidden','');
      if(pv.empty && items.length===0) pv.empty.removeAttribute('hidden');
      
    } catch (error) {
      console.error('Error rendering product list:', error);
      if(pv.empty) pv.empty.removeAttribute('hidden');
    } finally {
      pvState.isRendering = false;
    }
  }

  // Throttle rendering while dragging sliders
  let renderTimer = null;
  function throttleRender(){
    if(renderTimer) clearTimeout(renderTimer);
    renderTimer = setTimeout(()=>{ 
      pvState.page = 1; 
      pvState.allLoadedProducts = [];
      pvState.hasMoreProducts = true;
      renderProductList();
      setupInfiniteScroll();
    }, 250);
  }

  // Load more products for infinite scroll
  async function loadMoreProducts() {
    if (pvState.isLoadingMore || !pvState.hasMoreProducts || pvState.isRendering) {
      console.log('Skipping loadMore:', {
        isLoadingMore: pvState.isLoadingMore,
        hasMoreProducts: pvState.hasMoreProducts,
        isRendering: pvState.isRendering
      });
      return;
    }
    
    console.log('Loading more products...');
    pvState.isLoadingMore = true;
    pvState.page++;
    
    await renderProductList(true); // true = append mode
    
    pvState.isLoadingMore = false;
  }

  // Setup Intersection Observer for infinite scroll
  let infiniteScrollObserver = null;
  function setupInfiniteScroll() {
    // Remove existing observer if any
    if (infiniteScrollObserver) {
      infiniteScrollObserver.disconnect();
    }

    // Create a sentinel element at the bottom of the grid
    let sentinel = document.getElementById('infiniteScrollSentinel');
    if (!sentinel) {
      sentinel = document.createElement('div');
      sentinel.id = 'infiniteScrollSentinel';
      sentinel.style.height = '10px';
      sentinel.style.width = '100%';
      
      // Insert after the products grid
      const gridParent = productGrid.parentElement;
      gridParent.insertBefore(sentinel, productGrid.nextSibling);
    }

    // Create Intersection Observer
    infiniteScrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && pvState.hasMoreProducts) {
            console.log('Sentinel visible, loading more products...');
            loadMoreProducts();
          }
        });
      },
      {
        root: null, // viewport
        rootMargin: '200px', // Start loading 200px before reaching the sentinel
        threshold: 0
      }
    );

    infiniteScrollObserver.observe(sentinel);
    console.log('Infinite scroll observer setup complete');
  }


  // Initialize product view controls
  function initProductView() {
    pv.catMenu = document.getElementById('productCatMenu');
    pv.minPrice = document.getElementById('pvMinPrice');
    pv.maxPrice = document.getElementById('pvMaxPrice');
    pv.priceLabel = document.getElementById('pvPriceRange');
    pv.loading = document.getElementById('pvLoading');
    pv.empty = document.getElementById('pvNoProducts');
    pv.numbers = document.getElementById('pvNumbers');
    pv.prev = document.getElementById('pvPrev');
    pv.next = document.getElementById('pvNext');
    pv.reset = document.getElementById('pvResetBtn');

    // Sort buttons
    document.querySelectorAll('.filter-tabs .filter-tab').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        document.querySelectorAll('.filter-tabs .filter-tab').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        pvState.sort = btn.getAttribute('data-filter') || 'all';
        pvState.page = 1;
        pvState.filteredItems = null; // Clear any subcategory filter when changing sort
        pvState.allLoadedProducts = [];
        pvState.hasMoreProducts = true;
        renderProductList();
        setupInfiniteScroll();
      });
    });

    // Price sliders
    const updatePrice = ()=>{
      const a = Math.min(parseInt(pv.minPrice.value,10), parseInt(pv.maxPrice.value,10));
      const b = Math.max(parseInt(pv.minPrice.value,10), parseInt(pv.maxPrice.value,10));
      pvState.min = a; pvState.max = b;
      pv.priceLabel.textContent = `${formatVND(a)} - ${formatVND(b)}`;
    };
    pv.minPrice.addEventListener('input', ()=>{ updatePrice(); throttleRender(); });
    pv.maxPrice.addEventListener('input', ()=>{ updatePrice(); throttleRender(); });

    // Pagination
    pv.prev.addEventListener('click', ()=>{ 
      if(pvState.page>1){ 
        pvState.page--; 
        window.scrollTo({ top: 0, behavior: 'smooth' });
        renderProductList(); 
      } 
    });
    pv.next.addEventListener('click', ()=>{ 
      if(pvState.page<pvState.totalPages){ 
        pvState.page++; 
        window.scrollTo({ top: 0, behavior: 'smooth' });
        renderProductList(); 
      } 
    });

    // Reset all filters
    pv.reset && pv.reset.addEventListener('click', ()=>{
      pvState.page = 1;
      pvState.pageSize = 40;
      pvState.sort = 'all';
      pvState.categoryId = null;
      pvState.min = 0;
      pvState.max = 5000000;
      pvState.filteredItems = null; // Clear filtered items
      pvState.allLoadedProducts = [];
      pvState.hasMoreProducts = true;
      if(pv.minPrice) pv.minPrice.value = '0';
      if(pv.maxPrice) pv.maxPrice.value = '5000000';
      if(pv.priceLabel) pv.priceLabel.textContent = `${formatVND(0)} - ${formatVND(5000000)}`;
      // Clear category active state (if any implemented)
      document.querySelectorAll('.filter-tabs .filter-tab').forEach(b=>b.classList.remove('active'));
      const def = document.querySelector('.filter-tabs .filter-tab[data-filter="all"]') || document.querySelector('.filter-tabs .filter-tab');
      if(def) def.classList.add('active');
      renderProductList();
      setupInfiniteScroll();
    });

    // Load categories for product page
    loadProductCategories();
  }

  // Handle URL parameters and hash
  function handleURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('category');
    const subcategory = urlParams.get('subcategory');
    const hash = window.location.hash.replace('#', '');
    
    if (categoryId) {
      pvState.categoryId = categoryId;
    }
    
    if (subcategory) {
      // Filter by subcategory
      if (categoryId) {
        filterProductViewBySubCategory(categoryId, subcategory);
      }
    } else if (hash.startsWith('product-detail&id=')) {
      // Handle product detail from hash - redirect to new page
      const productId = hash.split('&id=')[1];
      if (productId) {
        window.location.href = `product-detail.html?id=${productId}`;
      }
    }
    // Don't render here - let the main initialization handle it
  }

  // Auto refresh products so new items from admin appear
  // Note: Commented out to avoid disrupting infinite scroll experience
  // Users can manually refresh if needed
  /*
  setInterval(()=>{
    if (!pvState.isRendering) {
      renderProductList();
    }
  }, 15000);
  */

  // Initialize everything
  async function initAll() {
    // 1. Handle URL params first (to set state like categoryId)
    handleURLParams();
    
    // 2. Sync user UI
    syncUserUI();
    
    // 3. Load categories
    await loadCategories();
    
    // 4. Initialize product view
    initProductView();
    
    // 5. Load dropdown
    loadProductsDropdown();
    
    // 6. Render products
    await renderProductList();
    
    // 7. Setup infinite scroll AFTER rendering
    setupInfiniteScroll();
  }
  
  // Add CSS styles for out of stock products
  const style = document.createElement('style');
  style.textContent = `
    .hp-card.out-of-stock {
      opacity: 0.6;
      filter: grayscale(40%);
      position: relative;
    }
    
    .hp-card.out-of-stock:hover {
      opacity: 0.7;
      transform: none;
    }
    
    .stock-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      z-index: 10;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .out-of-stock-badge {
      background: rgba(220, 38, 38, 0.95);
      color: white;
    }
    
    .low-stock-badge {
      background: rgba(249, 115, 22, 0.95);
      color: white;
    }
    
    .stock-status-products {
      font-size: 0.85rem;
      color: #dc2626;
      font-weight: 500;
      margin-top: 4px;
      text-align: center;
    }
    
    .hp-card.out-of-stock .stock-status-products {
      color: #dc2626;
      font-weight: 600;
    }
  `;
  document.head.appendChild(style);

  // Start initialization
  initAll().catch(error => {
    console.error('Products initialization error:', error);
  });
});

// category url
const params = new URLSearchParams(window.location.search);
const selectedCategory = params.get("category"); 

// slugify function to normalize category names
function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // remove accents
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
//filter products by category
const filtered = allProducts.filter(p => {
  return slugify(p.categoryName) === selectedCategory;
});

renderProducts(filtered);



