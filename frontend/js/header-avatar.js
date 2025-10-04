

// Configuration
const HEADER_AVATAR_CONFIG = {
    // API endpoints
    PROFILE_ENDPOINT: '/users/profile',
    
    // Local storage keys
    TOKEN_KEYS: ['user_token', 'token', 'accessToken', 'authToken'],
    USER_DATA_KEY: 'user_data',
    ADMIN_TOKEN_KEY: 'admin_token',
    ADMIN_DATA_KEY: 'admin_data',
    
    // Element selectors
    SELECTORS: {
        userAvatar: '#hpUserAvatar',
        userInitials: '#hpUserInitials',
        userName: '#hpUserName',
        loginLink: '#hpLoginLink',
        logoutBtn: '#hpLogoutBtn',
        adminLink: '#hpAdminLink'
    },
    
    // Default values
    DEFAULT_INITIALS: 'U',
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    
    // Debug mode
    DEBUG: false
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Log function for debugging
function log(...args) {
    if (HEADER_AVATAR_CONFIG.DEBUG) {
        console.log('[Header Avatar]', ...args);
    }
}

// Check if element exists
function elementExists(selector) {
    return document.querySelector(selector) !== null;
}

// Safe element selector
function safeQuerySelector(selector) {
    try {
        return document.querySelector(selector);
    } catch (error) {
        log('Error selecting element:', selector, error);
        return null;
    }
}

// Safe text content update
function safeTextContent(element, text) {
    if (element && typeof text === 'string') {
        try {
            element.textContent = text;
            return true;
        } catch (error) {
            log('Error updating text content:', error);
            return false;
        }
    }
    return false;
}

// Safe visibility toggle
function safeToggleVisibility(element, show) {
    if (element) {
        try {
            element.hidden = !show;
            return true;
        } catch (error) {
            log('Error toggling visibility:', error);
            return false;
        }
    }
    return false;
}

// ========================================
// CORE FUNCTIONS
// ========================================

// Generate initials from full name
function generateInitials(fullName) {
    if (!fullName || typeof fullName !== 'string') {
        return HEADER_AVATAR_CONFIG.DEFAULT_INITIALS;
    }
    
    try {
        // Remove extra spaces and split by space
        const words = fullName.trim().split(/\s+/).filter(word => word.length > 0);
        
        if (words.length === 0) return HEADER_AVATAR_CONFIG.DEFAULT_INITIALS;
        if (words.length === 1) return words[0].charAt(0).toUpperCase();
        
        // Take first letter of first word and first letter of last word
        const firstInitial = words[0].charAt(0).toUpperCase();
        const lastInitial = words[words.length - 1].charAt(0).toUpperCase();
        
        return firstInitial + lastInitial;
    } catch (error) {
        log('Error generating initials:', error);
        return HEADER_AVATAR_CONFIG.DEFAULT_INITIALS;
    }
}

// Get authentication token
function getAuthToken() {
    // Priority: user_token > admin_token > legacy tokens
    let token = localStorage.getItem('user_token');
    if (!token) {
        token = localStorage.getItem('admin_token');
    }
    if (!token) {
        for (const key of ['token', 'accessToken', 'authToken']) {
            token = localStorage.getItem(key);
            if (token) break;
        }
    }
    return token;
}

// Check if user is authenticated
function isAuthenticated() {
    return getAuthToken() !== null;
}

// Get cached user data
function getCachedUserData() {
    try {
        // Priority: user_data > admin_data > legacy user
        let userData = localStorage.getItem('user_data');
        if (!userData) {
            userData = localStorage.getItem('admin_data');
        }
        if (!userData) {
            userData = localStorage.getItem('user');
        }
        
        if (userData) {
            const data = JSON.parse(userData);
            // If it's wrapped with timestamp, extract user
            if (data.timestamp && data.user) {
                return data.user;
            }
            // If it's direct user data
            return data;
        }
    } catch (error) {
        log('Error reading cached user data:', error);
    }
    return null;
}

// Cache user data
function cacheUserData(user) {
    try {
        // Store user data directly without timestamp wrapper
        localStorage.setItem('user_data', JSON.stringify(user));
    } catch (error) {
        log('Error caching user data:', error);
    }
}

// ========================================
// API FUNCTIONS
// ========================================

// Make API request with error handling
async function makeApiRequest(endpoint) {
    try {
        // Check if API service is available
        if (typeof window.apiService === 'undefined') {
            throw new Error('API service not available');
        }
        
        const response = await window.apiService.get(endpoint);
        return response;
    } catch (error) {
        log('API request failed:', error);
        throw error;
    }
}

// Load user profile from API
async function loadUserProfile() {
    try {
        // Check if user is authenticated
        if (!isAuthenticated()) {
            log('User not authenticated');
            return null;
        }
        
        // Try to get cached data first
        const cachedUser = getCachedUserData();
        if (cachedUser) {
            log('Using cached user data');
            return cachedUser;
        }
        
        // Load from API
        log('Loading user profile from API');
        const response = await makeApiRequest(HEADER_AVATAR_CONFIG.PROFILE_ENDPOINT);
        
        if (response && response.success && response.data) {
            // Cache the user data
            cacheUserData(response.data);
            return response.data;
        } else {
            log('API response invalid:', response);
            return null;
        }
    } catch (error) {
        log('Error loading user profile:', error);
        return null;
    }
}

// ========================================
// UI UPDATE FUNCTIONS
// ========================================

// Update header user info
function updateHeaderUserInfo(user) {
    log('Updating header user info:', user ? 'User logged in' : 'User logged out');
    
    try {
        // Get all elements
        const elements = {
            userAvatar: safeQuerySelector(HEADER_AVATAR_CONFIG.SELECTORS.userAvatar),
            userInitials: safeQuerySelector(HEADER_AVATAR_CONFIG.SELECTORS.userInitials),
            userName: safeQuerySelector(HEADER_AVATAR_CONFIG.SELECTORS.userName),
            loginLink: safeQuerySelector(HEADER_AVATAR_CONFIG.SELECTORS.loginLink),
            logoutBtn: safeQuerySelector(HEADER_AVATAR_CONFIG.SELECTORS.logoutBtn),
            adminLink: safeQuerySelector(HEADER_AVATAR_CONFIG.SELECTORS.adminLink)
        };
        
        if (user && user.fullName) {
            // User is logged in
            log('User logged in:', user.fullName);
            
            // Show/hide elements
            safeToggleVisibility(elements.userAvatar, true);
            safeToggleVisibility(elements.loginLink, false);
            safeToggleVisibility(elements.logoutBtn, true);
            
            // Update user info
            const initials = generateInitials(user.fullName);
            safeTextContent(elements.userInitials, initials);
            safeTextContent(elements.userName, user.fullName);
            
            // Show admin link if user is admin
            if (user.role === 'ADMIN' || user.role === 'admin') {
                safeToggleVisibility(elements.adminLink, true);
                log('Admin user detected, showing admin link');
            } else {
                safeToggleVisibility(elements.adminLink, false);
            }
            
        } else {
            // User is not logged in
            log('User not logged in');
            
            // Hide/show elements
            safeToggleVisibility(elements.userAvatar, false);
            safeToggleVisibility(elements.loginLink, true);
            safeToggleVisibility(elements.logoutBtn, false);
            safeToggleVisibility(elements.adminLink, false);
        }
        
        return true;
    } catch (error) {
        log('Error updating header user info:', error);
        return false;
    }
}

// ========================================
// EVENT HANDLERS
// ========================================

// Handle logout
function handleLogout() {
    try {
        log('User logging out');
        
        // Clear user-specific data only
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_data');
        
        // Use auth context manager if available
        if (typeof window.authContextManager !== 'undefined') {
            window.authContextManager.logoutUser();
        }
        
        // Update UI
        updateHeaderUserInfo(null);
        
        // Redirect to login page
        window.location.href = '../../index.html';
        
    } catch (error) {
        log('Error during logout:', error);
    }
}

// Setup logout button event listener
function setupLogoutButton() {
    const logoutBtn = safeQuerySelector(HEADER_AVATAR_CONFIG.SELECTORS.logoutBtn);
    if (logoutBtn) {
        // Remove existing listeners
        logoutBtn.removeEventListener('click', handleLogout);
        // Add new listener
        logoutBtn.addEventListener('click', handleLogout);
        log('Logout button event listener setup');
    }
}

// ========================================
// INITIALIZATION FUNCTIONS
// ========================================

// Check authentication and update header
async function checkAuthAndUpdateHeader() {
    try {
        log('Checking authentication status');
        
        if (isAuthenticated()) {
            // User is logged in, load profile
            const user = await loadUserProfile();
            updateHeaderUserInfo(user);
        } else {
            // User is not logged in
            updateHeaderUserInfo(null);
        }
        
        // Setup logout button
        setupLogoutButton();
        
    } catch (error) {
        log('Error in checkAuthAndUpdateHeader:', error);
        // Fallback: show logged out state
        updateHeaderUserInfo(null);
    }
}

// Initialize header avatar
function initializeHeaderAvatar() {
    log('Initializing header avatar');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAuthAndUpdateHeader);
    } else {
        // DOM is already ready
        checkAuthAndUpdateHeader();
    }
}

// ========================================
// PUBLIC API
// ========================================

// Refresh user data (useful after profile updates)
async function refreshUserData() {
    log('Refreshing user data');
    
    // Clear user data cache
    localStorage.removeItem('user_data');
    
    // Reload and update
    await checkAuthAndUpdateHeader();
}

// Force update header (useful for manual updates)
function forceUpdateHeader(user) {
    log('Force updating header with user:', user);
    updateHeaderUserInfo(user);
}

// ========================================
// AUTO-INITIALIZATION
// ========================================

// Initialize when script loads
initializeHeaderAvatar();

// ========================================
// EXPORT FUNCTIONS
// ========================================

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    window.HeaderAvatar = {
        // Core functions
        generateInitials,
        updateHeaderUserInfo,
        loadUserProfile,
        checkAuthAndUpdateHeader,
        refreshUserData,
        forceUpdateHeader,
        
        // Utility functions
        isAuthenticated,
        getAuthToken,
        
        // Configuration
        config: HEADER_AVATAR_CONFIG
    };
    
    // Backward compatibility
    window.generateInitials = generateInitials;
    window.updateHeaderUserInfo = updateHeaderUserInfo;
    window.loadUserProfileForHeader = loadUserProfile;
    window.checkAuthAndUpdateHeader = checkAuthAndUpdateHeader;
}

// ========================================
// DEBUG MODE
// ========================================

// Enable debug mode in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    HEADER_AVATAR_CONFIG.DEBUG = true;
    log('Debug mode enabled');
}