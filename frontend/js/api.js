// API service for making HTTP requests
class ApiService {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.timeout = CONFIG.LOADING_TIMEOUT;
    }

    // Get authentication token from localStorage
    getAuthToken() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    }

    // Get default headers for requests
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (includeAuth) {
            const token = this.getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    // Make HTTP request with timeout
    async request(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: this.getHeaders(options.includeAuth !== false),
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            
            throw error;
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const url = new URL(this.baseURL + endpoint);
        
        // Add query parameters
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });

        return this.request(url.toString(), {
            method: 'GET',
        });
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.request(this.baseURL + endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.request(this.baseURL + endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // PATCH request
    async patch(endpoint, data = {}) {
        return this.request(this.baseURL + endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(this.baseURL + endpoint, {
            method: 'DELETE',
        });
    }

    // Handle API errors
    handleError(error) {
        console.error('API Error:', error);

        let message = CONFIG.ERROR_MESSAGES.UNKNOWN_ERROR;

        if (error.message.includes('401')) {
            message = CONFIG.ERROR_MESSAGES.UNAUTHORIZED;
            this.handleUnauthorized();
        } else if (error.message.includes('403')) {
            message = CONFIG.ERROR_MESSAGES.FORBIDDEN;
        } else if (error.message.includes('404')) {
            message = CONFIG.ERROR_MESSAGES.NOT_FOUND;
        } else if (error.message.includes('422')) {
            message = CONFIG.ERROR_MESSAGES.VALIDATION_ERROR;
        } else if (error.message.includes('500')) {
            message = CONFIG.ERROR_MESSAGES.SERVER_ERROR;
        } else if (error.message.includes('timeout')) {
            message = 'Request timeout. Vui lòng thử lại.';
        } else if (error.message.includes('Failed to fetch')) {
            message = CONFIG.ERROR_MESSAGES.NETWORK_ERROR;
        }

        this.showNotification(message, 'error');
        return message;
    }

    // Handle unauthorized access
    handleUnauthorized() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_INFO);
        
        // Redirect to login or show login modal
        if (window.location.pathname !== '/') {
            window.location.href = '/';
        } else {
            // Show login modal
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.click();
            }
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;

        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        // Add to page
        document.body.appendChild(notification);

        // Add CSS animation
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Test API connection
    async testConnection() {
        try {
            await this.get('/health');
            return true;
        } catch (error) {
            console.error('API connection test failed:', error);
            return false;
        }
    }
}

// Create global API service instance
const apiService = new ApiService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
} else {
    window.apiService = apiService;
}
