// ============================================
// PERFORMANCE OPTIMIZER FOR MATFLOW
// ============================================

// 1. API Response Cache
class APICache {
    constructor(ttl = 60000) { // 60 seconds default
        this.cache = new Map();
        this.ttl = ttl;
    }

    set(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    clear() {
        this.cache.clear();
    }
}

// Global cache instance
window.apiCache = new APICache(30000); // 30 seconds cache

// 2. Debounce Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 3. Throttle Function
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 4. Lazy Load Images using Intersection Observer
class ImageLazyLoader {
    constructor() {
        this.observer = null;
        this.init();
    }

    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        this.observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px', // Load 50px before visible
                threshold: 0.01
            });
        }
    }

    loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;

        // Create a new image to preload
        const tempImg = new Image();
        tempImg.onload = () => {
            img.src = src;
            img.classList.add('loaded');
            img.removeAttribute('data-src');
        };
        tempImg.onerror = () => {
            img.src = img.dataset.fallback || '/assets/Icon MatFlow.png';
            img.classList.add('error');
        };
        tempImg.src = src;
    }

    observe(element) {
        if (this.observer) {
            this.observer.observe(element);
        } else {
            // Fallback for browsers without IntersectionObserver
            this.loadImage(element);
        }
    }

    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

// Global lazy loader instance
window.imageLazyLoader = new ImageLazyLoader();

// 5. Optimized API Call with Cache
async function cachedAPICall(endpoint, options = {}) {
    const cacheKey = `${endpoint}${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = window.apiCache.get(cacheKey);
    if (cached && !options.skipCache) {
        console.log(`📦 Cache hit: ${endpoint}`);
        return cached;
    }

    // Make API call
    try {
        const response = await window.apiService.get(endpoint);
        
        // Cache successful responses
        if (response?.success) {
            window.apiCache.set(cacheKey, response);
        }
        
        return response;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

// 6. Batch DOM Updates
class DOMBatcher {
    constructor() {
        this.updates = [];
        this.rafId = null;
    }

    schedule(updateFn) {
        this.updates.push(updateFn);
        
        if (!this.rafId) {
            this.rafId = requestAnimationFrame(() => {
                this.flush();
            });
        }
    }

    flush() {
        const updates = this.updates.slice();
        this.updates = [];
        this.rafId = null;

        updates.forEach(fn => fn());
    }
}

window.domBatcher = new DOMBatcher();

// 7. Remove Excessive Console Logs (Production Mode)
if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};
}

// 8. Performance Monitor
class PerformanceMonitor {
    constructor() {
        this.marks = new Map();
    }

    start(label) {
        this.marks.set(label, performance.now());
    }

    end(label) {
        const start = this.marks.get(label);
        if (!start) return;

        const duration = performance.now() - start;
        console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
        this.marks.delete(label);
    }
}

window.perfMonitor = new PerformanceMonitor();

// 9. Virtual Scroll Helper (for large lists)
class VirtualScroller {
    constructor(container, itemHeight, renderItem) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.renderItem = renderItem;
        this.items = [];
        this.visibleStart = 0;
        this.visibleEnd = 0;
    }

    setItems(items) {
        this.items = items;
        this.render();
    }

    render() {
        const containerHeight = this.container.clientHeight;
        const scrollTop = this.container.scrollTop;

        this.visibleStart = Math.floor(scrollTop / this.itemHeight);
        this.visibleEnd = Math.ceil((scrollTop + containerHeight) / this.itemHeight);

        // Add buffer
        const bufferSize = 3;
        const start = Math.max(0, this.visibleStart - bufferSize);
        const end = Math.min(this.items.length, this.visibleEnd + bufferSize);

        const fragment = document.createDocumentFragment();
        
        // Spacer top
        const spacerTop = document.createElement('div');
        spacerTop.style.height = `${start * this.itemHeight}px`;
        fragment.appendChild(spacerTop);

        // Visible items
        for (let i = start; i < end; i++) {
            const element = this.renderItem(this.items[i], i);
            fragment.appendChild(element);
        }

        // Spacer bottom
        const spacerBottom = document.createElement('div');
        spacerBottom.style.height = `${(this.items.length - end) * this.itemHeight}px`;
        fragment.appendChild(spacerBottom);

        this.container.innerHTML = '';
        this.container.appendChild(fragment);
    }
}

// 10. Image Optimization Helper
function createOptimizedImage(src, alt, className = '') {
    const img = document.createElement('img');
    img.className = className;
    img.alt = alt || '';
    img.dataset.src = src;
    img.dataset.fallback = '/assets/Icon MatFlow.png';
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E'; // Tiny placeholder
    img.loading = 'lazy'; // Native lazy loading
    
    // Use our custom lazy loader as backup
    window.imageLazyLoader.observe(img);
    
    return img;
}

// Export utilities
window.performanceUtils = {
    debounce,
    throttle,
    cachedAPICall,
    createOptimizedImage,
    VirtualScroller
};

console.log('✅ Performance Optimizer loaded!');

