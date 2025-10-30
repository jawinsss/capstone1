// Chatbot Widget Popup - Draggable & Resizable
const API_URL = window.CONFIG?.API_BASE_URL || 'http://localhost:3000';

class ChatbotWidget {
    constructor() {
        this.isOpen = false;
        this.isMinimized = false;
        this.conversationId = null;
        this.userId = null;
        this.sessionId = null;
        this.isSidebarOpen = false;
        
        // Dragging state
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.widgetStartX = 0;
        this.widgetStartY = 0;
        
        // Load user info
        this.loadUserInfo();
        this.loadSessionId();
        
        // Create widget
        this.createWidget();
        this.attachEventListeners();
        
        // Check system status
        this.checkSystemStatus();
    }

    loadUserInfo() {
        try {
            // Try 'user_data' key first (current system)
            let userData = localStorage.getItem('user_data');
            
            // Fallback to 'user' key for compatibility
            if (!userData) {
                userData = localStorage.getItem('user');
            }
            
            if (userData) {
                const user = JSON.parse(userData);
                this.userId = user.id;
                console.log('✅ Chatbot Widget: User logged in, userId =', this.userId);
                console.log('✅ Chatbot Widget: User data =', user);
            } else {
                console.log('ℹ️ Chatbot Widget: No user in localStorage');
            }
        } catch (error) {
            console.error('❌ Chatbot Widget: Error loading user info:', error);
        }
    }

    loadSessionId() {
        if (!this.userId) {
            let sessionId = localStorage.getItem('chatbot_session_id');
            if (!sessionId) {
                sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('chatbot_session_id', sessionId);
            }
            this.sessionId = sessionId;
        }
    }

    createWidget() {
        // Create floating button
        const floatingBtn = document.createElement('button');
        floatingBtn.id = 'chatbot-floating-btn';
        floatingBtn.className = 'chatbot-floating-btn';
        floatingBtn.innerHTML = '<i class="fas fa-robot"></i>';
        floatingBtn.title = 'Chat với AI MatFlow';
        document.body.appendChild(floatingBtn);

        // Create widget container
        const widget = document.createElement('div');
        widget.id = 'chatbot-widget';
        widget.className = 'chatbot-widget hidden';
        widget.innerHTML = `
            <div class="chatbot-widget-wrapper">
                <!-- Sidebar -->
                ${this.userId ? `
                <div class="chatbot-widget-sidebar ${this.isSidebarOpen ? 'show' : 'hidden'}" id="widgetSidebar">
                    <div class="sidebar-header">
                        <h3><i class="fas fa-history"></i> Lịch sử</h3>
                        <div class="sidebar-actions">
                            <button id="widgetNewChat" class="btn-new-chat" title="Tạo hội thoại mới">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button id="widgetClearAllHistory" class="btn-clear-all" title="Xóa tất cả lịch sử">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                    <div class="conversations-list" id="widgetConversationsList">
                        <div class="no-conversations">
                            <i class="fas fa-comments"></i>
                            <p>Chưa có hội thoại</p>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- Main Chat -->
                <div class="chatbot-widget-main">
                    <div class="chatbot-widget-header" id="widgetHeader">
                        ${this.userId ? `
                        <button id="widgetToggleSidebar" class="btn-widget-action">
                            <i class="fas fa-bars"></i>
                        </button>
                        ` : ''}
                        <div class="chatbot-widget-title">
                            <i class="fas fa-robot"></i>
                            <span>MatFlow AI</span>
                        </div>
                        <div class="chatbot-widget-actions">
                            <button id="widgetMinimize" class="btn-widget-action" title="Thu nhỏ">
                                <i class="fas fa-minus"></i>
                            </button>
                            <button id="widgetClose" class="btn-widget-action" title="Đóng">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>

                    <div class="chatbot-widget-messages" id="widgetMessages">
                        <div class="message bot">
                            <div class="message-avatar">
                                <i class="fas fa-robot"></i>
                            </div>
                            <div class="message-content">
                                <p>Xin chào! Tôi là trợ lý AI của MatFlow. Tôi có thể giúp bạn:</p>
                                <ul>
                                    <li>🔍 Tìm kiếm và tư vấn sản phẩm</li>
                                    <li>🛒 Thêm sản phẩm vào giỏ hàng</li>
                                    <li>👤 Cập nhật thông tin cá nhân</li>
                                    <li>📧 Gửi email liên hệ</li>
                                    <li>📦 Tra cứu đơn hàng</li>
                                    <li>❓ Trả lời mọi câu hỏi</li>
                                </ul>
                                <p>Bạn cần tư vấn gì?</p>
                            </div>
                        </div>
                    </div>

                    <div class="typing-indicator hidden" id="widgetTyping">
                        <div class="message bot">
                            <div class="message-avatar">
                                <i class="fas fa-robot"></i>
                            </div>
                            <div class="typing-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>

                    <div class="chatbot-widget-input">
                        <textarea 
                            id="widgetInput" 
                            placeholder="Nhập câu hỏi của bạn..."
                            rows="1"
                        ></textarea>
                        <button id="widgetSend" class="btn-widget-send">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(widget);

        // Store references
        this.floatingBtn = floatingBtn;
        this.widget = widget;
        this.messagesContainer = document.getElementById('widgetMessages');
        this.inputField = document.getElementById('widgetInput');
        this.sendBtn = document.getElementById('widgetSend');
        this.typingIndicator = document.getElementById('widgetTyping');
        this.sidebar = document.getElementById('widgetSidebar');
        this.conversationsList = document.getElementById('widgetConversationsList');
    }

    attachEventListeners() {
        // Floating button
        this.floatingBtn.addEventListener('click', () => this.toggleWidget());

        // Widget controls
        document.getElementById('widgetClose')?.addEventListener('click', () => this.closeWidget());
        document.getElementById('widgetMinimize')?.addEventListener('click', () => this.minimizeWidget());
        document.getElementById('widgetToggleSidebar')?.addEventListener('click', () => this.toggleSidebar());
        document.getElementById('widgetNewChat')?.addEventListener('click', () => this.startNewConversation());
        document.getElementById('widgetClearAllHistory')?.addEventListener('click', () => this.clearAllHistory());

        // Dragging
        const header = document.getElementById('widgetHeader');
        header.addEventListener('mousedown', (e) => this.startDragging(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.stopDragging());

        // Send message
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        this.inputField.addEventListener('input', () => {
            this.inputField.style.height = 'auto';
            this.inputField.style.height = Math.min(this.inputField.scrollHeight, 120) + 'px';
        });

        // Note: Conversations will be loaded when widget is opened
        // to ensure proper timing and visibility
    }

    toggleWidget() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.widget.classList.remove('hidden');
            this.floatingBtn.classList.add('hidden');
            this.inputField.focus();
            // Load conversations and auto-show sidebar if user has history
            if (this.userId) {
                this.loadConversations();
            }
        } else {
            this.widget.classList.add('hidden');
            this.floatingBtn.classList.remove('hidden');
        }
    }

    closeWidget() {
        this.isOpen = false;
        this.widget.classList.add('hidden');
        this.floatingBtn.classList.remove('hidden');
    }

    minimizeWidget() {
        this.isMinimized = !this.isMinimized;
        this.widget.classList.toggle('minimized');
        const icon = document.querySelector('#widgetMinimize i');
        if (this.isMinimized) {
            icon.className = 'fas fa-square';
        } else {
            icon.className = 'fas fa-minus';
        }
    }

    toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
        if (this.isSidebarOpen) {
            this.sidebar?.classList.remove('hidden');
            this.sidebar?.classList.add('show');
        } else {
            this.sidebar?.classList.remove('show');
            this.sidebar?.classList.add('hidden');
        }
    }

    showSidebar() {
        console.log('👁️ Chatbot Widget: Showing sidebar, sidebar element:', this.sidebar);
        this.isSidebarOpen = true;
        if (this.sidebar) {
            this.sidebar.classList.remove('hidden');
            this.sidebar.classList.add('show');
            console.log('✅ Sidebar classes:', this.sidebar.className);
        } else {
            console.error('❌ Sidebar element not found!');
        }
    }

    startDragging(e) {
        if (e.target.closest('.btn-widget-action')) return;
        
        this.isDragging = true;
        this.widget.style.cursor = 'grabbing';
        
        const rect = this.widget.getBoundingClientRect();
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.widgetStartX = rect.left;
        this.widgetStartY = rect.top;
    }

    drag(e) {
        if (!this.isDragging) return;
        
        e.preventDefault();
        
        const deltaX = e.clientX - this.dragStartX;
        const deltaY = e.clientY - this.dragStartY;
        
        let newX = this.widgetStartX + deltaX;
        let newY = this.widgetStartY + deltaY;
        
        // Boundaries
        const maxX = window.innerWidth - this.widget.offsetWidth;
        const maxY = window.innerHeight - this.widget.offsetHeight;
        
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        
        this.widget.style.right = 'auto';
        this.widget.style.bottom = 'auto';
        this.widget.style.left = newX + 'px';
        this.widget.style.top = newY + 'px';
    }

    stopDragging() {
        this.isDragging = false;
        this.widget.style.cursor = '';
    }

    async sendMessage() {
        const message = this.inputField.value.trim();
        if (!message) return;

        this.addUserMessage(message);
        this.inputField.value = '';
        this.inputField.style.height = 'auto';
        
        this.setInputState(false);
        this.showTypingIndicator();

        try {
            const requestBody = {
                message: message,
                conversationId: this.conversationId,
            };

            if (this.userId) {
                requestBody.userId = this.userId;
            } else if (this.sessionId) {
                requestBody.sessionId = this.sessionId;
            }

            const response = await fetch(`${API_URL}/api/chatbot/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) throw new Error('Server error');

            const data = await response.json();

            if (data.conversationId) {
                this.conversationId = data.conversationId;
                if (this.userId) this.loadConversations();
            }

            // Handle AI actions (add to cart, profile updates, etc.)
            if (data.actions && data.actions.length > 0) {
                console.log('🎯 Received actions from AI:', data.actions);
                this.handleAIActions(data.actions);
            } else {
                console.log('ℹ️ No actions received from AI');
            }

            this.addBotMessage(data.message, data.sources, data.actions);

        } catch (error) {
            console.error('Chat error:', error);
            this.addBotMessage('😔 Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại.');
        } finally {
            this.hideTypingIndicator();
            this.setInputState(true);
            this.inputField.focus();
        }
    }

    addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addBotMessage(message, sources = [], actions = []) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        
        let sourcesHtml = '';
        if (sources && sources.length > 0) {
            sourcesHtml = `
                <div class="product-sources">
                    <h4>📚 Sản phẩm tham khảo:</h4>
                    ${sources.map((source, idx) => `
                        <div class="product-source">
                            <strong>${idx + 1}. ${this.escapeHtml(source.productName)}</strong><br>
                            <span>Danh mục: ${this.escapeHtml(source.category)} | 
                            Giá: ${source.price.toLocaleString('vi-VN')} VND</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Add action buttons
        let actionsHtml = '';
        if (actions && actions.length > 0) {
            actionsHtml = '<div class="action-buttons">';
            actions.forEach(action => {
                if (action.type === 'add_to_cart' && action.data) {
                    actionsHtml += `
                        <button class="action-btn view-cart-btn" onclick="window.location.href='/Page/homepage/cart.html'">
                            <i class="fas fa-shopping-cart"></i> Xem giỏ hàng
                        </button>
                    `;
                } else if (action.type === 'view_orders') {
                    actionsHtml += `
                        <button class="action-btn view-orders-btn" onclick="window.location.href='/Page/userpage/user.html#orders'">
                            <i class="fas fa-box"></i> Xem đơn hàng
                        </button>
                    `;
                } else if (action.type === 'profile_updated') {
                    actionsHtml += `
                        <button class="action-btn view-profile-btn" onclick="window.location.href='/Page/userpage/user.html'">
                            <i class="fas fa-user"></i> Xem hồ sơ
                        </button>
                    `;
                } else if (action.type === 'email_sent') {
                    actionsHtml += `
                        <span class="action-success"><i class="fas fa-check-circle"></i> Email đã gửi</span>
                    `;
                }
            });
            actionsHtml += '</div>';
        }
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                ${this.formatMessage(message)}
                ${sourcesHtml}
                ${actionsHtml}
            </div>
        `;
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    /**
     * Handle AI actions (add to cart, update profile, etc.)
     */
    handleAIActions(actions) {
        actions.forEach(action => {
            if (action.type === 'add_to_cart' && action.data) {
                // Add to cart in localStorage
                try {
                    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
                    
                    // ✅ Handle both single product and array of products
                    const products = Array.isArray(action.data) ? action.data : [action.data];
                    
                    console.log('🛒 Adding to cart:', products);
                    
                    products.forEach(productData => {
                        if (!productData || !productData.productId) {
                            console.warn('⚠️ Invalid product data:', productData);
                            return;
                        }
                        
                        // Check if product already exists
                        const existingIndex = cart.findIndex(item => item.productId === productData.productId);
                        
                        if (existingIndex >= 0) {
                            // Update quantity
                            cart[existingIndex].quantity += productData.quantity || 1;
                            console.log(`✅ Updated quantity for ${productData.productName}: ${cart[existingIndex].quantity}`);
                        } else {
                            // Add new item
                            cart.push({
                                productId: productData.productId,
                                productName: productData.productName || 'Sản phẩm',
                                price: productData.price || 0,
                                quantity: productData.quantity || 1,
                                image: productData.image || '/assets/default-product.png',
                            });
                            console.log(`✅ Added new product: ${productData.productName}`);
                        }
                    });
                    
                    localStorage.setItem('cart', JSON.stringify(cart));
                    
                    // Update cart badge if exists
                    const cartBadge = document.querySelector('.cart-badge, .cart-count');
                    if (cartBadge) {
                        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
                        cartBadge.textContent = totalItems;
                    }
                    
                    // Update cart count in header
                    if (typeof CartUtils !== 'undefined') {
                        CartUtils.updateCartCount();
                    }
                    
                    console.log('✅ Cart updated successfully. Total items:', cart.length);
                } catch (error) {
                    console.error('❌ Error adding to cart:', error);
                }
            } else if (action.type === 'profile_updated' && action.data) {
                // Update user data in localStorage
                try {
                    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
                    Object.assign(userData, action.data);
                    localStorage.setItem('user_data', JSON.stringify(userData));
                    
                    console.log('✅ Profile updated:', action.data);
                } catch (error) {
                    console.error('❌ Error updating profile:', error);
                }
            }
        });
    }

    formatMessage(message) {
        message = this.escapeHtml(message);
        const lines = message.split('\n');
        let html = '';
        for (let line of lines) {
            if (line.trim()) {
                line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                html += `<p>${line}</p>`;
            }
        }
        return html || '<p></p>';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setInputState(enabled) {
        this.inputField.disabled = !enabled;
        this.sendBtn.disabled = !enabled;
    }

    showTypingIndicator() {
        this.typingIndicator.classList.remove('hidden');
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.typingIndicator.classList.add('hidden');
    }

    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }

    async checkSystemStatus() {
        try {
            const response = await fetch(`${API_URL}/api/chatbot/status`);
            const status = await response.json();
            if (status.status !== 'ready') {
                this.addBotMessage('⚠️ Hệ thống AI đang khởi động...');
            }
        } catch (error) {
            console.error('Status check failed:', error);
        }
    }

    async loadConversations() {
        if (!this.userId) {
            console.log('⚠️ Chatbot Widget: Cannot load conversations - no userId');
            return;
        }

        console.log('🔄 Chatbot Widget: Loading conversations for userId:', this.userId);

        try {
            const response = await fetch(`${API_URL}/api/chatbot/conversations?userId=${this.userId}&limit=20`);
            if (!response.ok) {
                console.error('❌ Chatbot Widget: Failed to load conversations, status:', response.status);
                return;
            }

            const conversations = await response.json();
            console.log('📋 Chatbot Widget: Loaded conversations:', conversations.length, conversations);
            
            if (!conversations || conversations.length === 0) {
                this.conversationsList.innerHTML = `
                    <div class="no-conversations">
                        <i class="fas fa-comments"></i>
                        <p>Chưa có hội thoại</p>
                    </div>
                `;
                return;
            }
            
            // Auto show sidebar if has conversations (always show for users with history)
            if (conversations.length > 0) {
                console.log('✅ Chatbot Widget: Auto-showing sidebar with', conversations.length, 'conversations');
                this.showSidebar();
            } else {
                console.log('ℹ️ Chatbot Widget: No conversations to show');
            }
            
            this.conversationsList.innerHTML = conversations.map(conv => {
                const lastMessage = conv.messages[0]?.content || 'Chưa có tin nhắn';
                const messageCount = conv._count?.messages || 0;
                const date = this.formatDate(conv.updatedAt);
                const isActive = conv.id === this.conversationId;
                
                return `
                    <div class="conversation-item ${isActive ? 'active' : ''}" data-id="${conv.id}">
                        <div class="conversation-content">
                            <div class="conversation-title">${this.escapeHtml(conv.title || 'Hội thoại mới')}</div>
                            <div class="conversation-preview">${this.escapeHtml(lastMessage)}</div>
                            <div class="conversation-meta">
                                <span class="conversation-date">
                                    <i class="fas fa-clock"></i> ${date}
                                </span>
                                <span class="conversation-count">${messageCount}</span>
                            </div>
                        </div>
                        <button class="btn-delete-conversation" data-conversation-id="${conv.id}" title="Xóa hội thoại">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            }).join('');
            
            this.conversationsList.querySelectorAll('.conversation-item').forEach(item => {
                const contentArea = item.querySelector('.conversation-content');
                contentArea.addEventListener('click', () => {
                    this.loadConversation(item.dataset.id);
                });
            });

            // Attach delete button handlers
            this.conversationsList.querySelectorAll('.btn-delete-conversation').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const conversationId = btn.dataset.conversationId;
                    this.deleteConversation(conversationId);
                });
            });
            
        } catch (error) {
            console.error('Load conversations error:', error);
        }
    }

    async loadConversation(conversationId) {
        try {
            const url = `${API_URL}/api/chatbot/conversations/${conversationId}${this.userId ? '?userId=' + this.userId : ''}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error('Conversation not found');
            
            const conversation = await response.json();
            
            this.messagesContainer.innerHTML = '';
            
            conversation.messages.forEach(msg => {
                if (msg.role === 'USER') {
                    this.addUserMessage(msg.content);
                } else {
                    const sources = msg.metadata?.products || [];
                    this.addBotMessage(msg.content, sources.map(p => ({
                        productId: p.id,
                        productName: p.name,
                        price: p.price,
                        category: 'N/A',
                        relevanceScore: p.score || 0,
                    })));
                }
            });
            
            this.conversationId = conversationId;
            this.loadConversations();
            
        } catch (error) {
            console.error('Load conversation error:', error);
        }
    }

    startNewConversation() {
        this.conversationId = null;
        this.messagesContainer.innerHTML = `
            <div class="message bot">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>Xin chào! Tôi là trợ lý AI của MatFlow. Bạn cần tư vấn gì?</p>
                </div>
            </div>
        `;
        this.loadConversations();
        this.inputField.focus();
    }

    async deleteConversation(conversationId) {
        if (!conversationId) return;
        
        const confirmed = confirm('Bạn có chắc muốn xóa hội thoại này?');
        if (!confirmed) return;
        
        try {
            const url = `${API_URL}/api/chatbot/conversations/${conversationId}${this.userId ? '?userId=' + this.userId : ''}`;
            const response = await fetch(url, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete conversation');
            }
            
            console.log('✅ Deleted conversation:', conversationId);
            
            // If deleted conversation is current, start new conversation
            if (this.conversationId === conversationId) {
                this.startNewConversation();
            }
            
            // Reload conversation list
            await this.loadConversations();
            
        } catch (error) {
            console.error('❌ Delete conversation error:', error);
            alert('Không thể xóa hội thoại. Vui lòng thử lại.');
        }
    }

    async clearAllHistory() {
        if (!this.userId) {
            alert('Vui lòng đăng nhập để xóa lịch sử.');
            return;
        }
        
        const confirmed = confirm('Bạn có chắc muốn xóa TẤT CẢ lịch sử trò chuyện?\nHành động này không thể hoàn tác!');
        if (!confirmed) return;
        
        try {
            // Get all conversations
            const response = await fetch(`${API_URL}/api/chatbot/conversations?userId=${this.userId}&limit=1000`);
            if (!response.ok) throw new Error('Failed to fetch conversations');
            
            const conversations = await response.json();
            
            if (!conversations || conversations.length === 0) {
                alert('Không có lịch sử để xóa.');
                return;
            }
            
            // Delete all conversations
            const deletePromises = conversations.map(conv => 
                fetch(`${API_URL}/api/chatbot/conversations/${conv.id}?userId=${this.userId}`, {
                    method: 'DELETE',
                })
            );
            
            await Promise.all(deletePromises);
            
            console.log(`✅ Deleted ${conversations.length} conversations`);
            alert(`Đã xóa ${conversations.length} hội thoại thành công!`);
            
            // Start new conversation
            this.startNewConversation();
            
            // Reload conversation list
            await this.loadConversations();
            
        } catch (error) {
            console.error('❌ Clear all history error:', error);
            alert('Không thể xóa lịch sử. Vui lòng thử lại.');
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút`;
        if (diffHours < 24) return `${diffHours} giờ`;
        if (diffDays < 7) return `${diffDays} ngày`;
        
        return date.toLocaleDateString('vi-VN');
    }
}

// Initialize widget when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ChatbotWidget();
});

