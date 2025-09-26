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
    try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch(_) {}
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if(!user && token){
      // attempt to get profile
      const res = await window.apiService.get('/users/profile');
      if(res?.success){ user = res.data; localStorage.setItem('user', JSON.stringify(user)); }
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
        ['accessToken','refreshToken','token','user'].forEach(k=>{localStorage.removeItem(k); sessionStorage.removeItem(k);});
      } catch(_){}
      syncUserUI();
    });
  }

  // Cart count is now handled by CartUtils
  cartBtn && cartBtn.addEventListener('click', ()=>{
    window.location.href = 'cart.html';
  });


  function formatVND(n){
    return Number(n||0).toLocaleString('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0});
  }

  // Standard categories and child types to display
  const STANDARD_CATEGORIES = [
    { name: 'Sắt Thép', key: 'sat-thep', children: ['Thép hình','Thép tấm','Thép ống','Thép cây'] },
    { name: 'Hóa Chất', key: 'hoa-chat', children: ['Sơn công nghiệp','Dung môi','Keo dán'] },
    { name: 'Phụ Kiện Nâng Hạ', key: 'phu-kien-nang-ha', children: ['Cáp - Xích','Móc - Khóa','Palang'] },
    { name: 'Siêu Thị Keo', key: 'sieu-thi-keo', children: ['Keo silicone','Keo epoxy','Băng keo'] },
    { name: 'Siêu Thị Sơn', key: 'sieu-thi-son', children: ['Sơn nước','Sơn dầu','Sơn epoxy'] },
    { name: 'Máy Móc- Thiết Bị', key: 'may-moc-thiet-bi', children: ['Máy hàn','Máy cắt','Dụng cụ điện'] },
    { name: 'Vật Tư Hạ Tầng', key: 'vat-tu-ha-tang', children: ['Ống - Phụ kiện','Cáp - Điện','Bê tông - Nhựa'] },
    { name: 'Vật Tư Kim Khí', key: 'vat-tu-kim-khi', children: ['Bulon - Ốc vít','Lưỡi cắt - Mài','Dụng cụ cầm tay'] },
    { name: 'Vật Tư Phụ Xây Dựng', key: 'vat-tu-phu-xay-dung', children: ['Giàn giáo','Cốp pha','Lưới an toàn'] },
    { name: 'Linh Kiện Lắp Ghép', key: 'linh-kien-lap-ghep', children: ['Khớp nối','Bạc đạn','Ổ bi'] },
    { name: 'Bảo Hộ Lao Động', key: 'bao-ho-lao-dong', children: ['Mũ - Kính','Găng tay','Giày bảo hộ'] },
  ];

  async function loadCategories(){
    // Render sidebar from standard list (ignore old grid)
    catMenu.innerHTML = '';
    STANDARD_CATEGORIES.forEach(c => {
      const li = document.createElement('li');
      li.className = 'cat-item';
      li.innerHTML = `<span>${c.name}</span><span>›</span>`;
      const sub = document.createElement('div');
      sub.className = 'cat-children';
      sub.innerHTML = c.children.map(ch=>`<div class="hp-cat" data-subcategory="${ch}">${ch}</div>`).join('');
      li.appendChild(sub);
      
      // Click on main category
      li.addEventListener('click', (e)=>{
        // Avoid closing when clicking submenu; just load products for parent category
        e.stopPropagation();
        filterByCategoryName(c.name);
      });
      
      // Click on sub-categories
      sub.addEventListener('click', (e)=>{
        e.stopPropagation();
        const subCategory = e.target.getAttribute('data-subcategory');
        if(subCategory) {
          filterBySubCategory(c.name, subCategory);
        }
      });
      
      catMenu.appendChild(li);
    });

    // Also fetch backend categories to map names->ids for filtering
    const res = await window.apiService.get('/categories');
    if(res?.success){
      const backendCats = Array.isArray(res.data) ? res.data : res.data?.items || [];
      categoryNameToId = new Map(backendCats.map(x=>[String(x.name).trim().toLowerCase(), x.id]));
      renderCategorySections(backendCats);
    }
  }

  let categoryNameToId = new Map();
  function filterByCategoryName(name){
    const id = categoryNameToId.get(String(name).trim().toLowerCase());
    if(id){ 
      // Navigate to product page with category filter
      window.location.href = `products.html?category=${id}`;
    }
  }

  function filterBySubCategory(mainCategoryName, subCategoryName){
    const mainCategoryId = categoryNameToId.get(String(mainCategoryName).trim().toLowerCase());
    if(mainCategoryId){ 
      // Navigate to product page with subcategory filter
      window.location.href = `products.html?category=${mainCategoryId}&subcategory=${encodeURIComponent(subCategoryName)}`;
    }
  }

  async function loadProducts(categoryId){
    const qs = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}&take=16` : `?take=16`;
    const res = await window.apiService.get(`/products${qs}`);
    if(!res?.success) return;
    const payload = res.data;
    const items = Array.isArray(payload) ? payload : payload?.items || [];
    if(!productGrid){ productGrid = document.getElementById('productsGrid'); }
    if(!productGrid) return;
    productGrid.innerHTML = '';
    items.forEach(p => {
      const card = document.createElement('div');
      card.className = 'hp-card';
      card.style.cursor = 'pointer';
      const thumb = (p.images && p.images[0]?.url) || 'https://via.placeholder.com/400x300?text=MatFlow';
      card.innerHTML = `
        <img src="${thumb}" alt="${p.name}" style="width:100%;height:140px;object-fit:contain;background:#fff;border-radius:8px" onerror="this.src='https://via.placeholder.com/400x300?text=MatFlow'">
        <div class="name">${p.name}</div>
        <div class="price">${formatVND(p.price)}</div>
      `;
      card.addEventListener('click',()=>openProduct(p));
      productGrid.appendChild(card);
    });
  }

  async function loadProductsWithSubCategory(categoryId, subCategoryName){
    // Load all products from the main category first
    const qs = `?categoryId=${encodeURIComponent(categoryId)}&take=1000`;
    const res = await window.apiService.get(`/products${qs}`);
    if(!res?.success) return;
    const payload = res.data;
    const allItems = Array.isArray(payload) ? payload : payload?.items || [];
    
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
      const card = document.createElement('div');
      card.className = 'hp-card';
      card.style.cursor = 'pointer';
      const thumb = (p.images && p.images[0]?.url) || 'https://via.placeholder.com/400x300?text=MatFlow';
      card.innerHTML = `
        <img src="${thumb}" alt="${p.name}" style="width:100%;height:140px;object-fit:contain;background:#fff;border-radius:8px" onerror="this.src='https://via.placeholder.com/400x300?text=MatFlow'">
        <div class="name">${p.name}</div>
        <div class="price">${formatVND(p.price)}</div>
      `;
      card.addEventListener('click',()=>openProduct(p));
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
    if(!container) return;
    
    // Prevent multiple simultaneous renders
    if(isRenderingSections) return;
    isRenderingSections = true;
    
    try {
      // Clear previously rendered sections to avoid duplicates
      container.innerHTML = '';
      
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
        const items = Array.isArray(res.data) ? res.data : res.data?.items || [];
        items.forEach(p=>{
          const card = document.createElement('div');
          card.className = 'hp-card';
          card.style.cursor = 'pointer';
          const thumb = (p.images && p.images[0]?.url) || 'https://via.placeholder.com/400x300?text=MatFlow';
          card.innerHTML = `
            <img src="${thumb}" alt="${p.name}" style="width:100%;height:140px;object-fit:contain;background:#fff;border-radius:8px" onerror="this.src='https://via.placeholder.com/400x300?text=MatFlow'">
            <div class="name">${p.name}</div>
            <div class="price">${formatVND(p.price)}</div>
          `;
          card.addEventListener('click',()=>openProduct(p));
          grid.appendChild(card);
        });
      }
      const viewAllBtn = sec.querySelector('[data-view-all]');
      viewAllBtn.addEventListener('click',async ()=>{
        grid.innerHTML = '';
        const more = await window.apiService.get(`/products?categoryId=${encodeURIComponent(c.id)}&take=16`);
        const items = more?.success ? (Array.isArray(more.data) ? more.data : more.data?.items || []) : [];
        items.forEach(p=>{
          const card = document.createElement('div');
          card.className = 'hp-card';
          card.style.cursor = 'pointer';
          const thumb = (p.images && p.images[0]?.url) || 'https://via.placeholder.com/400x300?text=MatFlow';
          card.innerHTML = `
            <img src="${thumb}" alt="${p.name}" style="width:100%;height:140px;object-fit:contain;background:#fff;border-radius:8px" onerror="this.src='https://via.placeholder.com/400x300?text=MatFlow'">
            <div class="name">${p.name}</div>
            <div class="price">${formatVND(p.price)}</div>
          `;
          card.addEventListener('click',()=>openProduct(p));
          grid.appendChild(card);
        });
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
  addToCartBtn && addToCartBtn.addEventListener('click',()=>{
    const qty = Math.max(1, parseInt(qtyInput.value||'1',10));
    if (activeProduct && activeProduct.id) {
      CartUtils.addToCart(activeProduct.id, qty);
    }
    alert('Đã thêm vào giỏ');
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

  loadCategories();
  syncUserUI();
  handleInitialRoute();

  // Auto refresh newest products so items created from admin appear on home
  setInterval(async ()=>{
    // Only refresh product sections if on homepage
    const homeView = document.querySelector('[data-view="home"]');
    if (homeView && !homeView.hasAttribute('hidden')) {
      // Get fresh categories from backend and render sections
      try {
        const res = await window.apiService.get('/categories');
        if(res?.success){
          const backendCats = Array.isArray(res.data) ? res.data : res.data?.items || [];
          // Update category mapping
          categoryNameToId = new Map(backendCats.map(x=>[String(x.name).trim().toLowerCase(), x.id]));
          // Render sections (this will clear and re-render)
          renderCategorySections(backendCats);
        }
      } catch (error) {
        console.error('Error refreshing categories:', error);
      }
    }
  }, 15000);
  
});


