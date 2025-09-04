document.addEventListener('DOMContentLoaded', () => {
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
            inited.add(route);
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

        addBtn && addBtn.addEventListener('click', () => {
            const name = nameInput ? (nameInput.value || '').trim() : '';
            const price = priceInput ? Number(String(priceInput.value).replace(/[^\d.-]/g, '')) : 0;
            const cat = categorySelect ? categorySelect.value : '';
            const desc = descTextarea ? (descTextarea.value || '').trim() : '';

            if (!name) return alert('Vui lòng nhập Tên sản phẩm');
            if (!cat || /chọn/i.test(cat)) return alert('Vui lòng chọn Danh mục');
            if (!desc) return alert('Vui lòng nhập Mô tả');
            if (!price || Number.isNaN(price) || price < 0) return alert('Giá bán không hợp lệ');

            // TODO: gọi API thật. Tạm thời demo:
            alert('Đã tạo sản phẩm!\n' +
                `Tên: ${name}\nGiá: ${formatCurrency(price)}\nDanh mục: ${cat}\nẢnh: ${selectedFiles.length}`);

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

    function formatCurrency(v) {
        const n = Number(String(v).replace(/[^\d.-]/g, ''));
        if (!Number.isFinite(n)) return '';
        return n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
    }
});
