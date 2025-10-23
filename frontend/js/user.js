// User API Integration
class UserAPI {
    constructor() {
        this.apiService = window.apiService || new ApiService();
    }

    // Get user profile
    async getProfile() {
        return await this.apiService.get('/users/profile');
    }

    // Update user profile
    async updateProfile(data) {
        return await this.apiService.patch('/users/profile', data);
    }

    // Get user orders
    async getOrders() {
        return await this.apiService.get('/orders/user');
    }

    // Change password
    async changePassword(data) {
        return await this.apiService.post('/auth/change-password', data);
    }

    // Get notifications
    async getNotifications() {
        return await this.apiService.get('/notifications/user');
    }

    // Get province name by code
    async getProvinceName(code) {
        try {
            const response = await this.apiService.get(`/locations/provinces?search=${code}&limit=1`);
            if (response.success && response.data.length > 0) {
                return response.data[0].name_with_type || response.data[0].name;
            }
        } catch (error) {
            console.error('Error getting province name:', error);
        }
        return code; // fallback to code if not found
    }

    // Get ward name by code and province code
    async getWardName(wardCode, provinceCode) {
        try {
            const response = await this.apiService.get(`/locations/wards/${provinceCode}?search=${wardCode}&limit=1`);
            if (response.success && response.data.length > 0) {
                return response.data[0].name_with_type || response.data[0].name;
            }
        } catch (error) {
            console.error('Error getting ward name:', error);
        }
        return wardCode; // fallback to code if not found
    }
}

// Initialize user API
const userAPI = new UserAPI();

// Check authentication and redirect if needed
function checkAuth() {
    let token = null;
    
    // Use AuthContextManager if available
    if (typeof window !== 'undefined' && window.authContextManager) {
        token = window.authContextManager.getCurrentToken();
    } else {
        // Fallback to legacy logic
        token = localStorage.getItem('user_token') || localStorage.getItem('admin_token') || 
                localStorage.getItem('token') || localStorage.getItem('accessToken');
    }
    
    if (!token) {
        // Clear all authentication data and refresh
        // Use AuthContextManager if available
        if (typeof window !== 'undefined' && window.authContextManager) {
            window.authContextManager.clearAllContexts();
        } else {
            // Fallback: clear all authentication data
            ['accessToken','refreshToken','token','user','user_token','user_data','admin_token','admin_data'].forEach(k=>{
              localStorage.removeItem(k); 
              sessionStorage.removeItem(k);
            });
        }
        window.location.reload();
        return false;
    }
    return true;
}

// Note: generateInitials and updateHeaderUserInfo are now provided by header-avatar.js

// Load user profile data
async function loadUserProfile() {
    try {
        const response = await userAPI.getProfile();
        if (response.success) {
            const user = response.data;
            await updateProfileUI(user);
        } else {
            console.error('Failed to load profile:', response.message);
            showModal('Lỗi', 'Không thể tải thông tin người dùng. Vui lòng thử lại.', null, null);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showModal('Lỗi', 'Có lỗi xảy ra khi tải thông tin người dùng.', null, null);
    }
}

// Update profile UI with user data
async function updateProfileUI(user) {
    // Update form fields
    if (user.fullName) {
        const fullNameInput = document.getElementById('fullName');
        const displayName = document.getElementById('displayName');
        const userName = document.querySelector('.user-name');
        
        if (fullNameInput) fullNameInput.value = user.fullName;
        if (displayName) displayName.textContent = user.fullName;
        if (userName) userName.textContent = user.fullName;
    }
    
    if (user.email) {
        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.value = user.email;
    }
    
    if (user.phone) {
        const phoneInput = document.getElementById('phoneNumber');
        if (phoneInput) phoneInput.value = user.phone;
    }
    
    if (user.fullAddress) {
        const addressInput = document.getElementById('address');
        if (addressInput) addressInput.value = user.fullAddress;
    }
    
    // Update avatar from database - clear cache first to prevent showing old avatar
    localStorage.removeItem('profileAvatar');
    
    if (user.avt_img && user.avt_img.trim() !== '') {
        // Store in localStorage for consistency
        localStorage.setItem('profileAvatar', user.avt_img);
        // Apply avatar data
        if (typeof applyAvatarData === 'function') {
            applyAvatarData(user.avt_img);
        }
        // Show remove button
        const removeAvatarBtn = document.getElementById('removeAvatarBtn');
        if (removeAvatarBtn) {
            removeAvatarBtn.style.display = 'inline-block';
        }
    } else {
        // No avatar in database, ensure initials are shown
        if (typeof applyAvatarData === 'function') {
            applyAvatarData(null);
        }
        // Hide remove button
        const removeAvatarBtn = document.getElementById('removeAvatarBtn');
        if (removeAvatarBtn) {
            removeAvatarBtn.style.display = 'none';
        }
    }
    
    // Update address data for search dropdowns
    if (user.province || user.provinceName) {
        // Get province name if not already available
        let provinceName = user.provinceName;
        if (!provinceName && user.province) {
            provinceName = await userAPI.getProvinceName(user.province);
        }
        
        // Set province data for search dropdown
        if (window.selectedProvince) {
            // Update existing selected province
            window.selectedProvince = {
                code: user.province,
                name: provinceName || user.province,
                name_with_type: provinceName || user.province
            };
        } else {
            // Create new province data
            window.selectedProvince = {
                code: user.province,
                name: provinceName || user.province,
                name_with_type: provinceName || user.province
            };
        }
        
        // Update province dropdown display
        const provinceDropdown = window.provinceDropdown;
        if (provinceDropdown) {
            provinceDropdown.setValue(provinceName || user.province);
        }
    }
    
    if (user.ward || user.wardName) {
        // Get ward name if not already available
        let wardName = user.wardName;
        if (!wardName && user.ward && user.province) {
            wardName = await userAPI.getWardName(user.ward, user.province);
        }
        
        // Set ward data for search dropdown
        if (window.selectedWard) {
            // Update existing selected ward
            window.selectedWard = {
                code: user.ward,
                id: user.ward,
                name: wardName || user.ward,
                name_with_type: wardName || user.ward
            };
        } else {
            // Create new ward data
            window.selectedWard = {
                code: user.ward,
                id: user.ward,
                name: wardName || user.ward,
                name_with_type: wardName || user.ward
            };
        }
        
        // Update ward dropdown display
        const wardDropdown = window.wardDropdown;
        if (wardDropdown) {
            wardDropdown.setValue(wardName || user.ward);
        }
    }
    
    if (user.street) {
        const streetInput = document.getElementById('addressStreet');
        if (streetInput) streetInput.value = user.street;
    }
    
    if (user.gender) {
        const genderSelect = document.getElementById('gender');
        if (genderSelect) genderSelect.value = user.gender;
    }
    
    // Update additional info
    if (user.createdAt) {
        const joinDate = new Date(user.createdAt).toLocaleDateString('vi-VN');
        const joinDateElement = document.getElementById('joinDate');
        if (joinDateElement) joinDateElement.textContent = joinDate;
    }
    
    // Update user role
    if (user.role) {
        const userRoleElement = document.getElementById('userRole');
        if (userRoleElement) userRoleElement.textContent = user.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng';
    }
    
    // Update account status (mock data for now)
    const accountStatusElement = document.getElementById('accountStatus');
    if (accountStatusElement) accountStatusElement.textContent = 'Vàng';
    
    // Update header user info
    updateHeaderUserInfo(user);
    
    // Update avatar initials
    if (window.updateAvatarInitials) {
      window.updateAvatarInitials();
    }
}

// ========================================
// USER ORDERS MANAGEMENT - NEW SYSTEM
// ========================================

// Orders state management
const userOrdersState = {
    allOrders: [],
    filteredOrders: [],
    filters: {
        status: '',
        search: '',
        dateFrom: '',
        dateTo: ''
    },
    currentOrderForReturn: null,
    autoRefreshInterval: null
};

// Initialize orders system
async function initUserOrdersSystem() {
    console.log('🚀 Initializing User Orders System...');
    
    // Load orders
    await loadUserOrders();
    
    // Setup event listeners
    setupOrderEventListeners();
    
    // Setup auto-refresh (every 30 seconds)
    if (userOrdersState.autoRefreshInterval) {
        clearInterval(userOrdersState.autoRefreshInterval);
    }
    userOrdersState.autoRefreshInterval = setInterval(() => {
        console.log('🔄 Auto-refreshing orders...');
        loadUserOrders();
    }, 30000);
    
    console.log('✅ User Orders System initialized');
}

// Load user orders
async function loadUserOrders() {
    try {
        console.log('📥 Loading user orders...');
        
        // Check token before calling API
        const token = localStorage.getItem('user_token') || localStorage.getItem('token');
        console.log('🔐 Token exists:', !!token);
        
        const response = await userAPI.getOrders();
        
        console.log('🔍 API Response:', response);
        console.log('🔍 response.success:', response?.success);
        console.log('🔍 response.data:', response?.data);
        console.log('🔍 Is array?:', Array.isArray(response?.data));
        
        if (response && response.success && response.data) {
            // Handle if data is array directly or nested
            let orders = [];
            if (Array.isArray(response.data)) {
                orders = response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                // Handle nested response
                orders = response.data.data;
            }
            
            userOrdersState.allOrders = orders;
            console.log(`✅ Loaded ${userOrdersState.allOrders.length} orders`);
            
            // Apply filters
            applyOrderFilters();
            
            // Update stats
            updateOrderStats();
            
            // Update profile stats
            updateProfileOrderStats(orders);
        } else {
            console.error('❌ Failed to load orders:', response?.message);
            showOrdersEmpty('Không thể tải đơn hàng');
        }
    } catch (error) {
        console.error('❌ Error loading orders:', error);
        showOrdersEmpty('Lỗi khi tải đơn hàng');
    }
}

// Apply filters
function applyOrderFilters() {
    let filtered = [...userOrdersState.allOrders];
    
    // Filter by status
    if (userOrdersState.filters.status) {
        filtered = filtered.filter(o => o.status === userOrdersState.filters.status);
    }
    
    // Filter by search
    if (userOrdersState.filters.search) {
        const search = userOrdersState.filters.search.toLowerCase();
        filtered = filtered.filter(o => 
            (o.code && o.code.toLowerCase().includes(search)) ||
            (o.items && o.items.some(item => 
                item.product && item.product.name && item.product.name.toLowerCase().includes(search)
            ))
        );
    }
    
    // Filter by date range
    if (userOrdersState.filters.dateFrom) {
        const fromDate = new Date(userOrdersState.filters.dateFrom);
        filtered = filtered.filter(o => new Date(o.createdAt) >= fromDate);
    }
    
    if (userOrdersState.filters.dateTo) {
        const toDate = new Date(userOrdersState.filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(o => new Date(o.createdAt) <= toDate);
    }
    
    userOrdersState.filteredOrders = filtered;
    renderOrders();
}

// Update order stats
function updateOrderStats() {
    const orders = userOrdersState.allOrders;
    
    // Count by status
    const counts = {
        'all': orders.length,
        'PENDING': 0,
        'SHIPPING': 0,
        'COMPLETED': 0,
        'CANCELLED': 0,
        'RETURNED': 0
    };
    
    orders.forEach(order => {
        if (counts.hasOwnProperty(order.status)) {
            counts[order.status]++;
        }
    });
    
    // Update UI
    const statAll = document.getElementById('statAll');
    const statPending = document.getElementById('statPending');
    const statShipping = document.getElementById('statShipping');
    const statCompleted = document.getElementById('statCompleted');
    const statCancelled = document.getElementById('statCancelled');
    const statReturned = document.getElementById('statReturned');
    
    if (statAll) statAll.textContent = counts.all;
    if (statPending) statPending.textContent = counts.PENDING;
    if (statShipping) statShipping.textContent = counts.SHIPPING;
    if (statCompleted) statCompleted.textContent = counts.COMPLETED;
    if (statCancelled) statCancelled.textContent = counts.CANCELLED;
    if (statReturned) statReturned.textContent = counts.RETURNED;
}

// Update profile order stats (for sidebar)
function updateProfileOrderStats(orders) {
    const totalOrders = orders.length;
    const totalOrdersEl = document.getElementById('totalOrders');
    if (totalOrdersEl) {
        totalOrdersEl.textContent = `${totalOrders} đơn`;
    }
    
    // Calculate loyalty points
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const loyaltyPoints = Math.floor(totalSpent / 1000);
    const loyaltyPointsEl = document.getElementById('loyaltyPoints');
    if (loyaltyPointsEl) {
        loyaltyPointsEl.textContent = `${loyaltyPoints.toLocaleString()} điểm`;
    }
}

// Render orders list
function renderOrders() {
    const container = document.getElementById('ordersListUser');
    if (!container) return;
    
    if (userOrdersState.filteredOrders.length === 0) {
        showOrdersEmpty('Không tìm thấy đơn hàng');
        return;
    }
    
    // Sort by date (newest first)
    const sorted = [...userOrdersState.filteredOrders].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    // Build HTML
    const html = sorted.map(order => createOrderCardHTML(order)).join('');
    container.innerHTML = html;
    
    // Attach event listeners
    attachOrderCardListeners();
}

// Create order card HTML
function createOrderCardHTML(order) {
    const statusBadge = getOrderStatusBadge(order.status);
    const total = Number(order.totalAmount || 0);
    const date = formatOrderDate(order.createdAt);
    
    // Build products HTML
    const productsHTML = (order.items || []).map(item => {
        const product = item.product || {};
        const image = getProductImage(product);
        const name = product.name || 'Sản phẩm';
        const price = Number(item.price || product.price || 0);
        const qty = Number(item.quantity || 0);
        
        return `
            <div class="order-product-item">
                <img src="${image}" alt="${name}" class="order-product-image" onerror="this.src='/assets/Icon MatFlow.png'">
                <div class="order-product-info">
                    <div class="order-product-name">${name}</div>
                    <div class="order-product-price">${formatVND(price)}</div>
                    <div class="order-product-quantity">Số lượng: ${qty}</div>
        </div>
            </div>
        `;
    }).join('');
    
    // Build action buttons based on status
    const actionsHTML = getOrderActionButtons(order);
    
    return `
        <div class="order-card-user" data-order-id="${order.id}">
            <div class="order-header">
                <div>
                    <div class="order-code">${order.code || order.id}</div>
                    <div class="order-date">
                        <i class="fa-solid fa-clock"></i> ${date}
                    </div>
                </div>
                ${statusBadge}
            </div>
            <div class="order-body">
                <div class="order-product-list">
                    ${productsHTML}
                </div>
            </div>
            <div class="order-footer">
                <div class="order-total">
                    <div class="order-total-label">Tổng tiền</div>
                    <div class="order-total-amount">${formatVND(total)}</div>
        </div>
        <div class="order-actions">
                    ${actionsHTML}
                </div>
            </div>
        </div>
    `;
}

// Get product image
function getProductImage(product) {
    if (!product || !product.images || product.images.length === 0) {
        return '/assets/Icon MatFlow.png';
    }
    
    const imageUrl = product.images[0].url;
    
    // Handle base64
    if (imageUrl.startsWith('data:image')) {
        return imageUrl;
    }
    
    // Handle full URL
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }
    
    // Handle relative path
    if (typeof CONFIG !== 'undefined' && CONFIG.getAssetUrl) {
        return CONFIG.getAssetUrl(imageUrl);
    }
    
    return `/assets/vat_tu/${imageUrl}`;
}

// Get order status badge
function getOrderStatusBadge(status) {
    const statusMap = {
        'PENDING': { text: 'Chờ xác nhận', class: 'pending' },
        'CONFIRMED': { text: 'Đã xác nhận', class: 'confirmed' },
        'SHIPPING': { text: 'Đang giao', class: 'shipping' },
        'COMPLETED': { text: 'Hoàn thành', class: 'completed' },
        'CANCELLED': { text: 'Đã hủy', class: 'cancelled' },
        'RETURNED': { text: 'Đã hoàn trả', class: 'returned' }
    };
    
    const info = statusMap[status] || { text: status, class: 'pending' };
    return `<span class="order-status-badge ${info.class}">${info.text}</span>`;
}

// Get order action buttons
function getOrderActionButtons(order) {
    let buttons = [];
    
    // View detail (always show)
    buttons.push(`
        <button class="btn-secondary btn-view-order" data-order-id="${order.id}">
            <i class="fa-solid fa-eye"></i> Chi tiết
        </button>
    `);
    
    // Cancel button (PENDING or CONFIRMED)
    if (order.status === 'PENDING' || order.status === 'CONFIRMED') {
        buttons.push(`
            <button class="btn-danger btn-cancel-order" data-order-id="${order.id}">
                <i class="fa-solid fa-times"></i> Hủy đơn
            </button>
        `);
    }
    
    // Received button (SHIPPING)
    if (order.status === 'SHIPPING') {
        buttons.push(`
            <button class="btn-success btn-received-order" data-order-id="${order.id}">
                <i class="fa-solid fa-check"></i> Đã nhận hàng
            </button>
        `);
    }
    
    // Return button (COMPLETED)
    if (order.status === 'COMPLETED') {
        buttons.push(`
            <button class="btn-danger btn-return-order" data-order-id="${order.id}">
                <i class="fa-solid fa-undo"></i> Hoàn trả
            </button>
        `);
    }
    
    return buttons.join('');
}

// Format date
function formatOrderDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format VND
function formatVND(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Show empty state
function showOrdersEmpty(message) {
    const container = document.getElementById('ordersListUser');
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state">
            <i class="fa-solid fa-box-open"></i>
            <h3>Không có đơn hàng</h3>
            <p>${message || 'Bạn chưa có đơn hàng nào'}</p>
        </div>
    `;
}

// Attach event listeners to order cards
function attachOrderCardListeners() {
    // View order detail
    document.querySelectorAll('.btn-view-order').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const orderId = btn.dataset.orderId;
            handleViewOrderDetail(orderId);
        });
    });
    
    // Cancel order
    document.querySelectorAll('.btn-cancel-order').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const orderId = btn.dataset.orderId;
            handleCancelOrder(orderId);
        });
    });
    
    // Mark as received
    document.querySelectorAll('.btn-received-order').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const orderId = btn.dataset.orderId;
            handleMarkReceived(orderId);
        });
    });
    
    // Request return
    document.querySelectorAll('.btn-return-order').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const orderId = btn.dataset.orderId;
            handleReturnRequest(orderId);
        });
    });
}

// Setup event listeners
function setupOrderEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refreshOrdersBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải...';
            await loadUserOrders();
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Làm mới';
        });
    }
    
    // Search input
    const searchInput = document.getElementById('orderSearchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                userOrdersState.filters.search = e.target.value;
                applyOrderFilters();
            }, 300);
        });
    }
    
    // Status filter
    const statusFilter = document.getElementById('orderStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            userOrdersState.filters.status = e.target.value;
            applyOrderFilters();
        });
    }
    
    // Date filters
    const dateFrom = document.getElementById('orderDateFrom');
    if (dateFrom) {
        dateFrom.addEventListener('change', (e) => {
            userOrdersState.filters.dateFrom = e.target.value;
            applyOrderFilters();
        });
    }
    
    const dateTo = document.getElementById('orderDateTo');
    if (dateTo) {
        dateTo.addEventListener('change', (e) => {
            userOrdersState.filters.dateTo = e.target.value;
            applyOrderFilters();
        });
    }
    
    // Stat cards click to filter
    document.querySelectorAll('.stat-card').forEach(card => {
        card.addEventListener('click', () => {
            const filter = card.dataset.filter;
            
            // Remove active from all
            document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('active'));
            
            // Add active to clicked
            card.classList.add('active');
            
            // Update filter
            if (filter === 'all') {
                userOrdersState.filters.status = '';
                if (statusFilter) statusFilter.value = '';
            } else {
                userOrdersState.filters.status = filter;
                if (statusFilter) statusFilter.value = filter;
            }
            
            applyOrderFilters();
        });
    });
    
    // Modal close buttons
    const closeOrderDetail = document.getElementById('closeOrderDetailUser');
    if (closeOrderDetail) {
        closeOrderDetail.addEventListener('click', () => {
            closeOrderDetailModal();
        });
    }
    
    const closeReturnModal = document.getElementById('closeReturnRequestModal');
    if (closeReturnModal) {
        closeReturnModal.addEventListener('click', () => {
            closeReturnRequestModal();
        });
    }
    
    const cancelReturnBtn = document.getElementById('cancelReturnRequest');
    if (cancelReturnBtn) {
        cancelReturnBtn.addEventListener('click', () => {
            closeReturnRequestModal();
        });
    }
    
    const confirmReturnBtn = document.getElementById('confirmReturnRequest');
    if (confirmReturnBtn) {
        confirmReturnBtn.addEventListener('click', () => {
            submitReturnRequest();
        });
    }
}

// Handle view order detail
async function handleViewOrderDetail(orderId) {
    const order = userOrdersState.allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const modal = document.getElementById('orderDetailModalUser');
    const modalBody = document.getElementById('orderDetailBodyUser');
    if (!modal || !modalBody) return;
    
    // Build modal content
    const statusBadge = getOrderStatusBadge(order.status);
    const total = Number(order.totalAmount || 0);
    const date = formatOrderDate(order.createdAt);
    
    // Build products list
    const productsHTML = (order.items || []).map(item => {
        const product = item.product || {};
        const image = getProductImage(product);
        const name = product.name || 'Sản phẩm';
        const price = Number(item.price || product.price || 0);
        const qty = Number(item.quantity || 0);
        const subtotal = price * qty;
        
        return `
            <div class="order-product-item" style="margin-bottom: 12px;">
                <img src="${image}" alt="${name}" class="order-product-image" onerror="this.src='/assets/Icon MatFlow.png'">
                <div class="order-product-info">
                    <div class="order-product-name">${name}</div>
                    <div class="order-product-price">${formatVND(price)} × ${qty}</div>
                </div>
                <div style="font-weight: 600; color: var(--primary-color);">
                    ${formatVND(subtotal)}
                </div>
            </div>
        `;
    }).join('');
    
    // Build action buttons
    const actionsHTML = getOrderActionButtons(order);
    
    modalBody.innerHTML = `
        <div class="order-detail-grid">
            <div class="order-detail-section">
                <h4><i class="fa-solid fa-receipt"></i> Thông tin đơn hàng</h4>
                <div class="order-detail-row">
                    <span class="order-detail-label">Mã đơn:</span>
                    <span class="order-detail-value">${order.code || order.id}</span>
                </div>
                <div class="order-detail-row">
                    <span class="order-detail-label">Trạng thái:</span>
                    <span class="order-detail-value">${statusBadge}</span>
                </div>
                <div class="order-detail-row">
                    <span class="order-detail-label">Ngày đặt:</span>
                    <span class="order-detail-value">${date}</span>
                </div>
                <div class="order-detail-row">
                    <span class="order-detail-label">Tổng tiền:</span>
                    <span class="order-detail-value" style="color: var(--primary-color); font-weight: 700; font-size: 1.125rem;">
                        ${formatVND(total)}
                    </span>
                </div>
            </div>
            
            <div class="order-detail-section">
                <h4><i class="fa-solid fa-info-circle"></i> Trạng thái đơn hàng</h4>
                <div style="padding: 12px; background: white; border-radius: 8px;">
                    ${getOrderStatusDescription(order.status)}
                </div>
            </div>
        </div>
        
        <div class="order-detail-section" style="margin-bottom: 24px;">
            <h4><i class="fa-solid fa-box"></i> Sản phẩm đã đặt (${order.items?.length || 0})</h4>
            ${productsHTML}
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 8px; padding-top: 16px; border-top: 1px solid var(--border-light);">
            ${actionsHTML}
        </div>
    `;
    
    // Show modal
    modal.style.display = 'flex';
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Re-attach listeners for buttons in modal
    setTimeout(() => attachOrderCardListeners(), 100);
}

// Get order status description
function getOrderStatusDescription(status) {
    const descriptions = {
        'PENDING': `
            <div style="color: #f59e0b;">
                <i class="fa-solid fa-clock"></i>
                <strong>Chờ xác nhận</strong>
                <p style="margin: 8px 0 0 0; font-size: 0.875rem; color: #64748b;">
                    Đơn hàng đang chờ được xác nhận. Bạn có thể hủy đơn hàng tại thời điểm này.
                </p>
            </div>
        `,
        'CONFIRMED': `
            <div style="color: #10b981;">
                <i class="fa-solid fa-check"></i>
                <strong>Đã xác nhận</strong>
                <p style="margin: 8px 0 0 0; font-size: 0.875rem; color: #64748b;">
                    Đơn hàng đã được xác nhận và đang chuẩn bị giao.
                </p>
            </div>
        `,
        'SHIPPING': `
            <div style="color: #3b82f6;">
                <i class="fa-solid fa-truck-fast"></i>
                <strong>Đang giao hàng</strong>
                <p style="margin: 8px 0 0 0; font-size: 0.875rem; color: #64748b;">
                    Đơn hàng đang được vận chuyển. Vui lòng xác nhận khi đã nhận hàng.
                </p>
            </div>
        `,
        'COMPLETED': `
            <div style="color: #22c55e;">
                <i class="fa-solid fa-check-circle"></i>
                <strong>Hoàn thành</strong>
                <p style="margin: 8px 0 0 0; font-size: 0.875rem; color: #64748b;">
                    Đơn hàng đã hoàn thành. Cảm ơn bạn đã mua hàng!
                </p>
            </div>
        `,
        'CANCELLED': `
            <div style="color: #ef4444;">
                <i class="fa-solid fa-times-circle"></i>
                <strong>Đã hủy</strong>
                <p style="margin: 8px 0 0 0; font-size: 0.875rem; color: #64748b;">
                    Đơn hàng đã bị hủy.
                </p>
            </div>
        `
    };
    
    return descriptions[status] || descriptions['PENDING'];
}

// Close order detail modal
function closeOrderDetailModal() {
    const modal = document.getElementById('orderDetailModalUser');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 200);
        document.body.style.overflow = '';
    }
}

// Handle cancel order
async function handleCancelOrder(orderId) {
    const order = userOrdersState.allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const confirmed = confirm(
        `⚠️ HỦY ĐƠN HÀNG\n\n` +
        `Bạn có chắc chắn muốn hủy đơn hàng "${order.code}"?\n\n` +
        `Đơn hàng sẽ không thể khôi phục sau khi hủy.`
    );
    
    if (!confirmed) return;
    
    try {
        const response = await userAPI.apiService.patch(`/orders/${orderId}/cancel`);
        
        if (response.success) {
            alert('✅ Hủy đơn hàng thành công!');
            
            // Close modal if open
            closeOrderDetailModal();
            
            // Reload orders
            await loadUserOrders();
        } else {
            alert('❌ Lỗi: ' + (response.message || 'Không thể hủy đơn hàng'));
        }
    } catch (error) {
        console.error('Error cancelling order:', error);
        alert('❌ Lỗi khi hủy đơn hàng: ' + error.message);
    }
}

// Handle mark as received
async function handleMarkReceived(orderId) {
    const order = userOrdersState.allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const confirmed = confirm(
        `✅ XÁC NHẬN ĐÃ NHẬN HÀNG\n\n` +
        `Bạn đã nhận được đơn hàng "${order.code}"?\n\n` +
        `Sau khi xác nhận, đơn hàng sẽ được chuyển sang trạng thái "Hoàn thành".`
    );
    
    if (!confirmed) return;
    
    try {
        const response = await userAPI.apiService.patch(`/orders/${orderId}/received`);
        
        if (response.success) {
            alert('✅ Xác nhận đã nhận hàng thành công!\n\nCảm ơn bạn đã mua hàng tại MatFlow!');
            
            // Close modal if open
            closeOrderDetailModal();
            
            // Reload orders
            await loadUserOrders();
        } else {
            alert('❌ Lỗi: ' + (response.message || 'Không thể xác nhận'));
        }
    } catch (error) {
        console.error('Error marking received:', error);
        alert('❌ Lỗi khi xác nhận: ' + error.message);
    }
}

// Handle return request
function handleReturnRequest(orderId) {
    const order = userOrdersState.allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    // Store current order for return
    userOrdersState.currentOrderForReturn = order;
    
    // Show return modal
    const modal = document.getElementById('returnRequestModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Clear previous input
        const reasonInput = document.getElementById('returnReason');
        if (reasonInput) {
            reasonInput.value = '';
        }
    }
}

// Close return request modal
function closeReturnRequestModal() {
    const modal = document.getElementById('returnRequestModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 200);
        document.body.style.overflow = '';
    }
    userOrdersState.currentOrderForReturn = null;
}

// Submit return request
async function submitReturnRequest() {
    const order = userOrdersState.currentOrderForReturn;
    if (!order) return;
    
    const reasonInput = document.getElementById('returnReason');
    const reason = reasonInput ? reasonInput.value.trim() : '';
    
    if (!reason) {
        alert('⚠️ Vui lòng nhập lý do hoàn trả');
        return;
    }
    
    try {
        console.log('📤 Submitting return request for order:', order.id);
        const response = await userAPI.apiService.post(`/orders/${order.id}/return`, {
            reason: reason
        });
        
        console.log('📥 Return request response:', response);
        
        // Handle nested response structure
        const actualResponse = response.data && response.data.success ? response.data : response;
        
        if (actualResponse.success) {
            alert(
                '✅ GỬI YÊU CẦU HOÀN TRẢ THÀNH CÔNG!\n\n' +
                'Yêu cầu của bạn đã được ghi nhận.\n' +
                'Chúng tôi sẽ xem xét và phản hồi trong vòng 24-48h.\n\n' +
                'Cảm ơn bạn đã tin tưởng MatFlow!'
            );
            
            // Close modals
            closeReturnRequestModal();
            closeOrderDetailModal();
            
            // Reload orders
            await loadUserOrders();
        } else {
            alert('❌ Lỗi: ' + (actualResponse.message || response.message || 'Không thể gửi yêu cầu'));
        }
    } catch (error) {
        console.error('❌ Error submitting return request:', error);
        alert('❌ Lỗi khi gửi yêu cầu: ' + error.message);
    }
}

// Navigation functionality
// - Xử lý chuyển tab khi click trên menu (thêm/bỏ class "active")
// - data-section chứa id của section tương ứng
document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault()
  
      // Remove active class from all nav items and sections
      document.querySelectorAll(".nav-item").forEach((nav) => nav.classList.remove("active"))
      document.querySelectorAll(".content-section").forEach((section) => section.classList.remove("active"))
  
      // Add active class to clicked nav item
      this.classList.add("active")
  
      // Show corresponding section
      const sectionId = this.getAttribute("data-section")
      document.getElementById(sectionId).classList.add("active")
      
      // Load data for the section
      if (sectionId === 'orders') {
          initUserOrdersSystem();
      } else if (sectionId === 'notifications') {
          loadNotifications();
      }
    })
  })
  
  
  // Mark all notifications as read
  // - Chuyển tất cả .notification-item.unread -> .read và cập nhật giao diện
  const markAllReadBtn = document.querySelector(".mark-all-read")
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", () => {
    document.querySelectorAll(".notification-item.unread").forEach((item) => {
      item.classList.remove("unread")
      item.classList.add("read")
      const markReadBtn = item.querySelector(".btn-primary")
      if (markReadBtn && markReadBtn.textContent === "Đánh dấu đã đọc") {
        markReadBtn.textContent = "Đã đọc"
        markReadBtn.classList.remove("btn-primary")
        markReadBtn.classList.add("btn-disabled")
        markReadBtn.disabled = true
      }
    })
      const notificationCount = document.querySelector(".notification-count")
      const notificationAlert = document.querySelector(".notification-alert")
      if (notificationCount) notificationCount.textContent = "0"
      if (notificationAlert) notificationAlert.style.display = "none"
    })
  }
  
  // Individual notification mark as read
  // - Gắn listener cho từng nút "Đánh dấu đã đọc"
  const notificationButtons = document.querySelectorAll(".notification-item .btn-primary")
  if (notificationButtons.length > 0) {
    notificationButtons.forEach((button) => {
    if (button.textContent.trim() === "Đánh dấu đã đọc") {
      button.addEventListener("click", function () {
        const notificationItem = this.closest(".notification-item")
  
        // Mark this notification as read
        notificationItem.classList.remove("unread")
        notificationItem.classList.add("read")
  
        // Update button
        this.textContent = "Đã đọc"
        this.classList.remove("btn-primary")
        this.classList.add("btn-disabled")
        this.disabled = true
  
        // Update notification count
        const countElement = document.querySelector(".notification-count")
        const currentCount = Number.parseInt(countElement.textContent)
        const newCount = Math.max(0, currentCount - 1)
        countElement.textContent = newCount.toString()
  
        // Hide alert if no unread notifications
        if (newCount === 0) {
          document.querySelector(".notification-alert").style.display = "none"
        }
      })
    }
  })
  }
  
  // Load notifications
  async function loadNotifications() {
    try {
      const response = await userAPI.getNotifications();
      if (response.success) {
        updateNotificationsUI(response.data);
      } else {
        console.error('Failed to load notifications:', response.message);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  // Update notifications UI
  function updateNotificationsUI(notifications) {
    const notificationsList = document.querySelector('.notifications-list');
    if (!notificationsList) return;
    
    notificationsList.innerHTML = '';
    
    // Ensure notifications is an array
    if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
      notificationsList.innerHTML = '<div class="no-notifications">Bạn chưa có thông báo nào.</div>';
      return;
    }
    
    notifications.forEach(notification => {
      const notificationElement = createNotificationElement(notification);
      notificationsList.appendChild(notificationElement);
    });
    
    // Update notification count
    const unreadCount = notifications.filter(n => !n.isRead).length;
    document.querySelector('.notification-count').textContent = unreadCount;
    
    // Show/hide alert
    const alert = document.querySelector('.notification-alert');
    if (unreadCount > 0) {
      alert.style.display = 'flex';
      alert.querySelector('i').nextSibling.textContent = `Bạn có ${unreadCount} thông báo chưa đọc`;
    } else {
      alert.style.display = 'none';
    }
  }

  // Create notification element
  function createNotificationElement(notification) {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `notification-item ${notification.isRead ? 'read' : 'unread'}`;
    
    const timeAgo = getTimeAgo(notification.createdAt);
    const iconClass = getNotificationIcon(notification.type);
    
    notificationDiv.innerHTML = `
      <div class="notification-icon">
        <i class="${iconClass}"></i>
      </div>
      <div class="notification-content">
        <h4>${notification.title}</h4>
        <p>${notification.message}</p>
        <div class="notification-actions">
          ${!notification.isRead ? '<button class="btn-primary" onclick="markAsRead(this)">Đánh dấu đã đọc</button>' : '<button class="btn-disabled" disabled>Đã đọc</button>'}
          <button class="btn-secondary" onclick="handleNotificationAction('${notification.type}')">Chi tiết</button>
        </div>
      </div>
      <div class="notification-time">${timeAgo}</div>
    `;
    
    return notificationDiv;
  }

  // Helper functions for notifications
  function getTimeAgo(date) {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    
    return notificationDate.toLocaleDateString('vi-VN');
  }

  function getNotificationIcon(type) {
    const iconMap = {
      'order': 'fa-solid fa-box',
      'promotion': 'fa-solid fa-percentage',
      'shipping': 'fa-solid fa-truck',
      'payment': 'fa-solid fa-credit-card',
      'review': 'fa-solid fa-star',
      'general': 'fa-solid fa-bell'
    };
    return iconMap[type] || 'fa-solid fa-bell';
  }

  // Mark notification as read
  function markAsRead(button) {
    const notificationItem = button.closest('.notification-item');
    notificationItem.classList.remove('unread');
    notificationItem.classList.add('read');
    
    button.textContent = 'Đã đọc';
    button.classList.remove('btn-primary');
    button.classList.add('btn-disabled');
    button.disabled = true;
    
    // Update count
    const countElement = document.querySelector('.notification-count');
    const currentCount = parseInt(countElement.textContent);
    const newCount = Math.max(0, currentCount - 1);
    countElement.textContent = newCount;
    
    // Hide alert if no unread notifications
    if (newCount === 0) {
      document.querySelector('.notification-alert').style.display = 'none';
    }
  }

  // Handle notification action
  function handleNotificationAction(type) {
    if (type === 'order') {
      // Switch to orders tab
      document.querySelector('[data-section="orders"]').click();
    } else if (type === 'promotion') {
      // Redirect to homepage or promotions
      window.location.href = '../homepage/homepage.html';
    }
  }

  // Show loading state
  function showLoadingState() {
    // Update loading text
    document.getElementById('displayName').textContent = 'Đang tải...';
    document.querySelector('.user-name').textContent = 'Đang tải...';
    
    // Show loading for additional info
    document.getElementById('joinDate').textContent = 'Đang tải...';
    document.getElementById('totalOrders').textContent = 'Đang tải...';
    document.getElementById('loyaltyPoints').textContent = 'Đang tải...';
    document.getElementById('accountStatus').textContent = 'Đang tải...';
    document.getElementById('userRole').textContent = 'Đang tải...';
  }

  // Switch to profile tab
  function switchToProfileTab() {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      item.setAttribute('aria-selected', 'false');
    });
    
    // Remove active class from all content sections
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.remove('active');
    });
    
    // Add active class to profile nav item
    const profileNavItem = document.querySelector('.nav-item[data-section="profile"]');
    if (profileNavItem) {
      profileNavItem.classList.add('active');
      profileNavItem.setAttribute('aria-selected', 'true');
    }
    
    // Add active class to profile content section
    const profileSection = document.getElementById('profile');
    if (profileSection) {
      profileSection.classList.add('active');
    }
  }
  
  // Initialize username synchronization on page load
  document.addEventListener("DOMContentLoaded", async () => {
    // Check authentication first
    if (!checkAuth()) {
      return;
    }
    
    // Check if we need to redirect to profile tab after avatar upload/delete
    if (sessionStorage.getItem('redirectToProfile') === 'true') {
      sessionStorage.removeItem('redirectToProfile');
      // Wait a bit for page to fully load, then switch to profile tab
      setTimeout(() => {
        switchToProfileTab();
      }, 500);
    }
    
    // Show loading state
    showLoadingState();
    
    // Load all data from APIs
    try {
      await Promise.all([
        loadUserProfile(),
        loadNotifications()
      ]);
      
      // Check if on orders tab and init orders system
      const activeSection = document.querySelector('.nav-item.active');
      if (activeSection && activeSection.getAttribute('data-section') === 'orders') {
        await initUserOrdersSystem();
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      showModal('Lỗi', 'Có lỗi xảy ra khi tải dữ liệu. Vui lòng tải lại trang.', null, null);
    }
    
    // Set initial username in sidebar from profile
    const fullNameInput = document.getElementById("fullName")
    const sidebarUserName = document.querySelector(".user-name")
  
    if (fullNameInput && sidebarUserName) {
      sidebarUserName.textContent = fullNameInput.value
    }
  
    // ---- Avatar: load from localStorage (if any) and sync with sidebar ----
    const profileImg = document.getElementById('profileAvatarImg')
    const placeholder = document.getElementById('profileAvatarPlaceholder')
    const sidebarAvatar = document.querySelector('.user-avatar')
  
    // helper: return initials (first letter of first word + first letter of last word)
    // - Trả về 'U' nếu fullName rỗng
    window.getInitials = function(fullName) {
      if (!fullName) return 'U'
      const parts = fullName.trim().split(/\s+/).filter(Boolean)
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
      const first = parts[0].charAt(0).toUpperCase()
      const last = parts[parts.length - 1].charAt(0).toUpperCase()
      return (first + last)
    }
  
    // updateAvatarInitials:
    // - Cập nhật initials ở placeholder trên trang profile và sidebar (khi không có ảnh)
    window.updateAvatarInitials = function() {
      const name = document.getElementById('fullName')?.value || ''
      const initials = window.getInitials(name)
      // profile placeholder inside profile page
      const span = document.querySelector('#profileAvatarPlaceholder #avatarInitial') || document.querySelector('#profileAvatarPlaceholder span')
      if (span) span.textContent = initials
  
      // sidebar avatar only when no image set
      const sidebarAvatar = document.querySelector('.user-avatar')
      if (sidebarAvatar) {
      const sidebarImg = sidebarAvatar.querySelector('img')
      if (!sidebarImg) {
        sidebarAvatar.innerHTML = `<span>${initials}</span>`
        }
      }
    }
  
    // applyAvatarData:
    // - Hiển thị ảnh nếu có dataUrl, ngược lại hiển thị placeholder initials
    function applyAvatarData(dataUrl) {
      if (dataUrl) {
        profileImg.src = dataUrl
        profileImg.style.display = 'block'
        placeholder.style.display = 'none'
        // update sidebar avatar: replace inner content with img
        const sidebarAvatar = document.querySelector('.user-avatar')
        if (sidebarAvatar) {
        sidebarAvatar.innerHTML = `<img id="sidebarAvatarImg" src="${dataUrl}" alt="User avatar">`
        }
      } else {
        // revert to placeholder initials in sidebar
        profileImg.src = ''
        profileImg.style.display = 'none'
        placeholder.style.display = 'block'
        // use initials (first + last) instead of single letter
        const initials = window.getInitials(document.getElementById('fullName')?.value || '')
        const sidebarAvatar = document.querySelector('.user-avatar')
        if (sidebarAvatar) {
        sidebarAvatar.innerHTML = `<span>${initials}</span>`
        }
        // ensure profile placeholder initial is synced
        const pSpan = document.querySelector('#profileAvatarPlaceholder #avatarInitial') || document.querySelector('#profileAvatarPlaceholder span')
        if (pSpan) pSpan.textContent = initials
      }
    }
  
    // Load stored avatar from localStorage (nếu có) - but prioritize database data
    // Note: This will be overridden by fresh data from API in loadUserProfile()
    const storedAvatar = localStorage.getItem('profileAvatar')
    if (storedAvatar) {
        applyAvatarData(storedAvatar)
    } else {
        // No stored avatar, show initials
        applyAvatarData(null)
    }

    // Cart button click handler
    const cartBtn = document.getElementById('hpCartBtn');
    if (cartBtn) {
      console.log('Cart button found, adding click listener');
      cartBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        console.log('Cart button clicked, navigating to cart');
        window.location.href = '../homepage/cart.html';
      });
    } else {
      console.log('Cart button not found!');
    }
  
    // Wire up avatar input and buttons
    const avatarInput = document.getElementById('avatarInput')
    const changeAvatarBtn = document.getElementById('changeAvatarBtn')
    const removeAvatarBtn = document.getElementById('removeAvatarBtn')
  
    // Mở file picker khi click vào nút đổi avatar
    changeAvatarBtn.addEventListener('click', () => avatarInput.click())
  
    // Khi người dùng chọn file ảnh
    avatarInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0]
      if (!file) return
  
      // Optional: basic file size/type check
      if (!file.type.startsWith('image/')) {
        showModal('Lỗi', 'Vui lòng chọn tệp ảnh hợp lệ.', null, null)
        return
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showModal('Lỗi', 'Kích thước ảnh quá lớn (tối đa 5MB).', null, null)
        return
      }
  
      // Show loading state
      changeAvatarBtn.textContent = 'Đang tải...'
      changeAvatarBtn.disabled = true
  
      try {
        // Convert file to base64
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (ev) => resolve(ev.target.result)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
  
        // Save to database via API
        const response = await window.apiService.patch('/users/profile', {
          avt_img: dataUrl
        })
  
        if (response.success) {
          // Update local storage
          localStorage.setItem('profileAvatar', dataUrl)
          
          // Update UI
          applyAvatarData(dataUrl)
          removeAvatarBtn.style.display = 'inline-block'
          
          // Update header avatar
          if (window.HeaderAvatar && window.HeaderAvatar.refreshUserData) {
            await window.HeaderAvatar.refreshUserData()
          }
          
          showModal('Thành công', 'Ảnh đại diện đã được cập nhật!', null, null)
          
          // Auto refresh trang sau 1.5 giây và chuyển về tab Thông tin
          setTimeout(() => {
            // Lưu thông tin để chuyển về tab profile sau khi refresh
            sessionStorage.setItem('redirectToProfile', 'true')
            window.location.reload()
          }, 1500)
        } else {
          throw new Error(response.message || 'Có lỗi xảy ra khi cập nhật ảnh')
        }
      } catch (error) {
        console.error('Error uploading avatar:', error)
        showModal('Lỗi', 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại.', null, null)
      } finally {
        // Reset button state
        changeAvatarBtn.textContent = 'Thay ảnh'
        changeAvatarBtn.disabled = false
        // Clear file input
        avatarInput.value = ''
      }
    })
  
    // Remove avatar: xóa localStorage và trả về placeholder
    removeAvatarBtn.addEventListener('click', async () => {
      // Show loading state
      removeAvatarBtn.textContent = 'Đang xóa...'
      removeAvatarBtn.disabled = true
      
      try {
        // Remove from database via API
        const response = await window.apiService.patch('/users/profile', {
          avt_img: null
        })
        
        if (response.success) {
          // Remove from local storage
          localStorage.removeItem('profileAvatar')
          
          // Update UI
          applyAvatarData(null)
          removeAvatarBtn.style.display = 'none'
          
          // Update header avatar
          if (window.HeaderAvatar && window.HeaderAvatar.refreshUserData) {
            await window.HeaderAvatar.refreshUserData()
          }
          
          showModal('Thành công', 'Ảnh đại diện đã được xóa!', null, null)
          
          // Auto refresh trang sau 1.5 giây và chuyển về tab Thông tin
          setTimeout(() => {
            // Lưu thông tin để chuyển về tab profile sau khi refresh
            sessionStorage.setItem('redirectToProfile', 'true')
            window.location.reload()
          }, 1500)
        } else {
          throw new Error(response.message || 'Có lỗi xảy ra khi xóa ảnh')
        }
      } catch (error) {
        console.error('Error removing avatar:', error)
        showModal('Lỗi', 'Không thể xóa ảnh đại diện. Vui lòng thử lại.', null, null)
      } finally {
        // Reset button state
        removeAvatarBtn.textContent = 'Xóa ảnh'
        removeAvatarBtn.disabled = false
      }
    })
  
    // ensure initials reflect name at page load
    if (window.updateAvatarInitials) {
      window.updateAvatarInitials()
    }
  })
  
  // Enhanced sync function that updates both sidebar and display name
  // - Gọi khi fullName thay đổi để cập nhật mọi nơi hiển thị tên người dùng
  function syncUserName() {
    const fullNameInput = document.getElementById("fullName")
    const sidebarUserName = document.querySelector(".user-name")
    const displayNameElement = document.getElementById("displayName")
  
    if (fullNameInput && sidebarUserName && displayNameElement) {
      const newName = fullNameInput.value
      sidebarUserName.textContent = newName
      displayNameElement.textContent = newName
    }
  }
  
  // updateDisplayName:
  // - Đồng bộ tên hiển thị trong profile view và sidebar
  function updateDisplayName() {
    const fullNameInput = document.getElementById("fullName")
    const displayNameElement = document.getElementById("displayName")
    const sidebarUserName = document.querySelector(".user-name")
  
    if (fullNameInput && displayNameElement && sidebarUserName) {
      const newName = fullNameInput.value
      displayNameElement.textContent = newName
      sidebarUserName.textContent = newName // Sync with sidebar
    }
  }
  
  // Modal functionality
  // - Tạo modal overlay động với callback onConfirm/onCancel
  function showModal(title, message, onConfirm, onCancel) {
    // Create modal overlay
    const modalOverlay = document.createElement("div")
    modalOverlay.className = "modal-overlay"
  
    // Create modal content
    const modalContent = document.createElement("div")
    modalContent.className = "modal-content"
  
    modalContent.innerHTML = `
          <div class="modal-header">
              <h3>${title}</h3>
          </div>
          <div class="modal-body">
              <p>${message}</p>
          </div>
          <div class="modal-footer">
              <button class="modal-btn modal-btn-cancel">Hủy</button>
              <button class="modal-btn modal-btn-confirm">Xác nhận</button>
          </div>
      `
  
    modalOverlay.appendChild(modalContent)
    document.body.appendChild(modalOverlay)
  
    // Add event listeners
    const cancelBtn = modalContent.querySelector(".modal-btn-cancel")
    const confirmBtn = modalContent.querySelector(".modal-btn-confirm")
  
    cancelBtn.addEventListener("click", () => {
      document.body.removeChild(modalOverlay)
      if (onCancel) onCancel()
    })
  
    confirmBtn.addEventListener("click", () => {
      document.body.removeChild(modalOverlay)
      if (onConfirm) onConfirm()
    })
  
    // Close modal when clicking overlay
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        document.body.removeChild(modalOverlay)
        if (onCancel) onCancel()
      }
    })
  
    // Show modal with animation
    setTimeout(() => {
      modalOverlay.classList.add("show")
    }, 10)
  }
  
  // Profile editing functionality
  // - Quản lý trạng thái chỉnh sửa, lưu/hoàn tác, validate trước khi lưu
  let isEditing = false
  let originalValues = {}
  
  const editBtn = document.getElementById("editProfileBtn")
  const saveBtn = document.getElementById("saveBtn")
  const cancelBtn = document.getElementById("cancelBtn")
  const formActions = document.getElementById("formActions")
  
  const editableFields = [
    { id: "fullName", type: "input" },
    { id: "phoneNumber", type: "input" },
    { id: "email", type: "input" },
    { id: "gender", type: "select" },
    { id: "addressStreet", type: "input" },
    // Note: provinceSelect and wardSelect are handled by SearchDropdown components
    // They don't exist as regular HTML elements, so they're not included here
  ]
  
  // Data holders for JSON
  let provincesData = {}
  let wardsData = {}
  
  // Initialize search dropdowns for provinces and wards
  document.addEventListener("DOMContentLoaded", () => {
    const cartBtn = document.getElementById('hpCartBtn');
    const provinceContainer = document.getElementById("provinceSearchContainer")
    const wardContainer = document.getElementById("wardSearchContainer")
    const addressStreet = document.getElementById("addressStreet")
    
    if (!provinceContainer || !wardContainer || !addressStreet) {
      console.warn('Address form elements not found, skipping address initialization')
      return
    }
    
    const mainAddress = document.getElementById("address")
    let selectedProvince = null
    let selectedWard = null
  
    // Helper to update the combined address input
    function updateCombinedAddress() {
      const street = addressStreet?.value?.trim() || ""
      const provinceName = selectedProvince ? (selectedProvince.name_with_type || selectedProvince.name) : ""
      const wardName = selectedWard ? (selectedWard.name_with_type || selectedWard.name) : ""
  
      const parts = []
      if (street) parts.push(street)
      if (wardName) parts.push(wardName)
      if (provinceName) parts.push(provinceName)
  
      if (mainAddress) {
      mainAddress.value = parts.join(" / ")
      }
    }

    // Initialize province search dropdown
    const provinceDropdown = new SearchDropdown(provinceContainer, {
      placeholder: 'Tìm kiếm tỉnh/thành phố...',
      apiUrl: 'http://localhost:3000/locations/provinces',
      limit: 5,
      onSelect: (province) => {
        selectedProvince = province
        window.selectedProvince = province // Store globally for saveChanges
        selectedWard = null
        window.selectedWard = null
        wardDropdown.clearSearch()
        updateCombinedAddress()
        console.log('Selected province:', province)
      }
    })
    
    // Store dropdown references globally
    window.provinceDropdown = provinceDropdown

    // Initialize ward search dropdown (will be updated when province is selected)
    const wardDropdown = new SearchDropdown(wardContainer, {
      placeholder: 'Vui lòng chọn tỉnh/thành phố trước...',
      apiUrl: '', // Will be set when province is selected
      limit: 5,
      onSelect: (ward) => {
        selectedWard = ward
        window.selectedWard = ward // Store globally for saveChanges
        updateCombinedAddress()
        console.log('Selected ward:', ward)
      }
    })
    
    // Store dropdown references globally
    window.wardDropdown = wardDropdown

    // Update ward dropdown when province changes
    provinceDropdown.options.onSelect = (province) => {
      selectedProvince = province
      window.selectedProvince = province // Store globally for saveChanges
      selectedWard = null
      window.selectedWard = null
      wardDropdown.clearSearch()
      
      // Update ward dropdown API URL with selected province
      wardDropdown.options.apiUrl = `http://localhost:3000/locations/wards/${province.code}`
      wardDropdown.loadInitialData()
      
      updateCombinedAddress()
      console.log('Selected province:', province)
    }
  
    // Update combined address when street changes
    addressStreet?.addEventListener("input", updateCombinedAddress)
    
    // Initially disable search dropdowns
    setTimeout(() => {
      if (window.provinceDropdown) {
        window.provinceDropdown.disable();
      }
      if (window.wardDropdown) {
        window.wardDropdown.disable();
      }
      
      // Populate with existing data if available
      if (window.selectedProvince) {
        const provinceName = window.selectedProvince.name_with_type || window.selectedProvince.name;
        provinceDropdown.setValue(provinceName);
        // Update ward dropdown URL
        wardDropdown.options.apiUrl = `http://localhost:3000/locations/wards/${window.selectedProvince.code}`;
        wardDropdown.loadInitialData();
      }
      
      if (window.selectedWard) {
        const wardName = window.selectedWard.name_with_type || window.selectedWard.name;
        wardDropdown.setValue(wardName);
      }
      
      console.log('✅ Address dropdowns populated with existing data');
    }, 100);
  })
  
  // parseAddressParts:
  // - Tách địa chỉ theo dấu phẩy hoặc /, trả về mảng phần (trim, filter)
  function parseAddressParts(addr) {
    // split by comma or slash, trim and filter empty
    return addr.split(/[\/,]/).map(s => s.trim()).filter(Boolean)
  }
  
  // helper: contains at least one unicode letter (prevents "nhập mỗi số")
  // - Dùng unicode property \p{L} khi browser hỗ trợ, fallback regex Latin extended
  const hasLetter = (s) => {
    try { return /\p{L}/u.test(s) } catch (e) { return /[A-Za-zÀ-ỹ]/.test(s) }
  }
  
  // Store original values before edit để có thể restore khi hủy
  function storeOriginalValues() {
    originalValues = {}
    editableFields.forEach((field) => {
      const element = document.getElementById(field.id)
      if (element) {
        originalValues[field.id] = element.value || ''
      } else {
        console.warn(`Element with id '${field.id}' not found when storing original values`)
        originalValues[field.id] = ''
      }
    })
  }
  
  // exitEditMode:
  // - Tắt trạng thái chỉnh sửa, reset UI (readonly/disabled + style)
  function exitEditMode() {
    isEditing = false
    editBtn.textContent = "Chỉnh sửa"
    editBtn.style.background = "var(--cyan)"
    editBtn.style.color = "var(--navy)"
    editBtn.disabled = false
    formActions.style.display = "none"
  
    document.getElementById("fullName").removeEventListener("input", updateDisplayName)
  
    // Disable all fields
    editableFields.forEach((field) => {
      const element = document.getElementById(field.id)
      if (!element) return; // Skip if element not found
      
      if (field.type === "input") {
        element.setAttribute("readonly", true)
        element.style.background = "var(--gray-100)"
        element.style.color = "var(--muted)"
        element.style.borderColor = "var(--gray-300)"
      } else if (field.type === "select") {
        element.setAttribute("disabled", true)
        element.style.background = "var(--gray-100)"
        element.style.color = "var(--muted)"
        element.style.borderColor = "var(--gray-300)"
      }
    })
    
    // Disable search dropdowns
    if (window.provinceDropdown) {
      window.provinceDropdown.disable();
    }
    if (window.wardDropdown) {
      window.wardDropdown.disable();
    }
  }
  
  // Toggle edit mode: bật/tắt chế độ chỉnh sửa
  function toggleEditMode() {
    isEditing = !isEditing
  
    if (isEditing) {
      // Enter edit mode
      storeOriginalValues()
      editBtn.textContent = "Đang chỉnh sửa..."
      editBtn.style.background = "#f59e0b"
      editBtn.style.color = "white"
      editBtn.disabled = true
      formActions.style.display = "flex"
  
      // Enable all fields
      editableFields.forEach((field) => {
        const element = document.getElementById(field.id)
        if (!element) return; // Skip if element not found
        
        if (field.type === "input") {
          element.removeAttribute("readonly")
          element.style.background = "white"
          element.style.color = "var(--text)"
          element.style.borderColor = "var(--teal)"
        } else if (field.type === "select") {
          element.removeAttribute("disabled")
          element.style.background = "white"
          element.style.color = "var(--text)"
          element.style.borderColor = "var(--teal)"
        }
      })
      
      // Enable search dropdowns
      if (window.provinceDropdown) {
        window.provinceDropdown.enable();
        console.log('📍 Province dropdown enabled with data:', window.selectedProvince);
      }
      if (window.wardDropdown) {
        window.wardDropdown.enable();
        console.log('📍 Ward dropdown enabled with data:', window.selectedWard);
      }
  
      // Khi nhập tên, cập nhật hiển thị tức thì
      document.getElementById("fullName").addEventListener("input", () => {
        updateDisplayName()
        syncUserName()
      })
    } else {
      // Exit edit mode
      exitEditMode()
    }
  }
  
  // saveChanges:
  // - Validate các trường, kiểm tra email/phone/address, hiện modal xác nhận, gọi API thực tế
  async function saveChanges() {
    // Simple validation
    const fullName = document.getElementById("fullName")?.value?.trim() || ""
    const phoneNumber = document.getElementById("phoneNumber")?.value?.trim() || ""
    const email = document.getElementById("email")?.value?.trim() || ""
    const gender = document.getElementById("gender")?.value || ""
    const addressStreet = document.getElementById("addressStreet")?.value?.trim() || ""
    
    // Get selected province and ward from search dropdowns
    const selectedProvince = window.selectedProvince || null
    const selectedWard = window.selectedWard || null
    
    // Build full address
    const addressParts = []
    if (addressStreet) addressParts.push(addressStreet)
    if (selectedWard) addressParts.push(selectedWard.name_with_type || selectedWard.name)
    if (selectedProvince) addressParts.push(selectedProvince.name_with_type || selectedProvince.name)
    const fullAddress = addressParts.join(" / ")
  
    if (!fullName || !phoneNumber || !email) {
      showModal("Lỗi", "Vui lòng điền đầy đủ thông tin bắt buộc!", null, null)
      return
    }
  
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      showModal("Lỗi", "Email không hợp lệ!", null, null)
      return
    }
  
    // Phone validation - REMOVED (allow any phone format)
    // User can enter any phone number format
  
    // Address validation: check if we have at least street address
    if (!addressStreet.trim()) {
      showModal("Lỗi", "Vui lòng nhập địa chỉ đường!", null, null)
      return
    }
    
    // Optional: check if province and ward are selected
    if (!selectedProvince) {
      showModal("Lỗi", "Vui lòng chọn tỉnh/thành phố!", null, null)
      return
    }
    
    if (!selectedWard) {
      showModal("Lỗi", "Vui lòng chọn phường/xã!", null, null)
      return
    }
  
    // Show confirmation modal trước khi "lưu"
    showModal(
      "Xác nhận lưu thay đổi",
      "Bạn có chắc chắn muốn lưu những thay đổi này không?",
      async () => {
        try {
          // Prepare data for API
          const updateData = {
            fullName: fullName,
            email: email,
            phone: phoneNumber,
            gender: gender,
            fullAddress: fullAddress,
            province: selectedProvince?.code || '',
            provinceName: selectedProvince?.name_with_type || selectedProvince?.name || '',
            district: selectedWard?.parent_code || selectedProvince?.code || '', // Add district
            ward: selectedWard?.code || selectedWard?.id || '',
            wardName: selectedWard?.name_with_type || selectedWard?.name || '',
            street: addressStreet
          };
          
          console.log('📤 Updating profile with data:', updateData);
          
          // Call API to update profile
          const response = await userAPI.updateProfile(updateData);
          
          if (response.success) {
            console.log('✅ Profile updated successfully:', response);
            
        updateDisplayName()
        syncUserName()
            
            // Reload profile to sync new data
            await loadUserProfile();
  
          showModal(
            "Thành công",
            "Cập nhật thông tin thành công!",
            () => {
              exitEditMode()
            },
            null,
          )
          } else {
            console.error('❌ Failed to update profile:', response);
            showModal("Lỗi", response.message || "Có lỗi xảy ra khi cập nhật thông tin.", null, null)
          }
        } catch (error) {
          console.error('Error updating profile:', error);
          showModal("Lỗi", "Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.", null, null)
        }
      },
      null,
    )
  }
  
  // cancelChanges:
  // - Xác nhận hủy, nếu ok thì restore giá trị ban đầu và exit edit mode
  function cancelChanges() {
    showModal(
      "Xác nhận hủy",
      "Bạn có chắc chắn muốn hủy những thay đổi này không?",
      () => {
        // Restore original values
        editableFields.forEach((field) => {
          const element = document.getElementById(field.id)
          if (element && originalValues[field.id] !== undefined) {
            try {
              element.value = originalValues[field.id]
            } catch (error) {
              console.error(`Error restoring value for field '${field.id}':`, error)
            }
          } else if (!element) {
            console.warn(`Element with id '${field.id}' not found when restoring values`)
          }
        })
  
        updateDisplayName()
        syncUserName()
  
        exitEditMode()
      },
      null,
    )
  }
  
  // Event listeners
  if (editBtn) editBtn.addEventListener("click", toggleEditMode)
  if (saveBtn) saveBtn.addEventListener("click", saveChanges)
  if (cancelBtn) cancelBtn.addEventListener("click", cancelChanges)
  
  // Password Change Modal Functionality
  // - Mở/đóng modal, validate password, mô phỏng thay đổi mật khẩu
  const passwordModal = document.getElementById('passwordModal');
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const closePasswordModal = document.getElementById('closePasswordModal');
  const cancelPasswordChange = document.getElementById('cancelPasswordChange');
  const confirmPasswordChange = document.getElementById('confirmPasswordChange');
  const passwordChangeForm = document.getElementById('passwordChangeForm');
  
  // Open password modal
  if (changePasswordBtn) {
  changePasswordBtn.addEventListener('click', function() {
      passwordModal.classList.add('show');
      document.body.style.overflow = 'hidden';
      
      // Clear form
      passwordChangeForm.reset();
      document.getElementById('passwordError').style.display = 'none';
  });
  }
  
  // Close password modal
  function closePasswordModalFunc() {
      passwordModal.classList.remove('show');
      document.body.style.overflow = 'auto';
      
      // Clear form
      passwordChangeForm.reset();
      document.getElementById('passwordError').style.display = 'none';
  }
  
  if (closePasswordModal) closePasswordModal.addEventListener('click', closePasswordModalFunc);
  if (cancelPasswordChange) cancelPasswordChange.addEventListener('click', closePasswordModalFunc);
  
  // Close modal when clicking overlay
  if (passwordModal) {
  passwordModal.addEventListener('click', function(e) {
      if (e.target === passwordModal) {
          closePasswordModalFunc();
      }
  });
  }
  
  // Close modal with Escape key
  document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && passwordModal.classList.contains('show')) {
          closePasswordModalFunc();
      }
  });
  
  // Toggle password visibility
  // - Các nút .toggle-password sẽ chuyển input type và icon
  document.querySelectorAll('.toggle-password').forEach(button => {
      button.addEventListener('click', function() {
          const targetId = this.getAttribute('data-target');
          const targetInput = document.getElementById(targetId);
          const icon = this.querySelector('i');
          
          if (targetInput.type === 'password') {
              targetInput.type = 'text';
              icon.classList.remove('fa-eye');
              icon.classList.add('fa-eye-slash');
          } else {
              targetInput.type = 'password';
              icon.classList.remove('fa-eye-slash');
              icon.classList.add('fa-eye');
          }
      });
  });
  
  // Password validation
  // - Yêu cầu tối thiểu: 8 ký tự, chữ hoa, chữ thường, số
  function validatePassword(password) {
      const minLength = 8;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      
      return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers;
  }
  
  function showPasswordError(message) {
      const errorDiv = document.getElementById('passwordError');
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
  }
  
  function hidePasswordError() {
      document.getElementById('passwordError').style.display = 'none';
  }
  
  // Handle password change form submission
  if (confirmPasswordChange) {
    confirmPasswordChange.addEventListener('click', async function() {
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      hidePasswordError();
      
      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
          showPasswordError('Vui lòng điền đầy đủ thông tin.');
          return;
      }
      
      if (!validatePassword(newPassword)) {
          showPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.');
          return;
      }
      
      if (newPassword !== confirmPassword) {
          showPasswordError('Mật khẩu xác nhận không khớp.');
          return;
      }
      
      if (currentPassword === newPassword) {
          showPasswordError('Mật khẩu mới phải khác mật khẩu hiện tại.');
          return;
      }
      
      // Disable button and show loading
      confirmPasswordChange.disabled = true;
      confirmPasswordChange.textContent = 'Đang xử lý...';
      
      try {
          // Call API to change password
          const response = await userAPI.changePassword({
              currentPassword: currentPassword,
              newPassword: newPassword
          });
          
          if (response.success) {
          // Close modal
          closePasswordModalFunc();
          
          // Show success message
          showModal(
              'Thành công',
              'Mật khẩu đã được thay đổi thành công!',
              null,
              null
          );
          } else {
              showPasswordError(response.message || 'Có lỗi xảy ra khi thay đổi mật khẩu.');
          }
      } catch (error) {
          console.error('Error changing password:', error);
          showPasswordError('Có lỗi xảy ra khi thay đổi mật khẩu. Vui lòng thử lại.');
      } finally {
          // Reset button
          confirmPasswordChange.disabled = false;
          confirmPasswordChange.textContent = 'Đổi mật khẩu';
      }
    });
  }
  
  // Real-time password validation feedback
  const newPasswordInput = document.getElementById('newPassword')
  if (newPasswordInput) {
    newPasswordInput.addEventListener('input', function() {
      const password = this.value;
      const requirements = document.querySelector('.password-requirements small');
      
      if (password.length === 0) {
          requirements.style.color = '#666';
          return;
      }
      
      if (validatePassword(password)) {
          requirements.style.color = '#22c55e';
          requirements.textContent = '✓ Mật khẩu hợp lệ';
      } else {
          requirements.style.color = '#e74c3c';
          requirements.textContent = 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số';
      }
  });
  }
  
  const confirmPasswordInput = document.getElementById('confirmPassword')
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', function() {
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = this.value;
      
      if (confirmPassword.length === 0) {
          hidePasswordError();
          return;
      }
      
      if (newPassword !== confirmPassword) {
          showPasswordError('Mật khẩu xác nhận không khớp.');
      } else {
          hidePasswordError();
      }
  });
  }
  
  // Notification Settings Modal Functionality
  // - Lưu/khôi phục các cài đặt tạm thời khi mở modal
  const notificationModal = document.getElementById('notificationModal');
  const notificationSettingsBtn = document.getElementById('notificationSettingsBtn');
  const closeNotificationModal = document.getElementById('closeNotificationModal');
  const cancelNotificationSettings = document.getElementById('cancelNotificationSettings');
  const saveNotificationSettings = document.getElementById('saveNotificationSettings');
  
  // Store original notification settings
  let originalNotificationSettings = {};
  
  function storeNotificationSettings() {
      originalNotificationSettings = {
          orderStatus: document.getElementById('orderStatus').checked,
          paymentNotif: document.getElementById('paymentNotif').checked,
          promotions: document.getElementById('promotions').checked,
          newProducts: document.getElementById('newProducts').checked,
          emailNotif: document.getElementById('emailNotif').checked,
          smsNotif: document.getElementById('smsNotif').checked
      };
  }
  
  function restoreNotificationSettings() {
      document.getElementById('orderStatus').checked = originalNotificationSettings.orderStatus;
      document.getElementById('paymentNotif').checked = originalNotificationSettings.paymentNotif;
      document.getElementById('promotions').checked = originalNotificationSettings.promotions;
      document.getElementById('newProducts').checked = originalNotificationSettings.newProducts;
      document.getElementById('emailNotif').checked = originalNotificationSettings.emailNotif;
      document.getElementById('smsNotif').checked = originalNotificationSettings.smsNotif;
  }
  
  // Open notification settings modal
  notificationSettingsBtn.addEventListener('click', function() {
      storeNotificationSettings();
      notificationModal.classList.add('show');
      document.body.style.overflow = 'hidden';
  });
  
  // Close notification settings modal
  function closeNotificationModalFunc() {
      notificationModal.classList.remove('show');
      document.body.style.overflow = 'auto';
  }
  
  closeNotificationModal.addEventListener('click', closeNotificationModalFunc);
  
  cancelNotificationSettings.addEventListener('click', function() {
      restoreNotificationSettings();
      closeNotificationModalFunc();
  });
  
  // Close modal when clicking overlay
  notificationModal.addEventListener('click', function(e) {
      if (e.target === notificationModal) {
          restoreNotificationSettings();
          closeNotificationModalFunc();
      }
  });
  
  // Save notification settings (mô phỏng)
  saveNotificationSettings.addEventListener('click', function() {
      saveNotificationSettings.disabled = true;
      saveNotificationSettings.textContent = 'Đang lưu...';
      
      setTimeout(() => {
          saveNotificationSettings.disabled = false;
          saveNotificationSettings.textContent = 'Lưu cài đặt';
          
          closeNotificationModalFunc();
          
          showModal(
              'Thành công',
              'Cài đặt thông báo đã được lưu thành công!',
              null,
              null
          );
      }, 1500);
  });
  
  // Account Security Modal Functionality
  // - Mở modal bảo mật và các hành động phụ trợ (2FA, đổi số, xóa tài khoản...)
  const securityModal = document.getElementById('securityModal');
  const accountSecurityBtn = document.getElementById('accountSecurityBtn');
  const closeSecurityModal = document.getElementById('closeSecurityModal');
  const closeSecuritySettings = document.getElementById('closeSecuritySettings');
  
  // Open security modal
  accountSecurityBtn.addEventListener('click', function() {
      securityModal.classList.add('show');
      document.body.style.overflow = 'hidden';
  });
  
  // Close security modal
  function closeSecurityModalFunc() {
      securityModal.classList.remove('show');
      document.body.style.overflow = 'auto';
  }
  
  closeSecurityModal.addEventListener('click', closeSecurityModalFunc);
  closeSecuritySettings.addEventListener('click', closeSecurityModalFunc);
  
  // Close modal when clicking overlay
  securityModal.addEventListener('click', function(e) {
      if (e.target === securityModal) {
          closeSecurityModalFunc();
      }
  });
  
  // Security action handlers (gọi showModal mô phỏng hoặc hướng dẫn)
  document.getElementById('enable2FA').addEventListener('click', function() {
      showModal(
          'Kích hoạt xác thực hai yếu tố',
          'Bạn sẽ được hướng dẫn cài đặt ứng dụng xác thực trên điện thoại.',
          null,
          null
      );
  });
  
  document.getElementById('changePhone').addEventListener('click', function() {
      showModal(
          'Thay đổi số điện thoại',
          'Bạn sẽ cần xác thực số điện thoại mới qua SMS.',
          null,
          null
      );
  });
  
  document.getElementById('changeRecoveryEmail').addEventListener('click', function() {
      showModal(
          'Thay đổi email khôi phục',
          'Bạn sẽ cần xác thực email mới.',
          null,
          null
      );
  });
  
