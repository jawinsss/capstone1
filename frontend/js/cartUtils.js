// Cart Utilities - Common functions for cart management across all pages
class CartUtils {
    // Get cart count from localStorage
    static getCartCount() {
        try {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            // Ensure cart is a valid array and items have valid quantities
            if (!Array.isArray(cart)) {
                localStorage.setItem('cart', '[]');
                return 0;
            }
            return cart.reduce((total, item) => {
                // Only count items with valid productId and quantity > 0
                if (item && item.productId && item.quantity > 0) {
                    return total + (item.quantity || 0);
                }
                return total;
            }, 0);
        } catch (error) {
            console.error('Error getting cart count:', error);
            // Reset cart if there's an error
            localStorage.setItem('cart', '[]');
            return 0;
        }
    }

    // Update cart count display across all pages
    static updateCartCount() {
        const cartCountEl = document.getElementById('hpCartCount');
        if (cartCountEl) {
            const count = this.getCartCount();
            cartCountEl.textContent = count;
            console.log('Cart count updated to:', count);
        } else {
            console.log('Cart count element not found');
        }
    }

    // Add item to cart
    static addToCart(productId, quantity = 1) {
        try {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const existingItem = cart.find(item => item.productId === productId);
            
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.push({ productId, quantity });
            }
            
            localStorage.setItem('cart', JSON.stringify(cart));
            this.updateCartCount();
            return true;
        } catch (error) {
            console.error('Error adding to cart:', error);
            return false;
        }
    }

    // Remove item from cart
    static removeFromCart(productId) {
        try {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const updatedCart = cart.filter(item => item.productId !== productId);
            localStorage.setItem('cart', JSON.stringify(updatedCart));
            this.updateCartCount();
            return true;
        } catch (error) {
            console.error('Error removing from cart:', error);
            return false;
        }
    }

    // Update item quantity in cart
    static updateCartItem(productId, quantity) {
        try {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const existingItem = cart.find(item => item.productId === productId);
            
            if (quantity <= 0) {
                return this.removeFromCart(productId);
            }
            
            if (existingItem) {
                existingItem.quantity = quantity;
            } else {
                cart.push({ productId, quantity });
            }
            
            localStorage.setItem('cart', JSON.stringify(cart));
            this.updateCartCount();
            return true;
        } catch (error) {
            console.error('Error updating cart item:', error);
            return false;
        }
    }

    // Get cart items
    static getCartItems() {
        return this.cleanCart();
    }

    // Clear cart
    static clearCart() {
        try {
            localStorage.setItem('cart', '[]');
            this.updateCartCount();
            return true;
        } catch (error) {
            console.error('Error clearing cart:', error);
            return false;
        }
    }

    // Reset cart completely (for debugging/fixing issues)
    static resetCart() {
        try {
            localStorage.removeItem('cart');
            sessionStorage.removeItem('cart');
            this.updateCartCount();
            console.log('Cart has been reset to empty state');
            return true;
        } catch (error) {
            console.error('Error resetting cart:', error);
            return false;
        }
    }

    // Clean and validate cart data
    static cleanCart() {
        try {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            if (!Array.isArray(cart)) {
                localStorage.setItem('cart', '[]');
                return [];
            }
            
            // Filter out invalid items
            const cleanCart = cart.filter(item => 
                item && 
                item.productId && 
                typeof item.productId === 'string' && 
                item.quantity > 0
            );
            
            localStorage.setItem('cart', JSON.stringify(cleanCart));
            return cleanCart;
        } catch (error) {
            console.error('Error cleaning cart:', error);
            localStorage.setItem('cart', '[]');
            return [];
        }
    }

    // Initialize cart count on page load
    static initCartCount() {
        // Only clean invalid data, preserve valid cart items
        this.cleanCart();
        this.updateCartCount();
        
        // Debug: Log current cart state
        const currentCount = this.getCartCount();
        console.log('Cart initialized with count:', currentCount);
    }
}

// Auto-initialize cart count when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only clean cart data, don't reset completely
    CartUtils.initCartCount();
});

// Remove the automatic reset on script load

// Make CartUtils available globally
window.CartUtils = CartUtils;
