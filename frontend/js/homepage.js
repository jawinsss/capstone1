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
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  let activeProduct = null;
  // ===== Simple view router (data-link/data-view + hash) =====
  const views = Array.from(document.querySelectorAll('[data-view]'));
  const navLinks = Array.from(document.querySelectorAll('[data-link]'));
  // Product view elements (lazy)
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
    pageSize: 8,
    sort: 'all',
    categoryId: null,
    min: 0,
    max: 5000000,
    totalPages: 1,
  };

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
      if(name === 'product'){
        // Ensure product grid reference is resolved when view becomes active
        if(!productGrid){ productGrid = document.getElementById('productsGrid'); }
        // Bind product view controls once
        if(!pv.catMenu){
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
              renderProductList();
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
          pv.prev.addEventListener('click', ()=>{ if(pvState.page>1){ pvState.page--; renderProductList(); } });
          pv.next.addEventListener('click', ()=>{ if(pvState.page<pvState.totalPages){ pvState.page++; renderProductList(); } });

          // Reset all filters
          pv.reset && pv.reset.addEventListener('click', ()=>{
            pvState.page = 1;
            pvState.pageSize = 8;
            pvState.sort = 'all';
            pvState.categoryId = null;
            pvState.min = 0;
            pvState.max = 5000000;
            if(pv.minPrice) pv.minPrice.value = '0';
            if(pv.maxPrice) pv.maxPrice.value = '5000000';
            if(pv.priceLabel) pv.priceLabel.textContent = `${formatVND(0)} - ${formatVND(5000000)}`;
            // Clear category active state (if any implemented)
            document.querySelectorAll('.filter-tabs .filter-tab').forEach(b=>b.classList.remove('active'));
            const def = document.querySelector('.filter-tabs .filter-tab[data-filter="all"]') || document.querySelector('.filter-tabs .filter-tab');
            if(def) def.classList.add('active');
            renderProductList();
          });
        }

        // Load categories for product page (from backend)
        if(pv.catMenu && pv.catMenu.children.length===0){
          loadProductCategories();
        }
        renderProductList();
      }
      if(name === 'product-detail'){
        // nothing here; detail is filled on navigation
      }
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
    if(hash){ showView(hash); } else { showView('home'); }
  }
  window.addEventListener('hashchange', handleInitialRoute);
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

  function updateCartCount(){
    cartCount.textContent = String(cart.reduce((s,i)=>s + Number(i.quantity||0),0));
  }
  updateCartCount();
  cartBtn && cartBtn.addEventListener('click', ()=>{
    alert('Tính năng giỏ hàng đang được hoàn thiện.');
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
      sub.innerHTML = c.children.map(ch=>`<div class="hp-cat">${ch}</div>`).join('');
      li.appendChild(sub);
      li.addEventListener('click', (e)=>{
        // Avoid closing when clicking submenu; just load products for parent category
        e.stopPropagation();
        filterByCategoryName(c.name);
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
    if(id){ loadProducts(id); }
  }

  async function loadProducts(categoryId){
    const qs = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}&take=12` : `?take=12`;
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
        <img src="${thumb}" alt="${p.name}" style="width:100%;height:140px;object-fit:cover;border-radius:8px" onerror="this.src='https://via.placeholder.com/400x300?text=MatFlow'">
        <div class="name">${p.name}</div>
        <div class="price">${formatVND(p.price)}</div>
      `;
      card.addEventListener('click',()=>openProduct(p));
      productGrid.appendChild(card);
    });
  }

  // ===== Product view functions =====
  async function loadProductCategories(){
    const res = await window.apiService.get('/categories');
    const cats = res?.success ? (Array.isArray(res.data) ? res.data : res.data?.items || []) : [];
    if(!pv.catMenu) return;
    pv.catMenu.innerHTML = '';
    cats.forEach(c=>{
      const li = document.createElement('li');
      li.innerHTML = `<a href="#" data-cat="${c.id}">${c.name}<i>›</i></a>`;
      li.querySelector('a').addEventListener('click', (e)=>{
        e.preventDefault();
        pvState.categoryId = c.id;
        pvState.page = 1;
        renderProductList();
      });
      pv.catMenu.appendChild(li);
    });
  }

  function buildProductQuery(){
    const params = new URLSearchParams();
    params.set('take', String(pvState.pageSize));
    params.set('skip', String((pvState.page-1)*pvState.pageSize));
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

  async function renderProductList(){
    if(!productGrid){ productGrid = document.getElementById('productsGrid'); }
    if(!productGrid) return;
    if(pv.loading) pv.loading.removeAttribute('hidden');
    if(pv.empty) pv.empty.setAttribute('hidden','');
    productGrid.innerHTML = '';
    const qs = buildProductQuery();
    const res = await window.apiService.get(`/products?${qs}`);
    const payload = res?.success ? res.data : null;
    const { items, meta } = Array.isArray(payload) ? { items: payload, meta: { total: payload.length } } : { items: payload?.items || [], meta: payload?.meta || {} };
    // Real-time count update
    const countEl = document.getElementById('productCount');
    if(countEl){
      const total = Number(meta?.total || items.length || 0);
      countEl.textContent = String(total);
    }
    const total = Number(meta?.total || items.length || 0);
    pvState.totalPages = Math.max(1, Math.ceil(total / pvState.pageSize));
    // Build cards
    items.forEach(p=>{
      const card = document.createElement('div');
      card.className = 'hp-card';
      card.style.cursor = 'pointer';
      const thumb = (p.images && p.images[0]?.url) || 'https://via.placeholder.com/400x300?text=MatFlow';
      card.innerHTML = `
        <img src="${thumb}" alt="${p.name}" style="width:100%;height:120px;object-fit:cover;border-radius:8px" onerror="this.src='https://via.placeholder.com/400x300?text=MatFlow'">
        <div class="name">${p.name}</div>
        <div class="price">${formatVND(p.price)}</div>
      `;
      card.addEventListener('click', ()=>{ openDetail(p.id); });
      productGrid.appendChild(card);
    });
    // Pagination numbers
    if(pv.numbers){
      pv.numbers.innerHTML = '';
      for(let i=1;i<=pvState.totalPages;i++){
        const b = document.createElement('button');
        b.className = `pagination-number${i===pvState.page?' active':''}`;
        b.textContent = String(i);
        b.addEventListener('click', ()=>{ pvState.page = i; renderProductList(); });
        pv.numbers.appendChild(b);
      }
    }
    if(pv.prev) pv.prev.disabled = pvState.page<=1;
    if(pv.next) pv.next.disabled = pvState.page>=pvState.totalPages;
    if(pv.loading) pv.loading.setAttribute('hidden','');
    if(pv.empty && items.length===0) pv.empty.removeAttribute('hidden');
    setActiveLink('product');
  }

  // Throttle rendering while dragging sliders
  let renderTimer = null;
  function throttleRender(){
    if(renderTimer) clearTimeout(renderTimer);
    renderTimer = setTimeout(()=>{ pvState.page = 1; renderProductList(); }, 250);
  }

  // ===== Product detail =====
  async function openDetail(productId){
    location.hash = '#product-detail';
    showView('product-detail');
    const wrap = document.getElementById('pvDetailWrap');
    const backBtn = document.getElementById('pvBackBtn');
    backBtn.onclick = ()=>{ location.hash = '#product'; showView('product'); };
    wrap.innerHTML = 'Đang tải...';
    const res = await window.apiService.get(`/products/${productId}`);
    if(!res?.success){ wrap.textContent = 'Không tải được sản phẩm.'; return; }
    const p = res.data;
    const thumb = (p.images && p.images[0]?.url) || 'https://via.placeholder.com/600x400?text=MatFlow';
    wrap.innerHTML = `
      <div class="hp-detail">
        <div class="hp-detail-left">
          <img src="${thumb}" alt="${p.name}" style="width:100%;height:260px;object-fit:cover;border-radius:8px" onerror="this.src='https://via.placeholder.com/600x400?text=MatFlow'">
        </div>
        <div class="hp-detail-right">
          <h2>${p.name}</h2>
          <div class="price" style="font-size:1.25rem;margin:8px 0 16px">${formatVND(p.price)}</div>
          <p style="margin-bottom:16px">${p.description||''}</p>
          <div class="hp-row" style="gap:8px;align-items:center;margin-bottom:12px">
            <button class="hp-btn small" id="pvQtyDec">-</button>
            <input id="pvQty" type="number" min="1" value="1" class="hp-input small" style="width:80px;text-align:center">
            <button class="hp-btn small" id="pvQtyInc">+</button>
          </div>
          <div class="hp-row" style="gap:8px">
            <button class="hp-btn primary" id="pvAddToCart">Thêm vào giỏ</button>
            <button class="hp-btn" id="pvBuyNow">Mua ngay</button>
          </div>
        </div>
      </div>
      <div class="hp-products" style="margin-top:24px">
        <div class="hp-products-head">
          <h3>Sản phẩm & vật tư liên quan</h3>
        </div>
        <div class="hp-card-grid" id="pvRelated"></div>
      </div>
    `;
    // Quantity controls
    const qtyInputEl = document.getElementById('pvQty');
    document.getElementById('pvQtyDec').addEventListener('click', ()=>{
      const v = Math.max(1, parseInt(qtyInputEl.value||'1',10)-1); qtyInputEl.value = String(v);
    });
    document.getElementById('pvQtyInc').addEventListener('click', ()=>{
      const v = Math.max(1, parseInt(qtyInputEl.value||'1',10)+1); qtyInputEl.value = String(v);
    });
    qtyInputEl.addEventListener('input', ()=>{
      const v = Math.max(1, parseInt(qtyInputEl.value||'1',10)); qtyInputEl.value = String(v);
    });

    // Add to cart
    document.getElementById('pvAddToCart').addEventListener('click', ()=>{
      const qty = Math.max(1, parseInt(qtyInputEl.value||'1',10));
      const idx = cart.findIndex(i=>i.productId===p.id);
      if(idx>=0) cart[idx].quantity += qty; else cart.push({productId: p.id, quantity: qty});
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartCount();
      alert('Đã thêm vào giỏ');
    });

    // Buy now -> add then redirect to checkout placeholder
    document.getElementById('pvBuyNow').addEventListener('click', ()=>{
      const qty = Math.max(1, parseInt(qtyInputEl.value||'1',10));
      const idx = cart.findIndex(i=>i.productId===p.id);
      if(idx>=0) cart[idx].quantity += qty; else cart.push({productId: p.id, quantity: qty});
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartCount();
      window.location.href = '../homepage/checkout.html';
    });

    // Related products by same category
    const relatedWrap = document.getElementById('pvRelated');
    try {
      const relRes = await window.apiService.get(`/products?categoryId=${encodeURIComponent(p.categoryId||'')}&take=8`);
      const relItems = relRes?.success ? (Array.isArray(relRes.data)?relRes.data:relRes.data?.items||[]) : [];
      relatedWrap.innerHTML = '';
      relItems.filter(x=>x.id!==p.id).forEach(r=>{
        const card = document.createElement('div');
        card.className = 'hp-card';
        card.style.cursor = 'pointer';
        const rthumb = (r.images && r.images[0]?.url) || 'https://via.placeholder.com/400x300?text=MatFlow';
        card.innerHTML = `
          <img src="${rthumb}" alt="${r.name}" style="width:100%;height:120px;object-fit:cover;border-radius:8px" onerror="this.src='https://via.placeholder.com/400x300?text=MatFlow'">
          <div class="name">${r.name}</div>
          <div class="price">${formatVND(r.price)}</div>
        `;
        card.addEventListener('click', ()=>{ openDetail(r.id); });
        relatedWrap.appendChild(card);
      });
    } catch(_) {}
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
    // Clear previously rendered sections to avoid duplicates
    container.innerHTML = '';
    for(const c of categories){
      const sec = sectionTemplate(c.name, c.id);
      container.appendChild(sec);
      const grid = sec.querySelector(`[data-grid-for="${c.id}"]`);
      const res = await window.apiService.get(`/products?categoryId=${encodeURIComponent(c.id)}&take=6`);
      if(res?.success){
        const items = Array.isArray(res.data) ? res.data : res.data?.items || [];
        items.forEach(p=>{
          const card = document.createElement('div');
          card.className = 'hp-card';
          card.style.cursor = 'pointer';
          const thumb = (p.images && p.images[0]?.url) || 'https://via.placeholder.com/400x300?text=MatFlow';
          card.innerHTML = `
            <img src="${thumb}" alt="${p.name}" style="width:100%;height:140px;object-fit:cover;border-radius:8px" onerror="this.src='https://via.placeholder.com/400x300?text=MatFlow'">
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
        const more = await window.apiService.get(`/products?categoryId=${encodeURIComponent(c.id)}&take=24`);
        const items = more?.success ? (Array.isArray(more.data) ? more.data : more.data?.items || []) : [];
        items.forEach(p=>{
          const card = document.createElement('div');
          card.className = 'hp-card';
          card.style.cursor = 'pointer';
          const thumb = (p.images && p.images[0]?.url) || 'https://via.placeholder.com/400x300?text=MatFlow';
          card.innerHTML = `
            <img src="${thumb}" alt="${p.name}" style="width:100%;height:140px;object-fit:cover;border-radius:8px" onerror="this.src='https://via.placeholder.com/400x300?text=MatFlow'">
            <div class="name">${p.name}</div>
            <div class="price">${formatVND(p.price)}</div>
          `;
          card.addEventListener('click',()=>openProduct(p));
          grid.appendChild(card);
        });
      });
    }
  }

  function openProduct(p){
    // Redirect to detail page for a richer experience
    if(p?.id){ openDetail(p.id); }
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
    const idx = cart.findIndex(i=>i.productId===activeProduct.id);
    if(idx>=0) cart[idx].quantity += qty; else cart.push({productId: activeProduct.id, quantity: qty});
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
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
  setInterval(()=>{
    loadCategories();
  }, 15000);
  
});


