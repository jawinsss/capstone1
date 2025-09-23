document.addEventListener('DOMContentLoaded', () => {
    // ====== AUTH GUARD ======
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        if (!token) {
            window.location.replace('../../index.html');
            return;
        }
    } catch (_) { /* ignore */ }

    // ====== REAL-TIME DATA MANAGER ======
    class RealTimeManager {
        constructor() {
            this.intervals = new Map();
            this.isActive = true;
            this.refreshRates = {
                overview: 30000,    
                orders: 15000,      
                payments: 10000,    
                users: 60000,       
                returns: 20000,     
                products: 10000,    
                feedbacks: 30000    
            };
        }

        startAutoRefresh(viewName, callback) {
            this.stopAutoRefresh(viewName);
            const rate = this.refreshRates[viewName] || 30000;
            const intervalId = setInterval(() => {
                if (this.isActive && document.visibilityState === 'visible') {
                    callback();
                }
            }, rate);
            this.intervals.set(viewName, intervalId);
        }

        stopAutoRefresh(viewName) {
            if (this.intervals.has(viewName)) {
                clearInterval(this.intervals.get(viewName));
                this.intervals.delete(viewName);
            }
        }

        stopAll() {
            this.intervals.forEach(id => clearInterval(id));
            this.intervals.clear();
        }

        pause() {
            this.isActive = false;
        }

        resume() {
            this.isActive = true;
        }
    }

    const realTimeManager = new RealTimeManager();

    // Pause when tab is hidden, resume when visible
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            realTimeManager.pause();
        } else {
            realTimeManager.resume();
        }
    });

    // Stop all intervals when leaving page
    window.addEventListener('beforeunload', () => {
        realTimeManager.stopAll();
    });
    // ====== LẤY PHẦN TỬ CƠ BẢN ======
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const search = document.getElementById('globalSearch');
    const nav = document.getElementById('nav');
    const views = document.querySelectorAll('[data-view]');
    const topbarActions = document.getElementById('topbarActions');

    // Sidebar + Ctrl/Cmd + K để focus ô search
    if (toggle) toggle.addEventListener('click', () => sidebar?.classList.toggle('open'));
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault(); search && search.focus();
        }
    });

    // Nếu mục "Sản phẩm" chưa có data-link thì bổ sung
    const productsNav = [...(nav?.querySelectorAll('.nav-item, [data-link]') || [])]
        .find(a => a.textContent && a.textContent.trim().includes('Sản phẩm'));
    if (productsNav && !productsNav.dataset.link) {
        productsNav.dataset.link = 'products';
        productsNav.setAttribute('href', '#products');
    }

    // ====== KHAI BÁO ROUTES ======
    const ROUTES = {
        overview: {
            title: 'MatFlow Admin - Tổng quan',
            search: 'Tìm kiếm...',
            actions: []
        },
        orders: {
            title: 'MatFlow Admin - Đơn hàng',
            search: 'Tìm kiếm đơn hàng...',
            actions: [{ html: '<button class="btn">Xuất Excel</button>' }]
        },
        returns: {
            title: 'MatFlow Admin - Trả hàng & Hủy đơn',
            search: 'Tìm kiếm yêu cầu trả hàng...',
            actions: [{ html: '<button class="btn">Xuất báo cáo</button>' }]
        },
        products: {
            title: 'MatFlow Admin - Sản phẩm',
            search: 'Tìm kiếm sản phẩm...',
            actions: [{ html: '<button class="btn" id="goToAddProduct">Thêm sản phẩm</button>' }]
        },
        feedbacks: {
            title: 'MatFlow Admin - Hỗ trợ & Khiếu nại',
            search: 'Tìm theo tên, email, nội dung...',
            actions: [{ html: '<button class="btn" id="btnNewTicket">Tạo ticket</button>' }]
        },
        users: {
            title: 'MatFlow Admin - Người dùng',
            search: 'Tìm theo tên, email, SĐT...',
            actions: [{ html: '<button class="btn" id="btnNewUser">Tạo người dùng</button>' }]
        },
        payments: {
            title: 'MatFlow Admin - Thanh toán',
            search: ' tìm theo trạng thái,họ tên,thanh toán,chưa thanh toán,chờ xác nhận...',
            actions:[{html: '<button class="btn" id="btnPayments">Xác nhận thanh toán</button>'}]
        },
        reports: {
            title: 'MatFlow Admin - Báo cáo',
            search: 'Tìm theo báo cáo, ngày,tuần,tháng,năm....',
            actions:[{html: '<button class="btn" id="btnReports">Làm mới thống kê</button>'}]
        },
        banner: {
            title: 'MatFlow Admin - Banner',
            search: 'Tìm theo sự kiện giảm giá....',
            actions:[{html: '<button class="btn" id="btnBanner">Thêm banner/sự kiện giảm giá</button>'}]
        }
    };

    const inited = new Set();
    const setActive = (name) => {
        document.querySelectorAll('[data-link]').forEach(a => {
            a.classList.toggle('active', a.getAttribute('data-link') === name);
        });
    };

    // ====== HIỂN THỊ VIEW ======
    function showView(name, replaceState = false) {
        const available = Array.from(views).map(v => v.getAttribute('data-view'));
        const route = available.includes(name) ? name : 'overview';

        // Ẩn/hiện
        views.forEach(v => v.hidden = v.getAttribute('data-view') !== route);
        setActive(route);

        // Meta + actions
        const meta = ROUTES[route] || {};
        document.title = meta.title || 'MatFlow Admin';
        if (search) search.placeholder = meta.search || 'Tìm kiếm...';
        if (topbarActions) topbarActions.innerHTML = (meta.actions || []).map(a => a.html).join('');

        // Bind action topbar (Sản phẩm → chuyển sang tab Thêm)
        if (route === 'products') {
            const btn = document.getElementById('goToAddProduct');
            btn && btn.addEventListener('click', () => {
                const view = document.querySelector('[data-view="products"]');
                const tabs = view?.querySelectorAll('.tabs .tab-btn');
                tabs && tabs[1] && tabs[1].click();
            });
        }

        // Khởi tạo 1 lần cho mỗi view
        if (!inited.has(route)) {
            if (route === 'products') initProductsView();
            if (route === 'overview') initOverviewView();
            if (route === 'orders') initOrdersView();
            if (route === 'payments') initPaymentsView();
            if (route === 'users') initUsersView();
            if (route === 'returns') initReturnsView();
            if (route === 'feedbacks') initFeedbacksView();
            if (route === 'reports') initReportsView();
            if (route === 'banner') initBannerView();
            inited.add(route);
        }

        // Stop previous auto-refresh and start new one
        realTimeManager.stopAll();
        if (route === 'overview') {
            realTimeManager.startAutoRefresh('overview', () => {
                const view = document.querySelector('[data-view="overview"]');
                if (view && !view.hidden) {
                    loadOverviewData();
                }
            });
        } else if (route === 'orders') {
            realTimeManager.startAutoRefresh('orders', () => {
                const view = document.querySelector('[data-view="orders"]');
                if (view && !view.hidden) {
                    loadOrdersData();
                }
            });
        } else if (route === 'payments') {
            realTimeManager.startAutoRefresh('payments', () => {
                const view = document.querySelector('[data-view="payments"]');
                if (view && !view.hidden) {
                    loadPaymentsData();
                }
            });
        } else if (route === 'returns') {
            realTimeManager.startAutoRefresh('returns', () => {
                const view = document.querySelector('[data-view="returns"]');
                if (view && !view.hidden) {
                    loadReturnsData();
                }
            });
        } else if (route === 'users') {
            realTimeManager.startAutoRefresh('users', () => {
                const view = document.querySelector('[data-view="users"]');
                if (view && !view.hidden) {
                    loadUsersData();
                }
            });
        } else if (route === 'products') {
            realTimeManager.startAutoRefresh('products', () => {
                const view = document.querySelector('[data-view="products"]');
                if (view && !view.hidden) {
                    loadProductsData();
                }
            });
        }

        // Đồng bộ hash/history
        const hash = '#' + route;
        if (location.hash !== hash) {
            if (replaceState) history.replaceState({ route }, '', hash);
            else history.pushState({ route }, '', hash);
        }
    }

    // Điều hướng sidebar
    nav && nav.addEventListener('click', (e) => {
        const link = e.target.closest('[data-link]');
        if (link) {
            e.preventDefault();
            showView(link.dataset.link);
        }
    });

    // Back/forward
    window.addEventListener('popstate', () => {
        const name = (location.hash || '#overview').slice(1);
        showView(name, true);
    });

    // Lần đầu vào trang
    showView((location.hash || '#overview').slice(1), true);

    // ====== ĐĂNG XUẤT ======
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            try {
                ['accessToken', 'refreshToken', 'token', 'user', 'role'].forEach(k => {
                    localStorage.removeItem(k); sessionStorage.removeItem(k);
                });
                document.cookie.split(';').forEach(c => {
                    const n = c.split('=')[0].trim();
                    if (n) document.cookie = `${n}=; Max-Age=0; path=/`;
                });
            } catch (_) { }
            window.location.replace('../../index.html'); // đổi path nếu index.html ở chỗ khác
        });
    }

    // ====== VIEW SẢN PHẨM ======
    function initProductsView() {
        const view = document.querySelector('[data-view="products"]');
        if (!view) return;

        // Sửa lỗi HTML gõ nhầm: <intput> -> <input>, row -> rows
        view.querySelectorAll('intput').forEach(el => {
            const input = document.createElement('input');
            // Copy class/attr
            [...el.attributes].forEach(a => input.setAttribute(a.name, a.value));
            input.className = el.className;
            input.placeholder = el.getAttribute('placeholder') || '';
            el.replaceWith(input);
        });
        view.querySelectorAll('textarea[row]').forEach(ta => {
            ta.setAttribute('rows', ta.getAttribute('row'));
            ta.removeAttribute('row');
        });

        // Tabs + panel
        const tabBtns = view.querySelectorAll('.tabs .tab-btn');
        const filterPanel = view.querySelector('.order-filter.panel');
        const listPanel = filterPanel ? filterPanel.nextElementSibling : null;
        const addTitle = [...view.querySelectorAll('h2')].find(h => /thêm.+sản phẩm/i.test(h.textContent || '')) || view.querySelector('h2');
        const formPanel = addTitle ? addTitle.nextElementSibling : null;

        function showTab(index) {
            tabBtns.forEach((b, i) => b.classList.toggle('active', i === index));
            if (index === 0) {
                filterPanel && filterPanel.removeAttribute('hidden');
                listPanel && listPanel.removeAttribute('hidden');
                addTitle && addTitle.setAttribute('hidden', '');
                formPanel && formPanel.setAttribute('hidden', '');
            } else {
                filterPanel && filterPanel.setAttribute('hidden', '');
                listPanel && listPanel.setAttribute('hidden', '');
                addTitle && addTitle.removeAttribute('hidden');
                formPanel && formPanel.removeAttribute('hidden');
            }
        }
        showTab(0);
        tabBtns.forEach((btn, i) => btn.addEventListener('click', () => showTab(i)));

        // Reset bộ lọc
        const resetLink = view.querySelector('.order-filter .link-reset');
        resetLink && resetLink.addEventListener('click', (e) => {
            e.preventDefault();
            view.querySelectorAll('.order-filter select').forEach(sel => sel.selectedIndex = 0);
            showTab(0);
        });

        // ==== Form ====
        if (!formPanel) return;

        const nameInput = formPanel.querySelector('.filter-grid .filter-field:nth-child(1) input');
        const priceInput = formPanel.querySelector('.filter-grid .filter-field:nth-child(2) input');
        const categorySelect = formPanel.querySelector('.filter-grid .filter-field:nth-child(3) select');
        const descTextarea = formPanel.querySelector('textarea.textarea');
        const stockInput = formPanel.querySelector('#inputStock');
        const uploadZone = formPanel.querySelector('.upload-zone');
        const infoBox = formPanel.querySelector('.split-right');
        const subRows = infoBox ? infoBox.querySelectorAll('.list-sub') : [];

        const setInfo = {
            name: (v) => subRows[0] && (subRows[0].textContent = `Tên sản phẩm: ${v || 'Chưa nhập'}`),
            price: (v) => subRows[1] && (subRows[1].textContent = `Giá bán: ${formatCurrency(v) || 'Chưa nhập'}`),
            qty: (v) => subRows[2] && (subRows[2].textContent = `Số lượng: ${v ?? 0}`),
            cat: (v) => subRows[3] && (subRows[3].textContent = `Danh mục: ${v || 'Chưa chọn'}`),
            imgs: (n) => subRows[4] && (subRows[4].textContent = `Hình ảnh: ${n || 0} ảnh`),
        };

        nameInput && nameInput.addEventListener('input', (e) => setInfo.name(e.target.value));
        priceInput && priceInput.addEventListener('input', (e) => setInfo.price(e.target.value));
        categorySelect && categorySelect.addEventListener('change', (e) => setInfo.cat(e.target.value));
        stockInput && stockInput.addEventListener('input', (e) => setInfo.qty(e.target.value));

        // Upload zone (kéo-thả + chọn tệp)
        let selectedFiles = [];
        if (uploadZone) {
            const chooseBtn = uploadZone.querySelector('button.btn');
            const fileInput = document.createElement('input');
            fileInput.type = 'file'; fileInput.multiple = true; fileInput.accept = 'image/*'; fileInput.hidden = true;
            uploadZone.appendChild(fileInput);

            function handleFiles(list) {
                selectedFiles = Array.from(list || []);
                setInfo.imgs(selectedFiles.length);
            }

            chooseBtn && chooseBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', () => handleFiles(fileInput.files));

            ['dragenter', 'dragover'].forEach(ev => {
                uploadZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); uploadZone.classList.add('dragging'); });
            });
            ['dragleave', 'drop'].forEach(ev => {
                uploadZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); uploadZone.classList.remove('dragging'); });
            });
            uploadZone.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));
        }

        const addBtn = infoBox?.querySelector('.btn');
        const cancelBtn = infoBox?.querySelectorAll('.btn')[1];

        // Load categories
        async function loadCategories() {
            if (!categorySelect) return;
            try {
                const res = await window.apiService.get('/categories');
                if (res?.success && Array.isArray(res.data)) {
                    categorySelect.innerHTML = '';
                    const placeholder = document.createElement('option');
                    placeholder.textContent = 'Chọn danh mục sản phẩm';
                    placeholder.value = '';
                    categorySelect.appendChild(placeholder);
                    res.data.forEach(cat => {
                        const opt = document.createElement('option');
                        opt.value = cat.id;
                        opt.textContent = cat.name;
                        categorySelect.appendChild(opt);
                    });
                }
            } catch (e) {
                console.error('Load categories error', e);
            }
        }

        // Render products list
        function renderProducts(products) {
            if (!listPanel) return;
            const container = document.createElement('div');
            container.className = 'list';
            (products || []).forEach(p => {
                const item = document.createElement('article');
                item.className = 'list-item';
                const thumb = (p.images && p.images[0]?.url) || 'https://via.placeholder.com/40x40?text=';
                item.innerHTML = `
                    <img src="${thumb}" alt="${p.name}" class="avatar" style="width:40px;height:40px;object-fit:cover;border-radius:8px" onerror="this.src='https://via.placeholder.com/40x40?text='"/>
                    <div style="flex:1">
                        <div class="list-title">${p.name} <span class="chip ${p.isActive ? 'green' : 'red'}">${p.isActive ? 'Đang bán' : 'Ẩn'}</span></div>
                        <div class="list-sub">Giá: ${formatCurrency(p.price)} • Danh mục: ${p.category?.name || ''} • Kho: ${p.stock}</div>
                    </div>
                    <div>
                        <button class="btn" data-del="${p.id}" style="background:#ef4444;color:#fff;border-color:#dc2626">Xóa</button>
                    </div>
                `;
                const delBtn = item.querySelector('[data-del]');
                delBtn.addEventListener('click', async () => {
                    if(!confirm('Xóa sản phẩm này?')) return;
                    const res = await window.apiService.delete(`/products/${p.id}`);
                    if(res?.success){
                        showNotification('Đã xóa sản phẩm', 'success');
                        await loadProducts();
                    } else {
                        alert(res?.message || 'Xóa sản phẩm thất bại');
                    }
                });
                container.appendChild(item);
            });
            listPanel.innerHTML = '';
            const title = document.createElement('div');
            title.className = 'panel-title';
            title.textContent = 'Danh sách';
            listPanel.appendChild(title);
            listPanel.appendChild(container);
        }

        async function loadProducts() {
            try {
                const res = await window.apiService.get('/products?take=1000');
                if (res?.success) {
                    const payload = res.data;
                    const items = Array.isArray(payload) ? payload : (payload?.items || []);
                    renderProducts(items);
                    // Update KPIs
                    const stats = view.querySelectorAll('.order-stats .order-stat-value');
                    const total = Array.isArray(payload) ? items.length : Number(payload?.total || items.length);
                    const selling = items.filter(p=>p.isActive).length;
                    const outOfStock = items.filter(p=>Number(p.stock||0)===0).length;
                    if (stats[0]) stats[0].textContent = String(total);
                    if (stats[1]) stats[1].textContent = String(selling);
                    if (stats[2]) stats[2].textContent = String(outOfStock);
                }
            } catch (e) {
                console.error('Load products error', e);
            }
        }

        // Initial loads
        loadCategories();
        loadProducts();

        addBtn && addBtn.addEventListener('click', async () => {
            const name = nameInput ? (nameInput.value || '').trim() : '';
            const price = priceInput ? Number(String(priceInput.value).replace(/[^\d.-]/g, '')) : 0;
            const cat = categorySelect ? categorySelect.value : '';
            const stock = stockInput ? Math.max(0, parseInt(stockInput.value || '0', 10)) : 0;
            const desc = descTextarea ? (descTextarea.value || '').trim() : '';

            if (!name) return alert('Vui lòng nhập Tên sản phẩm');
            if (!cat || /chọn/i.test(cat)) return alert('Vui lòng chọn Danh mục');
            if (!desc) return alert('Vui lòng nhập Mô tả');
            if (!price || Number.isNaN(price) || price < 0) return alert('Giá bán không hợp lệ');

            async function filesToDataUrls(files) {
                const toDataUrl = (file) => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                const arr = [];
                for (let i = 0; i < files.length; i++) {
                    try { arr.push(await toDataUrl(files[i])); } catch (_) { }
                }
                return arr;
            }

            try {
                const dataUrls = await filesToDataUrls(selectedFiles || []);
                const payload = {
                    name,
                    description: desc,
                    price,
                    categoryId: cat,
                    stock,
                    images: dataUrls.map((url, i) => ({ url, order: i }))
                };
                const res = await window.apiService.post('/products', payload);
                if (!res?.success) throw new Error(res?.message || 'Tạo sản phẩm thất bại');
                alert('Đã tạo sản phẩm!');
                await loadProducts();
            } catch (e) {
                alert(e?.message || 'Có lỗi khi tạo sản phẩm');
                return;
            }

            // Reset form nhanh
            if (nameInput) nameInput.value = '';
            if (priceInput) priceInput.value = '0';
            if (categorySelect) categorySelect.selectedIndex = 0;
            if (descTextarea) descTextarea.value = '';
            selectedFiles = [];
            setInfo.name(''); setInfo.price(''); setInfo.cat(''); setInfo.imgs(0);
            showTab(0);
        });

        cancelBtn && cancelBtn.addEventListener('click', () => showTab(0));
    }

    // ====== VIEW OVERVIEW (Dashboard) ======
    async function initOverviewView() {
        const view = document.querySelector('[data-view="overview"]');
        if (!view) return;

        // Elements
        const kpiCards = view.querySelectorAll('.kpis .kpi');
        const revenuePanel = view.querySelector('.panel.panel-lg .panel-placeholder');
        const tabs = view.querySelectorAll('.kpi-tabs .tab');

        function formatVND(v) {
            const n = Number(v || 0);
            return n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
        }

        async function loadOverview() {
            try {
                const res = await window.apiService.get('/dashboard/overview');
                if (res?.success) {
                    const data = res.data || {};
                    // Expect order: GMV, Pending orders, Pending products, Open tickets
                    if (kpiCards[0]) kpiCards[0].querySelector('.kpi-value').textContent = formatVND(data.gmv);
                    if (kpiCards[1]) kpiCards[1].querySelector('.kpi-value').textContent = String(data.pendingOrders || 0);
                    if (kpiCards[2]) kpiCards[2].querySelector('.kpi-value').textContent = String(data.pendingProducts || 0);
                    if (kpiCards[3]) kpiCards[3].querySelector('.kpi-value').textContent = String(data.openTickets || 0);
                }
            } catch (e) {
                // ignore
            }
        }

        async function loadRevenue(range) {
            try {
                const endpoint = range === 'day' ? '/dashboard/revenue' : `/dashboard/revenue?range=${range}`;
                const res = await window.apiService.get(endpoint);
                if (res?.success && Array.isArray(res.data) && revenuePanel) {
                    const series = res.data.map(d => ({ key: d.date || d.key, amount: Number(d.amount || 0) }));
                    const max = Math.max(1, ...series.map(s => s.amount));
                    const wrap = document.createElement('div');
                    wrap.style.display = 'grid';
                    wrap.style.gridTemplateColumns = `repeat(${series.length}, 1fr)`;
                    wrap.style.gap = '8px';
                    series.forEach(s => {
                        const barWrap = document.createElement('div');
                        barWrap.style.display = 'flex';
                        barWrap.style.flexDirection = 'column';
                        barWrap.style.alignItems = 'center';
                        const bar = document.createElement('div');
                        bar.style.height = Math.max(6, Math.round(80 * (s.amount / max))) + 'px';
                        bar.style.width = '100%';
                        bar.style.background = '#60a5fa';
                        bar.style.borderRadius = '4px';
                        const cap = document.createElement('div');
                        cap.textContent = (s.amount).toLocaleString('vi-VN');
                        cap.style.fontSize = '12px';
                        cap.style.color = '#6b7280';
                        cap.style.marginTop = '4px';
                        barWrap.appendChild(bar);
                        barWrap.appendChild(cap);
                        wrap.appendChild(barWrap);
                    });
                    revenuePanel.innerHTML = '';
                    revenuePanel.appendChild(wrap);
                }
            } catch (e) {
                // ignore
            }
        }

        loadOverview();
        loadRevenue('day');

        // Tab switching
        tabs.forEach((t, idx) => t.addEventListener('click', () => {
            tabs.forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            const ranges = ['day','week','month'];
            loadRevenue(ranges[idx] || 'day');
        }));
    }

    // ====== VIEW ORDERS ======
    async function initOrdersView() {
        const view = document.querySelector('[data-view="orders"]');
        if (!view) return;
        const listPanel = view.querySelector('.panel');
        const stats = view.querySelectorAll('.order-stats .order-stat-value');

        function render(orders) {
            if (!listPanel) return;
            const container = document.createElement('div');
            container.className = 'list';
            (orders || []).forEach(o => {
                const item = document.createElement('article');
                item.className = 'list-item';
                const total = (o.items || []).reduce((s, it) => s + Number(it.product?.price || 0) * Number(it.quantity || 0), 0);
                const itemsHtml = (o.items || []).map(it => {
                    const p = it.product || {};
                    const img = (p.images && p.images[0]?.url) || 'https://via.placeholder.com/40x40?text=';
                    const name = p.name || 'Sản phẩm';
                    const price = Number(p.price || 0).toLocaleString('vi-VN');
                    const qty = Number(it.quantity || 0);
                    return `
                        <div class="order-item" style="display:flex;align-items:center;gap:8px;margin-top:6px">
                            <img src="${img}" alt="${name}" style="width:40px;height:40px;object-fit:cover;border-radius:6px" onerror="this.src='https://via.placeholder.com/40x40?text='"/>
                            <div style="flex:1">
                                <div class="list-sub" style="font-weight:600">${name}</div>
                                <div class="list-sub">Giá: ${price} đ • SL: ${qty}</div>
                            </div>
                        </div>`;
                }).join('');
                item.innerHTML = `
                    <div class="avatar" style="width:40px;height:40px;background:#e5e7eb;border-radius:8px"></div>
                    <div style="flex:1">
                        <div class="list-title">Mã đơn: ${o.id} <span class="chip">${o.status}</span></div>
                        <div class="list-sub">Khách: ${o.user?.fullName || o.user?.username || ''} • Số món: ${(o.items||[]).length} • Tổng: ${Number(total).toLocaleString('vi-VN')} đ</div>
                        ${itemsHtml}
                    </div>`;
                container.appendChild(item);
            });
            listPanel.innerHTML = '';
            const title = document.createElement('div');
            title.className = 'panel-title';
            title.textContent = 'Danh sách đơn hàng';
            listPanel.appendChild(title);
            listPanel.appendChild(container);
        }

        try {
            const res = await window.apiService.get('/orders');
            if (res?.success) {
                const orders = res.data || [];
                render(orders);
                // stats breakdown
                const counts = orders.reduce((m, o) => { m[o.status] = (m[o.status]||0)+1; return m; }, {});
                if (stats[0]) stats[0].textContent = String(orders.length || 0);
                if (stats[1]) stats[1].textContent = String(counts['PENDING'] || 0);
                if (stats[2]) stats[2].textContent = String(counts['SHIPPING'] || 0);
                if (stats[3]) stats[3].textContent = String(counts['COMPLETED'] || 0);
            }
        } catch (_) {}
    }

    // ====== VIEW PAYMENTS ======
    async function initPaymentsView() {
        const view = document.querySelector('[data-view="payments"]');
        if (!view) return;
        const list = view.querySelector('.list');
        if (!list) return;
        try {
            const res = await window.apiService.get('/payments/pending');
            if (res?.success) {
                list.innerHTML = '';
                (res.data || []).forEach(p => {
                    const article = document.createElement('article');
                    article.className = 'list-item';
                    article.innerHTML = `
                        <div class="avatar" style="width:40px;height:40px;background:#e5e7eb;border-radius:8px"></div>
                        <div style="flex:1">
                            <div class="list-title">Họ và tên: ${p.order?.customerName || p.order?.id || ''}</div>
                            <div class="list-sub">Chờ xác nhận • Số tiền: ${Number(p.amount||0).toLocaleString('vi-VN')} đ</div>
                        </div>
                        <button class="btn" data-id="${p.id}" style="background: #22c55e; color: #fff; border-color: #16a34a">Xác nhận</button>
                    `;
                    const btn = article.querySelector('button');
                    btn.addEventListener('click', async () => {
                        const r = await window.apiService.patch(`/payments/${p.id}/confirm`);
                        if (r?.success) { article.remove(); }
                    });
                    list.appendChild(article);
                });
            }
        } catch (_) {}
    }

    // ====== VIEW USERS ======
    async function initUsersView() {
        const view = document.querySelector('[data-view="users"]');
        if (!view) return;
        const list = view.querySelector('.list');
        if (!list) return;
        try {
            const res = await window.apiService.get('/users');
            if (res?.success) {
                list.innerHTML = '';
                (res.data || []).forEach(u => {
                    const row = document.createElement('article');
                    row.className = 'list-item';
                    row.innerHTML = `
                        <div class="avatar" style="width:40px;height:40px;background:#e5e7eb;border-radius:8px"></div>
                        <div style="flex:1">
                            <div class="list-title">${u.fullName || u.username} <span class="chip ${u.isActive ? 'green':'red'}">${u.isActive?'Hoạt động':'Đã khóa'}</span></div>
                            <div class="list-sub">${u.email || ''} • Đăng ký: ${new Date(u.createdAt).toLocaleDateString('vi-VN')}</div>
                        </div>`;
                    list.appendChild(row);
                });
            }
        } catch (_) {}
    }

    // ====== VIEW RETURNS ======
    async function initReturnsView() {
        const view = document.querySelector('[data-view="returns"]');
        if (!view) return;
        const stats = view.querySelectorAll('.order-stats .order-stat-value');
        const panel = view.querySelector('.panel');
        try {
            const res = await window.apiService.get('/returns');
            if (res?.success) {
                const items = res.data || [];
                // stats: total, pending, processing, approved
                if (stats[0]) stats[0].textContent = String(items.length || 0);
                if (stats[1]) stats[1].textContent = String(items.filter(r=>r.status==='PENDING').length);
                if (stats[2]) stats[2].textContent = String(items.filter(r=>r.status==='PROCESSING').length);
                if (stats[3]) stats[3].textContent = String(items.filter(r=>r.status==='APPROVED').length);
                if (panel) {
                    const list = document.createElement('div');
                    list.className = 'list';
                    items.forEach(r => {
                        const row = document.createElement('article');
                        row.className = 'list-item';
                        const orderItems = (r.order?.items || []).map(it => {
                            const p = it.product || {};
                            const img = (p.images && p.images[0]?.url) || 'https://via.placeholder.com/40x40?text=';
                            const name = p.name || 'Sản phẩm';
                            const price = Number(p.price || 0).toLocaleString('vi-VN');
                            const qty = Number(it.quantity || 0);
                            return `
                                <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
                                    <img src="${img}" alt="${name}" style="width:40px;height:40px;object-fit:cover;border-radius:6px" onerror="this.src='https://via.placeholder.com/40x40?text='"/>
                                    <div style="flex:1">
                                        <div class="list-sub" style="font-weight:600">${name}</div>
                                        <div class="list-sub">Giá: ${price} đ • SL: ${qty}</div>
                                    </div>
                                </div>`;
                        }).join('');
                        row.innerHTML = `
                            <div class="avatar" style="width:40px;height:40px;background:#e5e7eb;border-radius:8px"></div>
                            <div style="flex:1">
                                <div class="list-title">Mã yêu cầu: ${r.id} <span class="chip">${r.status}</span></div>
                                <div class="list-sub">Đơn: ${r.orderId || ''} • Lý do: ${r.reason || ''}</div>
                                ${orderItems}
                            </div>
                            <div>
                                <button class="btn" data-a="approve">Duyệt</button>
                                <button class="btn" data-a="reject" style="margin-left:6px">Từ chối</button>
                            </div>`;
                        row.querySelector('[data-a="approve"]').addEventListener('click', async ()=>{
                            const rr = await window.apiService.patch(`/returns/${r.id}/status`, { status: 'APPROVED' });
                            if (rr?.success) row.remove();
                        });
                        row.querySelector('[data-a="reject"]').addEventListener('click', async ()=>{
                            const rr = await window.apiService.patch(`/returns/${r.id}/status`, { status: 'REJECTED' });
                            if (rr?.success) row.remove();
                        });
                        list.appendChild(row);
                    });
                    panel.innerHTML = '<div class="panel-title">Danh sách yêu cầu</div>';
                    panel.appendChild(list);
                }
            }
        } catch (_) {}
    }

    // ====== VIEW FEEDBACKS ======
    async function initFeedbacksView() {
        const view = document.querySelector('[data-view="feedbacks"]');
        if (!view) return;
        
        const tabBtns = view.querySelectorAll('.tabs .tab-btn');
        const list = view.querySelector('.panel .list');
        
        let currentTab = 'messages';
        
        function showFeedbackTab(tab) {
            currentTab = tab;
            tabBtns.forEach((btn, i) => {
                btn.classList.toggle('active', 
                    (i === 0 && tab === 'messages') ||
                    (i === 1 && tab === 'reviews') ||
                    (i === 2 && tab === 'tickets')
                );
            });
            loadFeedbacksData();
        }
        
        tabBtns.forEach((btn, i) => {
            btn.addEventListener('click', () => {
                const tabs = ['messages', 'reviews', 'tickets'];
                showFeedbackTab(tabs[i]);
            });
        });
        
        async function loadFeedbacksData() {
            if (!list) return;
            try {
                let endpoint = '/tickets';
                if (currentTab === 'reviews') endpoint = '/reviews';
                else if (currentTab === 'messages') endpoint = '/tickets?type=message';
                
                const res = await window.apiService.get(endpoint);
                if (res?.success) {
                    list.innerHTML = '';
                    (res.data || []).forEach(item => {
                        const article = document.createElement('article');
                        article.className = 'list-item';
                        
                        if (currentTab === 'reviews') {
                            article.innerHTML = `
                                <div class="avatar" style="width:40px;height:40px;background:#e5e7eb;border-radius:8px"></div>
                                <div style="flex:1">
                                    <div class="list-title">${item.user?.fullName || 'Khách hàng'} - ${item.product?.name || 'Sản phẩm'}</div>
                                    <div class="list-sub">⭐ ${item.rating}/5 • ${item.content}</div>
                                    <div class="list-sub">${new Date(item.createdAt).toLocaleDateString('vi-VN')}</div>
                                </div>
                                <span class="chip ${item.status === 'PUBLISHED' ? 'green' : 'red'}">${item.status}</span>
                            `;
                        } else {
                            article.innerHTML = `
                                <div class="avatar" style="width:40px;height:40px;background:#e5e7eb;border-radius:8px"></div>
                                <div style="flex:1">
                                    <div class="list-title">${item.subject || 'Ticket'}</div>
                                    <div class="list-sub">${item.user?.fullName || 'Khách hàng'} • ${item.content?.substring(0, 100)}...</div>
                                    <div class="list-sub">${new Date(item.createdAt).toLocaleDateString('vi-VN')}</div>
                                </div>
                                <span class="chip ${item.status === 'OPEN' ? 'yellow' : item.status === 'CLOSED' ? 'green' : 'blue'}">${item.status}</span>
                            `;
                        }
                        list.appendChild(article);
                    });
                }
            } catch (e) {
                console.error('Load feedbacks error:', e);
            }
        }
        
        loadFeedbacksData();
    }

    // ====== VIEW REPORTS ======
    async function initReportsView() {
        const view = document.querySelector('[data-view="reports"]');
        if (!view) return;
        
        const refreshBtn = document.getElementById('btnReports');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', loadReportsData);
        }
        
        async function loadReportsData() {
            try {
                const [salesRes, productsRes, usersRes] = await Promise.all([
                    window.apiService.get('/dashboard/overview'),
                    window.apiService.get('/products/stats'),
                    window.apiService.get('/users/stats')
                ]);
                
                // Update report data in UI
                console.log('Reports data loaded:', { salesRes, productsRes, usersRes });
            } catch (e) {
                console.error('Load reports error:', e);
            }
        }
        
        loadReportsData();
    }

    // ====== VIEW BANNER ======
    async function initBannerView() {
        const view = document.querySelector('[data-view="banner"]');
        if (!view) return;
        
        const addBtn = document.getElementById('btnBanner');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                // Show banner creation modal or form
                alert('Tính năng thêm banner sẽ được phát triển');
            });
        }
        
        // Load existing banners/promotions
        async function loadBannersData() {
            try {
                // Placeholder for banner API
                console.log('Loading banners...');
            } catch (e) {
                console.error('Load banners error:', e);
            }
        }
        
        loadBannersData();
    }

    // ====== GLOBAL DATA LOADING FUNCTIONS ======
    async function loadOverviewData() {
        const view = document.querySelector('[data-view="overview"]');
        if (!view || view.hidden) return;
        
        const kpiCards = view.querySelectorAll('.kpis .kpi');
        try {
            const res = await window.apiService.get('/dashboard/overview');
            if (res?.success) {
                const data = res.data || {};
                if (kpiCards[0]) kpiCards[0].querySelector('.kpi-value').textContent = formatVND(data.gmv);
                if (kpiCards[1]) kpiCards[1].querySelector('.kpi-value').textContent = String(data.pendingOrders || 0);
                if (kpiCards[2]) kpiCards[2].querySelector('.kpi-value').textContent = String(data.pendingProducts || 0);
                if (kpiCards[3]) kpiCards[3].querySelector('.kpi-value').textContent = String(data.openTickets || 0);
            }
        } catch (e) {
            console.error('Load overview data error:', e);
        }
    }

    async function loadOrdersData() {
        const view = document.querySelector('[data-view="orders"]');
        if (!view || view.hidden) return;
        
        const listPanel = view.querySelector('.panel');
        const stats = view.querySelectorAll('.order-stats .order-stat-value');
        
        try {
            const res = await window.apiService.get('/orders');
            if (res?.success) {
                const orders = res.data || [];
                
                // Update stats
                const counts = orders.reduce((m, o) => { m[o.status] = (m[o.status]||0)+1; return m; }, {});
                if (stats[0]) stats[0].textContent = String(orders.length || 0);
                if (stats[1]) stats[1].textContent = String(counts['PENDING'] || 0);
                if (stats[2]) stats[2].textContent = String(counts['SHIPPING'] || 0);
                if (stats[3]) stats[3].textContent = String(counts['COMPLETED'] || 0);
                
                // Update list
                if (listPanel) {
                    const container = document.createElement('div');
                    container.className = 'list';
                    orders.forEach(o => {
                        const item = document.createElement('article');
                        item.className = 'list-item';
                        const total = (o.items || []).reduce((s, it) => s + Number(it.product?.price || 0) * Number(it.quantity || 0), 0);
                        item.innerHTML = `
                            <div class="avatar" style="width:40px;height:40px;background:#e5e7eb;border-radius:8px"></div>
                            <div style="flex:1">
                                <div class="list-title">Mã đơn: ${o.id} <span class="chip">${o.status}</span></div>
                                <div class="list-sub">Khách: ${o.user?.fullName || o.user?.username || ''} • Tổng: ${Number(total).toLocaleString('vi-VN')} đ</div>
                            </div>`;
                        container.appendChild(item);
                    });
                    listPanel.innerHTML = '<div class="panel-title">Danh sách đơn hàng</div>';
                    listPanel.appendChild(container);
                }
            }
        } catch (e) {
            console.error('Load orders data error:', e);
        }
    }

    async function loadPaymentsData() {
        const view = document.querySelector('[data-view="payments"]');
        if (!view || view.hidden) return;
        
        const list = view.querySelector('.list');
        if (!list) return;
        
        try {
            const res = await window.apiService.get('/payments/pending');
            if (res?.success) {
                list.innerHTML = '';
                (res.data || []).forEach(p => {
                    const article = document.createElement('article');
                    article.className = 'list-item';
                    article.innerHTML = `
                        <div class="avatar" style="width:40px;height:40px;background:#e5e7eb;border-radius:8px"></div>
                        <div style="flex:1">
                            <div class="list-title">Họ và tên: ${p.order?.customerName || p.order?.id || ''}</div>
                            <div class="list-sub">Chờ xác nhận • Số tiền: ${Number(p.amount||0).toLocaleString('vi-VN')} đ</div>
                        </div>
                        <button class="btn" data-id="${p.id}" style="background: #22c55e; color: #fff; border-color: #16a34a">Xác nhận</button>
                    `;
                    const btn = article.querySelector('button');
                    btn.addEventListener('click', async () => {
                        const r = await window.apiService.patch(`/payments/${p.id}/confirm`);
                        if (r?.success) { 
                            article.remove(); 
                            // Show success notification
                            showNotification('Đã xác nhận thanh toán thành công!', 'success');
                        }
                    });
                    list.appendChild(article);
                });
            }
        } catch (e) {
            console.error('Load payments data error:', e);
        }
    }

    async function loadReturnsData() {
        const view = document.querySelector('[data-view="returns"]');
        if (!view || view.hidden) return;
        
        const stats = view.querySelectorAll('.order-stats .order-stat-value');
        const panel = view.querySelector('.panel');
        
        try {
            const res = await window.apiService.get('/returns');
            if (res?.success) {
                const items = res.data || [];
                
                // Update stats
                if (stats[0]) stats[0].textContent = String(items.length || 0);
                if (stats[1]) stats[1].textContent = String(items.filter(r=>r.status==='PENDING').length);
                if (stats[2]) stats[2].textContent = String(items.filter(r=>r.status==='PROCESSING').length);
                if (stats[3]) stats[3].textContent = String(items.filter(r=>r.status==='APPROVED').length);
            }
        } catch (e) {
            console.error('Load returns data error:', e);
        }
    }

    async function loadUsersData() {
        const view = document.querySelector('[data-view="users"]');
        if (!view || view.hidden) return;
        
        const list = view.querySelector('.list');
        if (!list) return;
        
        try {
            const res = await window.apiService.get('/users');
            if (res?.success) {
                list.innerHTML = '';
                (res.data || []).forEach(u => {
                    const row = document.createElement('article');
                    row.className = 'list-item';
                    row.innerHTML = `
                        <div class="avatar" style="width:40px;height:40px;background:#e5e7eb;border-radius:8px"></div>
                        <div style="flex:1">
                            <div class="list-title">${u.fullName || u.username} <span class="chip ${u.isActive ? 'green':'red'}">${u.isActive?'Hoạt động':'Đã khóa'}</span></div>
                            <div class="list-sub">${u.email || ''} • Đăng ký: ${new Date(u.createdAt).toLocaleDateString('vi-VN')}</div>
                        </div>`;
                    list.appendChild(row);
                });
            }
        } catch (e) {
            console.error('Load users data error:', e);
        }
    }

    async function loadProductsData() {
        const view = document.querySelector('[data-view="products"]');
        if (!view || view.hidden) return;
        
        const listPanel = view.querySelector('.panel:not(.order-filter)');
        if (!listPanel) return;
        
        try {
            const res = await window.apiService.get('/products?take=1000');
            if (res?.success) {
                const payload = res.data;
                const items = Array.isArray(payload) ? payload : (payload?.items || []);
                const container = document.createElement('div');
                container.className = 'list';
                items.forEach(p => {
                    const item = document.createElement('article');
                    item.className = 'list-item';
                    const thumb = (p.images && p.images[0]?.url) || 'https://via.placeholder.com/40x40?text=';
                    item.innerHTML = `
                        <img src="${thumb}" alt="${p.name}" class="avatar" style="width:40px;height:40px;object-fit:cover;border-radius:8px" onerror="this.src='https://via.placeholder.com/40x40?text='"/>
                        <div style="flex:1">
                            <div class="list-title">${p.name} <span class="chip ${p.isActive ? 'green' : 'red'}">${p.isActive ? 'Đang bán' : 'Ẩn'}</span></div>
                            <div class="list-sub">Giá: ${formatCurrency(p.price)} • Danh mục: ${p.category?.name || ''} • Kho: ${p.stock}</div>
                        </div>
                        <div>
                            <button class="btn" data-del="${p.id}" style="background:#ef4444;color:#fff;border-color:#dc2626">Xóa</button>
                        </div>
                    `;
                    const delBtn = item.querySelector('[data-del]');
                    delBtn.addEventListener('click', async () => {
                        if(!confirm('Xóa sản phẩm này?')) return;
                        const res = await window.apiService.delete(`/products/${p.id}`);
                        if(res?.success){
                            showNotification('Đã xóa sản phẩm', 'success');
                            await loadProductsData();
                        } else {
                            alert(res?.message || 'Xóa sản phẩm thất bại');
                        }
                    });
                    container.appendChild(item);
                });
                listPanel.innerHTML = '<div class="panel-title">Danh sách</div>';
                listPanel.appendChild(container);

                // Update KPIs
                const stats = view.querySelectorAll('.order-stats .order-stat-value');
                const total = Array.isArray(payload) ? items.length : Number(payload?.total || items.length);
                const selling = items.filter(p=>p.isActive).length;
                const outOfStock = items.filter(p=>Number(p.stock||0)===0).length;
                if (stats[0]) stats[0].textContent = String(total);
                if (stats[1]) stats[1].textContent = String(selling);
                if (stats[2]) stats[2].textContent = String(outOfStock);
            }
        } catch (e) {
            console.error('Load products data error:', e);
        }
    }

    // ====== NOTIFICATION SYSTEM ======
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
        `;
        
        const colors = {
            success: '#22c55e',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Add CSS for notifications
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    function formatVND(v) {
        const n = Number(v || 0);
        return n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
    }

    function formatCurrency(v) {
        const n = Number(String(v).replace(/[^\d.-]/g, ''));
        if (!Number.isFinite(n)) return '';
        return n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
    }
});