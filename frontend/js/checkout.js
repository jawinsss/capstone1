const ship = 0;
document.addEventListener("DOMContentLoaded", () => {
  // ===== Cache phần tử DOM (đỡ query nhiều lần) =====
  const domCache = {
    addressModal: document.getElementById("addressModal"),
    userAddress: document.getElementById("userAddress"),
    addBtn: document.getElementById("addAddressBtn"),
    newAddressForm: document.getElementById("newAddressForm"),
    fullName: document.getElementById("fullName"),
    phone: document.getElementById("phone"),
    province: document.getElementById("province"),
    detail: document.getElementById("detail"),
    paymentModal: document.getElementById("paymentModal"),
    paymentDisplay: document.querySelector(".payment-method1 .top h3"),
    addressWarningModal: document.getElementById("addressWarningModal")
  };

  const saveSession = (key, value) => sessionStorage.setItem(key, value);
  const getSession = (key) => sessionStorage.getItem(key);

  // Load user address from API
  const loadUserAddress = async () => {
    try {
      const response = await window.apiService.get('/users/profile');
      if (response.success && response.data) {
        const user = response.data;
        if (user.fullName && user.street && user.wardName && user.provinceName) {
          const address = `${user.fullName} - ${user.street}, ${user.wardName}, ${user.provinceName}`;
          domCache.userAddress.textContent = address;
          saveSession("userAddress", address);
          
          // Update address options in modal
          updateAddressOptions(user);
        } else {
          domCache.userAddress.textContent = "Chưa có địa chỉ";
        }
      } else {
        domCache.userAddress.textContent = "Không thể tải địa chỉ";
      }
    } catch (error) {
      console.error('Error loading user address:', error);
      domCache.userAddress.textContent = "Lỗi tải địa chỉ";
    }
  };

  // Update address options in modal
  const updateAddressOptions = (user) => {
    const addressContainer = document.querySelector('.address-option');
    if (addressContainer && user.fullName && user.street && user.wardName && user.provinceName) {
      const address = `${user.fullName} - ${user.street}, ${user.wardName}, ${user.provinceName}`;
      addressContainer.innerHTML = `
        <label>
          <input type="radio" name="address" value="${address}" checked>
          ${address}
        </label>
      `;
      
      // Automatically select the first address option
      const firstRadio = addressContainer.querySelector('input[type="radio"]');
      if (firstRadio) {
        firstRadio.checked = true;
      }
    }
  };

  // Load user address on page load
  loadUserAddress();

  const cachedAddress = getSession("userAddress");
  if (cachedAddress) domCache.userAddress.textContent = cachedAddress;

  const cachedPayment = getSession("userPayment");
  if (cachedPayment) domCache.paymentDisplay.textContent = cachedPayment;

  const toggleModal = (modal, show = true) => {
    modal.hidden = !show;
    if (!show && domCache.newAddressForm) {
      domCache.newAddressForm.hidden = true;
    }
  };

  document.body.addEventListener("click", (e) => {
    const target = e.target;

    if (target.matches(".address-detail a")) {
      e.preventDefault();
      toggleModal(domCache.addressModal, true);
    }
    if (target.matches("#cancelAddressBtn")) toggleModal(domCache.addressModal, false);
    if (target.matches("#confirmAddressBtn")) {
      const selected = document.querySelector("input[name='address']:checked");
      if (selected) {
        domCache.userAddress.textContent = selected.value;
        saveSession("userAddress", selected.value);
      }
      toggleModal(domCache.addressModal, false);
    }
    if (target.matches("#addAddressBtn")) domCache.newAddressForm.hidden = false;
    if (target.matches("#cancelNewAddress")) domCache.newAddressForm.hidden = true;
    if (target.matches("#saveNewAddress")) {
      const fullName = domCache.fullName.value.trim();
      const phone = domCache.phone.value.trim();
      const province = domCache.province.value.trim();
      const detail = domCache.detail.value.trim();
      if (!fullName || !phone || !province || !detail) {
        alert("Vui lòng nhập đầy đủ thông tin!");
        return;
      }
      const newAddress = `${fullName}(${phone}) - ${detail}, ${province} `;
      const container = domCache.addBtn.closest(".hp-modal-body1");
      const option = document.createElement("div");
      option.className = "address-option";
      option.innerHTML = `
        <label>
          <input type="radio" name="address" value="${newAddress}">
          ${newAddress}
        </label>`;
      container.insertBefore(option, domCache.addBtn.parentElement);
      domCache.newAddressForm.hidden = true;
      domCache.fullName.value = "";
      domCache.phone.value = "";
      domCache.province.value = "";
      domCache.detail.value = "";
    }

    if (target.matches(".payment-method1 .top a")) {
      e.preventDefault();
      toggleModal(domCache.paymentModal, true);
    }
    if (target.matches("#cancelPaymentBtn")) toggleModal(domCache.paymentModal, false);
    if (target.matches("#confirmPaymentBtn")) {
      const selected = document.querySelector("input[name='payment']:checked");
      if (selected) {
        domCache.paymentDisplay.textContent = selected.value;
        saveSession("userPayment", selected.value);
      }
      toggleModal(domCache.paymentModal, false);
    }
    
    // Xử lý modal cảnh báo địa chỉ
    
    if (target.matches("#confirmAddressWarningBtn")) {
      toggleModal(domCache.addressWarningModal, false);
      // Chuyển đến trang cập nhật địa chỉ
      window.location.href = "../userpage/user.html";
    }
  });

  [domCache.addressModal, domCache.paymentModal, domCache.addressWarningModal].forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) toggleModal(modal, false);
    });
  });
});

// ================== TÍNH TỔNG ==================
document.addEventListener("DOMContentLoaded", () => {
  const formatCurrency = (value) => value.toLocaleString("vi-VN") + "đ";
  const parseCurrency = (str) => parseInt(str.replace(/\D/g, "")) || 0;

  const updateCheckoutTotals = () => {
    document.querySelectorAll(".checkout-products").forEach(section => {
      const priceEl = section.querySelector(".product-price");
      const qtyEl = section.querySelector(".product-qty");
      const totalEl = section.querySelector(".product-total");

      let productTotal = 0;
      if (priceEl && qtyEl && totalEl) {
        const price = parseCurrency(priceEl.textContent);
        const qty = parseInt(qtyEl.textContent) || 0;
        productTotal = price * qty;
        totalEl.textContent = formatCurrency(productTotal);
      }

      // Bây giờ chỉ hiển thị tổng tiền sản phẩm, phí ship sẽ được tính ở tổng cuối
      const checkoutTotalEl = section.querySelector(".checkout-bottom .total");
      if (checkoutTotalEl) checkoutTotalEl.textContent = formatCurrency(productTotal);
    });
  };

  updateCheckoutTotals();

  document.body.addEventListener("input", (e) => {
    if (e.target.closest(".product-qty")) updateCheckoutTotals();
  });
});

// ================== TÍNH TỔNG HÓA ĐƠN (CÓ VAT) ==================
document.addEventListener("DOMContentLoaded", () => {
  const formatCurrency = (value) => value.toLocaleString("vi-VN") + "đ";
  const parseCurrency = (str) => parseInt(str.replace(/\D/g, "")) || 0;

  const vatCheckbox = document.getElementById("vatcheckbox");

  const updateFinalSummary = () => {
    let totalProducts = 0;
    document.querySelectorAll(".product-total").forEach(el => {
      totalProducts += parseCurrency(el.textContent);
    });

    const totalProductsEl = document.querySelector(".product-total-all");
    if (totalProductsEl) totalProductsEl.textContent = formatCurrency(totalProducts);

    // Sử dụng phí ship cố định (có thể lấy từ global variable hoặc config)
    const totalShip = ship; // 30,000 VND phí ship cố định

    const totalShipEl = document.querySelector(".shipping-cost");
    if (totalShipEl) totalShipEl.textContent = formatCurrency(totalShip);

    let finalTotal = totalProducts + totalShip;

    // Thêm VAT nếu bật
    if (vatCheckbox && vatCheckbox.checked) {
      const vatAmount = finalTotal * 0.1;
      finalTotal += vatAmount;
    }

    const finalTotalEl = document.querySelector(".total-payment");
    if (finalTotalEl) finalTotalEl.textContent = formatCurrency(finalTotal);
  };

  updateFinalSummary();

  // Quan sát thay đổi
  const observer = new MutationObserver(updateFinalSummary);
  document.querySelectorAll(".product-total").forEach(el => {
    observer.observe(el, { childList: true, characterData: true, subtree: true });
  });

  // Khi bật/tắt VAT
  if (vatCheckbox) {
    vatCheckbox.addEventListener("change", updateFinalSummary);
  } else {
    console.warn("Không tìm thấy #vatcheckbox trong DOM!");
  }
});


// ================== VOUCHER ==================
document.addEventListener("DOMContentLoaded", () => {
  const voucherModal = document.getElementById("voucherModal");
  const openVoucherLink = document.querySelector(".voucher a");
  const cancelVoucherBtn = document.getElementById("cancelVoucherBtn");
  const confirmVoucherBtn = document.getElementById("confirmVoucherBtn");
  const applyVoucherBtn = document.getElementById("applyVoucherBtn");
  const voucherInput = document.getElementById("voucherCode");

  const toggleVoucherModal = (show = true) => {
    voucherModal.hidden = !show;
  };

  // Mở modal khi click "Chọn Voucher"
  openVoucherLink.addEventListener("click", (e) => {
    e.preventDefault();
    toggleVoucherModal(true);
  });

  // Nút trở lại
  cancelVoucherBtn.addEventListener("click", () => {
    toggleVoucherModal(false);
  });

  // Nút OK
  confirmVoucherBtn.addEventListener("click", () => {
    const selected = document.querySelector("input[name='voucher']:checked");
    if (selected) {
      alert("Bạn đã chọn: " + selected.value);
    } else if (voucherInput.value.trim()) {
      alert("Bạn đã nhập mã: " + voucherInput.value.trim());
    } else {
      alert("Chưa chọn voucher nào!");
    }
    toggleVoucherModal(false);
  });

  // Nút ÁP DỤNG
  applyVoucherBtn.addEventListener("click", () => {
    if (voucherInput.value.trim()) {
      alert("Áp dụng mã: " + voucherInput.value.trim());
    } else {
      alert("Vui lòng nhập mã voucher!");
    }
  });

  // Click ngoài modal để đóng
  voucherModal.addEventListener("click", (e) => {
    if (e.target === voucherModal) toggleVoucherModal(false);
  });
});

// ================== XỬ LÝ ĐẶT HÀNG ==================
document.addEventListener("DOMContentLoaded", () => {
  const placeOrderBtn = document.querySelector(".place-order-btn");
  if (!placeOrderBtn) return;

  placeOrderBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    
    // Validate stock before proceeding
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cart.length === 0) {
      alert('Giỏ hàng của bạn đang trống!');
      return;
    }
    
    // Load products and check stock
    const stockErrors = [];
    for (const item of cart) {
      try {
        const response = await window.apiService.get(`/products/${item.productId}`);
        if (response?.success) {
          const product = response.data?.data || response.data;
          if (product.stock < item.quantity) {
            stockErrors.push({
              name: product.name,
              requested: item.quantity,
              available: product.stock
            });
          }
        }
      } catch (error) {
        console.error(`Error checking stock for product ${item.productId}:`, error);
      }
    }
    
    if (stockErrors.length > 0) {
      const errorMsg = stockErrors.map(err => 
        `${err.name}: Bạn đặt ${err.requested}, chỉ còn ${err.available} trong kho`
      ).join('\n');
      alert(`Không thể đặt hàng. Vượt quá số lượng tồn kho:\n\n${errorMsg}\n\nVui lòng cập nhật giỏ hàng!`);
      // Redirect back to cart to update quantities
      window.location.href = 'cart.html';
      return;
    }
    
    // Kiểm tra địa chỉ giao hàng trước khi đặt hàng
    const storedAddress = sessionStorage.getItem("userAddress");
    const addressEl = document.getElementById("userAddress");
    const addressText = addressEl ? (addressEl.textContent || "").trim() : "";
    const hasAddress = !!(storedAddress && storedAddress.trim()) || (addressText && !addressText.includes("Chưa có địa chỉ"));

    if (!hasAddress) {
      // Hiển thị modal thay vì alert
      addressWarningModal.hidden = false;
      return;
    }
    
    // Get user info if logged in
    let userEmail = `guest-${Date.now()}@example.com`;
    let userFullName = 'Khách hàng';
    let userPhone = '';
    
    try {
      const userData = JSON.parse(localStorage.getItem('user_data') || 'null');
      if (userData) {
        userEmail = userData.email || userEmail;
        userFullName = userData.fullName || userFullName;
        userPhone = userData.phone || userPhone;
      }
    } catch (e) {
      console.log('No user data found, using guest info');
    }
    
    // Parse address to get customer info
    if (storedAddress && storedAddress.includes(' - ')) {
      const addressParts = storedAddress.split(' - ');
      if (addressParts[0]) {
        userFullName = addressParts[0];
      }
    }
    
    // Prepare order data
    const orderData = {
      customer: {
        fullName: userFullName,
        email: userEmail,
        phone: userPhone,
        address: storedAddress || ''
      },
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      payment: {
        method: sessionStorage.getItem("userPayment") || 'COD'
      }
    };
    
    // Create order in backend (this will decrease stock)
    console.log('Creating order with data:', orderData);
    let createdOrder;
    try {
      const orderResponse = await window.apiService.post('/orders', orderData);
      console.log('Order creation response:', orderResponse);
      
      // Handle both success response formats
      // Response can be: {success: true, data: order} OR direct order object
      if (orderResponse?.success && orderResponse.data) {
        createdOrder = orderResponse.data;
      } else if (orderResponse?.id) {
        createdOrder = orderResponse;
      } else {
        console.error('Invalid order response:', orderResponse);
        alert('Có lỗi khi tạo đơn hàng. Vui lòng thử lại!');
        return;
      }
      
      console.log('Order created successfully:', createdOrder);
      console.log('Order ID:', createdOrder.id);
      console.log('Order Code:', createdOrder.code);
      
      // Store order info for bill page
      sessionStorage.setItem('lastOrderId', createdOrder.id);
      sessionStorage.setItem('lastOrderCode', createdOrder.code);
      sessionStorage.setItem('lastOrderData', JSON.stringify(createdOrder));
      
      console.log('✅ Order created and stock decreased!');
      
    } catch (error) {
      console.error('Error creating order:', error);
      
      // Check if error is about stock
      if (error.message && error.message.includes('tồn kho')) {
        alert('Không thể đặt hàng:\n\n' + error.message + '\n\nVui lòng cập nhật giỏ hàng!');
        window.location.href = 'cart.html';
      } else {
        alert('Có lỗi khi tạo đơn hàng: ' + (error.message || 'Vui lòng thử lại!'));
      }
      return;
    }
    
    const payment = sessionStorage.getItem("userPayment");

    if (payment === "Ví MoMo") {
      const total = document.querySelector(".total-payment").textContent;
      const amount = parseInt(total.replace(/\D/g, "")) || 0;
      
      // Lưu tổng tiền vào sessionStorage cho bill.js
      sessionStorage.setItem("totalAmount", amount.toString());
      try {
        const res = await fetch("http://localhost:3000/payment-gateway/create-momo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount })
        });
        const data = await res.json();
        if (data.payUrl) {
          // Lưu cart items vào sessionStorage để bill.js sử dụng
          const currentCart = localStorage.getItem('cart');
          sessionStorage.setItem('orderCart', currentCart || '[]');
          
          // Lưu thông tin MoMo response để sử dụng trong bill.js
          sessionStorage.setItem("momoCreatedTime", new Date().toISOString());
          sessionStorage.setItem("momoResponse", JSON.stringify({
            status: data.status,
            message: data.message,
            resultCode: data.resultCode,
            timestamp: data.timestamp
          }));
          // Clear cart before redirecting to payment
          localStorage.removeItem('cart');
          window.location.href = data.payUrl;
        } else {
          // Lưu thông tin lỗi để hiển thị trong bill
          sessionStorage.setItem("momoResponse", JSON.stringify({
            status: 'failed',
            message: data.message || 'Không tạo được mã thanh toán MoMo',
            resultCode: data.resultCode || -1,
            timestamp: new Date().toISOString()
          }));
          alert("Không tạo được QR MoMo: " + JSON.stringify(data));
        }
      } catch (err) {
        // Lưu thông tin lỗi để hiển thị trong bill
        sessionStorage.setItem("momoResponse", JSON.stringify({
          status: 'error',
          message: 'Lỗi kết nối server MoMo: ' + err.message,
          resultCode: -1,
          timestamp: new Date().toISOString()
        }));
        alert("Lỗi kết nối server MoMo: " + err.message);
      }
    } else if (payment === "Ví ZaloPay") {
      const total = document.querySelector(".total-payment").textContent;
      const amount = parseInt(total.replace(/\D/g, "")) || 0;
      
      // Lưu tổng tiền vào sessionStorage cho bill.js
      sessionStorage.setItem("totalAmount", amount.toString());
      try {
        const res = await fetch("http://localhost:3000/payment-gateway/create-zalopay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        });
        const data = await res.json();
        if (data.order_url) {
          // Lưu cart items vào sessionStorage để bill.js sử dụng
          const currentCart = localStorage.getItem('cart');
          sessionStorage.setItem('orderCart', currentCart || '[]');
          
          // Clear cart before redirecting to payment
          localStorage.removeItem('cart');
          window.location.href = data.order_url;
        } else {
          alert("Không tạo được đơn ZaloPay: " + JSON.stringify(data));
        }
      } catch (err) {
        alert("Lỗi kết nối ZaloPay: " + err.message);
      }
    } else {
      // Thanh toán khi nhận hàng (COD)
      const total = document.querySelector(".total-payment").textContent;
      const amount = parseInt(total.replace(/\D/g, "")) || 0;
      
      // Lưu tổng tiền vào sessionStorage cho bill.js
      sessionStorage.setItem("totalAmount", amount.toString());
      
      const orderModal = document.getElementById("order-successfully");
      if (orderModal) {
        orderModal.hidden = false;
        const viewBillBtn = orderModal.querySelector("button.hp-btn.primary");
        if (viewBillBtn) {
          viewBillBtn.addEventListener("click", () => {
            orderModal.hidden = true;
            // Lưu cart items vào sessionStorage để bill.js sử dụng
            const currentCart = localStorage.getItem('cart');
            sessionStorage.setItem('orderCart', currentCart || '[]');
            
            // Clear cart before redirecting to bill
            localStorage.removeItem('cart');
            // Update cart count
            if (window.CartUtils) {
              window.CartUtils.updateCartCount();
            }
            // Chuyển đến bill.html
            window.location.href = "../homepage/bill.html";
          });
        }
      }
    }
  });
});

// ============ XEM TRƯỚC HÓA ĐƠN (Preview Invoice) ============
(function() {
  // Helper định dạng
  const parseCurrency = (s) => parseInt((s||"").toString().replace(/\D/g, "")) || 0;
  const formatCurrency = (n) => (n || 0).toLocaleString("vi-VN") + "đ";

  // Chuyển số thành chữ (đơn giản, hỗ trợ đến hàng tỷ)
  function numberToVietnamese(n) {
    if (n === 0) return "Không đồng";
    const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    const teens = ["mười", "mười một", "mười hai"];
    const scales = ["", "nghìn", "triệu", "tỷ"];
    const readHundred = (num) => {
      let s = "";
      const hundred = Math.floor(num / 100);
      const tenUnit = num % 100;
      const ten = Math.floor(tenUnit / 10);
      const unit = tenUnit % 10;
      if (hundred) s += units[hundred] + " trăm";
      if (ten === 0 && unit > 0) {
        s += (s ? " lẻ " : "") + (unit === 5 ? "năm" : units[unit]);
      } else if (ten === 1) {
        s += (s ? " " : "") + "mười" + (unit ? " " + (unit === 5 ? "lăm" : units[unit]) : "");
      } else if (ten > 1) {
        s += (s ? " " : "") + units[ten] + " mươi" + (unit ? " " + (unit === 1 ? "mốt" : (unit === 5 ? "lăm" : units[unit])) : "");
      }
      return s.trim();
    };

    const parts = [];
    let scale = 0;
    while (n > 0) {
      const chunk = n % 1000;
      if (chunk) {
        const chunkText = readHundred(chunk);
        parts.unshift(chunkText + (scales[scale] ? " " + scales[scale] : ""));
      }
      n = Math.floor(n / 1000);
      scale++;
    }
    const result = parts.join(" ").replace(/\s+/g, " ").trim();
    return result.charAt(0).toUpperCase() + result.slice(1) + " đồng";
  }

  // Tìm link "Xem trước hóa đơn" gắn sự kiện
  const previewLinks = Array.from(document.querySelectorAll(".voucher a"))
    .filter(a => a.textContent && a.textContent.trim().toLowerCase().includes("xem trước hóa đơn"));

  if (previewLinks.length === 0) {
    // Nếu không tìm thấy theo class .voucher, tìm toàn trang
    previewLinks.push(...Array.from(document.querySelectorAll("a")).filter(a => a.textContent && a.textContent.trim().toLowerCase().includes("xem trước hóa đơn")));
  }

  previewLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      // Thu thập dữ liệu từng sản phẩm
      const rows = [];
      document.querySelectorAll(".checkout-products .product-row").forEach(pr => {
        const nameEl = pr.querySelector(".product-name");
        const priceEl = pr.querySelector(".product-price");
        const qtyEl = pr.querySelector(".product-qty");
        const totalEl = pr.querySelector(".product-total");
        if (!nameEl) return;
        const name = nameEl.textContent.trim();
        const price = parseCurrency(priceEl ? priceEl.textContent : "0");
        const qty = parseInt((qtyEl ? qtyEl.textContent : "0").toString()) || 0;
        const total = parseCurrency(totalEl ? totalEl.textContent : String(price * qty));
        rows.push({ name, price, qty, total });
      });

      // Tổng tiền hàng
      const totalProducts = rows.reduce((s,r)=> s + r.total, 0);

      // Phí vận chuyển cố định
      const totalShip = ship; // 30,000 VND phí ship cố định

      // VAT checkbox
      const vatCheckbox = document.getElementById("vatcheckbox");
      const hasVAT = !!(vatCheckbox && vatCheckbox.checked);

      // VAT amount
      const vatAmount = hasVAT ? Math.round((totalProducts + totalShip) * 0.1) : 0;
      const grandTotal = totalProducts + totalShip + vatAmount;

      // Thông tin header (bán / mua) - lấy từ DOM nếu có, nếu không thì rỗng
      const sellerNameEl = document.querySelector(".hp-topbar .hp-supplier-link");
      const sellerName = sellerNameEl ? sellerNameEl.textContent.trim() : "Nhà bán hàng";

      // Tạo HTML hóa đơn
      const invoiceHTML = `
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8"/>
          <title>Hóa đơn - Nháp</title>
          <style>
            body { font-family: DejaVu Sans, Arial, sans-serif; color:#111; padding:20px; }
            .inv { max-width:800px; margin:0 auto; border:1px solid #000; padding:16px; }
            .inv h1 { text-align:center; margin:2px 0 8px; font-size:20px; }
            .inv .meta { display:flex; justify-content:space-between; margin-bottom:12px; font-size:13px; }
            .inv .meta .left, .inv .meta .right { width:48%; }
            table { width:100%; border-collapse:collapse; font-size:13px; }
            th, td { border:1px solid #444; padding:6px 8px; text-align:left; }
            th { background:#efefef; }
            td.right { text-align:right; }
            .totals { width:100%; margin-top:10px; display:flex; justify-content:flex-end; }
            .totals table { width:400px; border:none; }
            .totals td { border:none; padding:6px 8px; }
            .note { margin-top:12px; font-style:italic; }
            .sign { display:flex; justify-content:space-between; margin-top:40px; }
            .small { font-size:12px; color:#555; }
          </style>
        </head>
        <body>
          <div class="inv">
            <h1>HÓA ĐƠN BÁN HÀNG (NHÁP)</h1>
            <div class="meta">
              <div class="left">
                <strong>Đơn vị bán hàng:</strong><br/>
                ${sellerName || ""}<br/>
                <span class="small">Địa chỉ: ...</span>
              </div>
              <div class="right">
                <strong>Ngày:</strong> ${new Date().toLocaleDateString()}<br/>
                <strong>Số hóa đơn:</strong> NV-${Date.now().toString().slice(-6)}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width:40px">STT</th>
                  <th>Tên hàng hóa, dịch vụ</th>
                  <th style="width:80px">Đơn giá</th>
                  <th style="width:70px">Số lượng</th>
                  <th style="width:120px">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map((r,i)=>`
                  <tr>
                    <td style="text-align:center">${i+1}</td>
                    <td>${r.name}</td>
                    <td class="right">${formatCurrency(r.price)}</td>
                    <td class="right">${r.qty}</td>
                    <td class="right">${formatCurrency(r.total)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div class="totals">
              <table>
                <tr>
                  <td>Tổng tiền hàng</td>
                  <td class="right">${formatCurrency(totalProducts)}</td>
                </tr>
                <tr>
                  <td>Phí vận chuyển</td>
                  <td class="right">${formatCurrency(totalShip)}</td>
                </tr>
                <tr>
                  <td>VAT (10%)</td>
                  <td class="right">${formatCurrency(vatAmount)}</td>
                </tr>
                <tr style="font-weight:700; border-top:1px solid #444;">
                  <td>Tổng thanh toán</td>
                  <td class="right">${formatCurrency(grandTotal)}</td>
                </tr>
              </table>
            </div>

            <p class="note"><strong>Số tiền viết bằng chữ:</strong> ${numberToVietnamese(grandTotal)}</p>

            <div class="sign">
              <div>
                <p><strong>Người mua hàng</strong></p>
                <p style="margin-top:50px">Ký, họ tên</p>
              </div>
              <div style="text-align:center">
                <p><strong>Người bán hàng</strong></p>
                <p style="margin-top:20px">${sellerName}</p>
                <p style="margin-top:30px">Ký, họ tên</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Mở cửa sổ mới và in HTML
      const w = window.open("", "_blank");
      if (!w) {
        alert("Trình duyệt chặn popup. Vui lòng cho phép popup hoặc mở link trong tab mới.");
        return;
      }
      w.document.open();
      w.document.write(invoiceHTML);
      w.document.close();
      w.focus();
    });
  });
})();

class CheckoutPage {
  constructor() {
    this.cart = [];
    this.products = [];
    this.shippingFee = ship;
    this.vatEnabled = false;

    this.dom = {
      productsGrid: document.getElementById('productsGrid'),
      addressContainer: document.querySelector(".address-option"),
      vatCheckbox: document.getElementById("vatcheckbox"),
      totalPayment: document.querySelector(".total-payment"),
      totalProduct: document.querySelector(".product-total-all"),
      totalShip: document.querySelector(".shipping-cost")
    };

    this.init();
  }

  async init() {
    this.loadCart();
    await this.loadProducts();
    this.renderCheckoutItems();
    await this.renderUserAddress();
    this.bindEvents();
    this.updateTotals();
  }

  loadCart() {
    try {
      this.cart = JSON.parse(localStorage.getItem("cart") || "[]");
    } catch (e) {
      this.cart = [];
    }
  }

  async loadProducts() {
    try {
      // Load products by ID (same as cart.js optimization)
      const cartProductIds = this.cart.map(item => item.productId);
      
      if (cartProductIds.length === 0) {
        this.products = [];
        return;
      }
      
      // Load each product individually
      const productPromises = cartProductIds.map(async (productId) => {
        try {
          const response = await window.apiService.get(`/products/${productId}`);
          if (response?.success) {
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
      
      console.log(`Checkout: Loaded ${this.products.length} products for ${this.cart.length} cart items`);
    } catch (error) {
      console.error('Error loading products:', error);
      this.products = [];
    }
  }

  getProductById(id) {
    return this.products.find(p => p.id === id);
  }

  renderCheckoutItems() {
    const container = document.getElementById('productsGrid');
    if (!container) {
      console.error('Products grid container not found');
      return;
    }

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div class="empty-cart">
          <i class="fa-solid fa-shopping-cart"></i>
          <h3>Giỏ hàng của bạn đang trống</h3>
          <p>Hãy thêm sản phẩm vào giỏ hàng để tiếp tục thanh toán</p>
          <a href="product-all.html" class="btn-continue-shopping">
            <i class="fa-solid fa-arrow-left"></i>
            Tiếp tục mua sắm
          </a>
        </div>
      `;
      return;
    }

    // Render products using the original checkout structure (lines 185-220)
    container.innerHTML = this.cart.map(cartItem => {
      const product = this.getProductById(cartItem.productId);
      if (!product) return '';

      const image = product.images?.[0]?.url || 'https://via.placeholder.com/60';
      const price = this.formatVND(product.price);
      const subtotal = this.formatVND(product.price * cartItem.quantity);

      return `
        <section class="checkout-products">
          <div class="shop-header">
            <span class="products">Sản Phẩm</span>
            <p>Đơn giá</p>
            <p>Số lượng</p>
            <p>Thành tiền</p>
          </div>
          <div class="product-row" data-product-id="${product.id}">
            <div class="product-info">
              <img src="${image}" alt="${product.name}" class="product-img" 
                   onerror="this.src='https://via.placeholder.com/60'">
              <div class="product-detail">
                <p class="product-name">${product.name}</p>
                <p class="product-type">${product.description}</p>
              </div>
            </div>
            <div class="product-price">${price}</div>
            <div class="product-qty">${cartItem.quantity}</div>
            <div class="product-total">${subtotal}</div>
          </div>
          <div class="total">
            <div class="checkout-top">
              <div class="checkout-note">
                <label for="buyerNote-${product.id}">Lời nhắn:</label>
                <input type="text" id="buyerNote-${product.id}" placeholder="Lưu ý cho Người bán...">
              </div>
            </div>
            <div class="checkout-bottom">
              <span>Tổng số tiền:</span>
              <strong class="total">${subtotal}</strong>
            </div>
          </div>
        </section>
      `;
    }).join('');
  }

  async renderUserAddress() {
    const container = this.dom.addressContainer;
    if (!container) return;

    try {
      const res = await window.apiService.get("/users/profile");
      if (res.success && res.data) {
        const u = res.data;
        if (u.fullName && u.street && u.wardName && u.provinceName) {
          const address = `${u.fullName} - ${u.street}, ${u.wardName}, ${u.provinceName}`;
          container.innerHTML = `
            <label>
              <input type="radio" name="address" value="${address}" checked>
              ${address}
            </label>
          `;
          sessionStorage.setItem("userAddress", address);
        } else {
          container.innerHTML = `<p>Chưa có địa chỉ, vui lòng thêm mới.</p>`;
        }
      } else {
        container.innerHTML = `<p>Lỗi tải địa chỉ người dùng.</p>`;
      }
    } catch (err) {
      console.error("Error loading address:", err);
      container.innerHTML = `<p>Lỗi khi tải địa chỉ.</p>`;
    }
  }

  bindEvents() {
    // Quantity input changes for checkout structure
    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('quantity-input')) {
        const productId = e.target.dataset.productId;
        let value = parseInt(e.target.value, 10);

        if (isNaN(value) || value < 1) {
          e.target.value = 1;
          value = 1;
        } else {
          e.target.value = value;
        }

        this.updateQuantity(productId, value);
      }
    });

    // VAT checkbox
    if (this.dom.vatCheckbox) {
      this.dom.vatCheckbox.addEventListener("change", e => {
        this.vatEnabled = e.target.checked;
        this.updateTotals();
      });
    }
  }

  updateQuantity(id, qty) {
    const item = this.cart.find(i => i.productId === id);
    if (item) item.quantity = qty;
    localStorage.setItem("cart", JSON.stringify(this.cart));
    
    // Update the specific product row without re-rendering everything
    const productRow = document.querySelector(`[data-product-id="${id}"]`);
    if (productRow) {
      const product = this.getProductById(id);
      if (product) {
        const subtotal = product.price * qty;
        const productTotalEl = productRow.querySelector('.product-total');
        const checkoutTotalEl = productRow.closest('.checkout-products').querySelector('.checkout-bottom .total');
        
        if (productTotalEl) {
          productTotalEl.textContent = this.formatVND(subtotal);
        }
        if (checkoutTotalEl) {
          checkoutTotalEl.textContent = this.formatVND(subtotal);
        }
      }
    }
    
    this.updateTotals();
  }


  calculateSubtotal() {
    return this.cart.reduce((sum, i) => {
      const p = this.getProductById(i.productId);
      return p ? sum + p.price * i.quantity : sum;
    }, 0);
  }

  calculateTotal() {
    let total = this.calculateSubtotal() + this.shippingFee;
    if (this.vatEnabled) total *= 1.1;
    return total;
  }

  updateTotals() {
    const subtotal = this.calculateSubtotal();
    const total = this.calculateTotal();

    if (this.dom.totalProduct)
      this.dom.totalProduct.textContent = this.formatVND(subtotal);
    if (this.dom.totalShip)
      this.dom.totalShip.textContent = this.formatVND(this.shippingFee);
    if (this.dom.totalPayment)
      this.dom.totalPayment.textContent = this.formatVND(total);
    
    // Lưu phí ship vào sessionStorage để bill.js sử dụng
    sessionStorage.setItem("shippingFee", this.shippingFee.toString());
  }

  formatVND(amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(amount);
  }
}

document.addEventListener("DOMContentLoaded", () => new CheckoutPage());
