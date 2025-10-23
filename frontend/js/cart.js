// Cart Management with API Integration
class CartManager {
    constructor() {
        this.cart = [];
        this.products = [];
        this.init();
    }

    async init() {
        console.log('CartManager init started');
        await this.loadCartFromStorage();
        console.log('Cart loaded:', this.cart);
        await this.loadProducts();
        console.log('Products loaded:', this.products);
        this.renderCart();
        this.setupEventListeners();
        this.updateCartCount();
        console.log('CartManager init completed');
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

    // Load products from API (optimized - only load cart items)
    async loadProducts() {
        try {
            const cartProductIds = this.cart.map(item => item.productId);
            
            if (cartProductIds.length === 0) {
                this.products = [];
                return;
            }
            
            // Load products by fetching each product individually
            // This is more efficient than loading all products
            const productPromises = cartProductIds.map(async (productId) => {
                try {
                    const response = await window.apiService.get(`/products/${productId}`);
                    if (response?.success) {
                        // Handle nested response
                        const data = response.data?.data || response.data;
                        return data;
                    }
                    return null;
                } catch (error) {
                    console.error(`Error loading product ${productId}:`, error);
                    return null;
                }
            });
            
            const loadedProducts = await Promise.all(productPromises);
            this.products = loadedProducts.filter(p => p !== null);
            
            console.log(`Loaded ${this.products.length} products for ${this.cart.length} cart items`);
            
        } catch (error) {
            console.error('Error loading products:', error);
            this.products = [];
        }
    }

    // Validate cart items - removed automatic validation
    // Products are loaded on-demand, so we don't need to validate
    // Items will only be removed if product API returns error
    validateCartItems() {
        // No longer needed - we load products by ID
        // Invalid products will naturally fail to load
        return;
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

        console.log('Rendering cart:', {
            cartItems: this.cart.length,
            productsLoaded: this.products.length,
            cart: this.cart,
            products: this.products
        });

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
            const renderedProducts = this.cart.map(cartItem => {
                const product = this.getProductById(cartItem.productId);
                if (!product) {
                    console.warn(`Product not found for cart item:`, cartItem);
                    return '';
                }

                const imageUrl = product.images?.[0]?.url || '';
                // Handle both base64 and regular URLs
                let image;
                if (!imageUrl) {
                    image = 'https://via.placeholder.com/280x200?text=MatFlow';
                } else if (imageUrl.startsWith('data:image')) {
                    // Base64 image from admin
                    image = imageUrl;
                } else {
                    // Regular URL from seed
                    image = CONFIG.getAssetUrl(imageUrl);
                }
                const price = this.formatVND(product.price);

                const stockStatus = product.stock > 0 
                    ? `<span class="stock-available">Còn ${product.stock} sản phẩm</span>`
                    : `<span class="stock-unavailable">Hết hàng</span>`;
                
                return `
                    <div class="product-card" data-product-id="${product.id}">
                        <div class="product-image">
                            <img src="${image}" alt="${product.name}" loading="lazy"
                                 onerror="this.src='https://via.placeholder.com/280x200?text=MatFlow'">
                        </div>
                        <div class="product-info">
                            <h3 class="product-name">${product.name}</h3>
                            <p class="product-price">${price}</p>
                            <p class="product-stock">${stockStatus}</p>
                            <div class="quantity-controls">
                                <button class="qty-btn minus" data-product-id="${product.id}">−</button>
                                <input type="number" class="qty-input" value="${cartItem.quantity}" min="0" max="${product.stock}"
                                       data-product-id="${product.id}">
                                <button class="qty-btn plus" data-product-id="${product.id}">+</button>
                            </div>
                            <button class="delete-btn" data-product-id="${product.id}">Xóa</button>
                        </div>
                    </div>
                `;
            }).filter(html => html !== '').join('');

            if (renderedProducts.length === 0 && this.cart.length > 0) {
                console.error('No products could be rendered! Cart has items but products not loaded.');
                productsGridEl.innerHTML = '<div style="padding:20px;text-align:center;">Đang tải sản phẩm...</div>';
            } else {
                productsGridEl.innerHTML = renderedProducts;
            }
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
                    // Check stock before increasing quantity
                    const product = this.getProductById(productId);
                    if (product && currentQty >= product.stock) {
                        alert(`Không thể thêm! Chỉ còn ${product.stock} sản phẩm trong kho.`);
                        return;
                    }
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
                    // Check stock limit
                    const product = this.getProductById(productId);
                    if (product && value > product.stock) {
                        alert(`Không thể đặt ${value} sản phẩm! Chỉ còn ${product.stock} trong kho.`);
                        e.target.value = product.stock;
                        value = product.stock;
                    } else {
                        e.target.value = value;
                    }
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

        const shippingFee = 1000;
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
    
    .product-stock {
        font-size: 0.9rem;
        margin: 0.25rem 0 0.5rem 0;
    }
    
    .stock-available {
        color: #16a34a;
        font-weight: 500;
    }
    
    .stock-unavailable {
        color: #dc2626;
        font-weight: 600;
    }
    
    .stock-low {
        color: #f97316;
        font-weight: 500;
    }
`;
document.head.appendChild(style);

// Initialize cart manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CartManager();
});