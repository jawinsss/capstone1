// Avatar Loader - Load avatar from API for all pages
class AvatarLoader {
    constructor() {
        this.apiService = window.apiService;
        this.isLoading = false;
    }

    // Check if user is authenticated
    isAuthenticated() {
        // Use AuthContextManager if available
        if (typeof window !== 'undefined' && window.authContextManager) {
            return window.authContextManager.isAuthenticated();
        }
        
        // Fallback to legacy logic
        const token = localStorage.getItem('user_token') || localStorage.getItem('admin_token') || localStorage.getItem('token');
        return !!token;
    }

    // Load user profile from API
    async loadUserProfile() {
        if (!this.isAuthenticated()) {
            console.log('AvatarLoader: User not authenticated, skipping avatar load');
            return null;
        }

        if (this.isLoading) {
            console.log('AvatarLoader: Avatar already loading, skipping...');
            return null;
        }

        try {
            this.isLoading = true;
            console.log('AvatarLoader: Loading user profile from API...');
            
            const response = await this.apiService.get('/users/profile');
            
            if (response.success && response.data) {
                console.log('AvatarLoader: User profile loaded successfully:', {
                    fullName: response.data.fullName,
                    username: response.data.username,
                    avt_img: response.data.avt_img ? 'Has image' : 'No image',
                    avt_img_length: response.data.avt_img ? response.data.avt_img.length : 0
                });
                return response.data;
            } else {
                console.log('AvatarLoader: Failed to load user profile:', response.message);
                return null;
            }
        } catch (error) {
            console.error('AvatarLoader: Error loading user profile:', error);
            return null;
        } finally {
            this.isLoading = false;
        }
    }

    // Update header avatar with user data
    updateHeaderAvatar(user) {
        if (!user) {
            console.log('No user data, hiding avatar');
            this.hideHeaderAvatar();
            return;
        }

        console.log('Updating header avatar for user:', user.fullName);
        
        // Get header elements
        const userAvatar = document.getElementById('hpUserAvatar');
        const userInitials = document.getElementById('hpUserInitials');
        const userName = document.getElementById('hpUserName');
        const loginLink = document.getElementById('hpLoginLink');
        const logoutBtn = document.getElementById('hpLogoutBtn');
        const adminLink = document.getElementById('hpAdminLink');

        if (!userAvatar) {
            console.log('Header avatar element not found');
            return;
        }

        // Show user avatar, hide login link
        userAvatar.hidden = false;
        if (loginLink) loginLink.hidden = true;
        if (logoutBtn) logoutBtn.hidden = false;

        // Update user name
        if (userName) {
            userName.textContent = user.fullName || 'User';
        }

        // Update initials
        if (userInitials) {
            const initials = this.generateInitials(user.fullName);
            userInitials.textContent = initials;
        }

        // Update avatar image
        if (user.avt_img && user.avt_img.trim() !== '') {
            this.showAvatarImage(user.avt_img, user.fullName);
        } else {
            this.showInitialsOnly();
        }

        // Show admin link if user is admin
        if (user.role === 'ADMIN' || user.role === 'admin') {
            if (adminLink) adminLink.hidden = false;
        } else {
            if (adminLink) adminLink.hidden = true;
        }
    }

    // Generate initials from full name
    generateInitials(fullName) {
        if (!fullName) return 'U';
        const parts = fullName.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        const first = parts[0].charAt(0).toUpperCase();
        const last = parts[parts.length - 1].charAt(0).toUpperCase();
        return first + last;
    }

    // Show avatar image
    showAvatarImage(avatarUrl, fullName) {
        console.log('AvatarLoader: Showing avatar image for user:', fullName);
        console.log('AvatarLoader: Avatar URL length:', avatarUrl ? avatarUrl.length : 0);
        console.log('AvatarLoader: Avatar URL preview:', avatarUrl ? avatarUrl.substring(0, 100) + '...' : 'null');
        
        const userAvatar = document.getElementById('hpUserAvatar');
        const userInitials = document.getElementById('hpUserInitials');
        
        if (!userAvatar) {
            console.log('AvatarLoader: User avatar element not found');
            return;
        }

        // Remove existing avatar image if any
        const existingImg = userAvatar.querySelector('#hpUserAvatarImg');
        if (existingImg) {
            console.log('AvatarLoader: Removing existing avatar image');
            existingImg.remove();
        }

        // Create new image element
        const img = document.createElement('img');
        img.id = 'hpUserAvatarImg';
        img.src = avatarUrl;
        img.alt = fullName || 'User Avatar';
        img.className = 'hp-avatar-image';
        img.style.cssText = `
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            z-index: 1;
            filter: brightness(0.9) contrast(1.1);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
        `;

        // Hide initials when avatar image is present
        if (userInitials) {
            userInitials.style.display = 'none';
        }

        // Add hover effects
        userAvatar.addEventListener('mouseenter', () => {
            img.style.filter = 'brightness(1.1) contrast(1.2)';
        });

        userAvatar.addEventListener('mouseleave', () => {
            img.style.filter = 'brightness(0.9) contrast(1.1)';
        });

        // Add image to avatar circle container
        const avatarCircle = userAvatar.querySelector('.hp-avatar-circle');
        if (avatarCircle) {
            avatarCircle.appendChild(img);
        } else {
            userAvatar.appendChild(img); // Fallback
        }
    }

    // Show initials only
    showInitialsOnly() {
        console.log('AvatarLoader: Showing initials only (no avatar image)');
        
        const userInitials = document.getElementById('hpUserInitials');
        if (userInitials) {
            // Remove any existing avatar image
            const existingImg = document.getElementById('hpUserAvatarImg');
            if (existingImg) {
                console.log('AvatarLoader: Removing existing avatar image for initials display');
                existingImg.remove();
            }
            
            userInitials.style.display = 'flex';
            userInitials.style.zIndex = '1';
            userInitials.style.position = 'relative';
            userInitials.style.background = 'transparent';
            userInitials.style.borderRadius = '50%';
            userInitials.style.width = '100%';
            userInitials.style.height = '100%';
            userInitials.style.alignItems = 'center';
            userInitials.style.justifyContent = 'center';
            userInitials.style.fontWeight = '800';
            userInitials.style.fontSize = '13px';
            userInitials.style.textTransform = 'uppercase';
            userInitials.style.letterSpacing = '0.8px';
            userInitials.style.color = 'white';
            userInitials.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
            userInitials.style.top = 'auto';
            userInitials.style.left = 'auto';
            userInitials.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        }
    }

    // Hide header avatar
    hideHeaderAvatar() {
        const userAvatar = document.getElementById('hpUserAvatar');
        const loginLink = document.getElementById('hpLoginLink');
        const logoutBtn = document.getElementById('hpLogoutBtn');
        const adminLink = document.getElementById('hpAdminLink');

        if (userAvatar) userAvatar.hidden = true;
        if (loginLink) loginLink.hidden = false;
        if (logoutBtn) logoutBtn.hidden = true;
        if (adminLink) adminLink.hidden = true;
    }

    // Main function to load and update avatar
    async loadAndUpdateAvatar() {
        console.log('AvatarLoader: Starting avatar load...');
        
        if (!this.isAuthenticated()) {
            console.log('AvatarLoader: User not authenticated, hiding avatar');
            this.hideHeaderAvatar();
            return;
        }

        const user = await this.loadUserProfile();
        this.updateHeaderAvatar(user);
    }

    // Setup logout button
    setupLogoutButton() {
        const logoutBtn = document.getElementById('hpLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                console.log('AvatarLoader: User logging out...');
                console.log('AvatarLoader: Before logout - user_token:', !!localStorage.getItem('user_token'));
                console.log('AvatarLoader: Before logout - admin_token:', !!localStorage.getItem('admin_token'));
                
                // Use auth context manager if available
                if (typeof window.authContextManager !== 'undefined') {
                    // Only logout user, keep admin context if exists
                    window.authContextManager.logoutUser();
                } else {
                    // Fallback: only clear user data, keep admin data
                    ['user_token','user_data','token','user','profileAvatar','accessToken','refreshToken'].forEach(k=>{
                        localStorage.removeItem(k);
                        sessionStorage.removeItem(k);
                    });
                }
                
                console.log('AvatarLoader: After logout - user_token:', !!localStorage.getItem('user_token'));
                console.log('AvatarLoader: After logout - admin_token:', !!localStorage.getItem('admin_token'));
                
                // Remove any existing avatar images
                const existingImg = document.getElementById('hpUserAvatarImg');
                if (existingImg) {
                    existingImg.remove();
                }
                
                // Hide avatar and show login link
                this.hideHeaderAvatar();
                
                // Refresh current page
                window.location.reload();
            });
        }
    }
}

// Initialize avatar loader
const avatarLoader = new AvatarLoader();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('AvatarLoader: DOM ready, initializing...');
    
    // Wait a bit for API service to be ready
    setTimeout(() => {
        avatarLoader.loadAndUpdateAvatar();
        avatarLoader.setupLogoutButton();
    }, 100);
});

// Export for global use
window.AvatarLoader = avatarLoader;
