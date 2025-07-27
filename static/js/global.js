// ===== GLOBAL JAVASCRIPT =====

// Theme Management
class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('theme') || 'light';
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.setupEventListeners();
  }

  applyTheme(theme) {
    const body = document.body;
    const lightThemeBtn = document.getElementById('lightTheme');
    const darkThemeBtn = document.getElementById('darkTheme');
    const lightThemeBtnSettings = document.getElementById('lightThemeBtn');
    const darkThemeBtnSettings = document.getElementById('darkThemeBtn');

    if (theme === 'dark') {
      body.classList.add('dark-theme');
      body.classList.remove('light-theme');
      if (lightThemeBtn) lightThemeBtn.classList.remove('active');
      if (darkThemeBtn) darkThemeBtn.classList.add('active');
      if (lightThemeBtnSettings) lightThemeBtnSettings.classList.remove('active');
      if (darkThemeBtnSettings) darkThemeBtnSettings.classList.add('active');
    } else {
      body.classList.remove('dark-theme');
      body.classList.add('light-theme');
      if (lightThemeBtn) lightThemeBtn.classList.add('active');
      if (darkThemeBtn) darkThemeBtn.classList.remove('active');
      if (lightThemeBtnSettings) lightThemeBtnSettings.classList.add('active');
      if (darkThemeBtnSettings) darkThemeBtnSettings.classList.remove('active');
    }

    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
  }

  setupEventListeners() {
    // Navigation theme buttons
    const lightThemeBtn = document.getElementById('lightTheme');
    const darkThemeBtn = document.getElementById('darkTheme');

    if (lightThemeBtn) {
      lightThemeBtn.addEventListener('click', () => {
        this.applyTheme('light');
      });
    }

    if (darkThemeBtn) {
      darkThemeBtn.addEventListener('click', () => {
        this.applyTheme('dark');
      });
    }

    // Settings page theme buttons
    const lightThemeBtnSettings = document.getElementById('lightThemeBtn');
    const darkThemeBtnSettings = document.getElementById('darkThemeBtn');

    if (lightThemeBtnSettings) {
      lightThemeBtnSettings.addEventListener('click', () => {
        this.applyTheme('light');
      });
    }

    if (darkThemeBtnSettings) {
      darkThemeBtnSettings.addEventListener('click', () => {
        this.applyTheme('dark');
      });
    }
  }
}

// Utility Functions
class Utils {
  static showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#4f46e5'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      max-width: 400px;
      animation: slideIn 0.3s ease;
    `;

    // Add to page
    document.body.appendChild(notification);

    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.remove();
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  static formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  static validateFile(file, allowedTypes = ['.pdf'], maxSize = 50 * 1024 * 1024) {
    const errors = [];

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      errors.push(`File type ${fileExtension} is not supported. Please upload a PDF file.`);
    }

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds the maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(0)}MB.`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static async fetchWithTimeout(url, options = {}, timeout = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }
}

// LocalStorage Management
class StorageManager {
  static getBooks() {
    try {
      const books = localStorage.getItem('books');
      return books ? JSON.parse(books) : {};
    } catch (error) {
      console.error('Error reading books from localStorage:', error);
      return {};
    }
  }

  static saveBooks(books) {
    try {
      localStorage.setItem('books', JSON.stringify(books));
      return true;
    } catch (error) {
      console.error('Error saving books to localStorage:', error);
      return false;
    }
  }

  static getCurrentBook() {
    try {
      return localStorage.getItem('currentBook');
    } catch (error) {
      console.error('Error reading current book from localStorage:', error);
      return null;
    }
  }

  static setCurrentBook(bookTitle) {
    try {
      localStorage.setItem('currentBook', bookTitle);
      return true;
    } catch (error) {
      console.error('Error saving current book to localStorage:', error);
      return false;
    }
  }

  static getSettings() {
    try {
      const settings = localStorage.getItem('settings');
      return settings ? JSON.parse(settings) : {
        theme: 'light',
        fontSize: 16,
        defaultReadingMode: 'inline',
        defaultAudioSpeed: 1,
        preferredLanguage: ''
      };
    } catch (error) {
      console.error('Error reading settings from localStorage:', error);
      return {
        theme: 'light',
        fontSize: 16,
        defaultReadingMode: 'inline',
        defaultAudioSpeed: 1,
        preferredLanguage: ''
      };
    }
  }

  static saveSettings(settings) {
    try {
      localStorage.setItem('settings', JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
      return false;
    }
  }

  static clearAllData() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
}

// API Helper
class APIHelper {
  static async translatePDF(file, targetLanguage) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target_language', targetLanguage);

    try {
      const response = await Utils.fetchWithTimeout('/translate-pdf', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Translation failed');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  static async getLanguages() {
    try {
      const response = await Utils.fetchWithTimeout('/languages');
      
      if (!response.ok) {
        throw new Error('Failed to fetch languages');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch languages: ${error.message}`);
    }
  }

  static async speak(text, languageCode, voiceGender = 'male') {
    try {
      const response = await Utils.fetchWithTimeout('/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          language_code: languageCode,
          voice_gender: voiceGender
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Audio generation failed');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Audio generation failed: ${error.message}`);
    }
  }

  static async speechToText(audioBlob) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await Utils.fetchWithTimeout('/speech-to-text', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Speech recognition failed');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Speech recognition failed: ${error.message}`);
    }
  }
}

// Initialize global functionality
document.addEventListener('DOMContentLoaded', function() {
  // Initialize theme manager
  window.themeManager = new ThemeManager();
  
  // Make utilities globally available
  window.Utils = Utils;
  window.StorageManager = StorageManager;
  window.APIHelper = APIHelper;

  // Add notification styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    .notification-close {
      background: none;
      border: none;
      color: white;
      font-size: 1.25rem;
      cursor: pointer;
      margin-left: 1rem;
      opacity: 0.8;
      transition: opacity 0.3s ease;
    }
    
    .notification-close:hover {
      opacity: 1;
    }
    
    .notification-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  `;
  document.head.appendChild(style);
}); 