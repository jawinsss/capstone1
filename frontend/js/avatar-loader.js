// Avatar Loader - Load avatar from API for all pages
class AvatarLoader {
    constructor() {
        this.apiService = window.apiService;
        this.isLoading = false;
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('user_token') || localStorage.getItem('token');
        return !!token;
    }

    // Load user profile from API
    async loadUserProfile() {
        if (!this.isAuthenticated()) {
            console.log('User not authenticated, skipping avatar load');
            return null;
        }

        if (this.isLoading) {
            console.log('Avatar already loading, skipping...');
            return null;
        }

        try {
            this.isLoading = true;
            console.log('Loading user profile from API...');
            
            const response = await this.apiService.get('/users/profile');
            
            if (response.success && response.data) {
                console.log('User profile loaded successfully:', response.data.fullName);
                return response.data;
            } else {
                console.log('Failed to load user profile:', response.message);
                return null;
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
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
        console.log('Showing avatar image:', avatarUrl.substring(0, 50) + '...');
        
        const userAvatar = document.getElementById('hpUserAvatar');
        const userInitials = document.getElementById('hpUserInitials');
        
        if (!userAvatar) return;

        // Remove existing avatar image if any
        const existingImg = userAvatar.querySelector('#hpUserAvatarImg');
        if (existingImg) {
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
        console.log('Showing initials only');
        
        const userInitials = document.getElementById('hpUserInitials');
        if (userInitials) {
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
                localStorage.removeItem('user_token');
                localStorage.removeItem('user_data');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('profileAvatar');
                
                // Hide avatar and show login link
                this.hideHeaderAvatar();
                
                // Redirect to login page
                window.location.href = 'index.html';
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
