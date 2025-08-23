// Main application logic
class App {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showLoginForm(); // Start with login form
    }

    setupEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('loginFormElement');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form submission
        const registerForm = document.getElementById('registerFormElement');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Notification close button
        const notificationClose = document.querySelector('.notification-close');
        if (notificationClose) {
            notificationClose.addEventListener('click', () => this.hideNotification());
        }
    }

    // Form switching functions
    showLoginForm() {
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('registerForm').classList.add('hidden');
        document.querySelector('.page-title').textContent = 'Đăng Nhập';
    }

    showRegisterForm() {
        document.getElementById('registerForm').classList.remove('hidden');
        document.getElementById('loginForm').classList.add('hidden');
        document.querySelector('.page-title').textContent = 'Đăng Kí';
    }

    // Handle login form submission
    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const isAdmin = document.getElementById('loginAsAdmin').checked;

        if (!username || !password) {
            this.showNotification('Vui lòng điền đầy đủ thông tin', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            const response = await apiService.post('/auth/login', {
                username: username,
                password: password,
                isAdmin: isAdmin
            });

            if (response.success) {
                this.currentUser = response.data.user;
                localStorage.setItem('token', response.data.accessToken);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                
                this.showNotification('Đăng nhập thành công!', 'success');
                
                // Redirect to dashboard or home page after successful login
                setTimeout(() => {
                    this.redirectToHome();
                }, 1500);
            } else {
                this.showNotification(response.message || 'Đăng nhập thất bại', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Có lỗi xảy ra khi đăng nhập', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Handle register form submission
    async handleRegister(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('registerFullName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const phone = document.getElementById('registerPhone').value.trim();
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();

        // Validation
        if (!fullName || !email || !phone || !username || !password || !confirmPassword) {
            this.showNotification('Vui lòng điền đầy đủ thông tin', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('Mật khẩu xác nhận không khớp', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('Mật khẩu phải có ít nhất 6 ký tự', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            const response = await apiService.post('/auth/register', {
                fullName: fullName,
                email: email,
                phone: phone,
                username: username,
                password: password,
                confirmPassword: confirmPassword
            });

            if (response.success) {
                this.showNotification('Đăng ký thành công! Vui lòng đăng nhập', 'success');
                
                // Clear form and switch to login
                setTimeout(() => {
                    this.clearRegisterForm();
                    this.showLoginForm();
                }, 1500);
            } else {
                this.showNotification(response.message || 'Đăng ký thất bại', 'error');
            }
        } catch (error) {
            console.error('Register error:', error);
            this.showNotification('Có lỗi xảy ra khi đăng ký', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Clear register form
    clearRegisterForm() {
        document.getElementById('registerFormElement').reset();
    }

    // Redirect to home page after login
    redirectToHome() {
        // For now, just show a message. You can implement actual redirection later
        this.showNotification('Chuyển hướng đến trang chủ...', 'success');
        
        // Example: window.location.href = '/dashboard.html';
        // or create a new page for logged-in users
    }

    // Show/hide loading spinner
    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            if (show) {
                spinner.classList.remove('hidden');
            } else {
                spinner.classList.add('hidden');
            }
        }
    }

    // Show notification
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const messageEl = notification.querySelector('.notification-message');
        
        if (notification && messageEl) {
            messageEl.textContent = message;
            notification.className = `notification ${type}`;
            notification.classList.remove('hidden');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.hideNotification();
            }, 5000);
        }
    }

    // Hide notification
    hideNotification() {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.classList.add('hidden');
        }
    }
}

// Global functions for onclick handlers
function showLoginForm() {
    if (window.app) {
        window.app.showLoginForm();
    }
}

function showRegisterForm() {
    if (window.app) {
        window.app.showRegisterForm();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
