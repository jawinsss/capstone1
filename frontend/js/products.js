document.addEventListener('DOMContentLoaded', () => {
  const productGrid = document.getElementById('productsGrid');
  const userNameEl = document.getElementById('hpUserName');
  const loginLink = document.getElementById('hpLoginLink');
  const logoutBtn = document.getElementById('hpLogoutBtn');
  const adminLink = document.getElementById('hpAdminLink');
  const cartBtn = document.getElementById('hpCartBtn');
  const cartCount = document.getElementById('hpCartCount');
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');

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
    pageSize: 8,
    sort: 'all',
    categoryId: null,
    min: 0,
    max: 5000000,
    totalPages: 1,
    filteredItems: null, // For subcategory filtering
  };

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

  let categoryNameToId = new Map();

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

  // ===== Product view functions =====
  async function loadProductCategories(){
    // Ensure categoryNameToId is loaded first
    if(categoryNameToId.size === 0) {
      const res = await window.apiService.get('/categories');
      if(res?.success){
        const backendCats = Array.isArray(res.data) ? res.data : res.data?.items || [];
        categoryNameToId = new Map(backendCats.map(x=>[String(x.name).trim().toLowerCase(), x.id]));
      }
    }
    
    if(!pv.catMenu) return;
    pv.catMenu.innerHTML = '';
    
    // Create categories with subcategories using STANDARD_CATEGORIES
    STANDARD_CATEGORIES.forEach(c => {
      const li = document.createElement('li');
      li.className = 'cat-item';
      const categoryId = categoryNameToId.get(c.name.toLowerCase()) || '';
      li.innerHTML = `<a href="#" data-cat="${c.name}" data-cat-id="${categoryId}">${c.name}<i>›</i></a>`;
      
      // Add subcategories
      const sub = document.createElement('div');
      sub.className = 'cat-children';
      sub.innerHTML = c.children.map(ch=>`<div class="hp-cat" data-subcategory="${ch}">${ch}</div>`).join('');
      li.appendChild(sub);
      
      // Click on main category
      li.querySelector('a').addEventListener('click', (e)=>{
        e.preventDefault();
        const categoryId = e.target.getAttribute('data-cat-id');
        if(categoryId) {
          pvState.categoryId = categoryId;
          pvState.filteredItems = null; // Clear subcategory filter
          pvState.page = 1;
          renderProductList();
        }
      });
      
      // Click on sub-categories
      sub.addEventListener('click', (e)=>{
        e.stopPropagation();
        const subCategory = e.target.getAttribute('data-subcategory');
        const categoryId = li.querySelector('a').getAttribute('data-cat-id');
        if(subCategory && categoryId) {
          filterProductViewBySubCategory(categoryId, subCategory);
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
      const payload = res.data;
      const allItems = Array.isArray(payload) ? payload : payload?.items || [];
      
      // Filter by subcategory using localStorage data
      const filteredItems = allItems.filter(p => {
        const savedSubCategory = getProductSubCategory(p.id);
        return savedSubCategory === subCategoryName;
      });
      
      // Update pvState to reflect the filtered results
      pvState.filteredItems = filteredItems; // Always use filtered items, even if empty
      pvState.categoryId = categoryId; // Set the main category
      pvState.page = 1;
      renderProductList();
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
    if(!productGrid) return;
    if(pv.loading) pv.loading.removeAttribute('hidden');
    if(pv.empty) pv.empty.setAttribute('hidden','');
    productGrid.innerHTML = '';
    
    let items, meta, total;
    
    // Check if we have filtered items (from subcategory filter)
    if(pvState.filteredItems !== null) {
      // We have filtered items (could be empty array)
      items = pvState.filteredItems;
      meta = { total: items.length };
      total = items.length;
    } else {
      // Normal API call
      const qs = buildProductQuery();
      const res = await window.apiService.get(`/products?${qs}`);
      const payload = res?.success ? res.data : null;
      const result = Array.isArray(payload) ? { items: payload, meta: { total: payload.length } } : { items: payload?.items || [], meta: payload?.meta || {} };
      items = result.items;
      meta = result.meta;
      total = Number(meta?.total || items.length || 0);
    }
    
    // Real-time count update
    const countEl = document.getElementById('productCount');
    if(countEl){
      countEl.textContent = String(total);
    }
    
    pvState.totalPages = Math.max(1, Math.ceil(total / pvState.pageSize));
    
    // Build cards
    items.forEach(p=>{
      const card = document.createElement('div');
      card.className = 'hp-card';
      card.style.cursor = 'pointer';
      const thumb = (p.images && p.images[0]?.url) || 'https://via.placeholder.com/400x300?text=MatFlow';
      card.innerHTML = `
        <img src="${thumb}" alt="${p.name}" style="width:100%;height:120px;object-fit:contain;background:#fff;border-radius:8px" onerror="this.src='https://via.placeholder.com/400x300?text=MatFlow'">
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
  }

  // Throttle rendering while dragging sliders
  let renderTimer = null;
  function throttleRender(){
    if(renderTimer) clearTimeout(renderTimer);
    renderTimer = setTimeout(()=>{ pvState.page = 1; renderProductList(); }, 250);
  }

  // ===== Product detail =====
  async function openDetail(productId){
    // Create a new window for product detail
    const detailWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    
    detailWindow.document.write(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chi tiết sản phẩm - MatFlow</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
        <link rel="stylesheet" href="../../styles/homepage.css">
        <link rel="shortcut icon" href="../../assets/Favicon MatFlow.png" type="image/x-icon">
        <script src="../../js/config.js"></script>
        <script src="../../js/apiService.js"></script>
        <style>
          body { margin: 0; padding: 20px; font-family: 'Inter', sans-serif; }
          .detail-container { max-width: 1000px; margin: 0 auto; }
          .back-btn { margin-bottom: 20px; }
          .product-detail { display: flex; gap: 30px; margin-bottom: 30px; }
          .product-image { flex: 1; }
          .product-image img { width: 100%; max-width: 500px; height: auto; border-radius: 8px; }
          .product-info { flex: 1; }
          .product-title { font-size: 2rem; font-weight: 600; margin-bottom: 10px; }
          .product-price { font-size: 1.5rem; color: #e74c3c; font-weight: 600; margin-bottom: 20px; }
          .product-description { margin-bottom: 30px; line-height: 1.6; }
          .quantity-controls { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
          .quantity-controls button { width: 40px; height: 40px; border: 1px solid #ddd; background: #f8f9fa; cursor: pointer; border-radius: 4px; }
          .quantity-controls input { width: 80px; height: 40px; text-align: center; border: 1px solid #ddd; border-radius: 4px; }
          .action-buttons { display: flex; gap: 15px; }
          .action-buttons button { padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }
          .btn-primary { background: #3498db; color: white; }
          .btn-secondary { background: #95a5a6; color: white; }
          .btn-primary:hover { background: #2980b9; }
          .btn-secondary:hover { background: #7f8c8d; }
        </style>
      </head>
      <body>
        <div class="detail-container">
          <button class="back-btn" onclick="window.close()">← Quay lại</button>
          <div id="productDetailContent">Đang tải...</div>
        </div>
        <script>
          async function loadProductDetail() {
            try {
              const res = await window.apiService.get('/products/${productId}');
              if (!res?.success) {
                document.getElementById('productDetailContent').innerHTML = '<p>Không tải được sản phẩm.</p>';
                return;
              }
              
              const p = res.data;
              const thumb = (p.images && p.images[0]?.url) || 'https://via.placeholder.com/600x400?text=MatFlow';
              
              document.getElementById('productDetailContent').innerHTML = \`
                <div class="product-detail">
                  <div class="product-image">
                    <img src="\${thumb}" alt="\${p.name}" onerror="this.src='https://via.placeholder.com/600x400?text=MatFlow'">
                  </div>
                  <div class="product-info">
                    <h1 class="product-title">\${p.name}</h1>
                    <div class="product-price">\${formatVND(p.price)}</div>
                    <div class="product-description">\${p.description || 'Không có mô tả'}</div>
                    <div class="quantity-controls">
                      <button onclick="decreaseQty()">-</button>
                      <input type="number" id="qtyInput" min="1" value="1">
                      <button onclick="increaseQty()">+</button>
                    </div>
                    <div class="action-buttons">
                      <button class="btn-primary" onclick="addToCart()">Thêm vào giỏ</button>
                      <button class="btn-secondary" onclick="buyNow()">Mua ngay</button>
                    </div>
                  </div>
                </div>
              \`;
              
              // Add event listeners
              window.decreaseQty = function() {
                const input = document.getElementById('qtyInput');
                const val = Math.max(1, parseInt(input.value) - 1);
                input.value = val;
              };
              
              window.increaseQty = function() {
                const input = document.getElementById('qtyInput');
                const val = Math.max(1, parseInt(input.value) + 1);
                input.value = val;
              };
              
              window.addToCart = function() {
                const qty = parseInt(document.getElementById('qtyInput').value);
                const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                const idx = cart.findIndex(i => i.productId === p.id);
                if (idx >= 0) {
                  cart[idx].quantity += qty;
                } else {
                  cart.push({ productId: p.id, quantity: qty });
                }
                localStorage.setItem('cart', JSON.stringify(cart));
                alert('Đã thêm vào giỏ');
              };
              
              window.buyNow = function() {
                const qty = parseInt(document.getElementById('qtyInput').value);
                const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                const idx = cart.findIndex(i => i.productId === p.id);
                if (idx >= 0) {
                  cart[idx].quantity += qty;
                } else {
                  cart.push({ productId: p.id, quantity: qty });
                }
                localStorage.setItem('cart', JSON.stringify(cart));
                alert('Chuyển đến trang thanh toán...');
                // You can redirect to checkout page here
              };
              
              function formatVND(n) {
                return Number(n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
              }
              
            } catch (error) {
              console.error('Error loading product detail:', error);
              document.getElementById('productDetailContent').innerHTML = '<p>Có lỗi xảy ra khi tải sản phẩm.</p>';
            }
          }
          
          // Load product detail when window opens
          loadProductDetail();
        </script>
      </body>
      </html>
    `);
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
      pvState.filteredItems = null; // Clear filtered items
      if(pv.minPrice) pv.minPrice.value = '0';
      if(pv.maxPrice) pv.maxPrice.value = '5000000';
      if(pv.priceLabel) pv.priceLabel.textContent = `${formatVND(0)} - ${formatVND(5000000)}`;
      // Clear category active state (if any implemented)
      document.querySelectorAll('.filter-tabs .filter-tab').forEach(b=>b.classList.remove('active'));
      const def = document.querySelector('.filter-tabs .filter-tab[data-filter="all"]') || document.querySelector('.filter-tabs .filter-tab');
      if(def) def.classList.add('active');
      renderProductList();
    });

    // Load categories for product page
    loadProductCategories();
    // Render product list
    renderProductList();
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
      // Handle product detail from hash
      const productId = hash.split('&id=')[1];
      if (productId) {
        openDetail(productId);
      }
    } else {
      // Normal product list
      renderProductList();
    }
  }

  // Initialize everything
  initProductView();
  syncUserUI();
  handleURLParams();
});
