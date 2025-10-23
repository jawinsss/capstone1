document.addEventListener('DOMContentLoaded', async () => {
    // ====== HELPER FUNCTIONS ======
    
    // Email validation
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Phone validation (Vietnamese phone numbers)
    function isValidPhone(phone) {
        const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8,9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    // ====== GLOBAL VARIABLES ======
    let isLoadingCategories = false;
    let isSubmittingCategory = false;
    let submitTimeout = null;
    
    // Audit log variables
    let currentAuditPage = 1;
    let currentAuditLimit = 20;
    let currentAuditFilters = {};
    let auditLogs = [];
    let auditStats = null;
    
    // ====== CATEGORIES FROM API ======
    var categories = []; // Global categories array

    // Load categories from API - GLOBAL FUNCTION
    async function loadCategories() {
        try {
            const res = await window.apiService.get('/categories');
            console.log('Categories API response:', res);
            if (res?.success) {
                // Debug API response structure
                console.log('Categories res.data type:', typeof res.data);
                console.log('Categories res.data isArray:', Array.isArray(res.data));
                console.log('Categories res.data keys:', Object.keys(res.data || {}));
                
                // Handle apiService wrapped response: {success: true, data: {success: true, data: [...]}}
                let data = res.data;
                if (data && typeof data === 'object' && data.success && Array.isArray(data.data)) {
                    // Unwrap the nested response
                    data = data.data;
                }
                categories = Array.isArray(data) ? data : [];
                console.log('Categories loaded:', categories);
            } else {
                categories = [];
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            categories = [];
        }
    }

    // Load categories first - ONLY ONCE
    await loadCategories();

    // ====== AUTH GUARD ======
    try {
        // Check for admin authentication using AuthContextManager
        let isAdminAuthenticated = false;
        let adminData = null;
        
        if (typeof window !== 'undefined' && window.authContextManager) {
            // Force switch to admin context for admin pages
            window.authContextManager.forceSwitchToAdmin();
            
            const context = window.authContextManager.getCurrentContext();
            const userData = window.authContextManager.getCurrentUserData();
            
            if (context === 'admin' && userData && userData.role === 'ADMIN') {
                isAdminAuthenticated = true;
                adminData = userData;
            }
        } else {
            // Fallback to legacy logic
            const adminToken = localStorage.getItem('admin_token');
            const legacyToken = localStorage.getItem('token') || localStorage.getItem('accessToken');
            
            if (adminToken) {
                isAdminAuthenticated = true;
                adminData = JSON.parse(localStorage.getItem('admin_data') || '{}');
            } else if (legacyToken) {
                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                if (userData.role === 'ADMIN') {
                    isAdminAuthenticated = true;
                    adminData = userData;
                }
            }
        }
        
        if (!isAdminAuthenticated) {
            window.location.replace('../../index.html');
            return;
        }
        
        // Initialize admin avatar if admin data exists
        if (adminData && typeof window.adminAvatarManager !== 'undefined') {
            try {
                window.adminAvatarManager.updateAdminUI(adminData);
            } catch (error) {
                console.error('Error parsing admin data:', error);
            }
        }
    } catch (_) { /* ignore */ }

    // ====== REAL-TIME DATA MANAGER ======
    class RealTimeManager {
        constructor() {
            this.intervals = new Map();
            this.isActive = true;
            this.refreshRates = {
                overview: 30000,    
                orders: 15000,      
                payments: 10000,    
                users: 60000,       
                returns: 20000,     
                products: 10000,    
                feedbacks: 30000    
            };
        }

        startAutoRefresh(viewName, callback) {
            this.stopAutoRefresh(viewName);
            const rate = this.refreshRates[viewName] || 30000;
            const intervalId = setInterval(() => {
                if (this.isActive && document.visibilityState === 'visible') {
                    callback();
                }
            }, rate);
            this.intervals.set(viewName, intervalId);
        }

        stopAutoRefresh(viewName) {
            if (this.intervals.has(viewName)) {
                clearInterval(this.intervals.get(viewName));
                this.intervals.delete(viewName);
            }
        }

        stopAll() {
            this.intervals.forEach(id => clearInterval(id));
            this.intervals.clear();
        }

        pause() {
            this.isActive = false;
        }

        resume() {
            this.isActive = true;
        }
    }

    const realTimeManager = new RealTimeManager();

    // Pause when tab is hidden, resume when visible
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            realTimeManager.pause();
        } else {
            realTimeManager.resume();
        }
    });

    // Stop all intervals when leaving page
    window.addEventListener('beforeunload', () => {
        realTimeManager.stopAll();
    });
    // ====== LẤY PHẦN TỬ CƠ BẢN ======
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const search = document.getElementById('globalSearch');
    const nav = document.getElementById('nav');
    const views = document.querySelectorAll('[data-view]');
    const topbarActions = document.getElementById('topbarActions');

    // Sidebar + Ctrl/Cmd + K để focus ô search
    if (toggle) toggle.addEventListener('click', () => sidebar?.classList.toggle('open'));
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault(); search && search.focus();
        }
    });

    // Nếu mục "Sản phẩm" chưa có data-link thì bổ sung
    const productsNav = [...(nav?.querySelectorAll('.nav-item, [data-link]') || [])]
        .find(a => a.textContent && a.textContent.trim().includes('Sản phẩm'));
    if (productsNav && !productsNav.dataset.link) {
        productsNav.dataset.link = 'products';
        productsNav.setAttribute('href', '#products');
    }

    // ====== KHAI BÁO ROUTES ======
    const ROUTES = {
        overview: {
            title: 'MatFlow Admin - Tổng quan',
            search: 'Tìm kiếm...',
            actions: []
        },
        orders: {
            title: 'MatFlow Admin - Đơn hàng',
            search: 'Tìm kiếm đơn hàng...',
            actions: [{ html: '<button class="btn">Xuất Excel</button>' }]
        },
        returns: {
            title: 'MatFlow Admin - Trả hàng & Hủy đơn',
            search: 'Tìm kiếm yêu cầu trả hàng...',
            actions: [{ html: '<button class="btn">Xuất báo cáo</button>' }]
        },
        products: {
            title: 'MatFlow Admin - Sản phẩm',
            search: 'Tìm kiếm sản phẩm...',
            actions: [{ html: '<button class="btn" id="goToAddProduct">Thêm sản phẩm</button>' }]
        },
        categories: {
            title: 'MatFlow Admin - Quản lý danh mục',
            search: 'Tìm kiếm danh mục...',
            actions: [{ html: '<button class="btn" id="goToAddCategory">Thêm danh mục</button>' }]
        },
        feedbacks: {
            title: 'MatFlow Admin - Hỗ trợ & Khiếu nại',
            search: 'Tìm theo tên, email, nội dung...',
            actions: [{ html: '<button class="btn" id="btnNewTicket">Tạo ticket</button>' }]
        },
        users: {
            title: 'MatFlow Admin - Người dùng',
            search: 'Tìm theo tên, email, SĐT...',
            actions: [{ html: '<button class="btn" id="btnNewUser">Tạo người dùng</button>' }]
        },
        payments: {
            title: 'MatFlow Admin - Thanh toán',
            search: ' tìm theo trạng thái,họ tên,thanh toán,chưa thanh toán,chờ xác nhận...',
            actions:[{html: '<button class="btn" id="btnPayments">Xác nhận thanh toán</button>'}]
        },
        reports: {
            title: 'MatFlow Admin - Báo cáo',
            search: 'Tìm theo báo cáo, ngày,tuần,tháng,năm....',
            actions:[{html: '<button class="btn" id="btnReports">Làm mới thống kê</button>'}]
        },
        banner: {
            title: 'MatFlow Admin - Banner',
            search: 'Tìm theo sự kiện giảm giá....',
            actions:[{html: '<button class="btn" id="btnBanner">Thêm banner/sự kiện giảm giá</button>'}]
        }
    };

    const inited = new Set();
    const setActive = (name) => {
        document.querySelectorAll('[data-link]').forEach(a => {
            a.classList.toggle('active', a.getAttribute('data-link') === name);
        });
    };

    // ====== HIỂN THỊ VIEW ======
    function showView(name, replaceState = false) {
        const available = Array.from(views).map(v => v.getAttribute('data-view'));
        const route = available.includes(name) ? name : 'overview';

        // Ẩn/hiện
        views.forEach(v => v.hidden = v.getAttribute('data-view') !== route);
        setActive(route);

        // Meta + actions
        const meta = ROUTES[route] || {};
        document.title = meta.title || 'MatFlow Admin';
        if (search) search.placeholder = meta.search || 'Tìm kiếm...';
        if (topbarActions) topbarActions.innerHTML = (meta.actions || []).map(a => a.html).join('');

        // Bind action topbar (Sản phẩm → chuyển sang tab Thêm)
        if (route === 'products') {
            const btn = document.getElementById('goToAddProduct');
            btn && btn.addEventListener('click', () => {
                const view = document.querySelector('[data-view="products"]');
                const tabs = view?.querySelectorAll('.tabs .tab-btn');
                tabs && tabs[1] && tabs[1].click();
            });
        }

        // Bind action topbar (Categories → chuyển sang tab Thêm)
        if (route === 'categories') {
            const btn = document.getElementById('goToAddCategory');
            btn && btn.addEventListener('click', () => {
                const view = document.querySelector('[data-view="categories"]');
                const tabs = view?.querySelectorAll('.tabs .tab-btn');
                tabs && tabs[1] && tabs[1].click();
            });
        }

        // Khởi tạo 1 lần cho mỗi view
        if (!inited.has(route)) {
            if (route === 'products') initProductsView();
            if (route === 'categories') initCategoriesView();
            if (route === 'overview') initOverviewView();
            if (route === 'orders') initOrdersView();
            if (route === 'payments') initPaymentsView();
            if (route === 'users') initUsersView();
            if (route === 'returns') initReturnsView();
            if (route === 'feedbacks') initFeedbacksView();
            if (route === 'reports') initReportsView();
            if (route === 'banner') initBannerView();
            if (route === 'audit') initializeAuditLog();
            inited.add(route);
        }

        // Stop previous auto-refresh and start new one
        realTimeManager.stopAll();
        if (route === 'overview') {
            realTimeManager.startAutoRefresh('overview', () => {
                const view = document.querySelector('[data-view="overview"]');
                if (view && !view.hidden) {
                    loadOverviewData();
                }
            });
        } else if (route === 'payments') {
            realTimeManager.startAutoRefresh('payments', () => {
                const view = document.querySelector('[data-view="payments"]');
                if (view && !view.hidden) {
                    loadPaymentsData();
                }
            });
        } else if (route === 'returns') {
            realTimeManager.startAutoRefresh('returns', () => {
                const view = document.querySelector('[data-view="returns"]');
                if (view && !view.hidden) {
                    loadReturnsData();
                }
            });
        } else if (route === 'users') {
            realTimeManager.startAutoRefresh('users', () => {
                const view = document.querySelector('[data-view="users"]');
                if (view && !view.hidden) {
                    loadUsersData();
                }
            });
        } else if (route === 'products') {
            // Disable auto-refresh for products to prevent console spam
            // realTimeManager.startAutoRefresh('products', () => {
            //     const view = document.querySelector('[data-view="products"]');
            //     if (view && !view.hidden) {
            //         loadProductsData();
            //     }
            // });
        }

        // Đồng bộ hash/history
        const hash = '#' + route;
        if (location.hash !== hash) {
            if (replaceState) history.replaceState({ route }, '', hash);
            else history.pushState({ route }, '', hash);
        }
    }

    // Điều hướng sidebar
    nav && nav.addEventListener('click', (e) => {
        const link = e.target.closest('[data-link]');
        if (link) {
            e.preventDefault();
            showView(link.dataset.link);
        }
    });

    // Back/forward
    window.addEventListener('popstate', () => {
        const name = (location.hash || '#overview').slice(1);
        showView(name, true);
    });

    // Lần đầu vào trang
    showView((location.hash || '#overview').slice(1), true);

    // ====== ĐĂNG XUẤT ======
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            try {
                console.log('Admin: Admin logout clicked');
                console.log('Admin: Before logout - user_token:', !!localStorage.getItem('user_token'));
                console.log('Admin: Before logout - admin_token:', !!localStorage.getItem('admin_token'));
                
                // Use auth context manager if available
                if (typeof window.authContextManager !== 'undefined') {
                    // Only logout admin, keep user context if exists
                    window.authContextManager.logoutAdmin();
                } else {
                    // Fallback: only clear admin data, keep user data
                    localStorage.removeItem('admin_token');
                    localStorage.removeItem('admin_data');
                    // Keep legacy token cleanup for admin-specific tokens
                    localStorage.removeItem('token');
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                }
                
                console.log('Admin: After logout - user_token:', !!localStorage.getItem('user_token'));
                console.log('Admin: After logout - admin_token:', !!localStorage.getItem('admin_token'));
                
                // Clear admin-specific cookies only
                document.cookie.split(';').forEach(c => {
                    const n = c.split('=')[0].trim();
                    if (n && (n.includes('admin') || n.includes('token'))) {
                        document.cookie = `${n}=; Max-Age=0; path=/`;
                    }
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
            // Redirect to login page instead of reload
            window.location.href = '../../index.html';
        });
    }

    // ====== VIEW CATEGORIES ======
    function initCategoriesView() {
        const view = document.querySelector('[data-view="categories"]');
        if (!view) return;

        // Tab switching
        const tabBtns = view.querySelectorAll('.tabs .tab-btn');
        const categoriesListView = view.querySelector('#categoriesListView');
        const addCategoryView = view.querySelector('#addCategoryView');

        function showTab(index) {
            tabBtns.forEach((b, i) => b.classList.toggle('active', i === index));
            if (index === 0) {
                categoriesListView.style.display = 'block';
                addCategoryView.style.display = 'none';
            } else {
                categoriesListView.style.display = 'none';
                addCategoryView.style.display = 'block';
            }
        }
        showTab(0);
        tabBtns.forEach((btn, i) => btn.addEventListener('click', () => showTab(i)));

        // Load categories data
        loadCategoriesData();

        // Form handling with debounce
        const addCategoryForm = view.querySelector('#addCategoryForm');
        if (addCategoryForm) {
            addCategoryForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Clear existing timeout
                if (submitTimeout) {
                    clearTimeout(submitTimeout);
                }
                
                // Debounce submit to prevent multiple calls
                submitTimeout = setTimeout(async () => {
                    await addCategory();
                }, 300);
            });
        }

        // Load parent categories for select
        loadParentCategoriesForForm();

        // Add event listener for edit form
        const editCategoryForm = document.getElementById('editCategoryForm');
        if (editCategoryForm) {
            editCategoryForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await updateCategory();
            });
        }

        // Add click outside to close modals
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                closeEditModal();
                closeDeleteModal();
            }
        });

        // Add debounce to refresh button
        const refreshBtn = view.querySelector('#refreshCategories');
        if (refreshBtn) {
            let refreshTimeout;
            refreshBtn.addEventListener('click', () => {
                clearTimeout(refreshTimeout);
                refreshTimeout = setTimeout(() => {
                    loadCategoriesData();
                }, 300);
            });
        }
    }

    async function loadParentCategoriesForForm() {
        const select = document.getElementById('parentCategory');
        if (!select) return;

        try {
            const res = await window.apiService.get('/categories/main');
            console.log('Main categories API response:', res);
            
            // Handle both wrapped and direct response formats
            let mainCategories = [];
            if (res?.success && res.data) {
                // Check if res.data is nested response: {success: true, data: [...]}
                if (typeof res.data === 'object' && res.data.success && Array.isArray(res.data.data)) {
                    mainCategories = res.data.data;
                } else if (Array.isArray(res.data)) {
                    mainCategories = res.data;
                }
            } else if (Array.isArray(res)) {
                mainCategories = res;
            } else if (res?.data && Array.isArray(res.data)) {
                mainCategories = res.data;
            }
            
            console.log('Main categories loaded:', mainCategories);
            
            select.innerHTML = '<option value="">Chọn danh mục cha (để trống nếu là danh mục chính)</option>';
            mainCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            });
        } catch (e) {
            console.error('Load parent categories error:', e);
        }
    }

    // ====== LOAD PARENT CATEGORIES FOR EDIT FORM ======
    async function loadParentCategoriesForEditForm() {
        const select = document.getElementById('editParentCategory');
        if (!select) return;

        try {
            // Use global categories if available
            let categoriesData = categories;
            if (!categoriesData || categoriesData.length === 0) {
                const res = await window.apiService.get('/categories');
                if (res?.success) {
                    let data = res.data;
                    if (data && typeof data === 'object' && data.success && Array.isArray(data.data)) {
                        data = data.data;
                    }
                    categoriesData = Array.isArray(data) ? data : [];
                }
            }
            
            // Clear existing options
            select.innerHTML = '<option value="">Chọn danh mục cha (để trống nếu là danh mục chính)</option>';
            
            // Add main categories only (exclude current category and its children)
            const mainCategories = categoriesData.filter(cat => 
                !cat.parentId && 
                cat.id !== currentEditCategoryId &&
                cat.parentId !== currentEditCategoryId
            );
            mainCategories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
            });
        } catch (e) {
            console.error('Load parent categories for edit error:', e);
        }
    }

    async function addCategory() {
        // Prevent multiple simultaneous submissions
        if (isSubmittingCategory) {
            console.log('Category submission already in progress, skipping...');
            return;
        }

        const nameInput = document.getElementById('categoryName');
        const parentId = document.getElementById('parentCategory').value;
        const description = document.getElementById('categoryDescription').value.trim();

        const name = nameInput ? nameInput.value.trim() : '';

        // Clear any previous validation first
        if (nameInput) {
            nameInput.setCustomValidity('');
        }

        if (!name) {
            if (nameInput) {
                nameInput.setCustomValidity('Vui lòng nhập tên danh mục');
                // Force validation check
                if (!nameInput.checkValidity()) {
                    nameInput.reportValidity();
                }
            } else {
                alert('Vui lòng nhập tên danh mục');
            }
            return;
        }

        // Check for duplicate name in current categories
        const view = document.querySelector('[data-view="categories"]');
        if (view) {
            const existingCategories = view.querySelectorAll('.category-item');
            for (const categoryEl of existingCategories) {
                const categoryName = categoryEl.querySelector('.category-name')?.textContent?.trim();
                const categoryParentId = categoryEl.dataset.parentId || null;
                
                if (categoryName === name && categoryParentId === (parentId || null)) {
                    alert(`Danh mục "${name}" đã tồn tại trong danh mục cha này`);
                    return;
                }
            }
        }

        isSubmittingCategory = true;
        
        // Disable submit button
        const submitBtn = document.querySelector('#addCategoryForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tạo...';
        }

        try {
            const categoryData = {
                name,
                description: description || undefined,
                parentId: parentId || undefined
            };

            console.log('Sending category data:', categoryData);
            const res = await window.apiService.post('/categories', categoryData);
            console.log('Add category response:', res);
            
            if (res?.success) {
                showNotification('Thêm danh mục thành công!', 'success');
                
                // Reset form
                document.getElementById('addCategoryForm').reset();
                
                // Update global categories with new data
                if (res.data) {
                    // Handle API response structure properly
                    let data = res.data;
                    if (data && typeof data === 'object' && data.success && Array.isArray(data.data)) {
                        data = data.data;
                    }
                    categories = Array.isArray(data) ? data : [];
                    window.lastCategoriesLoad = Date.now();
                }
                
                // Reload data after a short delay to avoid race condition
                setTimeout(() => {
                    loadCategoriesData();
                }, 500);
                
                // Switch to list view
                const view = document.querySelector('[data-view="categories"]');
                const tabBtns = view?.querySelectorAll('.tabs .tab-btn');
                if (tabBtns && tabBtns[0]) {
                    tabBtns[0].click();
                }
            } else {
                alert(res?.message || 'Thêm danh mục thất bại');
            }
        } catch (e) {
            console.error('Add category error:', e);
            alert('Có lỗi khi thêm danh mục: ' + (e.message || 'Lỗi không xác định'));
        } finally {
            isSubmittingCategory = false;
            
            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Thêm danh mục';
            }
        }
    }

    // ====== LOAD CATEGORIES DATA ======
    async function loadCategoriesData() {
        const view = document.querySelector('[data-view="categories"]');
        if (!view) return;

        // Prevent multiple simultaneous calls
        if (isLoadingCategories) {
            console.log('Categories already loading, skipping...');
            return;
        }

        isLoadingCategories = true;
        
        // Use global categories if available and recent (less than 30 seconds old)
        const now = Date.now();
        if (window.lastCategoriesLoad && (now - window.lastCategoriesLoad) < 30000 && categories && categories.length > 0) {
            console.log('Using cached categories data');
            renderCategoriesTree(categories);
            isLoadingCategories = false;
            return;
        }
        
        try {
            const res = await window.apiService.get('/categories');
            console.log('Categories API response:', res);
            
            // Handle both wrapped and direct response formats
            let categoriesData = [];
            if (res?.success && res.data) {
                // Check if res.data is nested response: {success: true, data: [...]}
                if (typeof res.data === 'object' && res.data.success && Array.isArray(res.data.data)) {
                    categoriesData = res.data.data;
                } else if (Array.isArray(res.data)) {
                    categoriesData = res.data;
                }
            } else if (Array.isArray(res)) {
                categoriesData = res;
            } else if (res?.data && Array.isArray(res.data)) {
                categoriesData = res.data;
            }
            
            // Update global categories
            categories = categoriesData;
            window.lastCategoriesLoad = Date.now(); // Cache timestamp
            console.log('Categories loaded:', categories);
            
            // Update stats
            const totalCategories = categories.length;
            const mainCategories = categories.filter(cat => !cat.parentId).length;
            const subCategories = categories.filter(cat => cat.parentId).length;
            const activeCategories = categories.filter(cat => cat.isActive).length;

            const stats = view.querySelectorAll('.order-stats .order-stat-value');
            if (stats[0]) stats[0].textContent = String(totalCategories);
            if (stats[1]) stats[1].textContent = String(mainCategories);
            if (stats[2]) stats[2].textContent = String(subCategories);
            if (stats[3]) stats[3].textContent = String(activeCategories);

            // Render categories tree
            renderCategoriesTree(categories);
        } catch (e) {
            console.error('Load categories data error:', e);
        } finally {
            isLoadingCategories = false;
        }
    }

    function renderCategoriesTree(categories) {
        const container = document.getElementById('categoriesTree');
        if (!container) return;

        if (categories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-tags"></i>
                    <div>Chưa có danh mục nào</div>
                    <div style="margin-top: 8px; font-size: 0.875rem;">Hãy thêm danh mục đầu tiên</div>
                </div>
            `;
            return;
        }

        const mainCategories = categories.filter(cat => !cat.parentId);
        const subCategories = categories.filter(cat => cat.parentId);

        let html = '';
        mainCategories.forEach(category => {
            html += renderCategoryItem(category, false);
            
            // Render subcategories
            const children = subCategories.filter(sub => sub.parentId === category.id);
            if (children.length > 0) {
                html += '<div class="category-children">';
                children.forEach(child => {
                    html += renderCategoryItem(child, true);
                });
                html += '</div>';
            }
        });

        container.innerHTML = html;
    }

    function renderCategoryItem(category, isSubCategory) {
        const categoryClass = isSubCategory ? 'sub-category' : 'main-category';
        const icon = isSubCategory ? 'fa-tag' : 'fa-folder';
        
        return `
            <div class="category-item ${categoryClass}" data-category-id="${category.id}" data-parent-id="${category.parentId || ''}">
                <div class="category-info">
                    <div class="category-name">
                        <i class="fa-solid ${icon}"></i>
                        ${category.name}
                    </div>
                    ${category.description ? `<div class="category-description">${category.description}</div>` : ''}
                </div>
                <div class="category-actions">
                    <button class="btn" onclick="editCategory('${category.id}')" title="Chỉnh sửa">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                    <button class="btn" onclick="deleteCategory('${category.id}')" title="Xóa" style="background: #ef4444; color: white; border-color: #dc2626;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Global functions for category actions
    let currentEditCategoryId = null;
    let currentDeleteCategoryId = null;

    window.editCategory = async function(categoryId) {
        // Find category data
        const category = categories.find(cat => cat.id === categoryId);
        if (!category) {
            alert('Không tìm thấy danh mục');
            return;
        }

        currentEditCategoryId = categoryId;
        
        // Populate form
        document.getElementById('editCategoryName').value = category.name;
        document.getElementById('editCategoryDescription').value = category.description || '';
        
        // Load parent categories for select
        await loadParentCategoriesForEditForm();
        
        // Set current parent
        document.getElementById('editParentCategory').value = category.parentId || '';
        
        // Show modal
        document.getElementById('editCategoryModal').style.display = 'flex';
    };

    window.deleteCategory = async function(categoryId) {
        // Find category data
        const category = categories.find(cat => cat.id === categoryId);
        if (!category) {
            alert('Không tìm thấy danh mục');
            return;
        }

        currentDeleteCategoryId = categoryId;
        
        // Set category name in modal
        document.getElementById('deleteCategoryName').textContent = category.name;
        
        // Show modal
        document.getElementById('deleteCategoryModal').style.display = 'flex';
    };

    // Modal functions
    window.closeEditModal = function() {
        document.getElementById('editCategoryModal').style.display = 'none';
        currentEditCategoryId = null;
    };

    window.closeDeleteModal = function() {
        document.getElementById('deleteCategoryModal').style.display = 'none';
        currentDeleteCategoryId = null;
    };

    window.confirmDeleteCategory = async function() {
        if (!currentDeleteCategoryId) return;

        try {
            console.log('Deleting category:', currentDeleteCategoryId);
            const res = await window.apiService.delete(`/categories/${currentDeleteCategoryId}?hard=true`);
            console.log('Delete category response:', res);
            
            if (res?.success) {
                showNotification('Xóa danh mục thành công!', 'success');
                
                // Update global categories immediately
                categories = categories.filter(cat => cat.id !== currentDeleteCategoryId);
                window.lastCategoriesLoad = Date.now();
                
                // Force reload data from server
                setTimeout(() => {
                    loadCategoriesData();
                }, 100);
                
                // Close modal
                closeDeleteModal();
            } else {
                alert(res?.message || 'Xóa danh mục thất bại');
            }
        } catch (e) {
            console.error('Delete category error:', e);
            alert('Có lỗi khi xóa danh mục: ' + (e.message || 'Lỗi không xác định'));
        }
    };

    // ====== UPDATE CATEGORY ======
    async function updateCategory() {
        if (!currentEditCategoryId) return;

        const nameInput = document.getElementById('editCategoryName');
        const description = document.getElementById('editCategoryDescription').value.trim();
        const parentId = document.getElementById('editParentCategory').value;

        // Clear any previous validation
        if (nameInput) {
            nameInput.setCustomValidity('');
        }

        const name = nameInput ? nameInput.value.trim() : '';

        if (!name) {
            if (nameInput) {
                nameInput.setCustomValidity('Vui lòng nhập tên danh mục');
                // Force validation check
                if (!nameInput.checkValidity()) {
                    nameInput.reportValidity();
                }
            } else {
                alert('Vui lòng nhập tên danh mục');
            }
            return;
        }

        try {
            const updateData = {
                name: name,
                description: description || undefined,
                parentId: parentId || undefined
            };

            console.log('Updating category:', currentEditCategoryId, updateData);
            const res = await window.apiService.put(`/categories/${currentEditCategoryId}`, updateData);
            console.log('Update category response:', res);
            
            if (res?.success) {
                showNotification('Cập nhật danh mục thành công!', 'success');
                
                // Update global categories
                const categoryIndex = categories.findIndex(cat => cat.id === currentEditCategoryId);
                if (categoryIndex !== -1) {
                    categories[categoryIndex] = { ...categories[categoryIndex], ...updateData };
                }
                window.lastCategoriesLoad = Date.now();
                
                // Reload data
                loadCategoriesData();
                
                // Close modal
                closeEditModal();
            } else {
                alert(res?.message || 'Cập nhật danh mục thất bại');
            }
        } catch (e) {
            console.error('Update category error:', e);
            alert('Có lỗi khi cập nhật danh mục: ' + (e.message || 'Lỗi không xác định'));
        }
    }

    // ====== VIEW SẢN PHẨM ======
    function initProductsView() {
        const view = document.querySelector('[data-view="products"]');
        if (!view) return;

        // Sửa lỗi HTML gõ nhầm: <intput> -> <input>, row -> rows
        view.querySelectorAll('intput').forEach(el => {
            const input = document.createElement('input');
            // Copy class/attr
            [...el.attributes].forEach(a => input.setAttribute(a.name, a.value));
            input.className = el.className;
            input.placeholder = el.getAttribute('placeholder') || '';
            el.replaceWith(input);
        });
        view.querySelectorAll('textarea[row]').forEach(ta => {
            ta.setAttribute('rows', ta.getAttribute('row'));
            ta.removeAttribute('row');
        });

        // Tabs + panel
        const tabBtns = view.querySelectorAll('.tabs .tab-btn');
        const filterPanel = view.querySelector('.order-filter.panel');
        const listPanel = filterPanel ? filterPanel.nextElementSibling : null;
        const addTitle = [...view.querySelectorAll('h2')].find(h => /thêm.+sản phẩm/i.test(h.textContent || '')) || view.querySelector('h2');
        const formPanel = addTitle ? addTitle.nextElementSibling : null;

        function showTab(index) {
            tabBtns.forEach((b, i) => b.classList.toggle('active', i === index));
            if (index === 0) {
                filterPanel && filterPanel.removeAttribute('hidden');
                listPanel && listPanel.removeAttribute('hidden');
                addTitle && addTitle.setAttribute('hidden', '');
                formPanel && formPanel.setAttribute('hidden', '');
            } else {
                filterPanel && filterPanel.setAttribute('hidden', '');
                listPanel && listPanel.setAttribute('hidden', '');
                addTitle && addTitle.removeAttribute('hidden');
                formPanel && formPanel.removeAttribute('hidden');
            }
        }
        showTab(0);
        tabBtns.forEach((btn, i) => btn.addEventListener('click', () => showTab(i)));

        // Reset bộ lọc
        const resetLink = view.querySelector('.order-filter .link-reset');
        resetLink && resetLink.addEventListener('click', (e) => {
            e.preventDefault();
            view.querySelectorAll('.order-filter select').forEach(sel => sel.selectedIndex = 0);
            showTab(0);
        });

        // Auto load products data when view is initialized
        loadProductsData();

        // ==== Form ====
        if (!formPanel) return;

        const nameInput = formPanel.querySelector('.filter-grid .filter-field:nth-child(1) input');
        const priceInput = formPanel.querySelector('.filter-grid .filter-field:nth-child(2) input');
        const categorySelect = formPanel.querySelector('.filter-grid .filter-field:nth-child(3) select');
        const descTextarea = formPanel.querySelector('textarea.textarea');
        const stockInput = formPanel.querySelector('#inputStock');
        const uploadZone = formPanel.querySelector('.upload-zone');
        const infoBox = formPanel.querySelector('.split-right');
        const subRows = infoBox ? infoBox.querySelectorAll('.list-sub') : [];

        const setInfo = {
            name: (v) => subRows[0] && (subRows[0].textContent = `Tên sản phẩm: ${v || 'Chưa nhập'}`),
            price: (v) => subRows[1] && (subRows[1].textContent = `Giá bán: ${formatCurrency(v) || 'Chưa nhập'}`),
            qty: (v) => subRows[2] && (subRows[2].textContent = `Số lượng: ${v ?? 0}`),
            cat: (v) => subRows[3] && (subRows[3].textContent = `Danh mục: ${v || 'Chưa chọn'}`),
            imgs: (n) => subRows[4] && (subRows[4].textContent = `Hình ảnh: ${n || 0} ảnh`),
        };

        nameInput && nameInput.addEventListener('input', (e) => setInfo.name(e.target.value));
        priceInput && priceInput.addEventListener('input', (e) => setInfo.price(e.target.value));
        categorySelect && categorySelect.addEventListener('change', (e) => setInfo.cat(e.target.value));
        stockInput && stockInput.addEventListener('input', (e) => setInfo.qty(e.target.value));

        // Initialize image uploader
        let imageUploader = null;
        let selectedFiles = [];
        
        if (uploadZone) {
            imageUploader = new ImageUploader({
                maxFiles: 10,
                maxSize: 5 * 1024 * 1024, // 5MB
                allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
                onChange: (files) => {
                    selectedFiles = files;
                    setInfo.imgs(files.length);
                }
            });
            
            imageUploader.init('productImageUpload');
            
            // Store in global scope for access from addProduct
            window.imageUploader = imageUploader;
        }

        const addBtn = infoBox?.querySelector('.btn');
        const cancelBtn = infoBox?.querySelectorAll('.btn')[1];

        // Standard categories and child types from homepage (moved to global scope)

        // Load categories - ONLY PARENT CATEGORIES
        async function loadCategories() {
            const mainCategorySelect = document.getElementById('mainCategorySelect');
            const subCategorySelect = document.getElementById('subCategorySelect');
            
            if (!mainCategorySelect) return;
            
            try {
                // Load only parent categories (parentId = null)
                const res = await window.apiService.get('/categories/main');
                console.log('Parent categories API response:', res);
                
                let parentCategories = [];
                if (res?.success && res.data) {
                    // Check if res.data is nested response: {success: true, data: [...]}
                    if (typeof res.data === 'object' && res.data.success && Array.isArray(res.data.data)) {
                        parentCategories = res.data.data;
                    } else if (Array.isArray(res.data)) {
                        parentCategories = res.data;
                    }
                } else if (Array.isArray(res)) {
                    parentCategories = res;
                }
                
                console.log('Parent categories for form:', parentCategories);
                
                mainCategorySelect.innerHTML = '';
                const placeholder = document.createElement('option');
                placeholder.textContent = 'Chọn danh mục sản phẩm';
                placeholder.value = '';
                mainCategorySelect.appendChild(placeholder);
                
                parentCategories.forEach(cat => {
                    const opt = document.createElement('option');
                    opt.value = cat.id;
                    opt.textContent = cat.name;
                    mainCategorySelect.appendChild(opt);
                });
            } catch (e) {
                console.error('Load parent categories error', e);
            }

            // Handle main category change
            mainCategorySelect.addEventListener('change', (e) => {
                const selectedCategoryId = e.target.value;
                updateSubCategories(selectedCategoryId);
            });
        }

        // Update sub categories based on main category
        async function updateSubCategories(parentCategoryId) {
            const subCategorySelect = document.getElementById('subCategorySelect');
            if (!subCategorySelect) return;

            subCategorySelect.innerHTML = '';
            const placeholder = document.createElement('option');
            placeholder.textContent = 'Chọn danh mục con';
            placeholder.value = '';
            subCategorySelect.appendChild(placeholder);

            if (!parentCategoryId) {
                subCategorySelect.disabled = true;
                return;
            }

            try {
                // Load children categories for the selected parent
                const res = await window.apiService.get(`/categories/${parentCategoryId}/subcategories`);
                console.log('Children categories API response:', res);
                
                let childrenCategories = [];
                if (res?.success && res.data) {
                    // Check if res.data is nested response: {success: true, data: [...]}
                    if (typeof res.data === 'object' && res.data.success && Array.isArray(res.data.data)) {
                        childrenCategories = res.data.data;
                    } else if (Array.isArray(res.data)) {
                        childrenCategories = res.data;
                    }
                } else if (Array.isArray(res)) {
                    childrenCategories = res;
                }

                if (childrenCategories.length > 0) {
                    subCategorySelect.disabled = false;
                    childrenCategories.forEach(child => {
                        const opt = document.createElement('option');
                        opt.value = child.id;
                        opt.textContent = child.name;
                        subCategorySelect.appendChild(opt);
                    });
                } else {
                    subCategorySelect.disabled = true;
                }
            } catch (e) {
                console.error('Load children categories error', e);
                subCategorySelect.disabled = true;
            }
        }

        // Infinite scroll state
        let productsState = {
            page: 1,
            pageSize: 20,
            isLoading: false,
            hasMore: true,
            totalProducts: 0,
            container: null
        };

        // Render products list (append mode for infinite scroll)
        function renderProducts(products, append = false) {
            if (!listPanel) return;
            
            // Handle API response structure
            if (!Array.isArray(products)) {
                console.error('Products is not an array:', products);
                products = [];
            }
            
            // Get or create container
            if (!append || !productsState.container) {
                productsState.container = document.createElement('div');
                productsState.container.className = 'list';
                productsState.container.id = 'productsListContainer';
                productsState.container.style.maxHeight = '600px';
                productsState.container.style.overflowY = 'auto';
                productsState.container.style.overflowX = 'hidden';
            }
            
            const container = productsState.container;
            
            products.forEach(p => {
                const item = document.createElement('article');
                item.className = 'list-item';
                
                // Check if product is out of stock
                const isOutOfStock = (p.stock || 0) <= 0;
                if (isOutOfStock) {
                    item.style.opacity = '0.5';
                    item.style.filter = 'grayscale(30%)';
                }
                
                const imageUrl = (p.images && p.images[0]?.url) || '';
                // Handle both base64 and regular URLs
                let thumb;
                if (!imageUrl) {
                    thumb = '/assets/Icon MatFlow.png';
                } else if (imageUrl.startsWith('data:image')) {
                    // Base64 image
                    thumb = imageUrl;
                } else {
                    // Regular URL - use CONFIG.getAssetUrl
                    thumb = CONFIG.getAssetUrl(imageUrl);
                }
                
                // Stock badge
                const stockBadge = isOutOfStock 
                    ? '<span class="chip" style="background:#ef4444;color:#fff;font-size:0.7rem;padding:2px 6px;">Hết hàng</span>' 
                    : '';
                
                item.innerHTML = `
                    <img src="${thumb}" alt="${p.name}" loading="lazy" class="avatar" style="width:40px;height:40px;object-fit:cover;border-radius:8px" onerror="this.src='/assets/Icon MatFlow.png'"/>
                    <div style="flex:1">
                        <div class="list-title">${p.name} ${stockBadge} <span class="chip ${p.isActive ? 'green' : 'red'}">${p.isActive ? 'Đang bán' : 'Ẩn'}</span></div>
                        <div class="list-sub">Giá: ${formatCurrency(p.price)} • Danh mục: ${p.category?.name || ''} • Kho: ${p.stock}</div>
                    </div>
                    <div>
                        <button class="btn" data-edit="${p.id}" style="background:#3b82f6;color:#fff;border-color:#2563eb;margin-right:8px">Chỉnh sửa</button>
                        <button class="btn" data-del="${p.id}" style="background:#ef4444;color:#fff;border-color:#dc2626">Xóa</button>
                    </div>
                `;
                const editBtn = item.querySelector('[data-edit]');
                const delBtn = item.querySelector('[data-del]');
                
                editBtn.addEventListener('click', () => {
                    openEditModal(p);
                });
                
                delBtn.addEventListener('click', async () => {
                    deleteProduct(p.id);
                });
                container.appendChild(item);
            });
            
            // Loading indicator
            let loadingIndicator = container.querySelector('#loadingIndicator');
            if (!loadingIndicator) {
                loadingIndicator = document.createElement('div');
                loadingIndicator.id = 'loadingIndicator';
                loadingIndicator.style.textAlign = 'center';
                loadingIndicator.style.padding = '20px';
                loadingIndicator.style.color = '#6b7280';
                loadingIndicator.style.display = 'none';
                loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải thêm sản phẩm...';
                container.appendChild(loadingIndicator);
            }
            
            if (!append) {
                listPanel.innerHTML = '';
                const title = document.createElement('div');
                title.className = 'panel-title';
                title.textContent = `Danh sách (${productsState.totalProducts} sản phẩm)`;
                listPanel.appendChild(title);
                listPanel.appendChild(container);
                
                // Setup scroll listener
                container.addEventListener('scroll', handleScroll);
            } else {
                // Update title
                const title = listPanel.querySelector('.panel-title');
                if (title) {
                    title.textContent = `Danh sách (${productsState.totalProducts} sản phẩm)`;
                }
            }
        }

        // Handle scroll event for infinite loading
        function handleScroll(e) {
            const container = e.target;
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            
            // Load more when scrolled to 80% of the list
            if (scrollTop + clientHeight >= scrollHeight * 0.8) {
                if (!productsState.isLoading && productsState.hasMore) {
                    loadMoreProducts();
                }
            }
        }

        // Load product statistics (realtime)
        async function loadProductStats() {
            try {
                const stats = view.querySelectorAll('.order-stats .order-stat-value');
                
                // Load products (backend limits to 100, but meta.total is accurate)
                const allRes = await window.apiService.get(`/products?take=100`);
                console.log('📊 Product stats raw response:', allRes);
                
                if (allRes?.success) {
                    let allData = allRes.data;
                    let meta = allRes.meta;
                    
                    // Handle nested response structure
                    if (allData && typeof allData === 'object' && allData.success) {
                        // Unwrap nested structure
                        meta = allData.meta || meta;
                        allData = allData.data;
                    }
                    
                    const allItems = Array.isArray(allData) ? allData : [];
                    
                    // Get accurate total from meta (this is the REAL count from database)
                    const totalProducts = (meta && meta.total) ? meta.total : allItems.length;
                    
                    console.log('📊 Total from meta:', meta?.total, 'Items loaded:', allItems.length);
                    
                    // For accurate selling/outOfStock stats, we need to load more products
                    // Since backend limits to 100, we'll make multiple requests if needed
                    let allProductsForStats = [...allItems];
                    
                    // If there are more than 100 products, load them in batches
                    if (totalProducts > 100) {
                        const pages = Math.ceil(totalProducts / 100);
                        const additionalRequests = [];
                        
                        for (let page = 2; page <= Math.min(pages, 10); page++) {
                            additionalRequests.push(
                                window.apiService.get(`/products?take=100&page=${page}`)
                            );
                        }
                        
                        const additionalResults = await Promise.all(additionalRequests);
                        additionalResults.forEach(res => {
                            if (res?.success) {
                                let data = res.data;
                                if (data && typeof data === 'object' && data.success && data.data) {
                                    data = data.data;
                                }
                                if (Array.isArray(data)) {
                                    allProductsForStats = allProductsForStats.concat(data);
                                }
                            }
                        });
                    }
                    
                    const selling = allProductsForStats.filter(p => p.isActive).length;
                    const outOfStock = allProductsForStats.filter(p => Number(p.stock || 0) === 0).length;
                    
                    // Update stats display
                    if (stats[0]) stats[0].textContent = String(totalProducts);
                    if (stats[1]) stats[1].textContent = String(selling);
                    if (stats[2]) stats[2].textContent = String(outOfStock);
                    
                    // Get sold count from orders
                    try {
                        const ordersRes = await window.apiService.get('/orders?take=10000');
                        if (ordersRes?.success) {
                            let ordersData = ordersRes.data;
                            if (ordersData && typeof ordersData === 'object' && ordersData.success && ordersData.data) {
                                ordersData = ordersData.data;
                            }
                            const orders = Array.isArray(ordersData) ? ordersData : [];
                            
                            // Calculate total items sold from completed orders
                            let totalSold = 0;
                            orders.forEach(order => {
                                if (order.status === 'COMPLETED' && order.items) {
                                    order.items.forEach(item => {
                                        totalSold += item.quantity || 0;
                                    });
                                }
                            });
                            
                            if (stats[3]) stats[3].textContent = totalSold.toLocaleString('vi-VN');
                        }
                    } catch (e) {
                        console.error('Error loading sold stats:', e);
                        // Fallback to 0 if orders API fails
                        if (stats[3]) stats[3].textContent = '0';
                    }
                    
                    console.log(`📊 Stats updated - Total: ${totalProducts}, Selling: ${selling}, Out of stock: ${outOfStock}`);
                }
            } catch (e) {
                console.error('Load product stats error', e);
            }
        }

        // Load initial products
        async function loadProducts() {
            try {
                productsState.page = 1;
                productsState.hasMore = true;
                
                const res = await window.apiService.get(`/products?take=${productsState.pageSize}&page=1`);
                console.log('Products API response:', res);
                if (res?.success) {
                    // Handle apiService wrapped response
                    let data = res.data;
                    if (data && typeof data === 'object' && data.success && data.data) {
                        data = data.data;
                    }
                    const items = Array.isArray(data) ? data : [];
                    const meta = res.meta || {};
                    productsState.totalProducts = meta.total || items.length;
                    productsState.hasMore = items.length >= productsState.pageSize;
                    
                    console.log(`Loaded ${items.length} products, total: ${productsState.totalProducts}`);
                    renderProducts(items, false);
                    
                    // Load stats in parallel
                    loadProductStats();
                }
            } catch (e) {
                console.error('Load products error', e);
            }
        }

        // Load more products (infinite scroll)
        async function loadMoreProducts() {
            if (productsState.isLoading || !productsState.hasMore) return;
            
            productsState.isLoading = true;
            const loadingIndicator = document.getElementById('loadingIndicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'block';
            }
            
            try {
                productsState.page++;
                const res = await window.apiService.get(`/products?take=${productsState.pageSize}&page=${productsState.page}`);
                
                if (res?.success) {
                    let data = res.data;
                    if (data && typeof data === 'object' && data.success && data.data) {
                        data = data.data;
                    }
                    const items = Array.isArray(data) ? data : [];
                    
                    console.log(`Loaded page ${productsState.page}: ${items.length} products`);
                    
                    if (items.length > 0) {
                        renderProducts(items, true);
                    }
                    
                    productsState.hasMore = items.length >= productsState.pageSize;
                    
                    if (!productsState.hasMore && loadingIndicator) {
                        loadingIndicator.innerHTML = '<i class="fas fa-check"></i> Đã tải hết sản phẩm';
                        setTimeout(() => {
                            loadingIndicator.style.display = 'none';
                        }, 2000);
                    }
                }
            } catch (e) {
                console.error('Load more products error', e);
            } finally {
                productsState.isLoading = false;
                if (loadingIndicator && productsState.hasMore) {
                    loadingIndicator.style.display = 'none';
                }
            }
        }

        // Initial loads
        loadCategories();
        loadProducts();
        
        // Expose functions globally for other parts of admin.js to use
        window.loadProductsData = loadProducts;
        window.loadProductStats = loadProductStats;

        addBtn && addBtn.addEventListener('click', async () => {
            const name = nameInput ? (nameInput.value || '').trim() : '';
            const price = priceInput ? Number(String(priceInput.value).replace(/[^\d.-]/g, '')) : 0;
            const mainCategorySelect = document.getElementById('mainCategorySelect');
            const subCategorySelect = document.getElementById('subCategorySelect');
            const cat = mainCategorySelect ? mainCategorySelect.value : '';
            const subCat = subCategorySelect ? subCategorySelect.value : '';
            const stock = stockInput ? Math.max(0, parseInt(stockInput.value || '0', 10)) : 0;
            const desc = descTextarea ? (descTextarea.value || '').trim() : '';

            if (!name) return showNotification('Vui lòng nhập Tên sản phẩm', 'error');
            if (!cat || /chọn/i.test(cat)) return showNotification('Vui lòng chọn Danh mục', 'error');
            if (!desc) return showNotification('Vui lòng nhập Mô tả', 'error');
            if (!price || Number.isNaN(price) || price < 0) return showNotification('Giá bán không hợp lệ', 'error');

            async function filesToDataUrls(files) {
                const toDataUrl = (file) => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                const arr = [];
                for (let i = 0; i < files.length; i++) {
                    try { arr.push(await toDataUrl(files[i])); } catch (_) { }
                }
                return arr;
            }

            try {
                const dataUrls = await filesToDataUrls(selectedFiles || []);
                const payload = {
                    name,
                    description: desc,
                    price,
                    categoryId: cat,
                    subCategory: subCat || null, // Include sub category if selected
                    stock,
                    images: dataUrls.map((url, i) => ({ url, order: i }))
                };
                const res = await window.apiService.post('/products', payload);
                if (!res?.success) throw new Error(res?.message || 'Tạo sản phẩm thất bại');
                
                // Save subCategory to localStorage
                if (subCat && res.data && res.data.id) {
                    saveProductSubCategory(res.data.id, subCat);
                }
                
                showNotification('Đã tạo sản phẩm!', 'success');
                await loadProducts();
            } catch (e) {
                showNotification(e?.message || 'Có lỗi khi tạo sản phẩm', 'error');
                return;
            }

            // Reset form nhanh
            if (nameInput) nameInput.value = '';
            if (priceInput) priceInput.value = '0';
            if (mainCategorySelect) mainCategorySelect.selectedIndex = 0;
            if (subCategorySelect) {
                subCategorySelect.selectedIndex = 0;
                subCategorySelect.disabled = true;
            }
            if (descTextarea) descTextarea.value = '';
            if (imageUploader) imageUploader.clear();
            selectedFiles = [];
            setInfo.name(''); setInfo.price(''); setInfo.cat(''); setInfo.imgs(0);
            showTab(0);
        });

        cancelBtn && cancelBtn.addEventListener('click', () => showTab(0));
    }

    // ====== VIEW OVERVIEW (Dashboard) ======
    async function initOverviewView() {
        const view = document.querySelector('[data-view="overview"]');
        if (!view) return;

        // Elements
        const kpiCards = view.querySelectorAll('.kpis .kpi');
        const revenuePanel = view.querySelector('.panel.panel-lg .panel-placeholder');
        const tabs = view.querySelectorAll('.kpi-tabs .tab');

        function formatVND(v) {
            const n = Number(v || 0);
            return n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
        }

        async function loadOverview() {
            try {
                const res = await window.apiService.get('/dashboard/overview');
                if (res?.success) {
                    const data = res.data || {};
                    // Expect order: GMV, Pending orders, Pending products, Open tickets
                    if (kpiCards[0]) kpiCards[0].querySelector('.kpi-value').textContent = formatVND(data.gmv);
                    if (kpiCards[1]) kpiCards[1].querySelector('.kpi-value').textContent = String(data.pendingOrders || 0);
                    if (kpiCards[2]) kpiCards[2].querySelector('.kpi-value').textContent = String(data.pendingProducts || 0);
                    if (kpiCards[3]) kpiCards[3].querySelector('.kpi-value').textContent = String(data.openTickets || 0);
                }
            } catch (e) {
                // ignore
            }
        }

        async function loadRevenue(range) {
            try {
                const endpoint = range === 'day' ? '/dashboard/revenue' : `/dashboard/revenue?range=${range}`;
                const res = await window.apiService.get(endpoint);
                if (res?.success && Array.isArray(res.data) && revenuePanel) {
                    const series = res.data.map(d => ({ key: d.date || d.key, amount: Number(d.amount || 0) }));
                    const max = Math.max(1, ...series.map(s => s.amount));
                    const wrap = document.createElement('div');
                    wrap.style.display = 'grid';
                    wrap.style.gridTemplateColumns = `repeat(${series.length}, 1fr)`;
                    wrap.style.gap = '8px';
                    series.forEach(s => {
                        const barWrap = document.createElement('div');
                        barWrap.style.display = 'flex';
                        barWrap.style.flexDirection = 'column';
                        barWrap.style.alignItems = 'center';
                        const bar = document.createElement('div');
                        bar.style.height = Math.max(6, Math.round(80 * (s.amount / max))) + 'px';
                        bar.style.width = '100%';
                        bar.style.background = '#60a5fa';
                        bar.style.borderRadius = '4px';
                        const cap = document.createElement('div');
                        cap.textContent = (s.amount).toLocaleString('vi-VN');
                        cap.style.fontSize = '12px';
                        cap.style.color = '#6b7280';
                        cap.style.marginTop = '4px';
                        barWrap.appendChild(bar);
                        barWrap.appendChild(cap);
                        wrap.appendChild(barWrap);
                    });
                    revenuePanel.innerHTML = '';
                    revenuePanel.appendChild(wrap);
                }
            } catch (e) {
                // ignore
            }
        }

        loadOverview();
        loadRevenue('day');

        // Tab switching
        tabs.forEach((t, idx) => t.addEventListener('click', () => {
            tabs.forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            const ranges = ['day','week','month'];
            loadRevenue(ranges[idx] || 'day');
        }));
    }

    // ====== VIEW ORDERS - COMPREHENSIVE MANAGEMENT ======
    let orderManagementState = {
        allOrders: [],
        filteredOrders: [],
        filters: {
            status: '',
            dateFrom: '',
            dateTo: '',
            search: ''
        },
        autoRefreshInterval: null
    };

    async function initOrdersView() {
        const view = document.querySelector('[data-view="orders"]');
        if (!view) return;

        // Get all elements
        const elements = {
            container: document.getElementById('orderListContainer'),
            lastUpdate: document.getElementById('orderLastUpdate'),
            count: document.getElementById('orderCount'),
            refreshBtn: document.getElementById('orderRefreshBtn'),
            exportBtn: document.getElementById('orderExportBtn'),
            resetFilterBtn: document.getElementById('orderResetFilterBtn'),
            filterStatus: document.getElementById('orderFilterStatus'),
            filterDateFrom: document.getElementById('orderFilterDateFrom'),
            filterDateTo: document.getElementById('orderFilterDateTo'),
            searchInput: document.getElementById('orderSearchInput'),
            statCards: document.querySelectorAll('.order-stat'),
            statTotal: document.getElementById('orderStatTotal'),
            statPending: document.getElementById('orderStatPending'),
            statDelivering: document.getElementById('orderStatDelivering'),
            statCompleted: document.getElementById('orderStatCompleted'),
            statCancelled: document.getElementById('orderStatCancelled'),
            modal: document.getElementById('orderDetailModal'),
            modalOverlay: document.getElementById('orderDetailModalOverlay'),
            modalClose: document.getElementById('orderDetailModalClose'),
            modalTitle: document.getElementById('orderDetailModalTitle'),
            modalBody: document.getElementById('orderDetailModalBody')
        };

        // Helper functions
        function formatVND(amount) {
            return Number(amount || 0).toLocaleString('vi-VN') + ' đ';
        }

        function formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        function getStatusBadge(status) {
            const statusMap = {
                'PENDING': { text: 'Chờ xác nhận', color: '#f59e0b', bg: '#fef3c7', icon: 'clock' },
                'DELIVERING': { text: 'Đang giao', color: '#3b82f6', bg: '#dbeafe', icon: 'truck-fast' },
                'COMPLETED': { text: 'Hoàn thành', color: '#22c55e', bg: '#d1fae5', icon: 'check-circle' },
                'CANCELLED': { text: 'Đã hủy', color: '#ef4444', bg: '#fee2e2', icon: 'times-circle' }
            };
            const s = statusMap[status] || { text: status, color: '#64748b', bg: '#f1f5f9', icon: 'question-circle' };
            return `<span class="order-status-badge" style="background:${s.bg};color:${s.color};padding:4px 12px;border-radius:16px;font-size:0.75rem;font-weight:600;display:inline-flex;align-items:center;gap:4px;">
                <i class="fa-solid fa-${s.icon}"></i> ${s.text}
            </span>`;
        }

        // Load orders from API
        async function loadOrders() {
            try {
                console.log('Loading orders...');
                const res = await window.apiService.get('/orders');
                
                if (res?.success) {
                    orderManagementState.allOrders = res.data || [];
                    console.log(`✅ Loaded ${orderManagementState.allOrders.length} orders`);
                    
                    // Update last update time
                    if (elements.lastUpdate) {
                        elements.lastUpdate.textContent = `Cập nhật lúc ${new Date().toLocaleTimeString('vi-VN')}`;
                    }
                    
                    // Apply filters
                    applyFilters();
                    
                    // Update stats
                    updateStats();
                    
                    return true;
                } else {
                    console.error('Failed to load orders:', res?.message);
                    showError('Không thể tải danh sách đơn hàng');
                    return false;
                }
            } catch (error) {
                console.error('Error loading orders:', error);
                showError('Lỗi khi tải đơn hàng: ' + error.message);
                return false;
            }
        }

        // Update statistics
        function updateStats() {
            const counts = orderManagementState.allOrders.reduce((acc, order) => {
                acc[order.status] = (acc[order.status] || 0) + 1;
                return acc;
            }, {});

            if (elements.statTotal) elements.statTotal.textContent = orderManagementState.allOrders.length;
            if (elements.statPending) elements.statPending.textContent = counts['PENDING'] || 0;
            if (elements.statDelivering) elements.statDelivering.textContent = counts['DELIVERING'] || 0;
            if (elements.statCompleted) elements.statCompleted.textContent = counts['COMPLETED'] || 0;
            if (elements.statCancelled) elements.statCancelled.textContent = counts['CANCELLED'] || 0;
        }

        // Apply filters
        function applyFilters() {
            let filtered = [...orderManagementState.allOrders];

            // Filter by status
            if (orderManagementState.filters.status) {
                filtered = filtered.filter(o => o.status === orderManagementState.filters.status);
            }

            // Filter by date range
            if (orderManagementState.filters.dateFrom) {
                const fromDate = new Date(orderManagementState.filters.dateFrom);
                fromDate.setHours(0, 0, 0, 0);
                filtered = filtered.filter(o => new Date(o.createdAt) >= fromDate);
            }
            if (orderManagementState.filters.dateTo) {
                const toDate = new Date(orderManagementState.filters.dateTo);
                toDate.setHours(23, 59, 59, 999);
                filtered = filtered.filter(o => new Date(o.createdAt) <= toDate);
            }

            // Search filter
            if (orderManagementState.filters.search) {
                const search = orderManagementState.filters.search.toLowerCase();
                filtered = filtered.filter(o => 
                    (o.code && o.code.toLowerCase().includes(search)) ||
                    (o.id && o.id.toLowerCase().includes(search)) ||
                    (o.user?.fullName && o.user.fullName.toLowerCase().includes(search)) ||
                    (o.user?.username && o.user.username.toLowerCase().includes(search)) ||
                    (o.user?.email && o.user.email.toLowerCase().includes(search))
                );
            }

            orderManagementState.filteredOrders = filtered;
            renderOrders();
        }

        // Render orders list
        function renderOrders() {
            if (!elements.container) return;

            // Update count
            if (elements.count) {
                elements.count.textContent = `(${orderManagementState.filteredOrders.length})`;
            }

            // Show empty state
            if (orderManagementState.filteredOrders.length === 0) {
                elements.container.innerHTML = `
                    <div class="panel-placeholder small">
                        <i class="fa-solid fa-box-open" style="font-size: 48px; color: #cbd5e1;"></i>
                        <p>Không tìm thấy đơn hàng nào</p>
                    </div>
                `;
                return;
            }

            // Sort by date (newest first)
            const sortedOrders = [...orderManagementState.filteredOrders].sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );

            // Build order list
            const listHTML = sortedOrders.map(order => {
                const total = Number(order.totalAmount || 0);
                const itemCount = (order.items || []).length;
                const customerName = order.user?.fullName || order.user?.username || 'Khách';
                
                // Get first product image (handle both base64 and URL)
                const firstItem = order.items && order.items[0];
                let productImage = '/assets/Icon MatFlow.png'; // Default fallback
                
                if (firstItem?.product) {
                    const product = firstItem.product;
                    
                    // Try to get image from images array
                    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                        const imageUrl = product.images[0].url;
                        console.log('Product image URL:', imageUrl);
                        
                        if (imageUrl) {
                            if (imageUrl.startsWith('data:image')) {
                                // Base64 image from admin upload
                                productImage = imageUrl;
                            } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                                // Full URL
                                productImage = imageUrl;
                            } else {
                                // Relative path - use CONFIG.getAssetUrl
                                productImage = (typeof CONFIG !== 'undefined' && CONFIG.getAssetUrl) 
                                    ? CONFIG.getAssetUrl(imageUrl) 
                                    : `/assets/vat_tu/${imageUrl}`;
                            }
                        }
                    }
                }

                return `
                    <div class="order-card" data-order-id="${order.id}" style="display:flex;gap:16px;padding:16px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:12px;cursor:pointer;transition:all 0.2s;">
                        <div class="order-image" style="width:80px;height:80px;border-radius:8px;overflow:hidden;flex-shrink:0;">
                            <img src="${productImage}" alt="Product" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='https://via.placeholder.com/80x80?text=No+Image'" />
                        </div>
                        <div style="flex:1;min-width:0;">
                            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
                                <div>
                                    <div style="font-weight:600;font-size:1rem;color:#1e293b;margin-bottom:4px;">
                                        ${order.code || order.id}
                                    </div>
                                    <div style="font-size:0.875rem;color:#64748b;">
                                        <i class="fa-solid fa-user"></i> ${customerName}
                                        ${order.user?.email ? `<span style="margin-left:8px;"><i class="fa-solid fa-envelope"></i> ${order.user.email}</span>` : ''}
                                    </div>
                                </div>
                                ${getStatusBadge(order.status)}
                            </div>
                            <div style="display:flex;gap:16px;font-size:0.875rem;color:#64748b;margin-bottom:8px;">
                                <span><i class="fa-solid fa-box"></i> ${itemCount} sản phẩm</span>
                                <span><i class="fa-solid fa-clock"></i> ${formatDate(order.createdAt)}</span>
                            </div>
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                <div style="font-size:1.125rem;font-weight:700;color:#3b82f6;">
                                    ${formatVND(total)}
                                </div>
                                <div style="display:flex;gap:8px;">
                                    <button class="btn-view-detail" data-order-id="${order.id}" style="padding:6px 16px;background:#3b82f6;color:#fff;border:none;border-radius:6px;font-size:0.875rem;cursor:pointer;">
                                        <i class="fa-solid fa-eye"></i> Chi tiết
                                    </button>
                                    <button class="btn-delete-order" data-order-id="${order.id}" data-order-code="${order.code || order.id}" style="padding:6px 12px;background:#ef4444;color:#fff;border:none;border-radius:6px;font-size:0.875rem;cursor:pointer;" title="Xóa đơn hàng">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            elements.container.innerHTML = listHTML;

            // Add click event listeners
            elements.container.querySelectorAll('.order-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    // Don't trigger if clicking the buttons
                    if (e.target.closest('.btn-view-detail') || e.target.closest('.btn-delete-order')) return;
                    const orderId = card.dataset.orderId;
                    openOrderDetail(orderId);
                });
            });

            elements.container.querySelectorAll('.btn-view-detail').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const orderId = btn.dataset.orderId;
                    openOrderDetail(orderId);
                });
            });

            elements.container.querySelectorAll('.btn-delete-order').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const orderId = btn.dataset.orderId;
                    const orderCode = btn.dataset.orderCode;
                    deleteOrder(orderId, orderCode);
                });
            });
        }

        // Show error message
        function showError(message) {
            if (elements.container) {
                elements.container.innerHTML = `
                    <div class="panel-placeholder small">
                        <i class="fa-solid fa-exclamation-triangle" style="font-size: 48px; color: #ef4444;"></i>
                        <p style="color: #ef4444;">${message}</p>
                    </div>
                `;
            }
        }

        // Open order detail modal
        function openOrderDetail(orderId) {
            const order = orderManagementState.allOrders.find(o => o.id === orderId);
            if (!order) return;

            const total = Number(order.totalAmount || 0);
            const customerName = order.user?.fullName || order.user?.username || 'Khách';

            // Build items HTML
            const itemsHTML = (order.items || []).map(item => {
                const product = item.product || {};
                
                // Handle product image (base64 or URL)
                let img = '/assets/Icon MatFlow.png'; // Default fallback
                
                if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                    const imageUrl = product.images[0].url;
                    
                    if (imageUrl) {
                        if (imageUrl.startsWith('data:image')) {
                            // Base64 image from admin upload
                            img = imageUrl;
                        } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                            // Full URL
                            img = imageUrl;
                        } else {
                            // Relative path - use CONFIG.getAssetUrl
                            img = (typeof CONFIG !== 'undefined' && CONFIG.getAssetUrl) 
                                ? CONFIG.getAssetUrl(imageUrl) 
                                : `/assets/vat_tu/${imageUrl}`;
                        }
                    }
                }
                
                const name = product.name || 'Sản phẩm';
                const price = Number(item.price || product.price || 0);
                const qty = Number(item.quantity || 0);
                const subtotal = price * qty;

                return `
                    <div style="display:flex;gap:12px;padding:12px;background:#f8fafc;border-radius:8px;margin-bottom:8px;">
                        <img src="${img}" alt="${name}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;" onerror="this.src='https://via.placeholder.com/60x60?text=No+Image'" />
                        <div style="flex:1;">
                            <div style="font-weight:600;margin-bottom:4px;">${name}</div>
                            <div style="font-size:0.875rem;color:#64748b;">
                                ${formatVND(price)} × ${qty}
                            </div>
                        </div>
                        <div style="font-weight:600;color:#3b82f6;">
                            ${formatVND(subtotal)}
                        </div>
                    </div>
                `;
            }).join('');

            // Build status update buttons
            const statusButtons = ['PENDING', 'DELIVERING', 'COMPLETED', 'CANCELLED']
                .filter(status => status !== order.status)
                .map(status => {
                    const statusInfo = {
                        'PENDING': { text: 'Chờ xác nhận', color: '#f59e0b', icon: 'clock' },
                        'DELIVERING': { text: 'Đang giao', color: '#3b82f6', icon: 'truck-fast' },
                        'COMPLETED': { text: 'Hoàn thành', color: '#22c55e', icon: 'check-circle' },
                        'CANCELLED': { text: 'Hủy đơn', color: '#ef4444', icon: 'times-circle' }
                    }[status];

                    return `
                        <button class="btn-update-status" data-order-id="${order.id}" data-status="${status}" 
                                style="padding:8px 16px;background:${statusInfo.color};color:#fff;border:none;border-radius:6px;cursor:pointer;flex:1;">
                            <i class="fa-solid fa-${statusInfo.icon}"></i> ${statusInfo.text}
                        </button>
                    `;
                }).join('');

            // Modal content
            elements.modalBody.innerHTML = `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;">
                    <div>
                        <h3 style="font-size:1rem;font-weight:600;margin-bottom:12px;color:#1e293b;">
                            <i class="fa-solid fa-receipt"></i> Thông tin đơn hàng
                        </h3>
                        <div style="background:#f8fafc;padding:16px;border-radius:8px;">
                            <div style="margin-bottom:8px;">
                                <span style="color:#64748b;">Mã đơn:</span>
                                <strong style="color:#1e293b;margin-left:8px;">${order.code || order.id}</strong>
                            </div>
                            <div style="margin-bottom:8px;">
                                <span style="color:#64748b;">Trạng thái:</span>
                                <span style="margin-left:8px;">${getStatusBadge(order.status)}</span>
                            </div>
                            <div style="margin-bottom:8px;">
                                <span style="color:#64748b;">Ngày đặt:</span>
                                <strong style="color:#1e293b;margin-left:8px;">${formatDate(order.createdAt)}</strong>
                            </div>
                            <div style="margin-bottom:8px;">
                                <span style="color:#64748b;">Tổng tiền:</span>
                                <strong style="color:#3b82f6;margin-left:8px;font-size:1.125rem;">${formatVND(total)}</strong>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 style="font-size:1rem;font-weight:600;margin-bottom:12px;color:#1e293b;">
                            <i class="fa-solid fa-user"></i> Thông tin khách hàng
                        </h3>
                        <div style="background:#f8fafc;padding:16px;border-radius:8px;">
                            <div style="margin-bottom:8px;">
                                <span style="color:#64748b;">Họ tên:</span>
                                <strong style="color:#1e293b;margin-left:8px;">${customerName}</strong>
                            </div>
                            ${order.user?.email ? `
                                <div style="margin-bottom:8px;">
                                    <span style="color:#64748b;">Email:</span>
                                    <strong style="color:#1e293b;margin-left:8px;">${order.user.email}</strong>
                                </div>
                            ` : ''}
                            ${order.user?.phone ? `
                                <div style="margin-bottom:8px;">
                                    <span style="color:#64748b;">Điện thoại:</span>
                                    <strong style="color:#1e293b;margin-left:8px;">${order.user.phone}</strong>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <div style="margin-bottom:24px;">
                    <h3 style="font-size:1rem;font-weight:600;margin-bottom:12px;color:#1e293b;">
                        <i class="fa-solid fa-box"></i> Sản phẩm đã đặt
                    </h3>
                    ${itemsHTML}
                </div>

                <div style="border-top:1px solid #e2e8f0;padding-top:24px;margin-bottom:24px;">
                    <h3 style="font-size:1rem;font-weight:600;margin-bottom:12px;color:#1e293b;">
                        <i class="fa-solid fa-edit"></i> Cập nhật trạng thái
                    </h3>
                    <div style="display:flex;gap:8px;">
                        ${statusButtons}
                    </div>
                </div>

                <div style="border-top:1px solid #e2e8f0;padding-top:24px;">
                    <h3 style="font-size:1rem;font-weight:600;margin-bottom:12px;color:#ef4444;">
                        <i class="fa-solid fa-trash"></i> Xóa đơn hàng
                    </h3>
                    <p style="color:#64748b;font-size:0.875rem;margin-bottom:12px;">
                        ⚠️ Hành động này không thể hoàn tác. Đơn hàng và tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn khỏi hệ thống.
                    </p>
                    <button class="btn-delete-order-modal" data-order-id="${order.id}" data-order-code="${order.code || order.id}" 
                            style="padding:10px 20px;background:#ef4444;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;">
                        <i class="fa-solid fa-trash"></i> Xóa đơn hàng này
                    </button>
                </div>
            `;

            // Show modal with flexbox centering
            elements.modal.style.display = 'flex';
            elements.modal.classList.add('show');
            document.body.style.overflow = 'hidden';

            // Add event listeners for status update buttons
            elements.modalBody.querySelectorAll('.btn-update-status').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const newStatus = btn.dataset.status;
                    await updateOrderStatus(order.id, newStatus);
                });
            });

            // Add event listener for delete button in modal
            const deleteBtn = elements.modalBody.querySelector('.btn-delete-order-modal');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async () => {
                    const orderId = deleteBtn.dataset.orderId;
                    const orderCode = deleteBtn.dataset.orderCode;
                    await deleteOrder(orderId, orderCode);
                });
            }
        }

        // Update order status
        async function updateOrderStatus(orderId, newStatus) {
            try {
                const confirmMsg = {
                    'PENDING': 'Đặt lại về Chờ xác nhận?',
                    'DELIVERING': 'Chuyển sang Đang giao?',
                    'COMPLETED': 'Đánh dấu đơn hàng đã Hoàn thành?',
                    'CANCELLED': 'Hủy đơn hàng này?'
                }[newStatus] || 'Cập nhật trạng thái?';

                if (!confirm(confirmMsg)) return;

                const res = await window.apiService.patch(`/orders/${orderId}/status`, { status: newStatus });
                
                if (res?.success) {
                    alert('✅ Cập nhật trạng thái thành công!');
                    // Close modal
                    closeModal();
                    // Reload orders
                    await loadOrders();
                } else {
                    alert('❌ Lỗi: ' + (res?.message || 'Không thể cập nhật trạng thái'));
                }
            } catch (error) {
                console.error('Error updating order status:', error);
                alert('❌ Lỗi khi cập nhật: ' + error.message);
            }
        }

        // Delete order
        async function deleteOrder(orderId, orderCode) {
            try {
                // Double confirmation for delete action
                const confirmMsg = `⚠️ XÓA ĐƠN HÀNG\n\nBạn có chắc chắn muốn xóa đơn hàng "${orderCode}"?\n\n` +
                    `Hành động này sẽ:\n` +
                    `• Xóa vĩnh viễn đơn hàng khỏi hệ thống\n` +
                    `• Xóa tất cả sản phẩm trong đơn hàng\n` +
                    `• KHÔNG THỂ HOÀN TÁC\n\n` +
                    `Nhấn OK để xác nhận xóa.`;

                if (!confirm(confirmMsg)) return;

                // Second confirmation
                const finalConfirm = confirm('⚠️ XÁC NHẬN LẦN CUỐI\n\nBạn có HOÀN TOÀN CHẮC CHẮN muốn xóa đơn hàng này?');
                if (!finalConfirm) return;

                // Show loading
                const loadingMsg = 'Đang xóa đơn hàng...';
                console.log(loadingMsg);

                const res = await window.apiService.delete(`/orders/${orderId}`);
                
                if (res?.success) {
                    alert(`✅ Xóa đơn hàng "${orderCode}" thành công!`);
                    // Close modal if open
                    closeModal();
                    // Reload orders
                    await loadOrders();
                } else {
                    alert('❌ Lỗi: ' + (res?.message || 'Không thể xóa đơn hàng'));
                }
            } catch (error) {
                console.error('Error deleting order:', error);
                alert('❌ Lỗi khi xóa đơn hàng: ' + error.message);
            }
        }

        // Close modal
        function closeModal() {
            elements.modal.style.display = 'none';
            elements.modal.classList.remove('show');
            document.body.style.overflow = '';
        }

        // Export to Excel (basic CSV export)
        function exportToExcel() {
            const data = orderManagementState.filteredOrders.map(order => ({
                'Mã đơn': order.code || order.id,
                'Khách hàng': order.user?.fullName || order.user?.username || '',
                'Email': order.user?.email || '',
                'Trạng thái': order.status,
                'Số sản phẩm': (order.items || []).length,
                'Tổng tiền': order.totalAmount,
                'Ngày đặt': formatDate(order.createdAt)
            }));

            // Convert to CSV
            const headers = Object.keys(data[0] || {});
            const csv = [
                headers.join(','),
                ...data.map(row => headers.map(h => row[h]).join(','))
            ].join('\n');

            // Download
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        }

        // Event listeners
        if (elements.refreshBtn) {
            elements.refreshBtn.addEventListener('click', async () => {
                elements.refreshBtn.disabled = true;
                elements.refreshBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải...';
                await loadOrders();
                elements.refreshBtn.disabled = false;
                elements.refreshBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> <span class="hide-sm">Làm mới</span>';
            });
        }

        if (elements.exportBtn) {
            elements.exportBtn.addEventListener('click', exportToExcel);
        }

        if (elements.resetFilterBtn) {
            elements.resetFilterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                orderManagementState.filters = { status: '', dateFrom: '', dateTo: '', search: '' };
                if (elements.filterStatus) elements.filterStatus.value = '';
                if (elements.filterDateFrom) elements.filterDateFrom.value = '';
                if (elements.filterDateTo) elements.filterDateTo.value = '';
                if (elements.searchInput) elements.searchInput.value = '';
                applyFilters();
            });
        }

        if (elements.filterStatus) {
            elements.filterStatus.addEventListener('change', (e) => {
                orderManagementState.filters.status = e.target.value;
                applyFilters();
            });
        }

        if (elements.filterDateFrom) {
            elements.filterDateFrom.addEventListener('change', (e) => {
                orderManagementState.filters.dateFrom = e.target.value;
                applyFilters();
            });
        }

        if (elements.filterDateTo) {
            elements.filterDateTo.addEventListener('change', (e) => {
                orderManagementState.filters.dateTo = e.target.value;
                applyFilters();
            });
        }

        if (elements.searchInput) {
            let searchTimeout;
            elements.searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    orderManagementState.filters.search = e.target.value;
                    applyFilters();
                }, 300);
            });
        }

        // Modal close handlers
        if (elements.modalClose) {
            elements.modalClose.addEventListener('click', closeModal);
        }
        if (elements.modalOverlay) {
            elements.modalOverlay.addEventListener('click', closeModal);
        }

        // Stat card click filters
        elements.statCards.forEach(card => {
            card.addEventListener('click', () => {
                const status = card.dataset.status;
                if (status === 'all') {
                    orderManagementState.filters.status = '';
                    if (elements.filterStatus) elements.filterStatus.value = '';
                } else {
                    orderManagementState.filters.status = status;
                    if (elements.filterStatus) elements.filterStatus.value = status;
                }
                applyFilters();
            });
        });

        // Initial load
        await loadOrders();

        // Setup auto-refresh every 30 seconds
        if (orderManagementState.autoRefreshInterval) {
            clearInterval(orderManagementState.autoRefreshInterval);
        }
        orderManagementState.autoRefreshInterval = setInterval(async () => {
            console.log('Auto-refreshing orders...');
            await loadOrders();
        }, 30000);

        console.log('✅ Order management initialized with auto-refresh');
    }

    // ====== VIEW PAYMENTS ======
    async function initPaymentsView() {
        const view = document.querySelector('[data-view="payments"]');
        if (!view) return;
        const list = view.querySelector('.list');
        if (!list) return;
        try {
            const res = await window.apiService.get('/payments/pending');
            if (res?.success) {
                list.innerHTML = '';
                (res.data || []).forEach(p => {
                    const article = document.createElement('article');
                    article.className = 'list-item';
                    article.innerHTML = `
                        <div class="avatar" style="width:40px;height:40px;background:#e5e7eb;border-radius:8px"></div>
                        <div style="flex:1">
                            <div class="list-title">Họ và tên: ${p.order?.customerName || p.order?.id || ''}</div>
                            <div class="list-sub">Chờ xác nhận • Số tiền: ${Number(p.amount||0).toLocaleString('vi-VN')} đ</div>
                        </div>
                        <button class="btn" data-id="${p.id}" style="background: #22c55e; color: #fff; border-color: #16a34a">Xác nhận</button>
                    `;
                    const btn = article.querySelector('button');
                    btn.addEventListener('click', async () => {
                        const r = await window.apiService.patch(`/payments/${p.id}/confirm`);
                        if (r?.success) { article.remove(); }
                    });
                    list.appendChild(article);
                });
            }
        } catch (_) {}
    }

    // ====== VIEW USERS ======
    async function initUsersView() {
        const view = document.querySelector('[data-view="users"]');
        if (!view) return;
        const list = view.querySelector('.list');
        if (!list) return;
        try {
            const res = await window.apiService.get('/users');
            if (res?.success) {
                list.innerHTML = '';
                // Handle nested response structure: {success: true, data: {success: true, data: [...]}}
                let users = res.data;
                if (users && typeof users === 'object' && users.success && Array.isArray(users.data)) {
                    users = users.data;
                } else if (Array.isArray(users)) {
                    // users is already an array
                } else {
                    users = [];
                }
                
                users.forEach(u => {
                    const row = document.createElement('article');
                    row.className = 'list-item';
                    row.innerHTML = `
                        <div class="avatar" style="width:40px;height:40px;background:#e5e7eb;border-radius:8px"></div>
                        <div style="flex:1">
                            <div class="list-title">${u.fullName || u.username} <span class="chip ${u.isActive ? 'green':'red'}">${u.isActive?'Hoạt động':'Đã khóa'}</span></div>
                            <div class="list-sub">${u.email || ''} • Đăng ký: ${new Date(u.createdAt).toLocaleDateString('vi-VN')}</div>
                        </div>`;
                    list.appendChild(row);
                });
            }
        } catch (_) {}
    }

    // ====== VIEW RETURNS ======
    async function initReturnsView() {
        const view = document.querySelector('[data-view="returns"]');
        if (!view) return;
        const stats = view.querySelectorAll('.order-stats .order-stat-value');
        const panel = view.querySelector('.panel');
        try {
            const res = await window.apiService.get('/returns');
            if (res?.success) {
                const items = res.data || [];
                // stats: total, pending, processing, approved
                if (stats[0]) stats[0].textContent = String(items.length || 0);
                if (stats[1]) stats[1].textContent = String(items.filter(r=>r.status==='PENDING').length);
                if (stats[2]) stats[2].textContent = String(items.filter(r=>r.status==='PROCESSING').length);
                if (stats[3]) stats[3].textContent = String(items.filter(r=>r.status==='APPROVED').length);
                if (panel) {
                    const list = document.createElement('div');
                    list.className = 'list';
                    items.forEach(r => {
                        const row = document.createElement('article');
                        row.className = 'list-item';
                        const orderItems = (r.order?.items || []).map(it => {
                            const p = it.product || {};
                            const img = (p.images && p.images[0]?.url) || 'https://via.placeholder.com/40x40?text=';
                            const name = p.name || 'Sản phẩm';
                            const price = Number(p.price || 0).toLocaleString('vi-VN');
                            const qty = Number(it.quantity || 0);
                            return `
                                <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
                                    <img src="${img}" alt="${name}" style="width:40px;height:40px;object-fit:cover;border-radius:6px" onerror="this.src='https://via.placeholder.com/40x40?text='"/>
                                    <div style="flex:1">
                                        <div class="list-sub" style="font-weight:600">${name}</div>
                                        <div class="list-sub">Giá: ${price} đ • SL: ${qty}</div>
                                    </div>
                                </div>`;
                        }).join('');
                        row.innerHTML = `
                            <div class="avatar" style="width:40px;height:40px;background:#e5e7eb;border-radius:8px"></div>
                            <div style="flex:1">
                                <div class="list-title">Mã yêu cầu: ${r.id} <span class="chip">${r.status}</span></div>
                                <div class="list-sub">Đơn: ${r.orderId || ''} • Lý do: ${r.reason || ''}</div>
                                ${orderItems}
                            </div>
                            <div>
                                <button class="btn" data-a="approve">Duyệt</button>
                                <button class="btn" data-a="reject" style="margin-left:6px">Từ chối</button>
                            </div>`;
                        row.querySelector('[data-a="approve"]').addEventListener('click', async ()=>{
                            const rr = await window.apiService.patch(`/returns/${r.id}/status`, { status: 'APPROVED' });
                            if (rr?.success) row.remove();
                        });
                        row.querySelector('[data-a="reject"]').addEventListener('click', async ()=>{
                            const rr = await window.apiService.patch(`/returns/${r.id}/status`, { status: 'REJECTED' });
                            if (rr?.success) row.remove();
                        });
                        list.appendChild(row);
                    });
                    panel.innerHTML = '<div class="panel-title">Danh sách yêu cầu</div>';
                    panel.appendChild(list);
                }
            }
        } catch (_) {}
    }

    // ====== VIEW FEEDBACKS ======
    async function initFeedbacksView() {
        const view = document.querySelector('[data-view="feedbacks"]');
        if (!view) return;
        
        const tabBtns = view.querySelectorAll('.tabs .tab-btn');
        const list = view.querySelector('.panel .list');
        
        let currentTab = 'messages';
        
        function showFeedbackTab(tab) {
            currentTab = tab;
            tabBtns.forEach((btn, i) => {
                btn.classList.toggle('active', 
                    (i === 0 && tab === 'messages') ||
                    (i === 1 && tab === 'reviews') ||
                    (i === 2 && tab === 'tickets')
                );
            });
            loadFeedbacksData();
        }
        
        tabBtns.forEach((btn, i) => {
            btn.addEventListener('click', () => {
                const tabs = ['messages', 'reviews', 'tickets'];
                showFeedbackTab(tabs[i]);
            });
        });
        
        async function loadFeedbacksData() {
            if (!list) return;
            try {
                let endpoint = '/tickets';
                if (currentTab === 'reviews') endpoint = '/reviews';
                else if (currentTab === 'messages') endpoint = '/tickets?type=message';
                
                const res = await window.apiService.get(endpoint);
                if (res?.success) {
                    list.innerHTML = '';
                    (res.data || []).forEach(item => {
                        const article = document.createElement('article');
                        article.className = 'list-item';
                        
                        if (currentTab === 'reviews') {
                            article.innerHTML = `
                                <div class="avatar" style="width:40px;height:40px;background:#e5e7eb;border-radius:8px"></div>
                                <div style="flex:1">
                                    <div class="list-title">${item.user?.fullName || 'Khách hàng'} - ${item.product?.name || 'Sản phẩm'}</div>
                                    <div class="list-sub">⭐ ${item.rating}/5 • ${item.content}</div>
                                    <div class="list-sub">${new Date(item.createdAt).toLocaleDateString('vi-VN')}</div>
                                </div>
                                <span class="chip ${item.status === 'PUBLISHED' ? 'green' : 'red'}">${item.status}</span>
                            `;
                        } else {
                            article.innerHTML = `
                                <div class="avatar" style="width:40px;height:40px;background:#e5e7eb;border-radius:8px"></div>
                                <div style="flex:1">
                                    <div class="list-title">${item.subject || 'Ticket'}</div>
                                    <div class="list-sub">${item.user?.fullName || 'Khách hàng'} • ${item.content?.substring(0, 100)}...</div>
                                    <div class="list-sub">${new Date(item.createdAt).toLocaleDateString('vi-VN')}</div>
                                </div>
                                <span class="chip ${item.status === 'OPEN' ? 'yellow' : item.status === 'CLOSED' ? 'green' : 'blue'}">${item.status}</span>
                            `;
                        }
                        list.appendChild(article);
                    });
                }
            } catch (e) {
                console.error('Load feedbacks error:', e);
            }
        }
        
        loadFeedbacksData();
    }

    // ====== VIEW REPORTS ======
    async function initReportsView() {
        const view = document.querySelector('[data-view="reports"]');
        if (!view) return;
        
        const refreshBtn = document.getElementById('btnReports');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', loadReportsData);
        }
        
        async function loadReportsData() {
            try {
                const [salesRes, productsRes, usersRes] = await Promise.all([
                    window.apiService.get('/dashboard/overview'),
                    window.apiService.get('/products/stats'),
                    window.apiService.get('/users/stats')
                ]);
                
                // Update report data in UI
                console.log('Reports data loaded:', { salesRes, productsRes, usersRes });
            } catch (e) {
                console.error('Load reports error:', e);
            }
        }
        
        loadReportsData();
    }

    // ====== VIEW BANNER ======
    async function initBannerView() {
        const view = document.querySelector('[data-view="banner"]');
        if (!view) return;
        
        const addBtn = document.getElementById('btnBanner');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                // Show banner creation modal or form
                alert('Tính năng thêm banner sẽ được phát triển');
            });
        }
        
        // Load existing banners/promotions
        async function loadBannersData() {
            try {
                // Placeholder for banner API
                console.log('Loading banners...');
            } catch (e) {
                console.error('Load banners error:', e);
            }
        }
        
        loadBannersData();
    }

    // ====== GLOBAL DATA LOADING FUNCTIONS ======
    async function loadOverviewData() {
        const view = document.querySelector('[data-view="overview"]');
        if (!view || view.hidden) return;
        
        const kpiCards = view.querySelectorAll('.kpis .kpi');
        try {
            const res = await window.apiService.get('/dashboard/overview');
            if (res?.success) {
                const data = res.data || {};
                if (kpiCards[0]) kpiCards[0].querySelector('.kpi-value').textContent = formatVND(data.gmv);
                if (kpiCards[1]) kpiCards[1].querySelector('.kpi-value').textContent = String(data.pendingOrders || 0);
                if (kpiCards[2]) kpiCards[2].querySelector('.kpi-value').textContent = String(data.pendingProducts || 0);
                if (kpiCards[3]) kpiCards[3].querySelector('.kpi-value').textContent = String(data.openTickets || 0);
            }
        } catch (e) {
            console.error('Load overview data error:', e);
        }
    }


    async function loadPaymentsData() {
        const view = document.querySelector('[data-view="payments"]');
        if (!view || view.hidden) return;
        
        const list = view.querySelector('.list');
        if (!list) return;
        
        try {
            const res = await window.apiService.get('/payments/pending');
            if (res?.success) {
                list.innerHTML = '';
                (res.data || []).forEach(p => {
                    const article = document.createElement('article');
                    article.className = 'list-item';
                    article.innerHTML = `
                        <div class="avatar" style="width:40px;height:40px;background:#e5e7eb;border-radius:8px"></div>
                        <div style="flex:1">
                            <div class="list-title">Họ và tên: ${p.order?.customerName || p.order?.id || ''}</div>
                            <div class="list-sub">Chờ xác nhận • Số tiền: ${Number(p.amount||0).toLocaleString('vi-VN')} đ</div>
                        </div>
                        <button class="btn" data-id="${p.id}" style="background: #22c55e; color: #fff; border-color: #16a34a">Xác nhận</button>
                    `;
                    const btn = article.querySelector('button');
                    btn.addEventListener('click', async () => {
                        const r = await window.apiService.patch(`/payments/${p.id}/confirm`);
                        if (r?.success) { 
                            article.remove(); 
                            // Show success notification
                            showNotification('Đã xác nhận thanh toán thành công!', 'success');
                        }
                    });
                    list.appendChild(article);
                });
            }
        } catch (e) {
            console.error('Load payments data error:', e);
        }
    }

    async function loadReturnsData() {
        const view = document.querySelector('[data-view="returns"]');
        if (!view || view.hidden) return;
        
        const stats = view.querySelectorAll('.order-stats .order-stat-value');
        const panel = view.querySelector('.panel');
        
        try {
            const res = await window.apiService.get('/returns');
            if (res?.success) {
                const items = res.data || [];
                
                // Update stats
                if (stats[0]) stats[0].textContent = String(items.length || 0);
                if (stats[1]) stats[1].textContent = String(items.filter(r=>r.status==='PENDING').length);
                if (stats[2]) stats[2].textContent = String(items.filter(r=>r.status==='PROCESSING').length);
                if (stats[3]) stats[3].textContent = String(items.filter(r=>r.status==='APPROVED').length);
            }
        } catch (e) {
            console.error('Load returns data error:', e);
        }
    }

    async function loadUsersData() {
        const view = document.querySelector('[data-view="users"]');
        if (!view || view.hidden) return;
        
        const list = view.querySelector('#usersList');
        if (!list) return;
        
        try {
            const res = await window.apiService.get('/users');
            if (res?.success) {
                list.innerHTML = '';
                // Handle nested response structure: {success: true, data: {success: true, data: [...]}}
                let users = res.data;
                if (users && typeof users === 'object' && users.success && Array.isArray(users.data)) {
                    users = users.data;
                } else if (Array.isArray(users)) {
                    // users is already an array
                } else {
                    users = [];
                }
                
                users.forEach(u => {
                    const userItem = document.createElement('div');
                    userItem.className = 'user-item';
                    userItem.setAttribute('data-user-id', u.id);
                    userItem.innerHTML = `
                        <div class="user-avatar">
                            ${u.avt_img ? `<img src="${u.avt_img}" alt="${u.fullName || u.username}">` : (u.fullName || u.username).charAt(0).toUpperCase()}
                        </div>
                        <div class="user-info">
                            <div class="user-name">${u.fullName || u.username}</div>
                            <div class="user-email">${u.email || ''}</div>
                        </div>
                        <div class="user-status">
                            <div class="status-dot ${u.isActive ? 'active' : 'inactive'}"></div>
                            <span>${u.isActive ? 'Hoạt động' : 'Đã khóa'}</span>
                        </div>
                        <div class="user-actions">
                            <button class="btn btn-sm" onclick="editUser('${u.id}')" title="Chỉnh sửa">
                                <i class="fa-solid fa-edit"></i>
                            </button>
                        </div>`;
                    
                    // Add click event to select user
                    userItem.addEventListener('click', (e) => {
                        // Don't trigger if clicking on action buttons
                        if (e.target.closest('.user-actions')) return;
                        selectUser(u.id);
                    });
                    list.appendChild(userItem);
                });
                
                // Update user stats
                updateUserStats();
            }
        } catch (e) {
            console.error('Load users data error:', e);
        }
    }

    // loadProductsData function removed - now using loadProducts from initProductsView

    // ====== NOTIFICATION SYSTEM ======
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
        `;
        
        const colors = {
            success: '#22c55e',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Add CSS for notifications
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    function formatVND(v) {
        const n = Number(v || 0);
        return n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
    }

    function formatCurrency(v) {
        const n = Number(String(v).replace(/[^\d.-]/g, ''));
        if (!Number.isFinite(n)) return '';
        return n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
    }

    // ====== EDIT PRODUCT MODAL ======
    let currentEditProduct = null;

    // SubCategory management functions
    function saveProductSubCategory(productId, subCategory) {
        try {
            const subCategories = JSON.parse(localStorage.getItem('productSubCategories') || '{}');
            subCategories[productId] = subCategory;
            localStorage.setItem('productSubCategories', JSON.stringify(subCategories));
        } catch (e) {
            console.error('Error saving subCategory:', e);
        }
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

    function removeProductSubCategory(productId) {
        try {
            const subCategories = JSON.parse(localStorage.getItem('productSubCategories') || '{}');
            delete subCategories[productId];
            localStorage.setItem('productSubCategories', JSON.stringify(subCategories));
        } catch (e) {
            console.error('Error removing subCategory:', e);
        }
    }

    function openEditModal(product) {
        currentEditProduct = product;
        const modal = document.getElementById('editProductModal');
        if (!modal) return;

        // Fill form with product data
        document.getElementById('editProductName').value = product.name || '';
        document.getElementById('editProductPrice').value = product.price || 0;
        document.getElementById('editProductStock').value = product.stock || 0;
        document.getElementById('editProductDescription').value = product.description || '';
        document.getElementById('editProductStatus').value = product.isActive ? 'true' : 'false';

        // Load categories for edit modal
        loadEditCategories().then(() => {
            // Set main category
            const mainCategorySelect = document.getElementById('editMainCategory');
            if (product.category && product.category.id) {
                mainCategorySelect.value = product.category.id;
                // Update sub categories based on main category ID
                updateEditSubCategories(product.category.id).then(() => {
                    // Get saved subCategory from localStorage
                    const savedSubCategory = getProductSubCategory(product.id);
                    
                    const subCategorySelect = document.getElementById('editSubCategory');
                    if (subCategorySelect && !subCategorySelect.disabled) {
                        if (savedSubCategory) {
                            // Try to select the saved subCategory
                            const option = Array.from(subCategorySelect.options).find(opt => opt.value === savedSubCategory);
                            if (option) {
                                subCategorySelect.value = savedSubCategory;
                            } else {
                                // If saved subCategory not found, select first available
                                if (subCategorySelect.options.length > 1) {
                                    subCategorySelect.selectedIndex = 1;
                                }
                            }
                        } else {
                            // If no saved subCategory, select first available
                            if (subCategorySelect.options.length > 1) {
                                subCategorySelect.selectedIndex = 1;
                            }
                        }
                    }
                });
            }
        });

        // Show modal with flexbox centering
        modal.style.display = 'flex';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeEditModal() {
        const modal = document.getElementById('editProductModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.body.style.overflow = '';
            currentEditProduct = null;
        }
    }

    async function loadEditCategories() {
        const mainCategorySelect = document.getElementById('editMainCategory');
        if (!mainCategorySelect) return;

        try {
            const res = await window.apiService.get('/categories/main');
            console.log('Load edit categories response:', res);
            
            // Handle nested response structure: {success: true, data: {success: true, data: [...]}}
            let categoriesData = [];
            if (res?.success) {
                if (res.data?.data && Array.isArray(res.data.data)) {
                    // Nested structure
                    categoriesData = res.data.data;
                } else if (Array.isArray(res.data)) {
                    // Direct array
                    categoriesData = res.data;
                }
            }
            
            console.log('Categories data:', categoriesData);
            
            mainCategorySelect.innerHTML = '';
            const placeholder = document.createElement('option');
            placeholder.textContent = 'Chọn danh mục sản phẩm';
            placeholder.value = '';
            mainCategorySelect.appendChild(placeholder);
            
            categoriesData.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.id;
                opt.textContent = cat.name;
                mainCategorySelect.appendChild(opt);
            });
        } catch (e) {
            console.error('Load edit categories error', e);
        }
    }

    async function updateEditSubCategories(categoryId) {
        const subCategorySelect = document.getElementById('editSubCategory');
        if (!subCategorySelect) return;

        subCategorySelect.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.textContent = 'Chọn danh mục con';
        placeholder.value = '';
        subCategorySelect.appendChild(placeholder);

        if (!categoryId) {
            subCategorySelect.disabled = true;
            return;
        }

        try {
            // Call API to get subcategories
            const res = await window.apiService.get(`/categories/${categoryId}/subcategories`);
            console.log('Subcategories response:', res);

            let subcategories = [];
            if (Array.isArray(res)) {
                subcategories = res;
            } else if (res?.data && Array.isArray(res.data)) {
                subcategories = res.data;
            }

            console.log('Subcategories data:', subcategories);

            if (subcategories.length > 0) {
                subCategorySelect.disabled = false;
                subcategories.forEach(sub => {
                    const opt = document.createElement('option');
                    opt.value = sub.id;
                    opt.textContent = sub.name;
                    subCategorySelect.appendChild(opt);
                });
            } else {
                subCategorySelect.disabled = true;
            }
        } catch (error) {
            console.error('Load subcategories error:', error);
            subCategorySelect.disabled = true;
        }
    }

    async function saveEditProduct() {
        if (!currentEditProduct) return;

        const name = document.getElementById('editProductName').value.trim();
        const price = Number(document.getElementById('editProductPrice').value);
        const stock = Number(document.getElementById('editProductStock').value);
        const description = document.getElementById('editProductDescription').value.trim();
        const isActive = document.getElementById('editProductStatus').value === 'true';
        const categoryId = document.getElementById('editMainCategory').value;
        const subCategory = document.getElementById('editSubCategory').value;

        // Validation
        if (!name) return showNotification('Vui lòng nhập tên sản phẩm', 'error');
        if (price === undefined || price === null || price < 0) return showNotification('Giá bán không hợp lệ', 'error');
        if (stock === undefined || stock === null || stock < 0) return showNotification('Số lượng không hợp lệ', 'error');
        if (!description) return showNotification('Vui lòng nhập mô tả sản phẩm', 'error');
        if (!categoryId) return showNotification('Vui lòng chọn danh mục', 'error');

        try {
            const payload = {
                name,
                price,
                stock,
                description,
                isActive,
                categoryId
                // Note: subCategory is not supported by backend yet
            };

            console.log('Updating product:', currentEditProduct.id);
            console.log('Payload:', payload);

            const res = await window.apiService.patch(`/products/${currentEditProduct.id}`, payload);
            
            console.log('Update product response:', res);
            
            if (res?.success) {
                // Save subCategory to localStorage
                if (subCategory) {
                    saveProductSubCategory(currentEditProduct.id, subCategory);
                } else {
                    removeProductSubCategory(currentEditProduct.id);
                }
                
                showNotification('✅ Đã cập nhật sản phẩm thành công!', 'success');
                closeEditModal();
                await loadProductsData();
                
                // Update product stats (realtime)
                await updateProductStats();
                
                // Auto refresh the entire page after a short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                console.error('Update failed:', res);
                showNotification(res?.message || 'Cập nhật sản phẩm thất bại', 'error');
            }
        } catch (e) {
            console.error('Update product error:', e);
            showNotification('Có lỗi khi cập nhật sản phẩm: ' + (e.message || 'Lỗi không xác định'), 'error');
        }
    }

    // Event listeners for edit modal using event delegation
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'closeEditModal') {
            closeEditModal();
        }
        if (e.target && e.target.id === 'cancelEdit') {
            closeEditModal();
        }
        if (e.target && e.target.id === 'saveEdit') {
            saveEditProduct();
        }
    });

    document.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'editMainCategory') {
            const selectedCategoryId = e.target.value;
            updateEditSubCategories(selectedCategoryId);
        }
    });

    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'editProductModal') {
            closeEditModal();
        }
    });

    // ====== ADD PRODUCT ======
    async function addProduct() {
        const nameInput = document.querySelector('#view-products input[placeholder*="tên sản phẩm"]');
        const priceInput = document.querySelector('#view-products input[value="0"]');
        const mainCategorySelect = document.getElementById('mainCategorySelect');
        const subCategorySelect = document.getElementById('subCategorySelect');
        const descriptionTextarea = document.querySelector('#view-products textarea');
        const quantityInput = document.getElementById('inputStock');

        if (!nameInput) {
            console.error('Product name input not found');
            return;
        }

        const name = nameInput.value.trim();
        const price = priceInput ? parseFloat(priceInput.value) || 0 : 0;
        // Use sub-category if selected, otherwise use main category
        const categoryId = subCategorySelect && subCategorySelect.value ? subCategorySelect.value : (mainCategorySelect ? mainCategorySelect.value : '');
        const description = descriptionTextarea ? descriptionTextarea.value.trim() : '';
        const quantity = quantityInput ? parseInt(quantityInput.value) || 0 : 0;

        if (!name) {
            showNotification('Vui lòng nhập tên sản phẩm', 'error');
            nameInput.focus();
            return;
        }

        try {
            // Get images from ImageUploader
            let images = [];
            const uploadZone = document.querySelector('#productImageUpload');
            if (uploadZone) {
                // Try to get ImageUploader instance from global scope or find it
                const imageUploader = window.imageUploader || uploadZone.imageUploader;
                if (imageUploader && typeof imageUploader.getFiles === 'function') {
                    const files = imageUploader.getFiles();
                    if (files && files.length > 0) {
                        // Convert files to base64
                        images = await Promise.all(files.map(async (file, index) => {
                            const base64 = await fileToBase64(file);
                            return {
                                url: base64,
                                alt: file.name,
                                order: index
                            };
                        }));
                    }
                }
            }

            const productData = {
                name: name,
                price: price,
                categoryId: categoryId || undefined,
                description: description || undefined,
                stock: quantity,
                images: images.length > 0 ? images : undefined
            };

            console.log('Sending product data:', productData);
            const res = await window.apiService.post('/products', productData);
            console.log('Add product response:', res);
            
            if (res?.success) {
                showNotification('Thêm sản phẩm thành công!', 'success');
                
                // Reset form
                if (nameInput) nameInput.value = '';
                if (priceInput) priceInput.value = '0';
                if (mainCategorySelect) mainCategorySelect.selectedIndex = 0;
                if (subCategorySelect) {
                    subCategorySelect.selectedIndex = 0;
                    subCategorySelect.disabled = true;
                }
                if (descriptionTextarea) descriptionTextarea.value = '';
                if (quantityInput) quantityInput.value = '0';
                
                // Clear images
                const uploadZone = document.querySelector('#productImageUpload');
                if (uploadZone) {
                    const imageUploader = window.imageUploader || uploadZone.imageUploader;
                    if (imageUploader && typeof imageUploader.clear === 'function') {
                        imageUploader.clear();
                    }
                }
                
                // Auto refresh products list
                await loadProductsData();
                
                // Update product stats (realtime)
                await updateProductStats();
                
                // Auto refresh the entire page after a short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showNotification(res?.message || 'Thêm sản phẩm thất bại', 'error');
            }
        } catch (e) {
            console.error('Add product error:', e);
            showNotification('Có lỗi khi thêm sản phẩm: ' + (e.message || 'Lỗi không xác định'), 'error');
        }
    }

    // ====== LOAD PRODUCTS DATA ======
    async function loadProductsData() {
        try {
            const res = await window.apiService.get('/products');
            console.log('Load products response:', res);
            
            let productsData = [];
            if (res?.success && res.data) {
                productsData = Array.isArray(res.data) ? res.data : [];
            } else if (Array.isArray(res)) {
                productsData = res;
            } else if (res?.data && Array.isArray(res.data)) {
                productsData = res.data;
            }

            // Update products list display
            const productsView = document.querySelector('[data-view="products"]');
            if (productsView) {
                renderProductsList(productsData);
            }
        } catch (e) {
            console.error('Load products error:', e);
        }
    }

    // ====== RENDER PRODUCTS LIST ======
    function renderProductsList(products) {
        const productsView = document.querySelector('[data-view="products"]');
        if (!productsView) return;

        const listPanel = productsView.querySelector('.panel-placeholder');
        if (!listPanel) return;

        if (!products || products.length === 0) {
            listPanel.innerHTML = '<div class="empty-state">Chưa có sản phẩm nào</div>';
            return;
        }

        let html = '<div class="products-list">';
        products.forEach(product => {
            html += `
                <div class="product-item" data-product-id="${product.id}">
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p>Giá: ${product.price ? product.price.toLocaleString('vi-VN') + ' VND' : 'Chưa có giá'}</p>
                        <p>Số lượng: ${product.quantity || 0}</p>
                        <p>Danh mục: ${product.category?.name || 'Chưa phân loại'}</p>
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-sm" onclick="editProduct('${product.id}')">Chỉnh sửa</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product.id}')">Xóa</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        listPanel.innerHTML = html;
    }

    // ====== UPDATE PRODUCT STATS ======
    // Update product stats (call the loadProductStats from initProductsView)
    async function updateProductStats() {
        // Find the products view and trigger stats reload
        const productsView = document.querySelector('[data-view="products"]');
        if (!productsView) return;
        
        // Call the realtime stats loader
        if (window.loadProductStats && typeof window.loadProductStats === 'function') {
            await window.loadProductStats();
        }
    }

    // ====== EDIT PRODUCT ======
    function editProduct(productId) {
        console.log('Edit product:', productId);
        // TODO: Implement edit product functionality
    }

    // ====== DELETE PRODUCT ======
    async function deleteProduct(productId) {
        // Try to get product name from DOM first
        let productName = 'sản phẩm này';
        const productElement = document.querySelector(`[data-product-id="${productId}"]`);
        if (productElement) {
            const nameElement = productElement.querySelector('.product-name');
            if (nameElement) {
                productName = nameElement.textContent.trim();
            }
        }
        
        const confirmed = await showConfirmationModal({
            type: 'danger',
            icon: 'trash',
            title: 'Xóa sản phẩm',
            message: `Bạn có chắc chắn muốn xóa sản phẩm "${productName}"? Hành động này không thể hoàn tác!`,
            confirmText: 'Xóa sản phẩm',
            confirmType: 'danger'
        });

        if (confirmed) {
            try {
                const res = await window.apiService.delete(`/products/${productId}`);
                console.log('Delete product response:', res);
                
                if (res?.success) {
                    showNotification('Xóa sản phẩm thành công!');
                    // Auto refresh products list
                    await loadProductsData();
                    updateProductStats();
                    
                    // Auto refresh the entire page after a short delay
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    showNotification(res?.message || 'Xóa sản phẩm thất bại', 'error');
                }
            } catch (e) {
                console.error('Delete product error:', e);
                showNotification('Có lỗi khi xóa sản phẩm: ' + (e.message || 'Lỗi không xác định'), 'error');
            }
        }
    }

    // ====== UTILITY FUNCTIONS ======
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // ====== USER MANAGEMENT ======
    let users = [];
    let selectedUser = null;
    let currentUserTab = 'all';

    // Load users from API
    async function loadUsers() {
        try {
            const res = await window.apiService.get('/users');
            console.log('Users API response:', res);
            
            if (res?.success && res?.data) {
                // Handle nested response structure: {success: true, data: {success: true, data: [...]}}
                let userData = res.data;
                if (userData && typeof userData === 'object' && userData.success && Array.isArray(userData.data)) {
                    // Unwrap the nested response
                    userData = userData.data;
                } else if (Array.isArray(userData)) {
                    // Direct array response
                    userData = userData;
                } else {
                    userData = [];
                }
                
                users = userData;
                console.log('Users loaded:', users);
                renderUsers();
                updateUserStats();
            } else {
                users = [];
                renderUsers();
                updateUserStats();
            }
        } catch (error) {
            console.error('Error loading users:', error);
            users = [];
            renderUsers();
            updateUserStats();
        }
    }

    // Render users list
    async function renderUsers() {
        const usersList = document.getElementById('usersList');
        if (!usersList) return;

        try {
            const res = await window.apiService.get('/users');
            if (res?.success) {
                // Handle nested response structure: {success: true, data: {success: true, data: [...]}}
                let allUsers = res.data;
                if (allUsers && typeof allUsers === 'object' && allUsers.success && Array.isArray(allUsers.data)) {
                    allUsers = allUsers.data;
                } else if (Array.isArray(allUsers)) {
                    // allUsers is already an array
                } else {
                    allUsers = [];
                }
                
                const filteredUsers = getFilteredUsers(allUsers);
                
                if (filteredUsers.length === 0) {
                    usersList.innerHTML = `
                        <div class="empty-users">
                            <i class="fa-solid fa-users"></i>
                            <div>Không có người dùng nào</div>
                        </div>
                    `;
                    return;
                }

                usersList.innerHTML = filteredUsers.map(user => `
                    <div class="user-item" data-user-id="${user.id}" onclick="selectUser('${user.id}')">
                        <div class="user-avatar">
                            ${user.avt_img ? 
                                `<img src="${user.avt_img}" alt="${user.fullName}" />` : 
                                user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'
                            }
                        </div>
                        <div class="user-info">
                            <div class="user-name">
                                ${user.fullName || 'Chưa có tên'}
                                <span class="user-role ${user.role}">${user.role}</span>
                            </div>
                            <div class="user-email">${user.email}</div>
                        </div>
                        <div class="user-status">
                            <div class="status-dot ${user.isActive ? 'active' : 'inactive'}"></div>
                            <span>${user.isActive ? 'Hoạt động' : 'Đã khóa'}</span>
                        </div>
                        <div class="user-actions">
                            <button class="btn btn-sm" onclick="event.stopPropagation(); editUser('${user.id}')" title="Chỉnh sửa">
                                <i class="fa-solid fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); window.toggleUserStatus('${user.id}')" title="${user.isActive ? 'Khóa' : 'Mở khóa'}">
                                <i class="fa-solid fa-${user.isActive ? 'lock' : 'unlock'}"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); window.deleteUser('${user.id}')" title="Xóa">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error rendering users:', error);
            usersList.innerHTML = `
                <div class="empty-users">
                    <i class="fa-solid fa-exclamation-triangle"></i>
                    <div>Có lỗi khi tải danh sách người dùng</div>
                </div>
            `;
        }
    }

    // Get filtered users based on current tab
    function getFilteredUsers(users = []) {
        switch (currentUserTab) {
            case 'active':
                return users.filter(user => user.isActive);
            case 'inactive':
                return users.filter(user => !user.isActive);
            case 'admin':
                return users.filter(user => user.role === 'ADMIN');
            default:
                return users;
        }
    }

    // Select user
    async function selectUser(userId) {
        // Remove previous selection
        document.querySelectorAll('.user-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Add selection to clicked item
        const userItem = document.querySelector(`[data-user-id="${userId}"]`);
        if (userItem) {
            userItem.classList.add('selected');
        }

        // Fetch user details from API
        try {
            const res = await window.apiService.get(`/users/${userId}`);
            if (res?.success) {
                renderUserDetails(res.data);
            } else {
                console.error('Error fetching user details:', res?.message);
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    }

    // Render user details
    function renderUserDetails(user) {
        const userDetails = document.getElementById('userDetails');
        if (!userDetails) return;

        userDetails.innerHTML = `
            <div class="user-details">
                <div class="user-details-header">
                    <div class="user-details-avatar">
                        ${user.avt_img ? 
                            `<img src="${user.avt_img}" alt="${user.fullName}" />` : 
                            user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'
                        }
                    </div>
                    <div class="user-details-info">
                        <h3>${user.fullName || 'Chưa có tên'}</h3>
                        <p>${user.email}</p>
                    </div>
                </div>
                <div class="user-details-content">
                    <div class="detail-group">
                        <div class="detail-label">Tên đăng nhập</div>
                        <div class="detail-value">${user.username || 'N/A'}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Số điện thoại</div>
                        <div class="detail-value">${user.phone || 'N/A'}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Giới tính</div>
                        <div class="detail-value">${user.gender || 'N/A'}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Vai trò</div>
                        <div class="detail-value">
                            <span class="user-role ${user.role}">${user.role}</span>
                        </div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Trạng thái</div>
                        <div class="detail-value">
                            <span class="status-dot ${user.isActive ? 'active' : 'inactive'}"></span>
                            ${user.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Địa chỉ</div>
                        <div class="detail-value">${user.fullAddress || 'N/A'}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Ngày tạo</div>
                        <div class="detail-value">${user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</div>
                    </div>
                </div>
                <div class="user-details-actions">
                    <button class="btn" onclick="editUser('${user.id}')">
                        <i class="fa-solid fa-edit"></i> Chỉnh sửa
                    </button>
                    <button class="btn btn-danger" onclick="window.toggleUserStatus('${user.id}')">
                        <i class="fa-solid fa-${user.isActive ? 'lock' : 'unlock'}"></i>
                        ${user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                    </button>
                    <button class="btn btn-danger" onclick="window.deleteUser('${user.id}')">
                        <i class="fa-solid fa-trash"></i> Xóa
                    </button>
                </div>
            </div>
        `;
    }

    // Update user statistics
    async function updateUserStats() {
        try {
            const res = await window.apiService.get('/users');
            if (res?.success) {
                // Handle nested response structure: {success: true, data: {success: true, data: [...]}}
                let users = res.data;
                if (users && typeof users === 'object' && users.success && Array.isArray(users.data)) {
                    users = users.data;
                } else if (Array.isArray(users)) {
                    // users is already an array
                } else {
                    users = [];
                }
                
                const totalUsers = users.length;
                const activeUsers = users.filter(user => user.isActive).length;
                const inactiveUsers = users.filter(user => !user.isActive).length;
                const adminUsers = users.filter(user => user.role === 'ADMIN').length;

                const totalUsersEl = document.getElementById('totalUsers');
                const activeUsersEl = document.getElementById('activeUsers');
                const inactiveUsersEl = document.getElementById('inactiveUsers');
                const adminUsersEl = document.getElementById('adminUsers');

                if (totalUsersEl) totalUsersEl.textContent = totalUsers;
                if (activeUsersEl) activeUsersEl.textContent = activeUsers;
                if (inactiveUsersEl) inactiveUsersEl.textContent = inactiveUsers;
                if (adminUsersEl) adminUsersEl.textContent = adminUsers;
            }
        } catch (error) {
            console.error('Error updating user stats:', error);
        }
    }

    // Show confirmation modal
    function showConfirmationModal(options) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'confirmation-overlay show';
            modal.innerHTML = `
                <div class="confirmation-modal">
                    <div class="confirmation-content">
                        <div class="confirmation-icon ${options.type || 'warning'}">
                            <i class="fa-solid fa-${options.icon || 'exclamation-triangle'}"></i>
                        </div>
                        <h3>${options.title || 'Xác nhận'}</h3>
                        <p>${options.message}</p>
                    </div>
                    <div class="confirmation-actions">
                        <button class="confirmation-btn confirmation-btn-cancel" onclick="this.closest('.confirmation-overlay').remove(); window.confirmationResolve(false);">
                            Hủy
                        </button>
                        <button class="confirmation-btn confirmation-btn-confirm ${options.confirmType || 'warning'}" onclick="this.closest('.confirmation-overlay').remove(); window.confirmationResolve(true);">
                            ${options.confirmText || 'Xác nhận'}
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Store resolve function globally so onclick can access it
            window.confirmationResolve = resolve;
            
            // Auto remove after 5 seconds if no interaction
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    modal.remove();
                    resolve(false);
                }
            }, 5000);
        });
    }

    // Show notification
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type} show`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fa-solid fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'exclamation'}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${type === 'success' ? 'Thành công' : type === 'error' ? 'Lỗi' : 'Thông báo'}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="this.closest('.notification').remove()">
                <i class="fa-solid fa-times"></i>
            </button>
        `;
        
        const container = document.querySelector('.notification-container') || (() => {
            const container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
            return container;
        })();
        
        container.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // Toggle user status (activate/deactivate)
    async function toggleUserStatus(userId) {
        console.log('toggleUserStatus called with userId:', userId);
        
        try {
            // Fetch user details first
            const res = await window.apiService.get(`/users/${userId}`);
            if (!res?.success) {
                console.log('User not found');
                return;
            }
            
            const user = res.data;
            const action = user.isActive ? 'khóa' : 'mở khóa';
            const actionText = user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản';
            console.log('Action:', action);
            
            const confirmed = await showConfirmationModal({
                type: 'warning',
                icon: user.isActive ? 'lock' : 'unlock',
                title: actionText,
                message: `Bạn có chắc chắn muốn ${action} tài khoản "${user.fullName || user.email}"?`,
                confirmText: actionText,
                confirmType: 'warning'
            });
            
            if (confirmed) {
                try {
                    console.log('Processing user status change...');
                    
                    if (user.isActive) {
                        // Khóa tài khoản
                        const res = await window.apiService.patch(`/users/${userId}/deactivate`);
                        console.log('Deactivate user response:', res);
                        
                        if (res?.success) {
                            showNotification('Khóa tài khoản thành công!');
                            await loadUsersData();
                        } else {
                            showNotification(res?.message || 'Khóa tài khoản thất bại', 'error');
                        }
                    } else {
                        // Mở khóa tài khoản
                        const res = await window.apiService.patch(`/users/${userId}/activate`);
                        console.log('Activate user response:', res);
                        
                        if (res?.success) {
                            showNotification('Mở khóa tài khoản thành công!');
                            await loadUsersData();
                        } else {
                            showNotification(res?.message || 'Mở khóa tài khoản thất bại', 'error');
                        }
                    }
                } catch (error) {
                    console.error('Toggle user status error:', error);
                    showNotification(`Có lỗi khi ${action} tài khoản: ${error.message || 'Lỗi không xác định'}`, 'error');
                }
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
            showNotification('Có lỗi khi lấy thông tin người dùng', 'error');
        }
    }

    // Edit user
    async function editUser(userId) {
        try {
            const res = await window.apiService.get(`/users/${userId}`);
            if (res?.success) {
                const user = res.data;
                openEditUserModal(user);
            } else {
                showNotification('Không tìm thấy người dùng', 'error');
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
            showNotification('Có lỗi khi lấy thông tin người dùng', 'error');
        }
    }

    // Delete user
    async function deleteUser(userId) {
        console.log('deleteUser called with userId:', userId);
        
        try {
            // Fetch user details first
            const res = await window.apiService.get(`/users/${userId}`);
            if (!res?.success) {
                console.log('User not found for deletion');
                return;
            }
            
            const user = res.data;

            const confirmed = await showConfirmationModal({
                type: 'danger',
                icon: 'trash',
                title: 'Xóa tài khoản',
                message: `Bạn có chắc chắn muốn xóa tài khoản "${user.fullName || user.email}"? Hành động này không thể hoàn tác!`,
                confirmText: 'Xóa tài khoản',
                confirmType: 'danger'
            });

            if (confirmed) {
                try {
                    console.log('Processing user deletion...');
                    const deleteRes = await window.apiService.delete(`/users/${userId}`);
                    console.log('Delete user response:', deleteRes);
                    
                    if (deleteRes?.success) {
                        showNotification('Xóa tài khoản thành công!');
                        await loadUsersData();
                        // Clear selection if deleted user was selected
                        const userDetails = document.getElementById('userDetails');
                        if (userDetails) {
                            userDetails.innerHTML = `
                                <div class="user-details-placeholder">
                                    <div class="placeholder-icon">
                                        <i class="fa-solid fa-user"></i>
                                    </div>
                                    <div class="placeholder-text">Chọn một người dùng để xem chi tiết</div>
                                </div>
                            `;
                        }
                    } else {
                        showNotification(deleteRes?.message || 'Xóa tài khoản thất bại', 'error');
                    }
                } catch (error) {
                    console.error('Delete user error:', error);
                    showNotification('Có lỗi khi xóa tài khoản: ' + (error.message || 'Lỗi không xác định'), 'error');
                }
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
            showNotification('Có lỗi khi lấy thông tin người dùng', 'error');
        }
    }

    // Handle user tab switching
    function handleUserTabSwitch(tab) {
        // Update active tab
        document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Update current tab and re-render
        currentUserTab = tab;
        renderUsers();
    }

    // Initialize user management
    function initUserManagement() {
        // Load users when users view is shown
        const usersView = document.getElementById('view-users');
        if (usersView) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'hidden') {
                        if (!usersView.hidden) {
                            loadUsersData();
                        }
                    }
                });
            });
            observer.observe(usersView, { attributes: true });
        }

        // Handle tab switching
        document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                handleUserTabSwitch(tab);
            });
        });

        // Handle refresh button
        const refreshBtn = document.getElementById('refreshUsers');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', loadUsersData);
        }
    }

    // Initialize user management
    initUserManagement();

    // ====== CREATE USER MODAL FUNCTIONS ======
    
    // Open create user modal
    function openCreateUserModal() {
        console.log('openCreateUserModal called');
        // Always create fresh modal
        const modal = createUserModalIfNotExists();
        console.log('Modal element:', modal);
        if (modal) {
            modal.style.display = 'flex';
            console.log('Modal display set to flex');
            // Reset form
            const form = document.getElementById('createUserForm');
            if (form) {
                form.reset();
                console.log('Form reset');
            }
        } else {
            console.error('Modal element not found!');
        }
    }

    // ====== EDIT USER MODAL FUNCTIONS ======
    
    // Open edit user modal
    function openEditUserModal(user) {
        console.log('openEditUserModal called with user:', user);
        const modal = createEditUserModalIfNotExists();
        if (modal) {
            // Populate form with user data
            populateEditUserForm(user);
            modal.style.display = 'flex';
        } else {
            console.error('Edit user modal element not found!');
        }
    }

    // Close edit user modal
    function closeEditUserModal() {
        const modal = document.getElementById('editUserModal');
        if (modal) {
            modal.style.display = 'none';
            // Reset form
            const form = document.getElementById('editUserForm');
            if (form) {
                form.reset();
            }
        }
    }

    // Populate edit user form with user data
    function populateEditUserForm(user) {
        document.getElementById('editUserFullName').value = user.fullName || '';
        document.getElementById('editUserEmail').value = user.email || '';
        document.getElementById('editUserPhone').value = user.phone || '';
        document.getElementById('editUserGender').value = user.gender || '';
        document.getElementById('editUserRole').value = user.role || 'USER';
        document.getElementById('editUserAvatar').value = user.avt_img || '';
        document.getElementById('editUserIsActive').checked = user.isActive !== false;
        
        // Store user ID for later use
        document.getElementById('editUserForm').setAttribute('data-user-id', user.id);
    }

    // Validate edit user form
    function validateEditUserForm() {
        const fullName = document.getElementById('editUserFullName').value.trim();
        const email = document.getElementById('editUserEmail').value.trim();
        const phone = document.getElementById('editUserPhone').value.trim();
        const gender = document.getElementById('editUserGender').value;

        if (!fullName) {
            showNotification('Vui lòng nhập họ tên', 'error');
            return false;
        }

        if (!email) {
            showNotification('Vui lòng nhập email', 'error');
            return false;
        }

        if (!isValidEmail(email)) {
            showNotification('Email không hợp lệ', 'error');
            return false;
        }

        if (!phone) {
            showNotification('Vui lòng nhập số điện thoại', 'error');
            return false;
        }

        if (!isValidPhone(phone)) {
            showNotification('Số điện thoại không hợp lệ', 'error');
            return false;
        }

        if (!gender) {
            showNotification('Vui lòng chọn giới tính', 'error');
            return false;
        }

        return true;
    }

    // Save edited user
    async function saveEditedUser() {
        if (!validateEditUserForm()) {
            return;
        }

        const userId = document.getElementById('editUserForm').getAttribute('data-user-id');
        if (!userId) {
            showNotification('Không tìm thấy ID người dùng', 'error');
            return;
        }

        const userData = {
            fullName: document.getElementById('editUserFullName').value.trim(),
            email: document.getElementById('editUserEmail').value.trim(),
            phone: document.getElementById('editUserPhone').value.trim(),
            gender: document.getElementById('editUserGender').value,
            role: document.getElementById('editUserRole').value,
            avt_img: document.getElementById('editUserAvatar').value.trim(),
            isActive: document.getElementById('editUserIsActive').checked
        };

        try {
            showNotification('Đang cập nhật thông tin người dùng...', 'info');
            
            const response = await window.apiService.patch(`/users/${userId}/edit`, userData);
            
            if (response.success) {
                showNotification('Cập nhật thông tin người dùng thành công!', 'success');
                closeEditUserModal();
                // Refresh user list
                loadUsers();
            } else {
                showNotification(response.message || 'Có lỗi khi cập nhật thông tin người dùng', 'error');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            showNotification('Có lỗi khi cập nhật thông tin người dùng', 'error');
        }
    }

    // Reset user password
    async function resetUserPassword(userId) {
        try {
            showNotification('Đang reset mật khẩu...', 'info');
            
            const response = await window.apiService.patch(`/users/${userId}/reset-password`);
            
            if (response.success) {
                showNotification('Reset mật khẩu thành công! Mật khẩu mới là: 1', 'success');
            } else {
                showNotification(response.message || 'Có lỗi khi reset mật khẩu', 'error');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            showNotification('Có lỗi khi reset mật khẩu', 'error');
        }
    }

    // Close create user modal
    function closeCreateUserModal() {
        const modal = document.getElementById('createUserModal');
        if (modal) {
            modal.style.display = 'none';
            // Reset form
            const form = document.getElementById('createUserForm');
            if (form) {
                form.reset();
            }
        }
    }

    // Validate create user form
    function validateCreateUserForm() {
        const fullName = document.getElementById('createUserFullName').value.trim();
        const email = document.getElementById('createUserEmail').value.trim();
        const phone = document.getElementById('createUserPhone').value.trim();
        const username = document.getElementById('createUserUsername').value.trim();
        const password = document.getElementById('createUserPassword').value;
        const confirmPassword = document.getElementById('createUserConfirmPassword').value;
        const role = document.getElementById('createUserRole').value;

        // Required field validation
        if (!fullName || !email || !phone || !username || !password || !confirmPassword || !role) {
            showNotification('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Email không hợp lệ', 'error');
            return false;
        }

        // Password validation
        if (password.length < 6) {
            showNotification('Mật khẩu phải có ít nhất 6 ký tự', 'error');
            return false;
        }

        if (password !== confirmPassword) {
            showNotification('Mật khẩu xác nhận không khớp', 'error');
            return false;
        }

        // Username validation
        if (username.length < 3) {
            showNotification('Tên đăng nhập phải có ít nhất 3 ký tự', 'error');
            return false;
        }

        // Phone validation (required)
        const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
        if (!phoneRegex.test(phone)) {
            showNotification('Số điện thoại không hợp lệ', 'error');
            return false;
        }

        return true;
    }

    // Create user function
    async function createUser() {
        if (!validateCreateUserForm()) {
            return;
        }

        try {
            // Show loading
            const saveBtn = document.getElementById('saveCreateUser');
            if (!saveBtn) {
                console.error('Save button not found!');
                return;
            }
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Đang tạo...';
            saveBtn.disabled = true;

            // Get form data
            const formData = {
                fullName: document.getElementById('createUserFullName').value.trim(),
                email: document.getElementById('createUserEmail').value.trim(),
                phone: document.getElementById('createUserPhone').value.trim(),
                username: document.getElementById('createUserUsername').value.trim(),
                password: document.getElementById('createUserPassword').value,
                gender: document.getElementById('createUserGender').value || undefined,
                role: document.getElementById('createUserRole').value,
            };

            // Call API
            console.log('Sending form data:', formData);
            const response = await window.apiService.post('/users', formData);
            console.log('API response:', response);

            if (response?.success) {
                showNotification('Tạo người dùng thành công!', 'success');
                closeCreateUserModal();
                
                // Refresh users list if we're on users page
                if (typeof loadUsersData === 'function') {
                    await loadUsersData();
                }
                
                // Refresh user stats
                if (typeof updateUserStats === 'function') {
                    updateUserStats();
                }
            } else {
                console.error('API error:', response);
                showNotification(response?.message || 'Tạo người dùng thất bại', 'error');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            showNotification('Có lỗi khi tạo người dùng: ' + (error.message || 'Lỗi không xác định'), 'error');
        } finally {
            // Reset button
            const saveBtn = document.getElementById('saveCreateUser');
            if (saveBtn) {
                saveBtn.textContent = 'Tạo người dùng';
                saveBtn.disabled = false;
            }
        }
    }

    // Event listeners for create user modal
    document.addEventListener('click', (e) => {
        console.log('Click event:', e.target, 'ID:', e.target.id);
        
        // Check if clicked element is a create user button
        const isCreateUserButton = e.target && (
            e.target.id === 'createUserBtn' || 
            e.target.id === 'btnNewUser' ||
            e.target.textContent?.includes('Tạo người dùng') ||
            e.target.textContent?.includes('Tạo người dùng mới') ||
            e.target.closest('button[class*="btn"][id*="create"]') ||
            e.target.closest('button[class*="btn"][id*="user"]')
        );
        
        if (isCreateUserButton) {
            console.log('Create user button clicked');
            createUserModalIfNotExists();
            openCreateUserModal();
        }
        // Note: Modal button event listeners are added directly to the modal elements
        // when the modal is created, so we don't need to handle them here
    });

    // Create modal dynamically if not exists
    function createUserModalIfNotExists() {
        // Always remove old modal if exists
        const oldModal = document.getElementById('createUserModal');
        if (oldModal) {
            console.log('Removing old modal...');
            oldModal.remove();
        }
        
        console.log('Creating modal dynamically...');
        
        // Add CSS for modal if not exists
        if (!document.getElementById('createUserModalCSS')) {
            const style = document.createElement('style');
            style.id = 'createUserModalCSS';
            style.textContent = `
                    .modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0, 0, 0, 0.5);
                        z-index: 1000;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .modal-content {
                        background: white;
                        border-radius: 12px;
                        width: 90%;
                        max-width: 600px;
                        max-height: 90vh;
                        overflow-y: auto;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    }
                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px 24px;
                        border-bottom: 1px solid #e5e7eb;
                    }
                    .modal-header h3 {
                        margin: 0;
                        font-size: 1.25rem;
                        font-weight: 600;
                        color: #111827;
                    }
                    .modal-close {
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        cursor: pointer;
                        color: #6b7280;
                        padding: 0;
                        width: 32px;
                        height: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 6px;
                    }
                    .modal-close:hover {
                        background-color: #f3f4f6;
                        color: #374151;
                    }
                    .modal-body {
                        padding: 24px;
                    }
                    .form-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 16px;
                        margin-bottom: 16px;
                    }
                    .form-field {
                        margin-bottom: 16px;
                    }
                    .form-field {
                        display: flex;
                        flex-direction: column;
                    }
                    .form-field label {
                        font-weight: 500;
                        color: #374151;
                        margin-bottom: 6px;
                        font-size: 0.875rem;
                    }
                    .form-field input,
                    .form-field select,
                    .form-field textarea {
                        padding: 8px 12px;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        font-size: 0.875rem;
                        transition: border-color 0.2s;
                    }
                    .form-field input:focus,
                    .form-field select:focus,
                    .form-field textarea:focus {
                        outline: none;
                        border-color: #3b82f6;
                        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                    }
                    .modal-footer {
                        display: flex;
                        justify-content: flex-end;
                        gap: 12px;
                        padding: 20px 24px;
                        border-top: 1px solid #e5e7eb;
                    }
                    .modal-footer .btn {
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-size: 0.875rem;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .modal-footer .btn:not([style*="background"]) {
                        background: #f3f4f6;
                        color: #374151;
                        border: 1px solid #d1d5db;
                    }
                    .modal-footer .btn:not([style*="background"]):hover {
                        background: #e5e7eb;
                    }
                `;
            document.head.appendChild(style);
        }
        
        const modal = document.createElement('div');
        modal.id = 'createUserModal';
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Tạo người dùng mới</h3>
                        <button class="modal-close" id="closeCreateUserModal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="createUserForm">
                            <div class="form-field">
                                <label>Họ và tên *</label>
                                <input type="text" id="createUserFullName" class="input" placeholder="Họ và tên của bạn..." required>
                            </div>
                            <div class="form-field">
                                <label>Email *</label>
                                <input type="email" id="createUserEmail" class="input" placeholder="Nhập email của bạn..." required>
                            </div>
                            <div class="form-field">
                                <label>Số điện thoại *</label>
                                <input type="tel" id="createUserPhone" class="input" placeholder="Nhập số điện thoại..." required>
                            </div>
                            <div class="form-field">
                                <label>Tên đăng nhập *</label>
                                <input type="text" id="createUserUsername" class="input" placeholder="Nhập tài khoản đăng nhập..." required>
                            </div>
                            <div class="form-field">
                                <label>Mật khẩu *</label>
                                <input type="password" id="createUserPassword" class="input" placeholder="Nhập mật khẩu..." required minlength="6">
                            </div>
                            <div class="form-field">
                                <label>Xác nhận mật khẩu *</label>
                                <input type="password" id="createUserConfirmPassword" class="input" placeholder="Xác nhận mật khẩu..." required minlength="6">
                            </div>
                            <div class="form-field">
                                <label>Giới tính</label>
                                <select id="createUserGender" class="select">
                                    <option value="">Chọn giới tính</option>
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                            <div class="form-field">
                                <label>Vai trò *</label>
                                <select id="createUserRole" class="select" required>
                                    <option value="USER">Người dùng</option>
                                    <option value="ADMIN">Quản trị viên</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn" id="cancelCreateUser">Hủy</button>
                        <button type="button" class="btn" id="saveCreateUser" style="background:#22c55e;color:#fff;border-color:#16a34a">Tạo người dùng</button>
                    </div>
                </div>
        `;
        document.body.appendChild(modal);
        console.log('Modal created and added to DOM');
        
        // Add event listeners to the newly created modal
        const closeBtn = modal.querySelector('#closeCreateUserModal');
        const cancelBtn = modal.querySelector('#cancelCreateUser');
        const saveBtn = modal.querySelector('#saveCreateUser');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', closeCreateUserModal);
            console.log('Close button event listener added');
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeCreateUserModal);
            console.log('Cancel button event listener added');
        }
        if (saveBtn) {
            saveBtn.addEventListener('click', createUser);
            console.log('Save button event listener added');
        }
        
        return modal;
    }

    // Create edit user modal dynamically if not exists
    function createEditUserModalIfNotExists() {
        // Always remove old modal if exists
        const oldModal = document.getElementById('editUserModal');
        if (oldModal) {
            console.log('Removing old edit user modal...');
            oldModal.remove();
        }
        
        console.log('Creating edit user modal dynamically...');
        
        const modal = document.createElement('div');
        modal.id = 'editUserModal';
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Chỉnh sửa thông tin người dùng</h3>
                        <button class="modal-close" id="closeEditUserModal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="editUserForm">
                            <div class="form-field">
                                <label>Họ và tên *</label>
                                <input type="text" id="editUserFullName" class="input" placeholder="Họ và tên của bạn..." required>
                            </div>
                            <div class="form-field">
                                <label>Email *</label>
                                <input type="email" id="editUserEmail" class="input" placeholder="Nhập email của bạn..." required>
                            </div>
                            <div class="form-field">
                                <label>Số điện thoại *</label>
                                <input type="tel" id="editUserPhone" class="input" placeholder="Nhập số điện thoại..." required>
                            </div>
                            <div class="form-field">
                                <label>Giới tính *</label>
                                <select id="editUserGender" class="select" required>
                                    <option value="">Chọn giới tính</option>
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                            <div class="form-field">
                                <label>Vai trò *</label>
                                <select id="editUserRole" class="select" required>
                                    <option value="USER">Người dùng</option>
                                    <option value="ADMIN">Quản trị viên</option>
                                </select>
                            </div>
                            <div class="form-field">
                                <label>Avatar URL</label>
                                <input type="url" id="editUserAvatar" class="input" placeholder="URL hình ảnh avatar...">
                            </div>
                            <div class="form-field">
                                <label>
                                    <input type="checkbox" id="editUserIsActive" style="margin-right: 8px;">
                                    Tài khoản hoạt động
                                </label>
                            </div>
                            <div class="form-field">
                                <label style="color: #6b7280; font-size: 0.875rem;">
                                    <strong>Lưu ý:</strong> Không thể chỉnh sửa tên đăng nhập và địa chỉ. 
                                    Sử dụng nút "Reset mật khẩu" để đặt lại mật khẩu về mặc định.
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn" id="resetPasswordBtn" style="background:#f59e0b;color:#fff;border-color:#d97706">Reset mật khẩu</button>
                        <button type="button" class="btn" id="cancelEditUser">Hủy</button>
                        <button type="button" class="btn" id="saveEditUser" style="background:#22c55e;color:#fff;border-color:#16a34a">Lưu thay đổi</button>
                    </div>
                </div>
        `;
        document.body.appendChild(modal);

        // Add event listeners
        const closeBtn = document.getElementById('closeEditUserModal');
        const cancelBtn = document.getElementById('cancelEditUser');
        const saveBtn = document.getElementById('saveEditUser');
        const resetBtn = document.getElementById('resetPasswordBtn');

        if (closeBtn) {
            closeBtn.addEventListener('click', closeEditUserModal);
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeEditUserModal);
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', saveEditedUser);
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const userId = document.getElementById('editUserForm').getAttribute('data-user-id');
                if (userId) {
                    if (confirm('Bạn có chắc chắn muốn reset mật khẩu của người dùng này về mặc định (1) không?')) {
                        resetUserPassword(userId);
                    }
                } else {
                    showNotification('Không tìm thấy ID người dùng', 'error');
                }
            });
        }
        
        return modal;
    }

    // Wait for DOM to be ready before setting up event listeners
    function setupCreateUserButton() {
        // Try multiple selectors to find the button
        const selectors = ['#createUserBtn', '#btnNewUser', 'button[class*="btn"][id*="create"]', 'button[class*="btn"][id*="user"]'];
        let button = null;
        
        for (const selector of selectors) {
            button = document.querySelector(selector);
            if (button) {
                console.log('Create user button found with selector:', selector, 'ID:', button.id);
                break;
            }
        }
        
        if (button) {
            console.log('Adding event listener to button:', button.id);
            button.addEventListener('click', (e) => {
                console.log('Direct event listener triggered for:', button.id);
                e.preventDefault();
                createUserModalIfNotExists();
                openCreateUserModal();
            });
            return true;
        } else {
            console.error('Create user button not found! Tried selectors:', selectors);
            return false;
        }
    }

    // Try to setup button immediately
    if (!setupCreateUserButton()) {
        // If not found, wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM loaded, trying to setup create user button again');
            setupCreateUserButton();
        });
        
        // Also try after a delay as fallback
        setTimeout(() => {
            console.log('Timeout reached, trying to setup create user button again');
            setupCreateUserButton();
        }, 2000);
    }

    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'createUserModal') {
            closeCreateUserModal();
        }
    });

    // Add global event listener for modal close when clicking outside
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('createUserModal');
        if (modal && modal.style.display === 'flex' && e.target === modal) {
            closeCreateUserModal();
        }
    });

    // Initialize modal on page load
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing create user modal');
        createUserModalIfNotExists();
    });
    
    // Also try immediately
    createUserModalIfNotExists();
    
    // Try again after a delay to ensure everything is loaded
    setTimeout(() => {
        console.log('Delayed initialization of create user modal');
        createUserModalIfNotExists();
    }, 1000);
    
    // Make sure modal is available globally
    window.createUserModalIfNotExists = createUserModalIfNotExists;
    window.openCreateUserModal = openCreateUserModal;
    window.closeCreateUserModal = closeCreateUserModal;
    window.createUser = createUser;
    window.setupCreateUserButton = setupCreateUserButton;

    // Make edit user functions global
    window.createEditUserModalIfNotExists = createEditUserModalIfNotExists;
    window.openEditUserModal = openEditUserModal;
    window.closeEditUserModal = closeEditUserModal;
    window.saveEditedUser = saveEditedUser;
    window.resetUserPassword = resetUserPassword;

    // ====== AUDIT LOG FUNCTIONS ======

    // Load audit logs from API
    async function loadAuditLogs(page = 1, limit = 20, filters = {}) {
        try {
            showAuditLoading();
            
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...filters
            });

            const response = await window.apiService.get(`/audit?${queryParams}`);
            
            if (response?.success && response.data) {
                auditLogs = response.data.data || [];
                const pagination = response.data.pagination || {};
                
                renderAuditLogs(auditLogs);
                renderAuditPagination(pagination);
                
                currentAuditPage = page;
                currentAuditLimit = limit;
                currentAuditFilters = filters;
            } else {
                showAuditEmptyState('Không thể tải dữ liệu audit log');
            }
        } catch (error) {
            console.error('Error loading audit logs:', error);
            showAuditEmptyState('Lỗi khi tải dữ liệu audit log');
        }
    }

    // Load audit stats
    async function loadAuditStats() {
        try {
            const response = await window.apiService.get('/audit/stats');
            
            if (response?.success && response.data) {
                auditStats = response.data;
                renderAuditStats(auditStats);
            }
        } catch (error) {
            console.error('Error loading audit stats:', error);
        }
    }

    // Render audit logs
    function renderAuditLogs(logs) {
        const container = document.getElementById('auditLogsContainer');
        if (!container) return;

        if (!logs || logs.length === 0) {
            showAuditEmptyState('Không có dữ liệu audit log');
            return;
        }

        container.innerHTML = logs.map(log => `
            <div class="audit-log-item" onclick="showAuditLogDetails('${log.id}')">
                <div class="audit-log-icon ${getActionIconClass(log.action)}">
                    <i class="fa-solid ${getActionIcon(log.action)}"></i>
                </div>
                <div class="audit-log-content">
                    <div class="audit-log-header">
                        <span class="audit-log-action">${getActionText(log.action)}</span>
                        <span class="audit-log-resource">${log.resource}</span>
                    </div>
                    <div class="audit-log-user">
                        <i class="fa-solid fa-user"></i> ${log.user?.fullName || log.user?.username || 'Unknown User'}
                        ${log.user?.role ? `<span class="user-role ${log.user.role}">${log.user.role}</span>` : ''}
                    </div>
                    <div class="audit-log-details">
                        ${log.details ? JSON.stringify(log.details).substring(0, 100) + '...' : 'Không có chi tiết'}
                    </div>
                </div>
                <div class="audit-log-meta">
                    <div class="audit-log-time">${formatDateTime(log.timestamp)}</div>
                    ${log.ipAddress ? `<div class="audit-log-ip">${log.ipAddress}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    // Render audit stats
    function renderAuditStats(stats) {
        document.getElementById('totalAuditLogs').textContent = stats.totalLogs || 0;
        document.getElementById('todayAuditLogs').textContent = stats.todayLogs || 0;
        document.getElementById('topAction').textContent = stats.actionStats?.[0]?.action || '-';
        document.getElementById('topResource').textContent = stats.resourceStats?.[0]?.resource || '-';
    }

    // Render pagination
    function renderAuditPagination(pagination) {
        const container = document.getElementById('auditPagination');
        if (!container) return;

        const { page, totalPages, total } = pagination;
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-btn" ${page <= 1 ? 'disabled' : ''} 
                    onclick="changeAuditPage(${page - 1})">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(totalPages, page + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === page ? 'active' : ''}" 
                        onclick="changeAuditPage(${i})">
                    ${i}
                </button>
            `;
        }

        // Next button
        paginationHTML += `
            <button class="pagination-btn" ${page >= totalPages ? 'disabled' : ''} 
                    onclick="changeAuditPage(${page + 1})">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        `;

        // Info
        paginationHTML += `
            <div class="pagination-info">
                Trang ${page} / ${totalPages} (${total} mục)
            </div>
        `;

        container.innerHTML = paginationHTML;
    }

    // Show audit log details modal
    async function showAuditLogDetails(logId) {
        try {
            const response = await window.apiService.get(`/audit/${logId}`);
            
            if (response?.success && response.data) {
                const log = response.data;
                const modal = document.getElementById('auditLogDetailsModal');
                const content = document.getElementById('auditLogDetailsContent');
                
                content.innerHTML = `
                    <div class="audit-log-details-content">
                        <div class="audit-detail-group">
                            <div class="audit-detail-label">Hành động</div>
                            <div class="audit-detail-value">${getActionText(log.action)}</div>
                        </div>
                        <div class="audit-detail-group">
                            <div class="audit-detail-label">Tài nguyên</div>
                            <div class="audit-detail-value">${log.resource}</div>
                        </div>
                        <div class="audit-detail-group">
                            <div class="audit-detail-label">ID Tài nguyên</div>
                            <div class="audit-detail-value">${log.resourceId || 'N/A'}</div>
                        </div>
                        <div class="audit-detail-group">
                            <div class="audit-detail-label">Người thực hiện</div>
                            <div class="audit-detail-value">
                                ${log.user?.fullName || log.user?.username || 'Unknown User'}
                                ${log.user?.email ? `(${log.user.email})` : ''}
                                ${log.user?.role ? ` - ${log.user.role}` : ''}
                            </div>
                        </div>
                        <div class="audit-detail-group">
                            <div class="audit-detail-label">Thời gian</div>
                            <div class="audit-detail-value">${formatDateTime(log.timestamp)}</div>
                        </div>
                        ${log.ipAddress ? `
                        <div class="audit-detail-group">
                            <div class="audit-detail-label">IP Address</div>
                            <div class="audit-detail-value">${log.ipAddress}</div>
                        </div>
                        ` : ''}
                        ${log.userAgent ? `
                        <div class="audit-detail-group">
                            <div class="audit-detail-label">User Agent</div>
                            <div class="audit-detail-value">${log.userAgent}</div>
                        </div>
                        ` : ''}
                        ${log.details ? `
                        <div class="audit-detail-group">
                            <div class="audit-detail-label">Chi tiết</div>
                            <div class="audit-detail-value json">${JSON.stringify(log.details, null, 2)}</div>
                        </div>
                        ` : ''}
                    </div>
                `;
                
                modal.style.display = 'flex';
            }
        } catch (error) {
            console.error('Error loading audit log details:', error);
            showNotification('Lỗi khi tải chi tiết audit log', 'error');
        }
    }

    // Helper functions
    function getActionIcon(action) {
        const icons = {
            'CREATE': 'fa-plus',
            'UPDATE': 'fa-edit',
            'DELETE': 'fa-trash',
            'LOGIN': 'fa-sign-in-alt',
            'LOGOUT': 'fa-sign-out-alt',
            'VIEW': 'fa-eye'
        };
        return icons[action] || 'fa-circle';
    }

    function getActionIconClass(action) {
        const classes = {
            'CREATE': 'create',
            'UPDATE': 'update',
            'DELETE': 'delete',
            'LOGIN': 'login',
            'LOGOUT': 'logout',
            'VIEW': 'view'
        };
        return classes[action] || 'view';
    }

    function getActionText(action) {
        const texts = {
            'CREATE': 'Tạo mới',
            'UPDATE': 'Cập nhật',
            'DELETE': 'Xóa',
            'LOGIN': 'Đăng nhập',
            'LOGOUT': 'Đăng xuất',
            'VIEW': 'Xem'
        };
        return texts[action] || action;
    }

    function formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    function showAuditLoading() {
        const container = document.getElementById('auditLogsContainer');
        if (container) {
            container.innerHTML = `
                <div class="audit-loading">
                    <div class="audit-spinner"></div>
                </div>
            `;
        }
    }

    function showAuditEmptyState(message) {
        const container = document.getElementById('auditLogsContainer');
        if (container) {
            container.innerHTML = `
                <div class="audit-empty-state">
                    <i class="fa-solid fa-clipboard-list"></i>
                    <div>${message}</div>
                </div>
            `;
        }
    }

    // Event handlers
    function changeAuditPage(page) {
        if (page < 1) return;
        loadAuditLogs(page, currentAuditLimit, currentAuditFilters);
    }

    function applyAuditFilters() {
        const filters = {
            userId: document.getElementById('auditUserFilter')?.value || '',
            action: document.getElementById('auditActionFilter')?.value || '',
            resource: document.getElementById('auditResourceFilter')?.value || '',
            search: document.getElementById('auditSearchInput')?.value || '',
            startDate: document.getElementById('auditStartDate')?.value || '',
            endDate: document.getElementById('auditEndDate')?.value || ''
        };

        // Remove empty filters
        Object.keys(filters).forEach(key => {
            if (!filters[key]) delete filters[key];
        });

        loadAuditLogs(1, currentAuditLimit, filters);
    }

    function resetAuditFilters() {
        document.getElementById('auditUserFilter').value = '';
        document.getElementById('auditActionFilter').value = '';
        document.getElementById('auditResourceFilter').value = '';
        document.getElementById('auditSearchInput').value = '';
        document.getElementById('auditStartDate').value = '';
        document.getElementById('auditEndDate').value = '';
        loadAuditLogs(1, currentAuditLimit, {});
    }

    // Setup audit log event listeners
    function setupAuditLogEventListeners() {
        // Apply filters button
        const applyBtn = document.getElementById('applyAuditFilters');
        if (applyBtn) {
            applyBtn.addEventListener('click', applyAuditFilters);
        }

        // Reset filters button
        const resetBtn = document.getElementById('resetAuditFilters');
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                resetAuditFilters();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshAuditLogs');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                loadAuditLogs(currentAuditPage, currentAuditLimit, currentAuditFilters);
                loadAuditStats();
            });
        }

        // Limit select
        const limitSelect = document.getElementById('auditLimitSelect');
        if (limitSelect) {
            limitSelect.addEventListener('change', (e) => {
                currentAuditLimit = parseInt(e.target.value);
                loadAuditLogs(1, currentAuditLimit, currentAuditFilters);
            });
        }

        // Close details modal
        const closeModalBtn = document.getElementById('closeAuditDetailsModal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                document.getElementById('auditLogDetailsModal').style.display = 'none';
            });
        }

        // Close modal when clicking outside
        const modal = document.getElementById('auditLogDetailsModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }

    // Load users for filter dropdown
    async function loadUsersForAuditFilter() {
        try {
            const response = await window.apiService.get('/users');
            if (response?.success && response.data) {
                const users = response.data.data || response.data || [];
                const select = document.getElementById('auditUserFilter');
                if (select) {
                    select.innerHTML = '<option value="">Tất cả người dùng</option>' +
                        users.map(user => `<option value="${user.id}">${user.fullName || user.username} (${user.role})</option>`).join('');
                }
            }
        } catch (error) {
            console.error('Error loading users for audit filter:', error);
        }
    }

    // Initialize audit log when audit view is shown
    function initializeAuditLog() {
        loadAuditStats();
        loadAuditLogs(1, currentAuditLimit, {});
        loadUsersForAuditFilter();
        setupAuditLogEventListeners();
    }

    // Make audit log functions global
    window.showAuditLogDetails = showAuditLogDetails;
    window.changeAuditPage = changeAuditPage;
    window.applyAuditFilters = applyAuditFilters;
    window.resetAuditFilters = resetAuditFilters;
    window.initializeAuditLog = initializeAuditLog;

    // Make functions global
    window.addProduct = addProduct;
    window.editProduct = editProduct;
    window.deleteProduct = deleteProduct;
    window.selectUser = selectUser;
    window.editUser = editUser;
    window.toggleUserStatus = toggleUserStatus;
    window.deleteUser = deleteUser;
});