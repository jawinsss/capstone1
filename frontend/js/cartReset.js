// Cart Reset Utility - Temporary script to fix cart issues
(function() {
    'use strict';
    
    console.log('Cart Reset Utility loaded');
    
    // Function to completely reset cart
    function resetCart() {
        try {
            // Clear all cart-related data
            localStorage.removeItem('cart');
            sessionStorage.removeItem('cart');
            
            // Clear any other potential cart data
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.toLowerCase().includes('cart')) {
                    localStorage.removeItem(key);
                }
            });
            
            console.log('Cart has been completely reset');
            return true;
        } catch (error) {
            console.error('Error resetting cart:', error);
            return false;
        }
    }
    
    // Function to update cart count display
    function updateCartDisplay() {
        const cartCountEl = document.getElementById('hpCartCount');
        if (cartCountEl) {
            cartCountEl.textContent = '0';
            console.log('Cart count display updated to 0');
        }
    }
    
    // Reset cart immediately
    resetCart();
    
    // Update display when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateCartDisplay);
    } else {
        updateCartDisplay();
    }
    
    // Make reset function available globally for debugging
    window.resetCart = resetCart;
    
})();
