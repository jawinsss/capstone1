// Admin Login JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const notification = document.getElementById('notification');
    const notificationMessage = notification.querySelector('.notification-message');
    const notificationClose = notification.querySelector('.notification-close');

    // Show notification
    function showNotification(message, type = 'error') {
        notificationMessage.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            hideNotification();
        }, 5000);
    }

    // Hide notification
    function hideNotification() {
        notification.classList.add('hidden');
    }

    // Show loading spinner
    function showLoading() {
        loadingSpinner.classList.remove('hidden');
    }

    // Hide loading spinner
    function hideLoading() {
        loadingSpinner.classList.add('hidden');
    }

    // Handle form submission
    adminLoginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value.trim();
        
        // Validate inputs
        if (!username || !password) {
            showNotification('Vui lòng nhập đầy đủ thông tin đăng nhập!', 'error');
            return;
        }
        
        // Show loading
        showLoading();
        
        try {
            // Call API to authenticate admin
            const response = await apiService.post('/auth/login', {
                username: username,
                password: password,
                isAdmin: true
            });

            if (response.success) {
                // Login successful
                showNotification(`Đăng nhập thành công! Chào mừng ${response.data.user.fullName || response.data.user.username}!`, 'success');
                
                // Store admin token and data separately
                localStorage.setItem('admin_token', response.data.accessToken);
                localStorage.setItem('admin_data', JSON.stringify(response.data.user));
                // Also store in legacy keys for backward compatibility
                localStorage.setItem('token', response.data.accessToken);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                
                // Update admin avatar immediately if on admin page
                if (typeof window.adminAvatarManager !== 'undefined') {
                    window.adminAvatarManager.updateAdminUI(response.data.user);
                }
                
                // Redirect to admin dashboard after 2 seconds
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 2000);
            } else {
                // Login failed
                showNotification('Tên đăng nhập hoặc mật khẩu không đúng!', 'error');
            }
        } catch (error) {
            console.error('Admin login error:', error);
            showNotification('Tên đăng nhập hoặc mật khẩu không đúng!', 'error');
        } finally {
            hideLoading();
        }
    });

    // Close notification when clicking X
    notificationClose.addEventListener('click', hideNotification);

    // Close notification when clicking outside
    notification.addEventListener('click', function(e) {
        if (e.target === notification) {
            hideNotification();
        }
    });

    // Add some visual feedback for form inputs
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });

    // Add enter key support for better UX
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !loadingSpinner.classList.contains('hidden')) {
            return; // Don't submit if loading
        }
    });
});
