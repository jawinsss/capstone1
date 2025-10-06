// Configuration file for the application
const CONFIG = {
    // API Configuration
    API_BASE_URL: 'http://localhost:3000',
    API_ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
        },
        USERS: {
            PROFILE: '/users/profile',
            UPDATE: '/users/profile',
            CREATE: '/users',
            LIST: '/users',
        },
        PRODUCTS: {
            LIST: '/products',
            DETAIL: '/products',
            CREATE: '/products',
            UPDATE: '/products',
            DELETE: '/products',
        },
        CATEGORIES: {
            LIST: '/categories',
            HIERARCHY: '/categories/hierarchy',
            DETAIL: '/categories',
        },
        ORDERS: {
            LIST: '/orders',
            CREATE: '/orders',
            DETAIL: '/orders',
            UPDATE: '/orders',
            CANCEL: '/orders',
        },
    },

    // Local Storage Keys
    STORAGE_KEYS: {
        AUTH_TOKEN: 'auth_token',
        USER_INFO: 'user_info',
        CART_ITEMS: 'cart_items',
        // Separate keys for admin and user
        USER_TOKEN: 'user_token',
        USER_DATA: 'user_data',
        ADMIN_TOKEN: 'admin_token',
        ADMIN_DATA: 'admin_data',
    },

    // Pagination
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 50,

    // UI Configuration
    ANIMATION_DURATION: 300,
    LOADING_TIMEOUT: 10000,

    // Validation Rules
    VALIDATION: {
        PASSWORD_MIN_LENGTH: 6,
        USERNAME_MIN_LENGTH: 3,
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },

    // Error Messages
    ERROR_MESSAGES: {
        NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng kiểm tra lại kết nối.',
        UNAUTHORIZED: 'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.',
        FORBIDDEN: 'Bạn không có quyền thực hiện hành động này.',
        NOT_FOUND: 'Không tìm thấy dữ liệu yêu cầu.',
        VALIDATION_ERROR: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
        SERVER_ERROR: 'Lỗi máy chủ. Vui lòng thử lại sau.',
        UNKNOWN_ERROR: 'Đã xảy ra lỗi không xác định.',
    },

    // Success Messages
    SUCCESS_MESSAGES: {
        LOGIN_SUCCESS: 'Đăng nhập thành công!',
        REGISTER_SUCCESS: 'Đăng ký thành công!',
        LOGOUT_SUCCESS: 'Đăng xuất thành công!',
        UPDATE_SUCCESS: 'Cập nhật thành công!',
        DELETE_SUCCESS: 'Xóa thành công!',
        CREATE_SUCCESS: 'Tạo thành công!',
    },

    // Currency Format
    CURRENCY: {
        SYMBOL: '₫',
        LOCALE: 'vi-VN',
        OPTIONS: {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        },
    },

    // Date Format
    DATE_FORMAT: {
        LOCALE: 'vi-VN',
        OPTIONS: {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        },
    },
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
