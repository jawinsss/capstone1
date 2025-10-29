/**
 * SearchDropdown - A reusable search dropdown component
 * Supports search, pagination, and keyboard navigation
 */
class SearchDropdown {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      placeholder: 'Tìm kiếm...',
      apiUrl: '',
      searchParam: 'search',
      pageParam: 'page',
      limitParam: 'limit',
      limit: 5,
      debounceDelay: 300,
      showLoadMore: true, // Option to show/hide load more button
      onSelect: () => {},
      onLoadMore: () => {},
      ...options
    };
    
    this.currentPage = 1;
    this.hasMore = false;
    this.isLoading = false;
    this.searchTimeout = null;
    this.selectedIndex = -1;
    this.items = [];
    
    this.init();
  }
  
  init() {
    this.createHTML();
    this.bindEvents();
    this.loadInitialData();
  }
  
  createHTML() {
    this.container.innerHTML = `
      <div class="search-dropdown">
        <div class="search-dropdown-input-container" style="position: relative;">
          <input 
            type="text" 
            class="search-dropdown-input" 
            placeholder="${this.options.placeholder}"
            autocomplete="off"
          >
          <button class="search-dropdown-clear" style="display: none;">×</button>
        </div>
        <div class="search-dropdown-list"></div>
      </div>
    `;
    
    this.input = this.container.querySelector('.search-dropdown-input');
    this.list = this.container.querySelector('.search-dropdown-list');
    this.clearBtn = this.container.querySelector('.search-dropdown-clear');
  }
  
  bindEvents() {
    // Input events
    this.input.addEventListener('input', (e) => this.handleInput(e));
    this.input.addEventListener('focus', () => this.showList());
    this.input.addEventListener('blur', (e) => this.handleBlur(e));
    this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
    
    // Clear button
    this.clearBtn.addEventListener('click', () => this.clearSearch());
    
    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.hideList();
      }
    });
  }
  
  handleInput(e) {
    const query = e.target.value.trim();
    
    // Show/hide clear button
    this.clearBtn.style.display = query ? 'block' : 'none';
    
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Debounce search
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.items = [];
      this.loadData(query);
    }, this.options.debounceDelay);
  }
  
  handleBlur(e) {
    // Delay hiding to allow for item selection
    setTimeout(() => {
      if (!this.container.contains(document.activeElement)) {
        this.hideList();
      }
    }, 150);
  }
  
  handleKeydown(e) {
    if (!this.list.classList.contains('show')) return;
    
    const items = this.list.querySelectorAll('.search-dropdown-item');
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
        this.updateHighlight();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateHighlight();
        break;
      case 'Enter':
        e.preventDefault();
        if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
          items[this.selectedIndex].click();
        }
        break;
      case 'Escape':
        this.hideList();
        this.input.blur();
        break;
    }
  }
  
  updateHighlight() {
    const items = this.list.querySelectorAll('.search-dropdown-item');
    items.forEach((item, index) => {
      item.classList.toggle('highlighted', index === this.selectedIndex);
    });
  }
  
  async loadData(query = '', page = 1) {
    if (this.isLoading) return;
    
    // Skip if no API URL is set
    if (!this.options.apiUrl) {
      this.showNoResults();
      return;
    }
    
    this.isLoading = true;
    this.showLoading();
    
    try {
      const params = new URLSearchParams({
        [this.options.pageParam]: page,
        [this.options.limitParam]: this.options.limit
      });
      
      if (query) {
        params.set(this.options.searchParam, query);
      }
      
      const response = await fetch(`${this.options.apiUrl}?${params}`);
      const data = await response.json();
      
      if (data.success) {
        if (page === 1) {
          this.items = data.data;
        } else {
          this.items = [...this.items, ...data.data];
        }
        
        this.hasMore = data.meta?.hasMore || false;
        this.currentPage = page;
        this.renderItems();
      } else {
        this.showError(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.showError('Không thể tải dữ liệu');
    } finally {
      this.isLoading = false;
    }
  }
  
  async loadInitialData() {
    await this.loadData('', 1);
  }
  
  renderItems() {
    if (this.items.length === 0) {
      this.showNoResults();
      return;
    }
    
    const html = this.items.map((item, index) => `
      <div class="search-dropdown-item" data-index="${index}">
        ${item.name_with_type || item.name}
      </div>
    `).join('');
    
    // Only show "Load more" button if enabled in options and there are more items
    const loadMoreHtml = (this.options.showLoadMore && this.hasMore) ? `
      <div class="search-dropdown-load-more">
        <button type="button">Tải thêm...</button>
      </div>
    ` : '';
    
    this.list.innerHTML = html + loadMoreHtml;
    
    // Bind item click events
    this.list.querySelectorAll('.search-dropdown-item').forEach((item, index) => {
      item.addEventListener('click', () => this.selectItem(this.items[index]));
    });
    
    // Bind load more event
    const loadMoreBtn = this.list.querySelector('.search-dropdown-load-more button');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => this.loadMore());
    }
    
    this.showList();
  }
  
  selectItem(item) {
    this.input.value = item.name_with_type || item.name;
    this.hideList();
    this.options.onSelect(item);
  }
  
  loadMore() {
    if (this.hasMore && !this.isLoading) {
      this.loadData(this.input.value.trim(), this.currentPage + 1);
    }
  }
  
  showList() {
    this.list.classList.add('show');
  }
  
  hideList() {
    this.list.classList.remove('show');
    this.selectedIndex = -1;
  }
  
  showLoading() {
    this.list.innerHTML = '<div class="search-dropdown-loading">Đang tải...</div>';
    this.showList();
  }
  
  showNoResults() {
    const message = !this.options.apiUrl ? 'Vui lòng chọn tỉnh/thành phố trước' : 'Không tìm thấy kết quả';
    this.list.innerHTML = `<div class="search-dropdown-no-results">${message}</div>`;
    this.showList();
  }
  
  showError(message) {
    this.list.innerHTML = `<div class="search-dropdown-no-results">${message}</div>`;
    this.showList();
  }
  
  clearSearch() {
    this.input.value = '';
    this.clearBtn.style.display = 'none';
    this.currentPage = 1;
    this.items = [];
    this.loadData('', 1);
  }
  
  getValue() {
    return this.input.value;
  }
  
  setValue(value) {
    this.input.value = value;
    this.clearBtn.style.display = value ? 'block' : 'none';
  }
  
  disable() {
    this.input.disabled = true;
    this.input.style.cursor = 'not-allowed';
    this.input.style.opacity = '0.6';
    this.input.style.backgroundColor = '#f5f5f5';
    this.input.readOnly = true;
    this.hideList();
  }
  
  enable() {
    this.input.disabled = false;
    this.input.readOnly = false;
    this.input.style.cursor = 'text';
    this.input.style.opacity = '1';
    this.input.style.backgroundColor = '';
    this.input.style.pointerEvents = 'auto';
    console.log('🔓 Dropdown input enabled:', {
      disabled: this.input.disabled,
      readOnly: this.input.readOnly,
      placeholder: this.input.placeholder
    });
  }
  
  destroy() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.container.innerHTML = '';
  }
}

// Export for use in other files
window.SearchDropdown = SearchDropdown;
