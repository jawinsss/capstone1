// Categories Management JavaScript
class CategoriesManager {
    constructor() {
        this.categories = [];
        this.mainCategories = [];
        this.subCategories = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadCategories();
    }

    bindEvents() {
        // Tab switching
        document.getElementById('categoriesListTab')?.addEventListener('click', () => {
            this.showCategoriesList();
        });

        document.getElementById('addCategoryTab')?.addEventListener('click', () => {
            this.showAddCategory();
        });

        // Form submission
        document.getElementById('addCategoryForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCategory();
        });

        // Cancel add category
        document.getElementById('cancelAddCategory')?.addEventListener('click', () => {
            this.showCategoriesList();
            this.resetForm();
        });

        // Refresh categories
        document.getElementById('refreshCategories')?.addEventListener('click', () => {
            this.loadCategories();
        });
    }

    async loadCategories() {
        try {
            const response = await apiService.get('/categories');
            this.categories = response.data || [];
            this.updateStats();
            this.renderCategoriesTree();
            this.loadParentCategories();
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showError('Không thể tải danh sách danh mục');
        }
    }

    async loadParentCategories() {
        try {
            const response = await apiService.get('/categories/main');
            this.mainCategories = response.data || [];
            this.populateParentSelect();
        } catch (error) {
            console.error('Error loading main categories:', error);
        }
    }

    populateParentSelect() {
        const select = document.getElementById('parentCategory');
        if (!select) return;

        // Clear existing options except the first one
        select.innerHTML = '<option value="">Chọn danh mục cha (để trống nếu là danh mục chính)</option>';
        
        this.mainCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    }

    updateStats() {
        const totalCategories = this.categories.length;
        const mainCategories = this.categories.filter(cat => !cat.parentId).length;
        const subCategories = this.categories.filter(cat => cat.parentId).length;
        const activeCategories = this.categories.filter(cat => cat.isActive).length;

        document.getElementById('totalCategories').textContent = totalCategories;
        document.getElementById('mainCategories').textContent = mainCategories;
        document.getElementById('subCategories').textContent = subCategories;
        document.getElementById('activeCategories').textContent = activeCategories;
    }

    renderCategoriesTree() {
        const container = document.getElementById('categoriesTree');
        if (!container) return;

        if (this.categories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-tags"></i>
                    <div>Chưa có danh mục nào</div>
                    <div style="margin-top: 8px; font-size: 0.875rem;">Hãy thêm danh mục đầu tiên</div>
                </div>
            `;
            return;
        }

        const mainCategories = this.categories.filter(cat => !cat.parentId);
        const subCategories = this.categories.filter(cat => cat.parentId);

        let html = '';
        mainCategories.forEach(category => {
            html += this.renderCategoryItem(category, false);
            
            // Render subcategories
            const children = subCategories.filter(sub => sub.parentId === category.id);
            if (children.length > 0) {
                html += '<div class="category-children">';
                children.forEach(child => {
                    html += this.renderCategoryItem(child, true);
                });
                html += '</div>';
            }
        });

        container.innerHTML = html;
        this.bindCategoryActions();
    }

    renderCategoryItem(category, isSubCategory) {
        const categoryClass = isSubCategory ? 'sub-category' : 'main-category';
        const icon = isSubCategory ? 'fa-tag' : 'fa-folder';
        
        return `
            <div class="category-item ${categoryClass}" data-category-id="${category.id}">
                <div class="category-info">
                    <div class="category-name">
                        <i class="fa-solid ${icon}"></i>
                        ${category.name}
                    </div>
                    ${category.description ? `<div class="category-description">${category.description}</div>` : ''}
                </div>
                <div class="category-actions">
                    <button class="btn" onclick="categoriesManager.editCategory('${category.id}')" title="Chỉnh sửa">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                    <button class="btn" onclick="categoriesManager.deleteCategory('${category.id}')" title="Xóa" style="background: #ef4444; color: white; border-color: #dc2626;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    bindCategoryActions() {
        // Actions are bound via onclick in the rendered HTML
    }

    async addCategory() {
        const name = document.getElementById('categoryName').value.trim();
        const parentId = document.getElementById('parentCategory').value;
        const description = document.getElementById('categoryDescription').value.trim();

        if (!name) {
            this.showError('Vui lòng nhập tên danh mục');
            return;
        }

        try {
            const categoryData = {
                name,
                description: description || undefined,
                parentId: parentId || undefined
            };

            const response = await apiService.post('/categories', categoryData);
            
            this.showSuccess('Thêm danh mục thành công');
            this.resetForm();
            this.loadCategories();
            this.showCategoriesList();
        } catch (error) {
            console.error('Error adding category:', error);
            this.showError('Không thể thêm danh mục: ' + (error.response?.data?.message || error.message));
        }
    }

    async editCategory(categoryId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        if (!category) return;

        const newName = prompt('Nhập tên mới cho danh mục:', category.name);
        if (!newName || newName.trim() === category.name) return;

        const newDescription = prompt('Nhập mô tả mới (để trống nếu không thay đổi):', category.description || '');

        try {
            const updateData = {
                name: newName.trim(),
                description: newDescription.trim() || undefined
            };

            await apiService.put(`/categories/${categoryId}`, updateData);
            
            this.showSuccess('Cập nhật danh mục thành công');
            this.loadCategories();
        } catch (error) {
            console.error('Error updating category:', error);
            this.showError('Không thể cập nhật danh mục: ' + (error.response?.data?.message || error.message));
        }
    }

    async deleteCategory(categoryId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        if (!category) return;

        const confirmMessage = `Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`;
        if (!confirm(confirmMessage)) return;

        try {
            await apiService.delete(`/categories/${categoryId}?hard=true`);
            
            this.showSuccess('Xóa danh mục thành công');
            this.loadCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            this.showError('Không thể xóa danh mục: ' + (error.response?.data?.message || error.message));
        }
    }

    showCategoriesList() {
        document.getElementById('categoriesListView').style.display = 'block';
        document.getElementById('addCategoryView').style.display = 'none';
        
        // Update tab states
        document.getElementById('categoriesListTab').classList.add('active');
        document.getElementById('addCategoryTab').classList.remove('active');
    }

    showAddCategory() {
        document.getElementById('categoriesListView').style.display = 'none';
        document.getElementById('addCategoryView').style.display = 'block';
        
        // Update tab states
        document.getElementById('categoriesListTab').classList.remove('active');
        document.getElementById('addCategoryTab').classList.add('active');
    }

    resetForm() {
        document.getElementById('addCategoryForm').reset();
    }

    showSuccess(message) {
        // Simple success notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            font-weight: 500;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }

    showError(message) {
        // Simple error notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            font-weight: 500;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 5000);
    }
}

// Initialize categories manager when DOM is loaded
let categoriesManager;
document.addEventListener('DOMContentLoaded', () => {
    categoriesManager = new CategoriesManager();
});
