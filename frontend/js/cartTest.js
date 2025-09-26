// Cart Test Script - For debugging cart issues
(function() {
    'use strict';
    
    console.log('Cart Test Script loaded');
    
    // Test function to add a product to cart
    function testAddToCart() {
        console.log('Testing add to cart...');
        
        // Test with a sample product
        const testProductId = 'test-product-123';
        const testQuantity = 2;
        
        console.log('Adding product:', testProductId, 'quantity:', testQuantity);
        
        if (window.CartUtils) {
            const success = CartUtils.addToCart(testProductId, testQuantity);
            console.log('Add to cart result:', success);
            
            // Check cart contents
            const cartItems = CartUtils.getCartItems();
            console.log('Cart items after add:', cartItems);
            
            // Check cart count
            const cartCount = CartUtils.getCartCount();
            console.log('Cart count after add:', cartCount);
        } else {
            console.error('CartUtils not available');
        }
    }
    
    // Test function to check cart state
    function testCartState() {
        console.log('=== CART STATE TEST ===');
        
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
        
        console.log('=== END CART STATE TEST ===');
    }
    
    // Make test functions available globally
    window.testAddToCart = testAddToCart;
    window.testCartState = testCartState;
    
    // Auto test when page loads
    setTimeout(() => {
        console.log('Auto testing cart state...');
        testCartState();
    }, 1000);
    
})();
