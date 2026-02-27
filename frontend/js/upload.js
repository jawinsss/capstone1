// Image Upload and Preview System
class ImageUploader {
    constructor(options = {}) {
        this.maxFiles = options.maxFiles || 10;
        this.maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB
        this.allowedTypes = options.allowedTypes || ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        this.uploadZone = null;
        this.fileInput = null;
        this.previewContainer = null;
        this.selectedFiles = [];
        this.onChange = options.onChange || (() => {});
    }

    // Initialize uploader
    init(containerId) {
        this.uploadZone = document.getElementById(containerId);
        if (!this.uploadZone) {
            console.error(`Dang tai anh voi id "${containerId}" not found`);
            return;
        }

        this.setupUploadZone();
        this.createFileInput();
        this.createPreviewContainer();
        this.bindEvents();
    }

    // Setup upload zone HTML
    setupUploadZone() {
        this.uploadZone.innerHTML = `
            <div class="upload-content">
                <div class="upload-icon">📁</div>
                <div class="upload-text">
                    <p>Kéo thả hình ảnh vào đây hoặc</p>
                    <button type="button" class="upload-btn">Chọn tệp</button>
                </div>
                <div class="upload-info">
                    <small>Hỗ trợ: JPG, PNG, GIF, WebP (Tối đa ${this.maxFiles} ảnh, ${this.formatFileSize(this.maxSize)} mỗi ảnh)</small>
                </div>
            </div>
            <div class="upload-preview" id="preview-${this.uploadZone.id}">
                <div class="preview-grid"></div>
            </div>
        `;
    }

    // Create hidden file input
    createFileInput() {
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.multiple = true;
        this.fileInput.accept = this.allowedTypes.join(',');
        this.fileInput.style.display = 'none';
        this.uploadZone.appendChild(this.fileInput);
    }

    // Create preview container
    createPreviewContainer() {
        this.previewContainer = document.querySelector(`#preview-${this.uploadZone.id} .preview-grid`);
    }

    // Bind events
    bindEvents() {
        // Click to select files
        const uploadBtn = this.uploadZone.querySelector('.upload-btn');
        uploadBtn.addEventListener('click', () => this.fileInput.click());

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            this.handleFiles(Array.from(e.target.files));
        });

        // Drag and drop events
        this.uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadZone.classList.add('dragover');
        });

        this.uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.uploadZone.classList.remove('dragover');
        });

        this.uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadZone.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });
    }

    // Handle selected files
    handleFiles(files) {
        const validFiles = this.validateFiles(files);
        
        if (validFiles.length === 0) return;

        // Check if adding these files would exceed max limit
        if (this.selectedFiles.length + validFiles.length > this.maxFiles) {
            alert(`Chỉ có thể chọn tối đa ${this.maxFiles} hình ảnh`);
            return;
        }

        // Add valid files to selection
        validFiles.forEach(file => {
            this.selectedFiles.push(file);
        });

        this.updatePreview();
        this.onChange(this.selectedFiles);
    }

    // Validate files
    validateFiles(files) {
        const validFiles = [];
        
        files.forEach(file => {
            // Check file type
            if (!this.allowedTypes.includes(file.type)) {
                alert(`File "${file.name}" không được hỗ trợ. Chỉ chấp nhận: ${this.allowedTypes.join(', ')}`);
                return;
            }

            // Check file size
            if (file.size > this.maxSize) {
                alert(`File "${file.name}" quá lớn. Kích thước tối đa: ${this.formatFileSize(this.maxSize)}`);
                return;
            }

            // Check if file already exists
            const exists = this.selectedFiles.some(existingFile => 
                existingFile.name === file.name && existingFile.size === file.size
            );
            
            if (exists) {
                alert(`File "${file.name}" đã được chọn`);
                return;
            }

            validFiles.push(file);
        });

        return validFiles;
    }

    // Update preview
    updatePreview() {
        if (!this.previewContainer) return;

        this.previewContainer.innerHTML = '';

        const uploadPreview = this.previewContainer.parentElement;
        
        if (this.selectedFiles.length === 0) {
            uploadPreview.style.display = 'none';
            return;
        }

        uploadPreview.style.display = 'block';

        this.selectedFiles.forEach((file, index) => {
            const previewItem = this.createPreviewItem(file, index);
            this.previewContainer.appendChild(previewItem);
        });
    }

    // Create preview item
    createPreviewItem(file, index) {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.dataset.index = index;

        const reader = new FileReader();
        reader.onload = (e) => {
            // Get short filename (max 8 characters)
            const shortName = file.name.length > 8 ? file.name.substring(0, 8) + '...' : file.name;
            
            item.innerHTML = `
                <div class="preview-image">
                    <img src="${e.target.result}" alt="${file.name}">
                    <div class="preview-overlay">
                        <button type="button" class="preview-remove" data-index="${index}">×</button>
                    </div>
                </div>
                <div class="preview-info">
                    ${shortName}
                </div>
            `;

            // Bind remove event
            const removeBtn = item.querySelector('.preview-remove');
            removeBtn.addEventListener('click', () => this.removeFile(index));
        };

        reader.readAsDataURL(file);
        return item;
    }

    // Remove file
    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updatePreview();
        this.onChange(this.selectedFiles);
    }

    // Get selected files
    getFiles() {
        return this.selectedFiles;
    }

    // Clear all files
    clear() {
        this.selectedFiles = [];
        this.updatePreview();
        this.fileInput.value = '';
        this.onChange(this.selectedFiles);
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Load external CSS for upload component
function loadUploadCSS() {
    const existingLink = document.querySelector('link[href*="upload.css"]');
    if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'styles/upload.css';
        document.head.appendChild(link);
    }
}

// Load CSS when script loads
loadUploadCSS();

// Export for global use
window.ImageUploader = ImageUploader;
