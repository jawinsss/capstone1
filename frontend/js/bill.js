document.addEventListener("DOMContentLoaded", async () => {
            
            const urlParams = new URLSearchParams(window.location.search);
            const orderId = urlParams.get("orderId") || sessionStorage.getItem("orderId") || "N/A";
            const customerAddress = sessionStorage.getItem("userAddress") || "Chưa có thông tin";
            const paymentMethod = sessionStorage.getItem("userPayment");
            // Lấy tổng tiền trực tiếp từ checkout
            let totalAmount = "0";
            let finalTotal = "0";
            
            // Thử lấy từ URL params trước
            const urlAmount = urlParams.get("amount");
            if (urlAmount) {
                totalAmount = urlAmount;
                finalTotal = urlAmount;
            } else {
                // Lấy từ sessionStorage hoặc tính từ checkout
                const storedTotal = sessionStorage.getItem("totalAmount");
                if (storedTotal) {
                    totalAmount = storedTotal;
                    finalTotal = storedTotal;
                }
            }
            
            const shippingFee = sessionStorage.getItem("shippingFee") || "0";

            // Format tiền tệ
            const formatCurrency = (value) => parseInt(value).toLocaleString("vi-VN") + "đ";

            // Lấy thông tin khách hàng từ API
            let customerName = "N/A";
            let customerPhone = "Chưa có thông tin";
            let customerAddressFromAPI = "Chưa có thông tin";
            
            try {
                const userResponse = await window.apiService.get("/users/profile");
                if (userResponse?.success && userResponse.data) {
                    const user = userResponse.data;
                    customerName = user.fullName || "N/A";
                    customerPhone = user.phone || "Chưa có thông tin";
                    
                    // Tạo địa chỉ đầy đủ từ thông tin user
                    if (user.fullName && user.street && user.wardName && user.provinceName) {
                        customerAddressFromAPI = `${user.street}, ${user.wardName}, ${user.provinceName}`;
                    }
                }
            } catch (error) {
                console.error("Lỗi khi lấy thông tin người dùng:", error);
                // Fallback: thử lấy từ sessionStorage nếu có
                const storedUser = sessionStorage.getItem("user");
                if (storedUser) {
                    try {
                        const user = JSON.parse(storedUser);
                        customerName = user.fullName || "N/A";
                        customerPhone = user.phone || "Chưa có thông tin";
                    } catch (e) {
                        console.error("Lỗi khi parse user từ sessionStorage:", e);
                    }
                }
            }

            // Xác định trạng thái thanh toán
            let paymentStatus = "Thành công";
            let isPaymentSuccess = true; // Track payment success
            
            if (paymentMethod === "Ví MoMo") {
                // Ưu tiên kiểm tra thông tin callback từ URL parameters
                const momoResultCode = urlParams.get("resultCode");
                const momoMessage = urlParams.get("message");
                
                if (momoResultCode !== null) {
                    // Có thông tin callback từ MoMo
                    const resultCode = parseInt(momoResultCode);
                    const decodedMessage = decodeURIComponent(momoMessage || "");
                    
                    // Xử lý các resultCode khác nhau từ MoMo
                    switch (resultCode) {
                        case 0:
                            paymentStatus = "Thành công";
                            isPaymentSuccess = true;
                            break;
                        case 1006:
                            paymentStatus = decodedMessage || "Giao dịch bị từ chối bởi người dùng";
                            isPaymentSuccess = false;
                            break;
                        case 1007:
                            paymentStatus = "Giao dịch đang được xử lý";
                            isPaymentSuccess = false;
                            break;
                        case 1008:
                            paymentStatus = "Giao dịch thất bại";
                            isPaymentSuccess = false;
                            break;
                        case 1009:
                            paymentStatus = "Giao dịch bị hủy";
                            isPaymentSuccess = false;
                            break;
                        case 1010:
                            paymentStatus = "Giao dịch hết hạn";
                            isPaymentSuccess = false;
                            break;
                        default:
                            paymentStatus = decodedMessage || `Lỗi không xác định (Code: ${resultCode})`;
                            isPaymentSuccess = false;
                    }
                } else {
                    // Không có callback, kiểm tra sessionStorage
                    const momoResponse = sessionStorage.getItem("momoResponse");
                    if (momoResponse) {
                        try {
                            const response = JSON.parse(momoResponse);
                            if (response.status === 'success') {
                                paymentStatus = response.message || "Thành công";
                            } else if (response.status === 'failed') {
                                paymentStatus = response.message || "Thất bại";
                            } else if (response.status === 'error') {
                                paymentStatus = response.message || "Lỗi kết nối";
                            }
                        } catch (error) {
                            console.error("Lỗi khi parse MoMo response:", error);
                            paymentStatus = "Không xác định được trạng thái";
                        }
                    } else {
                        // Fallback: kiểm tra thời gian tạo mã MoMo nếu không có response
                        const momoCreatedTime = sessionStorage.getItem("momoCreatedTime");
                        if (momoCreatedTime) {
                            const createdTime = new Date(momoCreatedTime);
                            const now = new Date();
                            const timeDiff = now - createdTime;
                            const fifteenMinutes = 15 * 60 * 1000; // 15 phút
                            
                            if (timeDiff > fifteenMinutes) {
                                paymentStatus = "Thất bại (Mã MoMo đã hết hạn)";
                            } else {
                                paymentStatus = "Đang chờ thanh toán";
                            }
                        } else {
                            paymentStatus = "Không xác định được trạng thái";
                        }
                    }
                }
            } else if (paymentMethod === "Thanh toán khi nhận hàng") {
                paymentStatus = "Thành công (Chờ xác nhận)";
            }

            // Lấy danh sách sản phẩm từ giỏ hàng
            let products = [];
            try {
                // Đọc từ sessionStorage (được lưu từ checkout.js) thay vì localStorage
                const cartData = sessionStorage.getItem("orderCart") || localStorage.getItem("cart");
                if (cartData) {
                    const cart = JSON.parse(cartData);
                    
                    // Lấy thông tin sản phẩm từ API (optimized - load by ID)
                    try {
                        const productPromises = cart.map(async (cartItem) => {
                            try {
                                const response = await window.apiService.get(`/products/${cartItem.productId}`);
                                if (response?.success) {
                                    const product = response.data?.data || response.data;
                                    return {
                                        name: product.name,
                                        type: product.description || "Không có mô tả",
                                        price: product.price,
                                        quantity: cartItem.quantity
                                    };
                                }
                                return null;
                            } catch (error) {
                                console.error(`Error loading product ${cartItem.productId}:`, error);
                                return null;
                            }
                        });
                        
                        const loadedProducts = await Promise.all(productPromises);
                        products = loadedProducts.filter(item => item !== null);
                    } catch (error) {
                        console.error("Lỗi khi lấy thông tin sản phẩm:", error);
                    }
                }
            } catch (error) {
                console.error("Lỗi khi đọc giỏ hàng:", error);
            }

            // Gán giá trị
            document.getElementById("orderId").textContent = orderId;
            document.getElementById("paymentDate").textContent = new Date().toLocaleString("vi-VN");
            document.getElementById("customerName").textContent = customerName;
            document.getElementById("customerPhone").textContent = customerPhone;
            document.getElementById("customerAddress").textContent = customerAddressFromAPI !== "Chưa có thông tin" ? customerAddressFromAPI : (customerAddress.split(" - ")[1] || customerAddress);
            document.getElementById("paymentMethod").textContent = paymentMethod;
            document.getElementById("totalAmount").textContent = formatCurrency(totalAmount);
            document.getElementById("shippingFee").textContent = formatCurrency(shippingFee);
            document.getElementById("finalTotal").textContent = formatCurrency(finalTotal);
            
            // Cập nhật trạng thái thanh toán
            const paymentStatusElement = document.getElementById("paymentStatus");
            if (paymentStatusElement) {
                paymentStatusElement.textContent = paymentStatus;
            }

            // Clear cart if payment is successful
            if (isPaymentSuccess) {
                console.log('Payment successful - clearing cart');
                localStorage.removeItem('cart');
                // Update cart count if CartUtils is available
                if (window.CartUtils) {
                    window.CartUtils.updateCartCount();
                }
            } else {
                console.log('Payment not successful - keeping cart');
            }

            // Hiển thị danh sách sản phẩm
            const itemsList = document.getElementById("itemsList");
            itemsList.innerHTML = "";
            
            if (products.length === 0) {
                itemsList.innerHTML = `
                    <tr>
                        <td colspan="5">Không có sản phẩm nào trong đơn hàng</td>
                    </tr>
                `;
            } else {
                products.forEach(item => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${item.name}</td>
                        <td>${item.type}</td>
                        <td>${formatCurrency(item.price)}</td>
                        <td>${item.quantity}</td>
                        <td class="total">${formatCurrency(item.price * item.quantity)}</td>
                    `;
                    itemsList.appendChild(row);
                });
            }
        });