document.addEventListener('DOMContentLoaded', () => {
  const userNameEl = document.getElementById('hpUserName');
  const loginLink = document.getElementById('hpLoginLink');
  const logoutBtn = document.getElementById('hpLogoutBtn');
  const adminLink = document.getElementById('hpAdminLink');
  const cartBtn = document.getElementById('hpCartBtn');
  const cartCount = document.getElementById('hpCartCount');
  // Cart is now managed by CartUtils

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
        console.log('ProductDetail: User logout clicked');
        console.log('ProductDetail: Before logout - user_token:', !!localStorage.getItem('user_token'));
        console.log('ProductDetail: Before logout - admin_token:', !!localStorage.getItem('admin_token'));
        
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
        
        console.log('ProductDetail: After logout - user_token:', !!localStorage.getItem('user_token'));
        console.log('ProductDetail: After logout - admin_token:', !!localStorage.getItem('admin_token'));
      } catch(error){
        console.error('ProductDetail logout error:', error);
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
      console.log('Product detail API response:', res);
      
      if (!res?.success) {
        console.error('Failed to load product detail:', res);
        showError();
        return;
      }

      // Handle nested data structure
      let productData = res.data;
      if (productData && typeof productData === 'object' && productData.success && productData.data) {
        productData = productData.data;
      }
      
      console.log('Product data after processing:', productData);
      console.log('Product categoryId:', productData?.categoryId);
      console.log('Product category:', productData?.category);
      
      currentProduct = productData;
      displayProductDetail(currentProduct);
      
      // Get categoryId from product data (prioritize categoryId field)
      const categoryId = currentProduct.categoryId || currentProduct.category?.id;
      console.log('Using categoryId for related products:', categoryId);
      
      if (categoryId) {
        loadRelatedProducts(categoryId, productId);
      } else {
        console.warn('No categoryId found for product, cannot load related products');
      }
      
      hideLoading();
      
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

  function hideLoading() {
    loadingState.setAttribute('hidden', '');
    errorState.setAttribute('hidden', '');
    productDetailContent.removeAttribute('hidden');
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
    console.log('Displaying product detail:', product);
    
    // Update breadcrumb
    breadcrumbProduct.textContent = product.name || 'Sản phẩm';
    
    // Update page title
    document.title = `${product.name || 'Sản phẩm'} - MatFlow`;
    
    // Update product info
    productTitle.textContent = product.name || 'Tên sản phẩm không xác định';
    productPrice.textContent = formatVND(product.price || 0);
    productDescription.textContent = product.description || 'Không có mô tả chi tiết.';
    
    // Check stock status and update UI
    const isOutOfStock = (product.stock || 0) <= 0;
    const isLowStock = product.stock > 0 && product.stock < 10;
    
    // Add stock status display
    if (!document.querySelector('.stock-status-info')) {
      const stockInfo = document.createElement('div');
      stockInfo.className = 'stock-status-info';
      productPrice.parentElement.appendChild(stockInfo);
    }
    
    const stockInfo = document.querySelector('.stock-status-info');
    if (isOutOfStock) {
      stockInfo.innerHTML = '<span class="out-of-stock-text">Hết hàng - Liên hệ để đặt hàng</span>';
      // Disable quantity controls and buttons
      quantityInput.disabled = true;
      quantityInput.value = 0;
      decreaseQty.disabled = true;
      increaseQty.disabled = true;
      addToCartBtn.disabled = true;
      buyNowBtn.disabled = true;
      addToCartBtn.textContent = 'Hết hàng';
      buyNowBtn.textContent = 'Hết hàng';
      addToCartBtn.style.background = '#9ca3af';
      buyNowBtn.style.background = '#9ca3af';
      addToCartBtn.style.cursor = 'not-allowed';
      buyNowBtn.style.cursor = 'not-allowed';
    } else if (isLowStock) {
      stockInfo.innerHTML = `<span class="low-stock-text">⚠️ Chỉ còn ${product.stock} sản phẩm</span>`;
      quantityInput.max = product.stock;
      // Re-enable if previously disabled
      quantityInput.disabled = false;
      decreaseQty.disabled = false;
      increaseQty.disabled = false;
      addToCartBtn.disabled = false;
      buyNowBtn.disabled = false;
      addToCartBtn.textContent = 'Thêm vào giỏ';
      buyNowBtn.textContent = 'Mua ngay';
      addToCartBtn.style.background = '';
      buyNowBtn.style.background = '';
      addToCartBtn.style.cursor = 'pointer';
      buyNowBtn.style.cursor = 'pointer';
    } else {
      stockInfo.innerHTML = `<span class="in-stock-text">✓ Còn ${product.stock} sản phẩm</span>`;
      quantityInput.max = product.stock;
      // Re-enable if previously disabled
      quantityInput.disabled = false;
      decreaseQty.disabled = false;
      increaseQty.disabled = false;
      addToCartBtn.disabled = false;
      buyNowBtn.disabled = false;
      addToCartBtn.textContent = 'Thêm vào giỏ';
      buyNowBtn.textContent = 'Mua ngay';
      addToCartBtn.style.background = '';
      buyNowBtn.style.background = '';
      addToCartBtn.style.cursor = 'pointer';
      buyNowBtn.style.cursor = 'pointer';
    }
    
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
    const stockStatus = (product.stock || 0) <= 0 
      ? '<span style="color: #dc2626; font-weight: 600;">Hết hàng</span>'
      : product.stock < 10 
      ? `<span style="color: #f97316; font-weight: 600;">Còn ${product.stock}</span>`
      : `<span style="color: #16a34a; font-weight: 600;">Còn ${product.stock}</span>`;
    
    const specs = [
      { label: 'Tên sản phẩm', value: product.name },
      { label: 'Giá', value: formatVND(product.price) },
      { label: 'Danh mục', value: product.category?.name || 'Không xác định' },
      { label: 'Tồn kho', value: stockStatus },
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
    if (!categoryId) {
      console.warn('loadRelatedProducts: No categoryId provided');
      return;
    }

    try {
      console.log(`Loading related products for category: ${categoryId}, excluding product: ${currentProductId}`);
      
      // Load many products (50) to show all products in same category
      // Using 'page' parameter (backend uses page, not skip)
      const res = await window.apiService.get(`/products?categoryId=${encodeURIComponent(categoryId)}&take=50&page=1`);
      
      console.log('Related products API response:', res);
      
      if (!res?.success) {
        console.log('Failed to load related products:', res?.message);
        return;
      }
      
      // Handle multiple response structures
      console.log('Raw API response structure:', {
        hasData: !!res.data,
        dataType: typeof res.data,
        isArray: Array.isArray(res.data),
        hasNestedData: !!(res.data?.data),
        nestedDataIsArray: Array.isArray(res.data?.data),
        hasMeta: !!res.meta,
        keys: res.data ? Object.keys(res.data) : []
      });
      
      let products = [];
      if (res.data?.data && Array.isArray(res.data.data)) {
        // Nested structure: {success, data: {data: [...], meta: {...}}}
        console.log('Using nested structure: res.data.data');
        products = res.data.data;
      } else if (Array.isArray(res.data)) {
        // Direct array: {success, data: [...]}
        console.log('Using direct array: res.data');
        products = res.data;
      } else if (res.data && typeof res.data === 'object') {
        // Object structure
        console.log('Using object structure, checking properties...');
        products = res.data.items || res.data.products || [];
        console.log('Found items/products:', products.length);
      }
      
      console.log(`✅ Found ${products.length} products in category ${categoryId}`);
      if (products.length > 0) {
        console.log('Sample product:', products[0]);
      }
      
      // Filter out current product - show ALL remaining products
      const relatedItems = products.filter(p => p && p.id && p.id !== currentProductId);
      
      console.log(`Filtered to ${relatedItems.length} related products (excluding current product)`);
      
      if (relatedItems.length > 0) {
        displayRelatedProducts(relatedItems);
      } else {
        console.log('No related products found to display');
        // Show message instead of hiding section
        if (relatedProducts) {
          relatedProducts.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Không có sản phẩm liên quan trong danh mục này.</p>';
        }
      }
      
    } catch (error) {
      console.error('Error loading related products:', error);
    }
  }

  function displayRelatedProducts(products) {
    if (products.length === 0) {
      relatedProducts.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Không có sản phẩm liên quan.</p>';
      return;
    }

    // Create carousel structure
    relatedProducts.innerHTML = `
      <div class="related-carousel-container">
        <button class="carousel-btn carousel-prev" id="relatedPrevBtn">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <div class="related-carousel-wrapper">
          <div class="related-carousel-track" id="relatedCarouselTrack"></div>
        </div>
        <button class="carousel-btn carousel-next" id="relatedNextBtn">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    `;

    const carouselTrack = document.getElementById('relatedCarouselTrack');
    const prevBtn = document.getElementById('relatedPrevBtn');
    const nextBtn = document.getElementById('relatedNextBtn');

    // Add products to carousel
    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'related-card';
      
      // Handle both base64 and regular URLs
      const imageUrl = product.images?.[0]?.url || '';
      let image;
      if (!imageUrl) {
        image = 'https://via.placeholder.com/250x200?text=MatFlow';
      } else if (imageUrl.startsWith('data:image')) {
        // Base64 image from admin
        image = imageUrl;
      } else {
        // Regular URL from seed - use CONFIG.getAssetUrl if available
        image = window.CONFIG ? CONFIG.getAssetUrl(imageUrl) : imageUrl;
      }
      
      card.innerHTML = `
        <img src="${image}" alt="${product.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/250x200?text=MatFlow'">
        <div class="related-card-info">
          <div class="related-card-title">${product.name}</div>
          <div class="related-card-price">${formatVND(product.price)}</div>
        </div>
      `;
      
      card.addEventListener('click', () => {
        window.location.href = `product-detail.html?id=${product.id}`;
      });
      
      carouselTrack.appendChild(card);
    });

    // Carousel scroll functionality
    let scrollPosition = 0;
    const cardWidth = 270; // 250px width + 20px gap
    const visibleCards = 4;
    const maxScroll = Math.max(0, (products.length - visibleCards) * cardWidth);

    // Update button states
    function updateButtons() {
      prevBtn.disabled = scrollPosition <= 0;
      nextBtn.disabled = scrollPosition >= maxScroll;
      prevBtn.style.opacity = scrollPosition <= 0 ? '0.3' : '1';
      nextBtn.style.opacity = scrollPosition >= maxScroll ? '0.3' : '1';
    }

    prevBtn.addEventListener('click', () => {
      scrollPosition = Math.max(0, scrollPosition - cardWidth * 2); // Scroll 2 cards
      carouselTrack.style.transform = `translateX(-${scrollPosition}px)`;
      updateButtons();
    });

    nextBtn.addEventListener('click', () => {
      scrollPosition = Math.min(maxScroll, scrollPosition + cardWidth * 2); // Scroll 2 cards
      carouselTrack.style.transform = `translateX(-${scrollPosition}px)`;
      updateButtons();
    });

    updateButtons();
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

  addToCartBtn.addEventListener('click', async () => {
    if (!currentProduct) return;
    
    const quantity = parseInt(quantityInput.value) || 1;
    const success = await CartUtils.addToCart(currentProduct.id, quantity, currentProduct.stock);
    
    if (success) {
      // Show success message
      const originalText = addToCartBtn.innerHTML;
      addToCartBtn.innerHTML = '<i class="fa-solid fa-check"></i> Đã thêm vào giỏ';
      addToCartBtn.style.background = '#27ae60';
      
      setTimeout(() => {
        addToCartBtn.innerHTML = originalText;
        addToCartBtn.style.background = '#3498db';
      }, 2000);
    }
    // Removed else block - validation errors are shown by CartUtils.addToCart
  });

  buyNowBtn.addEventListener('click', async () => {
    if (!currentProduct) return;
    
    const quantity = parseInt(quantityInput.value) || 1;
    const success = await CartUtils.addToCart(currentProduct.id, quantity, currentProduct.stock);
    
    if (success) {
      // Redirect to cart page
      window.location.href = 'cart.html';
    }
    // Validation errors are shown by CartUtils.addToCart
  });

  // ===== Initialize =====
  syncUserUI();
  loadProductDetail();
});

// ===== Add Carousel Styles =====
const carouselStyles = document.createElement('style');
carouselStyles.textContent = `
  .related-carousel-container {
    position: relative;
    margin: 0 auto;
    max-width: 1200px;
  }

  .carousel-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    background: rgba(255, 255, 255, 0.95);
    border: 2px solid #ddd;
    border-radius: 50%;
    width: 45px;
    height: 45px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .carousel-btn:hover:not(:disabled) {
    background: #00897b;
    color: white;
    border-color: #00897b;
    box-shadow: 0 4px 12px rgba(0,137,123,0.3);
  }

  .carousel-btn:disabled {
    cursor: not-allowed;
    opacity: 0.3;
  }

  .carousel-btn i {
    font-size: 18px;
  }

  .carousel-prev {
    left: -20px;
  }

  .carousel-next {
    right: -20px;
  }

  .related-carousel-wrapper {
    overflow: hidden;
    padding: 20px 10px;
  }

  .related-carousel-track {
    display: flex;
    gap: 20px;
    transition: transform 0.4s ease;
  }

  .related-card {
    min-width: 250px;
    flex-shrink: 0;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .related-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  }

  .related-card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    background: #f5f5f5;
  }

  .related-card-info {
    padding: 15px;
  }

  .related-card-title {
    font-size: 15px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .related-card-price {
    font-size: 18px;
    font-weight: 700;
    color: #e53935;
  }

  @media (max-width: 768px) {
    .carousel-btn {
      width: 35px;
      height: 35px;
    }
    
    .carousel-btn i {
      font-size: 14px;
    }
    
    .carousel-prev {
      left: -15px;
    }
    
    .carousel-next {
      right: -15px;
    }
    
    .related-card {
      min-width: 180px;
    }
    
    .related-card img {
      height: 150px;
    }
  }
  
  .stock-status-info {
    margin-top: 12px;
    padding: 10px 15px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
  }
  
  .out-of-stock-text {
    color: #dc2626;
    background: #fef2f2;
    padding: 8px 12px;
    border-radius: 6px;
    display: inline-block;
  }
  
  .low-stock-text {
    color: #f97316;
    background: #fff7ed;
    padding: 8px 12px;
    border-radius: 6px;
    display: inline-block;
  }
  
  .in-stock-text {
    color: #16a34a;
    background: #f0fdf4;
    padding: 8px 12px;
    border-radius: 6px;
    display: inline-block;
  }
`;
document.head.appendChild(carouselStyles);
