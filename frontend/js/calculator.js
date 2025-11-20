// Frontend logic for Material Calculator page
// Calls backend endpoints under /calculator/*

function $id(id) { return document.getElementById(id); }

const apiBase = ''; // same origin; backend serves the frontend

// =========================
// 🔥 Hàm xử lý URL hình ảnh
// =========================
/**
 * Resolve image URL from different sources:
 * 1. Base64 data URI (admin uploads) - e.g. data:image/jpeg;base64,...
 * 2. Seed products - e.g. /assets/vat_tu/...
 * 3. Admin file uploads - e.g. /uploads/...
 * 4. Absolute URLs - e.g. http://...
 */
function resolveImage(url) {
    if (!url) return '/assets/placeholder.jpg';

    // 🔥 BASE64 IMAGE (Admin uploads stored as data URI)
    if (url.startsWith('data:')) {
        return url; // Return base64 data URI directly
    }

    // HTTP/HTTPS absolute URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // Seed products (/assets/vat_tu/...)
    if (url.startsWith('/assets/')) {
        return url;
    }

    // Admin file uploads - ensure leading slash
    return `/${url.replace(/^\/+/, '')}`;
}

document.addEventListener('DOMContentLoaded', () => {

    const btnAsk = $id('btnAsk');
    const nlQuestion = $id('nlQuestion');
    const aiExplanation = $id('aiExplanation');
    const nlSuggestions = $id('nlSuggestions');

    const selCategory = $id('selCategory');
    const selSubCategory = $id('selSubCategory');
    const btnLoadSpecs = $id('btnLoadSpecs');
    const btnFormCalc = $id('btnFormCalc');
    const inputQty = $id('inputQty');
    const formResults = $id('formResults');

    // ===========================
    // Load danh mục chính
    // ===========================
    fetch(`${apiBase}/categories/main`)
        .then(r => r.json())
        .then(data => {
            const cats = Array.isArray(data) ? data : (data?.data || []);
            cats.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                selCategory.appendChild(opt);
            });
        })
        .catch(() => { });

    // Khi đổi danh mục chính
    selCategory.addEventListener('change', () => {
        const catId = selCategory.value;
        selSubCategory.innerHTML = '<option value="">-- chọn --</option>';

        if (!catId) return;

        fetch(`${apiBase}/categories/${catId}/subcategories`)
            .then(r => r.json())
            .then(list => {
                const subs = Array.isArray(list) ? list : (list?.data || []);
                subs.forEach(s => {
                    const o = document.createElement('option');
                    o.value = s.id;
                    o.textContent = s.name;
                    selSubCategory.appendChild(o);
                });
            });

        loadSpecs(catId);
    });

    selSubCategory.addEventListener('change', () => {
        const subId = selSubCategory.value;
        if (subId) loadSpecs(subId);
    });

    // ===========================
    // Load danh mục thông số
    // ===========================
    function loadSpecs(categoryId) {
        if (!categoryId) return;

        fetch(`${apiBase}/calculator/category-specs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoryId })
        })
            .then(r => r.json())
            .then(data => {
                const specs = data?.data?.requiredSpecifications || [];
                renderSpecsForm(specs);
            })
            .catch(() => renderSpecsForm([]));
    }

    function renderSpecsForm(specs) {
        const specsWrap = document.getElementById('specInputs');
        if (!specsWrap) return;

        specsWrap.innerHTML = '';
        specs.forEach(spec => {
            const label = document.createElement('label');
            label.textContent = spec;

            const input = document.createElement('input');
            input.type = 'text';
            input.name = spec;
            input.placeholder = spec;
            input.className = 'spec-input';

            label.appendChild(input);
            specsWrap.appendChild(label);
        });
    }

    // ===========================
    // Natural-language calculator
    // ===========================
    if (btnAsk && nlQuestion) {
        btnAsk.addEventListener('click', async () => {
            nlSuggestions.innerHTML = '';
            aiExplanation.hidden = true;

            const text = nlQuestion.value.trim();
            if (!text) return alert('Vui lòng nhập mô tả.');

            btnAsk.disabled = true;
            btnAsk.textContent = 'Đang xử lý...';

            try {
                const res = await fetch(`${apiBase}/calculator/materials`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question: text })
                });

                const data = await res.json();

                if (data.aiExplanation) {
                    aiExplanation.textContent = data.aiExplanation;
                    aiExplanation.hidden = false;
                }

                nlSuggestions.innerHTML = Array.isArray(data.suggestions)
                    ? renderSuggestions(data.suggestions)
                    : 'Không có gợi ý.';
            } catch (err) {
                nlSuggestions.textContent = 'Lỗi khi gọi API.';
            }

            btnAsk.disabled = false;
            btnAsk.textContent = 'Hỏi AI & Gợi ý vật tư';
        });
    }

    // ===========================
    // Load thông số mặc định
    // ===========================
    btnLoadSpecs.addEventListener('click', async () => {
        const catId = selCategory.value;
        if (!catId) return alert('Chọn danh mục trước.');

        btnLoadSpecs.disabled = true;
        btnLoadSpecs.textContent = 'Đang tải...';

        try {
            const res = await fetch(`${apiBase}/calculator/category-specs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categoryId: catId })
            });

            const data = await res.json();
            formResults.innerHTML = '';

            if (data.priceRange) {
                const p = document.createElement('div');
                p.className = 'spec-block';
                p.textContent = `Phạm vi giá: ${JSON.stringify(data.priceRange)}`;
                formResults.appendChild(p);
            }

            if (Array.isArray(data.sampleProducts)) {
                const ul = document.createElement('div');
                ul.className = 'prod-grid';
                data.sampleProducts.forEach(p => {
                    ul.innerHTML += renderProductCard(p);
                });
                formResults.appendChild(ul);
            }
        } catch {
            formResults.textContent = 'Không tải được thông số.';
        }

        btnLoadSpecs.disabled = false;
        btnLoadSpecs.textContent = 'Lấy thông số mặc định';
    });

    // ===========================
    // Tính toán sản phẩm (Form-calc)
    // ===========================
    btnFormCalc.addEventListener('click', async () => {
        const selectedSub = selSubCategory.options[selSubCategory.selectedIndex]?.textContent || '';

        const payload = {
            categoryId: selCategory.value,
            subCategoryId: selSubCategory.value,
            quantity: Number(inputQty.value || 5), // Number of products to display
            productType: selectedSub || selCategory.options[selCategory.selectedIndex]?.textContent || '',
            specs: {}
        };

        const specsWrap = document.getElementById('specInputs');
        if (specsWrap) {
            specsWrap.querySelectorAll('input').forEach(input => {
                payload.specs[input.name] = input.value;
            });
        }

        btnFormCalc.disabled = true;
        btnFormCalc.textContent = 'AI đang phân tích...';

        try {
            const res = await fetch(`${apiBase}/calculator/form-calc`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success && data.results && data.results.length > 0) {
                // Display AI summary
                formResults.innerHTML = data.aiSummary
                    ? `<div class="ai-summary">${data.aiSummary}</div>`
                    : '';

                // Render products
                const grid = document.createElement('div');
                grid.className = 'calc-results-grid';
                data.results.forEach(p => {
                    grid.innerHTML += renderCalculatedRow(p);
                });
                formResults.appendChild(grid);
            } else {
                formResults.innerHTML = '<p class="no-results">Không tìm thấy sản phẩm phù hợp. Vui lòng thử lại với thông số khác.</p>';
            }
        } catch (err) {
            console.error('Form-calc error:', err);
            formResults.innerHTML = '<p class="error">Lỗi khi tính toán. Vui lòng thử lại.</p>';
        }

        btnFormCalc.disabled = false;
        btnFormCalc.textContent = 'Tính toán';
    });

    // ===========================
    // Render methods
    // ===========================
    function renderSuggestions(arr) {
        return arr.map(s => `<div class="suggestion-card">${s.name} - ${s.price}đ</div>`).join('');
    }

    function renderProductCard(p) {
        const img = p.images?.[0]?.url || '/assets/placeholder.jpg';
        return `
            <div class="product-card">
                <img src="${resolveImage(img)}" alt="${p.name}" />
                <div class="product-name">${p.name}</div>
                <div class="product-price">${p.price?.toLocaleString()}đ</div>
            </div>
        `;
    }

    function renderCalculatedRow(product) {
        const img = product.images?.[0]?.url || '/assets/placeholder.jpg';
        const relevanceClass = product.relevanceScore >= 80 ? 'high' : product.relevanceScore >= 60 ? 'medium' : 'low';

        return `
            <div class="calc-row">
                <div class="calc-image product-clickable" data-product-id="${product.id}">
                    <img src="${resolveImage(img)}" alt="${product.name}" />
                </div>
                <div class="calc-info">
                    <div class="calc-name product-clickable" data-product-id="${product.id}">${product.name}</div>
                    <div class="calc-desc">${product.description || ''}</div>
                    <div class="calc-category">${product.category || ''}</div>
                    
                    ${product.relevanceScore ? `
                        <div class="relevance-score ${relevanceClass}">
                            <span class="score-label">Độ phù hợp:</span>
                            <span class="score-value">${product.relevanceScore}/100</span>
                        </div>
                    ` : ''}
                    
                    ${product.aiReasoning ? `
                        <div class="ai-reasoning">
                            <strong>💡 Lý do:</strong> ${product.aiReasoning}
                        </div>
                    ` : ''}
                    
                    ${product.matchedAttributes && product.matchedAttributes.length > 0 ? `
                        <div class="matched-attributes">
                            <strong>✓ Khớp:</strong> ${product.matchedAttributes.join(', ')}
                        </div>
                    ` : ''}
                </div>
                <div class="calc-price-section">
                    <div class="calc-price">${product.price?.toLocaleString()}đ</div>
                    <div class="calc-stock">Tồn kho: ${product.stock}</div>
                    ${product.calculatedQuantity ? `
                        <div class="calc-qty">Số lượng: ${product.calculatedQuantity}</div>
                    ` : ''}
                    <button class="btn-add-cart" data-product-id="${product.id}" data-product-name="${product.name}" data-product-price="${product.price}">
                        Thêm vào giỏ
                    </button>
                </div>
            </div>
        `;
    }

    // ===========================
    // Click to product detail
    // ===========================
    document.body.addEventListener('click', (e) => {
        const clickable = e.target.closest('.product-clickable');
        if (clickable) {
            const productId = clickable.dataset.productId;
            if (productId) {
                window.location.href = `product-detail.html?id=${productId}`;
            }
        }
    });

    // ===========================
    // Add to cart functionality
    // ===========================
    document.body.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-add-cart')) {
            const btn = e.target;
            const productId = btn.dataset.productId;
            const productName = btn.dataset.productName;
            const price = parseFloat(btn.dataset.productPrice);

            // Visual feedback
            const originalText = btn.textContent;
            btn.textContent = '✓ Đã thêm!';
            btn.style.background = '#22c55e';
            btn.disabled = true;

            // Add to cart
            try {
                if (window.CartUtils && typeof window.CartUtils.addToCart === 'function') {
                    await window.CartUtils.addToCart(productId, 1);
                } else {
                    // Fallback to localStorage
                    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                    const existing = cart.find(item => item.productId === productId);
                    if (existing) {
                        existing.quantity += 1;
                    } else {
                        cart.push({ productId, quantity: 1, name: productName, price });
                    }
                    localStorage.setItem('cart', JSON.stringify(cart));
                }

                // Show notification
                if (typeof showNotification === 'function') {
                    showNotification(`Đã thêm "${productName}" vào giỏ hàng!`, 'success');
                }
            } catch (error) {
                console.error('Add to cart error:', error);
            }

            // Reset button after 2s
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                btn.disabled = false;
            }, 2000);
        }
    });

});
