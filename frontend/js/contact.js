// Contact Form Handler - MatFlow
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    const status = document.getElementById('status');
    const submitBtn = document.getElementById('submitBtn');
    const submitBtnText = submitBtn.querySelector('span');
    const submitBtnIcon = submitBtn.querySelector('i');
  
    // Backend API URL (NestJS)
    const API_URL = 'http://localhost:3000/api/contact';
  
    // Form validation
    const validateForm = (formData) => {
      const errors = [];
      
      if (!formData.name.trim()) {
        errors.push('Họ và tên không được để trống');
      }
      
      if (!formData.email.trim()) {
        errors.push('Email không được để trống');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.push('Email không hợp lệ');
      }
      
      if (!formData.subject.trim()) {
        errors.push('Tiêu đề không được để trống');
      } else if (formData.subject.trim().length < 3) {
        errors.push('Tiêu đề phải có ít nhất 3 ký tự');
      }
      
      if (!formData.message.trim()) {
        errors.push('Nội dung không được để trống');
      } else if (formData.message.trim().length < 10) {
        errors.push('Nội dung phải có ít nhất 10 ký tự');
      }
      
      return errors;
    };
  
    // Show status message
    const showStatus = (message, type = 'info') => {
      status.textContent = message;
      status.className = `contact-status ${type}`;
      
      // Auto hide success messages
      if (type === 'success') {
        setTimeout(() => {
          status.textContent = '';
          status.className = 'contact-status';
        }, 5000);
      }
    };
  
    // Set loading state
    const setLoading = (isLoading) => {
      submitBtn.disabled = isLoading;
      
      if (isLoading) {
        submitBtnText.textContent = 'Đang gửi...';
        submitBtnIcon.className = 'fa-solid fa-spinner fa-spin';
        submitBtn.style.opacity = '0.7';
      } else {
        submitBtnText.textContent = 'Gửi tin nhắn';
        submitBtnIcon.className = 'fa-solid fa-paper-plane';
        submitBtn.style.opacity = '1';
      }
    };
  
    // Form submit handler
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const formData = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        subject: form.subject.value.trim(),
        message: form.message.value.trim(),
      };
  
      // Validate form
      const validationErrors = validateForm(formData);
      if (validationErrors.length > 0) {
        showStatus(`⚠️ ${validationErrors[0]}`, 'error');
        return;
      }
  
      // Set loading state
      setLoading(true);
      showStatus('', '');
  
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(formData),
        });
  
        const data = await response.json();
  
        if (response.ok) {
          showStatus('✅ Tin nhắn đã được gửi thành công! Chúng tôi sẽ phản hồi sớm nhất có thể.', 'success');
          form.reset();
          
          // Reset form focus
          form.name.focus();
        } else {
          const errorMessage = data.error || data.message || 'Có lỗi xảy ra khi gửi tin nhắn';
          showStatus(`❌ ${errorMessage}`, 'error');
        }
      } catch (error) {
        console.error('❌ Contact form error:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          showStatus('❌ Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.', 'error');
        } else {
          showStatus('❌ Có lỗi xảy ra. Vui lòng thử lại sau.', 'error');
        }
      } finally {
        setLoading(false);
      }
    });
  
    // Real-time validation
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        const formData = {
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          subject: form.subject.value.trim(),
          message: form.message.value.trim(),
        };
        
        const validationErrors = validateForm(formData);
        const fieldName = input.name;
        
        // Find specific error for this field
        const fieldError = validationErrors.find(error => {
          if (fieldName === 'name') return error.includes('Họ và tên');
          if (fieldName === 'email') return error.includes('Email');
          if (fieldName === 'subject') return error.includes('Tiêu đề');
          if (fieldName === 'message') return error.includes('Nội dung');
          return false;
        });
        
        if (fieldError) {
          input.style.borderColor = '#e74c3c';
          input.style.boxShadow = '0 0 0 3px rgba(231, 76, 60, 0.1)';
        } else {
          input.style.borderColor = '#20b2aa';
          input.style.boxShadow = '0 0 0 3px rgba(32, 178, 170, 0.1)';
        }
      });
      
      input.addEventListener('input', () => {
        // Reset styling on input
        input.style.borderColor = '';
        input.style.boxShadow = '';
      });
    });
  });
  