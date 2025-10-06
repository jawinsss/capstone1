// Cart Management with API Integration
class CartManager {
    constructor() {
        this.cart = [];
        this.products = [];
        this.init();
    }

    async init() {
        await this.loadCartFromStorage();
        await this.loadProducts();
        this.renderCart();
        this.setupEventListeners();
        this.updateCartCount();
    }

    // Load cart from localStorage using CartUtils
    loadCartFromStorage() {
        this.cart = CartUtils.getCartItems();
        console.log('Cart loaded with items:', this.cart.length);
    }

    // Save cart to localStorage using CartUtils
    saveCartToStorage() {
        try {
            localStorage.setItem('cart', JSON.stringify(this.cart));
            CartUtils.updateCartCount();
        } catch (error) {
            console.error('Error saving cart to storage:', error);
        }
    }

    // Load products from API
    async loadProducts() {
        try {
            const response = await window.apiService.get('/products?take=1000');
            if (response?.success) {
                // Handle nested data structure: response.data.data
                const data = response.data?.data || response.data;
                this.products = Array.isArray(data) ? data : [];
                
                // Validate cart items against current products
                this.validateCartItems();
            } else {
                console.error('Failed to load products:', response);
                this.products = [];
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.products = [];
        }
    }

    // Validate cart items against current products from database
    validateCartItems() {
        if (this.cart.length === 0) return;
        
        console.log('Validating cart items against database...');
        console.log('Cart items before validation:', this.cart.length);
        console.log('Available products:', this.products.length);
        
        const validProductIds = new Set(this.products.map(p => p.id));
        const originalCartLength = this.cart.length;
        
        // Filter out items that no longer exist in database
        this.cart = this.cart.filter(item => {
            const isValid = validProductIds.has(item.productId);
            if (!isValid) {
                console.log(`Removing invalid cart item: ${item.productId}`);
            }
            return isValid;
        });
        
        const removedCount = originalCartLength - this.cart.length;
        if (removedCount > 0) {
            console.log(`Removed ${removedCount} invalid items from cart`);
            this.saveCartToStorage();
            this.updateCartCount();
        } else {
            console.log('All cart items are valid');
        }
    }

    // Get product details by ID
    getProductById(productId) {
        return this.products.find(product => product.id === productId);
    }

    // Render cart products
    renderCart() {
        const loadingEl = document.getElementById('cartLoading');
        const emptyCartEl = document.getElementById('emptyCart');
        const productsGridEl = document.getElementById('productsGrid');

        // Hide loading
        if (loadingEl) loadingEl.style.display = 'none';

        if (this.cart.length === 0) {
            // Show empty cart
            if (emptyCartEl) emptyCartEl.style.display = 'block';
            if (productsGridEl) productsGridEl.innerHTML = '';
            this.updateSummary();
            return;
        }

        // Hide empty cart
        if (emptyCartEl) emptyCartEl.style.display = 'none';

        // Render products
        if (productsGridEl) {
            productsGridEl.innerHTML = this.cart.map(cartItem => {
                const product = this.getProductById(cartItem.productId);
                if (!product) return '';

                const image = product.images?.[0]?.url || 'https://via.placeholder.com/280x200?text=MatFlow';
                const price = this.formatVND(product.price);

                return `
                    <div class="product-card" data-product-id="${product.id}">
                        <div class="product-image">
                            <img src="${image}" alt="${product.name}" 
                                 onerror="this.src='https://via.placeholder.com/280x200?text=MatFlow'">
                        </div>
                        <div class="product-info">
                            <h3 class="product-name">${product.name}</h3>
                            <p class="product-price">${price}</p>
                            <div class="quantity-controls">
                                <button class="qty-btn minus" data-product-id="${product.id}">−</button>
                                <input type="number" class="qty-input" value="${cartItem.quantity}" min="0" 
                                       data-product-id="${product.id}">
                                <button class="qty-btn plus" data-product-id="${product.id}">+</button>
                            </div>
                            <button class="delete-btn" data-product-id="${product.id}">Xóa</button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        this.updateSummary();
    }

    // Setup event listeners
    setupEventListeners() {
        // Quantity controls
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('qty-btn')) {
                const productId = e.target.dataset.productId;
                const input = e.target.parentNode.querySelector('.qty-input');
                let currentQty = parseInt(input.value) || 0;

                if (e.target.classList.contains('plus')) {
                    currentQty++;
                } else if (e.target.classList.contains('minus') && currentQty > 0) {
                    currentQty--;
                }

                input.value = currentQty;
                this.updateCartItem(productId, currentQty);
            }

            if (e.target.classList.contains('delete-btn')) {
                const productId = e.target.dataset.productId;
                this.removeFromCart(productId);
            }
        });

        // Quantity input changes
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('qty-input')) {
                const productId = e.target.dataset.productId;
                let value = parseInt(e.target.value, 10);

                if (isNaN(value) || value < 0) {
                    e.target.value = 0;
                    value = 0;
                } else {
                    e.target.value = value;
                }

                this.updateCartItem(productId, value);
            }
        });

        // Checkout button
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('checkout-btn')) {
                this.proceedToCheckout();
            }
        });
    }

    // Update cart item quantity
    updateCartItem(productId, quantity) {
        const existingItem = this.cart.find(item => item.productId === productId);
        
        if (quantity <= 0) {
            this.removeFromCart(productId);
            return;
        }

        if (existingItem) {
            existingItem.quantity = quantity;
        } else {
            this.cart.push({ productId, quantity });
        }

        this.saveCartToStorage();
        this.updateCartCount();
        this.updateSummary();
    }

    // Remove item from cart
    removeFromCart(productId) {
        if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
            const productCard = document.querySelector(`[data-product-id="${productId}"]`);
            if (productCard) {
                productCard.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => {
                    this.cart = this.cart.filter(item => item.productId !== productId);
                    this.saveCartToStorage();
                    this.updateCartCount();
                    this.renderCart();
                }, 300);
            }
        }
    }

    // Update cart summary
    updateSummary() {
        let totalItems = 0;
        let subtotal = 0;

        this.cart.forEach(cartItem => {
            const product = this.getProductById(cartItem.productId);
            if (product) {
                totalItems += cartItem.quantity;
                subtotal += cartItem.quantity * product.price;
            }
        });

        const shippingFee = 150000;
        const total = subtotal + (totalItems > 0 ? shippingFee : 0);

        // Update summary display
        const summaryValues = document.querySelectorAll('.summary-value');
        if (summaryValues.length >= 4) {
            summaryValues[0].textContent = totalItems + " sản phẩm";
            summaryValues[1].textContent = this.formatVND(subtotal);
            summaryValues[2].textContent = totalItems > 0 ? this.formatVND(shippingFee) : "0 VNĐ";
            summaryValues[3].textContent = this.formatVND(total);
        }
    }

    // Update cart count in header using CartUtils
    updateCartCount() {
        CartUtils.updateCartCount();
    }

    // Format VND currency
    formatVND(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(amount);
    }

    // Proceed to checkout
    proceedToCheckout() {
        if (this.cart.length === 0) {
            alert('Giỏ hàng của bạn đang trống!');
            return;
        }
        window.location.href = 'checkout.html';
    }
}

// CSS Animation for slide out effect
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(-100%); }
    }
    
    .loading-state {
        text-align: center;
        padding: 3rem 0;
        color: var(--text-medium);
    }
    
    .loading-state i {
        font-size: 2rem;
        margin-bottom: 1rem;
        color: var(--primary-turquoise-dark);
    }
    
    .empty-cart {
        text-align: center;
        padding: 3rem 0;
        color: var(--text-medium);
    }
    
    .empty-cart i {
        font-size: 4rem;
        margin-bottom: 1rem;
        color: var(--text-light);
    }
    
    .empty-cart h3 {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
        color: var(--text-dark);
    }
    
    .btn-continue-shopping {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--primary-turquoise-dark);
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        text-decoration: none;
        font-weight: 600;
        margin-top: 1rem;
        transition: all 0.3s ease;
    }
    
    .btn-continue-shopping:hover {
        background: #0284c7;
        transform: translateY(-2px);
    }
`;
document.head.appendChild(style);

// Initialize cart manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CartManager();
});