class ApiService {
    constructor() {
        // Resolve base URL priority: URL query (?api=), localStorage, window.CONFIG, default
        try {
            const params = new URLSearchParams(window.location.search);
            const apiFromQuery = params.get('api');
            if (apiFromQuery) {
                localStorage.setItem('API_BASE_URL', apiFromQuery);
            }
        } catch (_) { }

        const baseFromStorage = (typeof localStorage !== 'undefined') ? localStorage.getItem('API_BASE_URL') : null;
        const baseFromConfig = (typeof window !== 'undefined' && window.CONFIG && window.CONFIG.API_BASE_URL) ? window.CONFIG.API_BASE_URL : null;
        this.baseURL = baseFromStorage || baseFromConfig || 'http://localhost:3000';
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };

        // Add authorization header if token exists
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, { mode: 'cors', ...config });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return {
                success: true,
                data: data,
                message: data.message
            };
        } catch (error) {
            console.error('API request failed:', error);
            return {
                success: false,
                message: error.message || 'Có lỗi xảy ra khi kết nối đến server'
            };
        }
    }

    // GET request
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // PUT request
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // PATCH request
    async patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// Create global instance and expose to window
const apiService = new ApiService();
if (typeof window !== 'undefined') {
    window.apiService = apiService;
}
