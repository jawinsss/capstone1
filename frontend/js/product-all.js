document.addEventListener('DOMContentLoaded', () => {
  const productGrid = document.getElementById('productsGrid');
  const userNameEl = document.getElementById('hpUserName');
  const loginLink = document.getElementById('hpLoginLink');
  const logoutBtn = document.getElementById('hpLogoutBtn');
  const adminLink = document.getElementById('hpAdminLink');
  const cartBtn = document.getElementById('hpCartBtn');
  const cartCount = document.getElementById('hpCartCount');
  const pageTitle = document.getElementById('pageTitle');
  const breadcrumbCategory = document.getElementById('breadcrumbCategory');

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
    categoryName: '',
    min: 0,
    max: 5000000,
    totalPages: 1,
    filteredItems: null,
    isRendering: false,
    pendingSubcategory: null,
    isLoadingMore: false, // Track if loading more products
    hasMoreProducts: true, // Track if there are more products to load
    allLoadedProducts: [], // Store all loaded products for infinite scroll
  };

  // Load categories from API
  let categories = []; // Initialize categories array
  let categoryNameToId = new Map();
  let categoryIdToName = new Map();

  // Load categories from API - include children for product-all page
  async function loadCategories() {
    try {
      const res = await window.apiService.get('/categories');
      console.log('Categories API response:', res);
      
      if (res?.success) {
        // Handle nested data structure: res.data.data
        const data = res.data?.data || res.data;
        categories = Array.isArray(data) ? data : [];
        console.log('Categories data:', categories);
        
        // Build category mappings
        categoryNameToId.clear();
        categoryIdToName.clear();
        categories.forEach(cat => {
          categoryNameToId.set(String(cat.name).trim().toLowerCase(), cat.id);
          categoryIdToName.set(cat.id, cat.name);
          console.log('Category:', cat.name, 'ID:', cat.id, 'Children:', cat.children?.length || 0);
        });
        console.log('Product-all loaded categories with children:', categories.length);
      } else {
        console.error('Categories API failed:', res?.message);
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
        console.log('ProductAll: User logout clicked');
        console.log('ProductAll: Before logout - user_token:', !!localStorage.getItem('user_token'));
        console.log('ProductAll: Before logout - admin_token:', !!localStorage.getItem('admin_token'));
        
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
        
        console.log('ProductAll: After logout - user_token:', !!localStorage.getItem('user_token'));
        console.log('ProductAll: After logout - admin_token:', !!localStorage.getItem('admin_token'));
      } catch(error){
        console.error('ProductAll logout error:', error);
      }
      // Refresh current page
      window.location.reload();
    });
  }

  cartBtn && cartBtn.addEventListener('click', ()=>{
    window.location.href = 'cart.html';
  });

  function formatVND(n){
    return Number(n||0).toLocaleString('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0});
  }

  // ===== URL Parameter Handling =====
  function handleURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('category');
    const categoryName = urlParams.get('name');
    const subcategory = urlParams.get('subcategory');
    
    console.log('URL params - categoryId:', categoryId, 'categoryName:', categoryName, 'subcategory:', subcategory);
    
    if (categoryId) {
      pvState.categoryId = categoryId;
      // Try to get category name from URL or from loaded categories
      if (categoryName) {
        pvState.categoryName = decodeURIComponent(categoryName);
      } else if (categoryIdToName.has(categoryId)) {
        pvState.categoryName = categoryIdToName.get(categoryId);
      }
      
      console.log('Set pvState - categoryId:', pvState.categoryId, 'categoryName:', pvState.categoryName);
      updatePageTitle();
      
      // Note: Don't call renderProductList() here, it will be called after initProductView()
      if (subcategory) {
        // Store subcategory to filter later
        pvState.pendingSubcategory = decodeURIComponent(subcategory);
      }
    } else {
      // No category specified, show all products
      pvState.categoryId = null;
      pvState.categoryName = '';
      updatePageTitle();
    }
  }

  function updatePageTitle() {
    if (pvState.categoryName) {
      pageTitle.textContent = pvState.categoryName;
      breadcrumbCategory.textContent = pvState.categoryName;
    } else {
      pageTitle.textContent = 'Tất cả sản phẩm';
      breadcrumbCategory.textContent = 'Sản phẩm';
    }
  }

  // ===== Product view functions =====
  async function loadProductCategories(){
    if(categoryNameToId.size === 0) {
      const res = await window.apiService.get('/categories');
      if(res?.success){
        // Handle nested data structure: res.data.data
        const data = res.data?.data || res.data;
        const backendCats = Array.isArray(data) ? data : [];
        categoryNameToId = new Map(backendCats.map(x=>[String(x.name).trim().toLowerCase(), x.id]));
        categoryIdToName = new Map(backendCats.map(x=>[x.id, x.name]));
      }
    }
    
    if(!pv.catMenu) return;
    pv.catMenu.innerHTML = '';
    
    // If we have a specific category selected, show its subcategories
    if(pvState.categoryId && pvState.categoryName) {
      console.log('Loading subcategories for:', pvState.categoryName, 'ID:', pvState.categoryId);
      console.log('Available categories:', categories);
      
      // Find the selected category by ID (more reliable than name)
      let selectedCategory = categories.find(c => c.id === pvState.categoryId);
      
      // If not found by ID, try by name
      if (!selectedCategory) {
        selectedCategory = categories.find(c => 
          c.name.toLowerCase() === pvState.categoryName.toLowerCase()
        );
      }
      
      console.log('Selected category:', selectedCategory);
      
      // Add "All products in this category" option
      const allLi = document.createElement('li');
      allLi.className = 'cat-item';
      allLi.innerHTML = `<a href="#" data-cat-all="true" class="active" style="font-weight: bold; color: #00897b;">
        <i class="fa-solid fa-list"></i> Tất cả ${pvState.categoryName}
      </a>`;
      allLi.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Clicked "Tất cả" - resetting to parent category');
        
        // Find the parent category
        const currentCategory = categories.find(c => c.id === pvState.categoryId);
        console.log('Current category:', currentCategory);
        
        // If current is a subcategory, switch to parent
        if (currentCategory?.parentId) {
          const parentCategory = categories.find(c => c.id === currentCategory.parentId);
          if (parentCategory) {
            console.log('Switching to parent category:', parentCategory.name, parentCategory.id);
            pvState.categoryId = parentCategory.id;
            pvState.categoryName = parentCategory.name;
            updatePageTitle();
          }
        }
        
        document.querySelectorAll('.cat-item a').forEach(link => link.classList.remove('active'));
        e.target.classList.add('active');
        pvState.filteredItems = null;
        pvState.page = 1;
        pvState.allLoadedProducts = [];
        pvState.hasMoreProducts = true;
        renderProductList();
        setupInfiniteScroll();
      });
      pv.catMenu.appendChild(allLi);
      
      if(selectedCategory && selectedCategory.children && selectedCategory.children.length > 0) {
        // Add separator
        const separator = document.createElement('li');
        separator.style.borderTop = '1px solid #e5e7eb';
        separator.style.margin = '8px 0';
        pv.catMenu.appendChild(separator);
        
        // Show subcategories of the selected main category
        console.log('Showing', selectedCategory.children.length, 'subcategories for:', selectedCategory.name);
        selectedCategory.children.forEach(subCategory => {
          const li = document.createElement('li');
          li.className = 'cat-item';
          li.innerHTML = `<a href="#" data-subcategory="${subCategory.name}" data-subcategory-id="${subCategory.id}">
            <i class="fa-solid fa-angle-right" style="font-size: 0.8em; margin-right: 5px;"></i>
            ${subCategory.name}
          </a>`;
          
          // Click on subcategory
          li.querySelector('a').addEventListener('click', (e)=>{
            e.preventDefault();
            // Remove active class from all subcategories
            document.querySelectorAll('.cat-item a').forEach(link => {
              link.classList.remove('active');
            });
            // Add active class to clicked subcategory
            e.target.classList.add('active');
            filterProductViewBySubCategory(pvState.categoryId, subCategory.name);
          });
          
          pv.catMenu.appendChild(li);
        });
      } else {
        // No subcategories found, show message
        console.log('No subcategories found for:', selectedCategory);
        const li = document.createElement('li');
        li.className = 'cat-item';
        li.innerHTML = `<span style="color: #666; font-style: italic; padding: 10px;">
          <i class="fa-solid fa-info-circle"></i> Không có danh mục con
        </span>`;
        pv.catMenu.appendChild(li);
      }
    } else {
      // If no specific category, show all main categories with their children
      const mainCategories = categories.filter(cat => !cat.parentId);
      console.log('Showing main categories with children:', mainCategories.length);
      
      mainCategories.forEach(mainCategory => {
        // Add main category
        const mainLi = document.createElement('li');
        mainLi.className = 'cat-item main-category';
        const categoryId = categoryNameToId.get(mainCategory.name.toLowerCase()) || '';
        mainLi.innerHTML = `<a href="#" data-cat="${mainCategory.name}" data-cat-id="${categoryId}" style="font-weight: bold; color: #2563eb;">
          <i class="fa-solid fa-folder"></i> ${mainCategory.name}
        </a>`;
        
        // Click on main category
        mainLi.querySelector('a').addEventListener('click', (e)=>{
          e.preventDefault();
          const categoryId = e.target.getAttribute('data-cat-id');
          const categoryName = e.target.getAttribute('data-cat');
          if(categoryId) {
            pvState.categoryId = categoryId;
            pvState.categoryName = categoryName;
            pvState.filteredItems = null;
            pvState.page = 1;
            pvState.sort = 'all';
            updatePageTitle();
            document.querySelectorAll('.filter-tabs .filter-tab').forEach(b=>b.classList.remove('active'));
            const defaultSort = document.querySelector('.filter-tabs .filter-tab[data-filter="all"]');
            if(defaultSort) defaultSort.classList.add('active');
            // Reload categories to show subcategories
            loadProductCategories();
            renderProductList();
          }
        });
        
        pv.catMenu.appendChild(mainLi);
        
        // Add children categories if they exist
        if(mainCategory.children && mainCategory.children.length > 0) {
          const childrenContainer = document.createElement('ul');
          childrenContainer.className = 'subcategories';
          childrenContainer.style.marginLeft = '20px';
          childrenContainer.style.marginTop = '5px';
          
          mainCategory.children.forEach(child => {
            const childLi = document.createElement('li');
            childLi.className = 'cat-item subcategory';
            childLi.innerHTML = `<a href="#" data-cat="${child.name}" data-cat-id="${child.id}" style="font-size: 0.9em; color: #666;">
              <i class="fa-solid fa-angle-right" style="font-size: 0.8em; margin-right: 3px;"></i>
              ${child.name}
            </a>`;
            
            // Click on child category
            childLi.querySelector('a').addEventListener('click', (e)=>{
              e.preventDefault();
              const categoryId = e.target.getAttribute('data-cat-id');
              const categoryName = e.target.getAttribute('data-cat');
              if(categoryId) {
                console.log('Child category clicked:', categoryName, 'ID:', categoryId);
                pvState.categoryId = categoryId;
                pvState.categoryName = categoryName;
                pvState.filteredItems = null; // Clear filtered items to use direct API call
                pvState.page = 1;
                pvState.sort = 'all';
                updatePageTitle();
                document.querySelectorAll('.filter-tabs .filter-tab').forEach(b=>b.classList.remove('active'));
                const defaultSort = document.querySelector('.filter-tabs .filter-tab[data-filter="all"]');
                if(defaultSort) defaultSort.classList.add('active');
                
                // Set active class for the selected subcategory
                document.querySelectorAll('.cat-item a').forEach(link => {
                  link.classList.remove('active');
                });
                e.target.classList.add('active');
                
                console.log('About to render product list with categoryId:', pvState.categoryId);
                renderProductList();
              }
            });
            
            childrenContainer.appendChild(childLi);
          });
          
          pv.catMenu.appendChild(childrenContainer);
        }
      });
    }
  }

  function filterProductViewBySubCategory(categoryId, subCategoryName){
    console.log('Filtering by subcategory:', subCategoryName, 'Parent ID:', categoryId);
    console.log('Available categories:', categories.length);
    
    // Find the subcategory by name (it should be in the flat categories array)
    const subCategory = categories.find(cat => 
      cat.name.toLowerCase() === subCategoryName.toLowerCase()
    );
    
    if (!subCategory) {
      console.error('Subcategory not found:', subCategoryName);
      console.log('Available category names:', categories.map(c => c.name));
      return;
    }
    
    console.log('Found subcategory:', subCategory.name, 'ID:', subCategory.id, 'Parent ID:', subCategory.parentId);
    
    // Use the PARENT category ID instead of subcategory ID
    // Backend API will automatically include products from parent and all subcategories
    const parentId = subCategory.parentId || categoryId;
    const qs = `?categoryId=${encodeURIComponent(parentId)}&take=1000`;
    console.log('API query with PARENT ID:', `/products${qs}`);
    
    window.apiService.get(`/products${qs}`).then(res => {
      if(!res?.success) {
        console.error('Failed to load products for subcategory:', res?.message);
        return;
      }
      
      // Handle nested data structure: res.data.data
      const data = res.data?.data || res.data;
      const allItems = Array.isArray(data) ? data : [];
      
      console.log(`Found ${allItems.length} products for parent category: ${parentId}`);
      
      // Check if products have category information
      if (allItems.length > 0) {
        console.log('Sample product structure:', allItems[0]);
        console.log('Sample product category:', allItems[0].category);
      }
      
      // Filter products by product name containing subcategory name
      // Since products might be assigned to parent category, we filter by name pattern
      console.log('Filtering products for subcategory:', subCategoryName);
      
      const filteredItems = allItems.filter(item => {
        // Try multiple filter strategies:
        // 1. Check if product categoryId matches subcategory ID
        const matchesCategoryId = item.categoryId === subCategory.id;
        
        // 2. Check if product category object matches
        const matchesCategoryObject = item.category?.id === subCategory.id;
        
        // 3. Check if product name contains subcategory name (fallback)
        const nameContainsSubcategory = item.name.toLowerCase().includes(subCategoryName.toLowerCase());
        
        const matches = matchesCategoryId || matchesCategoryObject || nameContainsSubcategory;
        
        if (matches) {
          console.log('✅ Match:', item.name, '| categoryId:', item.categoryId, '| category.id:', item.category?.id, '| name match:', nameContainsSubcategory);
        }
        
        return matches;
      });
      console.log(`✅ Filtered to ${filteredItems.length} products for subcategory: ${subCategoryName}`);
      
      pvState.filteredItems = filteredItems; // Use filtered items
      pvState.categoryId = subCategory.id; // Keep subcategory ID for display
      pvState.categoryName = subCategoryName; // Update category name
      pvState.page = 1;
      pvState.allLoadedProducts = [];
      pvState.hasMoreProducts = true;
      
      // Set active class for the selected subcategory
      document.querySelectorAll('.cat-item a').forEach(link => {
        link.classList.remove('active');
        if(link.getAttribute('data-subcategory') === subCategoryName) {
          link.classList.add('active');
        }
      });
      
      renderProductList();
      setupInfiniteScroll();
    }).catch(error => {
      console.error('Error loading subcategory products:', error);
    });
  }

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
      const res = await window.apiService.get('/categories');
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
      console.log(`Product-All Category: ${c.name}, ID: ${categoryId}`); // Debug log
      
      // Check if categoryId is empty and try alternative names
      if (!categoryId) {
        console.warn(`No categoryId found for: ${c.name}`);
        // Try without special characters
        const altName = c.name.replace(/[-\s]/g, '').toLowerCase();
        const altCategoryId = categoryNameToId.get(altName);
        if (altCategoryId) {
          console.log(`Found alternative ID for ${c.name}: ${altCategoryId}`);
        }
      }
      
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
    if(pvState.categoryId) {
      params.set('categoryId', pvState.categoryId);
      console.log('Building query with categoryId:', pvState.categoryId);
      
      // Find category info for debugging
      const categoryInfo = categories.find(c => c.id === pvState.categoryId);
      if (categoryInfo) {
        console.log('Category info:', {
          id: categoryInfo.id,
          name: categoryInfo.name,
          parentId: categoryInfo.parentId,
          hasChildren: categoryInfo.children?.length > 0,
          childrenCount: categoryInfo.children?.length || 0
        });
        if (categoryInfo.children?.length > 0) {
          console.log('Subcategory IDs:', categoryInfo.children.map(c => ({id: c.id, name: c.name})));
        }
      }
    }
    
    switch(pvState.sort){
      case 'oldest': params.set('orderBy', 'createdAt:asc'); break;
      case 'newest': params.set('orderBy', 'createdAt:desc'); break;
      case 'price-high': params.set('orderBy', 'price:desc'); break;
      case 'name-asc': params.set('orderBy', 'name:asc'); break;
      case 'name-desc': params.set('orderBy', 'name:desc'); break;
      case 'bestseller': params.set('orderBy', 'sold:desc'); break;
    }
    
    params.set('minPrice', String(pvState.min));
    params.set('maxPrice', String(pvState.max));
    const queryString = params.toString();
    console.log('Built product query:', queryString);
    return queryString;
  }

  async function renderProductList(append = false){
    if(!productGrid) {
      console.error('productGrid element not found!');
      return;
    }
    
    if(pvState.isRendering) {
      console.log('Already rendering, skipping...');
      return;
    }
    pvState.isRendering = true;
    
    console.log('=== renderProductList START ===');
    console.log('pvState:', {
      categoryId: pvState.categoryId,
      categoryName: pvState.categoryName,
      page: pvState.page,
      pageSize: pvState.pageSize,
      sort: pvState.sort,
      min: pvState.min,
      max: pvState.max,
      filteredItems: pvState.filteredItems ? 'YES' : 'NO',
      append: append
    });
    
    if(pv.loading) pv.loading.removeAttribute('hidden');
    if(pv.empty) pv.empty.setAttribute('hidden','');
    if(!append) {
      productGrid.innerHTML = '';
      pvState.allLoadedProducts = [];
    }
    
    let items, meta, total;
    
    try {
      if(pvState.filteredItems !== null) {
        console.log('Using filteredItems, length:', pvState.filteredItems.length);
        
        // Apply price filter to filteredItems
        let allFilteredItems = pvState.filteredItems.filter(item => {
          const price = item.price || 0;
          return price >= pvState.min && price <= pvState.max;
        });
        console.log(`After price filter (${pvState.min}-${pvState.max}): ${allFilteredItems.length} items`);
        
        const startIndex = (pvState.page - 1) * pvState.pageSize;
        const endIndex = startIndex + pvState.pageSize;
        items = allFilteredItems.slice(startIndex, endIndex);
        meta = { total: allFilteredItems.length };
        total = allFilteredItems.length;
      } else {
        const qs = buildProductQuery();
        const apiUrl = `/products?${qs}`;
        console.log('Making API call to:', apiUrl);
        console.log('Full URL:', `${window.CONFIG?.API_BASE_URL || 'http://localhost:3000'}${apiUrl}`);
        
        const res = await window.apiService.get(`/products?${qs}`);
        console.log('Product-all API response:', res);
        console.log('Response structure:', {
          success: res?.success,
          hasData: !!res?.data,
          hasMeta: !!res?.meta,
          dataType: typeof res?.data,
          dataIsArray: Array.isArray(res?.data),
          dataHasData: res?.data?.data !== undefined
        });
        
        if (!res?.success) {
          console.error('Failed to load products:', res?.message || 'Unknown error');
          console.error('Full response:', res);
          items = [];
          meta = { total: 0 };
          total = 0;
        } else {
          console.log('📦 Raw res.data:', res.data);
          console.log('📦 Raw res.meta:', res.meta);
          
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
            // Object with data property: {success, data: {items: [...], total: X}}
            console.log('Using object structure, checking properties...');
            console.log('res.data keys:', Object.keys(res.data));
            data = res.data.items || res.data.products || res.data.data || [];
            meta = res.data.meta || res.meta || { total: res.data.total || 0 };
          } else {
            console.error('Unknown response structure!');
            data = [];
            meta = { total: 0 };
          }
          
          items = Array.isArray(data) ? data : [];
          total = Number(meta?.total || items.length || 0);
          console.log(`✅ Loaded ${items.length} products, total in DB: ${total}`);
          console.log('Meta info:', meta);
          if (items.length > 0) {
            console.log('First product:', items[0]);
            console.log('First product price:', items[0].price);
          } else if (total > 0) {
            console.warn('⚠️ Total > 0 but items.length = 0. Possible pagination/structure issue.');
          }
        }
      }
      
      // Track loaded products
      if (Array.isArray(items)) {
        pvState.allLoadedProducts = append ? [...pvState.allLoadedProducts, ...items] : items;
        pvState.hasMoreProducts = pvState.allLoadedProducts.length < total;
        console.log(`Loaded: ${items.length} products, Total loaded: ${pvState.allLoadedProducts.length}/${total}, Has more: ${pvState.hasMoreProducts}`);
      }
      
      const countEl = document.getElementById('productCount');
      if(countEl){
        countEl.textContent = String(total);
      }
      
      const pageInfo = document.getElementById('pageInfo');
      if(pageInfo) {
        const loadedCount = pvState.allLoadedProducts.length;
        pageInfo.textContent = `Đang hiển thị ${loadedCount} / ${total} sản phẩm`;
      }
      
      pvState.totalPages = Math.max(1, Math.ceil(total / pvState.pageSize));
      
      if (!Array.isArray(items)) {
        console.error('Items is not an array:', items);
        items = [];
      }
      items.forEach(p=>{
        const card = document.createElement('div');
        card.className = 'hp-card';
        card.style.cursor = 'pointer';
        
        // Handle both base64 images (from admin) and regular URLs (from seed)
        const imageUrl = (p.images && p.images[0]?.url) || '';
        let thumb;
        if (!imageUrl) {
          thumb = '/assets/Icon MatFlow.png';
        } else if (imageUrl.startsWith('data:image')) {
          // Base64 image from admin - use directly
          thumb = imageUrl;
        } else {
          // Regular URL from seed - use CONFIG.getAssetUrl
          thumb = CONFIG.getAssetUrl(imageUrl);
        }
        
        card.innerHTML = `
          <img src="${thumb}" alt="${p.name}" loading="lazy" style="width:100%;height:120px;object-fit:contain;background:#fff;border-radius:8px" onerror="this.src='/assets/Icon MatFlow.png'">
          <div class="name">${p.name}</div>
          <div class="price">${formatVND(p.price)}</div>
        `;
        card.addEventListener('click', ()=>{ window.location.href = `product-detail.html?id=${p.id}`; });
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
        pvState.filteredItems = null;
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
      pvState.categoryName = '';
      pvState.min = 0;
      pvState.max = 5000000;
      pvState.filteredItems = null;
      pvState.allLoadedProducts = [];
      pvState.hasMoreProducts = true;
      if(pv.minPrice) pv.minPrice.value = '0';
      if(pv.maxPrice) pv.maxPrice.value = '5000000';
      if(pv.priceLabel) pv.priceLabel.textContent = `${formatVND(0)} - ${formatVND(5000000)}`;
      document.querySelectorAll('.filter-tabs .filter-tab').forEach(b=>b.classList.remove('active'));
      const def = document.querySelector('.filter-tabs .filter-tab[data-filter="all"]') || document.querySelector('.filter-tabs .filter-tab');
      if(def) def.classList.add('active');
      updatePageTitle();
      renderProductList();
      setupInfiniteScroll();
    });
  }

  // Auto refresh products
  // Note: Commented out to avoid disrupting infinite scroll experience
  // Users can manually refresh if needed
  /*
  setInterval(()=>{
    if (!pvState.isRendering) {
      renderProductList();
    }
  }, 15000);
  */

  // Initialize everything in proper sequence
  async function initAll() {
    // 1. Load categories first
    await loadCategories();
    console.log('Categories loaded:', categories.length);
    
    // 2. Handle URL params (now categories are loaded) - only sets state, doesn't render yet
    handleURLParams();
    
    // 3. Initialize product view (sets up DOM elements)
    initProductView();
    
    // 4. Load category menu (now categories are available)
    await loadProductCategories();
    
    // 5. If there's a pending subcategory filter, apply it now
    if (pvState.pendingSubcategory) {
      console.log('Applying pending subcategory filter:', pvState.pendingSubcategory);
      filterProductViewBySubCategory(pvState.categoryId, pvState.pendingSubcategory);
      pvState.pendingSubcategory = null;
    } else {
      // 6. Render products (now everything is initialized)
      console.log('Initial render with categoryId:', pvState.categoryId);
      await renderProductList();
    }
    
    // 7. Setup infinite scroll
    setupInfiniteScroll();
    
    // 8. Load dropdown menu
    await loadProductsDropdown();
    
    // 9. Sync user UI
    syncUserUI();
  }
  
  // Start initialization
  initAll().catch(error => {
    console.error('Initialization error:', error);
  });
});
