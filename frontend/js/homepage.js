document.addEventListener('DOMContentLoaded', () => {
  const catMenu = document.getElementById('catMenu');
  let productGrid = document.getElementById('productsGrid');
  const modal = document.getElementById('hpProductModal');
  const closeModalBtn = document.getElementById('closeModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalPrice = document.getElementById('modalPrice');
  const qtyInput = document.getElementById('qtyInput');
  const addToCartBtn = document.getElementById('addToCart');
  const reviewList = document.getElementById('reviewList');
  const reviewRating = document.getElementById('reviewRating');
  const reviewContent = document.getElementById('reviewContent');
  const submitReview = document.getElementById('submitReview');
  const userNameEl = document.getElementById('hpUserName');
  const loginLink = document.getElementById('hpLoginLink');
  const logoutBtn = document.getElementById('hpLogoutBtn');
  const adminLink = document.getElementById('hpAdminLink');
  const cartBtn = document.getElementById('hpCartBtn');
  const cartCount = document.getElementById('hpCartCount');
  let activeProduct = null;
  let isRenderingSections = false;
  let categories = []; // Initialize categories array
  // ===== Simple view router (data-link/data-view + hash) =====
  const views = Array.from(document.querySelectorAll('[data-view]'));
  const navLinks = Array.from(document.querySelectorAll('[data-link]'));

  function setActiveLink(name){
    navLinks.forEach(a => {
      const isActive = (a.getAttribute('data-link') === name) || (a.getAttribute('href') === `#${name}`);
      a.classList.toggle('active', isActive);
    });
  }

  function showView(name){
    // Default: hide all [data-view], then unhide the requested one
    views.forEach(v => v.setAttribute('hidden',''));
    const target = document.querySelector(`[data-view="${name}"]`);
    if(target){
      target.removeAttribute('hidden');
    }
    setActiveLink(name);
    // Scroll to top for better UX
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch(_) { window.scrollTo(0,0); }
  }

  // Nav clicks
  navLinks.forEach(a => {
    a.addEventListener('click', (e) => {
      const name = a.getAttribute('data-link');
      if(!name) return;
      // Keep URL hash in sync without full page reload
      e.preventDefault();
      if(location.hash !== `#${name}`){ location.hash = `#${name}`; }
      // Do not call showView here to avoid double renders; hashchange will handle it.
    });
  });

  // Respond to direct hash access and hash changes
  function handleInitialRoute(){
    const hash = (location.hash || '').replace('#','');
    if(hash){ 
      showView(hash); 
    } else { 
      showView('home'); 
    }
  }
  window.addEventListener('hashchange', handleInitialRoute);
  // Handle initial page load
  window.addEventListener('load', handleInitialRoute);
  // ===== User session UI =====
  async function syncUserUI(){
    let user = null;
    let token = null;
    
    // Use AuthContextManager if available
    if (typeof window !== 'undefined' && window.authContextManager) {
      // Force switch to user context for user pages
      window.authContextManager.forceSwitchToUser();
      
      user = window.authContextManager.getCurrentUserData();
      token = window.authContextManager.getCurrentToken();
    } else {
      // Fallback to legacy logic - only use user data for user pages
      try { user = JSON.parse(localStorage.getItem('user_data') || localStorage.getItem('user') || 'null'); } catch(_) {}
      token = localStorage.getItem('user_token') || localStorage.getItem('token') || localStorage.getItem('accessToken');
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
      } catch(error){
        console.error('Logout error:', error);
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

  // Load categories from API
  // var categories = []; // Moved to top of function scope

  async function loadCategories(){
    try {
      // Load only parent categories from API
      const res = await window.apiService.get('/categories/main');
      
      if (res?.success) {

        let data = res.data;
        if (data && typeof data === 'object' && data.success && data.data) {

          data = data.data;
        }
        categories = Array.isArray(data) ? data : [];
      } else {
        categories = [];
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      categories = [];
    }


    if (catMenu) {
      catMenu.innerHTML = '';
      if (!Array.isArray(categories)) {
        categories = [];
      }
    }
    if (catMenu) {
      categories.forEach(c => {
        const li = document.createElement('li');
        li.className = 'cat-item';
        li.innerHTML = `<span>${c.name}</span><span>›</span>`;
        const sub = document.createElement('div');
        sub.className = 'cat-children';
        sub.innerHTML = '<div class="hp-cat loading">Đang tải...</div>';
        li.appendChild(sub);
        

        li.addEventListener('mouseenter', async () => {
          if (sub.querySelector('.loading')) {
            try {
              const res = await window.apiService.get(`/categories/${c.id}/subcategories`);
              let childrenCategories = [];
              if (res?.success && res.data) {
                childrenCategories = Array.isArray(res.data) ? res.data : [];
              } else if (Array.isArray(res)) {
                childrenCategories = res;
              }
              
              if (childrenCategories.length > 0) {
                sub.innerHTML = childrenCategories.map(child => 
                  `<div class="hp-cat" data-subcategory="${child.name}" data-category-id="${child.id}">${child.name}</div>`
                ).join('');
              } else {
                sub.innerHTML = '<div class="hp-cat">Chưa có danh mục con</div>';
              }
            } catch (error) {
              console.error('Error loading children categories:', error);
              sub.innerHTML = '<div class="hp-cat">Lỗi tải danh mục con</div>';
            }
          }
        });
      

      li.addEventListener('click', (e)=>{

        e.stopPropagation();
        filterByCategoryName(c.name);
      });
      

      sub.addEventListener('click', (e)=>{
        e.stopPropagation();
        const subCategory = e.target.getAttribute('data-subcategory');
        const categoryId = e.target.getAttribute('data-category-id');
        if(subCategory && categoryId) {

          filterByCategoryId(categoryId, subCategory);
        }
      });
      
        catMenu.appendChild(li);
      });
    }


    const res = await window.apiService.get('/categories/main');
    if(res?.success){

      const data = res.data?.data || res.data;
      const backendCats = Array.isArray(data) ? data : [];
      categoryNameToId = new Map(backendCats.map(x=>[String(x.name).trim().toLowerCase(), x.id]));
      renderCategorySections(backendCats);
    }
    

    loadProductsDropdown();
    

    renderCategorySections(categories);
  }

  async function loadProductsDropdown(){
    const dropdown = document.getElementById('productsDropdown');
    if(!dropdown) return;
    

    if(categories.length === 0 || categoryNameToId.size === 0) {
      const res = await window.apiService.get('/categories/main');
      if(res?.success){

        let data = res.data;
        if (data && typeof data === 'object' && data.success && data.data) {

          data = data.data;
        }
        const backendCats = Array.isArray(data) ? data : [];
        categories = backendCats; // Update categories array
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
      
      // Check if categoryId is empty and try alternative names
      if (!categoryId) {
        console.warn(`No categoryId found for: ${c.name}`);
        // Try without special characters
        const altName = c.name.replace(/[-\s]/g, '').toLowerCase();
        const altCategoryId = categoryNameToId.get(altName);
        if (altCategoryId) {
        }
      }
      
      const link = document.createElement('a');
      link.className = 'nav-dropdown-item';
      link.href = `product-all.html?category=${categoryId}&name=${encodeURIComponent(c.name)}`;
      link.innerHTML = `<i class="fa-solid fa-tag"></i> ${c.name}`;
      dropdown.appendChild(link);
    });
  }

  let categoryNameToId = new Map();
  function filterByCategoryName(name){
    const id = categoryNameToId.get(String(name).trim().toLowerCase());
    if(id){ 
      // Navigate to product-all page with category filter
      window.location.href = `product-all.html?category=${id}&name=${encodeURIComponent(name)}`;
    }
  }

  function filterByCategoryId(categoryId, categoryName){
    if(categoryId){ 
      // Navigate to product-all page with category filter
      window.location.href = `product-all.html?category=${categoryId}&name=${encodeURIComponent(categoryName)}`;
    }
  }

  function filterBySubCategory(mainCategoryName, subCategoryName){
    const mainCategoryId = categoryNameToId.get(String(mainCategoryName).trim().toLowerCase());
    if(mainCategoryId){ 
      // Navigate to product-all page with subcategory filter
      window.location.href = `product-all.html?category=${mainCategoryId}&name=${encodeURIComponent(mainCategoryName)}&subcategory=${encodeURIComponent(subCategoryName)}`;
    }
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
    
    const thumb = (p.images && p.images[0]?.url) || 'https://via.placeholder.com/400x300?text=MatFlow';
    
    // Stock badge
    const stockBadge = isOutOfStock 
      ? '<div class="stock-badge out-of-stock-badge">Hết hàng</div>' 
      : (isLowStock ? '<div class="stock-badge low-stock-badge">Sắp hết</div>' : '');
    
    card.innerHTML = `
      ${stockBadge}
      <img src="${thumb}" alt="${p.name}" loading="lazy" style="width:100%;height:140px;object-fit:contain;background:#fff;border-radius:8px" onerror="this.src='https://via.placeholder.com/400x300?text=MatFlow'">
      <div class="name">${p.name}</div>
      <div class="price">${formatVND(p.price)}</div>
      ${isOutOfStock ? '<div class="stock-status-home">Liên hệ để đặt hàng</div>' : ''}
    `;
    
    if (!isOutOfStock) {
      card.addEventListener('click', () => openProduct(p));
    } else {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Sản phẩm này hiện đã hết hàng. Vui lòng liên hệ để được tư vấn sản phẩm tương tự!');
      });
    }
    
    return card;
  }

  async function loadProducts(categoryId){
    const qs = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}&take=16` : `?take=16`;
    const res = await window.apiService.get(`/products${qs}`);
    if(!res?.success) return;
    // Handle apiService wrapped response: {success: true, data: {success: true, data: [...]}}
    let data = res.data;
    if (data && typeof data === 'object' && data.success && data.data) {
      // Unwrap the nested response
      data = data.data;
    }
    const items = Array.isArray(data) ? data : [];
    if(!productGrid){ productGrid = document.getElementById('productsGrid'); }
    if(!productGrid) return;
    productGrid.innerHTML = '';
    items.forEach(p => {
      const card = createProductCard(p);
      productGrid.appendChild(card);
    });
  }

  async function loadProductsWithSubCategory(categoryId, subCategoryName){
    // Load products from the main category (optimized to 100 max)
    const qs = `?categoryId=${encodeURIComponent(categoryId)}&take=100`;
    const res = await window.apiService.get(`/products${qs}`);
    if(!res?.success) return;
    // Handle apiService wrapped response: {success: true, data: {success: true, data: [...]}}
    let data = res.data;
    if (data && typeof data === 'object' && data.success && data.data) {
      // Unwrap the nested response
      data = data.data;
    }
    const allItems = Array.isArray(data) ? data : [];
    
    // Filter by subcategory using localStorage data
    const filteredItems = allItems.filter(p => {
      const savedSubCategory = getProductSubCategory(p.id);
      return savedSubCategory === subCategoryName;
    });
    
    if(!productGrid){ productGrid = document.getElementById('productsGrid'); }
    if(!productGrid) return;
    productGrid.innerHTML = '';
    
    // Show filtered results or all if no subcategory match
    const itemsToShow = filteredItems.length > 0 ? filteredItems : allItems;
    
    itemsToShow.forEach(p => {
      const card = createProductCard(p);
      productGrid.appendChild(card);
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


  function sectionTemplate(title, categoryId){
    const wrapper = document.createElement('section');
    wrapper.className = 'hp-products';
    wrapper.innerHTML = `
      <div class="hp-products-head">
        <h2>${title}</h2>
        <button class="hp-btn" data-view-all="${categoryId||''}">Xem tất cả</button>
      </div>
      <div class="hp-card-grid" data-grid-for="${categoryId||'all'}"></div>
    `;
    return wrapper;
  }

  async function renderCategorySections(categories){
    const container = document.getElementById('dynSections');
    if(!container) {
      console.warn('dynSections container not found - skipping category sections render');
      return;
    }
    
    // Prevent multiple simultaneous renders
    if(isRenderingSections) {
      return;
    }
    isRenderingSections = true;
    
    try {
      // Clear previously rendered sections to avoid duplicates
      container.innerHTML = '';
      
      // Check if categories is an array
      if (!Array.isArray(categories)) {
        console.error('Categories is not an array in renderCategorySections:', categories);
        categories = [];
      }
      
      // Track rendered categories to avoid duplicates
      const renderedCategories = new Set();
      
      for(const c of categories){
        // Skip if already rendered
        if(renderedCategories.has(c.id)) continue;
        renderedCategories.add(c.id);
      const sec = sectionTemplate(c.name, c.id);
      container.appendChild(sec);
      const grid = sec.querySelector(`[data-grid-for="${c.id}"]`);
      const res = await window.apiService.get(`/products?categoryId=${encodeURIComponent(c.id)}&take=8`);
      if(res?.success){
        // Handle apiService wrapped response: {success: true, data: {success: true, data: [...]}}
        let data = res.data;
        if (data && typeof data === 'object' && data.success && data.data) {
          // Unwrap the nested response
          data = data.data;
        }
        const items = Array.isArray(data) ? data : [];
        items.forEach(p=>{
          const card = createProductCard(p);
          grid.appendChild(card);
        });
      }
      const viewAllBtn = sec.querySelector('[data-view-all]');
      viewAllBtn.addEventListener('click',()=>{
        // Navigate to product-all page with category filter
        window.location.href = `product-all.html?category=${c.id}&name=${encodeURIComponent(c.name)}`;
      });
    }
    } finally {
      isRenderingSections = false;
    }
  }

  function openProduct(p){
    // Redirect to product detail page
    if(p?.id){ 
      window.location.href = `product-detail.html?id=${p.id}`;
    }
  }

  async function renderReviews(productId){
    const res = await window.apiService.get(`/reviews/product/${productId}`);
    if(!res?.success){ reviewList.innerHTML = ''; return; }
    reviewList.innerHTML = '';
    res.data.forEach(r => {
      const row = document.createElement('div');
      row.className = 'hp-review';
      row.textContent = `${'⭐'.repeat(r.rating)} ${r.user?.fullName || r.user?.username || ''}: ${r.content}`;
      reviewList.appendChild(row);
    });
  }

  closeModalBtn && closeModalBtn.addEventListener('click',()=>modal.setAttribute('hidden',''));
  addToCartBtn && addToCartBtn.addEventListener('click', async ()=>{
    const qty = Math.max(1, parseInt(qtyInput.value||'1',10));
    if (activeProduct && activeProduct.id) {
      const success = await CartUtils.addToCart(activeProduct.id, qty, activeProduct.stock);
      if (success) {
        alert('Đã thêm vào giỏ');
      }
      // Validation errors are shown by CartUtils.addToCart
    }
  });

  submitReview && submitReview.addEventListener('click', async ()=>{
    const rating = Math.max(1, Math.min(5, parseInt(reviewRating.value||'5',10)));
    const content = (reviewContent.value||'').trim();
    if(!content) return alert('Vui lòng nhập nội dung');
    const res = await window.apiService.post('/reviews', { productId: activeProduct.id, rating, content });
    if(res?.success){ reviewContent.value=''; await renderReviews(activeProduct.id); } else { alert(res?.message||'Lỗi gửi đánh giá'); }
  });

  // Simple checkout from cart to backend
  window.checkoutCart = async function(customer){
    const items = cart.slice();
    if(items.length===0) return alert('Giỏ hàng trống');
    const res = await window.apiService.post('/orders', { customer, items });
    if(res?.success){ localStorage.removeItem('cart'); alert('Đặt hàng thành công'); } else { alert(res?.message||'Đặt hàng thất bại'); }
  }

  // Simple product display for testing
  async function loadSimpleProducts() {
    const container = document.getElementById('dynSections');
    if (!container) {
      return;
    }
    
    container.innerHTML = '<div style="padding: 20px; text-align: center;">Đang tải sản phẩm...</div>';
    
    try {
      // Use cached API call if available
      const cachedCall = window.performanceUtils?.cachedAPICall || window.apiService.get.bind(window.apiService);
      const res = await cachedCall('/products?take=12');
      
      if (res?.success) {
        // Handle apiService wrapped response: {success: true, data: {success: true, data: [...]}}
        let data = res.data;
        if (data && typeof data === 'object' && data.success && data.data) {
          // Unwrap the nested response
          data = data.data;
        }
        const items = Array.isArray(data) ? data : [];
        
        if (items.length > 0) {
          container.innerHTML = `
          <section class="hp-products">
            <div class="hp-products-head">
              <h2>Sản phẩm mới nhất</h2>
            </div>
            <div class="hp-card-grid" id="simpleProductsGrid"></div>
          </section>
        `;
        
        const grid = document.getElementById('simpleProductsGrid');
        if (grid) {
          items.forEach(p => {
            const card = createProductCard(p);
            grid.appendChild(card);
          });
        } else {
          console.error('Simple products grid not found');
        }
        } else {
          container.innerHTML = '<div style="padding: 20px; text-align: center;">Không có sản phẩm nào</div>';
        }
      } else {
        container.innerHTML = '<div style="padding: 20px; text-align: center;">Không có sản phẩm nào</div>';
      }
    } catch (error) {
      console.error('Homepage.js - Error loading simple products:', error);
      container.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Lỗi khi tải sản phẩm</div>';
    }
  }

  // Add CSS styles for out of stock products (same as product-all)
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
    
    .stock-status-home {
      font-size: 0.85rem;
      color: #dc2626;
      font-weight: 500;
      margin-top: 4px;
      text-align: center;
    }
    
    .hp-card.out-of-stock .stock-status-home {
      color: #dc2626;
      font-weight: 600;
    }
  `;
  document.head.appendChild(style);

  loadCategories();
  loadSimpleProducts(); // Add simple product loading
  syncUserUI();
  handleInitialRoute();
  
  // Debug: Test API directly
  setTimeout(async () => {
    try {
      // Test API calls removed for performance
    } catch (error) {
      console.error('Direct API test error:', error);
    }
  }, 2000);

  // Auto refresh disabled to prevent console spam and data loss
  // setInterval(async ()=>{
  //   // Only refresh product sections if on homepage
  //   const homeView = document.querySelector('[data-view="home"]');
  //   if (homeView && !homeView.hasAttribute('hidden')) {
  //     // Get fresh categories from backend and render sections
  //     try {
  //       const res = await window.apiService.get('/categories');
  //       if(res?.success){
  //         // Handle apiService wrapped response: {success: true, data: {success: true, data: [...]}}
  //         let data = res.data;
  //         if (data && typeof data === 'object' && data.success && data.data) {
  //           // Unwrap the nested response
  //           data = data.data;
  //         }
  //         const backendCats = Array.isArray(data) ? data : [];
  //         // Update category mapping
  //         categoryNameToId = new Map(backendCats.map(x=>[String(x.name).trim().toLowerCase(), x.id]));
  //         // Render sections (this will clear and re-render)
  //         renderCategorySections(backendCats);
  //       }
  //     } catch (error) {
  //       console.error('Error refreshing categories:', error);
  //     }
  //   }
  // }, 15000);
  
});
document.addEventListener('DOMContentLoaded', () => {
  try {
    // thumbs (bên phải)
    const thumbs = new Swiper('.hero-thumbs', {
      direction: 'vertical',     // dọc
      slidesPerView: 3,
      spaceBetween: 12,
      watchSlidesProgress: true,
      breakpoints: {
        0:   { direction: 'horizontal', slidesPerView: 4, spaceBetween: 10 },
        992: { direction: 'vertical',   slidesPerView: 3, spaceBetween: 12 }
      }
    });

    // main (bên trái)
    const main = new Swiper('.hero-main', {
      loop: true,
      speed: 700,
      autoplay: { delay: 3500, disableOnInteraction: false },
      pagination: { el: '.hero-main .swiper-pagination', clickable: true },
      navigation: {
        nextEl: '.hero-main .swiper-button-next',
        prevEl: '.hero-main .swiper-button-prev'
      },
      thumbs: { swiper: thumbs }
    });
  } catch (e) {
    console.warn('Không khởi tạo Swiper được:', e);
  }
});
const heroSwiper = new Swiper('.heroSwiper', {
  loop: true,
  autoplay: {
    delay: 4000,
    disableOnInteraction: false
  },
  pagination: {
    el: '.heroSwiper .swiper-pagination',
    clickable: true
  },
  navigation: {
    nextEl: '.heroSwiper .swiper-button-next',
    prevEl: '.heroSwiper .swiper-button-prev'
  }
});
// ====== HOMEPAGE TESTIMONIALS – đọc dữ liệu từ feedback ======
const FEEDBACK_STORAGE_KEY = "matflowFeedback";

document.addEventListener("DOMContentLoaded", () => {
  // ... các init khác của homepage của bạn (nếu có)

  renderHomepageTestimonials();
});

function renderHomepageTestimonials() {
  const container = document.getElementById("hpTestimonialsList");
  if (!container) return;

  let allFeedback = [];
  try {
    allFeedback = JSON.parse(localStorage.getItem(FEEDBACK_STORAGE_KEY)) || [];
  } catch (e) {
    allFeedback = [];
  }

  fillTestimonials(container, allFeedback);
}

function fillTestimonials(container, allFeedback) {
  container.innerHTML = "";

  if (!allFeedback.length) {
    container.innerHTML = `
      <article class="hp-testimonial-card">
        <p class="hp-testimonial-content">
          Chưa có đánh giá nào. Hãy là người đầu tiên để lại cảm nhận về MatFlow!
        </p>
        <a href="../pages/feedback.html" class="hp-link-view-all">
          Gửi đánh giá ngay
        </a>
      </article>
    `;
    return;
  }

  // Lấy 3 feedback mới nhất
  const latest = [...allFeedback]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  const cards = latest
    .map(fb => {
      const name = fb.name || "Khách hàng";
      const title = mapTypeLabelHome(fb.type);
      const content = fb.message || "";
      const rating = Number(fb.rating) || 0;

      return `
        <article class="hp-testimonial-card">
          <div class="hp-testimonial-stars">
            ${"★".repeat(rating)}${"☆".repeat(5 - rating)}
          </div>
          <h3 class="hp-testimonial-title">${escapeHtml(title)}</h3>
          <p class="hp-testimonial-content">${escapeHtml(content)}</p>
          <p class="hp-testimonial-meta">
            <strong>${escapeHtml(name)}</strong>
          </p>
        </article>
      `;
    })
    .join("");

  container.innerHTML = cards;
}

function mapTypeLabelHome(type) {
  switch (type) {
    case "price":
      return "Giá cả / báo giá";
    case "shipping":
      return "Giao hàng / kho vận";
    case "support":
      return "Tư vấn / chăm sóc khách hàng";
    case "website":
      return "Trải nghiệm trên website";
    case "other":
    default:
      return "Góp ý khác";
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}



