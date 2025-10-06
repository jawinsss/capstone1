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

    // Update current context based on available tokens and current page
    updateCurrentContext() {
        const userToken = localStorage.getItem('user_token');
        const adminToken = localStorage.getItem('admin_token');

        if (userToken && adminToken) {
            // Both contexts exist - determine priority based on current page
            const currentPath = window.location.pathname;
            if (currentPath.includes('admin') || currentPath.includes('adminpage')) {
                this.currentContext = 'admin';
                console.log('AuthContext: Switched to admin context (both tokens exist)');
            } else {
                this.currentContext = 'user';
                console.log('AuthContext: Switched to user context (both tokens exist)');
            }
        } else if (userToken) {
            this.currentContext = 'user';
            console.log('AuthContext: Set to user context (user token only)');
        } else if (adminToken) {
            this.currentContext = 'admin';
            console.log('AuthContext: Set to admin context (admin token only)');
        } else {
            this.currentContext = null;
            console.log('AuthContext: No context (no tokens)');
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
        console.log('AuthContext: Logging out user context');
        console.log('AuthContext: Before logout - user_token:', !!localStorage.getItem('user_token'));
        console.log('AuthContext: Before logout - admin_token:', !!localStorage.getItem('admin_token'));
        
        this.clearContext('user');
        
        console.log('AuthContext: After logout - user_token:', !!localStorage.getItem('user_token'));
        console.log('AuthContext: After logout - admin_token:', !!localStorage.getItem('admin_token'));
    }

    // Logout admin (only clear admin context)
    logoutAdmin() {
        console.log('AuthContext: Logging out admin context');
        console.log('AuthContext: Before logout - user_token:', !!localStorage.getItem('user_token'));
        console.log('AuthContext: Before logout - admin_token:', !!localStorage.getItem('admin_token'));
        
        this.clearContext('admin');
        
        console.log('AuthContext: After logout - user_token:', !!localStorage.getItem('user_token'));
        console.log('AuthContext: After logout - admin_token:', !!localStorage.getItem('admin_token'));
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

    // Switch to specific context
    switchContext(context) {
        if (context === 'user' && localStorage.getItem('user_token')) {
            this.currentContext = 'user';
            this.dispatchAuthContextChanged();
            return true;
        } else if (context === 'admin' && localStorage.getItem('admin_token')) {
            this.currentContext = 'admin';
            this.dispatchAuthContextChanged();
            return true;
        }
        return false;
    }

    // Force context update based on current page
    forceContextUpdate() {
        this.updateCurrentContext();
        this.dispatchAuthContextChanged();
    }

    // Force switch to specific context (useful for admin pages)
    forceSwitchToAdmin() {
        const adminToken = localStorage.getItem('admin_token');
        if (adminToken) {
            this.currentContext = 'admin';
            console.log('AuthContext: Force switched to admin context');
            this.dispatchAuthContextChanged();
            return true;
        }
        return false;
    }

    // Force switch to user context (useful for user pages)
    forceSwitchToUser() {
        const userToken = localStorage.getItem('user_token');
        if (userToken) {
            this.currentContext = 'user';
            console.log('AuthContext: Force switched to user context');
            this.dispatchAuthContextChanged();
            return true;
        }
        return false;
    }
}

// Initialize global instance
window.authContextManager = new AuthContextManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthContextManager;
}
