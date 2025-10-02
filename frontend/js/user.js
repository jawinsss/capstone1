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
        return await this.apiService.get('/orders');
    }

    // Change password
    async changePassword(data) {
        return await this.apiService.post('/auth/change-password', data);
    }

    // Get notifications
    async getNotifications() {
        // Try to get from API first, fallback to mock data
        try {
            const response = await this.apiService.get('/notifications');
            if (response.success) {
                return response;
            }
        } catch (error) {
            console.warn('Notifications API not available, using mock data:', error);
        }
        
        // Fallback to mock data if API is not available
        return {
            success: true,
            data: [
                {
                    id: 1,
                    title: "Đơn hàng #DH001 đã được xác nhận",
                    message: "Đơn hàng Sắt thép xây dựng của bạn đã được xác nhận và đang được chuẩn bị",
                    type: "order",
                    isRead: false,
                    createdAt: new Date(Date.now() - 2 * 60 * 1000) // 2 phút trước
                },
                {
                    id: 2,
                    title: "Khuyến mãi đặc biệt - Giảm 20%",
                    message: "Áp dụng cho tất cả sản phẩm vật tư xây dựng. Mã: KIMKH20. Có hiệu lực đến 31/12/2023",
                    type: "promotion",
                    isRead: false,
                    createdAt: new Date(Date.now() - 60 * 60 * 1000) // 1 giờ trước
                }
            ]
        };
    }
}

// Initialize user API
const userAPI = new UserAPI();

// Check authentication and redirect if needed
function checkAuth() {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = '../../index.html';
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
            updateProfileUI(user);
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
function updateProfileUI(user) {
    // Update form fields
    if (user.fullName) {
        document.getElementById('fullName').value = user.fullName;
        document.getElementById('displayName').textContent = user.fullName;
        document.querySelector('.user-name').textContent = user.fullName;
    }
    
    if (user.email) {
        document.getElementById('email').value = user.email;
    }
    
    if (user.phone) {
        document.getElementById('phoneNumber').value = user.phone;
    }
    
    if (user.fullAddress) {
        document.getElementById('address').value = user.fullAddress;
    }
    
    if (user.province) {
        document.getElementById('provinceSelect').value = user.province;
    }
    
    if (user.ward) {
        document.getElementById('wardSelect').value = user.ward;
    }
    
    if (user.street) {
        document.getElementById('addressStreet').value = user.street;
    }
    
    if (user.gender) {
        document.getElementById('gender').value = user.gender;
    }
    
    // Update additional info
    if (user.createdAt) {
        const joinDate = new Date(user.createdAt).toLocaleDateString('vi-VN');
        document.getElementById('joinDate').textContent = joinDate;
    }
    
    // Update user role
    if (user.role) {
        document.getElementById('userRole').textContent = user.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng';
    }
    
    // Update account status (mock data for now)
    document.getElementById('accountStatus').textContent = 'Vàng';
    
    // Update header user info
    updateHeaderUserInfo(user);
    
    // Update avatar initials
    updateAvatarInitials();
}

// Load user orders
async function loadUserOrders() {
    try {
        const response = await userAPI.getOrders();
        if (response.success) {
            updateOrdersUI(response.data);
            updateOrderStats(response.data);
        } else {
            console.error('Failed to load orders:', response.message);
            updateOrdersUI([]);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        updateOrdersUI([]);
    }
}

// Update order statistics
function updateOrderStats(orders) {
    const totalOrders = orders ? orders.length : 0;
    document.getElementById('totalOrders').textContent = `${totalOrders} đơn`;
    
    // Calculate loyalty points (mock calculation)
    const totalSpent = orders ? orders.reduce((sum, order) => sum + (order.total || 0), 0) : 0;
    const loyaltyPoints = Math.floor(totalSpent / 1000); // 1 point per 1000 VND
    document.getElementById('loyaltyPoints').textContent = `${loyaltyPoints.toLocaleString()} điểm`;
}

// Update orders UI
function updateOrdersUI(orders) {
    const ordersList = document.querySelector('.orders-list');
    if (!ordersList) return;
    
    ordersList.innerHTML = '';
    
    if (!orders || orders.length === 0) {
        ordersList.innerHTML = '<div class="no-orders">Bạn chưa có đơn hàng nào.</div>';
        return;
    }
    
    orders.forEach(order => {
        const orderElement = createOrderElement(order);
        ordersList.appendChild(orderElement);
    });
}

// Create order element
function createOrderElement(order) {
    const orderDiv = document.createElement('div');
    orderDiv.className = 'order-item';
    orderDiv.setAttribute('data-status', order.status || 'pending');
    
    const statusClass = getStatusClass(order.status);
    const statusText = getStatusText(order.status);
    
    orderDiv.innerHTML = `
        <div class="order-image">
            <img src="${order.productImage || 'https://via.placeholder.com/120x120'}" alt="${order.productName || 'Sản phẩm'}" class="product-image">
        </div>
        <div class="order-info">
            <h4>${order.productName || 'Sản phẩm'}</h4>
            <p class="order-price">${formatPrice(order.total || 0)}</p>
            <p class="order-date">Ngày đặt: ${formatDate(order.createdAt)}</p>
            <span class="order-status ${statusClass}">${statusText}</span>
        </div>
        <div class="order-actions">
            <button class="btn-secondary" onclick="handleViewDetails(this.closest('.order-item'))">Xem chi tiết</button>
            ${order.status === 'completed' ? '<button class="btn-success" onclick="handleBuyAgain(this.closest(\'.order-item\'))">Mua lại</button>' : ''}
            ${order.status === 'pending' ? '<button class="btn-danger" onclick="handleCancelOrder(this.closest(\'.order-item\'))">Hủy đơn</button>' : ''}
        </div>
    `;
    
    return orderDiv;
}

// Helper functions
function getStatusClass(status) {
    const statusMap = {
        'pending': 'pending',
        'confirmed': 'shipping',
        'shipping': 'shipping',
        'completed': 'completed',
        'cancelled': 'cancelled'
    };
    return statusMap[status] || 'pending';
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Chờ thanh toán',
        'confirmed': 'Chờ giao hàng',
        'shipping': 'Chờ giao hàng',
        'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy'
    };
    return statusMap[status] || 'Chờ xử lý';
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('vi-VN');
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
          loadUserOrders();
      } else if (sectionId === 'notifications') {
          loadNotifications();
      }
    })
  })
  
  // Order tabs functionality
  // - Lọc đơn hàng theo data-status (all, delivered, cancelled,...)
  document.querySelectorAll(".order-tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      // Remove active class from all tabs
      document.querySelectorAll(".order-tab").forEach((t) => t.classList.remove("active"))
      this.classList.add("active")
  
      const status = this.getAttribute("data-status")
      const orders = document.querySelectorAll(".order-item")
  
      orders.forEach((order) => {
        if (status === "all" || order.getAttribute("data-status") === status) {
          order.style.display = "flex"
        } else {
          order.style.display = "none"
        }
      })
    })
  })
  
  // Mark all notifications as read
  // - Chuyển tất cả .notification-item.unread -> .read và cập nhật giao diện
  document.querySelector(".mark-all-read").addEventListener("click", () => {
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
    document.querySelector(".notification-count").textContent = "0"
    document.querySelector(".notification-alert").style.display = "none"
  })
  
  // Individual notification mark as read
  // - Gắn listener cho từng nút "Đánh dấu đã đọc"
  document.querySelectorAll(".notification-item .btn-primary").forEach((button) => {
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
    
    if (!notifications || notifications.length === 0) {
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

  // Initialize username synchronization on page load
  document.addEventListener("DOMContentLoaded", async () => {
    // Check authentication first
    if (!checkAuth()) {
      return;
    }
    
    // Show loading state
    showLoadingState();
    
    // Load all data from APIs
    try {
      await Promise.all([
        loadUserProfile(),
        loadUserOrders(),
        loadNotifications()
      ]);
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
    function getInitials(fullName) {
      if (!fullName) return 'U'
      const parts = fullName.trim().split(/\s+/).filter(Boolean)
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
      const first = parts[0].charAt(0).toUpperCase()
      const last = parts[parts.length - 1].charAt(0).toUpperCase()
      return (first + last)
    }

    // updateAvatarInitials:
    // - Cập nhật initials ở placeholder trên trang profile và sidebar (khi không có ảnh)
    function updateAvatarInitials() {
      const name = document.getElementById('fullName')?.value || ''
      const initials = getInitials(name)
      // profile placeholder inside profile page
      const span = document.querySelector('#profileAvatarPlaceholder #avatarInitial') || document.querySelector('#profileAvatarPlaceholder span')
      if (span) span.textContent = initials

      // sidebar avatar only when no image set
      const sidebarImg = sidebarAvatar.querySelector('img')
      if (!sidebarImg) {
        sidebarAvatar.innerHTML = `<span>${initials}</span>`
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
        sidebarAvatar.innerHTML = `<img id="sidebarAvatarImg" src="${dataUrl}" alt="User avatar">`
      } else {
        // revert to placeholder initials in sidebar
        profileImg.src = ''
        profileImg.style.display = 'none'
        placeholder.style.display = 'block'
        // use initials (first + last) instead of single letter
        const initials = getInitials(document.getElementById('fullName')?.value || '')
        sidebarAvatar.innerHTML = `<span>${initials}</span>`
        // ensure profile placeholder initial is synced
        const pSpan = document.querySelector('#profileAvatarPlaceholder #avatarInitial') || document.querySelector('#profileAvatarPlaceholder span')
        if (pSpan) pSpan.textContent = initials
      }
    }

    // Load stored avatar from localStorage (nếu có)
    const storedAvatar = localStorage.getItem('profileAvatar')
    applyAvatarData(storedAvatar)

    // Wire up avatar input and buttons
    const avatarInput = document.getElementById('avatarInput')
    const changeAvatarBtn = document.getElementById('changeAvatarBtn')
    const removeAvatarBtn = document.getElementById('removeAvatarBtn')

    // Mở file picker khi click vào nút đổi avatar
    changeAvatarBtn.addEventListener('click', () => avatarInput.click())

    // Khi người dùng chọn file ảnh
    avatarInput.addEventListener('change', (e) => {
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

      const reader = new FileReader()
      reader.onload = function (ev) {
        const dataUrl = ev.target.result
        // preview and persist to localStorage
        try {
          localStorage.setItem('profileAvatar', dataUrl)
        } catch (err) {
          console.warn('Không lưu được ảnh vào localStorage:', err)
        }
        applyAvatarData(dataUrl)
        removeAvatarBtn.style.display = 'inline-block'
      }
      reader.readAsDataURL(file)
    })

    // Remove avatar: xóa localStorage và trả về placeholder
    removeAvatarBtn.addEventListener('click', () => {
      // remove stored avatar
      localStorage.removeItem('profileAvatar')
      applyAvatarData(null)
      removeAvatarBtn.style.display = 'none'
    })

    // ensure initials reflect name at page load
    updateAvatarInitials()
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
    // Keep the original combined address input and add finer fields so user can pick province/ward/street
    { id: "addressStreet", type: "input" },
    { id: "provinceSelect", type: "select" },
    { id: "wardSelect", type: "select" },
    { id: "address", type: "input" }, // single full-address input (kept for validation/backwards compatibility)
  ]
  
  // Data holders for JSON
  let provincesData = {}
  let wardsData = {}
  
  // Load province.json and ward.json, populate selects and wire change handlers
  document.addEventListener("DOMContentLoaded", () => {
    const provinceSelect = document.getElementById("provinceSelect")
    const wardSelect = document.getElementById("wardSelect")
    const addressStreet = document.getElementById("addressStreet")
    const mainAddress = document.getElementById("address")
  
    // Helper to update the combined address input (street / wardName / provinceName)
    function updateCombinedAddress() {
      const street = addressStreet?.value?.trim() || ""
      const provinceCode = provinceSelect?.value || ""
      const wardCode = wardSelect?.value || ""
      const provinceName = provincesData[provinceCode] ? provincesData[provinceCode].name_with_type || provincesData[provinceCode].name : ""
      const wardName = (wardsData[wardCode] && (wardsData[wardCode].name_with_type || wardsData[wardCode].name)) || ""
  
      const parts = []
      if (street) parts.push(street)
      if (wardName) parts.push(wardName)
      if (provinceName) parts.push(provinceName)
  
      mainAddress.value = parts.join(" / ")
    }
  
    // Load provinces
    fetch("province.json")
      .then((r) => r.json())
      .then((data) => {
        provincesData = data
        if (provinceSelect) {
          provinceSelect.innerHTML = `<option value="">Chọn tỉnh/thành</option>`
          Object.keys(data).forEach((code) => {
            const p = data[code]
            const opt = document.createElement("option")
            opt.value = code
            opt.textContent = p.name_with_type || p.name
            provinceSelect.appendChild(opt)
          })
        }
      })
      .catch((err) => console.warn("Không tải được province.json:", err))
  
    // Load ward.json and expect ward objects to include name or name_with_type
    fetch("ward.json")
      .then((r) => r.json())
      .then((data) => {
        wardsData = data
      })
      .catch((err) => console.warn("Không tải được ward.json:", err))
  
    // When province changes, populate ward select with ward NAMES from ward.json
    provinceSelect?.addEventListener("change", () => {
      const selected = provinceSelect.value
      wardSelect.innerHTML = `<option value="">Chọn phường/xã</option>`
      if (!selected) {
        updateCombinedAddress()
        return
      }
      Object.keys(wardsData).forEach((wardCode) => {
        const w = wardsData[wardCode]
        if (w && w.parent_code === selected) {
          // Prefer name_with_type or name fields from ward.json
          const name = w.name_with_type || w.name
          if (name) {
            const opt = document.createElement("option")
            opt.value = wardCode
            opt.textContent = name
            wardSelect.appendChild(opt)
          }
        }
      })
      updateCombinedAddress()
    })
  
    // Update combined address when ward or street changes
    wardSelect?.addEventListener("change", updateCombinedAddress)
    addressStreet?.addEventListener("input", updateCombinedAddress)
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
      originalValues[field.id] = element ? element.value : ''
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
    const fullName = document.getElementById("fullName").value.trim()
    const phoneNumber = document.getElementById("phoneNumber").value.trim()
    const email = document.getElementById("email").value.trim()
    const address = document.getElementById("address").value.trim()
  
    if (!fullName || !phoneNumber || !email || !address) {
      showModal("Lỗi", "Vui lòng điền đầy đủ thông tin!", null, null)
      return
    }
  
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      showModal("Lỗi", "Email không hợp lệ!", null, null)
      return
    }
  
    // Phone validation (Vietnamese phone number)
    // - Lưu ý: regex hiện tại đơn giản, có thể điều chỉnh theo chuẩn chính xác
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/
    if (!phoneRegex.test(phoneNumber)) {
      showModal("Lỗi", "Số điện thoại không hợp lệ!", null, null)
      return
    }
  
    // Address validation: phải có 4 phần (Đường, Phường, Thành phố)
    const parts = parseAddressParts(address)
    const names = ["Đường", "Phường", "Thành phố"]
  
    let addressValid = false
  
    // Flow A: full-address string with 4 parts
    if (parts.length >= 4) {
      let ok = true
      for (let i = 0; i < 4; i++) {
        const val = parts[i] || ''
        if (!val) { ok = false; break }
        if (!hasLetter(val)) { ok = false; break }
      }
      addressValid = ok
    }
  
    // Flow B: use selects + street (accept street like '82 xuan thieu')
    if (!addressValid) {
      const hasProvince = provinceSelect && provinceSelect.value
      const hasWard = wardSelect && wardSelect.value
      const streetValue = (document.getElementById('addressStreet')?.value || '').trim()
      if (hasProvince && hasWard && streetValue && hasLetter(streetValue)) {
        addressValid = true
      }
    }
  
    if (!addressValid) {
      showModal("Lỗi", "Địa chỉ không hợp lệ. Bạn có thể nhập đầy đủ theo định dạng 'Đường, Phường, Thành phố' hoặc chọn Tỉnh/Phường rồi nhập Số nhà/Tên đường (ví dụ: '82 Xuan Thieu').", null, null)
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
            fullAddress: address,
            province: document.getElementById('provinceSelect').value,
            ward: document.getElementById('wardSelect').value,
            street: document.getElementById('addressStreet').value
          };
          
          // Call API to update profile
          const response = await userAPI.updateProfile(updateData);
          
          if (response.success) {
            updateDisplayName()
            syncUserName()
            
            showModal(
              "Thành công",
              "Cập nhật thông tin thành công!",
              () => {
                exitEditMode()
              },
              null,
            )
          } else {
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
          element.value = originalValues[field.id]
        })
  
        updateDisplayName()
        syncUserName()
  
        exitEditMode()
      },
      null,
    )
  }
  
  // Event listeners
  editBtn.addEventListener("click", toggleEditMode)
  saveBtn.addEventListener("click", saveChanges)
  cancelBtn.addEventListener("click", cancelChanges)
  
  // Order action buttons functionality
  // - Xử lý Xem chi tiết, Mua lại, Hủy đơn
  function handleViewDetails(orderElement) {
    const productName = orderElement.querySelector("h4").textContent
    const price = orderElement.querySelector(".order-price").textContent
    const date = orderElement.querySelector(".order-date").textContent
    const status = orderElement.querySelector(".order-status").textContent
  
    showModal(
      "Chi tiết đơn hàng",
      `Sản phẩm: ${productName}\nGiá: ${price}\n${date}\nTrạng thái: ${status}\n. Cảm ơn bạn đã mua hàng.`,
      null,
      null,
    )
  }
  
  function handleBuyAgain(orderElement) {
    const productName = orderElement.querySelector("h4").textContent
    const price = orderElement.querySelector(".order-price").textContent
  
    showModal(
      "Mua lại sản phẩm",
      `Bạn có muốn mua lại sản phẩm "${productName}" với giá ${price} không?`,
      () => {
        // Simulate adding to cart
        const cartCount = document.getElementById("hpCartCount")
        const currentCount = Number.parseInt(cartCount.textContent)
        cartCount.textContent = currentCount + 1
  
        showModal("Thành công", `Đã thêm "${productName}" vào giỏ hàng!`, null, null)
      },
      null,
    )
  }
  
  function handleCancelOrder(orderElement) {
    const productName = orderElement.querySelector("h4").textContent
  
    showModal(
      "Hủy đơn hàng",
      `Bạn có chắc chắn muốn hủy đơn hàng "${productName}" không?`,
      () => {
        // Update order status
        const statusElement = orderElement.querySelector(".order-status")
        statusElement.textContent = "Đã hủy"
        statusElement.className = "order-status cancelled"
  
        // Update order item data attribute
        orderElement.setAttribute("data-status", "cancelled")
  
        // Remove cancel button and add view details only
        const actionsDiv = orderElement.querySelector(".order-actions")
        actionsDiv.innerHTML = '<button class="btn-secondary">Xem chi tiết</button>'
  
        // Re-attach event listener for view details
        const viewBtn = actionsDiv.querySelector(".btn-secondary")
        viewBtn.addEventListener("click", () => handleViewDetails(orderElement))
  
        showModal("Thành công", "Đơn hàng đã được hủy thành công!", null, null)
      },
      null,
    )
  }
  
  // Attach event listeners to order buttons
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".order-item").forEach((orderItem) => {
      const viewBtn = orderItem.querySelector(".btn-secondary")
      const buyAgainBtn = orderItem.querySelector(".btn-success")
      const cancelBtn = orderItem.querySelector(".btn-danger")
  
      if (viewBtn) {
        viewBtn.addEventListener("click", () => handleViewDetails(orderItem))
      }
  
      if (buyAgainBtn) {
        buyAgainBtn.addEventListener("click", () => handleBuyAgain(orderItem))
      }
  
      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => handleCancelOrder(orderItem))
      }
    })
  })
  
  // Password Change Modal Functionality
  // - Mở/đóng modal, validate password, mô phỏng thay đổi mật khẩu
  const passwordModal = document.getElementById('passwordModal');
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const closePasswordModal = document.getElementById('closePasswordModal');
  const cancelPasswordChange = document.getElementById('cancelPasswordChange');
  const confirmPasswordChange = document.getElementById('confirmPasswordChange');
  const passwordChangeForm = document.getElementById('passwordChangeForm');
  
  // Open password modal
  changePasswordBtn.addEventListener('click', function() {
      passwordModal.classList.add('show');
      document.body.style.overflow = 'hidden';
      
      // Clear form
      passwordChangeForm.reset();
      document.getElementById('passwordError').style.display = 'none';
  });
  
  // Close password modal
  function closePasswordModalFunc() {
      passwordModal.classList.remove('show');
      document.body.style.overflow = 'auto';
      
      // Clear form
      passwordChangeForm.reset();
      document.getElementById('passwordError').style.display = 'none';
  }
  
  closePasswordModal.addEventListener('click', closePasswordModalFunc);
  cancelPasswordChange.addEventListener('click', closePasswordModalFunc);
  
  // Close modal when clicking overlay
  passwordModal.addEventListener('click', function(e) {
      if (e.target === passwordModal) {
          closePasswordModalFunc();
      }
  });
  
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
  
  // Real-time password validation feedback
  document.getElementById('newPassword').addEventListener('input', function() {
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
  
  document.getElementById('confirmPassword').addEventListener('input', function() {
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
  
  document.getElementById('viewLoginHistory').addEventListener('click', function() {
      showModal(
          'Lịch sử đăng nhập',
          'Bạn sẽ có thể xem chi tiết các lần đăng nhập và thiết bị được sử dụng.',
          null,
          null
      );
  });
  
  document.getElementById('manageDevices').addEventListener('click', function() {
      showModal(
          'Quản lý thiết bị',
          'Bạn sẽ có thể xem và đăng xuất khỏi các thiết bị khác.',
          null,
          null
      );
  });
  
  document.getElementById('deleteAccount').addEventListener('click', function() {
      showModal(
          'Xác nhận xóa tài khoản',
          'Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản này? Hành động này không thể hoàn tác và toàn bộ dữ liệu sẽ bị mất.',
          () => {
              showModal(
                  'Tài khoản đã được đánh dấu xóa',
                  'Tài khoản của bạn sẽ được xóa trong vòng 30 ngày. Bạn có thể khôi phục bằng cách đăng nhập lại trong thời gian này.',
                  null,
                  null
              );
          },
          null
      );
  });
  