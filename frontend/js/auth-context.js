// Authentication Context Manager
// Manages separate authentication contexts for user and admin

class AuthContextManager {
    constructor() {
        this.currentContext = null;
        this.init();
    }

    init() {
        // Check current context on load
        this.updateCurrentContext();
        
        // Listen for storage changes to detect context switches
        window.addEventListener('storage', (e) => {
            if (e.key === 'user_token' || e.key === 'admin_token' || 
                e.key === 'user_data' || e.key === 'admin_data') {
                this.updateCurrentContext();
                this.dispatchAuthContextChanged();
            }
        });
    }

    // Get current authentication context
    getCurrentContext() {
        return this.currentContext;
    }

    // Get current context info
    getCurrentContextInfo() {
        const userToken = localStorage.getItem('user_token');
        const adminToken = localStorage.getItem('admin_token');
        const userData = this.getCachedUserData();
        const adminData = this.getCachedAdminData();

        return {
            context: this.currentContext,
            userToken,
            adminToken,
            userData,
            adminData,
            isUserLoggedIn: !!userToken,
            isAdminLoggedIn: !!adminToken
        };
    }

    // Update current context based on available tokens
    updateCurrentContext() {
        const userToken = localStorage.getItem('user_token');
        const adminToken = localStorage.getItem('admin_token');

        if (userToken && adminToken) {
            // Both contexts exist - determine priority
            this.currentContext = 'user'; // User takes priority
        } else if (userToken) {
            this.currentContext = 'user';
        } else if (adminToken) {
            this.currentContext = 'admin';
        } else {
            this.currentContext = null;
        }
    }

    // Get cached user data
    getCachedUserData() {
        try {
            const userData = localStorage.getItem('user_data');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }

    // Get cached admin data
    getCachedAdminData() {
        try {
            const adminData = localStorage.getItem('admin_data');
            return adminData ? JSON.parse(adminData) : null;
        } catch (error) {
            console.error('Error parsing admin data:', error);
            return null;
        }
    }

    // Clear specific context
    clearContext(context) {
        if (context === 'user') {
            localStorage.removeItem('user_token');
            localStorage.removeItem('user_data');
        } else if (context === 'admin') {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_data');
        }
        this.updateCurrentContext();
        this.dispatchAuthContextChanged();
    }

    // Clear all contexts
    clearAllContexts() {
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_data');
        // Also clear legacy keys
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.updateCurrentContext();
        this.dispatchAuthContextChanged();
    }

    // Logout user (only clear user context)
    logoutUser() {
        this.clearContext('user');
    }

    // Logout admin (only clear admin context)
    logoutAdmin() {
        this.clearContext('admin');
    }

    // Dispatch auth context changed event
    dispatchAuthContextChanged() {
        const event = new CustomEvent('authContextChanged', {
            detail: this.getCurrentContextInfo()
        });
        window.dispatchEvent(event);
    }

    // Check if user is authenticated in current context
    isAuthenticated() {
        return this.currentContext !== null;
    }

    // Get current user data based on context
    getCurrentUserData() {
        if (this.currentContext === 'user') {
            return this.getCachedUserData();
        } else if (this.currentContext === 'admin') {
            return this.getCachedAdminData();
        }
        return null;
    }

    // Get current token based on context
    getCurrentToken() {
        if (this.currentContext === 'user') {
            return localStorage.getItem('user_token');
        } else if (this.currentContext === 'admin') {
            return localStorage.getItem('admin_token');
        }
        return null;
    }
}

// Initialize global instance
window.authContextManager = new AuthContextManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthContextManager;
}
