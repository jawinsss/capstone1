document.addEventListener('DOMContentLoaded', () => {
  const userNameEl = document.getElementById('hpUserName');
  const loginLink = document.getElementById('hpLoginLink');
  const logoutBtn = document.getElementById('hpLogoutBtn');
  const adminLink = document.getElementById('hpAdminLink');
  const cartBtn = document.getElementById('hpCartBtn');
  const cartCount = document.getElementById('hpCartCount');
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');

  // Product detail elements
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const productDetailContent = document.getElementById('productDetailContent');
  const breadcrumbProduct = document.getElementById('breadcrumbProduct');
  const mainImage = document.getElementById('mainImage');
  const thumbnailImages = document.getElementById('thumbnailImages');
  const productTitle = document.getElementById('productTitle');
  const productPrice = document.getElementById('productPrice');
  const productDescription = document.getElementById('productDescription');
  const productSpecs = document.getElementById('productSpecs');
  const relatedProducts = document.getElementById('relatedProducts');
  const quantityInput = document.getElementById('quantityInput');
  const decreaseQty = document.getElementById('decreaseQty');
  const increaseQty = document.getElementById('increaseQty');
  const addToCartBtn = document.getElementById('addToCartBtn');
  const buyNowBtn = document.getElementById('buyNowBtn');

  let currentProduct = null;

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

  // ===== Product Detail Functions =====
  function getProductIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  }

  async function loadProductDetail() {
    const productId = getProductIdFromURL();
    
    if (!productId) {
      showError();
      return;
    }

    try {
      showLoading();
      
      const res = await window.apiService.get(`/products/${productId}`);
      
      if (!res?.success) {
        showError();
        return;
      }

      currentProduct = res.data;
      displayProductDetail(currentProduct);
      loadRelatedProducts(currentProduct.categoryId, productId);
      
    } catch (error) {
      console.error('Error loading product detail:', error);
      showError();
    }
  }

  function showLoading() {
    loadingState.removeAttribute('hidden');
    errorState.setAttribute('hidden', '');
    productDetailContent.setAttribute('hidden', '');
  }

  function showError() {
    loadingState.setAttribute('hidden', '');
    errorState.removeAttribute('hidden');
    productDetailContent.setAttribute('hidden', '');
  }

  function showContent() {
    loadingState.setAttribute('hidden', '');
    errorState.setAttribute('hidden', '');
    productDetailContent.removeAttribute('hidden');
  }

  function displayProductDetail(product) {
    // Update breadcrumb
    breadcrumbProduct.textContent = product.name;
    
    // Update page title
    document.title = `${product.name} - MatFlow`;
    
    // Update product info
    productTitle.textContent = product.name;
    productPrice.textContent = formatVND(product.price);
    productDescription.textContent = product.description || 'Không có mô tả chi tiết.';
    
    // Update images
    updateProductImages(product.images || []);
    
    // Update specifications
    updateProductSpecs(product);
    
    // Show content
    showContent();
  }

  function updateProductImages(images) {
    if (images.length === 0) {
      // Use placeholder if no images
      const placeholder = 'https://via.placeholder.com/600x400?text=MatFlow';
      mainImage.src = placeholder;
      mainImage.alt = currentProduct.name;
      mainImage.onerror = function() {
        this.src = 'https://via.placeholder.com/600x400?text=MatFlow';
      };
      return;
    }

    // Set main image
    mainImage.src = images[0].url;
    mainImage.alt = currentProduct.name;
    mainImage.onerror = function() {
      this.src = 'https://via.placeholder.com/600x400?text=MatFlow';
    };

    // Create thumbnails
    thumbnailImages.innerHTML = '';
    images.forEach((image, index) => {
      const thumbnail = document.createElement('img');
      thumbnail.src = image.url;
      thumbnail.alt = currentProduct.name;
      thumbnail.className = 'thumbnail';
      if (index === 0) thumbnail.classList.add('active');
      
      thumbnail.onerror = function() {
        this.src = 'https://via.placeholder.com/80x80?text=MatFlow';
      };
      
      thumbnail.addEventListener('click', () => {
        // Update main image
        mainImage.src = image.url;
        
        // Update active thumbnail
        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
        thumbnail.classList.add('active');
      });
      
      thumbnailImages.appendChild(thumbnail);
    });
  }

  function updateProductSpecs(product) {
    const specs = [
      { label: 'Tên sản phẩm', value: product.name },
      { label: 'Giá', value: formatVND(product.price) },
      { label: 'Danh mục', value: product.category?.name || 'Không xác định' },
      { label: 'Trạng thái', value: product.status || 'Còn hàng' },
      { label: 'Ngày tạo', value: product.createdAt ? new Date(product.createdAt).toLocaleDateString('vi-VN') : 'Không xác định' }
    ];

    productSpecs.innerHTML = '';
    specs.forEach(spec => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="spec-label">${spec.label}:</span>
        <span class="spec-value">${spec.value}</span>
      `;
      productSpecs.appendChild(li);
    });
  }

  async function loadRelatedProducts(categoryId, currentProductId) {
    if (!categoryId) return;

    try {
      const res = await window.apiService.get(`/products?categoryId=${encodeURIComponent(categoryId)}&take=4`);
      
      if (!res?.success) return;
      
      const products = Array.isArray(res.data) ? res.data : res.data?.items || [];
      const relatedItems = products.filter(p => p.id !== currentProductId).slice(0, 4);
      
      displayRelatedProducts(relatedItems);
      
    } catch (error) {
      console.error('Error loading related products:', error);
    }
  }

  function displayRelatedProducts(products) {
    if (products.length === 0) {
      relatedProducts.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Không có sản phẩm liên quan.</p>';
      return;
    }

    relatedProducts.innerHTML = '';
    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'related-card';
      
      const image = (product.images && product.images[0]?.url) || 'https://via.placeholder.com/250x200?text=MatFlow';
      
      card.innerHTML = `
        <img src="${image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/250x200?text=MatFlow'">
        <div class="related-card-info">
          <div class="related-card-title">${product.name}</div>
          <div class="related-card-price">${formatVND(product.price)}</div>
        </div>
      `;
      
      card.addEventListener('click', () => {
        window.location.href = `product-detail.html?id=${product.id}`;
      });
      
      relatedProducts.appendChild(card);
    });
  }

  // ===== Event Listeners =====
  decreaseQty.addEventListener('click', () => {
    const currentValue = parseInt(quantityInput.value) || 1;
    const newValue = Math.max(1, currentValue - 1);
    quantityInput.value = newValue;
  });

  increaseQty.addEventListener('click', () => {
    const currentValue = parseInt(quantityInput.value) || 1;
    const newValue = currentValue + 1;
    quantityInput.value = newValue;
  });

  quantityInput.addEventListener('input', () => {
    const value = parseInt(quantityInput.value) || 1;
    quantityInput.value = Math.max(1, value);
  });

  addToCartBtn.addEventListener('click', () => {
    if (!currentProduct) return;
    
    const quantity = parseInt(quantityInput.value) || 1;
    const existingItemIndex = cart.findIndex(item => item.productId === currentProduct.id);
    
    if (existingItemIndex >= 0) {
      cart[existingItemIndex].quantity += quantity;
    } else {
      cart.push({
        productId: currentProduct.id,
        quantity: quantity,
        name: currentProduct.name,
        price: currentProduct.price,
        image: currentProduct.images?.[0]?.url
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    // Show success message
    const originalText = addToCartBtn.innerHTML;
    addToCartBtn.innerHTML = '<i class="fa-solid fa-check"></i> Đã thêm vào giỏ';
    addToCartBtn.style.background = '#27ae60';
    
    setTimeout(() => {
      addToCartBtn.innerHTML = originalText;
      addToCartBtn.style.background = '#3498db';
    }, 2000);
  });

  buyNowBtn.addEventListener('click', () => {
    if (!currentProduct) return;
    
    const quantity = parseInt(quantityInput.value) || 1;
    const existingItemIndex = cart.findIndex(item => item.productId === currentProduct.id);
    
    if (existingItemIndex >= 0) {
      cart[existingItemIndex].quantity += quantity;
    } else {
      cart.push({
        productId: currentProduct.id,
        quantity: quantity,
        name: currentProduct.name,
        price: currentProduct.price,
        image: currentProduct.images?.[0]?.url
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    // Redirect to checkout (you can implement this later)
    alert('Chuyển đến trang thanh toán...');
    // window.location.href = 'checkout.html';
  });

  // ===== Initialize =====
  syncUserUI();
  loadProductDetail();
});
