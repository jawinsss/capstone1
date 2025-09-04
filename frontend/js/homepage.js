document.addEventListener('DOMContentLoaded', () => {
  const catMenu = document.getElementById('catMenu');
  const productGrid = null;
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
    productGrid.innerHTML = '';
    items.forEach(p => {
      const card = document.createElement('div');
      card.className = 'hp-card';
      const thumb = (p.images && p.images[0]?.url) || 'https://via.placeholder.com/400x300?text=MatFlow';
      card.innerHTML = `
        <img src="${thumb}" alt="${p.name}" style="width:100%;height:140px;object-fit:cover;border-radius:8px" onerror="this.src='https://via.placeholder.com/400x300?text=MatFlow'">
        <div class="name">${p.name}</div>
        <div class="price">${formatVND(p.price)}</div>
        <button class="hp-btn" data-id="${p.id}">Xem</button>
      `;
      card.querySelector('button').addEventListener('click',()=>openProduct(p));
      productGrid.appendChild(card);
    });
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
          const thumb = (p.images && p.images[0]?.url) || 'https://via.placeholder.com/400x300?text=MatFlow';
          card.innerHTML = `
            <img src="${thumb}" alt="${p.name}" style="width:100%;height:140px;object-fit:cover;border-radius:8px" onerror="this.src='https://via.placeholder.com/400x300?text=MatFlow'">
            <div class="name">${p.name}</div>
            <div class="price">${formatVND(p.price)}</div>
            <button class="hp-btn" data-id="${p.id}">Xem</button>
          `;
          card.querySelector('button').addEventListener('click',()=>openProduct(p));
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
          const thumb = (p.images && p.images[0]?.url) || 'https://via.placeholder.com/400x300?text=MatFlow';
          card.innerHTML = `
            <img src="${thumb}" alt="${p.name}" style="width:100%;height:140px;object-fit:cover;border-radius:8px" onerror="this.src='https://via.placeholder.com/400x300?text=MatFlow'">
            <div class="name">${p.name}</div>
            <div class="price">${formatVND(p.price)}</div>
            <button class="hp-btn" data-id="${p.id}">Xem</button>
          `;
          card.querySelector('button').addEventListener('click',()=>openProduct(p));
          grid.appendChild(card);
        });
      });
    }
  }

  function openProduct(p){
    activeProduct = p;
    modalTitle.textContent = p.name;
    modalPrice.textContent = formatVND(p.price);
    modalDesc.textContent = p.description || '';
    qtyInput.value = 1;
    renderReviews(p.id);
    modal.removeAttribute('hidden');
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

  closeModalBtn.addEventListener('click',()=>modal.setAttribute('hidden',''));
  addToCartBtn.addEventListener('click',()=>{
    const qty = Math.max(1, parseInt(qtyInput.value||'1',10));
    const idx = cart.findIndex(i=>i.productId===activeProduct.id);
    if(idx>=0) cart[idx].quantity += qty; else cart.push({productId: activeProduct.id, quantity: qty});
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    alert('Đã thêm vào giỏ');
  });

  submitReview.addEventListener('click', async ()=>{
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

  // Auto refresh newest products so items created from admin appear on home
  setInterval(()=>{
    loadCategories();
  }, 15000);
});


