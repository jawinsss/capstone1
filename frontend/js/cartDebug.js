// Cart Debug Utility - For debugging cart issues
(function() {
    'use strict';
    
    console.log('Cart Debug Utility loaded');
    
    // Function to debug cart state
    function debugCart() {
        console.log('=== CART DEBUG INFO ===');
        
        // Check localStorage
        const cartData = localStorage.getItem('cart');
        console.log('localStorage cart data:', cartData);
        
        try {
            const cart = JSON.parse(cartData || '[]');
            console.log('Parsed cart:', cart);
            console.log('Cart length:', cart.length);
            
            if (Array.isArray(cart)) {
                const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
                console.log('Total items in cart:', totalItems);
                
                cart.forEach((item, index) => {
                    console.log(`Item ${index}:`, {
                        productId: item.productId,
                        quantity: item.quantity,
                        valid: !!(item.productId && item.quantity > 0)
                    });
                });
            }
        } catch (error) {
            console.error('Error parsing cart data:', error);
        }
        
        // Check cart count display
        const cartCountEl = document.getElementById('hpCartCount');
        if (cartCountEl) {
            console.log('Cart count display element found:', cartCountEl);
            console.log('Cart count display value:', cartCountEl.textContent);
        } else {
            console.log('Cart count display element NOT found');
        }
        
        console.log('=== END CART DEBUG ===');
    }
    
    // Function to force reset cart
    function forceResetCart() {
        console.log('Force resetting cart...');
        
        // Clear all cart data
        localStorage.removeItem('cart');
        sessionStorage.removeItem('cart');
        
        // Update display
        const cartCountEl = document.getElementById('hpCartCount');
        if (cartCountEl) {
            cartCountEl.textContent = '0';
        }
        
        console.log('Cart force reset completed');
        debugCart();
    }
    
    // Make functions available globally
    window.debugCart = debugCart;
    window.forceResetCart = forceResetCart;
    
    // Auto debug when page loads
    setTimeout(debugCart, 1000);
    
})();
