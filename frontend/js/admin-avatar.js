

class AdminAvatarManager {
    constructor() {
        this.adminData = null;
        this.init();
    }

    init() {
        // Load admin data on initialization
        this.loadAdminData();
        
        // Listen for auth context changes
        window.addEventListener('authContextChanged', (e) => {
            console.log('AdminAvatar: Auth context changed to:', e.detail.context);
            if (e.detail.context === 'admin') {
                this.loadAdminData();
            } else {
                // Clear admin UI when context is not admin
                this.clearAdminUI();
            }
        });
    }

    // Load admin data from localStorage or API
    async loadAdminData() {
        try {
            // Check if admin token exists first
            const adminToken = localStorage.getItem('admin_token');
            if (!adminToken) {
                console.log('AdminAvatar: No admin token found, clearing UI');
                this.clearAdminUI();
                return;
            }

            // Try to get from localStorage first
            const adminData = localStorage.getItem('admin_data');
            if (adminData) {
                this.adminData = JSON.parse(adminData);
                this.updateAdminUI(this.adminData);
                return;
            }

            // If not in localStorage, try to get from API
            if (typeof window.apiService !== 'undefined') {
                const response = await window.apiService.get('/users/profile');
                if (response.success) {
                    this.adminData = response.data;
                    localStorage.setItem('admin_data', JSON.stringify(this.adminData));
                    this.updateAdminUI(this.adminData);
                } else {
                    console.log('AdminAvatar: Failed to load admin data from API');
                    this.clearAdminUI();
                }
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
            this.clearAdminUI();
        }
    }

    // Update admin UI with data
    updateAdminUI(adminData) {
        if (!adminData) return;

        try {
            // Update admin full name
            const adminFullName = document.getElementById('adminFullName');
            if (adminFullName) {
                adminFullName.textContent = adminData.fullName || adminData.username || 'Admin';
            }

            // Update admin role
            const adminRole = document.getElementById('adminRole');
            if (adminRole) {
                adminRole.textContent = 'Quản trị hệ thống';
            }

            // Update admin avatar
            this.updateAdminAvatar(adminData);

        } catch (error) {
            console.error('Error updating admin UI:', error);
        }
    }

    // Clear admin UI when context is not admin
    clearAdminUI() {
        try {
            console.log('AdminAvatar: Clearing admin UI');
            
            // Clear admin full name
            const adminFullName = document.getElementById('adminFullName');
            if (adminFullName) {
                adminFullName.textContent = 'Admin';
            }

            // Clear admin role
            const adminRole = document.getElementById('adminRole');
            if (adminRole) {
                adminRole.textContent = 'Quản trị hệ thống';
            }

            // Clear admin avatar
            const adminInitials = document.getElementById('adminInitials');
            if (adminInitials) {
                adminInitials.textContent = 'A';
            }

            // Clear admin data
            this.adminData = null;

        } catch (error) {
            console.error('Error clearing admin UI:', error);
        }
    }

    // Update admin avatar (initials or image)
    updateAdminAvatar(adminData) {
        try {
            const adminAvatar = document.getElementById('adminAvatar');
            const adminInitials = document.getElementById('adminInitials');
            
            if (!adminAvatar || !adminInitials) return;

            // Clear any existing avatar image
            const existingImg = adminAvatar.querySelector('.admin-avatar-image');
            if (existingImg) {
                existingImg.remove();
            }

            // Check if admin has avatar image
            if (adminData.avatar && adminData.avatar.trim() !== '') {
                // Create image element
                const img = document.createElement('img');
                img.className = 'admin-avatar-image';
                img.src = adminData.avatar;
                img.alt = adminData.fullName || adminData.username || 'Admin';
                img.onerror = () => {
                    // If image fails to load, show initials
                    img.remove();
                    this.showAdminInitials(adminData);
                };
                
                // Hide initials and show image
                adminInitials.style.display = 'none';
                adminAvatar.appendChild(img);
            } else {
                // Show initials
                this.showAdminInitials(adminData);
            }

        } catch (error) {
            console.error('Error updating admin avatar:', error);
        }
    }

    // Show admin initials
    showAdminInitials(adminData) {
        try {
            const adminInitials = document.getElementById('adminInitials');
            if (!adminInitials) return;

            // Generate initials from full name or username
            const fullName = adminData.fullName || adminData.username || 'Admin';
            const initials = this.generateInitials(fullName);
            
            adminInitials.textContent = initials;
            adminInitials.style.display = 'block';

        } catch (error) {
            console.error('Error showing admin initials:', error);
        }
    }

    // Generate initials from full name
    generateInitials(fullName) {
        if (!fullName || typeof fullName !== 'string') {
            return 'A';
        }
        
        try {
            // Remove extra spaces and split by space
            const words = fullName.trim().split(/\s+/).filter(word => word.length > 0);
            
            if (words.length === 0) return 'A';
            if (words.length === 1) return words[0].charAt(0).toUpperCase();
            
            // Take first letter of first word and first letter of last word
            const firstInitial = words[0].charAt(0).toUpperCase();
            const lastInitial = words[words.length - 1].charAt(0).toUpperCase();
            
            return firstInitial + lastInitial;
        } catch (error) {
            console.error('Error generating initials:', error);
            return 'A';
        }
    }

    // Refresh admin data from API
    async refreshAdminData() {
        try {
            if (typeof window.apiService !== 'undefined') {
                const response = await window.apiService.get('/users/profile');
                if (response.success) {
                    this.adminData = response.data;
                    localStorage.setItem('admin_data', JSON.stringify(this.adminData));
                    this.updateAdminUI(this.adminData);
                    return true;
                }
            }
        } catch (error) {
            console.error('Error refreshing admin data:', error);
        }
        return false;
    }

    // Get current admin data
    getCurrentAdminData() {
        return this.adminData;
    }
}

// Initialize global instance
window.adminAvatarManager = new AdminAvatarManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminAvatarManager;
}
